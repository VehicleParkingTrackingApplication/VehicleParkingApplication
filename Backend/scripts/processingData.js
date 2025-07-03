import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Area from '../src/app/models/Area.js'

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_STRING)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const importSimulationData = async (req, res, filename) => {
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