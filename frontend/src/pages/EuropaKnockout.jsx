import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import useBlockBack from '../hooks/useBlockBack'

const COMPETITION_INFO = {
  champions: { name: 'Champions League', emoji: '🏆', color: '#1a56db' },
  europa: { name: 'Europa League', emoji: '🟠', color: '#f97316' },
  conference: { name: 'Conference League', emoji: '🟢', color: '#22c55e' },
}

const ROUND_LABELS = {
  R16: 'Ottavi di Finale',
  QF: 'Quarti di Finale',
  SF: 'Semifinali',
  Final: 'Finale',
}

function MatchWheel({ probs, onResult, locked, onLock }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const rafRef = useRef(null)
  const [spinning, setSpinning] = useState(false)

  const items = [
    { label: 'VITTORIA', result: 'win', color: '#22c55e', prob: probs.win },
    { label: 'PAREGGIO', result: 'draw', color: '#f59e0b', prob: probs.draw },
    { label: 'SCONFITTA', result: 'loss', color: '#ef4444', prob: probs.loss },
  ]

  useEffect(() => { drawWheel(angleRef.current) }, [probs])

  useEffect(() => {
    const handleKey = (e) => { if (e.code === 'Space') { e.preventDefault(); spin() } }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [spinning, locked])

  function drawWheel(angle) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const R = Math.min(W, H) / 2 - 8
    ctx.clearRect(0, 0, W, H)
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
    ctx.beginPath()
    ctx.arc(cx, cy, 18, 0, 2 * Math.PI)
    ctx.fillStyle = '#111827'
    ctx.fill()
    ctx.strokeStyle = '#4b5563'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  function getResult(angle) {
    const normalized = (((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))
    const normalized360 = (normalized / (2 * Math.PI)) * 100
    let cumulative = 0
    for (const item of items) {
      cumulative += item.prob
      if (normalized360 <= cumulative) return item
    }
    return items[items.length - 1]
  }

  function spin() {
    if (spinning || locked) return
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
        <canvas ref={canvasRef} width={300} height={300} className="rounded-full shadow-2xl" />
      </div>
      <button
        onClick={spin}
        disabled={spinning || locked}
        className="bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black text-lg px-10 py-3 rounded-2xl transition-all hover:scale-105 active:scale-95 disabled:scale-100"
      >
        {spinning ? 'GIRANDO...' : locked ? 'GIOCATA ✓' : 'GIRA! ⚽'}
      </button>
      <p className="text-gray-600 text-xs">
        premi <kbd className="bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded text-xs">spazio</kbd> per girare
      </p>
    </div>
  )
}

export default function EuropaKnockout() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()
  useBlockBack()

  const [loading, setLoading] = useState(true)
  const [europaState, setEuropaState] = useState(null)
  const [nextMatch, setNextMatch] = useState(null)
  const [probs, setProbs] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [locked, setLocked] = useState(false)
  const [error, setError] = useState(null)
  const [phase, setPhase] = useState('playing') // playing | eliminated | winner

  useEffect(() => {
    init()
  }, [sessionId])

  const init = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      const data = await res.json()
      setSession(data.session)
      await refreshState()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const refreshState = async () => {
    const stateRes = await fetch(`/api/europa/${sessionId}/state`)
    const stateData = await stateRes.json()
    setEuropaState(stateData)

    if (stateData.phase === 'eliminated') {
      setPhase('eliminated')
      return
    }
    if (stateData.phase === 'winner') {
      setPhase('winner')
      return
    }

    await fetchNextMatch()
  }

  const fetchNextMatch = async () => {
    const res = await fetch(`/api/europa/${sessionId}/next-knockout-match`)
    const data = await res.json()

    if (data.finished) {
      setPhase('winner')
      return
    }

    setNextMatch(data.match)
    setProbs(data.probs)
    setLocked(false)
    setPhase('playing')
  }

  const handleWheelResult = async (item) => {
    try {
      const res = await fetch(`/api/europa/${sessionId}/play-knockout-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: item.result }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setLastResult({
        outcome: data.result,
        goalsFor: data.goalsFor,
        goalsAgainst: data.goalsAgainst,
        opponent: nextMatch.opponent || nextMatch.away,
        eliminated: data.eliminated,
        nextRound: data.nextRound,
      })

      setTimeout(async () => {
        setLastResult(null)
        if (data.eliminated) {
          setPhase('eliminated')
          await refreshState()
        } else if (!data.nextRound) {
          setPhase('winner')
          await refreshState()
        } else {
          await refreshState()
        }
      }, 2500)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-xl animate-pulse">Caricamento...</div>
      </div>
    )
  }

  const competition = europaState?.competition
  const info = COMPETITION_INFO[competition] || COMPETITION_INFO.conference
  const teamName = session?.nickname || 'La Tua Squadra'
  const currentRound = europaState?.knockoutRound
  const roundLabel = ROUND_LABELS[currentRound] || currentRound

  // Partite del round corrente
  const currentRoundMatches = europaState?.knockoutMatches?.filter(
    m => m.round === currentRound
  ) || []

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{info.emoji}</div>
          <h1 className="text-3xl font-black text-white">{info.name}</h1>
          {phase === 'playing' && (
            <p className="text-blue-400 font-bold mt-1">{roundLabel}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">{teamName}</p>
        </div>

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
                 lastResult.outcome === 'draw' ? '🤝 AI RIGORI' : '💀 ELIMINATO'}
              </div>
              <div className="text-white font-black text-5xl mb-2">
                {lastResult.goalsFor} - {lastResult.goalsAgainst}
              </div>
              <div className="text-white/80 text-lg">vs {lastResult.opponent}</div>
              {!lastResult.eliminated && lastResult.nextRound && (
                <div className="text-white/60 text-sm mt-2">
                  Accedi ai {ROUND_LABELS[lastResult.nextRound]}!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fase eliminazione — prossima partita */}
        {phase === 'playing' && nextMatch && !lastResult && (
          <>
            <div className="bg-gray-900 rounded-2xl p-4 mb-4 border border-gray-800">
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">
                {roundLabel}
              </div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-white font-black text-xl">
                    {nextMatch.opponent || nextMatch.away}
                  </div>
                  <div className="text-gray-500 text-sm">
                    Rating {nextMatch.opponentRating} · Eliminazione diretta
                  </div>
                  <div className="text-yellow-400 text-xs mt-1">
                    ⚠️ In caso di pareggio si va ai rigori
                  </div>
                </div>
              </div>
              {probs && (
                <div className="flex gap-2">
                  <div className="flex-1 bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-center">
                    <div className="text-green-400 font-black">{probs.win}%</div>
                    <div className="text-gray-600 text-xs">Vittoria</div>
                  </div>
                  <div className="flex-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 text-center">
                    <div className="text-yellow-400 font-black">{probs.draw}%</div>
                    <div className="text-gray-600 text-xs">Rigori</div>
                  </div>
                  <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                    <div className="text-red-400 font-black">{probs.loss}%</div>
                    <div className="text-gray-600 text-xs">Sconfitta</div>
                  </div>
                </div>
              )}
            </div>

            {probs && (
              <div className="flex flex-col items-center mb-6">
                <MatchWheel
                  probs={probs}
                  onResult={handleWheelResult}
                  locked={locked}
                  onLock={() => setLocked(true)}
                />
              </div>
            )}
          </>
        )}

        {/* Tabellone round corrente */}
        {currentRoundMatches.length > 0 && phase === 'playing' && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-4">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">
              {roundLabel} — Tabellone
            </h2>
            <div className="space-y-2">
              {currentRoundMatches.map((match, i) => {
                const isPlayerMatch = match.isPlayerMatch
                return (
                  <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                    isPlayerMatch ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-800'
                  }`}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={isPlayerMatch ? 'text-green-400 font-bold' : 'text-gray-300'}>
                        {isPlayerMatch ? `⭐ ${teamName}` : match.home}
                      </span>
                      <span className="text-gray-600">vs</span>
                      <span className="text-gray-300">{match.away}</span>
                    </div>
                    {match.played && (
                      <span className="text-xs font-bold text-gray-500">
                        {match.goalsFor ?? '?'} - {match.goalsAgainst ?? '?'}
                      </span>
                    )}
                    {!match.played && (
                      <span className="text-xs text-gray-600">Da giocare</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Eliminato */}
        {phase === 'eliminated' && !lastResult && (
          <div className="text-center">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
              <div className="text-4xl mb-2">💀</div>
              <div className="text-red-400 font-black text-xl">Eliminato!</div>
              <div className="text-gray-400 text-sm mt-1">
                Sei uscito {ROUND_LABELS[europaState?.finalRound] || 'dalla competizione'}
              </div>
              <div className="text-green-400 font-bold text-lg mt-3">
                +{europaState?.europaScore || 0} punti bonus
              </div>
            </div>
            <button
              onClick={() => navigate(`/end-season/${sessionId}`)}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl transition-all"
            >
              CONTINUA →
            </button>
          </div>
        )}

        {/* Vincitore */}
        {phase === 'winner' && !lastResult && (
          <div className="text-center">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6">
              <div className="text-5xl mb-3">🏆</div>
              <div className="text-yellow-400 font-black text-2xl">HAI VINTO!</div>
              <div className="text-white text-lg mt-1">{info.name}</div>
              <div className="text-green-400 font-bold text-xl mt-3">
                +{europaState?.europaScore || 0} punti bonus
              </div>
            </div>
            <button
                onClick={async () => {
                    const sessionRes = await fetch(`/api/game/${sessionId}`)
                    const sessionData = await sessionRes.json()
                    const pos = sessionData.session.position || 0
                    const scoreRes = await fetch(`/api/europa/${sessionId}/score`)
                    const scoreData = await scoreRes.json()
                    navigate(`/end-season/${sessionId}?fromEuropa=true&position=${pos}&score=${scoreData.score || 0}`)
                }}
                className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl transition-all"
                >
                CONTINUA →
                </button>
          </div>
        )}

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}