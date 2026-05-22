const crypto = require('crypto');

// 1. SHOPIFY WEBHOOK HMAC VERIFICATION
const verifyShopifyWebhook = (req, res, next) => {

    // Shopify sends this header with every webhook request
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    const secret = process.env.SHOPIFY_API_SECRET;

    // Reject if header or secret is missing
    if (!hmacHeader || !secret) {
        return res.status(401).json({ error: 'Missing HMAC header or secret' });
    }

    // req.rawBody is the raw string body — set in server/index.js
    // using a custom body parser BEFORE express.json()
    const body = req.rawBody;
    if (!body) {
        return res.status(400).json({ error: 'No raw body available for HMAC verification' });
    }

    // Compute HMAC-SHA256 of the raw request body
    // using the Shopify API Secret as the key
    const computed = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

    // Compare computed hash vs Shopify's header value
    try {
        const isValid = crypto.timingSafeEqual(
            Buffer.from(computed),
            Buffer.from(hmacHeader)
        );
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid HMAC signature' });
        }
    } catch {
        return res.status(401).json({ error: 'HMAC verification failed' });
    }

    next();
};


// 2. JWT PROTECT — for CRM API routes
const jwt = require('jsonwebtoken');
const { User } = require('../models/indexModel');

const protect = async (req, res, next) => {
    let token;

    // Token: Authorization: Bearer <token>
    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized' });
    }

    try {
        // Verify and decode the token using our JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the full user object to req.user (minus password)
        req.user = await User.findById(decoded.id).select('-password');

        next(); // token is valid — proceed to route handler
    } catch {
        // Token is expired, or invalid
        res.status(401).json({ error: 'Token invalid or expired' });
    }
};


// 3. ADMIN ONLY — role-based access guard
const adminOnly = (req, res, next) => {
    // protect() must run before adminOnly()
    // so req.user is already populated
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = { verifyShopifyWebhook, protect, adminOnly };