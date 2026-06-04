import { Player } from "@/types/game";
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
