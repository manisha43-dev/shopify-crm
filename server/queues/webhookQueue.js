const Bull = require('bull');
const SyncService = require('../services/syncService');
const Contact = require('../models/Contact');
const Order = require('../models/Order');
const { AbandonedCart, WebhookEvent } = require('../models/index');

const webhookQueue = new Bull('webhook-processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
    },
    defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

//  Process webhook jobs 
webhookQueue.process(async (job) => {
    const { topic, shopDomain, payload, webhookId } = job.data;
    const sync = new SyncService(shopDomain);

    console.log(` Processing webhook: ${topic} for ${shopDomain}`);

    try {
        switch (topic) {
            // Customer events 
            case 'customers/create':
            case 'customers/update':
                await sync.upsertContact(payload);
                break;

            case 'customers/delete':
                await Contact.findOneAndUpdate(
                    { shopifyCustomerId: String(payload.id), shopDomain },
                    { $set: { status: 'churned', tags: ['deleted-in-shopify'] } }
                );
                break;

            //  Order events 
            case 'orders/create':
            case 'orders/updated':
            case 'orders/paid':
            case 'orders/fulfilled':
            case 'orders/cancelled':
                await sync.upsertOrder(payload);

                // For abandoned cart recovery — mark as recovered if order placed
                if (topic === 'orders/create' && payload.email) {
                    await AbandonedCart.findOneAndUpdate(
                        { email: payload.email.toLowerCase(), shopDomain, status: 'open' },
                        { $set: { status: 'recovered', recoveredAt: new Date() } }
                    );
                }
                break;

            // Refund events 
            case 'refunds/create': {
                const orderId = payload.order_id;
                const refundAmount = (payload.transactions || [])
                    .reduce((s, t) => s + parseFloat(t.amount || 0), 0);

                await Order.findOneAndUpdate(
                    { shopifyOrderId: String(orderId), shopDomain },
                    {
                        $push: {
                            refunds: {
                                shopifyRefundId: String(payload.id),
                                amount: refundAmount,
                                reason: payload.note,
                                createdAt: payload.created_at,
                            },
                        },
                        $inc: { totalRefunded: refundAmount },
                    }
                );

                // Mark contact as at-risk if multiple refunds
                const order = await Order.findOne({ shopifyOrderId: String(orderId), shopDomain });
                if (order?.contactId) {
                    const refundCount = await Order.countDocuments({
                        contactId: order.contactId,
                        shopDomain,
                        totalRefunded: { $gt: 0 },
                        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
                    });
                    if (refundCount >= 2) {
                        await Contact.findByIdAndUpdate(order.contactId, {
                            $set: { isAtRisk: true },
                            $addToSet: { tags: 'at-risk' },
                        });
                    }
                }
                break;
            }

            //  Cart events 
            case 'checkouts/create':
            case 'checkouts/update':
                await sync.upsertAbandonedCart(payload);
                break;

            //App uninstalled 
            case 'app/uninstalled': {
                const ShopifyStore = require('../models/shopifyStoreModel');
                await ShopifyStore.findOneAndUpdate(
                    { shopDomain },
                    { $set: { isActive: false } }
                );
                console.log(`App uninstalled: ${shopDomain}`);
                break;
            }

            // Product events 
            case 'products/create':
            case 'products/update':
                await sync.upsertProduct(payload);
                break;

            default:
                console.log(`Unhandled webhook topic: ${topic}`);
        }

        // Mark webhook as processed
        await WebhookEvent.findOneAndUpdate(
            { webhookId },
            { $set: { status: 'processed', processedAt: new Date() } }
        );

        return { success: true, topic };
    } catch (err) {
        await WebhookEvent.findOneAndUpdate(
            { webhookId },
            { $set: { status: 'failed', errorMessage: err.message }, $inc: { attempts: 1 } }
        );
        throw err;
    }
});

webhookQueue.on('completed', (job) => {
    console.log(`Webhook job completed: ${job.data.topic}`);
});

webhookQueue.on('failed', (job, err) => {
    console.error(`Webhook job failed: ${job.data.topic}`, err.message);
});

module.exports = webhookQueue;