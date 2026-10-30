/**
 * NỐI VỚI ĐƠN HÀNG GỐC (sổ đơn chung, Worker don-hang-goc)
 * - Đơn hàng gốc gọi vào bằng khoá bí mật HUB_TOKEN (wrangler secret), qua Service Binding.
 *   Chưa cài HUB_TOKEN thì mọi lối của Đơn hàng gốc đều đóng.
 * - /api/hub/*  : CHỈ ĐỌC đơn của 1 khách (để Đơn hàng gốc chạy thử, so sánh trước khi gửi).
 * - Ghi đơn     : Đơn hàng gốc chỉ được gọi POST /api/order-import, và chỉ cho khách đã BẬT nối (customers.dung_goc = 1).
 * - Khách đã bật: không còn thêm / sửa / xoá PO, không xoá khách ở web này (nhập ở Đơn hàng gốc).
 *   Thả chuyền, báo cáo, kiểm kê theo lô vẫn làm bình thường.
 * Mặc định dung_goc = 0 cho mọi khách -> web chạy y như trước khi có file này.
 */

const reply = (data, status, headers) => Response.json(data, { status, headers });

/** So khoá không lộ thời gian (băm 2 bên rồi so từng byte) */
async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(a)), crypto.subtle.digest('SHA-256', enc.encode(b))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < u.length; i++) d |= u[i] ^ v[i];
  return d === 0;
}
/** Yêu cầu có phải từ Đơn hàng gốc không (khoá đúng, khoá đủ dài) */
export async function laHub(request, env) {
  const t = request.headers.get('X-Hub-Token') || '';
  const k = String((env && env.HUB_TOKEN) || '');
  if (k.length < 32 || !t) return false;
  return sameSecret(t, k);
}

async function dungGoc(db, customerId) {
  const r = await db.prepare('SELECT dung_goc FROM customers WHERE id = ?').bind(String(customerId)).first();
  return !!(r && Number(r.dung_goc) === 1);
}
async function khachCuaPo(db, poId) {
  if (!poId) return null;
  const r = await db.prepare('SELECT customer_id FROM po_orders WHERE id = ?').bind(String(poId)).first();
  return r ? r.customer_id : null;
}

/** Yêu cầu ghi đơn (PO / khách) và các khách mà nó đụng tới; không phải ghi đơn -> null */
async function khachCuaGhiDon(url, request, db) {
  const p = url.pathname, m = request.method;
  const body = async () => { try { return await request.clone().json(); } catch (_) { return {}; } };
  if (p === '/api/order-import' && m === 'POST') return [(await body()).customer_id];
  if (p === '/api/orders' && m === 'POST') {
    const b = await body();
    return [await khachCuaPo(db, b.id), b.customer_id]; // sửa PO: khách cũ + khách mới (đổi khách)
  }
  if (p === '/api/orders' && m === 'DELETE') return [await khachCuaPo(db, url.searchParams.get('id'))];
  if (p === '/api/customers' && m === 'DELETE') return [url.searchParams.get('id')]; // xoá khách = xoá hết PO của khách
  return null;
}

/**
 * Chặn ghi đơn theo khách. Trả về Response khi phải chặn, null khi cho đi tiếp.
 * hub = yêu cầu từ Đơn hàng gốc: chỉ POST /api/order-import, chỉ khách đã bật.
 */
export async function khoaGhiDon(url, request, env, hub, headers) {
  if (hub && !(url.pathname === '/api/order-import' && request.method === 'POST')) {
    return reply({ success: false, error: 'Đơn hàng gốc chỉ được gọi /api/order-import' }, 403, headers);
  }
  if (!env || !env.DB) return hub ? reply({ success: false, error: 'Chưa có database' }, 503, headers) : null;
  try {
    const ids = await khachCuaGhiDon(url, request, env.DB);
    if (!ids) return null;
    const list = [...new Set(ids.filter(Boolean).map(String))];
    if (hub && !list.length) return reply({ success: false, error: 'Thiếu khách hàng' }, 400, headers);
    for (const id of list) {
      const bat = await dungGoc(env.DB, id);
      if (hub && !bat) return reply({ success: false, error: 'Khách này chưa bật nối với Đơn hàng gốc' }, 403, headers);
      if (!hub && bat) return reply({ success: false, error: 'Đơn của khách này nhập ở Đơn hàng gốc (sổ đơn chung). Ở đây chỉ xem, không thêm / sửa / xoá PO' }, 403, headers);
    }
    return null;
  } catch (err) {
    // Không đọc được công tắc: người dùng làm như cũ, Đơn hàng gốc thì bị chặn
    console.error('khoaGhiDon:', err && err.message);
    return hub ? reply({ success: false, error: 'Web Kiểm kê chưa sẵn sàng nhận đơn từ Đơn hàng gốc' }, 503, headers) : null;
  }
}

/** /api/hub/* — CHỈ ĐỌC, cùng dạng dữ liệu với bản kéo (snapshot) mà Đơn hàng gốc dùng để chạy thử */
export async function handleHubApi(url, request, env, headers) {
  if (request.method !== 'GET') return reply({ success: false, error: 'Chỉ đọc' }, 405, headers);
  if (!env || !env.DB) return reply({ success: false, error: 'Chưa có database' }, 503, headers);
  const q = (sql, ...b) => env.DB.prepare(sql).bind(...b).all().then(r => r.results || []);
  if (url.pathname === '/api/hub/khach') {
    return reply({ success: true, data: await q('SELECT id, name, code, dung_goc FROM customers ORDER BY name') }, 200, headers);
  }
  if (url.pathname === '/api/hub/doc') {
    const kh = String(url.searchParams.get('customer_id') || '');
    if (!kh) return reply({ success: false, error: 'Thiếu customer_id' }, 400, headers);
    const cuaKhach = 'po_id IN (SELECT id FROM po_orders WHERE customer_id = ?)';
    const [customers, po_orders, lo_bao_cao, lo_so_bo_phan, lo_nhat_ky, tha_chuyen] = await Promise.all([
      q('SELECT id, name, code, size_list, dung_goc FROM customers WHERE id = ?', kh),
      q(`SELECT id, customer_id, style_code, po_number, line_name, po_plan, default_batches, created_at, tail_sweep_date, tail_batch_name,
         wave, size_qty, crd FROM po_orders WHERE customer_id = ?`, kh),
      // Lô đã có số liệu (khóa lô: không đổi tên / xóa / giảm)
      q(`SELECT po_id, batch_name, COUNT(*) AS n, MAX(into_sewing) AS vao_chuyen, MAX(delivered) AS da_giao,
         MIN(report_date) AS tu, MAX(report_date) AS den FROM report_batches WHERE ${cuaKhach} GROUP BY po_id, batch_name`, kh),
      q(`SELECT po_id, batch_name, COUNT(*) AS n FROM dept_logs WHERE ${cuaKhach} GROUP BY po_id, batch_name`, kh),
      q(`SELECT po_id, batch_name, COUNT(*) AS n FROM flow_logs WHERE ${cuaKhach} GROUP BY po_id, batch_name`, kh),
      q(`SELECT po_id, kind, COUNT(*) AS n, SUM(n1 + n2 + n3 + n4) AS sl FROM release_entries WHERE ${cuaKhach} GROUP BY po_id, kind`, kh),
    ]);
    return reply({ success: true, data: { app: 'wip', luc: new Date().toISOString(), customers, po_orders, lo_bao_cao, lo_so_bo_phan, lo_nhat_ky, tha_chuyen } }, 200, headers);
  }
  return reply({ success: false, error: 'Endpoint không tồn tại' }, 404, headers);
}
