import { useRef } from 'react';
import { createProgressGate } from '@/lib/practiceInteraction';
export function useProgressGate() {
  const gate = useRef(null);
  if (!gate.current) gate.current = createProgressGate();
  return gate.current;
}
