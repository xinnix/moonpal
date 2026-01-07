export interface PasswordValidation {
  valid: boolean;
  error?: string;
}

export function validatePassword(password: string): PasswordValidation {
  if (password.length < 8) {
    return { valid: false, error: '密码至少需要8位' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: '密码需要包含数字' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: '密码需要包含字母' };
  }
  return { valid: true };
}

export function validateUsername(username: string): PasswordValidation {
  if (username.length < 2) {
    return { valid: false, error: '用户名至少需要2个字符' };
  }
  if (username.length > 20) {
    return { valid: false, error: '用户名不能超过20个字符' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: '用户名只能包含字母、数字和下划线' };
  }
  return { valid: true };
}

export function validateEmail(email: string): PasswordValidation {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: '请输入有效的邮箱地址' };
  }
  return { valid: true };
}

export const PRESET_AVATARS = [
  'moon-bear',
  'star-rabbit',
  'cloud-cat',
  'sun-puppy',
  'dream-fox',
  'sleepy-panda',
] as const;

export type PresetAvatar = typeof PRESET_AVATARS[number];