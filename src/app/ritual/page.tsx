'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#050505',
  padding: '20px',
  position: 'relative',
};

const lightDotStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  background: '#ffc864',
  boxShadow: '0 0 20px rgba(255, 200, 100, 0.5)',
  cursor: 'pointer',
  userSelect: 'none',
  transition: 'all 0.3s ease',
};

const rippleStyle = (progress: number): React.CSSProperties => ({
  position: 'absolute',
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  border: '2px solid rgba(255, 200, 100, 0.8)',
  transform: `scale(${1 + progress * 15})`,
  opacity: 1 - progress,
  pointerEvents: 'none',
  transition: 'none',
});

export default function RitualPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const arousal = searchParams.get('arousal') as 'low' | 'mid' | 'high' || 'mid';

  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const requiredDuration = 2000; // 2秒

  const startPress = () => {
    if (completed) return;

    setIsPressing(true);
    startTimeRef.current = Date.now();
    animateProgress();
  };

  const animateProgress = () => {
    const now = Date.now();
    const elapsed = now - startTimeRef.current;
    const newProgress = Math.min(elapsed / requiredDuration, 1);

    setProgress(newProgress);

    if (newProgress >= 1) {
      handleComplete();
    } else {
      animationFrameRef.current = requestAnimationFrame(animateProgress);
    }
  };

  const stopPress = () => {
    if (completed) return;

    setIsPressing(false);
    setProgress(0);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const handleComplete = () => {
    setCompleted(true);

    // 延迟 1 秒后跳转（让动画完成）
    timerRef.current = setTimeout(() => {
      router.push(`/presence?arousal=${arousal}`);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <main style={pageStyle}>
      {progress > 0 && !completed && (
        <div style={rippleStyle(progress)} />
      )}

      <div
        style={{
          ...lightDotStyle,
          opacity: completed ? 0.2 :1,
          transform: completed ? 'scale(0)' : isPressing ? 'scale(1.2)' : 'scale(1)',
        }}
        onMouseDown={startPress}
        onMouseUp={stopPress}
        onMouseLeave={stopPress}
        onTouchStart={(e) => {
          e.preventDefault();
          startPress();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          stopPress();
        }}
      />
    </main>
  );
}
