import { Room } from "@/types/game";
import { countVotes } from "@/lib/gameLogic";
import { playAgain, kickPlayer } from "@/lib/roomActions";
import { Ghost, ShieldCheck, Skull, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface Props {
  room: Room;
  isHost: boolean;
  currentPlayerId: string;
}

export default function Result({ room, isHost, currentPlayerId }: Props) {
  const [isKicking, setIsKicking] = useState(false);

  const { mostVotedId, isTie } = countVotes(room.players);
  
  const eliminatedPlayer = room.players.find(p => p.id === mostVotedId);
  const isSpyCaught = eliminatedPlayer?.isSpy || false;
  const spyPlayer = room.players.find(p => p.isSpy);
  const isSpyWon = isTie || !isSpyCaught;
  const handlePlayAgain = async () => {
    try {
      await playAgain(room.id);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi tạo ván mới");
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

  return (
    <div className="flex flex-col gap-6 w-full h-full pb-8 overflow-y-auto custom-scrollbar">
      <div className="text-center space-y-4 pt-4">
        <div className="relative inline-block">
          <div className={clsx(
            "absolute inset-0 blur-2xl opacity-50 rounded-full",
            isSpyWon ? "bg-danger" : "bg-success"
          )} />
          <div className="relative">
            {isSpyWon ? (
              <Skull className="w-20 h-20 text-danger mx-auto drop-shadow-lg" />
            ) : (
              <ShieldCheck className="w-20 h-20 text-success mx-auto drop-shadow-lg" />
            )}
          </div>
        </div>

        <h2 className="text-3xl font-black uppercase tracking-wider text-white">
          {isSpyWon ? "Gián Điệp Thắng" : "Dân Thường Thắng"}
        </h2>
        
        <p className="text-lg text-slate-300 px-4">
          {isTie 
            ? "Hòa phiếu! Không ai bị loại nên gián điệp đã trốn thoát." 
            : isSpyCaught 
              ? `Chúc mừng! Dân thường đã tóm được gián điệp ${eliminatedPlayer?.name}.`
              : `Thất bại! Dân thường đã bắt nhầm người tốt ${eliminatedPlayer?.name}.`}
        </p>
      </div>

      <div className="glass-card space-y-6 mt-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Ghost className="w-32 h-32" />
        </div>
        
        <div className="space-y-4 relative z-10">
          <h3 className="text-center font-bold text-slate-400 uppercase tracking-widest text-sm">Sự thật</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface/50 border border-white/5 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Gián điệp</p>
              <p className="font-bold text-danger text-lg">{spyPlayer?.name}</p>
              <p className="text-xs text-slate-400 mt-2 bg-black/20 rounded-md py-1">{room.spyWord}</p>
            </div>
            
            <div className="bg-surface/50 border border-white/5 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Dân thường</p>
              <p className="font-bold text-success text-lg">Mọi người</p>
              <p className="text-xs text-slate-400 mt-2 bg-black/20 rounded-md py-1">{room.civilianWord}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 relative z-10 border-t border-white/5 pt-4">
          <h3 className="text-center font-bold text-slate-400 uppercase tracking-widest text-sm mb-4">Bảng Vị Trí</h3>
          <div className="space-y-2">
            {room.players.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-black/20 rounded-lg p-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className={clsx("font-medium", p.isSpy ? "text-danger" : "text-white")}>
                    {p.name}
                  </span>
                  {p.isSpy && <Ghost className="w-4 h-4 text-danger" />}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-slate-500 text-xs mr-2">
                    {p.vote ? `Vote: ${room.players.find(vp => vp.id === p.vote)?.name}` : "Không vote"}
                  </div>
                  {isHost && p.id !== currentPlayerId && (
                    <button
                      onClick={() => handleKick(p.id, p.name)}
                      disabled={isKicking}
                      className="p-1 hover:bg-danger/20 text-slate-500 hover:text-danger rounded transition-colors"
                      title="Đuổi khỏi phòng"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isHost && (
        <button 
          onClick={handlePlayAgain}
          className="btn-primary w-full py-4 text-lg mt-4 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Chơi ván mới
        </button>
      )}
      
      {!isHost && (
        <div className="glass-card py-4 text-center border-primary/30 bg-primary/5 mt-4">
          <p className="text-primary font-medium animate-pulse">Đang chờ chủ phòng tạo ván mới...</p>
        </div>
      )}
    </div>
  );
}
