import { Box, Button, Select } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import ResultsCard from "../components/ResultsCard";

function qs(key: string, fallback?: string) {
    const params = new URLSearchParams(location.search);
    return params.has(key) ? params.get(key) : fallback;
}

const MIN_SHOW_MORE_CHARS = 220;

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
        <Box>
            <Helmet>
                <title>Heritage Sites Finder - Browse</title>
                <meta
                    name="description"
                    content="Browse UNESCO World Heritage sites"
                />
            </Helmet>
            <Box mb={3}>
                <Link to="/">
                    <Button
                        variant="outline"
                        leftIcon={<span>&larr;</span>}
                        size="sm"
                    >
                        Back
                    </Button>
                </Link>
            </Box>
            <Box
                id="controls"
                display="flex"
                alignItems="center"
                gap={3}
                mb={4}
            >
                <Box as="label" fontSize="sm" mr={2} color="gray.500">
                    Per page:
                </Box>
                <Select
                    value={String(limit)}
                    onChange={(e) =>
                        onLimitChange(parseInt(e.target.value, 10) || limit)
                    }
                    width="80px"
                >
                    {[10, 20, 50, 100].map((n) => (
                        <option key={n} value={String(n)}>
                            {n}
                        </option>
                    ))}
                </Select>
                <Button
                    ml={3}
                    onClick={toggleShuffle}
                    aria-pressed={shuffleMode}
                    variant={shuffleMode ? undefined : "outline"}
                >
                    {shuffleMode ? "Shuffle: ON" : "Shuffle: OFF"}
                </Button>
            </Box>
            <Box id="list">
                {loading && <Box>Loading…</Box>}
                {!loading && items.length === 0 && <Box>No items</Box>}
                {items.map((it, i) => (
                    <ResultsCard key={i} item={it} query={q} maxLen={400} />
                ))}
            </Box>
            <Box
                id="pager"
                mt={4}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
            >
                <Box fontSize="sm" color="gray.500">
                    Showing {Math.min(total, offset + 1)}-
                    {Math.min(total, offset + limit)} of {total}
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        onClick={() => {
                            const n = Math.max(0, offset - limit);
                            setOffset(n);
                            loadPage(n);
                        }}
                        disabled={offset === 0}
                        variant="outline"
                    >
                        Prev
                    </Button>
                    <Button
                        onClick={() => {
                            const n = offset + limit;
                            if (n < total) {
                                setOffset(n);
                                loadPage(n);
                            }
                        }}
                        disabled={offset + limit >= total}
                        variant="outline"
                    >
                        Next
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
