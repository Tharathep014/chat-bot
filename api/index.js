// Vercel Function: serves every /api/* route with the same Express app used
// locally. Vercel serves the built client from client/dist, so no static files here.
// Data comes from Supabase when SUPABASE_URL and SUPABASE_KEY are set in Vercel.
import { createApp } from '../server/src/app.js';
import { scheduleStoreFromEnv } from '../server/src/store.js';

export default createApp({ store: scheduleStoreFromEnv(), clientDir: null });
