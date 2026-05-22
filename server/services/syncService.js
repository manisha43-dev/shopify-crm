const Contact = require('../models/Contact');
const Order = require('../models/Order');
const { Deal, AbandonedCart, Product } = require('../models/indexModel');
const ShopifyStore = require('../models/shopifyStoreModel');
const ShopifyAPIService = require('./shopifyApiService');

class SyncService {
    constructor(shopDomain) {
        this.shopDomain = shopDomain;
    }

    async getAPI() {
        const store = await ShopifyStore.findOne({ shopDomain: this.shopDomain });
        if (!store) throw new Error('Store not found');
        const token = store.getAccessToken();
        return new ShopifyAPIService(this.shopDomain, token);
    }

    //  Deduplication: find or create contact 
    async upsertContact(shopifyCustomer) {
        const query = {
            $or: [
                { shopifyCustomerId: String(shopifyCustomer.id), shopDomain: this.shopDomain },
                { email: shopifyCustomer.email?.toLowerCase(), shopDomain: this.shopDomain },
            ],
        };

        const lv = parseFloat(shopifyCustomer.total_spent || 0);
        const oc = parseInt(shopifyCustomer.orders_count || 0);

        const update = {
            shopifyCustomerId: String(shopifyCustomer.id),
            shopDomain: this.shopDomain,
            firstName: shopifyCustomer.first_name,
            lastName: shopifyCustomer.last_name,
            email: shopifyCustomer.email?.toLowerCase(),
            phone: shopifyCustomer.phone,
            defaultAddress: shopifyCustomer.default_address,
            addresses: shopifyCustomer.addresses || [],
            totalSpent: lv,
            ordersCount: oc,
            averageOrderValue: oc > 0 ? lv / oc : 0,
            emailOptIn: shopifyCustomer.accepts_marketing,
            marketingOptInLevel: shopifyCustomer.marketing_opt_in_level,
            shopifyTags: shopifyCustomer.tags ? shopifyCustomer.tags.split(',').map(t => t.trim()) : [],
            status: oc > 0 ? 'customer' : 'lead',
            isVip: lv > 50000,
            lastSyncedAt: new Date(),
        };

        const contact = await Contact.findOneAndUpdate(query, { $set: update },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true });

