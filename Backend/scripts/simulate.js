import dotenv from 'dotenv';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import Table from 'cli-table3';
import mongoose from 'mongoose';
import Area from '../src/app/models/Area.js';

dotenv.config();

// Check for required environment variables
if (!process.env.CONNECTION_STRING) {
    console.error('❌ CONNECTION_STRING environment variable is required!');
    console.log('Please create a .env file with your MongoDB connection string:');
    console.log('CONNECTION_STRING=mongodb://localhost:27017/your_database_name');
    console.log('Or set it as an environment variable before running the script.');
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_STRING)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// ============= SIMULATION CONFIGURATION =============
const TIME_MULTIPLIER = 1; // 1 real second = 1 hour simulation time
const EVENT_INTERVAL = 5; // Generate events every 30 seconds
const SCALE = 1;
const TRAFFIC_VOLUME = 50 * SCALE; // total vehicles per day

// Traffic multipliers for each hour (24 hours)
const HOUR_TRAFFIC = [
    0.1, 0.1, 0.1, 0.1,  // 00:00-03:59
    0.2, 0.3, 0.5, 0.7,  // 04:00-07:59
    0.9, 0.9, 0.8, 0.7,  // 08:00-11:59
    0.6, 0.5, 0.4, 0.4,  // 12:00-15:59
    0.5, 0.6, 0.7, 0.8,  // 16:00-19:59
    0.6, 0.4, 0.3, 0.2   // 20:00-23:59
];

// Traffic multipliers for each day of the week (0 = Sunday, 6 = Saturday)
const WEEKDAY_TRAFFIC = [
    0.7,  // Sunday
    1.5,  // Monday
    1.4,  // Tuesday
    1.3,  // Wednesday
    1.4,  // Thursday
    1.2,  // Friday
    0.8   // Saturday
];

// Parking duration configuration (in milliseconds)
const MIN_PARKING_DURATION = 60 * 60 * 1000; // 1 hour in ms
const MAX_PARKING_DURATION = 24 * 60 * 60 * 1000; // 1 day in ms

// Plate number configuration
const PLATE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PLATE_NUMBERS = '0123456789';
const PLATE_LENGTH = 6; // 3 letters + 3 numbers

// Confidence score configuration
const MIN_CONFIDENCE = 80;
const MAX_CONFIDENCE = 100;

// ============= END SIMULATION CONFIGURATION =============

// Map to track plate numbers and their status for each area
let areaStatuses = new Map();
let statusTable;

// Add simulation time tracking
let simulationStartTime;

// Add event history tracking
let eventHistory = [];

// Function to get weekday name
function getWeekdayName(day) {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[day];
}

// Function to calculate simulation time
function calculateSimulationTime() {
    const elapsedRealSeconds = (Date.now() - simulationStartTime) / 1000;
    const simulationSeconds = elapsedRealSeconds * TIME_MULTIPLIER;
    
    // Calculate days passed
    const days = Math.floor(simulationSeconds / (24 * 3600));
    const remainingSeconds = simulationSeconds % (24 * 3600);
    
    // Calculate hours, minutes, seconds
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    
    // Calculate current weekday (0 = Sunday, 6 = Saturday)
    const weekday = (days + new Date().getDay()) % 7;
    
    return {
        realTime: elapsedRealSeconds,
        simulationTime: simulationSeconds,
        formattedTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
        weekday: getWeekdayName(weekday),
        hour: hours,
        minute: minutes,
        second: seconds
    };
}

// Function to convert real time to simulation time
function realToSimulationTime(realSeconds) {
    return realSeconds * TIME_MULTIPLIER;
}

// Function to convert simulation time to real time
function simulationToRealTime(simulationSeconds) {
    return simulationSeconds / TIME_MULTIPLIER;
}

