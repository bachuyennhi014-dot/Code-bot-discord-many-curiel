import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // 1. Tự động khởi động Discord Bot 24/7 trong cùng tiến trình máy chủ
  let botModule: any = null;
  try {
    botModule = await import('./src/bot/index.js');
    await botModule.startBot();
    console.log('[SYSTEM 24/7] Tiến trình Discord Bot đã khởi chạy và kết nối Gateway thành công.');
  } catch (botError: any) {
    console.error('[SYSTEM 24/7 ERROR] Lỗi khởi động Discord Bot:', botError?.message || botError);
  }

  // Health check endpoint for UptimeRobot / Cron-job / Keep-alive monitors
  app.get(['/health', '/api/health'], (_req, res) => {
    if (botModule?.touchBotActivity) {
      botModule.touchBotActivity();
    }
    res.json({
      status: 'ok',
      online: true,
      timestamp: new Date().toISOString(),
      message: 'Many Curiel Discord Bot 24/7 is alive.'
    });
  });

  // API 1: Bot Real-time Status & Keep-Alive
  app.get('/api/bot/status', async (_req, res) => {
    try {
      if (botModule?.touchBotActivity) {
        botModule.touchBotActivity(); // Tự động gia hạn khi có người dùng truy cập Web
      }
      const { db } = await import('./src/bot/database/database.js');
      const stats = botModule?.getBotStats ? botModule.getBotStats() : {
        online: false,
        status: 'CONNECTING',
        ping: -1,
        uptimeSeconds: 0,
        serversCount: 0,
        alwaysOnline: true,
        autoShutdownDisabled: true,
        mode: '24/7 CHẠY NGẦM LIÊN TỤC (KHÔNG TỰ TẮT)',
        autoShutdownRemainingMs: null,
        autoShutdownHoursRemaining: 'Vô hạn (Không tự tắt)'
      };

      const totalUsers = db.getAllUsers().length;

      res.json({
        success: true,
        ...stats,
        totalCultivators: totalUsers,
        serverTime: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 2: Manual Status Refresh (24/7 Continuous Mode Active)
  app.post('/api/bot/keepalive', (_req, res) => {
    try {
      if (botModule?.touchBotActivity) {
        botModule.touchBotActivity();
      }
      const stats = botModule?.getBotStats ? botModule.getBotStats() : null;
      res.json({
        success: true,
        message: 'Bot đang chạy ngầm liên tục 24/7. Mọi chế độ tự động tắt đã bị vô hiệu hóa hoàn toàn!',
        stats
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API 3: Thông tin tài khoản Owner, Quản Lý, Staff với thông tin Discord thật (Avatar, Name, Bio)
  app.get('/api/bot/accounts', async (_req, res) => {
    try {
      const { db } = await import('./src/bot/database/database.js');
      const { ABSOLUTE_OWNER_ID, DEFAULT_QUAN_LY_ID } = await import('./src/bot/permissions/permissions.js');

      // 1. Owner info
      let ownerDiscord = null;
      if (botModule?.fetchDiscordUser) {
        ownerDiscord = await botModule.fetchDiscordUser(ABSOLUTE_OWNER_ID);
      }

      const ownerAccount = {
        role: 'OWNER',
        roleTitle: '👑 CHỦ SỞ HỮU TỐI THƯỢNG (OWNER)',
        userId: ABSOLUTE_OWNER_ID,
        username: ownerDiscord?.displayName || ownerDiscord?.username || 'Hạt Dẻ iu',
        userTag: ownerDiscord?.tag || '@hatdeiu',
        avatarUrl: ownerDiscord?.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
        bannerUrl: ownerDiscord?.banner || null,
        accentColor: ownerDiscord?.accentColor || '#BEE6FF',
        status: 'ACTIVE_PERMANENT',
        description: 'Chủ sở hữu độc quyền của Many Curiel Bot. Sở hữu toàn quyền điều hành cao nhất.',
        bio: '👑 Chủ nhân tối thượng của thế giới tu tiên Many Curiel. Nắm giữ quyền sinh sát, đại đạo quy nguyên và lệnh tối mật Hhatdeiu.',
        permissions: [
          'Toàn quyền quản trị hệ thống',
          'Lệnh tối mật Hhatdeiu',
          'Cấp/ban Linh Thạch & Mảnh vô hạn (Hgive)',
          'Tùy chỉnh cảnh giới & Role Discord (Hcb)',
          'Bổ nhiệm / Bãi nhiệm Quản Lý (Maddstaff, Mbogi)',
          'Tua nhanh thời gian sự kiện (Htuanhanhtg)',
          'Kiểm tra toàn bộ Server bot tham gia (Hchecksv)',
          'Thêm emoji trang trí hệ thống (Haddemoij)'
        ],
        addedAt: '2024-01-01T00:00:00.000Z',
        addedBy: 'Hệ Thống (System Root)',
        createdAt: ownerDiscord?.createdAt || '2024-01-01'
      };

      // 2. Default Manager + DB Managers
      let defaultManagerDiscord = null;
      if (botModule?.fetchDiscordUser) {
        defaultManagerDiscord = await botModule.fetchDiscordUser(DEFAULT_QUAN_LY_ID);
      }

      const defaultManager = {
        role: 'QUAN_LY',
        roleTitle: '🛡️ QUẢN LÝ HỆ THỐNG (MẶC ĐỊNH)',
        userId: DEFAULT_QUAN_LY_ID,
        username: defaultManagerDiscord?.displayName || defaultManagerDiscord?.username || 'Quản Lý Mặc Định',
        userTag: defaultManagerDiscord?.tag || '@quanly_default',
        avatarUrl: defaultManagerDiscord?.avatar || 'https://cdn.discordapp.com/embed/avatars/1.png',
        bannerUrl: defaultManagerDiscord?.banner || null,
        accentColor: defaultManagerDiscord?.accentColor || '#A855F7',
        status: 'ACTIVE_DEFAULT',
        description: 'Quản lý mặc định được ủy quyền trực tiếp từ Owner.',
        bio: '🛡️ Quản lý hệ thống Many Curiel Bot. Hỗ trợ điều phối, kiểm soát quyền hạn Staff, cấm vi phạm và điều hành máy chủ.',
        permissions: [
          'Xem danh sách lệnh Quản lý (Hql / Mql)',
          'Bổ nhiệm / Quản lý Staff (Maddstaff, Maddmod)',
          'Cấp quà Linh Thạch không giới hạn (Mphatqua)',
          'Thả Boss Chung (Mthaboss)',
          'Cấm / Bỏ cấm người chơi (Mcam, Mbocam)',
          'Tùy chỉnh ảnh thẻ nhân vật (/setanhthe)'
        ],
        addedAt: '2024-01-01T00:00:00.000Z',
        addedBy: 'Owner (1402913586853974156)',
        createdAt: defaultManagerDiscord?.createdAt || '2024-01-01'
      };

      const customManagers = await Promise.all(db.getAllQuanLy().map(async (m: any) => {
        let disc = null;
        if (botModule?.fetchDiscordUser) {
          disc = await botModule.fetchDiscordUser(m.user_id);
        }
        return {
          role: 'QUAN_LY',
          roleTitle: '🛡️ QUẢN LÝ ĐƯỢC BỔ NHIỆM',
          userId: m.user_id,
          username: disc?.displayName || disc?.username || m.username || `Quản Lý <@${m.user_id}>`,
          userTag: disc?.tag || `@${m.user_id}`,
          avatarUrl: disc?.avatar || 'https://cdn.discordapp.com/embed/avatars/2.png',
          bannerUrl: disc?.banner || null,
          accentColor: disc?.accentColor || '#A855F7',
          status: 'ACTIVE',
          description: 'Quản lý được phân quyền bởi Owner.',
          bio: '🛡️ Ban Quản Trị phụ trách vận hành và duy trì trật tự thế giới tu tiên Many Curiel.',
          permissions: [
            'Xem danh sách lệnh Quản lý (Hql / Mql)',
            'Bổ nhiệm Staff (Maddstaff)',
            'Phát quà không giới hạn (Mphatqua)',
            'Thả Boss Chung (Mthaboss)',
            'Cấm / Bỏ cấm người chơi (Mcam, Mbocam)'
          ],
          addedAt: m.added_at,
          addedBy: m.added_by,
          createdAt: disc?.createdAt || null
        };
      }));

      // 3. Staff members
      const staffList = await Promise.all(db.getAllStaff().map(async (s: any) => {
        let disc = null;
        if (botModule?.fetchDiscordUser) {
          disc = await botModule.fetchDiscordUser(s.user_id);
        }
        return {
          role: 'STAFF',
          roleTitle: '⚔️ ĐIỀU HÀNH VIÊN (STAFF)',
          userId: s.user_id,
          username: disc?.displayName || disc?.username || s.username || `Staff <@${s.user_id}>`,
          userTag: disc?.tag || `@${s.user_id}`,
          avatarUrl: disc?.avatar || 'https://cdn.discordapp.com/embed/avatars/3.png',
          bannerUrl: disc?.banner || null,
          accentColor: disc?.accentColor || '#F59E0B',
          status: 'ACTIVE',
          description: 'Đội ngũ Staff hỗ trợ vận hành và giám sát máy chủ.',
          bio: '⚔️ Điều hành viên túc trực hỗ trợ đạo hữu, tổ chức phát quà và canh gác Boss Thế Giới.',
          permissions: [
            'Xem danh sách lệnh Staff (Hstaff / Mstaff)',
            'Phát quà TKT (Tối đa 3 lần/ngày)',
            'Cấm người chơi dùng bot (Mcam @user <thời gian>)',
            'Bỏ cấm người chơi (Mbocam @user)',
            'Thả Boss Chung (Mthaboss)',
            'Thêm Emoji bot (Maddemoji)'
          ],
          addedAt: s.added_at,
          addedBy: s.added_by,
          createdAt: disc?.createdAt || null
        };
      }));

      res.json({
        success: true,
        summary: {
          totalOwners: 1,
          totalManagers: 1 + customManagers.length,
          totalStaff: staffList.length
        },
        owner: ownerAccount,
        managers: [defaultManager, ...customManagers],
        staff: staffList
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. Cấu hình Vite SPA Middlewares cho Web View trên Port 3000
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HTTP SERVER] Dev Server và Discord Bot 24/7 đang chạy tại http://0.0.0.0:${PORT}`);
  });

  // Tự động gia hạn hoạt động bot nội bộ định kỳ 30 giây để ngăn timeout
  setInterval(() => {
    try {
      if (botModule?.touchBotActivity) {
        botModule.touchBotActivity();
      }
    } catch {
      // ignore
    }
  }, 30000);
}

startServer();
