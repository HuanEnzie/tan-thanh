// ===== Content v3: currency, per-world items, armor, melee styles, chests, biomes, bosses, shop =====
const ARMED_REALMS = ['md', 'tt', 'sl'];          // worlds that have their own armor / melee / boss art
const rk = r => ARMED_REALMS.includes(r) ? r : 'md';

const CURRENCY = {
  md: { name: 'Vàng', icon: 'ui_0', col: '#ffd23a' },
  tt: { name: 'Linh Thạch', icon: 'ui_1', col: '#6fd8ff' },
  sl: { name: 'Ma Thạch', icon: 'ui_2', col: '#c08bff' },
  cy: { name: 'Credit', icon: 'ui_0', col: '#ffd23a' },
  ct: { name: 'Lượng bạc', icon: 'ui_0', col: '#ffd23a' },
};
const cur = () => CURRENCY[RL.id] || CURRENCY.md;

// shop-only and currency items share the ITEMS table
Object.assign(ITEMS, {
  gold:    { name: 'Tiền', icon: 'ui_0', kind: 'cur' },
  scroll:  { name: 'Cuộn truyền tống', icon: 'ui_5', kind: 'use', desc: 'Dịch chuyển về nơi trú ẩn, hoặc thoát khỏi hầm ngục. [phím U]' },
  heart:   { name: 'Tinh thể sinh mệnh', icon: 'ui_6', kind: 'use', desc: 'Dùng ngay: +10 máu tối đa vĩnh viễn.' },
  mystery: { name: 'Hộp bí ẩn', icon: 'ui_4', kind: 'use', desc: 'Mở ra một món trang bị ngẫu nhiên.' },
});

// per-world names / icons for the shared consumables (Tu Tiên has no grenades or bandages)
const REALM_ITEMS = {
  tt: {
    medkit:  { name: 'Hồi Xuân Đan', icon: 'tt_i_0', desc: 'Đan dược hồi 65 máu. [H]' },
    bandage: { name: 'Kim Sang Dược', icon: 'tt_i_1', desc: 'Thuốc đắp vết thương, hồi 22 máu. [H]' },
    pills:   { name: 'Bồi Nguyên Đan', icon: 'tt_i_2', desc: 'Hồi 12 máu, giảm 30% sát thương nhận vào 30s.' },
    food:    { name: 'Linh Quả', icon: 'tt_i_3', desc: 'No +45. [F]' },
    choco:   { name: 'Kẹo Hồ Lô', icon: 'tt_i_4', desc: 'No +18, đầy thể lực.' },
    water:   { name: 'Linh Tuyền Thủy', icon: 'tt_i_5', desc: 'Khát +50. [F]' },
    energy:  { name: 'Ngộ Đạo Trà', icon: 'tt_i_6', desc: 'Khát +20, chạy không mệt 25s.' },
    molotov: { name: 'Hỏa Diệm Phù', icon: 'tt_i_7', desc: 'Ném ra tạo biển lửa. [G]' },
    grenade: { name: 'Ngũ Lôi Phù', icon: 'tt_i_8', desc: 'Lôi phù nổ sau 1.2s. [G]' },
    planks:  { name: 'Linh Mộc', icon: 'tt_i_9' },
    scrap:   { name: 'Khoáng Thạch Thô', icon: 'tt_i_10', desc: 'Phân giải pháp bảo cũng ra khoáng thạch.' },
    gas:     { name: 'Linh Dầu', icon: 'tt_i_11', desc: 'Nguyên liệu luyện Hỏa Diệm Phù.' },
    battery: { name: 'Huỳnh Thạch', icon: 'tt_i_12', desc: 'Đá phát sáng, dùng thắp đèn và luyện phù.' },
    ammo_pistol: { icon: 'tt_i_13' }, ammo_shell: { icon: 'tt_i_14' }, ammo_rifle: { icon: 'tt_i_15' },
    flower:  { name: 'Linh Hoa', desc: 'Đóa hoa linh khí, món quà nhỏ cho đồng đạo.' },
    barricade: { name: 'Mộc Trận', desc: 'Dựng trận gỗ chặn yêu ma. [B]' },
    trap:    { name: 'Địa Thứ Trận', desc: 'Trận pháp gai đất gây sát thương. [T]' },
    scroll:  { name: 'Truyền Tống Phù' },
    heart:   { name: 'Thọ Nguyên Đan', icon: 'tt_i_2' },
    mystery: { name: 'Bảo Hạp Bí Ẩn' },
  },
  sl: {
    pills: { name: 'Thuốc hồi phục cấp thấp' }, energy: { name: 'Thuốc thể lực' }, scroll: { name: 'Đá hồi hương' },
    heart: { name: 'Lõi sinh mệnh' }, mystery: { name: 'Hộp quà Hệ Thống' },
  },
};
// merged definition of an item in the current world
function itm(id) {
  const base = ITEMS[id]; if (!base) return null;
  const o = REALM_ITEMS[RL.id] && REALM_ITEMS[RL.id][id];
  const d = o ? Object.assign({}, base, o) : Object.assign({}, base);
  if (d.kind === 'ammo') d.name = RL.ammoNames[['ammo_pistol', 'ammo_shell', 'ammo_rifle'].indexOf(id)];
  if (id === 'gold') { d.name = cur().name; d.icon = cur().icon; }
  if (id === 'orb') { d.name = ORB_NAME[rk(RL.id)]; d.icon = 'orb_' + rk(RL.id); }
  if (id === 'ticket') { const t = TICKET[rk(RL.id)]; d.name = t.name; d.icon = t.icon; }
  return d;
}

