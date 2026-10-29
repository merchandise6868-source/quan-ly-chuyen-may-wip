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
      navigator.serviceWorker.register('/sw.js?v=20261027_1200', { scope: '/' })
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
  bindArtPartsEvents();
  bindManageLayoutEvents();
  bindStageEditorEvents();
  bindOrderPasteEvents();
  bindPackLogEvents();
  bindPackLogMobileEvents();
  bindDatalogEvents();
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
      if (document.getElementById("tab-pack-log")?.classList.contains("active")) loadPackLog();
      if (document.getElementById("tab-manage")?.classList.contains("active")) {
        mgState.newCust = false;
        mgState.nameEdit = false;
        resetPOForm();
        renderManageTab();
      }
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
      } else if (btn.dataset.tab === "tab-pack-log") {
        loadPackLog();
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
  if (btnCancelCust) btnCancelCust.addEventListener("click", cancelCustEdit);

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

// Số tổng (định mức) lô của thẻ NXT lấy theo cấu hình lô hiện tại của PO (dán đơn hàng / sửa PO):
// lô đã có trong báo cáo ngày thì cập nhật số tổng, lô mới của PO thì thêm thẻ trống. Số liệu đã nhập giữ nguyên;
// lô số đuôi vẫn theo quy tắc ngày vét.
function syncReportLotsWithPO(po) {
  const defs = (po && po.default_batches) || [];
  if (!defs.length || !appState.report) return;
  const isTail = b => Boolean(b && (b.is_tail_batch || /đuôi/i.test(String(b.batch_name || ""))));
  const list = appState.report.batches || (appState.report.batches = []);
  defs.forEach((d, i) => {
    if (isTail(d)) return;
    const plan = Number(d.batch_plan || d.into_sewing) || 0;
    const cur = list.find(b => b.batch_name === d.batch_name);
    if (cur) {
      if (plan) cur.batch_plan = plan;
      return;
    }
    list.push({
      id: d.id || `b-${i + 1}`, batch_name: d.batch_name, batch_plan: plan,
      into_sewing: 0, delivered: 0, wip_sewing: 0, wip_qc: 0, wip_pairing: 0, wip_packing: 0, wip_warehouse: 0,
      daily_out: 0, daily_finished: 0,
      note_sewing: "", note_qc: "", note_pairing: "", note_packing: "", note_warehouse: "",
      shortage_reason_type: "", shortage_note: "", shortage_mat_xac: 0, shortage_hang_phe: 0, shortage_khac: 0,
      is_tail_batch: false
    });
  });
  // Lô không còn trong PO (ví dụ đã tách sang PO màu khác khi dán đơn) mà chưa có số nào thì bỏ thẻ;
  // lô có số trong ngày hoặc có lũy kế các ngày trước thì giữ để không mất số liệu
  const nums = ["into_sewing", "delivered", "daily_out", "daily_finished", "wip_sewing", "wip_qc", "wip_pairing", "wip_packing", "wip_warehouse", "shortage_mat_xac", "shortage_hang_phe", "shortage_khac"];
  const notes = ["note_sewing", "note_qc", "note_pairing", "note_packing", "note_warehouse", "note_export", "shortage_note"];
  const hasData = b => nums.some(k => Number(b[k]) > 0) || notes.some(k => String(b[k] || "").trim())
    || Number((appState.cumImportsByBatch || {})[b.batch_name]) > 0 || Number((appState.cumExportsByBatch || {})[b.batch_name]) > 0;
  const kept = list.filter(b => isTail(b) || defs.some(d => d.batch_name === b.batch_name) || hasData(b));
  // Thẻ xếp theo thứ tự lô của PO; lô không còn trong PO để sau, lô số đuôi cuối cùng
  const rank = b => {
    if (isTail(b)) return 1000;
    const k = defs.findIndex(d => d.batch_name === b.batch_name);
    return k < 0 ? 500 : k;
  };
  kept.sort((a, b) => rank(a) - rank(b));
  appState.report.batches = kept;
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

      syncReportLotsWithPO(po);

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
// Trạng thái khung bên phải tab 03: đang thêm khách mới / đang sửa tên / mục đang mở / biểu mẫu PO đang mở
const mgState = { newCust: false, nameEdit: false, tab: "po", poFormOpen: false };
try {
  const savedTab = localStorage.getItem("dd_mg_tab");
  if (["size", "art", "stage", "po"].includes(savedTab)) mgState.tab = savedTab;
} catch (e) {}

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

  // 6. Khách đang chọn: nạp tên, mã, dãy size vào khung bên phải (trừ khi đang thêm khách mới)
  if (!mgState.newCust) {
    const editingId = document.getElementById("editCustId")?.value || "";
    if (appState.currentCustomer && editingId !== appState.currentCustomer) fillCustomerForm(appState.currentCustomer);
  }
  renderMgHead();

  // 7. Khung dãy size + xem trước bảng trên điện thoại + chi tiết theo ART
  renderSizeEditor();
  refreshLotSizeChips();
  loadArtParts(appState.currentCustomer);
  if (!stageEditor.dirty || stageEditor.customerId !== appState.currentCustomer) loadStageEditor(appState.currentCustomer);
  else renderStageSideInfo();
}

// 1. DANH SÁCH KHÁCH HÀNG (CỘT TRÁI)
function renderCustomerTable() {
  const list = document.getElementById("tbodyCustomers");
  const hdrCount = document.getElementById("statCustHeaderCount");
  if (hdrCount) hdrCount.innerText = appState.customers.length;

  if (!list) return;

  if (appState.customers.length === 0) {
    list.innerHTML = `<div class="mg-cust-empty">Chưa có khách hàng nào. Bấm <b>+ Thêm</b> để bắt đầu.</div>`;
    return;
  }

  list.innerHTML = appState.customers.map(c => {
    const isSelected = c.id === appState.currentCustomer && !mgState.newCust;
    const custPOCount = appState.orders.filter(o => o.customer_id === c.id).length;
    return `<button type="button" class="customer-row-item mg-cust-item${isSelected ? " selected-cust-row" : ""}" data-id="${escHtml(c.id)}" title="Chọn ${escHtml(c.name)}">
      <span class="mg-cust-item-name">${escHtml(c.name)}</span>
      <span class="mg-cust-item-meta"><span class="mg-cust-item-code">${escHtml(c.code)}</span>${sizeBriefHtml(getCustomerSizes(c))}<span class="mg-cust-item-po">${custPOCount} PO</span></span>
    </button>`;
  }).join("");
}

// 2. SELECT CUSTOMER IN TAB 3 (SYNC SELECTION, HIGHLIGHT & ORDERS TABLE)
function selectCustomerInManageTab(custId) {
  appState.currentCustomer = custId;
  try { localStorage.setItem("dd_last_customer_id", custId || ""); } catch (err) {}

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
  refreshLotSizeChips();
  loadArtParts(custId);
  loadStageEditor(custId);
}

// 3. DANH SÁCH PO CỦA KHÁCH ĐANG CHỌN (có ô tìm theo số PO / ART)
function renderOrdersTable(customerId) {
  const tbodyOrders = document.getElementById("tbodyOrders");
  const lblCustTitle = document.getElementById("lblSelectedCustTitle");
  const badgePoCount = document.getElementById("badgeSelectedCustPoCount");

  const cust = appState.customers.find(c => c.id === customerId);
  if (lblCustTitle) lblCustTitle.innerText = cust ? cust.name : "";

  const custOrders = customerId
    ? appState.orders.filter(o => o.customer_id === customerId)
    : appState.orders;
  if (badgePoCount) badgePoCount.innerText = custOrders.length;

  if (!tbodyOrders) return;

  const q = (document.getElementById("poSearchInput")?.value || "").trim().toLowerCase();
  const filteredOrders = q
    ? custOrders.filter(o => `${o.po_number} ${o.style_code}`.toLowerCase().includes(q))
    : custOrders;

  if (filteredOrders.length === 0) {
    const msg = custOrders.length
      ? `Không có PO nào khớp “${escHtml(q)}”.`
      : `${cust ? escHtml(cust.name) : "Khách hàng"} chưa có đơn hàng PO nào. Bấm <b>+ Thêm PO</b> để tạo.`;
    tbodyOrders.innerHTML = `<tr><td colspan="6" class="mg-table-empty">${msg}</td></tr>`;
    return;
  }

  const editingId = document.getElementById("editOrderId")?.value || "";
  // Gom PO theo đợt đã dán (PO chưa có đợt xếp cuối)
  const hasWave = filteredOrders.some(o => o.wave);
  const waveNames = [...new Set(filteredOrders.map(o => o.wave || ""))]
    .sort((a, b) => (a ? 0 : 1) - (b ? 0 : 1) || a.localeCompare(b, "vi", { numeric: true }));
  const ordered = hasWave ? waveNames.flatMap(w => filteredOrders.filter(o => (o.wave || "") === w)) : filteredOrders;
  let lastWave = null;
  tbodyOrders.innerHTML = ordered.map(o => {
    let waveRow = "";
    if (hasWave && (o.wave || "") !== lastWave) {
      lastWave = o.wave || "";
      const n = ordered.filter(x => (x.wave || "") === lastWave).length;
      waveRow = `<tr class="mg-wave-row"><td colspan="6">${escHtml(lastWave || "Chưa ghi đợt")}<span>${n} PO</span></td></tr>`;
    }
    const nSizes = Object.keys(getOrderSizes(o)).length;
    const batchTags = (o.default_batches || []).map(b => {
      const qty = Number(b.into_sewing || b.batch_plan) || 0;
      const sz = Array.isArray(b.sizes) && b.sizes.length ? ` · ${sizeBriefText(b.sizes.map(String))}` : "";
      return `<span class="mg-lot-tag"><b>${escHtml(b.batch_name)}</b>${b.color ? ` <i class="mg-lot-color">${escHtml(b.color)}</i>` : ""} ${qty.toLocaleString("vi-VN")}${escHtml(sz)}</span>`;
    }).join("");

    return waveRow + `<tr${o.id === editingId ? ' class="is-editing"' : ""}>
      <td class="mg-po-num">${escHtml(o.po_number)}${o.crd ? `<small class="mg-ord-n">CRD ${escHtml(relFmtDate(o.crd))}</small>` : ""}</td>
      <td class="mg-art">${escHtml(o.style_code)}</td>
      <td>${escHtml(o.line_name)}</td>
      <td class="mg-num">${(Number(o.po_plan) || 0).toLocaleString("vi-VN")}${nSizes ? `<small class="mg-ord-n">đơn ${nSizes} size</small>` : ""}</td>
      <td class="mg-lots">${batchTags || '<span class="mg-muted">Chưa chia lô</span>'}</td>
      <td class="mg-row-actions">
        <button type="button" class="mg-row-btn btn-edit-po" data-id="${escHtml(o.id)}" title="Sửa đơn hàng &amp; chia lô">Sửa</button>
        <button type="button" class="mg-row-btn is-danger btn-delete-po" data-id="${escHtml(o.id)}" data-ponum="${escHtml(o.po_number)}" title="Xóa đơn hàng PO">Xóa</button>
      </td>
    </tr>`;
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

      refreshPoArtOptions(order.customer_id, order.style_code);

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

      poFormState.grid = initOrderGrid(order);
      renderBatchInputBoxes(batchCount, batches);

      const btnSubmitPO = document.getElementById("btnSubmitPO");
      if (btnSubmitPO) btnSubmitPO.innerText = "Cập nhật PO";
      const mode = document.getElementById("poFormMode");
      if (mode) mode.textContent = `Sửa PO ${order.po_number}`;
      tbodyOrders.querySelectorAll("tr").forEach(tr => tr.classList.toggle("is-editing", tr.contains(btn)));
      setPoFormOpen(true);

      const formPO = document.getElementById("formAddPO");
      if (formPO) formPO.scrollIntoView({ behavior: "smooth", block: "start" });
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
            if ((document.getElementById("editOrderId")?.value || "") === id) resetPOForm();
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

// ---- Khung bên phải tab 03: tiêu đề khách, 3 mục (Dãy size / ART & chi tiết / Đơn hàng PO) ----
function renderMgHead() {
  const detail = document.getElementById("mgDetail");
  if (!detail) return;
  const cust = appState.customers.find(c => c.id === appState.currentCustomer);
  const isNew = mgState.newCust || !cust;
  detail.classList.toggle("is-new", isNew);
  detail.classList.toggle("is-editing-name", isNew || mgState.nameEdit);

  const nameEl = document.getElementById("mgCustName");
  if (nameEl) nameEl.textContent = cust ? cust.name : "";
  const codeEl = document.getElementById("mgCustCode");
  if (codeEl) codeEl.textContent = cust ? cust.code : "";
  const title = document.getElementById("mgFormTitle");
  if (title) title.textContent = isNew ? "Thêm khách hàng mới" : "Sửa tên khách hàng";
  const btnSave = document.getElementById("btnSaveCustName");
  if (btnSave) btnSave.textContent = isNew ? "+ Thêm khách hàng" : "Lưu tên";
  const btnCancel = document.getElementById("btnCancelEditCust");
  if (btnCancel) btnCancel.hidden = isNew && !appState.customers.length;

  applyMgTab(isNew ? "size" : mgState.tab);
}

function applyMgTab(tab) {
  document.querySelectorAll("#mgDetail [data-mg-tab]").forEach(b => {
    const on = b.dataset.mgTab === tab;
    b.classList.toggle("on", on);
    b.setAttribute("aria-selected", on ? "true" : "false");
  });
  document.querySelectorAll("#mgDetail [data-mg-panel]").forEach(p => {
    p.hidden = p.dataset.mgPanel !== tab;
  });
}

function setMgTab(tab) {
  if (!["size", "art", "stage", "po"].includes(tab)) return;
  mgState.tab = tab;
  try { localStorage.setItem("dd_mg_tab", tab); } catch (e) {}
  applyMgTab(tab);
}

// Biểu mẫu thêm / sửa PO chỉ mở khi bấm "+ Thêm PO" hoặc "Sửa"
function setPoFormOpen(open) {
  mgState.poFormOpen = !!open;
  const form = document.getElementById("formAddPO");
  if (form) form.classList.toggle("is-open", mgState.poFormOpen);
  const btn = document.getElementById("btnTogglePoForm");
  if (btn) {
    btn.textContent = mgState.poFormOpen ? "Đóng biểu mẫu" : "+ Thêm PO";
    btn.classList.toggle("is-open", mgState.poFormOpen);
  }
  renderLotPreview();
}

function startNewCustomer() {
  mgState.newCust = true;
  mgState.nameEdit = false;
  resetPOForm();
  resetCustomerForm();
  renderCustomerTable();
  renderMgHead();
  document.getElementById("custName")?.focus();
}

// Hủy thêm khách mới / hủy sửa tên: trả lại khách đang chọn
function cancelCustEdit() {
  const wasNew = mgState.newCust;
  mgState.newCust = false;
  mgState.nameEdit = false;
  if (wasNew) {
    if (appState.currentCustomer) fillCustomerForm(appState.currentCustomer);
  } else {
    const cust = appState.customers.find(c => c.id === appState.currentCustomer);
    const elName = document.getElementById("custName");
    const elCode = document.getElementById("custCode");
    if (cust && elName) elName.value = cust.name || "";
    if (cust && elCode) elCode.value = cust.code || "";
  }
  renderCustomerTable();
  renderMgHead();
}

async function deleteCustomer(id) {
  const cust = appState.customers.find(c => c.id === id);
  if (!cust) return;
  if (!confirm(`Xóa khách hàng "${cust.name}" (${cust.code}) cùng toàn bộ đơn hàng PO liên quan?`)) return;
  try {
    const res = await fetch(`/api/customers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã xóa khách hàng "${cust.name}"`);
      if (appState.currentCustomer === id) appState.currentCustomer = null;
      mgState.nameEdit = false;
      resetCustomerForm();
      resetPOForm();
      fetchMetadata();
    } else {
      alert("Không thể xóa khách hàng: " + (data.error || "Vui lòng thử lại"));
    }
  } catch (err) {
    alert("Không thể xóa khách hàng: " + err.message);
  }
}

function bindManageLayoutEvents() {
  document.getElementById("tbodyCustomers")?.addEventListener("click", (e) => {
    const item = e.target.closest(".mg-cust-item");
    if (!item) return;
    const custId = item.dataset.id;
    if (stageEditor.dirty && custId !== stageEditor.customerId && !confirm("Bảng công đoạn chưa lưu. Bỏ các thay đổi và chuyển khách?")) return;
    const changed = custId !== appState.currentCustomer || mgState.newCust;
    mgState.newCust = false;
    mgState.nameEdit = false;
    if (changed) {
      resetPOForm();
      closeOrderPaste();
    }
    selectCustomerInManageTab(custId);
    fillCustomerForm(custId);
    renderCustomerTable();
    renderMgHead();
  });
  document.getElementById("btnNewCust")?.addEventListener("click", startNewCustomer);
  document.getElementById("btnEditCustName")?.addEventListener("click", () => {
    mgState.nameEdit = true;
    renderMgHead();
    document.getElementById("custName")?.focus();
  });
  document.getElementById("btnDeleteCust")?.addEventListener("click", () => deleteCustomer(appState.currentCustomer));
  document.getElementById("mgDetail")?.addEventListener("click", (e) => {
    const tabBtn = e.target.closest("[data-mg-tab]");
    if (tabBtn) {
      setMgTab(tabBtn.dataset.mgTab);
      return;
    }
    const goto = e.target.closest("[data-mg-goto]");
    if (goto) {
      setMgTab(goto.dataset.mgGoto);
      document.querySelector("#artPartsList .art-new-input")?.focus();
    }
  });
  document.getElementById("btnTogglePoForm")?.addEventListener("click", () => {
    if (mgState.poFormOpen) {
      resetPOForm();
      return;
    }
    resetPOForm();
    closeOrderPaste();
    refreshPoArtOptions();
    setPoFormOpen(true);
    document.getElementById("poNumber")?.focus();
  });
  document.getElementById("poSearchInput")?.addEventListener("input", () => renderOrdersTable(appState.currentCustomer));
}

// ==========================================================
// ĐƠN HÀNG THEO SIZE: dán từ Excel theo đợt (tab 03), hiện trên biểu mẫu PO
// ==========================================================
const poFormState = { grid: null };   // bảng đơn theo size của PO đang sửa (xem initOrderGrid)
const orderPaste = { parsed: null };

const ORDER_PO_LABEL = /^(po|ry|ry no\.?|số po|so po|po no\.?|po number|po#|đơn hàng|don hang)$/i;
const ORDER_ART_LABEL = /^(art|art no\.?|article|mã hàng|ma hang|mã art|ma art|style)$/i;
const ORDER_LOT_LABEL = /^(clsx|lô|lo|lot|lô sx|lo sx|lô sản xuất|lo san xuat)$/i;
const ORDER_COLOR_LABEL = /^(mã màu|ma mau|màu|mau|color|colour)$/i;
const ORDER_CRD_LABEL = /^(crd|ngày giao|ngay giao|delivery|ngày xuất|ngay xuat)$/i;
const ORDER_WAVE_LABEL = /^(đợt|dot|đợt giao|wave)$/i;
const ORDER_TOTAL_LABEL = /^(tổng|tong|total|cộng|cong|sum)/i;
const ORDER_WAVE_LINE = /^(đợt|dot|lần|lan|wave)(\s|\d|$)/i;
const ORDER_STT_LABEL = /^(stt|tt|số tt|so tt|số thứ tự|so thu tu)$/i;
const isOrderLabel = c => [ORDER_PO_LABEL, ORDER_ART_LABEL, ORDER_LOT_LABEL, ORDER_COLOR_LABEL, ORDER_CRD_LABEL, ORDER_WAVE_LABEL, ORDER_TOTAL_LABEL, ORDER_STT_LABEL].some(re => re.test(c));

function getOrderSizes(o) {
  let v = o ? o.size_qty : null;
  if (typeof v === "string") {
    try { v = JSON.parse(v || "{}"); } catch (e) { v = {}; }
  }
  const out = {};
  if (v && typeof v === "object" && !Array.isArray(v)) {
    Object.entries(v).forEach(([k, q]) => { if (Number(q) > 0) out[k] = Number(q); });
  }
  return out;
}

const orderQty = cell => {
  const t = String(cell || "").replace(/[.,\s]/g, "");
  return /^\d+$/.test(t) ? parseInt(t, 10) : 0;
};

// Cột tiêu đề là size: có trong dãy size của khách, hoặc trông giống size (số, chữ S M L XL, 4T-5T)
function isOrderSizeLike(h, known) {
  const v = String(h || "").trim();
  if (!v) return false;
  return known.has(v.toLowerCase())
    || /^\d{1,2}([.,]5)?$/.test(v)
    || /^(\d?x{0,4}s|s|m|l|\d?x{0,4}l)$/i.test(v)
    || /^\d{1,2}\s*t?\s*-\s*\d{1,2}\s*t?$/i.test(v)
    || /^\d{1,2}t$/i.test(v);
}

// Tách dữ liệu copy từ Excel: Tab giữa các ô, xuống dòng giữa các hàng; ô có xuống dòng (ví dụ "CÔNG
// ĐOẠN") được Excel bọc trong dấu ngoặc kép. Không có Tab (gõ tay) thì tách theo khoảng trắng.
function parseOrderGrid(text) {
  const src = String(text || "").replace(/\r\n?/g, "\n");
  if (!src.includes("\t")) return src.split("\n").map(l => l.trim() ? l.trim().split(/\s+/) : []);
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === "") quoted = true;
    else if (ch === "\t") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows.map(r => r.map(c => c.replace(/\s+/g, " ").trim()));
}

// "Lô 1", "lo 1", "1" -> "Lô 1"
function normalizeLotName(v) {
  const t = String(v || "").trim();
  const m = t.match(/^(?:lô|lo|lot)?\s*(\d+)$/i);
  return m ? `Lô ${parseInt(m[1], 10)}` : t.slice(0, 40);
}

// CRD dạng ngày/tháng/năm (3/11/2026, 03.11.2026) hoặc 2026-11-03 -> 2026-11-03
function parseCrdDate(v) {
  const t = String(v || "").trim();
  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  m = t.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!m) return "";
  const y = m[3].length === 2 ? `20${m[3]}` : m[3];
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[1], 10);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return "";
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Tên đợt: dòng "Đợt ..." giữ nguyên; dòng tiêu đề có ngày (… 20.10.2026) -> "Đợt 20.10.2026"
function orderWaveName(line) {
  const t = String(line || "").replace(/\s+/g, " ").trim();
  if (ORDER_WAVE_LINE.test(t)) return t.slice(0, 60);
  const m = t.match(/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/);
  return (m ? `Đợt ${m[0]}` : t).slice(0, 60);
}

// Đọc bảng đơn hàng dán từ Excel. Hai dạng:
//  - mỗi dòng 1 PO: PO | ART | size... | Tổng (đợt theo dòng "Đợt ..." phía trên)
//  - mỗi dòng 1 lô: STT | CLSX (lô) | RY (PO) | ART | Mã màu | CRD | Tổng | size... (đợt theo dòng tiêu đề)
// Cùng RY là 1 PO (không tách theo màu, màu ghi ở từng lô). CLSX lặp lại theo màu (Lô 1-5, Lô 1-3)
// thì đánh số lô liên tục Lô 1..N theo thứ tự dòng.
function parseOrderPaste(text, custId) {
  const cust = appState.customers.find(c => c.id === custId);
  const known = new Set(getCustomerSizes(cust).map(x => x.toLowerCase()));
  const waves = [];
  const sizeCols = [];
  const pos = new Map();   // tên PO (thường) -> PO
  let cur = null;
  let head = null;
  let prevRow = [];
  const ensureWave = name => {
    let w = waves.find(x => x.name === name);
    if (!w) {
      w = { name, pos: [] };
      waves.push(w);
    }
    return w;
  };
  parseOrderGrid(text).forEach(cells => {
    const filled = cells.filter(Boolean);
    if (!filled.length) return;
    if (cells.some(c => ORDER_PO_LABEL.test(c))) {
      const at = re => cells.findIndex(c => re.test(c));
      let total = at(ORDER_TOTAL_LABEL);
      if (total < 0) total = prevRow.findIndex(c => ORDER_TOTAL_LABEL.test(c));
      head = {
        po: at(ORDER_PO_LABEL), art: at(ORDER_ART_LABEL), lot: at(ORDER_LOT_LABEL), color: at(ORDER_COLOR_LABEL),
        crd: at(ORDER_CRD_LABEL), wave: at(ORDER_WAVE_LABEL), stt: at(ORDER_STT_LABEL), total, sizes: []
      };
      head.sizes = cells.map((c, i) => ({ size: c, i })).filter(x => x.i !== total && x.size && !isOrderLabel(x.size) && isOrderSizeLike(x.size, known));
      head.sizes.forEach(x => { if (!sizeCols.some(c => c.toLowerCase() === x.size.toLowerCase())) sizeCols.push(x.size); });
      return;
    }
    const hasQty = head && head.sizes.some(x => orderQty(cells[x.i]) > 0);
    if (!hasQty) {
      if (ORDER_WAVE_LINE.test(filled[0]) || filled.length === 1) cur = ensureWave(orderWaveName(filled.join(" ")));
      prevRow = cells;
      return;
    }
    if (ORDER_TOTAL_LABEL.test(filled[0])) return;
    const get = i => (i >= 0 ? String(cells[i] || "").trim() : "");
    const ry = get(head.po);
    const color = get(head.color).slice(0, 30);
    const name = ry.slice(0, 60);
    const key = name.toLowerCase();
    const sizes = {};
    head.sizes.forEach(x => {
      const q = orderQty(cells[x.i]);
      if (q) sizes[x.size] = (sizes[x.size] || 0) + q;
    });
    const waveName = head.wave >= 0 && get(head.wave) ? get(head.wave).slice(0, 60) : (cur ? cur.name : "");
    let po = pos.get(key);
    if (!po || head.lot < 0) {
      if (po) po.dupRows = (po.dupRows || 0) + 1;   // dạng mỗi dòng 1 PO: dán trùng PO thì lấy dòng sau
      po = { key, name, ry, colors: [], art: get(head.art), crd: parseCrdDate(get(head.crd)), lots: [], sizes: {}, dupRows: po ? po.dupRows : 0 };
      if (!pos.has(key)) ensureWave(waveName).pos.push(po);
      else {
        const w = waves.find(x => x.pos.some(p => p.key === key));
        w.pos[w.pos.findIndex(p => p.key === key)] = po;
      }
      pos.set(key, po);
    }
    if (!po.art) po.art = get(head.art);
    if (!po.crd) po.crd = parseCrdDate(get(head.crd));
    if (color && !po.colors.includes(color)) po.colors.push(color);
    if (head.lot >= 0) {
      const lotName = normalizeLotName(get(head.lot));
      // Cùng lô, cùng màu dán 2 lần thì lấy dòng sau; cùng tên lô khác màu là lô khác (đánh số lại bên dưới)
      const dup = po.lots.find(l => l.name === lotName && l.color === color && !l.error);
      if (dup) dup.error = "Lô trùng, lấy dòng sau";
      po.lots.push({ name: lotName, color, stt: orderQty(get(head.stt)), sizes, total: Object.values(sizes).reduce((a, b) => a + b, 0), sheetTotal: orderQty(get(head.total)), crd: parseCrdDate(get(head.crd)), error: lotName ? "" : "Thiếu tên lô" });
    } else {
      po.sizes = sizes;
      po.sheetTotal = orderQty(get(head.total));
    }
  });

  // Cộng các lô thành đơn của PO; so với PO / ART đang có để ghi chú và chọn PO đích
  const myOrders = appState.orders.filter(o => o.customer_id === custId);
  const byName = new Map();
  myOrders.forEach(o => {
    const k = String(o.po_number || "").trim().toLowerCase();
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(o);
  });
  const arts = new Set(customerArts(custId).map(a => a.toLowerCase()));
  const all = waves.flatMap(w => w.pos);
  const regularLots = o => (o.default_batches || []).filter(b => !/đuôi/i.test(String(b.batch_name || "")));
  // Số lô của bảng dán có số tổng trùng với lô của PO cũ (mỗi lô cũ chỉ khớp 1 lần)
  const lotScore = (po, o) => {
    const pool = regularLots(o).map(b => Number(b.batch_plan) || 0);
    let n = 0;
    po.lots.filter(l => !l.error).forEach(l => {
      const i = pool.indexOf(l.total);
      if (i >= 0) {
        n++;
        pool.splice(i, 1);
      }
    });
    return n;
  };
  const newer = (a, b) => String(b.created_at || "").localeCompare(String(a.created_at || ""));
  const used = new Set();
  all.forEach(po => {
    po.preNotes = [];
    if (po.lots.length) {
      const okLots = po.lots.filter(l => !l.error);
      // Tên lô lặp lại (CLSX đánh lại từ 1 cho mỗi màu): đánh số liên tục Lô 1..N theo thứ tự dòng
      if (new Set(okLots.map(l => l.name)).size < okLots.length) {
        okLots.forEach((l, i) => {
          l.sheetName = l.name;
          l.name = `Lô ${i + 1}`;
        });
        po.preNotes.push(["up", `Đánh số lô liên tục Lô 1 → Lô ${okLots.length}`]);
      }
      const stt = okLots.map(l => l.stt);
      if (stt.every(Boolean) && stt.some((s, i) => i && s !== stt[i - 1] + 1)) po.preNotes.push(["warn", "STT không liên tục, kiểm tra có đúng cùng 1 đơn"]);
      po.sizes = {};
      okLots.forEach(l => Object.entries(l.sizes).forEach(([k, q]) => { po.sizes[k] = (po.sizes[k] || 0) + q; }));
    }
    po.total = Object.values(po.sizes).reduce((a, b) => a + b, 0);
    po.target = null;
  });
  // Cùng số PO: PO có chia lô thì chỉ cập nhật PO cũ có lô khớp (ít nhất 60% số lô) hoặc PO cũ chưa chia lô.
  // PO cùng tên mà lô không khớp (đơn đợt trước) thì giữ nguyên và tạo PO mới, không ghi đè.
  all.forEach(po => {
    const cands = (byName.get(po.key) || []).filter(o => !used.has(o.id));
    if (!cands.length) return;
    const nLots = po.lots.filter(l => !l.error).length;
    const fits = nLots ? cands.filter(o => lotScore(po, o) >= Math.ceil(nLots * 0.6) || regularLots(o).length <= 1) : cands;
    const best = fits.slice().sort((a, b) => lotScore(po, b) - lotScore(po, a) || newer(a, b))[0];
    if (best) {
      po.target = best;
      used.add(best.id);
    }
    const kept = cands.filter(o => o !== best);
    if (kept.length) po.preNotes.push(["keep", `Giữ nguyên PO ${po.name} cũ (${kept.map(o => relNum(o.po_plan) + " đôi").join(", ")})${nLots ? " vì lô không khớp" : ""}`]);
  });
  all.forEach(po => {
    po.notes = [...po.preNotes];
    po.error = !po.ry ? "Thiếu số PO / RY"
      : !po.total ? "Không có số size"
      : (!po.art && !po.target) ? "Thiếu ART" : "";
    if (po.error) return;
    if (po.dupRows) po.notes.push(["warn", "PO dán trùng, lấy dòng sau"]);
    if (po.colors.length > 1) po.notes.push(["keep", `${po.colors.length} màu: ${po.colors.join(", ")}`]);
    if (po.target) {
      po.notes.push(Number(po.target.po_plan) !== po.total ? ["up", `Kế hoạch ${relNum(po.target.po_plan)} → ${relNum(po.total)}`] : ["keep", "Cập nhật số theo size"]);
      if (po.target.wave && po.target.wave !== (waves.find(w => w.pos.includes(po)) || {}).name) po.notes.push(["keep", `Trước: ${po.target.wave}`]);
    } else {
      po.notes.push(["new", "PO mới"]);
    }
    if (po.art && !arts.has(po.art.toLowerCase())) po.notes.push(["art", "ART mới"]);
    const okLots = po.lots.filter(l => !l.error);
    if (okLots.length) {
      const old = po.target ? regularLots(po.target) : [];
      const same = old.length === okLots.length && okLots.every(l => old.some(b => b.batch_name === l.name && Number(b.batch_plan) === l.total));
      po.notes.push(same ? ["keep", `${okLots.length} lô khớp chia lô cũ`] : ["up", `Chia ${okLots.length} lô${old.length ? ` (trước: ${old.length} lô)` : ""}`]);
    }
    if (!po.lots.length && po.sheetTotal && po.sheetTotal !== po.total) po.notes.push(["warn", `Cột Tổng ghi ${relNum(po.sheetTotal)}`]);
    po.lots.forEach(l => { if (!l.error && l.sheetTotal && l.sheetTotal !== l.total) l.warn = `Cột Tổng ghi ${relNum(l.sheetTotal)}`; });
  });
  // Chỉ lấy cột size có số (cột size trống cả bảng thì bỏ, không tính là size mới)
  const usedSizes = sizeCols.filter(x => all.some(p => p.sizes[x] || p.lots.some(l => l.sizes[x])));
  return { waves, sizeCols: usedSizes, newSizes: usedSizes.filter(x => !known.has(x.toLowerCase())), hasHead: !!head, hasLots: !!(head && head.lot >= 0) };
}

function setOrderPasteOpen(open) {
  const panel = document.getElementById("poPastePanel");
  if (!panel) return;
  panel.hidden = !open;
  document.getElementById("btnTogglePaste")?.classList.toggle("is-open", open);
  if (open) {
    const cust = appState.customers.find(c => c.id === appState.currentCustomer);
    document.getElementById("poPasteCust").textContent = cust ? cust.name : "";
    document.getElementById("poPasteBox").focus();
  }
}

function closeOrderPaste() {
  orderPaste.parsed = null;
  const box = document.getElementById("poPasteBox");
  if (box) box.value = "";
  const pv = document.getElementById("poPastePreview");
  if (pv) pv.innerHTML = "";
  setOrderPasteOpen(false);
}

function readOrderPaste() {
  const box = document.getElementById("poPasteBox");
  const pv = document.getElementById("poPastePreview");
  if (!box || !pv) return;
  const parsed = parseOrderPaste(box.value, appState.currentCustomer);
  orderPaste.parsed = parsed;
  const all = parsed.waves.flatMap(w => w.pos);
  if (!parsed.hasHead || !all.length) {
    pv.innerHTML = `<div class="mg-paste-err">Chưa đọc được dòng nào. Cần có dòng tiêu đề gồm cột <b>PO</b> (hoặc <b>RY</b>), <b>ART</b> và các cột size, bên dưới là các dòng PO hoặc các dòng lô (cột <b>CLSX</b>).</div>`;
    return;
  }
  const ok = all.filter(p => !p.error);
  const nNew = ok.filter(p => !p.target).length;
  const nLots = ok.reduce((a, p) => a + p.lots.filter(l => !l.error).length, 0);
  const newArts = [...new Set(ok.filter(p => p.notes.some(n => n[0] === "art")).map(p => p.art))];
  const badLots = all.reduce((a, p) => a + p.lots.filter(l => l.error).length, 0);
  const bad = all.length - ok.length;
  const sz = parsed.sizeCols;
  const cols = sz.length + 6;
  const sizeCells = (m, cls) => sz.map(x => `<td class="${m[x] ? cls : "mg-muted"}">${m[x] ? relNum(m[x]) : "·"}</td>`).join("");
  const notesHtml = (list, error) => error ? `<span class="mg-note is-bad">${escHtml(error)}</span>` : list.map(n => `<span class="mg-note is-${n[0]}">${escHtml(n[1])}</span>`).join("");
  const body = parsed.waves.map((w, wi) => w.pos.length ? `<tr class="mg-wave-row"><td colspan="${cols}"><input type="text" class="mg-wave-input" data-wave-idx="${wi}" value="${escHtml(w.name)}" placeholder="Tên đợt" maxlength="60" aria-label="Tên đợt"><span>${w.pos.length} PO</span></td></tr>`
    + w.pos.map(po => {
      const head = `<td class="mg-po-num">${escHtml(po.name || "—")}</td>`;
      if (!po.lots.length) {
        return `<tr class="${po.error ? "is-bad" : ""}">${head}<td class="mg-muted">·</td><td class="mg-art">${escHtml(po.art)}</td><td class="mg-crd">${po.crd ? escHtml(relFmtDate(po.crd)) : ""}</td>${sizeCells(po.sizes, "mg-num")}<td class="mg-num">${relNum(po.total)}</td><td class="mg-paste-notes">${notesHtml(po.notes, po.error)}</td></tr>`;
      }
      return po.lots.map((l, i) => `<tr class="mg-lot-line${po.error || l.error ? " is-bad" : ""}">${i ? "<td></td>" : head}<td class="mg-lot-cell"><span class="lot-badge"${l.sheetName ? ` title="CLSX ${escHtml(l.sheetName)}"` : ""}>${escHtml(l.name || "?")}</span>${l.color ? `<span class="mg-lot-color">${escHtml(l.color)}</span>` : ""}</td><td class="mg-art">${i ? "" : escHtml(po.art)}</td><td class="mg-crd">${l.crd ? escHtml(relFmtDate(l.crd)) : ""}</td>${sizeCells(l.sizes, "mg-num")}<td class="mg-num">${relNum(l.total)}</td><td class="mg-paste-notes">${l.error ? `<span class="mg-note is-bad">${escHtml(l.error)}</span>` : (l.warn ? `<span class="mg-note is-warn">${escHtml(l.warn)}</span>` : "")}</td></tr>`).join("")
        + `<tr class="mg-po-total${po.error ? " is-bad" : ""}"><td colspan="4">Cộng ${escHtml(po.name)}</td>${sizeCells(po.sizes, "mg-num")}<td class="mg-num">${relNum(po.total)}</td><td class="mg-paste-notes">${notesHtml(po.notes, po.error)}</td></tr>`;
    }).join("") : "").join("");
  pv.innerHTML = `<div class="mg-paste-sum">
      <span>${parsed.waves.filter(w => w.pos.length).length} đợt</span><span>${ok.length} PO lưu được</span><span>${nNew} PO mới</span>
      ${nLots ? `<span>${nLots} lô</span>` : ""}
      ${newArts.length ? `<span>ART mới: ${escHtml(newArts.join(", "))}</span>` : ""}
      ${parsed.newSizes.length ? `<span>Size mới: ${escHtml(parsed.newSizes.join(", "))}</span>` : ""}
      ${bad ? `<span class="is-bad">${bad} PO lỗi, không lưu</span>` : ""}
      ${badLots ? `<span class="is-bad">${badLots} dòng lô bỏ qua</span>` : ""}
    </div>
    <div class="mg-table-wrap"><table class="mg-table mg-paste-table">
      <thead><tr><th>PO</th><th>Lô</th><th>ART</th><th>CRD</th>${sz.map(x => `<th class="mg-th-num">${escHtml(x)}</th>`).join("")}<th class="mg-th-num">Tổng</th><th>Ghi chú</th></tr></thead>
      <tbody>${body}</tbody>
    </table></div>
    <div class="mg-paste-actions is-end"><span class="mg-paste-note">Sửa được tên đợt ở dòng xanh đậm trước khi lưu.</span><button type="button" class="mg-btn mg-btn-primary" id="btnPasteSave"${ok.length ? "" : " disabled"}>Lưu ${ok.length} PO</button></div>`;
}

async function saveOrderPaste() {
  const parsed = orderPaste.parsed;
  const custId = appState.currentCustomer;
  if (!parsed || !custId) return;
  const waves = parsed.waves
    .map(w => ({
      name: w.name,
      rows: w.pos.filter(p => !p.error).map(p => ({
        id: p.target ? p.target.id : undefined,
        new: !p.target,   // PO cùng tên đã có nhưng lô không khớp: tạo PO mới, không ghi đè
        po_number: p.name,
        art: p.art,
        crd: p.crd,
        sizes: p.sizes,
        lots: p.lots.filter(l => !l.error).map(l => ({ name: l.name, sizes: l.sizes, crd: l.crd, color: l.color }))
      }))
    }))
    .filter(w => w.rows.length);
  if (!waves.length) return;
  const btn = document.getElementById("btnPasteSave");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Đang lưu...";
  }
  try {
    const res = await fetch("/api/order-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: custId, waves })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không lưu được");
    closeOrderPaste();
    await fetchMetadata();
    if ((data.newSizes || []).length) fillCustomerForm(custId);
    loadArtParts(custId);
    const extra = [
      (data.newArts || []).length ? `ART mới: ${data.newArts.join(", ")}` : "",
      (data.newSizes || []).length ? `size mới: ${data.newSizes.join(", ")}` : ""
    ].filter(Boolean).join("; ");
    showToast(`✅ Đã lưu đơn hàng: ${data.created} PO mới, ${data.updated} PO cập nhật${extra ? `. ${extra}` : ""}`);
  } catch (ex) {
    showToast("⚠️ " + ex.message);
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Lưu lại";
    }
  }
}

