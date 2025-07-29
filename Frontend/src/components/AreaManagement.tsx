import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const recentRecords = [
  { plate: 'ABC-123', entry: '2025-07-28 14:30', status: 'Entered' },
  { plate: 'XYZ-456', entry: '2025-07-28 13:45', status: 'Exited' },
  { plate: 'LMN-789', entry: '2025-07-28 13:30', status: 'Entered' },
  // Add more if needed
];

export default function AreaManagement() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-neutral-900 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">MoniPark</h1>
          <p className="text-sm text-muted mt-2">"From Parked Cars to Smart Starts"</p>
        </header>

        {/* Parking Info */}
        <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            Parking Area - FTP Server: <span className="font-normal text-blue-400">ftp://blablabla.com</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <p><strong>Total Capacity:</strong> 100</p>
            <p><strong>Currently Occupied:</strong> 67</p>
          </div>
        </section>

        {/* Records Table */}
        <section className="bg-neutral-800 rounded-xl border border-neutral-700 p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4">Recent Parking Records</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentRecords.map((record, idx) => (
                <TableRow key={idx}>
                  <TableCell>{record.plate}</TableCell>
                  <TableCell>{record.entry}</TableCell>
                  <TableCell>{record.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button className="w-full md:w-auto" onClick={() => console.log('Show all records')}>
            View All Records
          </Button>
          <Button variant="outline" className="w-full md:w-auto" onClick={() => console.log('Show existing cars')}>
            View All Existing Cars
          </Button>
        </div>
      </div>
    </div>
  );
}
