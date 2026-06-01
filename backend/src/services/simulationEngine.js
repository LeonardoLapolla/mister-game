const narrativeTemplates = {
  goal: [
    "{scorer} riceve palla in area e non perdona: GOL! ⚽",
    "Azione splendida, {scorer} si coordina e batte il portiere! ⚽",
    "{scorer} di testa sugli sviluppi di un corner! ⚽",
    "Punizione magistrale di {scorer}, il portiere non ci arriva! ⚽",
    "{scorer} scatta sul filo del fuorigioco e batte il portiere! ⚽",
    "Cross dalla destra, {scorer} colpo di testa! GOL! ⚽",
    "{scorer} recupera palla e parte in contropiede, GOL! ⚽",
  ],
  goalAgainst: [
    "L'avversario sorprende la tua difesa e segna. 😤",
    "Errore difensivo, l'avversario ne approfitta e fa gol. 😤",
    "Tiro da fuori area, il tuo portiere non riesce a parare. 😤",
    "Corner dell'avversario, colpo di testa vincente. 😤",
    "Contropiede fulmineo dell'avversario, gol. 😤",
  ],
  chance: [
    "{player} calcia, il portiere respinge in corner!",
    "Traversa clamorosa di {player}!",
    "{player} solo davanti al portiere ma calcia fuori!",
    "Grande occasione sprecata da {player}!",
  ],
  defense: [
    "Il tuo portiere salva tutto con un intervento prodigioso!",
    "La difesa respinge l'attacco avversario.",
    "Fuorigioco! L'azione avversaria si ferma.",
    "Il tuo portiere blocca il tiro avversario.",
  ],
};

function getRandomTemplate(templates, replacements = {}) {
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template.replace(/\{(\w+)\}/g, (_, key) => replacements[key] || key);
}

function getPlayersByPosition(players, position) {
  return players.filter((p) => p.position === position);
}

function getRandomPlayer(players) {
  return players[Math.floor(Math.random() * players.length)];
}

function calculateTeamStrength(players) {
  if (!players || players.length === 0) return 50;
  const total = players.reduce((sum, p) => sum + p.rating, 0);
  return Math.round(total / players.length);
}

function simulateRound(roundMatches) {
  return roundMatches.map(m => {
    const diff = m.homeStrength - m.awayStrength + 3;
    const absDiff = Math.abs(diff);
    const drawChance = Math.max(0.08, 0.22 - absDiff * 0.006);
    const homeWinChance = Math.min(0.80, Math.max(0.08, 0.5 + diff * 0.025));

    const r = Math.random();
    let homeGoals, awayGoals;

    if (r < homeWinChance) {
      homeGoals = 1 + Math.floor(Math.random() * 3);
      awayGoals = Math.floor(Math.random() * homeGoals);
    } else if (r < homeWinChance + drawChance) {
      homeGoals = Math.floor(Math.random() * 3);
      awayGoals = homeGoals;
    } else {
      awayGoals = 1 + Math.floor(Math.random() * 3);
      homeGoals = Math.floor(Math.random() * awayGoals);
    }

    return { ...m, homeGoals, awayGoals };
  });
}

function generateFullCalendar(leagueTeams) {
  const teams = [...leagueTeams];
  const n = teams.length;
  const rounds = n - 1;
  const matchesPerRound = Math.floor(n / 2);

  const fixed = teams[0];
  const rotating = teams.slice(1);
  const firstLeg = [];

  for (let round = 0; round < rounds; round++) {
    const roundMatches = [];
    const current = [fixed, ...rotating];

    for (let i = 0; i < matchesPerRound; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      roundMatches.push({
        home: home.name,
        homeStrength: home.strength,
        away: away.name,
        awayStrength: away.strength,
      });
    }

    firstLeg.push(roundMatches);
    rotating.push(rotating.shift());
  }

  const secondLeg = firstLeg.map(round =>
    round.map(m => ({
      home: m.away,
      homeStrength: m.awayStrength,
      away: m.home,
      awayStrength: m.homeStrength,
    }))
  );

  return [...firstLeg, ...secondLeg];
}

