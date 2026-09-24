# TÀI LIỆU ĐẶC TẢ YÊU CẦU CHỨC NĂNG & GIAO DIỆN (SPECIFICATION)
## HỆ THỐNG QUẢN LÝ TIẾN ĐỘ CHUYỀN MAY & DÒNG CHẢY HÀNG HÓA (WIP FLOW TRACKING)

---

## 1. MỤC TIÊU VÀ ĐẶC THÙ HỆ THỐNG
Hệ thống được thiết kế để quản lý hoạt động sản xuất, kiểm đếm tồn dở dang (WIP) và đối soát hao hụt theo từng ngày tại các chuyền may.
Hệ thống giải quyết triệt để sự xung đột giữa hai nhóm chỉ số:
- **Chỉ số Tích lũy (Lũy kế):** Gồm số lượng bán thành phẩm Chuyền tiếp nhận và số lượng thành phẩm đã xuất giao khách hàng (chỉ tính cộng dồn tăng dần từ đầu đơn đến ngày hiện tại).
- **Chỉ số Thời điểm (Tồn cuối ngày):** Gồm số lượng bán thành phẩm đang nằm dở dang tại các bàn thao tác trên xưởng (đếm thực tế tại thời điểm chốt ca tan làm).

---

## 2. KIẾN TRÚC PHÂN CẤP DỮ LIỆU (DATA HIERARCHY)

Cấu trúc hình cây 4 cấp độ quản lý:
```text
[1. Khách hàng] (VD: Adidas, Nike, Decathlon...)
   └── [2. Đơn hàng / Style] (VD: Mã Style Alpha 050, Puma 100...)
          └── [3. Báo cáo Ngày] (VD: Ngày 22/09/2026, 23/09/2026...)
                 └── [4. Các Lô hàng thuộc PO] (Lô 1, Lô 2, Lô 3... tối đa 5-10 Lô)
```

### Quy tắc lưu trữ và chọn lọc:
1. **Khách hàng:** Chọn khách hàng trước tiên. Mỗi khách hàng lưu trữ một cơ sở dữ liệu/không gian dữ liệu độc lập.
2. **Đơn hàng / Style:** 
   - Sau khi chọn khách hàng, chọn đơn hàng/style tương ứng.
   - Có ô nhập/chọn số PO (Purchase Order/Đợt hàng). Khi chọn hoặc gõ mã PO, hệ thống tự động nhảy các thông tin gốc của đơn hàng: Mã chuyền, Kế hoạch tổng PO, Số lượng bán thành phẩm Chuyền đã nhận, Số lượng phòng Chuẩn bị còn nợ.
3. **Báo cáo Ngày:**
   - Người dùng chọn ngày cần xem hoặc ngày cần chốt báo cáo. Mặc định là ngày hiện tại.
4. **Các Lô trong PO:**
   - Có phễu lọc PO.
   - Cho phép nhập danh sách các Lô và ấn định số lượng kế hoạch (Số lượng vào chuyền) cho từng Lô theo định mức quy định sẵn.

---

## 3. LOGIC CÂN BẰNG TOÁN HỌC & CÔNG THỨC BẮT BUỘC

Toàn bộ hệ thống vận hành theo nguyên lý bảo toàn dòng hàng: **Một Lô sản phẩm chỉ được giải phóng ra ngoài qua một cổng duy nhất là Xuất Giao Khách Hàng. Nếu chưa xuất giao, hàng bắt buộc phải nằm tại một trong các vị trí dở dang trên chuyền.**

### 3.1. Đối với từng Lô sản xuất:
1. **Tổng Nhận từ Chuẩn bị (VÀO CHUYỀN):**
   - Số lượng do kế hoạch/sếp quy định sẵn khi mở Lô.
   - Mang tính chất Tích lũy.
2. **Tổng Xuất Giao Khách (ĐÃ GIAO KHÁCH HÀNG):**
   - Số lượng thành phẩm đã xuất khỏi chuyền may tính cộng dồn từ ngày đầu đến ngày báo cáo.
   - Mang tính chất Tích lũy.
