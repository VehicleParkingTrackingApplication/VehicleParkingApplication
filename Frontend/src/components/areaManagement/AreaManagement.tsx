import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import AreaCreatePopup from '@/components/areaManagement/AreaCreatePopup';
import { authInterceptor } from '../../services/authInterceptor';
import { fetchAuthApi } from '../../services/api';
import { getExistingVehicles } from '@/services/parkingApi';

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



  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="relative min-h-screen text-white overflow-hidden flex items-center justify-center"style={{background: 'linear-gradient(to bottom right, #4facfe, #f9f586)'}}>
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
      <div className="relative min-h-screen text-white overflow-hidden flex items-center justify-center"style={{background: 'linear-gradient(to bottom right, #4facfe, #f9f586)'}}>
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
// className="min-h-screen text-white relative overflow-hidden"
// style={{background: 'linear-gradient(to bottom right,
// #4a085, 
// #22359,
// #1a5bcc,
// #8е3794) '}}>
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
        <div className="max-w-5xl mx-auto space-y-10">
                     {/* Header */}
           <header className="text-center">
             {/* <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-blue-400 bg-clip-text text-transparent">MoniPark</h1>
             <p className="text-sm text-white/70 mt-2">"From Parked Cars to Smart Starts"</p> */}
           </header>

          {error && (
            <div className="bg-red-900 border border-red-700 rounded-xl p-4 text-red-200">
              {error}
            </div>
          )}


          {/* Search and Pagination Controls */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                             <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                 <Input
                   type="text"
                   placeholder="Search areas..."
                   value={searchInput}
                   onChange={(e) => setSearchInput(e.target.value)}
                   className="bg-white border-gray-300 text-gray-900"
                 />
                 <Button type="submit" variant="outline">
                   Search
                 </Button>
                 {searchInput && (
                   <Button 
                     type="button" 
                     variant="outline" 
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
                 <span className="text-sm text-gray-300">Per page:</span>
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
                   <SelectTrigger className="w-[100px] bg-white border-gray-300 text-gray-900">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent className="bg-white text-gray-900 border-gray-300">
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
                  className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </Button>
                
                <span className="flex items-center px-3 text-sm text-gray-600 bg-white rounded border border-gray-300">
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
                  className="bg-white border-gray-300 text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            )}
          </section>

          {/* Areas Table */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Parking Areas</h2>
              <div className="text-sm text-gray-600">
                {totalAreas} total areas
              </div>
            </div>
            
            {areas.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-gray-600 text-lg mb-2">
                  {search ? 'No areas found matching your search.' : 'No parking areas available.'}
                </div>
                <div className="text-gray-500 text-sm">
                  {search ? 'Try adjusting your search terms.' : 'Create your first parking area to get started.'}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {areas.map((area, index) => (
                  <div key={area._id} className="bg-white rounded-xl border-2 border-blue-200 p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {index + 1}
                          </div>
                          <h3 className="text-xl font-semibold text-gray-900">{area.name}</h3>
                          <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            Active
                          </div>
                        </div>
                        {area.policy && (
                          <p className="text-gray-600 text-sm ml-11 mb-3">
                            <span className="font-medium">Policy:</span> {area.policy}
                          </p>
                        )}
                        <div className="ml-11 flex items-center gap-6 text-base text-gray-600">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-lg font-medium">{area.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span>{area.capacity} spots</span>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {area.ftpServer}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>Created {new Date(area.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
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
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
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
                          className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0M15 17a2 2 0 104 0" />
                          </svg>
                          Vehicles
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/area/${area._id}/details`, {
                              state: { areaName: area.name }
                            });
                          }}
                          className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Connection Setup Section */}
          <section className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Connection Setup</h2>
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCreateOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add New Area
              </Button>
            </div>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Connection setup section will be implemented here</p>
              <div className="text-sm text-gray-500">
                This area is reserved for FTP server connections, camera integrations, and other system configurations.
              </div>
            </div>
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