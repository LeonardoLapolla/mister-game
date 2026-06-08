const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const { leagues } = require("../data/leagues");
const {
  getEuropaCompetition,
  buildEuropaGroup,
  simulateEuropaGroup,
  getEuropaMatchProbs,
} = require("../data/europa");

router.get("/:sessionId/check", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
    });
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });
    // Accept explicit position from query param (more reliable than session.position)
    const pos = parseInt(req.query.position) || session.position || 0;
    const competition = getEuropaCompetition(pos, session.league);
    res.json({ competition, position: pos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel controllo qualificazione" });
  }
});

router.post("/:sessionId/generate-group", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true },
    });
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    if (session.europaData) {
      const existing = JSON.parse(session.europaData);
      if (existing.groupGenerated) {
        return res.json({ standings: existing.standings, teams: existing.teams });
      }
    }

    const competition = getEuropaCompetition(session.position, session.league);
    if (!competition) return res.status(400).json({ error: "Non qualificato" });

    const leagueTeams = leagues[session.league].teams;
    const avgRating = session.players.length > 0
      ? Math.round(session.players.reduce((s, p) => s + p.rating, 0) / session.players.length)
      : 75;

    const teams = buildEuropaGroup(competition, session.league, leagueTeams, session.position);
    const { standings, playerOpponents } = simulateEuropaGroup(teams, avgRating);

    // Simula automaticamente le 10 partite del giocatore (avversarie assegnate casualmente)
    const playerMatches = playerOpponents.map((opp, i) => {
      const homeGame = i % 2 === 0;
      const opponentStr = homeGame ? opp.rating : opp.rating + 3;
      const diff = avgRating - opponentStr;
      const absDiff = Math.abs(diff);
      const drawChance = Math.max(0.08, 0.22 - absDiff * 0.006);
      const winChance = Math.min(0.80, Math.max(0.08, 0.5 + diff * 0.025));

      const r = Math.random();
      let goalsFor, goalsAgainst, result;

      if (r < winChance) {
        goalsFor = 1 + Math.floor(Math.random() * 3);
        goalsAgainst = Math.floor(Math.random() * goalsFor);
        result = 'win';
      } else if (r < winChance + drawChance) {
        goalsFor = Math.floor(Math.random() * 3);
        goalsAgainst = goalsFor;
        result = 'draw';
      } else {
        goalsAgainst = 1 + Math.floor(Math.random() * 3);
        goalsFor = Math.floor(Math.random() * goalsAgainst);
        result = 'loss';
      }

      return {
        opponent: opp.name,
        opponentRating: opp.rating,
        homeGame,
        played: true,
        goalsFor,
        goalsAgainst,
        result,
      };
    });

    // Calcola stats giocatore
    const playerStats = playerMatches.reduce((s, m) => ({
      p: s.p + 1,
      w: s.w + (m.result === 'win' ? 1 : 0),
      d: s.d + (m.result === 'draw' ? 1 : 0),
      l: s.l + (m.result === 'loss' ? 1 : 0),
      gf: s.gf + m.goalsFor,
      ga: s.ga + m.goalsAgainst,
      pts: s.pts + (m.result === 'win' ? 3 : m.result === 'draw' ? 1 : 0),
    }), { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 });

    // Aggiorna standings con i dati del giocatore
    const playerIdx = standings.findIndex(s => s.isPlayer);
    if (playerIdx !== -1) {
      standings[playerIdx] = { ...standings[playerIdx], ...playerStats };
      standings.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        return (b.gf - b.ga) - (a.gf - a.ga);
      });
    }

    const europaData = {
      competition,
      groupGenerated: true,
      standings,
      teams,
      playerMatches,
      playerStats,
      phase: 'group',
      knockoutRound: null,
      knockoutMatches: [],
      qualified: false,
      eliminated: false,
      finalRound: null,
    };

    await prisma.session.update({
      where: { id: session.id },
      data: { europaData: JSON.stringify(europaData) },
    });

    res.json({ standings, teams, competition, playerMatches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella generazione del girone" });
  }
});

