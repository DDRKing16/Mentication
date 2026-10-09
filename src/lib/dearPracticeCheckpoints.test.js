import { describe, it, expect } from 'vitest';
import { confirmPracticeAnswer, answerPair, confirmThreatPracticeAnswer } from '../../design/dear2100/practice-checkpoints';
describe('Dear confirmed answer reveals', () => {
  it('reveals a pair after two confirmed answers, including zero ratings', () => {
    const one = confirmPracticeAnswer([], 'want', 'My direction', 'Write a book');
    expect(answerPair(one)).toEqual([]);
    const two = confirmPracticeAnswer(one, 'rating', 'My rating', 0);
    expect(answerPair(two).map(e => e.detail)).toEqual(['Write a book', '0']);
  });
  it('edits without counting again and removes an explicitly cleared answer', () => {
    const one = confirmPracticeAnswer([], 'want', 'My direction', 'Write a book');
    const edit = confirmPracticeAnswer(one, 'want', 'My direction', 'Write a page');
    expect(edit).toHaveLength(1);
    expect(edit[0].detail).toBe('Write a page');
    expect(confirmPracticeAnswer(edit, 'want', 'My direction', '')).toEqual([]);
  });
  it('keeps a revealed pair while a third answer is confirmed', () => {
    const events = ['a','b','c'].reduce((items,id) => confirmPracticeAnswer(items,id,id,id), []);
    expect(answerPair(events).map(e => e.id)).toEqual(['a','b']);
  });
});

describe('Dear understanding practice', () => {
  it('reveals two substantive answers without calling wrong answers a pass', () => {
    const first = confirmThreatPracticeAnswer([], 0, 0);
    expect(answerPair(first)).toEqual([]);
    const second = confirmThreatPracticeAnswer(first, 1, 1);
    expect(answerPair(second)).toHaveLength(2);
    expect(second.every(event => event.detail.startsWith('A takeaway to revisit.'))).toBe(true);
  });
  it('updates a retry without inflating the number of questions answered', () => {
    let events = [0,1,2,3].reduce((all,index)=>confirmThreatPracticeAnswer(all,index,0), []);
    for (const [index,answer] of [2,0,3,1].entries()) events=confirmThreatPracticeAnswer(events,index,answer);
    expect(events).toHaveLength(4);
    expect(events.every(event=>event.detail.startsWith('Matched the teaching.'))).toBe(true);
    expect(confirmThreatPracticeAnswer(events,0,null)).toBe(events);
  });
});
