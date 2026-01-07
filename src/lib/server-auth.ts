'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

function getCookie(name: string): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(name)?.value;
}

export async function getSession() {
  const accessToken = getCookie('sb-access-token');
  const refreshToken = getCookie('sb-refresh-token');

  if (!accessToken || !refreshToken) {
    return null;
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });

  const { data: { session }, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error('Session error:', error);
    return null;
  }

  return session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function requireAuth() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/login');
  }

  return { userId: session.user.id };
}

export async function signOut() {
  const cookieStore = cookies();
  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');
  redirect('/login');
}

export async function signInWithPassword(email: string, password: string) {
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { error };
}

export async function signUp(email: string, password: string, username: string) {
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
    },
  });
  return { data, error };
}