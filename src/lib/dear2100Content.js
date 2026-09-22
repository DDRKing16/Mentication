// Dear 2100 — suggestion banks and static copy, ported verbatim from the
// locked design (Dear_2100_V2_Copilot_Handoff.zip / app.jsx). Banks are
// deliberately interleaved (negative/positive/negative/neutral/...) so the
// first visible chips are a genuine sentiment mix — preserve that order if
// this copy is ever regenerated or localized.

export const RED = '#D81008';
export const NAVY = '#0038A0';
export const GOLD = '#B8862E';

export const BANK_DISCOVERY = [
  'Learn to play piano', 'Write a book', 'Start my own business', 'Learn a new language', 'Travel solo',
  'Go back to school', 'Try stand-up comedy', 'Learn to paint', 'Run a marathon', 'Change careers',
  'Learn to surf', 'Start a podcast', 'Move to a new city', 'Take a pottery class', 'Learn to cook properly',
  'Write and perform music', 'Get my pilot’s license', 'Start therapy', 'Build something with my hands', 'Learn to dance',
  'Go back into acting', 'Start a garden', 'Learn photography', 'Sing in front of people', 'Get certified in something I love',
  'Volunteer abroad', 'Learn to code', 'Open a small shop', 'Go camping alone', 'Learn an instrument I gave up on',
  'Do an open mic night', 'Write poetry again', 'Take an art class', 'Learn to swim properly', 'Start weightlifting',
  'Get a tattoo I actually want', 'Learn to say no', 'Go to therapy', 'Build a website for my ideas', 'Take improv classes',
  'Learn calligraphy', 'Do a triathlon', 'Learn woodworking', 'Move somewhere warmer', 'Start journaling daily',
  'Learn to meditate properly', 'Reconnect with an old friend', 'Take a solo trip', 'Learn to ride a motorcycle', 'Finish the degree I started',
];

export const BANK_SUCCESS = [
  'I’m capable', 'I follow through', 'I’m braver than I thought', 'I can trust myself', 'I’m not stuck',
  'I’m allowed to want things', 'I’m someone who tries', 'I’m not too late', 'I’m disciplined', 'I’m proud of myself',
  'I’m not my fear', 'I can start things', 'I can finish things', 'I’m growing', 'I’m not who I used to be',
  'I deserve good things', 'I’m resourceful', 'I’m resilient', 'I take myself seriously', 'I’m worth the effort',
  'I can handle hard things', 'I’m not powerless', 'I’m someone people can count on', 'I know what I want', 'I’m not afraid of failing anymore',
  'I’m becoming who I want to be', 'I can change', 'I’m enough as I am', 'I’m not just talk', 'I can trust my own judgment',
  'I’m strong', 'I’m someone worth being', 'I’m not broken', 'I can do hard things quietly', 'I’ve earned this',
  'I’m not behind', 'I’m exactly where I need to be', 'I’m someone who shows up', 'I made it happen', 'I’m not making excuses anymore',
  'I can be proud without needing praise', 'I’m not defined by my past', 'I keep promises to myself', 'I’ve got this', 'I’m not scared of my own potential',
  'I can hold onto joy', 'I’m allowed to be happy', 'I’m someone worth investing in', 'I’m not alone in this', 'I finally believe myself',
];

export const BANK_SELFTALK = [
  'I don’t have time', 'I’m just waiting for the right season for it', 'I’ll fail anyway', 'I need to figure out where to start', 'It’s selfish',
  'Someone needs me more than I need this', 'I have good reasons for taking my time', 'I don’t deserve it', 'I’m not sure it fits my life right now', 'It’s too late for me',
  'I’m not talented enough', 'It’s okay that this isn’t the top priority right now', 'People will judge me', 'I should look into what it actually takes', 'I’ll look stupid',
  'I should focus on more "important" things', 'I’d rather do it properly than rush it', 'What if I’m not actually good at it', 'I need more information before deciding', 'I’m not disciplined enough',
  'It’s probably just a phase', 'I’m allowed to want this, even if it’s inconvenient', 'I don’t have the money for it', 'It depends on my schedule', 'I’ll never catch up to people who started young',
  'I’m too old to start', 'This matters to me, and that’s reason enough', 'I don’t want to embarrass myself', 'I need to weigh the cost against other things', 'It’s not practical',
  'What would people think', 'I can start small and that still counts', 'I don’t have the energy for it', 'I should set a realistic timeline', 'I always quit things',
  'I’m not the "type" of person who does this', 'I don’t need permission to want this', 'I’ll just let everyone down', 'I haven’t prioritized it yet', 'It’s probably too hard for me',
  'I’ll probably regret even starting', 'It’s okay if I’m not great at it right away', 'Everyone will think it’s a bit of a midlife thing', 'I keep meaning to look into it', 'I don’t want to be the beginner in the room',
  'It’s easier to just not try', 'I’m ready to give this a real shot', 'I’m scared I’ll want it too much and still fail', 'I think about it more than I act on it', 'I don’t want to explain myself if it doesn’t work out',
];

