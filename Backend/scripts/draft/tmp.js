import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Record from '../../src/app/models/Record.js';
import Area from '../../src/app/models/Area.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.CONNECTION_STRING)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

class IncrementalDataProcessor {
    constructor() {
        this.baseDir = path.join(process.cwd(), 'public', 'simulation');
    }

    /**
     * 🔑 STEP 1: Get all area names from database
     */
    async getAllAreaNames() {
        try {
            const areas = await Area.find({}, 'name _id');
            console.log(`📋 Found ${areas.length} areas in database:`);
            areas.forEach(area => {
                console.log(`   - ${area.name} (ID: ${area._id})`);
            });
            return areas;
        } catch (error) {
            console.error('❌ Error getting area names:', error);
            return [];
        }
    }

    /**
     * 🔑 STEP 2: Get the latest record for each area from database
     * Returns the most recent record with date and time for each area
     */
    async getLatestRecordForEachArea(areas) {
        try {
            const latestRecords = {};
            
            for (const area of areas) {
                console.log(`\n🔍 Finding latest record for area: ${area.name}`);
                
                // Find the most recent record for this area
                const latestRecord = await Record.findOne(
                    { areaId: area._id.toString() }
                ).sort({ datetime: -1 }); // Sort by datetime descending to get the latest
                
                if (latestRecord) {
                    latestRecords[area._id.toString()] = {
                        areaName: area.name,
                        areaId: area._id.toString(),
                        latestRecord: latestRecord,
                        date: latestRecord.datetime.toISOString().split('T')[0], // YYYY-MM-DD
                        time: latestRecord.datetime.toTimeString().split(' ')[0]  // HH:MM:SS
                    };
                    
                    console.log(`   ✅ Latest record: ${latestRecord.datetime} - ${latestRecord.plateNumber}`);
                } else {
                    console.log(`   ⚠️  No records found for area: ${area.name}`);
                    latestRecords[area._id.toString()] = {
                        areaName: area.name,
                        areaId: area._id.toString(),
                        latestRecord: null,
                        date: null,
                        time: null
                    };
                }
            }
            
            return latestRecords;
        } catch (error) {
            console.error('❌ Error getting latest records:', error);
            return {};
        }
    }

    /**
     * 🔑 STEP 3: Find the latest line in CSV and get all lines after it
     * Uses the date/time from database to find the cutoff point in CSV
     */
    findNewRecordsInCSV(areaName, areaId, latestRecordInfo) {
        try {
            const csvFilePath = path.join(this.baseDir, `${areaName}_${areaId}`, `${latestRecordInfo.date}.csv`);
            
            if (!fs.existsSync(csvFilePath)) {
                console.log(`   📁 CSV file not found: ${csvFilePath}`);
                return [];
            }

            console.log(`   📁 Reading CSV file: ${csvFilePath}`);
            
            // Read the entire CSV file
            const csvContent = fs.readFileSync(csvFilePath, 'utf8');
            const lines = csvContent.trim().split('\n');
            
            if (lines.length <= 1) { // Only header or empty
                console.log(`   ⚠️  CSV file is empty or has only header`);
                return [];
            }

            // Skip header line
            const dataLines = lines.slice(1);
            
            if (!latestRecordInfo.latestRecord) {
                // No previous records, process all lines
                console.log(`   🔄 No previous records found, processing all ${dataLines.length} lines`);
                return dataLines;
            }

            // 🔑 KEY STEP: Find the latest line in CSV that matches our database record
            const latestDateTime = latestRecordInfo.latestRecord.datetime.toISOString().slice(0, 19).replace('T', ' ').replace(/:/g, '-');
            console.log(`   🔍 Looking for latest line with datetime: ${latestDateTime}`);
            
            let latestLineIndex = -1;
            
            // Search from the END of the file to find the matching record
            for (let i = dataLines.length - 1; i >= 0; i--) {
                const line = dataLines[i];
                if (line.includes(latestDateTime)) {
                    latestLineIndex = i;
                    console.log(`   ✅ Found latest line at index ${i}: ${line}`);
                    break;
                }
            }

            if (latestLineIndex === -1) {
                console.log(`   ⚠️  Latest record not found in CSV, processing all lines`);
                return dataLines;
            }

            // 🔑 KEY STEP: Get all lines AFTER the latest line
            const newLines = dataLines.slice(latestLineIndex + 1);
            
            if (newLines.length === 0) {
                console.log(`   ✅ No new records found after latest line`);
            } else {
                console.log(`   🔄 Found ${newLines.length} new records after latest line:`);
                newLines.forEach((line, index) => {
                    console.log(`      ${index + 1}. ${line}`);
                });
            }
            
            return newLines;
        } catch (error) {
            console.error(`   ❌ Error finding new records in CSV for ${areaName}:`, error);
            return [];
        }
    }

    /**
     * 🔑 STEP 4: Convert CSV lines to Record objects and insert into database
     */
    async processNewRecords(areaName, areaId, newLines) {
        try {
            if (newLines.length === 0) {
                return { processed: 0, total: 0 };
            }

            console.log(`   🔄 Converting ${newLines.length} lines to records...`);
            
            // Convert CSV lines to Record objects
            const records = [];
            for (const line of newLines) {
                const record = this.csvLineToRecord(line, areaId);
                if (record) {
                    records.push(record);
                }
            }

            if (records.length === 0) {
                console.log(`   ⚠️  No valid records to insert`);
                return { processed: 0, total: newLines.length };
            }

            // Insert records into MongoDB
            console.log(`   💾 Inserting ${records.length} records into database...`);
            const result = await Record.insertMany(records, { ordered: false });
            
            console.log(`   ✅ Successfully inserted ${result.length} records`);
            return { processed: result.length, total: newLines.length };

        } catch (error) {
            console.error(`   ❌ Error processing new records for ${areaName}:`, error);
            return { processed: 0, total: newLines.length, error: error.message };
        }
    }

