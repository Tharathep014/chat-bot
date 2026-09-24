import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { answerQuestion } from './answer.js';
import { dataWarnings } from './schedule.js';
import { createScheduleStore } from './store.js';

const defaultClientDir = fileURLToPath(new URL('../../client/dist/', import.meta.url));
const UNAVAILABLE = 'โหลดข้อมูลตารางสอนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';

// Pass `schedule` (a fixed object) or `store` (e.g. Supabase-backed).
export function createApp({ schedule, store, clientDir = defaultClientDir, now } = {}) {
  const scheduleStore = store || createScheduleStore({ schedule });
  const loadOr503 = async (res) => {
    try {
      return await scheduleStore.get();
    } catch (error) {
      console.error('Schedule load failed:', error.message);
      res.status(503).json({ error: UNAVAILABLE });
      return null;
    }
  };
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    next();
  });
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', async (_req, res) => {
    const schedule = await loadOr503(res);
    if (schedule) res.json({ status: 'ok', mode: 'schedule-only', dataSource: scheduleStore.source, dataWarnings: dataWarnings(schedule) });
  });
  app.get('/api/schedule', async (_req, res) => {
    const schedule = await loadOr503(res);
    if (schedule) res.json(schedule);
  });

  app.post('/api/chat', async (req, res) => {
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'กรุณาส่งข้อมูลแบบ application/json' });
    }
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'รูปแบบคำถามไม่ถูกต้อง' });
    }
    const { message, history = [] } = body;
    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'กรุณาพิมพ์คำถามเกี่ยวกับตารางสอน' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'กรุณาพิมพ์คำถามไม่เกิน 1,000 ตัวอักษร' });
    }
    if (!Array.isArray(history) || history.length > 12 || history.some((item) =>
      !item || !['user', 'assistant'].includes(item.role) || typeof item.text !== 'string'
      || !item.text.trim() || item.text.length > 8000)
      || history.reduce((sum, item) => sum + item.text.length, 0) > 32000) {
      return res.status(400).json({ error: 'ประวัติแชทไม่ถูกต้องหรือยาวเกินไป กรุณาเริ่มบทสนทนาใหม่' });
    }
    const schedule = await loadOr503(res);
    if (!schedule) return undefined;
    const result = answerQuestion(schedule, message.trim(), history, now ? { now: now() } : {});
    return res.json(result);
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'ไม่พบ API ที่ต้องการ' }));

  if (clientDir && existsSync(clientDir)) {
    app.use(express.static(clientDir));
    app.get('/', (_req, res) => res.sendFile(`${clientDir}/index.html`));
  }
  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'ข้อมูลยาวเกินไป กรุณาลดข้อความหรือเริ่มบทสนทนาใหม่' });
    }
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'ข้อมูล JSON ไม่ถูกต้อง' });
    }
    console.error('Request failed:', error.message);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการค้นตาราง กรุณาลองใหม่อีกครั้ง' });
  });
  return app;
}
