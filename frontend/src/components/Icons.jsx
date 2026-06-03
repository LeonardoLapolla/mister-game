const S = { strokeLinecap: 'round', strokeLinejoin: 'round' }

function Svg({ size, className, children }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden="true"
      {...S}>
      {children}
    </svg>
  )
}

export function IconBall({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeWidth="1.2"/>
      <path d="M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" strokeWidth="1.2"/>
      <path d="M12 8.5l2 1.5-.8 2.5h-2.4L10 10z" fill="currentColor" stroke="none"/>
    </Svg>
  )
}

export function IconTrophy({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M6 3h12v7a6 6 0 01-12 0V3z"/>
      <path d="M6 7H3.5a1.5 1.5 0 000 3H6M18 7h2.5a1.5 1.5 0 010 3H18"/>
      <path d="M12 16v3M8 21h8"/>
      <path d="M9.5 18.5h5"/>
    </Svg>
  )
}

export function IconMedal({ size = 24, className = '', color = 'currentColor' }) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="14" r="7"/>
      <path d="M9 3l3 4 3-4" strokeWidth="1.5"/>
      <path d="M8 7l4 3 4-3" strokeWidth="1.5"/>
    </Svg>
  )
}

export function IconStar({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" stroke="none"/>
    </Svg>
  )
}

export function IconChart({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="12" width="4" height="9" rx="1"/>
      <rect x="10" y="7" width="4" height="14" rx="1"/>
      <rect x="17" y="3" width="4" height="18" rx="1"/>
    </Svg>
  )
}

export function IconHome({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M3 12L12 3l9 9"/>
      <path d="M9 21V12h6v9"/>
      <rect x="5" y="12" width="14" height="9" rx="1" strokeWidth="0" fill="none"/>
      <path d="M5 12v9h14v-9"/>
    </Svg>
  )
}

export function IconPlane({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M21 16l-8-4V4a1 1 0 00-2 0v8L3 16l2 1 6-2v3l-2 1v1l3-1 3 1v-1l-2-1v-3l6 2 2-1z" fill="currentColor" stroke="none"/>
    </Svg>
  )
}

export function IconShuffle({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M16 3h5v5"/>
      <path d="M4 20L21 3"/>
      <path d="M21 16v5h-5"/>
      <path d="M15 15l6 6"/>
      <path d="M4 4l5 5"/>
    </Svg>
  )
}

export function IconArrowRight({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6"/>
    </Svg>
  )
}

export function IconArrowUp({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 19V5M5 12l7-7 7 7"/>
    </Svg>
  )
}

export function IconArrowDown({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 5v14M19 12l-7 7-7-7"/>
    </Svg>
  )
}

export function IconDice({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
    </Svg>
  )
}

export function IconPause({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>
      <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>
    </Svg>
  )
}

export function IconSkull({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 3a8 8 0 018 8c0 3.1-1.77 5.8-4.36 7.19L15 21H9l-.64-2.81A8 8 0 0112 3z"/>
      <path d="M9 17h6"/>
      <circle cx="9.5" cy="11" r="1.5" fill="currentColor" stroke="none"/>
      <circle cx="14.5" cy="11" r="1.5" fill="currentColor" stroke="none"/>
    </Svg>
  )
}

export function IconHandshake({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M3 10l5-5h3l2 2h2l4-2 2 2-4 3-2-1-5 5-2 1H6L3 13v-3z"/>
      <path d="M14 7l3 3"/>
      <path d="M10 12l4-4"/>
    </Svg>
  )
}

export function IconSlot({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <rect x="5" y="7" width="4" height="8" rx="1"/>
      <rect x="10" y="7" width="4" height="8" rx="1"/>
      <rect x="15" y="7" width="4" height="8" rx="1"/>
      <circle cx="12" cy="11" r="1" fill="currentColor" stroke="none"/>
    </Svg>
  )
}

export function IconSun({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
    </Svg>
  )
}

export function IconCalendar({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M3 9h18M8 2v4M16 2v4"/>
      <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none"/>
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none"/>
      <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none"/>
    </Svg>
  )
}

export function IconFlag({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M4 22V4"/>
      <path d="M4 4l16 4-16 5"/>
      <rect x="4" y="4" width="8" height="4.5" fill="currentColor" stroke="none" opacity="0.5"/>
      <rect x="12" y="4" width="8" height="4.5" fill="none"/>
      <rect x="4" y="8.5" width="8" height="4.5" fill="none"/>
      <rect x="12" y="8.5" width="8" height="4.5" fill="currentColor" stroke="none" opacity="0.5"/>
    </Svg>
  )
}

export function IconStore({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <path d="M9 22V12h6v10"/>
    </Svg>
  )
}

export function IconUsers({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <circle cx="9" cy="7" r="4"/>
      <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
      <path d="M21 21v-2a4 4 0 00-3-3.87"/>
    </Svg>
  )
}

export function IconMoney({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <rect x="2" y="6" width="20" height="14" rx="2"/>
      <circle cx="12" cy="13" r="3"/>
      <path d="M6 10v6M18 10v6"/>
    </Svg>
  )
}

export function IconRefresh({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <path d="M23 4v6h-6"/>
      <path d="M1 20v-6h6"/>
      <path d="M20.49 9A9 9 0 115.64 5.64L1 10"/>
      <path d="M23 14l-4.36 4.36A9 9 0 013.51 15"/>
    </Svg>
  )
}

export function IconClipboard({ size = 24, className = '' }) {
  return (
    <Svg size={size} className={className}>
      <rect x="8" y="2" width="8" height="4" rx="1"/>
      <path d="M8 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-3"/>
      <path d="M9 12h6M9 16h4"/>
    </Svg>
  )
}
