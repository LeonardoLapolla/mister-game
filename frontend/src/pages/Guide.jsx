import { useNavigate } from 'react-router-dom'

const ATTITUDE = [
  { label: 'Offensive', formations: '4-3-3, 3-5-2', desc: 'Higher win chance, lower draw chance', color: 'var(--loss)' },
  { label: 'Balanced',  formations: '4-4-2, 4-2-3-1', desc: 'No adjustment', color: 'var(--mkt-amber)' },
  { label: 'Defensive', formations: '5-3-2', desc: 'Lower win chance, higher draw chance', color: 'var(--win)' },
]

const BUDGETS = [
  { val: '30M', label: 'Highest multiplier', note: 'Hard mode' },
  { val: '50M', label: 'High multiplier',    note: '' },
  { val: '80M', label: 'Low multiplier',     note: '' },
  { val: '100M', label: 'Lowest multiplier', note: 'Easy mode' },
]

const SCORE_FACTORS = [
  'Higher final position in the league',
  'Lower starting budget',
  'Tougher league (Premier League has the highest multiplier)',
  'Weaker squad overperforming',
  'European runs — every round you advance adds bonus points',
]

const TIPS = [
  'In match-by-match mode, rotate tired players between matches to keep your average energy up.',
  'Reaching a European final is a huge point swing — qualifying is worth chasing.',
]

function Block({ children, color }) {
  return (
    <div style={{
      background: color
        ? `color-mix(in oklab,${color} 10%,var(--surface-2))`
        : 'var(--surface-2)',
      border: `1px solid ${color ? `color-mix(in oklab,${color} 28%,transparent)` : 'var(--line)'}`,
      borderRadius: 'var(--r-md)',
      padding: '14px 16px',
    }}>
      {children}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
      <span style={{ fontFamily: 'var(--font-num)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--primary)', minWidth: 72, paddingTop: 1, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>{children}</span>
    </div>
  )
}

function Pill({ children, color }) {
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: 'var(--font-num)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase',
      padding: '2px 8px', borderRadius: 4,
      border: `1px solid ${color}`,
      background: `color-mix(in oklab,${color} 14%,transparent)`,
      color,
    }}>{children}</span>
  )
}

