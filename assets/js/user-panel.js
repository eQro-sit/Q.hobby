/**
 * Q.hobby User Panel / Customer Account Logic
 */

const UserPanel = {
  currentUser: null,

  init() {
    this.checkSession();
  },

  checkSession() {
    try {
      const stored = localStorage.getItem(AppConfig.STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      this.currentUser = null;
    }
    this.renderUI();
  },

  getLoggedInUser() {
    return this.currentUser;
  },

  login(phone, name = '', address = '') {
    if (!phone) {
      App.toast('মোবাইল নম্বর দেওয়া আবশ্যক!', 'error');
      return;
    }
    this.currentUser = {
      phone: phone.trim(),
      name: name.trim() || 'সম্মানিত ক্রেতা',
      address: address.trim() || ''
    };
    localStorage.setItem(AppConfig.STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    App.toast(`স্বাগতম, ${this.currentUser.name}!`, 'success');
    this.renderUI();
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem(AppConfig.STORAGE_KEYS.CURRENT_USER);
    App.toast('লগআউট করা হয়েছে।', 'info');
    this.renderUI();
  },

  saveProfile() {
    if (!this.currentUser) return;
    const name = document.getElementById('userProfileName').value.trim();
    const address = document.getElementById('userProfileAddress').value.trim();

    this.currentUser.name = name || this.currentUser.name;
    this.currentUser.address = address;
    localStorage.setItem(AppConfig.STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    App.toast('প্রোফাইল তথ্য সংরক্ষিত হয়েছে!', 'success');
    this.renderUI();
  },

  registerCustomerOrder(phone, order) {
    if (!this.currentUser && phone) {
      this.currentUser = {
        phone: phone,
        name: order.customer_name || 'সম্মানিত ক্রেতা',
        address: order.customer_address || ''
      };
      localStorage.setItem(AppConfig.STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    }
    this.renderOrders();
  },

  renderUI() {
    const authBox = document.getElementById('userAuthBox');
    const dashboard = document.getElementById('userDashboard');
    const userNavLabel = document.getElementById('userNavProfileLabel');

    if (!authBox || !dashboard) return;

    if (this.currentUser) {
      authBox.classList.add('hidden');
      dashboard.classList.remove('hidden');
      if (userNavLabel) userNavLabel.innerText = this.currentUser.name.split(' ')[0] || 'User';

      // Fill profile fields
      const pName = document.getElementById('userProfileName');
      const pPhone = document.getElementById('userProfilePhone');
      const pAddr = document.getElementById('userProfileAddress');
      const dName = document.getElementById('userDisplayName');
      const dPhone = document.getElementById('userDisplayPhone');

      if (pName) pName.value = this.currentUser.name;
      if (pPhone) pPhone.value = this.currentUser.phone;
      if (pAddr) pAddr.value = this.currentUser.address || '';
      if (dName) dName.innerText = this.currentUser.name;
      if (dPhone) dPhone.innerText = this.currentUser.phone;

      this.renderOrders();
      this.renderWishlist();
    } else {
      authBox.classList.remove('hidden');
      dashboard.classList.add('hidden');
      if (userNavLabel) userNavLabel.innerText = 'লগইন';
    }
  },

  renderOrders() {
    const container = document.getElementById('userOrdersList');
    if (!container || !this.currentUser) return;

    const allOrders = GithubDB.getOrders();
    // Filter orders belonging to this phone number
    const userPhone = this.currentUser.phone.replace(/[^0-9]/g, '');
    const myOrders = allOrders.filter(o => {
      const orderPhone = (o.customer_phone || '').replace(/[^0-9]/g, '');
      return orderPhone.endsWith(userPhone) || userPhone.endsWith(orderPhone);
    });

    const statCount = document.getElementById('userStatOrderCount');
    if (statCount) statCount.innerText = myOrders.length;

    if (myOrders.length === 0) {
      container.innerHTML = `
        <div class="text-center py-10 bg-white/5 rounded-2xl border border-white/5">
          <i class="fas fa-box-open text-3xl text-gray-500 mb-2"></i>
          <p class="text-gray-300 font-medium">আপনার কোনো অর্ডার পাওয়া যায়নি।</p>
          <button onclick="App.switchPanel('public')" class="mt-3 bg-cyan-500/20 text-cyan-300 px-4 py-1.5 rounded-xl text-xs font-bold border border-cyan-500/30 hover:bg-cyan-500/30 transition">শপ দেখুন</button>
        </div>
      `;
      return;
    }

    container.innerHTML = myOrders.map(o => {
      let statusClass = 'status-pending';
      let statusLabel = 'অর্ডার গৃহীত (Pending)';
      if (o.status === 'Confirmed') { statusClass = 'status-confirmed'; statusLabel = 'কনফার্ম হয়েছে (Confirmed)'; }
      else if (o.status === 'Shipped') { statusClass = 'status-shipped'; statusLabel = 'কুরিয়ারে হস্তান্তর (Shipped)'; }
      else if (o.status === 'Delivered') { statusClass = 'status-delivered'; statusLabel = 'ডেলিভার্ড হয়েছে (Delivered)'; }
      else if (o.status === 'Cancelled') { statusClass = 'status-cancelled'; statusLabel = 'বাতিল (Cancelled)'; }

      const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A';

      return `
        <div class="bg-black/30 p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-cyan-500/30 transition">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
            <div>
              <span class="text-xs text-gray-400 font-mono block">Order ID: <span class="text-white font-bold">${o.order_id || 'ORD-' + o.id}</span></span>
              <span class="text-[11px] text-gray-400">${dateStr} • <span class="text-pink-400 font-semibold">${o.order_type || 'Buy'}</span></span>
            </div>
            <span class="status-pill ${statusClass} text-xs">${statusLabel}</span>
          </div>

          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <h4 class="font-bold text-white text-sm sm:text-base">${o.product_name}</h4>
              <p class="text-xs text-gray-400 mt-0.5">পরিমাণ: <span class="text-white font-semibold">${o.quantity} টি</span> | PI: <span class="text-cyan-400 font-mono">${o.pi || 'N/A'}</span></p>
              <p class="text-xs text-gray-400 mt-0.5">সেলার ID: <span class="text-purple-400">${o.seller_id || 'N/A'}</span></p>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-400 block">মোট পরিশোধযোগ্য</span>
              <span class="text-cyan-400 font-extrabold text-base">৳${o.total_price}</span>
            </div>
          </div>

          <div class="bg-white/5 p-2.5 rounded-xl text-xs text-gray-300 flex items-center justify-between">
            <span class="truncate max-w-[240px]"><i class="fas fa-map-marker-alt text-cyan-400 mr-1.5"></i>${o.customer_address}</span>
            <a href="https://wa.me/${AppConfig.adminWaNumber}?text=${encodeURIComponent(`হ্যালো, আমার অর্ডার #${o.order_id || o.id} সম্পর্কে জানতে চাই।`)}" target="_blank" class="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-semibold transition flex items-center gap-1 shrink-0">
              <i class="fab fa-whatsapp"></i> হেল্প
            </a>
          </div>
        </div>
      `;
    }).join('');
  },

  renderWishlist() {
    const container = document.getElementById('userWishlistItems');
    if (!container) return;

    const wishlistIds = PublicPanel.getWishlist();
    const products = GithubDB.getProducts().filter(p => wishlistIds.includes(p.id));

    const statWish = document.getElementById('userStatWishCount');
    if (statWish) statWish.innerText = products.length;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 bg-white/5 rounded-2xl border border-white/5">
          <i class="far fa-heart text-3xl text-gray-500 mb-2"></i>
          <p class="text-gray-400 text-sm">উইশলিস্টে কোনো পণ্য নেই।</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(p => `
      <div class="flex items-center gap-3 bg-black/30 p-3 rounded-2xl border border-white/5">
        <img src="${p.image || 'https://via.placeholder.com/80'}" class="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0">
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-white text-sm truncate">${p.name}</h4>
          <span class="text-cyan-400 font-bold text-sm">৳${p.price}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="PublicPanel.openOrderModal(${p.id}, 'Buy')" class="bg-cyan-500 hover:bg-cyan-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition">
            Buy
          </button>
          <button onclick="PublicPanel.toggleWishlist(${p.id})" class="text-gray-400 hover:text-red-400 p-2 transition" title="মুছুন">
            <i class="fas fa-trash-alt text-xs"></i>
          </button>
        </div>
      </div>
    `).join('');
  },

  trackOrderByQuery() {
    const query = document.getElementById('orderTrackInput').value.trim();
    const resultBox = document.getElementById('orderTrackResult');
    if (!query || !resultBox) return;

    const orders = GithubDB.getOrders();
    const found = orders.filter(o => 
      (o.order_id || '').toLowerCase() === query.toLowerCase() ||
      (o.customer_phone || '').includes(query)
    );

    if (found.length === 0) {
      resultBox.innerHTML = `
        <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs text-center mt-3">
          কোনো অর্ডার খুঁজে পাওয়া যায়নি। দয়া করে সঠিক Order ID বা মোবাইল নম্বর লিখুন।
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <div class="mt-3 space-y-2">
          ${found.map(o => `
            <div class="p-3 bg-white/5 rounded-xl border border-cyan-500/20 text-xs">
              <div class="flex justify-between items-center mb-1">
                <span class="font-bold text-white font-mono">${o.order_id || 'ORD-' + o.id}</span>
                <span class="text-cyan-400 font-bold">${o.status}</span>
              </div>
              <p class="text-gray-300 truncate">${o.product_name}</p>
              <div class="flex justify-between text-gray-400 mt-1">
                <span>মোট: ৳${o.total_price}</span>
                <span>${new Date(o.created_at).toLocaleDateString('bn-BD')}</span>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  }
};
