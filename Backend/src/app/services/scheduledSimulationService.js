import { processAllSimulationData } from '../scripts/simulation/simulationDataProcessingScript.js';

// Helper function to format date in Australian timezone for logging
function formatAustralianTime(date) {
    return date.toLocaleString('en-AU', {
        timeZone: 'Australia/Sydney',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

class ScheduledSimulationService {
    constructor() {
        this.scheduler = null;
        this.isRunning = false;
        this.lastRun = null;
        this.nextRun = null;
    }

    // Start the scheduled simulation processing
    startScheduledProcessing() {
        console.log('Starting scheduled simulation processing');

        let enableScheduling = process.env.ENABLE_SCHEDULED_SIMULATION === 'true';
        const intervalMinutes = parseInt(process.env.SIMULATION_SCHEDULE_INTERVAL) || 5; // default 5 minutes

        // enable by hand
        enableScheduling = true;

        if (!enableScheduling) {
            console.log('Scheduled simulation processing is disabled');
            return;
        }

        console.log(`[${formatAustralianTime(new Date())}] 🎮 Starting scheduled simulation processing every ${intervalMinutes} minutes`);

        // Process immediately on startup
        this.runSimulationProcessing();

        // Set up recurring schedule
        this.scheduler = setInterval(() => {
            this.runSimulationProcessing();
        }, intervalMinutes * 60 * 1000);

        // Calculate next run time
        this.calculateNextRun(intervalMinutes);
    }

    // Stop the scheduled processing
    stopScheduledProcessing() {
        if (this.scheduler) {
            clearInterval(this.scheduler);
            this.scheduler = null;
            this.isRunning = false;
            console.log('Scheduled simulation processing stopped');
        }
    }

    // Run simulation processing for all areas
    async runSimulationProcessing() {
        if (this.isRunning) {
            console.log(`[${formatAustralianTime(new Date())}] ⚠️ Simulation processing already running, skipping...`);
            return;
        }

        this.isRunning = true;
        this.lastRun = new Date();

        try {
            console.log(`[${formatAustralianTime(new Date())}] 🔄 Starting scheduled simulation data processing...`);
            
            // Process all areas with simulation data
            await processAllSimulationData();
            
            console.log(`[${formatAustralianTime(new Date())}] ✅ Scheduled simulation processing completed successfully`);

        } catch (error) {
            console.error(`[${formatAustralianTime(new Date())}] ❌ Error during scheduled simulation processing:`, error);
        } finally {
            this.isRunning = false;
            this.calculateNextRun(parseInt(process.env.SIMULATION_SCHEDULE_INTERVAL) || 5);
        }
    }

    // Calculate next run time
    calculateNextRun(intervalMinutes) {
        const now = new Date();
        this.nextRun = new Date(now.getTime() + (intervalMinutes * 60 * 1000));
    }

    // these functions use for API calling to get the status and trigger the processing from admin or user from web application
    // Get scheduler status
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastRun: this.lastRun,
            nextRun: this.nextRun,
            schedulerActive: this.scheduler !== null
        };
    }

    // Manually trigger processing
    async triggerManualProcessing() {
        console.log(`[${formatAustralianTime(new Date())}] 🔧 Manual simulation processing triggered`);
        await this.runSimulationProcessing();
    }
}

export { ScheduledSimulationService };
