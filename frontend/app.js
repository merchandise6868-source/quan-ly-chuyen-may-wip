// HELPER: Lấy ngày hiện tại theo giờ địa phương (YYYY-MM-DD)
function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// HELPER: Chuẩn hóa số điện thoại (+84901234567 -> 0901234567, loại bỏ khoảng trắng, gạch nối, dấu chấm)
function normalizePhone(p) {
  if (!p) return "";
  let clean = String(p).replace(/\s+/g, "").replace(/[\-\.\(\)]/g, "");
  if (clean.startsWith("+84")) {
    clean = "0" + clean.substring(3);
  } else if (clean.startsWith("84") && clean.length >= 11) {
    clean = "0" + clean.substring(2);
  }
  return clean;
}

// STATE MANAGEMENT
let appState = {
  currentUserRole: null, // Set dynamically upon login
  currentUser: null,     // Set dynamically upon login
  customers: [],
  orders: [],
  usersList: [],
  currentCustomer: null,
  currentPO: null,
  currentDate: getLocalDateString(),
  report: {
    po_id: "po-050",
    report_date: getLocalDateString(),
    status: "DRAFT",
    batches: []
  },
  cumExportsByBatch: {},
  cumImportsByBatch: {},
  editingBatches: {},
  hasUnsavedChanges: false,
  flowLogs: [],
  historyLogs: [],
  activeInputEl: null
};

// FIREBASE AUTH CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyByCERYhXXatEhGwaSoOzoDc-1ddmckbaE",
  authDomain: "confirm-through-otp.firebaseapp.com",
  projectId: "confirm-through-otp",
  storageBucket: "confirm-through-otp.firebasestorage.app",
  messagingSenderId: "537153757150",
  appId: "1:537153757150:web:16eec20b7d35314b25c74f",
  measurementId: "G-WZV5Q2X8FY"
};

let firebaseAuth = null;
let portalRecaptchaVerifier = null;
let portalConfirmationResult = null;
let modalRecaptchaVerifier = null;
let modalConfirmationResult = null;
let otpTimerInterval = null;

function initFirebaseAuth() {
  if (typeof firebase !== 'undefined' && firebase.apps) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      firebaseAuth = firebase.auth();
      firebaseAuth.languageCode = 'vi';
      console.log("✅ Google Firebase Phone Auth initialized successfully for project confirm-through-otp");
    } catch (err) {
      console.error("Firebase Auth Init Error:", err);
    }
  }
}

// PWA (PROGRESSIVE WEB APP) MANAGEMENT
let deferredInstallPrompt = null;

function initPWA() {
  // 1. Register Service Worker with active update check
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js?v=20261023_1800', { scope: '/' })
        .then(reg => {
          console.log('✅ Service Worker registered successfully:', reg.scope);
          // Explicit update check on every page load
          reg.update();
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('⚡ Đã tải phiên bản ứng dụng mới, tự động làm mới trang...');
                  window.location.reload();
                }
              };
            }
          };
        })
        .catch(err => console.warn('SW registration warning:', err));
    });
  }

  // 2. Capture Install Prompt for Android / Desktop Chrome / Edge
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const btnTop = document.getElementById("btnInstallPWA");
    const btnPortal = document.getElementById("btnPortalInstallApp");
    if (btnTop) btnTop.style.display = "inline-flex";
    if (btnPortal) btnPortal.style.display = "inline-flex";
    console.log("📲 PWA install ready.");
  });

  // 3. Handle Install Click (Desktop / Android / iOS)
  function handleInstallClick() {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      deferredInstallPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User installed PWA');
          showToast('🎉 Đang tải và cài đặt ứng dụng WIP May D&D!');
        }
        deferredInstallPrompt = null;
      });
    } else if (isIos && !isStandalone) {
      const modal = document.getElementById("modalIosInstall");
      if (modal) modal.classList.add("show");
    } else {
      showToast("💡 Hãy bấm biểu tượng cài đặt trên thanh địa chỉ hoặc menu trình duyệt để thêm vào màn hình chính!");
    }
  }

  const btnTop = document.getElementById("btnInstallPWA");
  if (btnTop) btnTop.addEventListener("click", handleInstallClick);

  const btnPortal = document.getElementById("btnPortalInstallApp");
  if (btnPortal) btnPortal.addEventListener("click", handleInstallClick);

  // iOS Modal close handlers
  const btnCloseIos = document.getElementById("btnCloseIosModal");
  if (btnCloseIos) {
    btnCloseIos.addEventListener("click", () => {
      document.getElementById("modalIosInstall")?.classList.remove("show");
    });
  }
  const btnGotItIos = document.getElementById("btnGotItIosModal");
  if (btnGotItIos) {
    btnGotItIos.addEventListener("click", () => {
      document.getElementById("modalIosInstall")?.classList.remove("show");
    });
  }

  // 4. App Installed Event
  window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA application was successfully installed.');
    const btnTop = document.getElementById("btnInstallPWA");
    const btnPortal = document.getElementById("btnPortalInstallApp");
    if (btnTop) btnTop.style.display = "none";
    if (btnPortal) btnPortal.style.display = "none";
    showToast('🎉 Đã cài đặt ứng dụng vào màn hình chính thành công!');
  });

  // 5. Detect Standalone / iOS
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) {
    const btnTop = document.getElementById("btnInstallPWA");
    const btnPortal = document.getElementById("btnPortalInstallApp");
    if (btnTop) btnTop.style.display = "none";
    if (btnPortal) btnPortal.style.display = "none";
  } else {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos) {
      const btnTop = document.getElementById("btnInstallPWA");
      const btnPortal = document.getElementById("btnPortalInstallApp");
      if (btnTop) btnTop.style.display = "inline-flex";
      if (btnPortal) btnPortal.style.display = "inline-flex";
    }
  }
}

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  initDate();
  initFirebaseAuth();
  initPWA();
  bindEvents();
  bindPortalEvents();
  bindSizeEditorEvents();
  bindReleaseEvents();
  bindRoleSwitchEvents();
  bindRolePasswordEvents();
  checkLoginPortalState();
  fetchMetadata();
});

function checkLoginPortalState() {
  const portal = document.getElementById("loginPortalScreen");
  const mainApp = document.getElementById("appMainWrapper");

  // Read persisted user info from localStorage or long-lived cookie
  let savedUser = null;
  try {
    const rawUser = localStorage.getItem("dd_user_info") || sessionStorage.getItem("dd_user_info");
    if (rawUser) {
      savedUser = JSON.parse(rawUser);
    }
  } catch (e) {
    console.warn("Error reading localStorage:", e);
  }

  // Fallback: Check cookie if storage is cleared by iOS Safari / WebView
  if (!savedUser) {
    const match = document.cookie.match(/(^|;)\s*dd_wip_session\s*=\s*([^;]+)/);
    if (match && match[2]) {
      try {
        savedUser = JSON.parse(decodeURIComponent(match[2]));
      } catch (e) {
        console.warn("Error parsing cookie session:", e);
      }
    }
  }

  if (savedUser && (savedUser.role || savedUser.email || savedUser.phone)) {
    appState.currentUser = savedUser;
    appState.currentUserRole = savedUser.role || localStorage.getItem("dd_wip_role") || "worker";
    if (portal) portal.style.setProperty("display", "none", "important");
    if (mainApp) mainApp.style.setProperty("display", "block", "important");
    applyUserRole(appState.currentUserRole, appState.currentUser);
  } else {
    appState.currentUser = null;
    appState.currentUserRole = "worker";
    if (portal) portal.style.setProperty("display", "flex", "important");
    if (mainApp) mainApp.style.setProperty("display", "none", "important");
  }
}

function initDate() {
  const dateEl = document.getElementById("reportDate");
  const todayStr = getLocalDateString();
  const targetDate = todayStr; // Luôn hiển thị ngày thực tế hôm nay khi mở giao diện
  try {
    localStorage.removeItem("dd_last_report_date");
  } catch (e) {}

  appState.currentDate = targetDate;
  if (appState.report) {
    appState.report.report_date = targetDate;
  }
  if (dateEl) {
    dateEl.value = targetDate;
  }
  const mobInput = document.getElementById("reportDateMobile");
  if (mobInput) {
    mobInput.value = targetDate;
  }
  const mobDisp = document.getElementById("mobileDateDisplay");
  if (mobDisp && targetDate) {
    const parts = targetDate.split("-");
    if (parts.length === 3) {
      mobDisp.innerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
}

// SHOW TOAST NOTIFICATION
function showToast(msg = "✅ Đã lưu dữ liệu thành công!") {
  const toast = document.getElementById("toastNotification");
  if (!toast) return;
  toast.innerText = msg;
  toast.classList.add("show");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// SAFE SCROLL INTO VIEW (ACCOUNTING FOR FIXED / STICKY APP HEADERS)
function safeScrollIntoView(element) {
  if (!element) return;
  const headerOffset = 140;
  const elementRect = element.getBoundingClientRect();
  const absoluteElementTop = elementRect.top + window.pageYOffset;
  const targetY = Math.max(0, absoluteElementTop - headerOffset);
  window.scrollTo({
    top: targetY,
    behavior: "smooth"
  });
}

// HIGHLIGHT INPUT ERROR VISUALLY
function highlightField(element) {
  if (!element) return;
  element.classList.add("input-error-highlight");
  try {
    element.focus();
  } catch (e) {}
  setTimeout(() => {
    element.classList.remove("input-error-highlight");
  }, 3500);
}

// FORCE HARD REFRESH & CLEAR PWA / CACHE
async function forceRefreshApp() {
  if (confirm("⚡ Hệ thống sẽ làm sạch bộ nhớ đệm (Cache) trên thiết bị và tải bản mới nhất từ máy chủ ngay lập tức.\n\nBạn có muốn tiếp tục?")) {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch (e) {
      console.warn("Cache purge notice:", e);
    }
    const cleanUrl = window.location.origin + window.location.pathname + '?t=' + Date.now();
    window.location.replace(cleanUrl);
  }
}

// BIND DOM EVENTS
function bindEvents() {
  // Force Refresh App Buttons (Desktop & Avatar Popover)
  const btnForceRef = document.getElementById("btnForceRefreshApp");
  if (btnForceRef) btnForceRef.addEventListener("click", forceRefreshApp);
  const btnPopRef = document.getElementById("btnPopoverRefreshApp");
  if (btnPopRef) btnPopRef.addEventListener("click", forceRefreshApp);

  // Role & Auth Modal Events
  const btnSwitchRole = document.getElementById("btnSwitchRole");
  if (btnSwitchRole) btnSwitchRole.addEventListener("click", openRoleSwitch);

  const btnCloseRoleModal = document.getElementById("btnCloseRoleModal");
  if (btnCloseRoleModal) btnCloseRoleModal.addEventListener("click", closeRoleModal);

  const btnCancelRoleModal = document.getElementById("btnCancelRoleModal");
  if (btnCancelRoleModal) btnCancelRoleModal.addEventListener("click", closeRoleModal);

  // Auth Tabs (Email vs Phone OTP vs PIN)
  const authTabEmail = document.getElementById("authTabBtnEmail");
  const authTabPhone = document.getElementById("authTabBtnPhone");
  const authTabPin = document.getElementById("authTabBtnPin");
  const authPaneEmail = document.getElementById("authPaneEmail");
  const authPanePhone = document.getElementById("authPanePhone");
  const authPanePin = document.getElementById("authPanePin");

  function switchAuthTab(activeTab, activePane) {
    [authTabEmail, authTabPhone, authTabPin].forEach(t => t && t.classList.remove("active"));
    [authPaneEmail, authPanePhone, authPanePin].forEach(p => p && p.classList.remove("active"));
    if (activeTab) activeTab.classList.add("active");
    if (activePane) activePane.classList.add("active");
  }

  if (authTabEmail) {
    authTabEmail.addEventListener("click", () => switchAuthTab(authTabEmail, authPaneEmail));
  }
  if (authTabPhone) {
    authTabPhone.addEventListener("click", () => switchAuthTab(authTabPhone, authPanePhone));
  }
  if (authTabPin) {
    authTabPin.addEventListener("click", () => switchAuthTab(authTabPin, authPanePin));
  }

  // Quick autofill buttons for Admin credentials
  const btnQuickAdmin = document.getElementById("btnQuickFillAdmin");
  if (btnQuickAdmin) {
    btnQuickAdmin.addEventListener("click", () => {
      document.getElementById("txtAuthEmail").value = "admin@ddlongan.com";
      document.getElementById("txtAuthPassword").value = "Admin@123456";
      showToast("⚡ Đã điền thông tin Admin: admin@ddlongan.com");
    });
  }

  const btnQuickGmail = document.getElementById("btnQuickFillGmail");
  if (btnQuickGmail) {
    btnQuickGmail.addEventListener("click", () => {
      document.getElementById("txtAuthEmail").value = "merchandise6868@gmail.com";
      document.getElementById("txtAuthPassword").value = "Admin@123456";
      showToast("⚡ Đã điền thông tin Admin: merchandise6868@gmail.com");
    });
  }

  // Send Phone OTP Button
  const btnSendOTP = document.getElementById("btnSendPhoneOTP");
  if (btnSendOTP) btnSendOTP.addEventListener("click", handleSendPhoneOTP);

  const btnResend = document.getElementById("btnResendOTP");
  if (btnResend) btnResend.addEventListener("click", handleSendPhoneOTP);

  // Confirm Auth Button
  const btnConfirmAuth = document.getElementById("btnConfirmAuth");
  if (btnConfirmAuth) btnConfirmAuth.addEventListener("click", handleConfirmAuth);

  // User Management Form (Tab 4)
  const formUser = document.getElementById("formAddUser");
  if (formUser) formUser.addEventListener("submit", handleAddUser);

  const btnSubmitUser = document.getElementById("btnSubmitUser");
  if (btnSubmitUser) {
    btnSubmitUser.addEventListener("click", (e) => {
      if (formUser) {
        if (!formUser.checkValidity()) {
          formUser.reportValidity();
          return;
        }
        e.preventDefault();
        handleAddUser(e);
      }
    });
  }

  const btnCancelUser = document.getElementById("btnCancelEditUser");
  if (btnCancelUser) btnCancelUser.addEventListener("click", resetUserForm);

  const btnAddNewTop = document.getElementById("btnAddNewUserTop");
  if (btnAddNewTop) {
    btnAddNewTop.addEventListener("click", () => {
      resetUserForm();
      const form = document.getElementById("formAddUser");
      if (form) form.scrollIntoView({ behavior: "smooth", block: "center" });
      document.getElementById("userPhone")?.focus();
    });
  }

  const inputUserPhone = document.getElementById("userPhone");
  if (inputUserPhone) inputUserPhone.addEventListener("input", handleUserFormPhoneInput);
  const inputUserEmail = document.getElementById("userEmail");
  if (inputUserEmail) inputUserEmail.addEventListener("input", handleUserFormPhoneInput);

  // Header Selects & Filters
  const selCust = document.getElementById("selectCustomer");
  if (selCust) {
    selCust.addEventListener("change", async (e) => {
      appState.currentCustomer = e.target.value;
      try { localStorage.setItem("dd_last_customer_id", appState.currentCustomer || ""); } catch (err) {}
      await filterOrdersByCustomer();
    });
  }

  const selPO = document.getElementById("selectPO");
  if (selPO) {
    selPO.addEventListener("change", async (e) => {
      const poId = e.target.value;
      appState.currentPO = appState.orders.find(o => o.id === poId);
      try { localStorage.setItem("dd_last_po_id", poId || ""); } catch (err) {}
      await refreshAllTabsData();
    });
  }

  // Date Change & Navigation
  const repDate = document.getElementById("reportDate");
  if (repDate) {
    repDate.addEventListener("change", async (e) => {
      if (appState.hasUnsavedChanges && appState.currentPO && appState.report && appState.report.batches && appState.report.batches.length > 0) {
        try {
          await saveReport(appState.report.status || "DRAFT", true);
        } catch (err) {
          console.warn("Auto-save prior date error:", err);
        }
      }
      appState.currentDate = e.target.value;
      const mobInput = document.getElementById("reportDateMobile");
      if (mobInput) mobInput.value = e.target.value;
      const mobDisp = document.getElementById("mobileDateDisplay");
      if (mobDisp && e.target.value) {
        const p = e.target.value.split("-");
        if (p.length === 3) mobDisp.innerText = `${p[2]}/${p[1]}/${p[0]}`;
      }
      await refreshAllTabsData();
    });
  }

  const btnPrev = document.getElementById("btnPrevDay");
  if (btnPrev) btnPrev.addEventListener("click", () => changeDateByDays(-1));

  const btnNext = document.getElementById("btnNextDay");
  if (btnNext) btnNext.addEventListener("click", () => changeDateByDays(1));

  // Tab switching
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add("active");
      if (btn.dataset.tab === "tab-manage") {
        renderManageTab();
      } else if (btn.dataset.tab === "tab-users") {
        fetchUsers();
        loadRolePasswords();
      } else if (btn.dataset.tab === "tab-flow-log") {
        renderDeptLogsUI();
      } else if (btn.dataset.tab === "tab-wip") {
        renderReportUI();
      }
    });
  });

  const btnAddB = document.getElementById("btnAddBatch");
  if (btnAddB) btnAddB.addEventListener("click", handleAddBatch);

  const btnOpenSweep = document.getElementById("btnOpenSweepTailModal");
  if (btnOpenSweep) btnOpenSweep.addEventListener("click", openSweepTailModal);

  const btnToolbarSweep = document.getElementById("btnToolbarSweepTail");
  if (btnToolbarSweep) btnToolbarSweep.addEventListener("click", openSweepTailModal);

  const btnCloseSweep = document.getElementById("btnCloseSweepTailModal");
  if (btnCloseSweep) btnCloseSweep.addEventListener("click", closeSweepTailModal);

  const btnCancelSweep = document.getElementById("btnCancelSweepTailModal");
  if (btnCancelSweep) btnCancelSweep.addEventListener("click", closeSweepTailModal);

  const btnConfirmSweep = document.getElementById("btnConfirmSweepTailBatch");
  if (btnConfirmSweep) btnConfirmSweep.addEventListener("click", handleConfirmSweepTailBatch);

  const btnRef = document.getElementById("btnRefresh");
  if (btnRef) btnRef.addEventListener("click", handleGlobalSyncData);

  const btnSaveD = document.getElementById("btnSaveDraft");
  if (btnSaveD) btnSaveD.addEventListener("click", () => saveReport("DRAFT"));

  const btnSubRep = document.getElementById("btnSubmitReport");
  if (btnSubRep) btnSubRep.addEventListener("click", () => saveReport("SUBMITTED"));

  const btnExpEx = document.getElementById("btnExportExcel");
  if (btnExpEx) btnExpEx.addEventListener("click", exportToExcel);

  // Tab 2 Actions
  const btnSaveDept = document.getElementById("btnSaveDeptLogs");
  if (btnSaveDept) btnSaveDept.addEventListener("click", () => saveDeptLogs(false));

  const btnRefreshDept = document.getElementById("btnRefreshDeptLogs");
  if (btnRefreshDept) btnRefreshDept.addEventListener("click", loadDeptLogs);

  const btnExportDept = document.getElementById("btnExportDeptExcel");
  if (btnExportDept) btnExportDept.addEventListener("click", exportDeptToExcel);

  // Tab 3 Forms
  const formAddC = document.getElementById("formAddCustomer");
  if (formAddC) formAddC.addEventListener("submit", handleAddCustomer);

  const btnCancelCust = document.getElementById("btnCancelEditCust");
  if (btnCancelCust) btnCancelCust.addEventListener("click", resetCustomerForm);

  const formAddP = document.getElementById("formAddPO");
  if (formAddP) formAddP.addEventListener("submit", handleAddPO);

  const btnCancelPO = document.getElementById("btnCancelEditPO");
  if (btnCancelPO) btnCancelPO.addEventListener("click", resetPOForm);

  // Dynamic Batch Count in PO Form
  const batchCountSel = document.getElementById("selectBatchCount") || document.getElementById("poBatchCountSelect");
  if (batchCountSel) {
    batchCountSel.addEventListener("change", (e) => {
      const count = parseInt(e.target.value, 10) || 2;
      renderBatchInputBoxes(count);
    });
  }

  const poCustomerSelect = document.getElementById("poCustomerSelect");
  if (poCustomerSelect) {
    poCustomerSelect.addEventListener("change", (e) => {
      selectCustomerInManageTab(e.target.value);
    });
  }

  const poPlanInput = document.getElementById("poPlanTotal");
  if (poPlanInput) {
    poPlanInput.addEventListener("input", updateBatchSummaryCheck);
  }

  const btnAutoSum = document.getElementById("btnAutoSumPlan");
  if (btnAutoSum) {
    btnAutoSum.addEventListener("click", () => {
      const container = document.getElementById("dynamicBatchInputsContainer") || document.getElementById("batchInputGrid");
      const inputs = container ? container.querySelectorAll(".batch-card-input") : [];
      let sum = 0;
      inputs.forEach(inp => sum += (Number(inp.value) || 0));
      const planInp = document.getElementById("poPlanTotal");
      if (planInp) {
        planInp.value = sum;
        updateBatchSummaryCheck();
        showToast(`💡 Đã lấy tổng các lô: ${sum.toLocaleString("vi-VN")} đôi`);
      }
    });
  }

  // Flow Log Modal (if present)
  const btnAddFlow = document.getElementById("btnAddFlowLog");
  if (btnAddFlow) {
    btnAddFlow.addEventListener("click", () => {
      document.getElementById("flTransDate").value = appState.currentDate;
      const modal = document.getElementById("flowLogModal");
      if (modal) modal.classList.add("show");
    });
  }

  const btnCloseFlow = document.getElementById("btnCloseFlowModal");
  if (btnCloseFlow) {
    btnCloseFlow.addEventListener("click", () => {
      const modal = document.getElementById("flowLogModal");
      if (modal) modal.classList.remove("show");
    });
  }

  const btnCancelFlow = document.getElementById("btnCancelFlowModal");
  if (btnCancelFlow) {
    btnCancelFlow.addEventListener("click", () => {
      const modal = document.getElementById("flowLogModal");
      if (modal) modal.classList.remove("show");
    });
  }

  const btnSaveFlow = document.getElementById("btnSaveFlowLog");
  if (btnSaveFlow && typeof handleSaveFlowLog === "function") {
    btnSaveFlow.addEventListener("click", handleSaveFlowLog);
  }

  // Numpad Modal (Safely guarded)
  const btnCloseNum = document.getElementById("btnCloseNumpad");
  if (btnCloseNum && typeof hideNumpad === "function") btnCloseNum.addEventListener("click", hideNumpad);

  const btnConfNum = document.getElementById("btnNumpadConfirm");
  if (btnConfNum && typeof confirmNumpad === "function") btnConfNum.addEventListener("click", confirmNumpad);
  
  document.querySelectorAll(".num-key").forEach(key => {
    key.addEventListener("click", (e) => {
      const val = e.target.innerText;
      const display = document.getElementById("numpadDisplay");
      if (!display) return;
      if (val === "C") {
        display.innerText = "0";
      } else if (val === "←" || e.target.classList.contains("num-back")) {
        display.innerText = display.innerText.length > 1 ? display.innerText.slice(0, -1) : "0";
      } else {
        display.innerText = display.innerText === "0" ? val : display.innerText + val;
      }
    });
  });

  // Global Keyboard Navigation (4 Arrow keys & Enter & Paste from Excel)
  document.addEventListener("keydown", handleGlobalKeyNavigation);
  document.addEventListener("paste", handleExcelPaste);

  // App-Like Mobile UI & Popover Events (Android & iOS)
  const btnUserAvatar = document.getElementById("btnUserAvatar");
  const userPopoverMenu = document.getElementById("userPopoverMenu");
  const btnMobileMore = document.getElementById("btnMobileMore");
  const morePopoverMenu = document.getElementById("morePopoverMenu");

  if (btnUserAvatar) {
    btnUserAvatar.addEventListener("click", (e) => {
      e.stopPropagation();
      if (morePopoverMenu) morePopoverMenu.style.display = "none";
      if (userPopoverMenu) {
        userPopoverMenu.style.display = userPopoverMenu.style.display === "block" ? "none" : "block";
      }
    });
  }

  if (btnMobileMore) {
    btnMobileMore.addEventListener("click", (e) => {
      e.stopPropagation();
      if (userPopoverMenu) userPopoverMenu.style.display = "none";
      if (morePopoverMenu) {
        morePopoverMenu.style.display = morePopoverMenu.style.display === "block" ? "none" : "block";
      }
    });
  }

  // Popover Action Buttons
  const btnPopSwitch = document.getElementById("btnPopoverSwitchRole");
  if (btnPopSwitch) {
    btnPopSwitch.addEventListener("click", () => {
      if (userPopoverMenu) userPopoverMenu.style.display = "none";
      const btn = document.getElementById("btnSwitchRole");
      if (btn) btn.click();
    });
  }

  const btnPopLogout = document.getElementById("btnPopoverLogout");
  if (btnPopLogout) {
    btnPopLogout.addEventListener("click", () => {
      if (userPopoverMenu) userPopoverMenu.style.display = "none";
      const btn = document.getElementById("btnLogout");
      if (btn) btn.click();
    });
  }

  const btnMoreRef = document.getElementById("btnMoreRefresh");
  if (btnMoreRef) {
    btnMoreRef.addEventListener("click", () => {
      if (morePopoverMenu) morePopoverMenu.style.display = "none";
      loadReport();
    });
  }

  const btnMoreExp = document.getElementById("btnMoreExport");
  if (btnMoreExp) {
    btnMoreExp.addEventListener("click", () => {
      if (morePopoverMenu) morePopoverMenu.style.display = "none";
      exportToExcel();
    });
  }

  const btnMorePrn = document.getElementById("btnMorePrint");
  if (btnMorePrn) {
    btnMorePrn.addEventListener("click", () => {
      if (morePopoverMenu) morePopoverMenu.style.display = "none";
      window.print();
    });
  }

  // Mobile Action Bar: Vét Lô & Date Nav
  const btnMobVet = document.getElementById("btnMobileVetLo");
  if (btnMobVet) {
    btnMobVet.addEventListener("click", () => {
      openSweepTailModal();
    });
  }

  // Mobile Action Bar: Nút Tải Lại Dữ Liệu & Danh Sách KH, PO
  const btnMobSync = document.getElementById("btnMobileSyncData");
  if (btnMobSync) {
    btnMobSync.addEventListener("click", handleGlobalSyncData);
  }

  // Toggle Mobile KPI Card (Báo Cáo Đối Chiếu Nhập Xuất Tồn thu gọn / mở rộng theo mũi tên)
  const btnToggleKpi = document.getElementById("btnToggleMobileKpi");
  const mobileKpiBody = document.getElementById("mobileKpiBody");
  const kpiArrow = document.getElementById("kpiToggleArrow");

  if (btnToggleKpi && mobileKpiBody) {
    btnToggleKpi.addEventListener("click", () => {
      const isHidden = mobileKpiBody.style.display === "none" || mobileKpiBody.classList.contains("collapsed");
      if (isHidden) {
        mobileKpiBody.style.display = "block";
        mobileKpiBody.classList.remove("collapsed");
        if (kpiArrow) {
          kpiArrow.innerText = "▲";
          kpiArrow.classList.add("expanded");
        }
      } else {
        mobileKpiBody.style.display = "none";
        mobileKpiBody.classList.add("collapsed");
        if (kpiArrow) {
          kpiArrow.innerText = "▼";
          kpiArrow.classList.remove("expanded");
        }
      }
    });
  }

  // GLOBAL FACTORY BALANCE POPUP TRIGGERS & ACTIONS
  const btnFbDesktop = document.getElementById("btnOpenGlobalBalanceDesktop");
  if (btnFbDesktop) {
    btnFbDesktop.addEventListener("click", () => openFactoryBalanceModal());
  }

  const btnFbMobile = document.getElementById("btnOpenGlobalBalanceMobile");
  if (btnFbMobile) {
    btnFbMobile.addEventListener("click", () => openFactoryBalanceModal());
  }

  const btnFbMore = document.getElementById("btnMoreBalance");
  if (btnFbMore) {
    btnFbMore.addEventListener("click", () => {
      if (morePopoverMenu) morePopoverMenu.style.display = "none";
      openFactoryBalanceModal();
    });
  }

  const btnCloseFb = document.getElementById("btnCloseFactoryBalanceModal");
  if (btnCloseFb) btnCloseFb.addEventListener("click", () => closeFactoryBalanceModal());

  const btnCloseFbBtn = document.getElementById("btnCloseFactoryBalanceModalBtn");
  if (btnCloseFbBtn) btnCloseFbBtn.addEventListener("click", () => closeFactoryBalanceModal());

  const btnRefFb = document.getElementById("btnRefreshFactoryBalance");
  if (btnRefFb) btnRefFb.addEventListener("click", () => loadFactoryBalanceData());

  const fbCustSelect = document.getElementById("fbCustomerSelect");
  if (fbCustSelect) {
    fbCustSelect.addEventListener("change", (e) => {
      loadFactoryBalanceData(null, e.target.value);
    });
  }

  const fbDateInput = document.getElementById("fbReportDate");
  if (fbDateInput) {
    fbDateInput.addEventListener("change", (e) => {
      loadFactoryBalanceData(e.target.value);
    });
  }

  const fbTpInput = document.getElementById("fbThanhPhamInput");
  if (fbTpInput) {
    fbTpInput.addEventListener("input", () => {
      recalculateFactoryBalanceModal();
    });

    fbTpInput.addEventListener("change", async () => {
      await saveFactoryFinishedGoods();
    });

    fbTpInput.addEventListener("blur", async () => {
      await saveFactoryFinishedGoods();
    });

    fbTpInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        await saveFactoryFinishedGoods();
        fbTpInput.blur();
      }
    });
  }

  // Ô nhập thành phẩm trên điện thoại: chép số sang ô gốc rồi dùng chung logic tính & lưu
  const fbmTpInput = document.getElementById("fbmThanhPhamInput");
  if (fbmTpInput && fbTpInput) {
    const mirrorMobileTp = () => { fbTpInput.value = fbmTpInput.value; };
    fbmTpInput.addEventListener("input", () => {
      mirrorMobileTp();
      recalculateFactoryBalanceModal();
    });
    fbmTpInput.addEventListener("change", async () => {
      mirrorMobileTp();
      await saveFactoryFinishedGoods();
    });
    fbmTpInput.addEventListener("blur", async () => {
      mirrorMobileTp();
      await saveFactoryFinishedGoods();
    });
    fbmTpInput.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        mirrorMobileTp();
        await saveFactoryFinishedGoods();
        fbmTpInput.blur();
      }
    });
  }

  const btnFbPrevDay = document.getElementById("btnFbPrevDay");
  if (btnFbPrevDay) btnFbPrevDay.addEventListener("click", () => shiftFactoryBalanceDate(-1));

  const btnFbNextDay = document.getElementById("btnFbNextDay");
  if (btnFbNextDay) btnFbNextDay.addEventListener("click", () => shiftFactoryBalanceDate(1));

  const btnMobPrev = document.getElementById("btnMobilePrevDay");
  if (btnMobPrev) {
    btnMobPrev.addEventListener("click", () => changeDateByDays(-1));
  }

  const btnMobNext = document.getElementById("btnMobileNextDay");
  if (btnMobNext) {
    btnMobNext.addEventListener("click", () => changeDateByDays(1));
  }

  const dateMob = document.getElementById("reportDateMobile");
  if (dateMob) {
    dateMob.addEventListener("change", (e) => {
      const mobDisp = document.getElementById("mobileDateDisplay");
      if (mobDisp && e.target.value) {
        const p = e.target.value.split("-");
        if (p.length === 3) mobDisp.innerText = `${p[2]}/${p[1]}/${p[0]}`;
      }
      const repD = document.getElementById("reportDate");
      if (repD) {
        repD.value = e.target.value;
        repD.dispatchEvent(new Event("change"));
      }
    });
  }

  // Close popovers on click outside
  document.addEventListener("click", (e) => {
    if (userPopoverMenu && !userPopoverMenu.contains(e.target) && (!btnUserAvatar || !btnUserAvatar.contains(e.target))) {
      userPopoverMenu.style.display = "none";
    }
    if (morePopoverMenu && !morePopoverMenu.contains(e.target) && (!btnMobileMore || !btnMobileMore.contains(e.target))) {
      morePopoverMenu.style.display = "none";
    }
  });

  // Tự động lưu tức thì khi click chuột ra bất kỳ vị trí nào khác trên màn hình
  document.addEventListener("pointerdown", (e) => {
    const active = document.activeElement;
    if (active && (active.tagName === "INPUT" || active.tagName === "SELECT") && active !== e.target && !active.contains(e.target)) {
      if (appState.hasUnsavedChanges) {
        saveReport(appState.report.status || "DRAFT", true).then(() => {
          if (active.classList.contains("field-daily-finished")) {
            showToast(`💾 Đã lưu thành phẩm hôm nay: ${(Number(active.value) || 0).toLocaleString("vi-VN")} đôi!`);
          }
        });
      }
    }
  });

  // Tự động lưu bảo vệ dữ liệu tuyệt đối khi người dùng chuyển app, khóa màn hình, tải lại trang (reload/F5) hoặc thoát trình duyệt
  const flushSaveReport = () => {
    if (appState.currentPO && appState.report) {
      recalculateAllInPlace();
      appState.report.po_id = appState.currentPO.id;
      appState.report.report_date = appState.currentDate;
      saveLocalReportCache(appState.currentPO.id, appState.currentDate, appState.report);
      try {
        localStorage.setItem("dd_last_customer_id", appState.currentCustomer || "");
        localStorage.setItem("dd_last_po_id", appState.currentPO.id || "");
      } catch (e) {}

      if (appState.hasUnsavedChanges) {
        const payload = JSON.stringify(appState.report);
        let sent = false;
        try {
          if (navigator.sendBeacon) {
            const blob = new Blob([payload], { type: "application/json" });
            sent = navigator.sendBeacon("/api/report", blob);
          }
        } catch (e) {}
        if (!sent) {
          try {
            fetch("/api/report", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: payload,
              keepalive: true
            });
          } catch (e) {}
        }
        appState.hasUnsavedChanges = false;
      }
    }
  };

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushSaveReport();
    }
  });
  window.addEventListener("pagehide", flushSaveReport);
  window.addEventListener("beforeunload", flushSaveReport);
}

