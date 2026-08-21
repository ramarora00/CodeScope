# CodeScope Presentation Contracts

This document is the **single source of truth** for all visual components. It defines the strict boundary between the Domain/State layer and the Visual layer.

## The Law of Presentation
**No visual component may import Zustand.**
Every piece of data must flow into visual components as standard React props, derived exclusively by `useWorkspacePresentationModel`.

---

## 1. `UniversalCodeViewer` (and `AIOverlayEditor`)

**Owner:** `PresentationModel`

**Purpose:** Renders syntax-highlighted code and handles scrolling/animations.

**INPUTS (Props):**
- `file` (string): Absolute or relative path of the file to display.
- `content` (string): The actual code to render.
- `attention` (object):
  - `line` (number): 1-indexed line to focus.
  - `type` ('read' | 'appear' | 'jump'): The animation intent.
  - `reason` (string): Contextual reason for focus.
- `runtimeStatus` ('idle' | 'reading' | 'resolved'): Drives overall UI state (opacity, pulse).

**OUTPUTS (Allowed Callbacks):**
- `onAnimationComplete()`: Signals to the PlaybackQueue that the UI is ready for the next event.
- `onUserScroll()`: Signals that the user has manually interacted with the scrollbar.

**MUST NEVER (Forbidden):**
- Import `useInvestigationSession` or `useWorkspaceStore`.
- Automatically pull the next event.
- Call `setState()`, `dispatch()`, or `fetch()`.

---

## 2. `InvestigationPanel` (Timeline)

**Owner:** `PresentationModel`

**Purpose:** Displays the chronological log of AI actions.

**INPUTS (Props):**
- `events` (Array):
  ```json
  [{ "id": 1, "type": "file.selected", "title": "Selected File", "description": "...", "status": "done|active", "time": "..." }]
  ```
- `planSteps` (Array): Current mission breakdown.
- `aiPhase` ('searching' | 'understanding' | 'connecting' | 'concluding'): Drives timeline coloring.

**OUTPUTS (Allowed Callbacks):**
- `onEventClick(eventId)`: Requests a history traversal.

**MUST NEVER (Forbidden):**
- Import Zustand.
- Try to parse raw backend domain events (e.g., handling `evidence.added` directly).
- Call `setState()`, `dispatch()`, or `fetch()`.

---

## 3. `KnowledgePanel`

**Owner:** `PresentationModel`

**Purpose:** Displays accumulated facts and symbols.

**INPUTS (Props):**
- `findings` (Array):
  ```json
  [{ "name": "App.js", "filePath": "src/App.js", "active": true, "text": "Handles routing." }]
  ```
- `relatedSymbols` (Array):
  ```json
  [{ "symbol": "authService", "file": "services/auth.js", "line": 15 }]
  ```
- `activeTabId` (string): Drives which findings are currently visible.

**OUTPUTS (Allowed Callbacks):**
- `onSymbolClick(symbol)`: Requests navigation to a symbol.

**MUST NEVER (Forbidden):**
- Import Zustand.
- Wipe its own data based on external lifecycle triggers.
- Know about lifecycle events.
- Call `setState()`, `dispatch()`, or `fetch()`.

---

## 4. `ArchitecturePerspective` (Graph)

**Owner:** `PresentationModel`

**Purpose:** Renders the repository dependency graph via ReactFlow.

**INPUTS (Props):**
- `nodes` (Array): Standard ReactFlow nodes.
- `edges` (Array): Standard ReactFlow edges.
- `activeNodeId` (string): Highlights the current node the AI or User is looking at.

**OUTPUTS (Allowed Callbacks):**
- `onNodeClick(nodeId)`: Requests a file opening.

**MUST NEVER (Forbidden):**
- Hold graph state indefinitely in memory after unmount.
- Read `repositoryContext` store directly.
- Call `setState()`, `dispatch()`, or `fetch()`.

---

## 5. `ExplorerPerspective`

**Owner:** `PresentationModel`

**Purpose:** Traditional file tree.

**INPUTS (Props):**
- `fileTree` (Array): Nested directory structure.
- `activeFileId` (string): The currently focused file.

**OUTPUTS (Allowed Callbacks):**
- `onFileClick(filePath)`: Dispatches action to set `userSelectedFile`.
- `onFolderExpand(folderPath)`: Expands a folder in UI.
- `onFolderCollapse(folderPath)`: Collapses a folder in UI.

**MUST NEVER (Forbidden):**
- Dispatch to `aiFocusFile`.
- Modify `aiFocusFile`.
- Call `setState()`, `dispatch()`, or `fetch()`.

---

## 6. `InvestigationReportSheet`

**Owner:** `PresentationModel`

**Purpose:** The final output and error recovery view.

**INPUTS (Props):**
- `answer` (string): Final markdown response.
- `error` (string | null): Any fatal error message.
- `status` ('resolved' | 'error' | 'idle'): Drives visibility.

**OUTPUTS (Allowed Callbacks):**
- `onRetry()`: Dispatches request to clear error and restart.
- `onAccept()`: Dispatches request to clear investigation context.

**MUST NEVER (Forbidden):**
- Import Zustand to check `SESSION_STATES`.
- Call `setState()`, `dispatch()`, or `fetch()`.
