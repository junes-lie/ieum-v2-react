import React, {useRef} from 'react'

// One vertical pointer contract for sample and project recording.
export default function GuideVolumeSlider({value,onValueChange,disabled=false,...props}) {
  const activePointer=useRef(null)
  const update=event=>{
    const rect=event.currentTarget.getBoundingClientRect()
    const thumb=20
    const travel=Math.max(1,rect.height-thumb)
    const next=Math.round(Math.min(1,Math.max(0,(rect.bottom-thumb/2-event.clientY)/travel))*100)/100
    onValueChange(next)
  }
  const end=event=>{
    if(activePointer.current!==event.pointerId)return
    activePointer.current=null
    if(event.currentTarget.hasPointerCapture?.(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId)
  }
  return React.createElement('input',{
    ...props,type:'range',min:0,max:100,step:1,value:Math.round(value*100),disabled,
    'aria-orientation':'vertical',style:{'--guide-volume':`${value*100}%`,touchAction:'none'},
    onChange:event=>onValueChange(Number(event.target.value)/100),
    onPointerDown:event=>{
      if(disabled||!event.isPrimary||event.button!==0)return
      event.preventDefault()
      activePointer.current=event.pointerId
      event.currentTarget.focus({preventScroll:true})
      event.currentTarget.setPointerCapture?.(event.pointerId)
      update(event)
    },
    onPointerMove:event=>{
      if(disabled||activePointer.current!==event.pointerId)return
      event.preventDefault();update(event)
    },
    onPointerUp:end,onPointerCancel:end,onLostPointerCapture:()=>{activePointer.current=null}
  })
}
