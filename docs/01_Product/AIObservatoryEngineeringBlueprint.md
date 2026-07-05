# AI Observatory Engineering Blueprint
### Construction-Level Specification — Objects, Composition, Dependencies, Contracts

This document takes the **AI Observatory Experience Bible** (what, and why) and the review feedback that followed it, and produces the **build-ready decomposition** (how it's composed). No code, no components, no folder structure — this is the same abstraction level as the Mission Control Construction Blueprint, applied to the Observatory.

The Bible is not revised. This document extends it — every new object below is additive to, not a replacement of, the Bible's vision.

---

## 1. Feedback Integration Map

Each review item is resolved as a **new or extended Object**, not a new screen. This keeps the Observatory a single coherent panel rather than fragmenting into sub-features.

| Review Item | Resolution | Object(s) Introduced |
|---|---|---|
| 1. Session Workspace | Conversation becomes multi-threaded, tabbed by investigation | `WorkspaceTabBar`, `InvestigationTab` |
| 2. Investigation Mode | Reasoning Timeline promoted from a transient loading state to a persistent, inspectable record | `InvestigationTimeline` (supersedes "Reasoning Timeline" naming), `InvestigationStep` |
| 3. Parallel AI | Reasoning exposed as concurrent tracks that merge, not a single linear thread | `ParallelAgentTracks`, `AgentTrack`, `MergeIndicator` |
| 4. AI Memory Timeline | Memory Panel restructured as a chronological, git-log-like ledger | `MemoryTimeline`, `MemoryEntry` |
| 5. Action Execution | Suggested Actions extended from proposals to operable, tracked executions | `ExecutionQueue`, `ExecutionCard` |
| 6. Context Sources | New always-available inspector exposing exactly what's in scope | `ContextSourcesInspector`, `ContextSourceNode` |
| 7. Confidence as bars | `ConfidenceMeter` redefined as a three-tier stacked bar, not a percentage | `ConfidenceStack` (replaces prior `ConfidenceMeter` primitive) |
| 8. Repository Health (cockpit) | New peripheral strip showing subsystem readiness during reasoning | `SystemReadinessStrip`, `ReadinessIndicator` |

**Governing constraint carried forward from the Bible's closing principle:** every one of these is a new *subtype or extension* of an existing object category (timeline, panel, chip, strip) — none introduces a new interaction paradigm.

---

## 2. Root Composition

```
AIObservatoryPanel
 ├── ObservatoryHeader
 │    ├── RepositoryContextIndicator
 │    ├── SystemReadinessStrip
 │    ├── MemoryTimelineTrigger
 │    ├── TokenUsageIndicator
 │    └── DockingControl
 ├── WorkspaceTabBar
 │    └── InvestigationTab (×N)
 ├── ActiveInvestigationView            (contents of the selected tab)
 │    ├── ConversationHistoryRail
 │    ├── ContextSourcesInspector
 │    ├── InvestigationTimeline
 │    │    ├── ParallelAgentTracks
 │    │    │    ├── AgentTrack (×N)
 │    │    │    └── MergeIndicator
 │    │    └── InvestigationStep (×N, sequential fallback when not parallelized)
 │    ├── AnswerBlock
 │    │    ├── CitationChip
 │    │    ├── LiveObjectChip
 │    │    └── ConfidenceStack
 │    ├── EvidencePanel
 │    │    └── EvidenceCard (×N)
 │    └── ExecutionQueue
 │         └── ExecutionCard (×N)
 └── PromptComposer
      └── EntityResolutionChip (×N, transient, formed while typing)

AttentionOverlay        — not a child of the panel; drawn onto the host canvas during InvestigationTimeline activity
```

---

## 3. Object Specifications

Each object below is specified as: **Purpose → Composed Of → Depends On → Reused By → States → Interaction Contract.**

### 3.1 WorkspaceTabBar

**Purpose:** Hold multiple concurrent investigations (e.g., "Investigate Login," "Investigate Payments") as separate, switchable threads instead of forcing one endless conversation.

**Composed of:** `InvestigationTab` (×N), a persistent `+ New Investigation` affordance.

**Depends on:** Nothing external — pure UI state (list of tab metadata: id, title, status).

**Reused by:** Observatory only. Not a cross-screen shared object, but its underlying `TabStrip` interaction pattern (select/close/reorder) is the same primitive-level pattern as any tabbed surface elsewhere in the product, should one exist.

**States:** `empty` (single default untitled tab), `active-tab-streaming` (tab shows a subtle activity indicator while its investigation reasons, even if not focused), `tab-has-unread-answer` (a completed answer arrived in a background tab), `tab-limit-reached` (soft cap reached — oldest idle tab prompted for archive, never silently dropped).

**Interaction contract:** Receives a list of investigations (id, title, status, lastActivity) and the current active id. Emits: select(id), create(), close(id), reorder(id, position), rename(id, title). Title auto-derives from the first question asked in that tab unless renamed.

---

### 3.2 InvestigationTab

**Purpose:** The addressable unit of one line of inquiry — its own conversation history, evidence, and context scope, isolated from sibling tabs.

**Composed of:** Nothing directly rendered — it's a data/state container; its contents render via `ActiveInvestigationView` when selected.

**Depends on:** `ContextSourcesInspector` scope, `ConversationHistoryRail` contents.

**Reused by:** Observatory only.

**States:** `idle`, `investigating`, `answered`, `stale` (no activity for an extended period — visually recedes in the tab bar but is never auto-closed).

**Interaction contract:** Exposes its own scope object (repository, branch, selection) independent of other tabs — switching tabs fully swaps `ContextSourcesInspector` contents, never blends scope across tabs.

---

### 3.3 InvestigationTimeline (supersedes "Reasoning Timeline")

**Purpose:** Promote the act of investigating into a first-class, persistent, re-inspectable record — not a transient spinner-equivalent that disappears once answered.

**Composed of:** `ParallelAgentTracks` (when reasoning is parallelized) or a sequential list of `InvestigationStep` (when it isn't — simple questions don't need concurrent tracks).

**Depends on:** Live reasoning-step events from the reasoning system (event stream: step started / step completed / step failed).

**Reused by:** Observatory only, but its collapse-to-receipt behavior is the same pattern as the Bible's original Reasoning Timeline — this is an extension, not a parallel invention.

**States:** `active` (expanded, narrating live), `collapsed-receipt` (compact summary strip after answering — click re-expands the full historical record, it is never discarded), `failed-step` (a specific step shows an inline failure without collapsing the whole timeline), `reopened-for-audit` (developer manually re-expands a past investigation from a stale tab to review what was checked).

**Interaction contract:** Receives an ordered/grouped list of steps with status per step. Emits: expand(), collapse(), inspectStep(stepId) → opens that step's underlying `EvidenceCard` if one exists.

---

### 3.4 ParallelAgentTracks

**Purpose:** Visually expose that reasoning is happening across multiple concurrent lines of investigation (e.g., repository structure, execution history, architecture) rather than implying a single serial thought process.

**Composed of:** `AgentTrack` (×N, one per concurrent line of investigation), `MergeIndicator` (the point where tracks converge into one answer).

**Depends on:** A reasoning system capable of reporting which named track a given step belongs to, and a merge event.

**Reused by:** Observatory only today; structurally this is the same "multiple concurrent processes converging to one output" pattern that could later apply to multi-repo reasoning (see Bible §10).

**States:** `tracks-running` (all active, independently progressing at their own pace), `track-completed-early` (a track finishes before others — recedes to a compact "done" state without blocking the rest), `track-failed` (one track errors — merge proceeds with the remaining tracks, and the answer notes the gap plainly), `merging` (brief, distinct visual state as tracks converge), `merged` (collapses into the single `InvestigationTimeline` receipt).

**Interaction contract:** Receives a list of tracks (label, steps, status). Emits: inspectTrack(trackId) to expand one track's detail independent of the others. Does not emit anything that affects the other tracks — tracks are read-only relative to each other, only the merge output is shared.

---

### 3.5 ContextSourcesInspector

**Purpose:** Make the Observatory's "prompt" fully transparent — exactly what repository, branch, files, selection, conversation history, memory, execution data, and graph scope are currently informing reasoning. An LLM-prompt inspector for power users.

**Composed of:** `ContextSourceNode` (×N), grouped by category (Repository / Selection / Conversation / Memory / Execution / Graph).

**Depends on:** The current `InvestigationTab`'s scope object; read-only, does not depend on reasoning state.

**Reused by:** Observatory only, though the "what's in scope" pattern echoes the Bible's original `Context Rail` — this object fully absorbs and replaces that rail's responsibility, at greater fidelity.

**States:** `collapsed` (default — a compact one-line scope summary), `expanded` (full tree, shown on demand, not by default, to avoid competing with the Answer for attention per the Bible's layout priorities), `source-stale` (a context source, e.g. a file, has changed since it was included — flagged inline, not hidden).

**Interaction contract:** Receives the scope tree. Emits: toggleExpand(), excludeSource(sourceId) (power-user control to manually narrow scope for a follow-up question), reincludeSource(sourceId).

---

### 3.6 MemoryTimeline (supersedes "Memory Panel")

**Purpose:** Present the AI's standing knowledge of the project as a chronological ledger — "yesterday: architecture decision," "last week: parser discussion" — rather than an undifferentiated memory dump.

**Composed of:** `MemoryEntry` (×N), grouped by relative time (Today / This Week / Earlier), each entry sourced back to the investigation or conversation it originated from.

**Depends on:** A persisted memory store (out of scope for this document — treated as a data source, per the "no data fetching" constraint carried from the Bible).

**Reused by:** Observatory only.

**States:** `empty` (no memory yet for this repository — stated plainly, not apologetically), `populated`, `entry-flagged-outdated` (a memory that may no longer be accurate given recent code changes — flagged, not silently trusted), `filtered` (developer has filtered by topic/type).

**Interaction contract:** Receives entries (timestamp, summary, source link, status). Emits: open(entryId) → navigates to the original investigation that produced it, forget(entryId) (explicit developer control to remove a memory), filter(criteria).

---

### 3.7 ExecutionQueue (supersedes "Suggested Actions" as the operable layer)

**Purpose:** Move the Observatory from advisor to operator — proposed actions (Create PR, Generate Fix, Refactor, Run Impact Analysis, Run Tests) can be queued and tracked to completion inline, not just suggested and abandoned.

**Composed of:** `ExecutionCard` (×N) — one per queued or completed action.

**Depends on:** The specific downstream system each action targets (Impact Analysis, Execution Explorer, a future PR/diff system) — this object only tracks and displays status; it does not itself perform the action's logic.

**Reused by:** Observatory only, but each `ExecutionCard`'s status pattern (queued → running → completed/failed) is the same state machine shape as any long-running action elsewhere in the product — a reusable *pattern*, not a shared component, at this stage.

**States:** `empty` (no actions queued — Suggested Actions row still offers proposals, just nothing committed yet), `queued`, `running` (with a visible, specific progress narration, not a generic spinner, consistent with product-wide loading rules), `completed`, `failed` (stated plainly with the specific reason, and a retry affordance), `requires-confirmation` (destructive actions, e.g. creating a PR, always pause here before `running` — never auto-execute).

**Interaction contract:** Receives a proposed-actions list from the current answer. Emits: queue(actionId), confirm(actionId), cancel(actionId), retry(actionId), viewResult(actionId) → navigates to the relevant screen (e.g., the created PR, the impact analysis result).

---

### 3.8 ConfidenceStack (supersedes "Confidence Meter")

**Purpose:** Communicate certainty honestly and specifically, as a composition of three qualities — Evidence, Inference, Speculation — rather than a single collapsed percentage.

**Composed of:** Three fixed, labeled bar segments (`EvidenceBar`, `InferenceBar`, `SpeculationBar`), proportion reflecting how much of the answer falls into each category.

**Depends on:** The reasoning system's ability to classify its own claims into these three tiers per answer.

**Reused by:** Attached to every `AnswerBlock`; not reused elsewhere in the product today, though the three-tier honesty pattern is a candidate for reuse anywhere else confidence is communicated in the future.

**States:** `high-evidence` (Evidence segment dominant), `mixed`, `speculative-dominant` (Speculation segment dominant — this state should visually invite scrutiny, not alarm, consistent with the calm-under-uncertainty emotional goal), `single-source` (a rare, explicit state when the entire answer rests on one piece of evidence — flagged distinctly since it merits more skepticism than "high-evidence" from multiple sources).

**Interaction contract:** Receives three proportions (0–1 each, summing to 1). Emits: hoverSegment(tier) → highlights which specific sentences/chips in the `AnswerBlock` fall into that tier (spotlight-and-dim applied to text, not just graph objects — a new but consistent application of the existing primitive).

---

### 3.9 SystemReadinessStrip

**Purpose:** Cockpit-style peripheral confirmation that every subsystem the AI depends on (index, embeddings, graph, execution data, memory) is ready — building trust in the answer before it even arrives.

**Composed of:** `ReadinessIndicator` (×5 fixed: Index / Embeddings / Graph / Execution / Memory).

**Depends on:** System-level status for each subsystem (read-only status feed).

**Reused by:** Observatory header only; conceptually related to, but distinct from, Mission Control's `HealthSignaturePanel` (that one is repository health; this one is AI-subsystem readiness) — deliberately not merged, since conflating "is the code healthy" with "is the AI ready" would confuse two different questions.

**States:** `all-ready` (quiet, recedes into peripheral vision — this is the default, expected state), `subsystem-degraded` (one indicator shows a specific issue, e.g. "Embeddings — rebuilding," answers proceed but the Observatory notes reduced confidence where relevant), `subsystem-unavailable` (a subsystem is fully down — the Observatory states which kinds of questions it can't currently answer well, rather than failing silently on those questions).

**Interaction contract:** Receives five status values. Emits: hover(subsystem) → tooltip with plain-language detail. Read-only otherwise; this strip has no user-driven actions, only status.

---

## 4. Full Object Hierarchy (Down to Primitives)

Objects marked **(shared)** already exist in the Design Primitives set established in the Mission Control Construction Blueprint and are reused here without modification.

```
AIObservatoryPanel
 ├── ObservatoryHeader
 │    ├── RepositoryContextIndicator → LabelText (shared), HealthGlyph (shared)
 │    ├── SystemReadinessStrip
 │    │    └── ReadinessIndicator → StatusDot (shared), LabelText (shared)
 │    ├── MemoryTimelineTrigger → ActionButton (shared)
 │    ├── TokenUsageIndicator → MetricSparkline (shared)
 │    └── DockingControl → ActionButton (shared) [×3: dock positions]
 │
 ├── WorkspaceTabBar
 │    └── InvestigationTab → LabelText (shared), StatusDot (shared), DismissControl (shared)
 │
 ├── ActiveInvestigationView
 │    ├── ConversationHistoryRail
 │    │    └── HistoryEntry (shared)
 │    │
 │    ├── ContextSourcesInspector
 │    │    └── ContextSourceNode → LabelText (shared), KindGlyph (shared), ToggleGroup (shared)
 │    │
 │    ├── InvestigationTimeline
 │    │    ├── ParallelAgentTracks
 │    │    │    ├── AgentTrack → SectionHeader (shared), InvestigationStep (below)
 │    │    │    └── MergeIndicator → TravelingHighlight (shared, converging variant)
 │    │    └── InvestigationStep → LabelText (shared), StatusDot (shared)
 │    │
 │    ├── AnswerBlock
 │    │    ├── StreamedText (shared)
 │    │    ├── CitationChip (shared)
 │    │    ├── LiveObjectChip (shared)
 │    │    └── ConfidenceStack
 │    │         └── EvidenceBar / InferenceBar / SpeculationBar → MetricRow (shared, segmented variant)
 │    │
 │    ├── EvidencePanel
 │    │    └── EvidenceCard → SectionHeader (shared), LabelText (shared), InlineNotice (shared)
 │    │
 │    └── ExecutionQueue
 │         └── ExecutionCard → LabelText (shared), StatusDot (shared), ActionButton (shared) ×2 [confirm/cancel]
 │
 └── PromptComposer
      └── EntityResolutionChip → LiveObjectChip (shared, transient variant)

MemoryTimeline (opened via MemoryTimelineTrigger, renders as an overlay, not nested in the tree above)
 └── MemoryEntry → Timestamp (shared), LabelText (shared), ActionButton (shared)

AttentionOverlay (host-canvas object, referenced not owned) → TravelingHighlight (shared)
```

### 4.1 New Primitives Introduced

Only two genuinely new primitives are required beyond the existing terminal set — everything else composes from what already exists:

- **`SegmentedBar`** — the underlying primitive for `ConfidenceStack`'s three fixed proportional segments. (`MetricRow` alone doesn't cover a fixed-proportion multi-segment bar; this is a distinct rendering primitive.)
- **`TrackLane`** — the underlying primitive for `AgentTrack`, a horizontally-progressing lane with its own step sequence, distinct from a single-column list.

This satisfies the "no more than 2 net-new primitives per screen without architectural review" rule set in the Mission Control blueprint.

---

## 5. Dependency Matrix

| Object | Depends On (data/events) | Depends On (other objects) |
|---|---|---|
| WorkspaceTabBar | Investigation list, activity status per tab | — |
| InvestigationTimeline | Reasoning step event stream | ParallelAgentTracks or InvestigationStep list |
| ParallelAgentTracks | Per-track step events, merge event | AgentTrack, MergeIndicator |
| ContextSourcesInspector | Active tab's scope object | ActiveInvestigationView (parent scope) |
| MemoryTimeline | Persisted memory store (external) | — |
| ExecutionQueue | Proposed actions from AnswerBlock, downstream system status | AnswerBlock (source of proposals), external systems (Impact Analysis, PR system) |
| ConfidenceStack | Answer's per-claim classification | AnswerBlock (parent) |
| SystemReadinessStrip | Subsystem status feed | — (fully independent, header-level) |
| AttentionOverlay | Active reasoning step's target object | Host canvas (Graph/Architecture/Execution screens) |

**Cross-screen dependency:** `AttentionOverlay` is the only object here that reaches outside the Observatory panel — it draws onto whichever graph screen is currently open behind it. This dependency must be resolved at the AppShell level (the Observatory needs to know what canvas, if any, is currently mounted) rather than owned by the Observatory itself.

---

## 6. Object Reuse Matrix

| Shared Primitive/Object | Also Used In |
|---|---|
| `LiveObjectChip` / `CitationChip` | Repository Explorer (via SelectionToolbar → Ask AI), Knowledge Graph inspectors |
| `TravelingHighlight` | Knowledge Graph / Execution Explorer (heartbeat/active-node variants) |
| `StatusDot` | TopChrome AI presence indicator, Settings integration cards |
| `ActionButton` | All 9 screens per the Mission Control blueprint's reuse matrix |
| `HistoryEntry` | Repository Explorer's `HistoryPanel` |
| `MetricRow` / `MetricSparkline` | Mission Control `HealthSignaturePanel`, Settings |
| `InlineNotice` | Repository Explorer, Overview Observatory, Settings — same error-adjacent pattern reused for Evidence Card annotations |
| `SegmentedBar` (new) | Not yet reused elsewhere — candidate for future health/readiness visualizations if this pattern proves valuable outside the Observatory |
| `TrackLane` (new) | Not yet reused elsewhere — candidate for a future multi-repo parallel-status view |

---

## 7. Layout Tree (Spatial Composition)

```
┌─────────────────────────────────────────────────────────────┐
│ ObservatoryHeader                                            │
│  [RepoContext]      [SystemReadinessStrip]   [Memory][Tokens][Dock] │
├─────────────────────────────────────────────────────────────┤
│ WorkspaceTabBar   [Login] [Payments] [Auth●] [+]              │
├───────────────┬───────────────────────────────┬──────────────┤
│ Conversation  │                                 │ Context     │
│ HistoryRail   │        AnswerBlock              │ Sources     │
│ (collapsible) │        + ConfidenceStack        │ Inspector   │
│               │                                 │ (collapsible)│
│               │  InvestigationTimeline           │             │
│               │   (ParallelAgentTracks or        │             │
│               │    sequential steps)             │             │
│               │                                 │              │
│               │        EvidencePanel             │              │
│               │                                 │              │
│               │        ExecutionQueue            │              │
├───────────────┴───────────────────────────────┴──────────────┤
│ Suggested Actions row                                         │
│ PromptComposer                                                │
└─────────────────────────────────────────────────────────────┘
```

**Priority order unchanged from the Bible:** AnswerBlock/InvestigationTimeline (center) > PromptComposer (bottom, always reachable) > EvidencePanel > ContextSourcesInspector/ConversationHistoryRail (side rails, collapsible) > ObservatoryHeader meters (peripheral). The new objects slot into this hierarchy without displacing it: `WorkspaceTabBar` sits above everything as a new top-level navigation row, and `ExecutionQueue` sits below Evidence, above the closing Suggested Actions row — reflecting that executing an action is the natural conclusion of reviewing evidence.

---

## 8. Interaction Contracts Summary

A contract, at this level, states what an object **receives** and what it **emits** — never how it's implemented.

| Object | Receives | Emits |
|---|---|---|
| WorkspaceTabBar | tabs[], activeTabId | select, create, close, reorder, rename |
| InvestigationTimeline | steps[] or tracks[], status | expand, collapse, inspectStep |
| ParallelAgentTracks | tracks[] | inspectTrack |
| ContextSourcesInspector | scope tree | toggleExpand, excludeSource, reincludeSource |
| MemoryTimeline | entries[] | open, forget, filter |
| ExecutionQueue | proposedActions[] | queue, confirm, cancel, retry, viewResult |
| ConfidenceStack | {evidence, inference, speculation} proportions | hoverSegment |
| SystemReadinessStrip | subsystem statuses[5] | hover (read-only otherwise) |
| PromptComposer | scope, history | submit(question), cancel() |

**Cross-object rule:** No object above ever mutates another object's state directly — every interaction flows up to `ActiveInvestigationView` (or `AIObservatoryPanel` for header-level objects) as an emitted event, and new state flows back down as props. This keeps every object independently testable and reorderable within the layout tree without hidden coupling.

---

## 9. Build Sequencing Recommendation

To de-risk implementation, build in this order — each stage is independently demonstrable:

1. **Static shell:** `AIObservatoryPanel`, `ObservatoryHeader` (minus live readiness), `PromptComposer`, single-tab `ActiveInvestigationView` with a static `AnswerBlock`.
2. **Evidence & confidence:** `EvidencePanel`, `EvidenceCard`, `ConfidenceStack` — provable with mocked answer data, no live reasoning yet.
3. **Investigation visualization:** `InvestigationTimeline` in its sequential (non-parallel) form — the simpler of its two states.
4. **Parallelism:** `ParallelAgentTracks` — layered on top of #3 once the sequential case is solid.
5. **Workspace:** `WorkspaceTabBar` and multi-tab state — deliberately after single-investigation flow is proven, since tab-switching correctness depends on scope isolation being solid first.
6. **Context transparency:** `ContextSourcesInspector`.
7. **Operability:** `ExecutionQueue` — last, since it depends on downstream systems (Impact Analysis, PR generation) that may not exist yet.
8. **Peripheral trust signals:** `SystemReadinessStrip`, `MemoryTimeline` — lowest risk, highest polish, done once the core loop is stable.

---

## Closing Note

This blueprint changes the Observatory's internal richness substantially — from a single-thread conversation to a multi-tab, multi-track, operable workspace — without changing the emotional contract set by the Bible: an expert who has already read everything, shows its work, and never leaves the developer guessing. Every new object exists to make that expert more capable, never to make the room feel busier.
