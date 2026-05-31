const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// Top 20 globale
router.get("/", async (req, res) => {
  try {
    const entries = await prisma.leaderboardEntry.findMany({
      orderBy: { score: "desc" },
      take: 20,
    });

    res.json({ entries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero della leaderboard" });
  }
});

// Top 20 per campionato
router.get("/:league", async (req, res) => {
  try {
    const entries = await prisma.leaderboardEntry.findMany({
      where: { league: req.params.league },
      orderBy: { score: "desc" },
      take: 20,
    });

    res.json({ entries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero della leaderboard" });
  }
});

module.exports = router;