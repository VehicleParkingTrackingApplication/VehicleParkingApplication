// src/components/ExistingReportsPage.tsx

import React, { useState, useEffect, lazy, Suspense, useRef, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Send, Trash2, BarChart2 } from 'lucide-react';
// import { getAllReports, getReportById, deleteReport, queryReportAI } from '../services/reports';
import { getAllReports, getReportById, deleteReport, queryReportAI } from '../services/reportsApi';
import { getQuestionSuggestions, getFollowUpQuestions } from '../services/qaService';
import type { QAItem } from '../services/qaService';
import QuestionSuggestions from './QuestionSuggestions';
import FollowUpQuestions from './FollowUpQuestions';
import CommentSection from './CommentSection';
import ShareReport from './ShareReport'; 

const ClientOnlyReportChart = lazy(() => import('./ClientReportChart'));

// Interfaces remain the same
interface ReportSummary {
  _id: string;
  name: string;
  createdAt: string;
  type: string;
}

interface ReportDetail extends ReportSummary {
  description: string;
  chartData: any[];
  filters: { /* ... */ };
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

export default function ExistingReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [currentReport, setCurrentReport] = useState<ReportDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [error, setError] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [questionSuggestions, setQuestionSuggestions] = useState<QAItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<QAItem[]>([]);
  const [showFollowUps, setShowFollowUps] = useState(false);
  
  // NEW: Refs and state for the sliding dot carousel
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Auto-scroll ref for chat messages
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = useCallback(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, []);

  // NEW: Logic for the sliding dot carousel
  // Debounce function to prevent performance issues on scroll
  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.offsetWidth;
      // Find which child element is closest to the center of the container
      let closestIndex = 0;
      let smallestDistance = Infinity;

      Array.from(container.children).forEach((child, index) => {
        const childEl = child as HTMLElement;
        // Position of the center of the child element relative to the container
        const childCenter = childEl.offsetLeft + childEl.offsetWidth / 2;
        // Position of the center of the visible part of the container
        const viewportCenter = scrollLeft + containerWidth / 2;
        const distance = Math.abs(childCenter - viewportCenter);
        
        if (distance < smallestDistance) {
          smallestDistance = distance;
          closestIndex = index;
        }
      });
      
