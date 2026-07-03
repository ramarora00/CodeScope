# Engineering Construction Blueprint
### AI-Powered Developer Operating System — Screen & Object Specification

Derived from the Product Experience Bible. Defines composition, not implementation. No code, markup, or styling is specified here — only structure, objects, states, and behavior contracts for engineering to build against.

---

## How to Read This Document

Each screen is specified as a **composition** — a tree of Objects. An Object is any named, reusable unit of the interface: a panel, a control, a visualization, a primitive. Objects are decomposed recursively until they bottom out in **Design Primitives** (Section 11) — the smallest reusable units, defined once and referenced everywhere.

Screens do not own Objects. Screens **compose** Objects. This distinction is the backbone of the whole system: an Object like `InspectorPanel` or `GraphCanvas` is built once and instanced across every screen that needs it.

---

## 1. Mission Control

**Purpose:** Single-glance system-of-systems health and orientation. The orbit-altitude home screen.

**User Goal:** "Is everything okay, and where do I need to look?"

**Component Hierarchy:**
```
MissionControlScreen
 ├── TopChrome
 ├── HealthSignaturePanel
 ├── LivingMap
 ├── InsightStream
 └── ActivityTicker
```

**Layout Zones:** Top chrome (fixed) · top-left Health quadrant · center Living Map (dominant, ~60% area) · right Insight rail (collapsible) · bottom Activity ticker (slim, scrubbable).

**Primary Objects:** `LivingMap` (zoomed-out architecture graph, health-tinted), `HealthSignaturePanel`.

**Secondary Objects:** `InsightStream`, `ActivityTicker`, `RepositorySwitcherTrigger`.

**Inspector Contents:** None docked by default. Clicking a map cluster opens an ephemeral `ClusterSummaryPopover` (module name, health glyph, top 3 insights) before committing to zoom-navigation.

**Toolbar Contents:** None separate from TopChrome — Mission Control has no screen-local toolbar by design; all actions route through Command Palette.

**Empty State:** No repositories indexed yet → `EmptyMapPlaceholder` replaces LivingMap with single-sentence prompt + primary action routing to Ingestion flow.

**Loading State:** Partial index → `LivingMap` renders at current completeness with `IndexingProgressBadge` overlay; never blocks interaction.

**Error State:** Indexing failure on a cluster → cluster renders as `DimNode` (dashed, warning glyph) with reason in `ClusterSummaryPopover`; does not block rest of map.

**Responsive Behaviour:** Below a defined width threshold, `HealthSignaturePanel` and `InsightStream` collapse into swipeable tabs beneath the map rather than side rails; `ActivityTicker` becomes a compact single-line summary.

**Keyboard Navigation:** `⌘K` palette, `⌘R` repo switch, `Tab` cycles Health → Map clusters (via `⌘⇧A` list-mode) → Insight items → Ticker; `Enter` zooms/opens.

**Accessibility:** `⌘⇧A` toggles `StructuredListView` — health metrics, insight items, and ticker events as an ordered, navigable list equivalent to the spatial map.

**Future Expansion:** Multi-repo orgs extend `LivingMap` to a constellation-of-constellations without new screen; `InsightStream` gains filtering/categorization as insight types grow.

---

## 2. Overview Observatory (System Altitude / Architecture View)

**Purpose:** Show how the system is organized — modules, services, boundaries, ownership.

**User Goal:** "How is this system structured, and how do its parts relate?"

**Component Hierarchy:**
```
OverviewObservatoryScreen
 ├── TopChrome
 ├── ObservatoryToolbar
 ├── ArchitectureCanvas
 └── SelectionInspector (ephemeral)
```

**Layout Zones:** Top chrome · slim toolbar (edge-type toggles, ownership filter) · full-bleed canvas · right inspector (appears on selection only).

**Primary Objects:** `ArchitectureCanvas` (module-region graph), `ModuleNode`, `DependencyEdge`.

**Secondary Objects:** `ObservatoryToolbar`, `EdgeTypeFilter`, `OwnershipFilter`, `FlowHighlighter`.

**Inspector Contents:** Module name, description, owning team, size/activity metrics, direct dependency count, "Zoom into module" action.

