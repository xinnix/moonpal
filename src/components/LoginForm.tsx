'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  maxWidth: '320px',
  width: '100%',
};

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '300',
  marginBottom: '8px',
  color: '#ffc864',
  textAlign: 'center',
};

const inputStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: '8px',
  border: '1px solid #333',
  background: '#252540',
  color: '#f5f5f5',
  fontSize: '16px',
  outline: 'none',
  transition: 'border-color 0.2s',
};

const buttonStyle: React.CSSProperties = {
  padding: '14px',
  borderRadius: '8px',
  border: 'none',
  background: '#ffc864',
  color: '#1a1a2e',
  fontSize: '16px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'opacity 0.2s',
};

const linkStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '14px',
  color: '#888',
};

const linkTextStyle: React.CSSProperties = {
  color: '#ffc864',
  textDecoration: 'none',
};

const errorStyle: React.CSSProperties = {
  padding: '12px',
  background: 'rgba(255, 100, 100, 0.1)',
  border: '1px solid rgba(255, 100, 100, 0.3)',
  borderRadius: '8px',
  color: '#ff8888',
  fontSize: '14px',
  textAlign: 'center',
};

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      
      if (!supabaseUrl || !supabaseKey) {
        setError('Supabase 未配置');
        setLoading(false);
        return;
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message || '登录失败');
      } else if (data.session) {
        // Set cookies for server-side auth
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        
        // Force reload and navigate
        window.location.replace('/children');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form style={formStyle} onSubmit={handleSubmit}>
      <h1 style={titleStyle}>Moon Pal</h1>
      
      {error && <div style={errorStyle}>{error}</div>}
      
      <input
        type="email"
        placeholder="邮箱"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={inputStyle}
        required
        disabled={loading}
      />
      
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
        required
        disabled={loading}
      />
      
      <button 
        type="submit" 
        style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }}
        disabled={loading}
      >
        {loading ? '登录中...' : '登录'}
      </button>
      
      <p style={linkStyle}>
        还没有账号？<a href="/register" style={linkTextStyle}>立即注册</a>
      </p>
    </form>
  );
}