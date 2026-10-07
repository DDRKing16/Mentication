import React from 'react';
import {BrandLockup} from '@/components/brand/BrandLockup';
import {getBrandAtmosphere,getBrandInk,getBrandLogoParts} from '@/lib/interventionBrand';
import {practiceTimeLabel} from '@/lib/practiceDiscovery';
export default function SelectedPracticeContext({practice, label = 'The practice you chose', showTime = true, compact = false}) {
  if(!practice)return null;
  const world=getBrandAtmosphere(practice.id);
  return <section className={`selected-practice-context${compact ? " selected-practice-context--compact" : ""}`} aria-label={label} style={{background:world.background,color:getBrandInk(practice.id)}}>
    <div><p className="selected-practice-context__eyebrow">{label}</p>{compact ? <p className="selected-practice-context__name">{practice.name}</p> : <h2>{practice.name}</h2>}{showTime && <p className="selected-practice-context__time">{practiceTimeLabel(practice)}</p>}</div>
    <BrandLockup parts={getBrandLogoParts(practice.id)} className="selected-practice-context__mark" />
  </section>;
}
