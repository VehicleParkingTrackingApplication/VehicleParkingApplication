import { Client } from "basic-ftp";
import csvParser from "csv-parser";
import { PassThrough } from "stream";
import mongoose from "mongoose";
import Area from "../models/Area.js";
import Record from "../models/Record.js";
import Vehicle from "../models/Vehicle.js";
import Blacklist from "../models/Blacklist.js";
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

// Helper function to update area's savedTimestamp
async function updateAreaTimestamp(areaId, newTimestamp) {
    try {
        await Area.updateOne(
            { _id: areaId }, 
            { $set: { savedTimestamp: newTimestamp.toISOString() } }
        );
        console.log(`Updated area's savedTimestamp to ${newTimestamp.toISOString()} (${formatAustralianTime(newTimestamp)} AEST)`);
    } catch (error) {
        console.error('Error updating area timestamp:', error);
    }
}

// Function to check the similarity of platenumbers
function calulateSimilarityPlatenumber(plateNumber1, plateNumber2) {
    if (!plateNumber1 || !plateNumber2) {
        return 0;
    }
    // Normalize plate numbers (remove spaces, convert to uppercase)
    // const normalized1 = plateNumber1.replace(/\s/g, '').toUpperCase();
    // const normalized2 = plateNumber1.replace(/\s/g, '').toUpperCase();

    let similarity = 0;
    for (let i = 0; i < plateNumber1.length; i++) {
        if (plateNumber1[i] === plateNumber2[i]) {
            similarity += 1;
        }
    }
    // number of match characters / total number of characters
    return similarity / plateNumber1.length;
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
                                
                                // Create/Update Records using entryTime/leavingTime model
                                if (!row.plateNumber || row.plateNumber.trim() === "") {
                                    console.error('Failed to import record: plateNumber is missing.', row);
                                    return;
                                }

                                // =========== ADD condition to check confidence and angle

                                try {
                                    if (row.status === 'APPROACHING') {
                                         // Find out if a vehicle still exist means camera missed the vehicle when it leave the parking area
                                        const parkingVehicle = await Vehicle.findOne({ areaId, plateNumber: row.plateNumber }).sort({ entryTime: -1 });
                                        if (parkingVehicle) {
                                            await Vehicle.deleteOne({ areaId, plateNumber: row.plateNumber });
                                        }
                                        // check is that the Record have an vehicle that is still parking
                                        const openRecord = await Record.findOne({ areaId, plateNumber: row.plateNumber, leavingTime: null });
                                        if (openRecord) {
                                            // Calculate duration and convert into minute unit
                                            const duration = Math.max(0, Math.round((rowDateTime - openRecord.entryTime) / (1000 * 60)));
                                            await Record.updateOne({ _id: openRecord._id }, { 
                                                $set: { 
                                                    leavingTime: rowDateTime,
                                                    duration: duration
                                                } 
                                            });
                                        }
                                        
                                        // Create new Vehicle object for approaching vehicle
                                        await Vehicle.create({
                                            areaId,
                                            plateNumber: row.plateNumber,
                                            country: row.country || 'AUS',
                                            image: row.image,
                                            entryTime: rowDateTime
                                        });

                                        // Create new Record object for approaching vehicle
                                        await Record.create({
                                            areaId,
                                            plateNumber: row.plateNumber,
                                            country: row.country || 'AUS',
                                            confidence: Number(row.confidence) || 85,
                                            angle: Number(row.angle) || 0,
                                            image: row.image,
                                            entryTime: rowDateTime,
                                            leavingTime: null,
                                            duration: 0
                                        });
                                        
                                    } else if (row.status === 'LEAVING') {
                                        // if the plate number is in the Vehicle collection
                                        const parkingVehicle = await Vehicle.findOne({ areaId, plateNumber: row.plateNumber });
                                        if (parkingVehicle) {
                                            // Delete the vehicle parking in the area
                                            await Vehicle.deleteOne({ areaId, plateNumber: row.plateNumber });
                                        } else {
                                            // Find the plate number has nearly same as the the current plate number
                                            // Because the confidence of data
                                            const parkingVehicles = await Vehicle.find({ areaId });
                                            let similarPlateNumber = null;
                                            for (const vehicle of parkingVehicles) {
                                                if (calulateSimilarityPlatenumber(vehicle.plateNumber, row.plateNumber) > 0.8) {
                                                    similarPlateNumber = vehicle.plateNumber;
                                                    await Vehicle.deleteOne({ areaId, plateNumber: vehicle.plateNumber });
                                                    break;
                                                }
                                            }
                                            
                                            // find the open record
                                            const openRecord = await Record.findOne({ areaId, plateNumber: similarPlateNumber, leavingTime: null });

                                            // Found the similar plate number in the Vehicle collection, use it to update Record collection
                                            if (openRecord) {
                                                const duration = Math.max(0, Math.round((rowDateTime - openRecord.entryTime) / (1000 * 60)));
                                                await Record.updateOne({ areaId, plateNumber: similarPlateNumber }, { $set: { leavingTime: rowDateTime, duration: duration } });
                                            } else {
                                                // No matching vehicle found and no similar plate number found
                                                // Add this leaving event to blacklist
                                                try {
                                                    // Check if this plate number is already in blacklist for this business
                                                    const existingBlacklist = await Blacklist.findOne({ 
                                                        businessId: area.businessId, 
                                                        plateNumber: row.plateNumber 
                                                    });
                                                    
                                                    if (!existingBlacklist) {
                                                        await Blacklist.create({
                                                            businessId: area.businessId,
                                                            plateNumber: row.plateNumber,
                                                            areaId,
                                                            reason: `Unauthorized exit detected - vehicle left without proper entry record at ${formatAustralianTime(rowDateTime)}`
                                                        });
                                                        console.log(`Added to blacklist: ${row.plateNumber} - Unauthorized exit detected`);
                                                    }
                                                } catch (blacklistError) {
                                                    console.error('Error adding to blacklist:', blacklistError);
                                                }
                                            }
                                        }
                                    }
                                    
                                    // Update area's savedTimestamp after successfully processing this record
                                    // can improve the update capacity by just increase 1 or decrease 1 for faster, not need to count all again
                                    await updateAreaTimestamp(areaId, rowDateTime);
                                    await updateAreaCapacity(areaId, false);
                                    
                                } catch (err) {
                                    console.error('Vehicle and Record updated failed:', err.message, row);
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
    } catch (err) {
        console.error("FTP error:", err);
    } finally {
        client.close();
    }
}
