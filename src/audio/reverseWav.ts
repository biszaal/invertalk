import { parseWav, writeWav } from './wav';

/**
 * Returns a new WAV whose frames are in reverse order. Each frame (all
 * channels' samples for one instant) is copied whole, byte for byte, so
 * stereo stays paired and float bit patterns are untouched — samples are
 * never routed through Float32Array/Float64Array, which can rewrite NaN bits.
 * Throws WavError for input it cannot parse. Never mutates `input`.
 */
export function reverseWavBytes(input: Uint8Array): Uint8Array {
  const { format, dataOffset, frameCount } = parseWav(input);
  const frameSize = format.blockAlign;
  const reversed = new Uint8Array(frameCount * frameSize);

  for (let frame = 0; frame < frameCount; frame++) {
    const from = dataOffset + (frameCount - 1 - frame) * frameSize;
    const to = frame * frameSize;
    for (let b = 0; b < frameSize; b++) reversed[to + b] = input[from + b];
  }

  return writeWav(format, reversed);
}
