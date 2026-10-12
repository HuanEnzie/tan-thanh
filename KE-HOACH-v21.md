# KẾ HOẠCH v21 — Hệ thống đầy đủ, Binh đoàn bóng, độ khó, thế giới đa dạng

Tài liệu này vừa là kế hoạch cho người chơi/chủ dự án, vừa là **đặc tả cho các agent code**. Mỗi gói = 1 file JS mới, 1 agent phụ trách. Không agent nào sửa file của gói khác.

## 0. Tổng hợp yêu cầu → gói việc

| # | Yêu cầu của chủ dự án | Gói | File |
|---|---|---|---|
| 1 | Mở lại thế giới thường (md) và tu tiên (tt) | R | `js/v21realm.js` (+ sửa nhỏ `realms.js`, `v20.js`, `v20dk.js`) |
| 2 | Lên kế hoạch vẽ assets còn thiếu | X | `tools/make_prompts21.py`, `tools/gen21.sh`, `tools/build21.py`, `js/atlas21.js` |
| 3 | Hệ thống mở ở bất kỳ đâu + **nút mở Hệ thống** | S | `js/v21sys.js` (lõi: `js/v21core.js`) |
| 4 | Binh đoàn bóng phân cấp Quân vương → 2 Thủ lĩnh → 2 Tinh anh → 4 lính; gọi 1 đội / 1 bóng | A | `js/v21army.js` |
| 5 | Mỗi bóng chiếm sức chứa mana, gọi bóng tốn mana + hiệu ứng ARISE | A | `js/v21army.js` |
| 6 | Nút phân công 1 đội đi làm việc | A | `js/v21army.js` |
| 7 | Lục đồ trong hộp, bụi cây, tinh thể… ; phát hiện rương → báo + bản đồ + chỉ đường/dịch chuyển | L | `js/v21loot.js` |
| 8 | Icon căn cứ khó nhìn | H (+X vẽ) | `js/v21hud.js` |
| 9 | Đột phá có thể thất bại (giảm máu/mana một thời gian, EXP cấp hiện tại về 0); EXP lên cấp phải khó dần | P | `js/v21prog.js` |
| 10 | Kỹ năng khác không hiện, phải bấm V | H | `js/v21hud.js` |
| 11 | Thủy quái vẫn tự sinh, không chui ra từ Cổng | W | `js/v21sea.js` |
| 12 | Lão Phác bán đồ đa dạng hơn | M | `js/v21shop.js` |
| 13 | Tự bán đồ cho Hệ thống, không cần Lão Phác | M | `js/v21shop.js` |
| 14 | Hệ thống đầy đủ như trong truyện (nhiệm vụ ngày, vùng phạt, nhiệm vụ khẩn cấp/ẩn, danh hiệu, điểm danh, cửa hàng điểm) | S + Q + M | `v21sys.js`, `v21quest.js`, `v21shop.js` |
| 15 | Bóng quá mạnh, lên cấp quá nhanh, thuốc/bom/cuộn dịch chuyển vô dụng | A + P | `v21army.js`, `v21prog.js` |
| 16 | Công trình đa dạng: bệnh viện, TTTM, quán ăn, cầu đường, nội thất; đồ rơi hợp từng loại | B1 | `js/v21world.js` |
| 17 | Địa hình: đại dương, núi băng, núi tuyết, rừng nguyên sinh | B2 | `js/v21terrain.js` |

Nghiên cứu "Hệ thống" trong truyện (Solo Leveling, The Gamer, Toàn Trí Độc Giả, Overgeared, truyện hệ thống Trung/Việt) đã được tổng hợp; các cơ chế được chọn nằm ở gói S/Q/M/P/A bên dưới.

## 1. Luật chung cho mọi agent (BẮT BUỘC)

- Repo: `C:\Users\user\Downloads\Huân\game`. JS thuần, script cổ điển nạp theo thứ tự trong `index.html`. File sau **bọc** (wrap) hàm của file trước:
  ```js
  (function () { const o = G.fn; G.fn = function (...a) { /* trước */ const r = o.apply(this, a); /* sau */ return r; }; })();
  ```
- **Chỉ tạo/sửa file của gói mình.** Không sửa file khác trừ khi mục của gói ghi rõ "được phép sửa". Không đọc `js/bundle.js` (file sinh tự động, 1.4 MB). Không commit git.
- Thứ tự nạp v21 (đã có sẵn thẻ script, file đã có stub): `v21core, v21sys, v21prog, v21army, v21hud, v21shop, v21quest, v21loot, v21sea, v21world, v21terrain, v21realm`.
- **Lõi `js/v21core.js` (đã viết, không sửa)** cung cấp:
  - `R21({md, tt, sl})` → giá trị theo thế giới hiện tại. Mọi chữ hiển thị khác nhau giữa thế giới phải đi qua `R21`.
  - `SYS.addTab({id, icon, name, order, render(body), badge()})`, `SYS.open(id)`, `SYS.close()`, `SYS.isOpen()`, `SYS.refresh()`, `SYS.msg(text, kind)` (kind: `info|quest|warn|reward`).
  - Lớp CSS có sẵn trong bảng Hệ thống: `.s21row` (hàng flex), `.grow`, `.muted`, `h3`.
  - `G.sys()` (trạng thái lưu trong `G.v10.sys`), `G.spAdd(n, why)`, `G.spPay(n)`, `spName()`, `today21()` (ngày thật YYYY-MM-DD), `esc21(s)`.
  - `Bus21.on(evt, fn)` / `Bus21.emit(evt, ...)`. Sự kiện chuẩn: `search(prop)` (L phát khi lục xong 1 vật không phải rương), `chestFound(rec)` (L), `bt(ok)` (P), `summon(n)` (A), `penalty(on)` (Q).
  - Phím **N** mở/đóng Hệ thống (đã làm trong lõi).
- Trạng thái lưu game: đặt trong `G.v10.<khóa của gói>` (cả `G.v10` được lưu tự động). Khởi tạo lười bằng hàm getter, ví dụ `const armyState = () => G.v10.army || (G.v10.army = {...})`. **Không bao giờ** lưu tham chiếu tới entity/prop (JSON bị vòng lặp) — chỉ lưu số, chuỗi, id, toạ độ.
- DOM & CSS: tạo bằng JS khi file nạp; CSS chèn qua 1 thẻ `<style id="v21<gói>-css">`. Tiền tố id/class theo gói (`a21-`, `q21-`…). Bố cục phải dùng được ở **điện thoại ngang 812×375** và desktop.
- Chữ hiển thị: tiếng Việt có dấu. Không dùng `prompt()`/`alert()` (bị chặn trong artifact) — dùng `UI.askName`, `UI.menuDialog`, `SYS.msg`, `G.toast`.
- Co-op: mọi tick logic mới bỏ qua khi `typeof Net !== 'undefined' && Net.active && Net.guest`.
- Thời gian game: `G.time` (giây, được lưu). Khung hình: `G.frame`. Tick theo khung: bọc `G.v5Tick(dt)` (được gọi mỗi khung khi đang chơi).
- Kiểm thử: server dev đã chạy ở cổng 8766. Chạy
  ```bash
  cd "/c/Users/user/Downloads/Huân/game"; ONLY=<gói> node tools/smoke21.mjs sl <file_test.js> 600
  ```
  `ONLY=army` → chỉ nạp `v21core` + `v21army` (các module khác được trả rỗng). File test là thân một hàm async chạy trong trang (có sẵn `sim(n, keys)` để chạy n khung, `G`, `UI`, `SYS`…), `return` một object để in ra. Đặt file test trong scratchpad của bạn, không đặt trong repo. Chạy thêm `node --check js/v21<gói>.js`. Test cả `md` và `tt` nếu gói có chữ theo thế giới.