        return contact;
    }

    //  Sync all customers 
   async syncAllCustomers() {
    await ShopifyStore.findOneAndUpdate(
        { shopDomain: this.shopDomain },
        { 'syncStatus.customers': 'running' }
    );

    try {
        const api = await this.getAPI();
        console.log(`🔄 Fetching customers for ${this.shopDomain}...`);
        
        const customers = await api.getAllCustomers();
        console.log(`📦 Found ${customers.length} customers`);

        let synced = 0;
        for (const customer of customers) {
            await this.upsertContact(customer);
            synced++;
        }

        await ShopifyStore.findOneAndUpdate(
            { shopDomain: this.shopDomain },
            { 'syncStatus.customers': 'done', lastSyncAt: new Date(), errorCount: 0 }
        );

        console.log(`✅ Synced ${synced} customers`);
        return { synced, total: customers.length };

    } catch (err) {
        // ← This will now show the EXACT error
        console.error(`❌ Customer sync failed:`, err.message);
        console.error(`❌ Full error:`, err.response?.data || err.stack);
        
        await ShopifyStore.findOneAndUpdate(
            { shopDomain: this.shopDomain },
            { 'syncStatus.customers': 'error', $inc: { errorCount: 1 } }
        );
        throw err;
    }
}


    //  Upsert a single order 
    async upsertOrder(shopifyOrder) {
        // Find linked contact
        let contact = null;
        if (shopifyOrder.customer?.id) {
            contact = await Contact.findOne({
                shopifyCustomerId: String(shopifyOrder.customer.id),
                shopDomain: this.shopDomain,
            });
        }
        if (!contact && shopifyOrder.email) {
            contact = await Contact.findOne({
                email: shopifyOrder.email.toLowerCase(),
                shopDomain: this.shopDomain,
            });
        }

        const refunds = (shopifyOrder.refunds || []).map(r => ({
            shopifyRefundId: String(r.id),
            amount: r.transactions?.reduce((s, t) => s + parseFloat(t.amount || 0), 0) || 0,
            reason: r.note,
            createdAt: r.created_at,
        }));

        const orderData = {
            shopifyOrderId: String(shopifyOrder.id),
            shopifyOrderNumber: String(shopifyOrder.order_number),
            shopDomain: this.shopDomain,
            contactId: contact?._id,
            customerEmail: shopifyOrder.email?.toLowerCase(),
            lineItems: (shopifyOrder.line_items || []).map(li => ({
                shopifyLineItemId: String(li.id),
                productId: String(li.product_id),
                variantId: String(li.variant_id),
                title: li.title,
                variantTitle: li.variant_title,
                quantity: li.quantity,
                price: parseFloat(li.price),
                sku: li.sku,
                vendor: li.vendor,
                productType: li.product_type,
            })),
            totalPrice: parseFloat(shopifyOrder.total_price || 0),
            subtotalPrice: parseFloat(shopifyOrder.subtotal_price || 0),
            totalTax: parseFloat(shopifyOrder.total_tax || 0),
            totalDiscounts: parseFloat(shopifyOrder.total_discounts || 0),
            currency: shopifyOrder.currency,
            financialStatus: shopifyOrder.financial_status,
            fulfillmentStatus: shopifyOrder.fulfillment_status,
            gateway: shopifyOrder.payment_gateway,
            paymentStatus: shopifyOrder.financial_status === 'paid' ? 'success' : 'pending',
            refunds,
            totalRefunded: refunds.reduce((s, r) => s + r.amount, 0),
            cancelledAt: shopifyOrder.cancelled_at,
            cancelReason: shopifyOrder.cancel_reason,
            closedAt: shopifyOrder.closed_at,
            shopifyCreatedAt: shopifyOrder.created_at,
            lastSyncedAt: new Date(),
        };

        const order = await Order.findOneAndUpdate(
            { shopifyOrderId: String(shopifyOrder.id), shopDomain: this.shopDomain },
            { $set: orderData },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        // Create/update CRM Deal
        if (contact) {
            const stage = shopifyOrder.financial_status === 'paid' ? 'won'
                : shopifyOrder.cancelled_at ? 'lost' : 'new';

            const deal = await Deal.findOneAndUpdate(
                { orderId: order._id },
                {
                    $set: {
                        title: `Order #${shopifyOrder.order_number}`,
                        contactId: contact._id,
                        orderId: order._id,
                        shopDomain: this.shopDomain,
                        value: parseFloat(shopifyOrder.total_price),
                        currency: shopifyOrder.currency,
                        stage,
                        source: 'shopify',
                    },
                },
                { upsert: true, returnDocument: 'after' }
            );

            order.dealId = deal._id;
            await order.save();

            // Update contact last order date
            await Contact.findByIdAndUpdate(contact._id, {
                $max: { lastOrderDate: new Date(shopifyOrder.created_at) },
                $min: { firstOrderDate: new Date(shopifyOrder.created_at) },
            });
        }

        return order;
    }

    // Upsert product
    async upsertProduct(payload) {
        const { Product } = require('../models/indexModel');
        await Product.findOneAndUpdate(
            { shopifyProductId: String(payload.id), shopDomain: this.shopDomain },
            {
                $set: {
                    title: payload.title,
                    vendor: payload.vendor,
                    productType: payload.product_type,
                    tags: payload.tags ? payload.tags.split(',').map(t => t.trim()) : [],
                    status: payload.status,
                    variants: (payload.variants || []).map(v => ({
                        variantId: String(v.id),
                        title: v.title,
                        price: parseFloat(v.price),
                        sku: v.sku,
                        inventory: v.inventory_quantity,
                    })),
                    images: (payload.images || []).map(i => i.src),
                    shopifyCreatedAt: payload.created_at,
                    lastSyncedAt: new Date(),
                },
            },
            { upsert: true, returnDocument: 'after' }
        );
    }


    //  Sync all orders 
   async syncAllOrders() {
    await ShopifyStore.findOneAndUpdate(
        { shopDomain: this.shopDomain },
        { 'syncStatus.orders': 'running' }
    );

    try {
        const api = await this.getAPI();

        // First sync: fetch all history. Subsequent syncs: last 90 days only.
        const existingCount = await Order.countDocuments({ shopDomain: this.shopDomain });
        const sinceDate = existingCount > 0
            ? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
            : null;

        const orders = await api.getAllOrders(sinceDate);
        console.log(`Syncing ${orders.length} orders for ${this.shopDomain}`);

        for (const order of orders) {
            await this.upsertOrder(order);
        }

        await ShopifyStore.findOneAndUpdate(
            { shopDomain: this.shopDomain },
            { 
                'syncStatus.orders': 'done',
                lastSyncAt: new Date(),
                errorCount: 0,        // reset error counter on success
            }
        );

        return { synced: orders.length };
    } catch (err) {
        console.error(`❌ Order sync failed:`, err.message);
        console.error(`❌ Full error:`, err.response?.data || err.stack);

        await ShopifyStore.findOneAndUpdate(
            { shopDomain: this.shopDomain },
            { 'syncStatus.orders': 'error', $inc: { errorCount: 1 } }
        );
        throw err;
    }
}

    //  Sync products 
    async syncAllProducts() {
    await ShopifyStore.findOneAndUpdate(
        { shopDomain: this.shopDomain },
        { 'syncStatus.products': 'running' }
    );

    try {
        const api = await this.getAPI();
        const products = await api.getAllProducts();

        for (const p of products) {
            await Product.findOneAndUpdate(
                { shopifyProductId: String(p.id), shopDomain: this.shopDomain },
                {
                    $set: {
                        title: p.title, vendor: p.vendor,
                        productType: p.product_type,
                        tags: p.tags ? p.tags.split(',').map(t => t.trim()) : [],
                        status: p.status,
                        variants: (p.variants || []).map(v => ({
                            variantId: String(v.id), title: v.title,
                            price: parseFloat(v.price), sku: v.sku,
                            inventory: v.inventory_quantity,
                        })),
                        images: (p.images || []).map(i => i.src),
                        shopifyCreatedAt: p.created_at,
                        lastSyncedAt: new Date(),  // ← errorCount removed from here
                    },
                },
                { upsert: true }
            );
        }

        // ↓ errorCount, lastSyncAt belong here on the ShopifyStore record
        await ShopifyStore.findOneAndUpdate(
            { shopDomain: this.shopDomain },
            { 'syncStatus.products': 'done', lastSyncAt: new Date(), errorCount: 0 }
        );

        return { synced: products.length };
    } catch (err) {
        console.error(`❌ Product sync failed:`, err.message);
        console.error(`❌ Full error:`, err.response?.data || err.stack);

        await ShopifyStore.findOneAndUpdate(
            { shopDomain: this.shopDomain },
            { 'syncStatus.products': 'error', $inc: { errorCount: 1 } }
        );
        throw err;
    }
}

    //  Upsert abandoned cart 
    async upsertAbandonedCart(checkout) {
        if (!checkout.email && !checkout.cart_token) return;

        let contact = null;
        if (checkout.email) {
            contact = await Contact.findOne({
                email: checkout.email.toLowerCase(),
                shopDomain: this.shopDomain,
            });
        }

        await AbandonedCart.findOneAndUpdate(
            { shopifyCartToken: checkout.token || checkout.cart_token, shopDomain: this.shopDomain },
            {
                $set: {
                    shopifyCheckoutId: String(checkout.id),
                    shopDomain: this.shopDomain,
                    contactId: contact?._id,
                    email: checkout.email?.toLowerCase(),
                    lineItems: (checkout.line_items || []).map(li => ({
                        productId: String(li.product_id),
                        variantId: String(li.variant_id),
                        title: li.title,
                        quantity: li.quantity,
                        price: parseFloat(li.price),
                    })),
                    totalPrice: parseFloat(checkout.total_price || 0),
                    abandonedCheckoutUrl: checkout.abandoned_checkout_url,
                    shopifyUpdatedAt: checkout.updated_at,
                },
            },
            { upsert: true, returnDocument: 'after' }
        );
    }
}

module.exports = SyncService;