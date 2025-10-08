import { Client } from "basic-ftp";
import csvParser from "csv-parser";
import { PassThrough } from "stream";
import Area from "../models/Area.js";
import Record from "../models/Record.js";
import Vehicle from "../models/Vehicle.js";
import Blacklist from "../models/Blacklist.js";
import dotenv from 'dotenv';
import { toSydneyISO } from "../services/convertTimeZone/sydneyTimeZoneConvert.js";

// load environment variables
dotenv.config();

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

// // Buffer to collect plate numbers within 5 seconds
// const plateBuffer = new Map(); // areaId -> { plateNumbers: [], lastUpdate: timestamp, status: 'APPROACHING'|'LEAVING' }

// // Function to process buffered plate numbers
// async function processBufferedPlate(areaId, plateNumber, status, rowDateTime, row) {
//     try {
//         if (status === 'APPROACHING') {
//             // Process Vehicle collection first - delete existing vehicle
//             const existingVehicle = await Vehicle.findOne({ areaId, plateNumber });
//             if (existingVehicle) {
//                 await Vehicle.deleteOne({ areaId, plateNumber });
//             }
            
//             // Process Record collection - close the one open record (if exists)
//             const openRecord = await Record.findOne({ areaId, plateNumber, leavingTime: null });
//             if (openRecord) {
//                 const duration = Math.max(0, Math.round((rowDateTime - openRecord.entryTime) / (1000 * 60)));
//                 await Record.updateOne({ _id: openRecord._id }, { 
//                     $set: { 
//                         leavingTime: rowDateTime,
//                         duration: duration
//                     } 
//                 });
//             }
            
//             // Create new Vehicle object for approaching vehicle
//             await Vehicle.create({
//                 areaId: areaId,
//                 plateNumber: plateNumber,
//                 country: row.country || 'AUS',
//                 image: row.image,
//                 entryTime: rowDateTime
//             });

//             // Create new Record object for approaching vehicle
//             await Record.create({
//                 areaId: areaId,
//                 plateNumber: plateNumber,
//                 country: row.country || 'AUS',
//                 confidence: Number(row.confidence) || 85,
//                 angle: Number(row.angle) || 0,
//                 image: row.image,
//                 entryTime: rowDateTime,
//                 leavingTime: null,
//                 duration: 0
//             });
            
//         } else if (status === 'LEAVING') {
//             // Process Vehicle collection first - delete existing vehicle (if exists)
//             const existingVehicle = await Vehicle.findOne({ areaId, plateNumber });
//             if (existingVehicle) {
//                 await Vehicle.deleteOne({ areaId, plateNumber });
//             }
            
//             // Process Record collection - close the one open record (if exists)
//             const openRecord = await Record.findOne({ areaId, plateNumber, leavingTime: null });
//             if (openRecord) {
//                 const duration = Math.max(0, Math.round((rowDateTime - openRecord.entryTime) / (1000 * 60)));
//                 await Record.updateOne({ _id: openRecord._id }, { 
//                     $set: { 
//                         leavingTime: rowDateTime,
//                         duration: duration
//                     } 
//                 });
//             }
//         }
        
//         // Update area's savedTimestamp and capacity
//         await updateAreaTimestamp(areaId, rowDateTime);
//         await updateAreaCapacity(areaId, false);
        
//     } catch (err) {
//         console.error('Error processing buffered plate:', err.message, { areaId, plateNumber, status });
//     }
// }

// // Function to check and process expired buffers
// async function checkExpiredBuffers() {
//     const now = Date.now();
//     const fiveSeconds = 5 * 1000;
    
//     for (const [areaId, buffer] of plateBuffer.entries()) {
//         if (now - buffer.lastUpdate > fiveSeconds) {
//             // Buffer expired, process the last plate number
//             if (buffer.plateNumbers.length > 0) {
//                 const lastPlate = buffer.plateNumbers[buffer.plateNumbers.length - 1];
//                 console.log(`Processing buffered plate ${lastPlate.plateNumber} (${buffer.status}) after 5-second buffer expired`);
//                 await processBufferedPlate(areaId, lastPlate.plateNumber, buffer.status, lastPlate.rowDateTime, lastPlate.row);
//             }
//             plateBuffer.delete(areaId);
//         }
//     }
// }

