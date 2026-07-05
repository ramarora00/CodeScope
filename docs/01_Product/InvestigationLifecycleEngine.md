# Investigation Lifecycle Engine
### Pure Domain Specification — Feature-Sliced Design Compatible

This document specifies the **domain model** of an Investigation: its states, the rules governing movement between them, who is permitted to cause that movement, and what must always remain true regardless of what UI, AI system, or feature triggers it. It contains no components, no rendering concerns, and no implementation detail. It is the layer beneath the Investigation Lifecycle Experience Blueprint and Engineering Object Specification — those describe what the developer sees and how it's composed; this describes what is actually, structurally true.

In FSD terms, this entire document specifies the contents of `shared/lib` (the state machine and its pure transition rules) and `entities/investigation` (the data shape and its invariants) — the two layers that must remain framework- and UI-agnostic by FSD convention.

---

## 1. Complete Lifecycle State Machine

### States

| State | Meaning |
|---|---|
| `Created` | The Investigation exists as an addressable entity — scoped, titled (even if placeholder), but no reasoning has yet run against it. |
| `Active` | Reasoning is currently executing against this Investigation, sequential or parallel. |
| `Completed` | The most recent reasoning cycle finished and produced an answer; nothing is currently executing. |
| `Cancelled` | Reasoning was interrupted before completion; partial output, if any, is retained. |
| `Failed` | The most recent reasoning cycle could not complete due to an unrecoverable error in that cycle. |
| `Stale` | A `Completed` Investigation with no developer interaction for longer than the defined quiet period. Purely a passive demotion of `Completed`. |
| `Archived` | Deliberately set aside by the developer or by system pressure (see §5). Not deletable directly (see §5). |
| `Deleted` | Permanently removed. **Terminal.** |

There is no state prior to `Created` within this machine — the moment an Investigation is addressable at all, it is `Created`. What happens before that (a Composer with unsent text) is not domain state; it is transient input with no entity backing it, and is out of this document's scope.

### Valid Transitions (per state)

**From `Created`:**
- `InvestigationStarted` → `Active`
- `ArchiveRequested` → `Archived`

**From `Active`:**
- `InvestigationCompleted` → `Completed`
- `InvestigationCancelled` → `Cancelled`
- `InvestigationFailed` → `Failed`
- `ArchiveRequested` → `Archived` (see §5, Scenario B — this transition carries a mandatory implicit cancellation)

**From `Completed`:**
- `FollowUpRequested` → `Active`
- `StaleDetected` → `Stale`
- `ArchiveRequested` → `Archived`

**From `Cancelled`:**
- `ResumeRequested` → `Active`
- `ArchiveRequested` → `Archived`

**From `Failed`:**
- `RetryRequested` → `Active`
- `AcknowledgeRequested` → `Completed` (answer, if any, permanently flagged partial)
- `ArchiveRequested` → `Archived`

**From `Stale`:**
- `ReactivationOccurred` → `Completed`
- `ArchiveRequested` → `Archived`

**From `Archived`:**
- `RestoreRequested` → *the state recorded at the moment of archiving* (never a fixed default — see §6, Invariant 3)
- `DeleteConfirmed` → `Deleted`

**From `Deleted`:**
- None. Terminal (see §6, Invariant 1).

### Invalid Transitions (explicit — the most consequential rejections)

| Attempted | From | Why Invalid | Resolution |
|---|---|---|---|
| `DeleteConfirmed` | `Created`, `Active`, `Completed`, `Cancelled`, `Failed`, `Stale` | Deletion is only ever valid from `Archived` — the domain never permits deleting a "live" Investigation in one step | Caller must first cause `ArchiveRequested`; the domain then requires a separate, subsequent `DeleteConfirmed` (see §5, Scenario B) |
| `InvestigationStarted` | `Active`, `Completed`, `Cancelled`, `Failed`, `Archived`, `Deleted` | An Investigation cannot be "started" twice — the equivalent action from these states is `FollowUpRequested`, `ResumeRequested`, or `RetryRequested`, each with different semantics | Caller must emit the state-appropriate event; the domain does not silently reinterpret `InvestigationStarted` as one of these |
| `FollowUpRequested` | `Created`, `Active`, `Cancelled`, `Failed`, `Archived`, `Deleted` | A follow-up is only meaningful once a prior answer exists | Use `InvestigationStarted` (`Created`), or wait for the current cycle to resolve (`Active`) |
| `RestoreRequested` | Any state other than `Archived` | Nothing to restore from | No-op, rejected with a stated reason, never silently ignored |
| Any event | `Deleted` | Terminal state accepts no events | Rejected outright; a `Deleted` Investigation cannot be referenced by id for any further transition attempt |

