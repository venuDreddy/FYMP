import WebSocket from "ws";
import Docker from "dockerode";

const docker = new Docker();

// List all containers
export async function listContainers(req, res) {
  try {
    const containers = await docker.listContainers({ all: true });
    return res.json({ containers: containers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Start a container
export async function startContainer(req, res) {
  const { containerId } = req.params;
  try {
    const container = docker.getContainer(containerId);
    await container.start();
    res.json({ message: `Container ${containerId} started successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Stop a container
export async function stopContainer(req, res) {
  const { containerId } = req.params;
  console.log(containerId);
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
    await container.remove();
    res.json({ message: `Container ${containerId} stopped successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Pull an image
export async function pullImage(req, res) {
  const { imageName } = req.body;
  try {
    await docker.pull(imageName);
    res.json({ message: `Image ${imageName} pulled successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Create a container
export async function createContainer(req, res) {
  const { imageName, containerName, portBindings } = req.body;

  try {
    // Create the container
    const container = await docker.createContainer({
      Image: imageName,
      name: containerName,
      Tty: true, // Enables TTY (like `-t` in CLI)
      AttachStdin: true, // Allow input to be attached (`-i`)
      OpenStdin: true,
      WorkingDir: "/", // Set working directory to root
      HostConfig: {
        PortBindings: portBindings, // Map container ports to host ports
      },
    });

    // Start the container
    await container.start();

    res.json({ container_id: container.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Read a file from the container
export const readFile = async (req, res) => {
  const { containerId, filePath } = req.body;

  try {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: ["cat", filePath],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start();
    let output = "";
    stream.on("data", (chunk) => (output += chunk.toString()));

    stream.on("end", () => res.json({ content: output }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Write a file to the container
export const writeFile = async (req, res) => {
  const { containerId, filePath, content } = req.body;
  console.log(content);
  try {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: ["sh", "-c", `echo "${content}" > ${filePath}`],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: true });
    stream.on("end", () => res.json({ message: "File saved successfully" }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List files in a directory
export const listFiles = async (req, res) => {
  const { containerId, dirPath } = req.body;
  try {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: ["ls", dirPath],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: true });
    let output = "";

    stream.on("data", (chunk) => (output += chunk.toString()));
    stream.on("end", () => {
      res.json({ files: output });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Terminal access
export const attachTerminal = (ws, req) => {
  const { containerId } = req.params;
  console.log("🔗 Connecting to container:", containerId);

  if (!containerId) {
    ws.send(JSON.stringify({ error: "No containerId provided" }));
    ws.close();
    return;
  }

  const container = docker.getContainer(containerId);

  container.inspect((err, data) => {
    if (err || !data) {
      console.error("❌ Error finding container:", err);
      ws.send(JSON.stringify({ error: `No such container: ${containerId}` }));
      ws.close();
      return;
    }

    container.exec(
      {
        Cmd: ["/bin/sh"], // Change to "/bin/bash" if needed
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
      },
      (err, exec) => {
        if (err) {
          ws.send(JSON.stringify({ error: err.message }));
          ws.close();
          return;
        }

        exec.start({ hijack: true, stdin: true, tty: true }, (err, stream) => {
          if (err) {
            ws.send(JSON.stringify({ error: err.message }));
            ws.close();
            return;
          }

          console.log("✅ Terminal attached to container!");

          // Function to send the current directory as a prompt
          const sendPrompt = () => {
            console.log("Sending prompt..."); // Debug log
            container.exec(
              {
                Cmd: ["pwd"], // Get the current directory
                AttachStdout: true,
                AttachStderr: true,
              },
              (err, exec) => {
                if (err) {
                  console.error("Error creating exec instance for pwd:", err); // Debug log
                  return;
                }
                exec.start({ hijack: true, stdin: false }, (err, stream) => {
                  if (err) {
                    console.error("Error starting exec instance for pwd:", err); // Debug log
                    return;
                  }
                  let output = "";
                  stream.on("data", (chunk) => (output += chunk.toString()));
                  stream.on("end", () => {
                    const currentDir = output.trim();
                    console.log("Current directory:", currentDir); // Debug log
                    // Send the prompt with the current directory
                    ws.send(`\x1b[32m${currentDir}# \x1b[0m`);
                  });
                });
              }
            );
          };

          // Send the initial prompt
          sendPrompt();

          // Send container output to WebSocket
          container.modem.demuxStream(
            stream,
            {
              write: (data) => {
                console.log("📤 Container Output:", data.toString()); // Debug log
                ws.send(data.toString()); // Send output to frontend
              },
            },
            ws
          );

          // Listen for commands from frontend
          ws.on("message", (message) => {
            console.log(`✉️ Received command from frontend: ${message}`);
            stream.write(message + "\n"); // Send command to container
            sendPrompt(); // Send prompt after command execution
          });

          // Handle WebSocket closure
          ws.on("close", () => {
            console.log("⚠️ WebSocket closed");
            stream.end();
          });

          ws.on("error", (err) => {
            console.error("❌ WebSocket error:", err);
            stream.end();
          });
        });
      }
    );
  });
};
