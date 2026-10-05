// Friendship tracks, portrait expressions and merchants (overlay on LORE)
// Nạp sau lore.js. Đồng hành cùng giới với nhân vật chính đi theo tuyến `bond`
// (huynh đệ / tỷ muội), khác giới đi theo tuyến `stages` (tình cảm).
const LORE_BOND = {
  // =====================================================================
  // TẬN THẾ
  // =====================================================================
  md: [
    {
      // ---------------- Hạ Vy (nữ) — chị em ----------------
      bondTitle: 'Chị Em Chí Cốt',
      bondDone: '{name} và {hero} đã thành chị em chí cốt. (Tri kỷ sẽ hồi sinh bạn 1 lần mỗi ngày)',
      bond: [
        { at: 20, title: 'Bím tóc trước ca đêm',
          lines: [
            { who: 'sys', e: 'normal', text: 'Hạ Vy ngồi sau lưng {hero}, gỡ từng lọn tóc rối bết bùn đất.' },
            { who: 'npc', e: 'happy', text: 'Ngồi yên nào. Tóc dài thế này mà để xoã, xác sống túm một cái là xong đời.' },
            { who: 'hero', e: 'normal', text: 'Cậu tết tóc khéo thật đấy.' },
            { who: 'npc', e: 'happy', text: 'Hồi ở viện, phòng trực có bốn đứa con gái. Trước ca đêm tụi tôi tết tóc cho nhau, vừa tết vừa kể xấu trưởng khoa.' },
            { who: 'npc', e: 'sad', text: 'Đêm đầu tiên ấy... chỉ mình tôi chạy ra được. Lâu lắm rồi tôi mới lại được chạm vào tóc ai đó.' },
            { who: 'npc', e: 'happy', text: 'Xong! Đẹp chưa? Giờ cậu trông như sắp đi thi chứ không phải đi săn xác sống.' }
          ],
          choices: [
            { text: 'Mai tôi tết lại cho cậu nhé. Đổi phiên.', aff: 8, e: 'happy', reply: 'Cậu biết tết á? ...Được, nhưng giật tóc tôi là tôi mách mẹ đấy.' },
            { text: 'Kể tôi nghe về ba người bạn ấy đi.', aff: 7, e: 'sad', reply: 'Con Thư mê trà sữa, chị Hằng hay ngủ gật, bé Nhi sợ ma. ...Kể ra cứ như họ vẫn ở đây.' },
            { text: 'Tết tóc làm gì, cắt phăng đi cho gọn.', aff: -3, e: 'sad', reply: 'Cắt thì dễ. Nhưng có những thứ mình giữ lại để còn thấy mình là người.' }
          ] },
        { at: 40, title: 'Cuốn sổ ghi tên',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đêm mất điện. Hạ Vy soi đèn pin vào một cuốn sổ nhỏ, bìa sờn vì nước mưa.' },
            { who: 'npc', e: 'sad', text: 'Sổ ghi ca trực của tôi. Giờ thì... nó thành sổ ghi tên những người tôi không cứu được.' },
            { who: 'npc', e: 'sad', text: 'Ông cụ phòng 302. Cô bé bán vé số. Thằng nhóc bảy tuổi tôi tuột tay đêm đầu... Tôi không muốn quên ai cả.' },
            { who: 'hero', e: 'normal', text: 'Tôi cũng có một người như thế. Tôi đã hứa sẽ quay về đón, nhưng đến nơi chỉ còn căn nhà trống.' },
            { who: 'npc', e: 'surprised', text: 'Vậy mà sáng nào cậu cũng cười với tôi. Cậu giỏi giấu hơn tôi nhiều.' },
            { who: 'npc', e: 'normal', text: 'Cho tôi tên người đó đi. Mình ghi chung một trang. Hai đứa cùng nhớ thì đỡ nặng hơn.' }
          ],
          choices: [
            { text: 'Ừ. Cậu viết giúp nhé, chữ tôi xấu lắm.', aff: 8, e: 'happy', reply: 'Chữ bác sĩ còn xấu hơn, tôi đọc quen rồi. ...Cảm ơn vì đã kể với tôi.' },
            { text: 'Từ giờ, mỗi người mình cứu được, ghi vào trang sau.', aff: 10, e: 'happy', reply: 'Trang sau cho người sống... Hay thật. Hay hơn mọi thứ tôi nghĩ ra suốt mấy tuần nay.' },
            { text: 'Ghi mấy thứ đó chỉ tổ buồn thêm.', aff: -3, e: 'sad', reply: 'Có thể. Nhưng tôi thà buồn còn hơn quên.' }
          ] },
        { at: 60, title: 'Vỉ thuốc hạ sốt',
          lines: [
            { who: 'sys', e: 'normal', text: '{hero} sốt cao sau khi rơi xuống cống ngập. Nửa đêm tỉnh dậy, Hạ Vy đã không còn bên cạnh.' },
            { who: 'sys', e: 'normal', text: 'Tiếng hét vọng lại từ hiệu thuốc cuối phố. {hero} vớ cây gậy, lảo đảo lao tới, kéo Hạ Vy ra khỏi vòng vây xác sống.' },
            { who: 'npc', e: 'angry', text: 'Cậu điên à?! Đang sốt bốn mươi độ mà chạy ra đây?!' },
            { who: 'hero', e: 'normal', text: 'Câu đó tôi hỏi cậu mới đúng. Một mình vào ổ xác sống chỉ vì một vỉ thuốc?' },
            { who: 'npc', e: 'sad', text: 'Vì vỉ thuốc đó là cho cậu! Tôi không muốn ngồi nhìn thêm một người không hạ sốt nổi nữa...' },
            { who: 'npc', e: 'happy', text: 'Thôi được rồi. Cậu cứu tôi, tôi cứu cậu. Huề. Giờ uống thuốc rồi về nằm ngay cho tôi!' }
          ],
          choices: [
            { text: 'Lần sau đi đâu cũng phải gọi tôi dậy. Hứa đi.', aff: 10, e: 'happy', reply: 'Hứa. Ngoéo tay luôn. Hồi nhỏ hứa kiểu này là không đứa nào dám nuốt lời.' },
            { text: 'Nhân viên cấp cứu gì mà dữ như bà chằn.', aff: 6, e: 'angry', reply: 'Bà chằn này vừa cứu cái mạng của cậu đấy. Nằm xuống!' },
            { text: 'Cậu làm vậy chỉ thêm vướng tay tôi.', aff: -4, e: 'angry', reply: '...Vướng tay à. Được, lần sau tôi để cậu tự sốt một mình.' }
          ] },
        { at: 80, title: 'Đứng cùng một phía',
          lines: [
            { who: 'sys', e: 'normal', text: 'Ở khu trú ẩn, đám đông vây quanh một bà cụ đang sốt. Có kẻ hét: "Tống bà ta ra ngoài trước khi biến đổi!"' },
            { who: 'npc', e: 'angry', text: 'Bà ấy sốt vì viêm phổi, không phải vì bị cắn! Tôi là nhân viên cấp cứu, tôi biết!' },
            { who: 'sys', e: 'normal', text: 'Không ai nghe. Một gã giơ xà beng lên. {hero} bước tới, đứng sát vai Hạ Vy.' },
            { who: 'hero', e: 'normal', text: 'Muốn động vào bà cụ thì bước qua hai đứa tôi trước.' },
            { who: 'npc', e: 'surprised', text: 'Cậu... không cần dính vào đâu. Họ sẽ ghét lây cả cậu đấy.' },
            { who: 'npc', e: 'happy', text: '...Nhưng mà có cậu đứng cạnh, chân tôi hết run rồi. Lạ thật.' }
          ],
          choices: [
            { text: 'Cậu đứng đâu, tôi đứng đó. Đơn giản vậy thôi.', aff: 10, e: 'happy', reply: 'Nói cứ như phim ấy. ...Nhưng tôi thích. Nhớ lấy câu đó đấy.' },
            { text: 'Tôi lo đám đông, cậu lo bệnh nhân.', aff: 8, e: 'happy', reply: 'Phân công rõ ràng ghê. Cậu ra dáng chị cả rồi đấy.' },
            { text: 'Lần sau đừng gây chuyện với cả khu như thế.', aff: -4, e: 'angry', reply: 'Im lặng nhìn người ta chết thì tôi còn mặc áo cấp cứu làm gì?' }
          ] },
        { at: 100, title: 'Hai lon nước ngọt',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đêm trước trận quyết chiến. Hạ Vy khui hai lon nước ngọt hết hạn, dúi một lon vào tay {hero}.' },
            { who: 'npc', e: 'happy', text: 'Ở quê tôi, người ta kết nghĩa bằng rượu. Mình không có rượu, dùng tạm cái này. Ngọt hơn.' },
            { who: 'npc', e: 'sad', text: 'Một đêm, tôi mất cả phòng trực, mất ba đứa bạn thân. Tôi tưởng sẽ chẳng bao giờ còn cảm giác có chị có em nữa.' },
            { who: 'npc', e: 'happy', text: 'Rồi cậu tới. Cãi nhau với tôi, đứng chắn cho tôi, sốt bốn mươi độ vẫn chạy đi tìm tôi.' },
            { who: 'npc', e: 'happy', text: 'Từ nay có miếng ăn chia đôi, có vết thương tôi băng, đứa nào bắt nạt cậu phải qua tôi trước. Chị em mình, đến chết cũng không bỏ nhau. Chịu không?' },
            { who: 'sys', e: 'happy', text: 'Hai lon nước khẽ chạm nhau. Hạ Vy giở trang đầu cuốn sổ, nắn nót ghi một dòng mới: "Người nhà."' }
          ],
          choices: [
            { text: 'Chịu. Mà ai làm chị, ai làm em đây?', aff: 10, e: 'happy', reply: 'Ai băng bó giỏi hơn thì làm chị! ...Thôi được, thay phiên. Hôm nay cậu làm chị.' },
            { text: 'Cạn lon này, sống chết có nhau.', aff: 9, e: 'happy', reply: 'Cạn! Ngày mai hai chị em mình cùng về. Không đứa nào được bỏ cuộc trước.' },
            { text: 'Đợi đánh xong trận này rồi tính.', aff: -5, e: 'sad', reply: 'Ừ... vậy nhớ sống mà về. Tôi giữ phần lon của cậu.' }
          ] }
      ],
      stagesExpr: [
        ['normal', 'normal', 'happy', 'happy', 'sad'],
        ['normal', 'sad', 'sad', 'sad', 'sad', 'normal'],
        ['normal', 'normal', 'surprised', 'sad', 'normal', 'blush'],
        ['normal', 'normal', 'sad', 'normal', 'blush'],
        ['normal', 'blush', 'normal', 'blush', 'blush', 'sad']
      ],
      stagesReplyExpr: [
        ['blush', 'sad', 'sad'],
        ['sad', 'happy', 'angry'],
        ['sad', 'happy', 'angry'],
        ['happy', 'blush', 'happy'],
        ['happy', 'happy', 'sad']
      ],
      meetExpr: ['surprised', 'normal', 'happy', 'normal']
    },
    {
      // ---------------- Trần Khải (nam) — anh em ----------------
      bondTitle: 'Anh Em Chí Cốt',
      bondDone: '{name} và {hero} đã thành anh em chí cốt. (Tri kỷ sẽ hồi sinh bạn 1 lần mỗi ngày)',
      bond: [
        { at: 20, title: 'Ba mươi tư giây',
          lines: [
            { who: 'sys', e: 'normal', text: 'Trần Khải ném sang một khẩu súng đã tháo rời, kèm chiếc khăn lau dầu.' },
            { who: 'npc', e: 'normal', text: 'Tháo, lau, lắp lại. Bịt mắt. Ba mươi giây. Lính mới của tôi đứa nào cũng phải qua bài này.' },
            { who: 'sys', e: 'normal', text: 'Lần đầu, {hero} mất hai phút. Lần thứ mười, ba mươi tư giây.' },
            { who: 'npc', e: 'surprised', text: 'Ba mươi tư. Thằng Tâm trong tiểu đội tôi tập cả tuần mới được thế.' },
            { who: 'npc', e: 'sad', text: 'Nó cũng nhanh tay như cậu. Cũng hay cãi như cậu. Một trong bảy cái tên tôi đọc mỗi tối.' },
            { who: 'npc', e: 'normal', text: 'Đêm nay tôi ngủ. Cậu gác. Súng của tôi, cậu giữ.' }
          ],
          choices: [
            { text: 'Anh tin tôi đến thế à?', aff: 8, e: 'normal', reply: 'Lính chỉ giao súng cho người mình dám quay lưng lại. Ngủ đây.' },
            { text: 'Kể tôi nghe về Tâm đi.', aff: 7, e: 'sad', reply: 'Mê bóng đá, ghét rau muống, tuần nào cũng viết thư cho mẹ. ...Mai kể tiếp.' },
            { text: 'Ba mươi tư giây thì sao, xác sống đâu có chờ.', aff: -3, e: 'angry', reply: 'Đúng. Nên mới phải tập. Tập lại.' }
          ] },
        { at: 40, title: 'Hai phía hàng rào',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đi ngang hàng rào phong toả cũ, {hero} dừng lại, tay bấu chặt song sắt.' },
            { who: 'hero', e: 'normal', text: 'Đêm thứ hai, tôi đứng đúng phía bên này. Em trai tôi ở bên kia. Lính không cho ai qua.' },
            { who: 'npc', e: 'surprised', text: '...Đêm thứ hai.' },
            { who: 'npc', e: 'sad', text: 'Tôi là người cầm khoá một cánh cổng như thế. Không phải cổng này. Nhưng cũng chẳng khác gì.' },
            { who: 'npc', e: 'sad', text: 'Cậu muốn đánh tôi thì cứ đánh. Tôi đứng yên.' },
            { who: 'sys', e: 'sad', text: 'Rất lâu sau, {hero} buông song sắt, ngồi xuống bên cạnh anh. Không ai nói gì.' }
          ],
          choices: [
            { text: 'Tôi từng hận những người lính đó. Giờ tôi biết họ cũng chưa ngủ yên đêm nào.', aff: 10, e: 'sad', reply: 'Chưa đêm nào. ...Cảm ơn vì đã không đánh. Như thế còn khó chịu hơn.' },
            { text: 'Anh đi sau cùng để chuộc lỗi, đúng không? Vậy tôi đi cùng anh.', aff: 8, e: 'normal', reply: 'Lỗi của ai người nấy mang. ...Nhưng có người đi cạnh thì đường bớt dài.' },
            { text: 'Lính các anh đúng là chỉ biết làm theo lệnh.', aff: -4, e: 'sad', reply: 'Phải. Và tôi sẽ mang câu đó theo đến chết.' }
          ] },
        { at: 60, title: 'Lần này, cổng mở',
          lines: [
            { who: 'sys', e: 'normal', text: 'Cửa cuốn kho hàng sập xuống, nhốt {hero} bên trong cùng bầy xác sống. Bên ngoài, Trần Khải đứng chết lặng trước ổ khoá.' },
            { who: 'npc', e: 'surprised', text: 'Lại là cánh cổng... lại có người ở bên kia...' },
            { who: 'hero', e: 'normal', text: 'Khải! Tôi không phải cánh cổng năm đó! Mở ra!' },
            { who: 'sys', e: 'normal', text: 'Một phát đạn phá khoá. Trần Khải lao vào kéo {hero} ra, rồi chính anh bị một con lôi ngã. {hero} quay lại, chém phăng nó.' },
            { who: 'npc', e: 'happy', text: 'Tôi kéo cậu ra. Cậu kéo tôi lên. Huề.' },
            { who: 'npc', e: 'happy', text: 'Tay tôi vẫn run. Nhưng lần này, nó run khi cửa đã mở.' }
          ],
          choices: [
            { text: 'Run cũng được. Anh vẫn bóp cò đúng lúc.', aff: 9, e: 'happy', reply: 'Vì nghe tiếng cậu gào. Lần sau cứ gào to thế.' },
            { text: 'Từ giờ anh không phải đứng trước cánh cổng nào một mình nữa.', aff: 10, e: 'normal', reply: '...Nghe như lời thề. Tôi ghi nhớ.' },
            { text: 'Anh đứng đơ ra đó suýt giết cả hai.', aff: -5, e: 'sad', reply: 'Biết. Tôi biết rõ hơn ai hết.' }
          ] },
        { at: 80, title: 'Hai người đi sau cùng',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đoàn người sống sót rút khỏi khu trú ẩn đang cháy. Như mọi lần, Trần Khải lùi về cuối hàng.' },
            { who: 'sys', e: 'normal', text: 'Lần này, {hero} cũng lùi lại, đứng ngay cạnh anh.' },
            { who: 'npc', e: 'normal', text: 'Lên trước đi. Chỗ này là của tôi.' },
            { who: 'hero', e: 'normal', text: 'Sau lưng anh trống quá. Tôi lấp vào.' },
            { who: 'npc', e: 'sad', text: 'Tiểu đội tôi từng có một câu: "Không ai bị bỏ lại. Không ai đi sau một mình." Từ đêm đó, tôi quên mất vế sau.' },
            { who: 'npc', e: 'happy', text: '...Được. Bên trái của cậu. Bên phải của tôi.' },
            { who: 'sys', e: 'normal', text: 'Trên đường đi, anh lặng lẽ nhét vào túi {hero} một tấm thẻ bài khắc vội. Mặt trước là tên {hero}, mặt sau hai chữ: "Đồng đội".' }
          ],
          choices: [
            { text: 'Bên trái giao cho tôi. Anh yên tâm.', aff: 9, e: 'happy', reply: 'Tôi chưa từng yên tâm khi quay lưng với ai. Với cậu thì có.' },
            { text: 'Tấm thẻ này, tôi đeo cạnh tim.', aff: 8, e: 'normal', reply: 'Đeo cho kỹ. Đừng để tôi phải đọc nó lúc điểm danh.' },
            { text: 'Đi sau cùng nguy hiểm lắm, để người khác lo.', aff: -4, e: 'angry', reply: 'Người khác là ai? Đẩy việc khó cho người khác là thứ tôi ghét nhất.' }
          ] },
        { at: 100, title: 'Điểm danh',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đêm trước trận cuối. Trần Khải đọc tên bảy đồng đội, như mọi tối. Đến cuối, anh dừng lại.' },
            { who: 'npc', e: 'normal', text: '...Và {hero}. Có mặt.' },
            { who: 'npc', e: 'normal', text: 'Lính bọn tôi không thề thốt nhiều. Chỉ một kiểu thôi: ăn chung một hộp cơm, uống chung một bi đông. Từ đó là anh em.' },
            { who: 'sys', e: 'normal', text: 'Anh khui hộp đồ hộp quân dụng cuối cùng, chia làm đôi, đẩy sang phía {hero}.' },
            { who: 'npc', e: 'sad', text: 'Mất bảy thằng em rồi. Tưởng cả đời không dám nhận thêm đứa nào nữa. Sợ lại phải khắc tên.' },
            { who: 'npc', e: 'happy', text: 'Nhưng cậu khác. Từ nay không gọi "cậu" nữa. Gọi là em. Anh em mình sống cùng về. Còn chết... thì anh đi trước.' }
          ],
          choices: [
            { text: 'Không ai đi trước cả. Anh em mình cùng về, anh hai.', aff: 10, e: 'happy', reply: 'Anh hai... Được. Lệnh đầu tiên của anh hai: ăn hết phần đó. Không được chừa.' },
            { text: 'Chung hộp cơm này, sống chết có nhau.', aff: 9, e: 'happy', reply: 'Sống chết có nhau. Bảy thằng kia mà nghe được, chắc đang cười anh mềm yếu.' },
            { text: 'Nghe sến quá, trung sĩ.', aff: -4, e: 'angry', reply: 'Im. Không ăn thì anh ăn một mình.' }
          ] }
      ],
      stagesExpr: [
        ['normal', 'normal', 'sad', 'sad', 'blush'],
        ['normal', 'sad', 'sad', 'sad', 'sad'],
        ['normal', 'surprised', 'normal', 'normal', 'sad', 'happy'],
        ['normal', 'normal', 'normal', 'blush', 'normal'],
        ['normal', 'normal', 'normal', 'blush', 'blush', 'happy']
      ],
      stagesReplyExpr: [
        ['happy', 'happy', 'sad'],
        ['happy', 'normal', 'sad'],
        ['blush', 'happy', 'sad'],
        ['happy', 'happy', 'blush'],
        ['happy', 'happy', 'sad']
      ],
      meetExpr: ['normal', 'normal', 'normal', 'normal']
    }
  ],

  // =====================================================================
  // TU TIÊN
  // =====================================================================
  tt: [
    {
      // ---------------- Nguyệt Thanh Hàn (nữ) — tỷ muội ----------------
      bondTitle: 'Tỷ Muội Tình Thâm',
      bondDone: '{name} và {hero} đã kết nghĩa tỷ muội. (Tri kỷ sẽ hồi sinh bạn 1 lần mỗi ngày)',
      bond: [
        { at: 20, title: 'Chiếc trâm ba đồng bạc',
          lines: [
            { who: 'sys', e: 'normal', text: 'Ở phường thị, Nguyệt Thanh Hàn đặt một gốc linh thảo ngàn năm lên quầy, đòi đổi lấy một chiếc trâm gỗ.' },
            { who: 'npc', e: 'surprised', text: 'Bấy nhiêu chưa đủ sao? Vậy ta thêm một viên Ngưng Băng Đan.' },
            { who: 'hero', e: 'normal', text: 'Tiền bối! Chiếc trâm này chỉ đáng ba đồng bạc thôi. Để ta trả.' },
            { who: 'npc', e: 'surprised', text: 'Ba đồng... Ba nghìn năm trước, một gốc linh thảo đổi được cả một toà thành.' },
            { who: 'sys', e: 'normal', text: 'Nàng cầm chiếc trâm, cài thử lên mái tóc bạc, ngắm nghía một hồi, rồi lặng lẽ cài sang tóc {hero}.' },
            { who: 'npc', e: 'blush', text: 'Hợp với ngươi hơn. Ngày trước ta cũng hay cài trâm cho đồ đệ nhỏ. ...Đừng cười. Ta biết mình ngốc chuyện đời thường.' }
          ],
          choices: [
            { text: 'Không ngốc đâu. Chuyện đời thường ta dạy tiền bối, chuyện tu luyện tiền bối dạy ta.', aff: 9, e: 'happy', reply: 'Đổi công? ...Được. Ba nghìn năm ta chưa làm học trò của ai. Nghe cũng thú vị.' },
            { text: 'Đồ đệ nhỏ của tiền bối chắc đáng yêu lắm.', aff: 7, e: 'sad', reply: 'Nó tên Tiểu Lục. Hay cười, hay lẩm bẩm một mình. Một ngày nào đó ta sẽ kể ngươi nghe.' },
            { text: 'Tiên nhân gì mà đến tiền cũng không biết tiêu.', aff: -3, e: 'angry', reply: '...Ba nghìn năm trước không cần tiêu. Ngươi khỏi nhắc mãi thế.' }
          ] },
        { at: 40, title: 'Hai nén hương',
          lines: [
            { who: 'sys', e: 'normal', text: 'Trên sườn núi hoang, Thanh Hàn quỳ trước một nấm mộ cổ. Bia đá đã mòn gần hết chữ.' },
            { who: 'npc', e: 'sad', text: 'Tiểu Lục. Đồ đệ duy nhất của ta. Ba nghìn năm trước, ta tự phong ấn mình cùng huyết kiếp. Con bé hứa sẽ chờ.' },
            { who: 'npc', e: 'sad', text: 'Dòng cuối trên bia: "Sư phụ, hôm nay con vẫn chờ." Nó chờ đến lúc tóc bạc. Còn ta thì ngủ.' },
            { who: 'hero', e: 'normal', text: 'Ta cũng từng có một sư tỷ. Đêm mưa máu, tỷ ấy đẩy ta vào hang, rồi không bao giờ bước ra nữa.' },
            { who: 'npc', e: 'surprised', text: 'Vậy ra ngươi cũng biết cảm giác người mình thương ở lại phía sau.' },
            { who: 'npc', e: 'normal', text: 'Vô Tình Đạo dạy ta không được đau. Nhưng đứng đây, cạnh một người cũng đau như ta... lại thấy dễ thở hơn.' }
          ],
          choices: [
            { text: 'Để ta cùng tiền bối thắp hương. Một nén cho Tiểu Lục, một nén cho sư tỷ ta.', aff: 10, e: 'happy', reply: 'Ừ. Hai nén hương, hai người chờ. Tiểu Lục, sư phụ có bạn đồng hành rồi. Con yên lòng nhé.' },
            { text: 'Tiểu Lục chờ vì thương người. Đó không phải lỗi của người.', aff: 8, e: 'sad', reply: 'Ngươi nói giống hệt con bé. Nó cũng hay bảo: "Sư phụ đừng tự trách."' },
            { text: 'Ba nghìn năm rồi, khóc cũng chẳng ai sống lại.', aff: -4, e: 'sad', reply: 'Ta biết. Ta chỉ không biết phải làm gì khác.' }
          ] },
        { at: 60, title: 'Băng tâm rạn vỡ',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đang tĩnh toạ, Thanh Hàn phun ra một ngụm máu. Hàn khí mất kiểm soát, đóng băng cả sơn động.' },
            { who: 'npc', e: 'angry', text: 'Lui ra! Đạo tâm ta đang vỡ... Hàn khí này sẽ đông cứng cả kinh mạch ngươi!' },
            { who: 'sys', e: 'normal', text: '{hero} không lui. Ngồi xuống sau lưng nàng, áp hai tay lên lưng, dồn từng chút linh lực ít ỏi vào.' },
            { who: 'sys', e: 'normal', text: 'Khi hàn khí lắng xuống, môi {hero} đã tím ngắt. Thanh Hàn quay lại, kéo áo choàng trùm lên {hero}, dùng chân hoả bản mệnh sưởi ấm suốt đêm.' },
            { who: 'npc', e: 'angry', text: 'Đồ ngốc. Tu vi Trúc Cơ mà dám chia linh lực cho tiên nhân đang tẩu hoả. Suýt nữa ngươi thành tượng băng rồi.' },
            { who: 'npc', e: 'sad', text: 'Vô Tình Đạo bảo ta không được vướng bận. Vậy mà đêm nay, ta sợ mất ngươi hơn sợ mất đạo.' }
          ],
          choices: [
            { text: 'Đạo nào bắt người ta bỏ mặc bạn mình, ta không tu.', aff: 10, e: 'surprised', reply: 'Ngươi dám giảng đạo cho tiên nhân? ...Nhưng có lẽ ngươi đúng hơn cả ba nghìn năm điển tịch.' },
            { text: 'Tiền bối cứu ta, ta cứu tiền bối. Huề nhé.', aff: 8, e: 'happy', reply: 'Huề? Ngươi tính toán còn kém hơn ta chuyện tiền bạc. Ta nợ ngươi nhiều hơn.' },
            { text: 'Lần sau tiền bối tự lo đi, ta suýt chết đấy.', aff: -5, e: 'sad', reply: '...Ngươi nói phải. Ta không nên làm liên luỵ ngươi.' }
          ] },
        { at: 80, title: 'Trước mặt chư trưởng lão',
          lines: [
            { who: 'sys', e: 'normal', text: 'Trưởng lão Liên Minh Chính Đạo chặn đường, kiếm chỉ thẳng vào Thanh Hàn: "Phong ấn nứt vì ả tỉnh dậy! Phong ấn ả lại, huyết kiếp sẽ dừng!"' },
            { who: 'npc', e: 'sad', text: 'Có lẽ họ nói đúng. Ba nghìn năm trước ta đã ngủ một lần vì thiên hạ. Ngủ thêm lần nữa cũng được.' },
            { who: 'hero', e: 'normal', text: 'Không được. Muốn phong ấn người thì phong ấn ta trước.' },
            { who: 'sys', e: 'normal', text: '{hero} rút kiếm, đứng chắn trước Thanh Hàn. Tay run, nhưng không lùi nửa bước.' },
            { who: 'npc', e: 'surprised', text: 'Ngươi... một kẻ Trúc Cơ dám đứng trước mười vị Nguyên Anh?' },
            { who: 'sys', e: 'happy', text: 'Thanh Hàn khẽ cười, bước lên ngang vai {hero}. Giữa mùa hạ, tuyết rơi trắng xoá cả sơn cốc.' },
            { who: 'npc', e: 'happy', text: 'Ba nghìn năm trước, ta đứng một mình. Lần này, ta có người đứng cạnh. Chư vị, mời.' }
          ],
          choices: [
            { text: 'Tiền bối đánh bên trái, ta đánh bên phải.', aff: 9, e: 'happy', reply: 'Bên phải toàn Nguyên Anh hậu kỳ đấy. ...Thôi được, ta để mắt đến ngươi.' },
            { text: 'Thiên hạ cần người, nhưng ta cũng cần người.', aff: 10, e: 'surprised', reply: 'Lần đầu có người nói cần ta, mà không phải vì ta trấn được huyết kiếp.' },
            { text: 'Hay tiền bối cứ để họ phong ấn, cho yên chuyện.', aff: -5, e: 'sad', reply: '...Ngươi cũng nghĩ vậy sao. Ta đã tưởng ít nhất ngươi sẽ khác.' }
          ] },
        { at: 100, title: 'Kết nghĩa dưới trăng',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đêm trước trận cuối. Trước mộ Tiểu Lục, Thanh Hàn cắm ba nén hương, rót hai chén rượu, kéo {hero} quỳ xuống cạnh mình.' },
            { who: 'npc', e: 'sad', text: 'Ba nghìn năm trước, ta có một đồ đệ chờ ta đến bạc đầu. Ta đã không giữ được lời hứa với nó.' },
            { who: 'npc', e: 'normal', text: 'Lần này, ta không nhận đồ đệ. Ta muốn có một muội muội. Người đi cùng ta, chứ không phải chờ ta.' },
            { who: 'npc', e: 'normal', text: 'Hoàng thiên hậu thổ chứng giám: Nguyệt Thanh Hàn và {hero} hôm nay kết làm tỷ muội. Có phúc cùng hưởng, có hoạ cùng chịu. Ai phụ nghĩa này, trời đất không dung.' },
            { who: 'npc', e: 'blush', text: 'Còn nữa. Từ nay đừng gọi ta là tiền bối. Nghe già lắm. Gọi... tỷ tỷ.' },
            { who: 'sys', e: 'happy', text: 'Một làn gió thoảng qua. Ba nén hương cháy đều, như có ai đó đang mỉm cười.' }
          ],
          choices: [
            { text: 'Tỷ tỷ. Muội sẽ không bắt tỷ chờ, cũng không để tỷ đi một mình.', aff: 10, e: 'happy', reply: 'Gọi thêm lần nữa đi. ...Ba nghìn năm rồi, mới có một tiếng gọi khiến ta nghe mãi không chán.' },
            { text: 'Cạn chén này. Tỷ muội đồng tâm, sinh tử không rời.', aff: 9, e: 'happy', reply: 'Cạn. Tiểu Lục, con thấy chưa? Sư phụ có muội muội rồi. Sẽ không cô đơn nữa.' },
            { text: 'Đợi qua trận này rồi hãy bái, được không?', aff: -4, e: 'sad', reply: '...Được. Hương cứ cháy, rượu cứ rót. Ta chờ. Nhưng lần này, ngươi phải trở về.' }
          ] }
      ],
      stagesExpr: [
        ['normal', 'surprised', 'normal', 'normal', 'normal', 'happy'],
        ['normal', 'sad', 'sad', 'sad', 'sad'],
        ['normal', 'surprised', 'blush', 'sad', 'sad'],
        ['normal', 'normal', 'happy', 'normal', 'normal'],
        ['normal', 'normal', 'normal', 'blush', 'blush', 'normal']
      ],
      stagesReplyExpr: [
        ['happy', 'happy', 'blush'],
        ['sad', 'normal', 'sad'],
        ['surprised', 'sad', 'sad'],
        ['happy', 'blush', 'normal'],
        ['happy', 'happy', 'sad']
      ],
      meetExpr: ['surprised', 'normal', 'normal', 'normal']
    },
    {
      // ---------------- Mặc Trần (nam) — huynh đệ ----------------
      bondTitle: 'Huynh Đệ Kết Nghĩa',
      bondDone: '{name} và {hero} đã kết nghĩa huynh đệ. (Tri kỷ sẽ hồi sinh bạn 1 lần mỗi ngày)',
      bond: [
        { at: 20, title: 'Kiếm gỗ và bánh nướng',
          lines: [
            { who: 'sys', e: 'normal', text: 'Mặc Trần ném cho {hero} một thanh kiếm gỗ: "Tỉ thí. Ngay bây giờ. Ta không đồng hành với kẻ yếu."' },
            { who: 'sys', e: 'normal', text: 'Ba hiệp. {hero} thua cả ba, ngã sấp mặt cả ba. Nhưng lần nào cũng đứng dậy.' },
            { who: 'npc', e: 'happy', text: 'Ngã ba lần, đứng dậy ba lần. Ngu thì có ngu, nhưng cái gan thì được.' },
            { who: 'npc', e: 'normal', text: 'Mai, giờ Mão, ra bờ suối. Trễ một khắc, ta đánh gấp đôi.' },
            { who: 'sys', e: 'normal', text: 'Hắn quay đi, tiện tay ném lại một chiếc bánh nướng còn nóng hổi.' },
            { who: 'npc', e: 'blush', text: 'Đừng hiểu lầm. Mua thừa thôi.' }
          ],
          choices: [
            { text: 'Đa tạ sư huynh chỉ giáo!', aff: 8, e: 'blush', reply: 'Ai là sư huynh của ngươi? ...Thôi, gọi vậy cũng được. Nghe cũng thuận tai.' },
            { text: 'Mai ta sẽ trụ được quá ba hiệp.', aff: 9, e: 'happy', reply: 'Ha! Nói thì hay lắm. Ta chờ xem.' },
            { text: 'Ta không cần ngươi dạy, cũng chẳng cần bánh.', aff: -4, e: 'angry', reply: 'Tuỳ ngươi. Bánh thì trả đây.' }
          ] },
        { at: 40, title: 'Đáy giếng',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đi ngang một ngôi làng đổ nát, Mặc Trần đứng lặng trước một cái giếng cạn, rất lâu.' },
            { who: 'npc', e: 'sad', text: 'Năm ta sáu tuổi, ma tu tràn vào tông môn nhỏ của ta trong một đêm. Mẹ giấu ta xuống giếng.' },
            { who: 'npc', e: 'sad', text: 'Bà dặn dù nghe gì cũng không được kêu. Ta nghe hết. Ba ngày ba đêm. Rồi im lặng.' },
            { who: 'hero', e: 'normal', text: 'Làng ta cũng bị huyết thi tràn qua. Ta trốn trong đống rơm, nhìn qua khe hở. Ta cũng không kêu.' },
            { who: 'npc', e: 'surprised', text: '...Vậy ra ngươi cũng là một đứa trẻ núp dưới giếng.' },
            { who: 'npc', e: 'normal', text: 'Ta đã thề cả đời làm kiếm, không bao giờ trốn nữa. Còn ngươi... khỏi thề. Có ta làm kiếm rồi.' }
          ],
          choices: [
            { text: 'Hai đứa trẻ dưới giếng, giờ cùng cầm kiếm. Kẻ nào dám bắt nạt nữa?', aff: 10, e: 'happy', reply: 'Ha! Nói hay. ...Mẹ ta mà thấy, chắc sẽ mừng vì ta có người cùng cầm kiếm.' },
            { text: 'Đứa trẻ ấy không có lỗi. Nó sống, đúng như mẹ muốn.', aff: 9, e: 'sad', reply: '...Chưa ai nói với ta câu đó. Ngươi im một lát đi, để ta... nhìn chỗ khác.' },
            { text: 'Hận thù chỉ làm kiếm thêm nặng.', aff: -2, e: 'angry', reply: 'Không có nó, ta đã chẳng nhấc nổi kiếm.' }
          ] },
        { at: 60, title: 'Cõng nhau qua rừng',
          lines: [
            { who: 'sys', e: 'normal', text: 'Giữa trận, Mặc Trần gục xuống. Linh lực rò rỉ khỏi người hắn như nước chảy khỏi bình vỡ.' },
            { who: 'hero', e: 'normal', text: 'Kim Đan của ngươi... rạn rồi!' },
            { who: 'npc', e: 'angry', text: 'Ồn ào. Tuyệt Kiếm Quyết đốt thọ nguyên đổi lấy sức mạnh. Ta còn chừng ba năm. Bỏ ta lại, chạy đi.' },
            { who: 'sys', e: 'normal', text: '{hero} không đáp, cõng hắn lên lưng, chạy suốt đêm qua Vạn Thú Sơn Mạch. Gần sáng, một con ma lang vồ tới từ phía sau.' },
            { who: 'sys', e: 'normal', text: 'Phi kiếm loé lên. Con ma lang đổ gục. Mặc Trần thở dốc trên lưng {hero}, tay vẫn còn bắt kiếm quyết.' },
            { who: 'npc', e: 'blush', text: 'Ngươi cõng ta cả đêm, ta chém một con sói. Vẫn là ta lỗ. ...Thả ta xuống. Đừng nhìn ta bằng ánh mắt thương hại đó.' }
          ],
          choices: [
            { text: 'Không phải thương hại. Huynh đệ thì cõng nhau, thế thôi.', aff: 10, e: 'happy', reply: 'Huynh đệ... Ngươi nói chữ đó dễ dàng thật. ...Thôi được. Cõng thêm một đoạn nữa.' },
            { text: 'Ta sẽ tìm cách vá Kim Đan cho ngươi. Lật tung thiên hạ cũng được.', aff: 9, e: 'normal', reply: 'Đồ ngốc. Đó là việc của ta. ...Nhưng nếu ngươi muốn đi cùng, ta không cản.' },
            { text: 'Ngươi tự chọn con đường này, tự gánh đi.', aff: -5, e: 'angry', reply: 'Đúng. Ta tự chọn. Nên ngươi khỏi bận tâm.' }
          ] },
        { at: 80, title: 'Một cầu, hai kiếm',
          lines: [
            { who: 'sys', e: 'normal', text: 'Trên cây cầu treo bắc qua Vực Vong Hồn, huyết tu vây kín hai đầu. Mặc Trần đẩy {hero} ra sau lưng.' },
            { who: 'npc', e: 'normal', text: 'Ta cản. Ngươi chạy. Mạng ta ngắn, đổi được thì đổi.' },
            { who: 'hero', e: 'normal', text: 'Mạng ai cũng không phải để đổi! Ngươi giữ đầu cầu bên này, ta giữ đầu bên kia.' },
            { who: 'sys', e: 'normal', text: 'Giữa trận, kiếm của Mặc Trần gãy làm đôi. {hero} ném thanh kiếm của mình sang. Hắn bắt lấy, không cần quay đầu.' },
            { who: 'npc', e: 'happy', text: 'Kiếm của ngươi nhẹ hều, lại cùn. ...Nhưng chém được.' },
            { who: 'npc', e: 'happy', text: 'Lần đầu ta cầm kiếm mà không thấy mình đang chờ chết. Phiền thật. Ngươi khiến ta muốn sống lâu hơn.' }
          ],
          choices: [
            { text: 'Vậy thì sống lâu hơn. Đệ còn chưa thắng huynh được trận nào.', aff: 10, e: 'happy', reply: 'Ha! Vậy ta phải sống đến lúc ngươi thắng. Tức là sống rất, rất lâu.' },
            { text: 'Kiếm đó tặng ngươi. Coi như giữ hộ ta.', aff: 8, e: 'normal', reply: 'Giữ hộ thì phải trả. Ta sẽ rèn cho ngươi một thanh tốt hơn.' },
            { text: 'Lần sau đừng đẩy ta ra sau như con nít.', aff: -3, e: 'angry', reply: 'Thế thì luyện kiếm cho đàng hoàng vào.' }
          ] },
        { at: 100, title: 'Kết nghĩa kim lan',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đêm trước trận cuối. Mặc Trần ném sang một thanh kiếm mới rèn. Chuôi kiếm khắc chữ "Trần", bên cạnh còn một chỗ để trống.' },
            { who: 'npc', e: 'normal', text: 'Ta nợ ngươi một thanh kiếm. Chỗ trống đó, tự khắc tên ngươi vào.' },
            { who: 'npc', e: 'sad', text: 'Cả đời ta chưa gọi ai là huynh đệ. Huynh đệ là thứ để mất. Mẹ ta, tông môn ta, mất cả trong một đêm.' },
            { who: 'npc', e: 'happy', text: 'Nhưng ngươi lì lợm cõng ta cả đêm, ném kiếm cho ta giữa trận. Không nhận ngươi, ta mới là kẻ ngu.' },
            { who: 'sys', e: 'normal', text: 'Hắn rạch nhẹ lòng bàn tay, nhỏ máu vào chén rượu, rồi đẩy sang phía {hero}.' },
            { who: 'npc', e: 'happy', text: 'Mặc Trần hôm nay cùng {hero} kết nghĩa kim lan. Không cầu cùng ngày sinh, chỉ nguyện chung một đường kiếm. Từ nay ta là huynh, ngươi là đệ. Không cãi.' }
          ],
          choices: [
            { text: 'Đại ca. Đệ kính huynh một chén.', aff: 10, e: 'happy', reply: 'Đại ca... Ừ. Nghe hay hơn ta tưởng. Uống đi, đừng bắt ta nói lời sến thêm lần nữa.' },
            { text: 'Huynh đệ đồng lòng, cùng sống mà về. Cả Kim Đan của huynh nữa.', aff: 9, e: 'happy', reply: 'Được. Xong trận này, đệ theo ta đi tìm thuốc vá Kim Đan. Không phải vì ta sợ chết. Mà vì ta còn phải trông đệ.' },
            { text: 'Thôi khỏi, ta không quen mấy trò thề thốt.', aff: -4, e: 'angry', reply: 'Hừ. Không quen thì tập. Chén này ta để đây, đến khi nào ngươi chịu uống.' }
          ] }
      ],
      stagesExpr: [
        ['normal', 'normal', 'surprised', 'normal', 'blush'],
        ['normal', 'sad', 'sad', 'sad', 'angry'],
        ['normal', 'normal', 'angry', 'normal', 'angry'],
        ['normal', 'angry', 'angry', 'normal', 'blush'],
        ['normal', 'normal', 'normal', 'blush', 'blush', 'happy']
      ],
      stagesReplyExpr: [
        ['blush', 'happy', 'angry'],
        ['surprised', 'blush', 'sad'],
        ['blush', 'normal', 'angry'],
        ['blush', 'normal', 'normal'],
        ['happy', 'happy', 'normal']
      ],
      meetExpr: ['angry', 'normal', 'normal', 'normal']
    }
  ],

  // =====================================================================
  // THỢ SĂN CỔNG
  // =====================================================================
  sl: [
    {
      // ---------------- Thôi Hạ Linh (nữ) — chị em ----------------
      bondTitle: 'Chị Em Kết Nghĩa',
      bondDone: '{name} và {hero} đã kết nghĩa chị em. (Tri kỷ sẽ hồi sinh bạn 1 lần mỗi ngày)',
      bond: [
        { at: 20, title: 'Nửa thanh sô-cô-la',
          lines: [
            { who: 'sys', e: 'normal', text: 'Sau trận chiến, Hạ Linh chữa cho cả đội rồi ngồi thụp xuống một góc, mặt tái nhợt.' },
            { who: 'hero', e: 'normal', text: 'Cậu có mệt không?' },
            { who: 'npc', e: 'surprised', text: 'Mệt... à? Tám năm làm thợ săn, chưa ai hỏi tôi câu đó. Người ta chỉ hỏi: "Còn ma lực không?"' },
            { who: 'sys', e: 'normal', text: '{hero} bẻ đôi thanh sô-cô-la, đưa cho cô nửa to hơn.' },
            { who: 'npc', e: 'sad', text: 'Nửa to cho tôi á? Ở bang hội cũ, tôi còn không được ngồi chung bàn với đội tấn công.' },
            { who: 'npc', e: 'happy', text: 'Ừm... cảm ơn cậu. Tôi mệt lắm. Hoá ra nói được câu đó ra cũng nhẹ người ghê.' }
          ],
          choices: [
            { text: 'Vậy cậu ngủ đi. Lần này tôi canh.', aff: 9, e: 'happy', reply: 'Thật không? Vậy... tôi chợp mắt chút nhé. Có gì gọi tôi dậy ngay đấy.' },
            { text: 'Từ giờ hai đứa mình chia đôi mọi thứ. Kể cả mệt.', aff: 8, e: 'happy', reply: 'Chia đôi cả mệt... Nghe lạ mà dễ thương ghê. Tôi nhớ đấy nhé.' },
            { text: 'Hạng S mà cũng biết mệt à?', aff: -3, e: 'sad', reply: '...Hạng S cũng là người mà.' }
          ] },
        { at: 40, title: 'Đồ quý và đồ bỏ',
          lines: [
            { who: 'sys', e: 'normal', text: 'Một gã từ bang hội cũ chặn đường, chìa ra tờ giấy: "Hợp đồng của cô còn hiệu lực năm năm. Về thôi, tài sản."' },
            { who: 'npc', e: 'sad', text: 'Năm mười lăm tuổi tôi thức tỉnh. Hôm sau, bố mẹ ký giao quyền quản lý tôi cho bang hội, đổi lấy một căn nhà lớn.' },
            { who: 'npc', e: 'sad', text: 'Tám năm nay, tôi là "tài sản hạng S". Chưa ai hỏi tôi muốn chữa cho ai.' },
            { who: 'hero', e: 'normal', text: 'Còn tôi là "kẻ yếu nhất nhân loại". Mỗi lần vào Cổng, người ta nhìn tôi như nhìn cái xác sắp phải khiêng ra.' },
            { who: 'npc', e: 'sad', text: 'Một đứa bị coi là đồ quý, một đứa bị coi là đồ bỏ. Nghe như chuyện cười nhỉ.' },
            { who: 'npc', e: 'happy', text: 'Nhưng đứng cạnh cậu, tôi thấy mình chỉ là Hạ Linh thôi. Không hơn, không kém.' }
          ],
          choices: [
            { text: 'Hợp đồng để tôi lo. Cậu chỉ cần chọn điều cậu muốn.', aff: 10, e: 'sad', reply: 'Cậu nói nhẹ tênh như vậy... mà sao tôi muốn khóc thế này.' },
            { text: 'Đồ quý hay đồ bỏ gì cũng được. Mình là đồng đội.', aff: 8, e: 'happy', reply: 'Đồng đội... Ừ. Nghe ấm hơn chữ "tài sản" nhiều lắm.' },
            { text: 'Ít ra bố mẹ cậu cũng có nhà đẹp.', aff: -4, e: 'sad', reply: '...Ừ. Họ có nhà đẹp. Còn tôi có gì chứ?' }
          ] },
        { at: 60, title: 'Ánh sáng trong hang tối',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đèn pin vụt tắt giữa ngục tối. Hạ Linh đứng sững, thở dốc, run lẩy bẩy.' },
            { who: 'npc', e: 'sad', text: 'Tối quá... không thấy gì cả... Năm tám tuổi tôi bị vùi dưới một Cổng sụp, ba ngày liền chỉ có bóng tối...' },
            { who: 'hero', e: 'normal', text: 'Nắm tay tôi. Đếm bước cùng tôi nào. Một, hai, ba...' },
            { who: 'sys', e: 'normal', text: 'Giữa chừng, một con quái vật lao ra, móng vuốt cào rách vai {hero}. Máu thấm đẫm tay áo.' },
            { who: 'sys', e: 'normal', text: 'Trong bóng tối đặc quánh, một vầng sáng vàng bừng lên. Hạ Linh vẫn run, nhưng hai tay đã áp chặt lên vết thương.' },
            { who: 'npc', e: 'sad', text: 'Tôi sợ chết khiếp... nhưng cậu đang chảy máu. Tôi sợ mất cậu hơn sợ bóng tối.' },
            { who: 'npc', e: 'happy', text: 'Cậu dắt tôi đi, tôi chữa cho cậu. Vậy là... mình cứu nhau rồi nhỉ?' }
          ],
          choices: [
            { text: 'Cậu vừa thắp sáng cả cái hang này đấy, biết không?', aff: 10, e: 'surprised', reply: 'Tôi á? ...Ừ nhỉ. Lần đầu tiên ánh sáng của tôi dùng để tự cứu mình.' },
            { text: 'Lần sau tối thì cứ nắm tay tôi. Không cần xin phép.', aff: 9, e: 'happy', reply: 'Không xin phép thật đấy nhé. Tôi bám dai lắm.' },
            { text: 'Thợ săn mà sợ tối thì khó sống lắm.', aff: -5, e: 'sad', reply: 'Tôi biết. Tôi biết mà. Không cần cậu nhắc.' }
          ] },
        { at: 80, title: 'Bản hợp đồng xé đôi',
          lines: [
            { who: 'sys', e: 'normal', text: 'Bang hội cũ kéo đến cả đội tấn công, chặn kín lối ra khỏi Cổng. "Thôi Hạ Linh, về. Hoặc bọn ta mang cô về."' },
            { who: 'npc', e: 'sad', text: 'Cậu đi đi. Họ muốn tôi, không phải cậu. Tôi quen rồi...' },
            { who: 'hero', e: 'normal', text: 'Không ai mang cậu đi đâu hết. Muốn qua thì qua tôi trước.' },
            { who: 'sys', e: 'normal', text: 'Bóng tối dưới chân {hero} trỗi dậy, từng chiến binh bóng tối đứng thành hàng. Hạ Linh nhìn tấm lưng ấy, rồi bước lên, đứng ngang vai.' },
            { who: 'npc', e: 'angry', text: 'Không. Lần này tôi tự nói.' },
            { who: 'sys', e: 'angry', text: 'Cô giật lấy bản hợp đồng, xé làm đôi ngay trước mặt cả bang hội.' },
            { who: 'npc', e: 'angry', text: 'Tôi là Thôi Hạ Linh. Không phải tài sản của ai. Và người tôi chọn đứng cạnh là cô ấy.' }
          ],
          choices: [
            { text: 'Nói hay lắm. Giờ lùi ra sau, để bóng tối lo phần còn lại.', aff: 9, e: 'happy', reply: 'Không. Đứng cạnh. Từ giờ tôi không đứng sau lưng ai nữa.' },
            { text: 'Cậu vừa tự chọn đấy. Tôi tự hào về cậu.', aff: 10, e: 'happy', reply: 'Tim tôi đập loạn hết cả rồi... Nhưng mà sướng ghê. Hoá ra tự do là cảm giác này.' },
            { text: 'Xé hợp đồng là bị kiện đấy, cậu nghĩ kỹ chưa?', aff: -4, e: 'angry', reply: '...Cậu lúc nào cũng phải dội nước lạnh vào người ta sao?' }
          ] },
        { at: 100, title: 'Hai viên ma thạch',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đêm trước trận cuối. Hạ Linh tắt hết đèn trong phòng, chỉ còn ánh trăng. Cô ngồi giữa bóng tối, bình thản lạ thường.' },
            { who: 'npc', e: 'happy', text: 'Thấy không? Tôi ngồi trong bóng tối mà không sợ nữa. Vì bóng tối này là của cậu.' },
            { who: 'npc', e: 'sad', text: 'Bố mẹ đổi tôi lấy một căn nhà. Bang hội gọi tôi là tài sản. Tôi từng nghĩ mình chẳng có gia đình nào cả.' },
            { who: 'sys', e: 'normal', text: 'Cô lấy ra hai sợi dây chuyền, mặt là hai viên ma thạch nhỏ. Một viên vàng, một viên đen.' },
            { who: 'npc', e: 'blush', text: 'Tôi tự làm đấy, hơi xấu. ...Mình kết nghĩa chị em nhé? Không giấy tờ, không hợp đồng. Chỉ cần cậu gật đầu.' },
            { who: 'sys', e: 'happy', text: '[HỆ THỐNG] Phát hiện liên kết đặc biệt: "Chị Em Kết Nghĩa". Kỹ năng mới: "Ánh Sáng Trong Bóng Tối".' }
          ],
          choices: [
            { text: 'Gật. Gật cả trăm lần. Chị em mình, sống chết có nhau.', aff: 10, e: 'happy', reply: 'Cả trăm lần luôn! ...Từ giờ tôi có gia đình rồi. Gia đình tự chọn, xịn hơn gia đình ký giấy nhiều.' },
            { text: 'Viên đen là của tôi nhé. Ánh sáng với bóng tối, đi đâu cũng có nhau.', aff: 9, e: 'happy', reply: 'Đúng ý tôi luôn! Hệ Thống còn duyệt rồi kìa. Hết đường cãi nhé.' },
            { text: 'Kết nghĩa làm gì, là đồng đội là đủ rồi.', aff: -4, e: 'sad', reply: '...Ừ. Đồng đội cũng tốt. Tôi chỉ... mong nhiều hơn một chút thôi.' }
          ] }
      ],
      stagesExpr: [
        ['normal', 'normal', 'normal', 'surprised', 'sad', 'sad'],
        ['normal', 'sad', 'sad', 'sad', 'happy'],
        ['normal', 'surprised', 'normal', 'sad', 'sad'],
        ['normal', 'normal', 'happy', 'sad', 'blush'],
        ['normal', 'happy', 'happy', 'happy', 'blush', 'normal']
      ],
      stagesReplyExpr: [
        ['happy', 'blush', 'sad'],
        ['sad', 'happy', 'sad'],
        ['blush', 'happy', 'sad'],
        ['blush', 'blush', 'normal'],
        ['happy', 'blush', 'sad']
      ],
      meetExpr: ['blush', 'normal', 'happy', 'normal']
    },
    {
      // ---------------- Khương Trầm (nam) — anh em ----------------
      bondTitle: 'Anh Em Sinh Tử',
      bondDone: '{name} và {hero} đã thành anh em sinh tử. (Tri kỷ sẽ hồi sinh bạn 1 lần mỗi ngày)',
      bond: [
        { at: 20, title: 'Nồi canh trong Cổng',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đêm trong Cổng, Khương Trầm lặng lẽ nhóm lửa nấu một nồi canh. Anh múc bát đầy nhất đưa cho {hero}.' },
            { who: 'npc', e: 'normal', text: 'Ăn đi.' },
            { who: 'hero', e: 'normal', text: 'Ngon thật! Anh nấu cho tôi cả tuần nay, mà tôi chưa nấu cho anh bữa nào.' },
            { who: 'npc', e: 'normal', text: 'Trước đây tôi nấu cho cả tổ đội. Năm người. Ai cũng kén. Đội trưởng ghét hành, thằng Hoà ghét cà rốt.' },
            { who: 'npc', e: 'sad', text: 'Lâu rồi không có ai ngồi ăn cùng. ...Mặn không?' },
            { who: 'sys', e: 'happy', text: '{hero} chìa bát đòi thêm. Khoé miệng Khương Trầm khẽ nhếch lên, rất nhẹ.' }
          ],
          choices: [
            { text: 'Mai tôi rửa bát, anh nấu. Chia việc kiểu tổ đội.', aff: 9, e: 'happy', reply: '...Được. Kiểu tổ đội.' },
            { text: 'Kể tôi nghe về năm người đó đi.', aff: 7, e: 'sad', reply: 'Đội trưởng cười to. Chị Mai hay mắng. Thằng Hoà ngáy như sấm... Mai kể tiếp.' },
            { text: 'Hơi mặn thật.', aff: -2, e: 'normal', reply: '...Lần sau bớt muối.' }
          ] },
        { at: 40, title: 'Người còn sót lại',
          lines: [
            { who: 'sys', e: 'normal', text: 'Khương Trầm luôn đeo một chiếc đồng hồ vỡ mặt kính, kim dừng ở ba giờ mười bảy phút.' },
            { who: 'npc', e: 'sad', text: 'Năm năm trước, Cổng vỡ. Đội trưởng ra lệnh tôi chạy về gọi cứu viện. Tôi chạy. Ba mươi phút. Khi quay lại, chỉ còn cái này.' },
            { who: 'npc', e: 'sad', text: 'Đáng lẽ tôi nên ở lại. Chết cùng họ.' },
            { who: 'hero', e: 'normal', text: 'Trong ngục tối kép, cả đội tôi bị thảm sát. Chỉ mình tôi nằm giữa vũng máu mà vẫn còn thở.' },
            { who: 'npc', e: 'surprised', text: '...Cậu cũng là người còn sót lại.' },
            { who: 'npc', e: 'sad', text: 'Vậy cậu hiểu. Cái cảm giác mỗi hơi thở đều như mượn của ai đó.' }
          ],
          choices: [
            { text: 'Thì mình sống cho xứng phần của họ. Hai người, sống gấp đôi.', aff: 10, e: 'surprised', reply: '...Sống gấp đôi. Tôi chưa từng nghĩ theo cách đó.' },
            { text: 'Đội trưởng cố ý để anh chạy. Họ muốn anh sống.', aff: 8, e: 'sad', reply: 'Tôi biết. Tôi là người trẻ nhất đội. Họ biết thế.' },
            { text: 'Chuyện qua rồi, anh nên vứt nó đi.', aff: -4, e: 'angry', reply: 'Không. Đây là thứ duy nhất còn lại.' }
          ] },
        { at: 60, title: 'Cổng hạng A lúc nửa đêm',
          lines: [
            { who: 'sys', e: 'normal', text: 'Nửa đêm, {hero} bám theo Khương Trầm vào một Cổng hạng A. Lần thứ ba trong tuần anh đi một mình.' },
            { who: 'sys', e: 'normal', text: 'Bên trong, anh đã bị bầy quái vật dồn vào góc, khiên nứt toác. Đội quân bóng tối của {hero} ập tới, xé toạc vòng vây.' },
            { who: 'npc', e: 'surprised', text: 'Sao cậu lại ở đây?' },
            { who: 'hero', e: 'normal', text: 'Câu đó tôi hỏi anh mới đúng! Anh muốn chết sao?!' },
            { who: 'npc', e: 'sad', text: '...Không hẳn. Chỉ là nếu chết, cũng chẳng ai buồn. Tôi đang trả nợ.' },
            { who: 'sys', e: 'normal', text: 'Con trùm quật đuôi về phía {hero}. Khương Trầm lao tới, dùng chính tấm khiên nứt đỡ trọn, rồi quay lại, giọng khàn đặc.' },
            { who: 'npc', e: 'happy', text: 'Thấy chưa. Có cậu ở đây, tôi lại không chết được. Phiền thật.' }
          ],
          choices: [
            { text: 'Tôi sẽ buồn. Nên anh nợ tôi thêm một món: không được đi một mình nữa.', aff: 10, e: 'normal', reply: '...Nợ cậu. Món này tôi trả được. Hứa.' },
            { text: 'Từ giờ Cổng nào anh vào, tôi vào cùng.', aff: 9, e: 'happy', reply: 'Cứng đầu thật. ...Được. Hai người.' },
            { text: 'Đó là mạng của anh, tuỳ anh.', aff: -5, e: 'sad', reply: '...Ừ. Tuỳ tôi.' }
          ] },
        { at: 80, title: 'Kim giây lại chạy',
          lines: [
            { who: 'sys', e: 'normal', text: 'Cổng Đỏ vỡ. Quái vật tràn ra bốn phía. {hero} và Khương Trầm đứng lưng tựa lưng giữa quảng trường.' },
            { who: 'npc', e: 'normal', text: 'Lần trước, có người ra lệnh cho tôi chạy.' },
            { who: 'hero', e: 'normal', text: 'Lần này tôi ra lệnh: đứng lại với tôi.' },
            { who: 'sys', e: 'normal', text: 'Anh giơ cổ tay lên. Chiếc đồng hồ đã được thay mặt kính. Kim giây đang chạy.' },
            { who: 'npc', e: 'happy', text: 'Sửa rồi. Tối qua. Năm năm thời gian của tôi đứng yên. Đi với cậu, nó chạy lại.' },
            { who: 'npc', e: 'normal', text: 'Lệnh nhận rồi. Lưng cậu, tôi giữ. Không con nào qua được.' }
          ],
          choices: [
            { text: 'Lưng anh, tôi giữ. Cùng đánh, rồi cùng về.', aff: 10, e: 'happy', reply: 'Cùng về. Lần này tất cả đều về.' },
            { text: 'Đồng hồ chạy rồi, anh phải sống để xem nó chạy tiếp.', aff: 8, e: 'happy', reply: 'Xem nó chạy. Cùng cậu. Được.' },
            { text: 'Đứng đó tâm sự gì nữa, đánh đi!', aff: -3, e: 'normal', reply: '...Đúng. Nói sau.' }
          ] },
        { at: 100, title: 'Mâm cơm bảy cái bát',
          lines: [
            { who: 'sys', e: 'normal', text: 'Đêm trước trận cuối. Trên sân thượng, Khương Trầm bày một mâm cơm với bảy cái bát. Năm bát úp, hai bát ngửa.' },
            { who: 'npc', e: 'normal', text: 'Năm bát cho tổ đội cũ. Một của tôi. Một của cậu.' },
            { who: 'sys', e: 'normal', text: 'Kim phút nhích dần. Ba giờ mười bảy.' },
            { who: 'npc', e: 'sad', text: 'Năm năm nay, đây là giờ tôi ghét nhất. Tôi muốn đổi nó thành giờ khác.' },
            { who: 'npc', e: 'normal', text: 'Tôi không giỏi nói. Nên nói ngắn. Tôi không có anh em ruột. Từ giờ, có cậu.' },
            { who: 'npc', e: 'happy', text: 'Nhận thì cạn chén này. Từ nay cậu đói tôi nấu, cậu ngã tôi đỡ. Anh em sống chết có nhau.' }
          ],
          choices: [
            { text: 'Cạn. Từ giờ ba giờ mười bảy là giờ anh em mình kết nghĩa.', aff: 10, e: 'happy', reply: 'Giờ kết nghĩa... Ừ. Tôi bắt đầu thích nó rồi.' },
            { text: 'Nhận. Mai đến lượt em nấu cho anh.', aff: 9, e: 'happy', reply: '...Em. Nghe được. Nhưng đừng đụng vào bếp của anh. Rửa bát thôi.' },
            { text: 'Để sau trận chiến rồi hẵng nói.', aff: -4, e: 'sad', reply: 'Ừ. Đồng hồ chạy rồi. Tôi chờ được.' }
          ] }
      ],
      stagesExpr: [
        ['normal', 'normal', 'normal', 'normal', 'blush'],
        ['normal', 'sad', 'sad', 'sad', 'sad'],
        ['normal', 'normal', 'sad', 'sad', 'sad'],
        ['normal', 'normal', 'normal', 'normal', 'happy', 'normal'],
        ['normal', 'normal', 'normal', 'sad', 'normal', 'blush']
      ],
      stagesReplyExpr: [
        ['happy', 'normal', 'normal'],
        ['sad', 'surprised', 'angry'],
        ['surprised', 'happy', 'sad'],
        ['happy', 'happy', 'normal'],
        ['happy', 'blush', 'normal']
      ],
      meetExpr: ['normal', 'normal', 'normal', 'normal']
    }
  ]
};

