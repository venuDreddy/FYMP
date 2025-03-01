import Docker from 'dockerode';
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
      WorkingDir:'/app',
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

  if (!containerId || !filePath) {
    return res.status(400).json({ error: 'containerId and filePath are required' });
  }

  try {
    const container = docker.getContainer(containerId);

    // Create an exec instance to run the `cat` command
    const exec = await container.exec({
      Cmd: ['cat', filePath],
      AttachStdout: true,
      AttachStderr: true,
    });

    // Start the exec instance
    const stream = await exec.start({ hijack: true, stdin: true });

    let fileContent = '';

    // Demux the stream (stdout and stderr)
    docker.modem.demuxStream(stream, process.stdout, process.stderr);

    // Collect data from stdout
    stream.on('data', (chunk) => {
      fileContent += chunk.toString(); // Append chunks to fileContent
    });

    // Handle stream end
    stream.on('end', () => {

      res.json({ content: fileContent.toString('base64') }); // Send the file content as response
    });

    // Handle stream errors
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ error: 'Failed to read file from container' });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Write a file to the container
export const writeFile = async (req, res) => {
  const { containerId, filePath, content } = req.body;
  console.log(content+" "+filePath);
  try {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: ['sh', '-c', `echo '${content}' > ${filePath}`],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: true });
    stream.on('data',()=>{});
    stream.on('end', () => res.json({ message: 'File saved successfully' }));
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

// List files in a directory
export const listFiles = async (req, res) => {
  const { containerId, dirPath } = req.body;
  try {
    const container = docker.getContainer(containerId);
    const exec = await container.exec({
      Cmd: ['ls', dirPath],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: true });
    let output = '';
    
    stream.on('data', (chunk) => (output += chunk.toString()));
    stream.on('end', () => {
      res.json({ files: output })});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Terminal access:
export const attachTerminal = (ws, req) => {
  const { containerId } = req.params;

  // Check if containerId is valid
  if (!containerId) {
    ws.send(JSON.stringify({ error: 'No containerId provided' }));
    return;
  }

  // Get the Docker container instance
  const container = docker.getContainer(containerId);
    console.log(containerId);
  // Check if container exists
  container.inspect(async (err, data) => {
    if (err || !data) {
      ws.send(JSON.stringify({ error: `No such container: ${containerId}` }));
      return;
    }

    // Create an exec instance to start a shell in the container
    const exec = await container.exec({
      Cmd: ['/bin/bash'],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      WorkingDir:'/app',
    });

     exec.start({ hijack:true,stdin: true, tty: true },(err, stream) => {
      if (err) {
        ws.send(JSON.stringify({ error: err.message }));
        return;
      }
      // Send output from container to client
      stream.on('data', (chunk) => {
       const output=chunk.toString();
        console.log(output);
        ws.send(output);
      });
      stream.on('error',(err)=>console.error(err));
      // Send input from client to container
      ws.on('message',  (message) => {
        console.log(message);
        stream.write(message+'\r');
      });

      // Handle WebSocket close event
      ws.on('close', () => {
        console.log("Client disconnected.");
        stream.end(); // Close the exec stream properly when WebSocket closes
      });

      // Handle errors in WebSocket connection
      ws.on('error', (error) => {
        console.error("WebSocket Error:", error);
      });
    });
  });
};