// ---------- armor ----------
const ARMOR_SLOTS = ['head', 'body', 'legs', 'feet'];
const ARMOR_NAMES = {
  md: ['Mũ chiến thuật', 'Áo giáp chống đạn', 'Quần tác chiến', 'Giày quân dụng'],
  tt: ['Ngọc Quan', 'Đạo Bào', 'Vân Văn Khố', 'Đạp Vân Hài'],
  sl: ['Mặt nạ Thợ Săn', 'Áo choàng Hắc Ảnh', 'Giáp chân Bóng Đêm', 'Ủng Hắc Ảnh'],
};
const ARMOR_LEGEND = {
  md: ['Mũ Người Gác Đêm', 'Giáp Kẻ Bất Tử', 'Quần Lính Cuối Cùng', 'Giày Vượt Tận Thế'],
  tt: ['Tử Kim Quan', 'Thiên Tàm Bảo Y', 'Huyền Vũ Khố', 'Thần Hành Hài'],
  sl: ['Mặt Nạ Quân Vương', 'Áo Choàng Bóng Đêm Vĩnh Cửu', 'Giáp Chân Kẻ Săn Đêm', 'Ủng Vực Thẳm'],
};
const ARMOR_BASE = { head: 6, body: 12, legs: 8, feet: 5 };
const ARMOR_SLOT_LABEL = { head: 'Mũ', body: 'Áo', legs: 'Quần', feet: 'Giày' };
// affix -> stat key read through Player.relic()
const ARMOR_AFFIXES = {
  hp:      { name: 'Sinh Lực', desc: v => `+${Math.round(v)} máu tối đa`, roll: l => 10 + l * 1.4 },
  regen:   { name: 'Hồi Phục', desc: v => `Hồi ${v.toFixed(1)} máu/giây`, roll: l => 0.3 + l * 0.03 },
  speed:   { name: 'Tật Phong', desc: v => `+${Math.round(v)}% tốc độ chạy`, roll: () => R.range(4, 8) },
  dodge:   { name: 'Ảo Ảnh', desc: v => `+${Math.round(v)}% né đòn`, roll: () => R.range(3, 6) },
  thorns:  { name: 'Gai Nhọn', desc: v => `Thiêu kẻ địch xung quanh ${Math.round(v)}/giây`, roll: l => 5 + l * 0.8 },
  luck:    { name: 'May Mắn', desc: v => `+${Math.round(v)}% tỉ lệ rơi đồ quý`, roll: () => R.range(8, 16) },
  xp:      { name: 'Thông Tuệ', desc: v => `+${Math.round(v)}% kinh nghiệm`, roll: () => R.range(6, 14) },
  energy:  { name: 'Linh Lực', desc: v => `+${Math.round(v)}% hồi năng lượng kỹ năng`, roll: () => R.range(10, 20) },
  critdmg: { name: 'Sắc Bén', desc: v => `+${Math.round(v)}% sát thương chí mạng`, roll: () => R.range(15, 30) },
};

