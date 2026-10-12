# TÀN THÀNH: VẠN GIỚI

Game hành động 2D pixel, góc nhìn từ trên xuống. Có 3 thế giới đang mở, bản đồ vô hạn với 12 vùng địa hình, và cốt truyện ngẫu nhiên. Chạy được trên trình duyệt máy tính lẫn điện thoại.  
        
Có ba cách chơi: 
- **Cài như app (PWA)** từ https://huanenzie.github.io/tan-thanh/:
  - Android / máy tính: mở bằng Chrome, bấm **📲 CÀI ĐẶT APP** trên màn hình chính của game (hoặc menu ⋮ → "Cài đặt ứng dụng").
  - iPhone: mở bằng Safari, bấm Chia sẻ → "Thêm vào MH chính". 
  - App mở toàn màn hình, xoay ngang. Vào **Cài đặt → 📥 Tải dữ liệu để chơi offline** để chơi không cần mạng.
- Chơi online: https://claude.ai/artifact/HNwsvSuoVAEXYxXWtcDnbp
- Chạy trên máy: bấm đúp `CHOI_GAME.bat`, hoặc chạy `python -m http.server` rồi mở `index.html`.
 
Để trang GitHub Pages chạy được, repo phải bật Pages: Settings → Pages → Source "Deploy from a branch" → nhánh `main`, thư mục `/ (root)`. Mỗi lần đổi code, tăng `VERSION` trong `sw.js` để máy người chơi xoá bộ đệm cũ.

## Thế giới

| Thế giới | Bối cảnh | Tuyệt kỹ [Q] | Tiền tệ |
|---|---|---|---|
| Tận Thế | Thành phố hiện đại đầy xác sống | Không Kích | Vàng |
| Tu Tiên | Tông môn, yêu thú, ma tu | Vạn Kiếm Quy Tông | Linh Thạch |
| Thợ Săn Cổng | Thành phố có Cổng hầm ngục E→S và Hệ Thống | Trỗi Dậy | Ma Thạch |

Neon 2099 và Cổ Trang đang tạm đóng. Dữ liệu vẫn còn trong `js/realms.js` và có thể bật lại qua `REALM_ORDER`.

## Tính năng chính

- **Bản đồ vô hạn, 12 địa hình**:
  - Danh sách: đồng cỏ, rừng già, băng nguyên (hồ đóng băng), sa mạc (ốc đảo), rừng nhiệt đới, đầm lầy, rừng thu, rừng anh đào, rừng nấm khổng lồ, thung lũng pha lê, hỏa sơn (hồ dung nham), nghĩa địa cổ.
  - Mỗi vùng có cây cối, vật trang trí, hiệu ứng thời tiết và màu sắc riêng. Ranh giới giữa các vùng uốn lượn tự nhiên.
- **Rương 4 bậc** (Gỗ, Bạc, Vàng, Kim Cương):
  - Rương phát sáng theo độ quý và rung khi đang mở. Lúc mở có cột sáng và đồ bay ra lần lượt.
  - Rương có mặt trong nhà, ngoài hoang dã, pháo đài, hầm ngục, phế tích. Cũng có thể mua ở cửa hàng.
- **Trang bị ngẫu nhiên**:
  - Vũ khí tầm xa, 8 kiểu cận chiến, giáp 4 món và thánh vật. Đồ có 6 độ hiếm.
  - 8 kiểu cận chiến: dao găm, kiếm, rìu, búa đập đất, thương đâm xa, lưỡi hái quét vòng, đại kiếm, quyền thủ.
  - Giáp gồm mũ, áo, quần, giày. Giáp giảm sát thương và có thuộc tính phụ: máu, hồi phục, tốc độ, né, gai, may mắn…
- **Thương nhân**:
  - Có mặt ở nơi trú ẩn, trại và thị trấn.
  - Bán đồ thừa để lấy tiền. Mua thuốc, đạn, cuộn truyền tống, tinh thể sinh mệnh, hộp bí ẩn, rương báu, cùng trang bị bày bán mỗi ngày.
