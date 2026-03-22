const LETTER_TEXT =
  "Dear Kanze... ✦ If I could pause time, I'd choose the moments with you. ✦ " +
  "You've grown into someone so beautiful — not just on the outside, " +
  "but in the way you care, the way you laugh, the way you love. ✦ " +
  "21 years of you in this world, and every single one of them matters. ✦ " +
  "I hope this year brings you everything your heart has been whispering about. ✦ " +
  "The dreams you haven't said out loud — I hope they all come true. ✦ " +
  "You deserve flowers on ordinary days. ✦ " +
  "You deserve people who stay. ✦ " +
  "You deserve a love that feels like home. ✦ " +
  "No matter where life takes us... I'm grateful it gave me you. ✦ ";

const LetterMarquee = () => (
  <div
    className="w-full overflow-hidden relative"
    style={{
      height: "2.1rem",
      background: "hsl(340 80% 92% / 0.55)",
      borderTop: "1px solid hsl(340 60% 85% / 0.5)",
      borderBottom: "1px solid hsl(340 60% 85% / 0.5)",
    }}
  >
    {/* left & right fade masks */}
    <div
      className="absolute inset-y-0 left-0 w-10 z-10 pointer-events-none"
      style={{ background: "linear-gradient(to right, hsl(340 80% 92%), transparent)" }}
    />
    <div
      className="absolute inset-y-0 right-0 w-10 z-10 pointer-events-none"
      style={{ background: "linear-gradient(to left, hsl(340 80% 92%), transparent)" }}
    />

    {/* scrolling track — two copies side by side for seamless loop */}
    <div
      className="flex items-center h-full whitespace-nowrap"
      style={{ animation: "marquee-scroll 60s linear infinite" }}
    >
      <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "0.85rem", color: "hsl(340, 55%, 48%)", letterSpacing: "0.01em" }}>
        {LETTER_TEXT}
      </span>
      {/* duplicate for seamless loop */}
      <span style={{ fontFamily: "'Dancing Script', cursive", fontSize: "0.85rem", color: "hsl(340, 55%, 48%)", letterSpacing: "0.01em" }}>
        {LETTER_TEXT}
      </span>
    </div>

    <style>{`
      @keyframes marquee-scroll {
        0%   { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
  </div>
);

export default LetterMarquee;
