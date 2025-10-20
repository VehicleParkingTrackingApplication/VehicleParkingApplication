import { useEffect, useState } from 'react';
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
import { getAllRecords } from '@/services/parkingApi';

interface ParkingRecord {
  _id: string;
  plateNumber: string;
  status: 'ENTRY' | 'EXIT';
  time: string;
  date: string;
  image?: string;
  country?: string;
}

interface ApiResponse {
  success: boolean;
  data: ParkingRecord[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function ViewAllRecords() {
  const { areaId } = useParams<{ areaId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const RECORDS_PER_PAGE = 10;
  
  // Get area name from navigation state
  const areaName = location.state?.areaName || `Area ${areaId}`;

  useEffect(() => {
    const fetchRecords = async () => {
      if (!areaId) return;
      try {
        const res: ApiResponse = await getAllRecords(areaId, page, RECORDS_PER_PAGE);
        console.log('✅ API Response:', res);
        
        if (res.success && res.data) {
          setRecords(res.data);
          
          // Calculate total pages based on pagination info or array length
          if (res.pagination) {
            // If API provides pagination info
            setTotalPages(res.pagination.totalPages);
            setTotalRecords(res.pagination.total);
          } else {
            // Fallback: calculate from current page data
            // This assumes if we get a full page, there might be more
            if (res.data.length === RECORDS_PER_PAGE) {
              setTotalPages(page + 1); // At least one more page
            } else {
              setTotalPages(page); // This is the last page
            }
            setTotalRecords(res.data.length);
          }
        }
        
        console.log('✅ Total Pages:', totalPages);
        console.log('✅ Total Records:', totalRecords);
      } catch (err) {
        console.error('Failed to fetch parking records:', err);
      }
    };
    fetchRecords();
  }, [areaId, page]);

  const getActionColor = (action: string) => {
    return action === 'ENTRY' ? 'text-green-400' : 'text-red-400';
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
          All Parking Records - {areaName}
        </h1>

        <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-4">
          <p className="text-sm text-white/70 mb-4">
            Showing {records.length} records (Page {page} of {totalPages})
          </p>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Image</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length > 0 ? (
                records.map((record, index) => (
                  <TableRow key={record._id || index} className="hover:bg-white/5">
                    <TableCell className="font-medium text-white">{record.plateNumber}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${getActionColor(record.status)}`}>
                        {record.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-white">{record.date}</TableCell>
                    <TableCell className="text-white">{record.time}</TableCell>
                    <TableCell className="text-white">{record.country || 'N/A'}</TableCell>
                    <TableCell>
                      {record.image && record.image !== 'image.jpg' ? (
                        <img 
                          src={record.image} 
                          alt={`Vehicle ${record.plateNumber}`}
                          className="w-16 h-12 object-cover rounded"
                        />
                      ) : (
                        <span className="text-gray-400">No image</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-white/70">
                    No parking records found for this area
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
              {totalRecords > 0 && (
                <p className="text-xs text-gray-500">
                  Total records: {totalRecords}
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