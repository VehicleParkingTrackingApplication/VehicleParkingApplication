import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Area from '../src/app/models/Area.js';
import Vehicle from '../src/app/models/Vehicle.js';

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

// Simulation configuration
const TIME_MULTIPLIER = 1; // 1 real second = 1 hour simulation time
const EVENT_INTERVAL = 5; // Generate events every 5 simulation seconds

// Manual list of area IDs to simulate
const SIMULATION_AREA_IDS = [
    '68463ea062d56405aaef9ff9', // First area ID
    // Add more area IDs here as needed
    // '68463ea062d56405aaef9ffa',
    // '68463ea062d56405aaef9ffb',
    // '68463ea062d56405aaef9ffc',
    // '68463ea062d56405aaef9ff8'
];

// Plate number configuration
const PLATE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PLATE_NUMBERS = '0123456789';

// Confidence score configuration
const MIN_CONFIDENCE = 80;
const MAX_CONFIDENCE = 100;

// End of simulation configuration

// Map to track area information
let areaStatuses = new Map();

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



// Display current parking status
async function displayParkingStatus() {
    try {
        // Clear console
        console.clear();
        
        // Display parking areas information
        console.log('\n=== Parking Areas Information ===');
        const areaInfo = [];
        
        for (const [areaId, areaStatus] of areaStatuses) {
            try {
                const location = parseLocation(areaStatus.location);
                const currentVehicleCount = await Vehicle.countDocuments({ 
                    areaId: areaId, 
                    status: 'APPROACHING' 
                });
                
                areaInfo.push({
                    'Area Name': areaStatus.name,
                    'Location': `${location.suburb}, ${location.city}`,
                    'Capacity': areaStatus.capacity,
                    'Current Usage': `${currentVehicleCount}/${areaStatus.capacity}`,
                    'Status': currentVehicleCount >= areaStatus.capacity ? 'FULL' : 'AVAILABLE'
                });
            } catch (error) {
                console.error(`Error getting info for area ${areaStatus.name}:`, error);
            }
        }
        
        console.table(areaInfo);
        
        // Display current vehicles in areas
        console.log('\n=== Current Vehicles in Areas ===');
        for (const [areaId, areaStatus] of areaStatuses) {
            const location = parseLocation(areaStatus.location);
            console.log(`\n${areaStatus.name} (${location.suburb}):`);
            
            try {
                // Get actual vehicle count from database
                const vehicleCount = await Vehicle.countDocuments({ 
                    areaId: areaId, 
                    status: 'APPROACHING' 
                });
                
                if (vehicleCount > 0) {
                    // Get actual vehicles from database
                    const vehicles = await Vehicle.find({ 
                        areaId: areaId, 
                        status: 'APPROACHING' 
                    });
                    
                    vehicles.forEach(vehicle => {
                        console.log(`  - ${vehicle.plateNumber} (APPROACHING)`);
                    });
                } else {
                    console.log('  No vehicles currently parked');
                }
            } catch (error) {
                console.log('  Error fetching vehicles from database');
            }
        }
        
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
    console.log('🚀 Starting traffic simulation...');
    console.log(`⏱️  Time scale: 1 real second = ${TIME_MULTIPLIER} simulation seconds`);
    console.log(`🔄 Event interval: ${EVENT_INTERVAL} simulation seconds (${simulationToRealTime(EVENT_INTERVAL)} real seconds)`);
    
    try {
        // Get all parking areas except the excluded one
        const areas = [];
        for (const areaId of SIMULATION_AREA_IDS) {
            try {
                const area = await Area.findById(areaId);
                if (area) {
                    areas.push(area);
                    console.log(`✅ Found area: ${area.name} (${areaId})`);
                } else {
                    console.log(`⚠️  Area not found: ${areaId}`);
                }
            } catch (error) {
                console.error(`❌ Error fetching area ${areaId}:`, error);
            }
        }
        
        console.log(`📍 Found ${areas.length} parking areas from manual list`);
        if (areas.length === 0) {
            console.log('⚠️  No parking areas found in the database (after exclusion). Please create some areas first.');
            process.exit(1);
        }
        
        // Create directories for each area
        await createAreaDirectories(areas);
        
        // Initialize status tracking for each area
        for (const area of areas) {
            areaStatuses.set(area._id.toString(), {
                ...area.toObject()
            });
        }
        
        simulationStartTime = Date.now();
        
        console.log('✅ Simulation started successfully! Press Ctrl+C to stop.');
        console.log('📝 Note: Events are being written to CSV files only. Use a separate script to import CSV data into the database.');
        
        while (true) {
            const simTime = calculateSimulationTime();
            
            // Randomly choose one area for this simulation second
            const randomAreaIndex = Math.floor(Math.random() * areas.length);
            const chosenArea = areas[randomAreaIndex];
            
            // Randomly choose between Option 1 (approaching) and Option 2 (leaving)
            const shouldApproach = Math.random() < 0.5; // 50% chance for each option
            
            if (shouldApproach) {
                // Option 1: Generate approaching event
                await generateApproachingEvent(chosenArea);
            } else {
                // Option 2: Generate leaving event
                await generateLeavingEvent(chosenArea);
            }
            
            // Update display
            await displayParkingStatus();
            
            // Wait for the real time equivalent of EVENT_INTERVAL simulation seconds
            const realInterval = simulationToRealTime(EVENT_INTERVAL);
            await new Promise(resolve => setTimeout(resolve, realInterval * 1000));
        }
    } catch (error) {
        console.error('❌ Error in simulation:', error);
        process.exit(1);
    }
}

// Function to generate approaching event
async function generateApproachingEvent(area) {
    try {
        // Check if area is full by counting vehicles in Vehicle collection

        const currentVehicleCount = area.currentCapacity;

        if (currentVehicleCount >= area.capacity) {
            const skipMessage = `SKIP [${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0].replace(/:/g, '-')}] APPROACHING event for area ${area.name} - parking area at capacity (${currentVehicleCount}/${area.capacity})`;
            console.log(skipMessage);
            eventHistory.push(skipMessage);
            return false;
        }
        
        // Generate approaching event
        const plateNumber = generatePlateNumber();
        const event = await generateVehicleEvent(area, 'APPROACHING', plateNumber);
        
        return event;
    } catch (error) {
        console.error('Error generating approaching event:', error);
        return false;
    }
}

// Function to generate leaving event
async function generateLeavingEvent(area) {
    try {
        console.log(area.currentCapacity, area);
        if (area.currentCapacity === 0) {
            const skipMessage = `SKIP [${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().split(' ')[0].replace(/:/g, '-')}] LEAVING event for area ${area.name} - no vehicles currently parked`;
            console.log(skipMessage);
            eventHistory.push(skipMessage);
            return false;
        }
        
        // Find all existing vehicles in the chosen area from database
        const existingVehicles = await Vehicle.find({ 
            areaId: area._id, 
            status: 'APPROACHING' 
        });
        
        // Randomly choose one of the existing vehicles
        const randomVehicleIndex = Math.floor(Math.random() * existingVehicles.length);
        const chosenVehicle = existingVehicles[randomVehicleIndex];
        
        // Generate leaving event for the chosen vehicle
        const event = await generateVehicleEvent(area, 'LEAVING', chosenVehicle.plateNumber);
        
        return event;
    } catch (error) {
        console.error('Error generating leaving event:', error);
        return false;
    }
}

// Generate a vehicle event
async function generateVehicleEvent(area, status, plateNumber = null) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    
    // Generate a new plate number if not provided
    const finalPlateNumber = plateNumber || generatePlateNumber();
    
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
        

        
        return true;
    } catch (error) {
        console.error('Error writing to CSV:', error);
        return false;
    }
}

// Start the simulation
runSimulation().catch(console.error);
