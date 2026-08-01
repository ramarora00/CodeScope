# Deprecated Workspace Root (v2 Experiment)

This directory (`client/src/features/codescope/ui/v2/`) has been deprecated and archived as part of the **Workspace Unification** milestone.

## Context
During CodeScope development, a parallel UI architecture (`v2/WorkspaceRoot`) was prototyped to introduce clean runtime abstraction (`RuntimeAdapter`) and index boot step visualizations. However, this branch remained partially completed and did not receive the core features implemented on the primary workspace, such as:
- FocusContext (Zustand store driving workspace states)
- The Planner query/search bar execution launcher
- Relationship Graph Canvas integration
- Predictive Graph Node dimming
- AIObservatory streaming findings

`InvestigationWorkspace.jsx` was audited and proven to hold 90%+ of the active feature set.

## Salvaged Assets
- The SSE repository indexing boot animation logic has been backported into `InvestigationWorkspace.jsx`.
- The `RuntimeAdapter` pattern and decoupled mock runtimes are preserved in the `model/` directory for reference.

## Transition Commit
- **Canonical Migration Tag**: `workspace-unification`
- **Owner**: `client/src/features/codescope/ui/InvestigationWorkspace.jsx`
