import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'

const POSITION_LABELS = { GK: 'Goalkeeper', DEF: 'Defender', MID: 'Midfielder', ATT: 'Forward' }
const POSITION_ORDER = ['GK', 'DEF', 'MID', 'ATT']

const FORMATION_SLOTS = {
  '4-3-3': { GK: 1, DEF: 4, MID: 3, ATT: 3 },
  '4-4-2': { GK: 1, DEF: 4, MID: 4, ATT: 2 },
  '3-5-2': { GK: 1, DEF: 3, MID: 5, ATT: 2 },
  '5-3-2': { GK: 1, DEF: 5, MID: 3, ATT: 2 },
  '4-2-3-1': { GK: 1, DEF: 4, MID: 5, ATT: 1 },
}

export default function Market() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()

  const [availablePlayers, setAvailablePlayers] = useState([])
  const [filterPosition, setFilterPosition] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchMarket()
  }, [sessionId])

  const fetchMarket = async () => {
    try {
      const res = await fetch(`/api/market/${sessionId}`)
      const data = await res.json()
      setAvailablePlayers(data.players)
      setSession(data.session)
    } catch (err) {
      setError('Error loading market')
    } finally {
      setLoading(false)
    }
  }

  const buyPlayer = async (playerName) => {
    setBuying(playerName)
    setError(null)
    try {
      const res = await fetch(`/api/market/${sessionId}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSession(data.session)
      setAvailablePlayers((prev) => prev.filter((p) => p.name !== playerName))
    } catch (err) {
      setError(err.message)
    } finally {
      setBuying(null)
    }
  }

  const sellPlayer = async (playerName) => {
    setError(null)
    try {
      const res = await fetch(`/api/market/${sessionId}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSession(data.session)
      await fetchMarket()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-xl">Loading market...</div>
      </div>
    )
  }

  if (!session) return null

  const slots = FORMATION_SLOTS[session.formation] || {}
  const totalSlots = Object.values(slots).reduce((a, b) => a + b, 0)
  const rosaCompleta = session.players.length >= totalSlots
  const budgetRimasto = session.budget - session.budgetSpent

  const filtered = filterPosition === 'ALL'
    ? availablePlayers
    : availablePlayers.filter((p) => p.position === filterPosition)

  const playersByPosition = (pos) => session.players.filter((p) => p.position === pos)

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Transfer Market</h1>
            <p className="text-gray-500">{session.nickname} · {session.formation} · {session.league}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-green-400">{budgetRimasto}M</div>
            <div className="text-gray-500 text-sm">budget remaining</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Rosa attuale */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold text-white mb-4">
              Your squad ({session.players.length}/{totalSlots})
            </h2>
            {POSITION_ORDER.map((pos) => (
              <div key={pos} className="mb-4">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
                  {POSITION_LABELS[pos]} ({playersByPosition(pos).length}/{slots[pos]})
                </div>
                {playersByPosition(pos).map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-gray-900 rounded-lg px-3 py-2 mb-1">
                    <div>
                      <div className="text-white text-sm font-semibold">{p.name}</div>
                      <div className="text-gray-500 text-xs">Rating {p.rating} · {p.cost}M</div>
                    </div>
                    <button
                      onClick={() => sellPlayer(p.name)}
                      className="text-red-400 hover:text-red-300 text-xs font-bold ml-2"
                    >
                      SELL
                    </button>
                  </div>
                ))}
                {Array.from({ length: slots[pos] - playersByPosition(pos).length }).map((_, i) => (
                  <div key={i} className="flex items-center bg-gray-900/50 border border-dashed border-gray-800 rounded-lg px-3 py-2 mb-1">
                    <div className="text-gray-700 text-sm">Empty slot</div>
                  </div>
                ))}
              </div>
            ))}

            {error && (
              <div className="mt-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {rosaCompleta && (
              <button
                onClick={() => navigate(`/season/${sessionId}`)}
                className="w-full mt-4 bg-green-500 hover:bg-green-400 text-black font-black py-3 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                START SEASON →
              </button>
            )}
          </div>

          {/* Giocatori disponibili */}
          <div className="lg:col-span-2">
            <div className="flex gap-2 mb-4 flex-wrap">
              {['ALL', ...POSITION_ORDER].map((pos) => (
                <button
                  key={pos}
                  onClick={() => setFilterPosition(pos)}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                    filterPosition === pos
                      ? 'bg-green-500 text-black'
                      : 'bg-gray-900 text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  {pos === 'ALL' ? 'All' : POSITION_LABELS[pos]}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map((p) => {
                const slotPieni = playersByPosition(p.position).length >= (slots[p.position] || 0)
                const nonHaBudget = p.cost > budgetRimasto
                const disabled = slotPieni || nonHaBudget || buying === p.name

                return (
                  <div
                    key={p.name}
                    className={`flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3 transition-all ${
                      disabled ? 'opacity-50' : 'hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`text-xs font-bold px-2 py-1 rounded ${
                        p.position === 'GK' ? 'bg-yellow-500/20 text-yellow-400' :
                        p.position === 'DEF' ? 'bg-blue-500/20 text-blue-400' :
                        p.position === 'MID' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {p.position}
                      </div>
                      <div>
                        <div className="text-white font-semibold">{p.name}</div>
                        <div className="text-gray-500 text-xs">Rating {p.rating}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-green-400 font-bold">{p.cost}M</div>
                      <button
                        onClick={() => buyPlayer(p.name)}
                        disabled={disabled}
                        className="bg-green-500 hover:bg-green-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold px-3 py-1 rounded-lg text-sm transition-all"
                      >
                        {buying === p.name ? '...' : 'BUY'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}