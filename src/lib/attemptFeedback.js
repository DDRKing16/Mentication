// Shared completion contract: emit helpfulness = helpful | same | worse | unsure.
// Keep the measured rating response separately. One attempt supplies one sample:
// explicit helpfulness takes precedence; otherwise use its measured response.
export const HELPFULNESS = [
  { id: 'helpful', label: 'Helpful', response: 'better' },
  { id: 'same', label: 'No change', response: 'same' },
  { id: 'worse', label: 'Felt worse', response: 'worse' },
  { id: 'unsure', label: 'Not sure', response: 'not_answered' },
];
const answered = (value) => ['better', 'same', 'worse'].includes(value);
export const helpfulnessResponse = (value) => HELPFULNESS.find((item) => item.id === value)?.response || 'not_answered';
export const learningResponse = (attempt) => answered(attempt?.helpfulness_response) ? attempt.helpfulness_response : attempt?.response || 'not_answered';
export function withAttemptHelpfulness(attempt, helpfulness) {
  const response = helpfulnessResponse(helpfulness);
  return { ...attempt, ...(answered(response) ? { helpfulness_response: response, response } : {}) };
}
export function withMeasuredResponse(attempt, response) {
  return { ...attempt, mood_response: response, response: answered(attempt.helpfulness_response) ? attempt.helpfulness_response : response };
}
