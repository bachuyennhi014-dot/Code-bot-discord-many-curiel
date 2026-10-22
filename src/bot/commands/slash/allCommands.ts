import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  ChannelType, 
  Client,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags
} from 'discord.js';
import { db } from '../../database/database.js';
import { createManyCurielEmbed, createErrorEmbed, createPermissionDeniedEmbed, EMOJIS } from '../../utils/embeds.js';
import { isOwner, isQuanLy, isStaff } from '../../permissions/permissions.js';
import { 
  REALM_ORDER, 
  STAGE_ORDER, 
  LUYEN_KHI_STAGES,
  STANDARD_STAGES,
  REALM_TU_VI_REQUIREMENT,
  getRequiredTuViForNextLevel, 
  getTuViRewardPerMtl,
  RealmName, 
  RealmStage,
  CHARACTER_NAMES,
  CHARACTER_EMOJIS,
  normalizeCharacterName,
  getCharacterBuff,
  CardTier
} from '../../types/cultivation.js';
import { 
  createShopHomePayload, 
  createCategoryPayload, 
  createProductPayload, 
  createCartPayload, 
  SHOP_PRODUCTS 
} from '../prefix/shop.js';
import { 
  buildCharProfilePayload, 
  attachCharProfileCollector 
} from '../prefix/suphu.js';

interface SlashCommandDef {
  data: any;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
}

