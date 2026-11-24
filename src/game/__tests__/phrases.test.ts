import { CUSTOM_PHRASE_MAX } from '@/config';

import { checkCustomPhrase, STARTER_PHRASES } from '../phrases';

test('empty or whitespace-only custom phrases are rejected', () => {
  expect(checkCustomPhrase('')).toEqual({ ok: false, reason: 'empty' });
  expect(checkCustomPhrase('  \n ')).toEqual({ ok: false, reason: 'empty' });
});

test('custom phrases longer than the cap are rejected', () => {
  expect(checkCustomPhrase('a'.repeat(61))).toEqual({ ok: false, reason: 'too_long' });
  expect(checkCustomPhrase('a'.repeat(60))).toEqual({ ok: true, text: 'a'.repeat(60) });
});

test('custom phrases are trimmed and inner whitespace collapsed', () => {
  expect(checkCustomPhrase('  hello   world ')).toEqual({ ok: true, text: 'hello world' });
});

test('starter pack: 10 unique stable ids, short texts, handoff order', () => {
  expect(STARTER_PHRASES).toHaveLength(10);
  const ids = STARTER_PHRASES.map((p) => p.id);
  expect(new Set(ids).size).toBe(10);
  for (const id of ids) expect(id).toMatch(/^p\d{2}$/);
  for (const p of STARTER_PHRASES) expect(p.text.length).toBeLessThanOrEqual(CUSTOM_PHRASE_MAX);
  expect(STARTER_PHRASES[0]).toEqual({ id: 'p01', text: 'Good morning everyone' });
  expect(STARTER_PHRASES[9]).toEqual({ id: 'p10', text: 'Can you hear me now' });
});
