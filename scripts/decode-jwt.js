const jwt = require('jsonwebtoken');

// Get a fresh token
const axios = require('axios');

async function decodeToken() {
    try {
        // Login to get token
        const response = await axios.post('http://localhost:3001/auth/login', {
            email: 'admin@ritikaagencies.com',
            password: 'password123'
        });

        const token = response.data.access_token;
        console.log('Token:', token);
        console.log('');

        // Decode without verification
        const decoded = jwt.decode(token, { complete: true });
        console.log('Decoded header:', JSON.stringify(decoded.header, null, 2));
        console.log('');
        console.log('Decoded payload:', JSON.stringify(decoded.payload, null, 2));
        console.log('');

        // Try to verify with the secret
        const secret = 'bfae0fb9bcc7dc3ca16fc8dc0dda7d85d68f6da3e7942f170b44ac0fadf7a23dc33e0833b9220d93ff35edb4a9096a4de2fbfca7cf7b99d7fe87d4f2f65f34d0';

        try {
            const verified = jwt.verify(token, secret);
            console.log('✅ Token verified successfully!');
            console.log('Verified payload:', JSON.stringify(verified, null, 2));
        } catch (err) {
            console.log('❌ Token verification failed:', err.message);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

decodeToken();
