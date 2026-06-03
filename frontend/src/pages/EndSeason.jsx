import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import { IconTrophy, IconSkull, IconFlag, IconSun, IconCalendar, IconUsers, IconChart } from '../components/Icons'

const LEAGUES = [
  { code: 'PL', name: 'Premier League', country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'SA', name: 'Serie A', country: '🇮🇹' },
  { code: 'BL', name: 'Bundesliga', country: '🇩🇪' },
  { code: 'LL', name: 'La Liga', country: '🇪🇸' },
  { code: 'L1', name: 'Ligue 1', country: '🇫🇷' },
]

const BUDGET_OPTIONS_BY_POSITION = {
  top: [{ value: 80, label: '80M', maxRating: 86 }, { value: 100, label: '100M', maxRating: 99 }],
  mid: [{ value: 50, label: '50M', maxRating: 84 }, { value: 80, label: '80M', maxRating: 86 }],
  low: [{ value: 30, label: '30M', maxRating: 78 }, { value: 50, label: '50M', maxRating: 84 }],
}

function getBudgetTier(position) {
  if (position <= 5) return 'top'
  if (position <= 10) return 'mid'
  return 'low'
}

const MAX_SEASONS = 3

function SpinWheel({ items, onResult, resetKey }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const rafRef = useRef(null)
  const [spinning, setSpinning] = useState(false)
  const [locked, setLocked] = useState(false)

  const colors = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#ec4899', '#10b981', '#6366f1',
  ]

  useEffect(() => {
    setLocked(false)
    setSpinning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [resetKey])

  useEffect(() => {
    drawWheel(angleRef.current)
  }, [items])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space') { e.preventDefault(); spin() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [spinning, locked])

  function drawWheel(angle) {
    const canvas = canvasRef.current
    if (!canvas || items.length === 0) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const R = Math.min(W, H) / 2 - 8

    ctx.clearRect(0, 0, W, H)
    const arc = (2 * Math.PI) / items.length

    items.forEach((item, i) => {
      const start = angle + i * arc
      const end = start + arc
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, R, start, end)
      ctx.closePath()
      ctx.fillStyle = item.color || colors[i % colors.length]
      ctx.fill()
      ctx.strokeStyle = '#111827'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + arc / 2)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px monospace'
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 4
      const label = item.label || String(item)
      ctx.fillText(label, R - 10, 5)
      ctx.restore()
    })

    ctx.beginPath()
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
    ctx.fillStyle = '#111827'
    ctx.fill()
    ctx.strokeStyle = '#4b5563'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  function getResult(angle) {
    const arc = (2 * Math.PI) / items.length
    const normalized = (((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))
    const index = Math.floor(normalized / arc) % items.length
    return items[index]
  }

  function spin() {
    if (spinning || locked || items.length === 0) return
    setLocked(true)
    setSpinning(true)

    const totalRotation = (10 + Math.random() * 10) * 2 * Math.PI
    const duration = 3000 + Math.random() * 1500
    const start = performance.now()
    const startAngle = angleRef.current

    function animate(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 4)
      angleRef.current = startAngle + totalRotation * ease
      drawWheel(angleRef.current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        setSpinning(false)
        onResult(getResult(angleRef.current))
      }
    }
    rafRef.current = requestAnimationFrame(animate)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className={`relative rounded-full p-1 ${spinning ? 'animate-pulse-glow' : ''}`}
        style={{ border: '1px solid rgba(0,230,118,0.25)' }}>
        <div className="absolute top-1/2 -right-5 -translate-y-1/2 z-10">
          <div className="w-0 h-0 border-t-[12px] border-b-[12px] border-r-[20px] border-t-transparent border-b-transparent drop-shadow-lg"
            style={{ borderRightColor: 'var(--c-green)' }} />
        </div>
        <canvas ref={canvasRef} width={300} height={300} className="rounded-full"
          style={{ boxShadow: '0 0 40px rgba(0,230,118,0.1)' }} />
      </div>
      <button
        onClick={spin}
        disabled={spinning || locked || items.length === 0}
        className="btn-primary text-lg px-10 py-3 disabled:opacity-40"
        style={{ fontWeight: 800 }}
      >
        {spinning ? 'GIRANDO...' : locked ? 'GIRATO ✓' : 'GIRA!'}
      </button>
      <p className="text-xs" style={{ color: 'var(--c-faint)' }}>
        premi <kbd className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--c-surface2)', color: 'var(--c-muted)' }}>spazio</kbd> per girare
      </p>
    </div>
  )
}

