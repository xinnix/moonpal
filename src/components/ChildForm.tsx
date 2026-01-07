'use client';

import { useState } from 'react';
import { PRESET_AVATARS } from '@/lib/auth';
import { ChildInput } from '@/app/actions/children';

interface ChildFormProps {
  onSubmit: (child: ChildInput) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  initialData?: Partial<ChildInput>;
}

const formStyle: React.CSSProperties = {
  background: '#252540',
  borderRadius: '16px',
  padding: '24px',
  marginTop: '20px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '500',
  color: '#f5f5f5',
  marginBottom: '20px',
};

const fieldStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  color: '#888',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '8px',
  border: '1px solid #333',
  background: '#1a1a2e',
  color: '#f5f5f5',
  fontSize: '16px',
  outline: 'none',
  boxSizing: 'border-box',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const genderButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
};

const genderButtonStyle = (selected: boolean, gender: string): React.CSSProperties => ({
  flex: 1,
  padding: '12px',
  borderRadius: '8px',
  border: selected ? `2px solid #ffc864` : '1px solid #333',
  background: selected ? 'rgba(255, 200, 100, 0.1)' : '#1a1a2e',
  color: selected ? '#ffc864' : '#888',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s',
});

const avatarGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(6, 1fr)',
  gap: '8px',
};

const avatarOptionStyle = (selected: boolean): React.CSSProperties => ({
  aspectRatio: '1',
  borderRadius: '8px',
  border: selected ? '2px solid #ffc864' : '2px solid transparent',
  background: '#1a1a2e',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  transition: 'all 0.2s',
});

const buttonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginTop: '24px',
};

const cancelButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  borderRadius: '8px',
  border: '1px solid #444',
  background: 'transparent',
  color: '#888',
  fontSize: '16px',
  cursor: 'pointer',
};

const submitButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '14px',
  borderRadius: '8px',
  border: 'none',
  background: '#ffc864',
  color: '#1a1a2e',
  fontSize: '16px',
  fontWeight: '500',
  cursor: 'pointer',
};

const PRESET_INTERESTS = [
  '恐龙', '太空', '动物', '绘画', '音乐', '阅读',
  '运动', '积木', '赛车', '公主', '超级英雄', '自然',
];

export function ChildForm({ onSubmit, onCancel, initialData }: ChildFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [age, setAge] = useState(initialData?.age?.toString() || '');
  const [gender, setGender] = useState<'boy' | 'girl' | undefined>(initialData?.gender);
  const [avatar, setAvatar] = useState(initialData?.avatar || PRESET_AVATARS[0]);
  const [interests, setInterests] = useState<string[]>(initialData?.interests || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (interest: string) => {
    setInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, interest];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('请输入孩子昵称');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        name: name.trim(),
        age: age ? parseInt(age, 10) : undefined,
        gender,
        avatar,
        interests: interests.length > 0 ? interests : undefined,
      });
    } catch (err) {
      setError('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form style={formStyle} onSubmit={handleSubmit}>
      <div style={titleStyle}>{initialData ? '编辑孩子' : '添加孩子'}</div>
      
      {error && (
        <div style={{
          padding: '10px',
          background: 'rgba(255, 100, 100, 0.1)',
          border: '1px solid rgba(255, 100, 100, 0.3)',
          borderRadius: '8px',
          color: '#ff8888',
          fontSize: '14px',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}
      
      <div style={fieldStyle}>
        <label style={labelStyle}>昵称</label>
        <input
          type="text"
          placeholder="孩子昵称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          required
          maxLength={20}
        />
      </div>
      
      <div style={rowStyle}>
        <div style={{ ...fieldStyle, flex: 1 }}>
          <label style={labelStyle}>年龄</label>
          <input
            type="number"
            placeholder="年龄"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            style={inputStyle}
            min={1}
            max={18}
          />
        </div>
        
        <div style={{ ...fieldStyle, flex: 1 }}>
          <label style={labelStyle}>性别</label>
          <div style={genderButtonsStyle}>
            <button
              type="button"
              style={genderButtonStyle(gender === 'boy', 'boy')}
              onClick={() => setGender(gender === 'boy' ? undefined : 'boy')}
            >
              男孩
            </button>
            <button
              type="button"
              style={genderButtonStyle(gender === 'girl', 'girl')}
              onClick={() => setGender(gender === 'girl' ? undefined : 'girl')}
            >
              女孩
            </button>
          </div>
        </div>
      </div>
      
      <div style={fieldStyle}>
        <label style={labelStyle}>头像</label>
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
      
      <div style={fieldStyle}>
        <label style={labelStyle}>爱好（最多3个）</label>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}>
          {PRESET_INTERESTS.map((interest) => {
            const selected = interests.includes(interest);
            return (
              <button
                key={interest}
                type="button"
                style={{
                  padding: '8px 14px',
                  borderRadius: '16px',
                  border: selected ? '2px solid #ffc864' : '1px solid #333',
                  background: selected ? 'rgba(255, 200, 100, 0.1)' : '#1a1a2e',
                  color: selected ? '#ffc864' : '#888',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>
      
      <div style={buttonsStyle}>
        <button
          type="button"
          style={cancelButtonStyle}
          onClick={onCancel}
          disabled={loading}
        >
          取消
        </button>
        <button
          type="submit"
          style={{
            ...submitButtonStyle,
            opacity: loading ? 0.6 : 1,
          }}
          disabled={loading}
        >
          {loading ? '保存中...' : '保存'}
        </button>
      </div>
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