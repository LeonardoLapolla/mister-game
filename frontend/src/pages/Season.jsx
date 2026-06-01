import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'

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
      <div className="relative">
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10">
          <div className="w-0 h-0 border-t-[12px] border-b-[12px] border-r-[20px] border-t-transparent border-b-transparent border-r-white drop-shadow-lg" />
        </div>
        <canvas ref={canvasRef} width={size} height={size} className="rounded-full shadow-2xl" />
      </div>
      <button
        onClick={spin}
        disabled={spinning || locked || items.length === 0}
        className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black text-lg px-10 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:scale-100"
      >
        {spinning ? 'GIRANDO...' : locked ? 'GIRATO ✓' : 'GIRA! 🎰'}
      </button>
      <p className="text-gray-600 text-xs">
        premi <kbd className="bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded text-xs">spazio</kbd> per girare
      </p>
    </div>
  )
}

function StandingsTable({ standings, title, teamName }) {
  return (
    <div className="w-full">
      {title && <h2 className="text-xl font-black text-white mb-4">{title}</h2>}
      <div className="space-y-1">
        {standings.map((team, i) => {
          const isYou = team.name === 'La Tua Squadra'
          return (
            <div key={team.name} className={`flex items-center justify-between px-4 py-2 rounded-xl ${isYou ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-900'}`}>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-black w-6 ${isYou ? 'text-green-400' : 'text-gray-600'}`}>{i + 1}</span>
                <span className={`font-semibold text-sm ${isYou ? 'text-green-400' : 'text-white'}`}>
                  {isYou ? `⭐ ${teamName || 'La Tua Squadra'}` : team.name}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-gray-500">{team.p}G {team.w}V {team.d}P {team.l}S</span>
                <span className="text-gray-500">{team.gf}:{team.ga}</span>
                <span className={`font-black ${isYou ? 'text-green-400' : 'text-white'}`}>{team.pts} pt</span>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-xl">Caricamento...</div>
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
    <div className="grid grid-cols-5 gap-2 mb-4">
      {[
        { label: 'Punti', value: points, color: 'text-green-400' },
        { label: 'V', value: wins, color: 'text-green-400' },
        { label: 'P', value: draws, color: 'text-yellow-400' },
        { label: 'S', value: losses, color: 'text-red-400' },
        { label: 'Gol', value: `${goalsFor}/${goalsAgainst}`, color: 'text-white' },
      ].map(s => (
        <div key={s.label} className="bg-gray-900 rounded-xl p-3 text-center">
          <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
          <div className="text-gray-600 text-xs">{s.label}</div>
        </div>
      ))}
    </div>
  )

  const standingsDrawer = showStandings && (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={() => setShowStandings(false)} />
      <div className="relative ml-auto w-full max-w-sm bg-gray-950 border-l border-gray-800 h-full overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-white">Classifica — Giornata {playedMatches.length}</h2>
          <button onClick={() => setShowStandings(false)} className="text-gray-500 hover:text-white text-2xl font-bold">×</button>
        </div>
        <div className="space-y-1">
          {liveStandings.map((team, i) => {
            const isYou = team.name === 'La Tua Squadra'
            const pos = i + 1
            const tot = liveStandings.length
            let color = 'text-gray-600', bg = 'bg-gray-900'
            if (pos === 1) { color = 'text-yellow-400'; bg = 'bg-yellow-500/10' }
            else if (pos <= 4) { color = 'text-blue-400'; bg = 'bg-blue-500/10' }
            else if (pos <= 6) { color = 'text-green-400'; bg = 'bg-green-500/10' }
            else if (pos >= tot - 2) { color = 'text-red-400'; bg = 'bg-red-500/10' }
            return (
              <div key={team.name} className={`flex items-center justify-between px-3 py-2 rounded-lg ${bg} ${isYou ? 'ring-1 ring-white/20' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black w-5 ${color}`}>{pos}</span>
                  <span className={`text-xs font-semibold ${isYou ? 'text-white' : 'text-gray-300'} truncate max-w-32`}>
                    {isYou ? `⭐ ${teamName}` : team.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-600">{team.w}V {team.d}P {team.l}S</span>
                  <span className={`font-black ${color === 'text-gray-600' ? 'text-white' : color}`}>{team.pts}pt</span>
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
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-3xl font-black text-white mb-2">Come vuoi giocare?</h1>
          <p className="text-gray-500 mb-10">Scegli come affrontare la stagione</p>
          <div className="grid grid-cols-1 gap-4">
            <button onClick={startManual} disabled={generating}
              className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-green-500 rounded-2xl p-6 text-left transition-all">
              <div className="text-3xl mb-2">🎰</div>
              <div className="text-white font-black text-xl mb-1">Partita per partita</div>
              <div className="text-gray-500 text-sm">Gira la ruota per ogni partita. Calendario casuale con andata e ritorno.</div>
            </button>
            <button onClick={generateFirstLeg} disabled={generating}
              className="bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-green-500 rounded-2xl p-6 text-left transition-all">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-white font-black text-xl mb-1">Simula tutto</div>
              <div className="text-gray-500 text-sm">Simula con mercato a metà stagione.</div>
            </button>
          </div>
          {error && <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
        </div>
      </div>
    )
  }

  if (halfTime) {
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">⏸️</div>
            <h1 className="text-3xl font-black text-white">Fine girone d'andata!</h1>
            <p className="text-gray-500 mt-2">Ecco la classifica dopo 20 giornate</p>
          </div>
          <div className="bg-gray-900/50 rounded-2xl p-4 mb-4 border border-gray-800">{statsBar}</div>
          <StandingsTable standings={halfTimeStandings} teamName={teamName} />
          <button onClick={continueSecondLeg}
            className="w-full mt-6 bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl transition-all hover:scale-105 active:scale-95">
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
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="text-4xl mb-2">🎲</div>
              <h2 className="text-2xl font-black text-white">Evento di giornata!</h2>
              <p className="text-gray-500 mt-1">Gira per scoprire cosa ti riserva il destino per le prossime 4 partite</p>
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
      <div className="min-h-screen bg-gray-950 px-4 py-8">
        {standingsDrawer}

        {/* Banner evento appena estratto */}
        {showEventBanner && activeEvent && (
          <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className={`rounded-2xl p-8 text-center border shadow-2xl ${
              activeEvent.type === 'bonus' ? 'bg-green-500/95 border-green-400' : 'bg-red-600/95 border-red-400'
            }`}>
              <div className="text-5xl mb-3">{activeEvent.emoji}</div>
              <div className="text-white font-black text-xl mb-2">
                {activeEvent.type === 'bonus' ? '⬆️ BONUS!' : '⬇️ MALUS!'}
              </div>
              <div className="text-white/90 text-lg">{activeEvent.text}</div>
              <div className="text-white/60 text-sm mt-2">Dura per 4 partite</div>
            </div>
          </div>
        )}

        {/* Banner risultato */}
        {lastResult && (
          <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
            <div className={`rounded-2xl p-8 text-center border shadow-2xl ${
              lastResult.outcome === 'win' ? 'bg-green-500/95 border-green-400' :
              lastResult.outcome === 'draw' ? 'bg-yellow-500/95 border-yellow-400' :
              'bg-red-600/95 border-red-400'
            }`}>
              <div className="text-4xl font-black text-white mb-2">
                {lastResult.outcome === 'win' ? '🏆 VITTORIA!' :
                 lastResult.outcome === 'draw' ? '🤝 PAREGGIO' : '💀 SCONFITTA'}
              </div>
              <div className="text-white font-black text-5xl mb-2">{lastResult.goalsFor} - {lastResult.goalsAgainst}</div>
              <div className="text-white/80 text-lg">vs {lastResult.opponent}</div>
              <div className="text-white/60 text-sm mt-2">Prossima partita tra 2 secondi...</div>
            </div>
          </div>
        )}

        <div className="max-w-lg mx-auto">
          {statsBar}

          <button
            onClick={fetchLiveStandings}
            disabled={loadingStandings || playedMatches.length === 0}
            className="fixed top-4 right-4 z-30 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 border border-gray-700 text-white font-bold py-2 px-3 rounded-xl text-sm transition-all shadow-lg"
          >
            {loadingStandings ? '...' : '📊'}
          </button>

          {/* Banner evento attivo */}
          {activeEvent && !showEventBanner && (
            <div className={`rounded-2xl px-4 py-3 mb-4 border flex items-center gap-3 ${
              activeEvent.type === 'bonus' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
            }`}>
              <span className="text-2xl">{activeEvent.emoji}</span>
              <div className="flex-1">
                <div className={`font-bold text-xs ${activeEvent.type === 'bonus' ? 'text-green-400' : 'text-red-400'}`}>
                  {activeEvent.type === 'bonus' ? '⬆️ BONUS' : '⬇️ MALUS'} · {eventMatchesLeft} partite rimaste
                </div>
                <div className="text-white text-sm">{activeEvent.text}</div>
              </div>
            </div>
          )}

          {/* Prossima partita */}
          <div className="bg-gray-900 rounded-2xl p-4 mb-4 border border-gray-800">
            <div className="flex items-center justify-between mb-1">
              <div className="text-gray-500 text-xs uppercase tracking-wider">
                Giornata {nextMatch.next?.matchday}/{nextMatch.totalMatches} · {isSecondLeg ? '🔄 Ritorno' : '➡️ Andata'}
              </div>
              <div className="text-gray-500 text-xs">{nextMatch.playedCount}/{nextMatch.totalMatches} giocate</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-black text-xl">{nextMatch.next?.opponent}</div>
                <div className="text-gray-500 text-sm">{nextMatch.next?.homeGame ? '🏠 Casa' : '✈️ Trasferta'}</div>
              </div>
              <div className="text-right">
                <div className="text-gray-400 text-xs">La tua forza</div>
                <div className="text-green-400 font-black text-xl">{nextMatch.yourStrength}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                <div className="text-green-400 font-black">{adjProbs.win}%</div>
                <div className="text-gray-600 text-xs">Vittoria</div>
              </div>
              <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
                <div className="text-yellow-400 font-black">{adjProbs.draw}%</div>
                <div className="text-gray-600 text-xs">Pareggio</div>
              </div>
              <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                <div className="text-red-400 font-black">{adjProbs.loss}%</div>
                <div className="text-gray-600 text-xs">Sconfitta</div>
              </div>
            </div>
          </div>

          {nextMatch.probs && (
            <div className="flex flex-col items-center">
              <SpinWheelBase
                items={[
                  { label: 'VITTORIA', result: 'win', color: '#22c55e', prob: adjProbs.win },
                  { label: 'PAREGGIO', result: 'draw', color: '#f59e0b', prob: adjProbs.draw },
                  { label: 'SCONFITTA', result: 'loss', color: '#ef4444', prob: adjProbs.loss },
                ]}
                onResult={handleWheelResult}
                locked={locked}
                onLock={() => setLocked(true)}
                size={300}
              />
            </div>
          )}

          {error && (
            <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">{error}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      {standingsDrawer}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Stagione</h1>
          <p className="text-gray-500">{session?.nickname} · {session?.league} · {session?.formation}</p>
        </div>
        <div className="grid grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Punti', value: points, color: 'text-green-400' },
            { label: 'Vittorie', value: wins, color: 'text-green-400' },
            { label: 'Pareggi', value: draws, color: 'text-yellow-400' },
            { label: 'Sconfitte', value: losses, color: 'text-red-400' },
            { label: 'Gol', value: `${goalsFor}/${goalsAgainst}`, color: 'text-white' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-4 text-center">
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-gray-500 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2 mb-8">
          {matchList.filter(m => m.played).sort((a, b) => a.matchday - b.matchday).map(m => {
            const win = m.goalsFor > m.goalsAgainst
            const draw = m.goalsFor === m.goalsAgainst
            return (
              <div key={m.id} className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-xs w-6">{m.matchday}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${win ? 'bg-green-500/20 text-green-400' : draw ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                    {win ? 'V' : draw ? 'P' : 'S'}
                  </span>
                  <span className="text-gray-400 text-sm">{m.homeGame ? '🏠' : '✈️'}</span>
                  <span className="text-white font-semibold">{m.opponent}</span>
                </div>
                <div className="text-white font-black">{m.goalsFor} - {m.goalsAgainst}</div>
              </div>
            )
          })}
        </div>
        {error && <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
        <button onClick={finishSeason}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl transition-all hover:scale-105 active:scale-95">
          VEDI RISULTATO FINALE →
        </button>
      </div>
    </div>
  )
}