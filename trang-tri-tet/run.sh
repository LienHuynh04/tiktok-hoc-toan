#!/bin/bash
# Trang Trí Tết - chay tren macOS (ban Mac cua BAT-LIVE.bat)
# Cach dung: mo Terminal tai thu muc nay roi go:  bash run.sh
cd "$(dirname "$0")" || exit 1

if [ ! -d node_modules ]; then
  echo "Lan dau chay: dang cai thu vien, doi 1-2 phut..."
  npm install || { echo "Loi cai thu vien. Kiem tra Node.js: node -v"; exit 1; }
fi

# Che do live: trang stage khong tu tai lai khi sua code
export LIVE_MODE=1
# Cong rieng cua Trang Tri Tet (Lop Toan 3007, Lop Hoc Chu 3006)
export PORT=3022

echo "Dang bat Trang Tri Tet... Dong cua so Terminal nay la tat."
echo "Link cho TikTok LIVE Studio: http://lvh.me:3022/?view=stage  (1080 x 1920)"

( sleep 8; open "http://localhost:3022" ) &

# Treo live ca ngay: server bi tat thi tu bat lai sau 5 giay
while true; do
  npm run dev
  echo ""
  echo "[$(date '+%H:%M:%S')] Server bi tat, tu bat lai sau 5 giay... (dong Terminal de tat han)"
  sleep 5
done
