# CẨM NANG TRIỂN KHAI DISCORD BOT TRÊN VPS 24/7 & BẢO TOÀN DỮ LIỆU VĨNH VIỄN

> **Dự án**: Khoảng Không Tu Tiên (Many Curiel Discord Bot)  
> **Cam kết**: Chạy độc lập 24/7 trên VPS, tự khởi động lại khi reboot, bảo toàn 100% dữ liệu người chơi, tu vi, cảnh giới, số dư, cấu hình ảnh và role.

---

## 📑 MỤC LỤC
1. [Tổng quan cơ chế bảo toàn dữ liệu](#1-tổng-quan-cơ-chế-bảo-toàn-dữ-liệu)
2. [Yêu cầu VPS tối thiểu](#2-yêu-cầu-vps-tối-thiểu)
3. [Các file cấu hình cốt lõi đã tích hợp](#3-các-file-cấu-hình-cốt-lõi-đã-tích-hợp)
4. [Hướng dẫn cài đặt lần đầu trên VPS (Tự động 1 lệnh)](#4-hướng-dẫn-cài-đặt-lần-đầu-trên-vps-tự-động-1-lệnh)
5. [Cấu hình Token và Guild ID (.env)](#5-cấu-hình-token-và-guild-id-env)
6. [Khởi chạy Bot 24/7 bằng PM2](#6-khởi-chạy-bot-247-bằng-pm2)
7. [Thiết lập Bot tự khởi động khi VPS reboot](#7-thiết-lập-bot-tự-khởi-động-khi-vps-reboot)
8. [Quy trình cập nhật Bot an toàn (Không mất dữ liệu)](#8-quy-trình-cập-nhật-bot-an-toàn-không-mất-dữ-liệu)
9. [Cơ chế Sao lưu & Phục hồi dữ liệu](#9-cơ-chế-sao-lưu--phục-hồi-dữ-liệu)
10. [Bảng lệnh quản trị Bot nhanh](#10-bảng-lệnh-quản-trị-bot-nhanh)
11. [Xử lý sự cố thường gặp (Troubleshooting)](#11-xử-lý-sự-cố-thường-gặp-troubleshooting)

---

## 1. TỔNG QUAN CƠ CHẾ BẢO TOÀN DỮ LIỆU

Bot sử dụng kiến trúc lưu trữ **Dual-Mirror Persistence with Deep Merge**:
- **Tầng chính**: File `data/database.json` lưu toàn bộ người chơi, tu vi, linh thạch, nhân vật, hảo cảm, cấu hình kênh/role, ảnh `/setanh`.
- **Tầng dự phòng mirror**: Tự động đồng bộ sang `src/bot/database/persistent_data.json` mỗi khi có thay đổi.
- **Tầng snapshot**: Lưu trữ các mốc định kỳ (mỗi 6 tiếng) và trước mỗi lần cập nhật tại `backup/`.
- **Cơ chế Deep Merge (Không ghi đè rỗng)**: Khi bot khởi động hoặc update source, hàm `mergeData()` sẽ tự động gộp dữ liệu cũ với dữ liệu mới theo từng ID người chơi, từng nhân vật, từng server. **Không bao giờ bị reset về 0**.

---

## 2. YÊU CẦU VPS TỐI THIỂU

| Thành phần | Yêu cầu tối thiểu | Khuyên dùng |
| :--- | :--- | :--- |
| **Hệ điều hành** | Ubuntu 20.04 / 22.04 / 24.04 LTS hoặc Debian 11/12 | Ubuntu 22.04 LTS |
| **CPU** | 1 vCPU | 1 - 2 vCPU |
| **RAM** | 1 GB (Có tạo 1-2GB Swap) | 2 GB |
| **Ổ cứng** | 10 GB SSD | 20 GB SSD |
| **Kết nối mạng** | Mở cổng outbound kết nối Discord Gateway (443) | Băng thông không giới hạn |

---

## 3. CÁC FILE CẤU HÌNH CỐT LÕI ĐÃ TÍCH HỢP

Trong source code bot hiện tại đã được cấu hình sẵn 100%:
- `setup-vps.sh`: Script tự động cài Node.js 20 LTS, Git, PM2, build-essential và dependencies.
- `update-bot.sh`: Script cập nhật bot không mất dữ liệu: tự sao lưu DB -> pull code -> migrate -> restart PM2 -> kiểm tra logs.
- `ecosystem.config.cjs`: File cấu hình PM2 chuẩn với `instances: 1`, `autorestart: true`, `max_memory_restart: 800M`, lưu log tại `logs/`.
- `.env.example`: Mẫu cấu hình môi trường chuẩn bảo mật.
- `src/bot/utils/backup.ts`: Script tạo bản sao lưu dữ liệu khẩn cấp.
- `src/bot/utils/restore.ts`: Script phục hồi dữ liệu từ bản sao lưu gần nhất.
- `src/bot/utils/db-stats.ts`: Script kiểm tra số lượng dữ liệu người chơi, nhân vật, role trong database.

---

## 4. HƯỚNG DẪN CÀI ĐẶT LẦN ĐẦU TRÊN VPS (TỰ ĐỘNG 1 LỆNH)

### Bước 4.1: Đăng nhập vào VPS qua SSH
Trên máy tính hoặc điện thoại (dùng Termius / PuTTY / Terminal):
```bash
ssh root@IP_CỦA_VPS
```
*(Thay `IP_CỦA_VPS` bằng địa chỉ IP thật của bạn)*

### Bước 4.2: Tải Source Code về VPS
```bash
# Tạo thư mục làm việc
mkdir -p /root/discord-bot && cd /root/discord-bot

# Clone repo của bạn về (hoặc copy file source code vào)
git clone <URL_REPO_CỦA_BẠN> .
```

### Bước 4.3: Chạy script cài đặt tự động
```bash
bash setup-vps.sh
```
*Script sẽ tự động cài Node.js 20, PM2, npm dependencies, tạo thư mục `data/`, `backup/`, `logs/` và tạo file `.env` nếu chưa có.*

---

## 5. CẤU HÌNH TOKEN VÀ GUILD ID (.env)

Mở file `.env` để điền Token bot của bạn:
```bash
nano .env
```
Nội dung file `.env`:
```env
# Token Bot Discord (Lấy từ Discord Developer Portal)
DISCORD_TOKEN=your_bot_token_here

# ID Server Discord chính (Tuỳ chọn)
DISCORD_GUILD_ID=your_guild_id_here

# ID Client/Application Bot
DISCORD_CLIENT_ID=your_client_id_here

# Môi trường chạy
NODE_ENV=production
```
> **Cách lưu file nano**: Nhấn phím `Ctrl + O` rồi `Enter` để lưu. Sau đó nhấn `Ctrl + X` để thoát.

---

## 6. KHỞI CHẠY BOT 24/7 BẰNG PM2

Sau khi đã điền `.env`, khởi chạy bot bằng lệnh:
```bash
npm run pm2:start
```
Hoặc:
```bash
pm2 start ecosystem.config.cjs
```

Kiểm tra trạng thái bot:
```bash
pm2 status
```
Xem log bot hoạt động trực tiếp:
```bash
pm2 logs discord-bot
```
*(Nếu thấy dòng `Bot đã đăng nhập thành công: <Tên Bot>` và `Cơ sở dữ liệu đã sẵn sàng: X người chơi` là hoàn tất!)*

---

## 7. THIẾT LẬP BOT TỰ KHỞI ĐỘNG KHI VPS REBOOT

Để đảm bảo dù nhà cung cấp VPS bảo trì, tắt nguồn hoặc reboot máy chủ, bot vẫn **tự bật lại ngay lập tức**:

```bash
# Bước 1: Lưu danh sách tiến trình PM2 hiện tại
pm2 save

# Bước 2: Tạo dịch vụ tự khởi động cùng hệ điều hành
pm2 startup
```
*Hệ thống sẽ in ra một dòng lệnh (thường bắt đầu bằng `sudo env PATH=...`). Bạn hãy copy dòng đó và dán vào terminal chạy là xong!*

---

## 8. QUY TRÌNH CẬP NHẬT BOT AN TOÀN (KHÔNG MẤT DỮ LIỆU)

Khi có bản cập nhật tính năng mới (thêm minigame, thêm nhân vật, thêm lệnh):

Chỉ cần chạy **1 lệnh duy nhất**:
```bash
bash update-bot.sh
```
Hoặc:
```bash
npm run update
```

**Quy trình tự động mà script thực hiện:**
1. ✅ **Bước 1**: Tự động sao lưu toàn bộ `data/database.json` vào `backup/database-backup-trước-update.json`.
2. ✅ **Bước 2**: Giữ nguyên file cấu hình `.env` không bị đè.
3. ✅ **Bước 3**: Kéo mã nguồn mới từ Git (`git pull origin main`) hoặc áp dụng code mới.
4. ✅ **Bước 4**: Cài đặt các thư viện mới (`npm install`).
5. ✅ **Bước 5**: Kiểm tra tính toàn vẹn cú pháp của code mới.
6. ✅ **Bước 6**: Khởi động lại Bot an toàn bằng PM2 (`pm2 reload discord-bot` hoặc `pm2 restart discord-bot`).
7. ✅ **Bước 7**: Kiểm tra log 10 dòng đầu để đảm bảo Bot kết nối Discord và Database thành công.

---

## 9. CƠ CHẾ SAO LƯU & PHỤC HỒI DỮ LIỆU

### Kiểm tra số liệu Database hiện tại:
```bash
npm run db:stats
```
Sẽ in ra:
- Tổng số Người chơi đã lưu
- Tổng số Server/Guild
- Tổng số Nhân vật cấu hình
- File database chính và bản mirror

### Tạo bản sao lưu thủ công ngay lập tức:
```bash
npm run backup
```

### Phục hồi dữ liệu từ bản sao lưu:
```bash
npm run restore
```
Script sẽ tự động tìm bản sao lưu hợp lệ mới nhất trong thư mục `backup/` và phục hồi về `data/database.json`.

---

## 10. BẢNG LỆNH QUẢN TRỊ BOT NHANH

| Mục đích | Lệnh thực hiện |
| :--- | :--- |
| **Xem trạng thái bot** | `pm2 status` |
| **Xem log trực tiếp** | `pm2 logs discord-bot` |
| **Xem 100 dòng log gần nhất** | `pm2 logs discord-bot --lines 100` |
| **Khởi động lại bot** | `pm2 restart discord-bot` |
| **Tạm dừng bot** | `pm2 stop discord-bot` |
| **Cập nhật bot an toàn** | `npm run update` hoặc `bash update-bot.sh` |
| **Sao lưu dữ liệu** | `npm run backup` |
| **Phục hồi dữ liệu** | `npm run restore` |
| **Xem thống kê dữ liệu** | `npm run db:stats` |

---

## 11. XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING)

### Sự cố 1: Bot không online sau khi chạy PM2
- **Nguyên nhân**: Chưa điền hoặc sai `DISCORD_TOKEN` trong `.env`.
- **Cách xử lý**: Chạy `nano .env` kiểm tra lại token, sau đó chạy `pm2 restart discord-bot`.
- Xem chi tiết lỗi bằng: `pm2 logs discord-bot --err`.

### Sự cố 2: Lỗi thiếu quyền ghi thư mục `data/`
- **Cách xử lý**: Chạy lệnh phân quyền:
  ```bash
  chmod -R 755 /root/discord-bot
  ```

### Sự cố 3: VPS bị hết RAM (Crash tiến trình)
- **Cách xử lý**: Tạo swap bộ nhớ ảo 2GB trên VPS:
  ```bash
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  ```

---
*Hệ thống được thiết kế kiên cố để bảo toàn tuyệt đối 100% dữ liệu tu tiên của người chơi!*
