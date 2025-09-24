import React from 'react';
import { MessageSquare, ChevronRight } from 'lucide-react';
import type { QAItem } from '../services/qaService';

interface FollowUpQuestionsProps {
  followUpQuestions: QAItem[];
  onQuestionSelect: (question: string) => void;
  visible: boolean;
}

const FollowUpQuestions: React.FC<FollowUpQuestionsProps> = ({
  followUpQuestions,
  onQuestionSelect,
  visible
}) => {
  const handleQuestionClick = (e: React.MouseEvent, question: string) => {
    e.preventDefault();
    e.stopPropagation();
    onQuestionSelect(question);
  };

  if (!visible || followUpQuestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center text-blue-700 text-sm font-medium mb-2">
        <MessageSquare className="h-4 w-4 mr-1" />
        Follow-up Questions
      </div>
      
      <div className="max-h-[120px] overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
        {followUpQuestions.map((item, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => handleQuestionClick(e, item.question)}
            className="w-full text-left p-2 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xs text-blue-600 font-medium mb-1">
                  {item.keyword}
                </div>
                <div className="text-sm text-gray-700 leading-relaxed">
                  {item.question}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-blue-400 group-hover:text-blue-600 transition-colors duration-200 ml-2 flex-shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FollowUpQuestions;
