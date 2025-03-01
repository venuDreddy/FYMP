import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DockerCreate from '../components/DockerCreate.jsx';
import Workspace from '../components/Workspace.jsx';

const DockerConsumer = ({API_URL}) => {
  const [containerId, setContainerId] = useState(()=>{
    const savedId = sessionStorage.getItem('containerId');
    // Verify the ID is present and not 'undefined' (common serialization error)
    return savedId && savedId !== 'undefined' ? savedId : '';
  });

useEffect(() => {
  sessionStorage.setItem('containerId', containerId);
}, [containerId]);


  return (
    (containerId)?<Workspace containerId={containerId} API_URL={API_URL} setContainerId={setContainerId}/>:<DockerCreate setContainerId={setContainerId}/>
  );
};

export default DockerConsumer;