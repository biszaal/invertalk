# Invertalk MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Invertalk — a local two-player pass-and-play game where Player 2 imitates Player 1's phrase played backwards and the app reverses the imitation for the reveal — on iOS and Android development builds, QA'd and ready to consider store submission by Mon 30 Nov 2026.

**Architecture:** Expo SDK 58 app (TypeScript, Expo Router under `src/app`). Audio is recorded straight to WAV by `expo-audio`'s `useAudioStream` + `startFileRecordingAsync`, reversed frame-by-frame in pure TypeScript (`src/audio/wav.ts`, `reverseWav.ts`), and played with `useAudioPlayer`. Game flow is a pure reducer (`src/game/challenge.ts`) behind a React context; every temp file lives in one cache subfolder and is deleted through tested helpers. Nothing leaves the device except allowlisted PostHog events (Phase 5).

**Tech Stack:** Expo SDK 58 (`expo@~58.0.26`, RN 0.88.1, React 19.3, TS 6.0), expo-router, expo-audio ~58.0.12, expo-file-system ~58.0.14, expo-sharing ~58.0.23, expo-dev-client, expo-constants, Jest 30 + jest-expo ~58.0.15, EAS Build, posthog-react-native 4.x (Phase 5).

**Spec:** `docs/superpowers/specs/2026-11-24-invertalk-design.md`, which defers to the Notion page "Reverse Audio Challenge — Game Design & Build Plan" and the handoff (Notion page "Invertalk — Claude Code Handoff"; the repo copy `CLAUDE_HANDOFF.md` was removed after the build and is in git history). Read the handoff's **Hard rules**, **Screens and flow** and **Analytics** sections before any task.

**Working directory:** `/Users/bishalaryal/Documents/Github/invertalk` (the app lives at the root, beside `CLAUDE_HANDOFF.md`).

**Phase gates:** each phase ends with a **Checkpoint** that Bishal runs on a real iPhone and a real Android phone. Stop at every checkpoint. Do not start the next phase until he confirms it passed.

## Global Constraints

