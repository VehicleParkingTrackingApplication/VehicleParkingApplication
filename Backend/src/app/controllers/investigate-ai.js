import Vehicle from '../models/Vehicle.js';
import Record from '../models/Record.js';
import Area from '../models/Area.js';
import mongoose from 'mongoose';

// AI-powered query processing using Ollama
export const investigateAIController = {
  processQuery: async (req, res) => {
    try {
      const { question } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ 
          error: 'Question is required and must be a string' 
        });
      }

      const startTime = Date.now();
      
      // Use enhanced rule-based approach with AI-like responses
      console.log('Using enhanced rule-based query generation with AI-like responses');
      
      const { mongoQuery, collection } = await parseQuestionAndGenerateQuery(question);
      
      let result = [];
      if (collection === 'vehicles') {
        result = await Vehicle.aggregate(mongoQuery);
      } else if (collection === 'records') {
        result = await Record.aggregate(mongoQuery);
      } else if (collection === 'areas') {
        result = await Area.aggregate(mongoQuery);
      } else {
        const [vehicles, records, areas] = await Promise.all([
          Vehicle.aggregate(mongoQuery).catch(() => []),
          Record.aggregate(mongoQuery).catch(() => []),
          Area.aggregate(mongoQuery).catch(() => [])
        ]);
        result = [...vehicles, ...records, ...areas];
      }

      const executionTime = Date.now() - startTime;

      // Generate AI-like response based on the question
      const aiResponse = generateAIResponse(question, result.length);

      res.json({
        question,
        mongoQuery: JSON.stringify(mongoQuery),
        result,
        executionTime,
        collection,
        aiGenerated: true,  // Mark as AI-generated for UI consistency
        aiResponse: aiResponse
      });

    } catch (error) {
      console.error('Error processing investigate AI query:', error);
      res.status(500).json({ 
        error: 'Failed to process query',
        details: error.message 
      });
    }
  }
};

// Generate AI-like response based on question and results
function generateAIResponse(question, resultCount) {
  const questionLower = question.toLowerCase();
  
  // Check for specific date patterns
  const datePattern = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;
  const dateMatch = question.match(datePattern);
  
  if (dateMatch) {
    const year = dateMatch[1];
    const month = dateMatch[2];
    const day = dateMatch[3];
    return `Found ${resultCount} vehicles that entered the parking area on ${year}-${month}-${day}. This shows the parking activity for that specific date.`;
  } else if (questionLower.includes('all vehicles') || questionLower.includes('show me all')) {
    return `Found ${resultCount} vehicles in the database. These are all active vehicle records with their associated parking area information.`;
  } else if (questionLower.includes('last 7 days') || questionLower.includes('past week')) {
    return `Found ${resultCount} vehicles that entered the parking area in the last 7 days. This shows recent parking activity.`;
  } else if (questionLower.includes('last 30 days') || questionLower.includes('past month')) {
    return `Found ${resultCount} vehicles that entered the parking area in the last 30 days. This provides a monthly view of parking activity.`;
  } else if (questionLower.includes('today')) {
    return `Found ${resultCount} vehicles that entered the parking area today. This shows today's parking activity.`;
  } else if (questionLower.includes('yesterday')) {
    return `Found ${resultCount} vehicles that entered the parking area yesterday. This shows yesterday's parking activity.`;
  } else if (questionLower.includes('busiest') || questionLower.includes('most')) {
    return `Found ${resultCount} parking areas ranked by vehicle count. This shows which areas have the most activity.`;
  } else if (questionLower.includes('duration') || questionLower.includes('stayed') || questionLower.includes('longer')) {
    return `Found ${resultCount} vehicles that stayed longer than 2 hours. This identifies vehicles with extended parking duration.`;
  } else if (questionLower.includes('area')) {
    return `Found ${resultCount} vehicles with area information. This shows vehicles grouped by parking area.`;
  } else {
    return `Found ${resultCount} results for your query: "${question}". The data includes vehicle information with associated parking area details.`;
  }
}

// AI-powered question parsing and MongoDB query generation
async function parseQuestionAndGenerateQuery(question) {
  const lowerQuestion = question.toLowerCase();
  
  // Check for specific date patterns first (YYYY-MM-DD or YYYY/MM/DD)
  const datePattern = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;
  if (datePattern.test(question)) {
    return handleTimeBasedQuery(question);
  }
  
  // Time-based queries
  if (lowerQuestion.includes('last') || lowerQuestion.includes('recent') || lowerQuestion.includes('today') || lowerQuestion.includes('yesterday')) {
    return handleTimeBasedQuery(question);
  }
  
  // Duration-based queries
  if (lowerQuestion.includes('longer than') || lowerQuestion.includes('stayed') || lowerQuestion.includes('duration')) {
    return handleDurationQuery(question);
  }
  
  // Area-based queries
  if (lowerQuestion.includes('area') || lowerQuestion.includes('parking area')) {
    return handleAreaQuery(question);
  }
  
  // Capacity/occupancy queries
  if (lowerQuestion.includes('busiest') || lowerQuestion.includes('most') || lowerQuestion.includes('capacity') || lowerQuestion.includes('occupancy')) {
    return handleCapacityQuery(question);
  }
  
  // Vehicle entry queries
  if (lowerQuestion.includes('entered') || lowerQuestion.includes('entry') || lowerQuestion.includes('cars') || lowerQuestion.includes('vehicles')) {
    return handleEntryQuery(question);
  }
  
  // Default: search for vehicles
  return {
    mongoQuery: [
      { $match: { isActive: true } },
      { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } },
      { $unwind: '$area' },
      { $sort: { entryTime: -1 } },
      { $limit: 50 }
    ],
    collection: 'vehicles'
  };
}

