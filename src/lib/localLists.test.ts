import { expect, it, vi } from 'vitest';
import { readList, writeList } from './localLists';

it('keeps bookmarks usable in this tab when quota prevents overwriting existing storage', () => {
  const key = 'quota-test';
  localStorage.setItem(key, JSON.stringify(['first']));
  const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  expect(writeList(key, ['first', 'second'])).toBe(false);
  expect(readList(key)).toEqual(['first', 'second']);
  blocked.mockRestore();
  expect(writeList(key, ['second'])).toBe(true);
  expect(readList(key)).toEqual(['second']);
});
