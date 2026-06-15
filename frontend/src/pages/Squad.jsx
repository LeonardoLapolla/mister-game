import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'

const FORMATION_LAYOUT = {
  '4-3-3':   [{ pos: 'ATT', count: 3 }, { pos: 'MID', count: 3 }, { pos: 'DEF', count: 4 }, { pos: 'GK', count: 1 }],
  '4-4-2':   [{ pos: 'ATT', count: 2 }, { pos: 'MID', count: 4 }, { pos: 'DEF', count: 4 }, { pos: 'GK', count: 1 }],
  '3-5-2':   [{ pos: 'ATT', count: 2 }, { pos: 'MID', count: 5 }, { pos: 'DEF', count: 3 }, { pos: 'GK', count: 1 }],
  '5-3-2':   [{ pos: 'ATT', count: 2 }, { pos: 'MID', count: 3 }, { pos: 'DEF', count: 5 }, { pos: 'GK', count: 1 }],
  '4-2-3-1': [{ pos: 'ATT', count: 1 }, { pos: 'MID', count: 5 }, { pos: 'DEF', count: 4 }, { pos: 'GK', count: 1 }],
}

const FORMATION_ATTITUDE = {
  '4-3-3': 'Offensive', '3-5-2': 'Offensive',
  '4-4-2': 'Balanced',  '4-2-3-1': 'Balanced',
  '5-3-2': 'Defensive',
}
const ATTITUDE_COLOR = { Offensive: 'var(--loss)', Balanced: 'var(--mkt-amber)', Defensive: 'var(--win)' }

function pitchPositions(layout, playersByPosition) {
  const positions = []
  const rows = layout.length
  layout.forEach((row, rowIdx) => {
    const yPct = 12 + (rowIdx / (rows - 1)) * 76
    for (let i = 0; i < row.count; i++) {
      const xPct = row.count === 1 ? 50 : 12 + (i / (row.count - 1)) * 76
      positions.push({ xPct, yPct, player: playersByPosition[row.pos]?.[i], pos: row.pos })
    }
  })
  return positions
}

function EnergyBar({ energy }) {
  const color = energy >= 70 ? 'var(--primary)' : energy >= 40 ? 'var(--mkt-amber)' : 'var(--loss)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 36, height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${energy}%`, height: '100%', background: color, transition: 'width .3s' }} />
      </div>
      <span style={{ fontFamily: 'var(--font-num)', fontSize: 10, color: 'var(--muted)', minWidth: 26 }}>{energy}%</span>
    </div>
  )
}

