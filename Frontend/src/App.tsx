// import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import RegisterPage from './components/Register';
import LoginPage from './components/Login';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import AreaManagement from './components/AreaManagement';

import ViewAllVehicles from './components/ViewAllVehicles';

export default function App() {
  return (
    <div>
        <Header/>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/signin" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
            <Route path="/area-management" element={<AreaManagement />} />
            <Route path="/area/:areaId/vehicles" element={<ViewAllVehicles />} />
        </Routes>
    </div>
  );
}