- **Boss ngẫu nhiên**:
  - 5 loại boss mỗi thế giới, cộng thêm biến thể (Cuồng Bạo, Thiết Giáp, Khổng Lồ, Hư Ảnh, Bão Tố).
  - Chiêu thức: xoáy đạn, mưa thiên thạch có báo trước, sóng xung kích nguyên tố, dịch chuyển, bắn quạt, vệt lửa/độc, triệu hồi, húc, đập đất.
  - Boss canh giữ phế tích, hầm ngục và hang ổ trùm cuối.
- **Hầm ngục có giới hạn**: mỗi tầng chỉ gồm vài khu, có mũi tên dẫn tới Chủ Hầm Ngục rồi tới lối xuống hoặc lối ra.
- **Cốt truyện ngẫu nhiên**: 5 hồi, có kết thúc thường và kết thúc tình cảm.
- **Bạn đồng hành**: 
  - Khi chơi, bạn chọn giới tính nhân vật.
  - Đồng hành khác giới có tuyến tình cảm. Đồng hành cùng giới có tuyến kết nghĩa huynh đệ hoặc tỷ muội, với cảnh riêng.
  - Chân dung có 6 biểu cảm (bình thường, vui, buồn, giận, ngượng, ngạc nhiên), đổi theo từng câu thoại.
- **Vật phẩm theo thế giới**: Tu Tiên dùng Hồi Xuân Đan, Kim Sang Dược, Ngũ Lôi Phù, Hỏa Diệm Phù… thay cho băng gạc và lựu đạn.
- **Lưu và tải file .json**: trong menu, chọn 💾 LƯU / TẢI FILE để xuất tiến độ ra file, sao chép mã, hoặc nạp lại từ file hay mã đã dán.
- **Cửa nhà dễ thấy**: cửa vẽ trên mái, có ánh đèn hắt ra và mũi tên chỉ vào.

## Bản v22: Sinh tồn, Đỡ đòn, Thây ma, Tầm nhìn

- **Lẩn trốn**:
  - Khom lưng [Ctrl / nút KHOM] để đi chậm, không có tiếng bước chân, quái khó thấy hơn.
  - Quái chưa phát hiện chỉ nhìn thấy phía trước mặt; đi thường gây tiếng động nhỏ (75 px), chạy và bắn ồn hơn.
  - Khuất tầm nhìn khoảng 2,5 giây là quái bỏ đuổi và đi tìm chỗ thấy bạn lần cuối (dấu ? / !).
  - Khom lưng đánh cận chiến vào quái chưa phát hiện: Ám sát ×2,5 sát thương.
- **Sinh tồn chuyên gia** (chọn khi tạo nhân vật, hoặc bật trong Cài đặt): quái đánh hơi được bạn từ xa, không cắt đuôi được. Trát bùn cạnh nước / ruộng (2,5 phút, mưa làm trôi nhanh) hoặc tẩm xăng (5 phút, lửa đau gấp đôi) để xoá mùi [P].

- **Chế độ Sinh tồn** (mặc định khi tạo nhân vật; vẫn chọn được Cổ điển):
  - Tỉnh dậy ở một vùng đất ngẫu nhiên, tay trắng, không có vũ khí.
  - Chết không mất save: đồ rơi thành túi tại chỗ (💀 trên bản đồ). Hồi sinh ở giường đã đặt hoặc ở điểm xuất phát.
  - Có gợi ý từng bước cho người mới.
- **Thu thập & chế tạo kiểu Minecraft**:
  - Nguyên liệu: gỗ, que, sợi cỏ, đá, đá lửa, quặng sắt, thỏi sắt, da, xương, vải, lõi quái.
  - Công cụ (rìu, cuốc, giáo, kiếm sắt, cuốc tinh thể) giúp chặt và đào nhanh hơn.
  - Có Bàn chế tạo và Lò nung (nấu quặng, nướng thịt).
