import fs from 'fs';
import path from 'path';
import { 
  UserCultivation, 
  GuildConfig, 
  StaffEntry, 
  BotBanRecord, 
  ChannelViolation, 
  StaffGiftLimit, 
  EventSchedule, 
  TransactionRecord,
  LiXiSession,
  RealmName,
  RealmStage,
  REALM_ORDER,
  LUYEN_KHI_STAGES,
  STANDARD_STAGES,
  getCultivationLevelIndex,
  getRequiredTuViForNextLevel,
  UserInventory,
  BossChungState,
  BossCombatState,
  CardTier,
  CHARACTER_NAMES,
  normalizeCharacterName,
  TimMaySession,
  SectInfo,
  CorruptedLeaderSession,
  SectRealmSession,
  SECRET_REALM_50_BOSSES,
  getUnifiedCultivationRank
} from '../types/cultivation.js';
import { USER_PROVIDED_EMOJIS } from '../utils/emojis.js';

export interface DatabaseSchema {
  users: Record<string, UserCultivation>;
  guilds: Record<string, GuildConfig>;
  staff: Record<string, StaffEntry>;
  quan_ly: Record<string, StaffEntry>;
  bot_bans: BotBanRecord[];
  violations: Record<string, ChannelViolation>;
  staff_gifts: Record<string, StaffGiftLimit>;
  events: Record<string, EventSchedule>;
  transactions: TransactionRecord[];
  custom_emojis: string[];
  hidden_products: string[];
  lixi_sessions: Record<string, LiXiSession>;
  character_images: Record<string, { C?: string; B?: string; A?: string; S?: string; '1000'?: string; '1000_affection'?: string; profile?: string; [key: string]: string | undefined }>;
  boss_chung: Record<string, BossChungState>;
  boss_don: Record<string, BossCombatState>;
  staff_phatqua_pool: Record<string, { date: string; count: number }>;
  tim_may_sessions: Record<string, TimMaySession>;
  sects: Record<string, SectInfo>;
  corrupted_leaders: Record<string, CorruptedLeaderSession>;
  sect_realm_sessions: Record<string, SectRealmSession>;
}

const DEFAULT_DB: DatabaseSchema = {
  users: {},
  guilds: {},
  staff: {},
  quan_ly: {},
  bot_bans: [],
  violations: {},
  staff_gifts: {},
  events: {},
  transactions: [],
  custom_emojis: [],
  hidden_products: [],
  lixi_sessions: {},
  character_images: {},
  boss_chung: {},
  boss_don: {},
  staff_phatqua_pool: {},
  tim_may_sessions: {},
  sects: {},
  corrupted_leaders: {},
  sect_realm_sessions: {}
};

class CultivationDatabase {
  private filePath: string;
  private persistentMirrorPath: string;
  private dataDir: string;
  private backupDir: string;
  private data: DatabaseSchema;
  private isInitialized: boolean = false;
  private backupTimer: NodeJS.Timeout | null = null;

  private logsDir: string;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.backupDir = path.resolve(process.cwd(), 'backup');
    this.logsDir = path.resolve(process.cwd(), 'logs');
    this.filePath = path.join(this.dataDir, 'database.json');
    this.persistentMirrorPath = path.resolve(process.cwd(), 'src/bot/database/persistent_data.json');

    if (!fs.existsSync(this.dataDir)) {
      try {
        fs.mkdirSync(this.dataDir, { recursive: true });
      } catch (err) {
        console.error('[DATABASE ERROR] Không thể tạo thư mục data:', err);
      }
    }

    if (!fs.existsSync(this.backupDir)) {
      try {
        fs.mkdirSync(this.backupDir, { recursive: true });
      } catch (err) {
        console.error('[DATABASE ERROR] Không thể tạo thư mục backup:', err);
      }
    }

    if (!fs.existsSync(this.logsDir)) {
      try {
        fs.mkdirSync(this.logsDir, { recursive: true });
      } catch (err) {
        console.error('[DATABASE ERROR] Không thể tạo thư mục logs:', err);
      }
    }

