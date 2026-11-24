# Invertalk — Claude Code Handoff

Written 24 Nov 2026 (Asia/Kathmandu) for Bishal to paste into Claude Code and start the repo from zero.

**Source of truth:** the Notion page "Reverse Audio Challenge — Game Design & Build Plan". If this file and any older "MVP Technical Specification" disagree, follow the build plan. Do not invent features, a backend, or a score.

- Store name: **Invertalk**
- iOS bundle id / Android package: `com.biszaal.invertalk`
- Working title (docs only): Reverse Audio Challenge

---

## Start here

Paste this entire file into Claude Code (or drop it in the project folder as `CLAUDE_HANDOFF.md`). Then send the prompts below, one phase at a time. Do not ask Claude to build the whole app in one shot. After each phase, install or reload the development build on a real iPhone and a real Android phone and check the acceptance points before sending the next prompt.

### Prompt 1 — repo, config, WAV record and playback (Tue 24)

```
We are starting Invertalk from a blank folder. Read CLAUDE_HANDOFF.md in this directory (or the Invertalk handoff I just pasted) and follow it exactly. The Notion build plan is the source of truth where this file and any older spec disagree.

Do only Phase 1 (Tue 24):

1. Create the Expo app with: npx create-expo-app@latest invertalk
   When asked, choose Latest (SDK 58). Use the default template (TypeScript + Expo Router).
2. Set the app display name to Invertalk. Set ios.bundleIdentifier and android.package to com.biszaal.invertalk.
3. Install expo-audio, expo-sharing, expo-file-system, and expo-dev-client with npx expo install. Do not install expo-av or any ffmpeg package.
4. Configure the expo-audio plugin with the microphone permission string from the handoff, recordAudioAndroid: true, and enableBackgroundRecording: false.
5. Add a development EAS profile (developmentClient: true, distribution: internal) and set up Jest with the jest-expo preset as described in the handoff.
6. Replace the template screens with a temporary spike screen only: request mic permission, set audio mode (allowsRecording true, playsInSilentMode true, shouldRouteThroughEarpiece false, interruptionMode 'doNotMix'), record a WAV with useAudioStream (encoding 'int16', mono) plus startFileRecordingAsync, then play that file back with useAudioPlayer. Cap recording at 20 seconds. No reversal yet. No full game UI.
7. Put reusable audio code under src/audio/. Do not invent a backend. Do not upload audio.

Stop when the project is configured and you have given me the exact eas build commands for iOS and Android development builds. I will install those builds on real devices and test record + playback myself before we go further.
```

**Verify Prompt 1 on device:** both iOS and Android development builds open. First-run mic permission appears. A 3-second take and a 20-second take record and play back clearly through the speaker (not the earpiece). The saved file is `.wav`, not `.m4a`. Silent-mode playback still works on iOS. Background recording is off.

### Prompt 2 — reverse frames, tests, file cleanup (Wed 25)

```
Continue Invertalk from CLAUDE_HANDOFF.md. Do only Phase 2 (Wed 25).

Implement the TypeScript WAV parser and frame-reversal module under src/audio/, with the unit tests listed in the handoff (mono/stereo, int16/float32, 44.1 and 48 kHz, extra chunks before data, trailing partial frame dropped, silence, a known waveform reversed sample-for-sample, non-WAVE rejected). Reverse complete audio frames, never raw bytes. Write a new WAV; do not mutate the original file in place.

Wire it into the spike: record → reverse → play the reversed clip → reverse again and play, so I can hear that a second reverse brings the phrase back. Add temp-file cleanup: distinct names for prompt vs imitation vs reversed copies, all under the app cache, deleted on cancel, retry, leaving the session, and on a leftover sweep at launch. Still no full game screens, no scoring, no server, no ffmpeg.

Stop when `npm test` (or the project's test script) passes and you have told me how to try the double-reverse path on a device.
```

**Verify Prompt 2 on device:** say a short phrase, hear it clearly backwards, then hear the second reverse sound like the original (maybe a little hiss, but the words should come back). Unit tests pass locally. After you leave the spike and reopen the app, leftover WAVs in the cache are gone. Check with a file listing or a debug line, not by guesswork.

### Prompt 3 — two-player loop and phrase pack (Thu 26)