- Báo cáo cuối (≤ 400 từ): đã làm gì, các hàm đã bọc (file:dòng gốc), khóa lưu mới, kết quả test (dán dòng kết quả), việc còn dở/rủi ro.

## 2. Gói S — Bảng Hệ thống (`js/v21sys.js`)

Mục tiêu: người chơi luôn thấy và mở được Hệ thống ở mọi nơi; Hệ thống gom mọi chức năng.

1. **Nút HỆ THỐNG trên HUD** (desktop + cảm ứng): nút luôn hiện, viền xanh phát sáng `#4fc3ff`, biểu tượng `◈` + chữ nhỏ "HỆ THỐNG" (tt: "THIÊN ĐẠO"). Đặt ở góc trên, không đè minimap/thanh máu (đọc `index.html` HUD và `css/style.css`, `css/v2.css` để tìm chỗ trống; kiểm tra ở 812×375 và 1280×720). Bấm → `SYS.open()`. Có chấm đỏ khi có tab nào `badge()` trả giá trị (kiểm tra mỗi 60 khung).
2. **Menu ☰ trên điện thoại**: chèn nút `data-a="system"` vào `#tmore` (giống các nút khác, xem `touch.js:22-28`) → `SYS.open()`.
3. **Tab "Trạng thái"** (`id:'status', order:10`): tên, chức nghiệp (`clsName(G.v10.cls)`), cấp, thanh EXP (`P.xp / G.xpNeed(P.level)`), Máu, `manaName()` hiện tại/tối đa (`G.v10.mana`, `G.maxMana()`), 4 thuộc tính (`attrName(k)`, `G.attr(k)`) với nút `+` gọi `G.addAttr(k,1)` khi `G.v10.pts > 0`, số điểm chưa phân. Nếu đang bị chặn cấp (`G.btBlocked && G.btBlocked()`) hiện dòng cảnh báo + nút "Đột phá" → `SYS.close(); UI.openBase('bt')`. Danh hiệu đang mang: `G.titleName ? G.titleName() : '—'` (gói Q cung cấp). Hiệu ứng xấu đang dính: `G.debuffText ? G.debuffText() : ''` (gói P cung cấp).
4. **Tab "Căn cứ"** (`id:'base', order:60`): các nút lớn mở thẳng các mục cũ: Công trình/Lò rèn/Bếp/Nhiệm vụ treo thưởng/Đột phá → `SYS.close(); UI.openBase('build'|'forge'|'kitchen'|'bounty'|'bt')`. Thêm dòng mô tả cấp căn cứ.
5. **Tab "Điểm danh"** (`id:'checkin', order:20`): theo ngày thật `today21()`. Chu kỳ 7 ngày; bỏ lỡ 1 ngày → về ngày 1. Thưởng: N1 50 tiền + 2 điểm HT; N2 `bandage`×3; N3 5 điểm HT; N4 `medkit`×2; N5 `scroll`×1; N6 `bt_a`×2; N7 `mystery`×1 + 10 điểm HT. Phát bằng `G.give(id,n)` (tiền: `P.gold += n`), điểm bằng `G.spAdd`. `badge()` = true nếu hôm nay chưa điểm danh. Lưu `G.sys().ci = {last, streak}`. Khi vào game lần đầu trong ngày: `SYS.msg('Hôm nay chưa điểm danh…','quest')` (1 lần).
6. Gói tân thủ (một lần): trong tab Điểm danh, nút "Nhận gói tân thủ": `bandage`×5, `medkit`×2, `scroll`×2, 100 tiền, 5 điểm HT. Lưu `G.sys().newbie=1`.
7. Sửa chữ cũ: toast "nhấn [N] mở Hệ thống" giờ đã đúng (N mở Hệ thống). Đổi tiêu đề bảng `#base` thành "🏠 CĂN CỨ — Hệ thống" không cần.
8. Test: mở bằng nút HUD (click DOM), bằng N (`UI.key` không xử lý N — gửi `window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyN'}))`), điểm danh 2 lần cùng ngày (lần 2 bị từ chối), giả lập ngày khác bằng cách sửa `G.sys().ci.last`.

## 3. Gói P — Tiến trình & độ khó (`js/v21prog.js`)

1. **Đường cong EXP**: thay `G.xpNeed(l)` (game.js:506) bằng `Math.round(80 + 40*l + 6*Math.pow(l, 2.35))`. (Cũ: L10 871, L20 2034, L30 3442. Mới: L5 ≈ 543, L10 ≈ 1823, L20 ≈ 7750, L30 ≈ 19000, L50 ≈ 60900.)
2. **Bóng/đồng minh hạ quái chỉ cho 35% EXP**: bọc `G.killEnemy(z, src)`; nếu đòn kết liễu từ đồng minh (`src === 'ally'` hoặc cờ tương đương — đọc game.js:330-360 để xác định) thì trong lúc gọi bản gốc đặt cờ `G._xpAlly = true` và bọc `G.addXp` để nhân 0.35 khi cờ bật. Đòn của người chơi giữ 100%.
3. **Đột phá có thể thất bại** — bọc ngoài cùng `G.breakthrough` (bản sống ở v15.js:200-222, gốc v6.js:290-308; đọc kỹ để biết khi nào thiếu nguyên liệu).
   - Tỉ lệ thành công, `t = bậc sắp lên (level/5)`: `base = clamp(0.88 - 0.07*(t-1), 0.35, 0.95)`; `+0.12` nếu dùng chất xúc tác (ô `#btBoost` đã tích và có `bt_c`); `+0.10` mỗi viên `bt_pill` người chơi chọn dùng (tối đa 2); `+0.06` mỗi lần thất bại liên tiếp trước đó (tối đa +0.30); `+0.003*INT`. Kẹp tối đa 0.97.
   - Khi thất bại: trừ toàn bộ `bt_a` cần, `floor(bt_b/2)`, tiền, xúc tác và đan đã chọn; **`P.xp = 0`**; dính "Phản phệ" 600 giây game: **máu tối đa −30%** (trừ trực tiếp `P.maxHp`, lưu lượng đã trừ trong `G.v10.prog.deb = {until, dHp}`, kẹp `P.hp`), **mana tối đa −30%** (bọc `G.maxMana` nhân 0.7 khi còn hiệu lực). Hết giờ → cộng lại `dHp`. Đang Phản phệ thì không cho đột phá ("Kinh mạch chưa hồi phục"). Chữ theo thế giới: sl "THĂNG CẤP THẤT BẠI — Phản phệ ma lực", tt "ĐỘT PHÁ THẤT BẠI — Tẩu hỏa nhập ma", md "TIẾN HÓA THẤT BẠI — Cơ thể đào thải". Rung màn hình, chớp đỏ, `SYS.msg(...,'warn')`, `Bus21.emit('bt', false)`. Thành công → `Bus21.emit('bt', true)`, reset đếm thất bại.
   - Giao diện: bọc `UI.buildBase`; khi `UI.baseTab === 'bt'` chèn vào `#baseBody` dòng "Tỉ lệ thành công: X%" (cập nhật khi tích xúc tác) và bộ chọn "Dùng Đan Phá Cảnh: 0/1/2" (chỉ hiện nếu `ITEMS.bt_pill` tồn tại; số có `P.inv.bt_pill`). Sửa chữ cũ "+20 máu, +4% sát thương" (v6.js:306, v6.js:962) nếu chèn được bằng wrapper; không sửa file cũ.
   - Cung cấp `G.debuffText()` → chuỗi như "Phản phệ 7:12" hoặc '' ; thêm huy hiệu đỏ nhỏ cạnh thanh máu (`#hpRow`) khi đang dính.
