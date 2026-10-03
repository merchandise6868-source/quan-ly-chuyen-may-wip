import os, sys, time
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
from webdriver_manager.chrome import ChromeDriverManager

chrome_options = Options()
chrome_options.add_argument('--headless=new')
chrome_options.add_argument('--window-size=1600,1100')
chrome_options.add_argument('--disable-gpu')
chrome_options.add_argument('--no-sandbox')
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)

try:
    print(">>> 1. Loading http://localhost:8787 ...")
    driver.get("http://localhost:8787")
    time.sleep(1.5)

    # Login as admin if needed
    driver.execute_script("""
      localStorage.setItem('dd_user_info', JSON.stringify({ role: 'admin', full_name: 'Sếp Tổng Quản Trị (Admin)', phone: '0900000000', email: 'admin@ddlongan.com' }));
      localStorage.setItem('dd_wip_role', 'admin');
      document.cookie = 'dd_wip_session=' + encodeURIComponent(JSON.stringify({ role: 'admin', full_name: 'Sếp Tổng Quản Trị (Admin)', phone: '0900000000', email: 'admin@ddlongan.com' })) + '; path=/; max-age=31536000';
      checkLoginPortalState();
    """)
    time.sleep(1)

    # Ensure cust-2 and po-050 are selected
    driver.execute_script("""
      const selCust = document.getElementById('selectCustomer');
      if (selCust) {
        selCust.value = 'cust-2';
        selCust.dispatchEvent(new Event('change'));
      }
    """)
    time.sleep(1)

    driver.execute_script("""
      const selPO = document.getElementById('selectPO');
      if (selPO) {
        selPO.value = 'po-050';
        selPO.dispatchEvent(new Event('change'));
      }
    """)
    time.sleep(1)

    # TEST CASE 1: Date 2026-09-22 (Before tail sweep)
    print("\n>>> 2. Testing Date 2026-09-22 (Before tail sweep)...")
    driver.execute_script("""
      const repDate = document.getElementById('reportDate');
      repDate.value = '2026-09-22';
      repDate.dispatchEvent(new Event('change'));
    """)
    time.sleep(1.5)

    cards_22 = driver.find_elements(By.CSS_SELECTOR, ".h1-batch-card")
    card_names_22 = [c.find_element(By.CSS_SELECTOR, ".b-name").text.strip() for c in cards_22]
    debt_22 = driver.find_element(By.ID, "summaryPrepDebt").text.strip()
    print(f"Date 22/09 - Cards found ({len(cards_22)}): {card_names_22}")
    print(f"Date 22/09 - Chuẩn Bị còn nợ: {debt_22}")

    assert len(cards_22) == 2, f"Expected 2 cards on 22/09, got {len(cards_22)}"
    assert "Lô 1" in card_names_22[0]
    assert "Lô 2" in card_names_22[1]
    assert debt_22 == "126", f"Expected 126 debt on 22/09, got {debt_22}"

    btn_sweep_22 = driver.find_element(By.ID, "btnOpenSweepTailModal")
    print(f"Date 22/09 - Button text: {btn_sweep_22.text.strip()}")
    assert "126" in btn_sweep_22.text

    # Take screenshot of 22/09
    os.makedirs("test_screenshots", exist_ok=True)
    driver.save_screenshot("test_screenshots/Date_2026-09-22_BeforeSweep.png")

    # TEST CASE 2: Date 2026-09-23 (The tail sweep date!)
    print("\n>>> 3. Testing Date 2026-09-23 (Tail sweep date - ALL 3 BATCHES TOGETHER)...")
    driver.execute_script("""
      const repDate = document.getElementById('reportDate');
      repDate.value = '2026-09-23';
      repDate.dispatchEvent(new Event('change'));
    """)
    time.sleep(1.5)

    cards_23 = driver.find_elements(By.CSS_SELECTOR, ".h1-batch-card")
    card_names_23 = [c.find_element(By.CSS_SELECTOR, ".b-name").text.strip() for c in cards_23]
    debt_23 = driver.find_element(By.ID, "summaryPrepDebt").text.strip()
    print(f"Date 23/09 - Cards found ({len(cards_23)}): {card_names_23}")
    print(f"Date 23/09 - Chuẩn Bị còn nợ: {debt_23}")

    assert len(cards_23) == 3, f"Expected 3 cards displayed side-by-side on 23/09, got {len(cards_23)}"
    assert any("Lô 1" in n for n in card_names_23), "Lô 1 must be displayed"
    assert any("Lô 2" in n for n in card_names_23), "Lô 2 must be displayed"
    assert any("Lô Số Đuôi" in n or "Số đuôi" in n for n in card_names_23), "Lô Số Đuôi must be displayed alongside Lô 1 & Lô 2!"
    assert debt_23 == "0", f"Expected 0 debt on 23/09, got {debt_23}"

    btn_sweep_23 = driver.find_element(By.ID, "btnOpenSweepTailModal")
    print(f"Date 23/09 - Button text: {btn_sweep_23.text.strip()}")
    assert "Đã nhận đủ" in btn_sweep_23.text

    # Take screenshot of 23/09 showing all 3 batch cards
    driver.save_screenshot("test_screenshots/Date_2026-09-23_All3BatchesTogether.png")
    print("📸 Saved screenshot: test_screenshots/Date_2026-09-23_All3BatchesTogether.png")

    # TEST CASE 3: Check Tab 2 on 2026-09-23
    print("\n>>> 4. Testing Tab 2 (Department Flow Logs) on 2026-09-23...")
    driver.find_element(By.ID, "tabBtnDeptLogs").click()
    time.sleep(1)

    dept_tables = driver.find_elements(By.CSS_SELECTOR, ".dept-batch-block")
    print(f"Tab 2 tables found: {len(dept_tables)}")
    assert len(dept_tables) == 3, f"Expected 3 tables in Tab 2 on 23/09, got {len(dept_tables)}"
    driver.save_screenshot("test_screenshots/Tab2_2026-09-23_All3Tables.png")

    # TEST CASE 4: Switch back to Tab 1 and navigate back to 2026-09-22
    print("\n>>> 5. Navigating back to 2026-09-22 to verify dynamic hiding before sweep date...")
    driver.find_element(By.CSS_SELECTOR, "button[data-tab='tab-wip']").click()
    time.sleep(0.5)
    driver.execute_script("""
      const repDate = document.getElementById('reportDate');
      repDate.value = '2026-09-22';
      repDate.dispatchEvent(new Event('change'));
    """)
    time.sleep(1.5)

    cards_back = driver.find_elements(By.CSS_SELECTOR, ".h1-batch-card")
    card_names_back = [c.find_element(By.CSS_SELECTOR, ".b-name").text.strip() for c in cards_back]
    print(f"Back to 22/09 - Cards: {card_names_back}")
    assert len(cards_back) == 2, f"Expected 2 cards when navigating back to 22/09, got {len(cards_back)}"
    assert driver.find_element(By.ID, "summaryPrepDebt").text.strip() == "126"

    # TEST CASE 5: Navigate forward to 2026-09-24 (subsequent day)
    print("\n>>> 6. Navigating forward to 2026-09-24 (subsequent day >= sweep date)...")
    driver.execute_script("""
      const repDate = document.getElementById('reportDate');
      repDate.value = '2026-09-24';
      repDate.dispatchEvent(new Event('change'));
    """)
    time.sleep(1.5)

    cards_24 = driver.find_elements(By.CSS_SELECTOR, ".h1-batch-card")
    card_names_24 = [c.find_element(By.CSS_SELECTOR, ".b-name").text.strip() for c in cards_24]
    print(f"Date 24/09 - Cards found ({len(cards_24)}): {card_names_24}")
    assert len(cards_24) == 3, f"Expected 3 cards on 24/09, got {len(cards_24)}"
    assert any("Lô Số Đuôi" in n or "Số đuôi" in n for n in card_names_24)

    print("\n🎉 ALL TAIL BATCH TESTS PASSED 100% SUCCESSFULLY!")

finally:
    driver.quit()
