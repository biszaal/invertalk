import { makeWav } from '../__fixtures__/wavFixture';
import { waveformPeaks } from '../peaks';
import { WavError } from '../wav';

const mono = (samples: number[]) => makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples });

test('returns exactly the requested number of buckets, each between 0 and 1', () => {
  const peaks = waveformPeaks(mono(Array.from({ length: 4800 }, (_, i) => (i % 7) * 900)), 32);
  expect(peaks).toHaveLength(32);
  peaks.forEach((p) => {
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(1);
  });
});

test('silence gives all zeros', () => {
  expect(waveformPeaks(mono(new Array(4800).fill(0)), 16)).toEqual(new Array(16).fill(0));
});

test('the loudest bucket is normalised to 1 and quiet edges stay low', () => {
  const samples = [...new Array(1000).fill(200), ...new Array(1000).fill(16000), ...new Array(1000).fill(200)];
  const peaks = waveformPeaks(mono(samples), 3);
  expect(peaks[1]).toBe(1);
  expect(peaks[0]).toBeCloseTo(200 / 16000, 5);
  expect(peaks[2]).toBeCloseTo(200 / 16000, 5);
});

test('uses absolute amplitude, so negative samples count', () => {
  const peaks = waveformPeaks(mono([...new Array(500).fill(-30000), ...new Array(500).fill(100)]), 2);
  expect(peaks[0]).toBe(1);
  expect(peaks[1]).toBeCloseTo(100 / 30000, 5);
});

test('reads float32 and takes the louder channel in stereo', () => {
  const stereo = makeWav({
    channels: 2,
    sampleRate: 44100,
    encoding: 'float32',
    formatTag: 3,
    samples: [0.1, -0.8, 0.1, 0.2, 0.05, 0.05, 0.05, 0.05],
  });
  const [first, second] = waveformPeaks(stereo, 2);
  expect(first).toBe(1);
  expect(second).toBeCloseTo(0.05 / 0.8, 5);
});

test('a take shorter than the bucket count still fills every bucket', () => {
  expect(waveformPeaks(mono([1000, 2000]), 5)).toHaveLength(5);
});

test('rejects bytes that are not a WAV', () => {
  expect(() => waveformPeaks(new Uint8Array([1, 2, 3]), 8)).toThrow(WavError);
});
