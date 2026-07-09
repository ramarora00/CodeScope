# Project Glossary

This document serves as the permanent single source of truth for all domain terminology within the AI-Developer Copilot repository. To prevent terminology drift and architectural confusion, all components, documentation, and discussions must strictly adhere to these definitions.

## Core Nomenclature

| Term | Meaning |
| :--- | :--- |
| **Observatory** | The right-side AI workspace. This encompasses the entire sidebar dedicated to AI reasoning, prompts, and contextual insights. |
| **Analysis** | An AI reasoning session. This is a first-class entity representing a user's deep-dive trace into a specific bug or feature, saving context and execution paths. |
| **CodeScope Home** | The main dashboard. This is the high-level entry view for a repository, providing health, scale, and primary domain information. |
| **Analysis Workspace** | The overarching container layout or specific area encompassing both the `MainViewport` and the `InspectorViewport` where an active Analysis runs. |
| **Inspector** | The right-side viewport container. It currently houses the `ObservatoryShell` but is technically agnostic layout padding. |
| **Context Rail** | The supporting context panel inside the Observatory, displaying active files, symbols, and graphs currently fed into the AI's prompt window. |
| **Analysis Thread** | Previously "Investigation Tab". Represents an ongoing reasoning thread within the Analysis Workspace. |
| **History** | Previously "Archive Tray". Stores past analyses for future retrieval. |
| **Shell / AppShell** | The outermost root layout component that dictates the permanent spatial structure of the application (e.g., `<main>`, `<aside>`). |
| **Viewport** | A primary semantic region of the screen (e.g., `MainViewport`, `InspectorViewport`, `InvestigationViewport`). Viewports are structural containers for Features. |
| **Feature** | A domain-specific bounded context (e.g., `investigation`, `observatory`, `repository-graph`) adhering to Feature-Sliced Design. Features own their UI, logic, and models. |
| **Widget** | A highly reusable, complex UI component that combines multiple smaller primitives but does not own domain business logic (e.g., `FileExplorer`, `KnowledgeGraph`). |

## Refactoring Mandate

Whenever a refactor, deletion, replacement, or move is proposed, the following questions must be explicitly answered in the PR or Plan:
1. **Why is this necessary?**
2. **What runtime owner changes?**
3. **What becomes deletable?**
4. **What improves?**

No blind refactors are permitted.
