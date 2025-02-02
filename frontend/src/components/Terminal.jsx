import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

export default function TerminalComponent() {
  const terminalRef = useRef(null);
  const term = useRef(null);
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
      
            term.current.resize(80, 24);
            term.current.open(terminalRef.current);
            term.current.write("\u001b[32mWelcome to the Xterm.js Terminal!\u001b[0m\r\n$ ");
      
            term.current.onData((data) => {
                if (data === "\r") { // Enter key
                    term.current.write("\r\n$ "); // Move to the next line and add a prompt
                  } else if (data === "\x7F") { // Backspace key
                    term.current.write("\b \b"); // Move cursor back, overwrite with space, move back again
                  } else {
                    term.current.write(data); // Write other characters
                  }
            });
          }
        };
      
        const timeoutId = setTimeout(initializeTerminal, 100); // Delay initialization by 100ms
        return () => {
          clearTimeout(timeoutId);
          term.current?.dispose();
        };
      }, []);

  return (
    <div ref={terminalRef} className="p-4 bg-black h-64 overflow-hidden" style={{ width: '100%', height: '100%' }} />
  );
}