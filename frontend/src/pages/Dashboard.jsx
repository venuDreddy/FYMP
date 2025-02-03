import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = ({API_URL}) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login'); // Redirect to login if no token is found
        return;
      }

      try {
        const response = await axios.get(API_URL+'/api/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch user data');
        localStorage.removeItem('token'); // Clear invalid token
        navigate('/login'); // Redirect to login on error
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token'); // Clear token on logout
    navigate('/login'); // Redirect to login page
  };

  const handleSelection = (role) => {
    if (role === 'provider') {
      navigate('/resource-provider'); // Redirect to Resource Provider page
    } else if (role === 'consumer') {
      navigate('/resource-consumer'); // Redirect to Resource Consumer page
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Dashboard</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {user ? (
        <div>
          <p>Welcome, <strong>{user.username}</strong>!</p>
          <p>Please select your role:</p>
          <button
            onClick={() => handleSelection('provider')}
            style={{ padding: '10px 20px', margin: '10px', cursor: 'pointer' }}
          >
            Resource Provider
          </button>
          <button
            onClick={() => handleSelection('consumer')}
            style={{ padding: '10px 20px', margin: '10px', cursor: 'pointer' }}
          >
            Resource Consumer
          </button>
          <br />
          <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Dashboard;