- **Xây dựng** (phím **B** / nút 🔨):
  - Tường gỗ/đá/sắt, cửa, sàn, hàng rào, chông, đuốc, lửa trại.
  - Giường (ngủ, đặt điểm hồi sinh), rương chứa đồ.
  - Trận dịch chuyển (dịch chuyển miễn phí giữa các trận). Trận phòng thủ tự bắn quái, chạy bằng tinh thể.
- **Đỡ đòn**:
  - Quái vung đòn trước khi đánh: dấu **!** đỏ, chuyển vàng là lúc đỡ đẹp nhất.
  - Nhấn chuột phải / nút ĐẨY đúng lúc để đỡ. Thành công thì quái choáng và đòn kế tiếp chí mạng ×2. Đạn bị dội ngược.
  - Vòng đỏ là đòn không đỡ được: phải lướt né.
- **12 Tướng Quỷ có cơ chế riêng**, mỗi tướng một cách khắc chế (xem Sổ tay):
  - Mầm hồi máu phải phá, ảo cảnh và gương, tướng chỉ hiện hình trong ánh sáng.
  - Tướng cướp bóng, tướng phản sát thương, tướng giáp phải đỡ đòn mới vỡ…
  - Quỷ Vương đánh 3 giai đoạn.
- **Quái mới**: vồ, cầm khiên, chui đất, triệu hồi, húc, hồi máu. Thêm boss mới.
- **Thây ma**:
  - Từ người biến thành (dân bị giết sẽ đứng dậy). Chỉ có trong nhà và ngoài đường, không có trong Cổng.
  - Có loại biết chiêu (cựu thợ săn / tu sĩ), có cấp bậc tới Thây Ma Vương.
  - Quái mạnh thêm 10% mỗi ngày. Cổng mở nhiều hơn.
- **Tầm nhìn hình nón**:
  - Không thấy sau lưng, trừ khi có bóng/đồng đội đứng đó. Quái có thể tấn công từ chỗ khuất.
  - Có jumpscare khi bước vào nhà.
  - Bật/tắt trong Cài đặt.
- **Nhà nhiều tầng** (cầu thang lên tầng trên), 10 kiểu mái, nhà đổ nát kiểu tận thế.
- **Công trình mới**:
  - Hiện đại: trường học, đồn cảnh sát, trạm cứu hỏa, cây xăng, nhà thờ, nhà máy, kho hàng, khách sạn, chung cư, siêu thị, nhà thuốc, ngân hàng, trang trại, chốt quân sự.
  - Tu tiên: võ đường, tàng kinh các, luyện đan phòng, tiêu cục, khách điếm, nha môn, chùa, lò rèn, chợ, nông trang.
- **Địa hình mới**: bãi biển, đồng ruộng / ruộng lúa nước, hẻm núi đá đỏ, thảo nguyên, đài nguyên, rừng ngập mặn, rừng trúc, rừng chết.
- **Tinh thể hạng E–S**:
  - Tên theo thế giới. Tu Tiên: Linh Thạch Hạ Phẩm → Hỗn Độn Tinh Phách.
  - Đào trong Cổng, giao cho bóng hoặc đồng đội khai thác. Đổi tinh thể lấy tiền.
  - Lên hạng (cấp 10/20/30/40/50) cần tinh thể đúng hạng.
  - Tu Tiên lên cấp chủ yếu bằng **hấp thụ linh thạch**.

## Bản v21: Hệ Thống đầy đủ, Binh đoàn, độ khó

