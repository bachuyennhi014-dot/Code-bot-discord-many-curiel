import { 
  Message, 
  Client, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType,
  TextChannel,
  ThreadChannel
} from 'discord.js';
import { db } from '../../database/database.js';
import { createManyCurielEmbed, createPermissionDeniedEmbed, EMOJIS } from '../../utils/embeds.js';
import { isOwner, isQuanLy, isStaff } from '../../permissions/permissions.js';
import { BossCombatState, BossChungState, CHARACTER_NAMES, calculateBossDamage } from '../../types/cultivation.js';

// Cooldown map for skill / tuyetchieu (10 seconds cooldown per user)
const bossSkillCooldowns = new Map<string, number>();
const activeBossTimers = new Map<string, NodeJS.Timeout>();

// HÌNH ẢNH CỦA CÁC BOSS ĐƠN (Được cung cấp chính xác từ người dùng)
export const BOSS_DON_IMAGES: Record<string, string> = {
  'Xà Yêu': 'https://cdn.discordapp.com/attachments/1555094084216160326/1560152588043821076/received_1445458120842703.gif?ex=6ad1acd3&is=6ad05b53&hm=b2fb1f77509d8befe76492e8782cda1d5e9033440c3ac5a8ee8ec8f52cc22d86&',
  'Xà Điệp': 'https://cdn.discordapp.com/attachments/1555094084216160326/1560152588043821076/received_1445458120842703.gif?ex=6ad1acd3&is=6ad05b53&hm=b2fb1f77509d8befe76492e8782cda1d5e9033440c3ac5a8ee8ec8f52cc22d86&',
  'Điệp Hồ': 'https://cdn.discordapp.com/attachments/1555094084216160326/1560157188998168666/8d1df267d8ced4f21f830a8feccc55df.jpg?ex=6ad1b11c&is=6ad05f9c&hm=35332a2db6ad710dc13dd60d4938e57d21ed67a3f1be0a6566abf44ec36aaf8f&',
  'Hồ Điệp': 'https://cdn.discordapp.com/attachments/1555094084216160326/1560157188998168666/8d1df267d8ced4f21f830a8feccc55df.jpg?ex=6ad1b11c&is=6ad05f9c&hm=35332a2db6ad710dc13dd60d4938e57d21ed67a3f1be0a6566abf44ec36aaf8f&',
  'Hỏa Kỳ Lân': 'https://cdn.discordapp.com/attachments/1555094084216160326/1560157189354688592/3a939b40892ed1baff5c799ab0a7ed60.jpg?ex=6ad1b11c&is=6ad05f9c&hm=c215c5b52e92bb2ef8ebdb788881687dbb5a615f6f873960fd1e1c1fbcd1eba6&'
};

export function getBossDonImageUrl(bossName: string): string | undefined {
  if (!bossName) return undefined;
  const lower = bossName.toLowerCase();
  if (lower.includes('xà') || lower.includes('xa')) {
    return BOSS_DON_IMAGES['Xà Yêu'];
  }
  if (lower.includes('điệp') || lower.includes('diep') || lower.includes('hồ điệp') || lower.includes('ho diep')) {
    return BOSS_DON_IMAGES['Điệp Hồ'];
  }
  if (lower.includes('kỳ lân') || lower.includes('ky lan') || lower.includes('hỏa kỳ lân')) {
    return BOSS_DON_IMAGES['Hỏa Kỳ Lân'];
  }
  return BOSS_DON_IMAGES[bossName];
}

/**
 * Handles Boss Chung defeat announcement with ranked participants (highest to lowest damage)
 */
