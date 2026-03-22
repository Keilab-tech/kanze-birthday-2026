import { createContext, useContext, useRef, useCallback, useEffect, useState } from "react";

const TRACKS = [
  { src: "/audio/background-song.mp3", title: "Birthday Song" },
  { src: "/audio/seduce-me.mp3", title: "Seduce Me" },
  { src: "/audio/birkin-bag.mp3", title: "Birkin Bag" },
  { src: "/audio/whos-dat-girl.mp3", title: "Who's Dat Girl" },
];

interface MusicContextType {
  start: () => void;
  playTrack: (index: number) => void;
  fadeDown: () => void;
  fadeUp: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  isPlaying: boolean;
  hasStarted: boolean;
  trackTitle: string;
  analyserNode: AnalyserNode | null;
  currentTime: number;
  duration: number;
}

const MusicContext = createContext<MusicContextType>({
  start: () => {},
  playTrack: () => {},
  fadeDown: () => {},
  fadeUp: () => {},
  toggle: () => {},
  next: () => {},
  prev: () => {},
  seek: () => {},
  isPlaying: false,
  hasStarted: false,
  trackTitle: "",
  analyserNode: null,
  currentTime: 0,
  duration: 0,
});

export const useMusic = () => useContext(MusicContext);

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number>(0);
  const startedRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const setupAnalyser = useCallback(() => {
    if (!audioRef.current || audioCtxRef.current) return;
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      setAnalyserNode(analyser);
    } catch (_e) { /* AudioContext setup failed silently */ }
  }, []);

  useEffect(() => {
    const audio = new Audio(TRACKS[0].src);
    audio.loop = false;
    audio.volume = 0;
    audioRef.current = audio;
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("durationchange", () => setDuration(audio.duration || 0));
    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration || 0));
    audio.addEventListener("ended", () => {
      setTrackIndex((prev) => {
        const next = (prev + 1) % TRACKS.length;
        loadTrack(next);
        return next;
      });
    });
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTrack = useCallback((index: number) => {
    if (!audioRef.current) return;
    const wasPlaying = !audioRef.current.paused;
    const vol = audioRef.current.volume;
    audioRef.current.src = TRACKS[index].src;
    audioRef.current.volume = vol;
    if (wasPlaying || startedRef.current) {
      audioRef.current.play().catch(() => {});
    }
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
    setHasStarted(true);
    setupAnalyser();
    audioRef.current.volume = 0;
    audioRef.current.play().catch(() => {});
    fadeTo(0.3, 2000);
    setTimeout(() => fadeTo(0.7, 4000), 3000);
  }, [fadeTo, setupAnalyser]);

  const playTrack = useCallback((index: number, startTime = 0) => {
    if (!audioRef.current) return;
    startedRef.current = true;
    setHasStarted(true);
    setupAnalyser();
    const clampedIndex = Math.max(0, Math.min(index, TRACKS.length - 1));
    setTrackIndex(clampedIndex);
    audioRef.current.src = TRACKS[clampedIndex].src;
    audioRef.current.volume = 0;
    audioRef.current.load();
    audioRef.current.addEventListener("canplay", function onCanPlay() {
      audioRef.current!.removeEventListener("canplay", onCanPlay);
      audioRef.current!.currentTime = startTime;
      audioRef.current!.play().catch(() => {});
    }, { once: true });
    fadeTo(0.8, 1200);
  }, [fadeTo, setupAnalyser]);

  const fadeDown = useCallback(() => { fadeTo(0.08, 1500); }, [fadeTo]);
  const fadeUp = useCallback(() => { fadeTo(0.7, 1200); }, [fadeTo]);

  const toggle = useCallback(() => {
    if (!audioRef.current) return;
    setupAnalyser();
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
      fadeTo(0.7, 800);
    } else {
      fadeTo(0, 600);
      setTimeout(() => audioRef.current?.pause(), 600);
    }
  }, [fadeTo, setupAnalyser]);

  const next = useCallback(() => {
    setTrackIndex((prev) => {
      const n = (prev + 1) % TRACKS.length;
      loadTrack(n);
      return n;
    });
  }, [loadTrack]);

  const prev = useCallback(() => {
    setTrackIndex((prev) => {
      const n = (prev - 1 + TRACKS.length) % TRACKS.length;
      loadTrack(n);
      return n;
    });
  }, [loadTrack]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
  }, []);

  return (
    <MusicContext.Provider value={{ start, playTrack, fadeDown, fadeUp, toggle, next, prev, seek, isPlaying, hasStarted, trackTitle: TRACKS[trackIndex].title, analyserNode, currentTime, duration }}>
      {children}
    </MusicContext.Provider>
  );
};
