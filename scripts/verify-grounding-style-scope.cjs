const {chromium}=require('/opt/codex/cua_node/lib/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const out=process.env.EVIDENCE_DIR||'design/three-passes/acceptance-style';fs.mkdirSync(out,{recursive:true});
let browser;
(async()=>{browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
for(const width of [320,390,1280])for(const reducedMotion of [false,true])for(const id of ['grounding54321V2','boxV2']){
 const context=await browser.newContext({viewport:{width,height:600},reducedMotion:reducedMotion?'reduce':'no-preference'});
 await context.addInitScript(({id,reducedMotion})=>{localStorage.setItem('haven_onboarded','1');localStorage.setItem('haven.a11y.v2',JSON.stringify({reducedMotion}));if(location.pathname==='/reset')history.replaceState({usr:{prebuilt:true,pathway:[id],direction:'calm',audio:'no',reset_phase:'guiding',goal_baseline:{question:'How intense is it right now?',scale:'distress',left:'Calm',right:'Extreme',higherIsBetter:false,direction:'calm',min:0,max:10,value:6,answered:true}},key:'style',idx:0},'',location.href)},{id,reducedMotion});
 const p=await context.newPage();await p.goto(process.env.BASE_URL||'http://localhost:5176/reset');await p.locator(id==='boxV2'?'.box-v2-player':'[data-grounding-player]').waitFor();
 const actual=await p.evaluate(()=>({groundingRoots:document.querySelectorAll('[data-grounding-player="true"]').length,reduced:document.querySelector('[data-grounding-player]')?.getAttribute('data-grounding-reduced'),reducedTargets:document.querySelectorAll('[data-grounding-reduced="true"]').length,falseTargets:document.querySelectorAll('[data-grounding-reduced="false"]').length,overflow:document.documentElement.scrollWidth>innerWidth}));
 assert.equal(actual.groundingRoots,id==='boxV2'?0:1);assert.equal(actual.reducedTargets,id!=='boxV2'&&reducedMotion?1:0);assert.equal(actual.falseTargets,id!=='boxV2'&&!reducedMotion?1:0);assert.equal(actual.overflow,false);
 await p.screenshot({path:`${out}/${id}-${width}-${reducedMotion}.png`,fullPage:true});results.push({id,width,reducedMotion,...actual,passed:true});await context.close();
}await browser.close();fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log('PASS',results.length,'motion / viewport scope combinations');})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1});
