import { useState, useEffect, useRef } from "react";

interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

export interface StatsSnapshot extends SystemStats {
  time: string;
}

const MAX_HISTORY = 30;

function randomFluctuation(base: number, range: number): number {
  return Math.max(0, Math.min(100, base + (Math.random() - 0.5) * range));
}

function timeLabel(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

export function useSystemStats() {
  const [stats, setStats] = useState<SystemStats>({
    cpu: 42,
    memory: 67,
    disk: 54,
    network: 23,
  });
  const [history, setHistory] = useState<StatsSnapshot[]>([]);
  const initialized = useRef(false);

  // Seed initial history point
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setHistory([{ ...stats, time: timeLabel() }]);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => {
        const next = {
          cpu: Math.round(randomFluctuation(prev.cpu, 15)),
          memory: Math.round(randomFluctuation(prev.memory, 8)),
          disk: Math.round(randomFluctuation(prev.disk, 3)),
          network: Math.round(randomFluctuation(prev.network, 20)),
        };
        setHistory((h) => [...h, { ...next, time: timeLabel() }].slice(-MAX_HISTORY));
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { ...stats, history };
}
