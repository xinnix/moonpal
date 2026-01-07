import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const arousal = searchParams.get('arousal') as 'low' | 'mid' | 'high';

    if (!arousal || !['low', 'mid', 'high'].includes(arousal)) {
      return NextResponse.json(
        { error: 'Invalid arousal parameter' },
        { status: 400 }
      );
    }

    // 查询可播放音频
    const { data, error } = await supabase
      .from('audio_assets')
      .select('*')
      .eq('type', 'general')
      .eq('arousal', arousal)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      // 查询不到时返回通用兜底音频（取任意清醒度的音频）
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('audio_assets')
        .select('*')
        .eq('type', 'general')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fallbackError || !fallbackData) {
        return NextResponse.json(
          { error: 'No available audio' },
          { status: 404 }
        );
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audio')
        .getPublicUrl(fallbackData.storage_path);

      return NextResponse.json({
        url: publicUrl,
        arousal: fallbackData.arousal,
        text: fallbackData.original_text,
      });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('audio')
      .getPublicUrl(data.storage_path);

    return NextResponse.json({
      url: publicUrl,
      arousal: data.arousal,
      text: data.original_text,
    });
  } catch (error) {
    console.error('Failed to get audio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
