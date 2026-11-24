import { classifyTake, interruptionFor } from '../recordingRules';

test('classifyTake boundaries', () => {
  expect(classifyTake(0)).toBe('too_short');
  expect(classifyTake(499)).toBe('too_short');
  expect(classifyTake(500)).toBe('ok');
  expect(classifyTake(20_000)).toBe('ok');
});

test('interruptionFor: backgrounding always counts as background', () => {
  expect(interruptionFor('background', true)).toBe('background');
  expect(interruptionFor('background', false)).toBe('background');
});

test('interruptionFor: stream stopping by itself in the foreground counts as a call', () => {
  expect(interruptionFor('active', false)).toBe('call');
  expect(interruptionFor('inactive', false)).toBe('call');
});

test('interruptionFor: a running stream in the foreground is no interruption', () => {
  expect(interruptionFor('active', true)).toBeNull();
  expect(interruptionFor('inactive', true)).toBeNull();
});
