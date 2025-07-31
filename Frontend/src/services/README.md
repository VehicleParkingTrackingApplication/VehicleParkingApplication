# Authentication & Token Refresh System

This system automatically handles JWT token refresh when the access token expires, using the refresh token stored in HTTP-only cookies.

## How It Works

### 1. Login Flow
1. User logs in with username/password
2. Backend returns `accessToken` in response body
3. Frontend stores `accessToken` in localStorage
4. Backend sets `refreshToken` as HTTP-only cookie

### 2. Token Refresh Flow
1. When making authenticated API calls, if the response is 401 (Unauthorized)
2. The system automatically calls the refresh endpoint using the refresh token from cookies
3. Backend validates the refresh token and returns a new `accessToken`
4. Frontend updates the stored `accessToken`
5. The original API call is retried with the new token

### 3. Automatic Token Management
- **Access Token**: Stored in localStorage, used for API authentication
- **Refresh Token**: Stored in HTTP-only cookie, used to get new access tokens
- **Automatic Refresh**: Happens transparently when tokens expire

## Usage

### For Public Endpoints (No Authentication Required)
```typescript
import { fetchApi, postApi } from './api';

// These don't require authentication
const response = await fetchApi('public-endpoint');
const response = await postApi('public-endpoint', {}, data);
```

### For Protected Endpoints (Authentication Required)
```typescript
import { fetchAuthApi, postAuthApi } from './api';

// These automatically handle token refresh
const response = await fetchAuthApi('protected-endpoint');
const response = await postAuthApi('protected-endpoint', {}, data);
```

### Using the Auth Interceptor Directly
```typescript
import { authInterceptor } from './authInterceptor';

// Check if user is authenticated
if (authInterceptor.isAuthenticated()) {
  // User has valid token
}

// Logout user
authInterceptor.logout();
```

### Protected Routes
```typescript
import ProtectedRoute from '../components/ProtectedRoute';

// Wrap protected components
<ProtectedRoute>
  <YourProtectedComponent />
</ProtectedRoute>
```

## API Functions

### Public API Functions
- `fetchApi(path, query?)` - GET requests
- `postApi(path, query?, body?)` - POST requests
- `putApi(path, query?, body?)` - PUT requests
- `deleteApi(path, query?)` - DELETE requests

### Authenticated API Functions
- `fetchAuthApi(path, query?)` - GET requests with auto-refresh
- `postAuthApi(path, query?, body?)` - POST requests with auto-refresh
- `putAuthApi(path, query?, body?)` - PUT requests with auto-refresh
- `deleteAuthApi(path, query?)` - DELETE requests with auto-refresh

## Error Handling

- **401 Unauthorized**: Automatically triggers token refresh
- **Token Refresh Failed**: User is logged out and redirected to login
- **Network Errors**: Handled gracefully with user-friendly messages

## Security Features

- **HTTP-only Cookies**: Refresh tokens are secure and not accessible via JavaScript
- **Automatic Cleanup**: Invalid tokens are automatically removed
- **Request Queuing**: Multiple requests during refresh are queued and retried
- **Secure Headers**: All requests include proper CORS and security headers 