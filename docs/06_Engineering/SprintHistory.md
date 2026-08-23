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


## Sprint — Workspace V2 Architecture and Live Telemetry Enhancements

**Commits**
- `6974148` feat(codescope): update repo routes and workspace presentation model
- `71ae1fe` feat(codescope): refine v2 investigation panel, architecture perspective, and workspace root
- `3555646` feat(codescope): enhance AI camera controller for architecture view
- `4216b51` chore(logs): add latest investigation session recordings part 1
- `7bf80b2` chore(logs): add latest investigation session recordings part 2
- `37f432e` chore(logs): add latest investigation session recordings part 3

**Status**
? Completed

**Summary**
- **Server & Store**: Updated repo routes and integrated them into the Workspace Presentation Model.
- **UI Perspectives**: Refined the InvestigationPanel, ArchitecturePerspective, and WorkspaceRoot components for V2.
- **Architecture View**: Further enhanced the AI camera controller for fluid architecture view navigation.
- **Logs**: Captured and safely split 13 new investigation telemetry session recordings into 3 separate batches.

*Recorded on 2026-08-04T11:45:00+05:30*


## Sprint — Full UI V2 Overhaul, Animation System, and Shared Component Library

**Commits**
- `9d1b6ff` fix(server): harden execution engine, session manager, plan builder, and domain events
- `cc6b167` feat(codescope): refine workspace lifecycle, investigation session, playback, and presentation model
- `4aa87e3` feat(app): update App routing and enhance file explorer component
- `8bb49f0` feat(codescope): refine v2 architecture, explorer, and investigation perspectives
- `34181f0` feat(codescope): update workspace command bar, title bar, root, and ready state
- `5488383` feat(codescope): update investigation panel, report sheet, knowledge panel, and universal code viewer
- `4350600` style(client): update global styles, design tokens, and utility classes
- `dd178de` chore(logs): add all investigation session telemetry recordings
- `cc44c35` feat(codescope): add AI cursor, shared caption, and transition wrapper shared components
- `d2d589f` feat(codescope): add animation queue hook and repository reading experience view
- `5009c12` feat(shared): add cn utility for conditional class name composition
- `539ddc7` docs(project): add identity and architecture motion reference files
- `33b8ce2` chore(scratch): add error check debug script

**Status**
? Completed

**Summary**
- **Server Hardening**: Tightened ExecutionEngine, SessionManager, UnderstandingPlanBuilder, and domain events with better error handling.
- **State & Lifecycle**: Refined workspace lifecycle hook, investigation session, playback controller, and presentation model stores.
- **App Core**: Updated App routing and significantly enhanced the FileExplorer component.
- **Perspectives**: Refined all three V2 perspectives (Architecture, Explorer, Investigation) and PerspectiveRouter.
- **Workspace Chrome**: Updated CommandBar, MacOSTitleBar, WorkspaceRoot, and RepositoryReadyState.
- **Investigation Panels**: Updated InvestigationPanel, InvestigationReportSheet, KnowledgePanel, and UniversalCodeViewer.
- **Global Styles**: Updated index.css, design tokens, and utility classes.
- **Telemetry**: All 95 investigation session recordings committed in a single dedicated batch.
- **Animation System**: Added useAnimationQueue hook, RepositoryReadingExperience view, AICursor, SharedCaption, and TransitionWrapper.
- **Shared Utilities**: Added cn() class name composition utility.
- **Docs**: Added Identity.txt and archi_motion.txt project reference files.

*Recorded on 2026-08-08T17:48:00+05:30*


## Sprint — Universal Code Viewer, LLM Fallback Provider, and Workspace UI Refinements

**Commits**
- `3ac09e1` feat(codescope): refine workspace stores and presentation model
- `905950d` feat(codescope): update explorer perspective and router
- `74c7cf9` feat(codescope): refine investigation and knowledge panels
- `0925f7c` feat(codescope): update workspace shell components
- `cedf3c9` feat(codescope): enhance shared viewer and ready state
- `ee02920` feat(server): add LLM fallback provider and routing logic
- `c88fa21` feat(server): update execution engine and environment config
- `cd1510a` style(client): update global css
- `35902d5` chore(logs): add all investigation session telemetry recordings

