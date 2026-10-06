import time
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

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

    # Initialize appState with PO-054 on 2026-10-05
    init_res = driver.execute_script("""
        const portal = document.getElementById('loginPortalScreen');
        if (portal) portal.style.setProperty('display', 'none', 'important');
        const main = document.getElementById('appMainWrapper');
        if (main) main.style.setProperty('display', 'block', 'important');

        appState.currentDate = '2026-10-05';
        appState.prevReportDate = '2026-10-03';
        appState.cumImportsByBatch = { 'Lô 1': 1018, 'Lô 2': 700 };
        appState.cumExportsByBatch = { 'Lô 1': 0, 'Lô 2': 0 };
        appState.editingBatches = {};
        appState.prevDayWipByBatch = {
            'Lô 1': { wip_qc: 110, wip_pairing: 155 },
            'Lô 2': { wip_qc: 0, wip_pairing: 0 }
        };
        appState.currentPO = { id: 'po-1791011755082', po_number: 'PO-054' };
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
                    daily_finished: 0
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
        try {
            renderReportUI();
            recalculateAllInPlace();
        } catch(e) {
            return e.stack;
        }
        return 'OK';
    """)
    print("INIT RES:", init_res)
    time.sleep(0.5)

    # Mock fetch for saving so we can track the save calls
    driver.execute_script("""
        window.savedPayloads = [];
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            if (args[0] === '/api/report' && args[1] && args[1].method === 'POST') {
                const payload = JSON.parse(args[1].body);
                window.savedPayloads.push(payload);
                return {
                    ok: true,
                    json: async () => ({ success: true, message: 'Saved successfully' })
                };
            }
            return originalFetch.apply(this, args);
        };
    """)

    # Find TP input
    tp_input = driver.find_element(By.CSS_SELECTOR, ".field-daily-finished")
    tp_input.click()
    tp_input.clear()
    tp_input.send_keys("710")
    time.sleep(0.2)

    # TEST 1: Press Enter
    tp_input.send_keys(Keys.ENTER)
    time.sleep(0.5)

    saved_count = driver.execute_script("return window.savedPayloads.length;")
    last_saved_tp = driver.execute_script("""
        if (window.savedPayloads.length === 0) return null;
        const last = window.savedPayloads[window.savedPayloads.length - 1];
        return last.batches.reduce((sum, b) => sum + (Number(b.daily_finished) || 0), 0);
    """)
    print("TEST 1 (Enter): saved_count =", saved_count, ", saved_tp =", last_saved_tp)
    assert saved_count >= 1, "Save must be called on Enter!"
    assert last_saved_tp == 710, f"Expected 710 saved, got {last_saved_tp}!"

    # TEST 2: Blur / Click outside with a new value
    tp_input.click()
    tp_input.clear()
    tp_input.send_keys("750")
    time.sleep(0.2)

    # Press TAB to trigger blur / navigate away
    tp_input.send_keys(Keys.TAB)
    time.sleep(0.5)

    saved_count_2 = driver.execute_script("return window.savedPayloads.length;")
    last_saved_tp_2 = driver.execute_script("""
        const last = window.savedPayloads[window.savedPayloads.length - 1];
        return last.batches.reduce((sum, b) => sum + (Number(b.daily_finished) || 0), 0);
    """)
    print("TEST 2 (Click outside): saved_count =", saved_count_2, ", saved_tp =", last_saved_tp_2)
    assert saved_count_2 > saved_count, "Save must be called on click outside!"
    assert last_saved_tp_2 == 750, f"Expected 750 saved, got {last_saved_tp_2}!"

    # Screenshot Section 3
    s3 = driver.find_element(By.ID, "balanceCheckCard_1")
    s3.screenshot("test_screenshots/s3_card_auto_saved.png")
    print("ALL AUTO-SAVE TESTS PASSED!")

finally:
    driver.quit()
