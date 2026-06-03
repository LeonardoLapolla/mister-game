import { useNavigate } from 'react-router-dom'
import useGameStore from '../store/gameStore'
import { IconBall } from '../components/Icons'

export default function Home() {
  const navigate = useNavigate()
  const reset = useGameStore((s) => s.reset)

  const handleStart = () => {
    reset()
    navigate('/wheel')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 40%, #0d1829 0%, #080b12 100%)' }}>

      {/* Cerchi decorativi — nascosti su mobile per evitare overflow */}
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/[0.03] pointer-events-none" />
      <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full border border-white/[0.03] pointer-events-none" />
      <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-white/[0.03] pointer-events-none" />

      {/* Glow blob */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(0,230,118,0.06) 0%, transparent 70%)' }} />

      <div className="text-center w-full max-w-md relative z-10 animate-slide-up">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 md:mb-8 border"
          style={{ background: 'rgba(0,230,118,0.08)', borderColor: 'rgba(0,230,118,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--c-green)' }} />
          <span className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: 'var(--c-green)' }}>
            Football Manager
          </span>
        </div>

        {/* Logo SVG */}
        <div className="flex justify-center mb-4 animate-bounce-ball"
          style={{ filter: 'drop-shadow(0 0 28px rgba(0,230,118,0.35))' }}>
          <IconBall size={80} style={{ color: 'var(--c-text)' }} />
        </div>

        {/* Titolo */}
        <h1 className="mb-4 leading-none" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 'clamp(4.5rem, 18vw, 8rem)',
          letterSpacing: '0.08em',
          color: 'var(--c-text)',
          textShadow: '0 0 60px rgba(0,230,118,0.15)',
        }}>
          MISTER
        </h1>

        {/* Separatore */}
        <div className="flex items-center justify-center gap-3 mb-5">
          <div className="h-px w-10 md:w-12" style={{ background: 'linear-gradient(to right, transparent, rgba(0,230,118,0.5))' }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-green)' }} />
          <div className="h-px w-10 md:w-12" style={{ background: 'linear-gradient(to left, transparent, rgba(0,230,118,0.5))' }} />
        </div>

        {/* Sottotitolo */}
        <p className="text-base md:text-lg font-light mb-2 leading-snug" style={{ color: 'var(--c-text)' }}>
          Crea la tua squadra. Scegli il campionato.<br />Diventa leggenda.
        </p>
        <p className="text-sm mb-8 md:mb-10" style={{ color: 'var(--c-muted)' }}>
          Un gioco di calcio manageriale — veloce, semplice, competitivo.
        </p>

        {/* CTA — full-width su mobile */}
        <button
          onClick={handleStart}
          className="btn-primary animate-pulse-glow w-full sm:w-auto"
          style={{ borderRadius: '1rem', fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.05em', padding: '1rem 3rem' }}
        >
          INIZIA ORA
        </button>

        {/* Stats */}
        <div className="mt-10 md:mt-12 grid grid-cols-3 gap-3 md:gap-4">
          {[
            { value: '5', label: 'Campionati' },
            { value: '38', label: 'Partite' },
            { value: '∞', label: 'Sfide' },
          ].map(({ value, label }, i) => (
            <div key={label}
              className={`card-base py-4 px-2 text-center animate-slide-up delay-${i === 0 ? '150' : i === 1 ? '225' : '300'}`}
              style={{ backdropFilter: 'blur(8px)' }}>
              <div className="stat-number" style={{ color: 'var(--c-green)', fontSize: '1.4rem' }}>{value}</div>
              <div className="text-[10px] md:text-[11px] font-semibold uppercase tracking-widest mt-1" style={{ color: 'var(--c-muted)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="absolute bottom-5 text-xs tracking-wider" style={{ color: 'var(--c-faint)' }}>
        MISTER © 2025
      </p>
    </div>
  )
}
