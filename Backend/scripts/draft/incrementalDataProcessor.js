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
     * STEP 1: Get all area names from database
     */
    async getAllAreaNames() {
        try {
            const areas = await Area.find({}, 'name _id');
            console.log(`Found ${areas.length} areas in database:`);
            areas.forEach(area => {
                console.log(` - ${area.name} (ID: ${area._id})`);
            });
            return areas;
        } catch (error) {
            console.error(' Error getting area names:', error);
            return [];
        }
    }

    /**
     * STEP 2: Get the latest record for each area from database
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
                ).sort({ datetime: -1 }); // Sort by datetime descending to get first record (mean latest record in database)

                if (latestRecord) {
                    latestRecords[area._id.toString()] = {
                        areaName: area.name,
                        areaId: area._id.toString(),
                        latestRecord: latestRecord,
                        date: latestRecord.datetime.toISOString().split('T')[0], // YYYY-MM-DD
                        time: latestRecord.datetime.toTimeString().split(' ')[0] // HH:MM:SS
                    };
                    console.log(`✅ Latest record: ${latestRecord.datetime} - ${latestRecord.plateNumber}`);
                } else {
                    console.log(`⚠️ No records found for area: ${area.name}`);
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
     * STEP 3: Find new records in CSV files
     * Scenario 1: If latestRecordInfo.latestRecord is null -> get all lines from all CSV files in the area folder
     * Scenario 2: If latestRecordInfo.latestRecord exists -> get all lines after the datetime from latest record and all files after the date
    */
    async findNewRecordsInCSV(areaName, areaId, latestRecordInfo) {
        try {
            const areaFolderPath = path.join(this.baseDir, `${areaName}_${areaId}`);
            
            // Check if area folder exists
            if (!fs.existsSync(areaFolderPath)) {
                console.log(`📁 Area folder not found: ${areaFolderPath}`);
                return [];
            }

            // Get all CSV files in the area folder
            const csvFiles = fs.readdirSync(areaFolderPath)
                .filter(file => file.endsWith('.csv'))
                .sort(); // Sort files alphabetically (by date)

            if (csvFiles.length === 0) {
                console.log(`📁 No CSV files found in: ${areaFolderPath}`);
                return [];
            }

            console.log(`📁 Found ${csvFiles.length} CSV files in ${areaName}_${areaId}:`);
            csvFiles.forEach(file => console.log(`   - ${file}`));

            let allNewLines = [];

            // Scenario 1: No previous records in database
            if (!latestRecordInfo.latestRecord) {
                console.log(`🔄 No previous records found, processing all lines from all CSV files`);
                
                for (const csvFile of csvFiles) {
                    const csvFilePath = path.join(areaFolderPath, csvFile);
                    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
                    const lines = csvContent.trim().split('\n');
                    
                    if (lines.length > 1) { // Skip if only header or empty
                        const dataLines = lines.slice(1); // Skip header line
                        console.log(`   📄 Processing ${dataLines.length} lines from ${csvFile}`);
                        allNewLines = allNewLines.concat(dataLines);
                    }
                }
                
                console.log(`✅ Total lines to process: ${allNewLines.length}`);
                return allNewLines;
            }
            
            console.log(`CHECK CHECK ${latestRecordInfo.latestRecord}`)
            // Scenario 2: Latest record exists - process files after the latest record's date
            const latestRecordDate = latestRecordInfo.latestRecord.datetime.toISOString().split('T')[0]; // YYYY-MM-DD
            
            // Create multiple datetime formats to match against CSV
            const dbDateTime = latestRecordInfo.latestRecord.datetime;
            const latestDateTimeFormats = [
                // Format 1: YYYY-MM-DD HH:MM:SS (most common)
                dbDateTime.toISOString().slice(0, 19).replace('T', ' '),
                // Format 2: YYYY-MM-DD HH-MM-SS (with dashes)
                dbDateTime.toISOString().slice(0, 19).replace('T', ' ').replace(/:/g, '-'),
                // Format 3: Just the date part
                dbDateTime.toISOString().split('T')[0],
                // Format 4: Local time format
                dbDateTime.toLocaleString('en-CA', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).replace(',', '')
            ];
            
            console.log(`🔍 Latest record date: ${latestRecordDate}`);
            console.log(`🔍 Latest record datetime formats to match:`, latestDateTimeFormats);

            // Process files that are on or after the latest record's date
            for (const csvFile of csvFiles) {
                const fileDate = csvFile.replace('.csv', '');
                
                // Skip files before the latest record's date
                if (fileDate < latestRecordDate) {
                    console.log(`⏭️ Skipping ${csvFile} (before latest record date)`);
                    continue;
                }

                const csvFilePath = path.join(areaFolderPath, csvFile);
                const csvContent = fs.readFileSync(csvFilePath, 'utf8');
                const lines = csvContent.trim().split('\n');
                
                if (lines.length <= 1) {
                    console.log(`⚠️ CSV file is empty or has only header: ${csvFile}`);
                    continue;
                }

                const dataLines = lines.slice(1); // Skip header line
                console.log(`   📄 Processing ${dataLines.length} lines from ${csvFile}`);

                // If this is the same date as the latest record, find the cutoff point
                if (fileDate === latestRecordDate) {
                    console.log(`   🔍 Finding cutoff point in ${csvFile}`);
                    
                    let latestLineIndex = -1;
                    
                    // Search from the END of the file to find the matching record
                    for (let i = dataLines.length - 1; i >= 0; i--) {
                        const line = dataLines[i];
                        
                        // Try to match against any of the datetime formats
                        for (const dateTimeFormat of latestDateTimeFormats) {
                            if (line.includes(dateTimeFormat)) {
                                latestLineIndex = i;
                                console.log(`   ✅ Found latest line at index ${i} with format "${dateTimeFormat}": ${line}`);
                                break;
                            }
                        }
                        
                        if (latestLineIndex !== -1) break;
                    }

                    if (latestLineIndex === -1) {
                        console.log(`   ⚠️ Latest record not found in CSV, processing all lines from this file`);
                        console.log(`   🔍 Tried to match against formats:`, latestDateTimeFormats);
                        // Show first few lines to help debug
                        if (dataLines.length > 0) {
                            console.log(`   📄 First line in CSV: ${dataLines[0]}`);
                        }
                        allNewLines = allNewLines.concat(dataLines);
                    } else {
                        // Get all lines AFTER the latest line
                        const newLines = dataLines.slice(latestLineIndex + 1);
                        console.log(`   🔄 Found ${newLines.length} new records after latest line in ${csvFile}`);
                        allNewLines = allNewLines.concat(newLines);
                    }
                } else {
                    // This is a file after the latest record's date, process all lines
                    console.log(`   🔄 Processing all lines from ${csvFile} (after latest record date)`);
                    allNewLines = allNewLines.concat(dataLines);
                }
            }

            if (allNewLines.length === 0) {
                console.log(`   ✅ No new records found`);
            } else {
                console.log(`   🔄 Total new records found: ${allNewLines.length}`);
                // Show first few lines as preview
                const previewLines = allNewLines.slice(0, 3);
                previewLines.forEach((line, index) => {
                    console.log(`   ${index + 1}. ${line}`);
                });
                if (allNewLines.length > 3) {
                    console.log(`   ... and ${allNewLines.length - 3} more lines`);
                }
            }

            return allNewLines;
        } catch (error) {
            console.error(`❌ Error finding new records in CSV for ${areaName}:`, error);
            return [];
        }
    }
    
    /**
     * STEP 4: Convert CSV lines to Record objects and insert into database */ 
    async processNewRecords(areaName, areaId, newLines) {
        try {
            if (newLines.length === 0) {
                return { processed: 0, total : 0};
            }

            console.log(` 🔄 Converting ${newLines.length} lines to records...`);

            // Convert CSV lines to Record objects
            const records = [];
            for (const line of newLines) {
                const record = this.csvLineToRecord(line, areaId);
                if (record) {
                    records.push(record);
                }
            }

            if (records.length === 0) {
                console.log(` ⚠️ No valid records to insert`);
                return { processed: 0, total: newLines.length };
            }
            
            // Insert records into MongoDB
            console.log(`Inserting ${records.length} records into database...`);
            const result = await Record.insertMany(records, { ordered: false });
            console.log(`✅ Successfully inserted ${result.length} records`);
            return { processed: result.length, total: newLines.length };

        } catch (error) {
            console.error(`❌ Error processing new records for ${areaName}:`, error);
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
     * Main Processing Method
     */
    async processAllAreas() {
        try {
            // Step 1: Get all area names from database
            console.log('\n📋Step 1: Getting all area names from database');
            const areas = await this.getAllAreaNames();

            if (areas.length === 0) {
                console.log('❌ No areas found in database');
                return [];
            }

            // Step 2: Get latest record for each area from database
            console.log('\n🔍 STEP 2: Getting latest record for each area from database');
            const latestRecords = await this.getLatestRecordForEachArea(areas);

            // Step 3 & 4: Find the not processed records and process records of each area
            const results = []
            console.log('\n🔄 STEP 3 & 4: Processing new records for each area');
            for (const area of areas) {
                const areaId = area._id.toString();
                const latestRecordInfo  = latestRecords[areaId];
                console.log(`\n📁 Processing area: ${area.name}`);

                // Step 3: Find new records in CSV (folder simulation) after latest line
                const newLines = await this.findNewRecordsInCSV(area.name, areaId, latestRecordInfo);
                // Step 4: Process and insert new records
                const result = await this.processNewRecords(area.name, areaId, newLines);

                results.push({
                    areaName: area.name,
                    areaId: areaId,
                    latestRecordDateTime: latestRecordInfo.latestRecord ? latestRecordInfo.latestRecord.datetime : "None",
                    newRecordsFound: newLines.length,
                    processed: result.processed,
                    total: result.total,
                    error: result.error
                });

                // Add a small delay to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Print summary
            console.log('\n === PROCESSING SUMMARY ===');
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
        console.log('Processing all areas...');
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
// if (import.meta.url === `file://${process.argv[1]}`) {
//     console.log("Check");
//     main().catch(console.error);
// }

main().catch(console.error);

export default IncrementalDataProcessor;