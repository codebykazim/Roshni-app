# Roshni — Technical Requirements & Execution Plan (MVP)

October 11, 2026 · Muhammad Kazim (Technical Co-founder)

**Version 1** is the first engineering document for Roshni. It is the source of truth for what we build, how, and when. The look and the user journeys follow the team's earlier AI-generated prototype, which has no source code and is not built on further; everything else in this document is new engineering.

**What Roshni is:** a mobile app that helps people with Colour Vision Deficiency (CVD) identify and understand the colours around them: it names colours in photos and through the camera, reads them aloud, shows how an image looks under each type of colour blindness, helps correct it, and lets users screen their own colour vision. English and Urdu at launch.

**Project:** Roshni — "Your Guide in a Colorful World"

**Stage:** Incubated at SEIC · MVP build, pre-seed

**Founders:** Alisha Khan (Pharmacy), Hafsa Tahir (Public Administration), Muhammad Kazim (Technology)

**Platform / Backend / Database:** Expo (React Native) + TypeScript / Node.js (Fastify) / PostgreSQL, with a local SQLite store on the device

**Access model:** Guest-first — every core feature works without an account and offline. An account is optional and adds cloud sync and backup.

**Primary lead:** Muhammad Kazim (Dev)

---

## 1. Product Objective

Give people with CVD a free, trustworthy, private way to answer **"what colour is this?"** quickly, in their own language, hands-free if needed.

The product must:

- Name colours accurately and consistently, with hex values, from a photo, the gallery or the live camera
- Speak results aloud in English and Urdu
- Show what a given CVD type sees (also useful to family, teachers and designers) and offer a correction view
- Offer a self-screening colour vision test with clear, honest results
- Answer questions about colours and colour blindness in plain language, in English and Urdu, through a CVD-focused assistant
- Work offline and keep images on the device by default
- Be accessible to its own users first (never rely on colour alone to convey information)

**Roshni is an assistive and educational tool, not a medical device.** The test is a screening aid, not a diagnosis, and the app must say so wherever results are shown (see Section 8).

Why now (from the pitch): about 300 million people live with CVD globally; in Pakistan roughly 5.3% of men and 2.1% of women (≈ 9 million people). Existing options are fragmented, generic, or physical and expensive, with little regional language support.

## 2. Users & Access Model