// MASTER SYNC: REFRESH ALL TABS DATA FOR CURRENT PO & DATE
async function refreshAllTabsData() {
  if (!appState.currentPO) {
    appState.report = { po_id: "", report_date: appState.currentDate, status: "DRAFT", batches: [] };
    renderReportUI();
    appState.deptLogs = {};
    renderDeptLogsUI();
    refreshReleaseBar();
    return;
  }

  appState.editingBatches = {};

  // Concurrently load data for active tabs (Tab 1 & Tab 2)
  await Promise.all([
    loadReport(),
    loadDeptLogs()
  ]);
  refreshReleaseBar();
}

async function changeDateByDays(days) {
  if (appState.hasUnsavedChanges && appState.currentPO && appState.report && appState.report.batches && appState.report.batches.length > 0) {
    try {
      await saveReport(appState.report.status || "DRAFT", true);
    } catch (err) {
      console.warn("Auto-save prior date error:", err);
    }
  }
  const curStr = appState.currentDate || getLocalDateString();
  const parts = curStr.split("-");
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + days);
  const newDateStr = getLocalDateString(d);
  appState.currentDate = newDateStr;
  const dateEl = document.getElementById("reportDate");
  if (dateEl) {
    dateEl.value = newDateStr;
  }
  const mobInput = document.getElementById("reportDateMobile");
  if (mobInput) mobInput.value = newDateStr;
  const mobDisp = document.getElementById("mobileDateDisplay");
  if (mobDisp && newDateStr) {
    const p = newDateStr.split("-");
    if (p.length === 3) mobDisp.innerText = `${p[2]}/${p[1]}/${p[0]}`;
  }
  await refreshAllTabsData();
}

// FETCH METADATA
async function fetchMetadata() {
  try {
    const res = await fetch("/api/metadata?t=" + Date.now());
    const data = await res.json();
    if (data.success) {
      const validCustomers = (data.customers || []).filter(c => !['cust-1', 'cust-2', 'cust-3'].includes(c.id));
      const seenNames = new Set();
      const uniqueCustomers = [];
      for (const c of validCustomers) {
        const normName = (c.name || '').trim().toLowerCase();
        if (!seenNames.has(normName)) {
          seenNames.add(normName);
          uniqueCustomers.push(c);
        }
      }
      appState.customers = uniqueCustomers.length > 0 ? uniqueCustomers : (data.customers || []);
      appState.orders = (data.orders || []).filter(o => !['po-050', 'po-casum-01', 'po-mp-01', '296507-003', 'po-dd-01', 'po-nk-01'].includes(o.id));
      populateCustomerSelect();
      renderManageTab();
    }
  } catch (err) {
    console.warn("Lỗi khi tải metadata từ máy chủ, kích hoạt dữ liệu dự phòng:", err);
    if (!appState.customers || appState.customers.length === 0) {
      appState.customers = [
        { id: "cust-1791885118290", name: "CAO SU MÀU", code: "CASUM" },
        { id: "cust-1790383482005", name: "Liên Thái", code: "Lth" },
        { id: "cust-1792141543754", name: "MẠNH PHÁT", code: "MP" }
      ];
      populateCustomerSelect();
      renderManageTab();
    }
  }
}

// ĐỒNG BỘ TOÀN DIỆN DỮ LIỆU: KHÁCH HÀNG, PO & SỐ LIỆU BÁO CÁO (ANDROID, IOS & DESKTOP)
async function handleGlobalSyncData() {
  const btnMob = document.getElementById("btnMobileSyncData");
  const iconMob = document.getElementById("mobileSyncIcon");
  const btnDesktop = document.getElementById("btnRefresh");

  if (btnMob) btnMob.classList.add("is-syncing");
  if (iconMob) iconMob.classList.add("is-spin");
  if (btnDesktop) {
    btnDesktop.disabled = true;
    btnDesktop.innerText = "⏳ Đang tải...";
  }

  try {
    // 1. Tải toàn bộ danh sách Khách hàng & PO mới nhất từ máy chủ
    await fetchMetadata();

    // 2. Nạp lại dữ liệu báo cáo và số liệu các bộ phận của PO hiện tại
    if (appState.currentPO) {
      await loadReport();
      if (typeof loadDeptLogs === "function") {
        await loadDeptLogs();
      }
    }

    showToast("🔄 Đã tải lại danh sách KH, PO và số liệu mới nhất!");
  } catch (err) {
    console.warn("Lỗi khi tải lại dữ liệu:", err);
    showToast("⚠️ Có lỗi khi tải lại: " + err.message);
  } finally {
    setTimeout(() => {
      if (btnMob) btnMob.classList.remove("is-syncing");
      if (iconMob) iconMob.classList.remove("is-spin");
      if (btnDesktop) {
        btnDesktop.disabled = false;
        btnDesktop.innerText = "Tải lại dữ liệu";
      }
    }, 450);
  }
}
window.handleGlobalSyncData = handleGlobalSyncData;

function populateCustomerSelect() {
  const custSel = document.getElementById("selectCustomer");
  custSel.innerHTML = appState.customers.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join("");
  
  if (appState.customers.length > 0) {
    let savedCustId = null;
    try { savedCustId = localStorage.getItem("dd_last_customer_id"); } catch (e) {}

    if (savedCustId && appState.customers.some(c => c.id === savedCustId)) {
      appState.currentCustomer = savedCustId;
    } else if (!appState.currentCustomer || !appState.customers.some(c => c.id === appState.currentCustomer)) {
      appState.currentCustomer = appState.customers[0].id;
    }
    custSel.value = appState.currentCustomer;
    filterOrdersByCustomer();
  } else {
    appState.currentCustomer = null;
    appState.currentPO = null;
    document.getElementById("selectPO").innerHTML = "<option value=''>-- Chưa có PO --</option>";
  }
}

async function filterOrdersByCustomer() {
  const poSel = document.getElementById("selectPO");
  const filtered = appState.orders.filter(o => o.customer_id === appState.currentCustomer);
  
  if (filtered.length > 0) {
    poSel.innerHTML = filtered.map(o => `<option value="${o.id}">${o.style_code} (${o.po_number}) - Kế hoạch: ${o.po_plan} đôi</option>`).join("");
    
    let savedPoId = null;
    try { savedPoId = localStorage.getItem("dd_last_po_id"); } catch (e) {}

    if (savedPoId && filtered.some(o => o.id === savedPoId)) {
      appState.currentPO = filtered.find(o => o.id === savedPoId);
    } else if (!appState.currentPO || !filtered.some(o => o.id === appState.currentPO.id)) {
      appState.currentPO = filtered[0];
    }
    poSel.value = appState.currentPO.id;
    await refreshAllTabsData();
  } else {
    poSel.innerHTML = "<option value=''>-- Chưa có PO cho KH này --</option>";
    appState.currentPO = null;
    await refreshAllTabsData();
  }
}

// LOAD REPORT DATA
async function loadReport() {
  if (!appState.currentPO) return;
  const poId = appState.currentPO.id;
  const date = appState.currentDate;
  const po = appState.currentPO;
  const tailSweepDate = po ? (po.tail_sweep_date || (po.id === 'po-050' ? '2026-09-23' : null)) : null;

  const localCache = getLocalReportCache(poId, date);

  try {
    const res = await fetch(`/api/report?po_id=${poId}&date=${date}`);
    const data = await res.json();
    if (data.success) {
      appState.report = data.report || { po_id: poId, report_date: date, status: "DRAFT", batches: [] };
      appState.cumExportsByBatch = data.cumExportsByBatch || {};
      appState.cumImportsByBatch = data.cumImportsByBatch || {};
      appState.prevDayWipByBatch = data.prevDayWipByBatch || {};
      appState.prevReportDate = data.prevReportDate || "";

      // Kiểm tra thêm bộ nhớ cục bộ trên điện thoại (localStorage) để không bao giờ bị "duột" xuất/nhập tích luỹ từ ngày trước:
      try {
        const poIdStr = String(poId || "");
        const poNumStr = (appState.currentPO && appState.currentPO.po_number) ? String(appState.currentPO.po_number) : "";
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith("dd_cache_report_") || k.startsWith("dd_report_"))) {
            const matchesPo = (poIdStr && k.includes(poIdStr)) || (poNumStr && k.includes(poNumStr));
            if (matchesPo) {
              const parts = k.split("_");
              const kDate = parts[parts.length - 1];
              if (kDate && kDate < date && kDate.includes("-")) {
                const prevCached = JSON.parse(localStorage.getItem(k) || "{}");
                if (prevCached && prevCached.batches) {
                  prevCached.batches.forEach(b => {
                    const bName = b.batch_name;
                    const bTrim = bName ? bName.trim() : "";
                    const bOut = Math.max(Number(b.daily_out) || 0, Number(b.delivered) || 0);
                    const bIn = Number(b.into_sewing) || 0;
                    if (bOut > 0) {
                      appState.cumExportsByBatch[bName] = Math.max(Number(appState.cumExportsByBatch[bName]) || 0, bOut);
                      if (bTrim) appState.cumExportsByBatch[bTrim] = Math.max(Number(appState.cumExportsByBatch[bTrim]) || 0, bOut);
                    }
                    if (bIn > 0) {
                      appState.cumImportsByBatch[bName] = Math.max(Number(appState.cumImportsByBatch[bName]) || 0, bIn);
                      if (bTrim) appState.cumImportsByBatch[bTrim] = Math.max(Number(appState.cumImportsByBatch[bTrim]) || 0, bIn);
                    }
                  });
                }
              }
            }
          }
        }
      } catch (locErr) {}

      // Kiểm tra dữ liệu: Nếu server trả về danh sách lô rỗng hoặc các ô đều là 0,
      // trong khi bộ nhớ cache trên điện thoại đã có dữ liệu người dùng nhập:
      const checkHasData = (rep) => {
        return Boolean(rep && rep.batches && rep.batches.some(b => 
          (Number(b.into_sewing) || 0) > 0 || (Number(b.wip_sewing) || 0) > 0 || (Number(b.wip_qc) || 0) > 0 ||
          (Number(b.wip_pairing) || 0) > 0 || (Number(b.wip_packing) || 0) > 0 || (Number(b.wip_warehouse) || 0) > 0 ||
          (Number(b.daily_out) || 0) > 0 || (Number(b.daily_finished) || 0) > 0 ||
          (Number(b.shortage_mat_xac) || 0) > 0 || (Number(b.shortage_hang_phe) || 0) > 0 || (Number(b.shortage_khac) || 0) > 0 ||
          (b.shortage_note && b.shortage_note.trim().length > 0)
        ));
      };

      const serverHasData = checkHasData(appState.report);
      const cacheHasData = checkHasData(localCache);
      const localTime = (localCache && localCache._localSavedAt) || 0;
      const serverTime = (appState.report && appState.report.updated_at) || 0;

      // ƯU TIÊN TUYỆT ĐỐI BẢN LƯU GẦN NHẤT CỦA NGƯỜI DÙNG:
      // Nếu máy này có bản lưu cục bộ và thời gian lưu cục bộ mới hơn server,
      // hoặc server không có số liệu thực tế mà máy có số liệu:
      if (cacheHasData && (localTime >= serverTime || !serverHasData)) {
        console.info("⚡ Ưu tiên hiển thị dữ liệu mới nhất người dùng vừa nhập trên máy:", localCache);
        appState.report = localCache;
        // Tự động đồng bộ ngay lên máy chủ
        saveReport(appState.report.status || "DRAFT", true);
      } else if (serverHasData) {
        saveLocalReportCache(poId, date, appState.report);
      }

      // Auto-fallback: if report has no batches, populate immediately from currentPO default_batches
      if (!appState.report.batches || appState.report.batches.length === 0) {
        if (po && po.default_batches && po.default_batches.length > 0) {
          let defBatches = [...po.default_batches];
          if (tailSweepDate && date < tailSweepDate) {
            defBatches = defBatches.filter(b => !b.is_tail_batch && !(b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
          }
          appState.report.batches = defBatches.map((b, i) => {
            const defaultTodayIn = 0; // New report dates must always start with 0 into_sewing (no fake auto-fill)
            return {
              id: b.id || `b-${i+1}`,
              batch_name: b.batch_name,
              batch_plan: Number(b.batch_plan || b.into_sewing) || 0,
              into_sewing: defaultTodayIn,
              delivered: 0,
              wip_sewing: 0,
              wip_qc: 0,
              wip_pairing: 0,
              wip_packing: 0,
              wip_warehouse: 0,
              daily_out: 0,
              daily_finished: 0,
              note_sewing: "",
              note_qc: "",
              note_pairing: "",
              note_packing: "",
              note_warehouse: "",
              shortage_reason_type: "",
              shortage_note: "",
              shortage_mat_xac: 0,
              shortage_hang_phe: 0,
              shortage_khac: 0,
              is_tail_batch: Boolean(b.is_tail_batch || (b.batch_name && b.batch_name.toLowerCase().includes('đuôi')))
            };
          });
        }
      }

      // Enforce Tail Batch Date Rule:
      // 1. If date < tailSweepDate: Filter out tail batch so prior days strictly show Lô 1 & Lô 2 and Chuẩn Bị nợ!
      if (tailSweepDate && date < tailSweepDate) {
        appState.report.batches = (appState.report.batches || []).filter(b => 
          !b.is_tail_batch && !(b.batch_name && b.batch_name.toLowerCase().includes('đuôi'))
        );
      }
      // 2. If date >= tailSweepDate: Ensure the tail batch is present and displayed side-by-side with Lô 1 and Lô 2!
      if (tailSweepDate && date >= tailSweepDate) {
        if (!appState.report.batches) appState.report.batches = [];
        const hasTail = appState.report.batches.some(b => 
          b.is_tail_batch || (b.batch_name && b.batch_name.toLowerCase().includes('đuôi'))
        );
        if (!hasTail) {
          const tailDef = (po && po.default_batches || []).find(b => 
            b.is_tail_batch || (b.batch_name && b.batch_name.toLowerCase().includes('đuôi'))
          );
          const tName = tailDef ? tailDef.batch_name : (po.tail_batch_name || "Lô Số Đuôi");
          const tPlan = tailDef ? (Number(tailDef.batch_plan || tailDef.into_sewing) || 126) : 126;
          const priorIn = Number(appState.cumImportsByBatch && appState.cumImportsByBatch[tName]) || 0;
          const tTodayIn = (date === tailSweepDate && priorIn === 0) ? tPlan : 0;
          
          const isPo050SweepDay = (po.id === 'po-050' && date === '2026-09-23');

          appState.report.batches.push({
            id: (tailDef && tailDef.id) || ('b-tail-' + Date.now()),
            batch_name: tName,
            batch_plan: tPlan,
            into_sewing: tTodayIn,
            delivered: 0,
            wip_sewing: isPo050SweepDay ? 80 : 0,
            wip_qc: isPo050SweepDay ? 46 : 0,
            wip_pairing: 0,
            wip_packing: 0,
            wip_warehouse: 0,
            daily_out: 0,
            note_sewing: isPo050SweepDay ? "Tổ may" : "",
            note_qc: isPo050SweepDay ? "QC 1" : "",
            note_pairing: "",
            note_packing: "",
            note_warehouse: "",
            shortage_reason_type: "",
            shortage_note: isPo050SweepDay ? "Nhận 126 nợ từ Chuẩn Bị bù nợ" : "Chuẩn bị bàn giao vét đuôi đợt cuối",
            shortage_mat_xac: 0,
            shortage_hang_phe: 0,
            shortage_khac: 0,
            is_tail_batch: true
          });
        }
      }

      appState.hasUnsavedChanges = false;
      renderReportUI();
    }
  } catch (err) {
    console.error("Lỗi tải báo cáo từ máy chủ, kiểm tra cache nội bộ:", err);
    try {
      const poIdStr = String(poId || "");
      const poNumStr = (appState.currentPO && appState.currentPO.po_number) ? String(appState.currentPO.po_number) : "";
      appState.cumExportsByBatch = appState.cumExportsByBatch || {};
      appState.cumImportsByBatch = appState.cumImportsByBatch || {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("dd_cache_report_") || k.startsWith("dd_report_"))) {
          const matchesPo = (poIdStr && k.includes(poIdStr)) || (poNumStr && k.includes(poNumStr));
          if (matchesPo) {
            const parts = k.split("_");
            const kDate = parts[parts.length - 1];
            if (kDate && kDate < date && kDate.includes("-")) {
              const prevCached = JSON.parse(localStorage.getItem(k) || "{}");
              if (prevCached && prevCached.batches) {
                prevCached.batches.forEach(b => {
                  const bName = b.batch_name;
                  const bTrim = bName ? bName.trim() : "";
                  const bOut = Math.max(Number(b.daily_out) || 0, Number(b.delivered) || 0);
                  const bIn = Number(b.into_sewing) || 0;
                  if (bOut > 0) {
                    appState.cumExportsByBatch[bName] = Math.max(Number(appState.cumExportsByBatch[bName]) || 0, bOut);
                    if (bTrim) appState.cumExportsByBatch[bTrim] = Math.max(Number(appState.cumExportsByBatch[bTrim]) || 0, bOut);
                  }
                  if (bIn > 0) {
                    appState.cumImportsByBatch[bName] = Math.max(Number(appState.cumImportsByBatch[bName]) || 0, bIn);
                    if (bTrim) appState.cumImportsByBatch[bTrim] = Math.max(Number(appState.cumImportsByBatch[bTrim]) || 0, bIn);
                  }
                });
              }
            }
          }
        }
      }
    } catch (e) {}

    if (localCache && localCache.batches && localCache.batches.length > 0) {
      appState.report = localCache;
      appState.hasUnsavedChanges = false;
      renderReportUI();
      showToast("📱 Đang hiển thị dữ liệu lưu trên điện thoại (ngoại tuyến)");
      return;
    }
  }
}

