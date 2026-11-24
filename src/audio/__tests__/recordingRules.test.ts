import { classifyTake } from '../recordingRules';

test('classifyTake boundaries', () => {
  expect(classifyTake(0)).toBe('too_short');
  expect(classifyTake(499)).toBe('too_short');
  expect(classifyTake(500)).toBe('ok');
  expect(classifyTake(20_000)).toBe('ok');
});
