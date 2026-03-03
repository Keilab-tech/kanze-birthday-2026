import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import PinkParticlesBackground from "@/components/PinkParticlesBackground";
import { useMusic } from "@/contexts/MusicContext";

const letterLines = [
  "Dear Kanze...",
  "",
  "If I could pause time, I'd choose the moments with you.",
  "",
  "You've grown into someone so beautiful — not just on the outside,",
  "but in the way you care, the way you laugh, the way you love.",
  "",
  "22 years of you in this world,",
  "and every single one of them matters.",
  "",
  "I hope this year brings you everything your heart has been whispering about.",
  "The dreams you haven't said out loud — I hope they all come true.",
  "",
  "You deserve flowers on ordinary days.",
  "You deserve people who stay.",
  "You deserve a love that feels like home.",
  "",
  "No matter where life takes us...",
  "I'm grateful it gave me you.",
];

interface VoiceNote {
  name: string;
  url: string;
}

const LetterPage = () => {
  const navigate = useNavigate();
  const [visibleChars, setVisibleChars] = useState(0);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [playingNote, setPlayingNote] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typeAudioCtxRef = useRef<AudioContext | null>(null);
  const [showStars, setShowStars] = useState(false);
  const { fadeDown, fadeUp } = useMusic();

  // Fade music down on mount, restore on unmount
  useEffect(() => {
    fadeDown();
    return () => { fadeUp(); };
  }, [fadeDown, fadeUp]);

  // Flatten all text into a single string for char-by-char typing
  const fullText = letterLines.join("\n");
  const totalChars = fullText.length;

  // Load voice notes
  useEffect(() => {
    const loadVoiceNotes = async () => {
      const { data } = await supabase.storage
        .from("kanze-birthday")
        .list("voice-notes", { limit: 50 });

      if (data) {
        const notes: VoiceNote[] = data
          .filter(f => f.name !== ".emptyFolderPlaceholder")
          .map(f => {
            const { data: urlData } = supabase.storage
              .from("kanze-birthday")
              .getPublicUrl(`voice-notes/${f.name}`);
            return { name: f.name, url: urlData.publicUrl };
          });
        setVoiceNotes(notes);
      }
    };
    loadVoiceNotes();
  }, []);

  // Realistic keyboard click using noise burst
  const playKeyClick = useCallback(() => {
    try {
      if (!typeAudioCtxRef.current) {
        typeAudioCtxRef.current = new AudioContext();
      }
      const ctx = typeAudioCtxRef.current;
      const bufferSize = ctx.sampleRate * 0.025; // 25ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      // White noise burst shaped like a key click
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.exp(-i / (bufferSize * 0.15));
        output[i] = (Math.random() * 2 - 1) * env * 0.3;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      // Bandpass to sound like a keyboard
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2000 + Math.random() * 1500;
      filter.Q.value = 1.5;
      const gain = ctx.createGain();
      gain.gain.value = 0.12 + Math.random() * 0.06;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {}
  }, []);

  // Character-by-character typewriter
  useEffect(() => {
    if (visibleChars >= totalChars) {
      setTimeout(() => setShowStars(true), 1000);
      return;
    }
    const currentChar = fullText[visibleChars];
    const isNewline = currentChar === "\n";
    // Slower speed: 45-75ms per char, longer pause for newlines
    const delay = isNewline ? 200 : (45 + Math.random() * 30);
    const t = setTimeout(() => {
      if (!isNewline && currentChar !== " ") playKeyClick();
      setVisibleChars(v => v + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [visibleChars, totalChars, fullText, playKeyClick]);

  const playVoiceNote = (note: VoiceNote) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (playingNote === note.name) {
      setPlayingNote(null);
      return;
    }
    const audio = new Audio(note.url);
    audio.play();
    audio.onended = () => setPlayingNote(null);
    audioRef.current = audio;
    setPlayingNote(note.name);
  };

  // Determine which lines get voice note dots
  const voiceNoteLines = [2, 5, 10, 14].filter(i => i < voiceNotes.length + 2);

  return (
    <div className="min-h-screen bg-princess-gradient relative overflow-hidden">
      <PinkParticlesBackground />

      <div className="relative z-10 p-6 pb-20 max-w-lg mx-auto">
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            navigate("/hub");
          }}
          className="fixed top-4 left-4 z-30 rounded-full w-10 h-10 flex items-center justify-center shadow-md"
          style={{
            background: "hsl(340, 60%, 90%)",
            color: "hsl(340, 40%, 35%)",
          }}
        >
          ←
        </motion.button>

        <div className="mt-16 space-y-1">
          {(() => {
            const visibleText = fullText.slice(0, visibleChars);
            const visibleLineTexts = visibleText.split("\n");
            return visibleLineTexts.map((lineText, i) => {
              const isTitle = i === 0;
              const voiceNoteIndex = voiceNoteLines.indexOf(i);
              const hasVoiceNote = voiceNoteIndex !== -1 && voiceNoteIndex < voiceNotes.length;
              // Only show completed lines (line is complete if we've passed its newline)
              const lineComplete = i < visibleLineTexts.length - 1;

              if (letterLines[i] === "" && lineComplete) {
                return <div key={i} className="h-4" />;
              }
              if (lineText === "" && !lineComplete) {
                return null;
              }

              return (
                <div key={i} className="flex items-start gap-2">
                  <p
                    className={isTitle ? "text-2xl text-primary mb-4" : "text-base leading-relaxed text-foreground/80"}
                    style={{
                      fontFamily: isTitle ? "'Dancing Script', cursive" : "'Quicksand', sans-serif",
                    }}
                  >
                    {lineText}
                    {/* Blinking cursor on the current line */}
                    {!lineComplete && (
                      <span
                        className="inline-block w-0.5 h-5 ml-0.5 align-middle"
                        style={{
                          backgroundColor: "hsl(340, 80%, 65%)",
                          animation: "blink 0.8s step-end infinite",
                        }}
                      />
                    )}
                  </p>
                  {hasVoiceNote && lineComplete && (
                    <button
                      onClick={() => playVoiceNote(voiceNotes[voiceNoteIndex])}
                      className="flex-shrink-0 mt-1 w-5 h-5 rounded-full flex items-center justify-center transition-transform hover:scale-125"
                      style={{
                        background: playingNote === voiceNotes[voiceNoteIndex].name
                          ? "hsl(340, 80%, 65%)"
                          : "hsl(340, 60%, 80%)",
                        boxShadow: playingNote === voiceNotes[voiceNoteIndex].name
                          ? "0 0 10px hsl(340, 80%, 65%, 0.5)"
                          : "none",
                      }}
                    >
                      <span className="text-white text-[8px]">
                        {playingNote === voiceNotes[voiceNoteIndex].name ? "■" : "▶"}
                      </span>
                    </button>
                  )}
                </div>
              );
            });
          })()}
        </div>

        {/* Stars forming "Kanze" */}
        {showStars && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.15 }}
            transition={{ duration: 3 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
          >
            <span
              className="text-[120px] md:text-[180px] text-glow-pink"
              style={{
                fontFamily: "'Dancing Script', cursive",
                color: "hsl(340, 80%, 75%)",
              }}
            >
              Kanze
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LetterPage;
