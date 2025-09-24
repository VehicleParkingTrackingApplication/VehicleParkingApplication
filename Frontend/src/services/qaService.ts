// QA Service for handling question suggestions
import { fetchAuthApi } from './api';

export interface QAItem {
  keyword: string;
  question: string;
}

// Cache for QA data
let qaDataCache: QAItem[] | null = null;

// Keywords for matching
const keywords = [
  "occupancy", "revenue", "turnover", "duration", "peak", "hours", "violations", 
  "enforcement", "utilization", "technology", "systems", "payment", "parking",
  "vehicles", "spaces", "zones", "levels", "time", "rate", "average", "total",
  "daily", "weekly", "monthly", "trend", "correlation", "comparison", "percentage"
];

// Fetch QA data from backend
async function fetchQAData(): Promise<QAItem[]> {
  if (qaDataCache) {
    return qaDataCache;
  }

  try {
    const response = await fetchAuthApi('qa');
    if (!response.ok) {
      throw new Error('Failed to fetch QA data');
    }
    
    const result = await response.json();
    if (result.success && result.data) {
      qaDataCache = result.data;
      return qaDataCache;
    } else {
      throw new Error('Invalid QA data format');
    }
  } catch (error) {
    console.error('Error fetching QA data:', error);
    // Return empty array as fallback
    return [];
  }
}

export async function getQuestionSuggestions(input: string): Promise<QAItem[]> {
  if (!input || input.trim().length < 2) {
    return [];
  }

  const qaData = await fetchQAData();
  if (qaData.length === 0) {
    return [];
  }

  const normalizedInput = input.toLowerCase().trim();
  
  // Find questions that match the input
  const suggestions = qaData.filter(item => {
    const normalizedKeyword = item.keyword.toLowerCase();
    const normalizedQuestion = item.question.toLowerCase();
    
    // Check if input matches keyword or appears in question
    return normalizedKeyword.includes(normalizedInput) || 
           normalizedQuestion.includes(normalizedInput) ||
           keywords.some(keyword => 
             keyword.includes(normalizedInput) && 
             (normalizedKeyword.includes(keyword) || normalizedQuestion.includes(keyword))
           );
  });

  // Return up to 6 suggestions
  return suggestions.slice(0, 6);
}

export async function getAllKeywords(): Promise<string[]> {
  const qaData = await fetchQAData();
  return [...new Set(qaData.map(item => item.keyword))];
}

export async function getQuestionsByKeyword(keyword: string): Promise<QAItem[]> {
  const qaData = await fetchQAData();
  return qaData.filter(item => 
    item.keyword.toLowerCase() === keyword.toLowerCase()
  );
}

// Generate follow-up questions based on the current question
export async function getFollowUpQuestions(currentQuestion: string): Promise<QAItem[]> {
  const qaData = await fetchQAData();
  if (qaData.length === 0) {
    return [];
  }

  const normalizedQuestion = currentQuestion.toLowerCase();
  
  // Find questions that are related to the current question
  const followUps = qaData.filter(item => {
    const normalizedKeyword = item.keyword.toLowerCase();
    const normalizedItemQuestion = item.question.toLowerCase();
    
    // Skip the exact same question
    if (normalizedItemQuestion === normalizedQuestion) {
      return false;
    }
    
    // Check if they share the same keyword category
    const currentKeyword = qaData.find(q => 
      q.question.toLowerCase() === normalizedQuestion
    )?.keyword.toLowerCase();
    
    if (currentKeyword && normalizedKeyword === currentKeyword) {
      return true;
    }
    
    // Check for related keywords
    const relatedKeywords = {
      'occupancy': ['revenue', 'peak hours', 'utilization'],
      'revenue': ['occupancy', 'turnover rate', 'peak hours'],
      'turnover rate': ['revenue', 'parking duration', 'occupancy'],
      'parking duration': ['turnover rate', 'overstay', 'violations'],
      'peak hours': ['occupancy', 'revenue', 'utilization'],
      'violations': ['enforcement', 'parking duration', 'revenue'],
      'utilization': ['occupancy', 'peak hours', 'spaces'],
      'technology': ['systems', 'payment', 'accuracy']
    };
    
    if (currentKeyword && relatedKeywords[currentKeyword as keyof typeof relatedKeywords]) {
      return relatedKeywords[currentKeyword as keyof typeof relatedKeywords].includes(normalizedKeyword);
    }
    
    return false;
  });

  // Return up to 3 follow-up questions
  return followUps.slice(0, 3);
}