import React, { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AudioProvider } from "@/lib/AudioContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/layout/Sidebar";
import AudioBar from "@/components/layout/AudioBar";
import MushafHome from "@/pages/MushafHome";
import MushafReader from "@/pages/MushafReader";
import SearchPage from "@/pages/SearchPage";
import TajweedHub from "@/pages/TajweedHub";
import TajweedSession from "@/pages/TajweedSession";
import TajweedRuleDetail from "@/pages/TajweedRuleDetail";
import TajweedQuiz from "@/pages/TajweedQuiz";
import BookmarksPage from "@/pages/BookmarksPage";
import Dashboard from "@/pages/Dashboard";
import { Menu } from "lucide-react";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex overflow-hidden bg-[#070a0f]">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-80 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[#c8943f]/15 bg-[#070a0f] shrink-0">
          <button
            data-testid="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            className="text-[#8b95a5] hover:text-[#c8943f] transition-colors"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-light tracking-[0.2em] text-[#c8943f]">TILAWA</h1>
          <div className="w-6" />
        </div>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<MushafHome />} />
            <Route path="/mushaf/:surahId" element={<MushafReader />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/tajweed" element={<TajweedHub />} />
            <Route path="/tajweed/session/:verseKey" element={<TajweedSession />} />
            <Route path="/tajweed/rule/:ruleId" element={<TajweedRuleDetail />} />
            <Route path="/tajweed/quiz" element={<TajweedQuiz />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <AudioBar />
    </div>
  );
}

function App() {
  return (
    <TooltipProvider>
      <AudioProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </AudioProvider>
    </TooltipProvider>
  );
}

export default App;
