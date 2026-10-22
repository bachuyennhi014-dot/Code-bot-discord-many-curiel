import {
  Message,
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ButtonInteraction
} from 'discord.js';
import { db } from '../../database/database.js';
import { createManyCurielEmbed, createErrorEmbed } from '../../utils/embeds.js';
import { EMOJIS } from '../../utils/emojis.js';
import { TimMaySession, CHARACTER_NAMES } from '../../types/cultivation.js';

// Các hằng số emoji cho game Tìm Mây
export const TIM_MAY_EMOJIS = {
  CLOUD: '<a:angelBlob3:1555974609747050678>', // Đám mây ban đầu & trên nút BẮT ĐẦU
  LUCKY: '<a:005_blue_jellyfish:1552625802296959086>', // Đám mây may mắn đã tìm được
  DARK: EMOJIS.DARK_CLOUD, // Đám mây âm u (mây u ám)
};

// Tổng số nút trên bàn cờ: 25 nút (5 hàng x 5 nút, toàn bộ là 25 đám mây: 19 may mắn, 6 u ám)
export const TOTAL_GRID_CELLS = 25;
export const TOTAL_CLOUD_CELLS = 25; // 25 ô đám mây
export const TOTAL_LUCKY_CLOUDS = 19; // 19 đám mây may mắn
export const TOTAL_DARK_CLOUDS = 6; // 6 đám mây u ám (5 cũ + 1 mới thêm vào ô 25)

/**
 * Bảng hệ số thưởng tương ứng với số đám mây may mắn tìm được (từ 1 đến 19):
 * - Lần 1: ×1,2
 * - Lần 2: ×2,5
 * - Lần 3: ×2,8
 * - Lần 4: ×3,0
 * - Tăng dần từ mốc 2 (2.5 -> 2.8 -> 3.0...) lên đến mốc 19 (×7,5)
 */
export const TIM_MAY_MULTIPLIERS: Record<number, number> = {
  1: 1.2,
  2: 2.5,
  3: 2.8,
  4: 3.0,
  5: 3.3,
  6: 3.6,
  7: 3.9,
  8: 4.2,
  9: 4.5,
  10: 4.8,
  11: 5.1,
  12: 5.4,
  13: 5.7,
  14: 6.0,
  15: 6.3,
  16: 6.6,
  17: 6.9,
  18: 7.2,
  19: 7.5,
  20: 7.8,
  21: 8.1,
  22: 8.4,
  23: 8.7,
  24: 9.0,
  25: 9.3
};

// Bộ khóa chống race condition / double-click
const sessionLocks = new Set<string>();

/**
 * Tạo 25 vị trí trong mảng is_dark_cloud:
 * - 25 ô (index 0 -> 24): đúng 6 ô u ám (true) và 19 ô may mắn (false), xáo trộn ngẫu nhiên
 */
export function generateTimMayBoard(): boolean[] {
  // 6 mây u ám (true) và 19 mây may mắn (false) = 25 đám mây
  const cloudCells: boolean[] = [
    true, true, true, true, true, true,
    false, false, false, false, false,
    false, false, false, false, false,
    false, false, false, false, false
  ];
  for (let i = cloudCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloudCells[i], cloudCells[j]] = [cloudCells[j], cloudCells[i]];
  }
  return cloudCells;
}

/**
 * Tạo Embed giới thiệu trò chơi Tìm Mây (Bước 1)
 * (Không hiện bảng thưởng theo từng mốc theo yêu cầu người dùng)
 */
