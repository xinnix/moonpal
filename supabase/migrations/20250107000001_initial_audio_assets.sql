-- 初始化通用陪伴音频资产（使用固定文本）
-- 后续可以通过管理端上传音频替换

-- 清理旧数据
DELETE FROM audio_assets WHERE type = 'general';

-- 低清醒度音频
INSERT INTO audio_assets (type, arousal, storage_path, source, original_text, version, is_active, note)
VALUES (
  'general',
  'low',
  'general/low/narrative-initial.mp3',
  'upload',
  '夜晚到了。一切都很安静。很安静。我在这里。',
  1,
  TRUE,
  '初始预置音频'
);

-- 中清醒度音频
INSERT INTO audio_assets (type, arousal, storage_path, source, original_text, version, is_active, note)
VALUES (
  'general',
  'mid',
  'general/mid/narrative-initial.mp3',
  'upload',
  '一天慢慢过去了。房间很安静。我在这里，陪着你。什么都不用做，只是在这里。',
  1,
  TRUE,
  '初始预置音频'
);

-- 高清醒度音频
INSERT INTO audio_assets (type, arousal, storage_path, source, original_text, version, is_active, note)
VALUES (
  'general',
  'high',
  'general/high/narrative-initial.mp3',
  'upload',
  '我在这里，陪着你。一天慢慢过去了，身体可以慢慢放松。肩膀可以放松下来，呼吸可以慢一些。一切都很安静。',
  1,
  TRUE,
  '初始预置音频'
);
