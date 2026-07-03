# The Product Experience Bible
### AI-Powered Developer Operating System — Frontend Reference

---

## 0. Design Thesis

This is not a dashboard. Not an IDE. Not a chatbot wrapper.

It is an **instrument** — a single surface where a developer perceives a codebase the way a pilot perceives an aircraft, or a trader perceives a market: as one living system, not a stack of disconnected pages.

Three commitments govern every decision below:

1. **Truth over decoration.** Every pixel encodes information. Nothing is drawn because it looks nice — it is drawn because it answers a question the developer has.
2. **One continuous space.** Repository, graph, code, execution trace, and AI reasoning are not separate "pages" you navigate between. They are layers of the same map. Moving between them is panning and zooming, not loading a new screen.
3. **Silence is a feature.** The interface is calm by default and loud only when something needs attention. No pulsing badges for their own sake. No decorative gradients. No motion without meaning.

The emotional target: the quiet competence of a Bloomberg Terminal, the spatial confidence of Vision Pro, the keyboard-first respect of Raycast, the structural clarity of Linear, the direct-manipulation honesty of Figma.

---

## 1. Navigation Philosophy

### The Core Model: One Map, Many Altitudes

There is no traditional nested sidebar navigation. Instead there is **one persistent spatial map of the repository** that the developer zooms and pans through at different altitudes:

- **Orbit altitude** — Mission Control: health, activity, all repos at a glance.
- **System altitude** — Architecture view: modules, services, boundaries.
- **Structure altitude** — Dependency graph: files, packages, imports.
- **Ground altitude** — Code: the actual source, functions, lines.
- **Time altitude** — Execution trace: what actually ran, in what order.

Scrolling/zooming moves between altitudes. There is no "back button" feeling — there is only "zooming out" and "zooming in." This single metaphor replaces tabs, breadcrumbs-as-navigation, and sidebar trees as the primary wayfinding device. Breadcrumbs still exist, but as a **location readout**, not a nav control — the way an altimeter tells a pilot where they are without being how they steer.

### Command Palette as the Nervous System

`⌘K` is not a feature, it is the primary input method. Every action, every navigation, every AI invocation is reachable from it. The palette is aware of **current altitude and selection** — its suggestions change based on what's on screen. Typing "impact" while a function is selected offers "Run impact analysis on `selectedFn`" as the top result, not a generic search hit.

Design reasoning: developers who live in Linear/Raycast never want to reach for a mouse to *navigate*; they only reach for a mouse to *manipulate* (drag a graph node, resize a panel). Keyboard = intent. Mouse = direct manipulation of visual objects.

### Persistent Chrome

A single top strip, always present, three zones only:
- **Left:** Repository switcher (current repo + org, not a logo).
- **Center:** Location readout (breadcrumb-as-altimeter, e.g. `payments-service / billing / InvoiceCalculator.ts:142`).
- **Right:** AI presence indicator (idle / thinking / has-a-suggestion) + global status (indexing, sync).

No left rail of icons. No hamburger. Chrome height stays constant across every altitude — the map underneath changes, the frame around it never does. This constancy is what makes the "one instrument" feeling possible.

---

## 2. Onboarding & Repository Ingestion

### 2.1 First Launch

**Purpose:** Convert a blank canvas into trust within 60 seconds, without a single explanatory modal.

**Hierarchy:** One sentence of purpose. One primary action. Nothing else competes.

**Layout:** Centered, generous negative space — 70% of the viewport is empty. A single input: "Point me at a repository." Below it, ghost-text examples cycling quietly (`github.com/you/api` / `git@...` / drag a folder here).

**Primary action:** Paste a URL or drag a folder.
**Secondary actions:** Connect GitHub/GitLab org (bulk import), browse a demo repo (for evaluation without commitment).

**Motion:** The input field has a slow, almost imperceptible breathing glow — the only animated element on the screen — signaling "this is alive, waiting for you," without being juvenile.

**Psychological feeling:** Confidence, not cleverness. The product should feel like it already knows what it's doing before it's done anything — the way a cockpit feels correct before the engines start.