export function buildIntroEmbed(client: Client, betAmount: number) {
  const maxMult = TIM_MAY_MULTIPLIERS[TOTAL_LUCKY_CLOUDS];
  const desc =
    `“Đạo hữu hãy tìm ${TOTAL_LUCKY_CLOUDS} đám mây may mắn trong tổng số ${TOTAL_CLOUD_CELLS} đám mây. Nhưng hãy cẩn thận! ` +
    `Có ${TOTAL_DARK_CLOUDS} đám mây âm u ẩn náu ngẫu nhiên. Chỉ cần chọn nhầm một đám mây âm u, đạo hữu sẽ mất toàn bộ số Linh Thạch đã cược!”\n\n` +
    `💰 **Linh Thạch cược:** \`${betAmount.toLocaleString()}\` Linh Thạch\n` +
    `☁️ **Đám mây cần tìm:** \`${TOTAL_LUCKY_CLOUDS}\` đám mây may mắn\n` +
    `🌫️ **Đám mây âm u:** \`${TOTAL_DARK_CLOUDS}\` đám mây nguy hiểm\n\n` +
    `🏆 **PHẦN THƯỞNG ĐẶC BIỆT:**\n` +
    `Hoàn thành đủ ${TOTAL_LUCKY_CLOUDS} đám mây may mắn sẽ nhận hệ số tối đa **×${maxMult.toString().replace('.', ',')}** và tặng kèm đúng **1 Mảnh S** ngẫu nhiên!\n\n` +
    `👉 *Bấm nút **BẮT ĐẦU!** bên dưới để trải nghiệm vận may!*`;

  return createManyCurielEmbed(client, desc, '☁️ TRÒ CHƠI TÌM MÂY');
}

/**
 * Tạo ActionRow cho màn hình Giới thiệu
 */
export function buildIntroComponents(sessionId: string): ActionRowBuilder<ButtonBuilder>[] {
  const startBtn = new ButtonBuilder()
    .setCustomId(`timmay_start_${sessionId}`)
    .setLabel('BẮT ĐẦU!')
    .setEmoji(TIM_MAY_EMOJIS.CLOUD)
    .setStyle(ButtonStyle.Primary);

  const cashoutBtn = new ButtonBuilder()
    .setCustomId(`timmay_cashout_${sessionId}`)
    .setLabel('💰 NHẬN THƯỞNG')
    .setStyle(ButtonStyle.Success)
    .setDisabled(true);

  return [new ActionRowBuilder<ButtonBuilder>().addComponents(startBtn, cashoutBtn)];
}

export function buildGameBoardComponents(
  session: TimMaySession,
  disabledAll: boolean = false,
  revealAllDark: boolean = false
): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  // 5 hàng x 5 nút = 25 nút đám mây (index 0 -> 24)
  for (let r = 0; r < 5; r++) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    for (let c = 0; c < 5; c++) {
      const idx = r * 5 + c;

      const isRevealed = session.revealed[idx]; // 0: chưa mở, 1: may mắn, 2: u ám
      const isDark = session.is_dark_cloud[idx];

      const btn = new ButtonBuilder().setCustomId(`timmay_pick_${session.id}_${idx}`);

      if (isRevealed === 1) {
        // Đã mở đúng mây may mắn
        btn.setEmoji(TIM_MAY_EMOJIS.LUCKY)
          .setStyle(ButtonStyle.Success)
          .setDisabled(true);
      } else if (isRevealed === 2) {
        // Đã mở trúng mây u ám
        btn.setEmoji(TIM_MAY_EMOJIS.DARK)
          .setStyle(ButtonStyle.Danger)
          .setDisabled(true);
      } else {
        // Chưa mở
        if (revealAllDark && isDark) {
          // Hiển thị vị trí mây u ám sau khi kết thúc ván
          btn.setEmoji(TIM_MAY_EMOJIS.DARK)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
        } else {
          btn.setEmoji(TIM_MAY_EMOJIS.CLOUD)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disabledAll);
        }
      }

      row.addComponents(btn);
    }
    rows.push(row);
  }

  // Thêm hàng thứ 6 chứa nút 💰 NHẬN THƯỞNG / CHỐT LÃI ngay dưới bàn cờ
  const canCashOut = session.lucky_found > 0 && session.step === 'PLAYING' && !disabledAll;
  const cashoutBtn = new ButtonBuilder()
    .setCustomId(`timmay_cashout_${session.id}`)
    .setLabel(session.lucky_found > 0 ? `💰 NHẬN THƯỞNG (${Math.floor(session.bet_amount * (TIM_MAY_MULTIPLIERS[session.lucky_found] || 1)).toLocaleString()} LT)` : '💰 NHẬN THƯỞNG')
    .setStyle(ButtonStyle.Success)
    .setDisabled(!canCashOut);

  rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(cashoutBtn));

  return rows;
}

