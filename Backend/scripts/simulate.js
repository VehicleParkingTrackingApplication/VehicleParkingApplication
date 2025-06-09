import dotenv from 'dotenv';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import Table from 'cli-table3';

dotenv.config();

const PARKING_AREA_ID = '6843a488a78f7728a339dd75';

const TIME_MULTIPLIER = 60 * 60; // 1 real second = 60 simulation seconds (1 minute)

const SCALE = 10;
const TRAFFIC_VOLUME = 50 * SCALE; // total vehicles per day
const CAPACITY = 10 * SCALE;

// Map to track plate numbers and their status
let plateStatus;
let statusTable;

// Add simulation time tracking
let simulationStartTime;

// Function to format simulation time
function formatSimulationTime(elapsedRealSeconds) {
    const simulationSeconds = elapsedRealSeconds * TIME_MULTIPLIER;
    const hours = Math.floor(simulationSeconds / 3600);
    const minutes = Math.floor((simulationSeconds % 3600) / 60);
    const seconds = Math.floor(simulationSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Initialize the status table
function initializeStatusTable() {
    statusTable = new Table({
        head: ['Real Time', 'Sim Time', 'Capacity', 'Status'],
        style: {
            head: ['cyan'],
            border: ['gray']
        }
    });
}

// Get the current date and time in Sydney timezone
const sydneyDate = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
const sydneyDateObj = new Date(sydneyDate);
const today = sydneyDateObj.toISOString().split('T')[0];  // YYYY-MM-DD format

const dataDir = path.join(process.cwd(), 'src', 'public', 'simulation');

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const csvFilePath = path.join(dataDir, `${today}.csv`);

// Write CSV header if file doesn't exist
if (!fs.existsSync(csvFilePath)) {
    const header = 'date,time,parkingAreaId,plateNumber,country,confidence,angle,image,status\n';
    fs.writeFileSync(csvFilePath, header);
}

// Handle script termination
process.on('SIGINT', () => {
    console.log('\n\nClearing simulation data...');
    try {
        const header = 'date,time,parkingAreaId,plateNumber,country,confidence,angle,image,status\n';
        fs.writeFileSync(csvFilePath, header);
        console.log('Simulation data cleared successfully.');
    } catch (error) {
        console.error('Error clearing simulation data:', error);
    }
    process.exit(0);
});

// Traffic multipliers for each hour (24 hours)
const hourTraffic = [
    0.1, 0.1, 0.1, 0.1,  // 00:00-03:59
    0.2, 0.3, 0.5, 0.7,  // 04:00-07:59
    0.9, 0.9, 0.8, 0.7,  // 08:00-11:59
    0.6, 0.5, 0.4, 0.4,  // 12:00-15:59
    0.5, 0.6, 0.7, 0.8,  // 16:00-19:59
    0.6, 0.4, 0.3, 0.2   // 20:00-23:59
];

// Traffic multipliers for each day of the week (0 = Sunday, 6 = Saturday)
const weekdayTraffic = [
    0.7,  // Sunday
    1.5,  // Monday
    1.4,  // Tuesday
    1.3,  // Wednesday
    1.4,  // Thursday
    1.2,  // Friday
    0.8   // Saturday
];

// Generate a random plate number
function generatePlateNumber() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    let plate = '';
    
    for (let i = 0; i < 3; i++) {
        plate += letters[Math.floor(Math.random() * letters.length)];
        plate += numbers[Math.floor(Math.random() * numbers.length)];
    }
    
    return plate;
}

// Generate a random angle
function generateAngle() {
    return Math.floor(Math.random() * 360).toString();
}

// Generate a random confidence score
function generateConfidence() {
    return Math.floor(Math.random() * 20 + 80).toString(); // 80-100
}

// Calculate traffic volume for current time
function calculateTrafficVolume() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    return Math.round(TRAFFIC_VOLUME * hourTraffic[hour] * weekdayTraffic[day]);
}

// Generate random parking duration in milliseconds (1 hour to 1 day)
function generateParkingDuration() {
    const minDuration = 60 * 60 * 1000; // 1 hour in ms
    const maxDuration = 24 * 60 * 60 * 1000; // 1 day in ms
    return Math.floor((Math.random() * (maxDuration - minDuration) + minDuration) / TIME_MULTIPLIER);
}

// Function to display current parking status
function displayParkingStatus() {
    // Only display status in main thread
    if (!isMainThread) return;
    
    if (!statusTable) {
        initializeStatusTable();
    }

    const now = new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' });
    const elapsedRealSeconds = (Date.now() - simulationStartTime) / 1000;
    const simTime = formatSimulationTime(elapsedRealSeconds);
    const capacity = `${plateStatus.size}/${CAPACITY}`;
    const status = plateStatus.size >= CAPACITY ? 'FULL' : 'AVAILABLE';
    
    // Clear the table
    statusTable.length = 0;
    
    // Add the current status
    statusTable.push([
        now,
        simTime,
        capacity,
        status
    ]);
    
    // Clear the console and display the table
    console.clear();
    console.log(statusTable.toString());
    
    // Display the current plates
    console.log('\nCurrent Plates:');
    console.log(Array.from(plateStatus.entries()).map(([plate, status]) => 
        `${plate}: ${status}`
    ).join('\n'));
}

