import { MIN_RECORDING_MS } from '@/config';

export type InterruptReason = 'call' | 'background' | 'error';

export function classifyTake(durationMs: number, minMs: number = MIN_RECORDING_MS): 'ok' | 'too_short' {
  return durationMs >= minMs ? 'ok' : 'too_short';
}
