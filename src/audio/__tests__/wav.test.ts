import { makeWav } from '../__fixtures__/wavFixture';
import { parseWav, WavError } from '../wav';

test('parses mono int16 48 kHz', () => {
  const p = parseWav(makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1, 2, 3] }));
  expect(p.format).toEqual({ encoding: 'int16', channels: 1, sampleRate: 48000, bitsPerSample: 16, blockAlign: 2 });
  expect(p.frameCount).toBe(3);
  expect(p.dataOffset).toBe(44);
  expect(p.droppedBytes).toBe(0);
});

test('parses stereo float32 44.1 kHz (tag 3)', () => {
  const p = parseWav(
    makeWav({ channels: 2, sampleRate: 44100, encoding: 'float32', formatTag: 3, samples: [0.5, -0.5, 0.25, -0.25] })
  );
  expect(p.format.encoding).toBe('float32');
  expect(p.format.blockAlign).toBe(8);
  expect(p.frameCount).toBe(2);
});

test('parses extensible float32', () => {
  const p = parseWav(makeWav({ channels: 1, sampleRate: 48000, encoding: 'float32', formatTag: 0xfffe, samples: [0.1] }));
  expect(p.format.encoding).toBe('float32');
});

test('finds data after fact and LIST chunks', () => {
  const p = parseWav(
    makeWav({
      channels: 1,
      sampleRate: 48000,
      encoding: 'int16',
      samples: [9, 8],
      chunksBeforeData: [
        { id: 'fact', size: 4 },
        { id: 'LIST', size: 26 },
      ],
    })
  );
  expect(p.frameCount).toBe(2);
  expect(p.dataOffset).toBe(44 + 12 + 34);
});

test('skips odd-sized chunk with pad byte', () => {
  const p = parseWav(
    makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [5], chunksBeforeData: [{ id: 'junk', size: 7 }] })
  );
  expect(p.frameCount).toBe(1);
  expect(p.dataOffset).toBe(44 + 8 + 8);
});

test('drops trailing partial frame', () => {
  const p = parseWav(makeWav({ channels: 2, sampleRate: 48000, encoding: 'int16', samples: [1, -1, 2, -2], trailingBytes: 3 }));
  expect(p.dataLength).toBe(8);
  expect(p.droppedBytes).toBe(3);
  expect(p.frameCount).toBe(2);
});

test('clamps data size past end of file', () => {
  for (const dataSizeOverride of [0xffffffff, 1000]) {
    const p = parseWav(makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1, 2, 3], dataSizeOverride }));
    expect(p.frameCount).toBe(3);
  }
});

test('accepts an empty data chunk', () => {
  expect(parseWav(makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [] })).frameCount).toBe(0);
});

test.each([
  ['not_wave', () => makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1], riffType: 'AVI ' })],
  ['not_wave', () => new Uint8Array([1, 2, 3])],
  ['no_fmt', () => makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1], omitFmt: true })],
  ['unsupported_format', () => makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1], bitsPerSample: 24 })],
  [
    'bad_block_align',
    () => makeWav({ channels: 2, sampleRate: 48000, encoding: 'int16', samples: [1, 1], blockAlignOverride: 2 }),
  ],
])('rejects with %s', (code, make) => {
  let err: unknown;
  try {
    parseWav(make());
  } catch (e) {
    err = e;
  }
  expect(err).toBeInstanceOf(WavError);
  expect((err as WavError).code).toBe(code);
});
