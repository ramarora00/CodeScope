import React, { useState, useEffect } from 'react';
import { loginWithGoogle, loginWithEmail, registerWithEmail, isFirebaseConfigured } from '../../../auth/authService';
import CursorReactiveVisual from './CursorReactiveVisual';

export default function LoginExperience() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [authState, setAuthState] = useState('IDLE');

  useEffect(() => {
    const handleMouseMove = () => {
      if (authState === 'IDLE') {
        setAuthState('CURSOR_MOVEMENT');
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [authState]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthState('AUTHENTICATING');
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google');
      setAuthState('IDLE');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setAuthState('AUTHENTICATING');
    setError(null);
    try {
      if (isRegistering) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Authentication failed');
      setAuthState('IDLE');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="w-full h-full min-h-screen flex flex-col justify-between select-none relative overflow-hidden font-sans p-8 md:p-16"
      style={{ background: 'var(--cs-bg)' }}
    >
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_20%_30%,var(--cs-accent-dim)_0%,transparent_50%)]" />

      {/* Brand Header */}
      <div className="flex items-center gap-2 z-20">
        <span className="text-[var(--cs-accent)] text-base">✦</span>
        <span className="text-[15px] font-semibold tracking-wide text-[var(--cs-text)]">CodeScope</span>
      </div>

      {/* Symmetrical Layout Grid */}
      <div className="flex-1 flex items-center justify-center max-w-6xl w-full mx-auto z-10 py-8">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Vision Statement & AI Observatory */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-10">
            <div className="space-y-4">
              <h1 className="text-[44px] font-semibold text-[var(--cs-text)] tracking-tight leading-[1.1]">
                Understand.<br />
                Trace.<br />
                Build better.
              </h1>
              <p className="text-[13px] text-[var(--cs-muted)] max-w-sm leading-relaxed">
                AI-powered codebase intelligence that explains your entire project.
              </p>
            </div>

            {/* Premium visual component */}
            <div className="flex justify-start -ml-6">
              <CursorReactiveVisual authState={authState} />
            </div>
          </div>

          {/* Right Column: Glass Card Form */}
          <div className="col-span-1 lg:col-span-5 flex justify-center lg:justify-end">
            
            <div 
              className="w-full max-w-[400px] border rounded-2xl p-10 shadow-2xl transition-all duration-300 animate-rise"
              style={{ 
                background: 'var(--cs-glass-panel)', 
                backdropFilter: 'var(--cs-blur-panel)', 
                borderColor: 'var(--cs-border)' 
              }}
            >
              <div className="space-y-6">
                
                {/* Header Title */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <span className="text-lg text-[var(--cs-accent)]">✦</span>
                  <div className="space-y-1">
                    <h2 className="text-[20px] font-semibold tracking-tight text-[var(--cs-text)]">
                      {isRegistering ? 'Create your account' : 'Welcome back'}
                    </h2>
                    <p className="text-[12px] text-[var(--cs-muted)]">
                      {isRegistering ? 'Sign up to get started' : 'Sign in to continue to CodeScope'}
                    </p>
                  </div>
                </div>

                {/* Dev Mode Banner */}
                {!isFirebaseConfigured && (
                  <div 
                    className="p-3 rounded-lg border text-[11px] text-[var(--cs-accent)] leading-relaxed font-mono"
                    style={{ background: 'var(--cs-hover)', borderColor: 'var(--cs-border)' }}
                  >
                    <strong>Dev Mode</strong>: Firebase unconfigured. Submit any values or click Google to bypass.
                  </div>
                )}

                {/* Error Box */}
                {error && (
                  <div 
                    className="p-3 rounded-lg border text-[11px] text-[var(--cs-red)] leading-relaxed"
                    style={{ background: 'rgba(248,81,73,0.04)', borderColor: 'rgba(248,81,73,0.15)' }}
                  >
                    {error}
                  </div>
                )}

                {/* Forms */}
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  
                  {/* Google Login */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleGoogleSignIn}
                    className="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-lg border text-[12px] font-medium text-[var(--cs-text)] transition-all cursor-pointer disabled:opacity-40 hover:brightness-110"
                    style={{ background: 'var(--cs-hover)', borderColor: 'var(--cs-border)' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.6 15 1 12 1 7.4 1 3.5 3.7 1.7 7.7l3.9 3C6.5 7.7 9 5.04 12 5.04z" />
                      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                      <path fill="#FBBC05" d="M5.6 14.7c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2l-3.9-3C.9 9.3.5 10.6.5 12s.4 2.7 1.2 3.9l3.9-3.2z" />
                      <path fill="#34A853" d="M12 23c3.2 0 6-1 8-2.9l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.7l-3.9 3C3.5 20.8 7.4 23 12 23z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-4 py-1">
                    <div className="flex-1 h-[1px]" style={{ background: 'var(--cs-border)' }} />
                    <span className="text-[10px] uppercase tracking-wider text-[var(--cs-faint)] font-mono">or</span>
                    <div className="flex-1 h-[1px]" style={{ background: 'var(--cs-border)' }} />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-[var(--cs-muted)]">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setAuthState('EMAIL_FOCUS')}
                      onBlur={() => setAuthState('IDLE')}
                      placeholder="you@example.com"
                      required
                      disabled={loading}
                      className="w-full h-10 px-4 rounded-lg border text-[13px] outline-none transition-all font-sans"
                      style={{ background: 'var(--cs-panel)', borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-[var(--cs-muted)]">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setAuthState('PASSWORD_FOCUS')}
                      onBlur={() => setAuthState('IDLE')}
                      placeholder="Enter your password"
                      required
                      disabled={loading}
                      className="w-full h-10 px-4 rounded-lg border text-[13px] outline-none transition-all font-sans"
                      style={{ background: 'var(--cs-panel)', borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                    />
                  </div>

                  {/* Remember Me / Forgot */}
                  <div className="flex items-center justify-between text-[11px] text-[var(--cs-muted)] py-1 font-sans">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-[var(--cs-text)] transition-colors">
                      <input 
                        type="checkbox" 
                        className="rounded border-[var(--cs-border)] bg-black text-[var(--cs-accent)] focus:ring-0 focus:ring-offset-0" 
                      />
                      <span>Remember me</span>
                    </label>
                    <a href="#" className="hover:text-[var(--cs-text)] transition-colors">Forgot password?</a>
                  </div>

                  {/* Sign In Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border text-[13px] font-semibold transition-all cursor-pointer disabled:opacity-40 hover:brightness-110"
                    style={{ background: 'var(--cs-hover)', borderColor: 'var(--cs-border)', color: 'var(--cs-text)' }}
                  >
                    <span>{loading ? 'Sign-in in progress...' : isRegistering ? 'Sign up' : 'Sign in'}</span>
                    {!loading && <span className="text-[14px]">→</span>}
                  </button>

                </form>

                {/* Footer Switcher */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-[11.5px] text-[var(--cs-muted)] hover:text-[var(--cs-text)] transition-colors cursor-pointer"
                  >
                    {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Symmetrical Quote and Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-[var(--cs-faint)] font-mono z-10">
        <div className="border-l border-white/5 pl-3 py-0.5 hidden lg:block">
          <p className="text-[11px] text-[var(--cs-muted)] font-mono leading-relaxed">
            We don't just show code. We reveal the logic behind it.
          </p>
        </div>
        <span>© 2025 CodeScope. All rights reserved. • Privacy Policy • Terms of Service</span>
      </div>

    </div>
  );
}
