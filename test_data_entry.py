"""
========================================================================================
KỊCH BẢN KIỂM THỬ TỰ ĐỘNG NHẬP LIỆU TOÀN DIỆN (DATA ENTRY AUTOMATION TEST)
HỆ THỐNG QUẢN LÝ TIẾN ĐỘ CHUYỀN MAY & WIP FLOW TRACKING (D&D LONG AN)
========================================================================================
"""

import os
import sys
import time
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
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

LOCAL_HTML_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "frontend", "index.html"))
TARGET_URL = f"file:///{LOCAL_HTML_PATH.replace(os.sep, '/')}"


class TestWIPDataEntry(unittest.TestCase):
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
        print(f"\n[BẮT ĐẦU KIỂM THỬ NHẬP LIỆU] Target: {TARGET_URL}")

    @classmethod
    def tearDownClass(cls):
        if cls.driver:
            time.sleep(3)
            cls.driver.quit()
            print("\n[KẾT THÚC] Đã hoàn thành và đóng trình duyệt.")

    def test_full_data_entry_flow(self):
        """Kịch bản kiểm thử nhập liệu thực tế trên bảng kiểm kê WIP"""
        self.driver.get(TARGET_URL)
        time.sleep(1)

        print("\n1. Khởi tạo dữ liệu mẫu và mở giao diện kiểm kê WIP...")
        init_script = """
            // Mock API fetch khi test offline để tránh lỗi mạng
            window.originalFetch = window.fetch;
            window.fetch = async function(url, options) {
                if (typeof url === 'string' && url.includes('/api/report')) {
                    return {
                        ok: true,
                        json: async () => ({ success: true, message: "Lưu thành công!" })
                    };
                }
                return { ok: true, json: async () => ({}) };
            };

            // Lưu session user admin
            localStorage.setItem("dd_user_info", JSON.stringify({ role: "admin", name: "Admin Test", phone: "0818189868" }));
            localStorage.setItem("dd_wip_role", "admin");

            // Ẩn portal, hiện main app
            document.getElementById('loginPortalScreen').style.setProperty('display', 'none', 'important');
            document.getElementById('appMainWrapper').style.setProperty('display', 'block', 'important');

            // Setup state
            appState.currentUserRole = 'admin';
            appState.currentCustomer = { id: 1, name: 'ADIDAS VIỆT NAM' };
            appState.currentPO = { id: 101, po_number: 'PO-2026-ADI-050', po_plan: 2000, style: 'Alpha Runner' };
            appState.currentDate = '2026-09-30';
            appState.report = {
                po_id: 101,
                report_date: '2026-09-30',
                status: 'DRAFT',
                batches: [
                    {
                        batch_name: 'LÔ 1',
                        batch_plan: 1000,
                        into_sewing: 0,
                        daily_out: 0,
                        wip_sewing: 0,
                        wip_qc: 0,
                        wip_pairing: 0,
                        wip_packing: 0,
                        wip_warehouse: 0,
                        note_sewing: '',
                        note_qc: '',
                        note_pairing: '',
                        note_packing: '',
                        note_warehouse: '',
                        shortage_mat_xac: 0,
                        shortage_hang_phe: 0,
                        shortage_khac: 0,
                        shortage_note: ''
                    }
                ]
            };
            
            // Render giao diện Tab 1
            if (typeof renderReportUI === 'function') {
                renderReportUI();
            }
        """
        self.driver.execute_script(init_script)
        time.sleep(1)

        print("2. Tự động nhập số lượng 'Vào chuyền' (500) và 'Đã giao khách' (100)...")
        input_into_sewing = self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".field-into-sewing")))
        input_daily_out = self.driver.find_element(By.CSS_SELECTOR, ".field-daily-out")

        input_into_sewing.clear()
        input_into_sewing.send_keys("500")
        self.driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", input_into_sewing)
        time.sleep(0.3)

        input_daily_out.clear()
        input_daily_out.send_keys("100")
        self.driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", input_daily_out)
        time.sleep(0.3)

        print("3. Mở khóa '✏️ Sửa' để nhập số liệu kiểm kê 5 công đoạn WIP...")
        btn_edit_batch = self.driver.find_element(By.CSS_SELECTOR, ".btn-batch-toggle")
        self.driver.execute_script("arguments[0].click();", btn_edit_batch)
        time.sleep(0.5)

        # Nhập 5 công đoạn kiểm kê
        f_sewing = self.driver.find_element(By.CSS_SELECTOR, ".field-wip-sewing")
        f_qc = self.driver.find_element(By.CSS_SELECTOR, ".field-wip-qc")
        f_pairing = self.driver.find_element(By.CSS_SELECTOR, ".field-wip-pairing")
        f_packing = self.driver.find_element(By.CSS_SELECTOR, ".field-wip-packing")
        f_wh = self.driver.find_element(By.CSS_SELECTOR, ".field-wip-warehouse")

        f_sewing.clear(); f_sewing.send_keys("150")
        self.driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", f_sewing)

        f_qc.clear(); f_qc.send_keys("50")
        self.driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", f_qc)

        f_pairing.clear(); f_pairing.send_keys("50")
        self.driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", f_pairing)

        f_packing.clear(); f_packing.send_keys("100")
        self.driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", f_packing)

        f_wh.clear(); f_wh.send_keys("50")
        self.driver.execute_script("arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", f_wh)
        time.sleep(0.3)

        print("4. Nhập tên người phụ trách kiểm kê từng vị trí...")
        f_note_sewing = self.driver.find_element(By.CSS_SELECTOR, ".field-note-sewing")
        f_note_qc = self.driver.find_element(By.CSS_SELECTOR, ".field-note-qc")
        f_note_pairing = self.driver.find_element(By.CSS_SELECTOR, ".field-note-pairing")
        f_note_packing = self.driver.find_element(By.CSS_SELECTOR, ".field-note-packing")
        f_note_wh = self.driver.find_element(By.CSS_SELECTOR, ".field-note-warehouse")

        f_note_sewing.clear(); f_note_sewing.send_keys("Chuyền Trưởng Nam")
        f_note_qc.clear(); f_note_qc.send_keys("QC Hoa")
        f_note_pairing.clear(); f_note_pairing.send_keys("Tổ Phối Hùng")
        f_note_packing.clear(); f_note_packing.send_keys("Đóng Gói Mai")
        f_note_wh.clear(); f_note_wh.send_keys("Kho TP Dũng")
        time.sleep(0.3)

        # Bấm Lưu khóa dòng kiểm kê
        btn_save_batch = self.driver.find_element(By.CSS_SELECTOR, ".btn-batch-toggle")
        self.driver.execute_script("arguments[0].click();", btn_save_batch)
        time.sleep(0.8)

        print("5. Kiểm tra kết quả tự động tính toán trên giao diện...")
        calc_into_sewing = self.driver.find_element(By.ID, "calcIntoSewing_0").text.strip()
        calc_delivered = self.driver.find_element(By.ID, "calcDelivered_0").text.strip()
        calc_theo = self.driver.find_element(By.ID, "calcTheoWip_0").text.strip()
        calc_actual = self.driver.find_element(By.ID, "calcActualWip_0").text.strip()
        calc_shortage = self.driver.find_element(By.ID, "calcShortage_0").text.strip()

        print(f"   📊 [Vào Chuyền Tích Lũy]: {calc_into_sewing} đôi (Kỳ vọng: 500)")
        print(f"   📊 [Xuất Giao Khách]:    {calc_delivered} đôi (Kỳ vọng: 100)")
        print(f"   📊 [Tồn Lý Thuyết]:       {calc_theo} đôi (Kỳ vọng: 400)")
        print(f"   📊 [Tồn Thực Tế]:        {calc_actual} đôi (Kỳ vọng: 400)")
        print(f"   📊 [Trạng Thái Thiếu]:   {calc_shortage} (Kỳ vọng: 0 (OK))")

        self.assertIn("500", calc_into_sewing)
        self.assertIn("100", calc_delivered)
        self.assertIn("400", calc_theo)
        self.assertIn("400", calc_actual)
        self.assertTrue("0" in calc_shortage or "OK" in calc_shortage)

        print("6. Nhấn nút '💾 Lưu Nháp' và chụp ảnh màn hình bằng chứng...")
        btn_save_draft = self.driver.find_element(By.ID, "btnSaveDraft")
        self.driver.execute_script("arguments[0].click();", btn_save_draft)
        time.sleep(1)

        # Chụp ảnh màn hình lưu bằng chứng
        screenshot_path = os.path.join(self.screenshot_dir, "TC_Data_Entry_Success.png")
        self.driver.save_screenshot(screenshot_path)
        print(f"   📸 Đã chụp ảnh màn hình kết quả kiểm thử nhập liệu tại: {screenshot_path}")
        print("\n🎉 => KIỂM THỬ NHẬP LIỆU THÀNH CÔNG 100%!")


if __name__ == "__main__":
    unittest.main(verbosity=2)
