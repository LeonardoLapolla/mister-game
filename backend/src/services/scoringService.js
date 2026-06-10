function calculateStrengthMultiplier(avgRating) {
  if (avgRating < 75) return 1.5
  if (avgRating < 80) return 1.3
  if (avgRating < 85) return 1.1
  return 1.0
}

function calculateFinalScore(position, totalTeams, budget, leagueMultiplier, avgRating) {
  const positionScore = Math.round(
    ((totalTeams - position) / (totalTeams - 1)) * 1000
  );

  const budgetMultipliers = {
    30: 2.0,
    50: 1.5,
    80: 1.2,
    100: 1.0,
  }
  const budgetMultiplier = budgetMultipliers[budget] || 1.0;

  let positionBonus = 0;
  if (position === 1) positionBonus = 500;
  else if (position === 2) positionBonus = 300;
  else if (position === 3) positionBonus = 150;
  else if (position <= 6) positionBonus = 75;
  else if (position <= 10) positionBonus = 25;

  const strengthMultiplier = calculateStrengthMultiplier(avgRating || 80);

  const rawScore = (positionScore + positionBonus) * budgetMultiplier * leagueMultiplier * strengthMultiplier;
  return Math.round(rawScore);
}

const ZONE_MAP = {
  PL: { champions: [1,2,3,4,5,6], europa: [7,8], conference: [9], relegMin: 18 },
  SA: { champions: [1,2,3,4], europa: [5,6], conference: [7], relegMin: 18 },
  BL: { champions: [1,2,3,4], europa: [5,6], conference: [7], relegMin: 16 },
  LL: { champions: [1,2,3,4], europa: [5,6], conference: [7], relegMin: 18 },
  L1: { champions: [1,2,3], europa: [4,5,6], conference: [7], relegMin: 18 },
}

function getPositionLabel(position, league) {
  if (position === 1) return "🏆 Champion!";
  if (position === 2) return "🥈 Runner-up";
  if (position === 3) return "🥉 3rd Place";

  const z = ZONE_MAP[league] || ZONE_MAP.SA;
  if (z.champions.includes(position)) return "⭐ Champions League";
  if (z.europa.includes(position))    return "🟠 Europa League";
  if (z.conference.includes(position)) return "🟢 Conference League";
  if (position >= z.relegMin)         return "💀 Relegated";
  if (position >= z.relegMin - 2)     return "😰 Barely survived";
  if (position >= z.relegMin - 6)     return "😅 Safe";
  return "👍 Mid-table";
}

module.exports = { calculateFinalScore, getPositionLabel, calculateStrengthMultiplier };