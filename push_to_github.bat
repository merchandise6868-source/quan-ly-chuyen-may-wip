@echo off
chcp 65001 > nul
echo ==================================================
echo 🚀 TỰ ĐỘNG ĐẨY CODE LÊN GITHUB & CLOUDFLARE
echo ==================================================
echo.

git add .
set /p msg="Nhập nội dung commit (hoặc nhấn Enter để chọn mặc định): "
if "%msg%"=="" set msg="feat: cập nhật hệ thống quản lý tiến độ chuyền may"

git commit -m "%msg%"
git push origin main

echo.
echo ✅ Đã đẩy code thành công! Cloudflare Worker sẽ tự động cập nhật sau 10 giây.
pause
