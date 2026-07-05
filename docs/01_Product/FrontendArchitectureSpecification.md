# Frontend Architecture Specification
### The Frontend Constitution — AI Developer Copilot

This document does not design UI. It defines **who is allowed to own what, and how those owners are allowed to talk to each other.** Every screen already designed (Mission Control, Repository Graph, AI Observatory, Impact Analysis, Execution Explorer, Repository Explorer, Workspace, Settings) is built as a **Feature** that obeys this constitution. Where a design document and this constitution ever conflict on a matter of ownership or communication, this document wins — vision documents describe experience, this document describes law.

---

## 0. Architecture Principles

1. **Features do not know about each other.** A Feature may know the *shape* of an event or a shared object's public contract. It may never import another Feature's internals, mount another Feature's screen, or reach into another Feature's local state.
2. **AppShell is the only composer.** Screens are composed, routed, and overlaid exclusively by AppShell. No Feature decides what else is on screen alongside it.
3. **State lives at the lowest ownership level that still satisfies every consumer.** Nothing is global by default. Something is promoted to global state only when two or more Features genuinely need to observe the same live value.
4. **Communication is by event and contract, never by reference.** If Feature A needs to affect Feature B, it emits an event AppShell routes — it never holds a handle to B.
5. **Overlays belong to AppShell, unconditionally.** Anything rendered on top of, or spatially independent of, a single Feature's own bounds is an AppShell responsibility. This is the rule that makes cross-feature highlighting, tooltips, and modals possible without coupling.
6. **Every architectural decision optimizes for the 500k-line state of this codebase**, not the first-launch state. If a shortcut would only work while the app is small, it is rejected here.

---

## 1. AppShell Ownership

**AppShell owns:**

