/**
 * RuntimeAdapter.js
 *
 * Single factory that decouples WorkspaceRoot from which runtime is active.
 * The UI never knows which runtime is active.
 *
 * Strategy:
 *   - Real repo with id -> RealRuntime (live backend SSE stream)
 *   - No repo / demo flag -> ClaudeRuntime (mock simulation)
 *
 * Adding new transports in the future: implement a new class with the same
 * subscribe(listener) / start() / stop() interface. Nothing else changes.
 */
import { ClaudeRuntime } from './ClaudeRuntime';
import { RealRuntime } from './RealRuntime';

export function createRuntime(repo) {
  console.log('[RuntimeAdapter] createRuntime called with repo:', repo);
  if (repo && repo.id) {
    console.log('[RuntimeAdapter] Returning RealRuntime for repo id:', repo.id);
    return new RealRuntime(repo.id);
  }
  console.log('[RuntimeAdapter] Returning ClaudeRuntime (fallback)');
  return new ClaudeRuntime();
}
