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

export type WerewolfNightActionType =
  | "WOLF_KILL"
  | "GUARD_PROTECT"
  | "SEER_CHECK"
  | "WITCH_SAVE"
  | "WITCH_POISON"
  | "ICE_WOLF_FREEZE"
  | "FIRE_WOLF_CURSE"
  | "CONVERTER_WOLF_CONVERT"
  | "CAPTAIN_GUARD_SHOOT"
  | "WHITE_WOLF_KILL"
  | "PASS";

export interface WerewolfNightCall {
  id: string;
  title: string;
  instruction: string;
  actorIds: string[];
  actionType: WerewolfNightActionType | null;
  requiresAction: boolean;
  allowSelfTarget: boolean;
}

export interface WerewolfNightAction {
  callId: string;
  actorId: string;
  roleId: string | null;
  type: WerewolfNightActionType;
  targetId: string | null;
  createdAt: number;
}

export interface RoomConfig {
  gameType: GameType;
}

export type WerewolfEventEffect =
  | "NONE"
  | "RANDOM_NO_VOTE"
  | "RANDOM_SILENCE_NEXT_NIGHT"
  | "CLEAR_NO_VOTE"
  | "EXTRA_DISCUSSION";

export interface WerewolfEventCard {
  id: string;
  title: string;
  flavor: string;
  effect: WerewolfEventEffect;
  summary: string;
}

export interface WerewolfEventState {
  card: WerewolfEventCard;
  round: number;
  resolvedAt: number;
}

export type ChatChannel = "room" | "werewolf" | "system";

export interface ChatMessage {
  id: string;
  roomId: string;
  playerId: string;
  playerName: string;
  channel: ChatChannel;
  text: string;
  createdAt: number;
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
  guardLastTargetId?: string | null;
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
  werewolfNightCallIndex?: number;
  werewolfNightActions?: Record<string, WerewolfNightAction>;
  werewolfSummary?: string[];
  werewolfWinner?: GameTeam | null;
  werewolfEventDeck?: string[];
  werewolfDiscardedEvents?: string[];
  werewolfActiveEvent?: WerewolfEventState | null;
  round?: number;
}
