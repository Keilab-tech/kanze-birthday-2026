import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MusicProvider } from "@/contexts/MusicContext";
import Index from "./pages/Index";
import MemoryHub from "./components/MemoryHub";
import GalleryPage from "./pages/GalleryPage";
import MomentsPage from "./pages/MomentsPage";
import LetterPage from "./pages/LetterPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <MusicProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/hub" element={<MemoryHub />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/moments" element={<MomentsPage />} />
            <Route path="/letter" element={<LetterPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MusicProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
