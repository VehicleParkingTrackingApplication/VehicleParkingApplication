# CSIT321 Capstone Project Backend

## Project Introduction

This backend project is designed to automate the collection, processing, and management of camera data for parking areas. The system retrieves camera data from FTP servers, processes the data, and stores it efficiently in a MongoDB database. It also provides a set of public API endpoints for interacting with the data, all accessible via `localhost` during development.

### Key Features
- **Automated FTP Data Collection:**
  - Connects to FTP servers (one per parking area) to fetch camera data files.
  - Supports secure FTP connections and customizable server settings per area.

- **Data Processing Pipeline:**
  - Processes raw camera data to extract relevant information (e.g., vehicle entries, timestamps).
  - Handles continuous updates and ensures only new/unprocessed data is handled.

- **MongoDB Storage:**
  - Stores all processed data in a MongoDB database for efficient querying and analytics.
  - Maintains relationships between businesses, parking areas, and their respective FTP servers.

- **RESTful API Endpoints:**
  - Exposes public API endpoints for:
    - Business and user management
    - Parking area and FTP server configuration
    - Vehicle and camera data retrieval
    - Data processing triggers and status
  - All endpoints are accessible via `http://localhost:<port>` (default: 1313)

### High-Level Architecture
```
[FTP Server(s)]
     │
     ▼
[Backend Service: Node.js/Express]
     │   ├─ Automated FTP fetch & process
     │   ├─ API endpoints (REST)
     │   └─ Authentication & authorization
     ▼
[MongoDB Database]
```

### Example Public API Endpoints
- `POST   /api/account/input-business-account` — Register a new business
- `POST   /api/area/create` — Create a new parking area and link to FTP server
- `POST   /api/area/input-ftp-server` — Add or update FTP server info for an area
- `GET    /api/area/by-business/:businessId` — List all areas for a business
- `GET    /api/vehicle/by-area/:areaId` — Get vehicle/camera data for an area

### Getting Started
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   - Set up your MongoDB connection string and JWT secrets in a `.env` file.
3. **Run the backend server:**
   ```bash
   npm start
   ```
4. **Access the API:**
   - Use tools like Postman or curl to interact with endpoints at `http://localhost:1313`

---

For more details, see the API documentation and code comments.

## Table of Contents
- [Environment Setup](#environment-setup)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Deployment](#deployment)

## Environment Setup

### Local Development
1. Copy `env.example` to `.env`
2. Fill in your actual values in `.env`
3. Never commit `.env` to Git (it's already in .gitignore)

### Production Deployment (App Runner)
Set these environment variables in AWS App Runner console:

- `MONGODB_URI` - Your MongoDB connection string
- `ACCESS_TOKEN_SECRET` - JWT access token secret
- `REFRESH_TOKEN_SECRET` - JWT refresh token secret  
- `SESSION_SECRET` - Session encryption secret
- `NODE_ENV` - Set to `production`

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Documentation

### Base URL
```
http://localhost:1313/api
```

### Authentication Endpoints

#### POST `/auth/login`
User login with username and password.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "accessToken": "jwt_token_here"
}
```

#### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Registration and login successful",
  "accessToken": "jwt_token_here"
}
```

#### POST `/auth/refresh`
Refresh access token using refresh token from cookies.

**Response:**
```json
{
  "message": "Token refreshed successfully",
  "accessToken": "new_jwt_token_here"
}
```

#### POST `/auth/logout`
Logout user and clear refresh token cookie.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Parking Area Management

#### GET `/parking/area`
Get parking areas for the authenticated user's business.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 3)
- `search` (optional): Search by parking area name
- `sortBy` (optional): Sort field (default: createdAt)
- `sortOrder` (optional): Sort order - "asc" or "desc" (default: asc)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "parking_area_id",
      "name": "Parking Area Name",
      "businessId": "business_id",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 3,
    "totalPages": 4
  }
}
```

### Vehicle Management

#### GET `/parking/vehicle`
Get vehicles in a specific parking area.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `parkingAreaId` (required): ID of the parking area
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "vehicles": [
    {
      "_id": "vehicle_id",
      "parkingAreaId": "parking_area_id",
      "plateNumber": "ABC123",
      "country": "AUS",
      "confidence": 85,
      "angle": 45,
      "status": "APPROACHING",
      "date": "2024-01-01",
      "time": "10:30:00",
      "entryTime": "2024-01-01T10:30:00.000Z",
      "exitTime": null
    }
  ]
}
```