**Status**
? Completed

**Summary**
- **State Management**: Refined the useWorkspacePresentationModel, useWorkspaceStore, and useInvestigationSession hooks.
- **UI Perspectives**: Updated ExplorerPerspective and PerspectiveRouter logic.
- **Investigation Panels**: Deep refinements across InvestigationPanel, InvestigationReportSheet, and KnowledgePanel.
- **Workspace Shell**: Updated CommandBar, Dock, and WorkspaceRoot for better state integration.
- **Shared UI**: Huge enhancements to the UniversalCodeViewer, RepositoryReadyState, and FileExplorer.
- **Server Fallback Provider**: Implemented FallbackProvider and ProviderRouter in the server planner to gracefully handle LLM API failures.
- **Server Core**: Hardened ExecutionEngine and updated .env.example.
- **Styles**: Updated index.css for new panel layouts.
- **Telemetry**: Addressed the exception to batch all 64 recent investigation session logs into one commit.

*Recorded on 2026-08-09T21:35:00+05:30*


## Sprint — Authentication Foundation and UI Polish

**Commits**
- `e4dcee9` feat(client): implement authentication feature and configuration
- `92ec8c6` chore(client): update package dependencies
- `c922a63` feat(codescope): update app shell, launch experience, and workspace root
- `50aa381` feat(codescope): refine dock, command bar, and workspace perspectives
- `15e0152` feat(codescope): enhance shared code viewer, styles, and ready state
- `7131534` chore(logs): add all investigation session telemetry recordings

**Status**
? Completed

**Summary**
- **Authentication**: Added foundational auth service, Firebase integration, and LoginExperience UI.
- **Dependencies**: Updated \package.json\ and lockfile for new libraries.
- **App Shell**: Refined \App.jsx\, \LaunchExperience\, \WorkspaceRoot\, and \FileExplorer\.
- **Workspace Panels**: Polished \CommandBar\, \Dock\, \KnowledgePanel\, and \PerspectiveRouter\.
- **Shared UI**: Updated \UniversalCodeViewer\, \RepositoryReadyState\, and global styles (\index.css\).
- **Telemetry**: Addressed the exception to batch all 38 recent investigation session logs into one commit.

*Recorded on 2026-08-10T17:38:00+05:30*


## Sprint — Planner Context Budgeting and Provider Hardening

**Commits**
- `6592050` feat(codescope): refine investigation perspective, report sheet, and reading experience
- `939117a` feat(codescope): update workspace command bar, knowledge panel, and global styles
- `77b6d0c` feat(codescope): refine file explorer, presentation model, session state, and code viewer
- `96492ce` feat(server): update context builder, context budgeter, and plan validator
- `b7a9174` feat(server): refine LLM providers, routing logic, and add backup provider
- `ee6c330` feat(server): harden execution engine
- `4bd489d` chore(logs): add all investigation session telemetry recordings

**Status**
? Completed

**Summary**
- **UI Perspectives**: Refined \InvestigationPerspective\ and \RepositoryReadingExperience\.
- **Workspace Panels**: Updated \CommandBar\, \KnowledgePanel\, and \InvestigationReportSheet\.
- **Workspace State**: Hardened \useInvestigationSession\, \useWorkspacePresentationModel\, and \UniversalCodeViewer\.
- **Server Planner Core**: Introduced \ContextBudgeter\ to manage context limits alongside \ContextBuilder\ and \PlanValidator\.
- **LLM Providers**: Added \BackupProvider\ and refined \FallbackProvider\, \GeminiProvider\, and \ProviderRouter\.
- **Execution Engine**: Further hardened \ExecutionEngine\ resilience.
- **Telemetry**: Addressed the exception to batch all 59 recent investigation session logs into one commit.

*Recorded on 2026-08-14T18:14:00+05:30*


## Sprint — Workspace Polish and UI Iteration

