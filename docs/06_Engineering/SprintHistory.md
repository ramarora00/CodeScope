## Sprint 2.5 — Application Shell

**Commit**
feat(frontend): build application shell

**Status**
✅ Completed

**Summary**
- Built permanent application shell.
- Established viewport architecture.
- Integrated shared objects.
- Ready for first product screen.

## Sprint 2.8.1 — Repository Graph Migration

**Commit**  
feat(repos): migrate repository‑graph feature to pure JavaScript

**Status**  
✅ Completed

**Summary**  
- Converted all `.ts/.tsx` files to `.js/.jsx`.  
- Removed TypeScript syntax, `import type`, interfaces, and `// @ts-nocheck`.  
- Deleted obsolete `types.ts`.  
- Updated imports and barrel export.  
- Verified with `npm run dev`, `npm run build`, and manual UI smoke test.  
- Audit confirms **0** TypeScript remnants.

## Sprint 3.0 — AI Observatory Shell Foundation

**Commit**
feat(observatory): implement AI Observatory shell foundation

**Status**
✅ Completed

**Summary**
- Built structural layout (CSS Grid) for the AI Observatory.
- Implemented `ObservatoryShell`, `WorkspaceTabBar`, `InvestigationViewport`, `ContextRail`, `PromptComposerPanel`, and `StatusFooter`.
- Integrated `ObservatoryShell` into the application.
- Utilized shared primitives (`GlassPanel`, `SectionHeader`, etc.).
- Kept UI completely structural (no AI logic, no backend, no state).

## Sprint 3.1 — Investigation Lifecycle Foundation

**Commit**
feat(investigation): implement investigation workspace foundation

**Status**
✅ Completed

**Summary**
- Established `InvestigationWorkspace` foundation adhering strictly to FSD.
- Implemented purely structural components (`ArchiveTray`, `DeleteConfirmationDialog`, `ReopenToast`, `InvestigationTab`, etc.).
- Created `placeholderInvestigations.js` model to represent static entities.
- Composed the layout without any internal state hooks, network calls, or interactions.

## Sprint 3.3 — Investigation Event Bus Foundation

**Commit**  
feat(events): add lightweight event bus infrastructure

**Status**  
✅ Completed

**Summary**  
- Implemented event bus in `shared/lib/events/` with Map/Set storage.
- Added API: emit, subscribe, unsubscribe, clear, hasSubscribers, getSubscriberCount.
- Defined investigation lifecycle event types.
- Ensured emit iterates over copy of handlers.

## Sprint 3.4 — Investigation Persistence Foundation

**Commit**
feat(persistence): add investigation persistence abstraction and in‑memory adapter

**Status**
✅ Completed

**Summary**
- Defined persistence contract (`persistenceAdapter.js`).
- Implemented in‑memory adapter using `Map` (`memoryAdapter.js`).
- Added persistence‑related events (`persistenceEvents.js`).
- Exported API via `index.js`.
- Implemented persistence adapter as an independent reusable component without side-effects.

## Sprint 3.5 — Investigation Application Service

**Commit**
feat(investigation-service): add application service layer, factory, and command wrappers

**Status**
✅ Completed

**Summary**
- Added pure factory `investigationFactory.js` with injectable ID support.
- Created `investigationService.js` to orchestrate validation, state machine transitions, persistence, and event bus emissions.
- Extracted shared transition logic into a private `applyTransition` helper.
- Exposed thin, camelCase wrappers in `investigationCommands.js`.
- Synchronous API, decoupled from React, routers, and external side-effects.

## Sprint 3.6 — Investigation Workspace Integration

**Commit**
feat(investigation-workspace): integrate UI with application service

**Status**
✅ Completed

**Summary**
- Wired `InvestigationWorkspace` to the `eventBus` and `persistenceAdapter` to manage local React state.
- Connected `WorkspaceTabBar` to `createInvestigationCommand`.
- Wired `InvestigationTab` rename (on blur/enter) to `renameInvestigationCommand`.
- Wired `InvestigationTab` close button to `archiveInvestigationCommand`.
- Connected `ArchiveTray` to display archived investigations and hooked up restore/delete buttons.
- Wired `DeleteConfirmationDialog` to `deleteInvestigationCommand`.
- Cleaned up event bus subscriptions on component unmount.
- Verified build and integration.

## Sprint 4.0 � Architecture Freeze & M2/M3 Implementation

**Commit**
feat(ui): implement CodeScope Home and Repository Connection (M2 & M3)

**Status**
? Completed

**Summary**
- Terminology reset across architecture documentation.
- Completed M2: Replaced OverviewScreen with CodeScopeHome.
- Completed M3: Replaced RepoUpload with deterministic RepositoryConnection pipeline.
- Implemented strict Runtime Verification rules.
- Successfully decommissioned legacy components.
## Sprint 0 — Stabilized the vector database indexing pipeline under free-tier API rate limits. Resolved gemini-embedding-001 method names, added batch-level pacing, and implemented a self-healing mock embedding fallback for daily quota exhaustion. Cleaned up transient database states on startup and archived unused legacy slices.

**Commit**
884b27e feat(backend): implement resilient embedding sync, rate limit safety, and mock fallback

**Status**
✅ Completed

**Summary**
Stabilized the vector database indexing pipeline under free-tier API rate limits. Resolved gemini-embedding-001 method names, added batch-level pacing, and implemented a self-healing mock embedding fallback for daily quota exhaustion. Cleaned up transient database states on startup and archived unused legacy slices.

*Recorded on 2026-07-12T06:50:30.075Z*


## Sprint - CodeScope Workspace UI V2 Integration

