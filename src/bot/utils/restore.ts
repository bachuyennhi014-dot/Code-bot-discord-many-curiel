import fs from 'fs';
import path from 'path';

function runRestore() {
  const dataDir = path.resolve(process.cwd(), 'data');
  const backupDir = path.resolve(process.cwd(), 'backup');
  const dbFile = path.join(dataDir, 'database.json');

  if (!fs.existsSync(backupDir)) {
    console.error('❌ Thư mục backup/ không tồn tại.');
    process.exit(1);
  }

  const requestedFile = process.argv[2];
  let targetBackupPath: string;

  if (requestedFile) {
    targetBackupPath = path.isAbsolute(requestedFile) ? requestedFile : path.join(backupDir, requestedFile);
    if (!fs.existsSync(targetBackupPath)) {
      console.error(`❌ Không tìm thấy file backup chỉ định: ${requestedFile}`);
      process.exit(1);
    }
  } else {
    // Pick latest backup
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('database-backup-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      console.error('❌ Không có bản backup nào trong thư mục backup/.');
      process.exit(1);
    }

    targetBackupPath = files[0].path;
  }

  // Verify target is valid JSON
  try {
    const raw = fs.readFileSync(targetBackupPath, 'utf-8');
    JSON.parse(raw);
  } catch (err) {
    console.error('❌ File backup bị lỗi cấu trúc JSON, không thể khôi phục.');
    process.exit(1);
  }

  // Backup existing database before overwriting
  if (fs.existsSync(dbFile)) {
    const preRestoreBackup = path.join(backupDir, `database-pre-restore-${Date.now()}.json`);
    fs.copyFileSync(dbFile, preRestoreBackup);
  }

  // Atomic restore
  const tempPath = path.join(dataDir, `database.json.restore.${Date.now()}`);
  fs.copyFileSync(targetBackupPath, tempPath);
  fs.renameSync(tempPath, dbFile);

  console.log(`✅ [KHÔI PHỤC DATABASE THÀNH CÔNG]`);
  console.log(`📥 Khôi phục từ: ${path.basename(targetBackupPath)}`);
  console.log(`👉 Hãy chạy lệnh 'pm2 restart discord-bot' để bot nạp lại dữ liệu.`);
}

runRestore();
