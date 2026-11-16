import { describe, expect, it } from "vitest";
import { PROGRAMMES, getProgramme, launchStateFor, programmeProgress } from "./programmes.js";
import { getIntervention } from "./interventions.js";

const calm = getProgramme("calmer-seven");
const start = new Date(2026, 8, 28, 8, 0).toISOString(); // Mon 28 Sep, 8am
const at = (d, h, ...ids) => ({ created_date: new Date(2026, 8, d, h).toISOString(), pathway: ids, completed_pathway: ids });

describe("Programmes", () => {
  it("only uses exercises that exist", () => {
    PROGRAMMES.forEach((p) => p.days.forEach((day) => expect(getIntervention(day.id), `${p.id}:${day.id}`).toBeTruthy()));
  });

  it("starts on day 1, open today", () => {
    const p = programmeProgress(calm, [], start, new Date(2026, 8, 28, 9));
    expect(p.doneCount).toBe(0);
    expect(p.days[0].status).toBe("today");
    expect(p.days[1].status).toBe("later");
  });

  it("ticks off today's day when that exercise is finished", () => {
    const p = programmeProgress(calm, [at(28, 10, "boxV2")], start, new Date(2026, 8, 28, 11));
    expect(p.days[0].status).toBe("done");
    expect(p.days[1].status).toBe("tomorrow");
  });

  it("opens the next day the following calendar day", () => {
    const p = programmeProgress(calm, [at(28, 10, "boxV2")], start, new Date(2026, 8, 29, 7));
    expect(p.days[1].status).toBe("today");
  });

  it("does not let two practices on the same day count as two days", () => {
    const p = programmeProgress(calm, [at(28, 10, "boxV2"), at(28, 12, "grounding54321V2")], start, new Date(2026, 8, 28, 13));
    expect(p.doneCount).toBe(1);
  });

  it("ignores practices from before the programme started", () => {
    const p = programmeProgress(calm, [at(27, 10, "boxV2")], start, new Date(2026, 8, 28, 13));
    expect(p.doneCount).toBe(0);
  });

  it("ignores a different exercise than today's", () => {
    const p = programmeProgress(calm, [at(28, 10, "happyBump")], start, new Date(2026, 8, 28, 13));
    expect(p.doneCount).toBe(0);
  });

  it("finishes after every day is done", () => {
    const sessions = calm.days.map((day, i) => at(28 + i, 10, day.id));
    const p = programmeProgress(calm, sessions, start, new Date(2026, 9, 6, 12));
    expect(p.finished).toBe(true);
    expect(p.doneCount).toBe(7);
  });

  it("opens each exercise the same way the Library does", () => {
    expect(launchStateFor("boxV2")).toMatchObject({ prebuilt: true, pathway: ["boxV2"], directionLabel: "Box Breathing" });
  });
});

describe('programme completion evidence',()=>{
  const now=new Date(2026,8,29,12);
  const modern=(reason,pct=1)=>({...at(28,10,'boxV2'),completed_pathway:[],attempts:[{intervention_id:'boxV2',exit_reason:reason,completed_percentage:pct}]});
  it.each([['skipped',0],['exited',0.3],['switched',0.8]])('does not complete or unlock from a %s attempt', (reason,pct)=>{
    const progress=programmeProgress(calm,[modern(reason,pct)],start,now);
    expect(progress.doneCount).toBe(0);expect(progress.days[0].status).toBe('today');expect(progress.days[1].status).toBe('later');
  });
  it('uses genuine completed attempts, not whether a goal rating was supplied',()=>{
    const record={...modern('completed'),intensity_end:null};
    expect(programmeProgress(calm,[record],start,now).doneCount).toBe(1);
  });
  it('does not use selected-only legacy records as completion evidence',()=>{
    expect(programmeProgress(calm,[{created_date:at(28,10).created_date,pathway:['boxV2']}],start,now).doneCount).toBe(0);
  });
  it('honours explicit legacy completion lists when attempts were not recorded',()=>{
    expect(programmeProgress(calm,[at(28,10,'boxV2')],start,now).doneCount).toBe(1);
    expect(programmeProgress(calm,[{...at(28,10,'boxV2'),completed_pathway:[]}],start,now).doneCount).toBe(0);
  });
  it('does not let stale completion lists override explicit skipped/empty attempts',()=>{
    for(const attempts of [[],modern('skipped',0).attempts])expect(programmeProgress(calm,[{...at(28,10,'boxV2'),attempts}],start,now).doneCount).toBe(0);
  });
  it('credits only the completed practice in a mixed selected pathway',()=>{
    const record={...modern('skipped',0),pathway:['boxV2','grounding54321V2'],completed_pathway:['grounding54321V2'],attempts:[...modern('skipped',0).attempts,{intervention_id:'grounding54321V2',exit_reason:'completed',completed_percentage:1}]};
    expect(programmeProgress(calm,[record],start,now).doneCount).toBe(0);
  });
  it('cannot use one multi-practice session for multiple days',()=>{
    const record=at(28,10,'boxV2','grounding54321V2');
    expect(programmeProgress(calm,[record],start,now).doneCount).toBe(1);
  });
  it('ignores future or invalid dated completions and invalid starts',()=>{
    expect(programmeProgress(calm,[at(30,10,'boxV2'),{...at(28,10,'boxV2'),created_date:'broken'}],start,now).doneCount).toBe(0);
    const progress=programmeProgress(calm,[at(28,10,'boxV2')],'broken',now);
    expect(progress.days.every(day=>day.status==='later')).toBe(true);
  });
});

describe('programme evidence boundaries',()=>{
  it('accepts meaningful partial completed terminals but not zero-progress completions',()=>{
    const programme={days:[{id:'changeScene'}]};
    const record={...at(28,10,'changeScene'),attempts:[{intervention_id:'changeScene',exit_reason:'completed',completed_percentage:1/6}]};
    expect(programmeProgress(programme,[record],start,new Date(2026,8,29)).doneCount).toBe(1);
    record.attempts[0].completed_percentage=0;
    expect(programmeProgress(programme,[record],start,new Date(2026,8,29)).doneCount).toBe(0);
  });
  it('handles malformed attempt entries without inventing completion',()=>{
    for(const attempts of [[null,{},'bad'],null,'bad'])expect(programmeProgress(calm,[{...at(28,10,'boxV2'),attempts}],start,new Date(2026,8,29)).doneCount).toBe(0);
  });
  it('preserves programme completion beyond a latest-200 window',()=>{
    const older=at(28,10,'boxV2');
    const recent=Array.from({length:205},(_,index)=>({...at(29,10,'happyBump'),id:`recent-${index}`}));
    expect(programmeProgress(calm,recent.slice(0,200),start,new Date(2026,8,30)).doneCount).toBe(0);
    const progress=programmeProgress(calm,[...recent,older],start,new Date(2026,8,30));
    expect(progress.doneCount).toBe(1);expect(progress.days[1].status).toBe('today');
  });
});
