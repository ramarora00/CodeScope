# Investigation Lifecycle — Product Experience Blueprint

An **Investigation** is the unit of inquiry in the AI Developer Operating System: one line of questioning, from the first thing asked to whatever it resolves into. It is the object introduced informally in the AI Observatory Blueprint's `WorkspaceTabBar`; this document makes it a fully specified, first-class product concept with its own lifecycle, independent of any single screen.

---

## 1. Why Investigation Is a First-Class Object

A chat message is disposable. An Investigation is not. It is closer to a browser tab, a Linear issue, or a Figma file — something with a name, a status, a history, and a life that outlasts the moment it was created. Treating it this way is what allows a developer to have three open lines of inquiry at once, walk away from one for two days, and come back to find it exactly as they left it — evidence intact, reasoning intact, nothing re-explained.

**The emotional target:** never losing your place. A developer should be able to think of an Investigation the way they think of a browser tab they haven't closed yet — "I'll get back to that" — with total confidence that it will still be there, unchanged, until they choose to close it.

---

## 2. Lifecycle Overview

```
 (no investigation yet)
        │
        │ ask a question
        ▼
    ┌─────────┐
    │ Created  │  (instantiated the moment the first question is submitted)
    └────┬────┘
         │
         ▼
   ┌──────────────┐   cancel    ┌────────────┐
   │ Investigating │───────────▶│  Cancelled  │
   └──────┬───────┘             └─────┬──────┘
          │ completes                  │ resume
          ▼                            ▼
     ┌─────────┐   ask follow-up   ┌──────────────┐
     │ Answered │──────────────────▶│ Investigating │ (loops)
     └────┬────┘                   └──────────────┘
          │ no activity for a while
          ▼
     ┌────────┐    interact again    ┌─────────┐
     │  Stale  │─────────────────────▶│ Answered │
     └────┬───┘                       └─────────┘
          │ archive (explicit, or automatic tab-limit soft-archive)
          ▼
     ┌──────────┐   reopen    ┌───────────────────────┐
     │ Archived │────────────▶│ Answered / Stale       │
     └────┬─────┘              │ (resumes prior status) │
          │ delete (explicit,  └───────────────────────┘
          │ confirmed)
          ▼
     ┌─────────┐
     │ Deleted │  (terminal — permanent)
     └─────────┘

  Investigating ──(step failure / offline)──▶ Failed ──(retry)──▶ Investigating
                                                  │
                                                  └──(acknowledge)──▶ Answered, marked partial
```

**Governing rule:** nothing is ever silently lost. Cancelling, going stale, and archiving are all reversible. Only Deleted is terminal, and it always requires explicit confirmation.

---

## 3. States, Defined

- **Created** — the instant an Investigation exists: the first question has been submitted, a title has been auto-derived, and it now occupies a slot in the Workspace. Momentary — immediately proceeds to Investigating.
- **Investigating** — active reasoning is underway (sequential or parallel, per the AI Observatory Blueprint). The Investigation's tab shows a live activity indicator even if it isn't the focused tab.
- **Cancelled** — the developer interrupted reasoning before it completed. Whatever was produced up to that point is retained and clearly marked partial. Not a failure — an intentional stop.
- **Answered** — a complete answer exists and no reasoning is currently active. This is the resting state of a "done, for now" Investigation.
- **Stale** — an Answered Investigation that has had no developer interaction for an extended period. Purely a visual demotion (recedes in the tab bar) — nothing about its content changes, and it costs nothing to sit here indefinitely.
- **Failed** — a reasoning step could not complete (tool error, offline, subsystem unavailable). Stated specifically, not generically; always paired with either "retry" or "acknowledge."
- **Archived** — deliberately set aside. Removed from the active Workspace tab bar, but fully intact, retrievable from the Archive Tray at any time. This is the "close the tab but don't lose it" state.
- **Deleted** — permanently removed. The only state requiring explicit, typed-or-clicked confirmation, because it is the only one that cannot be undone.

---

## 4. Transitions and Triggers

| From | Trigger | To | Notes |
|---|---|---|---|
| (none) | First question submitted | Created → Investigating | Title auto-derived from the question |
| Investigating | Reasoning completes | Answered | Suggested Actions + Confidence Stack attach to the answer |
| Investigating | Developer cancels (`Esc` or explicit control) | Cancelled | Partial result retained and labeled |
| Investigating | Step fails unrecoverably | Failed | Specific failure stated at the point it occurred |
| Cancelled | Developer resumes | Investigating | Continues from where it stopped, not from scratch |
| Failed | Developer retries | Investigating | Same question, same scope |
| Failed | Developer acknowledges | Answered (partial) | The gap is stated plainly in the answer itself |
| Answered | New question asked in the same tab | Investigating | This is a follow-up, not a new Investigation |
| Answered | No interaction for the defined quiet period | Stale | Passive, reversible, no data change |
| Stale | Developer opens or interacts with the tab | Answered | Instant — no "reactivating…" delay |
| Any non-terminal state | Developer archives (explicit or soft, via tab-limit pressure) | Archived | Removed from active bar, kept in Archive Tray |
| Archived | Developer reopens from the Archive Tray | Prior status (Answered or Stale) | Reinserted into the active Workspace tab bar |
| Archived | Developer deletes, confirms | Deleted | Terminal |

---

## 5. Objects Involved (Cross-Reference)