async function handleBossChungDefeat(client: Client, guildId: string, channelId: string, bossChung: BossChungState, killerUserId: string) {
  bossChung.is_alive = false;
  db.setBossChung(guildId, bossChung);

  // Sắp xếp người tham gia từ người có công lớn nhất (damage cao nhất) đến bé nhất
  const sortedParticipants = Object.entries(bossChung.participants || {})
    .map(([uid, stats]) => ({ userId: uid, damage: stats.damage || 0 }))
    .sort((a, b) => b.damage - a.damage);

  let rankDesc = `🏆 **BOSS CHUNG ĐÃ BỊ TRẢM SÁT THÀNH CÔNG!** 🏆\n\n` +
    `• Cự thú **${bossChung.boss_name}** đã ngã xuống dưới sự hợp lực của các tu sĩ!\n` +
    `• Tu sĩ kết liễu chí mạng: <@${killerUserId}>\n` +
    `• Tổng số tu sĩ tham chiến: \`${sortedParticipants.length}\` vị\n\n` +
    `📊 **BẢNG VINH DANH CÔNG TRẠNG (Xếp hạng từ cao đến thấp):**\n`;

  sortedParticipants.forEach((p, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `\`#${idx + 1}\``;
    rankDesc += `${medal} <@${p.userId}> — Sát thương: \`${p.damage.toLocaleString()} ST\`\n`;
  });

  rankDesc += `\n🎁 **Phần thưởng chiến công:**\n` +
    `Các tu sĩ tham chiến hãy bấm nút **🎁 NHẬN THƯỞNG MẢNH** bên dưới để nhận Mảnh Nhân Vật (A hoặc S ngẫu nhiên)!`;

  const rewardRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_claim_boss_chung_${Date.now()}`)
      .setLabel('🎁 NHẬN THƯỞNG MẢNH')
      .setStyle(ButtonStyle.Success)
  );

  const winEmbed = createManyCurielEmbed(client, rankDesc, `${EMOJIS.CROWN} BOSS CHUNG ĐÃ BỊ TIÊU DIỆT`);

  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (channel && channel.isTextBased()) {
      const replyMsg = await (channel as any).send({ embeds: [winEmbed], components: [rewardRow] });

      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000 // 2 minutes claim time
      });

      collector.on('collect', async (i: any) => {
        if (!bossChung.participants[i.user.id]) {
          await i.reply({ content: '⚠️ Bạn không tham gia đánh Boss nên không thể nhận thưởng!', ephemeral: true });
          return;
        }
        if (bossChung.rewards_claimed?.includes(i.user.id)) {
          await i.reply({ content: '⚠️ Bạn đã nhận thưởng Boss Chung này rồi!', ephemeral: true });
          return;
        }

        if (!bossChung.rewards_claimed) bossChung.rewards_claimed = [];
        bossChung.rewards_claimed.push(i.user.id);

        const isS = Math.random() < 0.25;
        const tier = isS ? 'S' : 'A';
        const randomChar = CHARACTER_NAMES[Math.floor(Math.random() * CHARACTER_NAMES.length)];
        db.addManhNhanVat(guildId, i.user.id, randomChar, tier, 1);

        await i.reply({
          content: `🎉 Chúc mừng <@${i.user.id}> đã nhận được phần thưởng chiến công: **1 Mảnh ${tier} — ${randomChar}**!`,
          ephemeral: true
        });
      });
    }
  } catch (err) {
    console.error('[BOSS CHUNG DEFEAT ERROR]', err);
  }
}

/**
 * Creates the combat button action row for Boss Đơn
 */
function createCombatActionRow(healsRemaining: number, disabled = false) {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_boss_attack')
      .setLabel('⚔️ Đánh Thường')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId('btn_boss_skill')
      .setLabel('💥 Tuyệt Chiêu')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId('btn_boss_heal')
      .setLabel(`💖 Hồi Máu (${healsRemaining}/3)`)
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled || healsRemaining <= 0),
    new ButtonBuilder()
      .setCustomId('btn_boss_skills')
      .setLabel('📜 Kỹ Năng')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled)
  );
}

/**
 * Generate Boss Combat status embed
 */
function createBossStatusEmbed(
  client: Client,
  userId: string,
  bossState: BossCombatState,
  logMessage?: string
) {
  const bossPercent = Math.max(0, Math.min(100, Math.floor((bossState.boss_hp / bossState.boss_max_hp) * 100)));
  const playerPercent = Math.max(0, Math.min(100, Math.floor((bossState.player_hp / bossState.player_max_hp) * 100)));

  const totalBars = 10;
  const bossFilled = Math.round((bossPercent / 100) * totalBars);
  const bossBar = '█'.repeat(bossFilled) + '░'.repeat(totalBars - bossFilled);

  const playerFilled = Math.round((playerPercent / 100) * totalBars);
  const playerBar = '█'.repeat(playerFilled) + '░'.repeat(totalBars - playerFilled);

  const remainingSecs = Math.max(0, Math.ceil(((bossState.expires_at || 0) - Date.now()) / 1000));

  let desc = `⚔️ **CHIẾN TRƯỜNG QUYẾT ĐẤU BOSS: ${bossState.boss_name.toUpperCase()}** ⚔️\n\n` +
    `🐾 **Boss:** **${bossState.boss_name}**\n` +
    `• ${EMOJIS.BLOOD} Máu: \`${bossState.boss_hp.toLocaleString()} / ${bossState.boss_max_hp.toLocaleString()} HP\` (\`${bossPercent}%\`)\n` +
    `\`[${bossBar}]\`\n\n` +
    `👤 **Tu Sĩ:** <@${userId}>\n` +
    `• ${EMOJIS.BLOOD} Sinh Mệnh: \`${bossState.player_hp.toLocaleString()} / ${bossState.player_max_hp.toLocaleString()} HP\` (\`${playerPercent}%\`)\n` +
    `\`[${playerBar}]\`\n\n` +
    `⏱️ **Thời gian còn lại:** \`${remainingSecs} Giây\` *(Tối đa 1 phút 30 giây)*\n` +
    `💊 **Lượt hồi máu:** \`${3 - bossState.heals_used} / 3\` lần\n\n`;

  if (logMessage) {
    desc += `📜 **Diễn biến trận đấu:**\n${logMessage}\n\n`;
  }

  desc += `👉 *Sử dụng các nút bên dưới hoặc nhập lệnh trong chủ đề này:*\n` +
    `• \`Mdanhthuong\` / \`Mdt\`: Đánh thường\n` +
    `• \`Mtuyetchieu <tên chiêu>\` / \`Mskill\`: Tuyệt chiêu\n` +
    `• \`Mhoimau\`: Hồi phục +20 HP\n` +
    `• \`Mcheckskill\`: Xem kỹ năng`;

  const embed = createManyCurielEmbed(client, desc, `QUYẾT ĐẤU BOSS: ${bossState.boss_name.toUpperCase()}`);
  const bossImg = getBossDonImageUrl(bossState.boss_name);
  if (bossImg) {
    embed.setImage(bossImg);
  }
  return embed;
}

