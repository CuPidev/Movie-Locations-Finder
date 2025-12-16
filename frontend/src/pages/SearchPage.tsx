import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Shuffle } from "lucide-react";

import ResultsCard from "../components/ResultsCard";
import SimilarDocumentsModal from "../components/SimilarDocumentsModal";
import ClustersList from "../components/ClustersList";

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
    const [clusters, setClusters] = useState<any[]>([]);
    const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

    // Modal state for "More Like This"
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedItemTitle, setSelectedItemTitle] = useState<string | undefined>(undefined);

    useEffect(() => {
        try {
            localStorage.setItem("hsf:k", k);
        } catch (e) { }
    }, [k]);

    const handleFindSimilar = (id: string, title?: string) => {
        setSelectedItemId(id);
        setSelectedItemTitle(title);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItemId(null);
        setSelectedItemTitle(undefined);
    };

    // Map docId -> list of cluster labels
    const docClusterMap = useMemo(() => {
        const map: Record<string, string[]> = {};
        clusters.forEach((c) => {
            const label = c.labels.join(", ");
            c.docs.forEach((docId: string) => {
                if (!map[docId]) map[docId] = [];
                map[docId].push(label);
            });
        });
        return map;
    }, [clusters]);

    const activeResults = useMemo(() => {
        if (!selectedCluster) return results;
        return results.filter((r) => {
            const docLabels = docClusterMap[r.id];
            return docLabels && docLabels.includes(selectedCluster);
        });
    }, [results, selectedCluster, docClusterMap]);

    function handleClusterSelect(label: string) {
        setSelectedCluster((prev) => (prev === label ? null : label));
    }

    async function doSearch() {
        const tq = q.trim();
        if (!tq) return;
        setLoading(true);
        setSelectedCluster(null);
        try {
            const res = await fetch(
                `/api/search?q=${encodeURIComponent(tq)}&k=${encodeURIComponent(k)}`
            );
            if (!res.ok) {
                setResults([]);
                setClusters([]);
                return;
            }
            const data = await res.json();
            setResults(Array.isArray(data.results) ? data.results : []);
            setClusters(Array.isArray(data.clusters) ? data.clusters : []);
        } catch (err) {
            setResults([]);
            setClusters([]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Hero Search Section */}
            <div className={`flex flex-col items-center transition-all duration-700 ease-out ${results.length > 0 ? 'py-8 min-h-[0vh]' : 'py-32 justify-center min-h-[60vh]'}`}>

                <h1 className={`text-4xl md:text-6xl font-black tracking-tighter text-foreground mb-2 text-center transition-all ${results.length > 0 ? 'hidden' : 'block'}`}>
                    Find Your <span className="text-cyan-400 text-glow">Scene</span>
                </h1>

                <p className={`text-muted-foreground text-lg mb-8 text-center max-w-lg ${results.length > 0 ? 'hidden' : 'block'}`}>
                    Discover the real-world locations behind your favorite cinematic moments.
                </p>

                <div className="w-full max-w-2xl mx-auto relative group z-20">
                    {/* Glow Effect with explicit GPU layering to prevent artifacts */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 transform-gpu will-change-[opacity]"></div>
                    <div className="relative z-10 flex items-center bg-card/90 backdrop-blur-xl border border-border/40 rounded-xl p-2 shadow-2xl">
                        <Search className="w-6 h-6 text-muted-foreground ml-3" />
                        <input
                            type="text"
                            className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-foreground placeholder-muted-foreground text-lg px-4 py-2"
                            placeholder="Search for movies, cities, or descriptions..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") doSearch();
                            }}
                        />
                        <div className="flex items-center gap-2 pr-2 border-l border-border/50 pl-2">
                            <select
                                className="bg-transparent text-muted-foreground text-sm focus:outline-none cursor-pointer hover:text-foreground"
                                value={k}
                                onChange={(e) => setK(e.target.value)}
                            >
                                <option value="5">5 results</option>
                                <option value="10">10 results</option>
                                <option value="20">20 results</option>
                                <option value="50">50 results</option>
                            </select>
                            <button
                                onClick={doSearch}
                                disabled={loading}
                                className="px-6 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg border border-primary/30 hover:border-primary/60 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                ) : "Search"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions (only show when no results) */}
                {!results.length && !loading && (
                    <div className="mt-8 flex gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <Link to="/browse?shuffle=1">
                            <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/40 bg-white/5 hover:bg-accent text-sm text-muted-foreground transition-colors">
                                <Shuffle className="w-4 h-4 text-purple-400" />
                                <span>Surprise Me</span>
                            </button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Results Section */}
            {(results.length > 0 || loading) && (
                <div className="animate-fade-in relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white/90">
                            {loading ? 'Searching...' : `Found ${results.length} locations`}
                        </h2>
                        {/* Clusters List could go here */}
                    </div>

                    <ClustersList
                        clusters={clusters}
                        selectedCluster={selectedCluster}
                        onSelectCluster={handleClusterSelect}
                    />

                    <div className="space-y-4">
                        {!loading && activeResults.length === 0 && results.length > 0 && (
                            <div className="p-8 text-center text-zinc-500 border border-dashed border-white/10 rounded-xl">
                                No results in this topic.
                            </div>
                        )}

                        {!loading && activeResults.length > 0 && (
                            <div className="grid grid-cols-1 gap-4">
                                {activeResults.map((r: any, i: number) => (
                                    <ResultsCard
                                        key={r.id || i}
                                        item={r}
                                        query={q}
                                        clusters={docClusterMap[r.id]}
                                        onFindSimilar={handleFindSimilar}
                                    />
                                ))}
                            </div>
                        )}

                        {!loading && results.length === 0 && q && (
                            <div className="p-12 text-center">
                                <p className="text-zinc-500 text-lg">No results found for "{q}"</p>
                                <p className="text-zinc-600 mt-2">Try broader keywords or browse randomly.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <SimilarDocumentsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                documentId={selectedItemId}
                documentTitle={selectedItemTitle}
            />
        </div>
    );
}
