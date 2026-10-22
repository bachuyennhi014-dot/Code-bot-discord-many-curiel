import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';
import dotenv from 'dotenv';
import { db } from './database/database.js';
import { onReady } from './events/ready.js';
import { onMessageCreate } from './events/messageCreate.js';
import { onInteractionCreate } from './events/interactionCreate.js';
import { getOwnerId } from './permissions/permissions.js';

dotenv.config();

// Global crash prevention handlers
process.on('unhandledRejection', (reason: any) => {
  console.error('[UNHANDLED REJECTION] Timestamp:', new Date().toISOString(), 'Reason:', reason?.message || reason);
});

process.on('uncaughtException', (err: Error, origin: string) => {
  console.error('[UNCAUGHT EXCEPTION] Timestamp:', new Date().toISOString(), 'Error:', err.message, 'Origin:', origin);
  if (err.stack) console.error(err.stack);
});

let botStarted = false;
let discordClient: Client | null = null;
let botStartTime: number = Date.now();
let lastActiveTimestamp: number = Date.now();

export function touchBotActivity() {
  lastActiveTimestamp = Date.now();
}

export function getBotStats() {
  const isReady = discordClient?.isReady() || false;
  const now = Date.now();
  
  return {
    online: isReady,
    status: isReady ? 'ONLINE' : 'CONNECTING',
    ping: discordClient?.ws.ping ?? -1,
    uptimeSeconds: Math.floor((now - botStartTime) / 1000),
    startedAt: new Date(botStartTime).toISOString(),
    lastActiveAt: new Date(lastActiveTimestamp).toISOString(),
    alwaysOnline: true,
    autoShutdownDisabled: true,
    mode: '24/7 CHẠY NGẦM LIÊN TỤC (KHÔNG TỰ TẮT)',
    autoShutdownRemainingMs: null,
    autoShutdownHoursRemaining: 'Vô hạn (Không tự tắt)',
    serversCount: discordClient?.guilds.cache.size || 0,
    botUser: discordClient?.user ? {
      id: discordClient.user.id,
      tag: discordClient.user.tag,
      username: discordClient.user.username,
      avatar: discordClient.user.displayAvatarURL(),
    } : null
  };
}

export async function fetchDiscordUser(userId: string) {
  if (!discordClient) return null;
  try {
    const user = await discordClient.users.fetch(userId, { force: true }).catch(() => null);
    if (!user) return null;

    let nickname = null;
    for (const guild of discordClient.guilds.cache.values()) {
      const member = guild.members.cache.get(userId);
      if (member?.nickname) {
        nickname = member.nickname;
        break;
      }
    }

    return {
      id: user.id,
      username: user.username,
      globalName: user.globalName || user.username,
      displayName: user.displayName || user.globalName || user.username,
      nickname,
      tag: user.tag || `@${user.username}`,
      avatar: user.displayAvatarURL({ size: 512, forceStatic: false }),
      banner: user.bannerURL({ size: 1024, forceStatic: false }) || null,
      accentColor: user.hexAccentColor || null,
      bot: user.bot,
      createdAt: user.createdAt.toISOString()
    };
  } catch {
    return null;
  }
}

