export const WORD_PAIRS = [
  ["Bút bi", "Bút chì"],
  ["Quạt máy", "Máy lạnh"],
  ["Xe máy", "Xe đạp"],
  ["Tàu hỏa", "Tàu thủy"],
  ["Máy bay", "Trực thăng"],
  ["Giáo viên", "Giám thị"],
  ["Cảnh sát", "Bảo vệ"],
  ["Bãi biển", "Hồ bơi"],
  ["Free Fire", "PUBG"],
  ["Minecraft", "Roblox"],
  ["Facebook", "Instagram"],
  ["Iron Man", "Batman"],
  ["Ong", "Bướm"],
  ["Phở", "Bún bò"],
  ["Bánh mì", "Hamburger"],
  ["Trà sữa", "Cà phê"],
  ["Bóng đá", "Bóng rổ"],
  ["Guitar", "Piano"],
  ["Áo sơ mi", "Áo thun"],
  ["iPhone", "Samsung"],
  ["Sách", "Vở"],
  ["Chó", "Mèo"],
  ["Kính cận", "Kính râm"],
  ["Mặt trời", "Mặt trăng"],
  ["Sông", "Biển"],
  ["Vàng", "Bạc"],
  ["Mưa", "Tuyết"],
  ["Máy tính", "Điện thoại"],
  ["Tai nghe", "Loa"],
  ["Bàn", "Ghế"],
  ["Sơn Tùng M-TP", "Jack"],
  ["Lẩu", "Nướng"],
  ["Dưa hấu", "Bưởi"],
  ["Đồng hồ", "Vòng tay"],
  ["Vali", "Balo"],


  ["Con Voi", "GIÁN ĐIỆP \n Gợi ý: Động vật có vòi"],
  ["Hà Nội", "GIÁN ĐIỆP \n Gợi ý: Thủ đô"],
  ["Youtube", "GIÁN ĐIỆP \n Gợi ý: Nền tảng xem video"],
  ["Mì tôm", "GIÁN ĐIỆP \n Gợi ý: Đồ ăn nhanh"],
  ["Học sinh", "GIÁN ĐIỆP \n Gợi ý: Một nghề nghiệp"],
  ["Sữa tươi", "GIÁN ĐIỆP \n Gợi ý: Đồ uống bổ dưỡng"],
  ["Rạp chiếu phim", "GIÁN ĐIỆP \n Gợi ý: Nơi xem phim"],
  ["Thẻ ATM", "GIÁN ĐIỆP \n Gợi ý: Dùng để rút tiền"],
  ["Hồ Chí Minh", "GIÁN ĐIỆP \n Gợi ý: Một vị lãnh tụ"],
  ["Bóng chuyền", "GIÁN ĐIỆP \n Gợi ý: Một môn thể thao"],
];

export function pickRandomWordPair(): { word1: string; word2: string } {
  const randomIndex = Math.floor(Math.random() * WORD_PAIRS.length);
  const pair = WORD_PAIRS[randomIndex];
  // Randomize order so spy doesn't always get the second word
  if (Math.random() > 0.5) {
    return { word1: pair[0], word2: pair[1] };
  }
  return { word1: pair[1], word2: pair[0] };
}
