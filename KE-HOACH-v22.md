# KẾ HOẠCH v22 — Đỡ đòn, Tướng Quỷ có cơ chế, Sinh tồn kiểu Minecraft, Thây ma, Tầm nhìn, Tinh thể

Mỗi gói = 1 file JS mới, 1 agent. Luật chung giống v21 (xem `KE-HOACH-v21.md` mục 1 — **bắt buộc đọc**), bổ sung ở mục 1 dưới đây.

## 0. Yêu cầu → gói

| # | Yêu cầu | Gói | File |
|---|---|---|---|
| 1a | Đỡ đòn (parry) có xác suất, phải đúng lúc quái ra chiêu | PA | `js/v22parry.js` |
| 1b | Mỗi Tướng Quỷ có thế mạnh + cách khắc chế riêng (mầm hồi máu, ảo cảnh…) | DM | `js/v22demon.js` |
| 1c | Thêm loại quái & boss | MB | `js/v22mobs.js` (+ ảnh vòng 22) |
| 2a | Hồi sinh ở vùng ngẫu nhiên, tay trắng; giường = điểm hồi sinh; chết rơi đồ | SV | `js/v22surv.js` |
| 2b | Thu thập + chế tạo kiểu Minecraft (công cụ, bàn chế tạo, lò nung) | CR | `js/v22craft.js` |
| 2c | Xây dựng: tường, cửa, giường, rương, đuốc, trận dịch chuyển, trận phòng thủ | BD | `js/v22build.js` |
| 2d | Nhà nhiều tầng, mái nhà khác nhau | FL | `js/v22floors.js` |
| 2e | Xuất hiện nhiều Cổng hơn | ZB | `js/v22zombie.js` |
| 3 | Nhà đổ nát kiểu tận thế + nhiều loại công trình & địa hình như thế giới thật | RU, BI | `js/v22ruin.js`, `js/v22biome.js` |
| 4 | Thây ma từ người biến thành (có loại biết chiêu), cấp bậc riêng, chỉ ở trong nhà/ngoài đường; quái mạnh dần theo ngày (+10%/ngày) | ZB | `js/v22zombie.js` |
| 5 | Tầm nhìn hình nón (không thấy sau lưng trừ khi có bóng ở đó) + jumpscare khi vào nhà | FV | `js/v22fov.js` |
| 6 | Tinh thể mana hạng E–S trong Cổng, khai thác (người chơi/bóng/đồng đội); tu tiên lên cấp bằng linh thạch; lên hạng cần tinh thể đúng hạng; đổi tinh thể lấy tiền | CY | `js/v22crystal.js` |
| — | Vẽ assets vòng 22 | X | `tools/make_prompts22.py`, `gen22.sh`, `build22.py`, `js/atlas22.js` |

## 1. Luật bổ sung cho v22

- Đọc `js/v21core.js` (R21, SYS, Bus21, gateName) và `js/v22core.js` (World.legacy22, World._gen, World.isLegacyGen, spr22). **Không sửa** hai file này.
- **Mọi thay đổi sinh thế giới** (thêm/bớt prop, đổi tile, biome, nước) phải bỏ qua block cũ: trong wrapper của `World.genOver` dùng `World.legacy22(sb)`; trong hook theo ô (biomeAt, waterAt, zoneOf…) dùng `World.isLegacyGen()`. Prop chỉ **thêm vào cuối** block (sau khi bản gốc chạy xong).
- Sprite mới theo **hợp đồng tên** ở mục 14. Ảnh đang được vẽ song song: code phải chạy được khi chưa có ảnh (dùng `spr22(tên, ảnh_cũ_gần_giống)` hoặc kiểm tra `IMG[tên]`).
- Test: `ONLY=v21,22<gói> node tools/smoke21.mjs <sl|md|tt> <test.js> 600` (v21 = nạp mọi module v21; `22core` luôn nạp). Ví dụ gói PA: `ONLY=v21,22parry`. Thư mục test riêng: `C:\Users\user\AppData\Local\Temp\claude\C--Users-user-Downloads-Hu-n-game\575c7d83-1694-41d1-a99c-23f677235443\scratchpad\v22\<GÓI>\`.
- Trạng thái lưu: `G.v10.<khóa gói>` (`parry`, `dm`, `zb`, `surv`, `craft`, `build`, `fl`, `cy`…).
- Phím đã dùng: WASD Q V K J X Space E R H F L G B T U Y N Z M C I Tab 1–9 Shift Enter Esc, chuột trái/phải. Phím trống: O, P, `[`, `]`, `;`, `'`, `,`, `.`, `/`, chuột giữa.
- Hàm dùng chung giữa các gói (đều phải `typeof` kiểm tra trước khi gọi):
  - SV: `G.isSurvival()`, `G.setRespawn(x, y, label)`, `G.respawnPoint()`
  - CR: `G.toolTier('mine'|'chop')` (0 = tay không), `G.toolMul('chop'|'mine')`, `G.nearStation('bench'|'furnace', r)`
  - BD: `G.buildNear(type, r)` → bản ghi hoặc null; bản ghi trong `G.v10.build.list`
  - ZB: `G.dayMul()`, `G.spawnZombie22(x, y, opts)`
  - FV: `G.canSee(x, y)` (true khi FOV tắt)
  - FL: `G.inInterior()`; đọc `b.floors`, `b.dmg`, `b.roofStyle` trên building
  - CY: `G.playerRank()` → 'E'..'S'
  - Bus21 mới: `parry(z, ok)`, `craft(id, n)`, `build(rec)`, `respawn()`, `mine(rank)`, `scare()`.

## 2. Gói PA — Đỡ đòn (`js/v22parry.js`)

