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
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager

LOCAL_HTML_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "frontend", "index.html"))
TARGET_URL = f"file:///{LOCAL_HTML_PATH.replace(os.sep, '/')}"


class TestNewUIRendering(unittest.TestCase):
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

    @classmethod
    def tearDownClass(cls):
        if cls.driver:
            time.sleep(1)
            cls.driver.quit()

    def test_01_render_batch_card_desktop(self):
        """Chụp ảnh chi tiết Card Lô Hàng trên Laptop / Desktop"""
        self.driver.set_window_size(1200, 950)
        self.driver.get(TARGET_URL)
        time.sleep(1)

        init_script = """
            localStorage.setItem("dd_user_info", JSON.stringify({ role: "admin", name: "Sếp Tổng", phone: "0818189868" }));
            localStorage.setItem("dd_wip_role", "admin");
            document.getElementById('loginPortalScreen').style.setProperty('display', 'none', 'important');
            document.getElementById('appMainWrapper').style.setProperty('display', 'block', 'important');

            appState.currentUserRole = 'admin';
            appState.currentCustomer = { id: 1, name: 'Liên Thái (Lth)' };
            appState.currentPO = { id: 101, po_number: 'DA-059 (PO-053)', po_plan: 2150, style: 'Style DA-059' };
            appState.currentDate = '2026-09-30';
            appState.cumImportsByBatch = { 'Lô 1': 974 };
            appState.cumExportsByBatch = { 'Lô 1': 314 };

            appState.report = {
                po_id: 101,
                report_date: '2026-09-30',
                status: 'DRAFT',
                batches: [
                    {
                        batch_name: 'Lô 1',
                        batch_plan: 1265,
                        into_sewing: 273,
                        daily_out: 88,
                        wip_sewing: 425,
                        wip_qc: 170,
                        wip_pairing: 250,
                        wip_packing: 0,
                        wip_warehouse: 0,
                        note_sewing: '',
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
        self.driver.execute_script(init_script)
        time.sleep(1)

        self.driver.set_window_size(1200, 1400)
        time.sleep(0.5)

        # Scroll to batch card
        batch_card = self.driver.find_element(By.ID, "batchCard_0")
        self.driver.execute_script("arguments[0].scrollIntoView({ behavior: 'instant', block: 'start' });", batch_card)
        time.sleep(0.5)

        # Chụp riêng phần card lô hàng
        screenshot_card = os.path.join(self.screenshot_dir, "Hinh1_Batch_Card_Chuan_Desktop.png")
        batch_card.screenshot(screenshot_card)
        print(f"✅ Đã chụp card Lô 1: {screenshot_card}")

        # Chụp riêng phần Bảng 1 Nhập Xuất
        table1 = self.driver.find_element(By.CSS_SELECTOR, "#batchCard_0 .h1-table-card")
        screenshot_t1 = os.path.join(self.screenshot_dir, "Table1_NX_Desktop.png")
        table1.screenshot(screenshot_t1)
        print(f"✅ Đã chụp Bảng 1: {screenshot_t1}")

    def test_02_render_batch_card_mobile(self):
        """Chụp ảnh chi tiết Card Lô Hàng trên Mobile (iOS / Android)"""
        self.driver.set_window_size(412, 915)
        time.sleep(0.5)

        batch_card = self.driver.find_element(By.ID, "batchCard_0")
        self.driver.execute_script("arguments[0].scrollIntoView({ behavior: 'instant', block: 'center' });", batch_card)
        time.sleep(0.5)

        screenshot_mobile_card = os.path.join(self.screenshot_dir, "Hinh1_Batch_Card_Chuan_Mobile.png")
        batch_card.screenshot(screenshot_mobile_card)
        print(f"✅ Đã chụp card Lô 1 trên Mobile: {screenshot_mobile_card}")


if __name__ == "__main__":
    unittest.main()