// ---------- melee styles ----------
const MELEE_TYPES = [
  { id: 'dagger', label: 'Dao găm', dmg: 0.62, rate: 0.55, range: 0.78, arc: 1.0, knock: 0.5, stam: 0.5, crit: 0.18, fx: 'stab' },
  { id: 'sword', label: 'Kiếm', dmg: 1.0, rate: 0.95, range: 1.05, arc: 1.05, knock: 1, stam: 1, combo: true },
  { id: 'axe', label: 'Rìu', dmg: 1.35, rate: 1.25, range: 1.0, arc: 1.15, knock: 1.2, stam: 1.2, bleed: true },
  { id: 'hammer', label: 'Búa', dmg: 1.75, rate: 1.7, range: 0.95, arc: 1.25, knock: 2.0, stam: 1.6, slam: true },
  { id: 'spear', label: 'Thương', dmg: 1.05, rate: 1.05, range: 1.65, arc: 0.45, knock: 0.9, stam: 1, thrust: true },
  { id: 'scythe', label: 'Lưỡi hái', dmg: 1.1, rate: 1.3, range: 1.3, arc: 3.6, knock: 0.8, stam: 1.3, leech: true },
  { id: 'great', label: 'Đại kiếm', dmg: 1.95, rate: 1.85, range: 1.4, arc: 2.0, knock: 1.6, stam: 1.8 },
  { id: 'fist', label: 'Quyền thủ', dmg: 0.5, rate: 0.38, range: 0.68, arc: 0.9, knock: 0.9, stam: 0.4, stun: 0.25, fx: 'punch' },
];
const MELEE_NAMES = {
  md: ['Dao chiến đấu', 'Katana', 'Rìu cứu hỏa', 'Búa tạ', 'Giáo ống thép', 'Lưỡi hái', 'Dao phay khổng lồ', 'Nắm đấm gai'],
  tt: ['Ngọc Chủy', 'Thanh Phong Kiếm', 'Nguyệt Phủ', 'Lôi Văn Chùy', 'Long Đảm Thương', 'Ám Nguyệt Liêm', 'Trọng Kiếm', 'Hổ Trảo'],
  sl: ['Dao găm Bóng Tối', 'Trường kiếm Kỵ Sĩ', 'Rìu chiến Orc', 'Chùy gai', 'Thương Kỵ Sĩ', 'Lưỡi hái Tử Thần', 'Đại kiếm Huyết Văn', 'Vuốt Quỷ'],
};

// ---------- chests ----------
const CHESTS = [
  { name: 'Rương Gỗ', col: '#d8a060', time: 0.8, sfx: 'sfx_loot' },
  { name: 'Rương Bạc', col: '#e6f0ff', time: 1.1, sfx: 'sfx_coin' },
  { name: 'Rương Vàng', col: '#ffd23a', time: 1.4, sfx: 'sfx_legendary' },
  { name: 'Rương Kim Cương', col: '#5ff3ff', time: 1.8, sfx: 'sfx_legendary' },
];

