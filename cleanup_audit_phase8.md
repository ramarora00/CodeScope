# CodeScope Codebase Cleanup — Phase 8 Audit Report

---

## A. Executive Summary

Phase 8 is a **READ-ONLY AUDIT** evaluating surviving dependencies, CSS selectors, UI primitives, provider setups, utility scripts, and documentation/script directories.

- **Total NPM Dependencies Audited**: 18 packages (`client/package.json` + `server/package.json`)
- **Total CSS Selectors Audited**: 40 selector blocks in `client/src/App.css`
- **Total Shared UI Components Audited**: 12 components in `client/src/shared/ui/`
- **AppProviders Audit**: 1 file (`client/src/shared/providers/AppProviders.jsx`)
- **Admin Utility Audit**: 1 file (`server/set_db_state.js`)
- **Docs / Scripts / INTEGRATION Audit**: 3 directories

---

## B. Dependency Audit

### Client (`client/package.json`)

| Package | Location | Evidence / Usage | Classification | Removal Risk |
|---------|----------|------------------|----------------|--------------|
| `clsx` | `client/package.json` | Used in `classNames.js` for dynamic class concatenation. | **KEEP** | CRITICAL |
| `dagre` | `client/package.json` | Used in `useGraphLayout.js` for layout computing. | **KEEP** | HIGH |
| `firebase` | `client/package.json` | Used in `client/src/auth/firebase.js` & auth flows. | **KEEP** | CRITICAL |
| `force-graph` | `client/package.json` | Zero imports found anywhere in `client/src/`. | **REMOVE CANDIDATE** | LOW |
| `framer-motion` | `client/package.json` | Used in `LaunchExperience.jsx`, `v2/` UI components. | **KEEP** | HIGH |
| `react` | `client/package.json` | Core UI library. | **KEEP** | CRITICAL |
| `react-dom` | `client/package.json` | Core UI rendering library. | **KEEP** | CRITICAL |
| `react-force-graph-2d` | `client/package.json` | Zero imports found anywhere in `client/src/`. | **REMOVE CANDIDATE** | LOW |
| `react-window` | `client/package.json` | Used in `CodeViewer.jsx` & `FileList.jsx` for virtualized rendering. | **KEEP** | HIGH |
| `reactflow` | `client/package.json` | Used in `ArchitectureCanvas.jsx` & graph views. | **KEEP** | HIGH |
| `shiki` | `client/package.json` | Used in `shikiHighlighter.js` for code syntax highlighting. | **KEEP** | HIGH |
| `tailwind-merge` | `client/package.json` | Used in `classNames.js` for tailwind class merging. | **KEEP** | HIGH |
| `zustand` | `client/package.json` | Used in state stores (`workspaceStore.js`, `investigationStore.js`). | **KEEP** | CRITICAL |

### Server (`server/package.json`)

| Package | Location | Evidence / Usage | Classification | Removal Risk |
|---------|----------|------------------|----------------|--------------|
| `@babel/parser` | `server/package.json` | Used in AST parsing utilities (`parser.js`). | **KEEP** | HIGH |
| `@babel/traverse` | `server/package.json` | Used in AST graph traversal (`traverser.js`). | **KEEP** | HIGH |
| `@google/generative-ai` | `server/package.json` | Used in `geminiClient.js` for LLM calls. | **KEEP** | CRITICAL |
| `@lancedb/lancedb` | `server/package.json` | Active vector store client in `vectorStore.js`. | **KEEP** | CRITICAL |
| `@prisma/client` | `server/package.json` | Active DB ORM client used across backend routes. | **KEEP** | CRITICAL |
| `cors` | `server/package.json` | Used in `server/index.js` Express middleware. | **KEEP** | HIGH |
| `dotenv` | `server/package.json` | Used for environment variable loading. | **KEEP** | HIGH |
| `express` | `server/package.json` | Core HTTP / SSE web server framework. | **KEEP** | CRITICAL |
| `firebase-admin` | `server/package.json` | Used in server auth middleware (`auth.js`). | **KEEP** | CRITICAL |
| `lancedb` | `server/package.json` | Obsolete v0.0.1 package alias. Active imports use `@lancedb/lancedb`. | **REMOVE CANDIDATE** | LOW |
| `prisma` | `server/package.json` | Prisma CLI dependency. | **KEEP** | MEDIUM |
| `puppeteer` | `server/package.json` | Was only used by `verify_hydration.js` (deleted in Phase 7). No active consumers. | **REMOVE CANDIDATE** | LOW |
| `simple-git` | `server/package.json` | Used in git repository cloning & indexing pipeline. | **KEEP** | CRITICAL |
| `uuid` | `server/package.json` | Used for session & request ID generation. | **KEEP** | HIGH |
| `nodemon` (dev) | `server/package.json` | Used in `npm run dev` dev server script. | **KEEP** | MEDIUM |
| `supertest` (dev) | `server/package.json` | Zero occurrences in active test files. | **REMOVE CANDIDATE** | LOW |

