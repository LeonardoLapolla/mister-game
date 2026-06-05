import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'

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
      <div className="relative">
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10">
          <div className="w-0 h-0 border-t-[12px] border-b-[12px] border-r-[20px] border-t-transparent border-b-transparent border-r-white drop-shadow-lg" />
        </div>
        <canvas ref={canvasRef} width={300} height={300} className="rounded-full shadow-2xl shadow-green-500/10" />
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
  const [europaCompetition, setEuropaCompetition] = useState(null)

  const [budget, setBudget] = useState(null)
  const [signingCount, setSigningCount] = useState(0)
  const [currentSigning, setCurrentSigning] = useState(0)
  const [signingStep, setSigningStep] = useState('league')
  const [signingLeague, setSigningLeague] = useState(null)
  const [signingRole, setSigningRole] = useState(null)
  const [newPlayer, setNewPlayer] = useState(null)
  const [playerToReplace, setPlayerToReplace] = useState(null)
  const [pendingTransfer, setPendingTransfer] = useState(null)
  const [wheelItems, setWheelItems] = useState([])
  const [pendingStep, setPendingStep] = useState(null)
  const [completedSignings, setCompletedSignings] = useState([])
  const [myPlayers, setMyPlayers] = useState([])
  const [saving, setSaving] = useState(false)

  const position = parseInt(searchParams.get('position')) || 10
  const points = parseInt(searchParams.get('points')) || 0
  const wins = parseInt(searchParams.get('wins')) || 0
  const draws = parseInt(searchParams.get('draws')) || 0
  const losses = parseInt(searchParams.get('losses')) || 0
  const goalsFor = parseInt(searchParams.get('gf')) || 0
  const goalsAgainst = parseInt(searchParams.get('ga')) || 0
  const score = parseInt(searchParams.get('score')) || 0
  const fromEuropa = searchParams.get('fromEuropa') === 'true'

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

  // Se arriva da europa, vai direttamente al mercato
  useEffect(() => {
    if (fromEuropa && !loading && data) {
      const seasonNumber = data?.seasonNumber || 1
      if (isRelegated || seasonNumber > MAX_SEASONS) {
        handleFinalRecap()
      } else {
        handleNextSeason()
      }
    }
  }, [fromEuropa, loading, data])

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

  useEffect(() => {
  if (position && data) {
    // Controlla prima se c'è già un torneo giocato
    fetch(`/api/europa/${sessionId}/state`)
      .then(r => {
        if (!r.ok) {
          // Nessun torneo — controlla se è qualificato
          return fetch(`/api/europa/${sessionId}/check`)
            .then(r2 => r2.json())
            .then(d => setEuropaCompetition(d.competition))
        }
        return r.json().then(d => {
          // Torneo già giocato (fase eliminated o winner) — non mostrare il bottone
          if (d.phase === 'eliminated' || d.phase === 'winner') {
            setEuropaCompetition(null)
          } else {
            setEuropaCompetition(d.competition)
          }
        })
      })
      .catch(() => {})
  }
}, [position, data])

  const handleNextSeason = async () => {
    let europaScore = 0
    try {
      const europaRes = await fetch(`/api/europa/${sessionId}/score`)
      const europaData = await europaRes.json()
      europaScore = europaData.score || 0
    } catch (err) {}

    const totalScore = score + europaScore

    const res = await fetch(`/api/game/${sessionId}/next-season`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        position, points, wins, draws, losses, goalsFor, goalsAgainst,
        finalScore: totalScore,
      }),
    })
    const d = await res.json()

    if (d.relegated) { setPhase('relegated'); return }

    if (d.maxSeasons) {
      // Ultima stagione — se viene da europa vai al riepilogo finale
      // ricarica history aggiornata poi mostra done
      const hRes = await fetch(`/api/game/${sessionId}/history`)
      const hData = await hRes.json()
      setHistory(hData.history || [])
      setPhase('done')
      return
    }

    setPhase('budget')
    setResetKey(k => k + 1)
  }

  const handleFinalRecap = async () => {
    let europaScore = 0
    try {
      const europaRes = await fetch(`/api/europa/${sessionId}/score`)
      const europaData = await europaRes.json()
      europaScore = europaData.score || 0
    } catch (err) {}

    const totalScore = score + europaScore

    await fetch(`/api/game/${sessionId}/next-season`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        position, points, wins, draws, losses, goalsFor, goalsAgainst,
        finalScore: totalScore,
      }),
    })

    const hRes = await fetch(`/api/game/${sessionId}/history`)
    const hData = await hRes.json()
    setHistory(hData.history || [])
    setPhase(isRelegated ? 'relegated' : 'done')
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
        setPendingTransfer({ in: newPlayer, out: item })
      }
    }
  }

  const skipToNextSigning = () => {
    setPendingTransfer(null)
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
  }

  const goNext = async () => {
    if (phase === 'budget') {
      setPhase('count'); setResult(null); setResetKey(k => k + 1)
    } else if (phase === 'count') {
      setPhase('signing'); setSigningStep('league'); setResult(null); setResetKey(k => k + 1)
    } else if (phase === 'signing') {
      if (signingStep === 'league') {
        setSigningStep('role'); setResult(null); setResetKey(k => k + 1)
      }
    }
  }

  const executeTransfer = async () => {
    setSaving(true)
    try {
      await fetch(`/api/market/${sessionId}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: pendingTransfer.out.name }),
      })
      await fetch(`/api/market/${sessionId}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: pendingTransfer.in.name }),
      })
      const newCompleted = [...completedSignings, { in: pendingTransfer.in, out: pendingTransfer.out }]
      setCompletedSignings(newCompleted)
      const updated = myPlayers.filter(p => p.name !== pendingTransfer.out.name).concat({ ...pendingTransfer.in })
      setMyPlayers(updated)
      setPendingTransfer(null)
      skipToNextSigning()
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
    if (phase === 'budget') return `💰 ${result.label} a disposizione`
    if (phase === 'count') return `🔄 ${result.value} acquisti`
    if (phase === 'signing') {
      if (signingStep === 'league') return `${result.country} ${result.name}`
      if (signingStep === 'role') return `📋 ${result.label}`
      if (signingStep === 'player') return `✅ ${result.name} (OVR ${result.rating})`
      if (signingStep === 'replace') return `🔄 Fuori ${result.name}`
    }
    return null
  }

  if (loading || (fromEuropa && phase === 'recap')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-xl">Caricamento...</div>
      </div>
    )
  }

  const seasonNumber = data?.seasonNumber || 1

  if (phase === 'relegated' || phase === 'done') {
    const totalScore = history.reduce((sum, h) => sum + (h.finalScore || 0), 0)
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{phase === 'relegated' ? '💀' : '🏆'}</div>
            <h1 className="text-4xl font-black text-white mb-2">
              {phase === 'relegated' ? 'Retrocesso!' : `${MAX_SEASONS} Stagioni completate!`}
            </h1>
            <p className="text-gray-500">
              {phase === 'relegated' ? 'La tua avventura finisce qui.' : 'Hai completato tutte le stagioni!'}
            </p>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center mb-6">
            <div className="text-gray-400 text-sm mb-1">Punteggio totale</div>
            <div className="text-5xl font-black text-green-400">{totalScore}</div>
            <div className="text-gray-500 text-xs mt-1">su {history.length} stagion{history.length === 1 ? 'e' : 'i'}</div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-6">
            <h2 className="text-lg font-black text-white mb-4">📊 Riepilogo stagioni</h2>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h.seasonNumber} className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 text-sm font-bold">Stagione {h.seasonNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                      h.position <= 4 ? 'bg-blue-500/20 text-blue-400' :
                      h.position <= 6 ? 'bg-green-500/20 text-green-400' :
                      h.position >= totalTeams - 2 ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>{h.position}°</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{h.wins}V {h.draws}P {h.losses}S</span>
                    <span>{h.goalsFor}:{h.goalsAgainst}</span>
                    <span className="text-green-400 font-black">{h.finalScore || 0} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-6">
            <h2 className="text-lg font-black text-white mb-4">👥 Rosa finale</h2>
            <div className="grid grid-cols-2 gap-1">
              {['GK', 'DEF', 'MID', 'ATT'].map(pos =>
                players.filter(p => p.position === pos).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      pos === 'GK' ? 'bg-yellow-500/20 text-yellow-400' :
                      pos === 'DEF' ? 'bg-blue-500/20 text-blue-400' :
                      pos === 'MID' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{pos}</span>
                    <span className="text-white text-sm truncate">{p.name}</span>
                    <span className="text-gray-500 text-xs ml-auto">{p.rating}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button onClick={() => navigate('/')}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl transition-all hover:scale-105 active:scale-95">
            GIOCA ANCORA →
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'recap') {
    return (
      <div className="min-h-screen bg-gray-950 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">{seasonNumber < MAX_SEASONS ? '📅' : '🏁'}</div>
            <h1 className="text-3xl font-black text-white">Fine stagione {seasonNumber}</h1>
            <p className="text-gray-500 mt-1">Stagione {seasonNumber} di {MAX_SEASONS}</p>
          </div>

          {history.length > 0 && (
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-4">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">Stagioni precedenti</h2>
              <div className="space-y-2">
                {history.map((h) => (
                  <div key={h.seasonNumber} className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm font-bold">Stagione {h.seasonNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        h.position <= 4 ? 'bg-blue-500/20 text-blue-400' :
                        h.position <= 6 ? 'bg-green-500/20 text-green-400' :
                        h.position >= totalTeams - 2 ? 'bg-red-500/20 text-red-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>{h.position}°</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{h.wins}V {h.draws}P {h.losses}S</span>
                      <span className="text-green-400 font-black">{h.finalScore || 0} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isRelegated ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center mb-6">
              <div className="text-4xl mb-2">💀</div>
              <div className="text-red-400 font-black text-xl">Retrocesso!</div>
              <div className="text-gray-400 text-sm mt-1">La tua avventura finisce qui.</div>
            </div>
          ) : seasonNumber >= MAX_SEASONS ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center mb-6">
              <div className="text-4xl mb-2">🏁</div>
              <div className="text-green-400 font-black text-xl">Ultima stagione completata!</div>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-6 text-center">
              <div className="text-gray-400 text-sm">Prossima stagione</div>
              <div className="text-white font-black text-2xl">Stagione {seasonNumber + 1}</div>
              <div className="text-gray-500 text-sm mt-1">Mercato estivo disponibile</div>
            </div>
          )}

          {/* Bottone europa OPPURE bottone mercato — mai entrambi */}
          {europaCompetition && !isRelegated && seasonNumber <= MAX_SEASONS ? (
            <button
              onClick={() => navigate(`/europa-group/${sessionId}`)}
              className={`w-full font-black text-xl py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 ${
                europaCompetition === 'champions' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                europaCompetition === 'europa' ? 'bg-orange-500 hover:bg-orange-400 text-white' :
                'bg-green-600 hover:bg-green-500 text-white'
              }`}
            >
              {europaCompetition === 'champions' ? '🏆 GIOCA LA CHAMPIONS LEAGUE' :
               europaCompetition === 'europa' ? '🟠 GIOCA L\'EUROPA LEAGUE' :
               '🟢 GIOCA LA CONFERENCE LEAGUE'}
            </button>
          ) : (
            <button
              onClick={() => {
                if (isRelegated || seasonNumber >= MAX_SEASONS) {
                  handleFinalRecap()
                } else {
                  handleNextSeason()
                }
              }}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              {isRelegated || seasonNumber >= MAX_SEASONS ? 'VEDI RIEPILOGO →' : 'INIZIA MERCATO ESTIVO →'}
            </button>
          )}
        </div>
      </div>
    )
  }

  const showNext = result && !pendingStep && !pendingTransfer

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🌞</div>
          <h1 className="text-3xl font-black text-white">Mercato Estivo</h1>
          <p className="text-gray-500 mt-1">{getStepTitle()}</p>
          <p className="text-gray-600 text-xs mt-1">Stagione {seasonNumber + 1} di {MAX_SEASONS}</p>
        </div>

        {completedSignings.length > 0 && (
          <div className="w-full bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-6">
            <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Acquisti effettuati</div>
            {completedSignings.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1">
                <span className="text-green-400 font-bold">IN</span>
                <span className="text-white">{s.in.name}</span>
                <span className="text-gray-600 mx-1">↔</span>
                <span className="text-red-400 font-bold">OUT</span>
                <span className="text-gray-400">{s.out.name}</span>
              </div>
            ))}
          </div>
        )}

        {pendingTransfer && (
          <div className="w-full bg-gray-900 rounded-2xl p-5 border border-gray-800 mb-6">
            <div className="text-center text-white font-black text-lg mb-4">Confermi lo scambio?</div>
            <div className="flex items-center justify-center gap-4 mb-5">
              <div className="text-center flex-1">
                <div className="text-red-400 text-xs font-bold mb-1">FUORI</div>
                <div className="text-white font-semibold">{pendingTransfer.out.name}</div>
                <div className="text-gray-500 text-xs">OVR {pendingTransfer.out.rating}</div>
              </div>
              <div className="text-gray-500 text-2xl">↔</div>
              <div className="text-center flex-1">
                <div className="text-green-400 text-xs font-bold mb-1">DENTRO</div>
                <div className="text-white font-semibold">{pendingTransfer.in.name}</div>
                <div className="text-gray-500 text-xs">OVR {pendingTransfer.in.rating}</div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={executeTransfer} disabled={saving}
                className="flex-1 bg-green-500 hover:bg-green-400 disabled:bg-gray-700 text-black font-black py-3 rounded-xl transition-all">
                {saving ? '...' : '✅ CONFERMA'}
              </button>
              <button onClick={skipToNextSigning} disabled={saving}
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-black py-3 rounded-xl transition-all border border-red-500/30">
                ❌ RIFIUTA
              </button>
            </div>
          </div>
        )}

        {result && !pendingStep && !pendingTransfer && (
          <div className="text-center mb-6">
            <div className="inline-block bg-green-500/10 border border-green-500/30 rounded-2xl px-6 py-3">
              <div className="text-xl font-black text-green-400">{getResultLabel()}</div>
            </div>
          </div>
        )}

        {pendingStep && (
          <div className="text-center mb-6">
            <div className="text-gray-500 text-sm">Preparazione ruota...</div>
          </div>
        )}

        {!pendingTransfer && (
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
                className="bg-white hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black text-lg px-10 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95">
                {saving ? 'Salvataggio...' : 'AVANTI →'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}