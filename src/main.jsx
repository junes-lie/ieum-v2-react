import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './design-system-v2.css'
import './integration-v2.css'
import DemoStage, {DemoLauncher} from './DemoStage.jsx'
import {demoScenario} from './demoSession.js'

const demo=new URLSearchParams(location.search).get('demo')
createRoot(document.getElementById('root')).render(demo!==null
  ? <DemoStage initialScenario={demo}/>
  : <><App/>{!demoScenario&&<DemoLauncher/>}</>)
