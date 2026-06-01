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

const BUDGET_OPTIONS = [
  { value: 10, label: '10M', maxRating: 76 },
  { value: 20, label: '20M', maxRating: 82 },
  { value: 30, label: '30M', maxRating: 88 },
]

function SpinWheel({ items, onResult, resetKey }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const rafRef = useRef(null)
  const [spinning, setSpinning] = useState(false)
  const [locked, setLocked] = useState(false)

  const colors = [
    '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#f97316', '#ec4899', '#10b981', '#6366f1',
    '#14b8a6', '#f43f5e', '#84cc16', '#0ea5e9', '#a855f7',
  ]

  useEffect(() => {
    setLocked(false)
    setSpinning(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    drawWheel(angleRef.current)
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
  }, [spinning, locked, items])

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
      ctx.font = `bold ${items.length > 10 ? '9' : '11'}px monospace`
      ctx.shadowColor = 'rgba(0,0,0,0.8)'
      ctx.shadowBlur = 4
      const label = item.label || item.name || String(item)
      const truncated = label.length > 14 ? label.slice(0, 13) + '…' : label
      ctx.fillText(truncated, R - 8, 4)
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

export default function Transfer() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const isAutoMode = searchParams.get('mode') === 'auto'
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()

  const [step, setStep] = useState('yesno')
  const [result, setResult] = useState(null)
  const [resetKey, setResetKey] = useState(0)
  const [signingStep, setSigningStep] = useState('league')

  const [doTransfer, setDoTransfer] = useState(null)
  const [budget, setBudget] = useState(null)
  const [signingCount, setSigningCount] = useState(0)
  const [currentSigning, setCurrentSigning] = useState(0)

  const [signingLeague, setSigningLeague] = useState(null)
  const [signingRole, setSigningRole] = useState(null)
  const [newPlayer, setNewPlayer] = useState(null)
  const [playerToReplace, setPlayerToReplace] = useState(null)

  const [myPlayers, setMyPlayers] = useState([])
  const [allPlayers, setAllPlayers] = useState({})
  const [wheelItems, setWheelItems] = useState([])
  const [pendingSigningStep, setPendingSigningStep] = useState(null)
  const [completedSignings, setCompletedSignings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [sessionId])

  useEffect(() => {
    if (pendingSigningStep && wheelItems.length > 0) {
      setSigningStep(pendingSigningStep)
      setPendingSigningStep(null)
      setResult(null)
      setResetKey(k => k + 1)
    }
  }, [wheelItems, pendingSigningStep])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      const data = await res.json()
      setSession(data.session)
      setMyPlayers(data.session.players || [])

      const pRes = await fetch('/api/market/all-players')
      const pData = await pRes.json()
      setAllPlayers(pData.players || {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const navigateAfterTransfer = () => {
    const dest = `/squad/${sessionId}${isAutoMode ? '?mode=auto' : ''}`
    setTimeout(() => navigate(dest), 500)
  }

  const getWheelItems = () => {
    if (step === 'yesno') return [
      { label: 'SI! 🛒', value: true, color: '#22c55e' },
      { label: 'NO ❌', value: false, color: '#ef4444' },
      { label: 'SI! 🛒', value: true, color: '#16a34a' },
      { label: 'NO ❌', value: false, color: '#ef4444' },
    ]
    if (step === 'budget') return BUDGET_OPTIONS.map(b => ({ ...b, label: b.label }))
    if (step === 'count') return [
      { label: '1 acquisto', value: 1, color: '#22c55e' },
      { label: '1 acquisto', value: 1, color: '#22c55e' },
      { label: '1 acquisto', value: 1, color: '#16a34a' },
      { label: '2 acquisti', value: 2, color: '#f59e0b' },
      { label: '2 acquisti', value: 2, color: '#d97706' },
      { label: '3 acquisti', value: 3, color: '#ef4444' },
    ]
    if (step === 'signing') {
      if (signingStep === 'league') return LEAGUES.map(l => ({ ...l, label: l.country + ' ' + l.name }))
      if (signingStep === 'role') return [
        { label: 'Portiere', value: 'GK', color: '#eab308' },
        { label: 'Difensore', value: 'DEF', color: '#3b82f6' },
        { label: 'Centrocampista', value: 'MID', color: '#22c55e' },
        { label: 'Attaccante', value: 'ATT', color: '#ef4444' },
      ]
      if (signingStep === 'player') return wheelItems
      if (signingStep === 'replace') return wheelItems
    }
    return []
  }

  const handleResult = (item) => {
    setResult(item)

    if (step === 'yesno') {
      setDoTransfer(item.value)
    } else if (step === 'budget') {
      setBudget(item)
    } else if (step === 'count') {
      setSigningCount(item.value)
    } else if (step === 'signing') {
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
        setPendingSigningStep('player')
        return
      } else if (signingStep === 'player') {
        setNewPlayer(item)
        const myInRole = myPlayers.filter(p => p.position === item.position)
        setWheelItems(myInRole.map(p => ({ ...p, label: p.name })))
        setPendingSigningStep('replace')
        return
      } else if (signingStep === 'replace') {
        setPlayerToReplace(item)
      }
    }
  }

  const goNext = async () => {
    if (step === 'yesno') {
      if (!doTransfer) {
        navigateAfterTransfer()
      } else {
        setStep('budget')
        setResult(null)
        setResetKey(k => k + 1)
      }
    } else if (step === 'budget') {
      setStep('count')
      setResult(null)
      setResetKey(k => k + 1)
    } else if (step === 'count') {
      setStep('signing')
      setSigningStep('league')
      setResult(null)
      setResetKey(k => k + 1)
    } else if (step === 'signing') {
      if (signingStep === 'league') {
        setSigningStep('role')
        setResult(null)
        setResetKey(k => k + 1)
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

      const newCompletedSignings = [...completedSignings, { in: newPlayer, out: playerToReplace }]
      setCompletedSignings(newCompletedSignings)

      const updatedPlayers = myPlayers
        .filter(p => p.name !== playerToReplace.name)
        .concat({ ...newPlayer })
      setMyPlayers(updatedPlayers)

      const nextSigning = currentSigning + 1

      if (nextSigning >= signingCount) {
        navigateAfterTransfer()
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
      console.error('Errore transfer:', err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-xl">Caricamento...</div>
      </div>
    )
  }

  const getStepTitle = () => {
    if (step === 'yesno') return 'Sessione di mercato?'
    if (step === 'budget') return 'Budget a disposizione'
    if (step === 'count') return 'Quanti acquisti?'
    if (step === 'signing') {
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
    if (step === 'yesno') return result.value ? '🛒 SI, facciamo mercato!' : '❌ No, si va avanti così'
    if (step === 'budget') return `💰 ${result.label} a disposizione`
    if (step === 'count') return `🔄 ${result.value} acquist${result.value === 1 ? 'o' : 'i'}`
    if (step === 'signing') {
      if (signingStep === 'league') return `${result.country} ${result.name}`
      if (signingStep === 'role') return `📋 ${result.label}`
      if (signingStep === 'player') return `✅ ${result.name} (OVR ${result.rating})`
      if (signingStep === 'replace') return `🔄 Fuori ${result.name}`
    }
    return null
  }

  const showNext = result && !pendingSigningStep

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏪</div>
          <h1 className="text-3xl font-black text-white">Calciomercato</h1>
          <p className="text-gray-500 mt-1">{getStepTitle()}</p>
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

        {result && !pendingSigningStep && (
          <div className="text-center mb-6">
            <div className="inline-block bg-green-500/10 border border-green-500/30 rounded-2xl px-6 py-3">
              <div className="text-xl font-black text-green-400">{getResultLabel()}</div>
              {step === 'signing' && signingStep === 'player' && result.cost && (
                <div className="text-gray-400 text-sm mt-1">Costo: {result.cost}M</div>
              )}
            </div>
          </div>
        )}

        {pendingSigningStep && (
          <div className="text-center mb-6">
            <div className="text-gray-500 text-sm">Preparazione ruota...</div>
          </div>
        )}

        <div className="flex flex-col items-center gap-6">
          <SpinWheel
            items={getWheelItems()}
            onResult={handleResult}
            resetKey={resetKey}
          />

          {showNext && (
            <button
              onClick={goNext}
              disabled={saving}
              className="bg-white hover:bg-gray-100 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black text-lg px-10 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
            >
              {saving ? 'Salvataggio...' :
               step === 'signing' && signingStep === 'replace' ? 'CONFERMA ACQUISTO ✓' : 'AVANTI →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}