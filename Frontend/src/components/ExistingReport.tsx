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
  
  // NEW: Refs and state for the sliding dot carousel
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // NEW: Logic for the sliding dot carousel
  // Debounce function to prevent performance issues on scroll
  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
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
    const childElement = container?.children[index] as HTMLElement;
    if (childElement) {
      const containerWidth = container.offsetWidth;
      const childWidth = childElement.offsetWidth;
      // Calculate the scroll position to center the child element
      const scrollLeft = childElement.offsetLeft - (containerWidth / 2) + (childWidth / 2);

      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      });
    }
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !currentReport) return;
    const userQuery = userInput;
    const newUserMessage: Message = { text: userQuery, sender: 'user' };
    setMessages(prev => [...prev, newUserMessage, { text: 'Thinking...', sender: 'bot' }]);
    setUserInput('');
    try {
      const reportContext = JSON.stringify({
        name: currentReport.name,
        description: currentReport.description,
        type: currentReport.type,
        createdAt: currentReport.createdAt,
        filters: currentReport.filters,
        chartDataSummary: `The chart contains ${currentReport.chartData.length} data points.`,
      });
      const result = await queryReportAI(userQuery, reportContext);
      const botResponse = result.response || result.error || "Sorry, an error occurred.";
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = botResponse;
        return newMessages;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = `Error: ${errorMessage}`;
        return newMessages;
      });
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
    <div className="relative min-h-screen text-white overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #677ae5, #6f60c0)' }}>
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
      
      <div className="relative z-10 px-4 py-10 min-h-screen flex flex-col items-center">
        <header className="text-center mb-10">
          <h1 className="text-5xl font-extrabold tracking-tight drop-shadow-lg">ReportAI</h1>
          <p className="text-lg text-white/80 mt-3 drop-shadow">Select the Report and power your team with AI Assistant</p>
        </header>

        {error && <div className="w-full max-w-5xl bg-red-900/50 border border-red-700/50 rounded-xl p-4 text-red-200 mb-8">{error}</div>}

        <div className="w-full max-w-5xl space-y-8">
          {/* UPDATED: Report selector card with sliding dots */}
          <Card className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
            <CardContent className="p-4 py-2">
              {loadingList ? <p className="text-white/60">Loading reports...</p> : (
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
                          w-5/6 sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]
                          ${selectedReportId === report._id ? 'bg-blue-500/40 border-blue-400 shadow-lg' : 'bg-black/20 hover:bg-black/40 border-transparent'}
                        `}
                      >
                        <div className="font-semibold text-white">{report.name}</div>
                        <div className="text-xs text-white/60 mt-1">{report.type} &middot; {new Date(report.createdAt).toLocaleDateString()}</div>
                      </button>
                    )) : <p className="text-white/60">No reports found.</p>}
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
                            activeIndex === index ? 'w-5 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
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
            {loadingDetails && <div className="text-center py-12 text-lg">Loading Analysis Workspace...</div>}

            {currentReport && !loadingDetails && (
              <Card className="bg-black/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
                <CardHeader className="flex flex-row justify-between items-start border-b border-white/10 pb-4">
                  <div>
                    <CardTitle className="text-3xl font-bold text-blue-300">{currentReport.name}</CardTitle>
                    <CardDescription className="text-white/70 mt-1">{currentReport.description}</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDeleteReport}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-8">
                  <div className="lg:col-span-3 flex flex-col h-[452px]">
                    <h3 className="text-xl font-medium text-white mb-3 flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-blue-300"/> Data Visualization</h3>
                    <div className="flex-grow bg-black/30 rounded-xl p-4 border border-white/10 shadow-inner">
                      <Suspense fallback={<div className="flex items-center justify-center h-full text-white/70">Loading Chart...</div>}>
                        <ClientOnlyReportChart report={currentReport} />
                      </Suspense>
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex flex-col h-[452px]">
                    <h3 className="text-xl font-medium text-white mb-3">Chat with ReportAI</h3>
                    <div className="flex-grow overflow-y-auto p-3 bg-black/25 rounded-xl border border-white/10 shadow-inner mb-4 space-y-3">
                      {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-full px-4 py-2 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-neutral-800/80 text-gray-200 rounded-bl-none'}`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        type="text" placeholder="Ask about this chart..." value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="flex-grow bg-black/30 border-white/20 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400 rounded-lg"
                        disabled={!currentReport}
                      />
                      <Button type="submit" disabled={!currentReport || !userInput.trim()} className="rounded-lg"><Send className="h-4 w-4" /></Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}