import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import useBlockBack from '../hooks/useBlockBack'

const COMPETITION_INFO = {
  champions: { name: 'Champions League', emoji: '🏆', color: '#1a56db', bg: 'rgba(26,86,219,0.1)', border: 'rgba(26,86,219,0.3)' },
  europa: { name: 'Europa League', emoji: '🟠', color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  conference: { name: 'Conference League', emoji: '🟢', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' },
}

export default function EuropaGroup() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()
  useBlockBack()

  const [loading, setLoading] = useState(true)
  const [europaState, setEuropaState] = useState(null)
  const [error, setError] = useState(null)
  const [phase, setPhase] = useState('results') // results | eliminated | qualified

  useEffect(() => {
    init()
  }, [sessionId])

  const init = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      const data = await res.json()
      setSession(data.session)

      // Guard: redirect if session not in valid state for this page
      if (!data.session?.finished) {
        navigate(`/end-season/${sessionId}`, { replace: true })
        return
      }
      if (data.session?.europaData) {
        try {
          const ed = JSON.parse(data.session.europaData)
          if (ed.phase === 'eliminated' || ed.phase === 'winner') {
            navigate(`/end-season/${sessionId}`, { replace: true })
            return
          }
          if (ed.phase === 'knockout') {
            navigate(`/europa-knockout/${sessionId}`, { replace: true })
            return
          }
        } catch {}
      }

      // Genera il girone (simula tutto automaticamente)
      const groupRes = await fetch(`/api/europa/${sessionId}/generate-group`, { method: 'POST' })
      const groupData = await groupRes.json()
      if (!groupRes.ok) throw new Error(groupData.error)

      // Finalizza subito il girone
      const finishRes = await fetch(`/api/europa/${sessionId}/finish-group`, { method: 'POST' })
      const finishData = await finishRes.json()
      if (!finishRes.ok) throw new Error(finishData.error)

      // Recupera stato completo
      const stateRes = await fetch(`/api/europa/${sessionId}/state`)
      const stateData = await stateRes.json()
      setEuropaState(stateData)

      if (finishData.qualified) {
        setPhase('qualified')
      } else {
        setPhase('eliminated')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-xl animate-pulse">Simulazione girone...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    )
  }

  const competition = europaState?.competition
  const info = COMPETITION_INFO[competition] || COMPETITION_INFO.conference
  const teamName = session?.nickname || 'La Tua Squadra'
  const standings = europaState?.standings || []
  const playerStats = europaState?.playerStats || {}
  const groupPosition = europaState?.groupPosition

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">{info.emoji}</div>
          <h1 className="text-3xl font-black text-white">{info.name}</h1>
          <p className="text-gray-500 mt-1">Fase a Gironi · {teamName}</p>
        </div>

        {/* Stats giocatore */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { label: 'Punti', value: playerStats.pts || 0, color: 'text-green-400' },
            { label: 'V', value: playerStats.w || 0, color: 'text-green-400' },
            { label: 'P', value: playerStats.d || 0, color: 'text-yellow-400' },
            { label: 'S', value: playerStats.l || 0, color: 'text-red-400' },
            { label: 'Gol', value: `${playerStats.gf || 0}/${playerStats.ga || 0}`, color: 'text-white' },
          ].map(s => (
            <div key={s.label} className="bg-gray-900 rounded-xl p-3 text-center">
              <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-gray-600 text-xs">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Risultati partite giocatore */}
        {europaState?.playerMatches?.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-4">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">
              Le tue partite nel girone
            </h2>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {europaState.playerMatches.map((m, i) => {
                const win = m.result === 'win'
                const draw = m.result === 'draw'
                return (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        win ? 'bg-green-500/20 text-green-400' :
                        draw ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>{win ? 'V' : draw ? 'P' : 'S'}</span>
                      <span className="text-gray-300 text-xs truncate max-w-32">{m.opponent}</span>
                    </div>
                    <span className="text-white text-xs font-black">{m.goalsFor} - {m.goalsAgainst}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Classifica girone */}
        {standings.length > 0 && (
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 mb-4">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-wider mb-3">
              Classifica Girone
            </h2>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {standings.map((team, i) => {
                const isYou = team.isPlayer
                const pos = i + 1
                const qualified = pos <= 16
                return (
                  <div key={team.name}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${
                      isYou ? 'bg-green-500/10 border border-green-500/30' :
                      qualified ? 'bg-blue-500/5' : 'bg-gray-800'
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black w-5 ${qualified ? 'text-blue-400' : 'text-gray-600'}`}>
                        {pos}
                      </span>
                      <span className={`text-xs font-semibold truncate max-w-28 ${isYou ? 'text-green-400' : 'text-gray-300'}`}>
                        {isYou ? `⭐ ${teamName}` : team.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600">{team.w}V {team.d}P {team.l}S</span>
                      <span className={`font-black ${isYou ? 'text-green-400' : qualified ? 'text-blue-400' : 'text-gray-400'}`}>
                        {team.pts}pt
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
              <span className="w-3 h-3 rounded bg-blue-400 inline-block"></span> Prime 16 qualificate
            </div>
          </div>
        )}

        {/* Eliminato */}
        {phase === 'eliminated' && (
          <div className="text-center">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6">
              <div className="text-4xl mb-2">💀</div>
              <div className="text-red-400 font-black text-xl">Eliminato al girone!</div>
              <div className="text-gray-400 text-sm mt-1">Posizione finale: {groupPosition}°</div>
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

        {/* Qualificato */}
        {phase === 'qualified' && (
          <div className="text-center">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-blue-400 font-black text-xl">Qualificato agli Ottavi!</div>
              <div className="text-gray-400 text-sm mt-1">Posizione nel girone: {groupPosition}°</div>
            </div>
            <button
              onClick={() => navigate(`/europa-knockout/${sessionId}`)}
              className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black text-xl py-4 rounded-2xl transition-all"
            >
              FASE AD ELIMINAZIONE →
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