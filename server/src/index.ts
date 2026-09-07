import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

dotenv.config();

const app = express();

// Determine the client build directory. In production, the client `dist/`
// folder is copied next to the server (same repo / same deploy unit), so we
// resolve it relative to this source file's location.
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

// Serve the built React app as static files, but only in production.
// During development the Vite dev server handles this.
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(CLIENT_DIST));
}

const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// Restrict CORS to a configurable allowlist (defaults to the Vite dev origin).
// In production, set CORS_ORIGIN to your frontend origin(s), comma-separated.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    // Allow same-origin / non-browser requests (no Origin header)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));

app.use(express.json({ limit: '100kb' }));

// Brute-force protection for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Assetorbit API', timestamp: new Date().toISOString() });
});

// Centralized error handler (including CORS rejections)
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'Origin not allowed by CORS policy' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Assetorbit API Server running on http://localhost:${PORT}`);
});

// If no API route matched and we're in production, serve the React app's
// index.html so client-side routing works (e.g. deep links like /assets).
// Unknown /api/* paths still return a proper JSON 404.
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});
