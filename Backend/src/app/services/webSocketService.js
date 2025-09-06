import { Server } from 'socket.io';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { processSimulationData } from '../scripts/simulation/simulationDataProcessingScript.js';

class WebSocketService {
    constructor() {
        this.io = null;
        // this.watchers = new Map(); // Map of areaId -> file watcher
        this.connectedClients = new Set();
        this.simulationPath = path.join(process.cwd(), 'public', 'simulation');
    }

    // Initialize WebSocket server
    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.NODE_ENV === 'production' 
                    ? ['https://yourdomain.com'] 
                    : ['http://localhost:5173'],
                methods: ['GET', 'POST']
            }
        });

        this.setupSocketHandlers();
        this.startFileWatching();
        
        console.log('🚀 WebSocket service initialized');
    }

    // Setup socket event handlers
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            this.connectedClients.add(socket.id);

            // Handle client joining specific area room
            socket.on('join-area', (areaId) => {
                socket.join(`area-${areaId}`);
                console.log(`�� Client ${socket.id} joined area ${areaId}`);
            });

            // Handle client leaving area room
            socket.on('leave-area', (areaId) => {
                socket.leave(`area-${areaId}`);
                console.log(`�� Client ${socket.id} left area ${areaId}`);
            });

            // Handle client disconnection
            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket.id);
            });

            // Handle manual data refresh request
            socket.on('refresh-data', async (areaId) => {
                try {
                    console.log(`🔄 Manual refresh requested for area: ${areaId}`);
                    await this.processAreaData(areaId);
                    socket.emit('refresh-complete', { areaId, success: true });
                } catch (error) {
                    console.error(`❌ Manual refresh failed for area ${areaId}:`, error);
                    socket.emit('refresh-complete', { areaId, success: false, error: error.message });
                }
            });
        });
    }

    // Start watching simulation files for changes
    startFileWatching() {
        if (!fs.existsSync(this.simulationPath)) {
            console.log('⚠️ Simulation directory not found, file watching disabled');
            return;
        }

        console.log('👀 Starting file watching for simulation data...');

        // Watch the entire simulation directory
        const watcher = chokidar.watch(this.simulationPath, {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        // Handle file changes
        watcher.on('change', async (filePath) => {
            await this.handleFileChange(filePath);
        });

        // Handle new files
        watcher.on('add', async (filePath) => {
            await this.handleFileChange(filePath);
        });

        console.log('✅ File watching started');
    }

    // Handle file changes
    async handleFileChange(filePath) {
        try {
            // Extract area ID from file path
            const areaId = this.extractAreaIdFromPath(filePath);
            if (!areaId) {
                console.log(`⚠️ Could not extract area ID from path: ${filePath}`);
                return;
            }

            console.log(`📁 File changed: ${filePath} for area: ${areaId}`);

            // Process the updated data
            await this.processAreaData(areaId);

        } catch (error) {
            console.error('❌ Error handling file change:', error);
        }
    }

    // Extract area ID from file path
    extractAreaIdFromPath(filePath) {
        try {
            // Path format: public/simulation/AreaName_AreaId/filename.csv
            const pathParts = filePath.split(path.sep);
            const areaFolder = pathParts[pathParts.length - 2]; // Get folder name
            
            if (areaFolder && areaFolder.includes('_')) {
                const areaId = areaFolder.split('_').pop(); // Get the ID part
                return areaId;
            }
            
            return null;
        } catch (error) {
            console.error('Error extracting area ID:', error);
            return null;
        }
    }

    // Process area data and notify clients
    async processAreaData(areaId) {
        try {
            console.log(`🔄 Processing data for area: ${areaId}`);
            
            // Process the simulation data
            await processSimulationData(areaId);
            
            // Notify all clients in the area room
            this.io.to(`area-${areaId}`).emit('data-updated', {
                areaId,
                timestamp: new Date().toISOString(),
                message: 'New simulation data processed'
            });

            console.log(`✅ Data processed and clients notified for area: ${areaId}`);

        } catch (error) {
            console.error(`❌ Error processing area data for ${areaId}:`, error);
            
            // Notify clients of error
            this.io.to(`area-${areaId}`).emit('data-update-error', {
                areaId,
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    }

    // Manually trigger data processing for an area
    async triggerAreaProcessing(areaId) {
        try {
            await this.processAreaData(areaId);
            return { success: true, message: 'Area processing triggered successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get connected clients count
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }

    // Get active area rooms
    getActiveRooms() {
        if (!this.io) return [];
        
        const rooms = [];
        this.io.sockets.adapter.rooms.forEach((value, key) => {
            if (key.startsWith('area-')) {
                const areaId = key.replace('area-', '');
                rooms.push({
                    areaId,
                    clientCount: value.size
                });
            }
        });
        
        return rooms;
    }

    // Broadcast message to all connected clients
    broadcastToAll(event, data) {
        if (this.io) {
            this.io.emit(event, data);
        }
    }

    // Send message to specific area room
    sendToArea(areaId, event, data) {
        if (this.io) {
            this.io.to(`area-${areaId}`).emit(event, data);
        }
    }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export { WebSocketService, webSocketService };