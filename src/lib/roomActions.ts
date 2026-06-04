import { db } from "./firebase";
import { doc, setDoc, runTransaction } from "firebase/firestore";
import { GameType, Player, Room, WerewolfNightAction } from "@/types/game";
import { assignRolesAndWords } from "./gameLogic";
import {
  assignWerewolfRoles,
  canVote,
  getNightActionKey,
  getWerewolfNightCalls,
  resolveWerewolfNight,
  resolveWerewolfVote,
} from "./games/werewolf/logic";

// Helper to generate a random 6-character room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createRoom(
  hostName: string,
  hostId: string,
  gameType: GameType = "IMPOSTER"
): Promise<string> {
  const roomId = generateRoomCode();
  const roomRef = doc(db, "rooms", roomId);

  const host: Player = {
    id: hostId,
    name: hostName,
    word: "",
    isSpy: false,
    vote: null,
    isHost: true,
    hasRevealed: false,
    roleId: null,
    team: null,
    isAlive: true,
    statusEffects: []
  };

  const newRoom: Room = {
    id: roomId,
    gameType,
    status: "WAITING",
    players: [host],
    spyWord: "",
    civilianWord: "",
    createdAt: Date.now(),
    cardRevealDuration: 5,
    config: {
      gameType,
    },
    round: 0
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
      hasRevealed: false,
      roleId: null,
      team: null,
      isAlive: true,
      statusEffects: []
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
    const gameType = roomData.gameType ?? "IMPOSTER";

    if (gameType === "WEREWOLF") {
      const updatedPlayers = assignWerewolfRoles(roomData.players);

      transaction.update(roomRef, {
        status: "SHOW_CARD",
        players: updatedPlayers,
        werewolfPhase: "ROLE_REVEAL",
        werewolfNightCallIndex: 0,
        werewolfNightActions: {},
        werewolfSummary: ["Mọi người xem vai. Quản trò chuẩn bị gọi đêm đầu tiên."],
        werewolfWinner: null,
        round: 1
      });
      return;
    }

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
      hasRevealed: false,
      roleId: null,
      team: null,
      isAlive: true,
      statusEffects: []
    }));

    transaction.update(roomRef, {
      status: "WAITING",
      players: resetPlayers,
      spyWord: "",
      civilianWord: "",
      werewolfPhase: null,
      werewolfNightCallIndex: 0,
      werewolfNightActions: {},
      werewolfSummary: [],
      werewolfWinner: null,
      round: 0
    });
  });
}

export async function startWerewolfNight(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as Room;
    const nextRound = roomData.werewolfPhase === "EXECUTION"
      ? (roomData.round ?? 1) + 1
      : (roomData.round ?? 1);
    const resetPlayers = roomData.players.map((player) => ({ ...player, vote: null }));

    transaction.update(roomRef, {
      status: "SHOW_CARD",
      players: resetPlayers,
      werewolfPhase: "NIGHT_ACTION",
      werewolfNightCallIndex: 0,
      werewolfNightActions: {},
      werewolfSummary: [`Đêm ${nextRound}: tất cả nhắm mắt, quản trò bắt đầu gọi vai.`],
      round: nextRound
    });
  });
}

export async function submitWerewolfNightAction(
  roomId: string,
  actorId: string,
  targetId: string | null
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as Room;
    if (roomData.werewolfPhase !== "NIGHT_ACTION") return;

    const actor = roomData.players.find((player) => player.id === actorId);
    if (!actor) return;

    const calls = getWerewolfNightCalls(roomData.players, roomData.round ?? 1);
    const currentCall = calls[roomData.werewolfNightCallIndex ?? 0];
    if (!currentCall?.actionType || !currentCall.actorIds.includes(actorId)) return;

    const nextAction: WerewolfNightAction = {
      callId: currentCall.id,
      actorId,
      roleId: actor.roleId ?? null,
      type: currentCall.actionType,
      targetId,
      createdAt: Date.now(),
    };

    transaction.update(roomRef, {
      werewolfNightActions: {
        ...(roomData.werewolfNightActions ?? {}),
        [getNightActionKey(currentCall.id, actorId)]: nextAction,
      },
    });
  });
}

export async function advanceWerewolfNightCall(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as Room;
    if (roomData.werewolfPhase !== "NIGHT_ACTION") return;

    const calls = getWerewolfNightCalls(roomData.players, roomData.round ?? 1);
    const currentIndex = roomData.werewolfNightCallIndex ?? 0;

    if (currentIndex < calls.length - 1) {
      const nextCall = calls[currentIndex + 1];
      transaction.update(roomRef, {
        werewolfNightCallIndex: currentIndex + 1,
        werewolfSummary: [`Quản trò gọi: ${nextCall.title}. ${nextCall.instruction}`],
      });
      return;
    }

    const result = resolveWerewolfNight(roomData.players, roomData.werewolfNightActions ?? {});

    transaction.update(roomRef, {
      players: result.players,
      status: result.winner ? "RESULT" : "SHOW_CARD",
      werewolfPhase: result.winner ? null : "DAY_ANNOUNCEMENT",
      werewolfNightCallIndex: 0,
      werewolfSummary: result.summary,
      werewolfWinner: result.winner,
    });
  });
}

export async function resolveWerewolfNightPhase(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as Room;
    if (roomData.werewolfPhase !== "NIGHT_ACTION") return;

    const result = resolveWerewolfNight(roomData.players, roomData.werewolfNightActions ?? {});

    transaction.update(roomRef, {
      players: result.players,
      status: result.winner ? "RESULT" : "SHOW_CARD",
      werewolfPhase: result.winner ? null : "DAY_ANNOUNCEMENT",
      werewolfNightCallIndex: 0,
      werewolfSummary: result.summary,
      werewolfWinner: result.winner,
    });
  });
}

export async function startWerewolfVoting(roomId: string): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as Room;
    const resetPlayers = roomData.players.map((player) => ({ ...player, vote: null }));

    transaction.update(roomRef, {
      players: resetPlayers,
      werewolfPhase: "TRIAL_VOTING",
      werewolfSummary: ["Ban ngày: mọi người tranh luận và bỏ phiếu treo cổ."],
    });
  });
}

export async function submitWerewolfVote(
  roomId: string,
  voterId: string,
  targetId: string
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const roomData = roomSnap.data() as Room;
    if (roomData.werewolfPhase !== "TRIAL_VOTING") return;

    const voter = roomData.players.find((player) => player.id === voterId);
    if (!voter || !canVote(voter)) return;

    const updatedPlayers = roomData.players.map((player) =>
      player.id === voterId ? { ...player, vote: targetId } : player
    );
    const eligibleVoters = updatedPlayers.filter(canVote);
    const allVoted = eligibleVoters.every((player) => player.vote !== null);

    if (!allVoted) {
      transaction.update(roomRef, { players: updatedPlayers });
      return;
    }

    const result = resolveWerewolfVote(updatedPlayers);

    transaction.update(roomRef, {
      players: result.players,
      status: result.winner ? "RESULT" : "SHOW_CARD",
      werewolfPhase: result.winner ? null : "EXECUTION",
      werewolfSummary: result.summary,
      werewolfWinner: result.winner,
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

    const updateData: Partial<Pick<Room, "players" | "status">> = {
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
