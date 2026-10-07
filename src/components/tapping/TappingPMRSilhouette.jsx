import { useEffect, useId, useRef } from 'react';
import { TAPPING_ARTWORK } from './tappingArtwork';
import TappingHandDemonstration, { demonstrationSide } from './TappingHandDemonstration';

// Reuse the existing PMR figure unchanged, with locations registered to its pixels.
export const TAPPING_BODY_ASSET = '/media/images/pmr-body-neutral-cutout.png';
export const SILHOUETTE_POINTS = {
  hand: { x: 234, y: 832, frame: '130 710 205 285' },
  crown: { x: 469, y: 89, frame: '275 45 390 505' },
  brow: { x: 450, y: 178, frame: '320 55 300 405' },
  sideEye: { x: 416, y: 192, frame: '315 55 300 405' },
  underEye: { x: 443, y: 211, frame: '320 55 300 405' },
  nose: { x: 469, y: 225, frame: '320 55 300 405' },
  chin: { x: 469, y: 247, frame: '320 55 300 405' },
  collar: { x: 433, y: 350, frame: '215 205 510 605' },
  arm: { x: 367, y: 565, frame: '185 285 520 700' },
};

export default function TappingPMRSilhouette({ point, paused = true, quiet = false, overview = false, beat = 0, beatMs = 600, onArtworkStatus, onRhythmStart }) {
  const id = useId().replace(/:/g, '');
  const location = SILHOUETTE_POINTS[point.id];
  const callbacks = useRef({ onArtworkStatus, onRhythmStart });
  callbacks.current = { onArtworkStatus, onRhythmStart };
  useEffect(() => {
    const image = new Image();
    image.onload = () => callbacks.current.onArtworkStatus?.(point.id, 'loaded');
    image.onerror = () => callbacks.current.onArtworkStatus?.(point.id, 'error');
    image.src = TAPPING_BODY_ASSET;
    return () => { image.onload = null; image.onerror = null; };
  }, [point.id]);
  const pulsing = !paused && !quiet;
  const face = ['brow', 'sideEye', 'underEye', 'nose', 'chin'].includes(point.id);
  return <svg className="tap-motion-visual tap-pmr-silhouette" viewBox={overview ? '90 30 760 1060' : location.frame}
    role="img" aria-label={`${point.name}. ${TAPPING_ARTWORK[point.id].placement} The light marks the place to tap. Either side is fine.`}
    data-point={point.id} data-source="pmr-body-neutral" data-contact-x={location.x} data-contact-y={location.y}>
    <defs>
      <radialGradient id={`${id}-field`}><stop stopColor="#90c5a9" stopOpacity=".19"/><stop offset="1" stopColor="#497565" stopOpacity="0"/></radialGradient>
      <radialGradient id={`${id}-point`}><stop stopColor="#f7ddb0" stopOpacity=".64"/><stop offset=".35" stopColor="#dbbf88" stopOpacity=".21"/><stop offset="1" stopColor="#e7d1a1" stopOpacity="0"/></radialGradient>
      <mask id={`${id}-body`} style={{ maskType: 'alpha' }}><image href={TAPPING_BODY_ASSET} width="941" height="1672"/></mask>
      <filter id={`${id}-join`}><feGaussianBlur stdDeviation="5"/></filter>
      <mask id={`${id}-pose`}><rect width="941" height="1672" fill="white"/><path d="M0 420H335L352 505L340 680L290 1020H0Z" fill="black" filter={`url(#${id}-join)`} transform={demonstrationSide(point.id) === 'right' ? 'translate(941 0) scale(-1 1)' : undefined}/></mask>
    </defs>
    <ellipse cx="469" cy="440" rx="390" ry="580" fill={`url(#${id}-field)`}/>
    <image className="tap-pmr-body" href={TAPPING_BODY_ASSET} width="941" height="1672" mask={overview ? undefined : `url(#${id}-pose)`}/>
    {face && <g className="tap-face-landmarks" fill="none" stroke="#add0ba" strokeWidth="1.1" strokeLinecap="round" aria-hidden="true">
      <path d="M424 180Q437 175 450 179M488 179Q501 175 514 180M427 194Q439 189 450 194M488 194Q500 189 511 194"/>
      <path d="M468 190L464 214Q469 219 475 215M459 234Q469 236 479 234M458 247Q469 251 480 247"/>
    </g>}
    <g mask={`url(#${id}-body)`} aria-hidden="true"><circle cx={location.x} cy={location.y} r={point.id === 'hand' ? 68 : 54} fill={`url(#${id}-point)`}/></g>
    <g className={`tap-contact-target ${pulsing ? 'is-tapping' : ''}`} data-beat={beat} data-motion={quiet ? 'still' : paused ? 'rest' : 'light-contact-rest'}
      style={{ '--tap-cycle': `${beatMs}ms`, transformOrigin: `${location.x}px ${location.y}px` }}
      aria-hidden="true">
      <circle cx={location.x} cy={location.y} r="17" fill="none" stroke="#ead09f" strokeWidth="1.5"/>
      <circle cx={location.x} cy={location.y} r="8" fill="#f2d6a3" fillOpacity=".15"/>
      <circle cx={location.x} cy={location.y} r="3.5" fill="#f8e2b9"/>
    </g>
    {!overview && <TappingHandDemonstration point={point} location={location} id={id} paused={paused} quiet={quiet} beat={beat} beatMs={beatMs} onRhythmStart={(...args) => callbacks.current.onRhythmStart?.(...args)}/>}
  </svg>;
}
