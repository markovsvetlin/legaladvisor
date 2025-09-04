import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './user/routes';
import { authMiddleware } from './middleware/auth';
import { redis } from './utils/redis';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', userRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ 
    message: 'This is a protected route',
    user: req.user 
  });
});


// Initialize Redis and start server
async function startServer() {
  try {
    // Connect to Redis (will gracefully handle connection failures)
    await redis.connect();
    
    app.listen(PORT, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/api/health`);
      console.log(`🔥 Redis caching: ${redis.isConnected() ? 'ENABLED' : 'DISABLED'}`);
    });
  } catch (error) {
    console.log('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