| Role | Who | Access |
| --- | --- | --- |
| Guest user | Anyone who installs the app | All on-device features, with no sign-up. Data stays on the phone |
| Registered user | A guest who signs in (email code or Google) | Same features plus cloud backup/sync across devices and, later, premium features |
| Premium user (later) | Registered user with an active entitlement | Higher image limits, higher assistant message limits, enhanced simulation (per the pitch's freemium model) |
| Admin (internal) | Founders | Read-only analytics, feedback inbox, announcement publishing, remote config. No access to user images |
| Institutional partner (later) | Clinics, schools, NGOs | Sponsored access codes and aggregate reports. Out of MVP scope |

**Primary personas:** (1) an adult with red-green CVD who wants quick answers while choosing clothes or reading charts; (2) a parent or teacher of a child who may have CVD; (3) someone who suspects they have CVD and wants a first screening; (4) a designer or student who wants to preview an image as a CVD viewer sees it.

**Sign-up model:** there is no mandatory sign-up. The first launch asks for a language and shows what the app asks for and the safety notice, then lands on Home. It never asks about the user's own colour vision (see ADR 0005). Sign-in is offered, never forced, in Profile and after the user has saved something worth backing up.

## 3. Technology Stack

| Layer | Technology | Why |
| --- | --- | --- |
| Mobile app | Expo (React Native) + TypeScript (strict), Expo Router | One TypeScript codebase for Android and iOS. OTA fixes via EAS Update |
| Styling | NativeWind (Tailwind for RN) + a shared design-token file | Utility-class styling with all design tokens kept in one place |
| Image processing | `@shopify/react-native-skia` (GPU colour filters, pixel reads), `expo-image-manipulator` (downscale) | Real-time simulation/correction at 60fps with no per-pixel JS loops |
| Live camera (Phase 1) | `react-native-vision-camera` with a frame processor | Needed to sample colour from live frames. Requires a dev build rather than Expo Go |
| Voice | `expo-speech` (on-device TTS) | Offline, free, supports the device's installed voices including Urdu where available |
| Local data | `expo-sqlite` + Drizzle ORM | Offline-first history, favourites, settings and test results |
| State / forms | Zustand, TanStack Query, React Hook Form + Zod | Small, typed, no boilerplate |
| i18n | `i18next` + `expo-localization`, RTL via `I18nManager` | English + Urdu, with RTL layout |
| Backend | Node.js 22 + Fastify + TypeScript | Lightweight, fast, schema-first (Zod). Same language as the app |
| Database | PostgreSQL + Prisma | Consistent with our other projects; migrations and typed queries |
| Auth | Passwordless email code (OTP) + Google Sign-In; short-lived JWT + rotating refresh tokens (hashed in DB) | No passwords to store or leak. Simple UX for a non-technical audience |
| Email | Resend (or Postmark) | OTP and transactional mail |
| Object storage | Cloudflare R2 / S3-compatible | Opt-in thumbnail backup only |
| Assistant (Should) | A free-tier hosted LLM (candidates: Gemini, Groq-hosted Llama, OpenRouter free models, Cloudflare Workers AI), always called through our own backend proxy. Provider chosen after a bake-off in Week 0 / Week 6. Postgres full-text search for the knowledge base | A CVD-focused chat assistant. No model training and no paid API. Keys never ship in the app. The provider can be swapped by configuration |
| Push | `expo-notifications` | Announcements and test reminders |
| Observability | Sentry (crash/performance), PostHog (product analytics, feature flags) | Needed to run the pilot and prove traction |
| Build & release | EAS Build / Submit / Update, GitHub Actions | One pipeline for Android and iOS |
| Hosting | Railway, Render or Fly.io for the API; managed Postgres (Neon or Railway) | Low-ops for an MVP, easy to move later |

**Why Expo.** One TypeScript language across app, API and shared logic, one codebase for both stores, and OTA fixes through EAS Update. This is recorded as an ADR.

### Repository layout (monorepo, pnpm workspaces)

```
roshni/
├─ apps/
│  ├─ mobile/            # Expo app (Expo Router, NativeWind)
│  └─ api/               # Fastify API + Prisma
├─ packages/
│  ├─ color-engine/      # PURE TypeScript: colour spaces, palette extraction,
│  │                     # naming, CVD simulation matrices, scoring. No RN imports
│  ├─ plates/            # Offline plate generator + validator (Node script) + shipped plate assets
│  ├─ shared/            # Zod schemas, API types, constants
│  └─ config/            # ESLint, tsconfig, Prettier presets
├─ docs/
│  ├─ adr/               # Architecture Decision Records (one per major decision)
│  └─ this document
└─ .github/workflows/
```

The colour logic lives in `color-engine` with **no React Native dependency**. That makes it unit-testable in plain Node, reusable by the API (the assistant's colour tools call it server-side) and safe to change without launching a phone.

## 4. Brand & UI System

The visual identity is a purple palette with soft tinted cards. These are the design tokens for the app.

| Token | Value | Used for |
| --- | --- | --- |
| `primary-800` | `#6B21A8` | Screen headers |
| `primary-600` | `#7C3AED` | Hero card, primary buttons, active tab |
| `primary-700` | `#7E22CE` | Text on white buttons |
| `primary-300 / 200 / 100` | `#D8B4FE` / `#E9D5FF` / `#F3E8FF` | Subtitles, tints, feature-card background |
| `primary-50` | `#FAF5FF` | Tip / "Did you know" cards |
| `surface` | `#FBFAFF` | App background |
| `ink` | `#140A1F` | Primary text |
| `night` | `#1E0A3C` | Colour-test card |
| Feature accents | blue `#2563EB` on `#EFF6FF`; red `#DC2626` on `#FEF2F2`; green `#059669` on `#ECFDF5` | Feature tiles |
| `muted` | `#9CA3AF` | Inactive tab icon only (never used for text; see rules) |

**Shape:** 16 px card radius, 12 px control radius, pill chips. **Icons:** Ionicons. **Type:** system font (Roboto on Android); Urdu uses Noto Nastaliq Urdu or Noto Naskh Arabic, bundled. **Navigation:** 4 bottom tabs (Home, History, Favorites, Profile) plus stack screens.

**Design rules:**

- Text contrast of at least 4.5:1 (WCAG 2.2 AA). Inactive tab labels use a darker grey than `muted`
- Colour is never the only signal: every swatch carries its name as text, every status carries an icon or label
- Touch targets of at least 48 dp; support system text scaling up to 200%
- Every control has a screen-reader label (TalkBack / VoiceOver) and a logical focus order
- Respect "reduce motion"; all animation is optional
- A high-contrast theme and a dark theme (Should), both using the same tokens

## 5. Core Modules

### 5.1 Onboarding & Language

- First launch: choose language (English / اردو), then camera and photos permission explanations and the safety notice
- Roshni does not ask whether the user has a colour vision deficiency: the answer would only change a default, and health-like questions do not fit a privacy-first product
- Never blocks the app

### 5.2 Colour Detection (core)

**Input:** gallery (JPG, PNG, WEBP), camera photo, or drag and drop (web). Cap import at 12 MP; downscale before analysis.

**Pipeline (all on device):**

1. Downscale to a maximum of 256 px on the long edge and read RGBA pixels
2. Ignore transparent pixels; convert sRGB → linear → CIELAB (D65)
3. Cluster in LAB with k-means++ (k = 8, fixed seed so results are repeatable)
4. Merge clusters closer than ΔE₀₀ ≈ 10; drop clusters below about 2% of pixels; sort by share
5. **Name each colour:** nearest entry in a curated colour dictionary by CIEDE2000, then add a lightness / saturation modifier from LCh ("Dark", "Light", "Pale", "Vivid") so the name is useful to someone who cannot see the hue
6. Return: hex, RGB, HSL, name (EN/UR), share of image

**Screens:** Upload → Analysing → Result (image on top, palette chips with name + hex + share %, heart to favourite, copy hex, speak, share). **Tap-to-pick:** tapping the image reads that pixel's neighbourhood (5×5 average) and names it instantly.

**Accuracy requirements:** a golden-image test set (flat colours, gradients, photos of a shirt, fruit, wires, a traffic-light-style image) with expected names reviewed by a founder with CVD-aware feedback. Pure-colour inputs must name correctly 100% of the time. Any real-world image that is ever named wrongly is added to the suite as a permanent regression test.

**Honesty about "AI":** the core colour engine is deterministic colour science, which is faster, offline and testable. "AI" in the product refers to the Roshni Assistant in 5.5, and marketing copy should reflect that. We do not claim a trained neural network for detection.

### 5.3 Voice Assistant

- Auto-read on result (setting: on by default for users who say they have CVD) and a Replay button
- Output format: "The image contains 4 colours: dark teal (42%), pale yellow (30%)…", capped at the top 5; longer lists on request
- Settings: language (EN/UR), speech rate, voice, on/off
- Tap-to-pick speaks the single colour name immediately
- The "Speaking…" screen uses a waveform or ring animation that respects reduce-motion
- **Urdu voice availability varies by device and OS version.** A Week 1 spike tests the target devices. If Urdu TTS is missing, the app shows a clear message and (as a Should) falls back to cloud TTS
- Assistant replies (5.5) also get a [Speak] button; **later:** voice commands ("what colour is this?") and voice input to the assistant

### 5.4 Colour Blind Modes (Simulation & Correction)

| Mode | What it shows |
| --- | --- |
| Normal | Original image |
| Protanopia | Red-blind |
| Deuteranopia | Green-blind |
| Tritanopia | Blue-blind |
| Achromatopsia | Greyscale only |
| Anomalous trichromacy | A severity slider (0–100%) for protan / deutan / tritan |
| **Correction (Daltonisation)** | Shifts hard-to-distinguish colours toward distinguishable ones for the user's chosen type |

- Implemented as Skia colour-filter chains, with gamma-correct sRGB → linear → matrix → sRGB, using the Machado et al. (2009) matrices for protan / deutan / tritan (precomputed at 11 severities) and luminance for achromatopsia
- Before/after slider and a pinch-to-zoom viewer
- Each mode card shows a preview colour strip generated from the same matrices as the real filter, so the two always agree
- A short caption states that simulations are approximations of real-world vision

### 5.5 Roshni Assistant (Should-have)

A chat assistant, like a messaging-app AI helper, but **only for colours and colour blindness**. Users ask in English or Urdu; Roshni answers in the same language.

**Entry points**

- **Standalone:** Home tile and `/assistant` screen, no photo needed
- **From a colour result:** the "Ask Roshni about this" button opens the chat with that image's detected palette attached
- **From a test result:** "Explain my result" opens the chat with the test classification attached

**What the user can ask**

| Type | Examples |
| --- | --- |
| General knowledge | "What is the difference between deuteranopia and protanopia?"; "Can colour blindness be cured?"; "Why can't I tell green from brown?" |
| Daily life | "How do I choose clothes with red-green colour blindness?"; "My son confuses colours at school, what can I do?" |
| About a photo (palette attached) | "Will this shirt match these trousers?" (dark red 40%, olive green 35%); "Is this fruit ripe?" |
| About a test result | "What does my test result mean?" |
| Colour pairs | "Will these two colours look different to someone with deuteranopia?" (answered by the colour engine, not guessed) |
| Out of scope (politely declined) | Diagnosis requests ("Do I have colour blindness?") → "I can't diagnose; please see an eye-care professional"; safety questions ("What colour is the traffic light?") → safety notice; unrelated topics → "I can only help with colours and colour blindness" |

**How it is made specific to colour blindness (no model training)**

1. **System prompt:** Roshni's role, scope (colours, CVD, the app), tone, reply in the user's language, never diagnose, never give medical or safety-critical advice
2. **Knowledge base:** a curated set of articles (CVD types, everyday tips, FAQ, how to read the test result), written in English and Urdu and reviewed by a clinical reviewer before release. The server retrieves the most relevant passages (Postgres full-text search) and gives them to the model as the trusted source
3. **Colour-engine tools:** the model may call `nameColour(hex)`, `compareColours(hexA, hexB, cvdType)` and `simulateSwatch(hex, cvdType)`, which run our deterministic `color-engine`. Facts about colours come from calculations, not from the model's guess
4. **Palette as text:** the photo never leaves the device. The app sends the palette ("dark red 40%, olive green 35%, pale yellow 25%"), so a free text-only model is enough

**Flow**

```
HOME ──► Upload Image ──► Colour engine (on device) ──► RESULT SCREEN
 │                                                        │  [Ask Roshni about this]
 ├──► Colour Vision Test ──► TEST RESULT ──[Explain my result]
 └──► Assistant (standalone)
                 │  user message + optional context (palette text / test class)
                 ▼
      App ──► Backend proxy (auth or device token, daily limit, input checks)
                 ▼
      1. System prompt  2. Knowledge-base search  3. Colour-engine tools  4. Free-tier LLM
                 ▼
      Answer in the user's language + disclaimer, with a [Speak] button
```

**Phases**

- **Phase A (Week 6):** rule-based FAQ matching over the knowledge base. No LLM; the cached articles work offline
- **Phase B (Week 7):** LLM chat through the proxy, with tools and knowledge base. Gated by a remote flag, so it can be switched off without an app release
- Later: on-device small model, voice input

**Provider selection (before Phase B ships):** test 30–50 questions per candidate in English and Urdu (correctness, refusal behaviour, Urdu fluency, latency). Check the free-tier limits and the data-use terms: a provider that trains on our users' messages is rejected. Record the result as an ADR

**Rules**

- Daily message limit per user or device, enforced server-side (a small number to start; adjustable remotely)
- Every answer that touches health carries a short disclaimer: "This is general information, not medical advice"
- Safety notice: "Do not rely on Roshni for traffic signals, wiring or medication"
- Prompt-injection guard: user text and palette are treated as data; the model cannot change its scope or call anything outside the three colour tools
- Chat history is stored on the device only; syncing it is an opt-in setting. The server stores usage counts, not message content
- When offline the screen says so and shows FAQ articles that are already cached
- Provider, model and prompt are server-configured, so they can change without an app release

### 5.6 Colour Vision Test

- **Content:** around 24 original pseudo-isochromatic plates, of which 10–14 are drawn per test: demonstration, red-green screening (transformation, vanishing, hidden-digit), protan/deutan classification, and tritan screening
- **No copied plates.** Published Ishihara plates are protected; we generate original plates (see 5.6.1). In-app wording is "Colour Vision Test" with "Ishihara-style plates" only if legal confirms it is safe; avoid the trademark in the store listing
- **Flow:** instructions with brightness and lighting guidance, then plate by plate (digit options plus "I can't see a number", with a time guide), then result
- **Result:** Normal / Likely red-green deficiency (mild or strong, protan or deutan indication) / Possible blue-yellow deficiency / Inconclusive (retake) with a plain-language explanation, the plates missed, a recommendation to see an eye-care professional and the medical disclaimer
- Results are saved to local history and (if signed in) synced. Users can export a one-page summary (Should) to show a clinician

**5.6.1 Plate generator (offline tooling in `packages/plates`)**

1. Render the target digit from a font to a mask
2. Pack the plate with non-overlapping circles of varied radius (circle packing, seeded)
3. Colour dots inside the digit from the "figure" palette and the rest from the "ground" palette, with lightness jitter so brightness cannot be used as a cue
4. Palettes lie along protan / deutan / tritan confusion lines
5. **Automated validation using our own simulator:** for each plate, normal vision must read the digit with high contrast (ΔE above threshold), while the simulated protan/deutan image must fall below it. Plates that fail are discarded
6. Ship the approved plates as static assets (SVG/PNG) with an answer key. Nothing random is generated at runtime, so results are reproducible and auditable

**Clinical credibility:** the scoring table is a screening heuristic. Before we claim any accuracy figure, a clinician (for example through SEIC's or our pharmacy network) reviews the plates, rules and wording. Until then the app makes no accuracy claim.

### 5.7 History

- Each analysis saves a thumbnail (local), palette, date, mode used and source
- List view (thumbnail, "N colours detected", swatches, date); tap for the full result; swipe to delete; trash icon clears all (with confirmation)
- Search/filter by date or colour name (Should)

### 5.8 Favourites

- Heart on a result favourites the analysis; a single colour can also be favourited (Should)
- Empty state with guidance; "N saved" counter in the header

### 5.9 Settings

Language · Speech (voice, rate, auto-read) · Display (theme, high contrast, text size) · Data and privacy (what is stored, clear history, opt-in thumbnail backup, opt-in analytics) · Account (sign in, export my data, delete my account) · About (version, licences, disclaimer, contact and feedback)

### 5.10 Profile & Account

- Guest state: "Welcome to Roshni", quick links, and a "Back up your data" sign-in prompt
- Signed in: email, sync status, devices, sign out, delete account (required by both stores)
- Sign-in methods: email code, Google

### 5.11 Notifications

- The bell opens an **announcements inbox** (new features, awareness tips, "retake the test" reminders); backed by the API and optionally push
- Users can turn push off. Notifications never contain a user's data

### 5.12 Feedback & Pilot Support

- In-app feedback form (rating, text, optional screenshot, optional contact) that feeds the pilot's testimonial and improvement loop from the pitch (Traction step 3)
- Optional "Was this colour name right?" thumbs on a result. This data improves the dictionary and is high-value for validation

## 6. Information Architecture & Screens

| Route | Screen |
| --- | --- |
| `/onboarding` | Language, permissions, safety notice |
| `/home` | Hero "Upload Image", feature grid, colour-test card, "Did you know?" |
| `/upload` | Drag and drop, Choose from Gallery, Take a Photo, formats note |
| `/result/[id]` | Image, palette, tap-to-pick, speak, favourite, simulate, Ask Roshni |
| `/voice` | Voice assistant |
| `/color-blind-modes` | Mode picker, apply, compare |
| `/camera` | Live camera colour reader (Phase 1) |
| `/test` , `/test/result` | Colour vision test and result |
| `/features`, `/how-it-works` | Marketing/help screens |
| `/history`, `/history/[id]` | History |
| `/favorites` | Favourites |
| `/profile`, `/settings`, `/auth` | Profile, settings, sign-in |
| `/assistant` | Chat with Roshni (standalone or with attached context) |
| `/announcements`, `/feedback` | Inbox, feedback form |

Bottom tabs: Home · History · Favourites · Profile. The "Settings" tile on Home opens the real Settings screen, and Colour Blind Modes gets its own tile.

## 7. End-to-End User Flows

1. **First run:** choose language → permissions and safety notice → Home
2. **Identify colours:** Home → Upload Image → pick or capture → analysis (under 1 s) → result with palette → auto-read → tap any point to name it → favourite or save to history
3. **See through CVD eyes:** result → Simulate → choose mode and severity → before/after → (optional) Correction view
4. **Check my vision:** Home → Colour Vision Test → instructions → plates → result and guidance → saved to history
5. **Back up:** Profile → Sign in (email code or Google) → local data uploads → available on a new device
6. **Get help:** Settings → Feedback → submitted → appears in our feedback inbox
7. **Ask Roshni:** result or test result → "Ask Roshni" (or Home → Assistant) → type a question → answer in the user's language with disclaimer and [Speak]

At any point the user can switch language, with immediate RTL/LTR layout change.

## 8. Non-Functional Requirements (Trust, Privacy, Safety)

These are hard requirements.

**Privacy**

- Images are processed **on the device** and are not uploaded except for assistant messages (text and, when attached, palette text only) and opt-in thumbnail backup, each revocable
- Analytics are opt-in and exclude images, colours of user photos and free text
- "Delete my account" removes all server data (users, sync data, test results, device tokens, usage logs) within a defined window, and the app confirms it
- A published privacy policy and the store data-safety forms are completed accurately before release
- Users under 18 (schools are a target) need a parent/guardian consent flow for accounts; guests stay data-local, so the safest route for children is guest mode

**Medical and safety positioning**

- Roshni is not a medical device and does not diagnose. Test results show: "This is a screening aid, not a diagnosis. Please see an eye-care professional." The same applies to the store listing and marketing
- Safety-critical disclaimer on the assistant and the live camera
- No health-claim wording in the store listing without clinical review

**Performance**

- Analyse a 12 MP photo in under 1.5 s on a mid-range Android phone (the downscale dominates)
- Simulation filter at 60 fps while the slider moves
- Live camera: 8 to 10 colour readings per second on a mid-range phone, smoothed so the name does not flicker (Phase 1)
- Cold start under 3 s; APK/AAB under about 60 MB; works fully offline except sync, the assistant's LLM replies and announcements

**Compatibility:** Android 8.0+ first, because the Pakistani market is predominantly Android (confirm against the minimum of the chosen Expo SDK); iOS 15+ built from the same code and shipped through TestFlight / App Store when the Apple developer account is in place.

**Security:** HTTPS only, hashed refresh tokens, OTP rate limiting and expiry, input validation with Zod on every endpoint, role checks on server, secrets in the host's secret store (never in the app bundle), dependency scanning in CI, per-user rate limits on the chat endpoint, no secrets in logs.

**Accessibility:** WCAG 2.2 AA targets as in Section 4, verified on TalkBack and VoiceOver before release, and reviewed by at least a few real CVD and low-vision users in the pilot.

**Reliability:** crash-free sessions of 99% or better in the pilot; offline operation is tested, not assumed.

## 9. Database Schema

Two stores share a vocabulary: **SQLite on the device** (source of truth for guests) and **PostgreSQL on the server** (only for signed-in users). Field names are suggestions; keep types and naming consistent with Drizzle (device) and Prisma (server).

### Device (SQLite)

| Table | Key fields |
| --- | --- |
| `analyses` | id (UUID), created_at, updated_at, source (`gallery` / `camera` / `live`), thumb_path, width, height, palette (JSON: hex, rgb, name_en, name_ur, share), mode_used, is_favorite, deleted_at (tombstone), synced_at |
| `test_results` | id, taken_at, plate_ids (JSON), answers (JSON), score, classification, version_of_scoring, synced_at |
| `chat_threads` / `chat_messages` | id, thread_id, role (`user` / `assistant`), content, context (JSON: palette or test class, nullable), created_at, synced_at (null unless opt-in sync) |
| `settings` | key, value (language, speech rate, auto-read, theme, analytics opt-in, backup opt-in) |
| `sync_state` | last_pull_at, last_push_at |

### Server (PostgreSQL)

#### users

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID / PK |  |
| email | string, unique | verified through the OTP |
| google_sub | string | nullable, unique |
| display_name | string | nullable |
| locale | enum | `en`, `ur` |
| role | enum | `user`, `admin` |
| status | enum | `active`, `suspended`, `deleted` |
| created_at / updated_at / last_login_at | timestamp |  |

#### auth_sessions and otp_codes

| Table | Fields | Notes |
| --- | --- | --- |
| `otp_codes` | id, email, code_hash, expires_at, attempts, consumed_at | Rate limited; single-use |
| `auth_sessions` | id, user_id, refresh_token_hash, device_id, created_at, expires_at, revoked_at | Refresh tokens rotate on use |

#### devices

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID / PK |  |
| user_id | FK → users.id | nullable for guests who enable push |
| platform | enum | `android`, `ios` |
| push_token | string | nullable |
| app_version / os_version | string |  |
| last_seen_at | timestamp |  |

#### user_settings

| Field | Type | Notes |
| --- | --- | --- |
| user_id | FK → users.id, PK |  |
| speech_rate / auto_read / theme | mixed | Mirrors the device settings |
| backup_thumbnails | boolean | Opt-in |
| analytics_opt_in | boolean |  |

#### analyses (synced)

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID / PK | Created on the device |
| user_id | FK → users.id |  |
| palette | JSONB | hex, name, share |
| mode_used | string |  |
| source | enum | `gallery`, `camera`, `live` |
| thumb_url | string | nullable; only when backup is opted in |
| is_favorite | boolean |  |
| created_at / updated_at / deleted_at | timestamp | Last-write-wins on `updated_at` |

#### vision_tests

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID / PK |  |
| user_id | FK → users.id |  |
| plate_set_version | string | So old results stay interpretable |
| answers | JSONB | Plate id and answer |
| score / classification | integer / enum | Normal, red-green (protan / deutan, mild / strong), tritan, inconclusive |
| taken_at | timestamp |  |

#### chat_usage

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID / PK |  |
| user_id | FK → users.id | nullable for guests; then keyed by device_id |
| device_id | FK → devices.id | nullable |
| day | date | One row per user/device per day |
| message_count | integer | Enforces the daily limit |
| provider / model | string | Last used; for cost and quality tracking |
| status_counts | JSONB | `ok`, `refused`, `error`, `rate_limited` counts. No message content stored |

#### kb_articles

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID / PK |  |
| slug | string | Stable id |
| locale | enum | `en`, `ur` |
| title / body | text | Searchable (Postgres full-text index) |
| tags | string[] | `types`, `daily-life`, `children`, `test-result`, … |
| reviewed_by / reviewed_at | string / timestamp | Clinical review before publishing |
| version / published | integer / boolean |  |

#### entitlements

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID / PK |  |
| user_id | FK → users.id |  |
| plan | enum | `free`, `premium`, `institutional` |
| source | enum | `none`, `play_billing`, `app_store`, `partner_code` |
| valid_until | timestamp | nullable |

Built in the MVP (limits are enforced from day one) but there is no payment flow yet.

#### announcements, feedback, partner_codes

| Table | Fields |
| --- | --- |
| `announcements` | id, title_en, title_ur, body_en, body_ur, published_at, expires_at, push_sent_at |
| `feedback` | id, user_id (nullable), rating, message, contact (nullable), app_version, created_at, status (`new`, `triaged`, `closed`) |
| `partner_codes` | id, code_hash, partner_name, seats, redeemed, expires_at (later phase) |

#### colour_name_feedback

| Field | Type | Notes |
| --- | --- | --- |
| id | UUID / PK |  |
| hex | string | The sampled colour, not the image |
| shown_name | string |  |
| is_correct | boolean |  |
| suggested_name | string | nullable |
| created_at | timestamp | Anonymous; improves the dictionary |

## 10. API Surface (REST, versioned under `/v1`)

| Group | Endpoints | Notes |
| --- | --- | --- |
| Auth | `POST /auth/otp/request`, `POST /auth/otp/verify`, `POST /auth/google`, `POST /auth/refresh`, `POST /auth/logout` | OTP rate limited per email and IP |
| Me | `GET /me`, `PATCH /me`, `DELETE /me`, `GET /me/export` | Delete and export are required for compliance |
| Sync | `GET /sync/pull?since=`, `POST /sync/push` | Batched, idempotent by client UUID, tombstones for deletes |
| Tests | `POST /tests/results` (also covered by sync) | Optional anonymous aggregate submission |
| Assistant | `POST /chat` (streamed), `GET /chat/quota`, `GET /kb/articles?locale=&since=` | Body: messages, optional context (palette text or test class), locale. Quota checks; the KB endpoint lets the app cache FAQ articles for offline use |
| Content | `GET /announcements`, `POST /feedback`, `POST /colour-feedback` | Feedback also works unauthenticated |
| Devices | `POST /devices`, `DELETE /devices/:id` | Push registration |
| Config | `GET /config` | Remote flags, minimum supported app version, force-update message |
| Ops | `GET /health` | Uptime checks |

Conventions: JSON, Zod-validated, errors as `{ code, message }`, request IDs on every response, pagination by cursor, OpenAPI generated from the schemas.

## 11. Engineering Standards

- **TypeScript strict** everywhere; no `any` without a comment
- **Lint / format:** ESLint + Prettier from `packages/config`; enforced in CI and pre-commit
- **Git:** trunk-based; short-lived branches `feat/…`, `fix/…`; pull requests (self-review checklist), squash merge; Conventional Commits; semantic version tags per release
- **CI (GitHub Actions):** install → lint → typecheck → unit tests → API integration tests (with a Postgres service) → EAS build on `main`
- **Environments:** `dev`, `staging`, `prod` for the API and database; app variants (`dev`, `preview`, `production`) through EAS profiles
- **Docs:** ADRs in `docs/adr` for each key decision (app framework, local-first sync, colour naming approach, AI provider). A README per package. This document is updated whenever scope changes
- **Testing pyramid:**
  - `color-engine`: unit tests with reference values (for example sRGB #FF0000 → LAB ≈ 53.2, 80.1, 67.2), property tests for simulation matrices (identity at severity 0), the golden-image palette suite
  - `plates`: validation script run in CI so a bad plate cannot ship
  - API: integration tests per endpoint including auth failures and rate limits
  - App: component tests (Jest + React Native Testing Library) and E2E flows (Maestro) for the six flows in Section 7
  - Manual: device matrix of at least 3 Android phones (low / mid / high), 1 iOS, small and large screens, English and Urdu, TalkBack, 200% text
- **Release:** Play Console internal → closed testing track for the pilot; EAS Update for JS-only fixes

## 12. Timeline

Total duration is **8 weeks** to a pilot-ready release candidate. The scope is deliberately cut so the risky pieces (colour engine, Urdu voice, plates) are done early.

| Week | Scope | Exit criteria |
| --- | --- | --- |
| Week 0 (3 days) | Decisions and spikes: Urdu TTS on target devices, free-LLM provider shortlist, Skia filter chain, Vision Camera frame access, clinician contact for plate review | ADRs written; go / no-go on Urdu voice and live camera |
| Week 1 | Monorepo, CI, Expo shell with Expo Router and NativeWind tokens, bottom tabs, SQLite + Drizzle, i18n + RTL scaffold, API skeleton + Postgres + Prisma, staging deploy, `color-engine` colour-space functions with tests | App runs on a device in English and Urdu; CI green |
| Week 2 | Upload / camera, downscale, palette extraction, naming (EN), Result screen, copy and share, History (list, detail, delete) persisted | Golden-image suite passing, including yellow, brown and low-light photos |
| Week 3 | Voice assistant (TTS, replay, rate, auto-read), tap-to-pick, Favourites, Urdu colour names, real Settings and Onboarding | A user can run the full "identify and hear" flow in either language |
| Week 4 | Colour Blind Modes with Skia (4 modes + severity), before/after, Correction mode, matrix-driven preview strip | Filters verified against reference images; 60 fps |
| Week 5 | Plate generator and validator, plate asset set, Colour Vision Test flow, scoring and result screens, test history, disclaimers | Every shipped plate passes validation; clinician review requested |
| Week 6 | Auth (email code + Google), sync endpoints and client, account deletion and export, announcements + bell inbox, feedback, Sentry + PostHog, knowledge-base articles (EN/UR) and the FAQ assistant (Phase A) | Sign in on a second device restores data; delete account works end to end |
| Week 7 | Roshni Assistant Phase B (LLM chat, colour tools, quota-gated, behind a flag), accessibility pass (TalkBack / VoiceOver / contrast), performance pass, polish | Accessibility checklist signed off; performance budgets met |
| Week 8 | Full device-matrix testing, bug fixing, store listing, privacy policy, release builds, internal then closed testing; pilot with CVD users begins | Release candidate on Play closed testing; pilot invitations sent |

**Cut order if time slips** (the first things dropped): assistant Phase B (LLM chat; the FAQ version stays) → daltonisation → sync. Core detection, voice, simulation and the test never get cut.

## 13. Open Questions to Confirm with Co-founders

The defaults below are what this document assumes.

| # | Question | Assumed default |
| --- | --- | --- |
| 1 | Keep the current name, logo and purple palette for launch? | Yes |
| 2 | Launch languages: only English and Urdu, or also Sindhi / Pashto / Punjabi? | English + Urdu; others later |
| 3 | Android first, or both stores at launch? (iOS needs an Apple developer account) | Android first; iOS through TestFlight when ready |
| 4 | Is a Google Play merchant / billing path available to us for premium in Pakistan? | Not needed for MVP; entitlements built, payments later |
| 5 | "Ishihara" naming: may we use it, or call the test "Colour Vision Test"? | Use "Colour Vision Test"; no copied plates |
| 6 | Who is the clinical reviewer for the plates and the result wording? | Founder network / SEIC contact, before any accuracy claim |
| 7 | Daily free message limit for the assistant, and what is "premium" at launch? | A small daily limit; premium not sold yet |
| 11 | Which free LLM provider after the bake-off, and do we accept its data-use terms? | Chosen by test results; any provider that trains on user messages is rejected |
| 12 | Who writes and reviews the knowledge-base articles (EN/UR)? | Alisha drafts, a clinical reviewer approves |
| 8 | Target age: do we allow under-18 accounts (schools)? | Guest mode for minors; accounts 18+ or with guardian consent |
| 9 | Should there be an accessible web version ? | No; mobile only for MVP |
| 10 | Does the pilot need institution codes (clinics, schools, NGOs) at launch? | No; after the first pilot |

## 14. Definition of Done

A build is complete only when:

- Colour detection names the golden image set correctly and results are repeatable
- The assistant answers only in scope, in English and Urdu, declines diagnosis and unrelated topics, never receives photos, enforces its daily limit and can be switched off remotely
- Voice reads results in English and Urdu on the target devices, with replay and rate control
- The four CVD modes plus severity and correction apply live to the user's image and match reference outputs
- The colour vision test uses only validated original plates, scores and explains results, and shows the disclaimer on every result
- History and Favourites persist across restarts and sync after sign-in; deleting an account removes server data
- The app works fully offline for detection, voice, simulation, test, history and favourites
- English and Urdu pass a full run-through including RTL layout
- Accessibility checklist (contrast, labels, targets, text scaling, reduce motion, TalkBack / VoiceOver) is signed off
- Performance budgets in Section 8 are met on the reference devices
- Privacy requirements in Section 8 are verified, and the privacy policy and store data-safety forms match actual behaviour
- CI is green; Sentry and PostHog are live; the Play closed-testing build is released and the pilot has started

## 15. Future Enhancements (Not in Current Scope)

- Premium subscription (higher limits, advanced AI, enhanced simulation) and payment integration, per the pitch
- Institutional partnerships: sponsored access, partner dashboards and aggregate reports for clinics, schools, NGOs and CSR programmes
- More languages (Sindhi, Pashto, Punjabi) and voices
- Voice input for the assistant, and an on-device small model for offline chat
- AR overlay: live colour labels on the camera view
- Outfit and colour-matching assistant; colour-safe palette checker for designers
- Home-screen widget and quick-capture shortcut
- Clinician-ready PDF test report
- Web version
- Anonymised, consented aggregate data for CVD research (only with proper consent and ethics review)

## 16. Scope Notes

- This is our own product, built as an MVP to validate demand with real users; it is not a client engagement
- The MVP aims at a 1,000-user target over three years from the pitch's SOM, starting with a pilot of CVD users; adoption, retention and feedback are tracked from the first release
- Roshni is an assistive tool, not a medical device; no feature or copy may claim to diagnose or treat
- Any new feature request is added to Section 15 first and moved into scope only by an explicit decision

Prepared for internal founding team review.
