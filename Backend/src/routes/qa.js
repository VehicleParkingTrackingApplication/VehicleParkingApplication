import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get QA data from CSV file
router.get('/', (req, res) => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const csvPath = path.join(__dirname, '../../QA.csv');
    
    // Read the CSV file
    const csvData = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV data
    const lines = csvData.trim().split('\n');
    const headers = lines[0].split(',');
    const qaData = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= 2) {
        qaData.push({
          keyword: values[0].trim(),
          question: values.slice(1).join(',').trim() // Join remaining values in case question contains commas
        });
      }
    }
    
    res.json({
      success: true,
      data: qaData
    });
  } catch (error) {
    console.error('Error reading QA CSV file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to read QA data',
      error: error.message
    });
  }
});

export default router;
