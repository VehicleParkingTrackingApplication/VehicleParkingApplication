// API service for comments functionality

export interface Comment {
  _id: string;
  reportId: string;
  authorId: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  reportId: string;
  content: string;
}

export interface UpdateCommentRequest {
  content: string;
}

// Get all comments for a report
export const getComments = async (reportId: string): Promise<{ success: boolean; data: Comment[]; message: string }> => {
  try {
    const response = await fetch(`http://localhost:1313/api/comments/${reportId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Failed to fetch comments' }));
      throw new Error(errorBody.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching comments.';
    console.error("Error fetching comments:", errorMessage);
    return { success: false, data: [], message: errorMessage };
  }
};

// Create a new comment
export const createComment = async (commentData: CreateCommentRequest): Promise<{ success: boolean; data: Comment; message: string }> => {
  try {
    const response = await fetch('http://localhost:1313/api/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(commentData)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Failed to create comment' }));
      throw new Error(errorBody.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while creating comment.';
    console.error("Error creating comment:", errorMessage);
    return { success: false, data: {} as Comment, message: errorMessage };
  }
};

// Update a comment
export const updateComment = async (commentId: string, commentData: UpdateCommentRequest): Promise<{ success: boolean; data: Comment; message: string }> => {
  try {
    const response = await fetch(`http://localhost:1313/api/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(commentData)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Failed to update comment' }));
      throw new Error(errorBody.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while updating comment.';
    console.error("Error updating comment:", errorMessage);
    return { success: false, data: {} as Comment, message: errorMessage };
  }
};

// Delete a comment
export const deleteComment = async (commentId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`http://localhost:1313/api/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: 'Failed to delete comment' }));
      throw new Error(errorBody.message || `API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while deleting comment.';
    console.error("Error deleting comment:", errorMessage);
    return { success: false, message: errorMessage };
  }
};
