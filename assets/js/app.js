/**
 * Q.hobby Main Application Orchestrator
 * Panel Navigation, Global Modals, Toast Notifications
 */

const App = {
  currentPanel: 'public', // 'public', 'user', 'admin'
  currentSubTab: 'home',  // for public: 'home', 'shop', 'sell', 'complain'

  async init() {
    console.log('Starting Q.hobby application...');
    
    // 1. Initialize GitHub JSON Database
    await GithubDB.init();

    // 2. Initialize Panels
    PublicPanel.init();
    UserPanel.init();
    AdminPanel.init();

    // 3. Setup panel switch based on URL hash or default
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());

    console.log('Q.hobby application fully loaded.');
  },

  handleRoute() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'admin') {
      this.switchPanel('admin');
    } else if (hash === 'user' || hash === 'orders') {
      this.switchPanel('user');
    } else if (hash === 'sell') {
      this.switchPanel('public', 'sell');
    } else if (hash === 'complain') {
      this.switchPanel('public', 'complain');
    } else if (hash === 'shop') {
      this.switchPanel('public', 'shop');
    } else {
      this.switchPanel('public', 'home');
    }
  },

  switchPanel(panelName, subTab = 'home') {
    this.currentPanel = panelName;
    this.currentSubTab = subTab;

    // Toggle panels
    document.querySelectorAll('.app-panel').forEach(p => p.classList.add('hidden'));
    const targetPanel = document.getElementById(`panel_${panelName}`);
    if (targetPanel) targetPanel.classList.remove('hidden');

    // Bottom Navigation Active State
    document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
    
    if (panelName === 'public') {
      // Toggle public sub sections
      document.querySelectorAll('.public-sub-section').forEach(s => s.classList.add('hidden'));
      const targetSub = document.getElementById(`publicSubSection_${subTab}`);
      if (targetSub) targetSub.classList.remove('hidden');

      const bottomBtn = document.getElementById(`bottomNavBtn_${subTab}`);
      if (bottomBtn) bottomBtn.classList.add('active');
    } else if (panelName === 'user') {
      const bottomBtn = document.getElementById('bottomNavBtn_user');
      if (bottomBtn) bottomBtn.classList.add('active');
      UserPanel.renderUI();
    } else if (panelName === 'admin') {
      const bottomBtn = document.getElementById('bottomNavBtn_admin');
      if (bottomBtn) bottomBtn.classList.add('active');
      AdminPanel.renderUI();
    }

    // Top Navigation buttons highlight
    document.querySelectorAll('.top-nav-link').forEach(l => l.classList.remove('text-cyan-400', 'border-b-2', 'border-cyan-400'));
    const activeTopLink = document.getElementById(`topNav_${panelName}_${subTab}`) || document.getElementById(`topNav_${panelName}`);
    if (activeTopLink) activeTopLink.classList.add('text-cyan-400', 'border-b-2', 'border-cyan-400');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // ---------------- GLOBAL MODALS ----------------
  openModal(contentHtml) {
    const modal = document.getElementById('globalModalOverlay');
    const container = document.getElementById('globalModalContainer');
    if (!modal || !container) return;

    container.innerHTML = contentHtml;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('globalModalOverlay');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  },

  // ---------------- GLOBAL TOAST NOTIFICATIONS ----------------
  toast(message, type = 'info') {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;

    let icon = 'fas fa-info-circle';
    let bg = 'bg-slate-900 border-cyan-500/40 text-cyan-300';

    if (type === 'success') {
      icon = 'fas fa-check-circle text-emerald-400';
      bg = 'bg-slate-900 border-emerald-500/40 text-emerald-300';
    } else if (type === 'error') {
      icon = 'fas fa-exclamation-circle text-red-400';
      bg = 'bg-slate-900 border-red-500/40 text-red-300';
    } else if (type === 'warning') {
      icon = 'fas fa-exclamation-triangle text-amber-400';
      bg = 'bg-slate-900 border-amber-500/40 text-amber-300';
    }

    toast.className = `fixed top-20 right-4 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl transition-all duration-300 text-sm font-medium ${bg}`;
    toast.innerHTML = `<i class="${icon} text-lg"></i><span>${message}</span>`;
    toast.classList.add('show');

    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
};

// Start application
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
