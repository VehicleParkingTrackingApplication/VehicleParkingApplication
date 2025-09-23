import { Server } from 'socket.io';
import Area from '../models/Area.js';
import { FtpService } from './ftpService.js';
import { fetchDataFtpServer } from '../scripts/fetchDataFtpServer.js';

class WebSocketServiceFtp {
    constructor() {
        this.io = null;
        this.connectedClients = new Set();
        this.isPolling = false;
        this.poller = null;
        this.pollIntervalMinutes = parseInt(process.env.FTP_WS_POLL_INTERVAL) || 5;
    }

    // Initialize WebSocket server (FTP channel)
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
        this.startInitialCatchUp();
        this.startPolling();

        console.log('🚀 WebSocket FTP service initialized');
    }

    // Catch up on missed data for all areas that have an FTP server configured
    async startInitialCatchUp() {
        try {
            console.log('🔄 [FTP] Starting initial catch-up...');
            const areas = await Area.find({ ftpServer: { $ne: null } }).select('_id');
            for (const area of areas) {
                await this.processAreaData(area._id.toString());
            }
            console.log('✅ [FTP] Initial catch-up complete');
        } catch (error) {
            console.error('❌ [FTP] Catch-up error:', error);
        }
    }

    // Socket handlers for FTP channel
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 [FTP] Client connected: ${socket.id}`);
            this.connectedClients.add(socket.id);

            // Join/leave area rooms
            socket.on('join-area', (areaId) => {
                socket.join(`ftp-area-${areaId}`);
                console.log(`🔎 [FTP] Client ${socket.id} joined ftp-area-${areaId}`);
            });

            socket.on('leave-area', (areaId) => {
                socket.leave(`ftp-area-${areaId}`);
                console.log(`🔎 [FTP] Client ${socket.id} left ftp-area-${areaId}`);
            });

            // Manual trigger to process a specific area now
            socket.on('ftp-refresh-area', async (areaId) => {
                try {
                    console.log(`🔄 [FTP] Manual refresh for area ${areaId}`);
                    await this.processAreaData(areaId);
                    socket.emit('ftp-refresh-complete', { areaId, success: true });
                } catch (error) {
                    socket.emit('ftp-refresh-complete', { areaId, success: false, error: error.message });
                }
            });

            socket.on('disconnect', () => {
                console.log(`🔌 [FTP] Client disconnected: ${socket.id}`);
                this.connectedClients.delete(socket.id);
            });
        });
    }

    // Periodically poll all areas that have an FTP server configured
    startPolling() {
        if (this.poller) return;
        const enabled = (process.env.ENABLE_FTP_WS_POLL || 'true') === 'true';
        if (!enabled) {
            console.log('[FTP] WebSocket polling disabled');
            return;
        }

        const run = async () => {
            if (this.isPolling) return;
            this.isPolling = true;
            try {
                const areas = await Area.find({ ftpServer: { $ne: null } }).select('_id');
                for (const area of areas) {
                    await this.processAreaData(area._id.toString());
                }
            } catch (error) {
                console.error('❌ [FTP] Polling error:', error);
            } finally {
                this.isPolling = false;
            }
        };

        // Run immediately, then on interval
        run();
        this.poller = setInterval(run, this.pollIntervalMinutes * 60 * 1000);
        console.log(`[FTP] Polling every ${this.pollIntervalMinutes} minute(s)`);
    }

    stopPolling() {
        if (this.poller) {
            clearInterval(this.poller);
            this.poller = null;
        }
    }

    // Process one area via FTP fetcher and notify clients
    async processAreaData(areaId) {
        try {
            // Use the existing fetcher which applies savedTimestamp logic
            await fetchDataFtpServer(areaId);

            // Notify clients listening to this area
            this.io.to(`ftp-area-${areaId}`).emit('ftp-data-updated', {
                areaId,
                timestamp: new Date().toISOString(),
                message: 'New FTP data processed'
            });
        } catch (error) {
            console.error(`❌ [FTP] Error processing area ${areaId}:`, error);
            this.io.to(`ftp-area-${areaId}`).emit('ftp-data-error', {
                areaId,
                timestamp: new Date().toISOString(),
                error: error.message
            });
        }
    }

    // Utility
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }

    getActiveRooms() {
        if (!this.io) return [];
        const rooms = [];
        this.io.sockets.adapter.rooms.forEach((value, key) => {
            if (key.startsWith('ftp-area-')) {
                rooms.push({ areaId: key.replace('ftp-area-', ''), clientCount: value.size });
            }
        });
        return rooms;
    }
}

// Singleton
const webSocketServiceFtp = new WebSocketServiceFtp();

export { WebSocketServiceFtp, webSocketServiceFtp };