/**
 * RuntimeAdapter.js
 *
 * Single factory that decouples WorkspaceRoot from
 * which runtime is active. The UI never knows.
 *
 * Current behaviour:
 *   - No repo or demo flag → ClaudeRuntime (mock simulation)
 *   - Real repo (future) → RealRuntime (backend API stream)
 *
 * To add a real backend: implement RealRuntime with the same
 * subscribe(listener) / start() / stop() interface as ClaudeRuntime,
 * then swap it in here. Nothing else changes.
 */
import { ClaudeRuntime } from './ClaudeRuntime';

export function createRuntime(repo) {
  // Future: if (repo && repo.status === 'ready') return new RealRuntime(repo);
  return new ClaudeRuntime();
}
