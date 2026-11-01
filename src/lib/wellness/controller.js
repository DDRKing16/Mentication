import { cleanSnapshot, WELLNESS_PROVIDERS } from './providers';

/** Trusted adapters return token-free summaries only. No adapter is installed by
 * default: enabling one requires its native entitlement or authenticated backend.
 * connect() runs only after explicit UI consent. disconnect() must revoke access
 * and delete any server/native cached data before resolving.
 */
export function createWellnessController(adapters = {}) {
  let states = {};
  const listeners = new Set();
  const revisions = {};
  const busy = new Set();
  const read = () => ({ sources: WELLNESS_PROVIDERS.filter(provider => provider.id === 'oura' || adapters[provider.id]).map(provider => ({
    ...provider, status: adapters[provider.id] ? 'disconnected' : 'setup',
    ...states[provider.id],
  })) });
  const emit = () => listeners.forEach(listener => listener(read()));
  async function run(action, id, consent = false) {
    if (!WELLNESS_PROVIDERS.some(provider => provider.id === id) || !adapters[id] || busy.has(id)) return;
    if (action === 'connect' && consent !== true) return;
    if (!['connect', 'sync', 'disconnect', 'status'].includes(action)) return;
    if (action === 'sync' && !states[id]?.connected) return;
    busy.add(id);
    const revision = revisions[id] = (revisions[id] || 0) + 1;
    const previous = states[id] || {};
    states = { ...states, [id]: { ...previous, status: 'loading', error: '' } };
    emit();
    try {
      const result = await adapters[id][action]();
      if (revisions[id] !== revision) return;
      if (action === 'disconnect' || !result?.connected) {
        states = { ...states, [id]: { status: 'disconnected', connected: false } };
      } else {
        const snapshot = result.snapshot ? cleanSnapshot(id, result.snapshot) : null;
        states = { ...states, [id]: { status: 'connected', connected: true, snapshot } };
      }
    } catch {
      // Never expose provider response bodies, tokens or account details to UI.
      if (revisions[id] === revision) states = { ...states, [id]: {
        ...previous, status: 'error', error: action === 'disconnect'
          ? 'Could not disconnect. Access may still be active. Please try again.'
          : 'Could not update this connection. Please try again.',
      } };
    } finally { busy.delete(id); emit(); }
  }
  return { read, run, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); } };
}

// No network requests or native permission prompts in the shipped static build.
export const wellnessController = createWellnessController();
