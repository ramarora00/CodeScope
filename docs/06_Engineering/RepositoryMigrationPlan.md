# Repository Migration Plan
**Phase:** Sprint 2.0
**Objective:** Establish the exact target repository structure and define the migration pathway before any refactoring begins.

---

## 1. Final Frontend Folder Structure
We will adopt a modified Feature-Sliced Design (FSD) tailored for Mission Control:

```text
client/src/
├── app/               # Global App shell, Root routing, Global providers
├── features/          # Domain-driven feature slices
│   ├── architecture/  # Force-Directed graph visualizations
│   ├── execution/     # Linear execution trace mapping
│   ├── impact/        # Blast radius analysis
│   ├── observatory/   # AI Chat and prompt context
│   └── workspace/     # Global repository management (Upload, List)
└── shared/            # Reusable UI, hooks, and API configurations
```

---

## 2. Final Backend Folder Structure
The backend must abandon the "God-Route" pattern and strictly adopt an N-Tier architecture:

```text
server/src/
├── ai/                # Context orchestration and Gemini integrations
├── config/            # Environment parsing and global constants
├── controllers/       # Request validation and HTTP response mapping
├── embeddings/        # LanceDB interaction layer
├── graph/             # Deterministic relationship resolution logic
├── middleware/        # Global error handlers, request loggers
├── parser/            # Babel AST logic
├── repositories/      # Prisma DB access layer (Data Access Objects)
├── routes/            # Express router bindings
├── services/          # Core business logic (isolated from HTTP)
├── types/             # Shared TypeScript-like JSDoc definitions
├── utils/             # Helper functions (hashing, file system)
└── workers/           # Node.js Worker Threads (`parseWorker`)
```

---

## 3. Current → Future Mapping

**Frontend Mappings**
- `client/src/components/OverviewScreen.jsx` ➔ `client/src/features/workspace/pages/WorkspaceDashboard.jsx`
- `client/src/components/AIObservatory.jsx` ➔ `client/src/features/observatory/components/AIObservatory.jsx`
- `client/src/components/DependencyGraph.jsx` ➔ `client/src/features/architecture/components/DependencyGraph.jsx`
- `client/src/components/ImpactAnalysis.jsx` ➔ `client/src/features/impact/components/ImpactExplorer.jsx`
- `client/src/components/FileExplorer.jsx` ➔ `client/src/features/workspace/components/FileTree.jsx`
- `client/src/components/TopBar.jsx` ➔ `client/src/shared/ui/layout/TopBar.jsx`
- `client/src/components/RepoList.jsx` ➔ `client/src/features/workspace/components/RepoList.jsx`

**Backend Mappings**
- `server/routes/repo.js` ➔ **Splits into**:
  - `server/src/routes/repo.routes.js`
  - `server/src/controllers/repo.controller.js`
  - `server/src/services/indexing.service.js`
  - `server/src/repositories/repo.repository.js`
- `server/routes/chat.js` ➔ **Splits into**:
  - `server/src/routes/chat.routes.js`
  - `server/src/controllers/chat.controller.js`
  - `server/src/ai/orchestrator.js`
- `server/utils/parser.js` ➔ `server/src/parser/astParser.js`
- `server/utils/parseWorker.js` ➔ `server/src/workers/astWorker.js`
- `server/utils/vectorStore.js` ➔ `server/src/embeddings/lanceStore.js`

---

## 4. Migration Order
*Rule: Move ONE feature at a time. Test it. Commit it. Never break the application.*

1. **Scaffold**: Create the new `client/src/` and `server/src/` empty folder structures.
2. **Backend Foundation**: Move `config/`, `middleware/`, and `utils/`.
3. **Backend Intelligence Core**: Move and isolate `parser/`, `workers/`, `embeddings/`, and `graph/`. (No HTTP changes yet).
4. **Backend API Overhaul**: Refactor `routes/repo.js` and `routes/chat.js` into the `controllers/` and `services/` layers. 
5. **Frontend Shared Foundation**: Establish `client/src/shared/` (UI, API, Types, Constants).
6. **Frontend Feature: Workspace**: Migrate RepoList, Upload, and File Explorer.
7. **Frontend Feature: Architecture**: Migrate the main graph canvas.
8. **Frontend Feature: Observatory**: Migrate the AI chat panel.

