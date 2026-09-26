// STATE MANAGEMENT
let appState = {
  currentUserRole: null, // Set dynamically upon login
  currentUser: null,     // Set dynamically upon login
  customers: [],
  orders: [],
  usersList: [],
  currentCustomer: null,
  currentPO: null,
  currentDate: "2026-09-23",
  report: {
    po_id: "po-050",
    report_date: "2026-09-23",
    status: "DRAFT",
    batches: []
  },
  cumExportsByBatch: {},
  editingBatches: {},
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

// INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  initDate();
  initFirebaseAuth();
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
  const todayStr = new Date().toISOString().split("T")[0];
  dateEl.value = appState.currentDate || todayStr;
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

  // Sub-tabs in Tab 1
  const subDaily = document.getElementById("subtabBtnDaily");
  const subHistory = document.getElementById("subtabBtnHistory");
  if (subDaily && subHistory) {
    subDaily.addEventListener("click", () => {
      subDaily.classList.add("active");
      subHistory.classList.remove("active");
      document.getElementById("subtab-daily").classList.add("active");
      document.getElementById("subtab-history").classList.remove("active");
    });
    subHistory.addEventListener("click", () => {
      subHistory.classList.add("active");
      subDaily.classList.remove("active");
      document.getElementById("subtab-history").classList.add("active");
      document.getElementById("subtab-daily").classList.remove("active");
      fetchReportHistory();
    });
  }

  const histBatchFilter = document.getElementById("historyBatchFilter");
  if (histBatchFilter) {
    histBatchFilter.addEventListener("change", renderHistoryTable);
  }

  const btnRefreshHist = document.getElementById("btnRefreshHistory");
  if (btnRefreshHist) {
    btnRefreshHist.addEventListener("click", fetchReportHistory);
  }

  const btnExportHist = document.getElementById("btnExportHistoryExcel");
  if (btnExportHist) {
    btnExportHist.addEventListener("click", exportHistoryToExcel);
  }

  // Header Selects & Filters
  const selCust = document.getElementById("selectCustomer");
  if (selCust) {
    selCust.addEventListener("change", (e) => {
      appState.currentCustomer = e.target.value;
      filterOrdersByCustomer();
    });
  }

  const selPO = document.getElementById("selectPO");
  if (selPO) {
    selPO.addEventListener("change", async (e) => {
      const poId = e.target.value;
      appState.currentPO = appState.orders.find(o => o.id === poId);
      appState.editingBatches = {};
      await loadReport();
      await loadDeptLogs();
      if (document.getElementById("subtab-history") && document.getElementById("subtab-history").classList.contains("active")) {
        fetchReportHistory();
      }
    });
  }

  // Date Change & Navigation
  const repDate = document.getElementById("reportDate");
  if (repDate) {
    repDate.addEventListener("change", async (e) => {
      appState.currentDate = e.target.value;
      appState.editingBatches = {};
      await loadReport();
      await loadDeptLogs();
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
        loadDeptLogs();
      } else if (btn.dataset.tab === "tab-history") {
        fetchReportHistory();
      }
    });
  });

  const btnAddB = document.getElementById("btnAddBatch");
  if (btnAddB) btnAddB.addEventListener("click", handleAddBatch);

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
}

