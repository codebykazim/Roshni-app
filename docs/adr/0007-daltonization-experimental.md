# ADR 0007: Colour correction (daltonization), shipped as experimental

Status: accepted (experimental) · November 2026

## Context
People with colour vision deficiency can lose the difference between some colours. Daltonization shifts the colour information they cannot perceive into channels they can. Android already offers system-wide colour correction, so this is not a differentiator; it is a per-photo tool that sits next to the simulation, and it lets a colour-blind person and the people around them see the same photo both ways.

## Decision
- One matrix on linear RGB: `C = I + strength * Shift * (I - Sim)`, in `packages/color-engine/src/correction.ts`. `Sim` is the Machado matrix already used by the simulation; `Shift` follows the Fidaner, Lin and Ozguc (2005) recipe (red-green loss re-expressed as green and blue, blue loss as red and green). Greys are unchanged and strength 0 is the identity.
- Rendered with the same GPU colour-filter chain as the simulation, so it is fast and shares tested maths.
- Types: protan, deutan, tritan. Not achromatopsia, which has no colour to recover.
- Strength presets (25 to 100%, default 75%) and an Original / Corrected / Split view, like the simulation screen.
- Labelled **Experimental** on screen, with a note that corrected colours are not true colours and must not be used for safety decisions.

## Validation so far (simulator only)
- Unit tests: confusable red-green colour pairs become 1.3 times or more easier to separate for protan and deutan simulated viewers.
- The plates from ADR 0006 act as a measuring tool: applying the correction to the red-green plates raises a simulated viewer's number-versus-background separability from about 0.66 to 0.96 (protan) and 0.68 to 0.91 (deutan).
- Tritan correction is weaker and less trustworthy for the same reason the tritan plates were dropped (ADR 0006).

## Still required before dropping the "Experimental" label
Test with 5 to 10 colour-blind people and note, per person: type if known, whether the colour test numbers become readable through the corrected view, whether photos look natural enough to use, and any discomfort. Tune the shift factor and default strength from that. Record results here.

## Consequences
- Cheap to run and consistent with the simulation
- Real benefit is unproven until tested with people; the wording says so
- Over-correction can make photos look unnatural, hence the strength control