export default function EndSeason() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [history, setHistory] = useState([])
  const [players, setPlayers] = useState([])
  const [allPlayers, setAllPlayers] = useState({})

  const [phase, setPhase] = useState('recap')
  const [resetKey, setResetKey] = useState(0)
  const [result, setResult] = useState(null)

  const [budget, setBudget] = useState(null)
  const [signingCount, setSigningCount] = useState(0)
  const [currentSigning, setCurrentSigning] = useState(0)
  const [signingStep, setSigningStep] = useState('league')
  const [signingLeague, setSigningLeague] = useState(null)
  const [signingRole, setSigningRole] = useState(null)
  const [newPlayer, setNewPlayer] = useState(null)
  const [playerToReplace, setPlayerToReplace] = useState(null)
  const [wheelItems, setWheelItems] = useState([])
  const [pendingStep, setPendingStep] = useState(null)
  const [completedSignings, setCompletedSignings] = useState([])
  const [myPlayers, setMyPlayers] = useState([])
  const [saving, setSaving] = useState(false)

  // Dati stagione corrente dai query params
  const position = parseInt(searchParams.get('position')) || 10
  const points = parseInt(searchParams.get('points')) || 0
  const wins = parseInt(searchParams.get('wins')) || 0
  const draws = parseInt(searchParams.get('draws')) || 0
  const losses = parseInt(searchParams.get('losses')) || 0
  const goalsFor = parseInt(searchParams.get('gf')) || 0
  const goalsAgainst = parseInt(searchParams.get('ga')) || 0

  const totalTeams = 21
  const isRelegated = position > totalTeams - 3

  useEffect(() => {
    fetchData()
  }, [sessionId])

  useEffect(() => {
    if (pendingStep && wheelItems.length > 0) {
      setSigningStep(pendingStep)
      setPendingStep(null)
      setResult(null)
      setResetKey(k => k + 1)
    }
  }, [wheelItems, pendingStep])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      const d = await res.json()
      setSession(d.session)
      setPlayers(d.session.players || [])
      setMyPlayers(d.session.players || [])
      setData(d.session)

      const hRes = await fetch(`/api/game/${sessionId}/history`)
      const hData = await hRes.json()
      setHistory(hData.history || [])

      const pRes = await fetch('/api/market/all-players')
      const pData = await pRes.json()
      setAllPlayers(pData.players || {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleNextSeason = async () => {
    const res = await fetch(`/api/game/${sessionId}/next-season`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ position, points, wins, draws, losses, goalsFor, goalsAgainst }),
    })
    const d = await res.json()

    if (d.relegated) { setPhase('relegated'); return }
    if (d.maxSeasons) { setPhase('done'); return }

    setPhase('budget')
    setResetKey(k => k + 1)
  }

  const getBudgetWheelItems = () => {
    const tier = getBudgetTier(position)
    const options = BUDGET_OPTIONS_BY_POSITION[tier]
    return options.map(o => ({
      ...o,
      color: o.value === 100 ? '#22c55e' : o.value === 80 ? '#3b82f6' : o.value === 50 ? '#f59e0b' : '#ef4444'
    }))
  }

  const getCountWheelItems = () => [
    { label: '2 acquisti', value: 2, color: '#22c55e' },
    { label: '2 acquisti', value: 2, color: '#16a34a' },
    { label: '2 acquisti', value: 2, color: '#16a34a' },
    { label: '3 acquisti', value: 3, color: '#f59e0b' },
    { label: '3 acquisti', value: 3, color: '#d97706' },
    { label: '4 acquisti', value: 4, color: '#ef4444' },
  ]

  const getSigningWheelItems = () => {
    if (signingStep === 'league') return LEAGUES.map(l => ({ ...l, label: l.country + ' ' + l.name }))
    if (signingStep === 'role') return [
      { label: 'Portiere', value: 'GK', color: '#eab308' },
      { label: 'Difensore', value: 'DEF', color: '#3b82f6' },
      { label: 'Centrocampista', value: 'MID', color: '#22c55e' },
      { label: 'Attaccante', value: 'ATT', color: '#ef4444' },
    ]
    if (signingStep === 'player' || signingStep === 'replace') return wheelItems
    return []
  }

  const handleResult = (item) => {
    setResult(item)
    if (phase === 'budget') {
      setBudget(item)
    } else if (phase === 'count') {
      setSigningCount(item.value)
    } else if (phase === 'signing') {
      if (signingStep === 'league') {
        setSigningLeague(item)
      } else if (signingStep === 'role') {
        setSigningRole(item)
        const leaguePlayers = allPlayers[signingLeague?.code] || []
        const myNames = myPlayers.map(p => p.name)
        const available = leaguePlayers
          .filter(p => p.position === item.value)
          .filter(p => p.rating <= (budget?.maxRating || 99))
          .filter(p => !myNames.includes(p.name))
          .slice(0, 20)
        setWheelItems(available.map(p => ({ ...p, label: p.name })))
        setPendingStep('player')
        return
      } else if (signingStep === 'player') {
        setNewPlayer(item)
        const myInRole = myPlayers.filter(p => p.position === item.position)
        setWheelItems(myInRole.map(p => ({ ...p, label: p.name })))
        setPendingStep('replace')
        return
      } else if (signingStep === 'replace') {
        setPlayerToReplace(item)
      }
    }
  }

  const goNext = async () => {
    if (phase === 'budget') {
      setPhase('count'); setResult(null); setResetKey(k => k + 1)
    } else if (phase === 'count') {
      setPhase('signing'); setSigningStep('league'); setResult(null); setResetKey(k => k + 1)
    } else if (phase === 'signing') {
      if (signingStep === 'league') {
        setSigningStep('role'); setResult(null); setResetKey(k => k + 1)
      } else if (signingStep === 'replace') {
        await executeTransfer()
      }
    }
  }

  const executeTransfer = async () => {
    setSaving(true)
    try {
      await fetch(`/api/market/${sessionId}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: playerToReplace.name }),
      })
      await fetch(`/api/market/${sessionId}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: newPlayer.name }),
      })

      const newCompleted = [...completedSignings, { in: newPlayer, out: playerToReplace }]
      setCompletedSignings(newCompleted)
      const updated = myPlayers.filter(p => p.name !== playerToReplace.name).concat({ ...newPlayer })
      setMyPlayers(updated)

      const nextSigning = currentSigning + 1
      if (nextSigning >= signingCount) {
        navigate(`/squad/${sessionId}`)
      } else {
        setCurrentSigning(nextSigning)
        setSigningStep('league')
        setSigningLeague(null)
        setSigningRole(null)
        setNewPlayer(null)
        setPlayerToReplace(null)
        setWheelItems([])
        setResult(null)
        setResetKey(k => k + 1)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const getStepTitle = () => {
    if (phase === 'budget') return 'Budget mercato estivo'
    if (phase === 'count') return 'Quanti acquisti?'
    if (phase === 'signing') {
      const titles = {
        league: `Acquisto ${currentSigning + 1}/${signingCount} — Campionato`,
        role: `Acquisto ${currentSigning + 1}/${signingCount} — Ruolo`,
        player: `Acquisto ${currentSigning + 1}/${signingCount} — Giocatore`,
        replace: `Acquisto ${currentSigning + 1}/${signingCount} — Chi sostituisce?`,
      }
      return titles[signingStep]
    }
    return ''
  }

  const getResultLabel = () => {
    if (!result) return null
    if (phase === 'budget') return `${result.label} a disposizione`
    if (phase === 'count') return `${result.value} acquisti`
    if (phase === 'signing') {
      if (signingStep === 'league') return `${result.country} ${result.name}`
      if (signingStep === 'role') return result.label
      if (signingStep === 'player') return `${result.name} (OVR ${result.rating})`
      if (signingStep === 'replace') return `Fuori: ${result.name}`
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div className="text-xl animate-pulse" style={{ color: 'var(--c-muted)' }}>Caricamento...</div>
      </div>
    )
  }

  const seasonNumber = data?.seasonNumber || 1

  const positionBadge = (h) => {
    if (h.position <= 4) return { bg: 'rgba(68,138,255,0.15)', color: 'var(--c-blue)' }
    if (h.position <= 6) return { bg: 'rgba(0,230,118,0.15)', color: 'var(--c-green)' }
    if (h.position >= totalTeams - 2) return { bg: 'rgba(255,61,87,0.15)', color: 'var(--c-red)' }
    return { bg: 'var(--c-surface2)', color: 'var(--c-muted)' }
  }

  const posStyle = (p) => {
    if (p.position === 'GK') return { bg: 'rgba(255,171,0,0.12)', color: 'var(--c-amber)' }
    if (p.position === 'DEF') return { bg: 'rgba(68,138,255,0.12)', color: 'var(--c-blue)' }
    if (p.position === 'MID') return { bg: 'rgba(0,230,118,0.12)', color: 'var(--c-green)' }
    return { bg: 'rgba(255,61,87,0.12)', color: 'var(--c-red)' }
  }

  // Riepilogo finale
  if (phase === 'relegated' || phase === 'done') {
    const isRelegate = phase === 'relegated'
    return (
      <div className="min-h-screen px-4 py-8" style={{ background: 'var(--c-bg)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-flash-result">
            <div className="flex justify-center mb-4" style={{
              color: isRelegate ? 'var(--c-red)' : 'var(--c-green)',
              filter: isRelegate ? 'drop-shadow(0 0 20px rgba(255,61,87,0.4))' : 'drop-shadow(0 0 20px rgba(0,230,118,0.4))',
            }}>
              {isRelegate ? <IconSkull size={72} /> : <IconTrophy size={72} />}
            </div>
            <h1 className="section-title mb-2" style={{
              fontSize: 'clamp(2rem,8vw,3.5rem)',
              color: isRelegate ? 'var(--c-red)' : 'var(--c-green)',
              textShadow: isRelegate ? '0 0 40px rgba(255,61,87,0.4)' : '0 0 40px rgba(0,230,118,0.4)',
            }}>
              {isRelegate ? 'Retrocesso!' : `${MAX_SEASONS} Stagioni!`}
            </h1>
            <p style={{ color: 'var(--c-muted)' }}>
              {isRelegate ? 'La tua avventura finisce qui.' : 'Hai completato tutte le stagioni!'}
            </p>
          </div>

          <div className="card-base p-5 mb-5">
            <h2 className="section-title text-xl mb-4 flex items-center gap-2"><IconChart size={20} /> Riepilogo stagioni</h2>
            <div className="space-y-2">
              {history.map((h) => {
                const badge = positionBadge(h)
                return (
                  <div key={h.seasonNumber} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--c-surface2)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold" style={{ color: 'var(--c-muted)' }}>Stagione {h.seasonNumber}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>{h.position}°</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--c-muted)' }}>
                      <span>{h.wins}V {h.draws}P {h.losses}S</span>
                      <span>{h.goalsFor}:{h.goalsAgainst}</span>
                      <span className="font-bold" style={{ color: 'var(--c-text)' }}>{h.points} pt</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="card-base p-5 mb-5">
            <h2 className="section-title text-xl mb-4 flex items-center gap-2"><IconUsers size={20} /> Rosa finale</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {['GK', 'DEF', 'MID', 'ATT'].map(pos =>
                players.filter(p => p.position === pos).map((p, i) => {
                  const s = posStyle(p)
                  return (
                    <div key={i} className="flex items-center gap-2 py-1">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>{pos}</span>
                      <span className="text-sm truncate" style={{ color: 'var(--c-text)' }}>{p.name}</span>
                      <span className="text-xs ml-auto" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--c-muted)' }}>{p.rating}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <button onClick={() => navigate('/')} className="btn-primary w-full py-4 text-xl animate-pulse-glow" style={{ fontWeight: 800 }}>
            GIOCA ANCORA →
          </button>
        </div>
      </div>
    )
  }

  // Recap fine stagione
  if (phase === 'recap') {
    return (
      <div className="min-h-screen px-4 py-8" style={{ background: 'var(--c-bg)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 animate-fade-up">
            <div className="flex justify-center mb-3" style={{ color: 'var(--c-muted)' }}>
              {seasonNumber < MAX_SEASONS ? <IconCalendar size={56} /> : <IconFlag size={56} />}
            </div>
            <h1 className="section-title" style={{ fontSize: 'clamp(2rem,8vw,3rem)' }}>Fine stagione {seasonNumber}</h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--c-muted)' }}>Stagione {seasonNumber} di {MAX_SEASONS}</p>
          </div>

          {history.length > 0 && (
            <div className="card-base p-5 mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>Stagioni precedenti</h2>
              <div className="space-y-2">
                {history.map((h) => {
                  const badge = positionBadge(h)
                  return (
                    <div key={h.seasonNumber} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: 'var(--c-surface2)' }}>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold" style={{ color: 'var(--c-muted)' }}>Stagione {h.seasonNumber}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>{h.position}°</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--c-muted)' }}>
                        <span>{h.wins}V {h.draws}P {h.losses}S</span>
                        <span className="font-bold" style={{ color: 'var(--c-text)' }}>{h.points} pt</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {isRelegated ? (
            <div className="rounded-2xl p-6 text-center mb-6 animate-flash-result"
              style={{ background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.3)' }}>
              <div className="flex justify-center mb-2" style={{ color: 'var(--c-red)' }}><IconSkull size={48} /></div>
              <div className="font-black text-xl" style={{ color: 'var(--c-red)' }}>Retrocesso!</div>
              <div className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>La tua avventura finisce qui.</div>
            </div>
          ) : seasonNumber >= MAX_SEASONS ? (
            <div className="rounded-2xl p-6 text-center mb-6 animate-flash-result"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.3)' }}>
              <div className="flex justify-center mb-2" style={{ color: 'var(--c-green)' }}><IconFlag size={48} /></div>
              <div className="font-black text-xl" style={{ color: 'var(--c-green)' }}>Ultima stagione completata!</div>
            </div>
          ) : (
            <div className="card-base p-5 mb-6 text-center">
              <div className="text-sm" style={{ color: 'var(--c-muted)' }}>Prossima stagione</div>
              <div className="section-title text-3xl mt-1">Stagione {seasonNumber + 1}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>Mercato estivo disponibile</div>
            </div>
          )}

          <button
            onClick={() => {
              if (isRelegated || seasonNumber >= MAX_SEASONS) {
                setPhase(isRelegated ? 'relegated' : 'done')
              } else {
                handleNextSeason()
              }
            }}
            className="btn-primary w-full py-4 text-xl" style={{ fontWeight: 800 }}
          >
            {isRelegated || seasonNumber >= MAX_SEASONS ? 'VEDI RIEPILOGO →' : 'INIZIA MERCATO ESTIVO →'}
          </button>
        </div>
      </div>
    )
  }

  const showNext = result && !pendingStep

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: 'var(--c-bg)' }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2" style={{ color: 'var(--c-amber)' }}><IconSun size={48} /></div>
          <h1 className="section-title" style={{ fontSize: '2.5rem' }}>Mercato Estivo</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--c-muted)' }}>{getStepTitle()}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--c-faint)' }}>Stagione {seasonNumber + 1} di {MAX_SEASONS}</p>
        </div>

        {completedSignings.length > 0 && (
          <div className="card-base p-4 mb-6">
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--c-muted)' }}>Acquisti effettuati</div>
            {completedSignings.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1.5" style={{ borderBottom: i < completedSignings.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                <span className="badge-win">IN</span>
                <span style={{ color: 'var(--c-text)' }}>{s.in.name}</span>
                <span className="mx-1" style={{ color: 'var(--c-faint)' }}>↔</span>
                <span className="badge-loss">OUT</span>
                <span style={{ color: 'var(--c-muted)' }}>{s.out.name}</span>
              </div>
            ))}
          </div>
        )}

        {result && !pendingStep && (
          <div className="text-center mb-6">
            <div className="inline-block rounded-2xl px-6 py-3"
              style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)' }}>
              <div className="text-xl font-black" style={{ color: 'var(--c-green)' }}>{getResultLabel()}</div>
            </div>
          </div>
        )}

        {pendingStep && (
          <div className="text-center mb-6">
            <div className="text-sm" style={{ color: 'var(--c-muted)' }}>Preparazione ruota...</div>
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          <SpinWheel
            items={
              phase === 'budget' ? getBudgetWheelItems() :
              phase === 'count' ? getCountWheelItems() :
              getSigningWheelItems()
            }
            onResult={handleResult}
            resetKey={resetKey}
          />

          {showNext && (
            <button onClick={goNext} disabled={saving}
              className="btn-ghost text-lg px-10 py-3 disabled:opacity-40" style={{ fontWeight: 700 }}>
              {saving ? 'Salvataggio...' :
               phase === 'signing' && signingStep === 'replace' ? 'CONFERMA ACQUISTO ✓' : 'AVANTI →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}