# ADR 0004: Colour naming by nearest base colour plus modifiers

Status: accepted · October 2026

## Context
Users need names that are useful without seeing the hue. A large named-colour list gives unfamiliar names ("Gainsboro"); a bare hue family loses lightness.

## Decision
`packages/color-engine` names a colour by (1) treating near-neutral colours (Lab chroma below 7) as Black / Dark grey / Grey / Light grey / White, and (2) otherwise choosing the nearest of about 27 base colours by CIEDE2000, then adding Light / Dark / Pale / Muted / Vivid from the sample's own lightness and chroma. Base colours that already encode lightness (Navy, Maroon, Peach and similar) skip the Light / Dark modifier.

## Consequences
- Names are familiar and carry lightness
- Behaviour is deterministic and unit-tested
- The base list grows as the golden-image suite grows; any real-world mistake becomes a regression test
- Urdu names are attached to the same base colours and modifiers
