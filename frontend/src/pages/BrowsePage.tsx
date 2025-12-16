import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Shuffle, ChevronLeft, ChevronRight } from "lucide-react";
import ResultsCard from "../components/ResultsCard";
import SimilarDocumentsModal from "../components/SimilarDocumentsModal";

function qs(key: string, fallback?: string) {
    const params = new URLSearchParams(location.search);
    return params.has(key) ? params.get(key) : fallback;
}

export default function BrowsePage() {
    const [offset, setOffset] = useState(
        () => parseInt(qs("offset", "0") || "0", 10) || 0
    );
    const [limit, setLimit] = useState(() =>
        Math.min(
            100,
            Math.max(1, parseInt(qs("limit", "10") || "10", 10) || 10)
        )
    );
    const [q] = useState(() => qs("q", "") || "");
    const [shuffleMode, setShuffleMode] = useState(
        () => qs("shuffle", "0") === "1"
    );
    const [total, setTotal] = useState(0);
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal state for "More Like This"
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedItemTitle, setSelectedItemTitle] = useState<string | undefined>(undefined);

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

    useEffect(() => {
        loadPage(offset, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function updateUrl(params: Record<string, string>) {
        const u = new URL(location as any);
        Object.entries(params).forEach(([k, v]) => {
            if (v === "" || v == null) u.searchParams.delete(k);
            else u.searchParams.set(k, v);
        });
        history.replaceState(null, "", u.toString());
    }

    async function loadPage(start = 0, shuffle = false) {
        const params = new URLSearchParams();
        params.set("offset", String(start));
        params.set("limit", String(limit));
        const useShuffle = shuffle || shuffleMode;
        if (useShuffle) params.set("shuffle", "1");
        if (q) params.set("q", q);
        const url = `/api/browse?${params.toString()}`;
        setLoading(true);
        try {
            const res = await fetch(url);
            if (!res.ok) {
                setItems([]);
                return;
            }
            const data = await res.json();
            setTotal(data.total || 0);
            setItems(data.items || []);
            setOffset(start);
        } catch (err) {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }

    function onLimitChange(n: number) {
        setLimit(n);
        setOffset(0);
        updateUrl({ limit: String(n), offset: "0" });
        loadPage(0);
    }

    function toggleShuffle() {
        const next = !shuffleMode;
        setShuffleMode(next);
        const u = new URL(location as any);
        if (next) u.searchParams.set("shuffle", "1");
        else u.searchParams.delete("shuffle");
        u.searchParams.set("offset", "0");
        history.replaceState(null, "", u.toString());
        setOffset(0);
        loadPage(0, next);
    }

    return (
        <div className="max-w-5xl mx-auto">
            <Helmet>
                <title>Scene Scout - Browse</title>
                <meta name="description" content="Browse movie filming locations" />
            </Helmet>

            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <Link
                    to="/"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group self-start sm:self-auto"
                >
                    <div className="p-2 rounded-full bg-secondary/10 group-hover:bg-secondary/20 group-hover:-translate-x-1 transition-all">
                        <ArrowLeft className="w-4 h-4" />
                    </div>
                    <span className="font-medium">Back to Search</span>
                </Link>

                <div className="flex items-center gap-4 bg-card/60 backdrop-blur-md p-2 rounded-xl border border-border/40">
                    <div className="flex items-center gap-2 px-2">
                        <span className="text-sm text-muted-foreground">Per page:</span>
                        <select
                            value={String(limit)}
                            onChange={(e) => onLimitChange(parseInt(e.target.value, 10) || limit)}
                            className="bg-transparent text-sm text-foreground focus:outline-none cursor-pointer"
                        >
                            {[10, 20, 50, 100].map((n) => (
                                <option key={n} value={String(n)} className="bg-popover text-popover-foreground">
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="w-px h-6 bg-border/40" />

                    <button
                        onClick={toggleShuffle}
                        className={`
                            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                            ${shuffleMode
                                ? 'bg-primary/20 text-primary border border-primary/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                            }
                        `}
                    >
                        <Shuffle className="w-4 h-4" />
                        <span>{shuffleMode ? "Shuffle On" : "Shuffle Off"}</span>
                    </button>
                </div>
            </div>

            <div className="space-y-4 min-h-[50vh]">
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        Loading locations...
                    </div>
                )}

                {!loading && items.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground border border-dashed border-border/40 rounded-xl">
                        No items found.
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {items.map((it, i) => (
                        <ResultsCard
                            key={it.id || `item-${offset}-${i}`}
                            item={it}
                            query={q}
                            maxLen={400}
                            onFindSimilar={handleFindSimilar}
                        />
                    ))}
                </div>
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-6">
                <div className="text-sm text-muted-foreground">
                    Showing <span className="text-foreground">{Math.min(total, offset + 1)}</span> - <span className="text-foreground">{Math.min(total, offset + limit)}</span> of <span className="text-foreground">{total}</span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const n = Math.max(0, offset - limit);
                            setOffset(n);
                            loadPage(n);
                        }}
                        disabled={offset === 0 || loading}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all border disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-muted/20 disabled:text-muted-foreground disabled:border-border/50 enabled:bg-secondary/10 enabled:border-secondary/20 enabled:hover:border-secondary/40 enabled:text-secondary enabled:hover:bg-secondary/20"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>
                    <button
                        onClick={() => {
                            const n = offset + limit;
                            if (n < total) {
                                setOffset(n);
                                loadPage(n);
                            }
                        }}
                        disabled={offset + limit >= total || loading}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all border disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-muted/20 disabled:text-muted-foreground disabled:border-border/50 enabled:bg-secondary/10 enabled:border-secondary/20 enabled:hover:border-secondary/40 enabled:text-secondary enabled:hover:bg-secondary/20"
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <SimilarDocumentsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                documentId={selectedItemId}
                documentTitle={selectedItemTitle}
            />
        </div>
    );
}
