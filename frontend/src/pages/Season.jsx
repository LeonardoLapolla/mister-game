import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import useBlockBack from '../hooks/useBlockBack'
import usePageGuard from '../hooks/usePageGuard'

const EVENTS = [
  { id: 'hot_striker', emoji: '🔥', text: 'Your striker is on fire!', type: 'bonus', win: +7, draw: 0, loss: 0 },
  { id: 'keeper_injured', emoji: '🤕', text: 'Serious injury, backup keeper plays', type: 'malus', win: 0, draw: 0, loss: +7 },
  { id: 'great_training', emoji: '💪', text: 'Perfect training week, squad at full strength!', type: 'bonus', win: +5, draw: 0, loss: -3 },
  { id: 'heavy_pitch', emoji: '😤', text: 'Struggling to score', type: 'malus', win: -5, draw: +6, loss: 0 },
  { id: 'opponent_crisis', emoji: '🤩', text: "Great team performance, playing like a dream!", type: 'bonus', win: +6, draw: -3, loss: 0 },
  { id: 'dressing_room', emoji: '😰', text: 'Tension in the dressing room, heavy atmosphere', type: 'malus', win: -6, draw: 0, loss: +5 },
]

const SEG_COLORS_MATCH = { win: '#16C784', draw: '#F5B43C', loss: '#FB5566' }
const SEG_COLORS_BONUS = '#16C784'
const SEG_COLORS_MALUS = '#FB5566'

const LEAGUE_ZONES = {
  PL: { ch: [1,2,3,4,5,6], el: [7,8], co: [9] },
  SA: { ch: [1,2,3,4],     el: [5,6], co: [7] },
  BL: { ch: [1,2,3,4],     el: [5,6], co: [7] },
  LL: { ch: [1,2,3,4],     el: [5,6], co: [7] },
  L1: { ch: [1,2,3],       el: [4,5,6], co: [7] },
}

function getZone(pos, league, total) {
  const z = LEAGUE_ZONES[league] || LEAGUE_ZONES.SA
  if (z.ch.includes(pos)) return 'ch'
  if (z.el.includes(pos)) return 'el'
  if (z.co.includes(pos)) return 'co'
  if (pos > total - 3)    return 'rel'
  return ''
}

function SpinWheelBase({ items, onResult, locked, onLock, size = 280 }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const [spinning, setSpinning] = useState(false)

  useEffect(() => { drawWheel(angleRef.current) }, [items])

  useEffect(() => {
    const handleKey = (e) => { if (e.code === 'Space') { e.preventDefault(); spin() } }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [spinning, locked])

  function drawWheel(angle) {
    const canvas = canvasRef.current
    if (!canvas || items.length === 0) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2
    const R = Math.min(W, H) / 2 - 8

    ctx.clearRect(0, 0, W, H)

    if (items[0]?.prob !== undefined) {
      let startAngle = angle
      for (const item of items) {
        const arc = (item.prob / 100) * 2 * Math.PI
        ctx.beginPath(); ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, startAngle, startAngle + arc)
        ctx.closePath()
        ctx.fillStyle = item.color; ctx.fill()
        ctx.strokeStyle = 'rgba(4,7,10,.6)'; ctx.lineWidth = 1.5; ctx.stroke()

        ctx.save(); ctx.translate(cx, cy); ctx.rotate(startAngle + arc / 2)
        ctx.textAlign = 'right'; ctx.fillStyle = '#04130D'
        ctx.font = "bold 12px 'Saira Condensed', monospace"
        ctx.fillText(`${item.label} ${item.prob}%`, R - 10, 5)
        ctx.restore()
        startAngle += arc
      }
    } else {
      const arc = (2 * Math.PI) / items.length
      items.forEach((item, i) => {
        const start = angle + i * arc
        ctx.beginPath(); ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, R, start, start + arc)
        ctx.closePath()
        ctx.fillStyle = item.color || (i % 2 === 0 ? SEG_COLORS_BONUS : SEG_COLORS_MALUS)
        ctx.fill(); ctx.strokeStyle = 'rgba(4,7,10,.6)'; ctx.lineWidth = 1.5; ctx.stroke()
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + arc / 2)
        ctx.textAlign = 'right'; ctx.fillStyle = '#04130D'
        ctx.font = "bold 13px 'Saira Condensed', monospace"
        ctx.fillText(item.emoji || item.label || '', R - 10, 5)
        ctx.restore()
      })
    }

    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 2 * Math.PI)
    const g = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy, 20)
    g.addColorStop(0, '#5BE3B0'); g.addColorStop(1, '#0FA56C')
    ctx.fillStyle = g; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; ctx.stroke()
  }

  function getResult(angle) {
    if (items[0]?.prob !== undefined) {
      const n = (((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))
      const n360 = (n / (2 * Math.PI)) * 100
      let cum = 0
      for (const item of items) { cum += item.prob; if (n360 <= cum) return item }
      return items[items.length - 1]
    }
    const arc = (2 * Math.PI) / items.length
    const n = (((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))
    return items[Math.floor(n / arc) % items.length]
  }

  function spin() {
    if (spinning || locked || items.length === 0) return
    onLock(); setSpinning(true)
    const total = (8 + Math.random() * 8) * 2 * Math.PI
    const dur = 3000 + Math.random() * 1500
    const t0 = performance.now(), a0 = angleRef.current
    function animate(now) {
      const p = Math.min((now - t0) / dur, 1)
      angleRef.current = a0 + total * (1 - Math.pow(1 - p, 4))
      drawWheel(angleRef.current)
      if (p < 1) requestAnimationFrame(animate)
      else { setSpinning(false); onResult(getResult(angleRef.current)) }
    }
    requestAnimationFrame(animate)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', top: '50%', right: -14, transform: 'translateY(-50%)', zIndex: 10,
          width: 0, height: 0,
          borderTop: '11px solid transparent', borderBottom: '11px solid transparent',
          borderRight: '18px solid #fff',
          filter: 'drop-shadow(0 0 8px rgba(22,199,132,.7))'
        }} />
        <canvas ref={canvasRef} width={size} height={size}
          style={{ borderRadius: '50%', display: 'block', cursor: locked ? 'default' : 'pointer' }}
          onClick={spin}
        />
      </div>
      <button onClick={spin} disabled={spinning || locked || items.length === 0}
        className="btn primary btn-sm"
        style={{ opacity: (spinning || locked || items.length === 0) ? 0.45 : 1, width: 'auto', minWidth: 140 }}>
        {spinning ? 'SPINNING...' : locked ? 'SPUN ✓' : 'SPIN!'}
      </button>
    </div>
  )
}

