// import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import RegisterPage from './components/Register';
import LoginPage from './components/Login';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import AccountPage from './components/AccountPage';
import AreaManagement from './components/AreaManagement';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <div>
        <Header/>
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/signin" element={<LoginPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route 
                path="/area-management" 
                element={
                    <ProtectedRoute>
                        <AreaManagement />
                    </ProtectedRoute>
                } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </div>
  );
}
