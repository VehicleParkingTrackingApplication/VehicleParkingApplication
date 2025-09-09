import { Client } from "basic-ftp";
import csvParser from "csv-parser";
import { PassThrough } from "stream";
import mongoose from "mongoose";
import Area from "../models/Area.js";
import Record from "../models/Record.js";
import Vehicle from "../models/Vehicle.js";
import dotenv from 'dotenv';

// load environment variables
dotenv.config();

const MONGO_URI_Sample = 'mongodb+srv://binh:123@cluster0.lcfx9nt.mongodb.net/car_parking?retryWrites=true&w=majority&appName=Cluster0';
const MONGO_URI = process.env.CONNECTION_STRING || MONGO_URI_Sample;

function mergeDateTime(date, time) {
    let datePart = date;
    let timePart = time.replace(/-/g, ':').replace(/:(\d{3})$/, '.$1');
    if (date.includes('/')) {
        const [day, month, year] = date.split('/');
        datePart = `${year}-${month}-${day}`;
    }
    if (!timePart.includes('.')) timePart += '.000';
    
    // Create date string with Australian timezone (+10)
    const dateTimeString = `${datePart}T${timePart}+10:00`;
    
    // Parse the date with explicit timezone
    const dateObj = new Date(dateTimeString);
    
    // Validate the date is valid
    if (isNaN(dateObj.getTime())) {
        console.error(`Invalid date/time: ${dateTimeString}`);
        // Fallback to local timezone if parsing fails
        return new Date(`${datePart}T${timePart}`);
    }
    
    return dateObj;
}

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

// Function to update area capacity when vehicles enter or leave
async function updateAreaCapacity(areaId, isEntering) {
    try {
        const area = await Area.findById(areaId);
        if (!area) {
            console.error('Area not found for capacity update:', areaId);
            return;
        }

        // Get current vehicle count
        const currentVehicleCount = await Vehicle.countDocuments({ areaId });
        
        // Update the area's currentCapacity field
        area.currentCapacity = currentVehicleCount;
        await area.save();
        
        console.log(`Updated area ${area.name} capacity: ${currentVehicleCount}/${area.capacity} vehicles`);
        
        return currentVehicleCount;
    } catch (error) {
        console.error('Error updating area capacity:', error);
        return null;
    }
}

