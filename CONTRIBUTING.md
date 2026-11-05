# ONEFORGE SLEDGE — CONTRIBUTING GUIDELINES

Thank you for your interest in contributing to **OneForge Sledge**! We welcome pull requests, bug reports, and design intelligence improvements.

---

## 1. Code of Conduct

All contributors are expected to uphold a professional, collaborative, and technical environment. Respect all participants and contribute constructively.

---

## 2. Strict Engineering Principles

Every contribution must adhere to our core standards:

1. **Defensive Security**: No modifications to the SSRF guard without rigorous security regression tests. Never bypass IP restrictions or timeout thresholds.
2. **Deterministic Extraction**: Never fabricate or hardcode unverified design measurements. Inferred values must be marked as `inferred` with lower confidence scores.
3. **Zero Runtime Bloat**: Avoid adding heavy external libraries. Favor modern native Node.js APIs (`node:test`, `fetch`, `node:crypto`, `node:fs/promises`).
4. **Complete Interfaces**: Never leave placeholder buttons, fake analytics, or non-functional links in the UI.
5. **Preserve Legal Attribution**: Respect Creative Commons Attribution 4.0 terms for third-party design records. Maintain `THIRD_PARTY_NOTICES.md`.

---

## 3. Development Workflow

1. Fork the repository and create your feature branch:
   ```bash
   git checkout -b feature/my-enhancement
   ```
2. Implement your changes following standard ES module patterns.
3. Add unit or integration tests under `tests/`.
4. Run the automated test suite:
   ```bash
   npm test
   ```
5. Ensure 100% test pass rate.
6. Commit with clear, descriptive messages:
   ```bash
   git commit -m "feat(analyzer): add support for modular scale detection"
   ```
7. Push your branch and open a Pull Request.

---

## 4. Pull Request Checklist

Before submitting a PR, verify:
- [ ] `npm test` passes completely without errors.
- [ ] No secrets, credentials, or private keys are committed.
- [ ] New public APIs are documented in `API_REFERENCE.md`.
- [ ] Brand attribution and license boundaries remain intact.
