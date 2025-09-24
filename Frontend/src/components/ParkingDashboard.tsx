// @ts-ignore - dom-to-image-more doesn't have TypeScript definitions
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
import { Save, Users, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
// WebSocket removed for this page – dashboard now fetches via API only

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
  plateNumber: string;
  entryTime: string;
  leavingTime: string;
  hours: number;
  minutes: number;
  image?: string;
  country?: string;
  angle?: number;
  confidence?: number;
}

// Represents the enriched record object after client-side processing
interface ProcessedRecord {
  _id: string;
  plate: string;
  entryDate: Date | null;
  exitDate: Date | null;
  durationMinutes: number | null;
  angle: number;
  image?: string;
  country?: string;
  confidence?: number;
}

interface Area {
  _id: string;
  name: string;
  capacity: number;
}


// --- HELPER FUNCTIONS ---
const processHourlyChartData = (records: ProcessedRecord[]) => {
  console.log('Processing records for hourly chart:', records.length, 'records');
  const hourlyData: { [key: number]: { entries: number; exits: number } } = {};
  for (let i = 0; i < 24; i++) hourlyData[i] = { entries: 0, exits: 0 };
  
  records.forEach((record, index) => {
    console.log(`Processing record ${index}:`, {
      entryDate: record.entryDate,
      exitDate: record.exitDate,
      entryDateType: typeof record.entryDate,
      exitDateType: typeof record.exitDate
    });
    // Count entry time
    if (record.entryDate && record.entryDate instanceof Date && !isNaN(record.entryDate.getTime())) {
      const entryHour = record.entryDate.getHours();
      if (entryHour >= 0 && entryHour <= 23 && hourlyData[entryHour]) {
        hourlyData[entryHour].entries++;
      }
    }
    
    // Count exit time
    if (record.exitDate && record.exitDate instanceof Date && !isNaN(record.exitDate.getTime())) {
      const exitHour = record.exitDate.getHours();
      if (exitHour >= 0 && exitHour <= 23 && hourlyData[exitHour]) {
        hourlyData[exitHour].exits++;
      }
    }
  });
  
  return Object.keys(hourlyData).map(hour => ({
    hour: `${hour}:00`,
    Entries: hourlyData[parseInt(hour)]?.entries || 0,
    Exits: hourlyData[parseInt(hour)]?.exits || 0,
  }));
};

