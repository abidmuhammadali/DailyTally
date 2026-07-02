export function forecastProfit(recentMonths: number[], monthsAhead: number): number[] {
  if (recentMonths.length < 2) {
    return []
  }

  const changes: number[] = []
  for (let i = 1; i < recentMonths.length; i++) {
    changes.push(recentMonths[i] - recentMonths[i - 1])
  }

  // Calculate a weighted average where later changes (recent metrics) get significantly higher importance
  let totalWeight = 0
  let weightedSum = 0

  for (let i = 0; i < changes.length; i++) {
    const weight = i + 1 // The closer to the present day, the higher the weight index value
    weightedSum += changes[i] * weight
    totalWeight += weight
  }

  const averageChange = weightedSum / totalWeight

  const forecast: number[] = []
  let lastValue = recentMonths[recentMonths.length - 1]

  for (let i = 0; i < monthsAhead; i++) {
    lastValue = lastValue + averageChange
    forecast.push(lastValue)
  }

  return forecast
}