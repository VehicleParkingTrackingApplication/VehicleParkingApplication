import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const API_URL = 'http://localhost:1313/api/parking/vehicle/input/data';
const INTERVAL = 1000; // 1 second
const DATA_DIR = path.join(__dirname, '..', 'src', 'public', 'simulation');

// Track processed records
let processedRecords = new Set();
let lastProcessedLine = 0;

// Function to get current date in YYYY-MM-DD format
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Function to read and process CSV file
async function processCSVFile() {
    const currentDate = getCurrentDate();
    const csvFilePath = path.join(DATA_DIR, `${currentDate}.csv`);

    try {
        // Check if file exists
        if (!fs.existsSync(csvFilePath)) {
            console.log(`No CSV file found for date: ${currentDate}`);
            return;
        }

        // Read the CSV file
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = fileContent.split('\n').filter(line => line.trim());

        // Process only new lines
        for (let i = lastProcessedLine; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            // Skip if already processed
            if (processedRecords.has(line)) continue;

            try {
                // Parse CSV line
                const [date, time, parkingAreaId, plateNumber, country, confidence, angle, image, status] = line.split(',');

                // Prepare data for API
                const vehicleData = {
                    date,
                    time,
                    parkingAreaId,
                    plateNumber,
                    country,
                    confidence: parseInt(confidence),
                    angle: parseInt(angle),
                    image,
                    status
                };

                // Call API
                const response = await axios.post(API_URL, vehicleData);
                console.log(`Successfully processed record: ${plateNumber} at ${time}`);

                // Mark as processed
                processedRecords.add(line);
                lastProcessedLine = i + 1;

            } catch (error) {
                console.error(`Error processing line ${i + 1}:`, error.message);
            }
        }

    } catch (error) {
        console.error('Error reading CSV file:', error.message);
    }
}

// Function to reset tracking at midnight
function resetTracking() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const timeUntilMidnight = tomorrow - now;
    setTimeout(() => {
        processedRecords.clear();
        lastProcessedLine = 0;
        console.log('Reset tracking for new day');
        resetTracking(); // Schedule next reset
    }, timeUntilMidnight);
}

// Main function
async function startSimulation() {
    console.log('Starting API simulation...');
    console.log(`Reading from: ${DATA_DIR}`);
    console.log(`API endpoint: ${API_URL}`);
    console.log(`Interval: ${INTERVAL}ms`);

    // Start the reset tracking
    resetTracking();

    // Process CSV file every second
    setInterval(processCSVFile, INTERVAL);
}

// Start the simulation
startSimulation().catch(console.error);
