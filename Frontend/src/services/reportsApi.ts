import { 
  fetchAuthApi, 
  postAuthApi,
  deleteAuthApi // Assuming a delete helper exists in your api.ts file
} from '@/services/api';

/**
 * Interface for the payload when creating/saving a new report.
 * This should match the structure expected by your backend.
 */
export interface ReportPayload {
  name: string;
  areaId: string;
  type: string;
  chartData: any[];
  chartImage?: string;
  filters: object;
  description: string;
}

/**
 * Fetches a list of all saved reports.
 * GET /api/reports
 */
export const getAllReports = async () => {
  const res = await fetchAuthApi('reports');
  if (!res.ok) throw new Error('Failed to fetch reports');
  return res.json();
};

/**
 * Fetches a single report by its ID.
 * GET /api/reports/:id
 * @param reportId The ID of the report.
 */
export const getReportById = async (reportId: string) => {
  const res = await fetchAuthApi(`reports/${reportId}`);
  if (!res.ok) throw new Error('Failed to fetch report details');
  return res.json();
};

/**
 * Saves a new report.
 * POST /api/reports
 * @param payload The report data to save.
 */
export const saveReport = async (payload: ReportPayload) => {
  const res = await postAuthApi('reports', undefined, JSON.stringify(payload));
  if (!res.ok) throw new Error('Failed to save report');
  return res.json();
};

/**
 * Deletes a report by its ID.
 * DELETE /api/reports/:id
 * @param reportId The ID of the report to delete.
 */
export const deleteReport = async (reportId: string) => {
  // This assumes a 'deleteAuthApi' helper exists in your api service file.
  // If not, you can replace it with the appropriate fetch call.
  const res = await deleteAuthApi(`reports/${reportId}`);
  if (!res.ok) throw new Error('Failed to delete report');
  return res.json();
};

/**
 * Ask AI to analyze a specific report with a question.
 * POST /api/reports/:id/analyze
 */
export const analyzeReport = async (reportId: string, question: string) => {
  const res = await postAuthApi(`reports/${reportId}/analyze`, undefined, JSON.stringify({ question }));
  if (!res.ok) throw new Error('Failed to analyze report');
  return res.json();
};

export const queryReportAI = async (query: string, context: string): Promise<{ response?: string; error?: string }> => {
  try {
    const response = await fetch(`http://localhost:5001/api/rag_query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, context }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'API request failed' }));
      throw new Error(errorBody.error || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during the AI query.';
    console.error("Error querying ReportAI:", errorMessage);
    return { error: errorMessage };
  }
};



