import { deleteUris, sweepTempDir, type FileOps } from '../cleanup';

/** In-memory FileOps: uri → name; `failOn` URIs throw on delete. */
class FakeOps implements FileOps {
  private files = new Map<string, string>();
  private failOn: Set<string>;

  constructor(uris: string[], opts: { failOn?: string[] } = {}) {
    for (const uri of uris) this.files.set(uri, uri.slice(uri.lastIndexOf('/') + 1));
    this.failOn = new Set(opts.failOn ?? []);
  }

  exists(uri: string) {
    return this.files.has(uri);
  }

  delete(uri: string) {
    if (this.failOn.has(uri)) throw new Error('locked');
    this.files.delete(uri);
  }

  list(dirUri: string) {
    const prefix = dirUri.endsWith('/') ? dirUri : `${dirUri}/`;
    return [...this.files.entries()]
      .filter(([uri]) => uri.startsWith(prefix))
      .map(([uri, name]) => ({ uri, name }));
  }
}

test('deleteUris deletes existing, skips missing and null, survives a failing delete', () => {
  const ops = new FakeOps(['file:///c/a.wav', 'file:///c/b.wav', 'file:///c/c.wav'], { failOn: ['file:///c/b.wav'] });
  expect(
    deleteUris(ops, ['file:///c/a.wav', null, 'file:///c/missing.wav', 'file:///c/b.wav', undefined, 'file:///c/c.wav'])
  ).toEqual(['file:///c/a.wav', 'file:///c/c.wav']);
  expect(ops.exists('file:///c/a.wav')).toBe(false);
  expect(ops.exists('file:///c/b.wav')).toBe(true);
});

test('sweepTempDir deletes only Invertalk temp WAVs', () => {
  const ops = new FakeOps([
    'file:///c/invertalk-audio/invertalk-k1-prompt-1-raw.wav',
    'file:///c/invertalk-audio/notes.txt',
  ]);
  expect(sweepTempDir(ops, 'file:///c/invertalk-audio')).toEqual([
    'file:///c/invertalk-audio/invertalk-k1-prompt-1-raw.wav',
  ]);
  expect(ops.exists('file:///c/invertalk-audio/notes.txt')).toBe(true);
});

test('sweepTempDir on a missing dir returns []', () => {
  expect(sweepTempDir(new FakeOps([]), 'file:///c/nope')).toEqual([]);
});
