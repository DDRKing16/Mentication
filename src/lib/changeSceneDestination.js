import { createSecureId } from './secureId';

const TARGETS = ['happyBump', 'dear2100', 'different'];
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Only non-personal, secure identifiers cross the final-check-in checkpoint.
// Reuse the token if clearing a draft failed and Finish is retried.
export function createSceneDestination(target, existingToken = null) {
  if (!TARGETS.includes(target)) throw new Error('That follow-up is not available.');
  const handoffToken = existingToken ?? createSecureId();
  if (typeof handoffToken !== 'string' || !UUID_V4.test(handoffToken)) throw new Error('A secure follow-up identifier could not be created.');
  return { handoffToken, navigateTo: `/scene-followup?practice=${target}&session=${handoffToken}` };
}
