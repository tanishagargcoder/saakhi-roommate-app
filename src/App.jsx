import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import Login from './Login';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import { AuthProvider, ProtectedRoute } from './AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import VoiceAssistant from './components/voiceassistant';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            {/* Landing page */}
            <Route path="/" element={<Landing />} />

            {/* Auth pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Login startInSignup />} />

            {/* User Dashboard (after login) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard (if needed separately) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>

          {/* Toast container for success/error messages */}
          <ToastContainer />
          <VoiceAssistant />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
