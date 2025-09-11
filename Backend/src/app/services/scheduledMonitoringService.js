import cron from 'node-cron';
import Vehicle from '../models/Vehicle.js';
import Notification from '../models/Notification.js';
import dbConnect from '../../config/db/index.js';

class ScheduledMonitoringService {
    constructor() {
        this.isRunning = false;
        this.task = null;
    }

    /**
     * Start the scheduled monitoring service
     * Runs every 30 minutes to check for vehicles parked longer than 24 hours
     */
    startScheduledMonitoring() {
        if (this.isRunning) {
            console.log('Scheduled monitoring service is already running');
            return;
        }

        // Schedule task to run every 30 minutes
        this.task = cron.schedule('* * * * *', async () => {
            console.log('Running scheduled vehicle monitoring check...');
            await this.checkLongParkedVehicles();
        }, {
            scheduled: false,
            timezone: 'Australia/Sydney'
        });

        this.task.start();
        this.isRunning = true;
        console.log('Scheduled monitoring service started - checking every 30 minutes');
    }

    /**
     * Stop the scheduled monitoring service
     */
    stopScheduledMonitoring() {
        if (this.task) {
            this.task.stop();
            this.task = null;
        }
        this.isRunning = false;
        console.log('Scheduled monitoring service stopped');
    }

    /**
     * Check for vehicles that have been parked for more than 24 hours
     * and create notifications for them
     */
    async checkLongParkedVehicles() {
        try {
            // Connect to database if not already connected
            await dbConnect();

            // 24 hours
            const overTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            console.log("Check long parked vehicles over time: ", overTime);

            // Find vehicles that have been parked for more than 24 hours
            // Only check vehicles that are still in APPROACHING status (haven't left)
            const longParkedVehicles = await Vehicle.find({
                entryTime: { $lt: overTime }
            }).populate('areaId', 'name location businessId');

            console.log(`Found ${longParkedVehicles.length} vehicles parked for more than 24 hours`);

            // Process each long-parked vehicle
            for (const vehicle of longParkedVehicles) {
                await this.createLongParkingNotification(vehicle);
            }

        } catch (error) {
            console.error('Error in checkLongParkedVehicles:', error);
        }
    }

    /**
     * Create a notification for a vehicle that has been parked for more than 24 hours
     * @param {Object} vehicle - The vehicle object with populated areaId
     */
    async createLongParkingNotification(vehicle) {
        try {
            const { areaId, plateNumber, entryTime } = vehicle;
            
            // Calculate how long the vehicle has been parked
            const parkedDuration = Date.now() - entryTime.getTime();
            const parkedHours = Math.floor(parkedDuration / (1000 * 60 * 60));
            const parkedDays = Math.floor(parkedHours / 24);
            const remainingHours = parkedHours % 24;

            // Check if we already have a recent notification for this vehicle
            const existingNotification = await Notification.findOne({
                areaId: areaId._id,
                message: { $regex: `Vehicle ${plateNumber}` },
                type: 'long_parking',
                status: 'unread'
            }).sort({ createdAt: -1 });
            
            // Only create notification if:
            // 1. No existing unread notification for this vehicle, OR
            // 2. The last notification was created more than 6 hours ago (to avoid spam)
            let shouldCreateNotification = true;
            
            if (existingNotification) {
                const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
                // the existing notification exisit as unread but just created smaller than 6 hours so no create again
                if (existingNotification.createdAt > sixHoursAgo) {
                    shouldCreateNotification = false;
                }
            }

            if (shouldCreateNotification) {
                const durationText = parkedDays > 0 
                    ? `${parkedDays} day${parkedDays > 1 ? 's' : ''} and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
                    : `${parkedHours} hour${parkedHours !== 1 ? 's' : ''}`;

                const notificationData = {
                    areaId: areaId._id,
                    status: 'unread',
                    message: `Vehicle ${plateNumber} has been parked in ${areaId.name} for ${durationText}. Please check if this vehicle needs attention.`,
                    type: 'long_parking',
                    threshold: 24, // 24 hours threshold
                    currentCapacity: 0, // Not applicable for long parking notifications
                    totalCapacity: 0   // Not applicable for long parking notifications
                };

                await Notification.create(notificationData);
                console.log(`Created long parking notification for vehicle ${plateNumber} in area ${areaId.name}`);
            }

        } catch (error) {
            console.error(`Error creating long parking notification for vehicle ${vehicle.plateNumber}:`, error);
        }
    }

    /**
     * Get monitoring service status
     */
    // getStatus() {
    //     return {
    //         isRunning: this.isRunning,
    //         nextRun: this.task ? this.task.nextDate() : null
    //     };
    // }

    /**
     * Manually trigger a monitoring check (for testing purposes)
     */
    async triggerManualCheck() {
        console.log('Manually triggering vehicle monitoring check...');
        await this.checkLongParkedVehicles();
    }
}

export { ScheduledMonitoringService };