**Design reasoning:** Most dev tools front-load onboarding with tours and tooltips. We front-load with capability: give it a repo, watch it think. The product proves itself, rather than explaining itself.

**Future scalability:** Same entry screen scales to "add repo to workspace" later — it is never retired, only reused.

### 2.2 The Indexing Experience

This is the single most important emotional moment in the product — it is where trust is built or lost. It must never feel like a progress bar. It must feel like **watching a mind form.**

**Purpose:** Communicate that deep, structural understanding is being built — not a file upload.

**Layout:** The screen transitions (not navigates — *transitions*, camera pulls back) into an emerging, semi-abstract constellation. Nodes appear as files are parsed. Edges draw themselves as imports/dependencies are resolved. This is real data, not a decorative animation — it is literally the dependency graph being built live, at reduced fidelity.

**Visual rhythm:** Distinct phases are named plainly and shown sequentially, each with its own tiny live counter:
1. `Reading files` (counter climbs)
2. `Resolving dependencies` (edges draw)
3. `Building knowledge graph` (clusters form, settle with physics)
4. `Understanding execution paths` (faint traced lines animate through the graph once)
5. `Ready`

**Motion:** Physics-based settling (nodes have mass, edges have tension) — never a spinner, never an indeterminate bar for more than 2 seconds at a time. If a phase is slow, we show *what* is slow ("Resolving 4,200 dependencies in `node_modules`...") rather than hiding it behind vague chrome.

**Interaction model:** Fully interruptible. The developer can start exploring the partial graph *while* indexing continues in the background — nodes update live as understanding deepens. This is critical: never trap the user behind a modal loading screen. Mission Control becomes usable at maybe 20% index completion.

**Microinteractions:** Each completed phase gets a soft, single, low-frequency "settle" sound tick (optional, off by default on web) — echoing NASA telemetry check-ins, not game-like chimes.

**Error state:** If parsing fails on specific files, they render as dim, dashed-outline nodes with a small warning glyph — not a blocking red banner. The graph is *honest about its own gaps* rather than pretending completeness.

**Psychological feeling:** Awe, calm competence. "Something serious is happening on my behalf."

**Design reasoning:** Competitors show a progress bar because indexing is treated as plumbing. We treat it as the product's first demonstration of intelligence — so it's staged like one.

**Future scalability:** Same live-graph-forming visualization is reused for re-index after major pulls, and for CI-triggered re-analysis — establishing one consistent "the system is thinking" motif across the whole product.

---

## 3. Mission Control (Home / Orbit Altitude)

**Purpose:** Answer "is everything okay, and where should I look?" in one glance, across one or many repositories.

**Hierarchy:** Health first, activity second, opportunities (AI-surfaced insights) third. No feature-tile grid.

**Layout:** A single-canvas instrument panel, not cards-in-a-grid. Borrowing directly from Bloomberg/NASA telemetry conventions:
- **Top-left quadrant:** Repository health signature — a compact multi-axis readout (test coverage, dependency freshness, complexity trend, open critical paths) rendered as small sparkline-like glyphs, not big vanity numbers.
- **Center:** The Living Map — a zoomed-out, low-detail rendering of the full architecture graph, tinted by health (cool = stable, warm = attention needed). This is the same graph object used at System altitude — just zoomed out. Clicking anywhere zooms in place.
- **Right rail:** AI Insight Stream — a quiet, timestamped feed of things the AI noticed unprompted ("Circular dependency introduced in `auth/`", "This function's complexity doubled since last week"), each dismissible, each one-click-actionable.
- **Bottom strip:** Recent execution activity — a compact timeline of recent traces/runs, like a Bloomberg ticker tape, scrubbable.

**Visual rhythm:** Everything on this screen is *read-only glanceable* — nothing requires a click to understand. Clicks only ever go *deeper*, never reveal hidden meaning at the same altitude.

**Primary action:** Zoom into the map (click any cluster) or open Command Palette.
**Secondary actions:** Dismiss/act on an AI insight, scrub the activity ticker, switch repository.

**Motion:** The Living Map has extremely slow ambient drift (barely perceptible, like a screensaver of a real system breathing) — never distracting, but proof the system is alive and current, not a static screenshot.