const processEntriesByPeriod = (records: ProcessedRecord[], period: 'daily' | 'weekly' | 'monthly') => {
  const entries = records.filter(r => r.entryDate);
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
      <text x={x} y={y} dy={16} textAnchor="end" transform={`rotate(-20, ${x}, ${y})`} fill="rgba(0, 0, 0, 0.6)" fontSize={12}>
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

  // State for the new charts
  const [entriesPeriod, setEntriesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [overstayLimit, setOverstayLimit] = useState(60);
    
  // --- ML Predictor State ---
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

  // WebSocket event handlers removed

  // WebSocket connection management removed

  // WebSocket cleanup removed

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
      
      const rawRecords: RawRecord[] = (recordsResponse && (recordsResponse.data || recordsResponse.records)) || [];
      
      // Process raw records into a more useful format with Date objects and duration
      const processedRecords: ProcessedRecord[] = [];

      // Process records that already have entryTime and leavingTime
      console.log('Raw records from backend:', rawRecords);
      rawRecords.forEach((rec: RawRecord, index) => {
          console.log(`Processing raw record ${index}:`, rec);
          
          // Handle entryTime - it should be a string from the backend
          let entryDate = null;
          if (rec.entryTime && rec.entryTime !== 'N/A') {
              entryDate = new Date(rec.entryTime);
              if (isNaN(entryDate.getTime())) {
                  console.warn('Invalid entryTime date:', rec.entryTime);
                  entryDate = null;
              }
          }
          
          // Handle leavingTime - it should be a string from the backend
          let exitDate = null;
          if (rec.leavingTime && rec.leavingTime !== 'N/A' && rec.leavingTime !== 'Still Parking') {
              exitDate = new Date(rec.leavingTime);
              if (isNaN(exitDate.getTime())) {
                  console.warn('Invalid leavingTime date:', rec.leavingTime);
                  exitDate = null;
              }
          }
          
          console.log('Parsed dates:', {
            entryTime: rec.entryTime,
            entryDate: entryDate,
            entryDateValid: entryDate ? !isNaN(entryDate.getTime()) : false,
            leavingTime: rec.leavingTime,
            exitDate: exitDate,
            exitDateValid: exitDate ? !isNaN(exitDate.getTime()) : false
          });
          
          // Calculate duration if both entry and exit times are available
          let durationMinutes = null;
          if (entryDate && exitDate) {
              const durationMs = exitDate.getTime() - entryDate.getTime();
              durationMinutes = Math.floor(durationMs / 60000);
          } else if (rec.hours !== undefined && rec.minutes !== undefined) {
              // Use the duration from the backend if available
              durationMinutes = (rec.hours * 60) + rec.minutes;
          }
          
          processedRecords.push({
              _id: rec._id,
              plate: rec.plateNumber,
              entryDate: entryDate,
              exitDate: exitDate,
              durationMinutes: durationMinutes,
              angle: rec.angle || 0,
              image: rec.image,
              country: rec.country,
              confidence: rec.confidence
          });
      });
      setAllRecords(processedRecords);
      setExistingVehicles((vehiclesResponse && (vehiclesResponse.data || vehiclesResponse.vehicles)) || []);
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data.'); 
    } finally { 
      setDashboardLoading(false); 
    }
  }, [areas]);

  useEffect(() => {
    if (selectedAreaId) {
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
      // prediction loading state removed
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
        // prediction loading state removed
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
             {/* <h1 className="text-4xl font-bold tracking-tight">Parking Dashboard</h1>
             <p className="text-sm text-muted mt-2">Live view of parking area activity</p> */}
          </header>
          {error && <div className="bg-red-900 border border-red-700 rounded-xl p-4 text-red-200">{error}</div>}  
          {saveMessage && (
            <div className={`p-4 rounded-md text-center ${saveMessage.includes('Error') ? 'bg-red-800' : 'bg-green-800'}`}>
                {saveMessage}
            </div>
          )}
        
          {/* --- CONTROLS SECTION --- */}
{/* <!--           <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md space-y-6"> --> */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="area-select" className="block text-lg font-semibold mb-2 text-gray-900">Select a Parking Area</label>
                <select id="area-select" value={selectedAreaId || ''} onChange={(e) => {
                  setSelectedAreaId(e.target.value);
                  updateURLParams({ area: e.target.value || null });
                }} className="w-full bg-white border-2 border-gray-300 p-2.5 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm">
                    <option value="" disabled className="text-gray-500 bg-white">Choose an area...</option>
                    {areas.map((area) => ( <option key={area._id} value={area._id} className="text-gray-900 bg-white"> {area.name} </option> ))}
                </select>
              </div>
              <div>
                <label htmlFor="search-bar" className="block text-lg font-semibold mb-2 text-gray-900">Search by License Plate</label>
                <Input id="search-bar" type="text" placeholder="e.g., ABC-123" value={searchTerm} onChange={(e) => {
                  setSearchTerm(e.target.value);
                  updateURLParams({ search: e.target.value || null });
                }} className="bg-white border-gray-300 text-gray-900" />
              </div>
            </div>
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="flex-1 min-w-0">
                    <label htmlFor="start-date" className="block text-xs font-medium mb-1 text-gray-700">Start Date</label>
                    <Input type="date" id="start-date" value={startDate} onChange={(e) => { 
                      setStartDate(e.target.value); 
                      setActiveFilter('custom');
                      updateURLParams({ startDate: e.target.value || null, filter: 'custom' });
                    }} className="w-full bg-white border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                    <label htmlFor="end-date" className="block text-xs font-medium mb-1 text-gray-700">End Date</label>
                    <Input type="date" id="end-date" value={endDate} onChange={(e) => { 
                      setEndDate(e.target.value); 
                      setActiveFilter('custom');
                      updateURLParams({ endDate: e.target.value || null, filter: 'custom' });
                    }} className="w-full bg-white border-gray-300 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
              <div className="flex flex-col space-y-2 min-w-0">
                <label className="block text-xs font-medium text-gray-700">Quick Filters</label>
                <div className="flex flex-wrap gap-2">
                  <Button variant={activeFilter === 'today' ? 'default' : 'outline'} onClick={() => handlePresetFilterClick('today')} className={`text-xs px-3 py-1 h-8 ${activeFilter === 'today' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Today</Button>
                  <Button variant={activeFilter === 'week' ? 'default' : 'outline'} onClick={() => handlePresetFilterClick('week')} className={`text-xs px-3 py-1 h-8 ${activeFilter === 'week' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Week</Button>
                  <Button variant={activeFilter === 'month' ? 'default' : 'outline'} onClick={() => handlePresetFilterClick('month')} className={`text-xs px-3 py-1 h-8 ${activeFilter === 'month' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>Month</Button>
                  <Button variant={activeFilter === 'all' ? 'default' : 'outline'} onClick={() => handlePresetFilterClick('all')} className={`text-xs px-3 py-1 h-8 ${activeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>All</Button>
                </div>
              </div>
            </div>
          </section>
          
          {selectedAreaId && (
            dashboardLoading ? (
              <div className="text-center py-10">Loading area data...</div>
            ) : (
              <div className="space-y-8">
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="bg-white border-gray-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-blue-600 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Current Occupancy
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-gray-900 text-center">{existingVehicles.length} / {selectedArea?.capacity || 'N/A'}</CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-green-600 flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5" />
                        Total Entries
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-gray-900 text-center">{filteredRecords.filter(r => r.entryDate).length}</CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-yellow-600 flex items-center gap-2">
                        <ArrowDownLeft className="h-5 w-5" />
                        Total Exits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-gray-900 text-center">{filteredRecords.filter(r => r.exitDate).length}</CardContent>
                  </Card>
                  <Card className="bg-white border-gray-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-red-600 flex items-center gap-2">
                        <ArrowUpRight className="h-5 w-5" />
                        Total Overstays
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold text-gray-900 text-center">{filteredRecords.filter(r => r.durationMinutes && r.durationMinutes > overstayLimit).length}</CardContent>
                  </Card>
                </section>
                
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div ref={hourlyChartRef} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Hourly Activity (Historical & Predicted)</h3>
                        <Button variant="outline" size="sm" disabled={isSaving} onClick={() => handleSaveReport('hourly-activity', combinedHourlyData, 'Hourly entries, exits, and next-day predictions.')} className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                           <Save className="mr-2 h-4 w-4" /> Save Report
                        </Button>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={combinedHourlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
                        <XAxis dataKey="hour" stroke="rgba(0, 0, 0, 0.6)" fontSize={12} />
                        <YAxis stroke="rgba(0, 0, 0, 0.6)" fontSize={12} />
                        <Tooltip wrapperClassName="!bg-white !border-gray-300 !text-gray-900" contentStyle={{ color: '#111827', backgroundColor: 'white', border: '1px solid #d1d5db' }} />
                        <Legend />
                        <Bar dataKey="Entries" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Exits" fill="#10b981" radius={[4, 4, 0, 0]} />
                         <Line type="monotone" dataKey="Predictor" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div ref={entriesChartRef} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                  {/* Chart 2: Historical Vehicle Entries */}
{/* <!--                   <div className="backdrop-blur-md bg-white/20 rounded-2xl border border-white/30 p-6 shadow-2xl"> --> */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Vehicle Entries</h3>
                       <Button variant="outline" size="sm" disabled={isSaving} onClick={() => handleSaveReport('entries-over-time', combinedEntriesData, `Vehicle entries shown ${entriesPeriod}.`)} className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                           <Save className="mr-2 h-4 w-4" /> Save Report
                        </Button>
                    </div>
                     <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-600">Historical & Predicted</p>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant={entriesPeriod === 'daily' ? 'default' : 'outline'} onClick={() => setEntriesPeriod('daily')} className={entriesPeriod === 'daily' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}>Daily</Button>
                        <Button size="sm" variant={entriesPeriod === 'weekly' ? 'default' : 'outline'} onClick={() => setEntriesPeriod('weekly')} className={entriesPeriod === 'weekly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}>Weekly</Button>
                        <Button size="sm" variant={entriesPeriod === 'monthly' ? 'default' : 'outline'} onClick={() => setEntriesPeriod('monthly')} className={entriesPeriod === 'monthly' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}>Monthly</Button>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={combinedEntriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
                        <XAxis dataKey="period" stroke="rgba(0, 0, 0, 0.6)" fontSize={12} tick={<AngleTick />} height={60} />
                        <YAxis stroke="rgba(0, 0, 0, 0.6)" fontSize={12} allowDecimals={false}/>
                        <Tooltip wrapperClassName="!bg-white !border-gray-300 !text-gray-900" contentStyle={{ color: '#111827', backgroundColor: 'white', border: '1px solid #d1d5db' }} />
                        <Legend />
                        <Line type="monotone" dataKey="Entries" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
                        <Line type="monotone" dataKey="Predictor" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                 
                  <div ref={overstayChartRef} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Vehicles Overstay Analysis</h3>
                        <Button variant="outline" size="sm" disabled={isSaving} onClick={() => handleSaveReport('overstay-analysis', overstayChartData, `Vehicles staying longer than ${overstayLimit} minutes.`)} className="bg-white text-gray-700 border-gray-300 hover:bg-gray-50">
                           <Save className="mr-2 h-4 w-4" /> Save Report
                        </Button>
                    </div>
                  {/* Chart 3: Vehicles Overstay Analysis */}
{/* <!--                   <div className="backdrop-blur-md bg-white/20 rounded-2xl border border-white/30 p-6 shadow-2xl"> --> */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <div className="flex items-center gap-2">
                        <label htmlFor="overstay-limit" className="text-sm text-gray-700">Time Limit (mins):</label>
                        <Input id="overstay-limit" type="number" value={overstayLimit} onChange={(e) => setOverstayLimit(parseInt(e.target.value) || 0)} className="bg-white border-2 border-gray-300 text-gray-900 w-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm" />
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={overstayChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" />
                        <XAxis dataKey="date" stroke="rgba(0, 0, 0, 0.6)" fontSize={12} />
                        <YAxis stroke="rgba(0, 0, 0, 0.6)" fontSize={12} allowDecimals={false} />
                        <Tooltip wrapperClassName="!bg-white !border-gray-300 !text-gray-900" contentStyle={{ color: '#111827', backgroundColor: 'white', border: '1px solid #d1d5db' }} />
                        <Legend />
                        <Bar dataKey="Overstaying Vehicles" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                
                <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
                {/* Records Table */}
{/* <!--                 <section className="backdrop-blur-md bg-white/20 rounded-2xl border border-white/30 p-6 shadow-2xl"> --> */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Records ({filteredRecords.length} found)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-gray-900 font-semibold">License Plate</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Entry Time</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Leaving Time</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Duration (mins)</TableHead>
                        <TableHead className="text-gray-900 font-semibold">Angle (°)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.slice(0, 10).map((record) => (
                          <TableRow key={record._id}>
                            <TableCell className="text-gray-900">{record.plate || 'N/A'}</TableCell>
                            <TableCell className="text-gray-900">{record.entryDate ? record.entryDate.toLocaleString() : 'N/A'}</TableCell>
                            <TableCell className="text-gray-900">{record.exitDate ? record.exitDate.toLocaleString() : 'Still Parking'}</TableCell>
                            <TableCell className="text-gray-900">{record.durationMinutes !== null ? record.durationMinutes : 'N/A'}</TableCell>
                            <TableCell className="text-gray-900">{typeof record.angle === 'number' ? record.angle.toFixed(1) : 'N/A'}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-gray-900">No records found matching your filters.</TableCell>
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