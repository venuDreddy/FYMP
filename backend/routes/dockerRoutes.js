import { Router } from 'express';
import expressws from 'express-ws';
const router = Router();
expressws(router);
import { listContainers, startContainer, stopContainer, pullImage, createContainer} from '../controllers/dockerController.js';
import { readFile,writeFile,listFiles, attachTerminal } from '../controllers/dockerController.js';
import authMiddleware from '../middleware/authMiddleware.js';

// Protected routes (only authenticated users can access these)
router.get('/containers', authMiddleware, listContainers);
router.post('/containers/:containerId/start', authMiddleware, startContainer);
router.post('/containers/:containerId/stop', authMiddleware, stopContainer);
router.post('/images/pull', authMiddleware, pullImage);
router.post('/containers/create', authMiddleware, createContainer);


// File operations
router.post('/files/read', authMiddleware, readFile);
router.post('/files/write', authMiddleware, writeFile);
router.post('/files/list', authMiddleware, listFiles);

// Terminal access
router.ws('/containers/:containerId/terminal', attachTerminal);

export default router;