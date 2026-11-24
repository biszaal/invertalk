import { isTempFileName } from './fileNames';

/** The file operations cleanup needs; the real one wraps expo-file-system. */
export interface FileOps {
  exists(uri: string): boolean;
  delete(uri: string): void;
  /** Entries directly in `dirUri`; [] when the directory is missing. */
  list(dirUri: string): { uri: string; name: string }[];
}

/**
 * Deletes each existing URI and returns the ones actually deleted. Skips
 * null/missing entries and keeps going past a delete that throws. Never throws.
 */
export function deleteUris(ops: FileOps, uris: readonly (string | null | undefined)[]): string[] {
  const deleted: string[] = [];
  for (const uri of uris) {
    if (!uri) continue;
    try {
      if (!ops.exists(uri)) continue;
      ops.delete(uri);
      deleted.push(uri);
    } catch {
      // Locked or vanished: skip it; the next launch sweep retries.
    }
  }
  return deleted;
}

/** Deletes leftover Invertalk temp WAVs in `dirUri` (and nothing else). */
export function sweepTempDir(ops: FileOps, dirUri: string): string[] {
  let entries: { uri: string; name: string }[];
  try {
    entries = ops.list(dirUri);
  } catch {
    return [];
  }
  return deleteUris(
    ops,
    entries.filter((e) => isTempFileName(e.name)).map((e) => e.uri)
  );
}
