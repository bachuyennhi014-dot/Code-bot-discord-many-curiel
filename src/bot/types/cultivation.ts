export type RealmName = 
  | 'Phàm Nhân'
  | 'Luyện Khí'
  | 'Trúc Cơ'
  | 'Kim Đan'
  | 'Nguyên Anh'
  | 'Hóa Thần'
  | 'Luyện Hư'
  | 'Hợp Thể'
  | 'Đại Thừa'
  | 'Độ Kiếp';

export const REALM_ORDER: RealmName[] = [
  'Phàm Nhân',
  'Luyện Khí',
  'Trúc Cơ',
  'Kim Đan',
  'Nguyên Anh',
  'Hóa Thần',
  'Luyện Hư',
  'Hợp Thể',
  'Đại Thừa',
  'Độ Kiếp'
];

export const LUYEN_KHI_STAGES = [
  'Tầng 1',
  'Tầng 2',
  'Tầng 3',
  'Tầng 4',
  'Tầng 5',
  'Tầng 6',
  'Tầng 7',
  'Tầng 8',
  'Tầng 9'
] as const;

export const STANDARD_STAGES = [
  'Sơ Kỳ',
  'Trung Kỳ',
  'Hậu Kỳ',
  'Viên Mãn'
] as const;

export const STAGE_ORDER = STANDARD_STAGES;

export const REALM_TU_VI_REQUIREMENT: Record<string, Record<string, number>> = {
  'Phàm Nhân': { 'Phàm Nhân': 1000, 'Sơ Kỳ': 1000 },
  'Luyện Khí': { 
    'Tầng 1': 4000, 
    'Tầng 2': 4000, 
    'Tầng 3': 4000, 
    'Tầng 4': 4000, 
    'Tầng 5': 4000, 
    'Tầng 6': 4000, 
    'Tầng 7': 4000, 
    'Tầng 8': 4000, 
    'Tầng 9': 4000 
  },
  'Trúc Cơ': { 
    'Sơ Kỳ': 16000, 
    'Trung Kỳ': 16000, 
    'Hậu Kỳ': 16000, 
    'Viên Mãn': 16000 
  },
  'Kim Đan': { 
    'Sơ Kỳ': 64000, 
    'Trung Kỳ': 64000, 
    'Hậu Kỳ': 64000, 
    'Viên Mãn': 64000 
  },
  'Nguyên Anh': { 
    'Sơ Kỳ': 256000, 
    'Trung Kỳ': 256000, 
    'Hậu Kỳ': 256000, 
    'Viên Mãn': 256000 
  },
  'Hóa Thần': { 
    'Sơ Kỳ': 1024000, 
    'Trung Kỳ': 1024000, 
    'Hậu Kỳ': 1024000, 
    'Viên Mãn': 1024000 
  },
  'Luyện Hư': { 
    'Sơ Kỳ': 4096000, 
    'Trung Kỳ': 4096000, 
    'Hậu Kỳ': 4096000, 
    'Viên Mãn': 4096000 
  },
  'Hợp Thể': { 
    'Sơ Kỳ': 16384000, 
    'Trung Kỳ': 16384000, 
    'Hậu Kỳ': 16384000, 
    'Viên Mãn': 16384000 
  },
  'Đại Thừa': { 
    'Sơ Kỳ': 65536000, 
    'Trung Kỳ': 65536000, 
    'Hậu Kỳ': 65536000, 
    'Viên Mãn': 65536000 
  },
  'Độ Kiếp': { 
    'Sơ Kỳ': 262144000, 
    'Trung Kỳ': 262144000, 
    'Hậu Kỳ': 262144000, 
    'Viên Mãn': 262144000,
    '3/10': 262144000,
    'Tầng 3/10': 262144000,
    'Tầng 3': 262144000
  }
};

