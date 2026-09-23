import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { config } from '../server/node_modules/dotenv/lib/main.js';

const root = fileURLToPath(new URL('../', import.meta.url));
config({ path: fileURLToPath(new URL('../server/.env', import.meta.url)) });
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = code;
}
for (const [script, args] of [
  ['server/src/index.js', []],
  ['client/node_modules/vite/bin/vite.js', ['--host', '127.0.0.1', '--strictPort']],
]) {
  const child = spawn(process.execPath, [`${root}/${script}`, ...args], {
    cwd: script.startsWith('client') ? `${root}/client` : root,
    stdio: 'inherit',
    env: { ...process.env, SCHEDULE_API_TARGET: `http://127.0.0.1:${process.env.PORT || 3001}` },
  });
  children.push(child);
  child.on('error', (error) => { console.error(error.message); stop(1); });
  child.on('exit', (code) => { if (!stopping) stop(code ?? 1); });
}
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop());