---

## C. App.css Audit

`client/src/App.css` (741 lines) was imported by `App.jsx`, but none of its CSS class names are used by the active application (`v2/` workspace UI or `LoginPage/`).

| Selector / Block | Lines | Usage Evidence in `client/src/` | Classification | Risk |
|------------------|-------|---------------------------------|----------------|------|
| `.mc-shell`, `.mc-rail`, `.mc-rail-*` | 5–44 | Zero occurrences in JSX/JS. Legacy Mission Control shell layout. | **UNUSED** | LOW |
| `.mc-logo`, `.mc-nav-btn`, `.mc-nav-btn:*` | 47–123 | Zero occurrences in JSX/JS. Legacy nav buttons. | **UNUSED** | LOW |
| `.mc-main`, `.mc-header`, `.mc-breadcrumb*`, `.mc-repo-chip` | 128–192 | Zero occurrences in JSX/JS. Legacy header & breadcrumbs. | **UNUSED** | LOW |
| `.mc-body`, `.mc-screen` | 195–208 | Zero occurrences in JSX/JS. Legacy screen wrappers. | **UNUSED** | LOW |
| `.mc-chat`, `.mc-chat-*`, `.mc-context-*` | 213–271 | Zero occurrences in JSX/JS. Legacy sidebar chat UI. | **UNUSED** | LOW |
| `.mc-messages`, `.mc-msg*` | 274–333 | Zero occurrences in JSX/JS. Legacy message bubbles. | **UNUSED** | LOW |
| `.mc-chat-input-area`, `.mc-chat-form`, `.mc-send-btn` | 336–389 | Zero occurrences in JSX/JS. Legacy input form. | **UNUSED** | LOW |
| `.obs-card`, `.obs-stat*` | 394–434 | Zero occurrences in JSX/JS. Legacy card & stat tiles. | **UNUSED** | LOW |
| `.grade-badge`, `.grade-A`...`.grade-D` | 437–453 | Zero occurrences in JSX/JS. Legacy health badges. | **UNUSED** | LOW |
| `.conf-bar-track`, `.conf-bar-fill` | 456–467 | Zero occurrences in JSX/JS. Legacy confidence bar. | **UNUSED** | LOW |
| `.domain-pill`, `.stack-tag`, `.flow-node*` | 470–539 | Zero occurrences in JSX/JS. Legacy flow nodes & tags. | **UNUSED** | LOW |
| `.app-container`, `.sidebar-left`, `.main-panel` | 540–621 | Zero occurrences in JSX/JS. Prototype 3-column container. | **UNUSED** | LOW |
| `.chat-panel`, `.chat-header`, `.chat-messages`, `.chat-input*` | 624–681 | Zero occurrences in JSX/JS. Prototype chat panel. | **UNUSED** | LOW |
| `.logo-icon`, `.nav-item`, `.connect-btn`, `.badge` | 684–740 | Zero occurrences in JSX/JS. Prototype nav items & buttons. | **UNUSED** | LOW |

> **Note on `App.css`**: The active UI styles flow entirely through `client/src/index.css` and feature-specific component styles/Tailwind classes. `App.css` is an unreferenced legacy file.

---

## D. shared/ui Audit

The directory `client/src/shared/ui/` contains 12 UI component files.

| File | Component Export(s) | Consumers in `client/src/` | Classification | Risk |
|------|--------------------|----------------------------|----------------|------|
| `ActionButton.jsx` | `ActionButton` | None (was only used by deleted `objects/` components) | **REMOVE CANDIDATE** | LOW |
| `CommandButton.jsx` | `CommandButton` | None (was only used by deleted `objects/` components) | **REMOVE CANDIDATE** | LOW |
| `EnterpriseBlocks.jsx` | `OperationBlock`, `EvidenceBlock`, `CodePreviewBlock`, `MetricBlock`, `StatusBlock` | None | **REMOVE CANDIDATE** | LOW |
| `GlassPanel.jsx` | `GlassPanel` | None | **REMOVE CANDIDATE** | LOW |
| `InlineNotice.jsx` | `InlineNotice` | None | **REMOVE CANDIDATE** | LOW |
| `LoadingState.jsx` | `LoadingState` | None | **REMOVE CANDIDATE** | LOW |
| `PaletteInput.jsx` | `PaletteInput` | None | **REMOVE CANDIDATE** | LOW |
| `QueryInput.jsx` | `QueryInput` | None | **REMOVE CANDIDATE** | LOW |
| `SectionHeader.jsx` | `SectionHeader` | None | **REMOVE CANDIDATE** | LOW |
| `Skeleton.jsx` | `Skeleton`, `SkeletonGroup` | None | **REMOVE CANDIDATE** | LOW |
| `StatusBadge.jsx` | `StatusBadge` | None | **REMOVE CANDIDATE** | LOW |
| `index.js` | Barrel export | None (only imported internally by `PaletteInput.jsx` for icons) | **REMOVE CANDIDATE** | LOW |

