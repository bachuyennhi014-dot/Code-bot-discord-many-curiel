import { 
  Message, 
  Client, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType,
  ChannelType
} from 'discord.js';
import { db } from '../../database/database.js';
import { createManyCurielEmbed, createPermissionDeniedEmbed, EMOJIS } from '../../utils/embeds.js';
import { isOwner, isQuanLy, isStaff } from '../../permissions/permissions.js';
import { calculateBossDamage } from '../../types/cultivation.js';

export async function handleSecretRealmCommands(message: Message, client: Client, cmd: string, args: string[]): Promise<boolean> {
  const userId = message.author.id;
  const guild = message.guild;
  if (!guild) return false;

  // 1. Mbicanh (Tông chủ / Trưởng lão mở bí cảnh cho tông môn)
  if (cmd === 'bicanh' || cmd === 'bc') {
    const sect = db.getSectByMember(userId);
    if (!sect) {
      const embed = createManyCurielEmbed(
        client,
        `⛔ Đạo hữu hiện **chưa gia nhập tông môn nào**! Bí Cảnh là sự kiện dành riêng cho các thành viên của Tông Môn. Hãy dùng \`Mtongmon\` để gia nhập.`,
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
        `⛔ Chỉ **Tông Chủ** hoặc **Trưởng Lão** mới có quyền mở Bí Cảnh Tông Môn! Đệ tử hãy nhắc nhở trưởng bối mở cửa bí cảnh.`,
        'QUYỀN HẠN KHÔNG ĐỦ'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    // Kiểm tra xem tông môn đã có phiên bí cảnh đang chạy chưa
    const activeSession = db.getActiveSectRealmSession(sect.sect_id);
    if (activeSession && Date.now() < activeSession.deadline) {
      const remainingSecs = Math.ceil((activeSession.deadline - Date.now()) / 1000);
      const mins = Math.floor(remainingSecs / 60);
      const secs = remainingSecs % 60;
      const embed = createManyCurielEmbed(
        client,
        `⚠️ Tông môn **${sect.sect_name}** hiện đã có phiên Bí Cảnh đang diễn ra tại chủ đề <#${activeSession.thread_id}>!\n\n` +
        `• Ải hiện tại: \`Ải ${activeSession.current_stage}/10\`\n` +
        `• Thời gian còn lại: \`${mins} phút ${secs} giây\`\n\n` +
        `👉 Hãy vào chủ đề trên để cùng đồng môn xuất kích!`,
        'BÍ CẢNH ĐANG DIỄN RA'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const totalMembers = 1 + (sect.elders?.length || 0) + (sect.members?.length || 0);
    const eldersStr = (sect.elders || []).length > 0 ? sect.elders.map(e => `<@${e}>`).join(', ') : '*Chưa có*';

    const embed = createManyCurielEmbed(
      client,
      `🏯 **CHÀO MỪNG ĐẾN BÍ CẢNH TÔNG MÔN** 🏯\n\n` +
      `• **Tông môn:** **${sect.sect_name}**\n` +
      `• **Tông chủ:** <@${sect.leader_id}>\n` +
      `• **Trưởng lão dẫn đoàn:** ${eldersStr}\n` +
      `• **Số thành viên sẵn sàng:** \`${totalMembers}\` tu sĩ\n` +
      `• **Thời hạn tối đa:** \`40 phút\`\n` +
      `• **Số ải:** \`10 Ải thử thách sinh tử\`\n\n` +
      `🎁 **Phần thưởng vượt ải:**\n` +
      `• Tông môn đứng đầu: Đệ tử nhận \`10.000\` LT + \`3\` Mảnh Ký Ức; Tông chủ nhận gấp đôi (\`20.000\` LT + \`6\` Mảnh Ký Ức); Trưởng lão nhận \`15.000\` LT + \`4\` Mảnh Ký Ức.\n` +
      `• Các tông môn hoàn thành còn lại: Đệ tử nhận \`10.000\` LT; Tông chủ nhận \`15.000\` LT; Trưởng lão nhận \`12.000\` LT.\n\n` +
      `⚠️ **Rủi ro thất bại:**\n` +
      `Nếu hết 40 phút mà chưa vượt đủ 10 ải: Đệ tử bị phạt \`-10.000\` Tu Vi, Trưởng lão \`-15.000\` Tu Vi, Tông chủ \`-20.000\` Tu Vi!\n\n` +
      `👉 *Hãy bấm nút [🚪 VÀO BÍ CẢNH] bên dưới để mở Chủ đề Bí Cảnh riêng biệt!*`,
      '🏯 KHAI MỞ BÍ CẢNH'
    );

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_enter_realm_${sect.sect_id}`)
        .setLabel('🚪 VÀO BÍ CẢNH')
        .setStyle(ButtonStyle.Success)
    );

    const sentMsg = await message.reply({ embeds: [embed], components: [row] });

    const collector = sentMsg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      componentType: ComponentType.Button,
      time: 60000,
      max: 1
    });

    collector.on('collect', async i => {
      try {
        let thread;
        if ('threads' in message.channel && typeof (message.channel as any).threads?.create === 'function') {
          thread = await (message.channel as any).threads.create({
            name: ` bí-cảnh-${sect.sect_name}`,
            autoArchiveDuration: 60,
            type: ChannelType.PrivateThread,
            reason: `Bí cảnh tông môn ${sect.sect_name}`
          }).catch(async () => {
            return await (message.channel as any).threads.create({
              name: ` bí-cảnh-${sect.sect_name}`,
              autoArchiveDuration: 60,
              type: ChannelType.PublicThread
            });
          });
        }

        const threadId = thread ? thread.id : message.channel.id;
        const session = db.createSectRealmSession(sect.sect_id, guild.id, threadId);

        await i.update({
          content: `🎉 Bí cảnh của tông môn **${sect.sect_name}** đã chính thức khai mở tại <#${threadId}>! Đệ tử tông môn hãy cùng bước vào chinh phục 10 ải!`,
          embeds: [],
          components: []
        });

        // Bắt đầu ải 1 trong thread
        if (thread) {
          await startStageCombat(client, thread, session, sect);
        }
      } catch (err: any) {
        console.error('[BI CANH CREATE ERROR]', err);
        await i.reply({ content: `⛔ Không thể tạo thread Bí cảnh: ${err.message}`, ephemeral: true }).catch(() => null);
      }
    });

    return true;
  }

  // 2. Mmobicanh <tên tông môn> (Owner, Quản lý & Staff mở bí cảnh ngoài lịch)
  if (cmd === 'mobicanh' || cmd === 'adminbicanh') {
    if (!isOwner(userId) && !isQuanLy(userId) && !isStaff(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'STAFF');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const query = args.join(' ').trim();
    if (!query) {
      await message.reply({ content: '⚠️ Cú pháp: `Mmobicanh <tên tông môn>`\nVí dụ: `Mmobicanh Vân Mộng Tông`' });
      return true;
    }

    const sect = db.getSect(query);
    if (!sect) {
      await message.reply({ content: `⛔ Không tìm thấy tông môn **${query}**!` });
      return true;
    }

    const activeSession = db.getActiveSectRealmSession(sect.sect_id);
    if (activeSession && Date.now() < activeSession.deadline) {
      await message.reply({ content: `⚠️ Tông môn **${sect.sect_name}** hiện đã có phiên bí cảnh đang diễn ra tại <#${activeSession.thread_id}>!` });
      return true;
    }

    let thread;
    if ('threads' in message.channel && typeof (message.channel as any).threads?.create === 'function') {
      thread = await (message.channel as any).threads.create({
        name: ` bí-cảnh-${sect.sect_name}`,
        autoArchiveDuration: 60,
        type: ChannelType.PublicThread
      }).catch(() => null);
    }

    const threadId = thread ? thread.id : message.channel.id;
    const session = db.createSectRealmSession(sect.sect_id, guild.id, threadId);

    const embed = createManyCurielEmbed(
      client,
      `⚡ **QUẢN TRỊ VIÊN ĐÃ MỞ BÍ CẢNH NGOÀI LỊCH CHO TÔNG MÔN!** ⚡\n\n` +
      `• **Tông môn:** **${sect.sect_name}**\n` +
      `• **Người thực thi:** <@${userId}>\n` +
      `• **Địa điểm quyết đấu:** <#${threadId}>\n` +
      `• **Thời hạn:** 40 phút (10 Ải)\n\n` +
      `👉 Đệ tử tông môn hãy vào ngay <#${threadId}> để xuất trận!`,
      'MỞ BÍ CẢNH ĐẶC BIỆT'
    );
    await message.reply({ embeds: [embed] });

    if (thread) {
      await startStageCombat(client, thread, session, sect);
    }

    return true;
  }

  // 3. Đòn đánh trong thread Bí Cảnh: Mdt & Mskill
  const inThreadSession = db.getSectRealmSessionByThread(message.channel.id);
  if (inThreadSession && (cmd === 'dt' || cmd === 'danhthuong' || cmd === 'skill' || cmd === 'tuyetchieu')) {
    const isSkill = cmd === 'skill' || cmd === 'tuyetchieu';
    const sect = db.getSect(inThreadSession.sect_id);
    if (!sect) return false;

    // Chỉ thành viên tông môn mới được đánh
    const isMember = sect.leader_id === userId || (sect.elders || []).includes(userId) || (sect.members || []).includes(userId);
    if (!isMember) {
      await message.reply({ content: '⛔ Bạn không phải là thành viên của tông môn này nên không thể tham gia chiến đấu Bí Cảnh!' }).catch(() => null);
      return true;
    }

    const user = db.getOrCreateUser(guild.id, userId, message.author.username);

    // Kiểm tra HP người chơi
    if ((user.current_hp || 15000) <= 0) {
      await message.reply({ content: '💔 Bạn đã hết HP và không thể tiếp tục tham gia trận chiến Bí Cảnh này!' }).catch(() => null);
      return true;
    }

    // Kiểm tra người chơi có bị đánh dấu defeated không
    if (inThreadSession.participants[userId]?.defeated) {
      await message.reply({ content: '💔 Bạn đã bị hạ gục trong phiên Bí Cảnh này và không thể tiếp tục chiến đấu!' }).catch(() => null);
      return true;
    }

    let dmg = calculateBossDamage(user, isSkill) + (inThreadSession.player_buff_damage || 0);

    inThreadSession.current_boss_hp = Math.max(0, inThreadSession.current_boss_hp - dmg);
    if (!inThreadSession.participants[userId]) {
      inThreadSession.participants[userId] = {
        user_id: userId,
        username: message.author.username,
        damage_dealt: 0,
        hp: user.current_hp || 15000,
        max_hp: user.max_hp || 15000,
        defeated: false
      };
    }
    inThreadSession.participants[userId].damage_dealt += dmg;

    // Phản đòn của Boss Bí Cảnh
    const currentBossDef = inThreadSession.selected_bosses[inThreadSession.current_stage - 1];
    const bossCounterDmg = (currentBossDef?.damage || 200) + (inThreadSession.boss_buff_damage || 0);

    user.current_hp = Math.max(0, (user.current_hp || 15000) - bossCounterDmg);
    inThreadSession.participants[userId].hp = user.current_hp;
    db.updateUser(guild.id, userId, { current_hp: user.current_hp });

    if (user.current_hp <= 0) {
      inThreadSession.participants[userId].defeated = true;
    }

    db.save();

    const aliveCount = Object.values(inThreadSession.participants).filter(p => !p.defeated && p.hp > 0).length;

    if (inThreadSession.current_boss_hp <= 0) {
      // Ải đã hoàn thành!
      const currentBossName = currentBossDef?.name || 'Thủ Hộ Giả';
      const clearEmbed = createManyCurielEmbed(
        client,
        `🎉 **CHÚC MỪNG TÔNG MÔN ĐÃ TRẢM THỦ THÀNH CÔNG ẢI ${inThreadSession.current_stage}!** 🎉\n\n` +
        `• **Boss:** **${currentBossName}** đã bị tiêu diệt!\n` +
        `• **Người kết liễu:** <@${userId}>\n` +
        `• **Tiến độ bí cảnh:** \`Ải ${inThreadSession.current_stage} / 10\`\n\n` +
        `👉 *Hãy bấm nút [⚔️ SANG ẢI TIẾP THEO] bên dưới để mở ải tiếp theo!*`,
        `VƯỢT ẢI ${inThreadSession.current_stage} THÀNH CÔNG`
      );

      const nextRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`btn_next_stage_${inThreadSession.session_id}`)
          .setLabel(`⚔️ SANG ẢI ${inThreadSession.current_stage < 10 ? inThreadSession.current_stage + 1 : 'HOÀN THÀNH'}`)
          .setStyle(ButtonStyle.Success)
      );

      const winMsg = await message.reply({ embeds: [clearEmbed], components: [nextRow] });

      const nextCollector = winMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 180000
      });

      nextCollector.on('collect', async btn => {
        const nextRes = db.advanceSectRealmStage(inThreadSession.session_id);
        if (nextRes.finished) {
          // Hoàn thành cả 10 Ải!
          await handleSectRealmCompleted(client, message.channel, inThreadSession, sect);
        } else {
          // Bắt đầu ải tiếp theo kèm kích hoạt sự kiện ngẫu nhiên 30%
          await btn.update({ components: [] });
          await triggerRandomEventIfNeeded(client, message.channel, inThreadSession, sect);
          await startStageCombat(client, message.channel, inThreadSession, sect);
        }
      });

      return true;
    }

    const hitEmbed = createManyCurielEmbed(
      client,
      `⚔️ <@${userId}> xuất chiêu **${isSkill ? 'Tuyệt Chiêu' : 'Đánh Thường'}** trừ **-${dmg} HP** lên **${currentBossDef?.name}**!\n` +
      `• Máu Boss còn lại: \`${inThreadSession.current_boss_hp.toLocaleString()} / ${inThreadSession.current_boss_max_hp.toLocaleString()} HP\`\n\n` +
      `💢 **Boss phản công:** Trừ **-${bossCounterDmg} HP** lên <@${userId}>! (Máu còn: \`${user.current_hp} / ${user.max_hp} HP\`)\n` +
      `👥 **Số tu sĩ còn khả năng chiến đấu:** \`${aliveCount}\` người` +
      (user.current_hp <= 0 ? `\n💔 <@${userId}> đã hết HP và bị hạ gục!` : ''),
      `GIAO TRANH ẢI ${inThreadSession.current_stage}`
    );

    await message.reply({ embeds: [hitEmbed] });
    return true;
  }

  return false;
}

