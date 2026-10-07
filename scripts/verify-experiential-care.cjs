/* Preserve the two-practice verification entry point. */
process.env.CARE_IDS ||= 'unhook,makeRoom';
require('./verify-single-question-care.cjs');