// input areaId and options to access that ftp server to fetch data
export async function fetchDataFtpServer(areaId, options = {}) {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI);
    }
    // access the area collection from areaId to get the ftp-server info
    const area = await Area.findById(areaId).populate('ftpServer');
    if (!area) {
        console.error("Area not found");
        return;
    }
    const ftpInfo = area.ftpServer;
    const saveTimestamp = area.savedTimestamp && area.savedTimestamp.trim() !== '' ? area.savedTimestamp.trim() : null;
    let saveDateObj = null;
    if (saveTimestamp) {
        saveDateObj = new Date(saveTimestamp);
    }
    if (!ftpInfo) {
        console.error("FTP server info not found for this area");
        return;
    }
    const client = new Client();
    client.ftp.verbose = true;
    let latestProcessedDate = saveDateObj;
    try {
        await client.access({
            host: ftpInfo.host,
            port: ftpInfo.port,
            user: ftpInfo.user,
            password: ftpInfo.password,
            secure: ftpInfo.secure,
            secureOptions: ftpInfo.secureOptions,
            folder: ftpInfo.folder || "CF02200-200034BE004"
        });
        const targetFolder = ftpInfo.folder || "CF02200-200034BE004";
        await client.cd(targetFolder);
        const contents = await client.list();
        const csvFiles = contents
            .filter(item => item.type === 1 && item.name.toLowerCase().endsWith(".csv"))
            .sort((a, b) => new Date(a.modifiedAt) - new Date(b.modifiedAt));
        for (const file of csvFiles) {
            const passThrough = new PassThrough();
            const downloadPromise = client.downloadTo(passThrough, file.name);
            await new Promise((resolve, reject) => {
                let headers = [
                    'date',
                    'time',
                    'plateNumber',
                    'country',
                    'confidence',
                    'angle',
                    'image',
                    'status',
                    'vehicleClass'
                ];
                const asyncOps = [];
                passThrough
                    .pipe(csvParser({
                        separator: ';',
                        headers: headers,
                        strict: false,
                        skipLines: 0
                    }))
                    .on('data', (row) => {
                        const rowDateTime = mergeDateTime(row.date, row.time);
                        let shouldProcess = false;
                        if (!saveDateObj) {
                            shouldProcess = true;
                        } else {
                            if (rowDateTime > saveDateObj) {
                                shouldProcess = true;
                            }
                        }
                        if (shouldProcess) {
                            asyncOps.push((async () => {
                                // Log datetime and plateNumber for tracking
                                console.log(`Processing: datetime=${formatAustralianTime(rowDateTime)} (AEST), plateNumber=${row.plateNumber}`);
                                                                
                                // Insert into Records collection
                                if (!row.plateNumber || row.plateNumber.trim() === "") {
                                    console.error('Failed to import record: plateNumber is missing.', row);
                                    return;
                                }
                                let duration = 0;
                                if (row.status === 'LEAVING') {
                                    try {
                                        const existingVehicle = await Vehicle.findOne({
                                            areaId,
                                            plateNumber: row.plateNumber
                                        })
                                        if (existingVehicle && existingVehicle.datetime) {
                                            // Calculate duration in milliseconds, then convert to minutes
                                            duration = Math.round((rowDateTime - existingVehicle.datetime) / (1000 * 60));
                                        }
                                    } catch (err) {
                                        console.error('Error calculating duration:', err.message);
                                    }
                                }
                                try {    
                                    await Record.create({
                                        areaId,
                                        datetime: rowDateTime,
                                        plateNumber: row.plateNumber,
                                        country: row.country || 'AUS',
                                        confidence: Number(row.confidence) || 85,
                                        angle: Number(row.angle) || 0,
                                        image: row.image,
                                        status: row.status,
                                        duration: duration
                                    });
                                    console.log('Success: Imported record for plateNumber', row.plateNumber);
                                } catch (err) {
                                    console.error('Failed to import record:', err.message, row);
                                }
                                // Maintain Vehicles collection
                                if (row.status === 'APPROACHING') {
                                    const exists = await Vehicle.findOne({ areaId, plateNumber: row.plateNumber });
                                    if (exists) {
                                        // Vehicle already exists - delete old record first (camera might have missed the LEAVING event)
                                        try {
                                            await Vehicle.deleteOne({ areaId, plateNumber: row.plateNumber });
                                            console.log('Success: Removed existing vehicle for plateNumber', row.plateNumber, '(camera missed previous LEAVING event)');
                                        } catch (err) {
                                            console.error('Failed to remove existing vehicle:', err.message, row);
                                        }
                                    }
      
                                    // Create new vehicle record (whether it existed before or not)
                                    try {
                                        await Vehicle.create({
                                            areaId,
                                            plateNumber: row.plateNumber,
                                            country: row.country || 'AUS',
                                            image: row.image,
                                            datetime: rowDateTime,
                                            status: row.status
                                        });
                                         // New vehicle entering - increment capacity
                                        await updateAreaCapacity(areaId, true);
                                        console.log('Success: Added vehicle for plateNumber', row.plateNumber);
                                    } catch (err) {
                                        console.error('Failed to add vehicle:', err.message, row);
                                    }
                                } else if (row.status === 'LEAVING') {
                                    try {
                                        await Vehicle.deleteOne({ areaId, plateNumber: row.plateNumber });
                                        console.log('Success: Removed vehicle for plateNumber', row.plateNumber);
                                        // Update area capacity when vehicle leaves
                                        await updateAreaCapacity(areaId, false);
                                    } catch (err) {
                                        console.error('Failed to remove vehicle:', err.message, row);
                                    }
                                }
                                // Track the latest processed datetime
                                if (!latestProcessedDate || rowDateTime > latestProcessedDate) {
                                    latestProcessedDate = rowDateTime;
                                }
                            })());
                        }
                    })
                    .on('end', async () => {
                        await Promise.all(asyncOps);
                        resolve();
                    })
                    .on('error', reject);
            });
            await downloadPromise;
        }
        // After processing all files, update area's savedTimestamp if we processed any new records
        if (latestProcessedDate && (!saveDateObj || latestProcessedDate > saveDateObj)) {
            area.savedTimestamp = latestProcessedDate.toISOString();
            await area.save();
            console.log(`Updated area's savedTimestamp to ${area.savedTimestamp} (${formatAustralianTime(latestProcessedDate)} AEST)`);
        }
    } catch (err) {
        console.error("FTP error:", err);
    } finally {
        client.close();
    }
}