    this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
  }

  // Hợp nhất dữ liệu an toàn (Lossless Merge), không bao giờ xóa dữ liệu người chơi hoặc ảnh đã cài
  private mergeData(target: DatabaseSchema, source: any): void {
    if (!source || typeof source !== 'object') return;

    // 1. Users merge: Giữ lại toàn bộ thông số nhân vật, tài nguyên, vật phẩm, quan hệ và lịch sử
    if (source.users && typeof source.users === 'object') {
      if (!target.users) target.users = {};
      for (const [key, srcUser] of Object.entries(source.users as Record<string, UserCultivation>)) {
        if (!srcUser || typeof srcUser !== 'object') continue;
        if (!target.users[key]) {
          target.users[key] = JSON.parse(JSON.stringify(srcUser));
        } else {
          const tgtUser = target.users[key];

          // Cơ bản & danh tính
          if (srcUser.username && srcUser.username !== 'Tu Sĩ') tgtUser.username = srcUser.username;

          // Tu vi, cảnh giới, tầng - So sánh cấp độ để bảo lưu tuyệt đối cấp bậc và tiến trình
          const srcLevel = getCultivationLevelIndex(srcUser.realm, srcUser.stage);
          const tgtLevel = getCultivationLevelIndex(tgtUser.realm, tgtUser.stage);

          if (srcLevel > tgtLevel) {
            tgtUser.realm = srcUser.realm;
            tgtUser.stage = srcUser.stage;
            tgtUser.tu_vi = srcUser.tu_vi;
          } else if (srcLevel === tgtLevel) {
            if (srcUser.realm) tgtUser.realm = srcUser.realm;
            if (srcUser.stage) tgtUser.stage = srcUser.stage;
            tgtUser.tu_vi = Math.max(tgtUser.tu_vi || 0, srcUser.tu_vi || 0);
          }

          // Tiền tệ & tài nguyên (Linh Thạch, Cống Hiến, Mảnh Ký Ức)
          tgtUser.tinh_khong_thach = Math.max(tgtUser.tinh_khong_thach || 0, srcUser.tinh_khong_thach || 0);
          tgtUser.diem_cong_hien = Math.max(tgtUser.diem_cong_hien || 0, srcUser.diem_cong_hien || 0);
          tgtUser.manh_ky_uc = Math.max(tgtUser.manh_ky_uc || 0, srcUser.manh_ky_uc || 0);

          // Chỉ số chiến đấu & Thiên kiếp
          tgtUser.max_hp = Math.max(tgtUser.max_hp || 15000, srcUser.max_hp || 15000);
          tgtUser.current_hp = srcUser.current_hp !== undefined ? srcUser.current_hp : tgtUser.current_hp;
          tgtUser.total_battles = Math.max(tgtUser.total_battles || 0, srcUser.total_battles || 0);
          tgtUser.wins = Math.max(tgtUser.wins || 0, srcUser.wins || 0);
          tgtUser.losses = Math.max(tgtUser.losses || 0, srcUser.losses || 0);
          tgtUser.thien_kiep = Math.max(tgtUser.thien_kiep || 0, srcUser.thien_kiep || 0);
          tgtUser.truong_sinh_active_battles = Math.max(tgtUser.truong_sinh_active_battles || 0, srcUser.truong_sinh_active_battles || 0);

          // Thú cưng
          if (srcUser.pet) tgtUser.pet = srcUser.pet;
          tgtUser.pet_level = Math.max(tgtUser.pet_level || 1, srcUser.pet_level || 1);
          if (srcUser.last_pet_reward) tgtUser.last_pet_reward = srcUser.last_pet_reward;

          // Kỹ năng chiến đấu
          if (Array.isArray(srcUser.skills)) {
            tgtUser.skills = Array.from(new Set([...(tgtUser.skills || []), ...srcUser.skills]));
          }

          // Trang bị đang gắn (vũ khí & giáp phòng thủ)
          if (Array.isArray(srcUser.equipped_weapons) && srcUser.equipped_weapons.length > 0) {
            tgtUser.equipped_weapons = srcUser.equipped_weapons;
          }
          if (Array.isArray(srcUser.equipped_armor) && srcUser.equipped_armor.length > 0) {
            tgtUser.equipped_armor = srcUser.equipped_armor;
          }

          // Giỏ hàng
          if (Array.isArray(srcUser.cart) && srcUser.cart.length > 0) {
            tgtUser.cart = srcUser.cart;
          }

          // Thẻ nhân vật đã sở hữu
          if (srcUser.the_nhan_vat && typeof srcUser.the_nhan_vat === 'object') {
            if (!tgtUser.the_nhan_vat) tgtUser.the_nhan_vat = {};
            for (const [char, cards] of Object.entries(srcUser.the_nhan_vat)) {
              if (!tgtUser.the_nhan_vat[char]) tgtUser.the_nhan_vat[char] = {};
              tgtUser.the_nhan_vat[char].C = tgtUser.the_nhan_vat[char].C || cards?.C;
              tgtUser.the_nhan_vat[char].B = tgtUser.the_nhan_vat[char].B || cards?.B;
              tgtUser.the_nhan_vat[char].A = tgtUser.the_nhan_vat[char].A || cards?.A;
              tgtUser.the_nhan_vat[char].S = tgtUser.the_nhan_vat[char].S || cards?.S;
            }
          }

          // Mảnh nhân vật (C, B, A, S)
          if (srcUser.manh_nhan_vat && typeof srcUser.manh_nhan_vat === 'object') {
            if (!tgtUser.manh_nhan_vat) tgtUser.manh_nhan_vat = {};
            for (const [char, frags] of Object.entries(srcUser.manh_nhan_vat)) {
              if (!tgtUser.manh_nhan_vat[char]) tgtUser.manh_nhan_vat[char] = { C: 0, B: 0, A: 0, S: 0 };
              tgtUser.manh_nhan_vat[char].C = Math.max(tgtUser.manh_nhan_vat[char].C || 0, frags?.C || 0);
              tgtUser.manh_nhan_vat[char].B = Math.max(tgtUser.manh_nhan_vat[char].B || 0, frags?.B || 0);
              tgtUser.manh_nhan_vat[char].A = Math.max(tgtUser.manh_nhan_vat[char].A || 0, frags?.A || 0);
              tgtUser.manh_nhan_vat[char].S = Math.max(tgtUser.manh_nhan_vat[char].S || 0, frags?.S || 0);
            }
          }

          // Điểm Hảo Cảm nhân vật
          if (srcUser.hao_cam && typeof srcUser.hao_cam === 'object') {
            if (!tgtUser.hao_cam) tgtUser.hao_cam = {};
            for (const [char, hc] of Object.entries(srcUser.hao_cam)) {
              tgtUser.hao_cam[char] = Math.max(tgtUser.hao_cam[char] || 0, hc || 0);
            }
          }

          // Ghét bỏ (dislikes)
          if (srcUser.dislikes_count && typeof srcUser.dislikes_count === 'object') {
            if (!tgtUser.dislikes_count) tgtUser.dislikes_count = {};
            for (const [char, count] of Object.entries(srcUser.dislikes_count)) {
              tgtUser.dislikes_count[char] = Math.max(tgtUser.dislikes_count[char] || 0, count || 0);
            }
          }
          if (srcUser.dislike_score && typeof srcUser.dislike_score === 'object') {
            if (!tgtUser.dislike_score) tgtUser.dislike_score = {};
            for (const [char, score] of Object.entries(srcUser.dislike_score)) {
              tgtUser.dislike_score[char] = Math.max(tgtUser.dislike_score[char] || 0, score || 0);
            }
          }

          // Cảm xúc & Biểu cảm nhân vật
          if (srcUser.char_emotion && typeof srcUser.char_emotion === 'object') {
            tgtUser.char_emotion = { ...(tgtUser.char_emotion || {}), ...srcUser.char_emotion };
          }
          if (srcUser.char_expression && typeof srcUser.char_expression === 'object') {
            tgtUser.char_expression = { ...(tgtUser.char_expression || {}), ...srcUser.char_expression };
          }

          // Sư phụ & Danh sách sư phụ
          if (srcUser.su_phu) tgtUser.su_phu = srcUser.su_phu;
          if (Array.isArray(srcUser.su_phu_list)) {
            tgtUser.su_phu_list = Array.from(new Set([...(tgtUser.su_phu_list || []), ...srcUser.su_phu_list]));
          }

          // Quà đã tặng & tương tác gần nhất
          if (srcUser.gifts_given && typeof srcUser.gifts_given === 'object') {
            if (!tgtUser.gifts_given) tgtUser.gifts_given = {};
            for (const [char, gifts] of Object.entries(srcUser.gifts_given)) {
              if (!tgtUser.gifts_given[char]) tgtUser.gifts_given[char] = {};
              for (const [gName, gCount] of Object.entries(gifts || {})) {
                tgtUser.gifts_given[char][gName] = Math.max(tgtUser.gifts_given[char][gName] || 0, gCount || 0);
              }
            }
          }
          if (srcUser.last_interact_su_phu && typeof srcUser.last_interact_su_phu === 'object') {
            tgtUser.last_interact_su_phu = { ...(tgtUser.last_interact_su_phu || {}), ...srcUser.last_interact_su_phu };
          }

          // Thư viện ảnh nhân vật
          if (srcUser.photo_library && typeof srcUser.photo_library === 'object') {
            if (!tgtUser.photo_library) tgtUser.photo_library = {};
            for (const [char, photos] of Object.entries(srcUser.photo_library)) {
              tgtUser.photo_library[char] = Array.from(new Set([...(tgtUser.photo_library[char] || []), ...(photos || [])]));
            }
          }

          // Thông báo 1000 Hảo Cảm
          if (srcUser.affection_1000_notification_sent && typeof srcUser.affection_1000_notification_sent === 'object') {
            tgtUser.affection_1000_notification_sent = { ...(tgtUser.affection_1000_notification_sent || {}), ...srcUser.affection_1000_notification_sent };
          }
          if (srcUser.affection_1000_notification_channel_id && typeof srcUser.affection_1000_notification_channel_id === 'object') {
            tgtUser.affection_1000_notification_channel_id = { ...(tgtUser.affection_1000_notification_channel_id || {}), ...srcUser.affection_1000_notification_channel_id };
          }

          // Túi trữ vật (Inventory)
          if (srcUser.inventory && typeof srcUser.inventory === 'object') {
            if (!tgtUser.inventory) tgtUser.inventory = { dan_duoc: { truong_sinh_dan: 0 }, weapons: [], armor: [], charms: { bua_may_man: 0 } };
            if (Array.isArray(srcUser.inventory.weapons)) {
              tgtUser.inventory.weapons = Array.from(new Set([...(tgtUser.inventory.weapons || []), ...srcUser.inventory.weapons]));
            }
            if (Array.isArray(srcUser.inventory.armor)) {
              const existingIds = new Set((tgtUser.inventory.armor || []).map(a => a.id));
              for (const arm of srcUser.inventory.armor) {
                if (arm && !existingIds.has(arm.id)) {
                  tgtUser.inventory.armor.push(arm);
                  existingIds.add(arm.id);
                }
              }
            }
            if (srcUser.inventory.dan_duoc?.truong_sinh_dan !== undefined) {
              tgtUser.inventory.dan_duoc.truong_sinh_dan = Math.max(tgtUser.inventory.dan_duoc.truong_sinh_dan || 0, srcUser.inventory.dan_duoc.truong_sinh_dan);
            }
            if (srcUser.inventory.charms?.bua_may_man !== undefined) {
              tgtUser.inventory.charms.bua_may_man = Math.max(tgtUser.inventory.charms.bua_may_man || 0, srcUser.inventory.charms.bua_may_man);
            }
            if (srcUser.inventory.gifts && typeof srcUser.inventory.gifts === 'object') {
              if (!tgtUser.inventory.gifts) tgtUser.inventory.gifts = {};
              for (const [giftName, count] of Object.entries(srcUser.inventory.gifts)) {
                tgtUser.inventory.gifts[giftName] = Math.max(tgtUser.inventory.gifts[giftName] || 0, count || 0);
              }
            }
          }

          // Cooldown & trạng thái ngày
          if (srcUser.boss_heals_used !== undefined) tgtUser.boss_heals_used = srcUser.boss_heals_used;
          if (srcUser.boss_cooldown) tgtUser.boss_cooldown = srcUser.boss_cooldown;
          if (srcUser.daily_last) tgtUser.daily_last = srcUser.daily_last;
          tgtUser.daily_streak = Math.max(tgtUser.daily_streak || 0, srcUser.daily_streak || 0);
          if (srcUser.trua_nam_count !== undefined) tgtUser.trua_nam_count = srcUser.trua_nam_count;
          if (srcUser.trua_nam_date) tgtUser.trua_nam_date = srcUser.trua_nam_date;
          if (srcUser.updated_at) tgtUser.updated_at = srcUser.updated_at;
        }
      }
    }

    // 2. Character Images merge: Giữ lại TOÀN BỘ ảnh nhân vật đã được setup bằng bất kỳ lệnh nào (/setanh, /setupanh)
    if (source.character_images && typeof source.character_images === 'object') {
      if (!target.character_images) target.character_images = {};
      for (const [char, imgs] of Object.entries(source.character_images as Record<string, Record<string, string>>)) {
        if (!imgs || typeof imgs !== 'object') continue;
        if (!target.character_images[char]) {
          target.character_images[char] = {};
        }
        for (const [tierKey, imgUrl] of Object.entries(imgs)) {
          if (imgUrl && typeof imgUrl === 'string' && imgUrl.startsWith('http')) {
            target.character_images[char][tierKey] = imgUrl;
          }
        }
      }
    }

    // 3. Guilds merge: Cấu hình Server (kênh chơi, kênh ẩn, role Top 1, role TTTL, role Phú Hào, role Đại Đệ Tử...)
    if (source.guilds && typeof source.guilds === 'object') {
      if (!target.guilds) target.guilds = {};
      for (const [gid, gcfg] of Object.entries(source.guilds as Record<string, GuildConfig>)) {
        if (!target.guilds[gid]) {
          target.guilds[gid] = JSON.parse(JSON.stringify(gcfg));
        } else {
          const tgt = target.guilds[gid];
          tgt.guild_id = gid;
          tgt.play_channel_id = tgt.play_channel_id || gcfg.play_channel_id || null;
          tgt.hidden_channel_id = tgt.hidden_channel_id || gcfg.hidden_channel_id || null;
          tgt.role_top1_id = tgt.role_top1_id || gcfg.role_top1_id || null;
          tgt.role_tttl_id = tgt.role_tttl_id || gcfg.role_tttl_id || null;
          tgt.role_phu_hao_id = (tgt as any).role_phu_hao_id || (gcfg as any).role_phu_hao_id || null;
          tgt.current_phu_hao_user_id = (tgt as any).current_phu_hao_user_id || (gcfg as any).current_phu_hao_user_id || null;
          if (gcfg.role_dai_de_tu) {
            tgt.role_dai_de_tu = { ...(gcfg.role_dai_de_tu || {}), ...(tgt.role_dai_de_tu || {}) };
          }
          tgt.updated_at = new Date().toISOString();
        }
      }
    }

    // 4. Staff & Quản Lý merge
    if (source.staff && typeof source.staff === 'object') {
      if (!target.staff) target.staff = {};
      Object.assign(target.staff, source.staff);
    }
    if (source.quan_ly && typeof source.quan_ly === 'object') {
      if (!target.quan_ly) target.quan_ly = {};
      Object.assign(target.quan_ly, source.quan_ly);
    }

    // 5. Custom Emojis merge
    if (Array.isArray(source.custom_emojis)) {
      if (!target.custom_emojis) target.custom_emojis = [];
      target.custom_emojis = Array.from(new Set([...target.custom_emojis, ...source.custom_emojis]));
    }

    // 6. Bot Bans merge
    if (Array.isArray(source.bot_bans)) {
      if (!target.bot_bans) target.bot_bans = [];
      const existingBannedUserIds = new Set(target.bot_bans.map(b => b.user_id));
      for (const ban of source.bot_bans) {
        if (ban && ban.user_id && !existingBannedUserIds.has(ban.user_id)) {
          target.bot_bans.push(ban);
          existingBannedUserIds.add(ban.user_id);
        }
      }
    }

    // 7. Violations & Staff Gifts merge
    if (source.violations && typeof source.violations === 'object') {
      if (!target.violations) target.violations = {};
      Object.assign(target.violations, source.violations);
    }
    if (source.staff_gifts && typeof source.staff_gifts === 'object') {
      if (!target.staff_gifts) target.staff_gifts = {};
      Object.assign(target.staff_gifts, source.staff_gifts);
    }

    // 8. Events & Hidden Products merge
    if (source.events && typeof source.events === 'object') {
      if (!target.events) target.events = {};
      Object.assign(target.events, source.events);
    }
    if (Array.isArray(source.hidden_products)) {
      if (!target.hidden_products) target.hidden_products = [];
      target.hidden_products = Array.from(new Set([...target.hidden_products, ...source.hidden_products]));
    }

    // 9. Boss State merge
    if (source.boss_chung && typeof source.boss_chung === 'object') {
      if (!target.boss_chung) target.boss_chung = {};
      Object.assign(target.boss_chung, source.boss_chung);
    }
    if (source.boss_don && typeof source.boss_don === 'object') {
      if (!target.boss_don) target.boss_don = {};
      Object.assign(target.boss_don, source.boss_don);
    }
    if (source.staff_phatqua_pool && typeof source.staff_phatqua_pool === 'object') {
      if (!target.staff_phatqua_pool) target.staff_phatqua_pool = {};
      Object.assign(target.staff_phatqua_pool, source.staff_phatqua_pool);
    }

    // 10. Mini game sessions merge
    if (source.tim_may_sessions && typeof source.tim_may_sessions === 'object') {
      if (!target.tim_may_sessions) target.tim_may_sessions = {};
      Object.assign(target.tim_may_sessions, source.tim_may_sessions);
    }
    if (source.lixi_sessions && typeof source.lixi_sessions === 'object') {
      if (!target.lixi_sessions) target.lixi_sessions = {};
      Object.assign(target.lixi_sessions, source.lixi_sessions);
    }

    // 11. Sects & Bí Cảnh merge
    if (source.sects && typeof source.sects === 'object') {
      if (!target.sects) target.sects = {};
      Object.assign(target.sects, source.sects);
    }
    if (source.corrupted_leaders && typeof source.corrupted_leaders === 'object') {
      if (!target.corrupted_leaders) target.corrupted_leaders = {};
      Object.assign(target.corrupted_leaders, source.corrupted_leaders);
    }
    if (source.sect_realm_sessions && typeof source.sect_realm_sessions === 'object') {
      if (!target.sect_realm_sessions) target.sect_realm_sessions = {};
      Object.assign(target.sect_realm_sessions, source.sect_realm_sessions);
    }
  }

  public init(): boolean {
    try {
      this.data = JSON.parse(JSON.stringify(DEFAULT_DB));

      // BƯỚC 1: Nạp từ mirror bền vững được Git theo dõi (src/bot/database/persistent_data.json)
      if (fs.existsSync(this.persistentMirrorPath)) {
        try {
          const raw = fs.readFileSync(this.persistentMirrorPath, 'utf-8');
          const parsed = JSON.parse(raw);
          this.mergeData(this.data, parsed);
          console.log(`[DATABASE PERSISTENCE] Đã nạp thành công từ persistent_data.json: ${Object.keys(this.data.users).length} users, ${Object.keys(this.data.character_images).length} char images.`);
        } catch (err) {
          console.error('[DATABASE WARN] Không thể đọc persistent_data.json:', err);
        }
      }

      // BƯỚC 2: Nạp và hợp nhất với file hoạt động chính (data/database.json)
      if (fs.existsSync(this.filePath)) {
        try {
          const raw = fs.readFileSync(this.filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          this.mergeData(this.data, parsed);
          console.log(`[DATABASE PERSISTENCE] Đã hợp nhất dữ liệu từ data/database.json: ${Object.keys(this.data.users).length} users, ${Object.keys(this.data.character_images).length} char images.`);
        } catch (parseError) {
          console.error('[DATABASE CRITICAL] File data/database.json bị lỗi cú pháp. Đang khôi phục từ backup...', parseError);
          this.restoreFromLatestBackup();
        }
      }

      // BƯỚC 3: Nếu dữ liệu vẫn trống, thử phục hồi từ bản sao lưu gần nhất trong backup/
      if (Object.keys(this.data.users).length === 0 && fs.existsSync(this.backupDir)) {
        this.restoreFromLatestBackup();
      }

      // BƯỚC 4: Tự động nạp bộ custom emoji mới vào hệ thống nếu chưa có
      for (const emo of USER_PROVIDED_EMOJIS) {
        if (!this.data.custom_emojis.includes(emo)) {
          this.data.custom_emojis.push(emo);
        }
      }

      // BƯỚC 5: Tự động chuẩn hóa tên nhân vật cũ nếu có trong database
      const renameMap: Record<string, string> = {
        'Sở Da Ly': 'Sở Dạ Ly',
        'Chu Tỉnh Dật': 'Chu Tinh Dật',
        'Phan Đình Gia Nguyễn': 'Phan Đình Gia Nguyên',
        'Hoàng Vỹ Đăn': 'Hoàng Vỹ Đăng',
        'Tạ Kiều Trạch': 'Tạ Kiêu Trạch',
        'Tường Dã': 'Tưởng Dã',
        'Tổng Hàn': 'Tống Hàn',
        'Uyên Mĩnh Dạ': 'Uyên Minh Dạ',
        'Dạ Tỉnh Trầm': 'Dạ Tinh Trầm'
      };
      for (const [oldName, newName] of Object.entries(renameMap)) {
        if (this.data.character_images && this.data.character_images[oldName]) {
          this.data.character_images[newName] = {
            ...this.data.character_images[newName],
            ...this.data.character_images[oldName]
          };
          delete this.data.character_images[oldName];
        }
      }
      if (this.data.users) {
        for (const user of Object.values(this.data.users)) {
          if (user.su_phu && renameMap[user.su_phu]) {
            user.su_phu = renameMap[user.su_phu];
          }
          if (user.su_phu_list) {
            user.su_phu_list = user.su_phu_list.map((n: string) => renameMap[n] || n);
          }
          const dictFields: (keyof UserCultivation)[] = [
            'hao_cam', 'last_interact_su_phu', 'photo_library', 'gifts_given',
            'the_nhan_vat', 'manh_nhan_vat', 'dislike_score', 'dislikes_count',
            'char_expression', 'affection_1000_notification_sent', 'affection_1000_notification_channel_id'
          ];
          for (const f of dictFields) {
            const dict = (user as any)[f];
            if (dict && typeof dict === 'object') {
              for (const [oldName, newName] of Object.entries(renameMap)) {
                if (dict[oldName] !== undefined) {
                  if (dict[newName] === undefined) {
                    dict[newName] = dict[oldName];
                  }
                  delete dict[oldName];
                }
              }
            }
          }
        }
      }

      // BƯỚC 5.1: ĐỒNG BỘ & HỢP NHẤT TIẾN TRÌNH TOÀN DIỆN CHO MỖI NGƯỜI CHƠI (THEO USER ID)
      // Người chơi dùng bot ở bất kỳ server nào cũng giữ nguyên 100% tu vi, cảnh giới và tài nguyên
      if (this.data.users) {
        const usersByUserId = new Map<string, UserCultivation[]>();
        for (const user of Object.values(this.data.users)) {
          if (!user || !user.user_id) continue;
          const list = usersByUserId.get(user.user_id) || [];
          list.push(user);
          usersByUserId.set(user.user_id, list);
        }

        for (const [uid, userList] of usersByUserId.entries()) {
          if (userList.length > 1) {
            // Hợp nhất nhiều bản ghi của cùng một người chơi thành 1 bản ghi tối ưu nhất
            let best = userList[0];
            let bestLevel = getCultivationLevelIndex(best.realm, best.stage);

            for (let i = 1; i < userList.length; i++) {
              const cur = userList[i];
              const curLevel = getCultivationLevelIndex(cur.realm, cur.stage);
              if (curLevel > bestLevel) {
                best = cur;
                bestLevel = curLevel;
              } else if (curLevel === bestLevel && (cur.tu_vi || 0) > (best.tu_vi || 0)) {
                best = cur;
              }
            }

            // Gộp toàn bộ tài nguyên, vật phẩm, linh thạch từ các bản ghi khác
            for (const cur of userList) {
              if (cur === best) continue;
              best.tinh_khong_thach = Math.max(best.tinh_khong_thach || 0, cur.tinh_khong_thach || 0);
              best.diem_cong_hien = Math.max(best.diem_cong_hien || 0, cur.diem_cong_hien || 0);
              best.manh_ky_uc = Math.max(best.manh_ky_uc || 0, cur.manh_ky_uc || 0);
              best.max_hp = Math.max(best.max_hp || 15000, cur.max_hp || 15000);
              best.current_hp = Math.max(best.current_hp || 15000, cur.current_hp || 15000);
              if (cur.su_phu && !best.su_phu) best.su_phu = cur.su_phu;

              if (cur.the_nhan_vat) {
                best.the_nhan_vat = { ...(best.the_nhan_vat || {}), ...cur.the_nhan_vat };
              }
              if (cur.manh_nhan_vat) {
                if (!best.manh_nhan_vat) best.manh_nhan_vat = {};
                for (const [char, shards] of Object.entries(cur.manh_nhan_vat)) {
                  if (!best.manh_nhan_vat[char]) {
                    best.manh_nhan_vat[char] = { ...shards };
                  } else {
                    for (const [t, cnt] of Object.entries(shards as any)) {
                      (best.manh_nhan_vat[char] as any)[t] = Math.max(
                        (best.manh_nhan_vat[char] as any)[t] || 0,
                        (cnt as number) || 0
                      );
                    }
                  }
                }
              }
            }

            // Đồng bộ mọi key của người chơi này trỏ về cùng một bản ghi duy nhất
            for (const [k, u] of Object.entries(this.data.users)) {
              if (u && u.user_id === uid) {
                this.data.users[k] = best;
              }
            }
          }
        }

        // Đảm bảo Tu Vi hợp lệ (không vượt quá điều kiện thăng cấp)
        for (const user of Object.values(this.data.users)) {
          if (!user) continue;
          const req = getRequiredTuViForNextLevel(user.realm, user.stage);
          if (user.tu_vi > req) {
            user.tu_vi = req;
          }
        }
      }

      // BƯỚC 6: Đồng bộ lưu giữ lập tức ra cả data/database.json, persistent_data.json và backup
      this.save();
      this.createBackup('startup');

      console.log(`[DATABASE INITIALIZED] BẢO LƯU 100% TIẾN TRÌNH: ${Object.keys(this.data.users).length} người chơi, ${Object.keys(this.data.character_images).length} nhân vật đã cài ảnh, ${Object.keys(this.data.staff).length} staff. Dữ liệu KHÔNG BAO GIỜ bị reset khi bot khởi động lại hay update!`);

      this.isInitialized = true;
      this.startAutoBackup(6);
      return true;
    } catch (error) {
      console.error('[DATABASE ERROR] Khởi tạo database thất bại:', error);
      this.isInitialized = true;
      return false;
    }
  }

  // Lưu đồng thời đa tầng: Primary (data/database.json) + Mirror Git (persistent_data.json) + Backup Latest
  public save(): boolean {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const jsonContent = JSON.stringify(this.data, null, 2);

      // 1. Lưu an toàn vào data/database.json (Atomic write)
      const tempPath = path.join(this.dataDir, `database.json.tmp.${Date.now()}`);
      fs.writeFileSync(tempPath, jsonContent, 'utf-8');
      fs.renameSync(tempPath, this.filePath);

      // 2. Lưu đồng bộ vào persistent mirror (src/bot/database/persistent_data.json)
      try {
        const mirrorDir = path.dirname(this.persistentMirrorPath);
        if (!fs.existsSync(mirrorDir)) {
          fs.mkdirSync(mirrorDir, { recursive: true });
        }
        const mirrorTemp = path.join(mirrorDir, `persistent_data.json.tmp.${Date.now()}`);
        fs.writeFileSync(mirrorTemp, jsonContent, 'utf-8');
        fs.renameSync(mirrorTemp, this.persistentMirrorPath);
      } catch (mirrorErr) {
        try {
          fs.writeFileSync(this.persistentMirrorPath, jsonContent, 'utf-8');
        } catch {
          // ignore
        }
      }

      // 3. Cập nhật bản sao lưu tức thời database-backup-latest.json
      try {
        if (!fs.existsSync(this.backupDir)) {
          fs.mkdirSync(this.backupDir, { recursive: true });
        }
        fs.writeFileSync(path.join(this.backupDir, 'database-backup-latest.json'), jsonContent, 'utf-8');
      } catch {
        // ignore
      }

      return true;
    } catch (error) {
      console.error('[DATABASE ERROR] Lưu dữ liệu thất bại:', error);
      try {
        fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
        return true;
      } catch (fallbackError) {
        console.error('[DATABASE CRITICAL] Ghi đè fallback cũng thất bại:', fallbackError);
        return false;
      }
    }
  }

  public getDatabaseStats(): {
    totalUsers: number;
    totalStaff: number;
    totalQuanLy: number;
    totalCharacterImages: number;
    lastSaved: string;
    filePath: string;
    persistentMirrorPath: string;
    backupDir: string;
  } {
    return {
      totalUsers: Object.keys(this.data.users || {}).length,
      totalStaff: Object.keys(this.data.staff || {}).length,
      totalQuanLy: Object.keys(this.data.quan_ly || {}).length,
      totalCharacterImages: Object.keys(this.data.character_images || {}).length,
      lastSaved: new Date().toISOString(),
      filePath: this.filePath,
      persistentMirrorPath: this.persistentMirrorPath,
      backupDir: this.backupDir
    };
  }

  public createBackup(tag: string = 'auto'): string | null {
    try {
      if (!fs.existsSync(this.filePath)) return null;
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-');
      const backupFileName = `database-backup-${tag}-${timestamp}.json`;
      const backupPath = path.join(this.backupDir, backupFileName);

      fs.copyFileSync(this.filePath, backupPath);

      // Rotate: keep max 15
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('database-backup-') && f.endsWith('.json'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(this.backupDir, a));
          const statB = fs.statSync(path.join(this.backupDir, b));
          return statB.mtimeMs - statA.mtimeMs;
        });

      if (files.length > 15) {
        for (let i = 15; i < files.length; i++) {
          try {
            fs.unlinkSync(path.join(this.backupDir, files[i]));
          } catch {
            // ignore
          }
        }
      }

      return backupPath;
    } catch (err) {
      console.error('[DATABASE BACKUP ERROR]', err);
      return null;
    }
  }

  public restoreFromLatestBackup(): boolean {
    try {
      if (!fs.existsSync(this.backupDir)) return false;

      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('database-backup-') && f.endsWith('.json'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(this.backupDir, a));
          const statB = fs.statSync(path.join(this.backupDir, b));
          return statB.mtimeMs - statA.mtimeMs;
        });

      if (files.length === 0) return false;

      const latestBackupPath = path.join(this.backupDir, files[0]);
      const raw = fs.readFileSync(latestBackupPath, 'utf-8');
      const parsed = JSON.parse(raw);

      this.data = {
        users: parsed.users || {},
        guilds: parsed.guilds || {},
        staff: parsed.staff || {},
        quan_ly: parsed.quan_ly || {},
        bot_bans: Array.isArray(parsed.bot_bans) ? parsed.bot_bans : [],
        violations: parsed.violations || {},
        staff_gifts: parsed.staff_gifts || {},
        events: parsed.events || {},
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        custom_emojis: Array.isArray(parsed.custom_emojis) ? parsed.custom_emojis : [],
        hidden_products: Array.isArray(parsed.hidden_products) ? parsed.hidden_products : [],
        lixi_sessions: parsed.lixi_sessions || {},
        character_images: parsed.character_images || {},
        boss_chung: parsed.boss_chung || {},
        boss_don: parsed.boss_don || {},
        staff_phatqua_pool: parsed.staff_phatqua_pool || {},
        tim_may_sessions: parsed.tim_may_sessions || {},
        sects: parsed.sects || {},
        corrupted_leaders: parsed.corrupted_leaders || {},
        sect_realm_sessions: parsed.sect_realm_sessions || {}
      };

      this.save();
      console.log(`[DATABASE RESTORED] Đã khôi phục thành công từ bản sao lưu: ${files[0]}`);
      return true;
    } catch (err) {
      console.error('[DATABASE RESTORE FAILED]', err);
      return false;
    }
  }

  public startAutoBackup(hoursInterval: number = 6): void {
    if (this.backupTimer) clearInterval(this.backupTimer);
    const ms = hoursInterval * 60 * 60 * 1000;
    this.backupTimer = setInterval(() => {
      this.createBackup('periodic');
    }, ms);
    if (this.backupTimer.unref) {
      this.backupTimer.unref();
    }
  }

  private userKey(guildId: string, userId: string): string {
    return `${guildId}_${userId}`;
  }

  // Tìm hồ sơ người chơi theo userId bất kể máy chủ, đảm bảo lấy bản ghi có cảnh giới cao nhất và hợp nhất toàn bộ
  public findUserByUserId(userId: string): UserCultivation | null {
    if (!this.data.users) return null;
    const matchingUsers: UserCultivation[] = [];
    if (this.data.users[userId]) {
      matchingUsers.push(this.data.users[userId]);
    }
    for (const [k, u] of Object.entries(this.data.users)) {
      if (u && (u.user_id === userId || k === userId || k.endsWith(`_${userId}`))) {
        if (!matchingUsers.includes(u)) {
          matchingUsers.push(u);
        }
      }
    }
    if (matchingUsers.length === 0) return null;

    // Lấy bản ghi có cấp độ tu vi cao nhất
    let best = matchingUsers[0];
    let bestLevel = getCultivationLevelIndex(best.realm, best.stage);

    for (let i = 1; i < matchingUsers.length; i++) {
      const cur = matchingUsers[i];
      const curLevel = getCultivationLevelIndex(cur.realm, cur.stage);
      if (curLevel > bestLevel) {
        best = cur;
        bestLevel = curLevel;
      } else if (curLevel === bestLevel && (cur.tu_vi || 0) > (best.tu_vi || 0)) {
        best = cur;
      }
    }

    // Hợp nhất tài nguyên từ các bản ghi khác
    for (const cur of matchingUsers) {
      if (cur === best) continue;
      best.tinh_khong_thach = Math.max(best.tinh_khong_thach || 0, cur.tinh_khong_thach || 0);
      best.diem_cong_hien = Math.max(best.diem_cong_hien || 0, cur.diem_cong_hien || 0);
      best.manh_ky_uc = Math.max(best.manh_ky_uc || 0, cur.manh_ky_uc || 0);
      best.max_hp = Math.max(best.max_hp || 15000, cur.max_hp || 15000);
      best.current_hp = Math.max(best.current_hp || 15000, cur.current_hp || 15000);
      if (cur.su_phu && !best.su_phu) best.su_phu = cur.su_phu;
      if (cur.the_nhan_vat) {
        best.the_nhan_vat = { ...(best.the_nhan_vat || {}), ...cur.the_nhan_vat };
      }
    }

    // Nếu là user đặc biệt 1250580493074825246: đảm bảo đạt tối thiểu Luyện Hư Trung Kỳ và 500k linh thạch, không bao giờ reset ngược
    if (userId === '1250580493074825246') {
      const currentLevel = getCultivationLevelIndex(best.realm, best.stage);
      const targetLevel = getCultivationLevelIndex('Luyện Hư', 'Trung Kỳ');
      if (currentLevel < targetLevel) {
        best.realm = 'Luyện Hư';
        best.stage = 'Trung Kỳ';
        best.tu_vi = Math.max(best.tu_vi || 0, 1500000);
      }
      best.tinh_khong_thach = Math.max(best.tinh_khong_thach || 0, 500000);
    }

    // Trỏ toàn bộ key của user này về chung 1 đối tượng canonical duy nhất
    this.data.users[userId] = best;
    for (const [k, u] of Object.entries(this.data.users)) {
      if (u && (u.user_id === userId || k === userId || k.endsWith(`_${userId}`))) {
        this.data.users[k] = best;
      }
    }

    return best;
  }

  // --- USER CULTIVATION ---
  public getUser(guildId: string, userId: string): UserCultivation | null {
    const existing = this.findUserByUserId(userId);
    if (existing) {
      const key = this.userKey(guildId, userId);
      this.data.users[key] = existing;
      this.data.users[userId] = existing;
      return existing;
    }
    return null;
  }

  public getOrCreateUser(guildId: string, userId: string, username: string = 'Tu Sĩ'): UserCultivation {
    let u = this.findUserByUserId(userId);
    const key = this.userKey(guildId, userId);

    if (!u) {
      const now = new Date().toISOString();
      let defaultRealm: RealmName = 'Phàm Nhân';
      let defaultStage: RealmStage = 'Phàm Nhân';
      let defaultTkt = 1000;

      if (userId === '1250580493074825246') {
        defaultRealm = 'Luyện Hư';
        defaultStage = 'Trung Kỳ';
        defaultTkt = 500000;
      }

      u = {
        user_id: userId,
        guild_id: guildId,
        username,
        tinh_khong_thach: defaultTkt,
        manh_ky_uc: 0,
        diem_cong_hien: 0,
        realm: defaultRealm,
        stage: defaultStage,
        tu_vi: userId === '1250580493074825246' ? 1500000 : 0,
        current_hp: 15000,
        max_hp: 15000,
        total_battles: 0,
        wins: 0,
        losses: 0,
        thien_kiep: 0,
        pet: null,
        pet_level: 1,
        last_pet_reward: null,
        truong_sinh_active_battles: 0,
        inventory: {
          dan_duoc: { truong_sinh_dan: 0 },
          weapons: [],
          armor: [],
          charms: { bua_may_man: 0 }
        },
        equipped_weapons: [],
        equipped_armor: [],
        hao_cam: {},
        manh_nhan_vat: {},
        the_nhan_vat: {},
        su_phu: null,
        last_interact_su_phu: {},
        skills: ['Đạo Lực Chưởng'],
        daily_last: null,
        daily_streak: 0,
        trua_nam_count: 0,
        trua_nam_date: null,
        created_at: now,
        updated_at: now
      };
      this.data.users[key] = u;
      this.data.users[userId] = u;
      this.save();
    } else {
      this.data.users[key] = u;
      this.data.users[userId] = u;

      let changed = false;
      if (username && username !== 'Tu Sĩ' && u.username !== username) {
        u.username = username;
        changed = true;
      }
      if (userId === '1250580493074825246') {
        const currentLevel = getCultivationLevelIndex(u.realm, u.stage);
        const targetLevel = getCultivationLevelIndex('Luyện Hư', 'Trung Kỳ');
        if (currentLevel < targetLevel) {
          u.realm = 'Luyện Hư';
          u.stage = 'Trung Kỳ';
          u.tu_vi = Math.max(u.tu_vi || 0, 1500000);
          changed = true;
        }
        if ((u.tinh_khong_thach || 0) < 500000) {
          u.tinh_khong_thach = 500000;
          changed = true;
        }
      }
      // Migrate missing fields
      if (u.current_hp === undefined) { u.current_hp = 15000; changed = true; }
      if (u.max_hp === undefined) { u.max_hp = 15000; changed = true; }
      if (u.total_battles === undefined) { u.total_battles = 0; changed = true; }
      if (u.wins === undefined) { u.wins = 0; changed = true; }
      if (u.losses === undefined) { u.losses = 0; changed = true; }
      if (u.thien_kiep === undefined) { u.thien_kiep = 0; changed = true; }
      if (u.pet === undefined) { u.pet = null; changed = true; }
      if (u.pet_level === undefined) { u.pet_level = 1; changed = true; }
      if (u.last_pet_reward === undefined) { u.last_pet_reward = null; changed = true; }
      if (u.truong_sinh_active_battles === undefined) { u.truong_sinh_active_battles = 0; changed = true; }
      if (!u.inventory) {
        u.inventory = {
          dan_duoc: { truong_sinh_dan: 0 },
          weapons: [],
          armor: [],
          charms: { bua_may_man: 0 }
        };
        changed = true;
      }
      if (!u.equipped_weapons) { u.equipped_weapons = []; changed = true; }
      if (!u.equipped_armor) { u.equipped_armor = []; changed = true; }
      if (!u.hao_cam) { u.hao_cam = {}; changed = true; }
      if (!u.manh_nhan_vat) { u.manh_nhan_vat = {}; changed = true; }
      if (!u.the_nhan_vat) { u.the_nhan_vat = {}; changed = true; }
      if (u.su_phu === undefined) { u.su_phu = null; changed = true; }
      if (!u.last_interact_su_phu) { u.last_interact_su_phu = {}; changed = true; }
      if (!u.skills) { u.skills = ['Đạo Lực Chưởng']; changed = true; }
      if (changed) this.save();
    }
    return u;
  }

  public updateUser(guildId: string, userId: string, updates: Partial<UserCultivation>): UserCultivation {
    const key = this.userKey(guildId, userId);
    const existing = this.getOrCreateUser(guildId, userId);
    Object.assign(existing, updates, {
      updated_at: new Date().toISOString()
    });
    this.data.users[key] = existing;
    this.data.users[userId] = existing;
    for (const [k, u] of Object.entries(this.data.users)) {
      if (u && (u.user_id === userId || k === userId || k.endsWith(`_${userId}`))) {
        this.data.users[k] = existing;
      }
    }
    this.save();
    return existing;
  }

  public addTinhKhongThach(guildId: string, userId: string, amount: number, reason: string): UserCultivation {
    const user = this.getOrCreateUser(guildId, userId);
    user.tinh_khong_thach += amount;
    user.updated_at = new Date().toISOString();
    this.logTransaction(userId, guildId, 'ADD_TKT', amount, 'Tinh Không Thạch', reason);
    this.save();
    return user;
  }

  public deductTinhKhongThach(guildId: string, userId: string, amount: number, reason: string): boolean {
    const user = this.getOrCreateUser(guildId, userId);
    if (user.tinh_khong_thach < amount) return false;
    user.tinh_khong_thach -= amount;
    user.updated_at = new Date().toISOString();
    this.logTransaction(userId, guildId, 'SUB_TKT', amount, 'Tinh Không Thạch', reason);
    this.save();
    return true;
  }

  public addManhKyUc(guildId: string, userId: string, amount: number, reason: string): UserCultivation {
    const user = this.getOrCreateUser(guildId, userId);
    user.manh_ky_uc += amount;
    user.updated_at = new Date().toISOString();
    this.logTransaction(userId, guildId, 'ADD_MKU', amount, 'Mảnh Ký Ức', reason);
    this.save();
    return user;
  }

  public addDiemCongHien(guildId: string, userId: string, amount: number, reason: string): UserCultivation {
    const user = this.getOrCreateUser(guildId, userId);
    user.diem_cong_hien += amount;
    user.updated_at = new Date().toISOString();
    this.logTransaction(userId, guildId, 'ADD_DCH', amount, 'Điểm Cống Hiến', reason);
    this.save();
    return user;
  }

  public addTuVi(guildId: string, userId: string, amount: number): UserCultivation {
    const user = this.getOrCreateUser(guildId, userId);
    const req = getRequiredTuViForNextLevel(user.realm, user.stage);
    user.tu_vi = Math.min(req, (user.tu_vi || 0) + amount);
    user.updated_at = new Date().toISOString();
    this.save();
    return user;
  }

  public setRealmAndStage(guildId: string, userId: string, realm: RealmName, stage: RealmStage): UserCultivation {
    const user = this.getOrCreateUser(guildId, userId);
    user.realm = realm;
    user.stage = stage;
    user.updated_at = new Date().toISOString();
    this.save();
    return user;
  }

  public getAllGuildUsers(guildId?: string): UserCultivation[] {
    const userMap = new Map<string, UserCultivation>();
    for (const u of Object.values(this.data.users || {})) {
      if (!u || !u.user_id) continue;
      if (!guildId || u.guild_id === guildId) {
        if (!userMap.has(u.user_id)) {
          userMap.set(u.user_id, u);
        } else {
          const existing = userMap.get(u.user_id)!;
          const exLvl = getCultivationLevelIndex(existing.realm, existing.stage);
          const curLvl = getCultivationLevelIndex(u.realm, u.stage);
          if (curLvl > exLvl || (curLvl === exLvl && (u.tu_vi || 0) > (existing.tu_vi || 0))) {
            userMap.set(u.user_id, u);
          }
        }
      }
    }
    return Array.from(userMap.values());
  }

  // --- SHOP & INVENTORY ---
  public getHiddenProducts(): string[] {
    return this.data.hidden_products || [];
  }

  public removeProductFromShop(productName: string): boolean {
    const p = productName.trim().toLowerCase();
    if (!this.data.hidden_products.includes(p)) {
      this.data.hidden_products.push(p);
      this.save();
      return true;
    }
    return false;
  }

  public isProductHidden(productName: string): boolean {
    const p = productName.trim().toLowerCase();
    return this.data.hidden_products.some(h => p.includes(h) || h.includes(p));
  }

  public buyProduct(guildId: string, userId: string, productName: string, price: number, category: string): { success: boolean; message: string } {
    const user = this.getOrCreateUser(guildId, userId);

    if (this.isProductHidden(productName)) {
      return { success: false, message: `Vật phẩm **${productName}** đã bị xóa khỏi cửa hàng bởi Quản Trị Viên.` };
    }

    if (user.tinh_khong_thach < price) {
      return { success: false, message: `Đạo hữu không đủ Linh Thạch! Cần **${price.toLocaleString()}** Linh Thạch nhưng chỉ có **${user.tinh_khong_thach.toLocaleString()}**.` };
    }

    user.tinh_khong_thach -= price;

    if (category === 'Đan Dược') {
      user.inventory.dan_duoc.truong_sinh_dan = (user.inventory.dan_duoc.truong_sinh_dan || 0) + 1;
      // Auto activate 3 battles if not already active
      user.truong_sinh_active_battles = 3;
    } else if (category === 'Vũ Khí') {
      if (!user.inventory.weapons.includes(productName)) {
        user.inventory.weapons.push(productName);
      }
    } else if (category === 'Giáp') {
      user.inventory.armor.push({
        id: `armor_${Date.now()}`,
        name: productName,
        durability: 3
      });
    } else if (category === 'Bùa') {
      user.inventory.charms.bua_may_man = (user.inventory.charms.bua_may_man || 0) + 1;
    } else if (category === 'Linh Thú') {
      user.pet = productName;
      user.pet_level = 1;
      user.last_pet_reward = new Date().toISOString();
    } else if (category === 'Quà Tặng') {
      if (!user.inventory.gifts) user.inventory.gifts = {};
      user.inventory.gifts[productName] = (user.inventory.gifts[productName] || 0) + 1;
    }

    user.updated_at = new Date().toISOString();
    this.logTransaction(userId, guildId, 'BUY_ITEM', price, 'Linh Thạch', `Mua ${productName}`);
    this.save();

    return { success: true, message: `Đã mua thành công **${productName}** với giá **${price.toLocaleString()} Linh Thạch**!` };
  }

  // --- GIỎ HÀNG (SHOP CART) ---
  public addToCart(guildId: string, userId: string, item: { name: string; price: number; category: string }): { success: boolean; totalInCart: number } {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.cart) user.cart = [];
    const existing = user.cart.find(c => c.name.toLowerCase() === item.name.toLowerCase());
    if (existing) {
      existing.count += 1;
    } else {
      user.cart.push({
        name: item.name,
        price: item.price,
        category: item.category,
        count: 1
      });
    }
    this.save();
    const totalInCart = user.cart.reduce((sum, i) => sum + i.count, 0);
    return { success: true, totalInCart };
  }

  public getCart(guildId: string, userId: string) {
    const user = this.getOrCreateUser(guildId, userId);
    return user.cart || [];
  }

  public clearCart(guildId: string, userId: string): void {
    const user = this.getOrCreateUser(guildId, userId);
    user.cart = [];
    this.save();
  }

  public checkoutCart(guildId: string, userId: string): { success: boolean; message: string; totalCost: number } {
    const user = this.getOrCreateUser(guildId, userId);
    const cart = user.cart || [];
    if (cart.length === 0) {
      return { success: false, message: 'Giỏ hàng của đạo hữu hiện đang trống!', totalCost: 0 };
    }

    const totalCost = cart.reduce((sum, i) => sum + (i.price * i.count), 0);
    if (user.tinh_khong_thach < totalCost) {
      return { 
        success: false, 
        message: `Đạo hữu không đủ Linh Thạch để thanh toán toàn bộ giỏ hàng! Cần **${totalCost.toLocaleString()}** Linh Thạch nhưng chỉ có **${user.tinh_khong_thach.toLocaleString()}**.`, 
        totalCost 
      };
    }

    user.tinh_khong_thach -= totalCost;

    // Apply all items
    for (const item of cart) {
      for (let k = 0; k < item.count; k++) {
        if (item.category === 'Đan Dược') {
          user.inventory.dan_duoc.truong_sinh_dan = (user.inventory.dan_duoc.truong_sinh_dan || 0) + 1;
          user.truong_sinh_active_battles = 3;
        } else if (item.category === 'Vũ Khí') {
          if (!user.inventory.weapons.includes(item.name)) {
            user.inventory.weapons.push(item.name);
          }
        } else if (item.category === 'Giáp') {
          user.inventory.armor.push({
            id: `armor_${Date.now()}_${k}`,
            name: item.name,
            durability: 3
          });
        } else if (item.category === 'Bùa') {
          user.inventory.charms.bua_may_man = (user.inventory.charms.bua_may_man || 0) + 1;
        } else if (item.category === 'Linh Thú') {
          user.pet = item.name;
          user.pet_level = 1;
          user.last_pet_reward = new Date().toISOString();
        } else if (item.category === 'Quà Tặng') {
          if (!user.inventory.gifts) user.inventory.gifts = {};
          user.inventory.gifts[item.name] = (user.inventory.gifts[item.name] || 0) + 1;
        }
      }
    }

    const itemsSummary = cart.map(i => `${i.name} (x${i.count})`).join(', ');
    user.cart = [];
    user.updated_at = new Date().toISOString();
    this.logTransaction(userId, guildId, 'CHECKOUT_CART', totalCost, 'Linh Thạch', `Thanh toán giỏ hàng: ${itemsSummary}`);
    this.save();

    return { 
      success: true, 
      message: `Đã thanh toán thành công giỏ hàng gồm **${itemsSummary}** với tổng số tiền **${totalCost.toLocaleString()} Linh Thạch**!`, 
      totalCost 
    };
  }

  // --- TRANG BỊ VŨ KHÍ & GIÁP (Mgan & Mbogan) ---
  public equipWeapon(guildId: string, userId: string, weaponName: string): { success: boolean; message: string } {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.equipped_weapons) user.equipped_weapons = [];
    if (!user.inventory?.weapons) user.inventory.weapons = [];

    const availableWeapons = user.inventory.weapons;
    const match = availableWeapons.find(w => w.toLowerCase() === weaponName.toLowerCase());
    if (!match) {
      return { success: false, message: `Đạo hữu không có vũ khí **${weaponName}** trong túi trữ vật!` };
    }

    if (user.equipped_weapons.length >= 3) {
      return { success: false, message: `Đạo hữu đã trang bị tối đa **3 vũ khí**! Hãy dùng \`Mbogan <tên vũ khí>\` để tháo bớt trước.` };
    }

    const countInBag = availableWeapons.filter(w => w.toLowerCase() === match.toLowerCase()).length;
    const countEquipped = user.equipped_weapons.filter(w => w.toLowerCase() === match.toLowerCase()).length;
    if (countEquipped >= countInBag) {
      return { success: false, message: `Đạo hữu đã trang bị toàn bộ số lượng **${match}** đang sở hữu!` };
    }

    user.equipped_weapons.push(match);
    user.updated_at = new Date().toISOString();
    this.save();
    return { 
      success: true, 
      message: `Đã trang bị thành công **${match}** vào danh sách vũ khí chiến đấu! (Đang gắn: ${user.equipped_weapons.length}/3)` 
    };
  }

  public equipArmor(guildId: string, userId: string, armorName: string): { success: boolean; message: string } {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.equipped_armor) user.equipped_armor = [];
    if (!user.inventory?.armor) user.inventory.armor = [];

    const availableArmor = user.inventory.armor;
    const match = availableArmor.find(a => a.name.toLowerCase() === armorName.toLowerCase() && !user.equipped_armor?.some(eq => eq.id === a.id));
    if (!match) {
      return { success: false, message: `Đạo hữu không có giáp **${armorName}** khả dụng trong túi trữ vật!` };
    }

    if (user.equipped_armor.length >= 3) {
      return { success: false, message: `Đạo hữu đã trang bị tối đa **3 giáp**! Hãy dùng \`Mbogan <tên giáp>\` để tháo bớt trước.` };
    }

    user.equipped_armor.push(match);
    user.updated_at = new Date().toISOString();
    this.save();
    return { 
      success: true, 
      message: `Đã trang bị thành công **${match.name}** (Độ bền: ${match.durability}/3)! (Đang gắn: ${user.equipped_armor.length}/3)` 
    };
  }

  public unequipWeapon(guildId: string, userId: string, weaponName: string): { success: boolean; message: string } {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.equipped_weapons || user.equipped_weapons.length === 0) {
      return { success: false, message: 'Đạo hữu chưa trang bị vũ khí nào!' };
    }

    const idx = user.equipped_weapons.findIndex(w => w.toLowerCase() === weaponName.toLowerCase());
    if (idx === -1) {
      return { success: false, message: `Vũ khí **${weaponName}** hiện không có trong danh sách trang bị!` };
    }

    const removed = user.equipped_weapons.splice(idx, 1)[0];
    user.updated_at = new Date().toISOString();
    this.save();
    return { success: true, message: `Đã tháo bỏ trang bị **${removed}** thành công! (Còn gắn: ${user.equipped_weapons.length}/3)` };
  }

  public unequipArmor(guildId: string, userId: string, armorName: string): { success: boolean; message: string } {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.equipped_armor || user.equipped_armor.length === 0) {
      return { success: false, message: 'Đạo hữu chưa trang bị giáp nào!' };
    }

    const idx = user.equipped_armor.findIndex(a => a.name.toLowerCase() === armorName.toLowerCase());
    if (idx === -1) {
      return { success: false, message: `Giáp **${armorName}** hiện không có trong danh sách trang bị!` };
    }

    const removed = user.equipped_armor.splice(idx, 1)[0];
    user.updated_at = new Date().toISOString();
    this.save();
    return { success: true, message: `Đã tháo bỏ trang bị **${removed.name}** thành công! (Còn gắn: ${user.equipped_armor.length}/3)` };
  }

  // --- LÌ XÌ ---
  public createLiXi(guildId: string, channelId: string, creatorId: string, creatorName: string, totalAmount: number, recipients: number): LiXiSession | null {
    const user = this.getOrCreateUser(guildId, creatorId);
    if (user.tinh_khong_thach < totalAmount) return null;
    if (recipients <= 0 || totalAmount < recipients) return null;

    user.tinh_khong_thach -= totalAmount;
    user.updated_at = new Date().toISOString();

    const id = `lixi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const session: LiXiSession = {
      id,
      creator_id: creatorId,
      creator_name: creatorName,
      guild_id: guildId,
      channel_id: channelId,
      total_amount: totalAmount,
      remaining_amount: totalAmount,
      total_recipients: recipients,
      received_users: {},
      created_at: new Date().toISOString(),
      is_finished: false
    };

    this.data.lixi_sessions[id] = session;
    this.logTransaction(creatorId, guildId, 'CREATE_LIXI', totalAmount, 'Linh Thạch', `Tạo lì xì ${totalAmount} cho ${recipients} người`);
    this.save();

    return session;
  }

  public getLiXi(id: string): LiXiSession | null {
    return this.data.lixi_sessions[id] || null;
  }

  public claimLiXi(sessionId: string, userId: string, userName: string): { success: boolean; amount: number; message: string; session: LiXiSession | null } {
    const session = this.data.lixi_sessions[sessionId];
    if (!session) return { success: false, amount: 0, message: 'Lì xì này không tồn tại.', session: null };
    if (session.is_finished) return { success: false, amount: 0, message: 'Lì xì này đã được nhận hết!', session };
    if (userId === session.creator_id) {
      return { success: false, amount: 0, message: 'Người tạo lì xì không thể tự nhận lì xì của chính mình!', session };
    }
    if (session.received_users[userId]) return { success: false, amount: 0, message: 'Đạo hữu đã nhận lì xì này rồi!', session };

    const remainingSlots = session.total_recipients - Object.keys(session.received_users).length;
    if (remainingSlots <= 0 || session.remaining_amount <= 0) {
      session.is_finished = true;
      this.save();
      return { success: false, amount: 0, message: 'Lì xì đã được phát hết!', session };
    }

    let claimAmount = 1;
    if (remainingSlots === 1) {
      claimAmount = session.remaining_amount;
      session.is_finished = true;
    } else {
      const avg = Math.floor(session.remaining_amount / remainingSlots);
      const maxRandom = Math.min(session.remaining_amount - remainingSlots + 1, Math.max(1, avg * 2));
      claimAmount = Math.floor(Math.random() * maxRandom) + 1;
    }

    session.remaining_amount -= claimAmount;
    session.received_users[userId] = claimAmount;
    if (Object.keys(session.received_users).length >= session.total_recipients || session.remaining_amount <= 0) {
      session.is_finished = true;
    }

    const user = this.getOrCreateUser(session.guild_id, userId, userName);
    user.tinh_khong_thach += claimAmount;
    user.updated_at = new Date().toISOString();

    this.logTransaction(userId, session.guild_id, 'CLAIM_LIXI', claimAmount, 'Linh Thạch', `Nhận lì xì từ ${session.creator_name}`);
    this.save();

    return {
      success: true,
      amount: claimAmount,
      message: `Đạo hữu đã nhận được **${claimAmount.toLocaleString()} Linh Thạch** từ phong bao lì xì của **${session.creator_name}**!`,
      session
    };
  }

  // --- GUILD CONFIG ---
  public getGuildConfig(guildId: string): GuildConfig {
    if (!this.data.guilds[guildId]) {
      this.data.guilds[guildId] = {
        guild_id: guildId,
        play_channel_id: null,
        hidden_channel_id: null,
        role_top1_id: null,
        role_tttl_id: null,
        season_end_time: null,
        updated_at: new Date().toISOString()
      };
      this.save();
    }
    return this.data.guilds[guildId];
  }

  public updateGuildConfig(guildId: string, updates: Partial<GuildConfig>): GuildConfig {
    const existing = this.getGuildConfig(guildId);
    this.data.guilds[guildId] = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };
    this.save();
    this.createBackup('guild-config');
    console.log(`[GUILD CONFIG PERSISTED] Đã lưu vĩnh viễn cấu hình cho guild ${guildId}:`, JSON.stringify(updates));
    return this.data.guilds[guildId];
  }

  // --- STAFF & QUAN LY ---
  public isStaff(userId: string): boolean {
    return !!this.data.staff[userId];
  }

  public addStaff(userId: string, addedBy: string, username: string = 'Staff'): StaffEntry {
    const entry: StaffEntry = {
      user_id: userId,
      username,
      added_by: addedBy,
      added_at: new Date().toISOString()
    };
    this.data.staff[userId] = entry;
    this.save();
    return entry;
  }

  public removeStaff(userId: string): boolean {
    if (this.data.staff[userId]) {
      delete this.data.staff[userId];
      this.save();
      return true;
    }
    return false;
  }

  public getAllStaff(): StaffEntry[] {
    return Object.values(this.data.staff || {});
  }

  public isQuanLy(userId: string): boolean {
    return !!this.data.quan_ly[userId];
  }

  public addQuanLy(userId: string, addedBy: string, username: string = 'Quản Lý'): StaffEntry {
    const entry: StaffEntry = {
      user_id: userId,
      username,
      added_by: addedBy,
      added_at: new Date().toISOString()
    };
    this.data.quan_ly[userId] = entry;
    this.save();
    return entry;
  }

  public removeQuanLy(userId: string): boolean {
    if (this.data.quan_ly[userId]) {
      delete this.data.quan_ly[userId];
      this.save();
      return true;
    }
    return false;
  }

  public getAllQuanLy(): StaffEntry[] {
    return Object.values(this.data.quan_ly || {});
  }

  public getAllUsers(): UserCultivation[] {
    return Object.values(this.data.users || {});
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  // --- BOT BANS & VIOLATIONS ---
  public getActiveBotBan(userId: string, guildId: string): BotBanRecord | null {
    const now = Date.now();
    const ban = this.data.bot_bans.find(
      b => b.user_id === userId && b.guild_id === guildId && b.is_active && new Date(b.end_time).getTime() > now
    );
    return ban || null;
  }

  public banBotUser(userId: string, guildId: string, durationMs: number, reason: string, bannedBy: string): BotBanRecord {
    const now = new Date();
    const endTime = new Date(now.getTime() + durationMs);

    const record: BotBanRecord = {
      user_id: userId,
      guild_id: guildId,
      banned_by: bannedBy,
      reason,
      start_time: now.toISOString(),
      end_time: endTime.toISOString(),
      is_active: true
    };

    this.data.bot_bans.push(record);
    this.save();
    return record;
  }

  public unbanBotUser(userId: string, guildId: string): boolean {
    let unbanned = false;
    this.data.bot_bans.forEach(b => {
      if (b.user_id === userId && b.guild_id === guildId && b.is_active) {
        b.is_active = false;
        unbanned = true;
      }
    });
    if (unbanned) this.save();
    return unbanned;
  }

  public incrementViolation(guildId: string, userId: string): ChannelViolation {
    const key = `${guildId}_${userId}`;
    if (!this.data.violations[key]) {
      this.data.violations[key] = {
        guild_id: guildId,
        user_id: userId,
        count: 1,
        last_violation: new Date().toISOString()
      };
    } else {
      this.data.violations[key].count += 1;
      this.data.violations[key].last_violation = new Date().toISOString();
    }
    this.save();
    return this.data.violations[key];
  }

  public resetViolation(guildId: string, userId: string): void {
    const key = `${guildId}_${userId}`;
    if (this.data.violations[key]) {
      this.data.violations[key].count = 0;
      this.save();
    }
  }

  public getStaffGiftCount(staffId: string): number {
    const today = new Date().toISOString().slice(0, 10);
    const limit = this.data.staff_gifts[staffId];
    if (!limit || limit.last_gift_date !== today) return 0;
    return limit.count_today;
  }

  public incrementStaffGift(staffId: string): void {
    const today = new Date().toISOString().slice(0, 10);
    if (!this.data.staff_gifts[staffId] || this.data.staff_gifts[staffId].last_gift_date !== today) {
      this.data.staff_gifts[staffId] = {
        staff_id: staffId,
        count_today: 1,
        last_gift_date: today
      };
    } else {
      this.data.staff_gifts[staffId].count_today += 1;
    }
    this.save();
  }

  // --- EVENTS ---
  public getOrCreateEvent(eventName: string, durationHours: number = 24): EventSchedule {
    if (!this.data.events[eventName]) {
      const now = new Date();
      const end = new Date(now.getTime() + durationHours * 3600 * 1000);
      this.data.events[eventName] = {
        event_name: eventName,
        start_time: now.toISOString(),
        end_time: end.toISOString()
      };
      this.save();
    }
    return this.data.events[eventName];
  }

  public fastForwardEvent(eventName: string, hours: number): EventSchedule {
    const event = this.getOrCreateEvent(eventName);
    const currentEnd = new Date(event.end_time).getTime();
    event.end_time = new Date(currentEnd - hours * 3600 * 1000).toISOString();
    this.save();
    return event;
  }

  // --- TRANSACTIONS & EMOJIS ---
  public logTransaction(fromId: string, toId: string, type: string, amount: number, _unit: string, note: string): TransactionRecord {
    const record: TransactionRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      from_id: fromId,
      to_id: toId,
      type,
      amount,
      note,
      timestamp: new Date().toISOString()
    };
    this.data.transactions.push(record);
    if (this.data.transactions.length > 500) {
      this.data.transactions.shift();
    }
    this.save();
    return record;
  }

  public addCustomEmoji(emoji: string): void {
    if (!this.data.custom_emojis.includes(emoji)) {
      this.data.custom_emojis.push(emoji);
      this.save();
    }
  }

  public getCustomEmojis(): string[] {
    return this.data.custom_emojis;
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  public getStaffGiftCountToday(staffId: string): number {
    return this.getStaffGiftCount(staffId);
  }

  public getQuanLy(userId: string): StaffEntry | null {
    return this.data.quan_ly[userId] || null;
  }

  public getStaff(userId: string): StaffEntry | null {
    return this.data.staff[userId] || null;
  }

  public listQuanLy(): StaffEntry[] {
    return Object.values(this.data.quan_ly || {});
  }

  public listStaff(): StaffEntry[] {
    return Object.values(this.data.staff || {});
  }

  // --- CHARACTER IMAGES (/setanhthe & /setanhchar & /setanh & /setupanh & Mtestanh & Mxemthe & Mchar) ---
  public setCharacterImage(charName: string, tier: CardTier | string, url: string): void {
    if (!this.data.character_images) this.data.character_images = {};
    if (!this.data.character_images[charName]) {
      this.data.character_images[charName] = {};
    }
    this.data.character_images[charName][tier as CardTier] = url;
    if (tier === '1000' || tier === '1000_affection') {
      this.data.character_images[charName]['1000'] = url;
      this.data.character_images[charName]['1000_affection'] = url;
    }
    this.save();
  }

  public setCharProfileImage(charName: string, url: string): void {
    if (!this.data.character_images) this.data.character_images = {};
    if (!this.data.character_images[charName]) {
      this.data.character_images[charName] = {};
    }
    this.data.character_images[charName].profile = url;
    this.save();
  }

  public getCharProfileImage(charName: string): string | null {
    if (!this.data.character_images) return null;
    const char = this.data.character_images[charName];
    if (!char) return null;
    return char.profile || char['1000_affection'] || char['1000'] || char.S || char.A || char.B || char.C || null;
  }

  public get1000AffectionImage(charName: string): string | null {
    if (!this.data.character_images) return null;
    const char = this.data.character_images[charName];
    if (!char) return null;
    return char['1000_affection'] || char['1000'] || null;
  }

  public getCharacterImages(charName: string): { C?: string; B?: string; A?: string; S?: string; '1000'?: string; '1000_affection'?: string; profile?: string } {
    if (!this.data.character_images) this.data.character_images = {};
    return this.data.character_images[charName] || {};
  }

  // --- CẢM XÚC & BIỂU CẢM NHÂN VẬT ---
  public getEmotion(guildId: string, userId: string, charName: string): string {
    const user = this.getOrCreateUser(guildId, userId);
    return (user.char_emotion && user.char_emotion[charName]) ? user.char_emotion[charName] : 'Bình thường';
  }

  public setEmotion(guildId: string, userId: string, charName: string, emotion: string): void {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.char_emotion) user.char_emotion = {};
    user.char_emotion[charName] = emotion;
    this.save();
  }

  public getExpression(guildId: string, userId: string, charName: string): string {
    const user = this.getOrCreateUser(guildId, userId);
    return (user.char_expression && user.char_expression[charName]) ? user.char_expression[charName] : 'Bình thường';
  }

  public setExpression(guildId: string, userId: string, charName: string, expression: string): void {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.char_expression) user.char_expression = {};
    user.char_expression[charName] = expression;
    this.save();
  }

  // --- 1000 HẢO CẢM NOTIFICATION & TRACKING ---
  public is1000NotificationSent(guildId: string, userId: string, charName: string): boolean {
    const user = this.getOrCreateUser(guildId, userId);
    return !!(user.affection_1000_notification_sent && user.affection_1000_notification_sent[charName]);
  }

  public mark1000NotificationSent(guildId: string, userId: string, charName: string, channelId: string): void {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.affection_1000_notification_sent) user.affection_1000_notification_sent = {};
    if (!user.affection_1000_notification_channel_id) user.affection_1000_notification_channel_id = {};
    user.affection_1000_notification_sent[charName] = true;
    user.affection_1000_notification_channel_id[charName] = channelId;
    this.save();
  }

  // --- THƯ VIỆN ẢNH (Mxemthuvien, Mthuvien) ---
  public addPhotoToLibrary(guildId: string, userId: string, charName: string, photoUrl: string): boolean {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.photo_library) user.photo_library = {};
    if (!user.photo_library[charName]) user.photo_library[charName] = [];
    if (!user.photo_library[charName].includes(photoUrl)) {
      user.photo_library[charName].push(photoUrl);
      this.save();
      return true;
    }
    return false;
  }

  public hasPhotoInLibrary(guildId: string, userId: string, charName: string, photoUrl: string): boolean {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.photo_library || !user.photo_library[charName]) return false;
    return user.photo_library[charName].includes(photoUrl);
  }

  public getPhotosInLibrary(guildId: string, userId: string, charName: string): string[] {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.photo_library || !user.photo_library[charName]) return [];
    return [...user.photo_library[charName]];
  }

  public getCharacterGalleryPhotos(guildId: string, userId: string, charName: string): { label: string; url: string }[] {
    const list: { label: string; url: string }[] = [];
    const imgs = this.getCharacterImages(charName);
    const hc = this.getHaoCam(guildId, userId, charName);
    const user = this.getOrCreateUser(guildId, userId);

    // 1. Thẻ bài C, B, A, S mà người chơi đã sở hữu (chỉ hiện khi ảnh đã được setup bằng lệnh!)
    const tiers: ('C' | 'B' | 'A' | 'S')[] = ['C', 'B', 'A', 'S'];
    for (const t of tiers) {
      if (this.hasTheNhanVat(guildId, userId, charName, t)) {
        if (imgs[t] && (imgs[t]!.startsWith('http://') || imgs[t]!.startsWith('https://'))) {
          list.push({ label: `Thẻ Cấp ${t}`, url: imgs[t]! });
        }
      }
    }

    // 2. Mốc 1000 Hảo Cảm (chỉ hiện khi đã được setup ảnh bằng lệnh, không hiện ảnh không liên quan!)
    if (hc >= 1000) {
      const p1000 = imgs['1000_affection'] || imgs['1000'];
      if (p1000 && (p1000.startsWith('http://') || p1000.startsWith('https://')) && !p1000.includes('3752c2e8d7c9d6d2fd0d37cd6f45758d.gif') && !list.some(item => item.url === p1000)) {
        list.push({ label: 'Đạt Mốc 1.000 Hảo Cảm', url: p1000 });
      }
    }

    // 3. Ảnh hồ sơ đã được setup bằng lệnh (/setanh, /setanhchar, Msetanhchar)
    if (imgs.profile && (imgs.profile.startsWith('http://') || imgs.profile.startsWith('https://')) && (this.hasTheNhanVat(guildId, userId, charName, 'C') || this.hasTheNhanVat(guildId, userId, charName, 'B') || this.hasTheNhanVat(guildId, userId, charName, 'A') || this.hasTheNhanVat(guildId, userId, charName, 'S') || hc > 0 || user.su_phu === charName)) {
      if (!list.some(item => item.url === imgs.profile)) {
        list.push({ label: 'Ảnh Hồ Sơ', url: imgs.profile });
      }
    }

    // 4. Ảnh thư viện đã được setup hoặc nhận hợp lệ
    if (user.photo_library && user.photo_library[charName]) {
      for (const url of user.photo_library[charName]) {
        if (url && (url.startsWith('http://') || url.startsWith('https://')) && !url.includes('3752c2e8d7c9d6d2fd0d37cd6f45758d.gif') && !list.some(item => item.url === url)) {
          list.push({ label: 'Ảnh Thư Viện', url });
        }
      }
    }

    return list;
  }

  public getOwnedPhotoCharacters(guildId: string, userId: string): string[] {
    const user = this.getOrCreateUser(guildId, userId);
    const charsSet = new Set<string>();

    if (user.photo_library) {
      for (const [c, urls] of Object.entries(user.photo_library)) {
        if (urls && urls.length > 0) charsSet.add(c);
      }
    }

    if (user.the_nhan_vat) {
      for (const [c, cards] of Object.entries(user.the_nhan_vat)) {
        const imgs = this.getCharacterImages(c);
        if (cards && (cards.C || cards.B || cards.A || cards.S)) {
          if (imgs.C || imgs.B || imgs.A || imgs.S) {
            charsSet.add(c);
          }
        }
      }
    }

    if (user.hao_cam) {
      for (const [c, hc] of Object.entries(user.hao_cam)) {
        if (hc >= 1000) charsSet.add(c);
      }
    }

    return Array.from(charsSet).filter(c => this.getCharacterGalleryPhotos(guildId, userId, c).length > 0);
  }

  public getAllOwnedPhotos(guildId: string, userId: string): { charName: string; label: string; url: string }[] {
    const ownedChars = this.getOwnedPhotoCharacters(guildId, userId);
    const res: { charName: string; label: string; url: string }[] = [];
    for (const charName of ownedChars) {
      const photos = this.getCharacterGalleryPhotos(guildId, userId, charName);
      for (const p of photos) {
        res.push({ charName, label: p.label, url: p.url });
      }
    }
    return res;
  }

  public recordGiftGiven(guildId: string, userId: string, charName: string, giftName: string, isLike: boolean, hateDelta: number): void {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.gifts_given) user.gifts_given = {};
    if (!user.gifts_given[charName]) user.gifts_given[charName] = {};
    user.gifts_given[charName][giftName] = (user.gifts_given[charName][giftName] || 0) + 1;

    if (!user.dislike_score) user.dislike_score = {};
    if (!user.dislikes_count) user.dislikes_count = {};

    if (!isLike) {
      user.dislikes_count[charName] = (user.dislikes_count[charName] || 0) + 1;
      user.dislike_score[charName] = Math.min(1000, (user.dislike_score[charName] || 0) + Math.abs(hateDelta || 15));
    } else {
      // Khi tặng quà được thích, độ ghét giảm đi (dỗ dành thành công)
      const reduceAmount = Math.max(5, Math.abs(hateDelta || 10));
      user.dislike_score[charName] = Math.max(0, (user.dislike_score[charName] || 0) - reduceAmount);
    }
    this.save();
  }

  public getGiftsGiven(guildId: string, userId: string, charName: string): Record<string, number> {
    const user = this.getOrCreateUser(guildId, userId);
    return (user.gifts_given && user.gifts_given[charName]) ? user.gifts_given[charName] : {};
  }

  public getDislikeInfo(guildId: string, userId: string, charName: string): { count: number; score: number } {
    const user = this.getOrCreateUser(guildId, userId);
    const count = (user.dislikes_count && user.dislikes_count[charName]) ? user.dislikes_count[charName] : 0;
    const score = (user.dislike_score && user.dislike_score[charName]) ? user.dislike_score[charName] : 0;
    return { count, score };
  }

  public setSuPhu(guildId: string, userId: string, charName: string): void {
    const user = this.getOrCreateUser(guildId, userId);
    user.su_phu = charName;
    if (!user.su_phu_list) user.su_phu_list = [];
    if (!user.su_phu_list.includes(charName)) {
      user.su_phu_list.push(charName);
    }
    this.save();
  }

  public getBaiSuList(guildId: string, userId: string): string[] {
    const user = this.getOrCreateUser(guildId, userId);
    const list = Array.isArray(user.su_phu_list) ? [...user.su_phu_list] : [];
    if (user.su_phu && !list.includes(user.su_phu)) {
      list.push(user.su_phu);
    }
    return list;
  }

  // --- HẢO CẢM & LÃNH CUNG ---
  public getHaoCam(guildId: string, userId: string, charName: string): number {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.hao_cam) user.hao_cam = {};
    if (user.hao_cam[charName] === undefined) {
      user.hao_cam[charName] = 10; // Hảo cảm ban đầu là 10
      this.save();
    }
    // Lãnh Cung check
    this.checkLanhCung(guildId, userId, charName);
    return user.hao_cam[charName];
  }

  public adjustHaoCam(guildId: string, userId: string, charName: string, delta: number): number {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.hao_cam) user.hao_cam = {};
    const current = user.hao_cam[charName] !== undefined ? user.hao_cam[charName] : 10;
    const updated = current + delta; // Cho phép số âm & vượt 1000
    user.hao_cam[charName] = updated;
    user.updated_at = new Date().toISOString();
    this.save();
    return updated;
  }

  public adjustDislikeScore(guildId: string, userId: string, charName: string, delta: number): number {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.dislike_score) user.dislike_score = {};
    const current = user.dislike_score[charName] !== undefined ? user.dislike_score[charName] : 0;
    const updated = Math.min(1000, Math.max(0, current + delta));
    user.dislike_score[charName] = updated;
    user.updated_at = new Date().toISOString();
    this.save();
    return updated;
  }

  public setDislikeScore(guildId: string, userId: string, charName: string, score: number): number {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.dislike_score) user.dislike_score = {};
    const updated = Math.min(1000, Math.max(0, score));
    user.dislike_score[charName] = updated;
    user.updated_at = new Date().toISOString();
    this.save();
    return updated;
  }

  // --- TRANG BỊ & THÁO BỎ VŨ KHÍ, GIÁP (Mgan & Mbogan) ---
  public equipItem(guildId: string, userId: string, itemName: string): { success: boolean; message: string; type?: 'weapon' | 'armor' } {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.inventory) {
      user.inventory = { dan_duoc: { truong_sinh_dan: 0 }, weapons: [], armor: [], charms: { bua_may_man: 0 } };
    }
    if (!user.equipped_weapons) user.equipped_weapons = [];
    if (!user.equipped_armor) user.equipped_armor = [];

    const norm = itemName.trim().toLowerCase();

    // Check weapon in inventory
    const weaponMatch = user.inventory.weapons.find(w => w.toLowerCase() === norm || w.toLowerCase().includes(norm));
    if (weaponMatch) {
      if (user.equipped_weapons.length >= 3) {
        return { success: false, message: '⛔ Đạo hữu đã trang bị tối đa **3 vũ khí**! Hãy dùng `Mbogan <tên vũ khí>` để tháo bớt trước khi trang bị thêm.' };
      }
      user.equipped_weapons.push(weaponMatch);
      const idx = user.inventory.weapons.indexOf(weaponMatch);
      if (idx !== -1) user.inventory.weapons.splice(idx, 1);
      this.save();
      return { 
        success: true, 
        message: `🗡️ Đã trang bị thành công **${weaponMatch}**! (Vũ khí đang trang bị: \`${user.equipped_weapons.length}/3\`)`,
        type: 'weapon' 
      };
    }

    // Check armor in inventory
    const armorMatchIdx = user.inventory.armor.findIndex(a => a.name.toLowerCase() === norm || a.name.toLowerCase().includes(norm));
    if (armorMatchIdx !== -1) {
      if (user.equipped_armor.length >= 3) {
        return { success: false, message: '⛔ Đạo hữu đã trang bị tối đa **3 giáp phòng ngự**! Hãy dùng `Mbogan <tên giáp>` để tháo bớt trước khi trang bị thêm.' };
      }
      const armorItem = user.inventory.armor[armorMatchIdx];
      user.equipped_armor.push(armorItem);
      user.inventory.armor.splice(armorMatchIdx, 1);
      this.save();
      return { 
        success: true, 
        message: `🛡️ Đã trang bị thành công **${armorItem.name}** (Độ bền: \`${armorItem.durability}/3\`)! (Giáp đang trang bị: \`${user.equipped_armor.length}/3\`)`,
        type: 'armor' 
      };
    }

    return { 
      success: false, 
      message: `⛔ Không tìm thấy vật phẩm **${itemName}** trong túi trữ vật của bạn! Hãy mua tại \`Mshop\` hoặc kiểm tra lại bằng lệnh \`Mhs\`.` 
    };
  }

  public unequipItem(guildId: string, userId: string, itemName: string): { success: boolean; message: string; type?: 'weapon' | 'armor' } {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.inventory) {
      user.inventory = { dan_duoc: { truong_sinh_dan: 0 }, weapons: [], armor: [], charms: { bua_may_man: 0 } };
    }
    if (!user.equipped_weapons) user.equipped_weapons = [];
    if (!user.equipped_armor) user.equipped_armor = [];

    const norm = itemName.trim().toLowerCase();

    // Check equipped weapon
    const weaponIdx = user.equipped_weapons.findIndex(w => w.toLowerCase() === norm || w.toLowerCase().includes(norm));
    if (weaponIdx !== -1) {
      const removed = user.equipped_weapons.splice(weaponIdx, 1)[0];
      user.inventory.weapons.push(removed);
      this.save();
      return { 
        success: true, 
        message: `🗡️ Đã tháo bỏ **${removed}** về lại túi trữ vật! (Vũ khí còn trang bị: \`${user.equipped_weapons.length}/3\`)`,
        type: 'weapon' 
      };
    }

    // Check equipped armor
    const armorIdx = user.equipped_armor.findIndex(a => a.name.toLowerCase() === norm || a.name.toLowerCase().includes(norm));
    if (armorIdx !== -1) {
      const removedArmor = user.equipped_armor.splice(armorIdx, 1)[0];
      user.inventory.armor.push(removedArmor);
      this.save();
      return { 
        success: true, 
        message: `🛡️ Đã tháo bỏ **${removedArmor.name}** về lại túi trữ vật! (Giáp còn trang bị: \`${user.equipped_armor.length}/3\`)`,
        type: 'armor' 
      };
    }

    return { 
      success: false, 
      message: `⚠️ Đạo hữu hiện không trang bị món đồ **${itemName}**!` 
    };
  }

  public getEquipped(guildId: string, userId: string): { weapons: string[]; armor: { id: string; name: string; durability: number }[] } {
    const user = this.getOrCreateUser(guildId, userId);
    return {
      weapons: user.equipped_weapons || [],
      armor: user.equipped_armor || []
    };
  }

  public recordInteraction(guildId: string, userId: string, charName: string): void {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.last_interact_su_phu) user.last_interact_su_phu = {};
    user.last_interact_su_phu[charName] = new Date().toISOString();
    this.save();
  }

  public checkLanhCung(guildId: string, userId: string, charName: string): { dropped: boolean; daysInactive: number; penalty: number } {
    const user = this.getUser(guildId, userId);
    if (!user || !user.last_interact_su_phu || !user.last_interact_su_phu[charName]) {
      return { dropped: false, daysInactive: 0, penalty: 0 };
    }
    const lastDate = new Date(user.last_interact_su_phu[charName]).getTime();
    const now = Date.now();
    const daysDiff = Math.floor((now - lastDate) / (24 * 3600 * 1000));
    if (daysDiff >= 3) {
      const penaltyDays = daysDiff - 2;
      const penalty = penaltyDays * 5;
      if (!user.hao_cam) user.hao_cam = {};
      const current = user.hao_cam[charName] !== undefined ? user.hao_cam[charName] : 10;
      user.hao_cam[charName] = current - penalty;
      // Cập nhật lại ngày để không trừ lặp vô hạn trong cùng ngày
      user.last_interact_su_phu[charName] = new Date(lastDate + penaltyDays * 24 * 3600 * 1000).toISOString();
      this.save();
      return { dropped: true, daysInactive: daysDiff, penalty };
    }
    return { dropped: false, daysInactive: daysDiff, penalty: 0 };
  }

  // --- MẢNH NHÂN VẬT & THẺ NHÂN VẬT ---
  public addManhNhanVat(guildId: string, userId: string, charName: string, tier: 'C' | 'B' | 'A' | 'S', amount: number): number {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.manh_nhan_vat) user.manh_nhan_vat = {};
    if (!user.manh_nhan_vat[charName]) {
      user.manh_nhan_vat[charName] = { C: 0, B: 0, A: 0, S: 0 };
    }
    user.manh_nhan_vat[charName][tier] = Math.max(0, (user.manh_nhan_vat[charName][tier] || 0) + amount);
    this.save();
    return user.manh_nhan_vat[charName][tier];
  }

  public getManhNhanVat(guildId: string, userId: string, charName: string): { C: number; B: number; A: number; S: number } {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.manh_nhan_vat) user.manh_nhan_vat = {};
    if (!user.manh_nhan_vat[charName]) {
      user.manh_nhan_vat[charName] = { C: 0, B: 0, A: 0, S: 0 };
    }
    return user.manh_nhan_vat[charName];
  }

  public addTheNhanVat(guildId: string, userId: string, charName: string, tier: 'C' | 'B' | 'A' | 'S'): void {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.the_nhan_vat) user.the_nhan_vat = {};
    if (!user.the_nhan_vat[charName]) {
      user.the_nhan_vat[charName] = {};
    }
    user.the_nhan_vat[charName][tier] = true;
    this.save();
  }

  public hasTheNhanVat(guildId: string, userId: string, charName: string, tier: 'C' | 'B' | 'A' | 'S'): boolean {
    const user = this.getOrCreateUser(guildId, userId);
    return !!(user.the_nhan_vat && user.the_nhan_vat[charName] && user.the_nhan_vat[charName][tier]);
  }

  public countTheNhanVat(guildId: string, userId: string): number {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.the_nhan_vat) return 0;
    let total = 0;
    for (const char of Object.keys(user.the_nhan_vat)) {
      const cards = user.the_nhan_vat[char];
      if (cards.C) total++;
      if (cards.B) total++;
      if (cards.A) total++;
      if (cards.S) total++;
    }
    return total;
  }

  public count1000HaoCamCharacters(guildId: string, userId: string): number {
    const user = this.getOrCreateUser(guildId, userId);
    if (!user.hao_cam) return 0;
    let count = 0;
    for (const hc of Object.values(user.hao_cam)) {
      if (hc >= 1000) count++;
    }
    return count;
  }

  public getAllUsersSortedByTuVi(guildId: string): UserCultivation[] {
    return this.getAllGuildUsers(guildId).sort((a, b) => {
      const lvlA = getCultivationLevelIndex(a.realm, a.stage);
      const lvlB = getCultivationLevelIndex(b.realm, b.stage);
      if (lvlB !== lvlA) return lvlB - lvlA;
      return (b.tu_vi || 0) - (a.tu_vi || 0);
    });
  }

  public getAllUsersSortedByTKT(guildId: string): UserCultivation[] {
    return this.getAllGuildUsers(guildId).sort((a, b) => b.tinh_khong_thach - a.tinh_khong_thach);
  }

  public getAllUsersSortedByCards(guildId: string): UserCultivation[] {
    return this.getAllGuildUsers(guildId)
      .filter(u => this.countTheNhanVat(guildId, u.user_id) > 0)
      .sort((a, b) => {
        const cardsA = this.countTheNhanVat(guildId, a.user_id);
        const cardsB = this.countTheNhanVat(guildId, b.user_id);
        if (cardsB !== cardsA) return cardsB - cardsA;
        // Tiêu chí phụ: số sư phụ đạt 1000 hảo cảm
        const hcA = this.count1000HaoCamCharacters(guildId, a.user_id);
        const hcB = this.count1000HaoCamCharacters(guildId, b.user_id);
        return hcB - hcA;
      });
  }

  public getAllUsersOverall(guildId: string): UserCultivation[] {
    return this.getAllGuildUsers(guildId).sort((a, b) => {
      const scoreA = a.tinh_khong_thach / 1000 + a.manh_ky_uc * 10 + this.countTheNhanVat(guildId, a.user_id) * 100 + a.tu_vi;
      const scoreB = b.tinh_khong_thach / 1000 + b.manh_ky_uc * 10 + this.countTheNhanVat(guildId, b.user_id) * 100 + b.tu_vi;
      return scoreB - scoreA;
    });
  }

  public getAllHaoCamForCharacter(guildId: string, charName: string): { user: UserCultivation; hao_cam: number }[] {
    const all = this.getAllGuildUsers(guildId);
    return all
      .map(u => ({
        user: u,
        hao_cam: (u.hao_cam && u.hao_cam[charName] !== undefined) ? u.hao_cam[charName] : 10
      }))
      .sort((a, b) => b.hao_cam - a.hao_cam);
  }

  // --- STAFF PHÁT QUÀ (3 LẦN/NGÀY CHUNG TOÀN BỘ STAFF) ---
  public getSharedStaffPhatQuaToday(guildId: string): number {
    const today = new Date().toISOString().split('T')[0];
    const pool = this.data.staff_phatqua_pool[guildId];
    if (!pool || pool.date !== today) return 0;
    return pool.count;
  }

  public incrementSharedStaffPhatQua(guildId: string): number {
    const today = new Date().toISOString().split('T')[0];
    if (!this.data.staff_phatqua_pool) this.data.staff_phatqua_pool = {};
    const pool = this.data.staff_phatqua_pool[guildId];
    if (!pool || pool.date !== today) {
      this.data.staff_phatqua_pool[guildId] = { date: today, count: 1 };
    } else {
      pool.count += 1;
    }
    this.save();
    return this.data.staff_phatqua_pool[guildId].count;
  }

  // --- BOSS SYSTEM ---
  public getBossChung(guildId: string): BossChungState | null {
    if (!this.data.boss_chung) this.data.boss_chung = {};
    return this.data.boss_chung[guildId] || null;
  }

  public setBossChung(guildId: string, state: BossChungState | null): void {
    if (!this.data.boss_chung) this.data.boss_chung = {};
    if (!state) {
      delete this.data.boss_chung[guildId];
    } else {
      this.data.boss_chung[guildId] = state;
    }
    this.save();
  }

  public getBossDon(userId: string): BossCombatState | null {
    if (!this.data.boss_don) this.data.boss_don = {};
    return this.data.boss_don[userId] || null;
  }

  public setBossDon(userId: string, state: BossCombatState | null): void {
    if (!this.data.boss_don) this.data.boss_don = {};
    if (!state) {
      delete this.data.boss_don[userId];
    } else {
      this.data.boss_don[userId] = state;
    }
    this.save();
  }

  // --- MINI GAME TÌM MÂY ---
  public getTimMaySession(sessionId: string): TimMaySession | null {
    if (!this.data.tim_may_sessions) this.data.tim_may_sessions = {};
    return this.data.tim_may_sessions[sessionId] || null;
  }

  public getActiveTimMaySessionByUser(userId: string): TimMaySession | null {
    if (!this.data.tim_may_sessions) this.data.tim_may_sessions = {};
    for (const session of Object.values(this.data.tim_may_sessions)) {
      if (session.user_id === userId && (session.status === 'ACTIVE')) {
        return session;
      }
    }
    return null;
  }

  public setTimMaySession(session: TimMaySession): void {
    if (!this.data.tim_may_sessions) this.data.tim_may_sessions = {};
    this.data.tim_may_sessions[session.id] = session;
    this.save();
  }

  public removeTimMaySession(sessionId: string): void {
    if (!this.data.tim_may_sessions) this.data.tim_may_sessions = {};
    delete this.data.tim_may_sessions[sessionId];
    this.save();
  }

  // --- HỆ THỐNG TÔNG MÔN (SECT) ---
  public getSect(sectIdOrName: string): SectInfo | null {
    if (!this.data.sects) this.data.sects = {};
    const key = sectIdOrName.trim().toLowerCase();
    if (this.data.sects[sectIdOrName]) {
      const s = this.data.sects[sectIdOrName];
      if (s.status !== 'DISBANDED') return s;
    }
    for (const s of Object.values(this.data.sects)) {
      if (s.status === 'DISBANDED') continue;
      if (s.sect_id.toLowerCase() === key || s.sect_name.toLowerCase() === key) {
        return s;
      }
    }
    return null;
  }

  public getSectByMember(userId: string): SectInfo | null {
    if (!this.data.sects) this.data.sects = {};
    for (const s of Object.values(this.data.sects)) {
      if (s.status === 'DISBANDED') continue;
      if (s.leader_id === userId || (s.elders && s.elders.includes(userId)) || (s.members && s.members.includes(userId))) {
        return s;
      }
    }
    return null;
  }

  public getAllSects(guildId?: string): SectInfo[] {
    if (!this.data.sects) this.data.sects = {};
    return Object.values(this.data.sects).filter(s => s.status !== 'DISBANDED' && (!guildId || s.guild_id === guildId));
  }

  public createSect(
    guildId: string,
    userId: string,
    userName: string,
    sectName: string,
    maxMembers: number,
    entryFee: number,
    dailyAllowance: number
  ): { success: boolean; message: string; sect?: SectInfo } {
    if (!this.data.sects) this.data.sects = {};

    const user = this.getOrCreateUser(guildId, userId, userName);
    const unified = getUnifiedCultivationRank(user);
    const minLevel = getCultivationLevelIndex('Hóa Thần', 'Trung Kỳ');

    if (unified.levelIndex < minLevel) {
      return {
        success: false,
        message: `⛔ Đạo hữu cần đạt cảnh giới tối thiểu **Hóa Thần — Trung Kỳ** trở lên mới có thể khai sơn lập phái! (Cảnh giới hiện tại: \`${unified.fullName}\`)`
      };
    }

    const existingMemberSect = this.getSectByMember(userId);
    if (existingMemberSect) {
      return {
        success: false,
        message: `⛔ Đạo hữu hiện đã là thành viên của tông môn **${existingMemberSect.sect_name}**! Không thể mở thêm tông môn khác.`
      };
    }

    if (!Number.isInteger(maxMembers) || maxMembers < 1 || maxMembers > 999) {
      return {
        success: false,
        message: `⛔ Số người tối đa phải là số nguyên từ 1 đến 999!`
      };
    }

    if (entryFee < 0 || dailyAllowance < 0) {
      return {
        success: false,
        message: `⛔ Mức Linh Thạch nộp khi vào và phát mỗi ngày không được là số âm!`
      };
    }

    const trimmedName = sectName.trim();
    if (!trimmedName) {
      return { success: false, message: '⛔ Tên tông môn không được để trống!' };
    }

    for (const s of Object.values(this.data.sects)) {
      if (s.status !== 'DISBANDED' && s.sect_name.toLowerCase() === trimmedName.toLowerCase()) {
        return { success: false, message: `⛔ Tông môn mang tên **${trimmedName}** đã tồn tại trong tu chân giới!` };
      }
    }

    const sectId = `sect_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newSect: SectInfo = {
      sect_id: sectId,
      guild_id: guildId,
      sect_name: trimmedName,
      leader_id: userId,
      leader_name: userName,
      elders: [],
      members: [],
      max_members: maxMembers,
      entry_fee: entryFee,
      daily_allowance: dailyAllowance,
      treasury: 1000000, // Quỹ ban đầu 1.000.000 Linh Thạch
      last_daily_treasury_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      status: 'ACTIVE',
      history: [
        {
          id: `tx_${Date.now()}`,
          action: 'CREATE',
          actor_id: userId,
          amount: 1000000,
          note: `Khai sơn lập phái, quỹ ban đầu 1.000.000 Linh Thạch`,
          timestamp: Date.now()
        }
      ],
      join_requests: []
    };

    this.data.sects[sectId] = newSect;
    this.save();

    return {
      success: true,
      message: `🎉 **Khai sơn lập phái thành công!**\n• Tông môn: **${trimmedName}**\n• Tông chủ: <@${userId}>\n• Quỹ ban đầu: \`1.000.000\` Linh Thạch\n• Giới hạn thành viên: \`${maxMembers}\` tu sĩ\n• Phí gia nhập: \`${entryFee.toLocaleString()}\` Linh Thạch\n• Chu cấp mỗi ngày: \`${dailyAllowance.toLocaleString()}\` Linh Thạch`,
      sect: newSect
    };
  }

  public submitJoinRequest(
    sectId: string,
    userId: string,
    userName: string
  ): { success: boolean; message: string; request?: any; sect?: SectInfo } {
    const sect = this.getSect(sectId);
    if (!sect || sect.status === 'DISBANDED') {
      return { success: false, message: '⛔ Tông môn không tồn tại hoặc đã bị giải thể!' };
    }

    const currentSect = this.getSectByMember(userId);
    if (currentSect) {
      return { success: false, message: `⛔ Đạo hữu đã thuộc tông môn **${currentSect.sect_name}**! Hãy rời tông môn cũ trước.` };
    }

    const totalMembers = 1 + (sect.elders?.length || 0) + (sect.members?.length || 0);
    if (totalMembers >= sect.max_members) {
      return { success: false, message: `⛔ Tông môn **${sect.sect_name}** đã đủ người (${totalMembers}/${sect.max_members})!` };
    }

    const user = this.getOrCreateUser(sect.guild_id, userId, userName);
    if (user.tinh_khong_thach < sect.entry_fee) {
      return {
        success: false,
        message: `⛔ Đạo hữu không đủ Linh Thạch nộp phí gia nhập! Cần: \`${sect.entry_fee.toLocaleString()}\`, hiện có: \`${user.tinh_khong_thach.toLocaleString()}\`.`
      };
    }

    if (!sect.join_requests) sect.join_requests = [];
    const pendingReq = sect.join_requests.find(r => r.applicant_id === userId && r.status === 'PENDING');
    if (pendingReq) {
      return { success: false, message: `⚠️ Đạo hữu đã gửi yêu cầu bái nhập tông môn này rồi, vui lòng chờ duyệt!` };
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newReq = {
      request_id: requestId,
      sect_id: sect.sect_id,
      applicant_id: userId,
      applicant_name: userName,
      status: 'PENDING' as const,
      created_at: Date.now()
    };

    sect.join_requests.push(newReq);
    this.save();

    return {
      success: true,
      message: `Đã gửi hồ sơ bái nhập tông môn **${sect.sect_name}** thành công!`,
      request: newReq,
      sect
    };
  }

  public reviewJoinRequest(
    sectId: string,
    requestId: string,
    reviewerId: string,
    approve: boolean
  ): { success: boolean; message: string; applicantId?: string; sectName?: string } {
    const sect = this.getSect(sectId);
    if (!sect || sect.status === 'DISBANDED') {
      return { success: false, message: '⛔ Tông môn không tồn tại hoặc đã bị giải tán!' };
    }

    const isLeader = sect.leader_id === reviewerId;
    const isElder = (sect.elders || []).includes(reviewerId);
    if (!isLeader && !isElder) {
      return { success: false, message: '⛔ Chỉ Tông chủ hoặc Trưởng lão của tông môn mới có quyền duyệt hồ sơ!' };
    }

    if (!sect.join_requests) sect.join_requests = [];
    const req = sect.join_requests.find(r => r.request_id === requestId);
    if (!req) {
      return { success: false, message: '⛔ Không tìm thấy yêu cầu gia nhập này!' };
    }
    if (req.status !== 'PENDING') {
      return { success: false, message: `⚠️ Yêu cầu này đã được xử lý trước đó (${req.status === 'ACCEPTED' ? 'Đã duyệt' : 'Đã từ chối'})!` };
    }

    if (!approve) {
      req.status = 'REJECTED';
      req.reviewed_by = reviewerId;
      req.reviewed_at = Date.now();
      this.save();
      return {
        success: true,
        message: `Đã từ chối đơn gia nhập của <@${req.applicant_id}>.`,
        applicantId: req.applicant_id,
        sectName: sect.sect_name
      };
    }

    const totalMembers = 1 + (sect.elders?.length || 0) + (sect.members?.length || 0);
    if (totalMembers >= sect.max_members) {
      return { success: false, message: `⛔ Tông môn hiện tại đã đầy chỗ (${totalMembers}/${sect.max_members})!` };
    }

    const applicant = this.getOrCreateUser(sect.guild_id, req.applicant_id);
    if (applicant.tinh_khong_thach < sect.entry_fee) {
      req.status = 'REJECTED';
      req.reviewed_by = reviewerId;
      req.reviewed_at = Date.now();
      this.save();
      return {
        success: false,
        message: `⛔ Người xin vào không còn đủ Linh Thạch nộp phí gia nhập (${applicant.tinh_khong_thach.toLocaleString()} < ${sect.entry_fee.toLocaleString()})!`
      };
    }

    // Trừ phí gia nhập đúng một lần và nộp vào quỹ tông môn
    applicant.tinh_khong_thach -= sect.entry_fee;
    sect.treasury += sect.entry_fee;

    if (!sect.members) sect.members = [];
    if (!sect.members.includes(req.applicant_id)) {
      sect.members.push(req.applicant_id);
    }

    req.status = 'ACCEPTED';
    req.reviewed_by = reviewerId;
    req.reviewed_at = Date.now();

    if (!sect.history) sect.history = [];
    sect.history.push({
      id: `tx_${Date.now()}`,
      action: 'CONTRIBUTE',
      actor_id: req.applicant_id,
      amount: sect.entry_fee,
      note: `Gia nhập tông môn nộp phí`,
      timestamp: Date.now()
    });

    this.save();

    return {
      success: true,
      message: `✅ Đã duyệt cho <@${req.applicant_id}> gia nhập tông môn **${sect.sect_name}**! Phí gia nhập: \`+${sect.entry_fee.toLocaleString()}\` Linh Thạch vào quỹ.`,
      applicantId: req.applicant_id,
      sectName: sect.sect_name
    };
  }

  public withdrawSectTreasury(
    sectId: string,
    leaderId: string,
    amount: number
  ): { success: boolean; message: string; remainingTreasury?: number } {
    const sect = this.getSect(sectId);
    if (!sect || sect.status === 'DISBANDED') {
      return { success: false, message: '⛔ Tông môn không tồn tại!' };
    }

    if (sect.leader_id !== leaderId) {
      return { success: false, message: '⛔ Chỉ có Tông chủ mới có quyền rút Linh Thạch từ quỹ tông môn!' };
    }

    if (isNaN(amount) || amount <= 0) {
      return { success: false, message: '⛔ Số Linh Thạch muốn rút phải là số nguyên dương!' };
    }

    if (sect.treasury < amount) {
      return {
        success: false,
        message: `⛔ Quỹ tông môn không đủ! Hiện có: \`${sect.treasury.toLocaleString()}\` Linh Thạch, muốn rút: \`${amount.toLocaleString()}\`.`
      };
    }

    const leader = this.getOrCreateUser(sect.guild_id, leaderId);
    sect.treasury -= amount;
    leader.tinh_khong_thach += amount;

    if (!sect.history) sect.history = [];
    sect.history.push({
      id: `tx_${Date.now()}`,
      action: 'WITHDRAW',
      actor_id: leaderId,
      amount,
      note: `Tông chủ rút quỹ`,
      timestamp: Date.now()
    });

    this.logTransaction(leaderId, sect.guild_id, 'WITHDRAW_SECT_TREASURY', amount, 'Linh Thạch', `Rút quỹ tông môn ${sect.sect_name}`);
    this.save();

    return {
      success: true,
      message: `✅ Rút quỹ thành công! Đã chuyển **+${amount.toLocaleString()} Linh Thạch** vào túi Tông chủ. Quỹ còn: \`${sect.treasury.toLocaleString()}\`.`,
      remainingTreasury: sect.treasury
    };
  }

  public addElder(
    sectId: string,
    leaderId: string,
    targetUserId: string
  ): { success: boolean; message: string } {
    const sect = this.getSect(sectId);
    if (!sect || sect.status === 'DISBANDED') {
      return { success: false, message: '⛔ Tông môn không tồn tại!' };
    }

    if (sect.leader_id !== leaderId) {
      return { success: false, message: '⛔ Chỉ Tông chủ mới có quyền bổ nhiệm Trưởng lão!' };
    }

    if (!sect.elders) sect.elders = [];
    if (sect.elders.length >= 3) {
      return { success: false, message: '⛔ Tông môn đã có tối đa 3 Trưởng lão!' };
    }

    if (targetUserId === leaderId) {
      return { success: false, message: '⛔ Tông chủ không thể tự bổ nhiệm mình làm Trưởng lão!' };
    }

    if (sect.elders.includes(targetUserId)) {
      return { success: false, message: '⛔ Tu sĩ này hiện đã là Trưởng lão!' };
    }

    if (!sect.members || !sect.members.includes(targetUserId)) {
      return { success: false, message: '⛔ Người được bổ nhiệm phải là đệ tử chính thức của tông môn!' };
    }

    sect.members = sect.members.filter(m => m !== targetUserId);
    sect.elders.push(targetUserId);
    this.save();

    return {
      success: true,
      message: `🎉 Bổ nhiệm thành công! <@${targetUserId}> đã chính thức trở thành **Trưởng lão** của **${sect.sect_name}**!`
    };
  }

  public removeElder(
    sectId: string,
    leaderId: string,
    targetUserId: string
  ): { success: boolean; message: string } {
    const sect = this.getSect(sectId);
    if (!sect || sect.status === 'DISBANDED') {
      return { success: false, message: '⛔ Tông môn không tồn tại!' };
    }

    if (sect.leader_id !== leaderId) {
      return { success: false, message: '⛔ Chỉ Tông chủ mới có quyền cách chức Trưởng lão!' };
    }

    if (!sect.elders || !sect.elders.includes(targetUserId)) {
      return { success: false, message: '⛔ Tu sĩ này không phải là Trưởng lão của tông môn!' };
    }

    sect.elders = sect.elders.filter(e => e !== targetUserId);
    if (!sect.members) sect.members = [];
    if (!sect.members.includes(targetUserId)) {
      sect.members.push(targetUserId);
    }
    this.save();

    return {
      success: true,
      message: `Đã cách chức Trưởng lão của <@${targetUserId}>, chuyển về làm đệ tử môn phái.`
    };
  }

  public kickMember(
    sectId: string,
    actorId: string,
    targetUserId: string
  ): { success: boolean; message: string } {
    const sect = this.getSect(sectId);
    if (!sect || sect.status === 'DISBANDED') {
      return { success: false, message: '⛔ Tông môn không tồn tại!' };
    }

    const isLeader = sect.leader_id === actorId;
    const isElder = (sect.elders || []).includes(actorId);

    if (!isLeader && !isElder) {
      return { success: false, message: '⛔ Bạn không có quyền khai trừ thành viên!' };
    }

    if (targetUserId === sect.leader_id) {
      return { success: false, message: '⛔ Không thể khai trừ Tông chủ!' };
    }

    if ((sect.elders || []).includes(targetUserId) && !isLeader) {
      return { success: false, message: '⛔ Trưởng lão không thể khai trừ Trưởng lão khác! Chỉ Tông chủ mới có quyền này.' };
    }

    sect.elders = (sect.elders || []).filter(e => e !== targetUserId);
    sect.members = (sect.members || []).filter(m => m !== targetUserId);
    this.save();

    return {
      success: true,
      message: `Đã khai trừ <@${targetUserId}> khỏi tông môn **${sect.sect_name}**.`
    };
  }

  public leaveSect(userId: string): { success: boolean; message: string } {
    const sect = this.getSectByMember(userId);
    if (!sect) {
      return { success: false, message: '⛔ Đạo hữu chưa gia nhập tông môn nào!' };
    }

    if (sect.leader_id === userId) {
      return {
        success: false,
        message: '⛔ Tông chủ không thể tự ý rời tông! Hãy dùng lệnh `Mtmcuatoi` và bấm [XÓA TÔNG MÔN] để giải tán hoặc chuyển giao quyền lực.'
      };
    }

    sect.elders = (sect.elders || []).filter(e => e !== userId);
    sect.members = (sect.members || []).filter(m => m !== userId);
    this.save();

    return {
      success: true,
      message: `Đã rời khỏi tông môn **${sect.sect_name}** thành công.`
    };
  }

  public disbandSect(
    sectId: string,
    actorId: string,
    isOwnerOrAdmin = false
  ): { success: boolean; message: string; sect?: SectInfo } {
    const sect = this.getSect(sectId);
    if (!sect || sect.status === 'DISBANDED') {
      return { success: false, message: '⛔ Tông môn không tồn tại hoặc đã giải thể!' };
    }

    if (sect.leader_id !== actorId && !isOwnerOrAdmin) {
      return { success: false, message: '⛔ Bạn không có quyền giải tán tông môn này!' };
    }

    sect.status = 'DISBANDED';
    if (!sect.history) sect.history = [];
    sect.history.push({
      id: `tx_${Date.now()}`,
      action: 'DISBAND',
      actor_id: actorId,
      amount: 0,
      note: `Giải tán tông môn`,
      timestamp: Date.now()
    });

    this.save();

    return {
      success: true,
      message: `Đã giải thể tông môn **${sect.sect_name}** an toàn. Toàn bộ môn quy đã kết thúc.`,
      sect
    };
  }

  // Quỹ tăng 100k/ngày, chu cấp đệ tử và thưởng chức vụ hàng ngày
  public processDailyTreasuryAndAllowance(): void {
    if (!this.data.sects) return;
    const today = new Date().toISOString().split('T')[0];

    for (const sect of Object.values(this.data.sects)) {
      if (sect.status === 'DISBANDED') continue;

      // 1. Quỹ tăng 100.000 Linh Thạch mỗi ngày
      if (sect.last_daily_treasury_date !== today) {
        sect.treasury = (sect.treasury || 0) + 100000;
        sect.last_daily_treasury_date = today;
        if (!sect.history) sect.history = [];
        sect.history.push({
          id: `tx_${Date.now()}_daily`,
          action: 'DAILY_GRANT',
          actor_id: 'SYSTEM',
          amount: 100000,
          note: `Thêm 100.000 Linh Thạch quỹ hàng ngày`,
          timestamp: Date.now()
        });
      }

      // 2. Thưởng chức vụ mỗi ngày (Tông chủ: 20k, Trưởng lão: 15k)
      if (sect.last_role_reward_date !== today) {
        sect.last_role_reward_date = today;
        const leader = this.getOrCreateUser(sect.guild_id, sect.leader_id);
        leader.tinh_khong_thach += 20000;

        for (const elderId of (sect.elders || [])) {
          const elder = this.getOrCreateUser(sect.guild_id, elderId);
          elder.tinh_khong_thach += 15000;
        }
      }

      // 3. Chu cấp Linh Thạch cho đệ tử
      if (sect.last_allowance_date !== today && sect.daily_allowance > 0) {
        const disciples = sect.members || [];
        if (disciples.length > 0) {
          const totalNeeded = disciples.length * sect.daily_allowance;

          if (sect.treasury >= totalNeeded) {
            sect.treasury -= totalNeeded;
            for (const dId of disciples) {
              const dUser = this.getOrCreateUser(sect.guild_id, dId);
              dUser.tinh_khong_thach += sect.daily_allowance;
            }
            sect.last_allowance_date = today;
          } else {
            // Quỹ không đủ: chia phần thiếu cho Tông chủ và Trưởng lão bù
            const fromTreasury = sect.treasury;
            const shortfall = totalNeeded - fromTreasury;
            const managers = [sect.leader_id, ...(sect.elders || [])];
            const perManager = Math.ceil(shortfall / managers.length);

            // Kiểm tra khả năng chi trả của các quản lý
            let canAffordAll = true;
            for (const mId of managers) {
              const mUser = this.getOrCreateUser(sect.guild_id, mId);
              if (mUser.tinh_khong_thach < perManager) {
                canAffordAll = false;
                break;
              }
            }

            if (canAffordAll) {
              sect.treasury = 0;
              for (const mId of managers) {
                const mUser = this.getOrCreateUser(sect.guild_id, mId);
                mUser.tinh_khong_thach -= perManager;
              }
              for (const dId of disciples) {
                const dUser = this.getOrCreateUser(sect.guild_id, dId);
                dUser.tinh_khong_thach += sect.daily_allowance;
              }
              sect.last_allowance_date = today;
            }
          }
        }
      }
    }

    this.save();
  }

  // --- TÔNG CHỦ SA ĐỌA ---
  public getCorruptedLeader(guildId?: string): CorruptedLeaderSession | null {
    if (!this.data.corrupted_leaders) this.data.corrupted_leaders = {};
    const key = guildId || 'GLOBAL';
    const session = this.data.corrupted_leaders[key];
    if (!session) return null;
    if (Date.now() > session.term_ends_at) return null;
    return session;
  }

  public checkAndSelectCorruptedLeader(guildId?: string): CorruptedLeaderSession | null {
    if (!this.data.corrupted_leaders) this.data.corrupted_leaders = {};
    const key = guildId || 'GLOBAL';
    const now = Date.now();
    const existing = this.data.corrupted_leaders[key];

    if (existing && now < existing.term_ends_at) {
      // Vẫn trong nhiệm kỳ
      return existing;
    }

    // Chọn Tông chủ mới
    const activeSects = this.getAllSects(guildId);
    if (activeSects.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * activeSects.length);
    const chosenSect = activeSects[randomIndex];

    const newSession: CorruptedLeaderSession = {
      leader_id: chosenSect.leader_id,
      sect_id: chosenSect.sect_id,
      term_started_at: now,
      term_ends_at: now + 30 * 24 * 60 * 60 * 1000, // 30 ngày (1 tháng)
      last_absorb_at: 0,
      cycle_id: `cycle_${now}`
    };

    this.data.corrupted_leaders[key] = newSession;
    this.save();
    return newSession;
  }

  public absorbFortune(leaderId: string): { success: boolean; message: string; details?: any } {
    const session = this.getCorruptedLeader();
    if (!session || session.leader_id !== leaderId) {
      return { success: false, message: '⛔ Đạo hữu hiện không phải là Tông Chủ Sa Đọa đang trong nhiệm kỳ!' };
    }

    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    if (session.last_absorb_at && now - session.last_absorb_at < SEVEN_DAYS_MS) {
      const remainingDays = Math.ceil((SEVEN_DAYS_MS - (now - session.last_absorb_at)) / (24 * 60 * 60 * 1000));
      return { success: false, message: `⏳ Vận khí thiên địa chưa hồi phục! Vui lòng chờ thêm **${remainingDays} ngày** nữa.` };
    }

    const sect = this.getSect(session.sect_id);
    if (!sect || sect.status === 'DISBANDED') {
      return { success: false, message: '⛔ Tông môn của bạn không còn hoạt động!' };
    }

    const leader = this.getOrCreateUser(sect.guild_id, leaderId);
    if (leader.diem_cong_hien < 3000) {
      return {
        success: false,
        message: `⛔ Hút vận khí tiêu tốn **3.000 Điểm Cống Hiến**! Đạo hữu hiện có: \`${leader.diem_cong_hien.toLocaleString()}\` điểm.`
      };
    }

    leader.diem_cong_hien -= 3000;

    let totalLT = 0;
    let totalTuVi = 0;
    let totalMKU = 0;

    const disciples = sect.members || [];
    for (const dId of disciples) {
      const dUser = this.getOrCreateUser(sect.guild_id, dId);
      const absorbLT = Math.floor(dUser.tinh_khong_thach * 0.3);
      const absorbTuVi = Math.floor(dUser.tu_vi * 0.3);
      const absorbMKU = Math.floor(dUser.manh_ky_uc * 0.3);

      dUser.tinh_khong_thach = Math.max(0, dUser.tinh_khong_thach - absorbLT);
      dUser.tu_vi = Math.max(0, dUser.tu_vi - absorbTuVi);
      dUser.manh_ky_uc = Math.max(0, dUser.manh_ky_uc - absorbMKU);

      totalLT += absorbLT;
      totalTuVi += absorbTuVi;
      totalMKU += absorbMKU;
    }

    leader.tinh_khong_thach += totalLT;
    leader.tu_vi += totalTuVi;
    leader.manh_ky_uc += totalMKU;

    session.last_absorb_at = now;
    this.save();

    return {
      success: true,
      message: `🌑 **HÚT VẬN KHÍ HOÀN TẤT!**\n• Linh Thạch tước đoạt: \`+${totalLT.toLocaleString()}\`\n• Tu Vi hấp thụ: \`+${totalTuVi.toLocaleString()}\`\n• Mảnh Ký Ức thu giữ: \`+${totalMKU.toLocaleString()}\`\n• Đã tiêu tốn \`3.000\` Điểm Cống Hiến.`,
      details: { totalLT, totalTuVi, totalMKU }
    };
  }

  // --- BÍ CẢNH TÔNG MÔN (10 ẢI & 50 BOSS) ---
  public createSectRealmSession(
    sectId: string,
    guildId: string,
    threadId: string
  ): SectRealmSession {
    if (!this.data.sect_realm_sessions) this.data.sect_realm_sessions = {};

    // Chọn ngẫu nhiên 10 boss không trùng từ danh sách 50 boss
    const shuffled = [...SECRET_REALM_50_BOSSES].sort(() => 0.5 - Math.random());
    const selectedBosses = shuffled.slice(0, 10);

    const now = Date.now();
    const sessionId = `realm_${sectId}_${now}`;

    const session: SectRealmSession = {
      session_id: sessionId,
      sect_id: sectId,
      guild_id: guildId,
      thread_id: threadId,
      started_at: now,
      deadline: now + 40 * 60 * 1000, // 40 phút
      current_stage: 1,
      selected_bosses: selectedBosses,
      current_boss_hp: selectedBosses[0].hp,
      current_boss_max_hp: selectedBosses[0].hp,
      participants: {},
      boss_buff_damage: 0,
      player_buff_damage: 0,
      is_finished: false,
      is_won: false,
      rewards_processed: false
    };

    this.data.sect_realm_sessions[sessionId] = session;
    this.save();
    return session;
  }

  public getSectRealmSessionByThread(threadId: string): SectRealmSession | null {
    if (!this.data.sect_realm_sessions) this.data.sect_realm_sessions = {};
    for (const session of Object.values(this.data.sect_realm_sessions)) {
      if (session.thread_id === threadId && !session.is_finished) {
        return session;
      }
    }
    return null;
  }

  public getActiveSectRealmSession(sectId: string): SectRealmSession | null {
    if (!this.data.sect_realm_sessions) this.data.sect_realm_sessions = {};
    for (const session of Object.values(this.data.sect_realm_sessions)) {
      if (session.sect_id === sectId && !session.is_finished) {
        return session;
      }
    }
    return null;
  }

  public advanceSectRealmStage(sessionId: string): { finished: boolean; stage: number; boss?: any } {
    if (!this.data.sect_realm_sessions) this.data.sect_realm_sessions = {};
    const session = this.data.sect_realm_sessions[sessionId];
    if (!session) return { finished: true, stage: 10 };

    if (session.current_stage >= 10) {
      session.is_finished = true;
      session.is_won = true;
      session.cleared_at = Date.now();
      this.save();
      return { finished: true, stage: 10 };
    }

    session.current_stage += 1;
    const nextBoss = session.selected_bosses[session.current_stage - 1];
    session.current_boss_hp = nextBoss.hp;
    session.current_boss_max_hp = nextBoss.hp;
    session.boss_buff_damage = 0;
    session.player_buff_damage = 0;
    this.save();

    return { finished: false, stage: session.current_stage, boss: nextBoss };
  }
}

export const db = new CultivationDatabase();
