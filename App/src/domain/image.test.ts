import { describe, expect, it } from 'vitest';
import { fitWithin } from './image';

describe('fitWithin', () => {
  it('scales a large phone photo down to the longest edge', () => {
    expect(fitWithin({ width: 3024, height: 4032 })).toEqual({ width: 1536, height: 2048 });
  });
  it('never scales up', () => {
    expect(fitWithin({ width: 800, height: 600 })).toEqual({ width: 800, height: 600 });
  });
  it('keeps at least one pixel', () => {
    expect(fitWithin({ width: 10000, height: 1 }, 100)).toEqual({ width: 100, height: 1 });
  });
});
