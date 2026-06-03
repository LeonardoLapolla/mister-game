const express = require("express");
const router = express.Router();
const { leagues, formations } = require("../data/leagues");
const prisma = require("../prismaClient");

// Crea nuova sessione di gioco
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

// Recupera sessione esistente
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

// Salva storia stagione e prepara nuova stagione
router.post("/:id/next-season", async (req, res) => {
  try {
    const { position, points, wins, draws, losses, goalsFor, goalsAgainst } = req.body

    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: { matches: true },
    })

    if (!session) return res.status(404).json({ error: "Sessione non trovata" })

    const totalTeams = leagues[session.league].teams.length
    const isRelegated = position > totalTeams - 3

    if (isRelegated) {
      return res.json({ relegated: true })
    }

    if (session.seasonNumber >= 5) {
      return res.json({ maxSeasons: true })
    }

    // Salva storia stagione corrente
    await prisma.seasonHistory.create({
      data: {
        sessionId: session.id,
        seasonNumber: session.seasonNumber,
        position,
        points,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
      }
    })

    // Cancella le partite della stagione precedente
    await prisma.match.deleteMany({
      where: { sessionId: session.id }
    })

    // Aggiorna sessione per nuova stagione
    await prisma.session.update({
      where: { id: session.id },
      data: {
        seasonNumber: session.seasonNumber + 1,
        finished: false,
        finalScore: null,
        calendarData: null,
        budgetSpent: 0,
      }
    })

    res.json({ success: true, newSeason: session.seasonNumber + 1 })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Errore nel passaggio di stagione" })
  }
})

// Recupera storia stagioni
router.get("/:id/history", async (req, res) => {
  try {
    const history = await prisma.seasonHistory.findMany({
      where: { sessionId: req.params.id },
      orderBy: { seasonNumber: 'asc' }
    })
    res.json({ history })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Errore nel recupero della storia" })
  }
})

// Dati statici campionati e formazioni
router.get("/data/setup", (req, res) => {
  res.json({ leagues, formations });
});

module.exports = router;