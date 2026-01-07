'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/app/actions/auth';
import { PRESET_AVATARS } from '@/lib/auth';

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

const avatarGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '12px',
  marginTop: '8px',
};

const avatarOptionStyle = (selected: boolean): React.CSSProperties => ({
  aspectRatio: '1',
  borderRadius: '12px',
  border: selected ? '2px solid #ffc864' : '2px solid transparent',
  background: '#252540',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '32px',
  transition: 'all 0.2s',
});

const labelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#888',
  marginBottom: '4px',
};

export function RegisterForm() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState<string>(PRESET_AVATARS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);

    try {
      const result = await register(username, email, password);
      if (result.success) {
        router.push('/children');
      } else {
        setError(result.error || '注册失败');
      }
    } catch {
      setError('注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form style={formStyle} onSubmit={handleSubmit}>
      <h1 style={titleStyle}>Moon Pal</h1>
      
      {error && <div style={errorStyle}>{error}</div>}
      
      <div>
        <label style={labelStyle}>用户名</label>
        <input
          type="text"
          placeholder="2-20个字符，支持字母、数字、下划线"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
          minLength={2}
          maxLength={20}
        />
      </div>
      
      <div>
        <label style={labelStyle}>邮箱</label>
        <input
          type="email"
          placeholder="用于登录和找回密码"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
        />
      </div>
      
      <div>
        <label style={labelStyle}>密码</label>
        <input
          type="password"
          placeholder="至少8位，包含数字和字母"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
          minLength={8}
        />
      </div>
      
      <div>
        <label style={labelStyle}>确认密码</label>
        <input
          type="password"
          placeholder="请再次输入密码"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={inputStyle}
          required
          disabled={loading}
        />
      </div>
      
      <div>
        <label style={labelStyle}>选择头像</label>
        <div style={avatarGridStyle}>
          {PRESET_AVATARS.map((avatarOption) => (
            <div
              key={avatarOption}
              style={avatarOptionStyle(avatar === avatarOption)}
              onClick={() => setAvatar(avatarOption)}
              role="button"
              tabIndex={0}
            >
              {getAvatarEmoji(avatarOption)}
            </div>
          ))}
        </div>
      </div>
      
      <button 
        type="submit" 
        style={{ ...buttonStyle, opacity: loading ? 0.6 : 1, marginTop: '8px' }}
        disabled={loading}
      >
        {loading ? '注册中...' : '注册'}
      </button>
      
      <p style={linkStyle}>
        已有账号？<a href="/login" style={linkTextStyle}>立即登录</a>
      </p>
    </form>
  );
}

function getAvatarEmoji(avatar: string): string {
  const emojis: Record<string, string> = {
    'moon-bear': '🐻',
    'star-rabbit': '🐰',
    'cloud-cat': '🐱',
    'sun-puppy': '🐶',
    'dream-fox': '🦊',
    'sleepy-panda': '🐼',
  };
  return emojis[avatar] || '🐾';
}