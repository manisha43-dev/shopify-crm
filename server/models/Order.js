const mongoose = require('mongoose');

const LineItemSchema = new mongoose.Schema({
  shopifyLineItemId: String,
  productId: String,
  variantId: String,
  title: String,
  variantTitle: String,
  quantity: Number,
  price: Number,
  sku: String,
  vendor: String,
  productType: String,
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  // Shopify source
  shopifyOrderId: { type: String, required: true, index: true },
  shopifyOrderNumber: { type: String },
  shopDomain: { type: String, required: true, index: true },

  // Linked CRM contact
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', index: true },
  customerEmail: { type: String, lowercase: true },

  // Order details
  lineItems: [LineItemSchema],
  totalPrice: { type: Number },
  subtotalPrice: { type: Number },
  totalTax: { type: Number },
  totalDiscounts: { type: Number },
  currency: { type: String, default: 'INR' },

  // Status
  financialStatus: { type: String }, // pending, authorized, paid, refunded, voided
  fulfillmentStatus: { type: String }, // null, partial, fulfilled

  // Payment
  gateway: { type: String },
  paymentStatus: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },

  // Refund info
  refunds: [{
    shopifyRefundId: String,
    amount: Number,
    reason: String,
    createdAt: Date,
  }],
  totalRefunded: { type: Number, default: 0 },

  // Tracking
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  closedAt: { type: Date },
  shopifyCreatedAt: { type: Date },

  // CRM Deal reference
  dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },

  // Raw snapshot
  shopifyRaw: { type: mongoose.Schema.Types.Mixed },
  lastSyncedAt: { type: Date },
}, { timestamps: true });

OrderSchema.index({ shopifyOrderId: 1, shopDomain: 1 }, { unique: true });

module.exports = mongoose.model('Order', OrderSchema);