import React, { useState, useEffect } from 'react';

const Mail = () => (
  <svg viewBox="0 0 24 24" fill="none" className="field-icon">
    <rect x="3.5" y="5" width="17" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="m5 7 7 5 7-5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const Lock = () => (
  <svg viewBox="0 0 24 24" fill="none" className="field-icon">
    <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const Eye = ({ hide }) => (
  <svg viewBox="0 0 24 24" fill="none">
    {hide ? (
      <>
        <path d="m4 4 16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M9.8 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.6 4.4 9.5 7-.3.6-1.3 2-2.8 3.2M6.2 7.2C3.9 8.8 2.7 10.8 2.5 12c.9 1.7 4.3 6 9.5 6 1.2 0 2.3-.2 3.3-.6" stroke="currentColor" strokeWidth="1.5" />
      </>
    ) : (
      <>
        <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </>
    )}
  </svg>
);

export default function LoginPanel({
  email,
  password,
  remember,
  showPassword,
  loading,
  error,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onTogglePassword,
  onFocusField,
  onGoogle,
  onSubmit,
  isSignUp,
  onToggleSignUp
}) {
  const [systemStatus, setSystemStatus] = useState('initializing');

  useEffect(() => {
    const timer = setTimeout(() => setSystemStatus('ready'), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="login-panel">
      {/* Telemetry Header */}
      <div className="panel-telemetry">
        <span>◆ CORE ACCESS // SECURE CHANNEL</span>
        {systemStatus === 'initializing' ? (
          <span className="telemetry-initializing-badge">◌ INITIALIZING</span>
        ) : (
          <span className="telemetry-ready-badge">● READY</span>
        )}
      </div>

      <div className="panel-top">
        <span className="panel-mark">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M24 3 41 13v22L24 45 7 35V13L24 3Z" stroke="currentColor" strokeWidth="1.8" />
            <path d="m20 18-6 6 6 6M28 18l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <h2>{isSignUp ? 'Create your CodeScope account' : 'Welcome to CodeScope'}</h2>
          <p>{isSignUp ? 'Sign up to begin your investigation' : 'Sign in to continue your investigation'}</p>
        </div>
      </div>

      <button className="google" type="button" onClick={onGoogle} disabled={loading}>
        <span className="google-g-wrap">
          <svg className="google-g-logo" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285f4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34a853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#fbbc05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#ea4335" />
          </svg>
        </span>
        <span className="google-text">Continue with Google</span>
      </button>

      <div className="or">
        <span />OR<span />
      </div>

      <form onSubmit={onSubmit}>
        <label className="field-container">
          <span className="field-label-sr">Email Address</span>
          <div className="field">
            <Mail />
            <input 
              type="email" 
              autoComplete="email" 
              required 
              placeholder="you@domain.com" 
              value={email} 
              onChange={e => onEmailChange(e.target.value)}
              onFocus={() => onFocusField('email')}
              onBlur={() => onFocusField(null)}
            />
          </div>
        </label>

        <label className="field-container">
          <span className="field-label-sr">Password</span>
          <div className="field">
            <Lock />
            <input 
              type={showPassword ? 'text' : 'password'} 
              autoComplete="current-password" 
              required 
              placeholder="Enter your password" 
              value={password} 
              onChange={e => onPasswordChange(e.target.value)}
              onFocus={() => onFocusField('password')}
              onBlur={() => onFocusField(null)}
            />
            <button type="button" className="eye" onClick={onTogglePassword} aria-label={showPassword ? "Hide password" : "Show password"}>
              <Eye hide={!showPassword} />
            </button>
          </div>
        </label>

        {error && (
          <div className="auth-error-msg" style={{ color: '#ff6b6b', fontSize: '12px', margin: '-4px 0 12px 2px', textAlign: 'left' }}>
            {error}
          </div>
        )}

        <div className="meta">
          <label className="remember-label">
            <input 
              type="checkbox" 
              className="remember-checkbox-input"
              checked={remember} 
              onChange={e => onRememberChange(e.target.checked)} 
            />
            <span className="custom-checkbox-node" />
            <span className="remember-text">Remember me</span>
          </label>
          {!isSignUp && <button type="button" className="forgot-btn">Forgot password?</button>}
        </div>

        <button className="signin" disabled={loading} type="submit">
          {loading ? 'ENTERING SCOPE...' : (isSignUp ? 'Create Account' : 'Enter Scope')}
          {!loading && (
            <svg className="cta-arrow" viewBox="0 0 24 24" fill="none">
              <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {loading && (
            <svg className="loader-spinner" viewBox="0 0 24 24" fill="none" width="16" height="16">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </form>

      <div className="create">
        {isSignUp ? 'Already have an account?' : 'New to CodeScope?'} 
        <button type="button" onClick={onToggleSignUp}>
          {isSignUp ? 'Sign in' : 'Create account'}
        </button>
      </div>
    </div>
  );
}