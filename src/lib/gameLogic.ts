import { Player } from "@/types/game";
import { pickRandomWordPair } from "./words";

export function assignRolesAndWords(players: Player[]): { 
  updatedPlayers: Player[]; 
  spyWord: string; 
  civilianWord: string; 
} {
  const numPlayers = players.length;
  // Pick a random spy
  const spyIndex = Math.floor(Math.random() * numPlayers);
  
  // Get word pair
  const { word1: civilianWord, word2: spyWord } = pickRandomWordPair();

  const updatedPlayers = players.map((p, i) => ({
    ...p,
    isSpy: i === spyIndex,
    word: i === spyIndex ? spyWord : civilianWord,
    vote: null,
    hasRevealed: false
  }));

  return { updatedPlayers, spyWord, civilianWord };
}

export function countVotes(players: Player[]): { mostVotedId: string | null, isTie: boolean } {
  const counts: Record<string, number> = {};
  
  players.forEach(p => {
    if (p.vote) {
      counts[p.vote] = (counts[p.vote] || 0) + 1;
    }
  });

  let maxVotes = 0;
  let mostVotedId: string | null = null;
  let isTie = false;

  for (const [id, count] of Object.entries(counts)) {
    if (count > maxVotes) {
      maxVotes = count;
      mostVotedId = id;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  }

  // If there's a tie, no one is eliminated or we handle it based on game rules
  // For MVP, if it's a tie, spy wins (or nobody gets eliminated)
  return { mostVotedId: isTie ? null : mostVotedId, isTie };
}
