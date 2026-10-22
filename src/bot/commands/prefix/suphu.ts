import { 
  Message, 
  Client, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonInteraction,
  CommandInteraction
} from 'discord.js';
import { db } from '../../database/database.js';
import { createManyCurielEmbed, createPermissionDeniedEmbed, EMOJIS } from '../../utils/embeds.js';
import { isOwner, isQuanLy } from '../../permissions/permissions.js';
import { 
  CHARACTER_NAMES, 
  CHARACTER_EMOJIS, 
  getCharacterBuff, 
  normalizeCharacterName,
  REALM_ORDER,
  CardTier
} from '../../types/cultivation.js';
import { getCharacterDialogue, getDefaultExpression } from '../../utils/characterDialogues.js';

// Cooldown map for interactive intimacy actions (10s cooldown)
export const interactionCooldowns = new Map<string, number>();

export const GIFTS_MAP: Record<string, { name: string; price: number; like: number; hate: number; emoji: string }> = {
  hoahong: { name: 'Hoa hồng', price: 5000, like: 10, hate: -15, emoji: '🌹' },
  bohoa: { name: 'Bó hoa', price: 20000, like: 20, hate: -20, emoji: '💐' },
  ngocboi: { name: 'Ngọc bội', price: 50000, like: 45, hate: -50, emoji: '💎' },
  nhandoi: { name: 'Nhẫn đôi', price: 100000, like: 110, hate: -105, emoji: '💍' },
  keodeo: { name: 'Kẹo dẻo', price: 10000, like: 15, hate: -10, emoji: '🍬' },
  khanlen: { name: 'Khăn len tự tay đan', price: 35000, like: 40, hate: -40, emoji: '🧣' },
  tuithom: { name: 'Túi thơm', price: 15000, like: 20, hate: -25, emoji: '🌸' }
};

function calculateCharacterEmotion(
  hc: number, 
  dislikeScore: number, 
  lastAction?: 'kiss' | 'bite' | 'hug' | 'giftLike' | 'giftHate'
): string {
  if (lastAction === 'kiss') {
    return 'E ấp, rung động sâu sắc, trái tim đập rộn ràng đón nhận nụ hôn';
  }
  if (lastAction === 'bite') {
    return 'Dở khóc dở cười, giật mình xoa chỗ đau nhưng cưng chiều vô hạn';
  }
  if (lastAction === 'hug') {
    return 'Ấm áp ngập tràn, bình yên, vòng tay ôm siết lại đầy quyến luyến';
  }
  if (lastAction === 'giftLike') {
    return 'Hân hoan, rạng rỡ, ánh mắt chan chứa nhu tình và hài lòng';
  }
  if (lastAction === 'giftHate') {
    return 'Lúng túng, bối rối, dở khóc dở cười gượng gạo';
  }

  if (dislikeScore >= 500) {
    return 'Có chút xa cách, lạnh lùng và giận dỗi';
  }
  if (hc >= 1000) {
    return 'Say đắm, quyến luyến trọn đời, xem bạn là tri kỷ định mệnh duy nhất';
  }
  if (hc >= 500) {
    return 'Thân thiết, nhu tình, luôn hướng ánh mắt ấm áp về phía bạn';
  }
  if (hc >= 200) {
    return 'Ấm áp, cưng chiều, xem bạn là đệ tử yêu quý';
  }
  return 'Bình thản, tôn nghiêm, ánh mắt hiền hòa bao dung';
}

export const IMG_1000_AFFECTION_REWARD = 'https://cdn.discordapp.com/attachments/1555094084216160326/1557769001831112814/3752c2e8d7c9d6d2fd0d37cd6f45758d.gif?ex=6ac900ef&is=6ac7af6f&hm=a3d7b3625ff24f6df97c3110aa447ae3dc0afb305f3e02b104c07ed91b45a9c0&';

/**
 * Tự động gửi embed chúc mừng vào kênh khi người chơi đạt mốc 1000 Hảo Cảm với nhân vật.
 * Có ảnh hiển thị trực tiếp (không phải dạng text link) và nút NHẬN ẢNH.
 */
export async function checkAndTrigger1000AffectionMilestone(
  client: Client,
  channel: any,
  guildId: string,
  userId: string,
  charName: string
): Promise<void> {
  try {
    const hc = db.getHaoCam(guildId, userId, charName);
    if (hc < 1000) return;
    if (db.is1000NotificationSent(guildId, userId, charName)) return;

    db.mark1000NotificationSent(guildId, userId, charName, channel?.id || '');

    const charIndex = CHARACTER_NAMES.indexOf(charName as any);
    const customId = `btn_open_1000img_${userId}_${charIndex >= 0 ? charIndex : 0}`;

    const embed = createManyCurielEmbed(
      client,
      `🎉 **CHÚC MỪNG ĐẠO HỮU ĐẠT 1.000 ĐIỂM HẢO CẢM!** 💖\n\n` +
      `👑 **Đạo hữu:** <@${userId}>\n` +
      `🌸 **Nhân vật:** **${charName}**\n` +
      `✨ Mối nhân duyên sâu sắc đã thắt chặt, tình cảm chạm mốc **1.000 Hảo Cảm** thiêng liêng!\n` +
      `📸 Phần thưởng ảnh độc quyền đã sẵn sàng. Hãy bấm nút **NHẬN ẢNH** bên dưới để thu thập vào Thư viện ảnh!`,
      `💖 ĐẠT MỐC 1.000 HẢO CẢM — ${charName.toUpperCase()}`
    );
    embed.setImage(IMG_1000_AFFECTION_REWARD);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(customId)
        .setLabel('NHẬN ẢNH')
        .setEmoji('🎁')
        .setStyle(ButtonStyle.Success)
    );

    if (channel && typeof channel.send === 'function') {
      await channel.send({ embeds: [embed], components: [row] });
    }
  } catch (err) {
    console.error('[1000 AFFECTION NOTIFY ERROR]', err);
  }
}

