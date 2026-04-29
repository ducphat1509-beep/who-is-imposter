import { Room } from "@/types/game";
import { startGame } from "@/lib/roomActions";
import { Users, Crown, Copy, Check } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface Props {
  room: Room;
  isHost: boolean;
  currentPlayerId: string;
}

export default function Lobby({ room, isHost, currentPlayerId }: Props) {
  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (room.players.length < 3) {
      alert("Cần ít nhất 3 người chơi để bắt đầu!");
      return;
    }
    try {
      await startGame(room.id, room.players);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi bắt đầu game");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      <div className="glass-card flex flex-col items-center gap-2 text-center relative overflow-hidden">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
        <p className="text-slate-400 text-sm font-medium">Mã phòng</p>
        <div 
          onClick={copyRoomId}
          className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded-xl transition-colors"
        >
          <h2 className="text-4xl tracking-[0.2em] font-mono font-bold text-white">{room.id}</h2>
          {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />}
        </div>
        <p className="text-xs text-slate-500">Chạm để copy</p>
      </div>

      <div className="flex-1 glass-card flex flex-col gap-4 overflow-hidden">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Người chơi
          </h3>
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">
            {room.players.length} / 12
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {room.players.map((player) => (
            <div 
              key={player.id} 
              className={clsx(
                "flex items-center justify-between p-3 rounded-xl border transition-all",
                player.id === currentPlayerId 
                  ? "bg-primary/10 border-primary/50" 
                  : "bg-surface/50 border-white/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center font-bold text-lg border border-white/10 shadow-inner">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-medium text-white flex items-center gap-2">
                    {player.name}
                    {player.id === currentPlayerId && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">Bạn</span>}
                  </span>
                </div>
              </div>
              {player.isHost && <Crown className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        {isHost ? (
          <button 
            onClick={handleStart}
            disabled={room.players.length < 3}
            className="btn-primary w-full py-4 text-lg"
          >
            {room.players.length < 3 ? "Đợi thêm người..." : "Bắt Đầu Game"}
          </button>
        ) : (
          <div className="glass-card py-4 text-center border-primary/30 bg-primary/5">
            <p className="text-primary font-medium animate-pulse">Đang chờ chủ phòng bắt đầu...</p>
          </div>
        )}
      </div>
    </div>
  );
}
