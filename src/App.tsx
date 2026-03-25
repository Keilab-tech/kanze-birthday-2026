import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { MusicProvider } from "@/contexts/MusicContext";
import { GalleryProvider } from "@/contexts/GalleryContext";
import { MomentsProvider } from "@/contexts/MomentsContext";

import Index from "./pages/Index";
import MemoryHub from "./components/MemoryHub";
import GalleryPage from "./pages/GalleryPage";
import MomentsPage from "./pages/MomentsPage";
import LetterPage from "./pages/LetterPage";
import FlowersPage from "./pages/FlowersPage";
import PWAInstallGate from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

const RefreshGuard = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const pageTransition = {
  duration: 0.35,
  ease: [0.25, 0.1, 0.25, 1],
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ minHeight: "100vh" }}
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/hub" element={<MemoryHub />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/moments" element={<MomentsPage />} />
          <Route path="/letter" element={<LetterPage />} />
          <Route path="/flowers" element={<FlowersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PWAInstallGate>
        <GalleryProvider>
          <MomentsProvider>
            <MusicProvider>
              <BrowserRouter>
                <RefreshGuard>
                  <AnimatedRoutes />
                </RefreshGuard>
              </BrowserRouter>
            </MusicProvider>
          </MomentsProvider>
        </GalleryProvider>
      </PWAInstallGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