**Interaction model:** Direct manipulation only. No menus for map navigation — scroll to zoom, drag to pan, click to descend.

**Accessibility:** Full state available as a structured, screen-reader-navigable list view toggle (`⌘⇧A`) — health metrics, insights, and activity as an ordered list, not just spatial.

**Microinteractions:** Health glyphs tick over with a subtle counting animation on load, never on every re-render — big numbers should feel earned, not jittery.

**Psychological feeling:** Command, not anxiety. Like stepping into a control room where everything is already being watched — you're arriving to a system already awake, not waking it up.

**Design reasoning:** Traditional dashboards ask you to hunt across tiles. We compress "is it healthy" into a single instrument-panel glance, and treat the map itself as the primary object, because the map *is* the product's core intelligence made visible.

**Future scalability:** Multi-repo orgs simply add more clusters to the same Living Map (a "constellation of constellations") rather than a separate multi-repo mode — the metaphor never breaks.

---

## 4. Repository Switching

**Purpose:** Move between repositories without ever feeling like a page reload or context loss.

**Interaction model:** Invoked via the top-left chrome zone or `⌘R`. Opens a lightweight, keyboard-navigable overlay (not a full page) — a short list of repos with live health glyphs inline, most-recent first, fuzzy-searchable.

**Motion:** Selecting a repo does not "navigate" — the current Living Map cross-dissolves and reforms into the new repo's map, camera pulling back to orbit altitude and back in, echoing the same physics-settle motion as indexing. This reinforces "same instrument, different subject" rather than "new page."

**Secondary actions:** Pin favorite repos to top, open repo in new workspace pane (split view, see §11).

**Psychological feeling:** Continuity. You never "left" the tool, you retargeted it.

**Design reasoning:** Tab-based repo switching (like browser tabs) trains users to think of repos as separate documents. We want repos to feel like different targets for the same telescope.

---

## 5. Architecture View (System Altitude)

**Purpose:** Show how the system is *organized* — services, modules, boundaries, ownership — independent of file-level clutter.

**Layout:** Large canvas, minimal chrome. Modules render as weighted regions (size = code volume or activity, developer-configurable), connected by directional edges showing dependency flow. Grouped by detected domain boundaries (services, packages, layers).

**Zones:** Canvas (95%), a slim left inspector that appears only on selection (never permanently docked, to preserve canvas space), and the persistent top chrome.

**Primary action:** Click a module → zoom into Structure altitude (dependency graph) scoped to that module.
**Secondary actions:** Toggle edge types (imports / API calls / shared data / runtime calls), filter by team ownership, highlight a single flow path through the system.

**Motion:** Zooming into a module is a literal camera zoom (scale + focus, no page transition) — the module's internal graph resolves into detail as you approach, like satellite-to-street-view.

**Interaction model:** Hover a module → its direct dependencies and dependents highlight, everything else dims to 15% opacity (spotlighting, not hiding). This "highlight-and-dim" pattern is used everywhere in the graph system — it becomes a signature interaction language.

**Accessibility:** Every module and edge has an accessible name and relationship description; full graph is also representable as a nested, navigable tree list.

**Microinteractions:** Edge thickness subtly animates (thickens) when data/call volume across it is currently high in production (if runtime telemetry is connected) — turning the architecture diagram into a live instrument rather than a static export.

**Psychological feeling:** Clarity, like seeing a floor plan after only ever having walked the halls.

**Design reasoning:** Most "architecture diagrams" in dev tools are static exports (draw.io-style). Ours is alive, generated from truth, and is the same object as the health map and the dependency graph — one continuous data structure viewed at different zoom levels, never three separate diagrams engineers must mentally reconcile.

**Future scalability:** Same module-region rendering extends naturally to infra/cloud resource mapping later, without new visual vocabulary.

---

## 6. Dependency / Knowledge Graph (Structure Altitude)

**Purpose:** Precise, file- and symbol-level relationship exploration — "what does this depend on, what depends on this."

**Layout:** Force-directed graph canvas, same visual language as Architecture view but finer-grained (files/symbols instead of modules). A persistent but collapsible right-side inspector shows detail for the current selection.

