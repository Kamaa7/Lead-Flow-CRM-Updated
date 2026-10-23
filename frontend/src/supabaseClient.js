import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://lgwcylgzwejbcglcoqae.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnd2N5bGd6d2VqYmNnbGNvcWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjMwNzMsImV4cCI6MjA2ODMzOTA3M30.yniGM_7_it3uNvl9T_SA70Y4oNGwXtjyM_lcPOL6Nv0';

// Create supabase client for regular operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Function to get the current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Function to sign out
export const signOut = async () => {
  await supabase.auth.signOut();
};