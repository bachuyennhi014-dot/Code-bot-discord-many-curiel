import fs from 'fs';
import path from 'path';

function runBackup() {
  const dataDir = path.resolve(process.cwd(), 'data');
  const backupDir = path.resolve(process.cwd(), 'backup');
  let sourceFile = path.join(dataDir, 'database.json');
  const mirrorFile = path.resolve(process.cwd(), 'src/bot/database/persistent_data.json');

  if (!fs.existsSync(sourceFile)) {
    if (fs.existsSync(mirrorFile)) {
      sourceFile = mirrorFile;
    } else {
      console.error('❌ Không tìm thấy file dữ liệu data/database.json hoặc persistent_data.json để backup.');
      process.exit(1);
    }
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const backupFileName = `database-backup-manual-${timestamp}.json`;
  const backupFilePath = path.join(backupDir, backupFileName);

  fs.copyFileSync(sourceFile, backupFilePath);
  const stats = fs.statSync(backupFilePath);

  console.log(`✅ [BACKUP THÀNH CÔNG]`);
  console.log(`📁 Nguồn: ${path.basename(sourceFile)}`);
  console.log(`📁 File lưu: backup/${backupFileName}`);
  console.log(`💾 Kích thước: ${(stats.size / 1024).toFixed(2)} KB`);
  process.exit(0);
}

runBackup();
