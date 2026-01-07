'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface StatItem {
  label: string;
  value: number;
  change?: string;
}

interface DailyStat {
  date: string;
  count: number;
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [totalSessions, todaySessions, weekSessions, monthSessions] = await Promise.all([
        supabase.from('mp_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('mp_sessions').select('id', { count: 'exact', head: true }).eq('created_at', `>=${today}`),
        supabase.from('mp_sessions').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),
        supabase.from('mp_sessions').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo),
      ]);

      setStats([
        { label: '总陪伴次数', value: totalSessions.count || 0 },
        { label: '今日陪伴', value: todaySessions.count || 0 },
        { label: '本周陪伴', value: weekSessions.count || 0 },
        { label: '本月陪伴', value: monthSessions.count || 0 },
      ]);

      const { data: dailyData } = await supabase
        .from('mp_sessions')
        .select('created_at')
        .gte('created_at', monthAgo)
        .order('created_at', { ascending: true });

      if (dailyData) {
        const grouped: Record<string, number> = {};
        dailyData.forEach((item) => {
          const date = item.created_at.split('T')[0];
          grouped[date] = (grouped[date] || 0) + 1;
        });
        
        const chartData = Object.entries(grouped).map(([date, count]) => ({
          date,
          count,
        }));
        setDailyStats(chartData);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }

    setLoading(false);
  };

  const maxCount = Math.max(...dailyStats.map(d => d.count), 1);

  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontWeight: '300' }}>使用统计</h2>

      {loading ? (
        <p style={{ color: '#666' }}>加载中...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
            {stats.map((stat, index) => (
              <div
                key={index}
                style={{
                  padding: '20px',
                  background: '#1a1a24',
                  borderRadius: '12px',
                  border: '1px solid #2a2a3a',
                }}
              >
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '32px', fontWeight: '300', color: '#ffc864' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1a1a24', borderRadius: '12px', padding: '20px', border: '1px solid #2a2a3a' }}>
            <h3 style={{ margin: '0 0 20px', fontWeight: '400', fontSize: '16px' }}>
              近30天陪伴趋势
            </h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '150px' }}>
              {dailyStats.slice(-30).map((item, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${(item.count / maxCount) * 100}px`,
                      background: '#ffc864',
                      borderRadius: '2px 2px 0 0',
                      minHeight: '2px',
                    }}
                    title={`${item.date}: ${item.count}次`}
                  />
                  {index % 5 === 0 && (
                    <span style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                      {item.date.slice(5)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
