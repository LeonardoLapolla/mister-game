import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import { IconArrowRight } from '../components/Icons'

const POSITION_COLORS = {
  GK: { bg: 'bg-yellow-500', text: 'text-yellow-900', border: 'border-yellow-400' },
  DEF: { bg: 'bg-blue-500', text: 'text-blue-900', border: 'border-blue-400' },
  MID: { bg: 'bg-green-500', text: 'text-green-900', border: 'border-green-400' },
  ATT: { bg: 'bg-red-500', text: 'text-red-900', border: 'border-red-400' },
}

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

function PlayerDot({ player }) {
  const colors = POSITION_COLORS[player.position]
  return (
    <div className="flex flex-col items-center gap-1 animate-slide-up">
      <div className={`w-9 h-9 md:w-12 md:h-12 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
        <span className={`text-[10px] md:text-xs font-black ${colors.text}`} style={{ fontFamily: 'DM Mono, monospace' }}>{player.rating}</span>
      </div>
      <span className="text-[9px] md:text-[10px] font-semibold text-center w-12 md:w-16 truncate leading-tight" style={{ color: 'var(--c-text)' }}>
        {player.name.split(' ').pop()}
      </span>
    </div>
  )
}

export default function Squad() {
  const { sessionId } = useParams()
  const [searchParams] = useSearchParams()
  const isAutoMode = searchParams.get('mode') === 'auto'
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div className="text-xl animate-pulse" style={{ color: 'var(--c-muted)' }}>Caricamento...</div>
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

  const posStyle = (pos) => {
    if (pos === 'GK') return { bg: 'rgba(255,171,0,0.15)', color: 'var(--c-amber)' }
    if (pos === 'DEF') return { bg: 'rgba(68,138,255,0.15)', color: 'var(--c-blue)' }
    if (pos === 'MID') return { bg: 'rgba(0,230,118,0.15)', color: 'var(--c-green)' }
    return { bg: 'rgba(255,61,87,0.15)', color: 'var(--c-red)' }
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--c-bg)' }}>
      <div className="max-w-lg mx-auto">

        <div className="text-center mb-6">
          <h1 className="section-title" style={{ fontSize: 'clamp(1.8rem,6vw,2.5rem)' }}>{session?.nickname}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--c-muted)' }}>
            {session?.league} · {formation} · Overall medio{' '}
            <span className="font-bold" style={{ color: 'var(--c-green)' }}>{avgRating}</span>
          </p>
          {isAutoMode && (
            <p className="text-sm mt-2" style={{ color: 'var(--c-amber)' }}>Modalità simulazione — il ritorno verrà simulato automaticamente</p>
          )}
        </div>

        {/* Campo — aspect-ratio per evitare overflow su mobile */}
        <div
          className="relative w-full rounded-2xl overflow-hidden mb-5"
          style={{
            background: 'linear-gradient(180deg, #0a1f10 0%, #0d2914 25%, #0f3318 50%, #0d2914 75%, #0a1f10 100%)',
            aspectRatio: '2 / 3',
            border: '1px solid rgba(0,230,118,0.15)',
            boxShadow: '0 0 40px rgba(0,230,118,0.05)',
          }}
        >
          <div className="absolute inset-0 flex flex-col justify-between py-4 px-2 pointer-events-none">
            <div className="border-b border-white/15 w-1/2 mx-auto" />
            <div className="border border-white/15 w-1/3 mx-auto h-14 rounded-b-lg" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/15 pointer-events-none" />
          <div className="absolute top-1/2 left-0 right-0 border-t border-white/15 pointer-events-none" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 border border-white/15 w-1/3 h-14 rounded-t-lg pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-around h-full py-6 px-2">
            {layout.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-around items-center">
                {playersByPosition[row.pos]?.slice(0, row.count).map((player, i) => (
                  <PlayerDot key={i} player={player} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Lista rosa */}
        <div className="card-base p-4 mb-5">
          <div className="grid grid-cols-2 gap-2">
            {['GK', 'DEF', 'MID', 'ATT'].map(pos => (
              playersByPosition[pos]?.map((p, i) => {
                const s = posStyle(pos)
                return (
                  <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>{pos}</span>
                    <span className="text-sm truncate" style={{ color: 'var(--c-text)' }}>{p.name}</span>
                    <span className="text-xs ml-auto" style={{ fontFamily: 'DM Mono, monospace', color: 'var(--c-muted)' }}>{p.rating}</span>
                  </div>
                )
              })
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(255,61,87,0.1)', border: '1px solid rgba(255,61,87,0.3)', color: 'var(--c-red)' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={simulating}
          className="btn-primary w-full py-4 text-xl disabled:opacity-40"
          style={{ fontWeight: 800 }}
        >
          {simulating ? 'Simulazione ritorno...' : isAutoMode ? 'SIMULA IL RITORNO →' : 'INIZIA LA STAGIONE →'}
        </button>
      </div>
    </div>
  )
}