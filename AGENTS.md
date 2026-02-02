# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + TypeScript app. Key areas: `components/` (UI and feature components), `contexts/` (Graph/Theme providers), `hooks/`, `utils/`, `lib/`, and shared types in `types.ts`.
- `src/assets/` holds bundled assets; `public/` holds static files served as-is.
- Root config files include `vite.config.ts`, `tailwind.config.js`, `eslint.config.js`, and `tsconfig*.json`.

## Build, Test, and Development Commands
- `pnpm dev`: start the Vite dev server with HMR.
- `pnpm build`: type-check with `tsc -b` and build to `dist/` via Vite.
- `pnpm preview`: serve the production build locally.
- `pnpm lint`: run ESLint across the repo.
- `pnpm run prepush`: run the same checks used for pre-push (`tsc -b` + `eslint .`).

## Coding Style & Naming Conventions
- TypeScript + React with ES modules; prefer `.tsx` for components and `.ts` for utilities.
- Follow existing formatting in the file you touch; ESLint is the source of truth (`eslint.config.js`).
- Naming patterns seen in the codebase: `PascalCase` for components, `useX` for hooks, `*Context` for context modules.

## Testing Guidelines
- No automated test framework or `test` script is currently configured.
- If you add tests, document the runner in `package.json` and colocate tests using a clear convention (e.g., `*.test.tsx`).

## Commit & Pull Request Guidelines
- Commit history follows Conventional Commits (e.g., `feat: …`, `fix: …`, `chore: …`).
- PRs should include a concise description, testing notes (commands run), and screenshots for UI changes.
- Branch naming: `<type>/issue-<N>-<short-descriptor>` where `<type>` is a Conventional Commit type (e.g., `feat`, `fix`, `chore`, `docs`).
- PR titles should follow Conventional Commits. When creating a PR for an issue, include the issue number in the title so GitHub auto-closes it on merge.
- Include `closes #N` in the PR description for clarity.
- Before opening a PR, run `pnpm run prepush` (type-check + lint) and report results in the PR notes.

## Architecture Overview
- The app is a single-page Vite/React UI with a DOT editor and a Cytoscape graph view.
- Graph and theme state live in React contexts under `src/contexts/`; hooks in `src/hooks/` manage editor state and DOT parsing/validation.
- UI components are in `src/components/` with shared primitives in `src/components/ui/`.
- The graph layout/rendering pipeline is driven from editor input → DOT parsing (`dotparser`/`graphlib-dot`) → Cytoscape view.

## Configuration & Environment
- Use the Node version in `.nvmrc` and install dependencies with `pnpm`.
- Husky hooks are enabled; pre-commit/pre-push hooks currently run `pnpm run precommit`.

## Issue References
- When the user mentions issue and a number (e.g., "issue 9" or "issue #8"), look on the remote repo's issue list: https://github.com/Corvimia/polycule-graph/issues
- When looking up anything on GitHub, use the `gh` CLI.
