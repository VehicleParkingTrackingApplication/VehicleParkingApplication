import { fetchDataFtpServer } from '../scripts/fetchDataFtpServer.js';

export class FtpService {
    static async processArea(areaId) {
        try {
            console.log(`🔄 Starting FTP processing for area: ${areaId}`);
            await fetchDataFtpServer(areaId);
            console.log(`✅ FTP processing completed for area: ${areaId}`);
            return { success: true, areaId };
        } catch (error) {
            console.error(`❌ FTP processing failed for area ${areaId}:`, error.message);
            return { success: false, areaId, error: error.message };
        }
    }

    static async processAllAreas(areaIds) {
        const results = [];
        console.log(`🔄 Starting FTP processing for ${areaIds.length} areas`);
        for (const areaId of areaIds) {
            try {
                const result = await fetchDataFtpServer(areaId);
                console.log(`Result: ${result}`);
                results.push(result);
            } catch(error) {
                results.push({ 
                    areaId, 
                    success: false, 
                    error: error.message 
                });
            }
        }
        
        // Only count valid results (not undefined/null)
        const validResults = results.filter(r => r !== undefined && r !== null);
        if (validResults.length > 0) {
            const successCount = validResults.filter(r => r.success).length;
            console.log(`✅ FTP processing completed: ${successCount}/${validResults.length} areas successful`);
        } else {
            console.log(`⚠️ No valid results to process`);
        }
        return results;
    }

    static async processDefaultArea() {
        const defaultAreaId = '687dde8379e977f9d2aaf8ef';
        return await this.processArea(defaultAreaId);
    }

    static async startPeriodicProcessing(areaIds, intervalMinutes = 60) {
        console.log(`🔄 Starting periodic FTP processing every ${intervalMinutes} minutes`);
        
        // Process immediately
        await this.processAllAreas(areaIds);
        
        // Set up periodic processing
        setInterval(async () => {
            console.log(`🔄 Running periodic FTP processing...`);
            await this.processAllAreas(areaIds);
        }, intervalMinutes * 60 * 1000);
    }
}