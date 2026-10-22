# 🚀 HƯỚNG DẪN TRIỂN KHAI VÀ CHẠY DISCORD BOT 24/7 TRÊN VPS THẬT (TỪ A ĐẾN Z CHO NGƯỜI MỚI)

Tài liệu này hướng dẫn chi tiết **13 BƯỚC** đưa Discord Bot **Khoảng không nhỏ của Many** lên máy chủ VPS độc lập. Sau khi hoàn thành, bạn có thể **tắt máy tính, tắt điện thoại, đóng trình duyệt và tắt Google AI Studio**, Bot vẫn sẽ chạy liên tục 24/7 trên VPS mà không phụ thuộc vào bất kỳ thiết bị nào của bạn.

> ⚡ **CÁCH CÀI ĐẶT NHANH NHẤT (TỰ ĐỘNG 100%):**  
> Trong thư mục bot đã có sẵn script tự động làm mọi việc từ A-Z. Bạn chỉ cần vào thư mục bot và chạy:  
> ```bash
> bash setup-vps.sh
> ```
> Script sẽ tự động cập nhật hệ thống, cài Node.js 20, PM2, dependencies, tạo thư mục data/backup/logs và cấu hình khởi động cùng VPS.  
> Khi có code mới, bạn chỉ cần chạy `bash update-bot.sh` để cập nhật mà không bao giờ mất dữ liệu người chơi!

---

### BƯỚC 1: Có VPS (Máy chủ ảo chạy Linux)
- Bạn có thể thuê VPS từ bất kỳ nhà cung cấp nào (như CloudFly, Vietnix, TinoHost, AZDIGI, DigitalOcean, Hetzner, Vultr, Linode, Google Cloud, AWS...).
- **Cấu hình tối thiểu đề xuất:** 1 vCPU, 1GB RAM, Hệ điều hành **Ubuntu 20.04 / 22.04 LTS** hoặc **Debian 11 / 12**.
- Nhà cung cấp sẽ gửi cho bạn thông tin gồm:
  - **Địa chỉ IP của VPS** (ví dụ: `103.145.62.88`)
  - **Tên đăng nhập (Username):** Thường là `root` hoặc `ubuntu`
  - **Mật khẩu (Password):** Do bạn tạo hoặc nhà cung cấp gửi qua email.

---

### BƯỚC 2: Đăng nhập vào VPS
1. **Trên Windows:** 
   - Mở ứng dụng **Terminal**, **PowerShell** hoặc phần mềm **PuTTY** / **MobaXterm**.
   - Gõ lệnh:
     ```bash
     ssh root@<ĐỊA_CHỈ_IP_VPS>
     # Ví dụ: ssh root@103.145.62.88
     ```
   - Nhập `yes` nếu terminal hỏi xác nhận dấu vân tay máy chủ.
   - Nhập mật khẩu VPS (khi gõ mật khẩu Linux sẽ ẩn ký tự, bạn cứ gõ đúng rồi nhấn Enter).
2. **Trên macOS / Linux / iOS (Termius) / Android (Termius):**
   - Mở ứng dụng Terminal hoặc Termius và chạy lệnh SSH tương tự như trên.

---

### BƯỚC 3: Cài đặt Node.js & Git trên VPS
Sau khi vào được màn hình dòng lệnh VPS, hãy dán các lệnh sau để cập nhật hệ thống và cài đặt Node.js phiên bản mới nhất:

```bash
# Cập nhật danh sách gói
sudo apt update -y && sudo apt upgrade -y

# Cài đặt công cụ curl và git
sudo apt install -y curl git build-essential

# Cài đặt Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Kiểm tra phiên bản (Nếu hiện v20.x.x và npm 10.x.x là thành công):
node -v
npm -v
```

---

### BƯỚC 4: Đưa mã nguồn (Source Bot) lên VPS
Có 2 cách:
- **Cách A (Khuyên dùng - Dùng Git):**
  ```bash
  cd ~
  git clone <LINK_GIT_REPOSITORY_CUA_BAN> many-discord-bot
  cd many-discord-bot
  ```
- **Cách B (Dùng FileZilla / WinSCP / SFTP):**
  - Mở FileZilla hoặc WinSCP, chọn giao thức SFTP, nhập IP, username `root`, password và port `22`.
  - Tải toàn bộ thư mục source code của bot lên thư mục `/root/many-discord-bot` trên VPS.
  - Trên terminal VPS, di chuyển vào thư mục đó:
    ```bash
    cd /root/many-discord-bot
    ```

---

### BƯỚC 5: Tạo file `.env` chứa cấu hình
Tại thư mục bot trên VPS, tạo file cấu hình môi trường `.env`:

```bash
nano .env
```

---

### BƯỚC 6: Nhập DISCORD_TOKEN vào file `.env`
Dán nội dung sau vào file (thay thế token và ID nếu có thay đổi):

```env
DISCORD_TOKEN=YOUR_BOT_TOKEN_O_DAY
CLIENT_ID=1555920118859567265
OWNER_ID=1402913586853974156
NODE_ENV=production
```

> **Cách lưu file trong nano:** 
> - Nhấn tổ hợp phím `Ctrl + O` rồi nhấn `Enter` để lưu.
> - Nhấn `Ctrl + X` để thoát ra màn hình chính.

