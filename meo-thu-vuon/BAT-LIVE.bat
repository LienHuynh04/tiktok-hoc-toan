@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules (
  echo Lan dau chay: dang cai thu vien, doi 1-2 phut...
  call npm install
)
echo Dang bat Mèo Thủ Vườn... Dong cua so nay la tat.
echo Link cho TikTok LIVE Studio: http://lvh.me:3017/?view=stage  (1080 x 1920)
echo rem Che do live: trang stage khong tu tai lai khi sua code
set LIVE_MODE=1
rem Cong rieng cua Mèo Thủ Vườn (Lop Toan dung 3007)
set PORT=3017
start "" cmd /c "timeout /t 8 >nul & start http://localhost:3017"
rem Treo live ca ngay: server bi tat (loi, het bo nho...) thi tu bat lai sau 5 giay.
rem Server bat lai tu ket noi TikTok neu lan truoc dang ket noi. Trang stage tu noi lai, game khong mat diem.
:chay
call npm run dev
echo.
echo [%date% %time%] Server bi tat, tu bat lai sau 5 giay... (dong cua so nay de tat han)
timeout /t 5 >nul
goto chay
