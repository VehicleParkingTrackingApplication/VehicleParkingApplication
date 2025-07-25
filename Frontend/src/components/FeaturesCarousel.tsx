import React from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export default function FeaturesCarousel() {
    const navigate = useNavigate();
    
    const slides = [
        { src: '/assets/image-records.png', caption: 'Image records' },
        { src: '/assets/recognized-plate.png', caption: 'Recognized plate' },
        { src: '/assets/customer-dashboard.png', caption: 'Customer Dashboard' },
    ];

    return (
        <section className="py-16 bg-white px-4">
        <div className="max-w-4xl mx-auto text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">We work with the real-time data</h2>
            <p>from your <span className="font-semibold bg-yellow-300">ANPR camera</span> to deliver the solution</p>
            <Button 
                className="mt-6" 
                onClick={() => navigate('/register')}
                size="lg"
            >
                Learn More
            </Button>
        </div>
        <div className="flex overflow-x-auto space-x-4">
            {slides.map(slide => (
            <figure key={slide.caption} className="flex-shrink-0 w-64">
                <img src={slide.src} alt={slide.caption} className="rounded-lg" />
                <figcaption className="text-center mt-2 text-sm text-gray-600">{slide.caption}</figcaption>
            </figure>
            ))}
        </div>
        </section>
    );
}