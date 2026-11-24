import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

import { toPayload, type AnalyticsEvent } from './events';

let client: PostHog | null = null;

/**
 * PostHog with everything automatic switched off: no session replay, no
 * touch autocapture (no PostHogProvider — it reads tapped labels, which
 * include phrase text), no lifecycle events, no exception autocapture
 * (messages can contain file paths), no IP geolocation, and no device name
 * (often the owner's name on Android). Without a key, analytics is a no-op.
 */
export function initAnalytics(): void {
  if (client) return;
  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;
  try {
    client = new PostHog(apiKey, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      enableSessionReplay: false,
      captureAppLifecycleEvents: false,
      errorTracking: { autocapture: false },
      disableGeoip: true,
      personProfiles: 'never',
      customAppProperties: (properties) => ({ ...properties, $device_name: null }),
    });
  } catch {
    client = null; // analytics must never break the game
  }
}

/** Sends one allowlisted event; properties pass through toPayload's filter. */
export function track(e: AnalyticsEvent): void {
  if (!client) return;
  const { event, properties } = toPayload(e, Platform.OS === 'ios' ? 'ios' : 'android');
  try {
    client.capture(event, properties);
  } catch {
    // Never let analytics affect play.
  }
}
