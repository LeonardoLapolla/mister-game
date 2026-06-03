import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'

export default function Results() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { setStandings, setFinalScore, session } = useGameStore()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchResults()
  }, [sessionId])

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/match/${sessionId}/finish`, { method: 'POST' })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error)
      setData(result)
      setStandings(result.standings)
      setFinalScore(result.finalScore)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400 text-xl">Calcolo risultati...</div>
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

  const totalTeams = data.standings.length
  const teamName = session?.nickname || 'La Tua Squadra'

  const getPositionStyle = (pos) => {
    if (pos === 1) return { row: 'bg-yellow-500/10', border: 'border-l-4 border-yellow-400', text: 'text-yellow-400' }
    if (pos <= 4) return { row: 'bg-blue-500/10', border: 'border-l-4 border-blue-400', text: 'text-blue-400' }
    if (pos <= 6) return { row: 'bg-green-500/10', border: 'border-l-4 border-green-500', text: 'text-green-400' }
    if (pos >= totalTeams - 2) return { row: 'bg-red-500/10', border: 'border-l-4 border-red-500', text: 'text-red-400' }
    return { row: 'bg-gray-900', border: '', text: 'text-gray-600' }
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-3xl mx-auto">

        {/* Risultato principale */}
        <div className="text-center mb-12">
          <div className="text-7xl mb-4">
            {data.position === 1 ? '🏆' :
             data.position === 2 ? '🥈' :
             data.position === 3 ? '🥉' :
             data.position <= 6 ? '⭐' : '📊'}
          </div>
          <h1 className="text-5xl font-black text-white mb-1">{data.label}</h1>
          <p className="text-gray-400 mb-2 text-lg">{teamName}</p>
          <p className="text-gray-500 mb-6">{data.position}° posto in classifica</p>
          <div className="inline-block bg-green-500/10 border border-green-500/30 rounded-2xl px-8 py-4">
            <div className="text-5xl font-black text-green-400">{data.finalScore}</div>
            <div className="text-gray-500 text-sm mt-1">punti totali</div>
          </div>
        </div>

        {/* Classifica finale */}
        <div className="mb-10">
          <h2 className="text-xl font-black text-white mb-4">Classifica finale</h2>
          <div className="space-y-1">
            {data.standings.map((team, i) => {
              const isYou = team.name === 'La Tua Squadra'
              const pos = i + 1
              const style = getPositionStyle(pos)

              return (
                <div
                  key={team.name}
                  className={`flex items-center justify-between px-4 py-2 rounded-xl ${style.row} ${style.border} ${isYou ? 'ring-1 ring-white/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-black w-6 ${style.text}`}>{pos}</span>
                    <span className="font-semibold text-sm text-white">
                      {isYou ? `⭐ ${teamName}` : team.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-500">{team.w}V {team.d}P {team.l}S</span>
                    <span className="text-gray-500">{team.gf}:{team.ga}</span>
                    <span className={`font-black ${style.text === 'text-gray-600' ? 'text-white' : style.text}`}>
                      {team.pts} pt
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-400 inline-block"></span> Campione
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-400 inline-block"></span> Champions League
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500 inline-block"></span> Europa League
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500 inline-block"></span> Retrocessione
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate(`/end-season/${sessionId}?position=${data.position}&points=${data.finalScore}&wins=${data.standings.find(s => s.name === 'La Tua Squadra')?.w || 0}&draws=${data.standings.find(s => s.name === 'La Tua Squadra')?.d || 0}&losses=${data.standings.find(s => s.name === 'La Tua Squadra')?.l || 0}&gf=${data.standings.find(s => s.name === 'La Tua Squadra')?.gf || 0}&ga=${data.standings.find(s => s.name === 'La Tua Squadra')?.ga || 0}`)}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
        >
          CONTINUA →
        </button>
      </div>
    </div>
  )
}