4. **Dịch chuyển có giá**: bọc `G.teleport(tp)` (v5.js:220). Miễn phí nếu người chơi đứng trong 160 px quanh một điểm trong `G.tpList()` (căn cứ, tượng đã thức tỉnh, trạm đã mở — kiểm tra trường toạ độ thực tế `x/y` hay `gx/gy`). Ngược lại phải tiêu 1 `scroll` (Đá hồi hương / Cuộn truyền tống, tên qua `itm('scroll').name`); không có → `SYS.msg('Chỉ dịch chuyển miễn phí khi đứng ở Trạm/Tượng/Căn cứ. Cần 1 … để dịch chuyển từ đây.','warn')` và không đi. Cung cấp `G.tpCostText(tp)` → '' hoặc "tốn 1 Đá hồi hương"; bọc phần cập nhật nút `#mapTp` (v5.js ~722-727) để thêm chữ đó vào nhãn nút. Dùng cuộn (U) vẫn về nơi trú ẩn như cũ.
5. **Vật phẩm phụ trợ có giá trị lại**: (đọc `G.useHeal` play.js:271-288 + v14b.js:234-238, `ITEMS` data.js:2-24)
   - Hồi máu theo % máu tối đa: medkit `65 + 30%`, bandage `22 + 10%`, pills `12 + 6%` (cách làm an toàn: bọc `G.useHeal`, tạm gán `ITEMS[id].heal` theo `P.maxHp` rồi trả lại sau khi gọi bản gốc).
   - Lựu đạn & bom xăng: tìm hàm nổ/cháy (grep `grenade`, `molotov`, `explode`, `fire` trong play.js/game.js/entities.js). Sát thương × `(1 + 0.07*(level-1))`, × 1.6 lên boss/mini-boss/lord (bom không bị giảm như bóng). Nếu sát thương lửa là DoT trên vùng, nhân cả DoT.
   - Hồi máu tự nhiên (nếu có, grep `regen`): giảm 50% khi có quái `chase` trong 400 px.
6. Test: in `G.xpNeed` các mốc; giả lập kill bởi ally và bởi player so EXP; ép thất bại đột phá (gán `Math.random = () => 0.999` tạm thời) kiểm tra P.xp=0, maxHp giảm, maxMana giảm, hết hạn thì hồi lại (tăng `G.time`); teleport khi xa trạm có/không có scroll.

## 4. Gói A — Binh đoàn bóng (`js/v21army.js`)

Bối cảnh mã (đã khảo sát): `G.v10.shadows[]` mỗi phần tử `{id,name,tier,img,scale,r,upright,key,lvl,kills,cd,nick,mode,job,exp,aqua,...}`; tier ∈ `normal|elite|mini|boss` (`SH_TIER` v10.js:11). Gọi 1 bóng: `G.summonShadow(s, free)` (chuỗi bọc v19.js:65 → v11.js:252 → v10.js:97) trả `'ok'|'active'|'cd'|'mana'|'busy'|'land'`. Gọi tất cả: `G.summonAll()` (v15.js:238, bọc v19.js:72). Thu hồi: `G.recallShadow(s)`, `G.dismissAll()`. Ally đang ra trận: `G.shadowAlly(s)`. Giao việc: `G.setJob(s, kind)` (v11.js:54, kind ∈ `SH_JOBS` v11.js:9). Khám phá: `G.exploreTo`. UI cũ: Túi đồ › tab bóng `UI.buildShadows` (v11ui.js:41, bọc v19.js:136). Sức chứa ô: `G.shadowCap()` (v14.js:207). Thu phục: `G.extractShadow(c)` (v10.js:122). Hồi chiêu chết: `SHADOW_CD=25` (v10.js:464-467). Chỉ số: `G.shStats(s)` (v10.js:88, bọc v14.js:211, v20dk.js:257).

Tên cấp theo thế giới (dùng `R21`): sl `Lính / Tinh anh / Thủ lĩnh / Quân vương`; md `Xác sống / Xác tinh anh / Đội trưởng xác / Vua xác`; tt `Quỷ tốt / Quỷ tinh / Quỷ tướng / Quỷ vương`.

1. **Phân cấp**: mỗi bóng có `s.lead` = id cấp trên trực tiếp (hoặc không có = Dự bị). Luật: `normal` dưới `elite` (tối đa 4), `elite` dưới `mini` (tối đa 2), `mini` dưới `boss` (tối đa 2), `boss` không có cấp trên. Một **đội** = bóng có tier khác `normal` + toàn bộ cấp dưới: Tiểu đội (elite, 5), Đại đội (mini, 11), Quân đoàn (boss, 23). Dọn dẹp mỗi lần mở UI/tải game: bỏ `lead` trỏ tới bóng không tồn tại/sai cấp/vượt sức chứa.
   - Nút "Tự sắp xếp": điền chỗ trống theo sức mạnh (`shStats(s).dmg + hp/10`), mạnh nhất vào đội của cấp trên mạnh nhất.
2. **Sức chứa linh hồn (mana)**: `G.soulCap() = G.maxMana()`. Mỗi bóng chiếm: normal 4, elite 10, mini 24, boss 50 (`ARMY_LOAD`). Thu phục bị chặn nếu tổng + bóng mới > sức chứa (thông báo: "Không đủ sức chứa linh hồn (x/y) — tăng INT/cấp hoặc giải phóng bớt bóng"). Vẫn giữ giới hạn ô `shadowCap()`. Save cũ vượt sức chứa: không xóa gì, chỉ chặn thu phục mới và hiện cảnh báo đỏ trong UI.
3. **Gọi bóng tốn mana theo từng con**: normal 10, elite 22, mini 50, boss 100 (thay `SH_TIER[t].cost`). **Duy trì** khi đang ra trận (mana/giây): normal 0.12, elite 0.3, mini 0.7, boss 1.4. Khi `G.v10.mana` về 0 → mỗi giây thu hồi 1 bóng cấp thấp nhất đang ra trận cho tới khi mana không âm (toast 1 lần mỗi 10 s). Hiện "−X/s" cạnh thanh mana (`#mpRow`).
   - **Giới hạn ra trận cùng lúc**: `6 + floor(level/2) + floor(INT/10)`. Gọi vượt → dừng và báo.
   - **Chết → hồi sinh lâu hơn**: normal 40 s, elite 70 s, mini 150 s, boss 300 s (đặt lại `s.cd` sau khi bản gốc đặt 25 s).
