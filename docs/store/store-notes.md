# Invertalk — store submission notes

Prepared 2026-11-25 from the shipped code (branch `mvp`). Submission is a manual step for Bishal. Re-check every answer against the build you actually upload.

## Blockers before any submit

- [ ] **Privacy policy URL.** Draft text: `docs/legal/privacy-policy.md` (fill its placeholders, host it). `src/config.ts` still has the placeholder (`PRIVACY_POLICY_IS_PLACEHOLDER = true`). Host the policy, set the URL, set the flag to `false`, and put the same URL in both store listings.
- [ ] **PostHog key.** Add `EXPO_PUBLIC_POSTHOG_KEY` to EAS (`eas env:create --name EXPO_PUBLIC_POSTHOG_KEY --environment preview --environment production`). Without it, the app sends no analytics; the answers below then overstate collection (allowed, but not ideal).
- [ ] **PostHog project settings:** turn on *Discard client IP data*, and leave session replay off at project level too. The app already disables GeoIP lookups.
- [x] **Dev audio screen removed** after QA (Checkpoint 5 passed). The launch sweep still deletes any `dev` temp files left by earlier QA builds.
- [x] **EAS project link.** `extra.eas.projectId` is in `app.json` (from `eas init`).
- [x] **App icon and splash.** Replaced with the Invertalk mark (concept D, `docs/brand/`); template Expo art removed.
- [ ] **Xcode image.** All iOS profiles pin `macos-tahoe-26.6-xcode-27.1` (Xcode 27.1 RC, the image EAS tags `sdk-58`). Apple normally accepts RC builds; if App Store Connect rejects it, switch to a stable 27.x image from the EAS infrastructure page.
- [ ] **Starter phrases** confirmed (or swapped) — `src/game/phrases.ts`.
- [ ] **Store listing copy.** Draft: `docs/store/listing.md` (fill its placeholders).

## Microphone usage string (iOS `NSMicrophoneUsageDescription`)

> $(PRODUCT_NAME) records your voice on this device so you can play a phrase backwards and hear a friend's imitation. Recordings stay on your phone and are deleted after the game.

Android requests `RECORD_AUDIO` with an in-app consent screen before the first prompt.

## What the app actually does with data

| Data | Behaviour |
| --- | --- |
| Voice audio | Recorded, reversed and played **on the device only**. Never uploaded. Temp files live in the app cache and are deleted when a game ends, on retry/new phrase, and at every launch. Leaves the device only if the user shares a reveal through the system share sheet. |
| Phrase text | Never sent anywhere. Not in analytics, logs, share caption or crash reports. |
| Analytics (PostHog, when a key is set) | 12 allowlisted events: consent, challenge started (preset id or "custom"), permission result, recording completed (duration, sample rate, channels, encoding), interruptions, reversal timing, challenge finished, share opened/closed, app errors (opaque code + screen name). Plus PostHog's default app/device properties (app version, OS, device model, locale, timezone); **device name is blanked**. A random anonymous ID; no accounts, no identify, no person profiles, no GeoIP, no session replay, no autocapture. |
| Account / contact info | None. |
| Location | None. |

## App Store Connect — App Privacy

- **Audio Data:** not collected (on-device processing only).
- **Usage Data → Product Interaction:** collected; not linked to the user; not used for tracking; purpose: Analytics.
- **Diagnostics → Crash Data / Other Diagnostic Data:** collected (opaque JS error codes); not linked; not tracking; purpose: App Functionality / Analytics.
- **Identifiers → Device ID:** judgement call. PostHog stores a random, app-generated anonymous ID. Declaring it (not linked, not tracking, Analytics) is the conservative answer.
- Everything else: not collected. **Tracking: No.**
- Export compliance: `ITSAppUsesNonExemptEncryption = false` (HTTPS only).

## Google Play — Data safety

- **Data collected:** App activity → App interactions; App info and performance → Crash logs and Diagnostics; Device or other IDs (anonymous analytics ID). Purpose: Analytics. Processed ephemerally: no. Required (no in-app opt-out).
- **Audio:** not collected (processed on device only).
- **Data shared with third parties:** No (PostHog acts as a service provider).
- **Encrypted in transit:** Yes.
- **Deletion request:** no account; data is anonymous. State this honestly in the form.
- **Permissions in the manifest:** INTERNET, VIBRATE, RECORD_AUDIO, MODIFY_AUDIO_SETTINGS only (storage and overlay permissions blocked; no foreground services).

## Age ratings

- **Apple:** no violence, mature themes, gambling, web browsing or user-to-user communication in the app. Custom phrases stay on the device; sharing goes through the OS sheet. Expected 4+; answer the questionnaire honestly.
- **Play / IARC:** same facts. The app does not let users talk to each other in-app; the OS share sheet is outside the app. Answer "users can share content" according to IARC's wording at the time.

## App Review notes (paste)

> Two players, one phone. Player 1 picks or types a short phrase and records it; the app plays it backwards. Player 2 listens and imitates the backwards sound; the app reverses that imitation so it plays forwards — the reveal. Audio never leaves the device unless the user taps Share. No account needed. A recording consent screen appears before the first recording.
