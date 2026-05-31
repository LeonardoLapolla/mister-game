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

    // Salva calendario AI
    await prisma.session.update({
      where: { id: session.id },
      data: { calendarData: JSON.stringify(simulatedRounds) },
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
      data: { calendarData: JSON.stringify(simulatedRounds) },
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
      const simulatedRounds = session.calendarData
        ? JSON.parse(session.calendarData)
        : [];

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

    const drawProb = Math.max(10, Math.round((0.28 - absDiff * 0.008) * 100));
    const remaining = 100 - drawProb;
    const winProb = Math.min(75, Math.max(10, Math.round(remaining * (0.5 + diff * 0.015))));
    const lossProb = Math.max(10, 100 - drawProb - winProb);

    const probs = { win: winProb, draw: drawProb, loss: lossProb };

    res.json({
      finished: false,
      halfTime: false,
      next: nextMatch,
      yourStrength,
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

    const simulatedRounds = session.calendarData
      ? JSON.parse(session.calendarData)
      : [];

    const standings = calculateStandingsFromCalendar(
      playedMatches,
      "La Tua Squadra",
      leagueTeams,
      simulatedRounds,
      999
    );

    const position = standings.findIndex((s) => s.name === "La Tua Squadra") + 1;
    const finalScore = calculateFinalScore(
      position,
      standings.length,
      session.budget,
      leagueData.multiplier
    );

    if (!session.finished) {
      await prisma.session.update({
        where: { id: session.id },
        data: { finalScore, finished: true },
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
    const simulatedRounds = session.calendarData ? JSON.parse(session.calendarData) : [];

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