import {useCallback,useEffect,useRef,useState} from 'react';
import {sessionStore} from '@/lib/localData';
import {subscribeDeviceSessions} from '@/lib/deviceSessionEvents';
export function useDeviceSessions(limit=100) {
  const [sessions,setSessions]=useState([]),[ready,setReady]=useState(false),[error,setError]=useState('');
  const request=useRef(0);
  const reload=useCallback(async()=>{
    const current=++request.current;
    try {
      const next=await sessionStore.list('-created_date',limit);
      if(current===request.current){setSessions(next);setError('');setReady(true);}
    }catch{
      if(current===request.current){setError('Your local history could not be read. Try again; nothing has been removed.');setReady(true);}
    }
  },[limit]);
  useEffect(()=>{
    void reload();const unsubscribe=subscribeDeviceSessions(reload);
    return ()=>{request.current+=1;unsubscribe();};
  },[reload]);
  return {sessions,ready,error,reload};
}
