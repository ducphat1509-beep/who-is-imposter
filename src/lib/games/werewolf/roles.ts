import { GameTeam } from "@/types/game";

export type WerewolfRoleId =
  | "villager"
  | "witch"
  | "knight"
  | "seer"
  | "guard"
  | "hunter"
  | "cupid"
  | "fool"
  | "maid"
  | "captain_guard"
  | "werewolf"
  | "gentleman_wolf"
  | "alpha_wolf"
  | "wolf_seer"
  | "black_wolf"
  | "ice_wolf"
  | "fire_wolf"
  | "cub_wolf"
  | "cursed_wolf"
  | "converter_wolf"
  | "hidden_wolf"
  | "smoke_wolf"
  | "white_wolf";

export interface WerewolfRole {
  id: WerewolfRoleId;
  name: string;
  team: GameTeam;
  factionLabel: string;
  nightOrder?: number;
  wakesAtNight: boolean;
  cardText: string;
  description: string;
  sourceSheet: string;
  cardImage: string;
  alternateCardImage?: string;
  audioCue?: string;
}

const cardPath = (fileName: string) => `/assets/werewolf/cards/${fileName}.png`;

export const WEREWOLF_ROLES: Record<WerewolfRoleId, WerewolfRole> = {
  villager: {
    id: "villager",
    name: "Dân làng",
    team: "VILLAGE",
    factionLabel: "Phe Dân",
    wakesAtNight: false,
    cardText: "Không có kỹ năng ban đêm. Sống bằng trực giác, drama và khả năng chỉ nhầm người.",
    description: "Không có chức năng đặc biệt, thắng bằng tranh luận và vote.",
    sourceSheet: "ma-soi-role-card-concept-v1.png",
    cardImage: cardPath("dan-lang"),
    alternateCardImage: cardPath("dan-lang-sketch-alt"),
  },
  witch: {
    id: "witch",
    name: "Phù thủy",
    team: "VILLAGE",
    factionLabel: "Phe Dân",
    nightOrder: 25,
    wakesAtNight: true,
    cardText: "Có 1 bình cứu và 1 bình độc. Dùng xong là hết phép.",
    description: "Có 2 bình thuốc: cứu một nạn nhân và giết một người, mỗi bình dùng một lần.",
    sourceSheet: "ma-soi-role-sheet-villagers-v1.png",
    cardImage: cardPath("phu-thuy"),
  },
  knight: {
    id: "knight",
    name: "Hiệp sĩ",
    team: "VILLAGE",
    factionLabel: "Phe Dân",
    wakesAtNight: false,
    cardText: "Lộ diện để chém 1 người. Chém nhầm dân thì đi cùng luôn.",
    description: "Ban ngày có thể lộ diện giết một người. Nếu giết nhầm phe Dân, Hiệp sĩ chết theo.",
    sourceSheet: "ma-soi-role-sheet-villagers-v1.png",
    cardImage: cardPath("hiep-si"),
  },
  seer: {
    id: "seer",
    name: "Tiên tri",
    team: "VILLAGE",
    factionLabel: "Phe Dân",
    nightOrder: 30,
    wakesAtNight: true,
    cardText: "Mỗi đêm soi vai trò 1 người. Biết nhiều quá thì dễ bị cắn.",
    description: "Mỗi đêm kiểm tra vai trò hoặc phe của một người chơi.",
    sourceSheet: "ma-soi-role-sheet-villagers-v1.png",
    cardImage: cardPath("tien-tri"),
  },
  guard: {
    id: "guard",
    name: "Bảo vệ",
    team: "VILLAGE",
    factionLabel: "Phe Dân",
    nightOrder: 20,
    wakesAtNight: true,
    cardText: "Mỗi đêm che chắn 1 người. Không bảo vệ cùng người 2 đêm liền.",
    description: "Mỗi đêm bảo vệ một người khỏi Sói cắn, không chọn cùng mục tiêu hai đêm liên tiếp.",
    sourceSheet: "ma-soi-role-sheet-villagers-v1.png",
    cardImage: cardPath("bao-ve"),
  },
  hunter: {
    id: "hunter",
    name: "Thợ săn",
    team: "VILLAGE",
    factionLabel: "Phe Dân",
    wakesAtNight: false,
    cardText: "Chết là bắn trả. Đừng đứng gần lúc ổng cay.",
    description: "Khi chết do bị cắn hoặc treo cổ, được bắn chết một người khác.",
    sourceSheet: "ma-soi-role-sheet-special-v1.png",
    cardImage: cardPath("tho-san"),
  },
  cupid: {
    id: "cupid",
    name: "Cupid",
    team: "VILLAGE",
    factionLabel: "Phe Dân",
    nightOrder: 5,
    wakesAtNight: true,
    cardText: "Đêm đầu ghép 2 người yêu nhau. Một chết, người kia đi theo.",
    description: "Đêm đầu chọn hai người yêu nhau; nếu một người chết, người kia chết theo.",
    sourceSheet: "ma-soi-role-sheet-special-v1.png",
    cardImage: cardPath("cupid"),
  },
  fool: {
    id: "fool",
    name: "Thằng ngu",
    team: "VILLAGE",
    factionLabel: "Phe Dân",
    wakesAtNight: false,
    cardText: "Bị treo thì lật bài sống tiếp. Sau đó mất quyền vote.",
    description: "Nếu bị treo cổ lần đầu, không chết nhưng mất quyền bỏ phiếu về sau.",
    sourceSheet: "ma-soi-role-sheet-special-v1.png",
    cardImage: cardPath("thang-ngu"),
  },
  maid: {
    id: "maid",
    name: "Người hầu gái",
    team: "VILLAGE",
    factionLabel: "Phe Dân",
    nightOrder: 15,
    wakesAtNight: true,
    cardText: "Theo hầu 1 người quan trọng. Chủ chết thì hết việc.",
    description: "Gắn với một role quan trọng, hỗ trợ hoặc bảo vệ nhẹ. Khi chủ chết, mất chức năng.",
    sourceSheet: "ma-soi-role-sheet-support-v1.png",
    cardImage: cardPath("nguoi-hau-gai"),
  },
  captain_guard: {
    id: "captain_guard",
    name: "Cảnh vệ trưởng",
    team: "VILLAGE",
    factionLabel: "Phe Dân",
    nightOrder: 35,
    wakesAtNight: true,
    cardText: "Một lần ra tay trong đêm. Chém nhầm dân thì tự xử.",
    description: "Một lần trong game, ban đêm có thể giết một người. Nếu giết nhầm phe Dân, tự sát.",
    sourceSheet: "ma-soi-role-sheet-support-v1.png",
    cardImage: cardPath("canh-ve-truong"),
  },
  werewolf: {
    id: "werewolf",
    name: "Ma Sói",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    nightOrder: 10,
    wakesAtNight: true,
    cardText: "Mỗi đêm cùng bầy chọn 1 người để cắn.",
    description: "Sói cơ bản, dậy cùng bầy để thống nhất giết một người mỗi đêm.",
    sourceSheet: "ma-soi-role-sheet-wolves-v1.png",
    cardImage: cardPath("ma-soi"),
  },
  gentleman_wolf: {
    id: "gentleman_wolf",
    name: "Sói đội mũ",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    nightOrder: 10,
    wakesAtNight: true,
    cardText: "Mỗi đêm chọn 1 người để cắn. Ban ngày giả vờ lịch sự, càng đội mũ càng đáng nghi.",
    description: "Sói cơ bản phiên bản inside joke/quý ông đáng nghi.",
    sourceSheet: "ma-soi-role-card-concept-v1.png",
    cardImage: cardPath("soi-doi-mu"),
  },
  alpha_wolf: {
    id: "alpha_wolf",
    name: "Sói đầu đàn",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    nightOrder: 10,
    wakesAtNight: true,
    cardText: "Phiếu săn bằng 2. Cãi nhau thì nó chốt.",
    description: "Phiếu chọn mục tiêu có giá trị cao hơn; có quyền quyết định khi bầy không thống nhất.",
    sourceSheet: "ma-soi-role-sheet-wolves-v1.png",
    cardImage: cardPath("soi-dau-dan"),
  },
  wolf_seer: {
    id: "wolf_seer",
    name: "Sói tiên tri",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    nightOrder: 12,
    wakesAtNight: true,
    cardText: "Mỗi đêm soi vai trò 1 người. Biết để cắn cho đúng.",
    description: "Sói có khả năng soi vai trò người chơi khác.",
    sourceSheet: "ma-soi-role-sheet-wolves-v1.png",
    cardImage: cardPath("soi-tien-tri"),
  },
  black_wolf: {
    id: "black_wolf",
    name: "Sói đen",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    nightOrder: 14,
    wakesAtNight: true,
    cardText: "Nguyền 1 người. Chết rồi có thể hóa sói.",
    description: "Nguyền một người; người bị nguyền khi chết có thể gia nhập phe Sói.",
    sourceSheet: "ma-soi-role-sheet-wolves-v1.png",
    cardImage: cardPath("soi-den"),
  },
  ice_wolf: {
    id: "ice_wolf",
    name: "Sói băng",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    nightOrder: 14,
    wakesAtNight: true,
    cardText: "Đóng băng 1 người, chặn hành động trong đêm.",
    description: "Chọn một người để khóa hoặc chặn hành động đêm.",
    sourceSheet: "ma-soi-role-sheet-wolves-v1.png",
    cardImage: cardPath("soi-bang"),
  },
  fire_wolf: {
    id: "fire_wolf",
    name: "Sói lửa",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    nightOrder: 14,
    wakesAtNight: true,
    cardText: "Gieo lời nguyền. Dân trúng lửa mất kỹ năng.",
    description: "Gieo nguyền khiến một role phe Dân mất khả năng trong thời gian giới hạn.",
    sourceSheet: "ma-soi-role-sheet-advanced-wolves-v1.png",
    cardImage: cardPath("soi-lua"),
    alternateCardImage: cardPath("soi-lua-alt"),
  },
  cub_wolf: {
    id: "cub_wolf",
    name: "Sói con",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    nightOrder: 10,
    wakesAtNight: true,
    cardText: "Bị giết thì đêm sau Sói cắn 2 người.",
    description: "Nếu chết, đêm tiếp theo phe Sói được cắn hai mục tiêu.",
    sourceSheet: "ma-soi-role-sheet-advanced-wolves-v1.png",
    cardImage: cardPath("soi-con"),
  },
  cursed_wolf: {
    id: "cursed_wolf",
    name: "Sói nguyền",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    wakesAtNight: false,
    cardText: "Ban đầu là dân. Bị Sói cắn thì hóa Sói.",
    description: "Khởi đầu như Dân; nếu bị Sói cắn thì chuyển thành Ma Sói.",
    sourceSheet: "ma-soi-role-sheet-advanced-wolves-v1.png",
    cardImage: cardPath("soi-nguyen"),
  },
  converter_wolf: {
    id: "converter_wolf",
    name: "Sói hóa sói",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    nightOrder: 14,
    wakesAtNight: true,
    cardText: "Một lần biến 1 dân thành Sói. Dùng sai là bầy loạn.",
    description: "Một lần biến một người phe Dân thành Sói, nên giới hạn mạnh để tránh quá OP.",
    sourceSheet: "ma-soi-role-sheet-advanced-wolves-v1.png",
    cardImage: cardPath("soi-hoa-soi"),
  },
  hidden_wolf: {
    id: "hidden_wolf",
    name: "Sói ẩn mình",
    team: "WEREWOLF",
    factionLabel: "Phe Sói",
    nightOrder: 10,
    wakesAtNight: true,
    cardText: "Ẩn khỏi Tiên Tri vài lượt. Nhìn như dân, mùi thì không.",
    description: "Có số lượt né soi hoặc hiện sai kết quả khi bị Tiên Tri kiểm tra.",
    sourceSheet: "ma-soi-role-sheet-advanced-wolves-v1.png",
    cardImage: cardPath("soi-an-minh"),
  },
  smoke_wolf: {
    id: "smoke_wolf",
    name: "Sói khói",
    team: "SOLO",
    factionLabel: "Trung lập",
    nightOrder: 32,
    wakesAtNight: true,
    cardText: "Tiên Tri soi ra Sói. Sau đêm 3 được chọn phe để gáy.",
    description: "Role trung lập inside joke; bị soi như Sói, sau một mốc thời gian được chọn phe.",
    sourceSheet: "ma-soi-role-sheet-special-v1.png",
    cardImage: cardPath("soi-khoi"),
  },
  white_wolf: {
    id: "white_wolf",
    name: "Người sói trắng",
    team: "SOLO",
    factionLabel: "Solo",
    nightOrder: 11,
    wakesAtNight: true,
    cardText: "Dậy cùng Sói. Cách đêm cắn 1 Sói. Thắng khi còn một mình.",
    description: "Dậy cùng Sói nhưng phản bội bầy; thắng solo khi là người sống cuối cùng.",
    sourceSheet: "ma-soi-role-sheet-advanced-wolves-v1.png",
    cardImage: cardPath("nguoi-soi-trang"),
  },
};

export const WEREWOLF_ROLE_LIST = Object.values(WEREWOLF_ROLES);

export function getWerewolfRole(roleId?: string | null): WerewolfRole {
  if (roleId && roleId in WEREWOLF_ROLES) {
    return WEREWOLF_ROLES[roleId as WerewolfRoleId];
  }

  return WEREWOLF_ROLES.villager;
}
