export type WavEncoding = 'int16' | 'float32';

export type WavFormat = {
  encoding: WavEncoding;
  channels: number;
  sampleRate: number;
  bitsPerSample: 16 | 32;
  blockAlign: number;
};

export type ParsedWav = {
  format: WavFormat;
  /** Byte offset of the first sample in the source bytes. */
  dataOffset: number;
  /** Bytes of whole frames only. */
  dataLength: number;
  frameCount: number;
  /** Bytes of a trailing partial frame that were left out. */
  droppedBytes: number;
};

/** Opaque snake_case codes; safe to send as analytics `error_code`. */
export type WavErrorCode = 'not_wave' | 'no_fmt' | 'no_data' | 'unsupported_format' | 'bad_block_align';

export class WavError extends Error {
  readonly code: WavErrorCode;
  constructor(code: WavErrorCode) {
    super(code);
    this.name = 'WavError';
    this.code = code;
    Object.setPrototypeOf(this, WavError.prototype);
  }
}

const TAG_PCM = 1;
const TAG_FLOAT = 3;
const TAG_EXTENSIBLE = 0xfffe;

/**
 * Parses a RIFF/WAVE file by walking its chunks (never assumes `data` at
 * offset 44). Accepts 16-bit PCM and 32-bit IEEE float, including
 * WAVE_FORMAT_EXTENSIBLE. A `data` size larger than the bytes present (a take
 * cut off mid-write) is clamped to what exists; a trailing partial frame is
 * dropped.
 */
export function parseWav(bytes: Uint8Array): ParsedWav {
  if (bytes.length < 12 || readId(bytes, 0) !== 'RIFF' || readId(bytes, 8) !== 'WAVE') {
    throw new WavError('not_wave');
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let format: WavFormat | null = null;
  let data: { start: number; available: number } | null = null;

  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = readId(bytes, offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ') format = readFormat(view, body, size);
    else if (id === 'data' && !data) data = { start: body, available: Math.min(size, bytes.length - body) };
    offset = body + size + (size % 2);
  }

  if (!format) throw new WavError('no_fmt');
  if (!data) throw new WavError('no_data');

  const dataLength = data.available - (data.available % format.blockAlign);
  return {
    format,
    dataOffset: data.start,
    dataLength,
    frameCount: dataLength / format.blockAlign,
    droppedBytes: data.available - dataLength,
  };
}

function readFormat(view: DataView, body: number, size: number): WavFormat {
  if (size < 16 || body + 16 > view.byteLength) throw new WavError('unsupported_format');
  let tag = view.getUint16(body, true);
  const channels = view.getUint16(body + 2, true);
  const sampleRate = view.getUint32(body + 4, true);
  const blockAlign = view.getUint16(body + 12, true);
  const bitsPerSample = view.getUint16(body + 14, true);

  if (tag === TAG_EXTENSIBLE) {
    if (size < 40 || body + 26 > view.byteLength) throw new WavError('unsupported_format');
    tag = view.getUint16(body + 24, true); // first two bytes of the SubFormat GUID
  }

  let encoding: WavEncoding;
  if (tag === TAG_PCM && bitsPerSample === 16) encoding = 'int16';
  else if (tag === TAG_FLOAT && bitsPerSample === 32) encoding = 'float32';
  else throw new WavError('unsupported_format');

  if (channels < 1 || sampleRate < 1) throw new WavError('unsupported_format');
  if (blockAlign !== (channels * bitsPerSample) / 8) throw new WavError('bad_block_align');

  return { encoding, channels, sampleRate, bitsPerSample: encoding === 'int16' ? 16 : 32, blockAlign };
}

function readId(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
}
