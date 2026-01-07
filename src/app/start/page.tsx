'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#050505',
  padding: '20px',
};

const loadingStyle: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  background: '#ffc864',
  animation: 'pulse 2s ease-in-out infinite',
};

export default function StartPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/energy');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main style={pageStyle}>
      <div style={loadingStyle} />
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </main>
  );
}