> **Note on `shared/ui`**: All active UI components (e.g. `LaunchExperience.jsx`, `PerspectiveRouter.jsx`, `v2/*`) construct their UI elements directly with inline Tailwind / CSS tokens or custom icons from `shared/icons/`.

---

## E. AppProviders Audit

- **File**: `client/src/shared/providers/AppProviders.jsx`
- **Contents**: Wraps `ErrorBoundary` and a shell `ThemeProvider`.
- **Consumers in Active Codebase**: **0 consumers**. `client/src/main.jsx` mounts `<App />` directly without wrapping it in `<AppProviders>`.
- **Classification**: **POSSIBLY USED** / **ARCHITECTURAL SCAFFOLD**.
- **Assessment**: While currently unmounted, it contains a functioning React `ErrorBoundary` fallback component. It can be retained as an architectural provider scaffold or removed if strict zero-dead-code policy is enforced.

---

## F. server/set_db_state.js Audit

- **File**: `server/set_db_state.js`
- **Functionality**: CLI script to manually update a repository's `status`, `indexingProgress`, `totalChunks`, and `processedChunks` in the Prisma database (`prisma.repo.update`).
- **Imports/Consumers**: None (standalone executable script run via `node server/set_db_state.js <repoId> <status> <progress>`).
- **Classification**: **KEEP** (Operational / Admin Utility).
- **Assessment**: Useful manual debugging/maintenance tool for developers when resetting or forcing database state during local testing.

---

## G. docs / scripts / INTEGRATION Classification

### `docs/` (11 subdirectories, 3 top-level markdown files)
- **`AI_CONTEXT.md`**: Active project context & system instructions. (**KEEP**)
- **`SystemArchitecture.md`**: High-level system architecture documentation. (**KEEP**)
- **`EngineeringAuditReport.md`**: Project audit reference. (**KEEP**)
- **Subdirectories (`00_Foundation/` through `09_Research/`)**: Comprehensive engineering documentation repository covering API specs, frontend architecture, and testing pipelines. (**KEEP**)

### `scripts/`
- **`updateSprintHistory.js`**: Node.js script for maintaining sprint logs and commit histories. (**KEEP — Dev Utility**)

### `INTEGRATION/`
- **`CodeScopeWorkspaceUXArchitecture.md`**: Detailed workspace UX specification. (**KEEP**)
- **`codescope_full_workspace.html`**: HTML workspace prototype reference. (**KEEP**)
- **`Screenshot 2026-07-12 *.png` (6 images)**: Visual design references & design spec screenshots. (**KEEP — Reference Assets**)

---

## H. Recommended Safe Actions

### SAFE TO REMOVE (Pending User Approval)
1. **Unused NPM Packages**:
   - `client`: `force-graph`, `react-force-graph-2d`
   - `server`: `puppeteer`, `lancedb` (legacy alias), `supertest`
2. **Unused CSS**:
   - `client/src/App.css` (or delete `App.css` and its import in `App.jsx`)
3. **Unused UI Primitives**:
   - Entire `client/src/shared/ui/` directory (12 files)

### REQUIRES MANUAL REVIEW
- `client/src/shared/providers/AppProviders.jsx` (functional ErrorBoundary scaffold, currently unmounted in `main.jsx`).

### KEEP
- All active dependencies (`clsx`, `framer-motion`, `shiki`, `@lancedb/lancedb`, `simple-git`, etc.)
- `server/set_db_state.js` (admin CLI tool)
- All files in `docs/`, `scripts/`, and `INTEGRATION/`

---

## I. Verification Strategy (For Future Action)

When any of the safe removals are approved for execution in a future phase:
1. **Client Build**: Run `npm run build` in `client/` to verify zero missing imports or CSS compilation failures.
2. **Server Startup**: Run `node -e "require('./server/index.js')"` to verify clean backend initialization.
3. **Broken References Search**: Run full codebase `grep` search for any removed symbol or package name.
4. **Lockfile Audit**: Verify `package-lock.json` files update cleanly without breaking transitive resolution.

---

## J. Explicit "NO CHANGES MADE" Confirmation

- **Files modified**: 0
- **Files deleted**: 0
- **Dependencies removed**: 0
- **package.json modified**: NO
- **lockfiles modified**: NO
- **Commits created**: 0
- **Pushes**: 0

*Baseline commit `9de5d8d` remains untouched.*
