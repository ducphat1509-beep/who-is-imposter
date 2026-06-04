import {
  GameTeam,
  Player,
  WerewolfNightAction,
  WerewolfNightActionType,
  WerewolfNightCall,
} from "@/types/game";
import { WEREWOLF_ROLES, WerewolfRoleId } from "./roles";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function getWerewolfRolePreset(playerCount: number): WerewolfRoleId[] {
  if (playerCount < 5) {
    return ["werewolf", "seer", "guard", ...Array<WerewolfRoleId>(Math.max(playerCount - 3, 0)).fill("villager")];
  }

  if (playerCount === 5) {
    return ["werewolf", "seer", "guard", "hunter", "villager"];
  }

  if (playerCount === 6) {
    return ["werewolf", "seer", "guard", "hunter", "fool", "villager"];
  }

  if (playerCount === 7) {
    return ["werewolf", "gentleman_wolf", "seer", "guard", "hunter", "cupid", "villager"];
  }

  if (playerCount === 8) {
    return ["werewolf", "alpha_wolf", "seer", "guard", "witch", "hunter", "cupid", "villager"];
  }

  if (playerCount === 9) {
    return ["werewolf", "alpha_wolf", "seer", "guard", "witch", "hunter", "cupid", "fool", "villager"];
  }

  const baseRoles: WerewolfRoleId[] = [
    "werewolf",
    "alpha_wolf",
    "fire_wolf",
    "seer",
    "guard",
    "witch",
    "hunter",
    "cupid",
    "fool",
  ];

  return [...baseRoles, ...Array<WerewolfRoleId>(playerCount - baseRoles.length).fill("villager")];
}

export function assignWerewolfRoles(players: Player[]): Player[] {
  const roles = shuffle(getWerewolfRolePreset(players.length));

  return players.map((player, index) => {
    const roleId = roles[index] ?? "villager";
    const role = WEREWOLF_ROLES[roleId];

    return {
      ...player,
      word: role.name,
      isSpy: false,
      vote: null,
      hasRevealed: false,
      roleId,
      team: role.team,
      isAlive: true,
      statusEffects: [],
    };
  });
}

export function isAlive(player: Player): boolean {
  return player.isAlive !== false;
}

export function canVote(player: Player): boolean {
  return isAlive(player) && !player.statusEffects?.includes("no_vote");
}

export function getWerewolfNightActionType(player: Player): WerewolfNightActionType | null {
  if (!isAlive(player)) return null;
  if (player.team === "WEREWOLF") return "WOLF_KILL";
  if (player.roleId === "guard") return "GUARD_PROTECT";
  if (player.roleId === "seer" || player.roleId === "wolf_seer") return "SEER_CHECK";
  return null;
}

export function getRequiredNightActors(players: Player[]): Player[] {
  return players.filter((player) => getWerewolfNightActionType(player) !== null);
}

export function getNightActionKey(callId: string, actorId: string): string {
  return `${callId}:${actorId}`;
}

function getAlivePlayersByRole(players: Player[], roleIds: string[]): Player[] {
  return players.filter((player) => isAlive(player) && roleIds.includes(player.roleId ?? ""));
}

function buildCall(
  id: string,
  title: string,
  instruction: string,
  actors: Player[],
  actionType: WerewolfNightActionType | null,
  options: { requiresAction?: boolean; allowSelfTarget?: boolean } = {}
): WerewolfNightCall | null {
  if (actors.length === 0) return null;

  return {
    id,
    title,
    instruction,
    actorIds: actors.map((actor) => actor.id),
    actionType,
    requiresAction: options.requiresAction ?? actionType !== null,
    allowSelfTarget: options.allowSelfTarget ?? false,
  };
}

