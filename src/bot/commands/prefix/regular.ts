import { 
  Message, 
  Client, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from 'discord.js';
import { db } from '../../database/database.js';
import { createManyCurielEmbed, createErrorEmbed, createPermissionDeniedEmbed, EMOJIS } from '../../utils/embeds.js';
import { isOwner, isQuanLy, isStaff } from '../../permissions/permissions.js';
import { updateHiddenChannelForUser } from '../slash/setup.js';
import { 
  REALM_ORDER, 
  LUYEN_KHI_STAGES, 
  STANDARD_STAGES, 
  getRequiredTuViForNextLevel,
  getTuViRewardPerMtl,
  calculateThangCapSuccessRate,
  RealmName,
  CHARACTER_NAMES,
  parseAmount
} from '../../types/cultivation.js';
import { handleBossCommands } from './boss.js';
import { handleSuPhuCommands } from './suphu.js';
import { handleBxhCommands } from './bxh.js';
import { handleManagementCommands } from './management.js';
import { handleShopCommand } from './shop.js';
import { handleTimMayCommand, handleCashOutCommand } from './timmay.js';
import { handleSectCommands } from './sect.js';
import { handleSecretRealmCommands } from './bicanh.js';

// IMAGE ASSETS TỪ YÊU CẦU CỦA NGƯỜI DÙNG
const IMG_TULUYEN = 'https://cdn.discordapp.com/attachments/1555092797319544907/1555844375156891708/FB_IMG_1789407633500.jpg?backend=b2&ex=6ac4a37d&is=6ac351fd&hm=97f33a483851249e9a9a977e5592b18503adfa815feeb2d747848550ac86f35d&';
const IMG_THANGCAP = 'https://cdn.discordapp.com/attachments/1532953683329810442/1556724883612766318/fdaaae2857e85645ab7de2bd1ee4ce7f.jpg?backend=b2&ex=6ac53486&is=6ac3e306&hm=d483a176fb282fd906196af2eef15f71c62b2d6126f6f9d22c0c0235c0c5a8c1&';
const IMG_HELP = 'https://cdn.discordapp.com/attachments/1532953683329810442/1556724883164102666/92a8066ea59dbea661631bd780927f9f.jpg?backend=b2&ex=6ac53486&is=6ac3e306&hm=9b8bd53736c58e7e00aafa19bb4922a050a0bb50c316ad424b799b2c25850715&';

// BỘ CÂU HỎI MỚI CHÍNH XÁC THEO YÊU CẦU
interface QuestionDef {
  q: string;
  opts: string[];
  correct: number;
}

const EASY_QUESTIONS: QuestionDef[] = [
  { q: '(56 + 78 + 94) × 2 = ?', opts: ['456', '428', '476', '512'], correct: 0 },
  { q: 'Có công mài sắt,...', opts: ['có ngày nên kim', 'có ngày gãy tay', 'chờ ngày thành vàng', 'thời gian trôi mau'], correct: 0 },
  { q: 'Chớ thấy sóng cả mà...', opts: ['rã tay trèo', 'nhảy xuống sông', 'quay đầu lại', 'buông xuôi mái chèo'], correct: 0 },
  { q: 'Ai ơi bưng bát cơm đầy...', opts: ['dẻo thơm một hạt, đắng cay muôn phần', 'nhớ người cày cấy hôm nao', 'hạt cơm ngọt bùi thơm tho', 'chớ để rơi vãi uổng công'], correct: 0 },
  { q: '35 × 2 = ?', opts: ['70', '65', '75', '80'], correct: 0 },
  { q: 'Hôn mà bị hôn lại thì gọi là gì?', opts: ['đính hôn', 'phản kháng', 'hòa vốn', 'nụ hôn ngọt ngào'], correct: 0 },
  { q: 'Đuôi thì chẳng thấy, mà có 2 đầu vậy đây là gì?', opts: ['cây cầu', 'con rắn', 'con giun', 'sợi dây'], correct: 0 }
];

const HARD_QUESTIONS: QuestionDef[] = [
  { q: 'Cái gì bạn cầm trong tay trái nhưng không bao giờ cầm được trong tay phải?', opts: ['Khuỷu tay phải', 'Bàn tay phải', 'Ngón tay cái', 'Cánh tay phải'], correct: 0 },
  { q: 'Có một tàu điện đi về hướng Nam, gió hướng Tây Bắc. Hỏi khói từ con tàu sẽ theo hướng nào?', opts: ['tàu điện không có khói', 'Hướng Đông Nam', 'Hướng Tây Nam', 'Hướng Bắc'], correct: 0 },
  { q: 'Môn gì càng thắng lại càng thua?', opts: ['đua xe đạp', 'chạy việt dã', 'bơi lội', 'cờ vua'], correct: 0 },
  { q: 'Núi nào bị chặt ra từng khúc?', opts: ['núi thái sơn', 'núi ngũ hành', 'núi trường sơn', 'núi ba vì'], correct: 0 },
  { q: 'Dung dịch HCl làm quỳ tím chuyển sang màu gì?', opts: ['màu đỏ', 'màu xanh', 'màu vàng', 'không đổi màu'], correct: 0 },
  { q: 'Ở Việt Nam, rồng bay ở đâu và đáp ở đâu?', opts: ['bay ở Thăng Long, đáp ở Hạ Long', 'bay ở Hà Nội, đáp ở Quảng Ninh', 'bay ở Cố Đô, đáp ở Vịnh Xanh', 'bay trên trời, đáp dưới đất'], correct: 0 }
];

const POEMS = [
  'Đạo khả đạo, phi thường đạo. Nhất tức đốn ngộ, vạn cổ thông minh.',
  'Ngưng thần tụ khí, hấp thu thiên địa linh nguyên, đạo tâm vững tựa bàn thạch.',
  'Bế quan tham thiền, tâm vô tạp niệm, linh khí chu thiên đả thông kinh mạch.',
  'Kiếm chỉ hư không, vạn dặm mây trôi, một hạt bụi cũng hóa thiên hà.',
  'Nhân gian trăm năm chỉ là chớp mắt, trường sinh đại đạo vạn cổ duy nhất.',
  'Luyện khí hóa thần, linh quang quán đỉnh, ngàn năm tuế nguyệt chỉ như phù vân.',
  'Tâm như gương sáng chẳng vương bụi trần, thiên đạo vô tình người hữu tình.'
];

// Cooldown map for Tu Luyen (5 seconds cooldown)
const cooldownTuluyen = new Map<string, number>();

export async function handleRegularCommand(message: Message, client: Client, commandName: string, args: string[]): Promise<void> {
  const userId = message.author.id;
  const guild = message.guild;
  if (!guild) return;

  const cmd = commandName.toLowerCase();

  try {
    // 0. Xử lý các module chuyên biệt: Boss, Sư Phụ, Bảng Xếp Hạng, Quản Lý
    if (await handleBossCommands(message, client, cmd, args)) return;
    if (await handleSuPhuCommands(message, client, cmd, args)) return;
    if (cmd === 'bxh') {
      await handleBxhCommands(message, client, args);
      return;
    }
    if (await handleManagementCommands(message, client, cmd, args)) return;
    if (await handleSectCommands(message, client, cmd, args)) return;
    if (await handleSecretRealmCommands(message, client, cmd, args)) return;

    // 0.1 Mhelp / Mtrogiup / Mlenh (BẢNG HƯỚNG DẪN 5 NÚT BẤM CHO NGƯỜI CHƠI)
    if (cmd === 'help' || cmd === 'trogiup' || cmd === 'lenh' || cmd === 'menu') {
      const buildHelpPayload = (section: 1 | 2 | 3 | 4 | 5) => {
        let desc = '';
        let title = '';

        if (section === 1) {
          title = 'PHẦN 1: TU LUYỆN & CỬA HÀNG';
          desc = `${EMOJIS.ELYS_BLING7} **HƯỚNG DẪN CÁC LỆNH TU LUYỆN & CỬA HÀNG** ${EMOJIS.ELYS_BLING7}\n\n` +
            `• **\`Mtl\`** / **\`Mtuluyen\`**\n  → Tu luyện hấp thu linh khí, tích lũy Tu Vi (+50 Tu Vi/lần) và Linh Thạch *(Cooldown: 5s)*.\n` +
            `• **\`Mthangcap\`** / **\`Mtc\`** / **\`Mdottpha\`**\n  → Đột phá cảnh giới tu tiên khi tích lũy đủ Tu Vi yêu cầu *(Hệ thống cảnh giới đồng nhất tuyệt đối: Phàm Nhân ➔ Luyện Khí (Tầng 1-9) ➔ Trúc Cơ ➔ Kim Đan ➔ Nguyên Anh ➔ Hóa Thần ➔ Luyện Hư ➔ Hợp Thể ➔ Đại Thừa ➔ Độ Kiếp)*.\n` +
            `• **\`Mdiemdanh\`**\n  → Điểm danh mỗi ngày để nhận phần thưởng Linh Thạch tu luyện.\n` +
            `• **\`Mhs\`** / **\`Mtuvi\`**\n  → Xem hồ sơ tu sĩ: Cảnh giới chuẩn hóa, Tu vi, Lượng máu HP (15.000 HP), Linh Thạch, Mảnh Ký Ức, Điểm Cống Hiến, Linh Thú, Chiến tích quái thú và nút mở Túi Đồ trữ vật.\n` +
            `• **\`Mtuido\`**\n  → Xem túi trữ vật, đan dược, vũ khí, giáp và bùa may mắn đang sở hữu.\n` +
            `• **\`Mdoi\`**\n  → Mở bảng quy đổi tài nguyên: 10 DCH = 2 Ký Ức, 10 DCH = 5 Mảnh B / 2 Mảnh A, 100k Linh Thạch = 1 Mảnh S, 100 Ký Ức = 5 Mảnh S.\n` +
            `• **\`Mshop\`** / **\`Mcuahang\`**\n  → Cửa hàng mua Đan Dược, Vũ Khí, Giáp, Bùa May Mắn, Linh Thú.\n` +
            `• **\`Mgan <vũ khí/giáp>\`**\n  → Trang bị vũ khí hoặc giáp để đi đánh Boss *(Tối đa 3 vũ khí & 3 giáp)*.\n` +
            `• **\`Mbogan <vũ khí/giáp>\`**\n  → Tháo bỏ vũ khí hoặc giáp về lại túi trữ vật.\n` +
            `• **\`Mlixi <số_tiền> <số_người>\`**\n  → Phát phong bao lì xì Linh Thạch may mắn cho các đạo hữu.\n` +
            `• **\`Mgive @user <số_linh_thạch>\`**\n  → Tặng Linh Thạch cho đạo hữu khác (khấu trừ trực tiếp từ ví người tặng).\n\n` +
            `👉 *Bấm các nút bên dưới để chuyển sang Phần khác!*`;
        } else if (section === 2) {
          title = 'PHẦN 2: SƯ PHỤ, TƯƠNG TÁC & BẢNG XẾP HẠNG';
          desc = `${EMOJIS.KEAI_SVB_HEART_1} **HƯỚNG DẪN CÁC LỆNH SƯ PHỤ, TƯƠNG TÁC & BXH** ${EMOJIS.KEAI_SVB_HEART_1}\n\n` +
            `• **\`Msuphu\`**\n  → Danh sách 29 vị Sư phụ tu chân giới, thông tin môn quy và chọn bái sư *(Yêu cầu đạt Kim Đan Kỳ)*.\n` +
            `• **\`Mbaisu <tên nhân vật>\`**\n  → Bái Sư phụ chỉ định để nhận buff gia trì *(Yêu cầu đạt từ Kim Đan Kỳ trở lên; đạt 1.000 Hảo Cảm với Sư phụ cũ mới được đổi)*.\n` +
            `• **\`Mchar\`** / **\`Mmychar\`**\n  → Mở hồ sơ Sư phụ đã bái: Ánh mắt, biểu cảm, cảm xúc, Hảo Cảm, Độ Ghét, Quà đã tặng, Bộ thẻ bài & 4 nút tương tác trực tiếp *(Lưu ý: Sau 3 ngày không tương tác sẽ bị trừ điểm Hảo Cảm)*.\n` +
            `• **\`Mthuvien\`**\n  → Mở Thư viện ảnh cá nhân (Hiển thị CHÀO MỪNG ĐẾN VỚI THƯ VIỆN ẢNH CỦA BẠN, kèm các nút nhân vật đã sở hữu ảnh cấp C, B, A, S và 1.000 Hảo Cảm, chuyển trang ảnh bằng 2 nút \`<\` và \`>\`). Chỉ người dùng lệnh mới có quyền lướt thư viện của mình.\n` +
            `• **\`Mxemthuvien\`**\n  → Xem toàn bộ các ảnh nhân vật mà người chơi đã sưu tập được.\n` +
            `• **\`Mxemthe <tên nhân vật> [cấp]\`**\n  → Chiêm ngưỡng thẻ bài nhân vật các cấp C, B, A, S, 1000.\n` +
            `• **\`Mghepchong <tên nhân vật>\`** / **\`Mghepthe\`**\n  → Ghép thẻ bài nhân vật từ các mảnh đã thu thập.\n` +
            `• **\`Mtangqua <tên nhân vật> <món quà>\`**\n  → Tặng hoa, ngọc bội, nhẫn đôi... tăng Hảo Cảm và tránh rơi vào Lãnh Cung.\n` +
            `• **\`Mkiss <tên nhân vật>\`**\n  → Đặt nụ hôn ngọt ngào lên môi Sư phụ *(Cooldown: 10s)*.\n` +
            `• **\`Mbite <tên nhân vật>\`**\n  → Cắn nhẹ trêu đùa Sư phụ cưng chiều *(Cooldown: 10s)*.\n` +
            `• **\`Mhug <tên nhân vật>\`**\n  → Ôm chầm lấy Sư phụ trong vòng tay ấm áp *(Cooldown: 10s)*.\n` +
            `• **\`Mbxh\`**\n  → Xem bảng xếp hạng Tu Vi, Phú Hào, Thẻ Bài *(Mỗi người chơi chỉ hiển thị duy nhất 1 vị trí chuẩn xác, khử trùng lặp)*.\n` +
            `• **\`Mtruanam\`**\n  → Trảm trừ yêu thú vào khung giờ linh thiêng để nhận điểm cống hiến.\n\n` +
            `👉 *Bấm các nút bên dưới để chuyển sang Phần khác!*`;
        } else if (section === 3) {
          title = '⚔️ PHẦN 3: CHIẾN ĐẤU & ĐÁNH BOSS';
          desc = `🌸 **HƯỚNG DẪN CÁC LỆNH CHIẾN ĐẤU & ĐÁNH BOSS** 🌸\n\n` +
            `• **\`Mcd\`** / **\`Mchiendau\`**\n  → Khiêu chiến quái thú tu chân giới nhận thưởng Linh Thạch.\n` +
            `• **\`Mkhieuchien <tên Boss>\`** / **\`Mkc\`**\n  → Khiêu chiến Boss Đơn mở chủ đề quyết đấu riêng biệt *(Thời gian: 40s)*.\n` +
            `• **\`Mdt\`** / **\`Mdanhthuong\`**\n  → Đòn đánh thường tấn công tiêu hao sinh lực Boss.\n` +
            `• **\`Mskill <tên chiêu>\`** / **\`Mtuyetchieu\`**\n  → Thi triển tuyệt kỹ môn phái gây sát thương cực lớn.\n` +
            `• **\`Mcheckskill\`** / **\`Mskilllist\`**\n  → Tra cứu danh sách các tuyệt kỹ chiến đấu đang sở hữu.\n` +
            `• **\`Mhoimau\`**\n  → Hồi phục sinh lực HP trong trận quyết đấu Boss đơn *(Tối đa 3 lần/trận)*.\n` +
            `• **\`Mhoihuyet @user\`**\n  → Vận công hồi máu cứu viện đồng đội trong trận chiến Boss chung.\n` +
            `• **\`Mboss\`**\n  → Xem danh sách quái vật và trạng thái Boss Chung toàn server.\n\n` +
            `🛡️ **Cơ chế sát thương & Boss Phản đòn:**\n` +
            `• Cảnh giới & Tầng càng cao, sát thương gây ra cho Boss càng lớn (Phàm Nhân ➔ Hóa Thần ➔ Độ Kiếp).\n` +
            `• Máu người chơi chuẩn hóa theo tu vi thật. Boss phản đòn mỗi lượt.\n` +
            `• Embed thông báo tự động cập nhật người chịu đòn, HP trừ, HP còn lại và số người còn chiến đấu.\n` +
            `• Khi hết máu, người chơi bị tạm dừng đánh nhưng bảo lưu 100% sát thương và phần thưởng khi Boss chết.\n\n` +
            `👉 *Bấm các nút bên dưới để chuyển sang Phần khác!*`;
        } else if (section === 4) {
          title = '🏯 PHẦN 4: HỆ THỐNG TÔNG MÔN & BÍ CẢNH';
          desc = `🏯 **HƯỚNG DẪN CÁC LỆNH TÔNG MÔN & BÍ CẢNH** 🏯\n\n` +
            `• **\`Mlap <tên> <số người> <phí vào> <chu cấp/ngày>\`**\n  → Mở tông môn mới *(Yêu cầu đạt Hóa Thần — Trung Kỳ trở lên; Quỹ ban đầu: 1.000.000 LT)*.\n` +
            `• **\`Mtongmon\`** / **\`Mtm\`**\n  → Xem danh sách các tông môn hiện hữu và gửi hồ sơ xin gia nhập qua nút bấm.\n` +
            `• **\`Mtmcuatoi\`**\n  → Trung tâm quản lý tông môn dành riêng cho Tông Chủ & Trưởng Lão (bổ nhiệm Trưởng Lão, rút quỹ, giải thể).\n` +
            `• **\`Mtmthamgia\`**\n  → Xem thông tin tông môn của bản thân kèm nút rời tông môn an toàn.\n` +
            `• **\`Mrutquy <số linh thạch>\`**\n  → Tông Chủ rút Linh Thạch từ quỹ tông môn về túi cá nhân.\n` +
            `• **\`Mhutvankhi\`**\n  → (Tông Chủ Sa Đọa) Tiêu tốn 3.000 Điểm Cống Hiến hút 30% vận khí đệ tử *(1 lần/7 ngày)*.\n` +
            `• **\`Mbicanh\`** / **\`Mbc\`**\n  → Tông Chủ / Trưởng Lão mở Bí Cảnh Ải cho tông môn *(Thời hạn 40 phút; tạo thread riêng)*.\n` +
            `• **\`Mkc <xayeu / hodiep / hoakylan>\`**\n  → Khiêu chiến Boss Bí Cảnh (Xà Yêu, Hồ Điệp, Hỏa Kỳ Lân) kèm ảnh minh họa độc quyền.\n` +
            `• **\`Mhoisinh\`**\n  → Sử dụng đan dược hoặc linh thạch hồi sinh đồng đội bị hạ gục trong Bí Cảnh.\n` +
            `• **\`Mhuybc\`**\n  → Tông Chủ / Trưởng Lão đóng bí cảnh an toàn.\n\n` +
            `⚡ **Chiến đấu Bí Cảnh:**\n` +
            `• Đánh Boss ải bằng \`Mdt\` hoặc \`Mskill\`, vượt ải bấm **[⚔️ SANG ẢI TIẾP THEO]**.\n` +
            `• 30% tỷ lệ kích hoạt sự kiện ngẫu nhiên: Mưa Linh Thạch (100k-500k LT), Thiên Kiếp sét đánh, Tiên Nhân Giáng Thế buff damage!\n` +
            `• Vượt ải nhận phần thưởng cực lớn: Linh Thạch & Mảnh Ký Ức trao tận tay toàn bộ môn đồ!\n\n` +
            `👉 *Bấm các nút bên dưới để chuyển sang Phần khác!*`;
        } else {
          title = '🎲 PHẦN 5: MINI GAME & LUẬN ĐẠO';
          desc = `${EMOJIS.ELYS_BLING7} **HƯỚNG DẪN CÁC LỆNH MINI GAME & VẤN ĐÁP** ${EMOJIS.ELYS_BLING7}\n\n` +
            `• **\`Mtimmay <số_linh_thạch_cược>\`**\n  → Mini game **Tìm Mây** thử vận may trên bàn 25 đám mây (19 mây may mắn, 6 mây u ám).\n` +
            `  - Hệ số thưởng lũy tiến từ **×1,2** lên đến **×7,5** Linh Thạch cược.\n` +
            `  - Nhập **\`Mnhan\`** (hoặc **\`Mnhanthuong\`** / **\`Mdung\`**) để chốt lãi bất kỳ lúc nào.\n` +
            `  - Tìm đủ 19 đám mây may mắn nhận thưởng tối đa **×7,5** và tặng kèm **1 Mảnh S**!\n` +
            `• **\`Mcaudo\`** / **\`Mcauhoi\`** / **\`Mluandao\`**\n  → Luận Đạo vấn đáp tu chân giới (trả lời câu hỏi nhanh nhận thưởng Linh Thạch & Mảnh Ký Ức).\n\n` +
            `👉 *Bấm các nút bên dưới để chuyển sang Phần khác!*`;
        }

        const embed = createManyCurielEmbed(client, desc, title);
        embed.setImage(IMG_HELP);

        const btn1 = new ButtonBuilder()
          .setCustomId('btn_help_sec1')
          .setLabel('🧘 Tu Luyện & Shop')
          .setStyle(section === 1 ? ButtonStyle.Primary : ButtonStyle.Secondary);

        const btn2 = new ButtonBuilder()
          .setCustomId('btn_help_sec2')
          .setLabel('🌸 Sư Phụ & BXH')
          .setStyle(section === 2 ? ButtonStyle.Primary : ButtonStyle.Secondary);

        const btn3 = new ButtonBuilder()
          .setCustomId('btn_help_sec3')
          .setLabel('⚔️ Chiến Đấu Boss')
          .setStyle(section === 3 ? ButtonStyle.Primary : ButtonStyle.Secondary);

        const btn4 = new ButtonBuilder()
          .setCustomId('btn_help_sec4')
          .setLabel('🏯 Tông Môn & Bí Cảnh')
          .setStyle(section === 4 ? ButtonStyle.Primary : ButtonStyle.Secondary);

        const btn5 = new ButtonBuilder()
          .setCustomId('btn_help_sec5')
          .setLabel('🎲 Mini Game')
          .setStyle(section === 5 ? ButtonStyle.Primary : ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn1, btn2, btn3, btn4, btn5);
        return { embeds: [embed], components: [row] };
      };

      let currentSec: 1 | 2 | 3 | 4 | 5 = 1;
      const initialPayload = buildHelpPayload(currentSec);
      const sentMsg = await message.reply(initialPayload);

      const collector = sentMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 180000
      });

      collector.on('collect', async i => {
        if (i.customId === 'btn_help_sec1') currentSec = 1;
        else if (i.customId === 'btn_help_sec2') currentSec = 2;
        else if (i.customId === 'btn_help_sec3') currentSec = 3;
        else if (i.customId === 'btn_help_sec4') currentSec = 4;
        else if (i.customId === 'btn_help_sec5') currentSec = 5;

        const newPayload = buildHelpPayload(currentSec);
        await i.update(newPayload);
      });

      return;
    }

    // 1. Mtuluyen / Mtl (Lệnh Tu Luyện - Cooldown 5s)
    if (cmd === 'tuluyen' || cmd === 'tl') {
      const now = Date.now();
      const lastTl = cooldownTuluyen.get(userId) || 0;
      const diff = now - lastTl;
      if (diff < 5000) {
        const remainingSecs = Math.ceil((5000 - diff) / 1000);
        const cdEmbed = createManyCurielEmbed(
          client,
          `⏳ <@${userId}> vui lòng ổn định tâm tính, chờ **${remainingSecs} giây** nữa để tiếp tục tu luyện! *(Cooldown: 5s)*`,
          'ĐANG HỒI PHỤC NĂNG LƯỢNG'
        );
        await message.reply({ embeds: [cdEmbed] });
        return;
      }

      cooldownTuluyen.set(userId, now);
      const user = db.getOrCreateUser(guild.id, userId, message.author.username);

      const rewardTuVi = getTuViRewardPerMtl(user.realm, user.stage);
      const reqTuVi = getRequiredTuViForNextLevel(user.realm, user.stage);
      const rewardTKT = Math.floor(Math.random() * 401) + 100; // +100 -> +500 Linh Thạch

      // Tu vi kiếm được không được vượt quá điều kiện thăng cấp
      // Tiến trình phải luôn tăng, chỉ giảm khi thăng cấp thất bại (-30% Tu Vi)
      const oldTuVi = user.tu_vi || 0;
      user.tu_vi = Math.min(reqTuVi, Math.max(oldTuVi, oldTuVi + rewardTuVi));
      user.tinh_khong_thach = (user.tinh_khong_thach || 0) + rewardTKT;
      db.updateUser(guild.id, userId, {
        tu_vi: user.tu_vi,
        tinh_khong_thach: user.tinh_khong_thach
      });
      db.save();

      const percent = Math.min(100, Math.floor((user.tu_vi / reqTuVi) * 100));
      const totalBars = 10;
      const filled = Math.min(10, Math.max(0, Math.floor((percent / 100) * totalBars)));
      const barStr = '█'.repeat(filled) + '░'.repeat(totalBars - filled);

      const poem = POEMS[Math.floor(Math.random() * POEMS.length)];

      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.ELYS_BLING7} **TU LUYỆN THÀNH CÔNG**\n\n` +
        `${EMOJIS.DOUCEUR_BLUE} *"${poem}"*\n\n` +
        `${EMOJIS.LINH_THACH} **Linh Thạch nhận được:** \`+${rewardTKT.toLocaleString()}\` Linh Thạch\n` +
        `${EMOJIS.KEAI_SVB_HEART_1} **Tu Vi tăng trưởng:** \`+${rewardTuVi.toLocaleString()}\` Tu Vi\n\n` +
        `${EMOJIS.REALM} **Cảnh giới:** \`${user.realm}\` — **Tầng / Giai đoạn:** \`${user.stage}\`\n` +
        `${EMOJIS.KAWAII_STAR_BLUE} **Tiến trình:** \`[${barStr}]\` **${percent}%** (\`${user.tu_vi.toLocaleString()} / ${reqTuVi.toLocaleString()}\` Tu Vi)\n\n` +
        `${EMOJIS.BLUE_HEART_3} *Khi tiến trình đạt 100% (${reqTuVi.toLocaleString()} Tu Vi), hãy nhập \`Mthangcap\` hoặc \`Mtc\` để đột phá cảnh giới!*`,
        `<a:Keai_SvB_Wing1:1558395130979946526> KHOẢNG KHÔNG TU TIÊN <a:Keai_SvB_Wing2:1558395135417655376>`
      );
      embed.setImage(IMG_TULUYEN);

      await message.reply({ embeds: [embed] });
      return;
    }

    // 2. Mthangcap / Mtc / Mdottpha (Lệnh Thăng Cấp)
    if (cmd === 'thangcap' || cmd === 'tc' || cmd === 'dottpha') {
      const user = db.getOrCreateUser(guild.id, userId, message.author.username);

      if ((user.tinh_khong_thach || 0) <= 0) {
        const embed = createManyCurielEmbed(
          client,
          `${EMOJIS.FAILURE} <@${userId}>, Linh Thạch trong túi đã cạn kiệt (\`0\` Linh Thạch)!\n\n` +
          `• Theo quy tắc tu chân, **nếu Linh Thạch về 0, đạo hữu không thể tiếp tục đột phá cảnh giới**.\n` +
          `• Hãy kiếm thêm Linh Thạch qua tu luyện (\`Mtl\`), điểm danh (\`Mdiemdanh\`), đánh quái (\`Mcd\` hoặc săn Boss)!`,
          `${EMOJIS.FAILURE} LINH THẠCH CẠN KIỆT - KHÔNG THỂ ĐỘT PHÁ`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const reqTuVi = getRequiredTuViForNextLevel(user.realm, user.stage);

      if (user.tu_vi < reqTuVi) {
        const embed = createManyCurielEmbed(
          client,
          `${EMOJIS.PRAY} <@${userId}> chưa tích lũy đủ Tu Vi để thăng cấp!\n\n` +
          `• **Tu Vi hiện tại:** \`${user.tu_vi.toLocaleString()} / ${reqTuVi.toLocaleString()}\` Tu Vi\n` +
          `• **Yêu cầu:** \`${reqTuVi.toLocaleString()}\` Tu Vi\n` +
          `• **Còn thiếu:** \`${(reqTuVi - user.tu_vi).toLocaleString()}\` Tu Vi\n\n` +
          `👉 *Hãy dùng \`Mtl\` hoặc \`Mtuluyen\` để tích lũy thêm Tu Vi (+${getTuViRewardPerMtl(user.realm, user.stage).toLocaleString()} Tu Vi/lần)!*`,
          `CHƯA ĐỦ ĐIỀU KIỆN THĂNG CẤP`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      // Tính tỷ lệ thành công
      // Ban đầu 80%, mỗi lần lên cấp giảm 2%
      let baseRate = calculateThangCapSuccessRate(user.realm, user.stage);

      // Xử lý Thiên Kiếp từ Hóa Thần trở lên
      const realmIdx = REALM_ORDER.indexOf(user.realm);
      const isThienKiep = realmIdx >= REALM_ORDER.indexOf('Hóa Thần') && realmIdx < REALM_ORDER.indexOf('Độ Kiếp');
      if (isThienKiep) {
        baseRate = Math.min(baseRate, 40);
      }

      // Kiểm tra Bùa May Mắn trong túi đồ
      let hasCharm = false;
      if (user.inventory?.charms?.bua_may_man && user.inventory.charms.bua_may_man > 0) {
        hasCharm = true;
        baseRate = Math.min(100, baseRate + 10);
      }

      const roll = Math.floor(Math.random() * 100) + 1;
      const isSuccess = roll <= baseRate;

      if (!isSuccess) {
        // Thất bại: trừ 30% Tu Vi đang có và lưu lại tiến trình
        const lostTuVi = Math.floor(user.tu_vi * 0.3);
        user.tu_vi = Math.max(0, user.tu_vi - lostTuVi);

        // Tổn thất linh tài: trừ 25.000 Linh Thạch nếu có
        const deducted = Math.min(user.tinh_khong_thach, 25000);
        user.tinh_khong_thach -= deducted;

        db.updateUser(guild.id, userId, { 
          tu_vi: user.tu_vi,
          tinh_khong_thach: user.tinh_khong_thach 
        });
        db.save();

        const currentReqTuVi = getRequiredTuViForNextLevel(user.realm, user.stage);
        const percentLeft = Math.min(100, Math.floor((user.tu_vi / currentReqTuVi) * 100));
        const totalBars = 10;
        const filled = Math.min(10, Math.max(0, Math.floor((percentLeft / 100) * totalBars)));
        const barStr = '█'.repeat(filled) + '░'.repeat(totalBars - filled);

        const embed = createManyCurielEmbed(
          client,
          `${EMOJIS.FAILURE} **THĂNG CẤP THẤT BẠI! ĐẠO TÂM BỊ GIAO ĐỘNG!**\n\n` +
          `${EMOJIS.STAR_TWINKLE} **Tỷ lệ thành công:** \`${baseRate}%\` (Xúc xắc ra: \`${roll}\`)\n` +
          `${EMOJIS.HEART_PULSE} **Tổn thất Tu Vi:** \`-${lostTuVi.toLocaleString()}\` Tu Vi (-30% Tu Vi đang có)\n` +
          `${EMOJIS.SPARKLE_FX} **Tu Vi còn lại:** \`${user.tu_vi.toLocaleString()} / ${currentReqTuVi.toLocaleString()}\` Tu Vi\n` +
          `${EMOJIS.STAR_RAINBOW} **Tiến độ hiện tại:** \`[${barStr}]\` **${percentLeft}%**\n` +
          `${EMOJIS.STRAWBERRY} **Tổn thất linh tài:** \`-${deducted.toLocaleString()}\` Linh Thạch\n\n` +
          `${EMOJIS.BOW_PINK} *Hãy tiếp tục tu luyện (\`Mtl\`) để tích tụ lại Tu Vi hoặc mua \`Bùa May Mắn\` trong \`Mshop\`!*`,
          `${EMOJIS.FAILURE} THĂNG CẤP THẤT BẠI (-30% TU VI)`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      // Xử lý thành công
      if (hasCharm) {
        user.inventory.charms.bua_may_man -= 1;
      }

      if (isThienKiep && user.thien_kiep < 9) {
        user.thien_kiep += 1;
        db.updateUser(guild.id, userId, { thien_kiep: user.thien_kiep });

        const embed = createManyCurielEmbed(
          client,
          `${EMOJIS.SPARKLE_FX} **VƯỢT THIÊN KIẾP THÀNH CÔNG!**\n\n` +
          `Chúc mừng <@${userId}> đã vượt qua **Lôi Kiếp thứ ${user.thien_kiep}/10**!\n` +
          `${EMOJIS.STAR_RAINBOW} Tiến trình Thiên Kiếp: \`${user.thien_kiep} / 10\`\n` +
          `${EMOJIS.BOW_PINK} Khi hoàn thành đủ 10/10 kiếp, đạo hữu sẽ chính thức phi thăng cảnh giới tiếp theo!`,
          `${EMOJIS.SPARKLE_FX} THIÊN LÔI RUNG CHUYỂN`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      // Đột phá cảnh giới / Tầng mới
      let nextRealm = user.realm;
      let nextStage: string = user.stage;

      if (user.realm === 'Phàm Nhân') {
        nextRealm = 'Luyện Khí';
        nextStage = 'Tầng 1';
      } else if (user.realm === 'Luyện Khí') {
        const stageIdx = LUYEN_KHI_STAGES.indexOf(user.stage as any);
        if (stageIdx < 8) {
          nextStage = LUYEN_KHI_STAGES[stageIdx + 1];
        } else {
          nextRealm = 'Trúc Cơ';
          nextStage = 'Sơ Kỳ';
        }
      } else {
        const stageIdx = STANDARD_STAGES.indexOf(user.stage as any);
        if (stageIdx < 3 && stageIdx >= 0) {
          nextStage = STANDARD_STAGES[stageIdx + 1];
        } else {
          if (realmIdx < REALM_ORDER.length - 1) {
            nextRealm = REALM_ORDER[realmIdx + 1];
            nextStage = 'Sơ Kỳ';
          } else {
            nextStage = 'Viên Mãn';
          }
        }
      }

      const isMajorPromotion = nextRealm !== user.realm;
      user.realm = nextRealm;
      user.stage = nextStage;
      user.tu_vi = Math.max(0, user.tu_vi - reqTuVi); // Tiêu hao Tu Vi đã tích lũy cho cấp tiếp theo
      user.max_hp = (user.max_hp || 15000) + 10000;
      user.current_hp = user.max_hp; // Hồi phục đầy HP khi thăng cấp
      user.thien_kiep = 0;
      user.diem_cong_hien += 100;

      db.updateUser(guild.id, userId, {
        realm: user.realm,
        stage: user.stage,
        tu_vi: user.tu_vi,
        max_hp: user.max_hp,
        current_hp: user.current_hp,
        thien_kiep: user.thien_kiep,
        diem_cong_hien: user.diem_cong_hien
      });
      db.save();

      // Role check setup & Hidden channel sync
      const guildConfig = db.getGuildConfig(guild.id);
      const member = await guild.members.fetch(userId).catch(() => null);
      if (member) {
        if (guildConfig.role_tttl_id && nextRealm === 'Độ Kiếp') {
          await member.roles.add(guildConfig.role_tttl_id).catch(() => null);
        }
      }
      await updateHiddenChannelForUser(guild, userId, user.realm);

      const nextReward = getTuViRewardPerMtl(user.realm, user.stage);
      const nextReqTuVi = getRequiredTuViForNextLevel(user.realm, user.stage);
      const promotionTypeDesc = isMajorPromotion
        ? `🔥 **Đột Phá Đại Cảnh Giới:** Tu Vi nhận được tăng **×2** (\`+${nextReward.toLocaleString()}\` Tu Vi/lần tu luyện)!`
        : `✨ **Thăng Cấp Tiểu Cảnh Giới:** Tu Vi nhận được tăng **+1.000** (\`+${nextReward.toLocaleString()}\` Tu Vi/lần tu luyện)!`;

      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.SPARKLE_FX} **CHÚC MỪNG ĐẠO HỮU ĐÃ THĂNG CẤP THÀNH CÔNG!** ${EMOJIS.SPARKLE_FX}\n\n` +
        `${EMOJIS.BOW_PINK} **Đạo Hữu:** <@${userId}>\n` +
        `${EMOJIS.FLOWER_PURPLE} **Cảnh giới mới:** \`${user.realm}\`\n` +
        `${EMOJIS.STAR_RAINBOW} **Tầng / Giai đoạn:** \`${user.stage}\`\n\n` +
        `${promotionTypeDesc}\n` +
        `🎯 **Điều kiện cấp tiếp theo:** \`${nextReqTuVi.toLocaleString()}\` Tu Vi\n\n` +
        `${EMOJIS.HEART_PULSE} **HP Tối Đa:** \`${user.max_hp.toLocaleString()} HP\` (+10.000 HP)\n` +
        `${EMOJIS.CROWN} **Điểm Cống Hiến:** \`+100\` điểm\n` +
        `${EMOJIS.STAR_PURPLE} **Tu Vi còn lại:** \`${user.tu_vi.toLocaleString()}\` Tu Vi`,
        `${EMOJIS.CROWN} THĂNG CẤP CẢNH GIỚI THÀNH CÔNG`
      );
      embed.setImage(IMG_THANGCAP);

      await message.reply({ embeds: [embed] });
      return;
    }

    // Mhatdeiu (Lệnh Owner bí mật - Im lặng hoàn toàn với người khác)
    if (cmd === 'hatdeiu') {
      if (!isOwner(userId)) return;
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.CROWN} **DANH SÁCH LỆNH CAO CẤP (TIỀN TỐ H):**\n\n` +
        `👑 **QUẢN LÝ TÀI NGUYÊN & CẤP VẬT PHẨM:**\n` +
        `${EMOJIS.BOW_PINK} \`Hgive @user <đơn vị> <số lượng>\`\n` +
        `  → Cấp Linh Thạch, Mảnh Ký Ức, Mảnh Nhân Vật (vô hạn, không trừ ví)\n` +
        `${EMOJIS.HEART_PINK_SPIN} \`Hhc @user <tên nhân vật> <số hảo cảm>\`\n` +
        `  → Điều chỉnh điểm Hảo Cảm với Sư phụ (+/- điểm, cho phép số âm)\n\n` +
        `👥 **QUẢN LÝ NHÂN SỰ & QUẢN LÝ:**\n` +
        `${EMOJIS.PBEAR} \`Hbogi @user\`\n` +
        `  → Xóa thành viên khỏi danh sách Quản lý hệ thống\n\n` +
        `🛠️ **CẤU HÌNH HỆ THỐNG & DỮ LIỆU:**\n` +
        `${EMOJIS.STAR_RAINBOW} \`Htestanh <tên nhân vật> <cấp ảnh>\`\n` +
        `  → Xem trực tiếp ảnh thẻ nhân vật các cấp (C, B, A, S, 1000)\n` +
        `${EMOJIS.STAR_MOON} \`Hchecksv\`\n` +
        `  → Quét và duyệt danh sách toàn bộ máy chủ bot tham gia (phân trang < và >)\n` +
        `${EMOJIS.RAINBOW_CUTE} \`Hcb @user <cảnh_giới> <giai_đoạn>\`\n` +
        `  → Tăng/hạ trực tiếp cảnh giới & tự động cập nhật role/kênh ẩn Discord\n` +
        `${EMOJIS.SPARKLE_FX} \`Haddemoij <emoji>\`\n` +
        `  → Thêm Custom Emoji mới vào hệ thống trang trí Embed của bot\n` +
        `${EMOJIS.CINNA_HORSE} \`Htuanhanhtg <tên_sự_kiện> <số_giờ>\`\n` +
        `  → Tua nhanh mốc thời gian sự kiện trong cơ sở dữ liệu bền vững\n` +
        `${EMOJIS.CROWN} \`Hhatdeiu\`\n` +
        `  → Hiển thị bảng danh sách toàn bộ lệnh cao cấp`,
        `${EMOJIS.CROWN} BẢNG ĐIỀU KHIỂN CAO CẤP`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // Mql — XEM LỆNH QUẢN LÝ (CHỈ QUẢN LÝ VÀ OWNER)
    if (cmd === 'ql' || cmd === 'quanly') {
      if (!isOwner(userId) && !isQuanLy(userId)) {
        const embed = createManyCurielEmbed(client, '⛔ Bạn không có quyền xem danh sách lệnh Quản lý.');
        await message.reply({ embeds: [embed] });
        return;
      }

      const embed = createManyCurielEmbed(
        client,
        `👑 **DANH SÁCH TOÀN BỘ LỆNH DÀNH CHO QUẢN LÝ (TIỀN TỐ M & /):**\n\n` +
        `💎 **CẤP VẬT PHẨM & TÀI SẢN (VÔ HẠN, KHÔNG TRỪ VÍ):**\n` +
        `${EMOJIS.BUTTERFLY_PINK} \`Mtangmanh <cấp> <tên char> @user <số lượng>\`\n` +
        `  → Tặng Mảnh Nhân Vật (C, B, A, S) trực tiếp cho người chơi\n` +
        `${EMOJIS.BOW_PINK} \`Mtang <đơn vị> @user <số lượng>\`\n` +
        `  → Cấp Tinh Không Thạch hoặc Mảnh Ký Ức trực tiếp cho người chơi\n\n` +
        `👥 **QUẢN LÝ NHÂN SỰ & STAFF:**\n` +
        `${EMOJIS.CROWN} \`Mcacql\`\n` +
        `  → Xem danh sách tất cả Quản lý đang có trong hệ thống\n` +
        `${EMOJIS.PUSHEEN_PINK} \`Maddstaff @user\`\n` +
        `  → Bổ nhiệm thành viên vào danh sách Staff\n` +
        `${EMOJIS.PAW} \`Mcacstaff\`\n` +
        `  → Xem danh sách toàn bộ Staff hiện tại\n` +
        `${EMOJIS.PBEAR} \`Mbostaff @user\`\n` +
        `  → Xóa quyền Staff của thành viên\n\n` +
        `⚔️ **SỰ KIỆN, PHÁT QUÀ & CHIẾN ĐẤU:**\n` +
        `${EMOJIS.STRAWBERRY} \`Mphatqua <tổng TKT> <số người>\`\n` +
        `  → Tạo sự kiện phát quà Linh Thạch nút bấm cho toàn server (không giới hạn)\n` +
        `${EMOJIS.BUTTERFLY_GREEN} \`Mthaboss #kênh\`\n` +
        `  → Thả Boss Chung (Thần Lãng Thiên Sơn - 20.000 HP) vào kênh chỉ định\n` +
        `${EMOJIS.DOUCEUR_PURPLE_26} \`Mkillboss\` / \`Mtieudietboss\`\n` +
        `  → Tiêu diệt Boss Chung ngay lập tức và dọn dẹp chiến trường\n` +
        `${EMOJIS.STAR_PURPLE} \`Mbotongmon <tên tông môn>\`\n` +
        `  → Giải tán tông môn theo lệnh quản trị\n` +
        `${EMOJIS.STAR_MOON} \`Mmobicanh <tên tông môn>\`\n` +
        `  → Khai mở bí cảnh đặc biệt ngoài lịch cho tông môn\n` +
        `${EMOJIS.CAKE_CAT} \`Mbovp <tên sản phẩm>\`\n` +
        `  → Gỡ bỏ vĩnh viễn sản phẩm khỏi Cửa Hàng (Mshop)\n` +
        `${EMOJIS.DOUCEUR_PURPLE_26} \`Mcam @user <thời gian>\`\n` +
        `  → Cấm người chơi sử dụng Bot theo thời gian chỉ định (30S, 10P, 2H)\n` +
        `${EMOJIS.SPARKLE_FX} \`Mbocam @user\`\n` +
        `  → Gỡ bỏ lệnh cấm sử dụng Bot cho người chơi\n\n` +
        `⚙️ **LỆNH CÀI ĐẶT HỆ THỐNG (SLASH COMMANDS):**\n` +
        `${EMOJIS.STAR_BLUE} \`/setupkenhchoi\` → Cài đặt kênh chơi bot duy nhất cho server\n` +
        `${EMOJIS.STAR_PINK} \`/setuprolet1\` → Cài đặt role Luyện Khí Tầng 1\n` +
        `${EMOJIS.STAR_PURPLE} \`/setupkenhan\` → Cài đặt kênh ẩn cho tu sĩ cảnh giới cao\n` +
        `${EMOJIS.STAR_RAINBOW} \`/setuproletttl\` → Cài đặt role Tiên Tôn Trọng Lực (Độ Kiếp)\n` +
        `${EMOJIS.CROWN} \`/setuprolephuhao @role\` → Thiết lập Discord Role Top 1 BXH Phú Hào\n` +
        `${EMOJIS.STAR_MOON} \`/setanhthe <tên char> <cấp> <link>\` → Thiết lập ảnh thẻ nhân vật\n` +
        `${EMOJIS.RAINBOW_CUTE} \`Mql\` / \`Hql\` → Xem danh sách lệnh Quản lý`,
        `${EMOJIS.CROWN} BẢNG ĐIỀU KHIỂN QUẢN LÝ (Mql)`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // Mstaff — XEM LỆNH STAFF (CHỈ STAFF, QUẢN LÝ VÀ OWNER)
    if (cmd === 'staff') {
      if (!isOwner(userId) && !isQuanLy(userId) && !isStaff(userId)) {
        const embed = createManyCurielEmbed(client, '⛔ Bạn không có quyền xem danh sách lệnh Staff.');
        await message.reply({ embeds: [embed] });
        return;
      }

      const embed = createManyCurielEmbed(
        client,
        `🛡️ **DANH SÁCH TOÀN BỘ LỆNH DÀNH CHO STAFF (TIỀN TỐ M):**\n\n` +
        `👥 **XEM DANH SÁCH:**\n` +
        `${EMOJIS.PAW} \`Mcacstaff\`\n` +
        `  → Xem danh sách toàn bộ Staff hiện tại trong máy chủ\n\n` +
        `🎁 **SỰ KIỆN PHÁT QUÀ:**\n` +
        `${EMOJIS.STRAWBERRY} \`Mphatqua <tổng TKT> <số người>\`\n` +
        `  → Tạo sự kiện phát quà Tinh Không Thạch bấm nút may mắn\n` +
        `  *(Giới hạn: Tối đa 3 lần/ngày tính chung toàn bộ Staff. Quản lý không giới hạn)*\n\n` +
        `⚔️ **QUẢN TRỊ TRẬN ĐÁNH BOSS:**\n` +
        `${EMOJIS.BUTTERFLY_GREEN} \`Mthaboss #kênh\`\n` +
        `  → Thả Boss Chung vào kênh được chỉ định cho toàn server cùng khiêu chiến\n\n` +
        `⛔ **XỬ LÝ VI PHẠM:**\n` +
        `${EMOJIS.DOUCEUR_PURPLE_26} \`Mcam @user <thời gian>\`\n` +
        `  → Cấm người chơi sử dụng bot theo thời gian chỉ định (ví dụ: 30S, 10P, 2H)\n` +
        `${EMOJIS.SPARKLE_FX} \`Mbocam @user\`\n` +
        `  → Bỏ cấm sử dụng bot cho người chơi vi phạm\n\n` +
        `${EMOJIS.STAR_RAINBOW} \`Mstaff\` / \`Hstaff\` → Xem danh sách lệnh Staff`,
        `${EMOJIS.CROWN} BẢNG ĐIỀU KHIỂN STAFF (Mstaff)`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 4. Mhs / Mtuvi (Xem Hồ Sơ Tu Tiên & Túi Đồ - đã bỏ Mhoso)
    if (cmd === 'hs' || cmd === 'tuvi') {
      const target = message.mentions.users.first() || message.author;
      const user = db.getOrCreateUser(guild.id, target.id, target.username);

      const reqTuVi = getRequiredTuViForNextLevel(user.realm, user.stage);
      const progressPercent = Math.min(100, Math.floor((user.tu_vi / reqTuVi) * 100));
      const totalBars = 10;
      const filled = Math.round((progressPercent / 100) * totalBars);
      const barStr = '█'.repeat(filled) + '░'.repeat(totalBars - filled);

      const petCount = (user as any).pet_count || 1;
      const petCountSuffix = petCount > 1 ? ` (x${petCount})` : '';
      const petStr = user.pet ? `${user.pet}${user.pet.includes('x') || user.pet.includes('(') ? '' : petCountSuffix} (Cấp ${user.pet_level || 1})` : 'Không có';
      const linhThachStr = `${user.tinh_khong_thach.toLocaleString()} Linh Thạch`;
      const manhKyUcStr = `${user.manh_ky_uc.toLocaleString()} mảnh`;
      const diemCongHienStr = `${user.diem_cong_hien.toLocaleString()} điểm`;

      const embed = createManyCurielEmbed(
        client,
        `<:1Hachi:1558090289195782254>   **ĐẠO HIỆU:** <@${target.id}> (\`${target.username}\`)\n\n` +
        `<a:bluesaturn:1558696989854662736>  **Cảnh giới:** \`${user.realm}\` — **Tầng/Giai đoạn:** \`${user.stage}\`\n` +
        `<a:bling:1562103611587170435> **Tu Vi:** \`${user.tu_vi.toLocaleString()} / ${reqTuVi.toLocaleString()}\` Tu Vi (${progressPercent}%)\n` +
        `\`[${barStr}]\`\n\n` +
        ` <:yxz_star1:1558087806490910840> **Máu (HP):** \`${(user.current_hp || 15000).toLocaleString()} / ${(user.max_hp || 15000).toLocaleString()} HP\`\n` +
        `<a:blue_gem:1558697044510638144>   **Linh Thạch:** ${(user.tinh_khong_thach || 0).toLocaleString()} Linh Thạch\n` +
        `<a:emoji_71:1559201095501348944>   **Mảnh Ký Ức:** ${(user.manh_ky_uc || 0).toLocaleString()} mảnh\n` +
        `<a:sao:1562103382980690051>  **Điểm Cống Hiến:** ${(user.diem_cong_hien || 0).toLocaleString()} điểm\n` +
        `<a:z_paw:1556291363429945394>  **Linh thú sở hữu:** ${petStr}\n` +
        `<a:angelBlob3:1555974609747050678>  **Chiến tích quái thú:** \`${user.total_battles || 0}\` trận (\`${user.wins || 0}\` Thắng / \`${user.losses || 0}\` Thua)`,
        `BẢNG HỒ SƠ TU TIÊN`
      );
      embed.setThumbnail(target.displayAvatarURL());

      const bagRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`btn_bag_${target.id}`)
          .setLabel('🎒 XEM TÚI ĐỒ')
          .setStyle(ButtonStyle.Primary)
      );

      const sentMsg = await message.reply({ embeds: [embed], components: [bagRow] });

      const collector = sentMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000
      });

      collector.on('collect', async i => {
        if (i.user.id !== target.id) {
          await i.reply({
            content: '⛔ Bạn không thể xem túi đồ của người khác! Hãy gõ `Mhs` để xem túi đồ của chính mình.',
            ephemeral: true
          });
          return;
        }

        const freshUser = db.getOrCreateUser(guild.id, target.id);
        const inv = freshUser.inventory || { dan_duoc: { truong_sinh_dan: 0 }, weapons: [], armor: [], charms: { bua_may_man: 0 } };

        const danDuocStr = inv.dan_duoc?.truong_sinh_dan > 0 ? `• Trường Sinh Sinh Đan: \`x${inv.dan_duoc.truong_sinh_dan}\` viên (Hiệu lực: \`${freshUser.truong_sinh_active_battles || 0}/3\` trận)` : '• Không có đan dược';
        const weaponStr = inv.weapons && inv.weapons.length > 0 ? inv.weapons.map(w => `• ${w} (+sát thương)`).join('\n') : '• Không có vũ khí';
        const armorStr = inv.armor && inv.armor.length > 0 ? inv.armor.map(a => `• ${a.name} (Độ bền: \`${a.durability}/3\` lần chặn)`).join('\n') : '• Không có giáp';
        const charmStr = inv.charms?.bua_may_man > 0 ? `• Bùa May Mắn: \`x${inv.charms.bua_may_man}\` (+10% thăng cấp)` : '• Không có bùa';
        const freshPetCount = (freshUser as any).pet_count || 1;
        const freshPetCountSuffix = freshPetCount > 1 ? ` (x${freshPetCount})` : '';
        const petInfo = freshUser.pet ? `• ${freshUser.pet}${freshUser.pet.includes('x') || freshUser.pet.includes('(') ? '' : freshPetCountSuffix} (Cấp ${freshUser.pet_level || 1})` : '• Không có linh thú';

        const equippedW = freshUser.equipped_weapons || [];
        const equippedA = freshUser.equipped_armor || [];
        const equippedWStr = equippedW.length > 0 ? equippedW.map((w, idx) => `• ${idx + 1}. **${w}** (+sát thương Boss)`).join('\n') : '*Chưa trang bị vũ khí nào (Tối đa 3)*';
        const equippedAStr = equippedA.length > 0 ? equippedA.map((a, idx) => `• ${idx + 1}. **${a.name}** (Độ bền: \`${a.durability}/3\` lần chặn)`).join('\n') : '*Chưa trang bị giáp nào (Tối đa 3)*';

        const bagEmbed = createManyCurielEmbed(
          client,
          `🎒 **TÚI ĐỒ TRỮ VẬT CỦA** <@${target.id}>:\n\n` +
          `⚔️ **Vũ Khí Đang Trang Bị (\`${equippedW.length}/3\`):**\n${equippedWStr}\n\n` +
          `🛡️ **Giáp Đang Trang Bị (\`${equippedA.length}/3\`):**\n${equippedAStr}\n\n` +
          `━━━━━━━━━━━━━━━━━━\n` +
          `💊 **Đan Dược Trong Túi:**\n${danDuocStr}\n\n` +
          `🗡️ **Vũ Khí Dự Phòng:**\n${weaponStr}\n\n` +
          `🛡️ **Giáp Dự Phòng:**\n${armorStr}\n\n` +
          `📜 **Bùa Chú:**\n${charmStr}\n\n` +
          `🐾 **Linh Thú:**\n${petInfo}\n\n` +
          `💎 **Linh Thạch:** \`${freshUser.tinh_khong_thach.toLocaleString()}\`\n\n` +
          `💡 *Dùng lệnh \`Mgan <vũ khí/giáp>\` để trang bị và \`Mbogan <vũ khí/giáp>\` để tháo trang bị!*`,
          `${EMOJIS.BOW_PINK} TÚI ĐỒ TU SĨ`
        );

        await i.reply({ embeds: [bagEmbed], ephemeral: true });
      });

      return;
    }

    // 4b. Mgan <vũ khí/ giáp> (Trang bị tối đa 3 vũ khí và 3 giáp để đánh Boss)
    if (cmd === 'gan' || cmd === 'trangbi') {
      const itemName = args.join(' ').trim();
      if (!itemName) {
        const curUser = db.getOrCreateUser(guild.id, userId);
        const eqW = curUser.equipped_weapons || [];
        const eqA = curUser.equipped_armor || [];
        const embed = createManyCurielEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Mgan <tên vũ khí hoặc giáp>\`\n\n` +
          `• Ví dụ: \`Mgan Kiếm Vàng\` hoặc \`Mgan Giáp Sắt\`\n` +
          `• **Quy định:** Mỗi tu sĩ được trang bị **tối đa 3 vũ khí** và **3 giáp phòng ngự** để đi đánh Boss.\n\n` +
          `⚔️ **Vũ khí đang trang bị (\`${eqW.length}/3\`):** ${eqW.length > 0 ? eqW.join(', ') : '*Chưa có*'}\n` +
          `🛡️ **Giáp đang trang bị (\`${eqA.length}/3\`):** ${eqA.length > 0 ? eqA.map(a => `${a.name} (${a.durability}/3)`).join(', ') : '*Chưa có*'}\n\n` +
          `👉 *Dùng \`Mbogan <tên>\` nếu muốn tháo bỏ trang bị!*`,
          'TRANG BỊ ĐÁNH BOSS'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const res = db.equipItem(guild.id, userId, itemName);
      const user = db.getOrCreateUser(guild.id, userId);
      const eqW = user.equipped_weapons || [];
      const eqA = user.equipped_armor || [];

      const embed = createManyCurielEmbed(
        client,
        `${res.message}\n\n` +
        `⚔️ **Vũ khí trang bị hiện tại (\`${eqW.length}/3\`):**\n${eqW.length > 0 ? eqW.map(w => `• **${w}** (+sát thương)`).join('\n') : '*Chưa có*'}\n\n` +
        `🛡️ **Giáp phòng ngự hiện tại (\`${eqA.length}/3\`):**\n${eqA.length > 0 ? eqA.map(a => `• **${a.name}** (Độ bền: \`${a.durability}/3\`)`).join('\n') : '*Chưa có*'}\n\n` +
        `💡 *Hãy vào lệnh \`Mboss\` hoặc \`Mkhieuchien\` để xuất trận cùng các trang bị này!*`,
        res.success ? 'TRANG BỊ THÀNH CÔNG' : 'LỖI TRANG BỊ'
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 4c. Mbogan <vũ khí/ giáp> (Tháo bỏ trang bị)
    if (cmd === 'bogan' || cmd === 'thaotrangbi' || cmd === 'thaogan') {
      const itemName = args.join(' ').trim();
      if (!itemName) {
        const curUser = db.getOrCreateUser(guild.id, userId);
        const eqW = curUser.equipped_weapons || [];
        const eqA = curUser.equipped_armor || [];
        const embed = createManyCurielEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Mbogan <tên vũ khí hoặc giáp>\`\n\n` +
          `• Ví dụ: \`Mbogan Kiếm Vàng\` hoặc \`Mbogan Giáp Sắt\`\n\n` +
          `⚔️ **Vũ khí đang trang bị (\`${eqW.length}/3\`):** ${eqW.length > 0 ? eqW.join(', ') : '*Chưa có*'}\n` +
          `🛡️ **Giáp đang trang bị (\`${eqA.length}/3\`):** ${eqA.length > 0 ? eqA.map(a => `${a.name} (${a.durability}/3)`).join(', ') : '*Chưa có*'}`,
          'THÁO BỎ TRANG BỊ'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const res = db.unequipItem(guild.id, userId, itemName);
      const user = db.getOrCreateUser(guild.id, userId);
      const eqW = user.equipped_weapons || [];
      const eqA = user.equipped_armor || [];

      const embed = createManyCurielEmbed(
        client,
        `${res.message}\n\n` +
        `⚔️ **Vũ khí trang bị còn lại (\`${eqW.length}/3\`):** ${eqW.length > 0 ? eqW.join(', ') : '*Trống*'}\n` +
        `🛡️ **Giáp phòng ngự còn lại (\`${eqA.length}/3\`):** ${eqA.length > 0 ? eqA.map(a => a.name).join(', ') : '*Trống*'}`,
        res.success ? 'THÁO TRANG BỊ THÀNH CÔNG' : 'LỖI THÁO TRANG BỊ'
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 5. Mchiendau / Mcd (Chiến Đấu Quái Thú)
    if (cmd === 'chiendau' || cmd === 'cd') {
      const user = db.getOrCreateUser(guild.id, userId, message.author.username);

      const realmIdx = REALM_ORDER.indexOf(user.realm);
      // HP quái tương xứng cảnh giới: 15.000 đến 500.000
      const minMonsterHp = 15000 + realmIdx * 25000;
      const maxMonsterHp = Math.min(500000, 30000 + realmIdx * 50000);
      const monsterHp = Math.floor(Math.random() * (maxMonsterHp - minMonsterHp + 1)) + minMonsterHp;

      const monsterNames = ['Hắc Thiết Cuồng Lang', 'Thái Cổ U Linh Thú', 'Cửu U Độc Hạt', 'Băng Sương Cự Mãng', 'Huyết Lân Cuồng Ma'];
      const monsterName = monsterNames[Math.floor(Math.random() * monsterNames.length)];

      const embed = createManyCurielEmbed(
        client,
        `⚔️ **CHIẾN TRƯỜNG HUYỄN CẢNH — THÁCH THỨC QUÁI THÚ** ⚔️\n\n` +
        `🐾 **Quái Thú xuất hiện:** **${monsterName}**\n` +
        `• ${EMOJIS.BLOOD} **Sinh mệnh quái:** \`${monsterHp.toLocaleString()} HP\`\n\n` +
        `👤 **Tu Sĩ:** <@${userId}> (${EMOJIS.BLOOD} \`${user.current_hp.toLocaleString()} / ${user.max_hp.toLocaleString()} HP\`)\n` +
        `🗡️ **Sát thương cơ bản:** \`500 HP / đòn\` + Sát thương vũ khí\n\n` +
        `⏱️ *Bấm nút bên dưới để tiến vào quyết đấu sinh tử!*`,
        `KHIÊU CHIẾN QUÁI THÚ`
      );

      const combatRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`start_combat_${userId}`)
          .setLabel('⚔️ BẮT ĐẦU CHIẾN ĐẤU')
          .setStyle(ButtonStyle.Danger)
      );

      const combatMsg = await message.reply({ embeds: [embed], components: [combatRow] });

      const collector = combatMsg.createMessageComponentCollector({
        filter: i => i.user.id === userId,
        componentType: ComponentType.Button,
        time: 45000,
        max: 1
      });

      collector.on('collect', async i => {
        const freshUser = db.getOrCreateUser(guild.id, userId);
        const inv = freshUser.inventory;

        // Tính sát thương vũ khí
        let weaponBonus = 0;
        if (inv.weapons?.includes('Kiếm Vàng')) {
          weaponBonus = 20;
        } else if (inv.weapons?.includes('Kiếm Sắt')) {
          weaponBonus = 15;
        }

        // Trường Sinh Đan check
        const hasTruongSinh = freshUser.truong_sinh_active_battles > 0;
        if (hasTruongSinh) {
          freshUser.truong_sinh_active_battles -= 1;
        }

        // Giáp check
        let hasArmor = false;
        if (inv.armor && inv.armor.length > 0) {
          hasArmor = true;
          const armorItem = inv.armor[0];
          armorItem.durability -= 1;
          if (armorItem.durability <= 0) {
            inv.armor.shift(); // Hỏng thì tự xóa khỏi túi
          }
        }

        // Tỷ lệ thắng dựa trên cảnh giới & HP
        const winChance = hasTruongSinh ? 90 : Math.min(85, Math.max(25, 50 + realmIdx * 4));
        const isWin = Math.random() * 100 <= winChance;

        freshUser.total_battles = (freshUser.total_battles || 0) + 1;

        if (isWin) {
          freshUser.wins = (freshUser.wins || 0) + 1;
          const rewardLT = Math.floor(Math.random() * 10001) + 20000; // 20.000 -> 30.000 Linh Thạch
          freshUser.tinh_khong_thach += rewardLT;
          db.updateUser(guild.id, userId, {
            total_battles: freshUser.total_battles,
            wins: freshUser.wins,
            tinh_khong_thach: freshUser.tinh_khong_thach,
            truong_sinh_active_battles: freshUser.truong_sinh_active_battles,
            inventory: freshUser.inventory
          });

          const winEmbed = createManyCurielEmbed(
            client,
            `🏆 **CHIẾN THẮNG QUÁI THÚ VANG DỘI!**\n\n` +
            `Đạo hữu đã chém gục **${monsterName}** sau trận thư hùng nảy lửa!\n\n` +
            `🎁 **Chiến lợi phẩm thu được:**\n` +
            `• \`+${rewardLT.toLocaleString()}\` Linh Thạch\n` +
            (weaponBonus > 0 ? `• Vũ khí tăng cường sát thương: \`+${weaponBonus} ST\`\n` : '') +
            (hasArmor ? `• Giáp Sắt đã kích hoạt chặn sát thương (Độ bền giảm 1)\n` : '') +
            (hasTruongSinh ? `• Trường Sinh Đan kích hoạt: HP được hồi phục toàn vẹn!\n` : '') +
            `\n💎 **Tổng Linh Thạch hiện có:** \`${freshUser.tinh_khong_thach.toLocaleString()}\``,
            `${EMOJIS.CROWN} THẮNG TRẬN`
          );
          await i.update({ embeds: [winEmbed], components: [] });
        } else {
          freshUser.losses = (freshUser.losses || 0) + 1;
          const lostLT = Math.min(freshUser.tinh_khong_thach, 15000);
          freshUser.tinh_khong_thach -= lostLT;
          db.updateUser(guild.id, userId, {
            total_battles: freshUser.total_battles,
            losses: freshUser.losses,
            tinh_khong_thach: freshUser.tinh_khong_thach,
            truong_sinh_active_battles: freshUser.truong_sinh_active_battles,
            inventory: freshUser.inventory
          });

          const lossEmbed = createManyCurielEmbed(
            client,
            `${EMOJIS.FAILURE} **THẤT BẠI TRƯỚC HUNG HÃN CỦA QUÁI THÚ!**\n\n` +
            `Quái thú **${monsterName}** quá hung tợn, đạo hữu đành phải rút lui bảo toàn tính mạng!\n\n` +
            `• **Tổn thất linh tài:** \`-${lostLT.toLocaleString()}\` Linh Thạch\n` +
            `• **Linh Thạch còn lại:** \`${freshUser.tinh_khong_thach.toLocaleString()}\`\n` +
            `\n💡 *Hãy trang bị vũ khí, giáp trụ và nâng cao tu vi trước khi tái đấu!*`,
            `${EMOJIS.FAILURE} BẠI TRẬN`
          );
          await i.update({ embeds: [lossEmbed], components: [] });
        }
      });

      return;
    }

    // 6. Mshop / Mcuahang (Cửa Hàng 6 Khu Vực Nút Bấm & Giỏ Hàng & 3 Nút Hành Động)
    if (cmd === 'shop' || cmd === 'cuahang') {
      await handleShopCommand(message, client);
      return;
    }

    // 6b. Mgan <vũ khí/giáp> (Trang bị tối đa 3 vũ khí và 3 giáp để đi đánh boss)
    if (cmd === 'gan' || cmd === 'trangbi' || cmd === 'equip') {
      const user = db.getOrCreateUser(guild.id, userId, message.author.username);
      const itemName = args.join(' ').trim();

      if (!itemName) {
        const equippedW = user.equipped_weapons || [];
        const equippedA = user.equipped_armor || [];
        const wStr = equippedW.length > 0 ? equippedW.map((w, idx) => `• ${idx + 1}. **${w}** (+sát thương Boss)`).join('\n') : '*Chưa gắn vũ khí (Tối đa 3)*';
        const aStr = equippedA.length > 0 ? equippedA.map((a, idx) => `• ${idx + 1}. **${a.name}** (Độ bền: \`${a.durability}/3\` lần chặn)`).join('\n') : '*Chưa gắn giáp (Tối đa 3)*';

        const embed = createManyCurielEmbed(
          client,
          `🎒 **TRANG BỊ CHIẾN ĐẤU CỦA ĐẠO HỮU** <@${userId}>:\n\n` +
          `⚔️ **Vũ Khí Đang Gắn (\`${equippedW.length}/3\`):**\n${wStr}\n\n` +
          `🛡️ **Giáp Trụ Đang Gắn (\`${equippedA.length}/3\`):**\n${aStr}\n\n` +
          `👉 **Cú pháp:** \`Mgan <tên vũ khí hoặc giáp>\`\n` +
          `• Ví dụ: \`Mgan Kiếm Vàng\` hoặc \`Mgan Giáp Sắt\`\n` +
          `• Để tháo bỏ trang bị: \`Mbogan <tên vũ khí/giáp>\``,
          'TRANG BỊ CHIẾN ĐẤU (MGAN)'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      // Check if weapon or armor in user's inventory
      const hasWeapon = user.inventory?.weapons?.some(w => w.toLowerCase().includes(itemName.toLowerCase()));
      const hasArmor = user.inventory?.armor?.some(a => a.name.toLowerCase().includes(itemName.toLowerCase()));

      if (!hasWeapon && !hasArmor) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ Đạo hữu không sở hữu trang bị **${itemName}** trong túi trữ vật!\n\n` +
          `👉 Hãy dùng lệnh \`Mhs\` để kiểm tra túi đồ hoặc dùng \`Mshop\` để mua thêm vũ khí, giáp trụ.`,
          'KHÔNG CÓ TRANG BỊ'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      if (hasWeapon) {
        const matchedWeapon = user.inventory.weapons.find(w => w.toLowerCase().includes(itemName.toLowerCase()))!;
        const res = db.equipWeapon(guild.id, userId, matchedWeapon);
        if (res.success) {
          const embed = createManyCurielEmbed(client, `⚔️ ${res.message}\n\n• Sát thương cơ bản khi đánh Boss sẽ được cộng thêm uy lực từ vũ khí!`, 'TRANG BỊ VŨ KHÍ THÀNH CÔNG');
          await message.reply({ embeds: [embed] });
        } else {
          const embed = createManyCurielEmbed(client, `⚠️ ${res.message}`, 'LỖI TRANG BỊ VŨ KHÍ');
          await message.reply({ embeds: [embed] });
        }
        return;
      }

      if (hasArmor) {
        const matchedArmor = user.inventory.armor.find(a => a.name.toLowerCase().includes(itemName.toLowerCase()))!;
        const res = db.equipArmor(guild.id, userId, matchedArmor.name);
        if (res.success) {
          const embed = createManyCurielEmbed(client, `🛡️ ${res.message}\n\n• Giáp sẽ tự động hấp thụ và giảm sát thương phản đòn từ Boss!`, 'TRANG BỊ GIÁP THÀNH CÔNG');
          await message.reply({ embeds: [embed] });
        } else {
          const embed = createManyCurielEmbed(client, `⚠️ ${res.message}`, 'LỖI TRANG BỊ GIÁP');
          await message.reply({ embeds: [embed] });
        }
        return;
      }
    }

    // 6c. Mbogan <vũ khí/giáp> (Lệnh này để bỏ trang bị)
    if (cmd === 'bogan' || cmd === 'thao' || cmd === 'thaogan' || cmd === 'unequip') {
      const user = db.getOrCreateUser(guild.id, userId, message.author.username);
      const itemName = args.join(' ').trim();

      if (!itemName) {
        const embed = createManyCurielEmbed(
          client,
          `⚠️ **Cú pháp:** \`Mbogan <tên vũ khí hoặc giáp>\`\nVí dụ: \`Mbogan Kiếm Vàng\` hoặc \`Mbogan Giáp Sắt\``,
          'THÁO TRANG BỊ'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      // Check weapon
      const isEquippedW = user.equipped_weapons?.some(w => w.toLowerCase().includes(itemName.toLowerCase()));
      if (isEquippedW) {
        const matchedW = user.equipped_weapons!.find(w => w.toLowerCase().includes(itemName.toLowerCase()))!;
        const res = db.unequipWeapon(guild.id, userId, matchedW);
        const embed = createManyCurielEmbed(client, `✅ ${res.message}`, 'THÁO TRANG BỊ VŨ KHÍ');
        await message.reply({ embeds: [embed] });
        return;
      }

      // Check armor
      const isEquippedA = user.equipped_armor?.some(a => a.name.toLowerCase().includes(itemName.toLowerCase()));
      if (isEquippedA) {
        const matchedA = user.equipped_armor!.find(a => a.name.toLowerCase().includes(itemName.toLowerCase()))!;
        const res = db.unequipArmor(guild.id, userId, matchedA.name);
        const embed = createManyCurielEmbed(client, `✅ ${res.message}`, 'THÁO TRANG BỊ GIÁP');
        await message.reply({ embeds: [embed] });
        return;
      }

      const embed = createManyCurielEmbed(
        client,
        `⚠️ Đạo hữu hiện **chưa trang bị** vật phẩm **${itemName}**!\n👉 Dùng lệnh \`Mgan\` để kiểm tra danh sách đang gắn.`,
        'CHƯA TRANG BỊ'
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 7. Mbovp <tên sản phẩm> <khu vực> (Chỉ dành cho Quản Lý)
    if (cmd === 'bovp') {
      if (!isOwner(userId) && !isQuanLy(userId)) {
        const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
        await message.reply({ embeds: [embed] });
        return;
      }

      const pName = args.join(' ').trim();
      if (!pName) {
        const embed = createManyCurielEmbed(
          client,
          '⚠️ **Cú pháp:** `Mbovp <tên_sản_phẩm>`\nVí dụ: `Mbovp Kiếm Sắt` hoặc `Mbovp Hồ Ly`',
          'XÓA SẢN PHẨM KHỎI SHOP'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      db.removeProductFromShop(pName);
      const embed = createManyCurielEmbed(
        client,
        `✅ Đã xóa sản phẩm **${pName}** khỏi Cửa Hàng thành công!\n*Người chơi sẽ không thể mua sản phẩm này nữa, nhưng người đã sở hữu vẫn giữ nguyên.*`,
        'XÓA SẢN PHẨM THÀNH CÔNG'
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 8. Mlixi <tổng linh thạch> <số người nhận> (Dành cho tất cả người chơi)
    if (cmd === 'lixi') {
      const totalAmount = parseInt(args[0], 10);
      const recipients = parseInt(args[1], 10);

      if (isNaN(totalAmount) || isNaN(recipients) || totalAmount <= 0 || recipients <= 0) {
        const embed = createManyCurielEmbed(
          client,
          '⚠️ **Cú pháp:** `Mlixi <tổng_linh_thạch> <số_người>`\nVí dụ: `Mlixi 100000 10`',
          'PHÁT PHONG BAO LÌ XÌ'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      if (totalAmount < recipients) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ Tổng số Linh Thạch (\`${totalAmount.toLocaleString()}\`) phải lớn hơn hoặc bằng số người nhận (\`${recipients}\`)!`,
          'LỖI SỐ LƯỢNG LÌ XÌ'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const user = db.getOrCreateUser(guild.id, userId, message.author.username);
      if (user.tinh_khong_thach < totalAmount) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ Đạo hữu không đủ Linh Thạch! Hiện có: \`${user.tinh_khong_thach.toLocaleString()}\`, cần: \`${totalAmount.toLocaleString()}\`.`,
          'KHÔNG ĐỦ LINH THẠCH'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const session = db.createLiXi(guild.id, message.channel.id, userId, message.author.username, totalAmount, recipients);
      if (!session) {
        const embed = createErrorEmbed(client, 'Không thể tạo phong bao lì xì.');
        await message.reply({ embeds: [embed] });
        return;
      }

      const lixiEmbed = createManyCurielEmbed(
        client,
        `🧧 **PHONG BAO LÌ XÌ TỪ** <@${userId}>!\n\n` +
        `💎 **Tổng phát:** \`${totalAmount.toLocaleString()}\` Linh Thạch\n` +
        `👥 **Số lượng:** \`${recipients}\` phần quà may mắn\n\n` +
        `👉 *Hãy bấm nút bên dưới để giật lì xì ngay trước khi hết lượt!*`,
        `${EMOJIS.BOW_PINK} PHONG BAO LÌ XÌ MAY MẮN`
      );

      const lixiRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`claim_lixi_${session.id}`)
          .setLabel('🧧 NHẬN LÌ XÌ')
          .setStyle(ButtonStyle.Success)
      );

      const lixiMsg = await message.reply({ embeds: [lixiEmbed], components: [lixiRow] });

      const collector = lixiMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 phút
      });

      collector.on('collect', async i => {
        const res = db.claimLiXi(session.id, i.user.id, i.user.username);
        if (res.success) {
          await i.reply({ content: `🎉 ${res.message}`, ephemeral: true });
          if (res.session && res.session.is_finished) {
            const finishedEmbed = createManyCurielEmbed(
              client,
              `🧧 **Phong bao lì xì của** <@${userId}> **đã được nhận hết!**\n\n` +
              `• Tổng Linh Thạch đã phát: \`${totalAmount.toLocaleString()}\`\n` +
              `• Người nhận may mắn: ${Object.keys(res.session.received_users).map(u => `<@${u}>`).join(', ')}`,
              'LÌ XÌ ĐÃ KẾT THÚC'
            );
            await lixiMsg.edit({ embeds: [finishedEmbed], components: [] }).catch(() => null);
          }
        } else {
          await i.reply({ content: `⛔ ${res.message}`, ephemeral: true });
        }
      });

      return;
    }

    // 8.1. Mgive @user <số lượng> (Tặng linh thạch có khấu trừ ví cá nhân)
    if (cmd === 'give') {
      const targetUser = message.mentions.users.first();
      const nonMention = args.filter(a => !a.startsWith('<@') && !a.endsWith('>'));

      if (!targetUser || nonMention.length === 0) {
        const embed = createManyCurielEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Mgive @user <số_linh_thạch>\`\n` +
          `• Ví dụ: \`Mgive @user 100000\` hoặc \`Mgive @user 50k\` hoặc \`Mgive @user 10M\`\n` +
          `*Lưu ý: Số Linh Thạch tặng sẽ được trừ trực tiếp từ ví của bạn và chuyển cho người nhận.*`,
          'TẶNG LINH THẠCH'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      if (targetUser.id === userId) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ Đạo hữu không thể tự tặng Linh Thạch cho chính mình!`,
          'LỖI TẶNG LINH THẠCH'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      if (targetUser.bot) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ Không thể tặng Linh Thạch cho Bot!`,
          'LỖI TẶNG LINH THẠCH'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const rawAmount = nonMention[nonMention.length - 1];
      const amount = parseAmount(rawAmount);

      if (isNaN(amount) || amount <= 0) {
        const embed = createManyCurielEmbed(
          client,
          `⚠️ Số lượng Linh Thạch không hợp lệ! Ví dụ: \`100000\`, \`50k\`, \`10M\``,
          'LỖI SỐ LƯỢNG'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const sender = db.getOrCreateUser(guild.id, userId, message.author.username);
      if (sender.tinh_khong_thach < amount) {
        const embed = createManyCurielEmbed(
          client,
          `⛔ Đạo hữu không đủ Linh Thạch để tặng!\n` +
          `• **Linh Thạch hiện có:** \`${sender.tinh_khong_thach.toLocaleString()}\`\n` +
          `• **Linh Thạch muốn tặng:** \`${amount.toLocaleString()}\``,
          'KHÔNG ĐỦ LINH THẠCH'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      // Khấu trừ người tặng và cộng cho người nhận
      const receiver = db.getOrCreateUser(guild.id, targetUser.id, targetUser.username);
      sender.tinh_khong_thach -= amount;
      receiver.tinh_khong_thach += amount;

      db.updateUser(guild.id, userId, { tinh_khong_thach: sender.tinh_khong_thach });
      db.updateUser(guild.id, targetUser.id, { tinh_khong_thach: receiver.tinh_khong_thach });
      db.save();

      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.CUTEPAWS}\n` +
        `**TẶNG LINH THẠCH THÀNH CÔNG!**\n\n` +
        `• **Người tặng:** <@${userId}> (đã trừ \`-${amount.toLocaleString()}\` Linh Thạch)\n` +
        `• **Người nhận:** <@${targetUser.id}> (đã nhận \`+${amount.toLocaleString()}\` Linh Thạch)\n` +
        `• **Số dư còn lại của bạn:** \`${sender.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n\n` +
        `*Giao dịch đã được lưu trữ an toàn trong cơ sở dữ liệu.*`,
        `${EMOJIS.BOW_PINK} TẶNG LINH THẠCH THÀNH CÔNG`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 9. Mcauhoi / Mcaudo / Mluandao / Mld (LUẬN ĐẠO: Vấn Đáp Đạo Tâm & Nhận Thưởng)
    if (cmd === 'cauhoi' || cmd === 'caudo' || cmd === 'luandao' || cmd === 'ld') {
      const chooseEmbed = createManyCurielEmbed(
        client,
        `📜 **LUẬN ĐẠO ĐẠO TÂM — CHỌN ĐỘ KHÓ**\n\n` +
        `Hãy chọn mức độ thử thách để tham gia luận đạo cùng các vị cao nhân:\n\n` +
        `🟢 **Mức Dễ:**\n• Thưởng: \`1.000 → 5.000\` Linh Thạch | \`+100\` Tu Vi\n\n` +
        `🔴 **Mức Khó:**\n• Thưởng: \`3.000 → 8.000\` Linh Thạch | \`+300\` Tu Vi\n• Xác suất nhận thêm: \`2 → 5\` Mảnh Ký Ức\n• Cơ duyên: **3% tỉ lệ** nhận được **1 Mảnh Nhân Vật C** 🧩\n\n` +
        `⏱️ *Bấm chọn độ khó bên dưới để bắt đầu câu hỏi Luận Đạo!*`,
        `${EMOJIS.SPARKLE_FX} LUẬN ĐẠO TU CHÂN GIỚI`
      );

      const diffRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`diff_easy_${userId}`).setLabel('🟢 MỨC DỄ').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`diff_hard_${userId}`).setLabel('🔴 MỨC KHÓ').setStyle(ButtonStyle.Danger)
      );

      const chooseMsg = await message.reply({ embeds: [chooseEmbed], components: [diffRow] });

      const diffCollector = chooseMsg.createMessageComponentCollector({
        filter: i => i.user.id === userId,
        componentType: ComponentType.Button,
        time: 30000,
        max: 1
      });

      diffCollector.on('collect', async i => {
        const isHard = i.customId.startsWith('diff_hard_');
        const list = isHard ? HARD_QUESTIONS : EASY_QUESTIONS;
        const qItem = list[Math.floor(Math.random() * list.length)];

        // Trộn đáp án ngẫu nhiên
        const shuffled = [...qItem.opts];
        const correctText = qItem.opts[qItem.correct];
        for (let j = shuffled.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [shuffled[j], shuffled[k]] = [shuffled[k], shuffled[j]];
        }
        const correctNewIdx = shuffled.indexOf(correctText);

        const qRow = new ActionRowBuilder<ButtonBuilder>();
        shuffled.forEach((opt, idx) => {
          qRow.addComponents(
            new ButtonBuilder()
              .setCustomId(`ans_${idx}`)
              .setLabel(`${String.fromCharCode(65 + idx)}. ${opt.substring(0, 35)}`)
              .setStyle(ButtonStyle.Primary)
          );
        });

        const promptEmbed = createManyCurielEmbed(
          client,
          `📜 **Câu Hỏi Luận Đạo (${isHard ? 'Khó' : 'Dễ'}):**\n\n` +
          `*${qItem.q}*\n\n` +
          shuffled.map((opt, idx) => `**${String.fromCharCode(65 + idx)}.** ${opt}`).join('\n') +
          `\n\n⏱️ *Đạo hữu có 30 giây để bấm chọn đáp án đúng bên dưới!*`,
          `${EMOJIS.SPARKLE_FX} LUẬN ĐẠO`
        );

        await i.update({ embeds: [promptEmbed], components: [qRow] });

        const ansCollector = chooseMsg.createMessageComponentCollector({
          filter: btn => btn.user.id === userId,
          componentType: ComponentType.Button,
          time: 30000,
          max: 1
        });

        ansCollector.on('collect', async ansBtn => {
          const chosenIdx = parseInt(ansBtn.customId.replace('ans_', ''), 10);
          if (chosenIdx === correctNewIdx) {
            if (isHard) {
              const rewardLT = Math.floor(Math.random() * 5001) + 3000; // 3k - 8k
              const rewardMKU = Math.floor(Math.random() * 4) + 2; // 2 - 5 mảnh
              db.addTinhKhongThach(guild.id, userId, rewardLT, 'Luận đạo khó');
              db.addManhKyUc(guild.id, userId, rewardMKU, 'Luận đạo khó');
              db.addTuVi(guild.id, userId, 300);

              let shardBonus = '';
              if (Math.random() < 0.03) {
                const randomChar = CHARACTER_NAMES[Math.floor(Math.random() * CHARACTER_NAMES.length)];
                db.addManhNhanVat(guild.id, userId, randomChar, 'C', 1);
                shardBonus = `\n${EMOJIS.BUTTERFLY_PINK} **Cơ Duyên Luận Đạo:** \`+1 Mảnh C — ${randomChar}\` 🧩 (Tỉ lệ 3%)`;
              }

              const winEmbed = createManyCurielEmbed(
                client,
                `🎉 **LUẬN ĐẠO THÀNH CÔNG! ĐẠO HỮU ĐỐN NGỘ ĐẠO TÂM!** 🎉\n\n` +
                `🎁 **Phần thưởng Luận Đạo:**\n` +
                `• \`+${rewardLT.toLocaleString()}\` Linh Thạch\n` +
                `• \`+${rewardMKU}\` Mảnh Ký Ức\n` +
                `• \`+300\` Tu Vi` + shardBonus,
                'LUẬN ĐẠO ĐẮC THẮNG'
              );
              await ansBtn.update({ embeds: [winEmbed], components: [] });
            } else {
              const rewardLT = Math.floor(Math.random() * 4001) + 1000; // 1k - 5k
              db.addTinhKhongThach(guild.id, userId, rewardLT, 'Luận đạo dễ');
              db.addTuVi(guild.id, userId, 100);

              let shardBonus = '';
              if (Math.random() < 0.03) {
                const randomChar = CHARACTER_NAMES[Math.floor(Math.random() * CHARACTER_NAMES.length)];
                db.addManhNhanVat(guild.id, userId, randomChar, 'C', 1);
                shardBonus = `\n${EMOJIS.BUTTERFLY_PINK} **Cơ Duyên Luận Đạo:** \`+1 Mảnh C — ${randomChar}\` 🧩 (Tỉ lệ 3%)`;
              }

              const winEmbed = createManyCurielEmbed(
                client,
                `🎉 **LUẬN ĐẠO THÀNH CÔNG!** 🎉\n\n` +
                `🎁 **Phần thưởng:** \`+${rewardLT.toLocaleString()}\` Linh Thạch | \`+100\` Tu Vi` + shardBonus,
                'LUẬN ĐẠO ĐẮC THẮNG'
              );
              await ansBtn.update({ embeds: [winEmbed], components: [] });
            }
          } else {
            const failEmbed = createManyCurielEmbed(
              client,
              `💔 **LUẬN ĐẠO CHƯA ĐẠT!**\n\n` +
              `Đáp án chính xác là: **${correctText}**\n` +
              `Hãy tiếp tục tu dưỡng đạo tâm để tái ngộ lần sau!`,
              'LUẬN ĐẠO THẤT BẠI'
            );
            await ansBtn.update({ embeds: [failEmbed], components: [] });
          }
        });
      });

      return;
    }

    // 9.2 Mtimmay (MINI GAME TÌM MÂY)
    if (cmd === 'timmay') {
      await handleTimMayCommand(message, client, args);
      return;
    }

    if (cmd === 'nhan' || cmd === 'nhanthuong' || cmd === 'dung' || cmd === 'chotlai') {
      await handleCashOutCommand(message, client);
      return;
    }

    // 10. Mdiemdanh (Điểm Danh Hàng Ngày)
    if (cmd === 'diemdanh') {
      const user = db.getOrCreateUser(guild.id, userId, message.author.username);
      const now = Date.now();
      const COOLDOWN_MS = 24 * 60 * 60 * 1000;

      if (user.daily_last) {
        const lastTime = new Date(user.daily_last).getTime();
        const diff = now - lastTime;
        if (diff < COOLDOWN_MS) {
          const remainingMs = COOLDOWN_MS - diff;
          const hours = Math.floor(remainingMs / (1000 * 60 * 60));
          const mins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

          const embed = createManyCurielEmbed(
            client,
            `${EMOJIS.PBEAR} <@${userId}>, hôm nay đạo hữu đã điểm danh rồi!\n\n` +
            `${EMOJIS.STAR_BLUE} Vui lòng chờ thêm **${hours} giờ ${mins} phút** để tiếp tục nhận linh thạch.`,
            `${EMOJIS.SPARKLE_FX} ĐIỂM DANH HÀNG NGÀY`
          );
          await message.reply({ embeds: [embed] });
          return;
        }
      }

      const rewardTKT = Math.floor(Math.random() * 1000) + 1000;
      const rewardTuVi = 250;
      const rewardDCH = 50;

      user.daily_streak += 1;
      user.daily_last = new Date().toISOString();
      user.tinh_khong_thach += rewardTKT;
      user.tu_vi += rewardTuVi;
      user.diem_cong_hien += rewardDCH;
      user.updated_at = new Date().toISOString();

      db.updateUser(guild.id, userId, {
        daily_last: user.daily_last,
        daily_streak: user.daily_streak,
        tinh_khong_thach: user.tinh_khong_thach,
        tu_vi: user.tu_vi,
        diem_cong_hien: user.diem_cong_hien
      });

      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.HEART_PINK} **ĐIỂM DANH THÀNH CÔNG (Chuỗi: ${user.daily_streak} ngày)**\n\n` +
        `${EMOJIS.STAR_BLUE} **Linh Thạch:** \`+${rewardTKT.toLocaleString()}\` Linh Thạch\n` +
        `${EMOJIS.BUTTERFLY_DX} **Tu Vi:** \`+${rewardTuVi}\` EXP\n` +
        `${EMOJIS.CROWN} **Điểm Cống Hiến:** \`+${rewardDCH}\` điểm\n\n` +
        `${EMOJIS.STRAWBERRY} **Tổng Linh Thạch hiện có:** \`${user.tinh_khong_thach.toLocaleString()}\``,
        `${EMOJIS.SPARKLE_FX} THU HOẠCH LINH NGUYÊN`
      );

      await message.reply({ embeds: [embed] });
      return;
    }

    // 11. Mbxh (BẢNG XẾP HẠNG: Phong Thần, Phú Hào, Sưu Tập, Tu Vi, Sư Phụ)
    if (cmd === 'bxh') {
      await handleBxhCommands(message, client, args);
      return;
    }

    // 12. Mtruanam (Quyền Lực Độ Kiếp)
    if (cmd === 'truanam') {
      const user = db.getOrCreateUser(guild.id, userId);
      if (user.realm !== 'Độ Kiếp') {
        const embed = createManyCurielEmbed(
          client,
          `⛔ Chiêu thức \`Mtruanam\` chỉ dành riêng cho tu sĩ đạt cảnh giới tối cao **[Độ Kiếp]**!`,
          'CHƯA ĐỦ CẢNH GIỚI'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const targetMember = message.mentions.members?.first();
      if (!targetMember) {
        const embed = createManyCurielEmbed(client, '⚠️ **Cú pháp:** `Mtruanam @user`', 'TRỪNG PHẠT TU SĨ');
        await message.reply({ embeds: [embed] });
        return;
      }

      await targetMember.timeout(60 * 1000, 'Bị Thái Thượng Trưởng Lão trừng phạt Mtruanam');
      const embed = createManyCurielEmbed(
        client,
        `⚡ Thái Thượng Trưởng Lão <@${userId}> đã giáng thiên lôi trừng phạt <@${targetMember.id}> (Timeout 1 phút)!`,
        'THẦN UY ĐỘ KIẾP'
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 13. Maddstaff / Maddmod (Dành cho Quản Lý và Owner)
    if (cmd === 'addstaff' || cmd === 'addmod') {
      if (!isQuanLy(userId) && !isOwner(userId)) {
        const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
        await message.reply({ embeds: [embed] });
        return;
      }

      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        const embed = createManyCurielEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`Maddstaff @user\``, `${EMOJIS.CROWN} THÊM STAFF`);
        await message.reply({ embeds: [embed] });
        return;
      }

      db.addStaff(targetUser.id, userId, targetUser.username);
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.CROWN} Đã cấp quyền **Staff** thành công cho <@${targetUser.id}> (\`${targetUser.username}\`) và lưu trữ vào Database!`,
        `${EMOJIS.SPARKLE_FX} BỔ NHIỆM STAFF`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 14. Mquanly (Bảng Lệnh Quản Lý)
    if (cmd === 'quanly') {
      if (!isQuanLy(userId) && !isOwner(userId)) {
        const embed = createPermissionDeniedEmbed(client, message.author, 'QUAN_LY');
        await message.reply({ embeds: [embed] });
        return;
      }

      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.CROWN} **DANH SÁCH LỆNH QUẢN LÝ (TIỀN TỐ: M):**\n\n` +
        `${EMOJIS.STAR_BLUE} \`Maddstaff @user\`: Thêm thành viên vào danh sách Staff\n` +
        `${EMOJIS.STAR_BLUE} \`Mbovp <sản_phẩm>\`: Xóa vật phẩm khỏi cửa hàng\n` +
        `${EMOJIS.STAR_BLUE} \`Mcam @user <thời_gian>\`: Cấm người chơi sử dụng Bot (30S, 10P, 2H)\n` +
        `${EMOJIS.STAR_BLUE} \`Mbocam @user\`: Bỏ cấm người chơi sử dụng Bot\n` +
        `${EMOJIS.STAR_BLUE} \`Mphatqua @user <số_lượng>\`: Phát quà Linh Thạch\n` +
        `${EMOJIS.STAR_PINK} \`/setupkenhchoi\`: Thiết lập kênh chơi chính\n` +
        `${EMOJIS.STAR_PINK} \`/setuprolet1\`: Thiết lập Role Top 1 BXH 7 ngày\n` +
        `${EMOJIS.STAR_PINK} \`/setupkenhan\`: Thiết lập Kênh Ẩn cho Kim Đan\n` +
        `${EMOJIS.STAR_PINK} \`/setuproletttl\`: Thiết lập Role Thái Thượng Trưởng Lão (Độ Kiếp)`,
        `${EMOJIS.CROWN} BẢNG ĐIỀU KHIỂN QUẢN LÝ`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 15. Mcam @user <thời_gian>
    if (cmd === 'cam') {
      if (!isStaff(userId) && !isQuanLy(userId) && !isOwner(userId)) {
        const embed = createPermissionDeniedEmbed(client, message.author, 'STAFF');
        await message.reply({ embeds: [embed] });
        return;
      }

      const targetUser = message.mentions.users.first();
      const timeStr = args[1]?.toUpperCase();

      if (!targetUser || !timeStr) {
        const embed = createManyCurielEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Mcam @user <thời_gian>\`\n` +
          `${EMOJIS.STAR_BLUE} Đơn vị: \`S\` = giây, \`P\` = phút, \`H\` = giờ\n` +
          `${EMOJIS.STAR_BLUE} Ví dụ: \`Mcam @user 30S\` hoặc \`Mcam @user 10P\` hoặc \`Mcam @user 2H\``,
          `${EMOJIS.PRAY} CẤM SỬ DỤNG BOT`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      let durationMs = 10 * 60 * 1000;
      if (timeStr.endsWith('S')) durationMs = parseInt(timeStr, 10) * 1000;
      else if (timeStr.endsWith('P') || timeStr.endsWith('M')) durationMs = parseInt(timeStr, 10) * 60 * 1000;
      else if (timeStr.endsWith('H')) durationMs = parseInt(timeStr, 10) * 3600 * 1000;

      if (isNaN(durationMs) || durationMs <= 0) {
        const embed = createManyCurielEmbed(client, `${EMOJIS.PRAY} Thời gian không hợp lệ! Ví dụ: \`30S\`, \`10P\`, \`2H\``, `${EMOJIS.PRAY} LỖI THỜI GIAN`);
        await message.reply({ embeds: [embed] });
        return;
      }

      db.banBotUser(targetUser.id, guild.id, durationMs, 'Vi phạm quy định bot', userId);
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.PRAY} Đã cấm <@${targetUser.id}> sử dụng Bot trong **${timeStr}**.\n*Người bị cấm không thể tương tác với bot.*`,
        `${EMOJIS.PRAY} ĐÃ CẤM DÙNG BOT`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 16. Mbocam @user
    if (cmd === 'bocam') {
      if (!isStaff(userId) && !isQuanLy(userId) && !isOwner(userId)) {
        const embed = createPermissionDeniedEmbed(client, message.author, 'STAFF');
        await message.reply({ embeds: [embed] });
        return;
      }

      const targetUser = message.mentions.users.first();
      if (!targetUser) {
        const embed = createManyCurielEmbed(client, `${EMOJIS.PBEAR} **Cú pháp:** \`Mbocam @user\``, `${EMOJIS.SPARKLE_FX} GỠ CẤM DÙNG BOT`);
        await message.reply({ embeds: [embed] });
        return;
      }

      const unbanned = db.unbanBotUser(targetUser.id, guild.id);
      db.resetViolation(guild.id, targetUser.id);

      const embed = createManyCurielEmbed(
        client,
        unbanned 
          ? `${EMOJIS.SPARKLE_FX} Đã gỡ lệnh cấm sử dụng Bot cho <@${targetUser.id}>. Thành viên có thể dùng lệnh bình thường.`
          : `${EMOJIS.STAR_BLUE} <@${targetUser.id}> hiện không có trong danh sách bị cấm dùng bot.`,
        `${EMOJIS.SPARKLE_FX} BỎ CẤM SỬ DỤNG BOT`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 17. Mphatqua @user <số lượng> (Dành cho Staff và Quản Lý)
    if (cmd === 'phatqua' || cmd === 'phattien') {
      if (!isStaff(userId) && !isQuanLy(userId) && !isOwner(userId)) {
        const embed = createPermissionDeniedEmbed(client, message.author, 'STAFF');
        await message.reply({ embeds: [embed] });
        return;
      }

      const targetUser = message.mentions.users.first();
      const amount = parseInt(args[1], 10);

      if (!targetUser || isNaN(amount) || amount <= 0) {
        const embed = createManyCurielEmbed(
          client,
          `${EMOJIS.PBEAR} **Cú pháp:** \`Mphatqua @user <số_lượng>\`\nVí dụ: \`Mphatqua @TuSi 5000\``,
          `${EMOJIS.CROWN} PHÁT QUÀ TINH KHÔNG THẠCH`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const updated = db.addTinhKhongThach(guild.id, targetUser.id, amount, `Phát quà bởi ${message.author.tag}`);
      const embed = createManyCurielEmbed(
        client,
        `${EMOJIS.BOW_PINK} **Ban Quản Trị** đã phát tặng **${amount.toLocaleString()} Linh Thạch** cho <@${targetUser.id}>!\n\n` +
        `${EMOJIS.STAR_BLUE} **Số dư mới:** \`${updated.tinh_khong_thach.toLocaleString()}\` Linh Thạch`,
        `${EMOJIS.SPARKLE_FX} PHÁT QUÀ THÀNH CÔNG`
      );
      await message.reply({ embeds: [embed] });
      return;
    }

    // 18. Mxemthuvien (Xem tất cả các ảnh của các nhân vật mà người chơi đã sưu tập được)
    if (cmd === 'xemthuvien' || cmd === 'allthuvien') {
      const owned = db.getAllOwnedPhotos(guild.id, userId);

      if (owned.length === 0) {
        const embed = createManyCurielEmbed(
          client,
          `🖼️ <@${userId}> hiện tại **chưa sở hữu bức ảnh nào** trong Thư viện ảnh!\n\n` +
          `• Hãy đạt **1.000 Hảo Cảm** với nhân vật để nhận ảnh phần thưởng độc quyền hoặc thu thập thẻ C, B, A, S.\n` +
          `• Dùng lệnh \`Mxemthuvien\` hoặc \`Mthuvien\` để chiêm ngưỡng bất cứ lúc nào!`,
          'THƯ VIỆN ẢNH TRỐNG'
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      const allPhotosList = owned.map((p, idx) => ({
        charName: p.charName,
        label: p.label,
        url: p.url,
        index: idx + 1,
        total: owned.length
      }));

      let currentPhotoIdx = 0;

      const buildAllPhotosPayload = (idx: number) => {
        const item = allPhotosList[idx];
        const embed = createManyCurielEmbed(
          client,
          `🏛️ **TẤT CẢ ẢNH ĐÃ SƯU TẬP CỦA BẠN** 📸\n\n` +
          `👤 **Người sở hữu:** <@${userId}>\n` +
          `🌸 **Nhân vật:** **${item.charName}**\n` +
          `✨ **Phân loại:** \`${item.label}\`\n` +
          `🖼️ **Ảnh:** \`[${item.index} / ${item.total}]\`\n\n` +
          `👉 *Sử dụng các nút ◀️ và ▶️ bên dưới để duyệt qua tất cả ảnh!*`,
          'THƯ VIỆN ẢNH TỔNG HỢP'
        );
        embed.setImage(item.url);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`btn_allphotos_prev_${userId}`)
            .setLabel('◀️ Trang trước')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(idx === 0),
          new ButtonBuilder()
            .setCustomId(`btn_allphotos_next_${userId}`)
            .setLabel('Trang sau ▶️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(idx === allPhotosList.length - 1)
        );

        return { embeds: [embed], components: [row] };
      };

      const initialPayload = buildAllPhotosPayload(currentPhotoIdx);
      const photoMsg = await message.reply(initialPayload);

      const collector = photoMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000
      });

      collector.on('collect', async i => {
        if (i.user.id !== userId) {
          await i.reply({
            content: '❌ Bạn không có quyền sử dụng thư viện ảnh của người khác! Chỉ người dùng lệnh mới có quyền sử dụng nút lướt và xem thư viện của mình.',
            ephemeral: true
          });
          return;
        }

        if (i.customId === `btn_allphotos_prev_${userId}` && currentPhotoIdx > 0) {
          currentPhotoIdx--;
        } else if (i.customId === `btn_allphotos_next_${userId}` && currentPhotoIdx < allPhotosList.length - 1) {
          currentPhotoIdx++;
        }

        await i.update(buildAllPhotosPayload(currentPhotoIdx));
      });

      collector.on('end', async () => {
        try {
          const finalPayload = buildAllPhotosPayload(currentPhotoIdx);
          for (const row of finalPayload.components) {
            row.components.forEach(cmp => cmp.setDisabled(true));
          }
          await photoMsg.edit({ components: finalPayload.components }).catch(() => null);
        } catch {
          // Ignore
        }
      });

      return;
    }

    // 19. Mthuvien (Thư viện ảnh của bạn - Nút chọn nhân vật đã có ảnh, rồi hiện nút < và > chuyển trang)
    if (cmd === 'thuvien' || cmd === 'gallery') {
      const ownedChars = db.getOwnedPhotoCharacters(guild.id, userId);

      if (ownedChars.length === 0) {
        const embed = createManyCurielEmbed(
          client,
          `Hiện thư viện chưa có ảnh`,
          `CHÀO MỪNG ĐẾN VỚI THƯ VIỆN ẢNH CỦA BẠN`
        );
        await message.reply({ embeds: [embed] });
        return;
      }

      let selectedCharIdx = 0;
      let photoPageIdx = 0;

      const buildGalleryPayload = (cIdx: number, pIdx: number) => {
        const charName = ownedChars[cIdx];
        const photos = db.getCharacterGalleryPhotos(guild.id, userId, charName);
        const curPhoto = photos[pIdx] || photos[0];

        const embed = createManyCurielEmbed(
          client,
          `${EMOJIS.ELYS_BLING7} **Nhân vật:** **${charName}**\n` +
          `${EMOJIS.LAP_LANH} **Phân loại:** \`${curPhoto?.label || 'Ảnh Sưu Tập'}\`\n` +
          `${EMOJIS.BLUE_HEART_3} **Trang ảnh:** \`[${pIdx + 1} / ${photos.length}]\`\n\n` +
          `${EMOJIS.KIREI_STAR_BLUE} **Nhân vật sở hữu ảnh:** ${ownedChars.map((c, i) => i === cIdx ? `**[${c}]**` : c).join(' • ')}\n\n` +
          `👉 *Bấm 2 nút \`<\` và \`>\` để chuyển trang ảnh, hoặc ấn vào nhân vật khác bên dưới để xem ảnh của họ!*`,
          `CHÀO MỪNG ĐẾN VỚI THƯ VIỆN ẢNH CỦA BẠN`
        );

        if (curPhoto?.url) {
          embed.setImage(curPhoto.url);
        }

        const rows: ActionRowBuilder<ButtonBuilder>[] = [];

        // 1. Dòng 2 nút < và > chuyển trang ảnh theo yêu cầu (chỉ người dùng lệnh mới dùng được)
        const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`btn_lib_prev_${userId}`)
            .setLabel('<')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pIdx === 0),
          new ButtonBuilder()
            .setCustomId(`btn_lib_page_info_${userId}`)
            .setLabel(`${pIdx + 1}/${photos.length}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId(`btn_lib_next_${userId}`)
            .setLabel('>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(pIdx >= photos.length - 1)
        );
        rows.push(navRow);

        // 2. Dòng các nút về các nhân vật người chơi ĐÃ SỞ HỮU ẢNH (lưu ý chỉ hiện nhân vật có ảnh thật)
        const charButtons = ownedChars.slice(0, 10).map((name, i) => {
          return new ButtonBuilder()
            .setCustomId(`btn_lib_char_${userId}_${i}`)
            .setLabel(name.length > 20 ? name.substring(0, 18) + '..' : name)
            .setStyle(i === cIdx ? ButtonStyle.Success : ButtonStyle.Secondary);
        });

        for (let i = 0; i < charButtons.length; i += 5) {
          const chunk = charButtons.slice(i, i + 5);
          rows.push(new ActionRowBuilder<ButtonBuilder>().addComponents(chunk));
        }

        return { embeds: [embed], components: rows };
      };

      const initialGallery = buildGalleryPayload(selectedCharIdx, photoPageIdx);
      const galleryMsg = await message.reply(initialGallery);

      const collector = galleryMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000
      });

      collector.on('collect', async i => {
        if (i.user.id !== userId) {
          await i.reply({
            content: '❌ Bạn không có quyền sử dụng thư viện ảnh của người khác! Chỉ người dùng lệnh mới có quyền sử dụng nút lướt và xem thư viện của mình.',
            ephemeral: true
          });
          return;
        }

        const currentPhotos = db.getCharacterGalleryPhotos(guild.id, userId, ownedChars[selectedCharIdx]);

        if (i.customId === `btn_lib_prev_${userId}`) {
          if (photoPageIdx > 0) photoPageIdx--;
        } else if (i.customId === `btn_lib_next_${userId}`) {
          if (photoPageIdx < currentPhotos.length - 1) photoPageIdx++;
        } else if (i.customId.startsWith(`btn_lib_char_${userId}_`)) {
          const nextCIdx = parseInt(i.customId.replace(`btn_lib_char_${userId}_`, ''), 10);
          if (!isNaN(nextCIdx) && nextCIdx >= 0 && nextCIdx < ownedChars.length) {
            selectedCharIdx = nextCIdx;
            photoPageIdx = 0;
          }
        }

        await i.update(buildGalleryPayload(selectedCharIdx, photoPageIdx));
      });

      collector.on('end', async () => {
        try {
          const finalPayload = buildGalleryPayload(selectedCharIdx, photoPageIdx);
          for (const row of finalPayload.components) {
            row.components.forEach(cmp => cmp.setDisabled(true));
          }
          await galleryMsg.edit({ components: finalPayload.components }).catch(() => null);
        } catch {
          // Ignore
        }
      });

      return;
    }

    // 20. Mdoi / Mquydoi (Bảng Đổi Các Đơn Vị & Tài Nguyên Tu Tiên)
    if (cmd === 'doi' || cmd === 'quydoi' || cmd === 'doivp' || cmd === 'doitien') {
      let selectedChar: string = (CHARACTER_NAMES[0] as string);
      const user = db.getOrCreateUser(guild.id, userId, message.author.username);
      if (user.su_phu) {
        selectedChar = user.su_phu;
      }

      const buildDoiPayload = (charName: string) => {
        const u = db.getOrCreateUser(guild.id, userId, message.author.username);
        const manh = db.getManhNhanVat(guild.id, userId, charName);

        const desc = `${EMOJIS.ELYS_BLING7} **BẢNG QUY ĐỔI ĐƠN VỊ & TÀI NGUYÊN TU TIÊN** ${EMOJIS.ELYS_BLING7}\n\n` +
          `${EMOJIS.HACHI} **Đạo hữu:** <@${userId}>\n` +
          `${EMOJIS.BLUE_JELLYFISH} **Nhân vật nhận mảnh thẻ:** **${charName}**\n\n` +
          `${EMOJIS.ELITE} **Tài nguyên hiện có:**\n` +
          `• ${EMOJIS.BLUE_HEART_3} **Điểm Cống Hiến:** \`${u.diem_cong_hien.toLocaleString()}\` điểm\n` +
          `• ${EMOJIS.LINH_THACH} **Linh Thạch:** \`${u.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n` +
          `• ${EMOJIS.MANH_KY_UC} **Mảnh Ký Ức:** \`${u.manh_ky_uc.toLocaleString()}\` mảnh\n` +
          `• ${EMOJIS.KAWAII_STAR_BLUE} **Mảnh thẻ ${charName}:** B: \`${manh.B}\` | A: \`${manh.A}\` | S: \`${manh.S}\`\n\n` +
          `${EMOJIS.KEAI_SVB_HEART_1} **CÁC CÔNG THỨC QUY ĐỔI:**\n` +
          `1️⃣ **10 Điểm Cống Hiến** ➔ **2 Mảnh Ký Ức** ${EMOJIS.MANH_KY_UC}\n` +
          `2️⃣ **10 Điểm Cống Hiến** ➔ **5 Mảnh Thẻ B** *(${charName})*\n` +
          `3️⃣ **10 Điểm Cống Hiến** ➔ **2 Mảnh Thẻ A** *(${charName})*\n` +
          `4️⃣ **100.000 Linh Thạch** ${EMOJIS.LINH_THACH} ➔ **1 Mảnh Thẻ S** *(${charName})*\n` +
          `5️⃣ **100 Mảnh Ký Ức** ${EMOJIS.MANH_KY_UC} ➔ **5 Mảnh Thẻ S** *(${charName})*\n\n` +
          `👉 *Chọn nhân vật muốn đổi mảnh ở Menu, sau đó bấm nút đổi bên dưới!*`;

        const embed = createManyCurielEmbed(client, desc, 'BẢNG QUY ĐỔI TÀI NGUYÊN');

        // Select menu chọn nhân vật (phần 1: 25 nhân vật đầu)
        const charSelect = new StringSelectMenuBuilder()
          .setCustomId(`select_doi_char_${userId}`)
          .setPlaceholder(`🌸 Chọn nhân vật nhận mảnh thẻ (Hiện tại: ${charName})...`)
          .addOptions(
            CHARACTER_NAMES.slice(0, 25).map(name =>
              new StringSelectMenuOptionBuilder()
                .setLabel(name)
                .setValue(name)
                .setDefault(name === charName)
            )
          );

        const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(charSelect);

        // Nút bấm quy đổi
        const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_doi_dch_mku')
            .setLabel('10 DCH ➔ 2 Ký Ức')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('btn_doi_dch_mb')
            .setLabel('10 DCH ➔ 5 Mảnh B')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('btn_doi_dch_ma')
            .setLabel('10 DCH ➔ 2 Mảnh A')
            .setStyle(ButtonStyle.Success)
        );

        const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_doi_lt_ms')
            .setLabel('100k LT ➔ 1 Mảnh S')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('btn_doi_mku_ms')
            .setLabel('100 Ký Ức ➔ 5 Mảnh S')
            .setStyle(ButtonStyle.Secondary)
        );

        return { embeds: [embed], components: [selectRow, row1, row2] };
      };

      const initialPayload = buildDoiPayload(selectedChar);
      const doiMsg = await message.reply(initialPayload);

      const collector = doiMsg.createMessageComponentCollector({
        time: 180000
      });

      collector.on('collect', async i => {
        if (i.user.id !== userId) {
          await i.reply({
            content: '❌ Bạn không thể đổi trên bảng tài nguyên của người khác! Hãy gõ `Mdoi` để mở bảng riêng.',
            ephemeral: true
          });
          return;
        }

        // Chọn nhân vật
        if (i.isStringSelectMenu() && i.customId.startsWith('select_doi_char_')) {
          selectedChar = i.values[0] || selectedChar;
          await i.update(buildDoiPayload(selectedChar));
          return;
        }

        if (!i.isButton()) return;

        const u = db.getOrCreateUser(guild.id, userId, message.author.username);

        // 1. 10 điểm cống hiến = 2 mảnh ký ức
        if (i.customId === 'btn_doi_dch_mku') {
          if (u.diem_cong_hien < 10) {
            await i.reply({
              content: `⚠️ Đạo hữu không đủ Điểm Cống Hiến! Hiện có: \`${u.diem_cong_hien}\` (Cần: 10 DCH).`,
              ephemeral: true
            });
            return;
          }
          u.diem_cong_hien -= 10;
          u.manh_ky_uc += 2;
          db.updateUser(guild.id, userId, {
            diem_cong_hien: u.diem_cong_hien,
            manh_ky_uc: u.manh_ky_uc
          });
          db.save();
          await i.reply({
            content: `✅ Đã đổi thành công **10 Điểm Cống Hiến** lấy **2 Mảnh Ký Ức**! (Hiện có: \`${u.manh_ky_uc}\` Mảnh Ký Ức)`,
            ephemeral: true
          });
          await doiMsg.edit(buildDoiPayload(selectedChar)).catch(() => null);
          return;
        }

        // 2. 10 điểm cống hiến = 5 mảnh B
        if (i.customId === 'btn_doi_dch_mb') {
          if (u.diem_cong_hien < 10) {
            await i.reply({
              content: `⚠️ Đạo hữu không đủ Điểm Cống Hiến! Hiện có: \`${u.diem_cong_hien}\` (Cần: 10 DCH).`,
              ephemeral: true
            });
            return;
          }
          u.diem_cong_hien -= 10;
          db.updateUser(guild.id, userId, { diem_cong_hien: u.diem_cong_hien });
          const newAmount = db.addManhNhanVat(guild.id, userId, selectedChar, 'B', 5);
          await i.reply({
            content: `✅ Đã đổi thành công **10 Điểm Cống Hiến** lấy **5 Mảnh Thẻ B (${selectedChar})**! (Hiện có: \`${newAmount}\` Mảnh B)`,
            ephemeral: true
          });
          await doiMsg.edit(buildDoiPayload(selectedChar)).catch(() => null);
          return;
        }

        // 3. 10 điểm cống hiến = 2 mảnh A
        if (i.customId === 'btn_doi_dch_ma') {
          if (u.diem_cong_hien < 10) {
            await i.reply({
              content: `⚠️ Đạo hữu không đủ Điểm Cống Hiến! Hiện có: \`${u.diem_cong_hien}\` (Cần: 10 DCH).`,
              ephemeral: true
            });
            return;
          }
          u.diem_cong_hien -= 10;
          db.updateUser(guild.id, userId, { diem_cong_hien: u.diem_cong_hien });
          const newAmount = db.addManhNhanVat(guild.id, userId, selectedChar, 'A', 2);
          await i.reply({
            content: `✅ Đã đổi thành công **10 Điểm Cống Hiến** lấy **2 Mảnh Thẻ A (${selectedChar})**! (Hiện có: \`${newAmount}\` Mảnh A)`,
            ephemeral: true
          });
          await doiMsg.edit(buildDoiPayload(selectedChar)).catch(() => null);
          return;
        }

        // 4. 100.000 linh thạch = 1 mảnh S
        if (i.customId === 'btn_doi_lt_ms') {
          if (u.tinh_khong_thach < 100000) {
            await i.reply({
              content: `⚠️ Đạo hữu không đủ Linh Thạch! Hiện có: \`${u.tinh_khong_thach.toLocaleString()}\` (Cần: 100.000 Linh Thạch).`,
              ephemeral: true
            });
            return;
          }
          u.tinh_khong_thach -= 100000;
          db.updateUser(guild.id, userId, { tinh_khong_thach: u.tinh_khong_thach });
          const newAmount = db.addManhNhanVat(guild.id, userId, selectedChar, 'S', 1);
          await i.reply({
            content: `✅ Đã đổi thành công **100.000 Linh Thạch** lấy **1 Mảnh Thẻ S (${selectedChar})**! (Hiện có: \`${newAmount}\` Mảnh S)`,
            ephemeral: true
          });
          await doiMsg.edit(buildDoiPayload(selectedChar)).catch(() => null);
          return;
        }

        // 5. 100 mảnh ký ức = 5 mảnh S
        if (i.customId === 'btn_doi_mku_ms') {
          if (u.manh_ky_uc < 100) {
            await i.reply({
              content: `⚠️ Đạo hữu không đủ Mảnh Ký Ức! Hiện có: \`${u.manh_ky_uc}\` (Cần: 100 Mảnh Ký Ức).`,
              ephemeral: true
            });
            return;
          }
          u.manh_ky_uc -= 100;
          db.updateUser(guild.id, userId, { manh_ky_uc: u.manh_ky_uc });
          const newAmount = db.addManhNhanVat(guild.id, userId, selectedChar, 'S', 5);
          await i.reply({
            content: `✅ Đã đổi thành công **100 Mảnh Ký Ức** lấy **5 Mảnh Thẻ S (${selectedChar})**! (Hiện có: \`${newAmount}\` Mảnh S)`,
            ephemeral: true
          });
          await doiMsg.edit(buildDoiPayload(selectedChar)).catch(() => null);
          return;
        }
      });

      return;
    }

  } catch (error: any) {
    console.error(`[COMMAND ERROR]\nUser ID: ${userId}\nGuild ID: ${guild.id}\nCommand: M${commandName}\nError:`, error);
    const errorEmbed = createErrorEmbed(client, '❌ Đã xảy ra lỗi khi xử lý.');
    await message.reply({ embeds: [errorEmbed] }).catch(() => null);
  }
}
