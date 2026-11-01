import { useEffect, useState } from 'react';
import { wellnessController } from '@/lib/wellness/controller';

export function useWellness() {
  const [wellness, setWellness] = useState(() => wellnessController.read());
  useEffect(() => {
    const unsubscribe = wellnessController.subscribe(setWellness);
    const refresh = () => wellnessController.read().sources.forEach(source => {
      if (source.status !== 'setup') void wellnessController.run('status', source.id);
    });
    refresh();
    window.addEventListener('focus', refresh);
    return () => { unsubscribe(); window.removeEventListener('focus', refresh); };
  }, []);
  return { wellness, onWellnessAction: ({ action, provider, consent }) => wellnessController.run(action, provider, consent) };
}
