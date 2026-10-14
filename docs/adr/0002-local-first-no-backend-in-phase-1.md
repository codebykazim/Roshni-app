# ADR 0002: Local-first data, no backend in Phase 1 and 2

Status: accepted · October 2026

## Context
Phase 1 and 2 aim to prove that people reuse colour detection and trust the app. Accounts, sync and cloud features add backend, compliance and hosting work that does not help prove demand. Privacy is also part of the product promise.

## Decision
All user data (history, favourites, test results, settings) is stored on the device in SQLite. Images are processed on the device and are not uploaded. No API server, database or authentication is built in Phase 1 or 2.

## Consequences
- Zero hosting cost and no server to secure
- Strong privacy story for schools and clinics
- Data is lost on uninstall or a lost phone; the sign-in and backup prompt arrives with the later sync phase
- Analytics (opt-in, non-sensitive events) and crash reporting use third-party SDKs only
- The backend described in the technical document is built when sync, the assistant or institution reporting is approved
