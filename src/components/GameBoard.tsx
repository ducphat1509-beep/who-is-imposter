import { useEffect, useState } from "react";
import { Room, Player } from "@/types/game";
import { revealCard, startVotingPhase, kickPlayer } from "@/lib/roomActions";
import Timer from "./Timer";
import { Eye, EyeOff, X, Users } from "lucide-react";
import clsx from "clsx";

interface Props {
  room: Room;
  currentPlayer: Player;
}

export default function GameBoard({ room, currentPlayer }: Props) {
  const [showWord, setShowWord] = useState(false);
  const [isKicking, setIsKicking] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);

  const handleReveal = async () => {
    setShowWord(true);
    if (!currentPlayer.hasRevealed) {
      await revealCard(room.id, currentPlayer.id);
    }
  };

  const handleTimerComplete = async () => {
    // Only host transitions to next phase to prevent race conditions
    if (currentPlayer.isHost) {
      await startVotingPhase(room.id);
    }
  };

  const handleKick = async (pid: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn đuổi ${name} khỏi phòng?`)) return;
    setIsKicking(true);
    try {
      await kickPlayer(room.id, pid);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi đuổi người chơi");
    } finally {
      setIsKicking(false);
    }
  };

  const allRevealed = room.players.every(p => p.hasRevealed);

  return (
    <div className="flex flex-col gap-6 w-full h-full items-center justify-center pb-8">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-white">Xem Từ Khóa</h2>
        <p className="text-slate-400">
          {allRevealed 
            ? "Mọi người đã xem xong! Hãy bắt đầu thảo luận."
            : "Chạm vào lá bài để xem từ của bạn"}
        </p>
      </div>

      {/* Card container with perspective */}
      <div 
        className="relative w-64 h-96 cursor-pointer group perspective-1000"
        onClick={handleReveal}
      >
        <div className={clsx(
          "w-full h-full transition-all duration-700 preserve-3d relative",
          showWord ? "rotate-y-180" : "hover:scale-105"
        )}>
          {/* Card Back */}
          <div className="absolute inset-0 backface-hidden">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary to-accent p-1 shadow-2xl shadow-primary/20">
              <div className="w-full h-full rounded-xl bg-surface flex flex-col items-center justify-center gap-4 border border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_70%)]" />
                <EyeOff className="w-16 h-16 text-slate-500" />
                <span className="text-slate-400 font-medium">Chạm để lật</span>
              </div>
            </div>
          </div>

          {/* Card Front */}
          <div className="absolute inset-0 backface-hidden rotate-y-180">
            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-primary to-accent p-1 shadow-2xl shadow-primary/40">
              <div className="w-full h-full rounded-xl bg-slate-900 flex flex-col items-center justify-center gap-6 border border-white/20 p-6 text-center relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/30 to-transparent" />
                <Eye className="w-12 h-12 text-primary" />
                <div className="space-y-2 relative z-10">
                  <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">Từ của bạn</p>
                  <h3 className="text-4xl font-black text-white break-words drop-shadow-md">
                    {currentPlayer.word}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {allRevealed && (
        <div className="mt-8">
          <Timer duration={room.cardRevealDuration} onComplete={handleTimerComplete} />
        </div>
      )}
      
      {!allRevealed && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="text-sm text-slate-400 animate-pulse">
            Đang chờ những người khác xem bài...
          </div>
          
          {currentPlayer.isHost && (
            <button 
              onClick={() => setShowPlayers(!showPlayers)}
              className="flex items-center gap-2 text-xs text-primary bg-primary/10 px-3 py-2 rounded-full hover:bg-primary/20 transition-colors"
            >
              <Users className="w-3 h-3" />
              {showPlayers ? "Ẩn danh sách" : "Xem ai chưa lật"}
            </button>
          )}
        </div>
      )}

      {showPlayers && currentPlayer.isHost && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPlayers(false)} />
          <div className="glass-card w-full max-w-sm relative z-10 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Quản lý người chơi</h3>
              <button onClick={() => setShowPlayers(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {room.players.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      p.hasRevealed ? "bg-success shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-slate-600"
                    )} />
                    <span className="text-sm font-medium">{p.name}</span>
                    {p.id === currentPlayer.id && <span className="text-[10px] text-primary">Bạn</span>}
                  </div>
                  {p.id !== currentPlayer.id && (
                    <button
                      onClick={() => handleKick(p.id, p.name)}
                      disabled={isKicking}
                      className="p-1.5 hover:bg-danger/20 text-slate-400 hover:text-danger rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


