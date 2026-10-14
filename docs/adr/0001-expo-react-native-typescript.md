# ADR 0001: Expo (React Native) with TypeScript for the mobile app

Status: accepted · October 2026

## Context
Roshni is a mobile-first assistive app for Android first, iOS later. Earlier pitch material mentioned Flutter. The team's earlier UI demo was Expo-based, and the technical lead works in TypeScript across web, mobile and API code.

## Decision
Build the app with Expo (React Native), Expo Router and strict TypeScript. Shared logic lives in plain-TypeScript packages (`packages/color-engine`) with no React Native imports.

## Consequences
- One language across app, tests and any future API
- Shared, unit-testable colour engine
- Installable test builds through EAS; OTA fixes for JS-only changes
- Native modules outside Expo Go (for example Vision Camera for live frames) need a development build
- The pitch deck wording ("Flutter") should be corrected