export const BANK_BARRIER_EXTRA = [
  'I don’t have the time for it', 'I’m waiting for a better moment, and that’s a fair call', 'Money is tight right now', 'Other things keep coming first', 'I’m scared of failing',
  'I’ve got good reasons for going slow on this', 'I care too much what people think', 'I’m still figuring out what it would even take', 'I don’t feel good enough yet', 'It’s not fear — I just have other priorities right now',
  'I don’t know where to start', 'I keep putting it off',
];

export const BANK_TRIED_BEFORE = [
  'Started but didn’t finish', 'Tried once, years ago', 'Read about it but never acted', 'Took a class or lesson', 'Asked someone for advice',
  'Made a plan but never started', 'Did it for a short while', 'Tried a different version of it', 'Watched others do it', 'Bought what I needed but stopped there',
];

export const BANK_VOICE = [
  'A parent', 'A teacher', 'An old friend', 'A sibling', 'An ex',
  'A coach', 'Society in general', 'My younger self', 'A boss I used to have', 'A classmate who teased me',
  'My inner critic', 'A stranger’s comment, once', 'A parent’s own fear, really', 'Someone who never believed in me', 'A voice I can’t place',
  'The version of me that gave up before', 'A relative who "meant well"', 'Everyone, in general', 'No one specific — just a feeling', 'Someone who was scared for themselves, not me',
  'A friend group I outgrew', 'My own doubt, dressed up as someone else', 'A teacher who compared me to others', 'The loudest voice in the room, whoever that was', 'Someone who never tried either',
];

export const BANK_SAFETY = [
  'I over-prepare for everything', 'I rehearse conversations in my head', 'I stay quiet so I don’t stand out', 'I make a joke to deflect', 'I leave early, just in case',
  'I keep myself busy so I don’t have to think about it', 'I check people’s reactions constantly', 'I say yes when I mean no', 'I avoid eye contact', 'I over-explain myself',
  'I apologise before I even start', 'I downplay what I want', 'I let other people go first', 'I ask for reassurance a lot', 'I plan an exit before I arrive',
  'I say "I’m not that bothered" when I am', 'I procrastinate until there’s no time to fail properly', 'I under-promise so I can’t disappoint anyone', 'I avoid asking for help', 'I stay in the background on purpose',
  'I double- and triple-check everything', 'I rehearse my order before I even walk in', 'I let people talk over me', 'I say I’m "just curious" instead of committed', 'I keep a backup plan for my backup plan',
  'I avoid putting anything in writing', 'I wait for someone else to go first', 'I minimise how much it actually matters to me', 'I distract myself the moment it gets uncomfortable', 'I settle for "good enough" so no one can judge the real attempt',
];

export const BANK_FEELING = [
  'Relieved', 'Proud', 'A little shaky, in a good way', 'Lighter', 'Surprised it wasn’t as bad as I thought',
  'Nervous but glad I did it', 'Calmer than I expected', 'Energized', 'Awkward, but okay with that', 'Vindicated',
  'Still a bit scared, honestly', 'Like myself again', 'Quietly satisfied', 'Emotional', 'Grounded',
  'Like I proved something to myself', 'Uncertain if it counts', 'Grateful I pushed through', 'Tired but in a good way', 'Hopeful',
  'Like the fear was louder than the actual thing', 'A little embarrassed, but fine', 'Stronger', 'Present', 'Like I can do it again',
  'Curious what’s next', 'Less alone with it', 'Like something loosened', 'Steadier', 'Not as different as I expected — and that’s okay',
  'Like I finally believe myself a little more', 'Sore, but proud', 'Quiet, in a settled way', 'Like the old voice was wrong', 'A bit numb, still processing',
  'Excited', 'Like I have evidence now', 'Humbled', 'Clear-headed', 'Like it mattered more than I expected',
  'Free', 'Like I can breathe a bit easier', 'Still nervous about next time', 'Like I kept a promise to myself', 'Softer toward myself',
  'Like the fear passed faster than usual', 'Genuinely happy', 'Like I want to do it again', 'Not sure yet — still sitting with it', 'Like today counted',
];

