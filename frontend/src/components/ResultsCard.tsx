import { useMemo, useState } from "react";
import { MapPin, ExternalLink, Film, Search, ChevronDown, ChevronUp } from "lucide-react";

function escapeHtml(s: string) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function escapeRegex(s: string) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightText(text: string, query?: string) {
    if (!text) return "";
    const escaped = escapeHtml(text);
    if (!query) return escaped;
    const tokens = query
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map(escapeRegex);
    if (tokens.length === 0) return escaped;
    const re = new RegExp("(" + tokens.join("|") + ")", "ig");
    // Use Tailwind classes for highlight: bg-cyan-900/50 text-cyan-300
    return escaped.replace(re, '<span class="bg-cyan-500/20 text-cyan-300 px-0.5 rounded font-medium border border-cyan-500/20">$1</span>');
}

interface ResultsCardProps {
    item: any;
    query?: string;
    maxLen?: number;
    clusters?: string[];
    onFindSimilar?: (id: string, title?: string) => void;
}

export default function ResultsCard({
    item,
    query,
    maxLen = 800,
    clusters,
    onFindSimilar,
}: ResultsCardProps) {
    const fullText: string = item.content || "";
    const shortText: string =
        fullText.length > maxLen
            ? fullText.slice(0, maxLen - 1) + "…"
            : fullText;

    // Always show toggle if text is long enough
    const shouldHaveToggle = fullText.length > maxLen;
    const [expanded, setExpanded] = useState(false);

    const displayedHtml = useMemo(() => {
        return highlightText(expanded ? fullText : shortText, query);
    }, [expanded, fullText, shortText, query]);

    const handleFindSimilar = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onFindSimilar && item.id) {
            onFindSimilar(item.id, item.title);
        }
    };

    return (
        <div className="group relative bg-black/40 backdrop-blur-md border border-white/10 hover:border-cyan-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="p-4 sm:p-5 flex gap-4 sm:gap-6 relative z-10">
                {/* Poster */}
                <div className="shrink-0">
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={`${item.title} poster`}
                            className="w-20 h-28 sm:w-24 sm:h-36 object-cover rounded-lg shadow-lg border border-white/10 group-hover:border-white/20 transition-colors"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                                // Fallback logic would require state or parent handling, simpler to just hide or show placeholder
                            }}
                        />
                    ) : (
                        <div className="w-20 h-28 sm:w-24 sm:h-36 bg-zinc-900 rounded-lg border border-white/10 flex flex-col items-center justify-center text-zinc-600">
                            <Film className="w-8 h-8 mb-1 opacity-50" />
                            <span className="text-[10px] uppercase tracking-wider">No Image</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="min-w-0">
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/link inline-flex items-center gap-2 hover:text-cyan-400 transition-colors"
                            >
                                <h3
                                    className="text-lg sm:text-xl font-bold leading-tight text-white truncate"
                                    dangerouslySetInnerHTML={{
                                        __html: highlightText(item.title || "(no title)", query),
                                    }}
                                />
                                <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity -ml-1 text-cyan-500" />
                            </a>

                            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                                {item.country && (
                                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300">
                                        {item.country}
                                    </span>
                                )}
                                {typeof item.score === "number" && (
                                    <span className="opacity-60">Score: {item.score.toFixed(2)}</span>
                                )}
                            </div>
                        </div>

                        {onFindSimilar && item.id && (
                            <button
                                onClick={handleFindSimilar}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-xs font-medium text-zinc-300 hover:text-cyan-400 transition-all shrink-0"
                                title="Find similar locations"
                            >
                                <Search className="w-3.5 h-3.5" />
                                <span>Similar</span>
                            </button>
                        )}
                    </div>

                    {/* Coordinates */}
                    {(item.latitude || item.longitude) && (
                        <a
                            href={`https://www.google.com/maps?q=${item.latitude},${item.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-500 hover:text-cyan-400 mb-3 hover:underline decorations-cyan-500/30 underline-offset-4 transition-colors"
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                        </a>
                    )}

                    {/* Location Description */}
                    {item.location_description ? (
                        <div className="mb-3 text-sm text-zinc-300">
                            <span className="font-semibold text-zinc-100">Location: </span>
                            <span dangerouslySetInnerHTML={{ __html: highlightText(item.location_description, query) }} />
                        </div>
                    ) : (
                        (!item.location_address && !item.location_name) && (
                            <div className="mb-3 text-sm text-zinc-400 leading-relaxed">
                                <span dangerouslySetInnerHTML={{ __html: displayedHtml }} />
                            </div>
                        )
                    )}

                    {/* Clusters */}
                    {clusters && clusters.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {clusters.map((label) => (
                                <span key={label} className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Mobile Actions / Toggle */}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-zinc-600 font-mono">ID: {item.id}</span>

                        <div className="flex gap-2">
                            {onFindSimilar && item.id && (
                                <button
                                    onClick={handleFindSimilar}
                                    className="sm:hidden flex items-center justify-center p-2 rounded-lg bg-white/5 text-zinc-300"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            )}

                            {shouldHaveToggle && (
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                                >
                                    {expanded ? (
                                        <>Show Less <ChevronUp className="w-3 h-3" /></>
                                    ) : (
                                        <>Show More <ChevronDown className="w-3 h-3" /></>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
