'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EnergyDisc } from '@/components';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#050505',
  padding: '20px',
};

export default function EnergyPage() {
  const router = useRouter();
  const [energy, setEnergy] = useState(0.5);

  useEffect(() => {
    // 3秒无操作自动进入下一页
    const timer = setTimeout(() => {
      router.push(`/ritual?arousal=${energyToArousal(energy)}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [energy, router]);

  const energyToArousal = (value: number): 'low' | 'mid' | 'high' => {
    if (value < 0.33) return 'low';
    if (value < 0.67) return 'mid';
    return 'high';
  };

  const handleConfirm = () => {
    router.push(`/ritual?arousal=${energyToArousal(energy)}`);
  };

  return (
    <main style={pageStyle}>
      <div style={{ textAlign: 'center' }}>
        <EnergyDisc
          value={energy}
          onChange={setEnergy}
          size={280}
        />
      </div>
    </main>
  );
}