export const REALM_TU_VI_REWARD: Record<string, Record<string, number>> = {
  'Phàm Nhân': { 'Phàm Nhân': 50, 'Sơ Kỳ': 50 },
  'Luyện Khí': { 
    'Tầng 1': 100, 
    'Tầng 2': 1100, 
    'Tầng 3': 2100, 
    'Tầng 4': 3000, 
    'Tầng 5': 3000, 
    'Tầng 6': 3000, 
    'Tầng 7': 3000, 
    'Tầng 8': 3000, 
    'Tầng 9': 3000 
  },
  'Trúc Cơ': { 
    'Sơ Kỳ': 6000, 
    'Trung Kỳ': 7000, 
    'Hậu Kỳ': 8000, 
    'Viên Mãn': 9000 
  },
  'Kim Đan': { 
    'Sơ Kỳ': 18000, 
    'Trung Kỳ': 19000, 
    'Hậu Kỳ': 20000, 
    'Viên Mãn': 21000 
  },
  'Nguyên Anh': { 
    'Sơ Kỳ': 42000, 
    'Trung Kỳ': 43000, 
    'Hậu Kỳ': 44000, 
    'Viên Mãn': 45000 
  },
  'Hóa Thần': { 
    'Sơ Kỳ': 90000, 
    'Trung Kỳ': 91000, 
    'Hậu Kỳ': 92000, 
    'Viên Mãn': 93000 
  },
  'Luyện Hư': { 
    'Sơ Kỳ': 186000, 
    'Trung Kỳ': 187000, 
    'Hậu Kỳ': 188000, 
    'Viên Mãn': 189000 
  },
  'Hợp Thể': { 
    'Sơ Kỳ': 378000, 
    'Trung Kỳ': 379000, 
    'Hậu Kỳ': 38000, 
    'Viên Mãn': 381000 
  },
  'Đại Thừa': { 
    'Sơ Kỳ': 762000, 
    'Trung Kỳ': 763000, 
    'Hậu Kỳ': 764000, 
    'Viên Mãn': 765000 
  },
  'Độ Kiếp': { 
    'Sơ Kỳ': 1530000, 
    'Trung Kỳ': 1531000, 
    'Hậu Kỳ': 1532000, 
    'Viên Mãn': 1533000,
    '3/10': 1531000,
    'Tầng 3/10': 1531000,
    'Tầng 3': 1531000
  }
};

export type LuyenKhiStage = typeof LUYEN_KHI_STAGES[number];
export type StandardStage = typeof STANDARD_STAGES[number];
export type RealmStage = 'Phàm Nhân' | LuyenKhiStage | StandardStage | string;

/**
 * Tính toán thứ tự cấp độ từ Phàm Nhân (0), Luyện Khí Tầng 1 (1) -> Luyện Khí Tầng 9 (9),
 * Trúc Cơ Sơ Kỳ (10)...
 */
export function getCultivationLevelIndex(realm: RealmName, stage: string): number {
  if (!realm || realm === 'Phàm Nhân') return 0;
  if (realm === 'Luyện Khí') {
    const idx = LUYEN_KHI_STAGES.indexOf(stage as any);
    return 1 + (idx >= 0 ? idx : 0);
  }
  // Các cảnh giới tiếp theo
  const realmIdx = REALM_ORDER.indexOf(realm);
  if (realmIdx < 0) return 0;
  const stageIdx = STANDARD_STAGES.indexOf(stage as any);
  let effectiveStageIdx = stageIdx >= 0 ? stageIdx : 0;
  if (realm === 'Độ Kiếp' && stageIdx < 0) {
    if (stage.includes('3') || stage === '3/10') effectiveStageIdx = 2;
  }
  // Phàm Nhân (1) + Luyện Khí 9 tầng (9) = 10
  const baseLevels = 10;
  const realmOffset = Math.max(0, realmIdx - 2); // Trúc Cơ là index 2
  return baseLevels + (realmOffset * 4) + effectiveStageIdx;
}

/**
 * Tính toán Tu Vi yêu cầu để thăng cấp tiếp theo:
 * - Điều kiện thăng cấp của cấp lớn (chuyển đại cảnh giới) ×4 lần với điều kiện trước
 * - Trong cùng cảnh giới (giữa các tầng / tiểu cảnh giới): giữ nguyên điều kiện thăng cấp
 */
export function getRequiredTuViForNextLevel(realm: RealmName, stage: string): number {
  const req = REALM_TU_VI_REQUIREMENT[realm]?.[stage];
  if (typeof req === 'number') return req;
  const realmIdx = Math.max(0, REALM_ORDER.indexOf(realm));
  return Math.floor(1000 * Math.pow(4, realmIdx));
}

/**
 * Tính toán Tu Vi nhận được mỗi lần tu luyện (Mtl):
 * - Tu vi kiếm được nếu thăng cấp nhỏ: +1.000 tu vi với tu vi kiếm được của cấp trước
 * - Tu vi kiếm được nếu thăng cấp lớn: ×2 với tu vi kiếm được của cấp trước
 * Tuyệt đối không để tu vi kiếm được lớn hơn hoặc bằng điều kiện thăng cấp!
 */
export function getTuViRewardPerMtl(realm: RealmName, stage: string): number {
  const req = getRequiredTuViForNextLevel(realm, stage);
  let reward = REALM_TU_VI_REWARD[realm]?.[stage];
  if (typeof reward !== 'number') {
    const realmIdx = Math.max(0, REALM_ORDER.indexOf(realm));
    reward = Math.floor(50 * Math.pow(2, realmIdx));
  }
  // Tuyệt đối không được lớn hơn hoặc bằng điều kiện thăng cấp
  if (reward >= req) {
    reward = Math.max(50, Math.floor(req * 0.75));
  }
  return reward;
}