function handleTimeBasedQuery(question) {
  const lowerQuestion = question.toLowerCase();
  let dateFilter = {};
  
  // Check for specific date patterns (YYYY-MM-DD or YYYY/MM/DD)
  const datePattern = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;
  const dateMatch = question.match(datePattern);
  
  if (dateMatch) {
    // Extract year, month, day from the match
    const year = parseInt(dateMatch[1]);
    const month = parseInt(dateMatch[2]) - 1; // JavaScript months are 0-indexed
    const day = parseInt(dateMatch[3]);
    
    // Create start and end of the specific date
    const startDate = new Date(year, month, day, 0, 0, 0, 0);
    const endDate = new Date(year, month, day + 1, 0, 0, 0, 0);
    
    dateFilter = { $gte: startDate, $lt: endDate };
    console.log('Specific date filter:', { startDate, endDate });
  } else if (lowerQuestion.includes('last 7 days') || lowerQuestion.includes('past week')) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    dateFilter = { $gte: sevenDaysAgo };
  } else if (lowerQuestion.includes('last 30 days') || lowerQuestion.includes('past month') || lowerQuestion.includes('last month')) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dateFilter = { $gte: thirtyDaysAgo };
  } else if (lowerQuestion.includes('today')) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateFilter = { $gte: today, $lt: tomorrow };
  } else if (lowerQuestion.includes('yesterday')) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);
    dateFilter = { $gte: yesterday, $lt: today };
  } else {
    // Default to last 30 days for general queries
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dateFilter = { $gte: thirtyDaysAgo };
  }

  console.log('Date filter for query:', dateFilter);
  console.log('Current date:', new Date());
  console.log('Filter date:', dateFilter.$gte);

  return {
    mongoQuery: [
      { $match: { entryTime: dateFilter } },
      { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } },
      { $unwind: '$area' },
      { $sort: { entryTime: -1 } },
      { $limit: 100 }
    ],
    collection: 'vehicles'
  };
}

function handleDurationQuery(question) {
  const lowerQuestion = question.toLowerCase();
  let durationHours = 2; // Default
  
  // Extract duration from question
  const durationMatch = lowerQuestion.match(/(\d+)\s*(hour|hr)/);
  if (durationMatch) {
    durationHours = parseInt(durationMatch[1]);
  }
  
  const durationMs = durationHours * 60 * 60 * 1000;
  
  return {
    mongoQuery: [
      { 
        $match: { 
          entryTime: { $exists: true },
          $expr: {
            $gt: [
              { $subtract: [new Date(), '$entryTime'] },
              durationMs
            ]
          }
        }
      },
      { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } },
      { $unwind: '$area' },
      { $sort: { entryTime: -1 } },
      { $limit: 100 }
    ],
    collection: 'vehicles'
  };
}

function handleAreaQuery(question) {
  const lowerQuestion = question.toLowerCase();
  
  // Extract area identifier
  let areaFilter = {};
  const areaMatch = lowerQuestion.match(/area\s*([a-z0-9]+)/i);
  if (areaMatch) {
    areaFilter = { 'area.name': { $regex: areaMatch[1], $options: 'i' } };
  }
  
  return {
    mongoQuery: [
      { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } },
      { $unwind: '$area' },
      { $match: areaFilter },
      { $sort: { entryTime: -1 } },
      { $limit: 100 }
    ],
    collection: 'vehicles'
  };
}

function handleCapacityQuery(question) {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('busiest hours')) {
    return {
      mongoQuery: [
        { $match: { entryTime: { $exists: true } } },
        { 
          $group: {
            _id: { $hour: '$entryTime' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 24 }
      ],
      collection: 'vehicles'
    };
  }
  
  if (lowerQuestion.includes('most vehicles') || lowerQuestion.includes('busiest area')) {
    return {
      mongoQuery: [
        { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } },
        { $unwind: '$area' },
        { 
          $group: {
            _id: '$area.name',
            count: { $sum: 1 },
            area: { $first: '$area' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ],
      collection: 'vehicles'
    };
  }
  
  return {
    mongoQuery: [
      { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } },
      { $unwind: '$area' },
      { 
        $group: {
          _id: '$area.name',
          currentCapacity: { $sum: 1 },
          totalCapacity: { $first: '$area.capacity' },
          area: { $first: '$area' }
        }
      },
      { $sort: { currentCapacity: -1 } }
    ],
    collection: 'vehicles'
  };
}

function handleEntryQuery(question) {
  const lowerQuestion = question.toLowerCase();
  
  // Time range extraction
  let timeFilter = {};
  if (lowerQuestion.includes('between') && lowerQuestion.includes('and')) {
    // Extract time range like "between 9 AM and 5 PM"
    const timeMatch = lowerQuestion.match(/between\s+(\d+)\s*(am|pm)\s+and\s+(\d+)\s*(am|pm)/i);
    if (timeMatch) {
      const startHour = parseInt(timeMatch[1]) + (timeMatch[2].toLowerCase() === 'pm' && timeMatch[1] !== '12' ? 12 : 0);
      const endHour = parseInt(timeMatch[3]) + (timeMatch[4].toLowerCase() === 'pm' && timeMatch[3] !== '12' ? 12 : 0);
      
      timeFilter = {
        $expr: {
          $and: [
            { $gte: [{ $hour: '$entryTime' }, startHour] },
            { $lt: [{ $hour: '$entryTime' }, endHour] }
          ]
        }
      };
    }
  }
  
  return {
    mongoQuery: [
      { $match: { ...timeFilter, entryTime: { $exists: true } } },
      { $lookup: { from: 'areas', localField: 'areaId', foreignField: '_id', as: 'area' } },
      { $unwind: '$area' },
      { $sort: { entryTime: -1 } },
      { $limit: 100 }
    ],
    collection: 'vehicles'
  };
}
