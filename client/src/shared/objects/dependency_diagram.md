# Dependency Diagram

```mermaid
flowchart LR
    TopChrome --> GlassPanel
    TopChrome --> RepositorySwitcherTrigger
    TopChrome --> LocationReadout
    TopChrome --> AIPresenceIndicator
    TopChrome --> ToggleGroup
    TopChrome --> FilterControl
    
    RepositorySwitcherTrigger --> GlassPanel
    RepositorySwitcherTrigger --> CommandButton
    RepositorySwitcherTrigger --> HealthGlyph
    
    LocationReadout --> BreadcrumbSegment
    
    AIPresenceIndicator --> StatusDot
    
    SelectionToolbar --> ActionButton
    
    SelectionInspector --> SectionHeader
    SelectionInspector --> MetricRow
    SelectionInspector --> ActionRow
    
    ToggleGroup --> /* shared UI primitive */
    FilterControl --> /* shared UI primitive */
```

*All arrows indicate direct import dependencies. Shared UI primitives (e.g., GlassPanel, CommandButton, HealthGlyph, BreadcrumbSegment, StatusDot, ActionButton, SectionHeader, MetricRow, ActionRow) are defined in `client/src/shared/ui/` and are reused here without duplication.*
