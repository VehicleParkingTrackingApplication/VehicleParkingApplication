import Area from '../models/Area.js';
import FtpServer from '../models/FtpServer.js';
import Notification from '../models/Notification.js';
import { FtpService } from '../services/ftpService.js';
import { webSocketService } from '../services/webSocketService.js';
import { Client } from 'basic-ftp';

class parkingAreaController {
    // not use this function
    async index(req, res) {
        const parkingArea = await Area.find({});
        return res.json(parkingArea);
    }

    // get all parking areas of a business
    async getAllAreasByBusiness(req, res) {
        try {
            const businessId = req.user.businessId;
            if (!businessId) {
                return res.status(400).json({
                    success: false,
                    message: 'Business ID is required'
                });
            }

            // Fix: Get pagination parameters from req.query instead of req.params
            const page = parseInt(req.query.page) - 1 || 0;
            const limit = parseInt(req.query.limit) || 3;
            const search = req.query.search || "";
            
            // Create RegExp object for the search
            const searchRegex = new RegExp(search, 'i'); // i for case-insensitive
            
            // Sorting
            let sortField = req.query.sortBy || "createdAt";
            let sortOrder = req.query.sortOrder === "desc" ? -1 : 1;
            const sort = { [sortField]: sortOrder };
            
            const parkingArea = await Area.find(
                {  
                    businessId: businessId, 
                    name: { $regex: searchRegex }
                })
                .skip(page * limit)
                .limit(limit)
                .sort(sort);
            
            const total = await Area.countDocuments({
                businessId: businessId, 
                name: { $regex: searchRegex }
            });

            if (!parkingArea || parkingArea.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: [],
                    pagination: {
                        total: 0,
                        page: page + 1,
                        limit,
                        totalPages: 0
                    },
                    message: 'No parking areas found for this business'
                });
            }
            
