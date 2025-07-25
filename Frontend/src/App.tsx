// import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import FeaturesCarousel from './components/FeaturesCarousel';
import RegisterPage from './components/Register';
import LoginPage from './components/Login';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
        <Header />
        <Routes>
            <Route path="/" element={
                <>
                    <Hero />
                    <FeaturesCarousel />
                </>
            } />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/signin" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </div>
  );
}