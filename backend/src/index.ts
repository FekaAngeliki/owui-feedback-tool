import dotenv from 'dotenv';
// Load environment variables before any other imports
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { exportRoutes } from './routes/export.routes.js';
import { githubRoutes } from './routes/github.routes.js';
import { llmRoutes } from './routes/llm.routes.js';
import { swaggerSpec } from './swagger.config.js';

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Parse allowed origins from environment variable
const getAllowedOrigins = (): string[] | string => {
  const origins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173';
  
  // If it's a wildcard, return it as is
  if (origins === '*') return '*';
  
  // Split by comma and trim whitespace
  return origins.split(',').map(origin => origin.trim());
};

// CORS configuration with multiple origins support
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);
    
    // If wildcard, allow all origins
    if (allowedOrigins === '*') return callback(null, true);
    
    // Check if origin is in the allowed list
    if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/export', exportRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/llm', llmRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Server is running!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Display CORS configuration
  const allowedOrigins = getAllowedOrigins();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔒 CORS Configuration:');
  if (allowedOrigins === '*') {
    console.log('   ⚠️  All origins allowed (wildcard)');
  } else if (Array.isArray(allowedOrigins)) {
    console.log('   Allowed origins:');
    allowedOrigins.forEach(origin => console.log(`   • ${origin}`));
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📚 API Documentation:');
  console.log(`   👉 http://localhost:${PORT}/api-docs`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔗 Available endpoints:');
  console.log(`   • GET  http://localhost:${PORT}/health`);
  console.log(`   • POST http://localhost:${PORT}/api/export/conversation`);
  console.log(`   • POST http://localhost:${PORT}/api/export/qa-pair`);
  console.log(`   • GET  http://localhost:${PORT}/api/github/status`);
  console.log(`   • GET  http://localhost:${PORT}/api/github/tree`);
  console.log(`   • GET  http://localhost:${PORT}/api/github/files`);
  console.log(`   • POST http://localhost:${PORT}/api/llm/execute-prompt`);
  console.log(`   • GET  http://localhost:${PORT}/api/llm/status/:requestId`);
  console.log(`   • GET  http://localhost:${PORT}/api/llm/configurations`);
  console.log(`   • POST http://localhost:${PORT}/api/llm/test`);
  console.log(`   • POST http://localhost:${PORT}/api/llm/reload`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

export default app;