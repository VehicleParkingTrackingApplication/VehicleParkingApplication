import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  getAllParkingAreas,
  getRecentRecords,
} from '@/services/parking';

interface ParkingRecord {
  plate: string;
  action: 'ENTRY' | 'EXIT';
  time: string;
  date: string;
}


interface ParkingArea {
  _id: string;
  name: string;
  records: ParkingRecord[];
}

export default function AreaManagement() {
  const [areas, setAreas] = useState<ParkingArea[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getAllParkingAreas();
        console.log('✅ API returned:', response);
        // Check if the response is successful and has data
        if (response.success && response.data) {
          const enriched = await Promise.all(
            response.data.map(async (area: ParkingArea) => {
              try {
                console.log('✅ Area:', area._id);
                const recordsResponse = await getRecentRecords(area._id);
                console.log('✅ Records response:', recordsResponse);
                // Extract the data array from the response
                const records = recordsResponse.success && recordsResponse.data ? recordsResponse.data : [];
                return { ...area, records };
              } catch (error) {
                console.error(`Error fetching records for area ${area._id}:`, error);
                return { ...area, records: [] };
              }
            })
          );
          setAreas(enriched);
        } else {
          console.error('No areas found or API error:', response);
          setAreas([]);
        }

      } catch (error) {
        console.error('Error fetching areas:', error);
      }
    };
    fetchData();
    console.log('✅ Areas:', areas);
  }, []);

  // Fetch areas data when authenticated
  useEffect(() => {
    if (isAuthenticated === true) {
      fetchAreasData();
    }
  }, [isAuthenticated, currentPage, search]);

  const fetchAreasData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('=== Starting fetchAreasData ===');
      console.log('Current token:', localStorage.getItem('token'));

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search: search
      });

      console.log('Fetching areas with params:', params.toString());
      console.log('API URL will be: /api/parking/area?' + params.toString());

      // Fetch areas with pagination and search
      const areasResponse = await fetchAuthApi(`parking/area?${params}`);
      
      console.log('Areas response status:', areasResponse.status);
      console.log('Areas response headers:', Object.fromEntries(areasResponse.headers.entries()));
      
      if (areasResponse.ok) {
        const areasData: AreaResponse = await areasResponse.json();
        console.log('Areas data received:', areasData);
        console.log('Number of areas:', areasData.data?.length || 0);
        setAreas(areasData.data);
        setTotalPages(areasData.pagination.totalPages);
        setTotalAreas(areasData.pagination.total);
      } else {
        const errorText = await areasResponse.text();
        console.error('Areas API error:', areasResponse.status, errorText);
        console.error('Error response headers:', Object.fromEntries(areasResponse.headers.entries()));
        throw new Error(`Failed to fetch areas: ${areasResponse.status} ${errorText}`);
      }

      // Fetch records (keeping existing functionality)
      console.log('Fetching records...');
      const recordsResponse = await fetchAuthApi('records');
      console.log('Records response status:', recordsResponse.status);
      
      if (recordsResponse.ok) {
        const recordsData: ParkingRecord[] = await recordsResponse.json();
        console.log('Records data received:', recordsData);
        setRecords(recordsData);
      } else {
        console.warn('Records API failed:', recordsResponse.status);
      }

      console.log('=== fetchAreasData completed successfully ===');

    } catch (err) {
      console.error('=== Error in fetchAreasData ===');
      console.error('Error details:', err);
      console.error('Error type:', typeof err);
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown error');
      setError(`Failed to load data: ${err instanceof Error ? err.message : 'Unknown error'}`);
      
      // If authentication fails after refresh, redirect to login
      if (!authInterceptor.isAuthenticated()) {
        console.log('No valid token, redirecting to login');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authInterceptor.logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout API fails, still redirect to login
      window.location.href = '/login';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
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
      <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
        <div 
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(50%, -50%)' }}
        ></div>
        <div 
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
          style={{ transform: 'translate(-50%, 50%)' }}
        ></div>
        <div className="relative z-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <div 
        className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(50%, -50%)' }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(-50%, 50%)' }}
      ></div>
      
      <div className="relative z-10 px-4 py-10">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Header */}
          <header className="text-center">
            <h1 className="text-4xl font-bold tracking-tight">MoniPark</h1>
            <p className="text-sm text-muted mt-2">"From Parked Cars to Smart Starts"</p>
            <Button 
              onClick={handleLogout}
              className="mt-4"
              variant="outline"
            >
              Logout
            </Button>
          </header>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-xl p-4 text-red-200">
              {error}
            </div>
          )}

          {/* Summary Statistics */}
          {areas.length > 0 && (
            <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-neutral-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{totalAreas}</div>
                  <div className="text-sm text-gray-400">Total Areas</div>
                </div>
                <div className="bg-neutral-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {areas.reduce((sum, area) => sum + area.capacity, 0)}
                  </div>
                  <div className="text-sm text-gray-400">Total Capacity</div>
                </div>
                <div className="bg-neutral-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {Math.round(areas.reduce((sum, area) => sum + area.capacity, 0) / areas.length)}
                  </div>
                  <div className="text-sm text-gray-400">Avg Capacity</div>
                </div>
                <div className="bg-neutral-700 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {new Set(areas.map(area => area.ftpServer)).size}
                  </div>
                  <div className="text-sm text-gray-400">FTP Servers</div>
                </div>
              </div>
            </section>
          )}

          {/* Search and Pagination Controls */}
          <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                <Input
                  type="text"
                  placeholder="Search areas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-neutral-700 border-neutral-600 text-white"
                />
                <Button type="submit" variant="outline">
                  Search
                </Button>
              </form>
              
              <div className="text-sm text-gray-300">
                Showing {areas.length} of {totalAreas} areas
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  size="sm"
                >
                  Previous
                </Button>
                
                <span className="flex items-center px-3 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </section>

          {/* Areas Info */}
          <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Parking Areas ({totalAreas} total)</h2>
              <Button 
                onClick={() => console.log('Add new area')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add New Area
              </Button>
            </div>
            {areas.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                {search ? 'No areas found matching your search.' : 'No parking areas available.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {areas.map((area) => (
                  <div key={area._id} className="bg-neutral-700 rounded-lg p-4 border border-neutral-600">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-lg text-white">{area.name}</h3>
                      <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        {area.capacity} spots
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <span className="text-gray-400 w-20">Location:</span>
                        <span className="text-gray-300 flex-1">{area.location}</span>
                      </div>
                      
                      {area.policy && (
                        <div className="flex items-start">
                          <span className="text-gray-400 w-20">Policy:</span>
                          <span className="text-gray-300 flex-1">{area.policy}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <span className="text-gray-400 w-20">FTP Server:</span>
                        <span className="text-gray-300 text-xs font-mono bg-neutral-600 px-2 py-1 rounded">
                          {area.ftpServer}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-gray-400 w-20">Created:</span>
                        <span className="text-gray-300">
                          {new Date(area.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className="text-gray-400 w-20">Updated:</span>
                        <span className="text-gray-300">
                          {new Date(area.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-neutral-600">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs"
                          onClick={() => console.log('View details for:', area._id)}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 text-xs"
                          onClick={() => console.log('Edit area:', area._id)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Records Table */}
          <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-4">Recent Parking Records</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle ID</TableHead>
                  <TableHead>Area ID</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Exit Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 10).map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{record.vehicleId}</TableCell>
                    <TableCell>{record.areaId}</TableCell>
                    <TableCell>{new Date(record.entryTime).toLocaleString()}</TableCell>
                    <TableCell>{record.exitTime ? new Date(record.exitTime).toLocaleString() : '-'}</TableCell>
                    <TableCell>{record.duration ? `${record.duration} min` : '-'}</TableCell>
                    <TableCell>{record.fee ? `$${record.fee}` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4">
            <Button 
              className="w-full md:w-auto" 
              onClick={() => console.log('Export areas data')}
              variant="outline"
            >
              Export Areas Data
            </Button>
            <Button 
              variant="outline" 
              className="w-full md:w-auto" 
              onClick={() => console.log('View area analytics')}
            >
              View Analytics
            </Button>
            <Button 
              className="w-full md:w-auto" 
              onClick={() => console.log('Manage FTP servers')}
              variant="outline"
            >
              Manage FTP Servers
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