export const VERDICT_TABS = {
  Audacity: ['Who do you think you are', 'That takes guts', 'Stay in your lane', 'Interesting timing', 'That’s not you', 'I wish I had that courage', 'Must be nice', 'Didn’t expect that from you', 'Bit of a midlife thing, isn’t it', 'That’s inspiring, actually', 'Aren’t you a bit old for that', 'Where’s this sudden confidence from'],
  Capability: ['You’ll embarrass yourself', 'You’ve got what it takes', 'You always quit', 'Let’s see how it goes', 'People will laugh', 'You’re more capable than you think', 'You’re not built for this', 'It’ll take practice', 'You don’t have what it takes', 'I believe you can do this', 'You’ll probably give up again', 'That’s not really your strength'],
  Practicality: ['That’s not realistic', 'There’s never a perfect time anyway', 'You’re too old now', 'It’ll take some planning', 'It’s selfish', 'Worth making room for', 'Bad timing, honestly', 'Depends how serious you are', 'You can’t really afford to right now', 'Life’s too short not to', 'There’s too much else going on', 'It’s not the smartest use of your time'],
};

export const FEAR_CHAIN = ['Everyone would see I couldn’t do it', 'They’d think less of me', 'I’d feel humiliated', 'I’m not worthy of it'];

export const FEAR_CHAIN_STEPS = [
  {
    placeholder: 'If it went badly…',
    bank: ['Everyone would see I couldn’t do it', 'I’d embarrass myself in front of people', 'I’d prove I was never good enough', 'People would think I was foolish for trying', 'I’d confirm my own doubts about myself', 'It would be obvious I don’t belong there', 'I’d have wasted the time and money', 'Someone would say "I told you so"'],
  },
  {
    placeholder: 'And then…',
    bank: ['They’d think less of me', 'I’d lose their respect', 'People would talk about it behind my back', 'I’d be the one who tried and failed', 'It would confirm what they already suspected', 'I’d have to explain why it didn’t work', 'They’d stop taking me seriously', 'No one would say anything, but I’d know'],
  },
  {
    placeholder: 'Which would mean…',
    bank: ['I’d feel humiliated', 'I’d feel exposed', 'I’d feel small', 'I’d feel like a fraud', 'I’d feel like I don’t measure up', 'I’d feel ashamed for even trying', 'I’d feel like everyone was right about me', 'I’d feel like I confirmed my worst fear'],
  },
  {
    placeholder: 'And underneath it all…',
    bank: ['I’m not worthy of it', 'I’m not good enough', 'I don’t deserve good things', 'I’m fundamentally not capable', 'I’m an impostor', 'I’ll always fall short', 'I’m not who I want to be', 'I’m not enough, full stop'],
  },
];

export const BANK_LIFENOW = [
  'I’d feel proud of myself for finally starting', 'I’d still feel a bit nervous about it, honestly', 'I’d have something to look forward to each week',
  'I’m not sure it would feel like much at first', 'I’d feel more like myself again', 'It might feel awkward before it feels good',
  'I’d have proof I can follow through', 'I’d probably still doubt myself sometimes', 'It would give me a new sense of purpose',
  'I’d stop wondering "what if"', 'I’d feel lighter, like something shifted', 'I’d have a new skill that’s actually mine',
  'I’d be excited about something again', 'I’d feel like I’m keeping a promise to myself', 'It could open up a new source of income',
];

export const FUTURE20_AVOID = ['A full life, lived just beside the one I wanted', 'A story about what I meant to do', 'Comfortable, but never quite mine', 'A long, quiet compromise', 'A life that never quite started', 'Still telling myself "someday"', 'The same excuse, twenty years older'];
export const FUTURE20_ACT = ['Twenty years of going after what matters', 'A mission, not a wish', 'A life I actually chose', 'Proof fear doesn’t get the final word', 'A life I’d choose again', 'Something I built, not just imagined', 'Fewer "what ifs" to carry around'];

