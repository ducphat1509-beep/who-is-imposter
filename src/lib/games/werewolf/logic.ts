import {
  GameTeam,
  Player,
  WerewolfNightAction,
  WerewolfNightActionType,
  WerewolfNightCall,
} from "@/types/game";
import { WEREWOLF_ROLES, WerewolfRoleId } from "./roles";

export const WEREWOLF_SKIP_VOTE = "__WEREWOLF_SKIP_VOTE__";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function getWerewolfRolePreset(playerCount: number): WerewolfRoleId[] {
  if (playerCount < 5) {
    const smallRoomRoles: WerewolfRoleId[] = ["werewolf", "seer", "guard", "villager"];
    return smallRoomRoles.slice(0, Math.max(playerCount, 1));
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
      guardLastTargetId: null,
    };
  });
}

export function isAlive(player: Player): boolean {
  return player.isAlive !== false;
}

export function canVote(player: Player): boolean {
  return isAlive(player) && !player.statusEffects?.includes("no_vote") && !player.statusEffects?.includes("frozen_vote");
}

export function getWerewolfNightActionType(player: Player): WerewolfNightActionType | null {
  if (!isAlive(player)) return null;
  if (player.team === "WEREWOLF") return "WOLF_KILL";
  if (player.roleId === "guard") return "GUARD_PROTECT";
  if (player.roleId === "seer" || player.roleId === "wolf_seer") return "SEER_CHECK";
  if (player.roleId === "witch") return "WITCH_SAVE";
  return null;
}

export function getRequiredNightActors(players: Player[]): Player[] {
  return players.filter((player) => getWerewolfNightActionType(player) !== null);
}

export function getNightActionKey(callId: string, actorId: string): string {
  return `${callId}:${actorId}`;
}

function getAlivePlayersByRole(players: Player[], roleIds: string[]): Player[] {
  return players.filter((player) => {
    return (
      isAlive(player) &&
      roleIds.includes(player.roleId ?? "") &&
      !player.statusEffects?.includes("silenced_this_night")
    );
  });
}

function getWitchesWithPotions(players: Player[]): Player[] {
  return getAlivePlayersByRole(players, ["witch"]).filter((player) => {
    return !player.statusEffects?.includes("witch_save_used") || !player.statusEffects?.includes("witch_poison_used");
  });
}

function getPlayersWithoutStatus(players: Player[], roleIds: string[], usedStatus: string): Player[] {
  return getAlivePlayersByRole(players, roleIds).filter((player) => !player.statusEffects?.includes(usedStatus));
}

function withStatus(player: Player, status: string): Player {
  if (player.statusEffects?.includes(status)) return player;
  return { ...player, statusEffects: [...(player.statusEffects ?? []), status] };
}

function withoutStatuses(player: Player, statuses: string[]): Player {
  return {
    ...player,
    statusEffects: (player.statusEffects ?? []).filter((status) => !statuses.includes(status)),
  };
}

