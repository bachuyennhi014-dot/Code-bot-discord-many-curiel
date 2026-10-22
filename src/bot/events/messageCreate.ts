import { Message, Client } from 'discord.js';
import { db } from '../database/database.js';
import { createManyCurielEmbed } from '../utils/embeds.js';
import { handleOwnerCommand } from '../commands/prefix/owner.js';
import { handleRegularCommand } from '../commands/prefix/regular.js';
import { isOwner, isQuanLy } from '../permissions/permissions.js';

// Danh sách toàn bộ các lệnh hợp lệ của Bot
const VALID_OWNER_COMMANDS = new Set([
  'hatdeiu', 'admin', 'owner',
  'ql', 'quanly', 'cacql',
  'staff',
  'give',
  'hc',
  'đg', 'dg', 'doghet', 'fixdg', 'hđg', 'hdg',
  'addql', 'haddql', 'bogi',
  'testanh',
  'checksv',
  'cb',
  'addemoij', 'addemoji',
  'tuanhanhtg',
  'db', 'database', 'storage',
  'backup', 'saoluu',
  'setupkenhchoi',
  'botongmon', 'xoatongmon', 'giaitantongmon',
  'mobicanh', 'adminbicanh',
  'killboss', 'tieudietboss', 'huyboss', 'tdboss'
]);

const VALID_REGULAR_COMMANDS = new Set([
  // Cơ bản & Tu Luyện
  'help', 'trogiup', 'lenh', 'menu',
  'status',
  'tuluyen', 'tl',
  'thangcap', 'tc', 'dottpha',
  'hatdeiu',
  'ql', 'quanly', 'cacql',
  'staff',
  'hs', 'tuvi',
  'tuido', 'tui', 'bag', 'ruong', 'ruongdo',
  'gan', 'trangbi', 'bogan', 'thaotrangbi', 'thaogan', 'equip', 'thao', 'unequip', 'bovp',

  // Hệ Thống Tông Môn & Bí Cảnh
  'lap', 'laptong', 'taotong', 'khaitong',
  'tongmon', 'tm',
  'tmcuatoi', 'mysect',
  'tmthamgia', 'myjoin',
  'rutquy', 'withdrawtreasury',
  'botongmon', 'xoatongmon', 'giaitantongmon',
  'hutvankhi', 'hvk',
  'bicanh', 'bc',
  'mobicanh', 'adminbicanh',

  // Chiến đấu & Đánh Boss
  'chiendau', 'cd',
  'khieuchien', 'kc',
  'dt', 'danhthuong',
  'skill', 'tuyetchieu',
  'checkskill', 'skilllist',
  'hoimau', 'hoihuyet',
  'boss', 'thaboss', 'tieudietboss', 'killboss', 'huyboss', 'tdboss',

  // Kinh tế & Mini game
  'shop', 'cuahang',
  'lixi',
  'give',
  'cauhoi', 'caudo', 'luandao', 'ld',
  'timmay', 'nhan', 'nhanthuong', 'dung', 'chotlai',
  'diemdanh',
  'bxh',
  'truanam',
  'doi', 'quydoi', 'doivp', 'doitien',

  // Quản lý & Staff
  'addstaff', 'addmod', 'bostaff',
  'cam', 'bocam',
  'phatqua', 'phattien',
  'tangmanh',
  'setupkenhchoi',

  // Thư viện & Thẻ Sư phụ
  'xemthuvien', 'allthuvien', 'thuvien', 'gallery',
  'suphu', 'baisu',
  'xemthe',
  'ghepchong', 'ghepthe',
  'tangqua',
  'kiss', 'bite', 'hug',
  'testanh', 'setanh', 'setanhthe', 'setavatar'
]);

// Bộ nhớ đệm ngăn chặn phản hồi trùng lặp (chỉ phản hồi đúng 1 lần cho mỗi tin nhắn)
const processedMessageIds = new Set<string>();

setInterval(() => {
  if (processedMessageIds.size > 2000) {
    processedMessageIds.clear();
  }
}, 60000);

