# Frontend Architecture Specification

**Role:** Principal Frontend Architect
**Phase:** Engineering Sprint 1.4
**Purpose:** This document defines the definitive blueprint for the frontend architecture. It dictates how the React Application will be structured, how state will flow, and how the UI will scale. It contains zero implementation code, serving purely as an architectural standard.

---

## 1. Information Architecture
The application is bifurcated into two primary contexts:
- **Global Context (Workspace Layer)**: Handles repository management, global settings, and platform health.
- **Repository Context (Intelligence Layer)**: Dedicated to a single codebase. Houses the AI Chat, Dependency Graphs, File Exploration, and Blast Radius analysis.

## 2. Navigation Structure
- **Persistent Sidebar**: For global, cross-context navigation (e.g., Home, Repositories, Documentation, Settings).
- **Contextual TopBar**: Contains context-aware tools (e.g., Breadcrumbs, Global Semantic Search, Active Repository Status, Re-index triggers).
- **In-Page Tab Systems**: Used within the Intelligence Dashboard to switch between analytical modes (Chat vs. Graph vs. Code View) without losing state.

## 3. Screen Hierarchy
- `/` (Root Layout) -> Workspace Dashboard (List of Repos)
- `/repo/:id` (Repository Layout)
  - `/repo/:id/intelligence` -> AI Chat & Context Orchestration
  - `/repo/:id/architecture` -> Force-Directed Graph Visualizations
  - `/repo/:id/explorer` -> File Tree and Code Viewer
  - `/repo/:id/impact` -> Blast Radius Analysis

## 4. Feature Modules
The application will be built using a **Feature-Sliced Design**. Modules are grouped by business domain rather than technical type:
- **`intelligence/`**: AI chat, prompt context builder, streaming response handlers.
- **`visualization/`**: ReactFlow and React-Force-Graph wrappers, node/edge transformers.
- **`filesystem/`**: Recursive tree views, syntax-highlighted code blocks.
- **`workspace/`**: Repo ingestion, status polling, repository cards.

## 5. Component Hierarchy
Every view must adhere to a strict 4-tier hierarchy:
1. **Page**: Matches a Router path. Orchestrates layouts. (e.g., `ArchitecturePage`).
2. **Feature Container**: Binds global state and API data to the presentation layer. (e.g., `DependencyGraphContainer`).
3. **Presentation Component**: Pure, dumb components that receive data via props and emit events. (e.g., `GraphCanvas`).
4. **Shared Component**: Reusable atomic UI elements (e.g., `Button`, `Tooltip`).

## 6. Layout System
- **Macro Layout**: CSS Grid will be used for the overarching application shell to lock the Sidebar and Topbar while allowing the Main content area to scroll independently.
- **Micro Layout**: Flexbox will dictate 1-dimensional alignment within components (e.g., toolbars, lists, form controls).
- **Containers**: The main working area will use highly responsive fluid containers (`w-full h-full`) to maximize screen real estate for complex graphing logic.

## 7. Shared Component Library
To eradicate UI duplication, a centralized `components/ui/` folder will act as an internal design system. It will contain strictly typed, Tailwind-styled base elements:
- `Button`, `Input`, `Select`, `Modal`, `Toast`, `Tooltip`, `Badge`, `Skeleton`, `Tabs`.
*No feature-specific logic may exist within these components.*

## 8. State Management Strategy (Zustand)
Complex prop-drilling (beyond 2 levels) is strictly prohibited.
Global state will be managed via **Zustand** stores, partitioned by domain:
- `useRepoStore`: Tracks the currently selected repository and its indexing status.
- `useGraphStore`: Manages active graph nodes, selected edges, zoom levels, and layout algorithms.
- `useUIStore`: Manages transient UI state (sidebar collapse, active theme, global modal triggers).

## 9. API Layer Architecture
Data fetching will be entirely decoupled from UI components.
- **API Client**: A centralized Axios instance inside `src/api/` will handle interceptors, authentication (if added), and global 500 error catches.
- **Data Caching**: **TanStack Query (React Query)** will be utilized for all server-state. It will handle caching, refetching, and pagination.
- **Custom Hooks**: Components will only interact with APIs via hooks (e.g., `useFetchDependencyGraph(repoId)`).

## 10. Folder Structure
```text
client/src/
├── api/             # Axios client and interceptors
├── assets/          # Static SVGs, images, fonts
├── components/      # Shared UI library (Atoms, Molecules)
├── features/        # Domain-driven feature modules (intelligence, visualization)
├── hooks/           # Reusable custom React hooks
├── layouts/         # Page layout wrappers (RootLayout, RepoLayout)
├── pages/           # Route-level components
├── store/           # Zustand global state slices
├── styles/          # Tailwind entry point and global CSS
└── utils/           # Pure functions, formatters, graph transformers
```

## 11. Theme Architecture
- **Dark-Mode First**: The primary aesthetic will be deep dark themes suitable for developers.
- **Glassmorphism**: Subtle translucent backgrounds (`backdrop-blur`) will be used for floating elements (TopBar, Modals, Tooltips) to provide depth over complex graphs.
- **CSS Variables**: Core colors will be defined as CSS custom properties mapped to Tailwind configurations, allowing dynamic theme swapping without rewriting utility classes.

## 12. Animation Architecture
- **Micro-Interactions**: Tailwind's `transition-*` utilities will handle hover, focus, and active states for instantaneous feedback.
- **Structural Animations**: **Framer Motion** will be used for complex state transitions, such as modal mounts, layout shifts during sidebar toggles, and staggering list items during data loads.
- **Graph Animations**: Managed natively by `react-force-graph-2d` engines.

## 13. Data Flow
**Unidirectional Strict Data Flow**:
1. User action triggers an event in a Presentation Component.
2. The event invokes a TanStack Query mutation or a Zustand action.
3. The API Layer communicates with the Backend.
4. The React Query cache is invalidated/updated.
5. The Feature Container automatically re-renders with fresh data.
6. The Presentation Component updates the UI.

## 14. Error & Loading UX
- **Loading UX**: Spinners are banned for structural data. **Skeleton loaders** will mimic the final layout while data is fetching to prevent layout shifts.
- **Progressive Loading**: Massive graph payloads will display an intermediate "Computing topology..." state.
- **Error Boundaries**: A global React Error Boundary will catch rendering crashes, displaying a clean "Something went wrong" screen rather than a blank white page.
- **API Errors**: Will be surfaced via a centralized Toast notification system.

## 15. Design Tokens
The Tailwind configuration will override default palettes to enforce a premium look:
- `primary`: Vibrant accent (e.g., Electric Blue or Indigo) for primary actions.
- `surface`: Deep dark grays (e.g., `zinc-900`, `zinc-950`) for backgrounds.
- `border-glass`: Semi-transparent white (`rgba(255,255,255,0.1)`) for subtle depth.
- `spacing`: Strictly adhered to a 4px baseline system (`p-2`, `p-4`, `p-6`).
