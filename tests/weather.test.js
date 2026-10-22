// Tests for the external-API example: lib/weather.js and the route in api/weather.js.
// The real weather service is never called: we replace fetch with a fake that returns
// whatever each test needs, so the tests work offline and always give the same result.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import route from '../api/weather.js';
import { describeWeatherCode, parseLocation, simplify } from '../lib/weather.js';

// A shortened copy of a real Open-Meteo reply.
const SAMPLE = {
  current: { time: '2026-10-21T22:00', temperature_2m: 47.8, wind_speed_10m: 6.7, weather_code: 0 },
  daily: {
    time: ['2026-10-21', '2026-10-22'],
    temperature_2m_max: [67.2, 67.4],
    temperature_2m_min: [38.4, 47.7],
  },
};

const get = (query) => route.fetch(new Request(`http://localhost/api/weather${query}`));

function stubFetch(t, status, body) {
  return t.mock.method(globalThis, 'fetch', async () =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  );
}

test('parseLocation accepts good coordinates and rounds them to 2 decimals', () => {
  const result = parseLocation(new URLSearchParams('lat=46.73291&lon=-117.0001&units=imperial'));
  assert.deepEqual(result, { ok: true, latitude: 46.73, longitude: -117, units: 'imperial' });
});

test('parseLocation refuses missing, non-numeric and out-of-range input', () => {
  for (const query of ['', 'lat=46', 'lat=abc&lon=1', 'lat=1e3&lon=1', 'lat=91&lon=0', 'lat=0&lon=-181', 'lat=1&lon=1&units=kelvin']) {
    const result = parseLocation(new URLSearchParams(query));
    assert.equal(result.ok, false, query);
    assert.ok(result.error.length > 0);
  }
});

test('simplify keeps only what the page needs', () => {
  const weather = simplify(SAMPLE, 'imperial');
  assert.equal(weather.temperature, 47.8);
  assert.equal(weather.description, 'Clear sky');
  assert.deepEqual(weather.units, { temperature: '°F', windSpeed: 'mph' });
  assert.deepEqual(weather.days[1], { date: '2026-10-22', max: 67.4, min: 47.7 });
  assert.equal(simplify({ unexpected: true }), null);
});

test('describeWeatherCode turns codes into words', () => {
  assert.equal(describeWeatherCode(63), 'Rain');
  assert.equal(describeWeatherCode(95), 'Thunderstorm');
  assert.equal(describeWeatherCode(1234), 'Unknown');
});

test('GET with a good location returns the simplified weather', async (t) => {
  const fetchMock = stubFetch(t, 200, SAMPLE);
  const response = await get('?lat=46.73&lon=-117.00&units=imperial');
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.temperature, 47.8);
  assert.equal(body.days.length, 2);
  const calledUrl = new URL(fetchMock.mock.calls[0].arguments[0]);
  assert.equal(calledUrl.hostname, 'api.open-meteo.com');
  assert.equal(calledUrl.searchParams.get('latitude'), '46.73');
  assert.equal(calledUrl.searchParams.get('temperature_unit'), 'fahrenheit');
});

test('bad input gets a 400 and the weather service is never called', async (t) => {
  const fetchMock = stubFetch(t, 200, SAMPLE);
  const response = await get('?lat=200&lon=0');
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /between -90 and 90/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('POST is not allowed (405)', async () => {
  const response = await route.fetch(new Request('http://localhost/api/weather?lat=1&lon=1', { method: 'POST' }));
  assert.equal(response.status, 405);
});

test('problems at the weather service become friendly errors', async (t) => {
  t.mock.method(console, 'error', () => {});
  const cases = [
    [500, { error: true }, 502],
    [429, { error: true }, 503],
    [200, 'not json', 502],
    [200, { unexpected: true }, 502],
  ];
  for (const [status, body, expected] of cases) {
    stubFetch(t, status, body);
    const response = await get('?lat=46.73&lon=-117');
    assert.equal(response.status, expected, `service answered ${status}`);
    assert.ok((await response.json()).error);
    globalThis.fetch.mock.restore();
  }
});

test('a network failure or a timeout gives a friendly error', async (t) => {
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('fetch failed'); });
  assert.equal((await get('?lat=1&lon=1')).status, 502);
  globalThis.fetch.mock.restore();
  t.mock.method(globalThis, 'fetch', async () => { throw new DOMException('timed out', 'TimeoutError'); });
  assert.equal((await get('?lat=1&lon=1')).status, 504);
});