4. **Giảm sức mạnh bóng**: sửa tại chỗ `SH_TIER`: hp 110/210/480/900, dmg 15/24/40/62. Bọc ngoài cùng `G.shStats` để đổi hệ số theo cấp người chơi: hp `(1+0.05L)/(1+0.08L)`, dmg `(1+0.035L)/(1+0.06L)` và hệ số INT `(1+0.012I)/(1+0.02I)`. Thu phục thất bại (bóng tạm 30 s) tính vào giới hạn ra trận.
5. **Hiệu ứng ARISE khi gọi** (đội hoặc tất cả): chữ lớn giữa màn hình `UI.skillFlash(R21({sl:'ARISE!', md:'KHỐNG THI!', tt:'NGỰ QUỶ!'}), SM().col)`, vũng bóng tối (elip tím đen loang rộng dưới chân người chơi 0.9 s), từng bóng trồi lên lần lượt cách nhau 0.07 s (hàng đợi xử lý trong tick, **không** dùng setTimeout) với `FX.pillar` + `Particles.burst` màu `SM().col` và hiệu ứng trồi lên (alpha 0→1 + dịch từ dưới lên 18 px trong 0.5 s: đọc cách vẽ Ally ở entities.js để bọc hàm vẽ hoặc dùng `a.riseT`). Âm `Sound.play('sfx_shadow', 0.9)`. `Bus21.emit('summon', n)`.
6. **Gọi theo đội / theo bóng**:
   - `G.armySummonUnit(leaderId)` gọi cấp chỉ huy trước rồi cấp dưới; `G.armyRecallUnit(leaderId)`.
   - "Đội nhanh": `G.v10.army.quick` = id chỉ huy hoặc null (= tất cả). Phím **K** (và nút `#tShadow`) gọi đội nhanh: bọc `G.summonAll` để nếu có `quick` hợp lệ thì gọi đội đó. Cung cấp `G.armySummonQuick()`, `G.armyQuickName()`, `G.armyCycleQuick()` (vòng: Tất cả → từng chỉ huy) cho gói H gắn nút.
   - Gọi 1 bóng cụ thể: nút "Gọi" trên từng dòng (dùng `G.summonShadow`).
7. **Phân công đội**: nút "Phân công" trên mỗi đội → menu: Thu thập/Săn bắt/Hái thuốc/Đào mỏ (`G.setJob` cho từng thành viên rảnh), Chế độ Chiến đấu/Nhặt đồ/Đốn gỗ (`s.mode` = 'fight'|'loot'|'wood'), "Đi khám phá" (chỉ chỉ huy, dùng luồng chọn bản đồ có sẵn `data-se` v11ui.js:80/108-122), "Gọi cả đội về".
8. **Tab Hệ thống "Binh đoàn"** (`id:'army', order:30`, tên `SM().army`): đầu tab: Ô `n/shadowCap()` • Sức chứa `x/soulCap()` • Ra trận `k/giới hạn` • duy trì `−X/s`. Dạng cây: mỗi Quân đoàn/Đại đội/Tiểu đội là 1 thẻ (viền màu `SH_TIER[t].col`), mỗi dòng bóng: tên (`nick || name`), cấp bậc, `slv`, trạng thái (Sẵn sàng / Đang ra trận / Hồi sinh Xs / Làm việc / Khám phá), nút Gọi · Thu hồi · Chuyển (chọn chỉ huy hợp lệ còn chỗ, hoặc Dự bị) · Đặt tên (`UI.askName`). Nút đội: Gọi cả đội · Thu hồi · Phân công · ★ Đặt làm đội nhanh. Mục "Dự bị" ở cuối. Nút "Tự sắp xếp". Trong Túi đồ › tab bóng cũ, chèn 1 nút "Mở Binh đoàn (Hệ thống)" ở đầu (bọc `UI.buildShadows`).
9. Test: tạo bóng giả bằng cách push vào `G.v10.shadows` (đủ trường như v10.js:131) gồm 1 boss, 2 mini, 4 elite, 16 normal; gán đội; gọi đội; kiểm tra mana bị trừ đúng, giới hạn ra trận, duy trì làm giảm mana, mana về 0 thì thu hồi; chặn thu phục khi quá sức chứa.

## 5. Gói H — Thanh kỹ năng & icon căn cứ (`js/v21hud.js`)

1. **Thanh kỹ năng 4 ô**: `G.v10.skBar = [idx|null ×4]`; mặc định ô 1 = `G.v6.skEq`, các ô còn lại = kỹ năng sở hữu khác (`G.v6.skills` là map idx→cấp; định nghĩa `SKILLS[idx]`, tên `skName(S)`, màu `S.col`; icon: xem cách `#tCastIc` lấy icon ở v10ui.js:9-38 và v7.js:166-178).
   - Thi triển ô i: đặt tạm `G.v6.skEq = idx`, nếu hồi chiêu riêng của ô đã xong thì đặt `G.manaCd = 0`, gọi `G.castMana()`; nếu mana bị trừ (thành công) → `G.v10.skCd[idx] = G.time + 4`, `G.manaCd = G.time + 0.8` (hồi chung). Sau đó trả `skEq` về kỹ năng ô 1.
   - Phím: **V** = ô 1 (giữ như cũ), **Shift+1..4** = ô 1..4. Khi Shift đang giữ và có Digit1-4 vừa nhấn, phải chặn đổi vũ khí (play.js:132 đọc phím số): bọc `G.update` để xử lý trước rồi xóa `Input.pressed['DigitN']`.
   - Hiển thị desktop: hàng nút giữa-dưới, trên `#hotbar`: [Q tuyệt kỹ (hiện % năng lượng `P.energy`)] [ô 1-4: icon, tên ngắn, giá mana, lớp phủ hồi chiêu đếm giây, mờ khi thiếu mana, nhãn phím V/⇧2/⇧3/⇧4] [K Binh đoàn: `G.armyQuickName ? G.armyQuickName() : SM().army`; chuột phải/giữ lâu → `G.armyCycleQuick()`] [J Đổi chỗ]. Bấm chuột = thi triển. Cảm ứng: giữ `#tCast` là ô 1; thêm ô 2-4 cỡ 44 px xếp cạnh cụm nút kỹ năng hiện có, không đè nút khác ở 812×375.
   - Tab Hệ thống "Kỹ năng" (`id:'skills', order:40`): danh sách kỹ năng sở hữu (tên, cấp, giá mana `G.skillCost(idx)`, độ thạo `G.v10.sk`), nút "Gắn ô 1-4".
