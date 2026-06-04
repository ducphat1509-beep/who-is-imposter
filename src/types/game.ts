export type GameType = "IMPOSTER" | "WEREWOLF";

export type GameTeam = "VILLAGE" | "WEREWOLF" | "SOLO" | "LOVERS";

export type RoomStatus = "WAITING" | "SHOW_CARD" | "VOTING" | "RESULT";

export type WerewolfPhase =
  | "ROLE_REVEAL"
  | "NIGHT_ACTION"
  | "DAY_ANNOUNCEMENT"
  | "DISCUSSION"
  | "TRIAL_VOTING"
  | "EXECUTION";

export type WerewolfNightActionType = "WOLF_KILL" | "GUARD_PROTECT" | "SEER_CHECK" | "PASS";

export interface WerewolfNightAction {
  actorId: string;
  roleId: string | null;
  type: WerewolfNightActionType;
  targetId: string | null;
  createdAt: number;
}

export interface RoomConfig {
  gameType: GameType;
}

export interface Player {
  id: string;
  name: string;
  word: string;
  isSpy: boolean;
  vote: string | null;
  isHost: boolean;
  hasRevealed: boolean;
  roleId?: string | null;
  team?: GameTeam | null;
  isAlive?: boolean;
  statusEffects?: string[];
}

export interface Room {
  id: string;
  gameType: GameType;
  status: RoomStatus;
  players: Player[];
  spyWord: string;
  civilianWord: string;
  createdAt: number;
  cardRevealDuration: number;
  config?: RoomConfig;
  werewolfPhase?: WerewolfPhase | null;
  werewolfNightActions?: Record<string, WerewolfNightAction>;
  werewolfSummary?: string[];
  werewolfWinner?: GameTeam | null;
  round?: number;
}