3. **Tổng Tồn - Lý thuyết:**
   - Là số lượng hàng theo sổ sách bắt buộc phải còn nằm lại trong xưởng:
   $$\text{TỒN LÝ THUYẾT} = \text{VÀO CHUYỀN} - \text{ĐÃ GIAO KHÁCH HÀNG}$$
4. **Kiểm kê Tồn thực tế (Đếm cuối ngày):**
   - Công nhân/Tổ trưởng kiểm đếm thực tế số lượng tại các công đoạn dở dang vào cuối ca:
     - `Tồn May`: Số lượng đang may dở trên chuyền.
     - `Tồn QC`: Số lượng ứ đọng tại bàn kiểm phẩm / chờ sửa.
     - `Tồn Phối đôi`: Số lượng đang nằm ở bàn ghép cặp/phối đôi.
     - `Tồn Đóng gói`: Số lượng đang nằm tại bàn hoàn thiện/đóng gói.
     - `Tồn Kho Thành phẩm`: Số lượng đã đóng gói xong nằm tại kho nội bộ chờ xuất xe.
   - **Tổng Tồn Thực tế:**
   $$\text{TỒN THỰC TẾ} = \text{Tồn May} + \text{Tồn QC} + \text{Tồn Phối} + \text{Tồn Đóng gói} + \text{Tồn Kho TP}$$
5. **Cân đối Hàng Thiếu (Hao hụt/Mất mát):**
   - Hệ thống tự động so sánh số lượng lý thuyết và số lượng thực tế:
   $$\text{THIẾU} = \text{TỒN LÝ THUYẾT} - \text{TỒN THỰC TẾ}$$
   - *Quy tắc cảnh báo:* Nếu $\text{THIẾU} > 0$ (hoặc độ lệch âm so với tổng nhận), hệ thống tự động bôi đỏ cảnh báo và yêu cầu nhập ghi chú nguyên nhân (Rách vải, mất phôi, phôi hỏng).

### 3.2. Đối với Hàng Tổng Chuyền (PO Summary):
- `Tổng Nhận Toàn PO` = $\sum$ Vào chuyền của tất cả các Lô.
- `Chuẩn bị còn nợ` = $\text{Kế hoạch PO} - \text{Tổng Nhận Toàn PO}$.
- `Tổng Xuất Toàn PO` = $\sum$ Đã giao khách của tất cả các Lô.
- `Tổng Tồn Toàn PO` = $\sum$ Tồn thực tế của tất cả các Lô.
- `Tổng Thiếu Toàn PO` = $\sum$ Hàng thiếu của tất cả các Lô.
- **Phương trình kiểm toán toàn đơn:**
  $$\text{Tổng Nhận Toàn PO} = \text{Tổng Xuất Toàn PO} + \text{Tổng Tồn Toàn PO} + \text{Tổng Thiếu Toàn PO}$$

---

## 4. QUY TẮC CHUYỂN TIẾP GIỮA CÁC NGÀY (DAILY PROGRESSION)

1. **Kế thừa số Lũy kế:**
   - Khi tạo báo cáo ngày mới $(D)$, hệ thống tự động giữ nguyên số `VÀO CHUYỀN` của các Lô đã mở hôm trước $(D-1)$.
   - `ĐÃ GIAO KHÁCH HÀNG` của ngày mới = `Lũy kế đã giao hôm qua` + `Số lượng giao thêm trong ngày hôm nay`.
2. **Làm mới số Kiểm kê WIP:**
   - Các ô kiểm kê tồn (`May`, `QC`, `Phối`, `Đóng gói`, `Kho TP`) phải được làm trống hoặc cho phép nhập số đếm mới của ngày hôm nay (không cộng dồn từ hôm qua).