2. **Icon căn cứ**: hàm `baseBadge(size)` trả canvas: nếu `IMG['ic_base_' + rk(RL.id)]` tồn tại (gói X sẽ vẽ) thì vẽ ảnh đó; nếu chưa có thì vẽ huy hiệu khiên bo tròn màu theo thế giới (sl `#4fc3ff`, md `#6dff7a`, tt `#ffd25a`) + hình mái nhà/cổng thành trắng bằng path, viền đen 2 px (không dùng ký tự ⌂). Dùng ở: bản đồ lớn (thay glyph ⌂ ở v5.js:619 — **được phép sửa đúng dòng đó** để gọi hàm mới nếu tồn tại), danh sách dịch chuyển (`icon` ở v10.js:240 — được phép sửa dòng đó; dòng danh sách render `t.icon` ở v10ui.js:168: nếu là chuỗi HTML thì dùng `<img src=dataURL>`), và thêm dấu căn cứ lên minimap góc (bọc `UI.drawMinimap` như v20.js:284-297).
3. Bỏ chữ cũ sai: "[X] gọi lưu bóng" (v10ui.js:19/62) — X là lướt; nếu chữ nằm trong DOM thì sửa bằng JS lúc nạp.
4. Test: gán 3 kỹ năng giả vào `G.v6.skills`, kiểm tra DOM thanh kỹ năng, Shift+2 thi triển ô 2 mà không đổi vũ khí, hồi chiêu riêng, icon căn cứ vẽ được trên `UI.drawBigMap()`.

## 6. Gói M — Cửa hàng, thu mua, vật phẩm mới (`js/v21shop.js`)

1. **Vật phẩm mới** (thêm vào `ITEMS` + bảng tên theo thế giới mà `itm()` dùng, data2.js:23-61; icon: tìm cách item lấy icon và tạm dùng icon gần nhất, ghi danh sách icon cần vẽ vào báo cáo):
   - `mana_s` — sl "Thuốc hồi Mana", tt "Hồi Linh Đan", md "Nước tăng lực xanh": hồi 40% mana tối đa. Dùng qua `G.useItem` (bọc v3.js:138) và ô dùng nhanh nếu có.
   - `elixir` — sl "Thuốc hồi phục cao cấp", tt "Hồi Xuân Đan", md "Bộ sơ cứu quân y": hồi 60% máu tối đa, xóa `P.slowT`.
   - `bt_pill` — sl "Đá Thăng Hạng", tt "Phá Cảnh Đan", md "Huyết thanh tiến hóa": không dùng trực tiếp; gói P đọc `P.inv.bt_pill` khi đột phá.
2. **Lão Phác (và thương nhân md/tt) bán đa dạng**: hàng xoay vòng theo ngày game + vị trí thương nhân (seed), chia nhóm, có **số lượng giới hạn** mỗi món (theo dõi `G.v10.shop[merchKey][id]`, hết thì nút mờ "Hết hàng"):
   - Hồi phục (3–4 món): bandage, medkit, pills, elixir, mana_s
   - Ăn uống (2–3): food, water, choco, energy
   - Chiến đấu (2–3): grenade, molotov, các loại đạn (theo thế giới có súng — `RL.guns`/ARMED_REALMS)
   - Vật liệu (2–3, số lượng 1–3): scrap, planks, gas, battery, bt_a, bt_b; bt_c hiếm 15%
   - Đặc biệt (1–2): scroll, mystery, heart, bt_pill (30%), bản đồ kho báu `tmap` nếu tồn tại
   - Trang bị: 6 món (thay 4) + 1 "Hàng hiếm hôm nay" (độ hiếm ≥ 3 nếu có thể) giảm 20%.
   - Cách làm an toàn: đọc `UI.openShop`/`buildShop` (v3.js:251-362), `SHOP_GOODS` (v3.js:67), `shopStock` (v3.js:84). Ưu tiên thay nội dung mảng `SHOP_GOODS` tại chỗ trước khi dựng UI và hậu xử lý DOM để thêm số lượng / nút hết hàng / nhãn nhóm. Giá mới theo bảng cũ, món mới: elixir 90, mana_s 35, bt_pill 220, bt_a 30, bt_b 70, bt_c 260.
3. **Tab Hệ thống "Cửa hàng"** (`id:'shop', order:50`): mua bằng điểm HT (`G.spPay`): medkit 6, elixir 15, mana_s 8, scroll 10, bt_pill 30, bt_a 8, bt_b 20, bt_c 60, mystery 25, heart 80. Mỗi món tối đa 3 lần/ngày thật (`today21()`), lưu `G.v10.shop.sys = {day, n:{id:count}}`.
4. **Tab Hệ thống "Thu mua"** (`id:'sell', order:55`): bán ở bất kỳ đâu, giá = 60% giá Lão Phác (dùng cùng công thức bán của buildShop: `SELL_PRICE`, `Loot.price`). Danh sách vật phẩm `P.inv` (trừ tiền, chìa khóa nhiệm vụ) và trang bị trong `P.stash` (không bán đồ đang mặc). Nút "Bán 1", "Bán hết"; nút "Bán đồ thường" (trang bị độ hiếm 0–1); xác nhận 2 bước cho độ hiếm ≥ 3. "Phân giải" trang bị độ hiếm ≥ 3 thành điểm HT: [0,0,0,3,8,20][rarity].
5. Test: mở cửa hàng giả (gọi `UI.openShop` với thương nhân giả theo cách v3.js yêu cầu), mua đến hết số lượng; mua bằng điểm HT vượt 3 lần/ngày; bán trang bị, kiểm tra tiền tăng 60%.

## 7. Gói Q — Nhiệm vụ Hệ thống, vùng phạt, danh hiệu (`js/v21quest.js`)

1. **Nhiệm vụ hằng ngày** — sl "Chuẩn bị để trở nên mạnh mẽ", tt "Tu luyện hằng ngày", md "Huấn luyện sinh tồn". Đổi theo `today21()`. 4 nhiệm vụ: luôn có (a) "Tự tay hạ N quái" (N = 30 + 2×cấp, chỉ tính khi người chơi kết liễu, không tính bóng) và (b) "Di chuyển 1500 m" (đo quãng đường đi bộ/chạy, 32 px = 1 m, không tính khi đi xe/cưỡi/dịch chuyển); + 2 ngẫu nhiên trong: "Đóng 1 Cổng" (bọc `G.exitDungeon` khi `World.dg.cleared`), "Lục soát 10 vật" (bọc `G.lootProp` + nghe `Bus21 'search'`), "Dùng kỹ năng 12 lần" (bọc `G.castMana` & `G.castSkill`, chỉ đếm khi mana/năng lượng thực sự bị trừ), "Lướt 30 lần" (tìm hàm dash play.js:82).
   - Hoàn thành cả 4 → thưởng: 10 điểm HT, `mystery`×1, +1 điểm thuộc tính (`G.v10.pts++`), EXP = 15% `xpNeed(level)`. Nhận bằng nút trong tab.
   - **Vùng phạt**: nếu một ngày có tiến độ > 0 mà không hoàn thành, lần đầu chơi ngày mới (sau 60 s ở overworld) → `SYS.msg` cảnh báo rồi bắt đầu Vùng Phạt 180 s: mỗi 20 s sinh 6–10 quái (`G.spawnEnemy(kind, x, y, {lvl: P.level+3, state:'chase'})`, vòng 350–550 px quanh người chơi, ô đi được), cấm dịch chuyển & dùng cuộn (bọc `G.teleport`, `G.useScroll`), vòng đỏ ở viền màn hình + đồng hồ đếm ngược. Sống sót → 5 điểm HT. `Bus21.emit('penalty', true/false)`.
