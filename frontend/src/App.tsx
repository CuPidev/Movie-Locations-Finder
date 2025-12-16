import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import BrowsePage from "./pages/BrowsePage";
import SearchPage from "./pages/SearchPage";
import { Clapperboard } from "lucide-react";
import GridBackground from "./components/GridBackground";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";

// Simple Glass Header (Redesigned)
function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/20 backdrop-blur-lg transition-all duration-300">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2 group">
                    <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 group-hover:from-cyan-500/20 group-hover:to-purple-500/20 transition-all duration-300 overflow-hidden border border-white/5 group-hover:border-white/10">
                        <Clapperboard className="w-5 h-5 text-cyan-500 group-hover:text-purple-400 transition-colors relative z-10 group-hover:scale-110 group-hover:-rotate-12 duration-300" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-lg tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-600">
                            SCENE
                        </span>
                        <span className="text-[0.6rem] font-bold tracking-[0.2em] text-purple-500/80 uppercase group-hover:text-purple-500 transition-colors pl-0.5">
                            SCOUT
                        </span>
                    </div>
                </a>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}

function Footer() {
    return (
        <footer className="border-t border-border/40 bg-background/40 backdrop-blur-sm mt-auto">
            <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-muted-foreground text-sm">
                    © 2025 Scene Scout
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>Team 19</span>
                    <span>•</span>
                    <a href="#" className="hover:text-primary">Mateusz Cupryniak</a>
                    <a href="#" className="hover:text-primary">František Vlček</a>
                    <a href="#" className="hover:text-primary">Vasyl Damian</a>
                </div>
            </div>
        </footer>
    );
}

export default function App() {
    return (
        <HelmetProvider>
            <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                <BrowserRouter>
                    <div className="flex flex-col min-h-screen font-sans text-foreground relative bg-background transition-colors duration-300">
                        <GridBackground />
                        <Header />
                        <main className="flex-1 container mx-auto px-4 py-8 animate-fade-in relative z-10 text-foreground">
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
            </ThemeProvider>
        </HelmetProvider>
    );
}