/**
 * Tạo Embed cập nhật bàn chơi khi đang mở
 */
export function buildPlayingEmbed(client: Client, session: TimMaySession) {
  const currentMult = TIM_MAY_MULTIPLIERS[session.lucky_found] || 0;
  const currentPayout = session.lucky_found > 0 ? Math.floor(session.bet_amount * currentMult) : 0;
  const remainingNeeded = TOTAL_LUCKY_CLOUDS - session.lucky_found;
  const maxMult = TIM_MAY_MULTIPLIERS[TOTAL_LUCKY_CLOUDS];

  const desc =
    `${EMOJIS.ELYS_BLING7} **ĐẠO HỮU ĐANG THỬ VẬN MAY TÌM MÂY!** ${EMOJIS.ELYS_BLING7}\n\n` +
    `☁️ **Số đám mây may mắn đã tìm được:** \`${session.lucky_found} / ${TOTAL_LUCKY_CLOUDS}\`\n` +
    `💰 **Số Linh Thạch đã cược:** \`${session.bet_amount.toLocaleString()}\` Linh Thạch\n` +
    `📈 **Hệ số hiện tại:** \`×${currentMult > 0 ? currentMult.toString().replace('.', ',') : '1,0'}\`\n` +
    `🎁 **Số Linh Thạch dự kiến nhận nếu dừng:** \`${currentPayout.toLocaleString()}\` Linh Thạch\n` +
    `🌫️ **Số lượt chọn còn lại trước khi hoàn thành:** \`${remainingNeeded}\` đám mây\n\n` +
    (session.lucky_found > 0
      ? `💡 *Đạo hữu có thể nhập lệnh **\`Mnhan\`** (hoặc **\`Mnhanthuong\`**) để chốt lãi ngay, hoặc tiếp tục mở mây để săn **×${maxMult.toString().replace('.', ',')} & 1 Mảnh S**! Cẩn thận 6 đám mây u ám!*`
      : `👉 *Hãy nhấp vào một trong các đám mây phía dưới để bắt đầu dò tìm! (Nhập \`Mnhan\` để chốt lãi sau khi chọn trúng ít nhất 1 đám mây).*`);

  return createManyCurielEmbed(client, desc, '☁️ TRÒ CHƠI TÌM MÂY');
}

/**
 * Xử lý lệnh "Mtimmay <số_linh_thạch_cược>"
 */
