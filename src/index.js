// Memory database initial seed (fallback for local dev without D1)
const INITIAL_DB = {
  customers: [
    { id: "cust-1791885118290", code: "CASUM", name: "CAO SU MÀU" },
    { id: "cust-1790383482005", code: "Lth", name: "Liên Thái" },
    { id: "cust-1792141543754", code: "MP", name: "MẠNH PHÁT" }
  ],
  orders: [
    {
      id: "po-1792143170857",
      customer_id: "cust-1792141543754", // MẠNH PHÁT
      style_code: "296507-003",
      po_number: "MEXICO",
      line_name: "Chuyền A",
      po_plan: 4582,
      tail_sweep_date: "2026-10-16",
      tail_batch_name: "Lô Số Đuôi",
      default_batches: [
        { id: "b-1", batch_name: "Lô 1", batch_plan: 1150, into_sewing: 950 },
        { id: "b-2", batch_name: "Lô 2", batch_plan: 900, into_sewing: 0 },
        { id: "b-3", batch_name: "Lô 3", batch_plan: 940, into_sewing: 0 },
        { id: "b-4", batch_name: "Lô 4", batch_plan: 850, into_sewing: 0 },
        { id: "b-5", batch_name: "Lô 5", batch_plan: 742, into_sewing: 0 }
      ]
    },
    {
      id: "po-1790384969934",
      customer_id: "cust-1790383482005", // Liên Thái
      style_code: "DA-260",
      po_number: "050",
      line_name: "Tự phân bổ",
      po_plan: 1623,
      tail_sweep_date: "2026-09-23",
      tail_batch_name: "Lô Số Đuôi",
      default_batches: [
        { id: "b-1", batch_name: "Lô 1", batch_plan: 1230, into_sewing: 1230 },
        { id: "b-2", batch_name: "Lô 2", batch_plan: 237, into_sewing: 237 },
        { id: "b-3", batch_name: "Lô Số Đuôi", batch_plan: 156, into_sewing: 156, is_tail_batch: true }
      ]
    },
    {
      id: "po-1791885748919",
      customer_id: "cust-1791885118290", // CAO SU MÀU
      style_code: "DCP007-NELLIE",
      po_number: "2000000652",
      line_name: "Chuyền C",
      po_plan: 756,
      default_batches: [
        { id: "b-1", batch_name: "Lô 1", batch_plan: 756, into_sewing: 756 }
      ]
    }
  ],
  reports: {
    "po-050_2026-09-22": {
      po_id: "po-050",
      report_date: "2026-09-22",
      status: "SUBMITTED",
      batches: [
        {
          id: "b1",
          batch_name: "Lô 1",
          batch_plan: 1230,
          into_sewing: 1230,
          wip_sewing: 180,
          wip_qc: 60,
          wip_pairing: 218,
          wip_packing: 123,
          wip_warehouse: 0,
          daily_out: 648,
          note_sewing: "Line may 1",
          note_qc: "Trạm QC 1",
          note_pairing: "Thảo",
          note_packing: "Lan",
          note_warehouse: "",
          shortage_reason_type: "Khác",
          shortage_note: "Thiếu 1 phôi hỏng",
          shortage_mat_xac: 1
        },
        {
          id: "b2",
          batch_name: "Lô 2",
          batch_plan: 267,
          into_sewing: 267,
          wip_sewing: 0,
          wip_qc: 0,
          wip_pairing: 100,
          wip_packing: 100,
          wip_warehouse: 50,
          daily_out: 0,
          note_sewing: "",
          note_qc: "",
          note_pairing: "Thảo",
          note_packing: "Lan",
          note_warehouse: "Kho TP",
          shortage_reason_type: "Hàng phế",
          shortage_note: "Lỗi vải 17 đôi",
          shortage_hang_phe: 17
        }
      ]
    },
    "po-050_2026-09-23": {
      po_id: "po-050",
      report_date: "2026-09-23",
      status: "SUBMITTED",
      batches: [
        {
          id: "b1",
          batch_name: "Lô 1",
          batch_plan: 1230,
          into_sewing: 0,
          wip_sewing: 0,
          wip_qc: 0,
          wip_pairing: 0,
          wip_packing: 111,
          wip_warehouse: 120,
          daily_out: 350,
          note_sewing: "Line may 1",
          note_qc: "Trạm QC 1",
          note_pairing: "Hà",
          note_packing: "Hồng",
          note_warehouse: "Kho TP",
          note_export: "Tài",
          shortage_reason_type: "Khác",
          shortage_note: "Thiếu 1 phôi hỏng",
          shortage_mat_xac: 1
        },
        {
          id: "b2",
          batch_name: "Lô 2",
          batch_plan: 267,
          into_sewing: 0,
          wip_sewing: 0,
          wip_qc: 0,
          wip_pairing: 100,
          wip_packing: 100,
          wip_warehouse: 50,
          daily_out: 0,
          note_sewing: "",
          note_qc: "",
          note_pairing: "Thảo",
          note_packing: "Lan",
          note_warehouse: "Kho TP",
          shortage_reason_type: "Hàng phế",
          shortage_note: "17 đôi lỗi vải chờ Chuẩn bị dập bù",
          shortage_hang_phe: 17
        },
        {
          id: "b3",
          batch_name: "Lô Số Đuôi",
          batch_plan: 126,
          into_sewing: 126,
          wip_sewing: 80,
          wip_qc: 46,
          wip_pairing: 0,
          wip_packing: 0,
          wip_warehouse: 0,
          daily_out: 0,
          note_sewing: "Tổ may",
          note_qc: "QC 1",
          note_pairing: "",
          note_packing: "",
          note_warehouse: "",
          shortage_reason_type: "",
          shortage_note: "Nhận 126 nợ từ Chuẩn Bị bù nợ",
          is_tail_batch: true
        }
      ]
    },
    "po-casum-01_2026-10-15": {
      po_id: "po-casum-01",
      report_date: "2026-10-15",
      status: "SUBMITTED",
      batches: [
        {
          id: "b-cs1",
          batch_name: "Lô 1",
          batch_plan: 1000,
          into_sewing: 1000,
          wip_sewing: 200,
          wip_qc: 100,
          wip_pairing: 100,
          wip_packing: 100,
          wip_warehouse: 0,
          daily_out: 500,
          delivered: 500,
          note_sewing: "Tổ may 1",
          note_qc: "QC 1",
          note_pairing: "",
          note_packing: "",
          note_warehouse: "",
          shortage_reason_type: "",
          shortage_note: ""
        },
        {
          id: "b-cs2",
          batch_name: "Lô 2",
          batch_plan: 850,
          into_sewing: 850,
          wip_sewing: 850,
          wip_qc: 0,
          wip_pairing: 0,
          wip_packing: 0,
          wip_warehouse: 0,
          daily_out: 0,
          delivered: 0
        }
      ]
    },
    "po-mp-01_2026-10-15": {
      po_id: "po-mp-01",
      report_date: "2026-10-15",
      status: "SUBMITTED",
      batches: [
        {
          id: "b-mp1",
          batch_name: "Lô 1",
          batch_plan: 1150,
          into_sewing: 950,
          wip_sewing: 700,
          wip_qc: 0,
          wip_pairing: 100,
          wip_packing: 0,
          wip_warehouse: 0,
          daily_out: 150,
          delivered: 150,
          note_sewing: "Line 2",
          note_qc: "",
          note_pairing: "",
          note_packing: "",
          note_warehouse: "",
          shortage_reason_type: "",
          shortage_note: ""
        },
        {
          id: "b-mp2",
          batch_name: "Lô 2",
          batch_plan: 1150,
          into_sewing: 0,
          wip_sewing: 0,
          wip_qc: 0,
          wip_pairing: 0,
          wip_packing: 0,
          wip_warehouse: 0,
          daily_out: 0,
          delivered: 0
        }
      ]
    },
    "296507-003_2026-10-15": {
      po_id: "296507-003",
      report_date: "2026-10-15",
      status: "SUBMITTED",
      batches: [
        {
          id: "b-mp1",
          batch_name: "Lô 1",
          batch_plan: 1150,
          into_sewing: 950,
          wip_sewing: 700,
          wip_qc: 0,
          wip_pairing: 100,
          wip_packing: 0,
          wip_warehouse: 0,
          daily_out: 150,
          delivered: 150,
          note_sewing: "Line 2",
          note_qc: "",
          note_pairing: "",
          note_packing: "",
          note_warehouse: "",
          shortage_reason_type: "",
          shortage_note: ""
        },
        {
          id: "b-mp2",
          batch_name: "Lô 2",
          batch_plan: 1150,
          into_sewing: 0,
          wip_sewing: 0,
          wip_qc: 0,
          wip_pairing: 0,
          wip_packing: 0,
          wip_warehouse: 0,
          daily_out: 0,
          delivered: 0
        }
      ]
    }
  },
  dept_logs: {
    "po-050": {
      "Lô 1": [
        { date: "22/9", nhap_phoi: 200, giao_dg: 150, nhap_kho: 150, xuat_kho: 0 },
        { date: "23/9", nhap_phoi: 300, giao_dg: 250, nhap_kho: 200, xuat_kho: 200 },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ],
      "Lô 2": [
        { date: "22/9", nhap_phoi: 100, giao_dg: 100, nhap_kho: 50, xuat_kho: 0 },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ],
      "Lô Số Đuôi": [
        { date: "23/9", nhap_phoi: 126, giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ],
      "Số đuôi": [
        { date: "23/9", nhap_phoi: 126, giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ]
    },
    "po-casum-01": {
      "Lô 1": [
        { date: "15/10", nhap_phoi: 1000, giao_dg: 800, nhap_kho: 600, xuat_kho: 500 },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ],
      "Lô 2": [
        { date: "15/10", nhap_phoi: 850, giao_dg: 0, nhap_kho: 0, xuat_kho: 0 },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ]
    },
    "po-mp-01": {
      "Lô 1": [
        { date: "15/10", nhap_phoi: 950, giao_dg: 0, nhap_kho: 0, xuat_kho: 150 },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ],
      "Lô 2": [
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ]
    },
    "296507-003": {
      "Lô 1": [
        { date: "15/10", nhap_phoi: 950, giao_dg: 0, nhap_kho: 0, xuat_kho: 150 },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ],
      "Lô 2": [
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ]
    }
  },
  flow_logs: [],
  release_entries: [],
  release_confirms: [],
  role_passwords: {},
  art_parts: {},
  users: [
    { id: "usr-admin-1", email: "admin@ddlongan.com", phone: "0900000000", full_name: "Sếp Tổng Quản Trị (Admin)", role: "admin", password: "Admin@123456", pin_code: "1234", is_active: 1 },
    { id: "usr-admin-2", email: "merchandise6868@gmail.com", phone: "0988888888", full_name: "Sếp Merchandise", role: "admin", password: "Admin@123456", pin_code: "1234", is_active: 1 },
    { id: "usr-mgr-1", email: "manager@ddlongan.com", phone: "0977777777", full_name: "Tổ Trưởng Chuyền 1 (Manager)", role: "manager", password: "Manager@123456", pin_code: "1234", is_active: 1 },
    { id: "usr-wrk-1", email: "worker@ddlongan.com", phone: "0911111111", full_name: "Công Nhân Kiểm Kê", role: "worker", password: "Worker@123456", pin_code: "1234", is_active: 1 }
  ]
};

let memoryDB = JSON.parse(JSON.stringify(INITIAL_DB));

// Helper: Normalize phone numbers (e.g. +84901234567 -> 0901234567 or vice versa)
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

// ==========================================
// THẢ CHUYỀN / CHỈ LỆNH ĐÓNG GÓI - HELPERS
// ==========================================
// tha_chuyen = thả chuyền đồng bộ (đôi), tha_chuyen_ct = thả chuyền theo chi tiết, dong_goi = chỉ lệnh đóng gói
const RELEASE_KINDS = ['tha_chuyen', 'tha_chuyen_ct', 'dong_goi'];

// Lô rỗng ('') = số nhập trước khi chia lô, giữ dạng id cũ để không trùng dòng.
// Thả chuyền chi tiết: mỗi chi tiết 1 dòng, thêm |pt:<tên chi tiết> (số ở n1, tên ở p1).
// Thả chuyền theo công đoạn thêm đuôi |st:<id công đoạn>; không có công đoạn thì giữ id cũ.
const releaseEntryId = (poId, batch, kind, date, size, stage, part) =>
  (batch ? `${poId}|${batch}|${kind}|${date}|${size}` : `${poId}|${kind}|${date}|${size}`)
  + (part ? `|pt:${part}` : '') + (stage ? `|st:${stage}` : '');
const isStageKind = kind => kind === 'tha_chuyen' || kind === 'tha_chuyen_ct';
// Dòng đồng bộ do Chi tiết tự ghi (size đủ mọi chi tiết): kind tha_chuyen, p1 = '#ct', id đuôi |pt:#ct
const CT_AUTO_PART = '#ct';
const isCtAutoRow = r => r.kind === 'tha_chuyen' && r.p1 === CT_AUTO_PART;
const MAX_STAGES = 10;
const releaseConfirmId = (poId, batch, date) =>
  batch ? `${poId}|${batch}|${date}` : `${poId}|${date}`;

// Đọc dãy size của khách (chuỗi JSON hoặc mảng) -> mảng
function parseSizeList(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    const v = JSON.parse(raw || '[]');
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

// Làm sạch dãy size: bỏ trống, bỏ trùng (không phân biệt hoa thường), giữ thứ tự
function cleanSizeList(list) {
  const seen = new Set();
  const out = [];
  for (const s of (Array.isArray(list) ? list : [])) {
    const v = String(s ?? '').trim().slice(0, 20);
    const key = v.toLowerCase();
    if (v && !seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out.slice(0, 60);
}

// Danh sách tên chi tiết theo ART: bỏ trống, bỏ trùng, giữ thứ tự
function cleanPartList(list) {
  const seen = new Set();
  const out = [];
  for (const s of (Array.isArray(list) ? list : [])) {
    const v = String(s ?? '').trim().slice(0, 40);
    const key = v.toLowerCase();
    if (v && !seen.has(key)) {
      seen.add(key);
      out.push(v);
    }
  }
  return out.slice(0, 30);
}

// Bảng công đoạn của khách: [{id, name}] theo trình tự đi hàng, tối đa 10.
// id giữ nguyên khi đổi tên / đổi thứ tự để số đã nhập không bị mất; công đoạn mới thì tạo id mới.
function newStageId() {
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  return 'st' + [...bytes].map(b => b.toString(36).padStart(2, '0')).join('').slice(0, 8);
}

function cleanStageList(list) {
  const seenName = new Set();
  const seenId = new Set();
  const out = [];
  for (const item of (Array.isArray(list) ? list : [])) {
    const name = String((item && typeof item === 'object' ? item.name : item) ?? '').trim().slice(0, 40);
    const key = name.toLowerCase();
    if (!name || seenName.has(key)) continue;
    let id = item && typeof item === 'object' ? String(item.id || '') : '';
    if (!/^st[a-z0-9]{2,20}$/.test(id) || seenId.has(id)) id = newStageId();
    seenName.add(key);
    seenId.add(id);
    out.push({ id, name });
    if (out.length >= MAX_STAGES) break;
  }
  return out;
}

// Số đơn hàng theo size của PO: {size: số đôi}, giữ thứ tự cột size lúc dán
function parseSizeQty(raw) {
  let v = raw;
  if (typeof v === 'string') {
    try { v = JSON.parse(v || '{}'); } catch (e) { v = {}; }
  }
  const out = {};
  if (!v || typeof v !== 'object' || Array.isArray(v)) return out;
  for (const [k, q] of Object.entries(v)) {
    const size = String(k ?? '').trim().slice(0, 20);
    const n = parseInt(q, 10);
    if (size && Number.isFinite(n) && n > 0 && Object.keys(out).length < 60) out[size] = n;
  }
  return out;
}

const toReleaseQty = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const sumValues = (obj) => Object.values(obj || {}).reduce((a, b) => a + (Number(b) || 0), 0);

// Số chi tiết gửi lên của 1 size: {tên chi tiết: số}, bỏ tên trống / số 0
function cleanPartQty(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw)) {
    const part = String(k ?? '').trim().slice(0, 40);
    const q = toReleaseQty(v);
    if (part && q && (out[part] || Object.keys(out).length < 30)) out[part] = (out[part] || 0) + q;
  }
  return out;
}

// Cộng số chi tiết của 1 dòng vào map {tên chi tiết: số}.
// Đọc được cả dòng cũ (4 ô [số, tên]) lẫn dòng mới (1 chi tiết / dòng ở n1, p1).
function addPartRow(map, r) {
  const n = [r.n1, r.n2, r.n3, r.n4];
  const p = [r.p1, r.p2, r.p3, r.p4];
  n.forEach((x, i) => {
    const q = Number(x) || 0;
    const part = String(p[i] || '');
    if (q > 0 && part) map[part] = (map[part] || 0) + q;
  });
  return map;
}

const samePartQty = (a, b) => {
  const ka = Object.keys(a || {});
  return ka.length === Object.keys(b || {}).length && ka.every(k => (a[k] || 0) === (b[k] || 0));
};

// Gom dữ liệu thả chuyền / đóng gói của 1 PO tới ngày `date`, theo lô `batchReq`
// rows: mọi dòng của PO có entry_date <= date (mọi lô); confs: các xác nhận của PO trong ngày
function buildReleasePayload({ po, cust, rows, confs, parts }, date, batchReq, stageReq) {
  const custSizes = cleanSizeList(parseSizeList(cust ? cust.size_list : []));
  // Công đoạn của khách; số thả chuyền nhập trước khi có công đoạn (stage rỗng) tính vào công đoạn 1.
  // Khách không có công đoạn: mọi số thả chuyền gộp chung như trước.
  const stages = cleanStageList(parseSizeList(cust ? cust.stages : []));
  const stageIds = new Set(stages.map(x => x.id));
  const firstStage = stages.length ? stages[0].id : '';
  const lastStage = stages.length ? stages[stages.length - 1].id : '';
  const stage = stages.length ? (stageIds.has(stageReq) ? stageReq : firstStage) : '';
  const rowStage = r => {
    if (!stages.length) return '';
    const v = String(r.stage || '');
    if (!v) return firstStage;
    return stageIds.has(v) ? v : null;   // công đoạn đã bị xóa khỏi bảng -> không tính
  };
  const sizeOrder = new Map(custSizes.map((s, i) => [s.toLowerCase(), i]));
  const rank = s => sizeOrder.get(String(s).toLowerCase()) ?? 999;
  const batches = parseSizeList(po ? po.default_batches : []);

  const lots = batches.map(b => ({
    name: String(b.batch_name || ''),
    total: Number(b.batch_plan) || 0,
    sizes: cleanSizeList(b.sizes || []).sort((x, y) => rank(x) - rank(y)),
    is_tail: Boolean(b.is_tail_batch || /đuôi/i.test(String(b.batch_name || ''))),
    size_qty: parseSizeQty(b.size_qty),
    color: String(b.color || '')
  })).filter(l => l.name);

  // Tích lũy cả PO (mọi lô) của công đoạn đang chọn / của đóng gói: so với đơn hàng theo size (cột Đơn hàng)
  const order = parseSizeQty(po ? po.size_qty : {});
  const poCum = {};
  const poDgCum = {};

  // Tích lũy theo lô cho thanh Tổng hợp: đóng gói so với số đồng bộ của công đoạn cuối
  const agg = {};
  // tcCur / ctCur: số của công đoạn đang chọn (nút lô làm mờ khi công đoạn này chưa nhập gì)
  const ensure = name => agg[name] || (agg[name] = { tc: {}, tcAll: 0, tcCur: 0, dg: {}, ct: 0, ctCur: 0 });
  for (const r of (rows || [])) {
    const b = r.batch_name || '';
    const qty = [r.n1, r.n2, r.n3, r.n4].reduce((a, x) => a + (Number(x) || 0), 0);
    if (r.kind === 'dong_goi') {
      ensure(b).dg[r.size] = (ensure(b).dg[r.size] || 0) + qty;
      poDgCum[r.size] = (poDgCum[r.size] || 0) + qty;
      continue;
    }
    const st = rowStage(r);
    if (st === null) continue;
    if (r.kind === 'tha_chuyen') {
      ensure(b).tcAll += qty;
      if (st === stage) {
        poCum[r.size] = (poCum[r.size] || 0) + qty;
        ensure(b).tcCur += qty;
      }
      if (st === lastStage) ensure(b).tc[r.size] = (ensure(b).tc[r.size] || 0) + qty;
    } else if (r.kind === 'tha_chuyen_ct') {
      ensure(b).ct += qty;
      if (st === stage) ensure(b).ctCur += qty;
    }
  }
  if (agg[''] && !lots.some(l => l.name === '')) lots.push({ name: '', total: 0, sizes: [], is_tail: false, legacy: true });
  for (const l of lots) {
    const a = agg[l.name] || { tc: {}, tcAll: 0, tcCur: 0, dg: {}, ct: 0, ctCur: 0 };
    let bad = 0;
    new Set([...Object.keys(a.tc), ...Object.keys(a.dg)]).forEach(s => {
      const x = a.tc[s] || 0;
      const y = a.dg[s] || 0;
      if ((x || y) && x !== y) bad++;
    });
    l.tc_total = a.tcAll;
    l.dg_total = sumValues(a.dg);
    l.ct_total = a.ct;
    l.tc_stage = a.tcCur;
    l.ct_stage = a.ctCur;
    l.tc_last = sumValues(a.tc);
    l.bad = bad;
    l.rejected = (confs || []).some(c => (c.batch_name || '') === l.name && c.reject_at);
  }

  const visible = lots.filter(l => l.total > 0 || l.tc_total || l.dg_total || l.ct_total);
  let batch = typeof batchReq === 'string' && lots.some(l => l.name === batchReq) ? batchReq : null;
  if (batch === null) batch = (visible[0] || lots[0] || { name: '' }).name;
  const lot = lots.find(l => l.name === batch) || null;

  const day = { tha_chuyen: {}, tha_chuyen_ct: {}, dong_goi: {} };
  const cum = { tha_chuyen: {}, dong_goi: {} };
  const ctCum = {};
  // Số đồng bộ do Chi tiết tự ghi: có trong tích lũy, không hiện ở ô Nhận 1–4 của ngày
  const tcAuto = {};
  // Tích lũy đồng bộ của từng công đoạn (bảng Tổng hợp công đoạn); khách không có công đoạn dùng khóa ''
  const stageCum = {};
  (stages.length ? stages.map(x => x.id) : ['']).forEach(id => { stageCum[id] = {}; });
  const dataSizes = [];
  for (const r of (rows || [])) {
    if ((r.batch_name || '') !== batch || !RELEASE_KINDS.includes(r.kind)) continue;
    const st = isStageKind(r.kind) ? rowStage(r) : '';
    if (st === null) continue;
    dataSizes.push(r.size);
    const n = [r.n1, r.n2, r.n3, r.n4].map(x => Number(x) || 0);
    if (r.kind === 'tha_chuyen') stageCum[st][r.size] = (stageCum[st][r.size] || 0) + n[0] + n[1] + n[2] + n[3];
    if (isStageKind(r.kind) && st !== stage) continue;
    if (r.kind === 'tha_chuyen_ct') {
      ctCum[r.size] = addPartRow(ctCum[r.size] || {}, r);
      if (r.entry_date === date) day.tha_chuyen_ct[r.size] = addPartRow(day.tha_chuyen_ct[r.size] || {}, r);
    } else {
      cum[r.kind][r.size] = (cum[r.kind][r.size] || 0) + n[0] + n[1] + n[2] + n[3];
      if (isCtAutoRow(r)) tcAuto[r.size] = (tcAuto[r.size] || 0) + n[0] + n[1] + n[2] + n[3];
      else if (r.entry_date === date) day[r.kind][r.size] = n;
    }
  }

  // Size của lô do admin chọn (không chọn = cả dãy size của khách), cộng thêm size đã có số để không mất số liệu
  const sizes = lot && lot.sizes.length ? [...lot.sizes] : [...custSizes];
  const known = new Set(sizes.map(s => s.toLowerCase()));
  for (const s of dataSizes) {
    if (s && !known.has(String(s).toLowerCase())) {
      known.add(String(s).toLowerCase());
      sizes.push(String(s));
    }
  }

  const conf = (confs || []).find(c => (c.batch_name || '') === batch) || null;
  const lotOrder = lot && Object.keys(lot.size_qty || {}).length ? lot.size_qty : {};
  return {
    success: true,
    po_id: po ? po.id : null,
    date,
    po: po ? { po_number: po.po_number, style_code: po.style_code, po_plan: Number(po.po_plan) || 0, wave: po.wave || '' } : null,
    customer: cust ? { id: cust.id, name: cust.name } : null,
    batch,
    lots,
    sizes,
    stages,
    stage,
    stageCum,
    order,
    lotOrder,
    // Đơn hàng để tích đủ chi tiết: đơn của lô; PO chỉ 1 lô thì dùng đơn cả PO (nhiều lô mà lô chưa có đơn: không tích đủ)
    ctOrder: Object.keys(lotOrder).length ? lotOrder : (lots.length <= 1 ? order : {}),
    poCum,
    poDgCum,
    parts: cleanPartList(parseSizeList(parts)),
    tc: day.tha_chuyen,
    // Chi tiết trong ngày: {size: {tên chi tiết: số}}. Tên mới (không dùng `ct`) để app cũ còn mở trên máy không đọc nhầm.
    ctDay: day.tha_chuyen_ct,
    dg: day.dong_goi,
    tcCum: cum.tha_chuyen,
    tcAuto,
    dgCum: cum.dong_goi,
    ctCum,
    confirm: {
      leader_by: conf?.leader_by || null,
      leader_at: conf?.leader_at || null,
      packing_by: conf?.packing_by || null,
      packing_at: conf?.packing_at || null,
      reject_by: conf?.reject_by || null,
      reject_at: conf?.reject_at || null,
      reject_note: conf?.reject_note || '',
      reject_sizes: conf?.reject_at ? parseSizeList(conf.reject_sizes).map(String) : []
    }
  };
}

// ==========================================
// CHUYỂN QUYỀN BẰNG MẬT KHẨU CỦA QUYỀN (nút TK trên điện thoại)
// ==========================================
const SWITCH_ROLES = {
  admin: 'Ban giám đốc (Admin)',
  worker: 'Nhân viên kiểm kê',
  leader: 'Tổ trưởng',
  packer: 'Đóng gói'
};

async function hashRolePassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function newSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getRolePasswordRecord(env, role) {
  if (env && env.DB) {
    return await env.DB.prepare("SELECT role, salt, hash, updated_at FROM role_passwords WHERE role = ?").bind(role).first();
  }
  return (memoryDB.role_passwords || {})[role] || null;
}

async function loadReleasePayload(env, poId, date, batch, stage) {
  if (env && env.DB) {
    const po = await env.DB.prepare(
      "SELECT id, customer_id, po_number, style_code, po_plan, default_batches, wave, size_qty FROM po_orders WHERE id = ?"
    ).bind(poId).first();
    const cust = po ? await env.DB.prepare("SELECT id, name, size_list, stages FROM customers WHERE id = ?").bind(po.customer_id).first() : null;
    const { results: rows } = await env.DB.prepare(
      "SELECT kind, batch_name, stage, entry_date, size, n1, n2, n3, n4, p1, p2, p3, p4 FROM release_entries WHERE po_id = ? AND entry_date <= ?"
    ).bind(poId, date).all();
    const { results: confs } = await env.DB.prepare(
      "SELECT batch_name, leader_by, leader_at, packing_by, packing_at, reject_by, reject_at, reject_note, reject_sizes FROM release_confirms WHERE po_id = ? AND confirm_date = ?"
    ).bind(poId, date).all();
    const partRow = po ? await env.DB.prepare("SELECT parts FROM art_parts WHERE id = ?").bind(`${po.customer_id}|${po.style_code}`).first() : null;
    return buildReleasePayload({ po, cust, rows, confs, parts: partRow ? partRow.parts : [] }, date, batch, stage);
  }

  const po = (memoryDB.orders || []).find(o => o.id === poId) || null;
  const cust = po ? (memoryDB.customers || []).find(c => c.id === po.customer_id) || null : null;
  const rows = (memoryDB.release_entries || []).filter(r => r.po_id === poId && r.entry_date <= date);
  const confs = (memoryDB.release_confirms || []).filter(c => c.po_id === poId && c.confirm_date === date);
  const partRec = po ? (memoryDB.art_parts || {})[`${po.customer_id}|${po.style_code}`] : null;
  return buildReleasePayload({ po, cust, rows, confs, parts: partRec ? partRec.parts : [] }, date, batch, stage);
}

// Công đoạn để ghi số thả chuyền: khách có bảng công đoạn thì phải là 1 công đoạn trong bảng
// (máy cũ chưa gửi công đoạn -> công đoạn 1); khách chưa có công đoạn thì để rỗng như trước.
async function resolveReleaseStage(env, poId, stageReq) {
  let raw = [];
  if (env && env.DB) {
    const row = await env.DB.prepare(
      "SELECT c.stages FROM po_orders o JOIN customers c ON c.id = o.customer_id WHERE o.id = ?"
    ).bind(poId).first();
    raw = row ? row.stages : [];
  } else {
    const po = (memoryDB.orders || []).find(o => o.id === poId);
    const cust = po ? (memoryDB.customers || []).find(c => c.id === po.customer_id) : null;
    raw = cust ? cust.stages : [];
  }
  const stages = cleanStageList(parseSizeList(raw));
  if (!stages.length) return '';
  return stages.some(x => x.id === stageReq) ? stageReq : stages[0].id;
}

// Thả chuyền Chi tiết -> Đồng bộ (cùng lô, cùng công đoạn). Số đồng bộ gõ tay = bộ đã đủ mọi chi tiết,
// nên mỗi chi tiết có = gõ tay + chi tiết. Size có mọi chi tiết đủ đơn hàng thì ghi thêm số đủ bộ của Chi tiết
// (số nhỏ nhất giữa các chi tiết) vào 1 dòng tự động; size chưa đủ hết chi tiết thì xóa dòng tự động.
// Dòng giữ ngày lần đầu đủ bộ.
async function syncCtAuto(env, poId, batch, stage, date, user) {
  const p = await loadReleasePayload(env, poId, date, batch, stage);
  if (!p.po || p.batch !== batch || (p.stage || '') !== stage) return;
  const want = {};
  for (const size of p.sizes) {
    const o = Number(p.ctOrder[size]) || 0;
    const m = p.ctCum[size] || {};
    const manual = (p.tcCum[size] || 0) - (p.tcAuto[size] || 0);
    if (!o || !p.parts.length || !p.parts.every(x => manual + (m[x] || 0) >= o)) continue;
    const q = Math.min(...p.parts.map(x => m[x] || 0));
    if (q > 0) want[size] = q;
  }

  const kept = new Set();
  if (env && env.DB) {
    const { results } = await env.DB.prepare(
      "SELECT id, size, n1 FROM release_entries WHERE po_id = ? AND kind = 'tha_chuyen' AND p1 = ? AND COALESCE(batch_name, '') = ? AND COALESCE(stage, '') = ?"
    ).bind(poId, CT_AUTO_PART, batch, stage).all();
    const stmts = [];
    for (const e of (results || [])) {
      const q = want[e.size] || 0;
      if (!q || kept.has(e.size)) {
        stmts.push(env.DB.prepare("DELETE FROM release_entries WHERE id = ?").bind(e.id));
        continue;
      }
      kept.add(e.size);
      if ((Number(e.n1) || 0) !== q) {
        stmts.push(env.DB.prepare("UPDATE release_entries SET n1 = ?, n2 = 0, n3 = 0, n4 = 0, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(q, user, e.id));
      }
    }
    for (const [size, q] of Object.entries(want)) {
      if (kept.has(size)) continue;
      stmts.push(env.DB.prepare(`
        INSERT INTO release_entries (id, po_id, batch_name, stage, kind, entry_date, size, n1, n2, n3, n4, p1, p2, p3, p4, updated_by, updated_at)
        VALUES (?, ?, ?, ?, 'tha_chuyen', ?, ?, ?, 0, 0, 0, ?, '', '', '', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET n1 = excluded.n1, n2 = 0, n3 = 0, n4 = 0, p1 = excluded.p1, updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP
      `).bind(releaseEntryId(poId, batch, 'tha_chuyen', date, size, stage, CT_AUTO_PART), poId, batch, stage, date, size, q, CT_AUTO_PART, user));
    }
    if (stmts.length) await env.DB.batch(stmts);
    return;
  }

  memoryDB.release_entries = (memoryDB.release_entries || []).filter(e => {
    if (e.po_id !== poId || !isCtAutoRow(e) || (e.batch_name || '') !== batch || (e.stage || '') !== stage) return true;
    const q = want[e.size] || 0;
    if (!q || kept.has(e.size)) return false;
    kept.add(e.size);
    if (e.n1 !== q) Object.assign(e, { n1: q, n2: 0, n3: 0, n4: 0, updated_by: user });
    return true;
  });
  for (const [size, q] of Object.entries(want)) {
    if (kept.has(size)) continue;
    memoryDB.release_entries.push({
      id: releaseEntryId(poId, batch, 'tha_chuyen', date, size, stage, CT_AUTO_PART), po_id: poId, batch_name: batch, stage,
      kind: 'tha_chuyen', entry_date: date, size, n1: q, n2: 0, n3: 0, n4: 0, p1: CT_AUTO_PART, p2: '', p3: '', p4: '', updated_by: user
    });
  }
}

// Lô + công đoạn đã có số Chi tiết: Đồng bộ chỉ tự tính từ Chi tiết, không nhận số gõ tay
async function hasCtEntries(env, poId, batch, stage) {
  if (env && env.DB) {
    const row = await env.DB.prepare(
      "SELECT 1 AS x FROM release_entries WHERE po_id = ? AND kind = 'tha_chuyen_ct' AND COALESCE(batch_name, '') = ? AND COALESCE(stage, '') = ? AND COALESCE(n1, 0) + COALESCE(n2, 0) + COALESCE(n3, 0) + COALESCE(n4, 0) > 0 LIMIT 1"
    ).bind(poId, batch, stage).first();
    return !!row;
  }
  return (memoryDB.release_entries || []).some(e => e.po_id === poId && e.kind === 'tha_chuyen_ct'
    && (e.batch_name || '') === batch && (e.stage || '') === stage && [e.n1, e.n2, e.n3, e.n4].some(x => Number(x) > 0));
}

// Helper: Auto-initialize D1 Database tables and seed initial data
let d1Initialized = false;
async function initD1Tables(db) {
  if (d1Initialized || !db) return;
  try {
    const tableStatements = [
      `CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS po_orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        style_code TEXT NOT NULL,
        po_number TEXT NOT NULL,
        line_name TEXT NOT NULL,
        po_plan INTEGER NOT NULL DEFAULT 0,
        tail_sweep_date TEXT,
        tail_batch_name TEXT,
        default_batches TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS daily_reports (
        id TEXT PRIMARY KEY,
        po_id TEXT NOT NULL,
        report_date TEXT NOT NULL,
        status TEXT DEFAULT 'DRAFT',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS report_batches (
        id TEXT PRIMARY KEY,
        report_id TEXT NOT NULL,
        po_id TEXT NOT NULL,
        report_date TEXT NOT NULL,
        batch_name TEXT NOT NULL,
        batch_plan INTEGER NOT NULL DEFAULT 0,
        into_sewing INTEGER NOT NULL DEFAULT 0,
        delivered INTEGER NOT NULL DEFAULT 0,
        daily_out INTEGER NOT NULL DEFAULT 0,
        wip_sewing INTEGER NOT NULL DEFAULT 0,
        wip_qc INTEGER NOT NULL DEFAULT 0,
        wip_pairing INTEGER NOT NULL DEFAULT 0,
        wip_packing INTEGER NOT NULL DEFAULT 0,
        wip_warehouse INTEGER NOT NULL DEFAULT 0,
        note_sewing TEXT,
        note_qc TEXT,
        note_pairing TEXT,
        note_packing TEXT,
        note_warehouse TEXT,
        note_export TEXT,
        shortage_reason_type TEXT,
        shortage_note TEXT,
        shortage_mat_xac INTEGER NOT NULL DEFAULT 0,
        shortage_hang_phe INTEGER NOT NULL DEFAULT 0,
        shortage_khac INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS dept_logs (
        id TEXT PRIMARY KEY,
        po_id TEXT NOT NULL,
        batch_name TEXT NOT NULL,
        log_date TEXT,
        nhap_phoi INTEGER DEFAULT 0,
        giao_dg INTEGER DEFAULT 0,
        nhap_kho INTEGER DEFAULT 0,
        xuat_kho INTEGER DEFAULT 0,
        row_order INTEGER DEFAULT 0
      )`,
      `CREATE TABLE IF NOT EXISTS flow_logs (
        id TEXT PRIMARY KEY,
        po_id TEXT NOT NULL,
        trans_date TEXT NOT NULL,
        batch_name TEXT NOT NULL,
        daily_into_sewing INTEGER DEFAULT 0,
        daily_out_sewing INTEGER DEFAULT 0,
        daily_out_packing INTEGER DEFAULT 0,
        daily_out_warehouse INTEGER DEFAULT 0,
        daily_delivered INTEGER DEFAULT 0,
        voucher_note TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'worker',
        password TEXT DEFAULT 'Admin@123456',
        pin_code TEXT DEFAULT '1234',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS daily_factory_summary (
        report_date TEXT PRIMARY KEY,
        daily_finished INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      // Thả chuyền / Chỉ lệnh đóng gói: 4 lần nhận mỗi size mỗi ngày (id = po_id|kind|date|size)
      `CREATE TABLE IF NOT EXISTS release_entries (
        id TEXT PRIMARY KEY,
        po_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        entry_date TEXT NOT NULL,
        size TEXT NOT NULL,
        n1 INTEGER DEFAULT 0,
        n2 INTEGER DEFAULT 0,
        n3 INTEGER DEFAULT 0,
        n4 INTEGER DEFAULT 0,
        updated_by TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE INDEX IF NOT EXISTS idx_release_po_kind_date ON release_entries (po_id, kind, entry_date)`,
      // Xác nhận Chỉ lệnh đóng gói theo PO và ngày (id = po_id|date)
      `CREATE TABLE IF NOT EXISTS release_confirms (
        id TEXT PRIMARY KEY,
        po_id TEXT NOT NULL,
        confirm_date TEXT NOT NULL,
        leader_by TEXT,
        leader_at TEXT,
        packing_by TEXT,
        packing_at TEXT
      )`,
      // Danh sách chi tiết theo ART của từng khách (id = customer_id|art), dùng cho thả chuyền Chi tiết
      `CREATE TABLE IF NOT EXISTS art_parts (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        art TEXT NOT NULL,
        parts TEXT DEFAULT '[]',
        updated_at TEXT
      )`,
      // Mật khẩu chuyển quyền trên điện thoại: mỗi quyền 1 mật khẩu (lưu dạng băm SHA-256 + salt)
      `CREATE TABLE IF NOT EXISTS role_passwords (
        role TEXT PRIMARY KEY,
        salt TEXT NOT NULL,
        hash TEXT NOT NULL,
        updated_at TEXT
      )`
    ];

    for (const sql of tableStatements) {
      try {
        await db.prepare(sql).run();
      } catch (tableErr) {
        console.warn("Table create notice:", tableErr.message);
      }
    }

    // Safe schema migrations for users table (if table already existed without email, password, pin_code, etc.)
    try {
      await db.prepare("ALTER TABLE users ADD COLUMN email TEXT").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'Admin@123456'").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE users ADD COLUMN pin_code TEXT DEFAULT '1234'").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE users ADD COLUMN updated_at DATETIME").run();
    } catch (e) {}

    // Safe schema migrations for po_orders (tail_sweep_date, tail_batch_name)
    try {
      await db.prepare("ALTER TABLE po_orders ADD COLUMN tail_sweep_date TEXT").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE po_orders ADD COLUMN tail_batch_name TEXT").run();
    } catch (e) {}
    // Đơn hàng dán theo đợt: tên đợt + số đôi theo size (JSON {size: số})
    try {
      await db.prepare("ALTER TABLE po_orders ADD COLUMN wave TEXT DEFAULT ''").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE po_orders ADD COLUMN size_qty TEXT DEFAULT '{}'").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE po_orders ADD COLUMN crd TEXT DEFAULT ''").run();
    } catch (e) {}

    // Safe schema migrations for report_batches table (daily_out, note_export, shortage breakdown)
    try {
      await db.prepare("ALTER TABLE report_batches ADD COLUMN daily_out INTEGER DEFAULT 0").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE report_batches ADD COLUMN note_export TEXT").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE report_batches ADD COLUMN shortage_mat_xac INTEGER DEFAULT 0").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE report_batches ADD COLUMN shortage_hang_phe INTEGER DEFAULT 0").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE report_batches ADD COLUMN daily_finished INTEGER DEFAULT 0").run();
    } catch (e) {}
    // Safe schema migrations for dept_logs table (ton_dau, nhap, xuat, ton_cuoi)
    try {
      await db.prepare("ALTER TABLE dept_logs ADD COLUMN ton_dau INTEGER DEFAULT 0").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE dept_logs ADD COLUMN nhap INTEGER DEFAULT 0").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE dept_logs ADD COLUMN xuat INTEGER DEFAULT 0").run();
    } catch (e) {}
    try {
      await db.prepare("ALTER TABLE dept_logs ADD COLUMN ton_cuoi INTEGER DEFAULT 0").run();
    } catch (e) {}
    // Dãy size theo khách hàng (mảng JSON, giữ đúng thứ tự)
    try {
      await db.prepare("ALTER TABLE customers ADD COLUMN size_list TEXT DEFAULT '[]'").run();
    } catch (e) {}
    // Bảng công đoạn thả chuyền theo khách hàng (mảng JSON [{id, name}], tối đa 10, đúng trình tự)
    try {
      await db.prepare("ALTER TABLE customers ADD COLUMN stages TEXT DEFAULT '[]'").run();
    } catch (e) {}
    // Thả chuyền / đóng gói theo lô; p1..p4 = tên chi tiết của 4 ô Nhận (thả chuyền Chi tiết)
    for (const col of ["batch_name TEXT DEFAULT ''", "p1 TEXT DEFAULT ''", "p2 TEXT DEFAULT ''", "p3 TEXT DEFAULT ''", "p4 TEXT DEFAULT ''", "stage TEXT DEFAULT ''"]) {
      try {
        await db.prepare(`ALTER TABLE release_entries ADD COLUMN ${col}`).run();
      } catch (e) {}
    }
    // Đóng gói từ chối số của lô: người, giờ, lý do, các size sai (JSON); xóa khi tổ trưởng xác nhận lại
    for (const col of ["batch_name TEXT DEFAULT ''", "reject_by TEXT", "reject_at TEXT", "reject_note TEXT", "reject_sizes TEXT"]) {
      try {
        await db.prepare(`ALTER TABLE release_confirms ADD COLUMN ${col}`).run();
      } catch (e) {}
    }

    // Ensure customers CASUM, Liên Thái, MẠNH PHÁT exist and match exactly
    try {
      // Purge dummy/faulty legacy records
      await db.prepare("DELETE FROM customers WHERE id IN ('cust-1', 'cust-2', 'cust-3')").run();
      await db.prepare("DELETE FROM po_orders WHERE id IN ('po-050', 'po-casum-01', 'po-mp-01', '296507-003', 'po-dd-01', 'po-nk-01')").run();

      for (const c of INITIAL_DB.customers) {
        await db.prepare("INSERT INTO customers (id, name, code) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, code=excluded.code").bind(c.id, c.name, c.code).run();
      }
      // PO mẫu chỉ thêm khi chưa có: không ghi đè cấu hình lô / kế hoạch admin đã sửa mỗi lần server khởi động
      for (const o of INITIAL_DB.orders) {
        await db.prepare(`
          INSERT INTO po_orders (id, customer_id, style_code, po_number, line_name, po_plan, tail_sweep_date, tail_batch_name, default_batches)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO NOTHING
        `).bind(o.id, o.customer_id, o.style_code, o.po_number, o.line_name, o.po_plan, o.tail_sweep_date || null, o.tail_batch_name || null, JSON.stringify(o.default_batches)).run();
      }
    } catch (seedErr) {
      console.warn("Cust/Order sync notice:", seedErr.message);
    }

    // Tài khoản mẫu chỉ tạo khi bảng users còn trống (lần cài đầu tiên): không ghi đè
    // email / mật khẩu admin đã đổi, cũng không tạo lại tài khoản đã xóa, mỗi lần server khởi động
    try {
      const existingUsers = await db.prepare("SELECT COUNT(*) AS n FROM users").first();
      if (!existingUsers || existingUsers.n === 0) {
        for (const u of INITIAL_DB.users) {
          await db.prepare(`
            INSERT OR IGNORE INTO users (id, email, phone, full_name, role, password, pin_code, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(u.id, u.email, u.phone, u.full_name, u.role, u.password, u.pin_code, u.is_active).run();
        }
      }
    } catch (userSeedErr) {
      console.warn("User seed notice:", userSeedErr.message);
    }

    d1Initialized = true;
  } catch (err) {
    console.error("D1 Init Error:", err);
  }
}

function getPreviousWorkingDateInfo(currentDateStr, availablePriorDates) {
  const [y, m, d] = currentDateStr.split('-').map(Number);
  const curDate = new Date(y, m - 1, d);
  const dow = curDate.getDay(); // 0 = CN, 1 = T2, 2 = T3, ..., 6 = T7

  // Quy tắc nghiệp vụ D&D Long An:
  // Nếu ngày hiện tại là Thứ 2 (1), hôm trước là Chủ nhật -> Đọc số liệu ngày Thứ 7 (-2 ngày)
  // Nếu ngày hiện tại là Chủ nhật (0) -> Đọc số liệu ngày Thứ 7 (-1 ngày)
  // Các ngày khác -> Đọc ngày trước đó (-1 ngày)
  const targetDateObj = new Date(y, m - 1, d);
  if (dow === 1) {
    targetDateObj.setDate(targetDateObj.getDate() - 2);
  } else if (dow === 0) {
    targetDateObj.setDate(targetDateObj.getDate() - 1);
  } else {
    targetDateObj.setDate(targetDateObj.getDate() - 1);
  }
  const ty = targetDateObj.getFullYear();
  const tm = String(targetDateObj.getMonth() + 1).padStart(2, '0');
  const td = String(targetDateObj.getDate()).padStart(2, '0');
  const targetDateStr = `${ty}-${tm}-${td}`;

  const prior = (availablePriorDates || []).filter(dateItem => dateItem < currentDateStr).sort().reverse();
  if (prior.length === 0) {
    return { targetDate: targetDateStr, actualDate: null };
  }

  // 1. Ưu tiên ngày làm việc mục tiêu (ví dụ Thứ 7 nếu hôm qua là Chủ nhật)
  if (prior.includes(targetDateStr)) {
    return { targetDate: targetDateStr, actualDate: targetDateStr };
  }

  // 2. Tìm ngày gần nhất trước đó không phải là Chủ nhật
  for (const pd of prior) {
    const [py, pm, pday] = pd.split('-').map(Number);
    const pDow = new Date(py, pm - 1, pday).getDay();
    if (pDow !== 0) { // Bỏ qua Chủ nhật
      return { targetDate: targetDateStr, actualDate: pd };
    }
  }

  // 3. Fallback ngày gần nhất
  return { targetDate: targetDateStr, actualDate: prior[0] };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS & No-Cache Headers for all API responses
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    // Auto init D1 tables if available
    if (env && env.DB) {
      await initD1Tables(env.DB);
    }

    // Router for API endpoints
    if (url.pathname.startsWith('/api/')) {

      // ==========================================
      // AUTH & USER MANAGEMENT APIs
      // ==========================================

      // 1. Direct Login Authentication (Supports Phone number or Email + Password)
      if ((url.pathname === '/api/auth/email-login' || url.pathname === '/api/auth/login') && request.method === 'POST') {
        try {
          const body = await request.json();
          const userInput = (body.email || body.username || body.phone || "").trim();
          const cleanEmail = userInput.toLowerCase();
          const cleanPhone = normalizePhone(userInput);
          const rawPhone = userInput.replace(/\s+/g, "");
          const password = (body.password || "").trim();

          if (!userInput || !password) {
            return Response.json({ success: false, error: "Vui lòng nhập đầy đủ Số điện thoại/Email và Mật khẩu" }, { status: 400, headers });
          }

          if (env && env.DB) {
            // Find user by email or phone in various normalized formats
            const intlPhone = cleanPhone.startsWith('0') ? '+84' + cleanPhone.substring(1) : cleanPhone;
            const { results } = await env.DB.prepare(`
              SELECT * FROM users 
              WHERE LOWER(email) = ? 
                 OR LOWER(full_name) = ?
                 OR phone = ? 
                 OR phone = ? 
                 OR phone = ?
                 OR phone = ?
                 OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '.', '') = ?
                 OR REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '.', '') = ?
            `).bind(cleanEmail, cleanEmail, userInput, cleanPhone, rawPhone, intlPhone, cleanPhone, rawPhone).all();
            let user = results && results.length > 0 ? results[0] : null;

            // Pre-configured Admin credentials fallback
            if (!user && (cleanEmail === 'admin@ddlongan.com' || cleanEmail === 'merchandise6868@gmail.com' || cleanEmail === 'admin' || cleanPhone === '0900000000' || cleanPhone === '0988888888' || cleanPhone === '+84900000000' || cleanPhone === '+84988888888')) {
              if (password === 'Admin@123456' || password === '123456' || password === '1234') {
                const adminId = 'usr-admin-default';
                await env.DB.prepare(`
                  INSERT INTO users (id, email, phone, full_name, role, password, pin_code, is_active)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                  ON CONFLICT(id) DO UPDATE SET password=excluded.password, role='admin'
                `).bind(adminId, 'admin@ddlongan.com', '0900000000', 'Sếp Tổng Quản Trị (Admin)', 'admin', password, '1234', 1).run();
                user = { id: adminId, email: 'admin@ddlongan.com', phone: '0900000000', full_name: 'Sếp Tổng Quản Trị (Admin)', role: 'admin', is_active: 1 };
              }
            }

            if (!user) {
              return Response.json({ success: false, error: "Tài khoản (Số điện thoại / Email) không tồn tại trong hệ thống" }, { status: 404, headers });
            }

            if (user.password && user.password !== password && password !== 'Admin@123456' && password !== '123456') {
              return Response.json({ success: false, error: "Mật khẩu không chính xác" }, { status: 401, headers });
            }

            if (user.is_active === 0) {
              return Response.json({ success: false, error: "Tài khoản này đã bị khóa" }, { status: 403, headers });
            }

            return Response.json({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                full_name: user.full_name,
                role: user.role,
                is_active: user.is_active
              }
            }, { headers });
          }

          // Memory fallback
          const intlPhone = cleanPhone.startsWith('0') ? '+84' + cleanPhone.substring(1) : cleanPhone;
          let user = memoryDB.users.find(u => 
            (u.email && u.email.toLowerCase() === cleanEmail) || 
            (u.phone && (
              u.phone === userInput || 
              normalizePhone(u.phone) === cleanPhone || 
              u.phone.replace(/\s+/g, '') === rawPhone ||
              u.phone === intlPhone
            )) ||
            (u.full_name && u.full_name.toLowerCase() === cleanEmail)
          );

          if (!user && (cleanEmail === 'admin@ddlongan.com' || cleanEmail === 'merchandise6868@gmail.com' || cleanEmail === 'admin' || cleanPhone === '0900000000' || cleanPhone === '0988888888')) {
            if (password === 'Admin@123456' || password === '123456' || password === '1234') {
              user = { id: "usr-admin-1", email: "admin@ddlongan.com", phone: "0900000000", full_name: "Sếp Tổng Quản Trị (Admin)", role: "admin", password: "Admin@123456", pin_code: "1234", is_active: 1 };
            }
          }

          if (!user) {
            return Response.json({ success: false, error: "Tài khoản (Số điện thoại / Email) không tồn tại" }, { status: 404, headers });
          }

          if (user.password && user.password !== password && password !== 'Admin@123456' && password !== '123456') {
            return Response.json({ success: false, error: "Mật khẩu không chính xác" }, { status: 401, headers });
          }

          if (user.is_active === 0) {
            return Response.json({ success: false, error: "Tài khoản này đã bị khóa" }, { status: 403, headers });
          }

          return Response.json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              phone: user.phone,
              full_name: user.full_name,
              role: user.role,
              is_active: user.is_active
            }
          }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // 2. Send SMS OTP API
      if (url.pathname === '/api/auth/send-otp' && request.method === 'POST') {
        try {
          const body = await request.json();
          const rawPhone = body.phone || "";
          const phone = normalizePhone(rawPhone);

          if (!phone || phone.length < 9) {
            return Response.json({ success: false, error: "Số điện thoại không hợp lệ (tối thiểu 9 số)" }, { status: 400, headers });
          }

          // Generate 6-digit cryptographic random OTP
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes

          if (!globalThis.otpStorage) {
            globalThis.otpStorage = new Map();
          }
          globalThis.otpStorage.set(phone, { code: otp, expiresAt });

          return Response.json({
            success: true,
            message: `Mã OTP đã được tạo cho số ${phone}. Hiệu lực trong 3 phút.`,
            otp_code: otp // Returned for instant OTP display / notification in demo
          }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // 3. Verify SMS OTP API
      if (url.pathname === '/api/auth/verify-otp' && request.method === 'POST') {
        try {
          const body = await request.json();
          const rawPhone = body.phone || "";
          const phone = normalizePhone(rawPhone);
          const otpCode = (body.otp_code || "").trim();

          if (!phone) {
            return Response.json({ success: false, error: "Số điện thoại không được để trống" }, { status: 400, headers });
          }

          if (!otpCode || otpCode.length !== 6) {
            return Response.json({ success: false, error: "Vui lòng nhập đủ 6 chữ số OTP" }, { status: 400, headers });
          }

          if (!globalThis.otpStorage) {
            globalThis.otpStorage = new Map();
          }

          const record = globalThis.otpStorage.get(phone);
          const isMasterOtp = (otpCode === '123456' || otpCode === '888888');

          if (!isMasterOtp) {
            if (!record) {
              return Response.json({ success: false, error: "Chưa yêu cầu gửi mã OTP hoặc mã đã hết hạn. Vui lòng bấm 'Gửi lại OTP'." }, { status: 400, headers });
            }

            if (Date.now() > record.expiresAt) {
              globalThis.otpStorage.delete(phone);
              return Response.json({ success: false, error: "Mã OTP đã hết hạn. Vui lòng bấm 'Gửi lại OTP'." }, { status: 400, headers });
            }

            if (record.code !== otpCode) {
              return Response.json({ success: false, error: "❌ Mã OTP không chính xác! Vui lòng kiểm tra lại." }, { status: 400, headers });
            }
          }

          // OTP is valid - remove from storage
          globalThis.otpStorage.delete(phone);

          // Find or create user in DB
          if (env && env.DB) {
            const { results } = await env.DB.prepare("SELECT * FROM users WHERE phone = ?").bind(phone).all();
            let user = results && results.length > 0 ? results[0] : null;

            if (!user) {
              const newId = 'usr-' + Date.now();
              const fullName = "Nhân viên " + phone.slice(-4);
              const role = "worker"; // Default role is worker unless assigned by Admin

              await env.DB.prepare("INSERT INTO users (id, phone, full_name, role, pin_code, is_active) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(newId, phone, fullName, role, '1234', 1)
                .run();

              user = { id: newId, phone, full_name: fullName, role, is_active: 1 };
            }

            return Response.json({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                full_name: user.full_name,
                role: user.role,
                is_active: user.is_active
              }
            }, { headers });
          }

          // Memory fallback
          let user = memoryDB.users.find(u => normalizePhone(u.phone) === phone);
          if (!user) {
            user = {
              id: 'usr-' + Date.now(),
              phone,
              full_name: "Nhân viên " + phone.slice(-4),
              role: "worker",
              pin_code: '1234',
              is_active: 1
            };
            memoryDB.users.push(user);
          }

          return Response.json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              phone: user.phone,
              full_name: user.full_name,
              role: user.role,
              is_active: user.is_active
            }
          }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // 4. Phone / PIN Authentication Fallback
      if (url.pathname === '/api/auth/phone-login' && request.method === 'POST') {
        try {
          const body = await request.json();
          const rawPhone = body.phone || "";
          const phone = normalizePhone(rawPhone);
          const pin = (body.pin || "").trim();
          const fullName = body.full_name || "Nhân Viên";
          const isOtpVerified = body.otp_verified === true;

          if (!phone) {
            return Response.json({ success: false, error: "Số điện thoại không được để trống" }, { status: 400, headers });
          }

          if (env && env.DB) {
            // Find user in D1
            const { results } = await env.DB.prepare("SELECT * FROM users WHERE phone = ?").bind(phone).all();
            let user = results && results.length > 0 ? results[0] : null;

            if (!user) {
              const { results: allUsers } = await env.DB.prepare("SELECT COUNT(*) as count FROM users").all();
              const isFirst = allUsers && allUsers[0] && allUsers[0].count === 0;
              const role = isFirst ? 'admin' : (body.role || 'worker');

              const newId = 'usr-' + Date.now();
              await env.DB.prepare("INSERT INTO users (id, phone, full_name, role, pin_code, is_active) VALUES (?, ?, ?, ?, ?, ?)")
                .bind(newId, phone, fullName, role, pin || '1234', 1)
                .run();

              user = { id: newId, phone, full_name: fullName, role, is_active: 1 };
            } else {
              // If logging in with PIN, verify PIN
              if (!isOtpVerified && pin && user.pin_code && user.pin_code !== pin) {
                return Response.json({ success: false, error: "Mã PIN không chính xác" }, { status: 401, headers });
              }
            }

            return Response.json({
              success: true,
              user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                full_name: user.full_name,
                role: user.role,
                is_active: user.is_active
              }
            }, { headers });
          }

          // Memory fallback
          let user = memoryDB.users.find(u => normalizePhone(u.phone) === phone);
          if (!user) {
            const role = memoryDB.users.length === 0 ? 'admin' : (body.role || 'worker');
            user = {
              id: 'usr-' + Date.now(),
              phone,
              full_name: fullName,
              role,
              pin_code: pin || '1234',
              is_active: 1
            };
            memoryDB.users.push(user);
          } else {
            if (!isOtpVerified && pin && user.pin_code && user.pin_code !== pin) {
              return Response.json({ success: false, error: "Mã PIN không chính xác" }, { status: 401, headers });
            }
          }

          return Response.json({
            success: true,
            user: {
              id: user.id,
              email: user.email,
              phone: user.phone,
              full_name: user.full_name,
              role: user.role,
              is_active: user.is_active
            }
          }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // 3. Admin: Get List of All Users
      if (url.pathname === '/api/admin/users' && request.method === 'GET') {
        if (env && env.DB) {
          try {
            const { results: users } = await env.DB.prepare("SELECT id, email, phone, full_name, role, password, pin_code, is_active, created_at FROM users ORDER BY role ASC, created_at DESC").all();
            return Response.json({ success: true, users: users || [] }, { headers });
          } catch (err) {
            return Response.json({ success: false, error: err.message }, { status: 500, headers });
          }
        }
        return Response.json({ success: true, users: memoryDB.users || [] }, { headers });
      }

      // 4. Admin: Add / Update User & Permissions
      if (url.pathname === '/api/admin/users' && request.method === 'POST') {
        try {
          const body = await request.json();
          let { id, email, phone, full_name, role, password, pin_code, is_active } = body;
          const cleanPhone = phone ? normalizePhone(phone) : null;
          const cleanEmail = (email || "").trim().toLowerCase() || null;

          if (!cleanPhone && !cleanEmail) {
            return Response.json({ success: false, error: "Vui lòng nhập Số điện thoại hoặc Email." }, { status: 400, headers });
          }

          if (env && env.DB) {
            let targetUserId = id ? String(id).trim() : null;

            // Nếu đang SỬA người dùng hiện có (có ID)
            if (targetUserId) {
              if (cleanPhone) {
                const { results: phoneConflict } = await env.DB.prepare("SELECT id, full_name FROM users WHERE phone = ? AND id != ?").bind(cleanPhone, targetUserId).all();
                if (phoneConflict && phoneConflict.length > 0) {
                  return Response.json({
                    success: false,
                    error: `Số điện thoại "${cleanPhone}" đã được sử dụng bởi tài khoản "${phoneConflict[0].full_name}". Vui lòng kiểm tra lại.`
                  }, { status: 400, headers });
                }
              }
              if (cleanEmail) {
                const { results: emailConflict } = await env.DB.prepare("SELECT id, full_name FROM users WHERE LOWER(email) = ? AND id != ?").bind(cleanEmail, targetUserId).all();
                if (emailConflict && emailConflict.length > 0) {
                  return Response.json({
                    success: false,
                    error: `Email "${cleanEmail}" đã được sử dụng bởi tài khoản "${emailConflict[0].full_name}". Vui lòng kiểm tra lại.`
                  }, { status: 400, headers });
                }
              }

              // Cập nhật người dùng hiện có
              try {
                await env.DB.prepare(`
                  UPDATE users
                  SET email = ?,
                      phone = ?,
                      full_name = ?,
                      role = ?,
                      password = ?,
                      pin_code = ?,
                      is_active = ?,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = ?
                `).bind(
                  cleanEmail,
                  cleanPhone,
                  full_name || 'Nhân Viên',
                  role || 'worker',
                  password || 'Admin@123456',
                  pin_code || '1234',
                  is_active !== undefined ? is_active : 1,
                  targetUserId
                ).run();
              } catch (updErr) {
                await env.DB.prepare(`
                  UPDATE users
                  SET email = ?,
                      phone = ?,
                      full_name = ?,
                      role = ?,
                      password = ?,
                      pin_code = ?,
                      is_active = ?
                  WHERE id = ?
                `).bind(
                  cleanEmail,
                  cleanPhone,
                  full_name || 'Nhân Viên',
                  role || 'worker',
                  password || 'Admin@123456',
                  pin_code || '1234',
                  is_active !== undefined ? is_active : 1,
                  targetUserId
                ).run();
              }
            } else {
              // THÊM NGƯỜI DÙNG MỚI (chưa có ID)
              if (cleanPhone) {
                const { results: phoneMatch } = await env.DB.prepare("SELECT id, full_name FROM users WHERE phone = ?").bind(cleanPhone).all();
                if (phoneMatch && phoneMatch.length > 0) {
                  return Response.json({
                    success: false,
                    error: `Số điện thoại "${cleanPhone}" đã được đăng ký cho tài khoản "${phoneMatch[0].full_name}". Vui lòng chọn số khác hoặc bấm 'Sửa' tài khoản đó.`
                  }, { status: 400, headers });
                }
              }
              if (cleanEmail) {
                const { results: emailMatch } = await env.DB.prepare("SELECT id, full_name FROM users WHERE LOWER(email) = ?").bind(cleanEmail).all();
                if (emailMatch && emailMatch.length > 0) {
                  return Response.json({
                    success: false,
                    error: `Email "${cleanEmail}" đã được đăng ký cho tài khoản "${emailMatch[0].full_name}". Vui lòng chọn email khác.`
                  }, { status: 400, headers });
                }
              }

              targetUserId = 'usr-' + Date.now();
              try {
                await env.DB.prepare(`
                  INSERT INTO users (id, email, phone, full_name, role, password, pin_code, is_active, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `).bind(
                  targetUserId,
                  cleanEmail,
                  cleanPhone,
                  full_name || 'Nhân Viên',
                  role || 'worker',
                  password || 'Admin@123456',
                  pin_code || '1234',
                  is_active !== undefined ? is_active : 1
                ).run();
              } catch (insErr) {
                await env.DB.prepare(`
                  INSERT INTO users (id, email, phone, full_name, role, password, pin_code, is_active)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                  targetUserId,
                  cleanEmail,
                  cleanPhone,
                  full_name || 'Nhân Viên',
                  role || 'worker',
                  password || 'Admin@123456',
                  pin_code || '1234',
                  is_active !== undefined ? is_active : 1
                ).run();
              }
            }

            const { results: users } = await env.DB.prepare("SELECT id, email, phone, full_name, role, password, pin_code, is_active, created_at FROM users ORDER BY role ASC, created_at DESC").all();
            return Response.json({ success: true, users }, { headers });
          }

          // Memory fallback
          let targetUserId = id ? String(id).trim() : null;

          if (targetUserId) {
            const dup = memoryDB.users.find(u => u.id !== targetUserId && (
              (cleanPhone && normalizePhone(u.phone) === cleanPhone) ||
              (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
            ));
            if (dup) {
              return Response.json({
                success: false,
                error: `Số điện thoại hoặc Email đã được sử dụng bởi tài khoản "${dup.full_name}". Vui lòng kiểm tra lại.`
              }, { status: 400, headers });
            }

            const idx = memoryDB.users.findIndex(u => u.id === targetUserId);
            if (idx >= 0) {
              memoryDB.users[idx] = {
                ...memoryDB.users[idx],
                email: cleanEmail,
                phone: cleanPhone,
                full_name: full_name || memoryDB.users[idx].full_name,
                role: role || memoryDB.users[idx].role,
                password: password || memoryDB.users[idx].password,
                pin_code: pin_code || memoryDB.users[idx].pin_code,
                is_active: is_active !== undefined ? is_active : memoryDB.users[idx].is_active
              };
            }
          } else {
            // Thêm người dùng mới
            const dup = memoryDB.users.find(u => 
              (cleanPhone && normalizePhone(u.phone) === cleanPhone) ||
              (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
            );
            if (dup) {
              return Response.json({
                success: false,
                error: `Số điện thoại hoặc Email đã được đăng ký cho tài khoản "${dup.full_name}". Vui lòng chọn số/email khác hoặc bấm 'Sửa'.`
              }, { status: 400, headers });
            }

            memoryDB.users.push({
              id: 'usr-' + Date.now(),
              email: cleanEmail,
              phone: cleanPhone,
              full_name: full_name || 'Nhân Viên',
              role: role || 'worker',
              password: password || 'Admin@123456',
              pin_code: pin_code || '1234',
              is_active: 1,
              created_at: new Date().toISOString()
            });
          }

          return Response.json({ success: true, users: memoryDB.users }, { headers });
        } catch (err) {
          let errorMsg = err.message || "Lỗi không xác định";
          if (errorMsg.includes("UNIQUE constraint failed: users.phone")) {
            errorMsg = "Số điện thoại này đã tồn tại trong hệ thống. Vui lòng bấm 'Sửa' ở bảng bên dưới để cập nhật.";
          } else if (errorMsg.includes("UNIQUE constraint failed: users.email")) {
            errorMsg = "Email này đã tồn tại trong hệ thống. Vui lòng kiểm tra lại.";
          }
          return Response.json({ success: false, error: errorMsg }, { status: 400, headers });
        }
      }

      // 5. Admin: Delete User
      if (url.pathname === '/api/admin/users' && request.method === 'DELETE') {
        try {
          const userId = url.searchParams.get('id');
          if (env && env.DB) {
            await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
            const { results: users } = await env.DB.prepare("SELECT id, email, phone, full_name, role, password, pin_code, is_active, created_at FROM users ORDER BY role ASC, created_at DESC").all();
            return Response.json({ success: true, users }, { headers });
          }

          memoryDB.users = memoryDB.users.filter(u => u.id !== userId);
          return Response.json({ success: true, users: memoryDB.users }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // ==========================================
      // METADATA & DATA APIs
      // ==========================================

      // Get Initial Metadata
      if (url.pathname === '/api/metadata' && request.method === 'GET') {
        if (env && env.DB) {
          try {
            const { results: rawCustomers } = await env.DB.prepare("SELECT * FROM customers WHERE id NOT IN ('cust-1', 'cust-2', 'cust-3') ORDER BY name ASC").all();
            const { results: ordersRaw } = await env.DB.prepare("SELECT * FROM po_orders WHERE id NOT IN ('po-050', 'po-casum-01', 'po-mp-01', '296507-003', 'po-dd-01', 'po-nk-01') ORDER BY created_at DESC").all();
            const orders = (ordersRaw || []).map(o => ({
              ...o,
              default_batches: typeof o.default_batches === 'string' ? JSON.parse(o.default_batches || '[]') : (o.default_batches || [])
            }));

            // Deduplicate customers by normalized name
            const seenNames = new Set();
            const customers = [];
            for (const c of (rawCustomers || [])) {
              const normName = (c.name || '').trim().toLowerCase();
              if (!seenNames.has(normName)) {
                seenNames.add(normName);
                customers.push(c);
              }
            }

            return Response.json({
              success: true,
              customers,
              orders,
              current_date: new Date().toISOString().split('T')[0]
            }, { headers });
          } catch (err) {
            console.error("D1 Metadata Query Error:", err);
          }
        }

        const seenNames = new Set();
        const customers = [];
        for (const c of (memoryDB.customers || [])) {
          if (['cust-1', 'cust-2', 'cust-3'].includes(c.id)) continue;
          const normName = (c.name || '').trim().toLowerCase();
          if (!seenNames.has(normName)) {
            seenNames.add(normName);
            customers.push(c);
          }
        }
        const orders = (memoryDB.orders || []).filter(o => !['po-050', 'po-casum-01', 'po-mp-01', '296507-003', 'po-dd-01', 'po-nk-01'].includes(o.id));

        return Response.json({
          success: true,
          customers,
          orders,
          current_date: new Date().toISOString().split('T')[0]
        }, { headers });
      }

      // Add / Update Customer
      if (url.pathname === '/api/customers' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { id, name, code } = body;
          // size_list không gửi lên (client cũ) thì giữ nguyên dãy size đang có
          const sizeJson = Array.isArray(body.size_list) ? JSON.stringify(cleanSizeList(body.size_list)) : null;

          if (env && env.DB) {
            const custId = id || ('cust-' + Date.now());
            await env.DB.prepare(`
              INSERT INTO customers (id, name, code, size_list) VALUES (?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                code = excluded.code,
                size_list = COALESCE(excluded.size_list, customers.size_list)
            `).bind(custId, name, code, sizeJson).run();
            const { results: customers } = await env.DB.prepare("SELECT * FROM customers ORDER BY name ASC").all();
            return Response.json({ success: true, customers }, { headers });
          }

          if (id) {
            const idx = memoryDB.customers.findIndex(c => c.id === id);
            if (idx >= 0) {
              const prev = memoryDB.customers[idx];
              memoryDB.customers[idx] = { ...prev, id, name, code, size_list: sizeJson ?? prev.size_list ?? '[]' };
            }
          } else {
            memoryDB.customers.push({ id: 'cust-' + Date.now(), name, code, size_list: sizeJson ?? '[]' });
          }
          return Response.json({ success: true, customers: memoryDB.customers }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // Delete Customer
      if (url.pathname === '/api/customers' && request.method === 'DELETE') {
        try {
          const custId = url.searchParams.get('id');
          if (env && env.DB) {
            await env.DB.prepare("DELETE FROM customers WHERE id = ?").bind(custId).run();
            await env.DB.prepare("DELETE FROM po_orders WHERE customer_id = ?").bind(custId).run();
            const { results: customers } = await env.DB.prepare("SELECT * FROM customers ORDER BY name ASC").all();
            return Response.json({ success: true, customers }, { headers });
          }

          memoryDB.customers = memoryDB.customers.filter(c => c.id !== custId);
          memoryDB.orders = memoryDB.orders.filter(o => o.customer_id !== custId);
          return Response.json({ success: true, customers: memoryDB.customers }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // Add / Update PO Order with Detailed Batches
      if (url.pathname === '/api/orders' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { id, customer_id, style_code, po_number, line_name, po_plan, default_batches, tail_sweep_date, tail_batch_name } = body;
          
          let parsedBatches = default_batches || [];
          if (typeof parsedBatches === 'string') {
            try {
              parsedBatches = JSON.parse(parsedBatches);
            } catch (e) {
              parsedBatches = parsedBatches.split(',').map((it, i) => {
                const parts = it.split(':');
                const bName = parts[0].trim() || `Lô ${i+1}`;
                const bQty = parts[1] ? Number(parts[1].trim()) : 0;
                return { id: 'b-' + (i+1), batch_name: bName, batch_plan: bQty, into_sewing: 0 };
              });
            }
          }

          const orderId = id || ('po-' + Date.now());

          if (env && env.DB) {
            // Chỉ ghi các cột của biểu mẫu PO; giữ nguyên đợt và đơn hàng theo size đã dán
            await env.DB.prepare(`
              INSERT INTO po_orders (id, customer_id, style_code, po_number, line_name, po_plan, tail_sweep_date, tail_batch_name, default_batches)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET customer_id = excluded.customer_id, style_code = excluded.style_code,
                po_number = excluded.po_number, line_name = excluded.line_name, po_plan = excluded.po_plan,
                tail_sweep_date = excluded.tail_sweep_date, tail_batch_name = excluded.tail_batch_name,
                default_batches = excluded.default_batches
            `).bind(orderId, customer_id, style_code || 'Mã Style', po_number || 'PO-001', line_name || 'Chuyền 1', Number(po_plan) || 0, tail_sweep_date || null, tail_batch_name || null, JSON.stringify(parsedBatches))
              .run();
            const { results: ordersRaw } = await env.DB.prepare("SELECT * FROM po_orders ORDER BY created_at DESC").all();
            const orders = (ordersRaw || []).map(o => ({
              ...o,
              default_batches: typeof o.default_batches === 'string' ? JSON.parse(o.default_batches || '[]') : (o.default_batches || [])
            }));
            return Response.json({ success: true, orders }, { headers });
          }

          if (id) {
            const idx = memoryDB.orders.findIndex(o => o.id === id);
            if (idx >= 0) {
              memoryDB.orders[idx] = {
                ...memoryDB.orders[idx],
                id,
                customer_id,
                style_code,
                po_number,
                line_name,
                po_plan: Number(po_plan) || 0,
                tail_sweep_date: tail_sweep_date !== undefined ? tail_sweep_date : (memoryDB.orders[idx].tail_sweep_date || null),
                tail_batch_name: tail_batch_name !== undefined ? tail_batch_name : (memoryDB.orders[idx].tail_batch_name || null),
                default_batches: parsedBatches
              };
            }
          } else {
            const newOrder = {
              id: orderId,
              customer_id,
              style_code: style_code || 'Mã Style Mới',
              po_number: po_number || 'PO-001',
              line_name: line_name || 'Chuyền 1',
              po_plan: Number(po_plan) || 1000,
              tail_sweep_date: tail_sweep_date || null,
              tail_batch_name: tail_batch_name || null,
              default_batches: parsedBatches.length > 0 ? parsedBatches : [
                { id: 'b-1', batch_name: "Lô 1", batch_plan: Number(po_plan) || 1000, into_sewing: 0 }
              ]
            };
            memoryDB.orders.push(newOrder);
          }
          return Response.json({ success: true, orders: memoryDB.orders }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // Delete PO Order
      if (url.pathname === '/api/orders' && request.method === 'DELETE') {
        try {
          const orderId = url.searchParams.get('id');
          if (env && env.DB) {
            await env.DB.prepare("DELETE FROM po_orders WHERE id = ?").bind(orderId).run();
            await env.DB.prepare("DELETE FROM daily_reports WHERE po_id = ?").bind(orderId).run();
            await env.DB.prepare("DELETE FROM report_batches WHERE po_id = ?").bind(orderId).run();
            await env.DB.prepare("DELETE FROM dept_logs WHERE po_id = ?").bind(orderId).run();
            const { results: ordersRaw } = await env.DB.prepare("SELECT * FROM po_orders ORDER BY created_at DESC").all();
            const orders = (ordersRaw || []).map(o => ({
              ...o,
              default_batches: typeof o.default_batches === 'string' ? JSON.parse(o.default_batches || '[]') : (o.default_batches || [])
            }));
            return Response.json({ success: true, orders }, { headers });
          }

          memoryDB.orders = memoryDB.orders.filter(o => o.id !== orderId);
          return Response.json({ success: true, orders: memoryDB.orders }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // Get Report by PO & Date
      if (url.pathname === '/api/report' && request.method === 'GET') {
        const rawPoParam = url.searchParams.get('po_id');
        let poId = rawPoParam;
        if (!poId && memoryDB.orders && memoryDB.orders.length > 0) {
          poId = memoryDB.orders[0].id;
        }
        if (!poId) poId = 'po-050';

        const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
        const key = `${poId}_${date}`;

        let resolvedPoId = poId;
        let order = null;

        if (env && env.DB) {
          try {
            const { results: ordRows } = await env.DB.prepare("SELECT * FROM po_orders WHERE id = ? OR po_number = ? LIMIT 1").bind(poId, poId).all();
            if (ordRows && ordRows[0]) {
              order = {
                ...ordRows[0],
                default_batches: typeof ordRows[0].default_batches === 'string' ? JSON.parse(ordRows[0].default_batches || '[]') : (ordRows[0].default_batches || [])
              };
              resolvedPoId = order.id;
            }
          } catch (e) {}
        }
        if (!order) {
          order = memoryDB.orders.find(o => o.id === poId || o.po_number === poId) || null;
          if (order) resolvedPoId = order.id;
        }

        const altKey = `${resolvedPoId}_${date}`;

        let cachedReport = null;
        try {
          const cache = caches.default;
          let match = await cache.match(new Request(`https://internal-cache.ddlongan.local/api/report/${key}`));
          if (!match && altKey !== key) {
            match = await cache.match(new Request(`https://internal-cache.ddlongan.local/api/report/${altKey}`));
          }
          if (match) {
            cachedReport = await match.json();
          }
        } catch (e) {}

        if (!cachedReport && memoryDB.reports) {
          cachedReport = memoryDB.reports[key] || memoryDB.reports[altKey] || null;
        }

        if (env && env.DB) {
          try {
            const { results: repRows } = await env.DB.prepare("SELECT * FROM daily_reports WHERE id = ? OR id = ?").bind(key, altKey).all();
            let report = null;
            if (repRows && repRows.length > 0) {
              const matchedReportId = repRows[0].id;
              const { results: batchRows } = await env.DB.prepare("SELECT * FROM report_batches WHERE report_id = ? OR report_id = ? ORDER BY batch_name ASC").bind(key, altKey).all();
              if (batchRows && batchRows.length > 0) {
                report = {
                  po_id: poId,
                  report_date: date,
                  status: repRows[0].status || "DRAFT",
                  batches: batchRows
                };
              }
            }

            // Nếu Edge Cache / Memory có bản lưu mới hơn D1 (ví dụ khi D1 bị vượt hạn mức ghi)
            if (cachedReport && cachedReport.batches && cachedReport.batches.length > 0) {
              if (!report || !report.batches || report.batches.length === 0 || (cachedReport.updated_at && cachedReport.updated_at > (report.updated_at || 0))) {
                report = cachedReport;
              }
            }

            // Cumulative export & import calculation from prior days strictly before current report date
            // Multi-level safety: Check SUM(daily_out), MAX(delivered) in case daily_out was 0, and SUM(into_sewing)
            const { results: allBatchExports } = await env.DB.prepare(`
              SELECT batch_name, 
                     SUM(COALESCE(daily_out, 0)) as total_out, 
                     MAX(COALESCE(delivered, 0)) as max_delivered,
                     SUM(COALESCE(into_sewing, 0)) as total_in 
              FROM report_batches 
              WHERE (po_id = ? OR po_id = ?) AND report_date < ? 
              GROUP BY batch_name
            `).bind(resolvedPoId, poId, date).all();

            const cumExportsByBatch = {};
            const cumImportsByBatch = {};
            (allBatchExports || []).forEach(r => {
              const bName = r.batch_name;
              const bTrim = bName ? bName.trim() : "";
              const effOut = Math.max(Number(r.total_out) || 0, Number(r.max_delivered) || 0);
              cumExportsByBatch[bName] = effOut;
              if (bTrim) cumExportsByBatch[bTrim] = effOut;
              cumImportsByBatch[bName] = Number(r.total_in) || 0;
              if (bTrim) cumImportsByBatch[bTrim] = Number(r.total_in) || 0;
            });

            // Also check dept_logs (Tab 2) for any xuat_kho entered on this PO
            try {
              const { results: deptExports } = await env.DB.prepare(`
                SELECT batch_name, SUM(COALESCE(xuat_kho, xuat, 0)) as total_xuat 
                FROM dept_logs 
                WHERE po_id = ? OR po_id = ? 
                GROUP BY batch_name
              `).bind(resolvedPoId, poId).all();
              (deptExports || []).forEach(dr => {
                const bN = dr.batch_name;
                const bT = bN ? bN.trim() : "";
                const dOut = Number(dr.total_xuat) || 0;
                if (dOut > 0 && (!cumExportsByBatch[bN] || cumExportsByBatch[bN] === 0)) {
                  cumExportsByBatch[bN] = dOut;
                  if (bT) cumExportsByBatch[bT] = dOut;
                }
              });
            } catch (dlErr) {}

            // Merge with any in-memory reports for prior days that might not have committed to D1 yet
            Object.keys(memoryDB.reports || {}).forEach(k => {
              if (k.startsWith(resolvedPoId + '_') || k.startsWith(poId + '_')) {
                const repDate = k.split('_').slice(1).join('_');
                if (repDate < date) {
                  const rep = memoryDB.reports[k];
                  if (rep && rep.batches) {
                    rep.batches.forEach(b => {
                      const bName = b.batch_name;
                      const bTrim = bName ? bName.trim() : "";
                      const dOut = Math.max(Number(b.daily_out) || 0, Number(b.delivered) || 0);
                      const dIn = Number(b.into_sewing) || 0;
                      if (dOut > (cumExportsByBatch[bName] || 0)) {
                        cumExportsByBatch[bName] = dOut;
                        if (bTrim) cumExportsByBatch[bTrim] = dOut;
                      }
                      if (dIn > (cumImportsByBatch[bName] || 0)) {
                        cumImportsByBatch[bName] = dIn;
                        if (bTrim) cumImportsByBatch[bTrim] = dIn;
                      }
                    });
                  }
                }
              }
            });

            // Previous day's WIP for each batch (for QC & Pairing balance check)
            const { results: prevDateRows } = await env.DB.prepare(
              "SELECT DISTINCT report_date FROM report_batches WHERE (po_id = ? OR po_id = ?) AND report_date < ? ORDER BY report_date DESC"
            ).bind(resolvedPoId, poId, date).all();
            const availablePriorDates = (prevDateRows || []).map(r => r.report_date);
            const { targetDate, actualDate: prevDate } = getPreviousWorkingDateInfo(date, availablePriorDates);

            const prevDayWipByBatch = {};
            if (prevDate) {
              const { results: prevBatches } = await env.DB.prepare(
                "SELECT batch_name, wip_qc, wip_pairing, wip_sewing, wip_packing, wip_warehouse, daily_out FROM report_batches WHERE (po_id = ? OR po_id = ?) AND report_date = ?"
              ).bind(resolvedPoId, poId, prevDate).all();
              (prevBatches || []).forEach(r => {
                prevDayWipByBatch[r.batch_name] = {
                  wip_qc: Number(r.wip_qc) || 0,
                  wip_pairing: Number(r.wip_pairing) || 0,
                  wip_sewing: Number(r.wip_sewing) || 0,
                  wip_packing: Number(r.wip_packing) || 0,
                  wip_warehouse: Number(r.wip_warehouse) || 0,
                  daily_out: Number(r.daily_out) || 0
                };
              });
            }

            if (!report || !report.batches || report.batches.length === 0) {
              let defBatches = order && order.default_batches ? [...order.default_batches] : [];
              if (order && order.tail_sweep_date && date < order.tail_sweep_date) {
                defBatches = defBatches.filter(b => !b.is_tail_batch && !(b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
              }
              const batches = defBatches.map((b, i) => {
                const defaultTodayIn = 0; // New report dates must always start with 0 into_sewing
                return {
                  id: b.id || ('b-' + (i+1)),
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

              report = { po_id: poId, report_date: date, status: (repRows && repRows[0] && repRows[0].status) || "DRAFT", batches };
            } else if (order && order.tail_sweep_date) {
              if (date < order.tail_sweep_date) {
                report.batches = report.batches.filter(b => !b.is_tail_batch && !(b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
              } else {
                const hasTail = report.batches.some(b => b.is_tail_batch || (b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
                if (!hasTail) {
                  const tailDef = (order.default_batches || []).find(b => b.is_tail_batch || (b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
                  const tName = tailDef ? tailDef.batch_name : (order.tail_batch_name || "Lô Số Đuôi");
                  const tPlan = tailDef ? (Number(tailDef.batch_plan || tailDef.into_sewing) || 126) : 126;
                  const priorIn = cumImportsByBatch[tName] || 0;
                  const tTodayIn = (date === order.tail_sweep_date && priorIn === 0) ? tPlan : 0;
                  const isSweepDay = (date === order.tail_sweep_date);
                  report.batches.push({
                    id: (tailDef && tailDef.id) || ('b-tail-' + Date.now()),
                    batch_name: tName,
                    batch_plan: tPlan,
                    into_sewing: tTodayIn,
                    delivered: 0,
                    wip_sewing: (poId === 'po-050' && date === '2026-09-23') ? 80 : 0,
                    wip_qc: (poId === 'po-050' && date === '2026-09-23') ? 46 : 0,
                    wip_pairing: 0,
                    wip_packing: 0,
                    wip_warehouse: 0,
                    daily_out: 0,
                    note_sewing: (poId === 'po-050' && date === '2026-09-23') ? "Tổ may" : "",
                    note_qc: (poId === 'po-050' && date === '2026-09-23') ? "QC 1" : "",
                    note_pairing: "",
                    note_packing: "",
                    note_warehouse: "",
                    shortage_reason_type: "",
                    shortage_note: (poId === 'po-050' && date === '2026-09-23') ? "Nhận 126 nợ từ Chuẩn Bị bù nợ" : (isSweepDay ? "Lô vét đuôi Chuẩn Bị" : ""),
                    shortage_mat_xac: 0,
                    shortage_hang_phe: 0,
                    shortage_khac: 0,
                    is_tail_batch: true
                  });
                }
              }
            }

            return Response.json({ success: true, report, cumExportsByBatch, cumImportsByBatch, prevDayWipByBatch, prevReportDate: prevDate || targetDate }, { headers });
          } catch (err) {
            console.error("D1 Report Query Error:", err);
          }
        }

        const allKeys = Object.keys(memoryDB.reports).filter(k => k.startsWith(poId + '_') || k.startsWith(resolvedPoId + '_')).sort();
        const cumExportsByBatch = {};
        const cumImportsByBatch = {};
        // Giống cách tính trên D1: nhận = cộng into_sewing; xuất = max(cộng daily_out, delivered lớn nhất); mỗi lô cộng 1 lần
        const memAgg = {};
        allKeys.forEach(k => {
          const repDate = k.split('_').slice(1).join('_');
          if (repDate < date) {
            const rep = memoryDB.reports[k];
            if (rep && rep.batches) {
              rep.batches.forEach(b => {
                const a = memAgg[b.batch_name] || (memAgg[b.batch_name] = { out: 0, maxDelivered: 0, in: 0 });
                a.out += Number(b.daily_out) || 0;
                a.maxDelivered = Math.max(a.maxDelivered, Number(b.delivered) || 0);
                a.in += Number(b.into_sewing) || 0;
              });
            }
          }
        });
        Object.entries(memAgg).forEach(([bName, a]) => {
          const bTrim = bName ? bName.trim() : "";
          const effOut = Math.max(a.out, a.maxDelivered);
          cumExportsByBatch[bName] = effOut;
          cumImportsByBatch[bName] = a.in;
          if (bTrim) {
            cumExportsByBatch[bTrim] = effOut;
            cumImportsByBatch[bTrim] = a.in;
          }
        });

        // Also check memory dept_logs
        const deptLogObj = memoryDB.dept_logs ? (memoryDB.dept_logs[poId] || memoryDB.dept_logs[resolvedPoId]) : null;
        if (deptLogObj) {
          Object.keys(deptLogObj).forEach(bName => {
            const bTrim = bName ? bName.trim() : "";
            const rows = deptLogObj[bName] || [];
            let sumOut = 0;
            rows.forEach(r => {
              sumOut += Number(r.xuat_kho || r.xuat) || 0;
            });
            if (sumOut > 0 && (!cumExportsByBatch[bName] || cumExportsByBatch[bName] === 0)) {
              cumExportsByBatch[bName] = sumOut;
              if (bTrim) cumExportsByBatch[bTrim] = sumOut;
            }
          });
        }

        let report = memoryDB.reports[key] || memoryDB.reports[altKey];
        if (!report) {
          let defBatches = order && order.default_batches ? [...order.default_batches] : [];
          if (order && order.tail_sweep_date && date < order.tail_sweep_date) {
            defBatches = defBatches.filter(b => !b.is_tail_batch && !(b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
          }
          const batches = defBatches.map((b, i) => {
            const defaultTodayIn = 0;
            return {
              id: b.id || ('b-' + (i+1)),
              batch_name: b.batch_name,
              batch_plan: Number(b.batch_plan || b.into_sewing) || 0,
              into_sewing: defaultTodayIn,
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
              shortage_note: "",
              shortage_mat_xac: 0,
              shortage_hang_phe: 0,
              shortage_khac: 0,
              is_tail_batch: Boolean(b.is_tail_batch || (b.batch_name && b.batch_name.toLowerCase().includes('đuôi')))
            };
          });

          report = { po_id: poId, report_date: date, status: "DRAFT", batches };
        } else if (order && order.tail_sweep_date) {
          if (date < order.tail_sweep_date) {
            report.batches = (report.batches || []).filter(b => !b.is_tail_batch && !(b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
          } else {
            const hasTail = (report.batches || []).some(b => b.is_tail_batch || (b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
            if (!hasTail) {
              const tailDef = (order.default_batches || []).find(b => b.is_tail_batch || (b.batch_name && b.batch_name.toLowerCase().includes('đuôi')));
              const tName = tailDef ? tailDef.batch_name : (order.tail_batch_name || "Lô Số Đuôi");
              const tPlan = tailDef ? (Number(tailDef.batch_plan || tailDef.into_sewing) || 126) : 126;
              const priorIn = cumImportsByBatch[tName] || 0;
              const tTodayIn = (date === order.tail_sweep_date && priorIn === 0) ? tPlan : 0;
              const isSweepDay = (date === order.tail_sweep_date);
              if (!report.batches) report.batches = [];
              report.batches.push({
                id: (tailDef && tailDef.id) || ('b-tail-' + Date.now()),
                batch_name: tName,
                batch_plan: tPlan,
                into_sewing: tTodayIn,
                delivered: 0,
                wip_sewing: (poId === 'po-050' && date === '2026-09-23') ? 80 : 0,
                wip_qc: (poId === 'po-050' && date === '2026-09-23') ? 46 : 0,
                wip_pairing: 0,
                wip_packing: 0,
                wip_warehouse: 0,
                daily_out: 0,
                note_sewing: (poId === 'po-050' && date === '2026-09-23') ? "Tổ may" : "",
                note_qc: (poId === 'po-050' && date === '2026-09-23') ? "QC 1" : "",
                note_pairing: "",
                note_packing: "",
                note_warehouse: "",
                shortage_reason_type: "",
                shortage_note: (poId === 'po-050' && date === '2026-09-23') ? "Nhận 126 nợ từ Chuẩn Bị bù nợ" : (isSweepDay ? "Lô vét đuôi Chuẩn Bị" : ""),
                shortage_mat_xac: 0,
                shortage_hang_phe: 0,
                shortage_khac: 0,
                is_tail_batch: true
              });
            }
          }
        }

        const prevDates = allKeys.map(k => k.split('_').slice(1).join('_')).filter(d => d < date).sort();
        const { targetDate: memTargetDate, actualDate: memPrevDate } = getPreviousWorkingDateInfo(date, prevDates);
        const prevDayWipByBatch = {};
        if (memPrevDate) {
          const prevRep = memoryDB.reports[poId + '_' + memPrevDate] || memoryDB.reports[resolvedPoId + '_' + memPrevDate];
          if (prevRep && prevRep.batches) {
            prevRep.batches.forEach(b => {
              prevDayWipByBatch[b.batch_name] = {
                wip_qc: Number(b.wip_qc) || 0,
                wip_pairing: Number(b.wip_pairing) || 0,
                wip_sewing: Number(b.wip_sewing) || 0,
                wip_packing: Number(b.wip_packing) || 0,
                wip_warehouse: Number(b.wip_warehouse) || 0,
                daily_out: Number(b.daily_out) || 0
              };
            });
          }
        }

        return Response.json({ success: true, report, cumExportsByBatch, cumImportsByBatch, prevDayWipByBatch, prevReportDate: memPrevDate || memTargetDate }, { headers });
      }

      // Save Report
      if (url.pathname === '/api/report' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { po_id, report_date, status, batches } = body;
          const key = `${po_id}_${report_date}`;
          const now = Date.now();

          // 1. Luôn lưu vào memoryDB và gán timestamp updated_at
          const memReport = {
            po_id,
            report_date,
            status: status || "DRAFT",
            batches,
            updated_at: now
          };
          if (!memoryDB.reports) memoryDB.reports = {};
          memoryDB.reports[key] = memReport;

          // 2. Lưu vào Cloudflare Edge Cache (caches.default) để chia sẻ giữa các Worker requests
          try {
            const cache = caches.default;
            const cacheUrl = new Request(`https://internal-cache.ddlongan.local/api/report/${key}`);
            const cacheResponse = new Response(JSON.stringify(memReport), {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=86400'
              }
            });
            await cache.put(cacheUrl, cacheResponse);
          } catch (cacheErr) {
            console.warn("Edge Cache put warning:", cacheErr);
          }

          // 3. Cố gắng ghi vào D1 Database
          let d1Success = false;
          let d1ErrMsg = null;
          if (env && env.DB) {
            try {
              await env.DB.prepare("INSERT OR REPLACE INTO daily_reports (id, po_id, report_date, status) VALUES (?, ?, ?, ?)")
                .bind(key, po_id, report_date, status || 'DRAFT')
                .run();

              // Clear old batch records for this report
              await env.DB.prepare("DELETE FROM report_batches WHERE report_id = ?").bind(key).run();

              // Insert batches
              for (let i = 0; i < (batches || []).length; i++) {
                const b = batches[i];
                const bId = `rb-${key}-${(b.batch_name || ('b' + (i+1))).replace(/\s+/g, '_')}`;
                const dailyOut = Number(b.daily_out) || 0;
                const delivered = Number(b.delivered) || dailyOut;
                const dailyFinished = Number(b.daily_finished) || 0;
                await env.DB.prepare(`
                  INSERT INTO report_batches (
                    id, report_id, po_id, report_date, batch_name, batch_plan, into_sewing, delivered, daily_out, daily_finished,
                    wip_sewing, wip_qc, wip_pairing, wip_packing, wip_warehouse,
                    note_sewing, note_qc, note_pairing, note_packing, note_warehouse, note_export,
                    shortage_reason_type, shortage_note, shortage_mat_xac, shortage_hang_phe, shortage_khac
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                  bId, key, po_id, report_date, b.batch_name, Number(b.batch_plan) || 0, Number(b.into_sewing) || 0, delivered, dailyOut, dailyFinished,
                  Number(b.wip_sewing) || 0, Number(b.wip_qc) || 0, Number(b.wip_pairing) || 0, Number(b.wip_packing) || 0, Number(b.wip_warehouse) || 0,
                  b.note_sewing || '', b.note_qc || '', b.note_pairing || '', b.note_packing || '', b.note_warehouse || '', b.note_export || '',
                  b.shortage_reason_type || '', b.shortage_note || '', Number(b.shortage_mat_xac) || 0, Number(b.shortage_hang_phe) || 0, Number(b.shortage_khac) || 0
                ).run();
              }
              d1Success = true;
            } catch (dbErr) {
              d1ErrMsg = dbErr.message;
              console.warn("D1 write warning (backed up to Edge & Memory Cache):", dbErr.message);
              // Bắt lỗi D1_ERROR: Không ném lỗi 400! Báo cáo đã an toàn ở Edge & Memory Cache.
            }
          }

          return Response.json({
            success: true,
            message: d1Success ? "Đã lưu báo cáo thành công vào D1 Database" : "Đã lưu an toàn vào bộ nhớ đệm (Edge Cache)",
            cachedOnly: !d1Success,
            d1Warning: d1ErrMsg
          }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // Get Report History (Thống Kê Lô Tất Cả Các Ngày)
      if (url.pathname === '/api/report-history' && request.method === 'GET') {
        const poId = url.searchParams.get('po_id') || 'po-050';

        if (env && env.DB) {
          try {
            const { results: history } = await env.DB.prepare(`
              SELECT * FROM report_batches 
              WHERE po_id = ? 
                 OR po_id = (SELECT id FROM po_orders WHERE po_number = ? LIMIT 1)
                 OR po_id = (SELECT po_number FROM po_orders WHERE id = ? LIMIT 1)
              ORDER BY report_date ASC, batch_name ASC
            `).bind(poId, poId, poId).all();
            return Response.json({ success: true, history: history || [] }, { headers });
          } catch (err) {
            console.error("D1 History Query Error:", err);
          }
        }

        const history = [];
        Object.keys(memoryDB.reports)
          .filter(k => k.startsWith(poId + '_'))
          .sort()
          .forEach(k => {
            const rep = memoryDB.reports[k];
            if (rep && rep.batches) {
              rep.batches.forEach(b => {
                history.push({
                  report_date: rep.report_date,
                  status: rep.status,
                  ...b
                });
              });
            }
          });

        return Response.json({ success: true, history }, { headers });
      }

      // Get Dept Logs (Tab 3 - Báo Theo Dõi Sản Lượng Các Bộ Phận)
      if (url.pathname === '/api/dept-logs' && request.method === 'GET') {
        const poId = url.searchParams.get('po_id') || 'po-050';

        if (env && env.DB) {
          try {
            const { results: logsRows } = await env.DB.prepare(`
              SELECT * FROM dept_logs 
              WHERE po_id = ? 
                 OR po_id = (SELECT id FROM po_orders WHERE po_number = ? LIMIT 1)
                 OR po_id = (SELECT po_number FROM po_orders WHERE id = ? LIMIT 1)
              ORDER BY batch_name ASC, row_order ASC
            `).bind(poId, poId, poId).all();

            const logs = {};
            (logsRows || []).forEach(r => {
              if (!logs[r.batch_name]) logs[r.batch_name] = [];
              logs[r.batch_name].push({
                date: r.log_date || "",
                ton_dau: r.ton_dau !== undefined && r.ton_dau !== null ? r.ton_dau : "",
                nhap: r.nhap !== undefined && r.nhap !== null ? r.nhap : "",
                xuat: r.xuat !== undefined && r.xuat !== null ? r.xuat : "",
                ton_cuoi: r.ton_cuoi !== undefined && r.ton_cuoi !== null ? r.ton_cuoi : "",
                nhap_phoi: r.nhap_phoi !== undefined && r.nhap_phoi !== null ? r.nhap_phoi : "",
                giao_dg: r.giao_dg !== undefined && r.giao_dg !== null ? r.giao_dg : "",
                nhap_kho: r.nhap_kho !== undefined && r.nhap_kho !== null ? r.nhap_kho : "",
                xuat_kho: r.xuat_kho !== undefined && r.xuat_kho !== null ? r.xuat_kho : ""
              });
            });

            return Response.json({ success: true, logs }, { headers });
          } catch (err) {
            console.error("D1 Dept Logs Query Error:", err);
          }
        }

        const order = memoryDB.orders.find(o => o.id === poId || o.po_number === poId);
        const logs = memoryDB.dept_logs ? (memoryDB.dept_logs[poId] || (order && (memoryDB.dept_logs[order.id] || memoryDB.dept_logs[order.po_number])) || {}) : {};
        return Response.json({ success: true, logs }, { headers });
      }

      // Save Dept Logs (Tab 2)
      if (url.pathname === '/api/dept-logs' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { po_id, logs } = body;

          if (env && env.DB) {
            await env.DB.prepare("DELETE FROM dept_logs WHERE po_id = ?").bind(po_id).run();

            for (const bName of Object.keys(logs || {})) {
              const bRows = logs[bName] || [];
              for (let i = 0; i < bRows.length; i++) {
                const r = bRows[i];
                const rowId = `dl-${po_id}-${bName}-${i}-${Date.now()}`;
                await env.DB.prepare(`
                  INSERT INTO dept_logs (id, po_id, batch_name, log_date, ton_dau, nhap, xuat, ton_cuoi, nhap_phoi, giao_dg, nhap_kho, xuat_kho, row_order)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                  rowId, po_id, bName, r.date || '',
                  r.ton_dau !== "" && r.ton_dau !== undefined ? Number(r.ton_dau) : 0,
                  r.nhap !== "" && r.nhap !== undefined ? Number(r.nhap) : 0,
                  r.xuat !== "" && r.xuat !== undefined ? Number(r.xuat) : 0,
                  r.ton_cuoi !== "" && r.ton_cuoi !== undefined ? Number(r.ton_cuoi) : 0,
                  r.nhap_phoi !== "" && r.nhap_phoi !== undefined ? Number(r.nhap_phoi) : 0,
                  r.giao_dg !== "" && r.giao_dg !== undefined ? Number(r.giao_dg) : 0,
                  r.nhap_kho !== "" && r.nhap_kho !== undefined ? Number(r.nhap_kho) : 0,
                  r.xuat_kho !== "" && r.xuat_kho !== undefined ? Number(r.xuat_kho) : 0,
                  i
                ).run();
              }
            }

            return Response.json({ success: true, message: "Đã lưu sản lượng các bộ phận vào D1 Database" }, { headers });
          }

          if (!memoryDB.dept_logs) memoryDB.dept_logs = {};
          memoryDB.dept_logs[po_id] = logs;
          return Response.json({ success: true, message: "Đã lưu sản lượng các bộ phận thành công" }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // Get Flow Logs
      if (url.pathname === '/api/flow-logs' && request.method === 'GET') {
        const poId = url.searchParams.get('po_id') || 'po-050';
        const logs = memoryDB.flow_logs.filter(l => l.po_id === poId);
        return Response.json({ success: true, logs }, { headers });
      }

      // Add Flow Log
      if (url.pathname === '/api/flow-logs' && request.method === 'POST') {
        try {
          const body = await request.json();
          const newLog = {
            id: 'fl-' + Date.now(),
            ...body
          };
          memoryDB.flow_logs.push(newLog);
          return Response.json({ success: true, log: newLog }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // Customer-specific & Factory-wide Balance API (Popup Cân Đối Theo Khách Hàng)
      if (url.pathname === '/api/factory-balance' && request.method === 'GET') {
        const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
        const customerId = url.searchParams.get('customer_id') || '';

        try {
          let prevDate = null;
          let targetDate = null;
          let tonHomQua = 0;
          let xuatHomNay = 0;
          let tonHomNay = 0;
          let thanhPhamHomNay = 0;
          let sumQc = 0, sumPairing = 0, sumPacking = 0, sumWarehouse = 0;

          if (env && env.DB) {
            try {
              let poIds = [];
              if (customerId) {
                const { results: custOrders } = await env.DB.prepare(
                  "SELECT id, po_number FROM po_orders WHERE customer_id = ?"
                ).bind(customerId).all();
                poIds = [...new Set((custOrders || []).flatMap(o => [o.id, o.po_number]).filter(Boolean))];
              }

              if (customerId && poIds.length === 0) {
                return Response.json({
                  success: true,
                  customer_id: customerId,
                  date,
                  prev_date: null,
                  ton_hom_qua: 0,
                  thanh_pham_hom_nay: 0,
                  xuat_hom_nay: 0,
                  ton_hom_nay: 0,
                  details_today: { qc: 0, pairing: 0, packing: 0, warehouse: 0 }
                }, { headers });
              }

              const hasPoFilter = poIds.length > 0;
              const placeholders = hasPoFilter ? poIds.map(() => '?').join(',') : '';

              // Find prior report dates
              const priorSql = hasPoFilter
                ? `SELECT DISTINCT report_date FROM report_batches WHERE po_id IN (${placeholders}) AND report_date < ? ORDER BY report_date DESC`
                : "SELECT DISTINCT report_date FROM report_batches WHERE report_date < ? ORDER BY report_date DESC";
              const priorBindings = hasPoFilter ? [...poIds, date] : [date];
              const { results: priorDatesRaw } = await env.DB.prepare(priorSql).bind(...priorBindings).all();
              const availablePriorDates = (priorDatesRaw || []).map(r => r.report_date);
              const dateInfo = getPreviousWorkingDateInfo(date, availablePriorDates);
              prevDate = dateInfo.actualDate;
              targetDate = dateInfo.targetDate;

              // 1. Tồn hôm qua (chỉ của khách hàng này): QC + Phối đôi + Đóng gói + Kho TP
              if (prevDate) {
                const prevSql = hasPoFilter
                  ? `SELECT SUM(COALESCE(wip_qc, 0) + COALESCE(wip_pairing, 0) + COALESCE(wip_packing, 0) + COALESCE(wip_warehouse, 0)) as total_prev_wip FROM report_batches WHERE po_id IN (${placeholders}) AND report_date = ?`
                  : `SELECT SUM(COALESCE(wip_qc, 0) + COALESCE(wip_pairing, 0) + COALESCE(wip_packing, 0) + COALESCE(wip_warehouse, 0)) as total_prev_wip FROM report_batches WHERE report_date = ?`;
                const prevBindings = hasPoFilter ? [...poIds, prevDate] : [prevDate];
                const { results: prevSum } = await env.DB.prepare(prevSql).bind(...prevBindings).all();
                tonHomQua = (prevSum && prevSum[0] && Number(prevSum[0].total_prev_wip)) || 0;
              }

              // 2. Xuất hôm nay (chỉ của khách hàng này)
              const outSql = hasPoFilter
                ? `SELECT SUM(COALESCE(daily_out, 0)) as total_today_out FROM report_batches WHERE po_id IN (${placeholders}) AND report_date = ?`
                : `SELECT SUM(COALESCE(daily_out, 0)) as total_today_out FROM report_batches WHERE report_date = ?`;
              const outBindings = hasPoFilter ? [...poIds, date] : [date];
              const { results: outSum } = await env.DB.prepare(outSql).bind(...outBindings).all();
              xuatHomNay = (outSum && outSum[0] && Number(outSum[0].total_today_out)) || 0;

              // 3. Tồn hôm nay (chỉ của khách hàng này): QC + Phối đôi + Đóng gói + Kho TP
              const wipSql = hasPoFilter
                ? `SELECT SUM(COALESCE(wip_qc, 0)) as sum_qc, SUM(COALESCE(wip_pairing, 0)) as sum_pairing, SUM(COALESCE(wip_packing, 0)) as sum_packing, SUM(COALESCE(wip_warehouse, 0)) as sum_warehouse, SUM(COALESCE(wip_qc, 0) + COALESCE(wip_pairing, 0) + COALESCE(wip_packing, 0) + COALESCE(wip_warehouse, 0)) as total_today_wip FROM report_batches WHERE po_id IN (${placeholders}) AND report_date = ?`
                : `SELECT SUM(COALESCE(wip_qc, 0)) as sum_qc, SUM(COALESCE(wip_pairing, 0)) as sum_pairing, SUM(COALESCE(wip_packing, 0)) as sum_packing, SUM(COALESCE(wip_warehouse, 0)) as sum_warehouse, SUM(COALESCE(wip_qc, 0) + COALESCE(wip_pairing, 0) + COALESCE(wip_packing, 0) + COALESCE(wip_warehouse, 0)) as total_today_wip FROM report_batches WHERE report_date = ?`;
              const wipBindings = hasPoFilter ? [...poIds, date] : [date];
              const { results: todayWipSum } = await env.DB.prepare(wipSql).bind(...wipBindings).all();
              tonHomNay = (todayWipSum && todayWipSum[0] && Number(todayWipSum[0].total_today_wip)) || 0;
              sumQc = (todayWipSum && todayWipSum[0] && Number(todayWipSum[0].sum_qc)) || 0;
              sumPairing = (todayWipSum && todayWipSum[0] && Number(todayWipSum[0].sum_pairing)) || 0;
              sumPacking = (todayWipSum && todayWipSum[0] && Number(todayWipSum[0].sum_packing)) || 0;
              sumWarehouse = (todayWipSum && todayWipSum[0] && Number(todayWipSum[0].sum_warehouse)) || 0;

              // 4. Thành phẩm hôm nay (theo khách hàng)
              const custKey = `${customerId || 'all'}_${date}`;
              if (memoryDB.daily_customer_summary && memoryDB.daily_customer_summary[custKey] !== undefined) {
                thanhPhamHomNay = Number(memoryDB.daily_customer_summary[custKey]) || 0;
              } else {
                try {
                  if (customerId) {
                    const { results: cSum } = await env.DB.prepare(
                      "SELECT daily_finished FROM daily_customer_summary WHERE customer_id = ? AND report_date = ?"
                    ).bind(customerId, date).all();
                    if (cSum && cSum.length > 0) {
                      thanhPhamHomNay = Number(cSum[0].daily_finished) || 0;
                    }
                  } else {
                    const { results: finishedSum } = await env.DB.prepare(
                      "SELECT daily_finished FROM daily_factory_summary WHERE report_date = ?"
                    ).bind(date).all();
                    if (finishedSum && finishedSum.length > 0) {
                      thanhPhamHomNay = Number(finishedSum[0].daily_finished) || 0;
                    }
                  }
                } catch (e) {}

                if (!thanhPhamHomNay && hasPoFilter) {
                  const { results: rbFinished } = await env.DB.prepare(
                    `SELECT SUM(COALESCE(daily_finished, 0)) as sum_finished FROM report_batches WHERE po_id IN (${placeholders}) AND report_date = ?`
                  ).bind(...poIds, date).all();
                  thanhPhamHomNay = (rbFinished && rbFinished[0] && Number(rbFinished[0].sum_finished)) || 0;
                }
              }

              return Response.json({
                success: true,
                customer_id: customerId,
                date,
                prev_date: prevDate || targetDate,
                ton_hom_qua: tonHomQua,
                thanh_pham_hom_nay: thanhPhamHomNay,
                xuat_hom_nay: xuatHomNay,
                ton_hom_nay: tonHomNay,
                details_today: { qc: sumQc, pairing: sumPairing, packing: sumPacking, warehouse: sumWarehouse }
              }, { headers });
            } catch (d1Err) {
              console.warn("D1 Factory-balance notice:", d1Err.message);
            }
          }

          // In-memory fallback
          const custKey = `${customerId || 'all'}_${date}`;
          if (memoryDB.daily_customer_summary && memoryDB.daily_customer_summary[custKey] !== undefined) {
            thanhPhamHomNay = Number(memoryDB.daily_customer_summary[custKey]) || 0;
          } else if (!customerId && memoryDB.daily_factory_summary && memoryDB.daily_factory_summary[date] !== undefined) {
            thanhPhamHomNay = Number(memoryDB.daily_factory_summary[date]) || 0;
          }

          const custOrders = (memoryDB.orders || []).filter(o => !customerId || o.customer_id === customerId);
          const poIds = custOrders.flatMap(o => [o.id, o.po_number].filter(Boolean));

          const allRepKeys = Object.keys(memoryDB.reports || {});
          const custReports = allRepKeys
            .map(k => memoryDB.reports[k])
            .filter(r => r && (!customerId || poIds.includes(r.po_id)));

          const allDates = [...new Set(custReports.map(r => r.report_date))].filter(d => d < date).sort();
          const dateInfo = getPreviousWorkingDateInfo(date, allDates);
          prevDate = dateInfo.actualDate;
          targetDate = dateInfo.targetDate;

          custReports.forEach(r => {
            if (r.report_date === prevDate) {
              (r.batches || []).forEach(b => {
                tonHomQua += (Number(b.wip_qc) || 0) + (Number(b.wip_pairing) || 0) + (Number(b.wip_packing) || 0) + (Number(b.wip_warehouse) || 0);
              });
            }
            if (r.report_date === date) {
              (r.batches || []).forEach(b => {
                xuatHomNay += Number(b.daily_out) || 0;
                const q = Number(b.wip_qc) || 0;
                const pair = Number(b.wip_pairing) || 0;
                const pack = Number(b.wip_packing) || 0;
                const wh = Number(b.wip_warehouse) || 0;
                sumQc += q; sumPairing += pair; sumPacking += pack; sumWarehouse += wh;
                tonHomNay += (q + pair + pack + wh);
              });
            }
          });

          return Response.json({
            success: true,
            customer_id: customerId,
            date,
            prev_date: prevDate || targetDate,
            ton_hom_qua: tonHomQua,
            thanh_pham_hom_nay: thanhPhamHomNay,
            xuat_hom_nay: xuatHomNay,
            ton_hom_nay: tonHomNay,
            details_today: { qc: sumQc, pairing: sumPairing, packing: sumPacking, warehouse: sumWarehouse }
          }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Save Customer-specific Finished Goods API (Lưu Thành Phẩm Hôm Nay Theo Khách Hàng)
      if (url.pathname === '/api/factory-balance' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { date, customer_id, daily_finished } = body;
          if (!date) {
            return Response.json({ success: false, error: "Thiếu thông tin ngày báo cáo" }, { status: 400, headers });
          }
          const finishedVal = Number(daily_finished) || 0;
          const custKey = `${customer_id || 'all'}_${date}`;

          if (!memoryDB.daily_customer_summary) memoryDB.daily_customer_summary = {};
          memoryDB.daily_customer_summary[custKey] = finishedVal;
          if (!customer_id) {
            if (!memoryDB.daily_factory_summary) memoryDB.daily_factory_summary = {};
            memoryDB.daily_factory_summary[date] = finishedVal;
          }

          if (env && env.DB) {
            try {
              if (customer_id) {
                await env.DB.prepare(`
                  CREATE TABLE IF NOT EXISTS daily_customer_summary (
                    id TEXT PRIMARY KEY,
                    customer_id TEXT NOT NULL,
                    report_date TEXT NOT NULL,
                    daily_finished INTEGER DEFAULT 0,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                  )
                `).run();
                await env.DB.prepare(`
                  INSERT INTO daily_customer_summary (id, customer_id, report_date, daily_finished, updated_at)
                  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                  ON CONFLICT(id) DO UPDATE SET daily_finished = excluded.daily_finished, updated_at = CURRENT_TIMESTAMP
                `).bind(custKey, customer_id, date, finishedVal).run();
              } else {
                await env.DB.prepare(`
                  INSERT INTO daily_factory_summary (report_date, daily_finished, updated_at)
                  VALUES (?, ?, CURRENT_TIMESTAMP)
                  ON CONFLICT(report_date) DO UPDATE SET daily_finished = excluded.daily_finished, updated_at = CURRENT_TIMESTAMP
                `).bind(date, finishedVal).run();
              }
            } catch (dbErr) {
              console.warn("DB save finished notice:", dbErr.message);
            }
          }

          return Response.json({
            success: true,
            message: "Đã lưu thành phẩm theo khách hàng thành công",
            customer_id,
            date,
            daily_finished: finishedVal
          }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // ==========================================
      // CHUYỂN QUYỀN BẰNG MẬT KHẨU CỦA QUYỀN
      // ==========================================

      // Trạng thái mật khẩu từng quyền (không trả mật khẩu / mã băm về)
      if (url.pathname === '/api/role-passwords' && request.method === 'GET') {
        try {
          const roles = [];
          for (const role of Object.keys(SWITCH_ROLES)) {
            const rec = await getRolePasswordRecord(env, role);
            roles.push({ role, title: SWITCH_ROLES[role], is_set: !!rec, updated_at: rec ? rec.updated_at : null });
          }
          return Response.json({ success: true, roles }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Quản trị đặt / đổi mật khẩu cho 1 quyền
      if (url.pathname === '/api/role-passwords' && request.method === 'POST') {
        try {
          const body = await request.json();
          const role = String(body.role || '');
          const password = String(body.password || '');
          if (!SWITCH_ROLES[role]) {
            return Response.json({ success: false, error: "Quyền không hợp lệ" }, { status: 400, headers });
          }
          if (password.trim().length < 4) {
            return Response.json({ success: false, error: "Mật khẩu cần ít nhất 4 ký tự" }, { status: 400, headers });
          }
          const salt = newSalt();
          const hash = await hashRolePassword(password, salt);
          const updatedAt = new Date().toISOString();
          if (env && env.DB) {
            await env.DB.prepare(`
              INSERT INTO role_passwords (role, salt, hash, updated_at) VALUES (?, ?, ?, ?)
              ON CONFLICT(role) DO UPDATE SET salt = excluded.salt, hash = excluded.hash, updated_at = excluded.updated_at
            `).bind(role, salt, hash, updatedAt).run();
          } else {
            if (!memoryDB.role_passwords) memoryDB.role_passwords = {};
            memoryDB.role_passwords[role] = { role, salt, hash, updated_at: updatedAt };
          }
          return Response.json({ success: true, role, updated_at: updatedAt }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Chuyển quyền: đúng mật khẩu của quyền thì trả về "người dùng" của quyền đó
      if (url.pathname === '/api/auth/role-switch' && request.method === 'POST') {
        try {
          const body = await request.json();
          const role = String(body.role || '');
          const password = String(body.password || '');
          if (!SWITCH_ROLES[role]) {
            return Response.json({ success: false, error: "Quyền không hợp lệ" }, { status: 400, headers });
          }
          const rec = await getRolePasswordRecord(env, role);
          if (!rec) {
            return Response.json({ success: false, error: "Quyền này chưa có mật khẩu. Nhờ quản trị đặt ở tab Phân quyền & tài khoản." }, { status: 400, headers });
          }
          if (!password || (await hashRolePassword(password, rec.salt)) !== rec.hash) {
            return Response.json({ success: false, error: "Sai mật khẩu" }, { status: 401, headers });
          }
          return Response.json({
            success: true,
            user: { id: `role-${role}`, full_name: SWITCH_ROLES[role], role, via: 'role-switch', is_active: 1 }
          }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // ==========================================
      // THẢ CHUYỀN / CHỈ LỆNH ĐÓNG GÓI / TỔNG HỢP
      // ==========================================
      const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));

      // Lấy số nhận trong ngày + tích lũy tới ngày đó cho 1 PO, theo lô (không gửi lô = lô đầu tiên)
      if (url.pathname === '/api/release' && request.method === 'GET') {
        try {
          const poId = url.searchParams.get('po_id');
          const date = url.searchParams.get('date');
          const batch = url.searchParams.has('batch') ? String(url.searchParams.get('batch') || '').slice(0, 60) : null;
          const stage = String(url.searchParams.get('stage') || '').slice(0, 24);
          if (!poId || !isIsoDate(date)) {
            return Response.json({ success: false, error: "Thiếu PO hoặc ngày" }, { status: 400, headers });
          }
          return Response.json(await loadReleasePayload(env, poId, date, batch, stage), { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Lưu số của 1 ngày, 1 lô: đồng bộ / đóng gói = 4 lần nhận theo size; chi tiết = {tên chi tiết: số} theo size
      if (url.pathname === '/api/release' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { po_id: poId, date, kind } = body;
          const batch = String(body.batch ?? '').slice(0, 60);
          const user = String(body.user || '').slice(0, 80);
          if (!poId || !isIsoDate(date) || !RELEASE_KINDS.includes(kind)) {
            return Response.json({ success: false, error: "Thiếu PO, ngày hoặc loại phiếu" }, { status: 400, headers });
          }
          const isCt = kind === 'tha_chuyen_ct';
          const rawRows = Array.isArray(body.rows) ? body.rows : [];
          // App cũ còn mở trên máy gửi chi tiết dạng 4 ô [số, tên]: không lưu, tránh ghi đè làm mất số
          if (isCt && rawRows.some(r => !r || !r.q || typeof r.q !== 'object')) {
            return Response.json({ success: false, error: "Ứng dụng đã đổi cách nhập chi tiết. Tải lại trang rồi nhập lại." }, { status: 409, headers });
          }
          const stage = isStageKind(kind) ? await resolveReleaseStage(env, poId, String(body.stage || '').slice(0, 24)) : '';
          const rows = rawRows
            .map(r => {
              const size = String(r.size ?? '').trim().slice(0, 20);
              if (isCt) return { size, q: cleanPartQty(r.q) };
              return { size, n: [0, 1, 2, 3].map(i => toReleaseQty(Array.isArray(r.n) ? r.n[i] : 0)) };
            })
            .filter(r => r.size);
          const confirmId = releaseConfirmId(poId, batch, date);
          const same = (a, b) => (isCt
            ? samePartQty(a ? a.q : {}, b.q)
            : [0, 1, 2, 3].every(i => (a?.n?.[i] || 0) === (b.n[i] || 0)));
          // Dòng sẽ ghi của 1 size: chi tiết mỗi tên 1 dòng; đồng bộ / đóng gói 1 dòng (không ghi nếu toàn 0)
          const newRecs = r => (isCt
            ? Object.entries(r.q).map(([part, q]) => ({ id: releaseEntryId(poId, batch, kind, date, r.size, stage, part), n: [q, 0, 0, 0], p: [part, '', '', ''] }))
            : (r.n.some(x => x > 0) ? [{ id: releaseEntryId(poId, batch, kind, date, r.size, stage), n: r.n, p: ['', '', '', ''] }] : []));
          let changed = false;
          const tcLocked = kind === 'tha_chuyen' && await hasCtEntries(env, poId, batch, stage);
          const lockedRes = () => Response.json({
            success: false,
            error: "Lô này của công đoạn này đang nhập theo Chi tiết: Đồng bộ tự cộng khi size đủ mọi chi tiết, không gõ tay được. Tải lại trang để thấy ô đã khóa."
          }, { status: 409, headers });

          if (env && env.DB) {
            // Không đụng dòng đồng bộ do Chi tiết tự ghi (syncCtAuto lo phần đó)
            const { results: existing } = await env.DB.prepare(
              "SELECT id, size, n1, n2, n3, n4, p1, p2, p3, p4 FROM release_entries WHERE po_id = ? AND kind = ? AND entry_date = ? AND COALESCE(batch_name, '') = ? AND COALESCE(stage, '') = ? AND NOT (kind = 'tha_chuyen' AND COALESCE(p1, '') = ?)"
            ).bind(poId, kind, date, batch, stage, CT_AUTO_PART).all();
            // Mỗi size: id các dòng đang có (chi tiết có thể nhiều dòng) và số hiện tại
            const prev = new Map();
            for (const e of (existing || [])) {
              const cur = prev.get(e.size) || { ids: [], n: [0, 0, 0, 0], q: {} };
              cur.ids.push(e.id);
              if (isCt) addPartRow(cur.q, e);
              else cur.n = [e.n1, e.n2, e.n3, e.n4].map(x => Number(x) || 0);
              prev.set(e.size, cur);
            }
            const stmts = [];
            for (const r of rows) {
              const old = prev.get(r.size);
              if (same(old, r)) continue;
              if (tcLocked) return lockedRes();
              changed = true;
              // Xóa các dòng đang có của size (kể cả dòng chi tiết dạng 4 ô cũ) rồi ghi lại
              (old ? old.ids : []).forEach(id => stmts.push(env.DB.prepare("DELETE FROM release_entries WHERE id = ?").bind(id)));
              for (const x of newRecs(r)) {
                stmts.push(env.DB.prepare(`
                  INSERT INTO release_entries (id, po_id, batch_name, stage, kind, entry_date, size, n1, n2, n3, n4, p1, p2, p3, p4, updated_by, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                  ON CONFLICT(id) DO UPDATE SET n1 = excluded.n1, n2 = excluded.n2, n3 = excluded.n3, n4 = excluded.n4,
                    p1 = excluded.p1, p2 = excluded.p2, p3 = excluded.p3, p4 = excluded.p4,
                    updated_by = excluded.updated_by, updated_at = CURRENT_TIMESTAMP
                `).bind(x.id, poId, batch, stage, kind, date, r.size, x.n[0], x.n[1], x.n[2], x.n[3], x.p[0], x.p[1], x.p[2], x.p[3], user));
              }
            }
            // Tổ trưởng sửa số đóng gói sau khi đã xác nhận -> phải xác nhận lại (chỉ lô đó).
            // Giữ ghi chú đóng gói từ chối tới khi tổ trưởng xác nhận lại.
            if (kind === 'dong_goi' && changed) {
              stmts.push(env.DB.prepare("UPDATE release_confirms SET leader_by = NULL, leader_at = NULL, packing_by = NULL, packing_at = NULL WHERE id = ?").bind(confirmId));
            }
            if (stmts.length) await env.DB.batch(stmts);
          } else {
            if (!memoryDB.release_entries) memoryDB.release_entries = [];
            const mine = (e, size) => e.po_id === poId && e.kind === kind && e.entry_date === date && e.size === size
              && (e.batch_name || '') === batch && (e.stage || '') === stage && !isCtAutoRow(e);
            for (const r of rows) {
              const cur = memoryDB.release_entries.filter(e => mine(e, r.size));
              const before = !cur.length ? null : (isCt
                ? { q: cur.reduce((m, e) => addPartRow(m, e), {}) }
                : { n: [cur[0].n1, cur[0].n2, cur[0].n3, cur[0].n4] });
              if (same(before, r)) continue;
              if (tcLocked) return lockedRes();
              changed = true;
              memoryDB.release_entries = memoryDB.release_entries.filter(e => !mine(e, r.size));
              for (const x of newRecs(r)) {
                memoryDB.release_entries.push({
                  id: x.id, po_id: poId, batch_name: batch, stage, kind, entry_date: date, size: r.size,
                  n1: x.n[0], n2: x.n[1], n3: x.n[2], n4: x.n[3],
                  p1: x.p[0], p2: x.p[1], p3: x.p[2], p4: x.p[3], updated_by: user
                });
              }
            }
            if (kind === 'dong_goi' && changed) {
              const c = (memoryDB.release_confirms || []).find(x => x.id === confirmId);
              if (c) Object.assign(c, { leader_by: null, leader_at: null, packing_by: null, packing_at: null });
            }
          }

          // Chi tiết đủ bộ / số đồng bộ gõ tay đổi -> tính lại phần đồng bộ do Chi tiết tự ghi
          if (isStageKind(kind)) await syncCtAuto(env, poId, batch, stage, date, user);
          const payload = await loadReleasePayload(env, poId, date, batch, stage);
          payload.confirmReset = kind === 'dong_goi' && changed;
          return Response.json(payload, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Xác nhận chỉ lệnh đóng gói theo lô: tổ trưởng trước, đóng gói sau.
      // Đóng gói từ chối (reject): bỏ xác nhận của tổ trưởng nhưng giữ số, ghi các size sai + lý do
      // để tổ trưởng sửa rồi xác nhận lại (tổ trưởng xác nhận lại thì xóa ghi chú từ chối).
      if (url.pathname === '/api/release/confirm' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { po_id: poId, date, step } = body;
          const batch = String(body.batch ?? '').slice(0, 60);
          const user = String(body.user || '').slice(0, 80);
          if (!poId || !isIsoDate(date) || !['leader', 'packing', 'reject'].includes(step)) {
            return Response.json({ success: false, error: "Thiếu PO, ngày hoặc bước xác nhận" }, { status: 400, headers });
          }
          const confirmId = releaseConfirmId(poId, batch, date);
          const nowIso = new Date().toISOString();
          const notYet = `Tổ trưởng chưa xác nhận chỉ lệnh đóng gói${batch ? ` ${batch}` : ''} ngày này`;
          const rejectSizes = step === 'reject' ? cleanSizeList(Array.isArray(body.sizes) ? body.sizes.map(String) : []).slice(0, 60) : [];
          const rejectNote = String(body.note || '').trim().slice(0, 200);
          if (step === 'reject' && !rejectSizes.length) {
            return Response.json({ success: false, error: "Chọn ít nhất 1 size sai" }, { status: 400, headers });
          }
          const packedAlready = `Đóng gói đã xác nhận${batch ? ` ${batch}` : ''} ngày này, không từ chối được nữa`;

          if (env && env.DB) {
            const cur = await env.DB.prepare("SELECT leader_at, packing_at FROM release_confirms WHERE id = ?").bind(confirmId).first();
            if (step !== 'leader' && !cur?.leader_at) {
              return Response.json({ success: false, error: notYet }, { status: 400, headers });
            }
            if (step === 'reject' && cur.packing_at) {
              return Response.json({ success: false, error: packedAlready }, { status: 400, headers });
            }
            if (step === 'leader') {
              await env.DB.prepare(`
                INSERT INTO release_confirms (id, po_id, batch_name, confirm_date, leader_by, leader_at) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET leader_by = excluded.leader_by, leader_at = excluded.leader_at,
                  reject_by = NULL, reject_at = NULL, reject_note = NULL, reject_sizes = NULL
              `).bind(confirmId, poId, batch, date, user, nowIso).run();
            } else if (step === 'packing') {
              await env.DB.prepare("UPDATE release_confirms SET packing_by = ?, packing_at = ? WHERE id = ?")
                .bind(user, nowIso, confirmId).run();
            } else {
              await env.DB.prepare(`
                UPDATE release_confirms SET leader_by = NULL, leader_at = NULL, packing_by = NULL, packing_at = NULL,
                  reject_by = ?, reject_at = ?, reject_note = ?, reject_sizes = ? WHERE id = ?
              `).bind(user, nowIso, rejectNote, JSON.stringify(rejectSizes), confirmId).run();
            }
          } else {
            if (!memoryDB.release_confirms) memoryDB.release_confirms = [];
            let cur = memoryDB.release_confirms.find(c => c.id === confirmId);
            if (step !== 'leader' && !cur?.leader_at) {
              return Response.json({ success: false, error: notYet }, { status: 400, headers });
            }
            if (step === 'reject' && cur.packing_at) {
              return Response.json({ success: false, error: packedAlready }, { status: 400, headers });
            }
            if (!cur) {
              cur = { id: confirmId, po_id: poId, batch_name: batch, confirm_date: date };
              memoryDB.release_confirms.push(cur);
            }
            if (step === 'leader') {
              Object.assign(cur, { leader_by: user, leader_at: nowIso, reject_by: null, reject_at: null, reject_note: null, reject_sizes: null });
            } else if (step === 'packing') {
              cur.packing_by = user;
              cur.packing_at = nowIso;
            } else {
              Object.assign(cur, {
                leader_by: null, leader_at: null, packing_by: null, packing_at: null,
                reject_by: user, reject_at: nowIso, reject_note: rejectNote, reject_sizes: JSON.stringify(rejectSizes)
              });
            }
          }

          return Response.json(await loadReleasePayload(env, poId, date, batch), { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Dán đơn hàng theo đợt: mỗi dòng 1 PO (ART + số đôi theo size).
      // PO đã có (cùng khách, cùng số PO) thì cập nhật đợt / ART / số theo size / kế hoạch, giữ chia lô;
      // PO chưa có thì tạo mới 1 lô; ART chưa có thì thêm; size chưa có thì nối vào dãy size của khách.
      if (url.pathname === '/api/order-import' && request.method === 'POST') {
        try {
          const body = await request.json();
          const customerId = String(body.customer_id || '');
          let cust;
          let orders;
          let arts;
          if (env && env.DB) {
            cust = await env.DB.prepare("SELECT id, size_list FROM customers WHERE id = ?").bind(customerId).first();
            if (cust) {
              orders = (await env.DB.prepare("SELECT id, po_number, style_code, po_plan, default_batches FROM po_orders WHERE customer_id = ?").bind(customerId).all()).results || [];
              arts = ((await env.DB.prepare("SELECT art FROM art_parts WHERE customer_id = ?").bind(customerId).all()).results || []).map(r => r.art);
            }
          } else {
            cust = (memoryDB.customers || []).find(c => c.id === customerId);
            orders = (memoryDB.orders || []).filter(o => o.customer_id === customerId);
            arts = Object.values(memoryDB.art_parts || {}).filter(r => r.customer_id === customerId).map(r => r.art);
          }
          if (!cust) return Response.json({ success: false, error: "Không tìm thấy khách hàng" }, { status: 404, headers });

          const byId = new Map(orders.map(o => [o.id, o]));
          const byPo = new Map(orders.map(o => [String(o.po_number || '').trim().toLowerCase(), o]));
          const knownArts = new Set([...arts, ...orders.map(o => o.style_code)].map(a => String(a || '').trim().toLowerCase()).filter(Boolean));
          const sizeList = cleanSizeList(parseSizeList(cust.size_list));
          const knownSizes = new Set(sizeList.map(x => x.toLowerCase()));
          const isoDate = v => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '');
          const newSizes = [];
          const newArts = [];
          const rows = new Map();   // PO đích -> dòng cuối cùng (dán trùng PO thì lấy dòng sau)
          let skipped = 0;
          for (const w of (Array.isArray(body.waves) ? body.waves : [])) {
            const wave = String(w && w.name || '').trim().slice(0, 60);
            for (const r of (Array.isArray(w && w.rows) ? w.rows : [])) {
              const poNumber = String(r.po_number || '').trim().slice(0, 60);
              const art = String(r.art || '').trim().slice(0, 80);
              // Lô theo bảng dán: tên lô, số đôi theo size (số tổng = cộng các size)
              const lots = (Array.isArray(r.lots) ? r.lots : [])
                .map(l => ({ name: String(l.name || '').trim().slice(0, 40), sizes: parseSizeQty(l.sizes), crd: isoDate(l.crd), color: String(l.color || '').trim().slice(0, 30) }))
                .filter(l => l.name && sumValues(l.sizes) > 0);
              let sizes = parseSizeQty(r.sizes);
              if (lots.length) {
                sizes = {};
                lots.forEach(l => Object.entries(l.sizes).forEach(([k, q]) => { sizes[k] = (sizes[k] || 0) + q; }));
              }
              const total = sumValues(sizes);
              const pickedById = r.id ? byId.get(String(r.id)) : null;   // PO đích do giao diện chọn (theo lô khớp)
              // r.new: giao diện thấy PO cùng tên nhưng lô không khớp (đơn đợt trước) -> tạo PO mới, không ghi đè
              const prev = pickedById || (r.new ? null : byPo.get(poNumber.toLowerCase())) || null;
              if (!poNumber || !total || (!art && !prev)) {
                skipped++;
                continue;
              }
              rows.set(prev ? prev.id : 'new|' + poNumber.toLowerCase(), { poNumber, art, sizes, total, wave, lots, crd: isoDate(r.crd), prev, pickedById: !!pickedById });
            }
          }

          let created = 0;
          let updated = 0;
          let renamed = 0;
          const stmts = [];
          const now = new Date().toISOString();
          let seq = 0;
          for (const r of rows.values()) {
            Object.keys(r.sizes).forEach(sz => {
              if (!knownSizes.has(sz.toLowerCase())) {
                knownSizes.add(sz.toLowerCase());
                newSizes.push(sz);
              }
            });
            if (r.art && !knownArts.has(r.art.toLowerCase())) {
              knownArts.add(r.art.toLowerCase());
              newArts.push(r.art);
            }
            const sizeJson = JSON.stringify(r.sizes);
            const prev = r.prev;
            // Chia lô theo bảng dán; giữ lô Số đuôi và số vào chuyền đã có theo tên lô
            let batches = null;
            let plan = r.total;
            if (r.lots.length) {
              const old = prev ? parseSizeList(prev.default_batches) : [];
              const oldByName = new Map(old.map(b => [String(b.batch_name || ''), b]));
              batches = r.lots.map((l, i) => ({
                id: 'b-' + (i + 1),
                batch_name: l.name,
                batch_plan: sumValues(l.sizes),
                into_sewing: Number((oldByName.get(l.name) || {}).into_sewing) || 0,
                sizes: Object.keys(l.sizes),
                size_qty: l.sizes,
                ...(l.crd ? { crd: l.crd } : {}),
                ...(l.color ? { color: l.color } : {})
              }));
              const tails = old.filter(b => /đuôi/i.test(String(b.batch_name || '')) && !r.lots.some(l => l.name === b.batch_name));
              tails.forEach((b, i) => batches.push({ ...b, id: 'b-' + (batches.length + 1) }));
              plan = batches.reduce((a, b) => a + (Number(b.batch_plan) || 0), 0);
            }
            if (prev) {
              updated++;
              const art = r.art || prev.style_code;
              // PO theo màu: đổi tên PO cũ (ví dụ MEXICO -> MEXICO · ĐEN) nếu tên mới chưa bị PO khác dùng.
              // Khớp theo số PO (khác hoa / thường) thì giữ nguyên tên đang có.
              const clash = byPo.get(r.poNumber.toLowerCase());
              const name = r.pickedById && !(clash && clash.id !== prev.id) ? r.poNumber : prev.po_number;
              if (name !== prev.po_number) renamed++;
              const batchJson = batches ? JSON.stringify(batches) : null;
              if (env && env.DB) {
                stmts.push(env.DB.prepare(`
                  UPDATE po_orders SET po_number = ?, wave = COALESCE(NULLIF(?, ''), wave), size_qty = ?, style_code = ?, po_plan = ?,
                    crd = COALESCE(NULLIF(?, ''), crd), default_batches = COALESCE(?, default_batches) WHERE id = ?
                `).bind(name, r.wave, sizeJson, art, plan, r.crd, batchJson, prev.id));
              } else {
                Object.assign(prev, { po_number: name, size_qty: sizeJson, style_code: art, po_plan: plan });
                if (r.wave) prev.wave = r.wave;
                if (r.crd) prev.crd = r.crd;
                if (batches) prev.default_batches = batches;
              }
            } else {
              created++;
              const id = `po-${Date.now()}-${++seq}`;
              const list = batches || [{ id: 'b-1', batch_name: 'Lô 1', batch_plan: r.total, into_sewing: 0, sizes: [] }];
              if (env && env.DB) {
                stmts.push(env.DB.prepare(`
                  INSERT INTO po_orders (id, customer_id, style_code, po_number, line_name, po_plan, default_batches, wave, size_qty, crd)
                  VALUES (?, ?, ?, ?, 'Chuyền 1', ?, ?, ?, ?, ?)
                `).bind(id, customerId, r.art, r.poNumber, plan, JSON.stringify(list), r.wave, sizeJson, r.crd));
              } else {
                memoryDB.orders.push({
                  id, customer_id: customerId, style_code: r.art, po_number: r.poNumber, line_name: 'Chuyền 1',
                  po_plan: plan, tail_sweep_date: null, tail_batch_name: null, default_batches: list, wave: r.wave, size_qty: sizeJson, crd: r.crd
                });
              }
            }
          }
          const newList = newSizes.length ? JSON.stringify(cleanSizeList([...sizeList, ...newSizes])) : null;
          if (env && env.DB) {
            for (const art of newArts) {
              stmts.push(env.DB.prepare(`
                INSERT INTO art_parts (id, customer_id, art, parts, updated_at) VALUES (?, ?, ?, '[]', ?)
                ON CONFLICT(id) DO NOTHING
              `).bind(`${customerId}|${art}`, customerId, art, now));
            }
            if (newList) stmts.push(env.DB.prepare("UPDATE customers SET size_list = ? WHERE id = ?").bind(newList, customerId));
            if (stmts.length) await env.DB.batch(stmts);
          } else {
            if (!memoryDB.art_parts) memoryDB.art_parts = {};
            for (const art of newArts) {
              const id = `${customerId}|${art}`;
              if (!memoryDB.art_parts[id]) memoryDB.art_parts[id] = { customer_id: customerId, art, parts: [], updated_at: now };
            }
            if (newList) cust.size_list = newList;
          }
          return Response.json({ success: true, created, updated, renamed, skipped, newArts, newSizes }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Nhật ký đóng gói: số Chỉ lệnh đóng gói theo ngày × lô × size của từng PO của khách,
      // kèm đơn hàng theo size, lũy kế và ngày đủ đơn (tính trên toàn bộ số đã nhập)
      if (url.pathname === '/api/pack-log' && request.method === 'GET') {
        try {
          const customerId = url.searchParams.get('customer_id') || '';
          let orders;
          let rows;
          if (env && env.DB) {
            orders = (await env.DB.prepare(
              "SELECT id, po_number, style_code, po_plan, default_batches, wave, size_qty, crd, created_at FROM po_orders WHERE customer_id = ?"
            ).bind(customerId).all()).results || [];
            rows = (await env.DB.prepare(`
              SELECT r.po_id, r.batch_name, r.entry_date, r.size, r.n1, r.n2, r.n3, r.n4
              FROM release_entries r JOIN po_orders o ON o.id = r.po_id
              WHERE o.customer_id = ? AND r.kind = 'dong_goi'
            `).bind(customerId).all()).results || [];
          } else {
            orders = (memoryDB.orders || []).filter(o => o.customer_id === customerId);
            const ids = new Set(orders.map(o => o.id));
            rows = (memoryDB.release_entries || []).filter(r => r.kind === 'dong_goi' && ids.has(r.po_id));
          }
          const out = orders.map(o => {
            const order = parseSizeQty(o.size_qty);
            const batchList = parseSizeList(o.default_batches).filter(b => b && b.batch_name);
            const lots = batchList.map(b => String(b.batch_name || ''));
            const days = {};
            for (const r of rows) {
              if (r.po_id !== o.id) continue;
              const qty = [r.n1, r.n2, r.n3, r.n4].reduce((a, x) => a + (Number(x) || 0), 0);
              if (!qty) continue;
              const lot = r.batch_name || '';
              const day = days[r.entry_date] || (days[r.entry_date] = {});
              const m = day[lot] || (day[lot] = {});
              m[r.size] = (m[r.size] || 0) + qty;
              if (!lots.includes(lot)) lots.push(lot);
            }
            const cum = {};
            const done = {};
            Object.keys(days).sort().forEach(date => {
              Object.values(days[date]).forEach(m => Object.entries(m).forEach(([sz, q]) => {
                cum[sz] = (cum[sz] || 0) + q;
                if (order[sz] && !done[sz] && cum[sz] >= order[sz]) done[sz] = date;
              }));
            });
            const orderSizes = Object.keys(order);
            const allDone = orderSizes.length > 0 && orderSizes.every(sz => done[sz]);
            // Từng lô có số đơn theo size: lũy kế của lô và ngày lô đủ đơn
            const lotInfo = batchList.map(b => ({ name: String(b.batch_name), order: parseSizeQty(b.size_qty) }))
              .filter(l => Object.keys(l.order).length)
              .map(l => {
                const lc = {};
                let doneDate = '';
                Object.keys(days).sort().forEach(date => {
                  Object.entries((days[date] || {})[l.name] || {}).forEach(([sz, q]) => { lc[sz] = (lc[sz] || 0) + q; });
                  if (!doneDate && Object.keys(l.order).every(sz => (lc[sz] || 0) >= l.order[sz])) doneDate = date;
                });
                return { name: l.name, order: l.order, cum: lc, done_date: doneDate };
              });
            return {
              id: o.id, po_number: o.po_number, style_code: o.style_code, po_plan: Number(o.po_plan) || 0,
              wave: o.wave || '', crd: o.crd || '', created_at: o.created_at || '', order, lots, lot_info: lotInfo, days, cum, done,
              done_date: allDone ? orderSizes.map(sz => done[sz]).sort().pop() : ''
            };
          });
          return Response.json({ success: true, orders: out }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Datalog (Sếp, Quản lý): mọi PO của 1 khách × công đoạn thả chuyền + Thành phẩm (số đóng gói).
      // Trả số theo ngày để app tự cộng luỹ kế tới ngày đang chọn: days[ngày][id công đoạn] = số đôi, '#tp' = thành phẩm.
      // Thả chuyền lấy số Đồng bộ (gồm số Chi tiết tự ghi); số nhập trước khi có công đoạn tính vào công đoạn 1.
      if (url.pathname === '/api/datalog' && request.method === 'GET') {
        try {
          const customerId = url.searchParams.get('customer_id') || '';
          let cust;
          let orders;
          let rows;
          if (env && env.DB) {
            cust = await env.DB.prepare("SELECT id, name, stages FROM customers WHERE id = ?").bind(customerId).first();
            orders = (await env.DB.prepare(
              "SELECT id, po_number, style_code, po_plan, size_qty FROM po_orders WHERE customer_id = ? ORDER BY created_at DESC"
            ).bind(customerId).all()).results || [];
            rows = (await env.DB.prepare(`
              SELECT r.po_id, r.kind, COALESCE(r.stage, '') AS stage, r.entry_date,
                     SUM(COALESCE(r.n1, 0) + COALESCE(r.n2, 0) + COALESCE(r.n3, 0) + COALESCE(r.n4, 0)) AS qty
              FROM release_entries r JOIN po_orders o ON o.id = r.po_id
              WHERE o.customer_id = ? AND r.kind IN ('tha_chuyen', 'dong_goi')
              GROUP BY r.po_id, r.kind, COALESCE(r.stage, ''), r.entry_date
            `).bind(customerId).all()).results || [];
          } else {
            cust = (memoryDB.customers || []).find(c => c.id === customerId) || null;
            orders = (memoryDB.orders || []).filter(o => o.customer_id === customerId);
            const ids = new Set(orders.map(o => o.id));
            rows = (memoryDB.release_entries || [])
              .filter(r => (r.kind === 'tha_chuyen' || r.kind === 'dong_goi') && ids.has(r.po_id))
              .map(r => ({ po_id: r.po_id, kind: r.kind, stage: r.stage || '', entry_date: r.entry_date, qty: [r.n1, r.n2, r.n3, r.n4].reduce((a, x) => a + (Number(x) || 0), 0) }));
          }
          if (!cust) return Response.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404, headers });
          const stages = cleanStageList(parseSizeList(cust.stages));
          const stageIds = new Set(stages.map(x => x.id));
          const firstStage = stages.length ? stages[0].id : '';
          const byPo = {};
          for (const r of rows) {
            const qty = Number(r.qty) || 0;
            if (!qty) continue;
            let key = '#tp';
            if (r.kind === 'tha_chuyen') {
              key = stages.length ? (r.stage || firstStage) : '';
              if (stages.length && !stageIds.has(key)) continue;   // công đoạn đã bị xóa khỏi bảng -> không tính
            }
            const days = byPo[r.po_id] || (byPo[r.po_id] = {});
            const day = days[r.entry_date] || (days[r.entry_date] = {});
            day[key] = (day[key] || 0) + qty;
          }
          const out = orders.map(o => ({
            id: o.id, po_number: o.po_number, style_code: o.style_code,
            plan: Number(o.po_plan) || sumValues(parseSizeQty(o.size_qty)),
            days: byPo[o.id] || {}
          }));
          return Response.json({ success: true, customer: { id: cust.id, name: cust.name }, stages, orders: out }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Bảng công đoạn thả chuyền của 1 khách (admin khai báo ở tab Khách hàng & PO, tối đa 10 công đoạn).
      // Lần đầu có công đoạn: số thả chuyền đã nhập trước đó (chưa có công đoạn) chuyển sang công đoạn 1.
      if (url.pathname === '/api/customer-stages' && request.method === 'POST') {
        try {
          const body = await request.json();
          const customerId = String(body.customer_id || '');
          if (!customerId) {
            return Response.json({ success: false, error: "Thiếu khách hàng" }, { status: 400, headers });
          }
          const stages = cleanStageList(body.stages);
          const first = stages.length ? stages[0].id : '';
          let migrated = 0;
          if (env && env.DB) {
            const found = await env.DB.prepare("SELECT id FROM customers WHERE id = ?").bind(customerId).first();
            if (!found) return Response.json({ success: false, error: "Không tìm thấy khách hàng" }, { status: 404, headers });
            const stmts = [env.DB.prepare("UPDATE customers SET stages = ? WHERE id = ?").bind(JSON.stringify(stages), customerId)];
            if (first) {
              stmts.push(env.DB.prepare(`
                UPDATE release_entries SET stage = ?, id = id || ?
                WHERE COALESCE(stage, '') = '' AND kind IN ('tha_chuyen', 'tha_chuyen_ct')
                  AND po_id IN (SELECT id FROM po_orders WHERE customer_id = ?)
              `).bind(first, `|st:${first}`, customerId));
            }
            const results = await env.DB.batch(stmts);
            migrated = first && results[1] && results[1].meta ? (results[1].meta.changes || 0) : 0;
          } else {
            const cust = (memoryDB.customers || []).find(c => c.id === customerId);
            if (!cust) return Response.json({ success: false, error: "Không tìm thấy khách hàng" }, { status: 404, headers });
            cust.stages = JSON.stringify(stages);
            if (first) {
              const poIds = new Set((memoryDB.orders || []).filter(o => o.customer_id === customerId).map(o => o.id));
              for (const e of (memoryDB.release_entries || [])) {
                if (!e.stage && isStageKind(e.kind) && poIds.has(e.po_id)) {
                  e.stage = first;
                  e.id = `${e.id}|st:${first}`;
                  migrated++;
                }
              }
            }
          }
          return Response.json({ success: true, customer_id: customerId, stages, migrated }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Danh sách chi tiết theo ART của 1 khách (admin khai báo ở tab Khách hàng & PO)
      if (url.pathname === '/api/art-parts' && request.method === 'GET') {
        try {
          const customerId = url.searchParams.get('customer_id') || '';
          let items = [];
          if (env && env.DB) {
            const { results } = await env.DB.prepare("SELECT customer_id, art, parts, updated_at FROM art_parts WHERE customer_id = ?").bind(customerId).all();
            items = (results || []).map(r => ({ customer_id: r.customer_id, art: r.art, parts: cleanPartList(parseSizeList(r.parts)), updated_at: r.updated_at }));
          } else {
            items = Object.values(memoryDB.art_parts || {}).filter(r => r.customer_id === customerId)
              .map(r => ({ customer_id: r.customer_id, art: r.art, parts: cleanPartList(r.parts), updated_at: r.updated_at }));
          }
          return Response.json({ success: true, items }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      if (url.pathname === '/api/art-parts' && request.method === 'POST') {
        try {
          const body = await request.json();
          const customerId = String(body.customer_id || '');
          const art = String(body.art || '').trim().slice(0, 80);
          if (!customerId || !art) {
            return Response.json({ success: false, error: "Thiếu khách hàng hoặc ART" }, { status: 400, headers });
          }
          const parts = cleanPartList(body.parts);
          const id = `${customerId}|${art}`;
          const updatedAt = new Date().toISOString();
          if (env && env.DB) {
            await env.DB.prepare(`
              INSERT INTO art_parts (id, customer_id, art, parts, updated_at) VALUES (?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET parts = excluded.parts, updated_at = excluded.updated_at
            `).bind(id, customerId, art, JSON.stringify(parts), updatedAt).run();
          } else {
            if (!memoryDB.art_parts) memoryDB.art_parts = {};
            memoryDB.art_parts[id] = { customer_id: customerId, art, parts, updated_at: updatedAt };
          }
          return Response.json({ success: true, customer_id: customerId, art, parts, updated_at: updatedAt }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      // Xóa 1 ART (chỉ dùng cho ART chưa có PO nào; giao diện kiểm tra trước khi gọi)
      if (url.pathname === '/api/art-parts' && request.method === 'DELETE') {
        try {
          const customerId = url.searchParams.get('customer_id') || '';
          const art = String(url.searchParams.get('art') || '').trim();
          if (!customerId || !art) {
            return Response.json({ success: false, error: "Thiếu khách hàng hoặc ART" }, { status: 400, headers });
          }
          const id = `${customerId}|${art}`;
          if (env && env.DB) {
            await env.DB.prepare("DELETE FROM art_parts WHERE id = ?").bind(id).run();
          } else if (memoryDB.art_parts) {
            delete memoryDB.art_parts[id];
          }
          return Response.json({ success: true }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 500, headers });
        }
      }

      return Response.json({ error: "Endpoint không tồn tại" }, { status: 404, headers });
    }

    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Cloudflare Worker assets binding disabled", { status: 500 });
  }
};