// ---------- biomes ----------
// extra tile ids (walkable unless listed in World.isSolidT)
Object.assign(T, { SNOW: 13, SWAMP: 14, ASH: 15, MYCEL: 16, CRYS: 17, SAKURA: 18, DESERT: 19, JUNGLE: 20, ICE: 21, LAVA: 22, GRAVE: 23, LEAVES: 24 });
const BIOME_TEX = { 25: 'tex_water', 13: 'tex_snow', 14: 'tex_swamp', 15: 'tex_ash', 16: 'tex_mycel', 17: 'tex_crystal', 18: 'tex_sakura', 19: 'tex_desert', 20: 'tex_jungle', 21: 'tex_ice', 22: 'tex_lava', 23: 'tex_grave', 24: 'tex_leaves' };
Object.assign(MINI_COL, { 13: [225, 232, 240], 14: [52, 62, 34], 15: [40, 34, 34], 16: [108, 64, 128], 17: [44, 60, 120], 18: [120, 160, 90], 19: [214, 150, 80], 20: [30, 70, 34], 21: [150, 200, 220], 22: [230, 110, 30], 23: [64, 62, 56], 24: [160, 80, 34] });
const BIOMES = {
  plains:   { name: 'Đồng Cỏ', desc: 'Gió lùa qua những đồng cỏ hoang', ground: null, trees: null, treeD: 1, amb: null },
  forest:   { name: 'Rừng Già', desc: 'Tán cây che kín bầu trời', ground: null, alt: T.LEAVES, trees: null, treeD: 2.6, amb: null },
  snow:     { name: 'Băng Nguyên', desc: 'Lạnh thấu xương — nước đóng thành băng', ground: T.SNOW, water: T.ICE, trees: ['b_snowpine', 'b_snowpine', 'tree_dead'], treeD: 1.2, deco: ['b_ice', 'rocks'], amb: 'snow', tint: 'rgba(170,200,255,0.06)' },
  desert:   { name: 'Sa Mạc', desc: 'Cát bỏng và xương trắng', ground: T.DESERT, alt: T.SAND, trees: ['tree_dead'], treeD: 0.15, deco: ['b_skull', 'rocks'], oasis: 'b_palm', amb: 'sand', tint: 'rgba(255,180,90,0.07)' },
  jungle:   { name: 'Rừng Nhiệt Đới', desc: 'Oi nồng, rậm rạp, đầy tiếng côn trùng', ground: T.JUNGLE, trees: ['b_fern', 'b_palm', 'b_fern'], treeD: 2.4, deco: ['bush'], amb: null },
  swamp:    { name: 'Đầm Lầy', desc: 'Bùn sâu, sương độc', ground: T.SWAMP, trees: ['b_swamptree', 'tree_dead'], treeD: 1.1, deco: ['b_reeds', 'b_reeds'], lakes: 0.42, amb: 'fog', tint: 'rgba(60,90,40,0.10)' },
  autumn:   { name: 'Rừng Thu', desc: 'Lá đỏ rơi như mưa', ground: T.LEAVES, trees: ['b_maple', 'tree_autumn', 'b_maple'], treeD: 1.6, amb: 'leaves' },
  sakura:   { name: 'Rừng Anh Đào', desc: 'Hoa rơi lả tả trên lối nhỏ', ground: T.SAKURA, trees: ['b_sakura'], treeD: 1.1, amb: 'petals' },
  mushroom: { name: 'Rừng Nấm Khổng Lồ', desc: 'Bào tử phát sáng lơ lửng', ground: T.MYCEL, trees: ['b_mushroom'], treeD: 1.3, deco: ['b_glowshroom', 'b_glowshroom'], loot: { b_glowshroom: 'herb' }, amb: 'spores', tint: 'rgba(150,80,200,0.08)' },
  crystal:  { name: 'Thung Lũng Pha Lê', desc: 'Pha lê chứa đầy năng lượng — và kho báu', ground: T.CRYS, trees: [], treeD: 0, deco: ['b_crystal', 'b_crystal', 'rocks'], loot: { b_crystal: 'crystal' }, amb: 'motes', tint: 'rgba(80,120,255,0.08)' },
  volcano:  { name: 'Hỏa Sơn', desc: 'Dung nham sôi sục dưới chân', ground: T.ASH, water: T.LAVA, trees: ['tree_dead'], treeD: 0.4, deco: ['b_lavarock', 'b_lavarock'], lakes: 0.5, amb: 'embers', tint: 'rgba(255,80,20,0.08)' },
  grave:    { name: 'Nghĩa Địa Cổ', desc: 'Người chết không yên giấc', ground: T.GRAVE, trees: ['tree_dead', 'b_swamptree'], treeD: 0.7, deco: ['b_tomb', 'b_tomb', 'b_tomb'], loot: { b_tomb: 'grave' }, amb: 'fog', tint: 'rgba(40,50,70,0.14)', dark: 0.25 },
};
const BIOME_IDS = Object.keys(BIOMES);
const BIOME_IMAGES = ['b_snowpine', 'b_ice', 'b_cactus', 'b_skull', 'b_palm', 'b_mushroom', 'b_glowshroom', 'b_crystal', 'b_lavarock', 'b_swamptree', 'b_reeds', 'b_tomb', 'b_sakura', 'b_bamboo', 'b_maple', 'b_fern'];

