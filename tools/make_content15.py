# builds the text-generation prompts for v15/v16 content (talents, flaws, traits, backstories, relationship dialogue)
import os, json
H = os.path.dirname(os.path.abspath(__file__)); D = os.path.join(H, 'content15'); os.makedirs(D, exist_ok=True)
WORLD = {
 'md': ('TẬN THẾ ZOMBIE', 'Thành phố hiện đại đổ nát sau virus Hoại Huyết. Người sống sót nấp trong khu trú ẩn, bệnh viện, ga ngầm, chợ đêm. Giọng văn: trần trụi, đời thường, hơi đen tối nhưng có tình người. Xưng hô hiện đại (tôi, anh, chị, em, mày/tao khi thân).', 'Bệnh viện Hồng Phúc, Ga ngầm Bến Cũ, Chợ đêm Phố Đèn, Chung cư Ánh Dương; phe: Đội Cứu Hộ Bình Minh, Hội Người Gác Đèn, Liên Minh Khu Trú Ẩn'),
 'tt': ('TU TIÊN HUYẾT KIẾP', 'Thiên Nguyên đại lục, tu sĩ, tông môn, linh khí, đan dược, kiếm tu, trúc cơ, kim đan. Giọng văn: Hán-Việt cổ phong, kiếm hiệp tiên hiệp. Xưng hô: ta, ngươi, huynh, đệ, sư tỷ, sư muội, đạo hữu.', 'Thanh Vân Sơn, Vạn Thú Sơn Mạch, Hồ Tẩy Kiếm, Trấn Lạc Hà; phe: Thanh Vân Tông, Liên Minh Chính Đạo, Dược Vương Cốc, Tàng Kiếm Các'),
 'sl': ('THỢ SĂN CỔNG / HỆ THỐNG', 'Hiện đại có các Cổng không gian phân hạng E đến S, Hiệp Hội Thợ Săn, bang hội, quái vật, Hệ Thống thức tỉnh, binh đoàn bóng tối. Giọng văn: hiện đại, kịch tính kiểu manhwa thợ săn. Tên người kiểu Hàn.', 'Ga ngầm Trung Tâm, Toà nhà Hiệp Hội Thợ Săn, Bệnh viện Thánh Tâm, Đảo Sương Mù; phe: Hiệp Hội Thợ Săn, Bang Hội Bạch Hổ, Bang Hội Phượng Hoàng'),
}
POS = {
 'bone': 'thể chất cứng cáp, nhiều máu, chịu đòn tốt', 'swift': 'nhanh nhẹn, dễ né đòn, chạy nhanh', 'eye': 'nhãn lực tinh tường, thiện xạ, đánh trúng điểm yếu (chí mạng)',
 'might': 'sức mạnh bẩm sinh, đánh cận chiến uy lực', 'sage': 'ngộ tính cao, học hỏi và lên cấp nhanh', 'mana': 'nguồn linh khí / năng lượng / mana dồi dào',
 'fortune': 'vận may, hay nhặt được đồ tốt', 'regen': 'hồi phục vết thương nhanh một cách lạ thường', 'shadow': 'thân thế gắn với bóng tối và cõi chết, dễ thu phục linh hồn / xác sống / bóng',
 'ward': 'mệnh cứng, hiểm nghèo vẫn sống sót', 'trade': 'khéo buôn bán, tiền bạc đến dễ', 'craft': 'tay nghề khéo léo: chế tạo, đốn gỗ, thuốc men hiệu quả hơn',
 'lead': 'phong thái thủ lĩnh, đồng đội tin theo, dễ kết thân', 'slayer': 'sinh ra để săn kẻ mạnh, tinh anh và boss', 'fury': 'càng bị thương càng hung hãn, hút máu khi chiến đấu', 'mind': 'tâm tĩnh như nước, hồi năng lượng khi bình thản',
}
NEG = {
 'frail': 'thể chất yếu ớt, ít máu', 'slow': 'chân chậm, di chuyển ì ạch', 'glutton': 'dễ đói khát, ăn uống nhiều', 'unlucky': 'vận đen, đồ rơi kém',
 'clumsy': 'vụng về với vũ khí tầm xa, nạp chậm, bắn kém', 'weak': 'tay yếu, cận chiến kém uy lực', 'dull': 'chậm hiểu, kinh nghiệm thu được ít',
 'dark': 'sợ bóng tối, ban đêm chiến đấu kém đi', 'poor': 'nghèo rớt, tiền kiếm được ít', 'leak': 'mạch linh khí / năng lượng bị tắc, ít mana',
 'feud': 'mang thù oán, có kẻ truy sát mình', 'lone': 'cô độc, khó kết thân, người khác dè chừng',
}
def w(name, text): open(os.path.join(D, name), 'w', encoding='utf-8').write(text)
for r, (title, tone, places) in WORLD.items():
    ctx = f'THẾ GIỚI: {title}. {tone}\nĐịa danh / phe mẫu: {places}.\n'
    keys = '\n'.join(f'- {k}: {v}' for k, v in {**POS, **NEG}.items())
    w(f'p_talents_{r}.txt', ctx + f'''Viết nội dung cho GAME nhập vai. Mỗi "thiên phú" (tốt) hoặc "khuyết điểm" (xấu) bẩm sinh của nhân vật chính cần tên và một mẩu câu chuyện nguồn gốc.
Cho mỗi KEY dưới đây, viết ĐÚNG 3 biến thể (variants) khác hẳn nhau về tên và câu chuyện. Tên ≤ 26 ký tự, nghe hay, hợp thế giới. Câu chuyện (story) 1-2 câu, ≤ 230 ký tự, ngôi thứ hai ("Bạn..."), kể nguồn gốc / sự kiện tuổi thơ làm nên điều đó, có hình ảnh cụ thể (không chung chung). Với khuyết điểm: giọng ngậm ngùi hoặc hài hước, nêu rõ cái giá phải trả. Mỗi biến thể còn có "tag": 1 câu ngắn ≤ 60 ký tự mô tả tính chất để hiển thị.
KEY và ý nghĩa:
{keys}

Trả về JSON thuần (không markdown) dạng: {{"bone":[{{"name":"...","tag":"...","story":"..."}}, ...3 phần tử...], "swift":[...], ...đủ {len(POS)+len(NEG)} key}}''')
    w(f'p_backstory_{r}.txt', ctx + '''Viết kho mảnh ghép tiểu sử NPC cho game (NPC ngẫu nhiên ghép từ các mảnh này). Dùng các ô thay thế: {name} = tên NPC, {he} = "anh ấy" hoặc "cô ấy" (đại từ viết thường, ghép được giữa câu), {place} = một địa danh, {faction} = tên một phe. Không dùng đại từ khác để chỉ NPC. Mỗi mảnh 1-2 câu, ≤ 200 ký tự, cụ thể, có chi tiết lạ.
Trả JSON thuần: {"origin":[12 mảnh: nơi sinh/lớn lên/nghề cũ], "wound":[12 mảnh: mất mát hoặc biến cố làm đổi đời], "motive":[12 mảnh: lý do hiện giờ đi lại/sống như vậy], "secret":[12 mảnh: bí mật chưa ai biết, hé lộ khi thân thiết], "hero":[10 mảnh: xuất thân của NHÂN VẬT CHÍNH, ngôi thứ hai "Bạn", dùng {place} và {faction} được, KHÔNG dùng {name}/{he}, mỗi mảnh độc đáo], "look":[12 mảnh: chi tiết ngoại hình / thói quen của NPC để mô tả, dùng {name} và {he}]}''')
    w(f'p_relations_{r}.txt', ctx + '''Viết lời thoại cho hệ thống quan hệ giữa NHÂN VẬT CHÍNH và NPC. Ô thay thế: {hero} = tên nhân vật chính, {npc} = tên NPC, {place}, {faction}. Lời thoại là NPC nói với nhân vật chính (trừ khi ghi chú khác), 1-2 câu, ≤ 170 ký tự, đúng giọng thế giới và đúng cách xưng hô.
Quan hệ (rel) và 4 giai đoạn (stage 0: mới quen, 1: thân dần / bắt đầu hiềm khích, 2: biến cố / cao trào, 3: kết quả cuối). Với mỗi rel và mỗi stage viết ĐÚNG 4 câu khác nhau:
- friend: bạn bè thân thiết dần
- sworn: kết nghĩa huynh đệ / tỷ muội (anh em kết nghĩa, sống chết có nhau)
- sibling: người thân ruột thịt thất lạc hoặc em/anh/chị ruột của nhân vật chính (tình cảm gia đình)
- lover: tình yêu lãng mạn (e thẹn, rung động, tỏ tình, thề ước) - lịch sự, không tục
- rival: đối thủ cạnh tranh ngang tài, vừa ghét vừa nể, cuối cùng hoá bạn hoặc phân thắng bại
- enemy: kẻ thù thực sự có mối hận với nhân vật chính (stage 0: lời khiêu khích/lần đầu chạm mặt, 1: truy đuổi, 2: đối đầu trực diện, 3: kết cục - tha thứ hoặc báo thù xong)
- mentor: sư phụ / người dẫn đường già dặn truyền dạy cho nhân vật chính
Thêm "links": liên hệ giữa NPC với NPC khác, mỗi loại 4 mẫu câu miêu tả (không phải lời thoại), dùng {a} và {b} là hai NPC: "sibling" (anh chị em), "ex" (người cũ), "rival" (đối thủ), "mentor" ({a} là thầy của {b}), "debt" ({a} nợ ơn {b}), "lover" ({a} và {b} yêu nhau), "enemy" ({a} hận {b}).
Thêm "gift": 6 câu NPC nói khi nhận quà thích, 6 câu khi nhận quà không thích; "join": 6 câu NPC nói khi đồng ý đi theo hero; "leave": 4 câu khi bị bảo ở lại căn cứ; "duel": 4 câu rival hô trước trận tỉ thí; "ambush": 4 câu enemy hô khi phục kích; "mercy": 4 câu enemy nói sau khi bị đánh bại và được tha; "confess": 4 câu tỏ tình (lover); "oath": 4 câu thề kết nghĩa (sworn).
Trả JSON thuần: {"rel":{"friend":[[4 câu stage0],[4 câu stage1],[4 câu stage2],[4 câu stage3]], "sworn":[...], ... đủ 7 rel}, "links":{"sibling":[4 mẫu],...}, "gift":{"like":[6],"dislike":[6]}, "join":[6], "leave":[4], "duel":[4], "ambush":[4], "mercy":[4], "confess":[4], "oath":[4]}''')
w('p_traits.txt', '''Viết 18 tính cách (trait) cho NPC game nhập vai, dùng chung cho mọi thế giới (không nhắc bối cảnh cụ thể). Ô thay thế: {hero} = tên nhân vật chính.
Mỗi trait: key (không dấu, thường), name (tính từ tiếng Việt ngắn, vd "Nóng nảy"), desc (≤ 70 ký tự), và các nhóm lời thoại của NPC có tính cách đó: greet (3 câu chào), chat (5 câu tán gẫu / chia sẻ suy nghĩ), fight (3 câu hô khi chiến đấu), hurt (2 câu khi bị thương), like (2 câu khi nhận được món thích), dislike (2 câu khi nhận món không thích), tease (2 câu trêu / chọc nhân vật chính khi thân). Mỗi câu ≤ 110 ký tự, sinh động, khác nhau rõ rệt giữa các trait, KHÔNG xưng hô cố định (dùng "bạn" hoặc "cậu" trung tính).
18 trait gợi ý: noinong (nóng nảy), diemdam (điềm đạm), haihuoc (hài hước), nhutnhat (nhút nhát), kieungao (kiêu ngạo), trongnghia (trọng nghĩa), thamlam (tham lam), tuhao (tự hào), daucam (đa sầu đa cảm), lanhlung (lạnh lùng), tomo (tò mò), canthan (cẩn trọng), lieulinh (liều lĩnh), trungthanh (trung thành), maumo (mưu mô), hiendu (hiền lành), nghiemtuc (nghiêm túc), laquan (lạc quan).
Trả JSON thuần: {"traits":[{"key":"...","name":"...","desc":"...","lines":{"greet":[],"chat":[],"fight":[],"hurt":[],"like":[],"dislike":[],"tease":[]}}, ...18 phần tử]}''')
print('prompts written')
