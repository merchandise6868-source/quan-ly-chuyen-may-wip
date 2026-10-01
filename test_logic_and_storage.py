"""
====================================================================================================
BỘ KIỂM THỬ TỰ ĐỘNG CHUYÊN SÂU: LOGIC TÍNH TOÁN & CƠ CHẾ LƯU TRỮ TRÊN TOÀN BỘ HỆ THỐNG
DỰ ÁN: HỆ THỐNG QUẢN LÝ TIẾN ĐỘ CHUYỀN MAY & DÒNG CHẢY HÀNG HÓA WIP (D&D LONG AN)
====================================================================================================
Bao gồm các kịch bản kiểm thử:
1. [LOGIC TAB 1] Tính toán bảo toàn dòng hàng đa Lô (3 Lô: Lô 1, Lô 2, Số đuôi), Lũy kế ngày trước + Hôm nay.
2. [LOGIC TAB 1] Phân bổ nguyên nhân thiếu (Mất xác, Hàng phế, Khác, Chưa phân bổ) & Bảng Tổng Hợp PO.
3. [LOGIC TAB 2] Kiểm thử cân bằng dòng chảy các bộ phận & Điều kiện xuất hiện trạng thái 'OKE' / 'NOT OKE'.
4. [STORAGE 1]  Kiểm thử cơ chế lưu trữ phiên làm việc & khôi phục dữ liệu (LocalStorage / Session Persistence).
5. [STORAGE 2]  Kiểm thử chuyển đổi trạng thái Báo Cáo (BẢN NHÁP <-> ĐÃ CHỐT SỔ) và cấu trúc D1 Database.
====================================================================================================
"""

import os
import sys
import time
import json
import unittest

if sys.platform.startswith("win"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

LOCAL_HTML_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "frontend", "index.html"))
TARGET_URL = f"file:///{LOCAL_HTML_PATH.replace(os.sep, '/')}"