2. **Nhiệm vụ khẩn cấp**: mỗi 6–12 phút chơi ở overworld (không trong hầm ngục, không trong vùng phạt) chọn 1: "Tiêu diệt 15 quái trong 90 s", "Hạ 1 quái tinh anh trong 120 s" (sinh 1 elite cách 400–600 px, chỉ đường bằng `G.guideTo` nếu có), "Đóng Cổng hạng X gần nhất trong 10 phút" (chỉ khi có cổng đã phát hiện trong `G.v10.gt.list`). Thưởng 3–8 điểm HT + tiền; thất bại → mất 20% EXP hiện có (không xuống cấp).
3. **Nhiệm vụ ẩn** (hiện "???" tới khi mở): "Kẻ săn đơn loài" (100 kill một loài — đọc `G.v10.kc`), "Kẻ sống sót đêm trăng máu" (`G.bloodMoon` kết thúc mà không chết), "Không cần thuốc" (đóng Cổng hạng C+ mà không dùng vật phẩm hồi máu trong hầm), "Kẻ độc hành" (đóng 1 Cổng mà không gọi bóng nào trong hầm), "Thợ săn kho báu" (mở 20 rương). Mỗi cái cho 1 **danh hiệu** + 5–15 điểm HT.
4. **Danh hiệu**: `G.v10.q.titles[]`, `G.v10.q.title` (đang mang 1 cái). Hiệu ứng nhỏ: Kẻ săn đơn loài +5% sát thương lên loài đó; Kẻ sống sót −5% sát thương nhận; Không cần thuốc +10% hồi máu từ vật phẩm; Kẻ độc hành +8% sát thương khi không có bóng ra trận; Thợ săn kho báu +10% tiền từ rương. Cung cấp `G.titleName()`.
5. **Tab Hệ thống "Nhiệm vụ"** (`id:'quest', order:15`): khung kiểu cửa sổ nhiệm vụ Solo Leveling (tiêu đề, danh sách mục tiêu "0/45", cảnh báo "Nếu không hoàn thành sẽ chịu hình phạt"), nhiệm vụ khẩn cấp đang chạy, nhiệm vụ ẩn, danh hiệu (nút Mang). `badge()` = số phần thưởng chưa nhận.
6. **Bảng theo dõi trên HUD**: khung nhỏ dưới minimap: "Nhiệm vụ ngày 2/4" + nhiệm vụ khẩn cấp + đồng hồ; bấm → `SYS.open('quest')`. Thu gọn được.
7. Test: tăng ngày giả (sửa `G.v10.q.day`), giả lập kill player/ally, chạy sim di chuyển, kích hoạt vùng phạt sớm (hàm debug `G.q21Debug`), kiểm tra không dịch chuyển được.

## 8. Gói L — Lục soát & rương (`js/v21loot.js`)

1. **Bụi cây, đá, tinh thể lục được** — không thêm/bớt prop khi sinh thế giới (giữ chỉ số prop cho save cũ). Bọc `World.ensure` (world.js:107-138) hoặc `World.genOver` (bỏ qua khi `World._temp`): sau khi block sinh xong, gán `p.container = 'bush'` cho prop có `img` thuộc bụi cây (`RL.props.bush`, bụi rừng rậm world.js:729, cỏ thuốc `tt_p_0/1`), `'rock'` cho đá (`RL.props.rocks`) — chỉ khi `!p.container`. Thêm bảng `LOOT.bush` (food 35%, bandage 20%, pills 10%, flower 15%, rỗng 30%) và `LOOT.rock` (scrap 25%, gold 15%, rỗng 60%); nhãn tương tác "Lục bụi cây"/"Đập đá" ở `G.findInteract` (game.js:669-701, nhánh nhãn 698). Tinh thể đã lục được ('crystal'). Đảm bảo `World.markLooted` lưu được (prop không `placed`). Bụi đã lục vẽ mờ 0.7 (bọc `drawProp`). `Bus21.emit('search', p)` khi xong.
2. **Phát hiện rương**: mỗi 30 khung quét `World.propsNear(P.x, P.y, R)` với `R = min(900, 420 + 8*level + 4*INT)` tìm prop `kind==='chest'` chưa mở/chưa chết. Mới → lưu `G.v10.loot.known[key]` (key = `mode:x,y` làm tròn) với `{x,y,tier,mode,t}`; `SYS.msg('Phát hiện Rương ' + tên bậc + ' cách ' + m + 'm về hướng ' + dirName(dx,dy) + '. Đã đánh dấu trên bản đồ.','quest')` (dirName ở v20.js:14; tên bậc theo `CHESTS` data2.js:108). `Bus21.emit('chestFound', rec)`. Xóa khi rương được mở (bọc `World.markLooted`) hoặc prop biến mất.
   - Bản đồ: bọc `G.tpAll` (v20.js:181) thêm mục `{x, y, gx, gy, name:'Rương … • vùng', kind:'chest', icon:'📦', col}` cho rương đã biết ở overworld → dịch chuyển tới rương qua nút ✈ có sẵn (gói P tính giá). Minimap: bọc `UI.drawMinimap` vẽ ô vuông vàng.
3. **Chỉ đường**: `G.guideTo(x, y, label)`, `G.guideClear()`; mũi tên ở rìa màn hình chỉ hướng + khoảng cách ("📦 34m"), vẽ trong không gian màn hình (xem cách v13.js gắn DmgNum vào hook `drawEventTint`). Tự xóa khi < 50 px hoặc mục tiêu đã mở. Lưu `G.v10.loot.guide`. Bản đồ: thêm nút "🧭 Chỉ đường" cạnh `#mapTp` cho mục đang chọn (`UI.mapSel`, xem v5.js:715-727) — áp dụng cho mọi loại mục (cổng, hang quỷ, rương, trạm).
4. Test: đặt 1 rương bằng `World.chest(tx,ty,tier)` gần người chơi, chạy sim → có `known`, có `SYS.msg`, `G.tpAll()` có mục chest; lục bụi cây (tìm 1 prop bush, gọi interact), kiểm tra `markLooted`.

## 9. Gói W — Thủy quái từ Cổng biển (`js/v21sea.js`)

