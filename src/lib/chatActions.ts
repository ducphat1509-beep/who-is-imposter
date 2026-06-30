import { addDoc, collection } from "firebase/firestore";
import { ChatChannel } from "@/types/game";
import { db } from "./firebase";

export async function sendRoomMessage(
  roomId: string,
  playerId: string,
  playerName: string,
  channel: ChatChannel,
  text: string
): Promise<void> {
  const trimmedText = text.trim();
  if (!trimmedText) return;

  await addDoc(collection(db, "rooms", roomId, "messages"), {
    roomId,
    playerId,
    playerName,
    channel,
    text: trimmedText.slice(0, 500),
    createdAt: Date.now(),
  });
}
