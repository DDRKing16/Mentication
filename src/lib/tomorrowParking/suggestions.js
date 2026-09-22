// Optional prompts for the capture screen. Tapping one appends generic wording
// to the note; nothing here is personal history or prefilled as the user's own.
export const SUGGESTION_GROUPS = Object.freeze({
  "Something unfinished": [
    "An email I haven’t replied to", "A message I meant to send", "A piece of work still open", "Something around the house",
    "A form or application", "An appointment I need to book", "Something I promised someone", "A purchase or return",
    "A plan I haven’t finished", "A loose end from today", "Something I started but paused", "A question I still need answered",
  ],
  "A conversation": [
    "Something I need to say", "Something I wish I’d said", "A reply I’m waiting for", "A difficult conversation",
    "A misunderstanding to clear up", "Someone I need to check in with", "A boundary I need to set", "An apology I’m considering",
    "A question I want to ask", "Something that felt unresolved", "A conversation at work", "A conversation with family",
  ],
  "A decision for later": [
    "Whether to say yes or no", "A choice about work", "A money decision", "Something I might buy", "A plan for the weekend",
    "Whether to make a change", "Which option to choose", "A decision involving someone else", "Something I need more information about",
    "A choice that can wait until morning", "Whether to keep or let go", "What to do next",
  ],
  "Something to remember": [
    "Something to bring with me", "Someone to contact", "A date or appointment", "Something to buy", "A name or detail",
    "An idea I don’t want to lose", "Something someone asked me to do", "A place I need to go", "A question to ask tomorrow",
    "Something to tell someone", "A link or document to find", "A small thing that matters",
  ],
  "Tomorrow’s task": [
    "The first thing I need to do", "Something for work", "A household task", "An errand to run", "A call to make", "Something to send",
    "Something to prepare", "A bill or payment", "An appointment to arrange", "Something with a deadline", "A task I’ve been avoiding",
    "One practical next step",
  ],
  "A worry I can’t solve tonight": [
    "Something outside my control", "Not knowing what will happen", "A worry about someone else", "A work concern", "A money concern",
    "Something about my health", "A mistake I keep replaying", "Something I’m waiting to hear about", "A future problem",
    "A fear I don’t have evidence for yet", "Something that might go wrong", "A question with no answer tonight",
  ],
});
