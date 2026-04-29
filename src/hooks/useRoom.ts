import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Room } from "@/types/game";

export function useRoom(roomId: string | null) {
  const [roomState, setRoomState] = useState<Room | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setRoomState(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const roomRef = doc(db, "rooms", roomId);

    const unsubscribe = onSnapshot(
      roomRef,
      (doc) => {
        if (doc.exists()) {
          setRoomState(doc.data() as Room);
          setError(null);
        } else {
          setRoomState(null);
          setError("Phòng không tồn tại!");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Lỗi khi lắng nghe dữ liệu phòng:", err);
        setError("Lỗi kết nối. Vui lòng thử lại!");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { room: roomState, loading, error };
}