export function buildCharProfilePayload(
  client: Client,
  guildId: string,
  userId: string,
  myMasters: string[],
  idx: number,
  expressionNotice?: string,
  lastAction?: 'kiss' | 'bite' | 'hug' | 'giftLike' | 'giftHate'
) {
  const charName = myMasters[idx];
  const emo = CHARACTER_EMOJIS[charName] || EMOJIS.STAR_BLUE;
  const hc = db.getHaoCam(guildId, userId, charName);
  const buff = getCharacterBuff(charName);
  const gifts = db.getGiftsGiven(guildId, userId, charName);
  const dislikeInfo = db.getDislikeInfo(guildId, userId, charName);
  const user = db.getOrCreateUser(guildId, userId);
  const isCurrentSuPhu = user.su_phu === charName;
  const profileImg = db.getCharProfileImage(charName);

  // Thẻ đã mở khóa
  const unlockedCards: string[] = [];
  const cardTiers: ('C' | 'B' | 'A' | 'S')[] = ['C', 'B', 'A', 'S'];
  for (const t of cardTiers) {
    if (db.hasTheNhanVat(guildId, userId, charName, t)) {
      unlockedCards.push(t);
    }
  }
  if (hc >= 1000) {
    unlockedCards.push('1000 HC');
  }

  // Quà đã tặng
  const giftEntries = Object.entries(gifts);
  let giftStr = '*Chưa từng tặng quà cho vị Sư phụ này*';
  if (giftEntries.length > 0) {
    giftStr = giftEntries.map(([name, count]) => `• **${name}**: \`x${count}\``).join('\n');
  }

  // 1. Thanh tiến trình Hảo Cảm
  const hcVal = Math.max(0, hc);
  const hcPercent = Math.min(100, Math.floor((hcVal / 1000) * 100));
  const barLen = 10;
  const hcFilled = Math.min(barLen, Math.max(0, Math.floor((hcPercent / 100) * barLen)));
  const hcBarStr = '█'.repeat(hcFilled) + '░'.repeat(barLen - hcFilled);

  // 2. Thanh tiến trình Độ Ghét (Tối đa 1000)
  const dislikeScore = Math.max(0, dislikeInfo.score || 0);
  const dislikePercent = Math.min(100, Math.floor((dislikeScore / 1000) * 100));
  const dislikeFilled = Math.min(barLen, Math.max(0, Math.floor((dislikePercent / 100) * barLen)));
  const dislikeBarStr = '█'.repeat(dislikeFilled) + '░'.repeat(barLen - dislikeFilled);

  // 3. Cảm xúc & Biểu cảm
  const emotion = calculateCharacterEmotion(hc, dislikeScore, lastAction);
  const defaultExp = getDefaultExpression(charName);
  const expressionText = expressionNotice ? expressionNotice : defaultExp;

  const lastInteractIso = user.last_interact_su_phu?.[charName];
  let lanhCungNotice = '';
  if (lastInteractIso) {
    const daysSince = Math.floor((Date.now() - new Date(lastInteractIso).getTime()) / (24 * 3600 * 1000));
    if (daysSince >= 3) {
      lanhCungNotice = `\n⚠️ **LÃNH CUNG:** Đã **${daysSince} ngày** không tương tác! Điểm Hảo Cảm đã bị trừ giảm. Hãy bấm các nút bên dưới để hâm nóng tình cảm ngay!`;
    } else {
      lanhCungNotice = `\n⏳ **Tương tác gần nhất:** ${daysSince === 0 ? 'Hôm nay' : `${daysSince} ngày trước`} *(Sau 3 ngày không tương tác sẽ bị trừ Hảo Cảm)*`;
    }
  } else {
    lanhCungNotice = `\n⏳ **Tương tác gần nhất:** Chưa tương tác *(Sau 3 ngày không tương tác sẽ bị trừ Hảo Cảm)*`;
  }

  let desc = `💗 **TÊN NHÂN VẬT:** **${charName.toUpperCase()}** ${emo}\n\n` +
    `💗 **Hảo cảm:** \`[${hcBarStr}]\` **${hc.toLocaleString()}/1000** (${hcPercent}%) ${hc >= 1000 ? '*(Đã đạt 1.000 HC)*' : ''}\n` +
    `💢 **Ghét bỏ:** \`[${dislikeBarStr}]\` **${dislikeScore}/1000** (${dislikePercent}%) (\`${dislikeInfo.count}\` lần không thích quà)\n` +
    `💭 **Cảm xúc:** ${emotion}\n` +
    `✨ **Biểu cảm:** *"${expressionText}"*${lanhCungNotice}\n\n` +
    `🎋 **Trạng thái:** ${isCurrentSuPhu ? '👑 **Đang là Sư phụ chính thức**' : '🎋 *Đã từng bái sư*'}\n` +
    `🎁 **Quà đã tặng:**\n${giftStr}\n\n` +
    `✨ **Nhóm Buff:** **${buff.name}** (\`${buff.description}\`)\n` +
    `🃏 **Thẻ bài:** ${unlockedCards.length > 0 ? unlockedCards.map(t => `\`[Thẻ ${t}]\``).join(' ') : '*Chưa ghép thẻ*'}\n` +
    `📖 **Nhân vật đang xem:** [${idx + 1} / ${myMasters.length}]\n` +
    `👉 *Dùng các nút bên dưới để Tương tác trực tiếp cùng nhân vật!*`;

  const embed = createManyCurielEmbed(client, desc, `HỒ SƠ NHÂN VẬT — ${charName.toUpperCase()}`);
  if (profileImg) {
    embed.setImage(profileImg);
  }

  // 4 Nút tương tác chính theo yêu cầu
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn_char_tangqua').setLabel('🎁 Tặng Quà').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_char_kiss').setLabel('💋 Hôn Môi').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('btn_char_bite').setLabel('👄 Cắn Nhẹ').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_char_hug').setLabel('🤗 Ôm').setStyle(ButtonStyle.Success)
  );

  const rows: ActionRowBuilder<ButtonBuilder>[] = [row1];

  // Nút chuyển nhân vật nếu sở hữu nhiều hơn 1 nhân vật
  if (myMasters.length > 1) {
    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('btn_char_prev').setLabel('◀️ Trước').setStyle(ButtonStyle.Secondary).setDisabled(idx === 0),
      new ButtonBuilder().setCustomId('btn_char_next').setLabel('▶️ Sau').setStyle(ButtonStyle.Secondary).setDisabled(idx === myMasters.length - 1)
    );
    rows.push(row2);
  }

  return { embeds: [embed], components: rows };
}

export function buildGiftMenuPayload(
  client: Client,
  guildId: string,
  userId: string,
  myMasters: string[],
  idx: number
) {
  const charName = myMasters[idx];
  const emo = CHARACTER_EMOJIS[charName] || EMOJIS.STAR_BLUE;
  const curUser = db.getOrCreateUser(guildId, userId);

  const desc = `🎁 **CHỌN QUÀ TẶNG CHO SƯ PHỤ ${charName.toUpperCase()}** ${emo}\n\n` +
    `💎 **Linh Thạch hiện có:** \`${curUser.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n\n` +
    `🌹 **Hoa hồng** (\`5.000\` LT) — *Thích: +10 HC | Ghét: -15 HC*\n` +
    `💐 **Bó hoa** (\`20.000\` LT) — *Thích: +20 HC | Ghét: -20 HC*\n` +
    `💎 **Ngọc bội** (\`50.000\` LT) — *Thích: +45 HC | Ghét: -50 HC*\n` +
    `💍 **Nhẫn đôi** (\`100.000\` LT) — *Thích: +110 HC | Ghét: -105 HC*\n` +
    `🍬 **Kẹo dẻo** (\`10.000\` LT) — *Thích: +15 HC | Ghét: -10 HC*\n` +
    `🧣 **Khăn len tự tay đan** (\`35.000\` LT) — *Thích: +40 HC | Ghét: -40 HC*\n` +
    `🌸 **Túi thơm** (\`15.000\` LT) — *Thích: +20 HC | Ghét: -25 HC*\n\n` +
    `💡 *Lưu ý nhỏ là sở thích của nhân vật là ngẫu nhiên và biến hóa, tặng quà yêu thích sẽ tăng Hảo Cảm và giảm Độ Ghét.*\n` +
    `👉 *Bấm vào nút món quà bên dưới để tặng ngay (sẽ trừ từ túi đồ hoặc trừ Linh Thạch)!*`;

  const embed = createManyCurielEmbed(client, desc, `TẶNG QUÀ CHO ${charName.toUpperCase()}`);

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn_give_hoahong').setLabel('🌹 Hoa hồng (5k)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_give_bohoa').setLabel('💐 Bó hoa (20k)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_give_ngocboi').setLabel('💎 Ngọc bội (50k)').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_give_nhandoi').setLabel('💍 Nhẫn đôi (100k)').setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn_give_keodeo').setLabel('🍬 Kẹo dẻo (10k)').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_give_khanlen').setLabel('🧣 Khăn len (35k)').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_give_tuithom').setLabel('🌸 Túi thơm (15k)').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_gift_back').setLabel('🔙 Quay Lại Hồ Sơ').setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row1, row2] };
}

