import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  getAllParkingAreas,
  getRecentRecords,
  updateFtpServer,
} from '@/services/parking';

interface ParkingRecord {
  plate: string;
  action: 'ENTRY' | 'EXIT';
  time: string;
  date: string;
}

interface FtpServer {
  protocol: string;
  encryption: string;
  host: string;
  port: number;
  user: string;
  password: string;
}

interface ParkingArea {
  id: string;
  name: string;
  ftp?: FtpServer;
  records: ParkingRecord[];
}

export default function AreaManagement() {
  const [areas, setAreas] = useState<ParkingArea[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allAreas = await getAllParkingAreas();
         console.log('✅ API returned:', allAreas);
        const enriched = await Promise.all(
          allAreas.map(async (area: ParkingArea) => {
            const records = await getRecentRecords(area.id);
            return { ...area, records };
          })
        );
        setAreas(enriched);
      } catch (error) {
        console.error('Error fetching areas:', error);
      }
    };
    fetchData();
  }, []);

  const handleOpenFtpModal = (areaId: string) => {
    setSelectedAreaId(areaId);
    setIsModalOpen(true);
  };

  const navigate = useNavigate();


  const handleSaveFtp = async (ftp: FtpServer) => {
    if (!selectedAreaId) return;
    try {
      await updateFtpServer(selectedAreaId, ftp);
      const updatedRecords = await getRecentRecords(selectedAreaId);
      setAreas((prev) =>
        prev.map((area) =>
          area.id === selectedAreaId
            ? { ...area, ftp, records: updatedRecords }
            : area
        )
      );
    } catch (err) {
      console.error('Failed to update FTP server:', err);
    }
    setIsModalOpen(false);
    setSelectedAreaId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-neutral-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Area Management</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Add New Area Button */}
        <div className="border border-blue-500 text-blue-500 rounded-xl flex items-center justify-center p-8 cursor-pointer hover:bg-blue-500/10">
          <div className="text-center">
            <Plus size={32} className="mx-auto" />
            <p className="font-bold text-lg mt-2">Add new Parking Area</p>
          </div>
        </div>

        {/* Parking Area Cards */}
        {areas.map((area) => (
          <div key={area.id} className="bg-neutral-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={18} />
                <h2 className="text-lg font-semibold">{area.name}</h2>
              </div>

              {area.ftp && (
                <p className="text-sm text-blue-300 mb-2">
                  FTP: {area.ftp.protocol}://{area.ftp.host}:{area.ftp.port}
                </p>
              )}

              <table className="w-full text-sm text-left mt-2 mb-4 border border-gray-700 rounded-md overflow-hidden">
                <thead>
                  <tr className="bg-neutral-700">
                    <th className="p-2 font-medium">Plate</th>
                    <th className="p-2 font-medium">Action</th>
                    <th className="p-2 font-medium">Time</th>
                    <th className="p-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {area.records?.slice(0, 10).map((record, idx) => (
                    <tr key={idx} className="border-t border-gray-700">
                      <td className="p-2">{record.plate}</td>
                      <td className="p-2">{record.action}</td>
                      <td className="p-2">{record.time}</td>
                      <td className="p-2">{record.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 mt-auto">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => console.log(`View all records for ${area.name}`)}
              >
                View All Records
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/area/${area.id}/vehicles`)}
              >
                View Existing Cars
              </Button>
              <Button variant="ghost" onClick={() => handleOpenFtpModal(area.id)}>
                Set FTP
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* FTP Configuration Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-neutral-900 text-white border border-gray-700">
          <DialogHeader>
            <DialogTitle>Configure FTP Server</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4 mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              const ftp: FtpServer = {
                protocol: formData.get('protocol') as string,
                encryption: formData.get('encryption') as string,
                host: formData.get('host') as string,
                port: parseInt(formData.get('port') as string),
                user: formData.get('user') as string,
                password: formData.get('password') as string,
              };
              handleSaveFtp(ftp);
            }}
          >
            <Input name="protocol" placeholder="Protocol" defaultValue="FTP" required />
            <Input name="encryption" placeholder="Encryption" defaultValue="TLS/SSL Explicit" required />
            <Input name="host" placeholder="Host" defaultValue="acudcs001.tcsinstruments.com.au" required />
            <Input name="port" placeholder="Port" type="number" defaultValue={21} required />
            <Input name="user" placeholder="User" defaultValue="UoWTeamUsr" required />
            <Input name="password" placeholder="Password" type="password" defaultValue="U0WT3@mAcc355!" required />
            <div className="flex justify-end gap-2 mt-4">
              <Button type="submit">Save</Button>
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
