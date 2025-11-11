import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider, Helmet } from "react-helmet-async";
import SearchPage from "./pages/SearchPage";
import BrowsePage from "./pages/BrowsePage";
import ThemeSelector from "./components/ThemeSelector";

export default function App() {
    return (
        <HelmetProvider>
            <BrowserRouter>
                <div className="min-h-screen bg-gray-50 text-gray-900">
                    <Helmet>
                        <title>Heritage Sites Finder</title>
                        <meta
                            name="description"
                            content="Search UNESCO World Heritage sites"
                        />
                    </Helmet>
                    <div className="max-w-3xl mx-auto px-4 py-6">
                        <header className="mb-6">
                            <h1 className="text-3xl font-semibold mb-2">
                                🪨Heritage Sites Finder
                            </h1>
                            <p className="text-sm text-gray-600 mb-2">
                                Search UNESCO World Heritage sites by keyword.
                            </p>
                            <div className="mt-3 mb-4 text-sm text-gray-600">
                                Theme: <ThemeSelector />
                            </div>
                            <div className="mt-3">
                                <h2 className="text-sm font-medium text-gray-700 mb-2">
                                    Authors — Team 19
                                </h2>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
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
