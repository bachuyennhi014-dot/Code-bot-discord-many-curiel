import { Client, ActivityType, REST, Routes } from 'discord.js';
import { db } from '../database/database.js';
import { getOwnerId } from '../permissions/permissions.js';
import { allSlashCommands } from '../commands/slash/allCommands.js';

export async function onReady(client: Client): Promise<void> {
  if (!client.user) return;

  const updatePresence = () => {
    if (!client.user) return;
    client.user.setPresence({
      activities: [{ name: 'dùng lệnh Mhelp để xem các lệnh của bot', type: ActivityType.Playing }],
      status: 'online'
    });
  };

  updatePresence();
  setInterval(updatePresence, 15 * 60 * 1000);

  const banner = `
============================================================
       🌌 DISCORD BOT MANY CURIEL (TU TIÊN) IS ONLINE
============================================================
  • Bot Tag:         ${client.user.tag}
  • Bot ID:          ${client.user.id}
  • Owner ID:        ${getOwnerId()}
  • Prefix Owner:    H (Ví dụ: Hgive, Hchecksv, Hcb, Hadmin)
  • Prefix Thường:   M (Ví dụ: Mtuvi, Mdiemdanh, Mdottpha, Mbxh, Mhelp)
  • Setup Slash:     / (Ví dụ: /setupanh, /setanh, /setupkenhchoi)
  • Embed Color:     #BEE6FF (Khoảng không nhỏ của Many Curiel)
  • Database:        Persistent JSON Engine OK
============================================================
`;
  console.log('\x1b[36m' + banner + '\x1b[0m');

  // Automatic Slash Commands Sync on Bot Startup
  const token = process.env.DISCORD_TOKEN;
  if (token) {
    try {
      console.log('[COMMAND] Đang đăng ký slash commands...');
      const rest = new REST({ version: '10' }).setToken(token);
      const commandsData = allSlashCommands.map(cmd => cmd.data.toJSON());

      // 1. Register to specific GUILD_ID if configured
      const envGuildId = process.env.DISCORD_GUILD_ID || process.env.GUILD_ID;
      if (envGuildId) {
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, envGuildId),
          { body: commandsData }
        );
        console.log(`[COMMAND] Đã đồng bộ ${commandsData.length} slash commands cho Guild ${envGuildId}`);
      }

      // 2. Register to all guilds currently joined by the client
      for (const guild of client.guilds.cache.values()) {
        try {
          await rest.put(
            Routes.applicationGuildCommands(client.user.id, guild.id),
            { body: commandsData }
          );
        } catch (guildErr: any) {
          console.warn(`[COMMAND WARNING] Không thể sync lệnh cho guild ${guild.name} (${guild.id}):`, guildErr.message);
        }
      }

      // 3. Register Global commands
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commandsData }
      );

      console.log(`[COMMAND] Đã đăng ký ${commandsData.length} slash commands.`);
      console.log('[COMMAND] /setupanh đã đăng ký.');
      console.log('[COMMAND] /setanh đã đăng ký.');
    } catch (syncErr: any) {
      console.error('[COMMAND SYNC ERROR] Không thể đăng ký slash commands:', syncErr.message);
    }
  }

  // Background 7-day Top 1 settlement checker
  setInterval(async () => {
    try {
      const now = new Date().getTime();
      for (const guild of client.guilds.cache.values()) {
        const config = db.getGuildConfig(guild.id);
        if (!config.role_top1_id || !config.season_end_time) continue;

        const seasonEnd = new Date(config.season_end_time).getTime();
        if (now >= seasonEnd) {
          // Season ended -> calculate top 1
          const allUsers = db.getAllGuildUsers(guild.id);
          if (allUsers.length > 0) {
            const sorted = [...allUsers].sort((a, b) => (b.diem_cong_hien || 0) - (a.diem_cong_hien || 0));
            const newTop1 = sorted[0];

            // Remove old top 1 role if exists
            if (config.current_top1_user_id) {
              const oldMember = await guild.members.fetch(config.current_top1_user_id).catch(() => null);
              if (oldMember) {
                await oldMember.roles.remove(config.role_top1_id).catch(() => null);
              }
            }

            // Award new top 1 role
            const newMember = await guild.members.fetch(newTop1.user_id).catch(() => null);
            if (newMember) {
              await newMember.roles.add(config.role_top1_id).catch(() => null);
            }

            // Update season
            const nextSeasonEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            db.updateGuildConfig(guild.id, {
              current_top1_user_id: newTop1.user_id,
              season_end_time: nextSeasonEnd
            });

            console.log(`[LEADERBOARD] Awarded Top 1 Role ${config.role_top1_id} to ${newTop1.username} (${newTop1.user_id}) in guild ${guild.name}`);
          }
        }
      }
    } catch (err) {
      console.error('[LEADERBOARD SETTLEMENT ERROR]', err);
    }
  }, 60 * 60 * 1000); // Check every hour
}
