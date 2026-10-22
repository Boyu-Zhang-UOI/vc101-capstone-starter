// api/weather.js: the server route behind GET /api/weather?lat=46.73&lon=-117.00
//
// An example of feature type (d), data from an external public API. It asks Open-Meteo
// (no key needed) for the current weather and a 7-day forecast, and returns a small JSON
// object your page can show or chart. Try it: run `npm run dev` and open
//   http://localhost:3000/api/weather?lat=46.73&lon=-117.00&units=imperial
//
// Open-Meteo would also answer the browser directly. Going through your own route lets you
// check the input, keep the reply small, cache it, and switch APIs (or add a key) later
// without changing the page. Not using it? Delete this file, lib/weather.js and
// tests/weather.test.js.

import { WeatherError, getWeather, parseLocation } from '../lib/weather.js';

export default {
  async fetch(request) {
    if (request.method !== 'GET') {
      return json({ error: 'Use GET, for example /api/weather?lat=46.73&lon=-117.00' }, 405, { Allow: 'GET' });
    }

    // 1. Check the input before calling anyone.
    const location = parseLocation(new URL(request.url).searchParams);
    if (!location.ok) {
      return json({ error: location.error }, 400);
    }

    // 2. Call the API and send back only what the page needs.
    try {
      const weather = await getWeather(location);
      // Let Vercel's servers reuse this answer for 10 minutes, so repeat visits don't
      // call Open-Meteo again. The weather doesn't change that fast.
      return json(weather, 200, { 'Cache-Control': 'public, max-age=0, s-maxage=600' });
    } catch (err) {
      if (err instanceof WeatherError) {
        console.error(`[api/weather] ${err.message}`);
        return json({ error: err.message }, err.status);
      }
      console.error('[api/weather] Unexpected error:', err?.message);
      return json({ error: 'Something went wrong on the server. Please try again.' }, 500);
    }
  },
};

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
  });
}