- **Routing** — which Feature is mounted for the current URL/navigation state.
- **Mounted Screen** — the single active top-level Feature occupying the primary viewport.
- **Overlay Layer** — AttentionOverlay, SelectionOverlay, tooltips (see §5).
- **Modal Layer** — any content that blocks or partially blocks interaction with the mounted screen.
- **Global Keyboard Shortcuts** — `⌘K`, `⌘J`, `⌘R`, `⌘\`, and any shortcut meaningful from anywhere. Feature-local shortcuts (e.g., timeline scrubbing keys inside Execution Explorer) remain owned by that Feature.
- **Toast/Notification Layer** — per the Product Experience Bible's notification rules; no Feature renders its own toast.
- **Providers** — theme, auth/session context, feature-flag context, the global Event Bus provider.
- **Event Bus** — the single instance; AppShell creates it, Features only consume it.
- **Docking** — panel docking behavior (side/bottom/float) for dockable Features like AI Observatory.
- **Theme** — design tokens, dark/light mode, motion-reduction preference propagation.
- **Global Layout** — TopChrome, the persistent frame described in the Product Experience Bible, and the coordinate space overlays are drawn into.

**AppShell must never own:**

- Feature-internal state (e.g., which node is hovered inside Repository Graph).
- Feature-specific business logic (e.g., how impact blast-radius is computed).
- Data fetching or caching for any Feature's content.
- Knowledge of *what* a Feature's UI looks like beyond its mount point and declared overlay targets.
- Direct references to another Feature's internal component tree.

AppShell is thin by design. Its job is orchestration and shared surface ownership — never domain logic.

---

## 2. Feature Ownership Matrix

| Feature | Purpose | Owns | Consumes | Cannot Modify | Can Emit | Can Subscribe To | Dependencies | Lifecycle | Destroy Conditions | Persistence |
|---|---|---|---|---|---|---|---|---|---|---|
| **Mission Control** | Orbit-altitude health overview | LivingMap render state, HealthSignaturePanel data, InsightStream | Repository health data (via shared data provider, not another Feature) | Any other Feature's state | `navigateToModule`, `dismissInsight` | `repositoryHealthUpdated` | Shared Objects, GraphCanvas primitive | Mounted on app entry / repo switch; suspended (not destroyed) when navigating away | Explicit repository disconnect only | Session (view state), none persisted beyond user's last altitude preference |
| **Repository Graph** (Overview Observatory + Knowledge Graph altitudes) | Structural/dependency exploration | Graph layout view-state, node/edge selection, zoom/pan viewport | Node/edge data (via shared data provider) | AI Observatory's conversation state | `highlightNode`, `highlightPath`, `nodeSelected`, `focusFile` | `highlightNode`, `highlightPath`, `clearSelection` | GraphCanvas primitive (shared), Shared Objects | Mounted on altitude navigation; viewport state persists across mount/unmount within a session | Repository switch | Session (viewport position per repository) |
| **AI Observatory** | Reasoning workspace | Conversation/investigation state, WorkspaceTabBar, EvidencePanel, ExecutionQueue | Selection context (via shared context provider), Graph node metadata (read-only, via contract not import) | Repository Graph's viewport or selection directly | `highlightNode`, `highlightPath`, `openConversation`, `runExecution`, `focusFile` | `selectionChanged`, `repositorySwitched` | Shared Objects, Event Bus | Mounted via `⌘J` or docked persistently; investigations persist across dock/undock | Explicit "end session" or repository disconnect | Persistent (investigation history, memory) + session (active tab) |
| **Workspace** (multi-pane host, §12 of Bible) | Hosts split-pane arrangements of other Features | Pane layout, split ratios | Nothing from child Features beyond their mount contract | Any child Feature's internal state | `paneSplit`, `paneClosed` | None required | AppShell composition API | Mounted when any split is active; destroyed when the last split closes | User closes all but one pane | Session only |
| **Impact Analysis** | Pre-change blast-radius overlay | BlastRadiusCanvas state, RiskSummary computation view-state | Selected target (via contract), Graph structural data | Graph or Observatory state directly | `impactComputed`, `requestGraphContext` | `targetSelected` | GraphCanvas primitive, Shared Objects | Mounted as an AppShell-owned overlay (see §5) on invocation | Dismiss / Esc / action confirmed | None — always a fresh computation |
| **Execution Explorer** | Runtime trace timeline | Timeline/playback state, trace selection | Trace data (via shared data provider) | Any other Feature | `highlightNode` (active-node-at-playhead), `focusFile` | `traceSelected` | GraphCanvas primitive, Shared Objects | Mounted on trace selection from Mission Control ticker or Observatory action | Trace deselected / repository switch | Session (last playhead position per trace) |
| **Settings** | Configuration | Form state, integration status view-state | Integration status (via shared data provider) | Any other Feature's runtime state | `settingChanged` | None required | Shared Objects only | Mounted via route/palette | Navigated away (auto-saved fields) | Persistent (all settings) |
| **Repository Explorer** | Code reading surface | CodeSurface state, OutlineGutter state, ContextRail contents | File content (via shared data provider), selection context | Any other Feature | `focusFile`, `nodeSelected` (from code selection), `openConversation` (Ask AI) | `focusFile` | Shared Objects | Mounted on file navigation from any Feature | File closed / repository switch | Session (open file, scroll position) |

**Reading the matrix:** "Consumes" is always through a shared data provider or an explicit contract — never a direct import of another Feature's module. "Cannot Modify" is stated explicitly per row because it is the most commonly violated rule in large frontends; stating it per-feature makes it reviewable in every PR.

---

## 3. State Ownership

| State Category | Definition | Owner | Lifetime | Who May Modify | Who May Observe |
|---|---|---|---|---|---|
| **Global State** | True app-wide facts: current repository, current user/session, theme, feature flags | AppShell (via top-level providers) | App session | AppShell only (Features request changes via events, e.g. `switchRepository`) | All Features (read-only) |
| **Feature State** | A single Feature's own domain state (graph viewport, conversation history, form values) | The owning Feature exclusively | Feature mount lifetime, or longer per the Persistence column in §2 | Only the owning Feature | The owning Feature; other Features only see what's exposed via emitted events, never the state itself |
| **Ephemeral UI State** | Hover, focus, in-progress drag, transient animation state | The specific component instance | Single interaction | That component only | Not observable outside the component; if another Feature needs to react to it, it must be promoted to an emitted event, not read directly |
| **Session State** | Survives navigation within one app session but not a reload: viewport positions, open tabs, scroll positions | The owning Feature, registered with AppShell's session-state registry for restoration on remount | Browser session | Owning Feature | Owning Feature only |
| **Persistent State** | Survives reload: settings, AI memory, investigation history | The owning Feature, written through a shared persistence provider (not a direct storage call) | Indefinite, until explicit user action | Owning Feature, via the shared persistence provider's write API | Owning Feature via the same provider's read API; cross-feature access requires an explicit shared provider contract (e.g., Settings exposing a read-only "current theme preference" to AppShell) |

**Rule of promotion:** State moves from Feature-owned to Global only when at least two Features have a demonstrated, current need to read the same live value — never in anticipation of future need. Speculative globals are the single most common source of unmaintainable state after 500k lines, and are explicitly forbidden by this constitution.

---

## 4. Communication Rules

**Forbidden, unconditionally:**

- Feature A importing any module from Feature B's internal directory.
- Feature A holding a reference to a mounted instance of Feature B.
- Feature A reading Feature B's local state through any shared store keyed by Feature B's internals.
- Any Feature mounting another Feature's screen component directly.

**Required, as the only sanctioned channels:**

- **Event emission** through the global Event Bus (§6) — the default channel for "something happened, anyone interested can react."
- **Shared providers** (§7) — for read-only, broadly-needed data (repository identity, theme, current user).
- **Shared stores** — only for the specific, named Global State items in §3; never a general-purpose cross-feature store.
- **Callbacks passed down by AppShell at mount time** — used only when AppShell itself is composing a Feature into a specific slot (e.g., Workspace passing a `onPaneFocus` callback to a hosted Feature) — this is AppShell-to-Feature, never Feature-to-Feature.
- **Contracts** — a documented, versioned shape (e.g., "a GraphNode reference contract") that multiple Features agree to produce/consume without either importing the other.

### Communication Matrix

| From ↓ / To → | Mission Control | Repository Graph | AI Observatory | Impact Analysis | Execution Explorer | Settings | Repository Explorer |
|---|---|---|---|---|---|---|---|
| **Mission Control** | — | Event (`navigateToModule`) | — | — | Event (ticker → `traceSelected`) | — | — |
| **Repository Graph** | — | — | Event (`nodeSelected`) | Event (`requestGraphContext` response) | — | — | Event (`focusFile`) |
| **AI Observatory** | — | Event (`highlightNode`, `highlightPath`) | — | Event (`requestGraphContext`) | Event (`highlightNode` at playhead) | — | Event (`focusFile`, `openConversation`) |
| **Impact Analysis** | — | Event (`impactComputed` → graph re-render) | Event (`impactComputed` → Observatory evidence) | — | — | — | — |
| **Execution Explorer** | — | Event (`highlightNode`) | — | — | — | — | Event (`focusFile`) |
| **Settings** | Shared provider (theme, flags) → all | (same) | (same) | (same) | (same) | — | (same) |
| **Repository Explorer** | — | Event (`nodeSelected` from code) | Event (`openConversation`) | — | — | — | — |

Every cell is either an event, a shared provider, or empty (no sanctioned channel exists because no legitimate need does). This table is the enforcement artifact for code review: a PR introducing a cross-feature call not represented in this matrix is a constitutional violation, not a style nitpick.

---

## 5. Overlay Architecture

**Why overlays belong to AppShell, never to Features:** An overlay's defining property is that it is spatially or contextually independent of the Feature that triggered it — it draws on top of, or across, surfaces the triggering Feature doesn't own. If a Feature owned its own overlay, every other Feature that needed to be drawn on top of would need to grant it access — recreating exactly the tight coupling this constitution exists to prevent. By making the overlay layer AppShell's, any Feature can request an overlay without ever knowing what's underneath it.

**Overlay Layer inventory:**

- **AttentionOverlay** — the traveling-highlight/spotlight drawn onto whatever canvas-bearing Feature is currently mounted (Repository Graph, Execution Explorer), triggered by AI Observatory's reasoning activity.
- **SelectionOverlay** — the glass inspector chip shown for a selected graph node (per the Repository Graph Canvas spec); technically hosted by AppShell's overlay layer even though it visually "belongs" to Repository Graph, because it must be able to render above Impact Analysis or AI Observatory panels docked alongside it.
- **Tooltip Layer** — every tooltip in the product, regardless of triggering Feature, renders through one shared tooltip layer so z-index and dismissal behavior are consistent app-wide.
- **Modal Layer** — Impact Analysis (in its full-screen responsive state), confirmation dialogs, any blocking surface.
- **Command Palette** — the ultimate cross-cutting overlay: it must be able to trigger navigation into any Feature and invoke AI Observatory directly, which only AppShell has standing to do.

**How AttentionOverlay highlights Repository Graph objects without depending on Repository Graph — the critical mechanism:**

1. AI Observatory, during an active investigation step, emits `highlightNode({ nodeId })` or `highlightPath({ nodeIds[] })` onto the Event Bus. It does not know or care whether Repository Graph is currently mounted.
2. AppShell's Overlay Layer subscribes to these events unconditionally.
3. **If** a canvas-bearing Feature (Repository Graph or Execution Explorer) is currently mounted, AppShell's overlay layer queries that Feature's registered **canvas coordinate contract** — a small, stable public API every canvas-bearing Feature must expose (`resolveNodePosition(nodeId) → {x, y}` in current viewport space) — and paints the AttentionOverlay at that resolved position, in a layer stacked above the Feature but owned by AppShell.
4. **If no canvas is mounted**, the event is simply not visualized spatially — AI Observatory's own in-panel reasoning narration still communicates the same information textually, so no functionality is lost, only the spatial highlight.
5. Repository Graph never receives a direct call from AI Observatory. It only ever implements and exposes the coordinate contract — a Feature-agnostic interface, not a bespoke integration with Observatory specifically. This is what allows Execution Explorer to be highlighted by the exact same mechanism without any Observatory-to-Execution-Explorer-specific code existing anywhere.

This coordinate-contract pattern is the single most important mechanism in this document — it is what lets "AI highlights things on the graph" exist as a product capability without AI Observatory and Repository Graph ever importing one another.

---

## 6. Event System

**Global Event Bus:** a single, AppShell-owned, provider-distributed pub/sub channel. Every Feature receives a reference to it via context at mount time — never instantiates its own.

### Supported Events (canonical set)

| Event | Emitted By | Listened To By | Payload Shape (conceptual) |
|---|---|---|---|
| `highlightNode` | AI Observatory, Execution Explorer, Impact Analysis | AppShell Overlay Layer | `{ nodeId, source }` |
| `highlightPath` | AI Observatory, Impact Analysis | AppShell Overlay Layer | `{ nodeIds[], source }` |
| `clearSelection` | Any Feature, Command Palette | Repository Graph, AppShell Overlay Layer | `{ }` |
| `openRepository` | Mission Control, Command Palette | AppShell (routing), all Features (reset) | `{ repositoryId }` |
| `focusFile` | Repository Graph, AI Observatory, Execution Explorer | AppShell (routing to Repository Explorer), Repository Explorer | `{ filePath, line? }` |
| `openConversation` | Any Feature (selection toolbar "Ask AI") | AppShell (mounts/focuses AI Observatory), AI Observatory (pre-fills scope) | `{ scope }` |
| `runExecution` | AI Observatory (ExecutionQueue) | AppShell (routes to relevant Feature: Impact Analysis, a future PR system) | `{ actionType, targetId }` |
| `nodeSelected` | Repository Graph, Repository Explorer | AI Observatory (context), Impact Analysis (target) | `{ nodeId, kind }` |
| `traceSelected` | Mission Control, AI Observatory | AppShell (mounts Execution Explorer) | `{ traceId }` |
| `impactComputed` | Impact Analysis | AI Observatory (evidence), Repository Graph (re-render) | `{ targetId, affected[] }` |
| `settingChanged` | Settings | Shared providers (theme, flags) | `{ key, value }` |
| `repositoryHealthUpdated` | Shared data provider (not a Feature) | Mission Control | `{ repositoryId, metrics }` |

**Ownership rule:** AppShell owns the Event Bus instance and the canonical event-name registry (this table). A Feature may not emit an event not listed here without this document being amended — this is what prevents "shadow protocols" where two Features invent an ad hoc event between themselves that no one else can discover.

**Emit vs. listen discipline:** Any Feature may emit any canonical event relevant to its role (per §2's "Can Emit" column). Any Feature may listen to any event — listening is unrestricted, since it can never cause a coupling problem the way importing internals can. Only emission is governed.

---

## 7. Shared Objects

| Directory | Contents | Allowed | Forbidden |
|---|---|---|---|
| `shared/ui` | Design Primitives (Section 10.1 of the Engineering Construction Blueprint): `ActionButton`, `LabelText`, `StatusDot`, etc. | Pure, stateless, style-only components any Feature may import freely | Any primitive containing Feature-specific business logic or knowledge of a specific Feature's data shape |
| `shared/objects` | Cross-feature composite objects: `GraphCanvas` engine, `SelectionInspector` shell | Composite, reusable objects instanced with Feature-provided data via props/contract | Objects that import a specific Feature to know how to render its data — composites must stay data-shape-agnostic |
| `shared/providers` | Theme, session/auth, feature flags, persistence provider, Event Bus provider | Read access for all Features; write access restricted per §3 | A provider that exposes a write API to arbitrary Feature-specific state |
| `shared/hooks` | Reusable behavior: `useGraphViewport`-style hooks, `useKeyboardShortcut`, `useOverlayTarget` | Any Feature may import; hooks must remain Feature-agnostic | A hook that hardcodes a specific Feature's event names or data shape |
| `shared/utils` | Pure functions: formatting, math, color-tinting logic | Freely importable, must be side-effect-free | Utils that call the Event Bus or touch global state |
| `shared/constants` | Motion primitive definitions, the canonical Event Name registry (§6), design tokens | Freely importable | Feature-specific magic values that belong in that Feature's own module |
| `shared/icons` | The icon/glyph set (`HealthGlyph`, `KindGlyph`, `SeverityGlyph` visual assets) | Freely importable | Feature-specific iconography that isn't reused |
| `shared/store` | Only the named Global State items from §3 | Read by all Features; written only by AppShell or via explicit event-driven updates | A general-purpose store any Feature can dump state into — this directory must never become a dumping ground; if a value doesn't qualify as Global State per §3's promotion rule, it does not belong here |

**The forbidden pattern to guard against at 500k lines:** `shared/store` slowly accumulating Feature-specific slices because it was "easier" than wiring an event. This constitution treats that as the primary long-term architectural risk and names it explicitly so future reviewers have language for rejecting it.

---

## 8. Rendering Rules

- **AppShell** renders: TopChrome, the Overlay Layer, the Modal Layer, the Toast Layer, and the single Mounted Screen slot (or Workspace's multi-pane arrangement within that slot).
- **Mission Control, AI Observatory, Repository Graph, Impact Analysis, Execution Explorer, Settings, Repository Explorer** each render only their own subtree, rooted at the mount point AppShell provides them.
- **Workspace** renders pane chrome (splitters, pane headers) and delegates each pane's content area to whatever Feature AppShell has told it to mount there — Workspace does not know what a "Repository Graph" is, only that it hosts a Feature's root component in a rectangle.
- **No Feature may mount another Feature.** If Repository Explorer wants to show Repository Graph content, it emits `focusFile`/navigation events and lets AppShell handle the mount — it never imports and renders `<RepositoryGraphRoot />` itself.
- **Inspector panels** (`SelectionInspector`, `ContextSourcesInspector`, etc.) are rendered by the Feature that owns the selection they describe, not by AppShell — they are not overlays by this document's definition, since they don't need to appear above unrelated Features.

### Rendering Tree (composition, not file structure)

```
AppShell
 ├── TopChrome
 ├── ToastLayer
 ├── ModalLayer
 │    └── (Impact Analysis full-screen mode, confirmations)
 ├── OverlayLayer
 │    ├── AttentionOverlay
 │    ├── SelectionOverlay
 │    └── TooltipHost
 ├── CommandPalette (overlay, always mountable)
 └── MountedScreenSlot
      ├── (single Feature root)              — default
      └── Workspace                          — when split view is active
           ├── Pane[0] → Feature root
           └── Pane[1] → Feature root
