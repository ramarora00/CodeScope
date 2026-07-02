<div align="center">

# AI-Developer Copilot

**An AI-Powered Codebase Intelligence Platform**

![AI-Developer Copilot Banner](docs/assets/banner-placeholder.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Advanced MVP](https://img.shields.io/badge/Status-Advanced_MVP-orange.svg)]()
[![Stack: Node.js & React 19](https://img.shields.io/badge/Stack-Node%20%7C%20React%20%7C%20Prisma-blueviolet.svg)]()

</div>

---

## 🎯 1. Project Vision
To accelerate engineering velocity and intelligence by bridging the gap between static codebase structures and semantic AI reasoning. We aim to make legacy monolithic architectures instantly understandable.

## ❓ 2. Why this project exists
Modern codebases are complex webs of implicit dependencies and undocumented domain logic. Developers spend countless hours mapping out execution flows manually. **AI-Developer Copilot** exists to serve as an intelligent, context-aware companion that doesn't just read code, but *understands* its execution flow. It answers the hardest engineering questions deterministically: *"What is the blast radius if I change this function?"* and *"How does data flow from this route to the database?"*

## ✨ 3. Key Features
- **Deterministic Graph Resolution**: Maps downstream and upstream dependencies across files, resolving aliases and exports to build an accurate Call Graph.
- **Asynchronous Repository Indexing**: Offloads CPU-intensive AST parsing to background Worker Threads for non-blocking execution.
- **Semantic Vector Search**: Chunks and embeds source code into LanceDB for natural language querying.
- **Interactive Visualizations**: Renders dynamic module dependency graphs and execution flows via `reactflow` and `react-force-graph-2d`.
- **AI Context Orchestration**: Categorizes user queries (architecture vs. flow trace) and injects exact deterministic graph data to prevent LLM hallucinations.

## 🏗️ 4. High-Level System Architecture
The platform operates on a decoupled architecture adhering strictly to our [Engineering Charter](docs/00_Foundation/EngineeringCharter.md):
- **Frontend Layer**: React 19 SPA. Visualization-heavy, managing local component states.
- **API Gateway**: Node.js/Express. Headless intelligence engine coordinating jobs.
- **Relational Store**: SQLite (via Prisma) for AST nodes, files, and deterministic call graph edges.
- **Semantic Store**: LanceDB for high-performance vector embeddings.
- **AI Brain**: Google Generative AI (Gemini) orchestration.

## 💻 5. Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TailwindCSS v4, ReactFlow, React-Force-Graph-2D |
| **Backend** | Node.js, Express.js, Babel (AST Parsing), Worker Threads |
| **Data & AI** | Prisma ORM, SQLite, LanceDB, Google Generative AI (Gemini) |

## 📂 6. Repository Structure
```text
ai-developer-copilot/
├── client/                  # React frontend application
├── server/                  # Node.js Express API and Engine
│   ├── prisma/              # Schema and SQLite DB
│   ├── routes/              # Express API Routes (chat, repo)
│   └── utils/               # AI Engine & AST Worker Threads
├── docs/                    # Engineering Documentation Hub
└── repos/                   # Cloned workspace (Temporary Storage)
```

## ⚙️ 7. Core Engine Pipeline
When a repository is ingested, the engine runs a rigorous background pipeline:
1. **Repo**: Source code is cloned to the local workspace.
2. **AST (Pass 1)**: Worker Threads parse files and extract code symbols.
3. **Graph (Pass 2)**: Edges are resolved deterministically (Callers/Callees).
4. **Vector (Pass 3)**: Code chunks are embedded into LanceDB.
5. **AI**: Graph relations and semantic vectors are orchestrated as strict context to the LLM.

## 📸 8. Screenshots

| Intelligence Dashboard | Dependency Visualization |
| :---: | :---: |
| ![Dashboard Placeholder](docs/assets/dashboard-placeholder.png) | ![Graph Placeholder](docs/assets/graph-placeholder.png) |
| *Contextual AI chat and file exploration* | *Interactive module dependency graph* |

## 🚀 9. Local Setup

### Prerequisites
- Node.js (v18+ recommended)
- Git

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/your-username/ai-developer-copilot.git
cd ai-developer-copilot

# 2. Install dependencies
npm run install-all

# 3. Setup Environment
echo 'DATABASE_URL="file:./dev.db"' > server/.env
echo 'GEMINI_API_KEY="your_google_api_key"' >> server/.env

# 4. Initialize Database
cd server && npx prisma migrate dev --name init && cd ..

# 5. Start Dev Servers (Frontend & Backend)
npm run dev
```

## 📚 10. Documentation Index
- [Engineering Charter & Rules](docs/00_Foundation/EngineeringCharter.md)
- [System Architecture](docs/SystemArchitecture.md)
- [AI Context (For Agents)](docs/AI_CONTEXT.md)
- *See the `docs/` folder for deeper frontend, backend, and API guidelines.*

## 🛣️ 11. Roadmap
- **Sprint 0-1 (Current)**: Engineering Stabilization and Documentation Architecture.
- **Sprint 2**: Backend Decoupling (Eradicating God Objects).
- **Sprint 3**: Frontend State Abstraction (Zustand/React Query).
- **Sprint 4**: Automated Testing Suite (Jest/Supertest).

## 📊 12. Current Status
**Status:** *Advanced MVP / Active Development (Stabilization Phase)*
The core deterministic and semantic pipelines are fully functional. The repository is undergoing structural stabilization for multi-developer scaling.

## 🔮 13. Future Scope
- **Cloud-Native Migration**: Abstracting the local `/repos` disk and SQLite to AWS S3 and PostgreSQL.
- **Language Server Protocol (LSP)**: Moving from Babel AST parsing to robust language-agnostic LSPs.

## 🤝 14. Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on branch naming, PR requirements, and the Definition of Done.

## 📄 15. License
This project is licensed under the [MIT License](LICENSE).
