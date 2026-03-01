import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InventoryDashboard from './pages/InventoryDashboard';
import DonorDashboard from './pages/DonorDashboard';
import BookAppointment from './pages/BookAppointment';
import Appointments from './pages/Appointments';
import CampMap from './pages/CampMap';
import EmergencyRequests from './pages/EmergencyRequests';
import EmergencyAlerts from './pages/EmergencyAlerts';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/inventory" element={
                        <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
                            <InventoryDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/donors" element={
                        <ProtectedRoute>
                            <DonorDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/appointments/book" element={
                        <ProtectedRoute>
                            <BookAppointment />
                        </ProtectedRoute>
                    } />
                    <Route path="/appointments" element={
                        <ProtectedRoute>
                            <Appointments />
                        </ProtectedRoute>
                    } />

                    <Route path="/camps" element={
                        <ProtectedRoute>
                            <CampMap />
                        </ProtectedRoute>
                    } />

                    <Route path="/emergency" element={
                        <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
                            <EmergencyRequests />
                        </ProtectedRoute>
                    } />

                    <Route path="/emergency/alerts" element={
                        <ProtectedRoute>
                            <EmergencyAlerts />
                        </ProtectedRoute>
                    } />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
