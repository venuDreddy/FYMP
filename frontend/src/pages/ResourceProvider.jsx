import React from 'react';
import { useNavigate } from 'react-router-dom';

const ResourceProvider = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/dashboard'); // Go back to the dashboard
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Resource Provider</h2>
      <p>You are now in the Resource Provider section.</p>
      <button onClick={handleBack} style={{ padding: '10px 20px', cursor: 'pointer' }}>
        Back to Dashboard
      </button>
    </div>
  );
};

export default ResourceProvider;