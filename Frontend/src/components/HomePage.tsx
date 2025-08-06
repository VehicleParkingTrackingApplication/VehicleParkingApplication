import React from 'react';
import { Footer } from './Footer';
import { Button } from './ui/button';
import { Plus } from 'lucide-react';

const HomePage: React.FC = () => {
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
        {/* Top section with button and dashboard */}
        <div className="pt-16 px-8">
          <div className="flex items-start gap-6 ml-32">
            {/* Square + Button - positioned on the left near top */}
            <div className="flex-shrink-0">
              <Button 
                className="w-20 h-20 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                onClick={() => console.log('+ button clicked')}
              >
                <Plus className="w-8 h-8" />
              </Button>
            </div>

            {/* Dashboard Container */}
            <div className="w-64">
              <div className="bg-neutral-800 rounded-xl border border-neutral-700 p-4 shadow-lg">
                <h2 className="text-xl font-bold text-white mb-3 text-center">Parking Slot Analysis</h2>
                <div className="bg-neutral-900 rounded-lg p-3 border border-neutral-600 h-64">
                  <img 
                    src="/assets/Placeholder.png" 
                    alt="Parking Analysis Dashboard" 
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;