// Photographic design-gate asset; placement is registered in the source image
// coordinate space. Only the standard side-of-eye point is piloted here.
export default function TappingContactVisual({ overview = false, paused = false, quiet = false, beat = 0 }) {
  const active = !paused && !quiet;
  return <svg className={`tap-silhouette tap-contact-portrait ${overview ? 'tap-photo-overview' : active ? 'tap-alive' : 'tap-still'}`} viewBox={overview ? '0 150 1024 1160' : '80 240 880 940'} role="img" aria-label={overview ? 'Relaxed adult with natural skin and warm light' : 'Two fingertips resting on the bone beside the outer corner of the eye. Either side is fine.'}>
    <image href="/media/tapping/side-eye-contact.png" x="0" y="0" width="1024" height="1536"/>
    {!overview && <g className="tap-point" data-point="sideEye" data-image-x="318" data-image-y="604">
      <circle cx="318" cy="604" r="31" fill="#163c38" fillOpacity=".22"/>
      <circle key={`ripple-${beat}`} className="tap-ripple" cx="318" cy="604" r="28" fill="none" stroke="#f4d299" strokeWidth="2"/>
      <circle cx="318" cy="604" r="16" fill="none" stroke="#fff2d8" strokeWidth="2.5"/>
      <circle key={`core-${beat}`} className="tap-point-core" cx="318" cy="604" r="4.5" fill="#fff7e6"/>
    </g>}
  </svg>;
}
