import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

// Routes imports
import authRoutes from './routes/auth.routes';
import readingRoutes from './routes/reading.routes';
import analyticsRoutes from './routes/analytics.routes';
import reportRoutes from './routes/report.routes';
import extraRoutes from './routes/extra.routes';
import { startReminderWorker } from './utils/reminderWorker';

const app = express();
const PORT = process.env.PORT || 5000;

// Security configuration
app.use(helmet({
  crossOriginResourcePolicy: false // Allows client to fetch uploaded media images from backend
}));

// CORS configuration (allow local dev ports as well as production sites)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5000',
  'https://amma-sugar-tracker.onrender.com' // customizable for user's render static site URL
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all during development fallback
    }
  },
  credentials: true
}));

// Rate limiter - protect endpoints from abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', limiter);

// Express body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload folders exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve uploaded documents statically
app.use('/uploads', express.static(uploadDir));

// API Routing
app.use('/api/auth', authRoutes);
app.use('/api/reading', readingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', reportRoutes);
app.use('/api/extra', extraRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve frontend assets in production if compiled together
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
  }
}

// Global 500 Error handler middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database provider configured: ${process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite' : 'PostgreSQL'}`);
  startReminderWorker();
});