router.get("/:sessionId/state", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true },
    });
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });
    if (!session.europaData) return res.status(404).json({ error: "Nessun torneo attivo" });

    const europaData = JSON.parse(session.europaData);
    const avgRating = session.players.length > 0
      ? Math.round(session.players.reduce((s, p) => s + p.rating, 0) / session.players.length)
      : 75;

    res.json({ ...europaData, avgRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero stato" });
  }
});

router.get("/:sessionId/next-group-match", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true },
    });
    if (!session || !session.europaData) return res.status(404).json({ error: "Torneo non trovato" });

    const europaData = JSON.parse(session.europaData);
    const avgRating = session.players.length > 0
      ? Math.round(session.players.reduce((s, p) => s + p.rating, 0) / session.players.length)
      : 75;

    const nextMatch = europaData.playerMatches.find(m => !m.played);
    if (!nextMatch) {
      return res.json({ finished: true, playerStats: europaData.playerStats });
    }

    const probs = getEuropaMatchProbs(avgRating, nextMatch.opponentRating, nextMatch.homeGame);
    res.json({ nextMatch, probs, avgRating, playerStats: europaData.playerStats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero partita" });
  }
});

router.post("/:sessionId/play-group-match", async (req, res) => {
  try {
    const { opponent, result } = req.body;
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
    });
    if (!session || !session.europaData) return res.status(404).json({ error: "Torneo non trovato" });

    const europaData = JSON.parse(session.europaData);
    const matchIndex = europaData.playerMatches.findIndex(m => m.opponent === opponent && !m.played);
    if (matchIndex === -1) return res.status(400).json({ error: "Partita non trovata" });

    let goalsFor, goalsAgainst;
    if (result === 'win') {
      goalsFor = 1 + Math.floor(Math.random() * 3);
      goalsAgainst = Math.floor(Math.random() * goalsFor);
    } else if (result === 'draw') {
      goalsFor = Math.floor(Math.random() * 3);
      goalsAgainst = goalsFor;
    } else {
      goalsAgainst = 1 + Math.floor(Math.random() * 3);
      goalsFor = Math.floor(Math.random() * goalsAgainst);
    }

    europaData.playerMatches[matchIndex] = {
      ...europaData.playerMatches[matchIndex],
      played: true,
      goalsFor,
      goalsAgainst,
      result,
    };

    const stats = europaData.playerStats;
    stats.p++;
    stats.gf += goalsFor;
    stats.ga += goalsAgainst;
    if (result === 'win') { stats.w++; stats.pts += 3; }
    else if (result === 'draw') { stats.d++; stats.pts += 1; }
    else { stats.l++; }

    const playerIdx = europaData.standings.findIndex(s => s.isPlayer);
    if (playerIdx !== -1) {
      europaData.standings[playerIdx] = { ...europaData.standings[playerIdx], ...stats };
      europaData.standings.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        return (b.gf - b.ga) - (a.gf - a.ga);
      });
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { europaData: JSON.stringify(europaData) },
    });

    res.json({ goalsFor, goalsAgainst, result, playerStats: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel salvataggio partita" });
  }
});

router.post("/:sessionId/finish-group", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
    });
    if (!session || !session.europaData) return res.status(404).json({ error: "Torneo non trovato" });

    const europaData = JSON.parse(session.europaData);

    const unplayed = europaData.playerMatches.filter(m => !m.played);
    if (unplayed.length > 0) return res.status(400).json({ error: "Partite ancora da giocare" });

    const playerPos = europaData.standings.findIndex(s => s.isPlayer) + 1;
    const qualified = playerPos <= 16;

    europaData.qualified = qualified;
    europaData.groupPosition = playerPos;

    if (qualified) {
      const qualifiedTeams = europaData.standings.slice(0, 16);
      europaData.phase = 'knockout';
      europaData.knockoutRound = 'R16';
      europaData.knockoutMatches = generateKnockoutBracket(qualifiedTeams);
    } else {
      europaData.phase = 'eliminated';
      europaData.eliminated = true;
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { europaData: JSON.stringify(europaData) },
    });

    res.json({
      qualified,
      groupPosition: playerPos,
      standings: europaData.standings,
      knockoutMatches: europaData.knockoutMatches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel finalizzare il girone" });
  }
});

