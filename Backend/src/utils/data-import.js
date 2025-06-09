import fs from 'fs';
import csv from 'csv-parser';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// import cameraDataSchema from '../app/models/cameraDataSchema.js';
import Record from '../app/models/Record.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Convert the time format from "HH-MM-SS-milliseconds" to "HH:MM:SS.milliseconds"
const formatTime = (dateStr, timeStr) => {
    const [hours, minutes, seconds, milliseconds] = String(timeStr).split('-');
    return new Date(`${dateStr}T${hours}:${minutes}:${seconds}.${milliseconds}`);
};

const importCSVData = async (req, res, filename) => {
    const parkingAreaId = req.query.parkingAreaId;
    console.log("Check query: ", req.query)
    if (!parkingAreaId) {
        throw new Error('Parking area ID is required for data import');
    }

    const results = [];
    const filePath = join(dirname(__dirname), 'public', 'data', filename);

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
        .pipe(
            csv({
                separator: ';',
                headers: [
                    'date',
                    'time',
                    'plateNumber',
                    'country',
                    'confidence',
                    'angle',
                    'image',
                    'status'
                ],
            }),
        )
        .on('data', (data) => {
            // Clean and validate data before pushing
            const cleanedData = {
                areaId: parkingAreaId,
                datetime: formatTime(data.date, data.time),
                plateNumber: data.plateNumber?.trim(),
                country: data.country?.trim() || 'AUS',
                confidence: data.confidence?.trim(),
                angle: data.angle?.trim(),
                image: data.image?.trim(),
                status: data.status?.trim()
            };
            
            // Only push if required fields are present
            if (data.date && data.time && data.plateNumber) {
                results.push(cleanedData);
            } else {
                console.log('Skipped invalid record:', data);
            }
        })
        .on('end', async () => {
            try {
                await Record.insertMany(results);
                console.log(`Successfully imported ${results.length} valid records for parking area ${parkingAreaId}`);
                resolve({
                    success: true,
                    message: `Successfully imported ${results.length} records`,
                    data: results
                });
            } catch (error) {
                console.error('Error importing data:', error);
                if (error.writeErrors) {
                    console.error('Write errors:', error.writeErrors);
                }
                reject({
                    success: false,
                    message: 'Error importing data',
                    error: error.message
                });
            }
        })
        .on('error', (error) => {
            console.error('Error reading CSV:', error);
            reject({
                success: false,
                message: 'Error reading CSV file',
                error: error.message
            });
        });
    });
};

export default importCSVData;
