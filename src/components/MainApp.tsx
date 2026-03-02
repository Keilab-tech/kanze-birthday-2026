import { useNavigate } from "react-router-dom";

const MainApp = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background animate-cinema-fade-in">
      <header className="pt-16 pb-8 px-6 text-center">
        <h1 className="text-5xl font-bold gradient-text mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Kanze
        </h1>
        <p className="text-muted-foreground text-sm tracking-widest uppercase">Chapter 21</p>
      </header>

      <div className="max-w-md mx-auto px-6 space-y-5 py-12">
        <button
          onClick={() => navigate("/stats")}
          className="w-full bg-card border border-border rounded-xl p-6 text-left transition-all duration-300 hover:glow-pink group"
        >
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">01</p>
          <h2 className="text-xl font-bold text-foreground group-hover:gradient-text transition-all" style={{ fontFamily: "'Playfair Display', serif" }}>
            Kanze Stats
          </h2>
          <p className="text-muted-foreground text-sm mt-1">The numbers don't lie.</p>
        </button>

        <button
          onClick={() => navigate("/scanner")}
          className="w-full bg-card border border-border rounded-xl p-6 text-left transition-all duration-300 hover:glow-pink group"
        >
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">02</p>
          <h2 className="text-xl font-bold text-foreground group-hover:gradient-text transition-all" style={{ fontFamily: "'Playfair Display', serif" }}>
            Personality Scanner
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Let's see what we're working with.</p>
        </button>

        <button
          onClick={() => navigate("/secret")}
          className="w-full bg-card border border-border rounded-xl p-6 text-left transition-all duration-300 hover:glow-pink group"
        >
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">03</p>
          <h2 className="text-xl font-bold text-foreground group-hover:gradient-text transition-all" style={{ fontFamily: "'Playfair Display', serif" }}>
            Unlock Private Version
          </h2>
          <p className="text-muted-foreground text-sm mt-1">If you know, you know.</p>
        </button>
      </div>
    </div>
  );
};

export default MainApp;