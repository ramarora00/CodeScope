import React, { useState, useEffect } from 'react';
import LoginAtmosphere from './components/LoginAtmosphere';
import LoginPanel from './components/LoginPanel';
import CodePreview from './components/CodePreview';
import { loginWithEmail, loginWithGoogle, registerWithEmail } from '../../../../auth/authService';
import CodeScopeInfo from '../../../codescope/ui/v2/shared/CodeScopeInfo';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState(null); // 'email' | 'password' | null
  const [isSignUp, setIsSignUp] = useState(false);

  // Dynamic scanning line state cycles through key line numbers
  const [activeLine, setActiveLine] = useState(54);

  useEffect(() => {
    // Dynamic scanning line state cycles through key line numbers
    const lineInterval = setInterval(() => {
      setActiveLine(current => {
        const lines = [53, 54, 56, 58, 61];
        const currentIndex = lines.indexOf(current);
        const nextIndex = (currentIndex + 1) % lines.length;
        return lines[nextIndex];
      });
    }, 3000);

    return () => {
      clearInterval(lineInterval);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      console.error(err);

      // Parse Firebase errors to user-friendly messages
      let message = isSignUp ? 'Account creation failed.' : 'Authentication failed. Please verify credentials.';
      if (err.code === 'auth/email-already-in-use') message = 'This email is already in use.';
      else if (err.code === 'auth/weak-password') message = 'Password should be at least 6 characters.';
      else if (err.code === 'auth/invalid-credential') message = 'Invalid email or password.';

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      let message = 'Google authentication failed.';
      if (err.message && err.message.includes('Database is closing/hidden')) {
        message = 'Local browser storage is busy. Please refresh the page and try again.';
      } else {
        message = err.message || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to map active line numbers to visual Y coordinates in SVG space
  const getActiveLineY = (line) => {
    switch (line) {
      case 53: return 31;
      case 54: return 37;
      case 56: return 49;
      case 58: return 55;
      case 61: return 61;
      default: return 37;
    }
  };
  const targetY = getActiveLineY(activeLine);

  return (
    <div className={`login-page field-${focusedField || 'none'}`}>
      <LoginAtmosphere isAuthenticating={loading} />

      {/* Investigation focus signals (curved overlay lines) */}
      <div className={`focus-signal-overlay field-${focusedField || 'none'}`} aria-hidden="true">
        <svg className="focus-signal-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="signal-gradient-left" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(126, 167, 232, 0)" />
              <stop offset="50%" stopColor="rgba(126, 167, 232, 0.25)" />
              <stop offset="100%" stopColor="rgba(126, 167, 232, 0.7)" />
            </linearGradient>
            <linearGradient id="signal-gradient-right" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(126, 167, 232, 0)" />
              <stop offset="50%" stopColor="rgba(126, 167, 232, 0.25)" />
              <stop offset="100%" stopColor="rgba(126, 167, 232, 0.7)" />
            </linearGradient>
          </defs>
          <path className="signal-path signal-path-left" d="M 0 50 Q 25 20, 50 50" />
          <path className="signal-path signal-path-right" d="M 100 50 Q 75 80, 50 50" />
        </svg>
      </div>

      <header className="login-header flex items-center justify-between px-6">
        <a className="brand" href="/" aria-label="CodeScope home">
          <span className="brand-mark">
            <svg viewBox="0 0 48 48" fill="none">
              <path d="M24 3 42 13.5v21L24 45 6 34.5v-21L24 3Z" stroke="currentColor" strokeWidth="1.8" />
              <path d="m20 18-6 6 6 6M28 18l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>CODESCOPE</span>
        </a>
        <CodeScopeInfo page="login" />
      </header>

      <main className="login-shell">
        <section className="login-left-zone">

          <div className="hero-copy">
            <div className="hero-copy-inner">
              <p className="eyebrow">AI-POWERED CODEBASE INTELLIGENCE</p>
              <h1>Understand.<br />Investigate.<br />Ship with <br /><span>Confidence.</span></h1>
              <p className="hero-description">AI-powered codebase intelligence that reads, reasons, and reveals what matters.</p>

              {/* Live active engine telemetry status */}
              <div className="telemetry-engine-status">
                <span className="status-indicator-dot">●</span>
                <span>ANALYSIS ENGINE ACTIVE // SIGNALS STEADY</span>
              </div>

              <div className="feature-list">
                <div className="feature-item"><span className="signal-icon primary">✦</span> <span>Deep Code Understanding</span></div>
                <div className="feature-item"><span className="signal-icon secondary">◎</span> <span>AI Investigation &amp; Explanations</span></div>
                <div className="feature-item"><span className="signal-icon muted">◇</span> <span>Evidence-backed Insights</span></div>
                <div className="feature-item"><span className="signal-icon secondary">⌁</span> <span>Faster Decisions, Better Code</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="login-column">
          <div className="central-light" aria-hidden="true" />
          <LoginPanel
            {...{ email, password, remember, showPassword, loading, error, isSignUp }}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onRememberChange={setRemember}
            onTogglePassword={() => setShowPassword(v => !v)}
            onFocusField={setFocusedField}
            onGoogle={handleGoogle}
            onSubmit={handleSubmit}
            onToggleSignUp={() => {
              setIsSignUp(prev => !prev);
              setError(''); // Clear errors when toggling mode
            }}
          />
        </section>

        <aside className="login-right-zone">
          <div className="visual-column-inner">
            <div className="engine-layer-wrapper">
              <div className="top-code-wall" aria-hidden="true">
                <div className="top-graph-overlay">
                  <div className="graph-node">src</div>
                  <div className="graph-connector" />
                  <div className="graph-node">components</div>
                  <div className="graph-connector" />
                  <div className="graph-node">auth</div>
                  <div className="graph-connector" />
                  <div className="graph-node">LoginPage.jsx</div>
                </div>
              </div>
              <CodePreview activeLine={activeLine} />
              <div className="repo-graph-overlay" aria-hidden="true">
                <div className="graph-node">AUTH.JS</div>
                <div className="graph-connector" />
                <div className="graph-node">index.js</div>
                <div className="graph-connector" />
                <div className="graph-node">UserModel</div>
                <div className="graph-connector" />
                <div className="graph-node">SessionStore</div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="login-footer">
        <div>◎ <span>Built for developers. Designed for clarity.</span></div>
        <div className="footer-right">
          <span>Trusted by developers who build, scale, and ship.</span>
          <div className="tech-row">
            <span>⚛</span>
            <span>node</span>
            <b>TS</b>
            <span>MongoDB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}