// ---------- random bosses ----------
// patterns: summon volley charge slam spiral meteor nova teleport shotgun trail
const BOSSES = {
  md: [
    { img: 'z_boss', name: 'Đột Biến Thể', pat: ['summon', 'volley', 'charge', 'slam'], col: '#9be22d' },
    { img: 'md_b_0', name: 'Xe Tăng Thịt', pat: ['charge', 'slam', 'meteor', 'summon'], col: '#ff9a3c', up: true, scale: 1.1 },
    { img: 'md_b_1', name: 'Nữ Hoàng Nhện', pat: ['spiral', 'summon', 'shotgun', 'teleport'], col: '#c8ff6a' },
    { img: 'md_b_2', name: 'Lính Cứu Hỏa Rực Cháy', pat: ['nova', 'trail', 'charge', 'meteor'], col: '#ff6a1a', up: true, el: 'fire' },
    { img: 'md_b_3', name: 'Tiến Sĩ Hoại Tử', pat: ['summon', 'teleport', 'volley', 'nova'], col: '#7cf04a', up: true, el: 'poison' },
  ],
  tt: [
    { img: 'tt_e_6', name: 'Cửu Đầu Xà', pat: ['summon', 'volley', 'charge', 'spiral'], col: '#b46bff' },
    { img: 'tt_b_0', name: 'Hỏa Phượng Yêu Hoàng', pat: ['spiral', 'meteor', 'trail', 'nova'], col: '#ff7a1a', el: 'fire' },
    { img: 'tt_b_1', name: 'Cửu Vĩ Băng Hồ', pat: ['teleport', 'nova', 'shotgun', 'spiral'], col: '#9fe6ff', el: 'ice' },
    { img: 'tt_b_2', name: 'Huyết Ma Vương', pat: ['charge', 'slam', 'summon', 'meteor'], col: '#ff3b5a' },
    { img: 'tt_b_3', name: 'Lôi Quy Thần Thú', pat: ['meteor', 'nova', 'volley', 'slam'], col: '#fff36b', el: 'shock', scale: 1.1 },
  ],
  sl: [
    { img: 'sl_e_6', name: 'Kỵ Sĩ Máu', pat: ['charge', 'slam', 'summon', 'volley'], col: '#ff3b3b' },
    { img: 'sl_b_0', name: 'Vua Tiên Tộc Băng Giá', pat: ['shotgun', 'nova', 'teleport', 'charge'], col: '#9fe6ff', up: true, el: 'ice' },
    { img: 'sl_b_1', name: 'Vu Yêu Lich', pat: ['summon', 'spiral', 'teleport', 'meteor'], col: '#b46bff', up: true },
    { img: 'sl_b_2', name: 'Kiến Chúa', pat: ['summon', 'charge', 'volley', 'trail'], col: '#c8ff6a', el: 'poison', scale: 1.1 },
    { img: 'sl_b_3', name: 'Quỷ Vương Baran', pat: ['meteor', 'nova', 'charge', 'spiral'], col: '#ff6a1a', up: true, el: 'fire' },
  ],
};
const BOSS_MODS = [
  { id: 'rage', name: 'Cuồng Bạo', spd: 1.25 },
  { id: 'iron', name: 'Thiết Giáp', armor: 0.25 },
  { id: 'giant', name: 'Khổng Lồ', scale: 1.25, hp: 1.3 },
  { id: 'swift', name: 'Hư Ảnh', extra: 'teleport' },
  { id: 'storm', name: 'Bão Tố', extra: 'spiral' },
];
function rollBoss(realm, rnd = Math.random) {
  const pool = BOSSES[rk(realm)];
  const def = pool[Math.floor(rnd() * pool.length)];
  const mod = rnd() < 0.55 ? BOSS_MODS[Math.floor(rnd() * BOSS_MODS.length)] : null;
  return { def, mod };
}

