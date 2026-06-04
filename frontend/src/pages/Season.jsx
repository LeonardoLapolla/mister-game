import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import { IconChart, IconHome, IconPlane, IconTrophy, IconHandshake, IconSkull, IconDice, IconPause, IconArrowUp, IconArrowDown, IconArrowRight, IconRefresh, IconSlot } from '../components/Icons'
import useBlockBack from '../hooks/useBlockBack'
import useGameRedirect from '../hooks/useGameRedirect'


const EVENTS = [
  { id: 'hot_striker', emoji: '🔥', text: 'Il tuo bomber è in forma smagliante!', type: 'bonus', win: +7, draw: 0, loss: 0 },
  { id: 'great_training', emoji: '💪', text: 'Settimana di allenamento perfetta, squadra al massimo!', type: 'bonus', win: +5, draw: 0, loss: -3 },
  { id: 'opponent_crisis', emoji: '🤩', text: "Grande espressione del gioco, giocate a memoria!", type: 'bonus', win: +6, draw: -3, loss: 0 },
  { id: 'keeper_injured', emoji: '🤕', text: 'Grave infortunio, gioca la riserva', type: 'malus', win: 0, draw: 0, loss: +7 },
  { id: 'heavy_pitch', emoji: '😤', text: 'Difficoltà a segnare', type: 'malus', win: -5, draw: +6, loss: 0 },
  { id: 'dressing_room', emoji: '😰', text: 'Tensione nello spogliatoio, clima pesante', type: 'malus', win: -6, draw: 0, loss: +5 },
]