Hiện trạng: quái thường đánh tức thì khi chạm (entities.js:417-423, `G.hurtTarget(tgt, dmg, this)` dòng 421, hồi `t.rate||1.0`). Chuột phải/nút ĐẨY = xô (play.js:168, choáng 0.25 s ở play.js:251). Boss charge có windup 0.9 s (entities.js:506-527), teleport 0.55 s, slam tức thì (507-512).
1. **Nhịp vung đòn (windup)** cho quái đánh gần: bọc `Enemy.prototype.update`. Khi quái trong tầm đánh (`r + tgt.r + 6`), không choáng, `attackCd<=0` và chưa windup → bắt đầu `z.wind = {t: W, max: W}`, giữ `attackCd>0` để bản gốc không đánh; hết windup → cho `attackCd=0` để bản gốc ra đòn ngay khung đó (nếu mục tiêu còn trong tầm +12 px; nếu không, hụt). W: walker 0.45 s, runner 0.32, brute 0.62, armored 0.5, boss chạm 0.5, elite ×0.85, quái v22 theo gói MB. Tốc độ đánh bù: sau windup, hồi chiêu gốc ×0.8.
   - Dấu hiệu: dấu "!" đỏ trên đầu + quái ngả người ra sau (vẽ lệch 3 px ngược hướng) suốt windup; 0.15 s cuối dấu "!" chuyển vàng và nhấp nháy = **lúc đỡ đẹp nhất**. Vẽ bằng bọc `Enemy.prototype.draw` (không gradient).
2. **Đỡ**: chuột phải / nút ĐẨY (giữ nguyên hành động xô) mở cửa sổ đỡ `P.parryT = 0.24 s`, hồi 0.5 s. Bọc `G.hurtTarget` và `G.hurtPlayer`: nếu đòn từ quái/đạn quái tới người chơi khi `P.parryT>0`:
   - Tỉ lệ thành công = clamp(0.55 + 0.012·AGI + (đỡ hoàn hảo: bấm trong 0.12 s trước khi trúng ? 0.3 : 0) − (boss ? 0.2 : 0), 0.25, 0.95).
   - Thành công: sát thương = 0 (boss: 15%), quái choáng `stun` 1.2 s (elite 0.9, boss 0.35 + cộng "điểm phá thế" — 3 lần đỡ boss trong 12 s → boss choáng 2 s), chữ vàng "ĐỠ!" (hoàn hảo: "ĐỠ HOÀN HẢO!"), tia lửa, `Sound.play('sfx_blade_hit')`, `G.hitstop` 0.08 s, đòn kế tiếp của người chơi trong 1.5 s chí mạng ×2 ("Phản đòn"). Đạn quái: bị **dội ngược** thành đạn của người chơi.
   - Thất bại (đang mở cửa sổ nhưng xui): chữ "Đỡ hụt", nhận đủ sát thương.
   - Không đỡ được: đòn có cờ `noParry` (vùng nổ, mưa thiên thạch, sóng xung kích, slam, đòn chiêu của Tướng Quỷ đánh dấu đỏ) — vẽ vòng đỏ cảnh báo. Thêm cảnh báo 0.5 s (vòng đỏ) trước **slam** của boss.
   - Charge của boss: đỡ đúng lúc va chạm → boss choáng 1.2 s.
3. Lần đầu có quái vung đòn gần người chơi: `SYS.msg('Quái đang vung đòn! Nhấn chuột phải / nút ĐẨY đúng lúc dấu ! chuyển vàng để ĐỠ.','quest')` (1 lần, lưu `G.v10.parry.tip`).
4. Thống kê: `G.v10.parry = {ok, perfect, fail, tip}`; `Bus21.emit('parry', z, ok)`. Co-op khách: tắt (máy chủ quyết định sát thương).
5. Test: quái walker đứng sát → đo thời gian từ windup tới sát thương ≈ W; mở parry đúng lúc (đặt `P.parryT` tay) với `Math.random` cố định → không mất máu + quái stun; ngoài cửa sổ → mất máu; đạn quái bị dội ngược; slam có vòng cảnh báo.

## 3. Gói DM — Tướng Quỷ có cơ chế riêng (`js/v22demon.js`)

Hiện trạng: `DEMONS` (v20dk.js:2-15), tướng i dùng `BOSSES[rk][i%5]` (v20dk.js:83-85), sinh qua `spawnGeneral` (81-89), `z.gen = i`, Quỷ Vương `spawnKing` (134-140), `z.king`. Arena R13 ở hang (genGeneral 166-179).
1. Mỗi tướng có **cơ chế + cách khắc chế** (bọc `Enemy.prototype.update` cho `z.gen != null`, prop cơ chế là runtime `placed` prop hoặc Enemy nhỏ có `z.mech`). Bảng (i theo DEMONS):
   0. **Mộ Phệ** — gieo **Mầm Mộ** (`mp22_sprout`, 60 hp, bóng đánh được đủ sát thương) mỗi 10 s quanh arena; mỗi mầm sống: tướng giảm 12% sát thương nhận; ≥3 mầm: tướng **thủ thế** (đứng yên, khiên tím, hồi 2.5% máu/s). Khắc chế: phá mầm.
   1. **Xích Viêm** — để lại vệt lửa (hazard cháy), arena nóng dần (mất 1 máu/s); **Bình nước** (`mp22_urn`) quanh arena: đập vỡ tạo vùng ẩm 6 s an toàn & dập lửa; miễn nhiễm bom xăng.
   2. **Hư Vô** — mỗi 18 s mở **Ảo cảnh**: màn hình ám tím, tạo 3 phân thân (đánh trúng phân thân → tướng hồi 3%), 4 **Gương** (`mp22_mirror`) ở góc; phá 2 gương → ảo cảnh tan + tướng choáng 3 s. Thật/giả: thân thật có bóng đổ, phân thân không.
   3. **Huyết Mẫu** — mỗi đòn trúng hồi máu = 300% sát thương; vũng máu hồi máu cho ả nếu đứng trên. Khắc chế: **lửa** (bom xăng / Xích Viêm relic) gây "Cháy" 6 s chặn hồi máu; thuốc giải độc (pills) xoá "Chảy máu".
   4. **Tật Phong** — lướt liên tục, không thể bị trúng khi đang lướt; mỗi 3 lần lướt tung đòn **Phong Trảm** (windup 0.6 s, đỡ được) — đỡ thành công → choáng 3 s và mất bất tử. Khắc chế: đỡ đòn.
   5. **Bất Diệt** — giáp 85% giảm sát thương; giáp vỡ khi bị **đỡ 3 lần** đòn Trọng Kích hoặc trúng 3 vụ nổ (lựu đạn); giáp hồi sau 20 s. Hồi sinh 1 lần ở 30% máu trừ khi **Bia Bất Diệt** (`mp22_totem`) bị phá trước.
   6. **Nguyệt Linh** — vô hình (không vẽ, không trúng đạn tự ngắm) khi ở ngoài vùng sáng; hiện hình trong nón đèn pin (L), quanh đuốc/lửa trại, hoặc khi đốt 3 **Lư hương** (`mp22_brazier`, E để đốt).
   7. **Thực Hồn** — bóng/đồng đội đứng trong 160 px quá 3 s bị **cướp hồn** (thành quái phe tướng, bóng bị mất tạm 120 s — không xoá khỏi binh đoàn). Khắc chế: thu bóng lại, tự đánh; bom.
   8. **U Minh** — bất tử khi còn **Cột U Minh** (`mp22_pylon`, 4 cái ở rìa, 400 hp); phá hết → dễ tổn thương 12 s rồi cột mọc lại (hết 2 lần mọc thì thôi). Gọi quái liên tục.
   9. **Cốt Mẫu** — đẻ **Trứng Cốt** (`mp22_egg`) mỗi 7 s; trứng nở sau 6 s thành 2 quái; quá 6 trứng → nổ độc. Khắc chế: phá trứng (bóng tự đánh trứng).
   10. **Phá Quân** — chu kỳ **Phản Giáp** (phát sáng đỏ 4 s, phản 100% sát thương về người đánh, kể cả bóng); khi tắt giáp ra đòn Phá Trận (đỡ được → choáng 2 s). Khắc chế: ngừng đánh khi phát sáng.
   11. **Thiên Hạ** — **Lôi trận**: đánh dấu vòng sét (noParry) 3 vòng/lượt; nạp điện thành bất tử khi còn **Cột Thu Lôi** (`mp22_shard`) ≥1; phá cột → tướng choáng 2 s; đứng dưới nước bị ×2 sát thương sét.
   - **Quỷ Vương**: 3 giai đoạn (100–70%, 70–40%, 40–0%), mỗi giai đoạn bật 2 cơ chế ngẫu nhiên (seed theo lần vào) trong bảng trên + nổi giận ở giai đoạn 3.