---

## 2. State Transition Rules — Causation

Every transition in §1 is caused by exactly one of four categories. This categorization is a first-class part of the domain model because different categories carry different guarantees (an automatic transition must be idempotent and side-effect-free beyond the state change; a user transition may require confirmation; an AI transition must be distinguishable after the fact from a user one for audit purposes).

| Category | Transitions Caused | Guarantee Required |
|---|---|---|
| **User (manual)** | `ArchiveRequested`, `RestoreRequested`, `DeleteConfirmed`, `ResumeRequested`, `AcknowledgeRequested`, `RetryRequested`, `FollowUpRequested` (when typed directly), `InvestigationCancelled` (when interrupted by the developer) | Must be traceable to an explicit developer action; irreversible ones (`DeleteConfirmed`) require prior confirmation captured outside the state machine itself |
| **AI (system-initiated, on behalf of an in-progress task)** | `InvestigationCompleted`, `InvestigationFailed`, `InvestigationStarted` (when triggered by an AI-suggested action rather than typed input, e.g. Impact Analysis's "draft a fix") | Must record which reasoning cycle produced the transition, for later audit/evidence linkage |
| **Automatic (system, time- or policy-driven, no external actor)** | `StaleDetected`, `ArchiveRequested` (only in the soft tab-limit-pressure case, §5 Scenario E) | Must always be reversible; an automatic transition may never be the sole cause of an irreversible outcome |
| **Cross-feature (another Feature/page triggers a lifecycle effect indirectly)** | `InvestigationStarted` (when Mission Control or Impact Analysis opens a conversation), `FollowUpRequested` (same origin) | Must arrive through the domain's public creation/continuation contract only (§4) — a cross-feature caller never manipulates state directly |

**Rule:** `InvestigationCancelled` and `ReactivationOccurred` can each be caused by more than one category depending on context (a developer explicitly cancels, vs. the system cancelling as a side effect of archiving; a developer reactivating by typing, vs. the domain reactivating because a cross-feature reference was opened) — in both cases, the *domain event itself is identical*; only the causation metadata attached to it (§4) differs. The state machine does not branch behavior based on causation category — causation is recorded, not acted on differently, which keeps the machine itself simple and auditable.

---

## 3. Lifecycle Events — Canonical Registry

| Event | Fires On | Carries |
|---|---|---|
| `InvestigationCreated` | Entity instantiation | id, initial scope, causation category |
| `InvestigationStarted` | `Created`/`Cancelled`(resume)/`Failed`(retry)/`Completed`(follow-up) → `Active` | id, triggering question or action reference |
| `InvestigationCompleted` | `Active` → `Completed` | id, answer reference, evidence references |
| `InvestigationCancelled` | `Active` → `Cancelled` | id, partial-output reference (nullable) |
| `InvestigationFailed` | `Active` → `Failed` | id, failure reason (structured, not free text) |
| `RetryRequested` / (leads to `InvestigationStarted`) | User action on `Failed` | id |
| `AcknowledgeRequested` / (leads to `InvestigationCompleted`, flagged partial) | User action on `Failed` | id |
| `ResumeRequested` / (leads to `InvestigationStarted`) | User action on `Cancelled` | id |
| `FollowUpRequested` / (leads to `InvestigationStarted`) | User or cross-feature action on `Completed` | id, new question or action reference |
| `StaleDetected` | Automatic, on `Completed` past quiet-period threshold | id, elapsed duration |
| `ReactivationOccurred` | Any interaction with a `Stale` Investigation | id |
| `InvestigationArchived` | Any non-`Archived`/`Deleted` state → `Archived` | id, recorded prior state (for restoration) |
| `InvestigationRestored` | `Archived` → recorded prior state | id, restored-to state |
| `InvestigationDeleted` | `Archived` → `Deleted` | id (entity itself is subsequently purged from persistence per policy) |
| `RenameRequested` / `RenameCompleted` | Any state except `Deleted` | id, new title — **does not alter lifecycle state**; orthogonal to the machine in §1 |
| `PinRequested` / `PinCompleted` | Any state except `Archived`, `Deleted` | id — orthogonal boolean attribute, not a lifecycle state (see §6, Invariant 6) |
| `DuplicateCreationRejected` | A creation attempt matches an existing `Created`/`Active` Investigation's scope within the debounce window | id of the existing Investigation returned instead (see §5, Scenario A) |

---

## 4. Transition Contracts — Emission and Consumption

| Event | Permitted Emitters | Permitted Consumers |
|---|---|---|
| `InvestigationCreated` | The Investigation domain module itself, invoked only via its public creation contract — never constructed directly by any Feature | AI Observatory page/feature (owner), Global Search indexer, Mission Control (read-only, for InsightStream linkage) |
| `InvestigationStarted` | User (via Composer submission), AI Observatory's own continuation logic (retry/resume/follow-up), cross-feature callers strictly through the `openConversation` contract | AI Observatory (owner), Attention Overlay subscriber (for reasoning visualization) |
| `InvestigationCompleted` | The reasoning system only (an AI-category actor) — never directly by a user action | AI Observatory (owner), Global Search indexer, Memory Timeline (candidate entry source) |
| `InvestigationCancelled` | User (explicit interrupt), or the domain itself as an implicit side effect of `ArchiveRequested` on an `Active` Investigation | AI Observatory (owner), reasoning system (must halt in-flight work) |
| `InvestigationFailed` | The reasoning system only | AI Observatory (owner) |
| `InvestigationArchived` | User (explicit), or the domain's automatic tab-pressure policy (§5, Scenario E) | AI Observatory (owner), Workspace widget (tab bar removal), Archive Tray (addition) |
| `InvestigationRestored` | User only (from the Archive Tray) | AI Observatory (owner), Workspace widget (tab bar re-insertion) |
| `InvestigationDeleted` | User only, and only after explicit confirmation captured outside the domain event itself | AI Observatory (owner), persistence provider (purge) |
| `RenameRequested` / `PinRequested` | User only | AI Observatory (owner) |
| `DuplicateCreationRejected` | The domain's creation contract, automatically | Whichever caller attempted the duplicate creation (returned synchronously, not broadcast) |

**Ownership rule, restated from the Frontend Constitution:** regardless of who is permitted to *emit* a triggering request, only the AI Observatory Feature ever holds authority to actually mutate an `InvestigationEntity`. A cross-feature emitter's request is always mediated through AI Observatory's public contract — no other Feature, and no AI subsystem, writes to Investigation state directly.

---

## 5. Failure Scenarios

**A — Duplicate investigations.** A creation request arrives whose scope matches an existing `Created` or `Active` Investigation within a short debounce window (e.g., a developer double-triggers "Ask AI" from two different selection toolbars pointing at the same target). **Resolution:** the domain does not create a second entity. It returns the existing Investigation's id via `DuplicateCreationRejected`, and the calling Feature focuses that existing tab instead. This is not treated as an error state — it is a routine dedup rule.

**B — Deleting an active investigation.** A `DeleteConfirmed` is attempted against an `Active` Investigation. **Resolution:** rejected outright per §1's invalid-transition table. Deletion is only valid from `Archived`. If the caller's real intent is "get rid of this now," the domain requires the compound path: `ArchiveRequested` (which, per Scenario C, implicitly cancels the running reasoning) followed by a separate, explicitly confirmed `DeleteConfirmed`. This two-step requirement is deliberate friction — it is the one place in the entire lifecycle where friction is intentional, because it is the one truly irreversible action.

**C — Archiving a running investigation.** An `ArchiveRequested` arrives while status is `Active`. **Resolution:** this is valid, but not a bare state overwrite. The domain first issues an implicit `InvestigationCancelled` (halting the in-flight reasoning cycle cleanly), *then* applies `InvestigationArchived`. Both events are emitted, in that order, never collapsed into a single silent transition — any consumer subscribed to `InvestigationCancelled` (e.g., the reasoning system, which must actually stop computing) still receives it.

**D — Renaming an archived investigation.** A `RenameRequested` arrives while status is `Archived`. **Resolution:** this is valid and requires no special handling. Renaming is orthogonal metadata (§3), not a lifecycle transition, and archived data remains fully mutable at the metadata level — only its *lifecycle* is frozen pending restore or delete. This is not actually a failure scenario; it is listed here specifically to document that it is *not* one, since it is a common false assumption when first modeling this domain.

**E — Deleting/archiving the last remaining investigation.** The workspace's only non-archived Investigation is archived or its Investigation entity otherwise leaves active status entirely. **Resolution:** this is an aggregate-level (Workspace) invariant, not an `InvestigationEntity` invariant — the entity-level transition proceeds normally (nothing about a single Investigation's own rules depends on how many siblings exist). Immediately afterward, the Workspace aggregate enforces its own separate invariant (§6, Invariant 8) by causing a fresh `InvestigationCreated` so the workspace is never left with zero addressable tabs. This is a Workspace-level reaction to the entity event, not a special case inside the Investigation state machine itself — keeping the two concerns cleanly separated is what prevents this rule from leaking into, and complicating, every entity transition.