/**
 * Hiển thị thông tin Boss của Ải và giao diện nút chiến đấu
 */
async function startStageCombat(client: Client, channel: any, session: any, sect: any) {
  const currentBoss = session.selected_bosses[session.current_stage - 1];
  const embed = createManyCurielEmbed(
    client,
    `👹 **ẢI ${session.current_stage}/10: THỦ HỘ THƯỢNG CỔ XUẤT HIỆN!**\n\n` +
    `• **Thủ Hộ Boss:** **${currentBoss.name}**\n` +
    `• **Sinh mệnh (HP):** \`${session.current_boss_hp.toLocaleString()} / ${session.current_boss_max_hp.toLocaleString()} HP\`\n` +
    `• **Sát thương phản đòn:** \`${currentBoss.damage + (session.boss_buff_damage || 0)} HP/lượt\`\n` +
    `• **Thời gian phiên còn lại:** \`${Math.max(0, Math.ceil((session.deadline - Date.now()) / 60000))} phút\`\n\n` +
    `👉 *Sử dụng lệnh \`Mdt\` (Đánh Thường) hoặc \`Mskill\` (Tuyệt Chiêu) để tấn công!*`,
    `ẢI ${session.current_stage} — ${currentBoss.name.toUpperCase()}`
  );

  await channel.send({ embeds: [embed] }).catch(() => null);
}

