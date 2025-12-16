import { useMemo, useState } from "react";
import { MapPin, ExternalLink, Film, Search, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

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
    // Use semantic colors for highlight
    return escaped.replace(re, '<span class="bg-primary/15 px-0.5 rounded">$1</span>');
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
    // ... (keep existing consts)
    const shortText: string =
        fullText.length > maxLen
            ? fullText.slice(0, maxLen - 1) + "…"
            : fullText;

    const shouldHaveToggle = fullText.length > maxLen;
    const [expanded, setExpanded] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    // ... (keep memod)

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
        <div className="group relative bg-card/60 backdrop-blur-md border border-border/40 hover:border-primary/30 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="p-4 sm:p-5 flex gap-4 sm:gap-6 relative z-10">
                {/* Poster */}
                <div className="shrink-0 relative">
                    {item.image ? (
                        <>
                            {imageLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 rounded-lg border border-border/20">
                                    <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                                </div>
                            )}
                            <img
                                src={item.image}
                                alt={`${item.title} poster`}
                                className={`w-20 h-28 sm:w-24 sm:h-36 object-cover rounded-lg shadow-lg border border-border/20 group-hover:border-primary/20 transition-colors ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={() => setImageLoading(false)}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                    setImageLoading(false);
                                }}
                            />
                        </>
                    ) : (
                        <div className="w-20 h-28 sm:w-24 sm:h-36 bg-muted/20 rounded-lg border border-border/20 flex flex-col items-center justify-center text-muted-foreground">
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
                                className="group/link inline-flex items-center gap-2 hover:text-primary transition-colors"
                            >
                                <h3
                                    className="text-lg sm:text-xl font-bold leading-tight text-foreground truncate"
                                    dangerouslySetInnerHTML={{
                                        __html: highlightText(item.title || "(no title)", query),
                                    }}
                                />
                                <ExternalLink className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity -ml-1 text-primary" />
                            </a>

                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                {item.country && (
                                    <span className="px-2 py-0.5 rounded bg-muted/40 border border-border/20 text-foreground">
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
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 hover:border-secondary/40 text-xs font-medium text-secondary transition-all shrink-0"
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
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground mb-3 hover:underline decoration-border underline-offset-4 transition-colors"
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}
                        </a>
                    )}

                    {/* Location Description */}
                    {item.location_description ? (
                        <div className="mb-3 text-sm text-foreground/80">
                            <span className="font-semibold text-foreground">Location: </span>
                            <span dangerouslySetInnerHTML={{ __html: highlightText(item.location_description, query) }} />
                        </div>
                    ) : (
                        (!item.location_address && !item.location_name) && (
                            <div className="mb-3 text-sm text-muted-foreground leading-relaxed">
                                <span dangerouslySetInnerHTML={{ __html: displayedHtml }} />
                            </div>
                        )
                    )}

                    {/* Clusters */}
                    {clusters && clusters.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {clusters.map((label) => (
                                <span key={label} className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded bg-accent/40 text-accent-foreground border border-accent/20">
                                    {label}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Mobile Actions / Toggle */}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground font-mono">ID: {item.id}</span>

                        <div className="flex gap-2">
                            {onFindSimilar && item.id && (
                                <button
                                    onClick={handleFindSimilar}
                                    className="sm:hidden flex items-center justify-center p-2 rounded-lg bg-secondary/10 text-secondary-foreground"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            )}

                            {shouldHaveToggle && (
                                <button
                                    onClick={() => setExpanded(!expanded)}
                                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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
