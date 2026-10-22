import { 
  Message, 
  Client, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} from 'discord.js';
import { db } from '../../database/database.js';
import { createManyCurielEmbed, createPermissionDeniedEmbed, EMOJIS } from '../../utils/embeds.js';
import { isOwner, isQuanLy, isStaff } from '../../permissions/permissions.js';
import { parseAmount, normalizeCharacterName } from '../../types/cultivation.js';

export async function handleManagementCommands(message: Message, client: Client, cmd: string, args: string[]): Promise<boolean> {
  const userId = message.author.id;
  const guild = message.guild;
  if (!guild) return false;

  // 1. Mtangmanh <cấp độ> <tên nhân vật> @user <số lượng>
  if (cmd === 'tangmanh') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const targetUser = message.mentions.users.first();
    const nonMention = args.filter(a => !a.startsWith('<@') && !a.endsWith('>'));

    if (!targetUser || nonMention.length < 3) {
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PBEAR} **Cú pháp:** \`Mtangmanh <cấp> <tên nhân vật> @user <số lượng>\`\n` +
        `• Cấp: \`C\`, \`B\`, \`A\`, \`S\`\n` +
        `• Ví dụ: \`Mtangmanh S Chu Tinh Dật @user 5\``,
        'TẶNG MẢNH NHÂN VẬT'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const tier = nonMention[0].toUpperCase() as 'C' | 'B' | 'A' | 'S';
    if (!['C', 'B', 'A', 'S'].includes(tier)) {
      const embed = createManyCurielEmbed(client, '⚠️ Cấp mảnh hợp lệ là `C`, `B`, `A`, `S`!', 'LỖI CẤP MẢNH');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const rawAmount = nonMention[nonMention.length - 1];
    const amount = parseAmount(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      const embed = createManyCurielEmbed(client, '⚠️ Số lượng mảnh không hợp lệ!', 'LỖI SỐ LƯỢNG');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const rawChar = nonMention.slice(1, -1).join(' ');
    const charName = normalizeCharacterName(rawChar);
    if (!charName) {
      const embed = createManyCurielEmbed(client, '⚠️ Không tìm thấy tên nhân vật trong hệ thống!', 'LỖI NHÂN VẬT');
      await message.reply({ embeds: [embed] });
      return true;
    }

    db.addManhNhanVat(guild.id, targetUser.id, charName, tier, amount);

    const embed = createManyCurielEmbed(
      client,
      `${EMOJIS.CUTEPAWS}\n` +
      `**TẶNG MẢNH NHÂN VẬT THÀNH CÔNG**\n\n` +
      `• **Người nhận:** <@${targetUser.id}>\n` +
      `• **Mảnh nhân vật:** Mảnh **${tier}** — **${charName}**\n` +
      `• **Số lượng cấp:** \`+${amount.toLocaleString()}\` Mảnh\n\n` +
      `*Dữ liệu đã được lưu trực tiếp vào Database bền vững.*`,
      `${EMOJIS.CROWN} TẶNG MẢNH NHÂN VẬT`
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 2. Mtang <đơn vị> @user <số lượng> (Quản lý và Owner)
  if (cmd === 'tang') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const targetUser = message.mentions.users.first();
    const nonMention = args.filter(a => !a.startsWith('<@') && !a.endsWith('>'));

    if (!targetUser || nonMention.length < 2) {
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PBEAR} **Cú pháp:** \`Mtang <đơn vị> @user <số lượng>\`\n` +
        `• Ví dụ Tinh Không Thạch: \`Mtang linh thạch @user 50M\`\n` +
        `• Ví dụ Mảnh Ký Ức: \`Mtang mảnh ký ức @user 20\``,
        'TẶNG TÀI SẢN (QUẢN LÝ)'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const rawAmount = nonMention[nonMention.length - 1];
    const amount = parseAmount(rawAmount);
    if (isNaN(amount) || amount <= 0) {
      const embed = createManyCurielEmbed(client, '⚠️ Số lượng không hợp lệ! Ví dụ: `50M`, `20`', 'LỖI SỐ LƯỢNG');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const unitText = nonMention.slice(0, -1).join(' ').toLowerCase();

    if (unitText.includes('ký ức') || unitText.includes('ky uc') || unitText.includes('mảnh ký ức')) {
      const u = db.getOrCreateUser(guild.id, targetUser.id);
      u.manh_ky_uc += amount;
      db.updateUser(guild.id, targetUser.id, { manh_ky_uc: u.manh_ky_uc });

      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.CUTEPAWS}\n` +
        `**CẤP VẬT PHẨM THÀNH CÔNG**\n\n` +
        `• **Người nhận:** <@${targetUser.id}>\n` +
        `• **Vật phẩm:** ${EMOJIS.MANH_KY_UC} Mảnh Ký Ức\n` +
        `• **Số lượng:** ${amount.toLocaleString()}\n\n` +
        `*Đã cập nhật dữ liệu thành công.*`,
        `${EMOJIS.CROWN} CẤP VẬT PHẨM THÀNH CÔNG`
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    // Default: Tinh Không Thạch
    const u = db.getOrCreateUser(guild.id, targetUser.id);
    u.tinh_khong_thach += amount;
    db.updateUser(guild.id, targetUser.id, { tinh_khong_thach: u.tinh_khong_thach });

    const embed = createManyCurielEmbed(
      client,
      `${EMOJIS.CUTEPAWS}\n` +
      `**CẤP VẬT PHẨM THÀNH CÔNG**\n\n` +
      `• **Người nhận:** <@${targetUser.id}>\n` +
      `• **Vật phẩm:** Tinh Không Thạch\n` +
      `• **Số lượng:** ${amount.toLocaleString()}\n\n` +
      `*Đã cập nhật dữ liệu thành công.*`,
      `${EMOJIS.CROWN} CẤP VẬT PHẨM THÀNH CÔNG`
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 3. Mcacql (Xem danh sách Quản lý, không hiển thị Owner)
  if (cmd === 'cacql') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const qlList = db.listQuanLy();
    let desc = '👑 **DANH SÁCH QUẢN LÝ**\n\n';
    if (qlList.length === 0) {
      desc += '*Hiện tại chưa có Quản lý nào được bổ nhiệm.*';
    } else {
      qlList.forEach((q, i) => {
        desc += `${i + 1}. <@${q.user_id}> (\`${q.username}\`)\n`;
      });
      desc += `\n**Tổng số Quản lý:** ${qlList.length}`;
    }

    const embed = createManyCurielEmbed(client, desc, 'DANH SÁCH QUẢN LÝ');
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 4. Maddstaff @user
  if (cmd === 'addstaff') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      const embed = createManyCurielEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`Maddstaff @user\``, 'BỔ NHIỆM STAFF');
      await message.reply({ embeds: [embed] });
      return true;
    }

    db.addStaff(targetUser.id, userId, targetUser.username);
    const embed = createManyCurielEmbed(
      client,
      `${EMOJIS.CROWN} Đã cấp quyền **Staff** thành công cho <@${targetUser.id}> (\`${targetUser.username}\`) và lưu trữ vào Database!\n\n` +
      `*Người được cấp có thể dùng các lệnh Staff. Không có quyền Quản lý.*`,
      `${EMOJIS.SPARKLE_FX} BỔ NHIỆM STAFF`
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 4.1 Mbogi @user (Xóa quyền Quản lý - Chỉ Owner)
  if (cmd === 'bogi') {
    if (!isOwner(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'OWNER');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      const embed = createManyCurielEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`Mbogi @user\``, 'XÓA QUẢN LÝ');
      await message.reply({ embeds: [embed] });
      return true;
    }

    db.removeQuanLy(targetUser.id);
    const embed = createManyCurielEmbed(
      client,
      `**ĐÃ XÓA QUYỀN QUẢN LÝ**\n\n` +
      `• **Thành viên:** <@${targetUser.id}>\n` +
      `• **Trạng thái:** Không còn nằm trong danh sách Quản lý hệ thống.\n\n` +
      `*(Tiến trình tu luyện và dữ liệu người chơi vẫn được bảo lưu 100%)*`,
      'XÓA QUẢN LÝ'
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 5. Mcacstaff (Xem danh sách Staff, không hiển thị Owner & Quản lý)
  if (cmd === 'cacstaff') {
    if (!isOwner(userId) && !isQuanLy(userId) && !isStaff(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'STAFF');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const staffList = db.listStaff();
    let desc = '🛡️ **DANH SÁCH STAFF HIỆN TẠI**\n\n';
    if (staffList.length === 0) {
      desc += '*Hiện tại chưa có Staff nào được bổ nhiệm.*';
    } else {
      staffList.forEach((s, i) => {
        desc += `${i + 1}. <@${s.user_id}> (\`${s.username}\`)\n`;
      });
      desc += `\n**Tổng số Staff:** ${staffList.length}`;
    }

    const embed = createManyCurielEmbed(client, desc, 'DANH SÁCH STAFF');
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 6. Mbostaff @user
  if (cmd === 'bostaff') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      const embed = createManyCurielEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`Mbostaff @user\``, 'XÓA STAFF');
      await message.reply({ embeds: [embed] });
      return true;
    }

    db.removeStaff(targetUser.id);
    const embed = createManyCurielEmbed(
      client,
      `**ĐÃ XÓA QUYỀN STAFF**\n\n` +
      `• **Người dùng:** <@${targetUser.id}>\n` +
      `• **Trạng thái:** Không còn là Staff.\n\n` +
      `*(Dữ liệu người chơi, tài sản và tiến trình tu luyện vẫn được giữ nguyên 100%)*`,
      'XÓA QUYỀN STAFF'
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 7. Mql (Hiển thị toàn bộ lệnh Quản lý)
  if (cmd === 'ql' || cmd === 'quanly') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const embed = createManyCurielEmbed(
      client,
      `👑 **DANH SÁCH TOÀN BỘ LỆNH QUẢN LÝ (TIỀN TỐ M & /):**\n\n` +
      `• \`Mtangmanh <cấp> <tên char> @user <số lượng>\`: Tặng Mảnh Nhân Vật (C, B, A, S) (vô hạn, không trừ ví QL)\n` +
      `• \`Mtang <đơn vị> @user <số lượng>\`: Tặng Tinh Không Thạch / Mảnh Ký Ức (vô hạn, không trừ ví QL)\n` +
      `• \`Mcacql\`: Xem danh sách tất cả Quản lý đang có\n` +
      `• \`Maddstaff @user\`: Bổ nhiệm thành viên vào Staff\n` +
      `• \`Mcacstaff\`: Xem danh sách Staff hiện tại\n` +
      `• \`Mbostaff @user\`: Xóa quyền Staff của thành viên\n` +
      `• \`Mphatqua <tổng TKT> <số người>\`: Tạo sự kiện phát quà Linh Thạch cho toàn server\n` +
      `• \`Mthaboss #kênh\`: Thả Boss Chung (Thần Lãng Thiên Sơn - 20.000 HP)\n` +
      `• \`Mkillboss\` / \`Mtieudietboss\`: Tiêu diệt Boss Chung đang hoạt động tức thì\n` +
      `• \`Mbotongmon <tên tông môn>\`: Giải tán tông môn theo lệnh quản trị\n` +
      `• \`Mmobicanh <tên tông môn>\`: Khai mở bí cảnh đặc biệt ngoài lịch\n` +
      `• \`Mbovp <tên sản phẩm>\`: Gỡ bỏ sản phẩm khỏi Cửa Hàng (Mshop)\n` +
      `• \`Mcam @user <thời gian>\`: Cấm người chơi sử dụng Bot (30S, 10P, 2H)\n` +
      `• \`Mbocam @user\`: Bỏ cấm người chơi sử dụng Bot\n` +
      `• \`Mtestanh <tên nv>\`: Xem và kiểm tra toàn bộ ảnh nhân vật\n` +
      `• \`/setupkenhchoi\`: Thiết lập kênh chơi bot độc quyền\n` +
      `• \`/setuprolet1\`: Thiết lập role Luyện Khí Tầng 1\n` +
      `• \`/setupkenhan\`: Thiết lập kênh ẩn cho cảnh giới cao\n` +
      `• \`/setuproletttl\`: Thiết lập role Tiên Tôn Trọng Lực (Độ Kiếp)\n` +
      `• \`/setuprolephuhao @role\`: Thiết lập Discord Role Top 1 BXH Phú Hào\n` +
      `• \`/setupanh <tên char> <cấp> <link>\`: Thiết lập ảnh thẻ nhân vật (C, B, A, S, 1000)\n` +
      `• \`/setanh <tên char> <link>\`: Thiết lập ảnh hồ sơ chính cho Sư phụ`,
      `${EMOJIS.CROWN} BẢNG ĐIỀU KHIỂN QUẢN LÝ (Mql)`
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 8. Mstaff (Hiển thị toàn bộ lệnh Staff)
  if (cmd === 'staff') {
    if (!isOwner(userId) && !isQuanLy(userId) && !isStaff(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'STAFF');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const embed = createManyCurielEmbed(
      client,
      `🛡️ **DANH SÁCH TOÀN BỘ LỆNH DÀNH CHO STAFF (TIỀN TỐ M):**\n\n` +
      `• \`Mcacstaff\`: Xem danh sách toàn bộ Staff hiện tại\n` +
      `• \`Mphatqua <tổng TKT> <số người>\`: Tạo sự kiện phát quà Linh Thạch bấm nút\n` +
      `  *(Giới hạn: Tối đa 3 lần/ngày tính chung toàn bộ Staff. Quản Lý không giới hạn)*\n` +
      `• \`Mthaboss #kênh\`: Thả Boss Chung vào kênh chỉ định cho toàn server chiến đấu\n` +
      `• \`Mcam @user <thời gian>\`: Tạm cấm người chơi vi phạm quy tắc bot (30S, 10P, 2H)\n` +
      `• \`Mbocam @user\`: Gỡ bỏ cấm bot cho người chơi`,
      `${EMOJIS.CROWN} BẢNG ĐIỀU KHIỂN STAFF (Mstaff)`
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 9. Mphatqua <tổng số Lĩnh Thạch> <số người nhận> (Nút 🎁 NHẬN QUÀ)
  if (cmd === 'phatqua' || cmd === 'phattien') {
    if (!isOwner(userId) && !isQuanLy(userId) && !isStaff(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'STAFF');
      await message.reply({ embeds: [embed] });
      return true;
    }

    // Check staff daily limit (3 times/day shared across all staff)
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const usedToday = db.getSharedStaffPhatQuaToday(guild.id);
      if (usedToday >= 3) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ **HẾT LƯỢT PHÁT QUÀ HÔM NAY!**\n\n` +
          `• Toàn bộ Staff đã sử dụng hết **3/3 lượt** phát quà chung của ngày hôm nay.\n` +
          `• Vui lòng chờ sang ngày mới để tiếp tục mở sự kiện phát quà!`,
          'GIỚI HẠN PHÁT QUÀ'
        );
        await message.reply({ embeds: [embed] });
        return true;
      }
      db.incrementSharedStaffPhatQua(guild.id);
    }

    const nonMention = args.filter(a => !a.startsWith('<@') && !a.endsWith('>'));
    if (nonMention.length < 2) {
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PBEAR} **Cú pháp:** \`Mphatqua <tổng số Lĩnh Thạch> <số người nhận>\`\n` +
        `• Ví dụ: \`Mphatqua 500K 10\`\n` +
        `• Cơ chế: Người chơi bấm nút **🎁 NHẬN QUÀ** để nhận số ngẫu nhiên cho đến khi hết quỹ.`,
        'SỰ KIỆN PHÁT QUÀ'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const totalAmount = parseAmount(nonMention[0]);
    const totalRecipients = parseInt(nonMention[1], 10);

    if (isNaN(totalAmount) || totalAmount <= 0 || isNaN(totalRecipients) || totalRecipients <= 0) {
      const embed = createManyCurielEmbed(client, '⚠️ Tổng số Linh Thạch hoặc số người nhận không hợp lệ!', 'LỖI SỰ KIỆN');
      await message.reply({ embeds: [embed] });
      return true;
    }

    if (totalAmount < totalRecipients) {
      const embed = createManyCurielEmbed(client, '⚠️ Tổng số Linh Thạch phải lớn hơn hoặc bằng số người nhận!', 'LỖI NGÂN SÁCH');
      await message.reply({ embeds: [embed] });
      return true;
    }

    let remainingAmount = totalAmount;
    let remainingRecipients = totalRecipients;
    const claimedUsers: Record<string, number> = {};

    const buildDropEmbed = () => {
      return createManyCurielEmbed(
        client,
        `🎁 **SỰ KIỆN PHÁT LINH THẠCH TOÀN DÂN** 🎁\n\n` +
        `• **Người phát động:** <@${userId}>\n` +
        `• **Tổng ngân sách:** \`${totalAmount.toLocaleString()}\` Linh Thạch\n` +
        `• **Ngân sách còn lại:** \`${remainingAmount.toLocaleString()}\` Linh Thạch\n` +
        `• **Số lượt còn lại:** \`${remainingRecipients} / ${totalRecipients}\` người\n\n` +
        (remainingRecipients > 0 ? `👉 *Bấm nút **🎁 NHẬN QUÀ** bên dưới để nhận phần thưởng ngẫu nhiên!*` : `🎉 *Đã phát hết quà cho toàn bộ người tham gia!*`),
        `${EMOJIS.CROWN} SỰ KIỆN PHÁT QUÀ`
      );
    };

    const getBtnRow = () => {
      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_claim_phatqua')
          .setLabel('🎁 NHẬN QUÀ')
          .setStyle(ButtonStyle.Success)
          .setDisabled(remainingRecipients <= 0 || remainingAmount <= 0)
      );
    };

    const dropMsg = await message.reply({
      embeds: [buildDropEmbed()],
      components: [getBtnRow()]
    });

    const collector = dropMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000
    });

    collector.on('collect', async i => {
      const claimerId = i.user.id;

      if (claimedUsers[claimerId]) {
        await i.reply({
          content: `⚠️ <@${claimerId}>, bạn đã nhận quà trong đợt này rồi (\`${claimedUsers[claimerId].toLocaleString()}\` Linh Thạch)!`,
          ephemeral: true
        });
        return;
      }

      if (remainingRecipients <= 0 || remainingAmount <= 0) {
        await i.reply({ content: '⚠️ Đợt phát quà này đã hết lượt nhận!', ephemeral: true });
        return;
      }

      let grant = 0;
      if (remainingRecipients === 1) {
        grant = remainingAmount;
      } else {
        // Random amount ensuring remaining gets at least 1 each
        const maxForThis = remainingAmount - (remainingRecipients - 1);
        const avg = Math.floor(remainingAmount / remainingRecipients);
        const randMax = Math.min(maxForThis, Math.max(1, avg * 2));
        grant = Math.floor(Math.random() * randMax) + 1;
      }

      remainingAmount -= grant;
      remainingRecipients -= 1;
      claimedUsers[claimerId] = grant;

      const recipient = db.getOrCreateUser(guild.id, claimerId, i.user.username);
      recipient.tinh_khong_thach += grant;
      db.updateUser(guild.id, claimerId, { tinh_khong_thach: recipient.tinh_khong_thach });

      await i.reply({
        content: `🎉 Chúc mừng <@${claimerId}> đã nhận được **${grant.toLocaleString()}** Linh Thạch!`,
        ephemeral: true
      });

      await dropMsg.edit({
        embeds: [buildDropEmbed()],
        components: [getBtnRow()]
      }).catch(() => null);

      if (remainingRecipients <= 0 || remainingAmount <= 0) {
        collector.stop();
      }
    });

    return true;
  }

  // 10. Msetupkenhchoi #kênh (Thiết lập kênh chơi bot chính thức - Quản Lý & Owner)
  if (cmd === 'setupkenhchoi') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createManyCurielEmbed(
        client,
        `⛔ <@${userId}> không thể sử dụng lệnh này vì bạn không phải Quản lý.`,
        'TRUY CẬP BỊ TỪ CHỐI'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const channel = message.mentions.channels.first() || (args[0] ? guild.channels.cache.get(args[0].replace(/[<#>]/g, '')) : null);
    if (!channel) {
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PBEAR} **Cú pháp:** \`/setupkenhchoi #kênh\` hoặc \`Msetupkenhchoi #kênh\`\n• Ví dụ: \`Msetupkenhchoi #bot-spam\``,
        'THIẾT LẬP KÊNH CHƠI'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    db.updateGuildConfig(guild.id, { play_channel_id: channel.id });

    const embed = createManyCurielEmbed(
      client,
      `✅ **Đã thiết lập kênh chơi Bot chính thức:** <#${channel.id}>\n\n` +
      `• Người chơi chỉ có thể sử dụng bot tại kênh này.\n` +
      `• Nếu dùng lệnh tại kênh khác:\n` +
      `  - Lần 1: Nhắc nhở vi phạm\n` +
      `  - Lần 2: Cảnh báo vi phạm\n` +
      `  - Lần 3: Cấm sử dụng lệnh trong 60 phút`,
      'THIẾT LẬP KÊNH CHƠI'
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  return false;
}
