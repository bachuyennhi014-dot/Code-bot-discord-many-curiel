import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  ChannelType, 
  Client,
  PermissionFlagsBits,
  MessageFlags
} from 'discord.js';
import { db } from '../../database/database.js';
import { createManyCurielEmbed, createErrorEmbed } from '../../utils/embeds.js';
import { isOwner, isQuanLy } from '../../permissions/permissions.js';
import { REALM_ORDER } from '../../types/cultivation.js';

export async function updateHiddenChannelForUser(guild: any, userId: string, realm: string) {
  try {
    const config = db.getGuildConfig(guild.id);
    if (!config.hidden_channel_id) return;
    const channel = await guild.channels.fetch(config.hidden_channel_id).catch(() => null);
    if (!channel) return;

    const realmIdx = REALM_ORDER.indexOf(realm as any);
    const kimDanIdx = REALM_ORDER.indexOf('Kim Đan');

    if (realmIdx >= kimDanIdx) {
      await channel.permissionOverwrites.create(userId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      }).catch(() => null);
    } else {
      await channel.permissionOverwrites.delete(userId).catch(() => null);
    }
  } catch (err) {
    console.error('Error updating hidden channel access:', err);
  }
}

export const slashSetupCommands = [
  // 1. /setupkenhchoi
  {
    data: new SlashCommandBuilder()
      .setName('setupkenhchoi')
      .setDescription('Thiết lập kênh chính thức để chơi Bot Many Curiel')
      .addChannelOption(opt =>
        opt
          .setName('kenh')
          .setDescription('Kênh văn bản dùng để chơi bot')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction, client: Client) {
      const guild = interaction.guild;
      if (!guild) return;

      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ <@${interaction.user.id}> không thể sử dụng lệnh này vì bạn không phải Quản lý.`,
          'TRUY CẬP BỊ TỪ CHỐI'
        );
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

  // 2. /setuprolet1
  {
    data: new SlashCommandBuilder()
      .setName('setuprolet1')
      .setDescription('Thiết lập Role vinh danh Top 1 BXH Điểm Cống Hiến (Chu kỳ 7 ngày)')
      .addRoleOption(opt =>
        opt
          .setName('role')
          .setDescription('Role trao thưởng cho Top 1')
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction, client: Client) {
      const guild = interaction.guild;
      if (!guild) return;

      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ <@${interaction.user.id}> không thể sử dụng lệnh này vì bạn không phải Quản lý.`,
          'TRUY CẬP BỊ TỪ CHỐI'
        );
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
        `👑 **Đã thiết lập Role Top 1 BXH:** <@&${role.id}>\n\n` +
        `• Slot: **Duy nhất 1 người**\n` +
        `• Chu kỳ: **7 ngày** (Bot tự động chốt BXH, gỡ role người cũ và cấp role cho tân vương)`,
        'THIẾT LẬP ROLE TOP 1'
      );

      await interaction.reply({ embeds: [embed] });
    }
  },

  // 3. /setupkenhan
  {
    data: new SlashCommandBuilder()
      .setName('setupkenhan')
      .setDescription('Thiết lập Kênh Ẩn dành riêng cho tu sĩ đạt Kim Đan trở lên')
      .addChannelOption(opt =>
        opt
          .setName('kenh')
          .setDescription('Kênh văn bản / Voice ẩn')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction, client: Client) {
      const guild = interaction.guild;
      if (!guild) return;

      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ <@${interaction.user.id}> không thể sử dụng lệnh này vì bạn không phải Quản lý.`,
          'TRUY CẬP BỊ TỪ CHỐI'
        );
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const channel = interaction.options.getChannel('kenh', true);
      db.updateGuildConfig(guild.id, { hidden_channel_id: channel.id });

      // Automatically convert channel into a hidden channel and add eligible players
      try {
        const textChannel = guild.channels.cache.get(channel.id) || await guild.channels.fetch(channel.id).catch(() => null);
        if (textChannel && 'permissionOverwrites' in textChannel && textChannel.permissionOverwrites) {
          await textChannel.permissionOverwrites.edit(guild.roles.everyone, {
            ViewChannel: false
          }).catch(() => null);

          const allUsers = db.getAllUsers();
          const kimDanIdx = REALM_ORDER.indexOf('Kim Đan');
          for (const user of allUsers) {
            if (user.user_id) {
              const realmIdx = REALM_ORDER.indexOf(user.realm as any);
              if (realmIdx >= kimDanIdx) {
                await textChannel.permissionOverwrites.create(user.user_id, {
                  ViewChannel: true,
                  SendMessages: true,
                  ReadMessageHistory: true
                }).catch(() => null);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error configuring hidden channel permissions:', e);
      }

      const embed = createManyCurielEmbed(
        client,
        `🔮 **Đã thiết lập Kênh Ẩn Tu Tiên:** <#${channel.id}>\n\n` +
        `• **Trạng thái:** Đã tự động chuyển thành kênh ẩn (Ẩn với @everyone).\n` +
        `• **Điều kiện vào:** Đạt cảnh giới **[Kim Đan]** trở lên.\n` +
        `• Bot đã tự động cấp quyền cho các tu sĩ đạt Kim Đan kỳ trở lên vào kênh.`,
        'THIẾT LẬP KÊNH ẨN'
      );

      await interaction.reply({ embeds: [embed] });
    }
  },

  // 4. /setuproletttl
  {
    data: new SlashCommandBuilder()
      .setName('setuproletttl')
      .setDescription('Thiết lập Role Thái Thượng Trưởng Lão (Tự động cấp khi đạt Độ Kiếp)')
      .addRoleOption(opt =>
        opt
          .setName('role')
          .setDescription('Role Thái Thượng Trưởng Lão')
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction, client: Client) {
      const guild = interaction.guild;
      if (!guild) return;

      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ <@${interaction.user.id}> không thể sử dụng lệnh này vì bạn không phải Quản lý.`,
          'TRUY CẬP BỊ TỪ CHỐI'
        );
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const role = interaction.options.getRole('role', true);
      db.updateGuildConfig(guild.id, { role_tttl_id: role.id });

      const embed = createManyCurielEmbed(
        client,
        `⚡ **Đã thiết lập Role Thái Thượng Trưởng Lão:** <@&${role.id}>\n\n` +
        `• **Điều kiện:** Tu sĩ đột phá đạt cảnh giới tối cao **[Độ Kiếp]** sẽ được hệ thống tự động thăng chức và trao Role Discord thật.`,
        'THIẾT LẬP ROLE THÁI THƯỢNG TRƯỞNG LÃO'
      );

      await interaction.reply({ embeds: [embed] });
    }
  },

  // 5. /setuprolephuhao @role
  {
    data: new SlashCommandBuilder()
      .setName('setuprolephuhao')
      .setDescription('Thiết lập Discord Role dành cho người đứng Top 1 BXH Phú Hào')
      .addRoleOption(opt =>
        opt
          .setName('role')
          .setDescription('Discord Role Top 1 Phú Hào')
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction, client: Client) {
      const guild = interaction.guild;
      if (!guild) return;

      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ <@${interaction.user.id}> không thể sử dụng lệnh này vì bạn không phải Quản lý.`,
          'TRUY CẬP BỊ TỪ CHỐI'
        );
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const role = interaction.options.getRole('role', true);
      db.updateGuildConfig(guild.id, { role_phu_hao_id: role.id });

      const embed = createManyCurielEmbed(
        client,
        `👑 **Đã thiết lập Role Top 1 BXH Phú Hào:** <@&${role.id}>\n\n` +
        `• **Cơ chế tự động:**\n` +
        `- Bot tự theo dõi BXH Phú Hào.\n` +
        `- Người đứng Top 1 được nhận Role.\n` +
        `- Khi người khác vượt lên Top 1, bot tự gỡ Role của Top 1 cũ và cấp cho Top 1 mới.\n` +
        `- Chỉ có 1 người giữ Role tại một thời điểm.`,
        'THIẾT LẬP ROLE PHÚ HÀO'
      );

      await interaction.reply({ embeds: [embed] });
    }
  },

  // 6. /setanhthe <tên nhân vật> <cấp ảnh> <link ảnh>
  {
    data: new SlashCommandBuilder()
      .setName('setanhthe')
      .setDescription('Thiết lập ảnh thật cho từng cấp thẻ của nhân vật')
      .addStringOption(opt =>
        opt
          .setName('ten')
          .setDescription('Tên nhân vật (ví dụ: Chu Tinh Dật)')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt
          .setName('cap')
          .setDescription('Cấp ảnh thẻ')
          .addChoices(
            { name: 'Thẻ C', value: 'C' },
            { name: 'Thẻ B', value: 'B' },
            { name: 'Thẻ A', value: 'A' },
            { name: 'Thẻ S', value: 'S' },
            { name: 'Ảnh 1000 Hảo Cảm', value: '1000' }
          )
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt
          .setName('link')
          .setDescription('Đường dẫn link ảnh trực tiếp')
          .setRequired(true)
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    async execute(interaction: ChatInputCommandInteraction, client: Client) {
      const guild = interaction.guild;
      if (!guild) return;

      if (!isOwner(interaction.user.id) && !isQuanLy(interaction.user.id)) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ <@${interaction.user.id}> không thể sử dụng lệnh này vì bạn không phải Quản lý.`,
          'TRUY CẬP BỊ TỪ CHỐI'
        );
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      const rawTen = interaction.options.getString('ten', true);
      const cap = interaction.options.getString('cap', true) as any;
      const link = interaction.options.getString('link', true);

      const { normalizeCharacterName } = await import('../../types/cultivation.js');
      const charName = normalizeCharacterName(rawTen);

      if (!charName) {
        const embed = createManyCurielEmbed(
          client,
          `⚠️ Không tìm thấy nhân vật mang tên **${rawTen}** trong danh sách Sư phụ của hệ thống!`,
          'LỖI TÊN NHÂN VẬT'
        );
        await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        return;
      }

      db.setCharacterImage(charName, cap, link);

      const embed = createManyCurielEmbed(
        client,
        `🎨 **ĐÃ THIẾT LẬP ẢNH THẺ THÀNH CÔNG**\n\n` +
        `• **Nhân vật:** **${charName}**\n` +
        `• **Cấp ảnh:** Thẻ \`${cap}\`\n\n` +
        `*Người chơi dùng lệnh \`Mxemthe ${charName}\` sẽ xem được ảnh trực tiếp (không hiển thị link).*`,
        'THIẾT LẬP ẢNH THẺ NHÂN VẬT'
      );
      embed.setImage(link);

      await interaction.reply({ embeds: [embed] });
    }
  }
];
