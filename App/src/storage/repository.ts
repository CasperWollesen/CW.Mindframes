import Dexie from 'dexie';
import type { EntityTable } from 'dexie';
import { isStoredFrame, sortByOrder } from '../domain/frames';
import type { Frame } from '../domain/frames';

/** The only module that touches IndexedDB and localStorage. Frames live on this device only. */
class MindframesDatabase extends Dexie {
  frames!: EntityTable<Frame, 'id'>;
  constructor() {
    super('mindframes');
    this.version(1).stores({ frames: 'id, order' });
  }
}

const db = new MindframesDatabase();

export async function loadFrames(): Promise<Frame[]> {
  return sortByOrder((await db.frames.toArray()).filter(isStoredFrame));
}

export async function putFrame(frame: Frame): Promise<void> {
  await db.frames.put(frame);
}

export async function deleteFrame(id: string): Promise<void> {
  await db.frames.delete(id);
}

/** Writes only the order numbers, so the photos are not rewritten. */
export async function saveOrder(frames: readonly Frame[]): Promise<void> {
  await db.transaction('rw', db.frames, async () => {
    await Promise.all(frames.map(frame => db.frames.update(frame.id, { order: frame.order })));
  });
}

/** Asks the browser not to evict the frames under storage pressure. Silently ignored where unsupported. */
export async function requestPersistence(): Promise<void> {
  try { await navigator.storage?.persist?.(); } catch { /* best effort */ }
}

export type Theme = 'dark' | 'light';
export interface Preferences { theme: Theme }
const preferencesKey = 'cw-mindframes.v1';

export function readPreferences(): Preferences {
  try {
    const value = JSON.parse(localStorage.getItem(preferencesKey) ?? '{}');
    return { theme: value.theme === 'light' ? 'light' : 'dark' };
  } catch { return { theme: 'dark' }; }
}

export function savePreferences(preferences: Preferences): boolean {
  try { localStorage.setItem(preferencesKey, JSON.stringify(preferences)); return true; } catch { return false; }
}
