"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { useGameStore } from "@/store/useGameStore";
import GameRouter from "@/components/GameRouter";
import RoomComms from "@/components/RoomComms";
import { joinRoom } from "@/lib/roomActions";
import { Ghost } from "lucide-react";

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { room, loading, error } = useRoom(roomId);
  const { playerId, playerName } = useGameStore();

  useEffect(() => {
    // If no player info (e.g. refreshed or direct link), we could redirect to home
    // Or we could show a dialog to enter name. For MVP, redirect to home.
    if (!playerId || !playerName) {
      router.push("/");
      return;
    }

    // Attempt to join the room if not already in it
    if (room?.status === "WAITING") {
      joinRoom(roomId, playerName, playerId).catch(console.error);
    }
  }, [playerId, playerName, roomId, room?.status, router]);

  // Handle being kicked
  useEffect(() => {
    if (room && !loading) {
      const isPlayerInRoom = room.players.some(p => p.id === playerId);
      // We check if the room document exists but the player is not in it.
      if (!isPlayerInRoom) {
        // Give a tiny delay to ensure joinRoom has had a chance to run initially
        const timeout = setTimeout(() => {
          const stillNotInRoom = room.players.every(p => p.id !== playerId);
          if (stillNotInRoom) {
            alert("Bạn đã bị chủ phòng mời ra khỏi phòng!");
            router.push("/");
          }
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [room, loading, playerId, router]);

  if (!playerId || !playerName) return null;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Ghost className="w-12 h-12 text-primary animate-bounce" />
          <p className="text-slate-400">Đang tải phòng...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="glass-card flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center">
            <Ghost className="w-8 h-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold">{error || "Phòng không tồn tại"}</h2>
          <button onClick={() => router.push("/")} className="btn-primary w-full mt-2">
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = room.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost || false;

  return (
    <div className="flex-1 flex flex-col p-4 relative max-w-lg mx-auto w-full">
      <GameRouter
        room={room}
        currentPlayer={currentPlayer}
        isHost={isHost}
        currentPlayerId={playerId}
      />
      <RoomComms room={room} currentPlayer={currentPlayer} />
    </div>
  );
}
