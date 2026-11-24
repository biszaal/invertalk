import { Directory, File, Paths } from 'expo-file-system';

import type { FileOps } from './cleanup';
import { AUDIO_DIR } from './fileNames';

/** Real FileOps over expo-file-system. */
export const expoFileOps: FileOps = {
  exists: (uri) => new File(uri).exists,
  delete: (uri) => new File(uri).delete(),
  list: (dirUri) => {
    const dir = new Directory(dirUri);
    if (!dir.exists) return [];
    return dir
      .list()
      .filter((entry): entry is File => entry instanceof File)
      .map((file) => ({ uri: file.uri, name: file.name }));
  },
};

/** App-private cache folder for every temp recording; created on demand. */
export function audioDir(): Directory {
  const dir = new Directory(Paths.cache, AUDIO_DIR);
  dir.create({ idempotent: true });
  return dir;
}

export function audioFileUri(name: string): string {
  return new File(audioDir(), name).uri;
}