export function attachCharProfileCollector(
  sentMsg: any,
  client: Client,
  guildId: string,
  userId: string,
  myMasters: string[],
  initialIdx: number
) {
  let targetCharIndex = initialIdx;
  const collector = sentMsg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 300000
  });

  collector.on('collect', async (i: ButtonInteraction) => {
    // 4. CHỈ NGƯỜI GỌI MCHAR ĐƯỢC SỬ DỤNG NÚT
    if (i.user.id !== userId) {
      await i.reply({
        content: '❌ Bạn không thể sử dụng bảng nhân vật của người khác.',
        ephemeral: true
      });
      return;
    }

    const customId = i.customId;
    const charName = myMasters[targetCharIndex];

    // 1. Navigation Prev / Next (Nút chuyển nhân vật)
    if (customId === 'btn_char_prev' && targetCharIndex > 0) {
      targetCharIndex--;
      const payload = buildCharProfilePayload(client, guildId, userId, myMasters, targetCharIndex);
      await i.update(payload);
      return;
    } else if (customId === 'btn_char_next' && targetCharIndex < myMasters.length - 1) {
      targetCharIndex++;
      const payload = buildCharProfilePayload(client, guildId, userId, myMasters, targetCharIndex);
      await i.update(payload);
      return;
    }

    // 2. Open Gift Menu
    if (customId === 'btn_char_tangqua') {
      const giftPayload = buildGiftMenuPayload(client, guildId, userId, myMasters, targetCharIndex);
      await i.update(giftPayload);
      return;
    }

    // 3. Back from Gift Menu to Profile
    if (customId === 'btn_gift_back') {
      const payload = buildCharProfilePayload(client, guildId, userId, myMasters, targetCharIndex);
      await i.update(payload);
      return;
    }

    // 4. Hôn môi (Kiss)
    if (customId === 'btn_char_kiss') {
      const now = Date.now();
      const lastInteract = interactionCooldowns.get(userId) || 0;
      const diff = now - lastInteract;
      if (diff < 10000) {
        const remainingSecs = Math.ceil((10000 - diff) / 1000);
        await i.reply({
          content: `⏳ <@${userId}> vui lòng chờ **${remainingSecs} giây** nữa để tiếp tục tương tác thân mật! *(Cooldown: 10s)*`,
          ephemeral: true
        });
        return;
      }

      interactionCooldowns.set(userId, now);
      db.adjustHaoCam(guildId, userId, charName, 2);
      db.recordInteraction(guildId, userId, charName);
      checkAndTrigger1000AffectionMilestone(client, i.channel, guildId, userId, charName);
      const expression = getCharacterDialogue(charName, 'kiss');
      const payload = buildCharProfilePayload(client, guildId, userId, myMasters, targetCharIndex, expression, 'kiss');
      await i.update(payload);
      return;
    }

    // 5. Cắn nhẹ (Bite)
    if (customId === 'btn_char_bite') {
      const now = Date.now();
      const lastInteract = interactionCooldowns.get(userId) || 0;
      const diff = now - lastInteract;
      if (diff < 10000) {
        const remainingSecs = Math.ceil((10000 - diff) / 1000);
        await i.reply({
          content: `⏳ <@${userId}> vui lòng chờ **${remainingSecs} giây** nữa để tiếp tục tương tác thân mật! *(Cooldown: 10s)*`,
          ephemeral: true
        });
        return;
      }

      interactionCooldowns.set(userId, now);
      db.adjustHaoCam(guildId, userId, charName, 1);
      db.recordInteraction(guildId, userId, charName);
      checkAndTrigger1000AffectionMilestone(client, i.channel, guildId, userId, charName);
      const expression = getCharacterDialogue(charName, 'bite');
      const payload = buildCharProfilePayload(client, guildId, userId, myMasters, targetCharIndex, expression, 'bite');
      await i.update(payload);
      return;
    }

    // 6. Ôm (Hug)
    if (customId === 'btn_char_hug') {
      const now = Date.now();
      const lastInteract = interactionCooldowns.get(userId) || 0;
      const diff = now - lastInteract;
      if (diff < 10000) {
        const remainingSecs = Math.ceil((10000 - diff) / 1000);
        await i.reply({
          content: `⏳ <@${userId}> vui lòng chờ **${remainingSecs} giây** nữa để tiếp tục tương tác thân mật! *(Cooldown: 10s)*`,
          ephemeral: true
        });
        return;
      }

      interactionCooldowns.set(userId, now);
      db.adjustHaoCam(guildId, userId, charName, 2);
      db.recordInteraction(guildId, userId, charName);
      checkAndTrigger1000AffectionMilestone(client, i.channel, guildId, userId, charName);
      const expression = getCharacterDialogue(charName, 'hug');
      const payload = buildCharProfilePayload(client, guildId, userId, myMasters, targetCharIndex, expression, 'hug');
      await i.update(payload);
      return;
    }

    // 7. Process Gift Giving
    if (customId.startsWith('btn_give_')) {
      const giftKey = customId.replace('btn_give_', '');
      const gift = GIFTS_MAP[giftKey];
      if (!gift) {
        await i.reply({ content: '⚠️ Món quà không hợp lệ.', ephemeral: true });
        return;
      }

      const curUser = db.getOrCreateUser(guildId, userId);
      const hasInBag = curUser.inventory?.gifts && (curUser.inventory.gifts[gift.name] || 0) > 0;

      if (hasInBag) {
        curUser.inventory.gifts![gift.name] -= 1;
        db.updateUser(guildId, userId, { inventory: curUser.inventory });
      } else if (curUser.tinh_khong_thach >= gift.price) {
        curUser.tinh_khong_thach -= gift.price;
        db.updateUser(guildId, userId, { tinh_khong_thach: curUser.tinh_khong_thach });
      } else {
        await i.reply({ 
          content: `⛔ Đạo hữu không có **${gift.name}** trong túi trữ vật và cũng không đủ **${gift.price.toLocaleString()} Linh Thạch** để mua tặng trực tiếp!`, 
          ephemeral: true 
        });
        return;
      }

      const isLike = Math.random() < 0.5;
      const delta = isLike ? gift.like : gift.hate;
      db.adjustHaoCam(guildId, userId, charName, delta);
      db.recordGiftGiven(guildId, userId, charName, gift.name, isLike, gift.hate);
      db.recordInteraction(guildId, userId, charName);
      checkAndTrigger1000AffectionMilestone(client, i.channel, guildId, userId, charName);

      const expression = getCharacterDialogue(charName, isLike ? 'giftLike' : 'giftHate');
      const actionType = isLike ? 'giftLike' : 'giftHate';
      const payload = buildCharProfilePayload(client, guildId, userId, myMasters, targetCharIndex, expression, actionType);
      await i.update(payload);
      return;
    }
  });
}

export function hasReachedKimDan(userRealm: string): boolean {
  const userIdx = REALM_ORDER.indexOf(userRealm as any);
  const kimDanIdx = REALM_ORDER.indexOf('Kim Đan');
  return userIdx >= kimDanIdx;
}

