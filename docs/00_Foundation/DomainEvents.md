# CodeScope Domain Events (Runtime Contract)

This document is the **single source of truth** for all Server-Sent Events (SSE) passing from the Backend (`ExecutionEngine` / `SSETransport`) to the Frontend (`useInvestigationSession` / `usePlaybackController`).

**Rule:** Any change to a payload or event name here is a breaking change and requires updating both sides of the boundary simultaneously.

---

## 1. Transport Lifecycle Events

### `transport.connected`
*Fired immediately when the SSE stream opens to assign a session ID.*
- **Owner:** `SSETransport`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** No
- **Blocking:** No
- **Payload:**
  ```json
  {
    "type": "transport.connected",
    "sessionId": "uuid",
    "timestamp": "ISO8601"
  }
  ```

---

## 2. Planning Phase Events

### `planner.started`
*Fired when the planner begins thinking about a mission.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** No
- **Blocking:** No
- **Payload:**
  ```json
  {
    "type": "planner.started",
    "mission": "string (e.g., 'Repository Understanding')",
    "timestamp": "ISO8601"
  }
  ```

### `planner.completed`
*Fired when the planner returns an execution plan.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** No
- **Blocking:** No
- **Payload:**
  ```json
  {
    "type": "planner.completed",
    "plan": {
      "hypothesis": "string",
      "confidence": "number (0-1)",
      "executionSteps": [
        { "action": "string", "target": { "file": "string", "name": "string" } }
      ]
    },
    "timestamp": "ISO8601"
  }
  ```

### `planner.failed`
*Fired if the LLM crashes during the planning phase.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** No
- **Blocking:** No
- **Payload:**
  ```json
  {
    "type": "planner.failed",
    "reason": "string (error message)",
    "timestamp": "ISO8601"
  }
  ```

---

## 3. Investigation Phase Events

### `investigation.started`
*Fired when the execution of the plan begins.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** No
- **Blocking:** No
- **Payload:**
  ```json
  {
    "type": "investigation.started",
    "budget": "number (total steps allowed)",
    "timestamp": "ISO8601"
  }
  ```

### `file.selected`
*Fired when the AI decides to open a file.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession` (Updates `aiFocusFile`)
- **Playback Required:** Yes
- **Blocking:** Yes
- **Payload:**
  ```json
  {
    "type": "file.selected",
    "file": "string (path)",
    "reason": "string",
    "timestamp": "ISO8601"
  }
  ```

### `file.read.progress`
*Fired sequentially as the AI reads through a file.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** Yes
- **Blocking:** Yes
- **Payload:**
  ```json
  {
    "type": "file.read.progress",
    "file": "string (path)",
    "line": "number (1-indexed)",
    "totalLines": "number",
    "timestamp": "ISO8601"
  }
  ```

### `file.read.completed`
*Fired when the AI finishes reading a file.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** Yes
- **Blocking:** Yes
- **Payload:**
  ```json
  {
    "type": "file.read.completed",
    "file": "string (path)",
    "timestamp": "ISO8601"
  }
  ```

### `jump.started`
*Fired when the AI uses 'go_to_definition' or similar.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** Yes
- **Blocking:** Yes
- **Payload:**
  ```json
  {
    "type": "jump.started",
    "source": "string (path)",
    "target": "string (symbol/path)",
    "reason": "string",
    "timestamp": "ISO8601"
  }
  ```

### `evidence.added`
*Fired when the AI records a factual finding.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** No
- **Blocking:** No
- **Payload:**
  ```json
  {
    "type": "evidence.added",
    "fact": "string",
    "source": { "file": "string", "line": "number" },
    "eventId": "uuid",
    "timestamp": "ISO8601"
  }
  ```

### `symbol.discovered`
*Fired when the AI discovers a new architectural node.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** No
- **Blocking:** No
- **Payload:**
  ```json
  {
    "type": "symbol.discovered",
    "symbol": "string",
    "file": "string",
    "timestamp": "ISO8601"
  }
  ```

---

## 4. Completion Events

### `investigation.completed`
*Fired when the AI explicitly concludes the investigation.*
- **Owner:** `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** No
- **Blocking:** No
- **Payload:**
  ```json
  {
    "type": "investigation.completed",
    "answer": "string (markdown)",
    "timestamp": "ISO8601"
  }
  ```

### `investigation.cancelled`
*Fired if the user aborts.*
- **Owner:** `Server/API`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** No
- **Blocking:** No
- **Payload:**
  ```json
  {
    "type": "investigation.cancelled",
    "timestamp": "ISO8601"
  }
  ```

### `investigation.error`
*Fired on LLM timeout or fatal backend crash.*
- **Owner:** `ClaudeRuntime` / `ExecutionEngine`
- **Consumer:** `useInvestigationSession`
- **Playback Required:** No
- **Blocking:** No
- **Payload:**
  ```json
  {
    "type": "investigation.error",
    "reason": "string (e.g., 'API Timeout')",
    "timestamp": "ISO8601"
  }
  ```
