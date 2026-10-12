param([string]$PythonPath,[string[]]$GenerationArgs,[string]$LogPrefix)
$ErrorActionPreference='Stop'
if((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB -lt 8){throw 'Need 8GiB RAM free before loading a model'}
foreach($suffix in @('.stdout.log','.stderr.log','.monitor.jsonl','.summary.json')){if(Test-Path -LiteralPath ($LogPrefix+$suffix)){throw 'Preserve existing evidence'}}
$guardProcess=Start-Process -FilePath $PythonPath -ArgumentList $GenerationArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput ($LogPrefix+'.stdout.log') -RedirectStandardError ($LogPrefix+'.stderr.log')
$guardStart=Get-Date;$lowCount=0;$resourceStopped=$false
function Get-GuardOwnedIds([int]$RootId) {
 # Python launchers and monitor wrappers can nest the real inference worker.
 # Traverse the launched tree rather than stopping only its direct children.
 $processTree=@(Get-CimInstance Win32_Process -Property ProcessId,ParentProcessId)
 $ownedIds=[Collections.Generic.List[int]]::new()
 $ownedIds.Add($RootId)
 for($index=0;$index -lt $ownedIds.Count;$index++) {
  $parentId=$ownedIds[$index]
  foreach($child in $processTree | Where-Object ParentProcessId -eq $parentId) {
   $childId=[int]$child.ProcessId
   if(-not $ownedIds.Contains($childId)){$ownedIds.Add($childId)}
  }
 }
 return $ownedIds.ToArray()
}
while(-not $guardProcess.HasExited){
 $freeGiB=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory/1MB
 $owned=@(Get-GuardOwnedIds $guardProcess.Id)
 @{Elapsed=((Get-Date)-$guardStart).TotalSeconds;FreeGiB=$freeGiB;Owned=@(Get-Process -Id $owned -ErrorAction SilentlyContinue | Select-Object Id,@{n='WorkingGiB';e={$_.WorkingSet64/1GB}})} | ConvertTo-Json -Compress -Depth 4 | Add-Content -LiteralPath ($LogPrefix+'.monitor.jsonl')
 if($freeGiB -lt 4){$lowCount++}else{$lowCount=0}
 if($lowCount -ge 3){$resourceStopped=$true;$owned=@(Get-GuardOwnedIds $guardProcess.Id);for($index=$owned.Count-1;$index -ge 0;$index--){Stop-Process -Id $owned[$index] -ErrorAction SilentlyContinue};break}
 Start-Sleep -Seconds 1;$guardProcess.Refresh()
}
$guardProcess.WaitForExit()
@{ExitCode=$guardProcess.ExitCode;ResourceStopped=$resourceStopped;WallSeconds=((Get-Date)-$guardStart).TotalSeconds} | ConvertTo-Json | Tee-Object -FilePath ($LogPrefix+'.summary.json')
exit $guardProcess.ExitCode
