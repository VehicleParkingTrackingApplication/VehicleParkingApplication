# API Client Documentation

Copy apiClient.js to frontend and import apiClient
```js
import apiClient from "./apiClient.js";
```

# Authentication

```js
await apiClient.login('username', 'password');

await apiClient.register('username', 'password', 'password');

apiClient.logout();

// Check logged in
const loggedIn = apiClient.isLoggedIn();

// manually get a renew access_token
await apiClient.refreshToken();
```

# HTTP Methods

```js
// get(url, options)
const response = await apiClient.get('/users/profile');
const data = await response.json();

// etc...
const response = await apiClient.post('/users', { name: 'John' });
const response = await apiClient.put('/users/123', { name: 'Jane' });
const response = await apiClient.patch('/users/123', { name: 'Jane' });
const response = await apiClient.delete('/users/123');
```