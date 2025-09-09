import express from 'express';
import { ScheduledFtpService } from '../app/services/scheduledFtpService.js';
import { ScheduledSimulationService } from '../app/services/scheduledSimulationService.js';
import { WebSocketService } from '../app/services/webSocketServiceSimulation.js';

const router = express.Router();

// Initialize scheduler instances
const scheduledFtpService = new ScheduledFtpService();
const scheduledSimulationService = new ScheduledSimulationService();
const webSocketService = new WebSocketService();

// ============= Websocket ROUTES =============
// WebSocket status
router.get('/websocket/status', (req, res) => {
    try {
        const status = {
            connectedClients: webSocketService.getConnectedClientsCount(),
            activeRooms: webSocketService.getActiveRooms()
        };
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Manually trigger WebSocket processing for an area
router.post('/websocket/trigger/:areaId', async (req, res) => {
    try {
        const { areaId } = req.params;
        const result = await webSocketService.triggerAreaProcessing(areaId);
        
        if (result.success) {
            res.json({
                success: true,
                message: result.message
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});


// ============= FTP SCHEDULER ROUTES =============

// Get FTP scheduler status
router.get('/ftp/status', (req, res) => {
    try {
        const status = scheduledFtpService.getStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start FTP scheduler
router.post('/ftp/start', (req, res) => {
    try {
        scheduledFtpService.startScheduledProcessing();
        res.json({
            success: true,
            message: 'FTP scheduler started successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Stop FTP scheduler
router.post('/ftp/stop', (req, res) => {
    try {
        scheduledFtpService.stopScheduledProcessing();
        res.json({
            success: true,
            message: 'FTP scheduler stopped successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Manually trigger FTP processing
router.post('/ftp/trigger', async (req, res) => {
    try {
        await scheduledFtpService.triggerManualProcessing();
        res.json({
            success: true,
            message: 'FTP processing triggered successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============= SIMULATION SCHEDULER ROUTES =============

// Get simulation scheduler status
router.get('/simulation/status', (req, res) => {
    try {
        const status = scheduledSimulationService.getStatus();
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start simulation scheduler
router.post('/simulation/start', (req, res) => {
    try {
        scheduledSimulationService.startScheduledProcessing();
        res.json({
            success: true,
            message: 'Simulation scheduler started successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Stop simulation scheduler
router.post('/simulation/stop', (req, res) => {
    try {
        scheduledSimulationService.stopScheduledProcessing();
        res.json({
            success: true,
            message: 'Simulation scheduler stopped successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Manually trigger simulation processing
router.post('/simulation/trigger', async (req, res) => {
    try {
        await scheduledSimulationService.triggerManualProcessing();
        res.json({
            success: true,
            message: 'Simulation processing triggered successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============= COMBINED SCHEDULER ROUTES =============

// Get status of both schedulers
router.get('/status', (req, res) => {
    try {
        const ftpStatus = scheduledFtpService.getStatus();
        const simulationStatus = scheduledSimulationService.getStatus();
        
        res.json({
            success: true,
            data: {
                ftp: ftpStatus,
                simulation: simulationStatus
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start both schedulers
router.post('/start', (req, res) => {
    try {
        scheduledFtpService.startScheduledProcessing();
        scheduledSimulationService.startScheduledProcessing();
        
        res.json({
            success: true,
            message: 'Both schedulers started successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Stop both schedulers
router.post('/stop', (req, res) => {
    try {
        scheduledFtpService.stopScheduledProcessing();
        scheduledSimulationService.stopScheduledProcessing();
        
        res.json({
            success: true,
            message: 'Both schedulers stopped successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
