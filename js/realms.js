// ===== The five worlds: visuals, enemies, weapons, skills =====
// Weapon slots shared by every world: r1 (pistol-like), r2 (spread), r3 (rapid / magic), melee.
const ARCHE = {
  walker:   { hp: 45, spd: 40, dmg: 10, r: 11, xp: 10 },
  runner:   { hp: 30, spd: 108, dmg: 7, r: 10, xp: 14, rate: 0.7 },
  brute:    { hp: 280, spd: 36, dmg: 26, r: 20, xp: 55, knockRes: 0.85, rate: 1.4 },
  ranged:   { hp: 60, spd: 40, dmg: 10, r: 13, xp: 22, ranged: true },
  armored:  { hp: 90, spd: 48, dmg: 12, r: 12, xp: 20, armor: 0.3 },
  exploder: { hp: 50, spd: 50, dmg: 0, r: 14, xp: 22, explode: true },
  boss:     { hp: 3200, spd: 55, dmg: 34, r: 36, xp: 1200, knockRes: 1, boss: true, armor: 0.1 },
};
const ARCHE_ORDER = ['walker', 'runner', 'brute', 'ranged', 'armored', 'exploder', 'boss'];

const REALMS = {
  md: {
    id: 'md', name: 'Tận Thế', art: 'title', color: '#d9a46a',
    hero: ['p_pistol', 'p_shotgun', 'p_rifle', 'p_bat'],
    enemies: ['z_walker', 'z_runner', 'z_brute', 'z_spitter', 'z_police', 'z_boomer', 'z_boss'],
    extraEnemies: { walker: ['z_hazmat', 'z_nurse'] },
    enemyNames: ['Xác sống', 'Kẻ chạy', 'Gã khổng lồ', 'Kẻ phun axit', 'Cảnh sát xác sống', 'Kẻ phát nổ', 'Đột biến'],
    projColor: '#9be22d', blood: ['#8a0d0d', '#a8120f', '#6d0808', '#c21b17'],
    tex: { 0: 'tex_grass', 1: 'tex_asphalt', 2: 'tex_sidewalk', 3: 'tex_dirt', 4: 'tex_wood', 5: 'tex_tile', 7: 'tex_water', 8: 'tex_sand', 9: 'tex_roof', 11: 'tex_dirt', 12: 'tex_roof' },
    roofs: ['tex_roof', 'tex_roof2'], wall: null,
    dungeon: { floor: 'tex_sl_road', wall: 'tex_sl_wall', name: 'Đường hầm ngầm', torch: 'sl_p_1', decor: ['barrel', 'crate', 'trash', 'sl_p_2'] },
    props: { crate: ['crate'], trash: ['trash'], bin: ['dumpster'], vending: ['vending'], special: 'ammocrate', ammo: 'ammocrate', barrel: 'barrel', lamp: 'lamp',
      bench: 'bench', fence: 'fence', barrier: ['barrier', 'sandbags'], cars: ['car_red', 'car_police', 'car_burnt', 'car_ambulance'], big: ['bus', 'truck'],
      trees: ['tree_oak', 'tree_pine', 'tree_autumn', 'tree_dead'], bush: 'bush', rocks: ['rock', 'rocks'], weeds: 'weeds', fire: 'firebarrel', tent: 'tent', decor: ['bench'] },
    drivable: ['car_red', 'car_police', 'car_ambulance'],
    npc: ['md_npc_0', 'md_npc_1', 'md_npc_2', 'md_npc_3'], compSprite: [0, 1], port: ['md_port1', 'md_port2'],
    weapons: {
      r1: { name: 'Súng lục', icon: 'i_pistol', proj: 'bullet', sfx: 'sfx_pistol', ammo: 'Đạn súng lục' },
      r2: { name: 'Shotgun', icon: 'i_shotgun', proj: 'bullet', sfx: 'sfx_shotgun', ammo: 'Đạn shotgun' },
      r3: { name: 'Súng trường', icon: 'i_rifle', proj: 'bullet', sfx: 'sfx_rifle', ammo: 'Đạn súng trường' },
      melee: { name: 'Gậy đinh', icon: 'i_bat', sfx: 'sfx_swing', trail: '#d8c9a8' },
    },
    legend: { r1: ['Kẻ Phán Xử', 'Tiếng Chuông Cuối'], r2: ['Cơn Thịnh Nộ', 'Bão Chì'], r3: ['Người Gác Đêm', 'Lưỡi Hái Thép'], melee: ['Kẻ Đập Sọ', 'Gậy Phán Quyết'] },
    skill: { id: 'airstrike', name: 'Không Kích', desc: 'Gọi pháo kích dọc hướng ngắm', color: '#ffb02e' },
    music: { explore: 'music_explore', night: 'music_night', combat: 'music_horde', dungeon: 'music_dungeon' },
    ambient: 'ash', cars: true, nightTint: [4, 6, 16], radio: 'RADIO', ammoNames: ['Đạn súng lục', 'Đạn shotgun', 'Đạn súng trường'],
    style: 'modern',
  },
  cy: {
    id: 'cy', name: 'Neon 2099', art: 'cy_art', color: '#ff4fd8',
    hero: ['cy_hero_0', 'cy_hero_1', 'cy_hero_2', 'cy_hero_3'],
    enemies: ['cy_e_0', 'cy_e_1', 'cy_e_2', 'cy_e_3', 'cy_e_4', 'cy_e_5', 'cy_e_6'],
    enemyNames: ['Cyborg xác sống', 'Android săn mồi', 'Mech chiến đấu', 'Drone laser', 'Robot trấn áp', 'Drone cảm tử', 'Nhện Thép Titan'],
    projColor: '#ff3355', blood: ['#2bd6ff', '#7a0d0d', '#c21b17', '#1a8cff'],
    tex: { 0: 'tex_cy_ground', 1: 'tex_cy_road', 2: 'tex_cy_ground', 3: 'tex_dirt', 4: 'tex_cy_floor', 5: 'tex_tile', 7: 'tex_water', 8: 'tex_sand', 9: 'tex_cy_floor', 11: 'tex_dirt', 12: 'tex_cy_floor' },
    roofs: ['tex_cy_roof', 'tex_roof'], wall: 'tex_cy_wall',
    dungeon: { floor: 'tex_cy_floor', wall: 'tex_cy_wall', name: 'Lõi máy chủ', torch: 'cy_p_3', decor: ['cy_p_1', 'cy_p_9', 'cy_p_2', 'cy_p_6'] },
    props: { crate: ['cy_p_6', 'cy_p_1'], trash: ['cy_p_11'], bin: ['cy_p_11'], vending: ['cy_p_0'], special: 'cy_p_1', ammo: 'cy_p_1', barrel: 'cy_p_2', lamp: 'cy_p_3',
      bench: 'cy_p_8', fence: 'cy_p_10', barrier: ['cy_p_10'], cars: ['cy_p_4', 'cy_p_5'], big: ['truck'],
      trees: ['tree_dead', 'tree_dead', 'tree_pine'], bush: 'bush', rocks: ['rocks'], weeds: 'weeds', fire: 'firebarrel', tent: 'cy_p_7', decor: ['cy_p_7', 'cy_p_8', 'cy_p_9'] },
    drivable: ['cy_p_4', 'cy_p_5'],
    npc: ['cy_npc_0', 'cy_npc_1', 'cy_npc_2', 'cy_npc_3'], compSprite: [1, 0], port: ['cy_port1', 'cy_port2'],
    weapons: {
      r1: { name: 'Súng plasma', icon: 'cy_w_0', proj: 'laser', color: '#3cf0ff', sfx: 'sfx_laser', ammo: 'Pin plasma' },
      r2: { name: 'Shotgun năng lượng', icon: 'cy_w_1', proj: 'laser', color: '#ff4fd8', sfx: 'sfx_energy', ammo: 'Lõi năng lượng' },
      r3: { name: 'Súng laser', icon: 'cy_w_2', proj: 'laser', color: '#7dff5a', sfx: 'sfx_laser2', ammo: 'Tụ quang' },
      melee: { name: 'Katana nhiệt', icon: 'cy_w_3', sfx: 'sfx_sword', trail: '#ff3b3b' },
    },
    legend: { r1: ['Ánh Sáng Cuối', 'Mã Độc Đỏ'], r2: ['Siêu Tân Tinh', 'Bão Từ'], r3: ['Thiên Nhãn', 'Tia Phán Quyết'], melee: ['Huyết Neon', 'Lưỡi Plasma Vô Cực'] },
    skill: { id: 'overclock', name: 'Quá Tải Thời Gian', desc: 'Làm chậm thời gian, phóng xung EMP', color: '#3cf0ff' },
    music: { explore: 'music_cy_explore', night: 'music_cy_explore', combat: 'music_cy_combat', dungeon: 'music_dungeon' },
    ambient: 'rain', cars: true, nightTint: [10, 2, 24], radio: 'KÊNH MÃ HOÁ', ammoNames: ['Pin plasma', 'Lõi năng lượng', 'Tụ quang'],
    style: 'cyber', alwaysNightish: 0.35,
  },
  ct: {
    id: 'ct', name: 'Cổ Trang', art: 'ct_art', color: '#ff5a4a',
    hero: ['ct_hero_0', 'ct_hero_1', 'ct_hero_2', 'ct_hero_3'],
    enemies: ['ct_e_0', 'ct_e_1', 'ct_e_2', 'ct_e_3', 'ct_e_4', 'ct_e_5', 'ct_e_6'],
    enemyNames: ['Cương thi', 'Ngạ quỷ', 'Đầu Trâu', 'Hồ ly tinh', 'Âm binh', 'Đèn lồng ma', 'Quỷ Vương'],
    projColor: '#4da6ff', blood: ['#3a0a0a', '#6d0808', '#2a2a40', '#8a0d0d'],
    tex: { 0: 'tex_grass', 1: 'tex_ct_road', 2: 'tex_ct_ground', 3: 'tex_ct_ground', 4: 'tex_ct_floor', 5: 'tex_ct_floor', 7: 'tex_water', 8: 'tex_sand', 9: 'tex_ct_road', 11: 'tex_ct_ground', 12: 'tex_ct_road' },
    roofs: ['tex_ct_roof', 'tex_roof2'], wall: 'tex_ct_wall',
    dungeon: { floor: 'tex_sl_ground', wall: 'tex_ct_wall', name: 'Lăng mộ cổ', torch: 'sl_p_1', decor: ['ct_p_0', 'ct_p_8', 'ct_p_3', 'sl_p_2'] },
    props: { crate: ['ct_p_1'], trash: ['ct_p_5'], bin: ['ct_p_0'], vending: ['ct_p_7'], special: 'ct_p_1', ammo: 'ct_p_1', barrel: 'ct_p_0', lamp: 'ct_p_2',
      bench: 'ct_p_4', fence: 'ct_p_10', barrier: ['ct_p_10'], cars: ['ct_p_6'], big: ['ct_p_6'],
      trees: ['ct_p_11', 'tree_oak', 'ct_p_9', 'tree_pine', 'tree_autumn'], bush: 'ct_p_9', rocks: ['rock', 'rocks'], weeds: 'weeds', fire: 'ct_p_8', tent: 'ct_p_7', decor: ['ct_p_3', 'ct_p_4', 'ct_p_8'] },
    drivable: [],
    npc: ['ct_npc_0', 'ct_npc_1', 'ct_npc_2', 'ct_npc_3'], compSprite: [1, 0], port: ['ct_port1', 'ct_port2'],
    weapons: {
      r1: { name: 'Nỏ thần', icon: 'ct_w_0', proj: 'arrow', color: '#e8d7b0', sfx: 'sfx_bow', ammo: 'Tên nỏ' },
      r2: { name: 'Hoả mai', icon: 'ct_w_1', proj: 'bullet', sfx: 'sfx_shotgun', ammo: 'Đạn chì' },
      r3: { name: 'Trường cung', icon: 'ct_w_2', proj: 'arrow', color: '#ffe3a0', sfx: 'sfx_bow', ammo: 'Mũi tên' },
      melee: { name: 'Thanh kiếm', icon: 'ct_w_3', sfx: 'sfx_sword', trail: '#cfe8ff' },
    },
    legend: { r1: ['Nỏ Liên Châu', 'Thần Tiễn Lạc Hồng'], r2: ['Hoả Long Pháo', 'Thiên Lôi Hoả'], r3: ['Xạ Nhật Cung', 'Phá Quân Cung'], melee: ['Thuận Thiên Kiếm', 'Huyết Nguyệt Đao'] },
    skill: { id: 'whirl', name: 'Kiếm Vũ Liên Hoa', desc: 'Xoay kiếm thành lốc chém mọi thứ xung quanh', color: '#ff7a9a' },
    music: { explore: 'music_ct_explore', night: 'music_ct_explore', combat: 'music_ct_combat', dungeon: 'music_dungeon' },
    ambient: 'petals', cars: false, nightTint: [16, 2, 4], radio: 'LỜI ĐỒN', ammoNames: ['Tên nỏ', 'Đạn chì', 'Mũi tên'],
    style: 'ancient', alwaysNightish: 0.15,
  },
  tt: {
    id: 'tt', name: 'Tu Tiên', art: 'tt_art', color: '#7dffd8',
    hero: ['tt_hero_0', 'tt_hero_1', 'tt_hero_2', 'tt_hero_3'],
    enemies: ['tt_e_0', 'tt_e_1', 'tt_e_2', 'tt_e_3', 'tt_e_4', 'tt_e_5', 'tt_e_6'],
    enemyNames: ['Huyết thi', 'Yêu lang', 'Thạch nhân', 'Ma tu', 'Ma binh', 'Độc thiềm', 'Cửu Đầu Xà'],
    projColor: '#b46bff', blood: ['#7a0d4a', '#3a0a3a', '#8a0d0d', '#5a0a5a'],
    tex: { 0: 'tex_tt_ground', 1: 'tex_tt_road', 2: 'tex_tt_road', 3: 'tex_dirt', 4: 'tex_tt_floor', 5: 'tex_tt_floor', 7: 'tex_water', 8: 'tex_sand', 9: 'tex_tt_road', 11: 'tex_tt_ground', 12: 'tex_tt_road' },
    roofs: ['tex_tt_roof', 'tex_ct_roof'], wall: 'tex_tt_wall',
    dungeon: { floor: 'tex_tt_floor', wall: 'tex_sl_wall', name: 'Bí cảnh', torch: 'tt_p_7', decor: ['tt_p_1', 'tt_p_2', 'tt_p_4', 'tt_p_3'] },
    props: { crate: ['tt_p_5'], trash: ['tt_p_0'], bin: ['tt_p_1'], vending: ['tt_p_1'], special: 'tt_p_5', ammo: 'tt_p_5', barrel: 'tt_p_3', lamp: 'tt_p_7',
      bench: 'tt_p_11', fence: null, barrier: ['tt_p_10'], cars: [], big: [],
      trees: ['tt_p_8', 'tt_p_9', 'tree_pine', 'tt_p_8'], bush: 'bush', rocks: ['tt_p_10', 'rock'], weeds: 'weeds', fire: 'tt_p_3', tent: 'tt_p_2', decor: ['tt_p_2', 'tt_p_4', 'tt_p_11', 'tt_p_6'] },
    drivable: [],
    npc: ['tt_npc_0', 'tt_npc_1', 'tt_npc_2', 'tt_npc_3'], compSprite: [0, 3], port: ['tt_port1', 'tt_port2'],
    weapons: {
      r1: { name: 'Hoả phù', icon: 'tt_w_0', proj: 'talisman', color: '#ffd65a', sfx: 'sfx_magic', ammo: 'Phù chú' },
      r2: { name: 'Hồ lô linh hoả', icon: 'tt_w_1', proj: 'orb', color: '#5affc8', sfx: 'sfx_magic2', ammo: 'Linh hoả' },
      r3: { name: 'Pháp trượng', icon: 'tt_w_2', proj: 'orb', color: '#6bb6ff', sfx: 'sfx_magic', ammo: 'Linh Khí Châu', homing: true },
      melee: { name: 'Phi kiếm', icon: 'tt_w_3', sfx: 'sfx_sword2', trail: '#7dffd8', wave: true },
    },
    legend: { r1: ['Thiên Lôi Phù', 'Cửu Thiên Huyền Phù'], r2: ['Tử Kim Hồ Lô', 'Càn Khôn Hồ'], r3: ['Hỗn Độn Trượng', 'Tinh Hà Trượng'], melee: ['Tru Tiên Kiếm', 'Thanh Liên Kiếm'] },
    skill: { id: 'swords', name: 'Vạn Kiếm Quy Tông', desc: 'Triệu hồi mưa phi kiếm truy sát kẻ địch', color: '#7dffd8' },
    music: { explore: 'music_tt_explore', night: 'music_tt_explore', combat: 'music_tt_combat', dungeon: 'music_dungeon' },
    ambient: 'motes', cars: false, nightTint: [2, 8, 22], radio: 'TRUYỀN ÂM', ammoNames: ['Phù chú', 'Linh hoả', 'Linh Khí Châu'],
    style: 'sect',
  },
  sl: {
    id: 'sl', name: 'Thợ Săn Cổng', art: 'sl_art', color: '#4d8dff',
    hero: ['sl_hero_0', 'sl_hero_1', 'sl_hero_2', 'sl_hero_3'],
    enemies: ['sl_e_0', 'sl_e_1', 'sl_e_2', 'sl_e_3', 'sl_e_4', 'sl_e_5', 'sl_e_6'],
    enemyNames: ['Yêu tinh', 'Kiến lính', 'Orc', 'Pháp sư hắc ám', 'Kỵ sĩ xương', 'Slime nổ', 'Kỵ Sĩ Máu'],
    projColor: '#b46bff', blood: ['#2a6b1a', '#8a0d0d', '#4a2a6a', '#6d0808'],
    tex: { 0: 'tex_grass', 1: 'tex_asphalt', 2: 'tex_sidewalk', 3: 'tex_dirt', 4: 'tex_wood', 5: 'tex_tile', 7: 'tex_water', 8: 'tex_sand', 9: 'tex_roof', 11: 'tex_dirt', 12: 'tex_roof' },
    roofs: ['tex_roof', 'tex_roof2'], wall: null,
    dungeon: { floor: 'tex_sl_floor', wall: 'tex_sl_wall', name: 'Hầm ngục', torch: 'sl_p_1', decor: ['sl_p_2', 'sl_p_3', 'sl_p_4', 'sl_p_7'] },
    props: { crate: ['crate'], trash: ['trash'], bin: ['dumpster'], vending: ['vending'], special: 'sl_p_0', ammo: 'sl_p_0', barrel: 'barrel', lamp: 'lamp',
      bench: 'bench', fence: 'fence', barrier: ['barrier', 'sandbags'], cars: ['car_red', 'car_police', 'car_burnt'], big: ['bus', 'truck'],
      trees: ['tree_oak', 'tree_pine', 'tree_autumn'], bush: 'bush', rocks: ['rock', 'rocks'], weeds: 'weeds', fire: 'firebarrel', tent: 'tent', decor: ['bench'] },
    drivable: ['car_red', 'car_police'],
    npc: ['sl_npc_0', 'sl_npc_1', 'sl_npc_2', 'sl_npc_3'], compSprite: [0, 1], port: ['sl_port1', 'sl_port2'],
    weapons: {
      r1: { name: 'Súng săn', icon: 'sl_w_0', proj: 'bullet', sfx: 'sfx_pistol', ammo: 'Đạn ma lực' },
      r2: { name: 'Nỏ hắc ám', icon: 'sl_w_1', proj: 'arrow', color: '#b46bff', sfx: 'sfx_bow', ammo: 'Tên hắc ám' },
      r3: { name: 'Cầu bóng tối', icon: 'sl_w_2', proj: 'orb', color: '#6b5bff', sfx: 'sfx_magic', ammo: 'Mana', homing: true },
      melee: { name: 'Dao găm', icon: 'sl_w_3', sfx: 'sfx_sword', trail: '#b46bff' },
    },
    legend: { r1: ['Tiếng Gọi Vực Thẳm', 'Kẻ Thi Hành'], r2: ['Mũi Tên Hư Vô', 'Nỏ Quân Vương'], r3: ['Hắc Tinh', 'Vực Sâu Vĩnh Hằng'], melee: ['Nanh Vua Kiến', 'Dao Găm Ác Quỷ'] },
    skill: { id: 'arise', name: 'TRỖI DẬY', desc: 'Hồi sinh kẻ địch đã ngã thành binh đoàn bóng tối', color: '#6b5bff' },
    music: { explore: 'music_sl_explore', night: 'music_sl_explore', combat: 'music_sl_combat', dungeon: 'music_dungeon' },
    ambient: 'mana', cars: true, nightTint: [4, 4, 22], radio: 'HỆ THỐNG', ammoNames: ['Đạn ma lực', 'Tên hắc ám', 'Mana'],
    style: 'modern', gatesCommon: true,
  },
};
// Neon 2099 (cy) and Cổ Trang (ct) are switched off for now; their data stays for later.
// Only Thợ Săn Cổng is open while the shared gameplay is built; the other worlds keep their data and come back later with new art and scripts.
const REALM_ORDER = ['md', 'tt', 'sl'];
let RL = REALMS.md; // current realm

