import {
  challengeReducer,
  initialChallengeState,
  releasedUris,
  takeFileName,
  type ChallengeAction,
  type ChallengeState,
} from '../challenge';

const phrase = { source: 'preset', id: 'p03', text: 'Please pass the salt' } as const;

function run(...actions: ChallengeAction[]): ChallengeState {
  return actions.reduce(challengeReducer, initialChallengeState);
}

const start: ChallengeAction = { type: 'start', sessionId: 's1', phrase, now: 1000 };
const promptRaw: ChallengeAction = { type: 'recorded', role: 'prompt', rawUri: 'file:///p-raw.wav', durationMs: 1500 };
const promptRev: ChallengeAction = { type: 'reversed', role: 'prompt', revUri: 'file:///p-rev.wav' };
const imitRaw: ChallengeAction = { type: 'recorded', role: 'imitation', rawUri: 'file:///i-raw.wav', durationMs: 1700 };
const imitRev: ChallengeAction = { type: 'reversed', role: 'imitation', revUri: 'file:///i-rev.wav' };
const full = () => run(start, promptRaw, promptRev, imitRaw, imitRev);

test('start opens a session with take 1 for both roles', () => {
  expect(run(start)).toEqual({
    sessionId: 's1',
    phrase,
    promptTake: 1,
    imitationTake: 1,
    prompt: null,
    imitation: null,
    startedAt: 1000,
  });
});

test('recorded then reversed fill each take', () => {
  const s = full();
  expect(s.prompt).toEqual({ rawUri: 'file:///p-raw.wav', revUri: 'file:///p-rev.wav', durationMs: 1500 });
  expect(s.imitation).toEqual({ rawUri: 'file:///i-raw.wav', revUri: 'file:///i-rev.wav', durationMs: 1700 });
});

test('retryImitation keeps the prompt and releases only imitation files', () => {
  const before = full();
  const action: ChallengeAction = { type: 'retryImitation' };
  expect(releasedUris(before, action).sort()).toEqual(['file:///i-raw.wav', 'file:///i-rev.wav']);
  const after = challengeReducer(before, action);
  expect(after.imitation).toBeNull();
  expect(after.prompt).toEqual(before.prompt);
  expect(after.imitationTake).toBe(2);
});

test('rerecordPrompt clears both takes and releases all four files', () => {
  const before = full();
  const action: ChallengeAction = { type: 'rerecordPrompt' };
  expect(releasedUris(before, action).sort()).toEqual([
    'file:///i-raw.wav',
    'file:///i-rev.wav',
    'file:///p-raw.wav',
    'file:///p-rev.wav',
  ]);
  const after = challengeReducer(before, action);
  expect(after.prompt).toBeNull();
  expect(after.imitation).toBeNull();
  expect(after.promptTake).toBe(2);
  expect(after.imitationTake).toBe(2);
});

test('reset returns the initial state and releases every file', () => {
  const before = full();
  expect(releasedUris(before, { type: 'reset' })).toHaveLength(4);
  expect(challengeReducer(before, { type: 'reset' })).toEqual(initialChallengeState);
});

test('starting a new session releases the old session files', () => {
  const before = full();
  const next: ChallengeAction = { type: 'start', sessionId: 's2', phrase, now: 2000 };
  expect(releasedUris(before, next)).toHaveLength(4);
  expect(challengeReducer(before, next).sessionId).toBe('s2');
});

test('releasedUris omits reversed copies that do not exist yet', () => {
  const before = run(start, promptRaw, imitRaw);
  expect(releasedUris(before, { type: 'reset' }).sort()).toEqual(['file:///i-raw.wav', 'file:///p-raw.wav']);
});

test('recording over an existing take releases the old files', () => {
  const before = run(start, promptRaw, promptRev);
  const again: ChallengeAction = { type: 'recorded', role: 'prompt', rawUri: 'file:///p-raw-2.wav', durationMs: 900 };
  expect(releasedUris(before, again).sort()).toEqual(['file:///p-raw.wav', 'file:///p-rev.wav']);
});

test('retake file names never repeat', () => {
  const s = full();
  const imitBefore = takeFileName(s, 'imitation', 'raw');
  expect(takeFileName(challengeReducer(s, { type: 'retryImitation' }), 'imitation', 'raw')).not.toBe(imitBefore);
  const promptBefore = takeFileName(s, 'prompt', 'raw');
  expect(takeFileName(challengeReducer(s, { type: 'rerecordPrompt' }), 'prompt', 'raw')).not.toBe(promptBefore);
  expect(takeFileName(s, 'prompt', 'rev')).toBe('invertalk-s1-prompt-1-rev.wav');
});
