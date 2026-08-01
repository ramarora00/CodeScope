/**
 * Investigation Event Stream — Unified Schema
 *
 * PRINCIPLE: The UI never knows if events are simulated or real.
 * Mock runtime, live backend, and Claude all emit this same schema.
 *
 * Event types:
 *   timeline  — Investigation panel timeline entry (connect/index/search)
 *   appear    — AI opens a new file (Observation + Focus update)
 *   read      — AI reads a specific line (Observation read-head moves)
 *   follow    — AI follows a symbol reference
 *   jump      — AI transitions to a different file
 *   pause     — Deliberate cognitive pause (read-head holds)
 *   insight   — AI forms a conclusion about a finding
 *   resolve   — Investigation complete
 */

// ─────────────────────────────────────────────────────────────────
// MOCK FILE CONTENT
// Realistic TypeScript for the JWT auth failure investigation.
// ─────────────────────────────────────────────────────────────────

export const MOCK_FILES = {
  'auth.middleware.ts': `import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../jwt/jwt.service';
import { SessionService } from '../session/session.service';
import { UserRepository } from '../user/user.repository';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly userRepository: UserRepository,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtService.verify(token);
      const session = await this.sessionService.findByUserId(payload.sub);

      if (!session?.isActive) {
        res.status(401).json({ error: 'Session is no longer active' });
        return;
      }

      req.user = await this.userRepository.findById(payload.sub);
      next();
    } catch (err) {
      // ⚠ BUG: TokenExpiredError is caught here but no refresh is attempted.
      // The token silently fails without triggering the refresh flow.
      res.status(401).json({ error: 'Unauthorized' });
    }
  }
}`,

  'jwt.service.ts': `import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './jwt.types';

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor(
    private readonly jwt: NestJwtService,
    private readonly config: ConfigService,
  ) {
    this.secret = this.config.get<string>('JWT_SECRET')!;
    this.expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');
  }

  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return this.jwt.sign(payload, {
      secret: this.secret,
      expiresIn: this.expiresIn,
    });
  }

  verify(token: string): JwtPayload {
    return this.jwt.verify<JwtPayload>(token, { secret: this.secret });
  }

  decode(token: string): JwtPayload | null {
    return this.jwt.decode<JwtPayload>(token);
  }
}`,

  'session.guard.ts': `import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionService } from '../session/session.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    const session = await this.sessionService.findByUserId(user.id);

    // NOTE: This checks isActive but does not attempt token refresh on expiry.
    return session?.isActive ?? false;
  }
}`,

  'token.refresh.ts': `import { Injectable } from '@nestjs/common';
import { JwtService } from '../jwt/jwt.service';
import { SessionService } from '../session/session.service';
import { UserRepository } from '../user/user.repository';
import { TokenExpiredError } from 'jsonwebtoken';

@Injectable()
export class TokenRefreshService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly userRepository: UserRepository,
  ) {}

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let payload;

    try {
      payload = this.jwtService.verify(refreshToken);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        await this.sessionService.invalidateByToken(refreshToken);
        throw new Error('Refresh token expired — please log in again');
      }
      throw err;
    }

    const user = await this.userRepository.findById(payload.sub);

    if (!user?.isActive) {
      throw new Error('User account is disabled');
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }
}`,
};

// ─────────────────────────────────────────────────────────────────
// LINE TYPE CLASSIFIER
// Determines reading speed for each code line.
// ─────────────────────────────────────────────────────────────────

export function classifyLine(text) {
  const t = text.trim();
  if (t === '' || t === '{' || t === '}' || t === '};') return 'blank';
  if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*') || t.startsWith('*/')) return 'comment';
  if (t.startsWith('import ') || t.startsWith('export {')) return 'import';
  if (t.startsWith('throw ')) return 'throw';
  if (t.startsWith('if (') || t.startsWith('if(')) return 'if';
  if (t.startsWith('return ')) return 'return';
  if (t.includes('await ')) return 'await';
  if (t.includes('async ') || t.includes('function ') || t.includes(') {') || t.startsWith('@')) return 'function';
  if (t.includes('= ') && !t.includes('==')) return 'assignment';
  return 'other';
}

// Reading speed per line type (ms)
export const LINE_DURATIONS = {
  blank:      40,
  import:     50,   // fast
  comment:    50,   // fast
  assignment: 150,
  return:     300,  // medium
  function:   600,  // pause
  await:      500,
  if:         1000, // long pause
  throw:      650,
  other:      180,
};

// ─────────────────────────────────────────────────────────────────
// INVESTIGATION EVENT SCRIPT
// Timeline + reading events for the JWT auth investigation.
// ─────────────────────────────────────────────────────────────────

