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
                    <div className="relative flex items-center justify-center p-2 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Clapperboard className="w-5 h-5 text-primary relative z-10 transition-transform group-hover:scale-110 group-hover:-rotate-12" />
                    </div>
                    <div className="flex flex-col leading-none">
                        <span className="font-black text-lg tracking-tighter text-foreground group-hover:text-primary transition-colors">
                            SCENE
                        </span>
                        <span className="text-[0.6rem] font-bold tracking-[0.2em] text-muted-foreground uppercase group-hover:text-primary/80 transition-colors">
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
