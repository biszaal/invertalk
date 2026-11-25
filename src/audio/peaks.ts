import { parseWav } from './wav';

/**
 * Peak amplitude of a WAV in `buckets` equal slices of time, normalised so the
 * loudest slice is 1 (all zeros for silence). Used to draw a take's real
 * waveform. Takes the louder channel of each frame. Throws WavError for bytes
 * it cannot parse.
 */
export function waveformPeaks(bytes: Uint8Array, buckets: number): number[] {
  const { format, dataOffset, frameCount } = parseWav(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sampleSize = format.encoding === 'int16' ? 2 : 4;
  const peaks = new Array<number>(buckets).fill(0);

  for (let b = 0; b < buckets; b++) {
    const start = Math.floor((b * frameCount) / buckets);
    const end = Math.floor(((b + 1) * frameCount) / buckets);
    let peak = 0;
    for (let frame = start; frame < end; frame++) {
      const frameOffset = dataOffset + frame * format.blockAlign;
      for (let ch = 0; ch < format.channels; ch++) {
        const at = frameOffset + ch * sampleSize;
        const value =
          format.encoding === 'int16' ? Math.abs(view.getInt16(at, true)) / 32768 : Math.abs(view.getFloat32(at, true));
        if (value > peak) peak = value;
      }
    }
    peaks[b] = Number.isFinite(peak) ? peak : 0;
  }

  const loudest = Math.max(...peaks);
  return loudest > 0 ? peaks.map((p) => Math.min(p / loudest, 1)) : peaks;
}
