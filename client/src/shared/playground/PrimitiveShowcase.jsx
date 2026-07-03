/**
 * PrimitiveShowcase
 *
 * Purpose:     Isolated development-only rendering surface for all shared UI
 *              primitives. Allows visual inspection of every component in every
 *              state WITHOUT mounting App.jsx, touching routing, or affecting
 *              any production screen.
 *
 * How to use:  Temporarily replace the content of main.jsx's <App /> with
 *              <PrimitiveShowcase /> during development, or mount it at a
 *              temporary /dev route. Remove before production deployment.
 *
 * DO NOT:      Reference this file from any feature, page, or App.jsx in a
 *              production code path.
 */

import {
  GlassPanel,
  CommandButton,
  StatusBadge,
  SectionHeader,
  ActionButton,
  QueryInput,
  PaletteInput,
  LoadingState,
  Skeleton,
  SkeletonGroup,
  InlineNotice,
} from '../ui';

import {
  Search,
  Zap,
  Network,
  X,
  GitBranch,
  MessageSquare,
  ExternalLink,
} from '../icons';

/* ─── Section wrapper helper ─── */
function ShowcaseSection({ title, children }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <p style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--color-text-muted)',
        marginBottom: 12,
        fontFamily: 'var(--font-sans)',
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
        {children}
      </div>
    </section>
  );
}

export function PrimitiveShowcase() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-surface-void)',
      color: 'var(--color-text-body)',
      fontFamily: 'var(--font-sans)',
      padding: '48px',
      overflowY: 'auto',
    }}>
      <p className="text-display" style={{ marginBottom: 8 }}>
        Primitive Showcase
      </p>
      <p className="text-body" style={{ marginBottom: 48, opacity: 0.5 }}>
        Development-only • Not production code
      </p>

      {/* GlassPanel */}
      <ShowcaseSection title="GlassPanel">
        <GlassPanel style={{ padding: 16, width: 160 }}>Elevation 1</GlassPanel>
        <GlassPanel elevation={2} style={{ padding: 16, width: 160 }}>Elevation 2</GlassPanel>
        <GlassPanel elevation={3} ambient style={{ padding: 16, width: 160 }}>Ambient Glow</GlassPanel>
      </ShowcaseSection>

      {/* CommandButton */}
      <ShowcaseSection title="CommandButton">
        <CommandButton shortcut="⌘K" icon={Search}>Search</CommandButton>
        <CommandButton variant="ghost" shortcut="⌘J" icon={MessageSquare}>Ask AI</CommandButton>
        <CommandButton variant="accent" icon={Zap}>Impact</CommandButton>
        <CommandButton disabled icon={Network}>Disabled</CommandButton>
      </ShowcaseSection>

      {/* StatusBadge */}
      <ShowcaseSection title="StatusBadge">
        <StatusBadge variant="success">Indexed</StatusBadge>
        <StatusBadge variant="warning">Partial</StatusBadge>
        <StatusBadge variant="error">Failed</StatusBadge>
        <StatusBadge variant="info">Thinking</StatusBadge>
        <StatusBadge variant="neutral">Idle</StatusBadge>
        <StatusBadge variant="info" pulse dotOnly aria-label="AI thinking" />
      </ShowcaseSection>

      {/* SectionHeader */}
      <ShowcaseSection title="SectionHeader">
        <GlassPanel style={{ width: 220 }}>
          <SectionHeader action={<ActionButton icon={X} aria-label="Close" size="sm" />}>
            Node Inspector
          </SectionHeader>
        </GlassPanel>
        <GlassPanel style={{ width: 220 }}>
          <SectionHeader size="caption" divider>Dependencies</SectionHeader>
        </GlassPanel>
      </ShowcaseSection>

      {/* ActionButton */}
      <ShowcaseSection title="ActionButton">
        <ActionButton icon={GitBranch} aria-label="Trace execution" />
        <ActionButton icon={ExternalLink} aria-label="Open in editor" />
        <ActionButton icon={MessageSquare} aria-label="Ask AI">Ask AI</ActionButton>
        <ActionButton icon={Network} aria-label="Impact" variant="outlined">Impact</ActionButton>
        <ActionButton icon={Zap} aria-label="Analyze" disabled>Disabled</ActionButton>
      </ShowcaseSection>

      {/* QueryInput */}
      <ShowcaseSection title="QueryInput">
        <QueryInput
          aria-label="Search graph nodes"
          placeholder="Filter nodes…"
          leadingIcon={Search}
          style={{ width: 240 }}
        />
      </ShowcaseSection>

      {/* PaletteInput */}
      <ShowcaseSection title="PaletteInput">
        <GlassPanel elevation={3} style={{ width: 480 }}>
          <PaletteInput placeholder="Search anything, ask anything…" />
        </GlassPanel>
      </ShowcaseSection>

      {/* LoadingState */}
      <ShowcaseSection title="LoadingState">
        <GlassPanel style={{ padding: 24, width: 200 }}>
          <LoadingState message="Resolving dependencies" detail="1,204 symbols" />
        </GlassPanel>
        <GlassPanel style={{ padding: 24, width: 200 }}>
          <LoadingState message="AI is reasoning…" size="sm" />
        </GlassPanel>
      </ShowcaseSection>

      {/* Skeleton */}
      <ShowcaseSection title="Skeleton">
        <GlassPanel style={{ padding: 16, width: 240 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton height="16px" width="60%" radius="sm" />
            <SkeletonGroup lines={3} />
          </div>
        </GlassPanel>
        <Skeleton circle width="40px" />
      </ShowcaseSection>

      {/* InlineNotice */}
      <ShowcaseSection title="InlineNotice">
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InlineNotice variant="error" title="Parse error">
            Unexpected token at line 44. File is excluded from the graph.
          </InlineNotice>
          <InlineNotice variant="warning">
            Indexing is 40% complete — graph may be incomplete.
          </InlineNotice>
          <InlineNotice variant="info" onDismiss={() => {}}>
            Impact analysis runs deterministically on the current graph state.
          </InlineNotice>
          <InlineNotice variant="success">
            Repository indexed successfully. 1,204 symbols resolved.
          </InlineNotice>
        </div>
      </ShowcaseSection>
    </div>
  );
}