1. Tắt `G.seaDirector` (v17water.js:72-92) khi overworld + chơi đơn (giống v20.js:175-176); co-op giữ nguyên.
2. **Cổng biển**: bọc `G.spawnGate(forceRank)` (v20.js:101): nếu trong bán kính tìm (`gatePlace`) có nhiều nước sâu, 30% thử đặt cổng biển trước: hàm `gatePlaceSea(rank)` tìm ô `T.DEEP` sao cho vùng 5×5 ô quanh đều WATER/DEEP, cách người chơi 650–(1500+I·380) px, cách cổng khác ≥ 800. Bản ghi `rec.sea = 1`. Thông báo "Cổng Biển hạng X vừa mở…". Prop cổng (`World.gateProp`) đặt trên nước, ánh sáng xanh ngọc; `gateGround` an toàn trên nước.
3. **Quái từ cổng biển**: bọc `G.gateMonster(r)` (v20.js:121): nếu `r.sea` thì sinh bằng `seaSpawn(kind, x, y)` (v17water.js:60) với loại theo hạng: E [0,1], D [0,1,5], C [0,2,5], B [2,3,5], A [2,3,5], S [3,2] (+ 10% một lần loài 4 nếu chưa có); gán `z.gateId = r.id; z.gh = {x:r.x, y:r.y}`; cấp như `gateMonster`.
4. Vào cổng biển: đảm bảo tương tác E hoạt động khi bơi hoặc đi thuyền trong 60 px (nếu đang trên thuyền thì xuống thuyền tự động trước khi `enterGate`). Hầm ngục như cổng thường.
5. Cổng biển chưa xong được cài lại khi block nạp lại (v20.js:57-63 đã lo — kiểm tra lại với cổng trên nước).
6. Test: dịch người chơi tới gần biển (tìm ô DEEP bằng `World.waterAt` quét vòng tròn bán kính tăng dần từ gốc > 112 ô), ép `G.spawnGate()` với `Math.random` cố định, kiểm tra `rec.sea`, chạy `G.gateTick` sinh quái `aqua`, không còn quái biển tự sinh.

## 10. Gói B1 — Công trình & nội thất (`js/v21world.js`)

Ràng buộc save cũ: chỉ số prop = thứ tự `addProp` trong block. **Chỉ thêm prop vào CUỐI** (bọc `World.genOver` sau khi bản gốc chạy xong, bỏ qua `World._temp`), hoặc thay cách sinh của block **chỉ khi block đó chưa có delta** (`World.delta` không có khóa của block — đọc world.js:139-148 để biết tên/kiểu).

1. **Loại công trình mới** (chọn bằng hash thuần `h3(sx, sy, 2101)` — không tiêu `SR` — ở khối zone 2/1 chưa có delta, thay genTown/genVillage của block đó):
   - **Bệnh viện** (zone 2, ~8%): tòa lớn ~16×11 ô, có phòng bệnh (giường), phòng thuốc (tủ thuốc), sảnh (quầy). Container loot `'medical'` (LOOT.medical có sẵn, game.js:10-21: thêm `mana_s`, `elixir` nếu tồn tại). Tên: md "Bệnh viện", sl "Bệnh viện Hiệp hội", tt "Y Quán".
   - **Trung tâm thương mại** (zone 2, ~6%): tòa rất lớn ~24×18 ô, chia gian hàng: quần áo (loot giáp), điện máy (battery, scrap), tạp hóa (food, water, choco, energy), thể thao (vũ khí cận chiến), nhà thuốc. tt: "Thương Hội" (sạp lụa, gốm, dược liệu). sl/md: "Trung tâm thương mại".
   - **Quán ăn** (zone 1–2, ~10%): bàn ghế, bếp, tủ lạnh (container: food, water, gas). tt "Tửu Lâu", sl/md "Quán ăn".
   - Dùng `World.makeBuilding(x0,y0,x1,y1,{type,name,floor,doors,rooms,containers,loot,cimg})` (world.js:452-513), đặt `b.type`.
2. **Nội thất** (CHỈ thêm cuối, mọi tòa nhà kể cả nhà cũ): theo `b.type` đặt vật trang trí/container trong ô sàn trống (`World.free`), solid hợp lý, không chặn cửa (chừa 1 ô trước mỗi cửa). Tên sprite theo hợp đồng ở mục 13 (`f21_<style>_<item>`, style = `rk(RL.id)==='tt' ? 'tt' : 'mod'`). **Chỉ đặt khi `IMG[tên]` đã tồn tại** (ảnh sẽ có sau khi gói X chạy) — trước đó không đặt gì. Container nội thất dùng `container:` với bảng loot phù hợp (tủ lạnh → food/water; tủ thuốc → medical; kệ hàng → market; tủ quần áo → giáp…).
3. **Cầu**: sau genOver, ô `T.ROAD` mà `World.waterAt(gx,gy) !== 0` → đổi sang tile mới `T.BRIDGE` (thêm vào `T` + `BIOME_TEX`/bảng texture: dùng `tex21_bridge` nếu có, không thì vẽ như ROAD) và thêm prop lan can `b21_rail_h`/`b21_rail_v` (nếu IMG có) dọc hai mép cầu (thêm cuối). Tile mới phải đi được (không thuộc `isSolidT`).
4. Test: tìm 1 block zone 2 bằng `World.zoneOf`, ép sinh (`World.ensure`) ở chế độ test, đếm building theo type; với IMG giả (`IMG['f21_mod_bed'] = IMG[<một ảnh có sẵn>]`) kiểm tra nội thất được đặt và không chặn cửa.

## 11. Gói B2 — Địa hình mới (`js/v21terrain.js`)

1. **Biome mới** (thêm vào `BIOMES` data2.js:120-133 + `MINI_COL`, `BIOME_TEX`, `WONDERS` nếu bắt buộc 1-1 — đọc world.js:208-209; bọc `World.biomeAt` world.js:190-200):
   - `icepeak` **Núi băng**: nền `T.ICE`/`T.SNOW`, vách đá băng là tile rắn mới `T.CLIFF` (thêm vào `isSolidT` bằng cách bọc `World.isSolidT`), cột băng `b21_ice_spire` (rắn), tinh thể băng `b21_ice_crystal` (container 'crystal'). Lạnh: ban đêm −1 máu/3 s nếu không ở gần lửa (prop `light` lửa) — tùy chọn.
   - `snowmt` **Núi tuyết**: nền SNOW, sống núi bằng `T.CLIFF` dạng dải (noise ridged) có đèo đi qua, thông tuyết `b21_snow_pine`, đá tuyết `b21_snow_rock`.
   - `primeval` **Rừng nguyên sinh**: cây cổ thụ `b21_prim_tree` (canopy, rắn gốc), dây leo/dương xỉ `b21_prim_vine`, `b21_prim_fern` (không rắn), khúc gỗ `b21_prim_log`, bụi thuốc `b21_herb_bush` (container 'bush'), `dark: 0.2`, mật độ cây cao.
   - Vị trí: chỉ ở xa gốc (≥ 4 vùng = 24 superblock) để không đổi khu người chơi cũ đã đi; dùng noise riêng (độ cao) để núi thành dải liền.
   - Prop/texture chưa có ảnh → dùng prop tương tự có sẵn (cây thông của snow, đá `RL.props.rocks`, cây forest) cho tới khi gói X vẽ xong; kiểm tra `IMG[...]` lúc sinh.
2. **Đại dương**: `World.waterAt` (world.js:74-82) là hàm thuần; thêm "lòng đại dương": ở các vùng (6×6 superblock) có `h3(rx, ry, 2102) % 7 === 0` và cách gốc ≥ 4 vùng → nước sâu rộng với vài đảo (noise). Bọc `World.waterAt`. Kiểm tra biển không cắt qua block có POI (`Story.poiAt`, DK.sites của v20dk) — nếu có thì trả 0 trong block đó.
3. Test: quét `World.biomeAt` trên lưới lớn đếm số block mỗi biome mới; `World.ensure` một block icepeak/primeval không lỗi; người chơi không kẹt (ô spawn đi được).