---

## 5. Dependency Risks
**High Risk Files (Move Last):**
- **`server/routes/repo.js`**: Moving this too early will break the entire ingestion pipeline. The core engines (`parser`, `embeddings`, `graph`) must be safely housed in their new directories first. Only then can `repo.js` be safely sliced into `services` and `controllers`.
- **`client/src/components/OverviewScreen.jsx`**: This file acts as a massive prop-driller. If moved before its children (Observatory, Graph), state management will shatter. It must be migrated *after* Zustand stores are created.

---

## 6. Feature Ownership
- **Workspace**: Everything regarding repository selection, cloning, status tracking, and file viewing.
- **Architecture**: The full-bleed dependency mapping canvas.
- **Execution**: Components related to tracing linear request lifecycles.
- **Impact**: The specialized UI for highlighting blast radius shockwaves.
- **Observatory**: The AI chat interface, context displays, and prompt engineering.
- **Shared**: Base UI tokens, layouts, global API interceptors.

---

## 7. Shared Library Design
Located exclusively in `client/src/shared/`:
- **`shared/ui/`**: Base Tailwind components (Button, Input, Modal, Tooltip, Skeleton, Toast). Contains zero business logic.
- **`shared/hooks/`**: Global react hooks (`useDebounce`, `useKeyPress`, `useWindowSize`).
- **`shared/utils/`**: Formatting and pure logic (`classNames`, `formatDate`, `colorGenerators`).
- **`shared/types/`**: JSDoc/PropTypes shapes for generic data (`GraphNode`, `Edge`).
- **`shared/constants/`**: Environment configurations (`API_URL`, `THEME_TOKENS`).

---

## 8. API Layer Design
Data fetching will be localized to the features utilizing it, communicating through a shared Axios instance.
- **Shared Client**: `client/src/shared/api/apiClient.js` (Handles base URL and global 500 interceptors).
- **Feature Specific**: 
  - `client/src/features/workspace/api/repoApi.js` (Endpoints for ingestion/listing).
  - `client/src/features/architecture/api/graphApi.js` (Endpoints for fetching edges).

---

## 9. Store Layer Design (Zustand)
State is decentralized based on the feature domain to prevent unnecessary re-renders:
- `features/workspace/store/useWorkspaceStore.js`: Active Repo ID, Ingestion progress.
- `features/architecture/store/useGraphStore.js`: Selected Node, Active layout engine, Zoom state.
- `shared/store/useUIStore.js`: Sidebar toggles, Theme state, Modal triggers.

---

## 10. Final Repository Tree (v1.0 Placement Release)

```text
ai-developer-copilot/
├── client/
│   └── src/
│       ├── app/
│       ├── features/
│       │   ├── architecture/
│       │   ├── execution/
│       │   ├── impact/
│       │   ├── observatory/
│       │   └── workspace/
│       └── shared/
│           ├── api/
│           ├── constants/
│           ├── hooks/
│           ├── store/
│           ├── types/
│           ├── ui/
│           └── utils/
├── server/
│   └── src/
│       ├── ai/
│       ├── config/
│       ├── controllers/
│       ├── embeddings/
│       ├── graph/
│       ├── middleware/
│       ├── parser/
│       ├── repositories/
│       ├── routes/
│       ├── services/
│       ├── types/
│       ├── utils/
│       └── workers/
├── docs/
│   ├── 00_Foundation/
│   ├── 01_Product/
│   ├── 02_Architecture/
│   ├── 06_Engineering/
│   │   └── RepositoryMigrationPlan.md
│   └── ...
├── repos/
├── README.md
└── package.json
```
