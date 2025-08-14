import { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import StaffAccountPopUp from './StaffAccountPopUp';

export default function StaffManagement() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden flex flex-col">
      <div 
        className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(50%, -50%)' }}
      ></div>
      <div 
        className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
        style={{ transform: 'translate(-50%, 50%)' }}
      ></div>

      <main className="flex-grow relative z-10">
        <div className="w-full h-full flex items-center justify-center py-16">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-64 h-16 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-lg">Create staff account</Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900/95 text-white border-gray-700">
              <StaffAccountPopUp onCreate={() => setOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}


