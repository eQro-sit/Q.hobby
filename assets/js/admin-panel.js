/**
 * Q.hobby Admin Panel Logic
 * Product Manager, Q Hub Culture, Q Data Spreadsheet, Complaints & GitHub Sync Center
 */

const AdminPanel = {
  isAuthenticated: false,
  activeTab: 'overview', // overview, products, culture, orders, complaints, github

  init() {
    this.checkAuth();
  },

  checkAuth() {
    this.isAuthenticated = localStorage.getItem(AppConfig.STORAGE_KEYS.ADMIN_AUTH) === 'true';
    this.renderUI();
  },

  login(password) {
    // Default master password or customizable in settings
    if (password === 'admin123' || password === 'qhobby2026') {
      this.isAuthenticated = true;
      localStorage.setItem(AppConfig.STORAGE_KEYS.ADMIN_AUTH, 'true');
      App.toast('এডমিন লগইন সফল হয়েছে!', 'success');
      this.renderUI();
    } else {
      App.toast('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন। (Default: admin123)', 'error');
    }
  },

  logout() {
    this.isAuthenticated = false;
    localStorage.removeItem(AppConfig.STORAGE_KEYS.ADMIN_AUTH);
    App.toast('এডমিন লগআউট সম্পন্ন হয়েছে।', 'info');
    this.renderUI();
  },

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
      btn.classList.remove('bg-cyan-500', 'text-white', 'shadow-lg');
      btn.classList.add('bg-white/5', 'text-gray-300');
    });
    const activeBtn = document.getElementById(`adminTabBtn_${tab}`);
    if (activeBtn) {
      activeBtn.classList.add('bg-cyan-500', 'text-white', 'shadow-lg');
      activeBtn.classList.remove('bg-white/5', 'text-gray-300');
    }

    document.querySelectorAll('.admin-sub-section').forEach(sec => sec.classList.add('hidden'));
    const target = document.getElementById(`adminSubSection_${tab}`);
    if (target) target.classList.remove('hidden');

    if (tab === 'overview') this.renderOverview();
    if (tab === 'products') this.renderProductList();
    if (tab === 'culture') this.renderCultureList();
    if (tab === 'orders') this.renderOrdersTable();
    if (tab === 'complaints') this.renderComplaintsList();
    if (tab === 'github') this.renderGitHubSettings();
  },

  renderUI() {
    const loginBox = document.getElementById('adminLoginBox');
    const dashboard = document.getElementById('adminDashboard');

    if (!loginBox || !dashboard) return;

    if (this.isAuthenticated) {
      loginBox.classList.add('hidden');
      dashboard.classList.remove('hidden');
      this.switchTab(this.activeTab);
    } else {
      loginBox.classList.remove('hidden');
      dashboard.classList.add('hidden');
    }
  },

  // ---------------- OVERVIEW KPI METRICS ----------------
  renderOverview() {
    const products = GithubDB.getProducts();
    const orders = GithubDB.getOrders();
    const culture = GithubDB.getCulture();
    const complaints = GithubDB.getComplaints();

    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_price) || 0), 0);
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;

    const elProd = document.getElementById('adminKpiProducts');
    const elOrders = document.getElementById('adminKpiOrders');
    const elRevenue = document.getElementById('adminKpiRevenue');
    const elCulture = document.getElementById('adminKpiCulture');
    const elPending = document.getElementById('adminKpiPending');
    const elComp = document.getElementById('adminKpiComplaints');

    if (elProd) elProd.innerText = products.length;
    if (elOrders) elOrders.innerText = orders.length;
    if (elRevenue) elRevenue.innerText = '৳' + totalRevenue.toLocaleString();
    if (elCulture) elCulture.innerText = culture.length;
    if (elPending) elPending.innerText = pendingOrders;
    if (elComp) elComp.innerText = complaints.length;

    // Recent orders mini list
    const recentList = document.getElementById('adminRecentOrdersMini');
    if (recentList) {
      const recent = orders.slice(0, 5);
      if (recent.length === 0) {
        recentList.innerHTML = `<p class="text-xs text-gray-500 py-3 text-center">কোনো সাম্প্রতিক অর্ডার নেই।</p>`;
      } else {
        recentList.innerHTML = recent.map(o => `
          <div class="flex items-center justify-between p-2.5 bg-white/5 rounded-xl text-xs">
            <div>
              <span class="font-bold text-white block">${o.customer_name}</span>
              <span class="text-[11px] text-gray-400 font-mono">${o.order_id || 'ORD-' + o.id} • ${o.product_name.slice(0, 20)}...</span>
            </div>
            <div class="text-right">
              <span class="text-cyan-400 font-bold block">৳${o.total_price}</span>
              <span class="text-[10px] text-gray-400">${o.status}</span>
            </div>
          </div>
        `).join('');
      }
    }
  },

  // ---------------- PRODUCT CRUD ----------------
  renderProductList() {
    const container = document.getElementById('adminProductListTable');
    if (!container) return;

    const term = (document.getElementById('adminProductSearch')?.value || '').toLowerCase();
    let products = GithubDB.getProducts();

    if (term) {
      products = products.filter(p => 
        (p.name || '').toLowerCase().includes(term) ||
        (p.pi || '').toLowerCase().includes(term) ||
        (p.sellerId || '').toLowerCase().includes(term)
      );
    }

    if (products.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500">কোনো পণ্য পাওয়া যায়নি।</td></tr>`;
      return;
    }

    container.innerHTML = products.map((p, idx) => `
      <tr class="hover:bg-white/5 transition border-b border-white/5 text-xs">
        <td class="p-3 text-center text-gray-400">${idx + 1}</td>
        <td class="p-3">
          <div class="flex items-center gap-2.5">
            <img src="${p.image || 'https://via.placeholder.com/50'}" class="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0">
            <div>
              <span class="font-bold text-white block line-clamp-1">${p.name}</span>
              <span class="text-gray-400 text-[10px]">${p.category || 'N/A'}</span>
            </div>
          </div>
        </td>
        <td class="p-3 font-mono text-cyan-400 font-bold">${p.pi || 'N/A'}</td>
        <td class="p-3 text-emerald-400 font-bold">৳${p.price}</td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[11px] font-bold ${p.stock === 'Out of Stock' ? 'badge-stock-out' : 'badge-stock-in'}">
            ${p.stock || 'In Stock'}
          </span>
        </td>
        <td class="p-3 text-right whitespace-nowrap">
          <button onclick="AdminPanel.editProduct(${p.id})" class="text-cyan-400 hover:text-cyan-300 p-1.5 transition" title="সম্পাদনা"><i class="fas fa-edit"></i></button>
          <button onclick="AdminPanel.deleteProduct(${p.id})" class="text-red-400 hover:text-red-300 p-1.5 transition" title="মুছুন"><i class="fas fa-trash-alt"></i></button>
        </td>
      </tr>
    `).join('');
  },

  async saveProductFromForm() {
    const id = document.getElementById('adminProdId').value;
    const name = document.getElementById('adminProdName').value.trim();
    const price = document.getElementById('adminProdPrice').value;
    const category = document.getElementById('adminProdCategory').value;
    const pi = document.getElementById('adminProdPI').value.trim();
    const stock = document.getElementById('adminProdStock').value;
    const sellerId = document.getElementById('adminProdSellerId').value.trim();
    const sellerName = document.getElementById('adminProdSellerName').value.trim();
    const sellerPhone = document.getElementById('adminProdSellerPhone').value.trim();
    const rating = document.getElementById('adminProdRating').value.trim() || '4.9';
    const coupon = document.getElementById('adminProdCoupon').value.trim();
    const desc = document.getElementById('adminProdDesc').value.trim();
    const returnPolicy = document.getElementById('adminProdReturn').value.trim();
    const imageUrl = document.getElementById('adminProdImageUrl').value.trim();

    if (!name || !price) {
      App.toast('পণ্যের নাম এবং মূল্য আবশ্যক!', 'error');
      return;
    }

    const prod = {
      name,
      price: Number(price),
      category,
      pi: pi || 'QH-' + Math.floor(100 + Math.random() * 900),
      stock,
      sellerId: sellerId || 'SL-1001',
      sellerName: sellerName || 'Q.hobby Partner',
      sellerPhone: sellerPhone || AppConfig.adminPhone,
      rating,
      coupon,
      desc,
      returnPolicy: returnPolicy || '৭ দিনের রিটার্ন পলিসি',
      dPathao: document.getElementById('adminDPathao').checked,
      dSteadfast: document.getElementById('adminDSteadfast').checked,
      dSundarban: document.getElementById('adminDSundarban').checked
    };

    if (id) prod.id = Number(id);

    // Image handling: either input URL or file
    const fileInput = document.getElementById('adminProdImageFile');
    if (fileInput && fileInput.files[0]) {
      prod.image = await this.fileToBase64(fileInput.files[0]);
    } else if (imageUrl) {
      prod.image = imageUrl;
    } else if (!id) {
      prod.image = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80';
    }

    GithubDB.saveProduct(prod);
    App.toast(id ? 'প্রোডাক্ট সফলভাবে আপডেট হয়েছে!' : 'নতুন প্রোডাক্ট যুক্ত হয়েছে!', 'success');
    this.resetProductForm();
    this.renderProductList();
    PublicPanel.renderShop();
  },

  editProduct(id) {
    const p = GithubDB.getProductById(id);
    if (!p) return;

    document.getElementById('adminProdFormTitle').innerText = 'প্রোডাক্ট সম্পাদনা করুন';
    document.getElementById('adminProdId').value = p.id;
    document.getElementById('adminProdName').value = p.name;
    document.getElementById('adminProdPrice').value = p.price;
    document.getElementById('adminProdCategory').value = p.category || 'হস্তশিল্প ও আর্ট';
    document.getElementById('adminProdPI').value = p.pi || '';
    document.getElementById('adminProdStock').value = p.stock || 'In Stock';
    document.getElementById('adminProdSellerId').value = p.sellerId || '';
    document.getElementById('adminProdSellerName').value = p.sellerName || '';
    document.getElementById('adminProdSellerPhone').value = p.sellerPhone || '';
    document.getElementById('adminProdRating').value = p.rating || '4.9';
    document.getElementById('adminProdCoupon').value = p.coupon || '';
    document.getElementById('adminProdDesc').value = p.desc || '';
    document.getElementById('adminProdReturn').value = p.returnPolicy || '';
    document.getElementById('adminProdImageUrl').value = p.image || '';

    document.getElementById('adminDPathao').checked = p.dPathao ?? true;
    document.getElementById('adminDSteadfast').checked = p.dSteadfast ?? true;
    document.getElementById('adminDSundarban').checked = p.dSundarban ?? true;

    window.scrollTo({ top: document.getElementById('adminProdFormContainer').offsetTop - 80, behavior: 'smooth' });
  },

  deleteProduct(id) {
    if (!confirm('আপনি কি নিশ্চিত এই প্রোডাক্টটি মুছে ফেলতে চান?')) return;
    GithubDB.deleteProduct(id);
    App.toast('প্রোডাক্ট মুছে ফেলা হয়েছে!', 'info');
    this.renderProductList();
    PublicPanel.renderShop();
  },

  resetProductForm() {
    document.getElementById('adminProdFormTitle').innerText = 'নতুন প্রোডাক্ট যুক্ত করুন';
    document.getElementById('adminProdId').value = '';
    document.getElementById('adminProductForm').reset();
  },

  // ---------------- CULTURE CRUD ----------------
  renderCultureList() {
    const container = document.getElementById('adminCultureList');
    if (!container) return;

    const list = GithubDB.getCulture();
    if (list.length === 0) {
      container.innerHTML = `<p class="text-xs text-gray-500 py-6 text-center">কোনো Q Hub পোস্ট নেই।</p>`;
      return;
    }

    container.innerHTML = list.map(c => `
      <div class="p-3.5 bg-black/30 rounded-xl border border-white/5 flex items-start justify-between gap-3 text-xs">
        <div>
          <h4 class="font-bold text-white text-sm">${c.title}</h4>
          <p class="text-gray-400 mt-1 line-clamp-2">${c.description || ''}</p>
          <span class="text-[10px] text-purple-400 mt-1.5 block">${c.date || ''}</span>
        </div>
        <div class="flex gap-1 shrink-0">
          <button onclick="AdminPanel.deleteCulture(${c.id})" class="text-red-400 hover:text-red-300 p-1.5"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `).join('');
  },

  async saveCultureFromForm() {
    const title = document.getElementById('adminCultureTitle').value.trim();
    const desc = document.getElementById('adminCultureDesc').value.trim();
    const imgUrl = document.getElementById('adminCultureImgUrl').value.trim();

    if (!title) {
      App.toast('পোস্টের শিরোনাম দেওয়া আবশ্যক!', 'error');
      return;
    }

    const item = {
      title,
      description: desc,
      date: new Date().toISOString().slice(0, 10)
    };

    const fileInput = document.getElementById('adminCultureImgFile');
    if (fileInput && fileInput.files[0]) {
      item.image = await this.fileToBase64(fileInput.files[0]);
    } else if (imgUrl) {
      item.image = imgUrl;
    }

    GithubDB.saveCulture(item);
    App.toast('Q Hub পোস্ট সফলভাবে যুক্ত হয়েছে!', 'success');
    document.getElementById('adminCultureForm').reset();
    this.renderCultureList();
    PublicPanel.renderQHub();
  },

  deleteCulture(id) {
    if (!confirm('আপনি কি এই আপডেটটি মুছে ফেলতে চান?')) return;
    GithubDB.deleteCulture(id);
    App.toast('পোস্ট মুছে ফেলা হয়েছে!', 'info');
    this.renderCultureList();
    PublicPanel.renderQHub();
  },

  // ---------------- Q DATA SPREADSHEET (ORDERS) ----------------
  renderOrdersTable() {
    const tbody = document.getElementById('adminOrdersTableBody');
    if (!tbody) return;

    const term = (document.getElementById('adminOrderSearch')?.value || '').toLowerCase();
    let orders = GithubDB.getOrders();

    if (term) {
      orders = orders.filter(o => 
        (o.customer_name || '').toLowerCase().includes(term) ||
        (o.customer_phone || '').includes(term) ||
        (o.order_id || '').toLowerCase().includes(term) ||
        (o.pi || '').toLowerCase().includes(term) ||
        (o.seller_id || '').toLowerCase().includes(term)
      );
    }

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-gray-500">কোনো অর্ডার ডাটা পাওয়া যায়নি।</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map((o, idx) => {
      const dateStr = o.created_at ? new Date(o.created_at).toLocaleString('bn-BD', { hour12: true }) : 'N/A';

      return `
        <tr class="hover:bg-white/5 transition border-b border-white/5 text-xs">
          <td class="p-3 text-center text-gray-400 font-mono">${idx + 1}</td>
          <td class="p-3 whitespace-nowrap">
            <span class="font-mono text-cyan-400 font-bold block">${o.order_id || 'ORD-' + o.id}</span>
            <span class="text-[10px] text-gray-400">${dateStr}</span>
          </td>
          <td class="p-3">
            <span class="font-bold text-white block">${o.customer_name}</span>
            <span class="text-cyan-400 font-mono text-[11px]">${o.customer_phone}</span>
          </td>
          <td class="p-3 max-w-[180px] truncate text-gray-300" title="${o.customer_address}">
            ${o.customer_address}
          </td>
          <td class="p-3">
            <span class="text-white font-semibold block line-clamp-1">${o.product_name}</span>
            <span class="text-gray-400 text-[10px]">PI: ${o.pi || 'N/A'} | Seller: ${o.seller_id || 'N/A'}</span>
          </td>
          <td class="p-3 text-center font-bold text-white">${o.quantity} টি</td>
          <td class="p-3 font-bold text-emerald-400 whitespace-nowrap">৳${o.total_price}</td>
          <td class="p-3">
            <select onchange="AdminPanel.updateStatus('${o.order_id || o.id}', this.value)" class="bg-slate-900 border border-white/10 text-xs rounded-lg px-2 py-1 text-white focus:outline-none focus:border-cyan-400">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>🟡 Pending</option>
              <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>🔵 Confirmed</option>
              <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>🟣 Shipped</option>
              <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>🟢 Delivered</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>🔴 Cancelled</option>
            </select>
          </td>
          <td class="p-3 text-right whitespace-nowrap">
            <a href="https://wa.me/${(o.customer_phone || '').replace(/[^0-9]/g, '')}" target="_blank" class="text-emerald-400 hover:text-emerald-300 p-1.5" title="WhatsApp এ মেসেজ পাঠান"><i class="fab fa-whatsapp"></i></a>
            <button onclick="AdminPanel.deleteOrder('${o.order_id || o.id}')" class="text-red-400 hover:text-red-300 p-1.5" title="মুছুন"><i class="fas fa-trash-alt"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  },

  updateStatus(orderId, status) {
    GithubDB.updateOrderStatus(orderId, status);
    App.toast(`অর্ডার #${orderId} স্ট্যাটাস '${status}' এ আপডেট হয়েছে!`, 'success');
    UserPanel.renderOrders();
  },

  deleteOrder(orderId) {
    if (!confirm('আপনি কি এই অর্ডার রেকর্ডটি মুছে ফেলতে চান?')) return;
    GithubDB.deleteOrder(orderId);
    App.toast('অর্ডার মুছে ফেলা হয়েছে!', 'info');
    this.renderOrdersTable();
    this.renderOverview();
  },

  exportOrdersCSV() {
    const orders = GithubDB.getOrders();
    if (orders.length === 0) {
      App.toast('এক্সপোর্ট করার মতো কোনো অর্ডার নেই!', 'error');
      return;
    }

    const headers = ['Order ID', 'Date & Time', 'Customer Name', 'Phone', 'Address', 'Product Name', 'PI', 'Seller ID', 'Quantity', 'Total Price', 'Status', 'Order Type'];
    const rows = orders.map(o => {
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      return [
        o.order_id || 'ORD-' + o.id,
        o.created_at || '',
        o.customer_name,
        o.customer_phone,
        o.customer_address,
        o.product_name,
        o.pi,
        o.seller_id,
        o.quantity,
        o.total_price,
        o.status,
        o.order_type
      ].map(esc).join(',');
    });

    const csvContent = '\uFEFF' + headers.map(h => `"${h}"`).join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Q_Data_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('অর্ডার এক্সেল শিট ডাউনলোড হচ্ছে...', 'success');
  },

  // ---------------- COMPLAINTS ----------------
  renderComplaintsList() {
    const container = document.getElementById('adminComplaintsContainer');
    if (!container) return;

    const list = GithubDB.getComplaints();
    if (list.length === 0) {
      container.innerHTML = `<p class="text-xs text-gray-500 py-6 text-center">কোনো অভিযোগ রেকর্ড নেই।</p>`;
      return;
    }

    container.innerHTML = list.map(c => `
      <div class="p-4 bg-black/30 rounded-2xl border border-amber-500/20 text-xs">
        <div class="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
          <span class="text-amber-400 font-bold"><i class="fas fa-exclamation-triangle mr-1"></i> সেলার ID: ${c.seller_id}</span>
          <span class="text-[10px] text-gray-400">${new Date(c.created_at).toLocaleDateString('bn-BD')}</span>
        </div>
        <p class="text-gray-300 leading-relaxed mb-3">${c.description}</p>
        <div class="flex justify-between items-center text-[11px]">
          <span class="px-2 py-0.5 rounded font-bold ${c.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">${c.status || 'Open'}</span>
          <a href="https://wa.me/${AppConfig.adminWaNumber}?text=${encodeURIComponent(`অভিযোগ সমাধান: সেলার ID ${c.seller_id}`)}" target="_blank" class="text-cyan-400 hover:text-cyan-300">
            <i class="fab fa-whatsapp mr-1"></i> WhatsApp অ্যাকশন
          </a>
        </div>
      </div>
    `).join('');
  },

  // ---------------- GITHUB DATABASE SYNC CENTER ----------------
  renderGitHubSettings() {
    const inputRepo = document.getElementById('adminGithubRepo');
    const inputBranch = document.getElementById('adminGithubBranch');
    const inputToken = document.getElementById('adminGithubToken');

    if (inputRepo) inputRepo.value = localStorage.getItem('qhobby_github_repo') || AppConfig.defaultGithubRepo;
    if (inputBranch) inputBranch.value = localStorage.getItem('qhobby_github_branch') || AppConfig.defaultBranch;
    if (inputToken) inputToken.value = localStorage.getItem(AppConfig.STORAGE_KEYS.GITHUB_TOKEN) || '';
  },

  saveGitHubSettings() {
    const repo = document.getElementById('adminGithubRepo').value.trim();
    const branch = document.getElementById('adminGithubBranch').value.trim() || 'main';
    const token = document.getElementById('adminGithubToken').value.trim();

    localStorage.setItem('qhobby_github_repo', repo);
    localStorage.setItem('qhobby_github_branch', branch);
    if (token) localStorage.setItem(AppConfig.STORAGE_KEYS.GITHUB_TOKEN, token);

    App.toast('গিটহাব সিঙ্ক সেটিংস সংরক্ষিত হয়েছে!', 'success');
  },

  async pushToGithub() {
    const repo = document.getElementById('adminGithubRepo').value.trim() || AppConfig.defaultGithubRepo;
    const branch = document.getElementById('adminGithubBranch').value.trim() || 'main';
    const token = document.getElementById('adminGithubToken').value.trim() || localStorage.getItem(AppConfig.STORAGE_KEYS.GITHUB_TOKEN);

    if (!token) {
      App.toast('GitHub Personal Access Token (PAT) প্রয়োজন!', 'error');
      return;
    }

    const btn = document.getElementById('btnSyncGithub');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-1"></i> সিঙ্ক হচ্ছে...`;
    }

    try {
      await GithubDB.syncAllToGithub(token, repo, branch);
      App.toast('অভিনন্দন! সম্পূর্ণ ডেটাবেস সফলভাবে GitHub এ কমিট হয়েছে। Vercel স্বয়ংক্রিয়ভাবে রিডিপ্লয় করছে!', 'success');
    } catch (err) {
      console.error(err);
      App.toast('গিটহাব সিঙ্কে ত্রুটি: ' + (err.message || 'ব্যর্থ হয়েছে'), 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<i class="fab fa-github mr-1"></i> Save & Commit Database to GitHub`;
      }
    }
  },

  fileToBase64(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
    });
  }
};