```
Continue Invertalk from CLAUDE_HANDOFF.md. Do only Phase 3 (Thu 26).

Build the real screens and the local two-player pass-and-play loop: Home, Consent (show it before the first recording if not already accepted), Phrase select (starter pack plus a custom field), Record phrase (Player 1 may see the phrase), Reversed prompt playback (do not show the phrase once the phone is handed over), Record imitation (Player 2), Reveal (play the reversed imitation, replay, play the backwards prompt again, Retry imitation, New phrase). Follow the elements, states and transitions in the handoff. Use the proposed starter phrases. Custom Continue stays disabled on empty/whitespace text. Cap custom length. Keep the UI obvious in three seconds, with labels on record/stop/play and support for Dynamic Type.

No share sheet, no PostHog, no scoring, no video export. Keep file deletion when starting a new phrase, retrying, or leaving the session.
```

**Verify Prompt 3 on device:** two people finish a full challenge without help. Player 2 never sees the phrase on the handover or imitation screens. Retry imitation keeps the prompt and deletes the old attempt. New phrase clears the session. A custom phrase works. A very short recording asks them to try again. A silent take still reaches the reveal.

### Prompt 4 — share, consent, interruptions (Fri 27)

```
Continue Invertalk from CLAUDE_HANDOFF.md. Do only Phase 4 (Fri 27).

Add the OS share sheet with expo-sharing for the reversed imitation audio (optional simple result card only if it is cheap; otherwise audio only). Default share text must not include the phrase. If the user cancels the sheet, return to Reveal with no error. If sharing is unavailable, hide or disable Share.

Finish in-app recording consent (plain language: on-device only, no upload, temps deleted, analytics never include voice or phrase text), a Settings screen with a privacy-policy link (use a placeholder URL only if the hosted page is not ready — do not treat that as store-ready), consent status, and app version. Handle mic permission denied (button to open system settings). Handle incoming calls and app backgrounding mid-record: stop safely, Retry, do not crash. Cancel deletes in-progress temp files.
```

**Verify Prompt 4 on device:** Share opens the system sheet with audio and no phrase in the default caption. Cancelling the sheet returns to Reveal and a second share still works. Declining consent blocks recording and returns Home with a clear message. Denying the mic shows the settings path. Background the app mid-record and confirm it does not crash and offers Retry. Temps are still deleted on exit.

### Prompt 5 — analytics and ship-ready QA (Sat 28–Mon 30)

```
Continue Invertalk from CLAUDE_HANDOFF.md. Do only Phase 5.

Add PostHog on the free plan with session replay / session recording turned off. Instrument only the allowlisted events and properties in the handoff. Never send audio, file URIs, phrase text, or user-entered strings. Use an anonymous analytics id only; no accounts.

Add any remaining interruption/error copy, then walk the QA matrix in the handoff. Prepare store strings: the approved microphone usage string, and notes that App Store privacy / Play Data safety must match on-device audio, no voice upload, analytics without audio or phrase text, and no account. Do not submit to the stores yourself. Do not add ads, IAP, scoring, or video export.
```

**Verify Prompt 5:** in a debug log or PostHog project, events fire for a full challenge and a share, with no phrase text and no audio payload. Confirm session replay is off. Crash-free enough on both devices to consider store forms. Submission is a separate, manual step after QA.

---

## Goal

Invertalk is a local two-player pass-and-play party microgame for iOS and Android. No account.

Player 1 picks a short phrase and records it. The app plays that recording backwards. Player 2, who must not see the phrase, listens and imitates the backwards sound. The app reverses the imitation and plays it forwards — that is the reveal. If the imitation was close, it sounds something like the original phrase; if not, it sounds comically wrong. That surprise is the product. Then they replay, retry, start a new phrase, or share the reversed imitation through the OS share sheet.

This is a Test, not a proven trend. Build the loop in the week of 24–30 Nov 2026, submit if ready, and measure completion and shares from 1–7 Dec.

Success metrics are hypotheses only (review at 100+ meaningful play sessions): recording-to-reveal completion ≥ 60%; shares per 100 completed challenges ≥ 10%; crash-free sessions ≥ 99%; D1 retention ≥ 20% is exploratory.

## MVP scope (ship this)

- Local two-player pass-and-play on one device
- Starter phrases plus a custom phrase field
- On-device WAV recording, frame reversal, and playback
- Consent, mic permission, call/background handling, temp-file deletion
- Audio share via the system share sheet (a simple result card is optional if cheap)
- PostHog free plan, replay off, allowlisted events only
- Privacy policy link in the app (hosted URL must exist before store submit)

