import { Room } from "@/types/game";
import { startGame, kickPlayer } from "@/lib/roomActions";
import { Users, Crown, Copy, Check, X } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { getWerewolfRolePreset } from "@/lib/games/werewolf/logic";
import { getWerewolfRole } from "@/lib/games/werewolf/roles";

interface Props {
  room: Room;
  isHost: boolean;
  currentPlayerId: string;
}

export default function Lobby({ room, isHost, currentPlayerId }: Props) {
  const [copied, setCopied] = useState(false);
  const isWerewolfRoom = room.gameType === "WEREWOLF";
  const werewolfRoles = isWerewolfRoom
    ? getWerewolfRolePreset(room.players.length).map((roleId) => getWerewolfRole(roleId))
    : [];
  const werewolfCount = werewolfRoles.filter((role) => role.team === "WEREWOLF").length;
  const villageCount = werewolfRoles.filter((role) => role.team === "VILLAGE").length;
  const soloCount = werewolfRoles.filter((role) => role.team === "SOLO").length;

  const copyRoomId = () => {
    navigator.clipboard.writeText(room.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    try {
      await startGame(room.id);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi bắt đầu game");
    }
  };

  const handleKick = async (pid: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn đuổi ${name} khỏi phòng?`)) return;
    try {
      await kickPlayer(room.id, pid);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi đuổi người chơi");
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

      {isWerewolfRoom && (
        <div className="glass-card space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-lg text-white">Gói vai Ma Sói</h3>
              <p className="text-sm text-slate-400">Tự cân theo {room.players.length} người chơi</p>
            </div>
            <div className="flex gap-2 text-xs font-bold">
              <span className="rounded-full bg-danger/20 px-2 py-1 text-danger">Sói {werewolfCount}</span>
              <span className="rounded-full bg-success/20 px-2 py-1 text-success">Dân {villageCount}</span>
              {soloCount > 0 && <span className="rounded-full bg-primary/20 px-2 py-1 text-primary">Solo {soloCount}</span>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {werewolfRoles.map((role, index) => (
              <span
                key={`${role.id}-${index}`}
                className={clsx(
                  "rounded-full border px-3 py-1 text-xs font-semibold",
                  role.team === "WEREWOLF" && "border-danger/30 bg-danger/10 text-red-200",
                  role.team === "VILLAGE" && "border-success/30 bg-success/10 text-emerald-200",
                  role.team === "SOLO" && "border-primary/30 bg-primary/10 text-violet-200"
                )}
              >
                {role.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 glass-card flex flex-col gap-4 overflow-hidden">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Người chơi
          </h3>
          <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold">
            {room.players.length}
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
              <div className="flex items-center gap-2">
                {player.isHost && <Crown className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />}
                {isHost && !player.isHost && (
                  <button
                    onClick={() => handleKick(player.id, player.name)}
                    className="p-1.5 hover:bg-danger/20 text-slate-400 hover:text-danger rounded-lg transition-colors"
                    title="Đuổi khỏi phòng"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2">
        {isHost ? (
          <button 
            onClick={handleStart}
            className="btn-primary w-full py-4 text-lg"
          >
            Bắt Đầu Game
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
