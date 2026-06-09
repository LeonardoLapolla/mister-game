import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import useBlockBack from '../hooks/useBlockBack'
import usePageGuard from '../hooks/usePageGuard'

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
  useBlockBack()
  const guardPassed = usePageGuard(sessionId, s => !s.finished ? `/season/${sessionId}` : null)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { fetchResults() }, [sessionId])

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

  if (!guardPassed || loading) {
    return <div className="mister-loading"><div>Calculating results...</div></div>
  }

  if (error) {
    return <div className="mister-loading" style={{ color: 'var(--loss)' }}><div>{error}</div></div>
  }

  const totalTeams = data.standings.length
  const teamName = session?.nickname || 'La Tua Squadra'
  const yourTeam = data.standings.find(s => s.name === 'La Tua Squadra') || {}
  const league = session?.league || 'SA'
  const quals = EUROPA_QUALS[league] || EUROPA_QUALS['SA']

  const getZone = (pos) => {
    if (pos === 1) return 'ch'
    if (quals.champions.includes(pos)) return 'ch'
    if (quals.europa.includes(pos)) return 'el'
    if (quals.conference.includes(pos)) return 'co'
    if (pos >= totalTeams - 2) return 'rel'
    return ''
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
    <div className="mister-page">
      <div className="page-scroll" style={{ flex: 1 }}>
        {/* Finish card */}
        <div className="finish-card" style={{ marginTop: 24 }}>
          <div className="finish-pos">{data.position}°</div>
          <div className="finish-info">
            <b>{data.label}</b>
            <span>{teamName}</span>
          </div>
          <div className="finish-score">
            <span>Season score</span>
            <b>{data.finalScore}</b>
          </div>
        </div>

        {/* Standings */}
        <div className="section-title">Final standings</div>
        <div className="std">
          <div className="std-h"><span>#</span><span>Team</span><span>W</span><span>D</span><span>L</span><span>Pts</span></div>
          {data.standings.map((team, i) => {
            const isYou = team.name === 'La Tua Squadra'
            const pos = i + 1
            const zone = getZone(pos)
            return (
              <div key={team.name} className={`std-row ${zone} ${isYou ? 'you' : ''}`}>
                <span className="sz" />
                <span className="spos">{pos}</span>
                <span className="stm">
                  <span className="smc" style={isYou ? { background: 'var(--primary)' } : {}} />
                  {isYou ? teamName : team.name}
                </span>
                <span className="sg">{team.w || 0}</span>
                <span className="sg">{team.d || 0}</span>
                <span className="sg">{team.l || 0}</span>
                <span className="spt">{team.pts}</span>
              </div>
            )
          })}
        </div>

        <div className="std-legend">
          <span><i style={{ background: 'var(--champions)' }} />Champions</span>
          <span><i style={{ background: 'var(--europa)' }} />Europa</span>
          <span><i style={{ background: 'var(--conference)' }} />Conference</span>
          <span><i style={{ background: 'var(--loss)' }} />Rel.</span>
        </div>

        <div style={{ height: 100 }} />
      </div>

      <div className="screen-foot">
        <button onClick={handleContinue} className="btn primary">CONTINUE ▶</button>
      </div>
    </div>
  )
}
