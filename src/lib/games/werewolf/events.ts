import { Player, WerewolfEventCard, WerewolfEventState } from "@/types/game";
import { isAlive } from "./logic";

export const WEREWOLF_EVENT_CARDS: Record<string, WerewolfEventCard> = {
  village_curfew: {
    id: "village_curfew",
    title: "Lệnh giới nghiêm",
    flavor: "Cổng làng đóng sớm. Một người bị giữ lại để tra hỏi.",
    effect: "RANDOM_NO_VOTE",
    summary: "Một người ngẫu nhiên mất quyền vote trong ngày hôm nay.",
  },
  broken_bell: {
    id: "broken_bell",
    title: "Chuông làng bị vỡ",
    flavor: "Tin tức lan chậm, ai cũng nghe thiếu một nửa.",
    effect: "EXTRA_DISCUSSION",
    summary: "Làng có thêm thời gian tranh luận trước khi vote.",
  },
  silent_charm: {
    id: "silent_charm",
    title: "Bùa im lặng",
    flavor: "Một người thức dậy mà không thể nói ra điều mình biết.",
    effect: "RANDOM_SILENCE_NEXT_NIGHT",
    summary: "Một người có khả năng ban đêm bị khóa hành động ở đêm kế tiếp.",
  },
  public_square: {
    id: "public_square",
    title: "Quảng trường sáng đèn",
    flavor: "Dân làng tụ lại, những lời buộc tội bớt nhập nhằng hơn.",
    effect: "CLEAR_NO_VOTE",
    summary: "Các hiệu ứng mất quyền vote trong ngày được gỡ bỏ.",
  },
  quiet_dawn: {
    id: "quiet_dawn",
    title: "Bình minh yên tĩnh",
    flavor: "Không có biến cố lớn, nhưng sự im lặng làm mọi người khó chịu.",
    effect: "NONE",
    summary: "Không có hiệu ứng đặc biệt trong ngày hôm nay.",
  },
  old_diary: {
    id: "old_diary",
    title: "Nhật ký cũ",
    flavor: "Một trang giấy rơi ra, ghi đầy những nghi ngờ từ ván trước.",
    effect: "NONE",
    summary: "Không có hiệu ứng, chỉ thêm chút áp lực cho buổi tranh luận.",
  },
};

export const WEREWOLF_EVENT_CARD_LIST = Object.values(WEREWOLF_EVENT_CARDS);

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function withStatus(player: Player, status: string): Player {
  if (player.statusEffects?.includes(status)) return player;
  return { ...player, statusEffects: [...(player.statusEffects ?? []), status] };
}

function pickRandomPlayer(players: Player[]): Player | undefined {
  if (players.length === 0) return undefined;
  return players[Math.floor(Math.random() * players.length)];
}

export function createWerewolfEventDeck(): string[] {
  return shuffle(WEREWOLF_EVENT_CARD_LIST.map((card) => card.id));
}

export function drawWerewolfEvent(
  players: Player[],
  deck: string[] | undefined,
  discarded: string[] | undefined,
  round: number
): {
  players: Player[];
  deck: string[];
  discarded: string[];
  activeEvent: WerewolfEventState | null;
  summary: string[];
} {
  const currentDeck = deck && deck.length > 0 ? [...deck] : createWerewolfEventDeck();
  const nextCardId = currentDeck.shift();
  const card = nextCardId ? WEREWOLF_EVENT_CARDS[nextCardId] : null;

  if (!card) {
    return {
      players,
      deck: currentDeck,
      discarded: discarded ?? [],
      activeEvent: null,
      summary: [],
    };
  }

  let updatedPlayers = players;
  const summary = [`Sự kiện hôm nay: ${card.title}. ${card.summary}`];

  if (card.effect === "RANDOM_NO_VOTE") {
    const target = pickRandomPlayer(updatedPlayers.filter(isAlive));
    if (target) {
      updatedPlayers = updatedPlayers.map((player) =>
        player.id === target.id ? withStatus(player, "frozen_vote") : player
      );
      summary.push(`${target.name} bị giữ lại và mất quyền vote trong ngày.`);
    }
  }

  if (card.effect === "RANDOM_SILENCE_NEXT_NIGHT") {
    const target = pickRandomPlayer(
      updatedPlayers.filter((player) => isAlive(player) && player.roleId !== "villager")
    );
    if (target) {
      updatedPlayers = updatedPlayers.map((player) =>
        player.id === target.id ? withStatus(player, "silenced_next_night") : player
      );
      summary.push(`${target.name} bị bùa im lặng, đêm sau không thể hành động.`);
    }
  }

  if (card.effect === "CLEAR_NO_VOTE") {
    updatedPlayers = updatedPlayers.map((player) => ({
      ...player,
      statusEffects: (player.statusEffects ?? []).filter((status) => status !== "frozen_vote"),
    }));
    summary.push("Các hiệu ứng mất vote trong ngày được gỡ bỏ.");
  }

  return {
    players: updatedPlayers,
    deck: currentDeck,
    discarded: [...(discarded ?? []), card.id],
    activeEvent: {
      card,
      round,
      resolvedAt: Date.now(),
    },
    summary,
  };
}
