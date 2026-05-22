const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const axios = require('axios');
const ShopifyStore = require('../models/shopifyStoreModel');
const ShopifyAPIService = require('../services/shopifyApiService');
const SyncService = require('../services/syncService');
const redis = require('../config/redis');


// GET /api/shopify/install?shop=mystore.myshopify.com
router.get('/install', (req, res) => {
    const { shop } = req.query;
    if (!shop) return res.status(400).json({ error: 'shop parameter required' });

    // Generate & store state nonce (CSRF protection)
    const state = crypto.randomBytes(16).toString('hex');
    redis.setex(`oauth:state:${state}`, 300, shop); // expires in 5 min

    const scopes = process.env.SHOPIFY_SCOPES;
    const redirectUri = process.env.SHOPIFY_REDIRECT_URI;
    const apiKey = process.env.SHOPIFY_API_KEY;

    const installUrl =
        `https://${shop}/admin/oauth/authorize` +
        `?client_id=${apiKey}` +
        `&scope=${scopes}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`;

    res.redirect(installUrl);
});

// GET /api/shopify/callback
router.get('/callback', async (req, res) => {
    const { shop, code, state, hmac } = req.query;

    // Validate state nonce
    const storedShop = await redis.get(`oauth:state:${state}`);
    if (!storedShop || storedShop !== shop) {
        return res.status(403).json({ error: 'Invalid state parameter — possible CSRF attack' });
    }
    await redis.del(`oauth:state:${state}`);

    // Validate HMAC
    const queryParams = Object.keys(req.query)
        .filter(k => k !== 'hmac')
        .sort()
        .map(k => `${k}=${req.query[k]}`)
        .join('&');

    const computedHmac = crypto
        .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
        .update(queryParams)
        .digest('hex');

    if (computedHmac !== hmac) {
        return res.status(403).json({ error: 'HMAC validation failed' });
    }

    try {
        // Exchange code for access token
        const tokenRes = await axios.post(
            `https://${shop}/admin/oauth/access_token`,
            {
                client_id: process.env.SHOPIFY_API_KEY,
                client_secret: process.env.SHOPIFY_API_SECRET,
                code,
            }
        );

        const { access_token, scope } = tokenRes.data;

        // Save/update store record with encrypted token
        let store = await ShopifyStore.findOne({ shopDomain: shop });
        if (!store) {
            store = new ShopifyStore({ shopDomain: shop });
        }
        store.setAccessToken(access_token);
        store.scopes = scope.split(',');
        store.isActive = true;
        await store.save();

        // Register webhooks
        try {
            const webhookBaseUrl = process.env.APP_URL || `http://localhost:5000`;
            const api = new ShopifyAPIService(shop, access_token);
            const webhookIds = await api.registerWebhooks(webhookBaseUrl);
            store.webhookIds = webhookIds;
            await store.save();
        } catch (err) {
            console.log('Webhook registration skipped:', err.message);
        }
        // Trigger initial background sync
        const syncService = new SyncService(shop);
        syncService.syncAllCustomers().catch(console.error);
        syncService.syncAllOrders().catch(console.error);
        syncService.syncAllProducts().catch(console.error);

        // Redirect to CRM dashboard
        res.redirect(`${process.env.CLIENT_URL}/settings/integrations?shop=${shop}&status=connected`);
    } catch (err) {
        console.error('OAuth callback error:', err.message);
        res.redirect(`${process.env.CLIENT_URL}/settings/integrations?status=error`);
    }
});

// Get connected stores 
router.get('/stores', async (req, res) => {
    const stores = await ShopifyStore.find({}, '-accessTokenEncrypted');
    res.json({ stores });
});

//Sync status
router.get('/sync-status/:shop', async (req, res) => {
    const store = await ShopifyStore.findOne({ shopDomain: req.params.shop });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json({ syncStatus: store.syncStatus, lastSyncAt: store.lastSyncAt, errorCount: store.errorCount });
});

// Force re-sync
router.post('/resync/:shop', async (req, res) => {
    const { entity } = req.body; // customers | orders | products
    const sync = new SyncService(req.params.shop);
    res.json({ message: `Re-sync started for ${entity}` });

    if (entity === 'customers') sync.syncAllCustomers().catch(console.error);
    if (entity === 'orders') sync.syncAllOrders().catch(console.error);
    if (entity === 'products') sync.syncAllProducts().catch(console.error);
});

// Disconnect store
router.delete('/disconnect/:shop', async (req, res) => {
    try {
        const store = await ShopifyStore.findOne({ shopDomain: req.params.shop });
        if (!store) return res.status(404).json({ error: 'Store not found' });

        // Delete webhooks from Shopify
        if (store.webhookIds?.length && store.accessTokenEncrypted) {
            try {
                const token = store.getAccessToken();
                const api = new ShopifyAPIService(req.params.shop, token);
                for (const id of store.webhookIds) {
                    await api.deleteWebhook(id).catch(() => { });
                }
            } catch (err) {
                console.log('Could not delete webhook:', err.message);

            }

        }

        store.isActive = false;
        store.accessTokenEncrypted = '';
        await store.save();
        res.json({ message: 'Store disconnected successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;