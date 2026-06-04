import { useState, useEffect } from "react";

export function useTimer(initialSeconds: number, onComplete?: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            onComplete?.();
            return 0;
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const startTimer = () => setIsRunning(true);
  const resetTimer = (newTime: number = initialSeconds) => {
    setIsRunning(false);
    setTimeLeft(newTime);
  };
  const stopTimer = () => setIsRunning(false);

  return { timeLeft, isRunning, startTimer, resetTimer, stopTimer };
}
