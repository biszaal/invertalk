import { screenName, toPayload, type AnalyticsEvent } from '../events';

test('challenge_started preset carries only allowed props', () => {
  expect(toPayload({ name: 'challenge_started', phrase_source: 'preset', phrase_id: 'p03' }, 'ios')).toEqual({
    event: 'challenge_started',
    properties: { platform: 'ios', phrase_source: 'preset', phrase_id: 'p03' },
  });
});

test('drops unknown properties', () => {
  const e = { name: 'challenge_started', phrase_source: 'custom', phrase_text: 'Please pass the salt' } as unknown as AnalyticsEvent;
  expect(toPayload(e, 'android').properties).toEqual({ platform: 'android', phrase_source: 'custom' });
});

test('custom phrases never carry a phrase_id', () => {
  const e = { name: 'challenge_started', phrase_source: 'custom', phrase_id: 'p03' } as unknown as AnalyticsEvent;
  expect(toPayload(e, 'ios').properties).toEqual({ platform: 'ios', phrase_source: 'custom' });
});

test('redacts non-token strings', () => {
  const e = { name: 'app_error', error_code: 'file:///cache/invertalk-audio/x.wav', screen: 'Record Screen' } as unknown as AnalyticsEvent;
  expect(toPayload(e, 'ios').properties).toEqual({ platform: 'ios', error_code: 'redacted', screen: 'redacted' });
});

test('every event gets platform', () => {
  expect(toPayload({ name: 'consent_shown' }, 'android').properties).toEqual({ platform: 'android' });
});

test('keeps opaque error codes', () => {
  const p = toPayload(
    { name: 'reversal_completed', role: 'prompt', success: false, duration_ms: 12, error_code: 'not_wave' },
    'ios'
  );
  expect(p.properties).toEqual({ platform: 'ios', role: 'prompt', success: false, duration_ms: 12, error_code: 'not_wave' });
});

test('drops non-finite numbers', () => {
  const p = toPayload({ name: 'challenge_finished', total_duration_ms: Number.NaN }, 'ios');
  expect(p.properties).toEqual({ platform: 'ios' });
});

test('recording_completed sends audio metadata only', () => {
  const p = toPayload(
    { name: 'recording_completed', role: 'imitation', duration_ms: 3200, sample_rate: 48000, channels: 1, encoding: 'int16' },
    'android'
  );
  expect(p.properties).toEqual({
    platform: 'android',
    role: 'imitation',
    duration_ms: 3200,
    sample_rate: 48000,
    channels: 1,
    encoding: 'int16',
  });
});

test('screenName turns a route path into a token', () => {
  expect(screenName('/')).toBe('home');
  expect(screenName('/record')).toBe('record');
  expect(screenName('/permission-denied')).toBe('permission_denied');
  expect(screenName(undefined)).toBe('unknown');
});
