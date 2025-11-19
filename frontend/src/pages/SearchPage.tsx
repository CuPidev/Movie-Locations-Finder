import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import ResultsCard from "../components/ResultsCard";

export default function SearchPage() {
    const [q, setQ] = useState("");
    const [k, setK] = useState(() => {
        try {
            return localStorage.getItem("hsf:k") || "10";
        } catch (e) {
            return "10";
        }
    });
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    useEffect(() => {
        try {
            localStorage.setItem("hsf:k", k);
        } catch (e) {}
    }, [k]);

    async function doSearch() {
        const tq = q.trim();
        if (!tq) return;
        setLoading(true);
        try {
            const res = await fetch(
                `/api/search?q=${encodeURIComponent(tq)}&k=${encodeURIComponent(
                    k
                )}`
            );
            if (!res.ok) {
                setResults([]);
                return;
            }
            const data = await res.json();
            // API returns {results: [...]}
            setResults(Array.isArray(data.results) ? data.results : []);
        } catch (err) {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Helmet>
                <title>Heritage Sites Finder - Search</title>
                <meta
                    name="description"
                    content="Search UNESCO World Heritage sites"
                />
            </Helmet>
            <div>
                <div className="mb-4 flex justify-center sm:justify-start">
                    <Link
                        to="/browse?shuffle=1"
                        className="inline-flex items-center gap-2 accent-text border px-3 py-2 rounded-lg"
                        style={{ borderColor: "var(--accent)" }}
                    >
                        <span className="font-medium text-sm">
                            I want to browse instead
                        </span>
                    </Link>
                </div>

                <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2 w-full">
                        <Input
                            id="q"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            type="text"
                            autoFocus
                            placeholder="type here e.g. old castle"
                            className="flex-1 min-w-0"
                        />
                        <Label htmlFor="k" className="sr-only">
                            Results
                        </Label>
                        <Select
                            id="k"
                            value={k}
                            onChange={(e) => setK(e.target.value)}
                            className="w-20"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </Select>
                    </div>

                    <div className="w-full sm:w-auto">
                        <Button
                            id="go"
                            onClick={doSearch}
                            disabled={loading}
                            className="w-full sm:w-auto"
                        >
                            {loading ? "Searching…" : "Search"}
                        </Button>
                    </div>

                    <div className="flex items-center">
                        <span
                            id="spinner"
                            className="spinner ml-2"
                            style={{
                                display: loading ? "inline-block" : "none",
                            }}
                            aria-hidden="true"
                        />
                    </div>
                </div>

                <div id="results" className="mt-4">
                    {q && (
                        <div className="mb-3 flex items-center justify-end">
                            <Link
                                to={`/browse?q=${encodeURIComponent(
                                    q
                                )}&limit=${encodeURIComponent(
                                    Math.max(10, parseInt(k, 10) || 10)
                                )}`}
                                className="text-sm accent-text mr-2"
                            >
                                Open full list
                            </Link>
                        </div>
                    )}

                    {results.length === 0 && <div>No results</div>}

                    <div className="space-y-3">
                        {results.map((r, i) => (
                            <ResultsCard key={i} item={r} query={q} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
