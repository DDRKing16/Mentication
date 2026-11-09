import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { BuildingResetScreen, ResetOverview } from './ResetSetupScreens';
vi.mock('@/lib/utils',()=>({cn:(...values)=>values.filter(Boolean).join(' '),isIframe:false}));
const overview=immediate=>renderToStaticMarkup(<MemoryRouter><ResetOverview answers={{immediate,direction:'calm',directionLabel:'Calm down',timeMin:5}} pathway={[{id:'test',name:'Test practice',durationMin:3}]} setAnswers={()=>{}} onBegin={()=>{}} /></MemoryRouter>);
describe('honest quick-start copy',()=>{
 it('describes defaults as suggestions rather than supplied answers',()=>{const html=overview(true);expect(html).toContain('suggested calm practice');expect(html).toContain('Choose my goal and time');expect(html).toContain('href="/start"');expect(html).not.toContain('You chose');expect(html).not.toContain('based on your answers');});
 it('retains explanation after a real check-in',()=>{expect(overview(false)).toContain('You chose Calm down');});
 it('uses neutral preparation copy',()=>{expect(renderToStaticMarkup(<BuildingResetScreen/>)).toContain('Preparing a starting practice');});
});