// Helper to create the base Msuphu embed and select menus
function createSuPhuListPayload(client: Client, guildId: string, userId: string, username: string) {
  const user = db.getOrCreateUser(guildId, userId, username);
  const isEligible = hasReachedKimDan(user.realm);

  let listText = `${EMOJIS.ELYS_BLING7} **DANH SÁCH 29 VỊ SƯ PHỤ TU CHÂN GIỚI** ${EMOJIS.ELYS_BLING7}\n\n`;
  CHARACTER_NAMES.forEach((name, idx) => {
    const emo = CHARACTER_EMOJIS[name] || EMOJIS.KIREI_STAR_BLUE;
    const buff = getCharacterBuff(name);
    listText += `${emo} **${idx + 1}. ${name}** — *[Buff: ${buff.description}]*\n`;
  });

  listText += `\n${EMOJIS.BLUE_MAIL} **Sư phụ hiện tại:** ${user.su_phu ? `**${user.su_phu}** (Hảo cảm: \`${db.getHaoCam(guildId, userId, user.su_phu)}\` điểm)` : '*Chưa bái sư*'}\n` +
              `${EMOJIS.LAP_LANH} **Cảnh giới của bạn:** **${user.realm}** (${user.stage}) — ${isEligible ? '✅ *(Đã đạt Kim Đan Kỳ — Đủ điều kiện bái sư)*' : '⛔ *(Chưa đạt Kim Đan Kỳ — Chưa thể bái sư)*'}\n` +
              `${EMOJIS.BLUE_HEART_3} **Quy định môn quy:**\n` +
              `  • Đạo hữu **bắt buộc phải đạt từ cảnh giới Kim Đan Kỳ trở lên** mới có thể bái Sư phụ nhập môn tu đạo!\n` +
              `  • Mỗi người chỉ nhận 1 Sư phụ. Sau khi đạt tối thiểu **1.000 điểm Hảo Cảm** với vị Sư phụ này mới được xuất sư đổi sang Sư phụ khác.\n\n` +
              `👉 *Hãy chọn một vị Sư phụ trong menu bên dưới để xem chi tiết và tiến hành Bái Sư!*`;

  const embed = createManyCurielEmbed(client, listText, 'DANH SÁCH SƯ PHỤ');

  const selectMenu1 = new StringSelectMenuBuilder()
    .setCustomId(`select_suphu_1_${userId}`)
    .setPlaceholder('📜 Chọn Sư phụ (Phần 1: 1 - 25)...');

  CHARACTER_NAMES.slice(0, 25).forEach(name => {
    const buff = getCharacterBuff(name);
    selectMenu1.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(name)
        .setDescription(`Buff: ${buff.description}`.substring(0, 50))
        .setValue(name)
    );
  });

  const selectMenu2 = new StringSelectMenuBuilder()
    .setCustomId(`select_suphu_2_${userId}`)
    .setPlaceholder('📜 Chọn Sư phụ (Phần 2: 26 - 29)...');

  CHARACTER_NAMES.slice(25).forEach(name => {
    const buff = getCharacterBuff(name);
    selectMenu2.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(name)
        .setDescription(`Buff: ${buff.description}`.substring(0, 50))
        .setValue(name)
    );
  });

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu1);
  const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu2);

  return { embed, components: [row1, row2] };
}

export async function handleSuPhuCommands(message: Message, client: Client, cmd: string, args: string[]): Promise<boolean> {
  const userId = message.author.id;
  const guild = message.guild;
  if (!guild) return false;

  // 1. Msuphu (Danh Sách 29 Sư Phụ & Chọn Bái Sư)
  if (cmd === 'suphu') {
    const { embed, components } = createSuPhuListPayload(client, guild.id, userId, message.author.username);
    const sentMsg = await message.reply({ embeds: [embed], components });

    const collector = sentMsg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      time: 120000
    });

    collector.on('collect', async i => {
      // 1. Khi người chơi chọn Sư phụ từ Select Menu
      if (i.isStringSelectMenu()) {
        const selectedName = i.values[0];
        const buff = getCharacterBuff(selectedName);
        const emo = CHARACTER_EMOJIS[selectedName] || EMOJIS.STAR_BLUE;
        const hc = db.getHaoCam(guild.id, userId, selectedName);
        const user = db.getOrCreateUser(guild.id, userId);

        // 1. Kiểm tra điều kiện bắt buộc: Đạt cảnh giới Kim Đan Kỳ trở lên
        if (!hasReachedKimDan(user.realm)) {
          const blockedEmbed = createManyCurielEmbed(
            client,
            `⛔ **CHƯA ĐỦ ĐIỀU KIỆN BÁI SƯ** ⛔\n\n` +
            `• **Đạo hữu:** <@${userId}>\n` +
            `• **Cảnh giới hiện tại:** **${user.realm}** (${user.stage})\n` +
            `• **Điều kiện môn quy:** Đạo hữu **bắt buộc phải đạt từ cảnh giới Kim Đan Kỳ trở lên** mới đủ tư cách bái Sư phụ nhập môn tu đạo!\n\n` +
            `💡 *Kể cả dùng lệnh \`Msuphu\` hay \`Mbaisu\`, đạo hữu vẫn phải tích lũy tu vi (\`Mtl\`) và đột phá cảnh giới (\`Mthangcap\`) lên Kim Đan Kỳ trước!*`,
            'CHƯA ĐẠT KIM ĐAN KỲ'
          );

          const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`btn_back_suphu_${userId}`)
              .setLabel('🔙 Quay Lại Danh Sách')
              .setStyle(ButtonStyle.Secondary)
          );

          await i.update({ embeds: [blockedEmbed], components: [backRow] });
          return;
        }

        // Kiểm tra nếu đã có Sư phụ
        if (user.su_phu && user.su_phu !== selectedName) {
          const currentHc = db.getHaoCam(guild.id, userId, user.su_phu);
          if (currentHc < 1000) {
            const blockedEmbed = createManyCurielEmbed(
              client,
              `⛔ **ĐẠO HỮU ĐÃ CÓ SƯ PHỤ**\n\n` +
              `• Sư phụ hiện tại: **${user.su_phu}**\n` +
              `• Điểm Hảo Cảm hiện tại: \`${currentHc} / 1.000\` điểm\n\n` +
              `📌 **Quy định môn quy:** Chỉ nhận được 1 Sư phụ. Sau khi đạt tối thiểu **1.000 điểm Hảo Cảm** với vị Sư phụ này mới được phép xuất sư đổi sang Sư phụ khác!`,
              'CHƯA ĐỦ ĐIỀU KIỆN ĐỔI SƯ PHỤ'
            );

            const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId(`btn_back_suphu_${userId}`)
                .setLabel('🔙 Quay Lại Danh Sách Sư Phụ')
                .setStyle(ButtonStyle.Secondary)
            );

            await i.update({ embeds: [blockedEmbed], components: [backRow] });
            return;
          }
        }

        if (user.su_phu === selectedName) {
          const alreadyEmbed = createManyCurielEmbed(
            client,
            `${emo} **ĐẠO HỮU ĐÃ BÁI ${selectedName} LÀM SƯ PHỤ TỪ TRƯỚC!**\n\n` +
            `✨ **Nhóm Buff:** **${buff.name}**\n` +
            `🌟 **Hiệu Ứng Gia Trì:** \`${buff.description}\`\n` +
            `💖 **Điểm Hảo Cảm:** \`${hc}\` điểm\n\n` +
            `💡 *Hãy tặng quà và tương tác để tích lũy điểm thiện cảm tranh đoạt vị trí Đại Đệ Tử!*`,
            'SƯ PHỤ HIỆN TẠI'
          );

          const backRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId(`btn_back_suphu_${userId}`)
              .setLabel('🔙 Quay Lại Danh Sách')
              .setStyle(ButtonStyle.Secondary)
          );

          await i.update({ embeds: [alreadyEmbed], components: [backRow] });
          return;
        }

        // Bảng hỏi xác nhận chắc chắn bái làm Sư Phụ
        const confirmEmbed = createManyCurielEmbed(
          client,
          `❓ **XÁC NHẬN BÁI SƯ PHỤ** ❓\n\n` +
          `Đạo hữu có chắc chắn muốn bái **${selectedName}** làm Sư Phụ không?\n\n` +
          `✨ **Nhóm Buff:** **${buff.name}**\n` +
          `🌟 **Hiệu Ứng Gia Trì:** \`${buff.description}\`\n` +
          `💖 **Hảo Cảm hiện tại:** \`${hc}\` điểm\n\n` +
          `📌 *Lưu ý: Sau khi bái sư, đạo hữu chỉ có thể đổi sang Sư phụ khác khi đã đạt đủ 1.000 Hảo Cảm với vị Sư phụ này!*`,
          'XÁC NHẬN BÁI SƯ'
        );

        const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`btn_confirm_baisu_${selectedName}`)
            .setLabel('✅ Chắc chắn')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`btn_cancel_baisu_${userId}`)
            .setLabel('❌ Từ chối')
            .setStyle(ButtonStyle.Danger)
        );

        await i.update({ embeds: [confirmEmbed], components: [confirmRow] });
      }

      // 2. Khi người chơi bấm nút Xác nhận / Từ chối / Quay lại
      if (i.isButton()) {
        // Nút Xác nhận Bái Sư
        if (i.customId.startsWith('btn_confirm_baisu_')) {
          const charName = i.customId.replace('btn_confirm_baisu_', '');
          const freshUser = db.getOrCreateUser(guild.id, userId);

          // Kiểm tra điều kiện bắt buộc: Đạt cảnh giới Kim Đan Kỳ trở lên
          if (!hasReachedKimDan(freshUser.realm)) {
            const blockedEmbed = createManyCurielEmbed(
              client,
              `⛔ **CHƯA ĐỦ ĐIỀU KIỆN BÁI SƯ** ⛔\n\n` +
              `• Cảnh giới hiện tại: **${freshUser.realm}** (${freshUser.stage})\n` +
              `• Điều kiện môn quy: Đạo hữu **bắt buộc phải đạt từ cảnh giới Kim Đan Kỳ trở lên** mới có thể bái Sư phụ nhập môn tu đạo!`,
              'CHƯA ĐẠT KIM ĐAN KỲ'
            );
            await i.update({ embeds: [blockedEmbed], components: [] });
            return;
          }

          // Kiểm tra lại điều kiện 1000 hảo cảm nếu đã có sư phụ
          if (freshUser.su_phu && freshUser.su_phu !== charName) {
            const currentHc = db.getHaoCam(guild.id, userId, freshUser.su_phu);
            if (currentHc < 1000) {
              const blockedEmbed = createManyCurielEmbed(
                client,
                `⛔ Đạo hữu cần đạt đủ **1.000 Hảo Cảm** với Sư phụ **${freshUser.su_phu}** mới có thể đổi Sư phụ!`,
                'CHƯA ĐỦ ĐIỀU KIỆN'
              );
              await i.update({ embeds: [blockedEmbed], components: [] });
              return;
            }
          }

          db.setSuPhu(guild.id, userId, charName);
          db.recordInteraction(guild.id, userId, charName);
          const buff = getCharacterBuff(charName);
          const emo = CHARACTER_EMOJIS[charName] || EMOJIS.STAR_BLUE;

          const successEmbed = createManyCurielEmbed(
            client,
            `🎉 **CHÚC MỪNG ĐẠO HỮU ĐÃ BÁI SƯ THÀNH CÔNG!** 🎉\n\n` +
            `👤 **Đồ đệ:** <@${userId}>\n` +
            `🎋 **Sư phụ:** ${emo} **${charName}**\n` +
            `✨ **Nhóm Buff:** **${buff.name}**\n` +
            `🌟 **Hiệu ứng gia trì:** \`${buff.description}\`\n` +
            `💖 **Hảo cảm ban đầu:** \`${db.getHaoCam(guild.id, userId, charName)}\` điểm\n\n` +
            `💡 *Hãy tặng quà (\`Mshop\`) và tương tác (\`Mkiss\`, \`Mhug\`, \`Mbite\`) thường xuyên để vun đắp thiện cảm cùng Sư phụ!*`,
            'BÁI SƯ THÀNH CÔNG'
          );

          await i.update({ embeds: [successEmbed], components: [] });
          return;
        }

        // Nút Từ chối hoặc Quay lại -> Trở về bảng danh sách Sư phụ
        if (i.customId.startsWith('btn_cancel_baisu_') || i.customId.startsWith('btn_back_suphu_')) {
          const { embed: backEmbed, components: backComponents } = createSuPhuListPayload(client, guild.id, userId, message.author.username);
          await i.update({ embeds: [backEmbed], components: backComponents });
          return;
        }
      }
    });

    return true;
  }

  // 2. Mbaisu <tên nhân vật>
  if (cmd === 'baisu') {
    if (args.length === 0) {
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PBEAR} **Cú pháp:** \`Mbaisu <tên nhân vật>\`\n` +
        `• Ví dụ: \`Mbaisu Chu Tinh Dật\` hoặc \`Mbaisu Điệp Hồ\`\n` +
        `• Dùng lệnh \`Msuphu\` để xem danh sách toàn bộ 29 vị Sư phụ!`,
        'BÁI SƯ PHỤ'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const rawChar = args.join(' ');
    const charName = normalizeCharacterName(rawChar);
    if (!charName) {
      const embed = createManyCurielEmbed(
        client,
        `⚠️ Không tìm thấy nhân vật **${rawChar}** trong danh sách Sư phụ! Hãy gõ \`Msuphu\` để xem danh sách.`,
        'LỖI NHÂN VẬT'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const user = db.getOrCreateUser(guild.id, userId, message.author.username);

    // Kiểm tra điều kiện bắt buộc: Đạt cảnh giới Kim Đan Kỳ trở lên
    if (!hasReachedKimDan(user.realm)) {
      const blockedEmbed = createManyCurielEmbed(
        client,
        `⛔ **CHƯA ĐỦ ĐIỀU KIỆN BÁI SƯ** ⛔\n\n` +
        `• **Đạo hữu:** <@${userId}>\n` +
        `• **Cảnh giới hiện tại:** **${user.realm}** (${user.stage})\n` +
        `• **Điều kiện môn quy:** Đạo hữu **bắt buộc phải đạt từ cảnh giới Kim Đan Kỳ trở lên** mới đủ tư cách bái Sư phụ nhập môn tu đạo!\n\n` +
        `💡 *Kể cả dùng lệnh \`Mbaisu\` hay \`Msuphu\`, đạo hữu vẫn phải tích lũy tu vi (\`Mtl\`) và đột phá cảnh giới (\`Mthangcap\`) lên Kim Đan Kỳ trước!*`,
        'CHƯA ĐẠT KIM ĐAN KỲ'
      );
      await message.reply({ embeds: [blockedEmbed] });
      return true;
    }

    // Kiểm tra nếu đã có Sư phụ
    if (user.su_phu && user.su_phu !== charName) {
      const currentHc = db.getHaoCam(guild.id, userId, user.su_phu);
      if (currentHc < 1000) {
        const blockedEmbed = createManyCurielEmbed(
          client,
          `⛔ **ĐẠO HỮU ĐÃ CÓ SƯ PHỤ**\n\n` +
          `• Sư phụ hiện tại: **${user.su_phu}**\n` +
          `• Điểm Hảo Cảm hiện tại: \`${currentHc} / 1.000\` điểm\n\n` +
          `📌 **Quy định môn quy:** Chỉ nhận được 1 Sư phụ. Sau khi đạt tối thiểu **1.000 điểm Hảo Cảm** với vị Sư phụ này mới được phép xuất sư đổi sang Sư phụ khác!`,
          'CHƯA ĐỦ ĐIỀU KIỆN ĐỔI SƯ PHỤ'
        );
        await message.reply({ embeds: [blockedEmbed] });
        return true;
      }
    }

    if (user.su_phu === charName) {
      const alreadyEmbed = createManyCurielEmbed(
        client,
        `🌸 <@${userId}> đã bái **${charName}** làm Sư phụ rồi!\n` +
        `• Điểm Hảo Cảm hiện tại: \`${db.getHaoCam(guild.id, userId, charName)}\` điểm`,
        'SƯ PHỤ HIỆN TẠI'
      );
      await message.reply({ embeds: [alreadyEmbed] });
      return true;
    }

    const buff = getCharacterBuff(charName);
    const emo = CHARACTER_EMOJIS[charName] || EMOJIS.STAR_BLUE;
    const hc = db.getHaoCam(guild.id, userId, charName);

    // Bảng hỏi xác nhận
    const confirmEmbed = createManyCurielEmbed(
      client,
      `❓ **XÁC NHẬN BÁI SƯ PHỤ** ❓\n\n` +
      `Đạo hữu có chắc chắn muốn bái ${emo} **${charName}** làm Sư Phụ không?\n\n` +
      `✨ **Nhóm Buff:** **${buff.name}**\n` +
      `🌟 **Hiệu Ứng Gia Trì:** \`${buff.description}\`\n` +
      `💖 **Hảo Cảm hiện tại:** \`${hc}\` điểm\n\n` +
      `📌 *Lưu ý: Sau khi bái sư, đạo hữu chỉ có thể đổi sang Sư phụ khác khi đã đạt đủ 1.000 Hảo Cảm với vị Sư phụ này!*`,
      'XÁC NHẬN BÁI SƯ'
    );

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_cmd_baisu_confirm_${userId}`)
        .setLabel('✅ Chắc chắn')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`btn_cmd_baisu_cancel_${userId}`)
        .setLabel('❌ Từ chối')
        .setStyle(ButtonStyle.Danger)
    );

    const confirmMsg = await message.reply({ embeds: [confirmEmbed], components: [confirmRow] });

    const collector = confirmMsg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      componentType: ComponentType.Button,
      time: 60000,
      max: 1
    });

    collector.on('collect', async i => {
      if (i.customId === `btn_cmd_baisu_confirm_${userId}`) {
        const freshUser = db.getOrCreateUser(guild.id, userId);

        // Kiểm tra điều kiện bắt buộc: Đạt cảnh giới Kim Đan Kỳ trở lên
        if (!hasReachedKimDan(freshUser.realm)) {
          const blockedEmbed = createManyCurielEmbed(
            client,
            `⛔ **CHƯA ĐỦ ĐIỀU KIỆN BÁI SƯ** ⛔\n\n` +
            `• Cảnh giới hiện tại: **${freshUser.realm}** (${freshUser.stage})\n` +
            `• Điều kiện môn quy: Đạo hữu **bắt buộc phải đạt từ cảnh giới Kim Đan Kỳ trở lên** mới có thể bái Sư phụ!`,
            'CHƯA ĐẠT KIM ĐAN KỲ'
          );
          await i.update({ embeds: [blockedEmbed], components: [] });
          return;
        }

        if (freshUser.su_phu && freshUser.su_phu !== charName) {
          const currentHc = db.getHaoCam(guild.id, userId, freshUser.su_phu);
          if (currentHc < 1000) {
            const blockedEmbed = createManyCurielEmbed(
              client,
              `⛔ Đạo hữu cần đạt đủ **1.000 Hảo Cảm** với Sư phụ **${freshUser.su_phu}** mới có thể đổi Sư phụ!`,
              'CHƯA ĐỦ ĐIỀU KIỆN'
            );
            await i.update({ embeds: [blockedEmbed], components: [] });
            return;
          }
        }

        db.setSuPhu(guild.id, userId, charName);
        db.recordInteraction(guild.id, userId, charName);

        const successEmbed = createManyCurielEmbed(
          client,
          `🎉 **CHÚC MỪNG ĐẠO HỮU ĐÃ BÁI SƯ THÀNH CÔNG!** 🎉\n\n` +
          `👤 **Đồ đệ:** <@${userId}>\n` +
          `🎋 **Sư phụ:** ${emo} **${charName}**\n` +
          `✨ **Nhóm Buff:** **${buff.name}**\n` +
          `🌟 **Hiệu ứng gia trì:** \`${buff.description}\`\n` +
          `💖 **Hảo cảm ban đầu:** \`${db.getHaoCam(guild.id, userId, charName)}\` điểm\n\n` +
          `💡 *Hãy tặng quà (\`Mshop\`) và tương tác (\`Mkiss\`, \`Mhug\`, \`Mbite\`) thường xuyên để vun đắp thiện cảm cùng Sư phụ!*`,
          'BÁI SƯ THÀNH CÔNG'
        );

        await i.update({ embeds: [successEmbed], components: [] });
      } else {
        const cancelEmbed = createManyCurielEmbed(
          client,
          `❌ Đạo hữu đã hủy bỏ bái Sư phụ **${charName}**. Hãy gõ \`Msuphu\` để xem thêm các vị Sư phụ khác!`,
          'ĐÃ HỦY BÁI SƯ'
        );
        await i.update({ embeds: [cancelEmbed], components: [] });
      }
    });

    return true;
  }

  // 3. Mxemthe <tên nhân vật> (Nút ◀️ ▶️ chuyển C -> B -> A -> S -> 1000)
  if (cmd === 'xemthe') {
    if (args.length === 0) {
      const embed = createManyCurielEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`Mxemthe <tên nhân vật>\`\nVí dụ: \`Mxemthe Chu Tinh Dật\``, 'XEM THẺ NHÂN VẬT');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const charName = normalizeCharacterName(args.join(' '));
    if (!charName) {
      const embed = createManyCurielEmbed(client, `⚠️ Không tìm thấy nhân vật trong danh sách Sư phụ!`, 'LỖI NHÂN VẬT');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const imgs = db.getCharacterImages(charName);
    const hc = db.getHaoCam(guild.id, userId, charName);
    const availableTiers: CardTier[] = ['C', 'B', 'A', 'S'];
    if (hc >= 1000) {
      availableTiers.push('1000');
    }

    let tierIndex = 0;

    const buildCardEmbed = (idx: number) => {
      const curTier = availableTiers[idx];
      const imgUrl = imgs[curTier];
      const hasCard = db.hasTheNhanVat(guild.id, userId, charName, curTier as any) || curTier === '1000';

      const embed = createManyCurielEmbed(
        client,
        `🌸 **BỘ SƯU TẬP THẺ — ${charName.toUpperCase()}** 🌸\n\n` +
        `• **Cấp thẻ:** Thẻ \`${curTier}\` ${curTier === '1000' ? '(Mở khóa 1000 Hảo Cảm)' : ''}\n` +
        `• **Tình trạng:** ${hasCard ? '✅ Đã sở hữu' : '🔒 Chưa mở khóa (Dùng `Mghepchong` để ghép)'}\n` +
        `• **Hảo cảm:** \`${hc}\` điểm\n\n` +
        (imgUrl ? `*(Ảnh thẻ hiển thị trực tiếp bên dưới)*` : `*(Chưa có ảnh setup cho cấp này)*`),
        `${EMOJIS.CROWN} THẺ NHÂN VẬT`
      );

      if (imgUrl) {
        embed.setImage(imgUrl);
      }
      return embed;
    };

    const getRow = (idx: number) => {
      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_card_prev').setLabel('◀️').setStyle(ButtonStyle.Primary).setDisabled(idx === 0),
        new ButtonBuilder().setCustomId('btn_card_next').setLabel('▶️').setStyle(ButtonStyle.Primary).setDisabled(idx === availableTiers.length - 1)
      );
    };

    const initialEmbed = buildCardEmbed(tierIndex);
    const cardMsg = await message.reply({ embeds: [initialEmbed], components: [getRow(tierIndex)] });

    const cardCollector = cardMsg.createMessageComponentCollector({
      filter: i => i.user.id === userId,
      componentType: ComponentType.Button,
      time: 90000
    });

    cardCollector.on('collect', async i => {
      if (i.customId === 'btn_card_prev' && tierIndex > 0) {
        tierIndex--;
      } else if (i.customId === 'btn_card_next' && tierIndex < availableTiers.length - 1) {
        tierIndex++;
      }
      await i.update({ embeds: [buildCardEmbed(tierIndex)], components: [getRow(tierIndex)] });
    });

    return true;
  }

  // 4. Mghepchong <tên nhân vật> <cấp> (10 mảnh cùng nhân vật + cùng cấp)
  if (cmd === 'ghepchong' || cmd === 'ghepthe') {
    if (args.length < 2) {
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PBEAR} **Cú pháp:** \`Mghepchong <tên nhân vật> <cấp>\`\n` +
        `• Cấp hợp lệ: \`C\`, \`B\`, \`A\`, \`S\`\n` +
        `• Yêu cầu: \`10 Mảnh\` cùng cấp\n` +
        `• Tỷ lệ thành công: C (100%), B (100%), A (80%), S (50%)\n` +
        `• Thất bại: Mất 5 mảnh, giữ lại 5 mảnh\n` +
        `• Ví dụ: \`Mghepchong Chu Tinh Dật C\``,
        'GHÉP THẺ NHÂN VẬT'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const rawTier = args[args.length - 1].toUpperCase();
    const validTiers = ['C', 'B', 'A', 'S'];
    if (!validTiers.includes(rawTier)) {
      const embed = createManyCurielEmbed(client, '⚠️ Cấp thẻ hợp lệ là `C`, `B`, `A`, `S`!', 'LỖI CẤP THẺ');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const tier = rawTier as 'C' | 'B' | 'A' | 'S';
    const charName = normalizeCharacterName(args.slice(0, -1).join(' '));
    if (!charName) {
      const embed = createManyCurielEmbed(client, '⚠️ Không tìm thấy tên nhân vật trong hệ thống!', 'LỖI NHÂN VẬT');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const shards = db.getManhNhanVat(guild.id, userId, charName);
    if ((shards[tier] || 0) < 10) {
      const embed = createManyCurielEmbed(
        client,
        `⚠️ <@${userId}> không đủ Mảnh để ghép Thẻ **${tier} - ${charName}**!\n\n` +
        `• Hiện có: \`${shards[tier] || 0} / 10\` Mảnh\n` +
        `• Còn thiếu: \`${10 - (shards[tier] || 0)}\` Mảnh`,
        'THIẾU MẢNH GHÉP'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    // Rates: C: 100%, B: 100%, A: 80%, S: 50%
    const rateMap = { C: 100, B: 100, A: 80, S: 50 };
    const successRate = rateMap[tier];
    const roll = Math.floor(Math.random() * 100) + 1;
    const isSuccess = roll <= successRate;

    if (isSuccess) {
      db.addManhNhanVat(guild.id, userId, charName, tier, -10);
      db.addTheNhanVat(guild.id, userId, charName, tier);
      db.recordInteraction(guild.id, userId, charName);

      const embed = createManyCurielEmbed(
        client,
        `🎉 **GHÉP THẺ THÀNH CÔNG!** 🎉\n\n` +
        `• **Nhân vật:** **${charName}**\n` +
        `• **Cấp thẻ mới:** Thẻ \`${tier}\` ✅\n` +
        `• **Tiêu hao:** \`-10 Mảnh ${tier}\`\n\n` +
        `👉 Dùng \`Mxemthe ${charName}\` để chiêm ngưỡng thẻ của người thương!`,
        `${EMOJIS.CROWN} GHÉP THẺ THÀNH CÔNG`
      );
      await message.reply({ embeds: [embed] });
    } else {
      // Failed: Lose 5 shards, keep 5
      db.addManhNhanVat(guild.id, userId, charName, tier, -5);

      const embed = createManyCurielEmbed(
        client,
        `💔 **GHÉP THẺ THẤT BẠI!**\n\n` +
        `• Tỷ lệ thành công: \`${successRate}%\` (Xúc xắc ra: \`${roll}\`)\n` +
        `• Tổn thất: \`-5 Mảnh ${tier}\` (Đã giữ lại 5 mảnh an toàn)\n` +
        `• Số mảnh còn lại: \`${(shards[tier] || 0) - 5}\` Mảnh`,
        'GHÉP THẺ THẤT BẠI'
      );
      await message.reply({ embeds: [embed] });
    }

    return true;
  }

  // 5. Mtangqua <tên nhân vật> <tên món quà>
  if (cmd === 'tangqua') {
    if (args.length < 2) {
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PBEAR} **Cú pháp:** \`Mtangqua <tên nhân vật> <tên món quà>\`\n` +
        `• Danh sách quà tặng: \`Hoa Hồng\`, \`Bó Hoa\`, \`Ngọc Bội\`, \`Nhẫn Đôi\`, \`Kẹo Dẻo\`, \`Khăn Len\`, \`Túi Thơm\`\n` +
        `• Ví dụ: \`Mtangqua Chu Tinh Dật Hoa Hồng\``,
        'TẶNG QUÀ SƯ PHỤ'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const giftsDef: Record<string, { price: number; like: number; hate: number; name: string }> = {
      'hoa hồng': { price: 5000, like: 10, hate: -15, name: 'Hoa Hồng' },
      'hoahong': { price: 5000, like: 10, hate: -15, name: 'Hoa Hồng' },
      'bó hoa': { price: 20000, like: 20, hate: -20, name: 'Bó Hoa' },
      'bohoa': { price: 20000, like: 20, hate: -20, name: 'Bó Hoa' },
      'ngọc bội': { price: 50000, like: 45, hate: -50, name: 'Ngọc Bội' },
      'ngocboi': { price: 50000, like: 45, hate: -50, name: 'Ngọc Bội' },
      'nhẫn đôi': { price: 100000, like: 110, hate: -105, name: 'Nhẫn Đôi' },
      'nhandoi': { price: 100000, like: 110, hate: -105, name: 'Nhẫn Đôi' },
      'kẹo dẻo': { price: 10000, like: 15, hate: -10, name: 'Kẹo Dẻo' },
      'keodeo': { price: 10000, like: 15, hate: -10, name: 'Kẹo Dẻo' },
      'khăn len': { price: 35000, like: 40, hate: -40, name: 'Khăn Len Tự Tay Đan' },
      'khanlen': { price: 35000, like: 40, hate: -40, name: 'Khăn Len Tự Tay Đan' },
      'túi thơm': { price: 15000, like: 20, hate: -25, name: 'Túi Thơm' },
      'tuithom': { price: 15000, like: 20, hate: -25, name: 'Túi Thơm' }
    };

    const fullText = args.join(' ').toLowerCase();
    let matchedGiftKey: string | null = null;
    for (const key of Object.keys(giftsDef)) {
      if (fullText.includes(key)) {
        matchedGiftKey = key;
        break;
      }
    }

    if (!matchedGiftKey) {
      const embed = createManyCurielEmbed(client, '⚠️ Không nhận diện được món quà! Vui lòng kiểm tra lại trong `Mshop`.', 'LỖI QUÀ TẶNG');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const gift = giftsDef[matchedGiftKey];
    // Character name is the rest of text
    const textWithoutGift = fullText.replace(matchedGiftKey, '').trim();
    const charName = normalizeCharacterName(textWithoutGift);

    if (!charName) {
      const embed = createManyCurielEmbed(client, '⚠️ Vui lòng chỉ định tên Sư phụ muốn tặng quà!', 'LỖI NHÂN VẬT');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const user = db.getOrCreateUser(guild.id, userId, message.author.username);
    if (user.tinh_khong_thach < gift.price) {
      const embed = createManyCurielEmbed(
        client,
        `⚠️ <@${userId}> không đủ Tinh Không Thạch để mua **${gift.name}**!\n• Yêu cầu: \`${gift.price.toLocaleString()}\` Linh Thạch\n• Hiện có: \`${user.tinh_khong_thach.toLocaleString()}\``,
        'THIẾU TINH KHÔNG THẠCH'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    // Deduct price
    user.tinh_khong_thach -= gift.price;
    db.updateUser(guild.id, userId, { tinh_khong_thach: user.tinh_khong_thach });

    // Random like/dislike (50% chance like, 50% chance dislike)
    const isLike = Math.random() < 0.5;
    const delta = isLike ? gift.like : gift.hate;
    const newHc = db.adjustHaoCam(guild.id, userId, charName, delta);
    db.recordInteraction(guild.id, userId, charName);

    // Record gift given and dislike stats
    db.recordGiftGiven(guild.id, userId, charName, gift.name, isLike, gift.hate);

    const expression = getCharacterDialogue(charName, isLike ? 'giftLike' : 'giftHate');
    const dislikeInfo = db.getDislikeInfo(guild.id, userId, charName);

    // 1. Thanh tiến trình Hảo Cảm
    const hcPercent = Math.min(100, Math.max(0, Math.floor((Math.max(0, newHc) / 1000) * 100)));
    const barLen = 10;
    const hcFilled = Math.min(barLen, Math.max(0, Math.floor((hcPercent / 100) * barLen)));
    const hcBarStr = '█'.repeat(hcFilled) + '░'.repeat(barLen - hcFilled);

    // 2. Thanh tiến trình Độ Ghét
    const dislikeScore = Math.max(0, dislikeInfo.score || 0);
    const dislikePercent = Math.min(100, dislikeScore);
    const dislikeFilled = Math.min(barLen, Math.max(0, Math.floor((dislikePercent / 100) * barLen)));
    const dislikeBarStr = '█'.repeat(dislikeFilled) + '░'.repeat(barLen - dislikeFilled);

    const embed = createManyCurielEmbed(
      client,
      `🎁 **TẶNG QUÀ CHO: ${charName.toUpperCase()}**\n\n` +
      `• **Món quà:** **${gift.name}** (\`-${gift.price.toLocaleString()}\` Linh Thạch)\n` +
      `• **Phản ứng:** ${isLike ? '💖 **Rất thích món quà này!**' : '💢 **Không thích món quà này...**'}\n` +
      `• **Hảo cảm thay đổi:** \`${delta >= 0 ? '+' : ''}${delta}\` điểm\n\n` +
      `💖 **Tiến Trình Hảo Cảm:**\n\`[${hcBarStr}]\` **${hcPercent}%** (\`${newHc.toLocaleString()} / 1.000\` điểm)\n\n` +
      `💢 **Tiến Trình Độ Ghét:**\n\`[${dislikeBarStr}]\` **${dislikePercent}%** (\`${dislikeScore} / 100\` điểm - \`${dislikeInfo.count}\` lần ghét)\n\n` +
      `📜 **Biểu cảm & cảm xúc của ${charName}:**\n*"${expression}"*\n\n` +
      `*Lưu ý: Sở thích của nhân vật là ngẫu nhiên, tặng quà yêu thích sẽ tăng Hảo Cảm và giảm Độ Ghét.*`,
      'KẾT QUẢ TẶNG QUÀ'
    );

    const profileImg = db.getCharProfileImage(charName);
    if (profileImg) {
      embed.setImage(profileImg);
    }

    await message.reply({ embeds: [embed] });
    await checkAndTrigger1000AffectionMilestone(client, message.channel, guild.id, userId, charName);
    return true;
  }

  // 6. Mkiss, Mbite, Mhug (Lệnh Tương Tác - Cooldown 10s)
  if (cmd === 'kiss' || cmd === 'bite' || cmd === 'hug') {
    if (args.length === 0) {
      const embed = createManyCurielEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`M${cmd} <tên nhân vật>\`\nVí dụ: \`M${cmd} Chu Tinh Dật\``, `TƯƠNG TÁC: ${cmd.toUpperCase()}`);
      await message.reply({ embeds: [embed] });
      return true;
    }

    const now = Date.now();
    const lastInteract = interactionCooldowns.get(userId) || 0;
    const diff = now - lastInteract;
    if (diff < 10000) {
      const remainingSecs = Math.ceil((10000 - diff) / 1000);
      const cdEmbed = createManyCurielEmbed(
        client,
        `⏳ <@${userId}> vui lòng chờ **${remainingSecs} giây** nữa để tiếp tục tương tác thân mật! *(Cooldown: 10s)*`,
        'TƯƠNG TÁC QUÁ NHANH'
      );
      await message.reply({ embeds: [cdEmbed] });
      return true;
    }

    const charName = normalizeCharacterName(args.join(' '));
    if (!charName) {
      const embed = createManyCurielEmbed(client, `⚠️ Không tìm thấy nhân vật trong danh sách Sư phụ!`, 'LỖI NHÂN VẬT');
      await message.reply({ embeds: [embed] });
      return true;
    }

    interactionCooldowns.set(userId, now);
    db.recordInteraction(guild.id, userId, charName);
    const hc = db.getHaoCam(guild.id, userId, charName);
    const emo = CHARACTER_EMOJIS[charName] || EMOJIS.STAR_BLUE;
    const dialogue = getCharacterDialogue(charName, cmd as any);

    const actionTitleMap: Record<string, string> = {
      kiss: '💋 HÔN MÔI SƯ PHỤ',
      bite: '🫦 CẮN NHẸ SƯ PHỤ',
      hug: '🤗 ÔM ẤM ÁP CÙNG SƯ PHỤ'
    };

    const actionDescMap: Record<string, string> = {
      kiss: `<@${userId}> đã nhẹ nhàng đặt một nụ hôn ngọt ngào lên môi của **${charName}**!`,
      bite: `<@${userId}> khẽ cắn nhẹ trêu đùa **${charName}**!`,
      hug: `<@${userId}> đã ôm chầm lấy **${charName}** vào lòng thật ấm áp!`
    };

    const embed = createManyCurielEmbed(
      client,
      `${emo} ${actionDescMap[cmd]}\n\n` +
      `📜 **Phản ứng & Biểu cảm của ${charName}:**\n*"${dialogue}"*\n\n` +
      `💖 **Hảo cảm hiện tại:** \`${hc.toLocaleString()}\` điểm\n` +
      `✨ *Đã cập nhật tương tác thân mật, chống rơi vào Lãnh Cung!*`,
      actionTitleMap[cmd]
    );

    const profileImg = db.getCharProfileImage(charName);
    if (profileImg) {
      embed.setImage(profileImg);
    }

    await message.reply({ embeds: [embed] });
    return true;
  }

  // 7. Mchar [tên nv] (Xem hồ sơ các Sư phụ đã bái: Hảo cảm, Quà đã tặng + số lượng, Độ ghét, Ảnh đại diện, Nút tương tác & Biểu cảm)
  if (cmd === 'char' || cmd === 'chong' || cmd === 'mychar') {
    const myMasters = db.getBaiSuList(guild.id, userId);

    if (myMasters.length === 0) {
      const emptyEmbed = createManyCurielEmbed(
        client,
        `🌸 <@${userId}> hiện tại **chưa bái vị Sư phụ nào** trong tu chân giới!\n\n` +
        `• Lệnh \`Mchar\` chỉ hiển thị hồ sơ các vị Sư phụ đạo hữu đã bái sư.\n` +
        `• Để bái Sư phụ, hãy nhập lệnh \`Msuphu\` để xem danh sách 29 vị Sư phụ và chọn bái sư.\n` +
        `• Hoặc dùng lệnh nhanh: \`Mbaisu <tên nhân vật>\``,
        'CHƯA CÓ SƯ PHỤ'
      );
      await message.reply({ embeds: [emptyEmbed] });
      return true;
    }

    const user = db.getOrCreateUser(guild.id, userId, message.author.username);
    let targetCharIndex = 0;

    if (args.length > 0) {
      const parsedChar = normalizeCharacterName(args.join(' '));
      if (!parsedChar) {
        const notFoundEmbed = createManyCurielEmbed(
          client,
          `⚠️ Không tìm thấy nhân vật **${args.join(' ')}** trong danh sách Sư phụ!`,
          'LỖI NHÂN VẬT'
        );
        await message.reply({ embeds: [notFoundEmbed] });
        return true;
      }

      if (!myMasters.includes(parsedChar)) {
        const notBaiedEmbed = createManyCurielEmbed(
          client,
          `⛔ Đạo hữu <@${userId}> **chưa từng bái ${parsedChar} làm Sư phụ**!\n\n` +
          `• Lệnh \`Mchar\` chỉ dùng để xem hồ sơ các vị Sư phụ đạo hữu đã bái sư.\n` +
          `• Danh sách Sư phụ đã bái của bạn: ${myMasters.map(m => `**${m}**`).join(', ')}\n\n` +
          `👉 *Hãy dùng lệnh \`Msuphu\` để xem danh sách môn quy hoặc bái sư!*`,
          'CHƯA BÁI SƯ PHỤ NÀY'
        );
        await message.reply({ embeds: [notBaiedEmbed] });
        return true;
      }

      targetCharIndex = myMasters.indexOf(parsedChar);
    } else if (user.su_phu && myMasters.includes(user.su_phu)) {
      targetCharIndex = myMasters.indexOf(user.su_phu);
    }

    const initialPayload = buildCharProfilePayload(client, guild.id, userId, myMasters, targetCharIndex);
    const charMsg = await message.reply(initialPayload);

    attachCharProfileCollector(charMsg, client, guild.id, userId, myMasters, targetCharIndex);
    return true;
  }

  // 8. Mtestanh <tên nv> (Xem ảnh hồ sơ của nv đó - chỉ cho Owner, Quản Lý)
  if (cmd === 'testanh' || cmd === 'mtestanh' || cmd === 'checkanh' || cmd === 'htestanh') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    if (args.length === 0) {
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PBEAR} **Cú pháp:** \`Mtestanh <tên nhân vật>\`\n• Ví dụ: \`Mtestanh Chu Tinh Dật\`\n• Quyền hạn: **Quản Lý**`,
        'KIỂM TRA ẢNH NHÂN VẬT'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const charName = normalizeCharacterName(args.join(' '));
    if (!charName) {
      const embed = createManyCurielEmbed(client, '⚠️ Không tìm thấy tên nhân vật trong danh sách Sư phụ!', 'LỖI NHÂN VẬT');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const profileImg = db.getCharProfileImage(charName);
    const allImgs = db.getCharacterImages(charName);

    if (!profileImg && !allImgs.C && !allImgs.B && !allImgs.A && !allImgs.S && !allImgs['1000']) {
      const embed = createManyCurielEmbed(
        client,
        `⚠️ Sư phụ **${charName}** chưa được cài đặt bất kỳ ảnh nào!\n\n` +
        `• Dùng lệnh \`/setanhchar ${charName} <url>\` để set ảnh đại diện hồ sơ.\n` +
        `• Dùng lệnh \`/setanhthe ${charName} <cấp> <url>\` để set ảnh thẻ.`,
        'CHƯA CÓ ẢNH'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const desc = `🖼️ **HỆ THỐNG KIỂM TRA ẢNH SƯ PHỤ — ${charName.toUpperCase()}**\n\n` +
      `• **Người thực hiện:** <@${userId}> *(Quản Lý)*\n` +
      `• **Ảnh hồ sơ chính (/setanhchar):** ${allImgs.profile ? `[Xem link](${allImgs.profile})` : '*Chưa thiết lập*'}\n` +
      `• **Ảnh thẻ C:** ${allImgs.C ? `[Xem link](${allImgs.C})` : '*Chưa có*'}\n` +
      `• **Ảnh thẻ B:** ${allImgs.B ? `[Xem link](${allImgs.B})` : '*Chưa có*'}\n` +
      `• **Ảnh thẻ A:** ${allImgs.A ? `[Xem link](${allImgs.A})` : '*Chưa có*'}\n` +
      `• **Ảnh thẻ S:** ${allImgs.S ? `[Xem link](${allImgs.S})` : '*Chưa có*'}\n` +
      `• **Ảnh thẻ 1000 HC:** ${allImgs['1000'] ? `[Xem link](${allImgs['1000']})` : '*Chưa có*'}\n\n` +
      `👉 *Ảnh hiển thị thực tế trên lệnh \`Mchar\` & \`Mxemthe\`:*`;

    const embed = createManyCurielEmbed(client, desc, `${EMOJIS.CROWN} TEST ẢNH SƯ PHỤ`);
    if (profileImg) {
      embed.setImage(profileImg);
    }
    await message.reply({ embeds: [embed] });
    return true;
  }

  // 9. Msetanh / Msetanhchar <tên nv> <url ảnh> (Prefix command tương đương /setanh)
  if (cmd === 'setanh' || cmd === 'setanhchar' || cmd === 'setanhhoso') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    if (args.length < 2) {
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PBEAR} **Cú pháp:** \`Msetanhchar <tên nhân vật> <link ảnh>\`\n` +
        `• Ví dụ: \`Msetanhchar Chu Tinh Dật https://example.com/avatar.jpg\`\n` +
        `• Sau khi cài đặt, dùng lệnh \`Mchar\` sẽ hiển thị ảnh này trên Embed!`,
        'CÀI ĐẶT ẢNH HỒ SƠ'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const url = args[args.length - 1];
    const rawChar = args.slice(0, -1).join(' ');
    const charName = normalizeCharacterName(rawChar);

    if (!charName) {
      const embed = createManyCurielEmbed(client, `⚠️ Không tìm thấy nhân vật **${rawChar}** trong danh sách Sư phụ!`, 'LỖI NHÂN VẬT');
      await message.reply({ embeds: [embed] });
      return true;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const embed = createManyCurielEmbed(client, '⚠️ Đường dẫn ảnh không hợp lệ! Vui lòng cung cấp URL bắt đầu bằng `http://` hoặc `https://`.', 'LỖI URL');
      await message.reply({ embeds: [embed] });
      return true;
    }

    db.setCharProfileImage(charName, url);

    const embed = createManyCurielEmbed(
      client,
      `✅ **ĐÃ CÀI ĐẶT ẢNH HỒ SƠ THÀNH CÔNG!**\n\n` +
      `• **Nhân vật:** **${charName}**\n` +
      `• **Link ảnh:** [Bấm để xem ảnh](${url})\n` +
      `• **Người thiết lập:** <@${userId}>\n\n` +
      `👉 *Giờ đây khi người chơi nhập lệnh \`Mchar\` hoặc \`Mchar ${charName}\`, ảnh này sẽ hiển thị trực tiếp trên Embed!*`,
      'THIẾT LẬP ẢNH HỒ SƠ CHAR'
    );
    embed.setImage(url);

    await message.reply({ embeds: [embed] });
    return true;
  }

  // 10. Msetanhthe <tên nv> <cấp C/B/A/S/1000> <link ảnh>
  if (cmd === 'setanhthe' || cmd === 'setthe' || cmd === 'setupanh') {
    if (!isOwner(userId) && !isQuanLy(userId)) {
      const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
      await message.reply({ embeds: [embed] });
      return true;
    }

    if (args.length < 3) {
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PBEAR} **Cú pháp:** \`Msetanhthe <tên nhân vật> <cấp C/B/A/S/1000> <link ảnh>\`\n` +
        `• Ví dụ: \`Msetanhthe Chu Tinh Dật S https://example.com/card_s.jpg\`\n` +
        `• Ví dụ ảnh 1000: \`Msetanhthe Sở Dạ Ly 1000 https://example.com/aff1000.jpg\`\n` +
        `• Sau khi cài đặt, ảnh sẽ hiển thị khi xem thẻ (\`Mxemthe\`) và vào Thư Viện Ảnh (\`Mthuvien\`)!`,
        'CÀI ĐẶT ẢNH THẺ NHÂN VẬT'
      );
      await message.reply({ embeds: [embed] });
      return true;
    }

    const url = args[args.length - 1];
    const rawTier = args[args.length - 2].toUpperCase();
    const rawChar = args.slice(0, -2).join(' ');
    const charName = normalizeCharacterName(rawChar);

    if (!charName) {
      const embed = createManyCurielEmbed(client, `⚠️ Không tìm thấy nhân vật **${rawChar}** trong danh sách Sư phụ!`, 'LỖI NHÂN VẬT');
      await message.reply({ embeds: [embed] });
      return true;
    }

    const validTiers = ['C', 'B', 'A', 'S', '1000', '1000_AFFECTION'];
    if (!validTiers.includes(rawTier)) {
      const embed = createManyCurielEmbed(client, `⚠️ Cấp thẻ không hợp lệ! Vui lòng chọn một trong các cấp: \`C\`, \`B\`, \`A\`, \`S\`, hoặc \`1000\`.`, 'LỖI CẤP THẺ');
      await message.reply({ embeds: [embed] });
      return true;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const embed = createManyCurielEmbed(client, '⚠️ Đường dẫn ảnh không hợp lệ! Vui lòng cung cấp URL bắt đầu bằng `http://` hoặc `https://`.', 'LỖI URL');
      await message.reply({ embeds: [embed] });
      return true;
    }

    db.setCharacterImage(charName, rawTier === '1000_AFFECTION' ? '1000' : (rawTier as any), url);

    const embed = createManyCurielEmbed(
      client,
      `✅ **ĐÃ CÀI ĐẶT ẢNH THẺ THÀNH CÔNG!**\n\n` +
      `• **Nhân vật:** **${charName}**\n` +
      `• **Phân cấp:** Thẻ cấp **${rawTier}**\n` +
      `• **Link ảnh:** [Bấm để xem ảnh](${url})\n` +
      `• **Người thiết lập:** <@${userId}>\n\n` +
      `👉 *Ảnh đã được đồng bộ vào hệ thống \`Mxemthe\`, \`Mthuvien\` và \`Mxemthuvien\`!*`,
      'THIẾT LẬP ẢNH THẺ'
    );
    embed.setImage(url);

    await message.reply({ embeds: [embed] });
    return true;
  }

  return false;
}
