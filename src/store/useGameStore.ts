import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GameState {
  playerId: string | null;
  playerName: string | null;
  setPlayerInfo: (id: string, name: string) => void;
  clearPlayerInfo: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      playerId: null,
      playerName: null,
      setPlayerInfo: (id, name) => set({ playerId: id, playerName: name }),
      clearPlayerInfo: () => set({ playerId: null, playerName: null }),
    }),
    {
      name: 'who-is-imposter-storage',
    }
  )
);
