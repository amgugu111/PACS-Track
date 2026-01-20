import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
    (config) => {
        // Debug: Check all cookies
        const allCookies = document.cookie;
        console.log('API Client: All cookies:', allCookies);

        // Get token from cookies
        const token = Cookies.get('token');
        console.log('API Client: Request to', config.url, 'with token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle auth errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized
        if (error.response?.status === 401) {
            console.error('API Client: Authentication failed - Token invalid or expired');
            console.error('API Client: Redirecting to login');
            // Clear auth data
            Cookies.remove('token');
            Cookies.remove('user');
            // Redirect to login
            window.location.href = '/login';
        } else {
            console.error('API Error:', error.response?.data || error.message);
        }
        return Promise.reject(error);
    }
);