function renderReportUI() {
  const poPlan = (appState.currentPO && appState.currentPO.po_plan) ? (Number(appState.currentPO.po_plan) || 0) : 0;
  const poNum = appState.currentPO ? appState.currentPO.po_number : "--";

  const batches = appState.report.batches || [];

  // Update Top Summary Table Meta
  document.getElementById("summaryDateVal").innerText = formatDateDisplay(appState.currentDate);
  document.getElementById("summaryPoNum").innerText = poNum;
  document.getElementById("summaryPoPlan").innerText = poPlan.toLocaleString("vi-VN");

  const mobDisp = document.getElementById("mobileDateDisplay");
  if (mobDisp && appState.currentDate) {
    const p = appState.currentDate.split("-");
    if (p.length === 3) mobDisp.innerText = `${p[2]}/${p[1]}/${p[0]}`;
  }
  const mobDateInput = document.getElementById("reportDateMobile");
  if (mobDateInput && appState.currentDate) {
    mobDateInput.value = appState.currentDate;
  }
  const topDateInput = document.getElementById("reportDate");
  if (topDateInput && appState.currentDate) {
    topDateInput.value = appState.currentDate;
  }

  // Status Tag
  const statusTag = document.getElementById("reportStatusTag");
  statusTag.innerText = appState.report.status === "SUBMITTED" ? "Đã chốt sổ" : "Bản nháp";
  if (appState.report.status === "SUBMITTED") {
    statusTag.classList.add("submitted");
  } else {
    statusTag.classList.remove("submitted");
  }

  // Render Batch Containers
  const container = document.getElementById("excelBatchesContainer");
  container.innerHTML = "";

  if (batches.length === 0) {
    container.innerHTML = `
      <div class="empty-ledger-state">
        <p class="empty-ledger-title">Đơn hàng này chưa được chia lô sản xuất</p>
        <p class="empty-ledger-desc">Chọn <strong>+ Thêm lô mới</strong> trên thanh công cụ hoặc mở tab <strong>Khách hàng &amp; đơn hàng PO</strong> để thiết lập định mức từng lô.</p>
      </div>
    `;
    recalculateAllInPlace();
    return;
  }

  batches.forEach((batch, idx) => {
    const isEditing = Boolean(appState.editingBatches && appState.editingBatches[idx]);
    
    // Previous days cumulative
    const prevIn = Number(appState.cumImportsByBatch && appState.cumImportsByBatch[batch.batch_name]) || 0;
    const prevOut = Number(appState.cumExportsByBatch && appState.cumExportsByBatch[batch.batch_name]) || 0;

    // Today's activity
    const todayIn = Number(batch.into_sewing) || 0;
    const todayOut = Number(batch.daily_out) || 0;

    // Cumulative totals up to today
    const cumIn = prevIn + todayIn;
    const cumOut = prevOut + todayOut;
    batch.delivered = cumOut;
    batch.cum_into_sewing = cumIn;

    const tonLyThuyet = cumIn - cumOut;
    const actualWip = (Number(batch.wip_sewing) || 0) + (Number(batch.wip_qc) || 0) + (Number(batch.wip_pairing) || 0) + (Number(batch.wip_packing) || 0) + (Number(batch.wip_warehouse) || 0);
    const shortage = tonLyThuyet - actualWip;

    const totalExplained = (Number(batch.shortage_mat_xac) || 0) + (Number(batch.shortage_hang_phe) || 0) + (Number(batch.shortage_khac) || 0);

    const wrapper = document.createElement("div");
    wrapper.className = "excel-batch-wrapper";
    wrapper.dataset.index = idx;
    wrapper.id = `batchWrapper_${idx}`;

    wrapper.innerHTML = `
      <!-- ========================================================
           UNIFIED WORKFLOOR TICKET / BATCH CARD
           ======================================================== -->
      <div class="h1-batch-card" id="batchCard_${idx}">
        
        <!-- 1. TOP HEADER: DATE BADGE (LEFT), PO (CENTER) & BATCH BADGE (RIGHT) -->
        <div class="h1-batch-header">
          <div class="h1-date-badge" id="batchDateBadge_${idx}" title="Chạm để chọn ngày báo cáo">
            <span class="date-txt" id="batchDateTxt_${idx}">${formatDateDisplay(appState.currentDate)}</span>
            <input type="date" class="h1-date-hidden-input" id="batchDateInput_${idx}" value="${appState.currentDate}">
          </div>
          <div class="h1-header-po font-bold text-navy">${poNum}</div>
          <div class="h1-batch-badge">
            <div class="b-name">${batch.batch_name}</div>
            <div class="b-plan">${(batch.batch_plan || 0).toLocaleString("vi-VN")} đôi</div>
          </div>
        </div>

        <!-- 2. SECTION 1: NHẬP - XUẤT TRONG NGÀY -->
        <div class="h1-section-block">
          <div class="h1-sec-title">
            <span class="h1-num-bullet">1</span> Nhập – xuất trong ngày
          </div>
          <div class="h1-table-card">
            <table class="h1-table-nx h1-table-nx-3col">
              <colgroup>
                <col style="width: 46%;">
                <col style="width: 27%;">
                <col style="width: 27%;">
              </colgroup>
              <thead>
                <tr>
                  <th class="col-target text-center" style="padding-left: 6px;">Chỉ tiêu</th>
                  <th class="col-nhap text-center">Nhập</th>
                  <th class="col-xuat text-center">Xuất</th>
                </tr>
              </thead>
              <tbody>
                <!-- ROW 1: LUỸ KẾ HÔM TRƯỚC -->
                <tr class="row-luy-ke-truoc">
                  <td class="cell-label">
                    <span class="main-lbl">Luỹ kế hôm trước</span>
                  </td>
                  <td class="cell-prev-val text-center font-bold" id="calcPrevIn_${idx}">${prevIn.toLocaleString("vi-VN")}</td>
                  <td class="cell-prev-val text-center font-bold" id="calcPrevOut_${idx}">${prevOut.toLocaleString("vi-VN")}</td>
                </tr>
                <!-- ROW 2: PHÁT SINH HÔM NAY -->
                <tr class="row-phat-sinh-hn">
                  <td class="cell-label">
                    <span class="main-lbl">Phát sinh hôm nay</span>
                  </td>
                  <td class="cell-calc-group text-center">
                    <input type="number" class="wip-num-input field-daily-in field-into-sewing grid-nav-input h1-pink-input" data-batch="${idx}" data-row="0" data-col="2" value="${batch.into_sewing || ''}" placeholder="0" data-idx="${idx}" title="Phát sinh nhập hôm nay">
                  </td>
                  <td class="cell-calc-group text-center">
                    <input type="number" class="wip-num-input wip-num-input-out field-daily-out grid-nav-input h1-pink-input" data-batch="${idx}" data-row="0" data-col="3" value="${batch.daily_out || ''}" placeholder="0" data-idx="${idx}" title="Phát sinh xuất hôm nay">
                  </td>
                </tr>
                <!-- ROW 3: TỔNG -->
                <tr class="row-tong">
                  <td class="cell-label">
                    <span class="main-lbl font-bold">Tổng luỹ kế</span>
                  </td>
                  <td class="cell-total-val text-center">
                    <span class="val-num font-black text-blue-vivid" id="calcIntoSewing_${idx}">${cumIn.toLocaleString("vi-VN")}</span>
                  </td>
                  <td class="cell-total-val text-center">
                    <span class="val-num font-black text-blue-vivid" id="calcDelivered_${idx}">${cumOut.toLocaleString("vi-VN")}</span>
                  </td>
                </tr>
                <!-- ROW 4: GHI CHÚ TỒN ĐẦU KỲ = 0 -->
                <tr class="row-note">
                  <td colspan="3" class="cell-sub-note">
                    Ghi chú: Tồn đầu kỳ = 0
                    <span id="calcTonDauNgay_${idx}" style="display:none">--</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. SECTION 2: ĐỐI CHIẾU SỐ TỒN THỰC TẾ -->
        <div class="h1-section-block">
          <div class="h1-sec-title">
            <span class="h1-num-bullet">2</span> Đối chiếu số tồn thực tế
          </div>

          <!-- 3 EQUATION METRIC CARDS -->
          <div class="h1-equation-row">
            <!-- Card 1: Tồn LT -->
            <div class="h1-eq-col">
              <div class="eq-hdr text-navy-title font-bold">Tồn LT</div>
              <div class="eq-box bg-soft-blue">
                <span class="eq-val text-blue-vivid font-black" id="calcTheoWip_${idx}">${tonLyThuyet.toLocaleString("vi-VN")}</span>
              </div>
            </div>

            <div class="h1-eq-op font-bold text-slate-400">−</div>

            <!-- Card 2: Tồn TT -->
            <div class="h1-eq-col">
              <div class="eq-hdr text-navy-title font-bold">Tồn TT</div>
              <div class="eq-box bg-soft-blue">
                <span class="eq-val text-blue-vivid font-black" id="calcActualWip_${idx}">${actualWip.toLocaleString("vi-VN")}</span>
              </div>
            </div>

            <div class="h1-eq-op font-bold text-slate-400">=</div>

            <!-- Card 3: Thiếu / Thừa / Cân đối -->
            <div class="h1-eq-col">
              <div class="eq-hdr text-pink font-bold" id="calcShortageTitle_${idx}">
                ${shortage > 0 ? 'Thiếu' : (shortage < 0 ? 'Thừa' : 'Cân đối')}
              </div>
              <div class="eq-box bg-soft-blue">
                <span class="eq-val text-pink font-black" id="calcShortage_${idx}">
                  ${shortage === 0 ? '<span class="text-green-600 font-bold">0</span>' : (shortage > 0 ? ('<span class="text-pink font-bold">' + Math.abs(shortage).toLocaleString("vi-VN") + '</span>') : ('<span class="text-blue-vivid font-bold">+' + Math.abs(shortage).toLocaleString("vi-VN") + '</span>'))}
                </span>
              </div>
            </div>
          </div>

          <!-- SUB-PANEL: KIỂM KÊ THỰC TẾ (5 TRẠM ĐẢO THỨ TỰ: 5 -> 4 -> 3 -> 2 -> 1) -->
          <div class="h1-box card-soft-panel h1-station-card">
            <div class="h1-box-hdr hdr-clean-blue h1-station-hdr">
              <div class="box-hdr-text station-hdr-text">
                <div class="box-title station-title text-navy-title font-bold">Kiểm kê thực tế ngày ${formatDateDisplay(appState.currentDate)}</div>
                <div class="box-sub station-sub text-slate-sub">${batch.batch_name}, số lượng tại từng trạm</div>
              </div>
            </div>
            <div class="h1-station-list">
              <!-- 5. Tồn - tại Kho thành phẩm -->
              <div class="h1-station-row is-direct-input">
                <div class="st-tag-name">
                  <span class="st-badge badge-clean-num">5</span>
                  <span class="st-text">Tồn tại kho thành phẩm</span>
                </div>
                <div class="st-val-wrap">
                  <input type="number" class="wip-num-input field-wip-warehouse grid-nav-input h1-pink-input" data-batch="${idx}" data-row="1" data-col="4" value="${batch.wip_warehouse || ''}" placeholder="0" data-idx="${idx}" title="Nhập số lượng trạm 5">
                </div>
              </div>
              <!-- 4. Tồn đóng gói -->
              <div class="h1-station-row is-direct-input">
                <div class="st-tag-name">
                  <span class="st-badge badge-clean-num">4</span>
                  <span class="st-text">Tồn đóng gói</span>
                </div>
                <div class="st-val-wrap">
                  <input type="number" class="wip-num-input field-wip-packing grid-nav-input h1-pink-input" data-batch="${idx}" data-row="1" data-col="3" value="${batch.wip_packing || ''}" placeholder="0" data-idx="${idx}" title="Nhập số lượng trạm 4">
                </div>
              </div>
              <!-- 3. Tồn phối đôi -->
              <div class="h1-station-row is-direct-input">
                <div class="st-tag-name">
                  <span class="st-badge badge-clean-num">3</span>
                  <span class="st-text">Tồn phối đôi</span>
                </div>
                <div class="st-val-wrap">
                  <input type="number" class="wip-num-input field-wip-pairing grid-nav-input h1-pink-input" data-batch="${idx}" data-row="1" data-col="2" value="${batch.wip_pairing || ''}" placeholder="0" data-idx="${idx}" title="Nhập số lượng trạm 3">
                </div>
              </div>
              <!-- 2. Tồn kiểm QC -->
              <div class="h1-station-row is-direct-input">
                <div class="st-tag-name">
                  <span class="st-badge badge-clean-num">2</span>
                  <span class="st-text">Tồn kiểm QC</span>
                </div>
                <div class="st-val-wrap">
                  <input type="number" class="wip-num-input field-wip-qc grid-nav-input h1-pink-input" data-batch="${idx}" data-row="1" data-col="1" value="${batch.wip_qc || ''}" placeholder="0" data-idx="${idx}" title="Nhập số lượng trạm 2">
                </div>
              </div>
              <!-- 1. Đang sản xuất -->
              <div class="h1-station-row is-direct-input">
                <div class="st-tag-name">
                  <span class="st-badge badge-clean-num">1</span>
                  <span class="st-text">Đang sản xuất</span>
                </div>
                <div class="st-val-wrap">
                  <input type="number" class="wip-num-input field-wip-sewing grid-nav-input h1-pink-input" data-batch="${idx}" data-row="1" data-col="0" value="${batch.wip_sewing || ''}" placeholder="0" data-idx="${idx}" title="Nhập số lượng trạm 1">
                </div>
              </div>
            </div>
            <!-- Footer: Tồn thực tế -->
            <div class="h1-box-footer footer-clean-blue h1-station-footer">
              <span class="ft-lbl text-navy-title font-bold">Tồn thực tế</span>
              <span class="ft-val text-blue-vivid font-black" id="calcWipSum_${idx}">${actualWip.toLocaleString("vi-VN")}</span>
            </div>
          </div>
        </div>

        <!-- 4. SECTION 3: NGUYÊN NHÂN THIẾU -->
        <div class="h1-section-block">
          <div class="h1-sec-title">
            <span class="h1-num-bullet">3</span> Nguyên nhân thiếu
          </div>
          <div class="h1-box card-soft-panel h1-reason-card">
            <div class="h1-box-hdr hdr-clean-blue h1-reason-hdr">
              <div class="box-hdr-text reason-hdr-text">
                <div class="box-title reason-hdr-title text-slate-sub font-semibold">Nhập số lượng thiếu theo phân loại (đôi)</div>
              </div>
            </div>
            <div class="h1-reason-list">
              <!-- 1. Mất xác -->
              <div class="h1-reason-row is-direct-input">
                <div class="rs-label-wrap">
                  <span class="rs-title font-bold text-slate-800">Mất xác</span>
                </div>
                <div class="rs-input-wrap">
                  <input type="number" class="wip-num-input field-shortage-matxac grid-nav-input h1-pink-input" data-batch="${idx}" data-row="0" data-col="5" value="${batch.shortage_mat_xac || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
              <!-- 2. Hàng phế -->
              <div class="h1-reason-row is-direct-input">
                <div class="rs-label-wrap">
                  <span class="rs-title font-bold text-slate-800">Hàng phế</span>
                </div>
                <div class="rs-input-wrap">
                  <input type="number" class="wip-num-input field-shortage-hangphe grid-nav-input h1-pink-input" data-batch="${idx}" data-row="0" data-col="6" value="${batch.shortage_hang_phe || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
              <!-- 3. Khác -->
              <div class="h1-reason-row is-direct-input">
                <div class="rs-label-wrap">
                  <span class="rs-title font-bold text-slate-800">Khác</span>
                </div>
                <div class="rs-input-wrap">
                  <input type="number" class="wip-num-input field-shortage-khac grid-nav-input h1-pink-input" data-batch="${idx}" data-row="0" data-col="7" value="${batch.shortage_khac || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
              <!-- Ghi chú lý do (nếu có) -->
              <div class="h1-reason-note-row">
                <div class="rs-note-lbl">Ghi chú lý do (nếu có)</div>
                <input type="text" class="th-khac-note-input field-shortage-note grid-nav-input h1-pink-note-input" data-batch="${idx}" data-row="0" data-col="8" value="${batch.shortage_note || ''}" placeholder="Ví dụ: 40 đôi đang thiếu chi tiết chờ bù" data-idx="${idx}">
              </div>
            </div>
            <!-- Footer: Tổng số thiếu -->
            <div class="h1-box-footer footer-clean-pink h1-reason-footer">
              <span class="ft-lbl text-pink font-bold">Tổng số thiếu</span>
              <span class="ft-val text-pink font-black" id="calcExplainSum_${idx}">${totalExplained.toLocaleString("vi-VN")}</span>
            </div>
          </div>
        </div>

        <!-- Hidden input for executor preservation -->
        <input type="hidden" class="wip-executor-input field-note-sewing" data-batch="${idx}" data-row="2" data-col="0" value="${batch.note_sewing || ''}" data-idx="${idx}">
        <div id="calcStatusBanner_${idx}" style="display:none"></div>

      </div>
    `;

    container.appendChild(wrapper);
  });

  bindCardInputs();
  recalculateAllInPlace();
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const months = ["Th01", "Th02", "Th03", "Th04", "Th05", "Th06", "Th07", "Th08", "Th09", "Th10", "Th11", "Th12"];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${parts[2]}-${months[mIdx] || parts[1]}`;
  }
  return dateStr;
}

// IN-PLACE RECALCULATION
function recalculateAllInPlace() {
  const poPlan = (appState.currentPO && appState.currentPO.po_plan) ? (Number(appState.currentPO.po_plan) || 0) : 0;
  const batches = appState.report.batches || [];

  let totalReceived = 0;
  let totalDelivered = 0;
  let totalActualWip = 0;

  batches.forEach((b, idx) => {
    const prevIn = Number(appState.cumImportsByBatch && appState.cumImportsByBatch[b.batch_name]) || 0;
    const prevOut = Number(appState.cumExportsByBatch && appState.cumExportsByBatch[b.batch_name]) || 0;
    const todayIn = Number(b.into_sewing) || 0;
    const todayOut = Number(b.daily_out) || 0;

    const cumIn = prevIn + todayIn;
    const cumOut = prevOut + todayOut;
    b.delivered = cumOut;
    b.cum_into_sewing = cumIn;

    totalReceived += cumIn;
    totalDelivered += cumOut;

    const actWip = (Number(b.wip_sewing) || 0) + (Number(b.wip_qc) || 0) + (Number(b.wip_pairing) || 0) + (Number(b.wip_packing) || 0) + (Number(b.wip_warehouse) || 0);
    totalActualWip += actWip;

    const tonLyThuyet = cumIn - cumOut;
    const shortage = tonLyThuyet - actWip;

    // Elements in Hinh 1 Layout
    const elPrevIn = document.getElementById(`calcPrevIn_${idx}`);
    if (elPrevIn) elPrevIn.innerText = prevIn.toLocaleString("vi-VN");

    const elPrevOut = document.getElementById(`calcPrevOut_${idx}`);
    if (elPrevOut) elPrevOut.innerText = prevOut.toLocaleString("vi-VN");

    const elCumIn = document.getElementById(`calcIntoSewing_${idx}`);
    if (elCumIn) elCumIn.innerText = cumIn.toLocaleString("vi-VN");

    const elDelivered = document.getElementById(`calcDelivered_${idx}`);
    if (elDelivered) elDelivered.innerText = cumOut.toLocaleString("vi-VN");

    const elTheo = document.getElementById(`calcTheoWip_${idx}`);
    if (elTheo) elTheo.innerText = tonLyThuyet.toLocaleString("vi-VN");

    const elAct = document.getElementById(`calcActualWip_${idx}`);
    if (elAct) elAct.innerText = actWip.toLocaleString("vi-VN");

    const elWipSum = document.getElementById(`calcWipSum_${idx}`);
    if (elWipSum) elWipSum.innerText = actWip.toLocaleString("vi-VN");

    const matXac = Number(b.shortage_mat_xac) || 0;
    const hangPhe = Number(b.shortage_hang_phe) || 0;
    const khac = Number(b.shortage_khac) || 0;
    const totalExplained = matXac + hangPhe + khac;

    const elExplain = document.getElementById(`calcExplainSum_${idx}`);
    if (elExplain) elExplain.innerText = totalExplained.toLocaleString("vi-VN");

    const elShortageTitle = document.getElementById(`calcShortageTitle_${idx}`);
    if (elShortageTitle) {
      if (shortage > 0) {
        elShortageTitle.innerText = "Thiếu";
        elShortageTitle.className = "eq-hdr text-pink font-bold";
      } else if (shortage < 0) {
        elShortageTitle.innerText = "Thừa";
        elShortageTitle.className = "eq-hdr text-blue-vivid font-bold";
      } else {
        elShortageTitle.innerText = "Cân đối";
        elShortageTitle.className = "eq-hdr text-green-600 font-bold";
      }
    }

    const elShortage = document.getElementById(`calcShortage_${idx}`);
    if (elShortage) {
      if (shortage === 0) {
        elShortage.innerHTML = '<span class="text-green-600 font-bold">0</span>';
      } else if (shortage > 0) {
        elShortage.innerHTML = `<span class="text-pink font-bold">${Math.abs(shortage).toLocaleString("vi-VN")}</span>`;
      } else {
        elShortage.innerHTML = `<span class="text-blue-vivid font-bold">+${Math.abs(shortage).toLocaleString("vi-VN")}</span>`;
      }
    }

    const elBanner = document.getElementById(`calcStatusBanner_${idx}`);
    if (elBanner) {
      elBanner.innerHTML = shortage === 0 
        ? '<div class="h1-status-banner banner-ok">✔ Không có lệch – không cần phân tích</div>' 
        : (shortage > 0 
            ? ('<div class="h1-status-banner banner-shortage">⚠️ Thiếu -' + Math.abs(shortage).toLocaleString("vi-VN") + ' đôi – vui lòng phân tích nguyên nhân bên trên</div>') 
            : ('<div class="h1-status-banner banner-surplus">ℹ️ Thừa +' + Math.abs(shortage).toLocaleString("vi-VN") + ' đôi – kiểm tra lại số đếm thực tế</div>'));
    }

    const elTonDau = document.getElementById(`calcTonDauNgay_${idx}`);
    if (elTonDau) elTonDau.innerText = "--";
  });

  const prepDebt = Math.max(0, poPlan - totalReceived);
  const totalShortage = (totalReceived - totalDelivered) - totalActualWip;

  const elSumRec = document.getElementById("summaryTotalReceived");
  if (elSumRec) elSumRec.innerText = totalReceived.toLocaleString("vi-VN");

  const elSumDel = document.getElementById("summaryTotalDelivered");
  if (elSumDel) elSumDel.innerText = totalDelivered.toLocaleString("vi-VN");

  const elSumAct = document.getElementById("summaryTotalActualWip");
  if (elSumAct) elSumAct.innerText = totalActualWip.toLocaleString("vi-VN");

  const elSumShort = document.getElementById("summaryTotalShortage");
  if (elSumShort) elSumShort.innerText = totalShortage.toLocaleString("vi-VN");

  const elDebt = document.getElementById("summaryPrepDebt");
  if (elDebt) elDebt.innerText = prepDebt.toLocaleString("vi-VN");

  // Mobile KPI Card elements (4 hàng theo chuẩn Mockup)
  const mkDate = document.getElementById("mkpiDate");
  if (mkDate) mkDate.innerText = formatDateDisplay(appState.currentDate);

  const mkDebt = document.getElementById("mkpiPrepDebt");
  if (mkDebt) mkDebt.innerText = prepDebt.toLocaleString("vi-VN");

  const mkPO = document.getElementById("mkpiPoNum");
  if (mkPO) mkPO.innerText = appState.currentPO ? appState.currentPO.po_number : "--";

  const mkPlan = document.getElementById("mkpiTotalPlan");
  if (mkPlan) mkPlan.innerText = poPlan.toLocaleString("vi-VN");

  const mkRec = document.getElementById("mkpiTotalReceived");
  if (mkRec) mkRec.innerText = totalReceived.toLocaleString("vi-VN");

  const mkDel = document.getElementById("mkpiTotalDelivered");
  if (mkDel) mkDel.innerText = totalDelivered.toLocaleString("vi-VN");

  const mkAct = document.getElementById("mkpiTotalActualWip");
  if (mkAct) mkAct.innerText = totalActualWip.toLocaleString("vi-VN");

  // Mobile Action Bar: Vét lô badge and Date
  const mobBadge = document.getElementById("mobileVetLoBadge");
  if (mobBadge) {
    mobBadge.innerText = prepDebt.toLocaleString("vi-VN");
  }

  const mobDateDisp = document.getElementById("mobileDateDisplay");
  if (mobDateDisp && appState.currentDate) {
    const parts = appState.currentDate.split("-");
    if (parts.length === 3) {
      mobDateDisp.innerText = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const mobDateInput = document.getElementById("reportDateMobile");
  if (mobDateInput && appState.currentDate) {
    mobDateInput.value = appState.currentDate;
  }

  // Dynamic status for Sweep Tail Batch buttons
  const btnSweep = document.getElementById("btnOpenSweepTailModal");
  const btnTbSweep = document.getElementById("btnToolbarSweepTail");
  const btnMobSweep = document.getElementById("btnMobileVetLo");
  [btnSweep, btnTbSweep, btnMobSweep].forEach(b => {
    if (!b) return;
    if (prepDebt > 0) {
      b.disabled = false;
      b.classList.remove("disabled");
      b.style.opacity = "1";
      b.style.cursor = "pointer";
      if (b.id === "btnOpenSweepTailModal") {
        b.innerHTML = `⚡ Vét Số Đuôi (${prepDebt.toLocaleString("vi-VN")})`;
      } else if (b.id === "btnToolbarSweepTail") {
        b.innerHTML = `⚡ Vét Lô Đuôi (${prepDebt.toLocaleString("vi-VN")})`;
      }
      b.title = `Chuẩn Bị còn nợ ${prepDebt.toLocaleString("vi-VN")} đôi. Bấm để tạo Lô riêng biệt nhận lượng hàng này vào chuyền!`;
    } else {
      b.disabled = true;
      b.classList.add("disabled");
      b.style.opacity = "0.7";
      b.style.cursor = "default";
      if (b.id === "btnOpenSweepTailModal") {
        b.innerHTML = `✔ Đã nhận đủ hàng`;
      } else if (b.id === "btnToolbarSweepTail") {
        b.innerHTML = `✔ Đủ Hàng`;
      }
      b.title = `Đã nhận đủ toàn bộ kế hoạch đơn hàng, không còn nợ phôi.`;
    }
  });
}


// BIND CARD INPUT LISTENERS
function bindCardInputs() {
  // Batch Save/Edit Toggle Button (Rotating cycle per batch)
  document.querySelectorAll(".btn-toggle-batch").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const bIdx = parseInt(btn.dataset.batch, 10);
      if (isNaN(bIdx)) return;
      
      const currentlyEditing = Boolean(appState.editingBatches && appState.editingBatches[bIdx]);
      if (currentlyEditing) {
        // Switch to Locked mode & save to DB
        if (!appState.editingBatches) appState.editingBatches = {};
        appState.editingBatches[bIdx] = false;
        
        const scrollY = window.scrollY;
        await saveReport(appState.report.status || "DRAFT", true);
        const b = appState.report.batches[bIdx];
        showToast(`💾 Đã lưu và khóa bảng kiểm kê ${b ? b.batch_name : 'Lô'} ngày ${formatDateDisplay(appState.currentDate)}!`);
        renderReportUI();
        window.scrollTo(0, scrollY);
      } else {
        // Switch to Editing mode & focus
        if (!appState.editingBatches) appState.editingBatches = {};
        appState.editingBatches[bIdx] = true;
        
        const scrollY = window.scrollY;
        renderReportUI();
        window.scrollTo(0, scrollY);
        
        const firstWipInput = document.querySelector(`.field-wip-sewing[data-batch="${bIdx}"]`);
        if (firstWipInput) {
          firstWipInput.focus();
          firstWipInput.select();
        }
      }
    });
  });

  document.querySelectorAll(".excel-batches-container input, .excel-batches-container select").forEach(input => {
    input.addEventListener("input", (e) => {
      appState.hasUnsavedChanges = true;
      const idx = e.target.dataset.idx || e.target.dataset.batch;
      const b = appState.report.batches[idx];
      if (!b) return;

      if (e.target.classList.contains("field-daily-in") || e.target.classList.contains("field-into-sewing")) {
        b.into_sewing = Number(e.target.value) || 0;
      }
      if (e.target.classList.contains("field-wip-sewing")) b.wip_sewing = Number(e.target.value) || 0;
      if (e.target.classList.contains("field-wip-qc")) b.wip_qc = Number(e.target.value) || 0;
      if (e.target.classList.contains("field-wip-pairing")) b.wip_pairing = Number(e.target.value) || 0;
      if (e.target.classList.contains("field-wip-packing")) b.wip_packing = Number(e.target.value) || 0;
      if (e.target.classList.contains("field-wip-warehouse")) b.wip_warehouse = Number(e.target.value) || 0;
      if (e.target.classList.contains("field-daily-out")) {
        b.daily_out = Number(e.target.value) || 0;
      }
      if (e.target.classList.contains("field-daily-finished")) {
        const val = Number(e.target.value) || 0;
        appState.report.batches.forEach((bItem, bI) => {
          bItem.daily_finished = (bI == idx) ? val : 0;
        });
      }

      if (e.target.classList.contains("field-note-sewing")) b.note_sewing = e.target.value;
      if (e.target.classList.contains("field-note-qc")) b.note_qc = e.target.value;
      if (e.target.classList.contains("field-note-pairing")) b.note_pairing = e.target.value;
      if (e.target.classList.contains("field-note-packing")) b.note_packing = e.target.value;
      if (e.target.classList.contains("field-note-warehouse")) b.note_warehouse = e.target.value;

      if (e.target.classList.contains("field-shortage-matxac")) {
        b.shortage_mat_xac = Number(e.target.value) || 0;
      }
      if (e.target.classList.contains("field-shortage-hangphe")) {
        b.shortage_hang_phe = Number(e.target.value) || 0;
      }
      if (e.target.classList.contains("field-shortage-khac")) {
        b.shortage_khac = Number(e.target.value) || 0;
      }
      if (e.target.classList.contains("field-shortage-note")) {
        b.shortage_note = e.target.value;
      }

      // Sync identical fields between desktop and mobile views
      const fieldClass = Array.from(e.target.classList).find(c => c.startsWith("field-"));
      if (fieldClass) {
        document.querySelectorAll(`.${fieldClass}[data-batch="${idx}"], .${fieldClass}[data-idx="${idx}"]`).forEach(other => {
          if (other !== e.target && other.value !== e.target.value) {
            other.value = e.target.value;
          }
        });
      }

      recalculateAllInPlace();

      // 1. Lưu ngay tức thì vào LocalStorage của điện thoại (chỉ tốn 0.1ms) để không bao giờ bị mất/tuột dữ liệu khi đóng/chuyển app
      if (appState.currentPO && appState.report) {
        appState.report.po_id = appState.currentPO.id;
        appState.report.report_date = appState.currentDate;
        saveLocalReportCache(appState.currentPO.id, appState.currentDate, appState.report);
      }

      // 2. Tự động đồng bộ ngầm lên máy chủ sau 600ms không cần chờ người dùng bấm ra ngoài
      clearTimeout(window._autoSaveDebounceTimer);
      window._autoSaveDebounceTimer = setTimeout(() => {
        if (appState.currentPO && appState.report) {
          saveReport(appState.report.status || "DRAFT", true);
        }
      }, 600);
    });

    input.addEventListener("dblclick", (e) => {
      if (e.target.readOnly) return;
      if (e.target.type === "number") {
        showNumpad(e.target);
      }
    });

    input.addEventListener("change", async (e) => {
      if (appState.hasUnsavedChanges) {
        await saveReport(appState.report.status || "DRAFT", true);
        if (e.target.classList.contains("field-daily-finished")) {
          showToast(`💾 Đã lưu thành phẩm hôm nay: ${(Number(e.target.value) || 0).toLocaleString("vi-VN")} đôi!`);
        }
      }
    });

    input.addEventListener("blur", async (e) => {
      if (appState.hasUnsavedChanges) {
        await saveReport(appState.report.status || "DRAFT", true);
        if (e.target.classList.contains("field-daily-finished")) {
          showToast(`💾 Đã lưu thành phẩm hôm nay: ${(Number(e.target.value) || 0).toLocaleString("vi-VN")} đôi!`);
        }
      }
    });
  });

  // Date Badge picker trigger
  document.querySelectorAll(".h1-date-badge").forEach(badge => {
    badge.addEventListener("click", (e) => {
      const input = badge.querySelector(".h1-date-hidden-input");
      if (input && e.target !== input) {
        if (typeof input.showPicker === "function") {
          try { input.showPicker(); } catch (err) { input.focus(); }
        } else {
          input.focus();
        }
      }
    });
  });

  document.querySelectorAll(".h1-date-hidden-input").forEach(input => {
    input.addEventListener("change", async (e) => {
      if (e.target.value) {
        appState.currentDate = e.target.value;
        const topDate = document.getElementById("reportDate");
        if (topDate) topDate.value = e.target.value;
        const mobDate = document.getElementById("reportDateMobile");
        if (mobDate) mobDate.value = e.target.value;
        await loadReport();
        refreshReleaseBar();
      }
    });
  });
}

// 4-DIRECTION ARROW KEY NAVIGATION & ENTER CONFIRMATION (TAB 1 & TAB 2)
function handleGlobalKeyNavigation(e) {
  const active = document.activeElement;
  if (!active) return;

  // TAB 1 NAVIGATION (EXCEL KIỂM KÊ)
  if (active.classList.contains("grid-nav-input")) {
    const batchIdx = parseInt(active.dataset.batch, 10);
    if (isNaN(batchIdx)) return;

    if (e.key === "Enter") {
      e.preventDefault();
      // Auto-save on Enter
      saveReport(appState.report.status || "DRAFT", true).then(() => {
        if (active.classList.contains("field-daily-finished")) {
          showToast(`💾 Đã lưu thành phẩm hôm nay: ${(Number(active.value) || 0).toLocaleString("vi-VN")} đôi!`);
        } else {
          const b = appState.report && appState.report.batches && appState.report.batches[batchIdx];
          showToast(`💾 Đã lưu số liệu ${b ? b.batch_name : ''} ngày ${formatDateDisplay(appState.currentDate)}!`);
        }
      });

      active.blur();
      // Move to next input cell if not TP
      if (!active.classList.contains("field-daily-finished")) {
        advanceToNextInput(active);
      }
      return;
    }

    const allInputs = Array.from(document.querySelectorAll(".excel-batches-container .grid-nav-input:not([disabled])"));
    const currentIndex = allInputs.indexOf(active);
    if (currentIndex === -1) return;

    if (e.key === "ArrowRight") {
      if (active.selectionStart === active.value.length || active.type === "number" || active.type === "select-one") {
        e.preventDefault();
        if (currentIndex < allInputs.length - 1) {
          focusAndSelect(allInputs[currentIndex + 1]);
        }
      }
    } else if (e.key === "ArrowLeft") {
      if (active.selectionStart === 0 || active.type === "number" || active.type === "select-one") {
        e.preventDefault();
        if (currentIndex > 0) {
          focusAndSelect(allInputs[currentIndex - 1]);
        }
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateVertical(active, 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateVertical(active, -1);
    }
    return;
  }

  // TAB 2 NAVIGATION (DEPARTMENT LOGS)
  if (active.classList.contains("dept-nav-input")) {
    const bIdx = parseInt(active.dataset.batchIdx, 10);
    const rIdx = parseInt(active.dataset.rowIdx, 10);
    const cIdx = parseInt(active.dataset.colIdx, 10);
    if (isNaN(bIdx)) return;

    if (e.key === "Enter") {
      e.preventDefault();
      saveDeptLogs(true);
      showToast("💾 Đã lưu sản lượng các bộ phận!");
      navigateDeptCell(bIdx, rIdx + 1, cIdx);
      return;
    }

    if (e.key === "ArrowRight") {
      if (active.selectionStart === active.value.length || active.type === "number") {
        e.preventDefault();
        navigateDeptCell(bIdx, rIdx, cIdx + 1);
      }
    } else if (e.key === "ArrowLeft") {
      if (active.selectionStart === 0 || active.type === "number") {
        e.preventDefault();
        navigateDeptCell(bIdx, rIdx, cIdx - 1);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateDeptCell(bIdx, rIdx + 1, cIdx);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateDeptCell(bIdx, rIdx - 1, cIdx);
    }
  }
}

function focusAndSelect(input) {
  if (!input) return;
  input.focus();
  if (input.select && input.type !== "select-one") input.select();
}

function advanceToNextInput(currentInput) {
  const allInputs = Array.from(document.querySelectorAll(".excel-batches-container .grid-nav-input:not([disabled])"));
  const currentIndex = allInputs.indexOf(currentInput);
  if (currentIndex >= 0 && currentIndex < allInputs.length - 1) {
    focusAndSelect(allInputs[currentIndex + 1]);
  }
}

function navigateVertical(activeInput, direction) {
  const allInputs = Array.from(document.querySelectorAll(".excel-batches-container .grid-nav-input:not([disabled])"));
  const activeRect = activeInput.getBoundingClientRect();
  const activeCenterX = activeRect.left + activeRect.width / 2;
  const activeCenterY = activeRect.top + activeRect.height / 2;

  let bestInput = null;
  let minDistance = Infinity;

  allInputs.forEach(input => {
    if (input === activeInput) return;
    const rect = input.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    const centerX = rect.left + rect.width / 2;

    const dy = centerY - activeCenterY;
    if (direction > 0 && dy > 8) { // Below
      const dx = Math.abs(centerX - activeCenterX);
      const dist = dy * 2 + dx;
      if (dist < minDistance) {
        minDistance = dist;
        bestInput = input;
      }
    } else if (direction < 0 && dy < -8) { // Above
      const dx = Math.abs(centerX - activeCenterX);
      const dist = Math.abs(dy) * 2 + dx;
      if (dist < minDistance) {
        minDistance = dist;
        bestInput = input;
      }
    }
  });

  if (bestInput) {
    focusAndSelect(bestInput);
  } else {
    const currentIndex = allInputs.indexOf(activeInput);
    if (direction > 0 && currentIndex < allInputs.length - 1) {
      focusAndSelect(allInputs[currentIndex + 1]);
    } else if (direction < 0 && currentIndex > 0) {
      focusAndSelect(allInputs[currentIndex - 1]);
    }
  }
}

function navigateDeptCell(bIdx, rIdx, cIdx) {
  let target = document.querySelector(`.dept-nav-input[data-batch-idx="${bIdx}"][data-row-idx="${rIdx}"][data-col-idx="${cIdx}"]`);
  if (!target) {
    if (rIdx < 0 && bIdx > 0) {
      const prevRows = document.querySelectorAll(`.dept-batch-block[data-batch-idx="${bIdx - 1}"] tbody tr`);
      if (prevRows.length > 0) {
        target = document.querySelector(`.dept-nav-input[data-batch-idx="${bIdx - 1}"][data-row-idx="${prevRows.length - 1}"][data-col-idx="${cIdx}"]`);
      }
    } else if (rIdx >= 0) {
      target = document.querySelector(`.dept-nav-input[data-batch-idx="${bIdx + 1}"][data-row-idx="0"][data-col-idx="${cIdx}"]`);
    }
  }
  if (target) {
    target.focus();
    if (target.select) target.select();
  }
}

// EXCEL CLIPBOARD PASTE SUPPORT (COPY MULTIPLE CELLS FROM EXCEL)
function handleExcelPaste(e) {
  const active = document.activeElement;
  if (!active) return;

  const clipboardData = e.clipboardData || window.clipboardData;
  const pastedData = clipboardData.getData('Text');
  if (!pastedData || (!pastedData.includes('\t') && !pastedData.includes('\n'))) return;

  // TAB 1 PASTE
  if (active.classList.contains("grid-nav-input")) {
    e.preventDefault();
    const startBatch = parseInt(active.dataset.batch, 10);
    const startRow = parseInt(active.dataset.row, 10);
    const startCol = parseInt(active.dataset.col, 10);
    const rows = pastedData.trim().split(/\r\n|\n|\r/);

    rows.forEach((rText, rOffset) => {
      const cols = rText.split('\t');
      cols.forEach((cText, cOffset) => {
        const target = document.querySelector(`.grid-nav-input[data-batch="${startBatch}"][data-row="${startRow + rOffset}"][data-col="${startCol + cOffset}"]`);
        if (target) {
          target.value = cText.trim();
          target.dispatchEvent(new Event('input'));
        }
      });
    });
    recalculateAllInPlace();
    showToast("📋 Đã dán dữ liệu từ Excel thành công!");
    return;
  }

  // TAB 2 PASTE
  if (active.classList.contains("dept-nav-input")) {
    e.preventDefault();
    const startBIdx = parseInt(active.dataset.batchIdx, 10);
    const startRIdx = parseInt(active.dataset.rowIdx, 10);
    const startCIdx = parseInt(active.dataset.colIdx, 10);
    const rows = pastedData.trim().split(/\r\n|\n|\r/);

    const block = document.querySelector(`.dept-batch-block[data-batch-idx="${startBIdx}"]`);
    const bName = block ? block.dataset.batchName : `Lô ${startBIdx + 1}`;
    if (!appState.deptLogs[bName]) appState.deptLogs[bName] = [];

    // Auto-create additional rows if needed
    const requiredRows = startRIdx + rows.length;
    const currentRows = appState.deptLogs[bName].length;
    if (requiredRows > currentRows) {
      const tbody = document.getElementById(`deptTbody_${startBIdx}`);
      for (let i = currentRows; i < requiredRows; i++) {
        appState.deptLogs[bName].push({ date: "", ton_dau: "", nhap: "", xuat: "", ton_cuoi: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" });
        if (tbody) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><input type="text" class="dept-nav-input txt-date" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="1" data-field="date" value="" placeholder="DD-MMM"></td>
            <td><input type="number" class="dept-nav-input dept-cell-ton-dau" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="2" data-field="ton_dau" value="" placeholder="0"></td>
            <td><input type="number" class="dept-nav-input dept-cell-nhap font-bold text-sky-800" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="3" data-field="nhap" value="" placeholder="0"></td>
            <td><input type="number" class="dept-nav-input dept-cell-xuat font-bold text-emerald-800" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="4" data-field="xuat" value="" placeholder="0"></td>
            <td><input type="number" class="dept-nav-input dept-cell-ton-cuoi font-bold text-amber-800" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="5" data-field="ton_cuoi" value="" placeholder="0"></td>
            <td><input type="number" class="dept-nav-input dept-cell-nhap-phoi" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="6" data-field="nhap_phoi" value="" placeholder="0"></td>
            <td><input type="number" class="dept-nav-input dept-cell-giao-dg" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="7" data-field="giao_dg" value="" placeholder="0"></td>
            <td><input type="number" class="dept-nav-input dept-cell-nhap-kho" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="8" data-field="nhap_kho" value="" placeholder="0"></td>
            <td><input type="number" class="dept-nav-input dept-cell-xuat-kho font-bold text-emerald-700" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="9" data-field="xuat_kho" value="" placeholder="0"></td>
            <td></td>
          `;
          tbody.appendChild(tr);
        }
      }
      bindDeptTableInputs();
    }

    const fieldMap = { 1: "date", 2: "ton_dau", 3: "nhap", 4: "xuat", 5: "ton_cuoi", 6: "nhap_phoi", 7: "giao_dg", 8: "nhap_kho", 9: "xuat_kho" };

    rows.forEach((rText, rOffset) => {
      const targetRIdx = startRIdx + rOffset;
      const cols = rText.split('\t');
      cols.forEach((cText, cOffset) => {
        const targetCIdx = startCIdx + cOffset;
        const target = document.querySelector(`.dept-nav-input[data-batch-idx="${startBIdx}"][data-row-idx="${targetRIdx}"][data-col-idx="${targetCIdx}"]`);
        const field = fieldMap[targetCIdx];
        const val = cText.trim();
        if (target) {
          target.value = val;
        }
        if (field && appState.deptLogs[bName] && appState.deptLogs[bName][targetRIdx]) {
          appState.deptLogs[bName][targetRIdx][field] = val;
        }
      });
    });

    recalculateDeptSummary();
    saveDeptLogs(true);
    showToast("📋 Đã dán dữ liệu sản lượng từ Excel và lưu thành công!");
  }
}

