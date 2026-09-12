# Challenger M5-1 Context: Tier 5 Adversarial Hardening (Data Flow, Offline & Encrypted Sync)

Project Root: H:\Code\Pessoais\Throughline
Original Request: H:\Code\Pessoais\Throughline\.agents\ORIGINAL_REQUEST.md
Full Project Architecture & Milestone Plan: H:\Code\Pessoais\Throughline\PROJECT.md
Guidelines: H:\Code\Pessoais\Throughline\AGENTS.md and H:\Code\Pessoais\Throughline\docs\ui-ux.md
Working Directory: H:\Code\Pessoais\Throughline\.agents\challenger_m5_1

Tasks:
Perform Tier 5 adversarial coverage hardening:
1. White-box analysis of domain, data flow, Dexie storage, and crypto layers (`packages/domain`, `apps/web/src/state/`).
2. Test extreme conditions: corrupt records, rapid concurrent updates, offline storage quota simulation, recovery key generation & validation, encrypted ciphertext integrity.
3. Author adversarial stress test suite in `apps/web/src/test/challenger-m5-tier5-crypto-storage.test.tsx` (or similar).
4. Run tests with vitest.
5. Deliver verdict: APPROVE or REQUEST_CHANGES in `H:\Code\Pessoais\Throughline\.agents\challenger_m5_1\handoff.md`.
