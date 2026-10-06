import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import Tara from '../../src/components/tara-tactician/TaraTacticianExperience';
import '@/index.css';
import '@/styles/app-surfaces.css';
import '@/styles/intervention-experiences.css';
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/hanken-grotesk/latin-400.css';
import '@fontsource/hanken-grotesk/latin-600.css';

window.taraReviewEvents = [];
createRoot(document.getElementById('root')).render(<BrowserRouter><Tara
  onAttemptEvent={event => window.taraReviewEvents.push(event)}
  onComplete={result => { window.taraReviewEvents.push(result); document.getElementById('root').innerHTML = '<p role="status">Review flow finished.</p>'; }}
  onExit={() => { document.getElementById('root').innerHTML = '<p role="status">Review flow exited. Draft remains available on refresh.</p>'; }}
/></BrowserRouter>);