- **Ba thế giới mở lại**: Tận Thế, Tu Tiên, Thợ Săn Cổng. Mỗi thế giới có tên gọi riêng: Cổng / Ổ dịch / Bí cảnh, Hệ Thống / Thiên Đạo, và Quỷ Vương riêng.
- **Hệ Thống** (nút ◈ HỆ THỐNG trên màn hình, phím **N**, mở ở bất kỳ đâu):
  - Trạng thái và cộng điểm thuộc tính.
  - Điểm danh 7 ngày, gói tân thủ.
  - Nhiệm vụ: hằng ngày, khẩn cấp, ẩn.
  - Danh hiệu, Binh đoàn, Kỹ năng, Căn cứ.
  - Cửa hàng bằng Điểm Hệ Thống, và Thu mua: bán đồ ở bất kỳ đâu với 60% giá.
- **Nhiệm vụ hằng ngày**: bỏ dở thì hôm sau bị kéo vào **Vùng Phạt** 3 phút, không dịch chuyển được.
- **Binh đoàn bóng**:
  - Phân cấp: Quân vương → 2 Thủ lĩnh → mỗi Thủ lĩnh 2 Tinh anh → mỗi Tinh anh 4 lính.
  - Gọi cả đội, gọi từng bóng, chọn đội nhanh cho phím K, phân công cả đội đi làm việc.
  - Mỗi bóng chiếm *sức chứa linh hồn*, tức mana tối đa. Mỗi con khi gọi tốn mana, khi đứng ngoài thì hao mana mỗi giây. Hết mana thì bóng tự rút về.
  - Gọi bóng có hiệu ứng **ARISE**.
- **Độ khó**:
  - EXP lên cấp tăng nhanh theo cấp: cấp 20 cần 7.750, bản cũ chỉ 2.034.
  - Bóng hạ quái chỉ cho 35% EXP.
  - Bóng yếu đi, chết thì hồi sinh lâu.
  - Thuốc hồi máu theo % máu tối đa. Bom và lựu đạn mạnh theo cấp, đánh boss mạnh hơn.
- **Đột phá có thể thất bại**: tỉ lệ giảm theo bậc. Thất bại thì EXP cấp hiện tại về 0 và bị **Phản phệ** 10 phút: −30% máu và mana tối đa. Đan Phá Cảnh tăng tỉ lệ.
- **Dịch chuyển có giá**: miễn phí khi đứng ở Trạm, Tượng hoặc Căn cứ. Đứng ở chỗ khác thì tốn 1 Đá hồi hương.
- **Thanh kỹ năng 4 ô** luôn hiện trên màn hình, mỗi ô có hồi chiêu riêng. Phím V hoặc Shift+1…4.
- **Lục soát**: bụi cây, đá, tinh thể, tủ, kệ. Hệ Thống báo khi phát hiện rương gần đó, đánh dấu lên bản đồ, có nút 🧭 Chỉ đường hoặc dịch chuyển tới.
- **Thế giới đa dạng**:
  - Công trình: bệnh viện, trung tâm thương mại, quán ăn. Tu Tiên có Y Quán, Thương Hội, Tửu Lâu.
  - Nội thất vẽ mới, đồ rơi hợp từng loại phòng. Có cầu qua sông.
  - Địa hình mới: Núi Băng, Núi Tuyết, Rừng Nguyên Sinh, Đại Dương.
- **Thủy quái chỉ chui ra từ Cổng Biển**: cổng mở trên mặt nước. Ra biển lâu thì chắc chắn có một cổng.
- **Thương nhân**: hàng xoay vòng mỗi ngày theo 5 nhóm, có số lượng giới hạn, có "Hàng hiếm hôm nay". Có thêm Thuốc hồi Mana, Thuốc hồi phục cao cấp, Đá Thăng Hạng.

## Bản v5: Vùng, Tượng Thần, dịch chuyển, Căn cứ

- **Vùng**:
  - Thế giới chia thành các vùng 6×6 khu. Mỗi vùng có tên, cấp quái và **% khám phá** riêng.
  - Đạt 50% và 100% khám phá thì nhận vé và tiền.
