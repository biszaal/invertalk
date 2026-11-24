import { deleteUris } from './cleanup';
import { expoFileOps } from './expoFileOps';

/** Deletes a file if it exists. Never throws: cleanup must not break the game. */
export function deleteFileQuietly(uri: string | null | undefined): void {
  deleteUris(expoFileOps, [uri]);
}
