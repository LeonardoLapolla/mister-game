import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import useBlockBack from '../hooks/useBlockBack'
import usePageGuard from '../hooks/usePageGuard'

const FORMATION_LAYOUT = {
  '4-3-3': [
    { pos: 'ATT', count: 3 },
    { pos: 'MID', count: 3 },
    { pos: 'DEF', count: 4 },
    { pos: 'GK', count: 1 },
  ],
  '4-4-2': [
    { pos: 'ATT', count: 2 },
    { pos: 'MID', count: 4 },
    { pos: 'DEF', count: 4 },
    { pos: 'GK', count: 1 },
  ],
  '3-5-2': [
    { pos: 'ATT', count: 2 },
    { pos: 'MID', count: 5 },
    { pos: 'DEF', count: 3 },
    { pos: 'GK', count: 1 },
  ],
  '5-3-2': [
    { pos: 'ATT', count: 2 },
    { pos: 'MID', count: 3 },
    { pos: 'DEF', count: 5 },
    { pos: 'GK', count: 1 },
  ],
  '4-2-3-1': [
    { pos: 'ATT', count: 1 },
    { pos: 'MID', count: 5 },
    { pos: 'DEF', count: 4 },
    { pos: 'GK', count: 1 },
  ],
}


function pitchPositions(layout, playersByPosition) {
  const positions = []
  const rows = layout.length
  layout.forEach((row, rowIdx) => {
    const yPct = 12 + (rowIdx / (rows - 1)) * 76
    const count = row.count
    for (let i = 0; i < count; i++) {
      const xPct = count === 1 ? 50 : 12 + (i / (count - 1)) * 76
      const player = playersByPosition[row.pos]?.[i]
      positions.push({ xPct, yPct, player, pos: row.pos })
    }
  })
  return positions
}

export default function Squad() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const isAutoMode = searchParams.get('mode') === 'auto'
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()
  useBlockBack()
  const guardPassed = usePageGuard(sessionId, s => s.finished ? `/results/${sessionId}` : null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/game/${sessionId}`)
        const data = await res.json()
        setSession(data.session)
        setPlayers(data.session.players || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [sessionId])

  const handleStart = async () => {
    if (isAutoMode) {
      setSimulating(true)
      setError(null)
      try {
        const res = await fetch(`/api/match/${sessionId}/generate-second-leg`, { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
      } catch (err) {
        setError(err.message)
        setSimulating(false)
        return
      }
      setSimulating(false)
    }
    navigate(`/season/${sessionId}`)
  }

  if (!guardPassed || loading) {
    return (
      <div className="mister-loading">
        <div>Caricamento...</div>
      </div>
    )
  }

  const formation = session?.formation || '4-3-3'
  const layout = FORMATION_LAYOUT[formation] || FORMATION_LAYOUT['4-3-3']
  const avgRating = players.length > 0
    ? Math.round(players.reduce((s, p) => s + p.rating, 0) / players.length)
    : 0

  const playersByPosition = {}
  for (const pos of ['GK', 'DEF', 'MID', 'ATT']) {
    playersByPosition[pos] = players.filter(p => p.position === pos)
  }

  const pitchPos = pitchPositions(layout, playersByPosition)

  return (
    <div className="mister-page">
      {/* Top bar */}
      <div className="gtop">
        <div className="gteam">
          <div className="gcrest">{(session?.nickname || 'M')[0]}</div>
          <div>
            <b>{session?.nickname}</b>
            <small>{session?.league} · {formation}</small>
          </div>
        </div>
        <div className="gpill">
          <b>{avgRating}</b>
          <span>OVR</span>
        </div>
      </div>

      {isAutoMode && (
        <div style={{ margin: '0 22px', background: 'color-mix(in oklab,var(--draw) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--draw) 40%,transparent)', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontFamily: 'var(--font-num)', fontSize: 12, color: 'var(--draw)' }}>
          Modalità simulazione — il ritorno verrà simulato automaticamente
        </div>
      )}

      <div className="page-scroll">
        {/* Pitch */}
        <div className="pitch">
          <svg className="plines" viewBox="0 0 100 133" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
            <g fill="none" stroke="rgba(255,255,255,.18)" strokeWidth="0.5">
              <rect x="3" y="3" width="94" height="127" />
              <line x1="3" y1="66.5" x2="97" y2="66.5" />
              <circle cx="50" cy="66.5" r="11" />
              <rect x="28" y="3" width="44" height="20" />
              <rect x="28" y="110" width="44" height="20" />
            </g>
          </svg>

          {pitchPos.map(({ xPct, yPct, player, pos }, i) => (
            <div key={i} className="ppos" style={{ left: `${xPct}%`, top: `${yPct}%` }}>
              <div className="pjersey">{player?.rating ?? '?'}</div>
              <small>{player?.name?.split(' ').pop() ?? pos}</small>
            </div>
          ))}
        </div>

        {error && (
          <div style={{ margin: '10px 22px', padding: '10px 14px', background: 'color-mix(in oklab,var(--loss) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--loss) 40%,transparent)', borderRadius: 'var(--r-sm)', color: 'var(--loss)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ height: 16 }} />
      </div>

      <div className="screen-foot">
        <button
          onClick={handleStart}
          disabled={simulating}
          className="btn primary"
          style={{ opacity: simulating ? 0.5 : 1 }}
        >
          {simulating ? 'Simulazione ritorno...' : isAutoMode ? 'SIMULA IL RITORNO ▶' : 'INIZIA LA STAGIONE ▶'}
        </button>
      </div>
    </div>
  )
}
