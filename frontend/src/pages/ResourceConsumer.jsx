import React, { useState } from 'react';
import axios from 'axios';
import DockerCreate from '../components/DockerCreate.jsx';
import Workspace from '../components/Workspace.jsx';

const DockerConsumer = ({API_URL}) => {
  const [containerId, setContainerId] = useState('e2847b8e0a96be69970555d3b380b8f0930efdb356faa3ded66261ed75f7e770');

  return (
    (containerId)?<Workspace containerId={containerId} API_URL={API_URL}/>:<DockerCreate setContainerId={setContainerId}/>
  );
};

export default DockerConsumer;