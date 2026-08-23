# Contributing Guide

Welcome to the CodeScope repository! We appreciate your interest in contributing. Please adhere to the rules laid out in our [Engineering Charter](docs/00_Foundation/EngineeringCharter.md).

## Branch Naming
- `feature/<issue-id>-<short-description>`
- `bugfix/<issue-id>-<short-description>`
- `chore/<short-description>`
- `docs/<short-description>`
- `refactor/<short-description>`

## Commit Naming
Use Conventional Commits. Format: `<type>(<scope>): <subject>`
Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

## Review Checklist
- Check against the Architecture Decision Records (ADRs).
- Ensure no main thread blocking in backend code.
- Ensure all automated tests pass.

## Definition of Done
1. Code passes all local linting and testing.
2. Code review approved by a human peer.
3. Relevant documentation (API specs, Architecture guides) is updated.
4. Conforms to UI design tokens and CSS guidelines.

## Coding Standards
Detailed coding standards are established in the [Engineering Charter](docs/00_Foundation/EngineeringCharter.md).

## AI Workflow
AI agents must be heavily scoped. Provide strict context. Do not let AI modify architecture god-files without explicit human approval. Always read docs/AI_CONTEXT.md first.
