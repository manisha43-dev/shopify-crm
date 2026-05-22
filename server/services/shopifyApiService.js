const axios = require('axios');
const redis = require('../config/redis');

class ShopifyAPIService {
  constructor(shopDomain, accessToken) {
    this.shopDomain = shopDomain;
    this.accessToken = accessToken;
    this.baseURL = `https://${shopDomain}/admin/api/2024-01`;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });
    this._setupInterceptors();
  }

  //  Retry with exponential backoff 
  _setupInterceptors() {
    this.client.interceptors.response.use(
      (res) => res,
      async (error) => {
        const config = error.config;
        config._retryCount = config._retryCount || 0;

        const status = error.response?.status;

        // Retryable errors
        if ([429, 500, 503].includes(status) && config._retryCount < 5) {
          config._retryCount += 1;

          // Honor Retry-After header for rate limits
          let delay = Math.pow(2, config._retryCount) * 1000;
          if (status === 429) {
            const retryAfter = error.response.headers['retry-after'];
            delay = retryAfter ? parseInt(retryAfter) * 1000 : delay;
          }
          // Add jitter
          delay += Math.random() * 1000;

          console.log(` Retry ${config._retryCount}/5 for ${config.url} in ${Math.round(delay)}ms`);
          await new Promise((r) => setTimeout(r, delay));
          return this.client(config);
        }

        return Promise.reject(error);
      }
    );
  }

  //  Rate limit tracker 
  async _checkRateLimit() {
    const key = `shopify:ratelimit:${this.shopDomain}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 1); // 1-second window
    if (count > 2) {
      await new Promise((r) => setTimeout(r, 500)); // slow down
    }
  }

  //  Generic paginated GET 
  async *paginatedGet(endpoint, params = {}) {
    let url = `${this.baseURL}${endpoint}`;
    const searchParams = new URLSearchParams({ limit: 250, ...params });
    let nextUrl = `${url}?${searchParams}`;

    while (nextUrl) {
      await this._checkRateLimit();
      const response = await this.client.get(nextUrl.replace(this.baseURL, ''));
      const data = response.data;
      const keys = Object.keys(data);
      yield data[keys[0]];

      // Parse Link header for next page
      const linkHeader = response.headers['link'];
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
        nextUrl = match ? match[1] : null;
      } else {
        nextUrl = null;
      }
    }
  }

  // Customers 
  async getAllCustomers() {
    const customers = [];
    for await (const page of this.paginatedGet('/customers.json', { fields: 'id,email,first_name,last_name,phone,addresses,tags,orders_count,total_spent,created_at,updated_at,accepts_marketing,marketing_opt_in_level' })) {
      customers.push(...page);
    }
    return customers;
  }

  async getCustomer(customerId) {
    const res = await this.client.get(`/customers/${customerId}.json`);
    return res.data.customer;
  }

  // Orders 
  async getAllOrders(sinceDate = null) {
    const params = { status: 'any' };
    if (sinceDate) params.created_at_min = sinceDate;
    const orders = [];
    for await (const page of this.paginatedGet('/orders.json', params)) {
      orders.push(...page);
    }
    return orders;
  }

  async getOrder(orderId) {
    const res = await this.client.get(`/orders/${orderId}.json`);
    return res.data.order;
  }

  async getOrderRefunds(orderId) {
    const res = await this.client.get(`/orders/${orderId}/refunds.json`);
    return res.data.refunds;
  }

  async getOrderTransactions(orderId) {
    const res = await this.client.get(`/orders/${orderId}/transactions.json`);
    return res.data.transactions;
  }

  // Products 
  async getAllProducts() {
    const products = [];
    for await (const page of this.paginatedGet('/products.json', { fields: 'id,title,vendor,product_type,tags,status,variants,images,created_at' })) {
      products.push(...page);
    }
    return products;
  }

  // Abandoned Checkouts 
  async getAbandonedCheckouts(sinceDate = null) {
    const params = {};
    if (sinceDate) params.created_at_min = sinceDate;
    const checkouts = [];
    for await (const page of this.paginatedGet('/checkouts.json', params)) {
      checkouts.push(...page);
    }
    return checkouts;
  }

  // Webhooks 
  async registerWebhooks(webhookBaseUrl) {
    const topics = [
      'customers/create', 'customers/update', 'customers/delete',
      'orders/create', 'orders/updated', 'orders/paid',
      'orders/fulfilled', 'orders/cancelled',
      'refunds/create',
      'checkouts/create', 'checkouts/update',
      'app/uninstalled',
      'products/create', 'products/update',
    ];

    const registered = [];
    for (const topic of topics) {
      try {
        const res = await this.client.post('/webhooks.json', {
          webhook: {
            topic,
            address: `${webhookBaseUrl}/api/webhooks/shopify`,
            format: 'json',
          },
        });
        registered.push(res.data.webhook.id);
        console.log(` Webhook registered: ${topic}`);
      } catch (err) {
        console.error(` Webhook failed: ${topic}`, err.response?.data);
      }
    }
    return registered;
  }

  async deleteWebhook(webhookId) {
    await this.client.delete(`/webhooks/${webhookId}.json`);
  }
}

module.exports = ShopifyAPIService;