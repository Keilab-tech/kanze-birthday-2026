import KanzeStats from "./KanzeStats";
import PersonalityScanner from "./PersonalityScanner";
import SecretMode from "./SecretMode";

const MainApp = () => {
  return (
    <div className="min-h-screen bg-background animate-cinema-fade-in">
      {/* Header */}
      <header className="pt-16 pb-8 px-6 text-center">
        <h1 className="text-5xl font-bold gradient-text mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Kanze
        </h1>
        <p className="text-muted-foreground text-sm tracking-widest uppercase">Chapter 21</p>
      </header>

      <KanzeStats />

      <div className="w-16 h-px bg-border mx-auto" />

      <PersonalityScanner />

      <div className="w-16 h-px bg-border mx-auto" />

      <SecretMode />
    </div>
  );
};

export default MainApp;