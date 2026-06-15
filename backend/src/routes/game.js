const express = require("express");
const router = express.Router();
const { leagues, formations } = require("../data/leagues");
const prisma = require("../prismaClient");

const MAX_SEASONS = 3;

router.post("/new", async (req, res) => {
  try {
    const { nickname, league, budget, formation } = req.body;

    if (!nickname || !league || !budget || !formation) {
      return res.status(400).json({ error: "Parametri mancanti" });
    }

    if (!leagues[league]) {
      return res.status(400).json({ error: "Campionato non valido" });
    }

    const validBudgets = [30, 50, 80, 100];
    if (!validBudgets.includes(Number(budget))) {
      return res.status(400).json({ error: "Budget non valido" });
    }

    const session = await prisma.session.create({
      data: {
        nickname,
        league,
        budget: Number(budget),
        formation,
        finished: false,
        budgetSpent: 0,
      },
    });

    res.json({ session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella creazione della sessione" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { players: true, matches: true },
    });

    if (!session) {
      return res.status(404).json({ error: "Sessione non trovata" });
    }

    res.json({ session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero della sessione" });
  }
});

router.post("/:id/next-season", async (req, res) => {
  try {
    const { position: bodyPosition, finalScore } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { matches: true },
    });

    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    const finalPosition = bodyPosition || session.position || 0;
    const totalTeams = leagues[session.league].teams.length + 1;
    const isRelegated = finalPosition > totalTeams - 3;

    // Idempotency guard: if history for this season already exists, return consistent response
    const existingHistory = await prisma.seasonHistory.findFirst({
      where: { sessionId: session.id, seasonNumber: session.seasonNumber }
    });

    if (existingHistory) {
      if (existingHistory.position > totalTeams - 3) return res.json({ relegated: true });
      if (existingHistory.seasonNumber >= MAX_SEASONS) return res.json({ maxSeasons: true });
      return res.json({ success: true, newSeason: existingHistory.seasonNumber + 1 });
    }

    // First time: compute stats and write history
    const played = session.matches.filter(m => m.played);
    const wins = played.filter(m => m.goalsFor > m.goalsAgainst).length;
    const draws = played.filter(m => m.goalsFor === m.goalsAgainst).length;
    const losses = played.filter(m => m.goalsFor < m.goalsAgainst).length;
    const points = wins * 3 + draws;
    const goalsFor = played.reduce((s, m) => s + m.goalsFor, 0);
    const goalsAgainst = played.reduce((s, m) => s + m.goalsAgainst, 0);

    await prisma.seasonHistory.create({
      data: {
        sessionId: session.id,
        seasonNumber: session.seasonNumber,
        position: finalPosition,
        points,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        finalScore: finalScore || 0,
      }
    });

    if (isRelegated) return res.json({ relegated: true });
    if (session.seasonNumber >= MAX_SEASONS) return res.json({ maxSeasons: true });

    await prisma.match.deleteMany({ where: { sessionId: session.id } });

    await prisma.player.updateMany({
      where: { sessionId: session.id },
      data: { energy: 100 },
    });

    await prisma.session.update({
      where: { id: session.id },
      data: {
        seasonNumber: session.seasonNumber + 1,
        finished: false,
        finalScore: null,
        calendarData: null,
        budgetSpent: 0,
        europaData: null,
      }
    });

    res.json({ success: true, newSeason: session.seasonNumber + 1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel passaggio di stagione" });
  }
});

router.get("/:id/history", async (req, res) => {
  try {
    const history = await prisma.seasonHistory.findMany({
      where: { sessionId: req.params.id },
      orderBy: { seasonNumber: 'asc' }
    });
    res.json({ history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero della storia" });
  }
});

router.get("/data/setup", (req, res) => {
  res.json({ leagues, formations });
});

router.patch("/:id/formation", async (req, res) => {
  try {
    const { formation } = req.body;
    const valid = ['4-3-3', '4-4-2', '3-5-2', '5-3-2', '4-2-3-1'];
    if (!valid.includes(formation)) return res.status(400).json({ error: "Formazione non valida" });
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: { formation },
    });
    res.json({ session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore aggiornamento formazione" });
  }
});

router.patch("/:id/reset-energy", async (req, res) => {
  try {
    await prisma.player.updateMany({
      where: { sessionId: req.params.id },
      data: { energy: 100 },
    });
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { players: true },
    });
    res.json({ session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore reset energia" });
  }
});

router.patch("/:id/bench", async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "Payload non valido" });
    }
    await prisma.$transaction(
      updates.map(({ playerId, isBench }) =>
        prisma.player.update({ where: { id: playerId }, data: { isBench } })
      )
    );
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { players: true },
    });
    res.json({ session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore aggiornamento panchina" });
  }
});

module.exports = router;