const mongoose = require('mongoose');


const AddressSchema = new mongoose.Schema({
  address1: String, address2: String,
  city: String, province: String,
  country: String, zip: String,
  phone: String,
}, { _id: false });

const ContactSchema = new mongoose.Schema({
  //Shopify source
  shopifyCustomerId: { type: String, index: true },
  shopDomain: { type: String, index: true },

  //Core identity
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true },

  //Addresses
  defaultAddress: AddressSchema,
  addresses: [AddressSchema],


  //eCommerce metrics (synced from Shopify)
  totalSpent: { type: Number, default: 0 },
  ordersCount: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  lastOrderDate: { type: Date },
  firstOrderDate: { type: Date },

  // CRM fields
  status: { type: String, enum: ['lead', 'contact', 'customer', 'churned'], default: 'lead' },
  source: { type: String, default: 'shopify' },
  tags: [String],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },

  // Marketing consent
  emailOptIn: { type: Boolean, default: false },
  smsOptIn: { type: Boolean, default: false },
  marketingOptInLevel: { type: String },



  // Risk / Segmentation flags
  isAtRisk: { type: Boolean, default: false },
  isVip: { type: Boolean, default: false },
  rfmScore: { type: Number },

  // Shopify raw data snapshot
  shopifyTags: [String],
  shopifyRaw: { type: mongoose.Schema.Types.Mixed },

  // Audit
  lastSyncedAt: { type: Date },
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
}, { timestamps: true });

// Compound indexes
ContactSchema.index({ email: 1, shopDomain: 1 }, { unique: true, sparse: true });
ContactSchema.index({ shopifyCustomerId: 1, shopDomain: 1 }, { unique: true, sparse: true });

// Virtual: full name
ContactSchema.virtual('fullName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
});

module.exports = mongoose.model('Contact', ContactSchema);

