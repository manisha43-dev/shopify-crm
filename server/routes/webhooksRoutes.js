const express = require('express');
const router = express.Router();
const { verifyShopifyWebhook } = require('../middleware/auth');
const { WebhookEvent } = require('../models/indexModel');
const webhookQueue = require('../queues/webhookQueue');

// POST /api/webhooks/shopify
router.post('/shopify', async (req, res) => {
    const topic = req.headers['x-shopify-topic'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const webhookId = req.headers['x-shopify-webhook-id'];
    const payload = req.body;

    //Validation required headers first
    if (!topic || !webhookId || !shopDomain) {
        return res.status(400).json({ error: 'Missing required webhook headers' })
    }

    // Idempotency check
    const existing = await WebhookEvent.findOne({ webhookId });
    if (existing) {
        console.log(` Duplicate webhook skipped: ${webhookId}`);
        return res.status(200).json({ received: true });
    }

    // Log the incoming event
    await WebhookEvent.create({
        webhookId,
        topic,
        shopDomain,
        status: 'pending',
        payload,
    });

    // Push to async processing queue
    await webhookQueue.add(
        { topic, shopDomain, payload, webhookId },
        { jobId: webhookId }
    );

    console.log(` Queued webhook: ${topic} from ${shopDomain}`);
    return res.status(200).json({ received: true });
});

// GET /api/webhooks/log — recent webhook events for admin dashboard
router.get('/log', async (req, res) => {
    const events = await WebhookEvent.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .select('-payload');
    res.json({ events });
});

module.exports = router;