2. Ảnh: tướng i dùng `dg22_<i>` nếu có (giữ kích thước như boss); prop cơ chế dùng `mp22_*` (fallback: prop có sẵn tô màu).
3. Gợi ý: lần đầu gặp tướng → `SYS.msg('Tướng Quỷ <tên>: <thế mạnh>. Gợi ý: ???','warn')`; sau khi chết dưới tay tướng đó 1 lần hoặc sau 60 s giao chiến → mở gợi ý khắc chế đầy đủ. Lưu `G.v10.dm.seen[i]`, `G.v10.dm.hint[i]`. Thêm phần "Cách khắc chế" vào Sổ tay (bọc `G.dkHtml`).
4. Test: sinh từng tướng (tìm hàm spawnGeneral/đặt `z.gen`), chạy sim, kiểm tra cơ chế kích hoạt (mầm xuất hiện, thủ thế khi ≥3 mầm, phá mầm thì hết; gương phá → tan ảo cảnh…). Không lỗi trong md/tt/sl.

## 4. Gói MB — Thêm loại quái (`js/v22mobs.js`)

Thêm 6 kiểu hành vi mới (vào `ARCHE` + `ARCHE_ORDER` realms.js:3,12 + `RL.enemies`/tên mỗi thế giới — chỉ bằng code trong file của bạn, mutate mảng/đối tượng):
| kind | Hành vi | sl | tt | md |
|---|---|---|---|---|
| leaper | vờn quanh rồi **nhảy vồ** 220 px (windup 0.55 s, vòng cảnh báo, đỡ được) | Thú Ma Nhảy | Hắc Lang Vương | Thây Ma Vồ |
| shielder | khiên trước mặt chặn 80% sát thương trực diện; đánh từ bên/sau; đỡ → vỡ thế 2 s | Kỵ Sĩ Khiên | Thạch Giáp Vệ | Cảnh Sát Khiên Chống Bạo |
| burrower | chui đất (không vẽ, không trúng) rồi trồi dưới chân người chơi (vòng nứt 0.8 s, noParry) | Giun Đá | Địa Long | Thây Ma Cống Ngầm |
| summoner | đứng xa, mỗi 8 s gọi 2 quái nhỏ (walker cấp −2) | Pháp Sư Triệu Hồi | Quỷ Đồng Tử | Thây Ma La Hét |
| charger | húc thẳng (windup 0.7 s, đỡ được), đâm tường → choáng 2 s | Ngưu Ma | Bạo Hùng | Thây Ma Xe Ủi |
| healer | hồi 4% máu/s cho quái trong 180 px, ưu tiên chạy trốn | Tư Tế Bóng Tối | Độc Thiềm Tiên | Thây Ma Y Tá Đột Biến |
- Sprite: `m22_<realm>_<kind>` (fallback: sprite quái cũ cùng thế giới + tint). Chỉ số gốc (hp/dmg/spd/xp) cân với ARCHE hiện có. Windup tích hợp với gói PA: đặt `z.windW` để PA dùng (nếu PA chưa có thì tự xử lý).
- Đưa vào bảng sinh: `GT_POOL` (v20.js:5) theo hạng (C+ mới có summoner/healer), quái biome (v7.js) và gói ZB (đường phố md).
- Boss mới: thêm 2 biến thể boss mỗi thế giới vào `BOSSES[rk]` bằng sprite quái v22 phóng to + `BOSS_MODS` mới: "Hồi sinh" (hồi 1 lần), "Phân thân" (tách 2 bản nhỏ khi <50%).
- Test: sinh từng loại ở 3 thế giới, chạy sim 600 khung, kiểm tra hành vi (khoảng cách nhảy, khiên chặn trực diện, chui/trồi, gọi quái, húc tường choáng, hồi máu đồng loại).

## 5. Gói SV — Sinh tồn kiểu Minecraft (`js/v22surv.js`)

