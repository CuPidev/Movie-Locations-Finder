import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import BrowsePage from "./pages/BrowsePage";
import SearchPage from "./pages/SearchPage";
import { Home } from "lucide-react";

// Simple Glass Header
function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/20 backdrop-blur-lg">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <a href="/" className="flex items-center gap-3 group">
                    <div className="relative w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center border border-cyan-500/50 group-hover:bg-cyan-500/30 transition-all">
                        <Home className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                        Movie<span className="text-cyan-400">Locations</span>
                    </span>
                </a>

                <nav className="flex items-center gap-6 text-sm font-medium text-zinc-400">
                    <a href="/" className="hover:text-cyan-400 transition-colors">Search</a>
                    <a href="/browse" className="hover:text-cyan-400 transition-colors">Browse</a>
                </nav>
            </div>
        </header>
    );
}

function Footer() {
    return (
        <footer className="border-t border-white/5 bg-black/40 backdrop-blur-sm mt-auto">
            <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-zinc-500 text-sm">
                    © 2025 Movie Locations Finder
                </div>
                <div className="flex items-center gap-6 text-sm text-zinc-500">
                    <span>Team 19</span>
                    <span>•</span>
                    <a href="#" className="hover:text-cyan-400">Mateusz Cupryniak</a>
                    <a href="#" className="hover:text-cyan-400">František Vlček</a>
                    <a href="#" className="hover:text-cyan-400">Vasyl Damian</a>
                </div>
            </div>
        </footer>
    );
}

export default function App() {
    return (
        <HelmetProvider>
            <BrowserRouter>
                <div className="flex flex-col min-h-screen font-sans text-white">
                    <Header />
                    <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in relative z-10">
                        <Routes>
                            <Route path="/" element={<SearchPage />} />
                            <Route path="/browse" element={<BrowsePage />} />
                            <Route path="/browse.html" element={<BrowsePage />} />
                            <Route path="*" element={<SearchPage />} />
                        </Routes>
                    </main>
                    <Footer />
                </div>
            </BrowserRouter>
        </HelmetProvider>
    );
}
