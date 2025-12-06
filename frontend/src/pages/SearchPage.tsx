import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";

import { Box, Button, Input, Select } from "@chakra-ui/react";
import ResultsCard from "../components/ResultsCard";
import SimilarDocumentsModal from "../components/SimilarDocumentsModal";

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
                <title>Movie Sites Finder - Search</title>
                <meta
                    name="description"
                    content="Search movie sites"
                />
            </Helmet>
            <Box>
                <Box mb={4} display="flex" justifyContent="center">
                    <Link to="/browse?shuffle=1">
                        <Button
                            bg="var(--accent)"
                            color="var(--button-text)"
                            _hover={{ bg: "var(--accent-700)" }}
                        >
                            I want to browse instead
                        </Button>
                    </Link>
                </Box>
                <Box
                    mb={4}
                    display="flex"
                    flexDirection={{ base: "column", sm: "row" }}
                    gap={2}
                    alignItems="center"
                >
                    <Input
                        id="q"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        type="text"
                        autoFocus
                        placeholder="type here e.g. old castle"
                        flex={1}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") doSearch();
                        }}
                    />
                    <Select
                        id="k"
                        value={k}
                        onChange={(e) => setK(e.target.value)}
                        width="80px"
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </Select>
                    <Button
                        id="go"
                        onClick={doSearch}
                        disabled={loading}
                        bg="var(--accent)"
                        color="var(--button-text)"
                        _hover={{ bg: "var(--accent-700)" }}
                    >
                        {loading ? "Searching…" : "Search"}
                    </Button>
                </Box>
                <Box mt={4}>
                    {q && (
                        <Box mb={3} display="flex" justifyContent="flex-end">
                            <Link
                                to={`/browse?q=${encodeURIComponent(
                                    q
                                )}&limit=${encodeURIComponent(
                                    Math.max(10, parseInt(k, 10) || 10)
                                )}`}
                            >
                                <Button variant="link" size="sm">
                                    Open full list
                                </Button>
                            </Link>
                        </Box>
                    )}
                    {results.length === 0 && <Box>No results</Box>}
                    <Box>
                        {results.map((r, i) => (
                            <ResultsCard key={i} item={r} query={q} onFindSimilar={handleFindSimilar} />
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* More Like This Modal */}
            <SimilarDocumentsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                documentId={selectedItemId}
                documentTitle={selectedItemTitle}
            />
        </>
    );
}
