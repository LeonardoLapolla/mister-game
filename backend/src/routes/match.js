const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const { leagues, formations } = require("../data/leagues");
const {
  simulateSeason,
  calculateStandingsFromCalendar,
  generateFullCalendar,
  simulateRound,
} = require("../services/simulationEngine");
const { calculateFinalScore, getPositionLabel } = require("../services/scoringService");

router.post("/:sessionId/generate", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true, matches: true },
    });

    if (!session) return res.status(404).json({ error: "Sessione non trovata" });
    if (session.matches.length > 0) return res.status(400).json({ error: "Stagione già generata" });

    const formation = formations.find((f) => f.id === session.formation);
    const totalSlots = Object.values(formation?.slots || {}).reduce((a, b) => a + b, 0);
    if (session.players.length < totalSlots) {
      return res.status(400).json({ error: "Rosa incompleta" });
    }

    const leagueTeams = leagues[session.league].teams;
    const { yourMatches, simulatedRounds } = simulateSeason(session.players, leagueTeams);

    await prisma.session.update({
      where: { id: session.id },
      data: { calendarData: JSON.stringify({ simulatedRounds }) },
    });

    await prisma.match.createMany({
      data: yourMatches.map((m) => ({
        opponent: m.opponent,
        homeGame: m.homeGame,
        goalsFor: m.goalsFor,
        goalsAgainst: m.goalsAgainst,
        narrative: JSON.stringify(m.events),
        played: true,
        matchday: m.matchday,
        sessionId: session.id,
      })),
    });

    res.json({ message: "Stagione generata", totalMatches: yourMatches.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella generazione della stagione" });
  }
});

router.post("/:sessionId/generate-calendar", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true, matches: true },
    });

    if (!session) return res.status(404).json({ error: "Sessione non trovata" });
    if (session.matches.length > 0) return res.status(400).json({ error: "Calendario già generato" });

    const leagueTeams = leagues[session.league].teams;
    const fullCalendar = generateFullCalendar(leagueTeams);
    const simulatedRounds = fullCalendar.map(round => simulateRound(round));

    const shuffled = [...leagueTeams].sort(() => Math.random() - 0.5);
    const firstLeg = shuffled.map((team, i) => ({
      opponent: team.name,
      strength: team.strength,
      homeGame: Math.random() > 0.5,
      matchday: i + 1,
    }));
    const secondLeg = firstLeg.map((m, i) => ({
      opponent: m.opponent,
      strength: m.strength,
      homeGame: !m.homeGame,
      matchday: leagueTeams.length + i + 1,
    }));
    const yourCalendar = [...firstLeg, ...secondLeg];

    await prisma.session.update({
      where: { id: session.id },
      data: { calendarData: JSON.stringify({ simulatedRounds }) },
    });

    await prisma.match.createMany({
      data: yourCalendar.map((m) => ({
        opponent: m.opponent,
        homeGame: m.homeGame,
        goalsFor: 0,
        goalsAgainst: 0,
        narrative: JSON.stringify([]),
        played: false,
        matchday: m.matchday,
        sessionId: session.id,
      })),
    });

    res.json({ message: "Calendario generato", totalMatches: yourCalendar.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella generazione del calendario" });
  }
});

