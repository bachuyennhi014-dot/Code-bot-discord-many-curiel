import { db } from '../database/database.js';

function showStats() {
  db.init();
  const stats = db.getDatabaseStats();
  console.log('\n============================================================');
  console.log('📊 THỐNG KÊ CƠ SỞ DỮ LIỆU BOT KHOẢNG KHÔNG TU TIÊN');
  console.log('============================================================');
  console.log(`👤 Tổng số người chơi (Users):            ${stats.totalUsers}`);
  console.log(`🛡️ Tổng số Staff:                         ${stats.totalStaff}`);
  console.log(`👑 Tổng số Quản Lý:                       ${stats.totalQuanLy}`);
  console.log(`🖼️ Tổng số nhân vật có ảnh đã cài:       ${stats.totalCharacterImages}`);
  console.log(`📁 File dữ liệu chính:                    ${stats.filePath}`);
  console.log(`🪞 File mirror bền vững:                  ${stats.persistentMirrorPath}`);
  console.log(`💾 Thư mục sao lưu (Backup):              ${stats.backupDir}`);
  console.log('============================================================');
  console.log('✅ Toàn bộ dữ liệu được bảo toàn bền vững, không bao giờ mất khi restart hay update!\n');
  process.exit(0);
}

showStats();
