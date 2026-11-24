/** Every temp recording lives in Paths.cache/<AUDIO_DIR>. */
export const AUDIO_DIR = 'invertalk-audio';

export type FileRole = 'prompt' | 'imitation' | 'dev';
export type FileKind = 'raw' | 'rev' | 'rev2';

const TEMP_NAME = /^invertalk-[a-z0-9]+-(prompt|imitation|dev)-\d+-(raw|rev|rev2)\.wav$/;

/** `invertalk-<sessionId>-<role>-<take>-<kind>.wav` — a new take never reuses a name. */
export function tempFileName(p: { sessionId: string; role: FileRole; take: number; kind: FileKind }): string {
  return `invertalk-${p.sessionId}-${p.role}-${p.take}-${p.kind}.wav`;
}

export function isTempFileName(name: string): boolean {
  return TEMP_NAME.test(name);
}

export function newSessionId(now: number = Date.now(), random: () => number = Math.random): string {
  return now.toString(36) + Math.floor(random() * 36 ** 4).toString(36);
}
