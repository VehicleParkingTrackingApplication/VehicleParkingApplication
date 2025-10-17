import React, { useState, useEffect, useCallback } from 'react';
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
import AreaCreatePopup from '@/components/AreaCreatePopup';
import { authInterceptor } from '../services/authInterceptor';
import { fetchAuthApi } from '../services/api';
import { getExistingVehicles } from '@/services/parking';
import { NavigationSidebar } from '@/components/NavigationSidebar';
import { getCurrentUser } from '@/services/backend';

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
  console.log('🔄 AreaManagement component rendering');
  
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
  const [userRole, setUserRole] = useState<string>('Admin');

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
        
        // Get user role
        try {
          const user = await getCurrentUser();
          if (user && user.role) {
            setUserRole(user.role.charAt(0).toUpperCase() + user.role.slice(1));
          }
        } catch (error) {
          console.error('Failed to fetch user role:', error);
        }
        
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
    console.log('🔗 URL update effect triggered - page:', currentPage, 'limit:', limit, 'search:', search);
    const params = new URLSearchParams();
    params.set('page', currentPage.toString());
    params.set('limit', limit.toString());
    if (search.trim()) params.set('search', search.trim());
    
    setSearchParams(params, { replace: true });
  }, [currentPage, limit, search, setSearchParams]);

  // Handle URL parameter changes only on initial load
  useEffect(() => {
    console.log('🌐 Initial URL params effect triggered');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const searchParam = searchParams.get('search');

    // Only update state on initial load if URL params exist and are different from current state
    if (pageParam && parseInt(pageParam) !== currentPage) {
      const newPage = parseInt(pageParam);
      if (newPage >= 1) {
        console.log('Initial URL param: setting page to', newPage);
        setCurrentPage(newPage);
      }
    }
    if (limitParam && parseInt(limitParam) !== limit) {
      const newLimit = parseInt(limitParam);
      if (newLimit > 0) {
        console.log('Initial URL param: setting limit to', newLimit);
        setLimit(newLimit);
      }
    }
    if (searchParam !== search) {
      const applied = searchParam || '';
      console.log('Initial URL param: setting search to', applied);
      setSearch(applied);
      setSearchInput(applied);
    }
  }, []); // Only run once on mount

  // Fetch areas data when authenticated
  useEffect(() => {
    console.log('📡 Fetch data effect triggered - auth:', isAuthenticated, 'page:', currentPage, 'limit:', limit, 'search:', search);
    if (isAuthenticated === true) {
      fetchAreasData();
    }
  }, [isAuthenticated, currentPage, limit, search]);

  const fetchAreasData = useCallback(async () => {
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
  }, [currentPage, limit, search, isAuthenticated]);



        const handleSearch = useCallback((e: React.FormEvent) => {
     e.preventDefault();
     setCurrentPage(1); // Reset to first page when searching
     setSearch(searchInput.trim()); // triggers effect to fetch
   }, [searchInput]);

   const handleClearSearch = useCallback(() => {
     setSearchInput('');
     setCurrentPage(1); // Reset to first page when clearing
     setSearch(''); // triggers effect to fetch
   }, []);

   const handlePageChange = useCallback((newPage: number) => {
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
   }, [currentPage, totalPages, loading]);

   const handleLimitChange = useCallback((newLimit: number) => {
     // Only update if the limit actually changed
     if (newLimit !== limit) {
       console.log('Changing limit from', limit, 'to', newLimit);
       setLimit(newLimit);
       setCurrentPage(1); // Reset to first page when changing limit
     }
   }, [limit]);

  // Helper function to get occupancy color
  const getOccupancyColor = (current: number, capacity: number) => {
    const percentage = (current / capacity) * 100;
    if (percentage < 50) return 'bg-blue-600';
    if (percentage >= 50 && percentage < 75) return 'bg-indigo-600';
    return 'bg-purple-500';
  };

 //show loading
  if (isAuthenticated === null) {
    return (
      <div className="relative min-h-screen text-white overflow-hidden flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, #4a0e85, #2e2359, #1a5bcc, #8e3794)'}}>
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
      <div className="relative min-h-screen text-white overflow-hidden flex items-center justify-center" style={{background: 'linear-gradient(to bottom right, #4a0e85, #2e2359, #1a5bcc, #8e3794)'}}>
        <div className="relative z-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="m
    in-h-screen text-white relative overflow-hidden" style={{background: 'linear-gradient(to bottom right, #4a0e85, #2e2359, #1a5bcc, #8e3794)'}}>
      {isAuthenticated && <NavigationSidebar userRole={userRole} />}
      
      {/* Integrated Header */}
      <div className="px-6 py-4 relative z-50" style={{paddingLeft: isAuthenticated ? '280px' : '24px'}}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between rounded-2xl px-6 py-3 shadow-2xl text-white" style={{background: 'linear-gradient(45deg, rgba(74, 14, 133, 0.3), rgba(26, 91, 204, 0.3))'}}>
            <div className="flex items-center">
              <img src="/assets/Logo.png" alt="MoniPark" className="w-20 h-20 object-contain filter brightness-0 invert" />
            </div>

            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <span className="text-white font-semibold">{userRole}</span>
                
                {/* Notification Bell */}
                <div className="relative">
                  <button className="text-white hover:text-blue-200 relative p-2">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
                  </button>
                </div>

                <button className="text-white hover:text-blue-200 px-4 py-2 rounded-lg hover:bg-white/10">
                  Account
                </button>
                
                <button className="text-white hover:text-blue-200 px-4 py-2 rounded-lg hover:bg-white/10">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative z-10 pb-10 pt-4" style={{paddingLeft: isAuthenticated ? '240px' : '16px', paddingRight: '16px'}}>
        <div className="max-w-5xl mx-auto space-y-10">
                     {/* Page Title */}
           <header className="text-center">
             <h1 className="text-4xl font-bold tracking-tight text-white">MoniPark</h1>
             <p className="text-sm font-medium text-white/80 uppercase tracking-wide mt-2">"From Parked Cars to Smart Starts"</p>
           </header>

          {error && (
            <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-4 text-indigo-100 backdrop-blur-md">
              {error}
            </div>
          )}

          {/* Summary Statistics */}
          {areas.length > 0 && (
            <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl font-bold text-blue-700 mb-1">{totalAreas}</div>
                  <div className="text-sm font-medium text-blue-600 uppercase tracking-wide">Total Areas</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 text-center border border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl font-bold text-indigo-700 mb-1">
                    {areas.reduce((sum, area) => sum + area.capacity, 0)}
                  </div>
                  <div className="text-sm font-medium text-indigo-600 uppercase tracking-wide">Total Capacity</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 text-center border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl font-bold text-purple-700 mb-1">
                    {Math.round(areas.reduce((sum, area) => sum + area.capacity, 0) / areas.length)}
                  </div>
                  <div className="text-sm font-medium text-purple-600 uppercase tracking-wide">Avg Capacity</div>
                </div>
                <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-xl p-6 text-center border border-violet-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-3xl font-bold text-violet-700 mb-1">
                    {new Set(areas.map(area => area.ftpServer)).size}
                  </div>
                  <div className="text-sm font-medium text-violet-600 uppercase tracking-wide">FTP Servers</div>
                </div>
              </div>
            </section>
          )}

          {/* Search and Pagination Controls */}
          <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                             <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                 <Input
                   type="text"
                   placeholder="Search areas..."
                   value={searchInput}
                   onChange={(e) => setSearchInput(e.target.value)}
                   className="bg-white border-gray-200 text-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all duration-200 shadow-sm"
                 />
                 <Button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white border-0 rounded-xl px-6 py-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
                   Search
                 </Button>
                 {searchInput && (
                   <Button 
                     type="button" 
                     className="bg-gray-500 hover:bg-gray-600 text-white border-0 rounded-xl px-6 py-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                     onClick={(e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       handleClearSearch();
                     }}
                   >
                     Clear
                   </Button>
                 )}
               </form>
               
               <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Per page:</span>
                 <Select 
                   value={String(limit)} 
                   onValueChange={(val) => {
                     console.log('🔽 Select onValueChange triggered with value:', val, 'current limit:', limit);
                     const newLimit = parseInt(val);
                     if (newLimit !== limit) {
                       console.log('🔽 Select: calling handleLimitChange with', newLimit);
                       handleLimitChange(newLimit);
                     } else {
                       console.log('🔽 Select: value unchanged, skipping update');
                     }
                   }}
                 >
                   <SelectTrigger className="w-[100px] bg-white border-gray-200 text-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all duration-200 shadow-sm">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="backdrop-blur-md bg-white/20 text-gray-700 border-white/30">
                     <SelectItem value="3">3</SelectItem>
                     <SelectItem value="5">5</SelectItem>
                     <SelectItem value="10">10</SelectItem>
                     <SelectItem value="20">20</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
              
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                Showing {areas.length} of {totalAreas} areas
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Previous button clicked, current page:', currentPage);
                    if (currentPage > 1 && !loading) {
                      handlePageChange(currentPage - 1);
                    }
                  }}
                  disabled={currentPage <= 1 || loading}
                  size="sm"
                  className="bg-white border-gray-200 text-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all duration-200 shadow-sm hover:bg-purple-50 disabled:opacity-50 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Previous
                </Button>
                
                <span className="flex items-center px-3 text-sm font-medium text-gray-500 uppercase tracking-wide backdrop-blur-md bg-white/20 rounded border border-white/30">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Next button clicked, current page:', currentPage, 'total pages:', totalPages);
                    if (currentPage < totalPages && !loading) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                  disabled={currentPage >= totalPages || loading}
                  size="sm"
                  className="bg-white border-gray-200 text-gray-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all duration-200 shadow-sm hover:bg-purple-50 disabled:opacity-50 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Next
                </Button>
              </div>
            )}
          </section>

          {/* Areas Table */}
          <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Parking Areas ({totalAreas} total)</h2>
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCreateOpen(true);
                }}
                className="text-white border-0 rounded-xl px-6 py-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl" style={{background: 'linear-gradient(45deg, #4a0e85, #1a5bcc)'}}
              >
                Add New Area
              </Button>
            </div>
            
            <div className="bg-gradient-to-br from-white to-indigo-50/30 backdrop-blur-md rounded-2xl border border-indigo-200/30 overflow-hidden shadow-xl">
              {areas.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-gray-700/60">
                    {search ? 'No areas found matching your search.' : 'No parking areas available.'}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-indigo-200/40 bg-gradient-to-r from-indigo-50 to-purple-50">
                      <TableHead className="text-gray-700">Index</TableHead>
                      <TableHead className="text-gray-700">Area Name</TableHead>
                      <TableHead className="text-gray-700">Location</TableHead>
                      <TableHead className="text-gray-700">Capacity</TableHead>
                      <TableHead className="text-gray-700">Occupancy</TableHead>
                      <TableHead className="text-gray-700">FTP Server</TableHead>
                      <TableHead className="text-gray-700">Created</TableHead>
                      <TableHead className="text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {areas.map((area, index) => (
                      <TableRow key={area._id} className="border-indigo-200/30">
                        <TableCell className="text-gray-700">{index + 1}</TableCell>
                        <TableCell className="text-gray-700">
                          <div className="font-semibold" title={area.name}>
                            {area.name}
                          </div>
                          {area.policy && (
                            <div className="text-xs text-gray-700/60 mt-1" title={area.policy}>
                              Policy: {area.policy}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-700" title={area.location}>
                          {area.location}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {area.capacity} spots
                        </TableCell>
                        <TableCell className="text-gray-700">
                          <div className="flex items-center space-x-2">
                            <span className={`${getOccupancyColor(area.currentVehicles || 0, area.capacity)} text-white text-xs px-2 py-1 rounded`}>
                              {area.currentVehicles || 0}/{area.capacity}
                            </span>
                            <span className="text-xs text-gray-700/60">
                              {Math.round(((area.currentVehicles || 0) / area.capacity) * 100)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          <span className="text-xs font-mono bg-white/20 px-2 py-1 rounded border border-white/30" title={area.ftpServer}>
                            {area.ftpServer}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          <div className="text-sm">
                            {new Date(area.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-700/60">
                            Updated: {new Date(area.updatedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-700">
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/area/${area._id}/records`, { 
                                  state: { areaName: area.name } 
                                });
                              }}
                              className="bg-indigo-700 hover:bg-indigo-800 text-white border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              Records
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                navigate(`/area/${area._id}/vehicles`, { 
                                  state: { areaName: area.name } 
                                });
                              }}
                              className="bg-purple-700 hover:bg-purple-800 text-white border-0 rounded-xl px-4 py-2 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              Vehicles
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </section>

          {/* Records Table */}
          <section className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Recent Parking Records</h3>
            <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-200/30 overflow-hidden shadow-lg">
            <Table>
              <TableHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <TableRow className="border-purple-200/40">
                  <TableHead className="text-gray-700">Vehicle ID</TableHead>
                  <TableHead className="text-gray-700">Area ID</TableHead>
                  <TableHead className="text-gray-700">Entry Time</TableHead>
                  <TableHead className="text-gray-700">Exit Time</TableHead>
                  <TableHead className="text-gray-700">Duration</TableHead>
                  <TableHead className="text-gray-700">Fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.slice(0, 10).map((record) => (
                  <TableRow key={record._id} className="border-purple-200/30">
                    <TableCell className="text-gray-700">{record.vehicleId}</TableCell>
                    <TableCell className="text-gray-700">{record.areaId}</TableCell>
                    <TableCell className="text-gray-700">{new Date(record.entryTime).toLocaleString()}</TableCell>
                    <TableCell className="text-gray-700">{record.exitTime ? new Date(record.exitTime).toLocaleString() : '-'}</TableCell>
                    <TableCell className="text-gray-700">{record.duration ? `${record.duration} min` : '-'}</TableCell>
                    <TableCell className="text-gray-700">{record.fee ? `$${record.fee}` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4">
            <Button 
              type="button"
              className="w-full md:w-auto" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Export areas data');
              }}
              variant="outline"
            >
              Export Areas Data
            </Button>
            <Button 
              type="button"
              variant="outline" 
              className="w-full md:w-auto" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('View area analytics');
              }}
            >
              View Analytics
            </Button>
            <Button 
              type="button"
              className="w-full md:w-auto" 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Manage FTP servers');
              }}
              variant="outline"
            >
              Manage FTP Servers
            </Button>
          </div>
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