---

## 6. Domain Invariants

These must be true at all times, regardless of UI, feature, or AI behavior:

1. **`Deleted` has no outbound transition.** It is the only true terminal state in the system.
2. **No transition skips a required intermediate state.** Deletion always passes through `Archived`; starting always passes through `Created` (even if momentarily, for cross-feature-originated Investigations).
3. **Archiving always records the pre-archive state**, so `InvestigationRestored` is never ambiguous about what it's restoring to — an Investigation archived from `Stale` restores to `Stale`, not unconditionally to `Completed`.
4. **`Active` never coexists with `Archived`.** An Investigation cannot have reasoning executing against it while also being in the archive — this is why Scenario C's implicit cancellation is mandatory, not optional.
5. **Every `InvestigationFailed` carries a structured reason.** The domain never allows an opaque failure with no recorded cause, because `RetryRequested` and `AcknowledgeRequested` both depend on that reason being inspectable.
6. **Pin is never true on an `Archived` or `Deleted` Investigation.** Pinning is a signal of active relevance; archiving or deleting an Investigation automatically clears its pin as a side effect, not as something the caller must remember to do separately.
7. **Title is never empty.** An Investigation always has at least its system-generated placeholder title; `RenameCompleted` with an empty value is rejected at the domain level, not merely discouraged at the UI level.
8. **The Workspace aggregate never holds zero active (non-archived, non-deleted) Investigations for longer than the instant it takes to create a replacement** — this is the aggregate-level counterpart to Scenario E, and is enforced independently of any single Investigation's own state machine.
9. **Every state-changing event is attributable to exactly one causation category** (§2), permanently, for audit and for any future collaborative-mode attribution (see §7).
10. **No Feature other than AI Observatory ever holds write authority over an `InvestigationEntity`**, regardless of who triggered the request that led to the write (§4).

