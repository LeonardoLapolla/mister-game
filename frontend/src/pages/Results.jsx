import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import { IconTrophy, IconMedal, IconStar, IconChart } from '../components/Icons'

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div className="text-xl animate-pulse" style={{ color: 'var(--c-muted)' }}>Calcolo risultati...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--c-bg)' }}>
        <div className="text-xl" style={{ color: 'var(--c-red)' }}>{error}</div>
      </div>
    )
  }

  const totalTeams = data.standings.length
  const teamName = session?.nickname || 'La Tua Squadra'

  const getPositionStyle = (pos) => {
    if (pos === 1) return { rowBg: 'rgba(255,171,0,0.08)', borderColor: 'var(--c-amber)', textColor: 'var(--c-amber)' }
    if (pos <= 4) return { rowBg: 'rgba(68,138,255,0.08)', borderColor: 'var(--c-blue)', textColor: 'var(--c-blue)' }
    if (pos <= 6) return { rowBg: 'rgba(0,230,118,0.08)', borderColor: 'var(--c-green)', textColor: 'var(--c-green)' }
    if (pos >= totalTeams - 2) return { rowBg: 'rgba(255,61,87,0.08)', borderColor: 'var(--c-red)', textColor: 'var(--c-red)' }
    return { rowBg: 'var(--c-surface)', borderColor: 'transparent', textColor: 'var(--c-faint)' }
  }

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--c-bg)' }}>
      <div className="max-w-3xl mx-auto">

        {/* Hero risultato */}
        <div className="text-center mb-10 md:mb-12 animate-flash-result">
          <div className="flex justify-center mb-4" style={{
            color: data.position === 1 ? 'var(--c-amber)' : data.position <= 3 ? 'var(--c-muted)' : data.position <= 6 ? 'var(--c-green)' : 'var(--c-faint)',
            filter: data.position === 1 ? 'drop-shadow(0 0 20px rgba(255,171,0,0.5))' : 'none',
          }}>
            {data.position === 1 ? <IconTrophy size={72} /> :
             data.position <= 3 ? <IconMedal size={72} /> :
             data.position <= 6 ? <IconStar size={72} /> :
             <IconChart size={72} />}
          </div>
          <h1 className="section-title mb-1" style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}>{data.label}</h1>
          <p className="text-base md:text-lg mb-1" style={{ color: 'var(--c-muted)' }}>{teamName}</p>
          <p className="text-sm mb-6 md:mb-8" style={{ color: 'var(--c-faint)' }}>{data.position}° posto in classifica</p>
          <div className="inline-block rounded-2xl px-6 md:px-8 py-4 md:py-5"
            style={{ background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.25)' }}>
            <div className="stat-number animate-count-up" style={{ color: 'var(--c-green)', fontSize: 'clamp(2.5rem,8vw,3.5rem)' }}>{data.finalScore}</div>
            <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--c-muted)' }}>punti totali</div>
          </div>
        </div>

        {/* Classifica finale */}
        <div className="mb-10">
          <h2 className="section-title text-2xl md:text-3xl mb-4 tracking-widest">Classifica Finale</h2>
          <div className="overflow-x-auto">
            <div className="space-y-1 min-w-[320px]">
              {data.standings.map((team, i) => {
                const isYou = team.name === 'La Tua Squadra'
                const pos = i + 1
                const style = getPositionStyle(pos)

                return (
                  <div
                    key={team.name}
                    className={`flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 rounded-xl table-row-hover animate-slide-up delay-${Math.min(i * 30, 450)}ms`}
                    style={{
                      background: isYou ? 'rgba(0,230,118,0.1)' : style.rowBg,
                      borderLeft: `3px solid ${isYou ? 'var(--c-green)' : style.borderColor}`,
                      outline: isYou ? '1px solid rgba(0,230,118,0.2)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <span className="text-sm font-black w-5 md:w-6 flex-shrink-0" style={{ fontFamily: 'DM Mono, monospace', color: isYou ? 'var(--c-green)' : style.textColor }}>{pos}</span>
                      <span className="font-semibold text-sm truncate" style={{ color: isYou ? 'var(--c-green)' : 'var(--c-text)' }}>
                        {isYou ? <span className="flex items-center gap-1"><IconStar size={12} /> {teamName}</span> : team.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 text-xs flex-shrink-0" style={{ fontFamily: 'DM Mono, monospace' }}>
                      <span className="hidden sm:inline" style={{ color: 'var(--c-muted)' }}>{team.w}V {team.d}P {team.l}S</span>
                      <span className="hidden md:inline" style={{ color: 'var(--c-muted)' }}>{team.gf}:{team.ga}</span>
                      <span className="font-bold" style={{ color: isYou ? 'var(--c-green)' : style.textColor === 'var(--c-faint)' ? 'var(--c-text)' : style.textColor }}>
                        {team.pts} pt
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legenda */}
          <div className="mt-5 flex flex-wrap gap-4 text-xs" style={{ color: 'var(--c-muted)' }}>
            {[
              { color: 'var(--c-amber)', label: 'Campione' },
              { color: 'var(--c-blue)', label: 'Champions League' },
              { color: 'var(--c-green)', label: 'Europa League' },
              { color: 'var(--c-red)', label: 'Retrocessione' },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate(`/end-season/${sessionId}?position=${data.position}&points=${data.finalScore}&wins=${data.standings.find(s => s.name === 'La Tua Squadra')?.w || 0}&draws=${data.standings.find(s => s.name === 'La Tua Squadra')?.d || 0}&losses=${data.standings.find(s => s.name === 'La Tua Squadra')?.l || 0}&gf=${data.standings.find(s => s.name === 'La Tua Squadra')?.gf || 0}&ga=${data.standings.find(s => s.name === 'La Tua Squadra')?.ga || 0}`)}
          className="btn-primary w-full py-4 text-xl" style={{ fontWeight: 800 }}
        >
          CONTINUA →
        </button>
      </div>
    </div>
  )
}
