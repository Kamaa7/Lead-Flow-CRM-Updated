import { supabase } from '../supabaseClient';

// Function to create a demo user if it doesn't exist
export async function ensureDemoUser() {
  const demoEmail = 'demo@example.com';
  const demoPassword = 'password';
  
  try {
    // Try to sign in the demo user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    });
    
    if (!signInError) {
      console.log('Demo user already exists');
      return { success: true, user: signInData.user };
    }
    
    // If sign in fails, create a new demo user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: {
        data: {
          full_name: 'Demo User',
          is_demo: true
        }
      }
    });
    
    if (signUpError) throw signUpError;
    
    console.log('Demo user created successfully');
    return { success: true, user: signUpData.user };
    
  } catch (error) {
    console.error('Error ensuring demo user:', error);
    return { success: false, error };
  }
}

// Call this function when your app loads
// ensureDemoUser().then(console.log);
