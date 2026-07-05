# Investigation Lifecycle — Engineering Object Specification
### Feature-Sliced Design–Compatible Construction Reference

This document decomposes the Investigation Lifecycle Product Experience Blueprint into build-ready objects, mapped onto Feature-Sliced Design (FSD) layers, plus a formal state machine and interaction contracts. No code. No components. Layer/slice *names* are specified as naming conventions, not as folders to create.

---

## 1. FSD Layer Mapping

FSD layers, outer to inner: **app → pages → widgets → features → entities → shared**. Each Investigation-related object is assigned to exactly one layer, following FSD's core rule: a layer may only import from layers below it, never sideways or up.

| FSD Layer | Investigation-Related Slice(s) | Contents |
|---|---|---|
| **app** | — | Providers, Event Bus, routing — per the Frontend Constitution's AppShell ownership; Investigation has no app-layer content of its own |
| **pages** | `pages/observatory` | Composes the Observatory screen from widgets below; this layer corresponds to what the Frontend Constitution calls a "Feature screen" (AI Observatory) |
| **widgets** | `widgets/workspace-tab-bar`, `widgets/investigation-timeline`, `widgets/archive-tray` | Composite, page-section-sized objects assembled from features + entities |
| **features** | `features/create-investigation`, `features/archive-investigation`, `features/delete-investigation`, `features/reopen-investigation`, `features/rename-investigation`, `features/ask-investigation-question`, `features/cancel-investigation-reasoning` | One user-facing action per slice — the FSD convention of "a feature is a single thing a user does" |
| **entities** | `entities/investigation` | The Investigation data model itself and its minimal, action-free presentational pieces (status badge, stale treatment) |
| **shared** | `shared/ui` (primitives), `shared/constants` (event registry, motion primitives), `shared/lib` (the state machine definition itself, since it's pure logic reusable by any feature that reads Investigation status) | Cross-cutting, Investigation-agnostic building blocks |

**Why the state machine lives in `shared/lib`, not `entities/investigation`:** FSD keeps entity slices focused on data shape and minimal display logic. The transition rules (§3 below) are pure logic with no rendering — placing them in `shared/lib` allows both `entities/investigation` and any `features/*` slice to reference the same transition table without a circular or upward dependency.

**Cross-reference to the Frontend Constitution:** FSD's `pages` layer and the constitution's "Feature" concept (Mission Control, AI Observatory, etc.) are the same idea under two naming systems — a `pages/observatory` slice *is* the AI Observatory Feature from that document. This spec does not introduce a second architecture; it expresses the same one in FSD's vocabulary for the parts of the codebase adopting FSD slicing.

---

## 2. Object Inventory by Layer

### `entities/investigation`

- **InvestigationEntity** (data shape, not a component): id, title, status, createdAt, lastActivityAt, scope reference, ordered message/evidence/execution references, archivedAt (nullable), titleIsManual (boolean, guards auto-rename).
- **InvestigationStatusBadge** — pure presentational, maps a status value to the plain-language label defined in the Blueprint's naming conventions (§6 of that document).
- **StaleTreatment** — a presentational modifier (reduced-opacity styling rule), not a component with its own state.

### `features/create-investigation`

- **NewInvestigationAffordance** — the `+` control; on activation, instantiates an `InvestigationEntity` in `created` status and emits `investigationCreated`.

### `features/archive-investigation` / `features/reopen-investigation` / `features/delete-investigation`

- **ArchiveControl** — per-tab and per-row action, emits `investigationArchived`.
- **ReopenControl** — per-row action in the Archive Tray, emits `investigationReopened`.
- **DeleteConfirmationDialog** — the one heavyweight interaction in this spec; requires explicit confirm before emitting `investigationDeleted`.
- **ReopenToast** — transient confirmation with a timed "undo" (re-archive) affordance.

### `features/rename-investigation`

- **RenameInlineField** — inline edit surface; commits set `titleIsManual = true` on the entity, permanently disabling further auto-derivation for that Investigation.

### `features/ask-investigation-question`

- **QuestionSubmitControl** — logically part of `PromptComposer` (owned by the Observatory page/widget layer already specified in the AI Observatory Engineering Blueprint); this feature slice specifically owns the *lifecycle side-effect* of submission (creating or transitioning an Investigation), not the input UI itself, which remains a widget-layer concern.

### `features/cancel-investigation-reasoning`

- **CancelControl** — available only while status is `investigating`; emits `investigationCancelled`.

### `widgets/workspace-tab-bar`

- Composes: `entities/investigation` (list + status badges), `features/create-investigation`, `features/archive-investigation`, `features/rename-investigation`.
- **InvestigationTab** — one tab, rendering title, `InvestigationStatusBadge`, and hosting the archive/rename controls contextually (e.g., on hover or overflow menu).

### `widgets/investigation-timeline`

- Already specified in the AI Observatory Engineering Blueprint (`InvestigationTimeline`, `ParallelAgentTracks`) — included here only to note its dependency on `entities/investigation`'s status field (it renders differently depending on `investigating` vs. `answered` vs. `failed`).

### `widgets/archive-tray`

- Composes: `entities/investigation` (filtered to `archived` status), `features/reopen-investigation`, `features/delete-investigation`.
- **ArchivedInvestigationRow** — title, last-answered summary, archived-on date, reopen/delete actions.
- **ArchiveSearchField** — filters the tray's rows; purely local UI state, not an entity concern.

### `pages/observatory`

- Composes `widgets/workspace-tab-bar`, `widgets/investigation-timeline`, `widgets/archive-tray`, plus the pre-existing Observatory widgets (`EvidencePanel`, `ExecutionQueue`, etc.) from the earlier blueprint — this page slice is the complete AI Observatory screen.

---

## 3. Formal State Machine

**States:** `created`, `investigating`, `cancelled`, `answered`, `stale`, `failed`, `archived`, `deleted`.

**Events:** `questionSubmitted`, `reasoningCompleted`, `reasoningCancelled`, `reasoningFailed`, `resumeRequested`, `retryRequested`, `acknowledgeRequested`, `activityTimeoutElapsed`, `interactionOccurred`, `archiveRequested`, `reopenRequested`, `deleteConfirmed`.

| Current State | Event | Guard | Next State | Side-Effect Emissions |
|---|---|---|---|---|
| (none) | `questionSubmitted` | first question for this Investigation | `created` → `investigating` (atomic) | `investigationCreated`, `investigationStateChanged` |
| `investigating` | `reasoningCompleted` | — | `answered` | `investigationStateChanged` |
| `investigating` | `reasoningCancelled` | — | `cancelled` | `investigationStateChanged` |
| `investigating` | `reasoningFailed` | — | `failed` | `investigationStateChanged` |
| `cancelled` | `resumeRequested` | — | `investigating` | `investigationStateChanged` |
| `failed` | `retryRequested` | — | `investigating` | `investigationStateChanged` |
| `failed` | `acknowledgeRequested` | — | `answered` | `investigationStateChanged` (answer flagged partial) |
| `answered` | `questionSubmitted` | same Investigation, follow-up | `investigating` | `investigationStateChanged` |
| `answered` | `activityTimeoutElapsed` | no `interactionOccurred` since entering `answered` | `stale` | `investigationStateChanged` |
| `stale` | `interactionOccurred` | — | `answered` | `investigationStateChanged` |
| `created`, `investigating`, `cancelled`, `answered`, `stale`, `failed` | `archiveRequested` | — | `archived` | `investigationArchived` (records prior status for restoration) |
| `archived` | `reopenRequested` | — | prior status (recorded at archive time) | `investigationReopened` |
| `archived` | `deleteConfirmed` | explicit confirmation received | `deleted` (terminal) | `investigationDeleted` |

**Guard note on `activityTimeoutElapsed`:** this is the only time-based transition in the machine. It is evaluated passively (a scheduled check, not a user action) and is always reversible by the very next `interactionOccurred` — per the Blueprint's rule that staleness is cosmetic, never destructive.

**Invariant:** `deleted` is the only state with no outbound transition. Every other state has at least one path back to an active, usable state — this invariant is the formal expression of the Blueprint's "nothing is ever silently lost" principle, and should be treated as a required property of any future modification to this machine.

---

## 4. Interaction Contracts

| Object | Receives | Emits |
|---|---|---|
| `NewInvestigationAffordance` | current tab count (for soft-limit warning) | `investigationCreated` |
| `InvestigationTab` | entity (id, title, status, badge state) | `investigationFocused`, forwards `archiveRequested`/`renameRequested` from its contextual controls |
| `RenameInlineField` | current title, `titleIsManual` flag | `investigationRenamed` (also sets `titleIsManual = true`) |
| `CancelControl` | current status (only rendered when `investigating`) | `reasoningCancelled` |
| `ArchiveControl` | entity id | `archiveRequested` |
| `ReopenControl` | archived entity id | `reopenRequested` |
| `DeleteConfirmationDialog` | archived entity id, confirmation input | `deleteConfirmed` (only after explicit confirm; emits nothing on dismiss) |
| `ReopenToast` | the just-reopened entity id, a timeout duration | `undoReopenRequested` (re-emits `archiveRequested` if triggered within the window) |
| `ArchiveTray` | list of `archived`-status entities | `archiveTraySearchChanged` (local), forwards reopen/delete events |
| `entities/investigation` (as a data slice) | events from the table in §3 | `investigationStateChanged` (the canonical event other layers observe to re-render status-dependent UI, e.g. `InvestigationStatusBadge`, `widgets/investigation-timeline`) |

**Rule inherited from the Frontend Constitution's Event Bus discipline (§6 of that document):** every event named above (`investigationCreated`, `investigationStateChanged`, `investigationArchived`, `investigationReopened`, `investigationDeleted`) is added to the canonical Event Bus registry as part of adopting this specification — no Investigation-lifecycle event may be emitted outside this named set.

---

## 5. Object Decomposition to Primitives

All primitives referenced below already exist in the Design Primitives set (Engineering Construction Blueprint §10.1) or the two additions from the AI Observatory Engineering Blueprint (§4.1 of that document). **No new primitives are required for the Investigation Lifecycle.**

```
widgets/workspace-tab-bar
 └── InvestigationTab (entities/investigation)
      ├── LabelText (shared, primitive)
      ├── InvestigationStatusBadge (entities/investigation) → StatusDot (shared, primitive)
      ├── RenameInlineField (features/rename-investigation) → LabelText (shared, editable variant)
      └── ArchiveControl (features/archive-investigation) → ActionButton (shared, primitive)

widgets/archive-tray
 ├── ArchiveSearchField → PaletteInput (shared, primitive, non-global-search variant)
 └── ArchivedInvestigationRow (entities/investigation)
      ├── LabelText (shared, primitive)
      ├── Timestamp (shared, primitive)
      ├── ReopenControl (features/reopen-investigation) → ActionButton (shared, primitive)
      └── DeleteConfirmationDialog (features/delete-investigation) → ActionRow (shared, primitive) + ActionButton ×2

ReopenToast → InlineNotice (shared, primitive, transient/dismissible variant)
```

---

## 6. Persistence & Ownership Rules

- **Owner:** `entities/investigation`'s data is owned exclusively by the AI Observatory Feature/page, per the Frontend Constitution's Feature Ownership Matrix — no other Feature reads or writes Investigation entities directly.
- **Persistence tier:** Persistent State (per the Constitution's §3) — Investigations, including `archived` and their full evidence/history, survive reload. Only `deleted` removes them from the persistence provider entirely.
- **Session-only fields:** which tab is currently focused, and Archive Tray search text, are Session State — they reset per the Constitution's normal session rules and are never written to the persistence provider.
- **Cross-feature creation:** when Mission Control or Impact Analysis triggers Investigation creation (per the Blueprint's §9), they do so exclusively via the `openConversation` event already defined in the Constitution's Event Bus registry — never by constructing an `InvestigationEntity` themselves. `entities/investigation` construction logic is never exposed outside the Observatory page/feature boundary.

---

## 7. Naming Convention Enforcement (Engineering-Level)

- **Slice names** follow FSD's `layer/kebab-case-name` convention exactly as listed in §1 — no Investigation-related slice deviates from this for consistency across the codebase's eventual FSD adoption.
- **Event names** are camelCase, past-tense for completed facts (`investigationCreated`, `investigationArchived`) — matching the existing canonical registry style set in the Frontend Constitution (`highlightNode`, `nodeSelected`, etc.), never a mix of tenses within the same registry.
- **State values** (`created`, `investigating`, `cancelled`, `answered`, `stale`, `failed`, `archived`, `deleted`) are lowercase, single-word where possible, and are internal identifiers only — the Blueprint's §6 governs what a developer actually sees, and the two vocabularies are intentionally decoupled so product copy can evolve without touching the state machine's identifiers.

---

## 8. Screen → Object Matrix

| Screen (page) | Objects Present |
|---|---|
| `pages/observatory` | `widgets/workspace-tab-bar`, `widgets/investigation-timeline`, `widgets/archive-tray` (on demand), plus all pre-existing Observatory widgets |
| Mission Control | None directly — only emits `openConversation`, which `pages/observatory` resolves into an Investigation |
| Impact Analysis | Same — emits `openConversation` only |

**Reuse ratio note:** this entire lifecycle is additive to one page (`pages/observatory`) and introduces zero new primitives — consistent with the architectural discipline established across every prior blueprint in this project.

---

## Closing Note

This specification treats Investigation as data first, UI second: the state machine in §3 is the authoritative definition of what an Investigation *is*, and every object in §2 and §5 is a rendering or control surface over that machine — never a parallel source of truth. Any future feature that touches Investigations (Memory, PR review, multi-repo reasoning, per the Observatory Blueprint's Future Expansion section) extends this machine's event set, not its own separate lifecycle.
