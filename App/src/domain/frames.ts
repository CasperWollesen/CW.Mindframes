export type FrameStyle = 'serif' | 'bold' | 'calm' | 'note';
export type FramePosition = 'top' | 'middle' | 'bottom';
export const frameStyles: readonly FrameStyle[] = ['serif', 'bold', 'calm', 'note'];
export const framePositions: readonly FramePosition[] = ['top', 'middle', 'bottom'];

export const TITLE_MAX = 80;
export const SUBTITLE_MAX = 48;
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;

/** Everything the owner chooses in the editor. */
export interface FrameLook {
  title: string;
  subtitle: string;
  style: FrameStyle;
  position: FramePosition;
  /** Focus point of the photo in percent; it stays put when zooming. */
  focusX: number;
  focusY: number;
  zoom: number;
}

export interface Frame extends FrameLook {
  id: string;
  order: number;
  createdAt: number;
  updatedAt: number;
  image: Blob;
  imageWidth: number;
  imageHeight: number;
}

export interface Size { width: number; height: number }
export interface Point { x: number; y: number }

export const defaultLook: FrameLook = { title: '', subtitle: '', style: 'serif', position: 'bottom', focusX: 50, focusY: 50, zoom: 1 };

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const finiteOr = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/** Repairs anything that is out of range. Text is only cut to length, never trimmed, so typing feels natural. */
export function normalizeLook(value: Partial<FrameLook>): FrameLook {
  return {
    title: typeof value.title === 'string' ? value.title.slice(0, TITLE_MAX) : '',
    subtitle: typeof value.subtitle === 'string' ? value.subtitle.slice(0, SUBTITLE_MAX) : '',
    style: frameStyles.includes(value.style as FrameStyle) ? value.style as FrameStyle : defaultLook.style,
    position: framePositions.includes(value.position as FramePosition) ? value.position as FramePosition : defaultLook.position,
    focusX: clamp(finiteOr(value.focusX, 50), 0, 100),
    focusY: clamp(finiteOr(value.focusY, 50), 0, 100),
    zoom: clamp(finiteOr(value.zoom, 1), ZOOM_MIN, ZOOM_MAX)
  };
}

/** The look as it is stored: surrounding spaces removed. */
export function finalLook(look: FrameLook): FrameLook {
  const normalized = normalizeLook(look);
  return { ...normalized, title: normalized.title.trim(), subtitle: normalized.subtitle.trim() };
}

export function canSave(look: FrameLook): boolean {
  return look.title.trim().length > 0;
}

export function lookChanged(a: FrameLook, b: FrameLook): boolean {
  return (Object.keys(defaultLook) as Array<keyof FrameLook>).some(key => a[key] !== b[key]);
}

export function lookOf(frame: Frame): FrameLook {
  const { title, subtitle, style, position, focusX, focusY, zoom } = frame;
  return { title, subtitle, style, position, focusX, focusY, zoom };
}

/** Rendered size of a photo that covers the box (object-fit: cover), after zooming. */
export function coverSize(image: Size, box: Size, zoom: number): Size {
  const scale = Math.max(box.width / image.width, box.height / image.height) * zoom;
  return { width: image.width * scale, height: image.height * scale };
}

/**
 * Dragging the photo by (dx, dy) screen pixels moves the focus point the other way,
 * in proportion to how much of the photo is hidden on that axis.
 */
export function panFocus(focus: Point, delta: Point, image: Size, box: Size, zoom: number): Point {
  const shown = coverSize(image, box, zoom);
  const hiddenX = shown.width - box.width, hiddenY = shown.height - box.height;
  return {
    x: hiddenX > 0.5 ? clamp(focus.x - delta.x / hiddenX * 100, 0, 100) : focus.x,
    y: hiddenY > 0.5 ? clamp(focus.y - delta.y / hiddenY * 100, 0, 100) : focus.y
  };
}

const baseTitleSize: Record<FrameStyle, number> = { serif: 13, bold: 16, calm: 7, note: 16 };
/** Approximate glyph width in em, used to keep the longest word inside the frame. */
const glyphWidth: Record<FrameStyle, number> = { serif: 0.5, bold: 0.5, calm: 0.82, note: 0.42 };
const TEXT_WIDTH = 82;
const MIN_TITLE_SIZE = 4.5;

/** Title font size in percent of the frame width: short lines are set large, long words never overflow. */
export function titleSize(title: string, style: FrameStyle): number {
  const text = title.trim();
  const length = Math.max(1, text.length);
  const byLength = baseTitleSize[style] * (length <= 14 ? 1 : Math.max(0.58, Math.sqrt(14 / length)));
  const longestWord = Math.max(1, ...text.split(/\s+/).map(word => word.length));
  const byWord = TEXT_WIDTH / (longestWord * glyphWidth[style]);
  return Math.round(Math.max(MIN_TITLE_SIZE, Math.min(byLength, byWord)) * 10) / 10;
}

export function sortByOrder<T extends { order: number; createdAt: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order || b.createdAt - a.createdAt);
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const result = [...items];
  if (from < 0 || from >= result.length) return result;
  const [item] = result.splice(from, 1);
  result.splice(clamp(to, 0, result.length), 0, item!);
  return result;
}

/** Order numbers follow the list position. */
export function withOrder<T extends { order: number }>(items: readonly T[]): T[] {
  return items.map((item, order) => item.order === order ? item : { ...item, order });
}

/** Fisher–Yates; with two or more items the result always differs from the input, so Shuffle visibly does something. */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  if (result.length > 1 && result.every((item, i) => item === items[i])) result.push(result.shift()!);
  return result;
}

/** New frames go first, so the one you just made is the one you see. */
export function firstOrder(items: readonly { order: number }[]): number {
  return items.length ? Math.min(...items.map(item => item.order)) - 1 : 0;
}

export function isStoredFrame(value: unknown): value is Frame {
  if (!value || typeof value !== 'object') return false;
  const frame = value as Frame;
  return typeof frame.id === 'string' && typeof frame.title === 'string' && typeof frame.subtitle === 'string' &&
    frameStyles.includes(frame.style) && framePositions.includes(frame.position) &&
    [frame.focusX, frame.focusY, frame.zoom, frame.order, frame.createdAt, frame.updatedAt].every(Number.isFinite) &&
    frame.imageWidth > 0 && frame.imageHeight > 0 && frame.image instanceof Blob;
}
