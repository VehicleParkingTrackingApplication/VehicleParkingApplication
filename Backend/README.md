# CSIT321 Capstone Project Backend

## Project Introduction

This backend project is designed to automate the collection, processing, and management of camera data for parking areas. The system retrieves camera data from FTP servers, processes the data, and stores it efficiently in a MongoDB database. It also provides a set of public API endpoints for interacting with the data, all accessible via `localhost` during development.

### Key Features
- **Automated FTP Data Collection:**
- **Data Processing Pipeline:**
- **MongoDB Storage:**
- **RESTful API Endpoints:**

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

## Complete API Endpoints

### Authentication (`/api/auth`)

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

#### GET `/auth/me`
Get current user information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "_id": "user_id",
  "username": "string",
  "email": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "businessId": "business_id",
  "createdAt": "date",
  "updatedAt": "date"
}
```

### Parking Management (`/api/parking`)

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

#### POST `/parking/area/input-area`
Create a new parking area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/parking/area/:areaId/input-ftpserver`
Configure FTP server for a parking area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/parking/area/:areaId/trigger-ftp`
Manually trigger FTP data fetch for an area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/parking/area/:areaId/status-ftpserver`
Test FTP server connection.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/parking/area/:areaId/details`
Get detailed information about a parking area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/parking/vehicle/:areaId/manual-input`
Manually input vehicle data.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/parking/vehicle/:areaId/existing-vehicles`
Get vehicles currently in a parking area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/parking/vehicle/:areaId/recent-records`
Get recent vehicle records for an area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/parking/vehicle/:areaId/all-records`
Get all vehicle records for an area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/parking/vehicle/:areaId/filter-records`
Get filtered vehicle records for an area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/parking/records/:businessId/latest`
Get latest records for all areas in a business.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/parking/vehicle/:areaId/vehicles-for-removal`
Get vehicles that can be removed from an area.

**Headers:**
```
Authorization: Bearer <access_token>
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

### Image Management (`/api/parking/image`)

#### POST `/parking/image/loadFtpServer/:areaId`
Load images from FTP server for an area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/parking/image/:areaId/:plateNumber/:date`
Get image URL for a specific vehicle and date.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/parking/image/:areaId/:plateNumber/:date/metadata`
Get image metadata.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/parking/image/:areaId/cached`
Get cached images for an area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/parking/image/:areaId/:plateNumber/:date/fetch`
Force fetch an image.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### DELETE `/parking/image/cleanup`
Clean up old cached images.

**Headers:**
```
Authorization: Bearer <access_token>
```

### User Management (`/api/users`)

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

### Staff Management (`/api/staff`)

#### GET `/staff/list-staff`
Get list of staff members (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `businessId` (optional): Filter by business ID
- `page` (optional): Page number
- `limit` (optional): Items per page

#### POST `/staff/create-staff`
Create a new staff account (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "businessId": "string"
}
```

#### PUT `/staff/update-staff`
Update staff account information (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "userId": "string",
  "username": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "businessId": "string"
}
```

#### DELETE `/staff/delete-staff`
Delete a staff account (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "userId": "string"
}
```

### Account Management (`/api/account`)

#### GET `/account`
Get account information.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/account/input-business-account`
Create or update business account information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "email": "string",
  "phonenumber": "string",
  "businessName": "string",
  "location": "string"
}
```

#### PUT `/account/update-name`
Update user name.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/account/business-users`
Get users in the same business (Admin only).

**Headers:**
```
Authorization: Bearer <access_token>
```

### Notification Management (`/api/notification`)

#### GET `/notification/getAllNotifications`
Get all notifications for a business with pagination and filtering.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` (optional): Filter by status ('read' or 'unread')
- `type` (optional): Filter by type ('capacity_warning', 'capacity_critical', 'blacklist_alert', 'system')
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### GET `/notification/getRecentNotifications`
Get recent notifications.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### PUT `/notification/:notificationId/read`
Mark a specific notification as read.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### PUT `/notification/business/:businessId/read-all`
Mark all notifications as read for a business.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Blacklist Management (`/api/blacklist`)