router.get("/:sessionId/next-match", async (req, res) => {
  try {
    const skipHalfTime = req.query.skipHalfTime === 'true';

    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true, matches: true },
    });

    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    const leagueTeams = leagues[session.league].teams;
    const totalTeams = leagueTeams.length;
    const totalMatches = totalTeams * 2;
    const halfSeason = totalTeams;

    const playedMatches = session.matches
      .filter(m => m.played)
      .sort((a, b) => a.matchday - b.matchday);

    const nextMatch = session.matches
      .filter(m => !m.played)
      .sort((a, b) => a.matchday - b.matchday)[0];

    if (!nextMatch) return res.json({ finished: true });

    const playedCount = playedMatches.length;

    if (playedCount === halfSeason && !skipHalfTime) {
      const calendarData = session.calendarData ? JSON.parse(session.calendarData) : {};
      const simulatedRounds = calendarData.simulatedRounds || [];

      const standings = calculateStandingsFromCalendar(
        playedMatches,
        "La Tua Squadra",
        leagueTeams,
        simulatedRounds,
        halfSeason
      );

      return res.json({ halfTime: true, standings, playedCount, totalMatches });
    }

    const yourStrength = session.players.length > 0
      ? Math.round(session.players.reduce((s, p) => s + p.rating, 0) / session.players.length)
      : 60;

    const team = leagueTeams.find(t => t.name === nextMatch.opponent);
    const opponentStrength = nextMatch.homeGame
      ? team?.strength || 70
      : (team?.strength || 70) + 3;
    const diff = yourStrength - opponentStrength;
    const absDiff = Math.abs(diff);

    const drawProb = Math.max(8, Math.round((0.22 - absDiff * 0.006) * 100));
    const remaining = 100 - drawProb;
    const winProb = Math.min(80, Math.max(8, Math.round(remaining * (0.5 + diff * 0.025))));
    const lossProb = Math.max(8, 100 - drawProb - winProb);

    const probs = { win: winProb, draw: drawProb, loss: lossProb };

    res.json({
      finished: false,
      halfTime: false,
      next: nextMatch,
      yourStrength,
      opponentStrength,
      probs,
      playedCount,
      totalMatches,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel calcolo" });
  }
});

router.post("/:sessionId/play-single", async (req, res) => {
  try {
    const { opponent, homeGame, result, matchday } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true },
    });

    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

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

    await prisma.match.updateMany({
      where: {
        sessionId: session.id,
        opponent,
        homeGame,
        played: false,
        matchday,
      },
      data: { goalsFor, goalsAgainst, played: true },
    });

    res.json({ goalsFor, goalsAgainst, opponent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella partita" });
  }
});

router.post("/:sessionId/finish", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true, matches: true },
    });

    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    const leagueTeams = leagues[session.league].teams;
    const leagueData = leagues[session.league];
    const playedMatches = session.matches.filter(m => m.played);

    const calendarData = session.calendarData ? JSON.parse(session.calendarData) : {};
    const simulatedRounds = calendarData.simulatedRounds || [];

    const standings = calculateStandingsFromCalendar(
      playedMatches,
      "La Tua Squadra",
      leagueTeams,
      simulatedRounds,
      999
    );

    const position = standings.findIndex((s) => s.name === "La Tua Squadra") + 1;
    const avgRating = session.players.length > 0
  ? Math.round(session.players.reduce((s, p) => s + p.rating, 0) / session.players.length)
  : 80;

    const finalScore = calculateFinalScore(
      position,
      standings.length,
      session.budget,
      leagueData.multiplier,
      avgRating
    );

    if (!session.finished) {
      await prisma.session.update({
        where: { id: session.id },
        data: {
          finalScore,
          finished: true,
          position,        // ← questo deve esserci
          standings: JSON.stringify(standings),
        },
      });

      await prisma.leaderboardEntry.create({
        data: {
          nickname: session.nickname,
          score: finalScore,
          league: session.league,
          budget: session.budget,
          position,
        },
      });
    }

    const label = getPositionLabel(position);
    res.json({ position, finalScore, label, standings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel calcolo del risultato finale" });
  }
});

router.get("/:sessionId/standings/:matchday", async (req, res) => {
  try {
    const { sessionId, matchday } = req.params;
    const upTo = parseInt(matchday);

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { matches: true },
    });

    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    const leagueTeams = leagues[session.league].teams;
    const playedMatches = session.matches.filter(m => m.played && m.matchday <= upTo);
    const calendarData = session.calendarData ? JSON.parse(session.calendarData) : {};
    const simulatedRounds = calendarData.simulatedRounds || [];

    const standings = calculateStandingsFromCalendar(
      playedMatches,
      "La Tua Squadra",
      leagueTeams,
      simulatedRounds,
      upTo
    );

    res.json({ standings, matchday: upTo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel calcolo classifica" });
  }
});

