import { formatClock } from '../clock';

test('formats seconds as m:ss, rounding and never negative', () => {
  expect(formatClock(0)).toBe('0:00');
  expect(formatClock(4.4)).toBe('0:04');
  expect(formatClock(4.6)).toBe('0:05');
  expect(formatClock(65)).toBe('1:05');
  expect(formatClock(-3)).toBe('0:00');
});
