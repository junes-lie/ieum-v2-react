import * as audio from './audio.js'

// Shared capture lifecycle for Voice Sample and Project Part recording.
// Persistence and submission belong to the caller; playback/capture never do.
export function createVocalRecordingSession(engine=audio) {
  let starting=false,stopping=false,generation=0,currentGuides=null,volumeChangedDuringStart=false
  return {
    async start(options) {
      if(starting||stopping)return false
      starting=true;volumeChangedDuringStart=false
      const token=++generation
      currentGuides=engine.recordingGuides({vocalAvailable:Boolean(options.vocalGuideBlob)})
      try {
        await engine.startRecording({...options,guides:currentGuides,guideTracks:[]})
        if(token!==generation){engine.cancelRecording();engine.stopMicrophone();return false}
        // A slider change during asynchronous audio setup must not be lost.
        if(volumeChangedDuringStart)engine.updateRecordingGuides(currentGuides)
        return true
      } catch(error) {currentGuides=null;engine.cancelRecording();engine.stopMicrophone();throw error}
      finally {starting=false}
    },
    setVolume(value) {
      const volume=engine.setGuideVolume(value)
      if(currentGuides)currentGuides={...currentGuides,vocalVolume:volume}
      if(starting)volumeChangedDuringStart=true
      if(!starting&&['recording','paused'].includes(engine.getRecordingTimeline().state)&&currentGuides)engine.updateRecordingGuides(currentGuides)
      return volume
    },
    pause() {if(stopping||starting)return;engine.pauseRecording()},
    resume() {if(stopping||starting)return;engine.resumeRecording()},
    async stop() {
      if(stopping)return null
      stopping=true
      try {return await engine.stopRecording()}
      finally {stopping=false;currentGuides=null}
    },
    cancel() {generation++;currentGuides=null;engine.cancelRecording();engine.stopMicrophone()}
  }
}
