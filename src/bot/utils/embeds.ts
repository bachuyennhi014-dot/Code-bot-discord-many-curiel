import { EmbedBuilder, Client, User } from 'discord.js';
import { EMOJIS, formatTitleWithWings, WING_SETS } from './emojis.js';

export { EMOJIS, formatTitleWithWings, WING_SETS };

export const BOT_EMBED_COLOR = 0xBEE6FF;
export const OWNER_EMBED_COLOR = 0xFFFCD5; // Màu embed riêng cho lệnh Owner (#fffcd5)
export const BOT_FOOTER_TEXT = 'Khoảng không nhỏ của Many Curiel';

/**
 * Creates standard Many Curiel embed with color #BEE6FF, no timestamp, standard footer
 * Tiêu đề embed luôn bắt buộc được bọc bởi bộ cánh Discord chuẩn cặp theo yêu cầu
 */
export function createManyCurielEmbed(client: Client, description?: string, title?: string, wingIndex?: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(BOT_EMBED_COLOR)
    .setFooter({
      text: BOT_FOOTER_TEXT,
      iconURL: client.user?.displayAvatarURL() || undefined
    });

  if (title) {
    embed.setTitle(formatTitleWithWings(title, wingIndex));
  }
  if (description) embed.setDescription(description);

  return embed;
}

/**
 * Creates owner embed with color #fffcd5, no timestamp, standard footer
 * Tiêu đề embed luôn bắt buộc được bọc bởi bộ cánh Discord chuẩn cặp theo yêu cầu
 */
export function createOwnerEmbed(client: Client, description?: string, title?: string, wingIndex?: number): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(OWNER_EMBED_COLOR)
    .setFooter({
      text: BOT_FOOTER_TEXT,
      iconURL: client.user?.displayAvatarURL() || undefined
    });

  if (title) {
    embed.setTitle(formatTitleWithWings(title, wingIndex));
  }
  if (description) embed.setDescription(description);

  return embed;
}

export function createErrorEmbed(client: Client, message: string = 'Đã xảy ra lỗi khi xử lý lệnh.'): EmbedBuilder {
  return createManyCurielEmbed(client, `${EMOJIS.PRAY} ${message}`);
}

export function createPermissionDeniedEmbed(client: Client, user: User, targetRole: 'OWNER' | 'QUAN_LY' | 'STAFF' | 'PLAYER'): EmbedBuilder {
  if (targetRole === 'OWNER') {
    return createManyCurielEmbed(client, `${EMOJIS.PRAY} <@${user.id}>, bạn không có quyền sử dụng lệnh này.`);
  }
  return createManyCurielEmbed(client, `${EMOJIS.PRAY} <@${user.id}> không thể sử dụng lệnh này vì bạn không phải Quản lý/Staff.`);
}
