import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import useBlockBack from '../hooks/useBlockBack'

const COMP_THEME = {
  champions: 'theme-champions',
  europa: 'theme-europa',
  conference: 'theme-conference',
}

const COMP_INFO = {
  champions: { name: 'Champions League', label: 'UEFA Champions League', badge: 'ch' },
  europa: { name: 'Europa League', label: 'UEFA Europa League', badge: 'el' },
  conference: { name: 'Conference League', label: 'UEFA Conference League', badge: 'co' },
}

export default function EuropaGroup() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()
  useBlockBack()

  const [loading, setLoading] = useState(true)
  const [europaState, setEuropaState] = useState(null)
  const [error, setError] = useState(null)
  const [phase, setPhase] = useState('results')

  useEffect(() => { init() }, [sessionId])

  const init = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      const data = await res.json()
      setSession(data.session)

      if (!data.session?.finished) { navigate(`/end-season/${sessionId}`, { replace: true }); return }
      if (data.session?.europaData) {
        try {
          const ed = JSON.parse(data.session.europaData)
          if (ed.phase === 'eliminated' || ed.phase === 'winner') { navigate(`/end-season/${sessionId}`, { replace: true }); return }
          if (ed.phase === 'knockout') { navigate(`/europa-knockout/${sessionId}`, { replace: true }); return }
        } catch {}
      }

      const groupRes = await fetch(`/api/europa/${sessionId}/generate-group`, { method: 'POST' })
      const groupData = await groupRes.json()
      if (!groupRes.ok) throw new Error(groupData.error)

      const finishRes = await fetch(`/api/europa/${sessionId}/finish-group`, { method: 'POST' })
      const finishData = await finishRes.json()
      if (!finishRes.ok) throw new Error(finishData.error)

      const stateRes = await fetch(`/api/europa/${sessionId}/state`)
      const stateData = await stateRes.json()
      setEuropaState(stateData)
      setPhase(finishData.qualified ? 'qualified' : 'eliminated')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="mister-loading"><div>Simulating group stage...</div></div>
  }

  if (error) {
    return <div className="mister-loading" style={{ color: 'var(--loss)' }}><div>{error}</div></div>
  }

  const competition = europaState?.competition
  const themeClass = COMP_THEME[competition] || 'theme-conference'
  const info = COMP_INFO[competition] || COMP_INFO.conference
  const teamName = session?.nickname || 'La Tua Squadra'
  const standings = europaState?.standings || []
  const playerStats = europaState?.playerStats || {}
  const groupPosition = europaState?.groupPosition

  return (
    <div className={`mister-page ${themeClass}`}>
      {/* Top bar */}
      <div style={{ padding: '18px 22px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="comp-pill">{info.label}</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--muted)' }}>Group Stage</span>
      </div>

      <div className="page-scroll" style={{ flex: 1 }}>
        {/* Competition hero */}
        <div className="comp-hero">
          <span className="comp-badge">{info.label}</span>
          <div className="h-display" style={{ fontSize: 36, marginTop: 8 }}>{info.name}</div>
          <div style={{ fontFamily: 'var(--font-num)', fontSize: 12, color: 'var(--ink-dim)', marginTop: 8 }}>{teamName} · Group Stage</div>
        </div>

        {/* Stats bar */}
        <div className="stats-bar">
          <div className="sc hl"><div className="sn">{playerStats.pts || 0}</div><div className="sk">Pts</div></div>
          <div className="sc sv"><div className="sn">{playerStats.w || 0}</div><div className="sk">W</div></div>
          <div className="sc sp"><div className="sn">{playerStats.d || 0}</div><div className="sk">D</div></div>
          <div className="sc ss"><div className="sn">{playerStats.l || 0}</div><div className="sk">L</div></div>
          <div className="sc"><div className="sn" style={{ fontSize: 14 }}>{playerStats.gf || 0}/{playerStats.ga || 0}</div><div className="sk">Goals</div></div>
        </div>

        {/* Your matches */}
        {europaState?.playerMatches?.length > 0 && (
          <>
            <div className="section-title">Your matches</div>
            <div style={{ padding: '0 22px' }}>
              {europaState.playerMatches.map((m, i) => {
                const win = m.result === 'win', draw = m.result === 'draw'
                return (
                  <div key={i} className="rrow">
                    <span style={{ fontFamily: 'var(--font-num)', fontSize: 11, color: win ? 'var(--win)' : draw ? 'var(--draw)' : 'var(--loss)', width: 16 }}>
                      {win ? 'W' : draw ? 'D' : 'L'}
                    </span>
                    <span className="rnm">{m.opponent}</span>
                    <span className="rovr">{m.goalsFor}–{m.goalsAgainst}</span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Group standings */}
        {standings.length > 0 && (
          <>
            <div className="section-title">Group standings</div>
            <div className="std">
              <div className="std-h"><span>#</span><span>Team</span><span>W</span><span>D</span><span>L</span><span>Pts</span></div>
              {standings.map((team, i) => {
                const isYou = team.isPlayer
                const qualified = i < 16
                return (
                  <div key={team.name} className={`std-row ${qualified ? 'ch' : ''} ${isYou ? 'you' : ''}`}>
                    <span className="sz" />
                    <span className="spos">{i + 1}</span>
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
              <span><i style={{ background: 'var(--primary)' }} />Top 16 qualify</span>
            </div>
          </>
        )}

        {/* Phase result */}
        {phase === 'eliminated' && (
          <div style={{ margin: '16px 22px 0', background: 'color-mix(in oklab,var(--loss) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--loss) 40%,transparent)', borderRadius: 'var(--r-lg)', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>💀</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, textTransform: 'uppercase', color: 'var(--loss)' }}>Eliminated in group stage!</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Final position: {groupPosition}</div>
          </div>
        )}

        {phase === 'qualified' && (
          <div style={{ margin: '16px 22px 0', background: 'color-mix(in oklab,var(--primary) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--primary) 40%,transparent)', borderRadius: 'var(--r-lg)', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, textTransform: 'uppercase', color: 'var(--primary-300)' }}>Qualified for Round of 16!</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>Group position: {groupPosition}</div>
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      <div className="screen-foot">
        {phase === 'eliminated' ? (
          <button
            className="btn primary"
            onClick={async () => {
              const r = await fetch(`/api/game/${sessionId}`)
              const d = await r.json()
              const pos = d.session.position || 0
              const sr = await fetch(`/api/europa/${sessionId}/score`)
              const sd = await sr.json()
              navigate(`/end-season/${sessionId}?fromEuropa=true&position=${pos}&score=${sd.score || 0}`)
            }}
          >
            CONTINUE ▶
          </button>
        ) : (
          <button className="btn primary" onClick={() => navigate(`/europa-knockout/${sessionId}`)}>
            KNOCKOUT STAGE ▶
          </button>
        )}
      </div>
    </div>
  )
}
