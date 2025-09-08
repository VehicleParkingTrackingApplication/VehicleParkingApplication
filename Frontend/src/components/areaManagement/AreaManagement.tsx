import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import AreaCreatePopup from '@/components/areaManagement/AreaCreatePopup';
import { authInterceptor } from '../../services/authInterceptor';
import { fetchAuthApi } from '../../services/api';
import { getExistingVehicles } from '@/services/parking';

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
  vehicleId: string;
  areaId: string;
  entryTime: string;
  exitTime?: string;
  duration?: number;
  fee?: number;
  createdAt: string;
  updatedAt: string;
}

interface AreaResponse {
  success: boolean;
  data: Area[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function AreaManagement() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Pagination and search state - initialize from URL params
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? parseInt(page) : 1;
  });
  const [limit, setLimit] = useState(() => {
    const limitParam = searchParams.get('limit');
    return limitParam ? parseInt(limitParam) : 3;
  });
  // Applied search term used for fetching/URL
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  // Input box value, does not affect URL/fetch until Search is pressed
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') || '');
  const [totalPages, setTotalPages] = useState(0);
  const [totalAreas, setTotalAreas] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);

  // Verify authentication first
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check if user has a token
        if (!authInterceptor.isAuthenticated()) {
          console.log('No token found, redirecting to login');
          setIsAuthenticated(false);
          return;
        }

        console.log('Token found, proceeding with data fetch');
        setIsAuthenticated(true);
        
        // Skip /auth/me verification since endpoint doesn't exist
        // Just assume token is valid if it exists
        
      } catch (error) {
        console.error('Auth verification failed:', error);
        setIsAuthenticated(false);
      }
    };

    verifyAuth();
  }, []);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('limit', limit.toString());
    if (search.trim()) params.set('search', search.trim());
    
    setSearchParams(params, { replace: true });
  }, [currentPage, limit, search, setSearchParams]);

  // Handle URL parameter changes (when user navigates directly to URL with params)
  useEffect(() => {
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const searchParam = searchParams.get('search');

    // Only update if the URL param is different from current state
    // This prevents infinite loops
    if (pageParam && parseInt(pageParam) !== currentPage) {
      const newPage = parseInt(pageParam);
      if (newPage >= 1) {
        setCurrentPage(newPage);
      }
    }
    if (limitParam && parseInt(limitParam) !== limit) {
      const newLimit = parseInt(limitParam);
      if (newLimit > 0) {
        setLimit(newLimit);
      }
    }
    if (searchParam !== search) {
      const applied = searchParam || '';
      setSearch(applied);
      setSearchInput(applied);
    }
  }, [searchParams]); // Removed currentPage, search, limit from dependencies to prevent loops

  // Fetch areas data when authenticated
  useEffect(() => {
    if (isAuthenticated === true) {
      fetchAreasData();
    }
  }, [isAuthenticated, currentPage, limit, search]);

  const fetchAreasData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('=== Starting fetchAreasData ===');
      console.log('Current page:', currentPage);
      console.log('Limit:', limit);
      console.log('Search:', search);
      console.log('Current token:', localStorage.getItem('token'));

             // Build query parameters
       const params = new URLSearchParams();
       
       // Add page parameter (backend expects 1-based page numbers)
       if (currentPage > 0) {
         params.append('page', currentPage.toString());
       }
       
       // Add limit parameter
       if (limit > 0) {
         params.append('limit', limit.toString());
       }
       
       // Add search parameter only if it's not empty
       if (search.trim()) {
         params.append('search', search.trim());
       }

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
         
         // Fetch current vehicles count for each area
         const enrichedAreas = await Promise.all(
           areasData.data.map(async (area: Area) => {
             try {
               console.log('✅ Fetching current vehicles for area:', area._id);
               const vehiclesResponse = await getExistingVehicles(area._id, 1, 1);
               console.log('✅ Vehicles response:', vehiclesResponse);
               const currentVehicles = vehiclesResponse.success && vehiclesResponse.pagination ? vehiclesResponse.pagination.total : 0;
               return { ...area, currentVehicles };
             } catch (error) {
               console.error(`Error fetching vehicles for area ${area._id}:`, error);
               return { ...area, currentVehicles: 0 };
             }
           })
         );
         
         setAreas(enrichedAreas);
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



        const handleSearch = (e: React.FormEvent) => {
     e.preventDefault();
     setCurrentPage(1); // Reset to first page when searching
     setSearch(searchInput.trim()); // triggers effect to fetch
   };

   const handleClearSearch = () => {
     setSearchInput('');
     setCurrentPage(1); // Reset to first page when clearing
     setSearch(''); // triggers effect to fetch
   };

   const handlePageChange = (newPage: number) => {
     console.log('handlePageChange called with:', newPage);
     console.log('Current page before change:', currentPage);
     console.log('Total pages:', totalPages);
     
     // Prevent change if already loading or invalid page
     if (loading) {
       console.log('Already loading, ignoring page change');
       return;
     }
     
     // Validate the new page number
     if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
       console.log('Setting page to:', newPage);
       setCurrentPage(newPage);
     } else {
       console.log('Invalid page number or same page:', newPage);
     }
   };

   const handleLimitChange = (newLimit: number) => {
     setLimit(newLimit);
     setCurrentPage(1); // Reset to first page when changing limit
   };

  // Helper function to get occupancy color
  const getOccupancyColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage < 50) return 'bg-blue-600';
    if (percentage >= 50 && percentage < 75) return 'bg-yellow-600';
    return 'bg-red-600';
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
                   value={searchInput}
                   onChange={(e) => setSearchInput(e.target.value)}
                   className="bg-neutral-700 border-neutral-600 text-white"
                 />
                 <Button type="submit" variant="outline">
                   Search
                 </Button>
                 {searchInput && (
                   <Button 
                     type="button" 
                     variant="outline" 
                     onClick={handleClearSearch}
                   >
                     Clear
                   </Button>
                 )}
               </form>
               
               <div className="flex items-center gap-2">
                 <span className="text-sm text-gray-300">Per page:</span>
                 <Select value={String(limit)} onValueChange={(val) => handleLimitChange(parseInt(val))}>
                   <SelectTrigger className="w-[100px] bg-neutral-700 border-neutral-600 text-white">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-neutral-800 text-white border-neutral-700">
                     <SelectItem value="3">3</SelectItem>
                     <SelectItem value="5">5</SelectItem>
                     <SelectItem value="10">10</SelectItem>
                     <SelectItem value="20">20</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
              
              <div className="text-sm text-gray-300">
                Showing {areas.length} of {totalAreas} areas
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Previous button clicked, current page:', currentPage);
                    if (currentPage > 1 && !loading) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  disabled={currentPage <= 1 || loading}
                  size="sm"
                  className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600 disabled:opacity-50"
                >
                  Previous
                </Button>
                
                <span className="flex items-center px-3 text-sm text-gray-300 bg-neutral-700 rounded border border-neutral-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Next button clicked, current page:', currentPage, 'total pages:', totalPages);
                    if (currentPage < totalPages && !loading) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  disabled={currentPage >= totalPages || loading}
                  size="sm"
                  className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600 disabled:opacity-50"
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
                onClick={() => setCreateOpen(true)}
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
                      <h3 className="font-semibold text-lg text-white truncate pr-2 flex-1" title={area.name}>
                        {area.name}
                      </h3>
                      <span className={`${getOccupancyColor(area.currentVehicles || 0, area.capacity)} text-white text-xs px-2 py-1 rounded whitespace-nowrap flex-shrink-0`}>
                        {area.currentVehicles || 0}/{area.capacity} spots
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start">
                        <span className="text-gray-400 w-20 flex-shrink-0">Location:</span>
                        <span className="text-gray-300 flex-1 truncate" title={area.location}>{area.location}</span>
                      </div>
                      
                      {area.policy && (
                        <div className="flex items-start">
                          <span className="text-gray-400 w-20 flex-shrink-0">Policy:</span>
                          <span className="text-gray-300 flex-1 truncate" title={area.policy}>{area.policy}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center">
                        <span className="text-gray-400 w-20 flex-shrink-0">FTP Server:</span>
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
                    
                                         <div className="mt-4 pt-3 border-t border-neutral-600">
                       <div className="flex gap-2">
                         <Button 
                           size="sm" 
                           variant="outline" 
                           className="w-full text-xs"
                           onClick={() => navigate(`/area/${area._id}/details`, { 
                             state: { areaName: area.name } 
                           })}
                         >
                           View Details
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
        </div>
      </div>
      <AreaCreatePopup
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          setCurrentPage(1);
          fetchAreasData();
        }}
      />
    </div>
  );
}