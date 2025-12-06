import { Button, Card } from "@chakra-ui/react";
import { useMemo, useState } from "react";

const MIN_SHOW_MORE_CHARS = 220;

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
    return escaped.replace(re, '<span class="highlight">$1</span>');
}

interface ResultsCardProps {
    item: any;
    query?: string;
    maxLen?: number;
    onFindSimilar?: (id: string, title?: string) => void;
}

export default function ResultsCard({ item, query, maxLen = 800, onFindSimilar }: ResultsCardProps) {
    const fullText: string = item.content || "";
    const shortText: string =
        fullText.length > maxLen
            ? fullText.slice(0, maxLen - 1) + "…"
            : fullText;
    const shouldHaveToggle = true;
    const [expanded, setExpanded] = useState(false);

    const displayedHtml = useMemo(() => {
        return highlightText(expanded ? fullText : shortText, query);
    }, [expanded, fullText, shortText, query]);

    const handleFindSimilar = () => {
        if (onFindSimilar && item.id) {
            onFindSimilar(item.id, item.title);
        }
    };

    return (
        <Card
            className={"result" + (expanded ? " expanded" : "")}
            tabIndex={0}
            aria-labelledby={item.id ? `title-${item.id}` : undefined}
            position="relative"
            overflow="hidden"
            maxH={expanded ? "2000px" : "14rem"}
            transitionProperty="max-height"
            transitionDuration="220ms"
        >
            <div className="result-header flex items-center justify-between mb-2">
                <div>
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        <div
                            id={item.id ? `title-${item.id}` : undefined}
                            className="result-title font-semibold text-lg"
                            dangerouslySetInnerHTML={{
                                __html: highlightText(
                                    item.title || "(no title)",
                                    query
                                ),
                            }}
                        />
                    </a>
                </div>
                <div className="flex items-center gap-2">
                    {item.country && (
                        <span className="country-badge bg-muted px-2 py-0.5 rounded text-xs">
                            {item.country}
                        </span>
                    )}
                    {typeof item.score === "number" && (
                        <span className="score text-xs text-muted-foreground">
                            [{item.score.toFixed(3)}]
                        </span>
                    )}
                </div>
            </div>

            <p
                className="description mb-2"
                dangerouslySetInnerHTML={{ __html: displayedHtml }}
            />

            <div className="meta text-xs text-muted-foreground mb-2">
                {item.id ? `id: ${item.id}` : ""}
            </div>

            {/* Find Similar button - top right */}
            {onFindSimilar && item.id && (
                <Button
                    type="button"
                    variant="outline"
                    className="find-similar px-3 py-1 text-xs"
                    position="absolute"
                    right={3}
                    top={3}
                    borderColor="var(--accent)"
                    color="var(--accent-700)"
                    onClick={handleFindSimilar}
                    size="sm"
                    zIndex={1}
                >
                    🔍 Find Similar
                </Button>
            )}

            {/* Show more button - bottom right */}
            {shouldHaveToggle && (
                <Button
                    type="button"
                    variant="outline"
                    className="show-more px-3 py-1 text-xs"
                    position="absolute"
                    right={3}
                    bottom={3}
                    borderColor="var(--accent)"
                    color="var(--accent-700)"
                    onClick={() => setExpanded((s) => !s)}
                    size="sm"
                >
                    {expanded ? "Show less" : "Show more"}
                </Button>
            )}
        </Card>
    );
}