- App name `Invertalk`; slug `invertalk`; scheme `invertalk`; `ios.bundleIdentifier` and `android.package` = `com.biszaal.invertalk`.
- Microphone string (verbatim): `$(PRODUCT_NAME) records your voice on this device so you can play a phrase backwards and hear a friend's imitation. Recordings stay on your phone and are deleted after the game.`
- `expo-audio` plugin: `recordAudioAndroid: true`, `enableBackgroundRecording: false`, `enableBackgroundPlayback: false`.
- Never install `expo-av`, ffmpeg, `ffmpeg-kit-react-native`, or `posthog-react-native-session-replay`. Do not enable `expo-file-system` file sharing (`enableFileSharing` / `supportsOpeningDocumentsInPlace`).
- Record WAV only (`format: 'wav'`). Never fall back to `.m4a`/AAC. Never reverse raw bytes; reverse whole frames.
- Recording cap 20 000 ms (`MAX_RECORDING_MS`); minimum useful take 500 ms (`MIN_RECORDING_MS`); custom phrase ≤ 60 characters (`CUSTOM_PHRASE_MAX`).
- All temp audio lives in `Paths.cache/invertalk-audio/`, named `invertalk-<sessionId>-<role>-<take>-<kind>.wav`.
- No phrase text, audio, file URIs or user-entered strings in analytics, `console.*` output, or error reports. Not even in dev logs: show debug info on screen in the dev screen instead.
- No scoring, ads, IAP, accounts, servers, video export, silence trimming, result card.
- Player 2 must never be able to see the phrase from Prompt, Imitate or Reveal without an explicit Player-1-only confirm.
- Default share has no caption; `dialogTitle` is `Share your Invertalk reveal`.
- Development builds only (no Expo Go). iOS builds run on EAS (local Xcode is beta-only).
- Tests live in `src/**/__tests__/*.test.ts` (never under `src/app`, which is routes only). Run with `npm test`.
- Commit after every task with a conventional message ending in `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. No remote push.

## Review Focus

1. **Device writes a different WAV shape than requested** (float32, `WAVE_FORMAT_EXTENSIBLE` 0xFFFE, a `fact`/`LIST` chunk, odd-sized chunk with pad byte): the reveal must still work. Pinned by Task 4 tests `parses extensible float32`, `skips odd-sized chunk with pad byte`.
2. **A take cut off mid-write** (header data size larger than the bytes on disk, or 0xFFFFFFFF): parse the bytes that exist, drop the partial frame, never throw. Pinned by Task 4 test `clamps data size past end of file`.
3. **Retake plays the old audio** because a new take reused the same file URI and the player cached it: every take gets a new file name. Pinned by Task 9 test `retake file names never repeat`.
4. **Phrase text or a file path leaks into analytics** through any string property, including error codes: the payload builder drops any string that is not a short snake_case token. Pinned by Task 19 tests `redacts non-token strings` and `drops unknown properties`.
5. **Player 2 swipes or presses back from Prompt** and lands on the Record screen showing the phrase: swipe-back disabled, hardware back and "Re-record phrase" go through a Player-1-only confirm. Pinned by Task 14 device-check step.

---

## File map

| File | Responsibility | Task |
| --- | --- | --- |
| `app.json`, `eas.json`, `package.json`, `tsconfig.json`, `.gitignore` | Config | 1, 2, 20 |
| `src/config.ts` | Constants: limits, privacy URL, consent version | 3 |
| `src/audio/recordingRules.ts` | `classifyTake`, `interruptionFor` (pure) | 3, 18 |
| `src/audio/audioMode.ts` | `setRecordingAudioMode`, `resetAudioMode` | 3 |
| `src/audio/permissions.ts` | `ensureMicPermission` | 3 |
| `src/audio/useWavRecorder.ts` | Record-to-WAV hook (start/stop/auto-stop/cancel; interruptions in 18) | 3, 18 |
| `src/audio/wav.ts` | `parseWav`, `writeWav`, `WavError` | 4, 5 |
| `src/audio/reverseWav.ts` | `reverseWavBytes` | 5 |
| `src/audio/fileNames.ts` | `tempFileName`, `isTempFileName`, `newSessionId`, `AUDIO_DIR` | 6 |
| `src/audio/cleanup.ts` | `FileOps`, `deleteUris`, `sweepTempDir` | 6 |
| `src/audio/expoFileOps.ts` | Real `FileOps` + `audioDir()` over expo-file-system | 7 |
| `src/audio/reverseFile.ts` | `reverseWavFile` (read → reverse → write) | 7 |
| `src/audio/__tests__/wavFixture.ts` | `makeWav` test-only WAV builder | 4 |
| `src/game/phrases.ts` | Starter pack, `checkCustomPhrase`, `Phrase` type | 8 |
| `src/game/challenge.ts` | Session reducer, `releasedUris`, `takeFileName` | 9 |
| `src/game/ChallengeProvider.tsx` | Context: reducer + file deletion + audio mode reset | 11 |
| `src/game/consent.ts`, `src/game/consentStore.ts` | Consent parse/check (pure) + file persistence | 10 |
| `src/share/shareReveal.ts` | `canShare`, `shareReveal` | 16 |
| `src/analytics/events.ts` | Event types, allowlist, `toPayload` | 19 |
| `src/analytics/index.ts` | `initAnalytics`, `track` | 19 |
| `src/ui/*` | `theme.ts`, `Screen`, `Button`, `RecordButton`, `ElapsedTimer`, `PlayButton`, `Notice`, `RecordTake` | 3, 11, 13 |
| `src/app/_layout.tsx` | Stack, provider, launch sweep, (19) global error handler | 3, 7, 11, 19 |
| `src/app/index.tsx` | Home | 3 (temp), 11 |
| `src/app/dev-audio.tsx` | `__DEV__`-only audio spike / QA screen | 3, 7; deleted in 20 |
| `src/app/consent.tsx`, `phrase.tsx`, `record.tsx`, `prompt.tsx`, `imitate.tsx`, `reveal.tsx` | Game screens | 11–15 |
| `src/app/settings.tsx`, `permission-denied.tsx` | Phase 4 screens | 17, 18 |
| `docs/store/store-notes.md`, `docs/qa/qa-matrix.md` | Store answers, QA sheet | 20 |

---

## Phase 1 — Tue 24 Nov: repo, config, WAV record + playback

### Task 1: Scaffold the Expo SDK 58 app in place

**Files:**
- Create: everything from the `default@sdk-58` template at the repo root
- Modify: `app.json`, `package.json`, `tsconfig.json`, `.gitignore`
- Delete: template demo code (`src/components`, `src/hooks`, `src/constants`, `src/global.css`, `src/app/explore.tsx`, `scripts/`, demo images)

**Interfaces:**
- Produces: a configured project where `npm test`, `npx tsc --noEmit` and `npx expo config` all run.

- [ ] **Step 1: Generate the template outside the repo and copy it in** (the root already holds `CLAUDE_HANDOFF.md` and `docs/`, and `create-expo-app` would otherwise nest a second `invertalk/`). Use your scratch directory for `SCAFFOLD`:

```bash
SCAFFOLD="<scratch-dir>/scaffold"
npx create-expo-app@latest "$SCAFFOLD/invertalk" --template default@sdk-58 --no-install --no-agents-md --yes
rm -rf "$SCAFFOLD/invertalk/.git"
rsync -a "$SCAFFOLD/invertalk/" /Users/bishalaryal/Documents/Github/invertalk/
rm -rf "$SCAFFOLD"
```

Expected: `package.json` at the root with `"expo": "~58.0.26"`, and `CLAUDE_HANDOFF.md` and `docs/` untouched.

- [ ] **Step 2: Remove template demo code.** Delete `src/components`, `src/hooks`, `src/constants`, `src/global.css`, `src/app/explore.tsx`, `scripts/`, and from `assets/images` delete `expo-badge*.png`, `expo-logo.png`, `logo-glow.png`, `react-logo*.png`, `tutorial-web.png`, `tabIcons/`. Remove the `reset-project` script from `package.json`. (Do not run `npm run reset-project`; it is interactive.) Keep `icon.png`, `splash-icon.png`, `favicon.png`, `android-icon-*.png`, `assets/expo.icon`.

- [ ] **Step 3: Install dependencies**

```bash
npm install
npx expo install expo-audio expo-sharing expo-file-system expo-dev-client
npx expo install jest-expo jest @types/jest -- --save-dev
```

Expected: `expo-audio` ~58.0.12, `expo-sharing` ~58.0.23, `expo-file-system` ~58.0.14, `jest-expo` ~58.0.15 in `package.json`. `grep -c '"expo-av"' package.json` prints `0`.

- [ ] **Step 4: Edit config.**
  - `app.json` → `expo.name: "Invertalk"`, `slug: "invertalk"`, `scheme: "invertalk"`, `ios.bundleIdentifier` and `android.package`: `"com.biszaal.invertalk"`, `ios.buildNumber: "1"`, `android.versionCode: 1`. Append to `plugins`: `["expo-audio", { "microphonePermission": "<Global Constraints string>", "recordAudioAndroid": true, "enableBackgroundRecording": false, "enableBackgroundPlayback": false }]`. Leave the splash and router plugins.
  - `package.json` → `"scripts.test": "jest"`, top-level `"jest": { "preset": "jest-expo" }`.
  - `tsconfig.json` → add `"types": ["jest"]` under `compilerOptions` (keep `strict: true` and the `@/*` path alias).
  - `.gitignore` → add `.env` (keep the template's `.env*.local`, `/ios`, `/android`).

- [ ] **Step 5: Verify the native config the plugin produces**

Run: `npx expo config --type introspect --json > "<scratch-dir>/introspect.json"` and inspect it.
Expected: iOS `NSMicrophoneUsageDescription` equals the approved string; **no** `UIBackgroundModes` key; Android permissions include `android.permission.RECORD_AUDIO` and do **not** include `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` or `FOREGROUND_SERVICE_MICROPHONE`.

- [ ] **Step 6: Make the app compile with a placeholder route.** Write `src/app/_layout.tsx` as a bare `<Stack />` from `expo-router` (no splash `preventAutoHideAsync`) and `src/app/index.tsx` showing the text `Invertalk`.

Run: `npx tsc --noEmit && npm test -- --passWithNoTests`
Expected: both exit 0.

- [ ] **Step 7: Initialise git and commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Invertalk on Expo SDK 58"
```

### Task 2: EAS development builds

**Files:**
- Create: `eas.json`

**Interfaces:**
- Produces: `eas build --profile development --platform ios|android`.

- [ ] **Step 1: Look up the SDK 58 build image.** Read the EAS infrastructure page (https://docs.expo.dev/build-reference/infrastructure/) and note the macOS image that SDK 58's `default`/`auto` uses. It must be Xcode 26 or newer (Bishal's standing rule: Apple rejects uploads built with older SDKs, `ITMS-90725`).

- [ ] **Step 2: Write `eas.json`**

```json
{
  "cli": { "version": ">= 18.0.0", "appVersionSource": "local" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "image": "<image from Step 1>" }
    }
  }
}
```

- [ ] **Step 3: Commit** — `git add eas.json && git commit -m "chore: add EAS development profile"`.

- [ ] **Step 4: Hand Bishal the commands he must run himself** (interactive or account-bound; do not run them):

```bash
eas login
eas init                       # links the project; writes extra.eas.projectId + owner into app.json
eas device:create              # register the iPhone for internal distribution (open the link on the phone)
eas build --profile development --platform ios
eas build --profile development --platform android
npx expo start --dev-client    # then open the project from the installed dev build
```

Tell him to commit the `app.json` change `eas init` makes.

### Task 3: WAV record + playback spike

**Files:**
- Create: `src/config.ts`, `src/audio/recordingRules.ts`, `src/audio/__tests__/recordingRules.test.ts`, `src/audio/audioMode.ts`, `src/audio/permissions.ts`, `src/audio/useWavRecorder.ts`, `src/ui/PlayButton.tsx`, `src/app/dev-audio.tsx`
- Modify: `src/app/index.tsx`

**Interfaces:**
- Produces:
  - `src/config.ts`: `MAX_RECORDING_MS = 20_000`, `MIN_RECORDING_MS = 500`, `CUSTOM_PHRASE_MAX = 60`, `CONSENT_VERSION = 1`, `PRIVACY_POLICY_URL = 'https://example.com/invertalk-privacy-PLACEHOLDER'`, `PRIVACY_POLICY_IS_PLACEHOLDER = true`.
  - `classifyTake(durationMs: number, minMs?: number): 'ok' | 'too_short'`
  - `setRecordingAudioMode(): Promise<void>`; `resetAudioMode(): Promise<void>`
  - `type MicStatus = 'granted' | 'denied' | 'undetermined'`; `ensureMicPermission(): Promise<{ status: MicStatus; prompted: boolean }>`
  - `type InterruptReason = 'call' | 'background' | 'error'` (exported from `src/audio/recordingRules.ts`)
  - `type TakeResult = { kind: 'ok'; uri: string; durationMs: number; sampleRate: number; channels: number; encoding: 'int16' | 'float32'; hitMax: boolean } | { kind: 'too_short' } | { kind: 'interrupted'; reason: InterruptReason }`
  - `useWavRecorder(opts: { onFinished: (r: TakeResult) => void; maxMs?: number; sampleRate?: number; channels?: number; encoding?: 'int16' | 'float32' }): { isRecording: boolean; elapsedMs: number; start(targetUri?: string): Promise<void>; stop(): Promise<void>; cancel(): Promise<void> }`
  - `<PlayButton uri: string | null; label: string; accessibilityLabel?: string; variant?: 'primary' | 'secondary' />`

- [ ] **Step 1: Write the failing test** `src/audio/__tests__/recordingRules.test.ts`

```ts
import { classifyTake } from '../recordingRules';
test('classifyTake boundaries', () => {
  expect(classifyTake(0)).toBe('too_short');
  expect(classifyTake(499)).toBe('too_short');
  expect(classifyTake(500)).toBe('ok');
  expect(classifyTake(20_000)).toBe('ok');
});
```

- [ ] **Step 2: Run** `npm test -- recordingRules` → FAIL (module not found).

- [ ] **Step 3: Implement** `src/config.ts` and `classifyTake` (default `minMs = MIN_RECORDING_MS`). Run `npm test -- recordingRules` → PASS.

- [ ] **Step 4: Implement `audioMode.ts`.** `setRecordingAudioMode` calls `setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldRouteThroughEarpiece: false, interruptionMode: 'doNotMix', shouldPlayInBackground: false, allowsBackgroundRecording: false })`. `resetAudioMode` sets `allowsRecording: false, interruptionMode: 'mixWithOthers'`.

- [ ] **Step 5: Implement `ensureMicPermission`.** `getRecordingPermissionsAsync()`; if granted → `{granted, prompted:false}`; if `canAskAgain` → `requestRecordingPermissionsAsync()` → `{status, prompted:true}`; else `{denied, prompted:false}`. Never call request when `canAskAgain` is false (no prompt spam).

- [ ] **Step 6: Implement `useWavRecorder`.** Wraps `useAudioStream({ sampleRate: 48000, channels: 1, encoding: 'int16' })` (overridable). `start(targetUri?)`: `setRecordingAudioMode()` → `stream.start()` → `stream.startFileRecordingAsync(targetUri ? { uri: targetUri, format: 'wav' } : { directory: 'cache', format: 'wav' })`; a 250 ms interval updates `elapsedMs`; at `maxMs` (default `MAX_RECORDING_MS`) call `stop()` with `hitMax: true`. `stop()`: `stopFileRecordingAsync()` → `stream.stop()` → `classifyTake(duration*1000)`; on `too_short` delete the file (`new File(uri).delete()` guarded by `exists`) and report `{kind:'too_short'}`; else report `ok` with the returned metadata. Any thrown error → stop the stream, delete the file if any, report `{kind:'interrupted', reason:'error'}`. `cancel()`: stop and delete, no callback. Unmount while recording → `cancel()`. Use refs for in-flight state so a double tap cannot start two file recordings.

- [ ] **Step 7: Implement `PlayButton`.** `useAudioPlayer(uri)` + `useAudioPlayerStatus`. Tap while playing → `pause()`; otherwise `seekTo(0)` then `play()`. Keep a module-level `activePlayer` so starting one button pauses any other. Visible label switches to `Playing…` while playing; `accessibilityRole="button"`. Disabled when `uri` is null.

- [ ] **Step 8: Build `src/app/dev-audio.tsx`** (first line of the component: `if (!__DEV__) return <Redirect href="/" />`). Controls: sample rate 48000/44100, channels 1/2, encoding int16/float32 (remount the recorder component with `key={format}` on change); Record/Stop; elapsed `m:ss / 0:20`; after a take show on screen: extension (must be `.wav`), duration, size, sampleRate, channels, encoding; `PlayButton` for the take. Change `src/app/index.tsx` to show `Invertalk` and, when `__DEV__`, a link `Audio test` → `/dev-audio`.

- [ ] **Step 9: Verify** — `npx tsc --noEmit && npm test` → exit 0.

- [ ] **Step 10: Commit** — `git commit -am "feat: WAV record and playback spike"` (add new files first).

### Checkpoint 1 (Bishal, both phones)

Handoff "Verify Prompt 1": both dev builds open; first-run mic prompt shows the approved string; a 3 s and a 20 s take (auto-stops at 20 s) play back clearly through the **speaker**; the screen shows `.wav`; iOS silent switch on still plays. **Also try (input for Phase 4):** start recording, press Home for 3 s, come back — note what the screen shows and whether the app survives. Report the result; nothing needs to pass yet.

---

## Phase 2 — Wed 25 Nov: reverse frames, tests, file cleanup

### Task 4: WAV parser

**Files:**
- Create: `src/audio/__tests__/wavFixture.ts`, `src/audio/wav.ts`, `src/audio/__tests__/wav.test.ts`

**Interfaces:**
- Produces:
  - `type WavEncoding = 'int16' | 'float32'`
  - `type WavFormat = { encoding: WavEncoding; channels: number; sampleRate: number; bitsPerSample: 16 | 32; blockAlign: number }`
  - `type ParsedWav = { format: WavFormat; dataOffset: number; dataLength: number /* whole frames only */; frameCount: number; droppedBytes: number }`
  - `class WavError extends Error { code: 'not_wave' | 'no_fmt' | 'no_data' | 'unsupported_format' | 'bad_block_align' }` — codes are opaque snake_case tokens, reused as analytics `error_code`.
  - `parseWav(bytes: Uint8Array): ParsedWav`
  - Test-only: `makeWav(o: { channels: number; sampleRate: number; encoding: WavEncoding; samples: number[]; formatTag?: 1 | 3 | 0xfffe; chunksBeforeData?: { id: string; size: number }[]; trailingBytes?: number; dataSizeOverride?: number; riffType?: string; omitFmt?: boolean; bitsPerSample?: number; blockAlignOverride?: number }): Uint8Array` — little-endian RIFF writer; `samples` are interleaved int16 integers or float32 values; extra chunks are filled with `0xAB` and followed by a pad byte when `size` is odd; 0xFFFE writes a 40-byte `fmt ` whose SubFormat GUID starts with `01 00` (int16) or `03 00` (float32); `trailingBytes` appends that many `0x7F` bytes inside the data chunk (and counts them in its size).

- [ ] **Step 1: Write `makeWav`** (test helper; no test of its own — the parser tests exercise it).

- [ ] **Step 2: Write the failing tests** `src/audio/__tests__/wav.test.ts`

```ts
test('parses mono int16 48 kHz', () => {
  const p = parseWav(makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1, 2, 3] }));
  expect(p.format).toEqual({ encoding: 'int16', channels: 1, sampleRate: 48000, bitsPerSample: 16, blockAlign: 2 });
  expect(p.frameCount).toBe(3); expect(p.dataOffset).toBe(44); expect(p.droppedBytes).toBe(0);
});
test('parses stereo float32 44.1 kHz (tag 3)', () => {
  const p = parseWav(makeWav({ channels: 2, sampleRate: 44100, encoding: 'float32', formatTag: 3, samples: [0.5, -0.5, 0.25, -0.25] }));
  expect(p.format.encoding).toBe('float32'); expect(p.format.blockAlign).toBe(8); expect(p.frameCount).toBe(2);
});
test('parses extensible float32', () => {
  const p = parseWav(makeWav({ channels: 1, sampleRate: 48000, encoding: 'float32', formatTag: 0xfffe, samples: [0.1] }));
  expect(p.format.encoding).toBe('float32');
});
test('finds data after fact and LIST chunks', () => {
  const p = parseWav(makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [9, 8], chunksBeforeData: [{ id: 'fact', size: 4 }, { id: 'LIST', size: 26 }] }));
  expect(p.frameCount).toBe(2); expect(p.dataOffset).toBe(44 + 12 + 34);
});
test('skips odd-sized chunk with pad byte', () => {
  const p = parseWav(makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [5], chunksBeforeData: [{ id: 'junk', size: 7 }] }));
  expect(p.frameCount).toBe(1); expect(p.dataOffset).toBe(44 + 8 + 8);
});
test('drops trailing partial frame', () => {
  const p = parseWav(makeWav({ channels: 2, sampleRate: 48000, encoding: 'int16', samples: [1, -1, 2, -2], trailingBytes: 3 }));
  expect(p.dataLength).toBe(8); expect(p.droppedBytes).toBe(3); expect(p.frameCount).toBe(2);
});
test('clamps data size past end of file', () => {
  for (const dataSizeOverride of [0xffffffff, 1000]) {
    const p = parseWav(makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1, 2, 3], dataSizeOverride }));
    expect(p.frameCount).toBe(3);
  }
});
test('accepts an empty data chunk', () => {
  expect(parseWav(makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [] })).frameCount).toBe(0);
});
test.each([
  ['not_wave', () => makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1], riffType: 'AVI ' })],
  ['not_wave', () => new Uint8Array([1, 2, 3])],
  ['no_fmt', () => makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1], omitFmt: true })],
  ['unsupported_format', () => makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1], bitsPerSample: 24 })],
  ['bad_block_align', () => makeWav({ channels: 2, sampleRate: 48000, encoding: 'int16', samples: [1, 1], blockAlignOverride: 2 })],
])('rejects with %s', (code, make) => {
  let err: unknown;
  try { parseWav(make()); } catch (e) { err = e; }
  expect(err).toBeInstanceOf(WavError);
  expect((err as WavError).code).toBe(code);
});
```

- [ ] **Step 3: Run** `npm test -- wav.test` → FAIL.

- [ ] **Step 4: Implement `parseWav`.** Read with a `DataView` (little-endian). Check `RIFF` + `WAVE` (else `not_wave`; also when `bytes.length < 12`). Walk chunks from offset 12: read 4-char id via char codes (no `TextDecoder`), 32-bit size, advance `8 + size + (size & 1)`. `fmt `: tag 1 → int16 only with 16 bits; tag 3 → float32 only with 32 bits; tag 0xFFFE → use the first two bytes of the SubFormat GUID at fmt offset 24 as the tag; anything else → `unsupported_format`. Require `blockAlign === channels * bitsPerSample / 8` (`bad_block_align`) and `channels ≥ 1`. `data`: available = `min(size, bytes.length - offset - 8)`; `dataLength = available - available % blockAlign`. Missing `fmt ` → `no_fmt`; missing `data` → `no_data`. Never assume offset 44.

- [ ] **Step 5: Run** `npm test -- wav.test` → PASS. **Commit** `feat: RIFF/WAVE parser with chunk walking`.

### Task 5: WAV writer and frame reversal

**Files:**
- Modify: `src/audio/wav.ts`
- Create: `src/audio/reverseWav.ts`, `src/audio/__tests__/reverseWav.test.ts`

**Interfaces:**
- Consumes: `parseWav`, `WavFormat`, `makeWav` (Task 4)
- Produces: `writeWav(format: WavFormat, data: Uint8Array): Uint8Array` (canonical 44-byte header, 16-byte `fmt `, tag 1 for int16 / 3 for float32, RIFF size `36 + data.length`); `reverseWavBytes(input: Uint8Array): Uint8Array` (throws `WavError`; never mutates `input`).

- [ ] **Step 1: Write the failing tests** (decode samples in tests with a small `samplesOf(bytes)` helper that uses `parseWav` + `DataView`):

```ts
test('reverses known int16 waveform sample-for-sample', () => {
  const out = reverseWavBytes(makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1, 2, 3, -4, 32767, -32768] }));
  expect(samplesOf(out)).toEqual([-32768, 32767, -4, 3, 2, 1]);
});
test('keeps stereo channels together', () => {
  const out = reverseWavBytes(makeWav({ channels: 2, sampleRate: 44100, encoding: 'int16', samples: [1, -1, 2, -2, 3, -3] }));
  expect(samplesOf(out)).toEqual([3, -3, 2, -2, 1, -1]);
});
test('reverses float32 mono and stereo exactly', () => {
  expect(samplesOf(reverseWavBytes(makeWav({ channels: 1, sampleRate: 48000, encoding: 'float32', formatTag: 3, samples: [0.5, -0.25, 1] })))).toEqual([1, -0.25, 0.5]);
  expect(samplesOf(reverseWavBytes(makeWav({ channels: 2, sampleRate: 48000, encoding: 'float32', formatTag: 3, samples: [0.5, -0.5, 0.25, -0.25] })))).toEqual([0.25, -0.25, 0.5, -0.5]);
});
test('preserves format metadata and writes a consistent header', () => {
  for (const sampleRate of [44100, 48000]) for (const channels of [1, 2]) {
    const out = reverseWavBytes(makeWav({ channels, sampleRate, encoding: 'int16', samples: new Array(channels * 4).fill(7) }));
    const p = parseWav(out);
    expect(p.format).toMatchObject({ channels, sampleRate, encoding: 'int16' });
    expect(p.dataOffset).toBe(44);
    expect(new DataView(out.buffer).getUint32(4, true)).toBe(36 + p.dataLength);
  }
});
test('extensible input becomes plain float32 output', () => {
  const out = reverseWavBytes(makeWav({ channels: 1, sampleRate: 48000, encoding: 'float32', formatTag: 0xfffe, samples: [0.1, 0.2] }));
  expect(new DataView(out.buffer).getUint16(20, true)).toBe(3);
});
test('silence stays silence', () => {
  const out = reverseWavBytes(makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: new Array(48000).fill(0) }));
  expect(samplesOf(out).every((s) => s === 0)).toBe(true); expect(parseWav(out).frameCount).toBe(48000);
});
test('double reverse restores a 20 s mono 48 kHz take byte-for-byte', () => {
  const samples = Array.from({ length: 960000 }, (_, i) => ((i * 37) % 65536) - 32768);
  const input = makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples });
  const twice = reverseWavBytes(reverseWavBytes(input));
  expect(Buffer.from(twice.subarray(44)).equals(Buffer.from(input.subarray(44)))).toBe(true);
});
test('drops trailing partial frame instead of reversing it in', () => {
  const out = reverseWavBytes(makeWav({ channels: 2, sampleRate: 48000, encoding: 'int16', samples: [1, -1, 2, -2], trailingBytes: 3 }));
  expect(parseWav(out).dataLength).toBe(8); expect(samplesOf(out)).toEqual([2, -2, 1, -1]);
});
test('preserves exact float bit patterns (NaN payload)', () => {
  const input = makeWav({ channels: 1, sampleRate: 48000, encoding: 'float32', formatTag: 3, samples: [0, 0] });
  input.set([0x01, 0x00, 0xc0, 0x7f], 44); // NaN with payload in frame 0
  const out = reverseWavBytes(input);
  expect([...out.subarray(48, 52)]).toEqual([0x01, 0x00, 0xc0, 0x7f]);
});
test('does not mutate its input', () => {
  const input = makeWav({ channels: 1, sampleRate: 48000, encoding: 'int16', samples: [1, 2, 3] });
  const copy = input.slice(); reverseWavBytes(input); expect(input).toEqual(copy);
});
```

- [ ] **Step 2: Run** `npm test -- reverseWav` → FAIL.

- [ ] **Step 3: Implement `writeWav` and `reverseWavBytes`.** Reverse by copying whole frames, byte-wise, from the end of the source data into a new buffer (`out.set(src.subarray(start, start + frameSize), dst)` per frame, or a nested byte loop). **Never** route samples through `Float32Array`/`Float64Array` — NaN canonicalisation can change bits (the NaN test guards this). Do not add a typed-array fast path unless Task 7's on-device timing exceeds 300 ms.

- [ ] **Step 4: Run** `npm test` → PASS. **Commit** `feat: frame-wise WAV reversal`.

### Task 6: Temp file names and cleanup helpers

**Files:**
- Create: `src/audio/fileNames.ts`, `src/audio/cleanup.ts`, `src/audio/__tests__/fileNames.test.ts`, `src/audio/__tests__/cleanup.test.ts`

**Interfaces:**
- Produces:
  - `AUDIO_DIR = 'invertalk-audio'`; `type FileRole = 'prompt' | 'imitation' | 'dev'`; `type FileKind = 'raw' | 'rev' | 'rev2'`
  - `tempFileName(p: { sessionId: string; role: FileRole; take: number; kind: FileKind }): string` → `invertalk-${sessionId}-${role}-${take}-${kind}.wav`
  - `isTempFileName(name: string): boolean` — matches `/^invertalk-[a-z0-9]+-(prompt|imitation|dev)-\d+-(raw|rev|rev2)\.wav$/`
  - `newSessionId(now?: number, random?: () => number): string` — base-36 `[a-z0-9]+`
  - `interface FileOps { exists(uri: string): boolean; delete(uri: string): void; list(dirUri: string): { uri: string; name: string }[] }` (`list` returns `[]` for a missing dir)
  - `deleteUris(ops: FileOps, uris: readonly (string | null | undefined)[]): string[]` — returns URIs actually deleted; skips null/missing; a throwing delete is skipped and the rest continue; never throws.
  - `sweepTempDir(ops: FileOps, dirUri: string): string[]` — deletes only entries passing `isTempFileName`; returns their URIs.

- [ ] **Step 1: Write the failing tests.** `fileNames.test.ts`: names differ when any of role/take/kind differs; `isTempFileName` true for every generated name and false for `photo.wav`, `invertalk-consent.json`, `invertalk-abc-prompt-1-raw.m4a`, `../invertalk-a-dev-1-raw.wav`; `newSessionId(1732400000000, () => 0.5)` matches `/^[a-z0-9]+$/`. `cleanup.test.ts` with an in-memory `FakeOps` (a `Map<string, name>` plus a `failOn` set):

```ts
test('deleteUris deletes existing, skips missing and null, survives a failing delete', () => {
  const ops = new FakeOps(['file:///c/a.wav', 'file:///c/b.wav', 'file:///c/c.wav'], { failOn: ['file:///c/b.wav'] });
  expect(deleteUris(ops, ['file:///c/a.wav', null, 'file:///c/missing.wav', 'file:///c/b.wav', 'file:///c/c.wav']))
    .toEqual(['file:///c/a.wav', 'file:///c/c.wav']);
});
test('sweepTempDir deletes only Invertalk temp WAVs', () => {
  const ops = new FakeOps(['file:///c/invertalk-audio/invertalk-k1-prompt-1-raw.wav', 'file:///c/invertalk-audio/notes.txt']);
  expect(sweepTempDir(ops, 'file:///c/invertalk-audio')).toEqual(['file:///c/invertalk-audio/invertalk-k1-prompt-1-raw.wav']);
  expect(ops.exists('file:///c/invertalk-audio/notes.txt')).toBe(true);
});
test('sweepTempDir on a missing dir returns []', () => {
  expect(sweepTempDir(new FakeOps([]), 'file:///c/nope')).toEqual([]);
});
```

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** `npm test` → PASS. **Step 5: Commit** `feat: temp file naming and cleanup helpers`.

### Task 7: File-backed reversal, launch sweep, double-reverse spike

**Files:**
- Create: `src/audio/expoFileOps.ts`, `src/audio/reverseFile.ts`
- Modify: `src/app/_layout.tsx`, `src/app/dev-audio.tsx`

**Interfaces:**
- Consumes: `reverseWavBytes`, `WavError` (Task 5), `FileOps`, `sweepTempDir`, `deleteUris`, `tempFileName`, `newSessionId`, `AUDIO_DIR` (Task 6)
- Produces:
  - `expoFileOps: FileOps` (wraps `new File(uri).exists/.delete()`, `new Directory(uri).list()`)
  - `audioDir(): Directory` — `new Directory(Paths.cache, AUDIO_DIR)`, created if missing
  - `audioFileUri(name: string): string` — `new File(audioDir(), name).uri`
  - `class ReverseError extends Error { code: 'read_failed' | 'write_failed' | WavError['code'] }`
  - `reverseWavFile(srcUri: string, destUri: string): Promise<{ uri: string; frameCount: number; sampleRate: number; elapsedMs: number }>` — reads `await new File(srcUri).bytes()`, reverses, `await new File(destUri).write(out)`; on write failure deletes any partial `destUri` and throws `write_failed`. Never writes over `srcUri`.

- [ ] **Step 1: Implement `expoFileOps.ts` and `reverseFile.ts`** (thin I/O; their logic is covered by Tasks 4–6 tests).

- [ ] **Step 2: Launch sweep.** In `src/app/_layout.tsx`, run `sweepTempDir(expoFileOps, audioDir().uri)` once on mount, inside `try/catch` (a failed sweep must not block launch).

- [ ] **Step 3: Wire the spike.** In `dev-audio.tsx`: create a session id on mount; record to `audioFileUri(tempFileName({ sessionId, role: 'dev', take: n, kind: 'raw' }))` (increment `n` per take); buttons **Reverse** (raw → `rev`) and **Reverse again** (`rev` → `rev2`), each followed by a `PlayButton` and the on-screen `elapsedMs`; **Delete all** → `deleteUris` of this screen's URIs; show a live **file listing** (names + count) of `audioDir()` refreshed after every action; on unmount delete this screen's URIs.

- [ ] **Step 4: Verify** `npx tsc --noEmit && npm test` → exit 0. **Commit** `feat: reverse WAV files on device with temp cleanup`.

### Checkpoint 2 (Bishal, both phones)

Say a short phrase → **Reverse** sounds clearly backwards → **Reverse again** sounds like the original. Note the reversal time for a 20 s take (if > 300 ms on Android, tell Claude). Leave the screen and the file listing shows 0 files; record, kill the app, reopen → listing shows 0 (launch sweep). Repeat with 44.1 kHz, stereo and float32 settings.

---

## Phase 3 — Thu 26 Nov: two-player loop and phrase pack

### Task 8: Phrase pack and custom phrase check

**Files:**
- Create: `src/game/phrases.ts`, `src/game/__tests__/phrases.test.ts`

**Interfaces:**
- Produces: `type Phrase = { source: 'preset'; id: string; text: string } | { source: 'custom'; text: string }`; `STARTER_PHRASES: readonly { id: string; text: string }[]` with ids `p01`…`p10` in the handoff order (Good morning everyone · I like chocolate ice cream · Please pass the salt · The cat sat on the mat · How are you today · Let's go to the park · The weather is nice today · Red lorry yellow lorry · She sells seashells · Can you hear me now); `checkCustomPhrase(input: string): { ok: true; text: string } | { ok: false; reason: 'empty' | 'too_long' }` (trim, collapse whitespace runs to one space, then compare length to `CUSTOM_PHRASE_MAX`).

- [ ] **Step 1: Failing tests:** `''` and `'  \n '` → `empty`; 61 × `a` → `too_long`; 60 × `a` → ok; `'  hello   world '` → `{ ok: true, text: 'hello world' }`; starter pack has 10 unique ids matching `/^p\d{2}$/`, every text ≤ 60 chars.
- [ ] **Step 2: Run → FAIL. Step 3: Implement. Step 4: Run → PASS. Step 5: Commit** `feat: starter phrase pack and custom phrase validation`.

### Task 9: Challenge session reducer

**Files:**
- Create: `src/game/challenge.ts`, `src/game/__tests__/challenge.test.ts`

**Interfaces:**
- Consumes: `Phrase` (Task 8), `tempFileName` (Task 6)
- Produces:
  - `type Role = 'prompt' | 'imitation'`; `type Take = { rawUri: string; revUri: string | null; durationMs: number }`
  - `type ChallengeState = { sessionId: string | null; phrase: Phrase | null; promptTake: number; imitationTake: number; prompt: Take | null; imitation: Take | null; startedAt: number | null }`; `initialChallengeState`
  - `type ChallengeAction = { type: 'start'; sessionId: string; phrase: Phrase; now: number } | { type: 'recorded'; role: Role; rawUri: string; durationMs: number } | { type: 'reversed'; role: Role; revUri: string } | { type: 'rerecordPrompt' } | { type: 'retryImitation' } | { type: 'reset' }`
  - `challengeReducer(s: ChallengeState, a: ChallengeAction): ChallengeState`
  - `releasedUris(s: ChallengeState, a: ChallengeAction): string[]` — files that action makes obsolete
  - `takeFileName(s: ChallengeState, role: Role, kind: 'raw' | 'rev'): string` — uses `sessionId` and the role's current take number

- [ ] **Step 1: Failing tests:**
  - `start` → takes 1/1, `startedAt = now`, prompt/imitation null.
  - `recorded` then `reversed` fill `prompt`; same for `imitation`.
  - `retryImitation` → imitation null, prompt kept, `imitationTake` 2; `releasedUris` = imitation raw + rev only.
  - `rerecordPrompt` → prompt and imitation null, `promptTake` 2, `imitationTake` 2; `releasedUris` = all four.
  - `reset` → `initialChallengeState`; `releasedUris` = every non-null URI. `start` while a session exists releases the old session's URIs.
  - `releasedUris` omits null `revUri`s.
  - **`retake file names never repeat`**: `takeFileName(s, 'imitation', 'raw')` before and after `retryImitation` differ; same for prompt after `rerecordPrompt`.
- [ ] **Step 2: Run → FAIL. Step 3: Implement. Step 4: Run → PASS. Step 5: Commit** `feat: challenge session reducer`.

### Task 10: Consent model and storage

**Files:**
- Create: `src/game/consent.ts`, `src/game/consentStore.ts`, `src/game/__tests__/consent.test.ts`

**Interfaces:**
- Produces: `type ConsentRecord = { version: number; acceptedAt: string }`; `parseConsent(json: string | null): ConsentRecord | null`; `isConsentCurrent(r: ConsentRecord | null, version?: number): boolean` (default `CONSENT_VERSION`); `readConsent(): Promise<ConsentRecord | null>` and `acceptConsent(now: Date): Promise<void>` storing `invertalk-consent.json` in `Paths.document` (missing/corrupt file → `null`).

- [ ] **Step 1: Failing tests** for the pure part: `null`, `'{'`, `'{"version":"1"}'` → `null`; valid JSON → record; `isConsentCurrent` false for `null` and `{version: 0}`, true for `{version: 1}`.
- [ ] **Step 2: Run → FAIL. Step 3: Implement both files. Step 4: Run → PASS. Step 5: Commit** `feat: recording consent record`.

### Task 11: UI kit, provider, Home and Consent

**Files:**
- Create: `src/ui/theme.ts`, `src/ui/Screen.tsx`, `src/ui/Button.tsx`, `src/ui/Notice.tsx`, `src/game/ChallengeProvider.tsx`, `src/app/consent.tsx`
- Modify: `src/app/_layout.tsx`, `src/app/index.tsx`, `src/ui/PlayButton.tsx` (use theme)

**Interfaces:**
- Consumes: Tasks 6, 7, 9, 10
- Produces:
  - `useChallenge(): { state: ChallengeState; start(p: Phrase): void; fileUri(role: Role, kind: 'raw' | 'rev'): string; recorded(role: Role, rawUri: string, durationMs: number): void; reversed(role: Role, revUri: string): void; rerecordPrompt(): void; retryImitation(): void; endSession(): void }` — every mutator first calls `deleteUris(expoFileOps, releasedUris(state, action))`; `endSession` = `reset` + `resetAudioMode()`.
  - `<Screen title?: string>` (SafeArea + ScrollView so large text never clips), `<Button label onPress variant?: 'primary'|'secondary' disabled? accessibilityHint?>` (min height 48, `accessibilityRole="button"`, `accessibilityState.disabled`), `<Notice tone: 'info'|'error' text>` (`accessibilityRole="alert"`).

- [ ] **Step 1: Theme and components.** Calm, plain styling: system font, one accent colour, light and dark palettes via `useColorScheme`, contrast ≥ 4.5:1 for text. No custom `allowFontScaling={false}` anywhere (Dynamic Type must work).

- [ ] **Step 2: Layout.** `_layout.tsx` wraps a `<Stack>` in `ChallengeProvider` (keep the launch sweep). Screen options: `prompt`, `imitate`, `reveal` get `gestureEnabled: false` and a header-right `×` (`accessibilityLabel="End game"`) that calls `endSession()` then `router.dismissAll()`.

- [ ] **Step 3: Home** (`index.tsx`): title `Invertalk`; text `Say a phrase. Your friend hears it backwards and copies it. Flip their attempt and hear what they really said.`; **Start challenge** → `readConsent()` current ? `/phrase` : `/consent`; keep the `__DEV__` `Audio test` link. On focus, if `state.sessionId` → `endSession()`. If param `notice=consent_declined`, show `Notice` `Recording needs your OK first. Tap Start when you're ready to agree.`

