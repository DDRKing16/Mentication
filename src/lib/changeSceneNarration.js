import { SCENE_ACTIONS } from './changeSceneSession.js';
// The audit/generation inventory follows the exact displayed instructions.
// Missing recordings remain text-only; never play an old instruction for a new choice.
export const CHANGE_SCENE_NARRATION = Object.freeze({
  start:'Try a small change around you. Skip anything that does not fit.',
  ...Object.fromEntries(SCENE_ACTIONS.flatMap((action,index)=>[
    [`s${index+1}`,action.primary],
    [`s${index+1}Alternative`,action.alternative],
  ])),
  end:'Notice how you feel now. A change is not required.',
});