Hiện trạng: xuất phát cố định ở block (0,0) với súng/dao/đồ (game.js:45-55, world.js:333-348); chết xoá save (game.js:416).
1. **Chế độ**: màn tạo nhân vật (v15ui.js `#create`) thêm lựa chọn "Sinh tồn (mặc định)" / "Cổ điển". Lưu `G.v10.surv.mode = 'survival'|'classic'`. Save cũ không có trường này = cổ điển. `G.isSurvival()`.
2. **Bắt đầu sinh tồn**: sau `G.newGame`/`G.start(true)`: rỗng `P.inv`, `P.equip` (đấm tay), giáp, thánh vật, `P.gold = 0`, giữ vé gacha. Dịch tới vị trí ngẫu nhiên: block cách gốc 4–9 superblock, zone 0–1, không POI/không nước, ô đi được (dùng `World.reset` + `World.update` như `G.teleport`). Lưu `G.v10.surv.spawn = {x, y}`. Hiện `SYS.msg('Bạn tỉnh dậy ở một vùng đất lạ, tay trắng. Hãy thu thập gỗ, đá, sợi cỏ để chế tạo công cụ (C).','quest')` + gợi ý từng bước 1 lần (chặt cây → bàn chế tạo → rìu đá…).
3. **Chết (sinh tồn)**: không xoá save. Bọc ngoài cùng `G.die` (chạy trước v21quest): nếu sinh tồn và không có hồi sinh khác (thánh vật/đồng hành/perk — để bản gốc xử lý trước, chỉ chặn đoạn xoá save) → rơi **Túi đồ** tại chỗ chết: toàn bộ `P.inv`, vũ khí đang cầm, giáp, 50% tiền. Thánh vật & kho căn cứ giữ lại. Mất 30% EXP cấp hiện tại. Túi lưu `G.v10.surv.bags = [{x, y, inv, equip, armor, gold, t}]` (tối đa 3, cũ nhất mất), hiện là prop `kind 'bag22'` (E → nhặt hết), đánh dấu 💀 trên bản đồ/minimap, tự `G.guideTo` khi hồi sinh. Chết trong hầm ngục: túi đặt ở cửa Cổng bên ngoài.
   - Màn chết sinh tồn: "BẠN ĐÃ GỤC NGÃ" + nút **HỒI SINH** (không có "Hành trình mới" xoá save). Hồi sinh tại giường (`G.setRespawn` do gói BD gọi khi người chơi chọn "Đặt điểm hồi sinh") nếu còn, nếu không tại `spawn`. Máu 60%, đói/khát 60, bất tử 3 s, `Bus21.emit('respawn')`.
   - Cổ điển: giữ nguyên luật cũ.
4. API: `G.setRespawn(x, y, label)` (lưu `G.v10.surv.bed`, `SYS.msg('Đã đặt điểm hồi sinh: '+label)`), `G.respawnPoint()`.
5. Test: tạo game sinh tồn → inv rỗng, không vũ khí, cách gốc ≥ 4 SB; chết → túi rơi đúng chỗ, hồi sinh tại spawn, nhặt lại túi được; đặt giường giả bằng `G.setRespawn` → hồi sinh ở giường; game cổ điển chết → luật cũ.

## 6. Gói CR — Thu thập & chế tạo (`js/v22craft.js`)

1. **Vật phẩm mới** (thêm vào `ITEMS` + tên theo thế giới; icon `i22_*`): `stick` Que gỗ, `fiber` Sợi cỏ, `stone` Đá, `flint` Đá lửa, `ore_iron` Quặng sắt (tt: Huyền thiết khoáng), `ingot` Thỏi sắt (tt: Huyền thiết), `leather` Da thú, `bone` Xương, `cloth` Vải, `mcore` Lõi quái (tt: Yêu đan vụn, sl: Lõi ma thú), `rope` Dây thừng, `food_cooked` Thịt nướng. Vật phẩm đặt được (định nghĩa ở đây, gói BD xử lý đặt): `pl_bench` Bàn chế tạo, `pl_furnace` Lò nung, `pl_chest` Rương, `pl_bed` Giường, `pl_door` Cửa, `pl_wall_wood`/`pl_wall_stone`/`pl_wall_metal` Tường, `pl_floor` Sàn gỗ, `pl_torch` Đuốc, `pl_campfire` Lửa trại, `pl_fence` Hàng rào, `pl_spikes` Chông, `pl_tparray` Trận dịch chuyển, `pl_defarray` Trận phòng thủ. Icon vật đặt = sprite `b22_*` tương ứng.
2. **Thu thập**: chặt cây (v14.js chop) tay không ×2.5 thời gian, rìu nhanh hơn (`toolMul('chop')`); gỗ chặt thêm `stick` 1–2. Bụi (`LOOT.bush`, v21loot): thêm `fiber` 45%. Đá (`'rock'`): luôn `stone` 2–4 + `flint` 20% + `ore_iron` 15% nếu cuốc ≥ đá; tay không chỉ 1 đá, ×2 thời gian. Quái: `bone` 35% (thây ma/xương), `leather` 30% (thú: runner/brute/biome), `mcore` tinh anh 25%, mini-boss 100%, boss ×3. Tủ quần áo/giường trong nhà: `cloth`.
3. **Công cụ = vũ khí cận chiến** (đọc `Loot.weapon` loot.js:11-20 và các mtype cận chiến): tạo đối tượng vũ khí với `mtype` phù hợp, tên riêng, `w.tool = {chop, mine}`: Gậy gỗ (chop 1, mine 0), Rìu đá (chop 2), Cuốc đá (mine 1), Giáo đá, Rìu sắt (chop 3), Cuốc sắt (mine 2), Kiếm sắt, Cuốc tinh thể (mine 3). Sát thương thấp hơn đồ rơi cùng cấp (đồ rơi vẫn mạnh hơn). `G.toolTier`, `G.toolMul`.
4. **Công thức** (bảng `RECIPES` mở rộng + trạm): tay (mọi nơi) / bàn chế tạo (`G.nearStation('bench', 120)`) / lò nung (`'furnace'`). Giao diện C: nhóm theo trạm, công thức thiếu trạm hiện mờ "Cần Bàn chế tạo gần đó"; mở bàn/lò (E, do gói BD gọi `UI.openPanel('craft')` với `UI.craftStation`) lọc đúng trạm.
   - Tay: stick×4 ← planks 1; torch(pl_torch)×2 ← stick 1 + fiber 1; rope ← fiber 3; pl_bench ← planks 4; Gậy gỗ ← planks 2 + stick 1; pl_campfire ← stone 3 + stick 2.
   - Bàn: Rìu đá / Cuốc đá ← stone 3 + stick 2 + rope 1; Giáo đá ← flint 1 + stick 2 + rope 1; pl_furnace ← stone 8; pl_chest ← planks 8; pl_bed ← planks 3 + cloth 3; pl_door ← planks 6; pl_wall_wood ×2 ← planks 4; pl_wall_stone ×2 ← stone 4; pl_floor ×4 ← planks 2; pl_fence ×3 ← stick 4; pl_spikes ← stick 3 + flint 1; Giáp da (thân) ← leather 6; Mũ da ← leather 4; Rìu sắt/Cuốc sắt ← ingot 3 + stick 2; Kiếm sắt ← ingot 4 + stick 1; Giáp sắt ← ingot 8 + leather 2; pl_wall_metal ×2 ← ingot 2; Cuốc tinh thể ← ingot 2 + cry_B 3 + stick 2.
   - Lò nung: ingot ← ore_iron 1 + planks 1; food_cooked ← food 1 + planks 1 (hồi đói nhiều hơn, +10 máu).
   - Bàn + nguyên liệu boss: pl_tparray ← mcore 3 + cry_C 3 + stone 20 + ingot 4; pl_defarray ← mcore 2 + cry_D 4 + ingot 6 + stone 10.
