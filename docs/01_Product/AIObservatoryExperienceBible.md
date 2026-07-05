# AI Observatory Experience Bible
### The Central Intelligence Workspace of the Developer Operating System

---

## 1. Product Philosophy

### Why this screen exists

Every other screen in this product shows the developer a structure — a map, a graph, a trace. The Observatory is where that structure becomes **answers**. It exists because understanding a codebase is not just a seeing problem, it's a reasoning problem: "why does this work this way," "what happens if I touch this," "what would an expert who has read all of this tell me right now." The Observatory is that expert.

It is not a chat window bolted onto a codebase. It is the room where the whole system's understanding converges into a conversation.

### The emotional goal

**Talking to someone who has already done the reading.** Not a search engine that returns fragments for you to assemble — a colleague who read the entire repository this morning, walked the whole call graph, and is now sitting across from you with informed opinions, sourced evidence, and a memory of everything you've discussed so far this session.

The feeling should never be "I am prompting a model." It should be "I am consulting the one person on the team who knows this system best."

### How developers should feel

- **Heard, not processed.** The interface responds to the specific question asked, not a generic template answer.
- **Shown, not told.** Every claim is backed by something the developer can look at directly — a file, a graph path, a trace.
- **In control, never carried along.** The developer can interrupt, redirect, or dismiss at any point without penalty or lost context.
- **Calm under uncertainty.** When the AI is unsure, that uncertainty is stated plainly, not hidden behind confident-sounding prose.
- **Never alone with the answer.** Reasoning and evidence are visible in parallel — the developer can verify without leaving the room.

---

## 2. User Journey

The Observatory's canonical journey is a single continuous arc. Each stage hands off cleanly to the next; none of them are separate screens.

**Opening the Observatory**
The developer arrives either cold (via `⌘J` from anywhere) or hot (already carrying a selection — a node, a function, an impact result). If arriving hot, the Observatory opens already scoped: the context rail shows what's selected, and a suggestion chip row offers the two or three most relevant questions for that exact object, so the developer never has to explain what they're looking at.

**Asking a question**
The Prompt Composer is the calm, single focal point. Typing is unhurried — no character limits pressing, no urgency styling. As the developer types, the system quietly resolves entities it recognizes (`InvoiceCalculator`, `billing/`) into linkable chips inline, confirming — before the question is even sent — that the system knows what's being asked about.

**AI reasoning**
The moment the question is sent, the Observatory does not go blank and wait. The Reasoning Timeline appears immediately, narrating what the system is doing in plain present-tense steps ("Reading `billing/InvoiceCalculator.ts`," "Tracing 3 callers," "Cross-checking recent execution traces"). Simultaneously, on whatever map/graph is the active host surface, an Attention Overlay traces the AI's literal path of investigation live. The developer is watching the work happen, not waiting for output.

**Evidence**
As reasoning steps complete, they leave behind Evidence Cards — small, dismissible, sourced artifacts (a code excerpt, a graph path, a trace segment) that accumulate in the Evidence Panel before the final answer even arrives. The answer, when it comes, is built *from* these cards, not decorated with citations after the fact.

**Graph highlighting**
Any part of the answer that references a real object in the system — a file, a module, a function, a service — renders as a live chip. Hovering it spotlights the corresponding node on whatever graph is currently open behind the Observatory panel; clicking it navigates there directly, carrying the conversation along in a docked, minimized state rather than closing it.

**Suggested actions**
Every completed answer ends with a small, specific set of next steps drawn from what was just discussed — never a generic "anything else?" The actions are concrete and named for what they do: "Run impact analysis on `InvoiceCalculator`," "Trace this function's recent executions," "Draft a fix for the null case."

**Completion**
There is no explicit "done" state that forces closure. The conversation simply settles — the Reasoning Timeline collapses to a compact summary strip, the Prompt Composer returns to its calm idle state, ready for a follow-up. The developer decides when the conversation is over, not the interface.

---

## 3. Information Architecture

### Panels

- **Prompt Composer** — the single input surface for questions, always present, always the anchor of the screen.
- **Conversation History** — the vertical scroll of past exchanges in the current session, collapsed by default to the most recent 1–2 exchanges with older ones summarized into a thin, expandable rail.
- **Reasoning Timeline** — a live, step-by-step narration of what the AI is currently doing, visible only during active reasoning, then collapsing into a compact receipt.
- **Evidence Panel** — the accumulating set of sourced artifacts (code, graph paths, traces) backing the current answer.
- **Context Rail** — always-visible summary of what the Observatory currently "has in view": selected object, active repository, scope of the current question.
- **Suggested Actions** — the closing row of concrete next steps after each answer.
- **Repository Context Indicator** — a small, persistent readout of which repository/branch the Observatory is reasoning against (critical in multi-repo workspaces).
- **Memory Panel** — an on-demand, collapsed-by-default panel showing what the AI remembers from past sessions relevant to the current one (see §10).
- **Confidence Meter** — a compact, per-answer indicator, never a standalone panel — it lives attached to the answer it describes.
- **Token/Context Usage** — a quiet, peripheral readout (not a warning by default) of how much of the available context window the current conversation is using.

