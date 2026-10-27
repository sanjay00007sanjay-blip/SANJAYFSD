require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { connectDB, isMongoConnected } = require('./config/db');
const { initTelemetrySocket } = require('./sockets/telemetrySocket');
const { checkAiMicroserviceHealth } = require('./services/aiServiceClient');

// Routes
const authRoutes = require('./routes/authRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const alertRoutes = require('./routes/alertRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const reportRoutes = require('./routes/reportRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const server = http.createServer(app);

// Configure Socket.io with permissive CORS for development & production
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  if (req.path !== '/api/health') {
    console.log(`[HTTP] ${req.method} ${req.path}`);
  }
  next();
});

// Initialize Socket.io events
initTelemetrySocket(io);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditRoutes);

// System Diagnostic & Health Endpoint
app.get('/api/health', async (req, res) => {
  const aiHealth = await checkAiMicroserviceHealth();
  res.status(200).json({
    status: 'operational',
    service: 'EcoFlow AI Industrial Backend',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      connected: isMongoConnected(),
      mode: isMongoConnected() ? 'MONGODB_CLUSTERED' : 'RESILIENT_IN_MEMORY_PERSISTENCE',
    },
    aiMicroservice: aiHealth,
    realTimeSockets: {
      connectedClients: io.engine.clientsCount,
    },
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to EcoFlow AI Industrial Water Treatment & Compliance Platform API',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;

// Connect DB and start listening
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🌊 EcoFlow AI Backend Server running on port ${PORT}`);
    console.log(`📡 WebSocket server listening on ws://localhost:${PORT}`);
    console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
});

module.exports = { app, server };
