# Invertalk brand

**Mark — "Two i's":** a lowercase **i** beside its upside-down twin **¡**. They are the two players: one says the phrase, the other says it backwards. Chosen from three directions on the design canvas (25 Nov 2026).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| Paper | `#F4F0E8` | `#151412` | Background |
| Card | `#FFFDF8` | `#201E1B` | Surfaces |
| Ink | `#1C1B19` | `#F4F0E8` | Text, the first figure |
| Saffron | `#F0A93A` | `#F0A93A` | The one accent: calls to action, the inverted figure, played audio |
| Pebble | `#6E6A62` | `#A8A196` | Secondary text |
| Stage | `#1C1B19` | `#24221F` | Dark cards for players and the hero |

Text on saffron is always ink. Every text/background pair meets WCAG AA. Code tokens: `src/ui/theme.ts`.

**Type:** Outfit (400–800) for everything, Geist Mono 500 for small labels and timers. Both are loaded in `src/app/_layout.tsx`.

**Files:**

| File | Use |
| --- | --- |
| `invertalk-icon.svg` | App and store icon (rendered to `assets/images/icon.png`, opaque) |
| `invertalk-glyph.svg` | Android adaptive foreground on `#1C1B19` |
| `invertalk-monochrome.svg` | Android themed icon |
| `invertalk-splash.svg`, `invertalk-splash-dark.svg` | Splash marks for light and dark mode |

In the app the mark is drawn with views (`src/ui/Mark.tsx`), with the same geometry: a 20-unit dot, a 6-unit gap and a 20 × 46 stem.

`concepts/` and `logo-concepts.png` are the earlier, blue speech-bubble round. They're kept for history.