export async function handleBossCommands(message: Message, client: Client, cmd: string, args: string[]): Promise<boolean> {
  const userId = message.author.id;
  const guild = message.guild;
  if (!guild) return false;

  // 1. Mboss (Bảng Danh Sách Các Quái Vật Ra Lò Để Khiêu Chiến)
  if (cmd === 'boss') {
    const bossChung = db.getBossChung(guild.id);
    const bossDon = db.getBossDon(userId);

    const embed = createManyCurielEmbed(
      client,
      `${EMOJIS.BOSS_1} **DANH SÁCH CÁC QUÁI VẬT RA LÒ ĐỂ KHIÊU CHIẾN (Mboss)** ${EMOJIS.BOSS_2}\n\n` +
      `⚔️ **1. DANH SÁCH BOSS ĐƠN (Quyết Đấu Tối Đa 1 Phút 30 Giây):**\n` +
      `• ${EMOJIS.BOSS_3} **Xà Yêu:** \`6.000 HP\` — Nhận \`5.000\` ${EMOJIS.LINH_THACH} Linh Thạch & 1 Mảnh B\n` +
      `• ${EMOJIS.BOSS_4} **Điệp Hồ** *(hoặc Hồ Điệp)*: \`7.500 HP\` — Nhận \`10.000\` ${EMOJIS.LINH_THACH} Linh Thạch & 1 Mảnh B/A\n` +
      `• ${EMOJIS.BOSS_5} **Hắc Hổ:** \`10.000 HP\` — Nhận \`15.000\` ${EMOJIS.LINH_THACH} Linh Thạch & 1 Mảnh A\n` +
      `• ${EMOJIS.BOSS_6} **Hỏa Kỳ Lân:** \`15.000 HP\` — Nhận \`25.000\` ${EMOJIS.LINH_THACH} Linh Thạch & 1 Mảnh S\n\n` +
      `👉 **Cú pháp khiêu chiến:** \`Mkhieuchien <tên Boss>\` (hoặc \`Mkc <tên Boss>\`)\n` +
      `📌 *Ví dụ:* \`Mkhieuchien Hồ Điệp\` hoặc \`Mkhieuchien Xà Yêu\`\n\n` +
      (bossDon && (bossStateValid(bossDon)) 
        ? `⚠️ *Bạn đang có trận chiến dở dang: **${bossDon.boss_name}** tại <#${bossDon.thread_id || bossDon.channel_id}>*\n\n` 
        : '') +
      `🌍 **2. BOSS CHUNG TOÀN MÁY CHỦ:**\n` +
      (bossChung && bossChung.is_alive 
        ? `🔥 **ĐANG HOẠT ĐỘNG:** **${bossChung.boss_name}** tại kênh <#${bossChung.channel_id}>!\n` +
          `• Máu Boss: \`${bossChung.boss_hp.toLocaleString()} / ${bossChung.boss_max_hp.toLocaleString()} HP\`\n` +
          `• Mau tới <#${bossChung.channel_id}> hợp lực trảm Boss nhận Mảnh S/A!`
        : `• Hiện tại chưa có Boss Chung nào xuất hiện.\n` +
          `• Do Ban Quản Trị / Staff thả bằng lệnh \`Mthaboss #kênh\`!`),
      `${EMOJIS.CROWN} DANH SÁCH QUÁI VẬT RA LÒ (Mboss)`
    );

    await message.reply({ embeds: [embed] });
    return true;
  }

  // 2. Mthaboss #kênh (Thả Boss Chung Toàn Server)
  if (cmd === 'thaboss') {
    if (!isOwner(userId) && !isQuanLy(userId) && !isStaff(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'STAFF');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const channel = message.mentions.channels.first();
    if (!channel || !channel.isTextBased()) {
      const embed = createManyCurielEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`Mthaboss #kênh\`\nVí dụ: \`Mthaboss #phong-boss\``, 'THẢ BOSS CHUNG');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const bossName = 'Thần Lãng Thiên Sơn';
    const bossMaxHp = 20000;

    const bossState: BossChungState = {
      guild_id: guild.id,
      channel_id: channel.id,
      boss_name: bossName,
      boss_hp: bossMaxHp,
      boss_max_hp: bossMaxHp,
      is_alive: true,
      participants: {},
      heals_given: {},
      created_at: new Date().toISOString(),
      rewards_claimed: []
    };

    db.setBossChung(guild.id, bossState);

    const embed = createManyCurielEmbed(
      client,
      `🔥 **THIÊN ĐỊA BIẾN SẮC — BOSS CHUNG ĐÃ XUẤT HIỆN!** 🔥\n\n` +
      `🐾 **Cự thú thượng cổ:** **${bossName}**\n` +
      `🩸 **Sinh Mệnh:** \`${bossMaxHp.toLocaleString()} / ${bossMaxHp.toLocaleString()} HP\`\n` +
      `📍 **Địa điểm giao tranh:** <#${channel.id}>\n\n` +
      `⚔️ **Cơ chế chiến đấu đặc biệt:**\n` +
      `• Mọi người chơi tại <#${channel.id}> được tự do dùng lệnh chiến đấu:\n` +
      `  - \`Mdanhthuong\` / \`Mdt\`: Tấn công Boss\n` +
      `  - \`Mtuyetchieu <tên skill>\` / \`Mskill\`: Xuất chiêu sát thương lớn\n` +
      `  - \`Mhoihuyet @user\`: Hồi máu cứu viện đồng đội (tối đa 3 lần)\n` +
      `• Không giới hạn kênh chơi thông thường tại kênh Boss trong thời gian Boss còn sống!\n\n` +
      `🎁 **Phần thưởng khi Boss chết:** Rơi Mảnh A và Mảnh S cực hiếm cho người tham gia!`,
      `${EMOJIS.CROWN} THẢ BOSS CHUNG TOÀN DÂN`
    );

    if (channel && 'send' in channel && typeof (channel as any).send === 'function') {
      await (channel as any).send({ embeds: [embed] }).catch(() => null);
    }
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 2.1 Mtieudietboss / Mkillboss (Tiêu diệt Boss Chung - Chỉ Owner & Quản Lý)
  if (cmd === 'tieudietboss' || cmd === 'killboss' || cmd === 'huyboss' || cmd === 'tdboss') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const bossChung = db.getBossChung(guild.id);
    if (!bossChung || !bossChung.is_alive) {
      const embed = createManyCurielEmbed(
        client,
        `⚠️ Hiện tại **không có Boss Chung nào đang hoạt động** trong máy chủ để tiêu diệt!`,
        'KHÔNG CÓ BOSS CHUNG'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const oldBossName = bossChung.boss_name;
    const bossChannelId = bossChung.channel_id;

    // Reset / clear boss chung
    db.setBossChung(guild.id, null);

    // Notify in boss channel if distinct
    const bossChannel = guild.channels.cache.get(bossChannelId) || await guild.channels.fetch(bossChannelId).catch(() => null);
    if (bossChannel && 'send' in bossChannel && typeof (bossChannel as any).send === 'function') {
      const channelNotice = createManyCurielEmbed(
        client,
        `⚡ **THIÊN QUY THỰC THI — BOSS CHUNG ĐÃ BỊ TIÊU DIỆT!** ⚡\n\n` +
        `Quản lý <@${userId}> đã thực thi quyền năng, tiêu diệt hoàn toàn cự thú **${oldBossName}**!\n` +
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
      `• **Người thực hiện:** <@${userId}> *(Quyền Quản Lý)*\n` +
      `• **Trạng thái:** Toàn bộ chiến trường Boss Chung đã được kết thúc an toàn.`,
      'TIÊU DIỆT BOSS THÀNH CÔNG'
    );
    await message.reply({ embeds: [successEmbed] });
    return true;
  }

  // 3. Mkhieuchien <tên Boss> / Mkhiuchien / Mkc (Boss Đơn - Tạo Chủ Đề - Tối đa 40s)
  if (cmd === 'khieuchien' || cmd === 'khiuchien' || cmd === 'kc') {
    const rawBoss = (args.join(' ') || '').trim().toLowerCase();

    let bossName = '';
    let bossHp = 1000;

    // Check against valid boss definitions (+5000 HP each: Xà Yêu 6000, Điệp Hồ 7500, Hắc Hổ 10000, Hỏa Kỳ Lân 15000)
    if (
      rawBoss === 'hồ điệp' || rawBoss === 'ho diep' || rawBoss === 'hodiep' || 
      rawBoss === 'điệp hồ' || rawBoss === 'diep ho' || rawBoss === 'diepho' ||
      rawBoss.includes('hồ điệp') || rawBoss.includes('điệp hồ') || 
      rawBoss.includes('diep ho') || rawBoss.includes('ho diep')
    ) {
      bossName = 'Điệp Hồ';
      bossHp = 7500;
    } else if (
      rawBoss === 'xà yêu' || rawBoss === 'xa yeu' || rawBoss === 'xayeu' ||
      rawBoss === 'xà điệp' || rawBoss === 'xa diep' || rawBoss === 'xadiep' ||
      rawBoss.includes('xà yêu') || rawBoss.includes('xa yeu') ||
      rawBoss.includes('xà điệp') || rawBoss.includes('xa diep') ||
      rawBoss.includes('xadiep')
    ) {
      bossName = 'Xà Yêu';
      bossHp = 6000;
    } else if (
      rawBoss === 'hắc hổ' || rawBoss === 'hac ho' || rawBoss === 'hacho' || 
      rawBoss.includes('hắc hổ') || rawBoss.includes('hac ho')
    ) {
      bossName = 'Hắc Hổ';
      bossHp = 10000;
    } else if (
      rawBoss === 'hỏa kỳ lân' || rawBoss === 'hoa ky lan' || rawBoss === 'hoakylan' || 
      rawBoss === 'kỳ lân' || rawBoss === 'kylan' || 
      rawBoss.includes('hỏa kỳ lân') || rawBoss.includes('hoa ky lan') || rawBoss.includes('kỳ lân')
    ) {
      bossName = 'Hỏa Kỳ Lân';
      bossHp = 15000;
    } else {
      // Yêu cầu: Nếu viết sai hoặc không có boss đó bot phản hồi đúng câu:
      const embed = createManyCurielEmbed(
        client,
        `⛔ **Quái vật này chưa được Many Curiel sản xuất vui lòng dùng lệnh Mboss để xem các quái vật đã ra lò**`,
        'QUÁI VẬT CHƯA RA LÒ'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    // Check if user already has an active battle
    const existingBoss = db.getBossDon(userId);
    if (existingBoss && bossStateValid(existingBoss)) {
      const remainingSecs = Math.max(0, Math.ceil(((existingBoss.expires_at || 0) - Date.now()) / 1000));
      const embed = createManyCurielEmbed(
        client,
        `⚠️ Bạn đang có trận chiến Boss **${existingBoss.boss_name}** chưa kết thúc!\n` +
        `• **Chủ đề quyết đấu:** <#${existingBoss.thread_id || existingBoss.channel_id}>\n` +
        `• **Thời gian còn lại:** \`${remainingSecs} Giây\`\n\n` +
        `👉 Hãy vào chủ đề đó để tiếp tục quyết đấu hoặc chờ hết 1 phút 30 giây.`,
        'TRẬN ĐẤU ĐANG DIỄN RA'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    // Clear any expired timer
    if (activeBossTimers.has(userId)) {
      clearTimeout(activeBossTimers.get(userId)!);
      activeBossTimers.delete(userId);
    }

    const user = db.getOrCreateUser(guild.id, userId, message.author.username);
    const expiresAt = Date.now() + 90000; // 90 seconds (1 phút 30 giây) max duration

    // 1. Create a Discord Thread (Chủ đề) for the boss fight
    let combatChannel: any = message.channel;
    let threadCreated = false;

    try {
      if ('threads' in message.channel && typeof (message.channel as any).threads?.create === 'function') {
        const threadName = `⚔️・quyết-đấu-${bossName.toLowerCase().replace(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF]+/g, '-')}-${message.author.username}`.slice(0, 95);
        combatChannel = await (message.channel as any).threads.create({
          name: threadName,
          autoArchiveDuration: 60,
          reason: `Trận chiến Boss Đơn ${bossName} của ${message.author.tag}`
        });
        threadCreated = true;
      } else if ('startThread' in message && typeof (message as any).startThread === 'function') {
        const threadName = `⚔️ Quyết Đấu ${bossName} - ${message.author.username}`.slice(0, 95);
        combatChannel = await (message as any).startThread({
          name: threadName,
          autoArchiveDuration: 60
        });
        threadCreated = true;
      }
    } catch (err) {
      console.warn('[BOSS THREAD] Không thể tạo thread, fallback về channel hiện tại:', err);
      combatChannel = message.channel;
      threadCreated = false;
    }

    const combatState: BossCombatState = {
      thread_id: threadCreated ? combatChannel.id : undefined,
      channel_id: combatChannel.id,
      user_id: userId,
      boss_name: bossName,
      boss_hp: bossHp,
      boss_max_hp: bossHp,
      player_hp: user.current_hp || 15000,
      player_max_hp: user.max_hp || 15000,
      heals_used: 0,
      created_at: new Date().toISOString(),
      expires_at: expiresAt
    };

    db.setBossDon(userId, combatState);

    // Initial embed inside the combat channel/thread
    const initialEmbed = createBossStatusEmbed(
      client,
      userId,
      combatState,
      `🔥 <@${userId}> đã bước vào chiến trường quyết đấu sinh tử cùng **${bossName}**!\n⏱️ Bạn có **1 phút 30 giây** để hạ gục Boss.`
    );
    const actionRow = createCombatActionRow(3);

    let battleMsg: any = null;
    if (threadCreated) {
      // Inform in main channel
      const mainNotice = createManyCurielEmbed(
        client,
        `⚔️ <@${userId}> đã mở chủ đề quyết đấu với **${bossName}** tại <#${combatChannel.id}>!\n` +
        `⏱️ **Thời gian tối đa:** \`1 Phút 30 Giây\`\n` +
        `👉 Mau vào <#${combatChannel.id}> để xuất chiêu chiến đấu!`,
        `${EMOJIS.CROWN} KHỞI TẠO CHỦ ĐỀ ĐÁNH BOSS`
      );
      const bossImg = getBossDonImageUrl(bossName);
      if (bossImg) {
        mainNotice.setImage(bossImg);
      }
      await message.reply({ embeds: [mainNotice] });

      battleMsg = await combatChannel.send({ embeds: [initialEmbed], components: [actionRow] });
    } else {
      battleMsg = await message.reply({ embeds: [initialEmbed], components: [actionRow] });
    }

    // 2. Setup 90s Timeout Handler for Boss battle
    const timer = setTimeout(async () => {
      const current = db.getBossDon(userId);
      if (current && current.boss_name === bossName && current.channel_id === combatChannel.id) {
        db.setBossDon(userId, null);
        activeBossTimers.delete(userId);

        const timeoutEmbed = createManyCurielEmbed(
          client,
          `⏱️ **HẾT THỜI GIAN 1 PHÚT 30 GIÂY!**\n\n` +
          `• Cự thú **${bossName}** đã biến mất vào hư không mây mù.\n` +
          `• Tu sĩ <@${userId}> chưa kịp kết liễu Boss trong thời gian quy định.\n` +
          `• Trận khiêu chiến kết thúc thất bại! Hãy nâng cao tu vi và tái đấu sau.`,
          `${EMOJIS.PRAY} HẾT THỜI GIAN KHIÊU CHIẾN`
        );

        await combatChannel.send({ embeds: [timeoutEmbed] }).catch(() => null);

        // Archive thread if created
        if (threadCreated && 'setArchived' in combatChannel) {
          setTimeout(() => {
            (combatChannel as ThreadChannel).setArchived(true).catch(() => null);
          }, 4000);
        }
      }
    }, 90000); // 90 seconds

    activeBossTimers.set(userId, timer);

    // 3. Setup Button Collector for seamless fighting inside the thread
    if (battleMsg) {
      const collector = battleMsg.createMessageComponentCollector({
        filter: (i: any) => i.user.id === userId,
        componentType: ComponentType.Button,
        time: 90000
      });

      collector.on('collect', async (i: any) => {
        const freshBoss = db.getBossDon(userId);
        if (!freshBoss || !bossStateValid(freshBoss)) {
          await i.reply({ content: '⚠️ Trận chiến đã kết thúc hoặc hết thời gian 40s!', ephemeral: true }).catch(() => null);
          return;
        }

        const freshUser = db.getOrCreateUser(guild.id, userId);

        if (i.customId === 'btn_boss_attack') {
          // Base Damage: 100 HP (Yêu cầu: Fix sát thương ban đầu của người chơi từ 10 lên 100)
          let dmg = calculateBossDamage(freshUser, false);

          freshBoss.boss_hp = Math.max(0, freshBoss.boss_hp - dmg);

          if (freshBoss.boss_hp <= 0) {
            endBossCombatSuccess(client, guild.id, userId, combatChannel, freshBoss, threadCreated);
            await i.update({
              embeds: [createBossStatusEmbed(client, userId, freshBoss, `🏆 Bạn đã tung đòn kết liễu trảm sát **${freshBoss.boss_name}**!`)],
              components: [createCombatActionRow(3 - freshBoss.heals_used, true)]
            }).catch(() => null);
            return;
          }

          // Boss counters - Giáp trang bị giảm sát thương
          let bossDmg = Math.floor(Math.random() * 16) + 15; // 15 - 30 HP
          const eqArmor = (freshUser.equipped_armor && freshUser.equipped_armor.length > 0)
            ? freshUser.equipped_armor
            : (freshUser.inventory?.armor || []).slice(0, 3);
          if (eqArmor.length > 0) {
            let absorbed = 0;
            for (const a of eqArmor) {
              if (a.durability > 0) {
                absorbed += 5;
                a.durability -= 1;
              }
            }
            bossDmg = Math.max(2, bossDmg - absorbed);
          }

          freshBoss.player_hp = Math.max(0, freshBoss.player_hp - bossDmg);

          if (freshBoss.player_hp <= 0) {
            endBossCombatFailure(client, userId, combatChannel, freshBoss, threadCreated);
            await i.update({
              embeds: [createBossStatusEmbed(client, userId, freshBoss, `💀 Bạn đã bị **${freshBoss.boss_name}** đánh trọng thương!`)],
              components: [createCombatActionRow(3 - freshBoss.heals_used, true)]
            }).catch(() => null);
            return;
          }

          db.setBossDon(userId, freshBoss);
          const updateEmbed = createBossStatusEmbed(
            client,
            userId,
            freshBoss,
            `🗡️ Bạn đánh thường chém trúng **${freshBoss.boss_name}** gây **-${dmg} HP**!\n💢 **${freshBoss.boss_name}** phản kích gây **-${bossDmg} HP** lên bạn!`
          );
          await i.update({ embeds: [updateEmbed], components: [createCombatActionRow(3 - freshBoss.heals_used)] }).catch(() => null);
        } else if (i.customId === 'btn_boss_skill') {
        // Kiểm tra cooldown 10s cho tuyệt chiêu / skill
        const lastSkill = bossSkillCooldowns.get(userId) || 0;
        const now = Date.now();
        if (now - lastSkill < 10000) {
          const remainingSecs = Math.ceil((10000 - (now - lastSkill)) / 1000);
          await i.reply({ content: `⏳ Tâm tính chưa ổn định! Vui lòng chờ **${remainingSecs} giây** nữa mới có thể tiếp tục sử dụng Tuyệt Chiêu!`, ephemeral: true }).catch(() => null);
          return;
        }
        bossSkillCooldowns.set(userId, now);

        // Special Skill (Sát thương tuyệt chiêu tỉ lệ theo cấp độ)
        const skills = freshUser.skills || ['Đạo Lực Chưởng'];
        const skillName = skills[0] || 'Đạo Lực Chưởng';
        let dmg = calculateBossDamage(freshUser, true);

        freshBoss.boss_hp = Math.max(0, freshBoss.boss_hp - dmg);

        if (freshBoss.boss_hp <= 0) {
          endBossCombatSuccess(client, guild.id, userId, combatChannel, freshBoss, threadCreated);
          await i.update({
            embeds: [createBossStatusEmbed(client, userId, freshBoss, `💥 Tuyệt chiêu **[${skillName}]** đã kết liễu **${freshBoss.boss_name}**!`)],
            components: [createCombatActionRow(3 - freshBoss.heals_used, true)]
          }).catch(() => null);
          return;
        }

        let bossDmg = Math.floor(Math.random() * 16) + 15;
        const eqArmor = (freshUser.equipped_armor && freshUser.equipped_armor.length > 0)
          ? freshUser.equipped_armor
          : (freshUser.inventory?.armor || []).slice(0, 3);
        if (eqArmor.length > 0) {
          let absorbed = 0;
          for (const a of eqArmor) {
            if (a.durability > 0) {
              absorbed += 5;
              a.durability -= 1;
            }
          }
          bossDmg = Math.max(2, bossDmg - absorbed);
        }

        freshBoss.player_hp = Math.max(0, freshBoss.player_hp - bossDmg);

        if (freshBoss.player_hp <= 0) {
          endBossCombatFailure(client, userId, combatChannel, freshBoss, threadCreated);
          await i.update({
            embeds: [createBossStatusEmbed(client, userId, freshBoss, `💀 Bạn đã bị **${freshBoss.boss_name}** đánh trọng thương!`)],
            components: [createCombatActionRow(3 - freshBoss.heals_used, true)]
          }).catch(() => null);
          return;
        }

        db.setBossDon(userId, freshBoss);
        const updateEmbed = createBossStatusEmbed(
          client,
          userId,
          freshBoss,
          `💥 Bạn xuất tuyệt kỹ **[${skillName}]** gây chấn động đất trời **-${dmg} HP**!\n💢 **${freshBoss.boss_name}** phản kích gây **-${bossDmg} HP**!`
        );
        await i.update({ embeds: [updateEmbed], components: [createCombatActionRow(3 - freshBoss.heals_used)] }).catch(() => null);
        } else if (i.customId === 'btn_boss_heal') {
          // Heal
          if (freshBoss.heals_used >= 3) {
            await i.reply({ content: '⛔ Bạn đã sử dụng hết 3/3 lần hồi máu!', ephemeral: true }).catch(() => null);
            return;
          }

          freshBoss.heals_used += 1;
          freshBoss.player_hp = Math.min(freshBoss.player_max_hp, freshBoss.player_hp + 20);
          db.setBossDon(userId, freshBoss);

          const updateEmbed = createBossStatusEmbed(
            client,
            userId,
            freshBoss,
            `💖 Bạn vận khí hồi phục thành công **+20 HP**! (Còn ${3 - freshBoss.heals_used}/3 lần)`
          );
          await i.update({ embeds: [updateEmbed], components: [createCombatActionRow(3 - freshBoss.heals_used)] }).catch(() => null);
        } else if (i.customId === 'btn_boss_skills') {
          // View Skills
          const skills = freshUser.skills || ['Đạo Lực Chưởng'];
          await i.reply({
            content: `📜 **Kỹ năng chiến đấu của bạn:**\n${skills.map((s, idx) => `• ${idx + 1}. ✨ **${s}** (Sát thương 35 HP)`).join('\n')}`,
            ephemeral: true
          }).catch(() => null);
        }
      });
    }

    return true;
  }

  // 4. Mdanhthuong / Mdt (Đánh Thường)
  if (cmd === 'danhthuong' || cmd === 'dt') {
    // Check if in Boss Chung channel
    const bossChung = db.getBossChung(guild.id);
    if (bossChung && bossChung.is_alive && bossChung.channel_id === message.channel.id) {
      if (!bossChung.is_alive || bossChung.boss_hp <= 0) {
        await message.reply({ content: '⛔ Trận chiến Boss Chung đã kết thúc!' });
        return true;
      }

      if (!bossChung.defeated_players) bossChung.defeated_players = [];
      const user = db.getOrCreateUser(guild.id, userId, message.author.username);

      if (bossChung.defeated_players.includes(userId) || (user.current_hp || 15000) <= 0) {
        if (!bossChung.defeated_players.includes(userId)) bossChung.defeated_players.push(userId);
        db.setBossChung(guild.id, bossChung);
        const embed = createManyCurielEmbed(
          client,
          `💔 Bạn đã hết HP và không thể tiếp tục tham gia trận boss này.`,
          'BỊ HẠ GỤC'
        );
        await message.reply({ embeds: [embed] });
        return true;
      }

      let dmg = calculateBossDamage(user, false);

      bossChung.boss_hp = Math.max(0, bossChung.boss_hp - dmg);
      if (!bossChung.participants[userId]) {
        bossChung.participants[userId] = { damage: 0, healed: 0 };
      }
      bossChung.participants[userId].damage += dmg;

      if (bossChung.boss_hp <= 0) {
        bossChung.is_alive = false;
        await handleBossChungDefeat(client, guild.id, message.channel.id, bossChung, userId);
        return true;
      }

      // Boss Chung phản công
      let bossCounterDmg = Math.floor(Math.random() * 251) + 200; // 200 - 450 HP
      const eqArmor = (user.equipped_armor && user.equipped_armor.length > 0)
        ? user.equipped_armor
        : (user.inventory?.armor || []).slice(0, 3);
      if (eqArmor.length > 0) {
        let absorbed = 0;
        for (const a of eqArmor) {
          if (a.durability > 0) {
            absorbed += 20;
            a.durability -= 1;
          }
        }
        bossCounterDmg = Math.max(50, bossCounterDmg - absorbed);
      }

      user.current_hp = Math.max(0, (user.current_hp || 15000) - bossCounterDmg);
      if (user.current_hp <= 0) {
        bossChung.defeated_players.push(userId);
      }
      db.updateUser(guild.id, userId, { current_hp: user.current_hp });
      db.setBossChung(guild.id, bossChung);

      const activeFighters = Object.keys(bossChung.participants).filter(uid => !bossChung.defeated_players?.includes(uid)).length;

      const embed = createManyCurielEmbed(
        client,
        `⚔️ <@${userId}> đã xuất chiêu Đánh Thường chém trúng **${bossChung.boss_name}** gây **-${dmg.toLocaleString()} HP**!\n` +
        `• **Máu Boss Chung còn lại:** \`${bossChung.boss_hp.toLocaleString()} / ${bossChung.boss_max_hp.toLocaleString()} HP\`\n\n` +
        `⚔️ **BOSS CHUNG PHẢN CÔNG!**\n` +
        `• 🎯 **Người bị tấn công:** <@${userId}>\n` +
        `• 💥 **Sát thương nhận:** \`${bossCounterDmg.toLocaleString()} HP\`\n` +
        `• ❤️ **HP còn lại:** \`${user.current_hp.toLocaleString()} / ${(user.max_hp || 15000).toLocaleString()} HP\`\n` +
        `• 👥 **Số người còn khả năng chiến đấu:** \`${Math.max(1, activeFighters)}\` tu sĩ\n` +
        (user.current_hp <= 0 ? `\n💔 Bạn đã hết HP và không thể tiếp tục tham gia trận boss này.` : ''),
        'TẤN CÔNG BOSS CHUNG'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    // Check Boss Đơn
    const bossDon = db.getBossDon(userId);
    if (!bossDon || !bossStateValid(bossDon)) {
      const embed = createManyCurielEmbed(client, `⚠️ Bạn không có trận Boss nào đang diễn ra! Gõ \`Mkhieuchien <tên Boss>\` để bắt đầu.`, 'KHÔNG CÓ TRẬN BOSS');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const user = db.getOrCreateUser(guild.id, userId);
    let dmg = calculateBossDamage(user, false);

    bossDon.boss_hp = Math.max(0, bossDon.boss_hp - dmg);

    if (bossDon.boss_hp <= 0) {
      endBossCombatSuccess(client, guild.id, userId, message.channel, bossDon, !!bossDon.thread_id);
      return true;
    }

    // Boss counters - Giáp hấp thụ sát thương
    let bossDmg = Math.floor(Math.random() * 16) + 15; // 15 - 30 HP
    const eqArmor = (user.equipped_armor && user.equipped_armor.length > 0)
      ? user.equipped_armor
      : (user.inventory?.armor || []).slice(0, 3);
    if (eqArmor.length > 0) {
      let absorbed = 0;
      for (const a of eqArmor) {
        if (a.durability > 0) {
          absorbed += 5;
          a.durability -= 1;
        }
      }
      bossDmg = Math.max(2, bossDmg - absorbed);
    }
    bossDon.player_hp = Math.max(0, bossDon.player_hp - bossDmg);
    user.current_hp = bossDon.player_hp;
    db.updateUser(guild.id, userId, { current_hp: user.current_hp });

    if (bossDon.player_hp <= 0) {
      endBossCombatFailure(client, userId, message.channel, bossDon, !!bossDon.thread_id);
      return true;
    }

    db.setBossDon(userId, bossDon);

    const embed = createBossStatusEmbed(
      client,
      userId,
      bossDon,
      `🗡️ <@${userId}> đánh thường chém trúng **${bossDon.boss_name}** gây **-${dmg} HP**!\n💢 **${bossDon.boss_name}** phản đòn gây **-${bossDmg} HP** lên bạn!`
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 5. Mtuyetchieu <tên skill> / Mskill
  if (cmd === 'tuyetchieu' || cmd === 'skill') {
    const bossDon = db.getBossDon(userId);
    const bossChung = db.getBossChung(guild.id);
    const inBossChung = bossChung && bossChung.is_alive && bossChung.channel_id === message.channel.id;

    if ((!bossDon || !bossStateValid(bossDon)) && !inBossChung) {
      const embed = createManyCurielEmbed(client, '⚠️ Bạn không ở trong trận chiến Boss nào! Gõ `Mkhieuchien <tên Boss>` để mở chủ đề quyết đấu.', 'KHÔNG CÓ TRẬN BOSS');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const skillName = args.join(' ') || 'Đạo Lực Chưởng';
    const user = db.getOrCreateUser(guild.id, userId);

    if (inBossChung && bossChung) {
      if (!bossChung.is_alive || bossChung.boss_hp <= 0) {
        await message.reply({ content: '⛔ Trận chiến Boss Chung đã kết thúc!' });
        return true;
      }

      if (!bossChung.defeated_players) bossChung.defeated_players = [];
      if (bossChung.defeated_players.includes(userId) || (user.current_hp || 15000) <= 0) {
        if (!bossChung.defeated_players.includes(userId)) bossChung.defeated_players.push(userId);
        db.setBossChung(guild.id, bossChung);
        const embed = createManyCurielEmbed(
          client,
          `💔 Bạn đã hết HP và không thể tiếp tục tham gia trận boss này.`,
          'BỊ HẠ GỤC'
        );
        await message.reply({ embeds: [embed] });
        return true;
      }

      // Check cooldown 10s
      const lastSkill = bossSkillCooldowns.get(userId) || 0;
      const now = Date.now();
      if (now - lastSkill < 10000) {
        const remainingSecs = Math.ceil((10000 - (now - lastSkill)) / 1000);
        await message.reply({ content: `⏳ Tâm tính chưa ổn định! Vui lòng chờ **${remainingSecs} giây** nữa mới có thể tiếp tục sử dụng Tuyệt Chiêu!` }).catch(() => null);
        return true;
      }
      bossSkillCooldowns.set(userId, now);

      const dmg = calculateBossDamage(user, true);

      bossChung.boss_hp = Math.max(0, bossChung.boss_hp - dmg);
      if (!bossChung.participants[userId]) bossChung.participants[userId] = { damage: 0, healed: 0 };
      bossChung.participants[userId].damage += dmg;

      if (bossChung.boss_hp <= 0) {
        bossChung.is_alive = false;
        await handleBossChungDefeat(client, guild.id, message.channel.id, bossChung, userId);
        return true;
      }

      // Boss Chung phản đòn người chơi
      let bossCounterDmg = Math.floor(Math.random() * 251) + 200;
      user.current_hp = Math.max(0, (user.current_hp || 15000) - bossCounterDmg);
      if (user.current_hp <= 0) {
        bossChung.defeated_players.push(userId);
      }
      db.updateUser(guild.id, userId, { current_hp: user.current_hp });
      db.setBossChung(guild.id, bossChung);

      const activeFighters = Object.keys(bossChung.participants).filter(uid => !bossChung.defeated_players?.includes(uid)).length;

      const embed = createManyCurielEmbed(
        client,
        `💥 <@${userId}> tung tuyệt chiêu **[${skillName}]** gây chấn động đất trời, trừ **-${dmg.toLocaleString()} HP** lên Boss Chung!\n` +
        `• **Máu Boss Chung còn lại:** \`${bossChung.boss_hp.toLocaleString()} / ${bossChung.boss_max_hp.toLocaleString()} HP\`\n\n` +
        `⚔️ **BOSS CHUNG PHẢN CÔNG!**\n` +
        `• 🎯 **Người bị tấn công:** <@${userId}>\n` +
        `• 💥 **Sát thương nhận:** \`${bossCounterDmg.toLocaleString()} HP\`\n` +
        `• ❤️ **HP còn lại:** \`${user.current_hp.toLocaleString()} / ${(user.max_hp || 15000).toLocaleString()} HP\`\n` +
        `• 👥 **Số người còn khả năng chiến đấu:** \`${Math.max(1, activeFighters)}\` tu sĩ\n` +
        (user.current_hp <= 0 ? `\n💔 Bạn đã hết HP và không thể tiếp tục tham gia trận boss này.` : ''),
        'TUYỆT CHIÊU KẾT LIỄU'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    if (bossDon && bossStateValid(bossDon)) {
      const user = db.getOrCreateUser(guild.id, userId);
      const dmg = calculateBossDamage(user, true);
      bossDon.boss_hp = Math.max(0, bossDon.boss_hp - dmg);
      if (bossDon.boss_hp <= 0) {
        endBossCombatSuccess(client, guild.id, userId, message.channel, bossDon, !!bossDon.thread_id);
        return true;
      }

      const bossDmg = Math.floor(Math.random() * 11) + 5;
      bossDon.player_hp = Math.max(0, bossDon.player_hp - bossDmg);

      if (bossDon.player_hp <= 0) {
        endBossCombatFailure(client, userId, message.channel, bossDon, !!bossDon.thread_id);
        return true;
      }

      db.setBossDon(userId, bossDon);
      const embed = createBossStatusEmbed(
        client,
        userId,
        bossDon,
        `💥 <@${userId}> xuất tuyệt chiêu **[${skillName}]** uy lực dũng mãnh gây **-${dmg} HP**!\n💢 **${bossDon.boss_name}** phản kích gây **-${bossDmg} HP**!`
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    return true;
  }

  // 6. Mcheckskill / Mskilllist
  if (cmd === 'checkskill' || cmd === 'skilllist') {
    const user = db.getOrCreateUser(guild.id, userId, message.author.username);
    const skills = user.skills || ['Đạo Lực Chưởng'];

    const embed = createManyCurielEmbed(
      client,
      `📜 **DANH SÁCH KỸ NĂNG CỦA BẠN** 📜\n\n` +
      skills.map((s, i) => `${i + 1}. ✨ **${s}** — *Sát thương: 35 HP | Uy lực dũng mãnh*`).join('\n') +
      `\n\n💡 *Dùng lệnh \`Mtuyetchieu <tên skill>\` trong trận chiến Boss để xuất chiêu!*`,
      'DANH SÁCH KỸ NĂNG'
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 7. Mhoimau (Hồi HP cho bản thân trong Boss Đơn - Tối đa 3 lần)
  if (cmd === 'hoimau') {
    const bossDon = db.getBossDon(userId);
    if (!bossDon || !bossStateValid(bossDon)) {
      const embed = createManyCurielEmbed(client, '⚠️ Bạn không có trận Boss Đơn nào đang diễn ra! Gõ `Mkhieuchien <tên Boss>` để bắt đầu.', 'KHÔNG CÓ TRẬN BOSS');
      await message.reply({ embeds: [embed] });
      return true;
    }

    if (bossDon.heals_used >= 3) {
      const embed = createManyCurielEmbed(client, '⛔ Bạn đã sử dụng hết **3/3 lần** hồi máu trong trận đấu này!', 'HẾT LƯỢT HỒI MÁU');
      await message.reply({ embeds: [embed] });
      return true;
    }

    bossDon.heals_used += 1;
    bossDon.player_hp = Math.min(bossDon.player_max_hp, bossDon.player_hp + 20);
    db.setBossDon(userId, bossDon);

    const embed = createBossStatusEmbed(
      client,
      userId,
      bossDon,
      `💖 <@${userId}> vận chuyển chân khí, hồi phục thành công **+20 HP**! (Còn \`${3 - bossDon.heals_used}/3\` lần)`
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 8. Mhoihuyet @user (Hồi máu cứu đồng đội trong Boss Chung - Tối đa 3 lần)
  if (cmd === 'hoihuyet' || cmd === 'cuudongdoi') {
    const bossChung = db.getBossChung(guild.id);
    if (!bossChung || !bossChung.is_alive || bossChung.channel_id !== message.channel.id) {
      const embed = createManyCurielEmbed(client, '⚠️ Lệnh này chỉ dùng trong kênh Boss Chung khi Boss còn sống!', 'KHÔNG CÓ BOSS CHUNG');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const targetUser = message.mentions.users.first();
    if (!targetUser) {
      const embed = createManyCurielEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`Mhoihuyet @user\``, 'CỨU VIỆN ĐỒNG ĐỘI');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const healsGiven = bossChung.heals_given[userId] || 0;
    if (healsGiven >= 3) {
      const embed = createManyCurielEmbed(client, '⛔ Bạn đã sử dụng hết **3/3 lượt** cứu viện đồng đội trong trận này!', 'HẾT LƯỢT CỨU VIỆN');
      await message.reply({ embeds: [embed] });
      return true;
    }

    bossChung.heals_given[userId] = healsGiven + 1;
    if (!bossChung.participants[userId]) bossChung.participants[userId] = { damage: 0, healed: 0 };
    bossChung.participants[userId].healed += 20;
    db.setBossChung(guild.id, bossChung);

    const embed = createManyCurielEmbed(
      client,
      `💖 <@${userId}> đã truyền linh lực hồi phục **+20 HP** cho đồng đội <@${targetUser.id}>!\n\n` +
      `• **Số lượt cứu viện còn lại của bạn:** \`${3 - (healsGiven + 1)} / 3\` lần`,
      'HỒI HUYẾT CỨU VIỆN'
    );
    await message.reply({ embeds: [embed] });
    return true;
  }

  return false;
}

/**
 * Checks if boss battle state is still valid (not expired > 40s)
 */
function bossStateValid(state: BossCombatState): boolean {
  if (!state) return false;
  if (!state.expires_at) return true;
  return Date.now() < state.expires_at;
}

/**
 * Handles victorious boss combat
 */
function endBossCombatSuccess(
  client: Client,
  guildId: string,
  userId: string,
  channel: any,
  bossState: BossCombatState,
  isThread: boolean
) {
  db.setBossDon(userId, null);
  if (activeBossTimers.has(userId)) {
    clearTimeout(activeBossTimers.get(userId)!);
    activeBossTimers.delete(userId);
  }

  const user = db.getOrCreateUser(guildId, userId);
  let rewardLT = 5000;
  let tier: 'C' | 'B' | 'A' | 'S' = 'B';

  if (bossState.boss_name === 'Điệp Hồ') {
    rewardLT = 10000;
    tier = Math.random() < 0.4 ? 'A' : 'B';
  } else if (bossState.boss_name === 'Hắc Hổ') {
    rewardLT = 15000;
    tier = 'A';
  } else if (bossState.boss_name === 'Hỏa Kỳ Lân') {
    rewardLT = 25000;
    tier = 'S';
  } else {
    rewardLT = 5000;
    tier = 'B';
  }

  user.tinh_khong_thach += rewardLT;

  // Drop Shard
  const randomChar = CHARACTER_NAMES[Math.floor(Math.random() * CHARACTER_NAMES.length)];
  db.addManhNhanVat(guildId, userId, randomChar, tier, 1);
  db.updateUser(guildId, userId, { tinh_khong_thach: user.tinh_khong_thach });

  const winEmbed = createManyCurielEmbed(
    client,
    `🏆 **CHIẾN THẮNG TUYỆT ĐỐI! BẠN ĐÃ TRẢM SÁT ${bossState.boss_name.toUpperCase()}!** 🏆\n\n` +
    `${EMOJIS.STRAWBERRY} **Linh Thạch nhận được:** \`+${rewardLT.toLocaleString()}\` Linh Thạch\n` +
    `${EMOJIS.BUTTERFLY_PINK} **Mảnh Nhân Vật rơi:** \`+1 Mảnh ${tier} — ${randomChar}\` 🧩\n\n` +
    `🎉 *Trận quyết đấu kết thúc trong thời hạn 40 giây! Chủ đề sẽ tự động lưu lại.*`,
    `${EMOJIS.CROWN} CHIẾN THẮNG BOSS ĐƠN`
  );

  channel.send({ embeds: [winEmbed] }).catch(() => null);

  if (isThread && 'setArchived' in channel) {
    setTimeout(() => {
      (channel as ThreadChannel).setArchived(true).catch(() => null);
    }, 5000);
  }
}

/**
 * Handles failed boss combat
 */
function endBossCombatFailure(
  client: Client,
  userId: string,
  channel: any,
  bossState: BossCombatState,
  isThread: boolean
) {
  db.setBossDon(userId, null);
  if (activeBossTimers.has(userId)) {
    clearTimeout(activeBossTimers.get(userId)!);
    activeBossTimers.delete(userId);
  }

  const lossEmbed = createManyCurielEmbed(
    client,
    `${EMOJIS.FAILURE} **BẠI TRẬN!** <@${userId}> đã bị **${bossState.boss_name}** đánh trọng thương!\n` +
    `Hãy tĩnh dưỡng phục hồi sinh mệnh và trang bị đầy đủ trước khi tái đấu.`,
    'THẤT BẠI TRƯỚC BOSS'
  );

  channel.send({ embeds: [lossEmbed] }).catch(() => null);

  if (isThread && 'setArchived' in channel) {
    setTimeout(() => {
      (channel as ThreadChannel).setArchived(true).catch(() => null);
    }, 5000);
  }
}
