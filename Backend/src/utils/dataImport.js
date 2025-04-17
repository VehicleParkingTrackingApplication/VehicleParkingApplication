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
            .pipe(csv({
                separator: ';',
                headers: ['date', 'time', 'plateNumber', 'country', 'confidence', 'angle', 'image', 'status']
            }))
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    // First fix the CameraData model to export properly
                    // Then import the data
                    await CameraData.insertMany(results);
                    console.log(`Imported ${results.length} records from ${filename}`);
                    resolve(results);
                } catch (error) {
                    console.error('Error importing data:', error);
                    reject(error);
                }
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

export default importCSVData;