router.get("/:sessionId/next-knockout-match", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true },
    });
    if (!session || !session.europaData) return res.status(404).json({ error: "Torneo non trovato" });

    const europaData = JSON.parse(session.europaData);
    const avgRating = session.players.length > 0
      ? Math.round(session.players.reduce((s, p) => s + p.rating, 0) / session.players.length)
      : 75;

    const currentRound = europaData.knockoutRound;
    const playerMatch = europaData.knockoutMatches.find(
      m => m.round === currentRound && m.isPlayerMatch && !m.played
    );

    if (!playerMatch) return res.json({ finished: true, finalRound: europaData.finalRound });

    const probs = getEuropaMatchProbs(avgRating, playerMatch.opponentRating, true);
    res.json({ match: playerMatch, probs, avgRating, round: currentRound });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero partita knockout" });
  }
});

router.post("/:sessionId/play-knockout-match", async (req, res) => {
  try {
    let { result } = req.body;
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true },
    });
    if (!session || !session.europaData) return res.status(404).json({ error: "Torneo non trovato" });

    const europaData = JSON.parse(session.europaData);
    const avgRating = session.players.length > 0
      ? Math.round(session.players.reduce((s, p) => s + p.rating, 0) / session.players.length)
      : 75;

    const currentRound = europaData.knockoutRound;
    const matchIdx = europaData.knockoutMatches.findIndex(
      m => m.round === currentRound && m.isPlayerMatch && !m.played
    );
    if (matchIdx === -1) return res.status(400).json({ error: "Partita non trovata" });

    let goalsFor, goalsAgainst;
    if (result === 'win') {
      goalsFor = 1 + Math.floor(Math.random() * 3);
      goalsAgainst = Math.floor(Math.random() * goalsFor);
    } else if (result === 'draw') {
      goalsFor = Math.floor(Math.random() * 2) + 1;
      goalsAgainst = goalsFor;
      result = Math.random() > 0.5 ? 'win' : 'loss'; // rigori
    } else {
      goalsAgainst = 1 + Math.floor(Math.random() * 3);
      goalsFor = Math.floor(Math.random() * goalsAgainst);
    }

    europaData.knockoutMatches[matchIdx] = {
      ...europaData.knockoutMatches[matchIdx],
      played: true,
      goalsFor,
      goalsAgainst,
      result,
    };

    const eliminated = result === 'loss';

    if (eliminated) {
      europaData.eliminated = true;
      europaData.finalRound = currentRound;
      europaData.phase = 'eliminated';
    } else {
      const nextRound = getNextRound(currentRound);
      simulateOtherKnockoutMatches(europaData, currentRound, avgRating);

      if (nextRound) {
        europaData.knockoutRound = nextRound;
        generateNextRoundMatches(europaData, nextRound);
      } else {
        europaData.finalRound = 'Final';
        europaData.phase = 'winner';
        europaData.eliminated = false;
      }
    }

    europaData.europaScore = calculateEuropaScore(europaData);

    await prisma.session.update({
      where: { id: session.id },
      data: { europaData: JSON.stringify(europaData) },
    });

    res.json({
      goalsFor,
      goalsAgainst,
      result,
      eliminated,
      nextRound: eliminated ? null : europaData.knockoutRound,
      europaScore: europaData.europaScore,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel salvataggio partita knockout" });
  }
});

router.get("/:sessionId/score", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
    });
    if (!session || !session.europaData) return res.status(404).json({ score: 0 });

    const europaData = JSON.parse(session.europaData);
    res.json({
      score: europaData.europaScore || 0,
      finalRound: europaData.finalRound,
      competition: europaData.competition,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero punteggio" });
  }
});

