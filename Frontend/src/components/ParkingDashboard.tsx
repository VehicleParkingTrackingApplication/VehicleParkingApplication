import React, { useState, useEffect, useMemo, useRef } from 'react'; // Add useRef
import domtoimage from 'dom-to-image-more';
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
import { getAllParkingAreas, getAllRecords, getExistingVehicles, getVehicleEntryPredictions } from '@/services/parking';
import { saveReport } from '@/services/reports';
import { Save } from 'lucide-react';

// --- INTERFACES ---
interface VehicleRecord {
  _id: string;
  plateNumber: string;
  datetime: string;
  areaId: string;
}

interface ProcessedRecord {
  _id: string;
  plate: string;
  action: 'ENTRY' | 'EXIT';
  date: string;
  time: string;
  entryDate: Date | null;
  exitDate: Date | null;
  durationMinutes: number | null;
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
  // --- STATE MANAGEMENT ---
  const hourlyChartRef = useRef(null);
  const entriesChartRef = useRef(null);
  const overstayChartRef = useRef(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<ProcessedRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ProcessedRecord[]>([]);
  const [existingVehicles, setExistingVehicles] = useState<VehicleRecord[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState('');
  const [entriesPeriod, setEntriesPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [overstayLimit, setOverstayLimit] = useState(60);

  // --- ML Predictor State ---
  const [predictLoading, setPredictLoading] = useState(false);
  const [rawHourlyPredictions, setRawHourlyPredictions] = useState<{ [key: string]: number }>({});

  // --- State for handling save report feedback ---
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');


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

  useEffect(() => {
    if (isAuthenticated) {
      const fetchAreas = async () => {
        try {
          const response = await getAllParkingAreas();
          if (response.success) setAreas(response.data || []);
        } catch (err) { setError(err instanceof Error ? err.message : 'An unknown error occurred.'); }
        finally { setLoading(false); }
      };
      fetchAreas();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedAreaId) {
      const fetchDashboardData = async () => {
        setDashboardLoading(true);
        setError('');
        try {
          const areaDetails = areas.find(a => a._id === selectedAreaId);
          setSelectedArea(areaDetails || null);
          const [recordsResponse, vehiclesResponse] = await Promise.all([
            getAllRecords(selectedAreaId, 1, 2000),
            getExistingVehicles(selectedAreaId, 1, 1000)
          ]);
          const rawRecords = recordsResponse.records || [];
          const entryMap = new Map<string, any>();
          const processedRecords: ProcessedRecord[] = [];
          rawRecords.filter(r => r.action === 'ENTRY').forEach(rec => {
            entryMap.set(rec.plate, rec);
          });
          rawRecords.forEach(rec => {
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
                  durationMinutes: Math.floor(durationMs / 60000)
                });
                entryMap.delete(rec.plate);
              }
            } else {
              processedRecords.push({
                ...rec,
                entryDate: dateObj,
                exitDate: null,
                durationMinutes: null
              });
            }
          });
          setAllRecords(processedRecords);
          setExistingVehicles(vehiclesResponse.vehicles || []);
        } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load dashboard data.'); }
        finally { setDashboardLoading(false); }
      };
      fetchDashboardData();
    }
  }, [selectedAreaId, areas]);

  useEffect(() => {
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
    setFilteredRecords(records);
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
      return;
    }
    setEndDate(toYYYYMMDD(today));
    if (period === 'today') {
      setStartDate(toYYYYMMDD(today));
    } else if (period === 'week') {
      const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      setStartDate(toYYYYMMDD(firstDayOfWeek));
    } else if (period === 'month') {
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toYYYYMMDD(firstDayOfMonth));
    }
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setActiveFilter('all');
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
      <div className="relative min-h-screen bg-black text-white flex items-center justify-center">
        <div className="z-10">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(50%, -50%)' }}></div>
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(-50%, 50%)' }}></div>
      <div className="relative z-10 px-4 py-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">Parking Dashboard</h1>
            <p className="text-sm text-muted mt-2">Live view of parking area activity</p>
          </header>
          {error && <div className="bg-red-900 border border-red-700 rounded-xl p-4 text-red-200">{error}</div>}
          
          {saveMessage && (
            <div className={`p-4 rounded-md text-center ${saveMessage.includes('Error') ? 'bg-red-800' : 'bg-green-800'}`}>
                {saveMessage}
            </div>
          )}
          
          <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="area-select" className="block text-lg font-semibold mb-2">Select a Parking Area</label>
                <select id="area-select" value={selectedAreaId || ''} onChange={(e) => setSelectedAreaId(e.target.value)} className="w-full bg-neutral-700 border-neutral-600 p-2.5 rounded-md text-white focus:ring-2 focus:ring-blue-500">
                  <option value="" disabled>Choose an area...</option>
                  {areas.map((area) => (<option key={area._id} value={area._id}>{area.name}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="search-bar" className="block text-lg font-semibold mb-2">Search by License Plate</label>
                <Input id="search-bar" type="text" placeholder="e.g., ABC-123" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-neutral-700 border-neutral-600 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="start-date" className="block text-sm font-medium mb-2">Start Date</label>
                  <Input type="date" id="start-date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setActiveFilter('custom'); }} className="w-full bg-neutral-700 border-neutral-600 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex-1">
                  <label htmlFor="end-date" className="block text-sm font-medium mb-2">End Date</label>
                  <Input type="date" id="end-date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setActiveFilter('custom'); }} className="w-full bg-neutral-700 border-neutral-600 rounded-md text-white focus:ring-2 focus:ring-blue-500" />
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
                  <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader><CardTitle className="text-blue-400">Current Occupancy</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">{existingVehicles.length} / {selectedArea?.capacity || 'N/A'}</CardContent>
                  </Card>
                  <Card className="bg-neutral-800 border-neutral-700">
                    <CardHeader><CardTitle className="text-green-400">Total Entries (Filtered)</CardTitle></CardHeader>
                    <CardContent className="text-3xl font-bold">{filteredRecords.filter(r => r.action === 'ENTRY').length}</CardContent>
                  </Card>
                  <Card className="bg-neutral-800 border-neutral-700">
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
                        <XAxis dataKey="period" stroke="#888888" fontSize={12} tick={{ angle: -20, textAnchor: 'end' }} height={60} />
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                      <div className="flex items-center gap-2">
                        <label htmlFor="overstay-limit" className="text-sm">Time Limit (mins):</label>
                        <Input id="overstay-limit" type="number" value={overstayLimit} onChange={(e) => setOverstayLimit(parseInt(e.target.value) || 0)} className="bg-neutral-700 border-neutral-600 w-24" />
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
                  <h3 className="text-lg font-semibold mb-4">Filtered Records ({filteredRecords.length} found)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>License Plate</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Duration (mins)</TableHead>
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