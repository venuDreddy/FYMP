import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { w3cwebsocket as W3CWebSocket } from "websocket";

export default function TerminalComponent({ containerId }) {
  const terminalRef = useRef(null);
  const term = useRef(null);
  const ws = useRef(null);
  let commandBuffer = "";
  const prompt = "$ ";

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
            term.current.write("\r\n");
            if (commandBuffer.trim()) {
              console.log("Sending command:", commandBuffer);
              ws.current.send(commandBuffer);
            }
            commandBuffer = "";
          } else if (data === "\x7F") { // Handle backspace
            if (commandBuffer.length > 0) {
              commandBuffer = commandBuffer.slice(0, -1);
              term.current.write("\b \b");
            }
          } else {
            commandBuffer += data;
            term.current.write(data);
          }
        });
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
