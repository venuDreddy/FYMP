import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResourceProvider from './pages/ResourceProvider';
import ResourceConsumer from './pages/ResourceConsumer';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resource-provider"
          element={
            <ProtectedRoute>
              <ResourceProvider />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resource-consumer"
          element={
            <ProtectedRoute>
              <ResourceConsumer />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;