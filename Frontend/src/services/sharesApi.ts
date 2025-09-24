// API service for sharing functionality

export interface BusinessUser {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

export interface ReportShare {
  _id: string;
  reportId: string;
  sharedBy: string;
  sharedWith: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
  };
  businessId: string;
  permissions: string;
  createdAt: string;
}

export interface ShareReportRequest {
  reportId: string;
  userIds: string[];
}

// Get all users in the same business
export const getBusinessUsers = async (): Promise<{ success: boolean; data: BusinessUser[]; message: string }> => {
  try {
    const response = await fetch('http://localhost:1313/api/shares/business/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Failed to fetch business users' }));
      throw new Error(errorBody.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching business users.';
    console.error("Error fetching business users:", errorMessage);
    return { success: false, data: [], message: errorMessage };
  }
};

// Get all shares for a report
export const getReportShares = async (reportId: string): Promise<{ success: boolean; data: ReportShare[]; message: string }> => {
  try {
    const response = await fetch(`http://localhost:1313/api/shares/${reportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Failed to fetch report shares' }));
      throw new Error(errorBody.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching report shares.';
    console.error("Error fetching report shares:", errorMessage);
    return { success: false, data: [], message: errorMessage };
  }
};

// Share a report with users
export const shareReport = async (shareData: ShareReportRequest): Promise<{ success: boolean; data: ReportShare[]; message: string }> => {
  try {
    const response = await fetch('http://localhost:1313/api/shares', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(shareData)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Failed to share report' }));
      throw new Error(errorBody.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while sharing report.';
    console.error("Error sharing report:", errorMessage);
    return { success: false, data: [], message: errorMessage };
  }
};

// Remove a share
export const removeShare = async (shareId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`http://localhost:1313/api/shares/${shareId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Failed to remove share' }));
      throw new Error(errorBody.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while removing share.';
    console.error("Error removing share:", errorMessage);
    return { success: false, message: errorMessage };
  }
};
