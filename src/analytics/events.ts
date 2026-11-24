import type { MicStatus } from '@/audio/permissions';
import type { InterruptReason } from '@/audio/recordingRules';
import type { Role } from '@/game/challenge';

/**
 * The only events Invertalk sends (handoff allowlist). `platform` is added by
 * toPayload. Never: audio, file URIs, phrase text, user-entered strings.
 */
export type AnalyticsEvent =
  | { name: 'consent_shown' }
  | { name: 'consent_accepted' }
  | { name: 'consent_declined' }
  | { name: 'challenge_started'; phrase_source: 'preset'; phrase_id: string }
  | { name: 'challenge_started'; phrase_source: 'custom' }
  | { name: 'permission_result'; status: MicStatus }
  | {
      name: 'recording_completed';
      role: Role;
      duration_ms: number;
      sample_rate: number;
      channels: number;
      encoding: 'int16' | 'float32' | 'other';
    }
  | { name: 'recording_interrupted'; role: Role; reason: InterruptReason }
  | { name: 'reversal_completed'; role: Role; success: boolean; duration_ms: number; error_code?: string }
  | { name: 'challenge_finished'; total_duration_ms: number }
  | { name: 'share_clicked'; share_type: 'audio' }
  | { name: 'share_completed'; share_type: 'audio'; success: boolean }
  | { name: 'app_error'; error_code: string; screen: string };

export type EventName = AnalyticsEvent['name'];
export type Platform = 'ios' | 'android';

export const ALLOWED_PROPS: Record<EventName, readonly string[]> = {
  consent_shown: [],
  consent_accepted: [],
  consent_declined: [],
  challenge_started: ['phrase_source', 'phrase_id'],
  permission_result: ['status'],
  recording_completed: ['role', 'duration_ms', 'sample_rate', 'channels', 'encoding'],
  recording_interrupted: ['role', 'reason'],
  reversal_completed: ['role', 'success', 'duration_ms', 'error_code'],
  challenge_finished: ['total_duration_ms'],
  share_clicked: ['share_type'],
  share_completed: ['share_type', 'success'],
  app_error: ['error_code', 'screen'],
};

/** Every string value must look like an enum/id token; anything else (phrase text, paths) is redacted. */
const TOKEN = /^[a-z0-9_]{1,40}$/;

export function toPayload(
  e: AnalyticsEvent,
  platform: Platform
): { event: EventName; properties: Record<string, string | number | boolean> } {
  const source = e as unknown as Record<string, unknown>;
  const properties: Record<string, string | number | boolean> = { platform };
  for (const key of ALLOWED_PROPS[e.name]) {
    if (key === 'phrase_id' && source.phrase_source !== 'preset') continue;
    const value = source[key];
    if (typeof value === 'string') properties[key] = TOKEN.test(value) ? value : 'redacted';
    else if (typeof value === 'number' && Number.isFinite(value)) properties[key] = value;
    else if (typeof value === 'boolean') properties[key] = value;
  }
  return { event: e.name, properties };
}

/** `/permission-denied` → `permission_denied`; `/` → `home`. */
export function screenName(pathname: string | undefined): string {
  if (!pathname) return 'unknown';
  const name = pathname.replace(/^\/+/, '').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  return name || 'home';
}
