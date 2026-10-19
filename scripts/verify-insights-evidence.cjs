// Synthetic history fixtures; these are presentation checks, not runtime completion claims.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.EVIDENCE_DIR||'docs/handoffs/completion-audit/review-insights';
const base=process.env.BASE_URL||'http://localhost:5181';fs.mkdirSync(out,{recursive:true});
const row=(id,start,end,hour=8)=>({direction:'calm',intensity_start:start,intensity_end:end,pathway:[id],completed_pathway:[id],context_snapshot:{location:'home'},hour});
const cases=[
 {name:'missing',rows:[row('boxV2',8,null),row('boxV2',8,null)],positive:false},
 {name:'unchanged',rows:[row('boxV2',0,0),row('boxV2',0,0),row('boxV2',0,0)],positive:false,headline:'Your before-and-after ratings were unchanged on average this month.'},
 {name:'worse',rows:[row('boxV2',0,1),row('boxV2',0,1),row('happyBump',0,3,20),row('happyBump',0,3,20)],positive:false,headline:"On average, that's how much worse you rated yourself after a practice this month."},
 {name:'skipped-unrated',rows:[{...row('happyBump',null,null),completed_pathway:[],attempts:[{intervention_id:'happyBump',exit_reason:'skipped',completed_percentage:0,response:'not_answered'}]}],positive:false},
 {name:'mixed',rows:[row('boxV2',8,4),row('boxV2',4,6),row('boxV2',8,null),row('happyBump',0,5),row('happyBump',0,5),row('grounding54321V2',0,0)],positive:true}
];
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--mute-audio']}),results=[];
try{for(const width of [320,390])for(const scenario of cases){const context=await browser.newContext({viewport:{width,height:width===320?568:844},reducedMotion:'reduce'});
await context.addInitScript(rows=>{if(window!==window.top)return;localStorage.setItem('haven_onboarded','1');localStorage.setItem('mentation.sessions.v1',JSON.stringify(rows.map((r,index)=>{const date=new Date();date.setDate(date.getDate()-index);date.setHours(r.hour,0,0,0);return {...r,id:`synthetic-review-${index}`,created_date:date.toISOString()};})));},scenario.rows);
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/insights');await page.getByRole('heading',{name:"What's helping you",exact:true}).waitFor();
assert.equal(await page.getByRole('heading',{name:'What helps you most',exact:true}).count(),scenario.positive?1:0);
assert.equal(await page.getByRole('heading',{name:'Practices with better ratings',exact:true}).count(),scenario.positive?1:0);
assert.equal(await page.getByText(/Rated fit|seem to help you most/).count(),0);
if(scenario.headline)await page.getByText(scenario.headline,{exact:true}).waitFor();
if(scenario.positive){const section=page.getByRole('heading',{name:'What helps you most',exact:true}).locator('..').locator('..');assert.equal(await section.getByText('Box Breathing',{exact:true}).count(),1);assert.equal(await section.getByText('The Happy Bump',{exact:true}).count(),0);await page.getByText('3 times · on average 1 point better across 2 rated practices',{exact:true}).waitFor();}
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);await page.screenshot({path:`${out}/${scenario.name}-${width}.png`,fullPage:true});results.push({scenario:scenario.name,width,passed:true});await context.close();}
}finally{await browser.close();fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));}})().catch(e=>{console.error(e);process.exitCode=1});
