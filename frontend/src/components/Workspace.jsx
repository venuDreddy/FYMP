import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { FaPlus, FaSave, FaPlay, FaTimes } from 'react-icons/fa';
import { LuRefreshCcw } from 'react-icons/lu';
import TerminalComponent from './Terminal.jsx';
import axios from 'axios';

const Workspace = ({ containerId,setContainerId,API_URL }) => {
  const [files, setFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState('');
  const [fileContent, setFileContent] = useState('');
  const token = localStorage.getItem('token');
  // Fetch files in the root directory
  const fetchFiles = async () => {
    try {
      const response = await axios.post(API_URL + '/api/docker/files/list', { containerId, dirPath: '/app' }, { headers: { Authorization: `Bearer ${token}` } });
      setFiles(response.data.files.split('\n'));
    } catch (err) {
      console.error(err.message);
    }
  };
  // Read a file
  const readFile = async (file) => {
    try { 
      const newFile=file.replace(/[^\x20-\x7E]/g, '');
      const response = await axios.post(API_URL + '/api/docker/files/read', { containerId, filePath: '/app/' + newFile}, { headers: { Authorization: `Bearer ${token}` },
      responseType:'json'});
      console.log(response.data);
      let newFileContent = response.data.content;
      while(newFileContent.length>0 && newFileContent.charCodeAt(0)<=31){
        newFileContent = newFileContent.slice(1);
      }
      console.log(newFileContent);
      setCurrentFile(newFile);
      setFileContent(newFileContent);
    } catch (err) {
      console.error(err);
    }
  };

  // Save a file
  const saveFile = async () => {
    let filetoSave = currentFile;
    if(!currentFile){
      const newFile = prompt("Please enter a file name:");
      console.log(currentFile);
      if(!newFile){
        alert("File name cannot be empty");
        return;
      }
      filetoSave = newFile;
      setCurrentFile(newFile);
    }
    try {
      const response = await axios.post(API_URL + '/api/docker/files/write', { containerId, filePath: '/app/'+filetoSave, content: fileContent },{ headers: { Authorization: `Bearer ${token}` } });
      await fetchFiles();
      console.log(response.data.message);
    } catch (err) {
      console.error(err);
    }
  };
  //Stop container
  const exit = () =>{
    try {
      const response = axios.post(API_URL + `/api/docker/containers/${containerId}/stop`,{},{ headers: { Authorization: `Bearer ${token}`}});
      setContainerId('');
    } catch (err) {
      console.error(err);
    }
  }
  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      {/* Header */}
      <div style={{ padding: '10px', background: '#1e1e1e', color: '#fff', display: 'flex', gap: '10px' }}>
        <button onClick={() => {saveFile();setCurrentFile('');setFileContent('')}}><FaPlus /></button>
        <button onClick={saveFile}><FaSave /></button>
        <button onClick={exit}><FaTimes /></button>
        <button onClick={fetchFiles}><LuRefreshCcw /></button>
      </div>

      {/* Main Content */}
      <PanelGroup direction="horizontal" >
        {/* File Explorer */}
        <Panel defaultSize={20} minSize={10}>
          <div style={{ padding: '10px', background: '#252526', color: '#fff' }}>
            <h3>File Explorer</h3>
            <ul>
              {files.map((file, index) => (
                <li key={index} onClick={()=>readFile(file)} style={{ cursor: 'pointer', listStyle: 'none', fontSize: '1rem', borderBottom: '1px solid grey' }}>
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
                <TerminalComponent containerId={containerId} />
              </div>

            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default Workspace;