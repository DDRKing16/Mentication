import { useEffect, useRef, useState } from 'react';
import { TAPPING_ARTWORK } from './tappingArtwork';

/** The marker and photograph always share the same source-image coordinates. */
export default function TappingContactVisual({ point, overview = false, paused = false, quiet = false, beat = 0, onArtworkStatus }) {
  const visual = useRef(null);
  const [scale, setScale] = useState(1);
  const [status, setStatus] = useState('loading');
  const artwork = TAPPING_ARTWORK[overview ? 'sideEye' : point.id];
  const { x, y } = artwork;
  const frame = overview ? '0 150 1024 1160' : artwork.frame;
  useEffect(() => {
    const svg = visual.current;
    const [, , width, height] = frame.split(' ').map(Number);
    const measure = () => {
      const box = svg.getBoundingClientRect();
      const next = Math.min(box.width / width, box.height / height);
      if (next > 0) setScale(next);
    };
    measure();
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    observer?.observe(svg);
    return () => observer?.disconnect();
  }, [frame]);
  const active = !paused && !quiet;
  const pointId = point?.id;
  const statusCallback = useRef(onArtworkStatus);
  statusCallback.current = onArtworkStatus;
  useEffect(() => {
    let current = true;
    const photo = new Image();
    const report = next => { if (current) { setStatus(next); statusCallback.current?.(pointId, next); } };
    photo.onload = () => report('loaded');
    photo.onerror = () => report('error');
    photo.src = `/media/tapping/${artwork.file}`;
    return () => { current = false; photo.onload = null; photo.onerror = null; };
  }, [artwork.file, pointId]);
  return <svg ref={visual} className={`tap-silhouette tap-contact-portrait ${overview ? 'tap-photo-overview' : active ? 'tap-alive' : 'tap-still'}`} viewBox={frame} role="img" aria-label={overview ? 'Relaxed adult with natural skin and warm light' : `${status === 'error' ? 'Image unavailable.' : 'Two fingertips resting here.'} ${artwork.placement} Either side is fine.`}>
    {status !== 'error' && <image href={`/media/tapping/${artwork.file}`} x="0" y="0" width="1024" height="1536"/>}
    {!overview && status === 'loaded' && <g className="tap-point" data-point={point.id} data-image-x={x} data-image-y={y}>
      <circle cx={x} cy={y} r={15 / scale} fill="#123834" fillOpacity=".16"/>
      <circle key={`ripple-${beat}`} className="tap-ripple" cx={x} cy={y} r={14 / scale} fill="none" stroke="#f4d299" strokeWidth="1.1" vectorEffect="non-scaling-stroke"/>
      <circle cx={x} cy={y} r={9 / scale} fill="none" stroke="#ffe6b3" strokeWidth="1.4" vectorEffect="non-scaling-stroke"/>
      <circle key={`core-${beat}`} className="tap-point-core" cx={x} cy={y} r={2 / scale} fill="#fff0d3"/>
    </g>}
  </svg>;
}
