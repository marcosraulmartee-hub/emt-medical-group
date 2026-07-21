// Coordenadas de Santiago de los Caballeros, República Dominicana.
const CLINIC_LAT = 19.4517
const CLINIC_LON = -70.697

const WEATHER_CODE_LABEL: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Neblina',
  48: 'Neblina con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna moderada',
  55: 'Llovizna intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia moderada',
  65: 'Lluvia intensa',
  80: 'Chubascos ligeros',
  81: 'Chubascos moderados',
  82: 'Chubascos intensos',
  95: 'Tormenta eléctrica',
}

export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm' | 'fog'

function weatherKind(code: number): WeatherKind {
  if (code === 0 || code === 1) return 'clear'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 95) return 'storm'
  if (code >= 51) return 'rain'
  return 'cloudy'
}

export interface WeatherInfo {
  temperatureC: number
  description: string
  kind: WeatherKind
}

export async function getTodayWeather(): Promise<WeatherInfo | null> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${CLINIC_LAT}&longitude=${CLINIC_LON}&current=temperature_2m,weather_code&timezone=America/Santo_Domingo`,
    )
    if (!res.ok) return null
    const data = await res.json()
    const temperatureC = data?.current?.temperature_2m
    const code = data?.current?.weather_code
    if (typeof temperatureC !== 'number') return null
    return {
      temperatureC,
      description: WEATHER_CODE_LABEL[code] ?? 'Clima variable',
      kind: weatherKind(code),
    }
  } catch {
    return null
  }
}
