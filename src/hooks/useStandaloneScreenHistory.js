import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bindJourneyScreenHistory } from '@/lib/journeyScreenHistory';

const CONFIG = {
  nightChannel:{screens:['source','file','timer','listening'],cursors:[],exit:'/library'},
  foundations:{screens:['intro','scan','snapshot','choices','dose','plan','cue','time','saved','review','review-effort','review-help','learned','finish'],cursors:['q'],exit:'/restructure'},
  dear2100:{screens:['stage-1','stage-2','stage-3','stage-4','stage-5','stage-6','stage-7','stage-8','stage-9','2:kind','2:prediction','2:practicalNote','2:other-barriers','4:practicalSupport','4:behavior','4:cost','5:horizon','5:roads','6:values','6:valueAction','6:judgment','8:action','8:day','8:time','8:minutes','8:ifThen','8:budget','8:likelihood','8:discomfort','8:goalState','8:evidenceLookFor','threat-visual','threat:0','threat:1','threat:2','threat:3','threat:score','outcome:observed','outcome:result','outcome:actualDiscomfort','outcome:afterLikelihood','outcome:goalStateAfter','outcome:learned','outcome:next'],cursors:['stage'],exit:'/library'},
};

export function useStandaloneScreenHistory(frame, id) {
  const navigate=useNavigate();
  const [historyError,setHistoryError]=useState('');
  useEffect(()=>{
    const config=CONFIG[id];
    if (!config) return;
    return bindJourneyScreenHistory({id,getFrame:()=>frame.current,onExit:()=>navigate(config.exit),onError:setHistoryError,screenIds:config.screens,cursorNames:config.cursors});
  },[frame,id,navigate]);
  return historyError;
}