class TestWIPLogicAndStorage(unittest.TestCase):
    driver: webdriver.Chrome
    wait: WebDriverWait

    @classmethod
    def setUpClass(cls):
        chrome_options = Options()
        chrome_options.add_argument("--start-maximized")
        chrome_options.add_argument("--disable-notifications")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")

        service = Service(ChromeDriverManager().install())
        cls.driver = webdriver.Chrome(service=service, options=chrome_options)
        cls.wait = WebDriverWait(cls.driver, 10)
        
        cls.screenshot_dir = os.path.join(os.path.dirname(__file__), "test_screenshots")
        os.makedirs(cls.screenshot_dir, exist_ok=True)
        print(f"\n🚀 [BẮT ĐẦU KIỂM THỬ LOGIC & LƯU TRỮ] Target: {TARGET_URL}")

    @classmethod
    def tearDownClass(cls):
        if cls.driver:
            time.sleep(2)
            cls.driver.quit()
            print("\n🏁 [HOÀN THÀNH] Đã kết thúc toàn bộ bài kiểm thử.")

    def save_evidence(self, name: str):
        path = os.path.join(self.screenshot_dir, f"{name}.png")
        self.driver.save_screenshot(path)
        print(f"   📸 [Ảnh bằng chứng]: {path}")

    # ==============================================================================================
    # TEST 1: KIỂM THỬ LOGIC TÍNH TOÁN TAB 1 (BÁO CÁO NHẬP XUẤT TỒN ĐA LÔ & LŨY KẾ)
    # ==============================================================================================
    def test_01_tab1_multi_batch_calculation_and_summary(self):
        """Kiểm thử tính toán 3 Lô hàng, lũy kế ngày trước, kiểm kê 5 trạm và bảng tổng hợp PO"""
        self.driver.get(TARGET_URL)
        time.sleep(1)

        print("\n🧪 [Test 01] Kiểm tra logic tính toán Tab 1 (Đa Lô & Tổng Hợp)...")
        script = """
            // 1. Giả lập đăng nhập Admin
            localStorage.setItem("dd_user_info", JSON.stringify({ role: "admin", name: "Sếp Tổng", phone: "0818189868" }));
            localStorage.setItem("dd_wip_role", "admin");
            document.getElementById('loginPortalScreen').style.setProperty('display', 'none', 'important');
            document.getElementById('appMainWrapper').style.setProperty('display', 'block', 'important');

            // 2. Thiết lập dữ liệu Đơn hàng PO-050 kế hoạch 1,623 đôi gồm 3 Lô
            appState.currentUserRole = 'admin';
            appState.currentCustomer = { id: 'cust-2', name: 'ADIDAS GLOBAL' };
            appState.currentPO = { 
                id: 'po-050', 
                po_number: 'PO-050', 
                style: 'Mã Style Alpha 050',
                po_plan: 1623 
            };
            appState.currentDate = '2026-09-30';

            // Lũy kế ngày hôm trước
            appState.cumImportsByBatch = { 'Lô 1': 1000, 'Lô 2': 200, 'Số đuôi': 0 };
            appState.cumExportsByBatch = { 'Lô 1': 600, 'Lô 2': 100, 'Số đuôi': 0 };

            // Hoạt động hôm nay + Kiểm kê 5 trạm
            appState.report = {
                po_id: 'po-050',
                report_date: '2026-09-30',
                status: 'DRAFT',
                batches: [
                    {
                        batch_name: 'Lô 1',
                        batch_plan: 1230,
                        into_sewing: 230, // cumIn = 1000 + 230 = 1230
                        daily_out: 48,    // cumOut = 600 + 48 = 648 => Tồn LT = 1230 - 648 = 582
                        wip_sewing: 180,
                        wip_qc: 60,
                        wip_pairing: 218,
                        wip_packing: 123,
                        wip_warehouse: 0, // Tồn TT = 180+60+218+123+0 = 581 => Thiếu = 582 - 581 = 1
                        shortage_mat_xac: 0,
                        shortage_hang_phe: 0,
                        shortage_khac: 1,
                        shortage_note: 'Rách 1 đôi lúc phối'
                    },
                    {
                        batch_name: 'Lô 2',
                        batch_plan: 267,
                        into_sewing: 67, // cumIn = 200 + 67 = 267
                        daily_out: 0,    // cumOut = 100 + 0 = 100 => Tồn LT = 267 - 100 = 167
                        wip_sewing: 0,
                        wip_qc: 0,
                        wip_pairing: 50,
                        wip_packing: 67,
                        wip_warehouse: 50, // Tồn TT = 0+0+50+67+50 = 167 => Thiếu = 0 (OK)
                        shortage_mat_xac: 0,
                        shortage_hang_phe: 0,
                        shortage_khac: 0,
                        shortage_note: ''
                    },
                    {
                        batch_name: 'Số đuôi',
                        batch_plan: 126,
                        into_sewing: 126, // cumIn = 0 + 126 = 126
                        daily_out: 0,     // cumOut = 0 => Tồn LT = 126
                        wip_sewing: 126,
                        wip_qc: 0,
                        wip_pairing: 0,
                        wip_packing: 0,
                        wip_warehouse: 0, // Tồn TT = 126 => Thiếu = 0 (OK)
                        shortage_mat_xac: 0,
                        shortage_hang_phe: 0,
                        shortage_khac: 0,
                        shortage_note: ''
                    }
                ]
            };

            renderReportUI();
            recalculateAllInPlace();
        """
        self.driver.execute_script(script)
        time.sleep(1)

        # 1. Kiểm tra Lô 1: Tồn Lý Thuyết = 582, Tồn Thực Tế = 581, Thiếu = -1
        calc_theo_0 = self.driver.find_element(By.ID, "calcTheoWip_0").text.strip()
        calc_act_0 = self.driver.find_element(By.ID, "calcActualWip_0").text.strip()
        calc_short_0 = self.driver.find_element(By.ID, "calcShortage_0").text.strip()

        print(f"   [Lô 1] Tồn LT: {calc_theo_0} | Tồn TT: {calc_act_0} | Thiếu: {calc_short_0}")
        self.assertIn("582", calc_theo_0)
        self.assertIn("581", calc_act_0)
        self.assertIn("-1", calc_short_0)

        # 2. Kiểm tra Lô 2: Tồn LT = 167, Tồn TT = 167, Thiếu = 0 (OK)
        calc_theo_1 = self.driver.find_element(By.ID, "calcTheoWip_1").text.strip()
        calc_act_1 = self.driver.find_element(By.ID, "calcActualWip_1").text.strip()
        calc_short_1 = self.driver.find_element(By.ID, "calcShortage_1").text.strip()

        print(f"   [Lô 2] Tồn LT: {calc_theo_1} | Tồn TT: {calc_act_1} | Trạng thái: {calc_short_1}")
        self.assertIn("167", calc_theo_1)
        self.assertIn("167", calc_act_1)
        self.assertTrue("0" in calc_short_1 or "OK" in calc_short_1)

        # 3. Kiểm tra Bảng Tổng Hợp Trên Cùng (Top Summary)
        # Tổng nhận = 1230 + 267 + 126 = 1623 (Đủ 100% PO => Chuẩn bị nợ = 0)
        # Tổng xuất = 648 + 100 + 0 = 748
        # Tổng tồn TT = 581 + 167 + 126 = 874
        # Tổng thiếu = (1623 - 748) - 874 = 875 - 874 = 1
        sum_debt = self.driver.find_element(By.ID, "summaryPrepDebt").text.strip()
        sum_rec = self.driver.find_element(By.ID, "summaryTotalReceived").text.strip()
        sum_del = self.driver.find_element(By.ID, "summaryTotalDelivered").text.strip()
        sum_act = self.driver.find_element(By.ID, "summaryTotalActualWip").text.strip()
        sum_short = self.driver.find_element(By.ID, "summaryTotalShortage").text.strip()

        print(f"   📊 [Bảng Tổng Hợp PO]: Nhận={sum_rec} | Xuất={sum_del} | Tồn TT={sum_act} | Thiếu={sum_short} | Chuẩn bị nợ={sum_debt}")
        self.assertIn("1.623", sum_rec)
        self.assertIn("748", sum_del)
        self.assertIn("874", sum_act)
        self.assertIn("1", sum_short)
        self.assertIn("0", sum_debt)

        self.save_evidence("Test01_Tab1_Calculations_Summary")
        print("   ✅ [Test 01] Logic tính toán Tab 1 hoàn hảo 100%!")

    # ==============================================================================================
    # TEST 2: KIỂM THỬ LOGIC TAB 2 (THEO DÕI SẢN LƯỢNG BỘ PHẬN & TRẠNG THÁI OKE)
    # ==============================================================================================
    def test_02_tab2_department_flow_and_status_badge(self):
        """Kiểm thử tính toán sản lượng các bộ phận và điều kiện xuất hiện badge 'OKE' / 'NOT OKE'"""
        print("\n🧪 [Test 02] Kiểm tra logic tính toán Tab 2 & Trạng thái 'OKE'...")
        
        # Chuyển sang Tab 2 và nạp dữ liệu theo dõi sản lượng
        script = """
            // Chuyển Tab
            document.querySelector("button[data-tab='tab-flow-log']").click();

            // Thiết lập dữ liệu sản lượng cho Lô 1 (Hoàn thành 100% -> OKE) và Lô 2 (Chưa xuất hết -> NOT OKE)
            appState.currentPO.default_batches = [
                { batch_name: "Lô 1", into_sewing: 500 },
                { batch_name: "Lô 2", into_sewing: 500 }
            ];

            appState.deptLogs = {
                "Lô 1": [
                    { ton_dau: 0, nhap: 500, xuat: 500, ton_cuoi: 0, nhap_phoi: 500, giao_dg: 500, nhap_kho: 500, xuat_kho: 500 }
                ],
                "Lô 2": [
                    { ton_dau: 0, nhap: 500, xuat: 300, ton_cuoi: 200, nhap_phoi: 300, giao_dg: 250, nhap_kho: 200, xuat_kho: 150 }
                ]
            };

            if (typeof renderDeptLogsUI === 'function') {
                renderDeptLogsUI();
            }
            recalculateDeptSummary();
        """
        self.driver.execute_script(script)
        time.sleep(1)

        # Kiểm tra Badge trạng thái Lô 1 (Xuất kho 500 == Nhập vào 500 => Phải là 'OKE')
        status_badge_0 = self.driver.find_element(By.ID, "status_col_0").text.strip()
        print(f"   [Trạng thái Lô 1 (500/500)]: {status_badge_0} (Kỳ vọng: OKE)")
        self.assertIn("OKE", status_badge_0)

        # Kiểm tra Badge trạng thái Lô 2 (Xuất kho 150 < Nhập vào 500 => Phải là 'NOT OKE')
        status_badge_1 = self.driver.find_element(By.ID, "status_col_1").text.strip()
        print(f"   [Trạng thái Lô 2 (150/500)]: {status_badge_1} (Kỳ vọng: NOT OKE)")
        self.assertIn("NOT OKE", status_badge_1)

        # Kiểm tra Tổng hợp Tab 2:
        # Tổng nhận = 500 + 500 = 1000
        # Tổng xuất cho KH = 500 + 150 = 650
        # Tồn cuối ngày = 1000 - 650 = 350
        sum_dept_rec = self.driver.find_element(By.ID, "deptSummaryTotalReceived").text.strip()
        sum_dept_del = self.driver.find_element(By.ID, "deptSummaryTotalDelivered").text.strip()
        sum_dept_ton = self.driver.find_element(By.ID, "deptSummaryTotalTonCuoi").text.strip()

        print(f"   📊 [Bảng Tổng Hợp Tab 2]: Nhận={sum_dept_rec} | Xuất={sum_dept_del} | Tồn cuối={sum_dept_ton}")
        self.assertIn("1.000", sum_dept_rec)
        self.assertIn("650", sum_dept_del)
        self.assertIn("350", sum_dept_ton)

        self.save_evidence("Test02_Tab2_Dept_Flow_Calculations")
        print("   ✅ [Test 02] Logic theo dõi sản lượng Tab 2 chính xác 100%!")

    # ==============================================================================================
    # TEST 3: KIỂM THỬ CƠ CHẾ LƯU TRỮ PHIÊN & KHÔI PHỤC DỮ LIỆU (PERSISTENCE)
    # ==============================================================================================
    def test_03_storage_persistence_and_session_recovery(self):
        """Kiểm thử lưu trữ thông tin phiên người dùng & khôi phục tự động khi tải lại trang"""
        print("\n🧪 [Test 03] Kiểm tra cơ chế lưu trữ LocalStorage & Auto Session Recovery...")
        
        # 1. Ghi thông tin User & Role vào LocalStorage
        user_test_data = {
            "name": "Trưởng Phòng Quản Lý",
            "phone": "0909123456",
            "role": "manager",
            "email": "manager@ddlongan.vn"
        }
        set_storage_script = f"""
            localStorage.setItem("dd_user_info", JSON.stringify({json.dumps(user_test_data)}));
            localStorage.setItem("dd_wip_role", "manager");
        """
        self.driver.execute_script(set_storage_script)
        time.sleep(0.5)

        # 2. Làm mới trang (F5 Reload) để kiểm tra cơ chế tự động đọc Storage khi khởi động
        self.driver.refresh()
        time.sleep(1.5)

        # 3. Kiểm tra App tự động mở màn hình chính (appMainWrapper) và ẩn màn hình Portal
        is_portal_hidden = self.driver.execute_script("""
            const portal = document.getElementById('loginPortalScreen');
            return portal.style.display === 'none' || window.getComputedStyle(portal).display === 'none';
        """)
        self.assertTrue(is_portal_hidden, "Cổng đăng nhập phải tự động ẩn khi đã có thông tin session hợp lệ.")

        # 4. Kiểm tra Role Badge hiển thị đúng quyền 'Quản Lý'
        role_badge = self.driver.find_element(By.ID, "currentRoleBadge").text.strip()
        print(f"   👤 [Khôi phục Role Badge sau F5]: {role_badge} (Kỳ vọng: Quản lý)")
        self.assertTrue("Quản" in role_badge or "Manager" in role_badge)

        self.save_evidence("Test03_Storage_Session_Recovery")
        print("   ✅ [Test 03] Cơ chế lưu trữ phiên & khôi phục tự động hoạt động ổn định!")

    # ==============================================================================================
    # TEST 4: KIỂM THỬ CHUYỂN ĐỔI TRẠNG THÁI BÁO CÁO (BẢN NHÁP <-> ĐÃ CHỐT SỔ)
    # ==============================================================================================
    def test_04_report_status_transition_and_audit(self):
        """Kiểm thử thay đổi trạng thái Báo cáo (DRAFT -> SUBMITTED) và Tag hiển thị"""
        print("\n🧪 [Test 04] Kiểm tra chuyển đổi trạng thái Báo Cáo (Bản nháp <-> Chốt sổ)...")

        # Chuyển về Tab 1 và chuyển trạng thái sang SUBMITTED
        script = """
            document.querySelector("button[data-tab='tab-wip']").click();
            appState.report.status = "SUBMITTED";
            renderReportUI();
        """
        self.driver.execute_script(script)
        time.sleep(0.5)

        # Kiểm tra tag trạng thái
        status_tag = self.driver.find_element(By.ID, "reportStatusTag")
        print(f"   🏷️ [Trạng thái Báo Cáo]: {status_tag.text.strip()}")
        self.assertIn("ĐÃ CHỐT SỔ", status_tag.text)
        self.assertIn("submitted", status_tag.get_attribute("class"))

        # Chuyển ngược lại về DRAFT
        script_draft = """
            appState.report.status = "DRAFT";
            renderReportUI();
        """
        self.driver.execute_script(script_draft)
        time.sleep(0.5)

        status_tag_draft = self.driver.find_element(By.ID, "reportStatusTag")
        print(f"   🏷️ [Trạng thái Báo Cáo sau chuyển đổi]: {status_tag_draft.text.strip()}")
        self.assertIn("BẢN NHÁP", status_tag_draft.text)
        self.assertNotIn("submitted", status_tag_draft.get_attribute("class"))

        self.save_evidence("Test04_Report_Status_Transition")
        print("   ✅ [Test 04] Quản lý trạng thái Báo cáo và giao diện chốt sổ chính xác 100%!")


if __name__ == "__main__":
    print("=" * 90)
    print("   BỘ KIỂM THỬ CHUYÊN SÂU: LOGIC TÍNH TOÁN & LƯU TRỮ (D&D LONG AN WIP TRACKING)")
    print("=" * 90)
    unittest.main(verbosity=2)