router.post("/:sessionId/generate-first-leg", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true, matches: true },
    });

    if (!session) return res.status(404).json({ error: "Sessione non trovata" });
    if (session.matches.length > 0) return res.status(400).json({ error: "Stagione già generata" });

    const formation = formations.find((f) => f.id === session.formation);
    const totalSlots = Object.values(formation?.slots || {}).reduce((a, b) => a + b, 0);
    if (session.players.length < totalSlots) {
      return res.status(400).json({ error: "Rosa incompleta" });
    }

    const leagueTeams = leagues[session.league].teams;
    const { yourMatches, simulatedRounds } = simulateSeason(session.players, leagueTeams);

    // Salva tutto in calendarData incluso il ritorno pre-simulato
    const firstLeg = yourMatches
      .filter(m => m.matchday <= leagueTeams.length)
      .map(m => ({ ...m, played: true }));
    const secondLeg = yourMatches.filter(m => m.matchday > leagueTeams.length);

    
    await prisma.session.update({
      where: { id: session.id },
      data: {
        calendarData: JSON.stringify({ simulatedRounds, secondLeg }),
      },
    });

    // Salva solo le partite dell'andata
    await prisma.match.createMany({
      data: firstLeg.map((m) => ({
        opponent: m.opponent,
        homeGame: m.homeGame,
        goalsFor: m.goalsFor,
        goalsAgainst: m.goalsAgainst,
        narrative: JSON.stringify(m.events),
        played: true,
        matchday: m.matchday,
        sessionId: session.id,
      })),
    });

    // Calcola classifica metà stagione
    const standings = calculateStandingsFromCalendar(
      firstLeg,
      "La Tua Squadra",
      leagueTeams,
      simulatedRounds,
      leagueTeams.length
    );

    console.log("First leg matches:", firstLeg.length)
    console.log("Your stats:", firstLeg.reduce((s, m) => ({
      pts: s.pts + (m.goalsFor > m.goalsAgainst ? 3 : m.goalsFor === m.goalsAgainst ? 1 : 0),
      gf: s.gf + m.goalsFor,
      ga: s.ga + m.goalsAgainst
    }), { pts: 0, gf: 0, ga: 0 }))
    console.log("Standings your team:", standings.find(s => s.name === 'La Tua Squadra'))

    res.json({ standings, totalMatches: yourMatches.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella generazione" });
  }
});

router.post("/:sessionId/generate-second-leg", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true, matches: true },
    });

    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    const leagueTeams = leagues[session.league].teams;

    // Idempotency guard: return early if second leg already exists
    const existingSecondLeg = session.matches.filter(m => m.matchday > leagueTeams.length);
    if (existingSecondLeg.length > 0) {
      return res.json({ message: "Ritorno già simulato", totalMatches: existingSecondLeg.length });
    }

    const calendarData = JSON.parse(session.calendarData);
    const simulatedRounds = calendarData.simulatedRounds || [];

    // Prendi le partite dell'andata già salvate per replicarle specularmente
    const firstLegMatches = session.matches
      .filter(m => m.matchday <= leagueTeams.length)
      .sort((a, b) => a.matchday - b.matchday);

    // Rigenera il ritorno con i giocatori aggiornati
    // mantenendo gli stessi avversari dell'andata ma invertendo casa/trasferta
    const yourStrength = session.players.length > 0
      ? session.players.reduce((s, p) => s + p.rating, 0) / session.players.length
      : 60;

    const newSecondLeg = firstLegMatches.map((m, i) => {
      const homeGame = !m.homeGame; // inverti casa/trasferta
      const team = leagueTeams.find(t => t.name === m.opponent);
      const opponentStrength = homeGame
        ? team?.strength || 70
        : (team?.strength || 70) + 3;
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
        homeGame,
        goalsFor,
        goalsAgainst,
        matchday: leagueTeams.length + i + 1, // matchday 21-40
      };
    });

    // Aggiorna calendarData
    await prisma.session.update({
      where: { id: session.id },
      data: { calendarData: JSON.stringify({ simulatedRounds }) },
    });

    await prisma.match.createMany({
      data: newSecondLeg.map((m) => ({
        opponent: m.opponent,
        homeGame: m.homeGame,
        goalsFor: m.goalsFor,
        goalsAgainst: m.goalsAgainst,
        narrative: JSON.stringify([]),
        played: true,
        matchday: m.matchday,
        sessionId: session.id,
      })),
    });

    res.json({ message: "Ritorno simulato", totalMatches: newSecondLeg.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella simulazione del ritorno" });
  }
});

router.get("/:sessionId", async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { sessionId: req.params.sessionId },
      orderBy: { matchday: "asc" },
    });
    res.json({ matches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero delle partite" });
  }
});

module.exports = router;