**Toolbar Contents:** Edge-type toggle group (imports / API calls / shared data / runtime calls), ownership filter, "highlight a flow" tool.

**Empty State:** No architecture inferred yet (indexing incomplete) → `EmptyMapPlaceholder` variant with live percentage.

**Loading State:** `ArchitectureCanvas` streams module regions in as detected; `PhysicsSettleAnimation` primitive governs arrival.

**Error State:** Module with unresolved boundary → renders as `DimRegion` with explanation in inspector.

**Responsive Behaviour:** Toolbar collapses into an overflow `ToolbarMenu`; inspector becomes a bottom sheet on narrow viewports instead of a right rail.

**Keyboard Navigation:** Arrow keys traverse modules in graph-order; `Enter` descends to Knowledge Graph scoped to module; `Esc` clears selection.

**Accessibility:** `StructuredListView` equivalent (nested tree: modules → dependencies); edges have accessible relationship labels ("Module A imports from Module B").

**Future Expansion:** Same `ModuleNode`/region rendering reused for future infra/cloud resource mapping.

---

## 3. Repository Explorer (Ground Altitude / Code)

**Purpose:** Read and understand source with structural and relational context always adjacent.

**User Goal:** "Let me read this code with full context of what calls it, what it calls, and how it changed."

**Component Hierarchy:**
```
RepositoryExplorerScreen
 ├── TopChrome
 ├── OutlineGutter
 ├── CodeSurface
 ├── SelectionToolbar (floating, ephemeral)
 └── ContextRail (collapsible)
      ├── CallersPanel
      ├── CalleesPanel
      ├── HistoryPanel
      └── RelatedTracesPanel
```

**Layout Zones:** Top chrome · left outline gutter (slim) · center code surface (dominant, reading-optimized width) · right context rail (collapsed by default).

**Primary Objects:** `CodeSurface`, `OutlineGutter`.

**Secondary Objects:** `ContextRail` and its four sub-panels, `SelectionToolbar` (Ask AI / Trace / Impact / Explain).

**Inspector Contents:** `ContextRail` acts as the inspector: callers, callees, change history, related execution traces for the currently selected symbol.

**Toolbar Contents:** No persistent toolbar; `SelectionToolbar` appears only on text selection, floating and non-blocking.

**Empty State:** No file open → `FilePickerPrompt` centered, with recent-files list.

**Loading State:** Large file parsing → `OutlineGutter` populates progressively; code renders immediately (text is cheap), symbol-linking activates as parsing completes.

**Error State:** File fails to parse for symbol-linking → code still renders as plain text with a small inline notice; context rail shows "structural analysis unavailable for this file."

**Responsive Behaviour:** `ContextRail` becomes a full-height overlay drawer rather than a side rail below a width threshold; `OutlineGutter` collapses to an icon-trigger.

**Keyboard Navigation:** `⌘⇧O` toggles outline focus; arrow keys navigate outline entries; `⌘.` jumps to definition; `⌘⇧R` opens context rail.

**Accessibility:** Code is real selectable/screen-reader-readable text, never canvas-rendered; outline gutter is a standard navigable list.

**Future Expansion:** `ContextRail` is extensible — future panels (security findings, per-line coverage) slot in as additional sub-panels without restructuring the rail.

---

## 4. Knowledge Graph (Structure Altitude)

**Purpose:** Precise file/symbol-level dependency exploration and path-tracing.

**User Goal:** "What does this depend on, what depends on it, and how do they connect?"

**Component Hierarchy:**
```
KnowledgeGraphScreen
 ├── TopChrome
 ├── GraphToolbar
 ├── GraphCanvas
 │    ├── SymbolNode
 │    └── RelationEdge
 └── SelectionInspector
```

**Layout Zones:** Top chrome · slim toolbar · full-bleed canvas · right inspector (collapsible, opens on selection).

**Primary Objects:** `GraphCanvas`, `SymbolNode`, `RelationEdge`.

**Secondary Objects:** `PathTracer`, `SubgraphIsolator`, `GraphToolbar`.

**Inspector Contents:** Symbol name/kind, dependents/dependencies count, complexity metric, recent change frequency, actions (Open in Code, Run Impact Analysis, Ask AI, Trace Execution).

