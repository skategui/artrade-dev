import { intersects } from './interesect';

describe('mixin intersects', () => {
  it('should handle edge cases', () => {
    expect(intersects()).toBe(false);
    expect(intersects([])).toBe(false);
    expect(intersects([], [])).toBe(false);
  });
  it('should tell whether arrays intersect', () => {
    expect(intersects([1, 2], [2, 3], [4, 5, 2])).toBe(true);
    expect(intersects([1, 2], [1, 2], [1, 2])).toBe(true);
    expect(intersects([1, 2], [2, 3], [])).toBe(false);
    expect(intersects([], [2, 3], [2, 3])).toBe(false);
  });
});
