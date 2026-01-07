'use client';

import { useState, useEffect } from 'react';

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
};

const sectionStyle: React.CSSProperties = {
  background: '#1a1a24',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '20px',
  border: '1px solid #2a2a3a',
};

const audioItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  background: '#0a0a14',
  borderRadius: '8px',
  marginBottom: '12px',
};

const uploadFormStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr auto auto',
  gap: '16px',
  alignItems: 'end',
  marginBottom: '24px',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 24px',
  background: '#ffc864',
  border: 'none',
  borderRadius: '8px',
  color: '#0a0a14',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: '500',
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '6px 16px',
  background: 'transparent',
  border: '1px solid #ff4444',
  borderRadius: '6px',
  color: '#ff4444',
  fontSize: '12px',
  cursor: 'pointer',
};

const activeBadgeStyle: React.CSSProperties = {
  padding: '4px 12px',
  background: 'rgba(76, 175, 80, 0.2)',
  borderRadius: '4px',
  color: '#4caf50',
  fontSize: '12px',
};

const inactiveBadgeStyle: React.CSSProperties = {
  padding: '4px 12px',
  background: 'rgba(255, 152, 0, 0.2)',
  borderRadius: '4px',
  color: '#ff9800',
  fontSize: '12px',
};

interface AudioAsset {
  id: string;
  type: string;
  arousal: string;
  storage_path: string;
  source: string;
  original_text: string;
  is_active: boolean;
  created_at: string;
  url: string;
}

export default function AudioManagementPage() {
  const [audioList, setAudioList] = useState<AudioAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});

  // 表单状态
  const [file, setFile] = useState<File | null>(null);
  const [arousal, setArousal] = useState<'low' | 'mid' | 'high'>('mid');
  const [note, setNote] = useState('');

  useEffect(() => {
    loadAudioList();
  }, []);

  const loadAudioList = async () => {
    try {
      const response = await fetch('/api/admin/audio');
      const data = await response.json();

      if (data.items) {
        setAudioList(data.items);
      }
    } catch (error) {
      console.error('Failed to load audio list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('arousal', arousal);
      formData.append('note', note);

      const response = await fetch('/api/admin/audio', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setFile(null);
        setNote('');
        loadAudioList();
      }
    } catch (error) {
      console.error('Failed to upload audio:', error);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个音频吗？')) return;

    try {
      const response = await fetch(`/api/admin/audio?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadAudioList();
      }
    } catch (error) {
      console.error('Failed to delete audio:', error);
      alert('删除失败，请重试');
    }
  };

  const handleGenerate = async (arousal: 'low' | 'mid' | 'high') => {
    if (!confirm(`确定要生成 ${arousal} 清醒度的音频吗？\n\n这将需要调用 AI 和 TTS 服务，可能需要几秒钟。`)) {
      return;
    }

    setGenerating({ ...generating, [arousal]: true });

    try {
      const response = await fetch('/api/admin/audio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arousal }),
      });

      const data = await response.json();

      if (data.success) {
        alert('音频生成已开始，请稍后刷新列表查看');

        // 3秒后刷新列表
        setTimeout(loadAudioList, 3000);
      } else {
        alert(data.error || '生成失败，请检查 API 配置');
      }
    } catch (error) {
      console.error('Failed to generate audio:', error);
      alert('生成失败，请检查 API 配置');
    } finally {
      setGenerating({ ...generating, [arousal]: false });
    }
  };

  const arousalLabel: Record<string, string> = {
    low: '低清醒度',
    mid: '中清醒度',
    high: '高清醒度',
  };

  const groupedAudio = audioList.reduce((acc, audio) => {
    if (!acc[audio.arousal]) {
      acc[audio.arousal] = [];
    }
    acc[audio.arousal].push(audio);
    return acc;
  }, {} as Record<string, AudioAsset[]>);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '300' }}>
          音频资产管理
        </h1>
        <a
          href="/admin"
          style={{
            padding: '10px 20px',
            background: '#2a2a3a',
            borderRadius: '8px',
            color: '#999',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          返回管理端
        </a>
      </div>

      {/* 上传表单 */}
      <section style={sectionStyle}>
        <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '400' }}>
          上传音频
        </h2>
        <form onSubmit={handleUpload} style={uploadFormStyle}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '8px' }}>
              音频文件
            </label>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0a0a14',
                border: '1px solid #2a2a3a',
                borderRadius: '6px',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '8px' }}>
              清醒度
            </label>
            <select
              value={arousal}
              onChange={(e) => setArousal(e.target.value as 'low' | 'mid' | 'high')}
              style={{
                width: '100%',
                padding: '10px',
                background: '#0a0a14',
                border: '1px solid #2a2a3a',
                borderRadius: '6px',
                color: '#fff',
              }}
            >
              <option value="low">低清醒度</option>
              <option value="mid">中清醒度</option>
              <option value="high">高清醒度</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '8px' }}>
              备注
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="选填"
              style={{
                width: '100%',
                padding: '10px',
                background: '#0a0a14',
                border: '1px solid #2a2a3a',
                borderRadius: '6px',
                color: '#fff',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            style={{
              ...buttonStyle,
              opacity: !file || uploading ? 0.5 : 1,
              cursor: !file || uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {uploading ? '上传中...' : '上传'}
          </button>
        </form>
      </section>

      {/* AI 生成 */}
      <section style={sectionStyle}>
        <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: '400' }}>
          AI 生成音频
        </h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(['low', 'mid', 'high'] as const).map((ar) => (
            <button
              key={ar}
              onClick={() => handleGenerate(ar)}
              disabled={generating[ar]}
              style={{
                ...buttonStyle,
                background: generating[ar] ? '#666' : '#2a2a3a',
                color: '#fff',
              }}
            >
              {generating[ar] ? '生成中...' : `生成 ${arousalLabel[ar]}`}
            </button>
          ))}
        </div>
      </section>

      {/* 音频列表 */}
      {loading ? (
        <p style={{ color: '#666' }}>加载中...</p>
      ) : (
        <>
          {['low', 'mid', 'high'].map((arousalLevel) => (
            <section key={arousalLevel} style={sectionStyle}>
              <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#ffc864' }}>
                {arousalLabel[arousalLevel]}
              </h3>

              {!groupedAudio[arousalLevel] || groupedAudio[arousalLevel].length === 0 ? (
                <p style={{ color: '#666', fontSize: '14px' }}>暂无音频</p>
              ) : (
                groupedAudio[arousalLevel].map((audio) => (
                  <div key={audio.id} style={audioItemStyle}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                        {audio.original_text || '无文本'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(audio.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {audio.is_active ? (
                        <span style={activeBadgeStyle}>生效中</span>
                      ) : (
                        <span style={inactiveBadgeStyle}>未生效</span>
                      )}

                      <audio controls src={audio.url} style={{ width: '200px', height: '32px' }} />

                      <button
                        onClick={() => handleDelete(audio.id)}
                        style={deleteButtonStyle}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>
          ))}
        </>
      )}
    </div>
  );
}