/**
 * Lấy chỉ số giai đoạn trong cảnh giới hiện tại
 */
export function getRealmStageIndex(realm: RealmName, stage: string): number {
  if (realm === 'Phàm Nhân') return 0;
  if (realm === 'Luyện Khí') {
    const idx = LUYEN_KHI_STAGES.indexOf(stage as any);
    return idx >= 0 ? idx : 0;
  }
  if (realm === 'Độ Kiếp') {
    if (stage.includes('3') || stage === '3/10') return 2;
  }
  const idx = STANDARD_STAGES.indexOf(stage as any);
  return idx >= 0 ? idx : 0;
}

export function calculateThangCapSuccessRate(realm: RealmName, stage: string): number {
  const levelIdx = getCultivationLevelIndex(realm, stage);
  // Tỷ lệ ban đầu 80%, mỗi lần lên cấp giảm 2%, tối thiểu 20%
  const rate = 80 - (levelIdx * 2);
  return Math.max(20, rate);
}

export type PermissionLevel = 'OWNER' | 'QUAN_LY' | 'STAFF' | 'PLAYER';

export interface UserArmorItem {
  id: string;
  name: string;
  durability: number; // Tối đa 3 lần chặn, mỗi lần chặn -20 sát thương
}

export interface UserInventory {
  dan_duoc: {
    truong_sinh_dan: number;
  };
  weapons: string[]; // 'Kiếm Sắt', 'Kiếm Vàng'
  armor: UserArmorItem[]; // Giáp Sắt
  charms: {
    bua_may_man: number;
  };
  gifts?: Record<string, number>; // Quà tặng trong túi trữ vật
}

export interface CartItem {
  name: string;
  price: number;
  category: string;
  count: number;
}

