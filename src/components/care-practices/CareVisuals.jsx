import { mindPattern } from '@/lib/experientialCare';
import { EXTERNAL_ANCHORS } from '@/lib/carePracticeDesign';

export function CompassionVisual({ s, mode = 'line' }) {
  const response = mode === 'response' || mode === 'practice';
  return <div className={`compassion-lantern ${response ? 'is-caring' : ''} ${s.responseRead ? 'is-read' : ''}`}>
    <div className="compassion-orbit" aria-hidden="true"><svg viewBox="0 0 400 290"><defs><radialGradient id="care-warmth"><stop stopColor="#f5be91" stopOpacity=".25"/><stop offset="1" stopColor="#f5be91" stopOpacity="0"/></radialGradient></defs><ellipse cx="200" cy="163" rx="195" ry="128" fill="url(#care-warmth)"/><path d="M28 238 Q30 34 200 34 Q370 34 372 238"/><path d="M57 239 Q54 66 200 66 Q346 66 343 239"/><path className="compassion-cup" d="M80 217 Q99 278 200 266 Q301 278 320 217"/><circle cx="200" cy="36" r="3"/></svg></div>
    <div className="compassion-lantern-words"><span>{response ? 'A voice on your side' : s.notice ? 'The critical line' : 'Care can start here'}</span><p>{response ? (s.perspective || 'I can be honest about what is hard and still be kind to myself.') : (s.notice || 'I do not have to attack myself to take a next step.')}</p></div>
    <div className="compassion-base" aria-hidden="true"><i/><i/><i/></div>
  </div>;
}
export function ThoughtVisual({ s, mode = 'thought' }) {
  const beside = s.distance === 'beside' || mode === 'anchor';
  return <div className={`unhook-field ${beside?'is-beside':''} ${s.defusionStep?'is-noticing':''} ${s.anchorNoticed?'has-anchor':''}`}>
    <svg className="unhook-orbits" viewBox="0 0 400 310" aria-hidden="true"><ellipse cx="200" cy="178" rx="174" ry="98"/><ellipse cx="200" cy="178" rx="116" ry="61"/><path d="M0 271 Q112 178 190 248 T400 202"/><circle cx="328" cy="222" r="3"/></svg>
    <div className="unhook-thought"><span>{s.defusionStep ? `${mindPattern(s.perspective).phrase}…` : !s.notice && s.stage==='arrival' ? 'A thought might sound like…' : 'My mind says…'}</span><p>{s.notice || (s.stage==='arrival' ? 'What if it all goes wrong?' : 'The words I am holding in mind')}</p></div>
    {beside && <div className="unhook-attention"><span>{mode==='anchor'?'Attention returns to':'There is also room for'}</span><p>{s.anchorText || (s.anchorType ? EXTERNAL_ANCHORS[s.anchorType].short : 'the world around me')}</p><i aria-hidden="true"/></div>}
    <div className="unhook-field-label">{beside?'The thought stays. Your attention can move.':'Words your mind is offering.'}</div>
  </div>;
}
export function FeelingVisual({ s, mode = 'feeling' }) {
  const space = s.allowance || (mode==='intro'?'small':null);
  return <div className={`room-field ${space?'has-space':''} ${space==='more'?'has-more-space':''} ${s.attentionFocused?'is-anchored':''}`}>
    <div className="room-rings" aria-hidden="true"><i/><i/><i/></div>
    <div className="room-feeling"><svg viewBox="0 0 150 150" aria-hidden="true"><path d="M73 19 C118 16 140 50 129 83 C122 122 93 139 58 123 C21 110 13 76 29 49 C39 27 48 19 73 19Z"/></svg><span>{s.notice || 'A feeling'}</span></div>
    <div className="room-field-label">{s.allowance ? 'Room for the feeling. It does not have to change.' : 'Notice only as much as feels workable.'}</div>
    {s.anchorType && <div className="room-anchor"><i aria-hidden="true"/><span>{s.attentionFocused?'Attention with':'Stay connected to'}</span><strong>{s.anchorText || EXTERNAL_ANCHORS[s.anchorType].short}</strong></div>}
  </div>;
}