## 12. Gói R — Mở lại thế giới thường & tu tiên (`js/v21realm.js`)

1. **Được phép sửa**: `js/realms.js:149` → `const REALM_ORDER = ['md', 'tt', 'sl'];` (giữ comment), `js/v20.js:117-118`, `js/v20dk.js:16, 117, 145`.
2. Chữ chỉ có ở sl đang hiện ở mọi thế giới: "[HỆ THỐNG]" cứng (v20dk.js:117, 145) → `R21(SYS_TAG)`; "dao động mana" (v20.js:117) → `'dao động ' + manaName().toLowerCase()`; thông báo cổng chỉ dùng `UI.radio` cho sl → dùng `SYS.msg(msg,'warn')` cho mọi thế giới; `KING_NAME` (v20dk.js:16) theo thế giới: sl "QUỶ VƯƠNG BARAN", tt "THIÊN MA CHÍ TÔN", md "VUA XÁC SỐNG — MẪU THỂ".
3. Tên "Cổng/hạng E–S" theo thế giới (file v21realm.js cung cấp `GATE_NAME = {md:'Ổ dịch', tt:'Bí cảnh', sl:'Cổng'}` và hàm `gateName()`; chỉ thay chữ hiển thị trong v21 + các toast v20 qua wrapper `G.toast` thay chuỗi "Cổng hạng" → `gateName()+' hạng'` khi `RL.id !== 'sl'`).
4. Kiểm tra màn chọn thế giới (ui.js:78-84) hiện 3 thế giới, nhập save md/tt được (v3.js:383), tạo nhân vật md và tt chạy 600 khung không lỗi (`node tools/smoke21.mjs md` và `tt`, với **toàn bộ** module v21 — không đặt ONLY — ở cuối, sau khi các gói khác xong; trước đó dùng ONLY=realm).
5. Lập **danh sách assets còn thiếu** theo thế giới (đọc báo cáo khảo sát trong mục 13 + tự kiểm tra `IMG` sau khi nạp md/tt: liệt kê tên được yêu cầu nhưng không nạp được — bắt `console.warn` của `loadImages`) và ghi vào cuối báo cáo.

## 13. Gói X — Kế hoạch & công cụ vẽ assets (vòng 21)

Kiểm kê hiện có (đã khảo sát): md/tt/sl đều đủ trang phục chức nghiệp, nữ, NPC chức nghiệp, quái biển + thuyền, chân dung, boss/tướng quỷ (dùng chung BOSSES theo thế giới). md dùng sprite cũ không tiền tố (`z_*`, `p_*`, `i_*`) — không thiếu tên nào được yêu cầu. Còn thiếu cho v21:

| Nhóm | Tên sprite | Ghi chú |
|---|---|---|
| Nội thất hiện đại (md + sl) | `f21_mod_{bed,hbed,medcab,ivstand,desk,table,stove,fridge,shelf,rack,sofa,wardrobe,tv,bookshelf,officedesk,cabinet,checkout,mannequin,plantpot,vending}` | 20 |
| Nội thất cổ trang (tt) | `f21_tt_{…cùng 20 khóa…}` (giường gỗ màn, giường châm cứu, tủ thuốc bắc, lò luyện đan, quầy, bàn thấp + đôn, bếp lò đất, vò rượu, sạp hàng, giá lụa, bộ bàn trà, rương gỗ, bình phong, giá thư quyển, án thư, tủ quyển, quầy bàn tính, giá giáp, chậu bonsai, cột đèn lồng) | 20 |
| Địa hình | `b21_{ice_spire,ice_crystal,snow_pine,snow_rock,prim_tree,prim_vine,prim_fern,prim_log,herb_bush,rail_h,rail_v,frozen_boulder}` | 12 |
| Texture nền | `tex21_{ice,cliff,bridge,hosp,mall,wood2,moss}` | 7, liền mạch, cùng cỡ với `tex_*` hiện có |
| Icon | `ic_base_{md,tt,sl}`, `i21_{mana_s,elixir,bt_pill}_{mod,tt}` | 9 |

Việc của gói X (chỉ tạo file công cụ, **không chạy sinh ảnh**): đọc `tools/make_prompts17.py`, `tools/gen17.sh`, `tools/build17.py`, `tools/process.py`, `js/atlas17.js` và cách nạp atlas ở `js/v17water.js:19-20`, xem vài ảnh prop hiện có (ví dụ `assets/img/sl_p_0.png`, `crate.png`, `chest_1.png`) để viết prompt **đúng góc nhìn và phong cách pixel** của game. Viết `tools/make_prompts21.py` (sinh bảng ảnh theo nhóm, mỗi bảng ≤ 6–8 vật, nền trong suốt), `tools/gen21.sh` (gọi gpt-img như gen17.sh, chạy song song tối đa 4), `tools/build21.py` (cắt bằng process.py, đổi tên theo bảng trên, đóng gói `assets/img/atlas21_{mod,tt,common}.png` + `js/atlas21.js` đăng ký frame vào `IMG` giống atlas17). Texture `tex21_*` xuất thành PNG rời trong `assets/img/` (giống `tex_*`). Báo cáo: số bảng ảnh, lệnh chạy, ước lượng thời gian.

## 14. Thứ tự & tích hợp

1. Đợt 1 (song song): S, P, A, H, M, Q, L, W, B1, B2, R, X.
2. Tích hợp (Claude điều phối): đọc báo cáo, duyệt mã từng file, chạy smoke test toàn bộ `sl/md/tt`, sửa xung đột bọc hàm, kiểm tra giao diện 812×375 trong trình duyệt.
3. Đợt 2: chạy sinh ảnh vòng 21 (gpt-img), build atlas, thêm `<script src="js/atlas21.js">`, kiểm tra nội thất/địa hình hiện đúng.
4. Cập nhật `artifact.html` (bản sao index.html không có doctype/head/body), `python tools/make_bundle.py`, tăng `VERSION` trong `sw.js`, cập nhật README, commit "v21".

## 15. Ghi chú cân bằng (tóm tắt các con số)

- EXP: L20 cần 7750 (cũ 2034); bóng kết liễu chỉ cho 35% EXP.
- Bóng: chỉ số gốc −25…−30%, tăng theo cấp chậm hơn ~40%; gọi tốn 10/22/50/100 mana; duy trì 0.12/0.3/0.7/1.4 mana/s; chết hồi 40/70/150/300 s; ra trận tối đa 6 + cấp/2 + INT/10.
- Đột phá: bậc 1 88% → bậc 8 39% (+xúc tác 12%, +đan 10%/viên, +6%/lần thất bại liên tiếp). Thất bại: EXP cấp hiện tại về 0, −30% máu/mana tối đa trong 10 phút.
- Thuốc hồi máu theo % máu tối đa; bom ×(1+7%/cấp), ×1.6 lên boss.
- Dịch chuyển miễn phí chỉ khi đứng ở Trạm/Tượng/Căn cứ; nơi khác tốn 1 Đá hồi hương.
