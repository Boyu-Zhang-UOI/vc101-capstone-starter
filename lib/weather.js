// lib/weather.js: gets the weather from Open-Meteo, a free public weather API that needs
// no key (https://open-meteo.com). Used by api/weather.js. Server-side code.
//
// The pattern works for any public API:
//   1. check the input before calling anyone (parseLocation),
//   2. call the API with a time limit (getWeather),
//   3. send the browser only the few fields it needs, in a shape you chose (simplify).
// Then if the API changes, or you switch to another one, only this file changes.
//
// Credit the data source on your page: "Weather data by Open-Meteo.com" (CC BY 4.0).
// Open-Meteo's free API is for non-commercial use; read its terms before you rely on it.

const API_URL = 'https://api.open-meteo.com/v1/forecast';
const TIMEOUT_MS = 10_000; // give up if the weather service takes longer than 10 seconds

/** An error with a friendly message and the HTTP status our route should send back. */
export class WeatherError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'WeatherError';
    this.status = status;
  }
}

/**
 * Read and check ?lat=…&lon=…&units=… from the request's address.
 * Returns { ok: true, latitude, longitude, units } or { ok: false, error }.
 * Coordinates are rounded to 2 decimal places (about 1 km), which is plenty for weather
 * and shares less about exactly where your user is.
 * @param {URLSearchParams} params
 */
export function parseLocation(params) {
  const latText = (params.get('lat') ?? '').trim();
  const lonText = (params.get('lon') ?? '').trim();
  const units = (params.get('units') ?? 'metric').trim().toLowerCase();
  const number = /^-?\d{1,3}(\.\d+)?$/;
  if (!number.test(latText) || !number.test(lonText)) {
    return { ok: false, error: 'Add a location as numbers, for example /api/weather?lat=46.73&lon=-117.00' };
  }
  const latitude = Number(latText);
  const longitude = Number(lonText);
  if (latitude < -90 || latitude > 90) return { ok: false, error: 'lat must be between -90 and 90.' };
  if (longitude < -180 || longitude > 180) return { ok: false, error: 'lon must be between -180 and 180.' };
  if (units !== 'metric' && units !== 'imperial') return { ok: false, error: 'units must be "metric" or "imperial".' };
  const round = (n) => Math.round(n * 100) / 100;
  return { ok: true, latitude: round(latitude), longitude: round(longitude), units };
}

/** The address we call. Exported so the tests can check it. */
export function buildUrl({ latitude, longitude, units }) {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,wind_speed_10m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min',
    forecast_days: '7',
    timezone: 'auto',
  });
  if (units === 'imperial') {
    query.set('temperature_unit', 'fahrenheit');
    query.set('wind_speed_unit', 'mph');
  }
  return `${API_URL}?${query}`;
}

/** Ask Open-Meteo for the weather. Throws a WeatherError with a friendly message on failure. */
export async function getWeather(location, { fetchFn = globalThis.fetch } = {}) {
  let response;
  try {
    response = await fetchFn(buildUrl(location), { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (err) {
    if (err?.name === 'TimeoutError') throw new WeatherError('The weather service took too long to answer. Please try again.', 504);
    throw new WeatherError('The server could not reach the weather service. Please try again in a minute.', 502);
  }
  if (response.status === 429) {
    throw new WeatherError('The weather service is busy (too many requests). Please try again later.', 503);
  }
  if (!response.ok) {
    throw new WeatherError(`The weather service could not answer (status ${response.status}). Please try again later.`, 502);
  }
  const data = await response.json().catch(() => null);
  const simple = simplify(data, location.units);
  if (!simple) throw new WeatherError('The weather service sent back something unexpected. Please try again later.', 502);
  return simple;
}

/** Keep only what the page needs. Returns null if the data doesn't have the expected shape. */
export function simplify(data, units = 'metric') {
  const current = data?.current;
  const daily = data?.daily;
  if (typeof current?.temperature_2m !== 'number' || !Array.isArray(daily?.time)) return null;
  return {
    time: String(current.time ?? ''),
    temperature: current.temperature_2m,
    windSpeed: current.wind_speed_10m ?? null,
    description: describeWeatherCode(current.weather_code),
    units: units === 'imperial' ? { temperature: '°F', windSpeed: 'mph' } : { temperature: '°C', windSpeed: 'km/h' },
    days: daily.time.map((date, i) => ({
      date: String(date),
      max: daily.temperature_2m_max?.[i] ?? null,
      min: daily.temperature_2m_min?.[i] ?? null,
    })),
    source: 'Weather data by Open-Meteo.com (CC BY 4.0)',
  };
}

/** Open-Meteo reports the sky as a WMO weather code number. Turn it into words. */
export function describeWeatherCode(code) {
  if (code === 0) return 'Clear sky';
  if (code >= 1 && code <= 3) return 'Partly cloudy';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Unknown';
}