#### POST `/parking/simulate`
Simulate vehicle entry/exit for testing.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "parkingAreaId": "parking_area_id",
  "date": "2024-01-01",
  "time": "10:30:00",
  "plateNumber": "ABC123",
  "country": "AUS",
  "confidence": 85,
  "angle": 45,
  "image": "base64_image_data",
  "status": "APPROACHING"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Simulation data processed successfully"
}
```

#### POST `/parking/vehicle/input/data`
Receive vehicle data from camera systems.

**Request Body:**
```json
{
  "date": "2024-01-01",
  "time": "10:30:00",
  "parkingAreaId": "parking_area_id",
  "plateNumber": "ABC123",
  "country": "AUS",
  "confidence": 85,
  "angle": 45,
  "image": "base64_image_data",
  "status": "APPROACHING"
}
```

**Response:**
```json
{
  "message": "Vehicle data received successfully",
  "data": {
    // vehicle data
  }
}
```

### User Management

#### GET `/users/admin`
Admin-only endpoint.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Admin page"
}
```

#### GET `/users/manager`
Manager and admin access.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Manager page"
}
```

#### GET `/users/user`
All authenticated users.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "User page"
}
```

### Data Import

#### POST `/home/import-data`
Import CSV data (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `file` (optional): CSV filename (default: 2025-04-02.csv)

#### POST `/home/import-business-data`
Import business data (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/home/import-parking-area-data`
Import parking area data (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/home`
Health check endpoint.

**Response:**
```json
{
  "Check": "Hello"
}
```

### Account Management

#### GET `/account`
Get account information.

**Response:**
```json
{
  // account data
}
```

## Authentication

### JWT Token Usage
Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Refresh
The system uses refresh tokens stored in HTTP-only cookies. When the access token expires, use the `/auth/refresh` endpoint to get a new one.

### Role-Based Access
- **Admin**: Full access to all endpoints
- **Manager**: Access to manager and user endpoints
- **User**: Access to user endpoints only

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Error description"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

## Security Notes

- ✅ `.env` files are excluded from Git
- ✅ Use App Runner environment variables for production
- ✅ Never commit secrets to version control
- ❌ Don't push `.env` files to GitHub
- 🔒 JWT tokens for authentication
- 🔒 Role-based access control
- 🔒 HTTP-only cookies for refresh tokens

## Deployment

### AWS App Runner
1. Set environment variables in App Runner console
2. Build Command: `npm install`
3. Start Command: `npm start`
4. Source Directory: `Backend`

### AWS Lambda
1. Create deployment zip: `Compress-Archive -Path "index.js", "package.json", "src", "public", "scripts", "node_modules" -DestinationPath "lambda-deployment.zip"`
2. Upload to Lambda function
3. Set handler to: `index.handler`

## Database Schema

### Parking Area
- `_id`: ObjectId
- `name`: String
- `businessId`: ObjectId
- `createdAt`: Date

### Vehicle
- `_id`: ObjectId
- `parkingAreaId`: ObjectId
- `plateNumber`: String
- `country`: String
- `confidence`: Number
- `angle`: Number
- `status`: String (APPROACHING/LEAVING)
- `date`: String
- `time`: String
- `entryTime`: Date
- `exitTime`: Date

### User
- `_id`: ObjectId
- `username`: String
- `password`: String (hashed)
- `role`: String (admin/manager/user)
- `businessId`: ObjectId