export function getWerewolfNightCalls(players: Player[], round: number): WerewolfNightCall[] {
  const calls: Array<WerewolfNightCall | null> = [];
  const aliveWerewolves = players.filter((player) => isAlive(player) && player.team === "WEREWOLF");

  if (round === 1) {
    calls.push(
      buildCall(
        "cupid",
        "Cupid dậy",
        "Cupid ghép đôi 2 người. Chức năng này hiện để quản trò ghi chú thủ công.",
        getAlivePlayersByRole(players, ["cupid"]),
        null,
        { requiresAction: false }
      )
    );
  }

  calls.push(
    buildCall(
      "wolf-seer",
      "Sói Tiên Tri dậy",
      "Sói Tiên Tri soi một người để biết có nên cắn hay không.",
      getAlivePlayersByRole(players, ["wolf_seer"]),
      "SEER_CHECK"
    ),
    buildCall(
      "black-wolf",
      "Sói Đen dậy",
      "Sói Đen gieo nguyền. Chức năng nâng cao này hiện để quản trò ghi chú thủ công.",
      getAlivePlayersByRole(players, ["black_wolf"]),
      null,
      { requiresAction: false }
    ),
    buildCall(
      "ice-wolf",
      "Sói Băng dậy",
      "Sói Băng đóng băng một người. Chức năng nâng cao này hiện để quản trò ghi chú thủ công.",
      getAlivePlayersByRole(players, ["ice_wolf"]),
      null,
      { requiresAction: false }
    ),
    buildCall(
      "fire-wolf",
      "Sói Lửa dậy",
      "Sói Lửa gieo lời nguyền. Chức năng nâng cao này hiện để quản trò ghi chú thủ công.",
      getAlivePlayersByRole(players, ["fire_wolf"]),
      null,
      { requiresAction: false }
    ),
    buildCall(
      "converter-wolf",
      "Sói Hóa Sói dậy",
      "Sói Hóa Sói chọn mục tiêu biến đổi. Chức năng nâng cao này hiện để quản trò ghi chú thủ công.",
      getAlivePlayersByRole(players, ["converter_wolf"]),
      null,
      { requiresAction: false }
    ),
    buildCall(
      "wolf-pack",
      "Đàn Sói dậy",
      "Các Sói nhận mặt nhau và cùng chọn một người để cắn.",
      aliveWerewolves,
      "WOLF_KILL"
    ),
    buildCall(
      "guard",
      "Bảo Vệ dậy",
      "Bảo Vệ chọn một người để che chắn trong đêm.",
      getAlivePlayersByRole(players, ["guard"]),
      "GUARD_PROTECT",
      { allowSelfTarget: true }
    ),
    buildCall(
      "witch",
      "Phù Thủy dậy",
      "Phù Thủy dùng bình cứu/bình độc. Chức năng này hiện để quản trò ghi chú thủ công.",
      getAlivePlayersByRole(players, ["witch"]),
      null,
      { requiresAction: false }
    ),
    buildCall(
      "seer",
      "Tiên Tri dậy",
      "Tiên Tri soi một người để biết người đó có thuộc phe Sói hay không.",
      getAlivePlayersByRole(players, ["seer"]),
      "SEER_CHECK"
    ),
    buildCall(
      "captain-guard",
      "Cảnh Vệ Trưởng dậy",
      "Cảnh Vệ Trưởng có thể ra tay một lần. Chức năng này hiện để quản trò ghi chú thủ công.",
      getAlivePlayersByRole(players, ["captain_guard"]),
      null,
      { requiresAction: false }
    ),
    buildCall(
      "maid",
      "Người Hầu Gái dậy",
      "Người Hầu Gái chọn chủ để theo hầu. Chức năng này hiện để quản trò ghi chú thủ công.",
      getAlivePlayersByRole(players, ["maid"]),
      null,
      { requiresAction: false }
    ),
    buildCall(
      "white-wolf",
      "Người Sói Trắng dậy",
      "Người Sói Trắng hành động theo luật solo. Chức năng này hiện để quản trò ghi chú thủ công.",
      getAlivePlayersByRole(players, ["white_wolf"]),
      null,
      { requiresAction: false }
    ),
    buildCall(
      "smoke-wolf",
      "Sói Khói dậy",
      "Sói Khói xử lý phe trung lập. Chức năng này hiện để quản trò ghi chú thủ công.",
      getAlivePlayersByRole(players, ["smoke_wolf"]),
      null,
      { requiresAction: false }
    )
  );

  return calls.filter((call): call is WerewolfNightCall => call !== null);
}

