# Roshni: changes since the first build

Baseline: the first preview APK. The code in it is in `main` at `a3f3e5c` (Phase 1 complete). Everything below is on branch `feature/colour-vision-test`.

## What is new

### 1. Colour Vision Test (a short game)
- Home card is now live. Flow: intro, one practice plate, 8 red-green plates, result.
- Plates are original (not Ishihara). They are generated offline by `packages/plates` and shipped as static data (`packages/plates/data/plates.json`), so every phone shows the same plates and nothing is random at runtime.
- Each plate is checked with our own simulator: clear to normal vision, hidden from simulated protan and deutan viewers.
- Result wording is "possible red-green difficulty", never a diagnosis, and it points users to an eye specialist.
- Results are stored on the phone only (new SQLite table `test_results`, schema version 2; existing data migrates automatically).
- Not included yet: blue-yellow plates. The tritan simulation cannot hide a readable number well enough. See ADR 0006.

### 2. Colour Correction (daltonization), marked Experimental
- New Home tile and screen: pick a photo, choose protan / deutan / tritan, choose strength (25 to 100%), switch Corrected / Original / Split.
- One matrix on linear RGB (`packages/color-engine/src/correction.ts`), applied with the same GPU filter chain as the simulation. See ADR 0007.
- Simulator result: applying it to the red-green plates raises a simulated viewer's number separability from about 0.66 to 0.96 (protan) and 0.68 to 0.91 (deutan).

## Where the code is
| Area | Path |
| --- | --- |
| Plate generator, scoring, tests | `packages/plates/` |
| Correction maths and tests | `packages/color-engine/src/correction.ts`, `test/correction.test.ts` |
| Test screens | `apps/mobile/app/test.tsx`, `app/test-result.tsx`, `components/PlateView.tsx` |
| Correction screen | `apps/mobile/app/correct.tsx`, `renderCorrected` in `lib/image/skiaHelpers.ts` |
| DB migration v2 | `apps/mobile/lib/db/index.ts` |
| Strings | `apps/mobile/lib/i18n/en.json`, `ur.json` (keys `test.*`, `correct.*`) |
| Decisions | `docs/adr/0006-colour-vision-test-plates.md`, `0007-daltonization-experimental.md` |

Regenerate plates (only if you change specs or the generator; it takes a few minutes): `pnpm --filter @roshni/plates generate`.

## Status and honesty
- 91 automated tests pass (80 colour engine, 11 plates) and typecheck is clean. The Android bundle exports fine.
- Both features are validated against our simulator only, not against colour-blind people. Keep the "experimental / screening" wording until 5 to 10 colour-blind and 5 to 10 typical-vision people have tried them (what to record is in the ADRs).
- Urdu strings for both features need a native-speaker review.
- Phone testing of the new screens is still pending.

## For teammates
```bash
git checkout feature/colour-vision-test
pnpm install
pnpm -r typecheck
pnpm -r test
pnpm --filter @roshni/mobile start   # then open in Expo Go or a dev build
```