- **Tượng Thần**:
  - Mỗi thế giới có tên riêng: Tận Thế là Đài Phát Sóng, Tu Tiên là Tượng Thần, Thợ Săn Cổng là Cột Hệ Thống.
  - Mỗi vùng có một tượng. Đánh thức tượng thì **hiện toàn bộ bản đồ vùng**; vùng chưa đánh thức là sương mù, có dấu "?" gợi ý vị trí tượng.
- **Điểm dịch chuyển**: mỗi vùng có 3 điểm. Mở khoá xong thì chạm ◆ / ✦ / ⌂ trên bản đồ để bay tới. Khi dịch chuyển, map cũ bị xoá và chỉ tải map ở chỗ đến.
- **Linh Châu** (giống Thần Đồng): mỗi vùng giấu 8 viên. Dâng lên tượng để tăng máu hoặc thể lực tối đa và nhận vé.
- **Căn cứ** (phím N, hoặc ☰ → 🏠):
  - 6 công trình, mỗi công trình nâng tới cấp 5.
  - **Lò Rèn**: cường hoá trang bị +1 đến +10.
  - **Bếp**: món ăn tăng sát thương, tốc độ, hồi máu.
  - **Vườn**: tự sinh vật phẩm theo thời gian thật, kể cả khi tắt game.
  - **Kho**: túi đồ rộng hơn.
  - **Giường**: ngủ để nhận buff kinh nghiệm.
  - **Bảng Nhiệm Vụ**: nhiệm vụ đổi mới mỗi sáng, nhận thưởng tại căn cứ.
  - Dân thường được cứu sẽ về sống ở căn cứ.
- **Giao diện điện thoại**:
  - Thanh trên chỉ còn 4 nút (II, 🗺, 🎒, ☰), các chức năng khác nằm trong ☰.
  - Bản đồ nhỏ không bị che. Bản đồ lớn phủ kín màn hình, kéo để xem.

## Chơi cùng bạn bè (co-op 2–4 người)

**Chủ phòng:**
1. Vào game.
2. Mở menu tạm dừng → **👥 MỜI BẠN CHƠI CÙNG** → **MỞ PHÒNG**.
3. Gửi mã 5 ký tự hoặc link mời (nút **SAO CHÉP LỜI MỜI**) qua Zalo / Messenger.

**Người được mời:**
1. Mở link mời, hoặc vào màn hình chính → **👥 CHƠI CÙNG BẠN BÈ**.
2. Nhập mã → **VÀO PHÒNG**.

**Cách hoạt động:**
- Kết nối trực tiếp giữa các máy (WebRTC qua PeerJS), không cần máy chủ riêng.
- Máy chủ phòng điều khiển thế giới: quái, boss, ngày đêm, hầm ngục.
- Mỗi người điều khiển nhân vật của mình nên không bị trễ khi di chuyển.
- Kinh nghiệm chia đều cho người ở gần. Đồ rơi và rương là phần riêng của từng người.
- Bất kỳ ai bước vào Cổng hay lối ra cũng đưa cả đội đi cùng.
- Gục ngã thì sau 10 giây hồi sinh cạnh đồng đội.
- Nhắn tin bằng Enter hoặc nút 💬.

**Nhân vật của khách:**
- Lưu riêng theo từng thế giới (`tt_coop_<thế giới>`), không ảnh hưởng bản lưu chơi một mình.
- Lần đầu sẽ mượn nhân vật trong bản lưu nếu cùng thế giới.

**Giới hạn:**
- Chỉ chạy trên bản GitHub Pages hoặc app đã cài, vì artifact chặn WebRTC.
- Một số mạng công ty hay 4G chặn kết nối trực tiếp.

## Bản v4: khám phá & gacha

