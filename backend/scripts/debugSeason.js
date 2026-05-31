require("dotenv").config();
const https = require("https");

function apiRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "v3.football.api-sports.io",
      path,
      method: "GET",
      headers: { "x-apisports-key": process.env.API_KEY },
    };
    https.get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(JSON.parse(data)));
    }).on("error", reject);
  });
}

async function main() {
  // Prova stagione 2025 per Premier League
  const data = await apiRequest("/players?league=39&season=2025&page=1");
  console.log("Stagione 2025 - Premier League");
  console.log("Totale risposte:", data.response?.length);
  console.log("Paging:", data.paging);
  console.log("Errors:", data.errors);

  if (data.response?.length > 0) {
    const first = data.response[0];
    console.log("\nPrimo giocatore:", first.player.name);
    console.log("Rating:", first.statistics[0]?.games?.rating);
    console.log("Position:", first.statistics[0]?.games?.position);
  }
}

main().catch(console.error);