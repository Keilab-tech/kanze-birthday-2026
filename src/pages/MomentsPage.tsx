import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Camera } from "lucide-react";
import PinkParticlesBackground from "@/components/PinkParticlesBackground";
import { useMoments, MomentPhoto } from "@/contexts/MomentsContext";

const MomentsPage = () => {
  const navigate  = useNavigate();
  const { moments, loading, labels, addMoments, deleteMoment, setLabel } = useMoments();
  const [uploading, setUploading] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting,  setDeleting]  = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftText, setDraftText] = useState("");
  const [selected,  setSelected]  = useState<MomentPhoto | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;
    setUploading(true);
    await addMoments(Array.from(picked));
    setUploading(false);
    e.target.value = "";
  };

  const handleDeleteClick = async (e: React.MouseEvent, moment: MomentPhoto) => {
    e.stopPropagation();
    if (confirmId !== moment.id) { setConfirmId(moment.id); return; }
    setConfirmId(null);
    setDeleting(moment.id);
    await deleteMoment(moment);
    setDeleting(null);
  };

  const startEdit = (e: React.MouseEvent | React.FocusEvent, moment: MomentPhoto) => {
    e.stopPropagation();
    setEditingId(moment.id);
    setDraftText(labels[String(moment.id)] ?? "");
  };

  const commitEdit = (moment: MomentPhoto) => {
    setLabel(moment.id, draftText);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-princess-gradient relative overflow-hidden">
      <PinkParticlesBackground />

      <div className="relative z-10 p-4 pb-28">
        {/* Back */}
        <motion.button
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
          onClick={() => navigate("/hub")}
          data-testid="button-back-moments"
          className="fixed top-4 left-4 z-30 rounded-full w-11 h-11 flex items-center justify-center shadow-sm"
          style={{ background: "hsl(340, 60%, 92%)", color: "hsl(340, 40%, 35%)" }}
        >←</motion.button>

        <motion.h1
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="text-3xl text-primary text-center mt-14 mb-8"
          style={{ fontFamily: "'Dancing Script', cursive" }}
        >
          Moments 📸
        </motion.h1>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : moments.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-52 gap-3 text-center"
          >
            <Camera size={40} style={{ color: "hsl(340, 50%, 70%)" }} />
            <p className="text-sm" style={{ color: "hsl(340, 40%, 55%)", fontFamily: "'Quicksand', sans-serif" }}>
              No moments yet — tap the button below to add one
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-5">
            {moments.map((moment, i) => (
              <motion.div
                key={moment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="rounded-[1.4rem] overflow-hidden"
                style={{ boxShadow: "0 2px 14px hsl(340 30% 60% / 0.15)" }}
              >
                {/* Photo */}
                <div className="relative group">
                  <img
                    src={moment.url}
                    alt={moment.name}
                    className="w-full object-cover cursor-pointer"
                    style={{
                      display: "block",
                      borderRadius: "1.4rem 1.4rem 0 0",
                      maxHeight: "75vw",
                      objectFit: "cover",
                    }}
                    loading="lazy"
                    onClick={() => setSelected(moment)}
                    data-testid={`img-moment-${moment.id}`}
                  />

                  {/* Delete overlay */}
                  <AnimatePresence mode="wait">
                    {deleting === moment.id ? (
                      <motion.div key="spin"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full"
                        style={{ background: "rgba(0,0,0,0.55)" }}
                      >
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      </motion.div>
                    ) : confirmId === moment.id ? (
                      <motion.div key="confirm"
                        initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-3 right-3 flex gap-2"
                      >
                        <button
                          data-testid={`button-confirm-delete-moment-${moment.id}`}
                          onClick={(e) => handleDeleteClick(e, moment)}
                          className="text-xs px-3 py-1.5 rounded-full font-medium shadow"
                          style={{ background: "hsl(0, 75%, 55%)", color: "#fff", fontFamily: "'Quicksand', sans-serif" }}
                        >Delete</button>
                        <button
                          data-testid={`button-cancel-delete-moment-${moment.id}`}
                          onClick={(e) => { e.stopPropagation(); setConfirmId(null); }}
                          className="text-xs px-3 py-1.5 rounded-full font-medium shadow"
                          style={{ background: "rgba(0,0,0,0.52)", color: "#fff", fontFamily: "'Quicksand', sans-serif" }}
                        >Cancel</button>
                      </motion.div>
                    ) : (
                      <motion.button key="trash"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        data-testid={`button-delete-moment-${moment.id}`}
                        onClick={(e) => handleDeleteClick(e, moment)}
                        className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full
                                   opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        style={{ background: "rgba(0,0,0,0.52)" }}
                      >
                        <Trash2 size={15} color="#fff" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label strip */}
                <div className="px-4 py-3" style={{ background: "hsl(340, 60%, 97%)" }}>
                  {editingId === moment.id ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        autoFocus
                        data-testid={`textarea-label-moment-${moment.id}`}
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        placeholder="Describe this moment…"
                        rows={2}
                        className="w-full text-sm resize-none rounded-xl px-3 py-2 outline-none border"
                        style={{
                          fontFamily: "'Dancing Script', cursive",
                          fontSize: 15,
                          color: "hsl(340, 35%, 32%)",
                          borderColor: "hsl(340, 50%, 80%)",
                          background: "#fff",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          data-testid={`button-cancel-label-${moment.id}`}
                          onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                          className="text-xs px-3 py-1.5 rounded-full"
                          style={{ color: "hsl(340, 40%, 55%)", fontFamily: "'Quicksand', sans-serif", background: "hsl(340, 60%, 92%)" }}
                        >Cancel</button>
                        <button
                          data-testid={`button-save-label-${moment.id}`}
                          onClick={(e) => { e.stopPropagation(); commitEdit(moment); }}
                          className="text-xs px-3 py-1.5 rounded-full font-medium"
                          style={{ background: "hsl(340, 65%, 65%)", color: "#fff", fontFamily: "'Quicksand', sans-serif" }}
                        >Save ✓</button>
                      </div>
                    </div>
                  ) : (
                    <p
                      data-testid={`text-label-moment-${moment.id}`}
                      onClick={(e) => startEdit(e, moment)}
                      className="cursor-text min-h-[28px] select-none"
                      style={{
                        fontFamily: "'Dancing Script', cursive",
                        fontSize: 15,
                        lineHeight: 1.5,
                        color: labels[String(moment.id)]
                          ? "hsl(340, 35%, 32%)"
                          : "hsl(340, 30%, 68%)",
                      }}
                    >
                      {labels[String(moment.id)] || "Tap to add a label…"}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Floating upload button */}
      <input
        ref={fileRef}
        id="moments-file-input"
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleUpload}
      />
      <motion.label
        htmlFor="moments-file-input"
        data-testid="button-upload-moment"
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-6 right-5 z-30 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
        style={{
          background: "linear-gradient(135deg, hsl(340,75%,65%), hsl(10,80%,65%))",
          color: "white",
          boxShadow: "0 4px 20px hsl(340 70% 60% / 0.35)",
          pointerEvents: uploading ? "none" : "auto",
        }}
      >
        {uploading
          ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
          : <Camera size={22} />}
      </motion.label>
      <div className="fixed bottom-[4.5rem] right-5 z-30 text-center" style={{ width: "3.5rem" }}>
        <span className="text-[9px] tracking-wide"
          style={{ color: "hsl(340, 50%, 55%)", fontFamily: "'Quicksand', sans-serif" }}>
          {uploading ? "Adding…" : "Add"}
        </span>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(null); }}
              className="absolute top-5 left-5 z-[60] rounded-full w-11 h-11 flex items-center justify-center shadow-sm text-lg font-medium"
              style={{ background: "hsl(340, 60%, 92%)", color: "hsl(340, 40%, 30%)" }}
            >←</button>
            <motion.img
              initial={{ scale: 0.85 }} animate={{ scale: 1 }}
              src={selected.url} alt={selected.name}
              className="max-w-full max-h-[85vh] rounded-2xl"
              style={{ boxShadow: "0 4px 24px hsl(0 0% 0% / 0.4)" }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MomentsPage;
