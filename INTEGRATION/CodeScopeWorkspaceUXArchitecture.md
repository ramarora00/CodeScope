# CodeScope Workspace — UX Architecture
### The AI-Native Operating System for Understanding Code

CodeScope is not a chat app with a file tree bolted on, and not an IDE with an AI panel bolted on. It is one continuous workspace where reading, understanding, and asking are the same activity, expressed through the same six zones, at all times. Nothing in this product navigates away from anything else — it opens, focuses, and recedes.

---

## 1. Complete UX Architecture

Six zones, always present, never modal, never a separate route:

```
┌ Dock ┬──────────────── Command Bar ─────────────────────────┐
│      ├──────────────────────────────────────────────────────┤
│      │ Sidebar │              Main Workspace (tabs)  │ Knowledge│
│ icon │ (module-│                                      │ Panel    │
│ only │ scoped) │                                      │ (context)│
│      │         │                                      │          │
│      ├──────────────────────────────────────────────────────┤
│      │                Bottom Timeline (AI reading)            │
└──────┴──────────────────────────────────────────────────────┘
```

**The governing idea:** there is exactly one workspace state at any time — which repository, which tabs are open, what the Sidebar and Knowledge Panel are showing, what the Bottom Timeline is narrating. Every zone is a *view onto that one state*, not an independent screen with its own navigation history. Switching what the Sidebar shows doesn't "go" anywhere; it's the same workspace reflecting a different facet of itself, exactly the same principle Knowledge Explorer's Focus model established, applied here to the whole application.

---

## 2. Screen Hierarchy

There are only three top-level screens, and only the third has any internal complexity:

1. **Connect** — the single command surface (already designed). Exists only until a repository is connected.
2. **Processing** — the live reading/parsing experience. Exists only until indexing completes, then dissolves directly into Workspace rather than navigating to it.
3. **Workspace** — the permanent home screen for the rest of the session. Everything else in this document describes its internal structure.

Within Workspace, nothing is a "screen." A Knowledge Graph, a file, a relationship view, an execution trace — these are all **tabs**, meaning they are peers, opened and closed the same way, never a full-screen takeover of the other five zones.

---

## 3. Component Hierarchy

```
CodeScopeWorkspace
 ├── Dock
 │    └── DockIcon (×6: Repository, Explorer, Knowledge, Claude, History, Settings)
 ├── CommandBar
 │    ├── RepositorySelector
 │    ├── WorkspaceSelector
 │    ├── AskCodeInput
 │    ├── ConnectionIndicator
 │    └── CommandPaletteTrigger
 ├── Sidebar (contents swap per active Dock module)
 │    ├── SidebarSectionHeader
 │    └── SidebarRow  (a file, a symbol, a past question — one row shape, reused)
 ├── MainWorkspace
 │    ├── TabBar
 │    │    └── Tab  (Editor / Graph / Markdown / Relationships / Timeline / Execution / Diff)
 │    └── TabContent (renders the type-specific surface for the active tab)
 ├── KnowledgePanel
 │    ├── DefinitionsBlock
 │    ├── RelatedFilesBlock
 │    ├── RelationshipsBlock
 │    ├── PinnedFilesBlock
 │    └── OpenTabsBlock
 └── BottomTimeline
      ├── TimelineTrack
      │    └── ReadingStep  (Opened X / Read lines N–M / Followed import / Jumped to Y / Concluded)
      └── TimelineTransport (play state indicator, not a scrubber — this is live narration, not playback)
```

**Container taxonomy carried over from the earlier critique:** `ReadingStep`, `SidebarRow`, and every `KnowledgePanel` block are Operation-Row/Evidence-Block shaped — single-line-height, verb-led, monospace where they reference code — never a card. No new container vocabulary is introduced for CodeScope; this is a direct application of that taxonomy to an IDE-shaped layout.

---

## 4. Motion System

Five primitives, matching the discipline already established for this product family, retuned for an IDE's pace rather than a spatial map's:

1. **Camera Pan** — the AI reading experience's core motion: the code viewer scrolls and re-centers the way a person's eyes would move through a file, never a hard jump.
2. **Reveal Highlight** — a brief, single-pass emphasis (not a looping glow) on the exact lines/imports the AI is currently attending to, fading to neutral as attention moves on.
3. **Cross-fade** — tab switches and Sidebar content swaps; the frame (Dock, Command Bar, Knowledge Panel position) never moves, only the content beneath it.
4. **Slide-reveal** — Knowledge Panel and Bottom Timeline collapsing/expanding; a deliberate, physical push rather than an instant show/hide.
5. **Pulse-once** — used exactly once, when the AI reaches a conclusion, on the ReadingStep that states it — a single, brief emphasis marking "this is the answer," never a repeating animation.

**Rule:** nothing animates ambiently. Every motion above is a direct consequence of either the AI actively reading or the developer actively interacting — consistent with "motion over decoration," which here specifically means motion *replaces* decorative loading affordances rather than sitting alongside them.

---

## 5. Interaction Flow

