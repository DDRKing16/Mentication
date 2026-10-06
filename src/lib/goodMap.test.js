import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../../public/good-map/model.js', import.meta.url), 'utf8'), context);
const M = context.GoodMapModel;
describe('Good Map explicit measurements and local persistence', () => {
  it('never invents ratings, including zero and skipped answers', () => {
    for (const x of [undefined, null, '7', NaN, -1, 11, 1.5]) expect(M.rating(x)).toBe(null);
    expect(M.rating(0)).toBe(0);
    expect(M.rating(10)).toBe(10);
  });
  it('uses the identical question, scale, anchors and direction for paired ratings', () => {
    const r = M.outcome({
      id: 'a',
      key: 'move',
      label: 'moving my body',
      before: 4,
      after: 6,
      did: 'yes'
    });
    expect(r.assessment).toEqual(M.question('moving my body'));
    expect(r.baseline).toBe(4);
    expect(r.endpoint).toBe(6);
    expect(r.requireGoalReassessment).toBe(true);
    expect(r.helpfulness).toBe(null);
  });
  it('separates helpfulness and leaves skipped follow-up null', () => {
    const r = M.outcome({
      id: 'a',
      label: 'rest',
      before: 6,
      after: null,
      did: 'no',
      helpfulness: 'same'
    });
    expect(r.endpoint).toBe(null);
    expect(r.helpfulness).toBe('same');
  });
  it('records a completed attempt only once under duplicate submission', () => {
    const r = M.outcome({
      id: 'a',
      label: 'rest',
      before: 6,
      after: 6,
      did: 'yes'
    });
    expect(M.appendOnce(M.appendOnce([], r), r)).toHaveLength(1);
  });
  it('compares only explicit saved ratings and includes missing values', () => {
    expect(M.comparison({
      a: 0,
      b: 7
    }, {
      a: 3,
      c: 5
    })).toEqual([{
      key: 'a',
      before: 0,
      after: 3,
      delta: 3
    }, {
      key: 'b',
      before: 7,
      after: null,
      delta: null
    }, {
      key: 'c',
      before: null,
      after: 5,
      delta: null
    }]);
  });
  it('surfaces denied and silently failed saves', () => {
    expect(() => M.write({
      setItem() {
        throw Error('QuotaExceededError');
      }
    }, 'key', {})).toThrow();
    expect(() => M.write({
      setItem() {},
      getItem() {
        return null;
      }
    }, 'key', {})).toThrow();
    let data;
    expect(M.write({
      setItem(k, v) {
        data = v;
      },
      getItem() {
        return data;
      }
    }, 'key', {
      answer: 0
    })).toBe(true);
  });
  it('calendar round-trips an absolute time and contains no personal notes', () => {
    const at = '2027-04-04T01:30:00.000Z';
    const text = M.calendar({
      at,
      id: 'test',
      now: new Date('2027-01-01')
    });
    expect(text).toContain('DTSTART:20270404T013000Z\r\n');
    expect(text).toContain('DTEND:20270404T014000Z\r\n');
    expect(text).toContain('BEGIN:VALARM');
    expect(text).toContain('SUMMARY:Your small step');
    expect(text).not.toContain('satisfaction');
    expect(text.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
  it('rejects past, invalid dates and nonexistent local dates', () => {
    expect(() => M.calendar({
      at: 'bad',
      id: 'x'
    })).toThrow();
    expect(() => M.calendar({
      at: '2000-01-01',
      id: 'x'
    })).toThrow();
    expect(() => M.scheduled('2027-02-30', '18:00')).toThrow();
    expect(() => M.scheduled('2027-02-20', '25:00')).toThrow();
  });
  it('keeps a selected local date fixed and validates midnight', () => {
    const d = M.scheduled('2027-10-05', '00:00');
    expect(M.localDate(d)).toBe('2027-10-05');
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});
describe('Good Map time zones', () => {
  it('rejects skipped and repeated DST local times and exports stable UTC across zones', () => {
    const source = readFileSync(new URL('../../public/good-map/model.js', import.meta.url), 'utf8');
    for (const [zone, date, time, expected] of [['Australia/Melbourne', '2027-04-04', '09:30', '2027-04-03T23:30:00.000Z'], ['America/New_York', '2027-04-04', '09:30', '2027-04-04T13:30:00.000Z'], ['Etc/UTC', '2027-04-04', '09:30', '2027-04-04T09:30:00.000Z']]) {
      const result = execFileSync(process.execPath, ['-e', source + `;process.stdout.write(GoodMapModel.scheduled('${date}','${time}').toISOString());`], {
        env: {
          ...process.env,
          TZ: zone
        },
        encoding: 'utf8'
      });
      expect(result).toBe(expected);
    }
    for (const [date, time] of [['2027-10-03', '02:30'], ['2027-04-04', '02:30']]) {
      const result = execFileSync(process.execPath, ['-e', source + `;try{GoodMapModel.scheduled('${date}','${time}');process.stdout.write('accepted')}catch{process.stdout.write('rejected')}`], {
        env: {
          ...process.env,
          TZ: 'Australia/Melbourne'
        },
        encoding: 'utf8'
      });
      expect(result).toBe('rejected');
    }
  });
});