// ---------- hero names by gender ----------
const HERO_NAMES = {
  md: { m: ['Minh Khang', 'Tuấn Kiệt', 'Đức Anh', 'Quang Huy', 'Hoàng Nam'], f: ['Bảo Ngọc', 'Hà My', 'Thảo Vy', 'Khánh Linh', 'Minh Thư'] },
  tt: { m: ['Lâm Phong', 'Diệp Hàn', 'Bạch Trần', 'Tiêu Viêm', 'Lục Trầm'], f: ['Tô Thanh Vân', 'Hạ Dao', 'Cố Lam', 'Liễu Như Yên', 'Mộ Dung Tuyết'] },
  sl: { m: ['Hàn Dũng', 'Lý Thần', 'Doãn Hạo', 'Kim Vũ', 'Thành Tấn'], f: ['Phác Ngân', 'Thôi Lam', 'Yoon Hạ', 'Seo Linh', 'Cha Hải An'] },
  cy: { m: ['Lam Ảnh', 'Phong Sắt'], f: ['Kha Nhi', 'Hạ Băng'] },
  ct: { m: ['Lê Phong', 'Lý Khang'], f: ['Trần Vân Khê', 'Phạm Nguyệt Ánh'] },
};

const EXPRESSIONS = ['happy', 'sad', 'angry', 'blush', 'surprised'];
const EXPR_PORTS = new Set(['md_port1', 'md_port2', 'tt_port1', 'tt_port2', 'sl_port1', 'sl_port2']);
// guess a portrait expression from a line of dialogue
function guessExpr(text, romance) {
  const t = String(text).toLowerCase();
  if (/đỏ mặt|ngượng|thích cậu|thích anh|thích em|thích muội|thích huynh|yêu|thương .*(cậu|anh|em)|tim (tôi|ta)/.test(t)) return romance ? 'blush' : 'happy';
  if (/\?!|!\?|sao lại|thật sao|cái gì|hả\?|trời ơi|không thể nào/.test(t)) return 'surprised';
  if (/khốn|đáng chết|cút|giết|im đi|lũ súc|thề sẽ|tức|hận/.test(t)) return 'angry';
  if (/xin lỗi|buồn|khóc|nước mắt|đã chết|mất (đi|hết)|tuột tay|nhớ (mẹ|nhà|họ)|cô đơn|đau quá|\.\.\.$/.test(t)) return 'sad';
  if (/haha|hì|hehe|cảm ơn|vui|tuyệt|tốt lắm|đẹp quá|thật à|♥|ngon/.test(t)) return 'happy';
  return 'normal';
}

