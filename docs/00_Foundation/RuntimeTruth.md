# Runtime Truth

The definitive state of runtime execution across the CodeScope application. This document summarizes reality; it is updated by migrations and referenced by other plans.

## Current Milestone
- Completed: M4 (Repository Knowledge)
- Next: M5 (Repository Explorer)

## Deletion Status
- `OverviewScreen.jsx`: Deleted (Replaced by CodeScopeHome)
- `RepoUpload.jsx`: Deleted (Replaced by RepositoryConnection)
- `DependencyGraph.jsx`: Deleted (Replaced by RepositoryKnowledge)
- `LegacyTraceViewer`: Deleted
- `DashboardOld`: Replaced

## Current Runtime Owner Summary
- **Layout**: AppShell
- **Navigation**: App.jsx
- **Repository Connection**: RepositoryConnection.jsx
- **Knowledge Capability**: features/knowledge/ui/RepositoryKnowledge.jsx
- **Knowledge State**: features/knowledge/model/useKnowledgeState.js
- **Execution**: Execution Workspace (pending M6)
- **State**: App.jsx (global)
- **AI**: ObservatoryShell
- **Graph**: features/repository-graph (widget)
- **Search**: (pending global, local in ScopeSearch)
- **Processing**: RepositoryConnection pipeline
- **Analysis Session**: InvestigationWorkspace.jsx