- [ ] **Step 4: Consent** (`consent.tsx`), copy verbatim:

```text
Before you record
• Invertalk uses your microphone to record the phrase and your friend's imitation.
• Everything is processed on this phone. Recordings are never uploaded.
• Recordings are temporary and are deleted when the game ends.
• We collect anonymous usage stats, like whether a game was finished. They never include your voice or the words you choose.
[Read the privacy policy]   (Linking.openURL(PRIVACY_POLICY_URL))
[I agree]   [Not now]
```

**I agree** → `acceptConsent(new Date())` → `router.replace('/phrase')`. **Not now** → `router.replace({ pathname: '/', params: { notice: 'consent_declined' } })`. With param `mode=review` show the same text plus `You agreed on <date>` (or `You haven't agreed yet`) and a single **Close**.

- [ ] **Step 5: Verify** `npx tsc --noEmit && npm test` → exit 0. **Commit** `feat: UI kit, session provider, home and consent`.

### Task 12: Phrase select

**Files:**
- Create: `src/app/phrase.tsx`

**Interfaces:**
- Consumes: `STARTER_PHRASES`, `checkCustomPhrase`, `useChallenge().start`

- [ ] **Step 1: Build the screen.** Title `Pick a phrase`; list of starter phrases as selectable rows (`accessibilityRole="radio"`, `accessibilityState.selected`); a `Type your own` `TextInput` (`maxLength` 80 so the too-long message can show, `autoCorrect` on); selecting a preset clears the custom text and typing clears the preset. **Continue** is disabled when nothing is selected or `checkCustomPhrase` returns `empty`; on `too_long` show `Notice` `Keep it short — 60 characters or fewer.` and keep Continue disabled. **Continue** → `start(phrase)` → `router.push('/record')`. Back → Home (default).
- [ ] **Step 2: Verify** `npx tsc --noEmit` → exit 0. **Commit** `feat: phrase select screen`.

