import {useCallback} from 'react';
import {useNavigate} from 'react-router-dom';
import {appBackTarget} from '@/lib/appBack';
export function useAppBack(fallback='/') {
  const navigate=useNavigate();
  return useCallback(()=>navigate(appBackTarget(window.history.state,fallback)),[navigate,fallback]);
}
