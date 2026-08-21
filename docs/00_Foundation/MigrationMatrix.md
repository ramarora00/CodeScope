# Migration Matrix

## Delete Milestones
| Legacy Component | Replacement | Target Milestone | Status |
|---|---|---|---|
| `OverviewScreen.jsx` | `CodeScopeHome` | M2 | ✅ Deleted |
| `RepoUpload.jsx` | `RepositoryConnection` | M3 | ✅ Deleted |
| `DependencyGraph.jsx`| `RepositoryKnowledge` | M4 | ✅ Deleted |
| `FileExplorer` | `Explorer` | M5 | ⏳ Pending |

## Runtime Owners
- App.jsx manages routing shell.
- FSD features encapsulate their UI and logic.
