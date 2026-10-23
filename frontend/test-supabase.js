const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  'https://lgwcylgzwejbcglcoqae.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnd2N5bGd6d2VqYmNnbGNvcWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjMwNzMsImV4cCI6MjA2ODMzOTA3M30.yniGM_7_it3uNvl9T_SA70Y4oNGwXtjyM_lcPOL6Nv0',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

async function testSupabase() {
  console.log('Testing Supabase connection...');
  
  // Test sign up
  console.log('\n1. Testing sign up...');
  const email = `test${Math.floor(Math.random() * 10000)}@example.com`;
  const password = 'password123';
  
  try {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (signUpError) throw signUpError;
    console.log('✅ Sign up successful!');
    
    // Test sign in
    console.log('\n2. Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) throw signInError;
    console.log('✅ Sign in successful!');
    console.log('User ID:', signInData.user.id);
    
    // Test getting session
    console.log('\n3. Testing get session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) throw sessionError;
    console.log('✅ Session retrieved successfully!');
    
    // Test sign out
    console.log('\n4. Testing sign out...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) throw signOutError;
    console.log('✅ Sign out successful!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSupabase();
