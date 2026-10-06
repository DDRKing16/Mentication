import React from 'react';
import {BrandLockup} from '@/components/brand/BrandLockup';
import {getBrandAtmosphere,getBrandInk,getBrandLogoParts} from '@/lib/interventionBrand';
import {practiceTimeLabel} from '@/lib/practiceDiscovery';
export default function SelectedPracticeContext({practice}) {
  if(!practice)return null;
  const world=getBrandAtmosphere(practice.id);
  return <section className="selected-practice-context" aria-label="The practice you chose" style={{background:world.background,color:getBrandInk(practice.id)}}>
    <div><p className="selected-practice-context__eyebrow">The practice you chose</p><h2>{practice.name}</h2><p className="selected-practice-context__time">{practiceTimeLabel(practice)}</p></div>
    <BrandLockup parts={getBrandLogoParts(practice.id)} className="selected-practice-context__mark" />
  </section>;
}
