/**
 * Q.hobby GitHub JSON Database Engine
 * Handles persistent storage across GitHub, LocalStorage, and REST API
 */

const GithubDB = {
  data: {
    products: [],
    culture: [],
    orders: [],
    complaints: [],
    config: {}
  },

  isInitialized: false,

  /**
   * Initialize database: load from data/*.json or fallback to localStorage
   */
  async init() {
    try {
      // 1. Try loading site config
      await this.loadCollection('config', 'data/site-config.json', AppConfig.STORAGE_KEYS.CONFIG);
      // 2. Try loading products
      await this.loadCollection('products', 'data/products.json', AppConfig.STORAGE_KEYS.PRODUCTS);
      // 3. Try loading culture (Q Hub)
      await this.loadCollection('culture', 'data/culture.json', AppConfig.STORAGE_KEYS.CULTURE);
      // 4. Try loading orders (Q Data)
      await this.loadCollection('orders', 'data/orders.json', AppConfig.STORAGE_KEYS.ORDERS);
      // 5. Try loading complaints
      await this.loadCollection('complaints', 'data/complaints.json', AppConfig.STORAGE_KEYS.COMPLAINTS);

      this.isInitialized = true;
      console.log('GitHub DB initialized successfully:', {
        products: this.data.products.length,
        culture: this.data.culture.length,
        orders: this.data.orders.length,
        complaints: this.data.complaints.length
      });
      return true;
    } catch (err) {
      console.error('Error initializing GitHub DB:', err);
      return false;
    }
  },

  /**
   * Helper to load individual collection
   */
  async loadCollection(key, jsonPath, storageKey) {
    const cached = localStorage.getItem(storageKey);
    let loadedData = null;

    try {
      const response = await fetch(jsonPath + '?v=' + Date.now());
      if (response.ok) {
        loadedData = await response.json();
      }
    } catch (e) {
      console.warn(`Could not fetch ${jsonPath}, checking cache...`);
    }

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // If we also fetched from file, ensure local edits take priority or merge
        this.data[key] = parsed;
      } catch (e) {
        this.data[key] = loadedData || (key === 'config' ? {} : []);
      }
    } else {
      this.data[key] = loadedData || (key === 'config' ? {} : []);
      localStorage.setItem(storageKey, JSON.stringify(this.data[key]));
    }
  },

  /**
   * Save collection to localStorage cache
   */
  persistLocally(key) {
    const storageKeys = {
      products: AppConfig.STORAGE_KEYS.PRODUCTS,
      culture: AppConfig.STORAGE_KEYS.CULTURE,
      orders: AppConfig.STORAGE_KEYS.ORDERS,
      complaints: AppConfig.STORAGE_KEYS.COMPLAINTS,
      config: AppConfig.STORAGE_KEYS.CONFIG
    };
    if (storageKeys[key]) {
      localStorage.setItem(storageKeys[key], JSON.stringify(this.data[key]));
    }
  },

  // ---------------- PRODUCTS ----------------
  getProducts() {
    return [...this.data.products];
  },

  getProductById(id) {
    return this.data.products.find(p => p.id === Number(id) || p.id === id);
  },

  saveProduct(prod) {
    if (prod.id) {
      // Update
      const idx = this.data.products.findIndex(p => p.id === Number(prod.id));
      if (idx !== -1) {
        this.data.products[idx] = { ...this.data.products[idx], ...prod };
      } else {
        this.data.products.unshift(prod);
      }
    } else {
      // Create new
      prod.id = Date.now();
      this.data.products.unshift(prod);
    }
    this.persistLocally('products');
    return prod;
  },

  deleteProduct(id) {
    this.data.products = this.data.products.filter(p => p.id !== Number(id) && p.id !== id);
    this.persistLocally('products');
    return true;
  },

  // ---------------- CULTURE (Q HUB) ----------------
  getCulture() {
    return [...this.data.culture];
  },

  saveCulture(item) {
    if (item.id) {
      const idx = this.data.culture.findIndex(c => c.id === Number(item.id));
      if (idx !== -1) {
        this.data.culture[idx] = { ...this.data.culture[idx], ...item };
      } else {
        this.data.culture.unshift(item);
      }
    } else {
      item.id = Date.now();
      item.date = item.date || new Date().toISOString().slice(0, 10);
      this.data.culture.unshift(item);
    }
    this.persistLocally('culture');
    return item;
  },

  deleteCulture(id) {
    this.data.culture = this.data.culture.filter(c => c.id !== Number(id) && c.id !== id);
    this.persistLocally('culture');
    return true;
  },

  // ---------------- ORDERS (Q DATA) ----------------
  getOrders() {
    return [...this.data.orders];
  },

  saveOrder(order) {
    if (!order.id) {
      order.id = Date.now();
      order.order_id = 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(100 + Math.random() * 900);
      order.created_at = new Date().toISOString();
      order.status = order.status || 'Pending';
      this.data.orders.unshift(order);
    } else {
      const idx = this.data.orders.findIndex(o => o.id === order.id || o.order_id === order.order_id);
      if (idx !== -1) {
        this.data.orders[idx] = { ...this.data.orders[idx], ...order };
      } else {
        this.data.orders.unshift(order);
      }
    }
    this.persistLocally('orders');
    return order;
  },

  updateOrderStatus(orderId, status) {
    const order = this.data.orders.find(o => o.id === Number(orderId) || o.order_id === orderId);
    if (order) {
      order.status = status;
      this.persistLocally('orders');
      return true;
    }
    return false;
  },

  deleteOrder(orderId) {
    this.data.orders = this.data.orders.filter(o => o.id !== Number(orderId) && o.order_id !== orderId);
    this.persistLocally('orders');
    return true;
  },

  // ---------------- COMPLAINTS ----------------
  getComplaints() {
    return [...this.data.complaints];
  },

  saveComplaint(comp) {
    comp.id = comp.id || Date.now();
    comp.created_at = comp.created_at || new Date().toISOString();
    comp.status = comp.status || 'Open';
    this.data.complaints.unshift(comp);
    this.persistLocally('complaints');
    return comp;
  },

  updateComplaintStatus(id, status) {
    const comp = this.data.complaints.find(c => c.id === Number(id));
    if (comp) {
      comp.status = status;
      this.persistLocally('complaints');
      return true;
    }
    return false;
  },

  // ---------------- GITHUB API COMMIT & SYNC ENGINE ----------------
  /**
   * Commit a single JSON file directly to GitHub using Personal Access Token
   */
  async commitFileToGithub(token, repo, branch, filePath, dataObj, commitMsg) {
    const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };

    // 1. Get current SHA of file if it exists
    let sha = null;
    try {
      const res = await fetch(`${apiUrl}?ref=${branch}`, { headers });
      if (res.ok) {
        const fileInfo = await res.json();
        sha = fileInfo.sha;
      }
    } catch (e) {
      console.log('File does not exist yet on GitHub, creating new.');
    }

    // 2. Base64 encode file content (Unicode safe)
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(jsonStr)));

    // 3. Send PUT request to GitHub API
    const body = {
      message: commitMsg || `Update ${filePath} from Q.hobby Admin`,
      content: base64Content,
      branch: branch
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      throw new Error(errData.message || 'GitHub commit failed');
    }

    return await putRes.json();
  },

  /**
   * Commit all database files to GitHub at once
   */
  async syncAllToGithub(token, repo, branch) {
    const results = {};
    results.products = await this.commitFileToGithub(token, repo, branch, 'data/products.json', this.data.products, 'Update products database');
    results.culture = await this.commitFileToGithub(token, repo, branch, 'data/culture.json', this.data.culture, 'Update culture database');
    results.orders = await this.commitFileToGithub(token, repo, branch, 'data/orders.json', this.data.orders, 'Update orders database');
    results.complaints = await this.commitFileToGithub(token, repo, branch, 'data/complaints.json', this.data.complaints, 'Update complaints database');
    return results;
  },

  /**
   * Export database backup to downloadable JSON
   */
  exportBackup() {
    const fullBackup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      products: this.data.products,
      culture: this.data.culture,
      orders: this.data.orders,
      complaints: this.data.complaints
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qhobby_database_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Import database backup from uploaded JSON file
   */
  importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products) {
        this.data.products = parsed.products;
        this.persistLocally('products');
      }
      if (parsed.culture) {
        this.data.culture = parsed.culture;
        this.persistLocally('culture');
      }
      if (parsed.orders) {
        this.data.orders = parsed.orders;
        this.persistLocally('orders');
      }
      if (parsed.complaints) {
        this.data.complaints = parsed.complaints;
        this.persistLocally('complaints');
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }
};