## Out of scope (do not build in this week)

- Scoring, streaks, "accuracy", speech recognition, or a winner state
- Ads, IAP, paywall, rewarded video, or any monetisation
- Accounts, sign-in, or online matchmaking
- Uploading voice to Supabase or any server
- ffmpeg / ffmpeg-kit
- Vertical 9:16 video export (P2 stretch; must not block store submission)
- Silence trimming, unless it is reliable and tested — if in doubt, ship without it
- More phrase packs, pitch/speed effects, or audio import
- A party-game hub of multiple studio games

---

## Hard rules (do not violate)

1. All recording, reversal and playback happen on-device. Do not upload voice audio to Supabase or any other server.
2. Do not send raw voice, audio files, or phrase text in analytics, logs, or crash reports.
3. Turn PostHog session replay / session recording off.
4. Delete temporary recordings when a challenge ends or the app leaves a completed session. Leftover files must not remain visible after a replay.
5. Do not use `expo-av` (removed in SDK 55). Use `expo-audio`.
6. Record to WAV / PCM. Do not reverse by flipping bytes of an `.m4a` / AAC file. Do not silently fall back to AAC.
7. Do not add ffmpeg or `ffmpeg-kit-react-native` (the official React Native package has been retired; it is not needed for WAV frame reversal).
8. No points or scoring in the MVP.
9. Vertical video export is P2 and must not block store submission.
10. Phrase pack must be original, short and family-friendly. No copyrighted lyrics, movie quotes, or third-party slogans.
11. Default share caption must not include the phrase.
12. Development builds, not Expo Go, for iOS and Android. WAV file recording on `AudioStream` is Android and iOS only.
13. Background recording stays off (`enableBackgroundRecording: false`).
14. Cap recordings at 20 seconds in the UI.

---

## Stack and setup

Verified against Expo docs on 24 Nov 2026:

- Expo SDK 58 is current. `npx create-expo-app@latest` prompts for Latest (SDK 58). The **default** template already includes TypeScript and Expo Router (`src/app`). Docs: https://docs.expo.dev/tutorial/create-your-first-app/ and https://docs.expo.dev/more/create-expo/
- `expo-audio` recommended version ~58.0.12. Docs: https://docs.expo.dev/versions/latest/sdk/audio/
- `expo-sharing` ~58.0.23. Docs: https://docs.expo.dev/versions/latest/sdk/sharing/
- `expo-file-system` ~58.0.14 uses `File`, `Directory`, and `Paths` (not the deprecated legacy `readAsStringAsync` API). Docs: https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/
- `expo-dev-client` + EAS development builds: https://docs.expo.dev/versions/latest/sdk/dev-client/ and https://docs.expo.dev/build/setup/
- Jest: `jest-expo` preset; SDK 58 requires Jest 30. Docs: https://docs.expo.dev/develop/unit-testing/

### Create the app

```sh
npx create-expo-app@latest invertalk
```

When the CLI asks for an Expo SDK version, choose **Latest (SDK 58)**. Use the default template. Then:

```sh
cd invertalk
```

You can run `npm run reset-project` to move the example tab screens out of the way, then put Invertalk routes in `src/app`.

### Install libraries

```sh
npx expo install expo-audio expo-sharing expo-file-system expo-dev-client
npx expo install jest-expo jest @types/jest --dev
```

Do not install `expo-av`. Do not install ffmpeg packages.

In `package.json`, add `"test": "jest"` (use `--watchAll` only if you want watch mode) and:

```json
{
  "jest": { "preset": "jest-expo" }
}
```

If the project uses TypeScript, add `"types": ["jest"]` under `compilerOptions` in `tsconfig.json`. Prefer `strict: true`.

### App config

Set these in `app.json` / `app.config.ts`:

- `name`: Invertalk
- `slug`: invertalk
- `ios.bundleIdentifier`: `com.biszaal.invertalk`
- `android.package`: `com.biszaal.invertalk`
- `android.versionCode` / `ios.buildNumber` as usual

