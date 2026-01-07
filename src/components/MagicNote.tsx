'use client';

import { useState } from 'react';

interface MagicNoteProps {
  onSubmit: (note: string) => void;
  isPaid: boolean;
  disabled?: boolean;
}

const FREE_TAGS = [
  '月亮',
  '星星',
  '森林',
  '大海',
  '云朵',
  '萤火虫',
];

export function MagicNote({ onSubmit, isPaid, disabled }: MagicNoteProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState('');

  const handleSubmit = () => {
    const note = isPaid && customInput ? customInput : (selectedTag || '');
    if (note) {
      onSubmit(note);
      setSelectedTag(null);
      setCustomInput('');
    }
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px', 
        justifyContent: 'center',
        marginBottom: isPaid ? '16px' : '0',
      }}>
        {FREE_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            disabled={disabled}
            style={{
              padding: '8px 16px',
              border: selectedTag === tag ? '2px solid #ffc864' : '1px solid #ddd',
              borderRadius: '20px',
              background: selectedTag === tag ? '#fff8e6' : '#fff',
              color: '#666',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {tag}
          </button>
        ))}
      </div>

      {isPaid && (
        <>
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value.slice(0, 20))}
            placeholder="想对我说的话（限20字）"
            disabled={disabled}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '14px',
              textAlign: 'center',
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || (!selectedTag && !customInput)}
            style={{
              width: '100%',
              padding: '12px',
              background: customInput || selectedTag ? '#ffc864' : '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              color: customInput || selectedTag ? '#fff' : '#999',
              cursor: disabled || (!selectedTag && !customInput) ? 'not-allowed' : 'pointer',
              fontSize: '16px',
            }}
          >
            记住这个
          </button>
        </>
      )}
    </div>
  );
}
