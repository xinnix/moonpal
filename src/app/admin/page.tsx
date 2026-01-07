'use client';

import { useState, useEffect } from 'react';
import { getContentStatistics } from '@/app/actions/admin';

interface StatItem {
  label: string;
  value: number;
  description: string;
  href: string;
}

export default function AdminPage() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await getContentStatistics();
    
    setStats([
      {
        label: '音频资产',
        value: 3,
        description: '低/中/高清醒度音频',
        href: '/v2/admin/audio',
      },
      {
        label: '内容模板',
        value: data.activeTemplates,
        description: `共 ${data.totalTemplates} 个模板，${data.activeTemplates} 个启用`,
        href: '/admin/content',
      },
      {
        label: '标签',
        value: data.totalTags,
        description: 'Magic Note 可选标签',
        href: '/admin/tags',
      },
      {
        label: '在场语句',
        value: data.totalStatements,
        description: '不同能量等级的预设语句',
        href: '/admin/tags',
      },
    ]);
    
    setLoading(false);
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', marginBottom: '30px', fontWeight: '300' }}>
        管理控制台
      </h1>

      {loading ? (
        <p style={{ color: '#666' }}>加载中...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
            {stats.map((stat, index) => (
              <a key={index} href={stat.href} style={{
                display: 'block',
                padding: '30px',
                background: '#1a1a24',
                borderRadius: '12px',
                textDecoration: 'none',
                border: '1px solid #2a2a3a',
              }}>
                <h3 style={{ margin: '0 0 10px', color: '#ffc864', fontSize: '14px' }}>
                  {stat.label}
                </h3>
                <div style={{ fontSize: '36px', fontWeight: '300', marginBottom: '8px' }}>
                  {stat.value}
                </div>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  {stat.description}
                </p>
              </a>
            ))}
          </div>

          <div style={{ background: '#1a1a24', borderRadius: '12px', padding: '24px', border: '1px solid #2a2a3a' }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: '400', fontSize: '16px' }}>
              内容匹配逻辑
            </h3>
            <div style={{ fontSize: '14px', color: '#999', lineHeight: '2' }}>
              <p><strong style={{ color: '#ffc864' }}>1. 模板优先</strong> - 根据用户选择的能量等级和标签匹配预设模板</p>
              <p><strong style={{ color: '#ffc864' }}>2. 在场语句</strong> - 无标签时使用能量等级对应的在场声明</p>
              <p><strong style={{ color: '#ffc864' }}>3. LLM 后备</strong> - 无匹配时调用大模型动态生成</p>
              <p style={{ marginTop: '16px', color: '#666' }}>
                优先级顺序：模板 → 在场语句 → LLM
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
