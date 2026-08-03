## Sprint 2.5 â€” Application Shell

**Commit**
feat(frontend): build application shell

**Status**
âœ… Completed

**Summary**
- Built permanent application shell.
- Established viewport architecture.
- Integrated shared objects.
- Ready for first product screen.

## Sprint 2.8.1 â€” Repository Graph Migration

**Commit**  
feat(repos): migrate repositoryâ€‘graph feature to pure JavaScript

**Status**  
âœ… Completed

**Summary**  
- Converted all `.ts/.tsx` files to `.js/.jsx`.  
- Removed TypeScript syntax, `import type`, interfaces, and `// @ts-nocheck`.  
- Deleted obsolete `types.ts`.  
- Updated imports and barrel export.  
- Verified with `npm run dev`, `npm run build`, and manual UI smoke test.  
- Audit confirms **0** TypeScript remnants.

## Sprint 3.0 â€” AI Observatory Shell Foundation

**Commit**
feat(observatory): implement AI Observatory shell foundation

**Status**
âœ… Completed

**Summary**
- Built structural layout (CSS Grid) for the AI Observatory.
- Implemented `ObservatoryShell`, `WorkspaceTabBar`, `InvestigationViewport`, `ContextRail`, `PromptComposerPanel`, and `StatusFooter`.
- Integrated `ObservatoryShell` into the application.
- Utilized shared primitives (`GlassPanel`, `SectionHeader`, etc.).
- Kept UI completely structural (no AI logic, no backend, no state).

## Sprint 3.1 â€” Investigation Lifecycle Foundation

**Commit**
feat(investigation): implement investigation workspace foundation

**Status**
âœ… Completed

**Summary**
- Established `InvestigationWorkspace` foundation adhering strictly to FSD.
- Implemented purely structural components (`ArchiveTray`, `DeleteConfirmationDialog`, `ReopenToast`, `InvestigationTab`, etc.).
- Created `placeholderInvestigations.js` model to represent static entities.
- Composed the layout without any internal state hooks, network calls, or interactions.

## Sprint 3.3 â€” Investigation Event Bus Foundation

**Commit**  
feat(events): add lightweight event bus infrastructure

**Status**  
âœ… Completed

**Summary**  
- Implemented event bus in `shared/lib/events/` with Map/Set storage.
- Added API: emit, subscribe, unsubscribe, clear, hasSubscribers, getSubscriberCount.
- Defined investigation lifecycle event types.
- Ensured emit iterates over copy of handlers.

## Sprint 3.4 â€” Investigation Persistence Foundation

**Commit**
feat(persistence): add investigation persistence abstraction and inâ€‘memory adapter

**Status**
âœ… Completed

**Summary**
- Defined persistence contract (`persistenceAdapter.js`).
- Implemented inâ€‘memory adapter using `Map` (`memoryAdapter.js`).
- Added persistenceâ€‘related events (`persistenceEvents.js`).
- Exported API via `index.js`.
- Implemented persistence adapter as an independent reusable component without side-effects.

## Sprint 3.5 â€” Investigation Application Service

**Commit**
feat(investigation-service): add application service layer, factory, and command wrappers

**Status**
âœ… Completed

**Summary**
- Added pure factory `investigationFactory.js` with injectable ID support.
- Created `investigationService.js` to orchestrate validation, state machine transitions, persistence, and event bus emissions.
- Extracted shared transition logic into a private `applyTransition` helper.
- Exposed thin, camelCase wrappers in `investigationCommands.js`.
- Synchronous API, decoupled from React, routers, and external side-effects.

## Sprint 3.6 â€” Investigation Workspace Integration

**Commit**
feat(investigation-workspace): integrate UI with application service

**Status**
âœ… Completed

**Summary**
- Wired `InvestigationWorkspace` to the `eventBus` and `persistenceAdapter` to manage local React state.
- Connected `WorkspaceTabBar` to `createInvestigationCommand`.
- Wired `InvestigationTab` rename (on blur/enter) to `renameInvestigationCommand`.
- Wired `InvestigationTab` close button to `archiveInvestigationCommand`.
- Connected `ArchiveTray` to display archived investigations and hooked up restore/delete buttons.
- Wired `DeleteConfirmationDialog` to `deleteInvestigationCommand`.
- Cleaned up event bus subscriptions on component unmount.
- Verified build and integration.

