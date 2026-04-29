export const WORD_PAIRS = [
  ["Bã mía", "Caramel"],
  ["Rau má", "Đường tàu"],
  ["Nem chua", "Tài Lộc"],
  ["Quạt máy", "Trực Thăng"],
  ["Fixed Gear", "Dream"],
  ["Baby oil", "Kem trộn"],
  ["Máy bay", "Phú bà"],
  ["Cảnh sát", "Xe độ"],
  ["Minecraft", "Roblox"],
  ["Ong", "Bim bím"],
  ["Phở", "Bánh mì"],
  ["Bánh mì", "Hamburger"],
  ["Bóng đá", "Bóng rổ"],
  ["Peter Griffin", "Peter Parker"],
  ["Bàn là", "Mẹ bạn"],
  ["Sơn Tùng M-TP", "Jack"],
  ["Dưa hấu", "Bưởi"],

  ["Con Voi", "GIÁN ĐIỆP \n Gợi ý: Màu xám"],
  ["Youtube", "GIÁN ĐIỆP \n Gợi ý: Nền tảng xem video"],
  ["Metro", "GIÁN ĐIỆP \n Gợi ý: Nhanh"],
  ["Sữa", "GIÁN ĐIỆP \n Gợi ý: Màu trắng hoặc ngả vàng"],
  ["Rạp chiếu phim", "GIÁN ĐIỆP \n Gợi ý: Dễ bị quay lén"],
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
