#!/bin/bash
# Bug Đi WC - chay tren macOS (ban Mac cua BAT-LIVE.bat)
# Cach dung: mo Terminal tai thu muc nay roi go:  bash run.sh
cd "$(dirname "$0")" || exit 1

if [ ! -d node_modules ]; then
  echo "Lan dau chay: dang cai thu vien, doi 1-2 phut..."
  npm install || { echo "Loi cai thu vien. Kiem tra Node.js: node -v"; exit 1; }
fi

# Che do live: trang stage khong tu tai lai khi sua code
export LIVE_MODE=1
# Cong rieng cua Bug Đi WC
export PORT=3029

echo "Dang bat Bug Đi WC... Dong cua so Terminal nay la tat."
echo "Link cho TikTok LIVE Studio: http://lvh.me:3029/?view=stage  (1080 x 1920)"

( sleep 8; open "http://localhost:3029" ) &

# Treo live ca ngay: server bi tat thi tu bat lai sau 5 giay
while true; do
  npm run dev
  echo ""
  echo "[$(date '+%H:%M:%S')] Server bi tat, tu bat lai sau 5 giay... (dong Terminal de tat han)"
  sleep 5
done