// image names each realm needs (beyond the shared set)
function realmImages(r) {
  const R = REALMS[r];
  const s = new Set();
  const add = v => { if (!v) return; if (Array.isArray(v)) v.forEach(add); else s.add(v); };
  add(R.hero); add(R.enemies); add(R.npc); add(R.port);
  if (R.extraEnemies) for (const k in R.extraEnemies) add(R.extraEnemies[k]);
  for (const k in R.tex) add(R.tex[k]);
  add(R.roofs); add(R.wall); add(R.dungeon.floor); add(R.dungeon.wall); add(R.dungeon.torch); add(R.dungeon.decor);
  for (const k in R.props) add(R.props[k]);
  for (const k in R.weapons) add(R.weapons[k].icon);
  const k = rk(r);
  for (let i = 0; i < 4; i++) { add(k + '_ar_' + i); add(k + '_b_' + i); }
  for (let i = 0; i < 8; i++) add(k + '_m_' + i);
  if (r === 'tt') for (let i = 0; i < 16; i++) add('tt_i_' + i);
  for (const b of BOSSES[k]) add(b.img);
  add(BIOME_IMAGES); add(Object.values(BIOME_TEX));
  for (let i = 0; i < 4; i++) { add('chest_' + i); add('chest_' + i + 'o'); }
  for (let i = 0; i < 8; i++) { add('ui_' + i); add('pet_' + i); }
  for (let i = 0; i < 12; i++) add('w_' + i);
  add(['ev_goblin', 'ev_mimic', 'ev_star', 'ev_altar', 'ev_egg', 'tk_' + k, 'st_' + k, 'wp_' + k, 'orb_' + k, 'base_forge', 'base_kitchen', 'base_garden', 'base_storage', 'base_board', 'base_bed']);
  return [...s];
}
