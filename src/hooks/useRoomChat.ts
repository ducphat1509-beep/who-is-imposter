import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { ChatMessage } from "@/types/game";
import { db } from "@/lib/firebase";

export function useRoomChat(roomId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const messagesQuery = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("createdAt", "asc"),
      limit(80)
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<ChatMessage, "id">),
          }))
        );
        setError(null);
      },
      (err) => {
        console.error("Lỗi khi lắng nghe chat:", err);
        setError("Không tải được chat.");
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { messages, error };
}
