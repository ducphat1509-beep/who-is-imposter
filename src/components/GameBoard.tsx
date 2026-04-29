import { useEffect, useState } from "react";
import { Room, Player } from "@/types/game";
import { revealCard, startVotingPhase } from "@/lib/roomActions";
import Timer from "./Timer";
import { Eye, EyeOff } from "lucide-react";
import clsx from "clsx";

interface Props {
  room: Room;
  currentPlayer: Player;
}

export default function GameBoard({ room, currentPlayer }: Props) {
  const [showWord, setShowWord] = useState(false);

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
        <div className="mt-8 text-sm text-slate-400 animate-pulse">
          Đang chờ những người khác xem bài...
        </div>
      )}
    </div>
  );
}


