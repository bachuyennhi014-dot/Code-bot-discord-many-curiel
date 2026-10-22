import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { allSlashCommands } from './commands/slash/allCommands.js';

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID || '1555920118859567265';
const GUILD_ID = process.env.DISCORD_GUILD_ID || process.env.GUILD_ID;

async function deploy() {
  if (!TOKEN) {
    console.error('\x1b[31m[DEPLOY ERROR]\x1b[0m Thiếu DISCORD_TOKEN trong biến môi trường hoặc .env!');
    process.exit(1);
  }

  console.log('\n============================================================');
  console.log('       📡 MANY CURIEL TOÀN BỘ SLASH COMMANDS DEPLOY         ');
  console.log('============================================================\n');

  const commandsData = allSlashCommands.map(cmd => cmd.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(TOKEN);

  try {
    if (GUILD_ID) {
      console.log(`[COMMAND] Đang đăng ký slash commands cho Guild ${GUILD_ID}...`);
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commandsData }
      );
      console.log(`\x1b[32m[COMMAND] Đã đăng ký ${commandsData.length} slash commands cho Guild ${GUILD_ID}!\x1b[0m`);
    } else {
      console.log(`[COMMAND] Đang đăng ký slash commands TOÀN CẦU (Global)...`);
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commandsData }
      );
      console.log(`\x1b[32m[COMMAND] Đã đăng ký ${commandsData.length} slash commands toàn cầu!\x1b[0m`);
    }

    console.log('[COMMAND] /setupanh đã đăng ký.');
    console.log('[COMMAND] /setanh đã đăng ký.');
    console.log('[COMMAND] Hoàn tất đồng bộ Slash Commands!');
  } catch (error) {
    console.error('\x1b[31m[DEPLOY FAILED]\x1b[0m', error);
    process.exit(1);
  }
}

deploy();
