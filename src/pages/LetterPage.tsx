import { useState, useEffect, useRef } from "react";
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
  const [visibleLines, setVisibleLines] = useState(0);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [playingNote, setPlayingNote] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showStars, setShowStars] = useState(false);
  const { fadeDown, fadeUp } = useMusic();

  // Fade music down on mount, restore on unmount
  useEffect(() => {
    fadeDown();
    return () => { fadeUp(); };
  }, [fadeDown, fadeUp]);

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

  // Typewriter effect
  useEffect(() => {
    if (visibleLines >= letterLines.length) {
      setTimeout(() => setShowStars(true), 1000);
      return;
    }
    const delay = letterLines[visibleLines] === "" ? 400 : 600;
    const t = setTimeout(() => setVisibleLines(v => v + 1), delay);
    return () => clearTimeout(t);
  }, [visibleLines]);

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
          {letterLines.slice(0, visibleLines).map((line, i) => {
            const isTitle = i === 0;
            const voiceNoteIndex = voiceNoteLines.indexOf(i);
            const hasVoiceNote = voiceNoteIndex !== -1 && voiceNoteIndex < voiceNotes.length;

            if (line === "") {
              return <div key={i} className="h-4" />;
            }

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-start gap-2"
              >
                <p
                  className={isTitle ? "text-2xl text-primary mb-4" : "text-base leading-relaxed text-foreground/80"}
                  style={{
                    fontFamily: isTitle ? "'Dancing Script', cursive" : "'Quicksand', sans-serif",
                  }}
                >
                  {line}
                </p>
                {hasVoiceNote && (
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
              </motion.div>
            );
          })}

          {/* Cursor */}
          {visibleLines < letterLines.length && (
            <span
              className="inline-block w-0.5 h-5 animate-typewriter-cursor ml-1"
              style={{ backgroundColor: "hsl(340, 80%, 65%)" }}
            />
          )}
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
