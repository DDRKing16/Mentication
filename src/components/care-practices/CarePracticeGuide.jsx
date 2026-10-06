const GUIDES = {
  selfCompassion: {
    title:'How to try a caring response',
    body:'Keep what is difficult in view. Try words you could offer someone you care about, in a steady or gentle tone. Choose wording you can believe even a little.',
    steps:['Read or say your response slowly.','If the words do not fit, edit them or choose care without the words.','Choose one act of support, rest or repair that is possible now.'],
  },
  unhook: {
    title:'How to notice a thought and return',
    body:'Here you practise recognising the words as a thought, then choosing where your attention goes. The thought can still be here while you take a useful step.',
    steps:['Try “I am noticing the thought…” with the words your mind is using.','Choose one accessible detail in your surroundings and rest attention there for a moment.','When the thought pulls again, notice it and return to your chosen action.'],
  },
  makeRoom: {
    title:'What making room means here',
    body:'You choose how much attention to give a manageable feeling while staying connected to your surroundings. The feeling can remain as it is.',
    steps:['Room only keeps attention with your surroundings.','A little means noticing the feeling lightly with your anchor still available. More lets you try a little more attention, only if workable.','Return to the room whenever you want. You can choose an everyday action with the feeling still here.'],
  },
};
export default function CarePracticeGuide({id}) {
  const guide=GUIDES[id];
  if (!guide) return null;
  return <details className="pf-practice-guide"><summary>What am I practising?</summary><div><h2>{guide.title}</h2><p>{guide.body}</p><ol>{guide.steps.map(step=><li key={step}>{step}</li>)}</ol></div></details>;
}