**Commits**
- `5e4debb` feat(codescope): refine knowledge panel, router, and code viewer
- `0fef691` feat(codescope): enhance file explorer and global styles
- `c653e58` chore(logs): add all investigation session telemetry recordings

**Status**
? Completed

**Summary**
- **Workspace Panels**: Refined \KnowledgePanel\, \PerspectiveRouter\, and \UniversalCodeViewer\.
- **UI Shell**: Enhanced \FileExplorer\ and updated global \index.css\ styles.
- **Telemetry**: Addressed the exception to batch all 23 recent investigation session logs into one commit.

*Recorded on 2026-08-15T12:34:00+05:30*


## Sprint — Workspace Routing and Launch Experience Refinement

**Commits**
- `14fd9fb` feat(codescope): update app routing, workspace root, launch experience, and router
- `13d80b6` feat(codescope): refine command bar, report sheet, and shared code viewer
- `84fca06` feat(codescope): enhance file explorer and global styles
- `401ff5c` chore(logs): add all investigation session telemetry recordings

**Status**
? Completed

**Summary**
- **App Shell & Routing**: Refined \App.jsx\ routing and heavily updated the \LaunchExperience\ alongside \PerspectiveRouter\ and \WorkspaceRoot\.
- **Workspace Panels**: Polished \CommandBar\, \InvestigationReportSheet\, and \UniversalCodeViewer\.
- **Shared UI**: Refined \FileExplorer\ and corresponding global \index.css\ styling adjustments.
- **Telemetry**: Addressed the exception to batch all 10 recent investigation session logs into one commit.

*Recorded on 2026-08-16T19:27:00+05:30*


## Sprint — Auth Redesign, Assets, and UI Polish

**Commits**
- `a9e13c1` feat(auth): redesign login experience and add auth hooks
- `ec14991` feat(codescope): integrate avatar dropdown and update workspace shell
- `6dd848c` feat(codescope): polish architecture perspective, command bar, and dock
- `3ed9e25` chore(assets): add hero assets, capture references, and update global styles
- `f8edd59` chore(scratch): add manual capture script
- `d1e815f` chore(logs): add all investigation session telemetry recordings

**Status**
? Completed

**Summary**
- **Auth Redesign**: Replaced old LoginExperience with a comprehensive new \LoginPage\ modular UI and new \useAuth\ hook.
- **Workspace Core**: Added \UserAvatarDropdown\ component and deeply integrated it into \WorkspaceRoot\, \LaunchExperience\, and \App\.
- **UI Polish**: High fidelity adjustments across \ArchitecturePerspective\, \CommandBar\, \Dock\, and \MacOSTitleBar\.
- **Assets & Styles**: Introduced \hero_asset\ images, updated \index.css\, and added capture debugging scripts.
- **Telemetry**: Addressed the exception to batch all 5 recent investigation session logs into one commit.

*Recorded on 2026-08-18T17:47:00+05:30*


## Sprint — Secondary UI Refinements

**Commits**
- `571cc9c` feat(codescope): refine architecture perspective, dock, knowledge panel, and avatar dropdown

**Status**
? Completed

**Summary**
- **UI Polish**: Continued refinement of the \ArchitecturePerspective\, \Dock\, \KnowledgePanel\, and \UserAvatarDropdown\ components.

*Recorded on 2026-08-19T10:30:00+05:30*


## Sprint — Comprehensive Architecture, Server, and Final Polish

**Commits**
- `e493630` chore(server): update dependencies and database schema
- `595c944` feat(server): refine core routing, API endpoints, and index triggers
- `47c24e5` feat(server): update planner domain, execution providers, and validation logic
- `5f52592` feat(server): harden execution engine, session manager, and auth middleware
- `ea73673` chore(server): add benchmark and testing scripts for ai and embeddings
- `3e58a80` chore(server): update vector store and add security/planner test scripts
- `3e81ab2` feat(codescope): update app shell, launch logic, workspace root, and login UI
- `179b6d8` feat(codescope): refine API client, fetch wrapper, SSE connection, and workspace lifecycle
- `9f846df` feat(codescope): polish command bar, report sheet, title bar, and perspective router
- `9592a0f` feat(client): update shared file viewer, explorer, and analysis components
- `fe65912` chore(client): add vercel config, shiki test script, and info components
- `1000991` docs: add final audit, project freeze documents, and prisma migration

