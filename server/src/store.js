import { loadSchedule, validateSchedule } from './schedule.js';
import { fetchSchedule } from './supabase.js';

// Serves the schedule from a fixed object (the JSON file) or from a loader
// (Supabase). Loaded data is cached for ttlMs so edits made in Supabase show
// up without a redeploy; if a refresh fails, the last good copy keeps serving.
export function createScheduleStore({ schedule, load, ttlMs = 60_000, now = Date.now, source = 'supabase' } = {}) {
  if (schedule) {
    validateSchedule(schedule);
    return { source: 'json', get: async () => schedule };
  }
  if (typeof load !== 'function') throw new Error('createScheduleStore needs a schedule or a load function.');
  let cached; let loadedAt = 0; let pending;
  return {
    source,
    async get() {
      if (cached && now() - loadedAt < ttlMs) return cached;
      pending ??= (async () => {
        try {
          cached = validateSchedule(await load());
          loadedAt = now();
          return cached;
        } catch (error) {
          if (!cached) throw error;
          console.error(`Schedule refresh failed, serving the last loaded copy: ${error.message}`);
          loadedAt = now();
          return cached;
        } finally {
          pending = undefined;
        }
      })();
      return pending;
    },
  };
}

// Supabase when both SUPABASE_URL and SUPABASE_KEY are set; otherwise the JSON file.
export function scheduleStoreFromEnv(env = process.env) {
  const url = env.SUPABASE_URL?.trim();
  const key = env.SUPABASE_KEY?.trim();
  if (!url && !key) return createScheduleStore({ schedule: loadSchedule() });
  if (!url || !key) throw new Error('Set both SUPABASE_URL and SUPABASE_KEY, or neither to use server/data/schedule.json.');
  if (key.startsWith('sb_secret_')) throw new Error('SUPABASE_KEY must be the publishable (anon) key, not a secret key.');
  const seconds = Number(env.SCHEDULE_CACHE_SECONDS ?? 60);
  return createScheduleStore({ load: () => fetchSchedule({ url, key }), ttlMs: (Number.isFinite(seconds) && seconds >= 0 ? seconds : 60) * 1000 });
}