function bindOrderPasteEvents() {
  document.getElementById("btnTogglePaste")?.addEventListener("click", () => {
    const panel = document.getElementById("poPastePanel");
    if (panel && !panel.hidden) {
      closeOrderPaste();
      return;
    }
    resetPOForm();
    setOrderPasteOpen(true);
  });
  document.getElementById("btnPasteCancel")?.addEventListener("click", closeOrderPaste);
  const ordBox = document.getElementById("poOrderSizes");
  ordBox?.addEventListener("click", (e) => {
    if (e.target.closest("#btnLotsFromOrder")) fillLotTotalsFromOrder();
    if (e.target.closest("#btnOrderUndo")) undoOrderGrid();
    if (e.target.closest("#btnOrderNew")) {
      // PO chưa có đơn: 1 dòng đơn cả PO; kế hoạch PO chỉ tự theo tổng đơn khi đang để trống
      const plan = Number(document.getElementById("poPlanTotal")?.value) || 0;
      poFormState.grid = { mode: "po", rows: { [ORDER_PO_ROW]: {} }, orig: {}, planFollows: !plan };
      renderPoOrderSizes();
      ordBox.querySelector(".po-og-in")?.focus();
    }
  });
  ordBox?.addEventListener("input", (e) => {
    if (e.target.classList.contains("po-og-in")) onOrderCellInput(e.target);
  });
  ordBox?.addEventListener("keydown", (e) => {
    if (e.target.classList.contains("po-og-in")) onOrderCellKey(e);
  });
  ordBox?.addEventListener("focusin", (e) => {
    if (e.target.classList.contains("po-og-in")) e.target.select();
  });
  ordBox?.addEventListener("focusout", (e) => {
    if (e.target.classList.contains("po-og-in")) syncOrderGrid();
  });
  // Gõ tay kế hoạch PO thì thôi tự theo tổng đơn
  document.getElementById("poPlanTotal")?.addEventListener("input", () => {
    if (poFormState.grid) {
      poFormState.grid.planFollows = false;
      syncOrderGrid();
    }
  });
  document.getElementById("btnPasteRead")?.addEventListener("click", readOrderPaste);
  const box = document.getElementById("poPasteBox");
  // Ô dán đơn: Tab chèn ký tự Tab (giống Excel) thay vì nhảy ô; dán xong tự đọc
  box?.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const at = box.selectionStart;
    box.value = box.value.slice(0, at) + "\t" + box.value.slice(box.selectionEnd);
    box.selectionStart = box.selectionEnd = at + 1;
  });
  box?.addEventListener("paste", () => setTimeout(readOrderPaste, 0));
  document.getElementById("poPastePreview")?.addEventListener("click", (e) => {
    if (e.target.closest("#btnPasteSave")) saveOrderPaste();
  });
  document.getElementById("poPastePreview")?.addEventListener("input", (e) => {
    const inp = e.target.closest(".mg-wave-input");
    if (inp && orderPaste.parsed) orderPaste.parsed.waves[Number(inp.dataset.waveIdx)].name = inp.value.trim().slice(0, 60);
  });
}

