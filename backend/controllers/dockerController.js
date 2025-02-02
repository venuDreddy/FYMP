import Docker from 'dockerode';
import WebSocket from 'ws';

const docker = new Docker();

// List all containers
export async function listContainers(req, res) {
  try {
    const containers = await docker.listContainers({ all: true });
    return res.json({containers:containers});
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
  try {
    const container = docker.getContainer(containerId);
    await container.stop();
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
export async function createContainer(req, res){
  const { imageName, containerName, portBindings } = req.body;

  try {
    // Create the container
    const container = await docker.createContainer({
      Image: imageName,
      name: containerName,
      Tty: true, // Enables TTY (like `-t` in CLI)
      AttachStdin: true, // Allow input to be attached (`-i`)
      OpenStdin: true,
      HostConfig: {
        PortBindings: portBindings, // Map container ports to host ports
      },
    });

    // Start the container
    await container.start();

    res.json({ container_id:container.id});
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
      Cmd: ['cat', filePath],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start();
    let output = '';
    stream.on('data', (chunk) => (output += chunk.toString()));
    stream.on('end', () => res.json({ content: output }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Write a file to the container
export const writeFile = async (req, res) => {
  const { containerId, filePath, content } = req.body;

  try {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: ['sh', '-c', `echo "${content}" > ${filePath}`],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start();
    stream.on('end', () => res.json({ message: 'File saved successfully' }));
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
      Cmd: ['ls', '-l', dirPath],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start();
    let output = '';
    stream.on('data', (chunk) => (output += chunk.toString()));
    stream.on('end', () => res.json({ files: output }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Terminal access:
export const attachTerminal = (ws, req) => {
  const { containerId } = req.params;

  const container = docker.getContainer(containerId);
  const exec = container.exec({
    Cmd: ['/bin/sh'],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
  });

  exec.start((err, stream) => {
    if (err) {
      ws.send(JSON.stringify({ error: err.message }));
      return;
    }

    // Send container output to the client
    stream.on('data', (chunk) => ws.send(chunk.toString()));

    // Send client input to the container
    ws.on('message', (message) => stream.write(message));

    // Handle client disconnect
    ws.on('close', () => stream.end());
  });
};