```

---

## 9. Animation Rules

- **Motion primitives are defined once**, in `shared/constants`, per the Product Experience Bible §17 (Zoom-transition, Physics-settle, Spotlight/dim, Sonar-ping, Cross-dissolve). No Feature defines a sixth.
- **Who owns animations:** the Feature that owns the element being animated owns triggering that animation, but must express it using only the five shared primitives' parameters (duration, easing curve, target) — never a bespoke keyframe set.
- **Overlay animations** (AttentionOverlay's traveling highlight, SelectionOverlay's entrance) are owned by AppShell, since the overlays themselves are AppShell's, per §5.
- **Features may not create their own animation primitives.** A Feature needing a motion effect not covered by the five primitives escalates it as a proposed sixth primitive for review — it does not silently implement one locally. This is the same discipline as the "2 net-new UI primitives per screen" rule from the Engineering Construction Blueprint, applied to motion.
- **Reduced-motion handling** is a single, global concern owned by AppShell's theme provider — Features consume a `motionEnabled` flag, they do not implement their own reduced-motion detection.

---

## 10. Dependency Rules

**Allowed Dependency Graph:**

```
AppShell
   ↓ (composes)
Feature (any of the 8)
   ↓ (imports)
Shared Objects / Shared UI / Shared Hooks / Shared Utils / Shared Providers (read)
```

Features never appear as a dependency of another Feature. Shared layers never depend on any Feature. AppShell may depend on Shared layers and on each Feature's public mount contract (not internals).

**Forbidden Dependency Graph — illustrative violations:**

```
Mission Control → Repository Graph → AI Observatory → Mission Control     (cycle)
AI Observatory → Repository Graph internals                               (cross-feature import)
Settings → shared/store (writing arbitrary Feature state)                 (store misuse)
Repository Explorer → mounts <AIObservatoryRoot /> directly                (feature mounting feature)
Impact Analysis → Execution Explorer's local hook                         (cross-feature internal reuse)
```

**Enforcement mechanism:** a static dependency-boundary check (lint-rule-level, not discussed further here since this document avoids implementation) should treat any import path crossing from one Feature's directory into another's as a build failure, not a warning — the single highest-leverage rule in this constitution for staying maintainable past 500k lines.

---

## 11. Build Contracts

For each Feature, the contract AppShell and other Features may rely on — nothing beyond this is guaranteed stable.

| Feature | Inputs (from AppShell/providers) | Outputs (events emitted) | Public API (contract other layers may call) | Internal API (private, may change freely) |
|---|---|---|---|---|
| Mission Control | Repository health data provider, theme | `navigateToModule`, `dismissInsight`, `traceSelected` | Mount contract only | InsightStream ranking logic, LivingMap render internals |
| Repository Graph | Node/edge data provider, viewport session state | `highlightNode`, `highlightPath`, `nodeSelected`, `focusFile` | Mount contract + `resolveNodePosition(nodeId)` coordinate contract (§5) | Force-layout internals, node dimming logic |
| AI Observatory | Selection context, memory persistence provider, Event Bus | `highlightNode`, `highlightPath`, `openConversation`, `runExecution`, `focusFile` | Mount contract + dock-state contract (for AppShell's DockingControl) | Reasoning-step classification, investigation tab internals |
| Workspace | AppShell pane-composition instructions | `paneSplit`, `paneClosed` | Mount contract + pane-composition API | Splitter drag internals |
| Impact Analysis | Selected target (event), graph structural data provider | `impactComputed`, `requestGraphContext` | Mount contract (as AppShell-hosted overlay) | Blast-radius traversal presentation logic |
| Execution Explorer | Trace data provider | `highlightNode`, `focusFile` | Mount contract + `resolveNodePosition(nodeId)` coordinate contract | Playback engine internals |
| Settings | Integration status provider | `settingChanged` | Mount contract + read-only settings-value provider (for shared/providers) | Form validation internals |
| Repository Explorer | File content provider, selection context | `focusFile`, `nodeSelected`, `openConversation` | Mount contract | Outline-parsing/gutter internals |

**The one rule this table enforces:** anything not in the Public API column is free to be refactored by that Feature's team at any time without cross-team coordination. Anything in it requires the same change-review rigor as an external API, because — architecturally — it is one.

---

## 12. Future Scalability

- **Multi-repository support:** handled entirely at the shared data provider and Global State level (`currentRepository` becomes `currentRepositories[]` with an active pointer). No Feature's internal architecture changes — Mission Control's LivingMap already composes into a "constellation of constellations" per its own design spec, and the coordinate-contract mechanism in §5 is repository-agnostic by construction.
- **Multiple Observatories (e.g., one per repository, viewable side by side):** solved by Workspace (§2) hosting two AI Observatory Feature instances in separate panes — since Features are stateless-at-the-architecture-level templates instanced by AppShell, running two instances requires no new mechanism, only Workspace's existing pane-composition capability.
- **Plugins:** a plugin is architecturally just a new Feature that implements the same mount contract and Event Bus discipline as the eight built-in ones. The Feature Ownership Matrix (§2) becomes the template a plugin author fills in; the Communication Matrix (§4) becomes the set of events a plugin may legally emit/subscribe to. No core Feature needs to know a plugin exists in advance, since all communication is already event-mediated.
- **Agents (autonomous background task execution):** modeled as a new emitter on the existing Event Bus (`agentTaskStarted`, `agentTaskProgress`, `agentTaskCompleted`), visualized via the same AttentionOverlay mechanism already built for AI Observatory's reasoning — per the Observatory Blueprint's closing principle, this requires zero new visual or architectural machinery, only new canonical event names added to §6's registry.
- **Cloud sync:** implemented entirely inside the shared persistence provider (§7) — Features that already read/write through that provider (Settings, AI Observatory's memory, session state) gain sync transparently; Features never talk to a sync backend directly.
- **Collaborative mode (multiple developers in one session):** the Event Bus's payloads already carry a `source` field (see `highlightNode`'s shape in §6) for exactly this reason — collaborative mode extends the Event Bus to a networked transport carrying the same canonical events tagged by originating user, and the Overlay Layer already renders based on event payloads, not local-only state, so a remote-sourced `highlightNode` event requires no new rendering path, only a `source` distinguishing treatment (e.g., a colored cursor label) at the Overlay Layer.

**Governing constraint for all six:** each is achieved by extending an existing mechanism (shared provider, Event Bus registry, Workspace pane composition, coordinate contract) — none requires a new cross-cutting architectural layer. This is the test this constitution was written to pass.

---

## 13. Lifecycle Diagram

```
App Launch
   │
   ▼
