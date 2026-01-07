'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#050505',
  padding: '20px',
  position: 'relative',
};

const presenceTextStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: '60px',
  fontSize: '14px',
  color: 'rgba(255, 200, 100, 0.4)',
  letterSpacing: '2px',
  userSelect: 'none',
};

export default function PresencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const arousal = searchParams.get('arousal') as 'low' | 'mid' | 'high' || 'mid';

  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [text, setText] = useState('');

  const audioRef = useRef<HTMLAudioElement>(null);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    fetchAudio();
  }, [arousal]);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('Failed to play audio:', error);
      });
    }
  }, [audioUrl]);

  const fetchAudio = async () => {
    try {
      const response = await fetch(`/api/audio?arousal=${arousal}`);
      const data = await response.json();

      if (data.error) {
        console.error('Failed to fetch audio:', data.error);
        return;
      }

      setAudioUrl(data.url);
      setText(data.text || '我在这里，陪着你。');
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch audio:', error);
    }
  };

  const handlePlay = () => {
    setPlaying(true);
  };

  const handleEnded = () => {
    setEnded(true);
    setPlaying(false);

    // 音频播放结束后，可以继续停留在页面上
    // 不自动跳转，允许孩子随时睡着
  };

  return (
    <main style={pageStyle}>
      {loading && (
        <div style={{ color: 'rgba(255, 200, 100, 0.6)', fontSize: '14px' }}>
          准备中...
        </div>
      )}

      {!loading && (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onPlay={handlePlay}
            onEnded={handleEnded}
            autoPlay
          />

          {playing && !ended && (
            <div style={presenceTextStyle}>
              在这里
            </div>
          )}

          {ended && (
            <div style={presenceTextStyle}>
              晚安
            </div>
          )}

          {/* 只显示极淡的文字，不显示其他元素 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            maxWidth: '300px',
            lineHeight: '2',
            color: 'rgba(255, 200, 100, 0.3)',
            fontSize: '18px',
            letterSpacing: '3px',
          }}>
            {text}
          </div>
        </>
      )}
    </main>
  );
}