**Primary action:** Select a node → inspector populates with symbol info, dependents/dependencies count, complexity, recent change frequency.
**Secondary actions:** Path-trace between two nodes ("show me how A reaches B" — draws the shortest dependency path, dims everything else), isolate subgraph, export view.

**Interaction model:** Drag to reposition (physics allows manual override, then re-settles others gently around it — never a "frozen" fixed layout, the graph always feels alive). Double-click a node to descend to Ground altitude (source code) at that exact symbol.

**Motion:** Path-tracing animates a pulse traveling along the highlighted edges from source to target — one pulse, not looping — like tracing current through a circuit once to confirm continuity.

**Contextual menu:** Right-click a node → "Run Impact Analysis," "Show Execution Traces Through This," "Ask AI About This," "Open in Code." Every context menu in the product follows this same three-tier pattern: *Analyze / Trace / Ask / Open* — a consistent verb grammar across the whole app.

**Accessibility:** Node list view alternative; path-trace results also rendered as a plain ordered list of hops.

**Psychological feeling:** Investigative confidence — like a detective's board, but one that's already correctly connected the string for you.

**Design reasoning:** Developers currently reconstruct dependency understanding manually by opening files one by one. Externalizing this as a manipulable object turns a mental burden into a visual, interrogable artifact.

**Future scalability:** Same graph engine underlies architecture, dependency, and (with a time axis added) execution views — one rendering system, three semantic lenses.

---

## 7. Execution Tracing (Time Altitude)

**Purpose:** Show what *actually happened* at runtime — not what could theoretically happen per the static graph, but real, observed control flow.