5. Test: từ inv rỗng: chặt cây → planks; chế stick, bàn (pl_bench có trong inv); giả lập `G.nearStation` true → chế rìu đá → `G.toolMul('chop')` tăng; cuốc đá → đá cho quặng; lò nung → ingot.

## 7. Gói BD — Xây dựng (`js/v22build.js`)

1. **Chế độ xây**: phím **B** (thay đặt rào cũ; rào/bẫy cũ vẫn có trong danh sách) và nút 🔨 trên HUD cảm ứng (`#tbtns`, data-k KeyB). Thanh dưới màn hình liệt kê vật đặt được trong `P.inv` (`pl_*`, barricade, trap) với số lượng; ô bóng ma (xanh = đặt được, đỏ = không) ở ô lưới trước mặt (desktop: theo chuột trong 4 ô). E / chuột trái / nút "Đặt" = đặt; B/Esc = thoát. Không đặt trên ô rắn, nước, prop rắn, ô có công trình, trong hầm ngục hoặc tầng trên.
2. **Bản ghi**: `G.v10.build = {list: [{id, t, tx, ty, hp, inv?, open?, fuel?, name?}], nid}` (chỉ overworld). Hiện thực hoá thành prop `placed` mỗi khi block nạp (mẫu `v10.plants`/plantTick v14.js:101-116) — không ảnh hưởng chỉ số prop cũ. Sprite `b22_<mod|tt>_*` / `b22_*` (fallback: fence/crate/sandbags có sẵn).
   - Tường gỗ 220 hp / đá 520 / kim loại 1000 (rắn, quái đập được: dùng cơ chế barricade game.js:462-470 — `kind 'barricade'`). Cửa: E mở/đóng (đóng = rắn). Sàn: lớp 0, không rắn.
   - **Giường**: E → menu "Ngủ" (như giường căn cứ v5.js:298: chặn khi có quái trong 400 px) / "Đặt điểm hồi sinh" → `G.setRespawn(x, y, 'Giường')`.
   - **Rương**: E → bảng chuyển đồ giữa `P.inv` và `rec.inv` (30 loại).
   - **Bàn chế tạo / Lò nung**: E → `UI.craftStation = 'bench'|'furnace'; UI.openPanel('craft')`. Cung cấp `G.buildNear(t, r)`.
   - **Đuốc / Lửa trại**: nguồn sáng (`light`), lửa trại: ngồi cạnh hồi máu chậm + nướng thịt.
   - **Chông**: gây 25+3·cấp sát thương/0.6 s cho quái đi qua, mòn 40 lần.
   - **Trận dịch chuyển**: thêm vào `G.tpList()` (kind 'array', tên "Trận dịch chuyển #n", có thể đổi tên) → dịch chuyển miễn phí giữa các trận (luật v21prog: đứng gần một điểm tpList = miễn phí).
   - **Trận phòng thủ**: bắn quái trong 420 px mỗi 0.6 s (18 + 3·cấp), cần nạp tinh thể (`cry_*`): mỗi viên = hạng × 120 s hoạt động; E → nạp.
3. **Tháo**: giữ E 1.2 s trên công trình của mình → trả lại vật phẩm (rương trả cả đồ bên trong ra đất).
4. Bản đồ/minimap: giường 🛏, trận dịch chuyển ✦, trận phòng thủ ⚔.
5. Test: thêm pl_* vào inv, vào chế độ xây, đặt tường/cửa/giường/rương/bàn ở các ô; lưu → `G.load()` → công trình còn; quái phá tường; cửa đóng chặn đường; giường đặt điểm hồi sinh; trận dịch chuyển xuất hiện trong `G.tpList()`.

## 8. Gói FL — Nhà nhiều tầng & mái khác nhau (`js/v22floors.js`)

1. **Số tầng**: `b.floors` (nếu gói RU chưa đặt): nhà 1–2 (35% có tầng 2), apartment/office/hotel 3–6, hospital 2–3, mall 2, palace/tửu lâu 2. Theo hash `h3(b.x0, b.y0, 2201)`, chỉ block không legacy.
2. **Cầu thang**: prop `b22_stairs_up` (thêm cuối block, ô sàn trống trong toà nhà, không chặn cửa) — E "Lên tầng 2". Trên tầng: `b22_stairs_up`/`b22_stairs_down` cùng vị trí.
3. **Không gian tầng** (mode mới `'interior'`, KHÔNG dùng 'dungeon'): lưu `G.flRet = {x, y}`, `World.mode = 'interior'`, `World.reset()`, sinh 1 block chứa footprint (tường bao giống tầng 1, phòng chia theo `b.seed + tầng`, sàn texture theo loại, nội thất `f21_*/f22_*` + container loot + thây ma 0–4 qua `G.spawnZombie22` nếu có, cửa sổ = tường kính), ngoài footprint là WALL; minimap key riêng. Persist looted/removed theo khóa delta âm riêng cho mỗi (toà, tầng): `-(1000000 + hash)`. Rời tầng 1 → quay về overworld tại cầu thang (`World.reset` + `World.update` như exitDungeon nhưng không đụng code Cổng). Lưu game khi đang ở tầng: lưu vị trí cầu thang tầng 1 (bọc `G.save`).
   - Kiểm tra các chỗ `World.mode === 'dungeon'` / `!== 'over'` (play.js:375, 562; world.js:54, 176, 191, 223, 976, 1112; coop.js:21) để `'interior'` hành xử đúng (tối như trong nhà, không sinh Cổng, không xây). Co-op: tắt cầu thang.