Most rendering objects for an active Investigation are already specified in the AI Observatory Engineering Blueprint (`WorkspaceTabBar`, `InvestigationTab`, `InvestigationTimeline`, `EvidencePanel`, `ExecutionQueue`). This document adds the objects needed to complete the *lifecycle* — creation, archival, and retrieval — which that blueprint did not yet cover in depth.

- **NewInvestigationAffordance** — the `+` control in `WorkspaceTabBar` that creates a Created-state Investigation.
- **InvestigationStatusBadge** — the small per-tab indicator communicating Investigating / Answered / Stale / Failed at a glance, without opening the tab.
- **RenameInlineField** — in-place editing of an Investigation's auto-derived title.
- **ArchiveTray** — the retrieval surface for Archived Investigations; not a modal, a slide-out panel reachable from the Workspace header.
- **ArchivedInvestigationRow** — one entry in the Archive Tray: title, last-answered summary line, archived-on date, reopen/delete actions.
- **DeleteConfirmationDialog** — the one deliberately heavier-weight interaction in this entire lifecycle, since it is the only irreversible one.
- **ReopenToast** — the brief, dismissible confirmation shown after reopening an archived Investigation, with an "undo" (re-archive) affordance for a few seconds.
- **StaleIndicator** — a subtle visual treatment (reduced tab opacity, no badge needed beyond that) — deliberately minimal, since staleness is not a problem to be alarmed about.

---

## 6. Naming Conventions

**Investigation titles:**
- Auto-derived from the first question's core subject, condensed to a short noun phrase — never the literal full question text. ("What breaks if I change the tax calculation?" → "Tax calculation impact.")
- Editable at any time via `RenameInlineField`; a manually-set title is never overwritten by subsequent auto-derivation, even after follow-up questions change topic within the same tab.
- Before any question is submitted, a brand-new tab shows a placeholder, not a generated title: "New investigation."

**Status language (user-facing, in badges and the Archive Tray):**
- Use plain present-tense or plain-past labels a developer would say aloud: "Investigating," "Answered," "Needs attention" (for Failed), "Archived." Never internal state-machine names like "Cancelled" or "Stale" verbatim in the UI — Stale renders as no label at all (just recedes visually), and Cancelled renders as "Stopped — partial" per the Observatory Bible's existing language.

**Action naming (buttons, menu items):**
- Active-voice, naming exactly what happens: "Archive," "Delete," "Reopen," "Rename," never "Remove" (ambiguous between archive and delete) or "Manage" (vague).
- The action that produces Archived state is always labeled "Archive," never "Close," to avoid implying data loss the way closing a document might.

---

## 7. Empty States

- **No investigations yet (fresh Workspace):** `WorkspaceTabBar` shows a single default "New investigation" tab, already focused, Composer ready — there is never a literal blank screen with no tab at all.
- **Archive Tray, nothing archived:** plain statement, not an illustration: "Nothing archived yet. Investigations you archive will appear here." No call to action needed — archiving isn't something to prompt for.
- **Investigation created, no evidence yet:** covered by the Observatory Bible's existing "Thinking" state — this is not a distinct empty state, it's the first moment of Investigating.
- **Search/filter within the Archive Tray returns nothing:** "No archived investigations match [term]." with a one-click "clear search" — never a dead end.

---

## 8. Keyboard Interactions

| Shortcut | Action |
|---|---|
| `⌘T` | New investigation (Created state, focus moves to Composer) |
| `⌘W` | Archive the focused investigation (not delete — consistent with "Archive, never Close" naming rule) |
| `⌘⇧T` | Reopen the most recently archived investigation |
| `⌘1`–`⌘9` | Jump directly to the Nth open investigation tab |
| `⌘⌥→` / `⌘⌥←` | Cycle to next/previous open tab |
| `Esc` (while Investigating) | Cancel active reasoning — does not close or archive the tab |
| `Esc` (while Composer or rename field focused, not reasoning) | Standard dismiss/blur behavior |
| `Enter` (in `RenameInlineField`) | Commit the new title |
| `⌘⇧A` | Open the Archive Tray |

**Consistency rule inherited from the Frontend Constitution:** none of the above shortcuts are ever reassigned per-screen — they behave identically whether the Observatory is docked, floated, or full-screen.

---

## 9. Cross-Feature Presence

An Investigation is not confined to the AI Observatory panel visually, even though the Observatory owns its state:

- **Mission Control's InsightStream** can surface an item as "Investigate this" — selecting it creates a new Investigation pre-scoped to that insight, rather than requiring the developer to re-describe what they noticed.
- **Impact Analysis's** "Ask AI to draft the safe migration" action creates or continues an Investigation rather than a disconnected one-off answer, so the resulting conversation is retrievable later the same way any other Investigation is.
- **Global Search** indexes Investigation titles and their answers as a first-class result type (per the Bible's original Command Palette design) — a past Investigation is as reachable as a file.

**Ownership stays singular:** regardless of where an Investigation is triggered from, the AI Observatory Feature remains its sole owner per the Frontend Constitution — other Features only ever emit `openConversation` and receive back a reference to a mounted or resumed tab, never a copy of its state.

---

## 10. Closing Principle

An Investigation should never feel like a chat log that scrolls away. It should feel like a case file: named, findable, resumable, and honest about its own status at a glance. If a developer is ever unsure whether closing something will lose it, this lifecycle has failed — archiving must always feel as safe as it actually is.
