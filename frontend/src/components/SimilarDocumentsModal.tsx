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
                className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-zinc-950/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5 backdrop-blur-md">
                    <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <span>Similar Locations</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/20">AI Powered</span>
                        </h3>
                        {documentTitle && (
                            <p className="text-sm text-zinc-400 mt-0.5 max-w-sm truncate">
                                Based on: <span className="text-zinc-200">{documentTitle}</span>
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                            <p className="text-sm text-zinc-400">Finding matches...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div>
                                <p className="font-medium text-sm">Unable to load similar documents</p>
                                <p className="text-xs opacity-70 mt-0.5">{error}</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && results.length === 0 && (
                        <div className="text-center py-12 text-zinc-500">
                            No similar documents found.
                        </div>
                    )}

                    {!loading && !error && results.length > 0 && (
                        <div className="space-y-4">
                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
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
