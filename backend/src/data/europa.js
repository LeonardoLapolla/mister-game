// Qualificazioni per campionato
const EUROPA_QUALIFICATIONS = {
  PL: {
    champions: [1, 2, 3, 4, 5, 6],
    europa: [7, 8],
    conference: [9],
  },
  SA: {
    champions: [1, 2, 3, 4],
    europa: [5, 6],
    conference: [7],
  },
  BL: {
    champions: [1, 2, 3, 4],
    europa: [5, 6],
    conference: [7],
  },
  LL: {
    champions: [1, 2, 3, 4],
    europa: [5, 6],
    conference: [7],
  },
  L1: {
    champions: [1, 2, 3],
    europa: [4, 5, 6],
    conference: [7],
  },
}

// Squadre dei 5 campionati giocabili per competizione
// (vengono rimpiazzate dalle squadre simulate)
const LEAGUE_SLOTS = {
  champions: {
    PL: 6, SA: 4, BL: 4, LL: 4, L1: 3,
  },
  europa: {
    PL: 2, SA: 2, BL: 2, LL: 2, L1: 3,
  },
  conference: {
    PL: 1, SA: 1, BL: 1, LL: 1, L1: 1,
  },
}

// Squadre statiche per ogni competizione (campionati esterni ai 5 giocabili)
const STATIC_TEAMS = {
  champions: [
    { name: 'Ajax', rating: 75 },
    { name: 'Slavia Prague', rating: 75 },
    { name: 'Bodo/Glimt', rating: 75 },
    { name: 'Olympiacos Piraeus', rating: 75 },
    { name: 'Pafos', rating: 75 },
    { name: 'Benfica', rating: 75 },
    { name: 'Qarabag', rating: 75 },
    { name: 'PSV', rating: 75 },
    { name: 'Royale Union SG', rating: 75 },
    { name: 'Sporting CP', rating: 75 },
    { name: 'Kairat Almaty', rating: 75 },
    { name: 'Galatasaray', rating: 75 },
    { name: 'FC Copenhagen', rating: 75 },
    { name: 'Club Brugge KV', rating: 75 },
  ],
  europa: [
    { name: 'Young Boys', rating: 75 },
    { name: 'Panathinaikos', rating: 75 },
    { name: 'Utrecht', rating: 75 },
    { name: 'Salzburg', rating: 75 },
    { name: 'FC Porto', rating: 75 },
    { name: 'Rangers', rating: 75 },
    { name: 'Genk', rating: 75 },
    { name: 'Ferencvaros', rating: 75 },
    { name: 'Plzen', rating: 75 },
    { name: 'Brann', rating: 75 },
    { name: 'G.A. Eagles', rating: 75 },
    { name: 'FCSB', rating: 75 },
    { name: 'Malmo FF', rating: 75 },
    { name: 'Ludogorets', rating: 75 },
    { name: 'Basel', rating: 75 },
    { name: 'Din. Zagreb', rating: 75 },
    { name: 'Fenerbahce', rating: 75 },
    { name: 'Crvena zvezda', rating: 75 },
    { name: 'Celtic', rating: 75 },
    { name: 'Braga', rating: 75 },
    { name: 'Feyenoord', rating: 75 },
    { name: 'PAOK', rating: 75 },
    { name: 'Maccabi Tel Aviv', rating: 75 },
    { name: 'Midtjylland', rating: 75 },
    { name: 'Sturm Graz', rating: 75 },
  ],
  conference: [
    { name: 'Sparta Prague', rating: 75 },
    { name: 'Shamrock Rovers', rating: 75 },
    { name: 'Slovan Bratislava', rating: 75 },
    { name: 'Shelbourne', rating: 75 },
    { name: 'Hacken', rating: 75 },
    { name: 'Rakow', rating: 75 },
    { name: 'Univ. Craiova', rating: 75 },
    { name: 'Legia', rating: 75 },
    { name: 'Samsunspor', rating: 75 },
    { name: 'Sigma Olomouc', rating: 75 },
    { name: 'Celje', rating: 75 },
    { name: 'AEK Athens', rating: 75 },
    { name: 'AEK Larnaca', rating: 75 },
    { name: 'AZ Alkmaar', rating: 75 },
    { name: 'Aberdeen', rating: 75 },
    { name: 'Shakhtar Donetsk', rating: 75 },
    { name: 'Zrinjski', rating: 75 },
    { name: 'Lincoln Red Imps', rating: 75 },
    { name: 'Shkendija', rating: 75 },
    { name: 'Omonia', rating: 75 },
    { name: 'Noah', rating: 75 },
    { name: 'Rijeka', rating: 75 },
    { name: 'Lech Poznan', rating: 75 },
    { name: 'SK Rapid', rating: 75 },
    { name: 'Lausanne', rating: 75 },
    { name: 'Breidablik', rating: 75 },
    { name: 'KuPS', rating: 75 },
    { name: 'Drita', rating: 75 },
    { name: 'Jagiellonia', rating: 75 },
    { name: 'Hamrun', rating: 75 },
    { name: 'Dyn. Kyiv', rating: 75 },
  ],
}

