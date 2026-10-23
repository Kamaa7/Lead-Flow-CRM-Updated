const axios = require('axios');

async function testLogin() {
  try {
    // Test login with demo credentials
    const response = await axios.post('http://localhost:8001/api/auth/login', 
      'username=demo@example.com&password=password',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('✅ Login successful!');
    console.log('Access Token:', response.data.access_token);
    console.log('User:', response.data.user);
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin();
