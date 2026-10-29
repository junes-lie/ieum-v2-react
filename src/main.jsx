import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './design-system-v2.css'
import './integration-v2.css'
import './shared-screens-v2.css'
import './typography-restored.css'
import DemoStage from './DemoStage.jsx'

const params=new URLSearchParams(location.search)
// The presentation shell owns the outside navigation; app navigation stays inside.
createRoot(document.getElementById('root')).render(params.has('scene')||params.get('embedded')==='1'
  ? <App/>
  : <DemoStage initialScenario={params.get('demo') || (location.hash?'saved':'first-visit')}/>)