    /**
     * Convert CSV line to Record object
     */
    csvLineToRecord(line, areaId) {
        try {
            const parts = line.split(',');
            if (parts.length >= 9) {
                const [date, time, parkingAreaId, plateNumber, country, confidence, angle, image, status] = parts;
                
                // Parse datetime
                const datetime = new Date(`${date}T${time.replace(/-/g, ':')}`);
                
                return {
                    areaId: parkingAreaId,
                    datetime: datetime,
                    plateNumber: plateNumber,
                    country: country,
                    confidence: confidence,
                    angle: angle,
                    image: image,
                    status: status
                };
            }
        } catch (error) {
            console.error('Error converting CSV line to record:', error);
        }
        return null;
    }

    /**
     * 🔑 MAIN PROCESSING METHOD: Follows your exact steps
     */
    async processAllAreas() {
        try {
            console.log('🚀 Starting incremental data processing...');
            console.log('==========================================');
            
            // STEP 1: Get all area names from database
            console.log('\n📋 STEP 1: Getting all area names from database');
            const areas = await this.getAllAreaNames();
            
            if (areas.length === 0) {
                console.log('❌ No areas found in database');
                return [];
            }

            // STEP 2: Get latest record for each area from database
            console.log('\n🔍 STEP 2: Getting latest record for each area from database');
            const latestRecords = await this.getLatestRecordForEachArea(areas);
            
            const results = [];

            // STEP 3 & 4: Process each area
            console.log('\n🔄 STEP 3 & 4: Processing new records for each area');
            
            for (const area of areas) {
                const areaId = area._id.toString();
                const latestRecordInfo = latestRecords[areaId];
                
                console.log(`\n📁 Processing area: ${area.name}`);
                
                // STEP 3: Find new records in CSV after latest line
                const newLines = this.findNewRecordsInCSV(area.name, areaId, latestRecordInfo);
                
                // STEP 4: Process and insert new records
                const result = await this.processNewRecords(area.name, areaId, newLines);
                
                results.push({
                    areaName: area.name,
                    areaId: areaId,
                    latestRecordDateTime: latestRecordInfo.latestRecord ? latestRecordInfo.latestRecord.datetime : 'None',
                    newRecordsFound: newLines.length,
                    processed: result.processed,
                    total: result.total,
                    error: result.error
                });
                
                // Add a small delay to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Print summary
            console.log('\n📊 === PROCESSING SUMMARY ===');
            let totalProcessed = 0;
            let totalFound = 0;
            
            for (const result of results) {
                console.log(`${result.areaName}:`);
                console.log(`   Latest DB Record: ${result.latestRecordDateTime}`);
                console.log(`   New Records Found: ${result.newRecordsFound}`);
                console.log(`   Processed: ${result.processed}/${result.total}`);
                
                if (result.error) {
                    console.log(`   ❌ Error: ${result.error}`);
                }
                
                totalProcessed += result.processed;
                totalFound += result.newRecordsFound;
            }
            
            console.log(`\n🎉 Total: ${totalProcessed} records processed from ${totalFound} new records found`);

            return results;

        } catch (error) {
            console.error('❌ Error in processAllAreas:', error);
            return [];
        }
    }

    /**
     * Demonstrate the algorithm with a simple example
     */
    async demonstrateAlgorithm() {
        console.log('\n🎯 DEMONSTRATING THE INCREMENTAL PROCESSING ALGORITHM');
        console.log('==================================================');
        
        console.log('\n📋 Your Approach:');
        console.log('1. Get all area names from database');
        console.log('2. For each area, find the LATEST record from database');
        console.log('3. Use that latest record\'s date/time to find the line in CSV');
        console.log('4. Process only lines AFTER that latest line');
        
        console.log('\n🔑 Key Algorithm Steps:');
        console.log('1. Query database: "What areas exist?"');
        console.log('2. Query database: "What\'s the latest record for each area?"');
        console.log('3. Read CSV file: Find the line matching the latest DB record');
        console.log('4. Extract new: Get all lines AFTER the latest line');
        console.log('5. Insert new: Only insert the new records to database');
        
        console.log('\n💡 Why this approach is better:');
        console.log('- Database is the source of truth for "what\'s been processed"');
        console.log('- No need to scan all CSV files for dates');
        console.log('- More efficient: only check areas that exist in DB');
        console.log('- More reliable: uses actual processed data as reference');
    }
}

// Main execution
async function main() {
    const processor = new IncrementalDataProcessor();
    
    // Check command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        // Process all areas following your approach
        await processor.processAllAreas();
    } else if (args[0] === 'demo') {
        // Show algorithm demonstration only
        await processor.demonstrateAlgorithm();
    } else {
        console.log('Usage:');
        console.log('  node incrementalDataProcessor.js        # Process all areas (your approach)');
        console.log('  node incrementalDataProcessor.js demo   # Show algorithm demonstration');
    }
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export default IncrementalDataProcessor;