---

## 7. Future Compatibility

- **Persistence:** the state machine's states and events are storage-agnostic by construction — `InvestigationEntity` and its transition log can be serialized to any persistence provider without the machine itself changing. The append-only nature of the causation-tagged event log (Invariant 9) means persistence can be implemented as either "store current state" or "store full event history and derive state" without altering this specification.
- **AI Streaming:** `Active` is defined as a single state regardless of how granular the underlying reasoning system's internal progress reporting is (single-shot vs. token-streamed vs. multi-step). Streaming detail is a rendering concern of `widgets/investigation-timeline`, entirely downstream of this domain model — the machine does not need a "streaming" state distinct from `Active`.
- **Execution Explorer:** trace-triggered Investigations (a developer asks a question from within a trace view) create Investigations through the same cross-feature `InvestigationStarted` path as any other Feature — no Execution-Explorer-specific state or event is required.
- **Mission Control:** InsightStream-originated Investigations use the identical creation contract; Mission Control never needs read access to anything beyond an Investigation's id and title for linking purposes, which are already public per §4.
- **Repository Graph:** node-selection-triggered Investigations follow the same path; the coordinate-contract mechanism used for `highlightNode` (per the Frontend Constitution) is entirely independent of this lifecycle and requires no changes here.
- **Impact Analysis:** its "draft a safe migration" action is modeled as an AI-category `InvestigationStarted`/`FollowUpRequested`, distinguishing it from user-typed continuations purely via causation metadata (§2) — no new state or event is needed to support it.
- **Collaborative mode (anticipated):** because every event already carries a causation category and, per Invariant 9, is permanently attributable, extending causation metadata to include a specific user identity (rather than just "User") is additive — the state machine's shape does not change, only the granularity of who a "User" transition is attributed to.

**Governing constraint:** none of the above required adding a new state or restructuring an existing transition — each is satisfied by treating the relevant concern (streaming granularity, trigger origin, collaborator identity) as metadata attached to an existing event, never as a fork in the state machine itself. This is the same discipline the Engineering Blueprint documents require of every other extension point in this system, applied here to the domain layer specifically.

---

## Closing Note

This machine has eight states, one terminal, and every non-terminal state has at least one path back to `Active` or forward to a legitimate rest state — no developer action, AI failure, or system policy can strand an Investigation in a state it cannot leave except through deliberate, confirmed deletion. That property, more than any individual rule above, is what this specification exists to guarantee.
