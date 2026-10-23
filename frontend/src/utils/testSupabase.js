import { createClient } from '@supabase/supabase-js';

// Initialize the client with your Supabase URL and public anon key
const supabase = createClient(
  'https://lgwcylgzwejbcglcoqae.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnd2N5bGd6d2VqYmNnbGNvcWFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjMwNzMsImV4cCI6MjA2ODMzOTA3M30.yniGM_7_it3uNvl9T_SA70Y4oNGwXtjyM_lcPOL6Nv0'
);

async function testSupabase() {
  console.log('Testing Supabase connection...');
  
  // Test 1: Check if we can connect to the database
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (error) throw error;
    console.log('✅ Successfully connected to Supabase!');
    console.log('Sample data:', data);
  } catch (error) {
    console.error('❌ Error connecting to Supabase:', error.message);
  }
  
  // Test 2: Try to sign in with a test user
  try {
    console.log('\nTesting authentication...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'demo@example.com',
      password: 'password',
    });
    
    if (error) throw error;
    console.log('✅ Successfully authenticated!');
    console.log('User:', data.user);
    
    // Sign out after test
    await supabase.auth.signOut();
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    
    // If user doesn't exist, try to create one
    if (error.message.includes('Invalid login credentials')) {
      console.log('\nCreating test user...');
      try {
        const { data, error } = await supabase.auth.signUp({
          email: 'demo@example.com',
          password: 'password',
          options: {
            data: {
              full_name: 'Demo User',
              is_demo: true
            }
          }
        });
        
        if (error) throw error;
        console.log('✅ Test user created! Please check your email to verify.');
      } catch (signupError) {
        console.error('❌ Error creating test user:', signupError.message);
      }
    }
  }
}

// Run the test
testSupabase();