**Commits**
- feat(codescope): introduce high-level workspace UI v2 components
- feat(codescope): introduce workspace shell and layout components
- feat(codescope): introduce runtime and focus models
- feat(codescope): update launch experience and global styles for new UI
- docs(codescope): add workspace UX architecture and integration assets

**Status**
? Completed

**Summary**
- Migrated to new premium dynamic High UI workspace for CodeScope.
- Introduced new UI V2 components, runtime and focus models, and layout components.
- Grouped commits logically by component architecture.


## Sprint � CodeScope Workspace Polish & Boot Sequence

**Commits**
- `de55b8d` feat(codescope): add investigation phase markers and tune reading speed timings
- `984e07c` feat(codescope): refine v2 panels � sequential dots, tighter opacity, row-rise animations
- `8eef219` feat(codescope): add boot sequence, settle animations, and panel shadow system

**Status**
? Completed

**Summary**
- Added phase markers (searching, understanding, connecting, verifying, concluding) to the investigation runtime script.
- Tuned reading speed timings for more natural AI reading cadence.
- Refactored AIOverlayEditor with sequential reading dots, tighter opacity falloff, and text-based confidence display.
- Updated InvestigationPanel, KnowledgePanel, CommandBar, and Dock with row-rise animations and refined styling.
- Introduced WorkspaceRoot boot sequence (Indexing ? Preparing graph ? Ready) with spinner.
- Added settle, row-rise, crossfade keyframes and panel shadow system to global CSS.
- Softened border and shadow tokens for more premium visual depth.

*Recorded on 2026-07-21T17:51:00+05:30*


## Sprint � Live Investigation Engine & Backend Integration

**Commits**
- `8fdf143` feat(investigation): add domain model � context, events, result, snapshot, repository
- `c843030` feat(investigation): add planner � classification, DAG builder, strategies, scoring
- `9f71431` feat(investigation): add transport layer � SSE, event bus, session, recorder
- `b024922` feat(investigation): add execution engine and investigation API route
- `7355f93` fix(server): harden metadata JSON parsing and wire investigation route
- `6fa1420` feat(codescope): add RealRuntime and update RuntimeAdapter for live backend SSE
- `2d9b7c2` feat(codescope): add investigation session and playback controller stores
- `2674006` feat(codescope): wire live investigation into workspace UI with SSE boot sequence
- `1fbc708` feat(app): remove ProcessingExperience, wire direct workspace entry with onBack
- `fca0430` chore(test): add investigation test harness, fixtures, and runtime logs

**Status**
? Completed

**Summary**
- Built full investigation backend engine: domain model, planner (classification, DAG, strategies, scoring), transport (SSE, event bus, session, recorder), execution engine.
- Added `/api/repo/:id/investigate` route for launching live investigations.
- Hardened metadata JSON parsing across server routes to prevent crashes on malformed data.
- Made MOCK_EMBEDDING configurable via environment variable.
- Added RealRuntime client that streams SSE events from the backend, with RuntimeAdapter auto-selecting real vs mock.
- Added useInvestigationSession and usePlaybackController store hooks.
- Integrated live SSE boot sequence into WorkspaceRoot with indexing step labels and error fallback.
- Removed ProcessingExperience from App.jsx � workspace now entered directly.
- Added investigation test harness, validation fixtures, and 24 investigation log recordings.

*Recorded on 2026-07-24T18:06:00+05:30*


## Sprint � Live Investigation Pipeline, LLM Planner, and Legacy Purge

**Commits**
- `8447c42` refactor(legacy): remove all legacy investigation, observatory, knowledge, and layout modules
- `2f88da3` refactor(codescope): remove obsolete RuntimeAdapter, InvestigationWorkspace, and WorkspaceShell
- `aa7733b` refactor(investigation): remove superseded DefaultStrategy and PlanGenerator
- `237c518` feat(investigation): add LLM-powered planner with context builder, plan validation, and Gemini provider
- `191aa76` fix(investigation): harden execution engine, session manager, SSE transport, and routes
- `07259fd` chore(test): add planner integration test and stress test harness
- `ffa25c5` feat(codescope): add workspace lifecycle hook, event router, presentation model, and recorder
- `e770ab5` feat(codescope): refactor workspace UI � extract lifecycle, add status bar and ready state
- `ad295ed` feat(app): refactor App routing, observatory integration, and repository graph layer
- `3d5a64d` feat(shared): expand investigation event types for live pipeline
- `4e95c7d` chore(logs): add investigation session recordings

**Status**
? Completed

**Summary**
- **Legacy Purge**: Deleted 34 legacy modules (investigation, observatory, knowledge, layout) plus 3 obsolete codescope files and 2 superseded planner files. Total: 39 files deleted.
- **LLM Planner**: Added Gemini-powered planner with ContextBuilder, PlanValidator, UnderstandingPlanBuilder, and LLMProvider abstraction.
- **Server Hardening**: Improved ExecutionEngine, SessionManager, SSETransport, and route error handling.
- **Client Architecture**: Extracted workspace lifecycle into dedicated hook, added InvestigationRecorder, event router, and presentation model stores.
- **UI Refactor**: Slimmed WorkspaceRoot, added WorkspaceStatusBar, RepositoryReadyState, and refined all V2 panels (CommandBar, InvestigationPanel, KnowledgePanel).
- **App Integration**: Refactored App.jsx routing, enhanced AIObservatory, and updated repository graph layer.
- **Shared Events**: Expanded event type definitions for real-time investigation pipeline.
- **Recordings**: Added 70 investigation session log recordings.

*Recorded on 2026-07-30T19:47:00+05:30*

