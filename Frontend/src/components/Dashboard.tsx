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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your parking management system</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{statistics?.totalVehicles || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <MapPin className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Areas</p>
                <p className="text-2xl font-bold text-gray-900">{statistics?.totalAreas || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{statistics?.totalRecords || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${statistics?.totalRevenue || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Vehicles */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Vehicles</h3>
            </div>
            <div className="p-6">
              {vehicles.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No vehicles found</p>
              ) : (
                <div className="space-y-4">
                  {vehicles.slice(0, 5).map((vehicle) => (
                    <div key={vehicle._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{vehicle.plateNumber}</p>
                        <p className="text-sm text-gray-600">{vehicle.ownerName}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        vehicle.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
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
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Records</h3>
            </div>
            <div className="p-6">
              {records.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No records found</p>
              ) : (
                <div className="space-y-4">
                  {records.slice(0, 5).map((record) => (
                    <div key={record._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Vehicle: {record.vehicleId}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(record.entryTime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ${record.fee || 0}
                        </p>
                        <p className="text-xs text-gray-600">
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
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Parking Areas</h3>
          </div>
          <div className="p-6">
            {areas.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No areas found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {areas.map((area) => (
                  <div key={area._id} className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900">{area.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{area.location}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Capacity: {area.capacity}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        area.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
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
  );
};

export default Dashboard; 