#### POST `/blacklist`
Create a new blacklist entry.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/blacklist/business/:businessId`
Get all blacklist entries for a business.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/blacklist/search`
Search blacklist entries by plate number.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/blacklist/check`
Check if a plate number is blacklisted.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Employee Vehicle Management (`/api/employee-vehicle`)

#### POST `/employee-vehicle/add`
Add a vehicle to employee vehicles.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "plateNumber": "string",
  "owner": "string",
  "areaId": "string"
}
```

#### GET `/employee-vehicle/list`
Get list of employee vehicles for the business.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `areaId` (optional): Filter by area ID

#### DELETE `/employee-vehicle/remove`
Remove a vehicle from employee vehicles.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "vehicleId": "string"
}
```

### Scheduler Management (`/api/scheduler`)

#### WebSocket Management

#### GET `/scheduler/websocket/status`
Get WebSocket service status.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/scheduler/websocket/trigger/:areaId`
Manually trigger WebSocket processing for an area.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### FTP Scheduler Management

#### GET `/scheduler/ftp/status`
Get FTP scheduler status.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/scheduler/ftp/start`
Start FTP scheduler.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/scheduler/ftp/stop`
Stop FTP scheduler.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/scheduler/ftp/trigger`
Manually trigger FTP processing.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### Simulation Scheduler Management

#### GET `/scheduler/simulation/status`
Get simulation scheduler status.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/scheduler/simulation/start`
Start simulation scheduler.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/scheduler/simulation/stop`
Stop simulation scheduler.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/scheduler/simulation/trigger`
Manually trigger simulation processing.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### Combined Scheduler Management

#### GET `/scheduler/status`
Get status of both FTP and simulation schedulers.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/scheduler/start`
Start both schedulers.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/scheduler/stop`
Stop both schedulers.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Reports Management (`/api/reports`)

#### GET `/reports`
Get all saved reports for the current user (owned and shared).

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/reports/:id`
Get full details of a specific report.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/reports`
Create a new report.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "name": "string",
  "areaId": "string",
  "type": "string",
  "chartData": "object",
  "filters": "object",
  "description": "string"
}
```

#### DELETE `/reports/:id`
Delete a report by ID.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Comments Management (`/api/comments`)

#### GET `/comments/:reportId`
Get all comments for a specific report.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/comments`
Create a new comment.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reportId": "string",
  "content": "string"
}
```

#### PUT `/comments/:id`
Update a comment (only by author).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "content": "string"
}
```

#### DELETE `/comments/:id`
Delete a comment (only by author or report owner).

**Headers:**
```
Authorization: Bearer <access_token>
```

### Sharing Management (`/api/shares`)

#### GET `/shares/:reportId`
Get all users that a report has been shared with.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/shares`
Share a report with users in the same business.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "reportId": "string",
  "userIds": ["string"]
}
```

#### DELETE `/shares/:shareId`
Remove a share (unshare the report with a user).

**Headers:**
```
Authorization: Bearer <access_token>
```

#### GET `/shares/business/users`
Get all users in the same business for sharing.

**Headers:**
```
Authorization: Bearer <access_token>
```

### QA Management (`/api/qa`)

#### GET `/qa`
Get QA data from CSV file.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "keyword": "string",
      "question": "string"
    }
  ]
}
```

### AI Investigation (`/api/investigate-ai`)

#### POST `/investigate-ai/generate`
Generate MongoDB query without executing.

**Headers:**
```
Authorization: Bearer <access_token>
```

#### POST `/investigate-ai/query`
Process natural language query and execute.

**Headers:**
```
Authorization: Bearer <access_token>
```

### Home/Health Check (`/api/home`)

#### GET `/home`
Health check endpoint.

**Response:**
```json
{
  "Check": "Hello"
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



