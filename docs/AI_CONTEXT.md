  # AI_CONTEXT.md

**IMPORTANT TO ALL FUTURE AI AGENTS:** 
This document is the permanent single source of truth for AI agents operating on this repository. **Always read this file first** to understand the architectural boundaries, current sprint goals, and strict behavioral rules before executing commands or modifying code.

---

## 🎯 Product Vision
**AI-Developer Copilot** is an AI-powered codebase intelligence platform. It bridges the gap between deterministic static analysis (Abstract Syntax Trees and Call Graphs) and semantic AI understanding (LLMs and Vector Embeddings). The goal is to provide developers with deep, contextual insights into codebase architecture, execution flows, and structural blast radius analysis.

---

## 🏗️ Current System Architecture

### Current Backend
- **Framework**: Node.js with Express.js acting as an API gateway.
- **Data Persistence**: SQLite managed by Prisma ORM for relational metadata; LanceDB for local semantic vector embeddings.
- **Intelligence Engine (`server/utils`)**: 
  - Offloads heavy AST processing (using `@babel/parser` and `@babel/traverse`) to background Worker Threads (`parseWorker.js`) to keep the event loop unblocked.
  - Generates deterministic call graphs mapping execution flows and dependencies across modules.
- **AI Integration**: Orchestrates dynamic context by blending AST deterministic results with semantic LanceDB lookups before feeding prompts to Google Generative AI (Gemini).

### Current Frontend
- **Framework**: React 19 SPA built with Vite.
- **Styling**: TailwindCSS v4.
- **Core Views**: Heavy emphasis on data visualization using `reactflow` and `react-force-graph-2d` for interactive architectural and dependency graphs. 

---

## 📜 Rules & Behavioral Constraints

1. **Do not hallucinate architectural changes**: Rely strictly on the established Prisma schema and the 5-pass backend pipeline.
2. **Preserve multi-threading**: Never move AST parsing or CPU-intensive operations back to the main Node.js event loop.
3. **Respect the Single Source of Truth**: For documentation, `docs/architecture/system-design.md` will be the definitive guide. For AI state, it is this file (`AI_CONTEXT.md`).
4. **Style adherence**: Follow existing modern aesthetics (dark mode, sleek gradients, glassmorphism) if generating new UI components.

## 🚫 Do Not Modify List
Under no circumstances should an AI agent modify the logic inside the following core engine files without explicit, forceful human override:
- `server/utils/parser.js`
- `server/utils/parseWorker.js`
- `server/utils/graphTraversal.js`
- `server/utils/graphQuery.js`
- `server/utils/vectorStore.js`
- `server/prisma/schema.prisma` (Database structural changes require careful manual migrations)

---

## 👨‍💻 Coding Standards
- **Backend**: 
  - Standard CommonJS/ES6 mixed patterns as currently structured. 
  - Use `async/await` and avoid `.then()` chains. 
  - Ensure heavily commented API endpoints using pseudo-JSDoc `// @route`, `// @desc` headers.
- **Frontend**: 
  - Functional React Components with React Hooks. 
  - Utility-first CSS using Tailwind v4. 
  - Clean prop-drilling or context providers; no heavy state-management libraries (Redux) unless introduced by humans.

---

## 🏃 Current Sprint
**Sprint Phase**: Engineering Stabilization Sprint.
- **Goal**: Transform the repository into a professionally structured engineering project. 
- **Focus**: Documentation architecture, structural cleanup, and tech debt identification.
- **Constraint**: **Do NOT implement any new features. Do NOT modify backend logic. Do NOT refactor production code.**

---

## ⚠️ Known Technical Debt
1. **Testing**: Severe lack of automated unit/integration tests (relying primarily on some local `golden-repos` for manual validation).
2. **Local Storage Bound**: The system assumes local filesystem access for cloned repositories (`repos/` folder) and local SQLite storage, creating bottlenecks for horizontal cloud scaling.
3. **API Documentation**: No Swagger/OpenAPI auto-generation configured yet.
4. **Error Handling**: The background ingestion pipeline does not have robust partial-retry mechanisms if LanceDB sync fails mid-way.

---

## 🔌 Current APIs

### Repo Management (`server/routes/repo.js`)
- `POST /api/repo/upload`: Trigger background repository ingestion.
- `POST /api/repo/index-local`: Local test directory indexing.
- `GET /api/repo`: Fetch analyzed repositories.
- `GET /api/repo/:id/files`: Fetch file tree.
- `GET /api/repo/:id/dependencies`: File-level import graph.
- `GET /api/repo/:id/symbols/graph`: Code construct execution graph.

### Chat & AI (`server/routes/chat.js`)
- `POST /api/chat`: Primary endpoint for semantic, graph, and architectural queries. Analyzes prompt intent to fetch correct context before hitting the LLM.

---

## 🗄️ Current Database Structure

**Prisma ORM (Relational)**
- `Repo`: Tracks indexed codebases.
- `File`: Stores contents, SHA-hashes, and parsed AST metadata.
- `Symbol`: Tracks modules, functions, classes, and routes.
- `SymbolRelationship`: Edge definitions (calls, imports, exports) with execution ordering and resolution confidence tracking.

**LanceDB (Vector)**
- Local embedding store mapping code chunks to dense vectors for semantic similarity lookups.

---

## 📂 Current Folder Structure

```text
ai-developer-copilot/
├── client/                  # Frontend SPA
│   └── src/
│       └── components/      # React Views & Graphs
├── server/                  # Backend API
│   ├── data/vectors/        # LanceDB storage
│   ├── prisma/              # SQLite DB & Migrations
│   ├── routes/              # Express API definitions
│   ├── tests/               # Validation & Golden-repos
│   └── utils/               # AI & AST Core Engine
├── repos/                   # Cloned target workspaces
├── docs/                    # (Newly established) Documentation Hub
└── package.json             # Root workspace manager
```

---

## 🎨 Current Design Philosophy
- **UI/UX**: The application must look premium and cutting-edge. High utilization of deep dark themes, subtle micro-animations, structured data tables, and highly interactive canvas elements (ReactFlow/ForceGraph).
- **Backend**: Non-blocking asynchronous design. The main thread serves API requests instantly while offloading actual repository analysis entirely to background workers and external vector stores.
