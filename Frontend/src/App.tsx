// import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import RegisterPage from './components/Register';
import LoginPage from './components/Login';
import HomePage from './components/HomePage';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AccountPage from './components/account/AccountPage';
import AreaManagement from './components/areaManagement/AreaManagement';
import ParkingDashboard from './components/ParkingDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import StaffManagement from './components/StaffManagement';
import ExistingReportsPage from './components/ExistingReport';

import ViewAllExistingVehicles from './components/ViewAllExistingVehicles';
import ViewAllRecords from './components/ViewAllRecords';
import AreaDetail from './components/areaManagement/AreaDetail';

export default function App() {
  return (
    <div>
        <Routes>
            {/* Landing page without header */}
            <Route path="/" element={<LandingPage />} />
            
            {/* Routes with header */}
            <Route path="/home" element={
                <div>
                    <Header/>
                    <HomePage />
                </div>
            } />
            <Route path="/dashboard" element={
                <div>
                    <Header/>
                    <Dashboard />
                </div>
            } />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/signin" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/account" element={
                <div>
                    <Header/>
                    <AccountPage />
                </div>
            } />
            <Route 
                path="/area-management" 
                element={
                    <ProtectedRoute>
                        <Header/>
                        <AreaManagement />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/staff-management" 
                element={
                    <div>
                        <Header/>
                        <StaffManagement />
                    </div>
                } 
            />
            <Route path="/parking-dashboard" element={
                <div>
                    <Header/>
                    <ParkingDashboard />
                </div>
            } />
             <Route path="/reports" element={
                <div>
                    <Header/>
                    <ExistingReportsPage />
                </div>
            } />
            <Route path="/area/:areaId/details" element={
                <ProtectedRoute>
                    <Header/>
                    <AreaDetail />
                </ProtectedRoute>
            } />
            <Route path="/area/:areaId/vehicles" element={
                <div>
                    <Header/>
                    <ViewAllExistingVehicles />
                </div>
            } />
            <Route path="/area/:areaId/records" element={
                <div>
                    <Header/>
                    <ViewAllRecords />
                </div>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </div>
  );
}
