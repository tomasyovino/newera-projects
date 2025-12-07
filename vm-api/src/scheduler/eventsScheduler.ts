import { dbListAllWeekly, dbListAllWorld } from '../db/sqlite';
import { sendSphereCommand } from '../sphere/sphereClient';
import type { WeeklyEvent, WorldEvent } from '../lib/types';

const TICK_MS = Number(process.env.SCHEDULER_TICK_MS ?? '30000'); // 30s
const WINDOW_MS = Number(process.env.SCHEDULER_WINDOW_MS ?? '60000'); // 60s

const fired = new Set<string>();

export function startScheduler() {
    if (process.env.DISABLE_SCHEDULER === '1') {
        console.log('[scheduler] Deshabilitado por env DISABLE_SCHEDULER=1');
        return;
    }

    console.log(`[scheduler] Iniciando (tick=${TICK_MS}ms, ventana=${WINDOW_MS}ms)`);

    setInterval(() => {
        tick().catch((err) => {
            console.error('[scheduler] Error en tick:', err);
        });
    }, TICK_MS);
}

async function tick() {
    const now = new Date();

    const weekly = dbListAllWeekly();
    for (const ev of weekly) {
        if (!ev.sphereCmd || !ev.times?.length) continue;

        for (const timeStr of ev.times) {
            const runAt = computeWeeklyRunDate(ev, timeStr, now);
            const diff = now.getTime() - runAt.getTime();

            if (diff >= 0 && diff <= WINDOW_MS) {
                const key = `weekly:${ev.id}:${runAt.toISOString()}`;
                if (!fired.has(key)) {
                    fired.add(key);
                    await fireCommand(key, ev.sphereCmd);
                }
            }
        }
    }

    const worlds = dbListAllWorld();
    for (const ev of worlds) {
        if (ev.sphereStartCmd) {
            await maybeFireWorld(ev, 'start', ev.sphereStartCmd, now);
        }
        if (ev.sphereEndCmd) {
            await maybeFireWorld(ev, 'end', ev.sphereEndCmd, now);
        }
    }
}

async function maybeFireWorld(
    ev: WorldEvent,
    kind: 'start' | 'end',
    cmd: string,
    now: Date,
) {
    const when = new Date(kind === 'start' ? ev.startsAt : ev.endsAt);
    const diff = now.getTime() - when.getTime();

    if (diff < 0 || diff > WINDOW_MS) return;

    const key = `world:${ev.id}:${kind}:${when.toISOString()}`;
    if (fired.has(key)) return;

    fired.add(key);
    await fireCommand(key, cmd);
}

async function fireCommand(key: string, cmd: string) {
    try {
        console.log(`[scheduler] Fire ${key}: ${cmd}`);
        await sendSphereCommand(cmd);
    } catch (err) {
        console.error(`[scheduler] Error enviando comando (${key})`, err);
    }
}

/**
 * dayOfWeek: 1-7 (1=lunes, 7=domingo)
 * Se asume que el servidor está en la zona horaria que usás para configurar los eventos.
 */
function computeWeeklyRunDate(ev: WeeklyEvent, hhmm: string, now: Date): Date {
    const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));

    const run = new Date(now);
    const todayDow = run.getDay() === 0 ? 7 : run.getDay(); // JS: 0=domingo
    const diffDays = ev.dayOfWeek - todayDow;
    run.setDate(run.getDate() + diffDays);
    run.setHours(h, m, 0, 0);

    return run;
}