**Toolbar Contents:** Path-trace tool (pick two nodes), isolate-subgraph tool, export view, layout reset.

**Empty State:** No selection → canvas shows full graph at default layout with a subtle prompt: "Select a node, or trace a path between two."

**Loading State:** Graph builds via `PhysicsSettleAnimation`; large graphs stream in clustered batches rather than all at once.

**Error State:** Broken/unresolvable reference → `SymbolNode` renders in `DimNode` state with a tooltip explaining the resolution failure.

**Responsive Behaviour:** Toolbar collapses to icon-only; inspector becomes bottom sheet; graph canvas retains full interactivity (pinch-zoom/pan) on touch.

**Keyboard Navigation:** Arrow keys traverse connected nodes; `Enter` opens inspector; `⌘Enter` descends to code; `T` initiates path-trace mode.

**Accessibility:** `StructuredListView` (nodes as a searchable list, path-trace results as an ordered hop list).

**Future Expansion:** Same `GraphCanvas`/`SymbolNode` primitives extended with a time axis become the base of Execution Explorer (§5) — one rendering engine, multiple lenses.

---

## 5. Execution Explorer (Time Altitude)

**Purpose:** Show real, observed runtime control flow — not theoretical, actual.

**User Goal:** "What really happened, in what order, and where was I at any given moment?"

**Component Hierarchy:**
```
ExecutionExplorerScreen
 ├── TopChrome
 ├── TraceToolbar
 ├── SynchronizedGraphView
 ├── TimelineScrubber
 │    ├── PlaybackTransport
 │    └── TimelineTrack
 └── SelectionInspector
```

**Layout Zones:** Top chrome · slim toolbar (filters, compare-mode) · main synchronized graph canvas (~80% height) · bottom timeline scrubber (~15% height, always visible) · right inspector on selection.

**Primary Objects:** `SynchronizedGraphView`, `TimelineScrubber`, `PlaybackTransport`.

**Secondary Objects:** `TimelineTrack`, `TraceComparator`, `TraceToolbar`.

**Inspector Contents:** Active node detail at playhead position: function, arguments/state snapshot (if captured), duration, source-line link.

**Toolbar Contents:** Filter by service/thread, compare-two-traces toggle, playback speed control.

**Empty State:** No trace selected → prompt to select a recent run from `ActivityTicker`-style trace list, or "run a trace" action.

**Loading State:** Trace processing → `TimelineTrack` renders progressively as events are ingested; graph highlights update as data streams.

**Error State:** Incomplete/corrupted trace → affected segment of `TimelineTrack` shown as a gap with a marker; playback pauses at the gap with explanation.

**Responsive Behaviour:** `TimelineScrubber` remains full-width and bottom-anchored at all sizes (highest priority element); graph canvas height adjusts; inspector becomes bottom sheet.

**Keyboard Navigation:** `Space` play/pause, `←/→` step frame, `Shift+←/→` jump 10 frames, `Enter` opens inspector for node at playhead.

**Accessibility:** Timeline events are independently navigable via `StructuredListView` (chronological list with timestamps); playback state announced via live region.

**Future Expansion:** `PlaybackTransport` and `TimelineTrack` reused for future "replay this incident" and "step through AI-suggested change" features.

---

## 6. Impact Analysis

**Purpose:** Show precisely what else changes before a change is made.

**User Goal:** "If I change this, what breaks or is affected?"

**Component Hierarchy:**
```
ImpactAnalysisOverlay
 ├── TargetSummary
 ├── BlastRadiusCanvas
 │    └── SpotlightSubgraph
 └── RiskSummaryPanel
```

**Layout Zones:** Rendered as an overlay panel atop the dimmed underlying screen (never a standalone route) — top `TargetSummary`, center `BlastRadiusCanvas`, bottom `RiskSummaryPanel`.

**Primary Objects:** `BlastRadiusCanvas`, `RiskSummaryPanel`.

**Secondary Objects:** `TargetSummary`, `SpotlightSubgraph`, `ExpandRadiusControl`.

**Inspector Contents:** N/A — the overlay itself is the inspector; `RiskSummaryPanel` functions as summarized detail (services/tests/API surfaces affected).