Plugin (do not use the docs' generic "Allow $(PRODUCT_NAME) to access your microphone" string — use this approved wording):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-audio",
        {
          "microphonePermission": "$(PRODUCT_NAME) records your voice on this device so you can play a phrase backwards and hear a friend's imitation. Recordings stay on your phone and are deleted after the game.",
          "recordAudioAndroid": true,
          "enableBackgroundRecording": false
        }
      ]
    ]
  }
}
```

That permission string is `NSMicrophoneUsageDescription` on iOS. Android gets `RECORD_AUDIO` via `recordAudioAndroid: true`. Do not enable the `expo-file-system` file-sharing plugin (`enableFileSharing` / `supportsOpeningDocumentsInPlace`). Recordings must stay in the app cache, not appear in the Files app.

### EAS development builds

```sh
npm install --global eas-cli
eas login
eas build:configure
```

`eas.json` development profile:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    }
  }
}
```

```sh
eas build --profile development --platform ios
eas build --profile development --platform android
```

Install those builds on real devices. Then `npx expo start` and open the project in the dev client. Do not assume Expo Go can do the native WAV file-recording path.

---

## Recording, reversal, and playback

Preferred path (SDK 58), from the expo-audio docs:

1. `import { useAudioStream, useAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync } from 'expo-audio'`
2. Request permission with `requestRecordingPermissionsAsync()` after in-app consent, immediately before the first record attempt. Use `getRecordingPermissionsAsync()` if you only need to read current status.
3. Before recording:

```ts
await setAudioModeAsync({
  allowsRecording: true,
  playsInSilentMode: true,
  shouldRouteThroughEarpiece: false,
  interruptionMode: 'doNotMix',
});
```

4. Create the stream with `useAudioStream({ sampleRate: 48000, channels: 1, encoding: 'int16' })`. Default encoding is `'float32'` — ask for `'int16'` when the API allows it, but accept float32 if that is what the device writes and handle both in the parser. After `start()`, read `stream.sampleRate` and `stream.channels` (actual values may differ from the request).
5. Call `await stream.start()`, then `await stream.startFileRecordingAsync({ format: 'wav', directory: 'cache' })`. The promise resolves with `{ uri }`. The file is a valid, playable WAV from that moment. Only one file recording can be active at a time. File recording is Android and iOS only.
6. Stop with `await stream.stopFileRecordingAsync()` or `stream.stop()` (stop also finalizes an in-progress file recording). `stopFileRecordingAsync()` returns metadata: `uri`, `duration`, `size`, `sampleRate`, `channels`, `encoding`.
7. Play with `useAudioPlayer(uri)` (or `createAudioPlayer` if you must manage `release()` yourself). After the session, release players and reset audio mode so the app does not keep an exclusive session.

**Fallback only** if `startFileRecordingAsync` is missing or fails on a target device: record LINEARPCM (`IOSOutputFormat.LINEARPCM` / equivalent Android PCM) and wrap a correct WAV header. Log the decision. Do not fall back to AAC / `.m4a`. Do not use high-level recorder presets that typically write `.m4a`.

Read and write bytes with expo-file-system:

```ts
import { File, Paths } from 'expo-file-system';

const input = new File(uri);
const bytes = await input.bytes(); // Uint8Array

const output = new File(Paths.cache, 'reversed-prompt.wav');
await output.write(reversedBytes); // Uint8Array is supported
```

Cap duration at 20 seconds in the UI (auto-stop at the cap). 20 s of mono 16-bit 48 kHz is about 1.9 MB; keep the whole file as typed arrays is fine if you stay within the cap, but still test memory on mid-range phones.

---

## WAV parse / reverse module

Put this in `src/audio/` (suggested names):

- `wav.ts` — parse and write RIFF/WAVE
- `reverseWav.ts` — reverse the data payload by frames, return new bytes
- `recordWav.ts` — permission, audio mode, start/stop file recording
- `playback.ts` — play a WAV URI
- `files.ts` — cache paths, distinct names, delete helpers, launch sweep

### Parse rules

1. Read the file as bytes. Parse the RIFF / WAVE container properly. Do **not** assume the `data` chunk starts at offset 44. Walk chunks: handle `fmt ` and `data`, skip unknown chunks, fail clearly if the file is not a WAVE or if `fmt ` is missing.
2. From `fmt `, read audio format, channel count, sample rate, bits per sample, block align, and whether samples are int16 PCM or IEEE float32. Reject unsupported formats rather than corrupting them.
3. Frame size in bytes = number of channels × bytes per sample, and must match block align. The `data` payload length must be a whole number of frames. If a trailing partial frame appears, do not include it in the reversed output.
4. Reverse the **frame order** in the `data` payload only. For interleaved stereo, keep each frame's channel samples together. Do not reverse individual bytes.
5. Write a new WAV with the same format, channel count and sample rate. Leave headers consistent with the new data size.
6. Do not mutate the source file in place.

