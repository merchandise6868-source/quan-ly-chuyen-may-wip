import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--window-size=1280,900")
chrome_options.add_argument("--no-sandbox")

driver = webdriver.Chrome(options=chrome_options)
try:
    html_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "frontend", "index.html"))
    driver.get(f"file:///{html_path.replace(os.sep, '/')}")
    time.sleep(1)

    # Inject appState mocking PO-054 on 2026-10-05 (Monday) with Saturday 2026-10-03 data
    driver.execute_script("""
        appState.currentDate = '2026-10-05';
        appState.prevReportDate = '2026-10-03';
        appState.prevDayWipByBatch = {
            'Lô 1': { wip_qc: 110, wip_pairing: 155 },
            'Lô 2': { wip_qc: 0, wip_pairing: 0 }
        };
        appState.report = {
            po_id: 'po-1791011755082',
            report_date: '2026-10-05',
            status: 'DRAFT',
            batches: [
                {
                    id: 'b-1',
                    batch_name: 'Lô 1',
                    batch_plan: 1018,
                    into_sewing: 0,
                    daily_out: 629,
                    wip_sewing: 59,
                    wip_qc: 190,
                    wip_pairing: 140,
                    wip_packing: 0,
                    wip_warehouse: 0,
                    daily_finished: 694
                },
                {
                    id: 'b-2',
                    batch_name: 'Lô 2',
                    batch_plan: 700,
                    into_sewing: 0,
                    daily_out: 0,
                    wip_sewing: 700,
                    wip_qc: 0,
                    wip_pairing: 0,
                    wip_packing: 0,
                    wip_warehouse: 0,
                    daily_finished: 0
                }
            ]
        };
        const portal = document.getElementById('loginPortalScreen');
        if (portal) portal.style.setProperty('display', 'none', 'important');
        const main = document.getElementById('appMainWrapper');
        if (main) main.style.setProperty('display', 'block', 'important');
        renderReportUI();
        recalculateAllInPlace();
        const s3 = document.getElementById('balanceCheckCard_1');
        if (s3) s3.scrollIntoView({ behavior: 'instant', block: 'center' });
    """)
    time.sleep(1)

    last_idx = 1
    s3 = driver.find_element(By.ID, f"balanceCheckCard_{last_idx}")
    s3.screenshot("test_screenshots/s3_card_laptop.png")
    ton_qua_el = driver.find_element(By.ID, f"calcTonQua_{last_idx}")
    ton_qua_lbl = driver.find_element(By.ID, f"lblTonQuaText_{last_idx}")
    xuat_el = driver.find_element(By.ID, f"calcBalanceXuat_{last_idx}")
    pair_el = driver.find_element(By.ID, f"calcBalancePair_{last_idx}")
    qc_el = driver.find_element(By.ID, f"calcBalanceQc_{last_idx}")
    ve1_el = driver.find_element(By.ID, f"calcBalanceVe1_{last_idx}")
    ve2_el = driver.find_element(By.ID, f"calcBalanceVe2_{last_idx}")
    badge_el = driver.find_element(By.ID, f"calcBalanceBadge_{last_idx}")

    print("LABEL:", ton_qua_lbl.get_attribute("textContent").strip())
    print("TON QUA:", ton_qua_el.get_attribute("textContent").strip())
    print("XUAT:", xuat_el.get_attribute("textContent").strip())
    print("PAIR:", pair_el.get_attribute("textContent").strip())
    print("QC:", qc_el.get_attribute("textContent").strip())
    print("VE 1:", ve1_el.get_attribute("textContent").strip())
    print("VE 2:", ve2_el.get_attribute("textContent").strip())
    print("BADGE:", badge_el.get_attribute("textContent").strip())

    driver.set_window_size(390, 844)
    time.sleep(0.5)
    s3.screenshot("test_screenshots/s3_card_mobile.png")
    print("Mobile screenshot saved!")

finally:
    driver.quit()
