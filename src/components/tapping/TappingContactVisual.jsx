import { useEffect, useRef, useState } from 'react';
import { TAPPING_ARTWORK } from './tappingArtwork';

/** The marker and photograph always share the same source-image coordinates. */
export default function TappingContactVisual({ point, overview = false, paused = false, quiet = false, beat = 0, onArtworkStatus }) {
  const [status, setStatus] = useState('loading');
  const artwork = TAPPING_ARTWORK[overview ? 'sideEye' : point.id];
  const { x, y } = artwork;
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
  return <svg className={`tap-silhouette tap-contact-portrait ${overview ? 'tap-photo-overview' : active ? 'tap-alive' : 'tap-still'}`} viewBox={overview ? '0 150 1024 1160' : artwork.frame} role="img" aria-label={overview ? 'Relaxed adult with natural skin and warm light' : `${status === 'error' ? 'Image unavailable.' : 'Two fingertips resting here.'} ${artwork.placement} Either side is fine.`}>
    {status !== 'error' && <image href={`/media/tapping/${artwork.file}`} x="0" y="0" width="1024" height="1536"/>}
    {!overview && status === 'loaded' && <g className="tap-point" data-point={point.id} data-image-x={x} data-image-y={y}>
      <circle cx={x} cy={y} r="31" fill="#163c38" fillOpacity=".22"/>
      <circle key={`ripple-${beat}`} className="tap-ripple" cx={x} cy={y} r="28" fill="none" stroke="#f4d299" strokeWidth="2"/>
      <circle cx={x} cy={y} r="16" fill="none" stroke="#fff2d8" strokeWidth="2.5"/>
      <circle key={`core-${beat}`} className="tap-point-core" cx={x} cy={y} r="4.5" fill="#fff7e6"/>
    </g>}
  </svg>;
}
