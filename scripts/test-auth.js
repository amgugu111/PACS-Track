const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testAuth() {
    console.log('🔍 Testing JWT Authentication Flow\n');

    try {
        // Step 1: Login
        console.log('1️⃣ Attempting login...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@ritikaagencies.com',
            password: 'password123'
        });

        console.log('✅ Login successful!');
        console.log('   Token length:', loginResponse.data.access_token.length);
        console.log('   Token preview:', loginResponse.data.access_token.substring(0, 50) + '...');
        console.log('   User:', loginResponse.data.user.email);
        console.log('   Role:', loginResponse.data.user.role);
        console.log('   Rice Mill ID:', loginResponse.data.user.riceMill.id);
        console.log('');

        const token = loginResponse.data.access_token;

        // Step 2: Test authenticated request to societies
        console.log('2️⃣ Testing authenticated request to /societies...');
        console.log('   Authorization header:', `Bearer ${token.substring(0, 20)}...`);
        console.log('');

        const societiesResponse = await axios.get(`${API_URL}/societies`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Authenticated request successful!');
        console.log('   Societies found:', societiesResponse.data.length);
        if (societiesResponse.data.length > 0) {
            console.log('   First society:', societiesResponse.data[0].name);
        }
        console.log('');

        // Step 3: Test districts endpoint
        console.log('3️⃣ Testing authenticated request to /districts...');
        const districtsResponse = await axios.get(`${API_URL}/districts`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✅ Districts request successful!');
        console.log('   Districts found:', districtsResponse.data.length);
        console.log('');

        console.log('🎉 All authentication tests passed!');

    } catch (error) {
        console.error('❌ Test failed!');
        console.error('');

        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
            console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
        } else if (error.request) {
            console.error('No response received');
            console.error('Request:', error.request);
        } else {
            console.error('Error:', error.message);
        }
        console.error('');
        console.error('Stack trace:', error.stack);
    }
}

testAuth();