### Objects (cross-panel)

- **Citation Chip** — inline reference to a source, expandable to an Evidence Card without navigating away.
- **Live Object Chip** — inline reference to a real system object (file/symbol/service), spotlights on hover, navigates on click.
- **Evidence Card** — a self-contained, sourced artifact: code excerpt, graph path, or trace segment, with its origin always visible.
- **Reasoning Step** — one line of the Reasoning Timeline: a verb-first present-tense action plus its target.
- **Suggestion Chip** — a single proposed next action, rendered as an inline pill, never a full button.
- **Attention Overlay** — not owned by the Observatory panel itself; drawn onto the host screen's canvas to show live reasoning traversal.

### Interactions

Every object above is either **inspectable** (hover reveals more without commitment), **navigable** (click moves you to the referenced object, conversation persists in the background), or **actionable** (click performs or queues a next step). No object is ever purely decorative — if it's on screen, it does one of these three things.

---

## 4. Screen Layout

The Observatory is a **panel, not a page** — it never fully occupies the viewport by default, because its answers are almost always about something else on screen, and severing that visual context breaks the reasoning's credibility.

**Top:** A slim header strip within the panel — repository/context indicator on the left, Memory + Token Usage as quiet peripheral glyphs on the right, close/dock controls at the far right. This is the only chrome that never scrolls.

**Left (when expanded to full-panel width):** Conversation History rail — thin, collapsed to summaries, expandable per-exchange. On narrower dockings, this rail hides entirely and is reachable via a small "history" affordance instead, to protect space for the live conversation.

**Center:** The living conversation — Reasoning Timeline (during active thinking) transitioning into the Answer with inline chips, sitting above the Evidence Panel, which is visually secondary but always physically present, never hidden behind a tab. Evidence should be *readable in peripheral vision* even while attention is on the answer text — this is what separates "sourced" from "trust me."

**Right:** Context Rail — what's currently selected/scoped, pinned open when the Observatory was invoked with a selection, collapsible otherwise.

**Bottom:** Prompt Composer — fixed, always visible, never pushed off-screen by a long conversation. Suggested Actions render as a row directly above the Composer, so the natural reading path ends exactly where the next action begins.

**Spacing & hierarchy:** Generous vertical rhythm between reasoning steps and evidence cards — density increases only within an Evidence Card itself (code excerpts are dense; the frame around them is not). The Answer text is the largest, highest-contrast content on the panel; everything else (timeline, evidence, chips) is deliberately quieter so the answer is never competing with its own supporting material.

**Priorities, in order:** 1) the current answer or in-progress reasoning, 2) the Prompt Composer (always reachable), 3) evidence, 4) context/history, 5) peripheral meters (confidence, tokens, memory).

---

## 5. Objects — Complete Reusable Set

- **Prompt Composer** — input surface; resolves recognized entities into chips as you type; carries a small scope indicator ("asking about: `InvoiceCalculator`") when hot-launched.
- **Context Rail** — current selection, active repo/branch, scope of question.
- **Reasoning Timeline** — live step narration; collapses to a compact, expandable receipt once answered.
- **Reasoning Step** — one narrated unit of work within the timeline.
- **Evidence Panel** — the accumulating, always-visible set of Evidence Cards.
- **Evidence Card** — sourced artifact (code / graph path / trace segment) with origin label.
- **Suggested Actions** — closing row of concrete next steps.
- **Citation Chip** — inline, expandable source reference within answer text.
- **Live Object Chip** — inline, navigable reference to a real system object.
- **Conversation History** — collapsed rail of prior exchanges this session.
- **Repository Context Indicator** — persistent readout of which repo/branch is in scope.
- **Confidence Meter** — compact, per-answer certainty indicator.
- **Memory Panel** — on-demand surface of relevant remembered context from past sessions.
- **Token Usage Indicator** — quiet, peripheral context-window readout.
- **Attention Overlay** — the traveling highlight drawn onto the host canvas during reasoning (lives outside the panel, but is an Observatory-owned object).
- **Answer Block** — the composed response itself: prose fused with chips, never plain unstructured text.
- **Docking Control** — governs whether the Observatory is slide-up, side-docked, or full-screen.
- **Cancel/Interrupt Control** — always available during active reasoning, never buried.

---

## 6. States

**Idle** — Composer calm and empty, ghost-text suggestions rotate quietly based on current context (e.g., "Ask what calls this" if a function is selected). No timeline, no evidence panel visible yet — they only appear once a question is asked, so the idle state stays uncluttered.