**Toolbar Contents:** "Expand to transitive effects," "Export as checklist," "Ask AI to draft safe migration," "Share link."

**Empty State:** No target selected → overlay cannot open; entry points (context menus, selection toolbar) are disabled/hidden until a valid target exists.

**Loading State:** Blast radius computing → `SonarPingAnimation` primitive plays while `BlastRadiusCanvas` populates; `RiskSummaryPanel` shows skeleton rows.

**Error State:** Analysis inconclusive (e.g., dynamic dispatch ambiguity) → `RiskSummaryPanel` states the uncertainty explicitly rather than presenting false confidence.

**Responsive Behaviour:** Overlay becomes full-screen (not partial) below a width threshold, since blast-radius reading is dense.

**Keyboard Navigation:** `Esc` closes and returns focus to origin; `Tab` cycles Target → Radius nodes → Risk rows → Actions.

**Accessibility:** Risk summary is plain-language text by default (already accessible); blast radius has a list equivalent (affected items grouped by proximity).

**Future Expansion:** `RiskSummaryPanel` gains new rows (performance, security, cost impact) without new screens.

---

## 7. AI Observatory

**Purpose:** The AI's reasoning surface — a partner embedded in the map, not a standalone chat page.

**User Goal:** "Let me ask a question and see the AI's reasoning fused to the actual system."

**Component Hierarchy:**
```
AIObservatoryPanel
 ├── PresenceIndicator (lives in TopChrome, not this panel)
 ├── ConversationStream
 │    ├── QueryInput
 │    ├── ResponseBlock
 │    │    ├── LiveObjectChip
 │    │    └── CitationChip
 │    └── SuggestionChipRow
 └── AttentionOverlay (rendered on host screen's canvas, not in panel)
```

**Layout Zones:** Slide-up panel (resizable, dockable side or bottom), host screen's canvas remains visible/interactive behind it at all times.

**Primary Objects:** `ConversationStream`, `AttentionOverlay` (the traveling-highlight reasoning indicator drawn onto whatever map is currently host).

**Secondary Objects:** `QueryInput`, `ResponseBlock`, `LiveObjectChip`, `CitationChip`, `SuggestionChipRow`.

**Inspector Contents:** N/A — panel is self-contained; `LiveObjectChip`s reference host-screen objects (hover spotlights them there).

**Toolbar Contents:** Regenerate, "save as note," dock-position toggle, dismiss.

**Empty State:** No conversation yet → `SuggestionChipRow` populated with context-aware starter questions based on current selection/screen.

**Loading State:** `AttentionOverlay` traveling-highlight animates across relevant host-canvas regions while reasoning; `ConversationStream` shows measured-pace streaming text.

**Error State:** AI cannot complete request (e.g., ambiguous scope) → `ResponseBlock` states the ambiguity plainly and offers `SuggestionChipRow` to disambiguate, rather than a generic failure message.

**Responsive Behaviour:** Panel becomes full-screen on narrow viewports (docking options reduce to top/bottom only); `LiveObjectChip` hover-spotlight becomes tap-to-spotlight.

**Keyboard Navigation:** `⌘J` opens/closes; `Esc` dismisses; `↑` recalls previous query; `Tab` cycles chips within a response.

**Accessibility:** Streamed text is exposed via live region for assistive tech; `LiveObjectChip`/`CitationChip` are standard focusable links with descriptive labels.

**Future Expansion:** `AttentionOverlay` mechanism reused for future background-agent status ("AI is refactoring X") without new visual language.

---

## 8. Global Search / Command Palette

**Purpose:** Reach any symbol, file, concept, past AI answer, or action in under two seconds.

**User Goal:** "Get me there, or do this, right now."

**Component Hierarchy:**
```
CommandPalette
 ├── PaletteInput
 └── ResultList
      ├── FileResultRow
      ├── SymbolResultRow
      ├── GraphNodeResultRow
      ├── AIAnswerResultRow
      └── ActionResultRow
```

**Layout Zones:** Centered modal overlay, input pinned top, unified ranked result list beneath (no tabs).

