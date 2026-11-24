import { isConsentCurrent, parseConsent } from '../consent';

test('parseConsent rejects missing, broken and mis-shaped JSON', () => {
  expect(parseConsent(null)).toBeNull();
  expect(parseConsent('{')).toBeNull();
  expect(parseConsent('{"version":"1"}')).toBeNull();
  expect(parseConsent('{"version":1}')).toBeNull();
  expect(parseConsent('[]')).toBeNull();
});

test('parseConsent reads a valid record', () => {
  expect(parseConsent('{"version":1,"acceptedAt":"2026-11-25T10:00:00.000Z"}')).toEqual({
    version: 1,
    acceptedAt: '2026-11-25T10:00:00.000Z',
  });
});

test('isConsentCurrent needs a record at the current version', () => {
  expect(isConsentCurrent(null)).toBe(false);
  expect(isConsentCurrent({ version: 0, acceptedAt: 'x' })).toBe(false);
  expect(isConsentCurrent({ version: 1, acceptedAt: 'x' })).toBe(true);
  expect(isConsentCurrent({ version: 1, acceptedAt: 'x' }, 2)).toBe(false);
});