---

### BƯỚC 7: Cài đặt các gói thư viện (Package)
Chạy lệnh cài đặt tất cả các package cần thiết:

```bash
npm install
```

---

### BƯỚC 8: Chạy thử bot (Kiểm tra kết nối)
Chạy thử trực tiếp bot xem có đăng nhập thành công hay không:

```bash
npm start
```
- Khi thấy terminal in ra:
  ```text
  [BOT STARTING] Khởi động Many Curiel Discord Bot 24/7...
  [DATABASE CONNECTED] Cơ sở dữ liệu JSON/SQLite bền vững đã sẵn sàng.
  [DISCORD READY] Bot đã đăng nhập thành công vào Discord: Khoảng không nhỏ của Many#5437
  ```
- Bạn nhấn `Ctrl + C` để dừng tiến trình test. Bây giờ chúng ta sẽ chuyển sang chạy nền với PM2.

---

### BƯỚC 9: Cài đặt PM2 (Công cụ giữ Bot chạy vĩnh viễn)
Cài đặt PM2 toàn cục trên VPS:

```bash
sudo npm install -g pm2
```

---

### BƯỚC 10: Khởi chạy Bot bằng PM2 và cho tự bật cùng VPS
Chạy lần lượt 3 lệnh sau:

```bash
# 1. Khởi động bot trong nền thông qua file cấu hình ecosystem:
pm2 start ecosystem.config.cjs

# 2. Lưu lại danh sách tiến trình đang chạy của PM2:
pm2 save

# 3. Kích hoạt tính năng tự chạy khi VPS khởi động lại:
pm2 startup
```

> ⚠️ **LƯU Ý QUAN TRỌNG:** Khi bạn chạy `pm2 startup`, màn hình terminal sẽ hiển thị một dòng lệnh màu xanh (ví dụ: `sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root`). Hãy copy chính xác dòng lệnh đó, dán lại vào terminal và nhấn Enter!

---

### BƯỚC 11: Kiểm tra trạng thái Bot Online
- Kiểm tra danh sách tiến trình PM2:
  ```bash
  pm2 status
  ```
  *(Cột Status hiện màu xanh lá `online` là bot đang hoạt động hoàn hảo!)*

- Xem log hoạt động trực tiếp của bot:
  ```bash
  pm2 logs discord-bot
  ```
  *(Nhấn `Ctrl + C` để thoát màn hình xem log, bot vẫn sẽ tiếp tục chạy trong nền).*

- Vào Discord và gõ lệnh test: `Mstatus`, `Mtl`, `Mchar`, `Mshop`, `Mboss`...

---

### BƯỚC 12: Kiểm tra sau khi tắt thiết bị
- Bây giờ bạn có thể:
  1. Đóng hoàn toàn terminal SSH trên máy tính.
  2. Tắt máy tính hoặc tắt nguồn điện thoại.
  3. Đóng hoàn toàn Google AI Studio và trình duyệt web.
- Mở Discord trên điện thoại của bạn, gõ lệnh `Mstatus` hoặc `Mtl`. Bot vẫn sẽ phản hồi ngay lập tức vì bot đang chạy độc lập trên VPS 24/7!

---

### BƯỚC 13: Kiểm tra sau khi Reboot VPS (Mô phỏng sự cố mất điện / bảo trì)
Để kiểm tra tính năng tự hồi phục khi VPS khởi động lại:
1. Gõ lệnh khởi động lại VPS:
   ```bash
   sudo reboot
   ```
2. Đợi khoảng 1 - 2 phút cho VPS khởi động lại xong.
3. Vào Discord và gõ lệnh `Mstatus`. Bot sẽ tự động online và dữ liệu người chơi, tu vi, linh thạch, sư phụ vẫn còn nguyên vẹn 100%!

---

## 🛠️ CÁC LỆNH QUẢN LÝ BOT TRÊN VPS HÀNG NGÀY

| Mục Đích | Lệnh Thực Hiện |
|---|---|
| **Xem trạng thái bot** | `pm2 status` |
| **Xem log trực tiếp** | `pm2 logs discord-bot` |
| **Xem 100 dòng log gần nhất** | `pm2 logs discord-bot --lines 100` |
| **Khởi động lại bot** | `pm2 restart discord-bot` |
| **Dừng bot** | `pm2 stop discord-bot` |
| **Bật lại bot đã dừng** | `pm2 start discord-bot` |
| **Sao lưu dữ liệu ngay** | `npm run backup` |
| **Khôi phục dữ liệu** | `npm run restore` |

---

## 🔄 HƯỚNG DẪN CẬP NHẬT CODE KHI CÓ TÍNH NĂNG MỚI (KHÔNG MẤT DỮ LIỆU)

Khi có code mới từ Google AI Studio hoặc GitHub:

```bash
# 1. Di chuyển vào thư mục bot trên VPS
cd ~/many-discord-bot

# 2. Kéo code mới về (Nếu dùng Git):
git pull

# 3. Cài đặt thêm thư viện nếu có thay đổi package:
npm install

# 4. Khởi động lại Bot bằng PM2 (File database dữ liệu người chơi giữ nguyên 100%):
pm2 restart discord-bot
```
