import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

class S3Service {
    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        this.bucketName = process.env.S3_BUCKET_NAME || 'parking-images-bucket';
    }

    /**
     * Upload image to S3
     * @param {Buffer} imageBuffer - Image data as buffer
     * @param {string} key - S3 object key
     * @param {string} mimeType - MIME type of the image
     * @returns {Promise<Object>} Upload result
     */
    async uploadImage(imageBuffer, key, mimeType) {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: imageBuffer,
                ContentType: mimeType,
                Metadata: {
                    uploadedAt: new Date().toISOString()
                }
            });

            const result = await this.s3Client.send(command);
            
            return {
                success: true,
                etag: result.ETag,
                location: `https://${this.bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`
            };
        } catch (error) {
            console.error('S3 upload error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if object exists in S3
     * @param {string} key - S3 object key
     * @returns {Promise<boolean>} True if object exists
     */
    async objectExists(key) {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });
            await this.s3Client.send(command);
            return true;
        } catch (error) {
            if (error.name === 'NotFound') {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get signed URL for image access
     * @param {string} key - S3 object key
     * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
     * @returns {Promise<string>} Signed URL
     */
    async getSignedUrl(key, expiresIn = 3600) {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
            return signedUrl;
        } catch (error) {
            console.error('S3 signed URL error:', error);
            throw error;
        }
    }

    /**
     * Get object metadata
     * @param {string} key - S3 object key
     * @returns {Promise<Object>} Object metadata
     */
    async getObjectMetadata(key) {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key
            });

            const result = await this.s3Client.send(command);
            return {
                success: true,
                metadata: {
                    contentLength: result.ContentLength,
                    contentType: result.ContentType,
                    lastModified: result.LastModified,
                    etag: result.ETag
                }
            };
        } catch (error) {
            console.error('S3 metadata error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Generate S3 key for parking image
     * @param {string} areaId - Area ID
     * @param {string} plateNumber - Plate number
     * @param {Date} date - Date of the image
     * @param {string} extension - File extension
     * @returns {string} S3 key
     */
    generateS3Key(areaId, plateNumber, date, extension = 'jpg') {
        const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        const sanitizedPlateNumber = plateNumber.replace(/[^a-zA-Z0-9]/g, '_');
        return `parking-images/${areaId}/${dateStr}/${sanitizedPlateNumber}.${extension}`;
    }
}

export default new S3Service();
