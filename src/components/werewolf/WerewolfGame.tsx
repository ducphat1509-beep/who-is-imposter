import { useState } from "react";
import Image from "next/image";
import { EyeOff, Moon, Users } from "lucide-react";
import clsx from "clsx";
import { Player, Room } from "@/types/game";
import { revealCard } from "@/lib/roomActions";
import { getWerewolfRole } from "@/lib/games/werewolf/roles";
import Lobby from "@/components/Lobby";

interface Props {
  room: Room;
  currentPlayer: Player | undefined;
  isHost: boolean;
  currentPlayerId: string;
}

export default function WerewolfGame({ room, currentPlayer, isHost, currentPlayerId }: Props) {
  const [showRole, setShowRole] = useState(false);

  if (room.status === "WAITING") {
    return <Lobby room={room} isHost={isHost} currentPlayerId={currentPlayerId} />;
  }

  if (!currentPlayer) return null;

  const role = getWerewolfRole(currentPlayer.roleId);
  const allRevealed = room.players.every((player) => player.hasRevealed);
  const isWolfSide = role.team === "WEREWOLF" || role.team === "SOLO";

  const handleReveal = async () => {
    setShowRole(true);
    if (!currentPlayer.hasRevealed) {
      await revealCard(room.id, currentPlayer.id);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      <div className="text-center space-y-2 pt-4">
        <div className="inline-flex items-center justify-center p-3 bg-danger/20 rounded-2xl mb-2 text-danger">
          <Moon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Ma Sói</h2>
        <p className="text-slate-400">
          {allRevealed
            ? "Mọi người đã xem vai. Bộ quản trò đêm/ngày sẽ được nối vào đây."
            : "Chạm vào lá bài để xem vai trò bí mật của bạn."}
        </p>
      </div>

      <div
        className="relative mx-auto w-64 h-96 cursor-pointer group perspective-1000"
        onClick={handleReveal}
      >
        <div
          className={clsx(
            "w-full h-full transition-all duration-700 preserve-3d relative",
            showRole ? "rotate-y-180" : "hover:scale-105"
          )}
        >
          <div className="absolute inset-0 backface-hidden">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-danger to-primary p-1 shadow-2xl shadow-danger/20">
              <div className="w-full h-full rounded-xl bg-surface flex flex-col items-center justify-center gap-4 border border-white/10">
                <EyeOff className="w-16 h-16 text-slate-500" />
                <span className="text-slate-400 font-medium">Chạm để lật</span>
              </div>
            </div>
          </div>

          <div className="absolute inset-0 backface-hidden rotate-y-180">
            <div
              className={clsx(
                "w-full h-full rounded-2xl p-1 shadow-2xl",
                isWolfSide
                  ? "bg-gradient-to-br from-danger to-primary shadow-danger/40"
                  : "bg-gradient-to-br from-accent to-primary shadow-accent/30"
              )}
            >
              <div className="w-full h-full rounded-xl bg-slate-950 flex flex-col border border-white/20 p-3 text-center overflow-hidden">
                <div className="relative min-h-0 flex-1 rounded-lg overflow-hidden bg-black/30">
                  <Image
                    src={role.cardImage}
                    alt={`Thẻ vai ${role.name}`}
                    fill
                    sizes="256px"
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="space-y-1 pt-3">
                  <p
                    className={clsx(
                      "text-xs uppercase tracking-widest font-bold",
                      isWolfSide ? "text-danger" : "text-accent"
                    )}
                  >
                    {role.factionLabel}
                  </p>
                  <h3 className="text-2xl font-black text-white break-words">{role.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{role.cardText}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="w-5 h-5 text-danger" />
            Trạng thái setup
          </h3>
          <span className="text-xs rounded-full bg-danger/20 text-danger px-3 py-1 font-bold">
            Round {room.round ?? 1}
          </span>
        </div>
        {showRole && (
          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-300 leading-relaxed">
            <span className="font-bold text-white">Luật sản xuất:</span> {role.description}
          </div>
        )}
        <div className="space-y-2">
          {room.players.map((player) => (
            <div key={player.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <span className="text-sm font-medium">{player.name}</span>
              <span
                className={clsx(
                  "text-xs rounded-full px-2 py-1",
                  player.hasRevealed ? "bg-success/20 text-success" : "bg-slate-700 text-slate-300"
                )}
              >
                {player.hasRevealed ? "Đã xem vai" : "Chưa xem"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