- **Tế Đàn Vận Mệnh (gacha)**: triệu hồi x1/x10, có bảo hiểm (5★ chắc chắn ở lượt 60, 4★ mỗi 10 lượt), hiệu ứng sao băng đổi màu theo độ hiếm và thẻ lật. Lần x10 đầu tiên chắc chắn có thú cưng. Vé lấy từ vùng đất mới, kỳ quan, boss, rương quý, yêu tinh, mảnh sao băng (10 mảnh = 1 vé) hoặc mua bằng tiền.
- **8 thú cưng** có kỹ năng riêng, lên tới bậc 5 khi trùng: Hỏa Hồ Ly, Băng Long Con, Mèo Thần Tài, Sứa Ánh Sáng, Lôi Điểu, Tiểu Thạch Nhân, U Linh Đèn Lồng, Tinh Linh Pha Lê.
- **12 kỳ quan**, mỗi vùng đất một kỳ quan, có lời kể và phần thưởng. Trên bản đồ lớn, dấu ? là tin đồn, ★ là nơi đã đến.
- **Sự kiện thế giới**:
  - Yêu tinh trộm vàng bỏ chạy và rơi vàng (lấy ý tưởng từ Diablo).
  - Rương ăn thịt (Dark Souls).
  - Mưa sao băng và huyết nguyệt (Terraria).
- **Sổ tay lữ khách**: theo dõi vùng đất, kỳ quan, thú cưng, boss đã hạ (Hollow Knight).
- **Bản đồ có cấu trúc**:
  - Mỗi ô nhớ vùng của mình.
  - Cây mọc thành lùm, xen khoảng trống.
  - Nghĩa địa có bia mộ xếp hàng, rừng nấm có vòng nấm tiên.
  - Pha lê mọc thành cụm, lau sậy và băng mọc ven bờ.

## Điều khiển

**Máy tính**:

| Phím | Tác dụng |
|---|---|
| W A S D | Di chuyển |
| Space | Lướt |
| Chuột trái | Tấn công |
| Q | Tuyệt kỹ |
| V, Shift+1…4 | Kỹ năng ô 1…4 |
| K / Shift+K | Gọi đội nhanh / thu hồi tất cả bóng |
| J | Đổi chỗ với bóng |
| N | Hệ Thống |
| B | Chế độ xây (E / chuột trái: đặt, [ ]: đổi vật) |
| Chuột phải | Xô / Đỡ đòn |
| Ctrl | Khom lưng / đứng dậy (đi chậm, không gây tiếng động, khó bị thấy) |
| P | Xoá mùi: trát bùn cạnh nước, hoặc tẩm Can xăng (Sinh tồn chuyên gia) |
| E | Tương tác, mở rương, mua bán |
| U | Truyền tống |
| 1–4 | Đổi vũ khí |
| G | Ném |
| C / Tab / M | Chế tạo / Túi đồ / Bản đồ |

**Điện thoại**:
- Cần trái để di chuyển, cần phải để ngắm.
- Nút đỏ để tấn công, game tự ngắm vào kẻ địch.
- Có nút LƯỚT và TUYỆT KỸ.
- Chạm vào ô vật phẩm nhanh để dùng.
- Nút ⛶ để chơi toàn màn hình.

## Hiệu năng

Những gì nằm xa người chơi được tự động dọn khỏi bộ nhớ:
- Vùng bản đồ.
- Dân thường, thương nhân và boss phụ.
- Đồ rơi trên đất.

Bộ đệm hình nền và bản đồ nhỏ được giới hạn kích thước, nên chơi lâu không bị chậm dần.

## Nguồn tài nguyên

- **Đồ hoạ**:
  - Tạo bằng gpt-image (`/gpt-img`). Ảnh gốc nằm ở `assets/raw/` (không đưa lên git).
  - Công cụ cắt sprite ở `tools/`: `process.py`, `build2.py`, `build4.py`, `make_prompts4.py`.
- **Âm thanh và nhạc**: lấy từ Mixkit (Mixkit Free License), chi tiết ở `assets/audio/CREDITS.md`.
- **Cốt truyện và hội thoại**:
  - `js/lore.js`.
  - `js/lore_bond.js`: tuyến kết nghĩa, biểu cảm, thương nhân.
