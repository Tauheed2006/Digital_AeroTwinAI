import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'

function App() {

  const [mission, setMission] = useState(false)

  if(mission){
    return <Dashboard/>
  }

  return (
    <div className="app">
      <div className="hero">
        <h1>AeroTwin AI</h1>
        <h2>Real-Time Digital Twin System</h2>
        <p>Health Monitoring, Fault Prediction & Mission Reliability</p>

        <button
          className="start-btn"
          onClick={()=>setMission(true)}
        >
          Start Mission
        </button>
      </div>
    </div>
  )
}

export default App