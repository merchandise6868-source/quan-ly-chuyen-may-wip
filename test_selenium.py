"""
File: test_selenium.py
Mục đích: Tự động hóa kiểm thử giao diện Website Hệ thống Quản lý Tiến độ Chuyền may WIP / Website bất kỳ bằng Selenium Python.
"""

import time
import os
import unittest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# ==========================================================
# CẤU HÌNH KIỂM THỬ (Điều chỉnh URL tại đây nếu cần)
# ==========================================================
# Nếu test file index.html local trong máy:
LOCAL_HTML_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "frontend", "index.html"))
BASE_URL = f"file:///{LOCAL_HTML_PATH.replace(os.sep, '/')}"

# Nếu bạn chạy server local hoặc có link web online, hãy đổi BASE_URL:
# BASE_URL = "http://localhost:8787"
# BASE_URL = "https://your-deployed-domain.com"


class TestWipWebsite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Khởi tạo Chrome Driver trước khi chạy các test case."""
        chrome_options = Options()
        # Thêm các tùy chọn khởi động Chrome
        chrome_options.add_argument("--start-maximized")
        chrome_options.add_argument("--disable-notifications")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        
        # Bỏ comment dòng dưới nếu muốn chạy ẩn không hiện cửa sổ trình duyệt (Headless mode):
        # chrome_options.add_argument("--headless=new")

        # Tự động tải và cấu hình ChromeDriver tương thích phiên bản Chrome hiện tại
        service = Service(ChromeDriverManager().install())
        cls.driver = webdriver.Chrome(service=service, options=chrome_options)
        cls.wait = WebDriverWait(cls.driver, 10)
        print(f"\n[INFO] Đang mở trình duyệt để kiểm thử: {BASE_URL}")

    @classmethod
    def tearDownClass(cls):
        """Đóng trình duyệt sau khi hoàn thành tất cả test."""
        if cls.driver:
            time.sleep(2)  # Dừng 2 giây để quan sát kết quả trước khi đóng
            cls.driver.quit()
            print("\n[INFO] Đã đóng trình duyệt kiểm thử thành công.")

    def test_01_page_title(self):
        """Kiểm tra tiêu đề (title) của trang web."""
        self.driver.get(BASE_URL)
        title = self.driver.title
        print(f"\n-> Test 01 - Tiêu đề trang: '{title}'")
        self.assertTrue(len(title) > 0, "Tiêu đề trang không được rỗng!")
        self.assertIn("WIP", title.upper(), "Tiêu đề trang nên chứa từ khóa 'WIP'")

    def test_02_login_portal_displayed(self):
        """Kiểm tra màn hình đăng nhập / Cổng đăng nhập có hiển thị không."""
        self.driver.get(BASE_URL)
        portal = self.wait.until(
            EC.presence_of_element_located((By.ID, "loginPortalScreen"))
        )
        self.assertTrue(portal.is_displayed(), "Cổng đăng nhập (loginPortalScreen) cần được hiển thị lúc ban đầu.")
        print("-> Test 02 - Màn hình đăng nhập hiển thị chính xác.")

    def test_03_check_role_cards(self):
        """Kiểm tra các thẻ lựa chọn vai trò (Admin / Quản lý / Chuyền may) có trên màn hình."""
        self.driver.get(BASE_URL)
        role_cards = self.driver.find_elements(By.CLASS_NAME, "login-role-choice-card")
        print(f"-> Test 03 - Tìm thấy {len(role_cards)} vai trò đăng nhập.")
        self.assertGreaterEqual(len(role_cards), 1, "Cần có ít nhất 1 thẻ chọn vai trò.")

    def test_04_take_screenshot(self):
        """Chụp ảnh màn hình lưu lại bằng chứng test."""
        screenshot_dir = os.path.join(os.path.dirname(__file__), "test_screenshots")
        os.makedirs(screenshot_dir, exist_ok=True)
        screenshot_path = os.path.join(screenshot_dir, "portal_homepage.png")
        self.driver.save_screenshot(screenshot_path)
        print(f"-> Test 04 - Đã chụp ảnh màn hình lưu tại: {screenshot_path}")
        self.assertTrue(os.path.exists(screenshot_path), "File ảnh chụp màn hình không tồn tại!")


if __name__ == "__main__":
    unittest.main()