4. **Mái**: thêm 10 texture `tex22_roof_1..10` (+ `tex22_roofdmg` lớp phủ lỗ thủng). `b.roofStyle` theo loại toà + hash (bọc `World.makeBuilding` hoặc đặt sau khi tạo; chỉ block không legacy); sửa chỗ hard-code `RL.roofs[0]` ở drawRoof (play.js:522) và minimap (world.js:1117) bằng wrapper; mái nhiều tầng vẽ thêm viền bậc. `b.dmg>0` (gói RU) → phủ `tex22_roofdmg` theo tỉ lệ.
5. Test: tìm toà `floors≥2`, gọi tương tác cầu thang, kiểm tra mode 'interior', có tường bao/nội thất/thây ma, lục 1 container → lên/xuống lại vẫn đã lục; lưu+tải khi đang ở tầng → về overworld đúng chỗ; mái khác nhau trên nhiều toà.

## 9. Gói RU — Nhà đổ nát & thêm công trình (`js/v22ruin.js`)

1. **Đổ nát** (block không legacy; md 70% toà, sl 40%, tt 15%): `b.dmg` 0.2–0.9; đổi một phần ô WALL thành lỗ (tile mới `T.RUBBLE` id 28: đi được, texture `tex22_rubble`) hoặc giữ tường; cửa sổ vỡ; sàn cháy (decal scorch); đống gạch `r22_*` trong và ngoài nhà (thêm cuối); xe cháy/xe buýt lật/cột điện đổ trên đường; cây mọc xuyên nhà (md). tt: miếu đổ, cột gãy, đèn đá đổ.
2. **Công trình mới** (chọn bằng `h3(sx, sy, 2202)` trong zone 1–2, chỉ block không legacy; dùng `World.makeBuilding` + nội thất `f21_*`/`f22_*` + loot đúng loại + `b.floors` + `b.roofStyle`):
   - md/sl: trường học (bàn học, bảng đen — loot sách/vải), đồn cảnh sát (tủ đồ, buồng giam, xe cảnh sát — đạn, giáp), trạm cứu hỏa (xe cứu hỏa — rìu, thuốc), cây xăng (cột bơm — xăng), nhà thờ (ghế dài, bàn thờ), nhà máy (máy móc, pallet — sắt vụn, quặng), kho hàng (pallet, xe nâng), khách sạn (giường tầng, nhiều tầng), chung cư cao tầng, siêu thị (kệ hàng), nhà thuốc, ngân hàng (két sắt — tiền), bãi đỗ xe, trang trại (chuồng, silo, máy kéo, ruộng), chốt quân sự (bao cát, thùng đạn).
   - tt: võ đường (hình nộm, giá binh khí), tàng kinh các (giá thư quyển), luyện đan phòng, tiêu cục (xe tiêu), khách điếm (nhiều tầng), nha môn (trống kêu oan), chùa/đạo quán (tượng Phật, lư hương), lò rèn (đe), chợ, nông trang (ruộng lúa, rổ thảo dược).
   - Tần suất: tổng ~45% block zone 2 và ~25% zone 1 thành loại mới (phần còn lại giữ nhà/office/shop cũ).
   - Bảng loot mới trong `LOOT` (game.js:10-21) cho mỗi loại.
3. Test: quét 300 block quanh gốc sau 4 SB: đếm loại toà, tỉ lệ đổ nát theo thế giới, không chặn cửa, legacy block giống hệt khi tắt module (so prop count/order như v21world đã làm).

## 10. Gói BI — Thêm địa hình + sửa rủi ro v21 (`js/v22biome.js`; **được phép sửa `js/v21terrain.js`**)

1. **Sửa v21terrain**: (R1) mọi thay đổi của v21terrain (biomeAt, zoneOf, waterAt, cliffs, decorate) phải tắt khi `World.isLegacyGen()` / `World.legacy22(sb)`; (R2) cliffs không được đè `T.BRIDGE` (và ROAD/SIDEWALK).
2. **Địa hình mới** (chỉ ≥ 24 SB như v21terrain, trừ bãi biển): **bãi biển** (dải cát 2–4 ô quanh biển, cọ `t22_palm`), **đồng ruộng** (zone 1 gần làng: `tex22_farm` luống, lúa mì `t22_wheat`, đống rơm `t22_hay`; tt: ruộng lúa nước `tex22_paddy` + `t22_rice`), **hẻm núi đá đỏ** (`tex22_redrock`, cột đá `t22_redpillar`, xương rồng `t22_cactus2`), **thảo nguyên** (`tex22_savanna`, cây keo `t22_acacia`), **đài nguyên** (`tex22_tundra`, bụi `t22_tundrashrub`), **rừng ngập mặn** (nước nông + `t22_mangrove`, `t22_reeds`), **rừng trúc** (tt: `t22_bamboo`), **rừng chết** (`t22_deadtree`, md). Tỉ lệ mỗi loại 3–6% block xa; MINI_COL/BIOME_TEX đủ; không kẹt người chơi.
3. Test: như gói B2 v21 (đồng nhất vùng gần gốc, census, walk test), thêm: block legacy (đặt delta giả, không có bản ghi -22) giống hệt khi tắt cả v21terrain lẫn v22biome.

## 11. Gói ZB — Thây ma, quái mạnh theo ngày, nhiều Cổng hơn (`js/v22zombie.js`)

