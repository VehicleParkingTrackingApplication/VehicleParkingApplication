import { Server } from 'socket.io';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { processSimulationData } from '../scripts/simulation/simulationDataProcessingScript.js';
import Area from '../models/Area.js';

class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedClients = new Set();
        this.simulationPath = path.join(process.cwd(), 'public', 'simulation');
        this.catchUpInProgress = new Set(); // Track areas being caught up
        this.fileWatchers = new Map(); // Track file watchers per area
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
        this.startInitialCatchUp(); // NEW: Catch up on startup
        this.startFileWatching();
        
        console.log('🚀 WebSocket service initialized');
    }

    // NEW: Catch up on any missed data when server starts
    async startInitialCatchUp() {
        try {
            console.log('🔄 Starting initial catch-up processing...');
            
            // Get all areas that have simulation data
            const areas = await Area.find({});
            
            for (const area of areas) {
                const areaFolderName = `${area.name}_${area._id}`;
                const areaPath = path.join(this.simulationPath, areaFolderName);
                
                if (fs.existsSync(areaPath)) {
                    console.log(`📁 Found simulation data for area: ${area.name}`);
                    await this.performCatchUpProcessing(area._id);
                }
            }
            
            console.log('✅ Initial catch-up processing completed');
        } catch (error) {
            console.error('❌ Error during initial catch-up:', error);
        }
    }

    // NEW: Perform catch-up processing for an area
    async performCatchUpProcessing(areaId) {
        if (this.catchUpInProgress.has(areaId)) {
            console.log(`⏳ Catch-up already in progress for area: ${areaId}`);
            return;
        }

        this.catchUpInProgress.add(areaId);
        
        try {
            console.log(`🔄 Performing catch-up processing for area: ${areaId}`);
            
            // Process simulation data (this will use savedTimestamp to resume from where it left off)
            await processSimulationData(areaId);
            
            // Notify clients that catch-up is complete
            this.io.to(`area-${areaId}`).emit('catch-up-complete', {
                areaId,
                timestamp: new Date().toISOString(),
                message: 'Catch-up processing completed'
            });
            
            console.log(`✅ Catch-up processing completed for area: ${areaId}`);
            
        } catch (error) {
            console.error(`❌ Error during catch-up processing for area ${areaId}:`, error);
            
            // Notify clients of catch-up error
            this.io.to(`area-${areaId}`).emit('catch-up-error', {
                areaId,
                timestamp: new Date().toISOString(),
                error: error.message
            });
        } finally {
            this.catchUpInProgress.delete(areaId);
        }
    }

    // Setup socket event handlers
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);
            this.connectedClients.add(socket.id);

            // Handle client joining specific area room
            socket.on('join-area', (areaId) => {
                socket.join(`area-${areaId}`);
                console.log(` Client ${socket.id} joined area ${areaId}`);
                
                // NEW: Send current status to newly joined client
                socket.emit('area-status', {
                    areaId,
                    catchUpInProgress: this.catchUpInProgress.has(areaId),
                    timestamp: new Date().toISOString()
                });
            });

            // Handle client leaving area room
            socket.on('leave-area', (areaId) => {
                socket.leave(`area-${areaId}`);
                console.log(` Client ${socket.id} left area ${areaId}`);
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

            // NEW: Handle manual catch-up request
            socket.on('trigger-catch-up', async (areaId) => {
                try {
                    console.log(`🔄 Manual catch-up requested for area: ${areaId}`);
                    await this.performCatchUpProcessing(areaId);
                    socket.emit('catch-up-complete', { areaId, success: true });
                } catch (error) {
                    console.error(`❌ Manual catch-up failed for area ${areaId}:`, error);
                    socket.emit('catch-up-error', { areaId, success: false, error: error.message });
                }
            });
        });
    }

    // Enhanced file watching with per-area watchers
    startFileWatching() {
        if (!fs.existsSync(this.simulationPath)) {
            console.log('⚠️ Simulation directory not found, file watching disabled');
            return;
        }

        console.log('👀 Starting file watching for simulation data...');

        // Watch the entire simulation directory for new area folders
        const mainWatcher = chokidar.watch(this.simulationPath, {
            persistent: true,
            ignoreInitial: true,
            depth: 1, // Only watch immediate subdirectories
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        // Handle new area folders
        mainWatcher.on('addDir', async (dirPath) => {
            const areaId = this.extractAreaIdFromPath(dirPath);
            if (areaId) {
                console.log(`📁 New area folder detected: ${dirPath}`);
                await this.setupAreaWatcher(areaId, dirPath);
                // Perform catch-up for the new area
                await this.performCatchUpProcessing(areaId);
            }
        });

        // Setup watchers for existing area folders
        this.setupExistingAreaWatchers();

        console.log('✅ File watching started');
    }

    // NEW: Setup watchers for existing area folders
    async setupExistingAreaWatchers() {
        try {
            const areas = await Area.find({});
            
            for (const area of areas) {
                const areaFolderName = `${area.name}_${area._id}`;
                const areaPath = path.join(this.simulationPath, areaFolderName);
                
                if (fs.existsSync(areaPath)) {
                    await this.setupAreaWatcher(area._id, areaPath);
                }
            }
        } catch (error) {
            console.error('❌ Error setting up existing area watchers:', error);
        }
    }

    // NEW: Setup individual watcher for an area
    async setupAreaWatcher(areaId, areaPath) {
        if (this.fileWatchers.has(areaId)) {
            console.log(`👀 Watcher already exists for area: ${areaId}`);
            return;
        }

        console.log(` Setting up watcher for area: ${areaId}`);

        const watcher = chokidar.watch(areaPath, {
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 100
            }
        });

        // Handle file changes in this area
        watcher.on('change', async (filePath) => {
            console.log(`📁 File changed in area ${areaId}: ${filePath}`);
            await this.handleFileChange(filePath, areaId);
        });

        // Handle new files in this area
        watcher.on('add', async (filePath) => {
            console.log(`📁 New file added in area ${areaId}: ${filePath}`);
            await this.handleFileChange(filePath, areaId);
        });

        this.fileWatchers.set(areaId, watcher);
    }

    // Enhanced file change handler
    async handleFileChange(filePath, areaId) {
        try {
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

    // NEW: Manually trigger catch-up processing for an area
    async triggerCatchUpProcessing(areaId) {
        try {
            await this.performCatchUpProcessing(areaId);
            return { success: true, message: 'Catch-up processing triggered successfully' };
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
                    clientCount: value.size,
                    catchUpInProgress: this.catchUpInProgress.has(areaId)
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

    // NEW: Cleanup method to close all watchers
    cleanup() {
        console.log('🧹 Cleaning up WebSocket service...');
        
        // Close all area watchers
        this.fileWatchers.forEach((watcher, areaId) => {
            console.log(`🔌 Closing watcher for area: ${areaId}`);
            watcher.close();
        });
        
        this.fileWatchers.clear();
        this.catchUpInProgress.clear();
        
        console.log('✅ WebSocket service cleanup completed');
    }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export { WebSocketService, webSocketService };