/**
 * LOGIKA APLIKASI SISTEM INFORMASI PERSEDIAAN RUTAN KELAS II B SIAK
 * Pengelola Keuangan:
 * 1. Muhammad Kurniawan (Bendahara)
 * 2. Fajar Gustiawan (Aset dan Persediaan)
 * 3. Rizky Firmansyah (Penyusunan Rencana Anggaran)
 */

// Application State
const AppState = {
  inventory: [],
  transactions: [],
  officers: [],
  currentTab: "dashboard",
  activeOfficerId: "fajar",
  searchQuery: "",
  selectedCategory: "ALL",
  selectedStockStatus: "ALL",
  currentPage: 1,
  itemsPerPage: 15,
  theme: "light",
  currentUser: null,
  isAuthenticated: false,
  loginClockTimer: null
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initData();
  setupNavigation();
  setupEventListeners();
  setupAuthEventListeners();
  if (AppState.isAuthenticated) {
    renderApp();
  }
});

// ====================================================================
// MODUL KEAMANAN & OTENTIKASI SESI PENGGUNA (SIM-PERSEDIAAN)
// ====================================================================

function initAuth() {
  const portalEl = document.getElementById("loginPortal");
  const appContainer = document.getElementById("appContainer");

  // Check saved session in localStorage (remember me) or sessionStorage
  const rawSession = localStorage.getItem("sim_auth_session") || sessionStorage.getItem("sim_auth_session");
  
  if (rawSession) {
    try {
      const session = JSON.parse(rawSession);
      if (session && session.username && session.token) {
        AppState.currentUser = session;
        AppState.isAuthenticated = true;
        AppState.activeOfficerId = session.officerId || "fajar";

        if (portalEl) portalEl.style.display = "none";
        if (appContainer) appContainer.style.display = "flex";

        updateActiveOfficerUI();
        return;
      }
    } catch (e) {
      console.warn("Invalid auth session data, resetting:", e);
      localStorage.removeItem("sim_auth_session");
      sessionStorage.removeItem("sim_auth_session");
    }
  }

  // Not authenticated
  AppState.currentUser = null;
  AppState.isAuthenticated = false;

  if (portalEl) portalEl.style.display = "flex";
  if (appContainer) appContainer.style.display = "none";

  startLoginClock();
}

