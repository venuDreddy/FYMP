import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { FaPlus, FaSave, FaPlay, FaTimes } from 'react-icons/fa';
import { w3cwebsocket as W3CWebSocket } from 'websocket';
import TerminalComponent from './Terminal.jsx';
import axios from 'axios';

const Workspace = ({ containerId,API_URL}) => {
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [terminalOutput, setTerminalOutput] = useState('');
  const terminalRef = useRef(null);
  const token = localStorage.getItem('token');
  // Fetch files in the root directory
  const fetchFiles = async () => {
    try {
      const response = await axios.post(API_URL+'/api/docker/files/list', { containerId, dirPath: '/app'},{headers: { Authorization: `Bearer ${token}`}});
      console.log(response.data.files);
       setFiles(response.data.files.split('\n'));
    } catch (err) {
      console.error(err.message);
    }
  };
  // Read a file
  const readFile = async (filePath) => {
    try {
      const response = await axios.post('/api/docker/files/read', { containerId, filePath });
      setFileContent(response.data.content);
      setCurrentFile(filePath);
    } catch (err) {
      console.error(err);
    }
  };

  // Save a file
  const saveFile = async () => {
    try {
      await axios.post('/api/docker/files/write', { containerId, filePath: currentFile, content: fileContent });
      alert('File saved successfully');
    } catch (err) {
      console.error(err);
    }
  };

  // Connect to the terminal WebSocket
  useEffect(() => {
    const client = new W3CWebSocket(`ws://192.168.0.105:5000/api/docker/containers/${containerId}/terminal`);

    client.onopen = () => {
      console.log('WebSocket connected');
      fetchFiles();
    };

    client.onmessage = (message) => {
      setTerminalOutput((prev) => prev + message.data);
    };

    terminalRef.current = client;
    client.onclose = () => {
      client.close();
    };
  }, [containerId]);

  // Send terminal input
  const sendTerminalInput = (input) => {
    if (terminalRef.current) {
      terminalRef.current.send(input);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* Header */}
      <div style={{ padding: '10px', background: '#1e1e1e', color: '#fff', display: 'flex', gap: '10px' }}>
        <button onClick={() => alert('Add File')}><FaPlus /></button>
        <button onClick={saveFile}><FaSave /></button>
        <button onClick={() => alert('Run')}><FaPlay /></button>
        <button onClick={() => alert('Exit')}><FaTimes /></button>
      </div>

      {/* Main Content */}
      <PanelGroup direction="horizontal" >
        {/* File Explorer */}
        <Panel defaultSize={20} minSize={10}>
          <div style={{ padding: '10px', background: '#252526', color: '#fff' }}>
            <h3>File Explorer</h3>
            <ul>
              {files.map((file, index) => (
                <li key={index} onClick={() => readFile(file)} style={{ cursor: 'pointer' }}>
                  {file.replace(/[^\x20-\x7E]/g, '')}
                </li>
              ))}
            </ul>
          </div>
        </Panel>
        <PanelResizeHandle />
        <Panel >
          <PanelGroup direction='vertical'>
            {/* File Editor */}
            <Panel >
              <div style={{ background: '#252526', color: '#fff', height: '100%' }}>
                <Editor
                  height="90vh"
                  theme='vs-dark'
                  value={fileContent}
                  onChange={(value) => setFileContent(value)}
                />
              </div>
            </Panel>
            <PanelResizeHandle >
            <center>.</center>
            </PanelResizeHandle>

            {/* Terminal */}
            <Panel >
              <div style={{ padding: '10px', background: '#1e1e1e', color: '#fff', height: '100%' }}>
                <h3>Terminal</h3>
                <TerminalComponent containerId={containerId}/>
              </div>

            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default Workspace;