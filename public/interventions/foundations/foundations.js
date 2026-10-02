
(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$('#app'), screens=$$('.screen'), back=$('#back'), step=$('#step'), progress=$('#progress'), flowNav=$('#flowNav');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function reveal(element,frames,options){if(!reducedMotion.matches&&element.animate)element.animate(frames,options)}
const order=['intro','scan','snapshot','choices','dose','plan','saved','reviewIntro','review','learned','finish'];
const flowLabels={intro:'Start',scan:'Questions',snapshot:'Foundation',choices:'Pick one',dose:'Make it fit',plan:'Plan',saved:'Saved',reviewIntro:'Review',review:'Reflect',learned:'Learning',finish:'Finish'};
flowNav.innerHTML=order.map(name=>`<button class="flow-stop" type="button" data-screen-target="${name}" data-label="${flowLabels[name]}" aria-label="Go to ${flowLabels[name]} screen"></button>`).join('');
const flowStops=$$('.flow-stop',flowNav);
let audioContext;
function tactileFeedback(weight='soft'){
  const isFoundation=weight==='foundation',isFirm=weight==='firm';
  try{if(navigator.vibrate)navigator.vibrate(isFoundation?[9,14,12]:isFirm?14:8)}catch(e){}
  try{
    audioContext=audioContext||new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();
    const now=audioContext.currentTime, master=audioContext.createGain(), filter=audioContext.createBiquadFilter();
    const duration=isFoundation?.16:.115,peak=isFoundation?.072:isFirm?.085:.055;
    master.gain.setValueAtTime(.0001,now);master.gain.exponentialRampToValueAtTime(peak,now+.006);master.gain.exponentialRampToValueAtTime(.0001,now+duration);
    filter.type='lowpass';filter.frequency.setValueAtTime(isFoundation?660:isFirm?720:610,now);filter.Q.value=isFoundation?1.1:1.4;filter.connect(master);master.connect(audioContext.destination);
    const body=audioContext.createOscillator();body.type='sine';body.frequency.setValueAtTime(isFoundation?188:isFirm?178:205,now);body.frequency.exponentialRampToValueAtTime(isFoundation?86:isFirm?92:116,now+duration-.01);body.connect(filter);body.start(now);body.stop(now+duration);
    const knock=audioContext.createOscillator(), knockGain=audioContext.createGain();knock.type='triangle';knock.frequency.setValueAtTime(isFoundation?390:isFirm?430:510,now);knock.frequency.exponentialRampToValueAtTime(isFoundation?152:190,now+(isFoundation?.065:.045));knockGain.gain.setValueAtTime(isFoundation?.043:.035,now);knockGain.gain.exponentialRampToValueAtTime(.0001,now+(isFoundation?.078:.052));knock.connect(knockGain);knockGain.connect(filter);knock.start(now);knock.stop(now+(isFoundation?.085:.06));
    if(isFoundation){const settle=audioContext.createOscillator(),settleGain=audioContext.createGain();settle.type='sine';settle.frequency.setValueAtTime(132,now+.072);settle.frequency.exponentialRampToValueAtTime(78,now+.145);settleGain.gain.setValueAtTime(.0001,now);settleGain.gain.exponentialRampToValueAtTime(.026,now+.078);settleGain.gain.exponentialRampToValueAtTime(.0001,now+.15);settle.connect(settleGain);settleGain.connect(filter);settle.start(now+.07);settle.stop(now+.155)}
  }catch(e){}
}
document.addEventListener('click',e=>{const button=e.target.closest('button');if(button&&!button.disabled)tactileFeedback(button.classList.contains('block')?'foundation':button.classList.contains('primary')||button.classList.contains('scale-point')?'firm':'soft')},true);
const domains=[
 {id:'sleep',name:'Sleep and rhythm',questions:[['How steady has your sleep routine been?','Sleep and wake timing'],['How rested have you felt after sleeping?','Restfulness and recovery']],logic:['Irregular rhythm','Lower energy','Less emotional bandwidth','Harder follow-through'],why:'Sleep rhythm appears to be placing pressure on energy and follow-through. A small, consistent anchor may improve more than one part of the base.',actions:[['Anchor the morning','Keep wake time within the same 45-minute window.','A reliable morning anchor can steady circadian timing without redesigning the whole night.'],['Find ten minutes of daylight','Get outside within the first hour after waking.','Morning light is a low-friction signal that supports the sleep–wake system.'],['Create a two-step shutdown','Use the same two brief cues before bed.','A consistent sequence can reduce the decision load around winding down.'],['Protect one sleep opportunity','Choose one night and preserve a realistic sleep window.','One protected opportunity is more achievable than demanding immediate perfection.']]},
 {id:'nutrition',name:'Nutrition and hydration',questions:[['How regularly have you been eating?','Regularity and adequacy'],['How steady have food and water kept your energy?','Energy and hydration']],logic:['Basics become irregular','Energy fluctuates','Capacity drops','Other tasks feel harder'],why:'Basic intake appears inconsistent enough to affect energy and coping capacity. The goal is reliability, not restrictive eating rules.',actions:[['Protect one reliable meal','Choose one meal that can happen consistently.','One dependable meal reduces volatility without requiring a complete diet overhaul.'],['Make water visible','Place water where it will be seen during the busiest part of the day.','Changing the environment reduces reliance on remembering.'],['Add one steadying option','Prepare one easy food option for low-capacity moments.','A ready option protects adequacy when effort is limited.'],['Link intake to an existing cue','Pair food or water with something that already happens daily.','An existing cue makes repetition easier than creating a new routine from nothing.']]},
 {id:'movement',name:'Movement',questions:[['How often has movement been part of your day?','Frequency and consistency'],['How easy has movement felt to fit in?','Capacity and practical fit']],logic:['Movement drops','Activation falls','Energy feels flatter','Starting becomes harder'],why:'Movement looks worth strengthening, but only in a form that fits current capacity and preferences.',actions:[['Take a ten-minute outside walk','Walk somewhere nearby with no pace target.','A brief walk combines movement, environmental change and daylight with low burden.'],['Use a five-minute movement break','Move in any comfortable way for five minutes.','A small dose lowers the threshold for action while preserving the mechanism.'],['Attach movement to something enjoyable','Pair movement with music, a podcast or a preferred place.','Enjoyment can improve repeatability without making movement feel like a test.'],['Choose functional movement','Use one ordinary task that gets the body moving.','Functional movement can be more realistic than a separate exercise session.']]},
 {id:'recovery',name:'Recovery and rest',questions:[['How much real downtime have you had?','Space between demands'],['How well have you recovered after demanding days?','Restoration and depletion']],logic:['Demands continue','Recovery narrows','Capacity erodes','Small stressors hit harder'],why:'Recovery appears too limited for the current load. A protected pause may improve capacity without asking for greater productivity.',actions:[['Protect a fifteen-minute landing','Create a short period with no demands after the hardest part of the day.','A defined landing period can interrupt cumulative depletion.'],['Remove one avoidable demand','Delete, defer or simplify one non-essential task.','Recovery sometimes improves more by subtracting than adding.'],['Use a sensory downshift','Choose one low-stimulation activity for ten minutes.','Reducing incoming demand gives the nervous system a clearer recovery signal.'],['Create one no-output pocket','Spend a brief period without producing, fixing or optimising.','Rest becomes restorative when it is not turned into another task.']]},
 {id:'structure',name:'Daily structure',questions:[['How manageable have your days felt?','Friction and predictability'],['How often have you known what to do next?','Direction and organisation']],logic:['Days feel unclear','Decisions multiply','Friction rises','Follow-through falls'],why:'Daily friction appears to be consuming capacity. One visible anchor may make the day easier to enter and navigate.',actions:[['Set one daily anchor','Choose one event that happens at roughly the same time.','A single anchor creates predictability without imposing a rigid schedule.'],['Prepare the first step','Make tomorrow’s first useful action visible tonight.','Reducing morning decisions lowers entry friction.'],['Close one open loop','Finish one task that takes under ten minutes.','Completion reduces background load and restores a sense of traction.'],['Create a three-line day map','Write only the three things that make today workable.','A small map preserves direction without turning the day into a crowded list.']]},
 {id:'activation',name:'Getting into action',questions:[['How easy has it been to get started?','Starting and momentum'],['How often have you done something useful or enjoyable?','Follow-through and reward']],logic:['Starting feels costly','Delay brings relief','Life narrows','Starting feels harder'],why:'Getting started appears to be the clearest bottleneck. The best first move is one that lowers entry cost while still creating meaningful contact with life.',actions:[['Make the entry almost too easy','Shrink one avoided task to its smallest real beginning.','Lowering the entry cost interrupts avoidance without waiting for motivation.'],['Approach for five minutes','Spend five minutes with something that matters, then choose again.','Brief approach creates new evidence without demanding full completion.'],['Restart one enjoyable activity','Return to something previously rewarding for ten minutes.','Pleasure and mastery can rebuild activation from more than one direction.'],['Finish one small loop','Close one useful task that can be completed quickly.','A completed loop reduces background pressure and may improve self-trust.']]},
 {id:'support',name:'Reliable support',questions:[['How supported have you felt?','Emotional and practical support'],['How easy has it been to reach someone when needed?','Availability and reliability']],logic:['Support feels distant','More load is carried alone','Capacity drops','Withdrawal grows'],why:'Reliable support appears thinner than needed. The aim is meaningful fit, not simply more social contact.',actions:[['Make one good contact','Message one person who usually leaves things feeling lighter.','One nourishing interaction may matter more than increasing contact generally.'],['Ask for one specific thing','Tell a trusted person exactly what would help this week.','Specific requests make support easier to give and receive.'],['Schedule one low-pressure connection','Choose a short interaction that does not require performing.','Low-pressure contact can increase connection without adding heavy social demand.'],['Strengthen one reliable link','Create a simple recurring check-in with one trusted person.','Reliability may be more protective than frequency across many relationships.']]},
 {id:'stability',name:'Stability',questions:[['How stable has day-to-day life felt?','Consistency and predictability'],['How well have you limited patterns that throw you off balance?','Habits and environmental strain']],logic:['A pattern disrupts the base','Capacity becomes unpredictable','Other foundations weaken','The cycle repeats'],why:'A recurring destabilising pattern may be undermining several areas at once. The first step should reduce exposure or add one boundary.',actions:[['Name the repeating disruptor','Identify the one pattern that most often knocks the base sideways.','Clear identification prevents effort being scattered across less important targets.'],['Add one protective boundary','Place a small limit around the main destabilising factor.','A practical boundary changes exposure rather than relying only on willpower.'],['Interrupt the usual cue','Change one environmental trigger linked to the pattern.','Cue changes can reduce automatic repetition before effort is required.'],['Prepare a replacement route','Choose what will happen instead when the familiar trigger appears.','A replacement is easier to use than a vague instruction to stop.']]}
];
const labels=['Mostly working against me','Under pressure','Mixed','Mostly supporting me','Strong and steady'];
const scanItems=[
 {id:'overall',domain:'The whole picture',q:'How much have the basics supported you lately?',context:'Sleep · energy · routine · recovery · support'},
 ...domains.flatMap(d=>d.questions.map((q,index)=>({id:d.id+'-'+index,domain:d.name,domainId:d.id,q:q[0],context:q[1]})))
];
let state={q:0,responses:{},answers:{},selected:null,dose:null,review:{},history:[]};
function currentName(){return screens.find(s=>s.classList.contains('active')).dataset.screen}
function updateFlowNav(name){const active=order.indexOf(name);flowStops.forEach((stop,index)=>{stop.classList.toggle('current',index===active);stop.classList.toggle('passed',index<active);if(index===active)stop.setAttribute('aria-current','step');else stop.removeAttribute('aria-current')})}
function show(name,push=true){
 if(!order.includes(name))return;
 if(['dose','plan','saved'].includes(name)&&state.selected===null)name='choices';
 if(['plan','saved'].includes(name)&&!state.dose)name='dose';
 const from=currentName();
 if(name==='scan'&&from!=='scan'){state.q=Math.max(0,Math.min(state.q,scanItems.length-1));renderQuestion()}
 if(priorityExplanation.classList.contains('open'))closePriorityExplanation(false);
 app.classList.toggle('choices-light',name==='choices');
 screens.forEach(s=>{const active=s.dataset.screen===name;s.classList.toggle('active',active);s.inert=!active;s.setAttribute('aria-hidden',String(!active))});
 app.classList.toggle('scan-active',name==='scan');
 if(name==='scan'&&from!=='scan'&&!scanScreen.classList.contains('question-enter'))animateQuestionEntry(false);
 if(push&&from&&from!==name)state.history.push(from);
 back.hidden=name==='intro'||name==='finish';
 const idx=order.indexOf(name),scanProgress=(state.q+1)/scanItems.length;
 step.textContent=name==='scan'?'Quick scan · '+String(state.q+1).padStart(2,'0')+'/'+scanItems.length:flowLabels[name]+' · '+String(idx+1).padStart(2,'0')+'/'+order.length;
 progress.style.width=(name==='scan'?((idx+scanProgress)/(order.length-1))*100:(idx/(order.length-1))*100)+'%';
 updateFlowNav(name);
 if(name==='snapshot')renderSnapshot();if(name==='choices')renderChoices();if(name==='dose')renderDoses();if(name==='plan')renderPlan();if(name==='saved')renderSaved();if(name==='review')renderReview();
 if(name==='intro')scheduleFoundationIdle(1800);else{pauseFoundationIdle();clearFoundationImpact();resetFoundationParallax()}
 const heading=$('h1,h2',$('.screen.active'));if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
 window.scrollTo(0,0);
}
function navigateFlow(target){
 if(target===currentName())return;
 if(target==='scan'){state.q=Math.max(0,Math.min(state.q,scanItems.length-1));renderQuestion()}
 else if(order.indexOf(target)>=order.indexOf('snapshot'))calculateDomainScores();
 show(target);
}
flowStops.forEach(stop=>stop.onclick=()=>navigateFlow(stop.dataset.screenTarget));
back.onclick=()=>{if(currentName()==='scan'&&state.q>0){state.q--;renderQuestion();show('scan',false);return}const prev=state.history.pop();if(prev){if(prev==='scan'){state.q=Math.min(state.q,scanItems.length-1);renderQuestion()}show(prev,false)}};
$$('[data-next]').forEach(b=>b.onclick=()=>b.closest('.screen[data-screen="intro"]')?beginFoundationEntry():show(b.dataset.next));
const foundation=$('#foundation'), foundationZone=$('.foundation-zone'), foundationLabel=$('#foundationLabel'), foundationCaption=$('.foundation-caption'), foundationBlocks=$$('.block'), introContinue=$('.screen[data-screen="intro"] .primary[data-next="scan"]'), foundationIdleAllowed=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let foundationIdleStart=0,foundationIdleEnd=0,foundationCaptionTimer=0,foundationIdleIndex=1,foundationIdleEpoch=0,foundationImpactTimer=0,foundationTransitioning=false,energyTransferTimer=0,orbitPulseTimer=0,parallaxTargetX=0,parallaxTargetY=0,parallaxCurrentX=0,parallaxCurrentY=0,parallaxFrame=0;
function swapFoundationCaption(label,epoch=foundationIdleEpoch){window.clearTimeout(foundationCaptionTimer);foundationCaption.classList.add('idle-caption-swap');foundationCaptionTimer=window.setTimeout(()=>{if(epoch!==foundationIdleEpoch)return;foundationLabel.textContent=label;foundationCaption.classList.remove('idle-caption-swap')},210)}
function pauseFoundationIdle(){foundationIdleEpoch++;window.clearTimeout(foundationIdleStart);window.clearTimeout(foundationIdleEnd);window.clearTimeout(foundationCaptionTimer);const remembered=foundation.querySelector('.idle-memory');foundation.querySelectorAll('.idle-preview').forEach(x=>x.classList.remove('idle-preview'));foundation.classList.remove('idle-playing');foundationCaption.classList.remove('idle-caption-swap');if(remembered){remembered.classList.remove('idle-memory');remembered.classList.add('active')}const selected=foundation.querySelector('.block.active');if(selected){foundationLabel.textContent=selected.dataset.label;setFoundationOrbitFocus(selected,false)}}
function scheduleFoundationIdle(delay=4000){window.clearTimeout(foundationIdleStart);if(!foundationIdleAllowed||document.hidden)return;const epoch=foundationIdleEpoch;foundationIdleStart=window.setTimeout(()=>{if(epoch===foundationIdleEpoch)playFoundationIdle()},delay)}
function playFoundationIdle(){if(currentName()!=='intro'||!$('.screen[data-screen="intro"]').classList.contains('intro-settled')){scheduleFoundationIdle(900);return}pauseFoundationIdle();const epoch=foundationIdleEpoch,selected=foundation.querySelector('.block.active')||foundationBlocks[0];let target=foundationBlocks[foundationIdleIndex%foundationBlocks.length];if(target===selected){foundationIdleIndex=(foundationIdleIndex+1)%foundationBlocks.length;target=foundationBlocks[foundationIdleIndex]}selected.classList.remove('active');selected.classList.add('idle-memory');target.classList.add('idle-preview');foundation.classList.add('idle-playing');setFoundationOrbitFocus(target,false);swapFoundationCaption(target.dataset.label,epoch);foundationIdleEnd=window.setTimeout(()=>{if(epoch!==foundationIdleEpoch)return;target.classList.remove('idle-preview');foundation.classList.remove('idle-playing');selected.classList.remove('idle-memory');selected.classList.add('active');setFoundationOrbitFocus(selected,false);swapFoundationCaption(selected.dataset.label,epoch);foundationIdleIndex=(foundationIdleIndex+1)%foundationBlocks.length;scheduleFoundationIdle(1250)},1900)}
function clearFoundationImpact(){window.clearTimeout(foundationImpactTimer);foundation.classList.remove('impacting');['--impact-rx','--impact-rz','--impact-x','--impact-y','--impact-return-x','--impact-return-y','--impact-rebound-x','--impact-rebound-y'].forEach(p=>foundation.style.removeProperty(p));foundationBlocks.forEach(x=>{x.classList.remove('impact-selected','impact-neighbour');['--neighbour-x','--neighbour-y','--neighbour-return-x','--neighbour-return-y','--neighbour-rebound-x','--neighbour-rebound-y'].forEach(p=>x.style.removeProperty(p))})}
function playFoundationImpact(target){clearFoundationImpact();const width=foundation.offsetWidth,height=foundation.offsetHeight,cx=target.offsetLeft+target.offsetWidth/2,cy=target.offsetTop+target.offsetHeight/2,xNorm=Math.max(-1,Math.min(1,(cx-width/2)/(width/2))),yNorm=Math.max(-1,Math.min(1,(cy-height/2)/(height/2))),impactX=xNorm*5,impactY=yNorm*3.5;foundation.style.setProperty('--impact-rx',(55-yNorm*1.4)+'deg');foundation.style.setProperty('--impact-rz',(-45+xNorm*2.4)+'deg');foundation.style.setProperty('--impact-x',impactX+'px');foundation.style.setProperty('--impact-y',impactY+'px');foundation.style.setProperty('--impact-return-x',impactX*-.28+'px');foundation.style.setProperty('--impact-return-y',impactY*-.28+'px');foundation.style.setProperty('--impact-rebound-x',impactX*.12+'px');foundation.style.setProperty('--impact-rebound-y',impactY*.12+'px');target.classList.add('impact-selected');foundationBlocks.forEach(piece=>{if(piece===target)return;const px=piece.offsetLeft+piece.offsetWidth/2,py=piece.offsetTop+piece.offsetHeight/2,dx=px-cx,dy=py-cy,distance=Math.hypot(dx,dy);if(distance>105)return;const strength=Math.max(.25,1-distance/135),pushX=(dx/(distance||1))*5*strength,pushY=(dy/(distance||1))*5*strength;piece.style.setProperty('--neighbour-x',pushX+'px');piece.style.setProperty('--neighbour-y',pushY+'px');piece.style.setProperty('--neighbour-return-x',pushX*-.38+'px');piece.style.setProperty('--neighbour-return-y',pushY*-.38+'px');piece.style.setProperty('--neighbour-rebound-x',pushX*.14+'px');piece.style.setProperty('--neighbour-rebound-y',pushY*.14+'px');piece.classList.add('impact-neighbour')});void foundation.offsetWidth;foundation.classList.add('impacting');foundationImpactTimer=window.setTimeout(clearFoundationImpact,940)}
function playHomeEnergyTransfer(){if(!foundationIdleAllowed||currentName()!=='intro')return;window.clearTimeout(energyTransferTimer);introScreen.classList.remove('energy-transfer');void introScreen.offsetWidth;introScreen.classList.add('energy-transfer');energyTransferTimer=window.setTimeout(()=>introScreen.classList.remove('energy-transfer'),1850)}
function setFoundationOrbitFocus(target,pulse=true){const index=Math.max(0,foundationBlocks.indexOf(target)),angle=-132+index*45;foundationZone.style.setProperty('--orbit-focus-angle',angle+'deg');if(!pulse||!foundationIdleAllowed)return;window.clearTimeout(orbitPulseTimer);foundationZone.classList.remove('orbit-reacting');void foundationZone.offsetWidth;foundationZone.classList.add('orbit-reacting');orbitPulseTimer=window.setTimeout(()=>foundationZone.classList.remove('orbit-reacting'),920)}
function resetCtaMagnet(){introContinue.style.setProperty('--cta-magnet-x','0px');introContinue.style.setProperty('--cta-magnet-y','0px');introContinue.style.setProperty('--cta-arrow-x','0px')}
function beginFoundationEntry(){if(foundationTransitioning)return;if(!foundationIdleAllowed){show('scan');return}foundationTransitioning=true;resetCtaMagnet();pauseFoundationIdle();clearFoundationImpact();window.clearTimeout(energyTransferTimer);introScreen.classList.remove('energy-transfer');introScreen.classList.add('portal-exit');introContinue.disabled=true;window.setTimeout(()=>{const scanScreen=$('.screen[data-screen="scan"]');scanScreen.classList.add('portal-arrive');show('scan');window.setTimeout(()=>{introScreen.classList.remove('portal-exit');scanScreen.classList.remove('portal-arrive');introContinue.disabled=false;foundationTransitioning=false},860)},760)}
function writeFoundationParallax(x,y){const set=(name,value)=>app.style.setProperty(name,value.toFixed(2)+'px');set('--parallax-zone-x',x*2.2);set('--parallax-zone-y',y*1.7);set('--parallax-foundation-x',x*6.2);set('--parallax-foundation-y',y*4.5);set('--parallax-ring-x',x*-3.6);set('--parallax-ring-y',y*-2.6);set('--parallax-ambient-x',x*10);set('--parallax-ambient-y',y*7);set('--parallax-ambient-reverse-x',x*-7.2);set('--parallax-ambient-reverse-y',y*-5);set('--parallax-grain-x',x*1.8);set('--parallax-grain-y',y*1.4)}
function runFoundationParallax(){parallaxCurrentX+=(parallaxTargetX-parallaxCurrentX)*.105;parallaxCurrentY+=(parallaxTargetY-parallaxCurrentY)*.105;writeFoundationParallax(parallaxCurrentX,parallaxCurrentY);if(Math.abs(parallaxTargetX-parallaxCurrentX)>.002||Math.abs(parallaxTargetY-parallaxCurrentY)>.002)parallaxFrame=requestAnimationFrame(runFoundationParallax);else parallaxFrame=0}
function setFoundationParallax(x,y){if(!foundationIdleAllowed||currentName()!=='intro'||foundationTransitioning)return;parallaxTargetX=Math.max(-1,Math.min(1,x));parallaxTargetY=Math.max(-1,Math.min(1,y));if(!parallaxFrame)parallaxFrame=requestAnimationFrame(runFoundationParallax)}
function resetFoundationParallax(){parallaxTargetX=0;parallaxTargetY=0;if(!parallaxFrame)parallaxFrame=requestAnimationFrame(runFoundationParallax)}
app.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=app.getBoundingClientRect();setFoundationParallax(((e.clientX-r.left)/r.width-.5)*2,((e.clientY-r.top)/r.height-.5)*2)});app.addEventListener('pointerleave',resetFoundationParallax);
if('DeviceOrientationEvent'in window)window.addEventListener('deviceorientation',e=>{if(e.gamma==null||e.beta==null)return;setFoundationParallax(e.gamma/24,(e.beta-42)/32)},{passive:true});
introContinue.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||foundationTransitioning)return;const r=introContinue.getBoundingClientRect(),x=((e.clientX-r.left)/r.width-.5),y=((e.clientY-r.top)/r.height-.5);introContinue.style.setProperty('--cta-magnet-x',(x*5).toFixed(2)+'px');introContinue.style.setProperty('--cta-magnet-y',(y*3).toFixed(2)+'px');introContinue.style.setProperty('--cta-arrow-x',(x*4+2).toFixed(2)+'px')});introContinue.addEventListener('pointerleave',resetCtaMagnet);introContinue.addEventListener('blur',resetCtaMagnet);
foundationBlocks.forEach(b=>b.onclick=()=>{pauseFoundationIdle();foundationBlocks.forEach(x=>x.classList.remove('active'));b.classList.add('active');foundationLabel.textContent=b.dataset.label;setFoundationOrbitFocus(b);playFoundationImpact(b);foundationIdleIndex=(foundationBlocks.indexOf(b)+1)%foundationBlocks.length;scheduleFoundationIdle(6200)});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseFoundationIdle();else if(currentName()==='intro')scheduleFoundationIdle(1800)});
const range=$('#range'), answer=$('#answerText'), qContinue=$('#questionContinue'), dots=$$('.scale-point'), balance=$('#balance'), scanScreen=$('.screen[data-screen="scan"]'), responseScale=$('.screen[data-screen="scan"] .scale');
let questionEntryTimer=0,balanceResponseTimer=0,snapshotBuildTimer=0,pathwayPlayTimer=0,selectedResponse=null;
const domainAngles=[0,-18,24,-30,36,-42,48,-54,60],domainAccents=['#F0B39F','#9FC5EF','#F0B39F','#9FC5EF','#F0B39F','#9FC5EF','#F0B39F','#9FC5EF','#F0B39F'];
const scaleAria=['1, working against me','2, under pressure','3, mixed','4, mostly supporting me','5, strong and steady'];
function questionChapter(item){return item.id==='overall'?0:Math.max(1,domains.findIndex(d=>d.id===item.domainId)+1)}
function animateQuestionEntry(domainChanged=false){window.clearTimeout(questionEntryTimer);scanScreen.classList.remove('question-enter','domain-shift');void scanScreen.offsetWidth;scanScreen.classList.add('question-enter');if(domainChanged)scanScreen.classList.add('domain-shift');questionEntryTimer=window.setTimeout(()=>scanScreen.classList.remove('question-enter','domain-shift'),920)}
function renderQuestion(){
  const item=scanItems[state.q],chapter=questionChapter(item),previousDomain=scanScreen.dataset.domain||'',domainChanged=previousDomain&&previousDomain!==item.domain;
  $('#questionDomain').textContent=item.domain;$('#questionText').textContent=item.q;$('#questionContext').textContent=item.context;
  scanScreen.dataset.domain=item.domain;scanScreen.classList.toggle('long-question',item.q.length>39);scanScreen.classList.toggle('very-long-question',item.q.length>53);
  scanScreen.style.setProperty('--domain-accent',domainAccents[chapter]);scanScreen.style.setProperty('--domain-angle',domainAngles[chapter]+'deg');scanScreen.style.setProperty('--domain-counter-angle',(domainAngles[chapter]*-.35)+'deg');
  selectedResponse=null;range.value=2;qContinue.disabled=true;answer.textContent='Choose a response below';answer.dataset.selected='false';responseScale.style.setProperty('--scale-fill','0%');responseScale.style.setProperty('--response-position','50%');responseScale.querySelector('.scale-dots').classList.remove('is-confirming');
  dots.forEach((x,index)=>{x.disabled=false;x.classList.remove('active','confirming');x.setAttribute('aria-pressed','false');x.setAttribute('aria-label',scaleAria[index])});
  const plinth=balance.querySelector('.plinth'),orb=balance.querySelector('.orb');plinth.style.setProperty('--tilt','-1deg');orb.style.setProperty('--orb-left','45%');balance.classList.remove('settling','responding');scanScreen.classList.remove('response-set','question-enter','domain-shift');
  window.clearTimeout(balanceResponseTimer);animateQuestionEntry(domainChanged);if(Number.isFinite(state.responses[item.id]))updateRange(state.responses[item.id]-1)
}
function updateRange(value){
  const v=value===undefined?+range.value:+value,positions=[10,30,50,70,90],fill=[0,25,50,75,100],tilts=['-6deg','-3deg','-1deg','2deg','5deg'],orbPositions=['18%','31%','45%','59%','72%'],reaction=(v-2)/2;
  range.value=v;answer.textContent=labels[v];answer.dataset.selected='true';dots.forEach((x,i)=>{const selected=i===v;x.classList.toggle('active',selected);x.setAttribute('aria-pressed',String(selected));x.setAttribute('aria-label',scaleAria[i])});responseScale.style.setProperty('--scale-fill',fill[v]+'%');responseScale.style.setProperty('--response-position',positions[v]+'%');
  const plinth=balance.querySelector('.plinth'),orb=balance.querySelector('.orb');plinth.style.setProperty('--tilt',tilts[v]);orb.style.setProperty('--orb-left',orbPositions[v]);balance.style.setProperty('--reaction-angle',(reaction*1.6)+'deg');balance.style.setProperty('--reaction-return-angle',(reaction*-.55)+'deg');balance.style.setProperty('--reaction-rebound-angle',(reaction*.24)+'deg');balance.style.setProperty('--reaction-x',(reaction*3.5)+'px');balance.style.setProperty('--reaction-return-x',(reaction*-.9)+'px');balance.style.setProperty('--orb-kick-x',(reaction*5)+'px');balance.style.setProperty('--orb-return-x',(reaction*-1.5)+'px');balance.style.setProperty('--orb-rebound-x',(reaction*.6)+'px');
  window.clearTimeout(balanceResponseTimer);balance.classList.remove('settling','responding');scanScreen.classList.remove('response-set');void balance.offsetWidth;balance.classList.add('settling','responding');scanScreen.classList.add('response-set');balanceResponseTimer=window.setTimeout(()=>balance.classList.remove('settling','responding'),820);qContinue.disabled=false;
  selectedResponse=v;responseScale.querySelector('.scale-dots').classList.add('is-confirming');dots.forEach((point,index)=>point.classList.toggle('confirming',index===v));dots[v].setAttribute('aria-label',scaleAria[v]+'. Selected. Activate again to continue')
}
range.oninput=()=>updateRange();dots.forEach(point=>point.onclick=()=>{const value=+point.dataset.value;if(selectedResponse===value){advanceQuestion();return}updateRange(value)});
function calculateDomainScores(){domains.forEach(d=>{const values=d.questions.map((_,i)=>state.responses[d.id+'-'+i]).filter(Number.isFinite);state.answers[d.id]=values.length?values.reduce((a,b)=>a+b,0)/values.length:3})}
function advanceQuestion(){if(selectedResponse===null)return;const item=scanItems[state.q];if(!item)return;const value=+range.value+1;if(state.responses[item.id]!==value){state.priority=null;state.selected=null;state.selectionDomain=null;state.dose=null;state.review={}}state.responses[item.id]=value;if(item.id==='overall')state.overall=value;state.q++;if(state.q<scanItems.length){renderQuestion();show('scan',false)}else{calculateDomainScores();show('snapshot')}}
qContinue.onclick=advanceQuestion;
function status(v){return v<2.5?'Under pressure':v<3.5?'Mixed':v<4.5?'Reasonably supported':'Strong and steady'}
function lowDomain(){return domains.reduce((a,d)=>((state.answers[d.id]??3)<(state.answers[a.id]??3)?d:a),domains[0])}
function setPriority(id){
  if(state.priority!==id){state.selected=null;state.selectionDomain=null;state.dose=null;state.review={}}
  state.priority=id;
}
function renderSnapshot(){
  const vals=domains.map(d=>state.answers[d.id]??3),avg=vals.reduce((a,b)=>a+b,0)/vals.length,model=$('#foundationModel'),screen=$('.screen[data-screen="snapshot"]');
  if(!state.priority)setPriority(lowDomain().id);
  model.classList.remove('has-focus');model.style.removeProperty('--focus-colour');
  $('#snapshotTitle').textContent=avg<2.5?'A base under pressure':avg<3.7?'A mixed base':'A well-supported base';
  const left=[0,2,4,6].reduce((n,i)=>n+vals[i],0)/4,right=[1,3,5,7].reduce((n,i)=>n+vals[i],0)/4;
  $('.load-beam',model).style.setProperty('--beam-tilt',Math.max(-2.4,Math.min(2.4,(right-left)*.9))+'deg');
  $('#supportFrame').innerHTML=domains.map((d,i)=>{
    const v=vals[i],low=v<2.5;
    return `<div class="support-piece ${low?'low':v>=4?'supported':''}" data-id="${d.id}" style="--piece-delay:${.58+i*.07}s;--score:${v};--piece-height:${Math.round(30+v*14)}px;--piece-sink:${Math.round((5-v)*5.5)}px;--piece-accent:${low?'#F08A78':'#9FC5EF'}" aria-label="${d.name}: ${status(v)}"></div>`;
  }).join('');
  $('#modelOrbit').innerHTML=domains.map((d,i)=>{
    const v=vals[i],low=v<2.5;
    return `<button class="model-node ${low?'low':''}" type="button" data-id="${d.id}" style="--node-delay:${.82+i*.055}s;--node-color:${low?'#F08A78':'#9FC5EF'}" aria-pressed="false"><b>${d.name}</b><span>${status(v)}</span></button>`;
  }).join('');
  const select=d=>{
    setPriority(d.id);
    const score=state.answers[d.id]??3,low=score<2.5,isMinimum=score===Math.min(...vals),hasTies=vals.filter(v=>v===score).length>1;
    $$('.model-node',model).forEach(node=>{
      const active=node.dataset.id===d.id,other=domains.find(x=>x.id===node.dataset.id),v=state.answers[other.id]??3;
      node.classList.toggle('priority',active);node.setAttribute('aria-pressed',String(active));
      node.setAttribute('aria-label',other.name+': '+status(v)+(active?', selected focus':''));
      $('span',node).textContent=active?(v<3.5?'Start here':'Protect this'):status(v);
    });
    $$('.support-piece',model).forEach(piece=>piece.classList.toggle('priority',piece.dataset.id===d.id));
    const title=score>=3.5?'A strength to protect':isMinimum&&!hasTies?'Your first place to start':'Your chosen focus';
    const copy=score>=3.5?'This is supporting you. A small, repeatable action can help you maintain it.':score>=2.5?'There is room for a little more consistency here. Choose one manageable step.':d.why.split(/(?<=[.!?])\s/)[0];
    $('#modelDetail').innerHTML=`<span class="detail-kicker">${title}</span><strong>${d.name}</strong><span>${copy}</span>`;
    model.classList.toggle('priority-low',low);
    $('#snapshotContinue').disabled=false;
    $('#openPriorityWhy').textContent='Why '+d.name.toLowerCase()+'?';
    renderRationale();
  };
  $$('.model-node',model).forEach(node=>node.onclick=()=>select(domains.find(d=>d.id===node.dataset.id)));
  select(priority());
  window.clearTimeout(snapshotBuildTimer);screen.classList.remove('snapshot-building');
  if(!reducedMotion.matches){void screen.offsetWidth;screen.classList.add('snapshot-building');snapshotBuildTimer=window.setTimeout(()=>screen.classList.remove('snapshot-building'),1900)}
}
function renderRationale(){
  const d=priority(),path=$('#logicPath'),story=$('#pathwayStory'),insight=$('.pathway-insight',story),copy=$('#rationaleCopy'),copyLabel=$('#pathwayInsightLabel'),copyTitle=$('#pathwayInsightTitle'),play=$('#playPathway');$('#priorityName').textContent=d.name;window.clearTimeout(pathwayPlayTimer);
  const supported=(state.answers[d.id]??3)>=3.5,logic=supported?['A steady support','One small action','Notice what helps','Keep what fits']:d.logic;
  $('#priorityExplanationContext').textContent=supported?' is a support worth protecting.':' may be affecting more than one part of the base.';
  const stepCopy=supported?['Your answers suggest this area is supporting you.','A small action can be a way to maintain this support.','After trying it, notice whether it felt useful and manageable.','Repeat what fits your life. Adjust what asks too much.']:logic.map((item,index)=>index===0?`${item} is one possible starting pressure in this pathway.`:index===logic.length-1?d.why:`${logic[index-1]} can contribute to ${item.toLowerCase()}.`);
  path.innerHTML=logic.map((x,i)=>`<button class="path-node${i===0?' active':''}" type="button" data-i="${i}" aria-pressed="${i===0?'true':'false'}"><span class="path-index">0${i+1}</span><span class="path-label">${x}</span></button>`).join('');
  const nodes=$$('.path-node',path),segments=$$('.pathway-segment-current',story),updateInsight=index=>{copyLabel.textContent=`Pathway insight · 0${index+1}/04`;copyTitle.textContent=logic[index];copy.textContent=stepCopy[index];reveal(insight,[{opacity:.76,transform:'translateY(7px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:440,easing:'cubic-bezier(.16,.86,.24,1)'})},activate=(index,syncSegments=true)=>{nodes.forEach((node,i)=>{node.classList.remove('receiving');node.classList.toggle('active',i===index);node.classList.toggle('passed',i<index);node.setAttribute('aria-pressed',String(i===index));if(i===index)node.setAttribute('aria-current','step');else node.removeAttribute('aria-current')});if(syncSegments)segments.forEach((segment,i)=>segment.classList.toggle('lit',i<index));updateInsight(index)};
  const stopPlayback=()=>{window.clearTimeout(pathwayPlayTimer);nodes.forEach(node=>node.classList.remove('receiving'));play.classList.remove('playing');play.disabled=false;play.innerHTML=play.dataset.played?'<span aria-hidden="true">↻</span> Replay pathway':'<span aria-hidden="true">▶</span> Play pathway'};
  nodes.forEach((node,index)=>node.onclick=()=>{stopPlayback();activate(index);tactileFeedback('soft')});
  play.onclick=()=>{window.clearTimeout(pathwayPlayTimer);play.dataset.played='true';play.classList.add('playing');play.disabled=true;play.innerHTML='<span aria-hidden="true">●</span> Playing';activate(0);if(reducedMotion.matches){activate(nodes.length-1);stopPlayback();return}const travelTo=index=>{if(index>=nodes.length){pathwayPlayTimer=window.setTimeout(stopPlayback,620);return}segments[index-1].classList.add('lit');nodes[index].classList.add('receiving');pathwayPlayTimer=window.setTimeout(()=>{nodes[index].classList.remove('receiving');activate(index,false);pathwayPlayTimer=window.setTimeout(()=>travelTo(index+1),480)},720)};pathwayPlayTimer=window.setTimeout(()=>travelTo(1),560)};
  delete play.dataset.played;play.classList.remove('playing');play.disabled=false;play.innerHTML='<span aria-hidden="true">▶</span> Play pathway';activate(0)
}
const priorityExplanation=$('#priorityExplanation');
function closePriorityExplanation(restore=true){
 window.clearTimeout(pathwayPlayTimer);priorityExplanation.classList.remove('open');priorityExplanation.setAttribute('aria-hidden','true');priorityExplanation.inert=true;
 [...priorityExplanation.parentElement.children].filter(e=>e!==priorityExplanation).forEach(e=>e.inert=false);
 $('.topbar').inert=false;flowNav.inert=false;if(restore)$('#openPriorityWhy').focus({preventScroll:true});
}
$('#openPriorityWhy').onclick=()=>{
 renderRationale();priorityExplanation.inert=false;priorityExplanation.classList.add('open');priorityExplanation.setAttribute('aria-hidden','false');
 [...priorityExplanation.parentElement.children].filter(e=>e!==priorityExplanation).forEach(e=>e.inert=true);
 $('.topbar').inert=true;flowNav.inert=true;
 requestAnimationFrame(()=>{if(priorityExplanation.classList.contains('open'))$('#closePriorityWhy').focus({preventScroll:true})});
};
$('#closePriorityWhy').onclick=()=>closePriorityExplanation();
priorityExplanation.addEventListener('transitionend',e=>{
 if(e.target===priorityExplanation&&priorityExplanation.classList.contains('open')&&!priorityExplanation.contains(document.activeElement))$('#closePriorityWhy').focus({preventScroll:true});
});
document.addEventListener('keydown',e=>{
 if(!priorityExplanation.classList.contains('open'))return;
 if(e.key==='Escape'){e.preventDefault();closePriorityExplanation()}
 if(e.key==='Tab'){const buttons=$$('button:not(:disabled)',priorityExplanation),first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}
});
function priority(){return domains.find(d=>d.id===state.priority)||lowDomain()}
const tinyInstructions={
 sleep:['Choose a realistic wake time for tomorrow and set an alarm.','Step outside for two minutes within an hour of waking.','Use two brief wind-down cues tonight, such as dimming lights and closing a screen.','Choose one realistic bedtime for a night this week and protect it.'],
 nutrition:['Choose one easy meal for tomorrow and make sure it is available.','Place a glass or bottle of water where you will see it.','Set aside one easy food option for your next low-energy moment.','Pair a drink of water with one thing you already do each day.'],
 movement:['Walk outside for two minutes, with no pace target.','Move in any comfortable way for one minute.','Move comfortably while listening to one favourite song.','Choose one small everyday task that gets you moving.'],
 recovery:['Take two quiet minutes with no tasks after a demanding part of the day.','Drop, delay or simplify one small non-essential task.','Spend two minutes on something quiet and low in stimulation.','Take two minutes without making, fixing or finishing anything.'],
 structure:['Choose one familiar event to use as tomorrow’s anchor.','Put one item in place tonight to make tomorrow’s first step easier.','Finish one useful task that takes about two minutes.','Write three short lines: the basics that would make tomorrow workable.'],
 activation:['Do only the first physical step of one task you have been putting off.','Spend two minutes on something that matters, then decide whether to stop.','Try two minutes of an activity you used to enjoy.','Complete one small useful task, such as putting one item away.'],
 support:['Send one short message to someone who usually leaves you feeling lighter.','Ask a trusted person for one small, specific thing that would help.','Invite someone you trust to a brief, low-pressure catch-up.','Ask one trusted person whether a simple weekly check-in would suit you both.'],
 stability:['Write one sentence naming the pattern that most often throws your day off.','Choose one small limit around a pattern that unsettles your day.','Move or change one cue that tends to set the pattern in motion.','Write: When this cue appears, I will try this small alternative.']
};
function renderChoices(){
 const d=priority(),wrap=$('#actionChoices');
 if(state.selectionDomain!==d.id){state.selectionDomain=d.id;state.selected=null;state.dose=null;state.review={}}
 $('#choiceDomain').textContent=d.name.toLowerCase()+'.';$('#choiceSheetDomain').textContent=d.name;
 wrap.innerHTML=d.actions.map((a,i)=>`<button class="minimal-choice" type="button" data-i="${i}" aria-pressed="false"><span class="choice-number">0${i+1}</span><span class="choice-copy"><b>${a[0]}</b><small>${a[1]}</small></span><span class="choice-check" aria-hidden="true">✓</span></button>`).join('');
 const update=()=>{
   $$('.minimal-choice',wrap).forEach(btn=>{const selected=+btn.dataset.i===state.selected;btn.classList.toggle('selected',selected);btn.setAttribute('aria-pressed',String(selected))});
   wrap.classList.toggle('has-selection',state.selected!==null);$('#choiceContinue').disabled=state.selected===null;
 };
 $$('.minimal-choice',wrap).forEach(btn=>btn.onclick=()=>{const index=+btn.dataset.i;if(state.selected!==index){state.dose=null;state.review={}}state.selected=index;update()});update();
}
$('#choiceContinue').onclick=()=>{if(state.selected!==null)show('dose')};
function chosen(){return priority().actions[state.selected??0]}
function doseOptions(){
 const d=priority(),a=chosen();
 return [{id:'tiny',name:'Tiny version',copy:tinyInstructions[d.id][state.selected??0]},
 {id:'regular',name:'Regular version',copy:a[1]},
 {id:'repeat',name:'Repeat version',copy:a[1]+' Try this twice this week.'}];
}
function actionTitle(){
 const title=chosen()[0];
 if(state.dose?.id!=='tiny')return title;
 const titles={sleep:{1:'Find a moment of daylight'},movement:{0:'Take a short outside walk',1:'Use a short movement break'},recovery:{0:'Protect a brief landing'},activation:{1:'Approach for two minutes'}};
 return titles[priority().id]?.[state.selected]||title;
}
function renderDoses(){
 const doses=doseOptions(),wrap=$('#doseList'),path=$('#dosePath'),preview=$('#dosePreview'),positions=[{progress:0,x:0,y:0},{progress:53,x:120,y:-59},{progress:100,x:265,y:-154}];
 wrap.innerHTML=doses.map((x,i)=>`<button class="dose" type="button" data-i="${i}" aria-pressed="false"><b>${x.name}</b><span>${['Start small','As described','Twice this week'][i]}</span></button>`).join('');
 const update=(animate=false)=>{
   const index=doses.findIndex(x=>x.id===state.dose?.id),choice=doses[index],position=positions[Math.max(0,index)];
   if(choice)state.dose={...choice};
   $('#doseActionTitle').textContent=actionTitle();
   $$('.dose',wrap).forEach((btn,i)=>{btn.classList.toggle('selected',i===index);btn.setAttribute('aria-pressed',String(i===index))});
   path.classList.toggle('has-selection',index!==-1);path.style.setProperty('--dose-progress',position.progress);
   path.style.setProperty('--dose-x',position.x+'px');path.style.setProperty('--dose-y',position.y+'px');
   preview.innerHTML=choice?`<span>Your version</span><strong>${choice.name}</strong><p>${choice.copy}</p>`:'<span>Make it doable</span><strong>Small is a good start.</strong><p>Choose the version that fits your energy this week.</p>';
   $('#doseContinue').disabled=index===-1;
   if(animate)reveal(preview,[{opacity:.7,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:320,easing:'ease-out'});
 };
 $$('.dose',wrap).forEach(btn=>btn.onclick=()=>{const next=doses[+btn.dataset.i];if(state.dose?.id!==next.id)state.review={};state.dose=next;update(true)});update();
}
$('#doseContinue').onclick=()=>{if(state.dose)show('plan')};
function renderPlan(){
 const d=priority(),a=chosen(),card=$('#weeklyPlanCard'),toggle=$('#planWhyToggle');
 $('#planDomain').textContent=d.name;$('#planTitle').textContent=actionTitle();$('#planInstruction').textContent=state.dose?.copy||a[1];
 $('#planDose').textContent=state.dose?.name||'Regular version';$('#planWhy').textContent=a[2];
 $('#planWhyDisclosure').hidden=true;toggle.setAttribute('aria-expanded','false');toggle.querySelector('span').textContent='＋';
 reveal(card,[{opacity:.55,transform:'translateY(12px) scale(.98)'},{opacity:1,transform:'none'}],{duration:500,easing:'cubic-bezier(.16,.86,.24,1)'});
}
$('#planWhyToggle').onclick=()=>{
 const disclosure=$('#planWhyDisclosure'),toggle=$('#planWhyToggle'),expanded=toggle.getAttribute('aria-expanded')==='true';
 disclosure.hidden=expanded;toggle.setAttribute('aria-expanded',String(!expanded));toggle.querySelector('span').textContent=expanded?'＋':'−';
 if(!expanded)reveal(disclosure,[{opacity:0,transform:'translateY(-5px)'},{opacity:1,transform:'none'}],{duration:250,easing:'ease-out'});
};
$('#changePlan').onclick=()=>show('choices');
const planStorageKey='mentication.foundations.weekly-plan.v1';
let savedPlan=null;
let planSaveFailed=false;
function readSavedPlan(){
 try{
   const p=JSON.parse(localStorage.getItem(planStorageKey)),d=domains.find(d=>d.id===p?.domain);
   if(p?.version===1&&d&&Number.isInteger(p.action)&&d.actions[p.action]&&['tiny','regular','repeat'].includes(p.size))return p;
 }catch(e){}
 return null;
}
function refreshSavedPlan(){savedPlan=readSavedPlan();$('#resumePlan').hidden=!savedPlan}
function renderSaved(){
 refreshSavedPlan();
 const stored=savedPlan?.domain===priority().id&&savedPlan?.action===state.selected&&savedPlan?.size===state.dose?.id;
 $('#savedTitle').textContent=stored?'Plan saved.':'Plan ready.';
 $('#savedStatus').textContent=stored?'On this device':'For this visit';
 $('#savedCopy').textContent=stored?'Your one small action is saved on this device. Come back after trying it to notice what helped.':planSaveFailed?'Your plan is ready for this visit. This browser could not save it for next time.':'This version is not saved yet. View your plan and save it when it feels right.';
}
$('#savePlan').onclick=()=>{
 const plan={version:1,domain:priority().id,action:state.selected,size:state.dose?.id||'regular',savedAt:new Date().toISOString()};
 let stored=false;
 try{localStorage.setItem(planStorageKey,JSON.stringify(plan));stored=true}catch(e){}
 planSaveFailed=!stored;
 refreshSavedPlan();show('saved');
};
$('#viewSavedPlan').onclick=()=>show('plan');
$('#resumePlan').onclick=()=>{
 refreshSavedPlan();if(!savedPlan)return;
 if(priority().id!==savedPlan.domain||state.selected!==savedPlan.action||state.dose?.id!==savedPlan.size)state.review={};
 setPriority(savedPlan.domain);state.selectionDomain=savedPlan.domain;state.selected=savedPlan.action;
 state.dose=doseOptions().find(d=>d.id===savedPlan.size);show('plan');
};
const reviewLabels={
 tried:['Not yet','A little','Partly','Mostly','As planned'],
 effort:['Too much','Difficult','Manageable','Comfortable','Easy to repeat'],
 help:['Not helpful','A little','Somewhat','Helpful','Very helpful']
};
function renderReview(){
 $$('.review-scale').forEach(w=>{
   const key=w.dataset.review;
   w.innerHTML=reviewLabels[key].map((label,i)=>`<button type="button" data-n="${i+1}" aria-label="${i+1}: ${label}" aria-pressed="${state.review[key]===i+1}" class="${state.review[key]===i+1?'selected':''}">${i+1}</button>`).join('');
   $$('button',w).forEach(b=>b.onclick=()=>{state.review[key]=+b.dataset.n;if(key==='tried'&&state.review.tried===1){delete state.review.effort;delete state.review.help}renderReview();$(`button[data-n="${b.dataset.n}"]`,w).focus({preventScroll:true})});
 });
 const notYet=state.review.tried===1;
 $$('[data-review-followup]').forEach(e=>e.hidden=notYet);$('#reviewNotYet').hidden=!notYet;
 $('#reviewContinue').disabled=!(notYet||(state.review.tried&&state.review.effort&&state.review.help));
}
$('#reviewContinue').onclick=()=>{
 const r=state.review;if($('#reviewContinue').disabled)return;
 if(r.tried<=2){$('#learnedTitle').textContent='Make the first step easier.';$('#learnedCopy').textContent='If the action did not happen, start smaller or place it beside something you already do. This is information, not failure.'}
 else if(r.help<=2){$('#learnedTitle').textContent='A different route may fit better.';$('#learnedCopy').textContent='You gave it a try. If it did not feel useful, choose another small action that fits you better.'}
 else if(r.effort<=2){$('#learnedTitle').textContent='Keep what helped. Make it smaller.';$('#learnedCopy').textContent='Something felt useful, but it asked too much of you. Try the tiny version next.'}
 else{$('#learnedTitle').textContent='Keep the small thing that worked.';$('#learnedCopy').textContent='This felt useful and manageable. Give it another week before adding anything else.'}
 show('learned');
};
$('#restart').onclick=()=>{state={q:0,responses:{},answers:{},selected:null,dose:null,review:{},history:[]};renderReview();renderQuestion();refreshSavedPlan();show('intro',false)};
renderReview();refreshSavedPlan();
const introScreen=$('.screen[data-screen="intro"]');
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)introScreen.classList.add('intro-settled');
else window.setTimeout(()=>{introScreen.classList.add('intro-settled');if(currentName()==='intro'){playHomeEnergyTransfer();scheduleFoundationIdle(2600)}},2700);
setFoundationOrbitFocus(foundationBlocks[0],false);
renderQuestion();
show('intro',false);
})();
