'use client';

import { useRef, useEffect, useState } from 'react';

interface EnergyDiscProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

export function EnergyDisc({ value, onChange, size = 200 }: EnergyDiscProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 220, 150, ${0.2 + value * 0.3})`;
    ctx.fill();

    const indicatorX = centerX + Math.cos(value * Math.PI * 2 - Math.PI / 2) * radius * 0.6;
    const indicatorY = centerY + Math.sin(value * Math.PI * 2 - Math.PI / 2) * radius * 0.6;

    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 200, 100, ${0.6 + value * 0.4})`;
    ctx.fill();
  }, [value, size]);

  const handleInteraction = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    const x = clientX - rect.left - size / 2;
    const y = clientY - rect.top - size / 2;

    let angle = Math.atan2(y, x) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;

    const normalizedValue = angle / (Math.PI * 2);
    onChange(normalizedValue);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        style={{
          cursor: 'pointer',
          touchAction: 'none',
        }}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleInteraction(e);
        }}
        onMouseMove={(e) => {
          if (isDragging) handleInteraction(e);
        }}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleInteraction(e);
        }}
        onTouchMove={(e) => {
          if (isDragging) handleInteraction(e);
        }}
        onTouchEnd={() => setIsDragging(false)}
      />
    </div>
  );
}
