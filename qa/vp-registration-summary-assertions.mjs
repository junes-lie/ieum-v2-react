import assert from 'node:assert/strict'

const near=(a,b)=>assert.ok(Math.abs(a-b)<.4,`${a} vs ${b}`)
export async function verifyReviewIdentity(page,width){
 await page.waitForFunction(()=>[...document.querySelectorAll('.v2-vp-review-identity img')].every(n=>n.complete&&n.naturalWidth>0))
 const actual=await page.locator('.v2-vp-sample-stage').evaluate(root=>{
  const box=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}}
  const identity=root.querySelector('.v2-vp-review-identity'),image=identity.querySelector('.voice-identity'),info=identity.querySelector('.v2-vp-sample-info'),player=root.querySelector('.figma-player')
  return{identity:box(image),info:box(info),text:identity.textContent,player:box(player),button:box(player.querySelector('.play-btn')),seek:box(player.querySelector('input')),clocks:[...player.querySelectorAll('.player-split-clock>span')].map(box),width:document.body.scrollWidth}
 })
 near(actual.identity.w,280);near(actual.identity.h,158.795);near(actual.info.y-actual.identity.bottom,8);near(actual.identity.x+actual.identity.w/2,width/2);near(actual.player.h,48);near(actual.button.y+actual.button.h/2,actual.seek.y+actual.seek.h/2);assert.equal(actual.width,width);assert.match(actual.text,/시연용.*준비 중/s);assert.equal(actual.clocks.length,2);assert.ok(actual.clocks[0].x<actual.clocks[1].x)
 return actual
}

export async function verifyCompletePreferences(page,width,{roles=[],genres=[],taste=[],songTitles=[]}={}){
 const actual=await page.locator('.v2-vp-complete-stage').evaluate(root=>{
  const box=n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}}
  const summary=root.querySelector('.v2-vp-complete-summary'),preferences=root.querySelector('.v2-vp-complete-preferences')
  return{summary:box(summary),identity:box(summary.querySelector('.voice-identity')),preferences:box(preferences),rows:[...preferences.children].map(n=>({box:box(n),title:box(n.querySelector('dt')),value:box(n.querySelector('dd')),text:n.querySelector('dd').textContent})),returnCard:Boolean(root.querySelector('.v2-vp-return-context')),width:document.body.scrollWidth}
 })
 assert.equal(actual.returnCard,false);assert.equal(actual.width,width);near(actual.identity.w,144);near(actual.identity.h,144);near(actual.preferences.y-actual.summary.bottom,32);assert.equal(actual.rows.length,3)
 for(const row of actual.rows){near(row.title.w,64);near(row.value.x-row.title.right,16);near(row.value.y,row.title.y)}
 for(let index=1;index<actual.rows.length;index++)near(actual.rows[index].box.y-actual.rows[index-1].box.bottom,16)
 for(const [index,values]of [roles,genres,[...taste,...songTitles]].entries()){
  if(!values.length)assert.equal(actual.rows[index].text,'선택하지 않았어요')
  for(const value of values)assert.ok(actual.rows[index].text.includes(value),`Missing saved preference ${value}`)
 }
 return actual
}
