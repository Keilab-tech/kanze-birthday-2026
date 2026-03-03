import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { MusicProvider } from "@/contexts/MusicContext";

import Index from "./pages/Index";
import MemoryHub from "./components/MemoryHub";
import GalleryPage from "./pages/GalleryPage";
import MomentsPage from "./pages/MomentsPage";
import LetterPage from "./pages/LetterPage";

const queryClient = new QueryClient();

// Redirect to "/" on fresh load if not already there
const RefreshGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!hasNavigated.current && location.pathname !== "/") {
      hasNavigated.current = true;
      navigate("/", { replace: true });
    } else {
      hasNavigated.current = true;
    }
  }, []);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MusicProvider>
        <BrowserRouter>
          <RefreshGuard>
            
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/hub" element={<MemoryHub />} />
              <Route path="/gallery" element={<GalleryPage />} />
              <Route path="/moments" element={<MomentsPage />} />
              <Route path="/letter" element={<LetterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </RefreshGuard>
        </BrowserRouter>
      </MusicProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