**Typing** — Entity-resolution chips form inline as recognized names are typed; a subtle scope confirmation ("about `billing/`") appears beneath the input without being asked.

**Thinking** — Reasoning Timeline is the dominant visual element; Attention Overlay is active on the host canvas; Cancel control is prominent, not hidden in a menu; nothing else the developer can do is blocked — the underlying screen stays fully interactive.

**Streaming** — Answer text arrives at a measured, readable pace; Evidence Cards that back the current sentence being written animate into the Evidence Panel in sync, so evidence never trails or leads the claim it supports by more than a beat.

**Cancelled** — Whatever was generated up to the interruption point remains, marked plainly as partial ("Stopped — partial answer"), with a one-click "continue" affordance rather than forcing a full re-ask.

**No Context** — The question references something the system has no indexed knowledge of. Stated plainly: "I don't have indexed information about that yet," paired with the one useful next step (e.g., "index this repository" or "try rephrasing with a file or function name").

**Large Context** — When a question's scope is unusually broad (e.g., "explain the entire codebase"), the Observatory doesn't silently truncate — it states the scoping decision it made ("Focusing on the 5 most central modules — ask about a specific area for more depth") so the developer understands why the answer isn't exhaustive.

**Repository Missing** — If the Observatory is invoked before any repository is connected, Composer disables and a single, calm prompt routes to the ingestion flow — never a dead input the developer can type into uselessly.

**Offline** — Connectivity lost mid-session: the Composer visibly (but quietly) disables, existing conversation remains fully readable, and a small persistent notice explains reconnection is automatic — never an alarming full-panel error.

**Error** — A reasoning step fails (e.g., a tool call errors): stated at the specific step in the Reasoning Timeline where it occurred, not as a generic top-level failure — the rest of the answer, if partially formed from completed steps, is still presented, clearly labeled as partial.

**Recovered** — After reconnection or error resolution, a brief, quiet confirmation ("Reconnected — you can continue") replaces the disabled state, and the Composer regains focus automatically so the developer doesn't lose their place.

**Empty** — First-ever open of the Observatory for a repository, no conversation history exists: Suggested Actions row populates with genuinely useful repo-specific starters (not generic examples) drawn from what the system already knows is notable (e.g., "Ask about the most complex module").

---

## 7. Motion Language

The Observatory uses the same five system-wide motion primitives as the rest of the product (Zoom-transition, Physics-settle, Spotlight/dim, Sonar-ping, Cross-dissolve), applied specifically as follows — no new motion vocabulary is introduced for this screen.

- **Opening/closing the panel:** slide + fade, anchored to the edge it's docked to; never a hard cut.
- **Streaming text:** measured character/word arrival, matched to a natural reading pace — never instant dump, never so slow it feels artificial.
- **Reasoning Timeline steps:** each new step eases in from below with a slight settle (Physics-settle primitive), and the just-completed step visually recedes (lower contrast) as the next becomes active — reads as forward progress, not a growing wall of text.
- **Evidence Cards arriving:** soft scale-and-fade entrance, timed to the sentence they support.
- **Citation/Object chip hover:** Spotlight/dim primitive — the referenced object on the host canvas brightens, everything else dims, exactly as used in the Graph screens; this consistency is what makes the chip feel connected to a real object rather than a styled link.
- **Selection/focus states:** a single, consistent focus ring treatment across every interactive object in the Observatory — Composer, chips, suggestion pills, cards — so keyboard users experience one visual language, not several.
- **Suggested Actions appearing:** staggered, brief entrance after the answer settles — never appearing simultaneously with the final line of streaming text, so they read as "next," not "also."
- **Cancel/interrupt:** immediate, no exit animation on the timeline itself — interruption should feel instantly responsive, not softened.
- **Docking transitions** (slide-up ↔ side-dock ↔ full-screen): Cross-dissolve paired with a positional slide, consistent with how repository switching is handled elsewhere.

---

## 8. AI Experience

**How answers appear:** As structured prose fused with live objects — never a wall of plain text with citations tacked on afterward. An answer is composed of sentences, Live Object Chips, and Citation Chips woven together, so reading the answer and verifying it are the same continuous motion, not two separate tasks.

**How reasoning is visualized:** As a narrated, present-tense timeline of real actions ("Reading X," "Tracing Y," "Comparing Z") paired with the Attention Overlay moving across the actual map — reasoning is shown as *work happening on the real system*, not an abstract "thinking..." affordance.

**How evidence is presented:** As standalone, sourced cards that persist in the Evidence Panel independent of the answer's prose — a developer should be able to scan the evidence alone and reach a similar conclusion the answer did, which is the real test of whether evidence is genuine or decorative.