1. **Quái mạnh theo ngày**: `G.dayMul() = min(5, 1 + 0.1·(day−1))`. Bọc `G.spawnEnemy`: nếu `o.lvl` không truyền thì truyền `levelAt` (để bỏ phần +ngày cũ trong constructor entities.js:335), rồi nhân `hp/maxHp/dmg` với `dayMul`, xp ×(1 + 0.05·(day−1)). Áp dụng mọi quái (Cổng, boss, thây ma, biển). HUD ngày: "NGÀY 3 • Quái ×1.2".
2. **Thây ma** (không đến từ Cổng, không có trong hầm ngục): spawner riêng ở overworld chơi đơn (và chủ co-op): trong **nhà** (ô sàn của toà nhà, không phải nhà người chơi đang đứng) và **ngoài đường** (ROAD/SIDEWALK/BRIDGE) ở zone 1–2, hoặc đường ở zone 0. Vòng 450–900 px, ngoài tầm nhìn nếu có `G.canSee`. Mật độ: zone2 14, zone1 8, đường hoang 3; đêm ×1.6 trên đường, ngày ×1.3 trong nhà; ×(1 + 0.05·(day−1)), trần 60. Khi block nạp: mỗi toà nhà có 0–3 thây ma đứng im bên trong (để gói FV làm jumpscare). Cung cấp `G.spawnZombie22(x, y, opts)` cho gói FL.
3. **Loại & cấp bậc** (tên theo thế giới; sprite `z22_*`, md dùng thêm `z_*` cũ):
   - Thường (walker, ảnh dân thường ngẫu nhiên: văn phòng/y tá/cảnh sát/lính/công nhân; tt: dân làng/lính canh), Chạy (runner), Phình (bloat, nổ axit).
   - **Thây ma biết chiêu** (từ thợ săn/tu sĩ): sl Thợ Săn Kiếm (lướt chém, windup đỡ được), Thợ Săn Pháp Sư (cầu lửa), Thợ Săn Giáp (khiên + đập đất); tt Kiếm Thi (phóng kiếm khí), Phù Thi (bùa định thân: người chơi đứng im 0.6 s, noParry → né), Cương Thi Trưởng Lão (nhảy cóc + hút máu); md Lính Thây Ma (bắn súng), Thây Ma La Hét (gọi bầy), Đột Biến (to, húc).
   - **Cấp bậc**: Thây ma → Tinh anh → Thống lĩnh → **Thây Ma Vương** (boss, `z22_<realm>_king`, hiếm: 1 con/đêm từ ngày 3 trong vùng zone 2). Màu tên theo cấp.
   - **Người biến thành thây ma**: dân thường/NPC dân làng bị quái giết → 3 s sau đứng dậy thành thây ma (`rise`); `SYS.msg` 1 lần giải thích.
4. **Nhiều Cổng hơn**: trần cổng mở = clamp(3 + floor(level/6), 3, 8)·áp lực; khoảng cách mở 35–80 s (thay 55–120); vẫn giữ trần quái.
5. Test: ngày 1 vs ngày 5 (đặt `G.day`) so hp quái; spawner sinh thây ma trong nhà/đường, không trong hầm ngục (`World.mode` dungeon), không trong rừng hoang xa đường; mỗi loại chiêu kích hoạt; dân bị giết hóa thây ma; số cổng mở tăng.

## 12. Gói FV — Tầm nhìn & jumpscare (`js/v22fov.js`; **được phép sửa `js/v18.js`** để thêm kiểu âm `'scare'` vào `Sfx18`)

1. **Nón tầm nhìn**: hướng = `P.angle` (play.js:73, touch.js), góc 110°, xa 520 px (đêm 320; đèn pin bật: 440 trong nón ±26°), vòng quanh người 64 px luôn thấy; mỗi bóng/đồng đội có vòng nhìn 150 px. Tường chặn (tái dùng ray LOS như đèn pin play.js:574-585, ~48 tia). Ngoài vùng nhìn: phủ tối (ngày 0.55, đêm 0.85). Ghép vào `drawLighting` (play.js:550-616) để chỉ có **một** lớp phủ — cho chạy cả ban ngày khi FOV bật; không dùng gradient trên ctx chính (gl2d); dùng sprite GLOW/destination-out trên canvas ánh sáng như code hiện có.
2. **Ẩn kẻ địch ngoài tầm nhìn**: bọc `Enemy.prototype.draw` (gọi duy nhất ở play.js:432) — không vẽ nếu `!G.canSee(z.x, z.y)`; ẩn chấm đỏ minimap (ui.js:575-580); auto-aim cảm ứng (touch.js:94-127 aimNearest) chỉ nhắm mục tiêu thấy được. Quái vẫn đánh được từ sau lưng. "Giác quan": có quái đang đuổi trong 140 px mà không thấy → viền đỏ mờ phía hướng đó + tiếng tim đập.
3. **Jumpscare**: phát hiện vào toà nhà (`World.bldAt` đổi từ null → toà, bỏ nhà khởi đầu / nhà của người chơi) hoặc vào tầng mới (`G.inInterior`): nếu có quái trong toà trong 180 px mà người chơi chưa thấy → (a) hitstop 0.12 s, (b) `Sfx18.play('scare')` (thêm case mới: tiếng rít + bass), (c) chớp trắng-đỏ, (d) rung 9, (e) quái lao tới (tốc độ ×2.2 trong 0.5 s). 25% lần vào nhà có thây ma: thêm 1 con bật ra từ sau cửa. Hồi 60 s. `Bus21.emit('scare')`.
4. Cài đặt (`#settings`): "Tầm nhìn hình nón" (`tt_fov`, mặc định bật), "Jumpscare" (`tt_scare`, mặc định bật). `G.canSee(x,y)` trả true khi tắt.
5. Hiệu năng: đo `G.render` trung bình trước/sau trong harness (ghi số ms); không thêm canvas toàn màn hình mới nếu tái dùng được canvas ánh sáng 1/3 độ phân giải.
6. Test: quái sau lưng không được vẽ (bọc draw đếm), trước mặt có; bóng đứng sau lưng → quái gần bóng hiện; vào nhà có thây ma → scare kích hoạt 1 lần và hồi 60 s; tắt cài đặt → như cũ.

## 13. Gói CY — Tinh thể hạng E–S (`js/v22crystal.js`)

