import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import useBlockBack from '../hooks/useBlockBack'

const COMP_THEME = {
  champions: 'theme-champions',
  europa: 'theme-europa',
  conference: 'theme-conference',
}

const COMP_INFO = {
  champions: { name: 'Champions League', label: 'UEFA Champions League' },
  europa: { name: 'Europa League', label: 'UEFA Europa League' },
  conference: { name: 'Conference League', label: 'UEFA Conference League' },
}

const ROUND_LABELS = {
  R16: 'Round of 16',
  QF: 'Quarter-Finals',
  SF: 'Semi-Finals',
  Final: 'Final',
}

const SEG_COLORS_MATCH = { win: '#16C784', draw: '#F5B43C', loss: '#FB5566' }

function MatchWheel({ probs, onResult, locked, onLock }) {
  const canvasRef = useRef(null)
  const angleRef = useRef(0)
  const rafRef = useRef(null)
  const [spinning, setSpinning] = useState(false)

  const items = [
    { label: 'WIN', result: 'win', color: SEG_COLORS_MATCH.win, prob: probs.win },
    { label: 'DRAW', result: 'draw', color: SEG_COLORS_MATCH.draw, prob: probs.draw },
    { label: 'LOSS', result: 'loss', color: SEG_COLORS_MATCH.loss, prob: probs.loss },
  ]

  useEffect(() => { drawWheel(angleRef.current) }, [probs])

  useEffect(() => {
    const h = (e) => { if (e.code === 'Space') { e.preventDefault(); spin() } }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [spinning, locked])

  function drawWheel(angle) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 8
    ctx.clearRect(0, 0, W, H)
    let sa = angle
    for (const item of items) {
      const arc = (item.prob / 100) * 2 * Math.PI
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, sa, sa + arc); ctx.closePath()
      ctx.fillStyle = item.color; ctx.fill()
      ctx.strokeStyle = 'rgba(4,7,10,.6)'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(sa + arc / 2)
      ctx.textAlign = 'right'; ctx.fillStyle = '#04130D'
      ctx.font = "bold 12px 'Saira Condensed', monospace"
      ctx.fillText(`${item.label} ${item.prob}%`, R - 10, 5)
      ctx.restore()
      sa += arc
    }
    ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 2 * Math.PI)
    const g = ctx.createRadialGradient(cx, cy - 4, 0, cx, cy, 20)
    g.addColorStop(0, '#5BE3B0'); g.addColorStop(1, '#0FA56C')
    ctx.fillStyle = g; ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.5; ctx.stroke()
  }

  function getResult(angle) {
    const n = (((-angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI))
    const n360 = (n / (2 * Math.PI)) * 100
    let cum = 0
    for (const item of items) { cum += item.prob; if (n360 <= cum) return item }
    return items[items.length - 1]
  }

  function spin() {
    if (spinning || locked) return
    onLock(); setSpinning(true)
    const total = (8 + Math.random() * 8) * 2 * Math.PI
    const dur = 3000 + Math.random() * 1500
    const t0 = performance.now(), a0 = angleRef.current
    function animate(now) {
      const p = Math.min((now - t0) / dur, 1)
      angleRef.current = a0 + total * (1 - Math.pow(1 - p, 4))
      drawWheel(angleRef.current)
      if (p < 1) { rafRef.current = requestAnimationFrame(animate) }
      else { setSpinning(false); onResult(getResult(angleRef.current)) }
    }
    rafRef.current = requestAnimationFrame(animate)
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
        <canvas ref={canvasRef} width={280} height={280}
          style={{ borderRadius: '50%', display: 'block', cursor: locked ? 'default' : 'pointer' }}
          onClick={spin}
        />
      </div>
      <button onClick={spin} disabled={spinning || locked}
        className="btn primary btn-sm"
        style={{ opacity: (spinning || locked) ? 0.45 : 1, width: 'auto', minWidth: 140 }}>
        {spinning ? 'SPINNING...' : locked ? 'PLAYED ✓' : 'SPIN!'}
      </button>
    </div>
  )
}