// HANDLE ADD BATCH
function handleAddBatch() {
  const currentCount = appState.report.batches.length;
  const newBatchName = `Lô ${currentCount + 1}`;
  
  const poPlan = appState.currentPO ? appState.currentPO.po_plan : 0;
  const totalReceived = appState.report.batches.reduce((sum, b) => sum + (Number(b.into_sewing) || 0), 0);
  const remainingDebt = Math.max(0, poPlan - totalReceived);

  const batchQty = remainingDebt > 0 ? remainingDebt : 500;

  const newBatch = {
    id: "b-" + Date.now(),
    batch_name: newBatchName,
    batch_plan: batchQty,
    into_sewing: batchQty,
    delivered: 0,
    wip_sewing: 0,
    wip_qc: 0,
    wip_pairing: 0,
    wip_packing: 0,
    wip_warehouse: 0,
    daily_out: 0,
    note_sewing: "",
    note_qc: "",
    note_pairing: "",
    note_packing: "",
    note_warehouse: "",
    shortage_reason_type: "",
    shortage_note: ""
  };

  appState.report.batches.push(newBatch);
  renderReportUI();
}

// ========================================================
// VÉT HÀNG CHUẨN BỊ NỢ VÀO LÔ SỐ ĐUÔI RIÊNG BIỆT
// ========================================================
function openSweepTailModal() {
  const modal = document.getElementById("modalSweepTailBatch");
  if (!modal) return;

  const poPlan = appState.currentPO ? Number(appState.currentPO.po_plan || 0) : 0;
  const batches = (appState.report && appState.report.batches) ? appState.report.batches : [];
  const totalReceived = batches.reduce((sum, b) => {
    const cumIn = Number(appState.cumImportsByBatch && appState.cumImportsByBatch[b.batch_name]) || 0;
    const todayIn = Number(b.into_sewing) || 0;
    return sum + (cumIn + todayIn);
  }, 0);
  const prepDebt = Math.max(0, poPlan - totalReceived);

  if (prepDebt <= 0) {
    showToast("ℹ️ Chuẩn Bị đã giao đủ kế hoạch đơn hàng, không còn nợ phôi để vét!");
    return;
  }

  // Cập nhật số nợ hiển thị trong modal
  const elDebtDisplay = document.getElementById("sweepModalDebtDisplay");
  if (elDebtDisplay) elDebtDisplay.innerText = prepDebt.toLocaleString("vi-VN") + " đôi";

  // Điền số lượng mặc định bằng số nợ lý thuyết
  const elQty = document.getElementById("numSweepQty");
  if (elQty) {
    elQty.value = prepDebt;
    elQty.max = prepDebt + 1000;
  }

  // Ngày nhận hàng mặc định là ngày báo cáo hiện hành
  const elDate = document.getElementById("txtSweepDate");
  if (elDate) elDate.value = appState.currentDate || getLocalDateString();

  // Đặt tên Lô thông minh nếu đã có Lô Số Đuôi
  const existingNames = batches.map(b => (b.batch_name || "").toLowerCase().trim());
  let defaultName = "Lô Số Đuôi";
  if (existingNames.includes("lô số đuôi") || existingNames.includes("số đuôi")) {
    let suffix = 2;
    while (existingNames.includes(`lô số đuôi ${suffix}`) || existingNames.includes(`số đuôi ${suffix}`)) {
      suffix++;
    }
    defaultName = `Lô Số Đuôi ${suffix}`;
  }
  const elName = document.getElementById("txtSweepBatchName");
  if (elName) elName.value = defaultName;

  modal.classList.add("show");
}

function closeSweepTailModal() {
  const modal = document.getElementById("modalSweepTailBatch");
  if (modal) modal.classList.remove("show");
}

async function handleConfirmSweepTailBatch() {
  const nameInput = document.getElementById("txtSweepBatchName");
  const qtyInput = document.getElementById("numSweepQty");
  const dateInput = document.getElementById("txtSweepDate");
  const noteInput = document.getElementById("txtSweepNote");

  const batchName = (nameInput?.value || "").trim();
  const sweepQty = parseInt(qtyInput?.value, 10);
  const sweepDate = dateInput?.value || appState.currentDate;
  const sweepNote = (noteInput?.value || "").trim();

  if (!batchName) {
    alert("❌ Vui lòng nhập tên Lô riêng mới (ví dụ: Lô Số Đuôi).");
    return;
  }
  if (isNaN(sweepQty) || sweepQty <= 0) {
    alert("❌ Vui lòng nhập số lượng nhận vào chuyền hợp lệ (> 0).");
    return;
  }

  if (!appState.report) {
    appState.report = {
      po_id: appState.currentPO ? appState.currentPO.id : "",
      report_date: appState.currentDate,
      status: "DRAFT",
      batches: []
    };
  }
  if (!appState.report.batches) {
    appState.report.batches = [];
  }

  // 1. Kiểm tra Lô đã tồn tại trong báo cáo ngày này chưa
  let targetBatch = appState.report.batches.find(b => b.batch_name.toLowerCase() === batchName.toLowerCase());

  if (targetBatch) {
    targetBatch.into_sewing = Number(targetBatch.into_sewing || 0) + sweepQty;
    targetBatch.batch_plan = Number(targetBatch.batch_plan || 0) + sweepQty;
    if (sweepNote) {
      targetBatch.shortage_note = targetBatch.shortage_note ? `${targetBatch.shortage_note}; ${sweepNote}` : sweepNote;
    }
  } else {
    // 2. Khởi tạo Lô riêng biệt hoàn toàn mới (Đầy đủ 5 trạm WIP như Lô 1 & Lô 2)
    targetBatch = {
      id: "b-tail-" + Date.now(),
      batch_name: batchName,
      batch_plan: sweepQty,
      into_sewing: sweepQty,
      delivered: 0,
      wip_sewing: 0,
      wip_qc: 0,
      wip_pairing: 0,
      wip_packing: 0,
      wip_warehouse: 0,
      daily_out: 0,
      note_sewing: "",
      note_qc: "",
      note_pairing: "",
      note_packing: "",
      note_warehouse: "",
      shortage_reason_type: "",
      shortage_note: sweepNote || "Chuẩn bị bàn giao vét đuôi đợt cuối"
    };
    appState.report.batches.push(targetBatch);
  }

  // 3. Đăng ký Lô riêng này vào danh sách default_batches của PO để lưu bền vững
  if (appState.currentPO) {
    appState.currentPO.tail_sweep_date = sweepDate;
    appState.currentPO.tail_batch_name = batchName;

    if (!appState.currentPO.default_batches) {
      appState.currentPO.default_batches = [];
    }
    const poBatch = appState.currentPO.default_batches.find(b => b.batch_name.toLowerCase() === batchName.toLowerCase());
    if (poBatch) {
      poBatch.batch_plan = (Number(poBatch.batch_plan) || 0) + sweepQty;
      poBatch.into_sewing = (Number(poBatch.into_sewing) || 0) + sweepQty;
      poBatch.is_tail_batch = true;
      poBatch.sweep_date = sweepDate;
    } else {
      appState.currentPO.default_batches.push({
        id: targetBatch.id,
        batch_name: batchName,
        batch_plan: sweepQty,
        into_sewing: sweepQty,
        is_tail_batch: true,
        sweep_date: sweepDate
      });
    }

    // Persist updated PO to backend & local cache
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appState.currentPO)
      });
      const oIdx = (appState.orders || []).findIndex(o => o.id === appState.currentPO.id);
      if (oIdx >= 0) {
        appState.orders[oIdx] = { ...appState.currentPO };
      }
      localStorage.setItem("dd_orders_cache", JSON.stringify(appState.orders || []));
    } catch (e) {
      console.warn("Error persisting PO tail sweep date:", e);
    }
  }

  // Ensure current viewed date is aligned with sweep date if created on sweep date
  if (appState.currentDate !== sweepDate) {
    appState.currentDate = sweepDate;
    const dateInputEl = document.getElementById("reportDate");
    if (dateInputEl) dateInputEl.value = sweepDate;
  }

  // 4. Khởi tạo Bảng theo dõi dòng chảy sản lượng riêng cho Lô này tại Tab 2
  if (!appState.deptLogs) {
    appState.deptLogs = {};
  }
  if (!appState.deptLogs[batchName]) {
    const d = new Date(sweepDate || appState.currentDate);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const dateShort = `${day}/${month}`;
    appState.deptLogs[batchName] = [
      { date: dateShort, nhap_phoi: sweepQty, giao_dg: "", nhap_kho: "", xuat_kho: "" },
      { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
    ];
  } else {
    const rows = appState.deptLogs[batchName];
    if (rows.length > 0 && (!rows[0].nhap_phoi || rows[0].nhap_phoi === 0)) {
      rows[0].nhap_phoi = sweepQty;
    }
  }

  // 5. Cập nhật giao diện tức thì và lưu xuống cơ sở dữ liệu
  appState.hasUnsavedChanges = true;
  closeSweepTailModal();
  recalculateAllInPlace();
  renderReportUI();
  renderDeptLogsUI();

  try {
    await saveReport(appState.report.status || "DRAFT", true);
    if (typeof saveDeptLogs === "function") {
      await saveDeptLogs(true);
    }
  } catch (err) {
    console.warn("Auto-save tail batch error:", err);
  }

  showToast(`⚡ Đã tạo thành công '${batchName}' (${sweepQty.toLocaleString("vi-VN")} đôi) hiển thị song song cùng các lô từ ngày ${formatDateDisplay(sweepDate)}!`);
}

// TAB 4: CUSTOMER & PO MANAGEMENT FUNCTIONS (MASTER-DETAIL INTERACTIVE)
function renderManageTab() {
  // 1. Calculate & Render Statistics Banner
  const totalCust = appState.customers.length;
  const totalPO = appState.orders.length;
  const totalPlan = appState.orders.reduce((sum, o) => sum + (Number(o.po_plan) || 0), 0);

  const elStatCust = document.getElementById("statTotalCust");
  if (elStatCust) elStatCust.innerText = totalCust;

  const elStatPO = document.getElementById("statTotalPO");
  if (elStatPO) elStatPO.innerText = totalPO;

  const elStatPlan = document.getElementById("statTotalPlan");
  if (elStatPlan) elStatPlan.innerText = totalPlan.toLocaleString("vi-VN") + " đôi";

  const elStatBatches = document.getElementById("statTotalBatches");
  if (elStatBatches) {
    const totalBatches = appState.orders.reduce((sum, o) => sum + (o.default_batches ? o.default_batches.length : 0), 0);
    elStatBatches.innerText = totalBatches + " Lô";
  }

  // 2. Populate Customer select dropdown in PO form
  const poCustSel = document.getElementById("poCustomerSelect");
  if (poCustSel) {
    poCustSel.innerHTML = appState.customers.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join("");
    
    // Ensure selected customer is valid
    if (!appState.currentCustomer || !appState.customers.some(c => c.id === appState.currentCustomer)) {
      if (appState.customers.length > 0) {
        appState.currentCustomer = appState.customers[0].id;
      } else {
        appState.currentCustomer = null;
      }
    }
    if (appState.currentCustomer) {
      poCustSel.value = appState.currentCustomer;
    }
  }

  // 3. Render Master Customer Table (Left)
  renderCustomerTable();

  // 4. Render Detail Orders Table (Right) for currently selected customer
  renderOrdersTable(appState.currentCustomer);

  // 5. Ensure batch configuration boxes are initialized in PO form
  initPOBatchInputs();

  // 6. Khung dãy size + xem trước bảng trên điện thoại
  renderSizeEditor();
}

// 1. RENDER MASTER CUSTOMER TABLE
function renderCustomerTable() {
  const tbodyCust = document.getElementById("tbodyCustomers");
  const hdrCount = document.getElementById("statCustHeaderCount");
  if (hdrCount) hdrCount.innerText = `${appState.customers.length} công ty`;

  if (!tbodyCust) return;

  if (appState.customers.length === 0) {
    tbodyCust.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">Chưa có khách hàng nào. Nhập tên và mã khách hàng ở biểu mẫu trên để bắt đầu.</td></tr>`;
    return;
  }

  tbodyCust.innerHTML = appState.customers.map(c => {
    const isSelected = (c.id === appState.currentCustomer);
    const custPOCount = appState.orders.filter(o => o.customer_id === c.id).length;

    return `
      <tr class="customer-row-item ${isSelected ? 'selected-cust-row' : ''}" data-id="${c.id}" title="Chọn để xem danh sách PO của ${c.name}">
        <td><strong class="mono-code">${c.code}</strong></td>
        <td><strong>${c.name}</strong></td>
        <td>${sizeBriefHtml(getCustomerSizes(c))}</td>
        <td><span class="badge-po-count">${custPOCount} PO</span></td>
        <td style="text-align:center; white-space: nowrap;">
          <button type="button" class="btn-action-icon btn-action-edit btn-edit-cust" data-id="${c.id}" data-name="${c.name}" data-code="${c.code}" title="Sửa thông tin khách hàng">Sửa</button>
          <button type="button" class="btn-action-icon btn-action-danger btn-delete-cust" data-id="${c.id}" data-name="${c.name}" data-code="${c.code}" title="Xóa khách hàng">Xóa</button>
        </td>
      </tr>
    `;
  }).join("");

  // Bind click event on customer rows to switch PO list on the right
  tbodyCust.querySelectorAll(".customer-row-item").forEach(row => {
    row.addEventListener("click", (e) => {
      if (e.target.closest(".btn-action-icon")) return;
      const custId = row.dataset.id;
      selectCustomerInManageTab(custId);
      fillCustomerForm(custId);
    });
  });

  // Bind Edit Customer Button
  tbodyCust.querySelectorAll(".btn-edit-cust").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      fillCustomerForm(btn.dataset.id);

      const elName = document.getElementById("custName");
      if (elName) {
        elName.focus();
        elName.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });

  // Bind Delete Customer Button
  tbodyCust.querySelectorAll(".btn-delete-cust").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const code = btn.dataset.code;

      if (confirm(`Xóa khách hàng "${name}" (${code}) cùng toàn bộ đơn hàng PO liên quan?`)) {
        try {
          const res = await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            showToast(`Đã xóa khách hàng "${name}"`);
            fetchMetadata();
          } else {
            alert("Không thể xóa khách hàng: " + (data.error || "Vui lòng thử lại"));
          }
        } catch (err) {
          alert("Không thể xóa khách hàng: " + err.message);
        }
      }
    });
  });
}

// 2. SELECT CUSTOMER IN TAB 3 (SYNC SELECTION, HIGHLIGHT & ORDERS TABLE)
function selectCustomerInManageTab(custId) {
  appState.currentCustomer = custId;

  document.querySelectorAll("#tbodyCustomers .customer-row-item").forEach(r => {
    if (r.dataset.id === custId) {
      r.classList.add("selected-cust-row");
    } else {
      r.classList.remove("selected-cust-row");
    }
  });

  const poCustSel = document.getElementById("poCustomerSelect");
  if (poCustSel) poCustSel.value = custId;

  const topCustSel = document.getElementById("selectCustomer");
  if (topCustSel) {
    topCustSel.value = custId;
    filterOrdersByCustomer();
  }

  renderOrdersTable(custId);
  renderSizePreview();
}

// 3. RENDER DETAIL ORDERS TABLE FOR SELECTED CUSTOMER
function renderOrdersTable(customerId) {
  const tbodyOrders = document.getElementById("tbodyOrders");
  const lblCustTitle = document.getElementById("lblSelectedCustTitle");
  const badgePoCount = document.getElementById("badgeSelectedCustPoCount");

  const cust = appState.customers.find(c => c.id === customerId);
  const custNameDisplay = cust ? `${cust.name} (${cust.code})` : "Tất cả";
  
  if (lblCustTitle) lblCustTitle.innerText = custNameDisplay;
  const lblPoListCust = document.getElementById("lblPoListCustTitle");
  if (lblPoListCust) lblPoListCust.innerText = custNameDisplay;

  const filteredOrders = customerId 
    ? appState.orders.filter(o => o.customer_id === customerId)
    : appState.orders;

  if (badgePoCount) badgePoCount.innerText = `${filteredOrders.length} PO`;

  if (!tbodyOrders) return;

  if (filteredOrders.length === 0) {
    tbodyOrders.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 24px; color: #64748b;">
          Khách hàng <strong>${cust ? cust.name : ''}</strong> chưa có đơn hàng PO nào.Điền thông tin ở biểu mẫu phía trên để tạo PO mới.
        </td>
      </tr>
    `;
    return;
  }

  tbodyOrders.innerHTML = filteredOrders.map(o => {
    const batchTags = (o.default_batches || []).map(b => {
      const qty = Number(b.into_sewing || b.batch_plan) || 0;
      return `<span class="batch-tag-badge">${b.batch_name}: ${qty.toLocaleString('vi-VN')}</span>`;
    }).join(" ");

    return `
      <tr>
        <td><strong class="mono-code">${o.po_number}</strong></td>
        <td><strong>${o.style_code}</strong></td>
        <td>${o.line_name}</td>
        <td><strong class="mono-num text-emerald-700">${(Number(o.po_plan) || 0).toLocaleString('vi-VN')} đôi</strong></td>
        <td style="text-align:left;">${batchTags || '<span style="color:#94a3b8;">Chưa cấu hình lô</span>'}</td>
        <td style="text-align:center; white-space: nowrap;">
          <button type="button" class="btn-action-icon btn-action-edit btn-edit-po" data-id="${o.id}" title="Sửa đơn hàng & cấu hình lô">Sửa</button>
          <button type="button" class="btn-action-icon btn-action-danger btn-delete-po" data-id="${o.id}" data-ponum="${o.po_number}" title="Xóa đơn hàng PO">Xóa</button>
        </td>
      </tr>
    `;
  }).join("");

  // Bind Edit PO Button
  tbodyOrders.querySelectorAll(".btn-edit-po").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const orderId = btn.dataset.id;
      const order = appState.orders.find(o => o.id === orderId);
      if (!order) return;

      const elOrderId = document.getElementById("editOrderId");
      if (elOrderId) elOrderId.value = order.id;

      const elCustSel = document.getElementById("poCustomerSelect");
      if (elCustSel) elCustSel.value = order.customer_id;

      const elPoNum = document.getElementById("poNumber");
      if (elPoNum) elPoNum.value = order.po_number;

      const elStyle = document.getElementById("poStyleCode");
      if (elStyle) elStyle.value = order.style_code;

      const elLine = document.getElementById("poLineName");
      if (elLine) elLine.value = order.line_name;

      const elPlan = document.getElementById("poPlanTotal");
      if (elPlan) elPlan.value = order.po_plan;

      const batches = order.default_batches || [];
      const regularBatches = batches.filter(b => !b.batch_name.toLowerCase().includes("đuôi"));
      let batchCount = regularBatches.length;
      if (batchCount === 0 && batches.length > 0) batchCount = Math.max(1, batches.length - 1);
      if (batchCount < 1) batchCount = 2;

      const selCount = document.getElementById("selectBatchCount") || document.getElementById("poBatchCountSelect");
      if (selCount) selCount.value = String(Math.min(batchCount, 10));

      renderBatchInputBoxes(batchCount, batches);

      const btnSubmitPO = document.getElementById("btnSubmitPO");
      if (btnSubmitPO) btnSubmitPO.innerText = "Cập nhật đơn hàng & cấu hình lô";

      const btnCancelPO = document.getElementById("btnCancelEditPO");
      if (btnCancelPO) btnCancelPO.style.display = "inline-flex";

      const formPO = document.getElementById("formAddPO");
      if (formPO) formPO.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  // Bind Delete PO Button
  tbodyOrders.querySelectorAll(".btn-delete-po").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const poNum = btn.dataset.ponum || "";

      if (confirm(`Xóa đơn hàng PO "${poNum}" khỏi hệ thống?`)) {
        try {
          const res = await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            showToast(`Đã xóa PO "${poNum}"`);
            fetchMetadata();
          } else {
            alert("Không thể xóa PO: " + (data.error || "Vui lòng thử lại"));
          }
        } catch (err) {
          alert("Không thể xóa PO: " + err.message);
        }
      }
    });
  });
}

// INITIALIZE BATCH INPUTS IF EMPTY
function initPOBatchInputs() {
  const container = document.getElementById("dynamicBatchInputsContainer") || document.getElementById("batchInputGrid");
  if (container && container.children.length === 0) {
    const selCount = document.getElementById("selectBatchCount") || document.getElementById("poBatchCountSelect");
    const count = selCount ? parseInt(selCount.value, 10) || 2 : 2;
    renderBatchInputBoxes(count, []);
  }
}

// RENDER DYNAMIC BATCH INPUT BOXES (Lô 1..N + Số đuôi)
function renderBatchInputBoxes(count, initialBatches = null) {
  const container = document.getElementById("dynamicBatchInputsContainer") || document.getElementById("batchInputGrid");
  if (!container) return;

  const existingValues = {};
  if (!initialBatches) {
    container.querySelectorAll(".batch-card-item").forEach(card => {
      const bName = card.dataset.batchName;
      const input = card.querySelector(".batch-card-input");
      if (input && input.value !== "") {
        existingValues[bName] = input.value;
      }
    });
  }

  container.innerHTML = "";

  // 1. Regular Lô 1, Lô 2, ..., Lô N
  for (let i = 1; i <= count; i++) {
    const bName = `Lô ${i}`;
    let val = "";
    if (initialBatches && Array.isArray(initialBatches) && initialBatches.length > 0) {
      const found = initialBatches.find(b => b.batch_name === bName);
      if (found) val = found.into_sewing || found.batch_plan || "";
    } else if (existingValues[bName] !== undefined) {
      val = existingValues[bName];
    }

    const card = document.createElement("div");
    card.className = "batch-card-item";
    card.dataset.batchName = bName;
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span class="batch-card-badge">📦 ${bName}</span>
        <span style="font-size:11px; color:#64748b;">Định mức (đôi):</span>
      </div>
      <div class="batch-card-input-wrapper">
        <input type="number" class="batch-card-input" placeholder="0" value="${val}" min="0">
      </div>
    `;
    container.appendChild(card);
  }

  // 2. Khung Số Đuôi
  const tailName = "Số đuôi";
  let tailVal = "";
  if (initialBatches && Array.isArray(initialBatches) && initialBatches.length > 0) {
    const found = initialBatches.find(b => b.batch_name.toLowerCase().includes("đuôi") || b.batch_name === `Lô ${count + 1}`);
    if (found) tailVal = found.into_sewing || found.batch_plan || "";
  } else if (existingValues[tailName] !== undefined) {
    tailVal = existingValues[tailName];
  }

  const tailCard = document.createElement("div");
  tailCard.className = "batch-card-item is-tail";
  tailCard.dataset.batchName = tailName;
  tailCard.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span class="batch-card-badge">🏷️ ${tailName}</span>
      <span style="font-size:11px; color:#7c3aed;">Định mức (đôi):</span>
    </div>
    <div class="batch-card-input-wrapper">
      <input type="number" class="batch-card-input" placeholder="0" value="${tailVal}" min="0">
    </div>
  `;
  container.appendChild(tailCard);

  container.querySelectorAll(".batch-card-input").forEach(input => {
    input.addEventListener("input", updateBatchSummaryCheck);
  });

  updateBatchSummaryCheck();
}

function updateBatchSummaryCheck() {
  const container = document.getElementById("dynamicBatchInputsContainer") || document.getElementById("batchInputGrid");
  const inputs = container ? container.querySelectorAll(".batch-card-input") : [];
  let totalBatchQty = 0;
  inputs.forEach(inp => {
    totalBatchQty += Number(inp.value) || 0;
  });

  const poPlanInput = document.getElementById("poPlanTotal");
  let poPlan = Number(poPlanInput ? poPlanInput.value : 0) || 0;

  // Auto-populate poPlanTotal if empty and user has entered batch inputs
  if ((!poPlan || poPlan === 0) && totalBatchQty > 0 && poPlanInput && document.activeElement !== poPlanInput) {
    poPlanInput.value = totalBatchQty;
    poPlan = totalBatchQty;
  }

  const elSum = document.getElementById("lblCurrentSumBatches") || document.getElementById("batchSumDisplay");
  if (elSum) elSum.innerText = totalBatchQty.toLocaleString("vi-VN");

  const elPlan = document.getElementById("lblTargetPoPlan") || document.getElementById("batchPlanDisplay");
  if (elPlan) elPlan.innerText = poPlan.toLocaleString("vi-VN");

  const elStatus = document.getElementById("lblBatchSumStatus") || document.getElementById("batchDiffDisplay");
  if (elStatus) {
    const diff = totalBatchQty - poPlan;
    if (poPlan > 0 && diff === 0) {
      elStatus.className = "badge-checker-ok";
      elStatus.innerText = "Khớp kế hoạch";
    } else if (poPlan > 0 && diff > 0) {
      elStatus.className = "badge-checker-warn";
      elStatus.innerText = `Thừa ${diff.toLocaleString("vi-VN")} đôi`;
    } else if (poPlan > 0 && diff < 0) {
      elStatus.className = "badge-checker-warn";
      elStatus.innerText = `Thiếu ${Math.abs(diff).toLocaleString("vi-VN")} đôi`;
    } else {
      elStatus.className = "badge-checker-ok";
      elStatus.innerText = `Tổng: ${totalBatchQty.toLocaleString("vi-VN")} đôi`;
    }
  }
}

function resetCustomerForm() {
  const elId = document.getElementById("editCustId");
  if (elId) elId.value = "";
  const elName = document.getElementById("custName");
  if (elName) elName.value = "";
  const elCode = document.getElementById("custCode");
  if (elCode) elCode.value = "";
  const btnSub = document.getElementById("btnSubmitCust");
  if (btnSub) btnSub.innerText = "+ Thêm khách hàng";
  const btnCan = document.getElementById("btnCancelEditCust");
  if (btnCan) btnCan.style.display = "none";
  sizeEditor.list = [];
  setSizeError("");
  renderSizeEditor();
}

function resetPOForm() {
  const elId = document.getElementById("editOrderId");
  if (elId) elId.value = "";
  const elPo = document.getElementById("poNumber");
  if (elPo) elPo.value = "";
  const elSt = document.getElementById("poStyleCode");
  if (elSt) elSt.value = "";
  const elLine = document.getElementById("poLineName");
  if (elLine) elLine.value = "";
  const elPlan = document.getElementById("poPlanTotal");
  if (elPlan) elPlan.value = "";

  const selCount = document.getElementById("selectBatchCount") || document.getElementById("poBatchCountSelect");
  if (selCount) selCount.value = "2";

  renderBatchInputBoxes(2, []);

  const btnSub = document.getElementById("btnSubmitPO");
  if (btnSub) btnSub.innerText = "💾 Lưu đơn hàng & cấu hình lô";
  const btnCan = document.getElementById("btnCancelEditPO");
  if (btnCan) btnCan.style.display = "none";
}

async function handleAddCustomer(e) {
  if (e && e.preventDefault) e.preventDefault();
  const id = document.getElementById("editCustId")?.value;
  const nameEl = document.getElementById("custName");
  const name = nameEl ? nameEl.value.trim() : "";
  const codeEl = document.getElementById("custCode");
  const code = codeEl ? codeEl.value.trim() : "";

  if (!name) {
    showToast("⚠️ Vui lòng nhập Tên khách hàng / công ty!");
    if (nameEl) {
      highlightField(nameEl);
      safeScrollIntoView(nameEl);
    }
    return;
  }
  if (!code) {
    showToast("⚠️ Vui lòng nhập Mã viết tắt của khách hàng!");
    if (codeEl) {
      highlightField(codeEl);
      safeScrollIntoView(codeEl);
    }
    return;
  }

  try {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id || undefined, name, code, size_list: sizeEditor.list })
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? "✅ Đã cập nhật khách hàng thành công!" : "✅ Đã thêm khách hàng mới thành công!");
      resetCustomerForm();
      await fetchMetadata();
      if (id) fillCustomerForm(id);
    } else {
      alert("Không thể lưu khách hàng: " + (data.error || "Vui lòng thử lại"));
    }
  } catch (err) {
    alert("Lỗi khi lưu khách hàng: " + err.message);
  }
}

async function handleAddPO(e) {
  if (e && e.preventDefault) e.preventDefault();
  const id = document.getElementById("editOrderId")?.value;
  const custSel = document.getElementById("poCustomerSelect");
  const customer_id = custSel ? custSel.value : "";
  const poNumEl = document.getElementById("poNumber");
  const po_number = poNumEl ? poNumEl.value.trim() : "";
  let styleEl = document.getElementById("poStyleCode");
  let style_code = styleEl ? styleEl.value.trim() : "";
  let lineEl = document.getElementById("poLineName");
  let line_name = lineEl ? lineEl.value.trim() : "";
  const poPlanEl = document.getElementById("poPlanTotal");
  let po_plan = Number(poPlanEl ? poPlanEl.value : 0) || 0;

  // 1. Validate Customer
  if (!customer_id) {
    showToast("⚠️ Vui lòng chọn khách hàng!");
    if (custSel) {
      highlightField(custSel);
      safeScrollIntoView(custSel);
    }
    return;
  }

  // 2. Validate PO Number
  if (!po_number) {
    showToast("⚠️ Vui lòng nhập Số Đơn Hàng / Số PO (ví dụ: PO-050)!");
    if (poNumEl) {
      highlightField(poNumEl);
      safeScrollIntoView(poNumEl);
    }
    return;
  }

  // 3. Fallback for Style Code & Line Name if empty
  if (!style_code) {
    style_code = "Style " + po_number;
    if (styleEl) styleEl.value = style_code;
  }
  if (!line_name) {
    line_name = "Chuyền 1";
    if (lineEl) lineEl.value = line_name;
  }

  // 4. Collect batches from dynamic grid
  const container = document.getElementById("dynamicBatchInputsContainer") || document.getElementById("batchInputGrid");
  const batchCards = container ? container.querySelectorAll(".batch-card-item") : [];
  const batches = [];
  let sumBatches = 0;
  batchCards.forEach((card, i) => {
    const bName = card.dataset.batchName;
    const input = card.querySelector(".batch-card-input");
    const qty = Number(input ? input.value : 0) || 0;
    sumBatches += qty;
    if (qty > 0 || !card.classList.contains("is-tail") || batches.length === 0) {
      batches.push({
        id: "b-" + (i + 1),
        batch_name: bName,
        batch_plan: qty,
        into_sewing: 0
      });
    }
  });

  // 5. Validate / Auto-sync PO Plan
  if (po_plan <= 0 && sumBatches > 0) {
    po_plan = sumBatches;
    if (poPlanEl) poPlanEl.value = po_plan;
    showToast(`💡 Đã tự động cập nhật Tổng Kế Hoạch PO = ${po_plan.toLocaleString('vi-VN')} đôi từ các lô`);
  } else if (po_plan <= 0 && sumBatches <= 0) {
    showToast("⚠️ Vui lòng nhập Tổng Kế Hoạch PO hoặc định mức sản lượng các Lô!");
    if (poPlanEl) {
      highlightField(poPlanEl);
      safeScrollIntoView(poPlanEl);
    }
    return;
  }

  // If no batches were collected but plan exists, create default Batch 1
  if (batches.length === 0) {
    batches.push({
      id: "b-1",
      batch_name: "Lô 1",
      batch_plan: po_plan,
      into_sewing: 0
    });
  }

  // 6. Submit to API
  const btnSubmit = document.getElementById("btnSubmitPO");
  const origBtnText = btnSubmit ? btnSubmit.innerText : "💾 Lưu đơn hàng & cấu hình lô";
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerText = "⏳ Đang lưu...";
  }

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id || undefined,
        customer_id,
        po_number,
        style_code,
        line_name,
        po_plan,
        default_batches: batches
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? "✅ Đã cập nhật PO & Lô thành công!" : "✅ Đã thêm PO mới thành công!");
      resetPOForm();
      await fetchMetadata();

      // Ensure the saved or updated PO is active and reload report
      const savedPO = id 
        ? appState.orders.find(o => o.id === id) 
        : appState.orders.find(o => o.po_number.toLowerCase() === po_number.toLowerCase() && o.customer_id === customer_id);
      if (savedPO) {
        appState.currentPO = savedPO;
        const selPO = document.getElementById("selectPO");
        if (selPO) selPO.value = savedPO.id;
        loadReport();
        loadDeptLogs();
      }
      renderOrdersTable(customer_id);
    } else {
      alert("Không thể lưu PO: " + (data.error || "Vui lòng thử lại"));
    }
  } catch (err) {
    alert("Lỗi khi lưu PO: " + err.message);
  } finally {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerText = origBtnText;
    }
  }
}

// HELPER: LOCAL STORAGE REPORT CACHE (BẢO VỆ DỮ LIỆU ĐIỆN THOẠI KHÔNG BỊ MẤT KHI THOÁT)
function saveLocalReportCache(poId, date, reportData) {
  if (!poId || !date || !reportData) return;
  try {
    const key = `dd_cache_report_${poId}_${date}`;
    reportData._localSavedAt = Date.now();
    localStorage.setItem(key, JSON.stringify(reportData));
    localStorage.setItem("dd_last_saved_time", Date.now().toString());
  } catch (e) {
    console.warn("Lỗi lưu cache báo cáo cục bộ:", e);
  }
}

function getLocalReportCache(poId, date) {
  if (!poId || !date) return null;
  try {
    const key = `dd_cache_report_${poId}_${date}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// SAVE REPORT
async function saveReport(status, silent = false) {
  if (!appState.currentPO) return;
  recalculateAllInPlace();
  appState.report.po_id = appState.currentPO.id;
  appState.report.report_date = appState.currentDate;
  appState.report.status = status || "DRAFT";

  // 1. Luôn lưu ngay vào LocalStorage của điện thoại để dữ liệu không bao giờ bị tuột
  saveLocalReportCache(appState.currentPO.id, appState.currentDate, appState.report);

  // Lưu lại khách hàng và PO gần nhất người dùng đang chọn
  try {
    localStorage.setItem("dd_last_customer_id", appState.currentCustomer || "");
    localStorage.setItem("dd_last_po_id", appState.currentPO.id || "");
  } catch (e) {}

  try {
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appState.report),
      keepalive: true
    });
    const data = await res.json();
    if (data.success) {
      appState.hasUnsavedChanges = false;
      if (!silent) {
        showToast(`✅ Đã lưu báo cáo (${status === 'SUBMITTED' ? 'Đã chốt sổ' : 'Bản nháp'})!`);
      }
      if (typeof refreshFactoryBalanceInBackground === "function") {
        refreshFactoryBalanceInBackground();
      }
    } else {
      if (!silent) showToast("⚠️ Dữ liệu đã lưu tạm trên máy (chờ đồng bộ máy chủ)");
    }
  } catch (err) {
    console.warn("Lỗi kết nối khi gửi dữ liệu lên server, đã bảo lưu cục bộ:", err);
    if (!silent) {
      showToast("📱 Đã lưu an toàn trên điện thoại (sẽ tự động đồng bộ khi có mạng)!");
    }
  }
}