export function prepareWerewolfPlayersForNight(players: Player[]): Player[] {
  return players.map((player) => {
    const carriedStatuses = (player.statusEffects ?? [])
      .filter((status) => status !== "frozen_vote" && status !== "silenced_this_night")
      .map((status) => status === "silenced_next_night" ? "silenced_this_night" : status);

    return {
      ...player,
      vote: null,
      statusEffects: carriedStatuses,
    };
  });
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
  const aliveWerewolves = players.filter((player) => {
    return isAlive(player) && player.team === "WEREWOLF" && !player.statusEffects?.includes("silenced_this_night");
  });

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
      "Sói Băng đóng băng một người, khiến mục tiêu mất quyền vote trong ngày kế tiếp.",
      getAlivePlayersByRole(players, ["ice_wolf"]),
      "ICE_WOLF_FREEZE"
    ),
    buildCall(
      "fire-wolf",
      "Sói Lửa dậy",
      "Sói Lửa gieo lời nguyền, khiến mục tiêu không thể hành động vào đêm sau.",
      getAlivePlayersByRole(players, ["fire_wolf"]),
      "FIRE_WOLF_CURSE"
    ),
    buildCall(
      "converter-wolf",
      "Sói Hóa Sói dậy",
      "Sói Hóa Sói có thể dùng một lần để biến một người không thuộc phe Sói thành Sói.",
      getPlayersWithoutStatus(players, ["converter_wolf"], "converter_wolf_used"),
      "CONVERTER_WOLF_CONVERT"
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
      "Phù Thủy có thể dùng bình cứu, bình độc, hoặc không làm gì.",
      getWitchesWithPotions(players),
      "WITCH_SAVE"
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
      "Cảnh Vệ Trưởng có thể ra tay một lần. Nếu bắn nhầm phe Dân, Cảnh Vệ Trưởng chết theo.",
      getPlayersWithoutStatus(players, ["captain_guard"], "captain_guard_used"),
      "CAPTAIN_GUARD_SHOOT"
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
      round % 2 === 0
        ? "Người Sói Trắng chọn một Sói để loại, nuôi cơ hội thắng solo."
        : "Người Sói Trắng chỉ quan sát trong đêm lẻ.",
      getAlivePlayersByRole(players, ["white_wolf"]),
      round % 2 === 0 ? "WHITE_WOLF_KILL" : null,
      { requiresAction: round % 2 === 0 }
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
    if (!targetId || targetId === WEREWOLF_SKIP_VOTE) return;
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

export function getSelectedWolfTarget(actions: Record<string, WerewolfNightAction>): string | null {
  return getMostSelectedTarget(
    Object.values(actions)
      .filter((action) => action.type === "WOLF_KILL")
      .map((action) => action.targetId)
  ).targetId;
}

export function getWerewolfWinner(players: Player[]): GameTeam | null {
  const alivePlayers = players.filter(isAlive);
  const aliveWerewolves = alivePlayers.filter((player) => player.team === "WEREWOLF");
  const aliveNonWerewolves = alivePlayers.filter((player) => player.team !== "WEREWOLF");

  if (alivePlayers.length === 1 && alivePlayers[0]?.roleId === "white_wolf") return "SOLO";
  if (aliveWerewolves.length === 0) return "VILLAGE";
  if (aliveWerewolves.length >= aliveNonWerewolves.length) return "WEREWOLF";

  return null;
}

function getActionTargets(actions: Record<string, WerewolfNightAction>, type: WerewolfNightActionType): string[] {
  return Object.values(actions)
    .filter((action) => action.type === type)
    .map((action) => action.targetId)
    .filter((targetId): targetId is string => Boolean(targetId));
}

export function resolveWerewolfNight(
  players: Player[],
  actions: Record<string, WerewolfNightAction>
): {
  players: Player[];
  summary: string[];
  winner: GameTeam | null;
} {
  const wolfTarget = getSelectedWolfTarget(actions);
  const actionList = Object.values(actions);

  const protectedTargetIds = new Set(
    actionList
      .filter((action) => action.type === "GUARD_PROTECT")
      .map((action) => action.targetId)
      .filter(Boolean)
  );

  const witchSavedTargetIds = new Set(
    actionList
      .filter((action) => action.type === "WITCH_SAVE")
      .map((action) => action.targetId)
      .filter(Boolean)
  );
  const witchPoisonTargetIds = getActionTargets(actions, "WITCH_POISON");
  const wolfKilledPlayerIds = wolfTarget && !protectedTargetIds.has(wolfTarget) && !witchSavedTargetIds.has(wolfTarget)
    ? [wolfTarget]
    : [];
  const whiteWolfKilledPlayerIds = getActionTargets(actions, "WHITE_WOLF_KILL").filter((targetId) => {
    return players.find((player) => player.id === targetId)?.team === "WEREWOLF";
  });
  const captainGuardActions = actionList.filter((action) => action.type === "CAPTAIN_GUARD_SHOOT");
  const captainGuardKilledIds = captainGuardActions.flatMap((action) => {
    if (!action.targetId) return [];
    const target = players.find((player) => player.id === action.targetId);
    if (!target) return [];

    const killedIds = [action.targetId];
    if (target.team === "VILLAGE") killedIds.push(action.actorId);
    return killedIds;
  });
  const killedPlayerIds = Array.from(new Set([
    ...wolfKilledPlayerIds,
    ...witchPoisonTargetIds,
    ...whiteWolfKilledPlayerIds,
    ...captainGuardKilledIds,
  ]));

  const frozenTargetIds = getActionTargets(actions, "ICE_WOLF_FREEZE").filter((targetId) => !killedPlayerIds.includes(targetId));
  const cursedTargetIds = getActionTargets(actions, "FIRE_WOLF_CURSE").filter((targetId) => !killedPlayerIds.includes(targetId));
  const conversionTargetIds = getActionTargets(actions, "CONVERTER_WOLF_CONVERT").filter((targetId) => {
    const target = players.find((player) => player.id === targetId);
    return !!target && target.team !== "WEREWOLF" && !killedPlayerIds.includes(targetId);
  });

  const guardActionByActor = actionList.find((action) => action.callId === "guard");
  const witchActionsByActor = actionList.filter((action) => action.callId === "witch");
  const updatedPlayers = players.map((player) => {
    const killedUpdate = killedPlayerIds.includes(player.id) ? { isAlive: false } : {};
    const conversionUpdate = conversionTargetIds.includes(player.id)
      ? {
          roleId: "werewolf",
          team: "WEREWOLF" as GameTeam,
          word: WEREWOLF_ROLES.werewolf.name,
        }
      : {};
    const guardUpdate = player.roleId === "guard"
      ? { guardLastTargetId: guardActionByActor?.targetId ?? null }
      : {};
    const witchAction = witchActionsByActor.find((action) => action.actorId === player.id);
    let nextPlayer: Player = {
      ...player,
      ...killedUpdate,
      ...conversionUpdate,
      ...guardUpdate,
    };

    nextPlayer = withoutStatuses(nextPlayer, ["silenced_this_night"]);

    if (player.roleId === "witch" && witchAction?.type === "WITCH_SAVE") nextPlayer = withStatus(nextPlayer, "witch_save_used");
    if (player.roleId === "witch" && witchAction?.type === "WITCH_POISON") nextPlayer = withStatus(nextPlayer, "witch_poison_used");
    if (captainGuardActions.some((action) => action.actorId === player.id)) nextPlayer = withStatus(nextPlayer, "captain_guard_used");
    if (actionList.some((action) => action.actorId === player.id && action.type === "CONVERTER_WOLF_CONVERT")) {
      nextPlayer = withStatus(nextPlayer, "converter_wolf_used");
    }
    if (frozenTargetIds.includes(player.id)) nextPlayer = withStatus(nextPlayer, "frozen_vote");
    if (cursedTargetIds.includes(player.id)) nextPlayer = withStatus(nextPlayer, "silenced_next_night");

    return nextPlayer;
  });

  const killedNames = killedPlayerIds
    .map((id) => players.find((player) => player.id === id)?.name)
    .filter(Boolean);

  const summary: string[] =
    killedNames.length > 0
      ? [`Đêm qua ${killedNames.join(", ")} đã chết.`]
      : ["Đêm qua không ai chết. Có người vừa được cứu hoặc Sói hơi rén."];

  const frozenNames = frozenTargetIds
    .map((id) => players.find((player) => player.id === id)?.name)
    .filter(Boolean);
  const cursedNames = cursedTargetIds
    .map((id) => players.find((player) => player.id === id)?.name)
    .filter(Boolean);
  const convertedNames = conversionTargetIds
    .map((id) => players.find((player) => player.id === id)?.name)
    .filter(Boolean);

  if (frozenNames.length > 0) {
    summary.push(`${frozenNames.join(", ")} bị Sói Băng đóng băng và mất quyền vote hôm nay.`);
  }
  if (cursedNames.length > 0) {
    summary.push(`${cursedNames.join(", ")} bị Sói Lửa nguyền, đêm sau không thể hành động.`);
  }
  if (convertedNames.length > 0) {
    summary.push(`${convertedNames.join(", ")} đã bị Hóa Sói và gia nhập phe Sói.`);
  }

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
