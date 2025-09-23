import domtoimage from 'dom-to-image-more';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { authInterceptor } from '../services/authInterceptor';
import { getAllParkingAreas, getAllRecords, getExistingVehicles, getVehicleEntryPredictions } from '@/services/parkingApi';
import { saveReport } from '@/services/reportsApi';
import { Save } from 'lucide-react';
import { webSocketService } from '@/services/websocket';

// --- INTERFACES ---
interface VehicleRecord {
  _id: string;
  plateNumber: string;
  datetime: string;
  areaId: string;
}

// Represents the raw record data from the backend API
interface RawRecord {
  _id: string;
  plate: string;
  action: 'ENTRY' | 'EXIT';
  time: string;
  date: string;
  image: string;
  country: string;
  angle: number;
  confidence: number;
}

// Represents the enriched record object after client-side processing
interface ProcessedRecord {
  _id: string;
  plate: string;
  action: 'ENTRY' | 'EXIT';
  date: string;
  time: string;
  entryDate: Date | null;
  exitDate: Date | null;
  durationMinutes: number | null;
  angle: number;
}

interface Area {
  _id: string;
  name: string;
  capacity: number;
}


// --- HELPER FUNCTIONS ---
const processHourlyChartData = (records: ProcessedRecord[]) => {
  const hourlyData: { [key: number]: { entries: number; exits: number } } = {};
  for (let i = 0; i < 24; i++) hourlyData[i] = { entries: 0, exits: 0 };
  records.forEach(record => {
    const dateToUse = record.action === 'ENTRY' ? record.entryDate : record.exitDate;
    if (dateToUse) {
      const hour = dateToUse.getHours();
      if (record.action === 'ENTRY') hourlyData[hour].entries++;
      else hourlyData[hour].exits++;
    }
  });
  return Object.keys(hourlyData).map(hour => ({
    hour: `${hour}:00`,
    Entries: hourlyData[parseInt(hour)].entries,
    Exits: hourlyData[parseInt(hour)].exits,
  }));
};

