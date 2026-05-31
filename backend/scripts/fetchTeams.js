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
      headers: { "x-apisports-key": API_KEY },
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

async function main() {
  const result = {};

  for (const [code, id] of Object.entries(LEAGUES)) {
    console.log(`\nFetch squadre per ${code}...`);

    const teamsData = await apiRequest(`/teams?league=${id}&season=${SEASON}`);
    const teams = teamsData.response || [];
    result[code] = [];

    for (const item of teams) {
      const teamId = item.team.id;
      const teamName = item.team.name;
      console.log(`  Fetch rosa: ${teamName}...`);

      const squadData = await apiRequest(`/players/squads?team=${teamId}`);
      const players = squadData.response?.[0]?.players || [];

      const ratings = players
        .map(p => {
          const pos = mapPosition(p.position);
          return pos ? { name: p.name, position: pos, age: p.age } : null
        })
        .filter(Boolean);

      result[code].push({
        name: teamName,
        players: ratings,
      });

      await sleep(400);
    }

    console.log(`✅ ${code}: ${result[code].length} squadre`);
    await sleep(1000);
  }

  fs.writeFileSync("./src/data/teams.json", JSON.stringify(result, null, 2));
  console.log("\n✅ teams.json salvato!");
}

function mapPosition(pos) {
  if (!pos) return null;
  if (pos === "Goalkeeper") return "GK";
  if (pos === "Defender") return "DEF";
  if (pos === "Midfielder") return "MID";
  if (pos === "Attacker" || pos === "Forward") return "ATT";
  return null;
}

main().catch(console.error);