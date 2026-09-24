// Memory database initial seed
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
        { id: "b3", batch_name: "Lô 3", batch_plan: 126, into_sewing: 126 }
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
          wip_sewing: 0,
          wip_qc: 0,
          wip_pairing: 0,
          wip_packing: 111,
          wip_warehouse: 120,
          daily_out: 350,
          note_sewing: "",
          note_qc: "",
          note_pairing: "",
          note_packing: "Hoàn thiện 111",
          note_warehouse: "Kho nội bộ",
          shortage_reason_type: "Khác",
          shortage_note: "Thiếu phôi hỏng"
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
          shortage_note: "17 đôi dập bù"
        },
        {
          id: "b3",
          batch_name: "Lô 3",
          batch_plan: 126,
          into_sewing: 126,
          wip_sewing: 80,
          wip_qc: 46,
          wip_pairing: 0,
          wip_packing: 0,
          wip_warehouse: 0,
          daily_out: 0,
          note_sewing: "Line 1",
          note_qc: "QC 1",
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
        { date: "19-Sep", nhap_phoi: 600, giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "20-Sep", nhap_phoi: 630, giao_dg: 300, nhap_kho: 200, xuat_kho: 200 },
        { date: "21-Sep", nhap_phoi: "", giao_dg: 350, nhap_kho: 300, xuat_kho: 300 },
        { date: "22-Sep", nhap_phoi: "", giao_dg: 121, nhap_kho: 148, xuat_kho: 148 },
        { date: "23-Sep", nhap_phoi: "", giao_dg: "", nhap_kho: 350, xuat_kho: 350 },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ],
      "Lô 2": [
        { date: "22-Sep", nhap_phoi: 267, giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "23-Sep", nhap_phoi: "", giao_dg: 200, nhap_kho: 50, xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ],
      "Số đuôi": [
        { date: "23-Sep", nhap_phoi: 126, giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" },
        { date: "", nhap_phoi: "", giao_dg: "", nhap_kho: "", xuat_kho: "" }
      ]
    }
  },
  flow_logs: [
    { id: "fl-1", po_id: "po-050", trans_date: "2026-09-19", batch_name: "Lô 1", daily_into_sewing: 600, daily_out_sewing: 300, daily_out_packing: 0, daily_out_warehouse: 0, daily_delivered: 0, voucher_note: "Phiếu giao BTP đợt 1 (Lô 1)" },
    { id: "fl-2", po_id: "po-050", trans_date: "2026-09-20", batch_name: "Lô 1", daily_into_sewing: 630, daily_out_sewing: 500, daily_out_packing: 300, daily_out_warehouse: 200, daily_delivered: 200, voucher_note: "Phiếu giao BTP đợt 2 (đủ 1.230 đôi Lô 1), giao khách đợt 1" },
    { id: "fl-3", po_id: "po-050", trans_date: "2026-09-21", batch_name: "Lô 1", daily_into_sewing: 0, daily_out_sewing: 250, daily_out_packing: 350, daily_out_warehouse: 300, daily_delivered: 300, voucher_note: "Giao khách đợt 2 (300 đôi)" },
    { id: "fl-4", po_id: "po-050", trans_date: "2026-09-22", batch_name: "Lô 1", daily_into_sewing: 0, daily_out_sewing: 0, daily_out_packing: 121, daily_out_warehouse: 148, daily_delivered: 148, voucher_note: "Chốt 22/09: LK Giao khách 648, tồn WIP 581, thiếu 1" },
    { id: "fl-5", po_id: "po-050", trans_date: "2026-09-22", batch_name: "Lô 2", daily_into_sewing: 267, daily_out_sewing: 0, daily_out_packing: 0, daily_out_warehouse: 0, daily_delivered: 0, voucher_note: "Chốt 22/09: Nhập đủ BTP Lô 2 (267 đôi), đang may 250, thiếu 17" },
    { id: "fl-6", po_id: "po-050", trans_date: "2026-09-23", batch_name: "Lô 1", daily_into_sewing: 0, daily_out_sewing: 0, daily_out_packing: 0, daily_out_warehouse: 350, daily_delivered: 350, voucher_note: "Chốt 23/09: Xuất thêm 350 đôi kho TP giao khách (LK: 998 đôi)" },
    { id: "fl-7", po_id: "po-050", trans_date: "2026-09-23", batch_name: "Lô 2", daily_into_sewing: 0, daily_out_sewing: 250, daily_out_packing: 200, daily_out_warehouse: 50, daily_delivered: 0, voucher_note: "Chốt 23/09: May xong 250 đôi -> Phối 100, ĐG 100, Kho 50" },
    { id: "fl-8", po_id: "po-050", trans_date: "2026-09-23", batch_name: "Lô 3", daily_into_sewing: 126, daily_out_sewing: 80, daily_out_packing: 0, daily_out_warehouse: 0, daily_delivered: 0, voucher_note: "Chốt 23/09: Chuẩn bị giao 126 đôi nợ -> mở Lô 3, may xong 80 đôi" }
  ]
};

