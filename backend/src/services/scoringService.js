function calculateFinalScore(position, totalTeams, budget, leagueMultiplier) {
  // Punteggio base dalla posizione (da 0 a 1000)
  const positionScore = Math.round(
    ((totalTeams - position) / (totalTeams - 1)) * 1000
  );

  // Moltiplicatore budget (più basso il budget, più alto il moltiplicatore)
  const budgetMultipliers = {
    30: 2.0,
    50: 1.5,
    100: 1.0,
  };
  const budgetMultiplier = budgetMultipliers[budget] || 1.0;

  // Bonus posizione speciale
  let positionBonus = 0;
  if (position === 1) positionBonus = 500;
  else if (position === 2) positionBonus = 300;
  else if (position === 3) positionBonus = 150;
  else if (position <= 6) positionBonus = 75;
  else if (position <= 10) positionBonus = 25;

  // Calcolo finale
  const rawScore = (positionScore + positionBonus) * budgetMultiplier * leagueMultiplier;
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

module.exports = { calculateFinalScore, getPositionLabel };