### Unit tests (must pass)

Fixtures and assertions:

- Mono int16 and stereo int16
- Mono float32 and stereo float32 if supported
- 44.1 kHz and 48 kHz
- Short (~1 s) and ~20 s inputs
- Silence
- A known waveform whose reversed output is asserted sample-for-sample
- A WAV that has extra chunks before `data` (parser must still find the data)
- Non-WAVE input is rejected
- Trailing partial frame is dropped, not reversed into the middle of a sample
- Sample rate and channel metadata are preserved
- File cleanup helpers delete the expected URIs and ignore missing files

Keep tests pure TypeScript over byte arrays so they run in Jest without a device.

---

## Suggested folder structure

```
invertalk/
  src/
    app/
      _layout.tsx
      index.tsx                 # Home
      consent.tsx
      phrase.tsx
      record.tsx                # Player 1, or a shared record screen driven by role
      prompt.tsx                # Reversed prompt playback / hand to Player 2
      imitate.tsx               # Player 2
      reveal.tsx
      settings.tsx
      permission-denied.tsx
    audio/                      # wav, reverse, record, playback, files
    game/
      challenge.ts              # state machine for the loop
      phrases.ts                # starter pack + custom validation
    analytics/
      events.ts                 # allowlisted PostHog wrapper
    ui/                         # shared buttons, timers, plain error copy
  assets/
  app.json
  eas.json
  CLAUDE_HANDOFF.md
```

The build plan mentions a later package split (game logic, audio engine, analytics, shared UI). Folders under `src/` are enough for this week. Do not start a monorepo unless it is already required.

---

## Screens and flow

Keep the UI obvious in three seconds, readable, and accessible (Dynamic Type, contrast, labels on icon-only controls, screen-reader labels on record/stop/play). Visual styling is not specified — keep it calm and clear, not a loud cartoon.

**Home** — app name Invertalk, short explanation, Start challenge, Settings. Optional resume only if a mid-challenge session was interrupted and files are still valid; otherwise start clean. Start → Phrase select, or Consent first if consent has not been accepted.

**Recording consent** — before the first recording, not buried only in Settings. Plain language: the mic records phrases and imitations; processing is on-device; audio is not uploaded; temporary files are deleted after the game; analytics do not include voice or phrase text. Link to the hosted privacy policy. Accept / Decline. Decline → Home, with a clear message that recording cannot start without consent. Consent can be reviewed again from Settings.

**Phrase select** — starter list, selected highlight, "Type your own", Continue, Back. Continue disabled while custom text is empty or only whitespace. Reject a custom phrase that is too long (a spoken line of a few seconds, not a paragraph). Continue → Record phrase (Player 1).

**Record phrase (Player 1)** — the chosen phrase is visible to Player 1; record/stop; elapsed time; max-duration indicator; permission and error messaging. States: need permission, permission denied, ready, recording, recorded, too short, hit max duration (auto-stop), interrupted. Successful recording → Reversed prompt playback. Back cancels and deletes any in-progress file.

**Reversed prompt playback (hand to Player 2)** — play/replay the reversed phrase; instruction to hand the phone over without showing the phrase; "I'm Player 2 — record my try"; Back / re-record phrase. **Do not display the source phrase on this screen.** Re-record deletes prior prompt files.

**Record imitation (Player 2)** — "imitate what you heard"; play the reversed prompt again; record/stop; elapsed time; **no phrase text**. Same recording states as Player 1. Successful recording → Reveal.

**Reveal** — play the reversed imitation (the forwards reveal); replay; play the backwards prompt again for comparison; Retry imitation (delete imitation files, keep the prompt); New phrase (delete session files); Share.

**Share** — system share sheet (`expo-sharing`), not a branded screen. Payload is the reversed imitation audio, or that audio plus a simple result card with no phrase text. Check `Sharing.isAvailableAsync()`. Default caption must not include the phrase. Cancel → Reveal, no error. After sharing, stay on Reveal so a second share still works; delete temps when the session is cleaned up.