export async function handleTimMayCommand(
  message: Message,
  client: Client,
  args: string[]
): Promise<void> {
  const guild = message.guild;
  if (!guild) return;

  const userId = message.author.id;
  const userName = message.author.username;
  const maxMult = TIM_MAY_MULTIPLIERS[TOTAL_LUCKY_CLOUDS];

  // 1. Kiểm tra tham số cược
  if (!args[0]) {
    const errorEmbed = createManyCurielEmbed(
      client,
      `☁️ **CÚ PHÁP LỆNH TÌM MÂY:**\n` +
      `• \`Mtimmay <số_linh_thạch_cược>\`\n\n` +
      `Ví dụ: \`Mtimmay 10000\`\n\n` +
      `📌 *Tìm đúng ${TOTAL_LUCKY_CLOUDS} đám mây may mắn trong tổng số ${TOTAL_CLOUD_CELLS} đám mây nhận hệ số tối đa ×${maxMult.toString().replace('.', ',')} và tặng kèm 1 Mảnh S! Nhập \`Mnhan\` để chốt lãi khi chọn được ít nhất 1 mây may mắn. Chọn nhầm 1 trong ${TOTAL_DARK_CLOUDS} mây u ám sẽ mất toàn bộ tiền cược.*`,
      'HƯỚNG DẪN TÌM MÂY'
    );
    await message.reply({ embeds: [errorEmbed] });
    return;
  }

  const rawBet = args[0].replace(/[,._]/g, '');
  const betAmount = parseInt(rawBet, 10);

  if (isNaN(betAmount) || betAmount <= 0 || !Number.isInteger(betAmount)) {
    const errorEmbed = createManyCurielEmbed(
      client,
      `⚠️ **Số Linh Thạch cược không hợp lệ!**\nSố tiền cược phải là một số nguyên dương lớn hơn 0.\nVí dụ: \`Mtimmay 10000\``,
      'LỖI ĐẶT CƯỢC'
    );
    await message.reply({ embeds: [errorEmbed] });
    return;
  }

  // 2. Kiểm tra xem người chơi đã có ván Tìm Mây nào đang diễn ra chưa (chống gian lận / mở nhiều ván đồng thời)
  const existingSession = db.getActiveTimMaySessionByUser(userId);
  if (existingSession) {
    const errorEmbed = createManyCurielEmbed(
      client,
      `⚠️ **Đạo hữu đang có một ván Tìm Mây chưa kết thúc!**\nVui lòng hoàn tất ván chơi hiện tại trước khi bắt đầu ván mới.`,
      'VÁN CHƠI ĐANG DIỄN RA'
    );
    await message.reply({ embeds: [errorEmbed] });
    return;
  }

  // 3. Kiểm tra số dư Linh Thạch
  const user = db.getOrCreateUser(guild.id, userId, userName);
  if (user.tinh_khong_thach < betAmount) {
    const errorEmbed = createManyCurielEmbed(
      client,
      `⚠️ **Số dư Linh Thạch không đủ!**\n` +
      `• Cần cược: \`${betAmount.toLocaleString()}\` Linh Thạch\n` +
      `• Số dư hiện có: \`${user.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n\n` +
      `*Không tạo ván cược do số dư không đủ.*`,
      'SỐ DƯ KHÔNG ĐỦ'
    );
    await message.reply({ embeds: [errorEmbed] });
    return;
  }

  // 4. Trừ Linh Thạch cược ngay khi bắt đầu ván chơi (trừ 1 lần duy nhất)
  const deductSuccess = db.deductTinhKhongThach(
    guild.id,
    userId,
    betAmount,
    `Cược tham gia mini game Tìm Mây: ${betAmount.toLocaleString()} Linh Thạch`
  );

  if (!deductSuccess) {
    const errorEmbed = createErrorEmbed(client, 'Đã xảy ra lỗi khi trừ Linh Thạch cược. Vui lòng thử lại!');
    await message.reply({ embeds: [errorEmbed] });
    return;
  }

  // 5. Khởi tạo phiên chơi mới với 25 vị trí (19 may mắn, 6 u ám)
  const sessionId = `timmay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const board = generateTimMayBoard();

  const newSession: TimMaySession = {
    id: sessionId,
    guild_id: guild.id,
    channel_id: message.channel.id,
    user_id: userId,
    user_name: userName,
    bet_amount: betAmount,
    step: 'INTRO',
    is_dark_cloud: board,
    revealed: new Array(TOTAL_GRID_CELLS).fill(0),
    lucky_found: 0,
    multiplier: 1.0,
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };

  db.setTimMaySession(newSession);

  // 6. Hiển thị Embed giới thiệu trò chơi và nút BẮT ĐẦU!
  const introEmbed = buildIntroEmbed(client, betAmount);
  const introComponents = buildIntroComponents(sessionId);

  const sentMsg = await message.reply({
    embeds: [introEmbed],
    components: introComponents
  });

  newSession.message_id = sentMsg.id;
  db.setTimMaySession(newSession);

  // 7. Tạo Collector xử lý tương tác độc quyền cho tin nhắn này (thời hạn 5 phút)
  setupTimMayCollector(sentMsg, newSession, client);
}

/**
 * Xử lý lệnh chốt lãi / nhận thưởng Tìm Mây qua prefix command (Mnhan / Mnhanthuong / Mdung)
 */
export async function handleCashOutCommand(
  message: Message,
  client: Client
): Promise<void> {
  const guild = message.guild;
  if (!guild) return;
  const userId = message.author.id;

  const session = db.getActiveTimMaySessionByUser(userId);
  if (!session || session.step !== 'PLAYING') {
    const errorEmbed = createManyCurielEmbed(
      client,
      `⚠️ <@${userId}>, đạo hữu không có ván Tìm Mây nào đang diễn ra để chốt lãi!`,
      'CHƯA CÓ VÁN CHƠI'
    );
    await message.reply({ embeds: [errorEmbed] });
    return;
  }

  if (session.lucky_found <= 0) {
    const errorEmbed = createManyCurielEmbed(
      client,
      `⚠️ <@${userId}>, đạo hữu phải tìm được ít nhất 1 đám mây may mắn mới có thể chốt lãi!`,
      'CHƯA TÌM ĐƯỢC MÂY'
    );
    await message.reply({ embeds: [errorEmbed] });
    return;
  }

  const mult = TIM_MAY_MULTIPLIERS[session.lucky_found] || 1;
  const totalPayout = Math.floor(session.bet_amount * mult);

  session.step = 'ENDED';
  session.status = 'CASHED_OUT';
  session.multiplier = mult;
  session.ended_at = new Date().toISOString();
  db.setTimMaySession(session);

  db.addTinhKhongThach(
    session.guild_id,
    session.user_id,
    totalPayout,
    `Thắng mini game Tìm Mây (${session.lucky_found} đám mây x${mult}): +${totalPayout} Linh Thạch`
  );

  const cashoutEmbed = createManyCurielEmbed(
    client,
    `💰 **CHỐT LÃI THÀNH CÔNG!** 💰\n\n` +
    `“Đạo hữu đã quyết định dừng chơi đúng lúc và bảo toàn phần thưởng thắng cuộc!”\n\n` +
    `• ☁️ **Số đám mây may mắn đã tìm:** \`${session.lucky_found} / ${TOTAL_LUCKY_CLOUDS}\`\n` +
    `• 💰 **Linh Thạch đã cược:** \`${session.bet_amount.toLocaleString()}\` Linh Thạch\n` +
    `• 📈 **Hệ số nhận được:** \`×${mult.toString().replace('.', ',')}\`\n` +
    `• 🎁 **Tổng Linh Thạch nhận về:** \`+${totalPayout.toLocaleString()}\` Linh Thạch\n` +
    `• 💵 **Lợi nhuận ròng:** \`+${(totalPayout - session.bet_amount).toLocaleString()}\` Linh Thạch\n\n` +
    `🎉 *Chúc mừng đạo hữu! Hãy nhập \`Mtimmay <số_tiền>\` để thử vận may ván mới.*`,
    '💰 NHẬN THƯỞNG TÌM MÂY'
  );

  const finalComponents = buildGameBoardComponents(session, true, true);
  if (session.message_id) {
    try {
      const channel = await guild.channels.fetch(session.channel_id).catch(() => null);
      if (channel && channel.isTextBased()) {
        const msg = await channel.messages.fetch(session.message_id).catch(() => null);
        if (msg) {
          await msg.edit({ embeds: [cashoutEmbed], components: finalComponents }).catch(() => null);
        }
      }
    } catch {}
  }

  await message.reply({ embeds: [cashoutEmbed] });
}

