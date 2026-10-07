import React from 'react';
import { ArrowRight } from 'lucide-react';
import { getBrandAtmosphere, getBrandInk, getBrandLogoParts } from '@/lib/interventionBrand';
import { PRACTICE_PREVIEWS, practiceDuration } from '@/lib/practiceDiscovery';

export default function PracticePreview({ practice, onBegin, label = 'Explore this practice' }) {
  const world = getBrandAtmosphere(practice.id);
  const parts = getBrandLogoParts(practice.id);
  return <section className="discovery-preview" style={{ background: `radial-gradient(ellipse at top right, ${world.glow}, transparent 75%), ${world.background}`, color: getBrandInk(practice.id) }}>
    <div className="discovery-preview-top"><span className="discovery-eyebrow">A place to begin</span><span>{practiceDuration(practice)}</span></div>
    <span className="discovery-lockup" aria-hidden="true" style={{ aspectRatio: String(parts.aspect) }}>
      {['doorway', 'wordmark', 'swash'].map(part => <img key={part} src={parts[part].src} alt="" style={{ left: `${parts[part].left}%`, top: `${parts[part].top}%`, width: `${parts[part].width}%`, height: `${parts[part].height}%` }} />)}
    </span>
    <h2>{practice.name}</h2>
    <p>{PRACTICE_PREVIEWS[practice.id] || practice.why}</p>
    <button type="button" className="discovery-light-button" onClick={onBegin}>{label}<ArrowRight aria-hidden="true" size={18} /></button>
    <p className="discovery-preview-footnote">You can pause, adapt or leave the practice.</p>
  </section>;
}
