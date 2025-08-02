import { refreshToken, logout as logoutApi } from './backend';

class AuthInterceptor {
    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];

    private processQueue(error: any, token: string | null = null) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });
        this.failedQueue = [];
    }

    async refreshAccessToken(): Promise<string | null> {
        try {
            const result = await refreshToken();
            if (result) {
                localStorage.setItem('token', result.accessToken);
                return result.accessToken;
            }
            return null;
        } catch (error) {
            console.error('Token refresh failed:', error);
            // Clear invalid tokens
            localStorage.removeItem('token');
            return null;
        }
    }

    async getValidToken(): Promise<string | null> {
        const token = localStorage.getItem('token');
        
        if (!token) {
            return null;
        }

        // Check if token is expired (you might want to decode JWT to check expiration)
        // For now, we'll try to refresh if we have a token
        return token;
    }

    async makeAuthenticatedRequest(
        url: string,
        options: RequestInit = {}
    ): Promise<Response> {
        console.log('=== makeAuthenticatedRequest called ===');
        console.log('URL:', url);
        console.log('Options:', options);
        
        let token = await this.getValidToken();
        console.log('Token retrieved:', token ? 'Yes' : 'No');

        if (!token) {
            console.error('No valid token available');
            throw new Error('No valid token available');
        }

        // Add authorization header
        const authOptions = {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Bearer ${token}`,
            },
        };

        console.log('Request headers:', authOptions.headers);

        try {
            console.log('Making fetch request to:', url);
            const response = await fetch(url, authOptions);
            console.log('Response received:', response.status, response.statusText);
            
            // If token is expired (401), try to refresh
            if (response.status === 401 && !this.isRefreshing) {
                console.log('Token expired (401), attempting refresh...');
                this.isRefreshing = true;
                
                const newToken = await this.refreshAccessToken();
                
                if (newToken) {
                    console.log('Token refresh successful, retrying request');
                    // Retry the original request with new token
                    const retryOptions = {
                        ...options,
                        headers: {
                            ...options.headers,
                            'Authorization': `Bearer ${newToken}`,
                        },
                    };
                    
                    this.processQueue(null, newToken);
                    this.isRefreshing = false;
                    
                    console.log('Retrying request with new token');
                    return fetch(url, retryOptions);
                } else {
                    console.log('Token refresh failed');
                    this.processQueue(new Error('Token refresh failed'), null);
                    this.isRefreshing = false;
                    throw new Error('Authentication failed');
                }
            }
            
            return response;
        } catch (error) {
            console.error('Error in makeAuthenticatedRequest:', error);
            if (this.isRefreshing) {
                console.log('Already refreshing, queuing request');
                // If we're already refreshing, queue this request
                return new Promise((resolve, reject) => {
                    this.failedQueue.push({ resolve, reject });
                }).then(() => {
                    return this.makeAuthenticatedRequest(url, options);
                });
            }
            throw error;
        }
    }

    // Helper method to check if user is authenticated
    isAuthenticated(): boolean {
        const hasToken = !!localStorage.getItem('token');
        console.log('isAuthenticated called, has token:', hasToken);
        return hasToken;
    }

    // Helper method to logout
    async logout(): Promise<void> {
        try {
            // Call backend logout endpoint to clear refresh token cookie
            await logoutApi();
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Always clear access token from localStorage
            localStorage.removeItem('token');
            // Dispatch custom event to notify components of auth state change
            window.dispatchEvent(new CustomEvent('authChange'));
        }
    }
}

export const authInterceptor = new AuthInterceptor(); 