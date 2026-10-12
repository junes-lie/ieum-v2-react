param([Parameter(Mandatory)][string]$PythonPath,[Parameter(Mandatory)][string]$OutputDir)
$ErrorActionPreference='Stop'
if(Test-Path -LiteralPath $OutputDir){throw 'Preserve prior guard evidence'}
New-Item -ItemType Directory -Path $OutputDir | Out-Null
$fixture=Join-Path $OutputDir 'owned-tree.py'
@'
import json, os, subprocess, sys, time
from pathlib import Path
role, folder, seconds = sys.argv[1:]
Path(folder, role + '.json').write_text(json.dumps({'pid':os.getpid()}))
if role in ('root','child'):
    subprocess.run([sys.executable,__file__,'child' if role=='root' else 'grandchild',folder,seconds],check=True)
else:
    time.sleep(float(seconds))
'@ | Set-Content -LiteralPath $fixture -Encoding utf8
$guard=(Resolve-Path (Join-Path $PSScriptRoot 'run-ai-resource-guard.ps1')).Path
$sentinelDir=Join-Path $OutputDir 'sentinel'
New-Item -ItemType Directory -Path $sentinelDir | Out-Null
$sentinel=Start-Process -FilePath $PythonPath -ArgumentList @(('"'+$fixture+'"'),'sentinel',('"'+$sentinelDir+'"'),'30') -WindowStyle Hidden -PassThru
try {
 foreach($mode in @('normal','pressure')) {
  $folder=Join-Path $OutputDir $mode
  New-Item -ItemType Directory -Path $folder | Out-Null
  # Shadow only the OS free-RAM reader in this test scope. Process discovery is
  # real, and no physical RAM pressure or production threshold change is used.
  $script:qaRamCalls=0
  function Get-CimInstance {
   param([string]$ClassName,[string[]]$Property)
   if($ClassName -eq 'Win32_OperatingSystem') {
    $script:qaRamCalls++
    $free=if($mode -eq 'pressure' -and $script:qaRamCalls -gt 2){3}else{9}
    return [pscustomobject]@{FreePhysicalMemory=$free*1MB}
   }
   CimCmdlets\Get-CimInstance @PSBoundParameters
  }
  $prefix=Join-Path $folder 'guard'
  $seconds=if($mode -eq 'normal'){'4'}else{'25'}
  & $guard -PythonPath $PythonPath -GenerationArgs @(('"'+$fixture+'"'),'root',('"'+$folder+'"'),$seconds) -LogPrefix $prefix | Out-Null
  $summary=Get-Content -LiteralPath ($prefix+'.summary.json') | ConvertFrom-Json
  if($LASTEXITCODE -ne $summary.ExitCode){throw 'Guard did not propagate the actual worker exit code'}
  $samples=Get-Content -LiteralPath ($prefix+'.monitor.jsonl') | ForEach-Object {$_|ConvertFrom-Json}
  $observed=@($samples|ForEach-Object {$_.Owned.Id}|Sort-Object -Unique)
  foreach($role in @('root','child','grandchild')) {
   $record=Get-Content -LiteralPath (Join-Path $folder ($role+'.json')) | ConvertFrom-Json
   if($record.pid -notin $observed){throw "Guard missed $role in $mode"}
   if(Get-Process -Id $record.pid -ErrorAction SilentlyContinue){throw "Owned $role still running after $mode"}
  }
  if($PID -in $observed -or $sentinel.Id -in $observed){throw 'Unrelated process included in owned tree'}
  $sentinel.Refresh();if($sentinel.HasExited){throw 'Unrelated sentinel was stopped'}
  if($summary.ResourceStopped -ne ($mode -eq 'pressure')){throw 'Wrong stop classification'}
  if($mode -eq 'normal' -and $summary.ExitCode -ne 0){throw 'Normal nested worker failed'}
  Write-Output "PASS $mode : real nested process tree observed and terminated, unrelated worker preserved"
 }
} finally {
 Remove-Item Function:Get-CimInstance -ErrorAction SilentlyContinue
 $sentinelRecord=Join-Path $sentinelDir 'sentinel.json'
 if(Test-Path -LiteralPath $sentinelRecord){$sentinelId=(Get-Content -LiteralPath $sentinelRecord|ConvertFrom-Json).pid;Stop-Process -Id $sentinelId -ErrorAction SilentlyContinue}
 $sentinel.Refresh();if(-not $sentinel.HasExited){Stop-Process -InputObject $sentinel}
}