function StandingsDrawer({ open, onClose, standings, playedCount, teamName, league }) {
  if (!open) return null
  const tot = standings.length
  return (
    <div className="drawer-wrap">
      <div className="drawer-scrim" onClick={onClose} />
      <div className="drawer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px 12px' }}>
          <div>
            <p className="kicker">Live</p>
            <h2 className="h-display" style={{ fontSize: 26 }}>Standings</h2>
          </div>
          <button className="btn dark btn-sm" onClick={onClose}>Close</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div className="std">
            <div className="std-h"><span>#</span><span>Team</span><span>W</span><span>D</span><span>L</span><span>Pts</span></div>
            {standings.map((team, i) => {
              const isYou = team.name === 'La Tua Squadra'
              const pos = i + 1
              const zone = getZone(pos, league, tot)
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
        </div>
      </div>
    </div>
  )
}

export default function Season() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { session, setSession, matches, setMatches } = useGameStore()
  useBlockBack()
  const guardPassed = usePageGuard(sessionId, s => s.finished ? `/results/${sessionId}` : null)

  const [mode, setMode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  const [activeEvent, setActiveEvent] = useState(null)
  const [eventMatchesLeft, setEventMatchesLeft] = useState(0)
  const [showEventWheel, setShowEventWheel] = useState(false)
  const [eventWheelLocked, setEventWheelLocked] = useState(false)
  const [showEventBanner, setShowEventBanner] = useState(false)

  const [nextMatch, setNextMatch] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [locked, setLocked] = useState(false)
  const [playingNext, setPlayingNext] = useState(false)
  const [halfTime, setHalfTime] = useState(false)
  const [halfTimeStandings, setHalfTimeStandings] = useState([])

  const [showStandings, setShowStandings] = useState(false)
  const [liveStandings, setLiveStandings] = useState([])
  const [loadingStandings, setLoadingStandings] = useState(false)

  const eventBatchBase = useRef(0)

  useEffect(() => { fetchSession() }, [sessionId])

  useEffect(() => {
    if (showEventBanner) {
      const t = setTimeout(() => { setShowEventBanner(false); setShowEventWheel(false) }, 3000)
      return () => clearTimeout(t)
    }
  }, [showEventBanner])

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      const data = await res.json()
      setSession(data.session)
      const matchRes = await fetch(`/api/match/${sessionId}`)
      const matchData = await matchRes.json()
      const allMatches = matchData.matches || []
      setMatches(allMatches)
      const unplayed = allMatches.filter(m => !m.played)
      if (unplayed.length > 0) {
        setMode('manual')
        const played = allMatches.filter(m => m.played)
        if (played.length % 4 === 0) {
          const batchKey = `event_batch_${sessionId}_${played.length}`
          if (!sessionStorage.getItem(batchKey)) {
            eventBatchBase.current = played.length
            setShowEventWheel(true)
            setEventWheelLocked(false)
          }
        }
        await fetchNextMatch(true)
      } else if (allMatches.length > 0 && !data.session.finished) {
        // Tutte le partite giocate ma stagione non conclusa: siamo all'half-time in modalità auto
        const calData = data.session.calendarData ? JSON.parse(data.session.calendarData) : null
        if (calData?.secondLeg?.length > 0) {
          const stdRes = await fetch(`/api/match/${sessionId}/standings/${allMatches.length}`)
          const stdData = await stdRes.json()
          setMode('auto')
          setHalfTime(true)
          setHalfTimeStandings(stdData.standings || [])
        }
      }
    } catch (err) {
      setError('Error loading')
    } finally {
      setLoading(false)
    }
  }

  const handleEventResult = (event) => {
    sessionStorage.setItem(`event_batch_${sessionId}_${eventBatchBase.current}`, 'done')
    setShowEventBanner(true)
    setActiveEvent(event)
    setEventMatchesLeft(4)
  }

  const fetchNextMatch = async (skipHalfTime = false) => {
    const res = await fetch(`/api/match/${sessionId}/next-match${skipHalfTime ? '?skipHalfTime=true' : ''}`)
    const data = await res.json()
    if (data.halfTime) { setHalfTime(true); setHalfTimeStandings(data.standings); return data }
    setNextMatch(data); setLastResult(null); setLocked(false)
    return data
  }

  const fetchLiveStandings = async () => {
    setLoadingStandings(true)
    try {
      const matchday = playedMatches.length
      const res = await fetch(`/api/match/${sessionId}/standings/${matchday}`)
      const data = await res.json()
      setLiveStandings(data.standings || []); setShowStandings(true)
    } catch { } finally { setLoadingStandings(false) }
  }

  const startManual = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`/api/match/${sessionId}/generate-calendar`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      eventBatchBase.current = 0
      setMode('manual'); setShowEventWheel(true); setEventWheelLocked(false)
      await fetchNextMatch()
    } catch (err) { setError(err.message) } finally { setGenerating(false) }
  }

  const generateFirstLeg = async () => {
    setGenerating(true); setError(null)
    try {
      const res = await fetch(`/api/match/${sessionId}/generate-first-leg`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await fetchSession(); setHalfTime(true); setHalfTimeStandings(data.standings); setMode('auto')
    } catch (err) { setError(err.message) } finally { setGenerating(false) }
  }

  const handleWheelResult = async (item) => {
    setPlayingNext(true)
    try {
      const res = await fetch(`/api/match/${sessionId}/play-single`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponent: nextMatch.next.opponent,
          homeGame: nextMatch.next.homeGame,
          result: item.result,
          matchday: nextMatch.next.matchday,
        }),
      })
      const data = await res.json()
      setLastResult({ ...data, outcome: item.result })
      const matchRes = await fetch(`/api/match/${sessionId}`)
      const matchData = await matchRes.json()
      const updated = matchData.matches || []
      setMatches(updated)
      const newPlayed = updated.filter(m => m.played).length
      setEventMatchesLeft(prev => {
        const n = prev - 1
        if (n <= 0) { setActiveEvent(null); return 0 }
        return n
      })
      setTimeout(async () => {
        setLastResult(null)
        if (newPlayed % 4 === 0) {
          const batchKey = `event_batch_${sessionId}_${newPlayed}`
          if (!sessionStorage.getItem(batchKey)) {
            eventBatchBase.current = newPlayed
            setShowEventWheel(true)
            setEventWheelLocked(false)
          }
        }
        const next = await fetchNextMatch()
        if (next?.finished) finishSeason()
      }, 2000)
    } catch { setError('Error saving') } finally { setPlayingNext(false) }
  }

  const continueSecondLeg = async () => {
    setHalfTime(false)
    navigate(mode === 'auto' ? `/transfer/${sessionId}?mode=auto` : `/transfer/${sessionId}`)
  }

  const finishSeason = async () => {
    try {
      const res = await fetch(`/api/match/${sessionId}/finish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      navigate(`/results/${sessionId}`)
    } catch (err) { setError(err.message) }
  }

  if (!guardPassed || loading) {
    return <div className="mister-loading"><div>Loading...</div></div>
  }

  const matchList = matches || []
  const playedMatches = matchList.filter(m => m.played)
  const wins = playedMatches.filter(m => m.goalsFor > m.goalsAgainst).length
  const draws = playedMatches.filter(m => m.goalsFor === m.goalsAgainst).length
  const losses = playedMatches.filter(m => m.goalsFor < m.goalsAgainst).length
  const points = wins * 3 + draws
  const goalsFor = playedMatches.reduce((s, m) => s + m.goalsFor, 0)
  const goalsAgainst = playedMatches.reduce((s, m) => s + m.goalsAgainst, 0)
  const teamName = session?.nickname || 'Your Team'

  const baseProbs = nextMatch?.probs || { win: 33, draw: 33, loss: 34 }
  const aw = Math.min(80, Math.max(5, baseProbs.win + (activeEvent?.win || 0)))
  const ad = Math.min(80, Math.max(5, baseProbs.draw + (activeEvent?.draw || 0)))
  const al = Math.min(80, Math.max(5, baseProbs.loss + (activeEvent?.loss || 0)))
  const tot = aw + ad + al
  const winR = Math.round(aw / tot * 100)
  const drawR = Math.round(ad / tot * 100)
  const adjProbs = { win: winR, draw: drawR, loss: 100 - winR - drawR }

  const forza = nextMatch?.opponentStrength
    ? Math.min(5, Math.max(1, Math.ceil((nextMatch.opponentStrength - 70) / 3)))
    : 3

  const StatsBar = () => (
    <div className="stats-bar">
      <div className="sc hl"><div className="sn">{points}</div><div className="sk">Pt</div></div>
      <div className="sc sv"><div className="sn">{wins}</div><div className="sk">W</div></div>
      <div className="sc sp"><div className="sn">{draws}</div><div className="sk">D</div></div>
      <div className="sc ss"><div className="sn">{losses}</div><div className="sk">L</div></div>
      <div className="sc"><div className="sn" style={{ fontSize: 15 }}>{goalsFor}/{goalsAgainst}</div><div className="sk">Goals</div></div>
    </div>
  )

  /* ---- MODE SELECTION ---- */
  if (!mode && matchList.length === 0) {
    return (
      <div className="mister-page">
        <div className="gtop">
          <div className="gteam">
            <div className="gcrest">{(teamName || 'M')[0]}</div>
            <div>
              <b>{teamName}</b>
              <small>{session?.league} · {session?.formation}</small>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 22px', gap: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <p className="kicker">Season</p>
            <h2 className="h-display" style={{ fontSize: 38 }}>How do you want to play?</h2>
            <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 14 }}>Choose how to play your season</p>
          </div>
          <button onClick={startManual} disabled={generating}
            className="opt" style={{ display: 'block', padding: '18px 20px' }}>
            <b>Match by match</b>
            <small>Spin the wheel for each match. Random schedule with home and away legs.</small>
          </button>
          <button onClick={generateFirstLeg} disabled={generating}
            className="opt" style={{ display: 'block', padding: '18px 20px' }}>
            <b>Auto mode</b>
            <small>Simulate with mid-season transfer window.</small>
          </button>
          {error && <div style={{ color: 'var(--loss)', fontSize: 13, textAlign: 'center' }}>{error}</div>}
        </div>
      </div>
    )
  }

  /* ---- HALF TIME ---- */
  if (halfTime) {
    return (
      <div className="mister-page">
        <div className="gtop">
          <div className="gteam">
            <div className="gcrest">{(teamName || 'M')[0]}</div>
            <div><b>{teamName}</b><small>First leg done</small></div>
          </div>
        </div>
        <div className="page-scroll">
          <StatsBar />
          <div style={{ padding: '18px 22px 4px', textAlign: 'center' }}>
            <p className="kicker">Standings after 20 matchdays</p>
            <h2 className="h-display" style={{ fontSize: 32 }}>End of first leg!</h2>
          </div>
          <div className="std" style={{ marginTop: 12 }}>
            <div className="std-h"><span>#</span><span>Team</span><span>W</span><span>D</span><span>L</span><span>Pts</span></div>
            {halfTimeStandings.map((team, i) => {
              const isYou = team.name === 'La Tua Squadra'
              const tot = halfTimeStandings.length
              const pos = i + 1
              const zone = getZone(pos, session?.league, tot)
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
          <div className="std-legend" style={{ padding: '12px 22px' }}>
            <span><i style={{ background: 'var(--champions)' }} />Champions</span>
            <span><i style={{ background: 'var(--europa)' }} />Europa</span>
            <span><i style={{ background: 'var(--conference)' }} />Conference</span>
            <span><i style={{ background: 'var(--loss)' }} />Rel.</span>
          </div>
          <div style={{ height: 100 }} />
        </div>
        <div className="screen-foot">
          <button onClick={continueSecondLeg} className="btn primary">START SECOND LEG ▶</button>
        </div>
      </div>
    )
  }

  /* ---- EVENT WHEEL ---- */
  if (mode === 'manual' && nextMatch && !nextMatch.finished && showEventWheel && !showEventBanner) {
    const eventItems = EVENTS.map((e, i) => ({
      ...e,
      label: `${e.emoji}`,
      color: e.type === 'bonus' ? '#16C784' : '#FB5566',
    }))
    return (
      <div className="mister-page">
        <div className="setup-prompt" style={{ paddingTop: 26 }}>
          <div className="lbl">Matchday event</div>
          <h2>What does fate have in store?</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Lasts for the next 4 matches</p>
        </div>
        <div className="page-scroll" style={{ flex: 1 }}>
          <div className="wheelwrap">
            <SpinWheelBase
              items={eventItems}
              onResult={handleEventResult}
              locked={eventWheelLocked}
              onLock={() => setEventWheelLocked(true)}
              size={280}
            />
          </div>
        </div>
      </div>
    )
  }

  /* ---- MAIN MATCH VIEW ---- */
  if (mode === 'manual' && nextMatch && !nextMatch.finished) {
    const isSecondLeg = nextMatch.next?.matchday > 20
    return (
      <div className="mister-page">
        <StandingsDrawer
          open={showStandings}
          onClose={() => setShowStandings(false)}
          standings={liveStandings}
          playedCount={playedMatches.length}
          teamName={teamName}
          league={session?.league}
        />

        {/* Result overlay */}
        {lastResult && (
          <div className="overlay">
            <div className={`result-banner ${lastResult.outcome}`}>
              <span className="rbk">{lastResult.outcome === 'win' ? 'W' : lastResult.outcome === 'draw' ? 'D' : 'L'}</span>
              <div className="rres">
                {lastResult.outcome === 'win' ? 'Win' : lastResult.outcome === 'draw' ? 'Draw' : 'Defeat'}
              </div>
              <div className="rvs">{teamName} vs {lastResult.opponent}</div>
              <div className="rscore">{lastResult.goalsFor} – {lastResult.goalsAgainst}</div>
            </div>
          </div>
        )}

        {/* Event banner overlay */}
        {showEventBanner && activeEvent && (
          <div className="overlay">
            <div className={`result-banner ${activeEvent.type === 'bonus' ? 'win' : 'loss'}`}>
              <div className="rres" style={{ fontSize: 60, lineHeight: 1 }}>{activeEvent.emoji}</div>
              <div className="rvs" style={{ fontSize: 16, marginTop: 8 }}>
                {activeEvent.type === 'bonus' ? 'BONUS' : 'MALUS'}
              </div>
              <div className="rscore" style={{ fontSize: 18, marginTop: 8, fontFamily: 'var(--font-ui)' }}>
                {activeEvent.text}
              </div>
            </div>
          </div>
        )}

        <div className="gtop">
          <div className="gteam">
            <div className="gcrest">{(teamName || 'M')[0]}</div>
            <div>
              <b>{teamName}</b>
              <small>{isSecondLeg ? 'Second Leg' : 'First Leg'} · MD{nextMatch.next?.matchday}</small>
            </div>
          </div>
          <button className="gpill" onClick={fetchLiveStandings} disabled={loadingStandings || playedMatches.length === 0}>
            <b>📊</b>
            <span>{loadingStandings ? '...' : 'Standings'}</span>
          </button>
        </div>

        <div className="page-scroll" style={{ flex: 1 }}>
          <StatsBar />

          {/* Match card */}
          <div className="match-card">
            <div className="mh">
              <div className="mopp">
                <div className="mcrest">{(nextMatch.next?.opponent || 'O')[0]}</div>
                <div>
                  <b>{nextMatch.next?.opponent}</b>
                  <small>Matchday {nextMatch.next?.matchday}/{nextMatch.totalMatches}</small>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeEvent && !showEventBanner && (
                  <span
                    title={`${activeEvent.type === 'bonus' ? 'BONUS' : 'MALUS'}: ${activeEvent.text} (${eventMatchesLeft} left)`}
                    style={{
                      fontSize: 20, lineHeight: 1,
                      filter: activeEvent.type === 'malus' ? 'drop-shadow(0 0 4px #FB5566)' : 'drop-shadow(0 0 4px #16C784)',
                      cursor: 'default',
                    }}
                  >
                    {activeEvent.emoji}
                  </span>
                )}
                <span className="ha-badge">{nextMatch.next?.homeGame ? 'Home' : 'Away'}</span>
              </div>
            </div>

            <div className="forza">
              <span className="flbl">Opponent</span>
              <div className="bars">
                {[1, 2, 3, 4, 5].map(n => <i key={n} className={n <= forza ? 'f' : ''} />)}
              </div>
              <span style={{ fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--muted)' }}>{nextMatch.opponentStrength}</span>
            </div>

            <div className="prob">
              <span className="pv" style={{ width: `${adjProbs.win}%` }}>{adjProbs.win}%</span>
              <span className="pp" style={{ width: `${adjProbs.draw}%` }}>{adjProbs.draw}%</span>
              <span className="ps" style={{ width: `${adjProbs.loss}%` }}>{adjProbs.loss}%</span>
            </div>
            <div className="prob-key">
              <span><i style={{ background: 'var(--win)' }} />Win</span>
              <span><i style={{ background: 'var(--draw)' }} />Draw</span>
              <span><i style={{ background: 'var(--loss)' }} />Defeat</span>
            </div>
          </div>

          {/* Wheel */}
          {nextMatch.probs && (
            <div className="wheelwrap" style={{ marginTop: 18 }}>
              <SpinWheelBase
                items={[
                  { label: 'WIN', result: 'win', color: SEG_COLORS_MATCH.win, prob: adjProbs.win },
                  { label: 'DRAW', result: 'draw', color: SEG_COLORS_MATCH.draw, prob: adjProbs.draw },
                  { label: 'LOSS', result: 'loss', color: SEG_COLORS_MATCH.loss, prob: adjProbs.loss },
                ]}
                onResult={handleWheelResult}
                locked={locked}
                onLock={() => setLocked(true)}
                size={280}
              />
            </div>
          )}

          {error && (
            <div style={{ margin: '12px 22px 0', padding: '10px 14px', background: 'color-mix(in oklab,var(--loss) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--loss) 40%,transparent)', borderRadius: 'var(--r-sm)', color: 'var(--loss)', fontSize: 13 }}>
              {error}
            </div>
          )}
          <div style={{ height: 80 }} />
        </div>
      </div>
    )
  }

  /* ---- SEASON HISTORY / FINISH ---- */
  return (
    <div className="mister-page">
      <div className="gtop">
        <div className="gteam">
          <div className="gcrest">{(teamName || 'M')[0]}</div>
          <div><b>{teamName}</b><small>{session?.league} · {session?.formation}</small></div>
        </div>
      </div>
      <div className="page-scroll" style={{ flex: 1 }}>
        <StatsBar />
        <div className="section-title">Results</div>
        <div style={{ padding: '0 22px' }}>
          {matchList.filter(m => m.played).sort((a, b) => a.matchday - b.matchday).map(m => {
            const win = m.goalsFor > m.goalsAgainst
            const draw = m.goalsFor === m.goalsAgainst
            return (
              <div key={m.id} className="rrow">
                <span className="rnum">{m.matchday}</span>
                <span className="rnm">{m.opponent}</span>
                <span style={{ fontFamily: 'var(--font-num)', fontSize: 11, color: win ? 'var(--win)' : draw ? 'var(--draw)' : 'var(--loss)' }}>
                  {win ? 'W' : draw ? 'D' : 'L'}
                </span>
                <span className="rovr">{m.goalsFor}–{m.goalsAgainst}</span>
              </div>
            )
          })}
        </div>
        {error && (
          <div style={{ margin: '12px 22px 0', padding: '10px 14px', background: 'color-mix(in oklab,var(--loss) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--loss) 40%,transparent)', borderRadius: 'var(--r-sm)', color: 'var(--loss)', fontSize: 13 }}>
            {error}
          </div>
        )}
        <div style={{ height: 100 }} />
      </div>
      <div className="screen-foot">
        <button onClick={finishSeason} className="btn primary">SEE FINAL RESULT ▶</button>
      </div>
    </div>
  )
}
