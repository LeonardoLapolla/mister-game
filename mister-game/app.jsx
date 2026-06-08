/* MISTER — assemble the 3 directions onto a design canvas */
const { DesignCanvas, DCSection, DCArtboard } = window;

const NEON = {
  key: 'neon', letter: 'A', kicker: 'Stadium Neon',
  name: 'Stadium\nNeon',
  tagline: 'Arcade e adrenalinico. Verde-lime elettrico su nero-campo, glow ovunque, la ruota è una slot machine da luna park. Pensato per essere mostrato agli amici.',
  chips: ['Arcade', 'Glow', 'Lime elettrico', 'Hype'],
  fonts: { display: 'Anton', num: 'Space Mono', ui: 'Archivo' },
  glow: '#A6FF2E',
  wheel: [
    { label: 'Premier', color: '#A6FF2E' }, { label: 'Serie A', color: '#0E2A18' },
    { label: 'Bundesliga', color: '#2DE5A0' }, { label: 'La Liga', color: '#143822' },
    { label: 'Ligue 1', color: '#7CFF3B' }
  ],
  swMain: [
    { n: 'Sfondo', hex: '#06110A' }, { n: 'Superficie', hex: '#0E2014' }, { n: 'Primario', hex: '#A6FF2E' },
    { n: 'Testo', hex: '#EAFBE6' }, { n: 'Muted', hex: '#7FA98C' }, { n: 'Bordo', hex: '#1C3A24' }
  ],
  swAcc: [
    { n: 'Vittoria', hex: '#A6FF2E' }, { n: 'Pareggio', hex: '#FFC93C' }, { n: 'Sconfitta', hex: '#FF4D5E' },
    { n: 'Champions', hex: '#2E6BFF' }, { n: 'Europa', hex: '#FF7A18' }, { n: 'Conference', hex: '#16D17A' }
  ]
};

const PRO = {
  key: 'pro', letter: 'B', kicker: 'Pro Pitch',
  name: 'Pro\nPitch',
  tagline: 'Premium e sportivo, sulla scia di FC 26 e OneFootball. Smeraldo profondo su grafite, superfici vetrose con gradient morbidi, ruota dal materiale pulito e micro-animazioni.',
  chips: ['Premium', 'Smeraldo', 'Vetro', 'Moderno'],
  fonts: { display: 'Saira Condensed', num: 'DM Mono', ui: 'Hanken Grotesk' },
  glow: '#16C784',
  wheel: [
    { label: 'Premier', color: '#16C784' }, { label: 'Serie A', color: '#0E1A16' },
    { label: 'Bundesliga', color: '#0FA56C' }, { label: 'La Liga', color: '#13261E' },
    { label: 'Ligue 1', color: '#1FD68F' }
  ],
  swMain: [
    { n: 'Sfondo', hex: '#0A0D11' }, { n: 'Superficie', hex: '#141A20' }, { n: 'Primario', hex: '#16C784' },
    { n: 'Testo', hex: '#EAF1F4' }, { n: 'Muted', hex: '#8A98A6' }, { n: 'Bordo', hex: '#232B33' }
  ],
  swAcc: [
    { n: 'Vittoria', hex: '#16C784' }, { n: 'Pareggio', hex: '#F5B43C' }, { n: 'Sconfitta', hex: '#FB5566' },
    { n: 'Champions', hex: '#2E6BFF' }, { n: 'Europa', hex: '#FF7A18' }, { n: 'Conference', hex: '#16D17A' }
  ]
};

const BOLD = {
  key: 'bold', letter: 'C', kicker: 'Matchday Bold',
  name: 'Matchday\nBold',
  tagline: 'Editoriale e calcistico, stile rivista Panini. Tipografia condensata enorme, menta sofisticata su carbone caldo, angoli netti. La ruota ha peso fisico e bordo metallico.',
  chips: ['Editoriale', 'Menta', 'Type enorme', 'Caldo'],
  fonts: { display: 'Oswald', num: 'IBM Plex Mono', ui: 'Hanken Grotesk' },
  glow: '#2BE08B',
  wheel: [
    { label: 'Premier', color: '#2BE08B' }, { label: 'Serie A', color: '#211D18' },
    { label: 'Bundesliga', color: '#F4EFE6' }, { label: 'La Liga', color: '#2A8F63' },
    { label: 'Ligue 1', color: '#3DDC97' }
  ],
  swMain: [
    { n: 'Sfondo', hex: '#141210' }, { n: 'Superficie', hex: '#211D18' }, { n: 'Primario', hex: '#2BE08B' },
    { n: 'Testo', hex: '#F4EFE6' }, { n: 'Muted', hex: '#A99E8C' }, { n: 'Bordo', hex: '#2E2920' }
  ],
  swAcc: [
    { n: 'Vittoria', hex: '#2BE08B' }, { n: 'Pareggio', hex: '#F2C14E' }, { n: 'Sconfitta', hex: '#F0596A' },
    { n: 'Champions', hex: '#2E6BFF' }, { n: 'Europa', hex: '#FF7A18' }, { n: 'Conference', hex: '#16D17A' }
  ]
};

function Board({ cfg }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current) ref.current.innerHTML = window.MISTER.render(cfg);
    if (window.MisterWheel) window.MisterWheel.scan();
  }, []);
  // name with line break for the big title
  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}

const W = 1180, H = 1860;

function App() {
  return (
    <DesignCanvas>
      <DCSection id="directions" title="Mister — Design System" subtitle="3 direzioni di restyling · confronta e scegli (mixa pure tra loro)">
        <DCArtboard id="neon" label="A · Stadium Neon" width={W} height={H}><Board cfg={NEON} /></DCArtboard>
        <DCArtboard id="pro" label="B · Pro Pitch" width={W} height={H}><Board cfg={PRO} /></DCArtboard>
        <DCArtboard id="bold" label="C · Matchday Bold" width={W} height={H}><Board cfg={BOLD} /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