### Task 13: Shared record control and Record phrase (Player 1)

**Files:**
- Create: `src/ui/RecordButton.tsx`, `src/ui/ElapsedTimer.tsx`, `src/ui/RecordTake.tsx`, `src/app/record.tsx`

**Interfaces:**
- Consumes: `useWavRecorder`, `TakeResult`, `ensureMicPermission` (Task 3); `useChallenge` (Task 11)
- Produces: `<RecordTake role: Role; targetUri: string; onRecorded: (r: Extract<TakeResult, { kind: 'ok' }>) => void />`

- [ ] **Step 1: `RecordButton`** shows visible text `Record` / `Stop` with `accessibilityLabel` `Start recording` / `Stop recording`. **`ElapsedTimer`** shows `0:07 / 0:20` with `accessibilityLabel` `7 seconds of 20`.

- [ ] **Step 2: `RecordTake`.** First tap → `ensureMicPermission()`; `denied` → `Notice` `Microphone access is off. Turn it on in Settings to play.` (Task 18 replaces this with navigation). Then `start(targetUri)`. Results: `ok` → `onRecorded(r)` (if `hitMax`, briefly show `Stopped at 20 seconds.` first); `too_short` → `Notice` `That was too short. Hold on a little longer and try again.`; `interrupted` → `Notice` `Something went wrong while recording. Nothing was saved.` + **Try again**. Resets to ready after each result.

