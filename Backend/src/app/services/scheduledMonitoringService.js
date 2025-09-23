import cron from 'node-cron';
import Vehicle from '../models/Vehicle.js';
import Notification from '../models/Notification.js';
import Blacklist from '../models/Blacklist.js';
import Record from '../models/Record.js';
import dbConnect from '../../config/db/index.js';
import { convertToTimeZone } from './convertTimeZone/sydneyTimeZoneConvert.js';

class ScheduledMonitoringService {
    constructor() {
        this.isRunning = false;
        this.task = null;
    }

    /**
     * Start the scheduled monitoring service
     * Runs every 1 minute to check for vehicles parked longer than 24 hours
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
        console.log('Scheduled monitoring service started - checking every 1 minute');
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
            // await dbConnect();

            // 24 hours
            const overTime = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
            
            console.log("Check long parked vehicles over time: ", convertToTimeZone(overTime, 'Australia/Sydney'));

            // Find vehicles that have been parked for more than 24 hours
            // Only check vehicles that are still in APPROACHING status (haven't left)
            const longParkedVehicles = await Vehicle.find({
                entryTime: { $lt: overTime }
            }).populate('areaId', 'name location businessId');

            console.log(`Found ${longParkedVehicles.length} vehicles parked for more than 24 hours`);

            // Process each long-parked vehicle
            for (const vehicle of longParkedVehicles) {
                await this.processLongParkedVehicle(vehicle);
            }

        } catch (error) {
            console.error('Error in checkLongParkedVehicles:', error);
        }
    }

    /**
     * Create a notification for a vehicle that has been parked for more than 24 hours
     * @param {Object} vehicle - The vehicle object with populated areaId
     */
    async processLongParkedVehicle(vehicle) {
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
            
            const durationText = parkedDays > 0 
                ? `${parkedDays} day${parkedDays > 1 ? 's' : ''} and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`
                : `${parkedHours} hour${parkedHours !== 1 ? 's' : ''}`;
            
            // 1. Create notification
            await this.createLongParkingNotification(vehicle, durationText);

            // 2. Create blacklist entry
            await this.createBlacklistEntry(vehicle, durationText);

            // 3. Update record with leaving time
            await this.updateRecordWithLeavingTime(vehicle);

            // 4. Remove vehicle from vehicles collection
            await Vehicle.findByIdAndDelete(vehicle._id);

            console.log(`Processed long-parked vehicle ${plateNumber}: blacklisted, removed from vehicles, and record updated`);

        } catch (error) {
            console.error(`Error creating long parking notification for vehicle ${vehicle.plateNumber}:`, error);
        }
    }

    /**
     * Create a notification for over 24 hours parked vehicle
     * @param {Object} vehicle
     * @param {String} durationText 
     */
    async createLongParkingNotification(vehicle, durationText) {
        try {
            const { areaId, plateNumber } = vehicle;

            const notificationData = {
                areaId: areaId._id,
                status: 'unread',
                message: `Vehicle ${plateNumber} has been parked in ${areaId.name} for ${durationText} and has been automatically added too blacklist and updated database record.`,
                type: 'over_24_hours_long_parking'

            };

            await Notification.create(notificationData);
            console.log(`Created over 24 hours long parking notification for vehicle ${plateNumber} in area ${areaId.name}`);

        } catch (error) {
            console.error(`Error creating over 24 hours long parking notification for vehicle ${vehicle.plateNumber}:`, error);
        }
    }

    /**
     * Create a blacklist for over 24 hours parked vehicle
     * @param {Object} vehicle - The vehicle object with populated areaId
     * @param {String} durationText - Formatted duration text
     */
    async createBlacklistEntry(vehicle, durationText) {
        try {
            const { areaId, plateNumber, entryTime } = vehicle;

            // Check if vehicle is already blacklisted
            // const existingBlacklist = await Blacklist.findOne({
            //     businessId: areaId.businessId,
            //     plateNumber: plateNumber
            // });

            // if (existingBlacklist) {
            //     console.log(`Vehicle ${plateNumber} is already blacklisted`);
            //     return;
            // }

            const blacklistData = {
                businessId: areaId.businessId,
                areaId: areaId._id,
                plateNumber: plateNumber,
                reason: `Stayed over 24 hours from ${entryTime.toISOString()} to ${new Date().toISOString()} (${durationText})`
            };

            await Blacklist.create(blacklistData);
            console.log(`Created blacklist entry for vehicle ${plateNumber}`);

        } catch (error) {
            console.error(`Error creating blacklist entry for vehicle ${vehicle.plateNumber}:`, error);
        }
    }

    /**
     * Update the record with leaving time for the long-parked vehicle
     * @param {Object} vehicle - The vehicle object with populated areaId
     */
    async updateRecordWithLeavingTime(vehicle) {
        try {
            const { areaId, plateNumber, country, entryTime } = vehicle;
            const leavingTime = new Date();

            // Find the open record (without leaving time) for this vehicle
            const openRecord = await Record.findOne({
                areaId: areaId._id.toString(),
                plateNumber: plateNumber,
                entryTime: entryTime,
                leavingTime: null
            });

            if (openRecord) {
                // Calculate duration in minutes
                const duration = Math.floor((leavingTime.getTime() - entryTime.getTime()) / (1000 * 60));

                // Update the record with leaving time and duration
                await Record.findByIdAndUpdate(openRecord._id, {
                    leavingTime: leavingTime,
                    duration: duration
                });

                console.log(`Updated record for vehicle ${plateNumber} with leaving time and duration: ${duration} minutes`);
            } else {
                console.log(`No open record found for vehicle ${plateNumber}`);
            }

        } catch (error) {
            console.error(`Error updating record for vehicle ${vehicle.plateNumber}:`, error);
        }
    }

}

export { ScheduledMonitoringService };