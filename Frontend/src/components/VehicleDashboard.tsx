import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { MoreHorizontal, X, Ban, UserPlus, Shield, Users, Clock } from 'lucide-react';
import { authInterceptor } from '../services/authInterceptor';
import { getAllParkingAreas, getAllRecords, getExistingVehicles } from '@/services/parkingApi';
import { getCurrentUser, getBlacklistByBusiness, getEmployeeVehiclesByBusiness } from '@/services/backend';
import { postAuthApi } from '@/services/api';

// --- INTERFACES ---
interface VehicleRecord {
  _id: string;
  plateNumber: string;
  datetime: string;
  areaId: string;
}

interface BlacklistEntry {
  _id: string;
  businessId: string;
  areaId?: string;
  plateNumber: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}

interface Area {
  _id: string;
  name: string;
  capacity: number;
  location: string;
}

// Represents the raw record data from the backend API
interface RawRecord {
  _id: string;
  plateNumber: string;
  datetime: string;
  areaId: string;
  entryTime?: string;
  leavingTime?: string;
}

// Processed record with additional computed fields
interface ProcessedRecord {
  _id: string;
  plate: string;
  entryDate: Date;
  leavingDate?: Date;
  duration?: number; // in minutes
  areaId: string;
}

export default function VehicleDashboard() {
  // --- URL PARAMETER MANAGEMENT ---
  const [searchParams, setSearchParams] = useSearchParams();

  // --- STATE MANAGEMENT ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<ProcessedRecord[]>([]);
  const [existingVehicles, setExistingVehicles] = useState<VehicleRecord[]>([]);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentVehiclesPage, setCurrentVehiclesPage] = useState(1);
  const [currentBlacklistPage, setCurrentBlacklistPage] = useState(1);
  const [currentEmployeePage, setCurrentEmployeePage] = useState(1);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [employeeVehicles, setEmployeeVehicles] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);
  const [vehicleHistory, setVehicleHistory] = useState<ProcessedRecord[]>([]);
  const [showVehiclePopup, setShowVehiclePopup] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [showBlacklistForm, setShowBlacklistForm] = useState(false);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const itemsPerPage = 12;

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

  // --- AUTHENTICATION CHECK ---
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = authInterceptor.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (!authenticated) {
        window.location.href = '/login';
      }
    };
    
    checkAuth();
    window.addEventListener('authChange', checkAuth);
    return () => window.removeEventListener('authChange', checkAuth);
  }, []);

  // --- FETCH AREAS AND USER DATA ---
  const fetchAreas = useCallback(async () => {
    try {
      // Get current user first to get businessId
      const user = await getCurrentUser();
      console.log('Current user data:', user);
      if (user?.businessId) {
        setBusinessId(user.businessId);
        console.log('Business ID set:', user.businessId);
        
        // Fetch blacklist data
        console.log('About to fetch blacklist for businessId:', user.businessId);
        try {
          const blacklistResponse = await getBlacklistByBusiness(user.businessId, 1, 1000);
          console.log('Blacklist response:', blacklistResponse);
          console.log('Blacklist response type:', typeof blacklistResponse);
          console.log('Blacklist response success:', blacklistResponse?.success);
          console.log('Blacklist response data:', blacklistResponse?.data);
          if (blacklistResponse?.success && blacklistResponse.data) {
            setBlacklist(blacklistResponse.data);
            console.log('Blacklist data set:', blacklistResponse.data);
          } else {
            console.log('Blacklist response failed or no data:', blacklistResponse);
          }
        } catch (blacklistError) {
          console.error('Error fetching blacklist:', blacklistError);
        }

        // Fetch employee vehicles data
        console.log('About to fetch employee vehicles for businessId:', user.businessId);
        try {
          const employeeVehiclesResponse = await getEmployeeVehiclesByBusiness(user.businessId, 1, 1000);
          console.log('Employee vehicles response:', employeeVehiclesResponse);
          if (employeeVehiclesResponse?.success && employeeVehiclesResponse.data) {
            setEmployeeVehicles(employeeVehiclesResponse.data);
            console.log('Employee vehicles data set:', employeeVehiclesResponse.data);
          } else {
            console.log('Employee vehicles response failed or no data:', employeeVehiclesResponse);
          }
        } catch (employeeVehiclesError) {
          console.error('Error fetching employee vehicles:', employeeVehiclesError);
        }
      }

      const response = await getAllParkingAreas();
      if (response && response.data) {
        setAreas(response.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
      setError('Failed to load parking areas');
      setLoading(false);
    }
  }, []);

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
          if (rec.entryTime && rec.leavingTime) {
              const entryDate = new Date(rec.entryTime);
              const leavingDate = new Date(rec.leavingTime);
              const duration = Math.round((leavingDate.getTime() - entryDate.getTime()) / (1000 * 60)); // duration in minutes
              
              processedRecords.push({
                  _id: rec._id,
                  plate: rec.plateNumber,
                  entryDate,
                  leavingDate,
                  duration,
                  areaId: rec.areaId
              });
          } else if (rec.datetime) {
              // Handle records with only datetime (legacy format)
              const entryDate = new Date(rec.datetime);
              processedRecords.push({
                  _id: rec._id,
                  plate: rec.plateNumber,
                  entryDate,
                  areaId: rec.areaId
              });
          }
      });

      setAllRecords(processedRecords);
      setExistingVehicles((vehiclesResponse && vehiclesResponse.data) || []);
      setDashboardLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
      setDashboardLoading(false); 
    }
  }, [areas]);

  useEffect(() => {
    if (selectedAreaId) {
      fetchDashboardData(selectedAreaId);
    }
  }, [selectedAreaId, fetchDashboardData]);

  // Memoized filtered records to prevent unnecessary re-renders

  // Memoized filtered current vehicles
  const filteredCurrentVehicles = useMemo(() => {
    let vehicles = existingVehicles;
    if (searchTerm) {
      vehicles = vehicles.filter(vehicle =>
        vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return vehicles;
  }, [searchTerm, existingVehicles]);

  // Memoized filtered blacklist
  const filteredBlacklist = useMemo(() => {
    console.log('Filtering blacklist, current blacklist:', blacklist);
    let blacklistItems = blacklist;
    if (searchTerm) {
      blacklistItems = blacklistItems.filter(item =>
        item.plateNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    console.log('Filtered blacklist items:', blacklistItems);
    return blacklistItems;
  }, [searchTerm, blacklist]);

  // Memoized filtered employee vehicles
  const filteredEmployeeVehicles = useMemo(() => {
    console.log('Filtering employee vehicles, current employeeVehicles:', employeeVehicles);
    let employeeItems = employeeVehicles;
    if (searchTerm) {
      employeeItems = employeeItems.filter(item =>
        item.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    console.log('Filtered employee vehicles items:', employeeItems);
    return employeeItems;
  }, [searchTerm, employeeVehicles]);

  // Pagination logic
  const totalVehiclePages = Math.ceil(filteredCurrentVehicles.length / itemsPerPage);
  const totalBlacklistPages = Math.ceil(filteredBlacklist.length / itemsPerPage);
  const totalEmployeePages = Math.ceil(filteredEmployeeVehicles.length / itemsPerPage);
  
  const vehicleStartIndex = (currentVehiclesPage - 1) * itemsPerPage;
  const vehicleEndIndex = vehicleStartIndex + itemsPerPage;
  const paginatedCurrentVehicles = filteredCurrentVehicles.slice(vehicleStartIndex, vehicleEndIndex);
  
  const blacklistStartIndex = (currentBlacklistPage - 1) * itemsPerPage;
  const blacklistEndIndex = blacklistStartIndex + itemsPerPage;
  const paginatedBlacklist = filteredBlacklist.slice(blacklistStartIndex, blacklistEndIndex);
  
  const employeeStartIndex = (currentEmployeePage - 1) * itemsPerPage;
  const employeeEndIndex = employeeStartIndex + itemsPerPage;
  const paginatedEmployeeVehicles = filteredEmployeeVehicles.slice(employeeStartIndex, employeeEndIndex);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentVehiclesPage(1);
    setCurrentBlacklistPage(1);
    setCurrentEmployeePage(1);
  }, [searchTerm]);

  // --- VEHICLE POPUP FUNCTIONS ---
  const handleVehicleClick = useCallback(async (vehicle: VehicleRecord) => {
    setSelectedVehicle(vehicle);
    setShowVehiclePopup(true);
    setShowBlacklistForm(false);
    setBlacklistReason('');
    
    // Fetch vehicle history
    try {
      const historyRecords = allRecords.filter(record => 
        record.plate.toLowerCase() === vehicle.plateNumber.toLowerCase()
      );
      setVehicleHistory(historyRecords);
    } catch (error) {
      console.error('Error fetching vehicle history:', error);
      setVehicleHistory([]);
    }
  }, [allRecords]);

  const handleAddToBlacklist = async () => {
    if (!selectedVehicle || !businessId || !blacklistReason.trim()) {
      alert('Please provide a reason for blacklisting');
      return;
    }

    console.log('Adding to blacklist:', {
      plateNumber: selectedVehicle.plateNumber,
      businessId: businessId,
      reason: blacklistReason.trim()
    });

    try {
      const requestBody = {
        plateNumber: selectedVehicle.plateNumber,
        businessId: businessId,
        reason: blacklistReason.trim()
      };
      
      console.log('Request body:', requestBody);
      
      const response = await postAuthApi('blacklist', undefined, JSON.stringify(requestBody));

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        
        // Refresh blacklist data
        const blacklistResponse = await getBlacklistByBusiness(businessId, 1, 1000);
        if (blacklistResponse?.success && blacklistResponse.data) {
          setBlacklist(blacklistResponse.data);
        }
        
        setShowBlacklistForm(false);
        setBlacklistReason('');
        alert('Vehicle added to blacklist successfully');
      } else {
        const errorData = await response.json();
        console.error('Blacklist API error:', errorData);
        console.error('Response status:', response.status);
        alert(`Failed to add vehicle to blacklist: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding to blacklist:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Error adding vehicle to blacklist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleAddToEmployee = async () => {
    if (!selectedVehicle || !employeeName.trim()) {
      alert('Please fill in the employee name');
      return;
    }

    try {
      const requestBody = {
        plateNumber: selectedVehicle.plateNumber,
        owner: employeeName.trim(),
        areaId: selectedAreaId
      };
      
      const response = await postAuthApi('employee-vehicle/add', undefined, JSON.stringify(requestBody));

      if (response.ok) {
        setShowEmployeeForm(false);
        setEmployeeName('');
        alert('Vehicle added to employee vehicles successfully');
      } else {
        const errorData = await response.json();
        alert(`Failed to add vehicle to employee vehicles: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding vehicle to employee vehicles:', error);
      alert(`Error adding vehicle to employee vehicles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const closeVehiclePopup = () => {
    setShowVehiclePopup(false);
    setSelectedVehicle(null);
    setVehicleHistory([]);
    setShowBlacklistForm(false);
    setBlacklistReason('');
    setShowEmployeeForm(false);
    setEmployeeName('');
  };

  // Initialize URL parameters
  useEffect(() => {
    const areaParam = searchParams.get('area');
    const searchParam = searchParams.get('search');
    
    if (areaParam && areaParam !== selectedAreaId) {
      setSelectedAreaId(areaParam);
    }
    if (searchParam && searchParam !== searchTerm) {
      setSearchTerm(searchParam);
    }
  }, [searchParams, selectedAreaId, searchTerm]);

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen text-white relative overflow-hidden flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)'}}>
        <div 
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(50%, -50%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(-50%, 50%)' }}
        ></div>
        <div className="backdrop-blur-md bg-white/5 rounded-2xl px-6 py-3 border border-white/10 shadow-2xl text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading Vehicle Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-white relative overflow-hidden flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)'}}>
        <div 
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(50%, -50%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(-50%, 50%)' }}
        ></div>
        <div className="backdrop-blur-md bg-white/5 rounded-2xl px-6 py-3 border border-white/10 shadow-2xl text-center relative z-10">
          <p className="text-red-200 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-white/20 text-white rounded-md hover:bg-white/30 border border-white/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden" style={{background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)'}}>
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(50%, -50%)' }}></div>
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20" style={{ transform: 'translate(-50%, 50%)' }}></div>
      <div className="relative z-10 px-4 py-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="text-center mb-8 mt-5">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg text-blue-600">Vehicle Management</h1>
        </header>
        {/* Controls Section */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="area-select" className="block text-lg font-semibold mb-2 text-gray-900">Select a Parking Area</label>
              <select 
                id="area-select" 
                value={selectedAreaId || ''} 
                onChange={(e) => {
                  setSelectedAreaId(e.target.value);
                  updateURLParams({ area: e.target.value || null });
                }} 
                className="w-full bg-white border-2 border-gray-300 p-2.5 rounded-md text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              >
                <option value="" disabled className="text-gray-500 bg-white">Choose an area...</option>
                {areas.map((area) => (
                  <option key={area._id} value={area._id} className="text-gray-900 bg-white">
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="search-bar" className="block text-lg font-semibold mb-2 text-gray-900">Search by License Plate</label>
              <Input 
                id="search-bar" 
                type="text" 
                placeholder="e.g., ABC-123" 
                value={searchTerm} 
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  updateURLParams({ search: e.target.value || null });
                }} 
                className="bg-white border-gray-300 text-gray-900" 
              />
            </div>
          </div>
        </section>
        
        {selectedAreaId && (
          dashboardLoading ? (
            <div className="backdrop-blur-md bg-white/5 rounded-2xl border border-white/10 shadow-2xl text-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading area data...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Current Vehicles and Blacklist Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Vehicles */}
                <Card className="bg-white border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-600" />
                      Current Vehicles in {selectedArea?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {filteredCurrentVehicles.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table className="border-collapse">
                          <TableHeader>
                            <TableRow className="border-b border-gray-200">
                              <TableHead className="text-gray-900 border-r border-gray-200">License Plate</TableHead>
                              <TableHead className="text-gray-900 border-r border-gray-200">Entry Time</TableHead>
                              <TableHead className="text-gray-900 border-r border-gray-200">Duration</TableHead>
                              <TableHead className="text-gray-900 w-12">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedCurrentVehicles.map((vehicle) => {
                              const entryTime = new Date(vehicle.datetime);
                              const duration = Math.round((Date.now() - entryTime.getTime()) / (1000 * 60));
                              return (
                                <TableRow key={vehicle._id} className="border-b border-gray-200">
                                  <TableCell className="font-medium text-gray-900 border-r border-gray-200">{vehicle.plateNumber}</TableCell>
                                  <TableCell className="text-gray-900 border-r border-gray-200">{entryTime.toLocaleString()}</TableCell>
                                  <TableCell className="text-gray-900 border-r border-gray-200">{duration} minutes</TableCell>
                                  <TableCell className="text-gray-900">
                                    <button
                                      onClick={() => handleVehicleClick(vehicle)}
                                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                                      title="View vehicle details and history"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                        {totalVehiclePages > 1 && (
                          <div className="flex justify-center items-center space-x-2 mt-4">
                            <button
                              onClick={() => setCurrentVehiclesPage(Math.max(1, currentVehiclesPage - 1))}
                              disabled={currentVehiclesPage === 1}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                            >
                              Previous
                            </button>
                            <span className="text-gray-700">
                              Page {currentVehiclesPage} of {totalVehiclePages}
                            </span>
                            <button
                              onClick={() => setCurrentVehiclesPage(Math.min(totalVehiclePages, currentVehiclesPage + 1))}
                              disabled={currentVehiclesPage === totalVehiclePages}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No vehicles currently in this area</p>
                    )}
                  </CardContent>
                </Card>

                {/* Blacklist and Employee Vehicles - Stacked */}
                <div className="space-y-6">
                  {/* Blacklist Vehicles */}
                  <Card className="bg-white border-gray-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        Blacklisted Vehicles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        console.log('Rendering blacklist section, filteredBlacklist:', filteredBlacklist, 'length:', filteredBlacklist.length);
                        return null;
                      })()}
                      {filteredBlacklist.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table className="border-collapse">
                            <TableHeader>
                              <TableRow className="border-b border-gray-200">
                                <TableHead className="text-gray-900 border-r border-gray-200">License Plate</TableHead>
                                <TableHead className="text-gray-900 border-r border-gray-200">Reason</TableHead>
                                <TableHead className="text-gray-900">Date Added</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedBlacklist.map((item) => (
                                <TableRow key={item._id} className="border-b border-gray-200">
                                  <TableCell className="font-medium text-gray-900 border-r border-gray-200">{item.plateNumber}</TableCell>
                                  <TableCell className="text-gray-900 border-r border-gray-200">{item.reason}</TableCell>
                                  <TableCell className="text-gray-900">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {totalBlacklistPages > 1 && (
                            <div className="flex justify-center items-center space-x-2 mt-4">
                              <button
                                onClick={() => setCurrentBlacklistPage(Math.max(1, currentBlacklistPage - 1))}
                                disabled={currentBlacklistPage === 1}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                              >
                                Previous
                              </button>
                              <span className="text-gray-700">
                                Page {currentBlacklistPage} of {totalBlacklistPages}
                              </span>
                              <button
                                onClick={() => setCurrentBlacklistPage(Math.min(totalBlacklistPages, currentBlacklistPage + 1))}
                                disabled={currentBlacklistPage === totalBlacklistPages}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-500 text-center py-4">No blacklisted vehicles found</p>
                          <p className="text-xs text-gray-400 text-center">Debug: Total blacklist items: {blacklist.length}, Filtered: {filteredBlacklist.length}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Employee Vehicles */}
                  <Card className="bg-white border-gray-200 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="h-5 w-5 text-blue-600" />
                        Employee Vehicles
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        console.log('Rendering employee vehicles section, filteredEmployeeVehicles:', filteredEmployeeVehicles, 'length:', filteredEmployeeVehicles.length);
                        if (filteredEmployeeVehicles.length > 0) {
                          console.log('First employee vehicle data:', filteredEmployeeVehicles[0]);
                        }
                        return null;
                      })()}
                      {filteredEmployeeVehicles.length > 0 ? (
                        <div className="overflow-x-auto">
                          <Table className="border-collapse">
                            <TableHeader>
                              <TableRow className="border-b border-gray-200">
                                <TableHead className="text-gray-900 border-r border-gray-200">License Plate</TableHead>
                                <TableHead className="text-gray-900 border-r border-gray-200">Owner</TableHead>
                                <TableHead className="text-gray-900">Date Added</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedEmployeeVehicles.map((item) => (
                                <TableRow key={item._id} className="border-b border-gray-200">
                                  <TableCell className="font-medium text-gray-900 border-r border-gray-200">{item.plateNumber}</TableCell>
                                  <TableCell className="text-gray-900 border-r border-gray-200">{item.owner}</TableCell>
                                  <TableCell className="text-gray-900">{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {totalEmployeePages > 1 && (
                            <div className="flex justify-center items-center space-x-2 mt-4">
                              <button
                                onClick={() => setCurrentEmployeePage(Math.max(1, currentEmployeePage - 1))}
                                disabled={currentEmployeePage === 1}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                              >
                                Previous
                              </button>
                              <span className="text-gray-700">
                                Page {currentEmployeePage} of {totalEmployeePages}
                              </span>
                              <button
                                onClick={() => setCurrentEmployeePage(Math.min(totalEmployeePages, currentEmployeePage + 1))}
                                disabled={currentEmployeePage === totalEmployeePages}
                                className="px-3 py-1 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-500 text-center py-4">No employee vehicles found</p>
                          <p className="text-xs text-gray-400 text-center">Debug: Total employee vehicles: {employeeVehicles.length}, Filtered: {filteredEmployeeVehicles.length}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

            </div>
          )
        )}

        {!selectedAreaId && (
          <Card className="bg-white border-gray-200 shadow-lg">
            <CardContent className="text-center py-12">
              <p className="text-gray-500 text-lg">Please select a parking area to view vehicle information</p>
            </CardContent>
          </Card>
        )}

        {/* Vehicle Details Popup */}
        {showVehiclePopup && selectedVehicle && (
          <div className="fixed inset-0 backdrop-blur-md bg-white/20 flex items-center justify-center z-50 p-4" style={{ left: '256px', top: '0' }}>
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[100vh] overflow-y-auto shadow-2xl border border-white/30 text-gray-900">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Vehicle Details - {selectedVehicle.plateNumber}
                  </h2>
                  <button
                    onClick={closeVehiclePopup}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Vehicle Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">Current Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-gray-900">
                        <p><span className="font-medium">License Plate:</span> {selectedVehicle.plateNumber}</p>
                        <p><span className="font-medium">Entry Time:</span> {new Date(selectedVehicle.datetime).toLocaleString()}</p>
                        <p><span className="font-medium">Duration:</span> {Math.round((Date.now() - new Date(selectedVehicle.datetime).getTime()) / (1000 * 60))} minutes</p>
                        <p><span className="font-medium">Area:</span> {selectedArea?.name}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {!showBlacklistForm && !showEmployeeForm ? (
                          <div className="space-y-3">
                            <Button
                              onClick={() => setShowBlacklistForm(true)}
                              className="w-full bg-red-600 hover:bg-red-700 text-white"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Add to Blacklist
                            </Button>
                            <Button
                              onClick={() => setShowEmployeeForm(true)}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add to Employee Vehicles
                            </Button>
                          </div>
                        ) : showBlacklistForm ? (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Reason for Blacklisting
                              </label>
                              <textarea
                                value={blacklistReason}
                                onChange={(e) => setBlacklistReason(e.target.value)}
                                placeholder="Enter reason for blacklisting this vehicle..."
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                rows={3}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={handleAddToBlacklist}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                              >
                                Confirm Blacklist
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowBlacklistForm(false);
                                  setBlacklistReason('');
                                }}
                                variant="outline"
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Employee/Owner Name
                              </label>
                              <input
                                type="text"
                                value={employeeName}
                                onChange={(e) => setEmployeeName(e.target.value)}
                                placeholder="Enter employee/owner name..."
                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={handleAddToEmployee}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Add to Employee Vehicles
                              </Button>
                              <Button
                                onClick={() => {
                                  setShowEmployeeForm(false);
                                  setEmployeeName('');
                                }}
                                variant="outline"
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Vehicle History */}
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Vehicle History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vehicleHistory.length > 0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-gray-900">Entry Time</TableHead>
                              <TableHead className="text-gray-900">Exit Time</TableHead>
                              <TableHead className="text-gray-900">Duration</TableHead>
                              <TableHead className="text-gray-900">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {vehicleHistory.map((record, index) => (
                              <TableRow key={index}>
                                <TableCell className="text-gray-900">
                                  {record.entryDate.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-gray-900">
                                  {record.leavingDate ? record.leavingDate.toLocaleString() : 'Still parked'}
                                </TableCell>
                                <TableCell className="text-gray-900">
                                  {record.duration ? `${record.duration} minutes` : 'N/A'}
                                </TableCell>
                                <TableCell className="text-gray-900">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    record.leavingDate 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {record.leavingDate ? 'Completed' : 'Active'}
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No history found for this vehicle</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
