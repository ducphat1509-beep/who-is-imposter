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
