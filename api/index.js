// Vercel Function: serves every /api/* route with the same Express app used
// locally. Vercel serves the built client from client/dist, so no static files here.
import { createApp } from '../server/src/app.js';
import { loadSchedule } from '../server/src/schedule.js';

export default createApp({ schedule: loadSchedule(), clientDir: null });
