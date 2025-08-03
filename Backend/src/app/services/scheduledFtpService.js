import { FtpService } from './ftpService.js';

class ScheduledFtpService {
    constructor() {
        this.scheduler = null;
        this.isRunning = false;
        this.lastRun = null;
        this.nextRun = null;
    }

    // Start the scheduled FTP processing
    startScheduledProcessing() {
        const enableScheduling = process.env.ENABLE_SCHEDULED_FTP === 'true';
        const intervalMinutes = parseInt(process.env.FTP_SCHEDULE_INTERVAL) || 60; // default 1 hour
        
        if (!enableScheduling) {
            console.log('Scheduled FTP processing is disabled');
            return;
        }

        console.log(`[${new Date().toISOString()}] 🚀 Starting scheduled FTP processing every ${intervalMinutes} minutes`);

        // Process immediately on startup
        this.runFtpProcessing();

        // Set up recurring schedule
        this.scheduler = setInterval(() => {
            this.runFtpProcessing();
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
            console.log('Scheduled FTP processing stopped');
        }
    }

    // Run FTP processing for configured areas
    async runFtpProcessing() {
        if (this.isRunning) {
            console.log(`[${new Date().toISOString()}] ⚠️ FTP processing already running, skipping...`);
            return;
        }

        this.isRunning = true;
        this.lastRun = new Date();

        try {
            console.log(`[${new Date().toISOString()}] 🔄 Starting scheduled FTP data fetch...`);
            
            // Get area IDs from environment or use default
            const areaIds = process.env.FTP_AREA_IDS ? 
                process.env.FTP_AREA_IDS.split(',') : 
                ['687dde8379e977f9d2aaf8ef'];

            console.log(`[${new Date().toISOString()}] 📋 Processing areas: ${areaIds.join(', ')}`);

            // Process all areas
            const results = await FtpService.processAllAreas(areaIds);
            
            // Log results - only count valid results (not undefined/null)
            const validResults = results.filter(r => r !== undefined && r !== null);
            if (validResults.length > 0) {
                const successCount = validResults.filter(r => r.success).length;
                console.log(`[${new Date().toISOString()}] ✅ Scheduled FTP processing completed: ${successCount}/${validResults.length} areas successful`);
                
                // Log any errors
                const errors = validResults.filter(r => !r.success);
                if (errors.length > 0) {
                    console.error(`[${new Date().toISOString()}] ❌ Areas with errors:`, errors.map(e => `${e.areaId}: ${e.error}`));
                }
            } else {
                console.log(`[${new Date().toISOString()}] ⚠️ No valid results to process`);
            }

        } catch (error) {
            console.error(`[${new Date().toISOString()}] ❌ Error during scheduled FTP processing:`, error);
        } finally {
            this.isRunning = false;
            this.calculateNextRun(parseInt(process.env.FTP_SCHEDULE_INTERVAL) || 60);
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
        console.log(`[${new Date().toISOString()}] 🔧 Manual FTP processing triggered`);
        await this.runFtpProcessing();
    }
}

export { ScheduledFtpService };