const TIMELINE_EVENTS = [
  {
    type: 'timeline',
    id: 'connect',
    timestamp: '00:05',
    label: 'Connected to GitHub',
    sublabel: 'acme/payments-service',
    status: 'done',
  },
  {
    type: 'timeline',
    id: 'index',
    timestamp: '00:07',
    label: 'Indexed 1,284 files',
    sublabel: '3.2s',
    status: 'done',
  },
  {
    type: 'timeline',
    id: 'search',
    timestamp: '00:09',
    label: 'Searched "jwt expired session"',
    sublabel: '18 matches in 5 files',
    status: 'done',
  },
  {
    type: 'timeline',
    id: 'reading-auth',
    timestamp: '00:20',
    label: 'Reading auth.middleware.ts',
    sublabel: 'Entry point found',
    status: 'active',
    insight: 'verifyToken swallows TokenExpiredError silently — no refresh triggered',
    next: 'Check session guard for re-validation logic',
    then: 'Verify refresh token endpoint handles expiry',
  },
];

// Build read events for a file by scanning its lines
function buildReadEvents(filename, startLine = 1, endLine = null) {
  const content = MOCK_FILES[filename];
  if (!content) return [];
  const lines = content.split('\n');
  const end = endLine ? Math.min(endLine, lines.length) : lines.length;
  const events = [];

  for (let i = startLine - 1; i < end; i++) {
    const lineText = lines[i];
    const lineType = classifyLine(lineText);
    const duration = LINE_DURATIONS[lineType];

    events.push({
      type: 'read',
      file: filename,
      line: i + 1,
      lineType,
      duration,
      text: lineText,
    });

    // Insert organic pauses at significant lines
    if (lineType === 'throw') {
      events.push({ type: 'pause', duration: 800 });
    } else if (lineType === 'if') {
      events.push({ type: 'pause', duration: 300 });
    } else if (lineType === 'await') {
      events.push({ type: 'pause', duration: 200 });
    } else if (lineType === 'function' && i > 3) {
      events.push({ type: 'pause', duration: 400 });
    }
  }
  return events;
}

