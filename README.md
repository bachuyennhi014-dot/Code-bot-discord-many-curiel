# 🌌 DISCORD BOT MANY CURIEL (HỆ THỐNG TU TIÊN & QUẢN TRỊ 24/7 TRÊN VPS)

Mã nguồn **Discord Bot Many Curiel thật 100%**, xây dựng trên nền tảng **Node.js, TypeScript và Discord.js v14**. Hệ thống tu tiên tương tác thực tế với phân quyền 4 tầng nghiêm ngặt, Discord Timeout thật, quản lý quyền truy cập kênh ẩn (Channel Permission Overwrites), lưu trữ Database bền vững không mất dữ liệu, và cấu hình chạy nền 24/7 với PM2.

---

## 📑 QUY TẮC TIỀN TỐ COMMAND

1. **👑 LỆNH OWNER (Tiền tố `H` — Tuyệt đối không có `*`):**
   - `Hgive @user <số_lượng>`: Cộng Tinh Không Thạch thật không giới hạn.
   - `Hchecksv`: Kiểm tra toàn bộ Server Bot đang tham gia (công khai & riêng tư).
   - `Hcb @user <cảnh_giới> <giai_đoạn>`: Tăng/hạ cảnh giới, tự động cập nhật Role Discord & Kênh Ẩn.
   - `Haddemoij <emoji>`: Thêm emoji trang trí hệ thống.
   - `Htuanhanhtg <tên_sự_kiện> <số_giờ>`: Tua nhanh thời gian sự kiện trong Database.
   - `Hadmin`: Xem bảng lệnh Owner (chỉ Owner xem được).
   - `Hhatdeiu`: Lệnh tối mật dành riêng cho Owner ID `1402913586853974156`.

2. **🎮 LỆNH THƯỜNG - NGƯỜI CHƠI / STAFF / QUẢN LÝ (Tiền tố `M` — Tuyệt đối không có `*`):**
   - `Mstatus`: Kiểm tra trạng thái 24/7 của bot, Uptime, Ping Gateway, RAM, số lượng Tu Sĩ & Database.
   - `Mdiemdanh`: Điểm danh nhận Tinh Không Thạch, Tu Vi, Điểm Cống Hiến mỗi 24h.
   - `Mcauhoi`: Trả lời vấn đáp tu tiên (Phổ thông nhận TKT, Khó nhận Mảnh Ký Ức).
   - `Mtuvi [@user]`: Xem hồ sơ cảnh giới, tiến độ Tu Vi, TKT, MKU, Điểm Cống Hiến, quyền lợi.
   - `Mdottpha`: Đột phá cảnh giới & giai đoạn khi đủ Tu Vi, nhận quyền lợi Discord thật.
   - `Mbxh`: Bảng xếp hạng Điểm Cống Hiến chu kỳ 7 ngày (Top 1 nhận Role).
   - `Mtruanam @user`: Thần thông trấn áp **(Độ Kiếp)** thực hiện Discord Timeout thật 1 phút (tối đa 3 lần/ngày).
   - `Mphatqua @user <số_lượng>`: Phát quà TKT (Staff tối đa 3 lần/ngày, Quản lý/Owner không giới hạn).
   - `Maddstaff @user` / `Maddmod @user`: Thêm Staff vào Database.
   - `Mquanly`: Bảng lệnh Quản lý.
   - `Mcam @user <thời_gian>`: Cấm người chơi dùng Bot (`30S`, `10P`, `2H`), lưu DB không mất khi restart.
   - `Mbocam @user`: Bỏ cấm người chơi dùng Bot.

3. **⚙️ LỆNH SETUP (Slash Command `/`):**
   - `/setupkenhchoi [kênh]`: Thiết lập kênh chơi bot chính (vi phạm: 1 cảnh báo, 2 cấm 10p, 3 cấm 1 ngày).
   - `/setuprolet1 [role]`: Thiết lập Role Top 1 BXH (1 slot, tự động trao sau 7 ngày).
   - `/setupkenhan [kênh]`: Thiết lập Kênh Ẩn cho Kim Đan trở lên (tự động cấp/gỡ permission).
   - `/setuproletttl [role]`: Thiết lập Role Thái Thượng Trưởng Lão cho người đạt Độ Kiếp.

---

## 🎋 HỆ THỐNG 10 CẢNH GIỚI TU TIÊN

Thứ tự cảnh giới tuần tự:
```
Phàm Nhân ➔ Luyện Khí ➔ Trúc Cơ ➔ Kim Đan ➔ Nguyên Anh ➔ Hóa Thần ➔ Luyện Hư ➔ Hợp Thể ➔ Đại Thừa ➔ Độ Kiếp
```
Mỗi cảnh giới gồm 4 giai đoạn: `Sơ Kỳ ➔ Trung Kỳ ➔ Hậu Kỳ ➔ Viên Mãn`.