function getMostSelectedTarget(targetIds: Array<string | null | undefined>): { targetId: string | null; isTie: boolean } {
  const counts: Record<string, number> = {};

  targetIds.forEach((targetId) => {
    if (!targetId) return;
    counts[targetId] = (counts[targetId] ?? 0) + 1;
  });

  let maxVotes = 0;
  let targetId: string | null = null;
  let isTie = false;

  Object.entries(counts).forEach(([id, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      targetId = id;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  });

  return { targetId: isTie ? null : targetId, isTie };
}

export function getWerewolfWinner(players: Player[]): GameTeam | null {
  const alivePlayers = players.filter(isAlive);
  const aliveWerewolves = alivePlayers.filter((player) => player.team === "WEREWOLF");
  const aliveNonWerewolves = alivePlayers.filter((player) => player.team !== "WEREWOLF");

  if (aliveWerewolves.length === 0) return "VILLAGE";
  if (aliveWerewolves.length >= aliveNonWerewolves.length) return "WEREWOLF";

  return null;
}

export function resolveWerewolfNight(
  players: Player[],
  actions: Record<string, WerewolfNightAction>
): {
  players: Player[];
  summary: string[];
  winner: GameTeam | null;
} {
  const wolfTarget = getMostSelectedTarget(
    Object.values(actions)
      .filter((action) => action.type === "WOLF_KILL")
      .map((action) => action.targetId)
  ).targetId;

  const protectedTargetIds = new Set(
    Object.values(actions)
      .filter((action) => action.type === "GUARD_PROTECT")
      .map((action) => action.targetId)
      .filter(Boolean)
  );

  const killedPlayerIds = wolfTarget && !protectedTargetIds.has(wolfTarget) ? [wolfTarget] : [];

  const updatedPlayers = players.map((player) =>
    killedPlayerIds.includes(player.id) ? { ...player, isAlive: false } : player
  );

  const killedNames = killedPlayerIds
    .map((id) => players.find((player) => player.id === id)?.name)
    .filter(Boolean);

  const summary =
    killedNames.length > 0
      ? [`Đêm qua ${killedNames.join(", ")} đã chết.`]
      : ["Đêm qua không ai chết. Có người vừa được cứu hoặc Sói hơi rén."];

  return {
    players: updatedPlayers,
    summary,
    winner: getWerewolfWinner(updatedPlayers),
  };
}

export function resolveWerewolfVote(players: Player[]): {
  players: Player[];
  summary: string[];
  winner: GameTeam | null;
} {
  const { targetId, isTie } = getMostSelectedTarget(players.filter(canVote).map((player) => player.vote));

  if (!targetId || isTie) {
    return {
      players,
      summary: ["Làng hòa phiếu. Không ai bị treo cổ."],
      winner: getWerewolfWinner(players),
    };
  }

  const target = players.find((player) => player.id === targetId);
  const targetName = target?.name ?? "một người chơi";

  if (target?.roleId === "fool" && !target.statusEffects?.includes("no_vote")) {
    const updatedPlayers = players.map((player) =>
      player.id === targetId
        ? { ...player, statusEffects: [...(player.statusEffects ?? []), "no_vote"] }
        : player
    );

    return {
      players: updatedPlayers,
      summary: [`${targetName} là Thằng ngu nên không chết, nhưng mất quyền vote từ giờ.`],
      winner: getWerewolfWinner(updatedPlayers),
    };
  }

  const updatedPlayers = players.map((player) =>
    player.id === targetId ? { ...player, isAlive: false } : player
  );

  return {
    players: updatedPlayers,
    summary: [`${targetName} đã bị treo cổ.`],
    winner: getWerewolfWinner(updatedPlayers),
  };
}
