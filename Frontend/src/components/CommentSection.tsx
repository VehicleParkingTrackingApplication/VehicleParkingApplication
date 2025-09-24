import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, ArrowRight, Edit2, Trash2 } from 'lucide-react';
import { getComments, createComment, updateComment, deleteComment } from '../services/commentsApi';
import type { Comment } from '../services/commentsApi';
import { getCurrentUser } from '../services/backend';

interface CommentSectionProps {
  reportId: string;
  isOwner: boolean;
}

export default function CommentSection({ reportId, isOwner }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Load comments and current user when component mounts or reportId changes
  useEffect(() => {
    loadComments();
    loadCurrentUser();
  }, [reportId]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (err) {
      console.error('Failed to load current user:', err);
    }
  };

  const loadComments = async () => {
    try {
      setIsLoading(true);
      const response = await getComments(reportId);
      if (response.success) {
        setComments(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await createComment({
        reportId,
        content: newComment.trim()
      });

      if (response.success) {
        setComments(prev => [...prev, response.data]);
        setNewComment('');
        setError(null);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to create comment');
    }
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await updateComment(commentId, {
        content: editContent.trim()
      });

      if (response.success) {
        setComments(prev => 
          prev.map(comment => 
            comment._id === commentId 
              ? { ...comment, content: response.data.content, updatedAt: response.data.updatedAt }
              : comment
          )
        );
        setEditingComment(null);
        setEditContent('');
        setError(null);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await deleteComment(commentId);
      if (response.success) {
        setComments(prev => prev.filter(comment => comment._id !== commentId));
        setError(null);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Add new comment form */}
        <h4 className="font-medium text-sm text-gray-900">Comments in your shared report</h4>
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 text-gray-900"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!newComment.trim() || isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        {/* Error message */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
          {isLoading && comments.length === 0 ? (
            <div className="text-center text-gray-500 py-4">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No comments yet. Be the first to comment!</div>
          ) : (
            comments.map((comment) => (
              <div key={comment._id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-gray-200 text-gray-700 font-medium">
                    {getInitials(comment.authorId.firstName, comment.authorId.lastName)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      {comment.authorId.firstName} {comment.authorId.lastName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(comment.createdAt)}
                    </span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-xs text-gray-400">(edited)</span>
                    )}
                  </div>
                  
                  {editingComment === comment._id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="flex-1 text-gray-900"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleUpdateComment(comment._id)}
                        disabled={!editContent.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent('');
                        }}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-900 break-words">{comment.content}</p>
                      
                      {/* Action buttons - only show for comment author or report owner */}
                      {(comment.authorId._id === currentUser?._id || isOwner) && (
                        <div className="flex gap-1 ml-2">
                          {comment.authorId._id === currentUser?._id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditComment(comment)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                          {(comment.authorId._id === currentUser?._id || isOwner) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteComment(comment._id)}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
