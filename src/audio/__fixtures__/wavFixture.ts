/**
 * Test-only RIFF/WAVE builder (little-endian). Never imported by app code.
 * Lives outside __tests__/ because Jest treats every file there as a suite.
 */
export type MakeWavOptions = {
  channels: number;
  sampleRate: number;
  encoding: 'int16' | 'float32';
  /** Interleaved samples: int16 integers or float32 values. */
  samples: number[];
  formatTag?: 1 | 3 | 0xfffe;
  /** Extra chunks between `fmt ` and `data`, filled with 0xAB; odd sizes get a pad byte. */
  chunksBeforeData?: { id: string; size: number }[];
  /** Bytes of 0x7F appended inside the data chunk (counted in its size). */
  trailingBytes?: number;
  dataSizeOverride?: number;
  riffType?: string;
  omitFmt?: boolean;
  bitsPerSample?: number;
  blockAlignOverride?: number;
};

const GUID_TAIL = [0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x80, 0x00, 0x00, 0xaa, 0x00, 0x38, 0x9b, 0x71];

export function makeWav(o: MakeWavOptions): Uint8Array {
  const sampleBytes = o.encoding === 'int16' ? 2 : 4;
  const bitsPerSample = o.bitsPerSample ?? sampleBytes * 8;
  const blockAlign = o.blockAlignOverride ?? (o.channels * bitsPerSample) / 8;
  const formatTag = o.formatTag ?? (o.encoding === 'int16' ? 1 : 3);
  const trailing = o.trailingBytes ?? 0;

  const chunks: Uint8Array[] = [];

  if (!o.omitFmt) {
    const extensible = formatTag === 0xfffe;
    const fmt = new DataView(new ArrayBuffer(extensible ? 40 : 16));
    fmt.setUint16(0, formatTag, true);
    fmt.setUint16(2, o.channels, true);
    fmt.setUint32(4, o.sampleRate, true);
    fmt.setUint32(8, o.sampleRate * blockAlign, true);
    fmt.setUint16(12, blockAlign, true);
    fmt.setUint16(14, bitsPerSample, true);
    if (extensible) {
      fmt.setUint16(16, 22, true); // cbSize
      fmt.setUint16(18, bitsPerSample, true); // valid bits
      fmt.setUint32(20, o.channels === 1 ? 0x4 : 0x3, true); // channel mask
      fmt.setUint16(24, o.encoding === 'int16' ? 1 : 3, true); // SubFormat GUID head
      GUID_TAIL.forEach((b, i) => fmt.setUint8(26 + i, b));
    }
    chunks.push(chunk('fmt ', new Uint8Array(fmt.buffer)));
  }

  for (const extra of o.chunksBeforeData ?? []) {
    chunks.push(chunk(extra.id, new Uint8Array(extra.size).fill(0xab)));
  }

  const payload = new DataView(new ArrayBuffer(o.samples.length * sampleBytes + trailing));
  o.samples.forEach((s, i) => {
    if (o.encoding === 'int16') payload.setInt16(i * 2, s, true);
    else payload.setFloat32(i * 4, s, true);
  });
  for (let i = 0; i < trailing; i++) payload.setUint8(o.samples.length * sampleBytes + i, 0x7f);
  chunks.push(chunk('data', new Uint8Array(payload.buffer), o.dataSizeOverride));

  const bodyLength = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(12 + bodyLength);
  const view = new DataView(out.buffer);
  writeId(out, 0, 'RIFF');
  view.setUint32(4, 4 + bodyLength, true);
  writeId(out, 8, o.riffType ?? 'WAVE');
  let offset = 12;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function chunk(id: string, body: Uint8Array, sizeOverride?: number): Uint8Array {
  const pad = body.length % 2;
  const out = new Uint8Array(8 + body.length + pad);
  writeId(out, 0, id);
  new DataView(out.buffer).setUint32(4, sizeOverride ?? body.length, true);
  out.set(body, 8);
  return out;
}

function writeId(bytes: Uint8Array, offset: number, id: string) {
  for (let i = 0; i < 4; i++) bytes[offset + i] = id.charCodeAt(i);
}
