import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// 获取音频列表
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('audio_assets')
      .select('*')
      .eq('type', 'general')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // 获取所有音频的公共 URL
    const audioWithUrls = await Promise.all(
      (data || []).map(async (audio) => {
        const { data: { publicUrl } } = supabase.storage
          .from('audio')
          .getPublicUrl(audio.storage_path);

        return {
          ...audio,
          url: publicUrl,
        };
      })
    );

    return NextResponse.json({ items: audioWithUrls });
  } catch (error) {
    console.error('Failed to get audio list:', error);
    return NextResponse.json(
      { error: 'Failed to get audio list' },
      { status: 500 }
    );
  }
}

// 上传音频
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const arousal = formData.get('arousal') as 'low' | 'mid' | 'high';
    const note = formData.get('note') as string;

    if (!file || !arousal) {
      return NextResponse.json(
        { error: 'Missing required fields: file, arousal' },
        { status: 400 }
      );
    }

    if (!['low', 'mid', 'high'].includes(arousal)) {
      return NextResponse.json(
        { error: 'Invalid arousal value' },
        { status: 400 }
      );
    }

    // 上传文件到 Storage
    const fileName = `general/${arousal}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, file, {
        contentType: file.type || 'audio/mpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // 先将现有的该清醒度的音频设为非激活
    await supabase
      .from('audio_assets')
      .update({ is_active: false })
      .eq('type', 'general')
      .eq('arousal', arousal)
      .eq('is_active', true);

    // 插入新的音频资产记录
    const { data, error } = await supabase
      .from('audio_assets')
      .insert({
        type: 'general',
        arousal,
        storage_path: fileName,
        source: 'upload',
        original_text: note || '',
        version: 1,
        is_active: true,
        note,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create audio asset:', error);
      return NextResponse.json(
        { error: 'Failed to create audio asset' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to upload audio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 删除音频
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // 获取音频信息
    const { data: audio, error: fetchError } = await supabase
      .from('audio_assets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !audio) {
      return NextResponse.json(
        { error: 'Audio not found' },
        { status: 404 }
      );
    }

    // 删除文件
    const { error: deleteFileError } = await supabase.storage
      .from('audio')
      .remove([audio.storage_path]);

    if (deleteFileError) {
      console.error('Failed to delete file:', deleteFileError);
    }

    // 删除数据库记录
    const { error } = await supabase
      .from('audio_assets')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete audio:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
