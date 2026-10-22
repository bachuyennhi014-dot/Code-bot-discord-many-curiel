import { 
  Message, 
  Client, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType 
} from 'discord.js';
import { db } from '../../database/database.js';
import { createManyCurielEmbed, EMOJIS } from '../../utils/embeds.js';
import { 
  CHARACTER_NAMES, 
  CHARACTER_EMOJIS, 
  normalizeCharacterName 
} from '../../types/cultivation.js';

export async function handleBxhCommands(message: Message, client: Client, args: string[]): Promise<boolean> {
  const guild = message.guild;
  if (!guild) return false;

  const sub = (args[0] || '').toLowerCase();
  const guildConfig = db.getGuildConfig(guild.id);

  // 1. Mbxh tuvi / Mbxh capbac / Mbxh canhgioi (BXH TU VI & CẢNH GIỚI)
  if (sub === 'tuvi' || sub === 'capbac' || sub === 'canhgioi' || sub === 'realm') {
    const sorted = db.getAllUsersSortedByTuVi(guild.id).slice(0, 10);

    let desc = `${EMOJIS.ELYS_BLING7} **BẢNG XẾP HẠNG TU VI & CẢNH GIỚI CAO NHẤT** ${EMOJIS.ELYS_BLING7}\n\n`;
    if (sorted.length === 0) {
      desc += '*Chưa có dữ liệu tu sĩ trên máy chủ.*';
    } else {
      sorted.forEach((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
        desc += `${medal} <@${u.user_id}> — **${u.realm}** (${u.stage})\n` +
                `   └ Tu Vi: \`${u.tu_vi.toLocaleString()}\` EXP | Cống Hiến: \`${u.diem_cong_hien.toLocaleString()}\` điểm\n`;
      });
    }

    const embed = createManyCurielEmbed(client, desc, 'BXH TU VI & CẢNH GIỚI');
    if (sorted.length > 0) {
      const top1User = await client.users.fetch(sorted[0].user_id).catch(() => null);
      if (top1User) embed.setThumbnail(top1User.displayAvatarURL());
    }

    await message.reply({ embeds: [embed] });
    return true;
  }

  // 2. Mbxh tien / Mbxh phuhao (TOP PHÚ HÀO)
  if (sub === 'tien' || sub === 'phuhao') {
    const sorted = db.getAllUsersSortedByTKT(guild.id).slice(0, 10);

    let desc = '💎 **BẢNG XẾP HẠNG TOP PHÚ HÀO (LINH THẠCH)** 💎\n\n';
    if (sorted.length === 0) {
      desc += '*Chưa có dữ liệu người chơi trên máy chủ.*';
    } else {
      sorted.forEach((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
        desc += `${medal} <@${u.user_id}> — **${u.tinh_khong_thach.toLocaleString()}** Linh Thạch\n`;
      });
    }

    const embed = createManyCurielEmbed(client, desc, 'TOP PHÚ HÀO');
    if (sorted.length > 0) {
      const top1User = await client.users.fetch(sorted[0].user_id).catch(() => null);
      if (top1User) {
        embed.setThumbnail(top1User.displayAvatarURL());
      }

      // Auto assign/remove Discord Role Phú Hào
      if (guildConfig.role_phu_hao_id) {
        const newTop1Id = sorted[0].user_id;
        const oldTop1Id = guildConfig.current_phu_hao_user_id;

        if (oldTop1Id && oldTop1Id !== newTop1Id) {
          const oldMember = await guild.members.fetch(oldTop1Id).catch(() => null);
          if (oldMember) await oldMember.roles.remove(guildConfig.role_phu_hao_id).catch(() => null);
        }

        const newMember = await guild.members.fetch(newTop1Id).catch(() => null);
        if (newMember) {
          await newMember.roles.add(guildConfig.role_phu_hao_id).catch(() => null);
        }

        db.updateGuildConfig(guild.id, { current_phu_hao_user_id: newTop1Id });
      }
    }

    await message.reply({ embeds: [embed] });
    return true;
  }

  // 3. Mbxh suutap / Mbxh the (TOP ĐA SỰ - BỘ SƯU TẬP THẺ)
  if (sub === 'suutap' || sub === 'the') {
    const sorted = db.getAllUsersSortedByCards(guild.id).slice(0, 10);

    let desc = `${EMOJIS.LAP_LANH} **BẢNG XẾP HẠNG TOP ĐA SỰ (SƯU TẬP THẺ NHÂN VẬT)** ${EMOJIS.LAP_LANH}\n\n`;
    if (sorted.length === 0) {
      desc += '*Chưa có người chơi nào sưu tập thẻ.*';
    } else {
      sorted.forEach((u, i) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
        const cardCount = db.countTheNhanVat(guild.id, u.user_id);
        const hc1000 = db.count1000HaoCamCharacters(guild.id, u.user_id);
        const titleBadge = i === 0 ? ' [👑 Vạn Tượng Tông Sư]' : '';
        desc += `${medal} <@${u.user_id}>${titleBadge} — **${cardCount}** Thẻ *(Sư phụ 1000 HC: ${hc1000})*\n`;
      });
    }

    desc += `\n✨ *Danh hiệu hồ sơ cho Top 1: [👑 Vạn Tượng Tông Sư / Kẻ Thâu Tóm Ký Ức]*`;

    const embed = createManyCurielEmbed(client, desc, 'TOP ĐA SỰ');
    if (sorted.length > 0) {
      const top1 = await client.users.fetch(sorted[0].user_id).catch(() => null);
      if (top1) embed.setThumbnail(top1.displayAvatarURL());
    }

    await message.reply({ embeds: [embed] });
    return true;
  }

  // 4. Mbxh detu HOẶC Mbxh [Tên Sư Phụ] (TOP ĐẠI ĐỆ TỬ CỦA TỪNG CHAR VỚI NÚT LƯỚT ◀️ ▶️)
  const potentialChar = normalizeCharacterName(args.join(' '));
  if (sub === 'detu' || potentialChar) {
    let charIndex = potentialChar ? CHARACTER_NAMES.indexOf(potentialChar as any) : 0;
    if (charIndex === -1) charIndex = 0;

    const buildCharEmbed = async (idx: number) => {
      const charName = CHARACTER_NAMES[idx];
      const emo = CHARACTER_EMOJIS[charName] || EMOJIS.STAR_BLUE;
      const ranking = db.getAllHaoCamForCharacter(guild.id, charName).slice(0, 10);

      let text = `${emo} **BXH ĐẠI ĐỆ TỬ — ${charName.toUpperCase()}** ${emo}\n\n`;
      if (ranking.length === 0 || ranking[0].hao_cam === 0) {
        text += '*Chưa có đệ tử nào bồi đắp hảo cảm với vị Sư phụ này.*\n';
      } else {
        ranking.forEach((r, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
          const roleTitle = i === 0 ? ` [👑 Đại Đệ Tử Của ${charName}]` : '';
          text += `${medal} <@${r.user.user_id}>${roleTitle} — **${r.hao_cam}** điểm Hảo Cảm\n`;
        });

        // Auto handle character unique role if configured via /setuprole
        const charRoleMap = guildConfig.role_dai_de_tu || {};
        const charRoleId = charRoleMap[charName];
        if (charRoleId && ranking.length > 0) {
          const newTop1Id = ranking[0].user.user_id;
          const newMember = await guild.members.fetch(newTop1Id).catch(() => null);
          if (newMember && !newMember.roles.cache.has(charRoleId)) {
            // Remove from other members first
            const role = await guild.roles.fetch(charRoleId).catch(() => null);
            if (role) {
              for (const member of role.members.values()) {
                if (member.id !== newTop1Id) {
                  await member.roles.remove(charRoleId).catch(() => null);
                }
              }
            }
            await newMember.roles.add(charRoleId).catch(() => null);
          }
        }
      }

      text += `\n📖 **Sư phụ:** [${idx + 1} / ${CHARACTER_NAMES.length}]\n` +
              `💡 *Điểm Hảo Cảm vượt mốc 1000 vẫn tiếp tục được tính cho vị trí Đại Đệ Tử.*\n` +
              `👉 *Sử dụng nút ◀️ và ▶️ bên dưới để lướt xem các Sư phụ khác!*`;

      const emb = createManyCurielEmbed(client, text, 'BXH ĐẠI ĐỆ TỬ (TỪNG CHAR)');
      const imgs = db.getCharacterImages(charName);
      if (imgs.C || imgs.B || imgs.A || imgs.S) {
        emb.setThumbnail(imgs.C || imgs.B || imgs.A || imgs.S || '');
      }
      return emb;
    };

    const getNav = (idx: number) => {
      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_bxh_prev').setLabel('◀️ Sư phụ trước').setStyle(ButtonStyle.Primary).setDisabled(idx === 0),
        new ButtonBuilder().setCustomId('btn_bxh_next').setLabel('▶️ Sư phụ kế tiếp').setStyle(ButtonStyle.Primary).setDisabled(idx === CHARACTER_NAMES.length - 1)
      );
    };

    const initial = await buildCharEmbed(charIndex);
    const replyMsg = await message.reply({ embeds: [initial], components: [getNav(charIndex)] });

    const collector = replyMsg.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      componentType: ComponentType.Button,
      time: 90000
    });

    collector.on('collect', async i => {
      if (i.customId === 'btn_bxh_prev' && charIndex > 0) {
        charIndex--;
      } else if (i.customId === 'btn_bxh_next' && charIndex < CHARACTER_NAMES.length - 1) {
        charIndex++;
      }
      const updatedEmb = await buildCharEmbed(charIndex);
      await i.update({ embeds: [updatedEmb], components: [getNav(charIndex)] });
    });

    return true;
  }

  // 5. Default Mbxh: BẢNG PHONG THẦN (Toàn Server - Tổng Tài Sản & Cày Cuốc)
  const sortedOverall = db.getAllUsersOverall(guild.id).slice(0, 10);
  let overallText = '🌌 **BẢNG PHONG THẦN — XẾP HẠNG TOÀN SERVER (CÀY CUỐC TRÂU BÒ)** 🌌\n\n' +
                    `*Vinh danh tổng hợp dựa trên: Linh Thạch, Mảnh Ký Ức, Thẻ Nhân Vật, Nhân Vật Mở Khóa và Tu Vi:*\n\n`;

  if (sortedOverall.length === 0) {
    overallText += '*Chưa có dữ liệu tu sĩ trên máy chủ.*';
  } else {
    sortedOverall.forEach((u, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**#${i + 1}**`;
      const cards = db.countTheNhanVat(guild.id, u.user_id);
      overallText += `${medal} <@${u.user_id}> — **${u.realm}** (${u.stage})\n` +
                     `   └ ${EMOJIS.LINH_THACH} Linh Thạch: \`${u.tinh_khong_thach.toLocaleString()}\` | Thẻ: \`${cards}\` | ${EMOJIS.MANH_KY_UC} Mảnh Ký Ức: \`${u.manh_ky_uc}\`\n`;
    });
  }

  overallText += `\n📜 **Các Bảng Xếp Hạng Khác:**\n` +
                 `• \`Mbxh tuvi\`: Xếp hạng Tu Vi & Cảnh Giới\n` +
                 `• \`Mbxh tien\`: Top Phú Hào sở hữu Linh Thạch nhiều nhất\n` +
                 `• \`Mbxh suutap\`: Top Đa Sự sưu tập Thẻ Nhân Vật\n` +
                 `• \`Mbxh detu\` / \`Mbxh [Tên Sư Phụ]\`: Top Đại Đệ Tử tranh đoạt ngôi vị`;

  const embed = createManyCurielEmbed(client, overallText, 'BẢNG PHONG THẦN TOÀN SERVER');
  if (sortedOverall.length > 0) {
    const top1 = await client.users.fetch(sortedOverall[0].user_id).catch(() => null);
    if (top1) embed.setThumbnail(top1.displayAvatarURL());
  }

  await message.reply({ embeds: [embed] });
  return true;
}