export interface UserCultivation {
  user_id: string;
  guild_id: string;
  username: string;
  tinh_khong_thach: number; // Linh thạch
  manh_ky_uc: number;
  diem_cong_hien: number;
  realm: RealmName;
  stage: RealmStage;
  tu_vi: number;
  current_hp: number;
  max_hp: number;
  total_battles: number;
  wins: number;
  losses: number;
  thien_kiep: number; // 0 - 10 khi ở Hóa Thần -> Độ Kiếp
  pet: string | null; // e.g. 'Hồ Ly'
  pet_level: number;
  pet_count?: number; // Số lượng linh thú (ví dụ: 2 con Hồ Ly)
  pets?: string[];
  last_pet_reward: string | null;
  truong_sinh_active_battles: number; // Còn bao nhiêu trận HP luôn đầy
  inventory: UserInventory;
  equipped_weapons?: string[]; // Tối đa 3 vũ khí trang bị để đánh boss (cho Mgan & Mbogan)
  equipped_armor?: UserArmorItem[]; // Tối đa 3 giáp phòng ngự trang bị để đánh boss (cho Mgan & Mbogan)
  cart?: CartItem[]; // Giỏ hàng của người chơi (bot không tự ý xóa)
  // Character System
  hao_cam?: Record<string, number>; // Điểm hảo cảm với từng nhân vật (mặc định 10, vượt 1000 vẫn lưu & tính BXH)
  manh_nhan_vat?: Record<string, { C: number; B: number; A: number; S: number }>;
  the_nhan_vat?: Record<string, { C?: boolean; B?: boolean; A?: boolean; S?: boolean }>;
  gifts_given?: Record<string, Record<string, number>>; // charName -> giftName -> count
  dislikes_count?: Record<string, number>; // charName -> số lần bị ghét/tặng trúng món ghét
  dislike_score?: Record<string, number>; // charName -> tổng điểm trừ từ các lần ghét
  su_phu?: string | null; // Tên nhân vật đã bái sư hiện tại
  su_phu_list?: string[]; // Danh sách các Sư phụ đã từng bái sư (cho Mchar)
  last_interact_su_phu?: Record<string, string>; // Thời gian cuối tặng quà / tương tác (cho Lãnh Cung)
  skills?: string[]; // Danh sách kỹ năng sở hữu cho Boss
  char_emotion?: Record<string, string>; // Cảm xúc hiện tại của nhân vật đối với người chơi
  char_expression?: Record<string, string>; // Biểu cảm hiện tại của nhân vật
  photo_library?: Record<string, string[]>; // charName -> array of unlocked photo URLs (thư viện ảnh)
  affection_1000_notification_sent?: Record<string, boolean>; // Đánh dấu đã gửi thông báo 1000 hảo cảm
  affection_1000_notification_channel_id?: Record<string, string>; // Kênh đã gửi thông báo 1000 hảo cảm
  boss_heals_used?: number; // Số lần hồi máu trong trận boss đơn (tối đa 3)
  boss_cooldown?: string | null;
  daily_last: string | null;
  daily_streak: number;
  trua_nam_count: number;
  trua_nam_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GuildConfig {
  guild_id: string;
  play_channel_id: string | null;
  hidden_channel_id: string | null;
  role_top1_id: string | null;
  role_tttl_id: string | null;
  role_phu_hao_id?: string | null; // Role Top 1 BXH Phú Hào (/setuprolephuhao)
  current_phu_hao_user_id?: string | null;
  role_dai_de_tu?: Record<string, string>; // Role Top 1 Đại Đệ Tử theo từng sư phụ
  current_top1_user_id?: string | null;
  season_end_time: string | null;
  updated_at: string;
}

export const CHARACTER_NAMES = [
  'Uyên Minh Dạ',
  'Vân Mộc Thanh',
  'Hùng Chấn Uy',
  'Phong Lăng Cửu',
  'Sở Dạ Ly',
  'Tuyết Vô Ngân',
  'Dạ Tinh Trầm',
  'Hách Liên Kiêu',
  'Cheon Seol-ha',
  'Chu Tinh Dật',
  'Tống Hiên',
  'Richard',
  'Tưởng Dã',
  'Tần Cảnh Duật',
  'Lục Cảnh Tử',
  'Khổng Uyên Dã',
  'Phó Yến Hành',
  'Phan Đình Gia Nguyên',
  'Hoàng Vỹ Đăng',
  'Phan Vũ Phong',
  'Seo Eun-kyul',
  'Thẩm Kính Uyên',
  'Tạ Kiêu Trạch',
  'Tống Hàn',
  'Hạ Tư Hành',
  'Nguyễn Hoài Phong',
  'Trần Hoàng Minh',
  'Lucian Dante',
  'Lục Cảnh Thâm'
] as const;

export type CharacterName = typeof CHARACTER_NAMES[number];
export type CardTier = 'C' | 'B' | 'A' | 'S' | '1000' | '1000_affection' | 'profile';

export interface CharacterBuff {
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
}

export const BUFF_DEFINITIONS: Record<number, CharacterBuff> = {
  1: { id: 1, name: 'Sát Thương Trảm Kích', description: '+15% sát thương' },
  2: { id: 2, name: 'Khí Vận Gia Trì', description: '+10% may mắn' },
  3: { id: 3, name: 'Kim Thân Hộ Thể', description: '+15% HP' },
  4: { id: 4, name: 'Tài Khí Hanh Thông', description: '+15% Tinh Không Thạch nhận được' },
  5: { id: 5, name: 'Đốn Ngộ Đạo Vận', description: '+5% tỷ lệ nhận Mảnh Nhân Vật/Mảnh Ký Ức khi tham gia Luận Đạo' },
};

export function getCharacterBuff(name: string): CharacterBuff {
  const idx = CHARACTER_NAMES.indexOf(name as any);
  const buffId = ((idx >= 0 ? idx : 0) % 5 + 1) as 1 | 2 | 3 | 4 | 5;
  return BUFF_DEFINITIONS[buffId];
}

export const CHARACTER_EMOJIS: Record<string, string> = {
  'Uyên Minh Dạ': '<a:vuongmien:1552252321818222632>',
  'Vân Mộc Thanh': '<:00_p2usflowerwhite:1556291340428648471>',
  'Hùng Chấn Uy': '<a:fx_spark:1550959536175845486>',
  'Phong Lăng Cửu': '<a:dx_butterfly:1555974583369211935>',
  'Sở Dạ Ly': '<a:pinkbow:1556291357436280902>',
  'Tuyết Vô Ngân': '<a:kawaiiMoonStars:1555974591904489543>',
  'Dạ Tinh Trầm': '<:kireiStarBlue:1556161474735374448>',
  'Hách Liên Kiêu': '<a:4_pulseheart2:1555974620010774639>',
  'Cheon Seol-ha': '<a:angelBUtterflyypink:1555974598041018458>',
  'Chu Tinh Dật': '<a:cutepaws:1552664924583362572>',
  'Tống Hiên': '<a:005_blue_heart:1552625798869946408>',
  'Richard': '<a:0001_pbear:1552625786882891896>',
  'Tưởng Dã': '<a:purpleflowergif:1551903808815374437>',
  'Tần Cảnh Duật': '<a:kireiBlueHearts:1556161469098238093>',
  'Lục Cảnh Tử': '<a:eerainbow_stars:1556291387396460676>',
  'Khổng Uyên Dã': '<:kireiStarPink:1556161477701013584>',
  'Phó Yến Hành': '<a:catcake:1556291345121943585>',
  'Phan Đình Gia Nguyên': '<a:pinkheartspin:1549047540954173460>',
  'Hoàng Vỹ Đăng': '<a:ha_cuterainbow:1556291382702768219>',
  'Phan Vũ Phong': '<a:04_greenbutterfly:1533115161039212554>',
  'Seo Eun-kyul': '<a:fx_cutebunny:1555974589371121734>',
  'Thẩm Kính Uyên': '<a:005_blue_jellyfish:1552625802296959086>',
  'Tạ Kiêu Trạch': '<a:005_bubbles1:1552625804356362281>',
  'Tống Hàn': '<a:005_bubbles3:1552625793753157704>',
  'Hạ Tư Hành': '<a:000029b_pinkbow:1552638909492756571>',
  'Nguyễn Hoài Phong': '<a:pink_strawberry:1556291360510836807>',
  'Trần Hoàng Minh': '<a:d_PusheenBoing:1555974561990975501>',
  'Lucian Dante': '<a:angelBlob:1555974603447472151>',
  'Lục Cảnh Thâm': '<a:douceur_purple026:1556161456360136764>'
};

export function parseAmount(str: string): number {
  if (!str) return NaN;
  const s = str.trim().toUpperCase();
  if (s.endsWith('B')) {
    const n = parseFloat(s.slice(0, -1));
    return isNaN(n) ? NaN : Math.floor(n * 1_000_000_000);
  }
  if (s.endsWith('M')) {
    const n = parseFloat(s.slice(0, -1));
    return isNaN(n) ? NaN : Math.floor(n * 1_000_000);
  }
  if (s.endsWith('K')) {
    const n = parseFloat(s.slice(0, -1));
    return isNaN(n) ? NaN : Math.floor(n * 1_000);
  }
  return parseInt(s.replace(/,/g, ''), 10);
}

export function normalizeCharacterName(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // Backward compatibility & typo alias mapping
  if (lower === 'sở da ly' || lower === 'so da ly' || lower === 'sơ da ly' || lower === 'so daly') return 'Sở Dạ Ly';
  if (lower === 'chu tỉnh dật' || lower === 'chu tinh dat' || lower === 'chu tinh dật' || lower === 'chutinhdat' || lower === 'chutỉnhdật') return 'Chu Tinh Dật';
  if (lower === 'phan đình gia nguyễn' || lower === 'phan dinh gia nguyen') return 'Phan Đình Gia Nguyên';
  if (lower === 'hoàng vỹ đăn' || lower === 'hoang vy dan') return 'Hoàng Vỹ Đăng';
  if (lower === 'tạ kiều trạch' || lower === 'ta kieu trach') return 'Tạ Kiêu Trạch';
  if (lower === 'tường dã' || lower === 'tuong da') return 'Tưởng Dã';
  if (lower === 'tổng hàn' || lower === 'tong han') return 'Tống Hàn';
  if (lower === 'uyên mĩnh dạ' || lower === 'uyen minh da') return 'Uyên Minh Dạ';
  if (lower === 'dạ tỉnh trầm' || lower === 'da tinh tram') return 'Dạ Tinh Trầm';

  const clean = lower.replace(/[\s_-]+/g, '');
  if (clean === 'sơdaly' || clean === 'sodaly' || clean === 'sởdaly') return 'Sở Dạ Ly';

  for (const name of CHARACTER_NAMES) {
    if (name.toLowerCase().replace(/[\s_-]+/g, '') === clean) {
      return name;
    }
  }
  // Partial search
  for (const name of CHARACTER_NAMES) {
    if (name.toLowerCase().includes(trimmed.toLowerCase())) {
      return name;
    }
  }
  return null;
}

export interface BossCombatState {
  thread_id?: string;
  channel_id: string;
  user_id: string;
  boss_name: string;
  boss_hp: number;
  boss_max_hp: number;
  player_hp: number;
  player_max_hp: number;
  heals_used: number; // max 3
  created_at: string;
  expires_at?: number;
}

export interface BossChungState {
  guild_id: string;
  channel_id: string;
  boss_name: string;
  boss_hp: number;
  boss_max_hp: number;
  is_alive: boolean;
  participants: Record<string, { damage: number; healed: number }>;
  heals_given: Record<string, number>; // max 3 per player
  created_at: string;
  rewards_claimed?: string[];
  defeated_players?: string[];
  message_id?: string;
}

export interface StaffEntry {
  user_id: string;
  username: string;
  added_by: string;
  added_at: string;
}

export interface BotBanRecord {
  user_id: string;
  guild_id: string;
  banned_by: string;
  reason: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface ChannelViolation {
  user_id: string;
  guild_id: string;
  count: number;
  last_violation: string;
}

export interface StaffGiftLimit {
  staff_id: string;
  count_today: number;
  last_gift_date: string;
}

export interface EventSchedule {
  event_name: string;
  start_time: string;
  end_time: string;
}

export interface TransactionRecord {
  id: string;
  type: string;
  from_id: string;
  to_id: string;
  amount: number;
  note: string;
  timestamp: string;
}

export interface LiXiSession {
  id: string;
  creator_id: string;
  creator_name: string;
  guild_id: string;
  channel_id: string;
  total_amount: number;
  remaining_amount: number;
  total_recipients: number;
  received_users: Record<string, number>;
  created_at: string;
  is_finished: boolean;
}

export interface TimMaySession {
  id: string;
  guild_id: string;
  channel_id: string;
  message_id?: string;
  user_id: string;
  user_name: string;
  bet_amount: number;
  step: 'INTRO' | 'PLAYING' | 'ENDED';
  // Array of 16 booleans: true = dark cloud (âm u), false = lucky cloud (may mắn)
  is_dark_cloud: boolean[];
  // Revealed states: 0 = unrevealed, 1 = revealed lucky, 2 = revealed dark
  revealed: number[];
  lucky_found: number;
  multiplier: number;
  status: 'ACTIVE' | 'WON' | 'LOST' | 'CASHED_OUT';
  created_at: string;
  ended_at?: string;
}

export interface UnifiedCultivationRank {
  realm: RealmName;
  stage: string;
  fullName: string;
  levelIndex: number;
  isMax: boolean;
}

export function getUnifiedCultivationRank(user: Partial<UserCultivation> | null | undefined): UnifiedCultivationRank {
  if (!user) {
    return {
      realm: 'Phàm Nhân',
      stage: 'Phàm Nhân',
      fullName: 'Phàm Nhân',
      levelIndex: 0,
      isMax: false
    };
  }
  
  let realm = user.realm as RealmName;
  let stage = user.stage as string;

  if (!realm || !REALM_ORDER.includes(realm)) {
    realm = 'Phàm Nhân';
  }
  
  if (realm === 'Phàm Nhân') {
    stage = 'Phàm Nhân';
  } else if (realm === 'Luyện Khí') {
    if (!stage || !LUYEN_KHI_STAGES.includes(stage as any)) {
      stage = 'Tầng 1';
    }
  } else {
    if (realm === 'Độ Kiếp' && stage && (stage.includes('3') || stage.includes('10') || stage.includes('/') || stage.includes('Tầng'))) {
      // Giữ nguyên tiến trình Độ Kiếp 3/10
    } else if (!stage || !STANDARD_STAGES.includes(stage as any)) {
      stage = 'Sơ Kỳ';
    }
  }

  const levelIndex = getCultivationLevelIndex(realm, stage);
  const fullName = realm === 'Phàm Nhân' ? 'Phàm Nhân' : `${realm} — ${stage}`;
  const isMax = realm === 'Độ Kiếp' && stage === 'Viên Mãn';

  return {
    realm,
    stage,
    fullName,
    levelIndex,
    isMax
  };
}

export interface SectJoinRequest {
  request_id: string;
  sect_id: string;
  applicant_id: string;
  applicant_name: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  created_at: number;
  reviewed_by?: string;
  reviewed_at?: number;
}

export interface SectTransaction {
  id: string;
  action: 'CREATE' | 'DAILY_GRANT' | 'WITHDRAW' | 'ALLOWANCE' | 'ABSORB' | 'CONTRIBUTE' | 'DISBAND';
  actor_id: string;
  amount: number;
  note: string;
  timestamp: number;
}

export interface SectInfo {
  sect_id: string;
  guild_id: string;
  sect_name: string;
  leader_id: string;
  leader_name: string;
  elders: string[]; // Tối đa 3 Trưởng lão
  members: string[]; // Danh sách đệ tử
  max_members: number; // 1 -> 999
  entry_fee: number; // Linh Thạch nộp khi vào
  daily_allowance: number; // Linh Thạch phát mỗi ngày cho đệ tử
  treasury: number; // Quỹ tông môn (khởi đầu 1.000.000)
  last_daily_treasury_date?: string; // YYYY-MM-DD
  last_allowance_date?: string; // YYYY-MM-DD
  last_role_reward_date?: string; // YYYY-MM-DD
  created_at: string;
  status: 'ACTIVE' | 'DISBANDED';
  history: SectTransaction[];
  join_requests: SectJoinRequest[];
}

export interface CorruptedLeaderSession {
  leader_id: string;
  sect_id: string;
  term_started_at: number;
  term_ends_at: number;
  last_absorb_at: number;
  cycle_id: string;
}

export interface SecretRealmBossDef {
  id: number;
  name: string;
  hp: number;
  damage: number;
}

export const SECRET_REALM_50_BOSSES: SecretRealmBossDef[] = [
  { id: 1, name: 'Hắc Vân Ma Lang', hp: 2000, damage: 180 },
  { id: 2, name: 'Thanh Lân Xà Vương', hp: 2200, damage: 190 },
  { id: 3, name: 'U Minh Huyết Điệp', hp: 2400, damage: 200 },
  { id: 4, name: 'Bạch Cốt Yêu Hồ', hp: 2600, damage: 210 },
  { id: 5, name: 'Xích Viêm Ma Hầu', hp: 2800, damage: 220 },
  { id: 6, name: 'Thiết Giáp Địa Ngưu', hp: 3000, damage: 230 },
  { id: 7, name: 'Tử Điện Lôi Báo', hp: 3200, damage: 240 },
  { id: 8, name: 'Hàn Nguyệt Băng Chu', hp: 3400, damage: 250 },
  { id: 9, name: 'Độc Vụ Quỷ Thiềm', hp: 3600, damage: 260 },
  { id: 10, name: 'Phong Nha Cự Ưng', hp: 3800, damage: 270 },
  { id: 11, name: 'Huyền Giáp Thạch Quy', hp: 4000, damage: 280 },
  { id: 12, name: 'Hỏa Vũ Kim Ô', hp: 4200, damage: 290 },
  { id: 13, name: 'Huyết Đồng Ma Viên', hp: 4400, damage: 300 },
  { id: 14, name: 'Bích Lạc Linh Xà', hp: 4600, damage: 310 },
  { id: 15, name: 'Cửu U Quỷ Tướng', hp: 4800, damage: 320 },
  { id: 16, name: 'Thiên Sa Độc Hạt', hp: 5000, damage: 330 },
  { id: 17, name: 'Ngân Dực Lang Hoàng', hp: 5200, damage: 340 },
  { id: 18, name: 'Xích Hà Viêm Sư', hp: 5400, damage: 350 },
  { id: 19, name: 'U Cốc Mộc Yêu', hp: 5600, damage: 360 },
  { id: 20, name: 'Lôi Văn Ma Tượng', hp: 5800, damage: 370 },
  { id: 21, name: 'Huyết Hải Tu La', hp: 6000, damage: 380 },
  { id: 22, name: 'Băng Phách Tuyết Giao', hp: 6200, damage: 390 },
  { id: 23, name: 'Cửu Đầu Âm Xà', hp: 6400, damage: 400 },
  { id: 24, name: 'Thiên Mục Quỷ Hổ', hp: 6600, damage: 410 },
  { id: 25, name: 'Hắc Diệm Ma Long', hp: 6800, damage: 420 },
  { id: 26, name: 'Vạn Độc Thiên Chu', hp: 7000, damage: 430 },
  { id: 27, name: 'Tinh Hà Kiếm Khôi', hp: 7200, damage: 440 },
  { id: 28, name: 'Lạc Nhật Kim Sư', hp: 7400, damage: 450 },
  { id: 29, name: 'Vô Diện Hồn Tướng', hp: 7600, damage: 460 },
  { id: 30, name: 'Thiên Cương Thạch Ma', hp: 7800, damage: 470 },
  { id: 31, name: 'Cửu Tiêu Lôi Giao', hp: 8000, damage: 480 },
  { id: 32, name: 'Huyền Băng Ma Phượng', hp: 8200, damage: 490 },
  { id: 33, name: 'Vạn Cốt Minh Vương', hp: 8400, damage: 500 },
  { id: 34, name: 'Tử Nguyệt Huyết Lang', hp: 8600, damage: 510 },
  { id: 35, name: 'Thôn Thiên Cự Mãng', hp: 8800, damage: 520 },
  { id: 36, name: 'Hỗn Độn Thực Hồn Thú', hp: 9000, damage: 530 },
  { id: 37, name: 'Cửu U Hỏa Kỳ Lân', hp: 9200, damage: 540 },
  { id: 38, name: 'Thiên Hà Trấn Ngục Thú', hp: 9400, damage: 550 },
  { id: 39, name: 'Vô Cực Huyết Ma', hp: 9600, damage: 560 },
  { id: 40, name: 'Thái Cổ Hắc Long', hp: 9800, damage: 570 },
  { id: 41, name: 'Thiên Mệnh Chiến Khôi', hp: 10000, damage: 580 },
  { id: 42, name: 'Táng Tiên Cốt Hoàng', hp: 9700, damage: 590 },
  { id: 43, name: 'Huyền Thiên Thôn Vân Thú', hp: 9500, damage: 600 },
  { id: 44, name: 'Vạn Kiếp Ma Quân', hp: 9300, damage: 610 },
  { id: 45, name: 'Tinh Thần Phệ Giả', hp: 9100, damage: 620 },
  { id: 46, name: 'Cửu Thiên Huyền Phượng', hp: 8900, damage: 630 },
  { id: 47, name: 'Hỗn Nguyên Trấn Giới Long', hp: 8700, damage: 640 },
  { id: 48, name: 'Thái Âm U Minh Chủ', hp: 8500, damage: 650 },
  { id: 49, name: 'Vạn Tượng Diệt Thế Thú', hp: 9900, damage: 660 },
  { id: 50, name: 'Thiên Khuyết Bí Cảnh Chi Chủ', hp: 10000, damage: 680 }
];

export interface SectRealmSession {
  session_id: string;
  sect_id: string;
  guild_id: string;
  thread_id: string;
  started_at: number;
  deadline: number; // started_at + 40 mins
  current_stage: number; // 1 to 10
  selected_bosses: SecretRealmBossDef[];
  current_boss_hp: number;
  current_boss_max_hp: number;
  participants: Record<string, {
    user_id: string;
    username: string;
    damage_dealt: number;
    hp: number;
    max_hp: number;
    defeated: boolean;
  }>;
  boss_buff_damage: number;
  player_buff_damage: number;
  is_finished: boolean;
  is_won: boolean;
  rewards_processed: boolean;
  cleared_at?: number;
}

export function calculateBossDamage(user: UserCultivation, isSkill: boolean = false): number {
  const unified = getUnifiedCultivationRank(user);
  const realmIdx = REALM_ORDER.indexOf(unified.realm);
  const stageIdx = getRealmStageIndex(unified.realm, unified.stage);
  
  // Sát thương phân cấp rõ rệt theo cảnh giới:
  // Phàm Nhân: 100
  // Luyện Khí (tầng 1-9): 120 + tầng * 25
  // Trúc Cơ: 380 + stageIdx * 50
  // Kim Đan: 600 + stageIdx * 80
  // Nguyên Anh: 1000 + stageIdx * 120
  // Hóa Thần: 1600 + stageIdx * 180
  // Luyện Hư: 2400 + stageIdx * 250
  // Hợp Thể: 3600 + stageIdx * 350
  // Đại Thừa: 5200 + stageIdx * 500
  // Độ Kiếp: 7500 + stageIdx * 700
  let baseDmg = 100;
  if (unified.realm === 'Phàm Nhân') {
    baseDmg = 100;
  } else if (unified.realm === 'Luyện Khí') {
    baseDmg = 120 + (stageIdx * 25);
  } else if (unified.realm === 'Trúc Cơ') {
    baseDmg = 380 + (stageIdx * 50);
  } else if (unified.realm === 'Kim Đan') {
    baseDmg = 600 + (stageIdx * 80);
  } else if (unified.realm === 'Nguyên Anh') {
    baseDmg = 1000 + (stageIdx * 120);
  } else if (unified.realm === 'Hóa Thần') {
    baseDmg = 1600 + (stageIdx * 180);
  } else if (unified.realm === 'Luyện Hư') {
    baseDmg = 2400 + (stageIdx * 250);
  } else if (unified.realm === 'Hợp Thể') {
    baseDmg = 3600 + (stageIdx * 350);
  } else if (unified.realm === 'Đại Thừa') {
    baseDmg = 5200 + (stageIdx * 500);
  } else if (unified.realm === 'Độ Kiếp') {
    baseDmg = 7500 + (stageIdx * 700);
  }

  if (isSkill) {
    baseDmg = Math.floor(baseDmg * 2.5);
  }

  const weapons = (user.equipped_weapons && user.equipped_weapons.length > 0)
    ? user.equipped_weapons
    : (user.inventory?.weapons || []).slice(0, 3);
  
  for (const w of weapons) {
    if (w.includes('Vàng') || w.includes('Kim')) baseDmg += 120;
    else if (w.includes('Sắt') || w.includes('Thiết')) baseDmg += 70;
    else baseDmg += 90;
  }

  return Math.floor(baseDmg);
}

