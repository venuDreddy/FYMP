import React, { useState } from 'react';
import axios from 'axios';

function DockerCreate({setContainerId}) {
    const [containers, setContainers] = useState([]);
    const [imageName, setImageName] = useState('');
    const [containerName, setContainerName] = useState('');
    const [hostPort, setHostPort] = useState('');
    const [containerPort, setContainerPort] = useState('');
    const [password,setPassword] = useState('');
  
    const fetchContainers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/docker/containers', {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(response.data);
        setContainers(response.data.containers);
      } catch (err) {
        console.error(err);
      }
    };
  
    const pullImage = async () => {
      try {
        const token = localStorage.getItem('token');
        await axios.post(
          'http://localhost:5000/api/docker/images/pull',
          { imageName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert(`Image ${imageName} pulled successfully`);
      } catch (err) {
        console.error(err);
      }
    };
  
    const createContainer = async () => {
      try {
        const token = localStorage.getItem('token');
        const portBindings = {
          [`${containerPort}/tcp`]: [{ HostPort: hostPort }],
        };
  
        const response = await axios.post(
          'http://localhost:5000/api/docker/containers/create',
          { imageName, containerName, portBindings },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      setContainerId(response.data.container_id);
        alert(`Container ${containerName} created and started successfully`);
      } catch (err) {
        console.log(err);
      }
    };
  
  return (
    <div>
      <h2>Docker Consumer</h2>
      <button onClick={fetchContainers}>Fetch Containers</button>
      <ul>
        {containers.map((container) => (
          <li key={container.Id}>
            {container.Names[0]} - {container.State}
          </li>
        ))}
      </ul>
      <div>
        <h3>Pull Image</h3>
        <input
          type="text"
          placeholder="Image name"
          value={imageName}
          onChange={(e) => setImageName(e.target.value)}
        />
        <button onClick={pullImage}>Pull Image</button>
      </div>
      <div>
        <h3>Create Container</h3>
        <input
          type="text"
          placeholder="Image name"
          value={imageName}
          onChange={(e) => setImageName(e.target.value)}
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={createContainer}>Create Container</button>
      </div>
    </div>
  )
}

export default DockerCreate