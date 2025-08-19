import { uploadImageToS3, imageExistsInS3, getPresignedUrl } from "../services/s3Service.js";
import dotenv from 'dotenv';

dotenv.config();

async function testS3Integration() {
    try {
        console.log('Testing S3 Integration...');
        
        // Test data
        const testAreaId = 'test-area-123';
        const testFileName = 'test-image.jpg';
        const testImageBuffer = Buffer.from('fake-image-data');
        
        // Test 1: Check if image exists (should be false for new image)
        console.log('\n1. Testing imageExistsInS3...');
        const exists = await imageExistsInS3(testFileName, testAreaId);
        console.log(`Image exists: ${exists}`);
        
        // Test 2: Upload image
        console.log('\n2. Testing uploadImageToS3...');
        const imageUrl = await uploadImageToS3(testImageBuffer, testFileName, testAreaId);
        console.log(`Uploaded image URL: ${imageUrl}`);
        
        // Test 3: Check if image exists after upload (should be true)
        console.log('\n3. Testing imageExistsInS3 after upload...');
        const existsAfterUpload = await imageExistsInS3(testFileName, testAreaId);
        console.log(`Image exists after upload: ${existsAfterUpload}`);
        
        // Test 4: Generate presigned URL
        console.log('\n4. Testing getPresignedUrl...');
        const presignedUrl = await getPresignedUrl(testFileName, testAreaId, 3600);
        console.log(`Presigned URL: ${presignedUrl}`);
        
        console.log('\n✅ All S3 integration tests passed!');
        
    } catch (error) {
        console.error('❌ S3 integration test failed:', error);
        console.log('\nMake sure you have:');
        console.log('1. AWS credentials configured in .env file');
        console.log('2. S3 bucket created and accessible');
        console.log('3. IAM permissions for S3 operations');
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testS3Integration();
}

export default testS3Integration;