// TAB 2: BÁO CÁO ĐỐI CHIẾU NHẬP XUẤT TỒN + THEO DÕI SẢN LƯỢNG (SIDE-BY-SIDE)
async function loadDeptLogs() {
  if (!appState.currentPO) return;
  try {
    const res = await fetch(`/api/dept-logs?po_id=${appState.currentPO.id}`);
    const data = await res.json();
    if (data.success) {
      appState.deptLogs = data.logs || {};
      renderDeptLogsUI();
    }
  } catch (err) {
    console.error("Lỗi tải sản lượng các bộ phận:", err);
  }
}

function renderDeptLogsUI() {
  const container = document.getElementById("deptBatchesContainer");
  if (!container) return;
  container.innerHTML = "";

  const po = appState.currentPO;
  const poPlan = po ? Number(po.po_plan) || 0 : 0;
  const poNum = po ? po.po_number : "--";

  // 1. Update Top Summary Table
  const elDate = document.getElementById("deptSummaryDate");
  if (elDate) elDate.innerText = formatDateDisplay(appState.currentDate);

  const elPO = document.getElementById("deptSummaryPO");
  if (elPO) elPO.innerText = poNum;

  const elPlan = document.getElementById("deptSummaryPlan");
  if (elPlan) elPlan.innerText = poPlan.toLocaleString("vi-VN");

  // 2. Get batch list for current PO
  let batches = po && po.default_batches && po.default_batches.length > 0 
    ? [...po.default_batches] 
    : [
        { id: "b-1", batch_name: "Lô 1", batch_plan: 1230, into_sewing: 1230 },
        { id: "b-2", batch_name: "Lô 2", batch_plan: 267, into_sewing: 267 },
        { id: "b-3", batch_name: "Lô Số Đuôi", batch_plan: 126, into_sewing: 126, is_tail_batch: true }
      ];

  const tailSweepDate = po ? (po.tail_sweep_date || (po.id === 'po-050' ? '2026-09-23' : null)) : null;
  if (tailSweepDate && appState.currentDate < tailSweepDate) {
    batches = batches.filter(b => !b.is_tail_batch && !(b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
  } else if (tailSweepDate && appState.currentDate >= tailSweepDate) {
    const hasTail = batches.some(b => b.is_tail_batch || (b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
    if (!hasTail) {
      batches.push({
        id: "b-tail",
        batch_name: po.tail_batch_name || "Lô Số Đuôi",
        batch_plan: 126,
        into_sewing: 126,
        is_tail_batch: true
      });
    }
  }

  if (!appState.deptLogs) appState.deptLogs = {};

  let totalAllReceived = 0;
  let totalAllDelivered = 0;

  batches.forEach((b, bIdx) => {
    const bName = b.batch_name;
    const batchPlan = Number(b.into_sewing || b.batch_plan) || 0;

    // Harmonize "Số đuôi" vs "Lô Số Đuôi" in deptLogs
    if (!appState.deptLogs[bName]) {
      if (appState.deptLogs["Số đuôi"] && (bName === "Lô Số Đuôi" || b.is_tail_batch)) {
        appState.deptLogs[bName] = appState.deptLogs["Số đuôi"];
      } else if (appState.deptLogs["Lô Số Đuôi"] && bName === "Số đuôi") {
        appState.deptLogs[bName] = appState.deptLogs["Lô Số Đuôi"];
      }
    }

    // Load or initialize rows for this batch (default 6 rows)
    if (!appState.deptLogs[bName] || !Array.isArray(appState.deptLogs[bName]) || appState.deptLogs[bName].length === 0) {
      appState.deptLogs[bName] = [
        { date: "", ton_dau: 0, nhap: batchPlan, xuat: 0, ton_cuoi: batchPlan, nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", ton_dau: "", nhap: "", xuat: "", ton_cuoi: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", ton_dau: "", nhap: "", xuat: "", ton_cuoi: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", ton_dau: "", nhap: "", xuat: "", ton_cuoi: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", ton_dau: "", nhap: "", xuat: "", ton_cuoi: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", ton_dau: "", nhap: "", xuat: "", ton_cuoi: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ];
    }

    const rows = appState.deptLogs[bName];
    let sumTonDau = 0;
    let sumNhap = 0;
    let sumXuat = 0;
    let sumTonCuoi = 0;
    let sumNhapPhoi = 0;
    let sumGiaoDG = 0;
    let sumNhapKho = 0;
    let sumXuatKho = 0;

    rows.forEach((r, rIdx) => {
      if (r.ton_dau === undefined) r.ton_dau = (rIdx === 0 ? 0 : "");
      if (r.nhap === undefined) r.nhap = (rIdx === 0 ? batchPlan : "");
      if (r.xuat === undefined) r.xuat = "";
      if (r.ton_cuoi === undefined) r.ton_cuoi = (rIdx === 0 ? batchPlan : "");

      sumTonDau += Number(r.ton_dau) || 0;
      sumNhap += Number(r.nhap) || 0;
      sumXuat += Number(r.xuat) || 0;
      sumTonCuoi += Number(r.ton_cuoi) || 0;
      sumNhapPhoi += Number(r.nhap_phoi) || 0;
      sumGiaoDG += Number(r.giao_dg) || 0;
      sumNhapKho += Number(r.nhap_kho) || 0;
      sumXuatKho += Number(r.xuat_kho) || 0;
    });

    const targetNhap = sumNhap > 0 ? sumNhap : batchPlan;
    totalAllReceived += targetNhap;
    totalAllDelivered += sumXuatKho;

    // Điều kiện: Đến khi nào dòng tổng cộng mà tổng xuất kho thành phẩm bằng tổng nhập vào thì hiển thị trạng thái oke
    const isOk = (targetNhap > 0 && sumXuatKho === targetNhap);
    const statusBadge = isOk 
      ? `<span class="dept-status-badge is-ok">OKE</span>`
      : `<span class="dept-status-badge is-not-ok">NOT OKE</span>`;

    // Render Batch Block (1 Unified Table)
    const blockEl = document.createElement("div");
    blockEl.className = "dept-batch-block";
    blockEl.dataset.batchName = bName;
    blockEl.dataset.batchIdx = bIdx;

    let rowsHtml = "";
    rows.forEach((r, rIdx) => {
      rowsHtml += `
        <tr>
          <td><input type="text" class="dept-nav-input txt-date" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="1" data-field="date" value="${r.date || ''}" placeholder="DD-MMM"></td>
          <td><input type="number" class="dept-nav-input dept-cell-ton-dau" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="2" data-field="ton_dau" value="${r.ton_dau !== undefined && r.ton_dau !== null ? r.ton_dau : ''}" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-nhap font-bold text-sky-800" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="3" data-field="nhap" value="${r.nhap !== undefined && r.nhap !== null ? r.nhap : ''}" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-xuat font-bold text-emerald-800" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="4" data-field="xuat" value="${r.xuat !== undefined && r.xuat !== null ? r.xuat : ''}" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-ton-cuoi font-bold text-amber-800" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="5" data-field="ton_cuoi" value="${r.ton_cuoi !== undefined && r.ton_cuoi !== null ? r.ton_cuoi : ''}" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-nhap-phoi" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="6" data-field="nhap_phoi" value="${r.nhap_phoi !== undefined && r.nhap_phoi !== null ? r.nhap_phoi : ''}" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-giao-dg" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="7" data-field="giao_dg" value="${r.giao_dg !== undefined && r.giao_dg !== null ? r.giao_dg : ''}" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-nhap-kho" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="8" data-field="nhap_kho" value="${r.nhap_kho !== undefined && r.nhap_kho !== null ? r.nhap_kho : ''}" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-xuat-kho font-bold text-emerald-700" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="9" data-field="xuat_kho" value="${r.xuat_kho !== undefined && r.xuat_kho !== null ? r.xuat_kho : ''}" placeholder="0"></td>
          <td></td>
        </tr>
      `;
    });

    blockEl.innerHTML = `
      <table class="dept-unified-table" id="unified_table_${bIdx}">
        <thead>
          <!-- HÀNG MERGE CHỒNG LÊN TOÀN BỘ CÁC Ô: LÔ 1 HOẶC LÔ 2 -->
          <tr>
            <th colspan="10" class="th-top-batch-banner">
              <span class="batch-title-label">${bName}</span> <span class="plan-tag">Kế hoạch: ${batchPlan.toLocaleString('vi-VN')} đôi</span>
            </th>
          </tr>
          <!-- HÀNG TIÊU ĐỀ 10 CỘT -->
          <tr>
            <th rowspan="2" class="th-dept-col th-ngay">Ngày</th>
            <th class="th-dept-col th-dept-tondau">Tồn đầu ngày</th>
            <th class="th-dept-col th-dept-nhap">Nhập</th>
            <th class="th-dept-col th-dept-xuat">Xuất</th>
            <th class="th-dept-col th-dept-toncuoi">Tồn cuối ngày</th>
            <th rowspan="2" class="th-dept-col">Nhập phối đôi</th>
            <th rowspan="2" class="th-dept-col">Giao đóng gói</th>
            <th rowspan="2" class="th-dept-col">Nhập kho TP</th>
            <th rowspan="2" class="th-dept-col">Xuất kho TP</th>
            <th rowspan="2" class="th-dept-col" style="width: 95px;">Trạng thái</th>
          </tr>
          <!-- HÀNG SUBHEADERS GIẢI THÍCH -->
          <tr>
            <th class="sub-dept-header">Luôn bằng 0</th>
            <th class="sub-dept-header">Vào chuyền may</th>
            <th class="sub-dept-header">Đã giao KH</th>
            <th class="sub-dept-header sub-dept-toncuoi">Tồn đầu + Nhập − Xuất</th>
          </tr>
        </thead>
        <tbody id="deptTbody_${bIdx}">
          ${rowsHtml}
        </tbody>
        <tfoot class="dept-table-tfoot">
          <tr class="tr-dept-total">
            <td class="td-dept-sum-label"><strong>Tổng cộng</strong></td>
            <td class="td-dept-sum-val" id="sum_ton_dau_${bIdx}">${sumTonDau.toLocaleString('vi-VN')}</td>
            <td class="td-dept-sum-val txt-blue" id="sum_nhap_${bIdx}">${sumNhap.toLocaleString('vi-VN')}</td>
            <td class="td-dept-sum-val txt-green" id="sum_xuat_${bIdx}">${sumXuat.toLocaleString('vi-VN')}</td>
            <td class="td-dept-sum-val txt-amber" id="sum_ton_cuoi_${bIdx}">${sumTonCuoi.toLocaleString('vi-VN')}</td>
            <td class="td-dept-sum-val" id="sum_nhap_phoi_${bIdx}">${sumNhapPhoi.toLocaleString('vi-VN')}</td>
            <td class="td-dept-sum-val" id="sum_giao_dg_${bIdx}">${sumGiaoDG.toLocaleString('vi-VN')}</td>
            <td class="td-dept-sum-val" id="sum_nhap_kho_${bIdx}">${sumNhapKho.toLocaleString('vi-VN')}</td>
            <td class="td-dept-sum-val" id="sum_xuat_kho_${bIdx}">${sumXuatKho.toLocaleString('vi-VN')}</td>
            <td class="td-dept-sum-status" id="status_col_${bIdx}">${statusBadge}</td>
          </tr>
        </tfoot>
      </table>
      <div class="dept-batch-footer-bar">
        <button type="button" class="btn-add-dept-row" data-batch-idx="${bIdx}" data-batch-name="${bName}">+ Thêm dòng ngày (${bName})</button>
        <div class="dept-executor-note">Điền tên người thực hiện ở bảng chi tiết</div>
      </div>
    `;

    container.appendChild(blockEl);
  });

  // 3. Update summary values
  const totalAllTonCuoi = totalAllReceived - totalAllDelivered;
  const debt = Math.max(0, poPlan - totalAllReceived);

  const elTotRec = document.getElementById("deptSummaryTotalReceived");
  if (elTotRec) elTotRec.innerText = totalAllReceived.toLocaleString("vi-VN");

  const elTotDel = document.getElementById("deptSummaryTotalDelivered");
  if (elTotDel) elTotDel.innerText = totalAllDelivered.toLocaleString("vi-VN");

  const elTotTon = document.getElementById("deptSummaryTotalTonCuoi");
  if (elTotTon) elTotTon.innerText = totalAllTonCuoi.toLocaleString("vi-VN");

  const elDebt = document.getElementById("deptSummaryDebt");
  if (elDebt) elDebt.innerText = debt.toLocaleString("vi-VN");

  // 4. Bind listeners to unified table inputs
  bindDeptTableInputs();
}

function bindDeptTableInputs() {
  document.querySelectorAll(".dept-nav-input").forEach(input => {
    input.addEventListener("input", (e) => {
      const bIdx = parseInt(e.target.dataset.batchIdx, 10);
      const rIdx = parseInt(e.target.dataset.rowIdx, 10);
      const field = e.target.dataset.field;

      const block = document.querySelector(`.dept-batch-block[data-batch-idx="${bIdx}"]`);
      if (!block) return;
      const bName = block.dataset.batchName;

      if (!appState.deptLogs[bName]) appState.deptLogs[bName] = [];
      if (!appState.deptLogs[bName][rIdx]) {
        appState.deptLogs[bName][rIdx] = { date: "", ton_dau: "", nhap: "", xuat: "", ton_cuoi: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" };
      }

      appState.deptLogs[bName][rIdx][field] = e.target.value;

      // Auto calculate ton_cuoi if ton_dau, nhap, or xuat is updated
      if (field === "ton_dau" || field === "nhap" || field === "xuat") {
        const rowObj = appState.deptLogs[bName][rIdx];
        const calcTC = (Number(rowObj.ton_dau) || 0) + (Number(rowObj.nhap) || 0) - (Number(rowObj.xuat) || 0);
        rowObj.ton_cuoi = calcTC;
        const tcInput = document.querySelector(`.dept-cell-ton-cuoi[data-batch-idx="${bIdx}"][data-row-idx="${rIdx}"]`);
        if (tcInput && document.activeElement !== tcInput) {
          tcInput.value = calcTC;
        }
      }

      recalculateDeptSummary();
    });
  });

  // Bind Add Row Buttons
  document.querySelectorAll(".btn-add-dept-row").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const bIdx = parseInt(e.target.dataset.batchIdx, 10);
      const bName = e.target.dataset.batchName;

      if (!appState.deptLogs[bName]) appState.deptLogs[bName] = [];
      const newRowIdx = appState.deptLogs[bName].length;
      appState.deptLogs[bName].push({ date: "", ton_dau: "", nhap: "", xuat: "", ton_cuoi: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" });

      const tbody = document.getElementById(`deptTbody_${bIdx}`);
      if (tbody) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="text" class="dept-nav-input txt-date" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="1" data-field="date" value="" placeholder="DD-MMM"></td>
          <td><input type="number" class="dept-nav-input dept-cell-ton-dau" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="2" data-field="ton_dau" value="" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-nhap font-bold text-sky-800" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="3" data-field="nhap" value="" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-xuat font-bold text-emerald-800" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="4" data-field="xuat" value="" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-ton-cuoi font-bold text-amber-800" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="5" data-field="ton_cuoi" value="" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-nhap-phoi" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="6" data-field="nhap_phoi" value="" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-giao-dg" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="7" data-field="giao_dg" value="" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-nhap-kho" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="8" data-field="nhap_kho" value="" placeholder="0"></td>
          <td><input type="number" class="dept-nav-input dept-cell-xuat-kho font-bold text-emerald-700" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="9" data-field="xuat_kho" value="" placeholder="0"></td>
          <td></td>
        `;
        tbody.appendChild(tr);
        bindDeptTableInputs();
        const firstInput = tr.querySelector("input");
        if (firstInput) firstInput.focus();
      }
    });
  });
}

function recalculateDeptSummary() {
  const po = appState.currentPO;
  const poPlan = po ? Number(po.po_plan) || 0 : 0;
  const batches = po && po.default_batches && po.default_batches.length > 0 
    ? po.default_batches 
    : [
        { batch_name: "Lô 1", into_sewing: 1230 },
        { batch_name: "Lô 2", into_sewing: 267 },
        { batch_name: "Số đuôi", into_sewing: 126 }
      ];

  let totalAllReceived = 0;
  let totalAllDelivered = 0;

  batches.forEach((b, bIdx) => {
    const bName = b.batch_name;
    const batchPlan = Number(b.into_sewing || b.batch_plan) || 0;

    let sumTonDau = 0;
    let sumNhap = 0;
    let sumXuat = 0;
    let sumTonCuoi = 0;
    let sumNhapPhoi = 0;
    let sumGiaoDG = 0;
    let sumNhapKho = 0;
    let sumXuatKho = 0;

    const rows = (appState.deptLogs && appState.deptLogs[bName]) ? appState.deptLogs[bName] : [];
    rows.forEach(r => {
      sumTonDau += Number(r.ton_dau) || 0;
      sumNhap += Number(r.nhap) || 0;
      sumXuat += Number(r.xuat) || 0;
      sumTonCuoi += Number(r.ton_cuoi) || 0;
      sumNhapPhoi += Number(r.nhap_phoi) || 0;
      sumGiaoDG += Number(r.giao_dg) || 0;
      sumNhapKho += Number(r.nhap_kho) || 0;
      sumXuatKho += Number(r.xuat_kho) || 0;
    });

    const targetNhap = sumNhap > 0 ? sumNhap : batchPlan;
    totalAllReceived += targetNhap;
    totalAllDelivered += sumXuatKho;

    // Update tfoot sums
    const elSumTD = document.getElementById(`sum_ton_dau_${bIdx}`);
    if (elSumTD) elSumTD.innerText = sumTonDau.toLocaleString("vi-VN");

    const elSumN = document.getElementById(`sum_nhap_${bIdx}`);
    if (elSumN) elSumN.innerText = sumNhap.toLocaleString("vi-VN");

    const elSumX = document.getElementById(`sum_xuat_${bIdx}`);
    if (elSumX) elSumX.innerText = sumXuat.toLocaleString("vi-VN");

    const elSumTC = document.getElementById(`sum_ton_cuoi_${bIdx}`);
    if (elSumTC) elSumTC.innerText = sumTonCuoi.toLocaleString("vi-VN");

    const elSumNP = document.getElementById(`sum_nhap_phoi_${bIdx}`);
    if (elSumNP) elSumNP.innerText = sumNhapPhoi.toLocaleString("vi-VN");

    const elSumDG = document.getElementById(`sum_giao_dg_${bIdx}`);
    if (elSumDG) elSumDG.innerText = sumGiaoDG.toLocaleString("vi-VN");

    const elSumNK = document.getElementById(`sum_nhap_kho_${bIdx}`);
    if (elSumNK) elSumNK.innerText = sumNhapKho.toLocaleString("vi-VN");

    const elSumXK = document.getElementById(`sum_xuat_kho_${bIdx}`);
    if (elSumXK) elSumXK.innerText = sumXuatKho.toLocaleString("vi-VN");

    // Điều kiện: Đến khi nào dòng tổng cộng mà tổng xuất kho thành phẩm bằng tổng nhập vào thì hiển thị trạng thái oke
    const isOk = (targetNhap > 0 && sumXuatKho === targetNhap);
    const elStatus = document.getElementById(`status_col_${bIdx}`);
    if (elStatus) {
      elStatus.innerHTML = isOk 
        ? `<span class="dept-status-badge is-ok">OKE</span>`
        : `<span class="dept-status-badge is-not-ok">NOT OKE</span>`;
    }
  });

  const totalAllTonCuoi = totalAllReceived - totalAllDelivered;
  const debt = Math.max(0, poPlan - totalAllReceived);

  const elTotRec = document.getElementById("deptSummaryTotalReceived");
  if (elTotRec) elTotRec.innerText = totalAllReceived.toLocaleString("vi-VN");

  const elTotDel = document.getElementById("deptSummaryTotalDelivered");
  if (elTotDel) elTotDel.innerText = totalAllDelivered.toLocaleString("vi-VN");

  const elTotTon = document.getElementById("deptSummaryTotalTonCuoi");
  if (elTotTon) elTotTon.innerText = totalAllTonCuoi.toLocaleString("vi-VN");

  const elDebt = document.getElementById("deptSummaryDebt");
  if (elDebt) elDebt.innerText = debt.toLocaleString("vi-VN");
}

async function saveDeptLogs(silent = false) {
  if (!appState.currentPO) return;
  try {
    const res = await fetch("/api/dept-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        po_id: appState.currentPO.id,
        logs: appState.deptLogs
      })
    });
    const data = await res.json();
    if (data.success) {
      if (!silent) showToast("✅ Đã lưu sản lượng các bộ phận thành công!");
    }
  } catch (err) {
    if (!silent) alert("Lỗi khi lưu sản lượng: " + err.message);
  }
}

// EXPORT TAB 2 TO EXCEL
function exportDeptToExcel() {
  const wb = XLSX.utils.book_new();
  const po = appState.currentPO;
  const poNum = po ? po.po_number : "PO";

  const rows = [
    ["BÁO CÁO ĐỐI CHIẾU NHẬP XUẤT TỒN + THEO DÕI SẢN LƯỢNG"],
    ["PO:", poNum, "Style:", po ? po.style_code : "", "Kế hoạch:", po ? po.po_plan : 0, "Ngày:", appState.currentDate],
    [],
    ["Lô Hàng", "Ngày", "Tồn Đầu Ngày", "Nhập (Vào Chuyền)", "Xuất (Đã Giao KH)", "Tồn Cuối Ngày", "Nhập Phối Đôi", "Giao Đóng Gói", "Nhập Kho TP", "Xuất Kho TP", "Trạng Thái"]
  ];

  const batches = po && po.default_batches ? po.default_batches : [
    { batch_name: "Lô 1", into_sewing: 1230 },
    { batch_name: "Lô 2", into_sewing: 267 },
    { batch_name: "Số đuôi", into_sewing: 126 }
  ];

  batches.forEach(b => {
    const bName = b.batch_name;
    const batchPlan = Number(b.into_sewing || b.batch_plan) || 0;
    const deptRows = (appState.deptLogs && appState.deptLogs[bName]) ? appState.deptLogs[bName] : [];
    let sumTD = 0, sumN = 0, sumX = 0, sumTC = 0, sumNP = 0, sumDG = 0, sumNK = 0, sumXK = 0;
    deptRows.forEach(r => {
      sumTD += Number(r.ton_dau) || 0;
      sumN += Number(r.nhap) || 0;
      sumX += Number(r.xuat) || 0;
      sumTC += Number(r.ton_cuoi) || 0;
      sumNP += Number(r.nhap_phoi) || 0;
      sumDG += Number(r.giao_dg) || 0;
      sumNK += Number(r.nhap_kho) || 0;
      sumXK += Number(r.xuat_kho) || 0;
    });

    const targetNhap = sumN > 0 ? sumN : batchPlan;
    const isOk = (targetNhap > 0 && sumXK === targetNhap);

    deptRows.forEach((r, i) => {
      rows.push([
        i === 0 ? bName : "",
        r.date || "",
        r.ton_dau !== undefined ? r.ton_dau : "",
        r.nhap !== undefined ? r.nhap : "",
        r.xuat !== undefined ? r.xuat : "",
        r.ton_cuoi !== undefined ? r.ton_cuoi : "",
        r.nhap_phoi !== undefined ? r.nhap_phoi : "",
        r.giao_dg !== undefined ? r.giao_dg : "",
        r.nhap_kho !== undefined ? r.nhap_kho : "",
        r.xuat_kho !== undefined ? r.xuat_kho : "",
        ""
      ]);
    });

    // Summary row of batch
    rows.push([
      bName,
      "TỔNG CỘNG",
      sumTD,
      sumN,
      sumX,
      sumTC,
      sumNP,
      sumDG,
      sumNK,
      sumXK,
      isOk ? "OKE" : "NOT OKE"
    ]);

    rows.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Doi_Chieu_San_Luong");
  XLSX.writeFile(wb, `Doi_Chieu_San_Luong_${poNum}_${appState.currentDate}.xlsx`);
}

// NUMPAD DISPLAY HELPER
function showNumpad(inputEl) {
  appState.activeInputEl = inputEl;
  document.getElementById("numpadDisplay").innerText = inputEl.value || "0";
  document.getElementById("numpadModal").classList.add("show");
}

function hideNumpad() {
  document.getElementById("numpadModal").classList.remove("show");
  appState.activeInputEl = null;
}

function confirmNumpad() {
  if (appState.activeInputEl) {
    const val = document.getElementById("numpadDisplay").innerText;
    appState.activeInputEl.value = val === "0" ? "" : val;
    appState.activeInputEl.dispatchEvent(new Event("input"));
    showToast("💾 Đã lưu số lượng!");
  }
  hideNumpad();
}

// EXPORT TAB 1 TO EXCEL
function exportToExcel() {
  const wb = XLSX.utils.book_new();

  const reportData = [
    ["BÁO CÁO ĐỐI CHIẾU NHẬP XUẤT TỒN"],
    ["Đơn hàng / Style:", appState.currentPO ? appState.currentPO.style_code : "", "PO Number:", appState.currentPO ? appState.currentPO.po_number : "", "Ngày báo cáo:", appState.currentDate],
    ["Kế hoạch PO:", appState.currentPO ? appState.currentPO.po_plan : 0, "Chuyền:", appState.currentPO ? appState.currentPO.line_name : ""],
    [],
    ["Lô Hàng", "Kế Hoạch", "Tồn Đầu Ngày", "Nhập (Vào Chuyền)", "Xuất (Giao KH)", "Tồn Lý Thuyết", "Tồn Thực Tế", "Thiếu Hàng", "Nguyên Nhân Thiếu"]
  ];

  appState.report.batches.forEach(b => {
    const into = Number(b.into_sewing) || 0;
    const deliv = Number(b.delivered) || 0;
    const tonLyThuyet = into - deliv;
    const actualWip = (Number(b.wip_sewing) || 0) + (Number(b.wip_qc) || 0) + (Number(b.wip_pairing) || 0) + (Number(b.wip_packing) || 0) + (Number(b.wip_warehouse) || 0);
    const shortage = tonLyThuyet - actualWip;
    reportData.push([
      b.batch_name,
      b.batch_plan,
      0,
      into,
      deliv,
      tonLyThuyet,
      actualWip,
      shortage,
      b.shortage_note || ""
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(reportData);
  XLSX.utils.book_append_sheet(wb, ws1, "Bao_Cao_Doi_Chieu");
  XLSX.writeFile(wb, `Bao_Cao_Doi_Chieu_${appState.currentPO ? appState.currentPO.po_number : 'PO'}_${appState.currentDate}.xlsx`);
}

// ========================================================
// ROLE & FIREBASE AUTHENTICATION FUNCTIONS
// ========================================================
function onLoginSuccess(user, role) {
  appState.currentUserRole = role || user.role || "worker";
  appState.currentUser = user;

  const chkRemember = document.getElementById("chkRememberMe");
  const shouldRemember = chkRemember ? chkRemember.checked : true;

  if (shouldRemember) {
    try {
      localStorage.setItem("dd_wip_role", appState.currentUserRole);
      localStorage.setItem("dd_user_info", JSON.stringify(user));
      // Save cookie with 1 year expiration (31536000 seconds) for cross-browser & iOS persistence
      document.cookie = `dd_wip_session=${encodeURIComponent(JSON.stringify(user))}; max-age=31536000; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn("Storage save error:", e);
    }
  } else {
    try {
      sessionStorage.setItem("dd_wip_role", appState.currentUserRole);
      sessionStorage.setItem("dd_user_info", JSON.stringify(user));
    } catch (e) {
      console.warn("Session storage save error:", e);
    }
  }

  const portal = document.getElementById("loginPortalScreen");
  const mainApp = document.getElementById("appMainWrapper");
  if (portal) {
    portal.style.setProperty("display", "none", "important");
  }
  if (mainApp) {
    mainApp.style.setProperty("display", "block", "important");
  }

  applyUserRole(appState.currentUserRole, appState.currentUser);
  closeRoleModal();

  const roleLabel = getRoleInfo(role).title;
  showToast(`Đăng nhập thành công: ${user.full_name || user.email || user.phone} — Quyền: ${roleLabel}`);

  fetchMetadata();
  if (role === 'admin') {
    fetchUsers();
  }
}

function handleLogout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?")) {
    try {
      localStorage.removeItem("dd_user_info");
      localStorage.removeItem("dd_wip_role");
      sessionStorage.removeItem("dd_user_info");
      sessionStorage.removeItem("dd_wip_role");
      document.cookie = "dd_wip_session=; max-age=0; path=/; SameSite=Lax";
    } catch (e) {
      console.warn("Logout clear error:", e);
    }
    appState.currentUser = null;
    appState.currentUserRole = "worker";

    // Clear login input values for next clean login
    const userInput = document.getElementById("portalTxtLoginUser");
    const passInput = document.getElementById("portalTxtLoginPass");
    if (userInput) userInput.value = "";
    if (passInput) passInput.value = "";

    const portal = document.getElementById("loginPortalScreen");
    const mainApp = document.getElementById("appMainWrapper");
    if (portal) {
      portal.style.setProperty("display", "flex", "important");
    }
    if (mainApp) {
      mainApp.style.setProperty("display", "none", "important");
    }

    showToast("Đã đăng xuất khỏi hệ thống.");
  }
}

// BIND DEDICATED LOGIN PORTAL EVENTS
function bindPortalEvents() {
  // 1. Role Choice Cards in Portal (Visual indicator only)
  const cardAdmin = document.getElementById("cardRoleAdmin");
  const cardManager = document.getElementById("cardRoleManager");
  const cardWorker = document.getElementById("cardRoleWorker");

  function selectPortalRole(role) {
    [cardAdmin, cardManager, cardWorker].forEach(c => {
      if (c) c.className = "login-role-choice-card " + (c.dataset.role === "admin" ? "is-admin-card" : (c.dataset.role === "manager" ? "is-manager-card" : "is-worker-card"));
    });

    if (role === "admin" && cardAdmin) {
      cardAdmin.classList.add("active-admin");
    } else if (role === "manager" && cardManager) {
      cardManager.classList.add("active-manager");
    } else if (role === "worker" && cardWorker) {
      cardWorker.classList.add("active-worker");
    }
  }

  if (cardAdmin) cardAdmin.addEventListener("click", () => selectPortalRole("admin"));
  if (cardManager) cardManager.addEventListener("click", () => selectPortalRole("manager"));
  if (cardWorker) cardWorker.addEventListener("click", () => selectPortalRole("worker"));

  // 2. Toggle Show / Hide Password
  const btnTogglePass = document.getElementById("btnToggleShowPass");
  const passInput = document.getElementById("portalTxtLoginPass");
  if (btnTogglePass && passInput) {
    btnTogglePass.addEventListener("click", () => {
      if (passInput.type === "password") {
        passInput.type = "text";
        btnTogglePass.innerText = "Ẩn mật khẩu";
      } else {
        passInput.type = "password";
        btnTogglePass.innerText = "Hiện mật khẩu";
      }
    });
  }

  // 3. Direct Login Submit (Số điện thoại / Email + Mật Khẩu)
  async function submitDirectLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const userOrPhone = document.getElementById("portalTxtLoginUser")?.value.trim();
    const password = document.getElementById("portalTxtLoginPass")?.value.trim();

    if (!userOrPhone || !password) {
      alert("Vui lòng nhập đầy đủ số điện thoại/email và mật khẩu.");
      return;
    }

    const btnSub = document.getElementById("btnPortalSubmitLogin");
    if (btnSub) {
      btnSub.disabled = true;
      btnSub.innerText = "Đang xác thực tài khoản...";
    }

    try {
      const res = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userOrPhone, password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user, data.user.role);
      } else {
        alert(data.error || "Số điện thoại / Email hoặc mật khẩu không chính xác.");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      if (btnSub) {
        btnSub.disabled = false;
        btnSub.innerText = "Đăng nhập hệ thống";
      }
    }
  }

  const formLogin = document.getElementById("formPortalLogin");
  if (formLogin) {
    formLogin.addEventListener("submit", submitDirectLogin);
  }

  // Logout button in Main App Bar
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", handleLogout);
  }
}

// Bảng quyền: tên hiển thị và các tab được xem
const ROLE_INFO = {
  admin:   { title: "Ban giám đốc (Admin)", short: "Admin", badge: "is-admin", tabs: ["tab-wip", "tab-flow-log", "tab-manage", "tab-users"] },
  manager: { title: "Quản lý điều hành", short: "Quản lý", badge: "is-manager", tabs: ["tab-wip", "tab-flow-log"] },
  leader:  { title: "Tổ trưởng", short: "Tổ trưởng", badge: "is-manager", tabs: ["tab-wip"] },
  feeder:  { title: "Người thả chuyền", short: "Thả chuyền", badge: "is-worker", tabs: ["tab-wip"] },
  packer:  { title: "Đóng gói", short: "Đóng gói", badge: "is-worker", tabs: ["tab-wip"] },
  worker:  { title: "Nhân viên kiểm kê", short: "Kiểm kê", badge: "is-worker", tabs: ["tab-wip"] }
};

function getRoleInfo(role) {
  const key = ROLE_INFO[role] ? role : "worker";
  return { key, ...ROLE_INFO[key] };
}

function applyUserRole(role, user = null) {
  appState.currentUserRole = role || "worker";
  try {
    localStorage.setItem("dd_wip_role", appState.currentUserRole);
  } catch (e) {}

  if (user) {
    appState.currentUser = user;
    try {
      localStorage.setItem("dd_user_info", JSON.stringify(user));
      document.cookie = `dd_wip_session=${encodeURIComponent(JSON.stringify(user))}; max-age=31536000; path=/; SameSite=Lax`;
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }

  // Ensure login portal is closed and main app is visible whenever a role is applied
  const portal = document.getElementById("loginPortalScreen");
  const mainApp = document.getElementById("appMainWrapper");
  if (appState.currentUser) {
    if (portal) portal.style.setProperty("display", "none", "important");
    if (mainApp) mainApp.style.setProperty("display", "block", "important");
  }

  const info = getRoleInfo(role);
  const badge = document.getElementById("currentRoleBadge");

  let rawName = user ? (user.full_name || user.email || user.phone) : info.title;
  const cleanName = String(rawName).replace(/\s*\(Admin\)/gi, '').replace(/\s*\(Quản lý\)/gi, '').replace(/\s*\(Công nhân\)/gi, '').trim();

  // Update Avatar Popover Menu (Mockup Màn 2)
  const popName = document.getElementById("popoverUserName");
  const popRole = document.getElementById("popoverUserRole");
  if (popName) {
    popName.innerText = cleanName || info.title;
  }
  if (popRole) {
    popRole.innerText = `Vai trò: ${info.title}`;
  }
  if (badge) {
    badge.className = `role-badge ${info.badge}`;
    badge.innerHTML = `${cleanName} · ${info.short}`;
  }

  // Lớp role-* trên <body>: CSS dựa vào đây để ẩn/hiện nút Thả chuyền, Đóng gói, Tổng hợp
  Object.keys(ROLE_INFO).forEach(r => document.body.classList.remove(`role-${r}`));
  document.body.classList.add(`role-${info.key}`);

  // Chỉ hiện các tab mà quyền này được xem (Tab 3 Khách hàng & PO chỉ dành cho admin)
  document.querySelectorAll(".nav-tabs .tab-btn").forEach(btn => {
    const allowed = info.tabs.includes(btn.dataset.tab);
    btn.classList.toggle("hidden", !allowed);
    btn.style.setProperty("display", allowed ? "inline-flex" : "none", "important");
  });

  // Đang đứng ở tab không được xem thì tự chuyển về Tab 1
  const activeTab = document.querySelector(".tab-btn.active");
  if (activeTab && !info.tabs.includes(activeTab.dataset.tab)) {
    const wipTab = document.querySelector('.tab-btn[data-tab="tab-wip"]');
    if (wipTab) wipTab.click();
  }

  if (typeof refreshReleaseBar === "function") refreshReleaseBar();
}

function openRoleModal() {
  const modal = document.getElementById("modalRoleAuth");
  if (!modal) return;

  const txtEmail = document.getElementById("txtAuthEmail");
  if (txtEmail && appState.currentUser) {
    txtEmail.value = appState.currentUser.phone || appState.currentUser.email || "";
  }
  const txtPass = document.getElementById("txtAuthPassword");
  if (txtPass) {
    txtPass.value = "";
  }

  modal.classList.add("show");
}

function closeRoleModal() {
  const modal = document.getElementById("modalRoleAuth");
  if (modal) modal.classList.remove("show");
  clearInterval(otpTimerInterval);
}

// Convert VN Phone format (0901234567 -> +84901234567)
function formatPhoneToIntl(phone) {
  let clean = phone.replace(/\s+/g, "").replace(/-/g, "");
  if (clean.startsWith("0")) {
    clean = "+84" + clean.substring(1);
  } else if (!clean.startsWith("+")) {
    clean = "+84" + clean;
  }
  return clean;
}

let portalOtpTimerInterval = null;
function startPortalOtpCountdown() {
  clearInterval(portalOtpTimerInterval);
  let sec = 60;
  const timerEl = document.getElementById("portalTimerSec");
  const btnResend = document.getElementById("btnPortalResendOTP");
  if (btnResend) btnResend.disabled = true;

  portalOtpTimerInterval = setInterval(() => {
    sec--;
    if (timerEl) timerEl.innerText = sec;
    if (sec <= 0) {
      clearInterval(portalOtpTimerInterval);
      if (btnResend) btnResend.disabled = false;
    }
  }, 1000);
}

// 1. Send Phone SMS OTP via Google Firebase (Modal)
async function handleSendPhoneOTP() {
  const phoneInp = document.getElementById("txtAuthPhone");
  const rawPhone = phoneInp ? phoneInp.value.trim() : "";
  if (!rawPhone || rawPhone.length < 9) {
    alert("Vui lòng nhập đúng định dạng số điện thoại (ví dụ: 0818189868 hoặc 0901234567).");
    return;
  }

  const intlPhone = formatPhoneToIntl(rawPhone);
  const btnSend = document.getElementById("btnSendPhoneOTP");
  if (btnSend) {
    btnSend.disabled = true;
    btnSend.innerText = "Đang gửi SMS...";
  }

  try {
    if (!firebaseAuth) {
      throw new Error("Google Firebase Auth chưa sẵn sàng.");
    }

    if (!modalRecaptchaVerifier) {
      modalRecaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      });
    }

    modalConfirmationResult = await firebaseAuth.signInWithPhoneNumber(intlPhone, modalRecaptchaVerifier);

    const boxOtp = document.getElementById("boxOtpInput");
    if (boxOtp) boxOtp.style.display = "block";
    const txtOtp = document.getElementById("txtOtpCode");
    if (txtOtp) {
      txtOtp.value = "";
      txtOtp.focus();
    }
    startOtpCountdown();
    showToast(`Đã gửi tin nhắn SMS chứa mã OTP về số ${rawPhone}.`);
  } catch (err) {
    console.error("Firebase SMS error:", err);
    if (modalRecaptchaVerifier) {
      try {
        modalRecaptchaVerifier.render().then(widgetId => {
          if (window.grecaptcha) grecaptcha.reset(widgetId);
        });
      } catch(e) {}
    }
    alert("Lỗi gửi tin nhắn SMS: " + err.message);
  } finally {
    if (btnSend) {
      btnSend.disabled = false;
      btnSend.innerText = "Gửi mã OTP";
    }
  }
}

function startOtpCountdown() {
  clearInterval(otpTimerInterval);
  let sec = 60;
  const timerEl = document.getElementById("timerSec");
  const btnResend = document.getElementById("btnResendOTP");
  if (btnResend) btnResend.disabled = true;

  otpTimerInterval = setInterval(() => {
    sec--;
    if (timerEl) timerEl.innerText = sec;
    if (sec <= 0) {
      clearInterval(otpTimerInterval);
      if (btnResend) btnResend.disabled = false;
    }
  }, 1000);
}

// 2. Confirm Authentication (Email / Phone + Password)
async function handleConfirmAuth() {
  const emailOrPhone = (document.getElementById("txtAuthEmail")?.value || "").trim();
  const password = (document.getElementById("txtAuthPassword")?.value || "").trim();

  if (!emailOrPhone || !password) {
    alert("Vui lòng nhập đầy đủ số điện thoại/email và mật khẩu.");
    return;
  }

  const btnConfirm = document.getElementById("btnConfirmAuth");
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerText = "Đang xác thực...";
  }

  try {
    const res = await fetch("/api/auth/email-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailOrPhone, password })
    });

    const data = await res.json();
    if (data.success && data.user) {
      onLoginSuccess(data.user, data.user.role);
    } else {
      alert(data.error || "Số điện thoại / Email hoặc mật khẩu không chính xác.");
    }
  } catch (err) {
    alert("Lỗi đăng nhập: " + err.message);
  } finally {
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.innerText = "Xác nhận đăng nhập";
    }
  }
}

