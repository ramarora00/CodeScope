# Release Strategy

We follow Semantic Versioning (SemVer) with distinct phase rollouts tied to our internal Milestones.

## v0.1 Alpha (Engineering Foundation)
- **Goal**: Core architecture validation.
- **Features**: Basic AST parsing, primitive call graph, structural codebase cleanup. Internal testing only.

## v0.2 Beta (Frontend Observatory)
- **Goal**: Stability and visualization accuracy.
- **Features**: ReactFlow and ForceGraph rendering stable, Zustand state implemented, UI polished. Released to early adopters.

## v0.5 RC (Backend Intelligence)
- **Goal**: Hardening and Integration.
- **Features**: Complete decoupling of Express services, LanceDB semantic vectors fully integrated, LLM orchestration working seamlessly. Feature freeze.

## v1.0 Placement Release
- **Goal**: Production readiness for multi-agent and human developer usage.
- **Features**: CI/CD pipelines active, complete documentation suite, stable APIs, zero known critical bugs. Open-source or public launch.
