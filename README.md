# CodeScope
An AI-powered codebase intelligence platform that reads, reasons, and reveals what matters.

## Overview
CodeScope is a context-aware developer tool that bridges the gap between static codebase structures and semantic AI reasoning. Instead of generic AI chat interfaces that struggle with large codebases, CodeScope ingests an entire repository, builds a deterministic dependency graph, creates semantic vector embeddings, and uses an advanced investigation planner to answer complex engineering questions with verifiable evidence. It helps developers understand execution flows, trace dependencies, and evaluate architectural blast radiuses deterministically.

## Key Features
- **Repository Mapping & Ingestion**: Automatically clones, indexes, and builds structural models of public GitHub repositories.
- **Deep Code Understanding**: Uses Babel for AST parsing to extract precise code symbols (functions, classes, routes) and their relationships.
- **Semantic Vector Search**: Embeds code chunks into LanceDB for high-performance natural-language semantic querying.
- **Dependency & Call Graph**: Deterministically resolves upstream and downstream dependencies across files to map execution flow.
- **Contextual Investigation Pipeline**: An LLM-powered Planner and Execution Engine orchestrate context retrieval, ensuring the AI only reasons over verified codebase context.
- **Evidence-Backed Insights**: Generates investigation reports with direct evidence links to the underlying files and symbols.
- **Secure Authentication**: Private, isolated workspaces protected by Firebase Authentication.
- **Interactive Workspace**: A modular, dynamic React interface with customizable perspectives (Explorer, Architecture, Investigation).

## How It Works
CodeScope operates on a highly structured background pipeline to combines deterministic code analysis and evidence-backed retrieval to reduce unsupported AI reasoning.

1. **Ingestion**: The source repository is cloned to a local workspace.
2. **Structural Analysis (AST)**: Worker processes parse files, extracting symbols and generating a deterministic Call Graph (callers/callees).
3. **Semantic Indexing**: Code is chunked and embedded into LanceDB.
4. **Investigation Planning**: When a user asks a question, the `Planner` formulates an execution plan.
5. **Execution & Context Retrieval**: The `ExecutionEngine` pulls exact graph relations and semantic vectors.
6. **Evidence & Report**: The configured LLM provider reasons over the strict repository context to produce an evidence-backed investigation report, with fallback providers available for resilience.

## Architecture

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Zustand |
| **Backend API** | Node.js, Express.js |
| **Database (Relational)** | PostgreSQL, Prisma ORM |
| **Vector Store (Semantic)** | LanceDB |
| **AI Orchestration** | Multi-provider LLM orchestration (Gemini + Groq + OpenRouter) |
| **Authentication** | Firebase |
| **Code Parsing** | Babel (`@babel/parser`, `@babel/traverse`) |

```mermaid
graph TD
    User([User]) --> Client[CodeScope React Workspace]
    
    subgraph Frontend
        Client --> Auth[Firebase Authentication]
        Client --> Workspace[Workspace Router & Perspectives]
    end
    
    Workspace --> API[Express API Gateway]
    
    subgraph Backend Pipeline
        API --> Ingestion[Repository Ingestion]
        API --> Investigation[Investigation Engine]
        
        Ingestion --> AST[Babel AST Parser]
        AST --> Graph[Dependency / Call Graph]
        Ingestion --> Embeddings[Semantic Chunker & Embedder]
        
        Investigation --> Planner[AI Planner]
        Planner --> Executor[Execution Engine]
    end
    
    subgraph Data Stores
        Graph --> Postgres[(PostgreSQL via Prisma)]
        Embeddings --> Lance[(LanceDB Vector Store)]
        Executor --> Postgres
        Executor --> Lance
    end
    
    Executor --> Gemini[Gemini API]
    Gemini --> Report[Evidence-Backed Report]
    Report --> Client
```