export const JUDGED_OPTIONS = [
  { id: 'A', text: 'Choosing things others would like me to' },
  { id: 'B', text: 'Going after what I want' },
];

export const POV_STEPS = [
  { n: '01', t: 'Threat detected', d: 'Vision flags the shape in the grass', plain: 'Automatic — you didn’t choose to notice it' },
  { n: '02', t: 'Alarm before thought', d: 'Adrenaline, heart rate loaded', plain: 'Instant — faster than a conscious decision' },
  { n: '03', t: 'Reasoning arrives late', d: 'You already moved — analysis comes after', plain: 'Below awareness — you find out after the fact' },
];

export const TURNING_FLOW_BASE = [
  { icon: 'compass', label: 'Want' },
  { icon: 'flag', label: 'Intended action' },
  { icon: 'warning', label: 'Turning point' },
  { icon: 'eye', label: 'Outcome', v: 'Relief — the discomfort passes' },
  { icon: 'heart', label: 'Immediate reward', v: 'Short-term comfort, no risk' },
];

export const LANE_INFO = {
  Fast: {
    icon: 'warning',
    body: 'Fires when we perceive danger. The amygdala triggers fight-or-flight — anger, anxiety — before we can think. Its only goal: survive the threat, at all costs.',
  },
  Slow: {
    icon: 'compass',
    body: 'High-level thinking — planning, organizing, attention control, perspective-taking on likely outcomes. But it can get hijacked too: it builds a clever reason to avoid the fear before it can happen.',
  },
};

export const VALUES_BANK = [
  'Courage', 'Kindness', 'Honesty', 'Growth', 'Freedom', 'Creativity', 'Empathy', 'Resilience', 'Integrity', 'Curiosity',
  'Gratitude', 'Balance', 'Ambition', 'Patience', 'Loyalty', 'Adventure', 'Discipline', 'Compassion', 'Independence', 'Humility',
  'Connection', 'Authenticity', 'Generosity', 'Confidence', 'Wisdom', 'Playfulness', 'Justice', 'Simplicity', 'Boldness', 'Service',
];

export const VALUES_IN_ACTION_DATA = {
  Courage: { icon: 'spark', items: ['Speaking up even when your voice shakes', 'Trying before you feel ready', 'Asking for help', 'Starting small, today', 'Saying the thing you almost didn’t', 'Showing up when it would be easier not to'] },
  Kindness: { icon: 'heart', items: ['Assuming the better reason', 'Saying the encouraging thing out loud', 'Being as fair to yourself as to a friend', 'Staying when it’s awkward', 'Checking in without being asked', 'Giving credit before you take it'] },
  Freedom: { icon: 'compass', items: ['Choosing without needing permission', 'Saying no without a paragraph of excuses', 'Trying the thing nobody else would pick', 'Letting go of the "should"', 'Making the call, not waiting for one', 'Living by your own timeline'] },
  Honesty: { icon: 'edit', items: ['Saying what you actually think, kindly', 'Admitting when you got it wrong', 'Not pretending to be further along than you are', 'Telling the truth before it’s comfortable'] },
  Growth: { icon: 'flag', items: ['Trying the thing you’re bad at, on purpose', 'Asking for feedback and actually using it', 'Choosing the harder, more useful path'] },
  Creativity: { icon: 'spark', items: ['Making something just because', 'Trying the weird idea first', 'Giving yourself permission to be a beginner'] },
};

export const CHARTER_VALUES_DEFAULT = ['Courage', 'Kindness', 'Freedom'];

export const TOOLKIT_STEPS = {
  '1 · Notice': {
    icon: 'eye',
    title: 'Stop and notice',
    body: 'Name what\'s happening — even just in your head: "This is a survival alarm, not a fact."',
    sub: 'Naming it creates a little distance and a little time. That gap lets the surge of emotion settle, so your thinking brain gets a chance to filter it before you act.',
  },
  '2 · Mantra': {
    icon: 'spark',
    title: 'Say your line',
    body: '"I can feel this and still act." Pick a short line that\'s true for you, and say it on purpose — not just think it.',
    sub: 'Try: "Thank you, brain, for trying to protect me — but there isn\'t any danger. I don\'t need you at the moment. I\'ll talk to you soon."',
  },
  '3 · Let it pass': {
    icon: 'clock',
    title: 'Let the wave pass, then choose',
    body: 'Don\'t act yet. Just let time pass — the urge always crests and falls on its own, usually within minutes.',
    sub: 'Redirect your attention to something else — music, your phone, a task nearby. Splitting your focus this way makes it harder for your mind to stay locked on the catastrophizing thought.',
  },
};

