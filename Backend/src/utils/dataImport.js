import fs from 'fs';
import csv from 'csv-parser';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import CameraData from '../app/models/CameraData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const importCSVData = async (filename) => {
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
                    'status',
                ],
            }),
        )
        .on('data', (data) => {
            // Clean and validate data before pushing
            const cleanedData = {
                date: data.date?.trim(),
                time: data.time?.trim(),
                plateNumber: data.plateNumber?.trim(),
                country: data.country?.trim(),
                confidence: data.confidence?.trim(),
                angle: data.angle?.trim(),
                image: data.image?.trim(),
                status: data.status?.trim(),
                duration: '0'
            };
            
            // Only push if required fields are present
            if (cleanedData.date && cleanedData.time && cleanedData.plateNumber) {
                results.push(cleanedData);
            } else {
                console.log('Skipped invalid record:', cleanedData);
            }
        })
        .on('end', async () => {
            try {
                console.log("CHECK CHECK");
                await CameraData.insertMany(results);
                console.log("Check check 123");
                console.log(`Found ${results.length} valid records to import`);
                resolve(results);
            } catch (error) {
                console.error('Error importing data:', error);
                if (error.writeErrors) {
                    console.error('Write errors:', error.writeErrors);
                }
                reject(error);
            }
        })
        .on('error', (error) => {
            console.error('Error reading CSV:', error);
            reject(error);
        });
    });
};

export default importCSVData;
