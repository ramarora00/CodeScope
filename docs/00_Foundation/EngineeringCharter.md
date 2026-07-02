# Engineering Charter

This document serves as the permanent engineering rulebook and constitution for the **AI-Developer Copilot** repository. It outlines the philosophy, standards, and operational guidelines from which every future engineering decision must derive. It is implementation-independent.

---

## 1. Mission
To accelerate engineering velocity and codebase comprehension by bridging the gap between deterministic static analysis and semantic AI reasoning. We aim to make legacy monolithic architectures instantly understandable.

## 2. Vision
A development ecosystem where software engineers and AI agents never have to manually trace execution flows, guess the blast radius of a change, or struggle with architectural onboarding. The Copilot serves as the omniscient, context-aware companion for any codebase.

## 3. Product Scope
The scope is strictly bounded to codebase ingestion, deterministic graph resolution (AST parsing), semantic vector mapping, and contextual AI-driven insights. 
- **In Scope**: Visualizing dependencies, querying blast radius, natural language codebase search, architectural summarization.
- **Out of Scope**: Acting as a fully-featured IDE, direct code compilation, or automated deployment execution.

## 4. Core Engineering Principles
1. **Determinism Before AI**: Never rely on an LLM to guess what can be statically proven. Always feed deterministic graphs to the AI to prevent hallucination.
2. **Simplicity Over Cleverness**: Code is read vastly more times than it is written. Optimize for readability by the next human or AI agent.
3. **Decoupled by Default**: God Objects are toxic. Always separate routing, business logic, data access, and background jobs.

## 5. Architecture Principles
- **Event-Driven**: CPU-intensive operations (like AST parsing) must never block the main API thread.
- **Storage-Agnostic Boundaries**: The engine should not assume it is running on a local file system with SQLite. Abstract storage layers so they can transition to cloud-native solutions (S3/Postgres) seamlessly.
- **API-First**: The backend is a headless intelligence engine. The frontend is merely a consumer. All data access must occur strictly through defined APIs.

## 6. Frontend Principles
- **Visualization is Paramount**: The UI exists to make complex data intuitive. Graph rendering must be fluid, interactive, and visually stunning.
- **State Localization**: Keep state as close to where it is used as possible. Only elevate to global state when strictly necessary.
- **Consistent Aesthetic**: Maintain the established premium aesthetic (dark mode, clean typography, Tailwind standard tokens).

## 7. Backend Principles
- **Isolate Heavy Computation**: All code parsing must be executed in isolated Worker Threads.
- **Strict Service Layer**: Express routes are strictly for handling HTTP requests and responses. All algorithmic logic lives in the Service Layer.
- **Graceful Failure**: If a repository contains malformed code or fails ingestion midway, the system must not corrupt the overarching Knowledge Graph. 

## 8. AI Development Workflow
- **AI as Junior Engineers**: AI coding agents operating on this repository must be treated as capable but junior engineers. They require strict operational boundaries and explicit context constraints.
- **Zero Hallucination Tolerance**: AI must base architectural answers exclusively on the provided deterministic context.
- **Mandatory Review**: All structural or architectural changes proposed by AI require explicit human review and approval before execution.

## 9. Folder Ownership
- `client/`: Owned by the Frontend Engineering Team.
- `server/`: Owned by the Backend & Data Engineering Team.
- `docs/`: Shared responsibility. Technical Writing, Engineering Management, and all contributors.

## 10. Git Workflow
- **Branching Strategy**: Use explicit feature branching (e.g., `feature/xyz`, `fix/abc`, `chore/docs`).
- **Pull Requests**: Code must never be pushed directly to `main`. PRs require passing CI checks (once implemented) and human review.
- **History Management**: Rebase and squash commits prior to merging to maintain a clean, linear, and comprehensible Git history.

## 11. Coding Standards
- **Language**: Modern ES6+ JavaScript.
- **Linting**: Strict ESLint adherence. No bypassing rules without explicit, documented rationale.
- **Naming**: Clarity over brevity. Meaningful variable names are mandatory.
- **Modularity**: Functions must adhere to the Single Responsibility Principle.

## 12. Documentation Standards
- **Markdown is the Source of Truth**: All non-code architectural decisions live in Markdown.
- **Self-Documenting Code**: Write code that explains *what* it does. Use comments only to explain *why* it was done that way (the business or technical context).
- **Automation**: API specifications and Database Schemas should be auto-generated from code to prevent documentation drift.

## 13. Testing Standards
- **No Code Without Verification**: Logic deployed without a test is considered broken.
- **Unit Testing**: Required for all pure functions and data transformations.
- **Integration Testing**: The core intelligence pipeline must be validated against standardized `golden-repos` to ensure regression safety.

## 14. Definition of Done (DoD)
A task is considered "Done" only when:
1. The code is written and passes all local linting and tests.
2. The UI matches established Figma/aesthetic guidelines.
3. The Pull Request is reviewed by at least one peer.
4. All relevant documentation (API specs, architecture guides) is updated to reflect the change.

## 15. Decision Making Process
- **Default to Openness**: Engineering discussions happen in public channels, not private direct messages.
- **Consensus vs. Hierarchy**: Aim for consensus, but empower designated Tech Leads to break ties rapidly to maintain velocity.
- **Formalized Changes**: Significant architectural shifts require a formalized Architecture Decision Record (ADR).

## 16. Architecture Decision Records (ADRs)
- ADRs are immutable records of historical engineering decisions.
- They will be stored sequentially (e.g., `001-use-lancedb-for-vectors.md`).
- Every ADR must detail the context, the options considered, the decision made, and the consequences of that decision.

## 17. Current Engineering Phase
**Phase: Stabilization Sprint 0-1**
The immediate focus is purely on decoupling existing monolithic god-objects, establishing robust abstractions, generating documentation, and preparing the repository for horizontal scaling and multi-developer concurrency. No new product features are to be developed until stabilization is complete.

## 18. Future Expansion Philosophy
- **Build for Horizontal Scale**: Assume every module will eventually run on a distributed cluster.
- **Pluggable Intelligence**: The architecture should allow swapping underlying Large Language Models seamlessly without rewriting the context orchestrator.
- **Language Agnostic Vision**: While currently optimized for JavaScript/TypeScript targets via Babel, the parser layer must remain modular enough to accept standard LSP (Language Server Protocol) inputs in the future.