/**
 * Thiết lập MessageComponentCollector cho ván chơi Tìm Mây
 */
export function setupTimMayCollector(
  msg: Message,
  initialSession: TimMaySession,
  client: Client
) {
  const collector = msg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 5 * 60 * 1000 // 5 phút timeout
  });

  collector.on('collect', async (interaction: ButtonInteraction) => {
    const customId = interaction.customId;

    // 1. Kiểm tra quyền bấm nút: Chỉ người đã nhập lệnh mới được bấm
    if (interaction.user.id !== initialSession.user_id) {
      await interaction.reply({
        content: '❌ Đây không phải ván Tìm Mây của bạn!',
        ephemeral: true
      });
      return;
    }

    // 2. Chống race condition / spam bấm đồng thời
    const lockKey = initialSession.id;
    if (sessionLocks.has(lockKey)) {
      await interaction.deferUpdate().catch(() => null);
      return;
    }
    sessionLocks.add(lockKey);

    try {
      // Nạp phiên mới nhất từ database
      let session = db.getTimMaySession(initialSession.id);
      if (!session || session.status !== 'ACTIVE') {
        sessionLocks.delete(lockKey);
        await interaction.deferUpdate().catch(() => null);
        return;
      }

      // XỬ LÝ NÚT: BẮT ĐẦU!
      if (customId === `timmay_start_${session.id}`) {
        session.step = 'PLAYING';
        db.setTimMaySession(session);

        const playEmbed = buildPlayingEmbed(client, session);
        const playComponents = buildGameBoardComponents(session, false);

        await interaction.update({
          embeds: [playEmbed],
          components: playComponents
        });
        sessionLocks.delete(lockKey);
        return;
      }

      // XỬ LÝ NÚT: DỪNG CHƠI / NHẬN THƯỞNG
      if (customId === `timmay_cashout_${session.id}`) {
        if (session.lucky_found <= 0) {
          sessionLocks.delete(lockKey);
          await interaction.deferUpdate().catch(() => null);
          return;
        }

        const mult = TIM_MAY_MULTIPLIERS[session.lucky_found] || 1;
        const totalPayout = Math.floor(session.bet_amount * mult);

        // Đánh dấu kết thúc ván
        session.step = 'ENDED';
        session.status = 'CASHED_OUT';
        session.multiplier = mult;
        session.ended_at = new Date().toISOString();
        db.setTimMaySession(session);

        // Cộng tiền thưởng vào database (chống cộng 2 lần vì status đã CASHED_OUT)
        db.addTinhKhongThach(
          session.guild_id,
          session.user_id,
          totalPayout,
          `Thắng mini game Tìm Mây (${session.lucky_found} đám mây x${mult}): +${totalPayout} Linh Thạch`
        );

        const cashoutEmbed = createManyCurielEmbed(
          client,
          `💰 **CHỐT LÃI THÀNH CÔNG!** 💰\n\n` +
          `“Đạo hữu đã quyết định dừng chơi đúng lúc và bảo toàn phần thưởng thắng cuộc!”\n\n` +
          `• ☁️ **Số đám mây may mắn đã tìm:** \`${session.lucky_found} / ${TOTAL_LUCKY_CLOUDS}\`\n` +
          `• 💰 **Linh Thạch đã cược:** \`${session.bet_amount.toLocaleString()}\` Linh Thạch\n` +
          `• 📈 **Hệ số nhận được:** \`×${mult.toString().replace('.', ',')}\`\n` +
          `• 🎁 **Tổng Linh Thạch nhận về:** \`+${totalPayout.toLocaleString()}\` Linh Thạch\n` +
          `• 💵 **Lợi nhuận ròng:** \`+${(totalPayout - session.bet_amount).toLocaleString()}\` Linh Thạch\n\n` +
          `🎉 *Chúc mừng đạo hữu! Hãy nhập \`Mtimmay <số_tiền>\` để thử vận may ván mới.*`,
          '💰 NHẬN THƯỞNG TÌM MÂY'
        );

        const finalComponents = buildGameBoardComponents(session, true, true);
        await interaction.update({
          embeds: [cashoutEmbed],
          components: finalComponents
        });

        collector.stop('cashed_out');
        sessionLocks.delete(lockKey);
        return;
      }

      // XỬ LÝ NÚT: CHỌN ĐÁM MÂY (timmay_pick_{id}_{index})
      if (customId.startsWith(`timmay_pick_${session.id}_`)) {
        const idxStr = customId.split(`timmay_pick_${session.id}_`)[1];
        const idx = parseInt(idxStr, 10);

        if (isNaN(idx) || idx < 0 || idx >= TOTAL_CLOUD_CELLS) {
          sessionLocks.delete(lockKey);
          await interaction.deferUpdate().catch(() => null);
          return;
        }

        // Kiểm tra nút đã mở chưa
        if (session.revealed[idx] !== 0) {
          sessionLocks.delete(lockKey);
          await interaction.deferUpdate().catch(() => null);
          return;
        }

        const isDark = session.is_dark_cloud[idx];

        // 1. NẾU CHỌN NHẦM ĐÁM MÂY ÂM U -> THUA NGAY LẬP TỨC
        if (isDark) {
          session.revealed[idx] = 2; // Đánh dấu đã mở âm u
          session.step = 'ENDED';
          session.status = 'LOST';
          session.ended_at = new Date().toISOString();
          db.setTimMaySession(session);

          const loseEmbed = createManyCurielEmbed(
            client,
            `🌫️ **ĐÁM MÂY ÂM U!** 🌫️\n\n` +
            `“Đạo hữu đã chọn nhầm đám mây âm u. Ván chơi kết thúc và toàn bộ Linh Thạch cược đã mất.”\n\n` +
            `• 💔 **Số Linh Thạch đã mất:** \`-${session.bet_amount.toLocaleString()}\` Linh Thạch\n` +
            `• ☁️ **Tổng số đám mây may mắn đã tìm được:** \`${session.lucky_found} / ${TOTAL_LUCKY_CLOUDS}\`\n` +
            `• 🌫️ **Đám mây âm u chọn phải:** Ô số \`#${idx + 1}\`\n\n` +
            `*Toàn bộ 24 vị trí đám mây đã được tiết lộ phía dưới. Chúc đạo hữu may mắn hơn ở lần thử tiếp theo!*`,
            '🌫️ ĐÁM MÂY ÂM U!'
          );

          // Khóa toàn bộ 25 nút và tiết lộ tất cả mây âm u
          const disabledComponents = buildGameBoardComponents(session, true, true);

          await interaction.update({
            embeds: [loseEmbed],
            components: disabledComponents
          });

          collector.stop('lost');
          sessionLocks.delete(lockKey);
          return;
        }

        // 2. NẾU CHỌN ĐÚNG ĐÁM MÂY MAY MẮN
        session.revealed[idx] = 1; // Đánh dấu đã mở may mắn
        session.lucky_found += 1;
        session.multiplier = TIM_MAY_MULTIPLIERS[session.lucky_found] || 1;
        db.setTimMaySession(session);

        // KIỂM TRA ĐẠT ĐỦ ĐÁM MÂY MAY MẮN -> CHIẾN THẮNG HOÀN HẢO!
        if (session.lucky_found >= TOTAL_LUCKY_CLOUDS) {
          session.step = 'ENDED';
          session.status = 'WON';
          session.ended_at = new Date().toISOString();
          db.setTimMaySession(session);

          const finalMult = TIM_MAY_MULTIPLIERS[TOTAL_LUCKY_CLOUDS];
          const totalPayout = Math.floor(session.bet_amount * finalMult);

          // Trả thưởng Linh Thạch theo hệ số tối đa
          db.addTinhKhongThach(
            session.guild_id,
            session.user_id,
            totalPayout,
            `Chiến thắng hoàn hảo mini game Tìm Mây ${TOTAL_LUCKY_CLOUDS}/${TOTAL_LUCKY_CLOUDS} (x${finalMult}): +${totalPayout} Linh Thạch`
          );

          // Tặng thêm đúng 1 Mảnh S cho một nhân vật ngẫu nhiên
          const randomChar = CHARACTER_NAMES[Math.floor(Math.random() * CHARACTER_NAMES.length)];
          const newShardCount = db.addManhNhanVat(session.guild_id, session.user_id, randomChar, 'S', 1);

          const winEmbed = createManyCurielEmbed(
            client,
            `🎉 **CHÚC MỪNG ĐẠO HỮU!** 🎉\n\n` +
            `“Đạo hữu đã tìm đủ ${TOTAL_LUCKY_CLOUDS} đám mây may mắn và vượt qua thử thách Tìm Mây!”\n\n` +
            `• 💰 **Linh Thạch cược:** \`${session.bet_amount.toLocaleString()}\` Linh Thạch\n` +
            `• 📈 **Hệ số:** \`×${finalMult.toString().replace('.', ',')}\`\n` +
            `• 🎁 **Tổng tiền nhận:** \`+${totalPayout.toLocaleString()}\` Linh Thạch\n` +
            `• 🏆 **Phần thưởng thêm:** 🧩 **+1 Mảnh S** — **${randomChar}** *(Hiện có: \`${newShardCount}\` Mảnh S)*\n` +
            `• 💵 **Lợi nhuận ròng:** \`+${(totalPayout - session.bet_amount).toLocaleString()}\` Linh Thạch\n\n` +
            `✨ *Đạo hữu quả là bậc kỳ tài khí vận ngút trời!*`,
            '🎉 CHÚC MỪNG ĐẠO HỮU!'
          );

          const finalComponents = buildGameBoardComponents(session, true, true);
          await interaction.update({
            embeds: [winEmbed],
            components: finalComponents
          });

          collector.stop('won');
          sessionLocks.delete(lockKey);
          return;
        }

        // NẾU CHƯA ĐỦ 20 ĐÁM MÂY: CẬP NHẬT TIẾP BÀN CHƠI
        const updatedPlayEmbed = buildPlayingEmbed(client, session);
        const updatedComponents = buildGameBoardComponents(session, false);

        await interaction.update({
          embeds: [updatedPlayEmbed],
          components: updatedComponents
        });

        sessionLocks.delete(lockKey);
        return;
      }
    } catch (err) {
      console.error('[TIM_MAY INTERACTION ERROR]', err);
    } finally {
      sessionLocks.delete(lockKey);
    }
  });

  collector.on('end', async (_, reason) => {
    sessionLocks.delete(initialSession.id);
    if (reason === 'time') {
      const session = db.getTimMaySession(initialSession.id);
      if (session && session.status === 'ACTIVE') {
        // Hết thời gian mà chưa bấm gì hoặc bỏ dở:
        // Nếu đã mở được ít nhất 1 mây, tự động kết toán tiền cho người chơi theo mốc hiện tại
        if (session.lucky_found > 0) {
          const mult = TIM_MAY_MULTIPLIERS[session.lucky_found] || 1;
          const totalPayout = Math.floor(session.bet_amount * mult);
          session.step = 'ENDED';
          session.status = 'CASHED_OUT';
          session.ended_at = new Date().toISOString();
          db.setTimMaySession(session);

          db.addTinhKhongThach(
            session.guild_id,
            session.user_id,
            totalPayout,
            `Hết giờ mini game Tìm Mây (Tự động nhận thưởng ${session.lucky_found} mây): +${totalPayout} Linh Thạch`
          );

          const timeoutEmbed = createManyCurielEmbed(
            client,
            `⏰ **HẾT THỜI GIAN VÁN CHƠI!**\n\n` +
            `Do quá thời gian không thao tác, hệ thống đã tự động kết toán nhận thưởng ở mốc hiện tại:\n` +
            `• ☁️ Số mây đã tìm: \`${session.lucky_found} / ${TOTAL_LUCKY_CLOUDS}\`\n` +
            `• 💰 Nhận về: \`+${totalPayout.toLocaleString()}\` Linh Thạch (Hệ số ×${mult})`,
            'HẾT GIỜ TÌM MÂY'
          );

          const disabledComponents = buildGameBoardComponents(session, true, true);
          await msg.edit({ embeds: [timeoutEmbed], components: disabledComponents }).catch(() => null);
        } else {
          // Chưa mở đám mây nào mà hết giờ: xem như hủy ván và mất cược
          session.step = 'ENDED';
          session.status = 'LOST';
          session.ended_at = new Date().toISOString();
          db.setTimMaySession(session);

          const timeoutEmbed = createManyCurielEmbed(
            client,
            `⏰ **VÁN CHƠI TÌM MÂY ĐÃ HẾT HẠN!**\n\n` +
            `Đạo hữu không thao tác mở đám mây trong vòng 5 phút. Ván chơi đã kết thúc.\n` +
            `• 💔 Số Linh Thạch cược đã mất: \`-${session.bet_amount.toLocaleString()}\` Linh Thạch`,
            'VÁN CHƠI HẾT HẠN'
          );

          const disabledComponents = buildGameBoardComponents(session, true, true);
          await msg.edit({ embeds: [timeoutEmbed], components: disabledComponents }).catch(() => null);
        }
      }
    }
  });
}
