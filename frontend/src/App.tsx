import { Helmet, HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ThemeSelector from "./components/ThemeSelector";
import BrowsePage from "./pages/BrowsePage";
import SearchPage from "./pages/SearchPage";

export default function App() {
    return (
        <HelmetProvider>
            <BrowserRouter>
                <div className="min-h-screen">
                    <Helmet>
                        <title>Movie Filming Locations Finder</title>
                        <meta
                            name="description"
                            content="Movie Filming Locations Finder"
                        />
                    </Helmet>
                    <div className="max-w-3xl mx-auto px-4 py-6">
                        <header className="mb-6">
                            <h1 className="text-3xl font-semibold mb-2">
                                🪨🎬Movie Filming Locations Finder
                            </h1>
                            <p
                                className="text-sm mb-2"
                                style={{ color: "var(--muted)" }}
                            >
                                Search UNESCO World Heritage sites by keyword.
                            </p>
                            <div
                                className="mt-3 mb-4 text-sm"
                                style={{ color: "var(--muted)" }}
                            >
                                Theme: <ThemeSelector />
                            </div>
                            <div className="mt-3">
                                <h2
                                    className="text-sm font-medium mb-2"
                                    style={{ color: "var(--muted)" }}
                                >
                                    Authors — Team 19
                                </h2>
                                <ul
                                    className="list-disc pl-5 space-y-1 text-sm"
                                    style={{ color: "var(--muted)" }}
                                >
                                    <li>Mateusz Cupryniak</li>
                                    <li>František Vlček</li>
                                    <li>Vasyl Damian</li>
                                </ul>
                            </div>
                        </header>

                        <Routes>
                            <Route path="/" element={<SearchPage />} />
                            <Route path="/browse" element={<BrowsePage />} />
                            <Route
                                path="/browse.html"
                                element={<BrowsePage />}
                            />
                            {/* fallback to Search for unknown paths */}
                            <Route path="*" element={<SearchPage />} />
                        </Routes>
                    </div>
                </div>
            </BrowserRouter>
        </HelmetProvider>
    );
}
