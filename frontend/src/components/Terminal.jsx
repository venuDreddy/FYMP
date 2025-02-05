import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { w3cwebsocket as W3CWebSocket } from "websocket";

export default function TerminalComponent({ containerId }) {
  const terminalRef = useRef(null);
  const term = useRef(null);
  const ws = useRef(null);
  let commandBuffer = "";
  let history = [];
  let historyIndex = -1;


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

        // WebSocket Connection
        ws.current = new W3CWebSocket(`ws://192.168.0.105:5000/api/docker/containers/${containerId}/terminal`);

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
        term.current.onData((data) => {
          if (data === "\r") {
            // Handle Enter key
            term.current.write("\r\n");
            if (commandBuffer.trim()) {
              console.log("Sending command:", commandBuffer);
              ws.current.send(commandBuffer);
              history.push(commandBuffer);
              historyIndex = history.length; // Reset history index
            }
            else{
              ws.current.send('\r');
            }
            commandBuffer = "";
          } else if (data === "\x7F") {
            // Handle Backspace, ensuring only input is erased, not output
            if (commandBuffer.length > 0) {
              commandBuffer = commandBuffer.slice(0, -1);
              term.current.write("\b \b");
            }
          } else if (data === "\x1b[A") {
          } else if (data === "\x1b[B") {
          } else if (data === "\x1b[D") {
          } else if (data === "\x1b[C") {
          } else {
            commandBuffer += data;
            term.current.write(data);
          }
        });
        
        function redrawCommand() {
          term.current.write("\r\x1b[K"); // Clear the current line
          term.current.write(commandBuffer); // Rewrite the command buffer
        }
      }
    };

    const timeoutId = setTimeout(initializeTerminal, 100);

    return () => {
      clearTimeout(timeoutId);
      term.current?.dispose();
      ws.current?.close();
    };
  }, [containerId]);

  return <div ref={terminalRef} className="p-4 bg-black h-64 overflow-hidden" style={{ width: "100%", height: "100%" }} />;
}
