"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoom } from "@/lib/roomActions";
import { useGameStore } from "@/store/useGameStore";
import { Ghost, Users, ArrowRight, Play } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [roomIdInput, setRoomIdInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const setPlayerInfo = useGameStore((state) => state.setPlayerInfo);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return alert("Vui lòng nhập tên của bạn!");
    setIsCreating(true);
    try {
      const playerId = crypto.randomUUID();
      const roomId = await createRoom(playerName.trim(), playerId);
      setPlayerInfo(playerId, playerName.trim());
      router.push(`/room/${roomId}`);
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi tạo phòng.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return alert("Vui lòng nhập tên của bạn!");
    if (!roomIdInput.trim()) return alert("Vui lòng nhập mã phòng!");
    
    setIsJoining(true);
    try {
      const playerId = crypto.randomUUID();
      setPlayerInfo(playerId, playerName.trim());
      router.push(`/room/${roomIdInput.toUpperCase().trim()}`);
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi vào phòng.");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md z-10 flex flex-col gap-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-4 bg-primary/20 rounded-2xl mb-4">
            <Ghost className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ai Là Gián Điệp
          </h1>
          <p className="text-slate-400">Trò chơi ẩn vai vui nhộn cùng bạn bè</p>
        </div>

        <div className="glass-card flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-sm text-slate-300 font-medium pl-1">Tên của bạn</label>
            <input
              type="text"
              className="input-field"
              placeholder="Ví dụ: Hoàng Tử Gió..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={20}
            />
          </div>

          <button
            onClick={handleCreateRoom}
            disabled={isCreating || !playerName.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {isCreating ? "Đang tạo..." : "Tạo phòng mới"}
            {!isCreating && <Play className="w-5 h-5" />}
          </button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">Hoặc tham gia phòng</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <input
              type="text"
              className="input-field uppercase"
              placeholder="MÃ PHÒNG"
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              maxLength={6}
            />
            <button
              type="submit"
              disabled={isJoining || !playerName.trim() || !roomIdInput.trim()}
              className="btn-secondary flex items-center justify-center px-4"
            >
              {isJoining ? "..." : <ArrowRight className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