const LORE_SHOP = {
  md: {
    name: 'Lão Tư Phế Liệu',
    title: 'Thương nhân chợ đen',
    greet: [
      'Vào đi, vào đi. Đóng cửa giùm cái, mùi máu bên ngoài kéo tụi nó tới đấy.',
      'Đồ hộp, đạn, băng gạc... Tận thế rồi, nhưng chợ đen thì chưa bao giờ đóng cửa.',
      'Không bị cắn chứ? Tốt. Xem hàng đi, giá cả phải chăng.',
      'Hôm qua có thằng trả bằng nhẫn cưới. Tôi lấy. Ở đây cái gì cũng đổi được.',
      'Còn sống quay lại là quý rồi. Hôm nay có hàng mới moi từ xe quân sự đấy.'
    ],
    buy: [
      'Hàng tốt đấy. Dùng cho khéo, đừng chết sớm phí của.',
      'Thành giao. Lần sau nhớ ghé. Nếu còn lần sau.',
      'Cầm lấy. Nhớ này: đạn thì mua được, mạng thì không.'
    ],
    sell: [
      'Món này... ừm, được. Tôi trả chừng này thôi, cò kè là tôi đổi ý.',
      'Nhặt ở đâu ra vậy? Thôi khỏi kể, tôi không muốn biết.',
      'Thứ này đang có người cần lắm. Đây, phần của cậu.'
    ]
  },
  tt: {
    name: 'Tiền Đa Bảo',
    title: 'Chưởng quầy Vạn Bảo Các',
    greet: [
      'Đạo hữu dừng bước! Vạn Bảo Các hàng thật giá thật, không lừa già dối trẻ.',
      'Linh Thạch trong túi đạo hữu đang kêu leng keng kìa. Vào xem chút đi.',
      'Huyết kiếp giáng thế, đan dược khan hiếm. Nhưng ở chỗ lão phu thì vẫn còn.',
      'Phù chú, linh đan, pháp khí... Đạo hữu cần gì, lão phu đều có. Có cả thứ không nên có.',
      'Lại gặp đạo hữu. Khí tức tinh tiến hẳn, chắc sắp đột phá rồi nhỉ?'
    ],
    buy: [
      'Đạo hữu tinh mắt! Món này lão phu giữ ba năm nay chưa nỡ bán.',
      'Linh Thạch đã nhận. Chúc đạo hữu tu hành thuận lợi, sớm ngày phi thăng.',
      'Đã thành giao, không đổi không trả. Quy củ phường thị mà.'
    ],
    sell: [
      'Hừm, linh khí vẫn còn. Lão phu trả bấy nhiêu Linh Thạch, không hơn.',
      'Đồ của yêu thú cấp này à? Đạo hữu liều mạng thật đấy.',
      'Thành giao. Có hàng tốt cứ mang đến, Vạn Bảo Các thu hết.'
    ]
  },
  sl: {
    name: 'Lão Phác',
    title: 'Chủ tiệm đồ thợ săn',
    greet: [
      'Chào mừng đến tiệm. Bình hồi phục, vũ khí, cuộn kỹ năng, có đủ cả.',
      'Thợ săn hạng E à? ...Khoan, ma lực của cậu khác rồi. Mời vào, mời vào.',
      'Có Cổng mới mở ở quận bên. Mua thêm bình hồi máu rồi hẵng đi.',
      'Ma Thạch nào tôi cũng thu, từ hạng E đến hạng S. Giá tốt nhất thành phố.',
      'Lại là cậu. Dạo này tin đồn về cậu nhiều lắm đấy, thợ săn.'
    ],
    buy: [
      'Lựa chuẩn đấy. Chúc cậu săn thuận lợi, về đủ tay đủ chân.',
      'Đã trừ Ma Thạch. Hàng có bảo hành, trừ trường hợp chết trong Cổng.',
      'Cảm ơn quý khách. Thợ săn sống sót đều là khách quen của tôi.'
    ],
    sell: [
      'Lõi ma thạch còn nguyên vẹn. Được giá đấy.',
      'Chiến lợi phẩm từ Cổng nào vậy? Hiếm thấy ghê. Đây, Ma Thạch của cậu.',
      'Thành giao. Có đồ tốt cứ mang đến, đừng bán cho Hiệp Hội, họ ép giá lắm.'
    ]
  }
};

for (const r in LORE_BOND) LORE_BOND[r].forEach((b, i) => Object.assign(LORE[r].companions[i], b));
