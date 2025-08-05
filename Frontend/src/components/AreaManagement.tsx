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

  const navigate = useNavigate();

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
          <div key={area._id} className="bg-neutral-800 rounded-xl p-4 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={18} />
                <h2 className="text-lg font-semibold">{area.name}</h2>
              </div>



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
                  {Array.isArray(area.records) && area.records.slice(0, 10).map((record, idx) => (
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
                onClick={() => navigate(`/area/${area._id}/records`, { 
                  state: { areaName: area.name } 
                })}
              >
                View All Records
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/area/${area._id}/vehicles`, { 
                  state: { areaName: area.name } 
                })}
              >
                View Existing Cars
              </Button>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
}
