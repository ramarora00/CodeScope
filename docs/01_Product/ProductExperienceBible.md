# Product Experience Bible

This is the Product Experience Constitution for AI-Developer Copilot. It defines how the product should feel, behave, and interact with the user. This is a permanent mandate for all product, design, and engineering decisions.

## 1. Product Philosophy
AI-Developer Copilot is a professional engineering tool, not a toy. It exists to eliminate the friction of understanding complex, legacy monolithic architectures. It bridges the gap between deterministic static analysis and semantic AI reasoning. The product must feel like an extension of the developer's mind: calm, omniscient, fast, and entirely trustworthy.

## 2. Target Users
*   **Senior/Staff Engineers**: Navigating massive, unfamiliar legacy codebases to plan structural refactors.
*   **New Onboarding Engineers**: Trying to understand where domain boundaries live and how data flows.
*   **Engineering Managers**: Auditing architectural drift and blast radius before approving major epics.

## 3. Core User Journey
1.  **Ingestion**: Effortless, background indexing of a local workspace. No blocking UI.
2.  **Orientation**: Instant high-level visual understanding of repository domains and health.
3.  **Investigation**: Deep-diving into specific execution flows or architectural queries.
4.  **Resolution**: Attaining deterministic clarity on "what happens if I change X?"

## 4. Design Principles
*   **Engineering-First**: Function dictates form. Data is beautiful on its own; do not decorate it.
*   **Minimal & Calm**: The UI must recede into the background. Let the code, graphs, and insights take center stage.
*   **Deterministic Trust**: Visuals must clearly separate what is statically proven (AST paths) from what is AI-inferred (semantic similarity).
*   **High Signal, Low Noise**: Eliminate redundant borders, excessive shadows, and decorative backgrounds.

## 5. Interaction Principles
*   **Keyboard-First (Raycast inspired)**: Every major action, navigation, and investigation should be accessible via keyboard shortcuts and command palettes.
*   **Instantaneous Feedback**: Interactions (clicks, hovers, graph expansions) must feel strictly immediate.
*   **Predictability over Novelty**: Standardized UX patterns (Linear/Apple HIG) beat clever custom interactions.

## 6. Motion Principles
*   **Snappy and Intentional**: Motion exists only to explain state changes or direct attention.
*   **Zero Wait Times**: Do not use slow, dramatic transitions. Maximum transition duration should be 150ms-200ms.
*   **No Extraneous Bouncing**: Use precise spring physics, but avoid playful or exaggerated elasticity.

## 7. Information Density
*   **High but Structured**: Engineers need to see a lot of data at once. Do not overly space elements to the point of requiring excessive scrolling.
*   **Progressive Disclosure**: Show high-level architecture first. Reveal deep execution traces, method signatures, and AST details on demand.
*   **Tabular Excellence**: Embrace densely packed, highly readable tables for file lists and impact analyses.

## 8. Navigation Philosophy
*   **Spatial Predictability**: The user should always know where they are. 
*   **Linear Hierarchy**: Maintain a strict breadcrumb/hierarchical navigation path.
*   **Sidebar Command**: The Inspector/Context Rail should feel like a native IDE sidebar—stable, persistent, and contextually aware of the main viewport.

## 9. AI Behaviour
*   **Assistant, Not Oracle**: The AI serves the deterministic data. It summarizes and correlates, it does not invent.
*   **Citations Required**: AI assertions about the codebase must link directly to the deterministic AST graph or file paths.
*   **Tone**: Professional, concise, precise. Never conversational, never apologetic, never overly enthusiastic.

## 10. Investigation Experience
*   Investigations are first-class entities. They are workspaces for tracing a specific bug or feature.
*   The experience should feel like building a case: adding files, execution paths, and AI notes into a unified, persisting canvas.
*   Switching between investigations must be instant and state-preserving.

## 11. Repository Experience
*   Repository switching must be seamless.
*   Uploading/indexing should be a background concern with a quiet, persistent status indicator, never a blocking modal.
*   The Overview should instantly communicate the scale, tech stack, and primary domains of the repository.

## 12. Graph Experience
*   **Utilitarian Visualization**: Graphs should communicate information, not visual effects. Glow is permitted only when it improves meaning. Visual hierarchy > decoration. Signal > Noise.
*   **Performance First**: Rendering 10,000 nodes must remain 60fps. Prioritize WebGL performance over SVG styling.
*   **Interactive Clarity**: Hovering a node should instantly dim unrelated edges and highlight the specific upstream/downstream execution path.

## 13. Visual Language
*   **Inspiration Hierarchy**: Sourcegraph, Linear, Raycast, Apple HIG, GitHub.
*   **Borders & Separators**: Use subtle, 1px borders with low-opacity colors (`border-white/10`) to separate panes.
*   **Radii**: Small, precise border radii (4px to 6px). Avoid overly pill-shaped or aggressively rounded corners unless specifically for badges.

## 14. Typography
*   **Primary Font**: Inter or standard system sans-serif (San Francisco/Segoe UI).
*   **Monospace Font**: JetBrains Mono, Fira Code, or SF Mono for all code, file paths, and symbols.
*   **Hierarchy**: Use font weight (Medium/Semibold) and color contrast (White vs. Gray-400) rather than massive size differences to establish hierarchy.

## 15. Spacing
*   **Compact by Default**: Use an 8px grid system.
*   **Padding**: Tight padding inside components (e.g., 8px or 12px) to maximize screen real estate for data.
*   **Alignment**: Strict left-alignment for text. Strict right-alignment for numbers/metrics.

## 16. Color Philosophy
*   **Monochrome Foundation**: The vast majority of the UI should be shades of dark gray/black (e.g., `#0A0A0A` to `#1A1A1A`).
*   **Semantic Accents**: Use color sparingly and only for meaning. Red for destructive/errors, Yellow for warnings, Blue/Indigo for primary actions or active states.
*   **Avoid Neons**: Colors should be muted and accessible, not glowing or hyper-saturated.

## 17. Animation Rules
*   **Fade-ins**: Fast opacity transitions (100ms) for modal reveals or tooltips.
*   **Layout Shifts**: Use robust layout animations (e.g., Framer Motion layout prop) when lists reorder, but keep them fast.
*   **Ban List**: No continuous pulsing (except tiny status dots), no glowing borders, no parallax backgrounds.

## 18. Accessibility
*   **Contrast**: All text must meet WCAG AA contrast ratios against its background.
*   **Focus Rings**: Clear, sharp focus rings (e.g., a solid blue outline) for all interactive elements. Never disable `outline` without a visible alternative.
*   **Screen Readers**: Semantic HTML must be maintained. `aria-labels` on all icon-only buttons.

## 19. Performance Rules
*   **Zero Jank**: Main thread must never block.
*   **Instant Load**: Shell must render instantly. Data can load via skeleton states.
*   **Virtualization**: Any list over 50 items (files, symbols, logs) must be virtualized.

## 20. Never Do List
*   **NEVER** use gaming-dashboard aesthetics.
*   **NEVER** use excessive glassmorphism or deep, layered blurs that distract from the data.
*   **NEVER** block the user with a loading spinner for a background task.
*   **NEVER** let the AI guess an architectural dependency.
*   **NEVER** implement an interaction that cannot be triggered via keyboard.
