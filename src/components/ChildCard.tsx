'use client';

import { Child } from '@/lib/supabase';
import { PRESET_AVATARS } from '@/lib/auth';

interface ChildCardProps {
  child: Child;
  onDelete: () => void;
  onSelect?: () => void;
  selectable?: boolean;
  selected?: boolean;
}

const cardStyle: React.CSSProperties = {
  background: '#252540',
  borderRadius: '16px',
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  cursor: 'default',
  border: '2px solid transparent',
  transition: 'all 0.2s',
};

const cardSelectableStyle = (selected: boolean): React.CSSProperties => ({
  ...cardStyle,
  cursor: 'pointer',
  border: selected ? '2px solid #ffc864' : '2px solid transparent',
});

const avatarStyle: React.CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  background: '#1a1a2e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '32px',
  flexShrink: 0,
};

const infoStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const nameStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '500',
  color: '#f5f5f5',
  marginBottom: '4px',
};

const detailStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#888',
};

const interestsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap',
  marginTop: '8px',
};

const interestTagStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'rgba(255, 200, 100, 0.1)',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#ffc864',
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid #444',
  borderRadius: '8px',
  color: '#888',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

export function ChildCard({
  child,
  onDelete,
  onSelect,
  selectable = false,
  selected = false,
}: ChildCardProps) {
  const avatarEmoji = child.avatar && PRESET_AVATARS.includes(child.avatar as any)
    ? getAvatarEmoji(child.avatar)
    : '👶';

  const details: string[] = [];
  if (child.age) details.push(`${child.age}岁`);
  if (child.gender) details.push(child.gender === 'boy' ? '男孩' : '女孩');

  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  const cardStyles = selectable ? cardSelectableStyle(selected) : cardStyle;

  return (
    <div style={cardStyles} onClick={handleClick}>
      <div style={avatarStyle}>{avatarEmoji}</div>
      
      <div style={infoStyle}>
        <div style={nameStyle}>{child.name}</div>
        {details.length > 0 && (
          <div style={detailStyle}>{details.join(' · ')}</div>
        )}
        
        {child.interests && child.interests.length > 0 && (
          <div style={interestsStyle}>
            {child.interests.slice(0, 3).map((interest, index) => (
              <span key={index} style={interestTagStyle}>
                {interest}
              </span>
            ))}
            {child.interests.length > 3 && (
              <span style={{ ...interestTagStyle, opacity: 0.6 }}>
                +{child.interests.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {!selectable && (
        <button
          style={deleteButtonStyle}
          onClick={handleDelete}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ff6666';
            e.currentTarget.style.color = '#ff6666';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#444';
            e.currentTarget.style.color = '#888';
          }}
        >
          删除
        </button>
      )}
    </div>
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