**Settings** — privacy policy link; consent status and a way to re-read it; a short "recordings stay on this device and are deleted after a game" statement; app version.

**Permission denied** — why the mic is needed; button to open system settings; Back.

**Interruption / generic failure** — what happened (call, background, disk, reversal failure) in plain language; Retry; Cancel (deletes in-progress temps and returns safely).

### Recording and error behaviour

- Incoming call: stop recording, keep a finalized file only if it is complete and valid, otherwise discard and offer Retry. Do not crash.
- App backgrounded mid-record: treat as interruption, same Retry path.
- Permission denied or later revoked: Permission denied screen; do not spam the system prompt.
- Silent input: allow it; still run reversal and reveal.
- Very short recording: ask to try again.
- Reversal failure or unreadable WAV: plain error, offer re-record, delete the bad file.
- Disk / cache full: fail gracefully, delete temps, explain that recording could not be saved.
- Share unavailable: hide or disable Share, do not crash.

---

## Phrase pack

Hard rules: original writing only; short; easy to say; family-friendly; custom field required; never log or send custom phrase text; never put it in the default share caption. Preset phrases may have a stable `phrase_id` for analytics; custom phrases may only be tagged as `source=custom`.

Proposed starter pack (confirm before shipping, swap any line that feels off):

- Good morning everyone
- I like chocolate ice cream
- Please pass the salt
- The cat sat on the mat
- How are you today
- Let's go to the park
- The weather is nice today
- Red lorry yellow lorry
- She sells seashells
- Can you hear me now

Keep the list small. Do not add movie quotes or lyrics.

---

## Analytics (Phase 5)

PostHog free plan, session replay off, anonymous id only.

Never allowed on any event: audio, file URIs, phrase text, user-entered strings, contact info. If a property is not in this list, do not send it.

| Event | When | Allowed properties |
| --- | --- | --- |
| `consent_shown` | Consent screen appears | `platform` |
| `consent_accepted` | User accepts | `platform` |
| `consent_declined` | User declines | `platform` |
| `challenge_started` | Leaves Phrase select into Record | `platform`, `phrase_source` (`preset` \| `custom`), `phrase_id` (preset only) |
| `permission_result` | After a permission prompt | `platform`, `status` (`granted` \| `denied` \| `undetermined`) |
| `recording_completed` | A take is saved | `platform`, `role` (`prompt` \| `imitation`), `duration_ms`, `sample_rate`, `channels`, `encoding` (`int16` \| `float32` \| `other`) |
| `recording_interrupted` | Call, background, or error mid-record | `platform`, `role`, `reason` (`call` \| `background` \| `error`) |
| `reversal_completed` | Reversal finishes or fails | `platform`, `role`, `success`, `duration_ms`, `error_code` (opaque; no paths) |
| `challenge_finished` | Reveal is playable | `platform`, `total_duration_ms` |
| `share_clicked` | Share sheet opened | `platform`, `share_type` (`audio` \| `audio_and_card`) |
| `share_completed` | Share succeeded or cancelled | `platform`, `share_type`, `success` |
| `app_error` | Unexpected failure | `platform`, `error_code`, `screen` |

---

## Phased milestones (24–30 Nov 2026, Asia/Kathmandu)

| Phase | When | Work | Acceptance |
| --- | --- | --- | --- |
| 1 | Tue 24 | Repo, SDK 58, identifiers, plugins, Jest, EAS dev builds, WAV record + playback on both platforms | Capture and playback work on iOS and Android dev builds; file is WAV |
| 2 | Wed 25 | Frame reversal + unit tests; temp-file lifecycle | Tests pass; reversed-by-frames, no mid-word distortion; files deleted when a game is over |
| 3 | Thu 26 | All game screens; starter pack + custom phrase | Two people can record, reverse, imitate, reveal, and replay end-to-end |
| 4 | Fri 27 | Share sheet; consent; privacy-policy link; call and denied-mic handling | Share works; consent and permission paths work; interruptions do not crash |
| 5 | Sat 28–Mon 30 | PostHog replay off; QA matrix; store privacy strings | Events have no audio or phrase text; both devices QA'd; ready to consider submit. Submission is not the same as approval. Do not submit a broken reversal path just to hit the date. |

