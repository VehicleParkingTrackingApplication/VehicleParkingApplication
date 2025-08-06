import { Client } from "basic-ftp";
import csvParser from "csv-parser";
import { PassThrough } from "stream";
import mongoose from "mongoose";
import Area from "../src/app/models/Area.js";
import Record from "../src/app/models/Record.js";
import Vehicle from "../src/app/models/Vehicle.js";
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
    return new Date(`${datePart}T${timePart}`);
}

export async function processFtp(areaId) {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI);
    }
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
                                console.log(`Processing: datetime=${rowDateTime.toISOString()}, plateNumber=${row.plateNumber}`);
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
                                        image: row.image,
                                        status: row.status
                                    });
                                    console.log('Success: Imported record for plateNumber', row.plateNumber);
                                } catch (err) {
                                    console.error('Failed to import record:', err.message, row);
                                }
                                // Maintain Vehicles collection
                                if (row.status === 'APPROACHING') {
                                    const exists = await Vehicle.findOne({ areaId, plateNumber: row.plateNumber });
                                    if (!exists) {
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
                                    }
                                } else if (row.status === 'LEAVING') {
                                    try {
                                        await Vehicle.deleteOne({ areaId, plateNumber: row.plateNumber });
                                        console.log('Success: Removed vehicle for plateNumber', row.plateNumber);
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
            console.log(`Updated area's savedTimestamp to ${area.savedTimestamp}`);
        }
    } catch (err) {
        console.error("FTP error:", err);
    } finally {
        client.close();
    }
}

// let defaultAreaId = process.argv[2] || '687dde8379e977f9d2aaf8ef';
// if (!defaultAreaId) {
//     console.error('Please provide areaId as the first argument');
//     process.exit(1);
// }
// // setInterval(() => processFtp(defaultAreaId), 60 * 1000);
// processFtp(defaultAreaId);