**Layout:** A horizontal timeline is the primary axis (echoing a DAW/waveform editor or Bloomberg's time-series charts) with a synchronized graph view above it — as the playhead moves, the graph highlights exactly which nodes were active at that moment.

**Zones:** Timeline scrubber (bottom, always visible, ~15% height), synchronized graph/call-stack view (main canvas), detail inspector (right, on selection).

**Primary action:** Scrub the timeline to inspect state/flow at any point; play to animate the execution path across the graph in real time.
**Secondary actions:** Compare two traces side-by-side (e.g., before/after a change), filter by service or thread, jump to the exact source line active at the playhead.

**Motion:** Playback speed is adjustable (0.25x–4x, like video), and the "current" node in the graph pulses with a heartbeat rhythm tied to actual call frequency — turning execution into something you can *feel* the rhythm of, not just read.

**Interaction model:** Familiar transport controls (play/pause/step, `space` to play/pause, `←/→` to step frame-by-frame) — borrowing directly from video editing and DAW muscle memory, since developers already have it.

**Microinteractions:** Stepping frame-by-frame gives a light haptic-style visual "tick" on the timeline (a tiny snap animation), reinforcing precision the way a scrub wheel does.

**Psychological feeling:** Forensic clarity — like reviewing flight recorder data after the fact: calm, precise, never alarming even when investigating a failure.

**Design reasoning:** Static dependency graphs answer "what can happen." Only a trace answers "what did happen." Treating this as a *time-based media* interaction (scrub/play/step) rather than a log-dump is what makes it usable for understanding, not just debugging after a crash.

**Future scalability:** Same timeline transport becomes the interface for future features like "replay this incident" or "step through this AI-suggested refactor's projected effects."

---

## 8. Impact Analysis

**Purpose:** Before you change something, show precisely what else changes.

**Interaction model:** Invoked contextually (never a standalone page you navigate to cold) — from a code selection, a graph node, or the command palette ("What breaks if I change this?"). Opens as an overlay panel that keeps the underlying map visible and dimmed, not a full navigation away.

**Layout:** Three-part reading order, top to bottom: **Target** (what you selected) → **Blast radius** (a spotlighted subgraph of everything affected, sized by proximity) → **Risk summary** (plain-language rollup: "3 services, 12 tests, 1 public API surface affected").

**Primary action:** Confirm/proceed with change, or "Ask AI to draft the safe migration."
**Secondary actions:** Expand blast radius to include transitive/indirect effects, export as a checklist, share as a link (for PR description).

**Motion:** The blast radius animates outward from the target in expanding rings (like a sonar ping) — visually literalizing the word "impact" — one clean animation, not looping, ends in a settled state.

**Psychological feeling:** Reassurance through visibility — anxiety about "did I break something" replaced by a concrete, bounded answer.

**Design reasoning:** This is the product's signature "aha" moment — it must never be buried in a menu. It's reachable in two keystrokes from anywhere a symbol is selected, because the value only lands if it's frictionless enough to check *before* every risky change, not just after something breaks.

**Future scalability:** Same panel structure will host future "impact" types — performance impact, security surface impact, cost impact — as new rows in the Risk Summary, not new screens.

---

## 9. Code Exploration (Ground Altitude)

**Purpose:** Read and understand source with full context of everything above it (graph, architecture, execution) always one step away — never isolated like a plain text editor.

**Layout:** Code is centered and generously spaced (not cramped like an IDE — this is a *reading* surface, not an authoring surface first). A slim left gutter shows structural landmarks (functions/classes as a mini outline, not a full file tree by default). A right-edge "context rail" — collapsed by default, expands on demand — shows: callers of the current function, callees, recent change history, and related execution traces.

**Primary action:** Select a symbol → context rail populates instantly; every symbol is clickable to jump to definition (in-place, not a new tab) or trace its graph.

**Secondary actions:** Ask AI inline about a selection, view blame/history inline, open impact analysis, split into Time altitude at this exact line.

**Motion:** Jumping to a definition within the same file soft-scrolls; jumping across files does the same camera-zoom-out/zoom-in transition used everywhere else (through Structure altitude briefly) — reinforcing that you are *moving through the map*, not opening a new document.

**Interaction model:** Selection-first. Selecting any span of code surfaces a minimal, non-blocking floating toolbar (Ask AI / Trace / Impact / Explain) — same three-tier verb grammar as the graph context menu, appearing everywhere selection is possible.

**Accessibility:** Full keyboard navigation of the outline gutter; code itself is standard, screen-reader-compatible text (never rendered as canvas/image).

**Microinteractions:** The context rail's "callers/callees" counts animate in with a light stagger, and hovering a caller name spotlights its call site if visible on screen (cross-panel spotlighting).

**Psychological feeling:** Groundedness — after all the abstraction above, arriving at real code should feel like landing, not like starting over.

**Design reasoning:** We deliberately do not try to be a full IDE. Authoring stays in the developer's existing editor; this surface exists for *comprehension*, so its layout optimizes for reading and cross-referencing, not for typing.

**Future scalability:** Context rail is extensible — future panels (security findings, test coverage per-line) slot into the same right-rail pattern.

---

## 10. The AI Assistant

**Purpose:** A reasoning partner embedded in the map, not a chatbot bolted onto the corner.

**Presence model:** No permanent chat window. The AI has a single, quiet presence indicator in the top-right chrome (idle dot → thinking pulse → has-insight glow). Invoked via `⌘J`, via the floating selection toolbar, or by simply asking a question in the Command Palette.

**Layout when invoked:** A slide-up panel, never a full-screen takeover — the map stays visible and interactive behind it, because the AI's answers are almost always *about* what's on screen, and severing that visual context would break the reasoning. Panel is resizable, dockable to the side, or dismissible with `Esc`.

**Interaction model:** Every AI response that references code/graph/execution renders those references as **live, clickable objects** — not text mentions. If the AI says "this touches three services," those three service names are inline chips that spotlight them on the map when hovered, and navigate to them when clicked. The response is never just prose; it's prose *fused* to the map.

**Primary action:** Ask a question (typed or via quick-suggestion chips based on current context).
**Secondary actions:** Ask it to trace, ask it to explain a diff, ask it to draft a fix, regenerate, save an answer as a note attached to that graph node for teammates.

**Motion:** The thinking state is not a generic spinner — it's a faint, traveling highlight that moves across the actual graph/code regions the AI is currently "looking at" as it reasons, live. This is the single most important trust-building motion in the product: the developer *watches the AI's attention move*, rather than waiting blind.

**Microinteractions:** Streaming text arrives at a measured, readable pace (never a jarring instant dump); inline citations to specific files/lines appear as small superscript chips that expand on hover without navigating away.

**Psychological feeling:** Collaborating with a colleague who has already read the whole codebase — not querying a search engine.

**Design reasoning:** Chat-window AI treats the codebase as invisible context the model "knows about." Here the codebase is the primary visual surface and the AI's reasoning is annotated *onto* it — so trust comes from seeing its attention, not from taking its word for it.

**Future scalability:** The same "attention traveling across the map" motion is reusable for multi-agent or background-task states later (e.g., "AI is currently refactoring X in the background") without inventing new visual language.

---

## 11. Search

**Purpose:** Get to any symbol, file, concept, or past AI conversation in under two seconds.

**Interaction model:** Lives inside the Command Palette (`⌘K`) — there is deliberately no separate search page. Typing immediately shows five ranked result types in clearly labeled but visually unified rows: Files, Symbols, Graph nodes, Past AI answers, Actions. Arrow keys move through all types as one list, not five separate tabs.

**Motion:** Selecting a result and hitting `Enter` performs the same zoom-transition used throughout — search *targets the camera*, it doesn't open a new page.

**Microinteractions:** Fuzzy match characters are subtly bolded in results; the palette remembers and prioritizes recent destinations without needing a separate "recents" tab.

**Design reasoning:** Splitting search from navigation from command execution is what makes most tools feel like a pile of separate features. Here, "search for X," "navigate to X," and "run action on X" are the same gesture at different completion states of one input.

---

## 12. Split View / Multi-Pane Workspace

**Purpose:** Compare two things at once — two repos, two traces, code and graph — without losing the single-map metaphor.

**Interaction model:** Any pane can be split (`⌘\`) into a secondary pane that behaves identically to the primary — same chrome logic, same command palette scoping. Panes are resizable by drag, never fixed ratios.

**Motion:** Splitting animates the existing view compressing sideways (not a jarring re-layout) with the new pane sliding in from the same edge, so it reads as "making room," not "opening a new thing."

**Design reasoning:** Borrowed directly from Arc/Linear's respect for the mouse-drag resize as a first-class interaction, and from Bloomberg's multi-panel-per-monitor philosophy — power users comparing before/after states is a core, not edge-case, workflow.

---

## 13. Notifications & System Status

**Purpose:** Surface only what changes the developer's next action; never accumulate a badge for its own sake.

**Layout:** A single, quiet notification stream reachable from chrome (`⌘⇧N`), not intrusive toasts stacking on screen. Live/urgent items (e.g., "indexing failed," "AI needs clarification mid-task") appear as a single, calm, dismissible banner directly anchored to the relevant map region — never a floating toast disconnected from context.

**Motion:** Banners ease in from the edge nearest their relevant context (top for global, inline for local) and auto-dismiss only if genuinely transient (e.g., "saved") — anything actionable stays until addressed.

**Psychological feeling:** Nothing should ever feel like it's shouting. Even error states use the same restrained visual weight as everything else — color and size communicate severity in small, calibrated steps, not alarm-red spikes.

**Design reasoning:** A Bloomberg Terminal operator or NASA controller is never interrupted by decorative alerts — every alert on a mission-control-grade instrument is real. We hold ourselves to that same bar: if it's not decision-relevant, it's not a notification, it's data available on request.

---

## 14. Empty, Loading, and Error States — System-Wide Rules

**Empty states:** Never a sad illustration. Always a plain sentence describing what *would* be here and the one action to populate it (e.g., Architecture view before indexing completes: "Architecture forms as indexing completes — 40% done" with a live progress readout, not a static placeholder).

**Loading states:** Never a generic spinner beyond 2 seconds. If something takes longer, name what's happening ("Resolving 1,204 symbols") — always the pattern used in §2.2, applied consistently everywhere (graph loading, AI thinking, trace processing).

**Error states:** State the fact, state the consequence, offer the one most likely next action. No blame language, no exclamation points, no red flooding the whole panel — a small, precise marker at the point of failure plus a single-line explanation in the inspector. E.g., a failed-to-parse file is a dim dashed node with "Parse error: unexpected token, line 44" and one action: "Open file."

**Design reasoning:** Consistency of these three states across every one of the dozen screens above is what makes the product feel like *one instrument* rather than a collection of independently-built pages — this is a rule inherited from the Engineering Charter and enforced identically everywhere.

---

## 15. Keyboard Shortcut Philosophy

- **Global verbs stay constant everywhere:** `⌘K` command/search, `⌘J` ask AI, `⌘R` switch repo, `⌘\` split, `Esc` always dismisses the topmost overlay without navigating away from underlying context.
- **Altitude changes are always `⌘+scroll` or `⌘+↑/↓`** — consistent physical gesture for "zoom out / zoom in" regardless of which altitude you're at.
- **No shortcut is ever silently reassigned per-screen.** If `⌘J` means "ask AI" on the graph, it means the same on code, on traces, everywhere — muscle memory must be portable across the entire instrument.
- Full shortcut sheet is itself reachable via `⌘/` and rendered as a live, searchable overlay — not a static help page.

**Design reasoning:** Raycast and Linear's core lesson: shortcuts only build trust if they are *never* contextually inconsistent. A single broken expectation breaks the whole keyboard-first premise.

---

## 16. Accessibility as Structural Principle

- Every spatial/graph view has a fully equivalent structured list/tree alternative, toggle-able with one shortcut (`⌘⇧A`), not a degraded fallback but a first-class parallel representation.
- Color is never the sole encoder of meaning (health, risk, status all pair color with shape/position/label).
- Motion respects `prefers-reduced-motion` globally — physics-settle and camera-zoom transitions collapse to simple cross-fades, timing preserved so orientation isn't lost.
- Full keyboard operability for every interaction described above, including graph node selection and path-tracing (arrow-key node traversal, `Enter` to select).

**Design reasoning:** A mission-control-grade tool that fails a portion of its own engineers isn't mission-control-grade. Accessibility is treated as a structural spec requirement, on par with the Architecture Specification already completed — not a pass applied after visual design is "done."

---

## 17. Motion Language — The Five Signature Animations

Every transition in the product is one of exactly five choreographed motions. No screen invents a sixth. This restraint is what makes the product feel designed by one hand rather than assembled by many teams.

1. **Zoom-transition** — camera pulls back, retargets, pushes in. Used for all altitude changes and navigation.
2. **Physics-settle** — nodes/edges form and settle with mass and tension. Used for graph formation, indexing, new data arriving.
3. **Spotlight/dim** — relevant elements stay full-opacity, everything else fades to ~15%. Used for hover states, path-tracing, AI attention.
4. **Sonar-ping** — a single outward ring, never looping. Used exclusively for "impact"/blast-radius reveals.
5. **Cross-dissolve** — used only for repo switching and major context swaps, always paired with a zoom-transition, never alone.

**Design reasoning:** Constraining the entire motion vocabulary to five reusable primitives (rather than bespoke animation per screen) is the single biggest lever for making a large, complex product feel coherent — this is the same discipline Vision Pro and Linear apply to their motion systems.

---

## 18. Visual Rhythm Summary (Cross-Screen Consistency)

| Layer | Rule |
|---|---|
| Chrome | Constant height, three zones, never scrolls, never hidden |
| Canvas | 90%+ of viewport on every spatial screen; inspectors are overlays, never permanent real estate |
| Color | Reserved for status/health/risk only — never brand decoration |
| Typography | One weight change (regular/medium) carries all hierarchy; size steps are few and large, not many and small |
| Density | Generous by default; density increases only on deliberate user action (e.g., "compact mode" for the graph), never as an ambient default |

---

## 19. Closing Principle

If a screen in this product could be mistaken for a generic SaaS dashboard with the labels swapped out, it has failed the brief. Every screen must be justifiable by the question: **"Could this exist only for a developer operating system, understanding real running software — or could you slap any noun into this layout?"** If the layout survives a noun-swap, redesign it.

This document is the reference. Implementation begins from here.