export async function onMessageCreate(message: Message, client: Client): Promise<void> {
  // Bỏ qua tin nhắn từ Bot hoặc tin nhắn riêng tư
  if (message.author.bot || !message.guild) return;

  // Ngăn chặn phản hồi trùng lặp: Mỗi tin nhắn chỉ phản hồi đúng 1 lần duy nhất
  if (processedMessageIds.has(message.id)) return;
  processedMessageIds.add(message.id);

  const content = message.content.trim();
  if (content.length === 0) return;

  // Xác định tiền tố: "H" (Owner) hoặc "M" (Thường)
  let prefix: 'H' | 'M' | null = null;
  if (content.startsWith('H') || content.startsWith('h')) {
    prefix = 'H';
  } else if (content.startsWith('M') || content.startsWith('m')) {
    prefix = 'M';
  }

  if (!prefix) return;

  const userId = message.author.id;
  const guildId = message.guild.id;

  // Quy tắc: Tiền tố H chỉ khi Owner nhập bot mới trả lời, người khác nhập bot im lặng hoàn toàn
  if (prefix === 'H') {
    if (!isOwner(userId)) return;
  }

  const args = content.slice(1).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  // Quy tắc: Dù nhập đúng tiền tố nhưng nhập sai lệnh bot KHÔNG PHẢN HỒI (VD: Huu, HAhaah -> Im lặng)
  if (prefix === 'H') {
    if (!VALID_OWNER_COMMANDS.has(commandName) && !VALID_REGULAR_COMMANDS.has(commandName)) {
      return; // Nhập sai lệnh tiền tố H -> Im lặng hoàn toàn
    }
  } else {
    if (!VALID_REGULAR_COMMANDS.has(commandName)) {
      return; // Nhập sai lệnh tiền tố M -> Im lặng hoàn toàn
    }
  }

  // 1. Kiểm tra trạng thái bị cấm dùng bot
  const activeBan = db.getActiveBotBan(userId, guildId);
  if (activeBan) {
    const remainingMs = new Date(activeBan.end_time).getTime() - Date.now();
    const remainingMins = Math.ceil(remainingMs / (1000 * 60));
    const embed = createManyCurielEmbed(
      client,
      `⛔ <@${userId}>, bạn đang bị cấm sử dụng bot!\n\n` +
      `• **Lý do:** ${activeBan.reason}\n` +
      `• **Thời gian còn lại:** \`${remainingMins}\` phút`,
      'BỊ CẤM SỬ DỤNG BOT'
    );
    await message.reply({ embeds: [embed] });
    return;
  }

  // 2. Kiểm soát kênh chơi bot theo quy tắc /setupkenhchoi
  const guildConfig = db.getGuildConfig(guildId);
  const isThread = message.channel.isThread();
  const isBossChungChannel = db.getBossChung(guildId)?.channel_id === message.channel.id;
  const isManagerOrOwner = isOwner(userId) || isQuanLy(userId);

  // A. NẾU CHƯA THIẾT LẬP KÊNH CHƠI:
  if (!guildConfig.play_channel_id) {
    // Chỉ Quản Lý và Owner mới được dùng lệnh /setupkenhchoi hoặc lệnh quản trị
    if (commandName === 'setupkenhchoi' || isManagerOrOwner) {
      // Cho phép tiếp tục thực thi lệnh setup
    } else {
      // Người chơi thường sẽ không thể chơi được
      const embed = createManyCurielEmbed(
        client,
        `⚠️ Máy chủ chưa thiết lập kênh sử dụng bot!\n\n` +
        `• Vui lòng nhờ **Quản Lý** thiết lập kênh chơi bằng lệnh \`/setupkenhchoi #kênh\` để bắt đầu chơi.`,
        'CHƯA THIẾT LẬP KÊNH CHƠI'
      );
      await message.reply({ embeds: [embed] });
      return;
    }
  } else {
    const isSectRealmThread = isThread && !!db.getSectRealmSessionByThread(message.channel.id);
    const isPlayChannel = message.channel.id === guildConfig.play_channel_id ||
                          (isThread && message.channel.parentId === guildConfig.play_channel_id) ||
                          isSectRealmThread;

    if (!isPlayChannel && !isBossChungChannel && !isManagerOrOwner) {
      const violation = db.incrementViolation(guildId, userId);

      if (violation.count === 1) {
        const embed = createManyCurielEmbed(
          client,
          `⚠️ <@${userId}>, vui lòng chỉ sử dụng bot tại kênh <#${guildConfig.play_channel_id}>!\n*(Vi phạm lần 1/3 - Cảnh báo)*`,
          'VI PHẠM KÊNH CHƠI'
        );
        await message.reply({ embeds: [embed] });
        return;
      } else if (violation.count === 2) {
        const embed = createManyCurielEmbed(
          client,
          `⚠️ <@${userId}>, vui lòng chỉ sử dụng bot tại kênh <#${guildConfig.play_channel_id}>!\n*(Vi phạm lần 2/3 - Cảnh báo: Vi phạm lần 3 sẽ bị cấm dùng bot 60 phút)*`,
          'VI PHẠM KÊNH CHƠI'
        );
        await message.reply({ embeds: [embed] });
        return;
      } else {
        // Vi phạm 3 lần: Cấm sử dụng lệnh 60 phút
        db.banBotUser(userId, guildId, 60 * 60 * 1000, 'Dùng bot sai kênh 3 lần', client.user?.id || 'BOT');
        db.resetViolation(guildId, userId);
        const embed = createManyCurielEmbed(
          client,
          `⛔ <@${userId}> đã vi phạm sử dụng bot sai kênh 3 lần!\n**Hình phạt:** Cấm sử dụng lệnh trong **60 phút**.`,
          'HÌNH PHẠT VI PHẠM'
        );
        await message.reply({ embeds: [embed] });
        return;
      }
    }
  }

  // 3. Phân luồng thực thi lệnh
  if (prefix === 'H') {
    await handleOwnerCommand(message, client, commandName, args);
  } else {
    await handleRegularCommand(message, client, commandName, args);
  }
}
