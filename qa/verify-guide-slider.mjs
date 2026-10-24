import assert from 'node:assert/strict'
import {Window} from 'happy-dom'
const window=new Window()
Object.assign(globalThis,{window,document:window.document,HTMLElement:window.HTMLElement,IS_REACT_ACT_ENVIRONMENT:true})
const React=await import('react')
const {createRoot}=await import('react-dom/client')
const {default:Slider}=await import('../src/GuideVolumeSlider.js')
const host=document.createElement('div');document.body.append(host)
const root=createRoot(host)
let disabled=false,value=.5
function Harness(){const [volume,setVolume]=React.useState(value);return React.createElement(Slider,{value:volume,disabled,'aria-label':'guide',onValueChange:next=>{value=next;setVolume(next)}})}
await React.act(()=>root.render(React.createElement(Harness)))
const input=host.querySelector('input')
input.getBoundingClientRect=()=>({top:100,bottom:260,height:160,width:44})
const pointer=(type,y,id=1)=>React.act(()=>input.dispatchEvent(new window.PointerEvent(type,{bubbles:true,cancelable:true,clientY:y,pointerId:id,isPrimary:true,button:0})))
await pointer('pointerdown',180);assert.equal(value,.5)
await pointer('pointermove',110);assert.equal(value,1);assert.equal(input.value,'100')
await pointer('pointermove',250);assert.equal(value,0);assert.equal(input.value,'0')
await pointer('pointerup',250)
await pointer('pointermove',110);assert.equal(value,0,'Release ends drag')
await pointer('pointerdown',110)
await pointer('pointercancel',110)
await pointer('pointermove',250);assert.equal(value,1,'Cancel ends drag')
disabled=true
await React.act(()=>root.render(React.createElement(Harness)))
await pointer('pointerdown',250);assert.equal(value,1,'Unavailable guide stays disabled')
assert.equal(input.getAttribute('aria-orientation'),'vertical')
await React.act(()=>root.unmount())
console.log('PASS mounted shared slider: vertical tap/drag, min/max, release, cancel, disabled state, controlled thumb')