```
Connect → Processing → Workspace opens (Explorer + a welcome tab)
                                │
                    developer types in Ask Code Input
                                │
                Bottom Timeline begins narrating in real time
                                │
        Main Workspace's active tab becomes a live Editor view,
        camera-panning to whatever file the AI is currently reading
        (Reveal Highlight marks the specific lines/imports in focus)
                                │
              AI follows a reference → a NEW tab opens automatically
              for the file it jumped to (never replacing the current
              tab — this is how "the user watches the AI understand
              the repository" becomes literal: open tabs accumulate
              as a visible trail of where the reading went)
                                │
              Knowledge Panel updates continuously: Related Files
              and Relationships populate as the AI's reading expands
                                │
                    AI reaches a conclusion
                                │
        Bottom Timeline's final ReadingStep pulses once, and a
        Reasoning Block appears in the active tab with the answer,
        each cited file/line a Live Object Chip back into the tabs
        already open — nothing needs to be re-opened to verify it
```

**Never a modal, never a route change, never a "results page."** The entire flow above happens inside the one persistent Workspace state.

---

## 6. Layout Grids

- **Dock:** 48px fixed width, icons vertically centered with 20px rhythm, never scrolls (6 items is the designed ceiling — a 7th requires an overflow affordance, not a resize).
- **Command Bar:** 44px fixed height, three-zone internal grid (Repository/Workspace selectors left, Ask Code Input center-dominant at ~40% width, Connection indicator + Command Palette trigger right).
- **Sidebar:** 240px default, collapsible to 0, resizable between 200–320px — never wider, since it's a navigation aid, not a content surface.
- **Main Workspace:** fluid, takes all remaining horizontal space; this is the only zone with no fixed or maximum width.
- **Knowledge Panel:** 280px default, collapsible to 0, resizable between 240–360px.
- **Bottom Timeline:** 160px default height when expanded, collapses to a single 32px status line when not actively narrating — it should not occupy a sixth of the vertical workspace during a plain file-reading session with no AI activity in progress.
- **Baseline grid:** an 8px unit governs all internal padding and row heights across every zone, matching the spacing discipline already established for this product family.

---

## 7. Typography Scale

Five sizes, two weights, one monospace tier — deliberately smaller and denser than Knowledge Explorer's scale, because an IDE-shaped workspace is read at closer, more sustained attention:

- **17px / medium** — tab titles, the single largest text on screen, reserved for what's currently open.
- **13px / regular** — body content: Reasoning Block prose, Knowledge Panel descriptions.
- **13px / monospace** — all code, all file paths, all symbol names — a hard rule, never rendered in the sans tier.
- **12px / regular, muted** — Sidebar rows, ReadingStep labels, metadata lines.
- **11px / regular, muted, letter-spaced** — section headers ("RELATED FILES", "PINNED"), the only place letter-spacing is used, and only for these all-caps micro-labels.

No bold-for-emphasis beyond the 17px tier — emphasis elsewhere is carried by color/muting, not weight, keeping the whole interface visually quiet even when dense.

---

## 8. Color System

- **Base:** `#0a0a0b` — the workspace canvas, identical across every zone; there is no "panel background" distinct from "app background," which is what prevents the six-zone layout from reading as six separate boxes.
- **Raised surface:** `#141416` — used only for the active Tab and hover states, the single subtlest possible elevation cue.
- **Border/hairline:** `rgba(255,255,255,0.08)` standard, `rgba(255,255,255,0.14)` for a focused/active boundary — never more than these two values anywhere in the product.
- **Text — primary:** `#e9e9ea`, reserved for tab titles and the content currently being read.
- **Text — secondary:** `#c7c7ce`, body prose and active ReadingStep.
- **Text — muted:** `#7a7a7f`, Sidebar rows, inactive ReadingSteps, metadata.
- **Text — faint:** `#5f5f63` / `#4a4a4e`, section labels, unreached code lines during the reading animation, disabled affordances.
- **Accent:** one color only, `#8b8dee` (soft indigo), used exclusively for: the active Dock icon indicator, in-progress ReadingStep marker, Reveal Highlight, and Live Object Chips. It never appears as a background fill, only as text, icon, or a 1–2px indicator line.
- **Semantic (success/error):** desaturated green/red, text-and-icon only, used only in Diff tabs and Validation-style blocks — never as a background wash, per the accent-bar pattern already established for this product family.

**The single rule that matters most here:** if a second accent color is ever introduced, it should be treated as a proposal requiring the same review discipline as a sixth motion primitive — this palette is deliberately closed.

---

## 9. Dock Behavior

- **Icon-only, permanently.** Labels never appear inline — only as a tooltip on hover, after a short delay (200ms), consistent with how Graphite and VS Code avoid label-flicker on fast mouse travel.
- **Active state is a 2px indicator on the icon's left edge**, plus a slight brightening of the icon itself — never a filled background pill, which would read as a button rather than a mode indicator.
- **Selecting a Dock icon changes what the Sidebar shows**, not what's in the Main Workspace — clicking "Explorer" doesn't open a file, it makes the Sidebar show the file tree. This separation (Dock drives Sidebar content, never Main Workspace content directly) is what keeps open tabs stable and predictable regardless of which module the developer is currently browsing from.
- **No reordering, no customization** in this version — six fixed items is a deliberate constraint that keeps the Dock legible at a glance; a 7th module is a future-scalability question (§12), not a per-user preference question.

