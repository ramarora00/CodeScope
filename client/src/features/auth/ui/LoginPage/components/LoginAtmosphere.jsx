import React from 'react';

export default function LoginAtmosphere({ isAuthenticating }) {
  return (
    <div className={`login-atmosphere ${isAuthenticating ? 'portal-contract' : ''}`} aria-hidden="true">
      <div className="stars stars-a" />
      <div className="stars stars-b" />
      <div className="atmo-glow" />
      
      {/* Central Cinematic Portal Gateway */}
      <div className="portal-gateway">
        <svg className="portal-svg" viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Faint radial investigation field behind login card (ellipse 40% 35% at 50% 48%) */}
          <ellipse cx="400" cy="288" rx="320" ry="210" fill="url(#investigation-field-glow)" />
          
          <defs>
            <radialGradient id="investigation-field-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#5f82b4" stopOpacity="0.055" />
              <stop offset="100%" stopColor="#5f82b4" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>
      </div>
      <div className="horizon" />
    </div>
  );
}