## Sprint 4.0 — Architecture Freeze & M2/M3 Implementation

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
## Sprint 0 â€” Stabilized the vector database indexing pipeline under free-tier API rate limits. Resolved gemini-embedding-001 method names, added batch-level pacing, and implemented a self-healing mock embedding fallback for daily quota exhaustion. Cleaned up transient database states on startup and archived unused legacy slices.

**Commit**
884b27e feat(backend): implement resilient embedding sync, rate limit safety, and mock fallback

**Status**
âœ… Completed

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


## Sprint — CodeScope Workspace Polish & Boot Sequence

**Commits**
- `de55b8d` feat(codescope): add investigation phase markers and tune reading speed timings
- `984e07c` feat(codescope): refine v2 panels — sequential dots, tighter opacity, row-rise animations
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


## Sprint — Live Investigation Engine & Backend Integration

**Commits**
- `8fdf143` feat(investigation): add domain model — context, events, result, snapshot, repository
- `c843030` feat(investigation): add planner — classification, DAG builder, strategies, scoring
- `9f71431` feat(investigation): add transport layer — SSE, event bus, session, recorder
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
- Removed ProcessingExperience from App.jsx — workspace now entered directly.
- Added investigation test harness, validation fixtures, and 24 investigation log recordings.

*Recorded on 2026-07-24T18:06:00+05:30*


## Sprint — Live Investigation Pipeline, LLM Planner, and Legacy Purge

**Commits**
- `8447c42` refactor(legacy): remove all legacy investigation, observatory, knowledge, and layout modules
- `2f88da3` refactor(codescope): remove obsolete RuntimeAdapter, InvestigationWorkspace, and WorkspaceShell
- `aa7733b` refactor(investigation): remove superseded DefaultStrategy and PlanGenerator
- `237c518` feat(investigation): add LLM-powered planner with context builder, plan validation, and Gemini provider
- `191aa76` fix(investigation): harden execution engine, session manager, SSE transport, and routes
- `07259fd` chore(test): add planner integration test and stress test harness
- `ffa25c5` feat(codescope): add workspace lifecycle hook, event router, presentation model, and recorder
- `e770ab5` feat(codescope): refactor workspace UI — extract lifecycle, add status bar and ready state
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


## Sprint — Workspace V2 Architecture and File Explorer Refinements

**Commits**
- `a572066` fix(server): enhance investigation route, execution engine, and session manager
- `3f0ff87` feat(app): configure API, update App root, and enhance file explorer/viewer
- `d9bd4e5` feat(codescope): add layout engine, workers, and enhance workspace stores
- `89219ac` feat(codescope): introduce UI v2 perspectives and perspective router
- `8465971` feat(codescope): refine v2 panels, command bar, and workspace root
- `2b1770b` feat(codescope): implement architecture view nodes and camera controller
- `8371ae5` refactor(codescope): remove obsolete v1 workspace UI components
- `3e63304` chore(logs): add latest investigation session recordings

**Status**
? Completed

**Summary**
- **Server Fixes**: Hardened Investigation Routes, SessionManager, and ExecutionEngine.
- **App Core**: Added API config, improved File Explorer and File Viewer components, and integrated test/verify scripts.
- **Layout Engine**: Created dedicated layout workers and layout engine stores for the workspace.
- **UI Perspectives**: Built V2 architecture for perspectives (Explorer, Architecture, Investigation).
- **UI Refinements**: Built out AI Overlay Editor, updated Review Panel, Knowledge Panel, and Command Bar.
- **Architecture Nodes**: Integrated 3D/graph file nodes, folder containers, and a dedicated AI camera controller.
- **Legacy Workspace Cleanup**: Dropped 6 obsolete V1 workspace files to finalize the transition to V2.
- **Logs**: Captured all recent investigation session telemetry.

