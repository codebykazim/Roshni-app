# Roshni — Phase 1 MVP Build Plan

October 13, 2026 · Muhammad Kazim (Technical Co-founder)

This plan narrows the full technical document (`Roshni-Technical-Requirements-and-Execution-Plan.md`) into the smallest build that is **real, demoable at SEIC, and able to prove demand**. The technical document stays the long-term source of truth. This plan decides **what we build first, in what order, and what we deliberately leave out**.

## 1. Decision

**Start building now, but only the narrow core.** The goal of Phase 1 is a working Android app we can put in people's hands, not the whole 8-week scope.

Two tracks run in parallel:

| Track | Owner | Purpose |
| --- | --- | --- |
| **A. Build** | Technical co-founder | A working app, installable on a real phone, in 4 weeks |
| **B. Validate** | Whole team (business and health founders lead) | Interviews, a clinical adviser, pilot partners, first paid or co-sponsored pilot |

The strategy note's central point is accepted: the basic colour detector is easy to copy, so our real value is **Urdu-first, offline, privacy-first, trusted by clinicians, and sold through schools, clinics and NGOs**. Build the product to prove people reuse it; use Track B to prove someone will pay for the programme around it.

## 2. Scope: what is in and out

### In Phase 1 (Must ship)

| # | Feature | Tech doc ref |
| --- | --- | --- |
| 1 | Android app shell, 4 tabs (Home, History, Favourites, Profile), purple design tokens | §3, §4 |
| 2 | Pick from gallery or take a photo | §5.2 |
| 3 | Colour detection on the device: palette, descriptive names, hex, percentage | §5.2 |
| 4 | Tap any point on the photo to name that colour | §5.2 |
| 5 | **Live camera detection:** point the camera at an object and the colour under the centre reticle is named continuously; tap anywhere on the preview to read that point; tap Capture to take a photo and get the full palette; spoken on demand | §5.2, §5.3 |
| 6 | Voice readout in English and Urdu, replay, speech speed | §5.3 |
| 7 | Urdu and English interface with RTL | §3 (i18n) |
| 8 | Simulation: protan, deutan, tritan, achromatopsia with before/after | §5.4 |
| 9 | Local history and favourites (SQLite, no account) | §5.7, §5.8 |
| 10 | Disclaimer screen and wording: assistive tool, not a diagnosis, not for safety-critical use | §8 |
| 11 | Real Settings screen (language, voice) | §5.9 |

### In Phase 2 (weeks 5 to 7, after the demo)

| Feature | Condition |
| --- | --- |
| Colour vision screening test | Only after a clinician reviews the plates, scoring and wording |
| Bilingual FAQ (rule-based, offline) | Articles written by the health founder and reviewed by the adviser |
| "Was this colour right?" feedback and a general feedback form | Consent-based, no photos uploaded |
| Minimal analytics (PostHog, opt-in, no photos or free text) and crash reporting (Sentry) | Needed to measure reuse |
| Privacy policy, Play Store health declaration, closed-testing release | Needed before real users |

### Deferred (not in Phase 1 or 2)

Full LLM assistant · accounts, sign-in, cloud sync and backup · push notifications and announcements · colour correction (daltonisation) · premium and payments · institutional dashboards · iOS public launch · AR labels · web checker.

The reasons: none of these proves demand, they add backend and compliance work, and a bilingual FAQ is cheaper, safer and works offline. The assistant stays in the technical document as a later phase; the architecture does not change.

**What this removes from the backend:** Phase 1 and 2 need **no server**. All data is on the device. The API, PostgreSQL, auth and hosting in the technical document are built only when sync, the assistant or institution reporting is approved.

## 3. Phase 1 timeline (4 weeks to a demo build)

Calendar assumes work starts the week of October 13, 2026. Every week ends with an installable build.

### Days 1–2: Setup and risk spikes

- Create the repo and tooling:

```bash
pnpm create expo-app roshni --template
cd roshni && pnpm add nativewind expo-router expo-sqlite expo-speech expo-image-picker expo-image-manipulator expo-localization i18next react-i18next zustand
```

- Add ESLint, Prettier, TypeScript strict, a `docs/adr` folder, and GitHub Actions (lint + typecheck + test)
- Put design tokens (technical doc §4) in one file; set up NativeWind
- **Spike 1, Urdu voice:** check whether `expo-speech` reads Urdu on 3 real Android phones (low, mid, high range). Record the result as an ADR. If Urdu is missing on common devices, decide the fallback (message to user now, downloadable voice or cloud TTS later)
- **Spike 2, image pixels:** confirm downscaling a photo and reading its pixels works smoothly on a low-end phone
- **Spike 3, live camera:** in an EAS development build (Expo Go cannot run it), use `react-native-vision-camera` with a frame processor and a resize/convert plugin (for example `vision-camera-resize-plugin`) to read a small centre patch of each frame as RGB on a low-end phone. Pass mark: at least 8 readings per second without the phone heating or the preview stuttering. If it fails, use the fallback in Week 3
- Build an installable APK via EAS (`eas build -p android --profile preview`) on day 2 so the pipeline is proven early