let memoryDB = JSON.parse(JSON.stringify(INITIAL_DB));

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
      }

      // 1. Get metadata
      if (url.pathname === '/api/metadata' && request.method === 'GET') {
        return Response.json({
          success: true,
          customers: memoryDB.customers,
          orders: memoryDB.orders
        }, { headers });
      }

      // 2. Add / Update Customer
      if (url.pathname === '/api/customers' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { id, name, code } = body;
          if (id) {
            const idx = memoryDB.customers.findIndex(c => c.id === id);
            if (idx >= 0) memoryDB.customers[idx] = { id, name, code };
          } else {
            const newCust = {
              id: 'cust-' + Date.now(),
              name: name || 'Khách Hàng Mới',
              code: code || ('KH-' + Math.floor(Math.random()*1000))
            };
            memoryDB.customers.push(newCust);
          }
          return Response.json({ success: true, customers: memoryDB.customers }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // 3. Delete Customer
      if (url.pathname === '/api/customers' && request.method === 'DELETE') {
        try {
          const custId = url.searchParams.get('id');
          memoryDB.customers = memoryDB.customers.filter(c => c.id !== custId);
          memoryDB.orders = memoryDB.orders.filter(o => o.customer_id !== custId);
          return Response.json({ success: true, customers: memoryDB.customers }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // 4. Add / Update PO Order with Detailed Batches
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
              id: 'po-' + Date.now(),
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

      // 5. Delete PO Order
      if (url.pathname === '/api/orders' && request.method === 'DELETE') {
        try {
          const orderId = url.searchParams.get('id');
          memoryDB.orders = memoryDB.orders.filter(o => o.id !== orderId);
          return Response.json({ success: true, orders: memoryDB.orders }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // 6. Get Report by PO & Date
      if (url.pathname === '/api/report' && request.method === 'GET') {
        const poId = url.searchParams.get('po_id') || 'po-050';
        const date = url.searchParams.get('date') || '2026-09-23';
        const key = `${poId}_${date}`;

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

          report = {
            po_id: poId,
            report_date: date,
            status: "DRAFT",
            batches
          };
        }

        // Calculate cumulative export for each batch on or before this date
        const allKeys = Object.keys(memoryDB.reports)
          .filter(k => k.startsWith(poId + '_'))
          .sort();

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

        return Response.json({
          success: true,
          report,
          cumExportsByBatch,
          allHistoryKeys: allKeys
        }, { headers });
      }

      // 7. Save Report
      if (url.pathname === '/api/report' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { po_id, report_date, status, batches } = body;
          const key = `${po_id}_${report_date}`;

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

      // 8. Get Dept Logs (Tab 2 - Báo Theo Dõi Sản Lượng Các Bộ Phận)
      if (url.pathname === '/api/dept-logs' && request.method === 'GET') {
        const poId = url.searchParams.get('po_id') || 'po-050';
        const logs = memoryDB.dept_logs ? (memoryDB.dept_logs[poId] || {}) : {};
        return Response.json({ success: true, logs }, { headers });
      }

      // 9. Save Dept Logs (Tab 2)
      if (url.pathname === '/api/dept-logs' && request.method === 'POST') {
        try {
          const body = await request.json();
          const { po_id, logs } = body;
          if (!memoryDB.dept_logs) memoryDB.dept_logs = {};
          memoryDB.dept_logs[po_id] = logs;
          return Response.json({ success: true, message: "Đã lưu sản lượng các bộ phận thành công" }, { headers });
        } catch (err) {
          return Response.json({ success: false, error: err.message }, { status: 400, headers });
        }
      }

      // 10. Get Flow Logs
      if (url.pathname === '/api/flow-logs' && request.method === 'GET') {
        const poId = url.searchParams.get('po_id') || 'po-050';
        const logs = memoryDB.flow_logs.filter(l => l.po_id === poId);
        return Response.json({ success: true, logs }, { headers });
      }

      // 11. Add Flow Log
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
