// Memory database initial seed (fallback for local dev without D1)
const INITIAL_DB = {
  customers: [
    { id: "cust-1", code: "D&D", name: "D&D Long An" },
    { id: "cust-2", code: "ADIDAS", name: "Adidas Global Procurement" },
    { id: "cust-3", code: "NIKE", name: "Nike Apparel Vietnam" }
  ],
  orders: [
    {
      id: "po-050",
      customer_id: "cust-2", // Adidas
      style_code: "Mã Style Alpha 050",
      po_number: "PO-050",
      line_name: "Chuyền 1 - Xưởng 2",
      po_plan: 1623,
      default_batches: [
        { id: "b1", batch_name: "Lô 1", batch_plan: 1230, into_sewing: 1230 },
        { id: "b2", batch_name: "Lô 2", batch_plan: 267, into_sewing: 267 },
        { id: "b3", batch_name: "Số đuôi", batch_plan: 126, into_sewing: 126 }
      ]
    },
    {
      id: "po-dd-01",
      customer_id: "cust-1", // D&D
      style_code: "Áo Polo DD-01",
      po_number: "PO-DD-01",
      line_name: "Chuyền 2",
      po_plan: 2000,
      default_batches: [
        { id: "b-dd1", batch_name: "Lô 1", batch_plan: 1000, into_sewing: 1000 },
        { id: "b-dd2", batch_name: "Lô 2", batch_plan: 1000, into_sewing: 1000 }
      ]
    },
    {
      id: "po-nk-01",
      customer_id: "cust-3", // Nike
      style_code: "Quần Short NK-99",
      po_number: "PO-NK-01",
      line_name: "Chuyền 3",
      po_plan: 1500,
      default_batches: [
        { id: "b-nk1", batch_name: "Lô 1", batch_plan: 750, into_sewing: 750 },
        { id: "b-nk2", batch_name: "Lô 2", batch_plan: 750, into_sewing: 750 }
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
          shortage_note: "Thiếu 1 phôi hỏng"
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
          shortage_note: "Lỗi vải 17 đôi"
        }
      ]
    },
    "po-050_2026-09-23": {
      po_id: "po-050",
      report_date: "2026-09-23",
      status: "DRAFT",
      batches: [
        {
          id: "b1",
          batch_name: "Lô 1",
          batch_plan: 1230,
          into_sewing: 1230,
          wip_sewing: 150,
          wip_qc: 50,
          wip_pairing: 200,
          wip_packing: 100,
          wip_warehouse: 0,
          daily_out: 200,
          note_sewing: "",
          note_qc: "",
          note_pairing: "",
          note_packing: "",
          note_warehouse: "",
          shortage_reason_type: "",
          shortage_note: ""
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
      "Số đuôi": [
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ]
    }
  },
  flow_logs: [],
  users: [
    { id: "usr-admin-1", phone: "0900000000", full_name: "Sếp Tổng Quản Lý", role: "admin", pin_code: "1234", is_active: 1 },
    { id: "usr-mgr-1", phone: "0988888888", full_name: "Tổ Trưởng Chuyền 1", role: "manager", pin_code: "1234", is_active: 1 },
    { id: "usr-wrk-1", phone: "0911111111", full_name: "Công Nhân Kiểm Kê", role: "worker", pin_code: "1234", is_active: 1 }
  ]
};

let memoryDB = JSON.parse(JSON.stringify(INITIAL_DB));

// Helper: Normalize phone numbers (e.g. +84901234567 -> 0901234567 or vice versa)
function normalizePhone(p) {
  if (!p) return "";
  let clean = p.replace(/\s+/g, "").replace(/-/g, "");
  if (clean.startsWith("+84")) {
    clean = "0" + clean.substring(3);
  }
  return clean;
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
        shortage_reason_type TEXT,
        shortage_note TEXT
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
        phone TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'worker',
        pin_code TEXT DEFAULT '1234',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const sql of tableStatements) {
      try {
        await db.prepare(sql).run();
      } catch (tableErr) {
        console.warn("Table create notice:", tableErr.message);
      }
    }

    // Check if customers empty, then seed
    try {
      const { results: existingCust } = await db.prepare("SELECT COUNT(*) as count FROM customers").all();
      if (existingCust && existingCust[0] && existingCust[0].count === 0) {
        for (const c of INITIAL_DB.customers) {
          await db.prepare("INSERT INTO customers (id, name, code) VALUES (?, ?, ?)").bind(c.id, c.name, c.code).run();
        }
        for (const o of INITIAL_DB.orders) {
          await db.prepare("INSERT INTO po_orders (id, customer_id, style_code, po_number, line_name, po_plan, default_batches) VALUES (?, ?, ?, ?, ?, ?, ?)")
            .bind(o.id, o.customer_id, o.style_code, o.po_number, o.line_name, o.po_plan, JSON.stringify(o.default_batches))
            .run();
        }
      }
    } catch (seedErr) {
      console.warn("Cust seed notice:", seedErr.message);
    }

    // Check if users empty, then seed initial admin
    try {
      const { results: existingUsers } = await db.prepare("SELECT COUNT(*) as count FROM users").all();
      if (existingUsers && existingUsers[0] && existingUsers[0].count === 0) {
        for (const u of INITIAL_DB.users) {
          await db.prepare("INSERT INTO users (id, phone, full_name, role, pin_code, is_active) VALUES (?, ?, ?, ?, ?, ?)")
            .bind(u.id, u.phone, u.full_name, u.role, u.pin_code, u.is_active)
            .run();
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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS Headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json; charset=utf-8'
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

      // 1. Phone / OTP / PIN Authentication
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
              // If this is the very first user, make them admin
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

      // 2. Admin: Get List of All Users
      if (url.pathname === '/api/admin/users' && request.method === 'GET') {
        if (env && env.DB) {
          try {
            const { results: users } = await env.DB.prepare("SELECT id, phone, full_name, role, pin_code, is_active, created_at FROM users ORDER BY role ASC, created_at DESC").all();
            return Response.json({ success: true, users: users || [] }, { headers });
          } catch (err) {
            return Response.json({ success: false, error: err.message }, { status: 500, headers });
          }
        }
        return Response.json({ success: true, users: memoryDB.users || [] }, { headers });
      }

      // 3. Admin: Add / Update User & Permissions
      if (url.pathname === '/api/admin/users' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { id, phone, full_name, role, pin_code, is_active } = body;
          const cleanPhone = normalizePhone(phone);
          const userId = id || ('usr-' + Date.now());

          if (env && env.DB) {
            await env.DB.prepare(`
              INSERT INTO users (id, phone, full_name, role, pin_code, is_active)
              VALUES (?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                phone=excluded.phone,
                full_name=excluded.full_name,
                role=excluded.role,
                pin_code=excluded.pin_code,
                is_active=excluded.is_active,
                updated_at=CURRENT_TIMESTAMP
            `).bind(userId, cleanPhone, full_name || 'Nhân Viên', role || 'worker', pin_code || '1234', is_active !== undefined ? is_active : 1).run();

            const { results: users } = await env.DB.prepare("SELECT id, phone, full_name, role, pin_code, is_active, created_at FROM users ORDER BY role ASC, created_at DESC").all();
            return Response.json({ success: true, users }, { headers });
          }

          if (id) {
            const idx = memoryDB.users.findIndex(u => u.id === id);
            if (idx >= 0) {
              memoryDB.users[idx] = {
                ...memoryDB.users[idx],
                phone: cleanPhone,
                full_name: full_name || memoryDB.users[idx].full_name,
                role: role || memoryDB.users[idx].role,
                pin_code: pin_code || memoryDB.users[idx].pin_code,
                is_active: is_active !== undefined ? is_active : memoryDB.users[idx].is_active
              };
            }
          } else {
            memoryDB.users.push({
              id: userId,
              phone: cleanPhone,
              full_name: full_name || 'Nhân Viên',
              role: role || 'worker',
              pin_code: pin_code || '1234',
              is_active: 1,
              created_at: new Date().toISOString()
            });
          }
          return Response.json({ success: true, users: memoryDB.users }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // 4. Admin: Delete User
      if (url.pathname === '/api/admin/users' && request.method === 'DELETE') {
        try {
          const userId = url.searchParams.get('id');
          if (env && env.DB) {
            await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
            const { results: users } = await env.DB.prepare("SELECT id, phone, full_name, role, pin_code, is_active, created_at FROM users ORDER BY role ASC, created_at DESC").all();
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
            const { results: customers } = await env.DB.prepare("SELECT * FROM customers ORDER BY name ASC").all();
            const { results: ordersRaw } = await env.DB.prepare("SELECT * FROM po_orders ORDER BY created_at DESC").all();
            const orders = (ordersRaw || []).map(o => ({
              ...o,
              default_batches: typeof o.default_batches === 'string' ? JSON.parse(o.default_batches || '[]') : (o.default_batches || [])
            }));
            return Response.json({
              success: true,
              customers: customers || [],
              orders: orders || [],
              current_date: new Date().toISOString().split('T')[0]
            }, { headers });
          } catch (err) {
            console.error("D1 Metadata Query Error:", err);
          }
        }

        return Response.json({
          success: true,
          customers: memoryDB.customers,
          orders: memoryDB.orders,
          current_date: new Date().toISOString().split('T')[0]
        }, { headers });
      }

      // Add / Update Customer
      if (url.pathname === '/api/customers' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { id, name, code } = body;

          if (env && env.DB) {
            const custId = id || ('cust-' + Date.now());
            await env.DB.prepare("INSERT OR REPLACE INTO customers (id, name, code) VALUES (?, ?, ?)")
              .bind(custId, name, code)
              .run();
            const { results: customers } = await env.DB.prepare("SELECT * FROM customers ORDER BY name ASC").all();
            return Response.json({ success: true, customers }, { headers });
          }

          if (id) {
            const idx = memoryDB.customers.findIndex(c => c.id === id);
            if (idx >= 0) memoryDB.customers[idx] = { id, name, code };
          } else {
            memoryDB.customers.push({ id: 'cust-' + Date.now(), name, code });
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
          const { id, customer_id, style_code, po_number, line_name, po_plan, default_batches } = body;
          
          let parsedBatches = default_batches || [];
          if (typeof parsedBatches === 'string') {
            parsedBatches = parsedBatches.split(',').map((it, i) => {
              const parts = it.split(':');
              const bName = parts[0].trim() || `Lô ${i+1}`;
              const bQty = parts[1] ? Number(parts[1].trim()) : 0;
              return { id: 'b-' + (i+1), batch_name: bName, batch_plan: bQty, into_sewing: bQty };
            });
          }

          const orderId = id || ('po-' + Date.now());

          if (env && env.DB) {
            await env.DB.prepare("INSERT OR REPLACE INTO po_orders (id, customer_id, style_code, po_number, line_name, po_plan, default_batches) VALUES (?, ?, ?, ?, ?, ?, ?)")
              .bind(orderId, customer_id, style_code || 'Mã Style', po_number || 'PO-001', line_name || 'Chuyền 1', Number(po_plan) || 0, JSON.stringify(parsedBatches))
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
                id,
                customer_id,
                style_code,
                po_number,
                line_name,
                po_plan: Number(po_plan) || 0,
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
              default_batches: parsedBatches.length > 0 ? parsedBatches : [
                { id: 'b-1', batch_name: "Lô 1", batch_plan: Number(po_plan) || 1000, into_sewing: Number(po_plan) || 1000 }
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
        const poId = url.searchParams.get('po_id') || 'po-050';
        const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
        const key = `${poId}_${date}`;

        if (env && env.DB) {
          try {
            const { results: repRows } = await env.DB.prepare("SELECT * FROM daily_reports WHERE id = ?").bind(key).all();
            let report = null;
            if (repRows && repRows.length > 0) {
              const { results: batchRows } = await env.DB.prepare("SELECT * FROM report_batches WHERE report_id = ? ORDER BY batch_name ASC").bind(key).all();
              report = {
                po_id: poId,
                report_date: date,
                status: repRows[0].status || "DRAFT",
                batches: batchRows || []
              };
            }

            if (!report) {
              const { results: ordRows } = await env.DB.prepare("SELECT * FROM po_orders WHERE id = ?").bind(poId).all();
              const order = ordRows && ordRows[0] ? {
                ...ordRows[0],
                default_batches: typeof ordRows[0].default_batches === 'string' ? JSON.parse(ordRows[0].default_batches || '[]') : []
              } : null;

              const batches = order && order.default_batches ? order.default_batches.map((b, i) => ({
                id: 'b-' + (i+1),
                batch_name: b.batch_name,
                batch_plan: b.batch_plan,
                into_sewing: b.into_sewing,
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
              })) : [];

              report = { po_id: poId, report_date: date, status: "DRAFT", batches };
            }

            // Cumulative export calculation
            const { results: allBatchExports } = await env.DB.prepare(
              "SELECT batch_name, SUM(daily_out) as total_out FROM report_batches WHERE po_id = ? AND report_date <= ? GROUP BY batch_name"
            ).bind(poId, date).all();

            const cumExportsByBatch = {};
            (allBatchExports || []).forEach(r => {
              cumExportsByBatch[r.batch_name] = Number(r.total_out) || 0;
            });

            return Response.json({ success: true, report, cumExportsByBatch }, { headers });
          } catch (err) {
            console.error("D1 Report Query Error:", err);
          }
        }

        let report = memoryDB.reports[key];
        if (!report) {
          const order = memoryDB.orders.find(o => o.id === poId);
          const batches = order && order.default_batches ? order.default_batches.map((b, i) => ({
            id: 'b-' + (i+1),
            batch_name: b.batch_name,
            batch_plan: b.batch_plan,
            into_sewing: b.into_sewing,
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
          })) : [];

          report = { po_id: poId, report_date: date, status: "DRAFT", batches };
        }

        const allKeys = Object.keys(memoryDB.reports).filter(k => k.startsWith(poId + '_')).sort();
        const cumExportsByBatch = {};
        allKeys.forEach(k => {
          const repDate = k.replace(poId + '_', '');
          if (repDate <= date) {
            const rep = memoryDB.reports[k];
            if (rep && rep.batches) {
              rep.batches.forEach(b => {
                cumExportsByBatch[b.batch_name] = (cumExportsByBatch[b.batch_name] || 0) + (Number(b.daily_out) || 0);
              });
            }
          }
        });

        return Response.json({ success: true, report, cumExportsByBatch }, { headers });
      }

      // Save Report
      if (url.pathname === '/api/report' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { po_id, report_date, status, batches } = body;
          const key = `${po_id}_${report_date}`;

          if (env && env.DB) {
            await env.DB.prepare("INSERT OR REPLACE INTO daily_reports (id, po_id, report_date, status) VALUES (?, ?, ?, ?)")
              .bind(key, po_id, report_date, status || 'DRAFT')
              .run();

            // Clear old batch records for this report
            await env.DB.prepare("DELETE FROM report_batches WHERE report_id = ?").bind(key).run();

            // Insert batches
            for (const b of (batches || [])) {
              const bId = b.id || ('rb-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5));
              await env.DB.prepare(`
                INSERT INTO report_batches (
                  id, report_id, po_id, report_date, batch_name, batch_plan, into_sewing, delivered,
                  wip_sewing, wip_qc, wip_pairing, wip_packing, wip_warehouse,
                  note_sewing, note_qc, note_pairing, note_packing, note_warehouse,
                  shortage_reason_type, shortage_note
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).bind(
                bId, key, po_id, report_date, b.batch_name, Number(b.batch_plan) || 0, Number(b.into_sewing) || 0, Number(b.daily_out || b.delivered) || 0,
                Number(b.wip_sewing) || 0, Number(b.wip_qc) || 0, Number(b.wip_pairing) || 0, Number(b.wip_packing) || 0, Number(b.wip_warehouse) || 0,
                b.note_sewing || '', b.note_qc || '', b.note_pairing || '', b.note_packing || '', b.note_warehouse || '',
                b.shortage_reason_type || '', b.shortage_note || ''
              ).run();
            }

            return Response.json({ success: true, message: "Đã lưu báo cáo thành công vào D1 Database" }, { headers });
          }

          memoryDB.reports[key] = {
            po_id,
            report_date,
            status: status || "DRAFT",
            batches
          };

          return Response.json({ success: true, message: "Đã lưu báo cáo thành công" }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // Get Report History (Thống Kê Lô Tất Cả Các Ngày)
      if (url.pathname === '/api/report-history' && request.method === 'GET') {
        const poId = url.searchParams.get('po_id') || 'po-050';

        if (env && env.DB) {
          try {
            const { results: history } = await env.DB.prepare(
              "SELECT * FROM report_batches WHERE po_id = ? ORDER BY report_date ASC, batch_name ASC"
            ).bind(poId).all();
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
            const { results: logsRows } = await env.DB.prepare(
              "SELECT * FROM dept_logs WHERE po_id = ? ORDER BY batch_name ASC, row_order ASC"
            ).bind(poId).all();

            const logs = {};
            (logsRows || []).forEach(r => {
              if (!logs[r.batch_name]) logs[r.batch_name] = [];
              logs[r.batch_name].push({
                date: r.log_date || "",
                nhap_phoi: r.nhap_phoi,
                giao_dg: r.giao_dg,
                nhap_kho: r.nhap_kho,
                xuat_kho: r.xuat_kho
              });
            });

            return Response.json({ success: true, logs }, { headers });
          } catch (err) {
            console.error("D1 Dept Logs Query Error:", err);
          }
        }

        const logs = memoryDB.dept_logs ? (memoryDB.dept_logs[poId] || {}) : {};
        return Response.json({ success: true, logs }, { headers });
      }

      // Save Dept Logs (Tab 3)
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
                  INSERT INTO dept_logs (id, po_id, batch_name, log_date, nhap_phoi, giao_dg, nhap_kho, xuat_kho, row_order)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                  rowId, po_id, bName, r.date || '',
                  Number(r.nhap_phoi) || 0, Number(r.giao_dg) || 0, Number(r.nhap_kho) || 0, Number(r.xuat_kho) || 0, i
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

      return Response.json({ error: "Endpoint không tồn tại" }, { status: 404, headers });
    }

    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Cloudflare Worker assets binding disabled", { status: 500 });
  }
};
