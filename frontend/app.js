// HELPER: Lấy ngày hiện tại theo giờ địa phương (YYYY-MM-DD)
function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then(reg => {
          console.log('✅ Service Worker registered successfully:', reg.scope);
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 Đã cập nhật phiên bản ứng dụng mới ngầm.');
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
  appState.currentDate = todayStr;
  if (appState.report) {
    appState.report.report_date = todayStr;
  }
  if (dateEl) {
    dateEl.value = todayStr;
  }
  const mobInput = document.getElementById("reportDateMobile");
  if (mobInput) {
    mobInput.value = todayStr;
  }
  const mobDisp = document.getElementById("mobileDateDisplay");
  if (mobDisp && todayStr) {
    const parts = todayStr.split("-");
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
  }, 2200);
}

// BIND DOM EVENTS
function bindEvents() {
  // Role & Auth Modal Events
  const btnSwitchRole = document.getElementById("btnSwitchRole");
  if (btnSwitchRole) btnSwitchRole.addEventListener("click", openRoleModal);

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

  const btnCancelUser = document.getElementById("btnCancelEditUser");
  if (btnCancelUser) btnCancelUser.addEventListener("click", resetUserForm);

  const inputUserPhone = document.getElementById("userPhone");
  if (inputUserPhone) inputUserPhone.addEventListener("input", handleUserFormPhoneInput);
  const inputUserEmail = document.getElementById("userEmail");
  if (inputUserEmail) inputUserEmail.addEventListener("input", handleUserFormPhoneInput);

  // Header Selects & Filters
  const selCust = document.getElementById("selectCustomer");
  if (selCust) {
    selCust.addEventListener("change", async (e) => {
      appState.currentCustomer = e.target.value;
      await filterOrdersByCustomer();
    });
  }

  const selPO = document.getElementById("selectPO");
  if (selPO) {
    selPO.addEventListener("change", async (e) => {
      const poId = e.target.value;
      appState.currentPO = appState.orders.find(o => o.id === poId);
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
  if (btnRef) btnRef.addEventListener("click", loadReport);

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
}

// MASTER SYNC: REFRESH ALL TABS DATA FOR CURRENT PO & DATE
async function refreshAllTabsData() {
  if (!appState.currentPO) {
    appState.report = { po_id: "", report_date: appState.currentDate, status: "DRAFT", batches: [] };
    renderReportUI();
    appState.deptLogs = {};
    renderDeptLogsUI();
    return;
  }

  appState.editingBatches = {};

  // Concurrently load data for active tabs (Tab 1 & Tab 2)
  await Promise.all([
    loadReport(),
    loadDeptLogs()
  ]);
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
    const res = await fetch("/api/metadata");
    const data = await res.json();
    if (data.success) {
      appState.customers = data.customers;
      appState.orders = data.orders;
      populateCustomerSelect();
      renderManageTab();
    }
  } catch (err) {
    console.error("Lỗi khi tải metadata:", err);
  }
}

function populateCustomerSelect() {
  const custSel = document.getElementById("selectCustomer");
  custSel.innerHTML = appState.customers.map(c => `<option value="${c.id}">${c.name} (${c.code})</option>`).join("");
  
  if (appState.customers.length > 0) {
    if (!appState.currentCustomer || !appState.customers.some(c => c.id === appState.currentCustomer)) {
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
    if (!appState.currentPO || !filtered.some(o => o.id === appState.currentPO.id)) {
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

  try {
    const res = await fetch(`/api/report?po_id=${poId}&date=${date}`);
    const data = await res.json();
    if (data.success) {
      appState.report = data.report || { po_id: poId, report_date: date, status: "DRAFT", batches: [] };
      appState.cumExportsByBatch = data.cumExportsByBatch || {};
      appState.cumImportsByBatch = data.cumImportsByBatch || {};
      appState.prevDayWipByBatch = data.prevDayWipByBatch || {};

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
    console.error("Lỗi tải báo cáo:", err);
  }
}

// RENDER EXCEL REPORT UI (TAB 1)
function renderReportUI() {
  const poPlan = appState.currentPO ? appState.currentPO.po_plan : 0;
  const poNum = appState.currentPO ? appState.currentPO.po_number : "--";

  const batches = appState.report.batches || [];

  // Update Top Summary Table Meta
  document.getElementById("summaryDateVal").innerText = formatDateDisplay(appState.currentDate);
  document.getElementById("summaryPoNum").innerText = poNum;
  document.getElementById("summaryPoPlan").innerText = poPlan.toLocaleString("vi-VN");

  // Status Tag
  const statusTag = document.getElementById("reportStatusTag");
  statusTag.innerText = appState.report.status === "SUBMITTED" ? "TRẠNG THÁI: ĐÃ CHỐT SỔ" : "TRẠNG THÁI: BẢN NHÁP";
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
      <div style="text-align:center; padding: 40px; color:#64748b; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">
        <p style="font-size:16px; font-weight:700;">Chưa có Lô hàng nào cho Đơn hàng này.</p>
        <p style="font-size:13px; margin-top:6px;">Hãy nhấp vào nút <strong>"➕ Thêm Lô Mới"</strong> ở trên hoặc chuyển sang tab <strong>"Quản Lý Khách Hàng & Đơn Hàng Lô"</strong> để tạo hoặc sửa đơn hàng.</p>
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
           UNIFIED BATCH CARD (CHỈNH SỬA ĐỒNG NHẤT NHƯ HÌNH 1 TRÊN LAPTOP, ANDROID, IOS)
           ======================================================== -->
      <div class="h1-batch-card" id="batchCard_${idx}">
        
        <!-- 1. TOP HEADER: DATE BADGE (LEFT) & BATCH BADGE (RIGHT) -->
        <div class="h1-batch-header">
          <div class="h1-date-badge">
            <span class="cal-icon">📅</span>
            <span class="date-txt" id="batchDateTxt_${idx}">${formatDateDisplay(appState.currentDate)}</span>
          </div>
          <div class="h1-batch-badge">
            <div class="b-name">${batch.batch_name}</div>
            <div class="b-plan">KH: ${(batch.batch_plan || 0).toLocaleString("vi-VN")}</div>
          </div>
        </div>

        <!-- 2. SECTION 1: NHẬP - XUẤT TRONG NGÀY -->
        <div class="h1-section-block">
          <div class="h1-sec-title">
            <span class="h1-num-bullet">❶</span> NHẬP - XUẤT TRONG NGÀY
          </div>
          <div class="h1-table-card">
            <table class="h1-table-nx h1-table-nx-transposed">
              <colgroup>
                <col style="width: 31%;">
                <col style="width: 23%;">
                <col style="width: 23%;">
                <col style="width: 23%;">
              </colgroup>
              <thead>
                <tr>
                  <th class="col-target text-left" style="padding-left: 8px;">Chỉ tiêu</th>
                  <th class="col-ton-dau text-center">Tồn đầu ngày</th>
                  <th class="col-nhap text-center text-blue">Nhập</th>
                  <th class="col-xuat text-center text-green">Xuất</th>
                </tr>
              </thead>
              <tbody>
                <!-- ROW 1: LUỸ KẾ HÔM TRƯỚC -->
                <tr class="row-luy-ke-truoc">
                  <td class="cell-label">
                    <span class="main-lbl">Luỹ kế hôm trước</span>
                  </td>
                  <td class="cell-dash text-center">--</td>
                  <td class="cell-prev-val text-center font-bold text-sky-700" id="calcPrevIn_${idx}">${prevIn.toLocaleString("vi-VN")}</td>
                  <td class="cell-prev-val text-center font-bold text-emerald-700" id="calcPrevOut_${idx}">${prevOut.toLocaleString("vi-VN")}</td>
                </tr>
                <!-- ROW 2: PHÁT SINH HÔM NAY -->
                <tr class="row-phat-sinh-hn">
                  <td class="cell-label">
                    <span class="main-lbl">Phát sinh hôm nay</span>
                  </td>
                  <td class="cell-dash text-center">--</td>
                  <td class="cell-calc-group text-center">
                    <input type="number" class="wip-num-input field-daily-in field-into-sewing grid-nav-input inp-blue input-yellow" data-batch="${idx}" data-row="0" data-col="2" value="${batch.into_sewing || ''}" placeholder="0" data-idx="${idx}" title="Phát sinh nhập hôm nay">
                  </td>
                  <td class="cell-calc-group text-center">
                    <input type="number" class="wip-num-input wip-num-input-out field-daily-out grid-nav-input inp-green input-yellow" data-batch="${idx}" data-row="0" data-col="3" value="${batch.daily_out || ''}" placeholder="0" data-idx="${idx}" title="Phát sinh xuất hôm nay">
                  </td>
                </tr>
                <!-- ROW 3: TỔNG -->
                <tr class="row-tong">
                  <td class="cell-label">
                    <span class="main-lbl">Tổng</span>
                  </td>
                  <td class="cell-val-bold text-center">0</td>
                  <td class="cell-total-val text-center text-blue">
                    <span class="val-num font-black text-sky-800" id="calcIntoSewing_${idx}">${cumIn.toLocaleString("vi-VN")}</span>
                  </td>
                  <td class="cell-total-val text-center text-green">
                    <span class="val-num font-black text-emerald-800" id="calcDelivered_${idx}">${cumOut.toLocaleString("vi-VN")}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. CONNECTING ARROW: NHẬP TL - XUẤT TL -->
        <div class="h1-arrow-connector-1">
          <svg class="h1-orange-arrow" viewBox="0 0 24 28" fill="#d97706">
            <path d="M7 0 H17 V14 H24 L12 28 L0 14 H7 Z" />
          </svg>
          <span class="h1-arrow-label">Nhập TL – Xuất TL</span>
        </div>

        <!-- 4. SECTION 2: ĐỐI CHIẾU - KIỂM KÊ - PHÂN TÍCH -->
        <div class="h1-section-block">
          <div class="h1-sec-title">
            <span class="h1-num-bullet">❷</span> ĐỐI CHIẾU - KIỂM KÊ - PHÂN TÍCH
          </div>

          <!-- 3 EQUATION METRIC CARDS -->
          <div class="h1-equation-row">
            <!-- Card 1: TỒN LÝ THUYẾT -->
            <div class="h1-eq-card card-yellow">
              <div class="eq-hdr">TỒN LÝ THUYẾT</div>
              <div class="eq-sub">Nhập – Xuất</div>
              <div class="eq-val font-amber font-black" id="calcTheoWip_${idx}">${tonLyThuyet.toLocaleString("vi-VN")}</div>
            </div>

            <div class="h1-eq-op">−</div>

            <!-- Card 2: TỒN THỰC TẾ -->
            <div class="h1-eq-card card-cyan">
              <div class="eq-hdr">TỒN THỰC TẾ</div>
              <div class="eq-sub">Kiểm kê 5 trạm</div>
              <div class="eq-val font-cyan font-black" id="calcActualWip_${idx}">${actualWip.toLocaleString("vi-VN")}</div>
            </div>

            <div class="h1-eq-op">=</div>

            <!-- Card 3: THIẾU / LỆCH -->
            <div class="h1-eq-card card-rose">
              <div class="eq-hdr">THIẾU / LỆCH</div>
              <div class="eq-sub">LT – TT</div>
              <div class="eq-val font-rose font-black" id="calcShortage_${idx}">
                ${shortage === 0 ? '<span class="status-ok">0 (OK)</span>' : (shortage > 0 ? ('<span class="status-shortage">-' + Math.abs(shortage).toLocaleString("vi-VN") + '</span>') : ('<span class="status-surplus">+' + Math.abs(shortage).toLocaleString("vi-VN") + '</span>'))}
              </div>
            </div>
          </div>
        </div>

        <!-- 5. DUAL ARROW ROW -->
        <div class="h1-dual-arrows-row">
          <div class="dual-arrow-col left-col">
            <div class="arrow-text-wrap text-blue-wrap">
              <span>Tổng</span>
              <span>5 trạm</span>
            </div>
            <svg class="h1-arrow-svg h1-arrow-blue" viewBox="0 0 24 32">
              <path d="M7 0 H17 V18 H24 L12 32 L0 18 H7 Z" />
            </svg>
          </div>
          <div class="dual-arrow-col right-col">
            <svg class="h1-arrow-svg h1-arrow-red" viewBox="0 0 24 32">
              <path d="M7 0 H17 V18 H24 L12 32 L0 18 H7 Z" />
            </svg>
            <div class="arrow-text-wrap text-red-wrap">
              <span>Phân tích</span>
              <span>nguyên nhân</span>
            </div>
          </div>
        </div>

        <!-- 6. TWO-COLUMN SPLIT BOXES -->
        <div class="h1-split-grid">
          <!-- LEFT BOX: KIỂM KÊ TỒN THỰC TẾ (5 TRẠM) -->
          <div class="h1-box h1-box-left">
            <div class="h1-box-hdr bg-teal">
              <div class="box-hdr-text">
                <div class="box-title">KIỂM KÊ TỒN THỰC TẾ</div>
                <div class="box-sub">${batch.batch_name} - SL tại từng trạm</div>
              </div>
              <button type="button" class="h1-btn-toggle ${isEditing ? 'is-editing' : 'is-locked'} btn-toggle-batch btn-batch-toggle btn-header-toggle" data-batch="${idx}" title="${isEditing ? 'Nhấn để lưu số liệu và khóa bảng kiểm kê' : 'Nhấn để mở khóa chỉnh sửa số liệu kiểm kê'}">
                ${isEditing ? '💾 Lưu' : '✏️ Sửa'}
              </button>
            </div>
            <div class="h1-station-list">
              <!-- 1. Đang sản xuất -->
              <div class="h1-station-row is-editing">
                <div class="st-tag-name">
                  <span class="st-badge badge-yellow">1</span>
                  <span class="st-text">Đang sản xuất</span>
                </div>
                <div class="st-val-wrap">
                  <input type="number" class="wip-num-input field-wip-sewing grid-nav-input input-yellow" data-batch="${idx}" data-row="1" data-col="0" value="${batch.wip_sewing || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
              <!-- 2. Tồn kiểm QC -->
              <div class="h1-station-row is-editing">
                <div class="st-tag-name">
                  <span class="st-badge badge-gray">2</span>
                  <span class="st-text">Tồn kiểm QC</span>
                </div>
                <div class="st-val-wrap">
                  <input type="number" class="wip-num-input field-wip-qc grid-nav-input input-yellow" data-batch="${idx}" data-row="1" data-col="1" value="${batch.wip_qc || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
              <!-- 3. Tồn phối đôi -->
              <div class="h1-station-row is-editing">
                <div class="st-tag-name">
                  <span class="st-badge badge-orange">3</span>
                  <span class="st-text">Tồn phối đôi</span>
                </div>
                <div class="st-val-wrap">
                  <input type="number" class="wip-num-input field-wip-pairing grid-nav-input input-yellow" data-batch="${idx}" data-row="1" data-col="2" value="${batch.wip_pairing || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
              <!-- 4. Tồn đóng gói -->
              <div class="h1-station-row is-editing">
                <div class="st-tag-name">
                  <span class="st-badge badge-slate">4</span>
                  <span class="st-text">Tồn đóng gói</span>
                </div>
                <div class="st-val-wrap">
                  <input type="number" class="wip-num-input field-wip-packing grid-nav-input input-yellow" data-batch="${idx}" data-row="1" data-col="3" value="${batch.wip_packing || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
              <!-- 5. Tồn kho TP -->
              <div class="h1-station-row is-editing">
                <div class="st-tag-name">
                  <span class="st-badge badge-green">5</span>
                  <span class="st-text">Tồn kho TP</span>
                </div>
                <div class="st-val-wrap">
                  <input type="number" class="wip-num-input field-wip-warehouse grid-nav-input input-yellow" data-batch="${idx}" data-row="1" data-col="4" value="${batch.wip_warehouse || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
            </div>
            <!-- Footer: Tổng tồn thực tế -->
            <div class="h1-box-footer footer-teal">
              <span class="ft-lbl">Σ Tồn thực tế</span>
              <span class="ft-val text-cyan font-black" id="calcWipSum_${idx}">${actualWip.toLocaleString("vi-VN")}</span>
            </div>
          </div>

          <!-- RIGHT BOX: NGUYÊN NHÂN THIẾU / LỆCH -->
          <div class="h1-box h1-box-right">
            <div class="h1-box-hdr bg-burgundy">
              <div class="box-title">NGUYÊN NHÂN</div>
              <div class="box-sub">Thiếu / lệch (SL)</div>
            </div>
            <div class="h1-reason-list">
              <!-- 1. Mất xác -->
              <div class="h1-reason-row is-editing">
                <div class="rs-label-wrap">
                  <span class="rs-title text-rose">1. Mất xác</span>
                  <span class="rs-sub">LK: --</span>
                </div>
                <div class="rs-input-wrap">
                  <input type="number" class="wip-num-input field-shortage-matxac grid-nav-input inp-rose input-yellow" data-batch="${idx}" data-row="0" data-col="5" value="${batch.shortage_mat_xac || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
              <!-- 2. Hàng phế -->
              <div class="h1-reason-row is-editing">
                <div class="rs-label-wrap">
                  <span class="rs-title text-amber">2. Hàng phế</span>
                  <span class="rs-sub">LK: --</span>
                </div>
                <div class="rs-input-wrap">
                  <input type="number" class="wip-num-input field-shortage-hangphe grid-nav-input inp-amber input-yellow" data-batch="${idx}" data-row="0" data-col="6" value="${batch.shortage_hang_phe || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
              <!-- 3. Khác -->
              <div class="h1-reason-row is-editing">
                <div class="rs-label-wrap">
                  <span class="rs-title text-purple">3. Khác</span>
                  <span class="rs-sub">LK: --</span>
                </div>
                <div class="rs-input-wrap">
                  <input type="number" class="wip-num-input field-shortage-khac grid-nav-input inp-purple input-yellow" data-batch="${idx}" data-row="0" data-col="7" value="${batch.shortage_khac || ''}" placeholder="0" data-idx="${idx}">
                </div>
              </div>
              <!-- Ghi chú lý do khác -->
              <div class="h1-reason-note-row">
                <input type="text" class="th-khac-note-input field-shortage-note grid-nav-input" data-batch="${idx}" data-row="0" data-col="8" value="${batch.shortage_note || ''}" placeholder="✍️ Ghi chú lý do..." data-idx="${idx}">
              </div>
            </div>
            <!-- Footer: Đã giải thích -->
            <div class="h1-box-footer footer-burgundy">
              <span class="ft-lbl">Σ Đã giải thích</span>
              <span class="ft-val text-rose font-black" id="calcExplainSum_${idx}">${totalExplained.toLocaleString("vi-VN")}</span>
            </div>
          </div>
        </div>

        <!-- 7. STATUS BANNER -->
        <div class="h1-status-banner-wrap" id="calcStatusBanner_${idx}">
          ${shortage === 0 
            ? '<div class="h1-status-banner banner-ok">✔ Không có lệch – không cần phân tích</div>' 
            : (shortage > 0 
                ? ('<div class="h1-status-banner banner-shortage">⚠️ Thiếu -' + Math.abs(shortage).toLocaleString("vi-VN") + ' đôi – vui lòng phân tích nguyên nhân bên trên</div>') 
                : ('<div class="h1-status-banner banner-surplus">ℹ️ Thừa +' + Math.abs(shortage).toLocaleString("vi-VN") + ' đôi – kiểm tra lại số đếm thực tế</div>'))}
        </div>

        <!-- 8. BOTTOM ACTION BAR: EXECUTOR INPUT -->
        <div class="h1-bottom-bar">
          <div class="h1-executor-wrap" style="width: 100%;">
            <input type="text" ${isEditing ? '' : 'readonly'} class="wip-executor-input field-note-sewing grid-nav-input" data-batch="${idx}" data-row="2" data-col="0" value="${batch.note_sewing || ''}" placeholder="${isEditing ? '✍️ Điền tên người kiểm kê...' : '👤 Người kiểm kê: ' + (batch.note_sewing || 'Chưa ghi')}" data-idx="${idx}">
          </div>
        </div>

        ${idx === batches.length - 1 ? `
        <!-- 9. SECTION 3: KIỂM TRA CÂN ĐỐI (QC & PHỐI ĐÔI) - PHƯƠNG ÁN 2 (DƯỚI CUỐI LÔ CUỐI CÙNG) -->
        <div class="h1-balance-check-card" id="balanceCheckCard_${idx}">
          <div class="h1-balance-header">
            <span class="h1-balance-title">
              <span class="h1-num-bullet">❸</span> KIỂM TRA CÂN ĐỐI (QC & PHỐI ĐÔI)
            </span>
            <span class="h1-balance-badge badge-balanced" id="calcBalanceBadge_${idx}">
              ✅ Cân đối (0 đôi)
            </span>
          </div>
          <div class="h1-balance-body">
            <!-- DÒNG 1: LUÂN CHUYỂN -->
            <div class="h1-balance-row balance-flow-row">
              <div class="balance-calc-group">
                <span class="lbl-ton-qua">Tồn qua: <strong id="calcTonQua_${idx}">0</strong></span>
                <span class="op-sym font-bold text-slate-400">+</span>
                <span class="lbl-tp font-bold text-amber-900">✨ TP: 
                  <input type="number" class="wip-num-input field-daily-finished input-yellow" data-batch="${idx}" value="${batch.daily_finished || ''}" placeholder="0" data-idx="${idx}" title="Thành phẩm hôm nay (nhập mới)">
                </span>
                <span class="op-sym font-bold text-slate-400">-</span>
                <span class="lbl-xuat">Xuất: <strong class="text-rose font-bold" id="calcBalanceXuat_${idx}">${todayOut.toLocaleString("vi-VN")}</strong></span>
              </div>
              <div class="balance-eq-val">
                = <span class="val-bold" id="calcBalanceVe1_${idx}">0</span>
              </div>
            </div>
            <!-- DÒNG 2: THỰC TẾ -->
            <div class="h1-balance-row balance-actual-row">
              <div class="balance-calc-group">
                <span>Đếm thực tế:</span>
                <span>Phối đôi <strong class="text-amber font-bold" id="calcBalancePair_${idx}">${(Number(batch.wip_pairing) || 0).toLocaleString("vi-VN")}</strong></span>
                <span class="op-sym font-bold text-slate-400">+</span>
                <span>QC <strong class="text-blue font-bold" id="calcBalanceQc_${idx}">${(Number(batch.wip_qc) || 0).toLocaleString("vi-VN")}</strong></span>
              </div>
              <div class="balance-eq-val">
                = <span class="val-bold" id="calcBalanceVe2_${idx}">0</span>
              </div>
            </div>
          </div>
        </div>
        ` : ''}

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
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mIdx = parseInt(parts[1], 10) - 1;
    return `${parts[2]}-${months[mIdx] || parts[1]}`;
  }
  return dateStr;
}

// IN-PLACE RECALCULATION
function recalculateAllInPlace() {
  const poPlan = appState.currentPO ? appState.currentPO.po_plan : 0;
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

    const elShortage = document.getElementById(`calcShortage_${idx}`);
    if (elShortage) {
      elShortage.innerHTML = shortage === 0 
        ? '<span class="status-ok font-black text-emerald-600">0 (OK)</span>' 
        : (shortage > 0 
            ? '<span class="status-shortage font-black text-rose-600">-' + Math.abs(shortage).toLocaleString("vi-VN") + '</span>' 
            : '<span class="status-surplus font-black text-amber-600">+' + Math.abs(shortage).toLocaleString("vi-VN") + '</span>');
    }

    const elBanner = document.getElementById(`calcStatusBanner_${idx}`);
    if (elBanner) {
      elBanner.innerHTML = shortage === 0 
        ? '<div class="h1-status-banner banner-ok">✔ Không có lệch – không cần phân tích</div>' 
        : (shortage > 0 
            ? ('<div class="h1-status-banner banner-shortage">⚠️ Thiếu -' + Math.abs(shortage).toLocaleString("vi-VN") + ' đôi – vui lòng phân tích nguyên nhân bên trên</div>') 
            : ('<div class="h1-status-banner banner-surplus">ℹ️ Thừa +' + Math.abs(shortage).toLocaleString("vi-VN") + ' đôi – kiểm tra lại số đếm thực tế</div>'));
    }

    // Section 3: Balance Check (Phương án 2)
    const elTonQua = document.getElementById(`calcTonQua_${idx}`);
    if (elTonQua) {
      const prevBatch = appState.prevDayWipByBatch && appState.prevDayWipByBatch[b.batch_name];
      const prevQc = prevBatch ? (Number(prevBatch.wip_qc) || 0) : 0;
      const prevPair = prevBatch ? (Number(prevBatch.wip_pairing) || 0) : 0;
      const tonQua = prevQc + prevPair;
      const dailyFinished = Number(b.daily_finished) || 0;
      const ve1 = (tonQua + dailyFinished) - todayOut;
      const ve2 = (Number(b.wip_pairing) || 0) + (Number(b.wip_qc) || 0);
      const diff = ve1 - ve2;

      elTonQua.innerText = tonQua.toLocaleString("vi-VN");
      const elBalXuat = document.getElementById(`calcBalanceXuat_${idx}`);
      if (elBalXuat) elBalXuat.innerText = todayOut.toLocaleString("vi-VN");
      const elBalPair = document.getElementById(`calcBalancePair_${idx}`);
      if (elBalPair) elBalPair.innerText = (Number(b.wip_pairing) || 0).toLocaleString("vi-VN");
      const elBalQc = document.getElementById(`calcBalanceQc_${idx}`);
      if (elBalQc) elBalQc.innerText = (Number(b.wip_qc) || 0).toLocaleString("vi-VN");
      const elVe1 = document.getElementById(`calcBalanceVe1_${idx}`);
      if (elVe1) elVe1.innerText = ve1.toLocaleString("vi-VN");
      const elVe2 = document.getElementById(`calcBalanceVe2_${idx}`);
      if (elVe2) elVe2.innerText = ve2.toLocaleString("vi-VN");

      const badge = document.getElementById(`calcBalanceBadge_${idx}`);
      if (badge) {
        if (diff === 0) {
          badge.className = "h1-balance-badge badge-balanced";
          badge.innerText = "✅ Cân đối (0 đôi)";
        } else {
          badge.className = "h1-balance-badge badge-unbalanced";
          badge.innerText = `⚠️ Lệch ${diff > 0 ? '+' : ''}${diff.toLocaleString("vi-VN")} đôi`;
        }
      }
    }
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
        b.daily_finished = Number(e.target.value) || 0;
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
    });

    input.addEventListener("dblclick", (e) => {
      if (e.target.readOnly) return;
      if (e.target.type === "number") {
        showNumpad(e.target);
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
        const b = appState.report.batches[batchIdx];
        showToast(`💾 Đã lưu số liệu ${b ? b.batch_name : ''} ngày ${formatDateDisplay(appState.currentDate)}!`);
      });

      // Move to next input cell
      advanceToNextInput(active);
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
}

// 1. RENDER MASTER CUSTOMER TABLE
function renderCustomerTable() {
  const tbodyCust = document.getElementById("tbodyCustomers");
  const hdrCount = document.getElementById("statCustHeaderCount");
  if (hdrCount) hdrCount.innerText = `${appState.customers.length} Công Ty`;

  if (!tbodyCust) return;

  if (appState.customers.length === 0) {
    tbodyCust.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:20px; color:#94a3b8;">Chưa có khách hàng nào. Hãy thêm khách hàng mới ở biểu mẫu phía trên.</td></tr>`;
    return;
  }

  tbodyCust.innerHTML = appState.customers.map(c => {
    const isSelected = (c.id === appState.currentCustomer);
    const custPOCount = appState.orders.filter(o => o.customer_id === c.id).length;

    return `
      <tr class="customer-row-item ${isSelected ? 'selected-cust-row' : ''}" data-id="${c.id}" title="Nhấp chuột để xem danh sách PO của ${c.name}">
        <td><strong style="color: #0369a1; font-weight: 800;">${c.code}</strong></td>
        <td><strong>${c.name}</strong></td>
        <td><span class="badge-po-count">${custPOCount} PO</span></td>
        <td style="text-align:center; white-space: nowrap;">
          <button type="button" class="btn-action-icon btn-action-edit btn-edit-cust" data-id="${c.id}" data-name="${c.name}" data-code="${c.code}" title="Sửa thông tin khách hàng">✏️ Sửa</button>
          <button type="button" class="btn-action-icon btn-action-danger btn-delete-cust" data-id="${c.id}" data-name="${c.name}" data-code="${c.code}" title="Xóa khách hàng">🗑️ Xóa</button>
        </td>
      </tr>
    `;
  }).join("");

  // Bind click event on customer rows to switch PO list on the right
  tbodyCust.querySelectorAll(".customer-row-item").forEach(row => {
    row.addEventListener("click", (e) => {
      // Do nothing if user clicked action buttons (handled separately)
      if (e.target.closest(".btn-action-icon")) return;

      const custId = row.dataset.id;
      selectCustomerInManageTab(custId);
    });
  });

  // Bind Edit Customer Button
  tbodyCust.querySelectorAll(".btn-edit-cust").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const code = btn.dataset.code;

      const elId = document.getElementById("editCustId");
      if (elId) elId.value = id;
      const elName = document.getElementById("custName");
      if (elName) elName.value = name;
      const elCode = document.getElementById("custCode");
      if (elCode) elCode.value = code;

      const btnSubmit = document.getElementById("btnSubmitCust");
      if (btnSubmit) btnSubmit.innerText = "💾 Cập Nhật Khách Hàng";

      const btnCancel = document.getElementById("btnCancelEditCust");
      if (btnCancel) btnCancel.style.display = "inline-flex";

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

      if (confirm(`⚠️ Bạn có chắc chắn muốn xóa khách hàng "${name}" (${code}) cùng tất cả đơn hàng PO liên quan?`)) {
        try {
          const res = await fetch(`/api/customers?id=${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            showToast(`🗑️ Đã xóa khách hàng "${name}" thành công!`);
            fetchMetadata();
          } else {
            alert("Lỗi khi xóa: " + (data.error || "Không thể xóa"));
          }
        } catch (err) {
          alert("Lỗi khi xóa khách hàng: " + err.message);
        }
      }
    });
  });
}

// 2. SELECT CUSTOMER IN TAB 4 (SYNC SELECTION, HIGHLIGHT & ORDERS TABLE)
function selectCustomerInManageTab(custId) {
  appState.currentCustomer = custId;

  // Highlight selected row in customer table
  document.querySelectorAll("#tbodyCustomers .customer-row-item").forEach(r => {
    if (r.dataset.id === custId) {
      r.classList.add("selected-cust-row");
    } else {
      r.classList.remove("selected-cust-row");
    }
  });

  // Sync PO Form Customer select
  const poCustSel = document.getElementById("poCustomerSelect");
  if (poCustSel) poCustSel.value = custId;

  // Sync Top Filter Select & PO selector
  const topCustSel = document.getElementById("selectCustomer");
  if (topCustSel) {
    topCustSel.value = custId;
    filterOrdersByCustomer();
  }

  // Render detail POs for this customer
  renderOrdersTable(custId);
}

// 3. RENDER DETAIL ORDERS TABLE FOR SELECTED CUSTOMER
function renderOrdersTable(customerId) {
  const tbodyOrders = document.getElementById("tbodyOrders");
  const lblCustTitle = document.getElementById("lblSelectedCustTitle");
  const badgePoCount = document.getElementById("badgeSelectedCustPoCount");

  const cust = appState.customers.find(c => c.id === customerId);
  const custNameDisplay = cust ? `${cust.name} (${cust.code})` : "Tất Cả";
  
  if (lblCustTitle) lblCustTitle.innerText = custNameDisplay;

  const filteredOrders = customerId 
    ? appState.orders.filter(o => o.customer_id === customerId)
    : appState.orders;

  if (badgePoCount) badgePoCount.innerText = `${filteredOrders.length} PO`;

  if (!tbodyOrders) return;

  if (filteredOrders.length === 0) {
    tbodyOrders.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 25px; color: #64748b; font-style: italic;">
          🏢 Khách hàng <strong>${cust ? cust.name : ''}</strong> chưa có đơn hàng / PO nào.<br>
          <span style="font-size:12px; color:#94a3b8;">Bạn hãy thêm đơn hàng / PO mới ở biểu mẫu phía trên!</span>
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
        <td><strong style="color: #0369a1; font-size: 13.5px;">${o.po_number}</strong></td>
        <td><strong>${o.style_code}</strong></td>
        <td>${o.line_name}</td>
        <td><strong style="color: #16a34a;">${(Number(o.po_plan) || 0).toLocaleString('vi-VN')} đôi</strong></td>
        <td style="text-align:left;">${batchTags || '<em style="color:#94a3b8;">Chưa cấu hình Lô</em>'}</td>
        <td style="text-align:center; white-space: nowrap;">
          <button type="button" class="btn-action-icon btn-action-edit btn-edit-po" data-id="${o.id}" title="Sửa đơn hàng & cấu hình Lô">✏️ Sửa</button>
          <button type="button" class="btn-action-icon btn-action-danger btn-delete-po" data-id="${o.id}" data-ponum="${o.po_number}" title="Xóa đơn hàng PO">🗑️ Xóa</button>
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
      if (btnSubmitPO) btnSubmitPO.innerText = "💾 Cập Nhật PO & Cấu Hình Lô";

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

      if (confirm(`⚠️ Bạn có chắc chắn muốn xóa đơn hàng / PO "${poNum}" khỏi hệ thống?`)) {
        try {
          const res = await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            showToast(`🗑️ Đã xóa PO "${poNum}" thành công!`);
            fetchMetadata();
          } else {
            alert("Lỗi khi xóa PO: " + (data.error || "Không thể xóa"));
          }
        } catch (err) {
          alert("Lỗi khi xóa PO: " + err.message);
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
    renderBatchInputBoxes(count, [
      { batch_name: "Lô 1", into_sewing: 1230 },
      { batch_name: "Lô 2", into_sewing: 267 },
      { batch_name: "Số đuôi", into_sewing: 126 }
    ]);
  }
}

// RENDER DYNAMIC BATCH INPUT BOXES (Lô 1..N + Số đuôi)
function renderBatchInputBoxes(count, initialBatches = null) {
  const container = document.getElementById("dynamicBatchInputsContainer") || document.getElementById("batchInputGrid");
  if (!container) return;

  // Preserve existing typed values if no initialBatches provided
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
    if (initialBatches && Array.isArray(initialBatches)) {
      const found = initialBatches.find(b => b.batch_name === bName);
      if (found) val = found.into_sewing || found.batch_plan || "";
    } else if (existingValues[bName] !== undefined) {
      val = existingValues[bName];
    } else if (i === 1 && !initialBatches) {
      val = 1230;
    } else if (i === 2 && !initialBatches) {
      val = 267;
    }

    const card = document.createElement("div");
    card.className = "batch-card-item";
    card.dataset.batchName = bName;
    card.innerHTML = `
      <span class="batch-card-badge">📦 ${bName}</span>
      <div class="batch-card-input-wrapper">
        <label>Nhập Cố Định (đôi):</label>
        <input type="number" class="batch-card-input" placeholder="0" value="${val}" min="0">
      </div>
    `;
    container.appendChild(card);
  }

  // 2. Khung Số Đuôi (luôn có theo cấu trúc Lô 1..N + Số đuôi)
  const tailName = "Số đuôi";
  let tailVal = "";
  if (initialBatches && Array.isArray(initialBatches)) {
    const found = initialBatches.find(b => b.batch_name.toLowerCase().includes("đuôi") || b.batch_name === `Lô ${count + 1}`);
    if (found) tailVal = found.into_sewing || found.batch_plan || "";
  } else if (existingValues[tailName] !== undefined) {
    tailVal = existingValues[tailName];
  } else if (!initialBatches) {
    tailVal = 126;
  }

  const tailCard = document.createElement("div");
  tailCard.className = "batch-card-item is-tail";
  tailCard.dataset.batchName = tailName;
  tailCard.innerHTML = `
    <span class="batch-card-badge">🏷️ ${tailName}</span>
    <div class="batch-card-input-wrapper">
      <label>Nhập Cố Định (đôi):</label>
      <input type="number" class="batch-card-input" placeholder="0" value="${tailVal}" min="0">
    </div>
  `;
  container.appendChild(tailCard);

  // Bind input events to recalculate sum
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
  const poPlan = Number(poPlanInput ? poPlanInput.value : 0) || 0;

  // Update label elements
  const elSum = document.getElementById("lblCurrentSumBatches") || document.getElementById("batchSumDisplay");
  if (elSum) elSum.innerText = totalBatchQty.toLocaleString("vi-VN");

  const elPlan = document.getElementById("lblTargetPoPlan") || document.getElementById("batchPlanDisplay");
  if (elPlan) elPlan.innerText = poPlan.toLocaleString("vi-VN");

  const elStatus = document.getElementById("lblBatchSumStatus") || document.getElementById("batchDiffDisplay");
  if (elStatus) {
    const diff = totalBatchQty - poPlan;
    if (poPlan > 0 && diff === 0) {
      elStatus.className = "badge-checker-ok";
      elStatus.innerText = "✅ Khớp kế hoạch";
    } else if (poPlan > 0 && diff > 0) {
      elStatus.className = "badge-checker-warn";
      elStatus.innerText = `⚠️ Thừa ${diff.toLocaleString("vi-VN")} đôi`;
    } else if (poPlan > 0 && diff < 0) {
      elStatus.className = "badge-checker-warn";
      elStatus.innerText = `⚠️ Thiếu ${Math.abs(diff).toLocaleString("vi-VN")} đôi`;
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
  if (btnSub) btnSub.innerText = "➕ Thêm Khách Hàng";
  const btnCan = document.getElementById("btnCancelEditCust");
  if (btnCan) btnCan.style.display = "none";
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

  renderBatchInputBoxes(2, [
    { batch_name: "Lô 1", into_sewing: 1230 },
    { batch_name: "Lô 2", into_sewing: 267 },
    { batch_name: "Số đuôi", into_sewing: 126 }
  ]);

  const btnSub = document.getElementById("btnSubmitPO");
  if (btnSub) btnSub.innerText = "💾 Lưu Đơn Hàng & Cấu Hình Lô";
  const btnCan = document.getElementById("btnCancelEditPO");
  if (btnCan) btnCan.style.display = "none";
}

async function handleAddCustomer(e) {
  e.preventDefault();
  const id = document.getElementById("editCustId")?.value;
  const name = document.getElementById("custName")?.value.trim();
  const code = document.getElementById("custCode")?.value.trim();
  if (!name || !code) return;

  try {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id || undefined, name, code })
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? "✅ Đã cập nhật khách hàng thành công!" : "✅ Đã thêm khách hàng mới thành công!");
      resetCustomerForm();
      fetchMetadata();
    }
  } catch (err) {
    alert("Lỗi khi lưu khách hàng: " + err.message);
  }
}

async function handleAddPO(e) {
  e.preventDefault();
  const id = document.getElementById("editOrderId")?.value;
  const customer_id = document.getElementById("poCustomerSelect")?.value;
  const po_number = document.getElementById("poNumber")?.value.trim();
  const style_code = document.getElementById("poStyleCode")?.value.trim();
  const line_name = document.getElementById("poLineName")?.value.trim();
  const po_plan = Number(document.getElementById("poPlanTotal")?.value) || 0;

  if (!customer_id) {
    alert("Vui lòng chọn khách hàng!");
    return;
  }
  if (!po_number) {
    alert("Vui lòng nhập số PO!");
    return;
  }

  // Collect batches from dynamic grid
  const container = document.getElementById("dynamicBatchInputsContainer") || document.getElementById("batchInputGrid");
  const batchCards = container ? container.querySelectorAll(".batch-card-item") : [];
  const batches = [];
  batchCards.forEach((card, i) => {
    const bName = card.dataset.batchName;
    const input = card.querySelector(".batch-card-input");
    const qty = Number(input ? input.value : 0) || 0;
    if (qty > 0 || !card.classList.contains("is-tail") || batches.length === 0) {
      batches.push({
        id: "b-" + (i + 1),
        batch_name: bName,
        batch_plan: qty,
        into_sewing: 0
      });
    }
  });

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: id || undefined, customer_id, po_number, style_code, line_name, po_plan, default_batches: batches })
    });
    const data = await res.json();
    if (data.success) {
      showToast(id ? "✅ Đã cập nhật PO & Lô thành công!" : "✅ Đã thêm PO mới thành công!");
      resetPOForm();
      await fetchMetadata();

      // Ensure the saved or updated PO is active and reload report
      const savedPO = id ? appState.orders.find(o => o.id === id) : appState.orders.find(o => o.po_number === po_number);
      if (savedPO) {
        appState.currentPO = savedPO;
        const selPO = document.getElementById("selectPO");
        if (selPO) selPO.value = savedPO.id;
        loadReport();
        loadDeptLogs();
      }
    }
  } catch (err) {
    alert("Lỗi khi lưu PO: " + err.message);
  }
}

// SAVE REPORT
async function saveReport(status, silent = false) {
  if (!appState.currentPO) return;
  recalculateAllInPlace();
  appState.report.po_id = appState.currentPO.id;
  appState.report.report_date = appState.currentDate;
  appState.report.status = status || "DRAFT";
  try {
    const res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appState.report)
    });
    const data = await res.json();
    if (data.success) {
      appState.hasUnsavedChanges = false;
      if (!silent) {
        showToast(`✅ Đã lưu báo cáo (${status === 'SUBMITTED' ? 'Đã chốt sổ' : 'Bản nháp'})!`);
      }
    }
  } catch (err) {
    if (!silent) alert("Lỗi khi lưu báo cáo: " + err.message);
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
              🔷 ${bName.toUpperCase()} <span class="plan-tag">Kế hoạch: ${batchPlan.toLocaleString('vi-VN')} đôi</span>
            </th>
          </tr>
          <!-- HÀNG TIÊU ĐỀ 10 CỘT -->
          <tr>
            <th rowspan="2" class="th-dept-col th-ngay">Ngày</th>
            <th class="th-dept-col th-dept-tondau">TỒN ĐẦU NGÀY</th>
            <th class="th-dept-col th-dept-nhap">NHẬP</th>
            <th class="th-dept-col th-dept-xuat">XUẤT</th>
            <th class="th-dept-col th-dept-toncuoi">TỒN CUỐI NGÀY</th>
            <th rowspan="2" class="th-dept-col">Nhập phối đôi</th>
            <th rowspan="2" class="th-dept-col">Giao Đóng gói</th>
            <th rowspan="2" class="th-dept-col">Nhập kho TP</th>
            <th rowspan="2" class="th-dept-col">Xuất kho TP</th>
            <th rowspan="2" class="th-dept-col" style="width: 95px;">Trạng Thái</th>
          </tr>
          <!-- HÀNG SUBHEADERS GIẢI THÍCH -->
          <tr>
            <th class="sub-dept-header">Luôn bằng 0</th>
            <th class="sub-dept-header">Vào chuyền may</th>
            <th class="sub-dept-header">Đã giao KH</th>
            <th class="sub-dept-header sub-dept-toncuoi">Lấy số Tồn đầu ngày + Nhập - Xuất</th>
          </tr>
        </thead>
        <tbody id="deptTbody_${bIdx}">
          ${rowsHtml}
        </tbody>
        <tfoot class="dept-table-tfoot">
          <tr class="tr-dept-total">
            <td class="td-dept-sum-label"><strong>TỔNG CỘNG</strong></td>
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
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px;">
        <button type="button" class="btn-add-dept-row" data-batch-idx="${bIdx}" data-batch-name="${bName}">➕ Thêm dòng ngày (${bName})</button>
        <div class="dept-executor-note">Điền tên người Thực Hiện ở bảng chi tiết</div>
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

  const roleLabel = role === 'admin' ? '👑 Sếp Tổng (Toàn quyền 4 Tab)' : (role === 'manager' ? '⭐ Quản Lý (Xem toàn bộ tiến độ)' : '👤 Công Nhân (2 Tab kiểm kê)');
  showToast(`🎉 Đăng nhập thành công: ${user.full_name || user.email || user.phone}\nQuyền: ${roleLabel}`);

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

    showToast("👋 Đã đăng xuất khỏi hệ thống!");
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
        btnTogglePass.innerText = "🙈 Ẩn mật khẩu";
      } else {
        passInput.type = "password";
        btnTogglePass.innerText = "👁️ Hiện mật khẩu";
      }
    });
  }

  // 3. Direct Login Submit (Số điện thoại / Email + Mật Khẩu)
  async function submitDirectLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    const userOrPhone = document.getElementById("portalTxtLoginUser")?.value.trim();
    const password = document.getElementById("portalTxtLoginPass")?.value.trim();

    if (!userOrPhone || !password) {
      alert("❌ Vui lòng nhập đầy đủ Số điện thoại/Email và Mật khẩu.");
      return;
    }

    const btnSub = document.getElementById("btnPortalSubmitLogin");
    if (btnSub) {
      btnSub.disabled = true;
      btnSub.innerText = "⏳ Đang xác thực tài khoản...";
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
        alert("❌ " + (data.error || "Số điện thoại / Email hoặc Mật khẩu không chính xác!"));
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ: " + err.message);
    } finally {
      if (btnSub) {
        btnSub.disabled = false;
        btnSub.innerText = "🚀 Đăng Nhập Vào Hệ Thống";
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

  const badge = document.getElementById("currentRoleBadge");
  const tabManageBtn = document.getElementById("tabBtnManage");
  const tabHistoryBtn = document.getElementById("tabBtnHistory");
  const tabUsersBtn = document.getElementById("tabBtnUsers");

  let rawName = user ? (user.full_name || user.email || user.phone) : (role === "admin" ? "Sếp Tổng" : (role === "manager" ? "Quản lý" : "Công nhân"));
  const cleanName = String(rawName).replace(/\s*\(Admin\)/gi, '').replace(/\s*\(Quản lý\)/gi, '').replace(/\s*\(Công nhân\)/gi, '').trim();

  // Update Avatar Popover Menu (Mockup Màn 2)
  const popName = document.getElementById("popoverUserName");
  const popRole = document.getElementById("popoverUserRole");
  if (popName) {
    popName.innerText = cleanName || (role === "admin" ? "Sếp Tổng" : (role === "manager" ? "Quản Lý" : "Công Nhân Kiểm Kê"));
  }
  if (popRole) {
    popRole.innerText = role === "admin" ? "Vai trò: Sếp Tổng (Admin)" : (role === "manager" ? "Vai trò: Quản lý" : "Vai trò: Công nhân");
  }

  if (role === "admin") {
    if (badge) {
      badge.className = "role-badge is-admin";
      badge.innerHTML = `👑 ${cleanName} (Admin)`;
    }
    // Sếp Admin có quyền xem HẾT các tab (Tab 1, Tab 2, Tab 3, Tab 4)
    if (tabManageBtn) {
      tabManageBtn.classList.remove("hidden");
      tabManageBtn.style.setProperty("display", "inline-flex", "important");
    }
    if (tabHistoryBtn) {
      tabHistoryBtn.classList.remove("hidden");
      tabHistoryBtn.style.setProperty("display", "inline-flex", "important");
    }
    if (tabUsersBtn) {
      tabUsersBtn.classList.remove("hidden");
      tabUsersBtn.style.setProperty("display", "inline-flex", "important");
    }
  } else if (role === "manager") {
    if (badge) {
      badge.className = "role-badge is-manager";
      badge.innerHTML = `⭐ ${cleanName} (Quản lý)`;
    }
    if (tabManageBtn) {
      tabManageBtn.classList.remove("hidden");
      tabManageBtn.style.setProperty("display", "inline-flex", "important");
    }
    if (tabHistoryBtn) {
      tabHistoryBtn.classList.remove("hidden");
      tabHistoryBtn.style.setProperty("display", "inline-flex", "important");
    }
    if (tabUsersBtn) {
      tabUsersBtn.classList.add("hidden");
      tabUsersBtn.style.setProperty("display", "none", "important");
    }
    
    // If manager is on tab-users, switch to tab-manage
    const activeTab = document.querySelector(".tab-btn.active");
    if (activeTab && activeTab.dataset.tab === "tab-users") {
      if (tabManageBtn) tabManageBtn.click();
    }
  } else {
    // Công nhân CHỈ XEM Tab 1 và Tab 2
    if (badge) {
      badge.className = "role-badge is-worker";
      badge.innerHTML = `👤 ${cleanName} (Công nhân)`;
    }
    if (tabManageBtn) {
      tabManageBtn.classList.add("hidden");
      tabManageBtn.style.setProperty("display", "none", "important");
    }
    if (tabHistoryBtn) {
      tabHistoryBtn.classList.add("hidden");
      tabHistoryBtn.style.setProperty("display", "none", "important");
    }
    if (tabUsersBtn) {
      tabUsersBtn.classList.add("hidden");
      tabUsersBtn.style.setProperty("display", "none", "important");
    }

    // Nếu công nhân đang đứng ở Tab 3, 4 hoặc Lịch sử thì tự động chuyển về Tab 1
    const activeTab = document.querySelector(".tab-btn.active");
    if (activeTab && (activeTab.dataset.tab === "tab-manage" || activeTab.dataset.tab === "tab-history" || activeTab.dataset.tab === "tab-users")) {
      const wipTab = document.querySelector('.tab-btn[data-tab="tab-wip"]');
      if (wipTab) wipTab.click();
    }
  }
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
    alert("❌ Vui lòng nhập đúng định dạng số điện thoại (ví dụ: 0818189868 hoặc 0901234567).");
    return;
  }

  const intlPhone = formatPhoneToIntl(rawPhone);
  const btnSend = document.getElementById("btnSendPhoneOTP");
  if (btnSend) {
    btnSend.disabled = true;
    btnSend.innerText = "⏳ Đang gửi SMS...";
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
    showToast(`📩 Đã gửi tin nhắn SMS chứa mã OTP về số ${rawPhone}! Vui lòng kiểm tra tin nhắn SMS.`);
  } catch (err) {
    console.error("Firebase SMS error:", err);
    if (modalRecaptchaVerifier) {
      try {
        modalRecaptchaVerifier.render().then(widgetId => {
          if (window.grecaptcha) grecaptcha.reset(widgetId);
        });
      } catch(e) {}
    }
    alert("❌ Lỗi gửi tin nhắn SMS: " + err.message);
  } finally {
    if (btnSend) {
      btnSend.disabled = false;
      btnSend.innerText = "📩 Gửi Mã OTP";
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
    alert("❌ Vui lòng nhập đầy đủ Số điện thoại/Email và Mật khẩu.");
    return;
  }

  const btnConfirm = document.getElementById("btnConfirmAuth");
  if (btnConfirm) {
    btnConfirm.disabled = true;
    btnConfirm.innerText = "⏳ Đang xác thực...";
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
      alert("❌ " + (data.error || "Số điện thoại / Email hoặc Mật khẩu không chính xác!"));
    }
  } catch (err) {
    alert("Lỗi đăng nhập: " + err.message);
  } finally {
    if (btnConfirm) {
      btnConfirm.disabled = false;
      btnConfirm.innerText = "🚀 Xác Nhận Đăng Nhập";
    }
  }
}

// ========================================================
// ADMIN: USER & PERMISSION MANAGEMENT (TAB 4)
// ========================================================
async function fetchUsers() {
  try {
    const res = await fetch("/api/admin/users");
    const data = await res.json();
    if (data.success) {
      appState.usersList = data.users || [];
      renderUsersTable();
    }
  } catch (err) {
    console.error("Error fetching users:", err);
  }
}

function renderUsersTable() {
  const tbody = document.getElementById("tbodyUsers");
  const statTotal = document.getElementById("statTotalUsers");
  if (statTotal) statTotal.innerText = `${appState.usersList.length} người`;

  if (!tbody) return;
  if (appState.usersList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: #94a3b8;">Chưa có tài khoản nào. Hãy thêm tài khoản mới ở trên.</td></tr>`;
    return;
  }

  tbody.innerHTML = appState.usersList.map(u => {
    let roleBadge = `<span class="user-role-badge is-worker">👤 Công Nhân</span>`;
    if (u.role === "admin") {
      roleBadge = `<span class="user-role-badge is-admin">👑 Admin (Sếp Tổng)</span>`;
    } else if (u.role === "manager") {
      roleBadge = `<span class="user-role-badge is-manager">⭐ Manager (Quản Lý)</span>`;
    }

    return `
      <tr>
        <td><strong style="color:#0369a1;">${u.email || '--'}</strong></td>
        <td><strong>${u.phone || '--'}</strong></td>
        <td>${u.full_name || 'Chưa đặt tên'}</td>
        <td>${roleBadge}</td>
        <td><span style="font-family:monospace; font-weight:700; background:#f8fafc; padding:2px 6px; border-radius:4px;">${u.password || 'Admin@123456'}</span></td>
        <td><span style="font-family:monospace; font-weight:700; background:#f1f5f9; padding:2px 6px; border-radius:4px;">${u.pin_code || '1234'}</span></td>
        <td><span style="color: ${u.is_active ? '#16a34a' : '#dc2626'}; font-weight:700;">${u.is_active ? '● Hoạt động' : '● Đã khóa'}</span></td>
        <td>
          <button class="btn btn-warning btn-edit-user" data-id="${u.id}">Sửa</button>
          <button class="btn btn-danger btn-delete-user" data-id="${u.id}" ${u.role === 'admin' ? 'disabled title="Không thể xóa tài khoản Admin chính"' : ''}>Xóa</button>
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
      document.getElementById("btnSubmitUser").innerText = "💾 Cập Nhật Quyền";
      document.getElementById("btnCancelEditUser").style.display = "inline-block";

      const hintEl = document.getElementById("userFormHint");
      if (hintEl) {
        hintEl.style.display = "block";
        hintEl.innerHTML = `✏️ Đang chỉnh sửa tài khoản: <strong>${user.full_name}</strong> (${user.phone || user.email || id}).`;
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
          const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            showToast("🗑️ Đã xóa người dùng thành công!");
            fetchUsers();
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

  if (!cleanPhone && !emailVal) {
    if (hintEl) hintEl.style.display = "none";
    if (btnSubmit) btnSubmit.innerText = "💾 Lưu Tài Khoản & Phân Quyền";
    return;
  }

  const existing = Array.isArray(appState.usersList) ? appState.usersList.find(u => 
    (cleanPhone && normalizePhone(u.phone) === cleanPhone) ||
    (emailVal && u.email && u.email.toLowerCase() === emailVal)
  ) : null;

  if (existing) {
    const roleText = existing.role === 'admin' ? 'Admin (Sếp Tổng)' : existing.role === 'manager' ? 'Manager (Quản Lý)' : 'Worker (Công Nhân)';
    if (hintEl) {
      hintEl.style.display = "block";
      hintEl.innerHTML = `ℹ️ Số điện thoại/Email này đã có tài khoản: <strong>${existing.full_name}</strong> (Vai trò hiện tại: <em>${roleText}</em>). Khi bạn bấm Lưu, hệ thống sẽ tự động cập nhật phân quyền và thông tin cho tài khoản này.`;
    }
    if (btnSubmit) {
      btnSubmit.innerText = `💾 Cập Nhật Quyền (${existing.full_name})`;
    }
  } else {
    if (hintEl) hintEl.style.display = "none";
    if (btnSubmit) btnSubmit.innerText = "💾 Lưu Tài Khoản & Phân Quyền";
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
  const elSubmit = document.getElementById("btnSubmitUser");
  if (elSubmit) elSubmit.innerText = "💾 Lưu Tài Khoản & Phân Quyền";
  const elCancel = document.getElementById("btnCancelEditUser");
  if (elCancel) elCancel.style.display = "none";
  const hintEl = document.getElementById("userFormHint");
  if (hintEl) {
    hintEl.style.display = "none";
    hintEl.innerHTML = "";
  }
}

async function handleAddUser(e) {
  e.preventDefault();
  let id = document.getElementById("editUserId")?.value || "";
  const email = document.getElementById("userEmail")?.value.trim() || "";
  const phone = document.getElementById("userPhone")?.value.trim() || "";
  const fullName = document.getElementById("userFullName")?.value.trim() || "";
  const role = document.getElementById("userRoleSelect")?.value || "worker";
  const password = document.getElementById("userPassword")?.value.trim() || "Admin@123456";
  const pinCode = document.getElementById("userPinCode")?.value.trim() || "1234";

  if (!email && !phone) {
    alert("Vui lòng nhập Email hoặc Số điện thoại.");
    return;
  }
  if (!fullName) {
    alert("Vui lòng điền họ và tên.");
    return;
  }

  // Tự động gán ID nếu người dùng tự nhập SĐT hoặc Email đã tồn tại trong danh sách
  const cleanPhone = normalizePhone(phone);
  const cleanEmail = email.toLowerCase();
  if (!id && Array.isArray(appState.usersList)) {
    const existing = appState.usersList.find(u => 
      (cleanPhone && normalizePhone(u.phone) === cleanPhone) ||
      (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
    );
    if (existing) {
      id = existing.id;
    }
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
      showToast("✅ Đã lưu tài khoản người dùng và phân quyền thành công!");
      resetUserForm();
      fetchUsers();
    } else {
      alert("Lỗi: " + (data.error || "Không thể lưu người dùng"));
    }
  } catch (err) {
    alert("Lỗi: " + err.message);
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