            return res.status(200).json({
                success: true,
                data: parkingArea,
                pagination: {
                    total,
                    page: page + 1,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Error fetching parking areas',
                error: error.message
            });
        }
    }

    // get area information detail by areaId 
    async getAreaDetails(req, res) {
        try {
            const { areaId } = req.params;
            const area = await Area.findById(areaId);
            if (!area) {
                return res.status(404).json({
                    success: false,
                    message: "Area not found"
                });
            }
            return res.status(200).json({
                success: true,
                message: "Area details fetched successfully",
                data: area
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // input parking area for business
    async inputParkingArea(req, res) {
        try {
            const { name, capacity, location } = req.body;
            const businessId = req.user.businessId;

            if (!businessId || !name || !location) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Misisng required fields" 
                });
            }

            const existingArea = Area.findOne({ name: name });
            if (!existingArea) {
                return res.status(400).json({
                    success: false,
                    message: "This name is already registered for another parking area!"
                })
            }

            const newArea = Area({
                businessId: businessId,
                name: name,
                capacity: capacity,
                location: location
            });
            const savedArea = await newArea.save();


            res.status(201).json({
                success: true,
                message: "Area saved successfully",
                data: savedArea
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // input the info of ftp server for a specific area
    async saveFtpServer(req, res) {
        try {
            const { areaId } = req.params;
            const { host, port, user, password, secure, secureOptions, selectedFolder } = req.body;
            
            if (!areaId || !host || !port || !user || !password || !selectedFolder) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required fields: areaId, host, port, user, password, folder"
                });
            }

            // First, check if the area exists
            const area = await Area.findById(areaId);
            if (!area) {
                return res.status(404).json({
                    success: false,
                    message: "Area not found"
                }); 
            }

            let ftpServer;
            let isNewFtpServer = false;

            // Check if area already has an FTP server
            if (area.ftpServer) {
                // Update existing FTP server
                console.log(`Updating existing FTP server for area: ${areaId}`);
                
                ftpServer = await FtpServer.findByIdAndUpdate(
                    area.ftpServer,
                    {
                        host: host,
                        port: parseInt(port),
                        user: user,
                        password: password,
                        secure: secure === 'true' || secure === true,
                        secureOptions: secureOptions || { rejectUnauthorized: false },
                        folder: selectedFolder
                    },
                    { new: true, runValidators: true }
                );

                if (!ftpServer) {
                    return res.status(404).json({
                        success: false,
                        message: "FTP server not found for this area"
                    });
                }

                console.log(`✅ Updated existing FTP server: ${ftpServer._id}`);
            } else {
                // Create new FTP server
                console.log(`Creating new FTP server for area: ${areaId}`);
                
                ftpServer = new FtpServer({
                    host: host,
                    port: parseInt(port),
                    user: user,
                    password: password,
                    secure: secure === 'true' || secure === true,
                    secureOptions: secureOptions || { rejectUnauthorized: false },
                    folder: selectedFolder
                });

                ftpServer = await ftpServer.save();
                isNewFtpServer = true;

                // Update area with new FTP server reference
                await Area.findByIdAndUpdate(
                    areaId,
                    { ftpServer: ftpServer._id },
                    { new: true }
                );

                console.log(`✅ Created new FTP server: ${ftpServer._id} and linked to area: ${areaId}`);
            }

            return res.status(200).json({
                success: true,
                message: "FTP server saved successfully",
                ftpServer: {
                    _id: ftpServer._id,
                    host: ftpServer.host,
                    port: ftpServer.port,
                    user: ftpServer.user,
                    secure: ftpServer.secure,
                    secureOptions: ftpServer.secureOptions,
                    folder: ftpServer.folder
                }
            });

        } catch (error) {
            console.error('Error in inputFtpServer:', error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Trigger FTP server for a specific area
    async triggerFtpServer(req, res) {
        try {
            const { areaId } = req.params;
            if (!areaId) {
                return res.status(400).json({
                    success: false,
                    message: "Area ID is required"
                });
            }

            // Check if the area exists and belongs to the current user's business
            const area = await Area.findById(areaId);
            if (!area) {
                return res.status(404).json({
                    success: false,
                    message: "Area not found"
                });
            }


            // Check if the area has an FTP server configured
            if (!area.ftpServer) {
                return res.status(400).json({
                    success: false,
                    message: "No FTP server configured for this area"
                });
            }

            // Step 1: Reset saveTimestamp and currentCapacity
            const updatedArea = await Area.findByIdAndUpdate(
                areaId,
                { 
                    savedTimestamp: '',
                    currentCapacity: 0
                },
                { new: true }
            );

            if (!updatedArea) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to reset area data"
                });
            }

            // Step 2: Trigger FTP data fetching
            console.log(`Triggering FTP data fetch for area: ${areaId}`);
            const ftpResult = await FtpService.processArea(areaId);

            if (!ftpResult.success) {
                return res.status(500).json({
                    success: false,
                    message: "FTP data fetching failed",
                    error: ftpResult.error
                });
            }

            // Step 3: Create notification for successful data reload
            const notification = new Notification({
                areaId: areaId,
                status: 'unread',
                message: `Data reload completed successfully for ${area.name}`,
                type: 'system',
                currentCapacity: updatedArea.currentCapacity,
                totalCapacity: updatedArea.capacity
            });

            const savedNotification = await notification.save();

            // Step 4: Send WebSocket notification to clients
            webSocketService.sendToArea(areaId, 'ftp-data-reloaded', {
                areaId: areaId,
                areaName: area.name,
                timestamp: new Date().toISOString(),
                message: 'FTP data reload completed successfully',
                notificationId: savedNotification._id,
                currentCapacity: updatedArea.currentCapacity,
                totalCapacity: updatedArea.capacity
            });

            console.log(`✅ FTP trigger completed successfully for area: ${areaId}`);
            console.log(`📢 Notification created: ${savedNotification._id}`);
            console.log(`🔔 WebSocket notification sent to area: ${areaId}`);

            return res.status(200).json({
                success: true,
                message: "FTP server triggered successfully",
                data: {
                    areaId: areaId,
                    areaName: area.name,
                    resetData: {
                        savedTimestamp: updatedArea.savedTimestamp,
                        currentCapacity: updatedArea.currentCapacity
                    },
                    ftpResult: ftpResult,
                    notificationId: savedNotification._id
                }
            });

        } catch (error) {
            console.error(`❌ Error triggering FTP server for area ${req.params.areaId}:`, error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
    }

    // Test FTP server connectivity before saving
    async testFtpServerConnection(req, res) {
        try {
            const { areaId } = req.params;
            if (!areaId) {
                return res.status(400).json({
                    success: false,
                    message: "Area ID is required"
                });
            }
            const { host, port, user, password, secure, secureOptions } = req.body;
            
            // Validate required fields
            if (!host || !port || !user || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Missing required FTP server fields: host, port, user, password"
                });
            }
            
            const client = new Client();
            let connectionSuccessful = false;
            let errorMessage = '';
            let availableFolders = [];

            try {
                // Set timeout for connection test (10 seconds)
                client.ftp.timeout = 10000;

                // Attempt to connect to FTP server
                await client.access({
                    host: host,
                    port: parseInt(port),
                    user: user,
                    password: password,
                    secure: secure === 'true' || secure === true,
                    secureOptions: secureOptions || { rejectUnauthorized: false }
                });

                // Test if we can list directory (basic connectivity test)
                const listing = await client.list();
                
                // Extract folder names from the listing
                availableFolders = listing
                    .filter(item => item.type === 2) // 2 = directory, 1 = file
                    .map(item => ({
                        name: item.name,
                        size: item.size,
                        modifiedAt: item.modifiedAt,
                        permissions: item.permissions
                    }))
                    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

                connectionSuccessful = true;
                
            } catch (error) {
                connectionSuccessful = false;
                errorMessage = error.message;
            } finally {
                // Always close the connection
                try {
                    client.close();
                } catch (closeError) {
                    // Ignore close errors
                }
            }

            // Return the result
            if (!connectionSuccessful) {
                return res.status(400).json({
                    success: false,
                    message: 'FTP server connection failed!',
                    error: errorMessage
                });
            }

            return res.status(200).json({
                success: true,
                data: {
                    canConnect: connectionSuccessful,
                    message: 'FTP server connection successful',
                    availableFolders: availableFolders,
                    totalFolders: availableFolders.length
                }
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Internal server error during FTP connection test",
                error: error.message
            });
        }
    }
}

export default new parkingAreaController();