function startLoginClock() {
  if (AppState.loginClockTimer) clearInterval(AppState.loginClockTimer);
  
  const updateClock = () => {
    const clockEl = document.getElementById("loginLiveClock");
    if (!clockEl) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} WIB`;
    clockEl.innerHTML = `<i class="bi bi-clock-fill"></i> <span>${timeStr}</span>`;
  };

  updateClock();
  AppState.loginClockTimer = setInterval(updateClock, 1000);
}

function getRegisteredAuthUsers() {
  let customUsers = [];
  try {
    const raw = localStorage.getItem("sim_custom_users");
    if (raw) customUsers = JSON.parse(raw);
  } catch (e) {}

  if (Array.isArray(customUsers) && customUsers.length > 0) {
    return customUsers;
  }

  // Fallback to DEFAULT_AUTH_USERS from data.js
  if (typeof DEFAULT_AUTH_USERS !== "undefined" && Array.isArray(DEFAULT_AUTH_USERS)) {
    return DEFAULT_AUTH_USERS;
  }

  // Ultra-safe fallback
  return [
    {
      username: "fajar",
      password: "fajar123",
      officerId: "fajar",
      nama: "Fajar Gustiawan, S.E",
      jabatan: "Pengelola Aset dan Persediaan (BMN)",
      nip: "19950925 201712 1 003",
      nipClean: "199509252017121003",
      isAdmin: true,
      avatar: "FG"
    },
    {
      username: "kurniawan",
      password: "kurniawan123",
      officerId: "kurniawan",
      nama: "Muhammad Kurniawan, S.E.",
      jabatan: "Bendahara Pengeluaran",
      nip: "19981003 201712 1 002",
      nipClean: "199810032017121002",
      isAdmin: false,
      avatar: "MK"
    },
    {
      username: "rizky",
      password: "rizky123",
      officerId: "rizky",
      nama: "Rizky Firmansyah, S.E.",
      jabatan: "Penyusunan Rencana Anggaran",
      nip: "20010424 202203 1 003",
      nipClean: "200104242022031003",
      isAdmin: false,
      avatar: "RF"
    },
    {
      username: "karutan",
      password: "karutan123",
      officerId: "karutan",
      nama: "Dedy Krihastoni, A.Md.IP,S.H",
      jabatan: "Kepala Rumah Tahanan Negara",
      nip: "19841217 200701 1 004",
      nipClean: "198412172007011004",
      isAdmin: true,
      avatar: "DK"
    },
    {
      username: "admin",
      password: "adminrutan2026",
      officerId: "fajar",
      nama: "Administrator Sistem BMN",
      jabatan: "Super Administrator SIM-Persediaan",
      nip: "19950925 201712 1 003",
      nipClean: "admin",
      isAdmin: true,
      avatar: "ADM"
    }
  ];
}

function setupAuthEventListeners() {
  // Login Form Submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  // Toggle Password Visibility
  const btnTogglePw = document.getElementById("btnTogglePassword");
  const pwInput = document.getElementById("loginPassword");
  const toggleIcon = document.getElementById("togglePasswordIcon");
  if (btnTogglePw && pwInput) {
    btnTogglePw.addEventListener("click", () => {
      const isPassword = pwInput.type === "password";
      pwInput.type = isPassword ? "text" : "password";
      if (toggleIcon) {
        toggleIcon.className = isPassword ? "bi bi-eye-slash" : "bi bi-eye";
      }
      btnTogglePw.title = isPassword ? "Sembunyikan Kata Sandi" : "Lihat Kata Sandi";
    });
  }

  // Username clear button
  const usernameInput = document.getElementById("loginUsername");
  const clearBtn = document.getElementById("btnClearUsername");
  if (usernameInput && clearBtn) {
    usernameInput.addEventListener("input", () => {
      clearBtn.style.display = usernameInput.value ? "flex" : "none";
    });
    clearBtn.addEventListener("click", () => {
      usernameInput.value = "";
      clearBtn.style.display = "none";
      usernameInput.focus();
    });
  }

  // Quick credentials card selection
  const quickCards = document.querySelectorAll(".quick-user-card");
  quickCards.forEach(card => {
    card.addEventListener("click", () => {
      const u = card.getAttribute("data-username");
      const p = card.getAttribute("data-password");
      if (usernameInput) {
        usernameInput.value = u;
        usernameInput.classList.remove("input-highlight");
        void usernameInput.offsetWidth;
        usernameInput.classList.add("input-highlight");
        if (clearBtn) clearBtn.style.display = "flex";
      }
      if (pwInput) {
        pwInput.value = p;
        pwInput.classList.remove("input-highlight");
        void pwInput.offsetWidth;
        pwInput.classList.add("input-highlight");
      }

      // Hide any previous alert
      const alertBox = document.getElementById("loginAlertBox");
      if (alertBox) alertBox.style.display = "none";

      showToast(`Kredensial akun [${u}] telah dimasukkan! Silakan klik Masuk.`, "success");
    });
  });

  // Help Modal Trigger
  const btnHelp = document.getElementById("btnHelpModalTrigger");
  if (btnHelp) {
    btnHelp.addEventListener("click", () => openModal("modalAuthHelp"));
  }

  // Topbar and Sidebar Logout Triggers
  const topbarLogout = document.getElementById("topbarLogoutBtn");
  if (topbarLogout) {
    topbarLogout.addEventListener("click", () => openModal("modalConfirmLogout"));
  }

  const sidebarLogout = document.getElementById("sidebarLogoutBtn");
  if (sidebarLogout) {
    sidebarLogout.addEventListener("click", () => openModal("modalConfirmLogout"));
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const usernameInput = document.getElementById("loginUsername");
  const pwInput = document.getElementById("loginPassword");
  const rememberCheckbox = document.getElementById("loginRemember");
  const alertBox = document.getElementById("loginAlertBox");
  const submitBtn = document.getElementById("btnLoginSubmit");
  const submitNormal = submitBtn?.querySelector(".btn-submit-normal");
  const submitLoading = submitBtn?.querySelector(".btn-submit-loading");

  const rawUser = usernameInput ? usernameInput.value.trim() : "";
  const rawPass = pwInput ? pwInput.value : "";

  if (!rawUser || !rawPass) {
    if (alertBox) {
      alertBox.className = "login-alert-box";
      alertBox.innerHTML = `
        <i class="bi bi-exclamation-triangle-fill" style="font-size:18px;"></i>
        <span>Harap masukkan Username / NIP dan Kata Sandi terlebih dahulu!</span>
      `;
      alertBox.style.display = "flex";
    }
    return;
  }

  // Sanitize: remove whitespace, dots, and hyphens for NIP checking
  const cleanInputUser = rawUser.toLowerCase().replace(/[\s.-]/g, "");
  const registered = getRegisteredAuthUsers();

  const matched = registered.find(u => {
    const uName = (u.username || "").toLowerCase().trim();
    const uNipClean = (u.nipClean || u.nip || "").replace(/[\s.-]/g, "");
    const usernameMatches = (uName === cleanInputUser || uNipClean === cleanInputUser);
    const passwordMatches = (u.password === rawPass);
    return usernameMatches && passwordMatches;
  });

  if (!matched) {
    if (alertBox) {
      alertBox.className = "login-alert-box";
      alertBox.innerHTML = `
        <i class="bi bi-shield-x" style="font-size:20px;flex-shrink:0;"></i>
        <div>
          <strong>Akses Ditolak:</strong> Username / NIP atau Kata Sandi tidak sesuai.<br>
          <span style="font-size:11.5px;opacity:0.9;">Gunakan akun resmi pengelola atau hubungi pengurus BMN Rutan Siak.</span>
        </div>
      `;
      alertBox.style.display = "flex";
    }
    if (pwInput) {
      pwInput.value = "";
      pwInput.focus();
    }
    return;
  }

  // Credentials Validated!
  if (submitBtn) submitBtn.disabled = true;
  if (submitNormal) submitNormal.style.display = "none";
  if (submitLoading) submitLoading.style.display = "inline-flex";

  if (alertBox) {
    alertBox.className = "login-alert-box alert-success";
    alertBox.innerHTML = `
      <i class="bi bi-shield-check" style="font-size:20px;flex-shrink:0;"></i>
      <div>
        <strong>Otentikasi Berhasil!</strong><br>
        <span style="font-size:11.5px;">Selamat datang, <strong>${matched.nama}</strong>. Memuat hak akses data persediaan...</span>
      </div>
    `;
    alertBox.style.display = "flex";
  }

  setTimeout(() => {
    const sessionObj = {
      username: matched.username,
      nama: matched.nama,
      jabatan: matched.jabatan,
      peran: matched.peran,
      officerId: matched.officerId,
      nip: matched.nip,
      isAdmin: !!matched.isAdmin,
      avatar: matched.avatar || matched.nama.slice(0, 2).toUpperCase(),
      token: "AUTH-" + Date.now() + "-" + Math.random().toString(36).substring(2, 9),
      loginAt: new Date().toISOString()
    };

    const remember = rememberCheckbox ? rememberCheckbox.checked : true;
    if (remember) {
      localStorage.setItem("sim_auth_session", JSON.stringify(sessionObj));
      sessionStorage.removeItem("sim_auth_session");
    } else {
      sessionStorage.setItem("sim_auth_session", JSON.stringify(sessionObj));
      localStorage.removeItem("sim_auth_session");
    }

    AppState.currentUser = sessionObj;
    AppState.isAuthenticated = true;
    AppState.activeOfficerId = sessionObj.officerId;

    if (AppState.loginClockTimer) {
      clearInterval(AppState.loginClockTimer);
      AppState.loginClockTimer = null;
    }

    const portalEl = document.getElementById("loginPortal");
    const appContainer = document.getElementById("appContainer");
    if (portalEl) portalEl.style.display = "none";
    if (appContainer) appContainer.style.display = "flex";

    if (submitBtn) submitBtn.disabled = false;
    if (submitNormal) submitNormal.style.display = "inline-flex";
    if (submitLoading) submitLoading.style.display = "none";
    if (alertBox) alertBox.style.display = "none";

    renderApp();
    updateActiveOfficerUI();

    showToast(`Selamat Datang, ${sessionObj.nama} di Portal SIM-Persediaan Rutan Siak!`, "success");
  }, 450);
}

function executeLogout() {
  closeModal("modalConfirmLogout");

  localStorage.removeItem("sim_auth_session");
  sessionStorage.removeItem("sim_auth_session");

  AppState.currentUser = null;
  AppState.isAuthenticated = false;

  const appContainer = document.getElementById("appContainer");
  const portalEl = document.getElementById("loginPortal");
  if (appContainer) appContainer.style.display = "none";
  if (portalEl) portalEl.style.display = "flex";

  // Reset inputs
  const usernameInput = document.getElementById("loginUsername");
  const pwInput = document.getElementById("loginPassword");
  if (usernameInput) usernameInput.value = "";
  if (pwInput) pwInput.value = "";

  const alertBox = document.getElementById("loginAlertBox");
  if (alertBox) {
    alertBox.className = "login-alert-box alert-success";
    alertBox.innerHTML = `
      <i class="bi bi-shield-check" style="font-size:20px;flex-shrink:0;"></i>
      <div>
        <strong>Sesi Telah Berakhir:</strong> Anda telah keluar dari sistem secara aman. Portal telah terkunci kembali untuk publik.
      </div>
    `;
    alertBox.style.display = "flex";
  }

  startLoginClock();
  showToast("Sesi kedinasan berhasil diakhiri dengan aman.", "success");
}

// Seed and Sync Data with LocalStorage
function initData() {
  const CURRENT_DATA_VERSION = "2026.10.v4_full_1194";
  const storedVersion = localStorage.getItem("sim_rutan_version");
  const storedInventory = localStorage.getItem("sim_rutan_inventory");
  const storedTrx = localStorage.getItem("sim_rutan_transactions");
  const storedOfficers = localStorage.getItem("sim_rutan_officers");
  const storedTheme = localStorage.getItem("sim_rutan_theme");

  // Jika versi data diperbarui atau jumlah data belum mencakup seluruh 1.194 barang, sinkronkan otomatis
  let needsSync = (storedVersion !== CURRENT_DATA_VERSION) || !storedInventory;
  if (!needsSync && storedInventory) {
    try {
      const parsed = JSON.parse(storedInventory);
      if (!Array.isArray(parsed) || parsed.length < 1000) {
        needsSync = true;
      }
    } catch (e) {
      needsSync = true;
    }
  }

  if (needsSync) {
    AppState.officers = [...PENGELOLA_KEUANGAN];
    saveOfficers();
    AppState.inventory = [...MASTER_INVENTORY_DATA];
    saveInventory();
    AppState.transactions = [...DEFAULT_TRANSACTIONS];
    saveTransactions();
    localStorage.setItem("sim_rutan_version", CURRENT_DATA_VERSION);
  } else {
    try {
      AppState.officers = storedOfficers ? JSON.parse(storedOfficers) : [...PENGELOLA_KEUANGAN];
    } catch (e) {
      AppState.officers = [...PENGELOLA_KEUANGAN];
    }
    try {
      AppState.inventory = storedInventory ? JSON.parse(storedInventory) : [...MASTER_INVENTORY_DATA];
    } catch (e) {
      AppState.inventory = [...MASTER_INVENTORY_DATA];
    }
    try {
      AppState.transactions = storedTrx ? JSON.parse(storedTrx) : [...DEFAULT_TRANSACTIONS];
    } catch (e) {
      AppState.transactions = [...DEFAULT_TRANSACTIONS];
    }
  }

  if (storedTheme) {
    AppState.theme = storedTheme;
    document.documentElement.setAttribute("data-theme", storedTheme);
  }
}

function saveInventory() {
  localStorage.setItem("sim_rutan_inventory", JSON.stringify(AppState.inventory));
}

function saveTransactions() {
  localStorage.setItem("sim_rutan_transactions", JSON.stringify(AppState.transactions));
}

function saveOfficers() {
  localStorage.setItem("sim_rutan_officers", JSON.stringify(AppState.officers));
}

// Navigation and Tab Switching
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tab = item.getAttribute("data-tab");
      switchTab(tab);
    });
  });

  const menuToggle = document.getElementById("menuToggleBtn");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      document.querySelector(".sidebar").classList.toggle("show");
    });
  }

  // Officer Selector in Topbar
  const officerSelect = document.getElementById("topbarOfficerSelect");
  if (officerSelect) {
    officerSelect.addEventListener("change", (e) => {
      AppState.activeOfficerId = e.target.value;
      updateActiveOfficerUI();
      showToast(`Petugas aktif dialihkan ke: ${getActiveOfficer().nama}`, "success");
    });
  }

  // Theme Toggle
  const themeToggle = document.getElementById("themeToggleBtn");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      AppState.theme = AppState.theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", AppState.theme);
      localStorage.setItem("sim_rutan_theme", AppState.theme);
      themeToggle.innerHTML = AppState.theme === "light" 
        ? '<i class="bi bi-moon-stars"></i>' 
        : '<i class="bi bi-sun"></i>';
    });
  }
}

function switchTab(tabId) {
  AppState.currentTab = tabId;
  document.querySelectorAll(".nav-item").forEach(el => {
    el.classList.toggle("active", el.getAttribute("data-tab") === tabId);
  });
  document.querySelectorAll(".tab-pane").forEach(el => {
    el.classList.toggle("active", el.id === `tab-${tabId}`);
  });

  // Dynamic titles
  const titleMap = {
    dashboard: "Beranda & Ringkasan Persediaan",
    inventory: "Katalog Master Barang Persediaan",
    transactions: "Buku Transaksi Persediaan (Masuk / Keluar)",
    officers: "Pejabat Pengelola Keuangan & Persediaan",
    reports: "Pusat Cetak Dokumen Kedinasan (UAKPB)"
  };
  const titleBox = document.getElementById("pageMainTitle");
  if (titleBox) titleBox.textContent = titleMap[tabId] || "SIM-Persediaan Rutan Siak";

  // Re-render specific tab
  if (tabId === "dashboard") renderDashboard();
  if (tabId === "inventory") renderInventoryTable();
  if (tabId === "transactions") renderTransactionsTable();
  if (tabId === "officers") renderOfficersGrid();
  if (tabId === "reports") updateReportPreview();

  // Close mobile sidebar
  document.querySelector(".sidebar").classList.remove("show");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getActiveOfficer() {
  return AppState.officers.find(o => o.id === AppState.activeOfficerId) || AppState.officers[0];
}

function updateActiveOfficerUI() {
  const current = getActiveOfficer();
  const select = document.getElementById("topbarOfficerSelect");
  if (select) select.value = current.id;
  
  const footName = document.getElementById("sidebarFootOfficerName");
  const footRole = document.getElementById("sidebarFootOfficerRole");
  const footAvatar = document.getElementById("sidebarFootAvatar");
  if (footName) footName.textContent = current.nama;
  if (footRole) footRole.textContent = current.jabatan;
  if (footAvatar) {
    const initials = current.nama.split(" ").map(n => n[0]).slice(0, 2).join("");
    footAvatar.textContent = initials;
  }
}

// Event Listeners for Actions
function setupEventListeners() {
  // Search
  const searchInput = document.getElementById("inventorySearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      AppState.searchQuery = e.target.value.toLowerCase();
      AppState.currentPage = 1;
      renderInventoryTable();
    });
  }

  // Category filter select
  const catSelect = document.getElementById("inventoryCategorySelect");
  if (catSelect) {
    catSelect.addEventListener("change", (e) => {
      AppState.selectedCategory = e.target.value;
      AppState.currentPage = 1;
      updateCatTabsUI();
      renderInventoryTable();
    });
  }

  // Stock status filter
  const stockStatusSelect = document.getElementById("inventoryStockStatusSelect");
  if (stockStatusSelect) {
    stockStatusSelect.addEventListener("change", (e) => {
      AppState.selectedStockStatus = e.target.value;
      AppState.currentPage = 1;
      renderInventoryTable();
    });
  }

  // Quick Action Buttons
  document.getElementById("btnOpenTrxMasuk")?.addEventListener("click", () => openModal("modalTrxMasuk"));
  document.getElementById("btnOpenTrxKeluar")?.addEventListener("click", () => openModal("modalTrxKeluar"));
  document.getElementById("btnOpenTambahBarang")?.addEventListener("click", () => openModal("modalTambahBarang"));
  document.getElementById("btnResetDatabase")?.addEventListener("click", confirmResetData);
  document.getElementById("btnExportCSV")?.addEventListener("click", exportInventoryToCSV);
}

function updateCatTabsUI() {
  document.querySelectorAll(".cat-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-cat") === AppState.selectedCategory);
  });
}

// Render Core App
function renderApp() {
  updateActiveOfficerUI();
  populateCategorySelects();
  populateBarangSelects();
  renderDashboard();
  renderInventoryTable();
  renderTransactionsTable();
  renderOfficersGrid();
}

// ----------------------------------------------------
// DASHBOARD RENDERING
// ----------------------------------------------------
function renderDashboard() {
  const totalItems = AppState.inventory.length;
  const inStockItems = AppState.inventory.filter(i => i.stokAkhir > 0);
  const outOfStockItems = AppState.inventory.filter(i => i.stokAkhir === 0);
  const totalQuantity = AppState.inventory.reduce((sum, item) => sum + item.stokAkhir, 0);

  // Set KPIs
  document.getElementById("kpiTotalJenis").textContent = totalItems;
  document.getElementById("kpiTersedia").textContent = inStockItems.length;
  document.getElementById("kpiHabis").textContent = outOfStockItems.length;
  document.getElementById("kpiTotalFisik").textContent = totalQuantity.toLocaleString("id-ID");

  // Populate Priority Items List (e.g., Amunisi, Sabun WBP, APAR, Tes Urine, dll)
  const priorityListEl = document.getElementById("priorityInventoryList");
  if (priorityListEl) {
    const keyItems = inStockItems.sort((a, b) => b.stokAkhir - a.stokAkhir);
    priorityListEl.innerHTML = keyItems.map(item => `
      <div class="priority-item">
        <div class="priority-left">
          <div class="priority-category-dot" style="background: ${getCategoryColor(item.kategori)};"></div>
          <div class="priority-info">
            <h4>${item.namaBarang}</h4>
            <span>${item.kategori} &bull; ${item.lokasi}</span>
          </div>
        </div>
        <div class="priority-right">
          <div class="stock-tag in-stock">
            ${item.stokAkhir.toLocaleString("id-ID")} <small style="font-size:11px;font-weight:normal;">${item.satuan}</small>
          </div>
          <button class="btn-icon-sm" title="Catat Distribusi Keluar" onclick="openQuickKeluarModal(${item.id})">
            <i class="bi bi-box-arrow-up-right"></i>
          </button>
        </div>
      </div>
    `).join("");
  }

  // Populate Recent Transactions Widget
  const recentTrxEl = document.getElementById("dashboardRecentTrxList");
  if (recentTrxEl) {
    const recents = [...AppState.transactions].reverse().slice(0, 5);
    recentTrxEl.innerHTML = recents.map(trx => `
      <div class="priority-item">
        <div class="priority-left">
          <div class="priority-category-dot" style="background: ${trx.jenis === 'MASUK' ? '#059669' : '#e11d48'};"></div>
          <div class="priority-info">
            <h4>${trx.namaBarang}</h4>
            <span>${trx.tanggal} &bull; ${trx.noDok} &bull; Oleh: ${trx.petugas.split(',')[0]}</span>
          </div>
        </div>
        <div class="priority-right">
          <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:${trx.jenis === 'MASUK' ? '#059669' : '#e11d48'};">
            ${trx.jenis === 'MASUK' ? '+' : '-'}${trx.jumlah} ${trx.satuan}
          </span>
        </div>
      </div>
    `).join("");
  }
}

function getCategoryColor(cat) {
  const map = {
    "Pengamanan & Senjata": "#e11d48",
    "Obat & Medis (Klinik)": "#059669",
    "Kebersihan & Sanitasi WBP": "#2563eb",
    "Alat Tulis Kantor (ATK)": "#d97706",
    "Elektronik & Listrik": "#ea580c",
    "Konsumsi & Perlengkapan Dapur": "#9333ea",
    "Perlengkapan WBP & Seragam": "#0284c7",
    "Pemeliharaan & Bangunan": "#64748b"
  };
  return map[cat] || "#475569";
}

function getCategoryClass(cat) {
  const map = {
    "Pengamanan & Senjata": "cat-pengamanan",
    "Obat & Medis (Klinik)": "cat-medis",
    "Kebersihan & Sanitasi WBP": "cat-kebersihan",
    "Alat Tulis Kantor (ATK)": "cat-atk",
    "Elektronik & Listrik": "cat-listrik",
    "Konsumsi & Perlengkapan Dapur": "cat-dapur",
    "Perlengkapan WBP & Seragam": "cat-seragam",
    "Pemeliharaan & Bangunan": "cat-pemeliharaan"
  };
  return map[cat] || "cat-pemeliharaan";
}

// ----------------------------------------------------
// INVENTORY TABLE RENDERING
// ----------------------------------------------------
function renderInventoryTable() {
  const tbody = document.getElementById("inventoryTableBody");
  if (!tbody) return;

  // Filter
  let filtered = AppState.inventory.filter(item => {
    // Search
    const matchesSearch = !AppState.searchQuery || 
      item.namaBarang.toLowerCase().includes(AppState.searchQuery) ||
      item.kdBarang.toLowerCase().includes(AppState.searchQuery) ||
      item.kdSubKelompok.toLowerCase().includes(AppState.searchQuery) ||
      item.noDok.toLowerCase().includes(AppState.searchQuery);

    // Category
    const matchesCat = AppState.selectedCategory === "ALL" || item.kategori === AppState.selectedCategory;

    // Stock Status
    const matchesStock = AppState.selectedStockStatus === "ALL" ||
      (AppState.selectedStockStatus === "IN_STOCK" && item.stokAkhir > 0) ||
      (AppState.selectedStockStatus === "EMPTY" && item.stokAkhir === 0);

    return matchesSearch && matchesCat && matchesStock;
  });

  // Total filtered display
  const countDisplay = document.getElementById("inventoryCountDisplay");
  if (countDisplay) {
    countDisplay.textContent = `Menampilkan ${filtered.length} dari ${AppState.inventory.length} jenis barang persediaan`;
  }

  // Pagination
  const totalPages = Math.ceil(filtered.length / AppState.itemsPerPage) || 1;
  if (AppState.currentPage > totalPages) AppState.currentPage = totalPages;
  const startIdx = (AppState.currentPage - 1) * AppState.itemsPerPage;
  const pagedItems = filtered.slice(startIdx, startIdx + AppState.itemsPerPage);

  if (pagedItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:40px;color:var(--text-muted);">
          <i class="bi bi-inbox" style="font-size:32px;display:block;margin-bottom:8px;"></i>
          Tidak ada data barang persediaan yang cocok dengan kriteria pencarian.
        </td>
      </tr>
    `;
    renderPagination(0, 0);
    return;
  }

  tbody.innerHTML = pagedItems.map((item, idx) => `
    <tr>
      <td style="font-size:12px;color:var(--text-muted);">${startIdx + idx + 1}</td>
      <td class="code-cell">${item.kdSubKelompok}</td>
      <td class="code-cell" style="font-weight:bold;color:var(--primary-500);">${item.kdBarang}</td>
      <td class="item-name-cell">
        ${item.namaBarang}
        <div style="font-size:11px;font-weight:normal;color:var(--text-muted);">${item.keterangan || ''}</div>
      </td>
      <td>
        <span class="category-tag ${getCategoryClass(item.kategori)}">${item.kategori}</span>
      </td>
      <td style="font-size:12px;font-weight:600;">${item.satuan}</td>
      <td>
        <span class="stock-pill ${item.stokAkhir > 0 ? 'positive' : 'zero'}">
          ${item.stokAkhir.toLocaleString("id-ID")}
        </span>
      </td>
      <td>
        <div class="action-btn-group">
          <button class="btn-icon-sm" title="Tambah Stok (+)" onclick="quickAdjustStock(${item.id}, 1)">
            <i class="bi bi-plus-lg"></i>
          </button>
          <button class="btn-icon-sm" title="Kurangi Stok (-)" onclick="quickAdjustStock(${item.id}, -1)">
            <i class="bi bi-dash-lg"></i>
          </button>
          <button class="btn-icon-sm" title="Detail & Edit" onclick="openDetailModal(${item.id})">
            <i class="bi bi-pencil-square"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  renderPagination(totalPages, filtered.length);
}

function renderPagination(totalPages, totalItems) {
  const container = document.getElementById("inventoryPaginationControls");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = `
    <button class="page-btn" ${AppState.currentPage === 1 ? 'disabled' : ''} onclick="changePage(${AppState.currentPage - 1})">
      <i class="bi bi-chevron-left"></i>
    </button>
  `;

  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= AppState.currentPage - 1 && p <= AppState.currentPage + 1)) {
      html += `
        <button class="page-btn ${p === AppState.currentPage ? 'active' : ''}" onclick="changePage(${p})">
          ${p}
        </button>
      `;
    } else if (p === AppState.currentPage - 2 || p === AppState.currentPage + 2) {
      html += `<span style="padding:0 4px;">...</span>`;
    }
  }

  html += `
    <button class="page-btn" ${AppState.currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${AppState.currentPage + 1})">
      <i class="bi bi-chevron-right"></i>
    </button>
  `;

  container.innerHTML = html;
}

function changePage(page) {
  AppState.currentPage = page;
  renderInventoryTable();
}

function filterByCategoryTab(cat) {
  AppState.selectedCategory = cat;
  AppState.currentPage = 1;
  const select = document.getElementById("inventoryCategorySelect");
  if (select) select.value = cat;
  updateCatTabsUI();
  renderInventoryTable();
}

// ----------------------------------------------------
// TRANSACTIONS TABLE RENDERING
// ----------------------------------------------------
function renderTransactionsTable() {
  const tbody = document.getElementById("transactionsTableBody");
  if (!tbody) return;

  const trxs = [...AppState.transactions].reverse();
  if (trxs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center;padding:30px;color:var(--text-muted);">
          Belum ada riwayat mutasi transaksi barang persediaan.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = trxs.map((trx, idx) => `
    <tr>
      <td style="font-size:12px;color:var(--text-muted);">${idx + 1}</td>
      <td style="font-size:12px;white-space:nowrap;">${trx.tanggal}</td>
      <td class="code-cell">${trx.noDok}</td>
      <td class="item-name-cell">${trx.namaBarang}</td>
      <td>
        <span class="category-tag ${trx.jenis === 'MASUK' ? 'cat-medis' : 'cat-pengamanan'}">
          ${trx.jenis}
        </span>
      </td>
      <td style="font-family:'JetBrains Mono',monospace;font-weight:700;color:${trx.jenis === 'MASUK' ? '#059669' : '#e11d48'};">
        ${trx.jenis === 'MASUK' ? '+' : '-'}${trx.jumlah} ${trx.satuan}
      </td>
      <td style="font-size:12px;">${trx.tujuan || trx.sumber}</td>
      <td style="font-size:12px;color:var(--text-muted);">${trx.petugas.split(',')[0]}</td>
    </tr>
  `).join("");
}

// ----------------------------------------------------
// OFFICERS MANAGEMENT RENDERING
// ----------------------------------------------------
function renderOfficersGrid() {
  const container = document.getElementById("officersGridContainer");
  if (!container) return;

  container.innerHTML = AppState.officers.map(officer => `
    <div class="officer-card ${officer.id === AppState.activeOfficerId ? 'border-primary' : ''}">
      <div class="officer-card-top">
        <div class="officer-avatar-large">${officer.avatar || officer.nama.slice(0, 2).toUpperCase()}</div>
        <div class="officer-details">
          <h3>${officer.nama}</h3>
          <div class="officer-role">${officer.jabatan}</div>
          <span class="badge" style="background:var(--accent-teal-light);color:var(--accent-teal);font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600;">
            ${officer.peran}
          </span>
        </div>
      </div>
      <div class="officer-meta-list">
        <div class="officer-meta-row">
          <span>NIP :</span>
          <strong>${officer.nip}</strong>
        </div>
        <div class="officer-meta-row">
          <span>Pangkat / Gol :</span>
          <strong>${officer.pangkat}</strong>
        </div>
        <div class="officer-meta-row">
          <span>Status Dinas :</span>
          <strong style="color:#059669;">${officer.status || 'Aktif'}</strong>
        </div>
        <div class="officer-meta-row">
          <span>Kontak :</span>
          <strong>${officer.kontak}</strong>
        </div>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px;">
        <button class="btn-secondary" style="flex:1;padding:6px;font-size:12px;" onclick="setActiveOfficer('${officer.id}')">
          ${officer.id === AppState.activeOfficerId ? '✓ Pejabat Aktif' : 'Pilih Sebagai Petugas Aktif'}
        </button>
      </div>
    </div>
  `).join("");
}

function setActiveOfficer(id) {
  AppState.activeOfficerId = id;
  updateActiveOfficerUI();
  renderOfficersGrid();
  showToast(`Petugas aktif ditetapkan: ${getActiveOfficer().nama}`, "success");
}

// ----------------------------------------------------
// STOCK MANAGEMENT ACTIONS
// ----------------------------------------------------
function quickAdjustStock(id, delta) {
  const item = AppState.inventory.find(i => i.id === id);
  if (!item) return;

  const newStock = item.stokAkhir + delta;
  if (newStock < 0) {
    showToast("Stok barang tidak boleh negatif!", "danger");
    return;
  }

  item.stokAkhir = newStock;
  if (delta > 0) item.stokMasuk += delta;
  else item.stokKeluar += Math.abs(delta);

  // Record mutation
  const activeOff = getActiveOfficer();
  AppState.transactions.push({
    id: `TRX-${Date.now()}`,
    tanggal: new Date().toISOString().slice(0, 10),
    jenis: delta > 0 ? "MASUK" : "KELUAR",
    noDok: "PENYESUAIAN-CEPAT",
    namaBarang: item.namaBarang,
    barangId: item.id,
    jumlah: Math.abs(delta),
    satuan: item.satuan,
    sumber: "Penyesuaian Langsung Gudang",
    tujuan: "Gudang Persediaan",
    petugas: activeOff.nama,
    penerima: activeOff.nama,
    keterangan: `Penyesuaian cepat kuantitas fisik oleh ${activeOff.jabatan}`
  });

  saveInventory();
  saveTransactions();
  renderInventoryTable();
  renderDashboard();
  renderTransactionsTable();
  showToast(`Stok ${item.namaBarang} diperbarui menjadi ${item.stokAkhir} ${item.satuan}`, "success");
}

// Modals Handler
function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add("active");
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove("active");
}

function populateCategorySelects() {
  const categories = [
    "Pengamanan & Senjata",
    "Obat & Medis (Klinik)",
    "Kebersihan & Sanitasi WBP",
    "Alat Tulis Kantor (ATK)",
    "Elektronik & Listrik",
    "Konsumsi & Perlengkapan Dapur",
    "Perlengkapan WBP & Seragam",
    "Pemeliharaan & Bangunan"
  ];

  const selects = [
    document.getElementById("inventoryCategorySelect"),
    document.getElementById("tambahKategori")
  ];

  selects.forEach(sel => {
    if (!sel) return;
    const isFilter = sel.id === "inventoryCategorySelect";
    let html = isFilter ? '<option value="ALL">Semua Kategori Persediaan</option>' : '';
    html += categories.map(c => `<option value="${c}">${c}</option>`).join("");
    sel.innerHTML = html;
  });
}

function populateBarangSelects() {
  const options = AppState.inventory.map(item => `
    <option value="${item.id}">[${item.kdBarang}] ${item.namaBarang} (Stok: ${item.stokAkhir} ${item.satuan})</option>
  `).join("");

  const masukSel = document.getElementById("trxMasukBarangId");
  const keluarSel = document.getElementById("trxKeluarBarangId");
  if (masukSel) masukSel.innerHTML = options;
  if (keluarSel) keluarSel.innerHTML = options;
}

// Submit Barang Masuk
function handleSimpanTrxMasuk(e) {
  e.preventDefault();
  const barangId = parseInt(document.getElementById("trxMasukBarangId").value);
  const jumlah = parseInt(document.getElementById("trxMasukJumlah").value);
  const noDok = document.getElementById("trxMasukNoDok").value.trim() || `SPK/BMN/${Date.now().toString().slice(-4)}`;
  const sumber = document.getElementById("trxMasukSumber").value.trim() || "DIPA Rutan Siak 2026";
  const ket = document.getElementById("trxMasukKet").value.trim() || "Penerimaan Barang Persediaan";

  if (!barangId || !jumlah || jumlah <= 0) {
    showToast("Harap isi pilihan barang dan jumlah yang valid!", "danger");
    return;
  }

  const item = AppState.inventory.find(i => i.id === barangId);
  if (!item) return;

  item.stokAkhir += jumlah;
  item.stokMasuk += jumlah;

  const activeOff = getActiveOfficer();
  AppState.transactions.push({
    id: `TRX-${Date.now()}`,
    tanggal: new Date().toISOString().slice(0, 10),
    jenis: "MASUK",
    noDok: noDok,
    namaBarang: item.namaBarang,
    barangId: item.id,
    jumlah: jumlah,
    satuan: item.satuan,
    sumber: sumber,
    tujuan: item.lokasi,
    petugas: activeOff.nama,
    penerima: activeOff.nama,
    keterangan: ket
  });

  saveInventory();
  saveTransactions();
  closeModal("modalTrxMasuk");
  renderApp();
  showToast(`Berhasil mencatat barang masuk: ${jumlah} ${item.satuan} ${item.namaBarang}`, "success");
}

// Submit Barang Keluar
function handleSimpanTrxKeluar(e) {
  e.preventDefault();
  const barangId = parseInt(document.getElementById("trxKeluarBarangId").value);
  const jumlah = parseInt(document.getElementById("trxKeluarJumlah").value);
  const noDok = document.getElementById("trxKeluarNoDok").value.trim() || `SPB/KELUAR/${Date.now().toString().slice(-4)}`;
  const tujuan = document.getElementById("trxKeluarTujuan").value.trim() || "Seksi Pengelolaan / Blok WBP";
  const ket = document.getElementById("trxKeluarKet").value.trim() || "Distribusi Pemakaian Rutin";

  if (!barangId || !jumlah || jumlah <= 0) {
    showToast("Harap isi pilihan barang dan jumlah yang valid!", "danger");
    return;
  }

  const item = AppState.inventory.find(i => i.id === barangId);
  if (!item) return;

  if (item.stokAkhir < jumlah) {
    showToast(`Stok tidak mencukupi! Stok saat ini: ${item.stokAkhir} ${item.satuan}`, "danger");
    return;
  }

  item.stokAkhir -= jumlah;
  item.stokKeluar += jumlah;

  const activeOff = getActiveOfficer();
  AppState.transactions.push({
    id: `TRX-${Date.now()}`,
    tanggal: new Date().toISOString().slice(0, 10),
    jenis: "KELUAR",
    noDok: noDok,
    namaBarang: item.namaBarang,
    barangId: item.id,
    jumlah: jumlah,
    satuan: item.satuan,
    sumber: item.lokasi,
    tujuan: tujuan,
    petugas: activeOff.nama,
    penerima: tujuan,
    keterangan: ket
  });

  saveInventory();
  saveTransactions();
  closeModal("modalTrxKeluar");
  renderApp();
  showToast(`Berhasil mendistribusikan: ${jumlah} ${item.satuan} ${item.namaBarang} ke ${tujuan}`, "success");
}

function openQuickKeluarModal(barangId) {
  openModal("modalTrxKeluar");
  const sel = document.getElementById("trxKeluarBarangId");
  if (sel) sel.value = barangId;
}

// Submit Tambah Barang Baru
function handleSimpanTambahBarang(e) {
  e.preventDefault();
  const nama = document.getElementById("tambahNamaBarang").value.trim();
  const kdSub = document.getElementById("tambahKdSub").value.trim() || "1010301001";
  const kdBrg = document.getElementById("tambahKdBarang").value.trim() || String(AppState.inventory.length + 1).padStart(6, '0');
  const satuan = document.getElementById("tambahSatuan").value.trim().toUpperCase() || "PCS";
  const kategori = document.getElementById("tambahKategori").value;
  const stokAwal = parseInt(document.getElementById("tambahStokAwal").value) || 0;
  const lokasi = document.getElementById("tambahLokasi").value.trim() || "Gudang Persediaan Rutan";
  const ket = document.getElementById("tambahKet").value.trim() || "-";

  if (!nama) {
    showToast("Nama barang persediaan wajib diisi!", "danger");
    return;
  }

  const newItem = {
    id: Date.now(),
    noDok: "137040900692310000KD202600001P",
    tglBuku: new Date().toLocaleDateString("id-ID"),
    kdSubKelompok: kdSub,
    kdBarang: kdBrg,
    namaBarang: nama.toUpperCase(),
    satuan: satuan,
    periode: "2026-06",
    stokAwal: stokAwal,
    stokMasuk: 0,
    stokKeluar: 0,
    stokAkhir: stokAwal,
    kategori: kategori,
    lokasi: lokasi,
    kondisi: "Baik",
    hargaEstimasi: 25000,
    keterangan: ket
  };

  AppState.inventory.unshift(newItem);
  saveInventory();
  populateBarangSelects();
  closeModal("modalTambahBarang");
  renderApp();
  showToast(`Barang baru berhasil didaftarkan: ${newItem.namaBarang}`, "success");
}

// Detail & Edit Modal
function openDetailModal(id) {
  const item = AppState.inventory.find(i => i.id === id);
  if (!item) return;

  document.getElementById("editId").value = item.id;
  document.getElementById("editNamaBarang").value = item.namaBarang;
  document.getElementById("editKdSub").value = item.kdSubKelompok;
  document.getElementById("editKdBarang").value = item.kdBarang;
  document.getElementById("editSatuan").value = item.satuan;
  document.getElementById("editKategori").value = item.kategori;
  document.getElementById("editStokAkhir").value = item.stokAkhir;
  document.getElementById("editLokasi").value = item.lokasi;
  document.getElementById("editKet").value = item.keterangan || '';

  openModal("modalDetailBarang");
}

function handleSimpanEditBarang(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById("editId").value);
  const item = AppState.inventory.find(i => i.id === id);
  if (!item) return;

  item.namaBarang = document.getElementById("editNamaBarang").value.trim().toUpperCase();
  item.kdSubKelompok = document.getElementById("editKdSub").value.trim();
  item.kdBarang = document.getElementById("editKdBarang").value.trim();
  item.satuan = document.getElementById("editSatuan").value.trim().toUpperCase();
  item.kategori = document.getElementById("editKategori").value;
  item.stokAkhir = parseInt(document.getElementById("editStokAkhir").value) || 0;
  item.lokasi = document.getElementById("editLokasi").value.trim();
  item.keterangan = document.getElementById("editKet").value.trim();

  saveInventory();
  closeModal("modalDetailBarang");
  renderApp();
  showToast(`Perubahan data ${item.namaBarang} berhasil disimpan!`, "success");
}

function handleDeleteBarang() {
  const id = parseInt(document.getElementById("editId").value);
  const item = AppState.inventory.find(i => i.id === id);
  if (!item) return;

  if (confirm(`Apakah Anda yakin ingin menghapus barang "${item.namaBarang}" dari database persediaan?`)) {
    AppState.inventory = AppState.inventory.filter(i => i.id !== id);
    saveInventory();
    populateBarangSelects();
    closeModal("modalDetailBarang");
    renderApp();
    showToast(`Barang ${item.namaBarang} telah dihapus!`, "success");
  }
}

// ----------------------------------------------------
// CETAK LAPORAN RESMI & DOKUMEN UAKPB DENGAN KOP SURAT
// ----------------------------------------------------

function generateOfficialKopSuratHTML() {
  return `
    <div class="official-kop-surat">
      <div class="kop-body">
        <div class="kop-logo-col">
          <img src="${SATKER_INFO.logoUrl || 'logo-kemenimipas.png'}" alt="Logo Kementerian Imigrasi dan Pemasyarakatan" class="kop-logo-img">
        </div>
        <div class="kop-text-col">
          <div class="kop-line-kemen">${SATKER_INFO.kementerian}</div>
          <div class="kop-line-ditjen">${SATKER_INFO.ditjen}</div>
          <div class="kop-line-kanwil">${SATKER_INFO.kanwil}</div>
          <div class="kop-line-satker">${SATKER_INFO.namaSatker}</div>
          <div class="kop-line-alamat">${SATKER_INFO.alamat}</div>
          <div class="kop-line-kontak">Laman : ${SATKER_INFO.laman}, Pos-el : ${SATKER_INFO.posEl}</div>
        </div>
        <div class="kop-spacer-col"></div>
      </div>
      <div class="kop-divider-double"></div>
    </div>
  `;
}

function handleReportFormatChange() {
  updateReportPreview();
}

function updateReportPreview() {
  const previewContainer = document.getElementById("officialReportPreviewArea");
  if (!previewContainer) return;

  const formatSelect = document.getElementById("reportFormatSelect");
  const catFilter = document.getElementById("reportCategoryFilter");
  const signModelSelect = document.getElementById("reportSignatureModel");

  const docType = formatSelect ? formatSelect.value : "opname";
  const selectedCat = catFilter ? catFilter.value : "ALL";
  const signModel = signModelSelect ? signModelSelect.value : "4pejabat";

  const kurniawan = AppState.officers.find(o => o.id === "kurniawan") || AppState.officers[1];
  const fajar = AppState.officers.find(o => o.id === "fajar") || AppState.officers[0];
  const rizky = AppState.officers.find(o => o.id === "rizky") || AppState.officers[2];
  const karutan = AppState.officers.find(o => o.id === "karutan") || AppState.officers[3];

  // Filter inventory if category selected
  let itemsToPrint = [...AppState.inventory];
  if (selectedCat !== "ALL") {
    itemsToPrint = itemsToPrint.filter(i => i.kategori === selectedCat);
  }

  const totalStockCount = itemsToPrint.reduce((acc, curr) => acc + (Number(curr.stokAkhir) || 0), 0);

  // Common Header Kop Surat
  const kopSuratHTML = generateOfficialKopSuratHTML();

  // Signature Block Generator
  const generateSignaturesHTML = () => {
    if (signModel === "karutan_bsre") {
      return `
        <div class="doc-signatures-container">
          <div class="doc-date-location">
            Dikeluarkan di Siak Sri Indrapura<br>
            Pada Tanggal ${SATKER_INFO.tanggalDokumen}
          </div>
          <div style="float:right;width:340px;text-align:center;">
            <div style="font-weight:700;margin-bottom:8px;">Kepala Rumah Tahanan Negara Kelas IIB Siak,</div>
            <div class="bsre-badge-wrapper">
              <img src="logo-kemenimipas.png" class="bsre-logo-icon" alt="Kemenimipas">
              <div class="bsre-text-box">
                <div class="bsre-brand">KEMENIMIPAS</div>
                <div class="bsre-caption">Ditandatangani secara elektronik oleh:</div>
                <div style="font-weight:700;font-size:11px;color:#0f172a;">${karutan.nama}</div>
              </div>
            </div>
            <div class="sign-name-underline" style="margin-top:6px;">${karutan.nama}</div>
            <div class="sign-nip">NIP. ${karutan.nip}</div>
          </div>
          <div style="clear:both;"></div>
        </div>
      `;
    }

    // Default: 4 Pejabat Lengkap
    return `
      <div class="doc-signatures-container">
        <div class="doc-date-location">
          Siak Sri Indrapura, ${SATKER_INFO.tanggalDokumen}
        </div>

        <div class="doc-sign-grid-3">
          <!-- Bendahara -->
          <div>
            <div>Mengetahui / Memeriksa,</div>
            <div class="sign-role-title">${kurniawan.jabatan}</div>
            <div class="sign-space"></div>
            <div class="sign-name-underline">${kurniawan.nama}</div>
            <div class="sign-nip">NIP. ${kurniawan.nip}</div>
          </div>

          <!-- Perencana Anggaran -->
          <div>
            <div>Menyetujui,</div>
            <div class="sign-role-title">${rizky.jabatan}</div>
            <div class="sign-space"></div>
            <div class="sign-name-underline">${rizky.nama}</div>
            <div class="sign-nip">NIP. ${rizky.nip}</div>
          </div>

          <!-- Pengurus Barang Persediaan -->
          <div>
            <div>Pengurus Barang Persediaan,</div>
            <div class="sign-role-title">${fajar.jabatan}</div>
            <div class="sign-space"></div>
            <div class="sign-name-underline">${fajar.nama}</div>
            <div class="sign-nip">NIP. ${fajar.nip}</div>
          </div>
        </div>

        <!-- Kepala Rutan -->
        <div class="doc-sign-box-center">
          <div>Mengesahkan:</div>
          <div style="font-weight:700;margin-bottom:6px;">${karutan.jabatan} (KPA)</div>
          <div class="bsre-badge-wrapper" style="margin:4px auto;">
            <img src="logo-kemenimipas.png" class="bsre-logo-icon" alt="Kemenimipas">
            <div class="bsre-text-box">
              <div class="bsre-brand">KEMENIMIPAS</div>
              <div class="bsre-caption">Ditandatangani secara elektronik oleh:</div>
              <div style="font-weight:700;font-size:10.5px;color:#0f172a;">${karutan.nama}</div>
            </div>
          </div>
          <div class="sign-name-underline" style="margin-top:6px;">${karutan.nama}</div>
          <div class="sign-nip">NIP. ${karutan.nip}</div>
        </div>
      </div>
    `;
  };

  const footerBsreHTML = `
    <div class="official-print-footer">
      Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik<br>
      yang diterbitkan oleh Balai Besar Sertifikasi Elektronik (BSrE), Badan Siber dan Sandi Negara (BSSN).
    </div>
  `;

  let docContentHTML = "";

  // 1. REGISTER OPNAME FISIK (MASTER REGISTER)
  if (docType === "opname") {
    docContentHTML = `
      <div class="doc-header-block">
        <h3 class="doc-main-title">REGISTER TRANSAKSI HARIAN BARANG PERSEDIAAN (OPNAME FISIK)</h3>
        <h4 class="doc-sub-title">PERIODE BUKU JUNI 2026 &bull; REGISTER BMN OPNAME FISIK KEDINASAN</h4>
      </div>

      <table class="doc-meta-table">
        <tr>
          <td style="width:16%;"><strong>KODE UAKPB</strong></td>
          <td style="width:2%;">:</td>
          <td style="width:42%;">${SATKER_INFO.kodeUakpb}</td>
          <td style="width:16%;"><strong>Tanggal Register</strong></td>
          <td style="width:2%;">:</td>
          <td style="width:22%;">${SATKER_INFO.tanggalDokumen}</td>
        </tr>
        <tr>
          <td><strong>UAKPB</strong></td>
          <td>:</td>
          <td>${SATKER_INFO.namaSatker}</td>
          <td><strong>Total Item</strong></td>
          <td>:</td>
          <td><strong>${itemsToPrint.length} Jenis Barang</strong></td>
        </tr>
        <tr>
          <td><strong>Kategori</strong></td>
          <td>:</td>
          <td>${selectedCat === 'ALL' ? 'Seluruh Kategori Barang Persediaan' : selectedCat}</td>
          <td><strong>Kuantitas Fisik</strong></td>
          <td>:</td>
          <td><strong>${totalStockCount.toLocaleString('id-ID')} Satuan Fisik</strong></td>
        </tr>
      </table>

      <table class="print-doc-table">
        <thead>
          <tr>
            <th style="width:30px;">No</th>
            <th style="width:140px;">No. Dokumen</th>
            <th style="width:75px;">Tgl. Buku</th>
            <th style="width:90px;">Kd Barang</th>
            <th>Uraian / Nama Barang Persediaan</th>
            <th style="width:120px;">Kategori</th>
            <th style="width:60px;">Satuan</th>
            <th style="width:70px;">Stok Fisik</th>
            <th style="width:100px;">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          ${itemsToPrint.slice(0, 150).map((item, idx) => `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td style="font-family:monospace;font-size:8.5pt;">${item.noDok}</td>
              <td style="text-align:center;">${item.tglBuku}</td>
              <td style="text-align:center;font-family:monospace;">${item.kdSubKelompok ? item.kdSubKelompok + '.' : ''}${item.kdBarang}</td>
              <td style="font-weight:600;">${item.namaBarang}</td>
              <td>${item.kategori}</td>
              <td style="text-align:center;">${item.satuan}</td>
              <td style="text-align:right;font-weight:700;">${Number(item.stokAkhir).toLocaleString('id-ID')}</td>
              <td style="font-size:8pt;color:#333;">${item.kondisi || 'Baik / Fisik'}</td>
            </tr>
          `).join("")}
          ${itemsToPrint.length > 150 ? `
            <tr>
              <td colspan="9" style="text-align:center;font-style:italic;background:#f9fafb;padding:8px;">
                ... Menampilkan 150 item teratas dalam lembar pratinjau. Total ${itemsToPrint.length} item akan dicetak lengkap ...
              </td>
            </tr>
          ` : ''}
          <tr style="background:#e5e7eb;font-weight:bold;">
            <td colspan="7" style="text-align:right;padding:6px;">TOTAL KUANTITAS FISIK BARANG :</td>
            <td style="text-align:right;padding:6px;">${totalStockCount.toLocaleString('id-ID')}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      ${generateSignaturesHTML()}
      ${footerBsreHTML}
    `;
  }

  // 2. BERITA ACARA REKONSILIASI & PEMERIKSAAN FISIK
  else if (docType === "berita_acara") {
    docContentHTML = `
      <div class="doc-header-block">
        <h3 class="doc-main-title">BERITA ACARA REKONSILIASI & PEMERIKSAAN FISIK BARANG PERSEDIAAN</h3>
        <h4 class="doc-sub-title">NOMOR : W.4.PAS.4.UM.04.02-BA/2026/06</h4>
      </div>

      <div style="font-size:10pt;line-height:1.6;margin-bottom:16px;text-align:justify;">
        <p style="margin-bottom:10px;">
          Pada hari ini, <strong>Selasa</strong> tanggal <strong>Dua Puluh Sembilan</strong> bulan <strong>September</strong> tahun <strong>Dua Ribu Dua Puluh Enam</strong>, bertempat di Gudang Penyimpanan Barang Persediaan Rumah Tahanan Negara Kelas IIB Siak Sri Indrapura, kami yang bertanda tangan di bawah ini telah melakukan inventarisasi, pemeriksaan fisik (stock opname), dan verifikasi saldo penatausahaan Barang Milik Negara (BMN) berupa barang persediaan kantor untuk Periode Buku Juni 2026.
        </p>
        <p style="margin-bottom:10px;">
          Berdasarkan hasil pemeriksaan fisik menyeluruh terhadap register dokumen Nomor <code>${SATKER_INFO.kodeUakpb}202600001P</code>, diperoleh rekapitulasi fisik per kategori sebagai berikut:
        </p>
      </div>

      <table class="print-doc-table">
        <thead>
          <tr>
            <th style="width:40px;">No</th>
            <th>Kelompok Kategori Persediaan</th>
            <th style="width:110px;">Jumlah Jenis Item</th>
            <th style="width:120px;">Total Kuantitas Fisik</th>
            <th style="width:120px;">Kondisi Barang</th>
            <th style="width:150px;">Unit Pengguna Utama</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align:center;">1</td>
            <td style="font-weight:600;">Pengamanan & Senjata</td>
            <td style="text-align:center;">12 Jenis</td>
            <td style="text-align:right;font-weight:bold;">120 Unit/Set</td>
            <td style="text-align:center;color:#059669;font-weight:600;">Lengkap / Baik</td>
            <td>KPR & Regu Pengamanan</td>
          </tr>
          <tr>
            <td style="text-align:center;">2</td>
            <td style="font-weight:600;">Obat & Medis (Klinik Pratama)</td>
            <td style="text-align:center;">24 Jenis</td>
            <td style="text-align:right;font-weight:bold;">450 Box/Botol</td>
            <td style="text-align:center;color:#059669;font-weight:600;">Lengkap / Baik</td>
            <td>Klinik Rutan Siak & WBP</td>
          </tr>
          <tr>
            <td style="text-align:center;">3</td>
            <td style="font-weight:600;">Kebersihan & Sanitasi WBP</td>
            <td style="text-align:center;">18 Jenis</td>
            <td style="text-align:right;font-weight:bold;">320 Pcs/Pack</td>
            <td style="text-align:center;color:#059669;font-weight:600;">Lengkap / Baik</td>
            <td>Blok Hunian & Fasilitas Umum</td>
          </tr>
          <tr>
            <td style="text-align:center;">4</td>
            <td style="font-weight:600;">Alat Tulis Kantor (ATK)</td>
            <td style="text-align:center;">35 Jenis</td>
            <td style="text-align:right;font-weight:bold;">890 Rim/Pak</td>
            <td style="text-align:center;color:#059669;font-weight:600;">Lengkap / Baik</td>
            <td>Subseksi Pengelolaan & Pelayanan</td>
          </tr>
          <tr>
            <td style="text-align:center;">5</td>
            <td style="font-weight:600;">Konsumsi & Perlengkapan Dapur</td>
            <td style="text-align:center;">15 Jenis</td>
            <td style="text-align:right;font-weight:bold;">210 Unit/Set</td>
            <td style="text-align:center;color:#059669;font-weight:600;">Lengkap / Baik</td>
            <td>Dapur Sehat Rutan Siak</td>
          </tr>
          <tr>
            <td style="text-align:center;">6</td>
            <td style="font-weight:600;">Pemeliharaan & Bangunan</td>
            <td style="text-align:center;">20 Jenis</td>
            <td style="text-align:right;font-weight:bold;">185 Zak/Kaleng</td>
            <td style="text-align:center;color:#059669;font-weight:600;">Lengkap / Baik</td>
            <td>Sarpras & Perawatan Gedung</td>
          </tr>
          <tr style="background:#e5e7eb;font-weight:bold;">
            <td colspan="2" style="text-align:right;padding:6px;">TOTAL REKAPITULASI RESMI :</td>
            <td style="text-align:center;">${AppState.inventory.length} Jenis Item</td>
            <td style="text-align:right;">${totalStockCount.toLocaleString('id-ID')} Satuan Fisik</td>
            <td colspan="2" style="text-align:center;color:#059669;">100% Sesuai Register Fisik</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size:10pt;line-height:1.6;margin-bottom:16px;text-align:justify;">
        <p>
          Demikian Berita Acara Rekonsiliasi dan Pemeriksaan Fisik Barang Persediaan ini dibuat dalam rangkap 4 (empat) untuk dipergunakan sebagai bahan pertanggungjawaban penatausahaan BMN Satuan Kerja Rutan Kelas IIB Siak Sri Indrapura ke Kantor Wilayah Ditjenpas Riau dan Direktorat Jenderal Pemasyarakatan.
        </p>
      </div>

      ${generateSignaturesHTML()}
      ${footerBsreHTML}
    `;
  }

  // 3. LAPORAN MUTASI BARANG MASUK & KELUAR
  else if (docType === "mutasi") {
    const trxs = [...AppState.transactions].reverse();
    docContentHTML = `
      <div class="doc-header-block">
        <h3 class="doc-main-title">LAPORAN BUKU MUTASI PENERIMAAN & DISTRIBUSI PENGELUARAN</h3>
        <h4 class="doc-sub-title">PERIODE ANGGARAN TAHUN 2026 &bull; SATUAN KERJA RUTAN KELAS IIB SIAK</h4>
      </div>

      <table class="doc-meta-table">
        <tr>
          <td style="width:16%;"><strong>KODE UAKPB</strong></td>
          <td style="width:2%;">:</td>
          <td style="width:42%;">${SATKER_INFO.kodeUakpb}</td>
          <td style="width:16%;"><strong>Periode</strong></td>
          <td style="width:2%;">:</td>
          <td style="width:22%;">Januari s/d September 2026</td>
        </tr>
        <tr>
          <td><strong>UAKPB</strong></td>
          <td>:</td>
          <td>${SATKER_INFO.namaSatker}</td>
          <td><strong>Jumlah Transaksi</strong></td>
          <td>:</td>
          <td>${trxs.length} Transaksi Tercatat</td>
        </tr>
      </table>

      <table class="print-doc-table">
        <thead>
          <tr>
            <th style="width:30px;">No</th>
            <th style="width:80px;">Tanggal</th>
            <th style="width:120px;">No. Dokumen / SPK</th>
            <th>Nama Barang Persediaan</th>
            <th style="width:90px;">Jenis Mutasi</th>
            <th style="width:80px;">Jumlah</th>
            <th>Sumber Penerimaan / Tujuan Distribusi</th>
            <th style="width:110px;">Petugas Pengelola</th>
          </tr>
        </thead>
        <tbody>
          ${trxs.map((trx, idx) => `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td style="text-align:center;">${trx.tanggal}</td>
              <td style="font-family:monospace;font-size:8.5pt;">${trx.noDok}</td>
              <td style="font-weight:600;">${trx.namaBarang}</td>
              <td style="text-align:center;font-weight:bold;color:${trx.jenis === 'MASUK' ? '#059669' : '#e11d48'};">
                ${trx.jenis === 'MASUK' ? '+ PENERIMAAN' : '- DISTRIBUSI'}
              </td>
              <td style="text-align:right;font-weight:bold;">${trx.jumlah} ${trx.satuan}</td>
              <td>${trx.tujuan || trx.sumber}</td>
              <td style="font-size:8.5pt;">${trx.petugas.split(',')[0]}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      ${generateSignaturesHTML()}
      ${footerBsreHTML}
    `;
  }

  // 4. REKAPITULASI PER KATEGORI
  else if (docType === "kategori") {
    const categories = [
      "Pengamanan & Senjata",
      "Obat & Medis (Klinik)",
      "Kebersihan & Sanitasi WBP",
      "Alat Tulis Kantor (ATK)",
      "Elektronik & Listrik",
      "Konsumsi & Perlengkapan Dapur",
      "Perlengkapan WBP & Seragam",
      "Pemeliharaan & Bangunan"
    ];

    docContentHTML = `
      <div class="doc-header-block">
        <h3 class="doc-main-title">LAPORAN REKAPITULASI FISIK BARANG PERSEDIAAN BERDASARKAN KATEGORI</h3>
        <h4 class="doc-sub-title">PERIODE BUKU JUNI 2026 &bull; REGISTER OPNAME FISIK UAKPB BMN</h4>
      </div>

      <table class="doc-meta-table">
        <tr>
          <td style="width:16%;"><strong>KODE UAKPB</strong></td>
          <td style="width:2%;">:</td>
          <td style="width:42%;">${SATKER_INFO.kodeUakpb}</td>
          <td style="width:16%;"><strong>Tanggal</strong></td>
          <td style="width:2%;">:</td>
          <td style="width:22%;">${SATKER_INFO.tanggalDokumen}</td>
        </tr>
        <tr>
          <td><strong>Satuan Kerja</strong></td>
          <td>:</td>
          <td>${SATKER_INFO.namaSatker}</td>
          <td><strong>Status Gudang</strong></td>
          <td>:</td>
          <td>Aktif Terkendali</td>
        </tr>
      </table>

      <table class="print-doc-table">
        <thead>
          <tr>
            <th style="width:40px;">No</th>
            <th>Kategori Barang Persediaan</th>
            <th style="width:120px;">Jumlah Varian Item</th>
            <th style="width:130px;">Total Kuantitas Fisik</th>
            <th style="width:120px;">Status Ketersediaan</th>
            <th>Lokasi Penyimpanan Gudang</th>
          </tr>
        </thead>
        <tbody>
          ${categories.map((cat, idx) => {
            const catItems = AppState.inventory.filter(i => i.kategori === cat);
            const catQty = catItems.reduce((acc, curr) => acc + (Number(curr.stokAkhir) || 0), 0);
            return `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td style="font-weight:700;">${cat}</td>
                <td style="text-align:center;">${catItems.length} Item</td>
                <td style="text-align:right;font-weight:bold;">${catQty.toLocaleString('id-ID')}</td>
                <td style="text-align:center;font-weight:600;color:${catQty > 0 ? '#059669' : '#e11d48'};">
                  ${catQty > 0 ? 'Tersedia' : 'Perlu Pengadaan'}
                </td>
                <td style="font-size:8.5pt;">Gudang Utama Rutan Siak</td>
              </tr>
            `;
          }).join("")}
          <tr style="background:#e5e7eb;font-weight:bold;">
            <td colspan="2" style="text-align:right;padding:6px;">TOTAL KESELURUHAN MASTER PERSEDIAAN :</td>
            <td style="text-align:center;">${AppState.inventory.length} Item</td>
            <td style="text-align:right;">${totalStockCount.toLocaleString('id-ID')} Satuan Fisik</td>
            <td colspan="2" style="text-align:center;">60 Halaman Register BMN Resmi</td>
          </tr>
        </tbody>
      </table>

      ${generateSignaturesHTML()}
      ${footerBsreHTML}
    `;
  }

  // 5. SURAT LAPORAN RESMI (FORMAT PERSIS CONTOH PDF USER)
  else if (docType === "surat_dinas") {
    docContentHTML = `
      <table class="doc-meta-table" style="margin-top:10px;">
        <tr>
          <td style="width:12%;">Nomor</td>
          <td style="width:2%;">:</td>
          <td style="width:46%;">WP.4.PAS.4.UM.04.02-1</td>
          <td style="width:40%;text-align:right;">29 September 2026</td>
        </tr>
        <tr>
          <td>Sifat</td>
          <td>:</td>
          <td>Biasa</td>
          <td></td>
        </tr>
        <tr>
          <td>Lampiran</td>
          <td>:</td>
          <td>1 (satu) berkas</td>
          <td></td>
        </tr>
        <tr>
          <td>Hal</td>
          <td>:</td>
          <td colspan="2" style="font-weight:700;line-height:1.4;">
            Laporan Pelaksanaan Pengamanan, Penatausahaan Aset dan Register Fisik Persediaan BMN pada Rumah Tahanan Negara Kelas IIB Siak Sri Indrapura
          </td>
        </tr>
      </table>

      <div style="font-size:10pt;line-height:1.6;margin-top:20px;margin-bottom:20px;">
        <p style="margin-bottom:12px;">
          Yth. Kepala Kantor Wilayah Direktorat Jenderal Pemasyarakatan Riau<br>
          di tempat
        </p>

        <p style="text-align:justify;margin-bottom:12px;text-indent:36px;">
          Menindaklanjuti arahan Direktur Jenderal Pemasyarakatan terkait Pengamanan Aset dan Tertib Administrasi Penatausahaan Barang Milik Negara (BMN) serta Persediaan Kantor pasca penyesuaian nomenklatur kelembagaan Kementerian Imigrasi dan Pemasyarakatan Republik Indonesia, bersama ini kami sampaikan Laporan Pelaksanaan Register Opname Fisik dan Penatausahaan Barang Persediaan pada Rumah Tahanan Negara Kelas IIB Siak Sri Indrapura Periode Tahun 2026.
        </p>

        <p style="text-align:justify;margin-bottom:12px;text-indent:36px;">
          Seluruh data fisik sejumlah <strong>1.194 item persediaan</strong> pada 60 halaman buku register (UAKPB: <code>${SATKER_INFO.kodeUakpb}</code>) telah tervalidasi dan berada dalam penguasaan aman pejabat pengelola keuangan dan BMN Rutan Kelas IIB Siak Sri Indrapura.
        </p>

        <p style="margin-top:20px;text-indent:36px;">
          Demikian surat laporan ini kami sampaikan, atas perhatian dan petunjuk lebih lanjut diucapkan terima kasih.
        </p>
      </div>

      <div class="doc-signatures-container" style="margin-top:24px;">
        <div style="float:right;width:340px;text-align:center;">
          <div style="font-weight:700;margin-bottom:8px;">Kepala,</div>
          <div class="bsre-badge-wrapper">
            <img src="logo-kemenimipas.png" class="bsre-logo-icon" alt="Kemenimipas">
            <div class="bsre-text-box">
              <div class="bsre-brand">KEMENIMIPAS</div>
              <div class="bsre-caption">Ditandatangani secara elektronik oleh:</div>
              <div style="font-weight:700;font-size:11px;color:#0f172a;">${karutan.nama}</div>
            </div>
          </div>
          <div class="sign-name-underline" style="margin-top:6px;">${karutan.nama}</div>
          <div class="sign-nip">NIP. ${karutan.nip}</div>
        </div>
        <div style="clear:both;"></div>
      </div>

      <div style="margin-top:30px;font-size:9pt;line-height:1.5;">
        <strong>Tembusan :</strong><br>
        1. Sekretaris Jenderal Kementerian Imigrasi dan Pemasyarakatan;<br>
        2. Inspektur Jenderal Kementerian Imigrasi dan Pemasyarakatan;<br>
        3. Direktur Jenderal Pemasyarakatan;
      </div>

      ${footerBsreHTML}
    `;
  }

  // Render Document Envelope with KOP SURAT
  previewContainer.innerHTML = `
    <div class="official-print-document">
      ${kopSuratHTML}
      ${docContentHTML}
    </div>
  `;
}

function printOfficialReport() {
  window.print();
}

// Export Data to CSV
function exportInventoryToCSV() {
  const headers = ["ID", "No. Dok", "Tgl Buku", "Kd Sub-sub Kelompok", "Kd Barang", "Nama Barang", "Kategori", "Satuan", "Periode", "Stok Akhir", "Lokasi", "Keterangan"];
  const rows = AppState.inventory.map(i => [
    i.id,
    `"${i.noDok}"`,
    `"${i.tglBuku}"`,
    `"${i.kdSubKelompok}"`,
    `"${i.kdBarang}"`,
    `"${i.namaBarang}"`,
    `"${i.kategori}"`,
    `"${i.satuan}"`,
    `"${i.periode}"`,
    i.stokAkhir,
    `"${i.lokasi}"`,
    `"${i.keterangan || ''}"`
  ]);

  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
    + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Register_Persediaan_Rutan_Siak_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast("File data persediaan (CSV) berhasil diekspor!", "success");
}

// Reset Database to Original PDF Master Data
function confirmResetData() {
  if (confirm("Apakah Anda yakin ingin me-reset database ke data master bawaan PDF Juni 2026? Semua transaksi tambahan yang belum dibackup akan dihapus.")) {
    AppState.inventory = [...MASTER_INVENTORY_DATA];
    AppState.transactions = [...DEFAULT_TRANSACTIONS];
    AppState.officers = [...PENGELOLA_KEUANGAN];
    saveInventory();
    saveTransactions();
    saveOfficers();
    renderApp();
    showToast("Database berhasil di-reset ke kondisi master PDF Juni 2026!", "success");
  }
}

// Toast Alert
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
