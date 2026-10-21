/**
 * Q.hobby Public Store & Customer Portal Logic
 */

const PublicPanel = {
  currentCategory: 'all',
  currentPriceLimit: Infinity,
  searchQuery: '',
  activeProduct: null,
  activeOrderType: 'Buy',

  init() {
    this.renderShop();
    this.renderQHub();
    this.updateWishlistBadge();
  },

  // ---------------- SHOP FILTERING & RENDERING ----------------
  setCategory(cat, btn) {
    this.currentCategory = cat;
    document.querySelectorAll('.cat-pill').forEach(b => {
      b.classList.remove('bg-cyan-500', 'text-white', 'shadow-lg');
      b.classList.add('bg-white/5', 'text-gray-300');
    });
    if (btn) {
      btn.classList.add('bg-cyan-500', 'text-white', 'shadow-lg');
      btn.classList.remove('bg-white/5', 'text-gray-300');
    }
    this.renderShop();
  },

  setPriceLimit(limit, btn) {
    this.currentPriceLimit = limit;
    document.querySelectorAll('.price-pill').forEach(b => {
      b.classList.remove('bg-cyan-500', 'text-white', 'shadow-lg');
      b.classList.add('bg-white/5', 'text-gray-300');
    });
    if (btn) {
      btn.classList.add('bg-cyan-500', 'text-white', 'shadow-lg');
      btn.classList.remove('bg-white/5', 'text-gray-300');
    }
    this.renderShop();
  },

  onSearch(val) {
    this.searchQuery = val.toLowerCase().trim();
    this.renderShop();
  },

  renderShop() {
    const grid = document.getElementById('publicShopGrid');
    if (!grid) return;

    let items = GithubDB.getProducts();

    // Filters
    if (this.currentCategory !== 'all') {
      items = items.filter(p => p.category === this.currentCategory);
    }
    if (this.currentPriceLimit !== Infinity) {
      items = items.filter(p => (Number(p.price) || 0) <= this.currentPriceLimit);
    }
    if (this.searchQuery) {
      items = items.filter(p => 
        (p.name || '').toLowerCase().includes(this.searchQuery) ||
        (p.pi || '').toLowerCase().includes(this.searchQuery) ||
        (p.desc || '').toLowerCase().includes(this.searchQuery)
      );
    }

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-16 bg-white/5 rounded-2xl border border-white/5">
          <i class="fas fa-box-open text-4xl text-gray-500 mb-3"></i>
          <p class="text-gray-300 font-medium">কোনো পণ্য পাওয়া যায়নি!</p>
          <p class="text-gray-500 text-sm mt-1">অনুসন্ধান বা ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন।</p>
        </div>
      `;
      return;
    }

    const wishlist = this.getWishlist();

    grid.innerHTML = items.map(p => {
      const isWishlisted = wishlist.includes(p.id);
      const isOut = p.stock === 'Out of Stock';

      return `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col group relative">
          <!-- Wishlist Toggle -->
          <button onclick="PublicPanel.toggleWishlist(${p.id}, event)" class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-sm transition hover:scale-110 ${isWishlisted ? 'text-pink-500' : 'text-gray-400 hover:text-white'}">
            <i class="${isWishlisted ? 'fas' : 'far'} fa-heart"></i>
          </button>

          <!-- Product Image -->
          <div class="relative overflow-hidden cursor-pointer h-44 sm:h-52 bg-slate-950" onclick="PublicPanel.showProductDetail(${p.id})">
            <img src="${p.image || 'https://via.placeholder.com/300'}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <span class="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${isOut ? 'badge-stock-out' : 'badge-stock-in'}">
              ${isOut ? 'স্টক শেষ' : 'ইন স্টক'}
            </span>
            ${p.pi ? `<span class="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold badge-pi">${p.pi}</span>` : ''}
          </div>

          <!-- Product Meta -->
          <div class="p-4 flex-1 flex flex-col">
            <div class="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>${p.category || 'শৌখিন পণ্য'}</span>
              <span class="text-amber-400"><i class="fas fa-star text-[10px] mr-1"></i>${p.rating || '4.9'}</span>
            </div>

            <h3 class="font-bold text-white text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-cyan-400 transition-colors cursor-pointer" onclick="PublicPanel.showProductDetail(${p.id})">
              ${p.name}
            </h3>

            <div class="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
              <div>
                <span class="text-xs text-gray-400 block">মূল্য</span>
                <span class="text-cyan-400 font-bold text-lg">৳${p.price}</span>
              </div>
              <div class="flex gap-1.5">
                <button onclick="PublicPanel.openOrderModal(${p.id}, 'Buy')" class="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1">
                  <i class="fas fa-shopping-bag"></i> Buy
                </button>
                <button onclick="PublicPanel.openOrderModal(${p.id}, 'Gift')" class="bg-pink-500 hover:bg-pink-600 text-white font-semibold text-xs px-2.5 py-2 rounded-xl transition" title="উপহার পাঠান">
                  <i class="fas fa-gift"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ---------------- Q HUB (CULTURE FEED) ----------------
  renderQHub() {
    const feed = document.getElementById('publicQHubFeed');
    if (!feed) return;

    const cultures = GithubDB.getCulture();
    if (cultures.length === 0) {
      feed.innerHTML = `<p class="text-gray-400 text-center col-span-2 py-6">কোনো নতুন আপডেট নেই।</p>`;
      return;
    }

    feed.innerHTML = cultures.map(c => `
      <div class="glass-card rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40">
        <div class="flex items-center gap-2 text-xs text-purple-400 mb-2">
          <i class="fas fa-bullhorn"></i>
          <span>Q Hub আপডেট • ${c.date || 'সাম্প্রতিক'}</span>
        </div>
        <h3 class="text-lg font-bold text-white mb-2">${c.title}</h3>
        <p class="text-gray-300 text-sm leading-relaxed mb-4">${c.description || ''}</p>
        ${c.image ? `
          <div class="rounded-xl overflow-hidden max-h-72 bg-slate-900 border border-white/10">
            <img src="${c.image}" class="w-full h-full object-cover hover:scale-102 transition-transform">
          </div>
        ` : ''}
      </div>
    `).join('');
  },

  // ---------------- PRODUCT DETAIL MODAL ----------------
  showProductDetail(id) {
    const p = GithubDB.getProductById(id);
    if (!p) return;
    this.activeProduct = p;

    let deliveryLogos = '';
    if (p.dPathao) deliveryLogos += `<span class="bg-slate-800 text-xs px-2.5 py-1 rounded-full border border-slate-700 text-gray-200"><i class="fas fa-motorcycle text-cyan-400 mr-1"></i>Pathao</span>`;
    if (p.dSteadfast) deliveryLogos += `<span class="bg-slate-800 text-xs px-2.5 py-1 rounded-full border border-slate-700 text-gray-200"><i class="fas fa-truck text-purple-400 mr-1"></i>Steadfast</span>`;
    if (p.dSundarban) deliveryLogos += `<span class="bg-slate-800 text-xs px-2.5 py-1 rounded-full border border-slate-700 text-gray-200"><i class="fas fa-box text-pink-400 mr-1"></i>Sundarban</span>`;

    const modalHTML = `
      <div class="glass-panel p-6 sm:p-8 rounded-3xl max-w-2xl w-full mx-auto relative modal-content border border-white/15">
        <button onclick="App.closeModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition">
          <i class="fas fa-times"></i>
        </button>

        <div class="flex flex-col md:flex-row gap-6 mb-6">
          <div class="md:w-1/2 rounded-2xl overflow-hidden bg-slate-950 border border-white/10 h-64 sm:h-72">
            <img src="${p.image || 'https://via.placeholder.com/400'}" class="w-full h-full object-cover">
          </div>
          <div class="md:w-1/2 flex flex-col">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="badge-pi px-2.5 py-0.5 rounded text-xs font-bold">${p.pi || 'QH-ITEM'}</span>
              <span class="text-xs text-amber-400"><i class="fas fa-star mr-1"></i>${p.rating || '4.9'}</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">${p.name}</h2>
            <div class="text-2xl font-extrabold text-cyan-400 mb-3">৳${p.price}</div>
            
            <p class="text-gray-300 text-sm leading-relaxed mb-4 overflow-y-auto max-h-32 pr-2">${p.desc || 'কোনো বিবরণ নেই।'}</p>

            <div class="mt-auto space-y-2">
              <div class="text-xs text-gray-400 flex items-center justify-between bg-white/5 px-3 py-2 rounded-xl">
                <span>মজুদ অবস্থা:</span>
                <span class="${p.stock === 'Out of Stock' ? 'text-red-400' : 'text-emerald-400'} font-bold">${p.stock || 'In Stock'}</span>
              </div>
              ${p.coupon ? `
                <div class="text-xs flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded-xl text-emerald-300">
                  <span><i class="fas fa-tag mr-1"></i> কুপন কোড:</span>
                  <span class="font-bold">${p.coupon}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Additional Specifications -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div class="bg-white/5 p-3 rounded-xl border border-white/5">
            <span class="text-xs text-gray-400 block mb-1"><i class="fas fa-truck text-cyan-400 mr-1"></i> ডেলিভারি পার্টনার্স</span>
            <div class="flex flex-wrap gap-1.5">${deliveryLogos || '<span class="text-xs text-gray-500">স্ট্যান্ডার্ড কুরিয়ার</span>'}</div>
          </div>
          <div class="bg-white/5 p-3 rounded-xl border border-white/5">
            <span class="text-xs text-gray-400 block mb-1"><i class="fas fa-shield-alt text-purple-400 mr-1"></i> রিটার্ন পলিসি</span>
            <span class="text-xs text-gray-200 font-medium">${p.returnPolicy || '৭ দিনের সহজ রিটার্ন'}</span>
          </div>
        </div>

        <!-- Verified Seller Info -->
        <div class="bg-black/40 p-4 rounded-2xl border border-purple-500/20 flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <img src="${p.sellerImg || 'https://via.placeholder.com/50'}" class="w-11 h-11 rounded-full object-cover border-2 border-purple-500/50">
            <div>
              <h4 class="font-bold text-white text-sm">${p.sellerName || 'ভেরিফাইড সেলার'}</h4>
              <span class="text-xs text-purple-400 font-mono">Seller ID: ${p.sellerId || 'N/A'}</span>
            </div>
          </div>
          <span class="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30"><i class="fas fa-check-circle mr-1"></i>বিশ্বস্ত পার্টনার</span>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button onclick="PublicPanel.openOrderModal(${p.id}, 'Buy')" class="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
            <i class="fas fa-shopping-cart"></i> Buy Now
          </button>
          <button onclick="PublicPanel.openOrderModal(${p.id}, 'Gift')" class="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20">
            <i class="fas fa-gift"></i> Gift Send
          </button>
        </div>
      </div>
    `;

    App.openModal(modalHTML);
  },

  // ---------------- ORDER & GIFT FORM ----------------
  openOrderModal(id, type = 'Buy') {
    const p = GithubDB.getProductById(id);
    if (!p) return;
    this.activeProduct = p;
    this.activeOrderType = type;

    // Prefill from customer profile if logged in
    const user = UserPanel.getLoggedInUser();
    const defaultName = user ? user.name : '';
    const defaultPhone = user ? user.phone : '';
    const defaultAddress = user ? user.address : '';

    const orderHTML = `
      <div class="glass-panel p-6 sm:p-8 rounded-3xl max-w-xl w-full mx-auto relative modal-content border border-cyan-500/30">
        <button onclick="App.closeModal()" class="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 flex items-center justify-center transition">
          <i class="fas fa-times"></i>
        </button>

        <div class="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
          <img src="${p.image || 'https://via.placeholder.com/80'}" class="w-14 h-14 rounded-xl object-cover border border-white/10">
          <div>
            <span class="text-xs px-2 py-0.5 rounded font-bold ${type === 'Gift' ? 'bg-pink-500/20 text-pink-300' : 'bg-cyan-500/20 text-cyan-300'}">${type === 'Gift' ? 'উপহার অর্ডার' : 'সাধারণ অর্ডার'}</span>
            <h3 class="font-bold text-white text-base mt-1 line-clamp-1">${p.name}</h3>
            <span class="text-cyan-400 font-bold text-sm">৳${p.price}</span>
          </div>
        </div>

        <!-- ORDER FORM CONTAINER -->
        <div id="orderFormStep1" class="space-y-4">
          <div>
            <label class="block text-xs text-gray-300 mb-1">আপনার পূর্ণ নাম <span class="text-red-400">*</span></label>
            <input type="text" id="orderCustName" value="${defaultName}" required placeholder="নাম লিখুন" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-sm">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-gray-300 mb-1">WhatsApp মোবাইল নম্বর <span class="text-red-400">*</span></label>
              <input type="tel" id="orderCustPhone" value="${defaultPhone}" required placeholder="01XXXXXXXXX" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-sm">
            </div>
            <div>
              <label class="block text-xs text-gray-300 mb-1">বিকল্প মোবাইল নম্বর (ঐচ্ছিক)</label>
              <input type="tel" id="orderCustAltPhone" placeholder="বিকল্প নম্বর" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-400 text-sm">
            </div>
          </div>

          <div>
            <label class="block text-xs text-gray-300 mb-1">পূর্ণ ডেলিভারি ঠিকানা <span class="text-red-400">*</span></label>
            <textarea id="orderCustAddress" rows="2" required placeholder="বাসা/হোল্ডিং নম্বর, রোড, এলাকা, থানা, জেলা" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-400 text-sm">${defaultAddress}</textarea>
          </div>

          <div class="grid grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
            <div>
              <label class="block text-xs text-gray-400 mb-1">পণ্যের পরিমাণ</label>
              <div class="flex items-center gap-2">
                <button type="button" onclick="PublicPanel.adjustQty(-1)" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center">-</button>
                <input type="number" id="orderQty" min="1" value="1" readonly class="w-12 text-center bg-transparent font-bold text-white text-base">
                <button type="button" onclick="PublicPanel.adjustQty(1)" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center">+</button>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-400 block mb-1">সর্বমোট মূল্য</span>
              <span id="orderTotalPrice" class="text-cyan-400 font-extrabold text-lg">৳${p.price}</span>
              <span class="text-[10px] text-pink-400 block">+ কুরিয়ার চার্জ</span>
            </div>
          </div>

          <p class="text-xs text-amber-400 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
            <i class="fas fa-info-circle mr-1"></i> বি:দ্র: ডেলিভারি চার্জসহ মোট মূল্য সেলার WhatsApp এ নিশ্চিত করবে।
          </p>

          <button onclick="PublicPanel.proceedToTerms()" class="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20">
            শর্তাবলী দেখুন ও পরবর্তী ধাপ <i class="fas fa-arrow-right"></i>
          </button>
        </div>

        <!-- TERMS STEP 2 -->
        <div id="orderFormStep2" class="hidden space-y-4">
          <h4 class="font-bold text-pink-400 text-sm border-b border-white/10 pb-2">নিচের শর্তাবলীতে সম্মতি প্রদান করুন :</h4>
          <ul class="text-xs text-gray-300 space-y-2 bg-black/30 p-3.5 rounded-xl border border-white/5 leading-relaxed max-h-48 overflow-y-auto">
            <li><i class="fas fa-check-circle text-cyan-400 mr-1.5"></i>১. পণ্যটির রিটার্ন পলিসি, মূল্য ও ডেলিভারি সিস্টেম ভালোভাবে দেখুন;</li>
            <li><i class="fas fa-check-circle text-cyan-400 mr-1.5"></i>২. পণ্যটির ডেলিভারি, দাম ও মান সম্পর্কে সেলারের থেকে নিশ্চিত হয়ে নিন;</li>
            <li><i class="fas fa-check-circle text-cyan-400 mr-1.5"></i>৩. সঠিক পণ্যের ডেলিভারি না পেলে অভিযোগ করুন, তবে "Q.hobby কোনো মধ্যস্থতাকারী হিসেবে দায়ভার নেবে না।"</li>
            <li><i class="fas fa-check-circle text-cyan-400 mr-1.5"></i>৪. শর্তাবলীতে যেকোনো সময় পরিবর্তন আসতে পারে।</li>
          </ul>

          <label class="flex items-start gap-2.5 bg-white/5 p-3 rounded-xl border border-cyan-500/30 cursor-pointer">
            <input type="checkbox" id="orderAgreeTerms" class="mt-0.5 w-4 h-4 accent-cyan-400 rounded">
            <span class="text-xs text-gray-200">আমি ১৮ ঊর্ধ্ব এবং সজ্ঞানে সকল শর্ত মেনে বিক্রেতাকে না ঠকানোর অঙ্গীকার করে অর্ডার করছি।</span>
          </label>

          <div class="flex gap-2.5 pt-2">
            <button onclick="PublicPanel.backToStep1()" class="bg-white/10 hover:bg-white/20 text-gray-300 font-bold px-4 py-3 rounded-xl transition text-sm">
              পিছনে
            </button>
            <button onclick="PublicPanel.submitFinalOrder()" class="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm">
              <i class="fab fa-whatsapp text-lg"></i> WhatsApp এ কনফার্ম করুন
            </button>
          </div>
        </div>
      </div>
    `;

    App.openModal(orderHTML);
  },

  adjustQty(change) {
    const qtyInput = document.getElementById('orderQty');
    if (!qtyInput || !this.activeProduct) return;
    let qty = parseInt(qtyInput.value) || 1;
    qty = Math.max(1, qty + change);
    qtyInput.value = qty;
    const total = (Number(this.activeProduct.price) || 0) * qty;
    document.getElementById('orderTotalPrice').innerText = `৳${total}`;
  },

  proceedToTerms() {
    const name = document.getElementById('orderCustName').value.trim();
    const phone = document.getElementById('orderCustPhone').value.trim();
    const address = document.getElementById('orderCustAddress').value.trim();

    if (!name || !phone || !address) {
      App.toast('দয়া করে নাম, মোবাইল নম্বর এবং ঠিকানা পূরণ করুন!', 'error');
      return;
    }

    document.getElementById('orderFormStep1').classList.add('hidden');
    document.getElementById('orderFormStep2').classList.remove('hidden');
  },

  backToStep1() {
    document.getElementById('orderFormStep2').classList.add('hidden');
    document.getElementById('orderFormStep1').classList.remove('hidden');
  },

  submitFinalOrder() {
    const agree = document.getElementById('orderAgreeTerms');
    if (!agree || !agree.checked) {
      App.toast('দয়া করে শর্তাবলীতে সম্মতি প্রদান করুন!', 'error');
      return;
    }

    const p = this.activeProduct;
    const name = document.getElementById('orderCustName').value.trim();
    const phone = document.getElementById('orderCustPhone').value.trim();
    const altPhone = document.getElementById('orderCustAltPhone').value.trim();
    const address = document.getElementById('orderCustAddress').value.trim();
    const qty = parseInt(document.getElementById('orderQty').value) || 1;
    const total = (Number(p.price) || 0) * qty;

    // 1. SAVE ORDER TO GITHUB DATABASE (Orders table)
    const newOrder = {
      customer_name: name,
      customer_phone: phone,
      customer_alt_phone: altPhone,
      customer_address: address,
      product_name: p.name,
      quantity: qty,
      total_price: total,
      seller_name: p.sellerName || 'N/A',
      seller_phone: p.sellerPhone || 'N/A',
      seller_id: p.sellerId || 'N/A',
      pi: p.pi || 'N/A',
      order_type: this.activeOrderType,
      status: 'Pending'
    };

    const saved = GithubDB.saveOrder(newOrder);

    // Also auto-register or link to User account
    UserPanel.registerCustomerOrder(phone, saved);

    // 2. DISPATCH FORMATTED WHATSAPP MESSAGE
    let waPhone = p.sellerPhone || AppConfig.adminPhone;
    if (waPhone.startsWith('0')) waPhone = '88' + waPhone;
    else if (!waPhone.startsWith('88')) waPhone = '880' + waPhone;

    let msg = `*🛒 নতুন ${this.activeOrderType} অর্ডার (${saved.order_id})*\n\n`;
    msg += `*পণ্যের নাম:* ${p.name}\n`;
    if (p.pi) msg += `*Product ID (PI):* ${p.pi}\n`;
    if (p.sellerId) msg += `*Seller ID:* ${p.sellerId}\n`;
    msg += `*পণ্যের ছবি:* ${p.image || 'N/A'}\n\n`;
    msg += `*👤 ক্রেতার তথ্য:*\n`;
    msg += `*নাম:* ${name}\n`;
    msg += `*WhatsApp:* ${phone}\n`;
    if (altPhone) msg += `*বিকল্প নম্বর:* ${altPhone}\n`;
    msg += `*ঠিকানা:* ${address}\n\n`;
    msg += `*📦 অর্ডারের বিবরণ:*\n`;
    msg += `*পরিমাণ:* ${qty} টি\n`;
    msg += `*মোট মূল্য:* ৳${total} (+ কুরিয়ার চার্জ)\n\n`;
    msg += `_✅ আমি শর্তাবলী মেনে অর্ডার প্লেস করেছি।_`;

    const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');

    App.closeModal();
    App.toast('অর্ডার সফলভাবে সেভ হয়েছে এবং WhatsApp এ পাঠানো হচ্ছে!', 'success');
  },

  // ---------------- VENDOR SELL SUBMISSION ----------------
  submitVendorForm() {
    const name = document.getElementById('sellProdName').value.trim();
    const price = document.getElementById('sellProdPrice').value.trim();
    const phone = document.getElementById('sellProdPhone').value.trim();
    const other = document.getElementById('sellProdOther').value.trim();
    const agree = document.getElementById('sellAgreeTerms').checked;

    if (!name || !price || !phone) {
      App.toast('দয়া করে পণ্যের নাম, মূল্য এবং মোবাইল নম্বর দিন!', 'error');
      return;
    }
    if (!agree) {
      App.toast('দয়া করে বিক্রেতা শর্তাবলীতে সম্মতি প্রদান করুন!', 'error');
      return;
    }

    let textMessage = `*🛍️ নতুন পণ্য বিক্রির অনুরোধ (Q.hobby)*\n\n`;
    textMessage += `*পণ্যের নাম:* ${name}\n`;
    textMessage += `*পণ্যের মূল্য:* ৳${price}\n`;
    textMessage += `*মোবাইল নম্বর:* ${phone}\n`;
    if (other) textMessage += `*অন্যান্য তথ্য:* ${other}\n\n`;
    textMessage += `_পণ্যটির ছবি নিচে সংযুক্ত করা হলো..._\n\n`;
    textMessage += `_✅ আমি সেলার শর্তাবলী সজ্ঞানে মেনে নিয়েছি।_`;

    const waUrl = `https://wa.me/${AppConfig.adminWaNumber}?text=${encodeURIComponent(textMessage)}`;
    window.open(waUrl, '_blank');

    document.getElementById('sellForm').reset();
    App.toast('সেলার রিকোয়েস্ট WhatsApp এ পাঠানো হচ্ছে!', 'success');
    App.switchPanel('public');
  },

  // ---------------- COMPLAINTS SUBMISSION ----------------
  submitComplaintForm() {
    const sId = document.getElementById('complainSellerId').value.trim();
    const desc = document.getElementById('complainDetails').value.trim();

    if (!sId || !desc) {
      App.toast('দয়া করে সেলার ID এবং অভিযোগের বিস্তারিত বিবরণ দিন!', 'error');
      return;
    }

    // Save to complaints database
    GithubDB.saveComplaint({
      seller_id: sId,
      description: desc
    });

    let msg = `*🚨 নতুন অভিযোগ (Q.hobby)*\n\n`;
    msg += `*সেলার ID:* ${sId}\n`;
    msg += `*অভিযোগের বর্ণনা:* ${desc}\n`;

    const waUrl = `https://wa.me/${AppConfig.adminWaNumber}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');

    document.getElementById('complainForm').reset();
    App.toast('অভিযোগ সফলভাবে গ্রহণ করা হয়েছে ও WhatsApp এ পাঠানো হচ্ছে!', 'success');
    App.switchPanel('public');
  },

  // ---------------- WISHLIST ----------------
  getWishlist() {
    try {
      return JSON.parse(localStorage.getItem(AppConfig.STORAGE_KEYS.WISHLIST) || '[]');
    } catch (e) {
      return [];
    }
  },

  toggleWishlist(prodId, event) {
    if (event) event.stopPropagation();
    let list = this.getWishlist();
    if (list.includes(prodId)) {
      list = list.filter(id => id !== prodId);
      App.toast('উইশলিস্ট থেকে সরানো হয়েছে', 'info');
    } else {
      list.push(prodId);
      App.toast('উইশলিস্টে যুক্ত হয়েছে!', 'success');
    }
    localStorage.setItem(AppConfig.STORAGE_KEYS.WISHLIST, JSON.stringify(list));
    this.updateWishlistBadge();
    this.renderShop();
    UserPanel.renderWishlist();
  },

  updateWishlistBadge() {
    const badge = document.getElementById('wishlistCountBadge');
    if (badge) {
      const count = this.getWishlist().length;
      badge.innerText = count;
      badge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }
};