export default function Guide() {
  const navigate = useNavigate()

  return (
    <div className="mister-page">
      <div className="gtop">
        <button onClick={() => navigate('/')} className="btn ghost" style={{ padding: '6px 12px', fontSize: 13 }}>← Back</button>
        <div style={{ fontFamily: 'var(--font-num)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>HOW TO PLAY</div>
        <div style={{ width: 60 }} />
      </div>

      <div className="page-scroll" style={{ padding: '0 22px' }}>

        {/* Intro */}
        <div style={{ padding: '20px 0 6px' }}>
          <p className="kicker" style={{ marginBottom: 8 }}>Mister Roulette</p>
          <p style={{ fontSize: 14, color: 'var(--ink-dim)', lineHeight: 1.6, margin: 0 }}>
            A football management game where almost every decision is made by spinning a wheel.
            Build a team, play through 3 seasons, manage transfers, and score as many points as possible.
            Quick, luck-driven, and designed to be played solo or by passing the phone around with friends.
          </p>
        </div>

        {/* Getting Started */}
        <div className="section-title" style={{ paddingLeft: 0 }}>Getting started</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Block>
            <Row label="League">One of five: Premier League, Serie A, Bundesliga, La Liga, or Ligue 1. The league affects which opponents you face and a final score multiplier.</Row>
            <Row label="Budget">
              <span>You get one of four budgets. Lower budget = higher score multiplier. Picking 30M is the hardest challenge but rewards the most.</span>
            </Row>
            <Row label="Formation">Spin or pick a formation. It stays fixed for the whole season and sets your team's attitude (see below).</Row>
            <Row label="Name">Name your club.</Row>
            <Row label="Players">For each position you spin a wheel of real players filtered by your budget. Higher budgets unlock higher-rated players.</Row>
            <Row label="Bench" children={<span>After your starting XI, you build a bench: 1 GK, 2 DEF, 2 MID, 2 ATT. They cost budget too and matter for rotation and transfers.</span>} />
          </Block>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {BUDGETS.map(b => (
              <div key={b.val} style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '10px 10px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-num)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{b.val}</div>
                <div style={{ fontFamily: 'var(--font-num)', fontSize: 9, color: 'var(--primary)', letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 4 }}>{b.label}</div>
                {b.note && <div style={{ fontFamily: 'var(--font-num)', fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>{b.note}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Key numbers */}
        <div className="section-title" style={{ paddingLeft: 0 }}>Key numbers</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Block>
            <Row label="Rating">Each player has an overall rating. The average rating of the eleven starters is your team's strength.</Row>
            <Row label="Strength">How good your team is right now — compared against the opponent's to calculate your win odds.</Row>
            <Row label="Energy">
              <span>0–100 per player. Starters lose energy each match; bench players recover it. Your average energy slightly raises or lowers your effective strength — a tired squad can lose to a weaker, fresher one. Energy resets to full at the start of each season. (Match-by-match mode only.)</span>
            </Row>
          </Block>

          {/* Attitude */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ATTITUDE.map(a => (
              <Block key={a.label} color={a.color}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <Pill color={a.color}>{a.label}</Pill>
                  <span style={{ fontFamily: 'var(--font-num)', fontSize: 10, color: 'var(--muted)' }}>{a.formations}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-dim)' }}>{a.desc}</p>
              </Block>
            ))}
          </div>
        </div>

        {/* Playing a season */}
        <div className="section-title" style={{ paddingLeft: 0 }}>Playing a season</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Block color="var(--primary)">
            <div style={{ fontFamily: 'var(--font-num)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 6 }}>Match by match</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
              Play every game one at a time. Before each match you choose your lineup from starters and bench, then spin a wheel that lands on Win, Draw, or Loss. The size of each slice reflects your real probability based on strength, energy, attitude, and any active event. Tap the wheel to stop it early.
            </p>
          </Block>
          <Block>
            <div style={{ fontFamily: 'var(--font-num)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Simulate everything</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
              The whole season is auto-played. Pick one lineup at the start and it runs with a transfer window at the halfway point. Faster, less interactive, no energy management.
            </p>
          </Block>
        </div>

        {/* Events */}
        <div className="section-title" style={{ paddingLeft: 0 }}>Events</div>
        <Block>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
            Every 4 matches a random event appears and lasts for the next 4 games. Some are bonuses (striker on fire, great training week) and some are penalties (key injury, bad pitch). They temporarily shift your win/draw/loss odds.
          </p>
        </Block>

        {/* Probabilities */}
        <div className="section-title" style={{ paddingLeft: 0 }}>The probabilities</div>
        <Block>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
            Before each match you see three percentages: <span style={{ color: 'var(--win)' }}>Win</span>, <span style={{ color: 'var(--muted)' }}>Draw</span>, <span style={{ color: 'var(--loss)' }}>Loss</span>. They come from comparing your team to the opponent, then adjusting for attitude and any active event. They always add up to 100% and are real — the wheel genuinely lands according to those odds.
          </p>
        </Block>

        {/* Transfer markets */}
        <div className="section-title" style={{ paddingLeft: 0 }}>Transfer markets</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Block>
            <div style={{ fontFamily: 'var(--font-num)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mkt-amber)', marginBottom: 6 }}>January (mid-season)</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
              Spin to decide if the market opens, then spin for a budget, number of signings (2–4), and for each signing: a league, position, the new player, and which of your players he replaces. You can accept or reject each deal.
            </p>
          </Block>
          <Block>
            <div style={{ fontFamily: 'var(--font-num)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mkt-amber)', marginBottom: 6 }}>Summer (between seasons)</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
              Same idea, with a budget based on where you finished. Higher finishes get bigger budgets.
            </p>
          </Block>
          <div style={{ padding: '10px 14px', background: 'var(--surface-3)', borderRadius: 'var(--r-sm)', fontSize: 12, color: 'var(--muted)' }}>
            You can only swap a player for another in the same position (attacker for attacker, etc.). Bench players count and can be swapped too.
          </div>
        </div>

        {/* Standings */}
        <div className="section-title" style={{ paddingLeft: 0 }}>Final standings</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Champions League', color: '#2E6BFF' },
            { label: 'Europa League',    color: '#FF7A18' },
            { label: 'Conference League', color: '#16D17A' },
            { label: 'Relegation zone', color: 'var(--loss)' },
          ].map(z => (
            <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: z.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--ink-dim)' }}>{z.label}</span>
            </div>
          ))}
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--muted)' }}>Exact qualifying positions depend on your league.</p>
        </div>

        {/* European competitions */}
        <div className="section-title" style={{ paddingLeft: 0 }}>European competitions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Block>
            <Row label="Group stage">A 36-team league, simulated automatically. The top 16 advance.</Row>
            <Row label="Knockouts">Round of 16 → Quarter-finals → Semi-finals → Final. You spin for each match. A draw goes to a 50/50 penalty shootout. Win and you advance; lose and you're out.</Row>
            <Row label="Points" children={<span>The further you go, the more bonus points you earn, multiplied by the competition's prestige. Champions League is worth the most, Conference the least.</span>} />
          </Block>
        </div>

        {/* Scoring */}
        <div className="section-title" style={{ paddingLeft: 0 }}>Scoring</div>
        <Block>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SCORE_FACTORS.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--primary)', fontSize: 13, flexShrink: 0, marginTop: 1 }}>+</span>
                <span style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>{f}</span>
              </div>
            ))}
          </div>
        </Block>

        {/* Endgame */}
        <div className="section-title" style={{ paddingLeft: 0 }}>The endgame</div>
        <Block>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>
            After 3 seasons — or if you get relegated — the game ends with a recap showing your total score across all seasons and your final squad. Then you can play again.
          </p>
        </Block>

        {/* Tips */}
        <div className="section-title" style={{ paddingLeft: 0 }}>Quick tips</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 40 }}>
          {TIPS.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-num)', fontSize: 12, color: 'var(--primary)', flexShrink: 0 }}>0{i + 1}</span>
              <span style={{ fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
