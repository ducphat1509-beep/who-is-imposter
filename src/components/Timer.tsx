import { useEffect } from "react";
import { useTimer } from "@/hooks/useTimer";

interface Props {
  duration: number;
  onComplete: () => void;
}

export default function Timer({ duration, onComplete }: Props) {
  const { timeLeft, startTimer } = useTimer(duration, onComplete);

  useEffect(() => {
    startTimer();
  }, [startTimer]);

  const percentage = (timeLeft / duration) * 100;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Background circle */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r="44"
            className="stroke-surface fill-none"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="44"
            className="stroke-primary fill-none transition-all duration-1000 ease-linear"
            strokeWidth="8"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * ((100 - percentage) / 100)}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-3xl font-bold font-mono text-white relative z-10">{timeLeft}</span>
      </div>
      <span className="text-sm text-primary font-medium uppercase tracking-wider">Thời gian thảo luận</span>
    </div>
  );
}
