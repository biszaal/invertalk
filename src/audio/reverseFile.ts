import { File } from 'expo-file-system';

import { deleteUris } from './cleanup';
import { expoFileOps } from './expoFileOps';
import { reverseWavBytes } from './reverseWav';
import { parseWav, WavError, type WavErrorCode } from './wav';

/** Opaque snake_case codes; safe to send as analytics `error_code`. */
export type ReverseErrorCode = 'read_failed' | 'write_failed' | WavErrorCode;

export class ReverseError extends Error {
  readonly code: ReverseErrorCode;
  constructor(code: ReverseErrorCode) {
    super(code);
    this.name = 'ReverseError';
    this.code = code;
    Object.setPrototypeOf(this, ReverseError.prototype);
  }
}

/**
 * Reads the WAV at `srcUri`, reverses its frames and writes a new WAV at
 * `destUri`. Never writes over the source. On a failed write, any partial
 * output is deleted.
 */
export async function reverseWavFile(
  srcUri: string,
  destUri: string
): Promise<{ uri: string; frameCount: number; sampleRate: number; elapsedMs: number }> {
  if (srcUri === destUri) throw new ReverseError('write_failed');
  const startedAt = Date.now();

  let input: Uint8Array;
  try {
    input = await new File(srcUri).bytes();
  } catch {
    throw new ReverseError('read_failed');
  }

  let output: Uint8Array;
  try {
    output = reverseWavBytes(input);
  } catch (e) {
    throw e instanceof WavError ? new ReverseError(e.code) : e;
  }

  const dest = new File(destUri);
  try {
    await dest.write(output);
  } catch {
    deleteUris(expoFileOps, [destUri]);
    throw new ReverseError('write_failed');
  }

  const { frameCount, format } = parseWav(output);
  return { uri: dest.uri, frameCount, sampleRate: format.sampleRate, elapsedMs: Date.now() - startedAt };
}