- [ ] **Step 3: `record.tsx`** — heading `Player 1`; the phrase text large; hint `Say it clearly. You'll hear it backwards next.`; `<RecordTake role="prompt" targetUri={fileUri('prompt','raw')} onRecorded={r => { recorded('prompt', r.uri, r.durationMs); router.push('/prompt'); }} />`. Back cancels via unmount (Task 3 hook).

- [ ] **Step 4: Verify** `npx tsc --noEmit` → exit 0. **Commit** `feat: shared record control and Player 1 screen`.

### Task 14: Reversed prompt (hand-over) screen

**Files:**
- Create: `src/app/prompt.tsx`

**Interfaces:**
- Consumes: `reverseWavFile`, `ReverseError` (Task 7); `useChallenge`; `PlayButton`

- [ ] **Step 1: Build the screen. It never renders `state.phrase`.** On mount, if `prompt.revUri` is null → `reverseWavFile(prompt.rawUri, fileUri('prompt','rev'))` → `reversed('prompt', uri)`. Guard with a ref keyed on `rawUri` so a re-render or dev double-effect never starts a second reversal (Reveal uses the same guard). States: preparing → `Flipping it backwards…`; failed → `Couldn't play that recording backwards. Please record it again.` + **Record again** (= `rerecordPrompt()` + `router.back()`); ready → `PlayButton` `Play backwards`, text `Hand the phone to Player 2. Don't show them the phrase.`, primary **I'm Player 2 — record my try** → `router.push('/imitate')`, secondary **Re-record phrase (Player 1)**.

