import { CONSENT_VERSION } from '@/config';

export type ConsentRecord = { version: number; acceptedAt: string };

/** Parses the stored consent file; anything missing or malformed counts as no consent. */
export function parseConsent(json: string | null): ConsentRecord | null {
  if (!json) return null;
  try {
    const value: unknown = JSON.parse(json);
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as ConsentRecord).version === 'number' &&
      typeof (value as ConsentRecord).acceptedAt === 'string'
    ) {
      const { version, acceptedAt } = value as ConsentRecord;
      return { version, acceptedAt };
    }
    return null;
  } catch {
    return null;
  }
}

export function isConsentCurrent(record: ConsentRecord | null, version: number = CONSENT_VERSION): boolean {
  return record !== null && record.version === version;
}