/**
 * Kích hoạt sự kiện ngẫu nhiên trong Bí Cảnh (tỷ lệ 30%)
 */
async function triggerRandomEventIfNeeded(client: Client, channel: any, session: any, sect: any) {
  if (Math.random() > 0.3) return; // 30% tỷ lệ

  const events = ['RAIN_LT', 'THIEN_KIEP', 'TIEN_NHAN'];
  const chosen = events[Math.floor(Math.random() * events.length)];

  if (chosen === 'RAIN_LT') {
    // Sự kiện A: Mưa Linh Không Thạch
    const rainEmbed = createManyCurielEmbed(
      client,
      `☄️ **MƯA LINH KHÔNG THẠCH!** ☄️\n\n` +
      `Linh Thạch từ thượng giới rơi xuống bí cảnh! Chỉ **10 người may mắn** nhanh tay bấm nút nhận thưởng:\n` +
      `• Thưởng: Từ **100.000 đến 500.000 Linh Thạch**\n` +
      `• Thêm: **+10.000 Tu Vi**\n\n` +
      `👉 *Bấm nút [💎 HỨNG LINH THẠCH] bên dưới ngay!*`,
      '☄️ MƯA LINH KHÔNG THẠCH'
    );

    const rainRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`btn_event_rain_${Date.now()}`).setLabel('💎 HỨNG LINH THẠCH').setStyle(ButtonStyle.Primary)
    );

    const rainMsg = await channel.send({ embeds: [rainEmbed], components: [rainRow] }).catch(() => null);
    if (!rainMsg) return;

    const claimedUsers = new Set<string>();
    const rainCollector = rainMsg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 45000
    });

    rainCollector.on('collect', async (i: any) => {
      if (claimedUsers.has(i.user.id)) {
        await i.reply({ content: '⚠️ Đạo hữu đã hứng Linh Thạch trong sự kiện này rồi!', ephemeral: true });
        return;
      }
      if (claimedUsers.size >= 10) {
        await i.reply({ content: '⛔ Mưa Linh Không Thạch đã hết lượt!', ephemeral: true });
        return;
      }

      claimedUsers.add(i.user.id);
      const rewardLT = Math.floor(Math.random() * 400001) + 100000; // 100k - 500k
      const rewardTuVi = 10000;

      const user = db.getOrCreateUser(sect.guild_id, i.user.id, i.user.username);
      user.tinh_khong_thach += rewardLT;
      user.tu_vi += rewardTuVi;
      db.updateUser(sect.guild_id, i.user.id, { tinh_khong_thach: user.tinh_khong_thach, tu_vi: user.tu_vi });
      db.save();

      await i.reply({
        content: `🎉 Chúc mừng <@${i.user.id}> đã hứng được **+${rewardLT.toLocaleString()} Linh Thạch** và **+${rewardTuVi.toLocaleString()} Tu Vi**!`,
        ephemeral: false
      });

      if (claimedUsers.size >= 10) {
        rainRow.components[0].setDisabled(true);
        await rainMsg.edit({ components: [rainRow] }).catch(() => null);
      }
    });
  } else if (chosen === 'THIEN_KIEP') {
    // Sự kiện B: Thiên Kiếp
    const dmg = Math.floor(Math.random() * 3001) + 2000; // 2.000 - 5.000 HP
    const isHitPlayers = Math.random() < 0.4; // 40% đánh người chơi

    if (isHitPlayers) {
      const aliveParticipants = Object.values(session.participants).filter((p: any) => !p.defeated && p.hp > 0);
      const targetPlayers = aliveParticipants.slice(0, 5);

      for (const p of targetPlayers as any[]) {
        const u = db.getOrCreateUser(sect.guild_id, p.user_id);
        u.current_hp = Math.max(0, (u.current_hp || 15000) - dmg);
        p.hp = u.current_hp;
        if (u.current_hp <= 0) p.defeated = true;
        db.updateUser(sect.guild_id, p.user_id, { current_hp: u.current_hp });
      }
      db.save();

      const embed = createManyCurielEmbed(
        client,
        `⚡ **THIÊN KIẾP GIÁNG LÂM — ĐÁNH NHẦM ĐỒNG MINH!** ⚡\n\n` +
        `Thiên lôi giáng thế chệch hướng, giáng trúng **${targetPlayers.length} tu sĩ** trong bí cảnh!\n` +
        `• Sát thương mỗi người nhận: \`-${dmg.toLocaleString()} HP\`\n` +
        `• Danh sách người trúng đòn: ${targetPlayers.map((p: any) => `<@${p.user_id}> (${p.hp} HP)`).join(', ')}`,
        'THIÊN KIẾP GIÁNG LÂM'
      );
      await channel.send({ embeds: [embed] }).catch(() => null);
    } else {
      session.current_boss_hp = Math.max(0, session.current_boss_hp - dmg);
      db.save();

      const embed = createManyCurielEmbed(
        client,
        `⚡ **THIÊN KIẾP GIÁNG LÂM — OANH TẠCH THỦ HỘ!** ⚡\n\n` +
        `Một tia thiên lôi bổ thẳng vào đầu Boss bí cảnh, gây **-${dmg.toLocaleString()} HP**!\n` +
        `• Sinh mệnh Boss còn lại: \`${session.current_boss_hp.toLocaleString()} HP\``,
        'THIÊN KIẾP TRỪ BOSS'
      );
      await channel.send({ embeds: [embed] }).catch(() => null);
    }
  } else if (chosen === 'TIEN_NHAN') {
    // Sự kiện C: Tiên Nhân Giáng Thế
    const isBuffBoss = Math.random() < 0.3; // 30% buff boss

    if (isBuffBoss) {
      session.boss_buff_damage = 200;
      db.save();

      const embed = createManyCurielEmbed(
        client,
        `✨ **TIÊN NHÂN GIÁNG THẾ — QUÁI VẬT HÓA CUỒNG!** ✨\n\n` +
        `Hào quang tiên nhân lầm tưởng thủ hộ thú là hộ vệ, ban cho **+200 Sát thương** trong ải này!`,
        'TIÊN NHÂN GIÁNG THẾ'
      );
      await channel.send({ embeds: [embed] }).catch(() => null);
    } else {
      session.player_buff_damage = 200;
      db.save();

      const embed = createManyCurielEmbed(
        client,
        `✨ **TIÊN NHÂN GIÁNG THẾ — CHÚC PHÚC ĐẠO HỮU!** ✨\n\n` +
        `Tiên nhân mỉm cười gia trì tiên lực cho toàn bộ tu sĩ tham chiến, tăng **+200 Sát thương** trong ải này!`,
        'TIÊN NHÂN GIÁNG THẾ'
      );
      await channel.send({ embeds: [embed] }).catch(() => null);
    }
  }
}

