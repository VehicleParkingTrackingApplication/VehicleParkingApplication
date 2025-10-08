import imageFetchService from '../services/imageFetchService.js';
import s3Service from '../services/s3Service.js';
import Image from '../models/Image.js';
import Area from '../models/Area.js';

class ImageController {

    async fetchAndLocalSaveImageUrl(req, res) {
        try {
            const { areaId } = req.params;
            const { imageUrl } = req.body;
            
            // Validate parameters
            if (!areaId || !imageUrl) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: areaId, imageUrl'
                });
            }

            // Check if area exists
            const area = await Area.findById(areaId);
            if (!area) {
                return res.status(404).json({
                    success: false,
                    error: 'Area not found'
                });
            }

            // Extract filename from imageUrl
            // Expected format: 2025-07-01_07-56-53-630_ESN13Z.jpg
            const filename = imageUrl.split('/').pop(); // Get the last part after the last slash
            console.log(`Extracted filename: ${filename}`);

            // Parse filename to extract date and plate number
            // Format: YYYY-MM-DD_HH-MM-SS-mmm_PLATENUMBER.jpg
            const filenameParts = filename.split('_');
            if (filenameParts.length < 3) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid image filename format. Expected: YYYY-MM-DD_HH-MM-SS-mmm_PLATENUMBER.jpg'
                });
            }

            const datePart = filenameParts[0]; // YYYY-MM-DD
            // const timePart = filenameParts[1]; // HH-MM-SS-mmm
            const plateNumberWithExt = filenameParts.slice(2).join('_'); // PLATENUMBER.jpg
            const plateNumber = plateNumberWithExt.replace(/\.(jpg|jpeg|png|bmp|gif)$/i, ''); // Remove extension

            // console.log(`Extracted - Date: ${datePart}, Time: ${timePart}, Plate: ${plateNumber}`);

            // Fetch and save image locally from FTP
            const result = await imageFetchService.fetchAndLocalSaveImage(areaId, imageUrl, datePart);
            
            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                data: {
                    message: 'Image fetched and saved locally successfully',
                    localFilePath: result.localFilePath || 'Saved to service directory'
                }
            });

        } catch (error) {
            console.error('Fetch and local save image error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    /**
     * Get image URL for a specific vehicle record
     * GET /api/parking/image/:areaId/:plateNumber/:date/:time
     */
    async getImageUrl(req, res) {
        try {
            const { areaId, plateNumber, date, time } = req.params;
            
            // Validate parameters
            if (!areaId || !plateNumber || !date || !time) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: areaId, plateNumber, date, time'
                });
            }

            // Parse date
            let parsedDate;
            try {
                parsedDate = new Date(date);
                if (isNaN(parsedDate.getTime())) {
                    throw new Error('Invalid date format');
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid date format. Use YYYY-MM-DD format.'
                });
            }

            // Check if area exists
            const area = await Area.findById(areaId);
            if (!area) {
                return res.status(404).json({
                    success: false,
                    error: 'Area not found'
                });
            }

            // Get image URL (fetch from FTP if not cached)
            const result = await imageFetchService.getImageUrl(areaId, plateNumber, parsedDate);
            
            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    error: result.error
                });
            }

            res.json({
                success: true,
                data: {
                    url: result.url,
                    plateNumber,
                    date: parsedDate.toISOString().split('T')[0],
                    areaId,
                    fromCache: result.fromCache,
                    metadata: {
                        fileSize: result.image.fileSize,
                        mimeType: result.image.mimeType,
                        uploadedAt: result.image.uploadedAt,
                        accessCount: result.image.accessCount
                    }
                }
            });

        } catch (error) {
            console.error('Get image URL error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get image metadata without fetching the actual image
     * GET /api/parking/image/:areaId/:plateNumber/:date/metadata
     */
    async getImageMetadata(req, res) {
        try {
            const { areaId, plateNumber, date } = req.params;
            
            // Validate parameters
            if (!areaId || !plateNumber || !date) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: areaId, plateNumber, date'
                });
            }

            // Parse date
            let parsedDate;
            try {
                parsedDate = new Date(date);
                if (isNaN(parsedDate.getTime())) {
                    throw new Error('Invalid date format');
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid date format. Use YYYY-MM-DD format.'
                });
            }

            // Find image in database
            const image = await Image.findOne({
                areaId,
                plateNumber,
                date: {
                    $gte: new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate()),
                    $lt: new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate() + 1)
                }
            });

            if (!image) {
                return res.status(404).json({
                    success: false,
                    error: 'Image not found in cache. Use the main endpoint to fetch from FTP server.'
                });
            }

            res.json({
                success: true,
                data: {
                    plateNumber,
                    date: parsedDate.toISOString().split('T')[0],
                    areaId,
                    metadata: {
                        originalFileName: image.originalFileName,
                        fileSize: image.fileSize,
                        mimeType: image.mimeType,
                        uploadedAt: image.uploadedAt,
                        lastAccessedAt: image.lastAccessedAt,
                        accessCount: image.accessCount
                    }
                }
            });

        } catch (error) {
            console.error('Get image metadata error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Get all cached images for an area
     * GET /api/parking/image/:areaId/cached
     */
    async getCachedImages(req, res) {
        try {
            const { areaId } = req.params;
            const { page = 1, limit = 20, plateNumber } = req.query;
            
            // Validate areaId
            if (!areaId) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing areaId parameter'
                });
            }

            // Check if area exists
            const area = await Area.findById(areaId);
            if (!area) {
                return res.status(404).json({
                    success: false,
                    error: 'Area not found'
                });
            }

            // Build query
            const query = { areaId };
            if (plateNumber) {
                query.plateNumber = { $regex: plateNumber, $options: 'i' };
            }

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Get images with pagination
            const images = await Image.find(query)
                .sort({ uploadedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('plateNumber date fileSize mimeType uploadedAt lastAccessedAt accessCount');

            const total = await Image.countDocuments(query);

            res.json({
                success: true,
                data: {
                    images,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / parseInt(limit))
                    }
                }
            });

        } catch (error) {
            console.error('Get cached images error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Force fetch image from FTP server (bypass cache)
     * POST /api/parking/image/:areaId/:plateNumber/:date/fetch
     */
    async forceFetchImage(req, res) {
        try {
            const { areaId, plateNumber, date } = req.params;
            
            // Validate parameters
            if (!areaId || !plateNumber || !date) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: areaId, plateNumber, date'
                });
            }

            // Parse date
            let parsedDate;
            try {
                parsedDate = new Date(date);
                if (isNaN(parsedDate.getTime())) {
                    throw new Error('Invalid date format');
                }
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid date format. Use YYYY-MM-DD format.'
                });
            }

            // Check if area exists
            const area = await Area.findById(areaId);
            if (!area) {
                return res.status(404).json({
                    success: false,
                    error: 'Area not found'
                });
            }

            // Force fetch from FTP (this will overwrite existing cache)
            const result = await imageFetchService.fetchAndUploadImage(areaId, plateNumber, parsedDate);
            
            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    error: result.error
                });
            }

            // Generate signed URL
            const signedUrl = await s3Service.getSignedUrl(result.image.s3Key);

            res.json({
                success: true,
                data: {
                    url: signedUrl,
                    plateNumber,
                    date: parsedDate.toISOString().split('T')[0],
                    areaId,
                    fromCache: false,
                    metadata: {
                        fileSize: result.image.fileSize,
                        mimeType: result.image.mimeType,
                        uploadedAt: result.image.uploadedAt,
                        accessCount: result.image.accessCount
                    }
                }
            });

        } catch (error) {
            console.error('Force fetch image error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }

    /**
     * Clean up old cached images
     * DELETE /api/parking/image/cleanup
     */
    async cleanupOldImages(req, res) {
        try {
            const { daysOld = 30 } = req.body;
            
            const result = await imageFetchService.cleanupOldImages(parseInt(daysOld));
            
            res.json({
                success: result.success,
                data: {
                    deletedCount: result.deletedCount,
                    totalFound: result.totalFound,
                    daysOld: parseInt(daysOld)
                },
                error: result.error
            });

        } catch (error) {
            console.error('Cleanup old images error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
}

export default new ImageController();