AppShell mounts → Providers initialize (theme, session, persistence, Event Bus)
   │
   ▼
Route resolved → Mission Control mounted into MountedScreenSlot
   │
   ├──[user navigates altitude]──▶ Repository Graph mounted, Mission Control suspended (not destroyed)
   │
   ├──[⌘J]──▶ AI Observatory mounted (docked, alongside current screen — not a screen swap)
   │
   ├──[node double-click]──▶ Repository Explorer mounted, prior screen suspended
   │
   ├──[selection + "Impact"]──▶ Impact Analysis mounted into ModalLayer (overlay lifecycle, not screen lifecycle)
   │
   └──[repository switch]──▶ ALL Features receive `openRepository` → each resets its own state per its
                              own Destroy Conditions (§2) → Mission Control re-mounts as the default screen

Feature Suspend vs. Destroy:
  Suspended  = unmounted from view, session state retained, cheap to remount (default for altitude navigation)
  Destroyed  = state cleared per the Feature's own Destroy Conditions row in §2 (e.g., repository switch, explicit close)
```

---

## 14. Event Flow Diagram (Worked Example)

**Scenario:** Developer asks AI Observatory a question while Repository Graph is mounted; the answer references a function, which should highlight on the graph.

```
AI Observatory (Feature)
   │  investigation step resolves target function
   ▼
