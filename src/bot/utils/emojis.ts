/**
 * BỘ SƯU TẬP CUSTOM EMOJI DISCORD CỦA MANY CURIEL
 * Đã cập nhật đầy đủ toàn bộ bộ cánh và bộ emoji ưu tiên theo yêu cầu người dùng.
 * Sử dụng để trang trí tiêu đề (bắt buộc dùng cánh) và đầu dòng embed thẩm mỹ.
 */

export interface WingPair {
  left: string;
  right: string;
  name: string;
}

export const WING_SETS: readonly WingPair[] = [
  // Bộ cánh 1: Keai Wings
  {
    name: 'keai',
    left: '<a:Keai_SvB_Wing1:1558395130979946526>',
    right: '<a:Keai_SvB_Wing2:1558395135417655376>'
  },
  // Bộ cánh 2: Abis Wings
  {
    name: 'abis',
    left: '<a:abis_canhtrai:1558396848949956651>',
    right: '<a:abis_canhphai:1558396853622407258>'
  },
  // Bộ cánh 3: Vibe Wings
  {
    name: 'vibe',
    left: '<a:vibewing1:1558087810232098876>',
    right: '<a:vibewing2:1558087814392844388>'
  }
] as const;

export const EMOJIS = {
  // === BỘ CÁNH TRANG TRÍ TIÊU ĐỀ (CHUẨN CẶP TRÁI - PHẢI) ===
  KEAI_WING_LEFT: '<a:Keai_SvB_Wing1:1558395130979946526>',
  KEAI_WING_RIGHT: '<a:Keai_SvB_Wing2:1558395135417655376>',
  ABIS_WING_LEFT: '<a:abis_canhtrai:1558396848949956651>',
  ABIS_WING_RIGHT: '<a:abis_canhphai:1558396853622407258>',
  VIBE_WING_LEFT: '<a:vibewing1:1558087810232098876>',
  VIBE_WING_RIGHT: '<a:vibewing2:1558087814392844388>',

  // === DANH SÁCH EMOJI ĐƯỢC CUNG CẤP ƯU TIÊN SỬ DỤNG NHẤT ===
  EIRENE_B02: '<a:Eirene_b02:1558395144905035891>',
  KEAI_SVB_HEART_1: '<a:Keai_SvB_Heart:1558395138399539200>',
  KEAI_SVB_HEART_2: '<a:Keai_SvB_Heart:1558395141717237832>',
  ELYS_BLING7: '<a:elys_bling7:1558395148264804452>',
  HVL: '<a:hvl_:1558395151905460254>',
  KIREI_BLUE_HEARTS: '<a:kireiBlueHearts:1556161469098238093>',
  KIREI_STAR_BLUE: '<:kireiStarBlue:1556161474735374448>',
  TIM_SPARKLE: '<a:tim:1558395156342775849>',
  SAO_7_MAU: '<a:sao7mau:1552252317376446585>',
  BLUE_HEART_3: '<a:012Blue_Heart3:1558087837029498921>',
  BLUE_MAIL: '<a:012Blue_Mail:1558087826900389950>',
  ANGEL_BLOB_3: '<a:angelBlob3:1555974609747050678>',
  AX_HEARTS_3: '<a:ax_hearts3:1555974580093325324>',
  BLUE_HEART: '<a:blueheart:1558087803320016907>',
  BLUE_WINGS: '<a:bluewings:1558087800262234162>',
  ELITE: '<a:elite:1558087797368168498>',
  TIM_BLUE: '<a:tim:1558087821170835581>',
  Z_PINKHEARTS: '<a:z_pinkhearts:1556291379028820099>',
  Z_PAW: '<a:z_paw:1556291363429945394>',
  BLUE_HEART_005: '<a:005_blue_heart:1552625798869946408>',
  BLUE_JELLYFISH: '<a:005_blue_jellyfish:1552625802296959086>',
  BUBBLES_1: '<a:005_bubbles1:1552625804356362281>',
  BUBBLES_3: '<a:005_bubbles3:1552625793753157704>',
  HEART_BUBBLES: '<a:005_heartbubbles:1552625791148232814>',
  EMOJI_52_A: '<a:emoji_52:1552664943285768204>',
  KAWAII_STAR_BLUE: '<a:kawaiiStarBlue:1552638878954029056>',
  CINNA_ICE: '<a:009Cinnamoroll_IceCream:1533115012212588695>',
  CINNA_PLANE: '<a:009Cinnamoroll_Plane:1533115234024165410>',
  CINNA_DANCE: '<a:cinnanhay:1551903794932228177>',
  RAINBOW_WHITE: '<a:whiteWZrainbow:1549050556318744658>',
  EMOJI_52_B: '<a:emoji_52:1548665937002107000>',
  BLUE_BUTTERFLY: '<a:blue_butterfly:1548624087616856134>',
  LAP_LANH: '<a:laplanh:1549295668978520094>',
  DOUCEUR_BLUE: '<a:douceur_blue043:1549779332329635961>',
  DARK_CLOUD: '<a:storm:1558705618011947048>',
  // === EMOJI THỐNG NHẤT TOÀN HỆ THỐNG THEO YÊU CẦU ===
  REALM: '<a:bluesaturn:1558696989854662736>',             // Biểu tượng Cảnh Giới duy nhất
  LINH_THACH: '<a:blue_gem:1558697044510638144>',          // Biểu tượng Linh Thạch duy nhất
  TINH_KHONG_THACH: '<a:blue_gem:1558697044510638144>',    // Đồng bộ Linh Thạch
  FAILURE: '<a:blue_cloudy_heart:1558695747086450698>',    // Biểu tượng Hiệu Ứng Thất Bại
  BLOOD: '<:yxz_star1:1558087806490910840>',               // Biểu tượng Máu (HP / Sinh Lực)
  HP: '<:yxz_star1:1558087806490910840>',                  // Đồng bộ Máu (HP)
  MAU: '<:yxz_star1:1558087806490910840>',                 // Đồng bộ Máu
  MANH_KY_UC: '<a:emoji_71:1559201095501348944>',          // Biểu tượng Mảnh Ký Ức
  KY_UC: '<a:emoji_71:1559201095501348944>',               // Đồng bộ Ký Ức
  BLING_NEW: '<a:bling:1562103611587170435>',              // Biểu tượng Tu Vi
  SAO_CONG_HIEN: '<a:sao:1562103382980690051>',           // Biểu tượng Điểm Cống Hiến
  BOSS_1: '<a:emoji_62:1558705667412598814>',
  BOSS_2: '<:emoji_64:1558705663805231154>',
  BOSS_3: '<:emoji_64:1558699879365091438>',
  BOSS_4: '<:emoji_64:1558699906896765008>',
  BOSS_5: '<:emoji_65:1558705654699528242>',
  BOSS_6: '<:emoji_66:1530217233396011279>',

  // === EMOJI KẾ THỪA HỢP LỆ KHÁC ===
  BLUE_FLOWER: '<a:012Blue_Flower1:1558087746009169971>',
  BLUE_SPARKLES_WHIRL: '<a:012Blue_SparklesWhirl:1558087748395601920>',
  BLUE_SPARKLE_5: '<a:5_bluesparkle:1558087859896844440>',
  BSTAR_DNS: '<a:BstarDNS:1558087862375813151>',
  KEAI_HEART: '<a:Keai_Sv_HeartB:1558094874312577105>',
  UNICORN: '<:unicorn:1558094569772425249>',
  YXZ_STAR: '<:yxz_star1:1558087806490910840>',
  HACHI: '<:1Hachi:1558090289195782254>',
  CROWN: '<a:vuongmien:1552252321818222632>',
  HEART_BLUE: '<a:005_blue_heart:1552625798869946408>',
  HEART_PULSE: '<a:4_pulseheart2:1555974620010774639>',
  HEART_PINK: '<a:x_PinkHeartAniP2U:1555974577648173108>',
  HEART_BLUE_GROUP: '<a:kireiBlueHearts:1556161469098238093>',
  HEART_PINK_SPIN: '<a:pinkheartspin:1549047540954173460>',
  SPARKLE_FX: '<a:fx_spark:1550959536175845486>',
  STAR_RAINBOW: '<a:eerainbow_stars:1556291387396460676>',
  STAR_BLUE: '<:kireiStarBlue:1556161474735374448>',
  STAR_PINK: '<:kireiStarPink:1556161477701013584>',
  STAR_PURPLE: '<a:kireiAStarPurple:1551903798036004877>',
  STAR_MOON: '<a:kawaiiMoonStars:1555974591904489543>',
  STAR_TWINKLE: '<a:kawaiiTwinkleStars:1555974595129901136>',
  BUTTERFLY_PINK: '<a:angelBUtterflyypink:1555974598041018458>',
  BUTTERFLY_GREEN: '<a:04_greenbutterfly:1533115161039212554>',
  BUTTERFLY_DX: '<a:dx_butterfly:1555974583369211935>',
  PBEAR: '<a:0001_pbear:1552625786882891896>',
  PAW: '<a:z_paw:1556291363429945394>',
  PAW_1300: '<a:1300_paw:1552248418037141534>',
  BUNNY: '<a:fx_cutebunny:1555974589371121734>',
  CINNA_HORSE: '<a:009Cinnamoroll_HorseLove:1533115093208928296>',
  PUSHEEN_BOING: '<a:d_PusheenBoing:1555974561990975501>',
  PUSHEEN_PINK: '<a:d_PusheenBoingPink:1555974573927825552>',
  FLOWER_WHITE: '<:00_p2usflowerwhite:1556291340428648471>',
  FLOWER_PURPLE: '<a:purpleflowergif:1551903808815374437>',
  FLOWER_RED_BOW: '<a:nohong:1551903802494554112>',
  JELLYFISH_BLUE: '<a:005_blue_jellyfish:1552625802296959086>',
  BOW_PINK: '<a:pinkbow:1556291357436280902>',
  BOW_29B: '<a:000029b_pinkbow:1552638909492756571>',
  STRAWBERRY: '<a:pink_strawberry:1556291360510836807>',
  SWEETROLL: '<a:pinksweetroll:1556291351216259143>',
  CAKE_CAT: '<a:catcake:1556291345121943585>',
  RAINBOW_BOUNCE: '<a:rainbowpastelexclaimbounce:1556291353909010512>',
  RAINBOW_CUTE: '<a:ha_cuterainbow:1556291382702768219>',
  DOUCEUR_PINK_35: '<a:douceur_pink035:1550960581970755648>',
  DOUCEUR_PINK_39: '<a:douceur_pink039:1556161423825178666>',
  DOUCEUR_WHITE_29: '<a:douceur_white029:1550960589063589978>',
  DOUCEUR_GREEN_30: '<a:douceur_green030:1556161413938946119>',
  DOUCEUR_PURPLE_26: '<a:douceur_purple026:1556161456360136764>',
  DOUCEUR_YELLOW_47: '<a:douceur_yellow047:1556161465386278933>',
  ANGEL_BLOB: '<a:angelBlob:1555974603447472151>',
  ANGEL_BLOB_2: '<a:angelBlob2:1556291343284830208>',
  WOW_STATIC: '<:wow:1555974643071057940>',
  PRAY: '<a:2_toro1plead:1556291343284830208>',
  CUTEPAWS: '<a:cutepaws:1552664924583362572>'
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Bao bọc tiêu đề bằng đúng bộ cánh tương ứng (trái và phải luôn đi đôi cùng bộ)
 * Tuyệt đối không dùng sai hoặc cọc cạch bộ cánh.
 */
export function formatTitleWithWings(title: string, wingIndex?: number): string {
  if (!title) return '';
  const trimmed = title.trim();

  // Kiểm tra nếu tiêu đề đã có đủ cả cặp cánh hợp lệ thì giữ nguyên
  for (const set of WING_SETS) {
    if (trimmed.includes(set.left) && trimmed.includes(set.right)) {
      return trimmed;
    }
  }

  // Loại bỏ các cánh lẻ nếu có để không bị lặp
  let cleaned = trimmed;
  for (const set of WING_SETS) {
    cleaned = cleaned.split(set.left).join('').split(set.right).join('').trim();
  }

  // Bỏ trang trí cánh ở các phần tiêu đề dài (> 26 ký tự) để tránh bị rơi xuống dòng / tràn khung
  if (cleaned.length > 26) {
    return cleaned;
  }

  // Chọn bộ cánh (ưu tiên wingIndex nếu truyền vào, hoặc phân bổ chuẩn theo hash chuỗi)
  const set = wingIndex !== undefined
    ? WING_SETS[Math.abs(wingIndex) % WING_SETS.length]
    : WING_SETS[Math.abs(hashString(cleaned)) % WING_SETS.length];

  return `${set.left} ${cleaned} ${set.right}`;
}

/**
 * Trả về chuỗi định dạng tiêu đề với bộ cánh chuẩn đẹp mắt
 */
export function formatTitle(title: string, wingIndex?: number): string {
  return formatTitleWithWings(title, wingIndex);
}

/**
 * Đầu dòng đẹp mắt ưu tiên các emoji mới được người dùng cung cấp
 */
export function bullet(emoji: string = EMOJIS.ELYS_BLING7): string {
  return `${emoji} `;
}

/**
 * Danh sách toàn bộ emoji ưu tiên theo chỉ định của người dùng
 */
export const USER_PROVIDED_EMOJIS: string[] = [
  EMOJIS.EIRENE_B02,
  EMOJIS.KEAI_SVB_HEART_1,
  EMOJIS.KEAI_SVB_HEART_2,
  EMOJIS.ELYS_BLING7,
  EMOJIS.HVL,
  EMOJIS.KIREI_BLUE_HEARTS,
  EMOJIS.KIREI_STAR_BLUE,
  EMOJIS.TIM_SPARKLE,
  EMOJIS.SAO_7_MAU,
  EMOJIS.BLUE_HEART_3,
  EMOJIS.BLUE_MAIL,
  EMOJIS.ANGEL_BLOB_3,
  EMOJIS.AX_HEARTS_3,
  EMOJIS.BLUE_HEART,
  EMOJIS.BLUE_WINGS,
  EMOJIS.ELITE,
  EMOJIS.TIM_BLUE,
  EMOJIS.Z_PINKHEARTS,
  EMOJIS.Z_PAW,
  EMOJIS.BLUE_HEART_005,
  EMOJIS.BLUE_JELLYFISH,
  EMOJIS.BUBBLES_1,
  EMOJIS.BUBBLES_3,
  EMOJIS.HEART_BUBBLES,
  EMOJIS.EMOJI_52_A,
  EMOJIS.KAWAII_STAR_BLUE,
  EMOJIS.CINNA_ICE,
  EMOJIS.CINNA_PLANE,
  EMOJIS.CINNA_DANCE,
  EMOJIS.RAINBOW_WHITE,
  EMOJIS.EMOJI_52_B,
  EMOJIS.BLUE_BUTTERFLY,
  EMOJIS.LAP_LANH,
  EMOJIS.DOUCEUR_BLUE
];
