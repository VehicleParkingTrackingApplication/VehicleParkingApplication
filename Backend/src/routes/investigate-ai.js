import express from 'express';
import requireAuth from '../middleware/auth/require-auth.js';
import requireRole from '../middleware/auth/require-role.js';
import { investigateAIController } from '../app/controllers/investigate-ai.js';

const router = express.Router();

// POST /api/investigate-ai/generate - Generate MongoDB query without executing
router.post('/generate', investigateAIController.processQuery);

// POST /api/investigate-ai/query - Process natural language query and execute
router.post('/query', investigateAIController.processQuery);

export default router;
