import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { deleteFileQuietly } from '@/audio/deleteFileQuietly';

import { RecordTake } from '../RecordTake';

// A fake native mockStream: records "into" whatever URI it is given.
const mockStream = {
  start: jest.fn(async () => {}),
  stop: jest.fn(),
  startFileRecordingAsync: jest.fn(async (opts: { uri?: string }) => ({ uri: opts.uri ?? 'file:///auto.wav' })),
  stopFileRecordingAsync: jest.fn(async () => ({
    uri: 'file:///take.wav',
    duration: 20,
    size: 1_920_044,
    sampleRate: 48000,
    channels: 1,
    encoding: 'int16' as const,
  })),
};

jest.mock('expo-audio', () => ({ useAudioStream: () => ({ stream: mockStream, isStreaming: false }) }));
jest.mock('@/audio/audioMode', () => ({ setRecordingAudioMode: jest.fn(async () => {}) }));
jest.mock('@/audio/permissions', () => ({
  ensureMicPermission: jest.fn(async () => ({ status: 'granted', prompted: false })),
}));
jest.mock('@/audio/deleteFileQuietly', () => ({ deleteFileQuietly: jest.fn() }));
jest.mock('@/analytics', () => ({ track: jest.fn() }));
jest.mock('expo-router', () => ({ router: { push: jest.fn(), back: jest.fn() } }));

const deleteMock = deleteFileQuietly as jest.Mock;

beforeEach(() => {
  // Keep the scheduling the Testing Library uses to flush real; fake only the app's own timers.
  jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick', 'queueMicrotask'] });
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

/** Let the press handler's chain of awaits (permission → audio mode → native start) settle. */
async function flush() {
  for (let i = 0; i < 10; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function startRecording() {
  await fireEvent.press(screen.getByLabelText('Start recording'));
  await flush();
}

test('after a take auto-stops at 20 s, Record is locked until the next take', async () => {
  const onRecorded = jest.fn();
  await render(<RecordTake role="prompt" targetUri="file:///p-1.wav" onRecorded={onRecorded} />);

  await startRecording();
  expect(mockStream.start).toHaveBeenCalledTimes(1);

  await act(async () => {
    jest.advanceTimersByTime(20_000);
  });
  await flush();
  expect(screen.getByText('Stopped at 20 seconds.')).toBeTruthy();

  // Tapping Record during the hand-off pause must not start a second take.
  await startRecording();
  expect(mockStream.start).toHaveBeenCalledTimes(1);

  await act(async () => {
    jest.advanceTimersByTime(1_200);
  });
  expect(onRecorded).toHaveBeenCalledTimes(1);
});

test('a new target (retake) unlocks Record again', async () => {
  const onRecorded = jest.fn();
  const view = await render(<RecordTake role="prompt" targetUri="file:///p-1.wav" onRecorded={onRecorded} />);

  await startRecording();
  await fireEvent.press(screen.getByLabelText('Stop recording'));
  await flush();
  expect(onRecorded).toHaveBeenCalledTimes(1);

  await view.rerender(<RecordTake role="prompt" targetUri="file:///p-2.wav" onRecorded={onRecorded} />);
  await startRecording();
  expect(mockStream.start).toHaveBeenCalledTimes(2);
  expect(mockStream.startFileRecordingAsync).toHaveBeenLastCalledWith({ uri: 'file:///p-2.wav', format: 'wav' });
});

test('an existing file at the target is deleted before recording (native writers append)', async () => {
  await render(<RecordTake role="prompt" targetUri="file:///p-1.wav" onRecorded={jest.fn()} />);
  await startRecording();

  const deleteOrder = deleteMock.mock.calls.findIndex(([uri]) => uri === 'file:///p-1.wav');
  expect(deleteOrder).toBeGreaterThanOrEqual(0);
  expect(deleteMock.mock.invocationCallOrder[deleteOrder]).toBeLessThan(
    mockStream.startFileRecordingAsync.mock.invocationCallOrder[0]
  );
});

test('if starting the file recording throws, the target file is deleted', async () => {
  mockStream.startFileRecordingAsync.mockRejectedValueOnce(new Error('disk full'));
  await render(<RecordTake role="prompt" targetUri="file:///p-1.wav" onRecorded={jest.fn()} />);
  await startRecording();

  const lastDelete = deleteMock.mock.invocationCallOrder.at(-1) ?? 0;
  expect(deleteMock.mock.calls.at(-1)).toEqual(['file:///p-1.wav']);
  expect(lastDelete).toBeGreaterThan(mockStream.startFileRecordingAsync.mock.invocationCallOrder[0]);
  expect(screen.getByText('Something went wrong while recording. Nothing was saved.')).toBeTruthy();
});
