export type GameType = "IMPOSTER" | "WEREWOLF";

export type GameTeam = "VILLAGE" | "WEREWOLF" | "SOLO" | "LOVERS";

export type RoomStatus = "WAITING" | "SHOW_CARD" | "VOTING" | "RESULT";

export type WerewolfPhase =
  | "ROLE_REVEAL"
  | "NIGHT_INTRO"
  | "NIGHT_ACTION"
  | "NIGHT_RESOLVE"
  | "DAY_ANNOUNCEMENT"
  | "DISCUSSION"
  | "TRIAL_VOTING"
  | "DEFENSE"
  | "EXECUTION"
  | "CHECK_WIN";

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
  round?: number;
}