// ==================== HELPER FUNCTIONS ====================

function generateKnockoutBracket(qualifiedTeams) {
  const matches = [];
  for (let i = 0; i < 8; i++) {
    const home = qualifiedTeams[i];
    const away = qualifiedTeams[15 - i];
    const isPlayerMatch = home.isPlayer || away.isPlayer;
    const opponent = home.isPlayer ? away : home;

    matches.push({
      round: 'R16',
      home: home.name,
      away: away.name,
      homeRating: home.rating,
      awayRating: away.rating,
      isPlayerMatch,
      opponentName: opponent.name,
      opponentRating: opponent.rating,
      played: false,
      winner: null,
      goalsFor: null,
      goalsAgainst: null,
      result: null,
    });
  }
  return matches;
}

function simulateOtherKnockoutMatches(europaData, round, playerRating) {
  europaData.knockoutMatches.forEach((match, idx) => {
    if (match.round === round && !match.isPlayerMatch && !match.played) {
      const diff = match.homeRating - match.awayRating;
      const homeWin = Math.min(0.80, Math.max(0.08, 0.5 + diff * 0.025));
      const r = Math.random();
      const winner = r < homeWin ? match.home : match.away;
      const winnerRating = r < homeWin ? match.homeRating : match.awayRating;

      europaData.knockoutMatches[idx] = {
        ...match,
        played: true,
        winner,
        winnerRating,
        result: r < homeWin ? 'home' : 'away',
      };
    }
  });
}

function generateNextRoundMatches(europaData, nextRound) {
  const prevRound = getPrevRound(nextRound);
  const prevMatches = europaData.knockoutMatches.filter(m => m.round === prevRound);

  for (let i = 0; i < prevMatches.length; i += 2) {
    const m1 = prevMatches[i];
    const m2 = prevMatches[i + 1];
    if (!m1 || !m2) break;

    const team1 = m1.isPlayerMatch ? 'La Tua Squadra' : m1.winner;
    const team2 = m2.isPlayerMatch ? 'La Tua Squadra' : m2.winner;
    const rating1 = m1.isPlayerMatch ? 0 : m1.winnerRating;
    const rating2 = m2.isPlayerMatch ? 0 : m2.winnerRating;

    const isPlayerMatch = team1 === 'La Tua Squadra' || team2 === 'La Tua Squadra';
    const opponent = team1 === 'La Tua Squadra' ? team2 : team1;
    const opponentRating = team1 === 'La Tua Squadra' ? rating2 : rating1;

    europaData.knockoutMatches.push({
      round: nextRound,
      home: team1,
      away: team2,
      homeRating: rating1,
      awayRating: rating2,
      isPlayerMatch,
      opponentName: opponent,
      opponentRating,
      played: false,
      winner: null,
      goalsFor: null,
      goalsAgainst: null,
      result: null,
    });
  }
}

function getNextRound(round) {
  const rounds = ['R16', 'QF', 'SF', 'Final'];
  const idx = rounds.indexOf(round);
  return idx < rounds.length - 1 ? rounds[idx + 1] : null;
}

function getPrevRound(round) {
  const rounds = ['R16', 'QF', 'SF', 'Final'];
  const idx = rounds.indexOf(round);
  return idx > 0 ? rounds[idx - 1] : null;
}

function calculateEuropaScore(europaData) {
  const roundScores = { 'R16': 100, 'QF': 250, 'SF': 500, 'Final': 1000, 'winner': 2000 };
  const competitionMultipliers = { 'champions': 2.0, 'europa': 1.5, 'conference': 1.0 };
  const round = europaData.finalRound || (europaData.phase === 'winner' ? 'winner' : null);
  if (!round) return 0;
  const baseScore = roundScores[round] || 0;
  const multiplier = competitionMultipliers[europaData.competition] || 1.0;
  return Math.round(baseScore * multiplier);
}

module.exports = router;