*Recorded on 2026-08-01T19:05:00+05:30*


## Sprint — Workspace UI V2 Shared Components & Investigation Perspectives Refinements

**Commits**
- `ef5c52c` chore(client): update dependencies
- `5acbdb9` feat(codescope): update workspace perspectives, routing, and store
- `7463a5f` feat(codescope): introduce UniversalCodeViewer and refine UI components
- `43b87a8` refactor(codescope): replace ReviewPanel with InvestigationReportSheet
- `b7436c2` chore(logs): add latest investigation session recordings

**Status**
? Completed

**Summary**
- **Dependencies**: Updated package dependencies for latest client packages.
- **UI Perspectives**: Updated all workspace perspectives (Architecture, Investigation), panel routing, and enhanced the workspace store integration.
- **UI Refinements**: Introduced UniversalCodeViewer shared component, and updated FileViewer, LaunchExperience, AIOverlayEditor, and RepositoryReadyState.
- **Legacy Cleanup**: Completely replaced the deprecated ReviewPanel with the new InvestigationReportSheet.
- **Logs**: Captured and added 21 recent investigation session log recordings.

*Recorded on 2026-08-02T11:30:00+05:30*


## Sprint — Foundation Contracts, SSE Transport, and Presentation Models Unification

**Commits**
- `1bcd828` fix(server): update database schema, repository routes, session manager, and parser
- `05edd56` refactor(codescope): remove legacy runtime models, layout engine, and obsolete panes
- `53e4db3` feat(codescope): introduce SSE connection transport and refine workspace lifecycle events
- `941e573` feat(codescope): unify presentation models, playback controls, and perspective views
- `5defd0b` docs(foundation): add domain events and presentation contract specs, plus logs

**Status**
? Completed

**Summary**
- **Server Fixes**: Updated database schema along with repo routes, session manager, and the parse worker.
- **Legacy Purge**: Dropped deprecated RealRuntime, ClaudeRuntime, layout engines, and old observation panes (8 files removed).
- **SSE Transport**: Added useSSEConnection inside codescope transport layer to improve stream stability.
- **UI Unification**: Merged playback controls and domain events into presentation models. Refined perspectives (Architecture, Investigation, Explorer).
- **Foundation Documentation**: Formalized Domain Events and Presentation Contracts.
- **Logs**: Captured and added 3 latest investigation session log recordings.

*Recorded on 2026-08-03T19:51:00+05:30*


## Sprint — Workspace Event Router, Presentation Model, and UI Architecture Improvements

**Commits**
- `6284171` chore(logs): add latest investigation session recordings
- `713a794` feat(codescope): refine workspace lifecycle and investigation session stores
- `5c09af7` feat(codescope): update workspace presentation model and add SSE connection transport
- `6d1f300` feat(codescope): enhance v2 perspectives and perspective router
- `52267dd` feat(codescope): refine v2 knowledge panel, report sheet, and workspace root
- `6026a06` feat(codescope): update AI camera controller and UniversalCodeViewer
- `0100d1d` docs(foundation): add domain events and presentation contracts documentation

**Status**
? Completed

**Summary**
- **Logs**: Captured 3 recent investigation session log recordings.
- **Stores & Hooks**: Split codescope state updates into multiple commits. Refined workspace lifecycle, investigation session, playback controller, and event router.
- **Transport**: Extracted SSE connection into a dedicated hook in the transport layer, combined with presentation model updates.
- **UI Perspectives**: Updated all workspace perspectives (Architecture, Investigation, Explorer) and the core PerspectiveRouter.
- **UI Components**: Enhanced the KnowledgePanel, InvestigationReportSheet, and RepositoryReadyState, keeping batch size strictly under 5 files per commit.
- **Architecture View**: Updated AI camera controller and UniversalCodeViewer.
- **Foundation Documentation**: Added deep-dives on Domain Events and Presentation Contracts to formalize the architecture.

*Recorded on 2026-08-03T19:56:00+05:30*