export const allSlashCommands: SlashCommandDef[] = [
  // 1. /tuvi
  {
    data: new SlashCommandBuilder()
      .setName('tuvi')
      .setDescription('Xem bảng hồ sơ tu vi, cảnh giới, TKT, Mảnh Ký Ức, tiến độ và quyền lợi')
      .addUserOption(opt => opt.setName('user').setDescription('Tu sĩ cần xem thông tin (mặc định là bạn)').setRequired(false)),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const user = db.getOrCreateUser(guild.id, targetUser.id, targetUser.username);

      const reqTuVi = getRequiredTuViForNextLevel(user.realm, user.stage);
      const progressPercent = Math.min(100, Math.floor((user.tu_vi / reqTuVi) * 100));
      const totalBars = 10;
      const filled = Math.round((progressPercent / 100) * totalBars);
      const barStr = '█'.repeat(filled) + '░'.repeat(totalBars - filled);

      let benefits = '• Chưa mở khóa đặc quyền riêng.';
      const realmIdx = REALM_ORDER.indexOf(user.realm);
      if (realmIdx >= REALM_ORDER.indexOf('Kim Đan')) {
        benefits = '• 🔓 Được phép gia nhập Kênh Ẩn Tu Vi (/setupkenhan)\n';
      }
      if (realmIdx >= REALM_ORDER.indexOf('Hóa Thần')) {
        benefits += '• 🔓 Quyền đổi màu sắc Role cá nhân\n';
      }
      if (realmIdx >= REALM_ORDER.indexOf('Độ Kiếp')) {
        benefits += '• 👑 Danh hiệu Thái Thượng Trưởng Lão\n• ⚡ Mở khóa chiêu thức trừng phạt `Mtruanam` (Timeout 1 phút)';
      }

      const petCount = (user as any).pet_count || 1;
      const petCountSuffix = petCount > 1 ? ` (x${petCount})` : '';
      const petStr = user.pet ? `${user.pet}${user.pet.includes('x') || user.pet.includes('(') ? '' : petCountSuffix} (Cấp ${user.pet_level || 1})` : 'Không có';
      const embed = createManyCurielEmbed(
        client,
        `<:1Hachi:1558090289195782254>   **ĐẠO HIỆU:** <@${targetUser.id}> (\`${targetUser.username}\`)\n\n` +
        `<a:bluesaturn:1558696989854662736>  **Cảnh giới:** \`${user.realm}\` — **Tầng/Giai đoạn:** \`${user.stage}\`\n` +
        `<a:bling:1562103611587170435> **Tu Vi:** \`${user.tu_vi.toLocaleString()} / ${reqTuVi.toLocaleString()}\` Tu Vi (${progressPercent}%)\n` +
        `\`[${barStr}]\`\n\n` +
        ` <:yxz_star1:1558087806490910840> **Máu (HP):** \`${(user.current_hp || 15000).toLocaleString()} / ${(user.max_hp || 15000).toLocaleString()} HP\`\n` +
        `<a:blue_gem:1558697044510638144>   **Linh Thạch:** ${(user.tinh_khong_thach || 0).toLocaleString()} Linh Thạch\n` +
        `<a:emoji_71:1559201095501348944>   **Mảnh Ký Ức:** ${(user.manh_ky_uc || 0).toLocaleString()} mảnh\n` +
        `<a:sao:1562103382980690051>  **Điểm Cống Hiến:** ${(user.diem_cong_hien || 0).toLocaleString()} điểm\n` +
        `<a:z_paw:1556291363429945394>  **Linh thú sở hữu:** ${petStr}\n` +
        `<a:angelBlob3:1555974609747050678>  **Chiến tích quái thú:** \`${user.total_battles || 0}\` trận (\`${user.wins || 0}\` Thắng / \`${user.losses || 0}\` Thua)`,
        'BẢNG HỒ SƠ TU TIÊN'
      );
      embed.setThumbnail(targetUser.displayAvatarURL());
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 2. /diemdanh
  {
    data: new SlashCommandBuilder()
      .setName('diemdanh')
      .setDescription('Điểm danh hàng ngày nhận Tinh Không Thạch, Tu Vi và Điểm Cống Hiến mỗi 24h'),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      const userId = interaction.user.id;
      const user = db.getOrCreateUser(guild.id, userId, interaction.user.username);
      const now = Date.now();
      const COOLDOWN_MS = 24 * 60 * 60 * 1000;

      if (user.daily_last) {
        const lastTime = new Date(user.daily_last).getTime();
        const diff = now - lastTime;
        if (diff < COOLDOWN_MS) {
          const remainingMs = COOLDOWN_MS - diff;
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

          const embed = createManyCurielEmbed(
            client,
            `⏳ <@${userId}>, hôm nay đạo hữu đã điểm danh rồi!\n\n` +
            `Vui lòng chờ thêm **${hours} giờ ${mins} phút** để tiếp tục nhận linh thạch.`,
            'ĐIỂM DANH HÀNG NGÀY'
          );
          await interaction.reply({ embeds: [embed] });
          return;
        }
      }

      const rewardTKT = Math.floor(Math.random() * 1000) + 1000;
      const rewardTuVi = 250;
      const rewardDCH = 50;

      user.daily_streak += 1;
      user.daily_last = new Date().toISOString();
      user.tinh_khong_thach += rewardTKT;
      user.tu_vi += rewardTuVi;
      user.diem_cong_hien += rewardDCH;

      db.updateUser(guild.id, userId, {
        daily_last: user.daily_last,
        daily_streak: user.daily_streak,
        tinh_khong_thach: user.tinh_khong_thach,
        tu_vi: user.tu_vi,
        diem_cong_hien: user.diem_cong_hien
      });

      const embed = createManyCurielEmbed(
        client,
        `🌸 **ĐIỂM DANH THÀNH CÔNG (Chuỗi: ${user.daily_streak} ngày)**\n\n` +
        `💎 **Tinh Không Thạch:** \`+${rewardTKT.toLocaleString()}\` TKT\n` +
        `🌀 **Tu Vi:** \`+${rewardTuVi}\` EXP\n` +
        `🏆 **Điểm Cống Hiến:** \`+${rewardDCH}\` điểm\n\n` +
        `💰 **Tổng TKT hiện có:** \`${user.tinh_khong_thach.toLocaleString()}\``,
        'THU HOẠCH LINH NGUYÊN'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 3. /cauhoi
  {
    data: new SlashCommandBuilder()
      .setName('cauhoi')
      .setDescription('Vấn đáp tu chân nhận Tinh Không Thạch hoặc Mảnh Ký Ức'),
    async execute(interaction, client) {
      const questions = [
        {
          q: 'Trong quá trình tu luyện, linh căn nào được coi là kỳ tài ngút trời hiếm thấy nhất?',
          opts: ['Tạp Linh Căn', 'Thiên Linh Căn (Đơn Linh Căn)', 'Tứ Linh Căn', 'Vô Linh Căn'],
          correct: 1,
          hard: false,
          amount: 1500
        },
        {
          q: 'Khi tu sĩ ngưng tụ Kim Đan thành công, tuổi thọ bình thường có thể đạt tới bao nhiêu năm?',
          opts: ['100 năm', '200 năm', '500 năm', '1000 năm'],
          correct: 2,
          hard: false,
          amount: 2000
        },
        {
          q: 'Trận pháp Thái Cổ Hỗn Độn Tinh Thần Đồ yêu cầu cần có bao nhiêu khối Tinh Thạch để kích hoạt tâm trận?',
          opts: ['36 khối', '72 khối', '108 khối', '360 khối'],
          correct: 2,
          hard: true,
          amount: 2
        }
      ];

      const item = questions[Math.floor(Math.random() * questions.length)];
      const row = new ActionRowBuilder<ButtonBuilder>();
      item.opts.forEach((opt, idx) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`slash_q_${idx}`)
            .setLabel(`${String.fromCharCode(65 + idx)}. ${opt.substring(0, 30)}`)
            .setStyle(ButtonStyle.Primary)
        );
      });

      const promptEmbed = createManyCurielEmbed(
        client,
        `📜 **Vấn Đáp Tu Chân (${item.hard ? 'Khó - Thưởng Mảnh Ký Ức' : 'Phổ Thông - Thưởng TKT'}):**\n\n` +
        `*${item.q}*\n\n` +
        item.opts.map((opt, i) => `**${String.fromCharCode(65 + i)}.** ${opt}`).join('\n') +
        `\n\n⏱️ *Đạo hữu có 30 giây để bấm chọn đáp án!*`,
        'VẤN ĐÁP ĐẠO TÂM'
      );

      const response = await interaction.reply({ embeds: [promptEmbed], components: [row], fetchReply: true });
      const collector = (response as any).createMessageComponentCollector({
        filter: (i: any) => i.user.id === interaction.user.id,
        componentType: ComponentType.Button,
        time: 30000,
        max: 1
      });

      collector.on('collect', async (i: any) => {
        const chosenIdx = parseInt(i.customId.replace('slash_q_', ''), 10);
        if (chosenIdx === item.correct) {
          if (item.hard) {
            db.addManhKyUc(interaction.guildId!, interaction.user.id, item.amount, 'Slash cauhoi');
            db.addTuVi(interaction.guildId!, interaction.user.id, 300);
          } else {
            db.addTinhKhongThach(interaction.guildId!, interaction.user.id, item.amount, 'Slash cauhoi');
            db.addTuVi(interaction.guildId!, interaction.user.id, 100);
          }

          const successEmbed = createManyCurielEmbed(
            client,
            `🎉 **CHÍNH XÁC!** Đạo tâm thông triệt!\n\n` +
            `🎁 **Phần thưởng:** ` + (item.hard ? `\`+${item.amount} Mảnh Ký Ức\`` : `\`+${item.amount.toLocaleString()} Tinh Không Thạch\``),
            'ĐÁP ÁN CHÍNH XÁC'
          );
          await i.update({ embeds: [successEmbed], components: [] });
        } else {
          const failEmbed = createManyCurielEmbed(
            client,
            `💔 **RẤT TIẾC, ĐÁP ÁN CHƯA ĐÚNG!**\n\nĐáp án chính xác là: **${String.fromCharCode(65 + item.correct)}. ${item.opts[item.correct]}**`,
            'ĐẠO TÂM CHƯA VỮNG'
          );
          await i.update({ embeds: [failEmbed], components: [] });
        }
      });
    }
  },

  // 4. /dottpha
  {
    data: new SlashCommandBuilder()
      .setName('dottpha')
      .setDescription('Đột phá cảnh giới và giai đoạn khi tích lũy đủ Tu Vi'),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      const userId = interaction.user.id;
      const user = db.getOrCreateUser(guild.id, userId, interaction.user.username);
      const reqTuVi = getRequiredTuViForNextLevel(user.realm, user.stage);

      if (user.tu_vi < reqTuVi) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ <@${userId}> chưa tích lũy đủ Tu Vi để đột phá!\n\n` +
          `• Tu Vi hiện tại: \`${user.tu_vi.toLocaleString()}\`\n` +
          `• Tu Vi cần thiết: \`${reqTuVi.toLocaleString()}\`\n` +
          `• Còn thiếu: \`${(reqTuVi - user.tu_vi).toLocaleString()}\` EXP`,
          'ĐỘT PHÁ THẤT BẠI'
        );
        await interaction.reply({ embeds: [embed] });
        return;
      }

      const curRealmIdx = REALM_ORDER.indexOf(user.realm);
      let nextRealm = user.realm;
      let nextStage: string = user.stage;

      if (user.realm === 'Phàm Nhân') {
        nextRealm = 'Luyện Khí';
        nextStage = 'Tầng 1';
      } else if (user.realm === 'Luyện Khí') {
        const stageIdx = LUYEN_KHI_STAGES.indexOf(user.stage as any);
        if (stageIdx < 8 && stageIdx >= 0) {
          nextStage = LUYEN_KHI_STAGES[stageIdx + 1];
        } else {
          nextRealm = 'Trúc Cơ';
          nextStage = 'Sơ Kỳ';
        }
      } else {
        const stageIdx = STANDARD_STAGES.indexOf(user.stage as any);
        if (stageIdx < 3 && stageIdx >= 0) {
          nextStage = STANDARD_STAGES[stageIdx + 1];
        } else {
          if (curRealmIdx < REALM_ORDER.length - 1) {
            nextRealm = REALM_ORDER[curRealmIdx + 1];
            nextStage = 'Sơ Kỳ';
          } else {
            const maxEmbed = createManyCurielEmbed(client, `👑 Đạo hữu đã đạt cảnh giới tối cao **[${user.realm} - ${user.stage}]**!`, 'ĐỈNH CAO TU TIÊN');
            await interaction.reply({ embeds: [maxEmbed] });
            return;
          }
        }
      }

      const isMajorPromotion = nextRealm !== user.realm;
      user.tu_vi -= reqTuVi;
      user.realm = nextRealm;
      user.stage = nextStage;
      user.diem_cong_hien += 100;

      db.updateUser(guild.id, userId, {
        tu_vi: user.tu_vi,
        realm: user.realm,
        stage: user.stage,
        diem_cong_hien: user.diem_cong_hien
      });

      const member = await guild.members.fetch(userId).catch(() => null);
      const guildConfig = db.getGuildConfig(guild.id);

      if (member) {
        if (guildConfig.hidden_channel_id) {
          const hiddenChan = guild.channels.cache.get(guildConfig.hidden_channel_id);
          if (hiddenChan && 'permissionOverwrites' in hiddenChan) {
            const nextRealmIdx = REALM_ORDER.indexOf(nextRealm);
            if (nextRealmIdx >= REALM_ORDER.indexOf('Kim Đan')) {
              await (hiddenChan as any).permissionOverwrites.edit(userId, {
                ViewChannel: true,
                SendMessages: true,
                Connect: true
              }).catch(() => null);
            }
          }
        }
        if (guildConfig.role_tttl_id && nextRealm === 'Độ Kiếp') {
          await member.roles.add(guildConfig.role_tttl_id).catch(() => null);
        }
      }

      const nextReward = getTuViRewardPerMtl(user.realm, user.stage);
      const nextReqTuVi = getRequiredTuViForNextLevel(user.realm, user.stage);
      const promotionTypeDesc = isMajorPromotion
        ? `🔥 **Đột Phá Đại Cảnh Giới:** Tu Vi nhận được tăng **×2** (\`+${nextReward.toLocaleString()}\` Tu Vi/lần tu luyện)!`
        : `✨ **Thăng Cấp Tiểu Cảnh Giới:** Tu Vi nhận được tăng **+1.000** (\`+${nextReward.toLocaleString()}\` Tu Vi/lần tu luyện)!`;

      const successEmbed = createManyCurielEmbed(
        client,
        `⚡ **THIÊN LÔI RUNG CHUYỂN! ĐỘT PHÁ THÀNH CÔNG!** ⚡\n\n` +
        `Chúc mừng <@${userId}> đã tiến cảnh lên: **${nextRealm} — ${nextStage}**\n\n` +
        `${promotionTypeDesc}\n` +
        `🎯 **Điều kiện cấp tiếp theo:** \`${nextReqTuVi.toLocaleString()}\` Tu Vi\n` +
        `🏆 **Điểm cống hiến:** \`+100\` điểm\n` +
        `🌀 **Tu Vi còn lại:** \`${user.tu_vi.toLocaleString()}\` EXP`,
        'CHÚC MỪNG ĐỘT PHÁ'
      );
      await interaction.reply({ embeds: [successEmbed] });
    }
  },

  // 5. /bxh
  {
    data: new SlashCommandBuilder()
      .setName('bxh')
      .setDescription('Bảng xếp hạng Điểm Cống Hiến chu kỳ 7 ngày (Top 1 nhận Role độc quyền)'),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      const allUsers = db.getAllGuildUsers(guild.id);
      if (allUsers.length === 0) {
        const embed = createManyCurielEmbed(client, '📋 Hiện tại chưa có đạo hữu nào trong bảng xếp hạng cống hiến.', 'BẢNG XẾP HẠNG');
        await interaction.reply({ embeds: [embed] });
        return;
      }

      const sorted = [...allUsers].sort((a, b) => (b.diem_cong_hien || 0) - (a.diem_cong_hien || 0));
      const top10 = sorted.slice(0, 10);
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

      const lines = top10.map((u, i) => {
        return `${medals[i]} **${u.username || 'Tu Sĩ'}** (<@${u.user_id}>)\n` +
          `   └ 🎋 \`${u.realm} ${u.stage}\` | 🏆 \`${(u.diem_cong_hien || 0).toLocaleString()}\` Điểm Cống Hiến`;
      }).join('\n\n');

      const guildConfig = db.getGuildConfig(guild.id);
      const top1RoleStr = guildConfig.role_top1_id ? `<@&${guildConfig.role_top1_id}>` : '*Chưa thiết lập /setuprolet1*';

      const embed = createManyCurielEmbed(
        client,
        `👑 **Phần thưởng Top 1 Tuần (Chu kỳ 7 ngày):** ${top1RoleStr}\n\n` + lines,
        'BẢNG XẾP HẠNG ĐIỂM CỐNG HIẾN'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 6. /status
  {
    data: new SlashCommandBuilder()
      .setName('status')
      .setDescription('Kiểm tra trạng thái hoạt động 24/7 của Many Curiel, Ping, RAM và Database'),
    async execute(interaction, client) {
      const uptimeSec = Math.floor(process.uptime());
      const days = Math.floor(uptimeSec / 86400);
      const hours = Math.floor((uptimeSec % 86400) / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = uptimeSec % 60;
      const uptimeStr = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const mem = process.memoryUsage();
      const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
      const rssMB = (mem.rss / 1024 / 1024).toFixed(1);

      const dbUsersCount = Object.keys(db.getRawData().users).length;
      const dbStaffCount = Object.keys(db.getRawData().staff).length;

      const embed = createManyCurielEmbed(
        client,
        `⚡ **TRẠNG THÁI HOẠT ĐỘNG 24/7 (MANY CURIEL)**\n\n` +
        `🟢 **Tình trạng:** \`Online 24/7 (PM2 Process: discord-bot)\`\n` +
        `⏳ **Thời gian hoạt động (Uptime):** \`${uptimeStr}\`\n` +
        `🏓 **Độ trễ Gateway (Ping):** \`${client.ws.ping}ms\`\n` +
        `💾 **Bộ nhớ RAM:** \`${heapUsedMB} MB (Heap) / ${rssMB} MB (RSS)\`\n` +
        `📁 **Cơ sở dữ liệu:** \`Persistent Storage OK (data/database.json)\`\n` +
        `👥 **Dữ liệu hệ thống:** \`${dbUsersCount} Tu Sĩ | ${dbStaffCount} Staff\`\n` +
        `🌐 **Máy chủ phục vụ:** \`${client.guilds.cache.size} Servers\``,
        'HỆ THỐNG GIÁM SÁT 24/7'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 7. /truanam
  {
    data: new SlashCommandBuilder()
      .setName('truanam')
      .setDescription('Thần thông Độ Kiếp: Discord Timeout thật 1 phút cho tu sĩ cảnh giới thấp hơn')
      .addUserOption(opt => opt.setName('user').setDescription('Tu sĩ cần trấn áp').setRequired(true)),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      const userId = interaction.user.id;
      const targetUser = interaction.options.getUser('user', true);
      const authorProfile = db.getOrCreateUser(guild.id, userId, interaction.user.username);

      if (authorProfile.realm !== 'Độ Kiếp' && !isOwner(userId)) {
        const embed = createManyCurielEmbed(client, `⛔ Chỉ tu sĩ đạt cảnh giới **[Độ Kiếp]** mới có thể thi triển thần thông \`/truanam\`!`, 'KHÔNG ĐỦ CẢNH GIỚI');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      if (isOwner(targetUser.id)) {
        const embed = createManyCurielEmbed(client, '⛔ Không thể thi triển thần thông lên người này!', 'PHẢN PHỆ THẦN THÔNG');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const targetProfile = db.getOrCreateUser(guild.id, targetUser.id, targetUser.username);
      const authorRealmIdx = REALM_ORDER.indexOf(authorProfile.realm);
      const targetRealmIdx = REALM_ORDER.indexOf(targetProfile.realm);

      if (targetRealmIdx >= authorRealmIdx && !isOwner(userId)) {
        const embed = createManyCurielEmbed(client, `⛔ Không thể thi triển thần thông lên người có cảnh giới tương đương hoặc cao hơn!`, 'CẢNH GIỚI KHÔNG HỢP LỆ');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      if (authorProfile.trua_nam_date !== today) {
        authorProfile.trua_nam_date = today;
        authorProfile.trua_nam_count = 0;
      }

      if (authorProfile.trua_nam_count >= 3 && !isOwner(userId)) {
        const embed = createManyCurielEmbed(client, `⛔ Đạo hữu đã sử dụng hết **3 lượt** hôm nay. Vui lòng đợi ngày mai!`, 'HẾT LƯỢT HÀNG NGÀY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
      if (!targetMember || !targetMember.moderatable) {
        const embed = createManyCurielEmbed(client, '❌ Bot không có đủ quyền hạn Moderate Members hoặc Role của đối phương cao hơn Bot.', 'THẤT BẠI');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      await targetMember.timeout(60000, `Thần thông truanam thi triển bởi ${interaction.user.tag}`);
      authorProfile.trua_nam_count += 1;
      db.updateUser(guild.id, userId, {
        trua_nam_date: authorProfile.trua_nam_date,
        trua_nam_count: authorProfile.trua_nam_count
      });

      const embed = createManyCurielEmbed(
        client,
        `⚡ **ĐẠI NĂNG ĐỘ KIẾP GIÁNG LÂM!**\n\n` +
        `<@${userId}> đã thi triển thần thông trấn áp <@${targetUser.id}>!\n` +
        `⏱️ **Thời gian Timeout Discord:** \`1 phút\` (Còn ${3 - authorProfile.trua_nam_count}/3 lượt hôm nay)`,
        'TRẤN ÁP THÀNH CÔNG'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 8. /phatqua
  {
    data: new SlashCommandBuilder()
      .setName('phatqua')
      .setDescription('Staff & Quản Lý phát Tinh Không Thạch cho người chơi')
      .addUserOption(opt => opt.setName('user').setDescription('Người nhận quà').setRequired(true))
      .addIntegerOption(opt => opt.setName('amount').setDescription('Số lượng TKT').setMinValue(1).setRequired(true)),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      const userId = interaction.user.id;

      if (!isStaff(userId) && !isQuanLy(userId) && !isOwner(userId)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'STAFF');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      if (!isOwner(userId) && !isQuanLy(userId)) {
        const usedToday = db.getStaffGiftCountToday(userId);
        if (usedToday >= 3) {
          const embed = createManyCurielEmbed(client, '⛔ Bạn đã sử dụng hết **3 lượt phát quà** trong hôm nay.', 'HẾT LƯỢT PHÁT QUÀ');
          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
          return;
        }
        db.incrementStaffGift(userId);
      }

      const targetUser = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      const updated = db.addTinhKhongThach(guild.id, targetUser.id, amount, `Slash phatqua bởi ${interaction.user.tag}`);

      const embed = createManyCurielEmbed(
        client,
        `🎁 **Ban Quản Trị** đã phát tặng **${amount.toLocaleString()} Tinh Không Thạch** cho <@${targetUser.id}>!\n\n` +
        `💎 **Số dư mới của người nhận:** \`${updated.tinh_khong_thach.toLocaleString()}\` TKT`,
        'PHÁT QUÀ THÀNH CÔNG'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 9. /addstaff
  {
    data: new SlashCommandBuilder()
      .setName('addstaff')
      .setDescription('Thêm một thành viên vào danh sách Staff lưu vào Database (Quản Lý)')
      .addUserOption(opt => opt.setName('user').setDescription('Thành viên bổ nhiệm Staff').setRequired(true)),
    async execute(interaction, client) {
      if (!isQuanLy(interaction.user.id) && !isOwner(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }
      const targetUser = interaction.options.getUser('user', true);
      db.addStaff(targetUser.id, interaction.user.id, targetUser.username);

      const embed = createManyCurielEmbed(
        client,
        `🛡️ Đã cấp quyền **Staff** cho <@${targetUser.id}> (\`${targetUser.username}\`) và lưu trữ vào Database!`,
        'BỔ NHIỆM STAFF'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 10. /cam
  {
    data: new SlashCommandBuilder()
      .setName('cam')
      .setDescription('Cấm một người chơi sử dụng Bot trong khoảng thời gian chỉ định (Staff & Quản Lý)')
      .addUserOption(opt => opt.setName('user').setDescription('Người chơi bị cấm').setRequired(true))
      .addStringOption(opt => opt.setName('time').setDescription('Thời gian cấm (Ví dụ: 30S, 10P, 2H)').setRequired(true)),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!isStaff(interaction.user.id) && !isQuanLy(interaction.user.id) && !isOwner(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'STAFF');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const targetUser = interaction.options.getUser('user', true);
      const timeStr = interaction.options.getString('time', true).toUpperCase();

      let durationMs = 10 * 60 * 1000;
      if (timeStr.endsWith('S')) durationMs = parseInt(timeStr, 10) * 1000;
      else if (timeStr.endsWith('P') || timeStr.endsWith('M')) durationMs = parseInt(timeStr, 10) * 60 * 1000;
      else if (timeStr.endsWith('H')) durationMs = parseInt(timeStr, 10) * 3600 * 1000;

      db.banBotUser(targetUser.id, guild.id, durationMs, 'Vi phạm quy định bot', interaction.user.id);
      const embed = createManyCurielEmbed(
        client,
        `🚫 Đã cấm <@${targetUser.id}> sử dụng Bot trong **${timeStr}**.\n*Người bị cấm vẫn dùng Discord bình thường nhưng không thể tương tác bot.*`,
        'ĐÃ CẤM DÙNG BOT'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 11. /bocam
  {
    data: new SlashCommandBuilder()
      .setName('bocam')
      .setDescription('Gỡ lệnh cấm sử dụng Bot cho một người chơi (Staff & Quản Lý)')
      .addUserOption(opt => opt.setName('user').setDescription('Người chơi cần gỡ cấm').setRequired(true)),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!isStaff(interaction.user.id) && !isQuanLy(interaction.user.id) && !isOwner(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'STAFF');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }
      const targetUser = interaction.options.getUser('user', true);
      const unbanned = db.unbanBotUser(targetUser.id, guild.id);
      db.resetViolation(guild.id, targetUser.id);

      const embed = createManyCurielEmbed(
        client,
        unbanned ? `✅ Đã gỡ lệnh cấm dùng Bot cho <@${targetUser.id}>.` : `ℹ️ <@${targetUser.id}> hiện không có trong danh sách bị cấm dùng bot.`,
        'BỎ CẤM SỬ DỤNG BOT'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 15. /setupkenhchoi
  {
    data: new SlashCommandBuilder()
      .setName('setupkenhchoi')
      .setDescription('Thiết lập kênh chính thức để chơi Bot Many Curiel')
      .addChannelOption(opt => opt.setName('kenh').setDescription('Kênh văn bản dùng để chơi bot').addChannelTypes(ChannelType.GuildText).setRequired(true)),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }
      const channel = interaction.options.getChannel('kenh', true);
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
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 16. /setuprolet1
  {
    data: new SlashCommandBuilder()
      .setName('setuprolet1')
      .setDescription('Thiết lập Role vinh danh Top 1 BXH Điểm Cống Hiến (Chu kỳ 7 ngày)')
      .addRoleOption(opt => opt.setName('role').setDescription('Role trao thưởng cho Top 1').setRequired(true)),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }
      const role = interaction.options.getRole('role', true);
      db.updateGuildConfig(guild.id, { 
        role_top1_id: role.id,
        season_end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

      const embed = createManyCurielEmbed(
        client,
        `👑 **Đã thiết lập Role Top 1 BXH:** <@&${role.id}>\n\n• Slot: **Duy nhất 1 người**\n• Chu kỳ: **7 ngày** (Tự động chuyển giao)`,
        'THIẾT LẬP ROLE TOP 1'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 17. /setupkenhan
  {
    data: new SlashCommandBuilder()
      .setName('setupkenhan')
      .setDescription('Thiết lập Kênh Ẩn dành riêng cho tu sĩ đạt Kim Đan trở lên')
      .addChannelOption(opt => opt.setName('kenh').setDescription('Kênh văn bản / Voice ẩn').addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice).setRequired(true)),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }
      const channel = interaction.options.getChannel('kenh', true);
      db.updateGuildConfig(guild.id, { hidden_channel_id: channel.id });

      const embed = createManyCurielEmbed(
        client,
        `🔮 **Đã thiết lập Kênh Ẩn Tu Tiên:** <#${channel.id}>\n\n` +
        `• **Điều kiện:** Đạt cảnh giới **[Kim Đan]** trở lên.\n• Tự động cập nhật Permission Overwrites Discord thật khi đột phá!`,
        'THIẾT LẬP KÊNH ẨN'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 18. /setuproletttl
  {
    data: new SlashCommandBuilder()
      .setName('setuproletttl')
      .setDescription('Thiết lập Role Thái Thượng Trưởng Lão (Tự động cấp khi đạt Độ Kiếp)')
      .addRoleOption(opt => opt.setName('role').setDescription('Role Thái Thượng Trưởng Lão').setRequired(true)),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }
      const role = interaction.options.getRole('role', true);
      db.updateGuildConfig(guild.id, { role_tttl_id: role.id });

      const embed = createManyCurielEmbed(
        client,
        `⚡ **Đã thiết lập Role Thái Thượng Trưởng Lão:** <@&${role.id}>\n\n• Tự động trao thưởng khi tu sĩ đạt cảnh giới **[Độ Kiếp]**.`,
        'THIẾT LẬP ROLE THÁI THƯỢNG TRƯỞNG LÃO'
      );
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 19. /setupanh <tên nv> <cấp> <url> (Lệnh chính thức thiết lập ảnh thẻ)
  {
    data: new SlashCommandBuilder()
      .setName('setupanh')
      .setDescription('Thiết lập ảnh Thẻ nhân vật theo cấp C, B, A, S, 1000 (Quản Lý)')
      .addStringOption(opt => opt.setName('ten').setDescription('Tên nhân vật Sư phụ (ví dụ: Chu Tinh Dật)').setRequired(true))
      .addStringOption(opt => opt.setName('cap').setDescription('Cấp thẻ (C, B, A, S, 1000)').setRequired(true))
      .addStringOption(opt => opt.setName('url').setDescription('Đường dẫn ảnh thẻ (URL http/https)').setRequired(true)),
    async execute(interaction, client) {
      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const rawName = interaction.options.getString('ten', true);
      const rawTier = interaction.options.getString('cap', true).toUpperCase();
      const url = interaction.options.getString('url', true);
      const charName = normalizeCharacterName(rawName);

      if (!charName) {
        const embed = createManyCurielEmbed(client, `⚠️ Không tìm thấy nhân vật **${rawName}** trong danh sách Sư phụ!`, 'LỖI NHÂN VẬT');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const validTiers = ['C', 'B', 'A', 'S', '1000'];
      if (!validTiers.includes(rawTier)) {
        const embed = createManyCurielEmbed(client, `⚠️ Cấp thẻ hợp lệ là: \`C\`, \`B\`, \`A\`, \`S\`, \`1000\`!`, 'LỖI CẤP THẺ');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      db.setCharacterImage(charName, rawTier as any, url);

      const embed = createManyCurielEmbed(
        client,
        `✅ **ĐÃ THIẾT LẬP ẢNH THẺ THÀNH CÔNG (/setupanh)!**\n\n` +
        `• **Nhân vật:** **${charName}**\n` +
        `• **Cấp thẻ:** Thẻ \`${rawTier}\`\n` +
        `• **Link ảnh:** [Bấm để xem ảnh](${url})\n` +
        `• **Người thực hiện:** <@${interaction.user.id}>\n\n` +
        `👉 *Dùng lệnh \`Mxemthe ${charName}\` hoặc \`/testanh ${charName}\` để xem ảnh thẻ đã thiết lập!*`,
        'THIẾT LẬP ẢNH THẺ'
      );
      embed.setImage(url);

      await interaction.reply({ embeds: [embed] });
    }
  },

  // 19b. /setanhthe (Alias cho /setupanh)
  {
    data: new SlashCommandBuilder()
      .setName('setanhthe')
      .setDescription('Thiết lập ảnh Thẻ nhân vật theo cấp C, B, A, S, 1000 (Quản Lý)')
      .addStringOption(opt => opt.setName('ten').setDescription('Tên nhân vật Sư phụ').setRequired(true))
      .addStringOption(opt => opt.setName('cap').setDescription('Cấp thẻ (C, B, A, S, 1000)').setRequired(true))
      .addStringOption(opt => opt.setName('url').setDescription('Đường dẫn ảnh thẻ').setRequired(true)),
    async execute(interaction, client) {
      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const rawName = interaction.options.getString('ten', true);
      const rawTier = interaction.options.getString('cap', true).toUpperCase();
      const url = interaction.options.getString('url', true);
      const charName = normalizeCharacterName(rawName);

      if (!charName) {
        const embed = createManyCurielEmbed(client, `⚠️ Không tìm thấy nhân vật **${rawName}** trong danh sách Sư phụ!`, 'LỖI NHÂN VẬT');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const validTiers = ['C', 'B', 'A', 'S', '1000'];
      if (!validTiers.includes(rawTier)) {
        const embed = createManyCurielEmbed(client, `⚠️ Cấp thẻ hợp lệ là: \`C\`, \`B\`, \`A\`, \`S\`, \`1000\`!`, 'LỖI CẤP THẺ');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      db.setCharacterImage(charName, rawTier as any, url);

      const embed = createManyCurielEmbed(
        client,
        `✅ **ĐÃ CÀI ĐẶT ẢNH THẺ THÀNH CÔNG!**\n\n` +
        `• **Nhân vật:** **${charName}**\n` +
        `• **Cấp thẻ:** Thẻ \`${rawTier}\`\n` +
        `• **Link ảnh:** [Bấm để xem ảnh](${url})\n\n` +
        `👉 *Dùng lệnh \`Mxemthe ${charName}\` để chiêm ngưỡng thẻ nhân vật đã thiết lập!*`,
        'THIẾT LẬP ẢNH THẺ'
      );
      embed.setImage(url);

      await interaction.reply({ embeds: [embed] });
    }
  },

  // 20. /setanh <tên nv> <url ảnh> (Lệnh chính thức thiết lập ảnh hồ sơ)
  {
    data: new SlashCommandBuilder()
      .setName('setanh')
      .setDescription('Thiết lập ảnh hồ sơ nhân vật Sư phụ (Quản Lý)')
      .addStringOption(opt => opt.setName('ten').setDescription('Tên nhân vật Sư phụ (ví dụ: Chu Tinh Dật)').setRequired(true))
      .addStringOption(opt => opt.setName('url').setDescription('Đường dẫn ảnh hồ sơ (URL http/https)').setRequired(true)),
    async execute(interaction, client) {
      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const rawName = interaction.options.getString('ten', true);
      const url = interaction.options.getString('url', true);
      const charName = normalizeCharacterName(rawName);

      if (!charName) {
        const embed = createManyCurielEmbed(client, `⚠️ Không tìm thấy nhân vật **${rawName}** trong danh sách Sư phụ!`, 'LỖI NHÂN VẬT');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const embed = createManyCurielEmbed(client, '⚠️ Đường dẫn ảnh không hợp lệ! Vui lòng nhập link URL hợp lệ.', 'LỖI URL');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      db.setCharProfileImage(charName, url);

      const embed = createManyCurielEmbed(
        client,
        `✅ **ĐÃ THIẾT LẬP ẢNH HỒ SƠ THÀNH CÔNG (/setanh)!**\n\n` +
        `• **Nhân vật:** **${charName}**\n` +
        `• **Link ảnh:** [Bấm để xem ảnh](${url})\n` +
        `• **Người thực hiện:** <@${interaction.user.id}>\n\n` +
        `👉 *Sau khi cài đặt, khi dùng lệnh \`Mchar\` hoặc \`Mchar ${charName}\` sẽ tự động hiển thị ảnh này trên Embed!*`,
        'THIẾT LẬP ẢNH HỒ SƠ CHAR'
      );
      embed.setImage(url);

      await interaction.reply({ embeds: [embed] });
    }
  },

  // 20b. /setanhchar (Alias cho /setanh)
  {
    data: new SlashCommandBuilder()
      .setName('setanhchar')
      .setDescription('Cài đặt ảnh hồ sơ cho nhân vật Sư phụ (Quản Lý)')
      .addStringOption(opt => opt.setName('ten').setDescription('Tên nhân vật Sư phụ (ví dụ: Chu Tinh Dật)').setRequired(true))
      .addStringOption(opt => opt.setName('url').setDescription('Đường dẫn ảnh (URL http/https)').setRequired(true)),
    async execute(interaction, client) {
      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const rawName = interaction.options.getString('ten', true);
      const url = interaction.options.getString('url', true);
      const charName = normalizeCharacterName(rawName);

      if (!charName) {
        const embed = createManyCurielEmbed(client, `⚠️ Không tìm thấy nhân vật **${rawName}** trong danh sách Sư phụ!`, 'LỖI NHÂN VẬT');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const embed = createManyCurielEmbed(client, '⚠️ Đường dẫn ảnh không hợp lệ! Vui lòng nhập link URL hợp lệ.', 'LỖI URL');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      db.setCharProfileImage(charName, url);

      const embed = createManyCurielEmbed(
        client,
        `✅ **ĐÃ CÀI ĐẶT ẢNH HỒ SƠ THÀNH CÔNG!**\n\n` +
        `• **Nhân vật:** **${charName}**\n` +
        `• **Link ảnh:** [Bấm để xem ảnh](${url})\n` +
        `• **Người thực hiện:** <@${interaction.user.id}>\n\n` +
        `👉 *Sau khi cài đặt, khi dùng lệnh \`Mchar\` hoặc \`Mchar ${charName}\` sẽ tự động hiển thị ảnh này trên Embed!*`,
        'THIẾT LẬP ẢNH HỒ SƠ CHAR'
      );
      embed.setImage(url);

      await interaction.reply({ embeds: [embed] });
    }
  },

  // 21. /tieudietboss (Tiêu diệt Boss Chung - Quản Lý)
  {
    data: new SlashCommandBuilder()
      .setName('tieudietboss')
      .setDescription('Tiêu diệt Boss Chung đang hoạt động trên máy chủ (Quản Lý)'),
    async execute(interaction, client) {
      if (!interaction.guild) return;
      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const bossChung = db.getBossChung(interaction.guild.id);
      if (!bossChung || !bossChung.is_alive) {
        const embed = createManyCurielEmbed(
          client,
          `⚠️ Hiện tại **không có Boss Chung nào đang hoạt động** trong máy chủ để tiêu diệt!`,
          'KHÔNG CÓ BOSS CHUNG'
        );
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const oldBossName = bossChung.boss_name;
      const bossChannelId = bossChung.channel_id;

      db.setBossChung(interaction.guild.id, null);

      const bossChannel = interaction.guild.channels.cache.get(bossChannelId) || await interaction.guild.channels.fetch(bossChannelId).catch(() => null);
      if (bossChannel && 'send' in bossChannel && typeof (bossChannel as any).send === 'function') {
        const channelNotice = createManyCurielEmbed(
          client,
          `⚡ **THIÊN QUY THỰC THI — BOSS CHUNG ĐÃ BỊ TIÊU DIỆT!** ⚡\n\n` +
          `Quản lý <@${interaction.user.id}> đã thực thi quyền năng tối cao, tiêu diệt hoàn toàn cự thú **${oldBossName}**!\n` +
          `Chiến trường tại <#${bossChannelId}> đã được dọn dẹp sạch sẽ.`,
          'BOSS ĐÃ BỊ TIÊU DIỆT'
        );
        await (bossChannel as any).send({ embeds: [channelNotice] }).catch(() => null);
      }

      const successEmbed = createManyCurielEmbed(
        client,
        `✅ **ĐÃ TIÊU DIỆT BOSS CHUNG THÀNH CÔNG!**\n\n` +
        `• **Tên Boss:** **${oldBossName}**\n` +
        `• **Kênh xuất hiện:** <#${bossChannelId}>\n` +
        `• **Người thực hiện:** <@${interaction.user.id}> *(Quyền Quản Lý)*\n` +
        `• **Trạng thái:** Toàn bộ chiến trường Boss Chung đã được kết thúc an toàn.`,
        'TIÊU DIỆT BOSS THÀNH CÔNG'
      );
      await interaction.reply({ embeds: [successEmbed] });
    }
  },

  // 22. /help (Xem toàn bộ danh sách lệnh chơi của Bot)
  {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Hiển thị bảng hướng dẫn các lệnh chơi của Bot Many Curiel'),
    async execute(interaction, client) {
      const helpText = `🌌 **BẢNG HƯỚNG DẪN CÁC LỆNH CHƠI BOT MANY CURIEL** 🌌\n\n` +
        `🌸 **1. HỆ THỐNG SƯ PHỤ & HỒ SƠ NHÂN VẬT:**\n` +
        `• \`Msuphu\`: Danh sách 29 vị Sư phụ & chọn bái sư (Yêu cầu đạt Kim Đan Kỳ)\n` +
        `• \`Mbaisu <tên nv>\`: Bái vị Sư phụ chỉ định (yêu cầu đạt Kim Đan Kỳ; đạt 1.000 Hảo Cảm với Sư phụ cũ mới được đổi)\n` +
        `• \`Mchar\` / \`/char\`: Xem hồ sơ các Sư phụ đã bái (Hảo cảm, Quà đã tặng + số lượng, Độ ghét, Nút tương tác: Tặng quà, Hôn môi, Cắn nhẹ, Ôm)\n` +
        `• \`Mtangqua <tên quà> <tên nv>\`: Tặng quà bồi đắp Hảo Cảm\n` +
        `• \`Mkiss <tên nv>\`: Hôn môi Sư phụ *(cooldown 10s)*\n` +
        `• \`Mbite <tên nv>\`: Cắn nhẹ Sư phụ *(cooldown 10s)*\n` +
        `• \`Mhug <tên nv>\`: Ôm Sư phụ *(cooldown 10s)*\n\n` +
        `🎋 **2. TU LUYỆN & CẢNH GIỚI:**\n` +
        `• \`Mtl\` / \`Mtuluyen\`: Tu luyện tích lũy Tu Vi (+50 Tu Vi, +100-500 Linh Thạch) *(cooldown 5s)*\n` +
        `• \`Mtc\` / \`Mthangcap\` / \`Mdottpha\`: Đột phá cảnh giới khi đạt 1.000 Tu Vi\n` +
        `• \`Mtuvi\` / \`Mhs\` / \`/tuvi\`: Xem hồ sơ tu vi, cảnh giới và túi trữ vật\n` +
        `• \`Mdiemdanh\` / \`Mdd\` / \`/diemdanh\`: Điểm danh nhận Linh Thạch mỗi ngày\n` +
        `• \`Mcauhoi\` / \`Mvd\` / \`/cauhoi\`: Vấn đáp tu tiên nhận tài nguyên\n` +
        `• \`Mtruanam @user\`: Thần thông Độ Kiếp (Timeout Discord 1 phút)\n\n` +
        `🛒 **3. CỬA HÀNG & TÚI ĐỒ:**\n` +
        `• \`Mshop\` / \`/shop\`: Cửa hàng 6 khu vực (Vũ khí, Đan dược, Quà tặng, Giáp, Bùa, Linh thú)\n` +
        `• \`Mbag\` / \`Mtui\`: Mở túi đồ trữ vật\n\n` +
        `⚔️ **4. KHIÊU CHIẾN BOSS:**\n` +
        `• \`Mboss\`: Xem danh sách các quái vật ra lò\n` +
        `• \`Mkhieuchien <tên boss>\` / \`Mkc\`: Quyết đấu Boss Đơn trong Thread riêng 40s\n` +
        `• \`Mdanhthuong\`, \`Mtuyetchieu\`, \`Mhoimau\`, \`Mhoihuyet\`\n\n` +
        `🃏 **5. THẺ NHÂN VẬT & BẢNG XẾP HẠNG:**\n` +
        `• \`Mghepthe <cấp> <tên nv>\`: Ghép mảnh thành Thẻ Nhân Vật\n` +
        `• \`Mxemthe <tên nv>\`: Xem thẻ nhân vật đã mở khóa\n` +
        `• \`Mbxh\` / \`Mbxh suutap\` / \`Mbxh phuhao\` / \`Mbxh detu\`: Các bảng xếp hạng\n\n` +
        `🧧 **6. TƯƠNG TÁC CỘNG ĐỒNG:**\n` +
        `• \`Mlixi <tổng số tiền> <số người>\`: Tạo phong bao lì xì Linh Thạch\n` +
        `• \`Mgive @user <số linh thạch>\`: Tặng Linh Thạch cho đạo hữu khác (khấu trừ trực tiếp ví của bạn)\n\n` +
        `👑 **7. QUẢN LÝ & QUẢN TRỊ:**\n` +
        `• \`Mtang <đơn vị> @user <số lượng>\`: Quản lý cấp Linh Thạch / Mảnh Ký Ức (vô hạn, không trừ ví)\n` +
        `• \`Mtangmanh <cấp> <tên nv> @user <số lượng>\`: Quản lý cấp Mảnh Nhân Vật`;

      const embed = createManyCurielEmbed(client, helpText, 'DANH SÁCH LỆNH CHƠI (Mhelp / /help)');
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 21. /testanh <tên nv>
  {
    data: new SlashCommandBuilder()
      .setName('testanh')
      .setDescription('Xem và kiểm tra toàn bộ ảnh đã thiết lập của nhân vật Sư phụ (Quản Lý)')
      .addStringOption(opt => opt.setName('ten').setDescription('Tên nhân vật Sư phụ').setRequired(true)),
    async execute(interaction, client) {
      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createPermissionDeniedEmbed(client, interaction.user, 'QUAN_LY');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const rawName = interaction.options.getString('ten', true);
      const charName = normalizeCharacterName(rawName);

      if (!charName) {
        const embed = createManyCurielEmbed(client, `⚠️ Không tìm thấy nhân vật **${rawName}**!`, 'LỖI NHÂN VẬT');
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const profileImg = db.getCharProfileImage(charName);
      const allImgs = db.getCharacterImages(charName);

      if (!profileImg && !allImgs.C && !allImgs.B && !allImgs.A && !allImgs.S && !allImgs['1000']) {
        const embed = createManyCurielEmbed(
          client,
          `⚠️ Sư phụ **${charName}** chưa được cài đặt ảnh nào!\n\n• Dùng \`/setanhchar ${charName} <url>\` để set ảnh hồ sơ.`,
          'CHƯA CÓ ẢNH'
        );
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const desc = `🖼️ **HỆ THỐNG KIỂM TRA ẢNH SƯ PHỤ — ${charName.toUpperCase()}**\n\n` +
        `• **Người thực hiện:** <@${interaction.user.id}> *(Quản Lý)*\n` +
        `• **Ảnh hồ sơ chính (/setanhchar):** ${allImgs.profile ? `[Xem link](${allImgs.profile})` : '*Chưa thiết lập*'}\n` +
        `• **Ảnh thẻ C:** ${allImgs.C ? `[Xem link](${allImgs.C})` : '*Chưa có*'}\n` +
        `• **Ảnh thẻ B:** ${allImgs.B ? `[Xem link](${allImgs.B})` : '*Chưa có*'}\n` +
        `• **Ảnh thẻ A:** ${allImgs.A ? `[Xem link](${allImgs.A})` : '*Chưa có*'}\n` +
        `• **Ảnh thẻ S:** ${allImgs.S ? `[Xem link](${allImgs.S})` : '*Chưa có*'}\n` +
        `• **Ảnh thẻ 1000 HC:** ${allImgs['1000'] ? `[Xem link](${allImgs['1000']})` : '*Chưa có*'}\n\n` +
        `👉 *Ảnh preview hiển thị thực tế bên dưới:*`;

      const embed = createManyCurielEmbed(client, desc, `${EMOJIS.CROWN} TEST ẢNH SƯ PHỤ`);
      if (profileImg) {
        embed.setImage(profileImg);
      }
      await interaction.reply({ embeds: [embed] });
    }
  },

  // 22. /char [tên nv]
  {
    data: new SlashCommandBuilder()
      .setName('char')
      .setDescription('Xem hồ sơ Sư phụ đã bái: Hảo cảm, quà đã tặng, độ ghét và ảnh đại diện')
      .addStringOption(opt => opt.setName('ten').setDescription('Tên Sư phụ cần xem (để trống để xem Sư phụ hiện tại)').setRequired(false)),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      const userId = interaction.user.id;
      const myMasters = db.getBaiSuList(guild.id, userId);

      if (myMasters.length === 0) {
        const emptyEmbed = createManyCurielEmbed(
          client,
          `🌸 <@${userId}> hiện tại **chưa bái vị Sư phụ nào** trong tu chân giới!\n\n` +
          `• Lệnh \`/char\` chỉ hiển thị hồ sơ các vị Sư phụ đạo hữu đã bái sư.\n` +
          `• Hãy dùng lệnh \`Msuphu\` để xem danh sách 29 vị Sư phụ và chọn bái sư (\`Mbaisu <tên nv>\`)!`,
          'CHƯA CÓ SƯ PHỤ'
        );
        await interaction.reply({ embeds: [emptyEmbed] });
        return;
      }

      const user = db.getOrCreateUser(guild.id, userId, interaction.user.username);
      const rawName = interaction.options.getString('ten');

      let targetCharIndex = 0;
      if (rawName) {
        const parsed = normalizeCharacterName(rawName);
        if (!parsed) {
          const notFoundEmbed = createManyCurielEmbed(
            client,
            `⚠️ Không tìm thấy nhân vật **${rawName}** trong danh sách Sư phụ!`,
            'LỖI NHÂN VẬT'
          );
          await interaction.reply({ embeds: [notFoundEmbed] });
          return;
        }

        if (!myMasters.includes(parsed)) {
          const notBaiedEmbed = createManyCurielEmbed(
            client,
            `⛔ Đạo hữu <@${userId}> **chưa từng bái ${parsed} làm Sư phụ**!\n\n` +
            `• Danh sách Sư phụ đã bái của bạn: ${myMasters.map(m => `**${m}**`).join(', ')}\n\n` +
            `👉 *Hãy dùng lệnh \`Msuphu\` để xem danh sách hoặc bái sư!*`,
            'CHƯA BÁI SƯ PHỤ NÀY'
          );
          await interaction.reply({ embeds: [notBaiedEmbed] });
          return;
        }

        targetCharIndex = myMasters.indexOf(parsed);
      } else if (user.su_phu && myMasters.includes(user.su_phu)) {
        targetCharIndex = myMasters.indexOf(user.su_phu);
      }

      const payload = buildCharProfilePayload(client, guild.id, userId, myMasters, targetCharIndex);
      const response = await interaction.reply({ ...payload, fetchReply: true });

      attachCharProfileCollector(response, client, guild.id, userId, myMasters, targetCharIndex);
    }
  },

  // 23. /shop
  {
    data: new SlashCommandBuilder()
      .setName('shop')
      .setDescription('Mở Cửa Hàng Tu Chân Giới: 6 Khu vực nút bấm, giỏ hàng và mua sắm'),
    async execute(interaction, client) {
      const guild = interaction.guild;
      if (!guild) return;
      const userId = interaction.user.id;

      const { embed, components } = createShopHomePayload(client, guild.id, userId);
      const response = await interaction.reply({ embeds: [embed], components, fetchReply: true });

      const collector = (response as any).createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 180000
      });

      collector.on('collect', async (i: any) => {
        if (i.user.id !== userId) {
          await i.reply({ content: '⛔ Đạo hữu không thể tương tác phiên cửa hàng của người khác!', ephemeral: true });
          return;
        }

        const customId = i.customId;

        if (customId === 'btn_shop_home') {
          const payload = createShopHomePayload(client, guild.id, userId);
          await i.update(payload);
          return;
        }

        if (customId === 'btn_view_cart') {
          const payload = createCartPayload(client, guild.id, userId);
          await i.update(payload);
          return;
        }

        if (customId.startsWith('btn_cat_')) {
          const catId = customId.replace('btn_cat_', '');
          const payload = createCategoryPayload(client, guild.id, userId, catId);
          await i.update(payload);
          return;
        }

        if (customId.startsWith('btn_prod_')) {
          const parts = customId.replace('btn_prod_', '').split('_');
          const catId = parts[0];
          const prodId = parts.slice(1).join('_');
          const payload = createProductPayload(client, guild.id, userId, catId, prodId);
          await i.update(payload);
          return;
        }

        if (customId.startsWith('btn_action_buy_')) {
          const parts = customId.replace('btn_action_buy_', '').split('_');
          const catId = parts[0];
          const prodId = parts.slice(1).join('_');
          const products = SHOP_PRODUCTS[catId] || [];
          const prod = products.find(p => p.id === prodId);

          if (!prod) {
            await i.reply({ content: '⚠️ Sản phẩm không tồn tại.', ephemeral: true });
            return;
          }

          const res = db.buyProduct(guild.id, userId, prod.name, prod.price, prod.category);
          if (res.success) {
            const freshUser = db.getOrCreateUser(guild.id, userId);
            const successEmbed = createManyCurielEmbed(
              client,
              `🎉 **MUA HÀNG THÀNH CÔNG!** 🎉\n\n` +
              `• **Vật phẩm:** ${prod.emoji} **${prod.name}**\n` +
              `• **Đã thanh toán:** \`-${prod.price.toLocaleString()}\` Linh Thạch\n` +
              `• **Linh Thạch còn lại:** \`${freshUser.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n` +
              `• **Tình trạng:** Đã được cộng trực tiếp vào ví / túi trữ vật của bạn! ✅`,
              'GIAO DỊCH THÀNH CÔNG'
            );

            const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setCustomId(`btn_cat_${catId}`).setLabel(`🔙 Về Khu Vực ${prod.category}`).setStyle(ButtonStyle.Primary),
              new ButtonBuilder().setCustomId('btn_shop_home').setLabel('🏠 Về Cửa Hàng').setStyle(ButtonStyle.Secondary)
            );

            await i.update({ embeds: [successEmbed], components: [navRow] });
          } else {
            await i.reply({ content: `⛔ ${res.message}`, ephemeral: true });
          }
          return;
        }

        if (customId.startsWith('btn_action_cancel_')) {
          const catId = customId.replace('btn_action_cancel_', '');
          const cancelPayload = createCategoryPayload(client, guild.id, userId, catId);
          await i.update(cancelPayload);
          await i.followUp({ content: '❌ Đã hủy giao dịch mua hàng. Đã quay lại menu khu vực.', ephemeral: true });
          return;
        }

        if (customId.startsWith('btn_action_addcart_')) {
          const parts = customId.replace('btn_action_addcart_', '').split('_');
          const catId = parts[0];
          const prodId = parts.slice(1).join('_');
          const products = SHOP_PRODUCTS[catId] || [];
          const prod = products.find(p => p.id === prodId);

          if (!prod) {
            await i.reply({ content: '⚠️ Sản phẩm không tồn tại.', ephemeral: true });
            return;
          }

          const res = db.addToCart(guild.id, userId, { name: prod.name, price: prod.price, category: prod.category });
          const addedEmbed = createManyCurielEmbed(
            client,
            `🛒 **ĐÃ THÊM VÀO GIỎ HÀNG THÀNH CÔNG!** 🛒\n\n` +
            `• **Vật phẩm:** ${prod.emoji} **${prod.name}**\n` +
            `• **Đơn giá:** \`${prod.price.toLocaleString()}\` Linh Thạch\n` +
            `• **Tổng số món trong giỏ:** \`${res.totalInCart}\` món\n\n` +
            `📌 *Sản phẩm đã được lưu an toàn trong giỏ hàng. Bot không bao giờ tự ý xóa sản phẩm.*`,
            'ĐÃ THÊM VÀO GIỎ HÀNG'
          );

          const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId('btn_view_cart').setLabel('🛒 Đến Giỏ Hàng').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`btn_cat_${catId}`).setLabel(`🔙 Về Khu Vực ${prod.category}`).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('btn_shop_home').setLabel('🏠 Về Cửa Hàng').setStyle(ButtonStyle.Secondary)
          );

          await i.update({ embeds: [addedEmbed], components: [navRow] });
          return;
        }

        if (customId === 'btn_cart_checkout') {
          const res = db.checkoutCart(guild.id, userId);
          if (res.success) {
            const freshUser = db.getOrCreateUser(guild.id, userId);
            const checkoutEmbed = createManyCurielEmbed(
              client,
              `🎉 **THANH TOÁN GIỎ HÀNG THÀNH CÔNG!** 🎉\n\n` +
              `• ${res.message}\n` +
              `• **Linh Thạch còn lại:** \`${freshUser.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n` +
              `• **Tình trạng:** Toàn bộ vật phẩm đã được chuyển vào túi trữ vật! ✅`,
              'THANH TOÁN THÀNH CÔNG'
            );

            const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder().setCustomId('btn_shop_home').setLabel('🏠 Quay Lại Cửa Hàng').setStyle(ButtonStyle.Primary)
            );

            await i.update({ embeds: [checkoutEmbed], components: [navRow] });
          } else {
            await i.reply({ content: `⛔ ${res.message}`, ephemeral: true });
          }
          return;
        }

        if (customId === 'btn_cart_clear') {
          db.clearCart(guild.id, userId);
          const cartPayload = createCartPayload(client, guild.id, userId);
          await i.update(cartPayload);
          await i.followUp({ content: '🗑️ Đã xóa toàn bộ vật phẩm trong giỏ hàng.', ephemeral: true });
          return;
        }
      });
    }
  }
];
