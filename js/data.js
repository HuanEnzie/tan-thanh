// ===== Items, loot rarity, affixes, relics, perks, recipes =====
const ITEMS = {
  ammo_pistol: { name: 'Đạn loại I', icon: 'i_ammo_pistol', kind: 'ammo', slot: 'r1' },
  ammo_shell:  { name: 'Đạn loại II', icon: 'i_ammo_shell', kind: 'ammo', slot: 'r2' },
  ammo_rifle:  { name: 'Đạn loại III', icon: 'i_ammo_rifle', kind: 'ammo', slot: 'r3' },
  medkit:  { name: 'Hộp cứu thương', icon: 'i_medkit', kind: 'use', desc: 'Hồi 65 máu. [H]' },
  bandage: { name: 'Băng gạc', icon: 'i_bandage', kind: 'use', desc: 'Hồi 22 máu. [H]' },
  pills:   { name: 'Đan dược / thuốc', icon: 'i_pills', kind: 'use', desc: 'Hồi 12 máu, giảm 30% sát thương nhận vào 30s.' },
  food:    { name: 'Lương thực', icon: 'i_food', kind: 'use', desc: 'No +45. [F]' },
  choco:   { name: 'Sô-cô-la', icon: 'i_choco', kind: 'use', desc: 'No +18, đầy thể lực.' },
  water:   { name: 'Nước sạch', icon: 'i_water', kind: 'use', desc: 'Khát +50. [F]' },
  energy:  { name: 'Nước tăng lực', icon: 'i_energy', kind: 'use', desc: 'Khát +20, chạy không mệt 25s.' },
  flower:  { name: 'Hoa dại', icon: 'fx_7', kind: 'gift', desc: 'Món quà nhỏ cho người bạn đồng hành.' },
  molotov: { name: 'Bom xăng', icon: 'i_molotov', kind: 'throw', desc: 'Ném tạo biển lửa. [G]' },
  grenade: { name: 'Lựu đạn', icon: 'i_grenade', kind: 'throw', desc: 'Nổ sau 1.2s. [G]' },
  planks:  { name: 'Ván gỗ', icon: 'i_planks', kind: 'mat' },
  scrap:   { name: 'Phế liệu', icon: 'i_scrap', kind: 'mat', desc: 'Phân giải vũ khí cũng ra phế liệu.' },
  gas:     { name: 'Can xăng', icon: 'i_gas', kind: 'mat', desc: 'Đổ xăng cho xe, chế bom xăng.' },
  battery: { name: 'Pin', icon: 'i_battery', kind: 'mat' },
  key:     { name: 'Bộ câu điện xe', icon: 'i_key', kind: 'mat', desc: 'Lái mọi xe chạy được.' },
  artifact:{ name: 'Bảo vật', icon: 'i_radio', kind: 'quest' },
  barricade: { name: 'Rào chắn', icon: 'i_planks', kind: 'place', desc: 'Đặt rào chặn kẻ địch. [B]' },
  trap:    { name: 'Bẫy chông', icon: 'i_scrap', kind: 'place', desc: 'Đặt bẫy gây sát thương. [T]' },
};
const AMMO_OF = { r1: 'ammo_pistol', r2: 'ammo_shell', r3: 'ammo_rifle' };
const SLOT_ORDER = ['melee', 'r1', 'r2', 'r3'];

// weapon archetypes (base numbers, scaled by rarity & item level)
const BASE = {
  melee: { melee: true, dmg: 34, rate: 0.42, range: 54, arc: 1.7, knock: 220, stam: 7 },
  r1: { dmg: 26, rate: 0.26, mag: 12, reload: 1.1, spread: 0.035, speed: 1100, knock: 60, shake: 2, noise: 430 },
  r2: { dmg: 15, pellets: 7, rate: 0.8, mag: 6, reload: 1.9, spread: 0.3, speed: 950, knock: 120, shake: 5, range: 0.42, noise: 650 },
  r3: { dmg: 22, rate: 0.11, mag: 30, reload: 1.7, spread: 0.06, speed: 1300, knock: 45, shake: 2, auto: true, pierce: 1, noise: 560 },
};

const RARITY = [
  { name: 'Thường', color: '#cfcfcf', mult: 1, affixes: 0, w: 52 },
  { name: 'Tốt', color: '#6ee06e', mult: 1.2, affixes: 1, w: 26 },
  { name: 'Hiếm', color: '#4da6ff', mult: 1.45, affixes: 1, w: 13 },
  { name: 'Sử Thi', color: '#b46bff', mult: 1.8, affixes: 2, w: 6 },
  { name: 'Huyền Thoại', color: '#ffa31a', mult: 2.3, affixes: 3, w: 2.4 },
  { name: 'Thần Thoại', color: '#ff3b3b', mult: 3.1, affixes: 4, w: 0.6 },
];

