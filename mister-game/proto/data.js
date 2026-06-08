/* MISTER · prototype data (illustrative, not the real DB) */
window.MISTER_DATA = {
  leagues: [
    { id:'pl', label:'Premier', sub:'England', color:'#16C784' },
    { id:'sa', label:'Serie A', sub:'Italia',  color:'#0E1A16' },
    { id:'bl', label:'Bundes',  sub:'Deutsch', color:'#0FA56C' },
    { id:'ll', label:'La Liga', sub:'España',  color:'#13261E' },
    { id:'l1', label:'Ligue 1', sub:'France',  color:'#1FD68F' }
  ],
  budgets: [
    { id:'b30',  label:'€30M',  pts:'+50% punti', color:'#16C784' },
    { id:'b50',  label:'€50M',  pts:'+30% punti', color:'#13261E' },
    { id:'b80',  label:'€80M',  pts:'+10% punti', color:'#0FA56C' },
    { id:'b100', label:'€100M', pts:'base',       color:'#0E1A16' }
  ],
  formations: [
    { id:'433', label:'4-3-3', sub:'Offensivo', color:'#16C784' },
    { id:'442', label:'4-4-2', sub:'Equilibrio', color:'#13261E' },
    { id:'352', label:'3-5-2', sub:'Aggressivo', color:'#0FA56C' },
    { id:'4231',label:'4-2-3-1',sub:'Moderno',   color:'#1FD68F' }
  ],
  teamNames: [
    { id:'furia', label:'FC Furia', sub:'', color:'#16C784' },
    { id:'aurora',label:'Real Aurora', sub:'', color:'#13261E' },
    { id:'delta', label:'Union Delta', sub:'', color:'#0FA56C' },
    { id:'nord',  label:'Athletic Nord', sub:'', color:'#0E1A16' },
    { id:'vale',  label:'Sporting Vale', sub:'', color:'#1FD68F' }
  ],
  // pools by role (filtered for ~€50M budget feel)
  players: {
    GK:  [ {n:'M. Köhler',ovr:84,c:'#16C784'},{n:'L. Prieto',ovr:82,c:'#13261E'},{n:'D. Varga',ovr:80,c:'#0FA56C'} ],
    DEF: [ {n:'T. Okafor',ovr:85,c:'#16C784'},{n:'R. Lindqvist',ovr:83,c:'#13261E'},{n:'S. Bauer',ovr:82,c:'#0FA56C'},{n:'A. Moretti',ovr:81,c:'#1FD68F'} ],
    MID: [ {n:'J. Adeyemi',ovr:86,c:'#16C784'},{n:'P. Novak',ovr:84,c:'#13261E'},{n:'C. Rinaldi',ovr:83,c:'#0FA56C'} ],
    ATT: [ {n:'V. Sørensen',ovr:88,c:'#16C784'},{n:'E. Costa',ovr:85,c:'#13261E'},{n:'K. Mensah',ovr:84,c:'#0FA56C'} ]
  },
  // current formation roster (4-3-3) for squad screen
  lineup: [
    { role:'GK',  n:'M. Köhler',    num:1,  ovr:84, x:50, y:90 },
    { role:'DEF', n:'A. Moretti',   num:2,  ovr:81, x:18, y:70 },
    { role:'DEF', n:'T. Okafor',    num:4,  ovr:85, x:38, y:73 },
    { role:'DEF', n:'S. Bauer',     num:5,  ovr:82, x:62, y:73 },
    { role:'DEF', n:'R. Lindqvist', num:3,  ovr:83, x:82, y:70 },
    { role:'MID', n:'P. Novak',     num:8,  ovr:84, x:30, y:48 },
    { role:'MID', n:'J. Adeyemi',   num:6,  ovr:86, x:50, y:52 },
    { role:'MID', n:'C. Rinaldi',   num:10, ovr:83, x:70, y:48 },
    { role:'ATT', n:'K. Mensah',    num:11, ovr:84, x:24, y:24 },
    { role:'ATT', n:'V. Sørensen',  num:9,  ovr:88, x:50, y:18 },
    { role:'ATT', n:'E. Costa',     num:7,  ovr:85, x:76, y:24 }
  ],
  /* ---- ALL FORMATIONS (full lineups, correct positions) ----
     x: 0–100 left→right · y: 0(porta avversaria)→100(porta tua), GK ~90 */
  formationList: [
    { id:'433',  label:'4-3-3',   sub:'Offensivo'  },
    { id:'442',  label:'4-4-2',   sub:'Equilibrio' },
    { id:'352',  label:'3-5-2',   sub:'Aggressivo' },
    { id:'4231', label:'4-2-3-1', sub:'Moderno'    }
  ],
  formationLineups: {
    '433': [
      { role:'GK',  n:'M. Köhler',    num:1,  ovr:84, x:50, y:90 },
      { role:'DEF', n:'A. Moretti',   num:2,  ovr:81, x:18, y:70 },
      { role:'DEF', n:'T. Okafor',    num:4,  ovr:85, x:39, y:73 },
      { role:'DEF', n:'S. Bauer',     num:5,  ovr:82, x:61, y:73 },
      { role:'DEF', n:'R. Lindqvist', num:3,  ovr:83, x:82, y:70 },
      { role:'MID', n:'P. Novak',     num:8,  ovr:84, x:30, y:50 },
      { role:'MID', n:'J. Adeyemi',   num:6,  ovr:86, x:50, y:54 },
      { role:'MID', n:'C. Rinaldi',   num:10, ovr:83, x:70, y:50 },
      { role:'ATT', n:'K. Mensah',    num:11, ovr:84, x:24, y:24 },
      { role:'ATT', n:'V. Sørensen',  num:9,  ovr:88, x:50, y:18 },
      { role:'ATT', n:'E. Costa',     num:7,  ovr:85, x:76, y:24 }
    ],
    '442': [
      { role:'GK',  n:'M. Köhler',    num:1,  ovr:84, x:50, y:90 },
      { role:'DEF', n:'A. Moretti',   num:2,  ovr:81, x:16, y:71 },
      { role:'DEF', n:'T. Okafor',    num:4,  ovr:85, x:39, y:74 },
      { role:'DEF', n:'S. Bauer',     num:5,  ovr:82, x:61, y:74 },
      { role:'DEF', n:'R. Lindqvist', num:3,  ovr:83, x:84, y:71 },
      { role:'MID', n:'K. Mensah',    num:11, ovr:84, x:16, y:49 },
      { role:'MID', n:'P. Novak',     num:8,  ovr:84, x:39, y:51 },
      { role:'MID', n:'J. Adeyemi',   num:6,  ovr:86, x:61, y:51 },
      { role:'MID', n:'C. Rinaldi',   num:10, ovr:83, x:84, y:49 },
      { role:'ATT', n:'V. Sørensen',  num:9,  ovr:88, x:37, y:23 },
      { role:'ATT', n:'E. Costa',     num:7,  ovr:85, x:63, y:23 }
    ],
    '352': [
      { role:'GK',  n:'M. Köhler',    num:1,  ovr:84, x:50, y:90 },
      { role:'DEF', n:'T. Okafor',    num:4,  ovr:85, x:28, y:74 },
      { role:'DEF', n:'S. Bauer',     num:5,  ovr:82, x:50, y:76 },
      { role:'DEF', n:'R. Lindqvist', num:3,  ovr:83, x:72, y:74 },
      { role:'WB',  n:'A. Moretti',   num:2,  ovr:81, x:11, y:54 },
      { role:'MID', n:'P. Novak',     num:8,  ovr:84, x:33, y:52 },
      { role:'MID', n:'J. Adeyemi',   num:6,  ovr:86, x:50, y:56 },
      { role:'MID', n:'C. Rinaldi',   num:10, ovr:83, x:67, y:52 },
      { role:'WB',  n:'N. Sokol',     num:15, ovr:80, x:89, y:54 },
      { role:'ATT', n:'V. Sørensen',  num:9,  ovr:88, x:38, y:23 },
      { role:'ATT', n:'E. Costa',     num:7,  ovr:85, x:62, y:23 }
    ],
    '4231': [
      { role:'GK',  n:'M. Köhler',    num:1,  ovr:84, x:50, y:90 },
      { role:'DEF', n:'A. Moretti',   num:2,  ovr:81, x:16, y:72 },
      { role:'DEF', n:'T. Okafor',    num:4,  ovr:85, x:39, y:74 },
      { role:'DEF', n:'S. Bauer',     num:5,  ovr:82, x:61, y:74 },
      { role:'DEF', n:'R. Lindqvist', num:3,  ovr:83, x:84, y:72 },
      { role:'MID', n:'P. Novak',     num:8,  ovr:84, x:36, y:57 },
      { role:'MID', n:'J. Adeyemi',   num:6,  ovr:86, x:64, y:57 },
      { role:'MID', n:'K. Mensah',    num:11, ovr:84, x:22, y:38 },
      { role:'MID', n:'C. Rinaldi',   num:10, ovr:83, x:50, y:41 },
      { role:'MID', n:'E. Costa',     num:7,  ovr:85, x:78, y:38 },
      { role:'ATT', n:'V. Sørensen',  num:9,  ovr:88, x:50, y:20 }
    ]
  },

  /* ---- DEADLINE DAY · ticker rumours (illustrative) ---- */
  tickerNews: [
    "ULTIM'ORA · Sørensen, sirene dalla Premier: il club fa muro",
    'AFFARE LAMPO · Adeyemi verso il rinnovo fino al 2030',
    'VISITE MEDICHE in corso per il nuovo difensore',
    'IL DS · «Chiudiamo entro mezzanotte, ci siamo»',
    'RESPINTA l\u2019offerta da 40M per Okafor: resta in rosa',
    'COLPO a sorpresa dalla Ligue 1 nelle ultime ore',
    'Mensah-Galaxy: contatti avviati, si tratta sul prezzo',
    'AGENTE in sede: summit di mercato a oltranza',
    'Novak rinnova: «Qui mi sento a casa»',
    'Ultimi slot liberi: la dirigenza accelera'
  ],

  standings: [
    { pos:1, tm:'Athletic Nord', g:23, pt:54, zone:'ch' },
    { pos:2, tm:'Olympia FC',    g:23, pt:51, zone:'ch' },
    { pos:3, tm:'Real Aurora',   g:23, pt:49, zone:'ch' },
    { pos:4, tm:'Sporting Vale', g:23, pt:46, zone:'ch' },
    { pos:5, tm:'FC Furia',      g:23, pt:47, zone:'el', you:true },
    { pos:6, tm:'Union Delta',   g:23, pt:39, zone:'el' },
    { pos:7, tm:'City Rovers',   g:23, pt:31, zone:'co' },
    { pos:8, tm:'Lakeside AC',   g:23, pt:29, zone:'' },
    { pos:9, tm:'Monte FC',      g:23, pt:27, zone:'' },
    { pos:16,tm:'Porto Vento',   g:23, pt:18, zone:'rel' },
    { pos:17,tm:'Old Castle',    g:23, pt:16, zone:'rel' },
    { pos:18,tm:'Vecchia Pieve', g:23, pt:14, zone:'rel' }
  ],
  fixtures: [
    { opp:'Real Aurora', sub:'3ª · forte', crest:'RA', ha:'Trasferta', forza:4, pv:48, pp:27, ps:25,
      event:{ type:'bonus', ic:'+', t:'Forma strepitosa', d:'Il bomber è in fiducia — +1 gol previsto.' } },
    { opp:'Union Delta', sub:'6ª · media', crest:'UD', ha:'Casa',      forza:3, pv:58, pp:24, ps:18,
      event:{ type:'malus', ic:'−', t:'Infortunio in difesa', d:'Okafor out — forza squadra −1.' } },
    { opp:'City Rovers', sub:'7ª · media', crest:'CR', ha:'Casa',      forza:2, pv:64, pp:22, ps:14,
      event:{ type:'bonus', ic:'+', t:'Spinta del pubblico', d:'Tutto esaurito — +1 alla forza in casa.' } },
    { opp:'Vecchia Pieve',sub:'18ª · debole',crest:'VP',ha:'Trasferta',forza:1, pv:72, pp:18, ps:10,
      event:null }
  ],
  events: {
    bonus: [
      { type:'bonus', icon:'flame', t:'Forma strepitosa', d:'Il bomber è in fiducia — +1 gol previsto.' },
      { type:'bonus', icon:'crowd', t:'Spinta del pubblico', d:'Tutto esaurito — +1 alla forza in casa.' },
      { type:'bonus', icon:'star',  t:'Stella in ascesa', d:'Un giovane sorprende — morale alle stelle.' }
    ],
    malus: [
      { type:'malus', icon:'injury',  t:'Infortunio in difesa', d:'Un titolare out — forza squadra −1.' },
      { type:'malus', icon:'card',    t:'Squalifica', d:'Cartellino di troppo — salta la partita.' },
      { type:'malus', icon:'fatigue', t:'Stanchezza', d:'Tour de force — gambe pesanti, −1 in trasferta.' }
    ]
  },

  /* ---- TRANSFER (mercato) ---- */
  yesno: [
    { label:'Sì', sub:'Apri il mercato', color:'#16C784' },
    { label:'No', sub:'Salta', color:'#13261E' }
  ],
  transferBudgets: [
    { label:'€10M', sub:'1 colpo',   color:'#13261E' },
    { label:'€20M', sub:'medio',     color:'#0FA56C' },
    { label:'€35M', sub:'big',       color:'#16C784' }
  ],
  acquistiCounts: [
    { label:'1', sub:'acquisto',  color:'#13261E' },
    { label:'2', sub:'acquisti',  color:'#0FA56C' },
    { label:'3', sub:'acquisti',  color:'#16C784' }
  ],
  roles: [
    { label:'GK',  sub:'Portiere',    color:'#13261E', key:'GK' },
    { label:'DEF', sub:'Difesa',      color:'#0FA56C', key:'DEF' },
    { label:'MID', sub:'Centrocampo', color:'#1FD68F', key:'MID' },
    { label:'ATT', sub:'Attacco',     color:'#16C784', key:'ATT' }
  ],

  /* ---- RESULTS / END SEASON ---- */
  finalStandings: [
    { pos:1, tm:'Athletic Nord', g:38, pt:86, zone:'ch' },
    { pos:2, tm:'Olympia FC',    g:38, pt:81, zone:'ch' },
    { pos:3, tm:'Sporting Vale', g:38, pt:74, zone:'ch' },
    { pos:4, tm:'Real Aurora',   g:38, pt:71, zone:'ch' },
    { pos:5, tm:'FC Furia',      g:38, pt:69, zone:'el', you:true },
    { pos:6, tm:'Union Delta',   g:38, pt:63, zone:'el' },
    { pos:7, tm:'City Rovers',   g:38, pt:55, zone:'co' },
    { pos:8, tm:'Lakeside AC',   g:38, pt:51, zone:'' },
    { pos:16,tm:'Porto Vento',   g:38, pt:34, zone:'rel' },
    { pos:17,tm:'Old Castle',    g:38, pt:30, zone:'rel' },
    { pos:18,tm:'Vecchia Pieve', g:38, pt:25, zone:'rel' }
  ],
  history: [
    { season:'Stagione 1', pos:'5°', pt:69, score:1480, comp:'el' }
  ],

  /* per-season outcomes for the 3-season cycle */
  seasonResults: [
    { pos:'5°', posN:5, pt:69, comp:'el', compName:'Europa League',     score:1480, obj:'Top 6 · zona Europa' },
    { pos:'3°', posN:3, pt:76, comp:'ch', compName:'Champions League',  score:1720, obj:'Top 4 · Champions' },
    { pos:'2°', posN:2, pt:81, comp:'ch', compName:'Champions League',  score:1890, obj:'Vincere il titolo' }
  ]
};


