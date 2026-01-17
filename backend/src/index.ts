import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Import routes
import { projectsRouter } from './routes/projects';
import { scenesRouter } from './routes/scenes';
import { shotsRouter } from './routes/shots';
import { panelsRouter } from './routes/panels';
import { aiRouter } from './routes/ai';
import { exportsRouter } from './routes/exports';
import { authRouter } from './routes/auth';
import { scriptsRouter } from './routes/scripts';
import { commentsRouter } from './routes/comments';
import { approvalsRouter } from './routes/approvals';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authenticate } from './middleware/authenticate';

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/projects', authenticate, projectsRouter);
app.use('/api/v1/scenes', authenticate, scenesRouter);
app.use('/api/v1/shots', authenticate, shotsRouter);
app.use('/api/v1/panels', authenticate, panelsRouter);
app.use('/api/v1/ai', authenticate, aiRouter);
app.use('/api/v1/exports', authenticate, exportsRouter);
app.use('/api/v1/scripts', authenticate, scriptsRouter);
app.use('/api/v1/comments', authenticate, commentsRouter);
app.use('/api/v1/approvals', authenticate, approvalsRouter);

// Error handling
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// WebSocket server for real-time collaboration
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  console.log('WebSocket client connected');

  ws.on('message', (message) => {
    // Handle real-time collaboration messages
    // TODO: Implement collaboration message handling
    console.log('Received message:', message.toString());
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Start server
const startServer = async () => {
  const { checkConnection } = await import('./lib/db');

  let retries = 5;
  while (retries > 0) {
    const isDbConnected = await checkConnection();
    if (isDbConnected) {
      break;
    }
    console.log(`Database not ready. Retrying in 5s... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    retries--;
  }

  // Note: We start the server even if DB fails initially, to allow health checks or static routes,
  // but requests needing DB will fail until it comes up.
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

export default app;
