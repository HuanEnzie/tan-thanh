# TÀN THÀNH: VẠN GIỚI

Game hành động 2D pixel góc nhìn từ trên xuống, có 5 thế giới, bản đồ vô hạn và cốt truyện ngẫu nhiên. Chạy được trên trình duyệt máy tính và điện thoại.

Chơi online: https://claude.ai/artifact/HNwsvSuoVAEXYxXWtcDnbp — hoặc bấm đúp `CHOI_GAME.bat` để chạy trên máy.

## 5 thế giới

| Thế giới | Bối cảnh | Tuyệt kỹ [Q] |
|---|---|---|
| Tận Thế | Thành phố hiện đại đầy xác sống | Không Kích |
| Neon 2099 | Siêu đô thị cyberpunk, cyborg và drone | Quá Tải Thời Gian |
| Cổ Trang | Kinh thành cổ dưới trăng máu, cương thi và yêu quái | Kiếm Vũ Liên Hoa |
| Tu Tiên | Tông môn, yêu thú, ma tu | Vạn Kiếm Quy Tông |
| Thợ Săn Cổng | Thành phố có Cổng hầm ngục E→S, Hệ Thống | Trỗi Dậy (hồi sinh binh đoàn bóng tối) |

## Tính năng chính

- **Bản đồ vô hạn**: sinh theo từng vùng 32×32 ô, càng đi xa quái càng mạnh, đồ càng quý. Vùng xa tự giải phóng khỏi bộ nhớ.
- **Cốt truyện ngẫu nhiên**: 3 mẫu truyện mỗi thế giới, tên phản diện, bảo vật, địa danh ngẫu nhiên; 5 hồi (khám phá → thu thập → giải cứu → chinh phục Cổng → trùm cuối), có kết thúc thường và kết thúc tình cảm.
- **Bạn đồng hành**: 2 người mỗi thế giới, chiến đấu cùng bạn, 5 cảnh tâm sự theo độ thân mật, tặng quà, người thương hồi sinh bạn mỗi ngày một lần.
- **Cổng hầm ngục**: hạng E→S, nhiều tầng, Chủ Hầm Ngục, rương báu.
- **Đồ ngẫu nhiên**: 6 độ hiếm, 14 thuộc tính (lửa, băng, sét lan, độc, nổ, hút máu, phân ảnh, xuyên, nảy, truy hồn, kiếm khí...), 13 loại thánh vật.
- **Chiến đấu**: lướt né bất tử, vệt chém, kiếm khí, combo, tinh anh, trùm có nhiều chiêu, chí mạng, hiệu ứng nguyên tố.
- Giải cứu dân thường, lửa trại nghỉ ngơi, lái xe, chế tạo, ngày/đêm, mưa, 18 thiên phú, 14 thành tựu.

## Điều khiển

Máy tính: WASD di chuyển, Space lướt, chuột trái tấn công, chuột phải đẩy lùi, Q tuyệt kỹ, E tương tác, 1-4 đổi vũ khí, G ném, C/Tab/M chế tạo/túi đồ/bản đồ.

Điện thoại: cần trái di chuyển, cần phải ngắm, nút đỏ tấn công (tự ngắm), LƯỚT, TUYỆT KỸ, nút ⛶ toàn màn hình.

## Nguồn tài nguyên

- Đồ hoạ: tạo bằng gpt-image (`/gpt-img`). Ảnh gốc ở `assets/raw/`; công cụ cắt sprite ở `tools/` (`process.py`, `build2.py`).
- Âm thanh và nhạc: Mixkit (Mixkit Free License), chi tiết ở `assets/audio/CREDITS.md`. Nhạc đã nén 72kbps; bản gốc ở `assets/raw/audio_src/`.
- Nội dung cốt truyện và hội thoại: `js/lore.js`.