**Status**
? Completed

**Summary**
- **Server Architecture**: Hardened \ExecutionEngine\, \Planner\, routing, and auth middleware. Updated \Prisma\ schemas and added repository ownership migrations.
- **Server Testing & Benchmarks**: Added multiple scripts for AI benchmarking, vector store, and IDOR testing.
- **Client Workspace**: Refined LaunchExperience, \PerspectiveRouter\, API fetching, SSE lifecycle, and all major UI panels.
- **Client Components**: Polished \FileExplorer\, \ArchitectureInsights\, and \ImpactAnalysis\.
- **Documentation**: Finalized \FINAL_AUDIT.md\ and \PROJECT_FREEZE.md\.

*Recorded on 2026-08-20T20:14:00+05:30*


## Sprint — Legacy Code Cleanup and Graph Deprecation

**Commits**
- `483f735` refactor(client): remove deprecated top-level components
- `47ab926` feat(codescope): refine v2 explorer perspective, investigation panel, and routing
- `14d8253` chore(server): update package dependencies and add repository hydration scripts

**Status**
? Completed

**Summary**
- **Legacy Cleanup**: Systematically removed a huge swathe of deprecated v1 components, including the legacy codescope UI and the entire v1 repository graph canvas implementation.
- **V2 Perspectives**: Refined the new \ExplorerPerspective\ and \InvestigationPanel\ which replace the deleted components.
- **Server Updates**: Added repository state tracking scripts (\get_repo.js\, \erify_hydration.js\) and updated package dependencies.

*Recorded on 2026-08-21T12:20:00+05:30*


## Sprint — Supabase and PostgreSQL Integration

**Commits**
- `e0dbf78` chore(prisma): update schema and generate unified init migration for supabase
- `fea786b` refactor(prisma): remove deprecated sqlite migrations
- `71be6b7` chore(server): update environment variables and dependencies for supabase
- `b2eb16f` feat(server): update repository routes and vector store to support postgresql

**Status**
? Completed

**Summary**
- **Prisma & Database**: Removed all legacy SQLite migrations. Created a single, unified initialization migration for PostgreSQL/Supabase and updated \schema.prisma\ accordingly.
- **Server Config**: Cleaned up \.env.example\ and updated package dependencies to support the new database environment.
- **Core Services**: Updated \ectorStore.js\ and \epo.js\ routes to utilize the new PostgreSQL provider capabilities.

*Recorded on 2026-08-21T22:32:00+05:30*


## Sprint — Workspace Guide and Navigation Enhancements

**Commits**
- `d0974b9` feat(codescope): introduce codescope guide and refine launch experience
- `a17a21d` feat(codescope): update architecture perspective, router, and investigation routes

**Status**
? Completed

**Summary**
- **UI Additions**: Introduced the new \CodeScopeGuide\ shared component and integrated it into the application.
- **Workspace Polish**: Minor refinements to the \LoginPage\ layout, \LaunchExperience\, \ArchitecturePerspective\, and \PerspectiveRouter\.
- **Server Routes**: Updated the investigation routes to align with the new workspace flow.

*Recorded on 2026-08-23T15:34:00+05:30*


## Sprint — Branding and UI Cleanup

**Commits**
- `b05a193` feat(codescope): refine login page and launch experience UI
- `d000de3` chore(client): update favicon, html title, and remove deprecated assets

**Status**
? Completed

**Summary**
- **UI Polish**: Minor layout refinements to \LoginPage\ and \LaunchExperience\ panels.
- **Branding**: Updated the client \avicon.svg\, \index.html\ title, and purged old \hero_asset.png\ and manual capture screenshots.

*Recorded on 2026-08-23T16:26:00+05:30*

