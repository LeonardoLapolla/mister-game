import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'

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
    <div className="flex flex-col items-center gap-1">
      <div className={`w-12 h-12 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center shadow-lg`}>
        <span className={`text-xs font-black ${colors.text}`}>{player.rating}</span>
      </div>
      <span className="text-white text-xs font-semibold text-center w-16 truncate leading-tight">
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
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-xl">Caricamento...</div>
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

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-lg mx-auto">

        <div className="text-center mb-6">
          <h1 className="text-3xl font-black text-white">{session?.nickname}</h1>
          <p className="text-gray-500 mt-1">
            {session?.league} · {formation} · Overall medio{' '}
            <span className="text-green-400 font-bold">{avgRating}</span>
          </p>
          {isAutoMode && (
            <p className="text-yellow-400 text-sm mt-2">⚡ Modalità simulazione — il ritorno verrà simulato automaticamente</p>
          )}
        </div>

        <div
          className="relative rounded-2xl overflow-hidden mb-6"
          style={{
            background: 'linear-gradient(180deg, #166534 0%, #15803d 25%, #16a34a 50%, #15803d 75%, #166534 100%)',
            minHeight: '480px',
          }}
        >
          <div className="absolute inset-0 flex flex-col justify-between py-4 px-2 pointer-events-none">
            <div className="border-b border-white/20 w-1/2 mx-auto" />
            <div className="border border-white/20 w-1/3 mx-auto h-16 rounded-b-lg" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-white/20 pointer-events-none" />
          <div className="absolute top-1/2 left-0 right-0 border-t border-white/20 pointer-events-none" />
          <div className="absolute top-4 left-1/2 -translate-x-1/2 border border-white/20 w-1/3 h-16 rounded-t-lg pointer-events-none" />

          <div className="relative z-10 flex flex-col justify-around h-full py-6 px-2" style={{ minHeight: '480px' }}>
            {layout.map((row, rowIdx) => (
              <div key={rowIdx} className="flex justify-around items-center">
                {playersByPosition[row.pos]?.slice(0, row.count).map((player, i) => (
                  <PlayerDot key={i} player={player} />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-6">
          <div className="grid grid-cols-2 gap-2">
            {['GK', 'DEF', 'MID', 'ATT'].map(pos => (
              playersByPosition[pos]?.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
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
            ))}
          </div>
        </div>

        <div className="roster" style={{ padding: '12px 22px 0' }}>
          {['GK', 'DEF', 'MID', 'ATT'].map(pos => players.filter(p => p.position === pos).map((p, i) => (
            <div key={`${pos}-${i}`} className="rrow">
              <span className="rrole">{pos}</span>
              <span className="rnm">{p.name}</span>
              {p.team && <span style={{ fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--muted)', marginRight: 'auto' }}>{p.team}</span>}
              <span className="rovr">{p.rating}</span>
            </div>
          )))}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={simulating}
          className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-700 disabled:text-gray-500 text-black font-black text-xl py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
        >
          {simulating ? 'Simulazione ritorno...' : isAutoMode ? 'SIMULA IL RITORNO →' : 'INIZIA LA STAGIONE →'}
        </button>
      </div>
    </div>
  )
}