import { useEffect, useRef, useState } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { FitAddon } from 'xterm-addon-fit';
import { w3cwebsocket as W3CWebSocket } from "websocket";

export default function TerminalComponent({ containerId }) {
  const terminalRef = useRef(null);
  const term = useRef(null);
  const ws = useRef(null);
  let commandBuffer = "";
  const fitAddonRef = useRef(new FitAddon());


  useEffect(() => {
    const initializeTerminal = () => {
      if (terminalRef.current && !term.current) {
        term.current = new Terminal({
          cursorBlink: true,
          theme: {
            background: "#1e1e1e",
            foreground: "#ffffff",
          },
        });

        term.current.open(terminalRef.current);
        term.current.write(`\u001b[32mConnected to container ${containerId}\u001b[0m\r\n`);
        fitAddonRef.current.fit();
        // WebSocket Connection
        ws.current = new W3CWebSocket(`ws://localhost:5000/api/docker/containers/${containerId}/terminal`);

        ws.current.onopen = () => {
          console.log("WebSocket connected");
        };

        ws.current.onmessage = (message) => {
          console.log("Received:", message.data);
          term.current.write(message.data);
        };

        ws.current.onerror = (error) => {
          console.error("WebSocket Error:", error);
        };

        ws.current.onclose = () => {
          console.log("WebSocket closed");
          term.current.write("\r\n\u001b[31mDisconnected from terminal\u001b[0m\r\n");
        };

        // Handle user input
        let cursorPosition = 0;
        term.current.onData((data) => {
          switch (data) {
            case '\r':  // Enter key
              ws.current.send(commandBuffer);
              term.current.write('\r\n');
              cursorPosition = 0;
              commandBuffer="";
              break;
        
            case '\x1b[A':  // Up arrow
            case '\x1b[B':  // Down arrow
            case '\x1b[C':  // Right arrow
            case '\x1b[D': break;// Left arrow
            case '\x7f':   // Backspace (DEL)
            case '\x08':  // Backspace (BS)
              // Handle backspace (you can add backspace logic here)
              if(cursorPosition>0){
                term.current.write('\b \b');
                cursorPosition-=1;
                commandBuffer=commandBuffer.slice(0,-1);
              }
              break;
        
            case '\t':  // Tab key
              // Handle tab completion
              break;
        
            case '\x1b':  // Escape key
              // Handle escape sequence
              break;
        
            case '\x1b[2~':  // Insert key
              // Handle insert key
              break;
        
            default:
              // Handle regular input
              commandBuffer=commandBuffer+data;
              term.current.write(data);
              cursorPosition+=1;
          }
        });
  }
}
    const timeoutId = setTimeout(initializeTerminal, 100);

    return () => {
      clearTimeout(timeoutId);
      term.current?.dispose();
      ws.current?.close();
    };
  }, [containerId]);

  return <div ref={terminalRef} className="p-4 bg-black h-64 overflow-hidden" style={{ width: "100%", height: "100%" }} />;
}