# API Services Documentation

This directory contains the API service layer for the Frontend application, following the same pattern as the CSIT314 project.

## 📁 File Structure

```
services/
├── api.ts          # Low-level HTTP client (similar to api.js)
├── backend.ts      # High-level business logic API (similar to backend.js)
└── README.md       # This documentation
```

## 🔧 Architecture

### `api.ts` - Low-Level HTTP Client
**Purpose:** Provides foundational HTTP communication layer

**Key Functions:**
- `fetchApi()` - GET requests
- `postApi()` - POST requests  
- `putApi()` - PUT requests
- `deleteApi()` - DELETE requests
- `getApiUrl()` - URL construction with return URL handling

**Features:**
- Environment-aware base URLs (development vs production)
- Automatic credential handling (cookies/sessions)
- Query parameter management
- Return URL preservation for authentication flows

### `backend.ts` - High-Level Business Logic API
**Purpose:** Provides domain-specific functions that use `api.ts` under the hood

**Key Functions:**
- Vehicle management: `getVehicles()`, `createVehicle()`, `updateVehicle()`, `deleteVehicle()`
- Area management: `getAreas()`, `createArea()`, `updateArea()`, `deleteArea()`
- Record management: `getRecords()`, `createRecord()`, `updateRecord()`
- User management: `getUsers()`, `createUser()`, `updateUser()`, `deleteUser()`
- Authentication: `login()`, `register()`, `logout()`, `getCurrentUser()`
- Statistics: `getStatistics()`

## 🚀 Usage Examples

### Basic Data Fetching
```typescript
import { getVehicles, getAreas, getStatistics } from '../services/backend';

// Fetch vehicles
const vehicles = await getVehicles();

// Fetch areas
const areas = await getAreas();

// Fetch statistics
const stats = await getStatistics();
```

### Creating New Records
```typescript
import { createVehicle, createArea } from '../services/backend';

// Create a new vehicle
const newVehicle = await createVehicle({
  plateNumber: 'ABC123',
  ownerName: 'John Doe',
  vehicleType: 'Car',
  areaId: 'area123',
  isActive: true
});

// Create a new area
const newArea = await createArea({
  name: 'Parking Lot A',
  location: 'Downtown',
  capacity: 50,
  isActive: true
});
```

### Authentication
```typescript
import { login, register, getCurrentUser } from '../services/backend';

// Login
const authResult = await login('username', 'password');
if (authResult) {
  const { user, token } = authResult;
  // Store token in localStorage or state
}

// Register
const registerResult = await register('username', 'email@example.com', 'password');

// Get current user
const currentUser = await getCurrentUser();
```

### Error Handling
```typescript
import { getVehicles } from '../services/backend';

try {
  const vehicles = await getVehicles();
  // Handle success
} catch (error) {
  // Handle error
  console.error('Failed to fetch vehicles:', error);
}
```

## 📊 Type Definitions

The service includes TypeScript interfaces for all data types:

```typescript
interface Vehicle {
  _id: string;
  plateNumber: string;
  ownerId: string;
  ownerName: string;
  vehicleType: string;
  entryTime: string;
  exitTime?: string;
  areaId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Area {
  _id: string;
  name: string;
  description?: string;
  location: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ParkingRecord {
  _id: string;
  vehicleId: string;
  areaId: string;
  entryTime: string;
  exitTime?: string;
  duration?: number;
  fee?: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt: string;
  updatedAt: string;
}

interface Statistics {
  totalVehicles: number;
  totalAreas: number;
  totalRecords: number;
  totalRevenue: number;
  activeVehicles: number;
  dailyStats: Array<{
    date: string;
    vehicles: number;
    revenue: number;
  }>;
}
```

## 🔄 Relationship & Architecture

```
Frontend Components
        ↓
    backend.ts (Business Logic)
        ↓
    api.ts (HTTP Layer)
        ↓
    Backend API Server (localhost:1313)
```

## 💡 Benefits

- **Separation of Concerns**: HTTP logic vs business logic
- **Reusability**: `api.ts` functions can be used anywhere
- **Maintainability**: API changes only affect `backend.ts`
- **Type Safety**: Full TypeScript support with interfaces
- **Error Handling**: Centralized in `api.ts`
- **Environment Support**: Automatic dev/prod URL switching

## 🛠️ Configuration

The API base URL is automatically configured based on the environment:

- **Development**: `http://localhost:1313/api/`
- **Production**: `/api/`

This is handled in the `api.ts` file and can be modified as needed.

## 📝 Notes

- All functions return `Promise<T>` for async operations
- Functions that can fail return `Promise<T | null>` or `Promise<boolean>`
- Error handling is consistent across all functions
- TypeScript interfaces provide full IntelliSense support
- JSDoc comments provide additional documentation 