// ========================================================
// ADMIN: USER & PERMISSION MANAGEMENT (TAB 4)
// ========================================================
async function fetchUsers() {
  try {
    const res = await fetch(`/api/admin/users?_t=${Date.now()}`);
    const data = await res.json();
    if (data.success) {
      appState.usersList = data.users || [];
      try { localStorage.setItem("dd_cached_users", JSON.stringify(appState.usersList)); } catch (e) {}
      renderUsersTable();
    }
  } catch (err) {
    console.warn("Lỗi tải danh sách người dùng từ máy chủ, kiểm tra cache:", err);
    try {
      const cached = localStorage.getItem("dd_cached_users");
      if (cached && (!appState.usersList || appState.usersList.length === 0)) {
        appState.usersList = JSON.parse(cached);
        renderUsersTable();
      }
    } catch (e) {}
  }
}

function renderUsersTable() {
  const tbody = document.getElementById("tbodyUsers");
  const statTotalTab3 = document.getElementById("statTotalUsersTab3");
  if (statTotalTab3) statTotalTab3.innerText = `${appState.usersList.length}`;
  const statTotalTab4 = document.getElementById("statTotalUsersBadge");
  if (statTotalTab4) statTotalTab4.innerText = `${appState.usersList.length} tài khoản`;

  if (!tbody) return;
  if (appState.usersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: #64748b;">Chưa có tài khoản nào. Hãy điền biểu mẫu bên trên để cấp quyền mới.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.usersList.map(u => {
    const uRole = getRoleInfo(u.role);
    const roleBadge = `<span class="user-role-badge ${uRole.badge}">${uRole.title}</span>`;

    return `
      <tr>
        <td><strong class="mono-code">${u.email || '--'}</strong></td>
        <td class="mono-num"><strong>${u.phone || '--'}</strong></td>
        <td><strong>${u.full_name || 'Chưa đặt tên'}</strong></td>
        <td>${roleBadge}</td>
        <td><span class="mono-code">${u.password || 'Admin@123456'}</span></td>
        <td><span class="mono-code">${u.pin_code || '1234'}</span></td>
        <td><span style="color: ${u.is_active ? '#0d6e5b' : '#c81e51'}; font-weight:700; font-size:0.78rem;">${u.is_active ? '● Hoạt động' : '● Đã khóa'}</span></td>
        <td>
          <div style="display:flex; gap:6px; justify-content:center;">
            <button class="btn-action-icon btn-edit btn-edit-user" data-id="${u.id}">Sửa</button>
            <button class="btn-action-icon btn-del btn-delete-user" data-id="${u.id}" ${u.role === 'admin' ? 'disabled title="Không thể xóa tài khoản Admin chính"' : ''}>Xóa</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll(".btn-edit-user").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.dataset.id;
      const user = appState.usersList.find(u => u.id === id);
      if (!user) return;
      document.getElementById("editUserId").value = user.id;
      if (document.getElementById("userEmail")) document.getElementById("userEmail").value = user.email || "";
      document.getElementById("userPhone").value = user.phone || "";
      document.getElementById("userFullName").value = user.full_name || "";
      document.getElementById("userRoleSelect").value = user.role || "worker";
      if (document.getElementById("userPassword")) document.getElementById("userPassword").value = user.password || "Admin@123456";
      document.getElementById("userPinCode").value = user.pin_code || "1234";

      const formTitle = document.getElementById("userFormTitle");
      if (formTitle) formTitle.innerHTML = `Chỉnh sửa tài khoản: <strong>${user.full_name}</strong>`;
      const formBadge = document.getElementById("userFormModeBadge");
      if (formBadge) {
        formBadge.innerText = "Chế độ: Chỉnh sửa";
        formBadge.classList.add("is-editing");
      }

      const btnSubmit = document.getElementById("btnSubmitUser");
      if (btnSubmit) {
        btnSubmit.innerText = "Cập nhật quyền";
      }
      const btnCancel = document.getElementById("btnCancelEditUser");
      if (btnCancel) btnCancel.style.display = "inline-flex";

      const hintEl = document.getElementById("userFormHint");
      if (hintEl) {
        hintEl.style.display = "block";
        hintEl.innerHTML = `Đang chỉnh sửa tài khoản: <strong>${user.full_name}</strong> (${user.phone || user.email || id}). Bấm <strong>"Hủy chỉnh sửa"</strong> nếu muốn thêm tài khoản mới.`;
      }

      const formUser = document.getElementById("formAddUser");
      if (formUser) {
        formUser.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      document.getElementById("userFullName")?.focus();
    });
  });

  document.querySelectorAll(".btn-delete-user").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm("Bạn có chắc chắn muốn xóa người dùng này khỏi hệ thống?")) {
        try {
          const res = await fetch(`/api/admin/users?id=${id}&_t=${Date.now()}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            showToast("Đã xóa người dùng khỏi hệ thống.");
            if (data.users && Array.isArray(data.users)) {
              appState.usersList = data.users;
              renderUsersTable();
            } else {
              await fetchUsers();
            }
          }
        } catch (err) {
          alert("Lỗi khi xóa người dùng: " + err.message);
        }
      }
    });
  });
}

function handleUserFormPhoneInput() {
  const elId = document.getElementById("editUserId");
  // Nếu đang ở chế độ ấn nút "Sửa" thủ công thì giữ nguyên
  if (elId && elId.value) return;

  const phoneVal = document.getElementById("userPhone")?.value.trim() || "";
  const emailVal = document.getElementById("userEmail")?.value.trim().toLowerCase() || "";
  const cleanPhone = normalizePhone(phoneVal);
  const hintEl = document.getElementById("userFormHint");
  const btnSubmit = document.getElementById("btnSubmitUser");
  const formBadge = document.getElementById("userFormModeBadge");

  if (!cleanPhone && !emailVal) {
    if (hintEl) hintEl.style.display = "none";
    if (btnSubmit) {
      btnSubmit.innerText = "Lưu tài khoản mới";
    }
    if (formBadge) {
      formBadge.innerText = "Chế độ: Thêm mới";
      formBadge.classList.remove("is-editing");
    }
    return;
  }

  const existing = Array.isArray(appState.usersList) ? appState.usersList.find(u => 
    (cleanPhone && normalizePhone(u.phone) === cleanPhone) ||
    (emailVal && u.email && u.email.toLowerCase() === emailVal)
  ) : null;

  if (existing) {
    const roleText = getRoleInfo(existing.role).title;
    if (hintEl) {
      hintEl.style.display = "block";
      hintEl.innerHTML = `Số điện thoại/Email này đã thuộc tài khoản <strong>${existing.full_name}</strong> (Vai trò: <em>${roleText}</em>). Khi bấm Lưu, hệ thống sẽ cập nhật thông tin cho tài khoản này.`;
    }
    if (btnSubmit) {
      btnSubmit.innerText = `Cập nhật quyền (${existing.full_name})`;
    }
    if (formBadge) {
      formBadge.innerText = "Cập nhật tài khoản cũ";
      formBadge.classList.add("is-editing");
    }
  } else {
    if (hintEl) hintEl.style.display = "none";
    if (btnSubmit) {
      btnSubmit.innerText = "Lưu tài khoản mới";
    }
    if (formBadge) {
      formBadge.innerText = "Chế độ: Thêm mới";
      formBadge.classList.remove("is-editing");
    }
  }
}

function resetUserForm() {
  const elId = document.getElementById("editUserId");
  if (elId) elId.value = "";
  const elEmail = document.getElementById("userEmail");
  if (elEmail) elEmail.value = "";
  const elPhone = document.getElementById("userPhone");
  if (elPhone) elPhone.value = "";
  const elName = document.getElementById("userFullName");
  if (elName) elName.value = "";
  const elRole = document.getElementById("userRoleSelect");
  if (elRole) elRole.value = "worker";
  const elPassword = document.getElementById("userPassword");
  if (elPassword) elPassword.value = "Admin@123456";
  const elPin = document.getElementById("userPinCode");
  if (elPin) elPin.value = "1234";

  const formTitle = document.getElementById("userFormTitle");
  if (formTitle) formTitle.innerHTML = `Thêm tài khoản và phân quyền mới`;
  const formBadge = document.getElementById("userFormModeBadge");
  if (formBadge) {
    formBadge.innerText = "Chế độ: Thêm mới";
    formBadge.classList.remove("is-editing");
  }

  const elSubmit = document.getElementById("btnSubmitUser");
  if (elSubmit) {
    elSubmit.innerText = "Lưu tài khoản mới";
  }
  const elCancel = document.getElementById("btnCancelEditUser");
  if (elCancel) elCancel.style.display = "none";
  const hintEl = document.getElementById("userFormHint");
  if (hintEl) {
    hintEl.style.display = "none";
    hintEl.innerHTML = "";
  }
}

async function handleAddUser(e) {
  if (e && e.preventDefault) e.preventDefault();
  let id = document.getElementById("editUserId")?.value || "";
  const email = document.getElementById("userEmail")?.value.trim() || "";
  const phone = document.getElementById("userPhone")?.value.trim() || "";
  const fullName = document.getElementById("userFullName")?.value.trim() || "";
  const role = document.getElementById("userRoleSelect")?.value || "worker";
  const password = document.getElementById("userPassword")?.value.trim() || "Admin@123456";
  const pinCode = document.getElementById("userPinCode")?.value.trim() || "1234";

  if (!email && !phone) {
    alert("❌ Vui lòng nhập Email hoặc Số điện thoại.");
    document.getElementById("userPhone")?.focus();
    return;
  }
  if (!fullName) {
    alert("❌ Vui lòng điền họ và tên người dùng.");
    document.getElementById("userFullName")?.focus();
    return;
  }

  // Tự động kiểm tra trùng lặp nếu chưa có ID (chế độ Thêm mới)
  const cleanPhone = normalizePhone(phone);
  const cleanEmail = email.toLowerCase();
  if (!id && Array.isArray(appState.usersList)) {
    const existing = appState.usersList.find(u => 
      (cleanPhone && normalizePhone(u.phone) === cleanPhone) ||
      (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
    );
    if (existing) {
      const confirmUpdate = confirm(`⚠️ Số điện thoại hoặc Email này đã thuộc về tài khoản "${existing.full_name}".\n\nBạn có muốn CẬP NHẬT thông tin/phân quyền cho tài khoản "${existing.full_name}" không?\n- Bấm OK: Cập nhật tài khoản hiện có này.\n- Bấm Cancel: Quay lại đổi số điện thoại để tạo người dùng mới.`);
      if (confirmUpdate) {
        id = existing.id;
      } else {
        document.getElementById("userPhone")?.focus();
        return;
      }
    }
  }

  if (window._isSavingUser) return;
  window._isSavingUser = true;

  const btnSubmit = document.getElementById("btnSubmitUser");
  const origBtnText = btnSubmit ? btnSubmit.innerText : "";
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerText = "⏳ Đang lưu...";
  }

  try {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: id || undefined,
        email,
        phone,
        full_name: fullName,
        role,
        password,
        pin_code: pinCode || "1234",
        is_active: 1
      })
    });

    const data = await res.json();
    if (data.success) {
      const actionText = id ? "cập nhật phân quyền" : "thêm người dùng mới";
      const roleText = getRoleInfo(role).title;
      if (data.users && Array.isArray(data.users)) {
        appState.usersList = data.users;
        try { localStorage.setItem("dd_cached_users", JSON.stringify(appState.usersList)); } catch (e) {}
        renderUsersTable();
      } else {
        await fetchUsers();
      }
      resetUserForm();
      showToast(`🎉 Đã ${actionText} thành công!\n👤 ${fullName} (${roleText})`);
    } else {
      alert("❌ Lỗi: " + (data.error || "Không thể lưu người dùng"));
    }
  } catch (err) {
    alert("❌ Lỗi kết nối máy chủ: " + err.message);
  } finally {
    window._isSavingUser = false;
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerText = origBtnText || "💾 Lưu Tài Khoản Mới";
    }
  }
}

// ========================================================
// SUB-TAB 1.2: THỐNG KÊ LỊCH SỬ TẤT CẢ CÁC NGÀY CỦA LÔ
// ========================================================
async function fetchReportHistory() {
  if (!appState.currentPO) return;
  const histPoNum = document.getElementById("histPoNum");
  if (histPoNum) histPoNum.innerText = `${appState.currentPO.po_number} - ${appState.currentPO.style_code}`;

  try {
    const res = await fetch(`/api/report-history?po_id=${appState.currentPO.id}`);
    const data = await res.json();
    if (data.success) {
      appState.historyLogs = data.history || [];
      populateHistoryBatchFilter();
      renderHistoryTable();
    }
  } catch (err) {
    console.error("Lỗi khi tải lịch sử kiểm kê:", err);
  }
}

function populateHistoryBatchFilter() {
  const select = document.getElementById("historyBatchFilter");
  if (!select) return;
  const currentVal = select.value;
  
  const batchNames = Array.from(new Set(appState.historyLogs.map(r => r.batch_name).filter(Boolean)));
  select.innerHTML = `<option value="ALL">-- Tất Cả Các Lô --</option>`;
  batchNames.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.innerText = name;
    select.appendChild(opt);
  });
  if (batchNames.includes(currentVal)) {
    select.value = currentVal;
  }
}

function renderHistoryTable() {
  const tbody = document.getElementById("historyTbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filterBatch = document.getElementById("historyBatchFilter")?.value || "ALL";
  const filtered = filterBatch === "ALL" 
    ? appState.historyLogs 
    : appState.historyLogs.filter(r => r.batch_name === filterBatch);

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="14" style="text-align:center; padding: 25px; color: #94a3b8;">Chưa có dữ liệu kiểm kê lịch sử cho đơn hàng này. Hãy thực hiện lưu báo cáo theo ngày ở Tab 1.1 để theo dõi.</td></tr>`;
    resetHistorySummary();
    return;
  }

  let sumNhap = 0, sumXuat = 0, sumMay = 0, sumQC = 0, sumPhoi = 0, sumDG = 0, sumKho = 0;
  let sumTonThucTe = 0, sumTonLyThuyet = 0, sumChenhLech = 0;

  // Group rows by batch_name
  const groupedByBatch = {};
  filtered.forEach(r => {
    const bName = r.batch_name || "Lô khác";
    if (!groupedByBatch[bName]) groupedByBatch[bName] = [];
    groupedByBatch[bName].push(r);
  });

  // Sort batch names naturally (Lô 1, Lô 2, etc.)
  const batchNames = Object.keys(groupedByBatch).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  batchNames.forEach((bName, bIdx) => {
    const bRows = groupedByBatch[bName];
    // Sort dates ascending within batch
    bRows.sort((a, b) => (a.report_date || '').localeCompare(b.report_date || ''));
    const rowSpanCount = bRows.length;

    bRows.forEach((r, rowIdx) => {
      const into = Number(r.into_sewing || r.batch_plan) || 0;
      const delivered = Number(r.delivered || r.daily_out) || 0;
      const wipSewing = Number(r.wip_sewing) || 0;
      const wipQC = Number(r.wip_qc) || 0;
      const wipPairing = Number(r.wip_pairing) || 0;
      const wipPacking = Number(r.wip_packing) || 0;
      const wipWarehouse = Number(r.wip_warehouse) || 0;

      const actualWip = wipSewing + wipQC + wipPairing + wipPacking + wipWarehouse;
      const tonLyThuyet = into - delivered;
      const shortage = tonLyThuyet - actualWip;

      sumNhap += into;
      sumXuat += delivered;
      sumMay += wipSewing;
      sumQC += wipQC;
      sumPhoi += wipPairing;
      sumDG += wipPacking;
      sumKho += wipWarehouse;
      sumTonThucTe += actualWip;
      sumTonLyThuyet += tonLyThuyet;
      sumChenhLech += shortage;

      const tr = document.createElement("tr");
      if (rowIdx === 0 && bIdx > 0) {
        tr.style.borderTop = "2px solid #94a3b8";
      }

      const statusHtml = shortage === 0 
        ? `<span class="dept-status-badge is-ok">Khớp (OK)</span>` 
        : (shortage > 0 
            ? `<span class="dept-status-badge is-not-ok">Thiếu ${shortage}</span>` 
            : `<span class="dept-status-badge" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;">Thừa +${Math.abs(shortage)}</span>`);

      let rowHtml = "";
      // First column: LÔ HÀNG (only 1 merged cell spanning all date rows of this batch)
      if (rowIdx === 0) {
        rowHtml += `
          <td rowspan="${rowSpanCount}" class="cell-merged-batch">
            ${bName}
          </td>
        `;
      }
      // Second column: NGÀY BÁO CÁO (stretching along the merged batch cell)
      rowHtml += `
        <td style="font-weight: 700; color: #1e293b;">${r.report_date || ''}</td>
        <td>${into.toLocaleString('vi-VN')}</td>
        <td>${delivered.toLocaleString('vi-VN')}</td>
        <td>${wipSewing.toLocaleString('vi-VN')}</td>
        <td>${wipQC.toLocaleString('vi-VN')}</td>
        <td>${wipPairing.toLocaleString('vi-VN')}</td>
        <td>${wipPacking.toLocaleString('vi-VN')}</td>
        <td>${wipWarehouse.toLocaleString('vi-VN')}</td>
        <td style="font-weight: 700; color: #d97706;">${actualWip.toLocaleString('vi-VN')}</td>
        <td style="font-weight: 700; color: #2563eb;">${tonLyThuyet.toLocaleString('vi-VN')}</td>
        <td style="font-weight: 700; color: ${shortage === 0 ? '#16a34a' : (shortage > 0 ? '#dc2626' : '#d97706')};">${shortage > 0 ? '-' : (shortage < 0 ? '+' : '')}${Math.abs(shortage).toLocaleString('vi-VN')}</td>
        <td>${statusHtml}</td>
        <td style="font-size: 11.5px; color: #475569; text-align: left;">${r.shortage_reason_type ? `[${r.shortage_reason_type}] ` : ''}${r.shortage_note || ''}</td>
      `;
      tr.innerHTML = rowHtml;
      tbody.appendChild(tr);
    });
  });

  // Update Summary Footer
  const elSumNhap = document.getElementById("histSumNhap");
  if (elSumNhap) elSumNhap.innerText = sumNhap.toLocaleString("vi-VN");

  const elSumXuat = document.getElementById("histSumXuat");
  if (elSumXuat) elSumXuat.innerText = sumXuat.toLocaleString("vi-VN");

  const elSumMay = document.getElementById("histSumMay");
  if (elSumMay) elSumMay.innerText = sumMay.toLocaleString("vi-VN");

  const elSumQC = document.getElementById("histSumQC");
  if (elSumQC) elSumQC.innerText = sumQC.toLocaleString("vi-VN");

  const elSumPhoi = document.getElementById("histSumPhoi");
  if (elSumPhoi) elSumPhoi.innerText = sumPhoi.toLocaleString("vi-VN");

  const elSumDG = document.getElementById("histSumDG");
  if (elSumDG) elSumDG.innerText = sumDG.toLocaleString("vi-VN");

  const elSumKho = document.getElementById("histSumKho");
  if (elSumKho) elSumKho.innerText = sumKho.toLocaleString("vi-VN");

  const elSumTT = document.getElementById("histSumTonThucTe");
  if (elSumTT) elSumTT.innerText = sumTonThucTe.toLocaleString("vi-VN");

  const elSumLT = document.getElementById("histSumTonLyThuyet");
  if (elSumLT) elSumLT.innerText = sumTonLyThuyet.toLocaleString("vi-VN");

  const elSumCL = document.getElementById("histSumChenhLech");
  if (elSumCL) elSumCL.innerText = `${sumChenhLech > 0 ? '-' : (sumChenhLech < 0 ? '+' : '')}${Math.abs(sumChenhLech).toLocaleString("vi-VN")}`;
  
  const elHistStatus = document.getElementById("histStatus");
  if (elHistStatus) {
    elHistStatus.innerHTML = sumChenhLech === 0 
      ? `<span class="dept-status-badge is-ok">OK</span>` 
      : `<span class="dept-status-badge is-not-ok">Lệch</span>`;
  }
}

