import { useState } from "react";
import { Room } from "@/types/game";
import { submitVote, kickPlayer } from "@/lib/roomActions";
import clsx from "clsx";
import { Check, ShieldAlert, X } from "lucide-react";

interface Props {
  room: Room;
  currentPlayerId: string;
}

export default function Voting({ room, currentPlayerId }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isKicking, setIsKicking] = useState(false);

  const currentPlayer = room.players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || false;
  const hasVoted = !!currentPlayer?.vote;
  const handleVote = async () => {
    if (!selectedId || hasVoted) return;
    
    setIsSubmitting(true);
    try {
      await submitVote(room.id, currentPlayerId, selectedId);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gửi phiếu bầu");
      setIsSubmitting(false);
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

  const getVoteCount = (playerId: string) => {
    return room.players.filter(p => p.vote === playerId).length;
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-danger/20 rounded-2xl mb-2 text-danger">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Bầu Chọn Gián Điệp</h2>
        <p className="text-slate-400">
          {hasVoted 
            ? "Đợi những người khác bầu chọn..."
            : "Ai là người có biểu hiện đáng ngờ nhất?"}
        </p>
      </div>

      <div className="flex-1 glass-card overflow-hidden flex flex-col p-2">
        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar p-2">
          {room.players.map((player) => {
            const isMe = player.id === currentPlayerId;
            const isSelected = selectedId === player.id;
            const voteCount = getVoteCount(player.id);

            return (
              <div 
                key={player.id}
                onClick={() => !hasVoted && !isMe && setSelectedId(player.id)}
                className={clsx(
                  "flex items-center justify-between p-4 rounded-xl border transition-all relative overflow-hidden",
                  !hasVoted && !isMe ? "cursor-pointer hover:bg-surface" : "cursor-default opacity-80",
                  isSelected ? "bg-danger/10 border-danger shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-surface/50 border-white/5",
                  isMe && "opacity-50"
                )}
              >
                {/* Progress bar based on votes */}
                {hasVoted && voteCount > 0 && (
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-danger/10 transition-all duration-1000 ease-out"
                    style={{ width: `${(voteCount / room.players.length) * 100}%` }}
                  />
                )}

                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg border border-white/10">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium text-white flex items-center gap-2">
                      {player.name}
                      {isMe && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">Bạn</span>}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                  {hasVoted && (
                    <span className="text-sm font-bold w-6 text-center text-danger">
                      {voteCount > 0 ? voteCount : ""}
                    </span>
                  )}
                  {!hasVoted && isSelected && <Check className="w-5 h-5 text-danger" />}
                  {player.vote && <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_5px_rgba(16,185,129,0.5)]" />}
                  {isHost && !player.isHost && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleKick(player.id, player.name);
                      }}
                      disabled={isKicking}
                      className="p-1 hover:bg-danger/20 text-slate-500 hover:text-danger rounded-lg transition-colors"
                      title="Đuổi khỏi phòng"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!hasVoted && (
        <button 
          onClick={handleVote}
          disabled={!selectedId || isSubmitting}
          className="btn-danger w-full py-4 text-lg mt-2"
        >
          {isSubmitting ? "Đang gửi..." : selectedId ? "Chốt Phiếu" : "Chọn 1 người"}
        </button>
      )}

      {hasVoted && (
        <div className="glass-card py-4 text-center border-success/30 bg-success/5 mt-2">
          <p className="text-success font-medium flex items-center justify-center gap-2">
            <Check className="w-5 h-5" />
            Đã bỏ phiếu
          </p>
        </div>
      )}
    </div>
  );
}
