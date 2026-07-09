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
