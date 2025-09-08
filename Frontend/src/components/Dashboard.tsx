import React, { useState, useEffect } from 'react';
import { 
  getVehicles, 
  getAreas, 
  getRecords, 
  getStatistics, 
  type Vehicle,
  type Area,
  type ParkingRecord,
  type Statistics,
} from '../services/backend';
import { Car, MapPin, FileText, TrendingUp, AlertCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [vehiclesData, areasData, recordsData, statsData] = await Promise.all([
          getVehicles(),
          getAreas(),
          getRecords(),
          getStatistics()
        ]);

        setVehicles(vehiclesData);
        setAreas(areasData);
        setRecords(recordsData);
        setStatistics(statsData);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white relative overflow-hidden flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white relative overflow-hidden flex items-center justify-center">
        <div 
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(50%, -50%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(-50%, 50%)' }}
        ></div>
        <div className="backdrop-blur-md bg-white/5 rounded-2xl px-6 py-3 border border-white/10 shadow-2xl text-center relative z-10">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error</h2>
          <p className="text-white">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white relative overflow-hidden">
      <div 
        className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(50%, -50%)' }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(-50%, 50%)' }}
      ></div>
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-300 mt-2">Overview of your parking management system</p>
          </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="backdrop-blur-md bg-white/10 rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Car className="h-6 w-6 text-blue-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Total Vehicles</p>
                <p className="text-2xl font-bold text-white">{statistics?.totalVehicles || 0}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/10 rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
            <div className="flex items-center">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <MapPin className="h-6 w-6 text-green-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Total Areas</p>
                <p className="text-2xl font-bold text-white">{statistics?.totalAreas || 0}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/10 rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
            <div className="flex items-center">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FileText className="h-6 w-6 text-purple-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Total Records</p>
                <p className="text-2xl font-bold text-white">{statistics?.totalRecords || 0}</p>
              </div>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/10 rounded-2xl px-6 py-4 border border-white/20 shadow-2xl">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-300" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-white/80">Total Revenue</p>
                <p className="text-2xl font-bold text-white">${statistics?.totalRevenue || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Vehicles */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">Recent Vehicles</h3>
            </div>
            <div className="p-6">
              {vehicles.length === 0 ? (
                <p className="text-white/60 text-center py-4">No vehicles found</p>
              ) : (
                <div className="space-y-4">
                  {vehicles.slice(0, 5).map((vehicle) => (
                    <div key={vehicle._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{vehicle.plateNumber}</p>
                        <p className="text-sm text-white/70">{vehicle.ownerName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        vehicle.isActive 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {vehicle.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Records */}
          <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">Recent Records</h3>
            </div>
            <div className="p-6">
              {records.length === 0 ? (
                <p className="text-white/60 text-center py-4">No records found</p>
              ) : (
                <div className="space-y-4">
                  {records.slice(0, 5).map((record) => (
                    <div key={record._id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="font-medium text-white">Vehicle: {record.vehicleId}</p>
                        <p className="text-sm text-white/70">
                          {new Date(record.entryTime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          ${record.fee || 0}
                        </p>
                        <p className="text-xs text-white/70">
                          {record.duration ? `${record.duration}h` : 'Active'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Areas Overview */}
        <div className="mt-8 backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl">
          <div className="px-6 py-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-white">Parking Areas</h3>
          </div>
          <div className="p-6">
            {areas.length === 0 ? (
              <p className="text-white/60 text-center py-4">No areas found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {areas.map((area) => (
                  <div key={area._id} className="p-4 border border-white/20 rounded-lg bg-white/5">
                    <h4 className="font-medium text-white">{area.name}</h4>
                    <p className="text-sm text-white/70 mt-1">{area.location}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-white/60">
                        Capacity: {area.capacity}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        area.isActive 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-red-500/20 text-red-300'
                      }`}>
                        {area.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
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

export default Dashboard; 