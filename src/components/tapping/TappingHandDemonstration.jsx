import { useEffect, useLayoutEffect, useRef } from 'react';
import { observeTappingAnimationStart } from './tappingAnimationEpoch';

const useAnimationEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const POSES = {
  hand: { angle: -95, scale: .9, side: 'right', elbow: [540, 700] },
  crown: { angle: 65, scale: .85, side: 'left', elbow: [285, 175] },
  brow: { angle: 105, scale: .8, side: 'left', elbow: [235, 320] },
  sideEye: { angle: 75, scale: .8, side: 'left', elbow: [220, 340] },
  underEye: { angle: 85, scale: .8, side: 'left', elbow: [225, 340] },
  nose: { angle: 95, scale: .75, side: 'left', elbow: [230, 335] },
  chin: { angle: 100, scale: .8, side: 'left', elbow: [235, 350] },
  collar: { angle: 85, scale: .9, side: 'left', elbow: [245, 480] },
  arm: { angle: -75, scale: .9, side: 'right', elbow: [670, 570] },
};
export const demonstrationSide = point => POSES[point].side;

function armContour(shoulder, elbow, wrist, width) {
  const edges = [[], []];
  // A continuous curved arm avoids a sharp sleeve-like elbow or detached limb.
  for (let i = 0; i <= 64; i++) {
    const t = i / 64, u = 1 - t;
    const x = u * u * shoulder[0] + 2 * u * t * elbow[0] + t * t * wrist[0];
    const y = u * u * shoulder[1] + 2 * u * t * elbow[1] + t * t * wrist[1];
    const dx = 2 * u * (elbow[0] - shoulder[0]) + 2 * t * (wrist[0] - elbow[0]);
    const dy = 2 * u * (elbow[1] - shoulder[1]) + 2 * t * (wrist[1] - elbow[1]);
    const norm = Math.hypot(dx, dy) || 1, radius = 27 + (width - 27) * t;
    edges[0].push([x - dy / norm * radius, y + dx / norm * radius]);
    edges[1].push([x + dy / norm * radius, y - dx / norm * radius]);
  }
  return 'M' + [...edges[0], ...edges[1].reverse()].map(p => p.map(n => n.toFixed(2)).join(' ')).join('L') + 'Z';
}

export default function TappingHandDemonstration({ point, location, id, paused, quiet, beat, beatMs, onRhythmStart }) {
  const pose = POSES[point.id], radians = pose.angle * Math.PI / 180;
  const wrist = [location.x - Math.sin(radians) * 82 * pose.scale, location.y + Math.cos(radians) * 82 * pose.scale];
  const shoulder = pose.side === 'right' ? [601, 385] : [340, 385];
  const active = !paused && !quiet;
  const rig = useRef(null), callback = useRef(onRhythmStart);
  callback.current = onRhythmStart;
  useAnimationEffect(() => {
    if (active && rig.current) observeTappingAnimationStart(rig.current, epoch => callback.current?.(epoch));
  }, [active, beatMs, point.id]);
  return <g className="tap-hand-demonstration" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}-jade-hand`} x1="0" y1="0" x2="1" y2=".6"><stop stopColor="#173f3b"/><stop offset=".34" stopColor="#28564b"/><stop offset=".72" stopColor="#0b302d"/><stop offset="1" stopColor="#497b63"/></linearGradient>
      <radialGradient id={`${id}-shoulder-join`} gradientUnits="userSpaceOnUse" cx={shoulder[0]} cy={shoulder[1]} r="48"><stop stopColor="black"/><stop offset=".35" stopColor="black"/><stop offset="1" stopColor="white"/></radialGradient>
      <mask id={`${id}-arm-join`}><rect width="941" height="1672" fill="white"/><circle cx={shoulder[0]} cy={shoulder[1]} r="48" fill={`url(#${id}-shoulder-join)`}/></mask>
    </defs>
    <path className="tap-demonstration-arm" mask={`url(#${id}-arm-join)`} d={armContour(shoulder, pose.elbow, wrist, pose.scale * 11)} fill={`url(#${id}-jade-hand)`} stroke="#80b69b" strokeOpacity=".45" strokeWidth="1.1" strokeLinejoin="round"/>
    <g transform={`translate(${location.x} ${location.y}) rotate(${pose.angle}) scale(${pose.scale})`}>
      <g transform="translate(0 82)"><g ref={rig} className={`tap-finger-rig ${active ? 'is-tapping' : ''}`} data-beat={beat} data-motion={quiet ? 'still' : paused ? 'rest' : 'approach-contact-lift'} style={{ '--tap-cycle': `${beatMs}ms` }} onAnimationStart={event => {
          if (event.animationName === 'tap-wrist-contact') observeTappingAnimationStart(event.currentTarget, epoch => callback.current?.(epoch));
        }}>
        <g transform="translate(-5 -86)" fill={`url(#${id}-jade-hand)`} stroke="#8cbaa0" strokeOpacity=".6" strokeWidth=".8" strokeLinejoin="round">
          <path d="M-11 87L-16 63C-23 55-25 42-22 36C-19 31-14 34-11 40L-6 48L-6 31Q5 27 13 33L22 30L28 39C36 39 38 43 36 51C35 61 25 69 12 76L13 88Z"/>
          <g transform="translate(8 34)"><g className={`tap-knuckle-motion ${active ? 'is-tapping' : ''}`} style={{ '--tap-cycle': `${beatMs}ms` }}><g transform="translate(-8 -34)">
            <path d="M-6 34L-8 21C-9 11-12 4-8 0C-5-3 1-2 3 3L11 30L8 39Z"/>
            <path d="M13 37L7 8C5 1 9-5 14-3C19-2 19 6 21 12L28 39Z"/>
            <path d="M-8 1Q-4-1 0 4L2 10Q-3 13-7 8ZM9 0Q13-3 16 2L18 9Q13 12 10 8Z" fill="#487862" strokeOpacity=".4"/>
            <path d="M-6 21L5 19M10 23L24 19" fill="none" strokeOpacity=".3"/>
          </g></g></g>
          <path d="M-10 49Q-15 41-20 39M-6 65Q-2 72 9 73" fill="none" strokeOpacity=".35"/>
        </g>
      </g></g>
    </g>
  </g>;
}
