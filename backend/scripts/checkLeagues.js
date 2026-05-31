require("dotenv").config();
const https = require("https");

function apiRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "v3.football.api-sports.io",
      path,
      method: "GET",
      headers: {
        "x-apisports-key": process.env.API_KEY,
      },
    };

    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

async function main() {
  const data = await apiRequest("/leagues?season=2024&type=League");
  const TOP_LEAGUES = ["Premier League", "Serie A", "Bundesliga", "La Liga", "Ligue 1"];

  for (const item of data.response) {
    const name = item.league.name;
    const id = item.league.id;
    const country = item.country.name;
    if (TOP_LEAGUES.includes(name)) {
      console.log(`${country} — ${name}: ID ${id}`);
    }
  }
}

main().catch(console.error);