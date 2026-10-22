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
import { createManyCurielEmbed, EMOJIS } from '../../utils/embeds.js';

export interface ShopProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  desc: string;
  emoji: string;
}

export const SHOP_CATEGORIES = [
  { id: 'vukhi', name: 'Vũ Khí', emoji: '🗡️', desc: 'Khu vực bán kiếm và binh khí tăng sát thương.' },
  { id: 'danduoc', name: 'Đan Dược', emoji: '💊', desc: 'Khu vực bán đan dược hồi phục và bảo mệnh.' },
  { id: 'quatang', name: 'Quà Tặng', emoji: '🎁', desc: 'Khu vực bán các sản phẩm tặng Sư phụ vun đắp hảo cảm.' },
  { id: 'giap', name: 'Giáp', emoji: '🛡️', desc: 'Khu vực bán giáp phòng ngự và đồ bảo vệ.' },
  { id: 'bua', name: 'Bùa', emoji: '📜', desc: 'Khu vực bán bùa chú may mắn gia tăng tỷ lệ thăng cấp.' },
  { id: 'linhthu', name: 'Linh Thú', emoji: '🐾', desc: 'Khu vực bán các linh thú hỗ trợ thu thập linh thạch.' }
];

export const SHOP_PRODUCTS: Record<string, ShopProduct[]> = {
  vukhi: [
    { id: 'kiem_sat', name: 'Kiếm Sắt', price: 15000, category: 'Vũ Khí', desc: 'Tăng +15 sát thương khi chiến đấu quái thú và Boss.', emoji: '🗡️' },
    { id: 'kiem_vang', name: 'Kiếm Vàng', price: 20000, category: 'Vũ Khí', desc: 'Tăng +20 sát thương cực mạnh trong mọi trận đánh.', emoji: '⚔️' }
  ],
  danduoc: [
    { id: 'truong_sinh_dan', name: 'Trường Sinh Sinh Đan', price: 70000, category: 'Đan Dược', desc: 'HP luôn đầy toàn vẹn trong 3 ván chiến đấu tiếp theo.', emoji: '💊' }
  ],
  quatang: [
    { id: 'hoa_hong', name: 'Hoa hồng', price: 5000, category: 'Quà Tặng', desc: 'Thích: +10 Hảo Cảm | Ghét: -15 Hảo Cảm.', emoji: '🌹' },
    { id: 'bo_hoa', name: 'Bó hoa', price: 20000, category: 'Quà Tặng', desc: 'Thích: +20 Hảo Cảm | Ghét: -20 Hảo Cảm.', emoji: '💐' },
    { id: 'ngoc_boi', name: 'Ngọc bội', price: 50000, category: 'Quà Tặng', desc: 'Thích: +45 Hảo Cảm | Ghét: -50 Hảo Cảm.', emoji: '💎' },
    { id: 'nhan_doi', name: 'Nhẫn đôi', price: 100000, category: 'Quà Tặng', desc: 'Thích: +110 Hảo Cảm | Ghét: -105 Hảo Cảm.', emoji: '💍' },
    { id: 'keo_deo', name: 'Kẹo dẻo', price: 10000, category: 'Quà Tặng', desc: 'Thích: +15 Hảo Cảm | Ghét: -10 Hảo Cảm.', emoji: '🍬' },
    { id: 'khan_len', name: 'Khăn len tự tay đan', price: 35000, category: 'Quà Tặng', desc: 'Thích: +40 Hảo Cảm | Ghét: -40 Hảo Cảm.', emoji: '🧣' },
    { id: 'tui_thom', name: 'Túi thơm', price: 15000, category: 'Quà Tặng', desc: 'Thích: +20 Hảo Cảm | Ghét: -25 Hảo Cảm.', emoji: '🌸' }
  ],
  giap: [
    { id: 'giap_sat', name: 'Giáp Sắt', price: 30000, category: 'Giáp', desc: 'Chặn 20 sát thương mỗi đòn, tối đa 3 lần chặn.', emoji: '🛡️' }
  ],
  bua: [
    { id: 'bua_may_man', name: 'Bùa May Mắn', price: 30000, category: 'Bùa', desc: '+10% tỷ lệ thăng cấp cảnh giới.', emoji: '📜' }
  ],
  linhthu: [
    { id: 'ho_ly', name: 'Hồ Ly', price: 100000, category: 'Linh Thú', desc: 'Mỗi giờ tự động thu thập 5k - 20k Linh Thạch, +3% thăng cấp.', emoji: '🦊' }
  ]
};

