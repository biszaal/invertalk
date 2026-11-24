# Invertalk — Design Note

Date: 24 Nov 2026 · Status: approved approach, plan in `docs/superpowers/plans/2026-11-24-invertalk-mvp.md`

## Sources of truth

1. Notion: **Reverse Audio Challenge — Game Design & Build Plan** (wins on any conflict)
2. The handoff (same content, phased into five prompts): Notion page "Invertalk — Claude Code Handoff". The repo copy `CLAUDE_HANDOFF.md` was removed on 25 Nov 2026 after the MVP was built; it remains in git history.
3. Notion: Reverse Audio | MVP Technical Specification (older; build plan overrides it)

This note does not restate those documents. It records the approach we chose, the facts checked against the real packages on 24 Nov, and the small calls made where the documents leave room.

## Intent

Invertalk is a pass-and-play party microgame for one phone (iOS and Android, no account). Player 1 records a phrase; Player 2 hears it backwards and imitates the sound; the app reverses the imitation so it plays forwards. How close or how silly it sounds is the whole product.

It is a one-week **Test** for Biszaal Tech's microgame studio (trend score 61): build 24–30 Nov 2026, submit if QA passes, measure completion and shares 1–7 Dec. Success hypotheses: recording-to-reveal completion ≥ 60%, shares per 100 completed challenges ≥ 10, crash-free sessions ≥ 99%.

## Goals, non-goals, anti-goals

**Goals:** two people finish a challenge without help; reversal sounds right on real iOS and Android phones; one-tap audio share; privacy behaviour matches what the app and stores say.

**Non-goals (this week):** scoring or judging, speech recognition, ads/IAP, accounts, servers, video export, silence trimming, extra phrase packs, pitch/speed effects.

**Anti-goals (failure even if it "works"):** voice audio or phrase text leaving the device (upload, analytics, logs, crash reports); recordings left on disk after a game; Player 2 seeing the phrase before the reveal; a reversal path that flips compressed bytes or garbles audio mid-word; shipping a placeholder privacy policy.

## Approaches considered

| Approach | Trade-off | Verdict |
| --- | --- | --- |
| **A. Follow the handoff phase by phase** (Expo SDK 58, `expo-audio` `useAudioStream` → WAV, TypeScript frame reversal, device check after each phase) | Slower feedback loop (needs device builds), but every phase is proven on real phones before the next builds on it | **Chosen** |
| B. Build the whole app in one pass, test at the end | Faster to "done" on paper; an unproven audio path would sink every screen built on it | Rejected by the handoff |
| C. Record `.m4a` and decode, or use ffmpeg / a native module | More moving parts; ffmpeg-kit is retired; flipping AAC bytes is wrong | Ruled out by hard rules 6–7 |

## Decisions made in conversation (24 Nov)

- Follow the handoff as written; no scope changes.
- Scaffold directly into this folder (`/Users/bishalaryal/Documents/Github/invertalk`), not a nested `invertalk/invertalk`. `git init` locally; no remote until Bishal picks one.
- iOS builds go through EAS cloud (this Mac only has Xcode-beta 27, which Apple rejects for store builds).
- One plan covering all five phases; each phase ends at the handoff's on-device checkpoint and work stops there for Bishal to test.
- Pure logic gets Jest tests written first; screens and audio are verified on devices.

## Facts verified against packages on 24 Nov 2026

- `expo@58.0.26` is `latest`; `expo-audio@58.0.12`, `expo-sharing@58.0.23`, `expo-file-system@58.0.14`, `jest-expo@58.0.15` (peer `jest ^29 || ^30`). Default template: RN 0.88.1, React 19.3, TypeScript 6.0, `src/app`, React Compiler and typed routes on.
- `useAudioStream({ sampleRate, channels, encoding })` exists; encoding is `'float32' | 'int16'` (default float32). `stream.startFileRecordingAsync({ uri?, directory?, format: 'wav' | 'pcm' })` returns `{ uri }`; `stopFileRecordingAsync()` returns `{ uri, duration, size, sampleRate, channels, encoding }`. File recording is iOS/Android only.
- **`startFileRecordingAsync` accepts our own `uri`.** We name every file ourselves (`invertalk-<session>-<role>-<kind>.wav`) under one cache subfolder, which makes the cleanup sweep trivial.
- **The stream has no interruption/call event.** Its events are only `audioStreamBuffer` and `audioStreamStatus` (`isStreaming`). Call/background handling must combine `AppState` changes with `isStreaming` flipping to false.
- **`expo-audio`'s config plugin enables background playback by default** (`enableBackgroundPlayback = true`): iOS `UIBackgroundModes: audio`, Android `FOREGROUND_SERVICE_MEDIA_PLAYBACK` plus a media service. The handoff does not turn this off. We set `enableBackgroundPlayback: false` — the app never plays in the background, and both flags invite store-review questions (Apple background-audio use; Play foreground-service declaration).
- `expo-file-system` 58: `new File(...)`, `await file.bytes()`, `await file.write(Uint8Array)`, `file.delete()` (sync), `file.exists`, `new Directory(Paths.cache, 'x').list()`.
- `expo-sharing` has no caption/message option, so the "no phrase in the default caption" rule is met by sharing the file alone with a neutral `dialogTitle`.
- `create-expo-app@5.0.0` supports `--template default@sdk-58 --no-install --no-agents-md --yes`; the template's `reset-project` script is interactive, so we remove template files by hand instead.

