# WebSocket Integration

This document explains how the WebSocket integration works between the frontend and backend for real-time data updates.

## Overview

The WebSocket service enables real-time updates to the parking dashboard when new data is detected from the data source (simulation files or FTP server).

## Architecture

### Backend WebSocket Service (`Backend/src/app/services/webSocketService.js`)
- Monitors simulation files for changes using `chokidar`
- Processes new data when files are updated
- Emits events to connected clients in area-specific rooms
- Supports manual data refresh requests

### Frontend WebSocket Service (`Frontend/src/services/websocket.ts`)
- Connects to backend WebSocket server
- Manages connection state and reconnection logic
- Joins/leaves area-specific rooms
- Handles real-time event notifications

## Events

### Backend → Frontend Events

1. **`data-updated`**: New data has been processed for an area
   ```javascript
   {
     areaId: string,
     timestamp: string,
     message: string
   }
   ```

2. **`data-update-error`**: Error occurred during data processing
   ```javascript
   {
     areaId: string,
     timestamp: string,
     error: string
   }
   ```

3. **`refresh-complete`**: Manual refresh request completed
   ```javascript
   {
     areaId: string,
     success: boolean,
     error?: string
   }
   ```

### Frontend → Backend Events

1. **`join-area`**: Join a specific area room to receive updates
2. **`leave-area`**: Leave an area room
3. **`refresh-data`**: Request manual data refresh for an area

## Usage in Components

### Basic Integration

```typescript
import { webSocketService } from '@/services/websocket';

// Join area room when component mounts
useEffect(() => {
  if (areaId) {
    webSocketService.joinArea(areaId);
  }
  
  return () => {
    if (areaId) {
      webSocketService.leaveArea(areaId);
    }
  };
}, [areaId]);

// Listen for data updates
useEffect(() => {
  const cleanup = webSocketService.addEventListener('websocket-data-updated', (data) => {
    if (data.areaId === selectedAreaId) {
      // Refresh data for current area
      refreshData();
    }
  });
  
  return cleanup;
}, [selectedAreaId]);
```

### Connection Status

```typescript
const status = webSocketService.getConnectionStatus();
console.log('Connected:', status.isConnected);
console.log('Current Area:', status.currentAreaId);
```

### Manual Refresh

```typescript
// Trigger manual data refresh
webSocketService.refreshAreaData(areaId);
```

## Configuration

### Backend Configuration
- WebSocket server runs on the same port as the HTTP server
- CORS configured for frontend development server (`http://localhost:5173`)
- File watching configured for simulation directory

### Frontend Configuration
- Backend URL: `VITE_BACKEND_URL` environment variable (defaults to `http://localhost:1313`)
- Auto-reconnection with exponential backoff
- Connection status monitoring

## Error Handling

- Automatic reconnection on connection loss
- Error notifications for failed data updates
- Connection status indicators in UI
- Graceful degradation when WebSocket is unavailable

## Testing

1. Start the backend server
2. Start the frontend development server
3. Open the parking dashboard
4. Select a parking area
5. Check browser console for WebSocket connection logs
6. Monitor the connection status indicator in the UI
7. Test manual refresh functionality

## Troubleshooting

### Common Issues

1. **WebSocket not connecting**
   - Check if backend server is running
   - Verify CORS configuration
   - Check browser console for connection errors

2. **No real-time updates**
   - Ensure area is selected
   - Check if simulation files are being updated
   - Verify WebSocket room membership

3. **Connection drops frequently**
   - Check network stability
   - Review backend logs for errors
   - Verify file watching is working correctly