**Primary Objects:** `PaletteInput`, `ResultList`.

**Secondary Objects:** The five `*ResultRow` variants, `RecentDestinationsProvider` (non-visual ranking logic).

**Inspector Contents:** N/A.

**Toolbar Contents:** N/A — palette has no toolbar, only the input and results.

**Empty State:** No query typed → `ResultList` shows recent destinations and current-context quick actions.

**Loading State:** Query in flight (e.g., semantic AI-answer search) → `AIAnswerResultRow` shows a lightweight skeleton while others (file/symbol, which are instant/local) render immediately.

**Error State:** No results → single plain-text row: "No matches — try a different term or ask the AI directly," with the latter as an inline action.

**Responsive Behaviour:** Becomes full-screen on narrow viewports rather than a centered floating modal.

**Keyboard Navigation:** `⌘K` opens, `↑/↓` moves through unified list regardless of row type, `Enter` executes/navigates, `Esc` closes.

**Accessibility:** Standard combobox/listbox ARIA pattern; result count and top result announced via live region as query changes.

**Future Expansion:** New result types (e.g., "Insights," "Team members") added as new `*ResultRow` variants within the same unified list — never as new tabs.

---

## 9. Settings

**Purpose:** Configuration of workspace, repositories, integrations, AI behavior, and personal preferences.

**User Goal:** "Adjust how the system behaves or connects."

**Component Hierarchy:**
```
SettingsScreen
 ├── TopChrome
 ├── SettingsNavList
 └── SettingsDetailPanel
      ├── SettingsSectionHeader
      ├── SettingsFieldGroup
      └── SettingsFooterActions
```

**Layout Zones:** Top chrome · left `SettingsNavList` (persistent, unlike other screens — settings is the one screen that keeps a traditional list nav, since it is inherently categorical, not spatial) · right `SettingsDetailPanel`.

**Primary Objects:** `SettingsNavList`, `SettingsDetailPanel`.

**Secondary Objects:** `SettingsFieldGroup`, `SettingsSectionHeader`, `SettingsFooterActions`, `IntegrationCard` (for connectors like GitHub/GitLab/CI).

**Inspector Contents:** N/A — the detail panel itself is the primary content, not an inspector-on-selection pattern.

**Toolbar Contents:** `SettingsFooterActions` (Save/Discard) where changes are not auto-committed (e.g., destructive integration changes); most fields auto-save with a brief `SavedIndicator` microinteraction.

**Empty State:** N/A (settings always has default content).

**Loading State:** Integration status checks (e.g., verifying GitHub connection) → `IntegrationCard` shows inline status shimmer, never blocks the rest of the panel.

**Error State:** Failed integration/save → inline field-level error message, plain language, adjacent to the specific field — never a page-level banner for a single-field issue.

**Responsive Behaviour:** `SettingsNavList` collapses to a top dropdown/segmented control on narrow viewports instead of a side list.

**Keyboard Navigation:** Standard form tab-order; `⌘S` saves where manual save applies; arrow keys navigate `SettingsNavList`.

**Accessibility:** Standard form labeling/ARIA throughout; this is the one screen with no spatial/graph accessibility parity concern by nature.

**Future Expansion:** New settings categories added as new `SettingsNavList` entries + corresponding detail sections, without restructuring the pattern.

---

## 10. Object Hierarchy (Full Decomposition)

Every screen-level Object above is decomposed here down to Design Primitives. Objects marked **(shared)** are instanced across multiple screens — see Section 12 for the full reuse matrix.