---

## 10. Workspace Behavior

- **Everything opens as a tab. Nothing replaces the workspace.** A Knowledge Graph, a Markdown file, a Diff, an Execution trace — all peers in the same TabBar, all closable and reorderable the same way.
- **Tabs opened by the AI's own reading (§11) are visually distinguished** with a small indicator dot until the developer actually looks at them — this is what makes "the AI opened 4 files while investigating" a legible fact rather than a surprise when the developer glances at the TabBar.
- **Pinning** promotes a tab out of the ephemeral, close-on-navigate tier into a persistent one — mirrored in the Knowledge Panel's Pinned Files block, which is the same underlying list, not a separate feature.
- **Closing the last tab never empties the Main Workspace entirely** — a calm, empty-canvas state with the Ask Code Input re-centered (echoing the original Connect screen's restraint) takes its place, so the workspace never shows a dead, blank rectangle.
- **Split view is intentionally absent from this version** — noted here explicitly so it isn't accidentally designed-around; see §12.

---

## 11. AI Reading Experience

This is the product's signature moment, and the most important section in this document.

**The core move:** the Main Workspace's active tab *becomes* the AI's eyes. When a question is asked, CodeScope does not show a spinner and return an answer — it opens the first relevant file as a live Editor tab and **scrolls to it the way a person would**, not an instant jump: a brief camera-pan settles on the relevant region, imports get a single-pass Reveal Highlight, and the Bottom Timeline logs `Opened auth.ts` as that pan begins, not after it completes — the timeline and the visual reading are locked to the same clock.

**Sequencing (per reading step):**
1. Bottom Timeline appends a new `ReadingStep` in an active (accent-marked) state.
2. If the step involves a new file, a new Tab opens (marked with the "AI-opened" indicator dot from §10) and the Main Workspace camera-pans into it.
3. The specific lines/symbols relevant to that step receive a single-pass Reveal Highlight — never a persistent glow, it fades to the muted tier once attention has visibly moved on.
4. The `ReadingStep` transitions to its completed (muted, checked) state the moment the next step begins — there is always at most one active step, so the timeline reads as a single coherent line of attention, not a busy log.
5. On conclusion, the final step Pulse-once's, and the Reasoning Block appears inline in whichever tab is currently active, citing every file touched along the way as Live Object Chips back to the now-open tabs.

**On synthetic vs. real reading:** the specification deliberately treats the *timing and motion grammar* as the product, independent of whether the underlying content is a live parse or a scripted approximation early on — because what makes this feel like understanding, rather than a demo trick, is that the pacing is *humanlike and non-uniform* (a pause on a dense import block, a faster pan through boilerplate) rather than a constant-speed animation. That pacing model is the actual design deliverable here, not the specific files chosen for any given early build.

**What this explicitly is not:** a progress bar with clever copy. The developer is not told the AI is working — they are shown, spatially and specifically, what it's looking at, in the same viewport they'd use to look at it themselves. That equivalence — the AI's reading surface and the developer's own reading surface being the literal same Editor tab — is what separates this from every "Thinking..." affordance in every other AI coding tool.

---

## 12. Future Scalability

- **A 7th+ Dock module** (e.g., a future Execution or Impact module) is accommodated by an overflow affordance at the bottom of the Dock (a `···` icon expanding a short overflow list) rather than shrinking icon size or introducing scroll — preserving the "glanceable, fixed set" feeling even as capability grows.
- **Split view** (two Main Workspace panes side by side) is a deliberately deferred, not rejected, capability — the Tab model already treats every tab as a peer object, so introducing a second TabBar/pane later requires no restructuring of how tabs themselves work, only a new pane-hosting mechanism around them.
- **Multi-repository workspaces:** the Repository Selector in the Command Bar already implies multiple connected repositories are addressable; a future cross-repository question simply produces `ReadingStep`s and tabs tagged with which repository they came from, using the same Timeline and Tab primitives already specified here.
- **Collaborative sessions:** the AI-opened-tab indicator dot pattern (§10) extends naturally to a teammate-opened-tab indicator in a different, muted accent — the visual language for "something changed here that wasn't you" already exists in this spec and does not need to be invented for collaboration.
- **Code editing (beyond today's read-only posture):** the Editor tab's existing structure (file, lines, highlight state) is edit-capable by construction — introducing write access is a capability added to an existing tab type, not a new tab type or a new zone.
- **Execution tracing and Impact Analysis** (from the broader CodeScope/AI Developer OS lineage) map directly onto this workspace as additional tab types (`Timeline`, `Execution`, already listed in §3) rather than requiring new zones — the six-zone frame was designed to be the permanent container for all current and future analysis capability, never itself the thing that grows.

**Governing constraint, consistent with every other document in this product's design history:** every extension above is satisfied by adding a new tab type, a new Dock item, or new metadata on an existing primitive — never a new zone, a new motion primitive, or a second accent color. That closure is what keeps a "premium, calm, focused" IDE from drifting into a cluttered one as the product matures.
