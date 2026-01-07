'use client';

import { useState, useCallback } from 'react';

export function useEnergyDisc() {
  const [energy, setEnergy] = useState(0.5);

  const updateEnergy = useCallback((value: number) => {
    setEnergy(Math.max(0, Math.min(1, value)));
  }, []);

  return { energy, updateEnergy };
}