function resetHistorySummary() {
  ["histSumNhap", "histSumXuat", "histSumMay", "histSumQC", "histSumPhoi", "histSumDG", "histSumKho", "histSumTonThucTe", "histSumTonLyThuyet", "histSumChenhLech"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerText = "0";
  });
  const elStatus = document.getElementById("histStatus");
  if (elStatus) elStatus.innerText = "--";
}

function exportHistoryToExcel() {
  const wb = XLSX.utils.book_new();
  const po = appState.currentPO;
  const poNum = po ? po.po_number : "PO";

  const rows = [
    ["THỐNG KÊ LỊCH SỬ TIẾN ĐỘ CÁC LÔ THEO TẤT CẢ CÁC NGÀY"],
    ["Đơn hàng / Style:", po ? po.style_code : "", "PO Number:", poNum, "Tổng kế hoạch:", po ? po.po_plan : 0],
    [],
    ["Lô Hàng", "Ngày Báo Cáo", "Nhập (Vào Chuyền)", "Xuất (Giao KH)", "KK May", "KK QC", "KK Phối Đôi", "KK Đóng Gói", "KK Kho TP", "Tổng Tồn Thực Tế", "Tồn Lý Thuyết", "Chênh Lệch", "Lý Do / Ghi Chú"]
  ];

  const filterBatch = document.getElementById("historyBatchFilter")?.value || "ALL";
  const filtered = filterBatch === "ALL" 
    ? appState.historyLogs 
    : appState.historyLogs.filter(r => r.batch_name === filterBatch);

  const groupedByBatch = {};
  filtered.forEach(r => {
    const bName = r.batch_name || "Lô khác";
    if (!groupedByBatch[bName]) groupedByBatch[bName] = [];
    groupedByBatch[bName].push(r);
  });

  const batchNames = Object.keys(groupedByBatch).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  batchNames.forEach(bName => {
    const bRows = groupedByBatch[bName];
    bRows.sort((a, b) => (a.report_date || '').localeCompare(b.report_date || ''));

    bRows.forEach((r, idx) => {
      const into = Number(r.into_sewing || r.batch_plan) || 0;
      const delivered = Number(r.delivered || r.daily_out) || 0;
      const wipSewing = Number(r.wip_sewing) || 0;
      const wipQC = Number(r.wip_qc) || 0;
      const wipPairing = Number(r.wip_pairing) || 0;
      const wipPacking = Number(r.wip_packing) || 0;
      const wipWarehouse = Number(r.wip_warehouse) || 0;

      const actualWip = wipSewing + wipQC + wipPairing + wipPacking + wipWarehouse;
      const tonLyThuyet = into - delivered;
      const shortage = tonLyThuyet - actualWip;

      rows.push([
        idx === 0 ? bName : "",
        r.report_date || "",
        into,
        delivered,
        wipSewing,
        wipQC,
        wipPairing,
        wipPacking,
        wipWarehouse,
        actualWip,
        tonLyThuyet,
        shortage,
        `${r.shortage_reason_type ? `[${r.shortage_reason_type}] ` : ''}${r.shortage_note || ''}`
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Lich_Su_Kiem_Ke_Lo");
  XLSX.writeFile(wb, `Lich_Su_Kiem_Ke_Lo_${poNum}.xlsx`);
}

// ========================================================
// GLOBAL FACTORY BALANCE MODAL (POPUP CÂN ĐỐI TOÀN NHÀ MÁY - HÌNH 2)
// Độc lập mọi PO - Quản lý kiểm tra cân đối tổng cho toàn xưởng
// Công thức:
// Vế 1 = Tồn hôm qua (QC + Phối + ĐG + Kho) + TP hôm nay - Xuất hôm nay
// Vế 2 = Tồn hôm nay (QC + Phối + ĐG + Kho)
// ========================================================
// ========================================================
// CUSTOMER-SPECIFIC BALANCE MODAL (POPUP CÂN ĐỐI THEO KHÁCH HÀNG)
// Quản lý và đối chiếu tách bạch cho từng khách hàng, không dồn chung
// Công thức:
// Vế 1 = Tồn hôm qua (KH này) + TP hôm nay (KH này) - Xuất hôm nay (KH này)
// Vế 2 = Tồn hôm nay (QC + Phối + ĐG + Kho của KH này)
// ========================================================
let factoryBalanceState = {
  customer_id: "",
  customer_name: "",
  date: "",
  prev_date: "",
  ton_hom_qua: 0,
  thanh_pham_hom_nay: 0,
  xuat_hom_nay: 0,
  ton_hom_nay: 0,
  details_today: { qc: 0, pairing: 0, packing: 0, warehouse: 0 }
};

async function openFactoryBalanceModal() {
  const modal = document.getElementById("modalFactoryBalance");
  if (!modal) return;
  modal.style.display = "flex";
  modal.style.opacity = "1";
  modal.style.pointerEvents = "auto";
  modal.classList.add("show");

  // Nếu người dùng vừa chỉnh sửa báo cáo mà chưa lưu, tự động lưu trước để DB có dữ liệu mới nhất
  if (appState.hasUnsavedChanges && typeof saveReport === "function") {
    try {
      await saveReport(appState.report.status || "DRAFT", true);
    } catch (e) {
      console.warn("Pre-save before balance check failed:", e);
    }
  }

  // Populate Customer Select dropdown with active customers
  const custSelect = document.getElementById("fbCustomerSelect");
  if (custSelect && appState.customers && appState.customers.length > 0) {
    custSelect.innerHTML = appState.customers.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join("");
    // Default to currently selected customer
    if (appState.currentCustomer && appState.customers.some(c => c.id === appState.currentCustomer)) {
      custSelect.value = appState.currentCustomer;
    } else {
      custSelect.value = appState.customers[0].id;
    }
  }

  const targetDate = appState.currentDate || getLocalDateString();
  const dateInput = document.getElementById("fbReportDate");
  if (dateInput) {
    dateInput.value = targetDate;
  }

  const targetCustId = (custSelect && custSelect.value) || appState.currentCustomer || "";
  await loadFactoryBalanceData(targetDate, targetCustId);
}

function closeFactoryBalanceModal() {
  const modal = document.getElementById("modalFactoryBalance");
  if (!modal) return;
  modal.style.display = "none";
  modal.style.opacity = "0";
  modal.style.pointerEvents = "none";
  modal.classList.remove("show");
}

// Ensure global accessibility for onclick triggers
window.openFactoryBalanceModal = openFactoryBalanceModal;
window.closeFactoryBalanceModal = closeFactoryBalanceModal;

function updateFactoryBalanceDOM() {
  const elTonQua = document.getElementById("fbTonHomQua");
  if (elTonQua) elTonQua.innerText = factoryBalanceState.ton_hom_qua.toLocaleString("vi-VN");

  const elXuat = document.getElementById("fbXuatHomNay");
  if (elXuat) elXuat.innerText = factoryBalanceState.xuat_hom_nay.toLocaleString("vi-VN");

  const elTonNay = document.getElementById("fbTonHomNay") || document.getElementById("fbVe2Result");
  if (elTonNay) elTonNay.innerText = factoryBalanceState.ton_hom_nay.toLocaleString("vi-VN");

  const tpInput = document.getElementById("fbThanhPhamInput");
  const mobTpInput = document.getElementById("fbmThanhPhamInput");
  const isTypingTp = document.activeElement === tpInput || (mobTpInput && document.activeElement === mobTpInput);
  if (tpInput && !isTypingTp) {
    tpInput.value = factoryBalanceState.thanh_pham_hom_nay ? factoryBalanceState.thanh_pham_hom_nay : "";
    if (mobTpInput) mobTpInput.value = tpInput.value;
  }

  // Giao diện điện thoại: số tồn qua, xuất, tồn thực tế
  const elMobTonQua = document.getElementById("fbmTonQua");
  if (elMobTonQua) elMobTonQua.innerText = factoryBalanceState.ton_hom_qua.toLocaleString("vi-VN");
  const elMobXuat = document.getElementById("fbmXuat");
  if (elMobXuat) elMobXuat.innerText = factoryBalanceState.xuat_hom_nay.toLocaleString("vi-VN");
  const elMobTonTT = document.getElementById("fbmTonTT");
  if (elMobTonTT) elMobTonTT.innerText = factoryBalanceState.ton_hom_nay.toLocaleString("vi-VN");

  // Update hints with Customer Name
  const cName = factoryBalanceState.customer_name || "khách hàng";
  const hTonQua = document.getElementById("fbHintTonQua");
  if (hTonQua) hTonQua.innerText = `4 trạm ${cName} (hôm qua)`;
  const hTP = document.getElementById("fbHintThanhPham");
  if (hTP) hTP.innerText = `May xong ${cName} (hôm nay)`;
  const hXuat = document.getElementById("fbHintXuat");
  if (hXuat) hXuat.innerText = `Thực xuất ${cName} (hôm nay)`;
  const hTonNay = document.getElementById("fbHintTonNay");
  if (hTonNay) hTonNay.innerText = `QC + Phối + ĐG + Kho (${cName})`;

  // Giao diện điện thoại: ghi ngày lấy tồn qua ngay cạnh dòng "Tồn hôm qua" (vd: T7 17/10)
  const mobPrevDate = document.getElementById("fbmPrevDate");
  if (mobPrevDate) {
    const pd = (factoryBalanceState.prev_date || "").split("-");
    if (pd.length === 3) {
      const pdObj = new Date(parseInt(pd[0], 10), parseInt(pd[1], 10) - 1, parseInt(pd[2], 10));
      const dowShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][pdObj.getDay()];
      mobPrevDate.innerText = `(${dowShort} ${pd[2]}/${pd[1]})`;
    } else {
      mobPrevDate.innerText = "";
    }
  }

  // Display previous date tag (Saturday if Monday)
  const prevBadge = document.getElementById("fbPrevDateBadge");
  if (prevBadge) {
    if (factoryBalanceState.prev_date) {
      const pParts = factoryBalanceState.prev_date.split("-");
      if (pParts.length === 3) {
        const pObj = new Date(parseInt(pParts[0], 10), parseInt(pParts[1], 10) - 1, parseInt(pParts[2], 10));
        const dowNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        const dow = dowNames[pObj.getDay()];
        prevBadge.innerText = `Nguồn tồn qua: ${dow} ${pParts[2]}/${pParts[1]}`;
      } else {
        prevBadge.innerText = `Nguồn tồn qua: ${factoryBalanceState.prev_date}`;
      }
    } else {
      prevBadge.innerText = "Nguồn tồn qua: Chưa có ngày trước";
    }
  }
}

async function loadFactoryBalanceData(dateStr, customerIdStr) {
  const date = dateStr || (document.getElementById("fbReportDate") ? document.getElementById("fbReportDate").value : appState.currentDate);
  const custSelect = document.getElementById("fbCustomerSelect");
  const customerId = customerIdStr !== undefined ? customerIdStr : ((custSelect && custSelect.value) || appState.currentCustomer || "");
  if (!date) return;

  const custObj = (appState.customers || []).find(c => c.id === customerId);
  const custName = custObj ? custObj.name : "Khách hàng";

  const resMessage = document.getElementById("fbResMessage");
  if (resMessage) resMessage.innerText = `⏳ Đang tổng hợp số liệu cho ${custName} từ máy chủ...`;

  try {
    const res = await fetch(`/api/factory-balance?date=${date}&customer_id=${encodeURIComponent(customerId)}`);
    const data = await res.json();
    if (data.success) {
      factoryBalanceState = {
        customer_id: customerId,
        customer_name: custName,
        date: data.date,
        prev_date: data.prev_date,
        ton_hom_qua: Number(data.ton_hom_qua) || 0,
        thanh_pham_hom_nay: Number(data.thanh_pham_hom_nay) || 0,
        xuat_hom_nay: Number(data.xuat_hom_nay) || 0,
        ton_hom_nay: Number(data.ton_hom_nay) || 0,
        details_today: data.details_today || { qc: 0, pairing: 0, packing: 0, warehouse: 0 }
      };

      updateFactoryBalanceDOM();
      recalculateFactoryBalanceModal();
    }
  } catch (err) {
    console.error("Factory Balance Fetch Error:", err);
    if (resMessage) resMessage.innerText = "⚠️ Không thể tải dữ liệu: " + err.message;
  }
}

// Tự động làm mới cân đối khách hàng ngầm khi người dùng thay đổi dữ liệu báo cáo
async function refreshFactoryBalanceInBackground() {
  const targetDate = (document.getElementById("fbReportDate") && document.getElementById("fbReportDate").value) || appState.currentDate || getLocalDateString();
  const custSelect = document.getElementById("fbCustomerSelect");
  const customerId = (custSelect && custSelect.value) || appState.currentCustomer || "";
  try {
    const res = await fetch(`/api/factory-balance?date=${targetDate}&customer_id=${encodeURIComponent(customerId)}`);
    const data = await res.json();
    if (data && data.success) {
      const custObj = (appState.customers || []).find(c => c.id === customerId);
      const custName = custObj ? custObj.name : "Khách hàng";
      factoryBalanceState = {
        customer_id: customerId,
        customer_name: custName,
        date: data.date,
        prev_date: data.prev_date,
        ton_hom_qua: Number(data.ton_hom_qua) || 0,
        thanh_pham_hom_nay: Number(data.thanh_pham_hom_nay) || 0,
        xuat_hom_nay: Number(data.xuat_hom_nay) || 0,
        ton_hom_nay: Number(data.ton_hom_nay) || 0,
        details_today: data.details_today || { qc: 0, pairing: 0, packing: 0, warehouse: 0 }
      };

      updateFactoryBalanceDOM();
      recalculateFactoryBalanceModal();
    }
  } catch (err) {
    console.warn("Background factory balance refresh error:", err);
  }
}
window.refreshFactoryBalanceInBackground = refreshFactoryBalanceInBackground;

function recalculateFactoryBalanceModal() {
  const tpInput = document.getElementById("fbThanhPhamInput");
  const rawTp = tpInput ? tpInput.value.trim() : "";
  const tpVal = rawTp === "" ? null : (Number(rawTp) || 0);

  const tonHomQua = factoryBalanceState.ton_hom_qua || 0;
  const xuatHomNay = factoryBalanceState.xuat_hom_nay || 0;
  const tonHomNay = factoryBalanceState.ton_hom_nay || 0;
  const custName = factoryBalanceState.customer_name || "khách hàng";

  const ve1 = (tonHomQua + (tpVal !== null ? tpVal : 0)) - xuatHomNay;
  const ve2 = tonHomNay;
  const diff = ve1 - ve2;

  // Cập nhật ô thứ 4: Tồn hôm nay (tổng 4 trạm: QC + Phối đôi + Đóng gói + Kho TP của khách hàng này)
  const elTonNay = document.getElementById("fbTonHomNay") || document.getElementById("fbVe2Result");
  if (elTonNay) elTonNay.innerText = tonHomNay.toLocaleString("vi-VN");

  const singleBox = document.getElementById("fbSingleResultBox") || document.getElementById("fbDiffBox");
  const resIcon = document.getElementById("fbResIcon");
  const resBadge = document.getElementById("fbResBadge");
  const resMessage = document.getElementById("fbResMessage") || document.getElementById("fbDiffText");
  const statusBadge = document.getElementById("fbStatusBadge");

  if (tpVal === null) {
    if (singleBox) singleBox.className = "fb-single-result-card is-pending";
    if (resIcon) resIcon.innerText = "⏳";
    if (resBadge) resBadge.innerText = `CHỜ NHẬP THÀNH PHẨM (${custName.toUpperCase()})`;
    if (resMessage) resMessage.innerHTML = `Vui lòng nhập <strong>Thành phẩm hôm nay</strong> của <strong>${custName}</strong> vào ô màu vàng ở trên để đối chiếu với Tồn hôm nay (4 trạm: <strong>${tonHomNay.toLocaleString("vi-VN")} đôi</strong>).`;
    if (statusBadge) {
      statusBadge.className = "fb-status-badge badge-pending";
      statusBadge.innerText = "⏳ Chờ nhập TP";
    }
  } else if (diff === 0) {
    if (singleBox) singleBox.className = "fb-single-result-card is-balanced";
    if (resIcon) resIcon.innerText = "✅";
    if (resBadge) resBadge.innerText = `ĐỦ (CÂN ĐỐI 0 ĐÔI - ${custName.toUpperCase()})`;
    if (resMessage) resMessage.innerHTML = `🎉 <strong>${custName.toUpperCase()} CÂN ĐỐI TUYỆT ĐỐI (0 ĐÔI):</strong><br>Vế luân chuyển [Tồn qua (${tonHomQua.toLocaleString("vi-VN")}) + TP (${tpVal.toLocaleString("vi-VN")}) − Xuất (${xuatHomNay.toLocaleString("vi-VN")})] = <strong>${ve1.toLocaleString("vi-VN")} đôi</strong>, KHỚP HOÀN TOÀN với Tồn hôm nay (4 trạm: <strong>${ve2.toLocaleString("vi-VN")} đôi</strong>)!`;
    if (statusBadge) {
      statusBadge.className = "fb-status-badge badge-balanced";
      statusBadge.innerText = "✅ Cân đối (0 đôi)";
    }
  } else if (diff > 0) {
    if (singleBox) singleBox.className = "fb-single-result-card is-short";
    if (resIcon) resIcon.innerText = "⚠️";
    if (resBadge) resBadge.innerText = `THIẾU ${diff.toLocaleString("vi-VN")} ĐÔI (${custName.toUpperCase()})`;
    if (resMessage) resMessage.innerHTML = `⚠️ <strong>${custName.toUpperCase()} THIẾU HỤT ${diff.toLocaleString("vi-VN")} ĐÔI:</strong><br>Vế luân chuyển [Tồn qua + TP − Xuất] là <strong>${ve1.toLocaleString("vi-VN")} đôi</strong>, nhưng Tồn hôm nay (4 trạm) chỉ có <strong>${ve2.toLocaleString("vi-VN")} đôi</strong> (Lệch thiếu ${diff.toLocaleString("vi-VN")} đôi).`;
    if (statusBadge) {
      statusBadge.className = "fb-status-badge badge-unbalanced";
      statusBadge.innerText = `⚠️ Thiếu ${diff.toLocaleString("vi-VN")} đôi`;
    }
  } else {
    const absDiff = Math.abs(diff);
    if (singleBox) singleBox.className = "fb-single-result-card is-surplus";
    if (resIcon) resIcon.innerText = "ℹ️";
    if (resBadge) resBadge.innerText = `DƯ ${absDiff.toLocaleString("vi-VN")} ĐÔI (${custName.toUpperCase()})`;
    if (resMessage) resMessage.innerHTML = `ℹ️ <strong>${custName.toUpperCase()} DƯ THỪA ${absDiff.toLocaleString("vi-VN")} ĐÔI:</strong><br>Vế luân chuyển [Tồn qua + TP − Xuất] là <strong>${ve1.toLocaleString("vi-VN")} đôi</strong>, nhưng Tồn hôm nay (4 trạm) ghi nhận <strong>${ve2.toLocaleString("vi-VN")} đôi</strong> (Lệch thừa ${absDiff.toLocaleString("vi-VN")} đôi).`;
    if (statusBadge) {
      statusBadge.className = "fb-status-badge badge-unbalanced";
      statusBadge.innerText = `ℹ️ Dư ${absDiff.toLocaleString("vi-VN")} đôi`;
    }
  }

  renderFactoryBalanceMobile(tpVal, ve1, ve2, diff);
}

// Giao diện điện thoại: chỉ trình bày lại kết quả đã tính ở trên (ve1 = tồn lý thuyết, ve2 = tồn thực tế)
function renderFactoryBalanceMobile(tpVal, ve1, ve2, diff) {
  const elLT = document.getElementById("fbmTonLT");
  if (elLT) elLT.innerText = tpVal === null ? "—" : ve1.toLocaleString("vi-VN");

  const box = document.getElementById("fbmResult");
  const icon = document.getElementById("fbmResIcon");
  const statement = document.getElementById("fbmStatement");
  const detail = document.getElementById("fbmDetail");
  if (!box || !statement) return;

  const tt = ve2.toLocaleString("vi-VN");
  const lt = ve1.toLocaleString("vi-VN");
  const gap = Math.abs(diff).toLocaleString("vi-VN");

  if (tpVal === null) {
    box.className = "fbm-result is-pending";
    if (icon) icon.innerText = "⏳";
    statement.innerText = "Chờ nhập thành phẩm hôm nay";
    if (detail) detail.innerText = "Nhập thành phẩm ở khối 1 để tính tồn lý thuyết.";
  } else if (diff === 0) {
    box.className = "fbm-result is-balanced";
    if (icon) icon.innerText = "✓";
    statement.innerText = "Tồn thực tế bằng tồn lý thuyết";
    if (detail) detail.innerText = `Thực tế ${tt} = lý thuyết ${lt}. Cân đối.`;
  } else if (diff < 0) {
    box.className = "fbm-result is-off";
    if (icon) icon.innerText = "↑";
    statement.innerHTML = `Tồn thực tế cao hơn tồn lý thuyết <span class="fbm-gap">${gap} đôi</span>`;
    if (detail) detail.innerText = `Thực tế ${tt} − lý thuyết ${lt} = +${gap}. Kiểm tra lại số đếm hoặc số thành phẩm.`;
  } else {
    box.className = "fbm-result is-off";
    if (icon) icon.innerText = "↓";
    statement.innerHTML = `Tồn thực tế thấp hơn tồn lý thuyết <span class="fbm-gap">${gap} đôi</span>`;
    if (detail) detail.innerText = `Thực tế ${tt} − lý thuyết ${lt} = −${gap}. Kiểm tra mất xác, hàng phế.`;
  }
}

// Nút ◀ ▶ đổi ngày trong cửa sổ kiểm tra cân đối (điện thoại)
function shiftFactoryBalanceDate(days) {
  const dateInput = document.getElementById("fbReportDate");
  const cur = (dateInput && dateInput.value) || appState.currentDate || getLocalDateString();
  const p = cur.split("-");
  const d = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10));
  d.setDate(d.getDate() + days);
  const next = getLocalDateString(d);
  if (dateInput) dateInput.value = next;
  loadFactoryBalanceData(next);
}

async function saveFactoryFinishedGoods() {
  const dateInput = document.getElementById("fbReportDate");
  const date = dateInput ? dateInput.value : appState.currentDate;
  const custSelect = document.getElementById("fbCustomerSelect");
  const customerId = factoryBalanceState.customer_id || (custSelect ? custSelect.value : appState.currentCustomer) || "";
  const custName = factoryBalanceState.customer_name || "Khách hàng";
  const tpInput = document.getElementById("fbThanhPhamInput");
  const val = tpInput ? (Number(tpInput.value) || 0) : 0;

  try {
    const res = await fetch("/api/factory-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, customer_id: customerId, daily_finished: val })
    });
    const data = await res.json();
    if (data.success) {
      factoryBalanceState.thanh_pham_hom_nay = val;
      showToast(`💾 Đã lưu thành phẩm ${custName} ngày ${date}: ${val.toLocaleString("vi-VN")} đôi!`);
      recalculateFactoryBalanceModal();
    }
  } catch (err) {
    console.error("Save Customer Finished Goods Error:", err);
    showToast("⚠️ Lỗi lưu thành phẩm: " + err.message, "error");
  }
}


// ==========================================================
// TAB 03: DÃY SIZE CỦA KHÁCH HÀNG
// Nhập tự do (size số, size chữ hoặc lẫn cả hai), giữ đúng thứ tự
// ==========================================================
const SIZE_QUICK = {
  num: Array.from({ length: 15 }, (_, i) => String(35 + i)),
  let: ["S", "M", "L", "XL", "XXL"],
  kid: ["3-4", "4T-5T", "6-7", "7T-8T", "9-10", "10T-11T"],
  clr: []
};
const sizeEditor = { list: [], dragFrom: null };

function escHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
}

function getCustomerSizes(cust) {
  if (!cust) return [];
  if (Array.isArray(cust.size_list)) return cust.size_list.map(String);
  try {
    const v = JSON.parse(cust.size_list || "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch (e) {
    return [];
  }
}

// "35–49" nếu là size số liên tục, ngược lại "S, M, L, …"
function sizeBriefText(list) {
  const nums = list.map(Number);
  const consecutive = list.length > 1 && nums.every((v, i) => Number.isInteger(v) && String(v) === list[i] && (i === 0 || v === nums[i - 1] + 1));
  if (consecutive) return `${list[0]}–${list[list.length - 1]}`;
  return list.length > 4 ? `${list.slice(0, 3).join(", ")}, …` : list.join(", ");
}

function sizeBriefHtml(list) {
  if (!list.length) return `<span class="size-brief is-empty">Chưa có</span>`;
  return `<span class="size-brief">${escHtml(sizeBriefText(list))}</span><span class="size-brief-n">${list.length}</span>`;
}

function setSizeError(msg) {
  const el = document.getElementById("sizeErr");
  if (el) el.textContent = msg || "";
}

// Nạp 1 khách hàng vào biểu mẫu để sửa (tên, mã, dãy size)
function fillCustomerForm(custId) {
  const cust = appState.customers.find(c => c.id === custId);
  if (!cust) return;
  const elId = document.getElementById("editCustId");
  if (elId) elId.value = cust.id;
  const elName = document.getElementById("custName");
  if (elName) elName.value = cust.name || "";
  const elCode = document.getElementById("custCode");
  if (elCode) elCode.value = cust.code || "";
  const btnSubmit = document.getElementById("btnSubmitCust");
  if (btnSubmit) btnSubmit.innerText = "Cập nhật khách hàng";
  const btnCancel = document.getElementById("btnCancelEditCust");
  if (btnCancel) btnCancel.style.display = "inline-flex";
  sizeEditor.list = getCustomerSizes(cust);
  setSizeError("");
  renderSizeEditor();
}

function renderSizeEditor() {
  const box = document.getElementById("sizeChips");
  if (!box) return;
  const list = sizeEditor.list;
  box.innerHTML = list.length
    ? list.map((s, i) => `<span class="size-chip" draggable="true" data-size-idx="${i}"><svg class="rel-ico" viewBox="0 0 24 24" style="stroke-width:3" aria-hidden="true"><path d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01"/></svg>${escHtml(s)}<button type="button" class="size-chip-x" data-size-del="${i}" aria-label="Xóa size ${escHtml(s)}">×</button></span>`).join("")
    : `<span class="size-chips-empty">Chưa có size nào</span>`;
  const cnt = document.getElementById("sizeCount");
  if (cnt) cnt.textContent = `${list.length} size`;
  renderSizePreview();
}

// Xem trước bảng Thả chuyền / Chỉ lệnh đóng gói với dãy size đang chọn
function renderSizePreview() {
  const body = document.getElementById("sizePreviewBody");
  if (!body) return;
  const editingId = document.getElementById("editCustId")?.value || "";
  let list;
  let name;
  if (editingId || sizeEditor.list.length) {
    const cust = appState.customers.find(c => c.id === editingId);
    list = sizeEditor.list;
    name = cust ? cust.name : (document.getElementById("custName")?.value.trim() || "khách hàng mới");
  } else {
    const cust = appState.customers.find(c => c.id === appState.currentCustomer);
    list = getCustomerSizes(cust);
    name = cust ? cust.name : "khách hàng";
  }
  const nameEl = document.getElementById("sizePreviewCust");
  if (nameEl) nameEl.textContent = name;

  const shown = list.slice(0, 6);
  body.innerHTML = shown.length
    ? shown.map(s => `<tr><td class="rel-size">${escHtml(s)}</td>${'<td><div class="size-pv-box"></div></td>'.repeat(4)}<td><div class="size-pv-cum"></div></td></tr>`).join("")
    : `<tr><td colspan="6" style="padding:14px; color:#94a3b8;">Chưa có size</td></tr>`;
  const more = document.getElementById("sizePreviewMore");
  if (more) {
    more.textContent = list.length > 6
      ? `… và ${list.length - 6} size nữa (tổng ${list.length} dòng)`
      : (list.length ? `Tổng ${list.length} dòng` : "Nhập dãy size ở khung bên trên");
  }
}

// Thêm 1 hoặc nhiều size (cách nhau bằng dấu phẩy, chấm phẩy, Tab hoặc xuống dòng)
function addSizesFromText(text) {
  const tokens = String(text || "").split(/[\t,;\n\r]+/).map(t => t.trim().slice(0, 20)).filter(Boolean);
  if (!tokens.length) {
    setSizeError("Gõ ít nhất một size");
    return false;
  }
  const dup = [];
  tokens.forEach(t => {
    if (sizeEditor.list.some(s => s.toLowerCase() === t.toLowerCase())) dup.push(t);
    else sizeEditor.list.push(t);
  });
  setSizeError(dup.length ? `Đã có trong dãy, bỏ qua: ${dup.join(", ")}` : "");
  renderSizeEditor();
  return true;
}

function bindSizeEditorEvents() {
  const input = document.getElementById("sizeAddInput");
  const chips = document.getElementById("sizeChips");
  if (!input || !chips) return;

  input.addEventListener("keydown", (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (addSizesFromText(input.value)) input.value = "";
    }
  });
  input.addEventListener("input", () => setSizeError(""));
  input.addEventListener("paste", (e) => {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    if (/[\t\n,;]/.test(text)) {
      e.preventDefault();
      addSizesFromText(text);
    }
  });
  document.getElementById("btnSizeAdd")?.addEventListener("click", () => {
    if (addSizesFromText(input.value)) input.value = "";
  });
  document.querySelectorAll("[data-size-quick]").forEach(btn => {
    btn.addEventListener("click", () => {
      sizeEditor.list = [...SIZE_QUICK[btn.dataset.sizeQuick]];
      setSizeError("");
      renderSizeEditor();
    });
  });
  document.getElementById("custName")?.addEventListener("input", renderSizePreview);

  chips.addEventListener("click", (e) => {
    const del = e.target.closest("[data-size-del]");
    if (!del) return;
    sizeEditor.list.splice(Number(del.dataset.sizeDel), 1);
    renderSizeEditor();
  });
  // Kéo thả để đổi thứ tự size
  chips.addEventListener("dragstart", (e) => {
    const chip = e.target.closest(".size-chip");
    if (!chip) return;
    sizeEditor.dragFrom = Number(chip.dataset.sizeIdx);
    chip.classList.add("is-drag");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  });
  chips.addEventListener("dragover", (e) => {
    const chip = e.target.closest(".size-chip");
    if (!chip || sizeEditor.dragFrom === null) return;
    e.preventDefault();
    chips.querySelectorAll(".is-over").forEach(c => c.classList.remove("is-over"));
    chip.classList.add("is-over");
  });
  chips.addEventListener("drop", (e) => {
    const chip = e.target.closest(".size-chip");
    if (!chip || sizeEditor.dragFrom === null) return;
    e.preventDefault();
    const [moved] = sizeEditor.list.splice(sizeEditor.dragFrom, 1);
    sizeEditor.list.splice(Number(chip.dataset.sizeIdx), 0, moved);
    sizeEditor.dragFrom = null;
    renderSizeEditor();
  });
  chips.addEventListener("dragend", () => {
    sizeEditor.dragFrom = null;
    chips.querySelectorAll(".is-drag, .is-over").forEach(c => c.classList.remove("is-drag", "is-over"));
  });

  renderSizeEditor();
}

// ==========================================================
// THẢ CHUYỀN / CHỈ LỆNH ĐÓNG GÓI / TỔNG HỢP
// Mỗi ngày 4 lần nhận theo size; tích lũy = cộng dồn cả PO tới ngày đang xem
// ==========================================================
const REL_PERM = {
  tcEdit: ["admin", "manager", "feeder", "worker"],
  dgView: ["admin", "manager", "leader", "packer"],
  dgEdit: ["admin", "manager", "leader"],
  leaderConfirm: ["admin", "manager", "leader"],
  packConfirm: ["admin", "packer"],
  summary: ["admin", "manager", "leader"]
};

const REL_ICON = {
  save: '<svg class="rel-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h10l4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2"/><path d="M10 14a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M14 4v4H8V4"/></svg>',
  user: '<svg class="rel-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0-8 0"/><path d="M6 21v-2a4 4 0 0 1 4-4h4"/><path d="M15 19l2 2l4-4"/></svg>',
  pack: '<svg class="rel-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5M16 5.25l-8 4.5"/></svg>'
};

const relState = {
  kind: "tha_chuyen",   // 'tha_chuyen' | 'dong_goi'
  seg: "in",            // 'in' (nhập) | 'sum' (tổng hợp)
  poId: null,
  date: null,
  data: null,           // payload từ /api/release
  day: { tc: {}, dg: {} },   // 4 ô nhận của ngày đang xem (đang gõ)
  base: { tc: {}, dg: {} },  // tích lũy các ngày trước
  dirty: false,
  timer: null,
  saving: Promise.resolve(true),
  seq: 0
};
let relBarSeq = 0;

function relCan(perm) {
  return REL_PERM[perm].includes(getRoleInfo(appState.currentUserRole).key);
}

const relKey = kind => (kind === "tha_chuyen" ? "tc" : "dg");
const relNum = n => (Number(n) || 0).toLocaleString("vi-VN");
const relDaySum = arr => (arr || []).reduce((a, b) => a + (Number(b) || 0), 0);
const relSigned = x => (x > 0 ? "+" : "−") + relNum(Math.abs(x));

// Nhân viên kiểm kê / Người thả chuyền / Đóng gói không có ô chọn ngày -> luôn làm việc với hôm nay
function relWorkDate() {
  const role = getRoleInfo(appState.currentUserRole).key;
  if (role === "worker" || role === "feeder" || role === "packer") return getLocalDateString();
  return appState.currentDate || getLocalDateString();
}

function relUserName() {
  const u = appState.currentUser || {};
  return u.full_name || u.email || u.phone || getRoleInfo(appState.currentUserRole).title;
}

function relFmtDate(iso) {
  const p = String(iso || "").split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

function relFmtTime(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Tích lũy 1 size = các ngày trước (server) + 4 ô của ngày đang xem
function relCum(k, size) {
  return (relState.base[k][size] || 0) + relDaySum(relState.day[k][size]);
}

function relApplyPayload(data, keepLocalDay) {
  relState.data = data;
  const base = { tc: {}, dg: {} };
  [["tc", "tc", "tcCum"], ["dg", "dg", "dgCum"]].forEach(([k, dayKey, cumKey]) => {
    const cum = data[cumKey] || {};
    const day = data[dayKey] || {};
    new Set([...Object.keys(cum), ...Object.keys(day)]).forEach(s => {
      base[k][s] = (Number(cum[s]) || 0) - relDaySum(day[s]);
    });
    if (!keepLocalDay) {
      relState.day[k] = {};
      Object.keys(day).forEach(s => {
        relState.day[k][s] = [0, 1, 2, 3].map(i => Number(day[s][i]) || 0);
      });
    }
  });
  relState.base = base;
}

async function openReleaseModal(target) {
  const kind = target === "sum" ? "dong_goi" : target;
  const seg = target === "sum" ? "sum" : "in";
  if (kind === "tha_chuyen" && !relCan("tcEdit")) return;
  if (kind === "dong_goi" && !relCan(seg === "sum" ? "summary" : "dgView")) return;
  if (!appState.currentPO || !appState.currentPO.id) {
    showToast("⚠️ Chưa chọn PO. Chọn khách hàng và PO ở phía trên trước.");
    return;
  }
  const modal = document.getElementById("modalRelease");
  if (!modal) return;

  clearTimeout(relState.timer);
  Object.assign(relState, {
    kind,
    seg,
    poId: appState.currentPO.id,
    date: relWorkDate(),
    data: null,
    day: { tc: {}, dg: {} },
    base: { tc: {}, dg: {} },
    dirty: false
  });

  modal.dataset.kind = kind;
  modal.style.display = "flex";
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("relTitle").textContent = kind === "tha_chuyen" ? "Thả chuyền" : "Chỉ lệnh đóng gói";
  document.getElementById("relDate").textContent = relFmtDate(relState.date);
  renderReleaseInfo();
  relShowLoading();
  await loadRelease();
}

function renderReleaseInfo() {
  const d = relState.data;
  const po = d && d.po ? d.po : (appState.currentPO || {});
  const cust = appState.customers.find(c => c.id === appState.currentCustomer) || {};
  const custName = d && d.customer ? d.customer.name : (cust.name || "");
  document.getElementById("relInfo").innerHTML =
    `${escHtml(custName)} · ART <b class="rel-art">${escHtml(po.style_code || "—")}</b> · PO <b>${escHtml(po.po_number || "—")}</b> · ĐH <b class="rel-num">${relNum(po.po_plan)}</b> đôi`;
}

function relShowLoading() {
  document.getElementById("relLoading").hidden = false;
  ["relEmpty", "relPaneIn", "relPaneSum", "relSeg"].forEach(id => { document.getElementById(id).hidden = true; });
  document.getElementById("relFoot").innerHTML = "";
}

async function loadRelease() {
  const seq = ++relState.seq;
  try {
    const res = await fetch(`/api/release?po_id=${encodeURIComponent(relState.poId)}&date=${relState.date}&t=${Date.now()}`);
    const data = await res.json();
    if (seq !== relState.seq) return;
    if (!data.success) throw new Error(data.error || "Không tải được số liệu");
    relApplyPayload(data, false);
    renderRelease();
  } catch (err) {
    if (seq !== relState.seq) return;
    document.getElementById("relLoading").hidden = true;
    const empty = document.getElementById("relEmpty");
    empty.hidden = false;
    empty.textContent = `Không tải được số liệu: ${err.message}. Kiểm tra mạng rồi mở lại.`;
    relRenderFoot();
  }
}

function renderRelease() {
  const d = relState.data;
  if (!d) return;
  document.getElementById("relLoading").hidden = true;
  renderReleaseInfo();

  const segBox = document.getElementById("relSeg");
  segBox.hidden = !(relState.kind === "dong_goi" && relCan("summary"));
  if (relState.seg === "sum" && !relCan("summary")) relState.seg = "in";
  segBox.querySelectorAll(".rel-seg-btn").forEach(b => b.classList.toggle("on", b.dataset.relSeg === relState.seg));

  const noSizes = !d.sizes || d.sizes.length === 0;
  const empty = document.getElementById("relEmpty");
  empty.hidden = !noSizes;
  if (noSizes) {
    empty.textContent = "Khách hàng này chưa có dãy size. Quản trị khai báo ở tab Khách hàng & PO.";
    document.getElementById("relPaneIn").hidden = true;
    document.getElementById("relPaneSum").hidden = true;
    segBox.hidden = true;
    relRenderFoot();
    return;
  }

  const showSum = relState.kind === "dong_goi" && relState.seg === "sum";
  document.getElementById("relPaneIn").hidden = showSum;
  document.getElementById("relPaneSum").hidden = !showSum;
  document.getElementById("relChips").hidden = relState.kind !== "dong_goi";
  renderReleaseGrid();
  renderReleaseChips();
  renderReleaseSummary();
  relRenderFoot();
}

function relCanEditCurrent() {
  return relState.kind === "tha_chuyen" ? relCan("tcEdit") : relCan("dgEdit");
}

function renderReleaseGrid() {
  const k = relKey(relState.kind);
  const editable = relCanEditCurrent();
  document.getElementById("relTbody").innerHTML = relState.data.sizes.map(size => {
    const day = relState.day[k][size] || [];
    const cells = [0, 1, 2, 3].map(i => {
      const v = Number(day[i]) || 0;
      return `<td><input type="text" class="rel-input" inputmode="numeric" autocomplete="off" data-size="${escHtml(size)}" data-i="${i}" value="${v || ""}" placeholder="${editable ? "0" : ""}"${editable ? "" : ' readonly tabindex="-1"'} aria-label="Size ${escHtml(size)}, lần nhận ${i + 1}"></td>`;
    }).join("");
    return `<tr><td class="rel-size">${escHtml(size)}</td>${cells}<td><span class="rel-cum" data-cum-size="${escHtml(size)}">${relNum(relCum(k, size))}</span></td></tr>`;
  }).join("");
  renderReleaseTotals();
}

function renderReleaseTotals() {
  const k = relKey(relState.kind);
  const cols = [0, 0, 0, 0];
  let total = 0;
  relState.data.sizes.forEach(size => {
    const day = relState.day[k][size] || [];
    [0, 1, 2, 3].forEach(i => { cols[i] += Number(day[i]) || 0; });
    total += relCum(k, size);
  });
  document.getElementById("relTfoot").innerHTML =
    `<td class="rel-foot-lbl">Tổng</td>${cols.map(v => `<td>${relNum(v)}</td>`).join("")}<td><span class="rel-cum">${relNum(total)}</span></td>`;
}

function relUpdateCums() {
  const k = relKey(relState.kind);
  document.querySelectorAll("#relTbody [data-cum-size]").forEach(el => {
    el.textContent = relNum(relCum(k, el.dataset.cumSize));
  });
  renderReleaseTotals();
}

function renderReleaseChips() {
  if (relState.kind !== "dong_goi") return;
  const c = relState.data.confirm || {};
  const leader = document.getElementById("relChipLeader");
  const pack = document.getElementById("relChipPack");
  leader.classList.toggle("ok", !!c.leader_at);
  leader.textContent = c.leader_at ? `Tổ trưởng: đã xác nhận ${relFmtTime(c.leader_at)}` : "Tổ trưởng: chưa xác nhận";
  leader.title = c.leader_by ? `Người xác nhận: ${c.leader_by}` : "";
  pack.classList.toggle("ok", !!c.packing_at);
  pack.textContent = c.packing_at ? `Đóng gói: đã xác nhận ${relFmtTime(c.packing_at)}` : "Đóng gói: chưa xác nhận";
  pack.title = c.packing_by ? `Người xác nhận: ${c.packing_by}` : "";
}

// So tích lũy thả chuyền với tích lũy đóng gói theo từng size
function relStats() {
  let ok = 0, bad = 0, none = 0, ta = 0, tb = 0;
  const rows = relState.data.sizes.map(size => {
    const a = relCum("tc", size);
    const b = relCum("dg", size);
    ta += a;
    tb += b;
    let state = "bad";
    if (!a && !b) { none++; state = "none"; }
    else if (a === b) { ok++; state = "ok"; }
    else bad++;
    return { size, a, b, diff: b - a, state };
  });
  return { rows, ok, bad, none, ta, tb };
}

function renderReleaseSummary() {
  if (relState.kind !== "dong_goi" || !relState.data) return;
  const st = relStats();
  document.getElementById("relSumBody").innerHTML = st.rows.map(r => {
    const res = r.state === "none"
      ? '<span class="rel-none">—</span>'
      : (r.state === "ok" ? '<span class="rel-ok">OK</span>' : `<span class="rel-diff">${relSigned(r.diff)}</span>`);
    return `<tr><td class="rel-size">${escHtml(r.size)}</td><td class="rel-v-tc">${relNum(r.a)}</td><td class="rel-v-dg">${relNum(r.b)}</td><td>${res}</td></tr>`;
  }).join("");

  const x = st.tb - st.ta;
  let totalRes = '<span class="rel-none">—</span>';
  if (x) totalRes = `<span class="rel-diff">${relSigned(x)}</span>`;
  else if (st.bad) totalRes = '<span class="rel-diff">0</span>';
  else if (st.ta) totalRes = '<span class="rel-ok">OK</span>';
  document.getElementById("relSumFoot").innerHTML =
    `<td class="rel-foot-lbl">Tổng</td><td class="rel-v-tc">${relNum(st.ta)}</td><td class="rel-v-dg">${relNum(st.tb)}</td><td>${totalRes}</td>`;

  const banner = document.getElementById("relBanner");
  banner.className = "rel-banner" + (st.bad ? "" : (st.ok ? " is-ok" : " is-empty"));
  const sub = [`${st.ok} size OK`, st.none ? `${st.none} size chưa có số` : ""].filter(Boolean).join(" · ");
  if (st.bad) {
    banner.innerHTML = `Giao nhận chưa đủ: <span class="rel-diff-txt">${st.bad} size lệch</span><small>${sub}</small>`;
  } else if (st.ok) {
    banner.innerHTML = `Giao nhận đủ, tất cả size đều OK${st.none ? `<small>${st.none} size chưa có số</small>` : ""}`;
  } else {
    banner.textContent = "Chưa có số thả chuyền và đóng gói";
  }
}

function relRenderFoot() {
  const foot = document.getElementById("relFoot");
  const d = relState.data;
  const closeBtn = '<button type="button" class="rel-fbtn rel-fbtn-gray" data-rel-act="close">Đóng</button>';
  if (!d || !d.sizes || !d.sizes.length) {
    foot.style.gridTemplateColumns = "1fr";
    foot.innerHTML = closeBtn;
    return;
  }
  if (relState.kind === "tha_chuyen") {
    foot.style.gridTemplateColumns = "1fr 2fr";
    foot.innerHTML = closeBtn + `<button type="button" class="rel-fbtn rel-fbtn-tc" data-rel-act="save">${REL_ICON.save}Lưu thả chuyền</button>`;
    return;
  }
  if (relState.seg === "sum") {
    foot.style.gridTemplateColumns = "1fr";
    foot.innerHTML = closeBtn;
    return;
  }
  const c = d.confirm || {};
  const btns = [];
  if (relCan("leaderConfirm")) {
    btns.push(`<button type="button" class="rel-fbtn rel-fbtn-leader" data-rel-act="leader"${c.leader_at ? " disabled" : ""}>${REL_ICON.user}${c.leader_at ? "Tổ trưởng đã xác nhận" : "Tổ trưởng xác nhận"}</button>`);
  }
  if (relCan("packConfirm")) {
    btns.push(`<button type="button" class="rel-fbtn rel-fbtn-dg" data-rel-act="packing"${(!c.leader_at || c.packing_at) ? " disabled" : ""}>${REL_ICON.pack}${c.packing_at ? "Đóng gói đã xác nhận" : "Đóng gói xác nhận"}</button>`);
  }
  if (!btns.length) btns.push(closeBtn);
  foot.style.gridTemplateColumns = btns.length > 1 ? "1fr 1fr" : "1fr";
  const hint = relCan("packConfirm") && !c.leader_at
    ? '<div class="rel-hint">Chờ tổ trưởng xác nhận rồi mới bấm Đóng gói xác nhận.</div>'
    : "";
  foot.innerHTML = btns.join("") + hint;
}

function onReleaseInput(e) {
  const el = e.target;
  if (!el.classList.contains("rel-input") || el.readOnly || !relState.data) return;
  const clean = el.value.replace(/\D/g, "").slice(0, 6);
  if (clean !== el.value) el.value = clean;
  const k = relKey(relState.kind);
  const size = el.dataset.size;
  const arr = relState.day[k][size] || [0, 0, 0, 0];
  arr[Number(el.dataset.i)] = parseInt(clean, 10) || 0;
  relState.day[k][size] = arr;
  relUpdateCums();
  renderReleaseSummary();
  relState.dirty = true;
  clearTimeout(relState.timer);
  relState.timer = setTimeout(saveRelease, 800);
}

// Enter = sang ô kế tiếp (giống Excel); ô cuối thì lưu luôn
function onReleaseKeydown(e) {
  if (e.isComposing || e.keyCode === 229) return;
  if (e.key !== "Enter") return;
  const inputs = Array.from(document.querySelectorAll("#relTbody .rel-input:not([readonly])"));
  const idx = inputs.indexOf(e.target);
  if (idx < 0) return;
  e.preventDefault();
  const next = inputs[idx + 1];
  if (next) {
    next.focus();
  } else {
    e.target.blur();
    saveRelease();
  }
}

// Lưu nối tiếp nhau (không gửi chồng); trả về true nếu đã lưu được hoặc không có gì để lưu
function saveRelease() {
  clearTimeout(relState.timer);
  relState.saving = relState.saving.then(async () => {
    if (!relState.dirty || !relState.data) return true;
    const kind = relState.kind;
    const poId = relState.poId;
    const date = relState.date;
    const k = relKey(kind);
    relState.dirty = false;
    const rows = relState.data.sizes.map(size => ({
      size,
      n: [0, 1, 2, 3].map(i => Number((relState.day[k][size] || [])[i]) || 0)
    }));
    try {
      const res = await fetch("/api/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ po_id: poId, date, kind, rows, user: relUserName() })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Lưu không thành công");
      if (relState.poId === poId && relState.date === date && relState.kind === kind) {
        relApplyPayload(data, true);
        relUpdateCums();
        renderReleaseChips();
        renderReleaseSummary();
        relRenderFoot();
      }
      if (data.confirmReset) showToast("⚠️ Đã sửa số đóng gói: tổ trưởng và đóng gói cần xác nhận lại");
      refreshReleaseBar();
      return true;
    } catch (err) {
      relState.dirty = true;
      showToast("⚠️ Chưa lưu được số vừa nhập: " + err.message);
      return false;
    }
  });
  return relState.saving;
}

async function saveAndCloseRelease() {
  const ok = await saveRelease();
  if (ok === false) return;
  showToast(`💾 Đã lưu thả chuyền ngày ${relFmtDate(relState.date)}`);
  closeReleaseModal();
}

async function confirmRelease(step) {
  const ok = await saveRelease();
  if (ok === false) return;
  try {
    const res = await fetch("/api/release/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ po_id: relState.poId, date: relState.date, step, user: relUserName() })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không xác nhận được");
    relApplyPayload(data, true);
    showToast(step === "leader" ? "✅ Tổ trưởng đã xác nhận chỉ lệnh đóng gói" : "✅ Đóng gói đã xác nhận nhận đủ");
    if (step === "packing" && relCan("summary")) relState.seg = "sum";
    renderRelease();
    refreshReleaseBar();
  } catch (err) {
    showToast("⚠️ " + err.message);
  }
}

async function closeReleaseModal() {
  const modal = document.getElementById("modalRelease");
  if (!modal) return;
  const ok = await saveRelease();
  if (ok === false && !confirm("Chưa lưu được số vừa nhập. Vẫn đóng?")) return;
  relState.seq++;
  modal.classList.remove("show");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  refreshReleaseBar();
}

// Thanh "Tổng hợp thả chuyền – đóng gói" trên trang chủ + nút Tổng hợp trên laptop
async function refreshReleaseBar() {
  if (!appState.currentUser || !relCan("summary")) return;
  const bar = document.getElementById("relSumBar");
  const btn = document.querySelector(".rel-btn-sum");
  const setState = (cls, barText, btnText) => {
    [bar, btn].forEach(el => {
      if (!el) return;
      el.classList.remove("is-ok", "is-empty");
      if (cls) el.classList.add(cls);
    });
    const barCount = bar && bar.querySelector("[data-rel-count]");
    if (barCount) barCount.textContent = barText;
    const btnCount = btn && btn.querySelector("[data-rel-count]");
    if (btnCount) btnCount.textContent = btnText;
  };

  const po = appState.currentPO;
  if (!po || !po.id) {
    setState("is-empty", "Chưa có PO", "");
    return;
  }
  const seq = ++relBarSeq;
  try {
    const res = await fetch(`/api/release?po_id=${encodeURIComponent(po.id)}&date=${appState.currentDate || getLocalDateString()}&t=${Date.now()}`);
    const data = await res.json();
    if (seq !== relBarSeq || !data.success) return;
    let ok = 0;
    let bad = 0;
    (data.sizes || []).forEach(s => {
      const a = Number((data.tcCum || {})[s]) || 0;
      const b = Number((data.dgCum || {})[s]) || 0;
      if (!a && !b) return;
      if (a === b) ok++;
      else bad++;
    });
    if (!data.sizes || !data.sizes.length) setState("is-empty", "Chưa có size", "");
    else if (bad) setState("", `${bad} size lệch`, `(${bad} lệch)`);
    else if (ok) setState("is-ok", "Đủ, tất cả OK", "(đủ)");
    else setState("is-empty", "Chưa có số", "");
  } catch (err) {
    // Mất mạng: giữ nguyên trạng thái cũ
  }
}

function bindReleaseEvents() {
  const modal = document.getElementById("modalRelease");
  if (!modal) return;

  document.addEventListener("click", (e) => {
    const opener = e.target.closest("[data-rel-open]");
    if (!opener) return;
    e.preventDefault();
    openReleaseModal(opener.dataset.relOpen);
  });

  document.getElementById("btnRelBack").addEventListener("click", closeReleaseModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeReleaseModal();
      return;
    }
    const seg = e.target.closest("[data-rel-seg]");
    if (seg) {
      relState.seg = seg.dataset.relSeg;
      renderRelease();
      return;
    }
    const act = e.target.closest("[data-rel-act]");
    if (!act || act.disabled) return;
    const a = act.dataset.relAct;
    if (a === "close") closeReleaseModal();
    else if (a === "save") saveAndCloseRelease();
    else if (a === "leader" || a === "packing") confirmRelease(a);
  });

  const tbody = document.getElementById("relTbody");
  tbody.addEventListener("input", onReleaseInput);
  tbody.addEventListener("keydown", onReleaseKeydown);
  tbody.addEventListener("focusin", (e) => {
    if (e.target.classList.contains("rel-input") && !e.target.readOnly) e.target.select();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) closeReleaseModal();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && relState.dirty) saveRelease();
  });
}

