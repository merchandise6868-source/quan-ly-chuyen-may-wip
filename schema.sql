-- Bảng Khách hàng (Customers)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL
);

-- Bảng Đơn hàng / Style (PO Orders)
CREATE TABLE IF NOT EXISTS po_orders (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    style_code TEXT NOT NULL,
    po_number TEXT NOT NULL,
    line_name TEXT NOT NULL,
    po_plan INTEGER NOT NULL DEFAULT 0,
    default_batches TEXT, -- JSON string danh sách lô
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Báo cáo Ngày (Daily Reports)
CREATE TABLE IF NOT EXISTS daily_reports (
    id TEXT PRIMARY KEY, -- po_id_report_date
    po_id TEXT NOT NULL,
    report_date TEXT NOT NULL,
    status TEXT DEFAULT 'DRAFT', -- DRAFT / SUBMITTED
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Chi tiết Lô hàng trong Báo cáo Ngày (Report Batches)
CREATE TABLE IF NOT EXISTS report_batches (
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
);

-- Bảng Báo Theo Dõi Sản Lượng Các Bộ Phận (Tab 2 - Dept Logs)
CREATE TABLE IF NOT EXISTS dept_logs (
    id TEXT PRIMARY KEY,
    po_id TEXT NOT NULL,
    batch_name TEXT NOT NULL,
    log_date TEXT,
    nhap_phoi INTEGER DEFAULT 0,
    giao_dg INTEGER DEFAULT 0,
    nhap_kho INTEGER DEFAULT 0,
    xuat_kho INTEGER DEFAULT 0,
    row_order INTEGER DEFAULT 0
);

-- Bảng Nhật ký Thống kê Giao dịch Hằng ngày (Daily Flow Log)
CREATE TABLE IF NOT EXISTS flow_logs (
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
);
