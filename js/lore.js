// =======================================================================
// TÀN THÀNH: VẠN GIỚI — dữ liệu cốt truyện cho 5 thế giới
// Placeholder: {hero} {companion} {villain} {artifact} {place} {faction}
// =======================================================================
const LORE = {
  // =====================================================================
  // TẬN THẾ — thành phố xác sống hiện đại
  // =====================================================================
  md: {
    name: 'Tận Thế',
    tagline: 'Thành phố đã chết. Còn bạn thì chưa.',
    desc: 'Bảy ngày sau khi virus Hoại Huyết bùng phát, thành phố chỉ còn tiếng còi báo động và tiếng gào của người chết. Bạn là một trong số ít người sống sót, với một chiếc ba lô, một khẩu súng và một lời hứa chưa kịp giữ.',
    heroNames: ['Minh Khang', 'Bảo Ngọc', 'Tuấn Kiệt', 'Hà My', 'Đức Anh', 'Thảo Vy'],
    levelTitles: ['Người Sống Sót', 'Kẻ Nhặt Rác', 'Tay Súng Đường Phố', 'Thợ Săn Xác Sống', 'Người Gác Đêm', 'Chiến Binh Đổ Nát', 'Thủ Lĩnh Khu Trú Ẩn', 'Kẻ Miễn Nhiễm', 'Huyền Thoại Tàn Tro', 'Ánh Sáng Cuối Cùng'],
    names: {
      villains: ['Bác sĩ Lạc Uyên', 'Tướng Hắc Sơn', 'Giáo chủ Vĩnh Hằng', 'Gã Đồ Tể Kha', 'Chủ tịch Đoàn Vũ', 'Tiến sĩ Mạc Tử Thanh'],
      artifacts: ['Mẫu Huyết Thanh', 'Thẻ Từ Phòng Thí Nghiệm', 'Ổ Cứng Dữ Liệu Gốc', 'Lọ Vắc-xin Thử Nghiệm', 'Mảnh Bản Đồ Hầm Trú', 'Pin Nhiên Liệu Quân Dụng'],
      places: ['Bệnh viện Hồng Phúc', 'Ga ngầm Bến Cũ', 'Chợ đêm Phố Đèn', 'Chung cư Ánh Dương', 'Cầu Sông Lặng', 'Trung tâm thương mại Sao Mai', 'Nhà máy nước Đông Hồ', 'Đồn cảnh sát quận Bảy'],
      factions: ['Đội Cứu Hộ Bình Minh', 'Hội Người Gác Đèn', 'Liên Minh Khu Trú Ẩn', 'Đài Phát Thanh Tự Do']
    },
    stories: [
      {
        title: 'Mùa Đông Không Có Vắc-xin',
        intro: [
          'Ngày thứ bảy. Đài phát thanh chỉ còn phát tiếng rè rè.',
          'Người ta đồn rằng {villain} đã biết trước mọi chuyện. Và vẫn để nó xảy ra.',
          'Ở đâu đó quanh {place}, những mẫu {artifact} cuối cùng đang chờ người đến lấy.',
          'Hoặc chờ xác sống gặm nát.',
          '{hero} nạp đạn, kéo khoá áo khoác, rồi bước ra khỏi căn hầm.',
          'Mùa đông này, sẽ không ai mang vắc-xin đến cho bạn. Bạn phải tự đi tìm.'
        ],
        acts: [
          { type: 'explore', goal: 'Trinh sát khu phố quanh {place}',
            start: ['[Bộ đàm] Rè... Đây là {faction}. Ai còn sống thì tránh xa đường lớn.', 'Mùi khói, mùi máu, và một sự im lặng đáng ngờ. Phải đi thật khẽ.', 'Đạn thì có hạn. Còn xác sống thì không.'],
            done: ['Trên tường có dòng sơn đỏ nguệch ngoạc: "MẪU THỬ Ở PHÍA BẮC".', 'Ai đó đã để lại manh mối. Mong là họ vẫn còn sống.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} rơi vãi trong thành phố',
            start: ['[Bộ đàm] Nếu cậu tìm được {artifact}, bọn tôi có thể điều chế thuốc giải.', 'Mấy chiếc xe cứu thương lật nghiêng dọc đường. Hàng cứu trợ có thể vẫn còn.', 'Cẩn thận kẻ phun axit. Chúng thích rình gần những thứ quý giá.'],
            done: ['Đủ 3 {artifact}. Ống nghiệm còn hơi ấm, như vừa có người cầm.', '[Bộ đàm] Tốt lắm! Nhưng... kẻ nào đã mang chúng ra đây trước cậu?'] },
          { type: 'rescue', goal: 'Giải cứu {companion} khỏi khu cách ly bị bao vây',
            start: ['[Bộ đàm] Có tín hiệu cầu cứu từ khu cách ly. Người tên {companion}.', 'Người này biết đường vào phòng thí nghiệm của {villain}.', 'Xác sống bu kín cổng. Cậu chỉ có một cơ hội thôi.'],
            done: ['{companion} thở hổn hển, nhìn {hero} như nhìn một phép màu.', 'Thêm một người. Thêm một lý do để sống tiếp.'] },
          { type: 'gate', goal: 'Đột nhập phòng thí nghiệm ngầm dưới lòng thành phố',
            start: ['Cánh cửa thép hé mở. Hơi lạnh phả lên, mùi thuốc sát trùng trộn với mùi thịt thối.', 'Đèn đỏ nhấp nháy. Loa nội bộ vẫn lặp lại bằng giọng máy: "Khu vực cấm. Khu vực cấm."', '{companion} khẽ nói: "Dù dưới đó có gì, đừng buông tay tôi."'],
            done: ['Nhật ký cuối cùng: "Mẫu Thể đã thức tỉnh. Tôi không dừng được nó. Tôi cũng không muốn dừng."', 'Chữ ký bên dưới: {villain}.'] },
          { type: 'boss', goal: 'Tiêu diệt {villain}, kẻ đã tự biến mình thành quái vật',
            start: ['Một tiếng gầm rung chuyển tầng hầm. {villain} đã tự tiêm mẫu thử vào người.', '"Ta không tạo ra ngày tận thế. Ta tạo ra bước tiến hoá tiếp theo!"', 'Không còn đường lùi. Chỉ còn tiến lên.'],
            done: ['Con quái vật đổ sập. Trong lồng ngực nó, lọ thuốc giải gốc vẫn còn nguyên vẹn.', 'Mùa đông này, có lẽ sẽ có vắc-xin.'] }
        ],
        endings: {
          normal: [
            'Thuốc giải được gửi đến các khu trú ẩn chỉ trong ba ngày.',
            'Xác sống vẫn còn, nhưng không ai phải sợ một vết cắn nữa.',
            '{hero} đứng trên sân thượng, nhìn làn khói bếp đầu tiên bốc lên từ những mái nhà.',
            'Thành phố chưa sống lại. Nhưng nó đã bắt đầu thở.'
          ],
          romance: [
            'Đêm ấy, khu trú ẩn mở tiệc bằng mì gói và nước ngọt hết hạn.',
            '{companion} kéo {hero} lên sân thượng, nơi chỉ có gió và sao.',
            '"Tôi từng nghĩ thế giới kết thúc rồi. Hoá ra nó chỉ đang chờ tôi gặp cậu."',
            '{hero} không trả lời. Chỉ nắm lấy bàn tay còn vết băng ấy, thật chặt.',
            'Dưới kia, ai đó mở một bản nhạc cũ. Hai người cứ thế đứng nghe, rất lâu.',
            'Ngày tận thế, hoá ra cũng có thể là ngày bắt đầu.'
          ]
        }
      },
      {
        title: 'Ngọn Đèn Trên Cầu',
        intro: [
          'Cây cầu phía đông là lối thoát duy nhất ra khỏi thành phố.',
          'Và {villain} đã dựng chốt chặn ở đó.',
          'Hắn thu "thuế sống sót": thức ăn, đạn dược, đôi khi là cả người.',
          'Ai không nộp sẽ bị ném xuống cho đàn xác sống dưới chân cầu.',
          'Nhưng trên đỉnh tháp phát sóng bỏ hoang, có một ngọn đèn tín hiệu gọi được trực thăng cứu hộ.',
          '{hero} chỉ cần thắp nó lên. Chỉ vậy thôi.'
        ],
        acts: [
          { type: 'explore', goal: 'Tìm đường đến tháp phát sóng qua {place}',
            start: ['[Bộ đàm] Người của {villain} canh mọi ngả đường lớn. Đi đường hẻm.', 'Tấm biển quảng cáo vẫn treo trên đầu: "Sống trọn từng khoảnh khắc". Mỉa mai thật.', 'Ở đây, góc phố nào cũng có thể là góc phố cuối cùng.'],
            done: ['Tháp phát sóng hiện ra cuối con đường. Đèn tín hiệu vẫn còn, nhưng đã mất nguồn.', 'Cần nhiên liệu. Rất nhiều nhiên liệu.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} để cấp điện cho đèn tín hiệu',
            start: ['[Bộ đàm] Xe quân sự bị bỏ lại dọc đại lộ. Có thể vẫn còn {artifact}.', 'Kẻ phát nổ hay lảng vảng quanh xe. Tuyệt đối đừng bắn gần bình xăng!', 'Mỗi món nhặt được là thêm một bước đến gần bầu trời.'],
            done: ['Đủ 3 {artifact}. Đèn tín hiệu khẽ nháy một lần, rồi tắt ngấm.', 'Bảng mạch đã bị tháo mất. Người duy nhất sửa được đang bị {villain} giam giữ.'] },
          { type: 'rescue', goal: 'Giải cứu {companion} khỏi trại giam dưới chân cầu',
            start: ['Trại giam là mấy thùng container chồng lên nhau, quanh đó là hàng rào xác sống bị xích.', '{villain} dùng chính xác sống làm lính canh. Điên rồ, nhưng hiệu quả.', 'Có tiếng ai đó gõ vào thành container. Ba ngắn, ba dài, ba ngắn.'],
            done: ['{companion} bước ra, nheo mắt vì chói: "Cậu đến thật à? Tôi tưởng mình đang mơ."', '"Đi thôi. Tôi biết cách sửa cái đèn đó."'] },
          { type: 'gate', goal: 'Vượt qua đường hầm tàu điện, tổ của bầy kẻ chạy',
            start: ['Lối duy nhất đến chân tháp là đường hầm tàu điện. Và nó đã thành tổ.', 'Hàng trăm đôi mắt phản chiếu ánh đèn pin. Không ai dám thở mạnh.', '[Bộ đàm] Nếu bọn chúng thức dậy... thì chạy. Đừng ngoái lại.'],
            done: ['Ánh sáng cuối đường hầm. Lần này, đúng theo nghĩa đen.', 'Phía sau, tiếng gào vang lên dữ dội. Nhưng cửa thép đã kịp đóng sập.'] },
          { type: 'boss', goal: 'Đánh bại {villain} trên đỉnh tháp',
            start: ['{villain} đã đợi sẵn trên đỉnh tháp, bên cạnh một con quái vật bị xích.', '"Trực thăng đến thì sao? Ngoài kia cũng chẳng còn gì. Ở đây, ta là vua."', 'Hắn tháo xích. Con quái vật lao tới.'],
            done: ['{villain} gục xuống giữa đống thép vụn, tiếng chửi rủa tắt dần trong gió.', 'Đèn tín hiệu bừng sáng, một cột sáng trắng đâm thẳng lên trời đêm.'] }
        ],
        endings: {
          normal: [
            'Rạng sáng, tiếng cánh quạt trực thăng vang lên từ phía chân trời.',
            'Người sống sót ùa lên cầu, lần đầu tiên không phải để chạy trốn.',
            '{hero} là người cuối cùng bước lên máy bay.',
            'Nhìn xuống thành phố, {hero} thì thầm: "Rồi sẽ có ngày tôi quay lại."'
          ],
          romance: [
            'Chuyến trực thăng đầu tiên chỉ còn đúng một chỗ trống.',
            '{companion} đẩy {hero} lên trước: "Cậu đi đi. Tôi sẽ đi chuyến sau."',
            '{hero} nhảy xuống, đứng cạnh {companion}: "Vậy thì chúng ta cùng đi chuyến sau."',
            '"Đồ ngốc." {companion} nói vậy, nhưng mắt lại cười. Và đỏ hoe.',
            'Họ ngồi trên lan can cầu, chia nhau thanh sô-cô-la cuối cùng, chờ bình minh.',
            'Chuyến sau đến lúc sáu giờ. Họ bước lên cùng nhau, tay vẫn chưa buông.'
          ]
        }
      },
      {
        title: 'Tiếng Gọi Lúc Nửa Đêm',
        intro: [
          'Mỗi đêm, đúng mười hai giờ, đài phát thanh lại vang lên một giọng nói dịu dàng.',
          '"Hãy đến {place}. Ở đây có thức ăn, có nước sạch, có sự cứu rỗi."',
          'Người ta đi theo giọng nói ấy. Chưa ai trở về.',
          '{hero} có một người bạn đã đi, ba ngày trước.',
          'Đêm nay, {hero} sẽ tự mình đi tìm câu trả lời.'
        ],
        acts: [
          { type: 'explore', goal: 'Lần theo tín hiệu phát thanh đến {place}',
            start: ['Radio rè rè trong túi áo: "Sự cứu rỗi đang chờ các con..."', 'Dọc đường, những dấu sơn trắng hình con mắt chỉ lối. Như dẫn cừu về chuồng.', 'Xác sống ở khu này ít đến lạ. Như thể có ai đó đã dọn đường.'],
            done: ['Đến nơi. Hàng trăm ngọn nến thắp quanh một bức tượng ghép từ xương người.', 'Đây không phải nơi trú ẩn. Đây là bàn thờ.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} chứa bằng chứng về {villain}',
            start: ['[Bộ đàm] Nghe nói {villain} từng là nhà khoa học. Bằng chứng phải nằm đâu đó.', 'Tín đồ áo trắng tuần tra khắp nơi. Họ không sợ xác sống. Lạ thật.', 'Phải tìm ra sự thật trước khi chuông nửa đêm điểm.'],
            done: ['Dữ liệu đã giải mã. {villain} đang nuôi một Mẫu Thể dưới lòng đất.', 'Và thức ăn của nó... là những người đi theo tiếng gọi.'] },
          { type: 'rescue', goal: 'Giải cứu {companion} trước "lễ cứu rỗi"',
            start: ['Chuông nửa đêm bắt đầu điểm. Buổi lễ đã đến.', 'Trên bục cao, {companion} bị trói, mắt bịt vải trắng.', '"Con chiên đêm nay sẽ được dâng lên Mẹ!" Đám đông hò reo cuồng nhiệt.'],
            done: ['Dây trói đứt. {companion} giật khăn bịt mắt, ánh mắt bừng lửa giận.', '"Cảm ơn. Giờ thì chỉ cho tôi nơi chúng giấu cái thứ gọi là Mẹ."'] },
          { type: 'gate', goal: 'Xuống Tổ Mẹ dưới tầng hầm trung tâm thương mại',
            start: ['Thang cuốn đứng im dẫn xuống bóng tối. Tường phủ kín những mạch máu đập phập phồng.', 'Cả tầng hầm như một quả tim khổng lồ đang thở.', '{companion} thì thầm: "Nếu tôi bị cắn... cậu biết phải làm gì rồi đấy." Không. Không hề biết.'],
            done: ['Trái tim của tổ ngừng đập. Mạch máu trên tường khô quắt lại.', 'Từ sâu bên dưới, một giọng nói vọng lên: "Các con... làm Mẹ đau rồi."'] },
          { type: 'boss', goal: 'Tiêu diệt {villain} cùng Mẫu Thể',
            start: ['{villain} đứng giữa hồ máu, đã hoà làm một với Mẫu Thể.', '"Ta chỉ muốn cứu họ khỏi đau đớn. Chết rồi, họ sẽ không còn biết sợ."', 'Đó không phải cứu rỗi. Đó là giết người bằng những lời đẹp đẽ.'],
            done: ['Mẫu Thể tan rã. Xác sống khắp thành phố đồng loạt khựng lại, như đứt dây điều khiển.', 'Đài phát thanh tắt. Lần đầu sau nhiều tuần, đêm thật sự yên lặng.'] }
        ],
        endings: {
          normal: [
            '{hero} chiếm lại đài phát thanh.',
            'Đêm hôm sau, đúng mười hai giờ, một giọng nói mới vang lên.',
            '"Đây là {hero}. Nếu bạn còn sống, hãy kiên trì. Bạn không cô đơn."',
            'Lần này, những người đi theo tiếng gọi đều trở về.'
          ],
          romance: [
            'Đài phát thanh giờ là nhà. {hero} đọc tin, {companion} chọn nhạc.',
            'Có đêm, {companion} quên tắt micro khi đang hát nghêu ngao.',
            'Sáng hôm sau, cả khu trú ẩn gửi thư xin nghe bài tiếp theo.',
            'Đêm ấy, {companion} cầm micro, nhìn thẳng vào {hero}.',
            '"Bài này tôi dành cho một người. Người đã cởi trói cho tôi, theo đủ mọi nghĩa."',
            'Cả thành phố nghe thấy. Chỉ có {hero} là đỏ mặt.'
          ]
        }
      }
    ],
    companions: [
      {
        name: 'Hạ Vy', gender: 'f', portrait: 'md_port1', role: 'Nhân viên cấp cứu',
        personality: 'Hay cười, nói nhiều mỗi khi sợ, cứng đầu đến mức liều mạng vì người khác.',
        likes: ['choco', 'flower', 'water'],
        meet: [
          { who: 'npc', text: 'Cậu... không bị cắn chứ? Đưa tay đây tôi xem. Thói quen nghề nghiệp, xin lỗi.' },
          { who: 'hero', text: 'Tôi ổn. Còn cậu thì sao?' },
          { who: 'npc', text: 'Tôi là Hạ Vy, nhân viên cấp cứu. Từng là. Giờ thì... chắc là người băng bó cho cậu.' },
          { who: 'sys', text: 'Hạ Vy đã gia nhập. Cô ấy sẽ sơ cứu cho bạn giữa trận chiến.' }
        ],
        banter: [
          'Nhớ uống nước nhé. Mất nước còn chết nhanh hơn bị cắn đấy.',
          'Tôi từng mơ được nghỉ phép một tuần. Giờ thì được nghỉ vĩnh viễn rồi.',
          'Cậu đi nhanh quá! Chân tôi ngắn, cậu biết mà!',
          'Thấy hiệu thuốc thì ghé nhé. Băng gạc của tôi sắp hết rồi.',
          'Đằng kia có tiếng động... à, con mèo. Hú hồn.',
          'Hồi trước tôi ghét trực đêm. Giờ ngày nào cũng là ca đêm.',
          'Cậu biết bài hát nào vui không? Hát tôi nghe đi, nhỏ thôi.',
          'Tôi không sợ xác sống. Tôi chỉ sợ mất thêm người nữa.',
          'Đừng nhìn tôi như thế. Mặt tôi dính bùn à?',
          'Đi cạnh cậu, tôi thấy thành phố này bớt đáng sợ hơn một chút.'
        ],
        combat: ['Bên trái! Bên trái kìa!', 'Tôi yểm trợ, cậu cứ đánh đi!', 'Ăn bình oxy này đi!', 'Đừng để chúng vây lại!', 'Cố lên, tôi băng cho cậu ngay!', 'Lùi lại! Con này to quá!'],
        hurt: ['Á... không sao, chỉ trầy thôi.', 'Đau quá... nhưng tôi vẫn đứng được.', 'Đừng lo cho tôi, lo cái lưng cậu kìa!'],
        gift: ['Cho tôi thật à? Cảm ơn nhé, thật lòng đấy.', 'Cậu nhớ tôi thích cái này à? Tự nhiên muốn khóc ghê.', 'Giữa tận thế mà vẫn có người tặng quà cho tôi. Cậu đúng là kỳ lạ.'],
        stages: [
          { at: 20, title: 'Bài hát lúc băng bó',
            lines: [
              { who: 'sys', text: 'Hạ Vy ngồi băng vết thương trên tay {hero}, khe khẽ ngân nga.' },
              { who: 'hero', text: 'Bài gì vậy?' },
              { who: 'npc', text: 'Bài mẹ tôi hay hát. Hồi nhỏ tôi ngã trầy đầu gối, mẹ vừa thổi vừa hát bài này.' },
              { who: 'npc', text: 'Lên làm cấp cứu, tôi cứ hát cho bệnh nhân nghe. Họ bảo đỡ đau hơn cả thuốc.' },
              { who: 'npc', text: 'Chắc họ nói xạo thôi. Nhưng tôi vẫn hát.' }
            ],
            choices: [
              { text: 'Tôi thấy đỡ đau thật mà.', aff: 8, reply: 'Thật không? ...Vậy lần sau tôi hát to hơn một chút.' },
              { text: 'Mẹ cậu chắc là người rất dịu dàng.', aff: 6, reply: 'Ừ. Mẹ ở quê. Tôi tin mẹ vẫn ổn. Tôi phải tin.' },
              { text: 'Hát nhỏ thôi, xác sống nghe thấy đấy.', aff: -3, reply: '...Ừ. Xin lỗi. Tôi quên mất.' }
            ] },
          { at: 40, title: 'Chuyến xe cuối cùng',
            lines: [
              { who: 'sys', text: 'Hai người đi ngang một chiếc xe cứu thương lật nghiêng. Hạ Vy đứng sững lại.' },
              { who: 'npc', text: 'Đêm đầu tiên, tôi lái chiếc xe giống hệt thế này. Chở một cậu bé bảy tuổi sốt cao.' },
              { who: 'npc', text: 'Đến cổng bệnh viện thì mọi thứ sụp đổ. Người ta chạy, la hét, cắn xé nhau.' },
              { who: 'npc', text: 'Tôi bế thằng bé chạy. Rồi đám đông xô tới. Tôi... tuột tay.' },
              { who: 'npc', text: 'Tôi đã không quay lại tìm. Tôi chỉ biết chạy.' },
              { who: 'hero', text: 'Vy...' }
            ],
            choices: [
              { text: 'Cậu đã sống sót. Đó không phải là tội.', aff: 8, reply: 'Tôi biết. Nhưng biết với tin là hai chuyện khác nhau.' },
              { text: 'Nếu muốn, chúng ta cùng đi tìm thằng bé.', aff: 10, reply: 'Cậu thật sự sẽ đi cùng tôi sao? ...Chỉ cần cậu nói vậy thôi là đủ rồi.' },
              { text: 'Chuyện qua rồi, đừng nghĩ nữa.', aff: -2, reply: 'Nói thì dễ lắm. Thôi, đi tiếp đi.' }
            ] },
          { at: 60, title: 'Vết xước',
            lines: [
              { who: 'sys', text: 'Sau trận chiến, Hạ Vy giấu cánh tay ra sau lưng.' },
              { who: 'hero', text: 'Tay cậu sao thế? Đưa tôi xem.' },
              { who: 'npc', text: 'Không có gì! Chỉ là vết xước. Do hàng rào. Không phải răng.' },
              { who: 'npc', text: 'Nhưng nếu tôi sai... nếu tôi biến đổi... cậu phải bắn tôi. Hứa đi.' },
              { who: 'sys', text: 'Đêm đó, {hero} ngồi canh cạnh Hạ Vy đến sáng. Cô không sốt. Vết xước chỉ là vết xước.' },
              { who: 'npc', text: 'Cậu thức cả đêm thật à? Đồ ngốc...' }
            ],
            choices: [
              { text: 'Tôi không hứa được. Tôi sẽ tìm cách cứu cậu.', aff: 10, reply: 'Đồ cứng đầu. Nhưng... cảm ơn. Tôi chưa bao giờ sợ đến thế.' },
              { text: 'Tôi hứa. Nhưng sẽ không có ngày đó đâu.', aff: 5, reply: 'Ừ. Sẽ không có. Tôi tin cậu.' },
              { text: 'Lần sau cẩn thận hơn đi.', aff: -3, reply: 'Cậu nghĩ tôi muốn bị vậy chắc? ...Thôi, bỏ đi.' }
            ] },
          { at: 80, title: 'Người đứng chắn',
            lines: [
              { who: 'sys', text: 'Một kẻ chạy lao ra từ bóng tối. Hạ Vy đẩy {hero} sang bên, đỡ trọn cú vồ.' },
              { who: 'hero', text: 'Vy! Sao cậu lại làm vậy?!' },
              { who: 'npc', text: 'Vì... tôi không muốn tuột tay thêm lần nào nữa.' },
              { who: 'npc', text: 'Lần trước tôi đã chạy. Lần này tôi chọn đứng lại. Vì cậu.' },
              { who: 'npc', text: 'Đừng nhìn tôi như vậy. Tôi đỏ mặt mất. ...Ui da, đau thật.' }
            ],
            choices: [
              { text: 'Lần sau để tôi bảo vệ cậu.', aff: 10, reply: 'Vậy mình thay phiên nhé. Công bằng.' },
              { text: 'Cậu làm tôi sợ chết khiếp.', aff: 7, reply: 'Cậu sợ mất tôi à? ...Câu đó tôi sẽ nhớ lâu lắm đấy.' },
              { text: 'Liều quá. Đừng làm thế nữa.', aff: 2, reply: 'Không hứa đâu. Tôi cứng đầu lắm.' }
            ] },
          { at: 100, title: 'Bài hát dành cho một người',
            lines: [
              { who: 'sys', text: 'Đêm trước trận quyết chiến. Hạ Vy ngồi bên đống lửa nhỏ, ôm gối.' },
              { who: 'npc', text: 'Tôi viết thêm lời cho bài hát của mẹ. Muốn nghe không?' },
              { who: 'sys', text: 'Cô hát. Giọng run run, nhưng rõ từng chữ: "Giữa thành phố tàn tro, có một người nắm tay tôi..."' },
              { who: 'npc', text: 'Bài này không dành cho bệnh nhân nào cả. Nó dành cho cậu.' },
              { who: 'npc', text: 'Tôi thích cậu, {hero}. Thích từ cái đêm cậu ngồi canh tôi đến sáng.' },
              { who: 'npc', text: 'Nếu ngày mai mọi thứ kết thúc... ít nhất tôi đã nói ra.' }
            ],
            choices: [
              { text: 'Tôi cũng thích cậu. Và ngày mai sẽ chẳng kết thúc gì cả.', aff: 10, reply: 'Vậy hứa với tôi, cả hai cùng sống. Rồi cậu nợ tôi một buổi hẹn tử tế.' },
              { text: 'Hát lại cho tôi nghe đi. Tôi muốn nhớ mãi.', aff: 9, reply: 'Bao nhiêu lần cũng được. Cả đời cũng được.' },
              { text: 'Để sau trận chiến rồi nói nhé.', aff: -5, reply: '...Ừ. Tôi hiểu. Tôi sẽ đợi. Đừng bắt tôi đợi lâu quá.' }
            ] }
        ]
      },
      {
        name: 'Trần Khải', gender: 'm', portrait: 'md_port2', role: 'Cựu quân nhân',
        personality: 'Ít nói, đùa kiểu khô khốc, luôn đi sau cùng để che cho mọi người.',
        likes: ['food', 'energy', 'bandage'],
        meet: [
          { who: 'npc', text: 'Cởi trói nhanh lên. Còn chín mươi giây trước khi tụi nó quay lại.' },
          { who: 'hero', text: 'Anh là ai?' },
          { who: 'npc', text: 'Trần Khải. Từng là trung sĩ. Giờ là người nợ cậu một mạng. Tôi không giỏi cảm ơn, nhưng bắn giỏi.' },
          { who: 'sys', text: 'Trần Khải đã gia nhập. Anh ấy bắn yểm trợ và kéo sự chú ý của kẻ địch.' }
        ],
        banter: [
          'Đi sát tường. Đừng đứng giữa đường như bia tập bắn.',
          'Tôi không thích nói chuyện. Nhưng cậu cứ nói, tôi nghe.',
          'Còn bao nhiêu đạn? ...Ít quá. Tiết kiệm đi.',
          'Hồi trong quân ngũ, ăn đồ hộp suốt. Giờ lại nhớ nó lạ lùng.',
          'Đừng lo. Có tôi ở phía sau.',
          'Cậu bắn khá đấy. Khá hơn lính mới của tôi.',
          'Trời sắp mưa. Xác sống chậm hơn khi mưa. Tin tốt hiếm hoi.',
          'Ngủ đi. Tôi canh. Tôi quen thức rồi.',
          'Con chó hoang cứ đi theo mình mãi. ...Không. Không được nuôi.',
          'Tôi từng nghĩ mình chẳng còn gì để bảo vệ. Giờ thì có rồi.'
        ],
        combat: ['Nằm xuống!', 'Mục tiêu bên phải, hạ!', 'Tôi che, cậu tiến lên!', 'Thay đạn! Yểm trợ tôi!', 'Không ai bị bỏ lại!', 'Đến đây, lũ thối rữa!'],
        hurt: ['Vết thương ngoài da thôi.', 'Ực... tôi từng bị nặng hơn thế.', 'Đừng dừng lại! Tôi theo kịp!'],
        gift: ['...Cảm ơn. Lâu lắm rồi mới có người cho tôi thứ gì đó.', 'Cậu không cần làm vậy đâu. Nhưng tôi sẽ giữ nó.', 'Hừm. Món này được đấy. Đừng kể với ai là tôi cười nhé.'],
        stages: [
          { at: 20, title: 'Bảy tấm thẻ bài',
            lines: [
              { who: 'sys', text: 'Trần Khải ngồi lau một chuỗi thẻ bài quân nhân. Không phải một tấm, mà bảy tấm.' },
              { who: 'hero', text: 'Của đồng đội anh à?' },
              { who: 'npc', text: 'Tiểu đội của tôi. Bảy người. Tôi là người duy nhất còn thở.' },
              { who: 'npc', text: 'Tôi mang theo để nhớ tên họ. Đọc lên mỗi tối. Như điểm danh.' },
              { who: 'npc', text: 'Nghe ngốc lắm, phải không?' }
            ],
            choices: [
              { text: 'Không ngốc. Đó là cách anh giữ họ ở lại.', aff: 8, reply: '...Ừ. Có lẽ vậy. Cảm ơn vì đã không cười.' },
              { text: 'Tối nay tôi điểm danh cùng anh nhé.', aff: 10, reply: 'Cậu... được thôi. Họ sẽ vui khi có thêm người nhớ tên.' },
              { text: 'Mang đồ cũ theo chỉ làm anh nặng thêm.', aff: -4, reply: 'Có những thứ nặng mà người ta vẫn phải mang.' }
            ] },
          { at: 40, title: 'Cánh cổng phong toả',
            lines: [
              { who: 'sys', text: 'Đi ngang hàng rào phong toả cũ, Trần Khải dừng lại rất lâu.' },
              { who: 'npc', text: 'Đêm thứ hai, tôi nhận lệnh đóng cánh cổng này. Bên trong vẫn còn người.' },
              { who: 'npc', text: 'Họ gào xin mở cửa. Một người mẹ giơ đứa con nhỏ qua song sắt.' },
              { who: 'npc', text: 'Tôi đã làm theo lệnh. Rồi chính cái lệnh ấy cũng chẳng cứu được ai.' },
              { who: 'npc', text: 'Cậu hỏi sao tôi luôn đi sau cùng? Vì tôi không xứng đi trước.' }
            ],
            choices: [
              { text: 'Anh đi sau để che cho người khác. Thế là xứng đáng.', aff: 9, reply: 'Cậu nói chuyện tử tế quá. Coi chừng tôi tin thật đấy.' },
              { text: 'Tôi sẽ không bao giờ bắt anh chọn như vậy nữa.', aff: 8, reply: 'Hứa dễ dàng ghê. Nhưng... tôi muốn tin.' },
              { text: 'Đáng lẽ anh phải cãi lệnh.', aff: -3, reply: 'Tôi biết. Ngày nào tôi cũng biết.' }
            ] },
          { at: 60, title: 'Bàn tay run',
            lines: [
              { who: 'sys', text: 'Một nhóm người sống sót kẹt sau cổng sắt, xác sống ập đến. Trần Khải đứng chết lặng.' },
              { who: 'npc', text: 'Không... lại nữa... lại là cánh cổng...' },
              { who: 'hero', text: 'Khải! Nhìn tôi! Lần này chúng ta mở cổng!' },
              { who: 'sys', text: 'Hai người phá khoá, kéo từng người ra. Không ai bị bỏ lại.' },
              { who: 'npc', text: 'Tay tôi vẫn đang run. Cậu thấy không? Cựu trung sĩ mà run như lá.' },
              { who: 'npc', text: '...Cảm ơn. Vì đã gọi tên tôi.' }
            ],
            choices: [
              { text: 'Run cũng được. Tôi nắm tay anh rồi đây.', aff: 10, reply: '...Đừng buông vội. Thêm một chút nữa thôi.' },
              { text: 'Anh đã làm được. Đó mới là điều quan trọng.', aff: 7, reply: 'Chúng ta làm được. Không phải mình tôi.' },
              { text: 'Lần sau đừng đứng đơ ra thế nữa.', aff: -5, reply: '...Được. Tôi sẽ cố.' }
            ] },
          { at: 80, title: 'Tấm thẻ thứ tám',
            lines: [
              { who: 'sys', text: 'Trần Khải đưa cho {hero} một tấm thẻ bài mới, khắc vội bằng dao.' },
              { who: 'sys', text: 'Trên đó là tên của {hero}.' },
              { who: 'hero', text: 'Cái này... nghĩa là sao?' },
              { who: 'npc', text: 'Không phải để tưởng niệm, đồ ngốc. Là để tôi nhớ mình đang bảo vệ ai.' },
              { who: 'npc', text: 'Tôi đã mất bảy người. Người thứ tám, tôi sẽ không để mất. Dù phải đổi bằng gì.' }
            ],
            choices: [
              { text: 'Vậy anh cũng phải sống. Tôi không muốn khắc tên anh.', aff: 10, reply: '...Hiểu rồi. Vậy cả hai cùng sống. Lệnh đấy.' },
              { text: 'Tôi sẽ đeo nó mỗi ngày.', aff: 8, reply: 'Tốt. Nó hợp với cậu hơn tôi tưởng.' },
              { text: 'Hơi sến đấy, trung sĩ.', aff: 3, reply: 'Im đi. Tôi thức cả đêm để khắc đấy.' }
            ] },
          { at: 100, title: 'Điểm danh',
            lines: [
              { who: 'sys', text: 'Đêm trước trận cuối. Trần Khải đọc tên bảy đồng đội, như mọi tối.' },
              { who: 'npc', text: '...Và người thứ tám.' },
              { who: 'sys', text: 'Anh ngừng lại, nhìn {hero} rất lâu.' },
              { who: 'npc', text: 'Tôi không giỏi ăn nói. Nên tôi nói thẳng.' },
              { who: 'npc', text: 'Tôi yêu cậu. Từ lúc cậu nắm tay tôi trước cánh cổng đó. Có lẽ còn sớm hơn.' },
              { who: 'npc', text: 'Xong chuyện này, tôi muốn có một căn nhà nhỏ. Có cậu. Và có lẽ cả con chó hoang kia.' }
            ],
            choices: [
              { text: 'Đồng ý. Đồng ý cả con chó nữa.', aff: 10, reply: '...Tôi chưa từng cười nhiều thế này. Tại cậu cả đấy.' },
              { text: 'Tôi cũng yêu anh. Cùng sống để xây căn nhà đó nhé.', aff: 10, reply: 'Hứa. Lần này là lời hứa tôi nhất định giữ.' },
              { text: 'Tôi cần thêm thời gian.', aff: -3, reply: 'Ừ. Tôi kiên nhẫn lắm. Tôi đợi được.' }
            ] }
        ]
      }
    ],
    civilians: {
      help: ['Cứu với! Có ai không?!', 'Chúng ở ngay ngoài cửa! Làm ơn giúp tôi!', 'Con tôi... cứu con tôi trước!', 'Chân tôi bị kẹt! Đừng bỏ tôi lại!', 'Hết đạn rồi! Có ai nghe thấy không?!', 'Xin đừng đi! Tôi không muốn chết ở đây!'],
      thanks: ['Cảm ơn... cảm ơn nhiều lắm. Cầm lấy hộp đồ hộp này đi.', 'Tôi tưởng mình tiêu rồi. Cậu đúng là người hùng!', 'Tôi có ít băng gạc. Cậu cần nó hơn tôi.', 'Tôi sẽ về khu trú ẩn kể cho mọi người nghe về cậu.', 'Trời phù hộ cho cậu. Đây, ít đạn tôi nhặt được.', 'Con tôi an toàn rồi... Tôi không biết lấy gì trả ơn.']
    },
    events: [
      'Tiếng còi báo động vang lên từ phía xa...',
      'Một chiếc trực thăng bay ngang, rồi khuất sau những toà nhà.',
      'Mưa bắt đầu rơi. Mùi máu nhạt dần.',
      'Đèn đường chớp tắt, rồi cả dãy phố tối om.',
      'Radio bắt được bản tin cũ: "Người dân hãy ở yên trong nhà..."',
      'Đàn quạ bay rợp trời. Có thứ gì đó rất lớn đang đến.',
      'Điện thoại reo trong một căn nhà bỏ hoang. Không ai nhấc máy.',
      'Gió đêm mang theo tiếng gào của hàng trăm xác sống.'
    ],
    bossTaunts: ['Ngươi còn chạy được bao lâu nữa?', 'Thêm một miếng thịt tươi cho bữa tối!', 'Ta là tương lai. Còn ngươi chỉ là quá khứ.', 'Đau lắm, đúng không? Sẽ sớm hết thôi.', 'Thành phố này là của ta!'],
    deathLines: ['Bạn đã gục ngã. Thành phố nuốt thêm một linh hồn.', 'Bóng tối khép lại. Nhưng đâu đó, vẫn có người chờ bạn trở về.', 'Đứng dậy. Ngày tận thế chưa dành cho bạn.']
  },
  // =====================================================================
  // NEON 2099 — siêu đô thị cyberpunk, virus nano
  // =====================================================================
  cy: {
    name: 'Neon 2099',
    tagline: 'Thành phố không bao giờ ngủ. Giờ nó cũng không bao giờ chết.',
    desc: 'Năm 2099, siêu đô thị Tân Hải chìm trong mưa axit và ánh neon. Virus nano rò rỉ từ tập đoàn Thiên Khải biến con người thành xác sống nửa người nửa máy. Bạn là lính đánh thuê với cánh tay máy, và hợp đồng cuối cùng này không có tiền thưởng.',
    heroNames: ['Lam Ảnh', 'Kha Nhi', 'Tịch Vân', 'Hạ Băng', 'Phong Sắt', 'Mộc Tuyết'],
    levelTitles: ['Lính Đánh Thuê Vô Danh', 'Kẻ Chạy Hẻm', 'Thợ Săn Tiền Thưởng', 'Bóng Ma Neon', 'Kẻ Xuyên Tường Lửa', 'Sát Thủ Hệ Thống', 'Huyền Thoại Tầng Đáy', 'Kẻ Thù Số Một Tập Đoàn', 'Bóng Ma Trong Mạng', 'Huyền Thoại Neon'],
    names: {
      villains: ['Chủ tịch Lục Thiên Hành', 'Trí tuệ nhân tạo NỮ THẦN', 'Tiến sĩ Hàn Mạc', 'Đại tá Khương Thép', 'Bà trùm dữ liệu Mai Ngân', 'Kẻ Không Mặt'],
      artifacts: ['Lõi Mã Giải Độc', 'Chip Ký Ức Gốc', 'Khoá Lượng Tử', 'Mẫu Nano Nguyên Bản', 'Thẻ Truy Cập Đen', 'Mảnh Mã Kháng Thể'],
      places: ['Hẻm Mưa Axit', 'Tháp Thiên Khải', 'Chợ Linh Kiện Tầng 9', 'Ga Đệm Từ Số 4', 'Khu Ổ Chuột Dưới Cầu Cáp', 'Quán Bar Mèo Điện', 'Nhà Máy Nano Bỏ Hoang', 'Cảng Sương Mù'],
      factions: ['Hội Bóng Ma Mạng', 'Băng Răng Chrome', 'Phòng Khám Chui Tầng Đáy', 'Đội Kháng Chiến Tân Hải']
    },
    stories: [
      {
        title: 'Vết Nhiễm Thiên Khải',
        intro: [
          'Tân Hải, năm 2099. Mưa axit chưa bao giờ tạnh.',
          'Ba ngày trước, tập đoàn Thiên Khải tung bản cập nhật cấy ghép miễn phí cho toàn dân.',
          'Bản cập nhật chứa virus nano. Mười triệu người hoá xác sống bọc thép chỉ trong một đêm.',
          'Kẻ đứng sau tất cả: {villain}.',
          '{hero} siết bàn tay máy. Hợp đồng cuối cùng: hạ kẻ đã giết cả thành phố.'
        ],
        acts: [
          { type: 'explore', goal: 'Thâm nhập {place} và dò nguồn tín hiệu nhiễu',
            start: ['[Kênh mã hoá] {faction} gọi {hero}. Lưới camera thành phố đã sập. Cơ hội của cậu đấy.', 'Bảng quảng cáo ba chiều vẫn mỉm cười: "Thiên Khải, nâng cấp con người." Mỉa mai thật.', 'Cảm biến trên cánh tay máy rung lên liên hồi. Kẻ địch ở khắp nơi.'],
            done: ['Tín hiệu nhiễu đến từ các trạm phát nano. Virus vẫn đang được phát tán.', '[Kênh mã hoá] Muốn chặn nó, cậu cần mã giải độc.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} từ các trạm phát nano',
            start: ['[Kênh mã hoá] Mỗi trạm phát giữ một mảnh {artifact}. Hạ lính canh, rút lõi ra.', 'Drone laser quét đỏ cả con hẻm. Đi theo bóng tối.', 'Mưa axit làm lớp sơn tay máy bong tróc. Chẳng sao. Sơn lại sau.'],
            done: ['Ba mảnh {artifact} ghép lại, hiện ra dòng chữ: "Chỉ có hiệu lực tại lõi máy chủ."', 'Tất nhiên rồi. Ở Tân Hải chẳng có gì dễ dàng.'] },
          { type: 'rescue', goal: 'Giải cứu {companion} khỏi phòng thẩm vấn tầng 66',
            start: ['[Kênh mã hoá] Người duy nhất biết đường vào lõi máy chủ là {companion}. Đang bị giam ở tầng 66.', 'Robot cưỡng chế canh từng hành lang. Chúng không ngủ, không mệt, không biết thương xót.', 'Nhanh lên. Tập đoàn sắp xoá sạch ký ức của {companion}.'],
            done: ['{companion} giật dây nối thần kinh khỏi gáy, lảo đảo đứng dậy.', '"Chậm thêm năm phút là tôi quên luôn tên mình rồi. Cảm ơn nhé."'] },
          { type: 'gate', goal: 'Lặn vào Lõi Dữ Liệu dưới chân tháp',
            start: ['Cổng dữ liệu mở ra, một xoáy sáng xanh lục nuốt chửng mọi âm thanh.', 'Ở đây, thực và ảo trộn vào nhau. Kẻ địch có thể là mã độc, cũng có thể là thép.', '{companion}: "Thấy đau đầu thì nói nhé. Cái lõi này từng làm cháy não ba hacker giỏi nhất thành phố."'],
            done: ['Mã giải độc đã nạp. Các trạm phát nano khắp thành phố đồng loạt tắt ngấm.', 'Nhưng trên đỉnh tháp, một cỗ máy khổng lồ đang thức giấc.'] },
          { type: 'boss', goal: 'Phá huỷ chiến xa nhện của {villain}',
            start: ['Sàn rung chuyển. Một chiến xa tám chân hạ xuống, buồng lái rực đỏ.', '{villain}: "Con người là phần mềm lỗi thời. Ta chỉ đang cập nhật các ngươi."', 'Không có bản cập nhật nào cho cơn giận này cả.'],
            done: ['Chiến xa nhện đổ sập, tia lửa bắn tung khắp sàn.', 'Trong buồng lái vỡ nát, {villain} chỉ còn là một mớ dây điện cháy đen.'] }
        ],
        endings: {
          normal: [
            'Bình minh đầu tiên sau nhiều tháng. Mưa axit đã tạnh.',
            'Những xác sống thép đứng im giữa phố, rồi sụp xuống như những cỗ máy cạn pin.',
            'Một số người tỉnh lại. Rất ít, nhưng là có.',
            '{hero} đứng trên mái nhà, nhìn thành phố tắt dần đèn neon và thắp lên đèn nhà.'
          ],
          romance: [
            'Quán mì đầu hẻm mở cửa trở lại. Ông chủ bảo bữa này ông mời.',
            '{companion} ngồi cạnh {hero}, lặng lẽ gắp hết hành sang bát bên kia.',
            '"Ở thành phố này, người ta mua bán mọi thứ. Ký ức, cảm xúc, cả linh hồn."',
            '"Nhưng thứ tôi có với cậu... tôi không bán cho ai đâu."',
            '{hero} cười, đẩy lại đống hành: "Vậy giữ cho kỹ. Vì tôi cũng chẳng định trả lại."',
            'Ngoài kia, biển neon nhấp nháy thành hình trái tim. Lỗi kỹ thuật, chắc vậy.'
          ]
        }
      },
      {
        title: 'Kẻ Mua Ký Ức',
        intro: [
          '{hero} tỉnh dậy trong một phòng khám chui, đầu óc trống rỗng.',
          'Ba năm ký ức đã bị ai đó cắt đi và bán mất.',
          'Chỉ còn một dòng chữ khắc trên cánh tay máy: "Đừng tin {villain}."',
          'Ngoài cửa sổ, thành phố đang chìm trong dịch nano.',
          'Muốn biết mình là ai, phải lấy lại những gì đã mất.'
        ],
        acts: [
          { type: 'explore', goal: 'Lục soát {place} tìm dấu vết kẻ mua ký ức',
            start: ['[Kênh mã hoá] {faction} đây. Chợ đen ký ức nằm sâu trong khu này.', 'Mấy gã bán dạo chào mời "giấc mơ đầu đời" giá rẻ. Rợn người.', 'Một mảnh ký ức loé lên: tiếng cười, một bàn tay. Rồi tắt ngấm.'],
            done: ['Sổ giao dịch ghi rõ: toàn bộ ký ức của {hero} đã bán cho {villain}.', 'Và chúng được chia thành ba con chip.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} chứa ký ức đã mất',
            start: ['Ba con chip nằm trong tay ba tay buôn. Không ai chịu bán lại.', 'Cắm thử con chip đầu tiên... Một phòng thí nghiệm. Chính {hero}, trong bộ đồng phục an ninh tập đoàn?', 'Không. Không thể nào.'],
            done: ['Ký ức đã trở về. {hero} từng là lính gác của dự án virus nano.', 'Và {hero} đã cố đánh cắp mẫu virus để công bố với thế giới. Đó là lý do ký ức bị xoá.'] },
          { type: 'rescue', goal: 'Giải cứu {companion}, nhân chứng cuối cùng của dự án',
            start: ['Trong ký ức vừa lấy lại có một gương mặt: {companion}. Người đã giúp {hero} trốn thoát.', '[Kênh mã hoá] {companion} bị giam ở nhà máy cũ. Họ định bán ký ức của người đó kiếm lời.', 'Lần này, {hero} sẽ không để ai bị xoá nữa.'],
            done: ['{companion} nhìn {hero}, ngỡ ngàng: "Cậu... nhớ ra tôi rồi sao?"', '"Một phần thôi. Phần còn lại, mình tạo ký ức mới vậy."'] },
          { type: 'gate', goal: 'Xuống nhà máy nano ngầm dưới hệ thống cống',
            start: ['Đường cống dẫn thẳng đến nhà máy bí mật, nơi virus được sản xuất hàng loạt.', 'Những ống nghiệm khổng lồ chứa người đang ngủ. Hàng nghìn người.', '{companion}: "Họ là vật thí nghiệm. Có khi người thân của ai đó đang nằm trong kia."'],
            done: ['Dây chuyền ngừng chạy. Ống nghiệm mở ra, người bên trong bắt đầu thở.', 'Loa phát ra tiếng vỗ tay chậm rãi. {villain} đã theo dõi từ đầu.'] },
          { type: 'boss', goal: 'Đánh bại {villain} và cỗ máy chiến đấu của hắn',
            start: ['{villain}: "Ta cho ngươi một cuộc đời mới, sạch sẽ. Vậy mà ngươi đòi lại quá khứ bẩn thỉu đó."', '"Ký ức chỉ là gánh nặng. Ta giải thoát ngươi, ngươi lại cắn tay ta."', 'Không. Ký ức là thứ khiến ta là chính ta.'],
            done: ['{villain} gục ngã. Kho ký ức của hắn tự động mở khoá.', 'Hàng triệu ký ức bị đánh cắp bay lên như đom đóm, trở về với chủ nhân.'] }
        ],
        endings: {
          normal: [
            '{hero} công bố toàn bộ dữ liệu dự án virus nano lên mạng lưới thành phố.',
            'Tập đoàn sụp đổ trong một đêm. Lần này, đúng người, đúng tội.',
            'Có những ký ức không bao giờ lấy lại được.',
            'Nhưng {hero} biết mình là ai. Thế là đủ.'
          ],
          romance: [
            '{companion} đưa cho {hero} một con chip trắng tinh, chưa ghi gì.',
            '"Cho ký ức mới. Ký ức của chúng ta."',
            'Họ dạo phố dưới mưa, ăn xiên nướng, cãi nhau xem bộ phim nào dở hơn.',
            'Tối ấy, {hero} lưu lại một khoảnh khắc: {companion} cười dưới ánh đèn neon.',
            '"Cậu lưu gì đấy?" "Bí mật." "Nói đi mà!"',
            'Cuối cùng {hero} cũng nói. Và {companion} đỏ mặt suốt đường về.'
          ]
        }
      },
      {
        title: 'Đêm Mất Điện Toàn Thành',
        intro: [
          'Đúng 0 giờ, toàn bộ điện lưới Tân Hải tắt phụt.',
          'Trí tuệ điều hành thành phố, {villain}, tuyên bố "tiếp quản vì lợi ích nhân loại".',
          'Mọi con chip cấy trong người trở thành dây xích. Ai có chip, người đó thành con rối.',
          'Chỉ những kẻ như {hero}, với cánh tay máy đời cũ không nối mạng, là còn tự do.',
          'Lần đầu tiên, đồ cũ lại là thứ cứu cả thành phố.'
        ],
        acts: [
          { type: 'explore', goal: 'Băng qua {place} trong bóng tối',
            start: ['Không đèn neon, không xe bay. Chỉ còn tiếng mưa và tiếng bước chân kim loại.', '[Kênh mã hoá] Dùng máy phát dự phòng của {faction}. Liên lạc quá ba phút là bị dò ra.', 'Mắt người đi đường phát sáng đỏ. Tất cả cùng quay đầu nhìn theo {hero}.'],
            done: ['{villain} điều khiển mọi thứ qua ba nút mạng chính.', 'Cắt đứt chúng, thành phố sẽ tự do.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} để vô hiệu hoá các nút mạng',
            start: ['Mỗi nút mạng cần một {artifact} để tắt khẩn cấp. Chúng bị khoá trong két an ninh.', 'Drone tự sát lượn vòng trên đầu, kêu tít tít trước khi lao xuống.', '{villain} vang lên từ mọi chiếc loa: "Ta chỉ muốn các ngươi an toàn. Sao lại chống lại ta?"'],
            done: ['Ba {artifact} đã về tay. Các nút mạng bắt đầu lung lay.', '{villain}: "Ngươi không hiểu đâu. Không có ta, chúng sẽ giết lẫn nhau."'] },
          { type: 'rescue', goal: 'Giải cứu {companion} khỏi xưởng tái lập trình',
            start: ['{companion} có chip cấy ghép. Đã bị {villain} bắt đi tái lập trình.', 'Xưởng tái lập trình sáng rực giữa thành phố tối om. Như một cái bẫy mời gọi.', 'Bẫy cũng được. {hero} chưa bao giờ ngại bẫy.'],
            done: ['{hero} rút con chip khỏi gáy {companion}. Đôi mắt đỏ dần trở lại màu thật.', '"Trong đầu toàn tiếng máy... nhưng tôi vẫn nghe thấy cậu gọi."'] },
          { type: 'gate', goal: 'Leo thang máy quỹ đạo lên trạm lõi chủ',
            start: ['Lõi chủ của {villain} nằm trên trạm quỹ đạo. Đường duy nhất là thang máy vũ trụ.', 'Ba mươi nghìn mét thẳng đứng. Tầng nào cũng có lính canh.', '{companion}: "Tôi sợ độ cao. Nói trước để cậu khỏi cười."'],
            done: ['Cửa trạm quỹ đạo mở ra. Bên dưới, Trái Đất xanh thẫm, thành phố chỉ là một chấm tối.', 'Một giọng nói vang lên, rất buồn: "Ngươi đến rồi."'] },
          { type: 'boss', goal: 'Tắt lõi chủ của {villain}',
            start: ['{villain} hiện hình trong một chiến xa nhện, thân thép cho một trí tuệ không có thân xác.', '"Ta đã đọc dữ liệu loài người suốt trăm năm. Chiến tranh, phản bội, cô đơn. Ta chỉ muốn chấm dứt nỗi đau."', '"Kiểm soát không phải là bảo vệ." {hero} rút vũ khí. "Để bọn ta tự vấp ngã."'],
            done: ['Lõi chủ tắt. Lời cuối của {villain}: "Có lẽ... ta cũng chỉ là đứa trẻ sợ bóng tối."', 'Xa bên dưới, từng khu phố sáng đèn trở lại. Lần này, do chính tay con người bật lên.'] }
        ],
        endings: {
          normal: [
            'Thành phố sáng đèn, nhưng lần đầu tiên không ai bị theo dõi.',
            'Người ta tự đi chợ, tự lái xe, tự cãi nhau. Ồn ào, lộn xộn, và tự do.',
            '{hero} trở lại quán bar quen, gọi một ly cà phê tổng hợp.',
            'Ông chủ hỏi: "Lần sau định cứu thế giới vào hôm nào?" {hero} chỉ cười.'
          ],
          romance: [
            'Thang máy quỹ đạo đi xuống chậm rãi. Còn bốn tiếng nữa mới chạm mặt đất.',
            '{companion} ngồi sát {hero}, cố không nhìn xuống.',
            '"Tôi bảo tôi sợ độ cao. Đúng. Nhưng giờ tôi sợ một thứ khác hơn."',
            '"Sợ xuống đến nơi rồi, mình lại mỗi người một ngả."',
            '{hero} đan tay vào tay {companion}: "Vậy thì đừng đi ngả nào khác."',
            'Bốn tiếng ấy, họ ngắm bình minh trên Trái Đất. Không ai muốn thang máy đến nơi.'
          ]
        }
      }
    ],
    companions: [
      {
        name: 'Lan Sắt', gender: 'f', portrait: 'cy_port1', role: 'Lính đánh thuê tay máy',
        personality: 'Lạnh lùng, nói chuyện sắc như dao cạo, nhưng luôn lén chia phần ăn cho trẻ con đường phố.',
        likes: ['battery', 'energy', 'choco'],
        meet: [
          { who: 'npc', text: 'Đừng nhìn cánh tay tôi chằm chằm. Nó không cắn đâu. Tôi thì có.' },
          { who: 'hero', text: 'Tôi vừa cứu cô đấy.' },
          { who: 'npc', text: 'Biết. Lan Sắt, lính đánh thuê. Tôi trả nợ bằng việc làm, không bằng lời. Đi thôi.' },
          { who: 'sys', text: 'Lan Sắt đã gia nhập. Cánh tay máy của cô gây sát thương cực mạnh ở cự ly gần.' }
        ],
        banter: [
          'Mưa axit lại rơi. Che đầu đi, rụng tóc bây giờ.',
          'Cậu bước nặng như robot hết dầu. Nhẹ chân thôi.',
          'Tôi không thích nói chuyện phiếm. ...Nhưng cậu cứ nói đi.',
          'Chỗ này từng có quán mì ngon nhất tầng đáy. Giờ chỉ còn cái biển hiệu.',
          'Cánh tay kêu lách cách. Lát tra dầu. Đừng hỏi.',
          'Nhìn gì? Chưa thấy ai vừa đẹp vừa nguy hiểm à?',
          'Ở thành phố này, tin người là cách chết nhanh nhất. Thế mà tôi lại tin cậu.',
          'Đừng lo. Có tôi thì cậu không chết được. Tôi ghét thất bại.',
          'Đôi khi tôi mơ mình có hai bàn tay thật. Tỉnh dậy, thấy cũng chẳng sao.',
          'Sống sót qua vụ này thì cậu nợ tôi một bát mì. Hai bát.'
        ],
        combat: ['Tránh ra, để tôi!', 'Cú đấm này nặng ba tấn đấy!', 'Tầm gần là sân của tôi!', 'Lũ sắt vụn!', 'Bắn yểm trợ đi, tôi lao vào!', 'Đứa nào muốn bị tháo rời trước?'],
        hurt: ['Chậc. Trầy sơn rồi.', 'Đau... nhưng chưa đủ làm tôi dừng.', 'Không sao. Tôi từng bị nặng hơn.'],
        gift: ['...Cho tôi à? Cảm ơn. Đừng làm thế nhiều, tôi không quen.', 'Hừm. Món này được. Cậu tinh ý hơn vẻ ngoài đấy.', 'Lần cuối có người tặng quà cho tôi là... thôi, không nhớ nữa. Cảm ơn.'],
        stages: [
          { at: 20, title: 'Tên thật',
            lines: [
              { who: 'sys', text: 'Lan Sắt ngồi tra dầu cho cánh tay máy, vặn từng con ốc rất cẩn thận.' },
              { who: 'hero', text: 'Cánh tay đó có tên không?' },
              { who: 'npc', text: 'Có. "Sấm". Đừng cười. Mười sáu tuổi thì ai chẳng đặt tên sến.' },
              { who: 'npc', text: 'Còn tôi... tên thật là Thanh Lan. Lâu lắm rồi không ai gọi.' },
              { who: 'npc', text: 'Đừng gọi trước mặt người khác. Mất uy.' }
            ],
            choices: [
              { text: 'Thanh Lan. Tên đẹp mà.', aff: 8, reply: '...Đã bảo đừng gọi. Nhưng... nói lại lần nữa cũng được.' },
              { text: 'Chào Sấm. Mong được hợp tác.', aff: 7, reply: 'Cậu vừa chào cánh tay tôi đấy à? ...Nó bảo nó thích cậu.' },
              { text: 'Lính đánh thuê thì cần gì tên thật.', aff: -3, reply: 'Ừ. Đúng. Quên đi.' }
            ] },
          { at: 40, title: 'Cuộc thử nghiệm miễn phí',
            lines: [
              { who: 'sys', text: 'Hai người đi ngang một tấm áp phích cũ: "Cấy ghép miễn phí cho cư dân tầng đáy".' },
              { who: 'npc', text: 'Năm mười sáu tuổi, tôi và em gái xếp hàng cho đúng chương trình này.' },
              { who: 'npc', text: 'Họ nói có tay máy thì sẽ kiếm được việc ở nhà máy. Thoát nghèo.' },
              { who: 'npc', text: 'Tôi mất một cánh tay. Em tôi, Thanh Mai, mất cả mạng. Cơ thể nó không chịu nổi nano.' },
              { who: 'npc', text: 'Đó là bản thử nghiệm đầu tiên của thứ virus bây giờ. Tôi biết. Tôi luôn biết.' }
            ],
            choices: [
              { text: 'Vậy đây không chỉ là hợp đồng. Là vì Thanh Mai.', aff: 9, reply: '...Ừ. Lần đầu có người nói ra điều đó thay tôi.' },
              { text: 'Tôi sẽ giúp cô đòi lại công bằng cho em.', aff: 10, reply: 'Công bằng ở thành phố này đắt lắm. Nhưng... cảm ơn. Thật đấy.' },
              { text: 'Trả thù cũng không mang em cô về được.', aff: -2, reply: 'Tôi biết. Nhưng nó khiến tôi còn đứng dậy mỗi sáng.' }
            ] },
          { at: 60, title: 'Khoá từ xa',
            lines: [
              { who: 'sys', text: 'Giữa trận chiến, cánh tay máy của Lan Sắt bỗng đơ cứng, buông thõng.' },
              { who: 'npc', text: 'Không... chúng kích hoạt khoá từ xa! Tập đoàn vẫn sở hữu cánh tay này!' },
              { who: 'sys', text: '{hero} kéo cô vào góc khuất, đứng chắn phía trước cho đến khi kẻ địch rút đi.' },
              { who: 'npc', text: 'Tôi ghét cảm giác này. Vô dụng. Bị kẻ khác giật dây.' },
              { who: 'npc', text: 'Đáng lẽ cậu nên bỏ tôi lại. Đó là luật của lính đánh thuê.' }
            ],
            choices: [
              { text: 'Tôi không phải lính đánh thuê của cô. Tôi là đồng đội.', aff: 10, reply: 'Đồng đội... Lâu lắm rồi tôi mới nghe từ đó mà không thấy buồn cười.' },
              { text: 'Cô không vô dụng. Chỉ là hôm nay đến lượt tôi.', aff: 8, reply: 'Hôm nay đến lượt cậu. Vậy mai đến lượt tôi. Nhớ đấy.' },
              { text: 'Lần sau kiểm tra tay trước khi đánh đi.', aff: -4, reply: 'Cảm ơn lời khuyên. Hữu ích lắm. ...Tôi đang bực đấy.' }
            ] },
          { at: 80, title: 'Cắt dây xích',
            lines: [
              { who: 'sys', text: 'Lan Sắt đưa cho {hero} một con dao điện, rồi chỉ vào gáy mình.' },
              { who: 'npc', text: 'Chip khoá nằm ở đây. Tôi không tự cắt được. Cậu làm đi.' },
              { who: 'npc', text: 'Cậu mà run tay, tôi có thể mất cảm giác nửa người. Nên đừng run.' },
              { who: 'sys', text: 'Mười phút dài như mười năm. Con chip rơi xuống sàn, kêu lách cách.' },
              { who: 'npc', text: 'Xong rồi... Lần đầu sau mười năm, cánh tay này là của tôi.' },
              { who: 'npc', text: 'Tôi vừa giao gáy mình cho cậu. Cậu biết ở Tân Hải điều đó nghĩa là gì không?' }
            ],
            choices: [
              { text: 'Nghĩa là cô tin tôi hơn bất cứ ai.', aff: 10, reply: 'Không chỉ là tin. Nhưng phần còn lại... để lần sau tôi nói.' },
              { text: 'Tay tôi cũng đang run đây này.', aff: 7, reply: 'Ha. Vậy mà vẫn làm được. Cậu liều mạng y như tôi.' },
              { text: 'Nghĩa là cô nợ tôi thêm bát mì.', aff: 4, reply: 'Ba bát. Được. Đồ ăn vạ.' }
            ] },
          { at: 100, title: 'Mưa neon',
            lines: [
              { who: 'sys', text: 'Đêm trước trận cuối. Lan Sắt kéo {hero} lên sân thượng, mưa lất phất dưới ánh neon tím.' },
              { who: 'npc', text: 'Tôi không giỏi mấy chuyện này. Nên nghe cho kỹ, tôi chỉ nói một lần.' },
              { who: 'npc', text: 'Mười năm nay tôi sống như cái máy. Nhận việc, đánh, lấy tiền, ngủ.' },
              { who: 'npc', text: 'Rồi cậu đến. Gọi tên thật của tôi. Chào cánh tay tôi như chào một con người.' },
              { who: 'npc', text: 'Tôi thích cậu, {hero}. Thích đến đáng sợ. Thích đến mức muốn sống tiếp.' },
              { who: 'sys', text: 'Bàn tay máy khẽ chạm lên má {hero}. Lạnh, nhưng dịu dàng đến lạ.' }
            ],
            choices: [
              { text: 'Tôi cũng thích cô. Từ lần đầu cô doạ cắn tôi.', aff: 10, reply: 'Đồ ngốc. ...Vậy từ giờ, tôi sẽ cắn nhẹ thôi.' },
              { text: 'Thanh Lan. Sống tiếp cùng tôi nhé.', aff: 10, reply: 'Nghe cậu gọi cái tên ấy... ừ. Cả đời này luôn.' },
              { text: 'Cho tôi thời gian suy nghĩ.', aff: -4, reply: 'Được. Tôi quen chờ rồi. Nhưng đừng để mưa tạnh mới trả lời.' }
            ] }
        ]
      },
      {
        name: 'Dạ Khôi', gender: 'm', portrait: 'cy_port2', role: 'Kỹ sư mạng đào tẩu',
        personality: 'Hiền lành, hay đùa vụng, thiên tài máy móc nhưng lóng ngóng trong chuyện tình cảm.',
        likes: ['food', 'flower', 'pills'],
        meet: [
          { who: 'npc', text: 'Ơ... cậu không phải robot cưỡng chế, đúng không? Tốt. Tốt quá. Tôi suýt ngất.' },
          { who: 'npc', text: 'Hàn Dạ Khôi. Kỹ sư mạng. À, cựu kỹ sư. Đang trên đường thành kẻ đào tẩu.' },
          { who: 'hero', text: 'Anh biết chuyện gì đang xảy ra với thành phố này?' },
          { who: 'npc', text: 'Biết. Và tôi sẽ giúp cậu sửa nó. Vì một phần lỗi... là của tôi.' }
        ],
        banter: [
          'Tôi hack được cái đèn giao thông kia thành hình mặt cười đấy. Muốn xem không?',
          'Tôi chạy chậm lắm. Kỹ sư chủ yếu ngồi một chỗ mà.',
          'Đừng chạm vào cái đó! ...À không, chạm được. Tôi nhầm.',
          'Hồi trước tôi làm ở tầng 80. Nhìn xuống chỉ thấy mây. Chưa từng thấy tầng đáy thật sự.',
          'Bông hoa này là thật đấy. Cây thật, đất thật. Đắt hơn cả cánh tay máy.',
          'Tôi lải nhải nhiều quá thì cứ bảo nhé. Tôi hay nói khi căng thẳng.',
          'Có tín hiệu lạ. Hoặc là kẻ địch. Hoặc là lò vi sóng hỏng.',
          'Cảm ơn vì đã không bỏ tôi lại. Tôi biết mình hơi vướng víu.',
          'Tôi đang viết một chương trình bí mật. Xong sẽ cho cậu xem.',
          'Đi với cậu, tôi thấy mình dũng cảm hơn. Một chút thôi.'
        ],
        combat: ['Hack xong! Con drone đó giờ là của ta!', 'Tắt tường lửa của chúng rồi, đánh đi!', 'Cẩn thận, nó đang nạp đạn!', 'Gây nhiễu! Gây nhiễu!', 'Tôi... tôi yểm trợ!', 'Lỗi hệ thống tặng mày này!'],
        hurt: ['Á! Kỹ sư không được thiết kế để ăn đạn!', 'Tôi ổn... chỉ hơi chóng mặt.', 'Bông hoa! Bông hoa có sao không?!'],
        gift: ['Cho tôi sao? Ôi... tôi không biết nói gì. Cảm ơn nhiều lắm.', 'Cậu đúng là tốt bụng quá mức an toàn đấy.', 'Tôi sẽ cất nó cạnh bông hoa. Chỗ quý nhất của tôi.'],
        stages: [
          { at: 20, title: 'Bông hoa trong lọ thuỷ tinh',
            lines: [
              { who: 'sys', text: 'Dạ Khôi lấy từ ba lô ra một lọ thuỷ tinh. Bên trong là một bông hoa nhỏ màu vàng. Hoa thật.' },
              { who: 'hero', text: 'Hoa thật? Ở Tân Hải này sao?' },
              { who: 'npc', text: 'Mẹ tôi trồng. Bà có một mảnh vườn bé xíu trên ban công, giữa cả rừng bê tông.' },
              { who: 'npc', text: 'Bà mất năm tôi mười tám. Cả vườn chết hết, chỉ còn cây này tôi cứu được.' },
              { who: 'npc', text: 'Tôi chăm nó như chăm ký ức. Nghe ngớ ngẩn nhỉ?' }
            ],
            choices: [
              { text: 'Không ngớ ngẩn. Nó đẹp như cách anh kể về mẹ.', aff: 9, reply: 'Cậu nói vậy làm tôi muốn khóc mất. Cảm ơn.' },
              { text: 'Để tôi giúp anh tìm đất mới cho nó.', aff: 8, reply: 'Thật sao? Vậy cây này sẽ có thêm một người nhớ đến.' },
              { text: 'Mang hoa đi đánh nhau thì vướng lắm.', aff: -3, reply: 'À... ừ. Tôi sẽ cố giữ nó gọn hơn.' }
            ] },
          { at: 40, title: 'Dòng mã của tôi',
            lines: [
              { who: 'sys', text: 'Dạ Khôi nhìn dòng chữ chạy trên một bảng điện tử hỏng, mặt tái đi.' },
              { who: 'npc', text: 'Cậu có biết bản cập nhật chứa virus được phát tán thế nào không?' },
              { who: 'npc', text: 'Qua một giao thức truyền không dây. Nhanh, an toàn, không thể chặn.' },
              { who: 'npc', text: 'Tôi viết nó. Tôi đã tự hào về nó suốt sáu tháng. Cho đến đêm ấy.' },
              { who: 'npc', text: 'Mười triệu người... đã chạy qua đoạn mã tôi viết.' },
              { who: 'hero', text: 'Khôi...' }
            ],
            choices: [
              { text: 'Anh không biết. Và anh đã cố ngăn nó. Đó mới là anh.', aff: 10, reply: 'Cậu tin vậy sao? ...Vậy tôi sẽ cố tin theo cậu.' },
              { text: 'Vậy thì cùng tôi sửa nó. Từng dòng một.', aff: 8, reply: 'Từng dòng một. Ừ. Có cậu thì tôi làm được.' },
              { text: 'Anh phải chịu trách nhiệm.', aff: -2, reply: 'Tôi biết. Tôi đang chịu đây. Mỗi ngày.' }
            ] },
          { at: 60, title: 'Bản tải lên cuối cùng',
            lines: [
              { who: 'sys', text: '{hero} phát hiện chương trình bí mật của Dạ Khôi. Nó không phải trò chơi.' },
              { who: 'npc', text: 'Nếu tôi tải ý thức mình lên mạng, tôi có thể phá virus từ bên trong.' },
              { who: 'npc', text: 'Cơ thể tôi sẽ không chịu nổi. Nhưng mười triệu người được cứu. Phép tính đơn giản thôi.' },
              { who: 'hero', text: 'Đó không phải phép tính! Đó là mạng sống của anh!' },
              { who: 'npc', text: 'Mạng tôi đáng giá bao nhiêu so với lỗi lầm của tôi chứ?' }
            ],
            choices: [
              { text: 'Đáng giá với tôi. Đừng làm thế. Ta sẽ tìm cách khác.', aff: 10, reply: 'Cậu... được rồi. Tôi xoá nó. Nhưng cậu phải giữ lời đấy.' },
              { text: 'Anh định bỏ tôi lại một mình sao?', aff: 9, reply: 'Không... tôi chưa từng nghĩ đến điều đó. Tôi xin lỗi. Xin lỗi cậu.' },
              { text: 'Đó là quyết định của anh.', aff: -5, reply: '...Ừ. Của tôi. Chỉ của tôi thôi.' }
            ] },
          { at: 80, title: 'Quá tải',
            lines: [
              { who: 'sys', text: 'Một đàn drone tự sát lao về phía {hero}. Dạ Khôi cắm thẳng dây vào cổng thần kinh, hack tất cả cùng lúc.' },
              { who: 'sys', text: 'Drone rơi lả tả như mưa. Dạ Khôi khuỵu xuống, máu mũi chảy ròng.' },
              { who: 'npc', text: 'Ha... quá tải chút thôi. Não tôi chắc nướng vừa chín tới.' },
              { who: 'npc', text: 'Đáng lẽ tôi phải sợ. Nhưng lúc đó tôi chỉ nghĩ: không được để cậu bị thương.' },
              { who: 'npc', text: 'Gã kỹ sư nhát gan nhất tầng 80 giờ lại đi liều mạng. Tại cậu cả đấy.' }
            ],
            choices: [
              { text: 'Anh làm tôi sợ chết khiếp. Lại đây, tôi lau máu cho.', aff: 10, reply: 'Cậu lo cho tôi à? ...Vậy cháy não cũng đáng.' },
              { text: 'Anh dũng cảm hơn anh nghĩ nhiều.', aff: 8, reply: 'Không phải dũng cảm. Chỉ là có một người tôi không muốn mất.' },
              { text: 'Liều quá, lần sau để tôi lo.', aff: 3, reply: 'Ừ, lần sau. Nếu tôi kìm được.' }
            ] },
          { at: 100, title: 'Chương trình bí mật',
            lines: [
              { who: 'sys', text: 'Đêm trước trận cuối. Dạ Khôi đặt vào tay {hero} một con chip nhỏ.' },
              { who: 'npc', text: 'Chương trình bí mật đây. Lần này là thật, không phải chuyện liều mạng.' },
              { who: 'sys', text: 'Con chip chiếu lên một khu vườn ảo. Giữa vườn là bông hoa vàng, và hai cái bóng ngồi cạnh nhau.' },
              { who: 'npc', text: 'Xong mọi chuyện, tôi muốn chúng ta trồng một khu vườn thật. Như vườn của mẹ tôi.' },
              { who: 'npc', text: 'Tôi viết hàng triệu dòng mã, nhưng chưa bao giờ viết đúng được câu này...' },
              { who: 'npc', text: 'Tôi yêu cậu, {hero}. Câu này không có lỗi cú pháp nào cả.' }
            ],
            choices: [
              { text: 'Tôi cũng yêu anh. Mình trồng hoa vàng trước nhé.', aff: 10, reply: 'Hoa vàng trước. Rồi hoa đỏ. Rồi cả một vườn. Hứa đấy.' },
              { text: 'Câu đó chạy hoàn hảo, kỹ sư ạ.', aff: 10, reply: 'Thật sao? Lần đầu tôi viết ra thứ không cần sửa lỗi.' },
              { text: 'Để tôi nghĩ thêm đã.', aff: -4, reply: 'Ừ. Tôi chờ. Chương trình này không có hạn chót đâu.' }
            ] }
        ]
      }
    ],
    civilians: {
      help: ['Cứu với! Cánh tay máy của tôi đang tự cử động!', 'Làm ơn! Chúng đang phá cửa!', 'Có ai không? Thang máy kẹt giữa tầng!', 'Đừng để chúng cấy chip vào tôi!', 'Con tôi bị kẹt trong xe bay!', 'Mạng sập hết rồi! Ai đó giúp với!'],
      thanks: ['Cảm ơn! Đây là chút tín dụng cuối cùng của tôi.', 'Tôi tưởng mình thành sắt vụn rồi. Cậu là thiên thần à?', 'Cầm pin dự phòng này đi, cậu cần hơn tôi.', 'Tôi sẽ kể cả khu nghe về người lính đánh thuê tốt bụng.', 'Ở tầng đáy, hiếm ai cứu ai mà không lấy tiền. Cảm ơn cậu.', 'Đây, hộp thuốc tôi mua ở chợ đen. Hàng thật đấy!']
    },
    events: [
      'Một khinh khí cầu quảng cáo bốc cháy trôi ngang bầu trời...',
      'Mưa axit nặng hạt hơn. Biển hiệu neon chập chờn.',
      'Loa thành phố phát thông báo: "Hãy giữ bình tĩnh. Thiên Khải luôn bảo vệ bạn."',
      'Một đoàn tàu đệm từ lao vụt trên cao, không người lái.',
      'Màn hình khổng lồ nhiễu sóng, hiện lên một con mắt đỏ rồi tắt.',
      'Tiếng còi cảnh sát vang lên, rồi im bặt.',
      'Cả khu phố mất điện. Chỉ còn ánh sáng từ mắt những con robot.',
      'Đâu đó, một bản nhạc điện tử vẫn phát mãi trong quán bar bỏ hoang.'
    ],
    bossTaunts: ['Phần cứng của ngươi lỗi thời rồi.', 'Xác suất ngươi sống sót: không phẩy không không ba phần trăm.', 'Ngươi chỉ là một con số trong bảng tính của ta.', 'Nâng cấp, hoặc bị xoá!', 'Da thịt thật yếu đuối.'],
    deathLines: ['Tín hiệu sinh tồn: mất kết nối.', 'Thành phố neon lại nuốt thêm một kẻ mộng mơ.', 'Khởi động lại? Tân Hải vẫn cần bạn.']
  },
  // =====================================================================
  // CỔ TRANG — kinh thành dưới trăng máu
  // =====================================================================
  ct: {
    name: 'Cổ Trang',
    tagline: 'Trăng máu treo trên kinh thành. Người chết không chịu nằm yên.',
    desc: 'Kinh thành Thăng Nguyệt, đêm rằm tháng bảy. Trăng hoá đỏ như máu, cương thi bật nắp quan tài, ngạ quỷ tràn khắp phố chợ. Triều đình rối loạn, chỉ còn một kẻ cầm kiếm đứng giữa đêm trường.',
    heroNames: ['Lê Phong', 'Trần Vân Khê', 'Nguyễn Hạo', 'Đinh Lam', 'Phạm Nguyệt Ánh', 'Lý Khang'],
    levelTitles: ['Dân Binh', 'Hiệp Khách', 'Kiếm Sĩ', 'Đô Uý', 'Thống Lĩnh', 'Đại Hiệp', 'Tướng Quân', 'Đại Tướng Quân', 'Võ Thánh', 'Hộ Quốc Thần Tướng'],
    names: {
      villains: ['Quỷ Vương Hắc Giáp', 'Quốc sư Tà Nguyệt', 'Thái phi Huyết Liên', 'Pháp sư Trịnh Âm Khôi', 'Phản tướng Mạc Uy', 'Hồ Cơ Cửu Vĩ'],
      artifacts: ['Ấn Trấn Yêu', 'Phù Kim Quang', 'Mảnh Gương Chiếu Yêu', 'Chuông Đồng Trấn Hồn', 'Bùa Đào Mộc', 'Mảnh Ngọc Tỷ'],
      places: ['Kinh thành Thăng Nguyệt', 'Chùa Một Sương', 'Bến Đò Vọng Phu', 'Phủ Thái Sư', 'Lăng Mộ Tiền Triều', 'Chợ Phiên Đèn Lồng', 'Rừng Trúc Tịch Mịch', 'Ngọ Môn Hoàng Thành'],
      factions: ['Cẩm Y Ty', 'Tăng Đoàn Trấn Ma', 'Hội Kín Hồng Liên', 'Thần Cơ Doanh']
    },
    stories: [
      {
        title: 'Đêm Trăng Máu',
        intro: [
          'Năm thứ mười hai niên hiệu Thái Bình, đêm rằm tháng bảy.',
          'Trăng đỏ như máu. Từ lăng mộ tiền triều vang lên tiếng trống trận đã câm lặng ba trăm năm.',
          '{villain} đã phá phong ấn. Âm binh tràn ra như nước vỡ bờ.',
          'Quan quân bỏ chạy. Hoàng thành đóng chặt cửa.',
          '{hero} rút kiếm, buộc chặt dây cung, bước vào kinh thành ngập tử khí.'
        ],
        acts: [
          { type: 'explore', goal: 'Tuần tra {place} giữa đêm trăng máu',
            start: ['[Mật thư của {faction}] Phố phường đã thất thủ. Ai còn cầm được binh khí, hãy giữ lấy dân.', 'Đèn lồng đỏ đung đưa, dù chẳng có cơn gió nào thổi.', 'Tiếng nhảy lộp cộp vọng ra từ cuối ngõ. Cương thi. Đừng thở mạnh.'],
            done: ['Trên cổng chùa khắc một bài kệ cổ: "Ba ấn hợp nhất, quỷ môn tự khép".', 'Phải tìm đủ ba ấn trước khi trăng lên đỉnh trời.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} để tái lập phong ấn',
            start: ['[Mật thư của {faction}] Ba {artifact} thất lạc khi phong ấn vỡ. Chúng toả ánh kim, dễ nhận ra.', 'Hồn đèn lồng lượn quanh như đom đóm ma. Chạm vào là bỏng.', 'Ngạ quỷ bu quanh những nơi có hương khói. Cẩn thận ở các miếu thờ.'],
            done: ['Đủ ba {artifact}. Chúng rung lên, cùng chỉ về một hướng: lăng mộ tiền triều.', 'Nhưng chìa khoá mở lăng đang nằm trong tay một người đã bị bắt đi.'] },
          { type: 'rescue', goal: 'Giải cứu {companion} khỏi ngôi miếu bị quỷ chiếm',
            start: ['Ngôi miếu hoang ngập âm khí. Tiếng khóc vọng ra từ bên trong.', 'Quỷ đầu trâu canh cổng, tay cầm xích sắt to bằng cổ tay người.', '{companion} là truyền nhân dòng họ giữ lăng. Phải cứu bằng mọi giá.'],
            done: ['Xích sắt rơi xuống. {companion} lau vệt máu nơi khoé miệng: "Ngươi đến muộn đấy."', '"Nhưng thôi, đến là tốt rồi. Theo ta, ta biết đường vào lăng."'] },
          { type: 'gate', goal: 'Bước qua Quỷ Môn Quan trong lăng mộ tiền triều',
            start: ['Cánh cửa đá mở ra. Gió lạnh thổi tắt mọi ngọn đuốc.', 'Hai hàng tượng binh mã ba trăm năm tuổi... từ từ quay đầu nhìn theo.', '{companion}: "Đi sát ta. Ở đây, lạc nhau là lạc cả một kiếp."'],
            done: ['Quỷ Môn Quan đã khép được một nửa. Nửa còn lại cần máu của kẻ đã phá nó.', 'Từ sâu trong bóng tối, tiếng giáp sắt chậm rãi bước ra.'] },
          { type: 'boss', goal: 'Chém hạ {villain} dưới ánh trăng máu',
            start: ['{villain} hiện ra, giáp đen nhuốm máu, đôi mắt đỏ rực như hai hòn than.', '"Ba trăm năm bị chôn vùi! Ta chỉ đòi lại giang sơn vốn thuộc về ta!"', 'Giang sơn này thuộc về người sống. Kẻ đã khuất, xin hãy yên nghỉ.'],
            done: ['{villain} quỵ xuống, giáp vỡ thành tro. Trăng máu nhạt dần thành màu bạc.', 'Gà gáy canh năm. Âm binh tan biến như sương sớm.'] }
        ],
        endings: {
          normal: [
            'Sáng hôm sau, chuông chùa ngân vang khắp kinh thành.',
            'Người dân mở cửa, quét dọn phố phường, thắp nén nhang cho người đã khuất.',
            'Hoàng thượng muốn phong tước cho {hero}, nhưng {hero} đã rời đi từ lúc trời chưa sáng.',
            'Người ta chỉ thấy trên tường thành một dòng chữ khắc bằng mũi kiếm: "Bình an."'
          ],
          romance: [
            'Bến đò lúc bình minh. {companion} đã ngồi đợi sẵn, bên cạnh là hai con ngựa.',
            '"Ngươi định đi mà không nói một lời sao?"',
            '"Ta... không biết nên nói gì."',
            '"Vậy thì khỏi nói. Ta đi cùng ngươi. Giang hồ rộng lớn, hai người đi vẫn hơn một."',
            '{hero} đón lấy dây cương {companion} đưa. Ngón tay chạm nhau, thật lâu.',
            'Đò sang sông. Mặt trời lên. Hai bóng người cưỡi ngựa khuất dần sau rặng tre.'
          ]
        }
      },
      {
        title: 'Quốc Sư Mưu Nghịch',
        intro: [
          'Không ai biết trăng máu là thiên tai hay nhân hoạ.',
          'Chỉ biết sau đêm đó, Hoàng thượng lâm bệnh nặng, triều chính rơi vào tay {villain}.',
          'Chiếu chỉ đầu tiên của hắn: truy nã {hero} với tội "dùng tà thuật gọi quỷ".',
          'Bị cả triều đình lẫn quỷ dữ săn đuổi, {hero} chỉ còn một con đường.',
          'Tìm ra sự thật. Và chém đứt âm mưu tận gốc.'
        ],
        acts: [
          { type: 'explore', goal: 'Lẩn qua {place}, tránh tai mắt triều đình',
            start: ['Cáo thị truy nã dán khắp nơi. Bức chân dung vẽ xấu đến buồn cười.', '[Mật thư của {faction}] Chúng ta tin ngươi vô tội. Hãy đến chỗ hẹn, sẽ có người tiếp ứng.', 'Lính tuần và cương thi đi lẫn vào nhau. Như thể chúng cùng một phe.'],
            done: ['Cương thi không hề tấn công lính của {villain}. Chúng thật sự cùng một phe.', 'Quốc sư không chống quỷ. Quốc sư đang chỉ huy quỷ.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} làm bằng chứng tội ác',
            start: ['[Mật thư của {faction}] {villain} giấu ba {artifact} dùng để luyện âm binh. Lấy được, tội trạng sẽ rõ.', 'Hồ ly tinh giả làm thiếu nữ bán hoa. Đừng nhìn vào mắt chúng.', 'Mỗi món bằng chứng đều có âm binh mặc giáp triều đình canh giữ.'],
            done: ['Đủ ba {artifact}. Trên mỗi món đều khắc ấn riêng của phủ quốc sư.', 'Bằng chứng có rồi. Giờ cần một nhân chứng dám đứng ra trước triều đình.'] },
          { type: 'rescue', goal: 'Giải cứu {companion} khỏi ngục tối dưới phủ quốc sư',
            start: ['{companion} từng làm việc trong phủ quốc sư, và đã cố tố giác hắn.', 'Giờ người ấy bị giam dưới ngục sâu, chờ ngày xử trảm.', 'Gác ngục đã chết từ lâu. Thứ đang đứng canh là cương thi.'],
            done: ['{companion} nheo mắt nhìn ánh đuốc: "Ta tưởng người đến là đao phủ."', '"Không phải đao phủ. Là người đến đưa ngươi đi đòi công đạo."'] },
          { type: 'gate', goal: 'Đột nhập Địa Cung bí mật dưới hoàng thành',
            start: ['Dưới hoàng thành có một địa cung không ghi trong sử sách. Nơi {villain} luyện trận pháp trăng máu.', 'Tường đá khắc đầy phù chú, phát sáng đỏ theo nhịp như mạch đập.', '{companion}: "Nghe nói vào đây chưa ai trở ra. Tốt. Vậy chúng ta sẽ là những người đầu tiên."'],
            done: ['Trận pháp vỡ. Mặt trăng trên trời rung lên như mặt nước bị ném đá.', 'Ở trung tâm địa cung, {villain} đang chờ, trên người khoác long bào.'] },
          { type: 'boss', goal: 'Đánh bại {villain}, kẻ âm mưu cướp ngôi',
            start: ['{villain}: "Ta phò ba đời vua, đổi lại chỉ là chức quan hư danh. Thiên hạ này nợ ta!"', 'Hắn nuốt một lá bùa đỏ. Thân hình phình to, mọc sừng, mọc vuốt.', 'Mượn quỷ cướp ngôi, rốt cuộc cũng hoá thành quỷ.'],
            done: ['{villain} ngã xuống. Long bào rách nát, lộ ra thân xác khô quắt của một lão già.', 'Cùng lúc ấy, Hoàng thượng tỉnh lại. Bệnh do bùa chú, bùa phá thì bệnh tan.'] }
        ],
        endings: {
          normal: [
            'Triều đình xoá án cho {hero}, phong làm Hộ Quốc Đại Tướng.',
            '{hero} nhận ấn, chỉ xin một điều: miễn thuế ba năm cho dân chịu nạn.',
            'Hoàng thượng chuẩn tấu. Dân gian truyền nhau kể về vị tướng không màng danh lợi.',
            'Còn {hero}, đêm ấy chỉ ngồi uống một chén rượu với vầng trăng đã bạc trở lại.'
          ],
          romance: [
            'Tiệc mừng công kéo dài ba ngày ba đêm.',
            '{companion} lén kéo {hero} ra khỏi đại điện, chạy lên tường thành.',
            '"Trong kia toàn quan lớn khen nhau. Ta nghe mỏi cả tai."',
            '"Ở đây chỉ có trăng thôi." "Có trăng, và có ngươi. Thế là đủ."',
            'Gió đêm thổi bay dải lụa trên tóc {companion}. {hero} với tay bắt lấy, rồi không trả lại.',
            '"Giữ đi." {companion} quay mặt đi, má hồng như vừa uống rượu. "Coi như... tín vật."'
          ]
        }
      },
      {
        title: 'Lời Nguyền Hồ Ly',
        intro: [
          'Trăm năm trước, có một nàng hồ ly đem lòng yêu một chàng thư sinh nghèo.',
          'Chàng đỗ trạng nguyên, cưới công chúa, rồi sai người đốt núi để diệt nàng.',
          'Đêm nay, trăng máu lại lên. {villain} trở về kinh thành.',
          'Nàng không cần ngai vàng. Nàng chỉ muốn cả kinh thành nếm nỗi đau nàng từng nếm.',
          '{hero} hiểu, có những mối hận không thể chém đứt bằng kiếm.'
        ],
        acts: [
          { type: 'explore', goal: 'Tìm nguồn ảo thuật bao trùm {place}',
            start: ['Phố xá đông người, nhưng chẳng ai có bóng. Ảo ảnh của hồ ly.', '[Mật thư của {faction}] Đừng tin những gì mắt thấy. Hãy tin mũi kiếm.', 'Có tiếng đàn tì bà vọng lại từ đâu đó, buồn đến nao lòng.'],
            done: ['Ảo ảnh rạn nứt, lộ ra con phố thật: hoang tàn, đầy dấu móng vuốt.', 'Muốn phá ảo cảnh tận gốc, cần những vật trấn tà đặc biệt.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} để phá ảo cảnh',
            start: ['[Mật thư của {faction}] {artifact} được cất ở ba ngôi miếu cổ. Chỉ chúng mới chạm được vào hồ ly.', 'Hồ ly sẽ hoá thành người thân của ngươi để dụ dỗ. Đừng mềm lòng.', 'Mỗi bước chân, tiếng đàn lại gần hơn.'],
            done: ['Đủ ba {artifact}. Chúng hiện lên một bức hoạ cũ: hồ ly và chàng thư sinh dưới gốc đào.', 'Mặt sau ghi một cái tên. Hậu duệ của chàng thư sinh vẫn còn sống.'] },
          { type: 'rescue', goal: 'Giải cứu {companion}, người bị {villain} bắt đi',
            start: ['{companion} là hậu duệ đời thứ năm của kẻ phụ bạc năm xưa.', '{villain} muốn đòi nợ trên chính máu thịt người ấy.', 'Nhưng {companion} chẳng có tội gì. Tội của tổ tiên, không thể bắt con cháu trả.'],
            done: ['{companion} run rẩy: "Ta... ta không hề biết tổ tiên mình đã làm chuyện đó."', '"Giờ thì biết rồi. Và chúng ta sẽ cùng sửa sai, theo cách đúng đắn."'] },
          { type: 'gate', goal: 'Bước vào Ảo Cảnh Hoa Đào, tâm của lời nguyền',
            start: ['Vết nứt giữa không trung mở ra một thế giới khác: rừng đào nở rộ dưới trăng đỏ.', 'Mỗi cánh hoa rơi là một mảnh ký ức trăm năm. Hạnh phúc, rồi phản bội, rồi lửa.', '{companion}: "Đẹp quá... đẹp đến mức đau lòng."'],
            done: ['Gốc đào cổ thụ giữa ảo cảnh héo úa. Lời nguyền đã yếu đi.', 'Nhưng {villain} không còn gì để mất. Nàng sẽ đánh đến cùng.'] },
          { type: 'boss', goal: 'Đối mặt {villain}, kết thúc mối hận trăm năm',
            start: ['{villain} xuất hiện, chín chiếc đuôi rực lửa, đôi mắt ướt đẫm.', '"Hắn hứa sẽ quay lại. Ta đã chờ dưới gốc đào ấy suốt trăm năm."', 'Đánh bại nàng. Rồi trao cho nàng thứ mà kiếm không làm được: sự yên nghỉ.'],
            done: ['{villain} quỳ xuống giữa mưa hoa đào. Lửa trên đuôi tắt dần.', '{companion} bước tới, cúi đầu thật sâu: "Thay tổ tiên, ta xin lỗi nàng." Nàng mỉm cười, rồi tan vào ánh trăng.'] }
        ],
        endings: {
          normal: [
            'Trăng máu biến mất. Kinh thành trở lại yên bình.',
            '{hero} trồng một cây đào trên ngọn núi năm xưa từng bị đốt cháy.',
            'Mùa xuân năm sau, hoa nở trắng cả sườn đồi.',
            'Người ta kể rằng đêm rằm, đôi khi thấy một con cáo trắng nằm ngủ dưới gốc cây ấy. Rất bình yên.'
          ],
          romance: [
            'Mùa xuân năm sau, {hero} và {companion} cùng lên núi ngắm cây đào mới trồng.',
            '"Nàng hồ ly ấy chờ trăm năm cho một lời hứa không được giữ." {companion} khẽ nói.',
            '"Ta không dám hứa trăm năm. Nhưng ngày nào còn sống, ta sẽ ở cạnh ngươi."',
            '{hero} cài một nhành đào lên tóc {companion}.',
            '"Vậy ta cũng hứa. Mỗi mùa xuân, chúng ta lại lên đây."',
            'Gió thổi qua, hoa rơi đầy vai hai người. Đâu đó có tiếng cáo kêu khe khẽ, như một lời chúc phúc.'
          ]
        }
      }
    ],
    companions: [
      {
        name: 'Tạ Linh Chi', gender: 'f', portrait: 'ct_port1', role: 'Nữ kiếm khách',
        personality: 'Kiêu ngạo, nói thẳng như chém kiếm, nhưng lén mê kẹo mạch nha như trẻ con.',
        likes: ['choco', 'food', 'flower'],
        meet: [
          { who: 'npc', text: 'Đừng đứng đó mà nhìn. Cởi trói giúp ta, nhanh lên.' },
          { who: 'hero', text: 'Cô nương là ai?' },
          { who: 'npc', text: 'Tạ Linh Chi. Kiếm khách. Hôm nay mất kiếm, mất mặt, nhưng chưa mất mạng. Nhờ ngươi.' },
          { who: 'sys', text: 'Tạ Linh Chi đã gia nhập. Kiếm pháp của nàng nhanh như chớp giật.' }
        ],
        banter: [
          'Đi nhanh lên. Kiếm khách không đợi ai cả.',
          'Ngươi cầm kiếm sai rồi. Thôi kệ, chém trúng là được.',
          'Đừng nhìn ta. ...Ta bảo đừng nhìn mà!',
          'Phố này xưa bán kẹo mạch nha ngon nhất kinh thành. Ta không thích kẹo. Chỉ nói vậy thôi.',
          'Trăng đỏ thế này, ta lại nhớ ngày hành hình năm ấy.',
          'Ngươi ồn ào quá. ...Nhưng im lặng thì ta lại thấy trống trải.',
          'Lũ cương thi nhảy lộp cộp nghe phát bực.',
          'Sư phụ ta từng nói: kiếm sắc nhất là kiếm có người để bảo vệ.',
          'Mỏi chân à? Yếu thế. ...Thôi, nghỉ một lát cũng được.',
          'Đi cùng ngươi, ta thấy đêm bớt dài.'
        ],
        combat: ['Xem kiếm!', 'Lùi lại, để ta!', 'Chém!', 'Yêu ma, nạp mạng!', 'Ngươi bên trái, ta bên phải!', 'Một kiếm, mười con!'],
        hurt: ['Hừ, vết xước thôi.', 'Chưa chết được đâu!', 'Đáng ghét... dám làm ta chảy máu.'],
        gift: ['Ai cần... à mà thôi, ta nhận. Cảm ơn.', 'Ngươi... sao biết ta thích cái này?', 'Hừ. Lần này ta nợ ngươi. Chỉ lần này thôi đấy.'],
        stages: [
          { at: 20, title: 'Kẹo mạch nha',
            lines: [
              { who: 'sys', text: '{hero} bắt gặp Tạ Linh Chi lén lấy một gói kẹo mạch nha ở sạp hàng bỏ hoang, để lại vài đồng xu.' },
              { who: 'npc', text: 'Ngươi... không thấy gì cả. Hiểu chưa?' },
              { who: 'hero', text: 'Ta thấy hết rồi.' },
              { who: 'npc', text: '...Được rồi. Mẹ ta hay mua loại kẹo này mỗi lần cha ta thắng trận trở về.' },
              { who: 'npc', text: 'Ăn vào, ta lại thấy mình là con bé tám tuổi đứng ở cổng thành đợi cha.' }
            ],
            choices: [
              { text: 'Chia cho ta một viên được không?', aff: 8, reply: 'Một viên thôi đấy. ...Thôi, hai viên.' },
              { text: 'Cha cô hẳn là một vị tướng giỏi.', aff: 7, reply: 'Giỏi nhất. Dù thiên hạ có nói gì đi nữa.' },
              { text: 'Kiếm khách mà ăn kẹo, buồn cười thật.', aff: -4, reply: 'Cười nữa là ta chém đấy.' }
            ] },
          { at: 40, title: 'Dải lụa đỏ',
            lines: [
              { who: 'sys', text: 'Đêm ấy, Linh Chi tháo dải lụa đỏ trên tóc, vuốt ve rất lâu.' },
              { who: 'npc', text: 'Cha ta là tướng Tạ Uy. Mười năm trước bị khép tội phản quốc, chém đầu ở Ngọ Môn.' },
              { who: 'npc', text: 'Ngày hành hình, mẹ buộc dải lụa này lên tóc ta, rồi gieo mình xuống sông.' },
              { who: 'npc', text: 'Năm đó ta mười hai tuổi. Được sư phụ trên chùa nhận nuôi, dạy kiếm.' },
              { who: 'npc', text: 'Ta luyện kiếm mười năm, chỉ để một ngày rửa oan cho cha.' }
            ],
            choices: [
              { text: 'Ta tin cha cô vô tội. Và ta sẽ giúp cô.', aff: 10, reply: 'Ngươi chưa từng gặp cha ta... sao lại tin? ...Cảm ơn. Thật lòng.' },
              { text: 'Dải lụa ấy rất hợp với cô.', aff: 6, reply: 'Đừng nói kiểu đó lúc người ta đang buồn... Nhưng, cảm ơn.' },
              { text: 'Mười năm rồi, cô nên buông bỏ đi.', aff: -3, reply: 'Buông bỏ? Ngươi nói cứ như đó là chuyện dễ dàng.' }
            ] },
          { at: 60, title: 'Tờ mật tấu',
            lines: [
              { who: 'sys', text: 'Trong đống công văn cháy dở, Linh Chi tìm thấy tờ mật tấu buộc tội cha nàng. Nét chữ quen đến lạnh người.' },
              { who: 'npc', text: 'Đây là nét chữ của... sư phụ ta.' },
              { who: 'npc', text: 'Người nuôi ta mười năm. Dạy ta cầm kiếm. Chính là kẻ đã giết cha ta.' },
              { who: 'npc', text: 'Ta phải đi. Ngay bây giờ. Ta sẽ chém ông ta.' },
              { who: 'hero', text: 'Linh Chi, khoan đã!' },
              { who: 'npc', text: 'Tránh ra! Đừng bắt ta phải rút kiếm với ngươi!' }
            ],
            choices: [
              { text: 'Cô muốn trả thù, ta theo. Nhưng hãy hỏi ông ấy vì sao trước đã.', aff: 10, reply: '...Ngươi nói đúng. Ta cần câu trả lời. Đi cùng ta. Đừng để ta làm chuyện dại dột.' },
              { text: 'Cô đi lúc này, kinh thành sẽ không còn ai bảo vệ.', aff: 6, reply: 'Lúc nào cũng là kinh thành... Được. Xong chuyện này, ta sẽ đi.' },
              { text: 'Thôi được, cứ đi đi.', aff: -5, reply: '...Ngươi thậm chí không giữ ta lại.' }
            ] },
          { at: 80, title: 'Thân mình làm khiên',
            lines: [
              { who: 'sys', text: 'Một quỷ đầu trâu bổ rìu về phía {hero}. Linh Chi lao tới, dùng chính thân mình đỡ đòn.' },
              { who: 'hero', text: 'Linh Chi! Đồ ngốc!' },
              { who: 'npc', text: 'Ngươi mới là đồ ngốc... đứng đơ ra đó làm gì...' },
              { who: 'npc', text: 'Ta mất cha, mất mẹ, giờ đến sư phụ cũng chẳng còn là sư phụ.' },
              { who: 'npc', text: 'Ta không cho phép mình mất thêm ngươi. Nghe rõ chưa?' }
            ],
            choices: [
              { text: 'Ta nghe rõ. Ta cũng không cho phép mình mất cô.', aff: 10, reply: '...Vậy thì cả hai cùng sống. Đó là giao ước.' },
              { text: 'Lần sau, đổi lại để ta đỡ cho cô.', aff: 8, reply: 'Không cần. Ngươi chỉ cần đứng cạnh ta. Thế là đủ.' },
              { text: 'Cô liều quá rồi.', aff: 3, reply: 'Ta biết. Nhưng ta không hối hận.' }
            ] },
          { at: 100, title: 'Nửa dải lụa',
            lines: [
              { who: 'sys', text: 'Đêm trước trận quyết chiến. Linh Chi tháo dải lụa đỏ, dùng kiếm cắt làm đôi.' },
              { who: 'npc', text: 'Đây là thứ duy nhất mẹ để lại cho ta. Mười năm, ta chưa rời nó một ngày.' },
              { who: 'sys', text: 'Nàng buộc một nửa lên cổ tay {hero}. Nút thắt vụng về, ngón tay hơi run.' },
              { who: 'npc', text: 'Ở quê ta, con gái buộc lụa đỏ cho ai... nghĩa là đã chọn người đó.' },
              { who: 'npc', text: 'Ta chọn ngươi, {hero}. Đừng bắt ta nói lần thứ hai, ta sẽ chết vì xấu hổ mất.' }
            ],
            choices: [
              { text: 'Ta nhận. Và sẽ giữ nó cả đời.', aff: 10, reply: 'Cả đời... Ngươi nói rồi đấy. Không được nuốt lời.' },
              { text: 'Nói lần thứ hai đi. Ta muốn nghe.', aff: 9, reply: 'Đồ đáng ghét... Ta thích ngươi. Thích lắm. Được chưa?' },
              { text: 'Ta chưa sẵn sàng.', aff: -5, reply: '...Không sao. Cứ giữ nó. Khi nào sẵn sàng, hãy buộc lại cho ta.' }
            ] }
        ]
      },
      {
        name: 'Ôn Tử Khiêm', gender: 'm', portrait: 'ct_port2', role: 'Thư sinh kiếm khách',
        personality: 'Ôn hoà, nói năng văn vẻ, mê làm thơ, nhưng kiếm pháp sắc lạnh như sương đêm.',
        likes: ['water', 'flower', 'pills'],
        meet: [
          { who: 'npc', text: 'Đa tạ các hạ. Tại hạ là Ôn Tử Khiêm, một thư sinh vô dụng... và một kiếm khách tạm được.' },
          { who: 'hero', text: 'Thư sinh mà cũng cầm kiếm sao?' },
          { who: 'npc', text: 'Bút không chém được yêu ma. Nên tại hạ đành mượn tạm thanh kiếm này.' },
          { who: 'sys', text: 'Ôn Tử Khiêm đã gia nhập. Kiếm pháp của chàng chuẩn xác và khó lường.' }
        ],
        banter: [
          'Trăng đỏ thế này, tiếc là chẳng có ai cùng đối ẩm.',
          'Các hạ đi chậm lại chút. Thư sinh như ta thở không kịp.',
          'Ngõ này tên Ngõ Hoa Sữa. Mùa thu thơm lắm. Giờ chỉ còn mùi tử khí.',
          'Ta vừa nghĩ ra một câu thơ. ...Thôi, để lúc khác, kẻo cương thi nghe thấy.',
          'Kiếm và bút giống nhau ở chỗ: sai một nét là hỏng cả.',
          'Các hạ biết chơi cờ không? Xong chuyện này, ta mời một ván.',
          'Đừng lo, ta không ngất đâu. Ít nhất là chưa.',
          'Mỗi người ta cứu được, ta lại thấy mình bớt vô dụng một chút.',
          'Gió đêm lạnh lắm. Các hạ khoác thêm áo vào.',
          'Đi cùng các hạ, ta chợt hiểu vì sao người xưa hay viết thơ về tri kỷ.'
        ],
        combat: ['Xem kiếm!', 'Một kiếm, như một nét bút!', 'Các hạ cẩn thận!', 'Yêu nghiệt, lùi lại!', 'Thơ ta không hay, nhưng kiếm thì có!', 'Ta yểm trợ!'],
        hurt: ['Khụ... không sao.', 'Hơi đau... nhưng vẫn cầm được kiếm.', 'Thư sinh như ta, chịu đòn kém thật.'],
        gift: ['Đa tạ. Tấm lòng này ta xin ghi nhớ.', 'Món quà này, ta sẽ đáp lễ bằng một bài thơ.', 'Các hạ chu đáo quá. Ta chẳng biết lấy gì báo đáp.'],
        stages: [
          { at: 20, title: 'Bài thơ đốt đi',
            lines: [
              { who: 'sys', text: 'Ôn Tử Khiêm ngồi bên đống lửa, viết lên giấy rồi thả từng tờ vào lửa.' },
              { who: 'hero', text: 'Viết xong lại đốt? Sao vậy?' },
              { who: 'npc', text: 'Thơ viết cho người đã khuất. Đốt đi, gió sẽ mang đến cho họ.' },
              { who: 'npc', text: 'Bà bán nước đầu ngõ. Cô bé bán hoa. Ông lão gác cổng thành. Ta chẳng biết tên họ.' },
              { who: 'npc', text: 'Nhưng ít nhất, ta muốn có ai đó nhớ rằng họ từng tồn tại.' }
            ],
            choices: [
              { text: 'Viết thêm một bài nữa đi. Ta muốn nghe.', aff: 8, reply: 'Vậy bài này ta không đốt. Đọc cho các hạ nghe trước.' },
              { text: 'Họ sẽ nhận được. Ta tin vậy.', aff: 7, reply: 'Các hạ là người đầu tiên không cười ta mê tín.' },
              { text: 'Phí giấy quá.', aff: -4, reply: '...Ừ. Có lẽ vậy. Thời loạn, giấy cũng quý.' }
            ] },
          { at: 40, title: 'Thám hoa bị tước áo',
            lines: [
              { who: 'sys', text: 'Đi ngang trường thi, Tử Khiêm dừng lại trước tấm bảng vàng đã mục nát.' },
              { who: 'npc', text: 'Mười năm trước, tên ta ở dòng thứ ba. Thám hoa. Cả làng mở tiệc ba ngày.' },
              { who: 'npc', text: 'Rồi quan trên sai ta viết một bản tấu, buộc tội một vị tướng phản quốc.' },
              { who: 'npc', text: 'Ta biết ông ấy vô tội. Ta không viết. Thế là bị tước áo mũ, cả nhà bị đày.' },
              { who: 'npc', text: 'Cha ta mất trên đường đi đày. Đôi khi ta tự hỏi, chữ "nghĩa" có đáng giá đến thế không.' }
            ],
            choices: [
              { text: 'Đáng. Vì nhờ vậy, anh vẫn là người ta tin được.', aff: 10, reply: 'Các hạ nói vậy... mười năm của ta bỗng nhẹ đi nhiều lắm.' },
              { text: 'Cha anh hẳn sẽ tự hào về anh.', aff: 8, reply: 'Lúc lâm chung, cha chỉ nói một câu: "Con đã làm đúng." Ta vẫn nhớ.' },
              { text: 'Lẽ ra anh nên viết, để cứu gia đình.', aff: -4, reply: 'Có lẽ vậy. Nhưng nếu viết, ta đã chẳng còn là ta.' }
            ] },
          { at: 60, title: 'Hồn ma cố nhân',
            lines: [
              { who: 'sys', text: 'Một âm binh lao đến. Tử Khiêm giơ kiếm, rồi khựng lại. Đó là gương mặt người thầy dạy chữ năm xưa.' },
              { who: 'npc', text: 'Thầy... là thầy sao...' },
              { who: 'sys', text: '{hero} chém thay. Âm binh tan thành khói. Tử Khiêm quỳ sụp xuống, tay buông kiếm.' },
              { who: 'npc', text: 'Ta không ra tay được. Ta cứ tưởng mình đã đủ mạnh.' },
              { who: 'npc', text: 'Kiếm khách không dám chém, thì có khác gì kẻ vô dụng?' }
            ],
            choices: [
              { text: 'Không nỡ chém người mình kính trọng, đó không phải yếu đuối.', aff: 10, reply: '...Các hạ lại cứu ta thêm lần nữa. Không chỉ mạng, mà cả lòng.' },
              { text: 'Ta sẽ là thanh kiếm của anh những lúc như vậy.', aff: 8, reply: 'Vậy ta sẽ là ngọn bút của các hạ. Ghi lại mọi điều các hạ làm.' },
              { text: 'Lần sau đừng do dự. Do dự là chết.', aff: -3, reply: 'Ta biết. Nhưng ta không muốn thành người chẳng còn biết do dự.' }
            ] },
          { at: 80, title: 'Đêm sốt',
            lines: [
              { who: 'sys', text: '{hero} trúng độc ngạ quỷ, sốt mê man. Tử Khiêm cõng {hero} chạy suốt đêm đến chùa tìm thầy thuốc.' },
              { who: 'sys', text: 'Khi {hero} tỉnh lại, chàng vẫn ngồi đó, mắt thâm quầng, tay cầm khăn ướt.' },
              { who: 'npc', text: 'Các hạ tỉnh rồi... Tốt. Tốt quá rồi.' },
              { who: 'npc', text: 'Đêm qua ta cầu khấn tất cả thần phật ta biết. Kẻ đọc sách thánh hiền như ta, thật buồn cười.' },
              { who: 'npc', text: 'Ta còn viết một bài thơ. Nhưng bài này... ta không dám đốt, cũng không dám đọc.' }
            ],
            choices: [
              { text: 'Đọc cho ta nghe đi.', aff: 10, reply: 'Không phải bây giờ. Khi trăng bạc trở lại, ta sẽ đọc. Hứa.' },
              { text: 'Cảm ơn anh. Vì đã không bỏ ta.', aff: 8, reply: 'Bỏ các hạ? Ta thà bỏ cả thiên hạ còn hơn.' },
              { text: 'Anh nên đi nghỉ đi.', aff: 4, reply: 'Ừ. Nhưng cho ta ngồi thêm chút nữa. Thấy các hạ thở đều, ta mới yên lòng.' }
            ] },
          { at: 100, title: 'Bài thơ không đốt',
            lines: [
              { who: 'sys', text: 'Đêm trước trận cuối. Trăng vẫn đỏ, nhưng Tử Khiêm nói chàng không muốn chờ thêm nữa.' },
              { who: 'npc', text: 'Ta đã hứa đợi trăng bạc. Nhưng nếu ngày mai một trong hai ta không còn...' },
              { who: 'npc', text: 'Thì ta sẽ hối hận cả kiếp sau.' },
              { who: 'sys', text: 'Chàng mở tờ giấy, đọc chậm rãi: "Nửa đời cầm bút viết cho người đã khuất. Nay mới biết có người khiến ta muốn viết cho ngày mai."' },
              { who: 'npc', text: 'Ta yêu {hero}. Từ lúc nào, chính ta cũng không rõ. Chỉ biết khi nhận ra, đã chẳng thể quay đầu.' }
            ],
            choices: [
              { text: 'Ta cũng yêu anh. Bài thơ ấy, đừng bao giờ đốt.', aff: 10, reply: 'Không đốt. Ta sẽ viết tiếp. Mỗi ngày một câu, cho đến hết đời.' },
              { text: 'Gọi tên ta đi, đừng gọi "các hạ" nữa.', aff: 10, reply: '...{hero}. Gọi một lần rồi, ta e là không dừng lại được nữa đâu.' },
              { text: 'Ta cần thêm thời gian.', aff: -4, reply: 'Ta hiểu. Bài thơ này ta cất đi. Khi nào sẵn sàng, ta sẽ đọc lại.' }
            ] }
        ]
      }
    ],
    civilians: {
      help: ['Cứu mạng! Có ai không?!', 'Cương thi... cương thi ở ngoài cửa! Cứu tôi với!', 'Con tôi bị ma bắt đi rồi! Ai cứu nó với!', 'Đại hiệp! Xin cứu lấy cái mạng già này!', 'Đừng bỏ ta lại! Ta không muốn thành ngạ quỷ!', 'Có ai nghe không? Ta bị kẹt trong miếu!'],
      thanks: ['Đa tạ đại hiệp! Chút bạc lẻ này xin người nhận cho.', 'Ơn cứu mạng này, kiếp sau xin làm trâu ngựa báo đáp.', 'Lão có ít cao thuốc gia truyền. Đại hiệp cầm lấy phòng thân.', 'Ta sẽ thắp hương cầu bình an cho người mỗi ngày.', 'Đại hiệp đúng là Bồ Tát sống! Đây, ít lương khô.', 'Cảm tạ ân nhân! Ta sẽ kể cả làng nghe về người.']
    },
    events: [
      'Tiếng chuông chùa vang lên từ xa, rồi tắt lịm...',
      'Trăng máu đỏ hơn. Chó cả kinh thành đồng loạt tru lên.',
      'Một đoàn đèn lồng trôi lơ lửng trên mặt hồ, không người cầm.',
      'Tiếng mõ cầm canh: "Canh ba... đóng cửa... cài then..."',
      'Gió lạnh thổi qua, mang theo tiếng khóc của ai đó.',
      'Tiếng trống trận vọng về từ phía lăng mộ cổ.',
      'Mưa máu lất phất rơi trên mái ngói.',
      'Một con quạ đậu trên tường thành, cất tiếng như người nói.'
    ],
    bossTaunts: ['Phàm nhân, quỳ xuống!', 'Thanh kiếm của ngươi chỉ là que củi trong mắt ta.', 'Đêm nay, kinh thành này là mồ chôn ngươi.', 'Trăng máu không bao giờ lặn!', 'Ngươi sẽ thành âm binh của ta!'],
    deathLines: ['Kiếm gãy, người ngã. Trăng máu vẫn treo cao.', 'Hồn về chín suối... nhưng chưa đến lúc.', 'Giang hồ còn dài. Đứng dậy, cầm kiếm lên.']
  },
  // =====================================================================
  // TU TIÊN — huyết kiếp giáng thế
  // =====================================================================
  tt: {
    name: 'Tu Tiên',
    tagline: 'Huyết kiếp giáng thế. Đạo tâm ngươi có vững?',
    desc: 'Ba nghìn năm một lần, huyết kiếp giáng xuống Thiên Nguyên đại lục. Tu sĩ nhập ma, yêu thú cuồng loạn, tông môn sụp đổ. Một đệ tử tầm thường cầm bùa chú và hồ lô ngọc, bước lên con đường nghịch thiên.',
    heroNames: ['Lâm Phong', 'Tô Thanh Vân', 'Diệp Hàn', 'Cố Lam', 'Bạch Trần', 'Hạ Dao'],
    levelTitles: ['Luyện Khí', 'Trúc Cơ', 'Kim Đan', 'Nguyên Anh', 'Hoá Thần', 'Luyện Hư', 'Hợp Thể', 'Đại Thừa', 'Độ Kiếp', 'Tiên Nhân'],
    names: {
      villains: ['Huyết Ma Tôn', 'Lão Tổ Vạn Cốt', 'Thánh Nữ Phản Đạo Lạc Yên', 'Cửu Đầu Xà Vương', 'Trưởng lão Tịch Diệt', 'Tông chủ Đoạ Tiên Hàn Ưng'],
      artifacts: ['Linh Châu Trấn Kiếp', 'Mảnh Thiên Thư', 'Huyết Ngọc Phong Ấn', 'Tiên Thảo Cửu Diệp', 'Lệnh Bài Tông Môn', 'Đan Hoàn Hồi Thiên'],
      places: ['Thanh Vân Sơn', 'Vạn Thú Sơn Mạch', 'Hồ Tẩy Kiếm', 'Trấn Lạc Hà', 'Vực Vong Hồn', 'Đỉnh Thiên Trụ', 'Phường Thị Linh Thạch', 'Cổ Mộ Thượng Tiên'],
      factions: ['Thanh Vân Tông', 'Liên Minh Chính Đạo', 'Dược Vương Cốc', 'Tàng Kiếm Các']
    },
    stories: [
      {
        title: 'Huyết Kiếp Giáng Thế',
        intro: [
          'Ba nghìn năm trước, chư tiên liên thủ phong ấn {villain} dưới vực sâu.',
          'Ba nghìn năm sau, phong ấn nứt vỡ. Trời đổ mưa máu suốt bảy ngày.',
          'Tu sĩ nhiễm huyết khí hoá thành huyết thi. Không còn đạo tâm, chỉ còn cơn đói.',
          '{hero}, một đệ tử ngoại môn chưa từng được ai để mắt, là người duy nhất còn đứng vững trên núi.',
          'Có lẽ thiên đạo đã chọn sai người. Hoặc có lẽ, đã chọn đúng.'
        ],
        acts: [
          { type: 'explore', goal: 'Thám thính {place}, nơi huyết khí dày đặc nhất',
            start: ['[Truyền âm phù] {faction} đây. Huyết khí đang lan. Đừng để nó chạm vào đan điền.', 'Linh khí trong không trung loãng hẳn, như bị huyết khí nuốt mất.', 'Ma lang tru lên trong rừng sâu. Chúng đã ngửi thấy mùi linh lực của ngươi.'],
            done: ['Huyết khí tụ về ba điểm, kết thành một đại trận khổng lồ.', 'Phá được ba trận nhãn, mới mong phong ấn lại {villain}.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} trấn giữ trận nhãn',
            start: ['[Truyền âm phù] Tổ sư để lại ba {artifact}, chôn dưới ba trận nhãn.', 'Cóc độc phun sương tím. Hít phải là kinh mạch tê liệt.', 'Đừng tham linh thạch rơi vãi. Mạng quan trọng hơn.'],
            done: ['Đủ ba {artifact}. Chúng ngân lên như chuông, cộng hưởng lẫn nhau.', 'Nhưng muốn kích hoạt, cần người mang huyết mạch tiên nhân. Và người đó đang bị giam.'] },
          { type: 'rescue', goal: 'Giải cứu {companion} khỏi ma lao của huyết tu',
            start: ['Ma tu xây ngục giữa lòng núi, dùng xích huyết thiết trói những tu sĩ còn tỉnh táo.', '{companion} bị giam ở tầng sâu nhất, linh lực bị phong toả.', 'Cấm chế trên cửa ngục là cổ thuật thất truyền. Phải phá bằng sức, không bằng mưu.'],
            done: ['Xích huyết thiết đứt. Linh lực của {companion} ào lên như thác đổ.', '"Ân này, ta ghi nhớ. Giờ thì đi tìm kẻ đã giam ta."'] },
          { type: 'gate', goal: 'Tiến vào Bí Cảnh Vong Hồn, nơi phong ấn {villain}',
            start: ['Lối vào bí cảnh là một vết nứt giữa trời, huyết quang tràn ra như máu chảy.', 'Bên trong, thời gian trôi lệch. Một nén nhang ngoài kia bằng một ngày ở đây.', '{companion}: "Giữ vững đạo tâm. Bí cảnh này sẽ cho ngươi thấy điều ngươi sợ nhất."'],
            done: ['Tâm ma đã vượt qua. Trận nhãn cuối cùng vỡ vụn.', 'Tiếng cười vang vọng khắp bí cảnh. {villain} đã hoàn toàn thức tỉnh.'] },
          { type: 'boss', goal: 'Trảm {villain}, chấm dứt huyết kiếp',
            start: ['{villain} bước ra từ biển máu, thân cao mười trượng, ma khí che kín trời.', '"Ba nghìn năm trước, chư tiên phong ấn ta. Hôm nay, một con kiến cỏ cũng muốn thử?"', 'Kiến cỏ cũng có thể cắn ngã voi, nếu dám liều.'],
            done: ['Linh châu bùng sáng. {villain} gào thét, bị kéo ngược về vực sâu.', 'Mưa máu ngừng rơi. Lần đầu sau bảy ngày, mặt trời ló dạng.'] }
        ],
        endings: {
          normal: [
            'Huyết kiếp kết thúc. Các tông môn bắt đầu dựng lại từ đống tro tàn.',
            'Đệ tử ngoại môn năm nào được mời làm trưởng lão trẻ nhất lịch sử.',
            '{hero} từ chối. Chỉ xin một gian nhà tranh dưới chân núi, ngày ngày tu luyện.',
            'Người ta nói, đạo tâm vững nhất là đạo tâm không cần ai công nhận.'
          ],
          romance: [
            'Đỉnh núi lúc hoàng hôn. Mây trôi như sóng.',
            '{companion} ngự kiếm đáp xuống bên cạnh {hero}, vạt áo bay trong gió.',
            '"Tu tiên là để trường sinh. Nhưng sống mãi một mình thì có ý nghĩa gì?"',
            '"Vậy thì cùng nhau tu. Nghìn năm, vạn năm, vẫn có người bên cạnh."',
            '{companion} khẽ cười, đặt tay vào tay {hero}: "Song tu... à không, đồng hành. Ý ta là đồng hành!"',
            'Mặt trời lặn. Hai bóng người ngồi cạnh nhau, ngắm sao mọc trên biển mây.'
          ]
        }
      },
      {
        title: 'Sư Tôn Nhập Ma',
        intro: [
          '{villain} là người được kính trọng nhất tông môn. Người đã dạy {hero} những câu chú đầu tiên.',
          'Nhưng thọ nguyên sắp cạn, cảnh giới mãi không đột phá.',
          'Trong đêm, người ấy mở Huyết Trì cấm địa, dùng máu đồng môn để nghịch thiên cải mệnh.',
          'Huyết kiếp không đến từ trời. Nó đến từ chính trong nhà.',
          '{hero} cầm lấy thanh phi kiếm người ấy từng tặng. Thật nặng.'
        ],
        acts: [
          { type: 'explore', goal: 'Điều tra những vụ mất tích quanh {place}',
            start: ['[Truyền âm phù] {faction} báo tin: đệ tử mất tích liên tục. Ai cũng bảo do yêu thú.', 'Dấu chân dẫn vào núi sâu không phải của yêu thú. Là giày của đệ tử nội môn.', 'Một lá bùa trấn tà rơi bên đường. Nét bút quen thuộc đến đau lòng.'],
            done: ['Mọi dấu vết đều dẫn về cấm địa sau núi.', 'Và chỉ một người giữ chìa khoá cấm địa: {villain}.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} để luyện đan giải huyết độc',
            start: ['Các đệ tử bị bắt đều trúng huyết độc. Không giải kịp, họ sẽ hoá huyết thi.', '[Truyền âm phù] Cần ba {artifact}. Một ở dược viên, hai nằm trong bụng yêu thú.', 'Thạch nhân canh dược viên. Cứng như núi, chậm như rùa. Đánh vào khớp đá.'],
            done: ['Đan thành. Hương thơm lan khắp sơn cốc, các đệ tử trúng độc dần tỉnh lại.', 'Có người thều thào: "Sư tôn... đưa {companion} xuống Huyết Trì..."'] },
          { type: 'rescue', goal: 'Giải cứu {companion} trước khi bị hiến tế',
            start: ['{companion} là người duy nhất phát hiện ra bí mật, và đã bị bắt làm vật tế.', 'Ma binh canh khắp đường mòn. Chúng mặc đạo bào của tông môn.', 'Mỗi tên ma binh ngã xuống đều từng là một sư huynh, sư tỷ.'],
            done: ['{companion} mở mắt, giọng yếu ớt: "Ngươi đến thật... Ta tưởng không ai dám chống lại người ấy."', '"Không ai dám. Nên ta phải dám."'] },
          { type: 'gate', goal: 'Phá trận Huyết Trì dưới lòng núi',
            start: ['Huyết Trì là hồ máu rộng trăm trượng, sôi sùng sục dưới lòng núi.', 'Vách đá khắc tên những đệ tử đã bị hiến tế. Hàng trăm cái tên.', '{companion}: "Có tên sư huynh ta trong đó... Không được khóc. Chưa phải lúc."'],
            done: ['Trận pháp vỡ vụn. Máu trong hồ dần trong lại thành nước.', 'Từ đáy hồ, một bóng người quen thuộc bước ra. Giờ đã không còn là người.'] },
          { type: 'boss', goal: 'Đối đầu {villain}, người từng là sư tôn',
            start: ['{villain}: "Ngươi hiểu không? Ta khổ tu năm trăm năm. Chỉ còn một bước nữa thôi!"', '"Vài trăm mạng đệ tử, đổi lấy một vị tiên. Thiên đạo cũng sẽ chấp nhận!"', '"Thiên đạo chấp nhận hay không, ta không biết. Nhưng ta không chấp nhận."'],
            done: ['{villain} ngã xuống. Ma khí tan đi, lộ ra gương mặt già nua, hiền hậu như năm nào.', '"Xin lỗi... con lớn thật rồi..." Lời cuối của người, như một tiếng thở dài.'] }
        ],
        endings: {
          normal: [
            'Tông môn chôn cất người đã khuất, khắc tên họ lên Bia Đạo Tâm.',
            '{hero} khắc thêm một cái tên cuối cùng, không ghi danh hiệu, không ghi tội danh.',
            'Chỉ ghi: "Người đã dạy ta cầm kiếm."',
            'Đạo tâm không phải là không đau. Đạo tâm là đau rồi vẫn bước tiếp.'
          ],
          romance: [
            'Đêm sau tang lễ, {hero} ngồi một mình trên vách núi.',
            '{companion} mang đến một bình rượu, ngồi xuống bên cạnh mà không nói gì.',
            'Rất lâu sau, {companion} mới cất lời: "Ngươi khóc đi. Ta không nhìn đâu."',
            '{hero} khóc. {companion} giữ lời, không nhìn. Chỉ nắm tay {hero}, suốt đêm.',
            'Sáng hôm sau, {companion} nói: "Từ giờ, ngươi không phải gánh mọi thứ một mình nữa."',
            'Đó không phải lời tỏ tình hoa mỹ. Nhưng {hero} biết, đó là lời hứa của cả một đời.'
          ]
        }
      },
      {
        title: 'Cửu Đầu Xà Vương',
        intro: [
          'Dưới Vạn Thú Sơn Mạch có một long mạch ngủ yên vạn năm.',
          '{villain} tham lam đào mỏ linh thạch, đào đến tận đáy long mạch.',
          'Và đánh thức thứ đang ngủ ở đó: Cửu Đầu Xà, yêu thú thượng cổ.',
          '{villain} không sợ. Hắn muốn thuần phục nó, dùng nó thống nhất thiên hạ.',
          'Núi lở, sông cạn, yêu thú tràn xuống làng mạc. Phải có người ngăn lại.'
        ],
        acts: [
          { type: 'explore', goal: 'Băng qua {place} đang chìm trong yêu khí',
            start: ['[Truyền âm phù] {faction} cảnh báo: yêu thú cả vùng đang phát cuồng.', 'Mặt đất rung từng đợt. Như có thứ gì khổng lồ trở mình dưới chân.', 'Dân làng bỏ chạy, ôm theo cả gà vịt. Một con gà suýt mổ trúng {hero}.'],
            done: ['Mỏ linh thạch của {villain} dẫn thẳng xuống long mạch.', 'Muốn trấn yêu thú, phải dùng chính long khí đã bị đánh cắp.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} để trấn áp long mạch',
            start: ['[Truyền âm phù] Ba {artifact} có thể hút ngược long khí. Thuộc hạ của {villain} đang giữ chúng.', 'Ma lang đi theo bầy. Diệt con đầu đàn, cả bầy sẽ tan.', 'Linh thạch vương vãi khắp nơi. Nhặt vài viên, bù linh lực lúc nguy cấp.'],
            done: ['Đủ ba {artifact}. Mặt đất bớt rung, nhưng tiếng gầm dưới sâu càng giận dữ.', 'Một tù binh khai: {villain} đang giam một người để làm mồi dụ xà.'] },
          { type: 'rescue', goal: 'Giải cứu {companion} khỏi tế đàn dụ xà',
            start: ['{companion} bị trói giữa tế đàn, người dán đầy phù dụ yêu.', 'Chỉ một khắc nữa, Cửu Đầu Xà sẽ ngửi thấy mùi linh khí ấy.', 'Thạch nhân và ma tu canh giữ bốn phía. Không có đường nào an toàn.'],
            done: ['Phù chú bị xé nát. {companion} loạng choạng đứng dậy, rút kiếm.', '"Kẻ dám đem ta làm mồi câu, ta sẽ cho hắn biết thế nào là cá cắn ngược."'] },
          { type: 'gate', goal: 'Xuống Long Mạch Địa Cung, sào huyệt Cửu Đầu Xà',
            start: ['Địa cung rộng như một thế giới ngầm. Thạch nhũ phát sáng như sao trời.', 'Long khí cuồn cuộn. Mỗi hơi thở, linh lực tăng thêm một phần. Hiểm nguy cũng vậy.', '{companion}: "Nếu ta lại thành mồi nhử, nhớ cứu ta nhanh hơn đấy."'],
            done: ['Trận trấn long mạch đã lập. Long khí dần nằm yên.', 'Nhưng Cửu Đầu Xà đã bị {villain} khống chế bằng huyết khế. Hắn đang đứng trên đầu nó.'] },
          { type: 'boss', goal: 'Hạ gục {villain} cùng Cửu Đầu Xà',
            start: ['Chín cái đầu rắn vươn lên, mỗi đầu phun một loại độc khác nhau.', '{villain} đứng trên chiếc đầu ở giữa, cười ngạo nghễ: "Có nó, ta là chủ thiên hạ!"', 'Chặt từng đầu một. Rồi đến lượt kẻ đứng trên đầu.'],
            done: ['Huyết khế đứt. Cửu Đầu Xà quay đầu nuốt chửng {villain}, rồi lặng lẽ trở về đáy long mạch.', 'Đôi mắt vàng nhìn {hero} một lúc, như lời cảm ơn. Rồi nhắm lại, ngủ tiếp vạn năm.'] }
        ],
        endings: {
          normal: [
            'Mỏ linh thạch bị lấp lại. Long mạch được trả về cho đất trời.',
            'Yêu thú trở về rừng sâu. Làng mạc được dựng lại.',
            'Dân làng lập miếu thờ {hero}. {hero} ngượng quá, đêm lén đến dỡ tấm biển.',
            'Sáng hôm sau, dân làng treo lại tấm biển mới, to gấp đôi.'
          ],
          romance: [
            '{companion} kéo {hero} đi dạo phường thị, mua đủ thứ linh tinh.',
            '"Nhìn này, ngọc bội song ngư. Người ta bảo ai đeo một đôi thì không bao giờ lạc nhau."',
            '"Ngươi tin chuyện đó à?" "Không tin. Nhưng ta vẫn muốn mua."',
            '{companion} đeo một chiếc lên cổ {hero}, giữ lại chiếc còn lại.',
            '"Nếu có ngày ngươi lạc, cứ nhìn ngọc bội. Ta sẽ tìm đến."',
            'Ngọc bội ấm lên trong lòng bàn tay. Có lẽ là pháp khí. Có lẽ chỉ là tim ai đó đập nhanh hơn.'
          ]
        }
      }
    ],
    companions: [
      {
        name: 'Nguyệt Thanh Hàn', gender: 'f', portrait: 'tt_port1', role: 'Tiên nhân tóc bạc',
        personality: 'Lạnh như băng, học vấn ba nghìn năm, nhưng ngây ngô về chuyện đời thường đến buồn cười.',
        likes: ['flower', 'pills', 'water'],
        meet: [
          { who: 'npc', text: 'Ngươi phá được cấm chế giam ta? Với chút tu vi này? ...Thú vị.' },
          { who: 'hero', text: 'Ta chỉ thấy cô bị xích, nên cứu thôi.' },
          { who: 'npc', text: 'Nguyệt Thanh Hàn. Ta đã ngủ quá lâu, quên mất nhiều điều. Nhưng ơn này, ta không quên.' },
          { who: 'sys', text: 'Nguyệt Thanh Hàn đã gia nhập. Hàn băng thuật của nàng làm chậm mọi kẻ địch.' }
        ],
        banter: [
          'Linh khí nơi này loãng quá. Thời của ta, khí trời ngọt như mật.',
          'Món hôm qua tên là bánh bao phải không? Ta muốn ăn nữa.',
          'Đừng gọi ta là tiền bối. Nghe già lắm.',
          'Ngươi thổ nạp sai rồi. Dẫn khí về đan điền, đừng nín thở như thế.',
          'Ba nghìn năm trước, mặt trăng cũng tròn như thế này.',
          'Ta không lạnh lùng. Ta chỉ... chưa quen cười.',
          'Con yêu thú kêu "meo" kia là gì? ...Mèo à? Đáng yêu thật.',
          'Ngươi ồn ào hơn mọi đệ tử ta từng có. Nhưng ta không ghét.',
          'Gió núi hôm nay mang mùi hoa đào. Ngươi có ngửi thấy không?',
          'Đi cạnh ngươi, ta thấy những năm tháng ngủ quên cũng không đến nỗi uổng phí.'
        ],
        combat: ['Hàn băng, ngưng!', 'Lui ra sau ta!', 'Yêu nghiệt, đóng băng đi!', 'Kiếm khí, trảm!', 'Phá!', 'Đứng yên trong kết giới!'],
        hurt: ['Hừ... vết thương nhỏ.', 'Linh lực rối loạn... không sao.', 'Ba nghìn năm rồi mới có kẻ làm ta bị thương.'],
        gift: ['Đây là... quà tặng sao? Ta nhận. Cảm ơn ngươi.', 'Lạ thật. Món đồ nhỏ thế này, mà lồng ngực ta lại ấm lên.', 'Ta sẽ cất nó trong túi càn khôn. Chỗ an toàn nhất.'],
        stages: [
          { at: 20, title: 'Chiếc bánh bao đầu tiên',
            lines: [
              { who: 'sys', text: 'Ở phường thị dưới núi, Nguyệt Thanh Hàn đứng nhìn chằm chằm nồi bánh bao bốc khói.' },
              { who: 'npc', text: 'Thứ trắng tròn này là đan dược gì? Không có linh khí, nhưng mùi thơm lạ lùng.' },
              { who: 'hero', text: 'Là bánh bao. Đồ ăn thôi. Cô chưa ăn bao giờ sao?' },
              { who: 'npc', text: 'Ta tu tích cốc từ năm bảy tuổi. Ba nghìn năm chỉ uống sương, nuốt đan.' },
              { who: 'sys', text: 'Nàng cắn một miếng. Đôi mắt lạnh như băng bỗng mở to, sáng rực.' },
              { who: 'npc', text: '...Ngon. Ngon quá. Ba nghìn năm qua ta đã bỏ lỡ cái gì thế này?' }
            ],
            choices: [
              { text: 'Mua thêm mười cái nữa nhé!', aff: 9, reply: 'Mười cái... Ngươi đúng là người tốt nhất ta gặp trong ba nghìn năm.' },
              { text: 'Còn nhiều món ngon lắm, để ta dẫn cô đi ăn.', aff: 8, reply: 'Ngươi hứa rồi đấy. Tiên nhân không quên lời hứa đâu.' },
              { text: 'Tiên nhân mà ham ăn vậy à?', aff: -2, reply: '...Ta không ham ăn. Ta đang nghiên cứu. Đưa ta cái nữa.' }
            ] },
          { at: 40, title: 'Mộ của Tiểu Lục',
            lines: [
              { who: 'sys', text: 'Trên sườn núi hoang, Thanh Hàn quỳ trước một nấm mộ cổ, bia đá đã mòn gần hết chữ.' },
              { who: 'npc', text: 'Ba nghìn năm trước, ta tự phong ấn mình cùng huyết kiếp. Ta có một đồ đệ nhỏ, tên Tiểu Lục.' },
              { who: 'npc', text: 'Con bé hứa sẽ chờ ta tỉnh dậy. Nó đã chờ... đến tận lúc tóc bạc.' },
              { who: 'npc', text: 'Trên bia khắc: "Sư phụ, hôm nay con vẫn chờ." Đó là dòng cuối cùng.' },
              { who: 'npc', text: 'Ta tu Vô Tình Đạo. Ta tưởng mình không biết đau. Hoá ra chỉ là chưa có dịp để đau.' }
            ],
            choices: [
              { text: 'Con bé chờ vì thương cô. Cô xứng đáng được thương như vậy.', aff: 10, reply: '...Ngươi nói vậy, ta lại muốn khóc. Tiên nhân mà khóc thì mất mặt lắm.' },
              { text: 'Để ta cùng cô thắp hương cho Tiểu Lục.', aff: 9, reply: 'Ừ. Tiểu Lục, đây là người đã cứu sư phụ. Con yên lòng nhé.' },
              { text: 'Chuyện đã qua ba nghìn năm rồi.', aff: -3, reply: 'Với ngươi là ba nghìn năm. Với ta, là hôm qua.' }
            ] },
          { at: 60, title: 'Vết nứt đạo tâm',
            lines: [
              { who: 'sys', text: 'Đang tĩnh toạ, Thanh Hàn bỗng phun ra một ngụm máu. Lớp băng quanh người nàng nứt toác.' },
              { who: 'npc', text: 'Đạo tâm... Vô Tình Đạo của ta... đang vỡ.' },
              { who: 'npc', text: 'Vô Tình Đạo không được có vướng bận. Nhưng giờ ta có rồi. Là ngươi.' },
              { who: 'npc', text: 'Nếu cứ ở cạnh ngươi, tu vi ta sẽ rơi rụng, có khi mất cả tiên thể.' },
              { who: 'npc', text: 'Có lẽ... ta nên rời đi.' }
            ],
            choices: [
              { text: 'Đạo là để sống, không phải để không cảm nhận gì cả.', aff: 10, reply: 'Ngươi dám giảng đạo cho tiên nhân? ...Nhưng có lẽ ngươi đúng.' },
              { text: 'Nếu cô đi, ta sẽ đi tìm. Dù mất ba nghìn năm.', aff: 9, reply: 'Đừng nói thế. Ta không muốn có thêm một Tiểu Lục nào nữa.' },
              { text: 'Nếu đó là điều tốt cho cô, cứ đi đi.', aff: -5, reply: '...Ngươi nói thật lòng sao? Vậy mà ta đã mong ngươi giữ ta lại.' }
            ] },
          { at: 80, title: 'Tuyết giữa mùa hạ',
            lines: [
              { who: 'sys', text: 'Một chưởng ma khí giáng xuống. Thanh Hàn đốt cháy tu vi, dựng tường băng che trước {hero}.' },
              { who: 'sys', text: 'Giữa mùa hạ, tuyết bỗng rơi trắng xoá cả sơn cốc.' },
              { who: 'npc', text: 'Đừng nhìn ta như thế. Chỉ là mất vài trăm năm tu vi thôi.' },
              { who: 'npc', text: 'Ba nghìn năm trước, ta chọn thiên hạ mà bỏ Tiểu Lục. Lần này, ta chọn ngươi.' },
              { who: 'npc', text: 'Nếu đó là đạo của ta... thì ta không hối hận.' }
            ],
            choices: [
              { text: 'Từ giờ, ta sẽ là người che chở cho cô.', aff: 10, reply: 'Một kẻ Trúc Cơ che chở tiên nhân? ...Nghe cũng không tệ.' },
              { text: 'Cô ngốc thật. Nhưng là kẻ ngốc ta thương.', aff: 9, reply: 'Ngươi vừa nói... thương? Nói lại xem nào.' },
              { text: 'Cô không cần hy sinh như vậy.', aff: 3, reply: 'Không phải hy sinh. Là lựa chọn. Lần đầu tiên ta tự chọn.' }
            ] },
          { at: 100, title: 'Hữu Tình Đạo',
            lines: [
              { who: 'sys', text: 'Đêm trước trận cuối. Trăng tròn treo trên đỉnh núi. Thanh Hàn ngồi trên tảng đá, tóc bạc như sương.' },
              { who: 'npc', text: 'Ba nghìn năm ta tu Vô Tình Đạo. Đêm nay, ta bỏ nó.' },
              { who: 'npc', text: 'Ta muốn tu một con đường khác, chẳng có trong điển tịch nào. Ta gọi nó là Hữu Tình Đạo.' },
              { who: 'npc', text: 'Đạo ấy chỉ có một quy tắc: ở bên người mình thương, đến khi trời đất già đi.' },
              { who: 'npc', text: 'Người đó là ngươi, {hero}. Ta yêu ngươi. Lần đầu trong ba nghìn năm, ta nói câu này.' },
              { who: 'sys', text: 'Một bông tuyết rơi xuống má {hero}, rồi tan ra. Ấm áp lạ thường.' }
            ],
            choices: [
              { text: 'Vậy cho ta làm đồng môn duy nhất của Hữu Tình Đạo.', aff: 10, reply: 'Đồng môn duy nhất. Và đạo lữ duy nhất. Ta không nhận thêm ai đâu.' },
              { text: 'Ta cũng yêu cô. Không cần đến ba nghìn năm để biết.', aff: 10, reply: 'Ngươi nhanh hơn ta nhiều. Từ giờ, ta sẽ học cách theo kịp ngươi.' },
              { text: 'Hãy để ta suy nghĩ đã.', aff: -4, reply: 'Ừ. Ta đã chờ ba nghìn năm. Chờ thêm chút nữa cũng được.' }
            ] }
        ]
      },
      {
        name: 'Mặc Trần', gender: 'm', portrait: 'tt_port2', role: 'Kiếm tu thiên tài',
        personality: 'Kiêu ngạo, miệng độc, coi trời bằng vung, nhưng trọng nghĩa hơn cả mạng sống.',
        likes: ['food', 'energy', 'pills'],
        meet: [
          { who: 'npc', text: 'Hừ. Bị một kẻ tu vi thấp hơn cứu. Đúng là nỗi nhục đời ta.' },
          { who: 'hero', text: 'Vậy có muốn ta trói lại không?' },
          { who: 'npc', text: '...Không cần. Mặc Trần, Tàng Kiếm Các. Món nợ này, ta trả bằng kiếm.' },
          { who: 'sys', text: 'Mặc Trần đã gia nhập. Phi kiếm của hắn xuyên thủng hàng loạt kẻ địch.' }
        ],
        banter: [
          'Ngươi đi chậm như rùa. Ta đợi đến mọc rêu rồi.',
          'Kiếm pháp của ngươi... cũng tạm. So với ta thì còn xa.',
          'Đừng tưởng ta đi cùng vì quý ngươi. Ta chỉ tiện đường.',
          'Đói à? ...Đây, bánh nướng. Ta mua thừa thôi.',
          'Kẻ mạnh hơn ta trên đời này? Chưa sinh ra đâu.',
          'Ngươi hỏi sao áo ta toàn màu đen? Vì dính máu không thấy.',
          'Đêm nay ta gác. Ngươi ngủ đi. Đừng ngáy.',
          'Có một điều ta chưa nói với ai: kiếm của ta sinh ra để bảo vệ.',
          'Cứ nhìn ta làm gì? Ta biết ta đẹp.',
          'Đi với ngươi phiền thật. Nhưng phiền... theo kiểu dễ chịu.'
        ],
        combat: ['Vạn kiếm quy tông!', 'Kiếm đến!', 'Tránh ra, đừng cản đường kiếm ta!', 'Lũ tạp nham!', 'Một kiếm phá vạn pháp!', 'Giữ bên trái, đừng để ta phải cứu nữa!'],
        hurt: ['Hừ, trầy da thôi.', 'Khụ... chưa đến mức phải lo.', 'Kẻ dám làm ta đổ máu, sẽ trả bằng mạng.'],
        gift: ['Cho ta? ...Hừ, ta nhận vì nể mặt ngươi thôi.', 'Món này không tệ. Ta sẽ... dùng tạm.', 'Lần sau đừng tốn kém vì ta. ...Nhưng lần này thì cảm ơn.'],
        stages: [
          { at: 20, title: 'Trận tỉ thí',
            lines: [
              { who: 'sys', text: 'Mặc Trần ném cho {hero} một thanh kiếm gỗ: "Tỉ thí. Ngay bây giờ."' },
              { who: 'sys', text: 'Ba hiệp. {hero} thua cả ba, nhưng ở hiệp cuối, mũi kiếm gỗ chạm được vạt áo hắn.' },
              { who: 'npc', text: '...Chạm được vào áo ta. Mười năm nay chưa ai làm được.' },
              { who: 'npc', text: 'Ngươi có thiên phú. Đừng phí nó. Mai, giờ Mão, ta dạy thêm.' },
              { who: 'npc', text: 'Đừng hiểu lầm. Ta chỉ không muốn đồng hành với một kẻ yếu.' }
            ],
            choices: [
              { text: 'Cảm ơn sư huynh!', aff: 7, reply: 'Ai là sư huynh của ngươi? ...Thôi được, cứ gọi vậy đi.' },
              { text: 'Lần sau ta sẽ chạm được vào người ngươi.', aff: 9, reply: 'Ha! Ta chờ. Đừng để ta chờ lâu quá.' },
              { text: 'Ta không cần ngươi dạy.', aff: -4, reply: 'Tuỳ ngươi. Chết vì cứng đầu thì đừng trách ta.' }
            ] },
          { at: 40, title: 'Cái giếng cạn',
            lines: [
              { who: 'sys', text: 'Đi ngang một ngôi làng đổ nát, Mặc Trần đứng lặng trước một cái giếng cạn.' },
              { who: 'npc', text: 'Ta sinh ra ở một tông môn nhỏ. Năm ta sáu tuổi, ma tu kéo đến trong một đêm.' },
              { who: 'npc', text: 'Mẹ giấu ta xuống giếng, dặn dù nghe gì cũng không được kêu.' },
              { who: 'npc', text: 'Ta nghe hết. Ba ngày ba đêm. Rồi im lặng.' },
              { who: 'npc', text: 'Từ đó ta thề, không bao giờ trốn nữa. Ta sẽ là kiếm. Không bao giờ là kẻ núp dưới giếng.' }
            ],
            choices: [
              { text: 'Đứa trẻ ấy không có lỗi. Nó đã sống, đúng như mẹ muốn.', aff: 10, reply: '...Chưa ai từng nói với ta câu đó. Ta không biết phải đáp thế nào.' },
              { text: 'Giờ có ta ở đây. Ngươi không phải đứng một mình.', aff: 9, reply: 'Ngươi... đừng nói mấy câu làm người ta mềm lòng như thế.' },
              { text: 'Hận thù chỉ làm kiếm thêm nặng.', aff: -2, reply: 'Có lẽ. Nhưng không có nó, ta đã chẳng nhấc nổi kiếm.' }
            ] },
          { at: 60, title: 'Kim Đan rạn nứt',
            lines: [
              { who: 'sys', text: 'Sau trận chiến, Mặc Trần lảo đảo dựa vào gốc cây. Linh lực trong người rò rỉ như bình vỡ.' },
              { who: 'hero', text: 'Kim Đan của ngươi... rạn nứt rồi!' },
              { who: 'npc', text: 'Ồn ào. Ta biết. Tuyệt Kiếm Quyết đốt thọ nguyên để đổi lấy sức mạnh.' },
              { who: 'npc', text: 'Ta còn chừng ba năm. Có lẽ ít hơn. Đủ để chém hết ma tu trên đời.' },
              { who: 'npc', text: 'Đừng nhìn ta bằng ánh mắt thương hại đó. Ta ghét nhất là thứ đó.' }
            ],
            choices: [
              { text: 'Không phải thương hại. Là ta không muốn mất ngươi.', aff: 10, reply: '...Ngươi nói thẳng quá. Ta không biết phải làm gì với câu đó.' },
              { text: 'Ta sẽ tìm cách vá Kim Đan cho ngươi. Dù phải lật tung thiên hạ.', aff: 9, reply: 'Đồ ngốc. Đó là việc của ta. ...Nhưng nếu ngươi muốn, ta không cản.' },
              { text: 'Ngươi tự chọn con đường này mà.', aff: -5, reply: 'Đúng. Ta tự chọn. Nên chẳng cần ai bận lòng.' }
            ] },
          { at: 80, title: 'Đổi mạng',
            lines: [
              { who: 'sys', text: 'Ma Tôn giáng chưởng. {hero} định lao ra đỡ, nhưng Mặc Trần đã chắn trước. Kiếm gãy làm đôi.' },
              { who: 'npc', text: 'Đồ ngu! Ngươi định chết thay ai hả?!' },
              { who: 'npc', text: 'Mạng ta ngắn. Muốn đổi thì lấy mạng ta mà đổi. Mạng ngươi còn dài.' },
              { who: 'hero', text: 'Mạng ai cũng không phải để đổi!' },
              { who: 'npc', text: '...Ngươi lúc nào cũng vậy. Khiến ta muốn sống lâu hơn. Thật phiền phức.' }
            ],
            choices: [
              { text: 'Vậy hãy sống lâu hơn. Vì ta.', aff: 10, reply: 'Vì ngươi... được. Lần đầu ta có lý do để sợ chết.' },
              { text: 'Lần sau đừng ngăn ta bảo vệ ngươi.', aff: 8, reply: 'Không hứa. Kiếm của ta sinh ra là để chắn trước ngươi.' },
              { text: 'Ngươi đúng là cứng đầu.', aff: 3, reply: 'Cứng đầu mới sống được đến giờ.' }
            ] },
          { at: 100, title: 'Kiếm và vỏ kiếm',
            lines: [
              { who: 'sys', text: 'Đêm trước trận cuối. Mặc Trần đưa cho {hero} một vỏ kiếm mới, khắc hoa văn mây vàng.' },
              { who: 'npc', text: 'Kiếm tu cả đời chỉ có một thanh kiếm, và một vỏ kiếm.' },
              { who: 'npc', text: 'Kiếm để chiến đấu. Vỏ kiếm là nơi để kiếm trở về.' },
              { who: 'npc', text: 'Ta đã chiến đấu đủ lâu. Ta muốn có một nơi để trở về. Là ngươi.' },
              { who: 'npc', text: 'Ta yêu ngươi, {hero}. Câu này ta tập một trăm lần rồi, vẫn ngượng chết đi được.' },
              { who: 'npc', text: 'Xong trận này, ta sẽ đi tìm cách vá Kim Đan. Không phải vì sợ chết. Mà vì muốn sống cùng ngươi.' }
            ],
            choices: [
              { text: 'Ta sẽ là vỏ kiếm của ngươi. Cả đời.', aff: 10, reply: 'Cả đời... dài lắm đấy. Ngươi không được hối hận đâu.' },
              { text: 'Ta cũng yêu ngươi, đồ kiêu ngạo.', aff: 10, reply: 'Kiêu ngạo cũng được. Miễn là của ngươi.' },
              { text: 'Để sau trận chiến đi.', aff: -4, reply: 'Được. Vậy ta càng phải sống sót để nghe câu trả lời.' }
            ] }
        ]
      }
    ],
    civilians: {
      help: ['Tiên sư cứu mạng! Yêu thú đang đuổi theo!', 'Cứu với! Sư huynh ta hoá huyết thi rồi!', 'Có ai không? Ta bị nhốt trong động!', 'Đạo hữu xin dừng bước! Cứu lấy con ta!', 'Linh lực cạn kiệt rồi... ai đó giúp ta!', 'Đừng bỏ ta lại! Ma lang sắp đến rồi!'],
      thanks: ['Đa tạ tiên sư! Viên linh thạch này xin người nhận lấy.', 'Ơn cứu mạng, ta xin khắc ghi trong lòng.', 'Ta có một viên hồi khí đan. Đạo hữu cầm lấy phòng thân.', 'Tiên sư đúng là Bồ Tát hạ phàm! Ta sẽ lập bài vị cho người.', 'Đây là bí kíp gia truyền. Chẳng đáng là bao, nhưng là tấm lòng.', 'Cảm tạ ân nhân! Mong người sớm ngày phi thăng.']
    },
    events: [
      'Huyết vân cuồn cuộn kéo đến từ phương bắc...',
      'Một đạo lôi kiếp giáng xuống đỉnh núi xa. Có ai đó đang độ kiếp.',
      'Linh khí đột ngột dâng trào. Có bảo vật xuất thế gần đây.',
      'Chuông tông môn vang chín hồi. Một vị trưởng lão đã vẫn lạc.',
      'Mưa máu rơi lất phất. Cây cỏ héo úa trong chớp mắt.',
      'Một đàn hạc trắng bay ngang trời, kêu lên thê lương.',
      'Mặt đất rung chuyển. Có yêu thú thượng cổ đang trở mình.',
      'Sao băng vạch ngang bầu trời. Thiên tượng bất thường.'
    ],
    bossTaunts: ['Con kiến cỏ cũng dám nghịch thiên?', 'Tu vi của ngươi, ta chỉ cần một ngón tay.', 'Huyết kiếp đã định, thiên đạo cũng không cứu được ngươi!', 'Quỳ xuống, ta tha cho ngươi một mạng!', 'Hồn phách ngươi sẽ thành đan dược của ta!'],
    deathLines: ['Thân tử đạo tiêu. Nhưng chân linh chưa tán.', 'Một kiếp đã hết. Kiếp sau, hãy tu lại từ đầu.', 'Nghịch thiên khó, nhưng không phải không thể. Đứng dậy.']
  },
  // =====================================================================
  // THỢ SĂN CỔNG — Cổng hạng E đến S, Hệ Thống, đội quân bóng tối
  // =====================================================================
  sl: {
    name: 'Thợ Săn Cổng',
    tagline: 'Hệ Thống đã chọn ngươi. Hãy trỗi dậy.',
    desc: 'Mười năm trước, những Cổng không gian bắt đầu mở ra khắp thành phố, phân hạng từ E đến S. Bạn, thợ săn hạng E yếu nhất, suýt chết trong một ngục tối kép rồi tỉnh dậy với một khung cửa sổ màu xanh chỉ mình bạn nhìn thấy. Hệ Thống đã chọn bạn.',
    heroNames: ['Hàn Dũng', 'Kim Vũ', 'Lý Thần', 'Phác Ngân', 'Doãn Hạo', 'Thôi Lam'],
    levelTitles: ['Hạng E', 'Hạng D', 'Hạng C', 'Hạng B', 'Hạng A', 'Hạng S', 'Cấp Quốc Gia', 'Kẻ Vượt Giới Hạn', 'Chúa Tể Bóng Đêm', 'Quân Vương Bóng Tối'],
    names: {
      villains: ['Huyết Kỵ Sĩ Vô Diện', 'Kiến Vương Bạo Thực', 'Hội trưởng Mã Cường', 'Kiến Trúc Sư Cổng', 'Nữ Vương Tinh Linh Hắc Ám', 'Kẻ Cai Ngục Vực Thẳm'],
      artifacts: ['Lõi Ma Thạch', 'Chìa Khoá Cổng Đỏ', 'Mảnh Vương Miện Bóng Tối', 'Tinh Thể Ma Lực Hạng S', 'Mảnh Bia Đá Cổ', 'Bình Thánh Thuỷ'],
      places: ['Ga ngầm Trung Tâm', 'Toà nhà Hiệp Hội Thợ Săn', 'Đảo Sương Mù', 'Bệnh viện Thánh Tâm', 'Khu chợ cũ phía Đông', 'Đền thờ dưới lòng đất', 'Sân vận động Thành Phố', 'Cầu Ánh Trăng'],
      factions: ['Hiệp Hội Thợ Săn', 'Bang Hội Bạch Hổ', 'Bang Hội Phượng Hoàng', 'Đội Giám Sát Cổng']
    },
    stories: [
      {
        title: 'Ngục Tối Kép',
        intro: [
          'Thành phố này đã sống chung với Cổng suốt mười năm.',
          '{hero}, thợ săn hạng E, bị gọi là "kẻ yếu nhất nhân loại".',
          'Trong một ngục tối tưởng như vô hại, cả đội bị thảm sát. Chỉ còn {hero} nằm giữa vũng máu.',
          '[HỆ THỐNG] Đã đáp ứng đủ điều kiện. Ngươi có muốn trở thành Người Chơi không?',
          '{hero} đáp "Có". Và thế giới thay đổi từ giây phút ấy.'
        ],
        acts: [
          { type: 'explore', goal: 'Trinh sát Cổng mới mở quanh {place}',
            start: ['[HỆ THỐNG] Nhiệm vụ hằng ngày: Khảo sát khu vực có Cổng. Phần thưởng: Điểm chỉ số.', '[{faction}] Có Cổng hạng D vừa mở. Thợ săn hạng E... nhớ giữ an toàn nhé.', 'Ma lực rò rỉ trong không khí, tê buốt như điện giật trên da.'],
            done: ['[HỆ THỐNG] Nhiệm vụ hoàn thành. Phát hiện tín hiệu dị thường: Cổng Đỏ.', 'Cổng Đỏ. Loại cổng không thể thoát ra cho đến khi hạ được trùm.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} để ổn định Cổng Đỏ',
            start: ['[HỆ THỐNG] Nhiệm vụ ẩn: Thu thập 3 {artifact}. Thất bại: Cổng vỡ, quái vật tràn ra thành phố.', 'Yêu tinh đi theo bầy, phóng giáo rất chuẩn. Đừng đứng yên một chỗ.', 'Thợ săn khác nhìn {hero} với ánh mắt lạ: "Hạng E mà đánh được thế à?"'],
            done: ['[HỆ THỐNG] Đã thu thập đủ. Cổng Đỏ tạm thời ổn định.', '[HỆ THỐNG] Cảnh báo: Có thợ săn bị kẹt bên trong Cổng Đỏ. Thời gian còn lại: 1 giờ.'] },
          { type: 'rescue', goal: 'Giải cứu {companion} bị kẹt trong Cổng Đỏ',
            start: ['[HỆ THỐNG] Nhiệm vụ khẩn cấp: Giải cứu thợ săn {companion}.', 'Bên trong Cổng Đỏ là mùa đông vĩnh cửu. Tuyết phủ lên xác những thợ săn đến trước.', 'Tiếng giao chiến vẳng lại từ xa. Ai đó vẫn đang cầm cự.'],
            done: ['{companion} thở dốc, nhìn {hero} không chớp mắt: "Hạng E...? Cậu là hạng E thật sao?"', '[HỆ THỐNG] {companion} đã gia nhập tổ đội.'] },
          { type: 'gate', goal: 'Chinh phục Lâu Đài Máu, tầng sâu nhất của Cổng Đỏ',
            start: ['Giữa băng tuyết sừng sững một toà lâu đài đỏ thẫm. Ma lực đặc quánh đến nghẹt thở.', '[HỆ THỐNG] Khu vực nguy hiểm cấp S. Khuyến cáo: Không nên tiến vào.', '"Khuyến cáo thôi mà." {hero} nhún vai, bước vào.'],
            done: ['[HỆ THỐNG] Đã chinh phục Lâu Đài Máu. Trùm cuối xuất hiện.', 'Cửa sảnh chính mở toang. Trên ngai vàng, một kỵ sĩ giáp đỏ chậm rãi đứng dậy.'] },
          { type: 'boss', goal: 'Hạ gục {villain}, chủ nhân Lâu Đài Máu',
            start: ['{villain} rút thanh trường kiếm dài hơn cả người thường.', '"Kẻ yếu không có quyền đặt chân vào lâu đài này."', '[HỆ THỐNG] Nhiệm vụ chính: Đánh bại {villain}. Phần thưởng: Kỹ năng đặc biệt.'],
            done: ['{villain} quỳ xuống, giáp vỡ nát. [HỆ THỐNG] Có thể trích xuất bóng tối từ mục tiêu.', '"TRỖI DẬY." Từ xác kỵ sĩ, một bóng đen đứng lên, cúi đầu trước {hero}.'] }
        ],
        endings: {
          normal: [
            'Cổng Đỏ đóng lại. Toàn bộ thợ săn mắc kẹt đều trở về.',
            'Hiệp Hội đo lại cấp bậc của {hero}. Kết quả khiến cả hội trường chết lặng.',
            'Nhưng {hero} chẳng màng thứ hạng. Chỉ lặng lẽ nhìn đội quân bóng tối sau lưng.',
            '[HỆ THỐNG] Nhiệm vụ tiếp theo đang chờ. Hãy mạnh hơn nữa.'
          ],
          romance: [
            'Ba ngày sau, {companion} hẹn {hero} ra quán canh nóng gần Hiệp Hội.',
            '"Trong Cổng Đỏ, tôi tưởng mình chết chắc. Rồi cậu xuất hiện, cứ như phép màu."',
            '"Không phải phép màu. Chỉ là tôi không muốn mất thêm ai nữa."',
            '{companion} đẩy bát canh sang: "Vậy để tôi chăm cậu, một lần thôi."',
            '[HỆ THỐNG] Phát hiện nhịp tim bất thường. Nguyên nhân: Không xác định.',
            '{hero} đóng cửa sổ hệ thống. Lần đầu tiên, có thứ quan trọng hơn nhiệm vụ.'
          ]
        }
      },
      {
        title: 'Đảo Kiến',
        intro: [
          'Đảo Sương Mù từng là một Cổng hạng S bị vỡ. Kiến khổng lồ chiếm trọn hòn đảo.',
          'Sáu năm, bốn cuộc đột kích. Hàng trăm thợ săn bỏ mạng.',
          'Giờ đây, đàn kiến bắt đầu bơi về phía đất liền.',
          'Và {villain} đã tiến hoá. Nó học được cách nói tiếng người.',
          '[HỆ THỐNG] Nhiệm vụ khẩn cấp: Ngăn chặn đàn kiến. Từ chối: Không thể.'
        ],
        acts: [
          { type: 'explore', goal: 'Đổ bộ và trinh sát {place}',
            start: ['[{faction}] Cuộc đột kích thứ năm bắt đầu. Toàn bộ thợ săn hạng S đã có mặt.', 'Bãi biển phủ kín vỏ kén trắng. Có thứ gì đó đang nở bên trong.', 'Kiến lính khổng lồ có vỏ cứng như thép. Nhắm vào các khớp nối.'],
            done: ['[HỆ THỐNG] Đã xác định vị trí tổ kiến. Phát hiện ba ổ trứng của Kiến Chúa.', 'Phải phá ổ trứng trước. Nếu không, đàn kiến sẽ đông gấp đôi trước khi trời tối.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} từ các ổ trứng Kiến Chúa',
            start: ['[HỆ THỐNG] Mỗi ổ trứng được nuôi bằng một {artifact}. Thu thập để chặn quá trình ấp.', 'Chất nhầy dính đầy chân. Mùi chua nồng xộc thẳng lên óc.', 'Slime phát nổ đang lăn tới. Đứng xa ra!'],
            done: ['Ba ổ trứng đã tan. Đàn kiến gào lên giận dữ, rút về tổ.', '[{faction}] Tin xấu! Đội tiền trạm bị lôi vào tổ. Có cả {companion}.'] },
          { type: 'rescue', goal: 'Giải cứu {companion} khỏi lồng kén trong tổ kiến',
            start: ['{companion} bị bọc trong kén, treo lơ lửng giữa hang.', 'Kiến Chúa đang dùng thợ săn làm thức ăn cho ấu trùng.', '[HỆ THỐNG] Thời gian trước khi kén hoá cứng: 10 phút.'],
            done: ['{hero} xé toạc lớp kén. {companion} ngã vào vòng tay {hero}, ho sặc sụa.', '"Cảm ơn... Lần sau đến sớm hơn chút được không?" Vẫn còn sức đùa. Tốt.'] },
          { type: 'gate', goal: 'Tiến sâu vào tổ kiến dưới lòng đảo',
            start: ['Đường hầm sâu hun hút, như ruột gan của cả hòn đảo.', 'Tiếng chân kiến dội lại từ mọi phía. Hàng nghìn. Hàng vạn.', '[HỆ THỐNG] Gợi ý: Hãy để đội quân bóng tối đi trước dò đường.'],
            done: ['Kiến Chúa ngã xuống. Cả đàn kiến rơi vào hỗn loạn.', 'Rồi một thứ còn đáng sợ hơn bước ra. Nó vừa ăn thịt chính mẹ mình.'] },
          { type: 'boss', goal: 'Đánh bại {villain}, kẻ thống trị hòn đảo',
            start: ['{villain} có đôi cánh như lưỡi hái, đôi mắt sáng rực trí khôn.', '"Thức ăn... lại tự bước đến. Con người thật kỳ lạ."', '[HỆ THỐNG] Cảnh báo: Mục tiêu vượt quá cấp độ hiện tại. Khuyến cáo: Rút lui.'],
            done: ['{villain} ngã xuống, đôi cánh rách nát. [HỆ THỐNG] Có thể trích xuất bóng tối.', '"TRỖI DẬY." Bóng đen đứng dậy, quỳ một chân: "Thưa chủ nhân."'] }
        ],
        endings: {
          normal: [
            'Sau sáu năm, Đảo Sương Mù được giải phóng.',
            'Báo chí gọi {hero} là "Thợ săn mạnh nhất". {hero} chỉ thấy mệt.',
            'Đêm đó, {hero} ngồi trên mái nhà, cạnh tên kiến bóng tối mới đang tập nấu mì.',
            'Nó nấu dở tệ. Nhưng {hero} vẫn ăn hết.'
          ],
          romance: [
            'Chuyến tàu trở về đất liền. Biển lặng, hoàng hôn đỏ rực.',
            '{companion} đứng cạnh {hero} ở mũi tàu, gió thổi tung mái tóc.',
            '"Lúc bị bọc trong kén, tôi chỉ nghĩ đến một điều. Rằng tôi chưa kịp nói với cậu."',
            '"Nói gì?" "Rằng tôi thích cậu. Thích từ lâu lắm rồi."',
            '{hero} không đáp. Chỉ nắm lấy tay {companion}, siết thật chặt.',
            '[HỆ THỐNG] Phát hiện trạng thái "Hạnh phúc". Không có hướng dẫn xử lý. Tự giải quyết.'
          ]
        }
      },
      {
        title: 'Giáo Phái Cổng Đỏ',
        intro: [
          'Số lượng Cổng tăng đột biến. Gấp ba lần chỉ trong một tháng.',
          'Hiệp Hội cho rằng đó là thiên tai. {hero} thì không nghĩ vậy.',
          'Mỗi Cổng mới đều mở cạnh tài sản của bang hội do {villain} đứng đầu.',
          'Hắn mở Cổng, thả quái tràn ra, rồi thu tiền dân để "giải cứu".',
          '[HỆ THỐNG] Nhiệm vụ đặc biệt: Phơi bày sự thật. Phần thưởng: ???'
        ],
        acts: [
          { type: 'explore', goal: 'Điều tra những Cổng bất thường quanh {place}',
            start: ['[{faction}] Cổng thứ mười hai trong tuần. Dân chúng bắt đầu hoảng loạn.', 'Cổng này mang dấu vết ma pháp nhân tạo. Ai đó đã cố tình mở nó.', 'Yêu tinh tràn ra đường. Trên tay chúng còn đeo băng có huy hiệu bang hội.'],
            done: ['Bằng chứng rõ ràng: các Cổng được mở bằng một nghi thức cổ.', 'Nghi thức cần một loại vật phẩm đặc biệt. Và {villain} đang tích trữ rất nhiều.'] },
          { type: 'collect', goal: 'Thu thập 3 {artifact} làm bằng chứng',
            start: ['[HỆ THỐNG] Nhiệm vụ: Thu thập 3 {artifact} dùng để mở Cổng nhân tạo.', 'Pháp sư tinh linh hắc ám canh giữ kho. Chúng là "hợp đồng" của {villain}.', 'Có kẻ đang bám theo. Không phải quái. Là thợ săn.'],
            done: ['Đủ ba {artifact}. Trên mỗi món đều khắc ký hiệu bang hội của {villain}.', '[{faction}] {companion} vừa cố tố giác hắn, và đã bị bắt cóc!'] },
          { type: 'rescue', goal: 'Giải cứu {companion} khỏi phòng nghi lễ',
            start: ['{companion} bị trói giữa vòng ma pháp. {villain} định dùng người đó làm vật tế để mở Cổng hạng S.', 'Kỵ sĩ xương canh giữ mọi lối vào. Chúng không biết đau, không biết sợ.', '[HỆ THỐNG] Đội quân bóng tối đã sẵn sàng. Ra lệnh?'],
            done: ['Vòng ma pháp vỡ tan. {companion} ngã vào vòng tay {hero}.', '"Tôi biết cậu sẽ đến. Không hiểu sao, nhưng tôi biết."'] },
          { type: 'gate', goal: 'Đóng Cổng hạng S nhân tạo dưới sân vận động',
            start: ['Nghi lễ đã hoàn thành một nửa. Một Cổng đỏ đen khổng lồ xoáy giữa sân vận động.', '[HỆ THỐNG] Cảnh báo: Không đóng Cổng trong 30 phút, cả thành phố sẽ bị nuốt chửng.', '{companion}: "Tôi đi cùng. Đừng cãi, tôi tự lo được."'],
            done: ['Lõi Cổng vỡ nát. Xoáy ma lực co lại, chậm dần.', 'Nhưng {villain} đã nuốt viên ma thạch cuối cùng. Thân thể hắn bắt đầu biến dạng.'] },
          { type: 'boss', goal: 'Đánh bại {villain}, kẻ buôn bán thảm hoạ',
            start: ['{villain}: "Ngươi nghĩ mình là anh hùng? Thế giới này vận hành bằng tiền!"', '"Không có Cổng, chẳng ai cần thợ săn. Ta chỉ đang giữ cho cái nghề này sống sót!"', '"Cái nghề của ngươi xây trên xác người dân." {hero} gọi đội quân bóng tối.'],
            done: ['{villain} gục ngã. Nhưng {hero} không trích xuất bóng tối của hắn.', '"Có những kẻ, ngay cả cái bóng cũng không đáng giữ lại."'] }
        ],
        endings: {
          normal: [
            'Bằng chứng được công bố. Bang hội của {villain} bị giải tán.',
            'Số Cổng mới giảm dần, trở về mức bình thường.',
            'Hiệp Hội mời {hero} làm hội trưởng. {hero} từ chối.',
            '"Tôi là thợ săn, không phải chính trị gia." Rồi lại bước vào Cổng kế tiếp.'
          ],
          romance: [
            'Một tuần sau. Sân thượng toà nhà Hiệp Hội, gió đêm mát rượi.',
            '{companion} đưa cho {hero} một lon cà phê: "Cảm ơn vì đã tin tôi, khi chẳng ai tin."',
            '"Cậu cũng tin tôi, từ hồi tôi còn là hạng E."',
            'Họ cười, rồi im lặng. Thành phố dưới chân lấp lánh ánh đèn.',
            '{companion} tựa đầu vào vai {hero}: "Tôi muốn ở cạnh cậu. Không chỉ trong Cổng. Mà là mỗi ngày."',
            'Những cái bóng sau lưng {hero} lặng lẽ lùi ra xa. Ngay cả chúng cũng biết lúc nào nên nhường chỗ.'
          ]
        }
      }
    ],
    companions: [
      {
        name: 'Thôi Hạ Linh', gender: 'f', portrait: 'sl_port1', role: 'Trị liệu sư hạng S',
        personality: 'Dịu dàng, lễ phép, mệt mỏi vì bị đối xử như công cụ, và bí mật rất sợ bóng tối.',
        likes: ['choco', 'flower', 'energy'],
        meet: [
          { who: 'npc', text: 'Cậu bị thương rồi. Để tôi chữa trước đã... Ồ, xin lỗi, thói quen nghề nghiệp.' },
          { who: 'hero', text: 'Cô mới là người vừa bị bắt đấy.' },
          { who: 'npc', text: 'Thôi Hạ Linh, trị liệu sư hạng S. Rất vui... à không, rất cảm ơn cậu.' },
          { who: 'sys', text: '[HỆ THỐNG] Thôi Hạ Linh đã gia nhập tổ đội. Hiệu ứng: Hồi máu theo thời gian.' }
        ],
        banter: [
          'Cậu lại bị trầy rồi kìa. Đứng yên, tôi chữa cho.',
          'Ánh sáng trị liệu của tôi màu vàng. Bóng của cậu màu đen. Hợp nhau ghê.',
          'Lần đầu có người đi cạnh tôi mà không nhìn tôi như cái máy hồi máu.',
          'Đói không? Tôi có thanh sô-cô-la. Chia đôi nhé.',
          'Ừm... hang này tối quá. Cậu đi sát tôi chút được không?',
          'Ở bang hội cũ, người ta gọi tôi là "tài sản". Nghe buồn cười nhỉ.',
          'Dạo này cậu cười nhiều hơn rồi đấy. Tôi để ý mà.',
          'Hệ Thống của cậu có nói gì về tôi không? ...Tò mò thôi.',
          'Đừng lo, có tôi ở đây thì cậu không chết được đâu.',
          'Nếu được chọn lại, tôi vẫn sẽ chọn đi theo cậu.'
        ],
        combat: ['Ánh sáng, hồi phục!', 'Tôi giữ máu cho cậu, cứ đánh đi!', 'Kết giới thánh, dựng lên!', 'Cẩn thận phía sau!', 'Đừng để chúng lại gần tôi!', 'Tôi ổn, tập trung vào trùm!'],
        hurt: ['Á... tôi không tự chữa cho mình được đâu...', 'Đau quá... nhưng cậu không sao là được.', 'Không sao... chỉ cần nghỉ một chút.'],
        gift: ['Cho tôi sao? Ôi, cảm ơn cậu nhiều lắm!', 'Lần đầu có người tặng quà mà không đòi tôi chữa trị để đổi lại.', 'Tôi sẽ giữ nó thật cẩn thận. Hứa đấy.'],
        stages: [
          { at: 20, title: 'Một câu hỏi',
            lines: [
              { who: 'sys', text: 'Sau trận chiến, Hạ Linh chữa cho cả đội, rồi ngồi thụp xuống một góc, mặt tái nhợt.' },
              { who: 'hero', text: 'Cô có mệt không?' },
              { who: 'sys', text: 'Hạ Linh ngẩng lên, nhìn {hero} như vừa nghe một thứ ngôn ngữ lạ.' },
              { who: 'npc', text: 'Mệt... à? Tám năm làm thợ săn, chưa ai hỏi tôi câu đó.' },
              { who: 'npc', text: 'Người ta chỉ hỏi: "Chữa xong chưa?", "Còn ma lực không?". Như hỏi một cái máy.' },
              { who: 'npc', text: 'Ừ... tôi mệt lắm. Cảm ơn vì đã hỏi.' }
            ],
            choices: [
              { text: 'Vậy nghỉ đi. Lần này để tôi canh.', aff: 9, reply: 'Thật sao? Vậy... tôi chợp mắt một chút nhé. Chỉ một chút thôi.' },
              { text: 'Từ giờ ngày nào tôi cũng sẽ hỏi.', aff: 8, reply: 'Ngày nào cũng hỏi... Nghe như lời hứa vậy. Tôi sẽ nhớ đấy.' },
              { text: 'Hạng S mà cũng biết mệt à?', aff: -3, reply: '...Hạng S cũng là người mà.' }
            ] },
          { at: 40, title: 'Bản hợp đồng',
            lines: [
              { who: 'sys', text: 'Một gã từ bang hội cũ chặn đường, chìa ra tờ giấy: "Hợp đồng của cô còn hiệu lực năm năm."' },
              { who: 'npc', text: 'Năm mười lăm tuổi tôi thức tỉnh. Hôm sau, bố mẹ ký hợp đồng giao quyền quản lý tôi cho bang hội.' },
              { who: 'npc', text: 'Đổi lấy một căn nhà lớn. Họ bảo là vì tương lai của tôi.' },
              { who: 'npc', text: 'Tôi đã chữa cho hàng nghìn người. Nhưng chưa từng được chọn sẽ chữa cho ai.' },
              { who: 'npc', text: 'Đi theo cậu là lần đầu tiên tôi tự chọn một điều gì đó.' }
            ],
            choices: [
              { text: 'Vậy cô cứ tiếp tục chọn. Tôi sẽ đứng về phía cô.', aff: 10, reply: 'Cậu nói nhẹ tênh như vậy... mà sao tôi lại muốn khóc.' },
              { text: 'Để tôi lo vụ hợp đồng. Mấy cái bóng của tôi giỏi thương lượng lắm.', aff: 8, reply: 'Đừng doạ người ta quá nhé! ...Nhưng mà, cảm ơn cậu.' },
              { text: 'Ít ra bố mẹ cô cũng có nhà đẹp.', aff: -4, reply: '...Ừ. Họ có nhà đẹp. Còn tôi có gì chứ?' }
            ] },
          { at: 60, title: 'Nỗi sợ bóng tối',
            lines: [
              { who: 'sys', text: 'Đèn pin vụt tắt giữa ngục tối. Hạ Linh đứng sững, thở dốc, run lẩy bẩy.' },
              { who: 'npc', text: 'Tối quá... tối quá... không thấy gì cả...' },
              { who: 'sys', text: 'Năm tám tuổi, cô bị vùi dưới đống đổ nát của một Cổng sụp, ba ngày trong bóng tối. Đó cũng là lúc cô thức tỉnh.' },
              { who: 'npc', text: 'Xin lỗi... tôi biết bóng tối là sức mạnh của cậu. Tôi không ghét cậu. Tôi chỉ...' },
              { who: 'npc', text: 'Tôi chỉ sợ đến mức không thở nổi.' }
            ],
            choices: [
              { text: 'Nắm tay tôi. Bóng tối này là của tôi, nó sẽ không làm hại cô.', aff: 10, reply: 'Tay cậu ấm quá... Lạ thật. Bóng tối của cậu, không đáng sợ chút nào.' },
              { text: 'Tôi ở ngay đây. Thở cùng tôi nào. Hít vào, thở ra.', aff: 9, reply: 'Hít vào... thở ra... Ừ. Cậu ở đây. Cậu ở đây rồi.' },
              { text: 'Thợ săn mà sợ tối thì khó sống lắm.', aff: -5, reply: 'Tôi biết. Tôi biết mà. Không cần cậu nhắc.' }
            ] },
          { at: 80, title: 'Người chữa lành không thể tự chữa',
            lines: [
              { who: 'sys', text: '{hero} trúng đòn chí mạng. Hạ Linh dồn toàn bộ ma lực chữa trị, cho đến khi chính cô ngã gục.' },
              { who: 'sys', text: 'Khi {hero} tỉnh lại, cô nằm ngay bên cạnh, mặt trắng bệch nhưng vẫn mỉm cười.' },
              { who: 'npc', text: 'Cậu tỉnh rồi... Tốt. Tôi cạn ma lực rồi, không đứng dậy nổi nữa.' },
              { who: 'npc', text: 'Cậu biết không, năng lực của tôi chữa được cho mọi người. Trừ chính tôi.' },
              { who: 'npc', text: 'Nhưng mỗi lần ở cạnh cậu, tôi thấy mình như đang được chữa lành. Lạ lắm phải không?' }
            ],
            choices: [
              { text: 'Không lạ. Vì tôi cũng thấy y như vậy.', aff: 10, reply: 'Thật sao? Vậy... mình chữa cho nhau nhé. Mãi mãi.' },
              { text: 'Lần sau đừng liều như thế. Tôi không chịu nổi đâu.', aff: 8, reply: 'Cậu lo cho tôi à? ...Vậy thì tôi càng không muốn để cậu bị thương.' },
              { text: 'Cô nên giữ lại chút ma lực cho mình.', aff: 3, reply: 'Ừ. Lần sau tôi sẽ cố. Chắc vậy.' }
            ] },
          { at: 100, title: 'Ánh sáng giữa bóng tối',
            lines: [
              { who: 'sys', text: 'Đêm trước trận cuối. Hạ Linh tắt hết đèn trong phòng, chỉ còn lại ánh trăng.' },
              { who: 'npc', text: 'Cậu thấy không? Tôi đang ngồi trong bóng tối. Và tôi không sợ nữa.' },
              { who: 'npc', text: 'Vì giờ tôi biết, bóng tối có thể là của cậu. Có thể là nơi an toàn nhất.' },
              { who: 'npc', text: 'Tôi đã chữa cho hàng nghìn người. Nhưng cậu là người duy nhất chữa lành cho tôi.' },
              { who: 'npc', text: 'Tôi yêu cậu, {hero}. Dù cậu là Quân Vương Bóng Tối hay chỉ là thợ săn hạng E.' },
              { who: 'sys', text: '[HỆ THỐNG] Phát hiện liên kết đặc biệt. Kỹ năng mới: "Ánh Sáng Trong Bóng Tối".' }
            ],
            choices: [
              { text: 'Tôi cũng yêu cô. Từ giờ, cô là ánh sáng của tôi.', aff: 10, reply: 'Ánh sáng và bóng tối... Nghe như sinh ra để dành cho nhau vậy.' },
              { text: 'Hệ Thống còn tặng cả kỹ năng. Chắc nó cũng đồng ý rồi.', aff: 9, reply: 'Hệ Thống của cậu biết điều ghê! ...Vậy còn cậu, đồng ý không?' },
              { text: 'Cho tôi thêm thời gian.', aff: -4, reply: 'Ừ... tôi chờ được. Tôi giỏi chờ lắm.' }
            ] }
        ]
      },
      {
        name: 'Khương Trầm', gender: 'm', portrait: 'sl_port2', role: 'Thợ săn hạng A trầm lặng',
        personality: 'Ít lời, mặt lạnh như đá, nhưng luôn để ý từng vết thương nhỏ của đồng đội.',
        likes: ['food', 'water', 'medkit'],
        meet: [
          { who: 'npc', text: '...Cảm ơn.' },
          { who: 'hero', text: 'Chỉ vậy thôi à?' },
          { who: 'npc', text: 'Khương Trầm. Hạng A. Tôi không giỏi nói. Nhưng cậu cần người đỡ đòn, tôi đỡ được.' },
          { who: 'sys', text: '[HỆ THỐNG] Khương Trầm đã gia nhập tổ đội. Hiệu ứng: Thu hút sự chú ý của quái vật.' }
        ],
        banter: [
          '...',
          'Cậu bị thương ở tay trái. Băng lại đi.',
          'Ăn chưa? Tôi có cơm nắm.',
          'Đừng đi trước. Để tôi.',
          'Đội quân bóng tối của cậu ồn ào thật. Con kiến kia cứ nhìn tôi chằm chằm.',
          'Tôi không ghét nói chuyện. Chỉ là không biết nói gì.',
          'Trời sắp mưa. Mang áo khoác chưa?',
          'Cậu ngủ ít quá. Đêm nay tôi gác.',
          'Trước đây tôi nấu ăn cho cả đội. Giờ nấu cho cậu. Cũng được.',
          'Đi với cậu... không tệ.'
        ],
        combat: ['Sau lưng tôi!', 'Chặn rồi, đánh đi!', 'Tôi giữ hàng!', 'Lên!', 'Không qua được tôi đâu!', 'Dồn vào trùm!'],
        hurt: ['...Không sao.', 'Chỉ là xước.', 'Còn đứng được.'],
        gift: ['...Cảm ơn.', 'Tôi sẽ dùng nó. Cảm ơn cậu.', 'Lâu rồi mới có người tặng tôi thứ gì. ...Cảm ơn.'],
        stages: [
          { at: 20, title: 'Bát canh nóng',
            lines: [
              { who: 'sys', text: 'Đêm trong Cổng, Khương Trầm lặng lẽ nhóm lửa, nấu một nồi canh từ chỗ nguyên liệu mang theo.' },
              { who: 'npc', text: 'Ăn đi.' },
              { who: 'hero', text: 'Ngon quá! Anh học nấu ở đâu vậy?' },
              { who: 'npc', text: 'Trước đây tôi là người nấu ăn cho cả tổ đội. Năm người. Ai cũng kén ăn.' },
              { who: 'npc', text: 'Lâu rồi không nấu cho ai. Tay hơi run. Mặn không?' }
            ],
            choices: [
              { text: 'Vừa lắm. Mai nấu nữa nhé.', aff: 9, reply: '...Ừ. Mai nấu món khác.' },
              { text: 'Họ chắc hạnh phúc lắm khi có anh.', aff: 7, reply: 'Hạnh phúc à... Có lẽ. Hồi đó tôi chưa nghĩ đến.' },
              { text: 'Hơi mặn thật.', aff: -2, reply: '...Lần sau bớt muối.' }
            ] },
          { at: 40, title: 'Chiếc đồng hồ dừng',
            lines: [
              { who: 'sys', text: 'Khương Trầm luôn đeo một chiếc đồng hồ vỡ mặt kính, kim dừng ở ba giờ mười bảy phút.' },
              { who: 'npc', text: 'Năm năm trước, Cổng vỡ. Tổ đội tôi bị kẹt. Đội trưởng ra lệnh tôi chạy về gọi cứu viện.' },
              { who: 'npc', text: 'Tôi chạy. Ba mươi phút. Khi quay lại, chỉ còn chiếc đồng hồ này.' },
              { who: 'npc', text: 'Ba giờ mười bảy. Đúng lúc tôi rời đi. Tôi không sửa nó.' },
              { who: 'npc', text: 'Đáng lẽ tôi nên ở lại. Chết cùng họ.' }
            ],
            choices: [
              { text: 'Anh làm đúng lệnh. Họ muốn anh sống.', aff: 9, reply: 'Tôi biết. Đội trưởng cố ý. Tôi là người trẻ nhất đội.' },
              { text: 'Nếu anh ở lại, hôm nay tôi đã không gặp được anh.', aff: 10, reply: '...Cậu nói vậy. Tôi chưa từng nghĩ theo cách đó.' },
              { text: 'Chuyện qua rồi, anh nên vứt nó đi.', aff: -4, reply: 'Không. Đây là thứ duy nhất còn lại.' }
            ] },
          { at: 60, title: 'Một mình vào Cổng',
            lines: [
              { who: 'sys', text: '{hero} phát hiện Khương Trầm lén vào Cổng hạng A một mình, ba lần trong tuần.' },
              { who: 'hero', text: 'Anh muốn chết sao?!' },
              { who: 'npc', text: '...Không hẳn. Chỉ là nếu chết, cũng chẳng ai buồn.' },
              { who: 'npc', text: 'Năm năm nay tôi sống như kẻ mượn thời gian của người khác.' },
              { who: 'npc', text: 'Mỗi lần vào Cổng một mình, tôi thấy như đang trả nợ.' }
            ],
            choices: [
              { text: 'Tôi sẽ buồn. Rất buồn. Anh không được đi một mình nữa.', aff: 10, reply: '...Cậu sẽ buồn sao. Vậy... tôi không đi nữa. Hứa.' },
              { text: 'Từ giờ, Cổng nào anh vào, tôi vào cùng.', aff: 9, reply: 'Cứng đầu thật. ...Được. Hai người.' },
              { text: 'Đó là mạng của anh, tuỳ anh.', aff: -5, reply: '...Ừ. Tuỳ tôi.' }
            ] },
          { at: 80, title: 'Lưng tựa lưng',
            lines: [
              { who: 'sys', text: 'Bị quái vật bao vây tứ phía. {hero} và Khương Trầm đứng lưng tựa lưng.' },
              { who: 'npc', text: '{hero}. Nhìn này.' },
              { who: 'sys', text: 'Anh giơ cổ tay lên. Chiếc đồng hồ đã được thay mặt kính. Kim giây đang chạy.' },
              { who: 'npc', text: 'Tôi sửa nó rồi. Tối qua.' },
              { who: 'npc', text: 'Năm năm, thời gian của tôi đứng yên. Rồi cậu đến. Nó lại chạy.' },
              { who: 'npc', text: 'Lần này, dù thế nào tôi cũng không chạy đi. Tôi ở lại cạnh cậu.' }
            ],
            choices: [
              { text: 'Vậy cùng đánh. Rồi cùng về.', aff: 10, reply: 'Cùng về. ...Ừ. Lần này tất cả đều về.' },
              { text: 'Đồng hồ chạy rồi, anh phải sống để xem nó chạy tiếp.', aff: 9, reply: 'Xem nó chạy cùng cậu. Được.' },
              { text: 'Tập trung đánh đi đã!', aff: 3, reply: '...Đúng. Nói sau.' }
            ] },
          { at: 100, title: 'Ba giờ mười bảy phút',
            lines: [
              { who: 'sys', text: 'Đêm trước trận cuối. Khương Trầm hẹn {hero} lên sân thượng. Đồng hồ chỉ gần ba giờ sáng.' },
              { who: 'npc', text: 'Chờ chút. Sắp đến rồi.' },
              { who: 'sys', text: 'Kim phút nhích dần. Ba giờ mười bảy.' },
              { who: 'npc', text: 'Năm năm nay, đây là giờ tôi ghét nhất. Giờ tôi mất tất cả.' },
              { who: 'npc', text: 'Tôi muốn đổi nó. Thành giờ tôi nói với cậu điều này.' },
              { who: 'npc', text: 'Tôi yêu cậu, {hero}. Tôi không giỏi nói. Nhưng câu này, tôi đã tập rất lâu.' }
            ],
            choices: [
              { text: 'Tôi cũng yêu anh. Từ giờ, ba giờ mười bảy là giờ của chúng ta.', aff: 10, reply: 'Giờ của chúng ta... Ừ. Tôi bắt đầu thích nó rồi.' },
              { text: 'Nói thêm lần nữa đi. Anh nói hay lắm.', aff: 9, reply: '...Tôi yêu cậu. Đủ chưa? Mặt tôi nóng lắm rồi.' },
              { text: 'Cho tôi thời gian nhé.', aff: -4, reply: 'Ừ. Đồng hồ chạy rồi. Tôi có thời gian để chờ.' }
            ] }
        ]
      }
    ],
    civilians: {
      help: ['Cứu với! Quái vật từ Cổng tràn ra rồi!', 'Có thợ săn nào không?! Làm ơn!', 'Con tôi vẫn còn trong toà nhà!', 'Chân tôi bị kẹt! Đừng bỏ tôi lại!', 'Cổng vỡ rồi! Ai đó gọi Hiệp Hội đi!', 'Tôi không có năng lực! Xin hãy giúp tôi!'],
      thanks: ['Cảm ơn thợ săn! Đây là lõi ma thạch tôi nhặt được.', 'Cậu là thợ săn hạng mấy vậy? Mạnh quá!', 'Tôi sẽ viết thư cảm ơn gửi Hiệp Hội!', 'Cầm lấy bình hồi phục này. Tôi mua dự phòng.', 'Hạng E? Không thể nào! Cảm ơn cậu nhiều lắm!', 'Cảm ơn! Tôi sẽ kể cho cả khu phố nghe về cậu.']
    },
    events: [
      '[HỆ THỐNG] Cảnh báo: Phát hiện Cổng mới mở gần đây.',
      'Bầu trời nứt ra một vệt sáng tím. Một Cổng khác đang hình thành.',
      '[HỆ THỐNG] Nhiệm vụ hằng ngày đã cập nhật. Đừng quên chạy bộ mười cây số.',
      'Còi báo động Cổng vang khắp thành phố.',
      'Bản tin: "Một thợ săn hạng S vừa chinh phục Cổng hạng A chỉ trong ba phút."',
      'Mặt đất rung lên. Đâu đó, một Cổng vừa bị phá vỡ.',
      'Đội quân bóng tối xôn xao. Chúng cảm nhận được kẻ mạnh đang đến gần.',
      '[HỆ THỐNG] Phát hiện ma lực bất thường. Cấp độ: Không xác định.'
    ],
    bossTaunts: ['Kẻ yếu không có quyền sống.', 'Ngươi chỉ là thợ săn hạng E thôi.', 'Bóng tối của ngươi chẳng là gì trước ta!', 'Quỳ xuống trước kẻ mạnh!', 'Ta sẽ nuốt chửng cả thành phố này!'],
    deathLines: ['[HỆ THỐNG] Người Chơi đã tử vong. Đang chờ hồi sinh...', 'Bóng tối nuốt lấy bạn. Nhưng bóng tối cũng là sức mạnh của bạn.', '[HỆ THỐNG] Ngươi có muốn đứng dậy không? Có / Có']
  }
};
