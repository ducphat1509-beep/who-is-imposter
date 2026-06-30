import { useEffect, useMemo, useRef, useState } from "react";
import { Radio, Volume2, VolumeX } from "lucide-react";
import clsx from "clsx";
import { Room, WerewolfNightCall } from "@/types/game";

interface Props {
  room: Room;
  currentNightCall?: WerewolfNightCall;
}

const STORAGE_KEY = "whoIsImposter:narratorEnabled";

function buildNarration(room: Room, currentNightCall?: WerewolfNightCall): string {
  const phase = room.werewolfPhase;
  const round = room.round ?? 1;

  if (room.status === "RESULT") {
    return `Ván đấu kết thúc. ${(room.werewolfSummary ?? []).join(" ")}`;
  }

  if (phase === "ROLE_REVEAL") {
    return "Mọi người xem vai của mình. Không tiết lộ lá bài cho người khác.";
  }

  if (phase === "NIGHT_ACTION") {
    if (currentNightCall) {
      return `Đêm ${round}. ${currentNightCall.title}. ${currentNightCall.instruction}`;
    }
    return `Đêm ${round}. Tất cả nhắm mắt.`;
  }

  if (phase === "DAY_ANNOUNCEMENT") {
    return `Trời sáng. ${(room.werewolfSummary ?? []).join(" ")}`;
  }

  if (phase === "TRIAL_VOTING") {
    return "Đến lượt bỏ phiếu. Mỗi người chọn một nghi phạm hoặc bỏ phiếu trắng.";
  }

  if (phase === "EXECUTION") {
    return `Kết quả treo cổ. ${(room.werewolfSummary ?? []).join(" ")}`;
  }

  return "";
}

function playCue() {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;

  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 660;
  gain.gain.setValueAtTime(0.001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.5);
}

export default function WerewolfNarrator({ room, currentNightCall }: Props) {
  const [enabled, setEnabled] = useState(() => {
    return typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [supported] = useState(() => {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  });
  const lastSpokenKeyRef = useRef<string>("");
  const narration = useMemo(() => buildNarration(room, currentNightCall), [currentNightCall, room]);
  const narrationKey = `${room.id}:${room.round ?? 0}:${room.status}:${room.werewolfPhase ?? "none"}:${currentNightCall?.id ?? "none"}:${room.werewolfSummary?.join("|") ?? ""}`;

  useEffect(() => {
    if (!enabled || !supported || !narration || lastSpokenKeyRef.current === narrationKey) return;

    lastSpokenKeyRef.current = narrationKey;
    window.speechSynthesis.cancel();
    playCue();

    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.lang = "vi-VN";
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [enabled, narration, narrationKey, supported]);

  const toggleNarrator = () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    localStorage.setItem(STORAGE_KEY, String(nextEnabled));

    if (!nextEnabled && supported) {
      window.speechSynthesis.cancel();
    }
  };

  const replay = () => {
    if (!supported || !narration) return;
    lastSpokenKeyRef.current = "";
    playCue();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.lang = "vi-VN";
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="glass-card flex items-center justify-between gap-3 py-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <Radio className="h-4 w-4 text-accent" />
          Quản trò audio
        </div>
        <p className="truncate text-xs text-slate-400">
          {supported ? "Bật trên một máy để đọc phase tự động." : "Trình duyệt không hỗ trợ đọc giọng nói."}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={toggleNarrator}
          disabled={!supported}
          className={clsx("rounded-xl border px-3 py-2 text-sm font-bold transition", enabled ? "border-accent/40 bg-accent/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300")}
          title={enabled ? "Tắt quản trò audio" : "Bật quản trò audio"}
        >
          {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={replay}
          disabled={!supported || !narration}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          Đọc lại
        </button>
      </div>
    </div>
  );
}
