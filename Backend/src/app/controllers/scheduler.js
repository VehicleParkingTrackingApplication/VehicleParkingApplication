import { ScheduledFtpService } from '../services/scheduledFtpService.js';
import { ScheduledSimulationService } from '../services/scheduledSimulationService.js';
import { webSocketService } from '../services/webSocketServiceSimulation.js';

// Single shared instances for schedulers
const scheduledFtpService = new ScheduledFtpService();
const scheduledSimulationService = new ScheduledSimulationService();

// ============= WebSocket CONTROLLERS =============
export const getWebSocketStatus = (req, res) => {
    try {
        const status = {
            connectedClients: webSocketService.getConnectedClientsCount(),
            activeRooms: webSocketService.getActiveRooms()
        };
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const triggerWebSocketArea = async (req, res) => {
    try {
        const { areaId } = req.params;
        const result = await webSocketService.triggerAreaProcessing(areaId);
        if (result.success) {
            res.json({ success: true, message: result.message });
        } else {
            res.status(400).json({ success: false, error: result.error });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============= FTP SCHEDULER CONTROLLERS =============
export const getFtpStatus = (req, res) => {
    try {
        const status = scheduledFtpService.getStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const startFtp = (req, res) => {
    try {
        scheduledFtpService.startScheduledProcessing();
        res.json({ success: true, message: 'FTP scheduler started successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const stopFtp = (req, res) => {
    try {
        scheduledFtpService.stopScheduledProcessing();
        res.json({ success: true, message: 'FTP scheduler stopped successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const triggerFtp = async (req, res) => {
    try {
        await scheduledFtpService.triggerManualProcessing();
        res.json({ success: true, message: 'FTP processing triggered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============= SIMULATION SCHEDULER CONTROLLERS =============
export const getSimulationStatus = (req, res) => {
    try {
        const status = scheduledSimulationService.getStatus();
        res.json({ success: true, data: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const startSimulation = (req, res) => {
    try {
        scheduledSimulationService.startScheduledProcessing();
        res.json({ success: true, message: 'Simulation scheduler started successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const stopSimulation = (req, res) => {
    try {
        scheduledSimulationService.stopScheduledProcessing();
        res.json({ success: true, message: 'Simulation scheduler stopped successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const triggerSimulation = async (req, res) => {
    try {
        await scheduledSimulationService.triggerManualProcessing();
        res.json({ success: true, message: 'Simulation processing triggered successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ============= COMBINED CONTROLLERS =============
export const getCombinedStatus = (req, res) => {
    try {
        const ftpStatus = scheduledFtpService.getStatus();
        const simulationStatus = scheduledSimulationService.getStatus();
        res.json({ success: true, data: { ftp: ftpStatus, simulation: simulationStatus } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const startAll = (req, res) => {
    try {
        scheduledFtpService.startScheduledProcessing();
        scheduledSimulationService.startScheduledProcessing();
        res.json({ success: true, message: 'Both schedulers started successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const stopAll = (req, res) => {
    try {
        scheduledFtpService.stopScheduledProcessing();
        scheduledSimulationService.stopScheduledProcessing();
        res.json({ success: true, message: 'Both schedulers stopped successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export default {
    // WebSocket
    getWebSocketStatus,
    triggerWebSocketArea,
    // FTP
    getFtpStatus,
    startFtp,
    stopFtp,
    triggerFtp,
    // Simulation
    getSimulationStatus,
    startSimulation,
    stopSimulation,
    triggerSimulation,
    // Combined
    getCombinedStatus,
    startAll,
    stopAll
};