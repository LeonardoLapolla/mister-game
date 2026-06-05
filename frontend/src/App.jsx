import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Wheel from './pages/Wheel'
import Season from './pages/Season'
import Results from './pages/Results'
import Squad from './pages/Squad'
import Transfer from './pages/Transfer'
import EndSeason from './pages/EndSeason'
import EuropaGroup from './pages/EuropaGroup'
import EuropaKnockout from './pages/EuropaKnockout'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wheel" element={<Wheel />} />
        <Route path="/season/:sessionId" element={<Season />} />
        <Route path="/results/:sessionId" element={<Results />} />
        <Route path="/squad/:sessionId" element={<Squad />} />
        <Route path="/transfer/:sessionId" element={<Transfer />} />
        <Route path="/end-season/:sessionId" element={<EndSeason />} />
        <Route path="/europa-group/:sessionId" element={<EuropaGroup />} />
        <Route path="/europa-knockout/:sessionId" element={<EuropaKnockout />} />
      </Routes>
    </div>
  )
}