// Initialize the status table
function initializeStatusTable() {
    statusTable = new Table({
        head: ['Area Name', 'Location', 'Capacity', 'Status'],
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

// Function to create area-specific directories
async function createAreaDirectories(areas) {
    const baseDir = path.join(process.cwd(), 'public', 'simulation');
    
    for (const area of areas) {
        const areaDir = path.join(baseDir, `${area.name}_${area._id.toString()}`);
        if (!fs.existsSync(areaDir)) {
            fs.mkdirSync(areaDir, { recursive: true });
        }
    }
}

// Function to parse location string and extract suburb and city
function parseLocation(locationString) {
    if (!locationString) {
        return { suburb: 'Unknown', city: 'Unknown' };
    }
    
    // Try to parse as JSON first (in case it's stored as JSON string)
    try {
        const parsed = JSON.parse(locationString);
        if (parsed.suburb && parsed.city) {
            return { suburb: parsed.suburb, city: parsed.city };
        }
    } catch (e) {
        // Not JSON, treat as string
    }
    
    // If it's a string, try to extract suburb and city
    const parts = locationString.split(',').map(part => part.trim());
    if (parts.length >= 2) {
        return { suburb: parts[0], city: parts[1] };
    } else if (parts.length === 1) {
        return { suburb: parts[0], city: 'Unknown' };
    }
    
    return { suburb: 'Unknown', city: 'Unknown' };
}

// Generate a random plate number
function generatePlateNumber() {
    let plate = '';
    
    // Generate 3 letters
    for (let i = 0; i < 3; i++) {
        plate += PLATE_LETTERS[Math.floor(Math.random() * PLATE_LETTERS.length)];
    }
    
    // Generate 3 numbers
    for (let i = 0; i < 3; i++) {
        plate += PLATE_NUMBERS[Math.floor(Math.random() * PLATE_NUMBERS.length)];
    }
    
    return plate;
}

// Generate a random angle
function generateAngle() {
    return Math.floor(Math.random() * 360).toString();
}

// Generate a random confidence score
function generateConfidence() {
    return Math.floor(Math.random() * (MAX_CONFIDENCE - MIN_CONFIDENCE + 1) + MIN_CONFIDENCE).toString();
}

// Calculate traffic volume for current time
function calculateTrafficVolume() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    return Math.round(TRAFFIC_VOLUME * HOUR_TRAFFIC[hour] * WEEKDAY_TRAFFIC[day]);
}

// Generate random parking duration in milliseconds (1 hour to 1 day)
function generateParkingDuration() {
    return Math.floor((Math.random() * (MAX_PARKING_DURATION - MIN_PARKING_DURATION) + MIN_PARKING_DURATION) / TIME_MULTIPLIER);
}

// Display current parking status
async function displayParkingStatus() {
    try {
        // Clear console
        console.clear();
        
        // Display parking areas information
        console.log('\n=== Parking Areas Information ===');
        console.table(Array.from(areaStatuses.values()).map(areaStatus => {
            const location = parseLocation(areaStatus.location);
            return {
                'Area Name': areaStatus.name,
                'Location': `${location.suburb}, ${location.city}`,
                'Capacity': areaStatus.capacity,
                'Current Usage': `${areaStatus.plates.size}/${areaStatus.capacity}`,
                'Status': areaStatus.plates.size >= areaStatus.capacity ? 'FULL' : 'AVAILABLE'
            };
        }));
        
        // Display current vehicles in areas
        console.log('\n=== Current Vehicles in Areas ===');
        areaStatuses.forEach((areaStatus, areaId) => {
            const location = parseLocation(areaStatus.location);
            console.log(`\n${areaStatus.name} (${location.suburb}):`);
            if (areaStatus.plates.size > 0) {
                areaStatus.plates.forEach((status, plate) => {
                    console.log(`  - ${plate} (${status})`);
                });
            } else {
                console.log('  No vehicles currently parked');
            }
        });
        
        // Display vehicle event history
        console.log('\n=== Vehicle Event History ===');
        if (eventHistory.length > 0) {
            // Show last 50 events to prevent console overflow
            const recentEvents = eventHistory.slice(-50);
            recentEvents.forEach(event => console.log(event));
        } else {
            console.log('No events yet');
        }
    } catch (error) {
        console.error('Error displaying parking status:', error);
    }
}

// Main simulation loop
async function runSimulation() {
    if (!isMainThread) return;
    
    console.log('🚀 Starting traffic simulation...');
    console.log(`⏱️  Time scale: 1 real second = ${TIME_MULTIPLIER} simulation seconds`);
    console.log(`🔄 Event interval: ${EVENT_INTERVAL} simulation seconds (${simulationToRealTime(EVENT_INTERVAL)} real seconds)`);
    
    try {
        // Get all parking areas except the excluded one
        const excludedAreaId = "687dde8379e977f9d2aaf8ef";
        const areas = await Area.find({ _id: { $ne: excludedAreaId } });
        console.log(`📍 Found ${areas.length} parking areas (excluding area ${excludedAreaId})`);
        if (areas.length === 0) {
            console.log('⚠️  No parking areas found in the database (after exclusion). Please create some areas first.');
            process.exit(1);
        }
        
        // Create directories for each area
        await createAreaDirectories(areas);
        
        // Initialize status tracking for each area
        for (const area of areas) {
            areaStatuses.set(area._id.toString(), {
                ...area.toObject(),
                plates: new Map()
            });
        }
        
        initializeStatusTable();
        simulationStartTime = Date.now();
        
        // Create workers once at the start
        const workers = new Map();
        for (const area of areas) {
            const areaData = {
                _id: area._id.toString(),
                name: area.name,
                capacity: area.capacity,
                location: area.location
            };

            const worker = new Worker(new URL(import.meta.url), {
                workerData: { 
                    area: areaData,
                    areaStatuses: Array.from(areaStatuses.entries())
                }
            });
            
            worker.on('message', (message) => {
                if (message.type === 'updateStatus') {
                    areaStatuses = new Map(message.areaStatuses);
                    displayParkingStatus();
                }
            });
            
            worker.on('error', console.error);
            worker.on('exit', (code) => {
                if (code !== 0) console.error(`Worker stopped with exit code ${code}`);
            });

            workers.set(area._id.toString(), worker);
        }
        
        console.log('✅ Simulation started successfully! Press Ctrl+C to stop.');
        
        while (true) {
            const simTime = calculateSimulationTime();
            
            // Update all workers with current simulation time
            for (const [areaId, worker] of workers) {
                worker.postMessage({
                    type: 'updateTime',
                    simTime: simTime
                });
            }
            
            // Wait for the real time equivalent of EVENT_INTERVAL simulation seconds
            const realInterval = simulationToRealTime(EVENT_INTERVAL);
            await new Promise(resolve => setTimeout(resolve, realInterval * 1000));
        }
    } catch (error) {
        console.error('❌ Error in simulation:', error);
        process.exit(1);
    }
}

// Worker thread code
if (isMainThread) {
    runSimulation().catch(console.error);
} else {
    const { area, areaStatuses: workerAreaStatuses } = workerData;
    
    // Initialize areaStatuses in worker thread
    areaStatuses = new Map(workerAreaStatuses);
    
    // Ensure the area exists in the status map with proper structure
    if (!areaStatuses.has(area._id)) {
        areaStatuses.set(area._id, {
            _id: area._id,
            name: area.name,
            capacity: area.capacity,
            location: area.location,
            plates: new Map()
        });
    }
    
    function updateMainThread() {
        parentPort.postMessage({
            type: 'updateStatus',
            areaStatuses: Array.from(areaStatuses.entries())
        });
    }
    
    // Listen for time updates from main thread
    parentPort.on('message', async (message) => {
        if (message.type === 'updateTime') {
            await simulateVehicleEvent();
        }
    });
    
    // Simulate a single vehicle event (either approaching or leaving)
    async function simulateVehicleEvent() {
        const areaStatus = areaStatuses.get(area._id.toString());
        if (!areaStatus) {
            console.error(`No status found for area ${area._id}`);
            return;
        }

        const hasVehicles = areaStatus.plates.size > 0;
        
        // Randomly decide whether to generate an approaching vehicle or make an existing vehicle leave
        const shouldApproach = !hasVehicles || Math.random() < 0.7; // 70% chance of approaching if there are vehicles
        
        if (shouldApproach) {
            // Generate a new plate number for approaching vehicle
            const plateNumber = generatePlateNumber();
            await generateVehicleEvent(area, 'APPROACHING', plateNumber);
        } else {
            // Select a random vehicle to leave
            const plates = Array.from(areaStatus.plates.keys());
            if (plates.length > 0) {
                const randomPlate = plates[Math.floor(Math.random() * plates.length)];
                await generateVehicleEvent(area, 'LEAVING', randomPlate);
            }
        }
    }

    // Generate a vehicle event
    async function generateVehicleEvent(area, status, plateNumber = null) {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        
        const areaStatus = areaStatuses.get(area._id.toString());
        
        // Generate a new plate number if not provided
        const finalPlateNumber = plateNumber || generatePlateNumber();
        
        // For APPROACHING events, check capacity and if plate already exists
        if (status === 'APPROACHING') {
            if (areaStatus.plates.size >= area.capacity) {
                const skipMessage = `SKIP [${date} ${time}] APPROACHING event for plate ${finalPlateNumber} - parking area at capacity (${areaStatus.plates.size}/${area.capacity})`;
                console.log(skipMessage);
                eventHistory.push(skipMessage);
                return false;
            }
            
            if (areaStatus.plates.has(finalPlateNumber)) {
                const skipMessage = `SKIP [${date} ${time}] APPROACHING event for plate ${finalPlateNumber} - already in parking area`;
                console.log(skipMessage);
                eventHistory.push(skipMessage);
                return false;
            }
        }
        
        // For LEAVING events, check if plate exists and is APPROACHING
        if (status === 'LEAVING') {
            if (!areaStatus.plates.has(finalPlateNumber) || areaStatus.plates.get(finalPlateNumber) !== 'APPROACHING') {
                const skipMessage = `SKIP [${date} ${time}] LEAVING event for plate ${finalPlateNumber} - not found in parking area`;
                console.log(skipMessage);
                eventHistory.push(skipMessage);
                return false;
            }
        }
        
        const event = {
            date,
            time,
            parkingAreaId: area._id,
            plateNumber: finalPlateNumber,
            country: 'AUS',
            confidence: generateConfidence(),
            angle: generateAngle(),
            image: `${date}_${time}_${finalPlateNumber}.jpg`,
            status: status
        };
        
        const eventMessage = `[${date} ${time}] ${status} event for plate ${event.plateNumber} in area ${area.name}`;
        console.log(eventMessage);
        eventHistory.push(eventMessage);
        
        try {
            // Write to CSV file
            const areaDir = path.join(process.cwd(), 'public', 'simulation', `${area.name}_${area._id.toString()}`);
            const csvFilePath = path.join(areaDir, `${today}.csv`);
            const csvLine = `${event.date},${event.time},${event.parkingAreaId},${event.plateNumber},${event.country},${event.confidence},${event.angle},${event.image},${event.status}\n`;
            fs.appendFileSync(csvFilePath, csvLine);
            
            // Update parking status after successful write
            if (status === 'APPROACHING') {
                areaStatus.plates.set(finalPlateNumber, 'APPROACHING');
            } else if (status === 'LEAVING') {
                areaStatus.plates.delete(finalPlateNumber);
            }
            
            updateMainThread();
            return true;
        } catch (error) {
            console.error('Error writing to CSV:', error);
            return false;
        }
    }
}
