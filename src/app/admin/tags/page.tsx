'use client';

import { useState, useEffect } from 'react';
import { Tag } from '@/types/admin';
import { get_tags, create_tag, update_tag, delete_tag } from '@/app/actions/admin';

export default function TagsManagement() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', emoji: '', is_premium: false, sort_order: 0 });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    const data = await get_tags();
    setTags(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    
    if (editingTag) {
      result = await update_tag(editingTag.id, formData);
    } else {
      result = await create_tag(formData);
    }

    if (result.success) {
      setShowForm(false);
      setEditingTag(null);
      setFormData({ name: '', emoji: '', is_premium: false, sort_order: 0 });
      loadTags();
    } else {
      alert(editingTag ? '更新失败' : '创建失败' + ': ' + result.error);
    }
  };

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      emoji: tag.emoji || '',
      is_premium: tag.is_premium,
      sort_order: tag.sort_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此标签吗？')) return;
    const result = await delete_tag(id);
    if (result.success) {
      loadTags();
    } else {
      alert('删除失败：' + result.error);
    }
  };

  if (showForm || editingTag) {
    return (
      <div>
        <h2 style={{ marginBottom: '20px', fontWeight: '300' }}>
          {editingTag ? '编辑标签' : '新建标签'}
        </h2>
        <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#999' }}>
              标签名称
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                background: '#1a1a24',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#999' }}>
              Emoji（可选）
            </label>
            <input
              type="text"
              value={formData.emoji}
              onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
              placeholder="🌙"
              style={{
                width: '100%',
                padding: '10px',
                background: '#1a1a24',
                border: '1px solid #333',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.is_premium}
                onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
              />
              <span style={{ color: '#fff' }}>付费标签</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                background: '#ffc864',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              保存
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTag(null);
                setFormData({ name: '', emoji: '', is_premium: false, sort_order: 0 });
              }}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                border: '1px solid #666',
                borderRadius: '8px',
                color: '#999',
                cursor: 'pointer',
              }}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontWeight: '300' }}>标签管理</h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '10px 20px',
            background: '#ffc864',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          新建标签
        </button>
      </div>

      {loading ? (
        <p style={{ color: '#666' }}>加载中...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
          {tags.map((tag) => (
            <div
              key={tag.id}
              style={{
                padding: '16px',
                background: '#1a1a24',
                borderRadius: '8px',
                border: '1px solid #2a2a3a',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>
                {tag.emoji || '🏷️'}
              </div>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>{tag.name}</div>
              {tag.is_premium && (
                <span style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: '#ffc864',
                  borderRadius: '10px',
                  fontSize: '10px',
                  color: '#fff',
                  marginBottom: '8px',
                }}>
                  付费
                </span>
              )}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <button
                  onClick={() => handleEdit(tag)}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: '1px solid #666',
                    borderRadius: '4px',
                    color: '#999',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(tag.id)}
                  style={{
                    padding: '4px 8px',
                    background: 'transparent',
                    border: '1px solid #ff6666',
                    borderRadius: '4px',
                    color: '#ff6666',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
          {tags.length === 0 && (
            <p style={{ color: '#666', textAlign: 'center', padding: '40px', gridColumn: '1 / -1' }}>
              暂无标签，点击新建创建一个
            </p>
          )}
        </div>
      )}
    </div>
  );
}
