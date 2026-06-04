import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types/game";

export function useRoom(roomId: string | null) {
  const [roomState, setRoomState] = useState<Room | null>(null);
  const [observedRoomId, setObservedRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, "rooms", roomId);

    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        setObservedRoomId(roomId);

        if (snapshot.exists()) {
          setRoomState(snapshot.data() as Room);
          setError(null);
        } else {
          setRoomState(null);
          setError("Phòng không tồn tại!");
        }
      },
      (err) => {
        console.error("Lỗi khi lắng nghe dữ liệu phòng:", err);
        setObservedRoomId(roomId);
        setError("Lỗi kết nối. Vui lòng thử lại!");
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return {
    room: roomId ? roomState : null,
    loading: roomId ? observedRoomId !== roomId : false,
    error,
  };
}
