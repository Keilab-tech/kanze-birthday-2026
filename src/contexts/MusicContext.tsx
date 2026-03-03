import { createContext, useContext, useRef, useCallback, useEffect, useState } from "react";

interface MusicContextType {
  start: () => void;
  fadeDown: () => void;
  fadeUp: () => void;
  toggle: () => void;
  isPlaying: boolean;
}

const MusicContext = createContext<MusicContextType>({
  start: () => {},
  fadeDown: () => {},
  fadeUp: () => {},
  toggle: () => {},
  isPlaying: false,
});

export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number>(0);
  const startedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = new Audio("/audio/background-song.mp3");
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const fadeTo = useCallback((target: number, durationMs: number) => {
    if (!audioRef.current) return;
    clearInterval(fadeIntervalRef.current);
    const audio = audioRef.current;
    const steps = 30;
    const stepTime = durationMs / steps;
    const stepSize = (target - audio.volume) / steps;
    let step = 0;
    fadeIntervalRef.current = window.setInterval(() => {
      step++;
      audio.volume = Math.min(1, Math.max(0, audio.volume + stepSize));
      if (step >= steps) {
        audio.volume = Math.min(1, Math.max(0, target));
        clearInterval(fadeIntervalRef.current);
      }
    }, stepTime);
  }, []);

  const start = useCallback(() => {
    if (!audioRef.current || startedRef.current) return;
    startedRef.current = true;
    audioRef.current.volume = 0;
    audioRef.current.play().catch(() => {});
    fadeTo(0.3, 2000);
    setTimeout(() => fadeTo(0.7, 4000), 3000);
  }, [fadeTo]);

  const fadeDown = useCallback(() => {
    fadeTo(0.08, 1500);
  }, [fadeTo]);

  const fadeUp = useCallback(() => {
    fadeTo(0.7, 1200);
  }, [fadeTo]);

  const toggle = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
      fadeTo(0.7, 800);
    } else {
      fadeTo(0, 600);
      setTimeout(() => audioRef.current?.pause(), 600);
    }
  }, [fadeTo]);

  return (
    <MusicContext.Provider value={{ start, fadeDown, fadeUp, toggle, isPlaying }}>
      {children}
    </MusicContext.Provider>
  );
};
