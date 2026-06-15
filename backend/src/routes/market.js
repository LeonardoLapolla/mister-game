const express = require("express");
const router = express.Router();
const { formations } = require("../data/leagues");
const playersData = require("../data/players.json");
const prisma = require("../prismaClient");

// Tutti i giocatori di tutti i campionati
router.get('/all-players', (req, res) => {
  try {
    res.json({ players: playersData })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Errore nel recupero dei giocatori' })
  }
})
// Restituisce i giocatori disponibili per una lega e un modulo
router.get("/:sessionId", async (req, res) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true },
    });

    if (!session) {
      return res.status(404).json({ error: "Sessione non trovata" });
    }

const leaguePlayers = playersData[session.league] || [];
const boughtIds = session.players.map((p) => p.name);
const budgetFilters = {
  100: (p) => p.rating >= 78,
  80: (p) => p.rating >= 76 && p.rating <= 86,
  50: (p) => p.rating >= 75 && p.rating <= 84,
  30: (p) => p.rating <= 78,
}
const maxRating = budgetFilters[session.budget] || (() => true)
const available = leaguePlayers
  .filter((p) => !boughtIds.includes(p.name))
  .filter((p) => maxRating(p))
    res.json({ players: available, session });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel recupero dei giocatori" });
  }
});

// Acquista un giocatore
router.post("/:sessionId/buy", async (req, res) => {
  try {
    const { playerName, isBench } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true },
    });

    if (!session) {
      return res.status(404).json({ error: "Sessione non trovata" });
    }

    // Cerca in tutti i campionati
    let player = null;
    for (const league of Object.values(playersData)) {
      player = league.find((p) => p.name === playerName);
      if (player) break;
    }

    if (!player) {
      return res.status(404).json({ error: "Giocatore non trovato" });
    }

    // Controlla se il giocatore è già stato acquistato
    const giaAcquistato = session.players.find((p) => p.name === playerName);
    if (giaAcquistato) {
      return res.status(400).json({ error: "Giocatore già acquistato" });
    }

    if (isBench) {
      // Slot panchina per posizione: 1 GK, 2 DEF, 2 MID, 2 ATT
      const BENCH_SLOTS = { GK: 1, DEF: 2, MID: 2, ATT: 2 };
      const benchForPos = session.players.filter(p => p.isBench && p.position === player.position).length;
      const maxBench = BENCH_SLOTS[player.position] ?? 1;
      if (benchForPos >= maxBench) {
        return res.status(400).json({ error: `Slot riserva ${player.position} pieni` });
      }
    } else {
      // Controlla i slot titolari per la posizione
      const formation = formations.find((f) => f.id === session.formation);
      const slotsPerPosition = formation.slots;
      const giocatoriPerPosizione = session.players.filter(
        (p) => p.position === player.position && !p.isBench
      ).length;

      if (giocatoriPerPosizione >= slotsPerPosition[player.position]) {
        return res.status(400).json({
          error: `Slot per ${player.position} già pieni`,
        });
      }
    }

    // Acquista il giocatore
    await prisma.player.create({
      data: {
        name: player.name,
        position: player.position,
        rating: player.rating,
        cost: player.cost,
        isBench: isBench || false,
        energy: 100,
        sessionId: session.id,
      },
    });

    await prisma.session.update({
      where: { id: session.id },
      data: { budgetSpent: session.budgetSpent + player.cost },
    });

    const updatedSession = await prisma.session.findUnique({
      where: { id: session.id },
      include: { players: true },
    });

    res.json({ session: updatedSession });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nell'acquisto del giocatore" });
  }
});

// Vendi un giocatore
router.post("/:sessionId/sell", async (req, res) => {
  try {
    const { playerName } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true },
    });

    if (!session) {
      return res.status(404).json({ error: "Sessione non trovata" });
    }

    const player = session.players.find((p) => p.name === playerName);
    if (!player) {
      return res.status(404).json({ error: "Giocatore non in rosa" });
    }

    await prisma.player.delete({ where: { id: player.id } });

    await prisma.session.update({
      where: { id: session.id },
      data: { budgetSpent: session.budgetSpent - player.cost },
    });

    const updatedSession = await prisma.session.findUnique({
      where: { id: session.id },
      include: { players: true },
    });

    res.json({ session: updatedSession });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nella vendita del giocatore" });
  }
});


// Acquisto iniziale in batch dalla ruota — 1 sola chiamata invece di N
router.post("/:sessionId/buy-batch", async (req, res) => {
  try {
    const { players: toBuy } = req.body;
    if (!Array.isArray(toBuy) || toBuy.length === 0) {
      return res.status(400).json({ error: "Payload non valido" });
    }

    const session = await prisma.session.findUnique({
      where: { id: req.params.sessionId },
      include: { players: true },
    });
    if (!session) return res.status(404).json({ error: "Sessione non trovata" });

    const existingNames = new Set(session.players.map(p => p.name));
    const toCreate = [];
    let totalCost = 0;

    for (const { playerName, isBench } of toBuy) {
      if (existingNames.has(playerName)) continue;
      let player = null;
      for (const league of Object.values(playersData)) {
        player = league.find(p => p.name === playerName);
        if (player) break;
      }
      if (!player) continue;
      toCreate.push({
        name: player.name,
        position: player.position,
        rating: player.rating,
        cost: player.cost,
        isBench: isBench || false,
        energy: 100,
        sessionId: session.id,
      });
      totalCost += player.cost;
    }

    if (toCreate.length > 0) {
      await prisma.player.createMany({ data: toCreate });
      await prisma.session.update({
        where: { id: session.id },
        data: { budgetSpent: session.budgetSpent + totalCost },
      });
    }

    res.json({ created: toCreate.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Errore nel salvataggio della rosa" });
  }
});

module.exports = router;