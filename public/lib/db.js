// public/lib/db.js: connects the browser to your Supabase database.
//
// Use it from public/app.js:
//
//   import { getDb } from './lib/db.js';
//   const db = await getDb();
//   const { data, error } = await db.from('messages').select('id, name, message');
//
// It reads your Project URL and publishable key from public/config.js (copy
// public/config.example.js to make it), checks that the key is NOT a secret key, and
// loads the official Supabase library (supabase-js) from the jsDelivr CDN, a public
// server that hosts open-source code, so there is nothing to install.
//
// The publishable key only lets the browser ASK. Row-level security decides what the
// database allows: see supabase/policies.sql. Unlike the other files in public/lib/, this
// one talks to the network, so only checkSupabaseConfig() is tested in Node.

const SUPABASE_LIBRARY = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/+esm';

/** Read the middle part of a JWT (the legacy Supabase keys are JWTs). Returns an object or null. */
function jwtPayload(key) {
  const part = String(key).split('.')[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)));
  } catch {
    return null;
  }
}

/**
 * Check the settings from public/config.js.
 * Returns '' if they look right, or a friendly message saying what to fix.
 * @param {{ SUPABASE_URL?: string, SUPABASE_PUBLISHABLE_KEY?: string } | null} config
 */
export function checkSupabaseConfig(config) {
  const setup = 'Copy public/config.example.js to public/config.js and fill in your Project URL and publishable key.';
  if (!config) return `Supabase is not set up yet. ${setup}`;
  const url = String(config.SUPABASE_URL ?? '').trim();
  const key = String(config.SUPABASE_PUBLISHABLE_KEY ?? '').trim();

  if (!url || url.includes('your-project-ref')) return `The Supabase Project URL is missing. ${setup}`;
  if (/supabase\.com\/dashboard/.test(url)) {
    return 'SUPABASE_URL is the address of the dashboard, not of your project. Use the Project URL, like https://abcdefgh.supabase.co';
  }
  if (!/^https:\/\/[^/\s]+$/.test(url.replace(/\/$/, ''))) {
    return 'SUPABASE_URL should look like https://abcdefgh.supabase.co (no extra path after it).';
  }

  const role = key.startsWith('eyJ') ? jwtPayload(key)?.role : '';
  if (key.startsWith('sb_secret_') || role === 'service_role') {
    return 'STOP: that is a SECRET key. It skips every security rule and must never be in public/. ' +
      'Delete it from config.js, revoke it in the Supabase dashboard (Settings -> API Keys), and use the publishable key instead.';
  }
  if (!key || key.includes('paste-')) return `The publishable key is missing. ${setup}`;
  if (!key.startsWith('sb_publishable_') && role !== 'anon') {
    return 'SUPABASE_PUBLISHABLE_KEY should start with sb_publishable_. Copy the publishable key from Settings -> API Keys.';
  }
  return '';
}

let dbPromise = null;

/**
 * Get the Supabase client, creating it the first time.
 * Throws an Error with a friendly message if the settings are missing or unsafe.
 */
export function getDb() {
  dbPromise ??= (async () => {
    const config = await import('../config.js').catch(() => null);
    const problem = checkSupabaseConfig(config);
    if (problem) throw new Error(problem);
    if (config.SUPABASE_PUBLISHABLE_KEY.startsWith('eyJ')) {
      console.warn('You are using a legacy "anon" key. Supabase is retiring these: switch to the publishable key (sb_publishable_...).');
    }
    const { createClient } = await import(SUPABASE_LIBRARY);
    return createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY);
  })();
  dbPromise.catch(() => {
    dbPromise = null; // let the next call try again, for example after you fix config.js
  });
  return dbPromise;
}