export async function startBot() {
  if (botStarted) return;
  botStarted = true;
  botStartTime = Date.now();
  lastActiveTimestamp = Date.now();
  console.log('\n============================================================');
  console.log('[BOT STARTING] Khởi động Many Curiel Discord Bot 24/7...');
  console.log('============================================================');

  // 1. Initialize Database
  const dbOk = db.init();
  if (dbOk) {
    console.log('[DATABASE CONNECTED] Cơ sở dữ liệu JSON/SQLite bền vững đã sẵn sàng.');
  } else {
    console.warn('[DATABASE WARNING] Cơ sở dữ liệu khởi chạy với fallback an toàn.');
  }

  // 2. Commands verification
  console.log('[COMMANDS LOADED] Đã nạp đầy đủ hệ thống lệnh:');
  console.log('  • Tiền tố H (Owner): Hgive, Hchecksv, Hcb, Haddemoij, Htuanhanhtg, Hadmin, Hhatdeiu');
  console.log('  • Tiền tố M (Thường): Mdiemdanh, Mcauhoi, Mtuvi, Mdottpha, Mbxh, Mtruanam, Mphatqua, Maddstaff, Maddmod, Mquanly, Mcam, Mbocam, Mstatus');
  console.log('  • Tiền tố / (Setup): /setupkenhchoi, /setuprolet1, /setupkenhan, /setuproletttl');

  // 3. Create Discord Client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User]
  });

  discordClient = client;

  // 4. Register Gateway Lifecycle & Auto-Reconnect Events
  client.on('shardDisconnect', (event, shardId) => {
    console.warn(`[DISCORD DISCONNECTED] Shard ${shardId} mất kết nối (Code: ${event.code}). Gateway đang tự động reconnect...`);
  });

  client.on('shardReconnecting', (shardId) => {
    console.log(`[DISCORD RECONNECT] Shard ${shardId} đang tái lập kết nối tới Discord Gateway...`);
  });

  client.on('shardResume', (shardId, replayedEvents) => {
    console.log(`[DISCORD RESUME] Shard ${shardId} đã kết nối lại thành công! (Replayed ${replayedEvents} events)`);
  });

  client.on('shardError', (error, shardId) => {
    console.error(`[DISCORD SHARD ERROR] Shard ${shardId}:`, error.message);
  });

  client.on('error', (error) => {
    console.error('[DISCORD CLIENT ERROR]', error.message);
  });

  // 5. Register Command & Ready Events
  client.once(Events.ClientReady, () => {
    onReady(client);
    console.log('[BOT 24/7 MODE] Đã kích hoạt chế độ CHẠY NGẦM VĨNH VIỄN 24/7 (Đã tắt mọi cơ chế tự động tắt bot).');
    
    // Heartbeat logger to ensure active process monitoring & prevent idling
    setInterval(() => {
      if (client.user) {
        console.log(`[GATEWAY 24/7 HEARTBEAT] ${new Date().toLocaleTimeString('vi-VN')} | Bot: ${client.user.tag} | Ping: ${client.ws.ping}ms | Servers: ${client.guilds.cache.size}`);
      }
    }, 30000);

    // Periodic auto-save database every 5 minutes (never stops bot, ensures progression is saved)
    setInterval(() => {
      try {
        db.save();
      } catch (e) {
        console.error('[AUTO-SAVE 24/7] Lỗi tự động lưu DB:', e);
      }
    }, 5 * 60 * 1000);
  });

  client.on(Events.MessageCreate, (message) => {
    touchBotActivity();
    return onMessageCreate(message, client);
  });
  client.on(Events.InteractionCreate, (interaction) => {
    touchBotActivity();
    return onInteractionCreate(interaction, client);
  });

  // 6. Graceful Shutdown Handlers for PM2 (Ensures no data loss on VPS reboot or pm2 restart)
  const handleGracefulShutdown = (signal: string) => {
    console.log(`\n[BOT SHUTDOWN] Nhận tín hiệu ${signal}. Đang sao lưu và ngắt kết nối an toàn...`);
    try {
      db.save();
      const backupPath = db.createBackup(`shutdown-${signal}`);
      if (backupPath) {
        console.log(`[BOT SHUTDOWN] Bản lưu an toàn: ${backupPath}`);
      }
      client.destroy();
      console.log('[BOT SHUTDOWN] Hoàn tất tắt bot an toàn. Dữ liệu đã lưu 100%.');
      process.exit(0);
    } catch (err) {
      console.error('[BOT SHUTDOWN ERROR]', err);
      process.exit(0);
    }
  };

  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

  // 7. Login with Token from Environment Variable
  const token = process.env.DISCORD_TOKEN;
  if (!token || token === 'YOUR_BOT_TOKEN' || token.trim() === '') {
    console.error('\n[CẢNH BÁO] Chưa cấu hình DISCORD_TOKEN trong biến môi trường hoặc file .env!');
    console.log('👉 Vui lòng cấu hình biến môi trường DISCORD_TOKEN=your_token_here');
    console.log('👉 Sau đó chạy lại: npm start hoặc pm2 start ecosystem.config.cjs');
    return;
  }

  async function connectWithRetry() {
    while (true) {
      try {
        console.log('[BOT CONNECTING] Đang kết nối tới Discord API Gateway 24/7...');
        await client.login(token);
        break;
      } catch (err: any) {
        console.error('[DISCORD LOGIN ERROR] Không thể đăng nhập Discord:', err.message);
        console.log('[DISCORD LOGIN RETRY] Sẽ thử lại sau 5 giây...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  await connectWithRetry();
}

// Auto start if executed directly
if (process.argv[1] && process.argv[1].includes('src/bot/index.ts')) {
  startBot();
}
