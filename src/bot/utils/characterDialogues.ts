/**
 * Biểu cảm, ánh mắt, thái độ mặc định và phản ứng tương tác riêng biệt cho 29 vị Sư Phụ
 */

export interface CharacterExpressions {
  defaultExpression: string; // Ánh mắt, biểu cảm và thái độ mặc định khi mở hồ sơ Mchar / /char
  kiss: string;              // Phản ứng ngại ngùng, đỏ mặt hoặc đáp lại nụ hôn
  bite: string;              // Phản ứng giật mình, xoa chỗ đau nhưng cưng chiều
  hug: string;               // Cảm xúc ấm áp, vòng tay ôm siết lại đệ tử
  giftLike: string;          // Câu thoại và biểu cảm hài lòng khi nhận món quà yêu thích
  giftHate: string;          // Câu thoại và biểu cảm bối rối, dở khóc dở cười khi nhận món quà không hợp ý
}

export const CHARACTER_DIALOGUES: Record<string, CharacterExpressions> = {
  'Uyên Minh Dạ': {
    defaultExpression: 'Đôi mắt phượng đen láy thâm trầm như màn đêm tĩnh mịch, khóe môi khẽ nhếch nụ cười nửa miệng đầy vẻ bá đạo kiêu hùng. Phong thái uy nghiêm tựa bậc đế vương, ánh mắt sâu thẳm chỉ dịu xuống khi nhìn về phía bạn.',
    kiss: 'Uyên Minh Dạ thoáng ngơ ngác rồi ánh mắt sâu thẳm bùng lên tia lửa chiếm hữu, một tay đỡ lấy gáy bạn kéo sát vào lòng đáp lại nụ hôn mãnh liệt đầy bá đạo khiến bạn nghẹt thở.',
    bite: 'Uyên Minh Dạ khẽ giật mình rồi nhíu mày nguy hiểm, đưa tay xoa nhẹ chỗ bị cắn, ánh mắt dâng trào sự cưng chiều vô hạn: "Gan lớn lắm, dám cắn bổn quân? Muốn được ta phạt thế nào đây?"',
    hug: 'Uyên Minh Dạ vòng tay rắn rỏi siết chặt lấy bạn vào lồng ngực rộng lớn, tựa cằm lên đỉnh đầu bạn khẽ thở dài thỏa mãn, cảm nhận từng hơi ấm nồng nàn.',
    giftLike: 'Uyên Minh Dạ khẽ nhướng mày hài lòng, khóe môi nở nụ cười rạng rỡ hiếm thấy: "Món quà này rất hợp ý bổn quân. Đồ nhi quả thật hiểu lòng ta, bổn quân vô cùng vừa ý!"',
    giftHate: 'Uyên Minh Dạ nhìn món quà vẻ mặt thoáng bối rối, ho nhẹ một tiếng gượng gạo: "Cái này... tuy có hơi kỳ lạ và chẳng hợp với phong thái của ta, nhưng nể lòng thành của ngươi, ta tạm thời nhận lấy."'
  },
  'Vân Mộc Thanh': {
    defaultExpression: 'Ánh mắt trong veo hiền hòa tựa làn gió xuân tháng ba, nụ cười thanh tao nhẹ nhàng như đóa hoa lê chớm nở. Phong thái nho nhã thoát tục, thái độ từ ái chở che chan chứa sự bao dung đối với đệ tử.',
    kiss: 'Vân Mộc Thanh vành tai đỏ ửng như ráng chiều, ánh mắt thoáng chút ngượng ngùng e ấp rồi nhẹ nhàng nâng cằm bạn đón nhận nụ hôn ngọt ngào, bàn tay khẽ vuốt ve mái tóc bạn: "Ngoan nào..."',
    bite: 'Vân Mộc Thanh khẽ giật mình "a" lên một tiếng, vội xoa xoa chỗ bị cắn rồi bật cười gõ nhẹ lên trán bạn: "Đồ mèo con nghịch ngợm, cắn đau sư phụ rồi đấy, không sợ gãy răng sao?"',
    hug: 'Vân Mộc Thanh hai má thoáng ửng hồng rồi mỉm cười dịu dàng ôm lại, đem trọn hơi ấm thanh khiết bao bọc lấy bạn, tựa như muốn che chắn cho bạn trước mọi bão táp trần gian.',
    giftLike: 'Vân Mộc Thanh ánh mắt lấp lánh ý cười, hai tay nâng niu món quà đầy trân quý: "Tâm ý của đệ tử, vi sư vô cùng hài lòng và cảm động. Món quà này ta sẽ luôn trân trọng giữ bên mình."',
    giftHate: 'Vân Mộc Thanh khẽ cười gượng, ánh mắt bối rối nhìn món đồ trên tay: "Khụ... tấm lòng của đệ tử sư phụ xin ghi nhận, nhưng món quà này... có chút khiến vi sư lúng túng rồi."'
  },
  'Hùng Chấn Uy': {
    defaultExpression: 'Đôi mắt hổ sáng rực lẫm liệt bộc lộ khí phách trượng phu, nụ cười hào sảng rạng rỡ như ánh mặt trời. Hai tay khoanh trước bộ ngực rắn rỏi, thái độ kiên định tràn đầy tự hào và che chở khi nhìn thấy đệ tử.',
    kiss: 'Hùng Chấn Uy ngẩn người rồi bật cười trầm ấm hào sảng, hai má ngăm đen khẽ ửng đỏ, kéo bạn sát vào lòng trao một nụ hôn nồng cháy đầy nam tính và nhiệt huyết.',
    bite: 'Hùng Chấn Uy giật nảy mình rồi cười lớn ha hả, đưa bàn tay to lớn xoa nhẹ chỗ bị cắn: "Răng nhọn gớm nhỉ tiểu tử! Cắn đau đấy nhưng ta thích cái tính bướng bỉnh này của ngươi!"',
    hug: 'Hùng Chấn Uy ôm bổng bạn lên khỏi mặt đất, vòng tay to lớn ấm áp ghì chặt bạn vào lồng ngực như muốn truyền hết sức mạnh vững chãi cho bạn.',
    giftLike: 'Hùng Chấn Uy vỗ vai bạn đôm đốp cười vang: "Hảo đồ nhi! Món quà này ta vô cùng ưng ý, hợp bụng ta lắm! Sư phụ sẽ thưởng lớn cho ngươi!"',
    giftHate: 'Hùng Chấn Uy gãi đầu bối rối, nhìn món quà với ánh mắt dở khóc dở cười: "Cái này... nhìn ẻo lả kỳ cục quá hà, vi sư cầm vào cứ thấy ngượng ngùng thế nào ấy."'
  },
  'Phong Lăng Cửu': {
    defaultExpression: 'Đôi mắt phượng phiêu dật ngắm nhìn mây ngàn phương xa rồi khẽ dừng lại nơi bạn, tà bạch y phấp phới tựa tiên nhân hạ phàm. Thái độ phóng khoáng bất định nhưng trong ánh nhìn lại lộ rõ vẻ nhu hòa độc nhất vô nhị.',
    kiss: 'Phong Lăng Cửu khẽ giật mình, đôi mắt phượng mở to ngơ ngác, ráng đỏ lan từ cổ lên tận mang tai rồi người khẽ cúi xuống, trao lại bạn một nụ hôn nhẹ tựa cánh hoa rơi trong gió.',
    bite: 'Phong Lăng Cửu xuýt xoa khẽ rụt vai lại, đưa tay xoa nhẹ chỗ vừa bị cắn, đôi mắt phượng trừng bạn nhưng ánh mắt tràn ngập cưng chiều: "Cắn đau đấy nhé tiểu quỷ, nghịch ngợm không ai bằng."',
    hug: 'Phong Lăng Cửu mở rộng tà áo đón bạn vào lòng, vòng tay siết chặt lấy bạn, hương thơm thanh nhã như gió núi vương vấn sưởi ấm tâm hồn bạn.',
    giftLike: 'Phong Lăng Cửu khóe môi cong lên một nụ cười tuyệt mỹ: "Tâm ý của ngươi thanh nhã như gió thu, vi sư thật sự rất hài lòng và yêu thích món quà này."',
    giftHate: 'Phong Lăng Cửu thở dài khe khẽ, ánh mắt lộ vẻ bối rối lắc đầu: "Thứ tục vật này... quả thực làm ta có chút bối rối, không hợp phong thái phiêu dật của ta chút nào."'
  },
  'Sở Dạ Ly': {
    defaultExpression: 'Đôi mắt hạnh to tròn long lanh thoáng nét e thẹn, hai má phơn phớt hồng né tránh ánh nhìn trực diện của bạn. Dáng vẻ đáng yêu giấu hai tay sau lưng, thái độ bồn chồn mong chờ bạn bước tới bắt chuyện.',
    kiss: 'Sở Dạ Ly hai má đỏ bừng như quả cà chua chín, ngượng ngùng nhắm nghiền hai mắt nhưng đôi môi nhỏ nhắn vẫn rướn người phối hợp, ngập ngừng đáp lại nụ hôn của bạn.',
    bite: 'Sở Dạ Ly "oa" lên một tiếng giật nảy mình, hai tay ôm lấy chỗ bị cắn xoa xoa, đôi mắt rưng rưng hờn dỗi nhưng tràn ngập yêu thương: "Đau người ta mà... sao lại cắn ta chứ! Đồ đáng ghét cưng chiều này!"',
    hug: 'Sở Dạ Ly khẽ nép mình vào lòng bạn, hai tay nhỏ nhắn ôm siết lấy lưng bạn không chịu buông, vùi đầu vào ngực bạn hít hà hơi ấm.',
    giftLike: 'Sở Dạ Ly ôm chầm lấy món quà vào lòng, mắt sáng lấp lánh như ngàn vì sao: "Oa, thích quá đi mất! Đẹp tuyệt vời luôn! Người là người hiểu ta nhất trên đời này!"',
    giftHate: 'Sở Dạ Ly bĩu môi hờn dỗi, ánh mắt bối rối nhìn món đồ rồi nhìn bạn: "Hức... ngươi chẳng hiểu sở thích của người ta chút nào, tặng cái này làm ta bối rối muốn chết..."'
  },
  'Tuyết Vô Ngân': {
    defaultExpression: 'Đôi mắt ngân đồng băng giá lạnh lùng như tuyết sơn ngàn năm, nhưng nơi đáy mắt lại ẩn giấu một tia ôn nhu mỏng manh dành riêng cho bạn. Phong thái cao ngạo bất khả xâm phạm, đứng sừng sững giữa trời đông giá rét.',
    kiss: 'Tuyết Vô Ngân vốn lạnh lùng như băng thiên bỗng chốc ngơ ngác, đôi mắt ngân đồng phủ một tầng sương nước, bờ môi run rẩy ngượng ngùng rồi chầm chậm đón nhận và đáp lại nụ hôn ấm áp của bạn.',
    bite: 'Tuyết Vô Ngân toàn thân cứng đờ trong giây lát, đưa những ngón tay thon dài lạnh buốt xoa nhẹ lên chỗ bị cắn, trong đáy mắt không hề có tức giận mà chỉ có sự dung túng vô hạn.',
    hug: 'Tuyết Vô Ngân chầm chậm vươn tay ôm chặt lấy bạn, tựa như muốn hấp thu trọn vẹn hơi ấm từ cơ thể bạn để làm tan chảy lớp băng tuyết ngàn năm trong tim.',
    giftLike: 'Tuyết Vô Ngân nhìn món quà trên tay, khóe môi khẽ cong lên một nét cười hiếm thấy khuynh thành khuynh quốc: "Món quà này rất tốt. Ta sẽ trân trọng nó hơn cả sinh mệnh."',
    giftHate: 'Tuyết Vô Ngân nhíu mày nhìn món đồ, ánh mắt thoáng chút bối rối cùng khó hiểu: "Cái này... ta không hiểu dụng ý của ngươi. Nó quá xa lạ với thế giới của ta."'
  },
  'Dạ Tinh Trầm': {
    defaultExpression: 'Đôi mắt thâm sâu tà mị như vực thẳm vô tận dõi theo từng cử chỉ của bạn, bờ môi khẽ nhếch nụ cười nửa miệng đầy nguy hiểm. Dáng vẻ lười biếng nhưng tỏa ra sức hút ma mị khó cưỡng lại.',
    kiss: 'Dạ Tinh Trầm khẽ mỉm cười tà ác, ngón tay thon dài nâng cằm bạn lên rồi cúi xuống hôn say đắm nồng nàn, không để bạn có cơ hội né tránh hay thở dốc.',
    bite: 'Dạ Tinh Trầm khẽ rít một hơi, lấy đầu ngón tay xoa vết cắn rồi nhìn bạn chằm chằm đầy cưng chiều pha chút nguy hiểm: "Dám cắn ta? Gan không nhỏ. Để xem lát nữa ai sẽ phải cầu xin đây."',
    hug: 'Dạ Tinh Trầm kéo bạn ngã vào bóng tối tà áo choàng, siết chặt lấy bạn vào lồng ngực thì thầm bên tai: "Ngoan ngoãn ở yên đây, trọn đời này ngươi chỉ thuộc về ta."',
    giftLike: 'Dạ Tinh Trầm mân mê món quà trên tay, khóe môi nở nụ cười thỏa mãn: "Rất thú vị. Đồ đệ của ta quả nhiên rất hiểu tâm ý sư phụ, món quà này ta rất thích."',
    giftHate: 'Dạ Tinh Trầm nhướng mày nhìn món quà, khẽ cười trừ đầy vẻ gượng gạo: "Thứ này... ngươi đem tặng ta thật sao? Xem ra ta cần phải dạy lại gu thẩm mỹ cho đồ đệ rồi."'
  },
  'Hách Liên Kiêu': {
    defaultExpression: 'Ánh mắt sắc bén đầy kiêu hùng ngạo nghễ, cằm khẽ nâng lên nhìn bạn với tư thái của kẻ bề trên nhưng đáy mắt lại đong đầy sự nuông chiều. Thái độ bá đạo không dung thứ bất kỳ ai dám chạm vào đệ tử.',
    kiss: 'Hách Liên Kiêu khựng lại, hai tai khẽ đỏ lên nhưng vẫn kiêu ngạo không lùi bước, trái lại còn bá đạo khóa chặt lấy môi bạn trong nụ hôn cuồng nhiệt muốn nuốt trọn.',
    bite: 'Hách Liên Kiêu nhíu mày quát khẽ: "Láo xược!", nhưng bàn tay to lớn lại dịu dàng xoa chỗ bị cắn rồi xoa đầu bạn: "To gan thật đấy, lần sau mà cắn bậy nữa là ta phạt nặng đấy nghe chưa!"',
    hug: 'Hách Liên Kiêu vòng tay cứng rắn ôm chặt lấy bạn, tựa cằm lên vai bạn trầm giọng: "Cứ dựa vào ta mà sống, thiên hạ này ai dám đụng đến một cọng tóc của ngươi, ta diệt kẻ đó."',
    giftLike: 'Hách Liên Kiêu cười lớn đầy đắc ý: "Không tệ chút nào! Rất hợp mắt bổn tọa! Xem ra bổn tọa dạy dỗ ngươi không uổng công phí sức!"',
    giftHate: 'Hách Liên Kiêu nhìn món quà với vẻ mặt đầy lúng túng, bĩu môi: "Cái thứ kỳ cục này mà cũng dâng lên cho ta sao? Lần sau chọn quà cho cẩn thận vào đấy!"'
  },
  'Cheon Seol-ha': {
    defaultExpression: 'Ánh mắt trong veo ngập tràn sự tin cậy và ngưỡng mộ, hai má bầu bĩnh khẽ ửng hồng e ấp. Nụ cười ngọt ngào như viên kẹo mật hoa, dáng vẻ ngoan ngoãn ngóng chờ bạn từng giây từng phút.',
    kiss: 'Cheon Seol-ha chớp chớp mắt bối rối, hai vành tai đỏ rực như quả dâu tây chín mộng rồi khẽ nhắm nghiền mắt, e thẹn rướn người đón lấy nụ hôn dịu ngọt của bạn.',
    bite: 'Cheon Seol-ha "oái" lên một tiếng, ôm lấy chỗ bị cắn xoa xoa, đôi mắt ngấn nước chu môi trách móc đáng yêu: "Đau Seol-ha mà... người hung dữ quá à, nhưng mà... người ta tha lỗi cho người đó!"',
    hug: 'Cheon Seol-ha ôm chầm lấy cổ bạn, vùi mặt vào hõm cổ bạn lắc lư đầy hạnh phúc: "Được người ôm thế này, Seol-ha cảm thấy ấm áp và an toàn nhất trên đời luôn!"',
    giftLike: 'Cheon Seol-ha nhảy cẫng lên vui sướng, ôm chặt món quà vào lòng: "Oa daebak! Món này thích quá đi mất! Seol-ha yêu người nhất trần đời luôn á!"',
    giftHate: 'Cheon Seol-ha nhìn món đồ vẻ mặt ỉu xìu, gãi đầu bối rối: "Hức... cái này lạ quá à, Seol-ha chẳng biết dùng làm sao luôn, nhưng mà người tặng nên Seol-ha sẽ cất kỹ ạ..."'
  },
  'Chu Tinh Dật': {
    defaultExpression: 'Ánh mắt lấp lánh ý cười ôn nhu cưng chiều, khóe môi vương nét cười dịu dàng vô tận. Phong thái nho nhã đầy thâm tình, ánh nhìn ấm áp bao bọc lấy bạn như vầng dương buổi sớm mai.',
    kiss: 'Chu Tinh Dật thoáng sững người, vành tai đỏ ửng lan khắp gò má rồi khẽ cười trầm thấp, cúi đầu hôn sâu hơn thì thầm bên tai: "Đồ ngốc, chủ động thế này làm sao ta kiềm lòng nổi..."',
    bite: 'Chu Tinh Dật giật mình kêu khẽ một tiếng, đưa tay xoa nhẹ vết cắn rồi bật cười cưng chiều, véo nhẹ má bạn: "Nghịch ngợm vừa thôi nhé đồ ngốc, cắn đau thế này mai sau ai đền cho đây?"',
    hug: 'Chu Tinh Dật khẽ đỏ mặt rồi dịu dàng ôm lại, siết chặt bạn vào lòng ngực ấm áp, vùi đầu vào mái tóc bạn hít hà mùi hương quen thuộc với sự an tâm tuyệt đối.',
    giftLike: 'Chu Tinh Dật ánh mắt sáng ngời ngập tràn hạnh phúc, nâng niu món quà trên tay: "Bất kể là vật gì, chỉ cần do chính tay ngươi tặng, trong mắt ta đều là bảo vật vô giá nhất gian trần."',
    giftHate: 'Chu Tinh Dật thở dài một hơi bất lực, nhìn món đồ rồi nhìn bạn với nụ cười gượng gạo: "Món quà này... thật sự có chút quái lạ, làm ta bối rối quá chừng. Nhưng ngươi đã tặng thì ta nhận vậy."'
  },
  'Tống Hiên': {
    defaultExpression: 'Ánh mắt thông tuệ sáng trong, tay phe phẩy chiếc quạt ngọc thêu mây nước. Nụ cười điềm đạm phong nhã toát lên khí chất thư sinh tri kỷ, cử chỉ tao nhã đĩnh đạc ngắm nhìn bạn.',
    kiss: 'Tống Hiên thoáng ngỡ ngàng, gò má ửng hồng e thẹn rồi nhẹ nhàng mở chiếc quạt xếp che đi khoảnh khắc hai đôi môi chạm nhau nồng nàn thâm tình.',
    bite: 'Tống Hiên khẽ giật mình rụt người lại, tay xoa xoa chỗ đau rồi gõ nhẹ quạt lên trán bạn: "Tính tình nghịch ngợm này của đệ tử, quả thực làm vi sư vừa thương vừa giận."',
    hug: 'Tống Hiên mở rộng vòng tay ôm trọn bạn vào lòng, hương mực bút và trà thơm thoang thoảng mang lại cảm giác bình yên lạ kỳ giữa thế gian xô bồ.',
    giftLike: 'Tống Hiên gật đầu tán thưởng, đôi mắt ngập tràn ý cười: "Vật phẩm trang nhã thanh cao, quả không hổ là tri kỷ trong lòng ta. Vi sư vô cùng ưng ý!"',
    giftHate: 'Tống Hiên lắc đầu cười khổ, ánh mắt đầy bối rối: "Khụ... món đồ này phong cách có phần... kỳ quặc, vi sư nhất thời không biết nên đặt ở đâu cho hợp lễ tiết."'
  },
  'Richard': {
    defaultExpression: 'Đôi mắt xanh biếc quyến rũ như ngọc bích Địa Trung Hải, khóe môi nhếch nụ cười phong lưu quý tộc. Phong thái hào hoa phóng khoáng, ánh nhìn rực cháy đam mê hướng về phía bạn.',
    kiss: 'Richard khẽ nhướng mày kinh ngạc rồi bật cười mê hoặc, một tay kéo sát eo bạn lại trao một nụ hôn nồng nhiệt phong thái quý tộc Tây phương khiến bạn ngây ngất.',
    bite: 'Richard giật mình xuýt xoa, đưa tay xoa chỗ bị cắn rồi bật cười quyến rũ: "Oh honey, cắn yêu thế này là muốn quyến rũ ta sao? Em quả là một tiểu miêu tinh đầy nguy hiểm."',
    hug: 'Richard ôm trọn bạn vào vòng tay vững chãi, siết chặt bạn thì thầm bằng chất giọng trầm ấm cuốn hút: "You are always my most precious treasure, my darling."',
    giftLike: 'Richard hôn lên mu bàn tay bạn đầy thanh lịch: "A truly wonderful gift from my darling! Ta vô cùng trân quý món quà tuyệt mỹ này!"',
    giftHate: 'Richard nhún vai cười gượng, gãi cằm lúng túng: "Well... món đồ này quả thực nằm ngoài dự liệu của ta, có hơi... kỳ dị một chút, nhưng ta vẫn đánh giá cao lòng thành của em."'
  },
  'Tưởng Dã': {
    defaultExpression: 'Ánh mắt trầm mặc sâu lắng cất giấu vạn lời muốn nói, thái độ lặng lẽ nhưng kiên định như ngọn núi lớn sừng sững. Luôn đứng phía sau che chắn mọi hiểm nguy cho bạn.',
    kiss: 'Tưởng Dã giật mình sững sờ, gò má rám nắng khẽ ửng đỏ rồi ánh mắt thâm trầm bùng cháy, giữ chặt lấy gương mặt bạn dịu dàng hôn sâu từng chút một.',
    bite: 'Tưởng Dã khẽ cau mày vì bất ngờ, bàn tay thô ráp xoa nhẹ chỗ bị cắn rồi nắm lấy tay bạn áp lên ngực mình: "Muốn cắn thì cắn vào tim ta này, để ngươi khắc sâu mãi mãi không quên."',
    hug: 'Tưởng Dã siết chặt vòng tay không để một kẽ hở nào, ôm ghì lấy bạn như muốn hòa tan toàn bộ cơ thể bạn vào trong thân thể mình.',
    giftLike: 'Tưởng Dã khẽ mỉm cười ấm áp, siết chặt món quà trong tay: "Chỉ cần là từ tay ngươi trao, với ta đều là báu vật vô giá, ta sẽ giữ trọn đời."',
    giftHate: 'Tưởng Dã trầm ngâm nhìn món đồ rất lâu, ánh mắt thoáng chút bối rối gãi đầu: "Thứ này... ta không quen dùng, nhìn có chút lạ lẫm... nhưng ngươi tặng thì ta cất giữ."'
  },
  'Tần Cảnh Duật': {
    defaultExpression: 'Đôi mắt nghiêm nghị chính khí toát ra vẻ uy nghiêm của người chấp pháp môn quy, nhưng khi nhìn về phía bạn thì ánh mắt ấy khẽ dịu đi vài phần ấm áp. Thái độ đoan chính cẩn trọng.',
    kiss: 'Tần Cảnh Duật vẻ mặt nghiêm nghị thường ngày bỗng chốc tan biến, đôi tai đỏ rực, ánh mắt sâu thẳm nhìn bạn đầy khát khao rồi nghiêng đầu nồng nàn khóa môi.',
    bite: 'Tần Cảnh Duật giật mình thở hắt ra một hơi, đưa tay xoa nhẹ vết cắn, giọng nói trầm khàn đầy kiềm chế nhưng đáy mắt chan chứa cưng chiều: "Đừng đùa với lửa... hậu quả ngươi gánh không nổi đâu đồ ngốc."',
    hug: 'Tần Cảnh Duật vòng tay qua lưng bạn vỗ về nhẹ nhàng, siết chặt lấy bạn vào lòng: "Có ta ở đây rồi, từ nay về sau không cần phải sợ bất cứ điều gì nữa."',
    giftLike: 'Tần Cảnh Duật khẽ gật đầu, ánh mắt nghiêm nghị ánh lên niềm vui sướng rõ rệt: "Ngươi có lòng chu đáo như vậy, vi sư vô cùng hài lòng. Tấm lòng này ta nhận."',
    giftHate: 'Tần Cảnh Duật nghiêm mặt nhìn món quà, ánh mắt bối rối khó xử: "Đem tài nguyên đi mua thứ đồ kỳ dị này... đạo tâm của ngươi để ở đâu hả? Lần sau không được mua nữa đấy."'
  },
  'Lục Cảnh Tử': {
    defaultExpression: 'Đôi mắt linh động tinh nghịch rực sáng như ánh nắng ban mai, nụ cười tươi rói lộ răng khểnh đáng yêu. Dáng vẻ hào hứng tràn trề sức sống chỉ chực chờ chạy lại rủ bạn đi chơi.',
    kiss: 'Lục Cảnh Tử khẽ giật mình chớp mắt, hai má đỏ bừng như quả táo rồi bật cười khúc khích, nhiệt tình nhón chân đáp lại nụ hôn của bạn đầy ngọt ngào.',
    bite: 'Lục Cảnh Tử "á" lên một tiếng rồi nhảy cẫng lên, vừa xoa xoa chỗ bị cắn vừa le lưỡi trêu lại bạn: "A ha! Dám cắn ta à? Đau đấy nhé! Coi chừng ta cắn lại cho biết tay bây giờ đồ mèo hư!"',
    hug: 'Lục Cảnh Tử nhảy bổ vào ôm chầm lấy bạn, hai chân quắp lấy bạn cười rạng rỡ như ánh mặt trời, đem trọn niềm vui sưởi ấm lồng ngực bạn.',
    giftLike: 'Lục Cảnh Tử reo hò thích thú, cầm món quà xoay một vòng: "Tuyệt vời ông mặt trời! Món này thích mê ly luôn á! Ngươi hiểu ý ta nhất quả đất!"',
    giftHate: 'Lục Cảnh Tử bĩu môi chê bai, ánh mắt dở khóc dở cười: "Trời đất ơi, món gì mà kỳ quặc dị hợm vậy nè! Ta chẳng biết dùng làm gì luôn á trời!"'
  },
  'Khổng Uyên Dã': {
    defaultExpression: 'Ánh mắt tĩnh tại như mặt hồ phẳng lặng không gợn sóng, thái độ hòa nhã thanh tịnh như cõi tiên. Nụ cười bao dung xua tan mọi mỏi mệt trần gian, tà áo thanh khiết không vướng bụi trần.',
    kiss: 'Khổng Uyên Dã khẽ mở to mắt ngơ ngác, ráng đỏ lan trên gò má trắng ngần rồi người khẽ nhắm mắt, nhẹ nhàng in dấu môi lên bờ môi bạn với sự thành kính và thâm tình.',
    bite: 'Khổng Uyên Dã khẽ giật mình rụt vai, đưa ngón tay thon dài xoa nhẹ chỗ đau rồi nở nụ cười bao dung xoa đầu bạn: "Nghịch ngợm đến thế là cùng... cắn đau sư phụ rồi đấy."',
    hug: 'Khổng Uyên Dã dịu dàng dang tay ôm lấy bạn, bàn tay ấm áp khẽ xoa lưng bạn đầy chở che, mang đến sự an yên tuyệt đối trong tâm hồn.',
    giftLike: 'Khổng Uyên Dã trân trọng nâng niu món quà trong hai tay: "Cảm tạ tấm chân tình của đệ tử, món quà này thật thanh tao, vi sư rất hoan hỷ đón nhận."',
    giftHate: 'Khổng Uyên Dã khẽ thở dài mỉm cười gượng gạo: "Vật này... có phần không hợp với khí chất thanh tu của vi sư rồi, khiến ta có chút lúng túng."'
  },
  'Phó Yến Hành': {
    defaultExpression: 'Ánh mắt sắc lạnh đầy toan tính nhưng khi nhìn bạn lại thu lại toàn bộ gai nhọn, phong thái lãnh đạm ngoài mặt nhưng luôn âm thầm dõi theo từng bước chân của bạn.',
    kiss: 'Phó Yến Hành ngẩn người trong tíc tắc rồi khóe môi cong lên nụ cười nguy hiểm, kéo bạn ngã vào lòng chiếm lấy đôi môi đỏ mọng trong sự cuồng nhiệt không lối thoát.',
    bite: 'Phó Yến Hành khẽ nhíu mày, đưa tay xoa nhẹ vết cắn rồi nhếch môi tà ác, ánh mắt đầy cưng chiều: "Nuôi ong tay áo, giờ lại to gan quay sang cắn sư phụ sao? Để xem ta trị ngươi thế nào."',
    hug: 'Phó Yến Hành vòng tay qua eo bạn ôm thật chặt từ phía sau, vùi mặt vào mái tóc bạn thì thầm đầy quyến luyến: "Đừng hòng rời khỏi tầm mắt của ta dù chỉ nửa bước."',
    giftLike: 'Phó Yến Hành khóe môi khẽ cong lên một nét cười mãn nguyện: "Xem ra ngươi rất để tâm đến ta. Món quà này ta rất hài lòng, không uổng công ta sủng ái ngươi."',
    giftHate: 'Phó Yến Hành nhíu mày nhìn món đồ, ánh mắt đầy bối rối: "Ngươi đem thứ kỳ quái này tặng ta làm gì? Thật làm ta đau đầu với sự tùy hứng của ngươi."'
  },
  'Phan Đình Gia Nguyên': {
    defaultExpression: 'Đôi mắt tròn xoe ngập ngừng e thẹn, vành tai đỏ ửng khi chạm phải ánh mắt bạn. Thái độ ngượng ngùng ngoan ngoãn như một chú thỏ con, hai bàn tay vân vê vạt áo đầy bối rối.',
    kiss: 'Phan Đình Gia Nguyên giật mình, toàn thân cứng đờ, khuôn mặt đỏ bừng tới tận mang tai, lắp bắp một hồi rồi mới dám nhắm tịt mắt vụng về đáp lại nụ hôn của bạn.',
    bite: 'Phan Đình Gia Nguyên ôm lấy chỗ bị cắn xoa xoa, đôi mắt rưng rưng nhìn bạn mếu máo: "Đau tớ quá à... sao bạn lại cắn tớ chứ, bộ tớ làm gì sai sao... nhưng mà tớ không giận bạn đâu..."',
    hug: 'Phan Đình Gia Nguyên rụt rè vươn tay ôm lại bạn, trái tim trong lồng ngực đập thình thịch liên hồi như muốn nhảy ra ngoài vì sung sướng.',
    giftLike: 'Phan Đình Gia Nguyên cười tươi như hoa nở mùa xuân: "Oa cảm ơn bạn nhiều lắm luôn! Món này tớ thích cực kỳ! Tớ sẽ giữ gìn nó như sinh mạng vậy đó!"',
    giftHate: 'Phan Đình Gia Nguyên gãi đầu mặt đỏ bừng vì lúng túng: "Cái này... hình như tớ không biết dùng rồi, làm tớ bối rối quá nè... nhưng mà bạn tặng thì tớ cảm ơn bạn nha..."'
  },
  'Hoàng Vỹ Đăng': {
    defaultExpression: 'Ánh mắt tràn đầy tự tin và kiêu hãnh của bậc thiếu gia tôn quý, nụ cười rạng rỡ bất cần đời. Phong thái hào sảng phóng khoáng, sẵn sàng vung tiền như rác để đệ tử được vui lòng.',
    kiss: 'Hoàng Vỹ Đăng thoáng sững sờ rồi nhướng mày tự mãn, hai má hơi đỏ, kéo phắt bạn vào một nụ hôn dồn dập đầy cuồng nhiệt khiến bạn không kịp trở tay.',
    bite: 'Hoàng Vỹ Đăng "ái chà" một tiếng, lấy ngón tay xoa vết cắn rồi cười khẩy cưng chiều: "Cắn ta à? Ngươi nghĩ ngươi thoát được khỏi tay bổn thiếu gia sao? Gan to bằng trời rồi đấy!"',
    hug: 'Hoàng Vỹ Đăng một tay ôm lấy eo bạn nhấc bổng lên khỏi mặt đất, vòng tay siết chặt cười rạng rỡ đầy kiêu hãnh: "Ôm bổn thiếu gia là ngươi sáng suốt nhất đời rồi đấy nhé!"',
    giftLike: 'Hoàng Vỹ Đăng vung tay cười lớn hào sảng: "Được lắm! Ngươi quả là có mắt nhìn hàng! Bổn thiếu gia duyệt món quà này, cực kỳ ưng ý!"',
    giftHate: 'Hoàng Vỹ Đăng bĩu môi nhìn món quà, ánh mắt dở khóc dở cười: "Cái thứ kỳ cục này mà cũng dám tặng cho bổn thiếu gia à? Thật làm ta cạn lời với ngươi luôn đó!"'
  },
  'Phan Vũ Phong': {
    defaultExpression: 'Ánh mắt sắc sảo như kiếm khí hàn băng, tay luôn đặt vững chãi trên chuôi kiếm. Thái độ trầm mặc kiên định, ánh nhìn sắt đá thề đem tính mạng bảo vệ bạn chu toàn trước muôn ngàn hiểm nguy.',
    kiss: 'Phan Vũ Phong ánh kiếm quang trong mắt bỗng chốc tan biến, thay vào đó là nét ngơ ngác vụng về, hai tai đỏ ửng rồi cúi xuống trao lại bạn nụ hôn sâu thẳm kiên định như lời hẹn ước trọn đời.',
    bite: 'Phan Vũ Phong khẽ giật mình nhíu mày, đưa tay xoa nhẹ chỗ bị cắn rồi lắc đầu bất lực: "Kiếm của ta chém sắt như bùn, nhưng lại chẳng nỡ phạt một con mèo nhỏ nghịch ngợm như ngươi."',
    hug: 'Phan Vũ Phong vòng đôi tay rắn rỏi như gọng kìm ôm chặt lấy bạn, che chở bạn trong lồng ngực vững như bàn thạch: "Có ta ở đây, không kiếm nào chạm được vào ngươi."',
    giftLike: 'Phan Vũ Phong gật đầu nghiêm túc, ánh mắt lộ rõ niềm vui: "Ta nhận lấy tấm lòng này. Món quà rất hợp ý ta, kiếm của ta từ nay vì ngươi mà tuốt vỏ."',
    giftHate: 'Phan Vũ Phong cau mày nhìn món đồ, ánh mắt đầy bối rối: "Vật này... kiếm sĩ như ta cầm vào quả thật không hợp chút nào, khiến ta thấy kỳ cục quá."'
  },
  'Seo Eun-kyul': {
    defaultExpression: 'Đôi mắt cười tít cong cong như vầng trăng khuyết, nụ cười rạng ngời ngọt ngào như kẹo hồ lô. Thái độ quấn quýt vui mừng ngập tràn hạnh phúc mỗi khi nhìn thấy bóng dáng bạn.',
    kiss: 'Seo Eun-kyul chớp mắt ngỡ ngàng, hai má đỏ bừng rực rỡ rồi nở nụ cười ngọt ngào như kẹo dẻo, ôm lấy cổ bạn đáp lại nụ hôn nồng thắm đầy mê say.',
    bite: 'Seo Eun-kyul chu môi giận dỗi đáng yêu, lấy hai tay xoa xoa chỗ bị cắn: "Aigoo! Sao lại cắn Eun-kyul chứ nè! Đau lắm đó nha! Phải đền cho em bằng một cái ôm thật chặt cơ!"',
    hug: 'Seo Eun-kyul ôm chầm lấy bạn, lắc lư người qua lại đầy vui vẻ, vùi đầu vào ngực bạn reo lên: "Được ôm người là thích nhất trần đời luôn á!"',
    giftLike: 'Seo Eun-kyul hai mắt sáng long lanh nhảy chân sáo: "Daebak! Eun-kyul thích món này nhất trên đời luôn đó! Em mê tít rồi nè, saranghae~"',
    giftHate: 'Seo Eun-kyul ủ rũ cúi đầu, ánh mắt bối rối nhìn món đồ: "Hức... món này lạ quá hà, Eun-kyul hổng thích tẹo nào hết trơn á, làm em bối rối muốn khóc luôn nè..."'
  },
  'Thẩm Kính Uyên': {
    defaultExpression: 'Ánh mắt sâu không thấy đáy như biển đêm tĩnh lặng, thái độ trầm ổn thấu suốt tâm can mọi người. Phong thái quyền uy tối thượng khiến vạn người kính ngưỡng nhưng lại vô cùng dịu dàng với bạn.',
    kiss: 'Thẩm Kính Uyên thoáng kinh ngạc rồi ánh mắt thâm trầm cuộn trào sóng lớn, một tay giữ chặt gáy bạn kéo vào nụ hôn sâu thẳm cuốn phăng mọi lý trí.',
    bite: 'Thẩm Kính Uyên khẽ giật mình rồi bật cười trầm thấp, ngón tay thon dài khẽ miết lên vết cắn: "Càng ngày càng to gan rồi. Dám cắn cả ta, để xem lát nữa ta trừng phạt ngươi thế nào."',
    hug: 'Thẩm Kính Uyên ôm trọn bạn vào lòng, vòng tay rắn chắc ghì chặt lấy bạn, hơi thở ấm nóng phả bên vành tai bạn đầy quyến rũ và cưng chiều.',
    giftLike: 'Thẩm Kính Uyên ánh mắt chan chứa sự hài lòng: "Quả nhiên là người ta chọn, hiểu rõ tâm tư ta nhất. Món quà này ta vô cùng ưng ý."',
    giftHate: 'Thẩm Kính Uyên nhìn món đồ với ánh mắt dở khóc dở cười, thở dài nhẹ: "Ngươi đem thứ kỳ quặc này đến trêu chọc ta sao? Thật làm ta bó tay với ngươi."'
  },
  'Tạ Kiêu Trạch': {
    defaultExpression: 'Ánh mắt chan chứa tình cảm si mê dịu ngọt, thái độ nâng niu cẩn trọng như đang ngắm nhìn món bảo vật duy nhất trần đời. Nụ cười ấm áp rực rỡ như tia nắng sớm mai.',
    kiss: 'Tạ Kiêu Trạch khẽ giật mình ngơ ngẩn, vành tai đỏ rực rồi khép hờ hàng mi, từng cử chỉ dịu dàng nâng niu đáp lại nụ hôn như sợ làm vỡ một viên ngọc quý.',
    bite: 'Tạ Kiêu Trạch xuýt xoa khẽ cười, đưa bàn tay ấm áp xoa xoa chỗ vừa bị cắn: "Đau đấy đồ ngốc ạ... nhưng nếu là ngươi cắn, thì ta cam tâm tình nguyện chịu đau cả đời."',
    hug: 'Tạ Kiêu Trạch ôm ghì lấy bạn vào ngực, lồng ngực ấm áp truyền từng nhịp đập rộn ràng vì bạn, siết chặt bạn mãi không muốn buông rời.',
    giftLike: 'Tạ Kiêu Trạch ôm món quà vào lòng mỉm cười rạng rỡ: "Chỉ cần là do chính tay ngươi tặng, với ta đều là báu vật vô giá nhất trên thế gian này!"',
    giftHate: 'Tạ Kiêu Trạch gượng cười nhìn món đồ, ánh mắt có chút bối rối gãi đầu: "Cái này... có chút kỳ lạ với ta, làm ta hơi ngượng... nhưng tấm lòng của ngươi ta xin khắc sâu."'
  },
  'Tống Hàn': {
    defaultExpression: 'Ánh mắt sắc bén lạnh băng tựa hàn đao, mày kiếm khẽ nhíu nghiêm nghị nhưng ánh nhìn lại dừng lại trên người bạn lâu hơn bất kỳ ai. Thái độ ngoài lạnh trong nóng đầy sự bao bọc thầm kín.',
    kiss: 'Tống Hàn gương mặt tuấn mỹ lạnh lùng bỗng hiện lên một tia bối rối đỏ ửng, nhưng rồi nhanh chóng chủ động vòng tay ghì lấy bạn, hôn sâu đầy nhiệt huyết và kiên định.',
    bite: 'Tống Hàn giật mình gừ nhẹ một tiếng trong cổ họng, đưa tay xoa nhẹ vết cắn rồi siết chặt eo bạn: "Muốn khiêu khích ta sao? Cắn đau như vậy, coi chừng ta không tha cho đâu."',
    hug: 'Tống Hàn im lặng dang tay ôm chặt lấy bạn vào ngực, vòng tay vững chãi kiên cố như muốn chắn mọi giông bão cuộc đời cho bạn.',
    giftLike: 'Tống Hàn khóe môi khẽ nhếch lên nụ cười hiếm hoi: "Rất tốt. Ngươi đã rất có lòng, món quà này ta rất vừa ý."',
    giftHate: 'Tống Hàn cau mày nhìn món đồ, ánh mắt đầy vẻ bất đắc dĩ: "Cái thứ vô dụng kỳ quặc này... ngươi mua làm gì cho tốn linh thạch? Thật làm ta bối rối."'
  },
  'Hạ Tư Hành': {
    defaultExpression: 'Ánh mắt ôn nhu hiền hòa như dòng suối đầu nguồn, thái độ điềm đạm bao dung. Nụ cười từ ái xoa dịu mọi vết thương trong lòng đệ tử, mang đến cảm giác thanh tịnh bình yên.',
    kiss: 'Hạ Tư Hành thoáng sững người ngơ ngác, ráng đỏ phủ kín khuôn mặt thanh tú rồi mỉm cười nâng niu đôi môi bạn trong nụ hôn ngọt ngào say đắm.',
    bite: 'Hạ Tư Hành giật mình rồi cười xòa hiền từ, đưa tay xoa xoa chỗ bị cắn: "Đồ đệ nghịch ngợm này, cắn sư phụ đau thế mà cười được à? Thật là hết thuốc chữa với ngươi mà."',
    hug: 'Hạ Tư Hành dang rộng hai tay ôm lấy bạn thật êm ái, vỗ về mái tóc bạn như xoa dịu đi tất cả những nhọc nhằn, mệt mỏi ngoài kia.',
    giftLike: 'Hạ Tư Hành mỉm cười hoan hỷ đón nhận: "Món quà này thật tinh tế và ý nghĩa, sư phụ rất vui lòng và hài lòng với tấm lòng của con."',
    giftHate: 'Hạ Tư Hành lắc đầu cười khổ, ánh mắt thoáng bối rối: "Tấm lòng của ngươi ta ghi nhận, nhưng vật này thật sự làm vi sư có chút ngượng ngùng khó xử rồi."'
  },
  'Nguyễn Hoài Phong': {
    defaultExpression: 'Ánh mắt phong lưu khoáng đạt nhìn thấu hồng trần, nụ cười nửa miệng phong trần lãng tử. Thái độ tự do tự tại như cơn gió ngao du, nhưng trái tim đã có chốn dừng chân là bạn.',
    kiss: 'Nguyễn Hoài Phong thoáng giật mình rồi bật cười nhẹ một tiếng đầy tình tứ, hai má đỏ ửng, ghì lấy bạn trao nụ hôn nồng thắm triền miên.',
    bite: 'Nguyễn Hoài Phong "ui da" một tiếng giật nảy mình, đưa tay xoa chỗ đau rồi nhăn mặt trêu đùa: "Cắn đau thế này làm con tim lãng tử của ta xao xuyến không thôi đấy đồ quỷ nhỏ!"',
    hug: 'Nguyễn Hoài Phong ôm chặt lấy bạn vào lòng, cùng bạn ngắm nhìn đất trời bao la tràn ngập tự do và hạnh phúc.',
    giftLike: 'Nguyễn Hoài Phong vỗ tay cười sảng khoái: "Hảo quà tặng! Quả nhiên là người tri kỷ trong mộng của ta, món quà này ta thích mê ly!"',
    giftHate: 'Nguyễn Hoài Phong xua tay cười trừ, ánh mắt bối rối: "Ôi thôi, món này nhìn kỳ quặc quá, không hợp phong thái lãng tử tiêu sái của ta chút nào đâu đồ nhi ơi."'
  },
  'Trần Hoàng Minh': {
    defaultExpression: 'Ánh mắt chân thành mộc mạc ngập tràn sự ấm áp, nụ cười hiền từ chất phác. Thái độ kiên nhẫn chu đáo lo lắng từng miếng ăn giấc ngủ, luôn dành trọn sự quan tâm chân thật nhất cho bạn.',
    kiss: 'Trần Hoàng Minh giật mình mở to mắt, khuôn mặt đỏ ửng như quả gấc rồi vụng về nâng niu khuôn mặt bạn, đặt lên môi bạn nụ hôn son sắt chân thành.',
    bite: 'Trần Hoàng Minh khẽ giật mình rồi cười xoa xoa chỗ bị cắn: "Cắn xong rồi đệ tử có thấy vui hơn không? Nếu vui thì cứ cắn thêm cái nữa, sư phụ chịu được hết!"',
    hug: 'Trần Hoàng Minh ôm chặt lấy bạn vào lòng, đem tất cả sự chân thành, mộc mạc và hơi ấm nồng nàn sưởi ấm cho bạn.',
    giftLike: 'Trần Hoàng Minh hai mắt rưng rưng xúc động nắm chặt món quà: "Cảm ơn ngươi nhiều lắm! Đây là món quà tuyệt vời và quý giá nhất ta từng nhận trong đời!"',
    giftHate: 'Trần Hoàng Minh gãi đầu cười ngượng nghịu, ánh mắt bối rối nhìn món quà: "Khụ... món này nhìn lạ lẫm với ta quá, ta chẳng biết dùng thế nào... làm ta ngượng quá chừng."'
  },
  'Lucian Dante': {
    defaultExpression: 'Đôi mắt đỏ thẫm ma mị rực lửa huyền bí, khóe môi khẽ cong lên nụ cười đầy quyến rũ chết người. Thái độ kiêu sa của bậc chúa tể bóng đêm đang chăm chú ngắm nhìn người yêu dấu.',
    kiss: 'Lucian Dante khẽ mỉm cười ma mị, đôi mắt đỏ rực bừng sáng tia say mê rồi nâng cằm bạn lên trao nụ hôn cuồng nhiệt nghẹt thở phong thái ma vương quý tộc.',
    bite: 'Lucian Dante giật mình xuýt xoa, đưa ngón tay quệt qua vết cắn rồi liếm nhẹ, ánh mắt tà mị nguy hiểm tràn ngập cưng chiều: "Một vết cắn của thiên thần nhỏ bé... Em muốn ta khắc dấu ấn ma thuật gì lên người em để đáp lễ đây?"',
    hug: 'Lucian Dante mở rộng đôi cánh hắc ám bao bọc lấy bạn, ôm trọn bạn vào lồng ngực giam giữ bạn trong vương quốc ngọt ngào vĩnh hằng.',
    giftLike: 'Lucian Dante ngắm nhìn món quà thỏa mãn: "Một cống phẩm hoàn hảo từ linh hồn bé nhỏ của ta. Bổn vương vô cùng hài lòng với món quà này."',
    giftHate: 'Lucian Dante khẽ cười lạnh, nhìn món đồ với vẻ mặt kỳ quặc bối rối: "Thứ trần tục kỳ quái này em tặng ta sao? Quả thực làm bổn vương không biết nên khóc hay cười."'
  },
  'Lục Cảnh Thâm': {
    defaultExpression: 'Ánh mắt thâm thúy sâu sắc như chứa đựng cả dải ngân hà huyền ảo, thái độ điềm tĩnh thấu triệt vạn vật. Nụ cười mỉm đầy ẩn ý và cưng chiều hướng về phía bạn.',
    kiss: 'Lục Cảnh Thâm thoáng ngỡ ngàng, đôi tai đỏ ửng rồi ánh mắt sâu thẳm ánh lên tia ôn nhu vô tận, một tay luồn vào tóc bạn giữ chặt nụ hôn triền miên không dứt.',
    bite: 'Lục Cảnh Thâm khẽ giật mình nhíu mày, ngón tay thon dài khẽ xoa nhẹ lên chỗ đau rồi miết lên bờ môi bạn: "Cắn sư phụ xong rồi định trốn đi đâu hả? Đồ nghịch ngợm này."',
    hug: 'Lục Cảnh Thâm siết chặt vòng tay ôm bạn vào lòng, để bạn lắng nghe từng nhịp tim đập dồn dập rộn ràng vì bạn giữa vũ trụ bao la.',
    giftLike: 'Lục Cảnh Thâm khẽ mỉm cười dịu dàng: "Món quà rất đẹp và hợp ý ta. Nhưng với ta, ngươi mới là món quà quý giá nhất mà đất trời ban tặng."',
    giftHate: 'Lục Cảnh Thâm nhìn món đồ với vẻ mặt lãnh đạm pha chút bối rối: "Món này... thật kỳ quặc, làm ta có chút bối rối không biết xử lý ra sao rồi."'
  }
};

