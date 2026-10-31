import type { Size } from './frames';

/** Imported photos are re-encoded: sharp on any phone screen, small enough to keep dozens. */
export const MAX_EDGE = 2048;
export const JPEG_QUALITY = 0.86;

/** Scales down so the longest side is at most maxEdge. Never scales up. */
export function fitWithin(size: Size, maxEdge = MAX_EDGE): Size {
  const longest = Math.max(size.width, size.height);
  const scale = longest > maxEdge ? maxEdge / longest : 1;
  return { width: Math.max(1, Math.round(size.width * scale)), height: Math.max(1, Math.round(size.height * scale)) };
}
