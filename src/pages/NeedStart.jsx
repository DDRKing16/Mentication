import React, { useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bookmark, Compass } from 'lucide-react';
import { NEED_ENTRIES } from '@/lib/journeyExperience';
import { INTERVENTIONS } from '@/lib/interventions';
import { NEED_GROUPS, practiceDestination } from '@/lib/practiceDiscovery';
import PracticePreview from '@/components/discovery/PracticePreview';
import '@/styles/discovery.css';

export default function NeedStart() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const heading = useRef(null);
  const need = NEED_ENTRIES.find(item => item.id === params.get('need'));
  const group = NEED_GROUPS.find(item => item.id === params.get('group'));
  const practice = need && INTERVENTIONS.find(item => item.id === need.practice);
  const stage = practice ? 3 : group ? 2 : 1;
  useEffect(() => { heading.current?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }, [params]);
  const chooseGroup = item => setParams(item.needs.length === 1 ? { group: item.id, need: item.needs[0] } : { group: item.id });
  const begin = () => { const destination = practiceDestination(need.practice); if (destination) navigate(destination.to, { state: destination.state }); };
  return <main className="discovery-page"><div className="discovery-shell">
    <nav className="discovery-topline" aria-label="Page navigation">
      {stage > 1 ? <button type="button" className="discovery-text-button" onClick={() => setParams(practice && group?.needs.length > 1 ? { group: group.id } : {})}><ArrowLeft size={17} aria-hidden="true" />{practice && group?.needs.length > 1 ? 'Change your choice' : 'All starting points'}</button> : <Link to="/" className="discovery-text-button"><ArrowLeft size={17} aria-hidden="true" />Home</Link>}
      <span className="discovery-eyebrow">Find your practice</span>
    </nav>
    <div className="discovery-progress" aria-label={`Step ${stage} of 3`}><span className="is-current" /><span className={stage >= 2 ? 'is-current' : ''} /><span className={stage === 3 ? 'is-current' : ''} /></div>
    <header className="discovery-header"><p className="discovery-eyebrow">{practice ? 'Your starting point' : group ? 'A little closer' : 'Right here, right now'}</p>
      <h1 ref={heading} tabIndex={-1}>{practice ? 'One practice. Your pace.' : group ? 'What sounds closest?' : 'What would help you begin?'}</h1>
      <p>{practice ? 'A starting idea based on what you chose. You decide whether it fits.' : group ? group.description + '. Choose what feels closest, even if it is not an exact fit.' : 'You do not need the perfect words. Start with one part of what is happening.'}</p>
    </header>
    {practice ? <>
      <div className="discovery-selection"><span>You chose</span><p>{need.label}</p></div>
      <PracticePreview practice={practice} onBegin={begin} />
      <section className="discovery-reason"><h2>Why this starting point?</h2><p>{need.reason}</p></section>
    </> : <div className="discovery-choices" aria-label={group ? 'What you need now' : 'Starting points'}>
      {group ? NEED_ENTRIES.filter(item => group.needs.includes(item.id)).map(item => <button type="button" className="discovery-choice" key={item.id} onClick={() => setParams({ group: group.id, need: item.id })}><span>{item.label}</span><ArrowRight size={19} aria-hidden="true" /></button>) : NEED_GROUPS.map(item => <button type="button" className={`discovery-choice discovery-choice--${item.id}`} key={item.id} onClick={() => chooseGroup(item)}><span className="discovery-choice-mark" aria-hidden="true">{item.mark}</span><span><strong>{item.title}</strong><small>{item.description}</small></span><ArrowRight size={19} aria-hidden="true" /></button>)}
    </div>}
    <div className="discovery-footer-links">
      <Link to="/reset" state={{ unsure: true }}><Compass size={19} aria-hidden="true" /><span>Still unsure? Guide me</span><ArrowRight size={17} aria-hidden="true" /></Link>
      <Link to="/library"><span>Browse all practices</span><ArrowRight size={17} aria-hidden="true" /></Link>
      <Link to="/return-points"><Bookmark size={18} aria-hidden="true" /><span>Return to saved work</span><ArrowRight size={17} aria-hidden="true" /></Link>
    </div>
  </div></main>;
}
