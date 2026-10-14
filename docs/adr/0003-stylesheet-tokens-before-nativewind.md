# ADR 0003: Plain StyleSheet with shared design tokens (NativeWind deferred)

Status: accepted · October 2026

## Context
The technical document proposed NativeWind. The project scaffolded on Expo SDK 57 / React Native 0.86, which is newer than the versions NativeWind has been verified against in this project. A styling layer that fails to build would block every screen.

## Decision
Use React Native `StyleSheet` with a single token file (`apps/mobile/constants/theme.ts`) for colours, spacing, radii and type. Re-evaluate NativeWind once a compatible release is confirmed against the installed SDK.

## Consequences
- No build risk from the styling layer
- Tokens stay in one place, so a later move to NativeWind is a mechanical change
- Slightly more verbose style code
