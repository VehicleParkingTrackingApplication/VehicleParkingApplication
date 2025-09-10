import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import CompleteProfile from './components/CompleteProfile';

// The Layout Component
const MainLayout = () => {
  return (
    <div>
      <Header />
      {/* CHANGE: The padding class 'p-8' has been removed from here */}
      <main className="ml-64">
        <Outlet /> {/* The <Outlet> component renders the current page */}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <div>
      <Routes>
        {/* --- Routes WITHOUT the sidebar --- */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/complete-profile"
          element={
            <ProtectedRoute>
              <CompleteProfile />
            </ProtectedRoute>
          }
        />

        {/* --- Routes WITH the sidebar --- */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/staff-management" element={<StaffManagement />} />
          <Route path="/parking-dashboard" element={<ParkingDashboard />} />
          <Route path="/reports" element={<ExistingReportsPage />} />
          <Route path="/area/:areaId/vehicles" element={<ViewAllExistingVehicles />} />
          <Route path="/area/:areaId/records" element={<ViewAllRecords />} />
          
          <Route
            path="/area-management"
            element={
              <ProtectedRoute>
                <AreaManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/area/:areaId/details"
            element={
              <ProtectedRoute>
                <AreaDetail />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

