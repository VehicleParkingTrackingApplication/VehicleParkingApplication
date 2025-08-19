import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import dotenv from 'dotenv';

dotenv.config();

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'parking-monitoring-bucket';

/**
 * Upload image buffer to S3 bucket
 * @param {Buffer} imageBuffer - The image buffer to upload
 * @param {string} fileName - The filename for the image
 * @param {string} areaId - The parking area ID for organizing images
 * @returns {Promise<string>} - The S3 URL of the uploaded image
 */
export async function uploadImageToS3(imageBuffer, fileName, areaId) {
    try {
        // Create a unique key for the image in S3
        const key = `areas/${areaId}/${fileName}`;
        
        const uploadParams = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: imageBuffer,
            ContentType: 'image/jpeg', // Assuming JPEG format
            ACL: 'public-read', // Make the image publicly accessible
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);

        // Return the public URL of the uploaded image
        const imageUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${key}`;
        
        console.log(`Successfully uploaded image to S3: ${imageUrl}`);
        return imageUrl;
    } catch (error) {
        console.error('Error uploading image to S3:', error);
        throw error;
    }
}

/**
 * Generate a presigned URL for temporary access to an image
 * @param {string} fileName - The filename of the image
 * @param {string} areaId - The parking area ID
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - The presigned URL
 */
export async function getPresignedUrl(fileName, areaId, expiresIn = 3600) {
    try {
        const key = `areas/${areaId}/${fileName}`;
        
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
        return presignedUrl;
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        throw error;
    }
}

/**
 * Check if an image already exists in S3
 * @param {string} fileName - The filename of the image
 * @param {string} areaId - The parking area ID
 * @returns {Promise<boolean>} - True if image exists, false otherwise
 */
export async function imageExistsInS3(fileName, areaId) {
    try {
        const key = `areas/${areaId}/${fileName}`;
        
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);
        return true;
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            return false;
        }
        throw error;
    }
}