// Isolated browser fixture: wide range metadata, not measured singing evidence.
export async function seedCreationProfile(page, lowMidi=36, highMidi=84) {
  await page.waitForFunction(()=>window.__IEUM_V2__?.state)
  await page.evaluate(async({lowMidi,highMidi})=>{
    const id='ieum-v2:voice-profile:v7',blob=await (await fetch('/demo-stems/soprano.wav')).blob()
    const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('ieum-v2-records',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
    await new Promise((resolve,reject)=>{const tx=db.transaction('tracks','readwrite'),store=tx.objectStore('tracks');store.put({id:id+':range',projectId:id,kind:'voice-range',range:'QA registered range',rangeData:{lowMidi,highMidi}});store.put({id:id+':sample',projectId:id,kind:'voice-sample',blob,duration:7,songLabel:'QA sample'});tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error)})
    db.close()
  },{lowMidi,highMidi})
  await page.reload();await page.waitForFunction(()=>window.__IEUM_V2__?.state?.profile)
}
