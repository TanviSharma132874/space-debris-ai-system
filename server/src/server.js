require('./services/missionAuditService');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const connectDatabase = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const orbitalObjectRoutes = require('./routes/orbitalObjectRoutes');
const collisionPredictionRoutes = require('./routes/collisionPredictionRoutes');
const { generateSystemHealth } = require('./services/systemHealthService');
const { successResponse } = require('./utils/apiResponse');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Proper CORS Middleware
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.disable('x-powered-by');
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/orbital-objects', orbitalObjectRoutes);
app.use('/api/collision', collisionPredictionRoutes);

app.get('/api/system/health', async (req, res) => {
  try {
    const health = await generateSystemHealth();
    return successResponse(res, 200, 'System health retrieved successfully', health);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system health',
    });
  }
});

app.get('/', (req, res) => {
  res.send('<h1>Backend Server Running</h1>');
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'server',
    uptime: process.uptime(),
  });
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
