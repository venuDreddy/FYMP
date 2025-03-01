import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResourceProvider from './pages/ResourceProvider';
import ResourceConsumer from './pages/ResourceConsumer';
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  const API_URL= "http://localhost:5000";
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login API_URL={API_URL}/>} />
        <Route path="/register" element={<Register API_URL={API_URL}/>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard API_URL={API_URL}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resource-provider"
          element={
            <ProtectedRoute>
              <ResourceProvider API_URL={API_URL}/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resource-consumer"
          element={
            <ProtectedRoute>
              <ResourceConsumer API_URL={API_URL}/>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Login API_URL={API_URL}/>} />
      </Routes>
    </Router>
  );
};

export default App;