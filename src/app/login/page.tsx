'use client';

import { useEffect, useState } from 'react';
import { LoginForm } from '@/components';
import { isSupabaseConfigured } from '@/lib/supabase';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  background: '#1a1a2e',
};

const errorBoxStyle: React.CSSProperties = {
  maxWidth: '400px',
  padding: '24px',
  background: 'rgba(255, 200, 100, 0.05)',
  border: '1px solid rgba(255, 200, 100, 0.2)',
  borderRadius: '12px',
  textAlign: 'center',
};

const errorTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  color: '#ffc864',
  marginBottom: '16px',
};

const errorTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#888',
  lineHeight: '1.6',
};

export default function LoginPage() {
  const [configured, setConfigured] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setConfigured(isSupabaseConfigured());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main style={pageStyle}>
        <div style={{ color: '#888' }}>加载中...</div>
      </main>
    );
  }

  if (!configured) {
    return (
      <main style={pageStyle}>
        <div style={errorBoxStyle}>
          <h2 style={errorTitleStyle}>需要配置 Supabase</h2>
          <p style={errorTextStyle}>
            请在 .env.local 文件中配置：
            <br /><br />
            NEXT_PUBLIC_SUPABASE_URL=你的项目URL
            <br />
            NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon key
            <br /><br />
            当前 URL: {typeof window !== 'undefined' ? window.location.origin : ''}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <LoginForm />
    </main>
  );
}