const AFFIXES = {
  fire:     { name: 'Hoả Diệm', desc: 'Đốt cháy kẻ địch', color: '#ff7a1a' },
  ice:      { name: 'Băng Giá', desc: 'Làm chậm, có thể đóng băng', color: '#7fdcff' },
  shock:    { name: 'Lôi Điện', desc: 'Sét lan sang kẻ địch gần đó', color: '#fff36b' },
  poison:   { name: 'Kịch Độc', desc: 'Gây độc theo thời gian', color: '#7cf04a' },
  explosive:{ name: 'Bộc Phá', desc: 'Đòn đánh có thể phát nổ', color: '#ff5a3c', ranged: true },
  vamp:     { name: 'Huyết Ma', desc: 'Hút máu khi gây sát thương', color: '#ff3b5a' },
  multi:    { name: 'Phân Ảnh', desc: '+2 đường đạn', color: '#c8a8ff', ranged: true },
  pierce:   { name: 'Xuyên Thấu', desc: 'Xuyên thêm 2 mục tiêu', color: '#dddddd', ranged: true },
  bounce:   { name: 'Bật Nảy', desc: 'Đạn nảy khỏi tường', color: '#a8ffd8', ranged: true },
  homing:   { name: 'Truy Hồn', desc: 'Đạn tự đuổi theo mục tiêu', color: '#ff9af0', ranged: true },
  crit:     { name: 'Chí Mạng', desc: '+15% tỉ lệ chí mạng', color: '#ffe066' },
  haste:    { name: 'Cuồng Phong', desc: '+25% tốc độ đánh', color: '#9affff' },
  wave:     { name: 'Kiếm Khí', desc: 'Vung vũ khí phóng ra luồng kiếm khí', color: '#7dffd8', melee: true },
  giant:    { name: 'Khổng Lồ', desc: '+45% tầm đánh, +30% đẩy lùi', color: '#ffc38a', melee: true },
};

const RELICS = {
  regen:   { name: 'Bùa Sinh Mệnh', icon: 'relic_0', desc: v => `Hồi ${v.toFixed(1)} máu/giây`, base: 0.8 },
  speed:   { name: 'Giày Gió', icon: 'relic_1', desc: v => `+${Math.round(v)}% tốc độ chạy`, base: 8 },
  xp:      { name: 'Vương Miện Trí Tuệ', icon: 'relic_2', desc: v => `+${Math.round(v)}% kinh nghiệm`, base: 15 },
  thorns:  { name: 'Nhẫn Lam Hoả', icon: 'relic_3', desc: v => `Thiêu đốt kẻ địch xung quanh ${Math.round(v)}/giây`, base: 10 },
  critdmg: { name: 'Bùa Đầu Lâu', icon: 'relic_4', desc: v => `+${Math.round(v)}% sát thương chí mạng, +5% tỉ lệ`, base: 40 },
  shield:  { name: 'Gương Đồng', icon: 'relic_5', desc: v => `Khiên ${Math.round(v)} điểm, hồi sau 5s`, base: 25 },
  revive:  { name: 'Lông Phượng Hoàng', icon: 'relic_6', desc: () => 'Hồi sinh một lần khi gục ngã', base: 1 },
  luck:    { name: 'Ngọc Bội May Mắn', icon: 'relic_7', desc: v => `+${Math.round(v)}% tỉ lệ rơi đồ quý`, base: 25 },
  energy:  { name: 'Chip Lượng Tử', icon: 'relic_8', desc: v => `+${Math.round(v)}% hồi năng lượng kỹ năng`, base: 25 },
  thunder: { name: 'Vòng Tay Lôi Thần', icon: 'relic_9', desc: v => `Sét đánh kẻ địch mỗi 2s, ${Math.round(v)} sát thương`, base: 45 },
  dodge:   { name: 'Áo Choàng Bóng Đêm', icon: 'relic_10', desc: v => `${Math.round(v)}% né đòn`, base: 8 },
  cdr:     { name: 'Đồng Hồ Cát', icon: 'relic_11', desc: v => `Lướt hồi nhanh hơn ${Math.round(v)}%`, base: 20 },
  orbit:   { name: 'Tinh Thể Hộ Thân', icon: 'fx_7', desc: v => `${Math.round(v)} quả cầu xoay quanh, gây sát thương`, base: 2 },
};

const RECIPES = [
  { out: 'molotov', n: 2, need: { gas: 1, water: 1 } },
  { out: 'grenade', n: 1, need: { scrap: 2, gas: 1, battery: 1 } },
  { out: 'medkit', n: 1, need: { bandage: 2, pills: 1 } },
  { out: 'ammo_pistol', n: 14, need: { scrap: 2 } },
  { out: 'ammo_shell', n: 7, need: { scrap: 2, gas: 1 } },
  { out: 'ammo_rifle', n: 24, need: { scrap: 3, battery: 1 } },
  { out: 'barricade', n: 1, need: { planks: 2 } },
  { out: 'trap', n: 2, need: { planks: 1, scrap: 1 } },
  { out: 'bandage', n: 1, need: { planks: 1, water: 1 } },
];

