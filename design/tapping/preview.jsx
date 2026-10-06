import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import TappingExperience from '../../src/components/tapping/TappingExperience';
function Preview() {
  const [outcome, setOutcome] = React.useState(null);
  const failOnce = React.useRef(new URLSearchParams(location.search).has('failCompletion'));
  function complete(result) { if (failOnce.current) { failOnce.current = false; throw new Error('Preview failure test'); } setOutcome(result); }
  return outcome ? <div style={{ color:'#ece2d2',padding:32,fontFamily:'sans-serif' }}><h1>Preview complete</h1><pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(outcome,null,2)}</pre><button onClick={()=>setOutcome(null)}>Start again</button></div> : <TappingExperience silent={new URLSearchParams(location.search).has('silent')} onComplete={complete} onExit={()=>setOutcome({exited:true})} onChangeCourse={result=>setOutcome({...result,changeCourse:true})}/>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><Preview/></BrowserRouter>);
