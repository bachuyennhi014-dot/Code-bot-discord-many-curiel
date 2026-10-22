#!/usr/bin/env bash
# ==============================================================================
# SCRIPT CẬP NHẬT BOT TỰ ĐỘNG VÀ BẢO TOÀN DỮ LIỆU 100%
# Dự án: Khoảng không Tu Tiên (Many Curiel Discord Bot)
# ==============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "======================================================================"
echo "    🔄 BẮT ĐẦU CẬP NHẬT SOURCE CODE BOT TRÊN VPS"
echo "    🛡️ BẢO VỆ TUYỆT ĐỐI TOÀN BỘ DỮ LIỆU NGƯỜI CHƠI & CẤU HÌNH"
echo "======================================================================"
echo -e "${NC}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SAFE_BACKUP_DIR="backup/pre_update_${TIMESTAMP}"

# 1. BƯỚC 1: SAO LƯU DỮ LIỆU BỀN VỮNG TRƯỚC KHI CẬP NHẬT
echo -e "${YELLOW}[1/5] Sao lưu khẩn cấp toàn bộ dữ liệu trước cập nhật...${NC}"
mkdir -p "$SAFE_BACKUP_DIR"
mkdir -p data backup logs

if [ -f "data/database.json" ]; then
  cp "data/database.json" "$SAFE_BACKUP_DIR/database.json"
  echo -e "${GREEN}✓ Đã sao lưu an toàn: data/database.json -> $SAFE_BACKUP_DIR/${NC}"
fi

if [ -f "src/bot/database/persistent_data.json" ]; then
  cp "src/bot/database/persistent_data.json" "$SAFE_BACKUP_DIR/persistent_data.json"
  echo -e "${GREEN}✓ Đã sao lưu an toàn: persistent_data.json -> $SAFE_BACKUP_DIR/${NC}"
fi

if [ -f ".env" ]; then
  cp ".env" "$SAFE_BACKUP_DIR/.env"
  echo -e "${GREEN}✓ Đã sao lưu file cấu hình: .env -> $SAFE_BACKUP_DIR/${NC}"
fi

# 2. BƯỚC 2: KÉO CODE MỚI TỪ GIT HOẶC ÁP DỤNG CODE MỚI
echo -e "${YELLOW}[2/5] Kiểm tra và cập nhật mã nguồn...${NC}"
if [ -d ".git" ]; then
  echo -e "${CYAN}→ Phát hiện kho Git. Đang kéo code mới về (git pull)...${NC}"
  # Lưu trạng thái tạm các file không commit nếu có
  git stash save "Auto-stash before update ${TIMESTAMP}" 2>/dev/null || true
  git pull || {
    echo -e "${RED}⚠️ Git pull gặp xung đột. Đang khôi phục an toàn...${NC}"
    git stash pop 2>/dev/null || true
  }
else
  echo -e "${YELLOW}ℹ️ Không sử dụng git trực tiếp, bỏ qua bước git pull.${NC}"
fi

# 3. BƯỚC 3: PHỤC HỒI VÀ HỢP NHẤT DỮ LIỆU NGƯỜI CHƠI
echo -e "${YELLOW}[3/5] Khôi phục và bảo toàn dữ liệu người chơi...${NC}"
if [ -f "$SAFE_BACKUP_DIR/database.json" ]; then
  cp "$SAFE_BACKUP_DIR/database.json" "data/database.json"
  echo -e "${GREEN}✓ Dữ liệu người chơi tại data/database.json đã được bảo toàn 100%!${NC}"
fi

if [ -f "$SAFE_BACKUP_DIR/.env" ]; then
  cp "$SAFE_BACKUP_DIR/.env" ".env"
  echo -e "${GREEN}✓ File cấu hình .env nguyên vẹn, không cần nhập lại!${NC}"
fi

# 4. BƯỚC 4: CÀI ĐẶT CÁC PACKAGE MỚI NẾU CÓ
echo -e "${YELLOW}[4/5] Cập nhật dependencies (npm install)...${NC}"
npm install --no-audit --no-fund
echo -e "${GREEN}✓ Đã cập nhật xong các gói thư viện.${NC}"

# 5. BƯỚC 5: KHỞI ĐỘNG LẠI BOT BẰNG PM2
echo -e "${YELLOW}[5/5] Khởi động lại Bot bằng PM2...${NC}"
if pm2 list | grep -q "discord-bot"; then
  pm2 restart discord-bot
  echo -e "${GREEN}✓ Đã khởi động lại tiến trình discord-bot trong PM2!${NC}"
else
  pm2 start ecosystem.config.cjs
  echo -e "${GREEN}✓ Đã khởi động mới tiến trình discord-bot trong PM2!${NC}"
fi

pm2 save

echo -e "\n${GREEN}${BOLD}======================================================================${NC}"
echo -e "${GREEN}${BOLD}✅ CẬP NHẬT HOÀN TẤT VÀ THÀNH CÔNG!${NC}"
echo -e "${GREEN}${BOLD}======================================================================${NC}"
echo -e "🛡️ Bản sao lưu an toàn đặt tại: ${CYAN}${SAFE_BACKUP_DIR}${NC}"
echo -e "📊 Dưới đây là trạng thái tiến trình PM2:${NC}\n"
pm2 status
