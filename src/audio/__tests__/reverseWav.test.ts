import { makeWav } from '../__fixtures__/wavFixture';
import { reverseWavBytes } from '../reverseWav';
import { parseWav } from '../wav';

/** Decodes interleaved samples from a WAV (int16 or float32). */
function samplesOf(bytes: Uint8Array): number[] {
  const p = parseWav(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset + p.dataOffset, p.dataLength);
  const size = p.format.encoding === 'int16' ? 2 : 4;
  const out: number[] = [];
  for (let i = 0; i < p.dataLength; i += size) {
    out.push(p.format.encoding === 'int16' ? view.getInt16(i, true) : view.getFloat32(i, true));
  }
  return out;
}

test('reverses known int16 waveform sample-for-sample', () => {
  const out = reverseWavBytes(
    makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1, 2, 3, -4, 32767, -32768] })
  );
  expect(samplesOf(out)).toEqual([-32768, 32767, -4, 3, 2, 1]);
});

test('keeps stereo channels together', () => {
  const out = reverseWavBytes(
    makeWav({ channels: 2, sampleRate: 44100, encoding: 'int16', samples: [1, -1, 2, -2, 3, -3] })
  );
  expect(samplesOf(out)).toEqual([3, -3, 2, -2, 1, -1]);
});

test('reverses float32 mono and stereo exactly', () => {
  expect(
    samplesOf(
      reverseWavBytes(makeWav({ channels: 1, sampleRate: 48000, encoding: 'float32', formatTag: 3, samples: [0.5, -0.25, 1] }))
    )
  ).toEqual([1, -0.25, 0.5]);
  expect(
    samplesOf(
      reverseWavBytes(
        makeWav({ channels: 2, sampleRate: 48000, encoding: 'float32', formatTag: 3, samples: [0.5, -0.5, 0.25, -0.25] })
      )
    )
  ).toEqual([0.25, -0.25, 0.5, -0.5]);
});

test('preserves format metadata and writes a consistent header', () => {
  for (const sampleRate of [44100, 48000]) {
    for (const channels of [1, 2]) {
      const out = reverseWavBytes(
        makeWav({ channels, sampleRate, encoding: 'int16', samples: new Array(channels * 4).fill(7) })
      );
      const p = parseWav(out);
      expect(p.format).toMatchObject({ channels, sampleRate, encoding: 'int16' });
      expect(p.dataOffset).toBe(44);
      expect(new DataView(out.buffer).getUint32(4, true)).toBe(36 + p.dataLength);
    }
  }
});

test('extensible input becomes plain float32 output', () => {
  const out = reverseWavBytes(
    makeWav({ channels: 1, sampleRate: 48000, encoding: 'float32', formatTag: 0xfffe, samples: [0.1, 0.2] })
  );
  expect(new DataView(out.buffer).getUint16(20, true)).toBe(3);
});

test('silence stays silence', () => {
  const out = reverseWavBytes(
    makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: new Array(48000).fill(0) })
  );
  expect(samplesOf(out).every((s) => s === 0)).toBe(true);
  expect(parseWav(out).frameCount).toBe(48000);
});

test('double reverse restores a 20 s mono 48 kHz take byte-for-byte', () => {
  const samples = Array.from({ length: 960000 }, (_, i) => ((i * 37) % 65536) - 32768);
  const input = makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples });
  const twice = reverseWavBytes(reverseWavBytes(input));
  const a = twice.subarray(44);
  const b = input.subarray(44);
  expect(a.length).toBe(b.length);
  expect(a.every((v, i) => v === b[i])).toBe(true);
});

test('drops trailing partial frame instead of reversing it in', () => {
  const out = reverseWavBytes(
    makeWav({ channels: 2, sampleRate: 48000, encoding: 'int16', samples: [1, -1, 2, -2], trailingBytes: 3 })
  );
  expect(parseWav(out).dataLength).toBe(8);
  expect(samplesOf(out)).toEqual([2, -2, 1, -1]);
});

test('preserves exact float bit patterns (NaN payload)', () => {
  const input = makeWav({ channels: 1, sampleRate: 48000, encoding: 'float32', formatTag: 3, samples: [0, 0] });
  input.set([0x01, 0x00, 0xc0, 0x7f], 44); // NaN with a payload in frame 0
  const out = reverseWavBytes(input);
  expect([...out.subarray(48, 52)]).toEqual([0x01, 0x00, 0xc0, 0x7f]);
});

test('does not mutate its input', () => {
  const input = makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1, 2, 3] });
  const copy = input.slice();
  reverseWavBytes(input);
  expect(input).toEqual(copy);
});
