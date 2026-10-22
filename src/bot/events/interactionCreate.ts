import { Interaction, Client, ButtonInteraction, MessageFlags } from 'discord.js';
import { allSlashCommands } from '../commands/slash/allCommands.js';
import { createErrorEmbed, createManyCurielEmbed } from '../utils/embeds.js';
import { CHARACTER_NAMES } from '../types/cultivation.js';
import { db } from '../database/database.js';
import { isOwner, isQuanLy } from '../permissions/permissions.js';

async function handleOpen1000ImageButton(interaction: ButtonInteraction, client: Client): Promise<void> {
  const parts = interaction.customId.replace('btn_open_1000img_', '').split('_');
  const targetUserId = parts[0];
  const charIndexStr = parts[1];
  const charIndex = parseInt(charIndexStr, 10);

  if (interaction.user.id !== targetUserId) {
    await interaction.reply({
      content: '❌ Bạn không có quyền nhận ảnh phần thưởng 1000 Hảo Cảm của người khác.',
      ephemeral: true
    });
    return;
  }

  const charName = (!isNaN(charIndex) && CHARACTER_NAMES[charIndex]) ? CHARACTER_NAMES[charIndex] : null;
  if (!charName) {
    await interaction.reply({
      content: '⚠️ Không xác định được nhân vật tương ứng.',
      ephemeral: true
    });
    return;
  }

  const guildId = interaction.guildId || '';
  const charImgs = db.getCharacterImages(charName);
  const imgUrl = charImgs['1000_affection'] || charImgs['1000'] || charImgs.profile || charImgs.S || null;
  
  if (!imgUrl) {
    const embed = createManyCurielEmbed(
      client,
      `🎉 **CHÚC MỪNG BẠN ĐẠT MỐC 1.000 HẢO CẢM VỚI ${charName.toUpperCase()}!** 🌸\n\n` +
      `• Bạn đã mở khóa tư cách nhận ảnh mốc 1.000 Hảo Cảm của **${charName}**!\n` +
      `• Hiện tại Quản Lý chưa cài đặt ảnh mốc 1.000 Hảo Cảm cho nhân vật này (sử dụng lệnh \`/setanhthe ${charName} 1000 <link ảnh>\` hoặc \`/setanh\`).\n` +
      `• Ngay khi Quản Lý thiết lập ảnh, ảnh sẽ tự động xuất hiện trong Thư Viện Ảnh (\`Mthuvien\`) của bạn!`,
      'MỐC 1.000 HẢO CẢM'
    );
    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (guildId && imgUrl) {
    db.addPhotoToLibrary(guildId, targetUserId, charName, imgUrl);
  }

  const embed = createManyCurielEmbed(
    client,
    `🎉 **NHẬN ẢNH THÀNH CÔNG!** 📸\n\n` +
    `• Đã thêm ảnh của nhân vật **${charName}** vào **Thư viện ảnh** của bạn!\n` +
    `• Dùng lệnh **\`Mthuvien\`** để mở Thư viện ảnh tương tác theo từng nhân vật (chỉ người dùng lệnh mới có quyền lướt nút \`<\` và \`>\`).\n` +
    `• Hoặc dùng lệnh **\`Mxemthuvien\`** để xem toàn bộ danh sách ảnh đã sưu tập.`,
    'THƯ VIỆN ẢNH'
  );
  embed.setImage(imgUrl);

  await interaction.reply({ embeds: [embed] });
}

export async function onInteractionCreate(interaction: Interaction, client: Client): Promise<void> {
  // 1. Xử lý Autocomplete cho Slash Commands (/setanh, /setupanh...)
  if (interaction.isAutocomplete()) {
    const command = allSlashCommands.find(c => c.data.name === interaction.commandName);
    if (command && (command as any).autocomplete) {
      await (command as any).autocomplete(interaction, client).catch((err: any) => console.error('[AUTOCOMPLETE ERROR]', err));
    }
    return;
  }

  // 2. Xử lý persistent Button (MỞ ẢNH 1000 HẢO CẢM & BẢO VỆ NÚT THƯ VIỆN ẢNH)
  if (interaction.isButton()) {
    if (interaction.customId.startsWith('btn_open_1000img_')) {
      await handleOpen1000ImageButton(interaction, client);
      return;
    }

    // Bảo vệ quyền bấm nút Thư viện ảnh: Chỉ người dùng lệnh mới được thao tác
    if (interaction.customId.startsWith('btn_lib_') || interaction.customId.startsWith('btn_allphotos_')) {
      const parts = interaction.customId.split('_');
      // btn_lib_prev_<userId>, btn_lib_next_<userId>, btn_lib_char_<userId>_<idx>
      // btn_allphotos_prev_<userId>, btn_allphotos_next_<userId>
      let ownerId = '';
      if (interaction.customId.startsWith('btn_lib_char_')) {
        ownerId = parts[3];
      } else {
        ownerId = parts[parts.length - 1];
      }

      if (ownerId && interaction.user.id !== ownerId) {
        await interaction.reply({
          content: '❌ Bạn không có quyền sử dụng thư viện ảnh của người khác! Chỉ người dùng lệnh mới có quyền sử dụng nút lướt và xem thư viện của mình.',
          ephemeral: true
        });
        return;
      }
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guildId;
  const userId = interaction.user.id;

  // 1. Kiểm tra ban
  if (guildId) {
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
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    // 2. Kiểm tra kênh chơi
    const guildConfig = db.getGuildConfig(guildId);
    const isManagerOrOwner = isOwner(userId) || isQuanLy(userId);
    const isThread = interaction.channel?.isThread() || false;
    const isBossChungChannel = db.getBossChung(guildId)?.channel_id === interaction.channelId;

    if (!guildConfig.play_channel_id) {
      if (interaction.commandName !== 'setupkenhchoi' && !isManagerOrOwner) {
        const embed = createManyCurielEmbed(
          client,
          `⚠️ Máy chủ chưa thiết lập kênh sử dụng bot!\n\n` +
          `• Vui lòng nhờ **Quản Lý** thiết lập kênh chơi bằng lệnh \`/setupkenhchoi #kênh\` để bắt đầu chơi.`,
          'CHƯA THIẾT LẬP KÊNH CHƠI'
        );
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }
    } else {
      const isPlayChannel = interaction.channelId === guildConfig.play_channel_id ||
                            (isThread && (interaction.channel as any)?.parentId === guildConfig.play_channel_id);

      if (!isPlayChannel && !isBossChungChannel && !isManagerOrOwner) {
        const violation = db.incrementViolation(guildId, userId);

        if (violation.count === 1) {
          const embed = createManyCurielEmbed(
            client,
            `⚠️ <@${userId}>, vui lòng chỉ sử dụng bot tại kênh <#${guildConfig.play_channel_id}>!\n*(Vi phạm lần 1/3 - Cảnh báo)*`,
            'VI PHẠM KÊNH CHƠI'
          );
          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
          return;
        } else if (violation.count === 2) {
          const embed = createManyCurielEmbed(
            client,
            `⚠️ <@${userId}>, vui lòng chỉ sử dụng bot tại kênh <#${guildConfig.play_channel_id}>!\n*(Vi phạm lần 2/3 - Cảnh báo: Vi phạm lần 3 sẽ bị cấm dùng bot 60 phút)*`,
            'VI PHẠM KÊNH CHƠI'
          );
          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
          return;
        } else {
          db.banBotUser(userId, guildId, 60 * 60 * 1000, 'Dùng bot sai kênh 3 lần', client.user?.id || 'BOT');
          db.resetViolation(guildId, userId);
          const embed = createManyCurielEmbed(
            client,
            `⛔ <@${userId}> đã vi phạm sử dụng bot sai kênh 3 lần!\n**Hình phạt:** Cấm sử dụng lệnh trong **60 phút**.`,
            'HÌNH PHẠT VI PHẠM'
          );
          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
          return;
        }
      }
    }
  }

  const command = allSlashCommands.find(c => c.data.name === interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error: any) {
    console.error(`[COMMAND ERROR]\nUser ID: ${interaction.user.id}\nGuild ID: ${interaction.guildId}\nCommand: /${interaction.commandName}\nError:`, error);
    const errorEmbed = createErrorEmbed(client);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed] }).catch(() => null);
      } else {
        await interaction.reply({ embeds: [errorEmbed] }).catch(() => null);
      }
    } catch {
      // Ignore network timeout errors
    }
  }
}
