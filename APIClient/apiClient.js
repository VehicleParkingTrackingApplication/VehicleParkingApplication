class ApiClient {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
        this.accessToken = null;
        this.isRefreshing = false;
        this.failedQueue = [];
    }

    setAccessToken(token) {
        this.accessToken = token;
    }

    getAccessToken() {
        return this.accessToken;
    }

    isLoggedIn() {
        return !!this.accessToken;
    }

    async processQueue(error, token = null) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });
        
        this.failedQueue = [];
    }

    async refreshToken() {
        if (this.isRefreshing) {
            // If already refreshing, wait!
            return new Promise((resolve, reject) => {
                this.failedQueue.push({ resolve, reject });
            });
        }

        this.isRefreshing = true;

        try {
            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include', // We stored refresh token in HTTP-only cookie, so we need to include cookies that contain the refresh token
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.setAccessToken(data.accessToken);
                this.processQueue(null, data.accessToken);
                return data.accessToken;
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            this.processQueue(error, null);
            await this.logout();
            throw error;
        } finally {
            this.isRefreshing = false;
        }
    }

    async request(url, options = {}) {
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        // Add access token to headers
        if (this.accessToken) {
            config.headers.Authorization = `Bearer ${this.accessToken}`;
        }

        try {
            const response = await fetch(`${this.baseURL}${url}`, config);

            // If token expired, try to refresh
            if (response.status === 401 && this.accessToken) {
                try {
                    await this.refreshToken();
                    // Retry the original request with new token
                    config.headers.Authorization = `Bearer ${this.accessToken}`;
                    return await fetch(`${this.baseURL}${url}`, config);
                } catch (refreshError) {
                    throw refreshError;
                }
            }

            return response;
        } catch (error) {
            throw error;
        }
    }
    
    async get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    }

    async post(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(url, data, options = {}) {
        return this.request(url, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(url, options = {}) {
        return this.request(url, { ...options, method: 'DELETE' });
    }

    // Auth methods
    async login(username, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.setAccessToken(data.accessToken);
                return data;
            } else {
                const error = await response.json();
                throw new Error(error.message);
            }
        } catch (error) {
            throw error;
        }
    }

    async register(username, password, confirmedPassword) {
        try {
            if (password !== confirmedPassword) {
                throw new Error('Passwords do not match');
            }

            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.setAccessToken(data.accessToken);
                return data;
            } else {
                const error = await response.json();
                throw new Error(error.message);
            }
        } catch (error) {            throw error;
        }
    }

    async logout() {
        try {
            await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            // Ignore errors
        } finally {
            this.accessToken = null;
        }
    }
}

const apiClient = new ApiClient();
export default apiClient;