// Squadre dei 5 campionati per competizione (da rimpiazzare con simulate)
const LEAGUE_TEAMS = {
  champions: {
    PL: ['Liverpool', 'Chelsea', 'Tottenham', 'Arsenal', 'Newcastle', 'Manchester City'],
    SA: ['Atalanta', 'Inter', 'Juventus', 'Napoli'],
    BL: ['Bayern Munich', 'Dortmund', 'Eintracht Frankfurt', 'Bayer Leverkusen'],
    LL: ['Atl. Madrid', 'Villarreal', 'Real Madrid', 'Barcelona'],
    L1: ['PSG', 'Marseille', 'Monaco'],
  },
  europa: {
    PL: ['Aston Villa', 'Nottingham'],
    SA: ['Bologna', 'AS Roma'],
    BL: ['Stuttgart', 'Freiburg'],
    LL: ['Ath Bilbao', 'Celta Vigo'],
    L1: ['Lyon', 'Lille', 'Nice'],
  },
  conference: {
    PL: ['Crystal Palace'],
    SA: ['Fiorentina'],
    BL: ['Mainz'],
    LL: ['Betis'],
    L1: ['Strasbourg'],
  },
}

/**
 * Determina la competizione europea per una data posizione e campionato
 */
function getEuropaCompetition(position, league) {
  const quals = EUROPA_QUALIFICATIONS[league]
  if (!quals) return null
  if (quals.champions.includes(position)) return 'champions'
  if (quals.europa.includes(position)) return 'europa'
  if (quals.conference.includes(position)) return 'conference'
  return null
}

/**
 * Costruisce il girone completo per una competizione
 * Sostituisce le squadre del campionato del giocatore con quelle simulate
 * @param {string} competition - 'champions' | 'europa' | 'conference'
 * @param {string} playerLeague - codice campionato del giocatore (PL, SA, ecc.)
 * @param {Array} simulatedLeagueTeams - squadre simulate del campionato (con name e strength)
 * @param {number} playerPosition - posizione finale del giocatore
 */