## Project Structure
```text
CodeScope/
├── client/                  # React SPA frontend
│   ├── src/
│   │   ├── features/        # Modular domain features (auth, codescope)
│   │   ├── config/          # API and environment configuration
│   │   └── shared/          # Shared UI components and utilities
├── server/                  # Node.js Express API
│   ├── prisma/              # PostgreSQL schema and migrations
│   ├── routes/              # Express API endpoints (chat, repo, investigate)
│   └── utils/               # Investigation engine, Vector store, AST parsing
└── docs/                    # Engineering Documentation
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database
- Google Gemini API Key
- Firebase Project (for Authentication)

### 1. Clone the repository
```bash
git clone https://github.com/ramarora00/CodeScope.git
cd CodeScope
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### 3. Environment Variables

**Backend (`server/.env`)**
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codescope?sslmode=disable"

# AI Provider
GEMINI_API_KEY="<YOUR_GEMINI_API_KEY>"
FALLBACK_API_KEY="<YOUR_FALLBACK_API_KEY>"

# Firebase
FIREBASE_PROJECT_ID="<YOUR_FIREBASE_PROJECT_ID>"
```

**Frontend (`client/.env`)**
```env
VITE_API_URL=http://localhost:5000

# Firebase Configuration
VITE_FIREBASE_API_KEY="<YOUR_FIREBASE_API_KEY>"
VITE_FIREBASE_AUTH_DOMAIN="<YOUR_FIREBASE_AUTH_DOMAIN>"
VITE_FIREBASE_PROJECT_ID="<YOUR_FIREBASE_PROJECT_ID>"
VITE_FIREBASE_STORAGE_BUCKET="<YOUR_FIREBASE_STORAGE_BUCKET>"
VITE_FIREBASE_MESSAGING_SENDER_ID="<YOUR_FIREBASE_SENDER_ID>"
VITE_FIREBASE_APP_ID="<YOUR_FIREBASE_APP_ID>"
```

### 4. Database Setup
```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

### 5. Start the Application
Open two terminals:

**Terminal 1 (Backend)**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend)**
```bash
cd client
npm run dev
```

## Example Usage
1. **Sign in**: Launch the app and authenticate securely via Firebase.
2. **Launch Experience**: Enter a public GitHub repository URL (e.g., `https://github.com/sindresorhus/component-emitter`).
3. **Mapping**: Wait for the background engine to clone, parse ASTs, and embed vectors.
4. **Explore**: Navigate through the Architecture and Explorer perspectives.
5. **Investigate**: Ask a specific question like *"Explain the authentication flow"* in the Investigation Panel.
6. **Review Evidence**: Read the generated report, utilizing the linked symbols and code paths to verify the AI's reasoning.

## Screenshots

### Login & Launch
![Secure login screen and repository launch interface](login.png)

### Repository Mapping
![Live status indicators during AST parsing and vectorization](indexing.png)

### Investigation Workspace
![The main workspace showing the file explorer, architecture perspective, and investigation chat](investigation.png)

### Evidence Report
![An AI-generated report highlighting deterministic evidence and code blocks](report.png)

## Security & Scope
- **Secure Workspaces**: Firebase Authentication ensures all sessions are strictly private.
- **Repository Isolation**: Repositories are isolated within the server-side processing workflow and are not exposed through the public UI.
- **Out-of-Context Protection**: The `PlanValidator` and `ExecutionEngine` strictly enforce that answers are derived only from the mapped repository's context, reducing unsupported or out-of-context AI responses.
- **Secrets Management**: All API keys and database credentials are managed exclusively via environment variables and are never checked into version control.

## Current Limitations
- Supports primarily JavaScript/TypeScript ecosystems for deep AST resolution.
- Only public GitHub repositories are supported via the UI cloning flow.
- Memory constraints may occur locally on extremely large monolithic repositories during the concurrent indexing phase.
- Very large repositories may increase memory usage and indexing time.

## Contributing
We welcome contributions to CodeScope! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct, development process, and how to submit pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author
**Ram Arora**  
GitHub: [https://github.com/ramarora00/CodeScope](https://github.com/ramarora00/CodeScope)

---
*Built for developers. Designed for clarity.*
