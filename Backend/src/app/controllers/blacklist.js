// Blacklist Controller
import Blacklist from '../models/Blacklist.js';

class BlacklistController {
    async create(req, res) {
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

    async getAllBlacklist(req, res) {
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
}
