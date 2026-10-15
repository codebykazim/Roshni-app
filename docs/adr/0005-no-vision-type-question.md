# ADR 0005: Do not ask users about their own colour vision

Status: accepted · October 2026

## Context
Onboarding and Profile briefly asked "How do you see colors?" (protan, deutan, tritan, achromatopsia, none, not sure). It only chose a default: which simulation opens first, and whether results are read aloud automatically. A health-related question for so little benefit does not fit a privacy-first, non-diagnostic product, and it added a step and a settings section.

## Decision
Remove the question, its storage and its screens. The simulation always opens with Deuteranopia (the most common type); the user can pick any other mode in one tap. Reading results aloud is a plain toggle in Profile. A value saved earlier in the local settings table is simply ignored.

## Consequences
- Shorter onboarding (2 steps) and a simpler Profile
- No health-like data is collected, even on the device
- If personalisation is added later, it should come with a concrete benefit (for example marking colour pairs a given type confuses), not just a default
