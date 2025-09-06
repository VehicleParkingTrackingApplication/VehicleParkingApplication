import { io, Socket } from 'socket.io-client';

export interface WebSocketEvents {
  'data-updated': (data: { areaId: string; timestamp: string; message: string }) => void;
  'data-update-error': (data: { areaId: string; timestamp: string; error: string }) => void;
  'refresh-complete': (data: { areaId: string; success: boolean; error?: string }) => void;
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
}

class WebSocketService {
    private socket: Socket | null = null;
    private isConnected = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000; // Start with 1 second
    private currentAreaId: string | null = null;
    private liveUpdatesEnabled = true; // Default to enabled

    constructor() {
        this.connect();
    }

    private connect() {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:1313';
        
        this.socket = io(backendUrl, {
            transports: ['websocket', 'polling'],
            timeout: 20000,
            forceNew: true
        });

        this.setupEventListeners();
    }

    private setupEventListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('🔌 WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.reconnectDelay = 1000;
            
            // Rejoin current area if we were in one
            if (this.currentAreaId) {
                this.joinArea(this.currentAreaId);
            }
        });

        this.socket.on('disconnect', (reason) => {
            console.log('🔌 WebSocket disconnected:', reason);
            this.isConnected = false;
            
            // Attempt to reconnect if not manually disconnected
            if (reason !== 'io client disconnect') {
                this.attemptReconnect();
            }
        });

        this.socket.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error);
            this.isConnected = false;
            this.attemptReconnect();
        });

        this.socket.on('data-updated', (data) => {
            console.log('📊 Data updated for area:', data.areaId);
            // Only emit custom event if live updates are enabled
            if (this.liveUpdatesEnabled) {
                window.dispatchEvent(new CustomEvent('websocket-data-updated', { 
                    detail: { areaId: data.areaId, timestamp: data.timestamp, message: data.message }
                }));
            } else {
                console.log('📊 Live updates disabled - ignoring data update');
            }
        });

        this.socket.on('data-update-error', (data) => {
            console.error('❌ Data update error for area:', data.areaId, data.error);
            // Emit custom event for components to listen to
            window.dispatchEvent(new CustomEvent('websocket-data-error', { 
                detail: { areaId: data.areaId, timestamp: data.timestamp, error: data.error }
            }));
        });

        this.socket.on('refresh-complete', (data) => {
            console.log('🔄 Refresh complete for area:', data.areaId, data.success);
            // Emit custom event for components to listen to
            window.dispatchEvent(new CustomEvent('websocket-refresh-complete', { 
                detail: { areaId: data.areaId, success: data.success, error: data.error }
            }));
        });
    }

    private attemptReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);
        
        setTimeout(() => {
            this.connect();
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Exponential backoff, max 30s
        }, this.reconnectDelay);
    }

    // Join a specific area room to receive updates for that area
    joinArea(areaId: string) {
        if (!this.socket || !this.isConnected) {
            console.warn('⚠️ WebSocket not connected, cannot join area');
            return;
        }

        // Leave previous area if any
        if (this.currentAreaId && this.currentAreaId !== areaId) {
            this.leaveArea(this.currentAreaId);
        }

        this.socket.emit('join-area', areaId);
        this.currentAreaId = areaId;
        console.log(`🏢 Joined area room: ${areaId}`);
    }

    // Leave a specific area room
    leaveArea(areaId: string) {
        if (!this.socket || !this.isConnected) {
        return;
        }

        this.socket.emit('leave-area', areaId);
        if (this.currentAreaId === areaId) {
        this.currentAreaId = null;
        }
        console.log(`🏢 Left area room: ${areaId}`);
    }

    // Manually trigger data refresh for an area
    refreshAreaData(areaId: string) {
        if (!this.socket || !this.isConnected) {
            console.warn('⚠️ WebSocket not connected, cannot refresh data');
            return;
        }

        this.socket.emit('refresh-data', areaId);
        console.log(`🔄 Requested data refresh for area: ${areaId}`);
    }

    // Toggle live updates on/off
    toggleLiveUpdates() {
        this.liveUpdatesEnabled = !this.liveUpdatesEnabled;
        console.log(`📊 Live updates ${this.liveUpdatesEnabled ? 'enabled' : 'disabled'}`);
        
        // Emit event to notify components of the change
        window.dispatchEvent(new CustomEvent('websocket-live-updates-toggled', { 
            detail: { enabled: this.liveUpdatesEnabled }
        }));
        
        return this.liveUpdatesEnabled;
    }

    // Get live updates status
    isLiveUpdatesEnabled() {
        return this.liveUpdatesEnabled;
    }

    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            currentAreaId: this.currentAreaId,
            liveUpdatesEnabled: this.liveUpdatesEnabled
        };
    }

    // Disconnect WebSocket
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.currentAreaId = null;
            console.log('🔌 WebSocket disconnected manually');
        }
    }

    // Add custom event listener
    addEventListener(event: string, callback: (data: any) => void) {
        const handler = (e: CustomEvent) => callback(e.detail);
        window.addEventListener(event, handler as EventListener);
        
        // Return cleanup function
        return () => {
            window.removeEventListener(event, handler as EventListener);
        };
    }
}

// Create singleton instance
export const webSocketService = new WebSocketService();

// Export the class for testing purposes
export { WebSocketService };
