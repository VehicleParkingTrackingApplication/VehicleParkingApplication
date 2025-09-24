// Blacklist Controller
import Blacklist from '../models/Blacklist.js';

class BlacklistController {
    async createBlacklist(req, res) {
        try {
            const { businessId, plateNumber, reason } = req.body;
            if (!businessId || !plateNumber || !reason) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields for creating blacklist'
                });
            }
            const normalizedPlateNumber = plateNumber.trim().toUpperCase();
            // check exisiting blacklist with businessId and plateNumber to prevent duplicate
            const existingBlacklist = await Blacklist.findOne({
                businessId,
                plateNumber: normalizedPlateNumber
            });

            if (existingBlacklist) {
                return res.status(400).json({
                    success: false,
                    message: 'Blacklist already exists'
                });
            }
            const newBlacklist = await Blacklist.create({
                businessId,
                plateNumber: normalizedPlateNumber,
                reason
            });
            return res.status(201).json({
                success: true,
                message: 'Blacklist created successfully',
                data: newBlacklist
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error for creating blacklist',
                error: error.message
            });
        }
    }

    async getAllBlacklistByBusinessId(req, res) {
        try {
            const { businessId, page = 1, limit = 10 } = req.query;
            if (!businessId) {
                return res.status(400).json({
                    success: false,
                    message: 'Business ID is required'
                });
            }
            const pageNum = parseInt(req.query.page) - 1 || 0;
            const limitNum = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;
            
            const total = await Blacklist.countDocuments({ businessId });
            const blacklist = await Blacklist.find({ businessId })
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                data: blacklist,
                pagination: {
                    total,
                    page: pageNum + 1,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum)
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Internal server error for getting all blacklist',
                error: error.message
            });
        }
    }

    // Search blacklist entries by plate number
    async searchBlacklistByPlateNumber(req, res) {
        try {
            const { plateNumber, businessId, page = 1, limit = 10 } = req.query;
            
            if (!plateNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Plate number is required'
                });
            }

            const normalizedPlateNumber = plateNumber.trim().toUpperCase();
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const skip = (pageNum - 1) * limitNum;

            // Build query
            const query = { plateNumber: normalizedPlateNumber };
            
            // If businessId is provided, search only within that business
            if (businessId) {
                query.businessId = businessId;
            }

            // Get total count for pagination
            const total = await Blacklist.countDocuments(query);

            // Get blacklist entries with business information
            const blacklistEntries = await Blacklist.find(query)
                .populate('businessId', 'businessName location email phoneNumber')
                .skip(skip)
                .limit(limitNum)
                .sort({ createdAt: -1 });

            // Check if plate number is blacklisted anywhere
            const isBlacklisted = blacklistEntries.length > 0;

            return res.status(200).json({
                success: true,
                data: {
                    plateNumber: normalizedPlateNumber,
                    isBlacklisted: isBlacklisted,
                    entries: blacklistEntries,
                    totalFound: total
                },
                pagination: {
                    currentPage: pageNum,
                    totalPages: Math.ceil(total / limitNum),
                    totalEntries: total,
                    hasNextPage: pageNum * limitNum < total,
                    hasPrevPage: pageNum > 1
                }
            });

        } catch (error) {
            console.error('Error searching blacklist by plate number:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error for searching blacklist',
                error: error.message
            });
        }
    }

    // Check if a plate number is blacklisted (quick check without pagination)
    async checkBlacklistStatus(req, res) {
        try {
            const { plateNumber, businessId } = req.query;
            
            if (!plateNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Plate number is required'
                });
            }

            const normalizedPlateNumber = plateNumber.trim().toUpperCase();

            // Build query
            const query = { plateNumber: normalizedPlateNumber };
            
            // If businessId is provided, check only within that business
            if (businessId) {
                query.businessId = businessId;
            }

            // Find blacklist entries
            const blacklistEntries = await Blacklist.find(query)
                .populate('businessId', 'businessName location')
                .sort({ createdAt: -1 });

            const isBlacklisted = blacklistEntries.length > 0;

            return res.status(200).json({
                success: true,
                data: {
                    plateNumber: normalizedPlateNumber,
                    isBlacklisted: isBlacklisted,
                    blacklistCount: blacklistEntries.length,
                    entries: blacklistEntries.map(entry => ({
                        businessName: entry.businessId.businessName,
                        businessLocation: entry.businessId.location,
                        reason: entry.reason,
                        blacklistedAt: entry.createdAt
                    }))
                }
            });

        } catch (error) {
            console.error('Error checking blacklist status:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error for checking blacklist status',
                error: error.message
            });
        }
    }
}

export default new BlacklistController();