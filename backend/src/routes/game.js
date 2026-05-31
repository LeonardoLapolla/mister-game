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

    const validBudgets = [30, 50, 100];
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

// Dati statici campionati e formazioni
router.get("/data/setup", (req, res) => {
  res.json({ leagues, formations });
});

module.exports = router;