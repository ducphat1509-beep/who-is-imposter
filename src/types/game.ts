export type RoomStatus = "WAITING" | "SHOW_CARD" | "VOTING" | "RESULT";

export interface Player {
  id: string;
  name: string;
  word: string;
  isSpy: boolean;
  vote: string | null;
  isHost: boolean;
  hasRevealed: boolean;
}

export interface Room {
  id: string;
  status: RoomStatus;
  players: Player[];
  spyWord: string;
  civilianWord: string;
  createdAt: number;
  cardRevealDuration: number;
}