export default function EuropaKnockout() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const { session, setSession } = useGameStore()
  useBlockBack()

  const [loading, setLoading] = useState(true)
  const [europaState, setEuropaState] = useState(null)
  const [nextMatch, setNextMatch] = useState(null)
  const [probs, setProbs] = useState(null)
  const [lastResult, setLastResult] = useState(null)
  const [locked, setLocked] = useState(false)
  const [error, setError] = useState(null)
  const [phase, setPhase] = useState('playing')

  useEffect(() => { init() }, [sessionId])

  const init = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      const data = await res.json()
      setSession(data.session)

      if (!data.session?.finished) { navigate(`/end-season/${sessionId}`, { replace: true }); return }
      if (!data.session?.europaData) { navigate(`/end-season/${sessionId}`, { replace: true }); return }
      try {
        const ed = JSON.parse(data.session.europaData)
        if (ed.phase !== 'knockout') { navigate(`/end-season/${sessionId}`, { replace: true }); return }
      } catch { navigate(`/end-season/${sessionId}`, { replace: true }); return }

      await refreshState()
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const refreshState = async () => {
    const stateRes = await fetch(`/api/europa/${sessionId}/state`)
    const stateData = await stateRes.json()
    setEuropaState(stateData)
    if (stateData.phase === 'eliminated') { setPhase('eliminated'); return }
    if (stateData.phase === 'winner') { setPhase('winner'); return }
    await fetchNextMatch()
  }

  const fetchNextMatch = async () => {
    const res = await fetch(`/api/europa/${sessionId}/next-knockout-match`)
    const data = await res.json()
    if (data.finished) { setPhase('winner'); return }
    setNextMatch(data.match); setProbs(data.probs); setLocked(false); setPhase('playing')
  }

  const handleWheelResult = async (item) => {
    try {
      const res = await fetch(`/api/europa/${sessionId}/play-knockout-match`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: item.result }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const opponentName = nextMatch?.opponentName ||
        (nextMatch?.home === 'La Tua Squadra' ? nextMatch?.away : nextMatch?.home) || nextMatch?.away
      setLastResult({ outcome: data.result, goalsFor: data.goalsFor, goalsAgainst: data.goalsAgainst, opponent: opponentName, eliminated: data.eliminated, nextRound: data.nextRound })
      setTimeout(async () => {
        setLastResult(null)
        if (data.eliminated) { setPhase('eliminated'); await refreshState() }
        else if (!data.nextRound) { setPhase('winner'); await refreshState() }
        else { await refreshState() }
      }, 2500)
    } catch (err) { setError(err.message) }
  }

  const handleContinue = async () => {
    const r = await fetch(`/api/game/${sessionId}`)
    const d = await r.json()
    const pos = d.session.position || 0
    const sr = await fetch(`/api/europa/${sessionId}/score`)
    const sd = await sr.json()
    navigate(`/end-season/${sessionId}?fromEuropa=true&position=${pos}&score=${sd.score || 0}`)
  }

  if (loading) {
    return <div className="mister-loading"><div>Loading...</div></div>
  }

  const competition = europaState?.competition
  const themeClass = COMP_THEME[competition] || 'theme-conference'
  const info = COMP_INFO[competition] || COMP_INFO.conference
  const teamName = session?.nickname || 'La Tua Squadra'
  const currentRound = europaState?.knockoutRound
  const roundLabel = ROUND_LABELS[currentRound] || currentRound
  const currentRoundMatches = europaState?.knockoutMatches?.filter(m => m.round === currentRound) || []
  const forza = nextMatch?.opponentRating
    ? Math.min(5, Math.max(1, Math.ceil((nextMatch.opponentRating - 62) / 4)))
    : 3

  return (
    <div className={`mister-page ${themeClass}`}>
      {/* Result overlay */}
      {lastResult && (
        <div className="overlay">
          <div className={`result-banner ${lastResult.outcome}`}>
            <span className="rbk">{lastResult.outcome === 'win' ? 'W' : lastResult.outcome === 'draw' ? 'D' : 'L'}</span>
            <div className="rres">
              {lastResult.outcome === 'win' ? 'Win' : lastResult.outcome === 'draw' ? 'On Penalties' : 'Defeat'}
            </div>
            <div className="rvs">{teamName} vs {lastResult.opponent}</div>
            <div className="rscore">{lastResult.goalsFor} – {lastResult.goalsAgainst}</div>
            {!lastResult.eliminated && lastResult.nextRound && (
              <div style={{ color: 'var(--ink-dim)', fontSize: 13, marginTop: 10 }}>
                Advance to {ROUND_LABELS[lastResult.nextRound]}!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top bar */}
      <div style={{ padding: '18px 22px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="comp-pill">{info.label}</span>
        {phase === 'playing' && roundLabel && (
          <span style={{ fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--muted)' }}>{roundLabel}</span>
        )}
      </div>

      <div className="page-scroll" style={{ flex: 1 }}>
        {/* Match card */}
        {phase === 'playing' && nextMatch && !lastResult && probs && (
          <>
            <div className="match-card">
              <div className="mh">
                <div className="mopp">
                  <div className="mcrest">
                    {(nextMatch.opponentName || nextMatch.away || 'O')[0]}
                  </div>
                  <div>
                    <b>{nextMatch.opponentName || (nextMatch.home === 'La Tua Squadra' ? nextMatch.away : nextMatch.home)}</b>
                    <small>{roundLabel} · Knockout</small>
                  </div>
                </div>
              </div>

              <div className="forza">
                <span className="flbl">Strength</span>
                <div className="bars">
                  {[1,2,3,4,5].map(n => <i key={n} className={n <= forza ? 'f' : ''} />)}
                </div>
              </div>

              <div className="prob">
                <span className="pv" style={{ width: `${probs.win}%` }}>{probs.win}%</span>
                <span className="pp" style={{ width: `${probs.draw}%` }}>{probs.draw}%</span>
                <span className="ps" style={{ width: `${probs.loss}%` }}>{probs.loss}%</span>
              </div>
              <div className="prob-key">
                <span><i style={{ background: 'var(--win)' }} />Win</span>
                <span><i style={{ background: 'var(--draw)' }} />Penalties</span>
                <span><i style={{ background: 'var(--loss)' }} />Defeat</span>
              </div>
            </div>

            <div className="wheelwrap" style={{ marginTop: 18 }}>
              <MatchWheel probs={probs} onResult={handleWheelResult} locked={locked} onLock={() => setLocked(true)} />
            </div>
          </>
        )}

        {/* Bracket */}
        {currentRoundMatches.length > 0 && phase === 'playing' && (
          <>
            <div className="section-title">Bracket — {roundLabel}</div>
            <div style={{ padding: '0 22px' }}>
              {currentRoundMatches.map((match, i) => {
                const isYou = match.isPlayerMatch
                const home = match.home === 'La Tua Squadra' ? teamName : match.home
                const away = match.away === 'La Tua Squadra' ? teamName : match.away
                return (
                  <div key={i} className={`rrow ${isYou ? 'you' : ''}`} style={isYou ? { background: 'color-mix(in oklab,var(--primary) 10%,transparent)', padding: '10px 10px', borderRadius: 'var(--r-sm)', border: '1px solid color-mix(in oklab,var(--primary) 30%,transparent)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 } : {}}>
                    <span className="rnm" style={{ flex: 1 }}>{home}</span>
                    <span style={{ fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--muted)' }}>vs</span>
                    <span className="rnm" style={{ flex: 1, textAlign: 'right' }}>{away}</span>
                    {match.played ? (
                      <span className="rovr">{match.goalsFor ?? '?'}–{match.goalsAgainst ?? '?'}</span>
                    ) : (
                      <span style={{ fontFamily: 'var(--font-num)', fontSize: 10, color: 'var(--muted)' }}>vs</span>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Eliminated */}
        {phase === 'eliminated' && !lastResult && (
          <div style={{ margin: '16px 22px 0', background: 'color-mix(in oklab,var(--loss) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--loss) 40%,transparent)', borderRadius: 'var(--r-lg)', padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💀</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, textTransform: 'uppercase', color: 'var(--loss)' }}>Eliminated!</div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
              You were eliminated {ROUND_LABELS[europaState?.finalRound] ? `at the ${ROUND_LABELS[europaState.finalRound]}` : 'from the competition'}
            </div>
            <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 18, color: 'var(--primary)', marginTop: 12 }}>
              +{europaState?.europaScore || 0} bonus points
            </div>
          </div>
        )}

        {/* Winner */}
        {phase === 'winner' && !lastResult && (
          <div style={{ margin: '16px 22px 0', background: 'color-mix(in oklab,var(--draw) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--draw) 40%,transparent)', borderRadius: 'var(--r-lg)', padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, textTransform: 'uppercase', color: 'var(--draw)' }}>YOU WON!</div>
            <div style={{ color: 'var(--ink-dim)', fontSize: 16, marginTop: 4 }}>{info.name}</div>
            <div style={{ fontFamily: 'var(--font-num)', fontWeight: 700, fontSize: 18, color: 'var(--primary)', marginTop: 12 }}>
              +{europaState?.europaScore || 0} bonus points
            </div>
          </div>
        )}

        {error && (
          <div style={{ margin: '12px 22px 0', padding: '10px 14px', background: 'color-mix(in oklab,var(--loss) 14%,var(--surface))', border: '1px solid color-mix(in oklab,var(--loss) 40%,transparent)', borderRadius: 'var(--r-sm)', color: 'var(--loss)', fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      {(phase === 'eliminated' || phase === 'winner') && !lastResult && (
        <div className="screen-foot">
          <button onClick={handleContinue} className="btn primary">CONTINUE ▶</button>
        </div>
      )}
    </div>
  )
}
