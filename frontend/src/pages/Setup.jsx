import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'

const BUDGET_OPTIONS = [
  { value: 100, label: '100M', description: 'Facile — punteggio base', color: 'green' },
  { value: 50, label: '50M', description: 'Equilibrato', color: 'yellow' },
  { value: 30, label: '30M', description: 'Difficile — massimo punteggio', color: 'red' },
]

const FORMATION_OPTIONS = [
  { id: '4-3-3', description: 'Offensivo' },
  { id: '4-4-2', description: 'Equilibrato' },
  { id: '3-5-2', description: 'Centrocampo folto' },
  { id: '5-3-2', description: 'Difensivo' },
  { id: '4-2-3-1', description: 'Contropiede' },
]

export default function Setup() {
  const navigate = useNavigate()
  const setSession = useGameStore((s) => s.setSession)

  const [leagues, setLeagues] = useState({})
  const [nickname, setNickname] = useState('')
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [selectedBudget, setSelectedBudget] = useState(null)
  const [selectedFormation, setSelectedFormation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/game/data/setup')
      .then((r) => r.json())
      .then((data) => setLeagues(data.leagues))
  }, [])

  const canProceed = nickname.trim() && selectedLeague && selectedBudget && selectedFormation

  const handleStart = async () => {
    if (!canProceed) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/game/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          league: selectedLeague,
          budget: selectedBudget,
          formation: selectedFormation,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSession(data.session)
      navigate(`/market/${data.session.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-2">Crea il tuo club</h1>
        <p className="text-gray-500 mb-10">Scegli con cura — non si torna indietro.</p>

        {/* Nickname */}
        <div className="mb-8">
          <label className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3 block">
            Nome allenatore
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Es. Mister Rossi"
            maxLength={20}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
          />
        </div>

        {/* Campionato */}
        <div className="mb-8">
          <label className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3 block">
            Campionato
          </label>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(leagues).map(([code, league]) => (
              <button
                key={code}
                onClick={() => setSelectedLeague(code)}
                className={`flex items-center justify-between px-5 py-4 rounded-xl border transition-all ${
                  selectedLeague === code
                    ? 'border-green-500 bg-green-500/10 text-white'
                    : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">{league.name}</span>
                  <span className="text-gray-500 text-sm">{league.country}</span>
                </div>
                <span className="text-xs text-gray-600">
                  ×{league.multiplier} punti
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="mb-8">
          <label className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3 block">
            Budget
          </label>
          <div className="grid grid-cols-3 gap-3">
            {BUDGET_OPTIONS.map((b) => (
              <button
                key={b.value}
                onClick={() => setSelectedBudget(b.value)}
                className={`px-4 py-4 rounded-xl border transition-all text-center ${
                  selectedBudget === b.value
                    ? 'border-green-500 bg-green-500/10 text-white'
                    : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-2xl font-black text-white">{b.label}</div>
                <div className="text-xs text-gray-500 mt-1">{b.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Modulo */}
        <div className="mb-10">
          <label className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-3 block">
            Modulo
          </label>
          <div className="grid grid-cols-5 gap-2">
            {FORMATION_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFormation(f.id)}
                className={`px-3 py-4 rounded-xl border transition-all text-center ${
                  selectedFormation === f.id
                    ? 'border-green-500 bg-green-500/10 text-white'
                    : 'border-gray-800 bg-gray-900 text-gray-400 hover:border-gray-600'
                }`}
              >
                <div className="text-lg font-black text-white">{f.id}</div>
                <div className="text-xs text-gray-500 mt-1">{f.description}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={!canProceed || loading}
          className="w-full bg-green-500 hover:bg-green-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-black text-xl py-4 rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:scale-100"
        >
          {loading ? 'Creazione...' : 'VAI AL MERCATO →'}
        </button>
      </div>
    </div>
  )
}