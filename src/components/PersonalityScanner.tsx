import { useState } from "react";

const results = [
  "Confidence level: Unmatched. She walks in and the room rearranges itself.",
  "Emotional intelligence: Dangerously high. She reads you before you speak.",
  "Style protocol: Every outfit is a statement. Fashion fears her.",
  "Loyalty index: Once you're in, you're protected. No exceptions.",
  "Vibe signature: Warm enough to trust. Sharp enough to respect.",
];

const PersonalityScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [visibleResults, setVisibleResults] = useState<number>(0);

  const handleScan = () => {
    if (scanned) return;
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
      // Reveal results one by one
      results.forEach((_, i) => {
        setTimeout(() => setVisibleResults(i + 1), (i + 1) * 600);
      });
    }, 2500);
  };

  return (
    <section className="py-20 px-6">
      <h2 className="text-3xl font-bold text-center mb-12 text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
        Personality Scanner
      </h2>

      <div className="max-w-md mx-auto text-center">
        {!scanned && (
          <button
            onClick={handleScan}
            disabled={scanning}
            className="relative px-8 py-4 rounded-xl bg-primary text-primary-foreground font-medium tracking-wide uppercase text-sm transition-all duration-300 hover:glow-pink-strong disabled:opacity-50"
          >
            {scanning ? (
              <span className="flex items-center gap-3">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Scanning Kanze…
              </span>
            ) : (
              "Scan Kanze"
            )}
          </button>
        )}

        {scanning && (
          <div className="mt-8 relative h-1 bg-muted rounded-full overflow-hidden max-w-xs mx-auto">
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-[2500ms] ease-out"
              style={{ width: "100%" }}
            />
          </div>
        )}

        {scanned && (
          <div className="space-y-4 mt-4 text-left">
            {results.slice(0, visibleResults).map((result, i) => (
              <div
                key={i}
                className="animate-cinema-fade-in bg-card border border-border rounded-xl p-5"
              >
                <p className="text-foreground/80 text-sm leading-relaxed">{result}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PersonalityScanner;