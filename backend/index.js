require("dotenv").config();
const express = require("express");
const cors = require("cors");

const gameRoutes = require("./src/routes/game");
const marketRoutes = require("./src/routes/market");
const matchRoutes = require("./src/routes/match");
const leaderboardRoutes = require("./src/routes/leaderboard");
const europaRouter = require('./src/routes/europa')

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/api/game", gameRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use('/api/europa', europaRouter)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server avviato su http://localhost:${PORT}`);
});