import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'

export default function Home() {
  const navigate = useNavigate()
  const reset = useGameStore((s) => s.reset)

  const handleStart = () => {
    reset()
    navigate('/wheel')
  }

  return (
    <div className="mister-page">
      <div className="home">
        <div className="home-bg" />

        <div className="home-top">
          <span className="badge">⚽ Football Manager</span>
        </div>

        <div className="home-hero">
          <div className="logo" style={{ '--d': '0s' }}>
            <div className="logo-glow" />
            <div className="logo-wheel" />
            <div className="logo-hub">M</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h1 className="wordmark anim-up" style={{ '--d': '.15s' }}>MISTER</h1>
            <p className="tagline anim-up" style={{ '--d': '.25s' }}>Football Manager Game</p>
          </div>

          <p className="sub anim-up" style={{ '--d': '.35s' }}>
            Build your squad. Pick your league. Become a legend.
          </p>
        </div>

        <div className="home-foot">
          <button
            className="btn primary cta-shine anim-up"
            style={{ '--d': '.45s' }}
            onClick={handleStart}
          >
            START NOW ▶
          </button>
          <div className="meta">
            <span>5 leagues</span>
            <span>·</span>
            <span>38 matches</span>
            <span>·</span>
            <span>∞ challenges</span>
          </div>
        </div>
      </div>
    </div>
  )
}
