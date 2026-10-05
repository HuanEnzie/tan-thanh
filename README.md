# TÀN THÀNH: VẠN GIỚI

Game hành động 2D pixel, góc nhìn từ trên xuống. Có 3 thế giới đang mở, bản đồ vô hạn với 12 vùng địa hình, và cốt truyện ngẫu nhiên. Chạy được trên trình duyệt máy tính lẫn điện thoại. 

Có hai cách chơi:
- Chơi online: https://claude.ai/artifact/HNwsvSuoVAEXYxXWtcDnbp
- Chạy trên máy: bấm đúp `CHOI_GAME.bat`, hoặc chạy `python -m http.server` rồi mở `index.html`.

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

## Điều khiển

**Máy tính**:

| Phím | Tác dụng |
|---|---|
| W A S D | Di chuyển |
| Space | Lướt |
| Chuột trái | Tấn công |
| Chuột phải | Đẩy lùi |
| Q | Tuyệt kỹ |
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