### 🌟 Quyền Lợi Cảnh Giới:
- **Kim Đan**: Tự động mở quyền truy cập Kênh Ẩn (`/setupkenhan`).
- **Hóa Thần**: Mở quyền đổi màu sắc Role cá nhân.
- **Độ Kiếp**: Tự động nhận Role Thái Thượng Trưởng Lão (`/setuproletttl`) & mở khóa thần thông `Mtruanam` (Discord Timeout thật).

---

## 🛡️ HỆ THỐNG BẢO TOÀN DỮ LIỆU & CHỐNG CORRUPT

1. **Ghi Dữ Liệu Nguyên Tử (Atomic Writes):**
   - Mọi thay đổi dữ liệu được ghi vào file tạm `.tmp` trước khi đổi tên nguyên tử thành `data/database.json`.
   - Ngay cả khi VPS đột ngột mất điện hay crash giữa chừng, file database chính **không bao giờ bị hỏng hoặc rỗng**.

2. **Hệ Thống Tự Động Sao Lưu (Auto-Backup):**
   - Tự động tạo bản sao lưu khi khởi động và định kỳ mỗi **6 giờ** một lần vào thư mục `backup/`.
   - Tự động dọn dẹp giữ lại 15 bản sao lưu mới nhất để không chiếm dung lượng ổ cứng.
   - Khi phát hiện file database bị lỗi do tác động bên ngoài, bot sẽ **tự động phục hồi từ bản sao lưu gần nhất**.

3. **Lệnh Backup / Restore Thủ Công:**
   ```bash
   # Tạo bản sao lưu ngay lập tức:
   npm run backup

   # Khôi phục từ bản sao lưu mới nhất:
   npm run restore

   # Khôi phục từ một file cụ thể:
   npm run restore database-backup-periodic-2026-10-05T06-00-00-000Z.json
   ```

---

## 🚀 HƯỚNG DẪN CẤU HÌNH & CHẠY 24/7 TRÊN VPS VỚI PM2

### Bước 1: Cài đặt Node.js & PM2 trên VPS (Nếu chưa có)
```bash
# Ubuntu / Debian
sudo apt update
sudo apt install -y curl git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

### Bước 2: Tải Source Code & Cài Đặt Dependencies
```bash
# Vào thư mục dự án bot:
cd /duong-dan-toi-bot
npm install
```

### Bước 3: Cấu hình file `.env`
File `.env` nằm tại thư mục gốc:
```env
DISCORD_TOKEN=YOUR_BOT_TOKEN
CLIENT_ID=1555920118859567265
OWNER_ID=1402913586853974156
```

### Bước 4: Đăng Ký Slash Command Setup
```bash
npm run deploy
```

### Bước 5: Khởi Chạy 24/7 Bằng PM2 & Thiết Lập Tự Bật Khi VPS Reboot
Chạy lần lượt 3 lệnh sau:

```bash
# 1. Khởi chạy bot qua file ecosystem (ĐÃ CẤU HÌNH CHỐNG RESTART LOOP):
pm2 start ecosystem.config.cjs

# 2. Lưu cấu hình process hiện tại vào danh sách PM2:
pm2 save

# 3. Kích hoạt tự khởi động cùng hệ điều hành khi VPS reboot:
pm2 startup
```

> **Lưu ý quan trọng ở Bước 3:** Khi bạn gõ `pm2 startup`, PM2 sẽ in ra màn hình terminal một dòng lệnh `sudo` tương thích với VPS của bạn (ví dụ: `sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu`). Hãy copy dòng lệnh đó, dán lại vào terminal và nhấn Enter. Kể từ lúc này, mỗi khi VPS khởi động lại, Bot sẽ tự động chạy lên 100%!

---

## 📋 BẢNG TỔNG HỢP CÁC LỆNH QUẢN TRỊ TRÊN VPS

| Thao Tác | Lệnh Terminal |
|---|---|
| **Xem trạng thái bot** | `pm2 status` hoặc `pm2 info discord-bot` |
| **Xem log trực tiếp thời gian thực** | `pm2 logs discord-bot` |
| **Xem 100 dòng log gần nhất** | `pm2 logs discord-bot --lines 100` |
| **Khởi động lại bot** | `pm2 restart discord-bot` |
| **Dừng bot tạm thời** | `pm2 stop discord-bot` |
| **Bật lại bot đã dừng** | `pm2 start discord-bot` |
| **Sao lưu database ngay** | `npm run backup` |
| **Khôi phục database** | `npm run restore` |

---

## 🔄 CẬP NHẬT SOURCE CODE KHÔNG MẤT DỮ LIỆU
Khi bạn thêm tính năng mới hoặc kéo code từ Git về VPS:

```bash
# 1. Kéo code mới về:
git pull

# 2. Cài đặt thư viện mới nếu có thay đổi trong package.json:
npm install

# 3. Khởi động lại process (file data/database.json giữ nguyên 100%):
pm2 restart discord-bot
```
