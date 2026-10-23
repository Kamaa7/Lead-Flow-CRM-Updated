import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function TestConnection() {
  const [status, setStatus] = useState('Testing connection...');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test database connection
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);

        if (dbError) throw dbError;
        
        // Test authentication
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: 'demo@example.com',
          password: 'password',
        });

        if (authError) throw authError;

        setStatus('✅ Connection successful!');
        console.log('Supabase data:', { data, authData });
      } catch (err) {
        setError(err.message);
        console.error('Connection error:', err);
      }
    }

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>Supabase Connection Test</h2>
      <p>Status: {status}</p>
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {error}
        </div>
      )}
    </div>
  );
}