**Exit:** blank app with 4 tabs runs on a phone; Urdu-voice and live-camera decisions made.

### Week 1: Colour engine and the first result

- `packages/color-engine` (plain TypeScript, no React Native): sRGB to LAB, k-means palette, merge close colours, nearest-name lookup with Light/Dark/Pale/Vivid modifiers
- Colour dictionary (about 200 names to start) with English names; Urdu names added in week 2
- Unit tests with reference values and a golden-image set (flat colours, a yellow poster, a wood-grain photo, clothing, fruit, low light)
- Upload screen (gallery and camera), analysing state, result screen: image, palette chips with name, hex, percentage, copy hex
- Tap-to-pick: tap the photo, average a 5×5 neighbourhood, show the name

**Exit:** a photo goes in and correct colour names come out, offline. Golden-image tests pass.

### Week 2: Voice, Urdu, history

- Voice readout: auto-read option, replay button, speech speed, top 5 colours, tap-to-pick speaks the single colour
- Urdu colour names and Urdu interface; RTL layout; Urdu font bundled
- SQLite tables: analyses and settings. History list, detail view, delete one, delete all
- Favourites (heart on a result), "N saved" counter, empty states
- Real Settings screen: language, voice, speed
- First-run onboarding: language, permission explanations, safety notice

**Exit:** the complete "identify and hear" flow works in English and Urdu, and data survives an app restart.

### Week 3: Live camera detection

- Live camera screen: full-screen preview with a centre reticle. The app reads a small patch (about 9×9 pixels) at the reticle from each frame, converts it to LAB, and shows the nearest colour name, hex and a swatch in a bottom card
- **Stability:** average the last few readings and only change the name when the new colour is clearly different, so the label does not flicker. Target 8 to 10 readings per second
- **Tap anywhere** on the preview to move the reticle and read that point
- **Capture button:** takes a photo and opens the normal result screen with the full palette (so "point and click" gives both a quick answer and a full analysis). The capture is saved to History with source `camera`
- **Speak:** tap the label (or a Speak button) to hear the name; optional auto-speak when the colour has been stable for about one second; speech does not repeat the same name continuously
- Torch toggle, front/back camera switch, permission handling and a clear message if camera access is denied
- Safety line on the screen: "Do not rely on this for traffic signals, wiring or medication"
- **Fallback if Spike 3 failed:** use `expo-camera`, take a low-resolution snapshot about once per second, and read the reticle patch from it. It feels slower but works in the same screens and needs no native frame processing
- Start the simulation engine: Machado (2009) matrices in `color-engine` with unit tests

**Exit:** point the phone at a coloured object and hear the correct name; Capture opens a full result; works offline on the three test phones.

### Week 4: Simulation, safety wording, demo build

- Skia colour-filter chain (gamma-correct) with a severity slider; Colour Blind Modes screen with mode cards; apply to the user's photo; before/after slider
- Disclaimer on first run, on the result and live camera footers, and in Settings. No health claims in any copy
- Accessibility pass: contrast 4.5:1, labels for TalkBack, 48 dp touch targets, text scaling to 200%, reduce motion
- Test everything on the low-, mid- and high-range phones; fix the worst bugs
- Final APK and a 2-minute scripted demo for SEIC (include live camera: point at a shirt, hear the name, capture, view the palette, switch to a simulation)

**Exit (demo build):** an installable APK that does detection from photos and the live camera, voice (EN/UR), simulation and local history, with disclaimers. This is what is shown at SEIC.

## 4. Phase 2 timeline (weeks 5 to 7)

| Week | Scope | Exit |
| --- | --- | --- |
| Week 5 | Plate generator and validator (original plates, checked with our own simulator); screening test flow; scoring and result screen with disclaimer; send plates, scoring and wording to the clinical adviser | Plates pass validation; clinician review requested |
| Week 6 | Apply clinician feedback; bilingual FAQ screen (offline) with the health founder's articles; feedback form and "Was this colour right?"; opt-in analytics and Sentry | Test and FAQ ready; no wording the adviser has not approved |
| Week 7 | Privacy policy, Play Store health declaration and data-safety form; store listing; closed-testing release; invite 20–30 beta users | Closed-testing build live; beta users onboarded |

If the clinician review is late, the test stays off the release and everything else ships.

## 5. Track B: Validation (runs from day 1)

The business and health founders lead these; the technical co-founder supports with demos and the build.