```
TopChrome (shared)
 ├── RepositorySwitcherTrigger (shared)
 │    └── HealthGlyph (primitive, shared)
 ├── LocationReadout (shared)
 │    └── BreadcrumbSegment (primitive)
 └── AIPresenceIndicator (shared)
      └── StatusDot (primitive)

LivingMap
 ├── GraphCanvas (shared — base engine also underlies ArchitectureCanvas, GraphCanvas[KG], SynchronizedGraphView)
 │    ├── ClusterRegion
 │    │    ├── HealthGlyph (primitive, shared)
 │    │    └── LabelText (primitive)
 │    └── EdgeLine (primitive, shared)
 └── ClusterSummaryPopover
      ├── LabelText (primitive)
      ├── HealthGlyph (primitive, shared)
      └── MiniInsightList
           └── InsightRow (shared)

HealthSignaturePanel
 ├── MetricSparkline (primitive, shared — reused in code history, module metrics)
 └── MetricLabel (primitive)

InsightStream
 ├── InsightRow (shared)
 │    ├── LabelText (primitive)
 │    ├── Timestamp (primitive, shared)
 │    └── DismissControl (primitive, shared)
 └── EmptyRowPrompt (primitive)

ActivityTicker
 ├── TickerTrack
 │    └── TickerEvent (primitive)
 └── ScrubControl (primitive, shared — related to PlaybackTransport but simplified, non-media)

ArchitectureCanvas
 ├── GraphCanvas (shared, see above)
 │    ├── ModuleNode
 │    │    ├── LabelText (primitive)
 │    │    ├── HealthGlyph (primitive, shared)
 │    │    └── SizeWeightIndicator (primitive)
 │    └── DependencyEdge
 │         └── EdgeLine (primitive, shared)
 └── ObservatoryToolbar
      ├── ToggleGroup (primitive, shared)
      └── FilterControl (primitive, shared)

CodeSurface
 ├── LineRenderer (primitive)
 ├── SymbolToken (primitive)
 └── InlineNotice (primitive, shared — reused for error states across screens)

OutlineGutter
 └── OutlineEntry (primitive)

SelectionToolbar (shared — appears on code + graph selections)
 ├── ActionButton (primitive, shared)
 └── ActionButton (primitive, shared) [x4: Ask AI / Trace / Impact / Explain]

ContextRail
 ├── CallersPanel → RelationRow (primitive, shared with KG inspector)
 ├── CalleesPanel → RelationRow (primitive, shared)
 ├── HistoryPanel → HistoryEntry (primitive)
 └── RelatedTracesPanel → TraceReferenceRow (primitive)

GraphCanvas [Knowledge Graph] (shared engine instance)
 ├── SymbolNode
 │    ├── LabelText (primitive)
 │    └── KindGlyph (primitive)
 └── RelationEdge
      └── EdgeLine (primitive, shared)

GraphToolbar
 ├── PathTracer
 │    └── NodePickerControl (primitive)
 ├── SubgraphIsolator
 │    └── ToggleGroup (primitive, shared)
 └── ExportControl (primitive, shared)

SelectionInspector (shared — used by KG, Architecture, Execution)
 ├── SectionHeader (primitive, shared)
 ├── MetricRow (primitive, shared)
 └── ActionRow (primitive, shared)

SynchronizedGraphView
 └── GraphCanvas (shared, see above)
      └── ActiveNodeHighlight (primitive — heartbeat-pulse variant)

TimelineScrubber
 ├── PlaybackTransport
 │    ├── ActionButton (primitive, shared) [play/pause/step]
 │    └── SpeedControl (primitive)
 └── TimelineTrack
      └── TimelineEvent (primitive)

TraceToolbar
 ├── FilterControl (primitive, shared)
 └── ToggleGroup (primitive, shared) [compare mode]

ImpactAnalysisOverlay
 ├── TargetSummary
 │    ├── LabelText (primitive)
 │    └── KindGlyph (primitive, shared)
 ├── BlastRadiusCanvas
 │    └── GraphCanvas (shared, spotlight-only mode)
 └── RiskSummaryPanel
      └── RiskRow (primitive)
           ├── LabelText (primitive)
           └── SeverityGlyph (primitive)

AIObservatoryPanel
 ├── ConversationStream
 │    ├── QueryInput (primitive)
 │    ├── ResponseBlock
 │    │    ├── StreamedText (primitive)
 │    │    ├── LiveObjectChip (primitive, shared — spotlight-triggering)
 │    │    └── CitationChip (primitive, shared)
 │    └── SuggestionChipRow
 │         └── SuggestionChip (primitive)
 └── AttentionOverlay
      └── TravelingHighlight (primitive)

CommandPalette
 ├── PaletteInput (primitive)
 └── ResultList
      └── ResultRow (primitive, shared) [5 typed variants, same primitive]

SettingsScreen
 ├── SettingsNavList
 │    └── NavEntry (primitive)
 └── SettingsDetailPanel
      ├── SettingsSectionHeader (primitive)
      ├── SettingsFieldGroup
      │    └── FormField (primitive)
      ├── IntegrationCard
      │    ├── StatusDot (primitive, shared)
      │    └── ActionButton (primitive, shared)
      └── SettingsFooterActions
           └── ActionButton (primitive, shared)
```

