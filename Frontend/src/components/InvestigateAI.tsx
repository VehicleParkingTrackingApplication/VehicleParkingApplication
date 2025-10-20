import React, { useState } from 'react';
import { Search, Database, Brain, Clock, Car, TrendingUp, Table, MessageSquare, Download, Code } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';

interface QueryResult {
  question: string;
  mongoQuery: string;
  result: any[];
  executionTime: number;
  timestamp: Date;
  aiGenerated?: boolean;
  aiResponse?: string;
  fallback?: boolean;
  queryExecuted?: boolean;
  collection?: string;
}

interface InvestigateAIProps {}

const InvestigateAI: React.FC<InvestigateAIProps> = () => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedQueries, setExpandedQueries] = useState<Set<number>>(new Set());
  const [viewModes, setViewModes] = useState<Map<number, 'conversation' | 'json' | 'table'>>(new Map());

  const exampleQuestions = [
    "What cars entered the car park in the last 7 days?",
    "Show me all vehicles that stayed longer than 2 hours today",
    "Which parking area has the most vehicles currently?",
    "What are the busiest hours for parking?",
    "Show me all records from area A1 in the last month",
    "How many vehicles entered between 9 AM and 5 PM yesterday?"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:1313/api/investigate-ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || 'test-token'}`,
        },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to process query`);
      }

      const data = await response.json();
      
      const newResult: QueryResult = {
        question: question.trim(),
        mongoQuery: data.mongoQuery,
        result: [], // Start with empty results
        executionTime: 0,
        timestamp: new Date(),
        aiGenerated: data.aiGenerated || false,
        aiResponse: data.aiResponse,
        fallback: data.fallback || false,
        queryExecuted: false // Query not executed yet
      };
      

      setResults(prev => [newResult, ...prev]);
      setQuestion('');
    } catch (err) {
      console.error('InvestigateAI Error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const formatResult = (result: any) => {
    if (Array.isArray(result)) {
      return result.length > 0 ? result : ['No results found'];
    }
    return [result];
  };

  const formatMongoQuery = (query: string) => {
    try {
      const parsed = JSON.parse(query);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return query;
    }
  };

  const toggleQueryExpansion = (index: number) => {
    const newExpanded = new Set(expandedQueries);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedQueries(newExpanded);
  };

  const executeQuery = async (index: number) => {
    const result = results[index];
    if (!result) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:1313/api/investigate-ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || 'test-token'}`,
        },
        body: JSON.stringify({ question: result.question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to execute query`);
      }

      const data = await response.json();
      
      // Update the result with new data
      const updatedResults = [...results];
      updatedResults[index] = {
        ...result,
        result: data.result || [],
        executionTime: data.executionTime || 0,
        queryExecuted: true
      };
      
      setResults(updatedResults);
    } catch (err) {
      console.error('Query execution error:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute query');
    } finally {
      setIsLoading(false);
    }
  };

  const cycleViewMode = (index: number) => {
    const currentMode = viewModes.get(index) || 'conversation';
    let newMode: 'conversation' | 'json' | 'table';
    
    switch (currentMode) {
      case 'conversation':
        newMode = 'json';
        break;
      case 'json':
        newMode = 'table';
        break;
      case 'table':
        newMode = 'conversation';
        break;
      default:
        newMode = 'conversation';
    }
    
    setViewModes(new Map(viewModes.set(index, newMode)));
  };

  const exportToCSV = (index: number) => {
    const result = results[index];
    if (!result || !result.result || result.result.length === 0) return;

    // Convert data to CSV format
    const headers = ['Plate Number', 'Country', 'Entry Time', 'Area Name', 'Area Location', 'Capacity'];
    const csvData = result.result.map((item: any) => [
      item.plateNumber || '',
      item.country || '',
      item.entryTime ? new Date(item.entryTime).toLocaleString() : '',
      item.area?.name || '',
      item.area?.location || '',
      item.area?.capacity || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `parking-data-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getViewMode = (index: number): 'conversation' | 'json' | 'table' => {
    return viewModes.get(index) || 'conversation';
  };

  const getViewModeIcon = (mode: 'conversation' | 'json' | 'table') => {
    switch (mode) {
      case 'conversation':
        return <MessageSquare className="w-3 h-3 mr-1" />;
      case 'json':
        return <Code className="w-3 h-3 mr-1" />;
      case 'table':
        return <Table className="w-3 h-3 mr-1" />;
      default:
        return <MessageSquare className="w-3 h-3 mr-1" />;
    }
  };

  const getViewModeLabel = (mode: 'conversation' | 'json' | 'table') => {
    switch (mode) {
      case 'conversation':
        return 'Conversation';
      case 'json':
        return 'JSON';
      case 'table':
        return 'Table';
      default:
        return 'Conversation';
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)'}}>
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(50%, -50%)' }}></div>
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(-50%, 50%)' }}></div>
      <div className="relative z-10 px-4 py-4">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 mt-5">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg text-blue-600">InvestigateAI</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Query Input Section */}
          <div className="lg:col-span-1">
            <Card className="h-fit bg-white border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <Search className="w-5 h-5" />
                  <span>Ask a Question</span>
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Ask questions about your parking data in natural language
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Textarea
                      placeholder="e.g., What cars entered the car park in the last 7 days?"
                      value={question}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setQuestion(e.target.value)}
                      className="min-h-[100px] resize-none border-gray-300 text-gray-500 placeholder-gray-400"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white" 
                    disabled={!question.trim() || isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Brain className="w-4 h-4" />
                        <span>Investigate</span>
                      </div>
                    )}
                  </Button>
                </form>

                {/* Example Questions */}
                <div className="mt-6">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3">Example Questions:</h4>
                  <div className="space-y-2">
                    {exampleQuestions.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setQuestion(example)}
                        className="w-full text-left p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                        disabled={isLoading}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>
                  <div>
                    <strong>Error:</strong> {error}
                  </div>
                  <div className="mt-2 text-sm">
                    <strong>Debug Info:</strong>
                    <br />• Check if backend server is running on port 3000
                    <br />• Check if MongoDB is connected
                    <br />• Check browser console for more details
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {results.length === 0 ? (
              <Card className="bg-white border-gray-200 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Database className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No queries yet</h3>
                  <p className="text-gray-500 text-center">
                    Start by asking a question about your parking data to see AI-powered insights
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <Card key={index} className="overflow-hidden bg-white border-gray-200 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center space-x-2 text-gray-900">
                            <Search className="w-5 h-5 text-blue-600" />
                            <span>{result.question}</span>
                          </CardTitle>
                          <CardDescription className="mt-2 text-gray-600">
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{result.executionTime}ms</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <Database className="w-4 h-4" />
                                <span>{result.result.length} results</span>
                              </span>
                              {result.aiGenerated && (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <Brain className="w-3 h-3 mr-1" />
                                  AI Generated
                                </Badge>
                              )}
                              {result.fallback && (
                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                  <Database className="w-3 h-3 mr-1" />
                                  Rule-based
                                </Badge>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                      {/* AI Response (if available) */}
                      {result.aiResponse && (
                        <div className="mb-6">
                          <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center space-x-2">
                            <Brain className="w-4 h-4" />
                            <span>AI Analysis</span>
                          </h4>
                          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-gray-700">
                            {result.aiResponse}
                          </div>
                        </div>
                      )}

                      {/* MongoDB Query - Collapsible */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm text-gray-700 flex items-center space-x-2">
                            <Database className="w-4 h-4" />
                            <span>Generated MongoDB Query</span>
                          </h4>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleQueryExpansion(index)}
                              className="text-xs bg-gray-500 hover:bg-gray-600 text-white border-gray-400"
                            >
                              {expandedQueries.has(index) ? 'Hide' : 'Show'} Query
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => executeQuery(index)}
                              disabled={isLoading}
                              className="text-xs bg-green-600 hover:bg-green-700"
                            >
                              {isLoading ? 'Running...' : 'Run Query'}
                            </Button>
                          </div>
                        </div>
                        
                        {expandedQueries.has(index) && (
                          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-64">
                            <pre>{formatMongoQuery(result.mongoQuery)}</pre>
                          </div>
                        )}
                      </div>

                      {/* Query Results - Only show if query was executed */}
                      {result.queryExecuted && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-sm text-gray-700 flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4" />
                              <span>Query Results ({result.result.length} items)</span>
                            </h4>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cycleViewMode(index)}
                                className="text-xs bg-gray-500 hover:bg-gray-600 text-white border-gray-400"
                              >
                                {getViewModeIcon(getViewMode(index))}
                                {getViewModeLabel(getViewMode(index))}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => exportToCSV(index)}
                                className="text-xs bg-gray-500 hover:bg-gray-600 text-white border-gray-400"
                                disabled={!result.result || result.result.length === 0}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Export CSV
                              </Button>
                            </div>
                          </div>
                          
                          {getViewMode(index) === 'conversation' ? (
                            // Conversation View - AI-like chat format
                            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                              <div className="space-y-4">
                                {/* AI Response */}
                                {result.aiResponse && (
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-white" />
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                                        <p className="text-sm text-gray-700">{result.aiResponse}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Data Summary */}
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                                      <Database className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                                      <h4 className="font-medium text-sm text-gray-900 mb-2">Data Summary</h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <span className="text-gray-500">Total Records:</span>
                                          <span className="ml-2 font-medium text-gray-900">{result.result.length}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Execution Time:</span>
                                          <span className="ml-2 font-medium text-gray-900">{result.executionTime}ms</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">Collection:</span>
                                          <span className="ml-2 font-medium text-gray-900 capitalize">{result.collection || 'vehicles'}</span>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">AI Generated:</span>
                                          <span className="ml-2 font-medium text-gray-900">{result.aiGenerated ? 'Yes' : 'No'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Sample Records */}
                                {result.result.length > 0 && (
                                  <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                                        <Car className="w-4 h-4 text-white" />
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="bg-white p-4 rounded-lg shadow-sm border">
                                        <h4 className="font-medium text-sm text-gray-900 mb-2">Sample Records</h4>
                                        <div className="space-y-2">
                                          {result.result.slice(0, 3).map((item: any, itemIndex: number) => (
                                            <div key={itemIndex} className="text-sm border-l-2 border-blue-200 pl-3">
                                              <span className="font-medium text-gray-900">{item.plateNumber || 'Unknown'}</span>
                                              <span className="text-gray-500 ml-2">({item.country || 'N/A'})</span>
                                              <span className="text-gray-500 ml-2">
                                                - {item.entryTime ? new Date(item.entryTime).toLocaleDateString() : 'No date'}
                                              </span>
                                              {item.area?.name && (
                                                <span className="text-gray-500 ml-2">at {item.area.name}</span>
                                              )}
                                            </div>
                                          ))}
                                          {result.result.length > 3 && (
                                            <div className="text-xs text-gray-500 italic">
                                              ... and {result.result.length - 3} more records
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : getViewMode(index) === 'table' ? (
                            // Table View
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-4 py-2 text-left font-medium text-gray-700">Plate Number</th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-700">Country</th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-700">Entry Time</th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-700">Area</th>
                                      <th className="px-4 py-2 text-left font-medium text-gray-700">Location</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {result.result.map((item: any, itemIndex: number) => (
                                      <tr key={itemIndex} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium text-gray-900">{item.plateNumber || '-'}</td>
                                        <td className="px-4 py-2 text-gray-600">{item.country || '-'}</td>
                                        <td className="px-4 py-2 text-gray-600">
                                          {item.entryTime ? new Date(item.entryTime).toLocaleString() : '-'}
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">{item.area?.name || '-'}</td>
                                        <td className="px-4 py-2 text-gray-600">{item.area?.location || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            // JSON View (Original format)
                            <div className="bg-white border border-gray-200 p-4 rounded-lg max-h-96 overflow-y-auto shadow-sm">
                              {formatResult(result.result).map((item, itemIndex) => (
                                <div key={itemIndex} className="mb-3 last:mb-0">
                                  {typeof item === 'object' ? (
                                    <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {JSON.stringify(item, null, 2)}
                                      </pre>
                                    </div>
                                  ) : (
                                    <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700">
                                      {item}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default InvestigateAI;