- [ ] **Step 2: Guard the phrase.** **Re-record phrase** and Android hardware back (`BackHandler`, return `true`) both open `Alert.alert('Player 1 only', 'Going back shows the phrase. Continue?', [Cancel, Continue])`; Continue → `rerecordPrompt()` → `router.back()`. Swipe-back is already disabled (Task 11).

- [ ] **Step 3: Device check (Review Focus 5).** In the dev build: on Prompt, iOS edge-swipe does nothing; Android back shows the alert; Cancel stays on Prompt.

- [ ] **Step 4: Verify** `npx tsc --noEmit` → exit 0. **Commit** `feat: reversed prompt hand-over screen`.

### Task 15: Imitation (Player 2) and Reveal

**Files:**
- Create: `src/app/imitate.tsx`, `src/app/reveal.tsx`

**Interfaces:**
- Consumes: `RecordTake`, `PlayButton`, `reverseWavFile`, `useChallenge`

- [ ] **Step 1: `imitate.tsx`** — heading `Player 2`; `Copy the sounds you heard, as closely as you can.`; `PlayButton` `Hear it again` (prompt rev); `<RecordTake role="imitation" targetUri={fileUri('imitation','raw')} onRecorded={r => { recorded('imitation', r.uri, r.durationMs); router.push('/reveal'); }} />`. No phrase text. Back → Prompt (default).