// ===== v4: pets, wonders, gacha, world events =====
const PETS = [
  { name: 'Hỏa Hồ Ly', star: 4, desc: 'Phun cầu lửa vào kẻ địch gần nhất', col: '#ff7a1a' },
  { name: 'Băng Long Con', star: 5, desc: 'Phun hơi băng hình nón, làm chậm và đóng băng', col: '#7fdcff' },
  { name: 'Mèo Thần Tài', star: 5, desc: '+30% tiền nhặt được, hút đồ từ xa, +15% may mắn', col: '#ffd23a' },
  { name: 'Sứa Ánh Sáng', star: 4, desc: 'Liên tục chữa thương cho bạn', col: '#ff9ad8' },
  { name: 'Lôi Điểu', star: 5, desc: 'Gọi sét đánh tới 3 kẻ địch', col: '#fff36b' },
  { name: 'Tiểu Thạch Nhân', star: 4, desc: 'Định kỳ tạo khiên đá bảo vệ bạn', col: '#9fd18a' },
  { name: 'U Linh Đèn Lồng', star: 4, desc: 'Soi sáng màn đêm, làm chậm kẻ địch quanh bạn', col: '#b8d8ff' },
  { name: 'Tinh Linh Pha Lê', star: 5, desc: '+12% chí mạng, hồi năng lượng tuyệt kỹ', col: '#d8a8ff' },
];
const TICKET = {
  md: { name: 'Phiếu Tiếp Tế', icon: 'tk_md' },
  tt: { name: 'Thiên Cơ Phù', icon: 'tk_tt' },
  sl: { name: 'Vé Triệu Hồi Hệ Thống', icon: 'tk_sl' },
};
Object.assign(ITEMS, {
  ticket: { name: 'Vé triệu hồi', icon: 'tk_md', kind: 'mat', desc: 'Dùng ở Tế Đàn Vận Mệnh (nút 🎴) để triệu hồi thú cưng, trang bị và báu vật.' },
  star:   { name: 'Mảnh Sao Băng', icon: 'ev_star', kind: 'mat', desc: 'Rơi trong mưa sao băng. 10 mảnh đổi 1 vé triệu hồi ở Tế Đàn.' },
});
const GACHA_NAME = { md: 'Tế Đàn Vận Mệnh', tt: 'Thiên Cơ Đài', sl: 'Cổng Triệu Hồi Hệ Thống' };
// one landmark per biome: found by exploring, shown as "?" rumours on the map
const WONDERS = [
  { biome: 'snow', img: 'w_0', name: 'Mộ Rồng Băng', lore: 'Bộ xương một con rồng cổ nằm vùi trong băng. Gió thổi qua hốc mắt nó như tiếng thở dài ngàn năm.' },
  { biome: 'desert', img: 'w_1', name: 'Kim Tự Tháp Cát Vàng', lore: 'Một kim tự tháp mọc lên giữa biển cát. Nhân sư canh cổng vẫn đang chờ câu trả lời cho câu đố của nó.' },
  { biome: 'forest', img: 'w_2', name: 'Cây Thế Giới', lore: 'Rễ cây phát sáng chạy sâu xuống lòng đất. Người ta nói mọi sinh linh đều từ đây mà ra.' },
  { biome: 'crystal', img: 'w_3', name: 'Tháp Pha Lê Tím', lore: 'Ngọn tháp pha lê ngân nga một giai điệu chỉ người sắp chết mới nghe thấy.' },
  { biome: 'volcano', img: 'w_4', name: 'Tế Đàn Hắc Diệu', lore: 'Đá hắc diệu khắc chữ cổ, dung nham chảy theo đúng nét chữ. Ai đó vẫn đang thắp lửa ở đây.' },
  { biome: 'sakura', img: 'w_5', name: 'Cổng Hoa Anh Đào', lore: 'Cánh cổng đỏ đứng giữa mưa hoa. Bước qua nó, mọi âm thanh như ngừng lại.' },
  { biome: 'mushroom', img: 'w_6', name: 'Nhà Nấm Cổ Tích', lore: 'Ánh đèn vẫn sáng trong căn nhà nấm. Trên bàn còn ấm một tách trà... của ai?' },
  { biome: 'swamp', img: 'w_7', name: 'Đền Chìm', lore: 'Ngôi đền chìm dần xuống bùn. Những bậc thang dẫn xuống nước, như mời ai đó bước vào.' },
  { biome: 'jungle', img: 'w_8', name: 'Đầu Đá Khổng Lồ', lore: 'Gương mặt đá nhắm mắt giữa rừng già. Người dân tin rằng khi nó mở mắt, thế giới sẽ đổi chủ.' },
  { biome: 'grave', img: 'w_9', name: 'Lăng Mộ U Linh', lore: 'Lửa ma xanh cháy suốt đêm trong lăng. Những bức tượng gargoyle quay mặt theo bước chân bạn.' },
  { biome: 'autumn', img: 'w_10', name: 'Chùa Lá Đỏ', lore: 'Ngôi chùa cổ giữa rừng phong. Chuông chùa tự ngân lên mỗi khi có người lạ đến.' },
  { biome: 'plains', img: 'w_11', name: 'Vòng Đá Cổ', lore: 'Vòng đá cổ phát sáng chữ rune xanh. Đứng giữa vòng, bạn nghe thấy tiếng thì thầm từ một thế giới khác.' },
];
