'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validatePassword, validateUsername, validateEmail } from '@/lib/auth';
import { getSession } from '@/lib/server-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

function getSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey);
}

export interface RegisterResult {
  success: boolean;
  error?: string;
}

export async function register(
  username: string,
  email: string,
  password: string
): Promise<RegisterResult> {
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) {
    return { success: false, error: usernameValidation.error };
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return { success: false, error: emailValidation.error };
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { success: false, error: passwordValidation.error };
  }

  const supabase = getSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });

  if (authError) {
    console.error('Auth signup failed:', authError);
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: '注册失败，请稍后重试' };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login failed:', error);
    return { success: false, error: '邮箱或密码错误' };
  }

  if (data.session) {
    const cookieStore = cookies();
    cookieStore.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    cookieStore.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function logout(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');
  redirect('/login');
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session?.user) return null;

  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('mp_users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return data;
}