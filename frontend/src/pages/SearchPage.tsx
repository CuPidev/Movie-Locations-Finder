import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";

import { Box, Button, Input, Select, VStack, HStack, Heading, Text } from "@chakra-ui/react";
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
        // Filter results that belong to the selected cluster
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
        setSelectedCluster(null); // Reset filter on new search
        try {
            const res = await fetch(
                `/api/search?q=${encodeURIComponent(tq)}&k=${encodeURIComponent(
                    k
                )}`
            );
            if (!res.ok) {
                setResults([]);
                setClusters([]);
                return;
            }
            const data = await res.json();
            // API returns {results: [...], clusters: [...]}
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
        <Box p={5} maxW="800px" mx="auto">
            <VStack spacing={4} align="stretch">
                <Heading as="h1" size="lg" textAlign="center" mb={4}>
                    Movie Locations Search
                </Heading>

                <HStack>
                    <Input
                        placeholder="Search for movies, locations..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") doSearch();
                        }}
                    />
                    <Select
                        width="80px"
                        value={k}
                        onChange={(e) => setK(e.target.value)}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </Select>
                    <Button onClick={doSearch} isLoading={loading} colorScheme="blue">
                        Search
                    </Button>
                </HStack>

                {q && (
                    <Box display="flex" justifyContent="flex-end">
                        <Link to={`/browse?shuffle=1`}>
                            <Button variant="link" size="sm">
                                Browse random
                            </Button>
                        </Link>
                    </Box>
                )}

                <ClustersList
                    clusters={clusters}
                    selectedCluster={selectedCluster}
                    onSelectCluster={handleClusterSelect}
                />

                <Box>
                    {loading && <Text>Loading...</Text>}

                    {!loading && activeResults.length === 0 && results.length > 0 && (
                        <Text>No results in this topic.</Text>
                    )}

                    {!loading && activeResults.length > 0 && (
                        <VStack spacing={4} align="stretch">
                            {activeResults.map((r: any, i: number) => (
                                <ResultsCard
                                    key={r.id || i}
                                    item={r}
                                    query={q}
                                    clusters={docClusterMap[r.id]}
                                    onFindSimilar={handleFindSimilar}
                                />
                            ))}
                        </VStack>
                    )}

                    {!loading && results.length === 0 && q && <Text>No results found.</Text>}
                </Box>
            </VStack>

            <SimilarDocumentsModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                documentId={selectedItemId}
                documentTitle={selectedItemTitle}
            />
        </Box>
    );
}