**Cut list if the week slips:** video export first (already P2), then result card (audio-only share still meets MVP), then silence trimming. Do not cut: on-device WAV reversal, file deletion, consent and privacy policy, permission and call handling, analytics without voice/phrase text, store privacy forms, the two-player loop.

### Device QA matrix (Phase 5)

Tick on both iOS and Android development builds:

- Mono, 44.1 kHz, ~3 s
- Stereo, 44.1 kHz, ~3 s (if the device records stereo)
- 48 kHz, ~3 s
- 1 s and 20 s recordings
- Silent input
- First-run consent + permission grant
- Permission denied and return from system settings
- Incoming call during record
- Background during record and during playback
- Full loop: phrase → reverse → imitate → reveal → replay
- Share sheet (audio)
- Temp files gone after exit / new phrase
- No audio upload (proxy or network log check)
- Analytics events fire without audio or phrase text; replay disabled
- Accessibility: record/stop/play labelled; text scales

Also measure latency, memory and output size on both platforms.

## Definition of done

- Two users complete a full challenge without assistance
- Permissions and failure states work
- No accidental recording persistence or cloud upload
- Tested on both iOS and Android development builds
- Analytics and privacy disclosures reviewed
- Store submission is a later, manual step, separate from store approval

## Open items Claude should not invent

- Git remote / GitHub repo location
- Hosted privacy policy URL (needed before store submit)
- PostHog project and keys (use env vars, never commit secrets or log them)
- Final store listing copy
- Whether the starter phrase list needs a last swap before ship

If a plan decision is wrong in implementation, stop and say so. Do not silently switch to `.m4a`, Expo Go, a server, ffmpeg, or a score.


---

## Appendix — light market notes (24 Nov 2026)

Not a build requirement. Figures are as the linked sources stated them. Do not add competitor features (scoring, ads, video export, movie-quote packs) to this MVP.

- The largest Play apps in this space are mostly simple reverse recorders, and reviews often complain about ads during recording. Reverse Talk: 5M+ downloads, 4.2 stars, 37.3K reviews, contains ads ([Play](https://play.google.com/store/apps/details?id=de.teamfunk.android.reversetalk)). Say It Backwards: 1M+ downloads, 4.7 stars, 15.2K reviews, ads + IAP ([Play](https://play.google.com/store/apps/details?id=pl.ayground.playbackapp)); iOS Lite 4.5 from 9.8K ratings, $4.99 to remove ads ([App Store](https://apps.apple.com/us/app/say-it-backwards-app-lite/id1066924497)).
- Reverse Audio: Voice & Singing (1M+, 4.2, ads + IAP) has a challenge mode, but recent reviews mention ads mid-recording and a subscription-trial complaint ([Play](https://play.google.com/store/apps/details?id=com.the.the_reverse_audio)).
- Reversy already ships the record → imitate → flip loop and 9:16 video share, with ads unlocking each recording, challenge, share or import, plus a Pro subscription ([App Store](https://apps.apple.com/my/app/reversy-reverse-audio-voice/id6751751979), [site](https://reversevoice.app/)). Invertalk's MVP stays ad-free and ships audio share first; video is P2.
- iOS party games already close to this loop: FlipSay (scoring, 1 rating, one review says muffled audio; includes movie quotes) ([App Store](https://apps.apple.com/us/app/flipsay-reverse-voice-game/id6761997623)); Rewind: Say It Backwards (duo, on-device, no ads, not enough ratings; appears iOS-only, Play presence unverified) ([App Store](https://apps.apple.com/ag/app/rewind-say-it-backwards/id6793848689)). BackChat! is the Android pass-and-play version (ads + Pro); official Play rating/installs were not shown on the listing fetched 24 Nov ([Play](https://play.google.com/store/apps/details?id=com.riverskylabs.backchat)).
- The TikTok "reverse singing" format is documented but not clearly accelerating. ugcMaxx library (17 Sep 2025–16 Oct 2026): 10 videos, 8 creators, 3.3M total views, typical 88.8K, top 1.2M; Sep 2026 monthly views 0, Oct 191K ([ugcMaxx](https://ugcmaxx.com/library/brand/reverse-singing)). Studio decision remains: build this as a Test.
- Gap Invertalk should fill: an ad-free, on-device two-player reveal on both iOS and Android, with original family-friendly phrases and no score. Do not copy copyrighted lyrics or movie quotes.
