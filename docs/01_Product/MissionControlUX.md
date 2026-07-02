# Mission Control: Frontend Product Specification
**Phase:** 2
**Objective:** Define the comprehensive UX/Product blueprint for the AI-Developer Copilot frontend interface. 

This document serves as the absolute source of truth for the product requirements, user experience flows, and visual design language. It is independent of technical React implementation.

---

## 1. Product Layout
The application utilizes a **Four-Pane "Mission Control" Layout**:
- **Left Sidebar (Navigation)**: Collapsible. Contains Global Navigation (Home, Settings) and Contextual Repository Navigation (Architecture, File Explorer, Impact Analysis).
- **Top Bar (Command & Status)**: Fixed at the top. Contains Breadcrumbs, the Global Command Palette (Cmd+K), and Real-time Background Ingestion Status indicators.
- **Main Stage (The Canvas)**: The expansive central area dedicated to data visualization. For graphs, this occupies 100% of available height/width with fluid dragging.
- **Right Panel (Inspector & AI)**: Collapsible/Overlay. Houses the Context Inspector (showing details of a selected graph node) and the AI Observatory (the chat interface).

## 2. Information Architecture
The product distinguishes heavily between the Workspace (Global) and the Project (Contextual).
- **Workspace Level**: Repository Dashboard -> Repository Upload -> Global Settings.
- **Project Level**: Active Repository -> [Architecture Graph | Execution Trace | Impact Analysis | File Tree] <-> AI Observatory.

## 3. Screen Specifications
- **Workspace Dashboard**: A grid of visually distinct "Repository Cards." Cards display repository health, last indexed time, and a mini-sparkline of code size.
- **Architecture Graph Screen**: A full-bleed canvas rendering the entire repository dependency tree. No pagination; fully zoomable.
- **Execution Explorer Screen**: A split view showing a sequential flowchart on the left and the corresponding raw code viewer on the right.
- **Impact Explorer (Blast Radius) Screen**: A specialized view of the Architecture Graph where the user selects a "Target Node" and the screen isolates and highlights all downstream dependents.

## 4. Widget Specifications
- **Command Palette (Omnibar)**: Activated via keyboard shortcut. Allows instant jumping to specific files, functions, or initiating semantic searches.
- **Node Inspector Widget**: Appears in the Right Panel when a graph node is clicked. Displays exact file path, LOC, cyclomatic complexity, incoming/outgoing edge counts, and a "Summarize via AI" button.
- **Ingestion Toast**: A persistent, unobtrusive bottom-left progress bar indicating the status of the 5-pass backend AST pipeline.

## 5. User Journey
**Primary Flow: "Understanding a Change"**
1. User uploads a repository.
2. User waits for the Ingestion Toast to complete.
3. User navigates to the Impact Explorer.
4. User searches for `AuthMiddleware` via the Command Palette.
5. The graph zooms to `AuthMiddleware`. User clicks it.
6. The graph dims all unrelated nodes and highlights all downstream routes dependent on `AuthMiddleware` in a warning color (red/orange).
7. User opens the Right Panel (AI Observatory) and types: *"What happens if I change the JWT signature in this selected node?"*
8. The AI streams a response utilizing the highlighted graph context.

## 6. Interaction Design
- **Hover**: Hovering over a graph node temporarily highlights its immediate neighbors.
- **Click**: Clicking a node "locks" focus, updating the URL for deep-linking, opening the Node Inspector, and fading out non-neighboring nodes.
- **Double Click**: Double-clicking a node immediately opens the raw File Viewer for that node's source code.
- **Drag & Scroll**: The Main Stage is an infinite canvas. Click-and-drag to pan; mouse-wheel to zoom.

## 7. Graph Experience
- **Physics**: Nodes behave using D3-style force-directed physics. They repel each other but are bound by their dependency edges.
- **Clustering**: Nodes are automatically clustered and color-coded based on their parent directory (e.g., all `/utils` are blue, all `/routes` are green).
- **Edge Direction**: Edges are curved arrows clearly indicating the direction of the dependency (Caller -> Callee).

## 8. AI Observatory Experience
The AI Observatory is not just a chatbox; it is deeply integrated into the UX state.
- **Context Awareness**: The chat input box constantly displays what "Context" is currently loaded (e.g., "Context: 3 selected nodes, 1 file").
- **Interactive Responses**: When the AI responds with a file name or function, it renders as a clickable pill. Clicking the pill automatically pans the Main Stage graph to that node.

## 9. Execution Explorer
Designed to trace linear execution (e.g., an API request lifecycle).
- UX represents a vertical timeline or sequential flow chart.
- Instead of a tangled web (like the Architecture Graph), this explicitly maps Middleware 1 -> Middleware 2 -> Controller -> DB Model.

## 10. Impact Explorer
Designed for risk assessment.
- **Visual Cue**: Upon selecting a node, the blast radius is visually depicted as a spreading shockwave or expanding highlighted rings to denote immediate vs. transitive dependencies.

## 11. Responsive Behaviour
- **Desktop First**: The UI is intensely optimized for large monitors.
- **Tablet/Small Screens**: The Left Sidebar collapses to icons only. The Right Panel transitions from a side-by-side layout to a bottom-sheet overlay. The Main Stage remains fluid.

## 12. Motion System
- **Transitions**: Smooth, 200ms ease-in-out transitions for opening/closing sidebars to maintain spatial awareness.
- **Graph Morphing**: When switching from Architecture Graph to Impact Explorer, nodes animate fluidly to their new positions rather than jarringly re-rendering.

## 13. Design Language
- **Aesthetic**: "Premium Tech-Noir". Inspired by Apple Vision Pro and Linear. Core palette: Space Black, Graphite, Gunmetal, Silver, White, Ice Blue, and Muted Indigo. Soft Teal for active states. No saturated neon. No flashy red/orange except for critical warnings.
- **Surfaces**: Extensive use of glassmorphism (translucency + background blur) for panels overlapping the Main Stage to maintain the illusion of depth and infinite canvas space.
- **Typography**: Clean, sans-serif fonts (e.g., Inter or Roboto) for UI elements, paired with a legible monospaced font (e.g., Fira Code, JetBrains Mono) for code snippets and node labels.

## 14. Accessibility
- **Keyboard Navigation**: The Command Palette must be fully keyboard accessible. Users should be able to tab through selected graph nodes.
- **Contrast**: Text contrast ratios must meet WCAG AA standards, even within the dark theme.
- **Screen Readers**: Aria-labels on all icon-only buttons (especially in the collapsed sidebar). The graph canvas must emit screen-reader announcements when a node is focused.

## 15. Future Expansion
- **Multi-Player UX**: The layout is designed to eventually support real-time presence (cursor tracking) for collaborative codebase reviews.
- **Multi-Repo Queries**: Future iterations will allow the Main Stage to render cross-repository boundaries (e.g., Microservice A calling Microservice B), meaning the UI tokens for clustering must scale to accommodate repo-level grouping.
