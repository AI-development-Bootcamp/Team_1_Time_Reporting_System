import { describe, it, expect } from 'vitest';

// ============================================================================
// Unit Tests: Sorting Logic
// ============================================================================

describe('ProjectSelectorService sorting logic', () => {
  // Test the sorting comparator logic in isolation
  const sortByCountThenName = <T extends { reportCount: number; name: string }>(a: T, b: T): number => {
    if (b.reportCount !== a.reportCount) {
      return b.reportCount - a.reportCount;
    }
    return a.name.localeCompare(b.name);
  };

  it('should sort by count descending (higher count first)', () => {
    const items = [
      { name: 'B', reportCount: 5 },
      { name: 'A', reportCount: 10 },
      { name: 'C', reportCount: 3 },
    ];

    items.sort(sortByCountThenName);

    expect(items[0].name).toBe('A'); // count 10
    expect(items[1].name).toBe('B'); // count 5
    expect(items[2].name).toBe('C'); // count 3
  });

  it('should use alphabetical order for tie-breaker (A-Z)', () => {
    const items = [
      { name: 'Charlie', reportCount: 5 },
      { name: 'Alpha', reportCount: 5 },
      { name: 'Bravo', reportCount: 5 },
    ];

    items.sort(sortByCountThenName);

    expect(items[0].name).toBe('Alpha');
    expect(items[1].name).toBe('Bravo');
    expect(items[2].name).toBe('Charlie');
  });

  it('should handle mixed count and alphabetical sorting', () => {
    const items = [
      { name: 'Zulu', reportCount: 10 },
      { name: 'Alpha', reportCount: 5 },
      { name: 'Bravo', reportCount: 5 },
      { name: 'Charlie', reportCount: 15 },
    ];

    items.sort(sortByCountThenName);

    expect(items[0].name).toBe('Charlie'); // count 15
    expect(items[1].name).toBe('Zulu');    // count 10
    expect(items[2].name).toBe('Alpha');   // count 5, A before B
    expect(items[3].name).toBe('Bravo');   // count 5, B after A
  });

  it('should handle zero counts', () => {
    const items = [
      { name: 'B', reportCount: 0 },
      { name: 'A', reportCount: 0 },
      { name: 'C', reportCount: 1 },
    ];

    items.sort(sortByCountThenName);

    expect(items[0].name).toBe('C'); // count 1
    expect(items[1].name).toBe('A'); // count 0, A before B
    expect(items[2].name).toBe('B'); // count 0
  });
});