// Generate a vehicle event
async function generateVehicleEvent(status, plateNumber = null) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    // For APPROACHING events, check capacity and if plate already exists
    if (status === 'APPROACHING') {
        if (plateStatus.size >= CAPACITY) {
            console.log(`Skipping APPROACHING event for plate ${plateNumber} - parking area at capacity (${plateStatus.size}/${CAPACITY})`);
            displayParkingStatus();
            return false;
        }
        
        if (plateStatus.has(plateNumber)) {
            console.log(`Skipping APPROACHING event for plate ${plateNumber} - already in parking area`);
            displayParkingStatus();
            return false;
        }
    }
    
    // For LEAVING events, check if plate exists and is APPROACHING
    if (status === 'LEAVING') {
        if (!plateStatus.has(plateNumber) || plateStatus.get(plateNumber) !== 'APPROACHING') {
            console.log(`Skipping LEAVING event for plate ${plateNumber} - not found in parking area`);
            displayParkingStatus();
            return false;
        }
    }
    
    const event = {
        parkingAreaId: PARKING_AREA_ID,
        date,
        time,
        plateNumber: plateNumber || generatePlateNumber(),
        country: 'AUS',
        confidence: generateConfidence(),
        angle: generateAngle(),
        image: `${date}_${time}_${plateNumber || generatePlateNumber()}.jpg`,
        status
    };
    
    console.log(`[${date} ${time}] ${status} event for plate ${event.plateNumber}`);
    
    try {
        // Write to CSV file
        const csvLine = `${event.date},${event.time},${event.parkingAreaId},${event.plateNumber},${event.country},${event.confidence},${event.angle},${event.image},${event.status}\n`;
        fs.appendFileSync(csvFilePath, csvLine);
        
        // Update parking status after successful write
        if (status === 'APPROACHING') {
            plateStatus.set(plateNumber, 'APPROACHING');
        } else if (status === 'LEAVING') {
            plateStatus.delete(plateNumber);
        }
        
        displayParkingStatus();
        return true;
    } catch (error) {
        console.error('Error writing to CSV:', error);
        return false;
    }
}

// Simulate a single vehicle
async function simulateVehicle() {
    const plateNumber = generatePlateNumber();
    const parkingDuration = generateParkingDuration();
    
    const approachingSuccess = await generateVehicleEvent('APPROACHING', plateNumber);
    if (!approachingSuccess) return;
    
    await new Promise(resolve => setTimeout(resolve, parkingDuration));
    await generateVehicleEvent('LEAVING', plateNumber);
}

// Main simulation loop
async function runSimulation() {
    if (!isMainThread) return;
    
    console.log('Starting traffic simulation...');
    console.log(`Time scale: 1 real second = ${TIME_MULTIPLIER} simulation seconds`);
    
    // Initialize the shared Map and table in the main thread
    plateStatus = new Map();
    initializeStatusTable();
    simulationStartTime = Date.now();
    
    while (true) {
        const trafficVolume = calculateTrafficVolume();
        const interval = Math.floor((24 * 60 * 60 * 1000) / trafficVolume / TIME_MULTIPLIER);
        
        const now = new Date();
        const hour = now.getHours();
        const isPeakHour = hour >= 8 && hour <= 18; // 8 AM to 6 PM
        const vehicleCount = isPeakHour ? Math.floor(Math.random() * 3) + 1 : 1;
        
        for (let i = 0; i < vehicleCount; i++) {
            const worker = new Worker(new URL(import.meta.url), {
                workerData: { plateStatus: Array.from(plateStatus.entries()) }
            });
            
            worker.on('message', (message) => {
                if (message.type === 'updateStatus') {
                    plateStatus = new Map(message.plateStatus);
                    displayParkingStatus();
                }
            });
            
            worker.on('error', console.error);
            worker.on('exit', (code) => {
                if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
            });
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
    }
}

// Check if this is the main thread or a worker thread
if (isMainThread) {
    runSimulation().catch(console.error);
} else {
    plateStatus = new Map(workerData.plateStatus);
    
    function updateMainThread() {
        parentPort.postMessage({
            type: 'updateStatus',
            plateStatus: Array.from(plateStatus.entries())
        });
    }
    
    const originalGenerateVehicleEvent = generateVehicleEvent;
    generateVehicleEvent = async function(status, plateNumber) {
        const result = await originalGenerateVehicleEvent(status, plateNumber);
        updateMainThread();
        return result;
    };
    
    simulateVehicle().catch(console.error);
}
