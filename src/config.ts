/** Recording cap (handoff hard rule 14). */
export const MAX_RECORDING_MS = 20_000;
/** Takes shorter than this ask the player to try again. */
export const MIN_RECORDING_MS = 500;
/** Longest custom phrase, after trimming. */
export const CUSTOM_PHRASE_MAX = 60;
/** Bump to re-ask recording consent after the consent text changes. */
export const CONSENT_VERSION = 1;
/** Hosted privacy policy (source: src/pages/InvertalkPrivacy.tsx in the biszaal-tech-website repo). */
export const PRIVACY_POLICY_URL = 'https://www.biszaaltech.com/games/invertalk/privacy';
