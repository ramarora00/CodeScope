// Simple in‑memory event bus (framework‑agnostic, pure JavaScript)
// Listeners are stored per event name in a Set to guarantee uniqueness.
// The internal `listeners` map is **not** exported, preserving encapsulation.

const listeners = new Map();

/** Emit an event with an optional payload. */
export function emit(event, payload) {
  if (!event) return;
  const handlers = listeners.get(event);
  if (!handlers) return;
  for (const handler of [...handlers]) {
    try {
      handler(payload);
    } catch (_) {
      // Swallow errors to keep other handlers safe.
    }
  }
}

/** Subscribe a handler to an event. Duplicate handlers are ignored. */
export function subscribe(event, handler) {
  if (!event || typeof handler !== 'function') return;
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(handler);
}

/** Unsubscribe a handler from an event. */
export function unsubscribe(event, handler) {
  const set = listeners.get(event);
  if (!set) return;
  set.delete(handler);
  if (set.size === 0) {
    listeners.delete(event);
  }
}

/** Remove all listeners for all events. */
export function clear() {
    listeners.clear();
}

/** Return true if the given event has any subscribers. */
export function hasSubscribers(event) {
  const set = listeners.get(event);
  return !!set && set.size > 0;
}

/** Return the number of subscribers for the given event. */
export function getSubscriberCount(event) {
  const set = listeners.get(event);
  return set ? set.size : 0;
}