// BẢNG ĐƠN THEO SIZE trên biểu mẫu PO (sửa tay được):
// - mode "lot": lô có đơn riêng (dán có cột CLSX), mỗi dòng 1 lô, dòng Cả PO = cộng các lô
// - mode "po": 1 dòng đơn cả PO
// rows / orig: {tên lô hoặc "#po": {size: số}}; orig để tô ô đã đổi và liệt kê khi lưu
const ORDER_PO_ROW = "#po";
const orderRowSum = r => Object.values(r || {}).reduce((a, x) => a + (Number(x) || 0), 0);
const cloneOrderRows = rows => Object.fromEntries(Object.entries(rows || {}).map(([k, v]) => [k, { ...v }]));

function initOrderGrid(o) {
  const lots = {};
  ((o && o.default_batches) || []).forEach(b => {
    const q = getOrderSizes(b);
    if (Object.keys(q).length) lots[String(b.batch_name || "")] = q;
  });
  const po = getOrderSizes(o);
  let rows;
  if (Object.keys(lots).length) rows = lots;
  else if (Object.keys(po).length) rows = { [ORDER_PO_ROW]: po };
  else return null;
  const mode = rows[ORDER_PO_ROW] ? "po" : "lot";
  const t0 = Object.values(rows).reduce((a, r) => a + orderRowSum(r), 0);
  const plan = Number(o && o.po_plan) || 0;
  return { mode, rows: cloneOrderRows(rows), orig: cloneOrderRows(rows), planFollows: t0 > 0 && plan === t0 };
}

// Dòng của bảng: mode lô = các lô đang có trong bảng chia lô (lô Số đuôi chỉ khi đang có đơn)
function orderGridRows() {
  const g = poFormState.grid;
  if (!g) return [];
  if (g.mode === "po") return [ORDER_PO_ROW];
  return [...document.querySelectorAll("#dynamicBatchInputsContainer .lot-row")]
    .filter(row => !row.classList.contains("is-tail") || orderRowSum(g.rows[row.dataset.batchName]) || orderRowSum(g.orig[row.dataset.batchName]))
    .map(row => row.dataset.batchName);
}

// Cột: dãy size của khách, thêm size đang có trong đơn mà dãy size chưa có
function orderGridSizes() {
  const g = poFormState.grid;
  const out = [...poFormCustomerSizes()];
  if (g) [g.rows, g.orig].forEach(set => Object.values(set).forEach(r => Object.keys(r).forEach(s => { if (!out.includes(s)) out.push(s); })));
  return out;
}

const orderGridQty = (key, size) => Number(((poFormState.grid || {}).rows || {})[key]?.[size]) || 0;
const orderGridOrigQty = (key, size) => Number(((poFormState.grid || {}).orig || {})[key]?.[size]) || 0;

function orderGridTotal() {
  return orderGridRows().reduce((a, k) => a + orderRowSum(poFormState.grid.rows[k]), 0);
}

function orderGridOrigTotal() {
  const g = poFormState.grid;
  return g ? Object.values(g.orig).reduce((a, r) => a + orderRowSum(r), 0) : 0;
}

// Các ô đã đổi (lô bị bỏ khỏi bảng chia lô: số về 0)
function orderGridChanges() {
  const g = poFormState.grid;
  if (!g) return [];
  const keys = orderGridRows();
  const all = [...keys, ...Object.keys(g.orig).filter(k => !keys.includes(k))];
  const sizes = orderGridSizes();
  const out = [];
  all.forEach(k => sizes.forEach(s => {
    const a = orderGridOrigQty(k, s);
    const b = keys.includes(k) ? orderGridQty(k, s) : 0;
    if (a !== b) out.push({ lot: k === ORDER_PO_ROW ? "" : k, size: s, from: a, to: b });
  }));
  return out;
}

// Đơn cả PO để lưu: mode lô = cộng các lô đang có trong bảng
function orderGridPoQty() {
  const g = poFormState.grid;
  const out = {};
  orderGridRows().forEach(k => Object.entries(g.rows[k] || {}).forEach(([s, q]) => {
    if (Number(q) > 0) out[s] = (out[s] || 0) + Number(q);
  }));
  return out;
}

function renderPoOrderSizes() {
  const el = document.getElementById("poOrderSizes");
  if (!el) return;
  const g = poFormState.grid;
  const sizes = orderGridSizes();
  el.hidden = false;
  if (!g) {
    el.innerHTML = `<div class="po-order-head"><span class="po-order-title">PO này chưa có đơn hàng theo size</span></div>
      <button type="button" class="po-order-new" id="btnOrderNew"${sizes.length ? "" : " disabled"}>＋ Nhập đơn theo size</button>
      <div class="po-order-hint">${sizes.length ? "Hoặc dán từ Excel bằng nút <b>Dán đơn hàng</b>." : "Khách chưa có dãy size. Khai báo ở mục Dãy size."}</div>`;
    return;
  }
  const keys = orderGridRows();
  const lotMode = g.mode === "lot";
  const body = keys.map((k, r) => `<tr>
      <td class="po-og-lc">${k === ORDER_PO_ROW ? "Cả PO" : `<span class="lot-badge">${escHtml(k)}</span>`}</td>
      ${sizes.map((s, c) => `<td class="po-og-c" data-key="${escHtml(k)}" data-size="${escHtml(s)}"><input type="text" inputmode="numeric" autocomplete="off" class="po-og-in" data-r="${r}" data-c="${c}" data-key="${escHtml(k)}" data-size="${escHtml(s)}" value="${orderGridQty(k, s) || ""}" placeholder="·"></td>`).join("")}
      <td class="po-og-tc" data-key="${escHtml(k)}"></td></tr>`).join("");
  const foot = lotMode ? `<tfoot><tr><td class="po-og-lc">Cả PO</td>${sizes.map(s => `<td data-fsize="${escHtml(s)}"></td>`).join("")}<td class="po-og-tc" data-ftotal></td></tr></tfoot>` : "";
  el.innerHTML = `<div class="po-order-head"><span class="po-order-title" data-og-title></span><span class="po-order-chg" data-og-chg hidden></span>
      <span class="po-order-sp"></span><button type="button" class="mg-link-btn po-order-undo" id="btnOrderUndo" hidden>Hoàn tác các ô đã đổi</button></div>
    <div class="po-og-wrap"><table class="po-og" style="--n:${sizes.length}"><colgroup><col class="po-og-col-lc">${sizes.map(() => "<col>").join("")}<col class="po-og-col-tc"></colgroup>
      <thead><tr><th class="po-og-lc">${lotMode ? "Lô \\ Size" : "Size"}</th>${sizes.map(s => `<th>${escHtml(s)}</th>`).join("")}<th class="po-og-tc">Tổng</th></tr></thead>
      <tbody>${body}</tbody>${foot}</table></div>
    <div class="po-order-hint">${lotMode
      ? "Mỗi lô có đơn riêng theo size. Sửa ô của lô thì <b>Số tổng</b> của lô bên dưới tự cộng lại. Dòng <b>Cả PO</b> là cộng các lô."
      : "Đơn cả PO theo size. Bấm chọn size của lô thì số tổng của lô tự cộng theo đơn. Lô trùng size thì gõ số tổng từng lô."}
      Ô trống = size không có trong ${lotMode ? "lô" : "đơn"}. Chỉ lưu khi bấm <b>Cập nhật PO</b>.
      <button type="button" class="mg-link-btn" id="btnLotsFromOrder">Tính lại số tổng các lô theo đơn</button></div>`;
  syncOrderGrid();
}

// Tô ô đã đổi, cộng tổng từng lô / cả PO; không đụng số tổng lô bên dưới
function syncOrderGrid() {
  const el = document.getElementById("poOrderSizes");
  const g = poFormState.grid;
  if (!el || !g) return;
  let nch = 0;
  el.querySelectorAll("td.po-og-c").forEach(td => {
    const k = td.dataset.key, s = td.dataset.size;
    const was = orderGridOrigQty(k, s), now = orderGridQty(k, s);
    const inp = td.querySelector("input");
    const want = now ? String(now) : "";
    if (inp && inp.value !== want && document.activeElement !== inp) inp.value = want;
    const ch = was !== now;
    if (ch) nch++;
    td.classList.toggle("is-ch", ch);
    let w = td.querySelector(".po-og-was");
    if (ch) {
      if (!w) {
        w = document.createElement("span");
        w.className = "po-og-was";
        td.prepend(w);
      }
      w.textContent = was ? relNum(was) : "trống";
    } else if (w) w.remove();
  });
  el.querySelectorAll("tbody td.po-og-tc").forEach(td => {
    const k = td.dataset.key;
    td.textContent = relNum(orderRowSum(g.rows[k]));
    td.classList.toggle("is-ch", orderRowSum(g.rows[k]) !== orderRowSum(g.orig[k]));
  });
  const keys = orderGridRows();
  el.querySelectorAll("tfoot td[data-fsize]").forEach(td => {
    const s = td.dataset.fsize;
    const now = keys.reduce((a, k) => a + orderGridQty(k, s), 0);
    const was = Object.keys(g.orig).reduce((a, k) => a + orderGridOrigQty(k, s), 0);
    td.textContent = now ? relNum(now) : "";
    td.classList.toggle("is-ch", now !== was);
  });
  const total = orderGridTotal(), t0 = orderGridOrigTotal();
  const ft = el.querySelector("tfoot td[data-ftotal]");
  if (ft) ft.textContent = relNum(total);
  const plan = Number(document.getElementById("poPlanTotal")?.value) || 0;
  const title = el.querySelector("[data-og-title]");
  if (title) title.innerHTML = `Đơn hàng theo size · tổng ${total !== t0 && t0 ? `<s>${relNum(t0)}</s> ` : ""}<b>${relNum(total)}</b> đôi`
    + (total && plan && total !== plan ? ` <span class="po-order-warn">· kế hoạch PO ${relNum(plan)}, lệch ${relNum(Math.abs(total - plan))}</span>` : "");
  const chg = el.querySelector("[data-og-chg]");
  if (chg) {
    chg.hidden = !nch;
    chg.textContent = `Đã đổi ${nch} ô, chưa lưu`;
  }
  const undo = document.getElementById("btnOrderUndo");
  if (undo) undo.hidden = !nch;
}

const lotRowByName = name => [...document.querySelectorAll("#dynamicBatchInputsContainer .lot-row")].find(row => row.dataset.batchName === name) || null;

// Mode lô: số tổng của lô = cộng đơn của lô; size vừa có / hết số thì bật / tắt trong "Size của lô"
function applyOrderToLot(name, toggledSize) {
  const row = lotRowByName(name);
  if (!row) return;
  const sum = orderRowSum(poFormState.grid.rows[name]);
  const inp = row.querySelector(".batch-card-input");
  if (inp) inp.value = sum || "";
  if (toggledSize) {
    let sizes = lotRowSizes(row);
    const has = orderGridQty(name, toggledSize) > 0;
    if (has && sizes.length && !sizes.includes(toggledSize)) sizes.push(toggledSize);
    if (!has) sizes = sizes.filter(x => x !== toggledSize);
    const custSizes = poFormCustomerSizes();
    if (custSizes.length) sizes = [...custSizes.filter(x => sizes.includes(x)), ...sizes.filter(x => !custSizes.includes(x))];
    row.dataset.sizes = JSON.stringify(sizes);
    renderLotRowChips(row);
  }
}

function onOrderCellInput(inp) {
  const g = poFormState.grid;
  if (!g) return;
  const clean = inp.value.replace(/\D/g, "").slice(0, 6);
  if (clean !== inp.value) inp.value = clean;
  const k = inp.dataset.key, s = inp.dataset.size;
  const row = g.rows[k] || (g.rows[k] = {});
  const had = Number(row[s]) > 0;
  if (Number(clean) > 0) row[s] = Number(clean);
  else delete row[s];
  const has = Number(row[s]) > 0;
  if (g.mode === "lot") applyOrderToLot(k, had !== has ? s : null);
  else {
    // PO 1 lô mà kế hoạch đang theo tổng đơn: số tổng của lô cũng theo tổng đơn
    const lots = [...document.querySelectorAll("#dynamicBatchInputsContainer .lot-row:not(.is-tail)")];
    const lotInp = g.planFollows && lots.length === 1 ? lots[0].querySelector(".batch-card-input") : null;
    if (lotInp) lotInp.value = orderRowSum(row) || "";
  }
  if (g.planFollows) {
    const planInp = document.getElementById("poPlanTotal");
    if (planInp) planInp.value = orderGridTotal() || "";
  }
  updateBatchSummaryCheck();
  renderLotPreview();
  syncOrderGrid();
}

// Enter / mũi tên: sang ô kế bên (Enter đi ngang như dòng Excel)
function onOrderCellKey(e) {
  const inp = e.target;
  const r = Number(inp.dataset.r), c = Number(inp.dataset.c);
  // Ô đang chọn cả số (vừa nhảy vào) thì mũi tên sang ô kế luôn; đang sửa giữa số thì di con trỏ
  const whole = inp.selectionStart === 0 && inp.selectionEnd === inp.value.length;
  let t = null;
  if (e.key === "Enter" || (e.key === "ArrowRight" && (whole || inp.selectionStart === inp.value.length))) t = [r, c + 1];
  else if (e.key === "ArrowLeft" && (whole || (inp.selectionStart === 0 && inp.selectionEnd === 0))) t = [r, c - 1];
  else if (e.key === "ArrowDown") t = [r + 1, c];
  else if (e.key === "ArrowUp") t = [r - 1, c];
  if (!t) return;
  e.preventDefault();   // Enter không gửi biểu mẫu
  const next = document.querySelector(`#poOrderSizes .po-og-in[data-r="${t[0]}"][data-c="${t[1]}"]`);
  if (next) next.focus();
}

function undoOrderGrid() {
  const g = poFormState.grid;
  if (!g) return;
  g.rows = cloneOrderRows(g.orig);
  if (g.mode === "lot") {
    orderGridRows().forEach(k => {
      const row = lotRowByName(k);
      if (!row) return;
      const prev = (appState.orders.find(o => o.id === document.getElementById("editOrderId")?.value)?.default_batches || []).find(b => String(b.batch_name) === k);
      if (prev && Array.isArray(prev.sizes)) {
        row.dataset.sizes = JSON.stringify(prev.sizes.map(String));
        renderLotRowChips(row);
      }
      applyOrderToLot(k, null);
    });
  }
  if (g.planFollows) {
    const planInp = document.getElementById("poPlanTotal");
    if (planInp) planInp.value = orderGridOrigTotal() || "";
  }
  updateBatchSummaryCheck();
  renderPoOrderSizes();
  renderLotPreview();
  showToast("Đã trả lại số đơn cũ");
}

// Mọi lô: số tổng = đơn của lô (mode lô), hoặc cộng đơn cả PO theo size đã chọn của lô
function fillLotTotalsFromOrder() {
  const g = poFormState.grid;
  let n = 0;
  if (g && g.mode === "lot") {
    orderGridRows().filter(k => orderRowSum(g.rows[k])).forEach(k => {
      applyOrderToLot(k, null);
      n++;
    });
  } else {
    const order = (g && g.rows[ORDER_PO_ROW]) || {};
    document.querySelectorAll("#dynamicBatchInputsContainer .lot-row").forEach(row => {
      const sizes = lotRowSizes(row);
      if (!sizes.length) return;
      const inp = row.querySelector(".batch-card-input");
      if (!inp) return;
      inp.value = sizes.reduce((a, x) => a + (Number(order[x]) || 0), 0);
      n++;
    });
  }
  updateBatchSummaryCheck();
  renderLotPreview();
  showToast(n ? `Đã tính số tổng ${n} lô theo đơn hàng` : "⚠️ Chưa lô nào chọn size. Bấm chọn size của lô trước.");
}