3. **Xử lý số lượng Chuẩn bị còn nợ (Bù nợ vào Lô mới):**
   - Khi Chuẩn bị giao tiếp phần hàng còn thiếu, người dùng thêm một Lô mới (VD: Lô 3).
   - Số lượng nhận của Lô mới sẽ làm giảm trừ trực tiếp số `Chuẩn bị còn nợ` trên thanh Header. Khi nhận đủ 100% kế hoạch đơn hàng, số `Chuẩn bị còn nợ` tự động bằng 0.
4. **Điều kiện kết thúc đơn hàng (Đóng Lô / Đóng PO):**
   - Một Lô hoàn thành khi `Tổng Tồn Thực tế` tại các trạm dở dang trở về `0`.
   - Lúc này: $\text{Vào chuyền} = \text{Đã giao khách} + \text{Thiếu chốt sổ}$.

---

## 5. THIẾT KẾ BỐ CỤC GIAO DIỆN (UI/UX LAYOUT)

Giao diện chia làm 3 phần chính hiển thị trên một màn hình làm việc:

### 5.1. Khối Lọc & Thông Tin Chung (Header Bar - Cố định trên cùng)
- **Thanh điều hướng phân cấp:**
  - Dropdown: `[Chọn Khách Hàng]`
  - Dropdown / Ô tìm kiếm: `[Mã Đơn / Style]` $\rightarrow$ Nhập/chọn `[Số PO]`
  - Bộ chọn: `[Ngày Báo Cáo]`
- **Thẻ trạng thái tổng đơn (KPI Cards):**
  - Ô 1: **Kế hoạch đơn (PO Plan):** (VD: 1.623 đôi)
  - Ô 2: **Tổng May thực nhận:** (Tự động tính từ các Lô)
  - Ô 3: **Chuẩn bị còn nợ:** (Tô màu cam nổi bật, tự động trừ khi nhận thêm Lô mới)

### 5.2. Khối Quản Lý Dòng Hàng Từng Lô (Bố cục 2 Tầng Chuẩn)
Mỗi Lô được hiển thị trong một khung/thẻ (Card) riêng biệt gồm 2 tầng:

```text
+-------------------------------------------------------------------------------------------------------------------------------+
| [ LÔ 1 ]    | TỔNG NHẬN (Vào chuyền) | TỔNG XUẤT GIAO KH | TỔNG TỒN - LÝ THUYẾT | TỔNG TỒN THỰC TẾ |   THIẾU   |                 |
|             |------------------------+-------------------+----------------------+------------------+-----------+-----------------|
|             |        1.230           |       648         |        582           |       581        |     1     |                 |
| Kế hoạch:   |     [Ký nhận BTP]      |   [Lũy kế xuất]   |    [Vào - Xuất]      |    [Tổng WIP]    |  [Lý-Thực]|                 |
| 1.230 đôi   +------------------------+-------------------+----------------------+------------------+-----------+-----------------+
|             |                        |                KIỂM KÊ TỒN THỰC TẾ (Cuối ngày)                                          |
|             |                        |-----------------------------------------------------------------------------------------|
|             |                        | 2. ĐANG MAY | 3. TỒN QC | 4. TỒN PHỐI ĐÔI | 5. TỒN ĐÓNG GÓI | 6. TỒN KHO THÀNH PHẨM     |
|             |                        |     180     |    60     |      218        |       123       |            0              |
|             |                        | [Line may]  | [Trạm QC] |  [Bàn phối đôi] | [Bàn đóng gói]  |      [Kho nội bộ]         |
+-------------------------------------------------------------------------------------------------------------------------------+
```

#### Quy ước hiển thị các ô trong Thẻ Lô:
1. **Tầng trên (Sổ sách & Lũy kế):**
   - `Cột Lô`: Tên Lô + Số lượng kế hoạch của Lô.
   - `Tổng Nhận (Vào chuyền)`: Ô nhập số (màu xanh dương).
   - `Tổng Xuất (Đã giao khách)`: Ô nhập số (màu xanh lá/cam đào).
   - `Tổng Tồn - Lý thuyết`: Ô khóa công thức tự động = `Nhận - Giao` (màu đỏ gạch / nâu).
   - `Tổng Tồn Thực tế`: Ô khóa công thức tự động = `Tổng 5 trạm dở dang ở tầng dưới` (màu tím than / xanh đậm).
   - `Thiếu`: Ô tự động tính = `Tồn lý thuyết - Tồn thực tế` (nền hồng, chữ đỏ đậm, bật cảnh báo nếu $>0$).