**How citations are shown:** Inline, minimal, and expandable in place — a Citation Chip never navigates away by default; a click expands it to its full Evidence Card inline, and only a deliberate second action ("open in Code") leaves the Observatory.

**How graph nodes are highlighted:** Through the same Spotlight/dim language used across the whole product — hovering any object reference dims everything irrelevant on the host canvas and brightens the referenced node(s), so the connection between "the AI said this" and "this is where that lives" is immediate and visual, not just textual.

**How confidence is communicated:** Plainly, in language before iconography. A Confidence Meter is a small, calm indicator attached to the specific claim it qualifies, using three honest tiers — "confirmed by evidence," "inferred, not directly verified," "uncertain — worth checking" — never a bare percentage without explanation, and never omitted when confidence is genuinely low. Hedged answers say so in the sentence itself, not just in a badge.

---

## 9. Interaction Rules

**Keyboard:**
- `⌘J` — open/close the Observatory from anywhere.
- `Enter` — send the current question; `Shift+Enter` — new line within the Composer.
- `Esc` — cancel active reasoning if streaming; otherwise closes the panel.
- `↑` (on empty Composer) — recall the previous question for editing.
- `Tab` — cycles through inline chips within the current answer in reading order.
- `⌘⇧M` — toggle the Memory Panel.
- `⌘.` on a focused chip — navigate to the referenced object directly.

**Mouse:**
- Hover any chip — spotlight-and-preview without navigation.
- Click a Live Object Chip — navigate, conversation docks and persists.
- Click a Suggestion Chip — queues that action (may open Impact Analysis, may pre-fill a new question, may trigger a trace).
- Drag the panel edge — resize; drag the panel header — redock (side ↔ bottom ↔ float).

**Accessibility:**
- All streamed content is exposed via an ARIA live region at a considerate verbosity level (announces completion, not every token).
- Every chip is a standard focusable, labeled element — never a bare styled span.
- Confidence and state information is never color-only — paired with explicit text in all cases.
- Full keyboard operability for cancel, dock, and navigate actions — no mouse-only affordances anywhere in this screen.

**Power-user workflow:** Rapid-fire follow-up questions should never require re-establishing context — the Composer retains scope from the prior exchange until explicitly changed, so "and what about the caller?" works without re-specifying the module. Multi-step investigations (ask → trace → impact → ask again) are expected to happen without ever fully leaving the Observatory panel, using Suggested Actions as the connective tissue between it and the Graph/Trace/Impact screens.

**Command Palette integration:** The Palette can invoke the Observatory pre-filled with a question directly ("Ask AI: what calls this"), and past Observatory answers are indexed as a first-class result type in Global Search — a prior answer is as reachable as a file or symbol, never siloed inside conversation history only.

---

## 10. Future Expansion

**Memory:** The Memory Panel grows from "relevant past answers" into a persistent, developer-editable model of standing context — team conventions, prior architectural decisions, previously-flagged concerns — surfaced automatically when relevant rather than requiring manual recall.

**Agents:** The Reasoning Timeline's step-based structure is designed to extend naturally into multi-step autonomous task execution — a future "AI is refactoring X in the background" status reuses the same Attention Overlay and timeline pattern already established here, so agentic work never needs a new visual language.

**Multi-repository reasoning:** The Repository Context Indicator extends to show reasoning that spans repositories ("checked 2 repos"), with Evidence Cards labeled by their source repo, keeping the same single-conversation model rather than forcing repo-by-repo context switching.

**Voice:** The Composer's entity-resolution behavior (recognizing `InvoiceCalculator` as you type) extends to spoken input — voice becomes an alternate input modality into the exact same Composer object, not a separate interface.

**Code execution:** Evidence Cards gain a new subtype — "executed result" — sitting alongside code/graph/trace evidence, so a future "run this to verify" capability reads as more evidence, not a different kind of interaction.

**Diff generation:** Suggested Actions gain a "draft the fix" action type that produces a reviewable diff inline as a new Evidence Card subtype — reviewed and accepted/rejected without leaving the Observatory.

**PR review:** The same Answer/Evidence/Suggested-Action structure becomes the basis for a future "review this PR" mode — the PR's diff becomes the object under discussion, and the entire Observatory experience (reasoning, evidence, citations, confidence) applies unchanged to reviewing someone else's change rather than exploring the existing system.

**Governing principle for all expansion:** Every future capability must be expressible as a new *subtype* of an existing object (a new Evidence Card kind, a new Suggested Action kind, a new Reasoning Step kind) rather than a new screen or a new interaction pattern. This is what keeps the Observatory feeling like one coherent expert across years of feature growth, rather than an accumulation of separate AI features.

---

## Closing Principle

If a developer ever has to ask "wait, is it done thinking?" or "where did that come from?" or "what does this have to do with my code?" — the Observatory has failed. Every state in this document exists to make those three questions unnecessary to ask, because the answer is always already visible.
