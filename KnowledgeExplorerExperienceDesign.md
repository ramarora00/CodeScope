# Knowledge Explorer — Experience Design
### CodeScope

A repository is not a graph. A graph is one projection of it. Knowledge Explorer's job is to let a senior engineer move fluidly between five ways of asking the same underlying question — "what is this, and what does it relate to" — without ever feeling like they've switched tools. Search, symbols, dependencies, files, and architecture are facets of one comprehension surface, not five separate features bolted together.

---

## 1. Overall Information Architecture

Three layers, always present, never modal:

- **Scope layer** — what repository, branch, and (optionally) subdirectory you're currently reasoning about. Set once, persists across every mode below.
- **Mode layer** — *how* you're currently looking at the code: Search, Symbol, Dependencies, Files, Architecture. These are lenses on the same underlying knowledge, not destinations you navigate away to.
- **Focus layer** — the one thing currently under inspection (a symbol, a file, a module boundary), which every mode reflects back consistently. Selecting a symbol in Search and selecting it in the Dependency view are the same act of focus, just reached differently.

There is no separate "results page." Search doesn't navigate you away from the graph — it narrows what the graph is showing. This is the single architectural decision everything else in this document follows from.

---

## 2. Visual Hierarchy

1. **Focus content** — whatever is currently under inspection (a symbol's detail, a file's contents, a dependency path) is the largest, highest-contrast element on screen.
2. **The current mode's exploration surface** — the graph canvas, the file tree, the symbol list — secondary in weight, always visible alongside focus content, never hidden behind a tab.
3. **Scope and mode controls** — persistent but quiet chrome; recognizable at a glance, never competing for attention once learned.
4. **Metadata and provenance** — reference counts, last-modified, ownership — smallest, always available, never forced into view.

The rule governing all four: **nothing is emphasized by default that isn't earned by relevance to the current focus.** A dependency count is not bold until you're looking at dependencies.

---

## 3. Layout Wireframe (Text)

```
┌───────────────────────────────────────────────────────────────────┐
│ Scope Bar:  [Repository ▾]  [Branch ▾]              [Ask / ⌘K]     │
├───────────┬───────────────────────────────────┬─────────────────────┤
│           │                                     │                     │
│  Mode     │                                     │   Focus Detail      │
│  Rail     │        Exploration Surface          │   Panel             │
│  (icons,  │   (search results / graph / file    │   (appears only     │
│  no text  │    tree / architecture regions,     │    when something   │
│  labels   │    depending on active mode)        │    is selected —    │
│  once     │                                     │    not permanently  │
│  learned) │                                     │    reserved space)  │
│           │                                     │                     │
├───────────┴───────────────────────────────────┴─────────────────────┤
│ Location readout: repo / module / file — quiet, bottom-left           │
└───────────────────────────────────────────────────────────────────┘
```

The Focus Detail panel is the only element that appears and disappears — everything else is permanent, calm furniture. This asymmetry (stable frame, one dynamic region) is what keeps five different modes from feeling like five different apps.

---

## 4. Navigation Hierarchy

- **Scope** (repository/branch) is the outermost, changed rarely, always visible, never buried in a menu.
- **Mode** (Search / Symbol / Dependencies / Files / Architecture) is a small, fixed, icon-driven rail — five items, never more, never a scrolling list. Switching modes never reloads the scope or loses the current focus; if a symbol is focused and you switch from Symbol mode to Architecture mode, that symbol's containing module is what's now highlighted.
- **Focus** is the innermost and most fluid — set by clicking a search result, a graph node, a file, or a reference, and carried across mode switches automatically.

This is a **breadth-first, not depth-first** hierarchy: a senior engineer rarely drills five levels deep and stays there — they dart between modes while holding one focus constant, and the navigation model is built to support darting, not tunneling.

---

## 5. Search Experience

Borrowing the principle behind Sourcegraph's approach without its density, and Linear's command-first instinct without turning search into a command list:

- Search is **always one keystroke away** (`⌘K` or a persistent, unobtrusive field in the Scope Bar) and never a separate page — invoking it narrows the current Exploration Surface rather than replacing the screen.
- Results are **typed and labeled plainly**: Symbols, Files, References, Architecture regions — shown as one ranked list, not tabs, matching the "search should feel like pointing, not filtering" instinct from Linear's palette.
- **Semantic and literal results are not visually separated into two systems** — a semantic match and an exact-string match sit in the same list, ranked by relevance, because the engineer doesn't think in those categories; they think in "is this what I meant."
- Selecting a result **sets Focus** and switches the Exploration Surface to whichever mode best represents that result (a symbol result opens Symbol mode; a file result opens Files mode) — search is an entry point into every other mode, not a sixth destination.
- Search never fully leaves the current context behind: the Scope Bar's repository/branch stays fixed unless the engineer explicitly changes it, so a search is always "search *this*," never a global void.

---

## 6. Graph Experience

The dependency graph is one mode among five, not the screen's identity — this is the core departure from "a graph page."

- **The graph is always scoped**, never a full, unfiltered repository dump on load — it renders centered on the current Focus, expanding outward only as far as is legible, with an explicit, discoverable "expand further" action rather than an overwhelming initial render.
- **Direct manipulation, Figma-style:** pan/zoom/drag are immediate and physical; there is no separate "edit layout" mode.
- **Selection dims, never hides.** Selecting a node spotlights its direct relationships and recedes everything else to low opacity — the surrounding structure stays visible as context, so the graph never feels like it's punishing exploration by losing the bigger picture.
- **Edges carry meaning, not just connection.** Import, call, and shared-data relationships are visually distinct (weight/style, not just color, per accessibility discipline), so the graph reads as an argument about the system, not decoration.
- **The graph and the file tree are the same data, two shapes.** Toggling between Dependencies mode and Files mode with a focus held constant should feel like turning the same object in your hand, not opening a different application.

---

## 7. Empty State

No repository indexed yet, or a search/filter with nothing to show: state the fact and the one useful next step, nothing decorative.

- **No repository connected:** the Exploration Surface shows a single, calm sentence and the one action that resolves it ("Connect a repository to begin"). No feature-tour, no illustration doing the explaining for the text.
- **Search with no matches:** "No matches for [term] in [scope]." with the scope named explicitly, since a senior engineer's first question is always "did it search the right thing," not "why is nothing here."
- **A focused symbol with no dependents:** stated as a fact worth knowing ("Nothing in this repository depends on this"), not styled as an error — an unused symbol is information, not a failure of the tool.

---

## 8. Loading State

- **Never a generic spinner past a couple of seconds.** Indexing, large-graph computation, and semantic search all narrate what's specifically happening ("Resolving symbol references," "Expanding dependency graph") — consistent with treating loading as the product's first demonstration of doing real work, not plumbing to hide.
- **Progressive reveal over blocking waits.** A large dependency graph renders its nearest, most relevant nodes first and settles outward — the engineer can begin reading before the full computation finishes, the same principle Cursor and Sourcegraph both apply to large-result and large-index operations.
- **Search results stream in by type** — fast, local matches (symbol names, open files) appear near-instantly; slower semantic matches append a moment later without reordering what's already visible, so the list never jumps under the engineer's cursor.

---

## 9. Motion Philosophy

Restraint is the philosophy, not absence. Motion exists only to preserve orientation across a change the engineer initiated.

- **Focus changes animate as a spatial shift** (a brief pan/zoom toward the new focus point in graph-bearing modes), never a hard cut — this is what lets the engineer keep a mental map of "where am I in this system" across dozens of focus changes in a session.
- **Mode switches cross-fade the Exploration Surface** while the Scope Bar and Mode Rail stay perfectly still — reinforcing that the frame never moves, only its contents.
- **Selection dimming/spotlighting is instant to engage, gentle to release** — spotlighting a node's relationships happens immediately on hover (no delay that would make direct manipulation feel laggy), but the return to neutral eases out, avoiding a jarring snap.
- **Nothing animates on a timer.** Every motion in this screen is a direct response to an engineer's action — no ambient decoration, no idle animation competing for attention in a tool used for hours a day.

---

## 10. Typography Hierarchy

A small, disciplined scale — the Apple HIG instinct of "a few sizes, used consistently" rather than many sizes used occasionally:

- **Focus title** (symbol name, file name) — largest, medium weight, never bold-for-emphasis beyond this one level.
- **Body/description text** (docstrings, summaries, reference context) — regular weight, generous line height, since this is what's actually read at length.
- **Code** — a distinct monospace tier, used only for actual code/identifiers, never for UI labels, so the eye can instantly distinguish "this is data" from "this is interface."
- **Metadata** (counts, timestamps, paths) — smallest, muted, regular weight — present for reference, never competing with content.
- **Labels** (Mode Rail, buttons) — small, consistent, uppercase avoided (uppercase reads as shouting at sustained daily use) — a quiet, permanent register.

Four sizes, two weights, one monospace tier. Nothing else.

---

## 11. Spacing System

- A single base unit, multiplied consistently, governs every gap in the interface — the Scope Bar's internal padding and the Focus Detail panel's section spacing are drawn from the same scale, not independently tuned.
- **Density increases only within data-dense regions** (a symbol reference list, a file tree) — the frame around those regions stays generously spaced, so density reads as "this content is naturally dense" rather than "this whole screen is cramped."
- **Whitespace is used to group, not decorate.** Related controls (e.g., Repository + Branch in the Scope Bar) sit closer together than unrelated ones (Scope Bar vs. Mode Rail) — proximity does the organizing work instead of dividers and borders wherever possible.
- **The Focus Detail panel's appearance never causes reflow elsewhere** — it occupies a reserved-but-collapsed slot rather than pushing the Exploration Surface's content around every time something is selected.

---

## 12. Interaction Patterns

- **Everything selectable is keyboard-reachable** — arrow-key traversal through search results, graph nodes, and file trees, `Enter` to focus, `Esc` to clear focus without leaving the current mode.
- **Hover previews, click commits.** Hovering a reference or graph node shows a lightweight preview (a popover with the symbol's signature, not a full navigation); clicking sets it as Focus. This two-tier model — borrowed in spirit from Cursor's inline peek and GitHub's hover cards — lets an engineer scan quickly without a chain of full navigations to get back from.
- **Right-click/contextual actions follow one consistent verb set** across every mode: *Explain, Trace references, Open, Copy path* — the same four actions, regardless of whether the object right-clicked is a symbol, a file, or a graph node.
- **Every focus change updates the location readout** at the bottom of the screen, giving a persistent, low-attention answer to "where am I" without requiring a breadcrumb click to find out.
- **Undo-able exploration:** back/forward through Focus history (`⌘[` / `⌘]`) works exactly like browser history, since that muscle memory already exists and this interaction is functionally identical.

---

## 13. How the Page Should Feel

Like sitting down with a colleague who already knows the codebase and is willing to point at exactly the right thing without making you wait or making you feel like you're operating machinery. Calm, precise, unhurried — the feeling of a well-organized reference library, not a control room. Nothing pulses for attention. Nothing is trying to be impressive. Every element on screen is there because it answers a question a senior engineer actually has, and it gets out of the way the moment it doesn't.

The test: after using it for two hours straight, an engineer should feel *more* oriented in the codebase than when they started, and *less* tired than an equivalent two hours spent in a traditional graph tool or IDE search panel.

---

## 14. What Makes This Better Than a Traditional Dependency Graph Page

- **It refuses to be a single visualization wearing a product's name.** A traditional dependency graph page is one view; Knowledge Explorer is one *focus model* expressed through five views, so the engineer never has to mentally reconcile "what I saw in the graph" with "what I saw in search" — they were always looking at the same underlying object.
- **Scoping by default, not by escape hatch.** Most graph tools render everything and make you filter your way to relevance; this renders relevance first and lets you deliberately expand — the cognitive load starts low and grows only on request.
- **Search is a way into the graph, not a competing feature next to it.** In most tools, search and graph exploration are separate tabs with separate mental models; here, a search result *is* a graph focus point, immediately.
- **Motion preserves orientation instead of demonstrating capability.** Traditional graph tools often animate to show off physics or layout algorithms; every animation here exists solely to keep the engineer's mental map intact across a change they made.
- **It respects that senior engineers already have hard-won instincts** — keyboard navigation, hover-to-preview, click-to-commit, browser-style history — and reuses those instincts instead of asking them to learn a bespoke graph-manipulation vocabulary.
- **It treats "nothing found" and "nothing depends on this" as information, not failure** — a traditional graph tool's empty or sparse result often reads as broken; here it reads as a fact worth knowing, because the whole surface is built around answering questions honestly, including when the honest answer is "there's nothing here."
