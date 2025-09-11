// src/components/ExistingReportsPage.tsx

import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Trash2 } from 'lucide-react';
// 1. Import the queryReportAI function
import { getAllReports, getReportById, deleteReport, queryReportAI } from '../services/reportsApi'; 

const ClientOnlyReportChart = lazy(() => import('./ClientReportChart'));

interface ReportSummary {
  _id: string;
  name: string;
  createdAt: string;
  type: string;
}

interface ReportDetail extends ReportSummary {
  description: string;
  chartData: any[];
  filters: {
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
    overstayLimit?: number;
    entriesPeriod?: 'daily' | 'weekly' | 'monthly';
  };
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
          { text: `Hello! I'm ready to discuss the report: "${reportDetails.data.name}". Ask me anything about it.`, sender: 'bot' }
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

  // 2. Make the function async and replace the logic
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !currentReport) return;

    const userQuery = userInput;
    const newUserMessage: Message = { text: userQuery, sender: 'user' };

    // Add user message and a temporary bot "thinking" message for better UX
    setMessages(prev => [
      ...prev,
      newUserMessage,
      { text: 'Thinking...', sender: 'bot' }
    ]);
    setUserInput(''); // Clear input right away

    try {
      // Create a context string with relevant report data for the AI
      const reportContext = JSON.stringify({
        name: currentReport.name,
        description: currentReport.description,
        type: currentReport.type,
        createdAt: currentReport.createdAt,
        filters: currentReport.filters,
        // Summarize chart data to avoid sending a huge, unnecessary payload
        chartDataSummary: `The chart contains ${currentReport.chartData.length} data points.`,
      });
      
      // Call the API
      const result = await queryReportAI(userQuery, reportContext);
      const botResponse = result.response || result.error || "Sorry, an error occurred and I couldn't get a response.";

      // Update the "Thinking..." message with the actual response from the API
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = botResponse;
        return newMessages;
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      // In case of an error, update the "Thinking..." message to show it
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].text = `Error: ${errorMessage}`;
        return newMessages;
      });
    }
  };

  const handleDeleteReport = async () => {
      if (!selectedReportId || !window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) {
          return;
      }
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
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(50%, -50%)' }}></div>
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(-50%, 50%)' }}></div>
      <div className="relative z-10 px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Saved Reports</h1>
            <p className="text-sm text-muted mt-2">Load and analyze previously generated reports</p>
          </header>

          {error && <div className="bg-red-900 border border-red-700 rounded-xl p-4 text-red-200">{error}</div>}

          <Card className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
            <CardHeader><CardTitle>Select a Report</CardTitle></CardHeader>
            <CardContent>
              {loadingList ? <p>Loading reports...</p> : (
                <select 
                  value={selectedReportId} 
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  className="w-full bg-neutral-700 border-neutral-600 p-2.5 rounded-md text-white"
                  disabled={reports.length === 0}
                >
                  <option value="">{reports.length > 0 ? 'Choose a report...' : 'No reports found'}</option>
                  {reports.map((report) => (
                    <option key={report._id} value={report._id}>
                      {report.name} ({new Date(report.createdAt).toLocaleDateString()}) - {report.type}
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>

          {loadingDetails && <div className="text-center py-10">Loading report details...</div>}

          {currentReport && !loadingDetails && (
            <>
              <Card className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
                <CardHeader className="flex flex-row justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-blue-400">{currentReport.name}</CardTitle>
                    <CardDescription>{currentReport.description}</CardDescription>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDeleteReport}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Report
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading Chart...</div>}>
                      <ClientOnlyReportChart report={currentReport} />
                    </Suspense>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-neutral-800 rounded-xl border border-neutral-700 shadow-md">
                <CardHeader>
                  <CardTitle>Chat with ReportAI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 overflow-y-auto p-4 bg-neutral-900 rounded-md mb-4 space-y-4">
                    {messages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl ${
                          msg.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-neutral-700 text-gray-200 rounded-bl-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="e.g., Explain this chart..."
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      className="flex-grow bg-neutral-700 border-neutral-600 text-white"
                      disabled={!currentReport}
                    />
                    <Button type="submit" disabled={!currentReport || !userInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

        </div>
      </div>
    </div>
  );
}