export default function Squad() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const isAutoMode = searchParams.get('mode') === 'auto'
  const isEuropaMode = searchParams.get('mode') === 'europa'
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()

  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [error, setError] = useState(null)
  const [swapping, setSwapping] = useState(false)
  const [selectedBench, setSelectedBench] = useState(null)

  useEffect(() => {
    const init = async () => {
      if (isEuropaMode) {
        await fetch(`/api/game/${sessionId}/reset-energy`, { method: 'PATCH' })
      }
      const res = await fetch(`/api/game/${sessionId}`)
      const d = await res.json()
      setSession(d.session)
      setPlayers(d.session.players || [])
      setLoading(false)
    }
    init().catch(e => { console.error(e); setLoading(false) })
  }, [sessionId])

  const handleSwap = async (benchPlayer, starterPlayer) => {
    if (swapping) return
    setSwapping(true)
    setSelectedBench(null)
    try {
      const res = await fetch(`/api/game/${sessionId}/bench`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: [
            { playerId: starterPlayer.id, isBench: true },
            { playerId: benchPlayer.id, isBench: false },
          ],
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setPlayers(data.session.players || [])
        setSession(data.session)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSwapping(false)
    }
  }

  const handleBenchTap = (p) => {
    if (swapping) return
    setSelectedBench(sel => sel?.id === p.id ? null : p)
  }

  const handleStarterTap = (p) => {
    if (!selectedBench || selectedBench.position !== p.position || swapping) return
    handleSwap(selectedBench, p)
  }

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
    if (isEuropaMode) {
      navigate(`/europa-group/${sessionId}`)
    } else {
      navigate(`/season/${sessionId}`)
    }
  }

  if (loading) return <div className="mister-loading"><div>Loading...</div></div>

  const formation = session?.formation || '4-3-3'
  const layout = FORMATION_LAYOUT[formation] || FORMATION_LAYOUT['4-3-3']
  const starters = players.filter(p => !p.isBench)
  const bench = players.filter(p => p.isBench)

  const avgRating = starters.length > 0
    ? Math.round(starters.reduce((s, p) => s + p.rating, 0) / starters.length)
    : 0
  const avgEnergy = starters.length > 0
    ? Math.round(starters.reduce((s, p) => s + p.energy, 0) / starters.length)
    : 100

  const startersByPos = {}
  for (const pos of ['GK', 'DEF', 'MID', 'ATT']) {
    startersByPos[pos] = starters.filter(p => p.position === pos)
  }

  const pitchPos = pitchPositions(layout, startersByPos)

  const attitude = FORMATION_ATTITUDE[formation] || 'Balanced'
  const attColor = ATTITUDE_COLOR[attitude]
  const energyColor = avgEnergy >= 70 ? 'var(--primary)' : avgEnergy >= 40 ? 'var(--mkt-amber)' : 'var(--loss)'

  const getButtonLabel = () => {
    if (simulating) return 'Simulazione...'
    if (isEuropaMode) return 'START EUROPEAN CUP ▶'
    if (isAutoMode) return 'SIMULA IL RITORNO ▶'
    return 'INIZIA LA STAGIONE ▶'
  }

  return (
    <div className="mister-page">
      <div className="gtop">
        <div className="gteam">
          <div className="gcrest">{(session?.nickname || 'M')[0]}</div>
          <div>
            <b>{session?.nickname}</b>
            <small>{session?.league} · {formation} · OVR {avgRating}</small>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: 'var(--font-num)', fontSize: 10, padding: '2px 8px',
            borderRadius: 4, border: `1px solid ${attColor}`,
            background: `color-mix(in oklab,${attColor} 12%,transparent)`,
            color: attColor,
          }}>{attitude.toUpperCase()}</span>
          <span style={{ fontFamily: 'var(--font-num)', fontSize: 10, color: energyColor }}>⚡{avgEnergy}%</span>
        </div>
      </div>

      <div className="page-scroll">

        {isEuropaMode && (
          <div style={{ margin: '14px 22px 0', padding: '10px 14px', background: 'color-mix(in oklab,var(--champions) 12%,var(--surface))', border: '1px solid color-mix(in oklab,var(--champions) 35%,transparent)', borderRadius: 'var(--r-sm)', color: 'var(--champions)', fontFamily: 'var(--font-num)', fontSize: 12, letterSpacing: '.08em' }}>
            All players are at full energy for European competition — set your lineup and kick off.
          </div>
        )}

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
          {pitchPos.map(({ xPct, yPct, player }, i) => (
            <div key={i} className="ppos" style={{ left: `${xPct}%`, top: `${yPct}%` }}>
              <div className="pjersey">{player?.rating ?? '?'}</div>
              <small>{player?.name?.split(' ').pop() ?? '—'}</small>
            </div>
          ))}
        </div>

        {/* Selection banner */}
        {selectedBench && (
          <div style={{ margin: '10px 22px 0', padding: '8px 12px', background: 'color-mix(in oklab,var(--primary) 12%,transparent)', border: '1px solid var(--primary)', borderRadius: 'var(--r-sm)', fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--primary)' }}>
            {selectedBench.name} selected — tap a {selectedBench.position} starter to swap in
          </div>
        )}

        {/* Starters */}
        <div className="section-title">Starting 11</div>
        <div className="roster" style={{ padding: '0 22px' }}>
          {['GK', 'DEF', 'MID', 'ATT'].map(pos =>
            startersByPos[pos]?.map(p => {
              const isTarget = selectedBench?.position === p.position
              return (
                <div
                  key={p.id}
                  className="rrow"
                  onClick={() => handleStarterTap(p)}
                  style={{
                    cursor: isTarget ? 'pointer' : 'default',
                    outline: isTarget ? '1px dashed color-mix(in oklab,var(--primary) 50%,transparent)' : 'none',
                    borderRadius: isTarget ? 'var(--r-sm)' : 0,
                    background: isTarget ? 'color-mix(in oklab,var(--primary) 5%,transparent)' : undefined,
                  }}
                >
                  <span className="rrole">{p.position}</span>
                  <span className="rnm">{p.name}</span>
                  <EnergyBar energy={p.energy} />
                  <span className="rovr">{p.rating}</span>
                </div>
              )
            })
          )}
        </div>

        {/* Bench */}
        {bench.length > 0 && (
          <>
            <div className="section-title">
              Bench
              {!selectedBench && <span style={{ fontFamily: 'var(--font-num)', fontSize: 10, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>tap to select, then tap a starter</span>}
            </div>
            <div className="roster" style={{ padding: '0 22px' }}>
              {bench.map(p => {
                const isSelected = selectedBench?.id === p.id
                const hasStarter = startersByPos[p.position]?.length > 0
                return (
                  <div
                    key={p.id}
                    className="rrow"
                    onClick={() => hasStarter ? handleBenchTap(p) : undefined}
                    style={{
                      cursor: hasStarter ? 'pointer' : 'default',
                      background: isSelected ? 'color-mix(in oklab,var(--primary) 12%,transparent)' : undefined,
                      outline: isSelected ? '1px solid var(--primary)' : 'none',
                      borderRadius: 'var(--r-sm)',
                      opacity: hasStarter ? 1 : 0.45,
                    }}
                  >
                    <span className="rrole">{p.position}</span>
                    <span className="rnm">{p.name}</span>
                    <EnergyBar energy={p.energy} />
                    <span className="rovr">{p.rating}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {error && (
          <div style={{ margin: '12px 22px 0', padding: '10px 14px', background: 'color-mix(in oklab,var(--loss) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--loss) 40%,transparent)', borderRadius: 'var(--r-sm)', color: 'var(--loss)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {isAutoMode && (
          <div style={{ margin: '12px 22px 0', padding: '10px 14px', background: 'color-mix(in oklab,var(--mkt-amber) 10%,var(--surface))', border: '1px solid color-mix(in oklab,var(--mkt-amber) 25%,transparent)', borderRadius: 'var(--r-sm)', color: 'var(--mkt-amber)', fontSize: 13 }}>
            Auto mode — il ritorno verrà simulato automaticamente
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      <div className="screen-foot">
        <button onClick={handleStart} disabled={simulating} className="btn primary">
          {getButtonLabel()}
        </button>
      </div>
    </div>
  )
}