### 10.1 Design Primitives (Terminal Set)

The complete, closed set of primitives every Object above ultimately decomposes into. Nothing in the product should require inventing a primitive outside this list without an explicit revision to this document.

`LabelText` · `Timestamp` · `StatusDot` · `HealthGlyph` · `KindGlyph` · `SeverityGlyph` · `EdgeLine` · `MetricSparkline` · `MetricLabel` · `MetricRow` · `ActionButton` · `ActionRow` · `ToggleGroup` · `FilterControl` · `DismissControl` · `SectionHeader` · `RelationRow` · `InlineNotice` · `FormField` · `NavEntry` · `ResultRow` · `SuggestionChip` · `CitationChip` · `LiveObjectChip` · `StreamedText` · `QueryInput` · `PaletteInput` · `NodePickerControl` · `SpeedControl` · `TimelineEvent` · `TravelingHighlight` · `ActiveNodeHighlight` · `BreadcrumbSegment` · `ScrubControl` · `SizeWeightIndicator` · `TickerEvent` · `OutlineEntry` · `HistoryEntry` · `TraceReferenceRow` · `RiskRow`

Plus the five system-wide **Motion Primitives** (from the Bible §17, referenced structurally, not visually, here): `ZoomTransition` · `PhysicsSettleAnimation` · `SpotlightDim` · `SonarPingAnimation` · `CrossDissolve`.

---

## 11. Screen → Objects Matrix

| Screen | Primary Objects | Shared Objects Used |
|---|---|---|
| Mission Control | LivingMap, HealthSignaturePanel | TopChrome, GraphCanvas, HealthGlyph, InsightRow |
| Overview Observatory | ArchitectureCanvas | TopChrome, GraphCanvas, HealthGlyph, ToggleGroup, FilterControl |
| Repository Explorer | CodeSurface, OutlineGutter | TopChrome, SelectionToolbar, ActionButton, InlineNotice |
| Knowledge Graph | GraphCanvas (KG), GraphToolbar | TopChrome, GraphCanvas, SelectionInspector, ToggleGroup |
| Execution Explorer | SynchronizedGraphView, TimelineScrubber | TopChrome, GraphCanvas, ActionButton, SelectionInspector |
| Impact Analysis | BlastRadiusCanvas, RiskSummaryPanel | GraphCanvas, KindGlyph, SeverityGlyph |
| AI Observatory | ConversationStream, AttentionOverlay | LiveObjectChip, CitationChip, ActionButton |
| Global Search | PaletteInput, ResultList | ResultRow, ActionButton |
| Settings | SettingsNavList, SettingsDetailPanel | ActionButton, StatusDot, FormField |

---

## 12. Object Reuse Matrix

| Shared Object | Used In |
|---|---|
| `GraphCanvas` | Mission Control, Overview Observatory, Knowledge Graph, Execution Explorer, Impact Analysis |
| `TopChrome` | All 9 screens |
| `HealthGlyph` | Mission Control, Overview Observatory, Knowledge Graph (metrics), Settings (integration status variant) |
| `SelectionToolbar` | Repository Explorer, Knowledge Graph |
| `SelectionInspector` | Knowledge Graph, Overview Observatory, Execution Explorer |
| `ActionButton` | All screens with any interactive control (9/9) |
| `ToggleGroup` / `FilterControl` | Overview Observatory, Knowledge Graph, Execution Explorer |
| `LiveObjectChip` / `CitationChip` | AI Observatory (primary); referenced conceptually wherever AI responses can surface, incl. inline in Repository Explorer via SelectionToolbar → Ask AI |
| `ResultRow` | Global Search only, but its five typed variants map conceptually to Objects from every other screen (files, symbols, graph nodes, AI answers, actions) |
| `PlaybackTransport` pattern | Execution Explorer (media transport); `ScrubControl` (simplified relative) reused in Mission Control's ActivityTicker |
| `InlineNotice` | Repository Explorer (parse errors), Overview Observatory (unresolved boundary), Settings (field errors) |
| `Motion Primitives (5)` | Every screen, per Bible §17 — zero exceptions |