// input areaId and options to access that ftp server to fetch data
export async function fetchDataFtpServer(areaId, options = {}) {
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
        // saveDateObj = new Date(toSydneyISO(saveTimestamp));
        const parsed = new Date(saveTimestamp);
        if (!isNaN(parsed.getTime())) {
            saveDateObj = parsed;
        } else {
            console.error('Invalid savedTimestamp on area, ignoring:', saveTimestamp);
        }
    }
    if (!ftpInfo) {
        console.error("FTP server info not found for this area");
        return;
    }
    const client = new Client();
    client.ftp.verbose = true;
    let latestProcessedDate = saveDateObj;
    console.log(`Processing area ${areaId}, ftpInfo: ${ftpInfo}, saveDateObj: ${saveDateObj}`);
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
            .filter(item => item.type === 1 && item.name.toLowerCase().endsWith(".csv"));
            // .sort((a, b) => new Date(a.modifiedAt) - new Date(b.modifiedAt));
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
                        if (!(rowDateTime instanceof Date) || isNaN(rowDateTime.getTime())) {
                            console.error('Skipping row due to invalid datetime:', row);
                            return;
                        }
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
                                        // Process Vehicle collection first - delete existing vehicle
                                        const existingVehicle = await Vehicle.findOne({ areaId, plateNumber: row.plateNumber });
                                        if (existingVehicle) {
                                            await Vehicle.deleteOne({ areaId, plateNumber: row.plateNumber });
                                        }
                                        
                                        // Process Record collection - close the one open record (if exists)
                                        const openRecord = await Record.findOne({ areaId, plateNumber: row.plateNumber, leavingTime: null });
                                        if (openRecord) {
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
                                            areaId: areaId,
                                            plateNumber: row.plateNumber,
                                            country: row.country || 'AUS',
                                            image: row.image,
                                            entryTime: rowDateTime
                                        });

                                        // Create new Record object for approaching vehicle
                                        await Record.create({
                                            areaId: areaId,
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
                                        //  Process Vehicle collection first - delete existing vehicle (if exists)
                                        const existingVehicle = await Vehicle.findOne({ areaId, plateNumber: row.plateNumber });
                                        if (existingVehicle) {
                                            await Vehicle.deleteOne({ areaId, plateNumber: row.plateNumber });
                                        }
                                        
                                        // Process Record collection - close the one open record (if exists)
                                        const openRecord = await Record.findOne({ areaId, plateNumber: row.plateNumber, leavingTime: null });
                                        if (openRecord) {
                                            const duration = Math.max(0, Math.round((rowDateTime - openRecord.entryTime) / (1000 * 60)));
                                            await Record.updateOne({ _id: openRecord._id }, { 
                                                $set: { 
                                                    leavingTime: rowDateTime,
                                                    duration: duration
                                                } 
                                            });
                                        }
                                        // else {
                                        //     // Find the plate number has nearly same as the the current plate number
                                        //     // Because the confidence of data
                                        //     const parkingVehicles = await Vehicle.find({ areaId: areaId });
                                        //     let similarPlateNumber = null;
                                        //     for (const vehicle of parkingVehicles) {
                                        //         if (calulateSimilarityPlatenumber(vehicle.plateNumber, row.plateNumber) > 0.8) {
                                        //             similarPlateNumber = vehicle.plateNumber;
                                        //             await Vehicle.deleteOne({ areaId, plateNumber: vehicle.plateNumber });
                                        //             break;
                                        //         }
                                        //     }
                                            
                                        //     // find the open record
                                        //     const openRecord = await Record.findOne({ areaId, plateNumber: similarPlateNumber, leavingTime: null });

                                        //     // Found the similar plate number in the Vehicle collection, use it to update Record collection
                                        //     if (openRecord) {
                                        //         const duration = Math.max(0, Math.round((rowDateTime - openRecord.entryTime) / (1000 * 60)));
                                        //         await Record.updateOne({ areaId, plateNumber: similarPlateNumber, entryTime }, { $set: { leavingTime: rowDateTime, duration: duration } });
                                        //     } 
                                        //     // else {
                                        //     //     // No matching vehicle found and no similar plate number found
                                        //     //     await Blacklist.create({
                                        //     //         businessId: area.businessId,
                                        //     //         plateNumber: row.plateNumber,
                                        //     //         areaId,
                                        //     //         reason: `Unauthorized exit detected - vehicle left without proper entry record at ${formatAustralianTime(rowDateTime)}`
                                        //     //     });
                                        //     //     console.log(`Added to blacklist: ${row.plateNumber} - Unauthorized exit detected`);
                                        //     // }
                                        // }
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
                        
                        // Process any remaining buffers before finishing
                        // await checkExpiredBuffers();
                        
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