function simulateSeason(yourPlayers, leagueTeams) {
  const yourStrength = calculateTeamStrength(yourPlayers);

  // Genera calendario completo AI
  const fullCalendar = generateFullCalendar(leagueTeams);
  const simulatedRounds = fullCalendar.map(round => simulateRound(round));

  // Genera le tue partite
  const shuffled = [...leagueTeams].sort(() => Math.random() - 0.5);
  const firstLeg = shuffled.map((team, i) => ({
    opponent: team.name,
    homeGame: Math.random() > 0.5,
    matchday: i + 1,
    strength: team.strength,
  }));
  const secondLeg = firstLeg.map((m, i) => ({
    opponent: m.opponent,
    homeGame: !m.homeGame,
    matchday: leagueTeams.length + i + 1,
    strength: m.strength,
  }));

  const yourMatches = [...firstLeg, ...secondLeg].map(m => {
    const opponentStrength = m.homeGame ? m.strength : m.strength + 3;
    const diff = yourStrength - opponentStrength;
    const absDiff = Math.abs(diff);
    const drawChance = Math.max(0.08, 0.22 - absDiff * 0.006);
    const winChance = Math.min(0.80, Math.max(0.08, 0.5 + diff * 0.025));

    const r = Math.random();
    let goalsFor, goalsAgainst;

    if (r < winChance) {
      goalsFor = 1 + Math.floor(Math.random() * 3);
      goalsAgainst = Math.floor(Math.random() * goalsFor);
    } else if (r < winChance + drawChance) {
      goalsFor = Math.floor(Math.random() * 3);
      goalsAgainst = goalsFor;
    } else {
      goalsAgainst = 1 + Math.floor(Math.random() * 3);
      goalsFor = Math.floor(Math.random() * goalsAgainst);
    }

    return {
      opponent: m.opponent,
      homeGame: m.homeGame,
      matchday: m.matchday,
      goalsFor,
      goalsAgainst,
      events: [],
    };
  });

  return { yourMatches, simulatedRounds };
}

function calculateStandingsFromCalendar(yourMatches, yourTeamName, leagueTeams, simulatedRounds, upToRound) {
  const standings = {};

  standings[yourTeamName] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  for (const team of leagueTeams) {
    standings[team.name] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 };
  }

  // Tuoi risultati
  const yourPlayedMatches = yourMatches.filter(m => m.played && m.matchday <= upToRound);
  for (const match of yourPlayedMatches) {
    const yours = standings[yourTeamName];
    const opp = standings[match.opponent];
    if (!opp) continue;

    yours.p++; opp.p++;
    yours.gf += match.goalsFor;
    yours.ga += match.goalsAgainst;
    opp.gf += match.goalsAgainst;
    opp.ga += match.goalsFor;

    if (match.goalsFor > match.goalsAgainst) {
      yours.w++; yours.pts += 3; opp.l++;
    } else if (match.goalsFor === match.goalsAgainst) {
      yours.d++; yours.pts += 1; opp.d++; opp.pts += 1;
    } else {
      yours.l++; opp.w++; opp.pts += 3;
    }
  }

  // Il calendario AI ha n-1 round per girone, le tue giornate sono n
  // Scala i round AI proporzionalmente alle tue giornate
  const totalTeams = leagueTeams ? leagueTeams.length : 20
  const aiRoundsPerLeg = totalTeams - 1  // 19 round AI per girone
  const yourRoundsPerLeg = totalTeams    // 20 giornate tue per girone
  const isSecondLeg = upToRound > yourRoundsPerLeg
  const aiUpTo = isSecondLeg
    ? aiRoundsPerLeg + Math.round((upToRound - yourRoundsPerLeg) / yourRoundsPerLeg * aiRoundsPerLeg)
    : Math.round(upToRound / yourRoundsPerLeg * aiRoundsPerLeg)

for (let r = 0; r < Math.min(aiUpTo, simulatedRounds.length); r++) {
    for (const match of simulatedRounds[r]) {
      const tH = standings[match.home];
      const tA = standings[match.away];
      if (!tH || !tA) continue;

      tH.p++; tA.p++;
      tH.gf += match.homeGoals;
      tH.ga += match.awayGoals;
      tA.gf += match.awayGoals;
      tA.ga += match.homeGoals;

      if (match.homeGoals > match.awayGoals) {
        tH.w++; tH.pts += 3; tA.l++;
      } else if (match.homeGoals === match.awayGoals) {
        tH.d++; tH.pts += 1; tA.d++; tA.pts += 1;
      } else {
        tA.w++; tA.pts += 3; tH.l++;
      }
    }
  }

  return Object.entries(standings)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
}

// Mantenuta per compatibilità
function calculateStandings(matches, yourTeamName, leagueTeams) {
  return calculateStandingsFromCalendar(matches, yourTeamName, leagueTeams, [], 999);
}

module.exports = {
  simulateMatch: null,
  simulateSeason,
  calculateStandings,
  calculateStandingsFromCalendar,
  generateFullCalendar,
  simulateRound,
  calculateTeamStrength,
};