      if (activeIndex !== closestIndex) {
          setActiveIndex(closestIndex);
      }
    }
  }, [activeIndex]);

  const debouncedHandleScroll = useMemo(() => debounce(handleScroll, 100), [handleScroll]);

  const handleDotClick = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const childElement = container.children[index] as HTMLElement | undefined;
    if (!childElement) return;
    const containerWidth = container.offsetWidth;
    const childWidth = childElement.offsetWidth;
    // Calculate the scroll position to center the child element
    const scrollLeft = childElement.offsetLeft - (containerWidth / 2) + (childWidth / 2);

    container.scrollTo({
      left: scrollLeft,
      behavior: 'smooth'
    });
  };


  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingList(true);
        setError('');
        const fetchedReports = await getAllReports();
        setReports(fetchedReports.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reports list.');
      } finally {
        setLoadingList(false);
      }
    };
    fetchReports();
  }, []);

  useEffect(() => {
    if (!selectedReportId) {
      setCurrentReport(null);
      setMessages([]);
      return;
    }
    const fetchReportDetails = async () => {
      try {
        setLoadingDetails(true);
        setError('');
        const reportDetails = await getReportById(selectedReportId);
        setCurrentReport(reportDetails.data);
        setMessages([
          { text: `Hello! I'm ready to discuss "${reportDetails.data.name}". Ask me anything about the data.`, sender: 'bot' }
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report details.');
        setCurrentReport(null);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchReportDetails();
  }, [selectedReportId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-scroll when follow-up questions appear/disappear
  useEffect(() => {
    if (showFollowUps) {
      // Small delay to allow DOM to update
      setTimeout(scrollToBottom, 100);
    }
  }, [showFollowUps, scrollToBottom]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);
    
    // Hide follow-up questions when user starts typing
    setShowFollowUps(false);
    setFollowUpQuestions([]);
    
    // Show suggestions if user is typing
    if (value.trim().length >= 2) {
      try {
        const suggestions = await getQuestionSuggestions(value);
        setQuestionSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } catch (error) {
        console.error('Error getting question suggestions:', error);
        setShowSuggestions(false);
        setQuestionSuggestions([]);
      }
    } else {
      setShowSuggestions(false);
      setQuestionSuggestions([]);
    }
  };

  const handleQuestionSelect = (question: string) => {
    setUserInput(question);
    setShowSuggestions(false);
    setQuestionSuggestions([]);
  };

  const handleFollowUpSelect = (question: string) => {
    setUserInput(question);
    setShowFollowUps(false);
    setFollowUpQuestions([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !currentReport) return;
    const userQuery = userInput;
    const newUserMessage: Message = { text: userQuery, sender: 'user' };
    setMessages(prev => [...prev, newUserMessage, { text: 'Thinking...', sender: 'bot' }]);
    setUserInput('');
    setShowSuggestions(false);
    setQuestionSuggestions([]);
    
    try {
      const reportContext = JSON.stringify({
        name: currentReport.name,
        description: currentReport.description,
        type: currentReport.type,
        createdAt: currentReport.createdAt,
        filters: currentReport.filters,
        chartData: currentReport.chartData,
        chartDataSummary: `The chart contains ${currentReport.chartData.length} data points with detailed values.`,
      });
      const result = await queryReportAI(userQuery, reportContext);
      const botResponse = result.response || result.error || "Sorry, an error occurred.";
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = botResponse;
        return newMessages;
      });

      // Generate follow-up questions after successful response
      try {
        const followUps = await getFollowUpQuestions(userQuery);
        setFollowUpQuestions(followUps);
        setShowFollowUps(followUps.length > 0);
      } catch (followUpError) {
        console.error('Error generating follow-up questions:', followUpError);
        setShowFollowUps(false);
        setFollowUpQuestions([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = `Error: ${errorMessage}`;
        return newMessages;
      });
      setShowFollowUps(false);
      setFollowUpQuestions([]);
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedReportId || !window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await deleteReport(selectedReportId);
      setReports(reports.filter(r => r._id !== selectedReportId));
      setSelectedReportId('');
      setCurrentReport(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report.');
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)' }}>
      {/* NEW: Embedded CSS for hiding the scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
      
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(50%, -50%)' }}></div>
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(-50%, 50%)' }}></div>
      
      <div className="relative z-10 px-8 py-4 min-h-screen flex flex-col items-center">
        <header className="text-center mb-8 mt-5">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg text-blue-600">ReportAI</h1>
        </header>

        {error && <div className="w-full max-w-7xl bg-red-900/50 border border-red-700/50 rounded-xl p-4 text-red-200 mb-8">{error}</div>}

        <div className="w-full max-w-7xl space-y-8">
          {/* UPDATED: Report selector card with sliding dots */}
          <Card className="bg-white rounded-2xl border border-gray-200 shadow-lg">
            <CardContent className="p-4 py-2">
              {loadingList ? <p className="text-black">Loading reports...</p> : (
                <>
                  <div
                    ref={scrollContainerRef}
                    onScroll={debouncedHandleScroll}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                  >
                    {reports.length > 0 ? reports.map(report => (
                      <button
                        key={report._id}
                        onClick={() => setSelectedReportId(report._id)}
                        className={`
                          p-4 rounded-lg text-left transition-all duration-200 border-2 flex-shrink-0 snap-center
                          w-5/6 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/4)]
                          ${selectedReportId === report._id ? 'bg-blue-100 border-blue-400 shadow-lg text-gray-900' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'}
                        `}
                      >
                        <div className="font-semibold">{report.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{report.type} &middot; {new Date(report.createdAt).toLocaleDateString()}</div>
                        <div className="flex items-center gap-2 mt-2">
                          {report.isOwner ? (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Your Report</span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              Shared by {report.ownerId?.firstName} {report.ownerId?.lastName}
                            </span>
                          )}
                        </div>
                      </button>
                    )) : <p className="text-gray-500">No reports found.</p>}
                  </div>

                  {/* NEW: Sliding Dot Pagination */}
                  {reports.length > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-4">
                      {reports.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => handleDotClick(index)}
                          aria-label={`Go to report ${index + 1}`}
                          className={`h-2 rounded-full transition-all duration-300 ease-in-out ${
                            activeIndex === index ? 'w-5 bg-blue-500' : 'w-2 bg-gray-300 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Details section remains the same with the balanced height fix */}
          <div className={`transition-opacity duration-500 ease-in-out ${currentReport || loadingDetails ? 'opacity-100' : 'opacity-0'}`}>
            {loadingDetails && <div className="text-center py-12 text-lg text-black">Loading Analysis Workspace...</div>}

            {currentReport && !loadingDetails && (
              <Card className="bg-white rounded-2xl border border-gray-200 shadow-lg">
                <CardHeader className="flex flex-row justify-between items-start border-b border-gray-200 pb-4">
                  <div>
                    <CardTitle className="text-3xl font-bold text-gray-900">{currentReport.name}</CardTitle>
                    <CardDescription className="text-gray-600 mt-1">{currentReport.description}</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDeleteReport}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-3 flex flex-col h-[452px]">
                    <h3 className="text-xl font-medium text-gray-900 mb-3 flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-blue-600"/> Data Visualization</h3>
                    <div className="flex-grow bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
                      <Suspense fallback={<div className="flex items-center justify-center h-full text-black">Loading Chart...</div>}>
                        <ClientOnlyReportChart report={currentReport} />
                      </Suspense>
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex flex-col h-[452px]">
                    <h3 className="text-xl font-medium text-gray-900 mb-3">Chat with ReportAI</h3>
                    <div ref={chatMessagesRef} className="flex-grow overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200 shadow-inner mb-4 space-y-3">
                      {messages.map((msg, index) => (
                        <div key={index}>
                          <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-full px-4 py-2 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'}`}>
                              {msg.text}
                            </div>
                          </div>
                          {/* Show follow-up questions after the last bot message */}
                          {msg.sender === 'bot' && index === messages.length - 1 && (
                            <div className="mt-2">
                              <FollowUpQuestions
                                followUpQuestions={followUpQuestions}
                                onQuestionSelect={handleFollowUpSelect}
                                visible={showFollowUps}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          type="text" placeholder="Ask about this chart..." value={userInput}
                          onChange={handleInputChange}
                          className="flex-grow bg-white border-gray-300 text-gray-900 placeholder:text-gray-500 focus:ring-2 focus:ring-blue-400 rounded-lg"
                          disabled={!currentReport}
                        />
                        <Button type="submit" disabled={!currentReport || !userInput.trim()} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white border-0"><Send className="h-4 w-4" /></Button>
                      </div>
                      <QuestionSuggestions
                        suggestions={questionSuggestions}
                        onQuestionSelect={handleQuestionSelect}
                        visible={showSuggestions}
                      />
                    </form>
                  </div>
                </CardContent>
                
                {/* Share and Comments Section */}
                <div className="p-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
                    {/* Share Section */}
                    <ShareReport 
                      reportId={currentReport._id} 
                      isOwner={currentReport.isOwner !== false} 
                    />
                    
                    {/* Comments Section */}
                    <CommentSection 
                      reportId={currentReport._id} 
                      isOwner={currentReport.isOwner !== false} 
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}