// 1. Home Shop View Payload
export function createShopHomePayload(client: Client, guildId: string, userId: string) {
  const user = db.getOrCreateUser(guildId, userId);
  const cart = db.getCart(guildId, userId);
  const cartCount = cart.reduce((sum, item) => sum + item.count, 0);

  const desc = `🛒 **CỬA HÀNG TU CHÂN GIỚI — MANY CURIEL** 🛒\n\n` +
    `Chào mừng đạo hữu <@${userId}> đến với linh thị phường.\n` +
    `💎 **Linh Thạch hiện có:** \`${user.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n` +
    `🛒 **Giỏ hàng hiện tại:** \`${cartCount}\` món đồ\n\n` +
    `👉 **Hãy ấn vào nút khu vực bên dưới để mở menu đồ của phân khu tương ứng:**\n` +
    `• 🗡️ **Vũ Khí:** Kiếm sắt, kiếm vàng tăng sát thương\n` +
    `• 💊 **Đan Dược:** Trường Sinh Sinh Đan hộ mệnh\n` +
    `• 🎁 **Quà Tặng:** Hoa hồng, ngọc bội, nhẫn đôi tặng Sư phụ\n` +
    `• 🛡️ **Giáp:** Giáp sắt phòng hộ chặn sát thương\n` +
    `• 📜 **Bùa:** Bùa may mắn tăng tỉ lệ thăng cấp\n` +
    `• 🐾 **Linh Thú:** Hồ Ly thu thập tài nguyên tự động\n\n` +
    `💡 *Lưu ý: Mua hàng sẽ có 3 nút lựa chọn: Mua hàng, Không mua (Hủy), Thêm vào giỏ hàng!*`;

  const embed = createManyCurielEmbed(client, desc, 'CỬA HÀNG TU CHÂN GIỚI');

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn_cat_vukhi').setLabel('🗡️ Vũ Khí').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_cat_danduoc').setLabel('💊 Đan Dược').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('btn_cat_quatang').setLabel('🎁 Quà Tặng').setStyle(ButtonStyle.Danger)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn_cat_giap').setLabel('🛡️ Giáp').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_cat_bua').setLabel('📜 Bùa').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_cat_linhthu').setLabel('🐾 Linh Thú').setStyle(ButtonStyle.Primary)
  );

  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_view_cart')
      .setLabel(`🛒 Giỏ Hàng (${cartCount})`)
      .setStyle(ButtonStyle.Success)
  );

  return { embed, components: [row1, row2, row3] };
}

