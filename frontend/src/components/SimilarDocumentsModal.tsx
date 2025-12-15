import {
    Box,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Spinner,
    Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
            <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
            <ModalContent
                bg="var(--card-bg)"
                borderColor="var(--card-border)"
                maxH="80vh"
            >
                <ModalHeader
                    borderBottom="1px solid"
                    borderColor="var(--card-border)"
                    color="var(--text)"
                >
                    <Box>
                        <Text fontSize="lg" fontWeight="bold">
                            🔍 Similar Documents
                        </Text>
                        {documentTitle && (
                            <Text
                                fontSize="sm"
                                color="var(--muted)"
                                fontWeight="normal"
                                mt={1}
                            >
                                Similar to: {documentTitle}
                            </Text>
                        )}
                    </Box>
                </ModalHeader>
                <ModalCloseButton color="var(--text)" />
                <ModalBody py={4}>
                    {loading && (
                        <Box
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            py={8}
                        >
                            <Spinner
                                size="lg"
                                color="var(--accent)"
                                thickness="3px"
                            />
                            <Text ml={3} color="var(--muted)">
                                Finding similar documents...
                            </Text>
                        </Box>
                    )}

                    {error && !loading && (
                        <Box
                            p={4}
                            bg="red.50"
                            borderRadius="md"
                            color="red.600"
                            textAlign="center"
                        >
                            <Text fontWeight="medium">⚠️ {error}</Text>
                            <Text fontSize="sm" mt={1}>
                                Please try again later or ensure the server is running.
                            </Text>
                        </Box>
                    )}

                    {!loading && !error && results.length === 0 && (
                        <Box textAlign="center" py={6} color="var(--muted)">
                            <Text>No similar documents found.</Text>
                        </Box>
                    )}

                    {!loading && !error && results.length > 0 && (
                        <Box>
                            <Text
                                fontSize="sm"
                                color="var(--muted)"
                                mb={3}
                            >
                                Found {results.length} similar document
                                {results.length !== 1 ? "s" : ""}
                            </Text>
                            {results.map((item, i) => (
                                <ResultsCard
                                    key={item.id || i}
                                    item={item}
                                    maxLen={300}
                                />
                            ))}
                        </Box>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
