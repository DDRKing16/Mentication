import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Bookmark } from 'lucide-react';
import { useDeviceSessions } from '@/hooks/useDeviceSessions';
import { suggestionLaunchEntry, repeatLaunchEntry } from '@/lib/practiceLaunch';
import { INTERVENTIONS, pickLastWorked, buildPersonalBest } from '@/lib/interventions';
import { buildRecommendation } from '@/lib/recommend';
import { PRACTICE_PREVIEWS, practiceDuration } from '@/lib/practiceDiscovery';
import '@/styles/discovery.css';

function PlanContents({ ids = [] }) {
  const practices = ids.map(id => INTERVENTIONS.find(iv => iv.id === id)).filter(Boolean);
  return <ol className="plan-contents">{practices.map((iv, index) => <li key={`${iv.id}-${index}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><div><strong>{iv.name}</strong><small>{practiceDuration(iv)}</small><p>{PRACTICE_PREVIEWS[iv.id] || iv.why}</p></div></li>)}</ol>;
}

export default function MyPlan() {
  const navigate = useNavigate();
  const { sessions, ready, error, reload } = useDeviceSessions(30);
  const data = useMemo(() => ready ? { lastWorked: pickLastWorked(sessions), personalBest: buildPersonalBest(sessions), recommendation: buildRecommendation(sessions) } : null, [sessions, ready]);
  const recommendation = data?.recommendation;
  const repeat = data?.personalBest || data?.lastWorked;
  function beginSuggested() {
    if (!recommendation || (!recommendation.requiresCheckIn && !recommendation.pathway?.length)) return;
    navigate('/reset', { state: suggestionLaunchEntry(recommendation) });
  }
  function beginRepeat() {
    if (!repeat?.pathway?.length) return;
    navigate('/reset', { state: data.personalBest ? repeatLaunchEntry({ ...repeat, direction_label: 'From your feedback', time_min: 6, where_felt: 'both', audio: 'yes', movement: 'seated' }) : repeatLaunchEntry(repeat) });
  }
  return <main className="discovery-page discovery-page--tab"><div className="discovery-shell">
    <header className="discovery-header"><p className="discovery-eyebrow">My Plan</p><h1>A little direction.<br />Room to choose.</h1><p>Start with a suggestion, or choose what fits this moment.</p></header>
    <Link className="plan-choose" to="/start"><span><strong>What do you need right now?</strong><small>Choose a starting point that feels close.</small></span><ArrowRight size={20} aria-hidden="true" /></Link>
    {error && <div className="discovery-alert" role="alert"><p>{error}</p><button type="button" className="discovery-text-button" onClick={reload}>Try again</button></div>}
    {!data && !error && <p role="status" className="discovery-panel">Loading your starting ideas…</p>}
    {recommendation && <section className="plan-today" aria-labelledby="today-title">
      <div className="plan-card-top"><span className="discovery-eyebrow">A suggestion for today</span><span>{recommendation.requiresCheckIn ? 'Start with a check-in' : `About ${recommendation.minutes} min`}</span></div>
      <h2 id="today-title">{recommendation.title}</h2>
      {recommendation.requiresCheckIn ? <p className="plan-intro">A brief check-in helps choose a Lift practice for where you are now.</p> : <PlanContents ids={recommendation.pathway} />}
      <button type="button" className="discovery-light-button" onClick={beginSuggested}>{recommendation.requiresCheckIn ? 'Check in & choose' : 'Explore this reset'}<ArrowRight size={18} aria-hidden="true" /></button>
      <details className="plan-explanation"><summary>Why this suggestion?</summary><p>The time of day sets the starting direction. Saved practice feedback can help choose the activities. This is a starting idea, not a reading of how you feel now.</p></details>
    </section>}
    <section className="discovery-panel" aria-labelledby="feedback-title"><p className="discovery-eyebrow">From your feedback</p><h2 id="feedback-title">{repeat ? 'Something to return to' : 'Your experience belongs here'}</h2>
      {repeat ? <><p>{data.personalBest ? 'A sequence suggested using your saved practice feedback. It may include something to explore.' : 'A previous reset with a positive change in your recorded ratings. Today may feel different.'}</p><PlanContents ids={repeat.pathway} /><button type="button" className="discovery-primary" onClick={beginRepeat}>Explore this sequence<ArrowRight size={18} aria-hidden="true" /></button></> : <><p>When you choose to leave feedback, it can help shape future suggestions. Skipped ratings stay unanswered; a practice does not have to make you feel better.</p><Link className="discovery-text-button" to="/library">Find a practice to try<ArrowRight size={16} aria-hidden="true" /></Link></>}
    </section>
    <div className="discovery-footer-links"><Link to="/return-points"><Bookmark size={19} aria-hidden="true" /><span>Return to your saved words & plans</span><ArrowRight size={17} aria-hidden="true" /></Link><Link to="/library"><span>Browse every practice</span><ArrowRight size={17} aria-hidden="true" /></Link></div>
  </div></main>;
}
