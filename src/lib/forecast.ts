export function forecastProfit(recentMonths: number[], monthsAhead: number): number[] {
  if (recentMonths.length < 2) {
    return []
  }

  const changes: number[] = []
  for (let i = 1; i < recentMonths.length; i++) {
    changes.push(recentMonths[i] - recentMonths[i - 1])
  }

  const averageChange = changes.reduce((sum, c) => sum + c, 0) / changes.length

  const forecast: number[] = []
  let lastValue = recentMonths[recentMonths.length - 1]

  for (let i = 0; i < monthsAhead; i++) {
    lastValue = lastValue + averageChange
    forecast.push(lastValue)
  }

  return forecast
}