export const PATHWAY_NODES = [
  { label: 'Old wound', icon: 'shield', v: '"I\'m not good enough" · abandonment' },
  { label: 'Hypervigilance', icon: 'eye', v: 'Brain scans for anything that matches it' },
  { label: 'Trigger', icon: 'warning', v: 'Something new, or being evaluated' },
  { label: 'Imagined threat', icon: 'mask', v: 'Worst case, treated as if it were real' },
  { label: 'Emotional surge', icon: 'heart', v: 'Anxiety, shame or dread flood the body' },
  { label: 'Distorted thought', icon: 'spark', v: 'Catastrophizing, labeling…' },
  { label: 'Urge to escape', icon: 'clock', v: 'A pull to make the discomfort stop, now' },
  { label: 'Avoidance', icon: 'door', v: 'The ego grabs the fastest relief' },
  { label: 'Immediate relief', icon: 'coin', v: 'The alarm switches off — briefly' },
  { label: 'Outcome', icon: 'flag', v: 'Relief now — the wound gets reinforced' },
];

export const DISTORTIONS = [
  { name: 'Catastrophizing', icon: 'warning', example: '"This will be a total disaster."' },
  { name: 'Emotional reasoning', icon: 'heart', example: '"I feel anxious, so it must be dangerous."' },
  { name: 'Labeling', icon: 'mask', example: '"I\'m a failure."' },
  { name: 'Mental filtering', icon: 'eye', example: 'Replaying the one bad comment, forgetting the ten good ones.' },
];

export const PATHWAY_STEPS = ['The wound', 'The map', 'The distortions', 'Why it runs deep'];

export const CONTEXT_QUESTIONS = [
  { key: 'time', q: 'How much time can you realistically give this, most days?', options: ['5–10 min', '15–30 min', '30–60 min', '1hr+'] },
  { key: 'money', q: 'Any budget to put toward it right now?', options: ['None right now', 'A little', 'Whatever it takes'] },
  { key: 'commitments', q: 'Biggest thing competing for your time?', options: ['Work', 'Family', 'Energy levels', 'Nothing major'] },
];

export const ACTION_PLAN_BANK = [
  'Play for five minutes', 'Find one teacher’s number', 'Tell one person I’m starting', 'Watch one tutorial video', 'Set a 10-minute timer and just begin',
  'Write down my first three sessions', 'Ask someone who’s done it for advice', 'Block 15 minutes tomorrow for it', 'Look up a local class this week', 'Buy or borrow the one thing I need',
  'Do the clumsy, imperfect version today', 'Tell no one — just quietly start',
];

export const BANK_REWARD = [
  'watch an episode of something', 'get my favorite coffee', 'take a proper break', 'tell someone what I did', 'buy something small I’ve wanted',
  'do absolutely nothing for 20 minutes', 'go for a walk outside', 'order in tonight', 'play a game, guilt-free', 'take a long shower',
  'listen to my favorite album', 'go to bed early, no guilt', 'call a friend just to chat', 'read for pleasure', 'do something creative just for fun',
];

export const BANK_PRIDE = [
  'Speaking up in a meeting', 'Starting therapy', 'Leaving a job that wasn’t right', 'Standing up for myself', 'Moving somewhere new, alone',
  'Going back to school later in life', 'Ending something that wasn’t working', 'Performing in front of people', 'Telling someone how I really felt', 'Starting my own thing',
  'Asking for help when I needed it', 'Saying no without over-explaining', 'Trying again after failing publicly', 'Telling someone I’m learning something new',
];

export function planStepsFor(goal) {
  const g = goal || 'it';
  return [
    { ai: `You did your first step toward "${g}". What's the next small step from here?`, options: ['Do a slightly bigger version next time', 'Book real time for it', 'Learn one more piece of it', 'Tell someone I actually did it'] },
    { ai: 'Good pick. When will you do it?', options: ['Today', 'Tomorrow', 'This week'] },
    { ai: 'That’s the plan. I’ll check back in after.', options: [] },
  ];
}
