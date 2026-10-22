// public/config.example.js: the settings your front end needs to reach Supabase.
//
// To use it, copy it to public/config.js and put in your own values:
//
//   cp public/config.example.js public/config.js
//
// Find both values in the Supabase dashboard: click "Connect" at the top, or go to
// Settings -> API Keys. Copy the Project URL and the PUBLISHABLE key (sb_publishable_...).
//
// Not every key is a secret. These two values are PUBLIC BY DESIGN: every visitor's browser
// downloads this file, so anyone can read them. That is safe ONLY because row-level security
// (RLS) is on for every table, with policies that say who may read and write each row
// (see supabase/policies.sql).
//
// Commit public/config.js. The live site needs it: there is no build step, so Vercel serves
// the files in your repository exactly as they are.
//
// NEVER put a secret key here: not sb_secret_..., and not the legacy service_role key.
// Those skip every RLS rule. `npm run check:secrets` fails if one appears anywhere.

export const SUPABASE_URL = 'https://your-project-ref.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_paste-your-key-here';
