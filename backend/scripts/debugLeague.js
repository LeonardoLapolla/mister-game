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
  // Controlliamo La Liga
  const data = await apiRequest("/players?league=61&season=2024&page=1");
  console.log("Totale risposte:", data.response?.length);
  console.log("Paging:", data.paging);
  
  // Stampa il primo giocatore raw per vedere la struttura
  if (data.response?.length > 0) {
    const first = data.response[0];
    console.log("\nPrimo giocatore:");
    console.log("Nome:", first.player.name);
    console.log("Stats:", JSON.stringify(first.statistics[0]?.games, null, 2));
  }
  for (let i = 0; i < data.response.length; i++) {
    const item = data.response[i];
    const stats = item.statistics[0];
    const pos = stats?.games?.position;
    console.log(`${item.player.name} — posizione raw: "${pos}"`);
  }
}

main().catch(console.error);