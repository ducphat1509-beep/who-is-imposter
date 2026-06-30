import { Headphones } from "lucide-react";
import { Player, Room } from "@/types/game";
import RoomChat from "@/components/RoomChat";
import VoiceChatPanel from "@/components/VoiceChatPanel";

interface Props {
  room: Room;
  currentPlayer: Player | undefined;
}

export default function RoomComms({ room, currentPlayer }: Props) {
  return (
    <div className="mt-6 space-y-4 pb-8">
      <div className="flex items-center gap-2 px-1 text-sm font-bold uppercase tracking-wider text-slate-500">
        <Headphones className="h-4 w-4" />
        Giao tiếp
      </div>
      <VoiceChatPanel room={room} currentPlayer={currentPlayer} />
      <RoomChat room={room} currentPlayer={currentPlayer} />
    </div>
  );
}
