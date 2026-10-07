
(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const app=$('#app'), screens=$$('.screen'), back=$('#back'), step=$('#step'), progress=$('#progress'), flowNav=$('#flowNav');
const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion={matches:motionQuery.matches};
let sharedPreferences={},localSound=true;
try{sharedPreferences=JSON.parse(localStorage.getItem('haven.a11y.v2')||'{}')||{};localSound=localStorage.getItem('mentication.foundations.sound.v1')!=='off'}catch(e){}
reducedMotion.matches=typeof sharedPreferences.reducedMotion==='boolean'?sharedPreferences.reducedMotion:motionQuery.matches;
function reveal(element,frames,options){if(!reducedMotion.matches&&element.animate)element.animate(frames,options)}
const order=['intro','scan','snapshot','choices','dose','plan','cue','time','saved','review','review-effort','review-help','learned','finish'];
const flowLabels={intro:'Foundations',scan:'Check-in',snapshot:'Your picture',choices:'Choose an action',dose:'Choose a size',plan:'Your plan',cue:'Optional cue',time:'Optional time', 'review-effort':'Review · manageable', 'review-help':'Review · helpful',saved:'Plan saved',review:'Review',learned:'Next choice',finish:'For now'};
const stageLabels={scan:'Check-in',snapshot:'Picture',plan:'Plan',review:'Review'};
flowNav.innerHTML=Object.entries(stageLabels).map(([name,label])=>`<button class="flow-stop" type="button" data-screen-target="${name}"><span aria-hidden="true" class="stage-dot"></span>${label}<span class="stage-state"></span></button>`).join('');
const flowStops=$$('.flow-stop',flowNav);
let audioContext;
function tactileFeedback(weight='soft'){
  const isFoundation=weight==='foundation',isFirm=weight==='firm';
  try{if(!reducedMotion.matches&&navigator.vibrate)navigator.vibrate(isFoundation?[9,14,12]:isFirm?14:8)}catch(e){}
  if(!localSound||sharedPreferences.ambientSoundscape===false)return;
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
document.addEventListener('click',e=>{const button=e.target.closest('button');if(button&&!button.disabled&&button.id!=='soundToggle')tactileFeedback(button.classList.contains('block')?'foundation':button.classList.contains('primary')||button.classList.contains('scale-point')?'firm':'soft')},true);
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
function freshState(){return {q:0,responses:{},answers:{},priority:null,selected:null,dose:null,pendingResponse:null,cue:'',time:'',review:{},reviewId:'',planId:'',planRevision:0,history:[]}}
let state=freshState(),ready=false,savedPlan=null,draftSaveFailed=false,planReadError=null;
let deviceStorage;
try{deviceStorage=window.localStorage}catch(e){deviceStorage={getItem(){throw new Error('Storage unavailable')}}}
const store=globalThis.FoundationsStorage.create(deviceStorage,domains,scanItems);
function answeredCount(){return scanItems.filter(item=>Number.isInteger(state.responses[item.id])&&state.responses[item.id]>=1&&state.responses[item.id]<=5).length}
function persistDraft(){
 if(!ready)return;
 draftSaveFailed=!store.writeDraft({version:2,screen:currentName(),state,checkpointId,checkpointRevised});
 $('#draftStatus').textContent=draftSaveFailed?'Changes are for this visit only. Device saving is unavailable.':'Draft saved on this device.';
}
function canEnter(name){
 if(name==='snapshot')return answeredCount()>0;
 if(name==='choices')return !!state.priority;
 if(name==='dose')return state.selected!==null&&!!state.priority;
 if(['plan','cue','time'].includes(name))return canEnter('dose')&&!!state.dose;
 if(name==='saved')return samePlan(savedPlan);
 if(name==='review'||name==='finish')return !!savedPlan;
 if(name==='review-effort')return !!savedPlan&&state.review.tried>1;
 if(name==='review-help')return !!savedPlan&&state.review.tried>1&&!!state.review.effort;
 if(name==='learned')return !!savedPlan&&state.planId===savedPlan.id&&state.planRevision===savedPlan.revision&&store.completeReview(state.review);
 return name==='intro'||name==='scan';
}
function safeScreen(name){
 const fallback={snapshot:'scan',choices:'snapshot',dose:'choices',plan:'dose',saved:'plan',review:'plan',cue:'plan',time:'cue','review-effort':'review','review-help':'review-effort',learned:'review',finish:'plan'};
 for(let i=0;i<order.length&&!canEnter(name);i++)name=fallback[name]||'intro';
 return name;
}
let checkpointId=null,checkpointRevised=false;
const checkpoint=$('#scanCheckpoint');
$('#checkpointPieces').innerHTML=scanItems.map(()=>'<i class="checkpoint-piece"></i>').join('');
function renderCheckpoint(celebrate=false){
 const reflection=globalThis.FoundationsCheckpoints.describe({items:scanItems,responses:state.responses,lastId:checkpointId,revised:checkpointRevised});
 $('#checkpointTitle').textContent=reflection.title;
 $('#checkpointCount').textContent=reflection.count+' of '+reflection.total+' answers';
 $('#checkpointCopy').textContent=reflection.copy;
 $('#checkpointNext').textContent=reflection.next;
 $$('.checkpoint-piece',checkpoint).forEach((piece,index)=>{piece.classList.toggle('lit',reflection.answered[index]);piece.classList.toggle('latest',index===reflection.current)});
 checkpoint.classList.remove('checkpoint-earned');
 if(celebrate&&!reducedMotion.matches){void checkpoint.offsetWidth;checkpoint.classList.add('checkpoint-earned')}
}
function currentName(){return screens.find(s=>s.classList.contains('active')).dataset.screen}
const embeddedHistory=window.parent!==window;
let historyBridgeStarted=false,hostHistoryDepth=0;
function rememberScreen(push=false){
 const screen={name:currentName(),q:Math.max(0,Math.min(scanItems.length-1,state.q))};
 if(embeddedHistory){if(push)hostHistoryDepth++;window.parent.postMessage({type:'mentication:screen',journeyId:'foundations',mode:historyBridgeStarted?(push?'push':'replace'):'init',screen:{id:screen.name,cursors:{q:screen.q}}},window.location.origin);historyBridgeStarted=true;return}
 const data={...window.history.state,foundations:screen};if(push)window.history.pushState(data,'');else window.history.replaceState(data,'');
}

function updateFlowNav(name){
 const stage=['choices','dose','plan','cue','time','saved','finish'].includes(name)?'plan':['learned','review-effort','review-help'].includes(name)?'review':name;
 const completed={scan:answeredCount()===scanItems.length,snapshot:!!state.priority,plan:samePlan(savedPlan),review:!!savedPlan?.reviews.some(review=>review.plan.domain===savedPlan.domain&&review.plan.action===savedPlan.action&&review.plan.size===savedPlan.size&&review.plan.cue===savedPlan.cue&&review.plan.time===savedPlan.time)};
 flowStops.forEach(stop=>{const target=stop.dataset.screenTarget;stop.disabled=!canEnter(target);stop.classList.toggle('current',target===stage);stop.classList.toggle('passed',completed[target]);$('.stage-state',stop).textContent=completed[target]?' ✓':'';stop.setAttribute('aria-label',stageLabels[target]+(completed[target]?', completed':'')+(stop.disabled?', not available yet':''));if(target===stage)stop.setAttribute('aria-current','step');else stop.removeAttribute('aria-current')});
}
function show(name,push=true){
 if(!order.includes(name))return;
 name=safeScreen(name);
 const from=currentName();
 if(name==='scan'&&from!=='scan'){state.q=Math.max(0,Math.min(state.q,scanItems.length-1));renderQuestion()}
 if(priorityExplanation.classList.contains('open'))closePriorityExplanation(false);
 app.classList.toggle('choices-light',name==='choices');
 screens.forEach(s=>{const active=s.dataset.screen===name;s.classList.toggle('active',active);s.inert=!active;s.setAttribute('aria-hidden',String(!active))});
 app.classList.toggle('scan-active',name==='scan');
 if(name==='scan'&&from!=='scan'&&!scanScreen.classList.contains('question-enter'))animateQuestionEntry(false);
 if(push&&from&&from!==name){state.history.push(from);rememberScreen(true)}else rememberScreen();
 back.hidden=name==='intro';
 step.textContent=name==='scan'?`Question ${state.q+1} of ${scanItems.length}`:flowLabels[name];
 progress.style.width=answeredCount()/scanItems.length*100+'%';
 progress.parentElement.setAttribute('aria-valuenow',String(answeredCount()));$('#progressLabel').textContent=`Check-in: ${answeredCount()} of ${scanItems.length} answers confirmed`;
 progress.parentElement.setAttribute('aria-valuetext',`${answeredCount()} of ${scanItems.length} answers confirmed. This tracks the check-in, not wellbeing.`);
 if(name==='snapshot')renderSnapshot();if(name==='choices')renderChoices();if(name==='dose')renderDoses();if(['plan','cue','time'].includes(name))renderPlan();if(name==='saved')renderSaved();if(['review','review-effort','review-help'].includes(name))renderReview();if(name==='learned')renderLearning();
 updateFlowNav(name);
 if(name==='intro')scheduleFoundationIdle(1800);else{pauseFoundationIdle();clearFoundationImpact();resetFoundationParallax()}
 const active=$('.screen.active');active.scrollTop=0;
 const heading=$('h1,h2',active);if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
 window.scrollTo(0,0);persistDraft();
}
function navigateFlow(target){if(target===currentName())return;if(target==='review'){openReview();return}if(target==='scan')state.q=Math.max(0,Math.min(state.q,scanItems.length-1));calculateDomainScores();show(target)}
flowStops.forEach(stop=>stop.onclick=()=>navigateFlow(stop.dataset.screenTarget));
back.onclick=()=>{if(embeddedHistory&&hostHistoryDepth>0){window.parent.postMessage({type:'mentication:screen-back',journeyId:'foundations'},window.location.origin);return}if(currentName()==='scan'&&state.q>0){state.q--;state.pendingResponse=null;renderQuestion();show('scan',false);return}const prev=state.history.pop()||'intro';show(prev,false)};
$$('[data-next]').forEach(b=>b.onclick=()=>{if(b.dataset.next==='review'){openReview();return}if(b.closest('.screen[data-screen="intro"]'))beginFoundationEntry();else show(b.dataset.next)});
function exitFoundations(){persistDraft();if(window.parent!==window)window.parent.postMessage({type:'foundations:exit'},window.location.origin);else window.location.assign('/restructure')}
$('#exit').onclick=exitFoundations;$('#finishExit').onclick=exitFoundations;
const foundation=$('#foundation'), foundationZone=$('.foundation-zone'), foundationLabel=$('#foundationLabel'), foundationCaption=$('.foundation-caption'), foundationBlocks=$$('.block'), introContinue=$('.screen[data-screen="intro"] .primary[data-next="scan"]');
let foundationIdleAllowed=!reducedMotion.matches;
let foundationIdleStart=0,foundationIdleEnd=0,foundationCaptionTimer=0,foundationIdleIndex=1,foundationIdleEpoch=0,foundationImpactTimer=0,foundationTransitioning=false,energyTransferTimer=0,orbitPulseTimer=0,parallaxTargetX=0,parallaxTargetY=0,parallaxCurrentX=0,parallaxCurrentY=0,parallaxFrame=0;
function swapFoundationCaption(label,epoch=foundationIdleEpoch){window.clearTimeout(foundationCaptionTimer);foundationCaption.classList.add('idle-caption-swap');foundationCaptionTimer=window.setTimeout(()=>{if(epoch!==foundationIdleEpoch)return;foundationLabel.textContent=label;foundationCaption.classList.remove('idle-caption-swap')},210)}
function pauseFoundationIdle(){foundationIdleEpoch++;window.clearTimeout(foundationIdleStart);window.clearTimeout(foundationIdleEnd);window.clearTimeout(foundationCaptionTimer);const remembered=foundation.querySelector('.idle-memory');foundation.querySelectorAll('.idle-preview').forEach(x=>x.classList.remove('idle-preview'));foundation.classList.remove('idle-playing');foundationCaption.classList.remove('idle-caption-swap');if(remembered){remembered.classList.remove('idle-memory');remembered.classList.add('active')}const selected=foundation.querySelector('.block.active');if(selected){foundationLabel.textContent=selected.dataset.label;setFoundationOrbitFocus(selected,false)}}
function scheduleFoundationIdle(delay=4000){window.clearTimeout(foundationIdleStart);if(!foundationIdleAllowed||document.hidden)return;const epoch=foundationIdleEpoch;foundationIdleStart=window.setTimeout(()=>{if(epoch===foundationIdleEpoch)playFoundationIdle()},delay)}
function playFoundationIdle(){if(currentName()!=='intro'||!$('.screen[data-screen="intro"]').classList.contains('intro-settled')){scheduleFoundationIdle(900);return}pauseFoundationIdle();const epoch=foundationIdleEpoch,selected=foundation.querySelector('.block.active')||foundationBlocks[0];let target=foundationBlocks[foundationIdleIndex%foundationBlocks.length];if(target===selected){foundationIdleIndex=(foundationIdleIndex+1)%foundationBlocks.length;target=foundationBlocks[foundationIdleIndex]}selected.classList.remove('active');selected.classList.add('idle-memory');target.classList.add('idle-preview');foundation.classList.add('idle-playing');setFoundationOrbitFocus(target,false);swapFoundationCaption(target.dataset.label,epoch);foundationIdleEnd=window.setTimeout(()=>{if(epoch!==foundationIdleEpoch)return;target.classList.remove('idle-preview');foundation.classList.remove('idle-playing');selected.classList.remove('idle-memory');selected.classList.add('active');setFoundationOrbitFocus(selected,false);swapFoundationCaption(selected.dataset.label,epoch);foundationIdleIndex=(foundationIdleIndex+1)%foundationBlocks.length;scheduleFoundationIdle(1250)},1900)}
function clearFoundationImpact(){window.clearTimeout(foundationImpactTimer);foundation.classList.remove('impacting');['--impact-rx','--impact-rz','--impact-x','--impact-y','--impact-return-x','--impact-return-y','--impact-rebound-x','--impact-rebound-y'].forEach(p=>foundation.style.removeProperty(p));foundationBlocks.forEach(x=>{x.classList.remove('impact-selected','impact-neighbour');['--neighbour-x','--neighbour-y','--neighbour-return-x','--neighbour-return-y','--neighbour-rebound-x','--neighbour-rebound-y'].forEach(p=>x.style.removeProperty(p))})}
function playFoundationImpact(target){clearFoundationImpact();if(reducedMotion.matches)return;const width=foundation.offsetWidth,height=foundation.offsetHeight,cx=target.offsetLeft+target.offsetWidth/2,cy=target.offsetTop+target.offsetHeight/2,xNorm=Math.max(-1,Math.min(1,(cx-width/2)/(width/2))),yNorm=Math.max(-1,Math.min(1,(cy-height/2)/(height/2))),impactX=xNorm*5,impactY=yNorm*3.5;foundation.style.setProperty('--impact-rx',(55-yNorm*1.4)+'deg');foundation.style.setProperty('--impact-rz',(-45+xNorm*2.4)+'deg');foundation.style.setProperty('--impact-x',impactX+'px');foundation.style.setProperty('--impact-y',impactY+'px');foundation.style.setProperty('--impact-return-x',impactX*-.28+'px');foundation.style.setProperty('--impact-return-y',impactY*-.28+'px');foundation.style.setProperty('--impact-rebound-x',impactX*.12+'px');foundation.style.setProperty('--impact-rebound-y',impactY*.12+'px');target.classList.add('impact-selected');foundationBlocks.forEach(piece=>{if(piece===target)return;const px=piece.offsetLeft+piece.offsetWidth/2,py=piece.offsetTop+piece.offsetHeight/2,dx=px-cx,dy=py-cy,distance=Math.hypot(dx,dy);if(distance>105)return;const strength=Math.max(.25,1-distance/135),pushX=(dx/(distance||1))*5*strength,pushY=(dy/(distance||1))*5*strength;piece.style.setProperty('--neighbour-x',pushX+'px');piece.style.setProperty('--neighbour-y',pushY+'px');piece.style.setProperty('--neighbour-return-x',pushX*-.38+'px');piece.style.setProperty('--neighbour-return-y',pushY*-.38+'px');piece.style.setProperty('--neighbour-rebound-x',pushX*.14+'px');piece.style.setProperty('--neighbour-rebound-y',pushY*.14+'px');piece.classList.add('impact-neighbour')});void foundation.offsetWidth;foundation.classList.add('impacting');foundationImpactTimer=window.setTimeout(clearFoundationImpact,940)}
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
  window.clearTimeout(balanceResponseTimer);animateQuestionEntry(domainChanged);if(state.pendingResponse!==null)updateRange(state.pendingResponse,false);else if(Number.isFinite(state.responses[item.id]))updateRange(state.responses[item.id]-1,false)
}
function updateRange(value,save=true){
  const v=value===undefined?+range.value:+value,positions=[10,30,50,70,90],fill=[0,25,50,75,100],tilts=['-6deg','-3deg','-1deg','2deg','5deg'],orbPositions=['18%','31%','45%','59%','72%'],reaction=(v-2)/2;
  range.value=v;answer.textContent=labels[v];answer.dataset.selected='true';dots.forEach((x,i)=>{const selected=i===v;x.classList.toggle('active',selected);x.setAttribute('aria-pressed',String(selected));x.setAttribute('aria-label',scaleAria[i])});responseScale.style.setProperty('--scale-fill',fill[v]+'%');responseScale.style.setProperty('--response-position',positions[v]+'%');
  const plinth=balance.querySelector('.plinth'),orb=balance.querySelector('.orb');plinth.style.setProperty('--tilt',tilts[v]);orb.style.setProperty('--orb-left',orbPositions[v]);balance.style.setProperty('--reaction-angle',(reaction*1.6)+'deg');balance.style.setProperty('--reaction-return-angle',(reaction*-.55)+'deg');balance.style.setProperty('--reaction-rebound-angle',(reaction*.24)+'deg');balance.style.setProperty('--reaction-x',(reaction*3.5)+'px');balance.style.setProperty('--reaction-return-x',(reaction*-.9)+'px');balance.style.setProperty('--orb-kick-x',(reaction*5)+'px');balance.style.setProperty('--orb-return-x',(reaction*-1.5)+'px');balance.style.setProperty('--orb-rebound-x',(reaction*.6)+'px');
  window.clearTimeout(balanceResponseTimer);balance.classList.remove('settling','responding');scanScreen.classList.remove('response-set');void balance.offsetWidth;balance.classList.add('settling','responding');scanScreen.classList.add('response-set');balanceResponseTimer=window.setTimeout(()=>balance.classList.remove('settling','responding'),820);qContinue.disabled=false;
  selectedResponse=v;responseScale.querySelector('.scale-dots').classList.add('is-confirming');dots.forEach((point,index)=>point.classList.toggle('confirming',index===v));dots[v].setAttribute('aria-label',scaleAria[v]+'. Selected');state.pendingResponse=v;if(save)persistDraft()
}
range.oninput=()=>updateRange();dots.forEach(point=>point.onclick=()=>updateRange(+point.dataset.value));
function calculateDomainScores(){domains.forEach(d=>{const values=d.questions.map((_,i)=>state.responses[d.id+'-'+i]).filter(Number.isFinite);state.answers[d.id]=values.length?values.reduce((a,b)=>a+b,0)/values.length:null})}
function advanceQuestion(){if(selectedResponse===null)return;const item=scanItems[state.q];if(!item)return;const value=+range.value+1,previous=state.responses[item.id];if(previous!==value){state.priority=null;state.selected=null;state.selectionDomain=null;state.dose=null}state.responses[item.id]=value;state.pendingResponse=null;checkpointId=item.id;checkpointRevised=Number.isFinite(previous);renderCheckpoint(previous!==value);state.q++;if(state.q<scanItems.length){rememberScreen(true);renderQuestion();show('scan',false)}else{calculateDomainScores();show('snapshot')}}
qContinue.onclick=advanceQuestion;
function status(v){return Number.isFinite(v)?v+' / 5':'Not answered'}
function lowestDomains(){const rated=domains.filter(d=>d.questions.every((_,i)=>Number.isFinite(state.responses[d.id+'-'+i])));const lowest=Math.min(...rated.map(d=>state.answers[d.id]));return rated.filter(d=>state.answers[d.id]===lowest)}
function setPriority(id){
  if(state.priority!==id){state.selected=null;state.selectionDomain=null;state.dose=null}
  state.priority=id;
}
function renderSnapshot(){
 calculateDomainScores();
 const model=$('#foundationModel'),screen=$('.screen[data-screen="snapshot"]'),lowest=lowestDomains();
 $('#snapshotTitle').textContent=answeredCount()+' answers';
 const overall=state.responses.overall;
 $('#snapshotContext').textContent=`${answeredCount()} of 17 answers across eight areas. `+(overall?`Overall, you chose “${labels[overall-1].toLowerCase()}”. `:'')+'Area numbers are averages of your answers, not clinical scores.';
 $('.load-beam',model).style.setProperty('--beam-tilt','0deg');
 $('#supportFrame').innerHTML=domains.map((d,i)=>{const v=state.answers[d.id],known=Number.isFinite(v);return `<div class="support-piece${known?'':' unanswered'}" data-id="${d.id}" style="--piece-delay:${.15+i*.05}s;--score:${known?v:0};--piece-height:${known?Math.round(30+v*14):14}px;--piece-sink:0px;--piece-accent:#9FC5EF" aria-label="${d.name}: ${status(v)}"></div>`}).join('');
 $('#modelOrbit').innerHTML=domains.map((d,i)=>{const count=d.questions.filter((_,n)=>Number.isFinite(state.responses[d.id+'-'+n])).length;return `<button class="model-node" type="button" data-id="${d.id}" style="--node-delay:${.2+i*.04}s;--node-color:#9FC5EF" aria-pressed="false"><b>${d.name}</b><span>${status(state.answers[d.id])}${count===1?' · 1 answer':''}</span></button>`}).join('');
 const select=d=>{
   setPriority(d.id);
   $$('.model-node',model).forEach(node=>{const active=node.dataset.id===d.id;node.classList.toggle('priority',active);node.setAttribute('aria-pressed',String(active))});
   $$('.support-piece',model).forEach(piece=>piece.classList.toggle('priority',piece.dataset.id===d.id));
   const detail=$('#modelDetail');$('.detail-kicker',detail).textContent='Your chosen focus';$('strong',detail).textContent=d.name;
   $('span:last-child',detail).textContent=Number.isFinite(state.answers[d.id])?'You chose this area. Try a small action and see whether it fits.':'You have not rated this area. You can still choose it as your focus.';
   $('#snapshotContinue').disabled=false;$('#openPriorityWhy').disabled=false;$('#openPriorityWhy').textContent='How this becomes a plan';renderRationale();updateFlowNav('snapshot');persistDraft();
 };
 $$('.model-node',model).forEach(node=>node.onclick=()=>select(domains.find(d=>d.id===node.dataset.id)));
 if(state.priority)select(priority());else{
   $('#snapshotContinue').disabled=true;$('#openPriorityWhy').disabled=true;
   const detail=$('#modelDetail');$('.detail-kicker',detail).textContent='You choose the focus';$('strong',detail).textContent=lowest.length>1?'Some areas are tied':lowest.length===1?lowest[0].name+' has your lowest average':'Choose an area to explore';
   $('span:last-child',detail).textContent=lowest.length>1?(lowest.length===domains.length?'All eight areas have the same average. Choose the one that feels most useful.':'Among completed areas, '+lowest.map(d=>d.name.toLowerCase()).join(', ')+' share your lowest average. You choose the focus.'):'Tap an area above. Your preference matters more than a ranking.';
 }
 window.clearTimeout(snapshotBuildTimer);screen.classList.remove('snapshot-building');
 if(!reducedMotion.matches){void screen.offsetWidth;screen.classList.add('snapshot-building');snapshotBuildTimer=window.setTimeout(()=>screen.classList.remove('snapshot-building'),1400)}
}
function renderRationale(){
  const d=priority(),path=$('#logicPath'),story=$('#pathwayStory'),insight=$('.pathway-insight',story),copy=$('#rationaleCopy'),copyLabel=$('#pathwayInsightLabel'),copyTitle=$('#pathwayInsightTitle'),play=$('#playPathway');$('#priorityName').textContent=d.name;window.clearTimeout(pathwayPlayTimer);
  const logic=['Your answers','Your chosen focus','One small experiment','Notice what fits'];
  $('#priorityExplanationContext').textContent=' is the area you chose to explore.';
  const reflection=globalThis.FoundationsCheckpoints.describe({items:scanItems,responses:state.responses,lastId:d.id+'-1'});
  const stepCopy=[Number.isFinite(state.responses[d.id+'-1'])?reflection.copy:'You can choose this area without having rated it. Missing answers are not scored.', 'This is your preference, not a diagnosis or a claim about what caused how you feel.', 'Choose one action and a size that fits your circumstances. You can change either before saving.', 'After trying it, review effort and usefulness. Keep, resize or change the plan based on what actually happened.'];
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
 $('.topbar').inert=false;flowNav.inert=false;$('.journey-meta').inert=false;if(restore)$('#openPriorityWhy').focus({preventScroll:true});
}
$('#openPriorityWhy').onclick=()=>{
 renderRationale();priorityExplanation.inert=false;priorityExplanation.classList.add('open');priorityExplanation.setAttribute('aria-hidden','false');
 [...priorityExplanation.parentElement.children].filter(e=>e!==priorityExplanation).forEach(e=>e.inert=true);
 $('.topbar').inert=true;flowNav.inert=true;$('.journey-meta').inert=true;
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
function priority(){return domains.find(d=>d.id===state.priority)}
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
 if(state.selectionDomain!==d.id){state.selectionDomain=d.id;state.selected=null;state.dose=null}
 $('#choiceDomain').textContent=d.name.toLowerCase()+'.';$('#choiceSheetDomain').textContent=d.name;
 wrap.innerHTML=d.actions.map((a,i)=>`<button class="minimal-choice" type="button" data-i="${i}" aria-pressed="false"><span class="choice-number">0${i+1}</span><span class="choice-copy"><b>${a[0]}</b><small>${a[1]}</small></span><span class="choice-check" aria-hidden="true">✓</span></button>`).join('');
 const update=()=>{
   $$('.minimal-choice',wrap).forEach(btn=>{const selected=+btn.dataset.i===state.selected;btn.classList.toggle('selected',selected);btn.setAttribute('aria-pressed',String(selected))});
   wrap.classList.toggle('has-selection',state.selected!==null);
 };
 $$('.minimal-choice',wrap).forEach(btn=>btn.onclick=()=>{const index=+btn.dataset.i;if(state.selected!==index){state.dose=null}state.selected=index;update();show('dose')});update();
}

function chosen(){return priority().actions[state.selected??0]}
function doseOptions(){
 const d=priority(),a=chosen();
 return [{id:'tiny',name:'Tiny version',copy:tinyInstructions[d.id][state.selected??0]},
 {id:'regular',name:'Regular version',copy:a[1]},
 {id:'repeat',name:'Repeat version',copy:a[1]+' Try this twice this week.'}];
}
function actionTitle(plan={domain:state.priority,action:state.selected??0,size:state.dose?.id}){
 const title=domains.find(d=>d.id===plan.domain).actions[plan.action][0];
 if(plan.size!=='tiny')return title;
 const titles={sleep:{1:'Find a moment of daylight'},movement:{0:'Take a short outside walk',1:'Use a short movement break'},recovery:{0:'Protect a brief landing'},activation:{1:'Approach for two minutes'}};
 return titles[plan.domain]?.[plan.action]||title;
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

   if(animate)reveal(preview,[{opacity:.7,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:320,easing:'ease-out'});
 };
 $$('.dose',wrap).forEach(btn=>btn.onclick=()=>{const next=doses[+btn.dataset.i];state.dose=next;update(true);show('plan')});update();
}

const fitNotes={
 sleep:'The timing suggestions are examples, not requirements. Adapt them for shift work, caring duties, daylight access or health needs; another action may fit better.',
 nutrition:'Keep the focus on enough food and water, not restriction. Adapt this around your access, preferences and any care plan you already follow.',
 movement:'Choose movement that is comfortable and safe for you. Seated or indoor movement can be an alternative; stop or choose another area if this does not fit.',
 recovery:'Rest does not have to be earned. You can remove a demand or choose a pause that is actually available to you.',
 structure:'An anchor is an option, not a rigid schedule. Adapt it to the responsibilities and unpredictability in your day.',
 activation:'A small start is an experiment, not a test of willpower. Rest or practical support may be more useful when capacity is limited.',
 support:'Choose safe contact only. If no trusted person comes to mind, a suitable group or support service may be an alternative; you can also choose another focus.',
 stability:'This is a general planning exercise, not a treatment plan. Choose a small, safe change; do not use it to change medication or manage withdrawal.'
};
function samePlan(plan){return !!plan&&plan.domain===state.priority&&plan.action===state.selected&&plan.size===state.dose?.id&&(plan.cue||'')===(state.cue||'')&&(plan.time||'')===(state.time||'')}
function renderPlan(){
 const d=priority(),a=chosen(),card=$('#weeklyPlanCard'),toggle=$('#planWhyToggle');
 const savedDate=samePlan(savedPlan)?new Date(savedPlan.updatedAt||savedPlan.savedAt):null;$('#planSavedWhen').textContent=savedDate&&!Number.isNaN(savedDate.getTime())?'Saved '+savedDate.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'This week';
 $('#planDomain').textContent=d.name;$('#planTitle').textContent=actionTitle();$('#planInstruction').textContent=state.dose?.copy||a[1];
 $('#planDose').textContent=state.dose?.name||'Regular version';$('#planWhy').textContent=a[2];$('#planFitNote').textContent=fitNotes[d.id];
 $('#planWhyDisclosure').hidden=true;toggle.setAttribute('aria-expanded','false');toggle.querySelector('span').textContent='＋';
 const cue=$('#planCue');if(state.cue&&![...cue.options].some(option=>option.value===state.cue)){const option=document.createElement('option');option.value=state.cue;option.textContent=state.cue;cue.append(option)}cue.value=state.cue||'';$('#planTime').value=state.time||'';
 $('#reviewPlan').hidden=!samePlan(savedPlan);$('#planError').hidden=true;$('#reloadSavedPlan').hidden=true;
 $('#savePlan span:first-child').textContent=savedPlan&&!samePlan(savedPlan)?'Save this version of my weekly plan':'Save my weekly plan';
 $('#planReveal').textContent=samePlan(savedPlan)?'Your saved plan. Ready when it fits.':'Two choices. One doable next step.';
 updateCueSummary();reveal(card,[{opacity:.55,transform:'translateY(12px) scale(.98)'},{opacity:1,transform:'none'}],{duration:500,easing:'cubic-bezier(.16,.86,.24,1)'});
}
function updateCueSummary(){
 $('#reviewPlan').hidden=!samePlan(savedPlan);updateFlowNav(currentName());
 const parts=[state.cue,state.time].filter(Boolean);$('#planCueSummary').textContent=parts.length?parts.join(' · '):'No cue or time chosen.';
 $('#cueFeedback').textContent=parts.length?'Your cue is on the card above. Save the plan to keep it. No notification is scheduled.':'These are cues on your plan, not scheduled notifications.';
}
$('#planCue').onchange=()=>{state.cue=$('#planCue').value;updateCueSummary();persistDraft();reveal($('#planCueSummary'),[{opacity:.4},{opacity:1}],{duration:350})};
$('#planTime').oninput=()=>{state.time=$('#planTime').value;updateCueSummary();persistDraft()};
$('#planWhyToggle').onclick=()=>{const disclosure=$('#planWhyDisclosure'),toggle=$('#planWhyToggle'),expanded=toggle.getAttribute('aria-expanded')==='true';disclosure.hidden=expanded;toggle.setAttribute('aria-expanded',String(!expanded));toggle.querySelector('span').textContent=expanded?'＋':'−'};
$('#changePlan').onclick=()=>show('choices');
function refreshSavedPlan(){const result=store.readPlan();savedPlan=result.value;planReadError=result.error;$('#resumePlan').hidden=!savedPlan;$('#resumeReview').hidden=!savedPlan}
function hydratePlan(plan){
 const different=state.planId!==plan.id||state.planRevision!==plan.revision;
 state.priority=plan.domain;state.selectionDomain=plan.domain;state.selected=plan.action;state.dose=doseOptions().find(d=>d.id===plan.size);state.cue=plan.cue;state.time=plan.time;state.planId=plan.id;state.planRevision=plan.revision;
 if(different){state.review={};state.reviewId=''}
}
function openSavedPlan(){
 const result=store.readPlan();if(!result.value){$('#draftStatus').textContent='The saved plan could not be opened. Your current draft is unchanged.';return false}
 if(canEnter('plan')&&!samePlan(result.value)&&!window.confirm('Open the saved plan instead of your unsaved plan edits? Your check-in answers will stay.'))return false;
 savedPlan=result.value;planReadError=null;hydratePlan(savedPlan);show('plan');return true;
}
$('#resumePlan').onclick=openSavedPlan;$('#viewSavedPlan').onclick=()=>show('plan');$('#finishPlan').onclick=openSavedPlan;$('#reloadSavedPlan').onclick=openSavedPlan;
let saveNotice='';
function renderSaved(){
 const stored=samePlan(savedPlan);
 $('#savedTitle').textContent=stored?'Plan saved.':'Plan ready.';$('#savedStatus').textContent=stored?'On this device':'For this visit';
 $('#savedCopy').textContent=saveNotice||(stored?'Your plan is saved on this device. Trying it is a separate step. Come back to review what actually happened.':'Save the plan when you are ready to keep it.');
}
function commitPlan(plan){
 const current=store.readPlan();
 if(current.error||(savedPlan&&(!current.value||current.value.id!==savedPlan.id||current.value.revision!==savedPlan.revision))||(!savedPlan&&current.value))return false;
 if(!store.writePlan(plan))return false;
 savedPlan=store.plan(plan);planReadError=null;state.planId=savedPlan.id;state.planRevision=savedPlan.revision;return true;
}
function uniqueId(){return globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}
$('#savePlan').onclick=()=>{
 if(!canEnter('plan'))return;
 const unchanged=samePlan(savedPlan);if(!unchanged&&Object.keys(state.review).length&&!window.confirm('Save a different plan and replace the unfinished review? Previously saved reviews and check-in answers will stay.'))return;
 if(!$('#planTime').checkValidity()){$('#planTime').reportValidity();return}
 const now=new Date().toISOString(),plan={version:2,id:savedPlan?.id||uniqueId(),domain:state.priority,action:state.selected,size:state.dose.id,cue:state.cue||'',time:state.time||'',savedAt:savedPlan?.savedAt||now,updatedAt:now,revision:(savedPlan?.revision||0)+1,reviews:savedPlan?.reviews||[]};
 if(planReadError||!commitPlan(plan)){$('#planError').hidden=false;$('#planError').textContent='This plan has not been saved. Storage may be unavailable, or another tab changed the saved plan. Your draft is still here.';$('#reloadSavedPlan').hidden=!store.readPlan().value;return}
 if(!unchanged){state.review={};state.reviewId=''}saveNotice='Your plan is saved on this device. '+(state.cue||state.time?'Your cue is included; no notification is scheduled.':'Try it when it fits, then review what happened.');refreshSavedPlan();show('saved');
};
function openReview(){
 const current=store.readPlan();if(!current.value){$('#draftStatus').textContent='Save a plan before reviewing it.';return}
 if(canEnter('plan')&&!samePlan(current.value)&&!window.confirm('Review the saved plan instead of your unsaved plan edits? Your check-in answers will stay.'))return;
 savedPlan=current.value;hydratePlan(savedPlan);if(!state.reviewId)state.reviewId=uniqueId();show('review');
}
$('#reviewPlan').onclick=openReview;$('#resumeReview').onclick=openReview;
const reviewLabels={tried:['Not yet','A little','Partly','Mostly','As planned'],effort:['Too much','Difficult','Manageable','Comfortable','Easy to repeat'],help:['Not helpful','A little','Somewhat','Helpful','Very helpful']};
function renderReview(){
 if(savedPlan)$('#reviewPlanSummary').textContent=actionTitle(savedPlan)+' · '+savedPlan.size+' version';
 $$('.review-scale').forEach(w=>{const key=w.dataset.review;w.innerHTML=reviewLabels[key].map((label,i)=>`<button type="button" data-n="${i+1}" aria-label="${i+1}: ${label}" aria-pressed="${state.review[key]===i+1}" class="${state.review[key]===i+1?'selected':''}">${i+1}<span>${label}</span></button>`).join('');$$('button',w).forEach(b=>b.onclick=()=>{state.review[key]=+b.dataset.n;if(key==='tried'&&state.review.tried===1){delete state.review.effort;delete state.review.help}renderReview();persistDraft();$(`button[data-n="${b.dataset.n}"]`,w).focus({preventScroll:true});if(state.review.tried&&state.review.effort){reveal($('#reviewCheckpoint'),[{opacity:.5,transform:'scale(.98)'},{opacity:1,transform:'none'}],{duration:350});}})});
 const r=state.review,notYet=r.tried===1;$('#reviewNotYet').hidden=!notYet;$('#reviewContinue').disabled=!r.tried;$('#effortContinue').disabled=!r.effort;$('#helpContinue').disabled=!store.completeReview(r);
 $('#reviewCheckpoint').textContent=notYet?'':r.tried&&r.effort?`Two pieces connected: you tried it “${reviewLabels.tried[r.tried-1].toLowerCase()}” and found it “${reviewLabels.effort[r.effort-1].toLowerCase()}”. `+(r.help?'Next: choose what to keep or change.':'Next: was it useful?'):'';
}
function renderLearning(){
 const r=state.review,tiny=savedPlan?.size==='tiny';
 let title,copy;
 if(r.tried===1){title='A plan you can return to.';copy=tiny?'You have not tried it yet, and it is already the tiny version. Keep it, change its cue on the plan, or choose another action.':'You have not tried it yet. Keep the plan, try its tiny version, or choose another action.'}
 else if(r.help<=2){title='A different action may fit.';copy='You reported little benefit. That is useful feedback, not a failure. Keep the plan if you want another try, or choose another action.'}
 else if(r.effort<=2){title='Keep the useful part. Reduce the demand.';copy=tiny?'You found some benefit but it asked too much, even in its tiny version. You can change its cue on the plan or choose another action.':'You found some benefit but it asked too much. The tiny version is one option to try.'}
 else if(r.tried<=2){title='A start you can build around.';copy='You made a small start. Keep the plan if it fits, or make another choice. Your answers do not mean you need to do more.'}
 else{title='You found something that may fit.';copy='You reported some usefulness and manageable effort. Keep it for another try, or choose a different action.'}
 $('#learnedTitle').textContent=title;$('#learnedCopy').textContent=copy+' Choose below to save this review.';
 $('#applyTiny').hidden=tiny;$('#reviewSaveError').hidden=true;
}
$('#reviewContinue').onclick=()=>{if(state.review.tried)show(state.review.tried===1?'learned':'review-effort')};
$('#effortContinue').onclick=()=>{if(state.review.effort)show('review-help')};
$('#helpContinue').onclick=()=>{if(store.completeReview(state.review))show('learned')};
function saveReview(decision){
 if(currentName()!=='learned'||!savedPlan||state.planId!==savedPlan.id||state.planRevision!==savedPlan.revision||!store.completeReview(state.review))return;
 if(!state.reviewId)state.reviewId=uniqueId();
 if(savedPlan.reviews.some(review=>review.id===state.reviewId)){show('saved');return}
 const now=new Date().toISOString(),entry={id:state.reviewId,reviewedAt:now,ratings:{...state.review},plan:{domain:savedPlan.domain,action:savedPlan.action,size:savedPlan.size,cue:savedPlan.cue,time:savedPlan.time},decision};
 const next={...savedPlan,revision:savedPlan.revision+1,updatedAt:now,size:decision==='tiny'?'tiny':savedPlan.size,reviews:[...savedPlan.reviews,entry]};
 if(!commitPlan(next)){$('#reviewSaveError').hidden=false;$('#reviewSaveError').textContent='Your review has not been saved. Check device storage or reopen the latest saved plan, then try again.';return}
 hydratePlan(savedPlan);state.review={};state.reviewId='';saveNotice=decision==='tiny'?'Review saved. Your plan now uses the tiny version.':'Review saved with the plan you actually reviewed.';
 if(decision==='change'){state.selected=null;state.dose=null;show('choices')}else show('saved');
}
$('#applyTiny').onclick=()=>saveReview('tiny');$('#keepReviewedPlan').onclick=()=>saveReview('keep');$('#changeReviewedPlan').onclick=()=>saveReview('change');
function restartCheckIn(){
 if((answeredCount()||canEnter('plan'))&&!window.confirm('Start a new check-in? This replaces the current draft answers and any unfinished review. Your saved weekly plan and reviews will stay.'))return;
 state=freshState();checkpointId=null;checkpointRevised=false;saveNotice='';renderCheckpoint();renderReview();renderQuestion();refreshSavedPlan();show('intro',false);
}
$('#restart').onclick=restartCheckIn;$('#newCheckIn').onclick=restartCheckIn;
const introScreen=$('.screen[data-screen="intro"]');
function applyPreferences(prefs=sharedPreferences){
 sharedPreferences=prefs&&typeof prefs==='object'?prefs:{};
 reducedMotion.matches=typeof sharedPreferences.reducedMotion==='boolean'?sharedPreferences.reducedMotion:motionQuery.matches;
 foundationIdleAllowed=!reducedMotion.matches;
 document.documentElement.classList.toggle('reduce-motion',reducedMotion.matches);document.documentElement.classList.toggle('large-text',sharedPreferences.largeText===true);document.documentElement.classList.toggle('high-contrast',sharedPreferences.highContrast===true);
 const soundOn=localSound&&sharedPreferences.ambientSoundscape!==false;$('#soundToggle').textContent=soundOn?'Sound on':'Sound off';$('#soundToggle').setAttribute('aria-pressed',String(soundOn));$('#soundToggle').disabled=sharedPreferences.ambientSoundscape===false;$('#soundToggle').title=sharedPreferences.ambientSoundscape===false?'Sound is off in app preferences.':'';
 if(reducedMotion.matches){pauseFoundationIdle();clearFoundationImpact();cancelAnimationFrame(parallaxFrame);parallaxFrame=0;writeFoundationParallax(0,0);introScreen.classList.add('intro-settled');checkpoint.classList.remove('checkpoint-earned')}
 if(!soundOn&&audioContext?.state==='running')audioContext.suspend().catch(()=>{});
}
$('#soundToggle').onclick=()=>{localSound=!localSound;try{localStorage.setItem('mentication.foundations.sound.v1',localSound?'on':'off')}catch(e){}applyPreferences()};
window.addEventListener('message',e=>{if(e.origin===window.location.origin&&e.source===window.parent&&e.data?.type==='foundations:preferences')applyPreferences(e.data.prefs)});
window.addEventListener('storage',e=>{
 if(e.key==='haven.a11y.v2'||e.key==='mentication.foundations.sound.v1'){try{sharedPreferences=JSON.parse(localStorage.getItem('haven.a11y.v2')||'{}');localSound=localStorage.getItem('mentication.foundations.sound.v1')!=='off'}catch(error){}applyPreferences()}
 if(e.key===null||((e.key===store.keys.plan||e.key===store.keys.draft||e.key===store.keys.legacy)&&e.newValue===null)){ready=false;state=freshState();checkpointId=null;checkpointRevised=false;refreshSavedPlan();renderCheckpoint();renderQuestion();show('intro',false);$('#draftStatus').textContent='Device data changed in another window. Start here or reopen your saved plan.';ready=true}
});
motionQuery.addEventListener('change',()=>applyPreferences());
window.addEventListener('pagehide',persistDraft);
window.addEventListener('message',event=>{
 if(event.origin!==window.location.origin||event.source!==window.parent||(event.data?.type!=='mentication:restore-screen'||event.data?.journeyId!=='foundations'))return;
 const screen=event.data.screen,target={name:screen?.id,q:screen?.cursors?.q,depth:screen?.depth};if(!order.includes(target.name))return;
 hostHistoryDepth=Number.isSafeInteger(target.depth)&&target.depth>=0?target.depth:0;
 state.q=Math.max(0,Math.min(scanItems.length-1,Number.isInteger(target.q)?target.q:state.q));state.pendingResponse=null;
 if(target.name==='scan')renderQuestion();show(target.name,false);
});

window.addEventListener('popstate',event=>{const target=event.state?.foundations;if(embeddedHistory||!target)return;state.q=Math.max(0,Math.min(scanItems.length-1,target.q));state.pendingResponse=null;if(target.name==='scan')renderQuestion();show(target.name,false)});
const loadedDraft=store.readDraft();refreshSavedPlan();
let start='intro';
if(loadedDraft.value){state=loadedDraft.value.state;checkpointId=loadedDraft.value.checkpointId;checkpointRevised=loadedDraft.value.checkpointRevised;calculateDomainScores();if(state.priority&&state.selected!==null&&state.dose)state.dose=doseOptions().find(d=>d.id===state.dose.id);start=loadedDraft.value.screen}
else if(savedPlan){hydratePlan(savedPlan);start='plan'}
const staleReview=['review','review-effort','review-help','learned'].includes(start)&&savedPlan&&(state.planId!==savedPlan.id||state.planRevision!==savedPlan.revision);if(staleReview)start='plan';
applyPreferences();renderReview();renderQuestion();renderCheckpoint();
if(reducedMotion.matches)introScreen.classList.add('intro-settled');
else window.setTimeout(()=>{introScreen.classList.add('intro-settled');if(currentName()==='intro'){playHomeEnergyTransfer();scheduleFoundationIdle(2600)}},2700);
setFoundationOrbitFocus(foundationBlocks[0],false);show(start,false);ready=true;
$('#draftStatus').textContent=loadedDraft.error?'The previous draft could not be read. It has been kept untouched; use Settings to back it up.':planReadError?'The saved plan could not be read. It has been kept untouched.':loadedDraft.value?'Draft restored on this device.':savedPlan?'Saved plan opened on this device.':'Your answers stay on this device.';
if(staleReview){$('#planError').hidden=false;$('#planError').textContent='The saved plan changed after this review began. Your draft answers are still here. Open the latest saved plan before reviewing again.';$('#reloadSavedPlan').hidden=false}
if(window.parent!==window)window.parent.postMessage({type:'foundations:ready'},window.location.origin);
window.addEventListener('message', async event => {
 if(event.origin!==window.location.origin||event.source!==window.parent||event.data?.type!=='mentication:pause-for-alternative')return;
 pauseFoundationIdle();persistDraft();
 if(audioContext?.state==='running')await audioContext.suspend();
 window.parent.postMessage({type:'mentication:alternative-ready',requestId:event.data.requestId},window.location.origin);
});

})();
