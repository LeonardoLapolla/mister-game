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

function getPositionLabel(position) {
  if (position === 1) return "🏆 Campione!";
  if (position === 2) return "🥈 Vicecampione";
  if (position === 3) return "🥉 Terzo posto";
  if (position <= 6) return "⭐ Qualificato in Europa";
  if (position <= 10) return "👍 Metà classifica";
  if (position <= 15) return "😅 Salvezza tranquilla";
  if (position <= 17) return "😰 Salvezza sofferta";
  return "💀 Retrocesso";
}

module.exports = { calculateFinalScore, getPositionLabel, calculateStrengthMultiplier };