1. **Vật phẩm** `cry_E..cry_S`: sl "Tinh thể mana hạng E…S"; md "Lõi năng lượng cấp E…S"; tt "Linh Thạch Hạ Phẩm / Trung Phẩm / Thượng Phẩm / Cực Phẩm / Tinh Phách / Hỗn Độn Tinh Phách". Icon `i22_cry_<rank>_<mod|tt>`.
2. **Mỏ tinh thể trong Cổng**: bọc `World.genDungeon`: thêm cuối block 1–3 khối `n22_cry_<rank>_<style>` mỗi phòng (theo `h3(x, y, dg.seed)` — phòng giống nhau giữa các cổng nên phải dùng seed của cổng), hạng = hạng cổng 75%, cao hơn 1 bậc 12%, thấp hơn 13%. Mỗi khối 2–4 lần khai thác.
   - **Người chơi**: E "Khai thác tinh thể" 2.2 s (cuốc: `G.toolMul('mine')` nhanh hơn); hạng cần cuốc: E–D tay/ cuốc bất kỳ, C–B cuốc sắt (`toolTier('mine')≥2`), A–S cuốc tinh thể (≥3). Thiếu → "Cần cuốc tốt hơn". Ra 1–2 viên vào túi.
   - **Bóng**: chế độ mới `s.mode = 'mine'` (như 'wood' của v14.js:197-260): đi tới khối gần trong leash, đào 3.5 s/viên, đưa thẳng vào túi người chơi; nút "Khai thác" trong tab Binh đoàn (bọc UI v21army) và menu Phân công đội. **Đồng đội** (recruits/companions đang đi theo): nút "Khai thác" trong menu đồng đội → tự đào khối gần khi không có quái trong 300 px.
3. **Đổi tinh thể lấy tiền**: tab Hệ thống "Tinh thể" (`SYS.addTab`, order 52): giá E 6, D 18, C 50, B 130, A 340, S 900 (`cur().name`); thương nhân mua cùng giá ×0.9.
4. **Tu tiên lên cấp bằng linh thạch** (`RL.id==='tt'`): EXP giết quái ×0.3; "Hấp thụ" linh thạch (dùng vật phẩm / nút trong tab): EXP = [40, 140, 450, 1400, 4200, 12000][hạng] × (1 + 0.02·INT), kênh 1 s. Chỉ hấp thụ hạng ≤ hạng hiện tại + 1 (quá → "Kinh mạch không chịu nổi").
5. **Hạng người chơi** `G.playerRank()`: cấp 1–9 E, 10–19 D, 20–29 C, 30–39 B, 40–49 A, 50+ S. **Lên hạng** (đột phá ở cấp 10/20/30/40/50) cần thêm 5 tinh thể đúng hạng mới (D, C, B, A, 3 S) — bọc ngoài `G.breakthrough` + giao diện tab Đột phá (bọc `UI.buildBase` khi `baseTab==='bt'`), trừ khi thử (thành công hay thất bại). Hiện hạng trong tab Trạng thái ("Thợ săn hạng D", tt "Cảnh giới …", md "Cấp sinh tồn D").
6. Test: vào cổng hạng C giả (dùng `G.enterGate` với prop giả hoặc gọi `World.enterDungeon` như v20), đếm khối tinh thể và hạng; khai thác bằng tay/cuốc; bóng chế độ mine đào được; tt: hấp thụ cho EXP; đột phá cấp 10 thiếu cry_D bị chặn.

## 14. Gói X — Assets vòng 22 (hợp đồng tên — mọi gói code theo bảng này)

| Nhóm | Tên | SL |
|---|---|---|
| Quái mới | `m22_{md,tt,sl}_{leaper,shielder,burrower,summoner,charger,healer}` | 18 |
| Thây ma | `z22_mod_{office,nurse,police,soldier,worker,bloat}`, `z22_sl_{hsword,hmage,htank}`, `z22_md_{screamer,mutant}`, `z22_tt_{villager,guard,sword,talisman,elder}`, `z22_{md,tt,sl}_king` | 19 |
| Tướng Quỷ | `dg22_0..dg22_11` (thứ tự DEMONS: Mộ Phệ, Xích Viêm, Hư Vô, Huyết Mẫu, Tật Phong, Bất Diệt, Nguyệt Linh, Thực Hồn, U Minh, Cốt Mẫu, Phá Quân, Thiên Hạ) | 12 |
| Prop cơ chế | `mp22_{sprout,mirror,pylon,totem,brazier,urn,egg,shard}` | 8 |
| Đổ nát | `r22_mod_{rubble1,rubble2,rubble3,wallh,wallv,carwreck1,carwreck2,bus,pole,crater,trash,sofa}`, `r22_tt_{rubble,pillar,lantern,cart,roofdebris,stones}` | 18 |
| Xây dựng | `b22_{mod,tt}_{wall_wood,wall_stone,wall_metal,door,bed,chest,bench,furnace,tparray,defarray}`, `b22_{campfire,torch,fence,spikes,stairs_up,stairs_down,floor_wood}` | 27 |
| Icon vật phẩm | `i22_{club,axe_stone,pick_stone,pick_iron,pick_crystal,spear_stone,sword_iron,axe_iron,torch,fiber,stone,flint,ore_iron,ingot,stick,leather,bone,cloth,mcore,rope,armor_leather,armor_iron,helm_leather,food_cooked}`, `i22_cry_{E,D,C,B,A,S}_{mod,tt}` | 36 |
| Khối tinh thể | `n22_cry_{E,D,C,B,A,S}_{mod,tt}` | 12 |
| Nội thất mới | `f22_mod_{gaspump,schooldesk,blackboard,policecar,firetruck,forklift,pallets,machine,pews,altar,locker,cellbars,vault,cinemaseats,silo,tractor,bunkbed,sandbags}`, `f22_tt_{dummy,weaponrack,anvil,drum,buddha,incense,cart,scrollrack,teatable,herbbasket}` | 28 |
| Cây/đá địa hình | `t22_{palm,deadtree,wheat,rice,hay,redpillar,acacia,tundrashrub,reeds,bamboo,mangrove,cactus2}` | 12 |
| Texture | `tex22_roof_{1..10}`, `tex22_roofdmg`, `tex22_{sand,farm,paddy,redrock,savanna,tundra,asphalt,rubble}` | 19 |

Màu hạng tinh thể: E xám, D xanh lá, C xanh dương, B tím, A cam, S đỏ (giống `RANK_COL`).

## 15. Thứ tự & tích hợp

1. Song song: X (công cụ ảnh) + 12 gói code. Claude chạy sinh ảnh ngay khi X xong.
2. Claude duyệt từng báo cáo, chạy test toàn bộ 3 thế giới, kiểm tra trực quan 812×375, sửa xung đột (nhiều gói cùng bọc `Enemy.prototype.update/draw`, `G.hurtTarget`, `G.die`, `G.spawnEnemy`, `World.genOver`).
3. Cập nhật `artifact.html`, `sw.js` (VERSION), README; hỏi chủ dự án trước khi commit/đẩy/đăng.
