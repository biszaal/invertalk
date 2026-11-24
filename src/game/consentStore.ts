import { File, Paths } from 'expo-file-system';

import { CONSENT_VERSION } from '@/config';

import { parseConsent, type ConsentRecord } from './consent';

const CONSENT_FILE = 'invertalk-consent.json';

/** Consent lives in app-private documents (not the cache, which the OS may clear). */
export async function readConsent(): Promise<ConsentRecord | null> {
  try {
    const file = new File(Paths.document, CONSENT_FILE);
    if (!file.exists) return null;
    return parseConsent(await file.text());
  } catch {
    return null;
  }
}

export async function acceptConsent(now: Date): Promise<void> {
  const record: ConsentRecord = { version: CONSENT_VERSION, acceptedAt: now.toISOString() };
  await new File(Paths.document, CONSENT_FILE).write(JSON.stringify(record));
}