// 2. Category View Payload
export function createCategoryPayload(client: Client, guildId: string, userId: string, catId: string) {
  const cat = SHOP_CATEGORIES.find(c => c.id === catId);
  if (!cat) return createShopHomePayload(client, guildId, userId);

  const user = db.getOrCreateUser(guildId, userId);
  const products = SHOP_PRODUCTS[catId] || [];
  const hiddenProducts = db.getHiddenProducts();
  const visibleProducts = products.filter(p => !hiddenProducts.includes(p.name.toLowerCase()));

  let desc = `${cat.emoji} **CỬA HÀNG — PHÂN KHU: ${cat.name.toUpperCase()}** ${cat.emoji}\n\n` +
    `*${cat.desc}*\n\n` +
    `💎 **Linh Thạch của bạn:** \`${user.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n\n` +
    `📋 **Danh sách sản phẩm đang bán:**\n\n`;

  visibleProducts.forEach((p, idx) => {
    desc += `**${idx + 1}. ${p.emoji} ${p.name}** — \`${p.price.toLocaleString()}\` Linh Thạch\n` +
            `   └ *Công dụng:* ${p.desc}\n\n`;
  });

  if (catId === 'quatang') {
    desc += `💡 *Lưu ý nhỏ là char thích hay không là random nên không có thích hay không mặc định.*\n\n`;
  }

  desc += `👉 *Hãy bấm vào nút tên sản phẩm bên dưới để tiến hành xem chi tiết và mua hàng!*`;

  const embed = createManyCurielEmbed(client, desc, `PHÂN KHU ${cat.name.toUpperCase()}`);

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();

  visibleProducts.forEach((p, idx) => {
    if (currentRow.components.length >= 4) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<ButtonBuilder>();
    }
    currentRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_prod_${catId}_${p.id}`)
        .setLabel(`${p.emoji} ${p.name} (${(p.price / 1000)}k)`)
        .setStyle(ButtonStyle.Primary)
    );
  });

  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }

  // Navigation Row
  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('btn_shop_home').setLabel('🔙 Về Cửa Hàng').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('btn_view_cart').setLabel('🛒 Xem Giỏ Hàng').setStyle(ButtonStyle.Success)
  );
  rows.push(navRow);

  return { embed, components: rows };
}

// 3. Product View Payload with 3 Action Buttons (Mua hàng, Không mua, Thêm vào giỏ hàng)
export function createProductPayload(client: Client, guildId: string, userId: string, catId: string, prodId: string) {
  const cat = SHOP_CATEGORIES.find(c => c.id === catId);
  const products = SHOP_PRODUCTS[catId] || [];
  const prod = products.find(p => p.id === prodId);

  if (!cat || !prod) {
    return createShopHomePayload(client, guildId, userId);
  }

  const user = db.getOrCreateUser(guildId, userId);
  const canAfford = user.tinh_khong_thach >= prod.price;

  let desc = `🛍️ **CHI TIẾT VẬT PHẨM: ${prod.name.toUpperCase()}** ${prod.emoji}\n\n` +
    `• **Phân khu:** ${cat.emoji} **${cat.name}**\n` +
    `• **Giá bán niêm yết:** \`${prod.price.toLocaleString()}\` Linh Thạch\n` +
    `• **Hiệu quả / Công dụng:** ${prod.desc}\n\n` +
    `👤 **Đạo hữu:** <@${userId}>\n` +
    `💎 **Số dư hiện có:** \`${user.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n` +
    `📊 **Trạng thái:** ${canAfford ? '✅ **Đủ Linh Thạch**' : '❌ **Không đủ Linh Thạch**'}\n\n`;

  if (catId === 'quatang') {
    desc += `💡 *Lưu ý nhỏ là char thích hay không là random nên không có thích hay không mặc định.*\n\n`;
  }

  desc += `👉 **Vui lòng chọn 1 trong 3 thao tác bên dưới:**\n` +
          `• 💳 **Mua Hàng:** Trừ Linh Thạch và nhận ngay vào túi đồ / ví.\n` +
          `• ❌ **Không Mua:** Hủy giao dịch và quay về menu khu vực.\n` +
          `• 🛒 **Thêm Vào Giỏ Hàng:** Lưu vào giỏ hàng (bot không tự ý bỏ sản phẩm).`;

  const embed = createManyCurielEmbed(client, desc, 'XÁC NHẬN MUA SẮM');

  // 3 Action Buttons as required
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_action_buy_${catId}_${prod.id}`)
      .setLabel('💳 Mua Hàng')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`btn_action_cancel_${catId}`)
      .setLabel('❌ Không Mua')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`btn_action_addcart_${catId}_${prod.id}`)
      .setLabel('🛒 Thêm Vào Giỏ Hàng')
      .setStyle(ButtonStyle.Primary)
  );

  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_cat_${catId}`)
      .setLabel(`🔙 Quay Lại Khu Vực ${cat.name}`)
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, components: [actionRow, navRow] };
}

// 4. Cart View Payload
export function createCartPayload(client: Client, guildId: string, userId: string) {
  const user = db.getOrCreateUser(guildId, userId);
  const cart = db.getCart(guildId, userId);
  const totalCost = cart.reduce((sum, i) => sum + (i.price * i.count), 0);
  const totalCount = cart.reduce((sum, i) => sum + i.count, 0);

  let desc = `🛒 **GIỎ HÀNG TU TIÊN CỦA** <@${userId}> 🛒\n\n` +
    `💎 **Linh Thạch của bạn:** \`${user.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n\n`;

  if (cart.length === 0) {
    desc += `*(Giỏ hàng của đạo hữu hiện đang trống. Hãy vào các khu vực để thêm vật phẩm vào giỏ!)*\n\n`;
  } else {
    desc += `📦 **Danh sách vật phẩm trong giỏ (${totalCount} món):**\n\n`;
    cart.forEach((item, idx) => {
      desc += `**${idx + 1}. ${item.name}** (x${item.count})\n` +
              `   └ Giá: \`${item.price.toLocaleString()}\` LT/món — Thành tiền: \`${(item.price * item.count).toLocaleString()}\` Linh Thạch\n`;
    });
    desc += `\n💰 **TỔNG TIỀN THANH TOÁN:** \`${totalCost.toLocaleString()}\` Linh Thạch\n` +
            `📊 **Trạng thái:** ${user.tinh_khong_thach >= totalCost ? '✅ **Đủ Linh Thạch để mua**' : '❌ **Không đủ Linh Thạch**'}\n\n`;
  }

  desc += `📌 *Bot không bao giờ tự ý xóa các sản phẩm đạo hữu đã thêm vào giỏ hàng.*`;

  const embed = createManyCurielEmbed(client, desc, 'GIỎ HÀNG CỦA BẠN');

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const actionRow = new ActionRowBuilder<ButtonBuilder>();

  if (cart.length > 0) {
    actionRow.addComponents(
      new ButtonBuilder()
        .setCustomId('btn_cart_checkout')
        .setLabel(`💳 Mua Tất Cả (${totalCost.toLocaleString()} LT)`)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('btn_cart_clear')
        .setLabel('🗑️ Xóa Giỏ Hàng')
        .setStyle(ButtonStyle.Danger)
    );
  }

  actionRow.addComponents(
    new ButtonBuilder()
      .setCustomId('btn_shop_home')
      .setLabel('🔙 Về Cửa Hàng')
      .setStyle(ButtonStyle.Secondary)
  );

  rows.push(actionRow);

  return { embed, components: rows };
}

