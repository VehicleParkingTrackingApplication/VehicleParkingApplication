import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { getAllVehicles } from '@/services/parking';

interface VehicleRecord {
  plate: string;
  action: 'ENTRY' | 'EXIT';
  time: string;
  date: string;
}

export default function ViewAllVehicles() {
  const { areaId } = useParams<{ areaId: string }>();
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const RECORDS_PER_PAGE = 20;

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!areaId) return;
      try {
        const res = await getAllVehicles(areaId, page, RECORDS_PER_PAGE);
        setVehicles(res.records);
        setTotalPages(Math.ceil(res.total / RECORDS_PER_PAGE));
      } catch (err) {
        console.error('Failed to fetch vehicle records:', err);
      }
    };
    fetchVehicles();
  }, [areaId, page]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-6">All Vehicles for Area {areaId}</h1>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plate Number</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((record, index) => (
              <TableRow key={index}>
                <TableCell>{record.plate}</TableCell>
                <TableCell>{record.action}</TableCell>
                <TableCell>{record.time}</TableCell>
                <TableCell>{record.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
