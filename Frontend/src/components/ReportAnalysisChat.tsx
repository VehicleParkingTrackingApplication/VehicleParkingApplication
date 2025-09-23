import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { analyzeReport } from '../services/reportsApi'; // Corrected import path
import { Send } from 'lucide-react';

// Defines the structure for a single chat message
interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// Defines the props expected by this component
interface ReportAnalysisChatProps {
  reportId: string | null; // The ID of the currently selected report
}

export default function ReportAnalysisChat({ reportId }: ReportAnalysisChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref to scroll to the bottom of messages

  // Effect to reset the chat when a new report is selected
  useEffect(() => {
    if (reportId) {
        setMessages([{ sender: 'ai', text: 'Hello! Ask me anything about the selected chart.' }]);
    } else {
        setMessages([]);
    }
  }, [reportId]);

  // Function to automatically scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever the messages array is updated
  useEffect(scrollToBottom, [messages]);

  /**
   * Handles the form submission when a user sends a message.
   */
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !reportId) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the API service to get the AI's analysis
      const response = await analyzeReport(reportId, input);
      const aiMessage: Message = { sender: 'ai', text: response.analysis };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = { sender: 'ai', text: 'Sorry, I encountered an error. Please check the server and try again.' };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Analysis error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render a placeholder if no report is selected
  if (!reportId) {
    return (
      <div className="flex items-center justify-center h-full bg-neutral-800/50 rounded-lg p-4">
        <p className="text-neutral-400">Select a report to begin analysis.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900 border border-neutral-700 rounded-xl">
      <div className="p-4 border-b border-neutral-700">
        <h3 className="font-semibold text-lg">Chart Analysis Assistant</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-neutral-700'}`}>
              <p className="text-white whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-700 p-3 rounded-lg">
              <p className="text-white animate-pulse">Analyzing...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-neutral-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this chart..."
            className="flex-1 bg-neutral-800 border-neutral-600"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

