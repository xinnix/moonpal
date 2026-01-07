'use client';

import { useState, useEffect, useCallback } from 'react';
import { Child } from '@/lib/supabase';
import { getChildren, addChild, deleteChild, ChildInput } from '@/app/actions/children';
import { ChildCard } from './ChildCard';
import { ChildForm } from './ChildForm';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px 20px',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '480px',
  width: '100%',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '32px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: '300',
  color: '#ffc864',
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#888',
};

const gridStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px 24px',
  background: '#252540',
  borderRadius: '16px',
};

const emptyTextStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#888',
  marginBottom: '24px',
};

const addButtonStyle: React.CSSProperties = {
  padding: '14px 28px',
  borderRadius: '8px',
  border: '2px dashed #444',
  background: 'transparent',
  color: '#888',
  fontSize: '16px',
  cursor: 'pointer',
  transition: 'all 0.2s',
};

const selectTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '400',
  color: '#f5f5f5',
  marginBottom: '16px',
  textAlign: 'center',
};

const logoutButtonStyle: React.CSSProperties = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid #333',
  borderRadius: '8px',
  color: '#666',
  fontSize: '14px',
  cursor: 'pointer',
};

interface ChildManagerProps {
  userId: string;
  mode?: 'manage' | 'select';
  onSelect?: (child: Child) => void;
}

export function ChildManager({ userId, mode = 'manage', onSelect }: ChildManagerProps) {
  const [children, setChildren] = useState<Child[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const loadChildren = useCallback(async () => {
    try {
      const data = await getChildren(userId);
      setChildren(data);
    } catch (error) {
      console.error('Failed to load children:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAdd = async (childData: ChildInput) => {
    const result = await addChild(userId, childData);
    if (result.success) {
      await loadChildren();
      setShowForm(false);
      setSuccessMessage('添加成功');
      setTimeout(() => setSuccessMessage(null), 2000);
    }
    return result;
  };

  const handleDelete = async (childId: string) => {
    if (confirm('确定要删除这个孩子吗？')) {
      const result = await deleteChild(childId);
      if (result.success) {
        await loadChildren();
        setSuccessMessage('已删除');
        setTimeout(() => setSuccessMessage(null), 2000);
      }
    }
  };

  const handleSelect = (child: Child) => {
    if (mode === 'select' && onSelect) {
      onSelect(child);
    } else {
      setSelectedChildId(child.id === selectedChildId ? null : child.id);
    }
  };

  if (loading) {
    return (
      <div style={{ ...pageStyle, justifyContent: 'center' }}>
        <div style={{ color: '#888' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {mode === 'manage' && (
        <button
          style={logoutButtonStyle}
          onClick={() => {
            if (confirm('确定要退出登录吗？')) {
              window.location.href = '/login';
            }
          }}
        >
          退出登录
        </button>
      )}

      <div style={containerStyle}>
        {successMessage && (
          <div style={{
            padding: '12px 20px',
            background: 'rgba(100, 255, 150, 0.1)',
            border: '1px solid rgba(100, 255, 150, 0.3)',
            borderRadius: '8px',
            color: '#88ffaa',
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: '16px',
          }}>
            {successMessage}
          </div>
        )}
        
        <div style={headerStyle}>
          <h1 style={titleStyle}>
            {mode === 'select' ? '选择孩子' : '我的孩子'}
          </h1>
          {mode === 'manage' && (
            <p style={subtitleStyle}>
              {children.length === 0
                ? '添加孩子后开始陪伴之旅'
                : `已添加 ${children.length}/3 个孩子`}
            </p>
          )}
        </div>

        {children.length === 0 ? (
          <div style={emptyStyle}>
            <p style={emptyTextStyle}>
              {mode === 'select' ? '还没有添加孩子' : '还没有添加任何孩子'}
            </p>
            {mode === 'manage' && (
              <button
                style={addButtonStyle}
                onClick={() => setShowForm(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ffc864';
                  e.currentTarget.style.color = '#ffc864';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#444';
                  e.currentTarget.style.color = '#888';
                }}
              >
                添加孩子
              </button>
            )}
          </div>
        ) : (
          <>
            {mode === 'select' && (
              <div style={selectTitleStyle}>
                点击选择要陪伴的孩子
              </div>
            )}
            
            <div style={gridStyle}>
              {children.map((child) => (
                <ChildCard
                  key={child.id}
                  child={child}
                  onDelete={() => handleDelete(child.id)}
                  onSelect={() => handleSelect(child)}
                  selectable={true}
                  selected={selectedChildId === child.id}
                />
              ))}
            </div>

            {mode === 'manage' && children.length < 3 && (
              <button
                style={{
                  ...addButtonStyle,
                  marginTop: '16px',
                  width: '100%',
                }}
                onClick={() => setShowForm(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ffc864';
                  e.currentTarget.style.color = '#ffc864';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#444';
                  e.currentTarget.style.color = '#888';
                }}
              >
                + 添加孩子
              </button>
            )}
          </>
        )}

        {showForm && (
          <ChildForm
            onSubmit={handleAdd}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </div>
  );
}