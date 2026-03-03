import { createContext, useContext, useRef, useCallback, useEffect } from "react";

interface MusicContextType {
  start: () => void;
  fadeDown: () => void;
  fadeUp: () => void;
}

const MusicContext = createContext<MusicContextType>({
  start: () => {},
  fadeDown: () => {},
  fadeUp: () => {},
});

export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number>(0);
  const targetVolumeRef = useRef(0.7);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio("/audio/background-song.mp3");
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;
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
    fadeTo(0.3, 2000); // Start at 30%, will rise
    setTimeout(() => fadeTo(0.7, 4000), 3000); // Rise to 70%
  }, [fadeTo]);

  const fadeDown = useCallback(() => {
    fadeTo(0.08, 1500);
  }, [fadeTo]);

  const fadeUp = useCallback(() => {
    fadeTo(0.7, 1200);
  }, [fadeTo]);

  return (
    <MusicContext.Provider value={{ start, fadeDown, fadeUp }}>
      {children}
    </MusicContext.Provider>
  );
};
