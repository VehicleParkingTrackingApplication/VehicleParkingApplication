import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { authInterceptor } from '../../services/authInterceptor';
import { fetchAuthApi } from '../../services/api';
import { getExistingVehicles, getAllRecords, triggerFtpFetch } from '@/services/parkingApi';
import { FtpServerEditPopup } from './FtpServerEditPopup';

interface Area {
  _id: string;
  businessId: string;
  name: string;
  capacity: number;
  location: string;
  policy: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  ftpServer: string;
  savedTimestamp: string;
  currentVehicles?: number;
}

interface ParkingRecord {
  _id: string;
  time: string;
  plateNumber: string;
  status: string;
  image: number;
  duration: number;
  date: string;
  country: string;
}

interface Vehicle {
  _id: string;
  vehicleId: string;
  areaId: string;
  entryTime: string;
  createdAt: string;
  updatedAt: string;
}

export default function AreaDetail() {
  const [area, setArea] = useState<Area | null>(null);
  const [recentRecords, setRecentRecords] = useState<ParkingRecord[]>([]);
  const [recentVehicles, setRecentVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showFtpEditPopup, setShowFtpEditPopup] = useState(false);

  const navigate = useNavigate();
  const { areaId } = useParams<{ areaId: string }>();
  const location = useLocation();
  const areaName = location.state?.areaName || 'Unknown Area';

  // Verify authentication first
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        if (!authInterceptor.isAuthenticated()) {
          console.log('No token found, redirecting to login');
          setIsAuthenticated(false);
          return;
        }

        console.log('Token found, proceeding with data fetch');
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
      }
    };

    verifyAuth();
  }, []);

  // Fetch area details when authenticated
  useEffect(() => {
    if (isAuthenticated === true && areaId) {
      fetchAreaDetails();
    }
  }, [isAuthenticated, areaId]);

  const fetchAreaDetails = async () => {
    try {
      setLoading(true);
      setError('');

      // console.log('=== Starting fetchAreaDetails ===');
      // console.log('Area ID:', areaId);

      // Fetch area details
      const areaResponse = await fetchAuthApi(`parking/area/${areaId!}/details`);
      if (areaResponse.ok) {
        const areaData: { data: Area } = await areaResponse.json();
        setArea(areaData.data);

        // Fetch current vehicles count
        try {
          const vehiclesResponse = await getExistingVehicles(areaId!, 1, 10);
          let currentVehicles = 0
          if (vehiclesResponse.success && vehiclesResponse.data) {
            setRecentVehicles(vehiclesResponse.data);
            currentVehicles = vehiclesResponse.pagination.total;
          }
          setArea(prev => prev ? { ...prev, currentVehicles } : null);
        } catch (error) {
          console.error('Error fetching current vehicles: ', error);
        }

        // Fetch recent records (10 most recent)
        try {
          const recordsResponse = await getAllRecords(areaId!, 1, 10);
          console.log("record response :", recordsResponse, recordsResponse.ok)
          if (recordsResponse.success && recordsResponse.data) {
            console.log("CHECK CHECK CHECK", recordsResponse.data)
            setRecentRecords(recordsResponse.data);
            console.log("Setting recent records to:", recordsResponse.data)
          }
        } catch (error) {
          console.error('Error fetching recent records:', error);
        }

      } else {
        const errorText = await areaResponse.text();
        console.error('Area API error:', areaResponse.status, errorText);
        throw new Error(`Failed to fetch area: ${areaResponse.status} ${errorText}`);
      }

      console.log('=== fetchAreaDetails completed successfully ===');

    } catch (err) {
      console.error('=== Error in fetchAreaDetails ===');
      console.error('Error details:', err);
      setError(`Failed to load area details: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      if (!authInterceptor.isAuthenticated()) {
        console.log('No valid token, redirecting to login');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get occupancy color
  const getOccupancyColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage < 50) return 'bg-blue-600';
    if (percentage >= 50 && percentage < 75) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const handleEditArea = () => {
    console.log('Edit area clicked');
  };

  const handleEditFtpServer = () => {
    setShowFtpEditPopup(true);
  };

  const handleTriggerFtp = async () => {
    try {
      if (!areaId) return;
      // Basic check: must have some ftpServer configured
      if (!area?.ftpServer || String(area.ftpServer).trim().length === 0) {
        alert('Please configure FTP server first.');
        return;
      }
      setLoading(true);
      await triggerFtpFetch(areaId);
      // Refresh details after triggering
      await fetchAreaDetails();
      alert('FTP fetch triggered successfully. Data refresh started.');
    } catch (err) {
      console.error('Failed to trigger FTP fetch:', err);
      alert('Failed to trigger FTP fetch. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFtpServerSuccess = () => {
    // Refresh area details to get updated FTP server info
    if (areaId) {
      fetchAreaDetails();
    }
  };

  const handleViewAllRecords = () => {
    navigate(`/area/${areaId!}/records`, { 
      state: { areaName: area?.name || areaName } 
    });
  };

  const handleViewAllVehicles = () => {
    navigate(`/area/${areaId!}/vehicles`, { 
      state: { areaName: area?.name || areaName } 
    });
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="relative min-h-screen style={{background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)'}} text-white overflow-hidden flex items-center justify-center">
        <div 
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(50%, -50%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(-50%, 50%)' }}
        ></div>
        <div className="relative z-10">Verifying authentication...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (isAuthenticated === false) {
    window.location.href = '/login';
    return null;
  }

  if (loading) {
    return (
      <div className="relative min-h-screen style={{background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)'}} text-white overflow-hidden flex items-center justify-center">
        <div 
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(50%, -50%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(-50%, 50%)' }}
        ></div>
        <div className="relative z-10">Loading area details...</div>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="relative min-h-screen style={{background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)'}} text-white overflow-hidden flex items-center justify-center">
        <div 
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(50%, -50%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(-50%, 50%)' }}
        ></div>
        <div className="relative z-10">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Area Not Found</h2>
            <Button onClick={() => navigate('/area-management')}>
              Back to Area Management
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen style={{background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)'}} text-white overflow-hidden">
      <div 
        className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(50%, -50%)' }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(-50%, 50%)' }}
      ></div>
      
      <div className="relative z-10 px-4 py-4">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <header className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">MoniPark</h1>
            <p className="text-sm text-muted mt-2">"From Parked Cars to Smart Starts"</p>
          </header>

          {/* Back Button */}
          <div className="flex justify-start">
            <Button 
              variant="outline" 
              onClick={() => navigate('/area-management')}
              className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600"
            >
              ← Back to Area Management
            </Button>
          </div>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-xl p-4 text-red-200">
              {error}
            </div>
          )}

          {/* Area Information */}
          <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">{area.name}</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={handleEditArea}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Edit Area Info
                </Button>
                <Button 
                  onClick={handleEditFtpServer}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Change FTP Server
                </Button>
                <Button
                  onClick={handleTriggerFtp}
                  variant="outline"
                  className="border-yellow-500 text-yellow-300 hover:bg-yellow-600 hover:text-white"
                >
                  Trigger FTP Server
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="bg-neutral-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-400 w-20 flex-shrink-0">Location:</span>
                      <span className="text-gray-300 flex-1" title={area.location}>{area.location}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-400 w-20 flex-shrink-0">Capacity:</span>
                      <span className="text-gray-300 flex-1">{area.capacity} spots</span>
                    </div>
                    {area.policy && (
                      <div className="flex items-start">
                        <span className="text-gray-400 w-20 flex-shrink-0">Policy:</span>
                        <span className="text-gray-300 flex-1" title={area.policy}>{area.policy}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Status */}
              <div className="space-y-4">
                <div className="bg-neutral-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Current Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-400 w-20 flex-shrink-0">Occupied:</span>
                      <span className="text-gray-300 flex-1">{area.currentVehicles || 0} spots</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-400 w-20 flex-shrink-0">Available:</span>
                      <span className="text-gray-300 flex-1">{area.capacity - (area.currentVehicles || 0)} spots</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-400 w-20 flex-shrink-0">Status:</span>
                      <span className={`${getOccupancyColor(area.currentVehicles || 0, area.capacity)} text-white text-xs px-2 py-1 rounded`}>
                        {Math.round(((area.currentVehicles || 0) / area.capacity) * 100)}% Full
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* FTP Server Info */}
              <div className="space-y-4">
                <div className="bg-neutral-700 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">FTP Server</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <span className="text-gray-400 w-20 flex-shrink-0">Server:</span>
                      <span className="text-gray-300 text-xs font-mono bg-neutral-600 px-2 py-1 rounded truncate flex-1" title={area.ftpServer}>
                        {area.ftpServer}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-400 w-20 flex-shrink-0">Created:</span>
                      <span className="text-gray-300 flex-1">
                        {new Date(area.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-400 w-20 flex-shrink-0">Updated:</span>
                      <span className="text-gray-300 flex-1">
                        {new Date(area.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Vehicles Table */}
          <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Existing Vehicles (Last 10)</h3>
              <Button 
                onClick={handleViewAllVehicles}
                variant="outline"
                className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600"
              >
                View All Vehicles
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>History</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVehicles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-400 py-8">
                      No vehicles currently in this area
                    </TableCell>
                  </TableRow>
                ) : (
                  recentVehicles.map((vehicle) => (
                    <TableRow key={vehicle._id}>
                      <TableCell>{vehicle._id}</TableCell>
                      <TableCell>{new Date(vehicle.entryTime).toLocaleString()}</TableCell>
                      <TableCell>
                        {Math.round((Date.now() - new Date(vehicle.entryTime).getTime()) / (1000 * 60))} min
                      </TableCell>
                      <TableCell>
                        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          New
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>

          {/* Recent Records Table */}
          <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Parking Recordss</h3>
              <Button 
                onClick={handleViewAllRecords}
                variant="outline"
                className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600"
              >
                View All Records
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Exit Time</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                      No parking records found for this area
                    </TableCell>
                  </TableRow>
                ) : (
                  recentRecords.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>{record.plateNumber}</TableCell>
                      <TableCell>{record.status}</TableCell>
                      <TableCell>{record.date} {record.time}</TableCell>
                      <TableCell>{record.status === 'EXIT' ? `${record.date} ${record.time}` : '-'}</TableCell>
                      <TableCell>{record.duration ? `${record.duration} min` : '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>
        </div>
      </div>

      {/* FTP Server Edit Popup */}
      <FtpServerEditPopup
        isOpen={showFtpEditPopup}
        onClose={() => setShowFtpEditPopup(false)}
        areaId={areaId!}
        currentFtpServer={area?.ftpServer}
        onSuccess={handleFtpServerSuccess}
      />
    </div>
  );
}
