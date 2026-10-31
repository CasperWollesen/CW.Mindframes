import { describe, expect, it } from 'vitest';
import { canSave, coverSize, defaultLook, finalLook, firstOrder, isStoredFrame, lookChanged, moveItem, normalizeLook, panFocus, shuffled, sortByOrder, SUBTITLE_MAX, titleSize, TITLE_MAX, withOrder } from './frames';
import type { Frame } from './frames';

const portraitBox = { width: 375, height: 812 };

function frame(id: string, order: number, patch: Partial<Frame> = {}): Frame {
  return { ...defaultLook, id, order, title: 'demo-' + id, createdAt: 1, updatedAt: 1, image: new Blob(['x']), imageWidth: 400, imageHeight: 300, ...patch };
}

describe('normalizeLook', () => {
  it('repairs unknown styles, positions and out-of-range numbers', () => {
    const look = normalizeLook({ style: 'neon' as never, position: 'left' as never, focusX: -20, focusY: 140, zoom: 9 });
    expect(look).toMatchObject({ style: 'serif', position: 'bottom', focusX: 0, focusY: 100, zoom: 3 });
  });
  it('cuts text to length but keeps spaces while typing', () => {
    const look = normalizeLook({ title: 'x'.repeat(TITLE_MAX + 5), subtitle: 'Sunday ' });
    expect(look.title).toHaveLength(TITLE_MAX);
    expect(look.subtitle).toBe('Sunday ');
    expect(normalizeLook({ subtitle: 'y'.repeat(99) }).subtitle).toHaveLength(SUBTITLE_MAX);
  });
  it('trims the stored text', () => {
    expect(finalLook({ ...defaultLook, title: '  Human before machine  ', subtitle: ' ride ' })).toMatchObject({ title: 'Human before machine', subtitle: 'ride' });
  });
});

describe('saving and changes', () => {
  it('needs a line of text', () => {
    expect(canSave({ ...defaultLook, title: '   ' })).toBe(false);
    expect(canSave({ ...defaultLook, title: 'Breathe' })).toBe(true);
  });
  it('notices any changed choice', () => {
    expect(lookChanged(defaultLook, { ...defaultLook })).toBe(false);
    expect(lookChanged(defaultLook, { ...defaultLook, zoom: 1.2 })).toBe(true);
    expect(lookChanged(defaultLook, { ...defaultLook, position: 'top' })).toBe(true);
  });
});

describe('crop maths', () => {
  it('covers the box and zooms on top', () => {
    const covered = coverSize({ width: 4000, height: 3000 }, portraitBox, 1);
    expect(covered.width).toBeCloseTo(812 * 4 / 3);
    expect(covered.height).toBeCloseTo(812);
    expect(coverSize({ width: 1000, height: 1000 }, portraitBox, 2).height).toBeCloseTo(1624);
  });
  it('moves the focus against the drag, only where the photo is hidden', () => {
    const landscape = { width: 4000, height: 3000 };
    const hiddenX = 812 * 4 / 3 - 375;
    const moved = panFocus({ x: 50, y: 50 }, { x: hiddenX / 10, y: 40 }, landscape, portraitBox, 1);
    expect(moved.x).toBeCloseTo(40);
    expect(moved.y).toBe(50);
  });
  it('lets both axes move once zoomed, within 0–100', () => {
    const moved = panFocus({ x: 50, y: 50 }, { x: -5000, y: 5000 }, { width: 4000, height: 3000 }, portraitBox, 2);
    expect(moved).toEqual({ x: 100, y: 0 });
  });
});

describe('titleSize', () => {
  it('sets short lines large and long lines smaller', () => {
    expect(titleSize('Breathe', 'serif')).toBe(13);
    expect(titleSize('Human before machine, every single day of the week', 'serif')).toBeLessThan(9);
  });
  it('keeps a very long word inside the frame', () => {
    const size = titleSize('Automatiseringsprojekter', 'serif');
    expect(size * 24 * 0.5).toBeLessThanOrEqual(82);
  });
  it('never goes below the minimum', () => {
    expect(titleSize('x'.repeat(80), 'calm')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('ordering', () => {
  it('sorts by order and puts the newest first on a tie', () => {
    const sorted = sortByOrder([frame('b', 2), frame('a', 1, { createdAt: 1 }), frame('c', 1, { createdAt: 5 })]);
    expect(sorted.map(f => f.id)).toEqual(['c', 'a', 'b']);
  });
  it('moves an item and renumbers', () => {
    const moved = withOrder(moveItem([frame('a', 0), frame('b', 1), frame('c', 2)], 0, 2));
    expect(moved.map(f => [f.id, f.order])).toEqual([['b', 0], ['c', 1], ['a', 2]]);
  });
  it('ignores a move from outside the list', () => {
    expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });
  it('puts new frames before the current first one', () => {
    expect(firstOrder([])).toBe(0);
    expect(firstOrder([frame('a', 3), frame('b', -2)])).toBe(-3);
  });
});

describe('shuffled', () => {
  it('keeps every item', () => {
    expect(shuffled([1, 2, 3, 4, 5]).sort()).toEqual([1, 2, 3, 4, 5]);
  });
  it('always changes the order of two or more items', () => {
    // random() close to 1 leaves Fisher–Yates on the identity permutation.
    expect(shuffled([1, 2, 3], () => 0.999)).not.toEqual([1, 2, 3]);
    expect(shuffled([1])).toEqual([1]);
  });
});

describe('isStoredFrame', () => {
  it('accepts a complete frame and rejects broken records', () => {
    expect(isStoredFrame(frame('a', 0))).toBe(true);
    expect(isStoredFrame({ ...frame('a', 0), image: 'data:' })).toBe(false);
    expect(isStoredFrame({ ...frame('a', 0), style: 'neon' })).toBe(false);
    expect(isStoredFrame(null)).toBe(false);
  });
});
