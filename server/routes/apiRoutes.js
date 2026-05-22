const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const Order = require('../models/Order');
const { Deal, AbandonedCart } = require('../models/indexModel');

// CONTACTS

// GET /api/contacts — with filters, search, pagination
router.get('/contacts', async (req, res) => {
    try {
        const {
            page = 1, limit = 20, search, status, tag,
            isVip, isAtRisk, shopDomain, sortBy = 'createdAt', order = 'desc'
        } = req.query;

        const filter = {};
        if (shopDomain) filter.shopDomain = shopDomain;
        if (status) filter.status = status;
        if (tag) filter.tags = tag;
        if (isVip === 'true') filter.isVip = true;
        if (isAtRisk === 'true') filter.isAtRisk = true;
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        const total = await Contact.countDocuments(filter);
        const contacts = await Contact.find(filter)
            .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ contacts, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/contacts/:id — contact detail with orders
router.get('/contacts/:id', async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ error: 'Contact not found' });

        const orders = await Order.find({ contactId: contact._id })
            .sort({ shopifyCreatedAt: -1 }).limit(20);

        const deals = await Deal.find({ contactId: contact._id }).sort({ createdAt: -1 });

        const abandonedCarts = await AbandonedCart.find({ contactId: contact._id })
            .sort({ createdAt: -1 }).limit(5);

        res.json({ contact, orders, deals, abandonedCarts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/contacts/:id — update CRM-owned fields
router.patch('/contacts/:id', async (req, res) => {
    try {
        const allowed = ['tags', 'notes', 'assignedTo', 'status'];
        const updates = {};
        allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

        const contact = await Contact.findByIdAndUpdate(
            req.params.id, { $set: updates }, { returnDocument: 'after' }
        );
        res.json({ contact });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PRODUCTS
router.get('/products', async (req, res) => {
    try {
        const { page = 1, limit = 20, shopDomain, status, search } = req.query;
        const { Product } = require('../models/indexModel');

        const filter = {};
        if (shopDomain) filter.shopDomain = shopDomain;
        if (status) filter.status = status;
        if (search) filter.title = { $regex: search, $options: 'i' };

        const total = await Product.countDocuments(filter);
        const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single product
router.get('/products/:id', async (req, res) => {
    try {
        const { Product } = require('../models/indexModel');
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ORDERS
router.get('/orders', async (req, res) => {
    try {
        const { page = 1, limit = 20, shopDomain, financialStatus, contactId } = req.query;
        const filter = {};
        if (shopDomain) filter.shopDomain = shopDomain;
        if (financialStatus) filter.financialStatus = financialStatus;
        if (contactId) filter.contactId = contactId;

        const total = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('contactId', 'firstName lastName email')
            .sort({ shopifyCreatedAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ orders, total, page: Number(page) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ABANDONED CARTS
router.get('/carts', async (req, res) => {
    try {
        const { page = 1, limit = 20, shopDomain, status = 'open' } = req.query;
        const filter = { status };
        if (shopDomain) filter.shopDomain = shopDomain;

        const total = await AbandonedCart.countDocuments(filter);
        const carts = await AbandonedCart.find(filter)
            .populate('contactId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        res.json({ carts, total });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

//  DEALS
router.get('/deals', async (req, res) => {
    try {
        const { shopDomain, stage } = req.query;
        const filter = {};
        if (shopDomain) filter.shopDomain = shopDomain;
        if (stage) filter.stage = stage;

        const deals = await Deal.find(filter)
            .populate('contactId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        // Group by stage for Kanban
        const grouped = {
            new: [], contacted: [], qualified: [], proposal: [], won: [], lost: [],
        };
        deals.forEach(d => grouped[d.stage]?.push(d));

        res.json({ deals, grouped });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch('/deals/:id', async (req, res) => {
    try {
        const deal = await Deal.findByIdAndUpdate(
            req.params.id, { $set: req.body }, { returnDocument: 'after' }
        );
        res.json({ deal });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DASHBOARD ANALYSIS
router.get('/dashboard', async (req, res) => {
    try {
        const { shopDomain } = req.query;
        const filter = shopDomain ? { shopDomain } : {};

        const [
            totalContacts, totalOrders, totalRevenue,
            newContactsThisMonth, abandonedCartsOpen,
            atRiskContacts, vipContacts,
            recentOrders, dealsByStage,
        ] = await Promise.all([
            Contact.countDocuments(filter),
            Order.countDocuments({ ...filter, financialStatus: 'paid' }),
            Order.aggregate([
                { $match: { ...filter, financialStatus: 'paid' } },
                { $group: { _id: null, total: { $sum: '$totalPrice' } } },
            ]),
            Contact.countDocuments({
                ...filter,
                createdAt: { $gte: new Date(new Date().setDate(1)) },
            }),
            AbandonedCart.countDocuments({ ...filter, status: 'open' }),
            Contact.countDocuments({ ...filter, isAtRisk: true }),
            Contact.countDocuments({ ...filter, isVip: true }),
            Order.find({ ...filter, financialStatus: 'paid' })
                .populate('contactId', 'firstName lastName email')
                .sort({ shopifyCreatedAt: -1 }).limit(5),
            Deal.aggregate([
                { $match: filter },
                { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
            ]),
        ]);

        res.json({
            stats: {
                totalContacts,
                totalOrders,
                totalRevenue: totalRevenue[0]?.total || 0,
                newContactsThisMonth,
                abandonedCartsOpen,
                atRiskContacts,
                vipContacts,
            },
            recentOrders,
            dealsByStage,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;