2. **Tầng dưới (Kiểm đếm WIP lúc tan ca):**
   - Tiêu đề nhóm: **KIỂM KÊ TỒN THỰC TẾ** (Nền Dark Teal).
   - Gồm 5 ô nhập số tương ứng 5 trạm: `Đang may`, `Tồn kiểm QC`, `Tồn phối đôi` (có viền nét đứt xanh lá), `Tồn đóng gói`, `Tồn kho thành phẩm`.
   - Mỗi ô cho phép nhập số lượng và kèm một dòng ghi chú tên người phụ trách/người thực hiện.

### 5.3. Khối Tổng Chuyền Toàn PO (Dưới cùng)
- Định dạng giống hệt thẻ của một Lô nhưng áp dụng màu nền tối (Dark Navy/Slate).
- Tất cả các ô đều là giá trị cộng dồn tự động của toàn bộ các Lô đang chạy trong PO.
- Cung cấp cái nhìn tổng quát cho Quản đốc và Giám đốc về tình trạng kẹt hàng ở trạm nào trên toàn xưởng.

---

## 6. MÀN HÌNH NHẬT KÝ THỐNG KÊ GIAO DỊCH HẰNG NGÀY (DAILY FLOW LOG)

Bên cạnh màn hình kiểm kê WIP theo thẻ 2 tầng, hệ thống cung cấp màn hình/tab thứ 2 dạng bảng nhật ký (Table View) theo đúng yêu cầu:
**"Tổng nhập may = Tổng xuất may = Tổng xuất đóng gói = Tổng xuất kho thành phẩm = Tổng giao khách hàng"**

### Các cột của bảng:
1. `Ngày giao dịch`
2. `Lô hàng`
3. **Khối Phát Sinh Trong Ngày (Daily):**
   - `1. Nhập May` (BTP nhận từ Chuẩn bị trong ngày)
   - `2. Xuất May` (Sản lượng may xong chuyển QC/Phối trong ngày)
   - `3. Xuất Đóng Gói` (Sản lượng đóng gói xong nhập vào Kho TP)
   - `4. Xuất Kho TP` (Sản lượng xuất xe đi trong ngày)
   - `5. Giao Khách Hàng` (Số lượng thực tế khách ký nhận trong ngày)
4. **Khối Lũy Kế (Cumulative Throughput):**
   - Tự động tính lũy kế theo từng Lô cho cả 5 công đoạn trên.
5. **Khối Đối Soát:**
   - `Lệch Luân Chuyển` = `Lũy kế Nhập May - Lũy kế Giao Khách`.
   - Con số này luôn tự động khớp với: `(Tổng tồn thực tế toàn xưởng + Hàng thiếu)` tại màn hình kiểm tồn.
6. `Ghi chú chứng từ / Mã phiếu xuất`.

---

## 7. YÊU CẦU TIỆN ÍCH DÀNH CHO CÔNG NHÂN (USABILITY)
1. **Phím nhập số lớn (Touch-friendly):** Khi thao tác trên thiết bị di động/máy tính bảng, nhấp vào ô nhập số sẽ hiển thị bàn phím số (Numpad) riêng biệt.
2. **Khóa ô tự động:** Các ô tính toán (Tồn lý thuyết, Tồn thực tế, Thiếu, Tổng cộng) bị khóa cứng, công nhân không thể sửa đè công thức.
3. **Nút chức năng nhanh:**
   - `[+ Thêm Lô mới]`
   - `[Lưu Nháp (Draft)]`
   - `[Chốt Sổ Cuối Ngày (Submit)]`
   - `[Xuất Báo Cáo Excel / PDF]` theo đúng mẫu form in tiêu chuẩn.
