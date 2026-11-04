#!/bin/bash
# Phòng Yoga Thiền - chay tren macOS (ban Mac cua BAT-LIVE.bat)
# Cach dung: mo Terminal tai thu muc nay roi go:  bash run.sh
cd "$(dirname "$0")" || exit 1

if [ ! -d node_modules ]; then
  echo "Lan dau chay: dang cai thu vien, doi 1-2 phut..."
  npm install || { echo "Loi cai thu vien. Kiem tra Node.js: node -v"; exit 1; }
fi

# Che do live: trang stage khong tu tai lai khi sua code
export LIVE_MODE=1
# Cong rieng cua Phong Yoga Thien (Lop Toan 3007, Tarot 3008, IQ 3009, Bug Nghe Loi 3010)
export PORT=3011

echo "Dang bat Phong Yoga Thien... Dong cua so Terminal nay la tat."
echo "Link cho TikTok LIVE Studio: http://lvh.me:3011/?view=stage  (1080 x 1920)"

( sleep 8; open "http://localhost:3011" ) &

# Treo live ca ngay: server bi tat thi tu bat lai sau 5 giay
while true; do
  npm run dev
  echo ""
  echo "[$(date '+%H:%M:%S')] Server bi tat, tu bat lai sau 5 giay... (dong Terminal de tat han)"
  sleep 5
done
