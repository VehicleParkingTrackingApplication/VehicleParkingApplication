import React, { useState, useEffect } from 'react';
import { 
  type Vehicle,
  type Area,
} from '../services/backend';

interface ParkingRecord {
  _id: string;
  areaId: string;
  hours?: number;
  minutes?: number;
}
import { getAllParkingAreas, getAllRecords, getExistingVehicles } from '../services/parkingApi';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch areas
        const areasResponse = await getAllParkingAreas();
        if (areasResponse.success && areasResponse.data) {
          setAreas(areasResponse.data);
        }

        // Fetch data for each area
        let allVehicles: Vehicle[] = [];
        let allRecords: ParkingRecord[] = [];

        if (areasResponse.success && areasResponse.data) {
          for (const area of areasResponse.data) {
            try {
              const [vehiclesResponse, recordsResponse] = await Promise.all([
                getExistingVehicles(area._id, 1, 1000),
                getAllRecords(area._id, 1, 1000)
              ]);

              if (vehiclesResponse.success && vehiclesResponse.data) {
                allVehicles = [...allVehicles, ...vehiclesResponse.data];
              }

              if (recordsResponse.success && recordsResponse.data) {
                allRecords = [...allRecords, ...recordsResponse.data];
              }
            } catch (areaError) {
              console.error(`Error fetching data for area ${area._id}:`, areaError);
            }
          }
        }

        setVehicles(allVehicles);
        setRecords(allRecords);

      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen text-white relative overflow-hidden flex items-center justify-center"style={{background: 'linear-gradient(to bottom right, #4facfe, #f9f586)'}}>
        <div 
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(50%, -50%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(-50%, 50%)' }}
        ></div>
        <div className="backdrop-blur-md bg-white/5 rounded-2xl px-6 py-3 border border-white/10 shadow-2xl text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-white">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen text-white relative overflow-hidden flex items-center justify-center"style={{background: 'linear-gradient(to bottom right, #4facfe, #f9f586)'}}>
        <div 
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(50%, -50%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(-50%, 50%)' }}
        ></div>
        <div className="backdrop-blur-md bg-white/5 rounded-2xl px-6 py-3 border border-white/10 shadow-2xl text-center relative z-10">
          <div className="h-12 w-12 text-red-400 mx-auto mb-4">❌</div>
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden"style={{background: 'linear-gradient(to bottom right, #4facfe, #f9f586)'}}>
      <div 
        className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(50%, -50%)' }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(-50%, 50%)' }}
      ></div>
      <div className="relative z-10 px-4 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white">Areas Overview</h1>
                <p className="text-gray-300 mt-2">Comprehensive view of all parking areas</p>
              </div>
            </div>
          </div>

        {/* Areas Overview */}
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Parking Areas Overview</h3>
            <p className="text-sm text-gray-600 mt-1">Comprehensive metrics for all parking areas</p>
          </div>
          <div className="p-6">
            {areas.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No areas found</p>
            ) : (
              <div className="space-y-6">
                {/* Overall Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Areas</p>
                        <p className="text-2xl font-bold text-gray-900">{areas.length}</p>
                      </div>
                      <MapPin className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Capacity</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {areas.reduce((sum, area) => sum + (area.capacity || 0), 0)}
                        </p>
                      </div>
                      <span className="text-2xl">🚗</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Active Areas</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {areas.filter(area => area.isActive !== false).length}
                        </p>
                      </div>
                      <span className="text-2xl">✅</span>
                    </div>
                  </div>
                </div>

                {/* Individual Area Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {areas.map((area) => {
                    // Calculate area-specific metrics
                    const areaVehicles = vehicles.filter(v => v.areaId === area._id);
                    const areaRecords = records.filter(r => r.areaId === area._id);
                    const currentOccupancy = areaVehicles.length; // All vehicles in this area are currently parked
                    const occupancyRate = area.capacity > 0 ? (currentOccupancy / area.capacity * 100) : 0;

                    // Calculate average parking time
                    const totalParkingTime = areaRecords.reduce((total, record) => {
                      return total + (record.hours || 0) * 60 + (record.minutes || 0);
                    }, 0);
                    const avgParkingMinutes = areaRecords.length ? Math.round(totalParkingTime / areaRecords.length) : 0;
                    const avgParkingHours = Math.floor(avgParkingMinutes / 60);
                    const avgParkingMins = avgParkingMinutes % 60;
                    
                    return (
                      <div 
                        key={area._id} 
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                        onClick={() => navigate(`/statistics/${area._id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{area.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{area.location}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            (area.isActive !== false) 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {(area.isActive !== false) ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {/* Occupancy Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Occupancy</span>
                            <span className="text-gray-900 font-medium">{currentOccupancy}/{area.capacity}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                occupancyRate > 80 ? 'bg-red-500' : 
                                occupancyRate > 60 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{occupancyRate.toFixed(1)}% occupied</p>
                        </div>

                        {/* Area Metrics */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                            <p className="text-gray-600">Current</p>
                            <p className="text-gray-900 font-semibold">{currentOccupancy}</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                            <p className="text-gray-600">Capacity</p>
                            <p className="text-gray-900 font-semibold">{area.capacity}</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                            <p className="text-gray-600">Records</p>
                            <p className="text-gray-900 font-semibold">{areaRecords.length}</p>
                          </div>
                          <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                            <p className="text-gray-600">Available</p>
                            <p className="text-gray-900 font-semibold">{Math.max(0, area.capacity - currentOccupancy)}</p>
                          </div>
                          
                          {/* Average Parking Time - Full Width */}
                          <div className="col-span-2 text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-blue-700">Average Parking Time</p>
                            <p className="text-blue-900 font-semibold">
                              {avgParkingHours}h {avgParkingMins}m
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
    </div>
  );
};

export default Dashboard; 