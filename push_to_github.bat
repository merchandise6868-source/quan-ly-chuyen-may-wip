@echo off
title Push code len GitHub
cd /d "%~dp0"

echo ====================================================
echo DANG DAY MA NGUON LEN GITHUB REPOSITORY...
echo ====================================================
echo.

git status
echo.
git add .
git commit -m "feat: initial project setup"
echo.
echo Dang thuc hien: git push -u origin main ...
echo.
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ====================================================
    echo [THANH CONG] Da day code len GitHub thanh cong!
    echo ====================================================
) else (
    echo ====================================================
    echo [CHUA THANH CONG] Vui long kiem tra thong bao loi o tren.
    echo ====================================================
)

echo.
pause