async function changeDateByDays(days) {
  const d = new Date(appState.currentDate);
  d.setDate(d.getDate() + days);
  const newDateStr = d.toISOString().split("T")[0];
  appState.currentDate = newDateStr;
  document.getElementById("reportDate").value = newDateStr;
  appState.editingBatches = {};
  await loadReport();
  await loadDeptLogs();
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

function filterOrdersByCustomer() {
  const poSel = document.getElementById("selectPO");
  const filtered = appState.orders.filter(o => o.customer_id === appState.currentCustomer);
  
  if (filtered.length > 0) {
    poSel.innerHTML = filtered.map(o => `<option value="${o.id}">${o.style_code} (${o.po_number}) - Kế hoạch: ${o.po_plan} đôi</option>`).join("");
    if (!appState.currentPO || !filtered.some(o => o.id === appState.currentPO.id)) {
      appState.currentPO = filtered[0];
    }
    poSel.value = appState.currentPO.id;
    loadReport();
    loadDeptLogs();
  } else {
    poSel.innerHTML = "<option value=''>-- Chưa có PO cho KH này --</option>";
    appState.currentPO = null;
    appState.report = { po_id: "", report_date: appState.currentDate, status: "DRAFT", batches: [] };
    renderReportUI();
  }
}

// LOAD REPORT DATA
async function loadReport() {
  if (!appState.currentPO) return;
  const poId = appState.currentPO.id;
  const date = appState.currentDate;

  try {
    const res = await fetch(`/api/report?po_id=${poId}&date=${date}`);
    const data = await res.json();
    if (data.success) {
      appState.report = data.report || { po_id: poId, report_date: date, status: "DRAFT", batches: [] };
      appState.cumExportsByBatch = data.cumExportsByBatch || {};

      // Auto-fallback: if report has no batches, populate immediately from currentPO default_batches
      if (!appState.report.batches || appState.report.batches.length === 0) {
        if (appState.currentPO && appState.currentPO.default_batches && appState.currentPO.default_batches.length > 0) {
          appState.report.batches = appState.currentPO.default_batches.map((b, i) => ({
            id: b.id || `b-${i+1}`,
            batch_name: b.batch_name,
            batch_plan: Number(b.batch_plan || b.into_sewing) || 0,
            into_sewing: Number(b.into_sewing || b.batch_plan) || 0,
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
          }));
        }
      }

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
    const intoSewing = Number(batch.into_sewing) || 0;
    const delivered = Number(appState.cumExportsByBatch[batch.batch_name]) || Number(batch.daily_out) || 0;
    batch.delivered = delivered;

    const tonLyThuyet = intoSewing - delivered;
    const actualWip = (Number(batch.wip_sewing) || 0) + (Number(batch.wip_qc) || 0) + (Number(batch.wip_pairing) || 0) + (Number(batch.wip_packing) || 0) + (Number(batch.wip_warehouse) || 0);
    const shortage = tonLyThuyet - actualWip;

    const reasonType = batch.shortage_reason_type || (batch.shortage_note === "Mất xác" || batch.shortage_note === "Hàng phế" ? batch.shortage_note : (batch.shortage_note ? "Khác" : ""));
    const customReason = reasonType === "Khác" ? batch.shortage_note || "" : "";

    const wrapper = document.createElement("div");
    wrapper.className = "excel-batch-wrapper";
    wrapper.dataset.index = idx;
    wrapper.id = `batchWrapper_${idx}`;

    wrapper.innerHTML = `
      <div class="batch-date-tag">📅 ${formatDateDisplay(appState.currentDate)}</div>
      
      <!-- TABLE 1: TẦNG 1 (HÌNH 1 - CÔNG THỨC TỰ ĐỘNG) -->
      <div class="table-card-1">
        <table class="batch-table-1">
          <thead>
            <tr>
              <th rowspan="2" class="col-batch-name th-batch-title">${batch.batch_name}</th>
              <th class="col-ton-dau th-ton-dau">TỒN ĐẦU<br>NGÀY</th>
              <th class="col-nhap th-nhap">NHẬP</th>
              <th class="col-xuat th-xuat">XUẤT</th>
              <th class="col-ton-cuoi th-ton-cuoi">TỒN LÝ THUYẾT</th>
              <th class="col-ton-thucte th-ton-thucte">TỒN THỰC TẾ</th>
              <th rowspan="2" class="col-thieu th-thieu-cell">THIẾU</th>
            </tr>
            <tr>
              <th class="sub-ton-dau">Luôn bằng 0</th>
              <th class="sub-nhap">Vào chuyền may</th>
              <th class="sub-xuat">Đã giao KH</th>
              <th class="sub-ton-cuoi">Lấy số Nhập - Xuất</th>
              <th class="sub-ton-thucte">Kiểm kê trên chuyền</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="val-plan-box">${(batch.batch_plan || 0).toLocaleString("vi-VN")}</td>
              <td class="val-ton-dau-box">0</td>
              <td class="val-nhap-box" id="calcIntoSewing_${idx}">${intoSewing.toLocaleString("vi-VN")}</td>
              <td class="val-xuat-box" id="calcDelivered_${idx}">${delivered.toLocaleString("vi-VN")}</td>
              <td class="val-ton-cuoi-box" id="calcTheoWip_${idx}">${tonLyThuyet.toLocaleString("vi-VN")}</td>
              <td class="val-ton-thucte-box" id="calcActualWip_${idx}">${actualWip.toLocaleString("vi-VN")}</td>
              <td class="cell-thieu-data">
                <div class="thieu-num-display" id="calcShortage_${idx}">${shortage.toLocaleString("vi-VN")}</div>
                <div class="thieu-dropdown-container">
                  <select class="thieu-select field-reason-type grid-nav-input" data-batch="${idx}" data-row="0" data-col="6" data-idx="${idx}" ${isEditing ? '' : 'disabled'}>
                    <option value="" ${!reasonType ? 'selected' : ''}>(Chọn)</option>
                    <option value="Mất xác" ${reasonType === 'Mất xác' ? 'selected' : ''}>Mất xác</option>
                    <option value="Hàng phế" ${reasonType === 'Hàng phế' ? 'selected' : ''}>Hàng phế</option>
                    <option value="Khác" ${reasonType === 'Khác' ? 'selected' : ''}>Khác</option>
                  </select>
                  <input type="text" class="thieu-underline-box field-custom-reason grid-nav-input"
                         id="customReason_${idx}"
                         placeholder="Thiếu phôi..."
                         value="${customReason}"
                         ${isEditing ? '' : 'readonly'}
                         data-batch="${idx}" data-row="0" data-col="7"
                         style="${reasonType === 'Khác' ? 'display:block;' : 'display:none;'}"
                         data-idx="${idx}">
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- BLUE DOWN ARROW ROW -->
      <div class="arrow-row">
        <div class="arrow-offset"></div>
        <div class="arrow-holder">
          <svg class="blue-block-arrow" viewBox="0 0 24 28" fill="#0284c7">
            <path d="M7 0 H17 V14 H24 L12 28 L0 14 H7 Z" />
          </svg>
        </div>
      </div>

      <!-- LOWER SECTION: TABLE 2 (HÌNH 2 - ĐIỀN TÊN NẰM NGANG DÒNG CUỐI) -->
      <div class="lower-section">
        <div class="lower-left-spacer">
          <span class="executor-label-txt">Điền tên người Thực Hiện</span>
        </div>
        <div class="table-card-2">
          <table class="batch-table-2">
            <thead>
              <tr>
                <th colspan="5" class="hdr-wip-top">KIỂM KÊ TỒN THỰC TẾ</th>
                <th class="hdr-out-top">XUẤT TRONG NGÀY</th>
                <th rowspan="3" class="hdr-action-top wip-col-action">THAO TÁC</th>
              </tr>
              <tr>
                <th class="wip-col-1 sub-wip-1">1. ĐANG SẢN XUẤT</th>
                <th class="wip-col-2 sub-wip-2">2. TỒN KIỂM QC</th>
                <th class="wip-col-3 sub-wip-3">3. TỒN PHỐI ĐÔI</th>
                <th class="wip-col-4 sub-wip-4">4. TỒN ĐÓNG GÓI</th>
                <th class="wip-col-5 sub-wip-5">5. TỒN KHO THÀNH<br>PHẨM</th>
                <th class="wip-col-6 sub-wip-6">6.XUẤT</th>
              </tr>
              <tr>
                <th class="sub-batch-tag"><i>${batch.batch_name}</i></th>
                <th class="sub-batch-tag"><i>${batch.batch_name}</i></th>
                <th class="sub-batch-tag"><i>${batch.batch_name}</i></th>
                <th class="sub-batch-tag"><i>${batch.batch_name}</i></th>
                <th class="sub-batch-tag"><i>${batch.batch_name}</i></th>
                <th class="sub-batch-tag"><i>${batch.batch_name}</i></th>
              </tr>
            </thead>
            <tbody>
              <!-- ROW 1: SỐ LƯỢNG KIỂM KÊ & XUẤT TRONG NGÀY -->
              <tr class="${isEditing ? 'batch-row-editing' : 'batch-row-locked'}">
                <td><input type="number" ${isEditing ? '' : 'readonly'} class="wip-num-input field-wip-sewing grid-nav-input" data-batch="${idx}" data-row="1" data-col="0" value="${batch.wip_sewing || ''}" placeholder="0" data-idx="${idx}"></td>
                <td><input type="number" ${isEditing ? '' : 'readonly'} class="wip-num-input field-wip-qc grid-nav-input" data-batch="${idx}" data-row="1" data-col="1" value="${batch.wip_qc || ''}" placeholder="0" data-idx="${idx}"></td>
                <td><input type="number" ${isEditing ? '' : 'readonly'} class="wip-num-input field-wip-pairing grid-nav-input" data-batch="${idx}" data-row="1" data-col="2" value="${batch.wip_pairing || ''}" placeholder="0" data-idx="${idx}"></td>
                <td><input type="number" ${isEditing ? '' : 'readonly'} class="wip-num-input field-wip-packing grid-nav-input" data-batch="${idx}" data-row="1" data-col="3" value="${batch.wip_packing || ''}" placeholder="0" data-idx="${idx}"></td>
                <td><input type="number" ${isEditing ? '' : 'readonly'} class="wip-num-input field-wip-warehouse grid-nav-input" data-batch="${idx}" data-row="1" data-col="4" value="${batch.wip_warehouse || ''}" placeholder="0" data-idx="${idx}"></td>
                <td><input type="number" ${isEditing ? '' : 'readonly'} class="wip-num-input wip-num-input-out field-daily-out grid-nav-input" data-batch="${idx}" data-row="1" data-col="5" value="${batch.daily_out || ''}" placeholder="0" data-idx="${idx}"></td>
                <td rowspan="2" class="cell-batch-actions">
                  <button type="button" class="btn-batch-toggle ${isEditing ? 'is-editing' : 'is-locked'} btn-toggle-batch" data-batch="${idx}">
                    ${isEditing ? '✅ OK' : '✏️ Sửa'}
                  </button>
                </td>
              </tr>
              <!-- ROW 2: TÊN NGƯỜI THỰC HIỆN / GHI CHÚ (DÒNG CUỐI CÙNG) -->
              <tr class="${isEditing ? 'batch-row-editing' : 'batch-row-locked'}">
                <td><input type="text" ${isEditing ? '' : 'readonly'} class="wip-executor-input field-note-sewing grid-nav-input" data-batch="${idx}" data-row="2" data-col="0" value="${batch.note_sewing || ''}" placeholder="Người thực hiện..." data-idx="${idx}"></td>
                <td><input type="text" ${isEditing ? '' : 'readonly'} class="wip-executor-input field-note-qc grid-nav-input" data-batch="${idx}" data-row="2" data-col="1" value="${batch.note_qc || ''}" placeholder="Người thực hiện..." data-idx="${idx}"></td>
                <td><input type="text" ${isEditing ? '' : 'readonly'} class="wip-executor-input field-note-pairing grid-nav-input" data-batch="${idx}" data-row="2" data-col="2" value="${batch.note_pairing || ''}" placeholder="Người thực hiện..." data-idx="${idx}"></td>
                <td><input type="text" ${isEditing ? '' : 'readonly'} class="wip-executor-input field-note-packing grid-nav-input" data-batch="${idx}" data-row="2" data-col="3" value="${batch.note_packing || ''}" placeholder="Người thực hiện..." data-idx="${idx}"></td>
                <td><input type="text" ${isEditing ? '' : 'readonly'} class="wip-executor-input field-note-warehouse grid-nav-input" data-batch="${idx}" data-row="2" data-col="4" value="${batch.note_warehouse || ''}" placeholder="Người thực hiện..." data-idx="${idx}"></td>
                <td><input type="text" ${isEditing ? '' : 'readonly'} class="wip-executor-input field-note-export grid-nav-input" data-batch="${idx}" data-row="2" data-col="5" value="${batch.note_export || ''}" placeholder="Ghi chú xuất..." data-idx="${idx}"></td>
              </tr>
            </tbody>
          </table>
        </div>
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
    const into = Number(b.into_sewing) || 0;
    totalReceived += into;

    // Prior days cumulative export strictly before current report date
    const priorExports = Number(appState.cumExportsByBatch && appState.cumExportsByBatch[b.batch_name]) || 0;
    const currentDaily = Number(b.daily_out) || 0;
    // Total delivered up to current date = prior days export + today's daily export
    const delivered = priorExports + currentDaily;
    b.delivered = delivered;
    totalDelivered += delivered;

    const actWip = (Number(b.wip_sewing) || 0) + (Number(b.wip_qc) || 0) + (Number(b.wip_pairing) || 0) + (Number(b.wip_packing) || 0) + (Number(b.wip_warehouse) || 0);
    totalActualWip += actWip;

    const tonLyThuyet = into - delivered;
    const shortage = tonLyThuyet - actWip;

    const elDelivered = document.getElementById(`calcDelivered_${idx}`);
    if (elDelivered) elDelivered.innerText = delivered.toLocaleString("vi-VN");

    const elTheo = document.getElementById(`calcTheoWip_${idx}`);
    if (elTheo) elTheo.innerText = tonLyThuyet.toLocaleString("vi-VN");

    const elAct = document.getElementById(`calcActualWip_${idx}`);
    if (elAct) elAct.innerText = actWip.toLocaleString("vi-VN");

    const elShortage = document.getElementById(`calcShortage_${idx}`);
    if (elShortage) elShortage.innerText = shortage.toLocaleString("vi-VN");
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
}

// BIND CARD INPUT LISTENERS
function bindCardInputs() {
  // Batch Edit/Lock Toggle Buttons
  document.querySelectorAll(".btn-toggle-batch").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const bIdx = parseInt(btn.dataset.batch, 10);
      if (isNaN(bIdx)) return;
      if (!appState.editingBatches) appState.editingBatches = {};

      const currentlyEditing = Boolean(appState.editingBatches[bIdx]);
      if (currentlyEditing) {
        // User clicked OK -> Save and lock
        appState.editingBatches[bIdx] = false;
        await saveReport(appState.report.status || "DRAFT", true);
        const b = appState.report.batches[bIdx];
        showToast(`💾 Đã lưu và khoá ${b ? b.batch_name : 'Lô'} ngày ${formatDateDisplay(appState.currentDate)}!`);
        renderReportUI();
      } else {
        // User clicked Sửa -> Enter edit mode
        appState.editingBatches[bIdx] = true;
        renderReportUI();
        // Focus first input of this batch
        const firstInput = document.querySelector(`.excel-batch-wrapper[data-index="${bIdx}"] .field-wip-sewing`);
        if (firstInput) {
          firstInput.focus();
          firstInput.select();
        }
      }
    });
  });

  document.querySelectorAll(".excel-batches-container input, .excel-batches-container select").forEach(input => {
    input.addEventListener("input", (e) => {
      const idx = e.target.dataset.idx;
      const b = appState.report.batches[idx];
      if (!b) return;

      if (e.target.classList.contains("field-wip-sewing")) b.wip_sewing = Number(e.target.value) || 0;
      if (e.target.classList.contains("field-wip-qc")) b.wip_qc = Number(e.target.value) || 0;
      if (e.target.classList.contains("field-wip-pairing")) b.wip_pairing = Number(e.target.value) || 0;
      if (e.target.classList.contains("field-wip-packing")) b.wip_packing = Number(e.target.value) || 0;
      if (e.target.classList.contains("field-wip-warehouse")) b.wip_warehouse = Number(e.target.value) || 0;
      if (e.target.classList.contains("field-daily-out")) {
        b.daily_out = Number(e.target.value) || 0;
      }

      if (e.target.classList.contains("field-note-sewing")) b.note_sewing = e.target.value;
      if (e.target.classList.contains("field-note-qc")) b.note_qc = e.target.value;
      if (e.target.classList.contains("field-note-pairing")) b.note_pairing = e.target.value;
      if (e.target.classList.contains("field-note-packing")) b.note_packing = e.target.value;
      if (e.target.classList.contains("field-note-warehouse")) b.note_warehouse = e.target.value;
      if (e.target.classList.contains("field-note-export")) b.note_export = e.target.value;

      if (e.target.classList.contains("field-reason-type")) {
        const selVal = e.target.value;
        b.shortage_reason_type = selVal;
        const customInput = document.getElementById(`customReason_${idx}`);
        if (selVal === "Khác") {
          b.shortage_note = customInput ? customInput.value : "";
          if (customInput) customInput.style.display = "block";
        } else {
          b.shortage_note = selVal;
          if (customInput) customInput.style.display = "none";
        }
      }

      if (e.target.classList.contains("field-custom-reason")) {
        b.shortage_note = e.target.value;
      }

      recalculateAllInPlace();
    });

    input.addEventListener("dblclick", (e) => {
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

  // TAB 1 NAVIGATION
  if (active.classList.contains("grid-nav-input")) {
    const batchIdx = parseInt(active.dataset.batch, 10);
    const rowIdx = parseInt(active.dataset.row, 10);
    const colIdx = parseInt(active.dataset.col, 10);
    if (isNaN(batchIdx)) return;

    if (e.key === "Enter") {
      e.preventDefault();
      if (!appState.editingBatches) appState.editingBatches = {};
      appState.editingBatches[batchIdx] = false;
      saveReport(appState.report.status || "DRAFT", true).then(() => {
        const b = appState.report.batches[batchIdx];
        showToast(`💾 Đã lưu số liệu ${b ? b.batch_name : ''} ngày ${formatDateDisplay(appState.currentDate)}!`);
        renderReportUI();
      });
      return;
    }

    if (e.key === "ArrowRight") {
      if (active.selectionStart === active.value.length || active.type === "select-one") {
        e.preventDefault();
        navigateCell(batchIdx, rowIdx, colIdx + 1);
      }
    } else if (e.key === "ArrowLeft") {
      if (active.selectionStart === 0 || active.type === "select-one") {
        e.preventDefault();
        navigateCell(batchIdx, rowIdx, colIdx - 1);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateCell(batchIdx, rowIdx + 1, colIdx);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      navigateCell(batchIdx, rowIdx - 1, colIdx);
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

function navigateCell(bIdx, rIdx, cIdx) {
  let target = document.querySelector(`.grid-nav-input[data-batch="${bIdx}"][data-row="${rIdx}"][data-col="${cIdx}"]`);
  if (!target) {
    if (rIdx > 2) {
      target = document.querySelector(`.grid-nav-input[data-batch="${bIdx + 1}"][data-row="1"][data-col="${cIdx}"]`);
    } else if (rIdx < 1 && bIdx > 0) {
      target = document.querySelector(`.grid-nav-input[data-batch="${bIdx - 1}"][data-row="2"][data-col="${cIdx}"]`);
    }
  }
  if (target) {
    target.focus();
    if (target.select && target.type !== "select-one") target.select();
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
        appState.deptLogs[bName].push({ date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" });
        if (tbody) {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td><input type="text" class="dept-nav-input txt-date" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="1" data-field="date" value="" placeholder=""></td>
            <td><input type="number" class="dept-nav-input dept-cell-nhap-phoi" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="2" data-field="nhap_phoi" value=""></td>
            <td><input type="number" class="dept-nav-input dept-cell-giao-dg" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="3" data-field="giao_dg" value=""></td>
            <td><input type="number" class="dept-nav-input dept-cell-nhap-kho" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="4" data-field="nhap_kho" value=""></td>
            <td><input type="number" class="dept-nav-input dept-cell-xuat-kho" data-batch-idx="${startBIdx}" data-row-idx="${i}" data-col-idx="5" data-field="xuat_kho" value=""></td>
          `;
          tbody.appendChild(tr);
        }
      }
      bindDeptTableInputs();
    }

    const fieldMap = { 1: "date", 2: "nhap_phoi", 3: "giao_dg", 4: "nhap_kho", 5: "xuat_kho" };

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
        into_sewing: qty
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
  const batches = po && po.default_batches && po.default_batches.length > 0 
    ? po.default_batches 
    : [
        { id: "b-1", batch_name: "Lô 1", batch_plan: 1230, into_sewing: 1230 },
        { id: "b-2", batch_name: "Lô 2", batch_plan: 267, into_sewing: 267 },
        { id: "b-3", batch_name: "Số đuôi", batch_plan: 126, into_sewing: 126 }
      ];

  if (!appState.deptLogs) appState.deptLogs = {};

  let totalAllReceived = 0;
  let totalAllDelivered = 0;

  batches.forEach((b, bIdx) => {
    const bName = b.batch_name;
    const batchPlan = Number(b.into_sewing || b.batch_plan) || 0;
    totalAllReceived += batchPlan;

    // Load or initialize rows for this batch (default 6 rows)
    if (!appState.deptLogs[bName] || !Array.isArray(appState.deptLogs[bName]) || appState.deptLogs[bName].length === 0) {
      appState.deptLogs[bName] = [
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ];
    }

    const rows = appState.deptLogs[bName];
    let sumNhapPhoi = 0;
    let sumGiaoDG = 0;
    let sumNhapKho = 0;
    let sumXuatKho = 0;

    rows.forEach(r => {
      sumNhapPhoi += Number(r.nhap_phoi) || 0;
      sumGiaoDG += Number(r.giao_dg) || 0;
      sumNhapKho += Number(r.nhap_kho) || 0;
      sumXuatKho += Number(r.xuat_kho) || 0;
    });

    totalAllDelivered += sumXuatKho;
    const tonCuoi = batchPlan - sumXuatKho;

    // Điều kiện: Tất cả các ô tổng cộng bằng nhau VÀ bằng số Nhập vào chuyền may của Lô đó
    const isOk = (batchPlan > 0 && sumNhapPhoi === batchPlan && sumGiaoDG === batchPlan && sumNhapKho === batchPlan && sumXuatKho === batchPlan);
    const statusBadge = isOk 
      ? `<span class="dept-status-badge is-ok">OK</span>`
      : `<span class="dept-status-badge is-not-ok">Not OKe</span>`;

    // Render Batch Block (Left Table + Right Table)
    const blockEl = document.createElement("div");
    blockEl.className = "dept-batch-block";
    blockEl.dataset.batchName = bName;
    blockEl.dataset.batchIdx = bIdx;

    let rowsHtml = "";
    rows.forEach((r, rIdx) => {
      rowsHtml += `
        <tr>
          <td><input type="text" class="dept-nav-input txt-date" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="1" data-field="date" value="${r.date || ''}" placeholder=""></td>
          <td><input type="number" class="dept-nav-input dept-cell-nhap-phoi" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="2" data-field="nhap_phoi" value="${r.nhap_phoi !== undefined ? r.nhap_phoi : ''}"></td>
          <td><input type="number" class="dept-nav-input dept-cell-giao-dg" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="3" data-field="giao_dg" value="${r.giao_dg !== undefined ? r.giao_dg : ''}"></td>
          <td><input type="number" class="dept-nav-input dept-cell-nhap-kho" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="4" data-field="nhap_kho" value="${r.nhap_kho !== undefined ? r.nhap_kho : ''}"></td>
          <td><input type="number" class="dept-nav-input dept-cell-xuat-kho" data-batch-idx="${bIdx}" data-row-idx="${rIdx}" data-col-idx="5" data-field="xuat_kho" value="${r.xuat_kho !== undefined ? r.xuat_kho : ''}"></td>
          <td></td>
        </tr>
      `;
    });

    blockEl.innerHTML = `
      <!-- LEFT TABLE: SỔ SÁCH & CÂN ĐỐI LÔ -->
      <div class="dept-left-col">
        <table class="dept-left-table">
          <thead>
            <tr>
              <th class="th-dept-batch-name">${bName}</th>
              <th class="th-dept-tondau">TỒN ĐẦU NGÀY</th>
              <th class="th-dept-nhap">NHẬP</th>
              <th class="th-dept-xuat">XUẤT</th>
              <th class="th-dept-toncuoi">TỒN CUỐI NGÀY</th>
            </tr>
            <tr>
              <td class="sub-dept-header"></td>
              <td class="sub-dept-header">Luôn bằng 0</td>
              <td class="sub-dept-header">Vào chuyền may</td>
              <td class="sub-dept-header">Đã giao KH</td>
              <td class="sub-dept-header sub-dept-toncuoi">Lấy số Tồn đầu ngày + Nhập - Xuất</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="val-dept-batch-plan">${batchPlan.toLocaleString('vi-VN')}</td>
              <td class="val-dept-tondau">0</td>
              <td class="val-dept-nhap" id="left_nhap_${bIdx}">${batchPlan.toLocaleString('vi-VN')}</td>
              <td class="val-dept-xuat" id="left_xuat_${bIdx}">${sumXuatKho.toLocaleString('vi-VN')}</td>
              <td class="val-dept-toncuoi" id="left_toncuoi_${bIdx}">${tonCuoi.toLocaleString('vi-VN')}</td>
            </tr>
          </tbody>
        </table>
        <div class="dept-executor-note">Điền tên người Thực Hiện</div>
      </div>

      <!-- RIGHT TABLE: THEO DÕI SẢN LƯỢNG CÁC BỘ PHẬN (ĐIỀN TAY) -->
      <div class="dept-right-col">
        <table class="dept-right-table" id="right_table_${bIdx}">
          <thead>
            <tr>
              <th class="th-dept-col" style="width: 80px;">Ngày</th>
              <th class="th-dept-col">Nhập phối đôi</th>
              <th class="th-dept-col">Giao Đóng gói</th>
              <th class="th-dept-col">Nhập kho TP</th>
              <th class="th-dept-col">Xuất kho TP</th>
              <th class="th-dept-col" style="width: 95px;">Trạng Thái</th>
            </tr>
          </thead>
          <tbody id="deptTbody_${bIdx}">
            ${rowsHtml}
          </tbody>
          <tfoot class="dept-table-tfoot">
            <tr class="tr-dept-total">
              <td class="td-dept-sum-label"><strong>TỔNG CỘNG</strong></td>
              <td class="td-dept-sum-val" id="sum_nhap_phoi_${bIdx}">${sumNhapPhoi.toLocaleString('vi-VN')}</td>
              <td class="td-dept-sum-val" id="sum_giao_dg_${bIdx}">${sumGiaoDG.toLocaleString('vi-VN')}</td>
              <td class="td-dept-sum-val" id="sum_nhap_kho_${bIdx}">${sumNhapKho.toLocaleString('vi-VN')}</td>
              <td class="td-dept-sum-val" id="sum_xuat_kho_${bIdx}">${sumXuatKho.toLocaleString('vi-VN')}</td>
              <td class="td-dept-sum-status" id="status_col_${bIdx}">${statusBadge}</td>
            </tr>
          </tfoot>
        </table>
        <button type="button" class="btn-add-dept-row" data-batch-idx="${bIdx}" data-batch-name="${bName}">➕ Thêm dòng ngày</button>
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

  // 4. Bind listeners to right-table inputs
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
      if (!appState.deptLogs[bName][rIdx]) appState.deptLogs[bName][rIdx] = { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" };

      appState.deptLogs[bName][rIdx][field] = e.target.value;

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
      appState.deptLogs[bName].push({ date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" });

      const tbody = document.getElementById(`deptTbody_${bIdx}`);
      if (tbody) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><input type="text" class="dept-nav-input txt-date" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="1" data-field="date" value="" placeholder=""></td>
          <td><input type="number" class="dept-nav-input dept-cell-nhap-phoi" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="2" data-field="nhap_phoi" value=""></td>
          <td><input type="number" class="dept-nav-input dept-cell-giao-dg" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="3" data-field="giao_dg" value=""></td>
          <td><input type="number" class="dept-nav-input dept-cell-nhap-kho" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="4" data-field="nhap_kho" value=""></td>
          <td><input type="number" class="dept-nav-input dept-cell-xuat-kho" data-batch-idx="${bIdx}" data-row-idx="${newRowIdx}" data-col-idx="5" data-field="xuat_kho" value=""></td>
          <td></td>
        </tr>
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
    totalAllReceived += batchPlan;

    let sumNhapPhoi = 0;
    let sumGiaoDG = 0;
    let sumNhapKho = 0;
    let sumXuatKho = 0;

    const rows = (appState.deptLogs && appState.deptLogs[bName]) ? appState.deptLogs[bName] : [];
    rows.forEach(r => {
      sumNhapPhoi += Number(r.nhap_phoi) || 0;
      sumGiaoDG += Number(r.giao_dg) || 0;
      sumNhapKho += Number(r.nhap_kho) || 0;
      sumXuatKho += Number(r.xuat_kho) || 0;
    });

    totalAllDelivered += sumXuatKho;
    const tonCuoi = batchPlan - sumXuatKho;

    // Update left table
    const elXuat = document.getElementById(`left_xuat_${bIdx}`);
    if (elXuat) elXuat.innerText = sumXuatKho.toLocaleString("vi-VN");

    const elTon = document.getElementById(`left_toncuoi_${bIdx}`);
    if (elTon) elTon.innerText = tonCuoi.toLocaleString("vi-VN");

    // Update right table tfoot sums
    const elSumNP = document.getElementById(`sum_nhap_phoi_${bIdx}`);
    if (elSumNP) elSumNP.innerText = sumNhapPhoi.toLocaleString("vi-VN");

    const elSumDG = document.getElementById(`sum_giao_dg_${bIdx}`);
    if (elSumDG) elSumDG.innerText = sumGiaoDG.toLocaleString("vi-VN");

    const elSumNK = document.getElementById(`sum_nhap_kho_${bIdx}`);
    if (elSumNK) elSumNK.innerText = sumNhapKho.toLocaleString("vi-VN");

    const elSumXK = document.getElementById(`sum_xuat_kho_${bIdx}`);
    if (elSumXK) elSumXK.innerText = sumXuatKho.toLocaleString("vi-VN");

    // Status check
    const isOk = (batchPlan > 0 && sumNhapPhoi === batchPlan && sumGiaoDG === batchPlan && sumNhapKho === batchPlan && sumXuatKho === batchPlan);
    const elStatus = document.getElementById(`status_col_${bIdx}`);
    if (elStatus) {
      elStatus.innerHTML = isOk 
        ? `<span class="dept-status-badge is-ok">OK</span>`
        : `<span class="dept-status-badge is-not-ok">Not OKe</span>`;
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
    ["Lô Hàng", "Tồn Đầu Ngày", "Nhập (Vào Chuyền)", "Xuất (Đã Giao KH)", "Tồn Cuối Ngày", "", "Ngày", "Nhập Phối Đôi", "Giao Đóng Gói", "Nhập Kho TP", "Xuất Kho TP", "Trạng Thái"]
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
    let sumNP = 0, sumDG = 0, sumNK = 0, sumXK = 0;
    deptRows.forEach(r => {
      sumNP += Number(r.nhap_phoi) || 0;
      sumDG += Number(r.giao_dg) || 0;
      sumNK += Number(r.nhap_kho) || 0;
      sumXK += Number(r.xuat_kho) || 0;
    });
    const tonCuoi = batchPlan - sumXK;
    const isOk = (batchPlan > 0 && sumNP === batchPlan && sumDG === batchPlan && sumNK === batchPlan && sumXK === batchPlan);

    // First row of batch
    const firstDept = deptRows[0] || {};
    rows.push([
      bName,
      0,
      batchPlan,
      sumXK,
      tonCuoi,
      "",
      firstDept.date || "",
      firstDept.nhap_phoi || "",
      firstDept.giao_dg || "",
      firstDept.nhap_kho || "",
      firstDept.xuat_kho || "",
      ""
    ]);

    // Subsequent rows of batch
    for (let i = 1; i < deptRows.length; i++) {
      const dr = deptRows[i];
      rows.push([
        "", "", "", "", "", "",
        dr.date || "",
        dr.nhap_phoi || "",
        dr.giao_dg || "",
        dr.nhap_kho || "",
        dr.xuat_kho || "",
        ""
      ]);
    }

    // Summary row of batch
    rows.push([
      "", "", "", "", "", "",
      "TỔNG CỘNG",
      sumNP,
      sumDG,
      sumNK,
      sumXK,
      isOk ? "OK" : "Not OKe"
    ]);

    rows.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Theo_Doi_San_Luong");
  XLSX.writeFile(wb, `Theo_Doi_San_Luong_${poNum}_${appState.currentDate}.xlsx`);
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
  localStorage.setItem("dd_wip_role", appState.currentUserRole);

  if (user) {
    appState.currentUser = user;
    localStorage.setItem("dd_user_info", JSON.stringify(user));
  }

  const badge = document.getElementById("currentRoleBadge");
  const tabManageBtn = document.getElementById("tabBtnManage");
  const tabHistoryBtn = document.getElementById("tabBtnHistory");
  const tabUsersBtn = document.getElementById("tabBtnUsers");

  const displayName = user ? (user.full_name || user.email || user.phone) : (role === "admin" ? "Sếp Tổng" : (role === "manager" ? "Quản lý" : "Công nhân"));

  if (role === "admin") {
    if (badge) {
      badge.className = "role-badge is-admin";
      badge.innerHTML = `👑 ${displayName} (Admin)`;
    }
    if (tabManageBtn) tabManageBtn.classList.remove("hidden");
    if (tabHistoryBtn) tabHistoryBtn.classList.remove("hidden");
    if (tabUsersBtn) tabUsersBtn.classList.remove("hidden");
  } else if (role === "manager") {
    if (badge) {
      badge.className = "role-badge is-manager";
      badge.innerHTML = `⭐ ${displayName} (Quản lý)`;
    }
    if (tabManageBtn) tabManageBtn.classList.remove("hidden");
    if (tabHistoryBtn) tabHistoryBtn.classList.remove("hidden");
    if (tabUsersBtn) tabUsersBtn.classList.add("hidden");
    
    // If manager is on tab-users, switch to tab-manage
    const activeTab = document.querySelector(".tab-btn.active");
    if (activeTab && activeTab.dataset.tab === "tab-users") {
      if (tabManageBtn) tabManageBtn.click();
    }
  } else {
    if (badge) {
      badge.className = "role-badge is-worker";
      badge.innerHTML = `👤 ${displayName} (Công nhân)`;
    }
    if (tabManageBtn) tabManageBtn.classList.add("hidden");
    if (tabHistoryBtn) tabHistoryBtn.classList.add("hidden");
    if (tabUsersBtn) tabUsersBtn.classList.add("hidden");

    // If user is currently on Tab 2, Tab 4, or Tab 5, automatically switch back to Tab 1
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

  const txtPhone = document.getElementById("txtAuthPhone");
  if (txtPhone && appState.currentUser && appState.currentUser.phone) {
    txtPhone.value = appState.currentUser.phone;
  }

  const boxOtp = document.getElementById("boxOtpInput");
  if (boxOtp) boxOtp.style.display = "none";

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

// 2. Confirm Authentication (Email / OTP / PIN)
async function handleConfirmAuth() {
  const isEmailPane = document.getElementById("authPaneEmail")?.classList.contains("active");
  const isPhonePane = document.getElementById("authPanePhone")?.classList.contains("active");

  if (isEmailPane) {
    // 1. Verify via Email & Password
    const email = document.getElementById("txtAuthEmail")?.value.trim();
    const password = document.getElementById("txtAuthPassword")?.value.trim();

    if (!email || !password) {
      alert("Vui lòng nhập đầy đủ Email/SĐT và Mật khẩu.");
      return;
    }

    try {
      const res = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (data.success && data.user) {
        applyUserRole(data.user.role, data.user);
        closeRoleModal();
        showToast(`🎉 Đăng nhập thành công: ${data.user.full_name || data.user.email} (Quyền: ${data.user.role === 'admin' ? '👑 Sếp Tổng' : (data.user.role === 'manager' ? '⭐ Quản lý' : '👤 Công nhân')})`);
      } else {
        alert("❌ " + (data.error || "Email hoặc Mật khẩu không chính xác!"));
      }
    } catch (err) {
      alert("Lỗi đăng nhập: " + err.message);
    }
  } else if (isPhonePane) {
    // 2. Verify via OTP SMS
    const rawPhone = document.getElementById("txtAuthPhone")?.value.trim();
    const otpCode = document.getElementById("txtOtpCode")?.value.trim();

    if (!rawPhone) {
      alert("❌ Vui lòng nhập số điện thoại.");
      return;
    }
    const boxOtp = document.getElementById("boxOtpInput");
    if (!boxOtp || boxOtp.style.display === "none") {
      alert("⚠️ Vui lòng bấm nút '📩 Gửi Mã OTP' để nhận tin nhắn SMS chứa mã xác nhận!");
      return;
    }
    if (!otpCode || otpCode.length !== 6) {
      alert("❌ Vui lòng nhập đầy đủ 6 chữ số OTP từ tin nhắn SMS.");
      return;
    }

    if (!modalConfirmationResult) {
      alert("❌ Phiên gửi OTP chưa hoàn tất. Vui lòng bấm gửi lại.");
      return;
    }

    try {
      // Verify with Firebase
      const userCredential = await modalConfirmationResult.confirm(otpCode);
      const fbUser = userCredential.user;

      const res = await fetch("/api/auth/phone-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: rawPhone,
          otp_verified: true,
          firebase_uid: fbUser.uid
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        applyUserRole(data.user.role, data.user);
        closeRoleModal();
        showToast(`🎉 Xác thực OTP thành công! Vai trò: ${data.user.role === 'admin' ? '👑 Sếp Tổng' : (data.user.role === 'manager' ? '⭐ Quản lý' : '👤 Công nhân')}`);
      } else {
        alert("❌ " + (data.error || "Xác thực OTP không thành công!"));
      }
    } catch (err) {
      alert("❌ Lỗi xác thực OTP từ SMS: " + err.message);
    }
  } else {
    // 3. Verify via PIN Code
    const rawPhone = document.getElementById("txtPinPhone")?.value.trim() || "0900000000";
    const pin = document.getElementById("txtManagerPin")?.value.trim();

    if (!pin) {
      alert("Vui lòng nhập mã PIN.");
      return;
    }

    try {
      const res = await fetch("/api/auth/phone-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: rawPhone,
          pin: pin,
          otp_verified: false
        })
      });

      const data = await res.json();
      if (data.success && data.user) {
        applyUserRole(data.user.role, data.user);
        closeRoleModal();
        showToast(`✅ Đăng nhập mã PIN thành công: ${data.user.full_name || data.user.phone}`);
      } else {
        alert("❌ " + (data.error || "Mã PIN không chính xác!"));
      }
    } catch (err) {
      alert("Lỗi đăng nhập: " + err.message);
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
      document.getElementById("userFullName").value = user.full_name;
      document.getElementById("userRoleSelect").value = user.role;
      if (document.getElementById("userPassword")) document.getElementById("userPassword").value = user.password || "Admin@123456";
      document.getElementById("userPinCode").value = user.pin_code || "1234";
      document.getElementById("btnSubmitUser").innerText = "💾 Cập Nhật Quyền";
      document.getElementById("btnCancelEditUser").style.display = "inline-block";
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
}

async function handleAddUser(e) {
  e.preventDefault();
  const id = document.getElementById("editUserId").value;
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

  filtered.forEach(r => {
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
    const statusHtml = shortage === 0 
      ? `<span class="dept-status-badge is-ok">Khớp (OK)</span>` 
      : (shortage > 0 
          ? `<span class="dept-status-badge is-not-ok">Thiếu ${shortage}</span>` 
          : `<span class="dept-status-badge" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;">Thừa +${Math.abs(shortage)}</span>`);

    tr.innerHTML = `
      <td style="font-weight: 700; color: #1e293b;">${r.report_date || ''}</td>
      <td style="font-weight: 700; color: #0284c7;">${r.batch_name || ''}</td>
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
    tbody.appendChild(tr);
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
    ["Ngày Báo Cáo", "Lô Hàng", "Nhập (Vào Chuyền)", "Xuất (Giao KH)", "KK May", "KK QC", "KK Phối Đôi", "KK Đóng Gói", "KK Kho TP", "Tổng Tồn Thực Tế", "Tồn Lý Thuyết", "Chênh Lệch", "Lý Do / Ghi Chú"]
  ];

  const filterBatch = document.getElementById("historyBatchFilter")?.value || "ALL";
  const filtered = filterBatch === "ALL" 
    ? appState.historyLogs 
    : appState.historyLogs.filter(r => r.batch_name === filterBatch);

  filtered.forEach(r => {
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
      r.report_date || "",
      r.batch_name || "",
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

  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Lich_Su_Kiem_Ke_Lo");
  XLSX.writeFile(wb, `Lich_Su_Kiem_Ke_Lo_${poNum}.xlsx`);
}

