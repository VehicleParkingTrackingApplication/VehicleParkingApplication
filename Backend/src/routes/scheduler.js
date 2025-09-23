import express from 'express';
import schedulerController from '../app/controllers/scheduler.js';

const router = express.Router();

// Routes call controller handlers

// ============= Websocket ROUTES =============
// WebSocket status
router.get('/websocket/status', schedulerController.getWebSocketStatus);

// Manually trigger WebSocket processing for an area
router.post('/websocket/trigger/:areaId', schedulerController.triggerWebSocketArea);


// ============= FTP SCHEDULER ROUTES =============

// Get FTP scheduler status
router.get('/ftp/status', schedulerController.getFtpStatus);

// Start FTP scheduler
router.post('/ftp/start', schedulerController.startFtp);

// Stop FTP scheduler
router.post('/ftp/stop', schedulerController.stopFtp);

// Manually trigger FTP processing
router.post('/ftp/trigger', schedulerController.triggerFtp);

// ============= SIMULATION SCHEDULER ROUTES =============

// Get simulation scheduler status
router.get('/simulation/status', schedulerController.getSimulationStatus);

// Start simulation scheduler
router.post('/simulation/start', schedulerController.startSimulation);

// Stop simulation scheduler
router.post('/simulation/stop', schedulerController.stopSimulation);

// Manually trigger simulation processing
router.post('/simulation/trigger', schedulerController.triggerSimulation);

// ============= COMBINED SCHEDULER ROUTES =============

// Get status of both schedulers
router.get('/status', schedulerController.getCombinedStatus);

// Start both schedulers
router.post('/start', schedulerController.startAll);

// Stop both schedulers
router.post('/stop', schedulerController.stopAll);

export default router;
