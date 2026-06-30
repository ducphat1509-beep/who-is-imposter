import { FormEvent, useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import clsx from "clsx";
import { ChatChannel, Player, Room } from "@/types/game";
import { useRoomChat } from "@/hooks/useRoomChat";
import { sendRoomMessage } from "@/lib/chatActions";

interface Props {
  room: Room;
  currentPlayer: Player | undefined;
}

export default function RoomChat({ room, currentPlayer }: Props) {
  const { messages, error } = useRoomChat(room.id);
  const [text, setText] = useState("");
  const [channel, setChannel] = useState<ChatChannel>("room");
  const canUseWolfChat = room.gameType === "WEREWOLF" && currentPlayer?.team === "WEREWOLF";

  const visibleMessages = useMemo(() => {
    return messages.filter((message) => {
      if (message.channel === "room" || message.channel === "system") return true;
      return canUseWolfChat && message.channel === "werewolf";
    });
  }, [canUseWolfChat, messages]);

  const submitMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPlayer || !text.trim()) return;

    const nextChannel = channel === "werewolf" && canUseWolfChat ? "werewolf" : "room";
    await sendRoomMessage(room.id, currentPlayer.id, currentPlayer.name, nextChannel, text);
    setText("");
  };

  return (
    <section className="glass-card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-white">
          <MessageCircle className="h-5 w-5 text-primary" />
          Chat phòng
        </h3>
        {canUseWolfChat && (
          <div className="flex rounded-xl border border-white/10 bg-black/20 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setChannel("room")}
              className={clsx("rounded-lg px-3 py-1.5 transition", channel === "room" ? "bg-primary text-white" : "text-slate-400")}
            >
              Làng
            </button>
            <button
              type="button"
              onClick={() => setChannel("werewolf")}
              className={clsx("rounded-lg px-3 py-1.5 transition", channel === "werewolf" ? "bg-danger text-white" : "text-slate-400")}
            >
              Sói
            </button>
          </div>
        )}
      </div>

      <div className="max-h-56 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {visibleMessages.length === 0 ? (
          <p className="rounded-xl bg-white/5 px-3 py-4 text-center text-sm text-slate-400">
            Chưa có tin nhắn.
          </p>
        ) : (
          visibleMessages.map((message) => {
            const isMine = message.playerId === currentPlayer?.id;
            const isWolf = message.channel === "werewolf";

            return (
              <div
                key={message.id}
                className={clsx(
                  "rounded-xl border px-3 py-2",
                  isMine ? "border-primary/30 bg-primary/10" : "border-white/10 bg-white/5",
                  isWolf && "border-danger/30 bg-danger/10"
                )}
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-slate-200">{message.playerName}</span>
                  {isWolf && <span className="rounded-full bg-danger/20 px-2 py-0.5 text-danger">Sói</span>}
                </div>
                <p className="break-words text-sm leading-relaxed text-slate-200">{message.text}</p>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <form onSubmit={submitMessage} className="flex gap-2">
        <input
          className="input-field min-w-0"
          value={text}
          maxLength={500}
          onChange={(event) => setText(event.target.value)}
          placeholder={channel === "werewolf" && canUseWolfChat ? "Nhắn riêng phe Sói..." : "Nhắn trong phòng..."}
        />
        <button
          type="submit"
          disabled={!text.trim() || !currentPlayer}
          className="btn-primary flex shrink-0 items-center justify-center px-4"
          title="Gửi"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </section>
  );
}
