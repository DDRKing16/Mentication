// Dear 2100 — flow order and phase metadata, mirroring FLOW_DATA from the
// locked design (app.jsx). Screen components are real, data-bound ports;
// see src/components/dear2100/*.

import { S00_Welcome } from '@/components/dear2100/Opening';
import { S01_Discovery } from '@/components/dear2100/Discovery';
import {
  S03_BarriersIntro, S04_BarriersTriedBefore, S05_SelfTalkWatching, S06_Verdict,
  S07_BodyCost, S08_Success, S09_Fear, S10_Voice,
} from '@/components/dear2100/Barriers';
import {
  S11_LifeNow, S13_Future20, S14_RadicalAcceptance, S15_Evolution,
  S16_Safety, S17_Override, S18_TurningPoint, S19_Awareness,
} from '@/components/dear2100/PerspectiveShift';
import { S20_Values, S21_ValuesInAction, S22_Charter } from '@/components/dear2100/InternalFramework';
import { S23_Toolkit, S24_Pathway } from '@/components/dear2100/Coping';
import { S25_SmallestAction, S25b_ActionPlan, S26_Commit, S26b_PathwayRevisited, S27_ActionDone } from '@/components/dear2100/Action';
import { S28_Alignment, S29_Evidence, S29b_Pride, S29c_PrideScared, S30_Book, S31_Export } from '@/components/dear2100/Reflection';
import { S32_Complete } from '@/components/dear2100/Close';

export const FLOW_DATA = [
  { id: '00', phase: 0, phaseLabel: 'Opening', title: 'Welcome', dark: false, C: S00_Welcome },
  { id: '01', phase: 1, phaseLabel: 'Discovery', title: 'Discovery', dark: false, C: S01_Discovery },
  { id: '03', phase: 2, phaseLabel: 'Barriers', title: 'Barriers Intro', dark: true, C: S03_BarriersIntro },
  { id: '04', phase: 2, phaseLabel: 'Barriers', title: 'Stopping You + Tried Before', dark: false, C: S04_BarriersTriedBefore },
  { id: '05', phase: 2, phaseLabel: 'Barriers', title: 'Self-Talk + Who’s Watching', dark: false, C: S05_SelfTalkWatching },
  { id: '06', phase: 2, phaseLabel: 'Barriers', title: 'The Imagined Verdict', dark: false, C: S06_Verdict },
  { id: '07', phase: 2, phaseLabel: 'Barriers', title: 'Body Feeling + Cost of Going', dark: false, C: S07_BodyCost },
  { id: '08', phase: 2, phaseLabel: 'Barriers', title: 'What Success Would Mean', dark: false, C: S08_Success },
  { id: '09', phase: 2, phaseLabel: 'Barriers', title: 'The Deepest Fear', dark: false, C: S09_Fear },
  { id: '10', phase: 2, phaseLabel: 'Barriers', title: 'Whose Voice', dark: false, C: S10_Voice },
  { id: '11', phase: 3, phaseLabel: 'Perspective Shift', title: 'Future Self · Right Now', dark: false, C: S11_LifeNow },
  { id: '13', phase: 3, phaseLabel: 'Perspective Shift', title: 'Future Self · 20 Years', dark: true, C: S13_Future20 },
  { id: '14', phase: 3, phaseLabel: 'Perspective Shift', title: 'Radical Acceptance', dark: false, C: S14_RadicalAcceptance },
  { id: '15', phase: 3, phaseLabel: 'Perspective Shift', title: 'Evolutionary Model', dark: false, C: S15_Evolution },
  { id: '16', phase: 3, phaseLabel: 'Perspective Shift', title: 'Safety Behaviours', dark: false, C: S16_Safety },
  { id: '17', phase: 3, phaseLabel: 'Perspective Shift', title: 'Override · Pause', dark: false, C: S17_Override },
  { id: '18', phase: 3, phaseLabel: 'Perspective Shift', title: 'Brain Science · Turning Point', dark: true, C: S18_TurningPoint },
  { id: '19', phase: 3, phaseLabel: 'Perspective Shift', title: 'Awareness', dark: false, C: S19_Awareness },
  { id: '20', phase: 4, phaseLabel: 'Internal Framework', title: 'Values Compass', dark: false, C: S20_Values },
  { id: '21', phase: 4, phaseLabel: 'Internal Framework', title: 'Values in Action', dark: false, C: S21_ValuesInAction },
  { id: '22', phase: 4, phaseLabel: 'Internal Framework', title: 'Charter', dark: false, C: S22_Charter },
  { id: '23', phase: 5, phaseLabel: 'Coping', title: 'Your Toolkit', dark: false, C: S23_Toolkit },
  { id: '24', phase: 5, phaseLabel: 'Coping', title: 'The Pattern · Pathway', dark: true, C: S24_Pathway },
  { id: '25', phase: 6, phaseLabel: 'Action', title: 'Smallest Action · Questions', dark: false, C: S25_SmallestAction },
  { id: '25b', phase: 6, phaseLabel: 'Action', title: 'Smallest Action · Your Plan', dark: false, C: S25b_ActionPlan },
  { id: '26', phase: 6, phaseLabel: 'Action', title: 'Commit', dark: false, C: S26_Commit },
  { id: '26b', phase: 6, phaseLabel: 'Action', title: 'The Pattern · Revisited', dark: true, C: S26b_PathwayRevisited },
  { id: '27', phase: 6, phaseLabel: 'Action', title: 'Action Done', dark: true, C: S27_ActionDone },
  { id: '28', phase: 7, phaseLabel: 'Reflection', title: 'Alignment', dark: false, C: S28_Alignment },
  { id: '29', phase: 7, phaseLabel: 'Reflection', title: 'Evidence', dark: false, C: S29_Evidence },
  { id: '29b', phase: 7, phaseLabel: 'Reflection', title: 'Proudest Moments', dark: false, C: S29b_Pride },
  { id: '29c', phase: 7, phaseLabel: 'Reflection', title: 'The Pattern', dark: false, C: S29c_PrideScared },
  { id: '30', phase: 7, phaseLabel: 'Reflection', title: 'Your 2100 Book', dark: false, C: S30_Book },
  { id: '31', phase: 7, phaseLabel: 'Reflection', title: 'Export', dark: false, C: S31_Export },
  { id: '32', phase: 8, phaseLabel: 'Close', title: 'Complete', dark: true, C: S32_Complete },
];