**Reuse ratio target:** No screen should introduce more than 2 net-new primitives beyond this terminal set without architectural review — this is the enforcement mechanism for the "one instrument" principle.

---

## 13. Navigation Flow

```
                        ┌────────────────────┐
                        │   Ingestion / Onboarding │
                        └───────────┬────────┘
                                    │ (indexing completes)
                                    ▼
                        ┌────────────────────┐
              ┌────────▶│   Mission Control   │◀────────┐
              │         └───────────┬────────┘          │
              │                     │ zoom in (cluster)  │
              │                     ▼                     │
              │         ┌────────────────────┐          │
   repo switch│         │ Overview Observatory│          │ zoom out
              │         └───────────┬────────┘          │ (⌘+scroll/↑)
              │                     │ zoom in (module)   │
              │                     ▼                     │
              │         ┌────────────────────┐          │
              │         │   Knowledge Graph    │──────────┘
              │         └───────────┬────────┘
              │              │      │      │
              │   double-click│  path-trace│  select+⌘Enter
              │              ▼      │      ▼
              │  ┌──────────────────┐│ ┌─────────────────────┐
              │  │Repository Explorer││ │  Execution Explorer  │
              │  └──────────────────┘│ └─────────────────────┘
              │
   (from any screen, any selection)
              │
              ▼
   ┌─────────────────────┐        ┌─────────────────────┐
   │   Impact Analysis    │        │    AI Observatory     │
   │   (overlay, modal)   │        │  (slide-up, non-modal) │
   └─────────────────────┘        └─────────────────────┘

   Global (from anywhere): ⌘K → Command Palette → any destination above
   Global (from anywhere): Settings reached only via TopChrome / Palette, never inline in the map flow
```

**Flow principles:**
- Vertical movement (Mission Control ↔ Overview ↔ Knowledge Graph ↔ Code) is **altitude change** — always `ZoomTransition`.
- Horizontal jumps (Knowledge Graph → Execution Explorer, any screen → Impact Analysis / AI Observatory) are **lens changes** — overlay or panel, underlying context never fully unmounts.
- Settings and onboarding are the only screens outside the altitude model — deliberately, since they are not spatial/investigative tasks.

---

## 14. Information Hierarchy

**Tier 1 — Orientation (always visible):** `TopChrome` contents (repo identity, location, AI presence). Present on 9/9 screens, never competes for primary attention.

**Tier 2 — Primary Subject (dominant canvas):** Whatever the screen exists to show — the map, the code, the trace, the conversation. Always ≥70% of viewport on spatial screens.

**Tier 3 — Contextual Detail (on-demand):** Inspectors, context rails, popovers — appear only in response to selection, never pre-populated as idle chrome.

**Tier 4 — Ambient Signal (peripheral):** Health glyphs, insight streams, status dots — visible but never demanding; encode state through position/shape/color together, never color alone (Bible §16).

**Tier 5 — Systemic Actions (invoked, not browsed):** Command Palette, Settings — deliberately outside the glanceable hierarchy; reached through intent (`⌘K`), not through visual scanning.

**Governing rule:** Nothing in Tier 3–5 may visually outweigh Tier 2 on its host screen. If an inspector, popover, or ambient panel ever competes with the primary canvas for visual weight, it is a defect against this specification.

---

## 15. Cross-Reference Index

- Motion vocabulary referenced throughout → Product Experience Bible §17.
- Empty/loading/error pattern rules → Product Experience Bible §14, applied per-screen above.
- Keyboard consistency rules → Product Experience Bible §15, applied per-screen above.
- Accessibility structural principle (`StructuredListView` parity) → Product Experience Bible §16.

This document supersedes no prior artifact. It is the construction-level decomposition of the Bible's product vision, and should be read alongside the Frontend Architecture Specification for implementation sequencing.
