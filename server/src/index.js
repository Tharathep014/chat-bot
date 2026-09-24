import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { scheduleStoreFromEnv } from './store.js';
import { createApp } from './app.js';

config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });
const port = Number(process.env.PORT || 3001);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
const store = scheduleStoreFromEnv();
// Load once at startup so a wrong Supabase setting is reported immediately.
try {
  await store.get();
} catch (error) {
  console.error(`Cannot load schedule from ${store.source}: ${error.message}`);
}
const app = createApp({ store });
const server = app.listen(port, host, () => {
  console.log(`Schedule chatbot ready: http://${host}:${port} (data: ${store.source === 'supabase' ? 'Supabase' : 'server/data/schedule.json'})`);
});
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `Port ${port} is already in use. Set PORT in server/.env to a free port.`
    : `Cannot start server: ${error.message}`);
  process.exitCode = 1;
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
