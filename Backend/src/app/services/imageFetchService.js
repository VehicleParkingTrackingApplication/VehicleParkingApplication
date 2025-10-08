import { Client } from "basic-ftp";
import Area from "../models/Area.js";
import Image from "../models/Image.js";
import s3Service from "./s3Service.js";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

class ImageFetchService {
    
    /**
     * Fetch image from FTP server and save locally
     * @param {string} areaId - Area ID
     * @param {string} imageUrl - Image URL/filename
     * @param {string} folderName - Folder name on FTP server
     * @returns {Promise<Object>} Result object with success status and image data
     */
    async fetchAndLocalSaveImage(areaId, imageUrl, folderName) {
        try {
            // Initialize base public image directory
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const baseImageDir = path.resolve(process.cwd(), 'public', 'image');
            
            // Get area and FTP server info
            const area = await Area.findById(areaId).populate('ftpServer');
            if (!area || !area.ftpServer) {
                return {
                    success: false,
                    error: 'Area or FTP server not found'
                };
            }

            const ftpInfo = area.ftpServer;
            const client = new Client();
            client.ftp.verbose = false; // Reduce logging for image fetching

            try {
                await client.access({
                    host: ftpInfo.host,
                    port: ftpInfo.port,
                    user: ftpInfo.user,
                    password: ftpInfo.password,
                    secure: ftpInfo.secure,
                    secureOptions: ftpInfo.secureOptions,
                    folder: ftpInfo.folder || "CF02200-200034BE004"
                });

                const targetFolder = ftpInfo.folder || "CF02200-200034BE004";
                await client.cd(targetFolder);

                // Try to access the specified folder
                try {
                    await client.cd(folderName);
                } catch (error) {
                    return {
                        success: false,
                        error: `Folder ${folderName} not found on FTP server`
                    };
                }

                // List files in the folder
                const files = await client.list();
                console.log(`Found ${files.length} files in folder ${folderName}`);
                
                // Extract filename from imageUrl
                const targetFileName = imageUrl.split('/').pop();
                console.log(`Looking for file: ${targetFileName}`);
                
                // Look for the specific image file
                let imageFile = null;
                for (const file of files) {
                    if (file.type === 1 && file.name === targetFileName) { // Regular file with exact name match
                        imageFile = file;
                        console.log(`Found matching image file: ${file.name}`);
                        break;
                    }
                }

                if (!imageFile) {
                    console.log(`Image file ${targetFileName} not found in folder ${folderName}`);
                    console.log(`Available files: ${files.map(f => f.name).join(', ')}`);
                    return {
                        success: false,
                        error: `Image file ${targetFileName} not found in folder ${folderName}`
                    };
                }

                // Ensure target directory exists: public/image/<folderName>
                const targetDir = path.join(baseImageDir, folderName);
                try {
                    fs.mkdirSync(targetDir, { recursive: true });
                } catch (mkErr) {
                    console.error('Failed to create target directory:', mkErr);
                    return {
                        success: false,
                        error: `Failed to create directory ${targetDir}: ${mkErr.message}`
                    };
                }

                // Download image to buffer using a temporary file approach
                let imageBuffer;
                try {
                    // Create a temporary file path inside target directory
                    const tempFilePath = path.join(targetDir, `temp_${Date.now()}_${imageFile.name}`);
                    
                    // Download to temporary file (localPath, remotePath)
                    await client.downloadTo(tempFilePath, imageFile.name);
                    
                    // Read the file into buffer
                    imageBuffer = fs.readFileSync(tempFilePath);
                    
                    // Clean up temporary file
                    fs.unlinkSync(tempFilePath);
                    
                } catch (downloadError) {
                    console.error('Download error:', downloadError);
                    return {
                        success: false,
                        error: `Failed to download image: ${downloadError.message}`
                    };
                }
                
                // Determine file extension and MIME type
                const fileExtension = this.getFileExtension(imageFile.name);
                const mimeType = this.getMimeType(fileExtension);

                // Save image to public/image/<folderName>
                const localFileName = imageFile.name;
                const localFilePath = path.join(targetDir, localFileName);
                
                try {
                    fs.writeFileSync(localFilePath, imageBuffer);
                    console.log(`Image saved locally: ${localFilePath}`);
                } catch (writeError) {
                    console.error('Failed to save image locally:', writeError);
                }
                
                return {
                    success: true,
                    localFilePath: localFilePath,
                    fromCache: false
                };
            } finally {
                client.close();
            }

        } catch (error) {
            console.error('Image fetch error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }


    /**
     * Fetch image from FTP server and upload to S3
     * @param {string} areaId - Area ID
     * @param {string} plateNumber - Plate number
     * @param {Date} date - Date of the image
     * @returns {Promise<Object>} Result object with success status and image data
     */
    async fetchAndUploadImage(areaId, plateNumber, date) {
        try {
            // Check if image already exists in database
            const existingImage = await Image.findOne({
                areaId,
                plateNumber,
                date: {
                    $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                    $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                }
            });

            if (existingImage) {
                // Update access statistics
                await existingImage.updateAccess();
                return {
                    success: true,
                    image: existingImage,
                    fromCache: true
                };
            }

            // Get area and FTP server info
            const area = await Area.findById(areaId).populate('ftpServer');
            if (!area || !area.ftpServer) {
                return {
                    success: false,
                    error: 'Area or FTP server not found'
                };
            }

            const ftpInfo = area.ftpServer;
            const client = new Client();
            client.ftp.verbose = false; // Reduce logging for image fetching

            try {
                await client.access({
                    host: ftpInfo.host,
                    port: ftpInfo.port,
                    user: ftpInfo.user,
                    password: ftpInfo.password,
                    secure: ftpInfo.secure,
                    secureOptions: ftpInfo.secureOptions,
                    folder: ftpInfo.folder || "CF02200-200034BE004"
                });

                const targetFolder = ftpInfo.folder || "CF02200-200034BE004";
                await client.cd(targetFolder);

                // Format date to match folder structure (YYYY-MM-DD)
                const dateStr = date.toISOString().split('T')[0];
                
                // Try to access the date folder
                try {
                    await client.cd(dateStr);
                } catch (error) {
                    return {
                        success: false,
                        error: `Date folder ${dateStr} not found on FTP server`
                    };
                }

                // List files in the date folder
                const files = await client.list();
                
                // Look for image file with plate number
                const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'];
                let imageFile = null;
                
                for (const file of files) {
                    if (file.type === 1) { // Regular file
                        const fileName = file.name.toLowerCase();
                        const plateNumberLower = plateNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
                        
                        // Check if file name contains plate number
                        if (fileName.includes(plateNumberLower)) {
                            // Check if it's an image file
                            const hasImageExtension = imageExtensions.some(ext => fileName.endsWith(ext));
                            if (hasImageExtension) {
                                imageFile = file;
                                break;
                            }
                        }
                    }
                }

                if (!imageFile) {
                    return {
                        success: false,
                        error: `Image not found for plate number ${plateNumber} on date ${dateStr}`
                    };
                }

                // Download image
                const imageBuffer = await client.downloadToBuffer(imageFile.name);
                
                // Determine file extension and MIME type
                const fileExtension = this.getFileExtension(imageFile.name);
                const mimeType = this.getMimeType(fileExtension);

                // Generate S3 key
                const s3Key = s3Service.generateS3Key(areaId, plateNumber, date, fileExtension);

                // Upload to S3
                const uploadResult = await s3Service.uploadImage(imageBuffer, s3Key, mimeType);
                
                if (!uploadResult.success) {
                    return {
                        success: false,
                        error: `Failed to upload to S3: ${uploadResult.error}`
                    };
                }

                // Save image metadata to database
                const imageRecord = new Image({
                    areaId,
                    plateNumber,
                    date,
                    originalFileName: imageFile.name,
                    s3Key,
                    s3Url: uploadResult.location,
                    fileSize: imageBuffer.length,
                    mimeType,
                    accessCount: 1
                });

                await imageRecord.save();

                return {
                    success: true,
                    image: imageRecord,
                    fromCache: false
                };

            } finally {
                client.close();
            }

        } catch (error) {
            console.error('Image fetch error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get image URL (from cache or fetch from FTP)
     * @param {string} areaId - Area ID
     * @param {string} plateNumber - Plate number
     * @param {Date} date - Date of the image
     * @param {string} time - Time string in HH-MM-SS-mmm format
     * @returns {Promise<Object>} Result object with image URL
     */
    async getImageUrl(areaId, plateNumber, date, time) {
        try {
            // First check if image exists in database
            const existingImage = await Image.findOne({
                areaId,
                plateNumber,
                date: {
                    $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                    $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
                }
            });

            if (existingImage) {
                // Update access statistics
                await existingImage.updateAccess();
                
                // Generate signed URL for S3 access
                const signedUrl = await s3Service.getSignedUrl(existingImage.s3Key);
                
                return {
                    success: true,
                    url: signedUrl,
                    image: existingImage,
                    fromCache: true
                };
            }

            // Image not in cache, fetch from FTP
            const fetchResult = await this.fetchAndUploadImage(areaId, plateNumber, date);
            
            if (fetchResult.success) {
                // Generate signed URL for the newly uploaded image
                const signedUrl = await s3Service.getSignedUrl(fetchResult.image.s3Key);
                
                return {
                    success: true,
                    url: signedUrl,
                    image: fetchResult.image,
                    fromCache: false
                };
            }

            return fetchResult;

        } catch (error) {
            console.error('Get image URL error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get file extension from filename
     * @param {string} filename - Filename
     * @returns {string} File extension
     */
    getFileExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : 'jpg';
    }

    /**
     * Get MIME type from file extension
     * @param {string} extension - File extension
     * @returns {string} MIME type
     */
    getMimeType(extension) {
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'gif': 'image/gif'
        };
        return mimeTypes[extension] || 'image/jpeg';
    }

    /**
     * Clean up old images from S3 and database
     * @param {number} daysOld - Number of days old to consider for cleanup
     * @returns {Promise<Object>} Cleanup result
     */
    async cleanupOldImages(daysOld = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            const oldImages = await Image.find({
                uploadedAt: { $lt: cutoffDate }
            });

            let deletedCount = 0;
            for (const image of oldImages) {
                try {
                    // Delete from S3 (optional - you might want to keep them)
                    // await s3Service.deleteObject(image.s3Key);
                    
                    // Delete from database
                    await Image.deleteOne({ _id: image._id });
                    deletedCount++;
                } catch (error) {
                    console.error(`Failed to delete image ${image._id}:`, error);
                }
            }

            return {
                success: true,
                deletedCount,
                totalFound: oldImages.length
            };

        } catch (error) {
            console.error('Cleanup error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

export default new ImageFetchService();
