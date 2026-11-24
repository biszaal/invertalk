import { MIN_RECORDING_MS } from '@/config';

export type InterruptReason = 'call' | 'background' | 'error';

export function classifyTake(durationMs: number, minMs: number = MIN_RECORDING_MS): 'ok' | 'too_short' {
  return durationMs >= minMs ? 'ok' : 'too_short';
}

export type AppStateLike = 'active' | 'inactive' | 'background' | 'unknown' | 'extension';

/**
 * Why a take in progress must stop, or null if it can continue.
 * Leaving the foreground is `background`; the stream stopping by itself while
 * the app is still in front (a call or another app taking the mic) is `call`.
 */
export function interruptionFor(appState: AppStateLike, streamRunning: boolean): InterruptReason | null {
  if (appState === 'background') return 'background';
  if (!streamRunning) return 'call';
  return null;
}