// Hỏi lại trước khi lưu số đơn đã đổi; trả về true khi bấm Lưu
function confirmOrderChanges(poNumber) {
  const list = orderGridChanges();
  const modal = document.getElementById("modalOrderChanges");
  if (!list.length || !modal) return Promise.resolve(true);
  const g = poFormState.grid;
  const t0 = orderGridOrigTotal(), t1 = orderGridTotal();
  document.getElementById("ocTitle").textContent = t0 ? `Lưu số đơn mới của PO ${poNumber}?` : `Lưu đơn theo size cho PO ${poNumber}?`;
  const items = list.slice(0, 40).map(x => {
    const d = x.to - x.from;
    return `<li>${x.lot ? `${escHtml(x.lot)} · size` : "Size"} <b>${escHtml(x.size)}</b>: ${x.from ? relNum(x.from) : "trống"} → <b>${x.to ? relNum(x.to) : "bỏ"}</b> <span class="${d > 0 ? "oc-up" : "oc-dn"}">(${d > 0 ? "+" : "−"}${relNum(Math.abs(d))})</span></li>`;
  });
  if (list.length > 40) items.push(`<li>… và ${list.length - 40} ô khác</li>`);
  items.push(`<li>Tổng đơn${g.planFollows ? " và kế hoạch PO" : ""}: ${t0 ? `${relNum(t0)} → ` : ""}<b>${relNum(t1)}</b> đôi</li>`);
  document.getElementById("ocList").innerHTML = items.join("");
  modal.classList.add("show");
  return new Promise(resolve => {
    const done = ok => {
      modal.classList.remove("show");
      ["btnOcSave", "btnOcBack", "btnOcClose"].forEach(id => { const b = document.getElementById(id); if (b) b.onclick = null; });
      resolve(ok);
    };
    document.getElementById("btnOcSave").onclick = () => done(true);
    document.getElementById("btnOcBack").onclick = () => done(false);
    document.getElementById("btnOcClose").onclick = () => done(false);
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

// RENDER BẢNG CHIA LÔ (Lô 1..N + Số đuôi): số tổng (định mức NXT) + size của lô do admin chọn
function renderBatchInputBoxes(count, initialBatches = null) {
  const container = document.getElementById("dynamicBatchInputsContainer") || document.getElementById("batchInputGrid");
  if (!container) return;

  // Giữ lại số và size đang nhập khi đổi số lô
  const existing = {};
  if (!initialBatches) {
    container.querySelectorAll(".lot-row").forEach(row => {
      const input = row.querySelector(".batch-card-input");
      existing[row.dataset.batchName] = { val: input ? input.value : "", sizes: lotRowSizes(row), color: row.dataset.color || "" };
    });
  }
  const fromInitial = (match) => {
    if (!initialBatches || !Array.isArray(initialBatches) || initialBatches.length === 0) return null;
    const found = initialBatches.find(match);
    if (!found) return null;
    return { val: found.into_sewing || found.batch_plan || "", sizes: Array.isArray(found.sizes) ? found.sizes.map(String) : [], color: found.color || "" };
  };

  // Tên lô giữ đúng tên đang lưu / đang hiện (PO dán đơn có cột CLSX: Lô 31, Lô 32...); lô thêm mới đánh số tiếp theo lô trước
  const curNames = initialBatches
    ? (Array.isArray(initialBatches) ? initialBatches : []).map(b => String(b.batch_name || "")).filter(n => n && !/đuôi/i.test(n))
    : [...container.querySelectorAll(".lot-row:not(.is-tail)")].map(row => row.dataset.batchName);
  const names = [];
  for (let i = 1; i <= count; i++) {
    let nm = curNames[i - 1];
    if (!nm || names.includes(nm)) {
      const m = /^(.*?)(\d+)$/.exec(names[names.length - 1] || "");
      nm = m ? `${m[1]}${Number(m[2]) + 1}` : `Lô ${i}`;
      while (names.includes(nm) || curNames.includes(nm)) nm += "'";
    }
    names.push(nm);
  }

  const rows = [];
  names.forEach(bName => {
    const v = fromInitial(b => b.batch_name === bName) || existing[bName] || { val: "", sizes: [] };
    rows.push({ name: bName, tail: false, ...v });
  });
  // Lô đuôi giữ đúng tên đang lưu (ví dụ "Lô Số Đuôi") để số NXT / thả chuyền theo tên lô không bị lạc
  const tailMatch = b => b.batch_name.toLowerCase().includes("đuôi") || b.batch_name === `Lô ${count + 1}`;
  const tailSaved = Array.isArray(initialBatches) ? initialBatches.find(tailMatch) : null;
  const tailRow = container.querySelector(".lot-row.is-tail");
  const tailName = (tailSaved && /đuôi/i.test(tailSaved.batch_name) ? tailSaved.batch_name : "")
    || (!initialBatches && tailRow ? tailRow.dataset.batchName : "") || "Số đuôi";
  const tv = fromInitial(tailMatch) || existing[tailName] || { val: "", sizes: [] };
  rows.push({ name: tailName, tail: true, ...tv });

  container.innerHTML = `<table class="lot-table">
    <colgroup><col class="lot-col-name"><col class="lot-col-total"><col></colgroup>
    <thead><tr><th>Lô</th><th>Số tổng (đôi)</th><th class="lot-th-sizes">Size của lô <span>· bấm để chọn, không chọn = tất cả size</span></th></tr></thead>
    <tbody>${rows.map(r => `<tr class="lot-row${r.tail ? " is-tail" : ""}" data-batch-name="${escHtml(r.name)}" data-color="${escHtml(r.color || "")}" data-sizes="${escHtml(JSON.stringify(r.sizes))}">
      <td><span class="lot-badge">${escHtml(r.name)}</span>${r.color ? `<span class="mg-lot-color">${escHtml(r.color)}</span>` : ""}</td>
      <td><input type="number" class="batch-card-input lot-total-input" placeholder="0" value="${escHtml(r.val)}" min="0"></td>
      <td class="lot-size-cell"></td>
    </tr>`).join("")}</tbody>
  </table>`;
  refreshLotSizeChips();

  if (!container.dataset.lotBound) {
    container.dataset.lotBound = "1";
    container.addEventListener("input", (e) => {
      if (!e.target.classList.contains("batch-card-input")) return;
      updateBatchSummaryCheck();
      renderLotPreview();
    });
    container.addEventListener("click", (e) => {
      const chip = e.target.closest(".lot-sz");
      const all = e.target.closest(".lot-sz-all");
      if (!chip && !all) return;
      e.preventDefault();
      const row = e.target.closest(".lot-row");
      let sizes = lotRowSizes(row);
      if (all) sizes = [];
      else sizes = sizes.includes(chip.dataset.size) ? sizes.filter(x => x !== chip.dataset.size) : [...sizes, chip.dataset.size];
      row.dataset.sizes = JSON.stringify(sizes);
      renderLotRowChips(row);
      const g = poFormState.grid;
      if (g && g.mode === "lot") {
        // Lô có đơn riêng: tắt size thì bỏ số đơn của size đó trong lô, số tổng = cộng đơn của lô
        const name = row.dataset.batchName;
        if (chip && !sizes.includes(chip.dataset.size) && g.rows[name]) delete g.rows[name][chip.dataset.size];
        if (orderGridRows().includes(name) && (orderRowSum(g.rows[name]) || orderRowSum(g.orig[name]))) {
          applyOrderToLot(name, null);
          updateBatchSummaryCheck();
          syncOrderGrid();
        }
      } else {
        const order = (g && g.rows[ORDER_PO_ROW]) || {};
        if (!all && sizes.length && Object.keys(order).length) {
          const sum = sizes.reduce((a, x) => a + (Number(order[x]) || 0), 0);
          const inp = row.querySelector(".batch-card-input");
          if (inp && sum) {
            inp.value = sum;
            updateBatchSummaryCheck();
          }
        }
      }
      renderLotPreview();
    });
  }

  updateBatchSummaryCheck();
  renderPoOrderSizes();
}

function lotRowSizes(row) {
  try {
    const v = JSON.parse((row && row.dataset.sizes) || "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch (e) {
    return [];
  }
}

// Dãy size của khách đang chọn trong biểu mẫu PO
function poFormCustomerSizes() {
  const sel = document.getElementById("poCustomerSelect");
  const cust = appState.customers.find(c => c.id === (sel && sel.value ? sel.value : appState.currentCustomer));
  return getCustomerSizes(cust);
}

// Size của lô để lưu: giữ đúng thứ tự dãy size của khách
function lotSizesForSave(row) {
  const custSizes = poFormCustomerSizes();
  const chosen = lotRowSizes(row);
  return custSizes.length ? custSizes.filter(x => chosen.includes(x)) : chosen;
}

function renderLotRowChips(row) {
  const cell = row.querySelector(".lot-size-cell");
  if (!cell) return;
  const custSizes = poFormCustomerSizes();
  const chosen = lotRowSizes(row);
  if (!custSizes.length) {
    cell.innerHTML = '<span class="lot-size-empty">Khách chưa có dãy size. Khai báo ở mục Dãy size.</span>';
    return;
  }
  cell.innerHTML = custSizes.map(x => `<button type="button" class="lot-sz${chosen.includes(x) ? " on" : ""}" data-size="${escHtml(x)}">${escHtml(x)}</button>`).join("")
    + '<button type="button" class="lot-sz-all">Tất cả</button>';
}

function refreshLotSizeChips() {
  document.querySelectorAll("#dynamicBatchInputsContainer .lot-row").forEach(renderLotRowChips);
  renderLotPreview();
}

// Xem trước: mỗi lô của PO đang nhập sẽ hiện bao nhiêu dòng size trên điện thoại
function renderLotPreview() {
  const box = document.getElementById("lotPreviewList");
  if (!box) return;
  if (!mgState.poFormOpen) {
    box.innerHTML = "";
    return;
  }
  const custSizes = poFormCustomerSizes();
  const items = [...document.querySelectorAll("#dynamicBatchInputsContainer .lot-row")].map(row => {
    const qty = Number(row.querySelector(".batch-card-input")?.value) || 0;
    if (!qty && row.classList.contains("is-tail")) return "";
    const sizes = lotSizesForSave(row);
    const list = sizes.length ? sizes : custSizes;
    return `<div class="lot-preview-row"><span class="lot-badge">${escHtml(row.dataset.batchName)}</span><span>${list.length} dòng · ${escHtml(sizeBriefText(list) || "chưa có size")}</span></div>`;
  }).join("");
  box.innerHTML = items ? `<div class="lot-preview-title">PO đang nhập, mỗi lô hiện:</div>${items}` : "";
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
  if (btnSub) btnSub.innerText = "Lưu khách hàng";
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

  poFormState.grid = null;
  renderBatchInputBoxes(2, []);

  const btnSub = document.getElementById("btnSubmitPO");
  if (btnSub) btnSub.innerText = "Lưu đơn hàng";
  const mode = document.getElementById("poFormMode");
  if (mode) mode.textContent = "Thêm đơn hàng PO";
  document.querySelectorAll("#tbodyOrders tr.is-editing").forEach(tr => tr.classList.remove("is-editing"));
  setPoFormOpen(false);
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
      showToast(id ? "✅ Đã lưu khách hàng" : "✅ Đã thêm khách hàng mới");
      mgState.newCust = false;
      mgState.nameEdit = false;
      resetCustomerForm();
      await fetchMetadata();
      // Khách mới: chọn luôn khách vừa thêm để khai báo ART và tạo PO
      const savedId = id || (appState.customers.find(c => String(c.name || "").trim().toLowerCase() === name.toLowerCase() && String(c.code || "") === code) || {}).id;
      if (savedId) {
        selectCustomerInManageTab(savedId);
        fillCustomerForm(savedId);
        renderCustomerTable();
        renderMgHead();
      }
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

  // 3. Mã hàng (ART) chọn từ các ART đã khai báo của khách; tên chuyền để trống thì lấy mặc định
  if (!style_code) {
    showToast("⚠️ Chọn Mã hàng (ART). Chưa có ART thì thêm ở mục ART & chi tiết.");
    if (styleEl) {
      highlightField(styleEl);
      safeScrollIntoView(styleEl);
    }
    return;
  }
  if (!line_name) {
    line_name = "Chuyền 1";
    if (lineEl) lineEl.value = line_name;
  }

  // 4. Collect batches from dynamic grid
  const container = document.getElementById("dynamicBatchInputsContainer") || document.getElementById("batchInputGrid");
  const batchCards = container ? container.querySelectorAll(".lot-row") : [];
  // Sửa PO: lô cùng tên giữ thông tin riêng đã có (đơn theo size đã dán, CRD, lô vét đuôi)
  const prevOrder = id ? appState.orders.find(o => o.id === id) : null;
  const prevLots = new Map(((prevOrder && prevOrder.default_batches) || []).map(b => [String(b.batch_name || ""), b]));
  const batches = [];
  let sumBatches = 0;
  // Bảng đơn theo size có ô đổi: lưu đơn mới của lô và của cả PO
  const grid = poFormState.grid;
  const orderChanges = orderGridChanges();
  const gridKeys = orderGridRows();
  batchCards.forEach((card, i) => {
    const bName = card.dataset.batchName;
    const input = card.querySelector(".batch-card-input");
    const qty = Number(input ? input.value : 0) || 0;
    sumBatches += qty;
    if (qty > 0 || !card.classList.contains("is-tail") || batches.length === 0) {
      const sizes = lotSizesForSave(card);
      const lot = { ...(prevLots.get(bName) || {}), id: "b-" + (i + 1), batch_name: bName, batch_plan: qty, into_sewing: 0, sizes };
      if (lot.size_qty && typeof lot.size_qty === "object") {
        const keep = Object.fromEntries(Object.entries(lot.size_qty).filter(([sz]) => !sizes.length || sizes.includes(sz)));
        if (Object.keys(keep).length) lot.size_qty = keep;
        else delete lot.size_qty;
      }
      if (orderChanges.length && grid.mode === "lot" && gridKeys.includes(bName)) {
        const q = Object.fromEntries(Object.entries(grid.rows[bName] || {}).filter(([, v]) => Number(v) > 0));
        if (Object.keys(q).length) lot.size_qty = q;
        else delete lot.size_qty;
      }
      batches.push(lot);
    }
  });

  // Lô đang có số tổng mà để trống, hoặc bị bỏ khỏi PO: hỏi lại trước khi lưu
  if (prevOrder) {
    const prevPlan = n => Number((prevLots.get(n) || {}).batch_plan) || 0;
    const zeroed = batches.filter(b => !b.batch_plan && prevPlan(b.batch_name) > 0).map(b => b.batch_name);
    const removed = [...prevLots.keys()].filter(n => !batches.some(b => b.batch_name === n) && prevPlan(n) > 0);
    const msgs = [];
    if (zeroed.length) msgs.push(`• ${zeroed.join(", ")} đang có số tổng, nay để trống (= 0).`);
    if (removed.length) msgs.push(`• Bỏ ${removed.join(", ")} khỏi PO. Số NXT và thả chuyền đã nhập của lô này vẫn còn trong dữ liệu nhưng lô không còn trong danh sách chọn lô.`);
    if (msgs.length && !confirm(`Kiểm tra lại chia lô của PO ${po_number}:\n${msgs.join("\n")}\n\nVẫn lưu?`)) return;
  }
  if (orderChanges.length && !(await confirmOrderChanges(po_number))) return;

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
  const origBtnText = btnSubmit ? btnSubmit.innerText : "Lưu đơn hàng";
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
        default_batches: batches,
        ...(orderChanges.length ? { size_qty: orderGridPoQty() } : {})
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
        try { localStorage.setItem("dd_last_po_id", savedPO.id || ""); } catch (err) {}
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
      btnSubmit.innerText = document.getElementById("editOrderId")?.value ? "Cập nhật PO" : "Lưu đơn hàng";
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
  // 1. Toggle Show / Hide Password
  const btnTogglePass = document.getElementById("btnToggleShowPass");
  const passInput = document.getElementById("portalTxtLoginPass");
  if (btnTogglePass && passInput) {
    btnTogglePass.addEventListener("click", () => {
      if (passInput.type === "password") {
        passInput.type = "text";
        btnTogglePass.innerText = "Ẩn";
      } else {
        passInput.type = "password";
        btnTogglePass.innerText = "Hiện";
      }
    });
  }

  // 2. Direct Login Submit (Số điện thoại / Email + Mật Khẩu)
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
      btnSub.innerText = "Đang đăng nhập...";
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
        btnSub.innerText = "Đăng nhập";
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
  admin:   { title: "Ban giám đốc (Admin)", short: "Admin", badge: "is-admin", tabs: ["tab-wip", "tab-flow-log", "tab-manage", "tab-users", "tab-pack-log"] },
  manager: { title: "Quản lý điều hành", short: "Quản lý", badge: "is-manager", tabs: ["tab-wip", "tab-flow-log", "tab-pack-log"] },
  leader:  { title: "Tổ trưởng", short: "Tổ trưởng", badge: "is-manager", tabs: ["tab-wip"] },
  feeder:  { title: "Người thả chuyền", short: "Thả chuyền", badge: "is-worker", tabs: ["tab-wip"] },
  packer:  { title: "Đóng gói", short: "Đóng gói", badge: "is-worker", tabs: ["tab-wip"] },
  worker:  { title: "Nhân viên kiểm kê", short: "Kiểm kê", badge: "is-worker", tabs: ["tab-wip"] }
};

// Chữ viết tắt trên nút tài khoản: chữ đầu của từ đầu và từ cuối ("Sếp Tổng Quản Trị" → "ST")
function nameInitials(name) {
  const words = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "TK";
  const ini = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0].slice(0, 2);
  return ini.toUpperCase();
}

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
  const avName = document.getElementById("avatarUserName");
  if (avName) avName.textContent = cleanName || info.title;
  const avRole = document.getElementById("avatarUserRole");
  if (avRole) avRole.textContent = info.short;
  const avIni = document.getElementById("avatarUserIni");
  if (avIni) avIni.textContent = nameInitials(cleanName || info.short);
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
  if (btnSubmit) btnSubmit.innerText = "Lưu dãy size";
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
  const tabCnt = document.getElementById("mgCntSize");
  if (tabCnt) tabCnt.textContent = list.length;
  renderSizePreview();
}

// Xem trước bảng Thả chuyền / Chỉ lệnh đóng gói với dãy size đang chọn
function renderSizePreview() {
  const body = document.getElementById("sizePreviewBody");
  if (!body) return;
  const editingId = document.getElementById("editCustId")?.value || "";
  let list;
  let name;
  if (editingId || sizeEditor.list.length || mgState.newCust) {
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
// TAB 03: CHI TIẾT THEO ART (danh sách để chọn khi thả chuyền Chi tiết)
// ==========================================================
const artPartsState = { customerId: null, items: {}, dragFrom: null, seq: 0 };

// ==========================================================
// TAB 03: BẢNG CÔNG ĐOẠN THẢ CHUYỀN CỦA KHÁCH (trình tự 1 → 10)
// Mỗi công đoạn có id riêng: đổi tên / đổi thứ tự không làm mất số đã nhập.
// ==========================================================
const STAGE_SLOTS = 10;
const STAGE_TEMPLATES = { lbd: ["Lạng", "Bắt dây"] };
const stageEditor = { customerId: null, slots: [], dirty: false };

function getCustomerStages(cust) {
  if (!cust) return [];
  let v = cust.stages;
  if (typeof v === "string") {
    try { v = JSON.parse(v || "[]"); } catch (e) { v = []; }
  }
  return Array.isArray(v) ? v.filter(x => x && x.name).map(x => ({ id: String(x.id || ""), name: String(x.name) })) : [];
}

function stageSlotsFrom(list) {
  const slots = list.slice(0, STAGE_SLOTS).map(x => ({ id: x.id || "", name: x.name || "" }));
  while (slots.length < STAGE_SLOTS) slots.push({ id: "", name: "" });
  return slots;
}

const stageEditorList = () => stageEditor.slots.filter(x => x.name.trim()).map(x => ({ id: x.id, name: x.name.trim() }));

function loadStageEditor(customerId) {
  const cust = appState.customers.find(c => c.id === customerId);
  stageEditor.customerId = cust ? cust.id : null;
  stageEditor.slots = stageSlotsFrom(getCustomerStages(cust));
  stageEditor.dirty = false;
  renderStageEditor();
}

function renderStageEditor() {
  const body = document.getElementById("stageRows");
  if (!body) return;
  body.innerHTML = stageEditor.slots.map((x, i) => {
    const filled = !!x.name.trim();
    return `<tr class="${filled ? "" : "is-empty"}" data-stage-row="${i}">
      <td><span class="stage-no">${i + 1}</span></td>
      <td><input type="text" class="form-control stage-input" data-stage-slot="${i}" value="${escHtml(x.name)}" maxlength="40" placeholder="${i === 0 ? "Ví dụ: Lạng" : "Để trống nếu không dùng"}" autocomplete="off" aria-label="Tên công đoạn ${i + 1}"></td>
      <td class="stage-acts"><button type="button" class="stage-act" data-stage-up="${i}" aria-label="Đưa công đoạn ${i + 1} lên"${i === 0 ? " disabled" : ""}>↑</button><button type="button" class="stage-act" data-stage-down="${i}" aria-label="Đưa công đoạn ${i + 1} xuống"${i === STAGE_SLOTS - 1 ? " disabled" : ""}>↓</button><button type="button" class="stage-act is-danger" data-stage-del="${i}" aria-label="Xóa công đoạn ${i + 1}"${filled ? "" : " disabled"}>Xóa</button></td>
    </tr>`;
  }).join("");
  renderStageSideInfo();
}

// Số đếm trên mục, nhãn "Chưa lưu", dòng trình tự Tổng hợp, ô chép từ khách khác
function renderStageSideInfo() {
  const list = stageEditorList();
  const cust = appState.customers.find(c => c.id === stageEditor.customerId);
  const nameEl = document.getElementById("stageCustName");
  if (nameEl) nameEl.textContent = cust ? cust.name : "khách hàng";
  const cnt = document.getElementById("mgCntStage");
  if (cnt) cnt.textContent = getCustomerStages(cust).length;
  const dirty = document.getElementById("stageDirty");
  if (dirty) dirty.hidden = !stageEditor.dirty;
  const flow = document.getElementById("stageFlow");
  if (flow) {
    flow.innerHTML = list.length
      ? `Tổng hợp so: ${[...list.map(x => `<span class="stage-chip">${escHtml(x.name)}</span>`), '<span class="stage-chip is-pack">Đóng gói</span>'].join(' <span class="stage-arrow">→</span> ')}`
      : "Chưa có công đoạn: thả chuyền của khách này nhập chung như hiện nay.";
  }
  const copy = document.getElementById("stageCopyFrom");
  if (copy) {
    const others = appState.customers.filter(c => c.id !== stageEditor.customerId && getCustomerStages(c).length);
    copy.innerHTML = `<option value="">Chép từ khách khác…</option>` + others.map(c => `<option value="${escHtml(c.id)}">${escHtml(c.name)}: ${escHtml(getCustomerStages(c).map(x => x.name).join(" → "))}</option>`).join("");
    copy.disabled = !others.length;
  }
  document.querySelectorAll("#stageRows tr[data-stage-row]").forEach(tr => {
    const i = Number(tr.dataset.stageRow);
    const filled = !!(stageEditor.slots[i] && stageEditor.slots[i].name.trim());
    tr.classList.toggle("is-empty", !filled);
    const del = tr.querySelector("[data-stage-del]");
    if (del) del.disabled = !filled;
  });
}

function markStagesDirty() {
  stageEditor.dirty = true;
  renderStageSideInfo();
}

// Mẫu nhanh / chép từ khách khác: tên trùng với công đoạn đang có thì giữ id cũ (không mất số đã nhập)
function applyStageNames(names) {
  const byName = new Map(stageEditorList().map(x => [x.name.toLowerCase(), x.id]));
  stageEditor.slots = stageSlotsFrom(names.map(n => ({ id: byName.get(String(n).toLowerCase()) || "", name: String(n) })));
  stageEditor.dirty = true;
  renderStageEditor();
}

async function saveStages() {
  const customerId = stageEditor.customerId;
  const cust = appState.customers.find(c => c.id === customerId);
  if (!cust) return;
  const list = stageEditorList();
  const names = list.map(x => x.name.toLowerCase());
  const dup = names.find((n, i) => names.indexOf(n) !== i);
  if (dup) {
    showToast(`⚠️ Công đoạn "${list[names.indexOf(dup)].name}" bị trùng tên`);
    return;
  }
  // Ô có tên trùng một công đoạn đã lưu luôn dùng lại công đoạn đó (và số đã nhập), dù nằm ở ô nào:
  // gõ đè tên để đổi chỗ cũng không lệch số. Tên mới hoàn toàn = đổi tên, giữ công đoạn của ô.
  const saved = getCustomerStages(cust);
  const savedId = new Map(saved.map(o => [o.name.toLowerCase(), o.id]));
  const used = new Set();
  const byName = new Set();
  list.forEach((x, i) => {
    const id = savedId.get(x.name.toLowerCase());
    if (!id) return;
    x.id = id;
    used.add(id);
    byName.add(i);
  });
  list.forEach((x, i) => {
    if (byName.has(i)) return;
    if (x.id && !used.has(x.id)) used.add(x.id);
    else x.id = "";
  });
  const removed = saved.filter(x => !used.has(x.id));
  const keptOld = saved.filter(x => used.has(x.id)).map(x => x.id);
  const moved = keptOld.join("|") !== list.filter(x => keptOld.includes(x.id)).map(x => x.id).join("|");
  const notes = [];
  if (moved) notes.push(`Thứ tự mới: ${[...list.map(x => x.name), "Đóng gói"].join(" → ")}.\nSố đã nhập giữ nguyên theo từng công đoạn, chỉ đổi cặp so sánh trong Tổng hợp.`);
  if (removed.length) notes.push(`Bỏ công đoạn ${removed.map(x => `"${x.name}"`).join(", ")} khỏi bảng: số thả chuyền đã nhập của công đoạn này sẽ không còn hiện và không còn tính vào Tổng hợp.`);
  if (notes.length && !confirm(`${notes.join("\n\n")}\n\nLưu công đoạn?`)) return;
  const btn = document.getElementById("btnSaveStages");
  if (btn) btn.disabled = true;
  try {
    const res = await fetch("/api/customer-stages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, stages: list })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không lưu được");
    cust.stages = data.stages || [];
    if (stageEditor.customerId === customerId) loadStageEditor(customerId);
    const n = (data.stages || []).length;
    showToast(n ? `✅ Đã lưu ${n} công đoạn của ${cust.name}${data.migrated ? ". Số thả chuyền nhập trước đây đã tính vào công đoạn 1" : ""}` : `Đã bỏ bảng công đoạn của ${cust.name}: thả chuyền nhập chung như cũ`);
  } catch (ex) {
    showToast("⚠️ " + ex.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function bindStageEditorEvents() {
  const body = document.getElementById("stageRows");
  if (!body) return;
  body.addEventListener("input", (e) => {
    const inp = e.target.closest(".stage-input");
    if (!inp) return;
    stageEditor.slots[Number(inp.dataset.stageSlot)].name = inp.value.slice(0, 40);
    markStagesDirty();
  });
  body.addEventListener("keydown", (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    const inp = e.target.closest(".stage-input");
    if (!inp || e.key !== "Enter") return;
    e.preventDefault();
    const next = body.querySelector(`.stage-input[data-stage-slot="${Number(inp.dataset.stageSlot) + 1}"]`);
    if (next) next.focus();
    else saveStages();
  });
  body.addEventListener("click", (e) => {
    const slots = stageEditor.slots;
    const up = e.target.closest("[data-stage-up]");
    const down = e.target.closest("[data-stage-down]");
    const del = e.target.closest("[data-stage-del]");
    if (up) {
      const i = Number(up.dataset.stageUp);
      if (i > 0) [slots[i - 1], slots[i]] = [slots[i], slots[i - 1]];
    } else if (down) {
      const i = Number(down.dataset.stageDown);
      if (i < slots.length - 1) [slots[i + 1], slots[i]] = [slots[i], slots[i + 1]];
    } else if (del) {
      slots.splice(Number(del.dataset.stageDel), 1);
      slots.push({ id: "", name: "" });
    } else {
      return;
    }
    stageEditor.dirty = true;
    renderStageEditor();
  });
  document.querySelectorAll("[data-stage-tpl]").forEach(btn => {
    btn.addEventListener("click", () => applyStageNames(STAGE_TEMPLATES[btn.dataset.stageTpl] || []));
  });
  document.getElementById("stageCopyFrom")?.addEventListener("change", (e) => {
    const from = appState.customers.find(c => c.id === e.target.value);
    e.target.value = "";
    if (from) applyStageNames(getCustomerStages(from).map(x => x.name));
  });
  document.getElementById("btnSaveStages")?.addEventListener("click", saveStages);
}

async function loadArtParts(customerId) {
  if (!document.getElementById("artPartsList")) return;
  artPartsState.customerId = customerId || null;
  const seq = ++artPartsState.seq;
  if (!customerId) {
    artPartsState.items = {};
    renderArtParts();
    return;
  }
  try {
    const res = await fetch(`/api/art-parts?customer_id=${encodeURIComponent(customerId)}&t=${Date.now()}`);
    const data = await res.json();
    if (seq !== artPartsState.seq) return;
    artPartsState.items = Object.fromEntries((data.items || []).map(it => [it.art, it.parts || []]));
  } catch (err) {
    if (seq !== artPartsState.seq) return;
    artPartsState.items = {};
  }
  renderArtParts();
}

// ART của khách = các ART admin đã khai báo + mã hàng trong các PO của khách
function customerArts(customerId) {
  const arts = [...new Set(appState.orders.filter(o => o.customer_id === customerId).map(o => String(o.style_code || "").trim()).filter(Boolean))];
  if (customerId && customerId === artPartsState.customerId) {
    Object.keys(artPartsState.items).forEach(a => {
      if (!arts.includes(a)) arts.push(a);
    });
  }
  return arts.sort((a, b) => a.localeCompare(b, "vi"));
}

// Ô Mã hàng (ART) trong biểu mẫu PO: chọn từ các ART đã có của khách
function refreshPoArtOptions(customerId, value) {
  const sel = document.getElementById("poStyleCode");
  if (!sel) return;
  const custSel = document.getElementById("poCustomerSelect");
  const custId = customerId || (custSel && custSel.value) || appState.currentCustomer;
  const keep = value !== undefined ? String(value || "") : sel.value;
  const arts = customerArts(custId);
  if (keep && !arts.includes(keep)) arts.push(keep);
  sel.innerHTML = '<option value="">— Chọn ART —</option>' + arts.map(a => `<option value="${escHtml(a)}">${escHtml(a)}</option>`).join("");
  sel.value = keep;
  const hint = document.getElementById("poArtHint");
  if (hint) hint.innerHTML = arts.length ? "" : 'Khách này chưa có ART. <button type="button" class="mg-link-btn" data-mg-goto="art">Thêm ART</button>';
}

function renderArtParts() {
  const box = document.getElementById("artPartsList");
  if (!box) return;
  const cust = appState.customers.find(c => c.id === artPartsState.customerId);
  const title = document.getElementById("artPartsCust");
  if (title) title.textContent = cust ? cust.name : "Tất cả";
  const tabCnt = document.getElementById("mgCntArt");
  if (!cust) {
    if (tabCnt) tabCnt.textContent = 0;
    box.innerHTML = '<div class="art-empty">Chọn một khách hàng ở danh sách bên trái.</div>';
    return;
  }
  const arts = customerArts(cust.id);
  if (tabCnt) tabCnt.textContent = arts.length;
  const usedArts = new Set(appState.orders.filter(o => o.customer_id === cust.id).map(o => String(o.style_code || "").trim()));
  box.innerHTML = `<table class="art-table">
    <colgroup><col class="art-col-name"><col></colgroup>
    <thead><tr><th>ART</th><th class="art-th-parts">Các chi tiết <span>· gõ tên rồi Enter (nhiều tên cách nhau dấu phẩy), bấm × để xóa, kéo thả để đổi thứ tự</span></th></tr></thead>
    <tbody>${arts.map(art => {
      const parts = artPartsState.items[art] || [];
      const canDelete = !usedArts.has(art);
      return `<tr data-art="${escHtml(art)}"><td class="art-name"><span>${escHtml(art)}</span>${canDelete ? `<button type="button" class="art-del" aria-label="Xóa ART ${escHtml(art)}" title="Xóa ART (chưa có PO nào dùng)">×</button>` : ""}</td><td><div class="art-chips">${parts.map((p, i) => `<span class="art-chip" draggable="true" data-idx="${i}">${escHtml(p)}<button type="button" class="art-chip-x" data-del="${i}" aria-label="Xóa ${escHtml(p)}">×</button></span>`).join("")}<input type="text" class="form-control art-add-input" placeholder="+ Thêm chi tiết" autocomplete="off"></div></td></tr>`;
    }).join("")}
    <tr class="art-new-row"><td colspan="2"><div class="art-new"><input type="text" class="form-control art-new-input" placeholder="Thêm ART mới, ví dụ DA-262" autocomplete="off"><button type="button" class="btn btn-primary art-new-btn">+ Thêm ART</button><span class="art-new-err"></span></div></td></tr>
    </tbody>
  </table>`;
  refreshPoArtOptions();
}

// Thêm ART mới cho khách (chưa cần có PO); sau đó nhập chi tiết và chọn ART này khi tạo PO
async function addArt(name) {
  const customerId = artPartsState.customerId;
  const art = String(name || "").trim().slice(0, 80);
  const err = document.querySelector("#artPartsList .art-new-err");
  if (!customerId) return;
  if (!art) {
    if (err) err.textContent = "Gõ tên ART";
    return;
  }
  if (customerArts(customerId).some(a => a.toLowerCase() === art.toLowerCase())) {
    if (err) err.textContent = `ART ${art} đã có`;
    return;
  }
  try {
    const res = await fetch("/api/art-parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, art, parts: [] })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không thêm được");
    if (customerId !== artPartsState.customerId) return;
    artPartsState.items[data.art] = data.parts || [];
    renderArtParts();
    showToast(`✅ Đã thêm ART ${data.art}`);
    const row = [...document.querySelectorAll("#artPartsList tr")].find(tr => tr.dataset.art === data.art);
    const partInput = row && row.querySelector(".art-add-input");
    if (partInput) partInput.focus();
  } catch (ex) {
    if (err) err.textContent = ex.message;
  }
}

async function deleteArt(art) {
  const customerId = artPartsState.customerId;
  if (!customerId || !confirm(`Xóa ART ${art} cùng danh sách chi tiết của ART này?`)) return;
  try {
    const res = await fetch(`/api/art-parts?customer_id=${encodeURIComponent(customerId)}&art=${encodeURIComponent(art)}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không xóa được");
    if (customerId !== artPartsState.customerId) return;
    delete artPartsState.items[art];
    renderArtParts();
    showToast(`Đã xóa ART ${art}`);
  } catch (ex) {
    showToast("⚠️ " + ex.message);
  }
}

async function saveArtParts(art, parts) {
  const customerId = artPartsState.customerId;
  if (!customerId) return;
  artPartsState.items[art] = parts;
  renderArtParts();
  try {
    const res = await fetch("/api/art-parts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: customerId, art, parts })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không lưu được");
    if (customerId === artPartsState.customerId) {
      artPartsState.items[art] = data.parts;
      renderArtParts();
    }
    showToast(`💾 Đã lưu chi tiết ART ${art}`);
  } catch (err) {
    showToast("⚠️ Chưa lưu được chi tiết: " + err.message);
  }
}

function bindArtPartsEvents() {
  const box = document.getElementById("artPartsList");
  if (!box) return;
  box.addEventListener("keydown", (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    const newInput = e.target.closest(".art-new-input");
    if (newInput && e.key === "Enter") {
      e.preventDefault();
      addArt(newInput.value);
    }
  });
  box.addEventListener("input", (e) => {
    if (!e.target.closest(".art-new-input")) return;
    const err = box.querySelector(".art-new-err");
    if (err) err.textContent = "";
  });
  box.addEventListener("keydown", async (e) => {
    if (e.isComposing || e.keyCode === 229) return;
    const input = e.target.closest(".art-add-input");
    if (!input || e.key !== "Enter") return;
    e.preventDefault();
    const art = input.closest("tr").dataset.art;
    const parts = [...(artPartsState.items[art] || [])];
    const added = input.value.split(/[\t,;\n]+/).map(x => x.trim().slice(0, 40)).filter(Boolean);
    if (!added.length) return;
    added.forEach(x => {
      if (!parts.some(p => p.toLowerCase() === x.toLowerCase())) parts.push(x);
    });
    await saveArtParts(art, parts);
    const again = [...document.querySelectorAll("#artPartsList tr")].find(tr => tr.dataset.art === art);
    const nextInput = again && again.querySelector(".art-add-input");
    if (nextInput) nextInput.focus();
  });
  box.addEventListener("click", (e) => {
    const newBtn = e.target.closest(".art-new-btn");
    if (newBtn) {
      addArt(box.querySelector(".art-new-input")?.value);
      return;
    }
    const delArt = e.target.closest(".art-del");
    if (delArt) {
      deleteArt(delArt.closest("tr").dataset.art);
      return;
    }
    const del = e.target.closest(".art-chip-x");
    if (!del) return;
    const art = del.closest("tr").dataset.art;
    const parts = [...(artPartsState.items[art] || [])];
    parts.splice(Number(del.dataset.del), 1);
    saveArtParts(art, parts);
  });
  // Kéo thả để đổi thứ tự chi tiết trong cùng 1 ART
  box.addEventListener("dragstart", (e) => {
    const chip = e.target.closest(".art-chip");
    if (!chip) return;
    artPartsState.dragFrom = { art: chip.closest("tr").dataset.art, idx: Number(chip.dataset.idx) };
    chip.classList.add("is-drag");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", "");
  });
  box.addEventListener("dragover", (e) => {
    const chip = e.target.closest(".art-chip");
    const from = artPartsState.dragFrom;
    if (!chip || !from || chip.closest("tr").dataset.art !== from.art) return;
    e.preventDefault();
    box.querySelectorAll(".art-chip.is-over").forEach(c => c.classList.remove("is-over"));
    chip.classList.add("is-over");
  });
  box.addEventListener("drop", (e) => {
    const chip = e.target.closest(".art-chip");
    const from = artPartsState.dragFrom;
    if (!chip || !from) return;
    const art = chip.closest("tr").dataset.art;
    if (art !== from.art) return;
    e.preventDefault();
    const parts = [...(artPartsState.items[art] || [])];
    const [moved] = parts.splice(from.idx, 1);
    parts.splice(Number(chip.dataset.idx), 0, moved);
    artPartsState.dragFrom = null;
    saveArtParts(art, parts);
  });
  box.addEventListener("dragend", () => {
    artPartsState.dragFrom = null;
    box.querySelectorAll(".art-chip").forEach(c => c.classList.remove("is-drag", "is-over"));
  });
}

// ==========================================================
// THẢ CHUYỀN / CHỈ LỆNH ĐÓNG GÓI / TỔNG HỢP (THEO LÔ)
// Mỗi ngày 4 lần nhận theo size; tích lũy = cộng dồn cả lô tới ngày đang xem.
// Thả chuyền có 2 chế độ: Đồng bộ (đôi) và Chi tiết (mỗi chi tiết của ART là 1 cột, 1 ô / size / ngày).
// Khách có bảng công đoạn: thả chuyền ghi riêng từng công đoạn (ô Công đoạn trên popup);
// Tổng hợp so số Đồng bộ của công đoạn sau với công đoạn trước, cuối cùng Đóng gói với công đoạn cuối.
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
  kind: "tha_chuyen",   // popup đang mở: 'tha_chuyen' | 'dong_goi'
  mode: "dong",         // thả chuyền: 'dong' (đồng bộ) | 'ct' (chi tiết)
  seg: "in",            // đóng gói: 'in' (nhập) | 'sum' (tổng hợp)
  target: null,
  poId: null,
  date: null,
  batch: null,          // tên lô đang xem ('' = số nhập trước khi chia lô)
  stage: "",            // id công đoạn đang nhập ('' = khách chưa có bảng công đoạn)
  data: null,           // payload từ /api/release
  day: { tc: {}, dg: {}, ct: {} },   // ô nhận của ngày đang xem; ct: size -> {chi tiết: số}
  ctCols: [],                        // cột của bảng Chi tiết đang hiển thị
  base: { tc: {}, dg: {} },          // tích lũy các ngày trước
  ctBase: {},                        // chi tiết: size -> {chi tiết: số} các ngày trước
  dirty: false,
  ctFullNote: "",                    // "Size … đủ chi tiết → Đồng bộ …" của lần lưu gần nhất (ghép vào thông báo Lưu)
  timer: null,
  saving: Promise.resolve(true),
  seq: 0
};
let relBarSeq = 0;

function relCan(perm) {
  return REL_PERM[perm].includes(getRoleInfo(appState.currentUserRole).key);
}

const relNum = n => (Number(n) || 0).toLocaleString("vi-VN");
const relDaySum = arr => (arr || []).reduce((a, b) => a + (Number(b) || 0), 0);
const relSigned = x => (x > 0 ? "+" : "−") + relNum(Math.abs(x));
const relLotLabel = name => name || "Chưa chia lô";
const relLotPrefKey = poId => `dd_rel_lot_${poId}`;
const relStagePrefKey = custId => `dd_rel_stage_${custId}`;

// Loại số đang nhập trên bảng: thả chuyền đồng bộ / chi tiết hoặc đóng gói
function relEditKind() {
  if (relState.kind === "dong_goi") return "dong_goi";
  return relState.mode === "ct" ? "tha_chuyen_ct" : "tha_chuyen";
}
const relGridKey = () => ({ tha_chuyen: "tc", tha_chuyen_ct: "ct", dong_goi: "dg" })[relEditKind()];

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

function relReadPref(poId) {
  try {
    const v = localStorage.getItem(relLotPrefKey(poId));
    return v === null ? null : v;
  } catch (e) {
    return null;
  }
}

function relWritePref(poId, batch) {
  try {
    localStorage.setItem(relLotPrefKey(poId), batch);
  } catch (e) {}
}

// Máy nhớ công đoạn vừa chọn của từng khách
function relReadStagePref(custId) {
  try {
    return custId ? localStorage.getItem(relStagePrefKey(custId)) : null;
  } catch (e) {
    return null;
  }
}

function relWriteStagePref(custId, stage) {
  try {
    if (custId && stage) localStorage.setItem(relStagePrefKey(custId), stage);
  } catch (e) {}
}

function relStageName(id) {
  const st = ((relState.data && relState.data.stages) || []).find(x => x.id === (id === undefined ? relState.stage : id));
  return st ? st.name : "";
}

// Tích lũy 1 size (đồng bộ / đóng gói) = các ngày trước + 4 ô của ngày đang xem
function relCum(k, size) {
  return (relState.base[k][size] || 0) + relDaySum(relState.day[k][size]);
}

// Đôi gõ tay ở Đồng bộ của 1 size (lô + công đoạn đang xem, không gồm phần Chi tiết tự ghi):
// là bộ đã đủ mọi chi tiết, nên bên Chi tiết cộng vào mọi chi tiết khai báo của ART
const relTcManual = (data, size) => Math.max(0, (Number(((data && data.tcCum) || {})[size]) || 0) - (Number(((data && data.tcAuto) || {})[size]) || 0));

function relCtAddManual(data, size, cumMap) {
  const manual = relTcManual(data, size);
  if (manual) ((data && data.parts) || []).forEach(p => { cumMap[p] = (Number(cumMap[p]) || 0) + manual; });
  return cumMap;
}

// Tích lũy chi tiết của 1 size: {tên chi tiết: số}, gồm cả đôi gõ tay ở Đồng bộ
function relCtCum(size) {
  const out = { ...(relState.ctBase[size] || {}) };
  Object.entries(relState.day.ct[size] || {}).forEach(([p, q]) => {
    if (q > 0) out[p] = (out[p] || 0) + q;
  });
  return relCtAddManual(relState.data, size, out);
}

// Số đã có của 1 chi tiết, chưa tính ô đang nhập hôm nay: chi tiết các ngày trước + đôi gõ tay ở Đồng bộ
function relCtHave(size, part) {
  const parts = (relState.data && relState.data.parts) || [];
  return (Number((relState.ctBase[size] || {})[part]) || 0) + (parts.includes(part) ? relTcManual(relState.data, size) : 0);
}

// Lô + công đoạn đã có số Chi tiết (đã lưu hoặc đang gõ): Đồng bộ chỉ tự cộng từ Chi tiết, không gõ tay
function relTcLocked() {
  if (relState.kind !== "tha_chuyen") return false;
  const any = src => Object.values(src || {}).some(m => Object.values(m || {}).some(q => Number(q) > 0));
  return any(relState.ctBase) || any(relState.day.ct);
}

// Đơn hàng để tích đủ chi tiết của 1 size (0 = không có đơn theo size: không hiện ✓ / nút Đủ)
const relCtOrder = size => Number(((relState.data && relState.data.ctOrder) || {})[size]) || 0;

// Size đủ bộ: mọi chi tiết khai báo của ART có tích lũy >= đơn hàng (máy chủ tự ghi size này sang Đồng bộ)
function relCtIsFull(data, size, cumMap) {
  const parts = (data && data.parts) || [];
  const o = Number(((data && data.ctOrder) || {})[size]) || 0;
  return o > 0 && parts.length > 0 && parts.every(p => (Number(cumMap[p]) || 0) >= o);
}

// Các size đủ bộ theo số đã lưu trên máy chủ
const relCtFullSizes = data => ((data && data.sizes) || []).filter(s =>
  relCtIsFull(data, s, relCtAddManual(data, s, { ...((data.ctCum || {})[s] || {}) })));

function relApplyPayload(data, keepLocalDay) {
  relState.data = data;
  relState.batch = data.batch;
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

  const ctBase = {};
  const ctDay = data.ctDay || {};
  Object.entries(data.ctCum || {}).forEach(([s, parts]) => {
    ctBase[s] = { ...parts };
    Object.entries(ctDay[s] || {}).forEach(([p, q]) => {
      if (ctBase[s][p] !== undefined) ctBase[s][p] -= Number(q) || 0;
    });
  });
  relState.ctBase = ctBase;
  if (!keepLocalDay) {
    relState.day.ct = {};
    Object.keys(ctDay).forEach(s => {
      relState.day.ct[s] = {};
      Object.entries(ctDay[s] || {}).forEach(([p, q]) => {
        if (Number(q) > 0) relState.day.ct[s][p] = Number(q);
      });
    });
  }
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
    target,
    mode: "dong",
    poId: appState.currentPO.id,
    date: relWorkDate(),
    batch: null,
    stage: "",
    data: null,
    day: { tc: {}, dg: {}, ct: {} },
    ctCols: [],
    base: { tc: {}, dg: {} },
    ctBase: {},
    ctFullNote: "",
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
  await loadRelease(relReadPref(relState.poId), kind === "tha_chuyen" ? relReadStagePref(appState.currentPO.customer_id) : null);

  // Mở từ thanh Tổng hợp: nhảy thẳng tới lô đầu tiên đang lệch
  if (target === "sum" && relState.data) {
    const firstBad = (relState.data.lots || []).find(l => l.bad > 0);
    if (firstBad && firstBad.name !== relState.batch) {
      relShowLoading();
      await loadRelease(firstBad.name);
    }
  }
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
  ["relEmpty", "relPaneIn", "relPaneSum", "relSeg", "relMode", "relModeNote", "relStageRow"].forEach(id => { document.getElementById(id).hidden = true; });
  document.getElementById("relLotInfo").textContent = "";
  document.getElementById("relFoot").innerHTML = "";
}

async function loadRelease(batch, stage) {
  const seq = ++relState.seq;
  try {
    const q = (typeof batch === "string" ? `&batch=${encodeURIComponent(batch)}` : "")
      + (stage ? `&stage=${encodeURIComponent(stage)}` : "");
    const res = await fetch(`/api/release?po_id=${encodeURIComponent(relState.poId)}&date=${relState.date}${q}&t=${Date.now()}`);
    const data = await res.json();
    if (seq !== relState.seq) return;
    if (!data.success) throw new Error(data.error || "Không tải được số liệu");
    relApplyPayload(data, false);
    relState.stage = data.stage || "";
    relWritePref(relState.poId, data.batch);
    if (relState.kind === "tha_chuyen" && data.customer) relWriteStagePref(data.customer.id, relState.stage);
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

// Lô hiện ở hàng nút: có số tổng hoặc đã có số liệu
function relVisibleLots() {
  const lots = (relState.data && relState.data.lots) || [];
  const vis = lots.filter(l => l.total > 0 || l.tc_total || l.dg_total || l.ct_total || l.name === relState.batch);
  return vis.length ? vis : lots;
}

// Lô đã có số ở màn đang mở: đóng gói có số giao; thả chuyền có số của công đoạn đang chọn (đồng bộ hoặc chi tiết)
function relLotHasData(l) {
  if (relState.kind === "dong_goi") return l.dg_total > 0 || (relState.seg === "sum" && l.tc_last > 0);
  return l.tc_stage > 0 || l.ct_stage > 0;
}

function renderReleaseLots() {
  const box = document.getElementById("relLots");
  const showSum = relState.kind === "dong_goi" && relState.seg === "sum";
  const lots = relVisibleLots();
  box.innerHTML = lots.map(l => {
    const on = l.name === relState.batch;
    const bad = showSum && l.bad ? `<span class="rel-lot-bad">${l.bad} lệch</span>` : "";
    const rej = relState.kind === "dong_goi" && l.rejected ? '<span class="rel-lot-rej">Từ chối</span>' : "";
    return `<button type="button" class="rel-lot-tab${on ? " on" : ""}${relLotHasData(l) ? " has-data" : " is-empty"}" data-rel-lot="${escHtml(l.name)}">${escHtml(relLotLabel(l.name))}${l.color ? ` <span class="rel-lot-color">${escHtml(l.color)}</span>` : ""}${l.total ? ` · ${relNum(l.total)}` : ""}${bad}${rej}</button>`;
  }).join("");
  box.hidden = lots.length <= 1 && !(lots[0] && lots[0].legacy);
  // Hàng nút lô cuộn ngang: đưa lô đang chọn ra giữa cho dễ thấy
  const sel = box.querySelector(".rel-lot-tab.on");
  if (sel && !box.hidden) {
    const d = sel.getBoundingClientRect().left - box.getBoundingClientRect().left;
    box.scrollLeft += d - (box.clientWidth - sel.offsetWidth) / 2;
  }
}

function relCurrentLot() {
  return ((relState.data && relState.data.lots) || []).find(l => l.name === relState.batch) || null;
}

function renderReleaseLotInfo() {
  const el = document.getElementById("relLotInfo");
  const lot = relCurrentLot();
  const label = relLotLabel(relState.batch);
  const showSum = relState.kind === "dong_goi" && relState.seg === "sum";
  if (!relState.data) {
    el.textContent = "";
    return;
  }
  if (lot && lot.legacy) {
    el.innerHTML = `${label}: số đã nhập trước khi chia lô`;
    return;
  }
  const total = lot ? lot.total : 0;
  if (showSum) {
    el.innerHTML = `${escHtml(label)}: số tổng <span class="rel-num-blue">${relNum(total)}</span> đôi`;
    return;
  }
  if (relEditKind() === "tha_chuyen_ct") {
    const manual = relState.data.sizes.reduce((a, s) => a + relTcManual(relState.data, s), 0);
    const manualNote = manual ? `<span class="rel-lot-sub">Đã có <span class="rel-num-blue">${relNum(manual)}</span> đôi nhập ở Đồng bộ, tính là đủ mọi chi tiết</span>` : "";
    const withOrder = relState.data.sizes.filter(s => relCtOrder(s) > 0);
    if (!withOrder.length) {
      el.innerHTML = `${escHtml(label)}: ô hồng là số nhận hôm nay, số xanh bên dưới là tích lũy cả lô (chi tiết không tính vào Tổng hợp)${manualNote}`;
      return;
    }
    const full = withOrder.filter(s => relCtIsFull(relState.data, s, relCtCum(s))).length;
    el.innerHTML = `${escHtml(label)}: đủ bộ <span class="${full === withOrder.length ? "rel-num-green" : "rel-num-blue"}">${full}/${withOrder.length}</span> size · size đủ bộ tự ghi sang Đồng bộ${manualNote}`;
    return;
  }
  const k = relGridKey();
  const done = relState.data.sizes.reduce((a, s) => a + relCum(k, s), 0);
  const verb = k === "tc" ? (relStageName() ? `đã ${relStageName().toLowerCase()}` : "đã thả") : "đã đóng gói";
  const lockNote = k === "tc" && relTcLocked()
    ? '<span class="rel-lot-sub is-lock">Lô này đang nhập theo Chi tiết: Đồng bộ tự cộng khi size đủ mọi chi tiết, không gõ tay</span>'
    : "";
  if (!total) {
    el.innerHTML = `${escHtml(label)}: chưa ghi số tổng · ${verb} <span class="rel-num-blue">${relNum(done)}</span>${lockNote}`;
    return;
  }
  const left = total - done;
  el.innerHTML = `${escHtml(label)}: số tổng <span class="rel-num-blue">${relNum(total)}</span> · ${verb} <span class="rel-num-blue">${relNum(done)}</span> · còn <span class="${left ? "rel-num-pink" : "rel-num-navy"}">${relNum(left)}</span>${lockNote}`;
}

function renderRelease() {
  const d = relState.data;
  if (!d) return;
  document.getElementById("relLoading").hidden = true;
  renderReleaseInfo();

  // Công đoạn (chỉ thả chuyền, khách có bảng công đoạn): tiêu đề và nút lưu ghi rõ công đoạn đang nhập
  const stages = d.stages || [];
  const stageRow = document.getElementById("relStageRow");
  stageRow.hidden = relState.kind !== "tha_chuyen" || !stages.length;
  document.getElementById("relStage").innerHTML = stages.map((x, i) => `<option value="${escHtml(x.id)}"${x.id === relState.stage ? " selected" : ""}>${i + 1}. ${escHtml(x.name)}</option>`).join("");
  if (relState.kind === "tha_chuyen") {
    document.getElementById("relTitle").textContent = relStageName() ? `Thả chuyền · ${relStageName()}` : "Thả chuyền";
  }

  // Đồng bộ / Chi tiết (chỉ thả chuyền)
  const modeBox = document.getElementById("relMode");
  const note = document.getElementById("relModeNote");
  const hasParts = (d.parts || []).length > 0;
  if (relState.mode === "ct" && !hasParts) relState.mode = "dong";
  modeBox.hidden = relState.kind !== "tha_chuyen";
  modeBox.querySelectorAll("[data-rel-mode]").forEach(b => {
    b.classList.toggle("on", b.dataset.relMode === relState.mode);
    if (b.dataset.relMode === "ct") b.disabled = !hasParts;
  });
  note.hidden = relState.kind !== "tha_chuyen" || hasParts;
  note.textContent = "ART này chưa khai báo chi tiết. Admin khai báo ở tab Khách hàng & PO.";

  // Nhập đóng gói / Tổng hợp
  const segBox = document.getElementById("relSeg");
  segBox.hidden = !(relState.kind === "dong_goi" && relCan("summary"));
  if (relState.seg === "sum" && !relCan("summary")) relState.seg = "in";
  segBox.querySelectorAll(".rel-seg-btn").forEach(b => b.classList.toggle("on", b.dataset.relSeg === relState.seg));

  renderReleaseLots();
  renderReleaseLotInfo();

  const noSizes = !d.sizes || d.sizes.length === 0;
  const empty = document.getElementById("relEmpty");
  empty.hidden = !noSizes;
  if (noSizes) {
    empty.textContent = "Khách hàng này chưa có dãy size. Quản trị khai báo ở tab Khách hàng & PO.";
    document.getElementById("relPaneIn").hidden = true;
    document.getElementById("relPaneSum").hidden = true;
    relRenderFoot();
    return;
  }

  const showSum = relState.kind === "dong_goi" && relState.seg === "sum";
  document.getElementById("relPaneIn").hidden = showSum;
  document.getElementById("relPaneSum").hidden = !showSum;
  document.getElementById("relChips").hidden = relState.kind !== "dong_goi";
  document.getElementById("relReject").hidden = true;
  document.getElementById("modalRelease").dataset.mode = relEditKind() === "tha_chuyen_ct" ? "ct" : "dong";
  renderReleaseGrid();
  renderReleaseChips();
  renderReleaseSummary();
  relRenderFoot();
}

function relCanEditCurrent() {
  return relState.kind === "tha_chuyen" ? relCan("tcEdit") : relCan("dgEdit");
}

// Cột bảng Chi tiết: các chi tiết khai báo cho ART theo thứ tự,
// thêm tên đã có số nhưng không còn trong danh sách (để không bị ẩn số)
function relCtParts() {
  const parts = [...((relState.data && relState.data.parts) || [])];
  const seen = new Set(parts);
  [relState.ctBase, relState.day.ct].forEach(src => Object.values(src || {}).forEach(m => {
    Object.entries(m || {}).forEach(([p, q]) => {
      if (q > 0 && !seen.has(p)) {
        seen.add(p);
        parts.push(p);
      }
    });
  }));
  return parts;
}

// Cột Đơn hàng (thả chuyền Đồng bộ / chỉ lệnh đóng gói, PO đã dán đơn theo size):
// so tích lũy (công đoạn đang chọn hoặc đóng gói) với số đơn
function relOrderSource() {
  const d = relState.data;
  if (!d) return "";
  if (Object.keys(d.lotOrder || {}).length) return "lot";
  return Object.keys(d.order || {}).length ? "po" : "";
}

function relShowOrder() {
  const k = relGridKey();
  return (k === "tc" || k === "dg") && !!relOrderSource();
}

const relOrderQty = size => Number(((relOrderSource() === "lot" ? relState.data.lotOrder : relState.data.order) || {})[size]) || 0;
const relOrderCum = size => (relOrderSource() === "lot" ? relCum(relGridKey(), size) : relPoCum(size));

// Tích lũy cả PO (mọi lô) của size, cộng cả số đang gõ chưa lưu của lô đang xem
function relPoCum(size) {
  const d = relState.data;
  const k = relGridKey();
  const [poKey, lotKey] = k === "dg" ? ["poDgCum", "dgCum"] : ["poCum", "tcCum"];
  return (Number((d[poKey] || {})[size]) || 0) - (Number((d[lotKey] || {})[size]) || 0) + relCum(k, size);
}

function relOrderCellHtml(size) {
  const order = relOrderQty(size);
  if (!order) return '<span class="rel-none">—</span>';
  const d = relOrderCum(size) - order;
  const cls = d === 0 ? "is-ok" : (d < 0 ? "is-less" : "is-over");
  const text = d === 0 ? "OK" : (d < 0 ? `còn ${relNum(-d)}` : `vượt ${relNum(d)}`);
  return `<div class="rel-ord ${cls}"><small>${relNum(order)}</small><b>${text}</b></div>`;
}

// Bảng Chi tiết: Size (+ đơn hàng) | mỗi chi tiết 1 cột. Ô = số nhận hôm nay, bên dưới = tích lũy cả lô / đơn hàng.
// Có đơn hàng theo size: ô trống còn thiếu hiện ✓ (bấm = điền đủ), tên chi tiết có nút Đủ (điền cả cột).
// ART nhiều chi tiết thì bảng rộng hơn khung, kéo ngang (cột Size đứng yên).
function renderReleaseCtGrid() {
  const editable = relCanEditCurrent();
  const parts = relCtParts();
  const hasOrder = relState.data.sizes.some(s => relCtOrder(s) > 0);
  relState.ctCols = parts;
  document.querySelector("#relPaneIn .rel-table").style.minWidth = `${56 + parts.length * 70}px`;
  document.getElementById("relGridCols").innerHTML = '<col style="width:56px">' + parts.map(() => "<col>").join("");
  document.getElementById("relGridHead").innerHTML = `<th class="rel-ct-sticky">Size${hasOrder ? "<small>Đơn hàng</small>" : ""}</th>`
    + parts.map(p => `<th class="rel-th-part"><span class="rel-ct-pn">${escHtml(p)}</span>${editable && hasOrder ? `<button type="button" class="rel-ct-full" data-rel-full="${escHtml(p)}" aria-label="Đủ cả cột ${escHtml(p)}"><span class="rel-ct-box"></span>Đủ</button>` : ""}</th>`).join("");
  document.getElementById("relTbody").innerHTML = relState.data.sizes.map(size => {
    const day = relState.day.ct[size] || {};
    const cells = parts.map(p => {
      const v = Number(day[p]) || 0;
      const tick = editable ? `<button type="button" class="rel-ct-tick" data-rel-tick data-size="${escHtml(size)}" data-part="${escHtml(p)}" aria-label="Điền đủ size ${escHtml(size)}, ${escHtml(p)}">✓</button>` : "";
      return `<td class="rel-ct-cell"><div class="rel-ct-in" data-ct-in data-size="${escHtml(size)}" data-part="${escHtml(p)}"><input type="text" class="rel-input" inputmode="numeric" autocomplete="off" data-size="${escHtml(size)}" data-part="${escHtml(p)}" value="${v || ""}"${editable ? "" : ' readonly tabindex="-1"'} aria-label="Size ${escHtml(size)}, ${escHtml(p)}">${tick}</div><div class="rel-ct-tl" data-ct-size="${escHtml(size)}" data-part="${escHtml(p)}"></div></td>`;
    }).join("");
    return `<tr><td class="rel-size rel-ct-sticky" data-ct-sz="${escHtml(size)}"></td>${cells}</tr>`;
  }).join("");
  relCtPaint();
  renderReleaseTotals();
}

// Tô lại bảng Chi tiết theo số đang có (không vẽ lại ô nhập để không mất con trỏ khi đang gõ):
// ✓ trong ô, tích lũy / đơn hàng, ô size "Đủ bộ", nút Đủ trên tên chi tiết
function relCtPaint() {
  const editable = relCanEditCurrent();
  const cums = {};
  relState.data.sizes.forEach(s => { cums[s] = relCtCum(s); });
  const baseOf = relCtHave;
  document.querySelectorAll("#relTbody [data-ct-in]").forEach(box => {
    const { size, part } = box.dataset;
    const v = Number((relState.day.ct[size] || {})[part]) || 0;
    const o = relCtOrder(size);
    const canTick = editable && o > 0 && !v && baseOf(size, part) < o;
    const inp = box.querySelector(".rel-input");
    box.classList.toggle("can-tick", canTick);
    inp.placeholder = editable && !canTick ? "0" : "";
    if (document.activeElement !== inp) inp.value = v || "";
  });
  document.querySelectorAll("#relTbody [data-ct-size]").forEach(el => {
    const size = el.dataset.ctSize;
    const c = Number((cums[size] || {})[el.dataset.part]) || 0;
    const o = relCtOrder(size);
    el.classList.toggle("is-ok", o > 0 && c === o);
    el.classList.toggle("is-over", o > 0 && c > o);
    el.innerHTML = !o ? relNum(c) : (c === o ? `${relNum(c)} ✓` : `${relNum(c)}<small>/${relNum(o)}</small>`);
  });
  document.querySelectorAll("#relTbody [data-ct-sz]").forEach(td => {
    const size = td.dataset.ctSz;
    const o = relCtOrder(size);
    const full = relCtIsFull(relState.data, size, cums[size] || {});
    td.classList.toggle("is-full", full);
    td.innerHTML = `${escHtml(size)}${o ? `<small class="rel-ct-ord">${relNum(o)}</small>` : ""}${full ? '<em class="rel-ct-badge">Đủ bộ</em>' : ""}`;
  });
  const withOrder = relState.data.sizes.filter(s => relCtOrder(s) > 0);
  document.querySelectorAll("#relGridHead [data-rel-full]").forEach(b => {
    const p = b.dataset.relFull;
    const on = withOrder.every(s => (Number(cums[s][p]) || 0) >= relCtOrder(s));
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", String(on));
    b.disabled = withOrder.every(s => baseOf(s, p) >= relCtOrder(s));
    b.querySelector(".rel-ct-box").textContent = on ? "✓" : "";
  });
}

// ✓ trong ô Chi tiết: điền số còn thiếu để tích lũy của size đủ đơn hàng
function relCtTick(size, part) {
  const o = relCtOrder(size);
  const base = relCtHave(size, part);
  if (!relCanEditCurrent() || o <= base) return;
  relState.day.ct[size] = { ...(relState.day.ct[size] || {}), [part]: o - base };
  relUpdateCums();
  relScheduleSave();
}

// Nút Đủ trên tên chi tiết: điền đủ mọi size (có đơn hàng) của chi tiết đó; đang đủ thì xóa số hôm nay của chi tiết đó
function relCtToggleCol(part) {
  if (!relCanEditCurrent()) return;
  const sizes = relState.data.sizes.filter(s => relCtOrder(s) > 0);
  const on = sizes.every(s => (Number(relCtCum(s)[part]) || 0) >= relCtOrder(s));
  if (on && !confirm(`Xóa số nhận hôm nay của "${part}" ở mọi size?`)) return;
  sizes.forEach(s => {
    const m = { ...(relState.day.ct[s] || {}) };
    const base = relCtHave(s, part);
    if (on) delete m[part];
    else if (base + (Number(m[part]) || 0) < relCtOrder(s)) m[part] = relCtOrder(s) - base;
    relState.day.ct[s] = m;
  });
  relUpdateCums();
  relScheduleSave();
}

function renderReleaseGrid() {
  const k = relGridKey();
  if (k === "ct") {
    renderReleaseCtGrid();
    return;
  }
  document.querySelector("#relPaneIn .rel-table").style.minWidth = "";
  const editable = relCanEditCurrent() && !(k === "tc" && relTcLocked());
  const showOrd = relShowOrder();
  document.getElementById("relGridCols").innerHTML = showOrd
    ? '<col style="width:12%"><col><col><col><col><col style="width:16%"><col style="width:18%">'
    : '<col class="rel-col-size"><col><col><col><col><col class="rel-col-cum">';
  // Thả chuyền: các lần nhận hàng; Chỉ lệnh đóng gói: các lần giao cho đóng gói
  const turn = relState.kind === "dong_goi" ? "Giao" : "Nhận";
  document.getElementById("relGridHead").innerHTML = `<th>Size</th>${[1, 2, 3, 4].map(i => `<th>${turn} ${i}</th>`).join("")}<th class="rel-th-cum" id="relThCum">Tích lũy</th>`
    + (showOrd ? `<th class="rel-th-ord">Đơn hàng<small>${relOrderSource() === "lot" ? "lô này" : "cả PO"}</small></th>` : "");
  // Đóng gói đã từ chối: tô hồng các size đóng gói báo sai (tới khi tổ trưởng xác nhận lại)
  const c = relState.data.confirm || {};
  const rejSizes = new Set(k === "dg" && c.reject_at ? (c.reject_sizes || []).map(String) : []);
  document.getElementById("relTbody").innerHTML = relState.data.sizes.map(size => {
    const cells = [0, 1, 2, 3].map(i => {
      const v = Number((relState.day[k][size] || [])[i]) || 0;
      return `<td><input type="text" class="rel-input" inputmode="numeric" autocomplete="off" data-size="${escHtml(size)}" data-i="${i}" value="${v || ""}" placeholder="${editable ? "0" : ""}"${editable ? "" : ' readonly tabindex="-1"'} aria-label="Size ${escHtml(size)}, lần nhận ${i + 1}"></td>`;
    }).join("");
    // Đồng bộ có phần do Chi tiết tự ghi (size đủ mọi chi tiết): ô Tích lũy xanh lá
    const auto = k === "tc" && Number((relState.data.tcAuto || {})[size]) > 0;
    const cum = `<td><span class="rel-cum${auto ? " is-auto" : ""}" data-cum-size="${escHtml(size)}">${relNum(relCum(k, size))}</span>${auto ? '<small class="rel-from-ct">từ Chi tiết</small>' : ""}</td>`;
    const ord = showOrd ? `<td class="rel-ord-td" data-ord-size="${escHtml(size)}">${relOrderCellHtml(size)}</td>` : "";
    return `<tr${rejSizes.has(String(size)) ? ' class="is-rejected"' : ""}><td class="rel-size">${escHtml(size)}</td>${cells}${cum}${ord}</tr>`;
  }).join("");
  renderReleaseTotals();
}

function renderReleaseTotals() {
  const k = relGridKey();
  const foot = document.getElementById("relTfoot");
  if (k === "ct") {
    // Mỗi chi tiết cộng riêng: hôm nay (+) và tích lũy cả lô
    const day = {};
    const all = {};
    relState.data.sizes.forEach(size => {
      Object.entries(relState.day.ct[size] || {}).forEach(([p, q]) => { day[p] = (day[p] || 0) + q; });
      Object.entries(relCtCum(size)).forEach(([p, q]) => { all[p] = (all[p] || 0) + q; });
    });
    foot.innerHTML = '<td class="rel-foot-lbl rel-ct-sticky">Tổng</td>'
      + relState.ctCols.map(p => `<td><span class="rel-ct-ft-day">+${relNum(day[p])}</span><span class="rel-ct-ft-cum">${relNum(all[p])}</span></td>`).join("");
    return;
  }
  const cols = [0, 0, 0, 0];
  let total = 0;
  relState.data.sizes.forEach(size => {
    const day = relState.day[k][size] || [];
    [0, 1, 2, 3].forEach(i => { cols[i] += Number(day[i]) || 0; });
    total += relCum(k, size);
  });
  let ordFoot = "";
  if (relShowOrder()) {
    const withOrder = relState.data.sizes.filter(size => relOrderQty(size) > 0);
    const ok = withOrder.filter(size => relOrderCum(size) === relOrderQty(size)).length;
    ordFoot = `<td>${withOrder.length && ok === withOrder.length ? '<span class="rel-ord is-ok"><b>OK</b></span>' : `<span class="rel-ord-count">${ok}/${withOrder.length} đủ</span>`}</td>`;
  }
  foot.innerHTML = `<td class="rel-foot-lbl">Tổng</td>${cols.map(v => `<td>${relNum(v)}</td>`).join("")}<td><span class="rel-cum">${relNum(total)}</span></td>${ordFoot}`;
}

function relUpdateCums() {
  const k = relGridKey();
  document.querySelectorAll("#relTbody [data-cum-size]").forEach(el => {
    el.textContent = relNum(relCum(k, el.dataset.cumSize));
  });
  if (k === "ct") relCtPaint();
  document.querySelectorAll("#relTbody [data-ord-size]").forEach(el => {
    el.innerHTML = relOrderCellHtml(el.dataset.ordSize);
  });
  renderReleaseTotals();
  renderReleaseLotInfo();
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

  // Đóng gói đã từ chối: dòng đỏ ghi size sai + lý do, tới khi tổ trưởng xác nhận lại
  const rejected = !!c.reject_at && !c.leader_at;
  leader.classList.toggle("bad", rejected);
  pack.classList.toggle("bad", rejected);
  if (rejected) {
    leader.textContent = "Tổ trưởng: cần xác nhận lại";
    pack.textContent = `Đóng gói: đã từ chối ${relFmtTime(c.reject_at)}`;
    pack.title = c.reject_by ? `Người từ chối: ${c.reject_by}` : "";
  }
  const box = document.getElementById("relReject");
  box.hidden = !rejected;
  if (rejected) {
    const sizes = (c.reject_sizes || []).map(escHtml).join(", ");
    const todo = relCan("leaderConfirm") ? "Sửa số các size này rồi bấm Tổ trưởng xác nhận lại." : "Chờ tổ trưởng sửa số và xác nhận lại.";
    box.innerHTML = `<b>Đóng gói từ chối lúc ${relFmtTime(c.reject_at)}${c.reject_by ? ` (${escHtml(c.reject_by)})` : ""}</b>`
      + `<span>Size sai: <b>${sizes}</b>${c.reject_note ? ` · ${escHtml(c.reject_note)}` : ""}</span><span>${todo}</span>`;
  }
}

// Cột của bảng Tổng hợp: từng công đoạn theo trình tự (khách chưa có công đoạn: 1 cột Thả chuyền), cuối cùng Đóng gói.
// Mỗi cột so với cột ngay trước (tích lũy), nên công đoạn n+1 so với n và Đóng gói so với công đoạn cuối.
function relSumColumns() {
  const stages = (relState.data && relState.data.stages) || [];
  const cols = stages.length
    ? stages.map((x, i) => ({ key: x.id, name: x.name, no: i + 1 }))
    : [{ key: "", name: "Thả chuyền", no: 0 }];
  cols.push({ key: "#dg", name: "Đóng gói", no: 0 });
  return cols;
}

function relSumValue(col, size) {
  if (col.key === "#dg") return relCum("dg", size);
  const m = (relState.data.stageCum || {})[col.key];
  return m ? Number(m[size]) || 0 : relCum("tc", size);
}

function relStats() {
  const cols = relSumColumns();
  const sizes = relState.data.sizes;
  const vals = sizes.map(size => cols.map(c => relSumValue(c, size)));
  const totals = cols.map((_, k) => vals.reduce((a, row) => a + row[k], 0));
  const steps = cols.slice(1).map((c, k) => ({
    from: cols[k],
    to: c,
    bad: vals.filter(row => row[k + 1] !== row[k]).length
  }));
  return { cols, sizes, vals, totals, steps, hasAny: totals.some(Boolean) };
}

// Ô của bảng Tổng hợp: số tích lũy, bên dưới là lệch so với cột ngay trước (OK nếu bằng nhau)
function relSumCell(v, prev, k, cls) {
  const num = `<span class="rel-sum-v${v ? "" : " is-zero"}">${relNum(v)}</span>`;
  if (!k || (!v && !prev)) return `<td${cls ? ` class="${cls}"` : ""}>${num}</td>`;
  const d = v - prev;
  return `<td${cls ? ` class="${cls}"` : ""}>${num}${d ? `<span class="rel-sum-d is-bad">${relSigned(d)}</span>` : '<span class="rel-sum-d">OK</span>'}</td>`;
}

function renderReleaseSummary() {
  if (relState.kind !== "dong_goi" || !relState.data) return;
  const st = relStats();
  const label = relLotLabel(relState.batch);
  const table = document.getElementById("relSumTable");
  table.style.minWidth = st.cols.length > 3 ? `${52 + st.cols.length * 66}px` : "";
  document.getElementById("relSumHead").innerHTML = '<th class="rel-sum-size">Size</th>' + st.cols.map((c, k) =>
    `<th class="${c.key === "#dg" ? "rel-th-dg" : "rel-th-tc"}">${c.no ? `<span class="rel-sum-no">${c.no}</span>` : ""}${escHtml(c.name)}${k ? `<small>so với ${escHtml(st.cols[k - 1].name)}</small>` : ""}</th>`
  ).join("");
  document.getElementById("relSumBody").innerHTML = st.sizes.map((size, r) =>
    `<tr><td class="rel-size rel-sum-size">${escHtml(size)}</td>${st.vals[r].map((v, k) => relSumCell(v, k ? st.vals[r][k - 1] : 0, k)).join("")}</tr>`
  ).join("");
  document.getElementById("relSumFoot").innerHTML = '<td class="rel-foot-lbl rel-sum-size">Tổng</td>'
    + st.totals.map((v, k) => relSumCell(v, k ? st.totals[k - 1] : 0, k)).join("");

  const banner = document.getElementById("relBanner");
  if (!st.hasAny) {
    banner.className = "rel-banner is-empty";
    banner.textContent = `${label}: chưa có số thả chuyền và đóng gói`;
    return;
  }
  const badSteps = st.steps.filter(x => x.bad).length;
  banner.className = "rel-banner rel-steps" + (badSteps ? "" : " is-ok");
  banner.innerHTML = `<div class="rel-steps-title">${escHtml(label)}: ${badSteps ? `<span class="rel-diff-txt">${badSteps} bước còn lệch</span>` : "các bước đều khớp"}</div>`
    + st.steps.map(x => `<div class="rel-step${x.bad ? " is-bad" : ""}"><span>${escHtml(x.from.name)} → ${escHtml(x.to.name)}</span><b>${x.bad ? `${x.bad} size lệch` : "OK"}</b></div>`).join("");
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
    const what = relStageName() ? `Lưu ${escHtml(relStageName())}` : "Lưu thả chuyền";
    foot.innerHTML = closeBtn + `<button type="button" class="rel-fbtn rel-fbtn-tc" data-rel-act="save">${REL_ICON.save}${what}${relState.mode === "ct" ? " chi tiết" : ""}</button>`;
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
    // Tổ trưởng đã xác nhận, đóng gói chưa: đóng gói được từ chối (số sai) hoặc xác nhận
    if (c.leader_at && !c.packing_at) btns.push('<button type="button" class="rel-fbtn rel-fbtn-reject" data-rel-act="reject">Từ chối</button>');
    btns.push(`<button type="button" class="rel-fbtn rel-fbtn-dg" data-rel-act="packing"${(!c.leader_at || c.packing_at) ? " disabled" : ""}>${REL_ICON.pack}${c.packing_at ? "Đóng gói đã xác nhận" : "Đóng gói xác nhận"}</button>`);
  }
  if (!btns.length) btns.push(closeBtn);
  foot.style.gridTemplateColumns = btns.map(b => (b.includes('data-rel-act="reject"') ? "0.7fr" : "1fr")).join(" ");
  const lot = escHtml(relLotLabel(relState.batch));
  const hint = !relCan("packConfirm") || c.leader_at ? ""
    : c.reject_at
      ? `<div class="rel-hint">Đã từ chối ${lot} lúc ${relFmtTime(c.reject_at)}. Chờ tổ trưởng sửa số và xác nhận lại.</div>`
      : `<div class="rel-hint">Chờ tổ trưởng xác nhận ${lot} rồi mới bấm Đóng gói xác nhận.</div>`;
  foot.innerHTML = btns.join("") + hint;
}

function relScheduleSave() {
  relState.dirty = true;
  clearTimeout(relState.timer);
  relState.timer = setTimeout(saveRelease, 800);
}

function onReleaseInput(e) {
  const el = e.target;
  if (!el.classList.contains("rel-input") || el.readOnly || !relState.data) return;
  const clean = el.value.replace(/\D/g, "").slice(0, 6);
  if (clean !== el.value) el.value = clean;
  const k = relGridKey();
  const size = el.dataset.size;
  const qty = parseInt(clean, 10) || 0;
  if (k === "ct") {
    const m = relState.day.ct[size] || {};
    if (qty) m[el.dataset.part] = qty;
    else delete m[el.dataset.part];
    relState.day.ct[size] = m;
  } else {
    const arr = relState.day[k][size] || [0, 0, 0, 0];
    arr[Number(el.dataset.i)] = qty;
    relState.day[k][size] = arr;
  }
  relUpdateCums();
  renderReleaseSummary();
  relScheduleSave();
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
    const kind = relEditKind();
    const poId = relState.poId;
    const date = relState.date;
    const batch = relState.batch || "";
    const stage = kind === "dong_goi" ? "" : (relState.stage || "");
    relState.dirty = false;
    const fullBefore = kind === "tha_chuyen_ct" ? relCtFullSizes(relState.data) : null;
    const rows = relState.data.sizes.map(size => {
      if (kind === "tha_chuyen_ct") return { size, q: { ...(relState.day.ct[size] || {}) } };
      const k = kind === "dong_goi" ? "dg" : "tc";
      return { size, n: [0, 1, 2, 3].map(i => Number((relState.day[k][size] || [])[i]) || 0) };
    });
    try {
      const res = await fetch("/api/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ po_id: poId, date, kind, batch, stage, rows, user: relUserName() })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Lưu không thành công");
      if (relState.poId === poId && relState.date === date && relState.batch === batch && relEditKind() === kind && (kind === "dong_goi" || (relState.stage || "") === stage)) {
        relApplyPayload(data, true);
        relUpdateCums();
        renderReleaseLots();
        renderReleaseChips();
        renderReleaseSummary();
        relRenderFoot();
      }
      if (data.confirmReset) showToast(`⚠️ Đã sửa số đóng gói ${relLotLabel(batch)}: tổ trưởng và đóng gói cần xác nhận lại`);
      // Size vừa đủ mọi chi tiết: máy chủ đã ghi sang Tích lũy của Đồng bộ
      const fresh = fullBefore ? relCtFullSizes(data).filter(s => !fullBefore.includes(s)) : [];
      if (fresh.length) {
        relState.ctFullNote = `Size ${fresh.join(", ")} đủ chi tiết → Đồng bộ ${fresh.map(s => relNum((data.tcCum || {})[s])).join(", ")} đôi`;
        showToast(`✅ ${relState.ctFullNote}`);
      }
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
  showToast(`💾 Đã lưu thả chuyền${relStageName() ? ` · ${relStageName()}` : ""} ${relLotLabel(relState.batch)} ngày ${relFmtDate(relState.date)}${relState.ctFullNote ? `. ${relState.ctFullNote}` : ""}`);
  relState.ctFullNote = "";
  closeReleaseModal();
}

// Đổi lô: lưu nốt số đang gõ rồi mới tải lô mới
async function switchReleaseLot(name) {
  if (name === relState.batch) return;
  const ok = await saveRelease();
  if (ok === false) return;
  relState.day = { tc: {}, dg: {}, ct: {} };
  relShowLoading();
  await loadRelease(name, relState.stage);
}

// Đổi công đoạn: lưu nốt số đang gõ rồi tải số của công đoạn mới (cùng lô)
async function switchReleaseStage(stage) {
  if (!stage || stage === relState.stage) return;
  const ok = await saveRelease();
  if (ok === false) {
    document.getElementById("relStage").value = relState.stage;
    return;
  }
  relState.day = { tc: {}, dg: {}, ct: {} };
  relShowLoading();
  await loadRelease(relState.batch, stage);
}

// Đổi Đồng bộ / Chi tiết: lưu nốt chế độ đang gõ rồi đổi bảng (số của cả 2 chế độ đã có sẵn)
async function switchReleaseMode(mode) {
  if (mode === relState.mode) return;
  if (mode === "ct" && !((relState.data && relState.data.parts) || []).length) return;
  const ok = await saveRelease();
  if (ok === false) return;
  relState.mode = mode;
  renderRelease();
}

async function confirmRelease(step) {
  const ok = await saveRelease();
  if (ok === false) return;
  try {
    const res = await fetch("/api/release/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ po_id: relState.poId, date: relState.date, batch: relState.batch || "", step, user: relUserName() })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không xác nhận được");
    relApplyPayload(data, true);
    const label = relLotLabel(relState.batch);
    showToast(step === "leader" ? `✅ Tổ trưởng đã xác nhận chỉ lệnh đóng gói ${label}` : `✅ Đóng gói đã xác nhận nhận đủ ${label}`);
    if (step === "packing" && relCan("summary")) relState.seg = "sum";
    renderRelease();
    refreshReleaseBar();
  } catch (err) {
    showToast("⚠️ " + err.message);
  }
}

// Đóng gói từ chối số của lô: chọn size sai (bắt buộc) + lý do nhanh / ghi thêm.
// Số giữ nguyên, chỉ bỏ xác nhận của tổ trưởng để tổ trưởng sửa rồi xác nhận lại.
const REL_REJECT_REASONS = ["Thiếu hàng", "Dư hàng", "Sai size"];

function relOpenReject() {
  const d = relState.data;
  if (!d || !relCan("packConfirm")) return;
  document.getElementById("relRejTitle").textContent = `Từ chối số ${relLotLabel(relState.batch)}`;
  document.getElementById("relRejSizes").innerHTML = d.sizes.map(s =>
    `<button type="button" class="rel-rej-chip" data-rej-size="${escHtml(s)}" aria-pressed="false">${escHtml(s)}</button>`).join("");
  document.getElementById("relRejReasons").innerHTML = REL_REJECT_REASONS.map(r =>
    `<button type="button" class="rel-rej-chip" data-rej-reason="${escHtml(r)}" aria-pressed="false">${escHtml(r)}</button>`).join("");
  document.getElementById("relRejNote").value = "";
  document.getElementById("relRejErr").hidden = true;
  document.querySelector('#relRejSheet [data-rej-act="send"]').disabled = false;
  document.getElementById("relRejSheet").hidden = false;
}

function relCloseReject() {
  document.getElementById("relRejSheet").hidden = true;
}

async function relSendReject() {
  const sheet = document.getElementById("relRejSheet");
  const sizes = [...sheet.querySelectorAll("[data-rej-size].on")].map(b => b.dataset.rejSize);
  if (!sizes.length) {
    const err = document.getElementById("relRejErr");
    err.textContent = "Bấm chọn ít nhất 1 size bị sai";
    err.hidden = false;
    return;
  }
  const typed = document.getElementById("relRejNote").value.trim();
  const note = [...[...sheet.querySelectorAll("[data-rej-reason].on")].map(b => b.dataset.rejReason), typed].filter(Boolean).join(" · ");
  const sendBtn = sheet.querySelector('[data-rej-act="send"]');
  sendBtn.disabled = true;
  try {
    const res = await fetch("/api/release/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ po_id: relState.poId, date: relState.date, batch: relState.batch || "", step: "reject", sizes, note, user: relUserName() })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Không gửi được");
    relCloseReject();
    relApplyPayload(data, true);
    showToast(`Đã từ chối ${relLotLabel(relState.batch)}: tổ trưởng sẽ sửa số và xác nhận lại`);
    renderRelease();
    refreshReleaseBar();
  } catch (err) {
    sendBtn.disabled = false;
    showToast("⚠️ " + err.message);
  }
}

async function closeReleaseModal() {
  const modal = document.getElementById("modalRelease");
  if (!modal) return;
  const ok = await saveRelease();
  if (ok === false && !confirm("Chưa lưu được số vừa nhập. Vẫn đóng?")) return;
  relCloseReject();
  relState.seq++;
  modal.classList.remove("show");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  refreshReleaseBar();
}

// Thanh "Tổng hợp thả chuyền – đóng gói" trên trang chủ + nút Tổng hợp trên laptop: cộng size lệch của mọi lô
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
    const lots = data.lots || [];
    const bad = lots.reduce((a, l) => a + (l.bad || 0), 0);
    const badLots = lots.filter(l => l.bad > 0).length;
    const hasData = lots.some(l => l.tc_total || l.dg_total);
    // Lô bị đóng gói từ chối: báo trước tiên để tổ trưởng vào sửa
    const rejected = lots.filter(l => l.rejected).map(l => relLotLabel(l.name));
    if (rejected.length) setState("", `${rejected.join(", ")}: đóng gói từ chối${bad ? ` · ${bad} size lệch` : ""}`, "(từ chối)");
    else if (bad) setState("", `${bad} size lệch · ${badLots} lô`, `(${bad} lệch)`);
    else if (hasData) setState("is-ok", "Đủ, tất cả OK", "(đủ)");
    else if (!data.sizes || !data.sizes.length) setState("is-empty", "Chưa có size", "");
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
    const tick = e.target.closest("[data-rel-tick]");
    if (tick) {
      relCtTick(tick.dataset.size, tick.dataset.part);
      return;
    }
    const fullBtn = e.target.closest("[data-rel-full]");
    if (fullBtn) {
      if (!fullBtn.disabled) relCtToggleCol(fullBtn.dataset.relFull);
      return;
    }
    const lotBtn = e.target.closest("[data-rel-lot]");
    if (lotBtn) {
      switchReleaseLot(lotBtn.dataset.relLot);
      return;
    }
    const modeBtn = e.target.closest("[data-rel-mode]");
    if (modeBtn) {
      if (!modeBtn.disabled) switchReleaseMode(modeBtn.dataset.relMode);
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
    else if (a === "reject") relOpenReject();
  });

  document.getElementById("relRejSheet").addEventListener("click", (e) => {
    if (e.target.id === "relRejSheet") {
      relCloseReject();
      return;
    }
    const chip = e.target.closest("[data-rej-size], [data-rej-reason]");
    if (chip) {
      chip.classList.toggle("on");
      chip.setAttribute("aria-pressed", String(chip.classList.contains("on")));
      document.getElementById("relRejErr").hidden = true;
      return;
    }
    const btn = e.target.closest("[data-rej-act]");
    if (!btn || btn.disabled) return;
    if (btn.dataset.rejAct === "cancel") relCloseReject();
    else relSendReject();
  });

  document.getElementById("relStage").addEventListener("change", (e) => switchReleaseStage(e.target.value));

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
// TAB 05: NHẬT KÝ ĐÓNG GÓI (số Chỉ lệnh đóng gói theo ngày × lô × size của từng PO, theo dõi đủ đơn)
// ==========================================================
const packLogState = { customerId: null, orders: [], seq: 0 };

async function loadPackLog() {
  const body = document.getElementById("plBody");
  if (!body) return;
  const custId = appState.currentCustomer;
  const cust = appState.customers.find(c => c.id === custId);
  document.getElementById("plCust").textContent = cust ? cust.name : "chưa chọn khách";
  if (!custId) {
    body.innerHTML = '<div class="pl-empty">Chọn khách hàng ở ô KH phía trên.</div>';
    return;
  }
  if (packLogState.customerId !== custId) {
    document.getElementById("plWave").value = "";
    document.getElementById("plPo").value = "";
  }
  const seq = ++packLogState.seq;
  body.innerHTML = '<div class="pl-empty">Đang tải nhật ký…</div>';
  try {
    const res = await fetch(`/api/pack-log?customer_id=${encodeURIComponent(custId)}&t=${Date.now()}`);
    const data = await res.json();
    if (seq !== packLogState.seq) return;
    if (!data.success) throw new Error(data.error || "Không tải được");
    packLogState.customerId = custId;
    packLogState.orders = data.orders || [];
    renderPackLogFilters();
    renderPackLog();
  } catch (err) {
    if (seq !== packLogState.seq) return;
    body.innerHTML = `<div class="pl-empty">Không tải được nhật ký: ${escHtml(err.message)}</div>`;
  }
}

const plWaveKey = o => o.wave || "__none__";

function renderPackLogFilters() {
  const waveSel = document.getElementById("plWave");
  const poSel = document.getElementById("plPo");
  const orders = packLogState.orders;
  const waves = [...new Set(orders.map(o => o.wave).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi", { numeric: true }));
  const keepWave = waveSel.value;
  waveSel.innerHTML = '<option value="">Tất cả đợt</option>' + waves.map(w => `<option value="${escHtml(w)}">${escHtml(w)}</option>`).join("")
    + (orders.some(o => !o.wave) ? '<option value="__none__">Chưa ghi đợt</option>' : "");
  waveSel.value = [...waveSel.options].some(o => o.value === keepWave) ? keepWave : "";
  const keepPo = poSel.value;
  const list = orders.filter(o => !waveSel.value || plWaveKey(o) === waveSel.value);
  poSel.innerHTML = '<option value="">Tất cả PO</option>' + list.map(o => `<option value="${escHtml(o.id)}">${escHtml(o.po_number)} · ${escHtml(o.style_code)}</option>`).join("");
  poSel.value = list.some(o => o.id === keepPo) ? keepPo : "";
}

function plSizesOf(o, custSizes) {
  const set = new Set(Object.keys(o.order || {}));
  Object.values(o.days || {}).forEach(day => Object.values(day).forEach(m => Object.keys(m).forEach(x => set.add(x))));
  const rank = x => {
    const i = custSizes.findIndex(c => c.toLowerCase() === String(x).toLowerCase());
    return i < 0 ? 999 : i;
  };
  return [...set].sort((a, b) => rank(a) - rank(b) || String(a).localeCompare(String(b), "vi", { numeric: true }));
}

// Tổng đơn / đã đóng gói của 1 PO; packedCapped: mỗi size tính tối đa bằng số đơn (vượt không bù cho size thiếu)
function plTotals(o) {
  const order = o.order || {};
  const orderSizes = Object.keys(order);
  const cum = o.cum || {};
  const orderTotal = orderSizes.reduce((a, x) => a + order[x], 0);
  const packedCapped = orderSizes.reduce((a, x) => a + Math.min(cum[x] || 0, order[x]), 0);
  const packedAll = Object.values(cum).reduce((a, b) => a + b, 0);
  const pct = orderTotal ? Math.round(packedCapped * 100 / orderTotal) : 0;
  return { order, cum, orderTotal, packedCapped, packedAll, pct };
}

function plCardHtml(o, custSizes, from, to) {
  const sizes = plSizesOf(o, custSizes);
  const { order, cum, orderTotal, packedCapped, packedAll, pct } = plTotals(o);
  const dates = Object.keys(o.days || {}).filter(d => (!from || d >= from) && (!to || d <= to)).sort().reverse();
  const rows = dates.map(d => {
    const day = o.days[d];
    const lots = o.lots.filter(l => day[l]);
    return lots.map((l, i) => {
      const m = day[l];
      const sum = Object.values(m).reduce((a, b) => a + b, 0);
      return `<tr class="${i ? "pl-sub-row" : ""}"><td class="pl-date">${i ? "" : relFmtDate(d)}</td><td><span class="lot-badge">${escHtml(relLotLabel(l))}</span></td>${sizes.map(x => `<td class="${m[x] ? "pl-v" : "pl-zero"}">${m[x] ? relNum(m[x]) : "·"}</td>`).join("")}<td class="pl-v">${relNum(sum)}</td></tr>`;
    }).join("");
  }).join("");
  const remainCell = x => {
    if (!order[x]) return '<td class="pl-zero">·</td>';
    const r = order[x] - (cum[x] || 0);
    if (r === 0) return `<td><span class="pl-ok" title="Đủ ngày ${escHtml(relFmtDate(o.done[x] || ""))}">OK</span></td>`;
    return r > 0 ? `<td class="pl-remain">${relNum(r)}</td>` : `<td class="pl-remain">vượt ${relNum(-r)}</td>`;
  };
  const badge = o.done_date
    ? `<span class="pl-badge is-done">Đủ đơn ngày ${escHtml(relFmtDate(o.done_date))}</span>`
    : (orderTotal ? '<span class="pl-badge">Chưa đủ đơn</span>' : '<span class="pl-badge is-none">Chưa dán đơn theo size</span>');
  const stats = orderTotal
    ? `Đơn <b class="pl-v">${relNum(orderTotal)}</b> · Đã đóng gói <b class="pl-v">${relNum(packedAll)}</b> (${pct}%) · Còn thiếu <b class="${orderTotal - packedCapped ? "pl-remain" : "pl-ok-txt"}">${relNum(orderTotal - packedCapped)}</b>`
    : `Đã đóng gói <b class="pl-v">${relNum(packedAll)}</b>`;
  return `<div class="manage-card pl-po">
    <div class="pl-po-head">
      <span class="pl-po-num">${escHtml(o.po_number)}</span>
      <span class="pl-po-meta">ART <b class="mg-art">${escHtml(o.style_code)}</b>${o.crd ? ` · CRD <b>${escHtml(relFmtDate(o.crd))}</b>` : ""} · ${stats}</span>
      ${orderTotal ? `<span class="pl-prog"><i class="${o.done_date ? "is-done" : ""}" style="width:${pct}%"></i></span>` : ""}
      ${badge}
    </div>
    ${(o.lot_info || []).length ? `<div class="pl-lots">${o.lot_info.map(l => {
      const lt = Object.values(l.order).reduce((a, b) => a + b, 0);
      const got = Object.keys(l.order).reduce((a, x) => a + Math.min(l.cum[x] || 0, l.order[x]), 0);
      return `<span class="pl-lot${l.done_date ? " is-done" : ""}"><b>${escHtml(relLotLabel(l.name))}</b>${l.done_date ? `đủ ${escHtml(relFmtDate(l.done_date))}` : `${relNum(got)}/${relNum(lt)}`}</span>`;
    }).join("")}</div>` : ""}
    <div class="mg-table-wrap pl-table-wrap"><table class="mg-table pl-table" style="min-width:${230 + sizes.length * 54}px">
      <colgroup><col style="width:110px"><col style="width:76px">${sizes.map(() => "<col>").join("")}<col style="width:70px"></colgroup>
      <thead><tr><th>Ngày</th><th>Lô</th>${sizes.map(x => `<th class="mg-th-num">${escHtml(x)}</th>`).join("")}<th class="mg-th-num">Cộng</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="${sizes.length + 3}" class="pl-none">${Object.keys(o.days || {}).length ? "Không có số đóng gói trong khoảng ngày đang lọc" : "Chưa có số đóng gói"}</td></tr>`}</tbody>
      <tfoot>
        <tr><td colspan="2">Lũy kế</td>${sizes.map(x => `<td class="pl-v">${relNum(cum[x] || 0)}</td>`).join("")}<td class="pl-v">${relNum(packedAll)}</td></tr>
        ${orderTotal ? `<tr><td colspan="2">Đơn hàng</td>${sizes.map(x => `<td>${order[x] ? relNum(order[x]) : "·"}</td>`).join("")}<td>${relNum(orderTotal)}</td></tr>
        <tr><td colspan="2">Còn</td>${sizes.map(remainCell).join("")}<td>${o.done_date ? '<span class="pl-ok">OK</span>' : `<span class="pl-remain">${relNum(orderTotal - packedCapped)}</span>`}</td></tr>` : ""}
      </tfoot>
    </table></div>
  </div>`;
}

function renderPackLog() {
  const body = document.getElementById("plBody");
  if (!body) return;
  const wave = document.getElementById("plWave").value;
  const poId = document.getElementById("plPo").value;
  const from = document.getElementById("plFrom").value;
  const to = document.getElementById("plTo").value;
  const cust = appState.customers.find(c => c.id === packLogState.customerId);
  const custSizes = getCustomerSizes(cust);
  const picked = packLogState.orders.filter(o => (!wave || plWaveKey(o) === wave) && (!poId || o.id === poId));
  // PO chưa dán đơn theo size và chưa có số đóng gói thì không hiện cho gọn
  const shown = picked.filter(o => Object.keys(o.order || {}).length || Object.keys(o.days || {}).length);
  const doneCount = shown.filter(o => o.done_date).length;
  document.getElementById("plCount").textContent = shown.length
    ? `${shown.length} PO · ${doneCount} đủ đơn${picked.length > shown.length ? ` · ${picked.length - shown.length} PO chưa có đơn / số đóng gói (ẩn)` : ""}`
    : "";
  if (!shown.length) {
    body.innerHTML = `<div class="pl-empty">${picked.length ? "Các PO này chưa dán đơn theo size và chưa có số đóng gói." : "Không có PO nào."} Dán đơn hàng ở tab Khách hàng &amp; PO → Đơn hàng PO.</div>`;
    return;
  }
  const waveNames = [...new Set(shown.map(plWaveKey))].sort((a, b) => (a === "__none__") - (b === "__none__") || a.localeCompare(b, "vi", { numeric: true }));
  body.innerHTML = waveNames.map(w => {
    const list = shown.filter(o => plWaveKey(o) === w);
    return `<div class="pl-wave"><span>${escHtml(w === "__none__" ? "Chưa ghi đợt" : w)}</span>${list.length} PO · ${list.filter(o => o.done_date).length} đủ đơn</div>`
      + list.map(o => plCardHtml(o, custSizes, from, to)).join("");
  }).join("");
}

function bindPackLogEvents() {
  if (!document.getElementById("tab-pack-log")) return;
  document.getElementById("plWave").addEventListener("change", () => {
    renderPackLogFilters();
    renderPackLog();
  });
  ["plPo", "plFrom", "plTo"].forEach(id => document.getElementById(id).addEventListener("change", renderPackLog));
  document.getElementById("btnPlReload").addEventListener("click", loadPackLog);
}

// ==========================================================
// NHẬT KÝ ĐÓNG GÓI TRÊN ĐIỆN THOẠI (tổ trưởng): cùng số liệu tab 05, xếp dọc cho vừa màn hình
// ==========================================================
const PLM_DAYS = 7;   // số ngày hiện trước, còn lại bấm "Xem thêm"
const plmState = { orders: [], poId: "", allDays: false, seq: 0 };

async function openPackLogMobile() {
  const custId = appState.currentCustomer;
  if (!custId) {
    showToast("⚠️ Chưa chọn khách hàng. Chọn khách hàng ở phía trên trước.");
    return;
  }
  const modal = document.getElementById("modalPackLogM");
  const cust = appState.customers.find(c => c.id === custId);
  Object.assign(plmState, { orders: [], poId: appState.currentPO ? appState.currentPO.id : "", allDays: false });
  document.getElementById("plmDate").textContent = relFmtDate(getLocalDateString());
  document.getElementById("plmInfo").innerHTML = `${escHtml(cust ? cust.name : "")} · số lấy từ Chỉ lệnh đóng gói`;
  document.getElementById("plmPo").innerHTML = "";
  modal.style.display = "flex";
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");

  const body = document.getElementById("plmBody");
  const seq = ++plmState.seq;
  body.innerHTML = '<div class="rel-loading">Đang tải nhật ký…</div>';
  try {
    const res = await fetch(`/api/pack-log?customer_id=${encodeURIComponent(custId)}&t=${Date.now()}`);
    const data = await res.json();
    if (seq !== plmState.seq) return;
    if (!data.success) throw new Error(data.error || "Không tải được");
    plmState.orders = data.orders || [];
    renderPackLogMobile();
  } catch (err) {
    if (seq !== plmState.seq) return;
    body.innerHTML = `<div class="rel-empty">Không tải được nhật ký: ${escHtml(err.message)}</div>`;
  }
}

function closePackLogMobile() {
  const modal = document.getElementById("modalPackLogM");
  plmState.seq++;
  modal.classList.remove("show");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

function renderPackLogMobile() {
  const body = document.getElementById("plmBody");
  const cust = appState.customers.find(c => c.id === appState.currentCustomer);
  const custSizes = getCustomerSizes(cust);
  // Như tab 05: chỉ liệt kê PO đã dán đơn theo size hoặc đã có số đóng gói; PO đang chọn ở trên luôn có trong danh sách
  const list = plmState.orders.filter(o => o.id === plmState.poId || Object.keys(o.order || {}).length || Object.keys(o.days || {}).length);
  if (plmState.poId && !list.some(o => o.id === plmState.poId)) plmState.poId = "";
  const sel = document.getElementById("plmPo");
  sel.innerHTML = `<option value="">Tất cả PO (${list.length})</option>`
    + list.map(o => `<option value="${escHtml(o.id)}">${escHtml(o.po_number)} · ${escHtml(o.style_code)}${o.done_date ? " · đủ đơn" : ""}</option>`).join("");
  sel.value = plmState.poId;
  const shown = plmState.poId ? list.filter(o => o.id === plmState.poId) : list;
  body.innerHTML = shown.length
    ? shown.map(o => plmCardHtml(o, custSizes)).join("")
    : '<div class="rel-empty">Khách này chưa có PO nào dán đơn theo size hoặc có số đóng gói.</div>';
}

function plmCardHtml(o, custSizes) {
  const sizes = plSizesOf(o, custSizes);
  const { order, cum, orderTotal, packedCapped, packedAll, pct } = plTotals(o);
  const badge = o.done_date
    ? `<span class="pl-badge is-done">Đủ đơn ${escHtml(relFmtDate(o.done_date))}</span>`
    : (orderTotal ? '<span class="pl-badge">Chưa đủ đơn</span>' : '<span class="pl-badge is-none">Chưa dán đơn</span>');
  const stats = orderTotal
    ? `Đơn <b class="pl-v">${relNum(orderTotal)}</b> · Đã ĐG <b class="pl-v">${relNum(packedAll)}</b> (${pct}%) · Còn <b class="${orderTotal - packedCapped ? "pl-remain" : "pl-ok-txt"}">${relNum(orderTotal - packedCapped)}</b>`
    : `Đã đóng gói <b class="pl-v">${relNum(packedAll)}</b>`;
  const remain = x => {
    if (!order[x]) return '<span class="pl-zero">·</span>';
    const r = order[x] - (cum[x] || 0);
    if (r === 0) return '<span class="pl-ok">OK</span>';
    return `<span class="pl-remain">${r > 0 ? relNum(r) : `vượt ${relNum(-r)}`}</span>`;
  };
  const sizeRows = sizes.map(x => `<tr><td class="rel-size">${escHtml(x)}</td><td>${order[x] ? relNum(order[x]) : '<span class="pl-zero">·</span>'}</td><td class="pl-v">${relNum(cum[x] || 0)}</td><td>${remain(x)}</td></tr>`).join("");
  const lots = (o.lot_info || []).map(l => {
    const lt = Object.values(l.order).reduce((a, b) => a + b, 0);
    const got = Object.keys(l.order).reduce((a, x) => a + Math.min(l.cum[x] || 0, l.order[x]), 0);
    return `<span class="pl-lot${l.done_date ? " is-done" : ""}"><b>${escHtml(relLotLabel(l.name))}</b>${l.done_date ? `đủ ${escHtml(relFmtDate(l.done_date))}` : `${relNum(got)}/${relNum(lt)}`}</span>`;
  }).join("");

  const dates = Object.keys(o.days || {}).sort().reverse();
  const showDates = plmState.allDays ? dates : dates.slice(0, PLM_DAYS);
  const days = showDates.map(d => {
    const day = o.days[d];
    const lotNames = o.lots.filter(l => day[l]);
    const total = lotNames.reduce((a, l) => a + Object.values(day[l]).reduce((s, q) => s + q, 0), 0);
    return `<div class="plm-day">
      <div class="plm-day-head"><span class="plm-date">${escHtml(relFmtDate(d))}</span><span>Cộng <b class="pl-v">${relNum(total)}</b> đôi</span></div>
      ${lotNames.map(l => `<div class="plm-lot"><span class="lot-badge">${escHtml(relLotLabel(l))}</span><span class="plm-chips">${sizes.filter(x => day[l][x]).map(x => `<span class="plm-chip"><small>${escHtml(x)}</small><b>${relNum(day[l][x])}</b></span>`).join("")}</span></div>`).join("")}
    </div>`;
  }).join("");
  const more = dates.length > showDates.length
    ? `<button type="button" class="plm-more" data-plm-more>Xem thêm ${dates.length - showDates.length} ngày trước</button>`
    : "";

  return `<div class="plm-card">
    <div class="plm-head">
      <span class="pl-po-num">${escHtml(o.po_number)}</span>
      <span class="plm-art">ART <b class="mg-art">${escHtml(o.style_code)}</b></span>
      ${badge}
    </div>
    <div class="plm-stats">${stats}</div>
    ${orderTotal ? `<span class="pl-prog plm-prog"><i class="${o.done_date ? "is-done" : ""}" style="width:${pct}%"></i></span>` : ""}
    ${lots ? `<div class="pl-lots plm-lots">${lots}</div>` : ""}
    ${sizes.length ? `<table class="rel-table plm-table">
      <thead><tr><th>Size</th><th>Đơn</th><th>Đã ĐG</th><th>Còn</th></tr></thead>
      <tbody>${sizeRows}</tbody>
      <tfoot><tr><td class="rel-foot-lbl">Tổng</td><td>${orderTotal ? relNum(orderTotal) : "·"}</td><td class="pl-v">${relNum(packedAll)}</td><td>${!orderTotal ? "·" : (o.done_date ? '<span class="pl-ok">OK</span>' : `<span class="pl-remain">${relNum(orderTotal - packedCapped)}</span>`)}</td></tr></tfoot>
    </table>` : ""}
    <div class="plm-sec">Đóng gói theo ngày <small>mới nhất trên cùng</small></div>
    ${days || '<div class="plm-none">Chưa có số đóng gói.</div>'}
    ${more}
  </div>`;
}

function bindPackLogMobileEvents() {
  const modal = document.getElementById("modalPackLogM");
  if (!modal) return;
  document.getElementById("btnPackLogMobile").addEventListener("click", openPackLogMobile);
  document.getElementById("btnPlmBack").addEventListener("click", closePackLogMobile);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closePackLogMobile();
    else if (e.target.closest("[data-plm-more]")) {
      plmState.allDays = true;
      renderPackLogMobile();
    }
  });
  document.getElementById("plmPo").addEventListener("change", (e) => {
    plmState.poId = e.target.value;
    renderPackLogMobile();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) closePackLogMobile();
  });
}

// ==========================================================
// DATALOG (Sếp, Quản lý, điện thoại): mọi PO của 1 khách × công đoạn thả chuyền + Thành phẩm (số đóng gói).
// Ô = luỹ kế cả PO (mọi lô) tới hết ngày đang chọn; số nhỏ "+" = số nhập riêng ngày đó.
// ==========================================================
const dlgState = { custId: "", date: "", data: null, seq: 0 };

const dlgShiftDate = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return getLocalDateString(d);
};

function openDatalog() {
  const modal = document.getElementById("modalDatalog");
  const customers = appState.customers || [];
  const sel = document.getElementById("dlgCust");
  sel.innerHTML = customers.map(c => `<option value="${escHtml(c.id)}">${escHtml(c.name)}</option>`).join("");
  dlgState.custId = customers.some(c => c.id === appState.currentCustomer) ? appState.currentCustomer : ((customers[0] || {}).id || "");
  sel.value = dlgState.custId;
  dlgState.date = appState.currentDate || getLocalDateString();
  modal.style.display = "flex";
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  loadDatalog();
}

function closeDatalog() {
  const modal = document.getElementById("modalDatalog");
  dlgState.seq++;
  modal.classList.remove("show");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

async function loadDatalog() {
  const body = document.getElementById("dlgBody");
  const seq = ++dlgState.seq;
  dlgState.data = null;
  document.getElementById("dlgCount").textContent = "";
  renderDatalogHead();
  if (!dlgState.custId) {
    body.innerHTML = '<div class="rel-empty">Chưa có khách hàng.</div>';
    return;
  }
  body.innerHTML = '<div class="rel-loading">Đang tải số liệu…</div>';
  try {
    const res = await fetch(`/api/datalog?customer_id=${encodeURIComponent(dlgState.custId)}&t=${Date.now()}`);
    const data = await res.json();
    if (seq !== dlgState.seq) return;
    if (!data.success) throw new Error(data.error || "Không tải được");
    dlgState.data = data;
    renderDatalog();
  } catch (err) {
    if (seq !== dlgState.seq) return;
    body.innerHTML = `<div class="rel-empty">Không tải được Datalog: ${escHtml(err.message)}</div>`;
  }
}

function renderDatalogHead() {
  const dd = relFmtDate(dlgState.date);
  const short = escHtml(dd.slice(0, 5));
  document.getElementById("dlgDate").textContent = dd;
  document.getElementById("btnDlgNext").disabled = dlgState.date >= getLocalDateString();
  document.getElementById("dlgKey").innerHTML = `<span><b class="kv">Số lớn</b> luỹ kế tới hết ${short}</span>`
    + `<span><b class="kd">+ số nhỏ</b> nhập riêng ngày ${short}</span><span><i class="sw"></i>đủ Tổng SL</span>`;
}

function renderDatalog() {
  renderDatalogHead();
  const data = dlgState.data;
  if (!data) return;
  const body = document.getElementById("dlgBody");
  const date = dlgState.date;
  // Khách chưa có công đoạn: số thả chuyền nằm ở khóa "" -> 1 cột "Thả chuyền"
  const stages = (data.stages || []).length ? data.stages : [{ id: "", name: "Thả chuyền" }];
  const cols = [...stages, { id: "#tp", name: "Thành phẩm" }];
  const orders = data.orders || [];
  const planSum = orders.reduce((a, o) => a + (Number(o.plan) || 0), 0);
  document.getElementById("dlgCount").innerHTML = `<b>${orders.length}</b> PO · Tổng SL <b>${relNum(planSum)}</b> đôi · <b>${stages.length}</b> công đoạn + Thành phẩm`;
  if (!orders.length) {
    body.innerHTML = '<div class="rel-empty">Khách này chưa có PO.</div>';
    return;
  }

  const cell = (v, d, plan, tp) => {
    const pct = plan ? Math.min(100, Math.round(v / plan * 100)) : 0;
    const cls = !v ? " zero" : (plan && v >= plan ? " full" : "");
    return `<td class="c${cls}${tp ? " tp" : ""}"><span class="v">${v ? relNum(v) : "·"}</span>`
      + `<span class="d">${d ? `+${relNum(d)}` : ""}</span><span class="bar"><i style="width:${pct}%"></i></span></td>`;
  };
  const tot = {};
  const totDay = {};
  const rows = orders.map(o => {
    const cum = {};
    const day = {};
    for (const [d, m] of Object.entries(o.days || {})) {
      if (d > date) continue;
      for (const [k, q] of Object.entries(m)) {
        cum[k] = (cum[k] || 0) + q;
        if (d === date) day[k] = (day[k] || 0) + q;
      }
    }
    cols.forEach(c => {
      tot[c.id] = (tot[c.id] || 0) + (cum[c.id] || 0);
      totDay[c.id] = (totDay[c.id] || 0) + (day[c.id] || 0);
    });
    return `<tr><th class="pc" scope="row"><b>${escHtml(o.po_number)}</b><small>${escHtml(o.style_code || "")}</small></th>`
      + `<td class="sl"><span class="v">${relNum(o.plan)}</span></td>`
      + cols.map(c => cell(cum[c.id] || 0, day[c.id] || 0, Number(o.plan) || 0, c.id === "#tp")).join("") + "</tr>";
  }).join("");

  body.innerHTML = `<table class="dlg-tbl">
    <thead><tr><th class="pc">PO</th><th class="sl"><span class="no">đôi</span>Tổng SL</th>${cols.map((c, i) => `<th class="${c.id === "#tp" ? "tp" : ""}"><span class="no">${c.id === "#tp" ? "TP" : i + 1}</span>${escHtml(c.name)}</th>`).join("")}</tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td class="pc"><b>Cộng</b><small>${orders.length} PO</small></td><td class="sl"><span class="v">${relNum(planSum)}</span></td>${cols.map(c => cell(tot[c.id], totDay[c.id], planSum, c.id === "#tp")).join("")}</tr></tfoot>
  </table>
  <div class="dlg-hint">← vuốt ngang để xem hết công đoạn →</div>`;
}

function bindDatalogEvents() {
  const modal = document.getElementById("modalDatalog");
  if (!modal) return;
  document.getElementById("btnDatalogMobile").addEventListener("click", openDatalog);
  document.getElementById("btnDlgBack").addEventListener("click", closeDatalog);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeDatalog();
  });
  document.getElementById("dlgCust").addEventListener("change", (e) => {
    dlgState.custId = e.target.value;
    loadDatalog();
  });
  document.getElementById("btnDlgPrev").addEventListener("click", () => {
    dlgState.date = dlgShiftDate(dlgState.date, -1);
    renderDatalog();
  });
  document.getElementById("btnDlgNext").addEventListener("click", () => {
    dlgState.date = dlgShiftDate(dlgState.date, 1);
    renderDatalog();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) closeDatalog();
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
