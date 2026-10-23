import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function TestConnection() {
  const [status, setStatus] = useState('Testing connection...');
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test database connection
        const { data, error: dbError } = await supabase
          .from('profiles')
          .select('*')
          .limit(1);

        if (dbError) throw dbError;
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        setStatus('✅ Connection successful!');
        console.log('Supabase data:', { data, session });
      } catch (err) {
        setError(err.message);
        console.error('Connection error:', err);
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Supabase Connection Test</h1>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Status:</h2>
          <div className="p-3 bg-gray-100 rounded">
            {status}
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>
        </div>

        {session ? (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Session Info:</h2>
            <div className="bg-gray-50 p-3 rounded overflow-x-auto">
              <pre className="text-sm">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-4">No active session. Please log in.</p>
            <Link 
              to="/login" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Go to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
