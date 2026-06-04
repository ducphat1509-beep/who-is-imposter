import { GameTeam, Player, WerewolfNightAction, WerewolfNightActionType } from "@/types/game";
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