const processEntriesByPeriod = (records: ProcessedRecord[], period: 'daily' | 'weekly' | 'monthly') => {
  const entries = records.filter(r => r.action === 'ENTRY' && r.entryDate);
  const aggregation: { [key: string]: number } = {};
  entries.forEach(record => {
    const date = new Date(record.entryDate!);
    let key = '';
    if (period === 'daily') {
      key = date.toLocaleDateString('en-CA');
    } else if (period === 'weekly') {
      const dayOfWeek = date.getDay();
      const firstDay = new Date(date.setDate(date.getDate() - dayOfWeek));
      key = `Week of ${firstDay.toLocaleDateString('en-CA')}`;
    } else if (period === 'monthly') {
      key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
    if (key) aggregation[key] = (aggregation[key] || 0) + 1;
  });
  return Object.keys(aggregation).sort().map(key => ({
    period: key,
    Entries: aggregation[key]
  }));
};

const processPredictionsByPeriod = (
  predictions: { [key: string]: number },
  period: 'daily' | 'weekly' | 'monthly'
) => {
  const aggregation: { [key: string]: number } = {};
  Object.keys(predictions).forEach(timestamp => {
    const date = new Date(timestamp);
    let key = '';
    if (period === 'daily') {
      key = date.toLocaleDateString('en-CA');
    } else if (period === 'weekly') {
      const dayOfWeek = date.getDay();
      const firstDay = new Date(new Date(date).setDate(date.getDate() - dayOfWeek));
      key = `Week of ${firstDay.toLocaleDateString('en-CA')}`;
    } else if (period === 'monthly') {
      key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
    if (key) {
      aggregation[key] = (aggregation[key] || 0) + predictions[timestamp];
    }
  });
  return Object.keys(aggregation).sort().map(key => ({
    period: key,
    Predictor: Math.round(aggregation[key])
  }));
};


const processOverstayData = (records: ProcessedRecord[], timeLimitMinutes: number) => {
  const overstays = records.filter(r => r.durationMinutes && r.durationMinutes > timeLimitMinutes);
  const aggregation: { [key: string]: number } = {};
  overstays.forEach(record => {
    const date = record.entryDate!;
    const key = date.toLocaleDateString('en-CA');
    aggregation[key] = (aggregation[key] || 0) + 1;
  });
  return Object.keys(aggregation).sort().map(key => ({
    date: key,
    'Overstaying Vehicles': aggregation[key]
  }));
};

// --- MAIN DASHBOARD COMPONENT ---
export default function ParkingDashboard() {
  // Custom rotated tick for XAxis labels
  const AngleTick = (props: any) => {
    const { x, y, payload } = props;
    return (
      <text x={x} y={y} dy={16} textAnchor="end" transform={`rotate(-20, ${x}, ${y})`} fill="#888888" fontSize={12}>
        {payload?.value}
      </text>
    );
  };
  // --- URL PARAMETER MANAGEMENT ---
  const [searchParams, setSearchParams] = useSearchParams();

  // --- STATE MANAGEMENT ---
  const hourlyChartRef = useRef(null);
  const entriesChartRef = useRef(null);
  const overstayChartRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<ProcessedRecord[]>([]);
  const [existingVehicles, setExistingVehicles] = useState<VehicleRecord[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [lastDataUpdate, setLastDataUpdate] = useState<string | null>(null);
  const [liveUpdatesEnabled, setLiveUpdatesEnabled] = useState(true);

  // State for the new charts
  const [entriesPeriod, setEntriesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [overstayLimit, setOverstayLimit] = useState(60);
    
  // --- ML Predictor State ---
  const [predictLoading, setPredictLoading] = useState(false);
  const [rawHourlyPredictions, setRawHourlyPredictions] = useState<{ [key: string]: number }>({});

  // --- State for handling save report feedback ---
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  // --- URL PARAMETER FUNCTIONS ---
  const updateURLParams = (updates: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });
    
    setSearchParams(newSearchParams, { replace: true });
  };


  // --- DATA FETCHING AND PROCESSING ---
  useEffect(() => {
    const verifyAuth = async () => {
      if (!authInterceptor.isAuthenticated()) {
        setIsAuthenticated(false);
        window.location.href = '/login';
      } else setIsAuthenticated(true);
    };
    verifyAuth();
  }, []);

  // Effect to read URL parameters on component mount
  useEffect(() => {
    const areaId = searchParams.get('area');
    const search = searchParams.get('search');
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');
    const filter = searchParams.get('filter');

    if (areaId) setSelectedAreaId(areaId);
    if (search) setSearchTerm(search);
    if (start) setStartDate(start);
    if (end) setEndDate(end);
    if (filter) setActiveFilter(filter);
  }, [searchParams]);

  // Memoized WebSocket event handlers
  const handleDataUpdated = useCallback((data: any) => {
    console.log('📊 Received data update notification:', data);
    setLastDataUpdate(data.timestamp);
    
    // If the update is for the currently selected area, refresh the data
    if (selectedAreaId && data.areaId === selectedAreaId) {
      console.log('🔄 Refreshing data for current area due to WebSocket update');
      setDashboardLoading(true);
      // Trigger data refresh
      setTimeout(() => {
        fetchDashboardData(selectedAreaId);
      }, 1000);
    }
  }, [selectedAreaId]);

  const handleDataError = useCallback((data: any) => {
    console.error('❌ WebSocket data error:', data);
    if (selectedAreaId && data.areaId === selectedAreaId) {
      setError(`Data update failed: ${data.error}`);
    }
  }, [selectedAreaId]);

  const handleRefreshComplete = useCallback((data: any) => {
    console.log('🔄 Refresh complete:', data);
    if (selectedAreaId && data.areaId === selectedAreaId) {
      if (data.success) {
        setError(''); // Clear any previous errors
      } else {
        setError(`Manual refresh failed: ${data.error}`);
      }
    }
  }, [selectedAreaId]);

  const handleLiveUpdatesToggled = useCallback((data: any) => {
    console.log('📊 Live updates toggled:', data.enabled);
    setLiveUpdatesEnabled(data.enabled);
  }, []);

  // Effect to manage WebSocket connection and events
  useEffect(() => {
    // Check WebSocket connection status
    const checkConnection = () => {
      const status = webSocketService.getConnectionStatus();
      setWsConnected(status.isConnected);
      setLiveUpdatesEnabled(status.liveUpdatesEnabled);
    };

    // Initial connection check
    checkConnection();

    // Set up WebSocket event listeners
    const cleanupDataUpdated = webSocketService.addEventListener('websocket-data-updated', handleDataUpdated);
    const cleanupDataError = webSocketService.addEventListener('websocket-data-error', handleDataError);
    const cleanupRefreshComplete = webSocketService.addEventListener('websocket-refresh-complete', handleRefreshComplete);
    const cleanupLiveUpdatesToggled = webSocketService.addEventListener('websocket-live-updates-toggled', handleLiveUpdatesToggled);

    // Check connection status periodically
    const connectionInterval = setInterval(checkConnection, 5000);

    // Cleanup function
    return () => {
      cleanupDataUpdated();
      cleanupDataError();
      cleanupRefreshComplete();
      cleanupLiveUpdatesToggled();
      clearInterval(connectionInterval);
    };
  }, [selectedAreaId, handleDataUpdated, handleDataError, handleRefreshComplete, handleLiveUpdatesToggled]);

  // Effect to clean up WebSocket room when component unmounts
  useEffect(() => {
    return () => {
      if (selectedAreaId) {
        webSocketService.leaveArea(selectedAreaId);
      }
    };
  }, [selectedAreaId]);

  // Memoized function to fetch areas
  const fetchAreas = useCallback(async () => {
    try {
      const response = await getAllParkingAreas();
      if (response.success) setAreas(response.data || []);
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'An unknown error occurred.'); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  // Effect to fetch list of parking areas
  useEffect(() => {
    if (isAuthenticated) {
      fetchAreas();
    }
  }, [isAuthenticated, fetchAreas]);

  // Memoized function to fetch dashboard data
  const fetchDashboardData = useCallback(async (areaId: string) => {
    setDashboardLoading(true);
    setError('');
    try {
      const areaDetails = areas.find(a => a._id === areaId);
      setSelectedArea(areaDetails || null);
      const [recordsResponse, vehiclesResponse] = await Promise.all([
        getAllRecords(areaId, 1, 2000),
        getExistingVehicles(areaId, 1, 1000)
      ]);
      
      const rawRecords: RawRecord[] = recordsResponse.records || [];
      
      // Process raw records into a more useful format with Date objects and duration
      const entryMap = new Map<string, RawRecord>();
      const processedRecords: ProcessedRecord[] = [];

      // First pass: create a map of the most recent entry for each license plate
      rawRecords.filter((r: RawRecord) => r.action === 'ENTRY').forEach((rec: RawRecord) => {
          entryMap.set(rec.plate, rec);
      });

      // Second pass: process all records, calculating duration for exits
      rawRecords.forEach((rec: RawRecord) => {
          const [month, day, year] = rec.date.split('/');
          const dateObj = new Date(`${year}-${month}-${day}T${rec.time}`);
          
          if (rec.action === 'EXIT') {
              const matchingEntry = entryMap.get(rec.plate);
              if (matchingEntry) {
                  const [entryMonth, entryDay, entryYear] = matchingEntry.date.split('/');
                  const entryDateObj = new Date(`${entryYear}-${entryMonth}-${entryDay}T${matchingEntry.time}`);
                  const durationMs = dateObj.getTime() - entryDateObj.getTime();
                  
                  processedRecords.push({
                      ...rec,
                      entryDate: entryDateObj,
                      exitDate: dateObj,
                      durationMinutes: Math.floor(durationMs / 60000),
                      angle: rec.angle
                  });
                  // Once matched, remove the entry to handle re-entries correctly
                  entryMap.delete(rec.plate);
              }
          } else { // Entry record
              processedRecords.push({
                  ...rec,
                  entryDate: dateObj,
                  exitDate: null,
                  durationMinutes: null,
                  angle: rec.angle
              });
          }
      });
      setAllRecords(processedRecords);
      setExistingVehicles(vehiclesResponse.vehicles || []);
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.'); 
    } finally { 
      setDashboardLoading(false); 
    }
  }, [areas]);

  useEffect(() => {
    if (selectedAreaId) {
      // Join WebSocket room for this area
      webSocketService.joinArea(selectedAreaId);
      fetchDashboardData(selectedAreaId);
    }
  }, [selectedAreaId, fetchDashboardData]);

  // Memoized filtered records to prevent unnecessary re-renders
  const filteredRecords = useMemo(() => {
    let records = allRecords;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      records = records.filter(record => record.entryDate && record.entryDate >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      records = records.filter(record => record.entryDate && record.entryDate <= end);
    }
    if (searchTerm) {
      records = records.filter(record =>
        record.plate?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return records;
  }, [startDate, endDate, searchTerm, allRecords]);

  useEffect(() => {
    if (filteredRecords.length === 0) {
      setRawHourlyPredictions({});
      return;
    }

    const fetchPredictions = async () => {
      setPredictLoading(true);
      const lastRecordDate = new Date(Math.max(
          Date.now(),
          ...filteredRecords.map(r => r.entryDate ? r.entryDate.getTime() : 0)
      ));
      const timestamps: string[] = [];
      const startDate = new Date(lastRecordDate);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);

      for (let day = 0; day < 30; day++) {
        for (let hour = 0; hour < 24; hour++) {
          const timestampDate = new Date(startDate);
          timestampDate.setDate(startDate.getDate() + day);
          timestampDate.setHours(hour);
          timestamps.push(timestampDate.toISOString().slice(0, 19));
        }
      }

      try {
        const res = await getVehicleEntryPredictions(timestamps);
        setRawHourlyPredictions(res.predictions || {});
      } catch (err) {
        console.error("Prediction API call failed:", err);
        setRawHourlyPredictions({});
      } finally {
        setPredictLoading(false);
      }
    };
    fetchPredictions();
  }, [filteredRecords]);


  // --- EVENT HANDLERS ---
  const handlePresetFilterClick = (period: string) => {
    setActiveFilter(period);
    const today = new Date();
    const toYYYYMMDD = (date: Date) => date.toISOString().split('T')[0];
    if (period === 'all') {
      setStartDate('');
      setEndDate('');
      updateURLParams({ filter: 'all', startDate: null, endDate: null });
      return;
    }
    
    setEndDate(toYYYYMMDD(today));
    let startDateValue = '';
    
    if (period === 'today') {
      startDateValue = toYYYYMMDD(today);
      setStartDate(startDateValue);
    } else if (period === 'week') {
      const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      startDateValue = toYYYYMMDD(firstDayOfWeek);
      setStartDate(startDateValue);
    } else if (period === 'month') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startDateValue = toYYYYMMDD(firstDayOfMonth);
      setStartDate(startDateValue);
    }
    
    updateURLParams({ 
      filter: period, 
      startDate: startDateValue, 
      endDate: toYYYYMMDD(today) 
    });
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setActiveFilter('all');
    updateURLParams({ 
      startDate: null, 
      endDate: null, 
      search: null, 
      filter: 'all' 
    });
  };
// Located inside the ParkingDashboard component

// ParkingDashboard.tsx
// ParkingDashboard.tsx

const handleSaveReport = async (chartType: string, chartData: any[], description: string) => {
    const reportName = prompt('Please enter a name for this report:');
    if (!reportName || !selectedAreaId) {
        alert('Report name and a selected area are required.');
        return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
        let chartElement = null;
        if (chartType === 'hourly-activity') chartElement = hourlyChartRef.current;
        if (chartType === 'entries-over-time') chartElement = entriesChartRef.current;
        if (chartType === 'overstay-analysis') chartElement = overstayChartRef.current;

        if (!chartElement) {
            throw new Error("Chart element could not be found in the DOM.");
        }

        // --- NEW: Add a small delay to ensure the chart is fully rendered ---
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay

        const chartImage = await domtoimage.toPng(chartElement, {
            bgcolor: '#18181b'
        });
        
        // --- NEW: Explicitly check if the image capture was successful ---
        if (!chartImage || chartImage.length < 100) { // Check if the result is valid
             throw new Error("Image capture failed, the resulting data is empty.");
        }

        const payload = {
            name: reportName,
            areaId: selectedAreaId,
            type: chartType,
            chartData: chartData,
            chartImage: chartImage,
            filters: { startDate, endDate, searchTerm, overstayLimit, entriesPeriod },
            description
        };

        await saveReport(payload);
        setSaveMessage(`Report "${reportName}" saved successfully!`);

    } catch (error) {
        // This will now catch the specific error if image capture fails
        console.error('Failed to save report', error);
        setSaveMessage('Error: Could not save the report. Check console for details.');
    } finally {
        setIsSaving(false);
        setTimeout(() => setSaveMessage(''), 4000);
    }
};

  // --- MEMOIZED CHART DATA ---
  const overstayChartData = useMemo(() => processOverstayData(filteredRecords, overstayLimit), [filteredRecords, overstayLimit]);
  
  const combinedHourlyData = useMemo(() => {
    const historical = processHourlyChartData(filteredRecords);
    const lastRecordDate = new Date(Math.max(
        Date.now(),
        ...filteredRecords.map(r => r.entryDate ? r.entryDate.getTime() : 0)
    ));
    const nextDayStr = new Date(lastRecordDate.setDate(lastRecordDate.getDate() + 1)).toISOString().split('T')[0];

    const predicted = Object.keys(rawHourlyPredictions)
      .filter(ts => ts.startsWith(nextDayStr))
      .map(ts => {
          const date = new Date(ts);
          const hourKey = `${date.getHours()}:00`;
          return { hour: hourKey, Predictor: Math.round(rawHourlyPredictions[ts]) };
      });

    const combined = historical.map(h => {
        const matchingPred = predicted.find(p => p.hour === h.hour);
        return {
            ...h,
            Predictor: matchingPred ? matchingPred.Predictor : null
        };
    });
    return combined;
  }, [filteredRecords, rawHourlyPredictions]);

  const combinedEntriesData = useMemo(() => {
    const historical = processEntriesByPeriod(filteredRecords, entriesPeriod);
    const predicted = processPredictionsByPeriod(rawHourlyPredictions, entriesPeriod);
    const combinedMap = new Map<string, { period: string; Entries?: number | null; Predictor?: number | null }>();

    historical.forEach(item => {
      combinedMap.set(item.period, { ...item, Predictor: null });
    });
    predicted.forEach(item => {
      if (combinedMap.has(item.period)) {
        const existing = combinedMap.get(item.period)!;
        existing.Predictor = item.Predictor;
      } else {
        combinedMap.set(item.period, { period: item.period, Entries: null, Predictor: item.Predictor });
      }
    });
    return Array.from(combinedMap.values()).sort((a, b) => new Date(a.period.replace('Week of ', '')).getTime() - new Date(b.period.replace('Week of ', '')).getTime());
  }, [filteredRecords, entriesPeriod, rawHourlyPredictions]);


  // --- RENDER LOGIC ---
  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen text-white relative overflow-hidden flex items-center justify-center"style={{background: 'linear-gradient(to bottom right, #677ae5, #6f60c0)'}}>
        <div 
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(50%, -50%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(-50%, 50%)' }}
        ></div>
        <div className="backdrop-blur-md bg-white/5 rounded-2xl px-6 py-3 border border-white/10 shadow-2xl text-center relative z-10">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden"style={{background: 'linear-gradient(to bottom right, #677ae5, #6f60c0)'}}>
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(50%, -50%)' }}></div>
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(-50%, 50%)' }}></div>
      <div className="relative z-10 px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="text-center">
             <h1 className="text-4xl font-bold tracking-tight">Parking Dashboard</h1>
             <p className="text-sm text-muted mt-2">Live view of parking area activity</p>
             
             {/* WebSocket Connection Status */}
             <div className="flex items-center justify-center gap-4 mt-4">
               <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                 wsConnected 
                   ? (liveUpdatesEnabled 
                       ? 'bg-green-900/30 text-green-400 border border-green-700' 
                       : 'bg-yellow-900/30 text-yellow-400 border border-yellow-700')
                   : 'bg-red-900/30 text-red-400 border border-red-700'
               }`}>
                 <div className={`w-2 h-2 rounded-full ${
                   wsConnected 
                     ? (liveUpdatesEnabled ? 'bg-green-400' : 'bg-yellow-400')
                     : 'bg-red-400'
                 }`}></div>
                 {wsConnected 
                   ? (liveUpdatesEnabled ? 'Live Updates Connected' : 'Live Updates Paused')
                   : 'Live Updates Disconnected'
                 }
               </div>
               
               {selectedAreaId && (
                 <>
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => {
                       webSocketService.refreshAreaData(selectedAreaId);
                       setDashboardLoading(true);
                       setTimeout(() => setDashboardLoading(false), 2000);
                     }}
                     disabled={!wsConnected || dashboardLoading}
                     className="text-xs"
                   >
                     {dashboardLoading ? 'Refreshing...' : 'Manual Refresh'}
                   </Button>
                   
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => webSocketService.toggleLiveUpdates()}
                     disabled={!wsConnected}
                     className={`text-xs ${
                       liveUpdatesEnabled 
                         ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                         : 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                     }`}
                   >
                     {liveUpdatesEnabled ? 'Live Updates: ON' : 'Live Updates: OFF'}
                   </Button>
                 </>
               )}
               
               {lastDataUpdate && (
                 <div className="text-xs text-gray-400">
                   Last update: {new Date(lastDataUpdate).toLocaleTimeString()}
                 </div>
               )}
             </div>
          </header>
          {error && <div className="bg-red-900 border border-red-700 rounded-xl p-4 text-red-200">{error}</div>}  
          {saveMessage && (
            <div className={`p-4 rounded-md text-center ${saveMessage.includes('Error') ? 'bg-red-800' : 'bg-green-800'}`}>
                {saveMessage}
            </div>
          )}
        
          {/* --- CONTROLS SECTION --- */}
{/* <!--           <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md space-y-6"> --> */}
          <section className="backdrop-blur-md bg-white/20 rounded-2xl border border-white/30 p-6 shadow-2xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="area-select" className="block text-lg font-semibold mb-2">Select a Parking Area</label>
                <select id="area-select" value={selectedAreaId || ''} onChange={(e) => {
                  setSelectedAreaId(e.target.value);
                  updateURLParams({ area: e.target.value || null });
                }} className="w-full backdrop-blur-md bg-white/20 border-white/30 p-2.5 rounded-md text-white focus:ring-2 focus:ring-blue-500">
                    <option value="" disabled>Choose an area...</option>
                    {areas.map((area) => ( <option key={area._id} value={area._id}> {area.name} </option> ))}
                </select>
              </div>
              <div>
                <label htmlFor="search-bar" className="block text-lg font-semibold mb-2">Search by License Plate</label>
                <Input id="search-bar" type="text" placeholder="e.g., ABC-123" value={searchTerm} onChange={(e) => {
                  setSearchTerm(e.target.value);
                  updateURLParams({ search: e.target.value || null });
                }} className="backdrop-blur-md bg-white/20 border-white/30 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label htmlFor="start-date" className="block text-sm font-medium mb-2">Start Date</label>
                    <Input type="date" id="start-date" value={startDate} onChange={(e) => { 
                      setStartDate(e.target.value); 
                      setActiveFilter('custom');
                      updateURLParams({ startDate: e.target.value || null, filter: 'custom' });
                    }} className="w-full backdrop-blur-md bg-white/20 border-white/30 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                    <label htmlFor="end-date" className="block text-sm font-medium mb-2">End Date</label>
                    <Input type="date" id="end-date" value={endDate} onChange={(e) => { 
                      setEndDate(e.target.value); 
                      setActiveFilter('custom');
                      updateURLParams({ endDate: e.target.value || null, filter: 'custom' });
                    }} className="w-full backdrop-blur-md bg-white/20 border-white/30 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <label className="block text-sm font-medium mb-2">Quick Filters</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 gap-2">
                  <Button variant={activeFilter === 'today' ? 'default' : 'outline'} onClick={() => handlePresetFilterClick('today')}>Today</Button>
                  <Button variant={activeFilter === 'week' ? 'default' : 'outline'} onClick={() => handlePresetFilterClick('week')}>Week</Button>
                  <Button variant={activeFilter === 'month' ? 'default' : 'outline'} onClick={() => handlePresetFilterClick('month')}>Month</Button>
                  <Button variant={activeFilter === 'all' ? 'default' : 'outline'} onClick={() => handlePresetFilterClick('all')}>All</Button>
                </div>
              </div>
            </div>
            <div><Button variant="ghost" onClick={handleClearFilters} className="text-sm text-gray-400 hover:text-white">Clear All Filters</Button></div>
          </section>
          
          {selectedAreaId && (
            dashboardLoading ? (
              <div className="text-center py-10">Loading area data...</div>
            ) : (
              <div className="space-y-8">
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="backdrop-blur-md bg-white/20 border-white/30">
                    <CardHeader><CardTitle className="text-blue-400">Current Occupancy</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">{existingVehicles.length} / {selectedArea?.capacity || 'N/A'}</CardContent>
                  </Card>
                  <Card className="backdrop-blur-md bg-white/20 border-white/30">
                    <CardHeader><CardTitle className="text-green-400">Total Entries (Filtered)</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">{filteredRecords.filter(r => r.action === 'ENTRY').length}</CardContent>
                  </Card>
                  <Card className="backdrop-blur-md bg-white/20 border-white/30">
                    <CardHeader><CardTitle className="text-yellow-400">Total Exits (Filtered)</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">{filteredRecords.filter(r => r.action === 'EXIT').length}</CardContent>
                  </Card>
                </section>
                
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div ref={hourlyChartRef} className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Hourly Activity (Historical & Predicted)</h3>
                        <Button variant="outline" size="sm" disabled={isSaving} onClick={() => handleSaveReport('hourly-activity', combinedHourlyData, 'Hourly entries, exits, and next-day predictions.')}>
                           <Save className="mr-2 h-4 w-4" /> Save Report
                        </Button>
                    </div>
                  {/* Chart 1: Hourly Activity with Prediction */}
{/* <!--                   <div className="backdrop-blur-md bg-white/20 rounded-2xl border border-white/30 p-6 shadow-2xl lg:col-span-2"> --> */}
                    <h3 className="text-lg font-semibold mb-4">Hourly Activity (Historical & Predicted)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={combinedHourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="hour" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} />
                        <Tooltip wrapperClassName="!bg-neutral-900 !border-neutral-700" />
                        <Legend />
                        <Bar dataKey="Entries" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Exits" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                         <Line type="monotone" dataKey="Predictor" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div ref={entriesChartRef} className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
                  {/* Chart 2: Historical Vehicle Entries */}
{/* <!--                   <div className="backdrop-blur-md bg-white/20 rounded-2xl border border-white/30 p-6 shadow-2xl"> --> */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Vehicle Entries</h3>
                       <Button variant="outline" size="sm" disabled={isSaving} onClick={() => handleSaveReport('entries-over-time', combinedEntriesData, `Vehicle entries shown ${entriesPeriod}.`)}>
                           <Save className="mr-2 h-4 w-4" /> Save Report
                        </Button>
                    </div>
                     <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-muted-foreground">Historical & Predicted</p>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant={entriesPeriod === 'daily' ? 'default' : 'outline'} onClick={() => setEntriesPeriod('daily')}>Daily</Button>
                        <Button size="sm" variant={entriesPeriod === 'weekly' ? 'default' : 'outline'} onClick={() => setEntriesPeriod('weekly')}>Weekly</Button>
                        <Button size="sm" variant={entriesPeriod === 'monthly' ? 'default' : 'outline'} onClick={() => setEntriesPeriod('monthly')}>Monthly</Button>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={combinedEntriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="period" stroke="#888888" fontSize={12} tick={<AngleTick />} height={60} />
                        <YAxis stroke="#888888" fontSize={12} allowDecimals={false}/>
                        <Tooltip wrapperClassName="!bg-neutral-900 !border-neutral-700" />
                        <Legend />
                        <Line type="monotone" dataKey="Entries" stroke="#22c55e" strokeWidth={2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="Predictor" stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                 
                  <div ref={overstayChartRef} className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Vehicles Overstay Analysis</h3>
                        <Button variant="outline" size="sm" disabled={isSaving} onClick={() => handleSaveReport('overstay-analysis', overstayChartData, `Vehicles staying longer than ${overstayLimit} minutes.`)}>
                           <Save className="mr-2 h-4 w-4" /> Save Report
                        </Button>
                    </div>
                  {/* Chart 3: Vehicles Overstay Analysis */}
{/* <!--                   <div className="backdrop-blur-md bg-white/20 rounded-2xl border border-white/30 p-6 shadow-2xl"> --> */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <div className="flex items-center gap-2">
                        <label htmlFor="overstay-limit" className="text-sm">Time Limit (mins):</label>
                        <Input id="overstay-limit" type="number" value={overstayLimit} onChange={(e) => setOverstayLimit(parseInt(e.target.value) || 0)} className="backdrop-blur-md bg-white/20 border-white/30 w-24" />
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={overstayChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                        <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                        <YAxis stroke="#888888" fontSize={12} allowDecimals={false} />
                        <Tooltip wrapperClassName="!bg-neutral-900 !border-neutral-700" />
                        <Legend />
                        <Bar dataKey="Overstaying Vehicles" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                
                <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
                {/* Records Table */}
{/* <!--                 <section className="backdrop-blur-md bg-white/20 rounded-2xl border border-white/30 p-6 shadow-2xl"> --> */}
                  <h3 className="text-lg font-semibold mb-4">Filtered Records ({filteredRecords.length} found)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>License Plate</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Duration (mins)</TableHead>
                        <TableHead>Angle (°)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.slice(0, 10).map((record) => (
                          <TableRow key={record._id}>
                            <TableCell>{record.plate || 'N/A'}</TableCell>
                            <TableCell>{record.action}</TableCell>
                            <TableCell>{record.date} {record.time}</TableCell>
                            <TableCell>{record.durationMinutes !== null ? record.durationMinutes : 'N/A'}</TableCell>
                            <TableCell>{typeof record.angle === 'number' ? record.angle.toFixed(1) : 'N/A'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">No records found matching your filters.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </section>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}