function SpinWheelBase({ items, onResult, locked, onLock, size = 300 }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const rafRef = useRef(null)
  const [spinning, setSpinning] = useState(false)

  const colors = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#ec4899', '#10b981', '#6366f1',
  ]

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

    if (items[0]?.prob !== undefined) {
      // Ruota con probabilità (partita)
      let startAngle = angle
      for (const item of items) {
        const arc = (item.prob / 100) * 2 * Math.PI
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, startAngle, startAngle + arc)
        ctx.closePath()
        ctx.fillStyle = item.color
        ctx.fill()
        ctx.strokeStyle = '#111827'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(startAngle + arc / 2)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 13px monospace'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4
        ctx.fillText(`${item.label} ${item.prob}%`, R - 10, 5)
        ctx.restore()
        startAngle += arc
      }
    } else {
      // Ruota con spicchi uguali (eventi)
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
        ctx.font = 'bold 11px monospace'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 4
        const label = item.emoji || item.label || ''
        ctx.fillText(label, R - 10, 5)
        ctx.restore()
      })
    }

    ctx.beginPath()
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
    ctx.fillStyle = '#111827'
    ctx.fill()
    ctx.strokeStyle = '#4b5563'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  function getResult(angle) {
    if (items[0]?.prob !== undefined) {
      const normalized = (((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))
      const normalized360 = (normalized / (2 * Math.PI)) * 100
      let cumulative = 0
      for (const item of items) {
        cumulative += item.prob
        if (normalized360 <= cumulative) return item
      }
      return items[items.length - 1]
    } else {
      const arc = (2 * Math.PI) / items.length
      const normalized = (((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))
      const index = Math.floor(normalized / arc) % items.length
      return items[index]
    }
  }

  function spin() {
    if (spinning || locked || items.length === 0) return
    onLock()
    setSpinning(true)

    const totalRotation = (8 + Math.random() * 8) * 2 * Math.PI
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
        <canvas ref={canvasRef} width={size} height={size} className="rounded-full"
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

function StandingsTable({ standings, title, teamName }) {
  return (
    <div className="w-full">
      {title && (
        <h2 className="section-title text-2xl mb-4">{title}</h2>
      )}
      <div className="space-y-1">
        {standings.map((team, i) => {
          const isYou = team.name === 'La Tua Squadra'
          return (
            <div key={team.name}
              className="flex items-center justify-between px-3 py-2 rounded-xl table-row-hover"
              style={isYou ? {
                background: 'rgba(0,230,118,0.08)',
                borderLeft: '2px solid var(--c-green)',
              } : {
                background: 'var(--c-surface)',
              }}>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-sm font-black w-5 flex-shrink-0" style={{ fontFamily: 'DM Mono, monospace', color: isYou ? 'var(--c-green)' : 'var(--c-faint)' }}>{i + 1}</span>
                <span className="font-semibold text-sm truncate" style={{ color: isYou ? 'var(--c-green)' : 'var(--c-text)' }}>
                  {isYou ? `★ ${teamName || 'La Tua Squadra'}` : team.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs flex-shrink-0" style={{ fontFamily: 'DM Mono, monospace' }}>
                <span className="hidden sm:inline" style={{ color: 'var(--c-muted)' }}>{team.w}V {team.d}P {team.l}S</span>
                <span className="hidden md:inline" style={{ color: 'var(--c-muted)' }}>{team.gf}:{team.ga}</span>
                <span className="font-bold" style={{ color: isYou ? 'var(--c-green)' : 'var(--c-text)' }}>{team.pts}pt</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Season() {
  const { sessionId } = useParams()
  useBlockBack()
  const redirectChecked = useGameRedirect(sessionId, 'nome-pagina')

  if (!redirectChecked) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-400">Caricamento...</div>
    </div>
  )
  const navigate = useNavigate()
  const { session, setSession, matches, setMatches } = useGameStore()

  const [mode, setMode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Evento
  const [activeEvent, setActiveEvent] = useState(null)
  const [eventMatchesLeft, setEventMatchesLeft] = useState(0)
  const [showEventWheel, setShowEventWheel] = useState(false)
  const [eventWheelLocked, setEventWheelLocked] = useState(false)
  const [pendingEvent, setPendingEvent] = useState(null)
  const [showEventBanner, setShowEventBanner] = useState(false)

  const [nextMatch, setNextMatch] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [locked, setLocked] = useState(false)
  const [playingNext, setPlayingNext] = useState(false)
  const [halfTime, setHalfTime] = useState(false)
  const [halfTimeStandings, setHalfTimeStandings] = useState([])

  const [showStandings, setShowStandings] = useState(false)
  const [liveStandings, setLiveStandings] = useState([])
  const [loadingStandings, setLoadingStandings] = useState(false)

  useEffect(() => {
    fetchSession()
  }, [sessionId])

  useEffect(() => {
    if (showEventBanner) {
      const timer = setTimeout(() => {
        setShowEventBanner(false)
        setShowEventWheel(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showEventBanner])

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      const data = await res.json()
      setSession(data.session)

      const matchRes = await fetch(`/api/match/${sessionId}`)
      const matchData = await matchRes.json()
      const allMatches = matchData.matches || []
      setMatches(allMatches)

      const unplayed = allMatches.filter(m => !m.played)
      if (unplayed.length > 0) {
        setMode('manual')
        const played = allMatches.filter(m => m.played)
        // Controlla se dobbiamo mostrare la ruota evento
        if (played.length % 4 === 0) {
          setShowEventWheel(true)
          setEventWheelLocked(false)
        }
        await fetchNextMatch(true)
      }
    } catch (err) {
      setError('Errore nel caricamento')
    } finally {
      setLoading(false)
    }
  }

  const handleEventResult = (event) => {
    setPendingEvent(event)
    setShowEventBanner(true)
    setActiveEvent(event)
    setEventMatchesLeft(4)
  }

  const fetchNextMatch = async (skipHalfTime = false) => {
    const res = await fetch(`/api/match/${sessionId}/next-match${skipHalfTime ? '?skipHalfTime=true' : ''}`)
    const data = await res.json()

    if (data.halfTime) {
      setHalfTime(true)
      setHalfTimeStandings(data.standings)
      return data
    }

    setNextMatch(data)
    setLastResult(null)
    setLocked(false)
    return data
  }

  const fetchLiveStandings = async () => {
    setLoadingStandings(true)
    try {
      const matchday = playedMatches.length
      const res = await fetch(`/api/match/${sessionId}/standings/${matchday}`)
      const data = await res.json()
      setLiveStandings(data.standings || [])
      setShowStandings(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingStandings(false)
    }
  }

  const startManual = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/match/${sessionId}/generate-calendar`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMode('manual')
      // Prima partita — mostra subito ruota evento
      setShowEventWheel(true)
      setEventWheelLocked(false)
      await fetchNextMatch()
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const generateFirstLeg = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/match/${sessionId}/generate-first-leg`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchSession()
      setHalfTime(true)
      setHalfTimeStandings(data.standings)
      setMode('auto')
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleWheelResult = async (item) => {
    setPlayingNext(true)
    try {
      const res = await fetch(`/api/match/${sessionId}/play-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponent: nextMatch.next.opponent,
          homeGame: nextMatch.next.homeGame,
          result: item.result,
          matchday: nextMatch.next.matchday,
        }),
      })
      const data = await res.json()
      setLastResult({ ...data, outcome: item.result })

      const matchRes = await fetch(`/api/match/${sessionId}`)
      const matchData = await matchRes.json()
      const updatedMatches = matchData.matches || []
      setMatches(updatedMatches)

      // Aggiorna evento
      const newPlayedCount = updatedMatches.filter(m => m.played).length
      setEventMatchesLeft(prev => {
        const next = prev - 1
        if (next <= 0) {
          setActiveEvent(null)
          return 0
        }
        return next
      })

      setTimeout(async () => {
        setLastResult(null)
        // Controlla se mostrare ruota evento alla prossima partita
        if (newPlayedCount % 4 === 0) {
          setShowEventWheel(true)
          setEventWheelLocked(false)
          setPendingEvent(null)
        }
        const next = await fetchNextMatch()
        if (next?.finished) finishSeason()
      }, 2000)
    } catch (err) {
      setError('Errore nel salvataggio')
    } finally {
      setPlayingNext(false)
    }
  }

  const continueSecondLeg = async () => {
    setHalfTime(false)
    if (mode === 'auto') {
      navigate(`/transfer/${sessionId}?mode=auto`)
    } else {
      navigate(`/transfer/${sessionId}`)
    }
  }

  const finishSeason = async () => {
    try {
      const res = await fetch(`/api/match/${sessionId}/finish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      navigate(`/results/${sessionId}`)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div className="text-xl animate-pulse" style={{ color: 'var(--c-muted)' }}>Caricamento...</div>
      </div>
    )
  }

  const matchList = matches || []
  const playedMatches = matchList.filter(m => m.played)
  const wins = playedMatches.filter(m => m.goalsFor > m.goalsAgainst).length
  const draws = playedMatches.filter(m => m.goalsFor === m.goalsAgainst).length
  const losses = playedMatches.filter(m => m.goalsFor < m.goalsAgainst).length
  const points = wins * 3 + draws
  const goalsFor = playedMatches.reduce((s, m) => s + m.goalsFor, 0)
  const goalsAgainst = playedMatches.reduce((s, m) => s + m.goalsAgainst, 0)
  const teamName = session?.nickname || 'La Tua Squadra'

  const baseProbs = nextMatch?.probs || { win: 33, draw: 33, loss: 34 }
  const activeWin = Math.min(80, Math.max(5, baseProbs.win + (activeEvent?.win || 0)))
  const activeDraw = Math.min(80, Math.max(5, baseProbs.draw + (activeEvent?.draw || 0)))
  const activeLoss = Math.min(80, Math.max(5, baseProbs.loss + (activeEvent?.loss || 0)))
  const totalAdj = activeWin + activeDraw + activeLoss
  const winR = Math.round(activeWin / totalAdj * 100)
  const drawR = Math.round(activeDraw / totalAdj * 100)
  const adjProbs = {
    win: winR,
    draw: drawR,
    loss: 100 - winR - drawR,
  }

  // Items ruota evento
  const eventWheelItems = EVENTS.map(e => ({
    ...e,
    label: `${e.emoji} ${e.type === 'bonus' ? '▲' : '▼'}`,
    color: e.type === 'bonus' ? '#22c55e' : '#ef4444',
  }))

  const statsBar = (
    <div className="grid grid-cols-5 gap-1 sm:gap-2 mb-4">
      {[
        { label: 'Punti', value: points, color: 'var(--c-green)' },
        { label: 'V', value: wins, color: 'var(--c-green)' },
        { label: 'P', value: draws, color: 'var(--c-amber)' },
        { label: 'S', value: losses, color: 'var(--c-red)' },
        { label: 'Gol', value: `${goalsFor}/${goalsAgainst}`, color: 'var(--c-text)' },
      ].map(s => (
        <div key={s.label} className="card-base p-1.5 sm:p-3 text-center">
          <div className="stat-number text-base sm:text-xl leading-tight" style={{ color: s.color }}>{s.value}</div>
          <div className="text-[9px] sm:text-xs uppercase tracking-wider mt-0.5" style={{ color: 'var(--c-muted)' }}>{s.label}</div>
        </div>
      ))}
    </div>
  )

  const standingsDrawer = showStandings && (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/70" onClick={() => setShowStandings(false)} />
      <div className="relative ml-auto w-full max-w-sm h-full overflow-y-auto p-4"
        style={{ background: 'var(--c-bg)', borderLeft: '1px solid var(--c-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title text-2xl">Classifica — G{playedMatches.length}</h2>
          <button onClick={() => setShowStandings(false)}
            className="text-2xl font-bold transition-colors" style={{ color: 'var(--c-muted)' }}>×</button>
        </div>
        <div className="space-y-1">
          {liveStandings.map((team, i) => {
            const isYou = team.name === 'La Tua Squadra'
            const pos = i + 1
            const tot = liveStandings.length
            let posColor = 'var(--c-faint)'
            let rowBg = 'var(--c-surface)'
            if (pos === 1) { posColor = 'var(--c-amber)'; rowBg = 'rgba(255,171,0,0.07)' }
            else if (pos <= 4) { posColor = 'var(--c-blue)'; rowBg = 'rgba(68,138,255,0.07)' }
            else if (pos <= 6) { posColor = 'var(--c-green)'; rowBg = 'rgba(0,230,118,0.07)' }
            else if (pos >= tot - 2) { posColor = 'var(--c-red)'; rowBg = 'rgba(255,61,87,0.07)' }
            return (
              <div key={team.name}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: rowBg, outline: isYou ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black w-5" style={{ fontFamily: 'DM Mono, monospace', color: posColor }}>{pos}</span>
                  <span className="text-xs font-semibold truncate max-w-32"
                    style={{ color: isYou ? 'var(--c-text)' : 'var(--c-muted)' }}>
                    {isYou ? `⭐ ${teamName}` : team.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ fontFamily: 'DM Mono, monospace' }}>
                  <span style={{ color: 'var(--c-faint)' }}>{team.w}V {team.d}P {team.l}S</span>
                  <span className="font-bold" style={{ color: posColor }}>{team.pts}pt</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )

  if (!mode && matchList.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--c-bg)' }}>
        <div className="max-w-lg w-full text-center">
          <div className="flex justify-center mb-4" style={{ color: 'var(--c-amber)' }}><IconTrophy size={64} /></div>
          <h1 className="section-title text-4xl md:text-5xl mb-2">Come vuoi giocare?</h1>
          <p className="text-sm mb-8 md:mb-10" style={{ color: 'var(--c-muted)' }}>Scegli come affrontare la stagione</p>
          <div className="grid grid-cols-1 gap-4">
            <button onClick={startManual} disabled={generating}
              className="card-base card-glow-green p-5 md:p-6 text-left transition-all"
              style={{ cursor: 'pointer' }}>
              <div className="mb-3" style={{ color: 'var(--c-green)' }}><IconSlot size={32} /></div>
              <div className="font-black text-xl mb-1" style={{ color: 'var(--c-text)' }}>Partita per partita</div>
              <div className="text-sm" style={{ color: 'var(--c-muted)' }}>Gira la ruota per ogni partita. Calendario casuale con andata e ritorno.</div>
            </button>
            <button onClick={generateFirstLeg} disabled={generating}
              className="card-base card-glow-green p-5 md:p-6 text-left transition-all"
              style={{ cursor: 'pointer' }}>
              <div className="mb-3" style={{ color: 'var(--c-blue)' }}><IconArrowRight size={32} /></div>
              <div className="font-black text-xl mb-1" style={{ color: 'var(--c-text)' }}>Simula tutto</div>
              <div className="text-sm" style={{ color: 'var(--c-muted)' }}>Simula con mercato a metà stagione.</div>
            </button>
          </div>
          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(255,61,87,0.1)', border: '1px solid rgba(255,61,87,0.3)', color: 'var(--c-red)' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (halfTime) {
    return (
      <div className="min-h-screen px-4 py-8" style={{ background: 'var(--c-bg)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-3" style={{ color: 'var(--c-muted)' }}><IconPause size={56} /></div>
            <h1 className="section-title text-4xl md:text-5xl">Fine girone d'andata!</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--c-muted)' }}>Ecco la classifica dopo 20 giornate</p>
          </div>
          <div className="card-base p-4 mb-4">{statsBar}</div>
          <StandingsTable standings={halfTimeStandings} teamName={teamName} />
          <button onClick={continueSecondLeg}
            className="btn-primary w-full mt-6 py-4 text-xl" style={{ fontWeight: 800 }}>
            INIZIA IL RITORNO →
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'manual' && nextMatch && !nextMatch.finished) {
    const isSecondLeg = nextMatch.next?.matchday > 20

    // Mostra ruota evento
    if (showEventWheel && !showEventBanner) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{ background: 'var(--c-bg)' }}>
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-2" style={{ color: 'var(--c-amber)' }}><IconDice size={48} /></div>
              <h2 className="section-title text-4xl">Evento di giornata!</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--c-muted)' }}>Gira per scoprire cosa ti riserva il destino per le prossime 4 partite</p>
            </div>
            <div className="flex flex-col items-center">
              <SpinWheelBase
                items={eventWheelItems}
                onResult={handleEventResult}
                locked={eventWheelLocked}
                onLock={() => setEventWheelLocked(true)}
                size={300}
              />
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen px-4 py-8" style={{ background: 'var(--c-bg)' }}>
        {standingsDrawer}

        {/* Banner evento appena estratto */}
        {showEventBanner && activeEvent && (
          <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="rounded-2xl p-8 text-center shadow-2xl"
              style={{
                background: activeEvent.type === 'bonus' ? 'rgba(0,230,118,0.95)' : 'rgba(255,61,87,0.95)',
                border: `1px solid ${activeEvent.type === 'bonus' ? 'var(--c-green)' : 'var(--c-red)'}`,
              }}>
              <div className="text-4xl mb-3">{activeEvent.emoji}</div>
              <div className="flex items-center justify-center gap-2 font-black text-xl mb-2 text-black">
                {activeEvent.type === 'bonus' ? <><IconArrowUp size={20} /> BONUS!</> : <><IconArrowDown size={20} /> MALUS!</>}
              </div>
              <div className="text-black/80 text-lg">{activeEvent.text}</div>
              <div className="text-black/50 text-sm mt-2">Dura per 4 partite</div>
            </div>
          </div>
        )}

        {/* Banner risultato */}
        {lastResult && (
          <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className="rounded-2xl p-6 md:p-8 text-center shadow-2xl animate-flash-result"
              style={{
                background: lastResult.outcome === 'win' ? 'rgba(0,230,118,0.95)' : lastResult.outcome === 'draw' ? 'rgba(255,171,0,0.95)' : 'rgba(255,61,87,0.95)',
                border: `1px solid ${lastResult.outcome === 'win' ? 'var(--c-green)' : lastResult.outcome === 'draw' ? 'var(--c-amber)' : 'var(--c-red)'}`,
              }}>
              <div className="flex items-center justify-center gap-2 font-black text-black mb-2"
                style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '2rem', letterSpacing: '0.05em' }}>
                {lastResult.outcome === 'win'
                  ? <><IconTrophy size={28} /> VITTORIA!</>
                  : lastResult.outcome === 'draw'
                  ? <><IconHandshake size={28} /> PAREGGIO</>
                  : <><IconSkull size={28} /> SCONFITTA</>}
              </div>
              <div className="font-black text-black mb-2" style={{ fontFamily: 'DM Mono, monospace', fontSize: '3.5rem' }}>
                {lastResult.goalsFor} - {lastResult.goalsAgainst}
              </div>
              <div className="text-black/80 text-lg">vs {lastResult.opponent}</div>
              <div className="text-black/50 text-sm mt-2">Prossima partita tra 2 secondi...</div>
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto">
          {statsBar}

          <button
            onClick={fetchLiveStandings}
            disabled={loadingStandings || playedMatches.length === 0}
            className="fixed top-4 right-4 z-30 flex items-center gap-1.5 font-bold py-2 px-3 rounded-xl text-sm transition-all"
            style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', color: 'var(--c-text)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
          >
            {loadingStandings ? '...' : <IconChart size={16} />}
          </button>

          {/* Prossima partita */}
          <div className="card-base p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest" style={{ color: 'var(--c-muted)' }}>
                G{nextMatch.next?.matchday}/{nextMatch.totalMatches}
                {isSecondLeg ? <><IconRefresh size={12} /> Ritorno</> : <><IconArrowRight size={12} /> Andata</>}
              </div>
              <div className="text-xs" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--c-muted)' }}>
                {nextMatch.playedCount}/{nextMatch.totalMatches}
              </div>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="min-w-0 flex-1 mr-2">
                <div className="font-black text-lg md:text-xl truncate" style={{ color: 'var(--c-text)' }}>{nextMatch.next?.opponent}</div>
                <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--c-muted)' }}>
                  {nextMatch.next?.homeGame ? <><IconHome size={14} /> Casa</> : <><IconPlane size={14} /> Trasferta</>}
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="text-xs" style={{ color: 'var(--c-muted)' }}>La tua forza</div>
                <div className="font-black text-xl stat-number" style={{ color: 'var(--c-green)' }}>{nextMatch.yourStrength}</div>
                {activeEvent && !showEventBanner && (
                  <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
                    style={{
                      background: activeEvent.type === 'bonus' ? 'rgba(0,230,118,0.12)' : 'rgba(255,61,87,0.12)',
                      border: `1px solid ${activeEvent.type === 'bonus' ? 'rgba(0,230,118,0.3)' : 'rgba(255,61,87,0.3)'}`,
                    }}>
                    <span className="text-sm leading-none">{activeEvent.emoji}</span>
                    <span className="text-[10px] font-bold leading-none" style={{ color: activeEvent.type === 'bonus' ? 'var(--c-green)' : 'var(--c-red)' }}>
                      {eventMatchesLeft}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { prob: adjProbs.win, label: 'Vittoria', color: 'var(--c-green)', bg: 'rgba(0,230,118,0.08)', border: 'rgba(0,230,118,0.2)' },
                { prob: adjProbs.draw, label: 'Pareggio', color: 'var(--c-amber)', bg: 'rgba(255,171,0,0.08)', border: 'rgba(255,171,0,0.2)' },
                { prob: adjProbs.loss, label: 'Sconfitta', color: 'var(--c-red)', bg: 'rgba(255,61,87,0.08)', border: 'rgba(255,61,87,0.2)' },
              ].map(({ prob, label, color, bg, border }) => (
                <div key={label} className="flex-1 rounded-lg p-2 text-center"
                  style={{ background: bg, border: `1px solid ${border}` }}>
                  <div className="font-black" style={{ fontFamily: 'DM Mono, monospace', color }}>{prob}%</div>
                  <div className="text-xs" style={{ color: 'var(--c-faint)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {nextMatch.probs && (
            <div className="flex flex-col items-center">
              <SpinWheelBase
                items={[
                  { label: 'VITTORIA', result: 'win', color: '#00e676', prob: adjProbs.win },
                  { label: 'PAREGGIO', result: 'draw', color: '#ffab00', prob: adjProbs.draw },
                  { label: 'SCONFITTA', result: 'loss', color: '#ff3d57', prob: adjProbs.loss },
                ]}
                onResult={handleWheelResult}
                locked={locked}
                onLock={() => setLocked(true)}
                size={300}
              />
            </div>
          )}

          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl text-sm text-center"
              style={{ background: 'rgba(255,61,87,0.1)', border: '1px solid rgba(255,61,87,0.3)', color: 'var(--c-red)' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--c-bg)' }}>
      {standingsDrawer}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="section-title text-5xl">Stagione</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-muted)' }}>{session?.nickname} · {session?.league} · {session?.formation}</p>
        </div>
        <div className="grid grid-cols-5 gap-1 sm:gap-3 mb-8">
          {[
            { label: 'Punti', value: points, color: 'var(--c-green)' },
            { label: 'Vittorie', value: wins, color: 'var(--c-green)' },
            { label: 'Pareggi', value: draws, color: 'var(--c-amber)' },
            { label: 'Sconfitte', value: losses, color: 'var(--c-red)' },
            { label: 'Gol', value: `${goalsFor}/${goalsAgainst}`, color: 'var(--c-text)' },
          ].map(s => (
            <div key={s.label} className="card-base p-2 sm:p-4 text-center">
              <div className="stat-number text-base sm:text-2xl" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] sm:text-xs uppercase tracking-wider mt-0.5" style={{ color: 'var(--c-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1.5 mb-8">
          {matchList.filter(m => m.played).sort((a, b) => a.matchday - b.matchday).map(m => {
            const win = m.goalsFor > m.goalsAgainst
            const draw = m.goalsFor === m.goalsAgainst
            return (
              <div key={m.id} className="flex items-center justify-between card-base px-3 md:px-4 py-2.5 md:py-3 gap-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                  <span className="text-xs w-6" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--c-faint)' }}>{m.matchday}</span>
                  <span className={win ? 'badge-win' : draw ? 'badge-draw' : 'badge-loss'}>
                    {win ? 'V' : draw ? 'P' : 'S'}
                  </span>
                  <span style={{ color: 'var(--c-muted)' }}>{m.homeGame ? <IconHome size={14} /> : <IconPlane size={14} />}</span>
                  <span className="font-semibold truncate" style={{ color: 'var(--c-text)' }}>{m.opponent}</span>
                </div>
                <div className="font-black" style={{ fontFamily: 'DM Mono, monospace', color: win ? 'var(--c-green)' : draw ? 'var(--c-amber)' : 'var(--c-red)' }}>
                  {m.goalsFor} - {m.goalsAgainst}
                </div>
              </div>
            )
          })}
        </div>
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(255,61,87,0.1)', border: '1px solid rgba(255,61,87,0.3)', color: 'var(--c-red)' }}>
            {error}
          </div>
        )}
        <button onClick={finishSeason}
          className="btn-primary w-full py-4 text-xl" style={{ fontWeight: 800 }}>
          VEDI RISULTATO FINALE →
        </button>
      </div>
    </div>
  )
}