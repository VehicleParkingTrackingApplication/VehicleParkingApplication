import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import type { QAItem } from '../services/qaService';

interface QuestionSuggestionsProps {
  suggestions: QAItem[];
  onQuestionSelect: (question: string) => void;
  visible: boolean;
}

const QuestionSuggestions: React.FC<QuestionSuggestionsProps> = ({
  suggestions,
  onQuestionSelect,
  visible
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const itemsPerView = 2; // Show 2 questions at a time
  const maxIndex = Math.max(0, suggestions.length - itemsPerView);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const itemWidth = container.scrollWidth / suggestions.length;
    container.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth'
    });
  }, [suggestions.length]);

  const handlePrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newIndex = Math.max(0, currentIndex - 1);
    setCurrentIndex(newIndex);
    scrollToIndex(newIndex);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newIndex = Math.min(maxIndex, currentIndex + 1);
    setCurrentIndex(newIndex);
    scrollToIndex(newIndex);
  };

  const handleQuestionClick = (e: React.MouseEvent, question: string) => {
    e.preventDefault();
    e.stopPropagation();
    onQuestionSelect(question);
  };

  if (!visible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center text-blue-700 text-sm font-medium">
          <MessageSquare className="h-4 w-4 mr-1" />
          Suggested Questions
        </div>
        {suggestions.length > itemsPerView && (
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="p-1 rounded-full hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 text-blue-600" />
            </button>
            <span className="text-xs text-blue-600">
              {currentIndex + 1}-{Math.min(currentIndex + itemsPerView, suggestions.length)} of {suggestions.length}
            </span>
            <button
              type="button"
              onClick={handleNext}
              disabled={currentIndex >= maxIndex}
              className="p-1 rounded-full hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4 text-blue-600" />
            </button>
          </div>
        )}
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex gap-2 overflow-hidden"
        style={{ scrollBehavior: 'smooth' }}
      >
        {suggestions.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full"
            style={{ width: `${100 / itemsPerView}%` }}
          >
            <button
              type="button"
              onClick={(e) => handleQuestionClick(e, item.question)}
              className="w-full text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors duration-200"
            >
              <div className="text-xs text-blue-600 font-medium mb-1">
                {item.keyword}
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {item.question}
              </div>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionSuggestions;
