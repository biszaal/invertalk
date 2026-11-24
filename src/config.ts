/** Recording cap (handoff hard rule 14). */
export const MAX_RECORDING_MS = 20_000;
/** Takes shorter than this ask the player to try again. */
export const MIN_RECORDING_MS = 500;
/** Longest custom phrase, after trimming. */
export const CUSTOM_PHRASE_MAX = 60;
/** Bump to re-ask recording consent after the consent text changes. */
export const CONSENT_VERSION = 1;
/** Hosted privacy policy. Must be replaced before any store submission. */
export const PRIVACY_POLICY_URL = 'https://example.com/invertalk-privacy-PLACEHOLDER';
export const PRIVACY_POLICY_IS_PLACEHOLDER = true;