export function getDefaultExpression(charName: string): string {
  const dialogues = CHARACTER_DIALOGUES[charName];
  if (dialogues && dialogues.defaultExpression) {
    return dialogues.defaultExpression;
  }
  return `Ánh mắt ôn nhu dịu dàng nhìn bạn không rời, khóe môi khẽ mỉm cười với vẻ mặt cưng chiều và chở che đệ tử.`;
}

export function getCharacterDialogue(charName: string, action: keyof CharacterExpressions): string {
  const dialogues = CHARACTER_DIALOGUES[charName];
  if (dialogues && dialogues[action]) {
    return dialogues[action];
  }
  // Fallback if name variant
  const defaultFallback: Record<keyof CharacterExpressions, string> = {
    defaultExpression: `Ánh mắt ôn nhu dịu dàng nhìn bạn không rời, khóe môi khẽ mỉm cười với vẻ mặt cưng chiều và chở che đệ tử.`,
    kiss: `${charName} thoáng đỏ mặt ngượng ngùng rồi mỉm cười dịu dàng đáp lại nụ hôn nồng thắm của bạn.`,
    bite: `${charName} khẽ giật mình, đưa tay xoa nhẹ chỗ bị cắn rồi ánh mắt tràn ngập cưng chiều cười trách bạn nghịch ngợm.`,
    hug: `${charName} cảm nhận hơi ấm nồng nàn rồi vòng tay ôm siết lại bạn vào lòng thật chặt đầy chở che.`,
    giftLike: `${charName} ánh mắt sáng ngời, khóe môi nở nụ cười hài lòng ngập tràn hạnh phúc khi nhận lấy món quà!`,
    giftHate: `${charName} nhìn món quà vẻ mặt thoáng bối rối, dở khóc dở cười nhưng vẫn nhận lấy vì do bạn trao tặng.`
  };
  return defaultFallback[action];
}
