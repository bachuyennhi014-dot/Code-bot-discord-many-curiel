#!/usr/bin/env bash
# ==============================================================================
# SCRIPT CÀI ĐẶT TỰ ĐỘNG DISCORD BOT LÊN VPS (24/7 HOẠT ĐỘNG LIÊN TỤC)
# Dự án: Khoảng không Tu Tiên (Many Curiel Discord Bot)
# Hỗ trợ: Ubuntu 20.04/22.04/24.04, Debian 11/12
# ==============================================================================

set -e

# Màu sắc thông báo
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "    🚀 BẮT ĐẦU CÀI ĐẶT DISCORD BOT CHẠY 24/7 TRÊN VPS"
echo "    ✨ Khoảng Không Tu Tiên - Bảo Toàn 100% Dữ Liệu"
echo "======================================================================"
echo -e "${NC}"

# 1. Kiểm tra quyền root/sudo
echo -e "${YELLOW}[1/7] Kiểm tra quyền quản trị và môi trường hệ thống...${NC}"
if [ "$EUID" -ne 0 ]; then
  SUDO_CMD="sudo"
else
  SUDO_CMD=""
fi

# 2. Cập nhật hệ thống & cài đặt gói cơ bản
echo -e "${YELLOW}[2/7] Cập nhật apt và cài đặt git, curl, build-essential...${NC}"
$SUDO_CMD apt-get update -y
$SUDO_CMD apt-get install -y curl git build-essential ca-certificates gnupg

# 3. Cài đặt Node.js 20.x LTS (nếu chưa có hoặc phiên bản cũ)
echo -e "${YELLOW}[3/7] Kiểm tra và cài đặt Node.js 20.x LTS...${NC}"
NEED_NODE=true
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VER" -ge 20 ]; then
    echo -e "${GREEN}✓ Node.js $(node -v) đã sẵn sàng.${NC}"
    NEED_NODE=false
  fi
fi

if [ "$NEED_NODE" = true ]; then
  echo -e "${CYAN}→ Đang tải Node.js 20.x từ NodeSource...${NC}"
  $SUDO_CMD mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | $SUDO_CMD gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg --yes 2>/dev/null || true
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | $SUDO_CMD tee /etc/apt/sources.list.d/nodesource.list >/dev/null
  $SUDO_CMD apt-get update -y
  $SUDO_CMD apt-get install -y nodejs
  echo -e "${GREEN}✓ Đã cài đặt Node.js $(node -v) & npm $(npm -v).${NC}"
fi

# 4. Cài đặt PM2 toàn cục
echo -e "${YELLOW}[4/7] Kiểm tra PM2 (Process Manager 24/7)...${NC}"
if ! command -v pm2 >/dev/null 2>&1; then
  echo -e "${CYAN}→ Đang cài đặt PM2 toàn cục...${NC}"
  $SUDO_CMD npm install -g pm2
  echo -e "${GREEN}✓ Đã cài đặt PM2 thành công!${NC}"
else
  echo -e "${GREEN}✓ PM2 đã được cài đặt sẵn ($(pm2 -v)).${NC}"
fi

# 5. Khởi tạo thư mục dữ liệu, sao lưu và log
echo -e "${YELLOW}[5/7] Thiết lập thư mục dữ liệu bền vững (data, backup, logs)...${NC}"
mkdir -p data backup logs

# Khởi tạo data/database.json từ persistent mirror nếu chưa có
if [ ! -f "data/database.json" ] && [ -f "src/bot/database/persistent_data.json" ]; then
  cp "src/bot/database/persistent_data.json" "data/database.json"
  echo -e "${GREEN}✓ Đã khởi tạo data/database.json an toàn từ nguồn mirror bền vững.${NC}"
fi

# 6. Cài đặt npm dependencies
echo -e "${YELLOW}[6/7] Cài đặt các thư viện Node.js (npm install)...${NC}"
npm install --no-audit --no-fund
echo -e "${GREEN}✓ Cài đặt thư viện hoàn tất.${NC}"

# 7. Kiểm tra file cấu hình .env
echo -e "${YELLOW}[7/7] Kiểm tra cấu hình .env...${NC}"
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️ Đã tạo file .env mới từ .env.example.${NC}"
  else
    cat << 'EOF' > .env
DISCORD_TOKEN=YOUR_BOT_TOKEN
CLIENT_ID=1555920118859567265
OWNER_ID=1402913586853974156
NODE_ENV=production
EOF
    echo -e "${YELLOW}⚠️ Đã tạo file .env mặc định.${NC}"
  fi
  echo -e "${RED}${BOLD}👉 QUAN TRỌNG: Bạn cần điền DISCORD_TOKEN vào file .env bằng lệnh: nano .env${NC}"
else
  echo -e "${GREEN}✓ File .env đã tồn tại.${NC}"
fi

# Thiết lập PM2 startup
echo -e "${CYAN}→ Cấu hình PM2 tự khởi động cùng hệ thống khi VPS reboot...${NC}"
pm2 startup systemd -u $(whoami) --hp $HOME 2>/dev/null || pm2 startup 2>/dev/null || true

echo -e "\n${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 CÀI ĐẶT THÀNH CÔNG! BOT ĐÃ SẴN SÀNG HOẠT ĐỘNG 24/7 TRÊN VPS.${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "${CYAN}Các bước tiếp theo:${NC}"
echo -e "1. Điền token của bạn vào file ${BOLD}.env${NC}:"
echo -e "   ${YELLOW}nano .env${NC}  (Nhập DISCORD_TOKEN, sau đó nhấn Ctrl+O -> Enter để lưu, Ctrl+X để thoát)"
echo -e "2. Khởi động bot chạy nền 24/7:"
echo -e "   ${GREEN}npm run pm2:start${NC}   hoặc   ${GREEN}pm2 start ecosystem.config.cjs${NC}"
echo -e "3. Lưu lại tiến trình PM2 để tự bật khi VPS reboot:"
echo -e "   ${GREEN}pm2 save${NC}"
echo -e "4. Xem trạng thái và log hoạt động:"
echo -e "   ${CYAN}pm2 status${NC}           - Xem trạng thái"
echo -e "   ${CYAN}pm2 logs discord-bot${NC} - Xem nhật ký trực tiếp"
echo -e "======================================================================\n"