function buildEuropaGroup(competition, playerLeague, simulatedLeagueTeams, playerPosition) {
  const staticTeams = [...STATIC_TEAMS[competition]]
  const leagueSlots = LEAGUE_SLOTS[competition]
  const defaultTeams = LEAGUE_TEAMS[competition]

  // Per ogni campionato, prendi le prime N squadre simulate
  const allLeagues = ['PL', 'SA', 'BL', 'LL', 'L1']
  const leagueTeams = []

  for (const league of allLeagues) {
    const slots = leagueSlots[league]
    const quals = EUROPA_QUALIFICATIONS[league]
    const positions = quals[competition] || []

    if (league === playerLeague) {
      // Usa le squadre simulate — prendi le prime N per posizione (escludi il giocatore)
      const topTeams = simulatedLeagueTeams
        .filter(t => t.name !== 'La Tua Squadra')
        .slice(0, slots)
        .map(t => ({ name: t.name, rating: t.strength || 75 }))

      // Aggiungi il giocatore solo se qualificato in questa competizione
      const playerQualifies = positions.includes(playerPosition)
      if (playerQualifies) {
        leagueTeams.push({ name: 'La Tua Squadra', rating: 0, isPlayer: true })
      }

      // Riempì i restanti slot con le squadre simulate
      leagueTeams.push(...topTeams.slice(0, playerQualifies ? slots - 1 : slots))
    } else {
      // Usa le squadre di default del campionato
      const defaults = defaultTeams[league] || []
      leagueTeams.push(
        ...defaults.slice(0, slots).map(name => ({ name, rating: 75 }))
      )
    }
  }

  // Totale: staticTeams + leagueTeams = 36 squadre
  const allTeams = [...staticTeams, ...leagueTeams]
  return allTeams
}

/**
 * Simula il girone europeo
 * Ogni squadra gioca contro ogni altra 1 volta (35 partite ciascuna)
 * Le prime 16 si qualificano
 */
function simulateEuropaGroup(teams, playerRating) {
  // Inizializza classifica
  const standings = teams.map(t => ({
    name: t.name,
    isPlayer: t.isPlayer || false,
    rating: t.isPlayer ? playerRating : t.rating,
    p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0,
  }))

  // Simula partite (ogni coppia gioca una volta)
  for (let i = 0; i < standings.length; i++) {
    for (let j = i + 1; j < standings.length; j++) {
      const home = standings[i]
      const away = standings[j]

      if (home.isPlayer || away.isPlayer) continue // Le partite del giocatore si giocano con la ruota

      const diff = home.rating - away.rating
      const absDiff = Math.abs(diff)
      const drawChance = Math.max(0.08, 0.22 - absDiff * 0.006)
      const homeWinChance = Math.min(0.80, Math.max(0.08, 0.5 + diff * 0.025))

      const r = Math.random()
      let hg, ag

      if (r < homeWinChance) {
        hg = 1 + Math.floor(Math.random() * 3)
        ag = Math.floor(Math.random() * hg)
        home.w++; away.l++
        home.pts += 3
      } else if (r < homeWinChance + drawChance) {
        hg = Math.floor(Math.random() * 3)
        ag = hg
        home.d++; away.d++
        home.pts += 1; away.pts += 1
      } else {
        ag = 1 + Math.floor(Math.random() * 3)
        hg = Math.floor(Math.random() * ag)
        away.w++; home.l++
        away.pts += 3
      }

      home.gf += hg; home.ga += ag; home.p++
      away.gf += ag; away.ga += hg; away.p++
    }
  }

  // Ordina per punti, poi differenza reti
  standings.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts
    return (b.gf - b.ga) - (a.gf - a.ga)
  })

  return standings
}

/**
 * Calcola le probabilità per una partita europea
 */
function getEuropaMatchProbs(playerRating, opponentRating, homeGame) {
  const opponentStr = homeGame ? opponentRating : opponentRating + 3
  const diff = playerRating - opponentStr
  const absDiff = Math.abs(diff)

  const drawProb = Math.max(8, Math.round((0.22 - absDiff * 0.006) * 100))
  const remaining = 100 - drawProb
  const winProb = Math.min(80, Math.max(8, Math.round(remaining * (0.5 + diff * 0.025))))
  const lossProb = Math.max(8, 100 - drawProb - winProb)

  return { win: winProb, draw: drawProb, loss: lossProb }
}

module.exports = {
  EUROPA_QUALIFICATIONS,
  LEAGUE_SLOTS,
  STATIC_TEAMS,
  LEAGUE_TEAMS,
  getEuropaCompetition,
  buildEuropaGroup,
  simulateEuropaGroup,
  getEuropaMatchProbs,
}