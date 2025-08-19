import { Client } from "basic-ftp";
import csvParser from "csv-parser";
import { PassThrough } from "stream";
import mongoose from "mongoose";
import Area from "../models/Area.js";
import Record from "../models/Record.js";
import Vehicle from "../models/Vehicle.js";
import { uploadImageToS3, imageExistsInS3 } from "../services/s3Service.js";
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

// Function to download image from FTP and upload to S3
async function processImage(client, csvDate, imageFileName, areaId) {
    let originalPath = null;
    try {
        // Check if image already exists in S3
        const exists = await imageExistsInS3(imageFileName, areaId);
        if (exists) {
            console.log(`Image ${imageFileName} already exists in S3, skipping upload`);
            return `https://${process.env.S3_BUCKET_NAME || 'parking-system-images'}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/areas/${areaId}/${imageFileName}`;
        }

        // Store current path to return to later
        originalPath = await client.pwd();

        // Navigate to the date folder (same name as CSV file)
        const imageFolder = csvDate;
        await client.cd(imageFolder);
        
        // Download the image file
        const imageBuffer = await client.downloadToBuffer(imageFileName);
        
        // Upload to S3
        const s3Url = await uploadImageToS3(imageBuffer, imageFileName, areaId);
        
        console.log(`Successfully processed image: ${imageFileName} -> ${s3Url}`);
        return s3Url;
    } catch (error) {
        console.error(`Error processing image ${imageFileName}:`, error);
        // Return the original image filename as fallback
        return imageFileName;
    } finally {
        // Always return to the original path
        if (originalPath) {
            try {
                await client.cd(originalPath);
            } catch (cdError) {
                console.error('Error returning to original path:', cdError);
            }
        }
    }
}

export async function fetchDataFtpServer(areaId) {
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
            secureOptions: ftpInfo.secureOptions
        });
        const targetFolder = "CF02200-200034BE004";
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
                                                                
                                // Process image first
                                let imageUrl = row.image; // Default to original image name
                                if (row.image && row.image.trim() !== '') {
                                    try {
                                        imageUrl = await processImage(client, row.date, row.image, areaId);
                                    } catch (imageError) {
                                        console.error(`Failed to process image ${row.image}:`, imageError);
                                        // Continue with original image name
                                    }
                                }

                                // Insert into Records collection
                                if (!row.plateNumber || row.plateNumber.trim() === "") {
                                    console.error('Failed to import record: plateNumber is missing.', row);
                                    return;
                                }
                                try {
                                    await Record.create({
                                        areaId,
                                        datetime: rowDateTime,
                                        plateNumber: row.plateNumber,
                                        country: row.country || 'AUS',
                                        confidence: Number(row.confidence) || 85,
                                        angle: Number(row.angle) || 0,
                                        image: imageUrl,
                                        status: row.status
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
                                    } else {
                                        // New vehicle entering - increment capacity
                                        await updateAreaCapacity(areaId, true);
                                    }
                                    
                                    // Create new vehicle record (whether it existed before or not)
                                    try {
                                        await Vehicle.create({
                                            areaId,
                                            plateNumber: row.plateNumber,
                                            country: row.country || 'AUS',
                                            image: row.image,
                                            datetime: rowDateTime
                                        });
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
