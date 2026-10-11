param([string]$PythonPath,[string[]]$GenerationArgs,[string]$LogPrefix)
$ErrorActionPreference='Stop'
if((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB -lt 8){throw 'Need 8GiB RAM free before loading a model'}
foreach($suffix in @('.stdout.log','.stderr.log','.monitor.jsonl','.summary.json')){if(Test-Path -LiteralPath ($LogPrefix+$suffix)){throw 'Preserve existing evidence'}}
$guardProcess=Start-Process -FilePath $PythonPath -ArgumentList $GenerationArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput ($LogPrefix+'.stdout.log') -RedirectStandardError ($LogPrefix+'.stderr.log')
$guardStart=Get-Date;$lowCount=0;$resourceStopped=$false
while(-not $guardProcess.HasExited){
 $freeGiB=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB
 $children=@(Get-CimInstance Win32_Process -Filter "ParentProcessId=$($guardProcess.Id)" | Where-Object Name -eq 'python.exe')
 $owned=@($guardProcess.Id)+@($children.ProcessId)
 @{Elapsed=((Get-Date)-$guardStart).TotalSeconds;FreeGiB=$freeGiB;Owned=@(Get-Process -Id $owned -ErrorAction SilentlyContinue | Select-Object Id,@{n='WorkingGiB';e={$_.WorkingSet64/1GB}})} | ConvertTo-Json -Compress -Depth 4 | Add-Content -LiteralPath ($LogPrefix+'.monitor.jsonl')
 if($freeGiB -lt 4){$lowCount++}else{$lowCount=0}
 if($lowCount -ge 3){$resourceStopped=$true;foreach($ownedId in $owned){Stop-Process -Id $ownedId -ErrorAction SilentlyContinue};break}
 Start-Sleep -Seconds 1;$guardProcess.Refresh()
}
$guardProcess.WaitForExit()
@{ExitCode=$guardProcess.ExitCode;ResourceStopped=$resourceStopped;WallSeconds=((Get-Date)-$guardStart).TotalSeconds} | ConvertTo-Json | Tee-Object -FilePath ($LogPrefix+'.summary.json')
