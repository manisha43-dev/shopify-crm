const mongoose = require('mongoose');

// Deal (Pipeline) 
const DealSchema = new mongoose.Schema({
    title: { type: String, required: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    shopDomain: String,
    value: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    stage: {
        type: String,
        enum: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'],
        default: 'new',
    },
    source: { type: String, default: 'shopify' },
    closedAt: Date,
    notes: String,
    tags: [String],
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// AbandonedCart 
const AbandonedCartSchema = new mongoose.Schema({
    shopifyCartToken: { type: String, index: true },
    shopifyCheckoutId: { type: String, index: true },
    shopDomain: { type: String, required: true },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
    email: { type: String, lowercase: true },
    lineItems: [{
        productId: String,
        variantId: String,
        title: String,
        quantity: Number,
        price: Number,
    }],
    totalPrice: Number,
    abandonedCheckoutUrl: String,
    status: {
        type: String,
        enum: ['open', 'recovered', 'expired', 'email_sent'],
        default: 'open',
    },
    recoveryEmailsSent: { type: Number, default: 0 },
    lastEmailSentAt: Date,
    recoveredAt: Date,
    shopifyUpdatedAt: Date,
}, { timestamps: true });

// Product 
const ProductSchema = new mongoose.Schema({
    shopifyProductId: { type: String, required: true },
    shopDomain: { type: String, required: true },
    title: String,
    vendor: String,
    productType: String,
    tags: [String],
    status: String,
    variants: [{
        variantId: String,
        title: String,
        price: Number,
        sku: String,
        inventory: Number,
    }],
    images: [String],
    shopifyCreatedAt: Date,
    lastSyncedAt: Date,
}, { timestamps: true });

ProductSchema.index({ shopifyProductId: 1, shopDomain: 1 }, { unique: true });

//WebhookEvent 
const WebhookEventSchema = new mongoose.Schema({
    webhookId: { type: String, required: true, unique: true },
    topic: { type: String, required: true },
    shopDomain: String,
    status: { type: String, enum: ['pending', 'processed', 'failed'], default: 'pending' },
    attempts: { type: Number, default: 0 },
    payload: mongoose.Schema.Types.Mixed,
    errorMessage: String,
    processedAt: Date,
    createdAt: { type: Date, default: Date.now, expires: 86400 },
});

// User (CRM admin/agent)
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'manager', 'agent'], default: 'agent' },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.matchPassword = async function (entered) {
    return bcrypt.compare(entered, this.password);
};

module.exports = {
    Deal: mongoose.model('Deal', DealSchema),
    AbandonedCart: mongoose.model('AbandonedCart', AbandonedCartSchema),
    Product: mongoose.model('Product', ProductSchema),
    WebhookEvent: mongoose.model('WebhookEvent', WebhookEventSchema),
    User: mongoose.model('User', UserSchema),
};