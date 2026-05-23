const dotenv=require('dotenv');
dotenv.config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const authRoutes=require('./routes/authRoutes')
const shopifyRoutes=require('./routes/shopifyRoutes')
const apiRoutes=require('./routes/apiRoutes')
const webhookRoutes=require('./routes/webhooksRoutes')

const app = express();

//  Connect Database 
connectDB();

//  Security middleware 
app.use(helmet());
app.use(cors({ origin:'*', credentials: true }));
app.use(morgan('dev'));

// Rate limiter for general API
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

//  CRITICAL: Raw body for webhook HMAC verification 
app.use('/api/webhooks/shopify', (req, res, next) => {
  let data = '';
  req.on('data', chunk => (data += chunk));
  req.on('end', () => {
    req.rawBody = data;
    req.body = JSON.parse(data || '{}');
    next();
  });
});

//  JSON parser for all other routes 
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

//  Routes
app.use('/api/auth',     authRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/webhooks',webhookRoutes);
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Global error handler 
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
   if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
  console.log(` Webhook endpoint: http://localhost:${PORT}/api/webhooks/shopify`);

  // Start webhook queue processor
  require('./queues/webhookQueue');
});