| Days | Goal | Output |
| --- | --- | --- |
| 1–14 | Interview 15 people with CVD, 5 parents or teachers, 5 eye-care professionals. Ask about recent real incidents, current workarounds and trust, not whether they like the idea. Secure one clinical adviser and two possible pilot organisations. Write one measurable hypothesis | Interview notes; adviser named; pilot targets |
| 15–45 | Show the demo build and watch users do three tasks. Recruit 20–30 beta users. Build a simple website (demo, team, safety limits, pilot enquiry form) | Task success rate; wrong-colour reports; website live |
| 46–70 | Run one small free pilot in exchange for structured data, testimonials and permission to publish anonymised results. Offer the next two pilots paid or co-sponsored. Collect letters of intent | One pilot completed; LOIs |
| 71–90 | Send at least 20 targeted proposals to schools, NGOs, clinics and CSR teams. Test two offers: a one-time screening campaign and an annual package | One paid pilot, or a clear reason why not |

**Pricing and market numbers in the strategy note are hypotheses**, not facts. Validate them in interviews before they go into a pitch.

## 6. Validation scorecard

| Signal | Green | Yellow | Red |
| --- | --- | --- | --- |
| Target-user interviews | 25+ | 10–24 | Under 10 |
| Core task success without help | 80%+ | 60–79% | Under 60% |
| 14-day reuse | 30%+ | 15–29% | Under 15% |
| Pilot partners | 2+ confirmed | 1 interested | None |
| Paid demand | 1 paid pilot or signed PO | LOI only | Praise only |
| Colour-name satisfaction | 85%+ | 70–84% | Under 70% |
| Clinician involvement | Active reviewer | Informal advice | None |

These are internal decision rules, not industry benchmarks. The app must therefore record the signals it can: task completion, repeat use after 14 days and the "Was this colour right?" rate, all anonymous and opt-in.

## 7. Technical decisions that follow from this plan

1. **Local-only for now.** No backend in Phase 1 or 2. Guest data lives in SQLite on the device. This is cheaper, more private and faster to ship.
2. **Free tools only:** Expo, EAS free build quota, GitHub Actions, Sentry and PostHog free tiers. Check quotas at the time of use because they change.
3. **Android first**, shipped as a signed APK for demos and Play closed testing for beta users. iOS waits for an Apple developer account and a reason.
4. **Colour engine stays a separate package** so the later server, assistant and web checker can reuse it unchanged.
5. **No medical language.** "Screening aid", never "test for colour blindness diagnosis". The adviser approves all result wording.
6. **The technical document is not rewritten.** It stays as the full roadmap. Items moved out of Phase 1 are listed in Section 2 with their section numbers.

## 8. Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Urdu voice missing on common phones | Core promise breaks | Day 1–2 spike, early decision, clear in-app message |
| Live camera too slow or hot on low-end phones | The headline demo feature feels laggy | Day 1–2 spike on a low-end phone, throttled readings, snapshot fallback |
| Wrong colour names | Users lose trust quickly | Golden-image suite, "Was this colour right?" feedback, no safety-critical claims |
| Clinical review delayed | Screening test cannot ship | Test is separate from the demo; everything else ships without it |
| Build takes longer than 4 weeks | No demo for SEIC | Cut order: simulation severity slider → real-time live camera (fall back to snapshot every second) → onboarding polish → favourites. Never cut detection, names or voice |
| Free competitors | Basic detector is easy to copy | Urdu, offline, privacy, clinician trust, institutional workflow |
| No payer | Users benefit but do not pay | Track B sells programmes and reporting to institutions and CSR teams |
| Child data | Schools will ask | Guest-first, no accounts, nothing leaves the device |

## 9. Decisions needed from the founders

| # | Question | Suggested default |
| --- | --- | --- |
| 1 | Approve this narrowed scope and freeze the technical document as the roadmap | Yes |
| 2 | Who is the clinical adviser, and by which date? | Named by the end of week 2 |
| 3 | Which two organisations are pilot targets? | Business founder proposes in week 2 |
| 4 | Founder agreement: roles, equity, vesting, IP assignment to the company | Written agreement before any funding or paid pilot |
| 5 | The technical co-founder's title and role | Technical Co-founder / CTO, as in the technical document |
| 6 | Who writes the FAQ articles (EN/UR)? | Health founder drafts, adviser reviews |
| 7 | When is the SEIC demo date? | Fix the date now so week 4 has a hard deadline |

## 10. Definition of Done: Phase 1 demo build

- An installable Android APK runs on three real phones (low, mid, high range) without crashing
- Detection names the golden image set correctly, offline, and repeatably
- Live camera names the colour under the reticle in real time (8+ readings per second, or the snapshot fallback), offline, and Capture opens the full result
- Voice reads results in English and Urdu on the tested phones, with replay and speed control
- Simulation shows protan, deutan, tritan and achromatopsia with before/after on the user's own photo
- History and favourites persist after restart
- The interface works in English and Urdu with correct RTL
- The disclaimer appears on first run, on results and in Settings; no health claims anywhere
- Accessibility basics pass: contrast, labels, touch targets, text scaling
- A scripted 2-minute demo runs end to end

Prepared for internal founding team review.