// Main Command Handler for Mshop
export async function handleShopCommand(message: Message, client: Client): Promise<void> {
  const guild = message.guild;
  if (!guild) return;
  const userId = message.author.id;

  const { embed, components } = createShopHomePayload(client, guild.id, userId);
  const shopMsg = await message.reply({ embeds: [embed], components });

  const collector = shopMsg.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 180000
  });

  collector.on('collect', async (i: ButtonInteraction) => {
    if (i.user.id !== userId) {
      await i.reply({ content: '⛔ Đạo hữu không thể tương tác phiên cửa hàng của người khác! Hãy gõ `Mshop` để mở cửa hàng của chính mình.', ephemeral: true });
      return;
    }

    const customId = i.customId;

    // 1. Back to Home Shop
    if (customId === 'btn_shop_home') {
      const payload = createShopHomePayload(client, guild.id, userId);
      await i.update(payload);
      return;
    }

    // 2. View Cart
    if (customId === 'btn_view_cart') {
      const payload = createCartPayload(client, guild.id, userId);
      await i.update(payload);
      return;
    }

    // 3. Category Selected (e.g. btn_cat_vukhi)
    if (customId.startsWith('btn_cat_')) {
      const catId = customId.replace('btn_cat_', '');
      const payload = createCategoryPayload(client, guild.id, userId, catId);
      await i.update(payload);
      return;
    }

    // 4. Product Selected (e.g. btn_prod_vukhi_kiem_sat)
    if (customId.startsWith('btn_prod_')) {
      const parts = customId.replace('btn_prod_', '').split('_');
      const catId = parts[0];
      const prodId = parts.slice(1).join('_');
      const payload = createProductPayload(client, guild.id, userId, catId, prodId);
      await i.update(payload);
      return;
    }

    // 5. Action: MUA HÀNG (btn_action_buy_vukhi_kiem_sat)
    if (customId.startsWith('btn_action_buy_')) {
      const parts = customId.replace('btn_action_buy_', '').split('_');
      const catId = parts[0];
      const prodId = parts.slice(1).join('_');
      const products = SHOP_PRODUCTS[catId] || [];
      const prod = products.find(p => p.id === prodId);

      if (!prod) {
        await i.reply({ content: '⚠️ Sản phẩm không tồn tại.', ephemeral: true });
        return;
      }

      const res = db.buyProduct(guild.id, userId, prod.name, prod.price, prod.category);
      if (res.success) {
        const freshUser = db.getOrCreateUser(guild.id, userId);
        const successEmbed = createManyCurielEmbed(
          client,
          `🎉 **MUA HÀNG THÀNH CÔNG!** 🎉\n\n` +
          `• **Vật phẩm:** ${prod.emoji} **${prod.name}**\n` +
          `• **Đã thanh toán:** \`-${prod.price.toLocaleString()}\` Linh Thạch\n` +
          `• **Linh Thạch còn lại:** \`${freshUser.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n` +
          `• **Tình trạng:** Đã được cộng trực tiếp vào ví / túi trữ vật của bạn! ✅\n\n` +
          `👉 *Đạo hữu có thể tiếp tục mua sắm hoặc quay lại các phân khu.*`,
          'GIAO DỊCH THÀNH CÔNG'
        );

        const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId(`btn_cat_${catId}`).setLabel(`🔙 Về Khu Vực ${prod.category}`).setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('btn_shop_home').setLabel('🏠 Về Cửa Hàng').setStyle(ButtonStyle.Secondary)
        );

        await i.update({ embeds: [successEmbed], components: [navRow] });
      } else {
        await i.reply({ content: `⛔ ${res.message}`, ephemeral: true });
      }
      return;
    }

    // 6. Action: KHÔNG MUA (btn_action_cancel_vukhi)
    if (customId.startsWith('btn_action_cancel_')) {
      const catId = customId.replace('btn_action_cancel_', '');
      const cancelPayload = createCategoryPayload(client, guild.id, userId, catId);
      await i.update(cancelPayload);
      await i.followUp({ content: '❌ Đã hủy giao dịch mua hàng. Đã quay lại menu khu vực.', ephemeral: true });
      return;
    }

    // 7. Action: THÊM VÀO GIỎ HÀNG (btn_action_addcart_vukhi_kiem_sat)
    if (customId.startsWith('btn_action_addcart_')) {
      const parts = customId.replace('btn_action_addcart_', '').split('_');
      const catId = parts[0];
      const prodId = parts.slice(1).join('_');
      const products = SHOP_PRODUCTS[catId] || [];
      const prod = products.find(p => p.id === prodId);

      if (!prod) {
        await i.reply({ content: '⚠️ Sản phẩm không tồn tại.', ephemeral: true });
        return;
      }

      const res = db.addToCart(guild.id, userId, { name: prod.name, price: prod.price, category: prod.category });
      const addedEmbed = createManyCurielEmbed(
        client,
        `🛒 **ĐÃ THÊM VÀO GIỎ HÀNG THÀNH CÔNG!** 🛒\n\n` +
        `• **Vật phẩm:** ${prod.emoji} **${prod.name}**\n` +
        `• **Đơn giá:** \`${prod.price.toLocaleString()}\` Linh Thạch\n` +
        `• **Tổng số món trong giỏ:** \`${res.totalInCart}\` món\n\n` +
        `📌 *Sản phẩm đã được lưu an toàn trong giỏ hàng của bạn. Bot không bao giờ tự ý xóa sản phẩm.*`,
        'ĐÃ THÊM VÀO GIỎ HÀNG'
      );

      const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('btn_view_cart').setLabel('🛒 Đến Giỏ Hàng').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`btn_cat_${catId}`).setLabel(`🔙 Về Khu Vực ${prod.category}`).setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_shop_home').setLabel('🏠 Về Cửa Hàng').setStyle(ButtonStyle.Secondary)
      );

      await i.update({ embeds: [addedEmbed], components: [navRow] });
      return;
    }

    // 8. Action: THANH TOÁN TOÀN BỘ GIỎ HÀNG (btn_cart_checkout)
    if (customId === 'btn_cart_checkout') {
      const res = db.checkoutCart(guild.id, userId);
      if (res.success) {
        const freshUser = db.getOrCreateUser(guild.id, userId);
        const checkoutEmbed = createManyCurielEmbed(
          client,
          `🎉 **THANH TOÁN GIỎ HÀNG THÀNH CÔNG!** 🎉\n\n` +
          `• ${res.message}\n` +
          `• **Linh Thạch còn lại:** \`${freshUser.tinh_khong_thach.toLocaleString()}\` Linh Thạch\n` +
          `• **Tình trạng:** Toàn bộ vật phẩm đã được chuyển vào túi trữ vật của bạn! ✅`,
          'THANH TOÁN THÀNH CÔNG'
        );

        const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId('btn_shop_home').setLabel('🏠 Quay Lại Cửa Hàng').setStyle(ButtonStyle.Primary)
        );

        await i.update({ embeds: [checkoutEmbed], components: [navRow] });
      } else {
        await i.reply({ content: `⛔ ${res.message}`, ephemeral: true });
      }
      return;
    }

    // 9. Action: XÓA GIỎ HÀNG (btn_cart_clear)
    if (customId === 'btn_cart_clear') {
      db.clearCart(guild.id, userId);
      const cartPayload = createCartPayload(client, guild.id, userId);
      await i.update(cartPayload);
      await i.followUp({ content: '🗑️ Đã xóa toàn bộ vật phẩm trong giỏ hàng của bạn.', ephemeral: true });
      return;
    }
  });
}