/**
 * Xử lý khi hoàn thành đủ 10 ải
 */
async function handleSectRealmCompleted(client: Client, channel: any, session: any, sect: any) {
  session.is_finished = true;
  session.is_won = true;
  session.rewards_processed = true;
  db.save();

  // Trao thưởng hoàn thành bí cảnh
  // Tông chủ: 15.000 LT (nếu top 1: 20.000 LT + 6 Mảnh Ký Ức)
  // Trưởng lão: 12.000 LT (nếu top 1: 15.000 LT + 4 Mảnh Ký Ức)
  // Đệ tử: 10.000 LT (nếu top 1: 10.000 LT + 3 Mảnh Ký Ức)
  const leader = db.getOrCreateUser(sect.guild_id, sect.leader_id);
  leader.tinh_khong_thach += 20000;
  leader.manh_ky_uc += 6;

  for (const elderId of (sect.elders || [])) {
    const elder = db.getOrCreateUser(sect.guild_id, elderId);
    elder.tinh_khong_thach += 15000;
    elder.manh_ky_uc += 4;
  }

  for (const dId of (sect.members || [])) {
    const disciple = db.getOrCreateUser(sect.guild_id, dId);
    disciple.tinh_khong_thach += 10000;
    disciple.manh_ky_uc += 3;
  }

  db.save();

  const embed = createManyCurielEmbed(
    client,
    `🏆 **CHÚC MỪNG TÔNG MÔN ${sect.sect_name.toUpperCase()} ĐÃ CHINH PHỤC TOÀN BỘ 10 ẢI BÍ CẢNH!** 🏆\n\n` +
    `• **Thành tích:** Hoàn thành xuất sắc 10/10 ải thử thách!\n` +
    `• **Phần thưởng trao tặng:**\n` +
    `  - Tông Chủ: \`+20.000\` Linh Thạch | \`+6\` Mảnh Ký Ức\n` +
    `  - Mỗi Trưởng Lão: \`+15.000\` Linh Thạch | \`+4\` Mảnh Ký Ức\n` +
    `  - Mỗi Đệ Tử: \`+10.000\` Linh Thạch | \`+3\` Mảnh Ký Ức\n\n` +
    `*Chủ đề này sẽ được dọn dẹp sau khi lưu kết quả an toàn.*`,
    'HOÀN THÀNH BÍ CẢNH'
  );

  await channel.send({ embeds: [embed] }).catch(() => null);

  // Dọn dẹp thread sau 1 phút
  setTimeout(async () => {
    try {
      if (channel.isThread()) {
        await channel.delete('Hoàn thành Bí Cảnh').catch(() => null);
      }
    } catch {
      // ignore
    }
  }, 60000);
}
