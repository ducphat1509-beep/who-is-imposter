import { db } from "./firebase";
import { doc, setDoc, runTransaction } from "firebase/firestore";
import { Player, Room } from "@/types/game";
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
    cardRevealDuration: 5
  };

  await setDoc(roomRef, newRoom);
  return roomId;
}

export async function joinRoom(roomId: string, playerName: string, playerId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) throw new Error("Phòng không tồn tại!");
    
    const roomData = roomSnap.data() as Room;
    if (roomData.status !== "WAITING") throw new Error("Phòng đã bắt đầu chơi!");
    
    // Check if already joined
    if (roomData.players.some(p => p.id === playerId)) return;

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      word: "",
      isSpy: false,
      vote: null,
      isHost: false,
      hasRevealed: false
    };

    transaction.update(roomRef, {
      players: [...roomData.players, newPlayer]
    });
  });
}

export async function startGame(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    
    const roomData = roomSnap.data() as Room;
    const { updatedPlayers, spyWord, civilianWord } = assignRolesAndWords(roomData.players);

    transaction.update(roomRef, {
      status: "SHOW_CARD",
      players: updatedPlayers,
      spyWord,
      civilianWord
    });
  });
}

export async function revealCard(roomId: string, playerId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    
    const roomData = roomSnap.data() as Room;
    const updatedPlayers = roomData.players.map(p => 
      p.id === playerId ? { ...p, hasRevealed: true } : p
    );

    transaction.update(roomRef, {
      players: updatedPlayers
    });
  });
}

export async function startVotingPhase(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    transaction.update(roomRef, { status: "VOTING" });
  });
}

export async function submitVote(roomId: string, playerId: string, votedPlayerId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    
    const roomData = roomSnap.data() as Room;
    const updatedPlayers = roomData.players.map(p => 
      p.id === playerId ? { ...p, vote: votedPlayerId } : p
    );

    const allVoted = updatedPlayers.every(p => p.vote !== null);
    
    transaction.update(roomRef, {
      players: updatedPlayers,
      ...(allVoted ? { status: "RESULT" } : {})
    });
  });
}

export async function playAgain(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    
    const roomData = roomSnap.data() as Room;
    const resetPlayers = roomData.players.map(p => ({
      ...p,
      word: "",
      isSpy: false,
      vote: null,
      hasRevealed: false
    }));

    transaction.update(roomRef, {
      status: "WAITING",
      players: resetPlayers,
      spyWord: "",
      civilianWord: ""
    });
  });
}

export async function kickPlayer(roomId: string, playerIdToKick: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  
  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    
    const roomData = roomSnap.data() as Room;
    const updatedPlayers = roomData.players.filter(p => p.id !== playerIdToKick);

    const updateData: any = {
      players: updatedPlayers
    };

    // If kicking during voting, check if it triggers the end of voting
    if (roomData.status === "VOTING" && updatedPlayers.length > 0) {
      const allVoted = updatedPlayers.every(p => p.vote !== null);
      if (allVoted) {
        updateData.status = "RESULT";
      }
    }

    transaction.update(roomRef, updateData);
  });
}