- [ ] **Step 2: `reveal.tsx`** — on mount reverse the imitation if `imitation.revUri` is null (same states as Prompt; failed → **Try again** = `retryImitation()` + `router.back()`). Ready: heading `The reveal`; primary `PlayButton` `Play the reveal` (imitation rev); secondary `PlayButton` `Play the original` (prompt **raw** — Player 1's recording forwards; `accessibilityLabel` `Play Player 1's original recording`); secondary `PlayButton` `Play the backwards prompt` (prompt rev); **Show the phrase** button that, once tapped, is replaced by the text `It was: "<phrase text>"` (hidden by default so the reveal audio lands first; resets when Reveal unmounts); **Retry imitation** → `retryImitation()` + `router.back()`; **New phrase** → `endSession()` + `router.dismissTo('/phrase')`. Android back = **Retry imitation**. The phrase text appears only behind **Show the phrase** and never in share or analytics.

- [ ] **Step 3: Verify** `npx tsc --noEmit && npm test` → exit 0. **Commit** `feat: imitation and reveal screens`.

### Checkpoint 3 (Bishal, both phones)

Handoff "Verify Prompt 3": two people finish a challenge without help; Player 2 never sees the phrase on Prompt/Imitate/Reveal; Retry imitation keeps the prompt; New phrase clears the session (dev screen listing shows no files from the old session); a custom phrase works; a < 0.5 s take asks to retry; a silent take reaches the reveal; text still fits at the largest system text size.

---

## Phase 4 — Fri 27 Nov: share, consent, interruptions

### Task 16: Share the reveal

**Files:**
- Create: `src/share/shareReveal.ts`
- Modify: `src/app/reveal.tsx`

**Interfaces:**
- Produces: `canShare(): Promise<boolean>` (`Sharing.isAvailableAsync()`, false on throw); `shareReveal(uri: string): Promise<'closed' | 'failed'>` — `Sharing.shareAsync(uri, { mimeType: 'audio/wav', UTI: 'com.microsoft.waveform-audio', dialogTitle: 'Share your Invertalk reveal' })`; resolve → `'closed'`, throw → `'failed'`. No message/caption parameter.

- [ ] **Step 1: Implement**, then on Reveal add **Share** (shown only when `canShare()` is true) that calls `shareReveal(imitation.revUri)`. `'failed'` → `Notice` `Couldn't open sharing. Try again.`; `'closed'` → stay on Reveal with no message. Files are not deleted by sharing.
- [ ] **Step 2: Verify** `npx tsc --noEmit` → exit 0. **Commit** `feat: share reveal audio via system sheet`.

### Task 17: Settings and privacy link

**Files:**
- Create: `src/app/settings.tsx`
- Modify: `src/app/index.tsx` (add **Settings** button)

- [ ] **Step 1: Build Settings** — rows: **Privacy policy** → `Linking.openURL(PRIVACY_POLICY_URL)` (in `__DEV__`, show `Placeholder URL — replace before store submit` when `PRIVACY_POLICY_IS_PLACEHOLDER`); `Recording consent: Agreed on <d MMM yyyy>` or `Not agreed yet` + **Read it again** → `/consent?mode=review`; statement `Recordings stay on this phone and are deleted after each game.`; `Version <Constants.expoConfig?.version> (<build>)`.
- [ ] **Step 2: Verify** `npx tsc --noEmit` → exit 0. **Commit** `feat: settings screen with privacy link and consent status`.

### Task 18: Permission denied and interruptions

**Files:**
- Create: `src/app/permission-denied.tsx`
- Modify: `src/audio/recordingRules.ts`, `src/audio/__tests__/recordingRules.test.ts`, `src/audio/useWavRecorder.ts`, `src/ui/RecordTake.tsx`, `src/app/prompt.tsx`, `src/app/reveal.tsx`

**Interfaces:**
- Produces: `interruptionFor(appState: 'active' | 'inactive' | 'background' | 'unknown' | 'extension', streamRunning: boolean): InterruptReason | null`

- [ ] **Step 1: Failing test** for `interruptionFor`: `('background', true)` and `('background', false)` → `'background'`; `('active', false)` and `('inactive', false)` → `'call'`; `('active', true)` and `('inactive', true)` → `null`.
- [ ] **Step 2: Run → FAIL. Step 3: Implement. Step 4: Run → PASS.**

- [ ] **Step 5: Hook interruptions.** In `useWavRecorder`, while recording and not stopping, evaluate `interruptionFor` on every `AppState` change and whenever `useAudioStream`'s `isStreaming` changes. On a reason: `stream.stop()`, delete the file, report `{ kind: 'interrupted', reason }` (always discard — design note). Use what Checkpoint 1's background test showed to confirm the stream behaviour.

- [ ] **Step 6: Copy per reason in `RecordTake`:** `background` → `Recording stopped because the app was closed. Nothing was saved.`; `call` → `Recording stopped because a call or another app took the microphone. Nothing was saved.`; `error` → `Something went wrong while recording. Nothing was saved.` Buttons **Try again** (reset to ready) and **Cancel** (`router.back()`).

- [ ] **Step 7: Permission denied screen** — title `Microphone is off`; `Invertalk needs the microphone to record the phrase and the imitation. Recordings stay on this phone.`; **Open Settings** → `Linking.openSettings()`; **Back**. When the app returns to `active`, re-check `getRecordingPermissionsAsync()`; if granted → `router.back()`. `RecordTake` now does `router.push('/permission-denied')` on `denied` (replacing Task 13's notice), including when permission is revoked later.

- [ ] **Step 8: Write failures.** In Prompt and Reveal, a `ReverseError` with code `write_failed` shows `Couldn't save the recording. Free up some space on your phone and try again.`; any other failure keeps the existing copy. In both cases delete the bad files via `rerecordPrompt()` / `retryImitation()` when the user taps the action.

- [ ] **Step 9: Verify** `npx tsc --noEmit && npm test` → exit 0. **Commit** `feat: permission-denied screen and recording interruption handling`.

### Checkpoint 4 (Bishal, both phones)

Handoff "Verify Prompt 4": Share opens the system sheet with only the audio; cancelling returns to Reveal and a second share works; **Not now** blocks recording and Home shows the message; denying the mic leads to the settings screen and returning with it on goes back to recording; backgrounding mid-record and an incoming call mid-record show the right message and **Try again** works, no crash; temp files are gone after **New phrase** and after **×**.

---

## Phase 5 — Sat 28 – Mon 30 Nov: analytics and ship-ready QA

### Task 19: Allowlisted analytics with PostHog

**Files:**
- Create: `src/analytics/events.ts`, `src/analytics/index.ts`, `src/analytics/__tests__/events.test.ts`, `.env.example`
- Modify: `src/app/_layout.tsx`, `src/app/consent.tsx`, `src/app/phrase.tsx`, `src/ui/RecordTake.tsx`, `src/app/prompt.tsx`, `src/app/reveal.tsx`

**Interfaces:**
- Produces:
  - `type AnalyticsEvent` — a discriminated union on `name` with exactly the handoff's events and properties (minus `platform`, which `toPayload` adds): `consent_shown` · `consent_accepted` · `consent_declined` · `challenge_started { phrase_source: 'preset'; phrase_id } | { phrase_source: 'custom' }` · `permission_result { status }` · `recording_completed { role, duration_ms, sample_rate, channels, encoding: 'int16'|'float32'|'other' }` · `recording_interrupted { role, reason }` · `reversal_completed { role, success, duration_ms, error_code? }` · `challenge_finished { total_duration_ms }` · `share_clicked { share_type: 'audio' }` · `share_completed { share_type: 'audio', success }` · `app_error { error_code, screen }`
  - `ALLOWED_PROPS: Record<AnalyticsEvent['name'], readonly string[]>`
  - `toPayload(e: AnalyticsEvent, platform: 'ios' | 'android'): { event: string; properties: Record<string, string | number | boolean> }` — keeps only allowed keys, adds `platform`, replaces any string value not matching `/^[a-z0-9_]{1,40}$/` with `'redacted'`, drops non-finite numbers.
  - `initAnalytics(): void`; `track(e: AnalyticsEvent): void` — sends `toPayload(e, Platform.OS)` via `client.capture`; no-op when no client.

- [ ] **Step 1: Failing tests:**

```ts
test('challenge_started preset carries only allowed props', () => {
  expect(toPayload({ name: 'challenge_started', phrase_source: 'preset', phrase_id: 'p03' }, 'ios'))
    .toEqual({ event: 'challenge_started', properties: { platform: 'ios', phrase_source: 'preset', phrase_id: 'p03' } });
});
test('drops unknown properties', () => {
  const e = { name: 'challenge_started', phrase_source: 'custom', phrase_text: 'Please pass the salt' } as any;
  expect(toPayload(e, 'android').properties).toEqual({ platform: 'android', phrase_source: 'custom' });
});
test('redacts non-token strings', () => {
  const e = { name: 'app_error', error_code: 'file:///cache/invertalk-audio/x.wav', screen: 'Record Screen' } as any;
  expect(toPayload(e, 'ios').properties).toEqual({ platform: 'ios', error_code: 'redacted', screen: 'redacted' });
});
test('every event gets platform', () => {
  expect(toPayload({ name: 'consent_shown' }, 'android').properties).toEqual({ platform: 'android' });
});
test('keeps opaque error codes', () => {
  expect(toPayload({ name: 'reversal_completed', role: 'prompt', success: false, duration_ms: 12, error_code: 'not_wave' }, 'ios').properties.error_code).toBe('not_wave');
});
```

- [ ] **Step 2: Run → FAIL. Step 3: Implement `events.ts`. Step 4: Run → PASS.**

- [ ] **Step 5: Install and initialise PostHog**

```bash
npx expo install posthog-react-native expo-application expo-device expo-localization
```

`initAnalytics()`: if `process.env.EXPO_PUBLIC_POSTHOG_KEY` is unset, do nothing. Otherwise `new PostHog(key, { host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com', captureAppLifecycleEvents: false, enableSessionReplay: false })`, and turn off every other auto-capture option the installed version's types expose (e.g. exception autocapture). **Do not** mount `PostHogProvider` (its `autocapture` reads touched elements' labels, which would include phrase text). No `identify` calls. `.env.example` lists both keys without values; never log the key. `.env` is git-ignored, so tell Bishal to add the key to EAS for cloud builds (`eas env:create --name EXPO_PUBLIC_POSTHOG_KEY --environment development --environment preview --environment production`), and to put it in a local `.env` for `npx expo start`.

- [ ] **Step 6: Instrument the call sites:**

| Event | Where |
| --- | --- |
| `consent_shown` | `consent.tsx` mount, not in `mode=review` |
| `consent_accepted` / `consent_declined` | `consent.tsx` buttons |
| `challenge_started` | `phrase.tsx` Continue (preset id, or `custom` only) |
| `permission_result` | `RecordTake` after `ensureMicPermission` when `prompted` |
| `recording_completed` | `RecordTake` on `ok` (`duration_ms` = audio length) |
| `recording_interrupted` | `RecordTake` on `interrupted` |
| `reversal_completed` | `prompt.tsx` / `reveal.tsx` after `reverseWavFile` (`duration_ms` = `elapsedMs`; `error_code` = `ReverseError.code`) |
| `challenge_finished` | `reveal.tsx` when the reveal becomes playable (`Date.now() - startedAt`) |
| `share_clicked` / `share_completed` | `reveal.tsx` (`success` = result `'closed'`) |
| `app_error` | `_layout.tsx`: `ErrorUtils.setGlobalHandler` wrapper → `error_code: 'js_unhandled'`, `screen` = current route name without `/` (`home` for `/`); then call the previous handler |

Call `initAnalytics()` once in `_layout.tsx`.

- [ ] **Step 7: Verify** `npx tsc --noEmit && npm test` → exit 0; `grep -rn "console\." src --include=*.ts --include=*.tsx` prints nothing outside `__DEV__` blocks. **Commit** `feat: allowlisted PostHog analytics, replay and autocapture off`.

### Task 20: Release config, store notes, QA sheet

**Files:**
- Delete: `src/app/dev-audio.tsx` and the `Audio test` link in `src/app/index.tsx`
- Modify: `eas.json`, `app.json`
- Create: `docs/store/store-notes.md`, `docs/qa/qa-matrix.md`

- [ ] **Step 1: Release profiles.** Add `preview` (`distribution: internal`) and `production` (`autoIncrement: true`) to `eas.json`, each with the same pinned `ios.image` as `development`. Add `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` to `app.json` (HTTPS only).

- [ ] **Step 2: Remove the dev screen** — but only after Bishal confirms he has finished the QA-matrix format rows (44.1 kHz / stereo / float32), which need it. Verify `grep -rn "dev-audio" src` prints nothing.

- [ ] **Step 3: `docs/store/store-notes.md`:** the approved mic string; App Store privacy — Audio Data **not collected** (processed on device, never transmitted); Usage Data → Product Interaction and Diagnostics collected, not linked to identity, not used for tracking; no account. Play Data safety — App activity (app interactions) and App info & performance (diagnostics) collected, encrypted in transit, not shared, no audio or personal info. Age rating notes (no user-generated content shared in-app, no web access beyond the privacy link). App Review notes: `Two players, one phone. Player 1 records a short phrase; the app plays it backwards; Player 2 imitates the sound; the app reverses the imitation. Audio never leaves the device. No account needed.` Blocker line: privacy URL must replace the placeholder in `src/config.ts` before any submit.

- [ ] **Step 4: `docs/qa/qa-matrix.md`:** the handoff's Device QA matrix as an iOS/Android checkbox table, plus rows for latency (reversal ms for 3 s and 20 s takes), memory (peak during a 20 s reversal), output size, the network check (`No audio upload — verified with a proxy (Proxyman/Charles): only PostHog events, none containing audio or phrase text`), and a note that native crash-free rate comes from App Store Connect and Play Console vitals after release (PostHog only sees JS errors via `app_error`).

- [ ] **Step 5: Verify** `npx tsc --noEmit && npm test && npx expo-doctor` → all pass. **Commit** `chore: release profiles, store notes and QA matrix`.

### Checkpoint 5 (Bishal, both phones)

Walk `docs/qa/qa-matrix.md` on both dev builds. In PostHog Live events (or a debug proxy), a full challenge plus a share fires the expected events with no phrase text, no file paths and no audio; session replay shows nothing. Then decide on store submission yourself; Claude does not submit.
