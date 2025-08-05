import React from 'react';
import { Footer } from './Footer';

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
      
      <main className="flex-grow">
        {/* Page content goes here, but is currently empty as requested */}
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;