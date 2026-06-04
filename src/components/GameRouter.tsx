import { Player, Room } from "@/types/game";
import GameBoard from "@/components/GameBoard";
import Lobby from "@/components/Lobby";
import Result from "@/components/Result";
import Voting from "@/components/Voting";
import WerewolfGame from "@/components/werewolf/WerewolfGame";

interface Props {
  room: Room;
  currentPlayer: Player | undefined;
  isHost: boolean;
  currentPlayerId: string;
}

export default function GameRouter({ room, currentPlayer, isHost, currentPlayerId }: Props) {
  const gameType = room.gameType ?? "IMPOSTER";

  if (gameType === "WEREWOLF") {
    return (
      <WerewolfGame
        room={room}
        currentPlayer={currentPlayer}
        isHost={isHost}
        currentPlayerId={currentPlayerId}
      />
    );
  }

  if (room.status === "WAITING") {
    return <Lobby room={room} isHost={isHost} currentPlayerId={currentPlayerId} />;
  }

  if (room.status === "SHOW_CARD" && currentPlayer) {
    return <GameBoard room={room} currentPlayer={currentPlayer} />;
  }

  if (room.status === "VOTING") {
    return <Voting room={room} currentPlayerId={currentPlayerId} />;
  }

  if (room.status === "RESULT") {
    return <Result room={room} isHost={isHost} currentPlayerId={currentPlayerId} />;
  }

  return null;
}
