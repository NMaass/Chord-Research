export function formatResearchPercentage(
  totalProgressions: number,
  possibleProgressions: number
): string {
  if (
    !Number.isFinite(totalProgressions) ||
    !Number.isFinite(possibleProgressions) ||
    possibleProgressions <= 0
  ) {
    return "0%";
  }

  const percentage = Math.min(
    100,
    Math.max(0, (totalProgressions / possibleProgressions) * 100)
  );

  if (percentage === 0 || percentage === 100) {
    return `${percentage}%`;
  }

  const fractionDigits = percentage < 0.01 ? 4 : 2;
  return `${percentage.toFixed(fractionDigits)}%`;
}
