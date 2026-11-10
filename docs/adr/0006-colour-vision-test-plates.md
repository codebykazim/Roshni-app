# ADR 0006: Colour vision test built on our own generated plates

Status: accepted (plates unvalidated) · November 2026

## Context
Phase 2 adds a colour vision test, played like a short game. The classic Ishihara plates are copyrighted, so we cannot ship or copy them. We also cannot claim clinical accuracy, and a screening result must never read as a diagnosis.

## Decision
- **Original plates.** `packages/plates` generates pseudo-isochromatic plates: a disc packed with dots of varied size, with a number drawn from a small stroke font. Nothing is copied from any published plate.
- **Generated offline, shipped as data.** `pnpm --filter @roshni/plates generate` writes `data/plates.json`. The app only draws it, so every phone shows the same plates and nothing is random at runtime.
- **Validated with our own simulator.** Number and background colours differ along the direction the Machado simulation hides from protan and deutan viewers. Each plate is accepted only if (a) a normal viewer separates number from background almost perfectly and with a clear colour distance, and (b) a simulated protan and deutan viewer separates them at or near chance. Lightness is randomised per dot so brightness is no clue.
- **Screening wording only.** Results say "possible red-green difficulty", never a diagnosis, and always point to an eye specialist. The scorer does not try to separate protan from deutan, which these plates cannot do reliably.
- **Local only.** Results are stored in a `test_results` table on the phone (schema v2). Nothing leaves the device.

## Not shipped yet: blue-yellow plates
The tritan simulation matrix is not a true blind spot. Plates that were readable to normal vision were also partly separable under the tritan simulation (balanced accuracy about 0.85 versus the 0.8 limit), so no plate met both bars. Tritan deficiency is very rare, so version 0.1 ships red-green plates plus a practice plate and leaves blue-yellow for later. The scorer and generator already support a `by` kind.

## Honest status
A simulator-validated plate is not a clinically validated one. Before the test is promoted beyond "experimental screening", test it with colour-blind and typical-vision people (target 5-10 each), compare against an established test, and tune `RG_FLAG` and the plate set from that. Record findings here and bump `PlateSet.version` when plates change, so stored results stay interpretable.

## Consequences
- No licensing risk, and plates can be regenerated or extended with new seeds
- Result quality is bounded by the simulator until real people have tested it
- Adding plates means adding a spec, regenerating, and rerunning the plate tests
