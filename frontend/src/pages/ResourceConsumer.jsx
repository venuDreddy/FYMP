import React, { useState } from 'react';
import axios from 'axios';
import DockerCreate from '../components/DockerCreate.jsx';
import Workspace from '../components/Workspace.jsx';

const DockerConsumer = () => {
  const [containerId, setContainerId] = useState();

  return (
    (containerId)?<Workspace containerId={containerId}/>:<DockerCreate setContainerId={setContainerId}/>
  );
};

export default DockerConsumer;