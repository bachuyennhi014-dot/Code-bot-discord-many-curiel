import { 
  Message, 
  Client, 
  User,
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} from 'discord.js';
import { db } from '../../database/database.js';
import { createOwnerEmbed, createManyCurielEmbed, createErrorEmbed, EMOJIS } from '../../utils/embeds.js';
import { isOwner } from '../../permissions/permissions.js';
import { 
  REALM_ORDER, 
  STAGE_ORDER,
  parseAmount,
  normalizeCharacterName,
  CardTier
} from '../../types/cultivation.js';
import { isQuanLy, isStaff } from '../../permissions/permissions.js';
import { checkAndTrigger1000AffectionMilestone } from './suphu.js';

export async function handleOwnerCommand(message: Message, client: Client, commandName: string, args: string[]): Promise<void> {
  const userId = message.author.id;
  const guild = message.guild;
  if (!guild) return;

  const cmd = commandName.toLowerCase();

  // 1. Hhatdeiu — XEM LỆNH CAO CẤP (CHỈ OWNER BÍ MẬT - NGƯỜI KHÁC IM LẶNG HOÀN TOÀN)
  if (cmd === 'hatdeiu' || cmd === 'admin' || cmd === 'owner') {
    if (!isOwner(userId)) return;

    const embed = createOwnerEmbed(
      client,
      `${EMOJIS.CROWN} **DANH SÁCH TOÀN BỘ LỆNH CAO CẤP (TIỀN TỐ H & M):**\n\n` +
      `👑 **QUẢN LÝ TÀI NGUYÊN & CẤP VẬT PHẨM:**\n` +
      `${EMOJIS.BOW_PINK} \`Hgive @user <đơn vị> <số lượng>\`\n` +
      `  → Cấp Linh Thạch, Mảnh Ký Ức, Mảnh Nhân Vật (vô hạn, không trừ ví)\n` +
      `${EMOJIS.HEART_PINK_SPIN} \`Hhc @user <tên nhân vật> <số hảo cảm>\`\n` +
      `  → Điều chỉnh điểm Hảo Cảm với Sư phụ (+/- điểm, cho phép số âm)\n` +
      `${EMOJIS.HEART_PULSE} \`Hđg @user <độ ghét> <tên nv>\`\n` +
      `  → Điều chỉnh điểm Độ Ghét với Sư phụ (0 - 100 điểm, tương tự như Hhc)\n\n` +
      `⚔️ **QUẢN TRỊ TRẬN ĐÁNH & BOSS:**\n` +
      `${EMOJIS.BUTTERFLY_GREEN} \`Mtieudietboss\`\n` +
      `  → Tiêu diệt Boss Chung đang thả trên máy chủ tức thì (Chỉ Quản Lý)\n` +
      `${EMOJIS.STRAWBERRY} \`Mthaboss #kênh\`\n` +
      `  → Thả Boss Chung vào kênh chỉ định cho toàn server chiến đấu\n\n` +
      `👥 **QUẢN LÝ NHÂN SỰ & QUẢN LÝ:**\n` +
      `${EMOJIS.CROWN} \`Haddql @user\`\n` +
      `  → Bổ nhiệm thành viên vào danh sách Quản lý hệ thống\n` +
      `${EMOJIS.PBEAR} \`Hbogi @user\`\n` +
      `  → Xóa thành viên khỏi danh sách Quản lý hệ thống\n` +
      `${EMOJIS.CROWN} \`Maddstaff @user\` / \`Mbostaff @user\`\n` +
      `  → Quản lý danh sách Staff máy chủ\n\n` +
      `🛠️ **CẤU HÌNH HỆ THỐNG & ẢNH NHÂN VẬT:**\n` +
      `${EMOJIS.STAR_RAINBOW} \`/setupanh <tên> <cấp> <url>\`\n` +
      `  → Thiết lập ảnh thẻ nhân vật C, B, A, S, 1000\n` +
      `${EMOJIS.STAR_PINK} \`/setanh <tên> <url>\`\n` +
      `  → Thiết lập ảnh hồ sơ chính cho Sư phụ\n` +
      `${EMOJIS.STAR_MOON} \`Mtestanh <tên>\` / \`/testanh <tên>\`\n` +
      `  → Xem và kiểm tra toàn bộ ảnh đã thiết lập của Sư phụ\n` +
      `${EMOJIS.CINNA_HORSE} \`Hchecksv\`\n` +
      `  → Quét và duyệt danh sách toàn bộ máy chủ bot tham gia\n` +
      `${EMOJIS.RAINBOW_CUTE} \`Hcb @user <cảnh_giới> <giai_đoạn>\`\n` +
      `  → Tăng/hạ trực tiếp cảnh giới & tự động cập nhật role/kênh ẩn Discord\n` +
      `${EMOJIS.SPARKLE_FX} \`Haddemoij <emoji>\`\n` +
      `  → Thêm Custom Emoji mới vào hệ thống trang trí Embed của bot\n` +
      `${EMOJIS.BSTAR_DNS} \`Hdb\` / \`Hdatabase\`\n` +
      `  → Kiểm tra tình trạng lưu trữ Database đa tầng (bảo lưu 100% dữ liệu qua mọi lần update)\n` +
      `${EMOJIS.YXZ_STAR} \`Hbackup\`\n` +
      `  → Sao lưu thủ công tức thời và đồng bộ song song Database\n` +
      `${EMOJIS.CROWN} \`Hhatdeiu\`\n` +
      `  → Hiển thị bảng danh sách toàn bộ lệnh cao cấp`,
      `${EMOJIS.CROWN} BẢNG ĐIỀU KHIỂN CAO CẤP`
    );
    await message.reply({ embeds: [embed] });
    return;
  }

  // 2. Hql — XEM LỆNH QUẢN LÝ (CHỈ QUẢN LÝ VÀ OWNER)
  if (cmd === 'ql' || cmd === 'quanly') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createManyCurielEmbed(client, '⛔ Bạn không có quyền xem danh sách lệnh Quản lý.');
      await message.reply({ embeds: [embed] });
      return;
    }

    const embed = createManyCurielEmbed(
      client,
      `👑 **DANH SÁCH TOÀN BỘ LỆNH DÀNH CHO QUẢN LÝ (TIỀN TỐ M & /):**\n\n` +
      `💎 **CẤP VẬT PHẨM & TÀI SẢN (VÔ HẠN, KHÔNG TRỪ VÍ):**\n` +
      `${EMOJIS.BUTTERFLY_PINK} \`Mtangmanh <cấp> <tên char> @user <số lượng>\`\n` +
      `  → Tặng Mảnh Nhân Vật (C, B, A, S) trực tiếp cho người chơi\n` +
      `${EMOJIS.BOW_PINK} \`Mtang <đơn vị> @user <số lượng>\`\n` +
      `  → Cấp Tinh Không Thạch hoặc Mảnh Ký Ức trực tiếp cho người chơi\n\n` +
      `👥 **QUẢN LÝ NHÂN SỰ & STAFF:**\n` +
      `${EMOJIS.CROWN} \`Mcacql\`\n` +
      `  → Xem danh sách tất cả Quản lý đang có trong hệ thống\n` +
      `${EMOJIS.PUSHEEN_PINK} \`Maddstaff @user\`\n` +
      `  → Bổ nhiệm thành viên vào danh sách Staff\n` +
      `${EMOJIS.PAW} \`Mcacstaff\`\n` +
      `  → Xem danh sách toàn bộ Staff hiện tại\n` +
      `${EMOJIS.PBEAR} \`Mbostaff @user\`\n` +
      `  → Xóa quyền Staff của thành viên\n\n` +
      `⚔️ **SỰ KIỆN, PHÁT QUÀ & TRỪNG PHẠT:**\n` +
      `${EMOJIS.STRAWBERRY} \`Mphatqua <tổng TKT> <số người>\`\n` +
      `  → Tạo sự kiện phát quà Linh Thạch nút bấm cho toàn server (không giới hạn)\n` +
      `${EMOJIS.BUTTERFLY_GREEN} \`Mthaboss #kênh\`\n` +
      `  → Thả Boss Chung (Thần Lãng Thiên Sơn - 10.000 HP) vào kênh chỉ định\n` +
      `${EMOJIS.CAKE_CAT} \`Mbovp <tên sản phẩm>\`\n` +
      `  → Gỡ bỏ vĩnh viễn sản phẩm khỏi Cửa Hàng (Mshop)\n` +
      `${EMOJIS.DOUCEUR_PURPLE_26} \`Mcam @user <thời gian>\`\n` +
      `  → Cấm người chơi sử dụng Bot theo thời gian chỉ định (30S, 10P, 2H)\n` +
      `${EMOJIS.SPARKLE_FX} \`Mbocam @user\`\n` +
      `  → Gỡ bỏ lệnh cấm sử dụng Bot cho người chơi\n\n` +
      `⚙️ **LỆNH CÀI ĐẶT HỆ THỐNG (SLASH COMMANDS):**\n` +
      `${EMOJIS.STAR_BLUE} \`/setupkenhchoi\` → Cài đặt kênh chơi bot duy nhất cho server\n` +
      `${EMOJIS.STAR_PINK} \`/setuprolet1\` → Cài đặt role Luyện Khí Tầng 1\n` +
      `${EMOJIS.STAR_PURPLE} \`/setupkenhan\` → Cài đặt kênh ẩn cho tu sĩ cảnh giới cao\n` +
      `${EMOJIS.STAR_RAINBOW} \`/setuproletttl\` → Cài đặt role Tiên Tôn Trọng Lực (Độ Kiếp)\n` +
      `${EMOJIS.CROWN} \`/setuprolephuhao @role\` → Thiết lập Discord Role Top 1 BXH Phú Hào\n` +
      `${EMOJIS.STAR_MOON} \`/setanhthe <tên char> <cấp> <link>\` → Thiết lập ảnh thẻ nhân vật\n` +
      `${EMOJIS.RAINBOW_CUTE} \`Hql\` → Xem danh sách lệnh Quản lý`,
      `${EMOJIS.CROWN} BẢNG ĐIỀU KHIỂN QUẢN LÝ (Hql)`
    );
    await message.reply({ embeds: [embed] });
    return;
  }

  // 3. Hstaff — XEM LỆNH STAFF (CHỈ STAFF, QUẢN LÝ VÀ OWNER)
  if (cmd === 'staff') {
    if (!isOwner(userId) && !isQuanLy(userId) && !isStaff(userId)) {
      const embed = createManyCurielEmbed(client, '⛔ Bạn không có quyền xem danh sách lệnh Staff.');
      await message.reply({ embeds: [embed] });
      return;
    }

    const embed = createManyCurielEmbed(
      client,
      `🛡️ **DANH SÁCH TOÀN BỘ LỆNH DÀNH CHO STAFF (TIỀN TỐ M):**\n\n` +
      `👥 **XEM DANH SÁCH:**\n` +
      `${EMOJIS.PAW} \`Mcacstaff\`\n` +
      `  → Xem danh sách toàn bộ Staff hiện tại trong máy chủ\n\n` +
      `🎁 **SỰ KIỆN PHÁT QUÀ:**\n` +
      `${EMOJIS.STRAWBERRY} \`Mphatqua <tổng TKT> <số người>\`\n` +
      `  → Tạo sự kiện phát quà Tinh Không Thạch bấm nút may mắn\n` +
      `  *(Giới hạn: Tối đa 3 lần/ngày tính chung toàn bộ Staff. Ban Quản Lý không giới hạn)*\n\n` +
      `⚔️ **QUẢN TRỊ TRẬN ĐÁNH BOSS:**\n` +
      `${EMOJIS.BUTTERFLY_GREEN} \`Mthaboss #kênh\`\n` +
      `  → Thả Boss Chung vào kênh được chỉ định cho toàn server cùng khiêu chiến\n\n` +
      `⛔ **XỬ LÝ VI PHẠM:**\n` +
      `${EMOJIS.DOUCEUR_PURPLE_26} \`Mcam @user <thời gian>\`\n` +
      `  → Cấm người chơi sử dụng bot theo thời gian chỉ định (ví dụ: 30S, 10P, 2H)\n` +
      `${EMOJIS.SPARKLE_FX} \`Mbocam @user\`\n` +
      `  → Bỏ cấm sử dụng bot cho người chơi vi phạm\n\n` +
      `${EMOJIS.STAR_RAINBOW} \`Hstaff\` → Xem danh sách lệnh Staff`,
      `${EMOJIS.CROWN} BẢNG ĐIỀU KHIỂN STAFF (Hstaff)`
    );
    await message.reply({ embeds: [embed] });
    return;
  }

  // Các lệnh Owner khác: Chỉ Owner mới được thực thi
  if (!isOwner(userId)) {
    return;
  }

  try {
    // 1. Hgive @user <đơn vị> <số lượng>
    if (cmd === 'give') {
      const targetUser = message.mentions.users.first();
      // Remove mention from args to parse unit and amount
      const nonMentionArgs = args.filter(a => !a.startsWith('<@') && !a.endsWith('>'));

      if (!targetUser || nonMentionArgs.length < 1) {
        const embed = createOwnerEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Hgive @user <đơn vị> <số lượng>\`\n` +
          `• Ví dụ Tinh Không Thạch: \`Hgive @user lĩnh thạch 50M\`\n` +
          `• Ví dụ Mảnh Ký Ức: \`Hgive @user mảnh ký ức 50\`\n` +
          `• Ví dụ Mảnh Nhân Vật: \`Hgive @user S Chu Tinh Dật 5\``,
          `${EMOJIS.CROWN} CẤP VẬT PHẨM`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      // Check last arg as amount
      const rawAmountStr = nonMentionArgs[nonMentionArgs.length - 1];
      let amount = parseAmount(rawAmountStr);
      let unitArgs = nonMentionArgs.slice(0, -1);

      if (isNaN(amount) || amount <= 0) {
        // Maybe first arg was amount
        const firstAmount = parseAmount(nonMentionArgs[0]);
        if (!isNaN(firstAmount) && firstAmount > 0) {
          amount = firstAmount;
          unitArgs = nonMentionArgs.slice(1);
        }
      }

      if (isNaN(amount) || amount <= 0) {
        const embed = createOwnerEmbed(client, '⚠️ Số lượng không hợp lệ! Ví dụ: `50M`, `500K`, `100`', `${EMOJIS.CROWN} LỖI SỐ LƯỢNG`);
        await message.reply({ embeds: [embed] });
        return;
      }

      const unitText = unitArgs.join(' ').toLowerCase();

      // Check if item is Shards of Character
      let isCharShard = false;
      let matchedChar: string | null = null;
      let matchedTier: 'C' | 'B' | 'A' | 'S' = 'C';

      for (const t of ['s', 'a', 'b', 'c'] as const) {
        if (unitArgs.map(u => u.toLowerCase()).includes(t)) {
          matchedTier = t.toUpperCase() as any;
          break;
        }
      }

      // Check for character name in unitText
      matchedChar = normalizeCharacterName(unitText);
      if (unitText.includes('mảnh nhân vật') || matchedChar) {
        isCharShard = true;
        if (!matchedChar) matchedChar = 'Chu Tinh Dật'; // fallback
      }

      if (isCharShard && matchedChar) {
        db.addManhNhanVat(guild.id, targetUser.id, matchedChar, matchedTier, amount);
        db.logTransaction(userId, targetUser.id, 'GIVE_SHARD', amount, `Mảnh ${matchedTier} - ${matchedChar}`, 'Cấp trực tiếp');

        const embed = createOwnerEmbed(
          client,
          `${EMOJIS.CUTEPAWS}\n` +
          `**CẤP VẬT PHẨM THÀNH CÔNG**\n\n` +
          `**Người nhận:** <@${targetUser.id}>\n` +
          `**Vật phẩm:** Mảnh ${matchedTier} - ${matchedChar}\n` +
          `**Số lượng:** ${amount.toLocaleString()}\n\n` +
          `*Đã cập nhật dữ liệu thành công.*`,
          `${EMOJIS.CROWN} CẤP VẬT PHẨM THÀNH CÔNG`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      if (unitText.includes('ký ức') || unitText.includes('ky uc') || unitText.includes('mảnh ký ức')) {
        const u = db.getOrCreateUser(guild.id, targetUser.id);
        u.manh_ky_uc += amount;
        db.updateUser(guild.id, targetUser.id, { manh_ky_uc: u.manh_ky_uc });
        db.logTransaction(userId, targetUser.id, 'GIVE_MEM', amount, 'Mảnh Ký Ức', 'Cấp trực tiếp');

        const embed = createOwnerEmbed(
          client,
          `${EMOJIS.CUTEPAWS}\n` +
          `**CẤP VẬT PHẨM THÀNH CÔNG**\n\n` +
          `**Người nhận:** <@${targetUser.id}>\n` +
          `**Vật phẩm:** ${EMOJIS.MANH_KY_UC} Mảnh Ký Ức\n` +
          `**Số lượng:** ${amount.toLocaleString()}\n\n` +
          `*Đã cập nhật dữ liệu thành công.*`,
          `${EMOJIS.CROWN} CẤP VẬT PHẨM THÀNH CÔNG`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      // Default: Tinh Không Thạch / Lĩnh Thạch
      const u = db.getOrCreateUser(guild.id, targetUser.id);
      u.tinh_khong_thach += amount;
      db.updateUser(guild.id, targetUser.id, { tinh_khong_thach: u.tinh_khong_thach });
      db.logTransaction(userId, targetUser.id, 'GIVE_TKT', amount, 'Tinh Không Thạch', 'Cấp trực tiếp');

      const embed = createOwnerEmbed(
        client,
        `${EMOJIS.CUTEPAWS}\n` +
        `**CẤP VẬT PHẨM THÀNH CÔNG**\n\n` +
        `**Người nhận:** <@${targetUser.id}>\n` +
        `**Vật phẩm:** ${EMOJIS.LINH_THACH} Linh Thạch\n` +
        `**Số lượng:** ${amount.toLocaleString()}\n\n` +
        `*Đã cập nhật dữ liệu thành công.*`,
        `${EMOJIS.CROWN} CẤP VẬT PHẨM THÀNH CÔNG`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 2. Hhc @user <tên nhân vật> <số hảo cảm>
    if (cmd === 'hc') {
      const targetUser = message.mentions.users.first();
      const nonMention = args.filter(a => !a.startsWith('<@') && !a.endsWith('>'));

      if (!targetUser || nonMention.length < 2) {
        const embed = createOwnerEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Hhc @user <tên nhân vật> <số hảo cảm>\`\n` +
          `• Ví dụ cộng 20: \`Hhc @user Chu Tinh Dật 20\`\n` +
          `• Ví dụ trừ 20: \`Hhc @user Chu Tinh Dật -20\``,
          `${EMOJIS.CROWN} ĐIỀU CHỈNH HẢO CẢM`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const deltaStr = nonMention[nonMention.length - 1];
      const delta = parseInt(deltaStr, 10);
      const rawCharName = nonMention.slice(0, -1).join(' ');
      const charName = normalizeCharacterName(rawCharName);

      if (isNaN(delta) || !charName) {
        const embed = createOwnerEmbed(client, '⚠️ Tên nhân vật hoặc số điểm hảo cảm không hợp lệ!', `${EMOJIS.CROWN} LỖI THAM SỐ`);
        await message.reply({ embeds: [embed] });
        return;
      }

      const newHc = db.adjustHaoCam(guild.id, targetUser.id, charName, delta);
      await checkAndTrigger1000AffectionMilestone(client, message.channel, guild.id, targetUser.id, charName);

      const embed = createOwnerEmbed(
        client,
        `${EMOJIS.HEART_PULSE} **ĐIỀU CHỈNH HẢO CẢM THÀNH CÔNG**\n\n` +
        `• **Người chơi:** <@${targetUser.id}>\n` +
        `• **Nhân vật:** **${charName}**\n` +
        `• **Thay đổi:** \`${delta >= 0 ? '+' : ''}${delta}\` điểm\n` +
        `• **Hảo cảm hiện tại:** \`${newHc}\` điểm\n\n` +
        `*Dữ liệu đã được lưu trực tiếp vào Database bền vững.*`,
        `${EMOJIS.CROWN} HẢO CẢM ĐÃ CẬP NHẬT`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 2b. Hđg @user <độ ghét> <tên nv> (Lệnh fix độ ghét tương tự như fix hảo cảm)
    if (cmd === 'đg' || cmd === 'dg' || cmd === 'doghet' || cmd === 'fixdg' || cmd === 'hđg' || cmd === 'hdg') {
      const targetUser = message.mentions.users.first();
      const nonMention = args.filter(a => !a.startsWith('<@') && !a.endsWith('>'));

      if (!targetUser || nonMention.length < 2) {
        const embed = createOwnerEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Hđg @user <độ ghét> <tên nhân vật>\`\n` +
          `• Ví dụ tăng 20 độ ghét: \`Hđg @user 20 Chu Tinh Dật\` hoặc \`Hđg @user +20 Chu Tinh Dật\`\n` +
          `• Ví dụ giảm 20 độ ghét: \`Hđg @user -20 Chu Tinh Dật\`\n` +
          `• Ví dụ đảo ngược vị trí: \`Hđg @user Chu Tinh Dật -20\`\n` +
          `• Điểm độ ghét nằm trong khoảng từ \`0\` đến \`1000\`.`,
          `${EMOJIS.CROWN} ĐIỀU CHỈNH ĐỘ GHÉT`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      // Check which argument is the number
      let deltaOrScore: number = NaN;
      let charWords: string[] = [];

      const firstNum = parseInt(nonMention[0], 10);
      const lastNum = parseInt(nonMention[nonMention.length - 1], 10);

      if (!isNaN(firstNum) && /^[+-]?\d+$/.test(nonMention[0])) {
        deltaOrScore = firstNum;
        charWords = nonMention.slice(1);
      } else if (!isNaN(lastNum) && /^[+-]?\d+$/.test(nonMention[nonMention.length - 1])) {
        deltaOrScore = lastNum;
        charWords = nonMention.slice(0, -1);
      } else {
        const numIdx = nonMention.findIndex(a => /^[+-]?\d+$/.test(a));
        if (numIdx !== -1) {
          deltaOrScore = parseInt(nonMention[numIdx], 10);
          charWords = nonMention.filter((_, idx) => idx !== numIdx);
        }
      }

      const rawCharName = charWords.join(' ');
      const charName = normalizeCharacterName(rawCharName);

      if (isNaN(deltaOrScore) || !charName) {
        const embed = createOwnerEmbed(
          client,
          `⚠️ Tên nhân vật hoặc điểm độ ghét không hợp lệ!\n• Cú pháp: \`Hđg @user <độ ghét> <tên nhân vật>\``,
          `${EMOJIS.CROWN} LỖI THAM SỐ`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const oldDislike = db.getDislikeInfo(guild.id, targetUser.id, charName).score;
      const newDislike = db.adjustDislikeScore(guild.id, targetUser.id, charName, deltaOrScore);

      const embed = createOwnerEmbed(
        client,
        `💢 **ĐIỀU CHỈNH ĐỘ GHÉT THÀNH CÔNG**\n\n` +
        `• **Người chơi:** <@${targetUser.id}>\n` +
        `• **Nhân vật:** **${charName}**\n` +
        `• **Thay đổi:** \`${deltaOrScore >= 0 ? '+' : ''}${deltaOrScore}\` điểm\n` +
        `• **Độ ghét trước đó:** \`${oldDislike}\` / 1000\n` +
        `• **Độ ghét hiện tại:** \`${newDislike}\` / 1000\n\n` +
        `*Dữ liệu đã được lưu trực tiếp vào Database bền vững.*`,
        `${EMOJIS.CROWN} ĐỘ GHÉT ĐÃ CẬP NHẬT`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 2c. Haddql @user (Lệnh thêm quản lý)
    if (cmd === 'addql' || cmd === 'haddql') {
      const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
      if (!targetUser) {
        const embed = createOwnerEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Haddql @user\`\n• Ví dụ: \`Haddql @username\``,
          `${EMOJIS.CROWN} THÊM QUẢN LÝ`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      db.addQuanLy(targetUser.id, userId, targetUser.username);

      const embed = createOwnerEmbed(
        client,
        `👑 **BỔ NHIỆM QUẢN LÝ THÀNH CÔNG**\n\n` +
        `• **Người được bổ nhiệm:** <@${targetUser.id}> (\`${targetUser.username}\`)\n` +
        `• **Người thực hiện:** <@${userId}>\n` +
        `• **Quyền hạn:** Có toàn quyền sử dụng danh sách lệnh Quản lý (\`Hql\`).\n\n` +
        `*(Dữ liệu người chơi và tiến trình tu tiên được bảo lưu nguyên vẹn 100%)*`,
        `${EMOJIS.CROWN} THÊM QUẢN LÝ HỆ THỐNG`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 3. Hbogi @user
    if (cmd === 'bogi') {
      const targetUser = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
      if (!targetUser) {
        const embed = createOwnerEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`Hbogi @user\``, `${EMOJIS.CROWN} XÓA QUẢN LÝ`);
        await message.reply({ embeds: [embed] });
        return;
      }

      db.removeQuanLy(targetUser.id);

      const embed = createOwnerEmbed(
        client,
        `**ĐÃ XÓA QUYỀN QUẢN LÝ**\n\n` +
        `**Người dùng:** <@${targetUser.id}>\n` +
        `**Trạng thái:** Không còn là Quản lý.\n\n` +
        `*(Dữ liệu người chơi, tài sản và tiến trình tu luyện vẫn được giữ nguyên 100%)*`,
        `${EMOJIS.CROWN} XÓA QUYỀN QUẢN LÝ`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 4. Htestanh <tên nhân vật> <cấp ảnh>
    if (cmd === 'testanh') {
      if (args.length < 2) {
        const embed = createOwnerEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Htestanh <tên nhân vật> <cấp ảnh>\`\n` +
          `• Cấp ảnh hợp lệ: \`C\`, \`B\`, \`A\`, \`S\`, \`1000\`\n` +
          `• Ví dụ: \`Htestanh Chu Tinh Dật S\` hoặc \`Htestanh Chu Tinh Dật 1000\``,
          `${EMOJIS.CROWN} KIỂM TRA ẢNH NHÂN VẬT`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const rawTier = args[args.length - 1].toUpperCase();
      const validTiers: CardTier[] = ['C', 'B', 'A', 'S', '1000'];
      if (!validTiers.includes(rawTier as any)) {
        const embed = createOwnerEmbed(client, '⚠️ Cấp ảnh hợp lệ: `C`, `B`, `A`, `S`, `1000`', `${EMOJIS.CROWN} CẤP ẢNH KHÔNG HỢP LỆ`);
        await message.reply({ embeds: [embed] });
        return;
      }

      const rawChar = args.slice(0, -1).join(' ');
      const charName = normalizeCharacterName(rawChar);
      if (!charName) {
        const embed = createOwnerEmbed(client, '⚠️ Tên nhân vật không tồn tại trong hệ thống!', `${EMOJIS.CROWN} LỖI NHÂN VẬT`);
        await message.reply({ embeds: [embed] });
        return;
      }

      const imgs = db.getCharacterImages(charName);
      const url = imgs[rawTier as CardTier];

      if (!url) {
        const embed = createOwnerEmbed(
          client,
          `⚠️ Nhân vật **${charName}** chưa được thiết lập ảnh cấp **${rawTier}**!\n\n` +
          `👉 Sử dụng lệnh: \`/setanhthe ${charName} ${rawTier} <link ảnh>\` để cài đặt ảnh.`,
          `${EMOJIS.CROWN} CHƯA CÓ ẢNH THẺ`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const embed = createOwnerEmbed(
        client,
        `🖼️ **ẢNH THẺ NHÂN VẬT (KIỂM TRA)**\n\n` +
        `• **Nhân vật:** **${charName}**\n` +
        `• **Cấp ảnh:** Thẻ \`${rawTier}\``,
        `${EMOJIS.CROWN} KIỂM TRA ẢNH THẺ`
      );
      embed.setImage(url);
      await message.reply({ embeds: [embed] });
      return;
    }

    // 5. Hchecksv (Hiển thị ảnh nhỏ góc thumbnail và có 2 nút < và > để lướt xem)
    if (cmd === 'checksv') {
      const guilds = Array.from(client.guilds.cache.values());

      if (guilds.length === 0) {
        const embed = createOwnerEmbed(client, `${EMOJIS.PRAY} Hiện tại Bot chưa tham gia máy chủ nào.`, `${EMOJIS.CROWN} DANH SÁCH MÁY CHỦ`);
        await message.reply({ embeds: [embed] });
        return;
      }

      let currentIndex = 0;

      const generateGuildEmbed = async (index: number) => {
        const g = guilds[index];
        let ownerTag = 'Không rõ';
        try {
          const owner = await client.users.fetch(g.ownerId).catch(() => null);
          if (owner) ownerTag = owner.tag;
        } catch {
          // ignore
        }

        const joinedAt = g.joinedAt ? `<t:${Math.floor(g.joinedTimestamp / 1000)}:R>` : 'Không rõ';

        const embed = createOwnerEmbed(
          client,
          `${EMOJIS.SPARKLE_FX} **MÁY CHỦ:** **${g.name}**\n\n` +
          `${EMOJIS.BUTTERFLY_DX} **Guild ID:** \`${g.id}\`\n` +
          `${EMOJIS.STAR_BLUE} **Chủ Server:** **${ownerTag}** (\`${g.ownerId}\`)\n` +
          `${EMOJIS.PAW} **Số thành viên:** \`${g.memberCount}\` thành viên\n` +
          `${EMOJIS.HEART_BLUE} **Thời gian bot tham gia:** ${joinedAt}\n` +
          `${EMOJIS.STAR_PINK} **Trạng thái:** \`Online 🟢\`\n\n` +
          `📖 *Server [${index + 1} / ${guilds.length}]*`,
          `${EMOJIS.CROWN} KIỂM TRA MÁY CHỦ BOT (Hchecksv)`
        );

        if (g.iconURL()) {
          embed.setThumbnail(g.iconURL({ size: 256 }));
        }

        return embed;
      };

      const getNavRow = (index: number) => {
        return new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_prev_server')
            .setLabel('<')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === 0),
          new ButtonBuilder()
            .setCustomId('btn_next_server')
            .setLabel('>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(index === guilds.length - 1)
        );
      };

      const initialEmbed = await generateGuildEmbed(currentIndex);
      const replyMsg = await message.reply({
        embeds: [initialEmbed],
        components: [getNavRow(currentIndex)]
      });

      const collector = replyMsg.createMessageComponentCollector({
        filter: (interaction) => interaction.user.id === userId,
        componentType: ComponentType.Button,
        time: 120000
      });

      collector.on('collect', async (interaction) => {
        if (interaction.customId === 'btn_prev_server') {
          if (currentIndex > 0) currentIndex--;
        } else if (interaction.customId === 'btn_next_server') {
          if (currentIndex < guilds.length - 1) currentIndex++;
        }

        const newEmbed = await generateGuildEmbed(currentIndex);
        await interaction.update({
          embeds: [newEmbed],
          components: [getNavRow(currentIndex)]
        });
      });

      collector.on('end', async () => {
        const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_prev_server_disabled')
            .setLabel('<')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('btn_next_server_disabled')
            .setLabel('>')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
        await replyMsg.edit({ components: [disabledRow] }).catch(() => null);
      });

      return;
    }

    // 6. Hcb @user <cảnh_giới> <giai_đoạn>
    if (cmd === 'cb') {
      const targetUser = message.mentions.users.first();
      if (!targetUser || args.length < 3) {
        const embed = createOwnerEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Hcb @user <Cảnh Giới> <Giai Đoạn>\`\n` +
          `${EMOJIS.STAR_BLUE} Ví dụ: \`Hcb @TuSi Trúc Cơ Viên Mãn\` hoặc \`Hcb @TuSi Kim Đan Sơ Kỳ\`\n\n` +
          `${EMOJIS.BUTTERFLY_PINK} **Danh sách cảnh giới:** ` + REALM_ORDER.join(' -> ') + '\n' +
          `${EMOJIS.STAR_PINK} **Giai đoạn:** Sơ Kỳ, Trung Kỳ, Hậu Kỳ, Viên Mãn`,
          `${EMOJIS.CROWN} THAY ĐỔI CẢNH GIỚI`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const rawRealm = args.slice(1, args.length - 2 + 1).join(' ').trim();
      const rawStage = args.slice(-2).join(' ').trim();

      const targetRealm = REALM_ORDER.find(r => r.toLowerCase() === rawRealm.toLowerCase()) ||
                          REALM_ORDER.find(r => (args.slice(1).join(' ')).toLowerCase().includes(r.toLowerCase()));

      const targetStage = STAGE_ORDER.find((s: string) => s.toLowerCase() === rawStage.toLowerCase()) ||
                          STAGE_ORDER.find((s: string) => (args.slice(1).join(' ')).toLowerCase().includes(s.toLowerCase()));

      if (!targetRealm || !targetStage) {
        const embed = createOwnerEmbed(
          client,
          `${EMOJIS.PRAY} Cảnh giới hoặc Giai đoạn không hợp lệ!\n• Cảnh giới hợp lệ: \`${REALM_ORDER.join(', ')}\`\n• Giai đoạn: \`${STAGE_ORDER.join(', ')}\``,
          `${EMOJIS.CROWN} LỖI THAM SỐ CẢNH GIỚI`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const userProfile = db.setRealmAndStage(guild.id, targetUser.id, targetRealm, targetStage);

      // Auto update Discord Role & Hidden Channel Permissions if setup
      const guildConfig = db.getGuildConfig(guild.id);
      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);

      if (targetMember) {
        if (guildConfig.role_top1_id && targetRealm === 'Độ Kiếp') {
          await targetMember.roles.add(guildConfig.role_top1_id).catch(() => null);
        }
        if (guildConfig.role_tttl_id && targetRealm === 'Độ Kiếp') {
          await targetMember.roles.add(guildConfig.role_tttl_id).catch(() => null);
        }
      }

      const embed = createOwnerEmbed(
        client,
        `${EMOJIS.PBEAR} **Cập nhật thành công cảnh giới cho <@${targetUser.id}>:**\n` +
        `• **Cảnh giới mới:** \`${userProfile.realm}\`\n` +
        `• **Giai đoạn/Tầng:** \`${userProfile.stage}\``,
        `${EMOJIS.CROWN} CẢNH GIỚI ĐÃ ĐƯỢC THIẾT LẬP`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 7. Haddemoij <emoji>
    if (cmd === 'addemoij' || cmd === 'addemoji') {
      const emojiInput = args[0];
      if (!emojiInput) {
        const embed = createOwnerEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`Haddemoij <emoji>\``, `${EMOJIS.CROWN} THÊM EMOJI TRANG TRÍ`);
        await message.reply({ embeds: [embed] });
        return;
      }

      db.addCustomEmoji(emojiInput);
      const embed = createOwnerEmbed(
        client,
        `${EMOJIS.SPARKLE_FX} Đã lưu emoji **${emojiInput}** vào hệ thống trang trí Embed của bot thành công!`,
        `${EMOJIS.CROWN} THÊM EMOJI THÀNH CÔNG`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 8. Htuanhanhtg <tên_sự_kiện> <số_giờ>
    if (cmd === 'tuanhanhtg') {
      const eventName = args[0] || 'Kỳ_Ngộ';
      const hours = parseInt(args[1] || '4', 10);

      const event = db.getOrCreateEvent(eventName, 24);
      db.fastForwardEvent(eventName, hours);

      const embed = createOwnerEmbed(
        client,
        `${EMOJIS.STAR_MOON} Đã tua nhanh **${hours} giờ** cho sự kiện **[${eventName}]** thành công trong Database!\n` +
        `${EMOJIS.STAR_BLUE} Thời gian kết thúc mới: \`${new Date(event.end_time).toLocaleString('vi-VN')}\``,
        `${EMOJIS.CROWN} TUA NHANH THỜI GIAN SỰ KIỆN`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 9. Hdb / Hdatabase (Xem tình trạng bảo lưu dữ liệu đa tầng của Database)
    if (cmd === 'db' || cmd === 'database' || cmd === 'storage') {
      const stats = db.getDatabaseStats();
      const embed = createOwnerEmbed(
        client,
        `💾 **TÌNH TRẠNG LƯU TRỮ DATABASE BỀN VỮNG** 🛡️\n\n` +
        `• **Số người chơi đã lưu:** \`${stats.totalUsers}\` tu sĩ\n` +
        `• **Số nhân vật đã cài đặt ảnh:** \`${stats.totalCharacterImages}\` nhân vật\n` +
        `• **Số Quản lý / Staff:** \`${stats.totalQuanLy}\` Quản lý / \`${stats.totalStaff}\` Staff\n` +
        `• **Thời điểm đồng bộ mới nhất:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
        `🔒 **CƠ CHẾ BẢO VỆ ĐA TẦNG (KHÔNG MẤT DỮ LIỆU KHI UPDATE):**\n` +
        `1️⃣ **Primary Storage:** \`data/database.json\` (Ghi lưu nguyên tử atomic)\n` +
        `2️⃣ **Git Mirror Storage:** \`src/bot/database/persistent_data.json\` (Theo dõi bởi Git, bảo toàn qua mọi bản cập nhật)\n` +
        `3️⃣ **Backup Storage:** \`backup/database-backup-latest.json\` & Auto-backup định kỳ mỗi 6 giờ\n\n` +
        `✨ *Mọi tiến trình người chơi và ảnh thẻ/hồ sơ setup đều được bảo toàn 100%, không bao giờ bị reset!*`,
        `${EMOJIS.CROWN} THÔNG TIN DATABASE BỀN VỮNG`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 10. Hbackup (Sao lưu thủ công tức thời dữ liệu database)
    if (cmd === 'backup' || cmd === 'saoluu') {
      db.save();
      const backupPath = db.createBackup('manual');
      const stats = db.getDatabaseStats();
      const embed = createOwnerEmbed(
        client,
        `✅ **ĐÃ SAO LƯU DATABASE THÀNH CÔNG!** 🛡️\n\n` +
        `• **Tệp sao lưu mới:** \`${backupPath ? backupPath.split('/').pop() : 'database-backup-latest.json'}\`\n` +
        `• **Người chơi bảo lưu:** \`${stats.totalUsers}\` tu sĩ\n` +
        `• **Ảnh nhân vật bảo lưu:** \`${stats.totalCharacterImages}\` nhân vật\n` +
        `• **Đồng bộ song song:** Cả \`data/database.json\` và \`persistent_data.json\` đã được cập nhật nguyên vẹn!`,
        `${EMOJIS.CROWN} SAO LƯU DỮ LIỆU (Hbackup)`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // Unknown owner command -> stay silent
    return;

  } catch (error: any) {
    console.error(`[COMMAND ERROR]\nUser ID: ${userId}\nGuild ID: ${guild.id}\nCommand: H${commandName}\nError:`, error);
    const errorEmbed = createOwnerEmbed(client, '❌ Đã xảy ra lỗi khi xử lý lệnh.');
    await message.reply({ embeds: [errorEmbed] });
  }
}
