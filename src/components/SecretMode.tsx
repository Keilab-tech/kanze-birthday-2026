import { useState } from "react";

const SECRET_PASSWORD = "habibi";

const SecretMode = () => {
  const [unlocked, setUnlocked] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleUnlock = () => {
    if (password.toLowerCase() === SECRET_PASSWORD) {
      setUnlocked(true);
      setShowInput(false);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  return (
    <section className="py-20 px-6 pb-32">
      <div className="max-w-md mx-auto text-center">
        {!unlocked && !showInput && (
          <button
            onClick={() => setShowInput(true)}
            className="text-muted-foreground/40 text-xs tracking-widest uppercase hover:text-muted-foreground transition-colors duration-500"
          >
            Unlock Private Version
          </button>
        )}

        {showInput && !unlocked && (
          <div className="animate-cinema-fade-in space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="Enter password"
              className="w-full bg-muted border border-border rounded-xl px-5 py-3 text-foreground text-center text-sm tracking-widest focus:outline-none focus:ring-1 focus:ring-primary"
              autoFocus
            />
            <button
              onClick={handleUnlock}
              className="px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm tracking-wide uppercase"
            >
              Unlock
            </button>
            {error && (
              <p className="text-destructive text-xs animate-cinema-fade-in">Wrong password</p>
            )}
          </div>
        )}

        {unlocked && (
          <div className="animate-cinema-fade-in space-y-6 py-8">
            <div className="w-20 h-20 rounded-full mx-auto animate-soft-glow" style={{
              background: "radial-gradient(circle, hsl(330 100% 70% / 0.3), transparent 70%)",
            }} />
            <div className="space-y-3">
              <p className="text-foreground/70 text-lg italic" style={{ fontFamily: "'Playfair Display', serif" }}>
                Public: Untouchable.
              </p>
              <p className="text-primary text-lg italic text-glow" style={{ fontFamily: "'Playfair Display', serif" }}>
                With me: Surprisingly soft.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SecretMode;