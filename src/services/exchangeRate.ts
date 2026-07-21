export interface ExchangeRate {
  rate: number
  updatedAt: string
}

export async function getUsdToDopRate(): Promise<ExchangeRate | null> {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) return null
    const data = await res.json()
    const rate = data?.rates?.DOP
    if (typeof rate !== 'number') return null
    return { rate, updatedAt: data.time_last_update_utc ?? '' }
  } catch {
    return null
  }
}
