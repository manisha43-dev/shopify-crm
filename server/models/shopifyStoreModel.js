const mongoose = require('mongoose');
const crypto = require('crypto');
const { type } = require('os');


const ShopifyStoreSchema = new mongoose.Schema({
    shopDomain: { type: String, required: true, unique: true, trim: true },
    accessTokenEncrypted: { type: String, default: '' },
    scopes: [String],
    isActive: { type: Boolean, default: true },
    installedAt: { type: Date },
    syncStatus: {
        customers: { type: String, enum: ['idle', 'running', 'error', 'done'], default: 'idle' },
        orders: { type: String, enum: ['idle', 'running', 'error', 'done'], default: 'idle' },
        products: { type: String, enum: ['idle', 'running', 'error', 'done'], default: 'idle' },
        carts: { type: String, enum: ['idle', 'running', 'error', 'done'], default: 'idle' },

    },
    errorCount: { type: Number, default: 0 },
    webhookIds: [String],
}, { timestamps: true });


//Encrypt access token before saving
ShopifyStoreSchema.methods.setAccessToken = function (token) {
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'a'.repeat(32), 'utf8').slice(0, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    this.accessTokenEncrypted = iv.toString('hex') + ':' + encrypted;
};

//Decrypt access token

ShopifyStoreSchema.methods.getAccessToken = function () {
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'a'.repeat(32), 'utf8').slice(0, 32);
    const [ivHex, encrypted] = this.accessTokenEncrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}


module.exports = mongoose.model('ShopifyStore', ShopifyStoreSchema);
