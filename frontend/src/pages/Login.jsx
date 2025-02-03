import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({API_URL}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  if(token){
    const checkLogin = async(token)=>{
      try {
        const response = await axios.get(API_URL+'/api/auth/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(response.data.user);
        if(response.data.user){
          navigate('/dashboard');
        }
      } catch (err) {
        console.log(err);
        setError(err.message);
    }
    }
    //checkLogin(token);
  }
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(API_URL+'/api/auth/login', {
        username,
        password,
      });
      console.log(response.data);
      localStorage.setItem('token', response.data.token); // Store token in localStorage
      navigate('/dashboard'); // Redirect to dashboard after login
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '10px' }}>
          <label>Username:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Login
        </button>
      </form>
      <p>
        Don't have an account? <a href="/register">Register here</a>.
      </p>
    </div>
  );
};

export default Login;