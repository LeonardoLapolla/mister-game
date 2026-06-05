import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'

const EUROPA_QUALS = {
  PL: { champions: [1,2,3,4,5,6], europa: [7,8], conference: [9] },
  SA: { champions: [1,2,3,4], europa: [5,6], conference: [7] },
  BL: { champions: [1,2,3,4], europa: [5,6], conference: [7] },
  LL: { champions: [1,2,3,4], europa: [5,6], conference: [7] },
  L1: { champions: [1,2,3], europa: [4,5,6], conference: [7] },
}

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
  const yourTeam = data.standings.find(s => s.name === 'La Tua Squadra') || {}
  const league = session?.league || 'SA'
  const quals = EUROPA_QUALS[league] || EUROPA_QUALS['SA']

  const getPositionStyle = (pos) => {
    if (pos === 1) return {
      row: 'bg-yellow-500/10', border: 'border-l-4 border-yellow-400', text: 'text-yellow-400'
    }
    if (quals.champions.includes(pos)) return {
      row: 'bg-blue-500/10', border: 'border-l-4 border-blue-400', text: 'text-blue-400'
    }
    if (quals.europa.includes(pos)) return {
      row: 'bg-orange-500/10', border: 'border-l-4 border-orange-400', text: 'text-orange-400'
    }
    if (quals.conference.includes(pos)) return {
      row: 'bg-green-500/10', border: 'border-l-4 border-green-500', text: 'text-green-400'
    }
    if (pos >= totalTeams - 2) return {
      row: 'bg-red-500/10', border: 'border-l-4 border-red-500', text: 'text-red-400'
    }
    return { row: 'bg-gray-900', border: '', text: 'text-gray-600' }
  }

  const handleContinue = () => {
    const params = new URLSearchParams({
      position: data.position,
      points: yourTeam.pts || 0,
      wins: yourTeam.w || 0,
      draws: yourTeam.d || 0,
      losses: yourTeam.l || 0,
      gf: yourTeam.gf || 0,
      ga: yourTeam.ga || 0,
      score: data.finalScore,
    })
    navigate(`/end-season/${sessionId}?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="max-w-3xl mx-auto">

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
            <div className="text-gray-500 text-sm mt-1">punti stagione</div>
          </div>
        </div>

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

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-400 inline-block"></span> Campione
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-blue-400 inline-block"></span> Champions League
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-orange-400 inline-block"></span> Europa League
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500 inline-block"></span> Conference League
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500 inline-block"></span> Retrocessione
            </span>
          </div>
        </div>

        <button
          onClick={handleContinue}
          className="w-full bg-green-500 hover:bg-green-400 text-black font-black text-xl py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
        >
          CONTINUA →
        </button>
      </div>
    </div>
  )
}