import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Player, Room, RoomStatus } from "@/types/game";
import { assignRolesAndWords } from "./gameLogic";

// Helper to generate a random 6-character room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createRoom(hostName: string, hostId: string): Promise<string> {
  const roomId = generateRoomCode();
  const roomRef = doc(db, "rooms", roomId);

  const host: Player = {
    id: hostId,
    name: hostName,
    word: "",
    isSpy: false,
    vote: null,
    isHost: true,
    hasRevealed: false
  };

  const newRoom: Room = {
    id: roomId,
    status: "WAITING",
    players: [host],
    spyWord: "",
    civilianWord: "",
    createdAt: Date.now(),
    cardRevealDuration: 5 // Default 5 seconds
  };

  await setDoc(roomRef, newRoom);
  return roomId;
}

export async function joinRoom(roomId: string, playerName: string, playerId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnap = await getDoc(roomRef);

  if (!roomSnap.exists()) {
    throw new Error("Phòng không tồn tại!");
  }

  const roomData = roomSnap.data() as Room;
  
  if (roomData.status !== "WAITING") {
    throw new Error("Phòng đã bắt đầu chơi!");
  }

  // Check if player already in room
  if (roomData.players.some(p => p.id === playerId)) {
    return; // Already joined
  }

  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    word: "",
    isSpy: false,
    vote: null,
    isHost: false,
    hasRevealed: false
  };

  const updatedPlayers = [...roomData.players, newPlayer];

  await updateDoc(roomRef, {
    players: updatedPlayers
  });
}

export async function startGame(roomId: string, players: Player[]): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  const { updatedPlayers, spyWord, civilianWord } = assignRolesAndWords(players);

  await updateDoc(roomRef, {
    status: "SHOW_CARD",
    players: updatedPlayers,
    spyWord,
    civilianWord
  });
}

export async function revealCard(roomId: string, playerId: string, players: Player[]): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  const updatedPlayers = players.map(p => 
    p.id === playerId ? { ...p, hasRevealed: true } : p
  );

  await updateDoc(roomRef, {
    players: updatedPlayers
  });
}

export async function startVotingPhase(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  await updateDoc(roomRef, {
    status: "VOTING"
  });
}

export async function submitVote(roomId: string, playerId: string, votedPlayerId: string, players: Player[]): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  const updatedPlayers = players.map(p => 
    p.id === playerId ? { ...p, vote: votedPlayerId } : p
  );

  await updateDoc(roomRef, {
    players: updatedPlayers
  });

  // Check if everyone has voted
  const allVoted = updatedPlayers.every(p => p.vote !== null);
  if (allVoted) {
    await updateDoc(roomRef, {
      status: "RESULT"
    });
  }
}

export async function playAgain(roomId: string, players: Player[]): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  const resetPlayers = players.map(p => ({
    ...p,
    word: "",
    isSpy: false,
    vote: null,
    hasRevealed: false
  }));

  await updateDoc(roomRef, {
    status: "WAITING",
    players: resetPlayers,
    spyWord: "",
    civilianWord: ""
  });
}
