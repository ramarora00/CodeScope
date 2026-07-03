/**
 * AppProviders
 *
 * Purpose:     Single composition root for all global React providers.
 *              Wraps the entire application tree. Providers are added here
 *              in dependency order (outermost = least dependent, innermost =
 *              most dependent). Never wrap providers ad-hoc in page or feature
 *              files — they belong here and only here.
 *
 * Current providers (in order):
 *   1. ErrorBoundary     — Catches unhandled render errors, renders fallback.
 *   2. QueryClientProvider — TanStack Query server-state (PENDING: install).
 *   3. ThemeContext      — CSS-variable based, shell only for now.
 *   4. ToastProvider     — Global toast notification context (PENDING).
 *
 * Used By:     main.jsx — wraps <App /> with this provider tree.
 *
 * Dependencies: react (ErrorBoundary, createContext), future: @tanstack/react-query
 *
 * Accessibility: ErrorBoundary fallback uses role="alert" to ensure screen
 *               readers announce the application error state.
 */

import { Component, createContext, useContext } from 'react';

/* ─────────────────────────────────────────
   1. Error Boundary
───────────────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[AppProviders] Unhandled render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            gap: '12px',
            backgroundColor: 'var(--color-surface-void)',
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          <p style={{ color: 'var(--color-status-error)', fontSize: '13px', fontWeight: 500 }}>
            Render error
          </p>
          <p style={{ fontSize: '12px', maxWidth: 400, textAlign: 'center' }}>
            {this.state.error?.message ?? 'An unexpected error occurred. Reload to recover.'}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─────────────────────────────────────────
   2. Theme Context (Shell — CSS token-based)
───────────────────────────────────────── */
const ThemeContext = createContext({ theme: 'dark' });
export const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }) {
  // Theme is driven by CSS custom properties in tokens.css.
  // This context is a shell for future high-contrast or light-mode switching.
  return (
    <ThemeContext.Provider value={{ theme: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ─────────────────────────────────────────
   3. App Providers Composition Root
───────────────────────────────────────── */

/**
 * @param {{ children: React.ReactNode }} props
 */
export function AppProviders({ children }) {
  // PENDING: Wrap with QueryClientProvider when @tanstack/react-query is installed.
  // PENDING: Wrap with ToastProvider when toast system is implemented.
  return (
    <ErrorBoundary>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </ErrorBoundary>
  );
}
