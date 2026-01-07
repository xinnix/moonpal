'use client';

import { useState } from 'react';
import { ContentTemplate, ContentType } from '@/types/admin';

interface ContentTemplateFormProps {
  template?: ContentTemplate;
  onSubmit: (data: Partial<ContentTemplate>) => void;
  onCancel: () => void;
}

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'narrative', label: '陪伴叙述' },
  { value: 'greeting', label: '问候语' },
  { value: 'comfort', label: '安慰语' },
];

export function ContentTemplateForm({ template, onSubmit, onCancel }: ContentTemplateFormProps) {
  const [formData, setFormData] = useState({
    title: template?.title || '',
    content: template?.content || '',
    energy_min: template?.energy_min ?? 0,
    energy_max: template?.energy_max ?? 1,
    type: template?.type || 'narrative',
    tags: template?.tags?.join(', ') || '',
    is_active: template?.is_active ?? true,
    sort_order: template?.sort_order ?? 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#999' }}>
          标题
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
          内容
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={4}
          style={{
            width: '100%',
            padding: '10px',
            background: '#1a1a24',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
            resize: 'vertical',
          }}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#999' }}>
            能量最小值 (0-1)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={formData.energy_min}
            onChange={(e) => setFormData({ ...formData, energy_min: parseFloat(e.target.value) })}
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
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#999' }}>
            能量最大值 (0-1)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={formData.energy_max}
            onChange={(e) => setFormData({ ...formData, energy_max: parseFloat(e.target.value) })}
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
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#999' }}>
          类型
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as ContentType })}
          style={{
            width: '100%',
            padding: '10px',
            background: '#1a1a24',
            border: '1px solid #333',
            borderRadius: '8px',
            color: '#fff',
          }}
        >
          {CONTENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', color: '#999' }}>
          标签（逗号分隔）
        </label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="月亮,星星,温柔"
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

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
          />
          <span style={{ color: '#fff' }}>启用</span>
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
          onClick={onCancel}
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
  );
}