const PERKS = [
  { id: 'hp', name: 'Da Thép', desc: '+25 máu tối đa và hồi đầy máu.', icon: 'i_medkit' },
  { id: 'gun', name: 'Xạ Thủ', desc: '+15% sát thương tầm xa.', icon: 'i_pistol' },
  { id: 'melee', name: 'Đồ Tể', desc: '+30% sát thương cận chiến.', icon: 'i_bat' },
  { id: 'reload', name: 'Tay Nhanh', desc: 'Nạp đạn nhanh hơn 20%.', icon: 'i_ammo_rifle' },
  { id: 'speed', name: 'Chân Sáo', desc: '+8% tốc độ di chuyển.', icon: 'relic_1' },
  { id: 'stam', name: 'Bền Bỉ', desc: '+35% thể lực, hồi nhanh hơn.', icon: 'i_choco' },
  { id: 'luck', name: 'Kẻ Nhặt Rác', desc: '+35% cơ hội rơi đồ và đồ quý hơn.', icon: 'relic_7' },
  { id: 'thrift', name: 'Tiết Kiệm', desc: '20% cơ hội bắn không tốn đạn.', icon: 'i_ammo_pistol' },
  { id: 'vamp', name: 'Khát Máu', desc: 'Hạ địch bằng cận chiến hồi 5 máu.', icon: 'blood1' },
  { id: 'crit', name: 'Chí Mạng', desc: '+10% tỉ lệ chí mạng.', icon: 'relic_4' },
  { id: 'belly', name: 'Dạ Dày Sắt', desc: 'Đói và khát chậm hơn 25%.', icon: 'i_food' },
  { id: 'pierce', name: 'Xuyên Phá', desc: 'Đạn xuyên thêm 1 mục tiêu.', icon: 'i_ammo_shell' },
  { id: 'boom', name: 'Chuyên Gia Nổ', desc: '+40% sát thương và phạm vi nổ/lửa.', icon: 'i_grenade' },
  { id: 'armor', name: 'Giáp Da', desc: 'Giảm 12% sát thương nhận vào.', icon: 'relic_5' },
  { id: 'skill', name: 'Thiên Phú', desc: 'Kỹ năng tối thượng mạnh hơn 30%, hồi năng lượng nhanh hơn.', icon: 'relic_8' },
  { id: 'dash', name: 'Thân Pháp', desc: 'Lướt xa hơn, hồi nhanh hơn, gây sát thương khi lướt qua.', icon: 'relic_11' },
  { id: 'charm', name: 'Đa Tình', desc: 'Độ thân mật với bạn đồng hành tăng nhanh gấp đôi.', icon: 'fx_7' },
  { id: 'leader', name: 'Thủ Lĩnh', desc: 'Đồng đội gây thêm 40% sát thương và trâu hơn.', icon: 'relic_2' },
];

const ACHIEVEMENTS = {
  firstKill: 'Máu đầu tiên — Hạ kẻ địch đầu tiên',
  kill100: 'Kẻ Săn Mồi — Hạ 100 kẻ địch',
  kill500: 'Cỗ Máy Huỷ Diệt — Hạ 500 kẻ địch',
  combo25: 'Bão Táp — Đạt combo x25',
  legend: 'Thiên Mệnh — Nhặt được vật phẩm Huyền Thoại',
  myth: 'Thần Thoại Sống — Nhặt được vật phẩm Thần Thoại',
  gate: 'Thợ Săn — Chinh phục một Cổng',
  gateS: 'Kẻ Không Thể Ngăn Cản — Chinh phục Cổng hạng S',
  rescue: 'Người Hùng — Giải cứu dân thường',
  love: 'Trái Tim Trao Nhau — Tỏ tình thành công',
  boss: 'Trảm Ma — Tiêu diệt boss',
  driver: 'Tay Lái Lụa — Lái xe',
  story: 'Kết Thúc Một Truyền Thuyết — Hoàn thành cốt truyện',
  far: 'Kẻ Lữ Hành — Đi xa 1000m khỏi điểm xuất phát',
};

const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
const RANK_COLOR = { E: '#9e9e9e', D: '#6ee06e', C: '#4da6ff', B: '#b46bff', A: '#ffa31a', S: '#ff3b3b' };
const RANK_LVL = { E: 3, D: 8, C: 14, B: 22, A: 32, S: 45 };
const RANK_FLOORS = { E: 2, D: 2, C: 3, B: 3, A: 4, S: 5 };
