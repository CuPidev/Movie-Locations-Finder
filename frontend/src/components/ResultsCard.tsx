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

export default function ResultsCard({ item, query, maxLen = 800 }: any) {
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

    return (
        <Card
            className={"result" + (expanded ? " expanded" : "")}
            tabIndex={0}
            aria-labelledby={item.id ? `title-${item.id}` : undefined}
        >
            <div className="result-header flex items-center justify-between mb-2">
                <div>
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

            {shouldHaveToggle && (
                <Button
                    type="button"
                    variant="outline"
                    className="show-more px-3 py-1 text-xs"
                    onClick={() => setExpanded((s) => !s)}
                >
                    {expanded ? "Show less" : "Show more"}
                </Button>
            )}
        </Card>
    );
}
