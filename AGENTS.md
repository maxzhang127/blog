# Repository Guidelines

This document is a concise guide for contributors working on the Nextcloud WebDAV-powered blog front end. Keep changes scoped, documented, and reproducible.

## LANGUAGE POLICY

- ALWAYS communicate with the user in Simplified Chinese.
- ALL explanations, questions, confirmations, and summaries MUST be in Chinese.
- If the user uses another language, still respond in Chinese unless explicitly asked otherwise.
- Do NOT switch languages implicitly.

## EXCEPTIONS

- Code, identifiers, and technical terms should remain in their original language.
- Error messages copied from source code may remain unchanged.

## Current Repo Status (as-is)

- This repository is currently documentation/plan-first. There is no application scaffold yet (no `package.json`, no framework config).
- `docs/` contains the PRD and milestone plan (`docs/prd.md`, `docs/plan/`).
- `src/` is reserved for application code; it currently only contains `src/AGENTS.md`.

## Scoped `AGENTS.md`

- This repo uses scoped `AGENTS.md` files. Always follow the closest one for the directory you are editing (e.g. `docs/AGENTS.md`, `docs/plan/AGENTS.md`, `src/AGENTS.md`).

## Project Structure & Module Organization (when code exists)

- Root holds high-level docs (`README.md`) and product requirements (`docs/prd.md`). Keep these current with feature work.
- Place application code in `src/` (React/Next.js/Vite SSG), and shared assets in `public/` if the chosen framework uses it.
- Add `scripts/` for repeatable tooling (build-time fetch, scaffolds, checks) instead of ad-hoc commands.
- Group UI by feature when possible (e.g., `src/features/posts`, `src/features/search`).
- Keep WebDAV utilities centralized under `src/lib/webdav/` (add `src/lib/webdav/config.ts` once paths are finalized).

## Build, Test, and Development Commands

There is no Node/app scaffold yet. Once `package.json` exists, keep the standard workflow working (add scripts if missing):

```
npm install          # install dependencies
npm run dev          # start local dev server
npm run lint         # ESLint + formatting checks
npm test             # unit/component tests
npm run build        # production build
```

Document any additional one-off scripts in `scripts/` with inline usage notes.

## Coding Style & Naming Conventions

- Prefer TypeScript; 2-space indent; keep imports sorted and remove unused. Use Prettier + ESLint (framework defaults are fine) and run `npm run lint` before pushing.
- Components and hooks use `PascalCase`/`useCamelCase`; util modules use `camelCase` filenames; constants are `SCREAMING_SNAKE_CASE`.
- Co-locate styles with components; keep WebDAV endpoints and paths centralized in `src/lib/webdav/`.

## Testing Guidelines

- Use Vitest or Jest with React Testing Library; name files `*.test.ts`/`*.test.tsx` under `src/__tests__` or alongside components.
- Stub WebDAV calls; avoid hitting real endpoints in tests. Target ≥80% coverage for new modules and include edge cases (conflicts, auth failures).
- Run `npm test -- --watch` during development and `npm test` in CI before PRs.

## Commit & Pull Request Guidelines

- History is minimal; adopt Conventional Commits (e.g., `feat: add build-time webdav index generator`, `fix: handle webdav auth errors`) to keep change intent clear.
- For PRs: concise description, linked issue/task, test plan (commands run), and screenshots/GIFs for UI changes. Call out risk areas (auth, content parsing, static export) and note any config changes or new env vars.

## Security & Configuration Tips

- Do not commit credentials. Store Nextcloud/App Password values in `.env.local` (dotenv files are already ignored by `.gitignore`). Use redacted placeholders in examples.
- Log sanitization: avoid printing URLs with embedded tokens; mask sensitive headers when debugging WebDAV requests.
- WebDAV must be build-time only: credentials must never enter browser bundles, and runtime code must not call WebDAV directly.
- Keep WebDAV base paths configurable and documented in `README.md` to match the defaults described in `docs/prd.md` (e.g., `posts/`, `assets/`).