## Calls made where the documents leave room (Bishal can override)

- **Too-short threshold:** a take under 0.5 s asks to try again. Silent takes ≥ 0.5 s pass through to reveal.
- **Custom phrase cap:** 60 characters, trimmed; Continue disabled when empty/whitespace.
- **Consent storage:** a small JSON file in `Paths.document` via `expo-file-system` (`{ consentVersion: 1, acceptedAt }`). No new dependency. Bumping `consentVersion` re-asks.
- **Session state:** a pure reducer in `src/game/challenge.ts` (Jest-tested) exposed through a React context. No state library.
- **File cleanup** is written against a small `FileOps` interface so the helpers are tested in Jest with a fake; the real adapter wraps `expo-file-system`.
- **Phrase leak paths:** swipe-back gesture disabled on Prompt, Imitate and Reveal; "Re-record phrase" on Prompt asks "Player 1 only — this shows the phrase. Continue?" before navigating.
- **Home "resume":** not built (optional in the plan); interrupted sessions start clean and the launch sweep deletes leftovers.
- **Result card:** skipped; share is audio-only. A card needs an extra view-capture dependency and `expo-sharing` shares one file per call. This is the plan's own cut-list order.
- **Dev audio screen:** the Phase 1–2 spike becomes `src/app/dev-audio.tsx`, reachable only when `__DEV__`, with sample-rate/channel/encoding pickers so the QA matrix (44.1 kHz, stereo, float32) can be exercised on devices. Deleted before any store build.
- **Interruption reason:** `background` when `AppState` leaves `active` for `background`; `call` when the stream stops by itself while the app is not backgrounded; `error` for thrown failures. Confirmed on devices in Phase 4.
- **Interrupted takes are always discarded** (the plan allows "keep only if complete and valid, otherwise discard"; always discarding is simpler and never keeps a half-take). The player sees "Nothing was saved" and Try again.
- **`reversal_completed.duration_ms`** is the reversal's processing time (the tech spec asks us to measure latency); `recording_completed.duration_ms` is the audio length.
- **`share_completed.success`:** `expo-sharing`'s `shareAsync` resolves `void` when the sheet closes and does not report cancel vs. sent, so `success: true` means "sheet closed without error".
- **Leaving the session:** Prompt, Imitate and Reveal get a header close (×) that ends the session (deletes files) and returns Home; Home also ends any session when it gains focus.
- **Analytics (Phase 5):** PostHog with session replay **and autocapture off** (touch autocapture can read element labels, which would include phrase text), app-lifecycle capture off, only the allowlisted events through one typed `track()` wrapper. Key from `EXPO_PUBLIC_POSTHOG_KEY`; when absent, `track()` is a no-op.
- **App version / settings link:** `expo-constants` (`Constants.expoConfig?.version`) and `Linking.openSettings()` / `Linking.openURL()` from React Native — no new dependencies.
- **Privacy policy URL:** one constant in `src/config.ts`, placeholder until the hosted page exists; the store checklist blocks submit while it is a placeholder.
- **EAS iOS image:** read the image the SDK 58 default picks in the first iOS build log; confirm it is Xcode 26+ and pin it explicitly on every iOS profile (per Bishal's standing ITMS-90725 rule).

## Left open (only Bishal can answer; none blocks Phase 1)

- Git remote location.
- Hosted privacy policy URL (required before submit).
- PostHog project and key (Phase 5).
- Final starter phrase list (current list is the handoff's proposal).
- Store listing copy.

## Decided after the plan (24 Nov)

- **Reveal adds two elements** beyond the build plan's list (Bishal's call): **Play the original** (Player 1's recording forwards) and **Show the phrase** (tap to show `It was: "<phrase>"`; hidden by default so the reveal audio lands first). The phrase still never appears on Prompt or Imitate, in share, or in analytics. Should be appended to the Notion build plan's Decision log.
- **Execution:** native (inline) in this session, phase by phase, stopping at each device checkpoint.
