require("dotenv").config();
const https = require("https");
const fs = require("fs");

const API_KEY = process.env.API_KEY;

const LEAGUES = {
  PL: 39,
  SA: 135,
  BL: 78,
  LL: 140,
  L1: 61,
};

const SEASON = 2024;

function apiRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "v3.football.api-sports.io",
      path,
      method: "GET",
      headers: {
        "x-apisports-key": API_KEY,
      },
    };

    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPlayersForLeague(leagueCode, leagueId) {
  console.log(`\nFetch giocatori per ${leagueCode}...`);
  const players = [];

  for (let page = 1; page <= 5; page++) {
    console.log(`  Pagina ${page}...`);
    const data = await apiRequest(
      `/players?league=${leagueId}&season=${SEASON}&page=${page}`
    );

    if (!data.response) break;

    for (let i = 0; i < data.response.length; i++) {
      const item = data.response[i];
      const p = item.player;
      const stats = item.statistics[0];
      if (!stats) continue;
      if (!stats.games) continue;

      const position = mapPosition(stats.games.position);
      if (!position) continue;

      const baseRating = Math.max(50, 82 - (page - 1) * 4 - Math.floor(i / 5) * 2);
      const rating = stats.games.rating
        ? Math.round(parseFloat(stats.games.rating) * 10)
        : baseRating;

      const cost = estimateCost(rating);

      players.push({
        name: p.name,
        position,
        rating: Math.min(99, Math.max(50, rating)),
        cost,
      });
    }

    await sleep(500);
  }

  return players;
}

function mapPosition(pos) {
  if (!pos) return null;
  if (pos === "Goalkeeper") return "GK";
  if (pos === "Defender") return "DEF";
  if (pos === "Midfielder") return "MID";
  if (pos === "Attacker") return "ATT";
  if (pos === "Forward") return "ATT";
  return null;
}

function estimateCost(rating) {
  if (rating >= 88) return Math.floor(Math.random() * 15 + 20);
  if (rating >= 83) return Math.floor(Math.random() * 10 + 10);
  if (rating >= 78) return Math.floor(Math.random() * 5 + 5);
  if (rating >= 73) return Math.floor(Math.random() * 4 + 2);
  return Math.floor(Math.random() * 2 + 1);
}

async function main() {
  const result = {};

  for (const [code, id] of Object.entries(LEAGUES)) {
    result[code] = await fetchPlayersForLeague(code, id);
    console.log(`✅ ${code}: ${result[code].length} giocatori`);
    await sleep(1000);
  }

  fs.writeFileSync(
    "./src/data/players.json",
    JSON.stringify(result, null, 2)
  );

  console.log("\n✅ players.json salvato in src/data/players.json");
}

main().catch(console.error);