emits highlightNode({ nodeId: "fn_123", source: "ai-observatory" })
   │
   ▼
Global Event Bus (AppShell-owned)
   │
   ▼
AppShell Overlay Layer receives event
   │
   ▼
Overlay Layer checks: is a canvas-bearing Feature mounted?
   │
   ├── YES → calls Repository Graph's public `resolveNodePosition("fn_123")`
   │            │
   │            ▼
   │         Repository Graph returns { x, y } in current viewport space
   │            │
   │            ▼
   │         AttentionOverlay paints highlight at that position, in the Overlay Layer's
   │         own stacking context (above Repository Graph, unaffected by its internal re-renders)
   │
   └── NO  → no spatial highlight painted; AI Observatory's own in-panel narration
             already conveyed the same information textually — no functionality lost
```

At no point does AI Observatory import, reference, or know the render state of Repository Graph. At no point does Repository Graph know AI Observatory exists — it only implements a generic coordinate contract any consumer could call.

---

## 15. Build Order

1. **AppShell skeleton** — providers, Event Bus, TopChrome, Overlay/Modal/Toast layers, routing, before any Feature exists.
2. **Shared layers** — `shared/ui` primitives, `shared/constants` (motion + event registry), `shared/providers` (theme, session).
3. **Repository Graph** — the first Feature, since GraphCanvas is the most-reused shared object across other Features (per the Engineering Construction Blueprint's reuse matrix); building it first lets subsequent Features consume the coordinate contract from day one instead of retrofitting it.
4. **Mission Control** — reuses GraphCanvas, proves the "suspend not destroy" lifecycle model.
5. **Repository Explorer** — proves the `focusFile` cross-feature navigation event end to end.
6. **AI Observatory** — proves the full Event Bus + Overlay coordinate-contract mechanism against a real, already-built Repository Graph.
7. **Impact Analysis** — proves the ModalLayer/overlay-lifecycle path and consumes both Graph and Observatory events.
8. **Execution Explorer** — proves a second implementation of the coordinate contract, validating it's genuinely Feature-agnostic and not accidentally Repository-Graph-specific.
9. **Settings, Workspace** — lowest architectural risk, built last; Workspace specifically waits until at least two Features exist worth splitting into panes.

---

## 16. Frontend Constitution — Summary of Law

1. Features never import, mount, or hold references to other Features.
2. AppShell is the only composer of screens and the only owner of overlays.
3. State lives at the lowest level that satisfies every real (not speculative) consumer.
4. All cross-feature communication is event, contract, or shared-provider based — never direct.
5. The Event Bus's canonical event registry (§6) is the only vocabulary Features may use to talk to each other; new events require amending this document.
6. Overlays exist because they need to draw across Feature boundaries — this is precisely why they can never be owned by a Feature.
7. Cross-feature visual effects (highlighting, spotlighting) are achieved through Feature-agnostic public contracts (e.g., `resolveNodePosition`), never bespoke integrations between two named Features.
8. Motion has exactly five primitives; a sixth requires review, not local invention.
9. Any import path crossing a Feature boundary into another Feature's internals is a build failure, not a style note.
10. Every extension point for the product's future (multi-repo, plugins, agents, cloud sync, collaboration) must be achievable by extending an existing mechanism in this document — if it isn't, the mechanism, not the constitution's discipline, is what should be reconsidered.

This constitution is binding on all future frontend work in this codebase.
