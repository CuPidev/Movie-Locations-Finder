import { Box, Wrap, WrapItem, Tag, TagLabel, Text } from "@chakra-ui/react";

interface Cluster {
    labels: string[];
    docs: string[];
}

interface ClustersListProps {
    clusters: Cluster[];
    selectedCluster: string | null;
    onSelectCluster: (clusterLabel: string) => void;
}

export default function ClustersList({ clusters, selectedCluster, onSelectCluster }: ClustersListProps) {
    if (!clusters || clusters.length === 0) return null;

    return (
        <Box mb={4} p={3} bg="var(--card-bg)" borderRadius="md" borderWidth="1px" borderColor="var(--card-border)">
            <Text fontSize="sm" fontWeight="bold" mb={2} color="var(--text)">
                Topics found (click to filter):
            </Text>
            <Wrap spacing={2}>
                {clusters.map((cluster, idx) => {
                    const label = cluster.labels.join(", ");
                    const isSelected = selectedCluster === label;
                    return (
                        <WrapItem key={idx}>
                            <Tag
                                size="md"
                                variant={isSelected ? "solid" : "subtle"}
                                colorScheme={isSelected ? "teal" : "gray"}
                                cursor="pointer"
                                onClick={() => onSelectCluster(label)}
                                _hover={{ opacity: 0.8 }}
                            >
                                <TagLabel>{label}</TagLabel>
                            </Tag>
                        </WrapItem>
                    );
                })}
            </Wrap>
        </Box>
    );
}
