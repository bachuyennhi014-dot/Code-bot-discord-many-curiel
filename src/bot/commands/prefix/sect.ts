import { 
  Message, 
  Client, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  StringSelectMenuOptionBuilder,
  ComponentType
} from 'discord.js';
import { db } from '../../database/database.js';
import { createManyCurielEmbed, createPermissionDeniedEmbed, EMOJIS } from '../../utils/embeds.js';
import { isOwner, isQuanLy } from '../../permissions/permissions.js';

export async function handleSectCommands(message: Message, client: Client, cmd: string, args: string[]): Promise<boolean> {
  const userId = message.author.id;
  const guild = message.guild;
  if (!guild) return false;

  // Tự động kiểm tra cộng quỹ 100k, chu cấp và thưởng chức vụ hàng ngày
  db.processDailyTreasuryAndAllowance();

  // 1. Mlap <tên tông môn> <số người tối đa> <Linh Thạch nộp để vào> <Linh Thạch phát mỗi ngày>
  if (cmd === 'lap' || cmd === 'laptong' || cmd === 'taotong' || cmd === 'khaitong') {
    if (args.length < 4) {
      const embed = createManyCurielEmbed(
        client,
        `📜 **CÚ PHÁP MỞ TÔNG MÔN:**\n\`Mlap <tên tông môn> <số người tối đa> <Linh Thạch nộp để vào> <Linh Thạch phát mỗi ngày>\`\n\n` +
        `• **Ví dụ:** \`Mlap Vân Mộng Tông 100 50000 10000\`\n\n` +
        `🛡️ **Điều kiện:**\n` +
        `• Đạt cảnh giới **Hóa Thần — Trung Kỳ** trở lên.\n` +
        `• Chưa là Tông chủ hoặc thành viên tông môn khác.\n` +
        `• Số người tối đa từ **1 đến 999**.\n` +
        `• Tông môn mới nhận ngay quỹ ban đầu: \`1.000.000\` Linh Thạch!`,
        'MỞ TÔNG MÔN'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const dailyAllowance = parseInt(args[args.length - 1], 10);
    const entryFee = parseInt(args[args.length - 2], 10);
    const maxMembers = parseInt(args[args.length - 3], 10);
    const sectName = args.slice(0, args.length - 3).join(' ').trim();

    if (isNaN(maxMembers) || isNaN(entryFee) || isNaN(dailyAllowance)) {
      const embed = createManyCurielEmbed(
        client,
        `⛔ Vui lòng nhập đúng định dạng số cho: Số người tối đa (1-999), Phí nộp vào và Linh Thạch phát mỗi ngày!`,
        'LỖI THAM SỐ'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const res = db.createSect(guild.id, userId, message.author.username, sectName, maxMembers, entryFee, dailyAllowance);
    const embed = createManyCurielEmbed(
      client,
      res.message,
      res.success ? `${EMOJIS.CROWN} KHAI SƠN LẬP PHÁI THÀNH CÔNG` : 'LỖI LẬP TÔNG MÔN'
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 2. Mtongmon / Mtm (Xem danh sách tông môn)
  if (cmd === 'tongmon' || cmd === 'tm') {
    const sects = db.getAllSects(guild.id);

    if (sects.length === 0) {
      const embed = createManyCurielEmbed(
        client,
        `📜 **DANH SÁCH TÔNG MÔN TRONG TU CHÂN GIỚI**\n\n` +
        `*(Hiện chưa có tông môn nào được thành lập trong máy chủ. Đạo hữu đạt Hóa Thần Trung Kỳ có thể dùng lệnh \`Mlap <tên> <số người> <phí vào> <chu cấp>\` để khai sơn lập phái!)*`,
        'DANH SÁCH TÔNG MÔN'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    let desc = `${EMOJIS.ELYS_BLING7} **DANH SÁCH CÁC TÔNG MÔN HIỆN HỮU** ${EMOJIS.ELYS_BLING7}\n\n`;
    sects.forEach((s, idx) => {
      const totalMembers = 1 + (s.elders?.length || 0) + (s.members?.length || 0);
      const isFull = totalMembers >= s.max_members;
      desc += `${idx + 1}. 🏯 **${s.sect_name}**\n` +
        `   • Tông chủ: <@${s.leader_id}>\n` +
        `   • Thành viên: \`${totalMembers} / ${s.max_members}\` tu sĩ (${isFull ? '🔴 Đã đầy' : '🟢 Đang tuyển'})\n` +
        `   • Phí nộp vào: \`${s.entry_fee.toLocaleString()}\` Linh Thạch | Chu cấp: \`${s.daily_allowance.toLocaleString()}\`/ngày\n` +
        `   • Quỹ tông môn: \`${s.treasury.toLocaleString()}\` Linh Thạch\n\n`;
    });

    desc += `👉 *Hãy chọn một tông môn từ danh sách bên dưới để xem chi tiết và xin bái nhập!*`;

    const selectOptions = sects.slice(0, 25).map(s => {
      const totalMembers = 1 + (s.elders?.length || 0) + (s.members?.length || 0);
      return new StringSelectMenuOptionBuilder()
        .setLabel(s.sect_name.length > 25 ? s.sect_name.substring(0, 22) + '...' : s.sect_name)
        .setDescription(`TV: ${totalMembers}/${s.max_members} • Phí: ${s.entry_fee.toLocaleString()} LT`)
        .setValue(s.sect_id);
    });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`select_sect_view_${userId}`)
      .setPlaceholder('🏯 Chọn tông môn muốn xem chi tiết...')
      .addOptions(selectOptions);

    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
    const embed = createManyCurielEmbed(client, desc, 'HỆ THỐNG TÔNG MÔN');

    const listMsg = await message.reply({ embeds: [embed], components: [selectRow] });

    const collector = listMsg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 120000
    });

    collector.on('collect', async i => {
      if (!i.isStringSelectMenu()) return;
      const sectId = i.values[0];
      const sect = db.getSect(sectId);
      if (!sect) {
        await i.reply({ content: '⛔ Tông môn này không còn tồn tại!', ephemeral: true });
        return;
      }

      const totalMembers = 1 + (sect.elders?.length || 0) + (sect.members?.length || 0);
      const detailDesc = `🏯 **CHI TIẾT TÔNG MÔN: ${sect.sect_name.toUpperCase()}**\n\n` +
        `• **Tông Chủ:** <@${sect.leader_id}>\n` +
        `• **Trưởng Lão:** ${sect.elders && sect.elders.length > 0 ? sect.elders.map(e => `<@${e}>`).join(', ') : '*Chưa có*'}\n` +
        `• **Số lượng môn đồ:** \`${totalMembers} / ${sect.max_members}\` tu sĩ\n` +
        `• **Quỹ Tông Môn:** \`${sect.treasury.toLocaleString()}\` Linh Thạch\n` +
        `• **Linh Thạch nộp khi vào:** \`${sect.entry_fee.toLocaleString()}\` Linh Thạch\n` +
        `• **Linh Thạch chu cấp mỗi ngày:** \`${sect.daily_allowance.toLocaleString()}\` Linh Thạch\n` +
        `• **Trạng thái:** ${totalMembers >= sect.max_members ? '🔴 Đã đủ số lượng' : '🟢 Đang mở cửa tiếp nhận môn đồ'}\n\n` +
        `👉 *Bấm [XÁC NHẬN XIN VÀO] để gửi hồ sơ bái kiến Tông chủ và Trưởng lão!*`;

      const detailEmbed = createManyCurielEmbed(client, detailDesc, `THÔNG TIN ${sect.sect_name.toUpperCase()}`);

      const btnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`btn_sect_join_${sect.sect_id}`)
          .setLabel('✅ XÁC NHẬN XIN VÀO')
          .setStyle(ButtonStyle.Success)
          .setDisabled(totalMembers >= sect.max_members),
        new ButtonBuilder()
          .setCustomId(`btn_sect_cancel_${sect.sect_id}`)
          .setLabel('❌ HỦY')
          .setStyle(ButtonStyle.Secondary)
      );

      await i.update({ embeds: [detailEmbed], components: [btnRow] });

      const joinCollector = listMsg.createMessageComponentCollector({
        filter: btn => btn.user.id === userId,
        componentType: ComponentType.Button,
        time: 60000,
        max: 1
      });

      joinCollector.on('collect', async btn => {
        if (btn.customId.startsWith('btn_sect_cancel_')) {
          await btn.update({ content: 'Đã hủy thao tác xin vào tông môn.', embeds: [], components: [] });
          return;
        }

        if (btn.customId.startsWith('btn_sect_join_')) {
          const reqRes = db.submitJoinRequest(sect.sect_id, userId, message.author.username);
          if (!reqRes.success) {
            await btn.update({ content: reqRes.message, embeds: [], components: [] });
            return;
          }

          // Gửi hồ sơ qua DM cho Tông chủ và Trưởng lão
          const managersToNotify = [sect.leader_id, ...(sect.elders || [])];
          const dmEmbed = createManyCurielEmbed(
            client,
            `📩 **HỒ SƠ XIN GIA NHẬP TÔNG MÔN MỚI!**\n\n` +
            `• **Tông môn:** **${sect.sect_name}**\n` +
            `• **Tu sĩ:** <@${userId}> (\`${message.author.username}\`)\n` +
            `• **Phí sẽ nộp vào quỹ:** \`${sect.entry_fee.toLocaleString()}\` Linh Thạch\n\n` +
            `👉 *Hãy bấm nút bên dưới để DUYỆT hoặc KHÔNG DUYỆT yêu cầu này:*`,
            'HỒ SƠ BÁI NHẬP'
          );

          const dmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`btn_review_approve_${sect.sect_id}_${reqRes.request.request_id}`)
              .setLabel('✅ DUYỆT')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`btn_review_reject_${sect.sect_id}_${reqRes.request.request_id}`)
              .setLabel('❌ KHÔNG DUYỆT')
              .setStyle(ButtonStyle.Danger)
          );

          for (const mId of managersToNotify) {
            try {
              const mUser = await client.users.fetch(mId).catch(() => null);
              if (mUser) {
                await mUser.send({ embeds: [dmEmbed], components: [dmRow] }).catch(() => null);
              }
            } catch {
              // ignore dm restriction
            }
          }

          await btn.update({
            content: `✅ Đã gửi yêu cầu xin gia nhập **${sect.sect_name}** đến Tông chủ và các Trưởng lão! Vui lòng kiên nhẫn đợi xét duyệt.`,
            embeds: [],
            components: []
          });
        }
      });
    });

    return true;
  }

  // 3. Mtmcuatoi (Xem và quản lý tông môn của bản thân - Chỉ Tông chủ & Trưởng lão)
  if (cmd === 'tmcuatoi' || cmd === 'mysect') {
    const sect = db.getSectByMember(userId);
    if (!sect) {
      const embed = createManyCurielEmbed(
        client,
        `⛔ Đạo hữu hiện tại **chưa gia nhập tông môn nào**! Dùng lệnh \`Mtongmon\` để xem danh sách và bái nhập.`,
        'CHƯA CÓ TÔNG MÔN'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const isLeader = sect.leader_id === userId;
    const isElder = (sect.elders || []).includes(userId);

    if (!isLeader && !isElder) {
      const embed = createManyCurielEmbed(
        client,
        `⛔ Lệnh \`Mtmcuatoi\` là quyền năng quản lý dành riêng cho **Tông Chủ** và **Trưởng Lão**! Đệ tử thông thường vui lòng dùng lệnh \`Mtmthamgia\`.`,
        'QUYỀN HẠN KHÔNG ĐỦ'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const totalMembers = 1 + (sect.elders?.length || 0) + (sect.members?.length || 0);
    const eldersStr = sect.elders && sect.elders.length > 0 ? sect.elders.map(e => `<@${e}>`).join(', ') : '*Chưa bổ nhiệm (Tối đa 3)*';
    const disciplesList = sect.members && sect.members.length > 0
      ? sect.members.slice(0, 10).map((m, i) => `${i + 1}. <@${m}>`).join('\n') + (sect.members.length > 10 ? `\n*...và ${sect.members.length - 10} đệ tử khác*` : '')
      : '*Chưa có đệ tử*';

    const recentHistory = (sect.history || []).slice(-5).reverse().map(h => {
      const d = new Date(h.timestamp).toLocaleDateString();
      return `• [${d}] **${h.action}**: ${h.note} (${h.amount > 0 ? '+' : ''}${h.amount.toLocaleString()} LT)`;
    }).join('\n') || '*Chưa có biến động quỹ*';

    const desc = `🏯 **TRUNG TÂM QUẢN LÝ TÔNG MÔN: ${sect.sect_name.toUpperCase()}**\n\n` +
      `👑 **Tông Chủ:** <@${sect.leader_id}>\n` +
      `🛡️ **Trưởng Lão (\`${sect.elders?.length || 0}/3\`):** ${eldersStr}\n` +
      `👥 **Tổng quân số:** \`${totalMembers} / ${sect.max_members}\` tu sĩ\n` +
      `💰 **Quỹ Tông Môn:** \`${sect.treasury.toLocaleString()}\` Linh Thạch\n` +
      `💎 **Mức Linh Thạch gia nhập:** \`${sect.entry_fee.toLocaleString()}\` Linh Thạch\n` +
      `🌾 **Chu cấp mỗi ngày:** \`${sect.daily_allowance.toLocaleString()}\` Linh Thạch/đệ tử\n\n` +
      `📜 **Danh sách môn đồ:**\n${disciplesList}\n\n` +
      `📊 **Lịch sử thu chi gần đây:**\n${recentHistory}`;

    const embed = createManyCurielEmbed(client, desc, `BẢNG QUẢN LÝ ${sect.sect_name.toUpperCase()}`);

    const components: ActionRowBuilder<ButtonBuilder>[] = [];
    if (isLeader) {
      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`btn_sect_withdraw_${sect.sect_id}`).setLabel('💰 RÚT QUỸ').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`btn_sect_addelder_${sect.sect_id}`).setLabel('➕ THÊM TRƯỞNG LÃO').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`btn_sect_rmelder_${sect.sect_id}`).setLabel('➖ KHAI TRỪ TRƯỞNG LÃO').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`btn_sect_disband_${sect.sect_id}`).setLabel('💥 XÓA TÔNG MÔN').setStyle(ButtonStyle.Danger)
      );
      components.push(row1);
    }

    const replyMsg = await message.reply({ embeds: [embed], components });

    if (!isLeader) return true;

    const collector = replyMsg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      componentType: ComponentType.Button,
      time: 120000
    });

    collector.on('collect', async i => {
      // 1. Rút quỹ
      if (i.customId.startsWith('btn_sect_withdraw_')) {
        await i.reply({
          content: `💬 Vui lòng gõ lệnh trực tiếp để rút quỹ an toàn:\n\`Mrutquy <số linh thạch>\`\n*Ví dụ: \`Mrutquy 50000\`*`,
          ephemeral: true
        });
        return;
      }

      // 2. Thêm Trưởng lão
      if (i.customId.startsWith('btn_sect_addelder_')) {
        const disciples = sect.members || [];
        if (disciples.length === 0) {
          await i.reply({ content: '⛔ Tông môn hiện chưa có đệ tử nào để bổ nhiệm làm Trưởng lão!', ephemeral: true });
          return;
        }
        if ((sect.elders || []).length >= 3) {
          await i.reply({ content: '⛔ Tông môn đã có đủ tối đa 3 Trưởng lão!', ephemeral: true });
          return;
        }

        const options = disciples.slice(0, 25).map(d => ({
          label: `Tu sĩ ID: ${d}`,
          value: d,
          description: `Bổ nhiệm tu sĩ này làm Trưởng lão`
        }));

        const menu = new StringSelectMenuBuilder()
          .setCustomId(`select_add_elder_${sect.sect_id}`)
          .setPlaceholder('Chọn đệ tử muốn bổ nhiệm...')
          .addOptions(options);

        await i.reply({
          content: '👑 Hãy chọn đệ tử muốn phong làm Trưởng lão:',
          components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
          ephemeral: true
        });
        return;
      }

      // 3. Khai trừ Trưởng lão
      if (i.customId.startsWith('btn_sect_rmelder_')) {
        const elders = sect.elders || [];
        if (elders.length === 0) {
          await i.reply({ content: '⛔ Hiện tông môn chưa có Trưởng lão nào!', ephemeral: true });
          return;
        }

        const options = elders.map(e => ({
          label: `Trưởng lão ID: ${e}`,
          value: e,
          description: `Cách chức Trưởng lão của tu sĩ này`
        }));

        const menu = new StringSelectMenuBuilder()
          .setCustomId(`select_rm_elder_${sect.sect_id}`)
          .setPlaceholder('Chọn Trưởng lão muốn cách chức...')
          .addOptions(options);

        await i.reply({
          content: '🛡️ Hãy chọn Trưởng lão muốn cách chức:',
          components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)],
          ephemeral: true
        });
        return;
      }

      // 4. Xóa tông môn
      if (i.customId.startsWith('btn_sect_disband_')) {
        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`btn_confirm_disband_${sect.sect_id}`).setLabel('⚠️ XÁC NHẬN GIẢI TÁN').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`btn_cancel_disband_${sect.sect_id}`).setLabel('HỦY').setStyle(ButtonStyle.Secondary)
        );

        await i.reply({
          content: `⚠️ **CẢNH BÁO:** Đạo hữu có chắc chắn muốn giải tán vĩnh viễn tông môn **${sect.sect_name}** không? Hành động này không thể hoàn tác!`,
          components: [confirmRow],
          ephemeral: true
        });
        return;
      }
    });

    return true;
  }

  // 4. Mtmthamgia (Xem thông tin tông môn đang tham gia và nút rời tông môn)
  if (cmd === 'tmthamgia' || cmd === 'myjoin') {
    const sect = db.getSectByMember(userId);
    if (!sect) {
      const embed = createManyCurielEmbed(
        client,
        `⚠️ Đạo hữu hiện tại chưa gia nhập tông môn nào! Gõ \`Mtongmon\` để xem danh sách các tông môn.`,
        'CHƯA GIA NHẬP TÔNG MÔN'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    let roleName = 'Đệ Tử';
    if (sect.leader_id === userId) roleName = 'Tông Chủ';
    else if ((sect.elders || []).includes(userId)) roleName = 'Trưởng Lão';

    const totalMembers = 1 + (sect.elders?.length || 0) + (sect.members?.length || 0);
    const desc = `🏯 **TÔNG MÔN BẠN ĐANG THAM GIA: ${sect.sect_name.toUpperCase()}**\n\n` +
      `• **Chức vụ của bạn:** **[${roleName}]**\n` +
      `• **Tông Chủ:** <@${sect.leader_id}>\n` +
      `• **Trưởng Lão:** ${sect.elders && sect.elders.length > 0 ? sect.elders.map(e => `<@${e}>`).join(', ') : '*Chưa có*'}\n` +
      `• **Số thành viên:** \`${totalMembers} / ${sect.max_members}\` tu sĩ\n` +
      `• **Quỹ Tông Môn:** \`${sect.treasury.toLocaleString()}\` Linh Thạch\n` +
      `• **Linh Thạch chu cấp mỗi ngày:** \`${sect.daily_allowance.toLocaleString()}\` Linh Thạch\n\n` +
      `✨ *Đệ tử tông môn được hưởng bí cảnh, sự kiện và đặc quyền giảm tỷ lệ thất bại khi thăng cấp!*`;

    const embed = createManyCurielEmbed(client, desc, 'THÔNG TIN TÔNG MÔN');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_sect_leave_${sect.sect_id}`)
        .setLabel('🚪 RỜI TÔNG MÔN')
        .setStyle(ButtonStyle.Danger)
    );

    const sentMsg = await message.reply({ embeds: [embed], components: [row] });

    const collector = sentMsg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      componentType: ComponentType.Button,
      time: 60000,
      max: 1
    });

    collector.on('collect', async i => {
      const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_agree_leave').setLabel('🔴 ĐỒNG Ý RỜI ĐI').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('btn_stay_leave').setLabel('🟢 Ở LẠI').setStyle(ButtonStyle.Success)
      );

      await i.update({
        content: `⚠️ Đạo hữu có chắc chắn muốn rời khỏi tông môn **${sect.sect_name}** không? (Phí gia nhập sẽ không được hoàn lại).`,
        embeds: [],
        components: [confirmRow]
      });

      const confirmCollector = sentMsg.createMessageComponentCollector({
        filter: btn => btn.user.id === userId,
        componentType: ComponentType.Button,
        time: 30000,
        max: 1
      });

      confirmCollector.on('collect', async btn => {
        if (btn.customId === 'btn_stay_leave') {
          await btn.update({ content: '✅ Đạo hữu đã chọn ở lại cống hiến cho tông môn.', components: [] });
          return;
        }

        const leaveRes = db.leaveSect(userId);
        await btn.update({ content: leaveRes.message, components: [] });
      });
    });

    return true;
  }

  // 5. Mrutquy <số linh thạch> (Tông chủ rút quỹ tông môn)
  if (cmd === 'rutquy' || cmd === 'withdrawtreasury') {
    const sect = db.getSectByMember(userId);
    if (!sect) {
      await message.reply({ content: '⛔ Đạo hữu không thuộc tông môn nào!' });
      return true;
    }
    if (sect.leader_id !== userId) {
      await message.reply({ content: '⛔ Chỉ có Tông chủ mới có quyền rút Linh Thạch từ quỹ!' });
      return true;
    }

    const amount = parseInt(args[0]?.replace(/,/g, ''), 10);
    if (isNaN(amount) || amount <= 0) {
      await message.reply({ content: '⛔ Cú pháp: `Mrutquy <số linh thạch>`\nVí dụ: `Mrutquy 50000`' });
      return true;
    }

    const res = db.withdrawSectTreasury(sect.sect_id, userId, amount);
    await message.reply({ content: res.message });
    return true;
  }

  // 6. Mbotongmon <tên tông môn> (Chỉ Owner & Quản lý giải thể tông môn)
  if (cmd === 'botongmon' || cmd === 'xoatongmon' || cmd === 'giaitantongmon') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const query = args.join(' ').trim();
    if (!query) {
      await message.reply({ content: '⚠️ Cú pháp: `Mbotongmon <tên tông môn>`\nVí dụ: `Mbotongmon Vân Mộng Tông`' });
      return true;
    }

    const sect = db.getSect(query);
    if (!sect) {
      await message.reply({ content: `⛔ Không tìm thấy tông môn nào có tên hoặc ID **${query}**!` });
      return true;
    }

    const res = db.disbandSect(sect.sect_id, userId, true);
    const embed = createManyCurielEmbed(
      client,
      `💥 **QUẢN TRỊ VIÊN ĐÃ GIẢI THỂ TÔNG MÔN!**\n\n` +
      `• **Tông môn:** **${sect.sect_name}**\n` +
      `• **Tông chủ:** <@${sect.leader_id}>\n` +
      `• **Người thực thi:** <@${userId}> *(Quản Trị)*\n\n` +
      `*Mọi phiên bí cảnh liên quan đã bị đóng, dữ liệu người chơi vẫn được bảo toàn nguyên vẹn.*`,
      'GIẢI THỂ TÔNG MÔN'
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 7. Mhutvankhi (Tông chủ sa đọa hút 30% vận khí đệ tử)
  if (cmd === 'hutvankhi' || cmd === 'hvk') {
    const session = db.getCorruptedLeader();
    if (!session || session.leader_id !== userId) {
      const embed = createManyCurielEmbed(
        client,
        `⛔ Chỉ **Tông Chủ Sa Đọa** đang trong nhiệm kỳ mới có thể sử dụng ma công \`Mhutvankhi\`!`,
        'KHÔNG ĐỦ TƯ CÁCH'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`btn_confirm_absorb_${userId}`).setLabel('🌑 KÍCH HOẠT HÚT VẬN KHÍ (-3.000 DCH)').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`btn_cancel_absorb_${userId}`).setLabel('HỦY').setStyle(ButtonStyle.Secondary)
    );

    const promptEmbed = createManyCurielEmbed(
      client,
      `🌑 **NGHI THỨC TÔNG CHỦ SA ĐỌA: HÚT VẬN KHÍ ĐỆ TỬ** 🌑\n\n` +
      `• **Tiêu tốn:** \`3.000\` Điểm Cống Hiến\n` +
      `• **Mục tiêu:** Toàn bộ đệ tử trong tông môn của bạn\n` +
      `• **Hiệu quả:** Tước đoạt **30% Linh Thạch, Tu Vi và Mảnh Ký Ức** chuyển về cho Tông chủ Sa Đọa!\n` +
      `• **Hạn mức:** Chỉ sử dụng được **1 lần mỗi chu kỳ 7 ngày**.\n\n` +
      `⚠️ *Đạo hữu có chắc chắn muốn phát động ma công không?*`,
      'HÚT VẬN KHÍ ĐỆ TỬ'
    );

    const askMsg = await message.reply({ embeds: [promptEmbed], components: [confirmRow] });

    const collector = askMsg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      componentType: ComponentType.Button,
      time: 30000,
      max: 1
    });

    collector.on('collect', async i => {
      if (i.customId.startsWith('btn_cancel_absorb_')) {
        await i.update({ content: 'Đã hủy nghi thức hút vận khí.', embeds: [], components: [] });
        return;
      }

      const res = db.absorbFortune(userId);
      const resEmbed = createManyCurielEmbed(
        client,
        res.message,
        res.success ? 'HÚT VẬN KHÍ THÀNH CÔNG' : 'THẤT BẠI'
      );
      await i.update({ embeds: [resEmbed], components: [] });
    });

    return true;
  }

  return false;
}
