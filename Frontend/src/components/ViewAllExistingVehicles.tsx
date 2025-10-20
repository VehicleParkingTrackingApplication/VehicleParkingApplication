import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getExistingVehicles } from '@/services/parkingApi';
import { useState, useEffect } from 'react';

interface VehicleRecord {
  _id: string;
  plateNumber: string;
  country: string;
  image: string;
  datetime: string;
  currentDuration?: {
    totalMinutes: number;
    hours: number;
    minutes: number;
    milliseconds: number;
  };
  entryTime: string;
  currentTime: string;
}

interface ApiResponse {
  success: boolean;
  data: VehicleRecord[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ViewAllVehicles() {
  const { areaId } = useParams<{ areaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const RECORDS_PER_PAGE = 10;
  
  // Get area name from navigation state
  const areaName = location.state?.areaName || `Area ${areaId}`;

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!areaId) return;
      try {
        const res: ApiResponse = await getExistingVehicles(areaId, page, RECORDS_PER_PAGE);
        console.log('✅ API Response:', res);
        
        if (res.success && res.data) {
          setVehicles(res.data);
          
          // Calculate total pages based on pagination info or array length
          if (res.pagination) {
            // If API provides pagination info
            setTotalPages(res.pagination.totalPages);
            setTotalVehicles(res.pagination.total);
          } else {
            // Fallback: calculate from current page data
            // This assumes if we get a full page, there might be more
            if (res.data.length === RECORDS_PER_PAGE) {
              setTotalPages(page + 1); // At least one more page
            } else {
              setTotalPages(page); // This is the last page
            }
            setTotalVehicles(res.data.length);
          }
        }
        
        console.log('✅ Total Pages:', totalPages);
        console.log('✅ Total Vehicles:', totalVehicles);
      } catch (err) {
        console.error('Failed to fetch vehicle records:', err);
      }
    };
    fetchVehicles();
  }, [areaId, page]);

  const formatDuration = (duration?: VehicleRecord['currentDuration']) => {
    if (!duration) return 'N/A';
    return `${duration.hours}h ${duration.minutes}m`;
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden px-6 py-4" style={{background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)'}}>
      <div 
        className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(50%, -50%)' }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(-50%, 50%)' }}
      ></div>
      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        {/* Back Button */}
        <div className="flex items-center justify-start mb-4">
          <Button
            variant="outline"
            onClick={() => navigate('/area-management')}
            className="flex items-center gap-2 text-white border-white/30 hover:bg-white/10 hover:border-white/50 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Connection Page
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-6">
          Currently Parked Vehicles - {areaName}
        </h1>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-4">
          <p className="text-sm text-white/70 mb-4">
            Showing {vehicles.length} vehicles (Page {page} of {totalPages})
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Current Duration</TableHead>
                <TableHead>Image</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.length > 0 ? (
                vehicles.map((vehicle, index) => {
                  const entryDateTime = formatDateTime(vehicle.entryTime);
                  return (
                    <TableRow key={vehicle._id || index} className="hover:bg-white/5">
                      <TableCell className="font-medium text-white">{vehicle.plateNumber}</TableCell>
                      <TableCell className="text-white">{vehicle.country}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-white">{entryDateTime.date}</div>
                          <div className="text-sm text-white/70">{entryDateTime.time}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{formatDuration(vehicle.currentDuration)}</TableCell>
                      <TableCell>
                        {vehicle.image && vehicle.image !== 'image.jpg' ? (
                          <img 
                            src={vehicle.image} 
                            alt={`Vehicle ${vehicle.plateNumber}`}
                            className="w-16 h-12 object-cover rounded"
                          />
                        ) : (
                          <span className="text-gray-400">No image</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-white/70">
                    No vehicles currently parked in this area
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              {totalVehicles > 0 && (
                <p className="text-xs text-gray-500">
                  Total vehicles: {totalVehicles}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}