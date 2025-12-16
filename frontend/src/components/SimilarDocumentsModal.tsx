import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, AlertCircle } from "lucide-react";
import ResultsCard from "./ResultsCard";

interface SimilarDocumentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string | null;
    documentTitle?: string;
}

export default function SimilarDocumentsModal({
    isOpen,
    onClose,
    documentId,
    documentTitle,
}: SimilarDocumentsModalProps) {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !documentId) {
            setResults([]);
            setError(null);
            return;
        }

        async function fetchSimilar() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(
                    `/api/more-like-this?id=${encodeURIComponent(documentId!)}`
                );
                if (!res.ok) {
                    throw new Error("Failed to fetch similar documents");
                }
                const data = await res.json();
                setResults(Array.isArray(data.results) ? data.results : []);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "An error occurred"
                );
                setResults([]);
            } finally {
                setLoading(false);
            }
        }

        fetchSimilar();
    }, [isOpen, documentId]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl overflow-hidden ring-1 ring-border/50">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20 backdrop-blur-md">
                    <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <span>Similar Locations</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">AI Powered</span>
                        </h3>
                        {documentTitle && (
                            <p className="text-sm text-muted-foreground mt-0.5 max-w-sm truncate">
                                Based on: <span className="text-foreground">{documentTitle}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Finding matches...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div>
                                <p className="font-medium text-sm">Unable to load similar documents</p>
                                <p className="text-xs opacity-70 mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && results.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No similar documents found.
                        </div>
                    )}

                    {!loading && !error && results.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                                Top {results.length} Matches
                            </p>
                            {results.map((item, i) => (
                                <ResultsCard
                                    key={item.id || i}
                                    item={item}
                                    maxLen={300}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