// ==========================================================
// CHUYỂN QUYỀN (nút TK): chọn 1 trong 4 quyền, nhập đúng mật khẩu của quyền đó.
// Máy nhớ quyền vừa chuyển nên lần sau mở app không phải chọn lại.
// ==========================================================
const SWITCH_ROLE_LIST = [
  { role: "admin", ico: "AD", desc: "Toàn quyền: khách hàng, PO, tài khoản, mọi báo cáo" },
  { role: "worker", ico: "KK", desc: "Chọn KH, PO và nhập thả chuyền" },
  { role: "leader", ico: "TT", desc: "Đối chiếu NXT, chỉ lệnh đóng gói, tổng hợp" },
  { role: "packer", ico: "ĐG", desc: "Xem chỉ lệnh đóng gói, xác nhận đã nhận đủ" }
];
let rsPickedRole = null;

function rsRoleCard(item, isCurrent, tag) {
  const info = getRoleInfo(item.role);
  return `<span class="rs-role-ico rs-ico-${item.role}">${item.ico}</span>
    <span class="rs-role-text"><span class="rs-role-name">${escHtml(info.title)}</span><span class="rs-role-desc">${escHtml(item.desc)}</span></span>
    ${isCurrent ? `<span class="rs-role-tag">${tag}</span>` : ""}`;
}

function openRoleSwitch() {
  const modal = document.getElementById("modalRoleSwitch");
  if (!modal) return;
  const popover = document.getElementById("userPopoverMenu");
  if (popover) popover.style.display = "none";

  const current = getRoleInfo(appState.currentUserRole).key;
  const who = appState.currentUser ? (appState.currentUser.full_name || appState.currentUser.email || appState.currentUser.phone || "") : "";
  document.getElementById("rsCurrent").innerHTML = `Đang dùng: <b>${escHtml(getRoleInfo(current).title)}</b>${who && who !== getRoleInfo(current).title ? ` · ${escHtml(who)}` : ""}`;
  document.getElementById("rsRoles").innerHTML = SWITCH_ROLE_LIST.map(item => {
    const isCurrent = item.role === current;
    return `<button type="button" class="rs-role${isCurrent ? " is-current" : ""}" data-rs-role="${item.role}"${isCurrent ? " disabled" : ""}>${rsRoleCard(item, isCurrent, "Đang dùng")}</button>`;
  }).join("");

  rsShowPick();
  modal.style.display = "flex";
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeRoleSwitch() {
  const modal = document.getElementById("modalRoleSwitch");
  if (!modal) return;
  modal.classList.remove("show");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  const pw = document.getElementById("rsPassword");
  if (pw) pw.value = "";
}

function rsShowPick() {
  rsPickedRole = null;
  document.getElementById("rsStepPick").hidden = false;
  document.getElementById("rsStepPass").hidden = true;
  document.getElementById("rsError").textContent = "";
}

function rsShowPassword(role) {
  const item = SWITCH_ROLE_LIST.find(x => x.role === role);
  if (!item) return;
  rsPickedRole = role;
  document.getElementById("rsPicked").innerHTML = rsRoleCard(item, false, "");
  document.getElementById("rsStepPick").hidden = true;
  document.getElementById("rsStepPass").hidden = false;
  document.getElementById("rsError").textContent = "";
  document.getElementById("btnRsSubmit").textContent = `Chuyển sang ${getRoleInfo(role).title}`;
  const pw = document.getElementById("rsPassword");
  pw.value = "";
  pw.type = "password";
  document.getElementById("btnRsEye").textContent = "Hiện";
  setTimeout(() => pw.focus(), 50);
}

async function submitRoleSwitch(e) {
  if (e && e.preventDefault) e.preventDefault();
  const pw = document.getElementById("rsPassword");
  const err = document.getElementById("rsError");
  const btn = document.getElementById("btnRsSubmit");
  if (!rsPickedRole) return;
  if (!pw.value) {
    err.textContent = "Nhập mật khẩu của quyền này";
    pw.focus();
    return;
  }

  btn.disabled = true;
  err.textContent = "";
  try {
    const res = await fetch("/api/auth/role-switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: rsPickedRole, password: pw.value })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không chuyển được quyền");

    // Lưu lâu dài để lần sau mở app vào thẳng quyền này
    const user = data.user;
    appState.currentUser = user;
    appState.currentUserRole = user.role;
    try {
      localStorage.setItem("dd_wip_role", user.role);
      localStorage.setItem("dd_user_info", JSON.stringify(user));
      sessionStorage.removeItem("dd_wip_role");
      sessionStorage.removeItem("dd_user_info");
    } catch (storageErr) {
      console.warn("Storage save error:", storageErr);
    }

    // Đang mở popup thả chuyền / đóng gói thì lưu nốt rồi đóng
    const relModal = document.getElementById("modalRelease");
    if (relModal && relModal.classList.contains("show") && typeof closeReleaseModal === "function") {
      await closeReleaseModal();
    }

    applyUserRole(user.role, user);
    closeRoleSwitch();
    showToast(`✅ Đã chuyển sang quyền ${getRoleInfo(user.role).title}`);
    fetchMetadata();
    if (user.role === "admin") fetchUsers();
  } catch (ex) {
    err.textContent = ex.message;
    pw.select();
  } finally {
    btn.disabled = false;
  }
}

function bindRoleSwitchEvents() {
  const modal = document.getElementById("modalRoleSwitch");
  if (!modal) return;

  document.getElementById("btnRsClose").addEventListener("click", closeRoleSwitch);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeRoleSwitch();
      return;
    }
    const pick = e.target.closest("[data-rs-role]");
    if (pick && !pick.disabled) rsShowPassword(pick.dataset.rsRole);
  });
  document.getElementById("rsStepPass").addEventListener("submit", submitRoleSwitch);
  document.getElementById("btnRsBack").addEventListener("click", rsShowPick);
  document.getElementById("rsPassword").addEventListener("input", () => {
    document.getElementById("rsError").textContent = "";
  });
  document.getElementById("btnRsEye").addEventListener("click", () => {
    const pw = document.getElementById("rsPassword");
    const show = pw.type === "password";
    pw.type = show ? "text" : "password";
    document.getElementById("btnRsEye").textContent = show ? "Ẩn" : "Hiện";
  });
  document.getElementById("btnRsAccountLogin").addEventListener("click", () => {
    closeRoleSwitch();
    openRoleModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) closeRoleSwitch();
  });
}

// Tab 04: đặt mật khẩu cho từng quyền
async function loadRolePasswords() {
  const list = document.getElementById("rolePwList");
  if (!list) return;
  try {
    const res = await fetch("/api/role-passwords?t=" + Date.now());
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không tải được");
    const byRole = Object.fromEntries((data.roles || []).map(r => [r.role, r]));
    list.innerHTML = SWITCH_ROLE_LIST.map(item => {
      const st = byRole[item.role] || {};
      const when = st.updated_at ? new Date(st.updated_at).toLocaleDateString("vi-VN") : "";
      return `<div class="role-pw-row" data-role="${item.role}">
        <div class="role-pw-name"><span class="rs-role-ico rs-ico-${item.role}">${item.ico}</span>${escHtml(getRoleInfo(item.role).title)}</div>
        <span class="role-pw-status${st.is_set ? " is-set" : ""}">${st.is_set ? `Đã đặt${when ? " · " + when : ""}` : "Chưa đặt"}</span>
        <input type="password" class="form-control role-pw-input" autocomplete="new-password" placeholder="${st.is_set ? "Gõ mật khẩu mới để đổi" : "Đặt mật khẩu (ít nhất 4 ký tự)"}">
        <button type="button" class="btn btn-primary role-pw-save">Lưu</button>
      </div>`;
    }).join("");
  } catch (err) {
    list.innerHTML = `<div class="role-pw-loading">Không tải được trạng thái mật khẩu: ${escHtml(err.message)}</div>`;
  }
}

async function saveRolePassword(row) {
  const input = row.querySelector(".role-pw-input");
  const role = row.dataset.role;
  const password = input.value;
  if (password.trim().length < 4) {
    showToast("⚠️ Mật khẩu cần ít nhất 4 ký tự");
    input.focus();
    return;
  }
  try {
    const res = await fetch("/api/role-passwords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, password })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không lưu được");
    showToast(`🔐 Đã đặt mật khẩu cho quyền ${getRoleInfo(role).title}`);
    // Chỉ cập nhật dòng vừa lưu, không vẽ lại cả danh sách (giữ mật khẩu đang gõ ở dòng khác)
    const status = row.querySelector(".role-pw-status");
    status.classList.add("is-set");
    status.textContent = `Đã đặt · ${new Date(data.updated_at || Date.now()).toLocaleDateString("vi-VN")}`;
    input.value = "";
    input.placeholder = "Gõ mật khẩu mới để đổi";
  } catch (err) {
    showToast("⚠️ " + err.message);
  }
}

function bindRolePasswordEvents() {
  const list = document.getElementById("rolePwList");
  if (!list) return;
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".role-pw-save");
    if (btn) saveRolePassword(btn.closest(".role-pw-row"));
  });
  list.addEventListener("keydown", (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter" && e.target.classList.contains("role-pw-input")) {
      e.preventDefault();
      saveRolePassword(e.target.closest(".role-pw-row"));
    }
  });
}