export const INVESTIGATION_SCRIPT = [
  // ── Timeline entries ──
  ...TIMELINE_EVENTS.map(e => ({ ...e })),

  // ────────────────────────────────────────────────────────────────
  // SEARCHING PHASE — fast, systematic, scanning
  // ────────────────────────────────────────────────────────────────
  { type: 'phase', phase: 'searching', label: 'Searching' },
  {
    type: 'appear',
    file: 'auth.middleware.ts',
    reason: 'Authentication middleware — request entry point',
  },
  { type: 'pause', duration: 700 },

  // Read imports (fast)
  ...buildReadEvents('auth.middleware.ts', 1, 7),

  // Line 6 — TokenExpiredError imported but something feels off
  {
    type: 'follow',
    file: 'auth.middleware.ts',
    line: 6,
    symbol: 'TokenExpiredError',
    reason: 'TokenExpiredError is imported — is it actually caught separately?',
  },
  { type: 'pause', duration: 900 },

  // ────────────────────────────────────────────────────────────────
  // UNDERSTANDING PHASE — slower, deliberate, annotating
  // ────────────────────────────────────────────────────────────────
  { type: 'phase', phase: 'understanding', label: 'Understanding' },
  {
    type: 'jump',
    file: 'jwt.service.ts',
    reason: 'Following JwtService.verify() — what errors does it propagate on expiry?',
  },
  {
    type: 'appear',
    file: 'jwt.service.ts',
    reason: 'JWT service — tracing error behaviour of verify()',
  },
  { type: 'pause', duration: 500 },

  // Scan the service quickly
  ...buildReadEvents('jwt.service.ts', 1, 14),

  {
    type: 'insight',
    file: 'jwt.service.ts',
    line: 28,
    text: 'verify() propagates TokenExpiredError directly — middleware must handle it explicitly or it falls through.',
    confidence: 'Medium',
  },
  { type: 'pause', duration: 600 },

  // ────────────────────────────────────────────────────────────────
  // CONNECTING PHASE — jumping between files, building the map
  // ────────────────────────────────────────────────────────────────
  { type: 'phase', phase: 'connecting', label: 'Connecting' },
  {
    type: 'jump',
    file: 'auth.middleware.ts',
    reason: 'Back to middleware — checking what the catch block actually does with the error',
  },
  {
    type: 'appear',
    file: 'auth.middleware.ts',
    reason: 'Returning to middleware — tracing catch block behaviour',
  },
  { type: 'pause', duration: 500 },

  // Continue reading from line 16 onward — the use() method body
  ...buildReadEvents('auth.middleware.ts', 16, 43),

  { type: 'pause', duration: 1400 }, // long pause — the AI has found the bug

  {
    type: 'insight',
    file: 'auth.middleware.ts',
    line: 34,
    text: 'catch block returns 401 for ALL errors — TokenExpiredError is swallowed without triggering refresh.',
    confidence: 'High',
  },
  { type: 'pause', duration: 800 },

  // ────────────────────────────────────────────────────────────────
  // VERIFYING PHASE — re-reading, confirming, cross-checking
  // ────────────────────────────────────────────────────────────────
  { type: 'phase', phase: 'verifying', label: 'Verifying' },
  {
    type: 'jump',
    file: 'session.guard.ts',
    reason: 'Does SessionGuard attempt token refresh before failing?',
  },
  {
    type: 'appear',
    file: 'session.guard.ts',
    reason: 'Session guard — last validation layer, checking for refresh attempt',
  },
  { type: 'pause', duration: 500 },
  ...buildReadEvents('session.guard.ts', 1, 24),

  {
    type: 'insight',
    file: 'session.guard.ts',
    line: 22,
    text: 'SessionGuard checks isActive but never triggers token refresh — confirms the gap.',
    confidence: 'High',
  },
  { type: 'pause', duration: 600 },

  // ────────────────────────────────────────────────────────────────
  // PHASE 5 — Jump to token.refresh.ts — is the fix even possible?
  // ────────────────────────────────────────────────────────────────
  {
    type: 'jump',
    file: 'token.refresh.ts',
    reason: 'Checking if TokenRefreshService exists and is callable from middleware',
  },
  {
    type: 'appear',
    file: 'token.refresh.ts',
    reason: 'Token refresh service — verifying the fix path exists',
  },
  { type: 'pause', duration: 400 },
  ...buildReadEvents('token.refresh.ts', 1, 20),

  // Brief return to middleware to confirm nothing catches specifically
  {
    type: 'jump',
    file: 'auth.middleware.ts',
    reason: 'Final check — confirming no specific TokenExpiredError handler exists',
  },
  {
    type: 'appear',
    file: 'auth.middleware.ts',
    reason: 'Confirming root cause — catch block never calls TokenRefreshService',
  },
  { type: 'pause', duration: 400 },
  // Quick scan of just the catch block again
  ...buildReadEvents('auth.middleware.ts', 30, 37),
  // ────────────────────────────────────────────────────────────────
  // CONCLUSION PHASE — slow, deliberate, re-confirming root cause
  // ────────────────────────────────────────────────────────────────
  { type: 'phase', phase: 'concluding', label: 'Concluding' },
  { type: 'pause', duration: 1000 },

  // ────────────────────────────────────────────────────────────────
  // RESOLVE — root cause confirmed
  // ────────────────────────────────────────────────────────────────
  {
    type: 'resolve',
    confidence: 100,
    reason: 'Root cause confirmed: AuthMiddleware catch block swallows TokenExpiredError and returns 401 without calling TokenRefreshService.refresh(). The refresh endpoint exists and works correctly. Fix: in the catch block, instanceof-check for TokenExpiredError and call the refresh service before re-validating the session.',
  },
];


// ─────────────────────────────────────────────────────────────────
// CLAUDE RUNTIME CLASS
// Emits unified InvestigationEvents to all subscribers.
// ─────────────────────────────────────────────────────────────────

export class ClaudeRuntime {
  constructor() {
    this.listeners = new Set();
    this.currentIndex = -1;
    this.isPlaying = false;
    this.timer = null;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event) {
    this.listeners.forEach(l => l(event));
  }

  start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentIndex = -1;
    this.next();
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  reset() { this.stop(); this.currentIndex = -1; }

  next() {
    if (!this.isPlaying) return;
    this.currentIndex++;
    if (this.currentIndex >= INVESTIGATION_SCRIPT.length) {
      this.isPlaying = false;
      return;
    }

    const step = INVESTIGATION_SCRIPT[this.currentIndex];
    this.emit(step);

    // Duration: use step.duration for pause/read, else fixed per type
    let delay;
    if (step.type === 'pause')   delay = step.duration || 400;
    else if (step.type === 'read')    delay = step.duration || 200;
    else if (step.type === 'appear')  delay = 600;
    else if (step.type === 'jump')    delay = 900;
    else if (step.type === 'follow')  delay = 700;
    else if (step.type === 'insight') delay = 1200;
    else if (step.type === 'timeline')delay = 80;
    else if (step.type === 'resolve') delay = 2000;
    else delay = 300;

    this.timer = setTimeout(() => this.next(), delay);
  }
}
