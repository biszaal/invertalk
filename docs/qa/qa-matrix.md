# Invertalk — device QA matrix

Run on both development builds (a new dev build is needed after Phase 5: PostHog added native modules). Tick each cell; note device model and OS version.

| | iOS | Android |
| --- | --- | --- |
| Device / OS version | | |

## Audio formats (dev audio screen: Home → Audio test)

| Case | iOS | Android |
| --- | --- | --- |
| Mono, 44.1 kHz, ~3 s: record → reverse → reverse again sounds right | [ ] | [ ] |
| Stereo, 44.1 kHz, ~3 s (if the device records stereo) | [ ] | [ ] |
| 48 kHz, ~3 s | [ ] | [ ] |
| float32 encoding, ~3 s | [ ] | [ ] |
| 1 s and 20 s recordings (20 s auto-stops) | [ ] | [ ] |
| Silent input reaches the reveal | [ ] | [ ] |

## Game flow

| Case | iOS | Android |
| --- | --- | --- |
| First-run consent + permission grant | [ ] | [ ] |
| Not now → Home shows "needs your OK" | [ ] | [ ] |
| Permission denied → "Microphone is off" → Settings → return | [ ] | [ ] |
| Incoming call during record → message, Try again works | [ ] | [ ] |
| Background during record → message, Try again works | [ ] | [ ] |
| Background during playback → no crash | [ ] | [ ] |
| Full loop: phrase → reverse → imitate → reveal → replay | [ ] | [ ] |
| Play the original / Show the phrase on Reveal | [ ] | [ ] |
| Player 2 cannot see the phrase (swipe / Android back on hand-over) | [ ] | [ ] |
| iOS: long-press the Back button on Imitate — no menu of earlier screens appears | [ ] | n/a |
| Tap Stop exactly as the 20 s cap hits, then tap Record during "Stopped at 20 seconds." — Record stays locked, one hand-over only | [ ] | [ ] |
| iOS banner call while recording, app stays in front (known gap: may keep a silent/truncated take — re-record) | [ ] | n/a |
| Share sheet (audio only, no caption); cancel; share again | [ ] | [ ] |
| Temp files gone after × / New phrase / relaunch (dev screen listing) | [ ] | [ ] |
| Accessibility: record/stop/play labelled (VoiceOver/TalkBack); largest text size fits | [ ] | [ ] |

## Privacy

| Case | iOS | Android |
| --- | --- | --- |
| No audio upload — verified with a proxy (Proxyman/Charles): only PostHog events, none containing audio or phrase text | [ ] | [ ] |
| PostHog Live events: full challenge + share fire, no phrase text, no file paths, no `$device_name` | [ ] | [ ] |
| Session replay shows nothing in PostHog | [ ] | [ ] |

## Measurements

| Measure | iOS | Android |
| --- | --- | --- |
| Reversal time, 3 s take (ms) | | |
| Reversal time, 20 s take (ms) | | |
| Peak memory during a 20 s reversal | | |
| 20 s WAV size (bytes) | | |

Native crash-free rate comes from App Store Connect and Play Console vitals after release; PostHog only sees JS errors (`app_error`).
