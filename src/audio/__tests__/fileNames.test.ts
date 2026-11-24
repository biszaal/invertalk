import { isTempFileName, newSessionId, tempFileName } from '../fileNames';

const base = { sessionId: 'k1', role: 'prompt', take: 1, kind: 'raw' } as const;

test('tempFileName follows the agreed pattern', () => {
  expect(tempFileName(base)).toBe('invertalk-k1-prompt-1-raw.wav');
});

test('names differ when role, take or kind differs', () => {
  const names = [
    tempFileName(base),
    tempFileName({ ...base, role: 'imitation' }),
    tempFileName({ ...base, take: 2 }),
    tempFileName({ ...base, kind: 'rev' }),
    tempFileName({ ...base, kind: 'rev2' }),
  ];
  expect(new Set(names).size).toBe(names.length);
});

test('isTempFileName accepts generated names only', () => {
  for (const role of ['prompt', 'imitation', 'dev'] as const) {
    for (const kind of ['raw', 'rev', 'rev2'] as const) {
      expect(isTempFileName(tempFileName({ sessionId: 'abc123', role, take: 12, kind }))).toBe(true);
    }
  }
  for (const name of ['photo.wav', 'invertalk-consent.json', 'invertalk-abc-prompt-1-raw.m4a', '../invertalk-a-dev-1-raw.wav']) {
    expect(isTempFileName(name)).toBe(false);
  }
});

test('newSessionId is a lowercase base-36 token', () => {
  expect(newSessionId(1732400000000, () => 0.5)).toMatch(/^[a-z0-9]+$/);
  expect(newSessionId()).toMatch(/^[a-z0-9]+$/);
});
