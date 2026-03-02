import KanzeStats from "../components/KanzeStats";
import { useNavigate } from "react-router-dom";

const StatsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <button
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 text-muted-foreground text-xs tracking-widest uppercase hover:text-foreground transition-colors z-10"
      >
        ← Back
      </button>
      <KanzeStats />
    </div>
  );
};

export default StatsPage;